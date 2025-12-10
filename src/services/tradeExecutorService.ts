import axios from 'axios';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { SnipePresetConfig } from './sniperBotService';
import { rpcService } from './rpcService';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

interface SwapResult {
  success: boolean;
  txSignature?: string;
  error?: string;
  inputAmount: string;
  outputAmount?: string;
  priceImpact?: string;
}

interface QuoteWithFee extends JupiterQuote {
  estimatedPriorityFee: number;
  feeLevel: string;
}

class TradeExecutorService {
  async getSwapQuote(
    inputMint: string,
    outputMint: string,
    amountLamports: string,
    slippageBps: number = 500
  ): Promise<JupiterQuote | null> {
    try {
      const response = await axios.get(`${JUPITER_API}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amountLamports,
          slippageBps,
          swapMode: 'ExactIn',
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      console.error('[TradeExecutor] Quote error:', error.message);
      return null;
    }
  }

  async getBuyQuote(
    tokenMint: string,
    solAmount: number,
    slippagePercent: number = 5
  ): Promise<JupiterQuote | null> {
    const lamports = Math.floor(solAmount * 1e9).toString();
    const slippageBps = Math.floor(slippagePercent * 100);
    
    return this.getSwapQuote(SOL_MINT, tokenMint, lamports, slippageBps);
  }

  async getSellQuote(
    tokenMint: string,
    tokenAmount: string,
    slippagePercent: number = 5
  ): Promise<JupiterQuote | null> {
    const slippageBps = Math.floor(slippagePercent * 100);
    
    return this.getSwapQuote(tokenMint, SOL_MINT, tokenAmount, slippageBps);
  }

  async getBuyQuoteWithFee(
    tokenMint: string,
    solAmount: number,
    slippagePercent: number = 5,
    priorityLevel: 'min' | 'low' | 'medium' | 'high' | 'veryHigh' | 'auto' = 'auto'
  ): Promise<QuoteWithFee | null> {
    const quote = await this.getBuyQuote(tokenMint, solAmount, slippagePercent);
    if (!quote) return null;

    const priorityFee = await rpcService.getOptimalPriorityFee(priorityLevel, [
      SOL_MINT,
      tokenMint,
    ]);

    return {
      ...quote,
      estimatedPriorityFee: priorityFee,
      feeLevel: priorityLevel,
    };
  }

  async buildSwapTransaction(
    quote: JupiterQuote,
    userPublicKey: string,
    priorityLevel: 'min' | 'low' | 'medium' | 'high' | 'veryHigh' | 'auto' = 'auto'
  ): Promise<{ transaction: string; lastValidBlockHeight: number; priorityFee: number } | null> {
    try {
      const priorityFee = await rpcService.getOptimalPriorityFee(priorityLevel, [
        quote.inputMint,
        quote.outputMint,
      ]);

      console.log(`[TradeExecutor] Building swap with priority fee: ${priorityFee} microLamports`);

      const response = await axios.post(
        `${JUPITER_API}/swap`,
        {
          quoteResponse: quote,
          userPublicKey,
          wrapAndUnwrapSol: true,
          computeUnitPriceMicroLamports: priorityFee,
          dynamicComputeUnitLimit: true,
        },
        { timeout: 15000 }
      );

      return {
        transaction: response.data.swapTransaction,
        lastValidBlockHeight: response.data.lastValidBlockHeight,
        priorityFee,
      };
    } catch (error: any) {
      console.error('[TradeExecutor] Build swap error:', error.message);
      return null;
    }
  }

  async buildSwapTransactionWithRetry(
    quote: JupiterQuote,
    userPublicKey: string,
    maxAttempts: number = 3
  ): Promise<{ transaction: string; lastValidBlockHeight: number; priorityFee: number; attempt: number } | null> {
    const feeProgression: Array<'medium' | 'high' | 'veryHigh'> = ['medium', 'high', 'veryHigh'];

    for (let attempt = 0; attempt < Math.min(maxAttempts, feeProgression.length); attempt++) {
      const result = await this.buildSwapTransaction(quote, userPublicKey, feeProgression[attempt]);
      
      if (result) {
        return { ...result, attempt: attempt + 1 };
      }

      console.log(`[TradeExecutor] Build attempt ${attempt + 1} failed, trying higher fee...`);
    }

    return null;
  }

  async executeSwap(signedTransaction: string): Promise<SwapResult> {
    const result = await rpcService.sendTransaction(signedTransaction, {
      maxRetries: 3,
      skipPreflight: false,
      commitment: 'confirmed',
    });

    if (result.success) {
      return {
        success: true,
        txSignature: result.signature,
        inputAmount: '0',
      };
    }

    return {
      success: false,
      error: result.error,
      inputAmount: '0',
    };
  }

  async executeSwapWithRetry(
    signedTransaction: string,
    quote: JupiterQuote,
    userPublicKey: string
  ): Promise<SwapResult & { retryTransaction?: string; retryPriorityFee?: number }> {
    const firstAttempt = await this.executeSwap(signedTransaction);
    
    if (firstAttempt.success) {
      return firstAttempt;
    }

    console.log('[TradeExecutor] First attempt failed, rebuilding with higher fee for retry...');

    const newTx = await this.buildSwapTransaction(quote, userPublicKey, 'high');
    
    if (!newTx) {
      return {
        ...firstAttempt,
        error: `${firstAttempt.error} (retry build failed)`,
      };
    }

    return {
      ...firstAttempt,
      retryTransaction: newTx.transaction,
      retryPriorityFee: newTx.priorityFee,
      error: `${firstAttempt.error} - retry transaction built with higher fee (${newTx.priorityFee} microLamports). Sign and submit retryTransaction to retry.`,
    };
  }

  async prepareRetryTransaction(
    quote: JupiterQuote,
    userPublicKey: string,
    previousFeeLevel: 'medium' | 'high' | 'veryHigh' = 'medium'
  ): Promise<{ transaction: string; priorityFee: number; feeLevel: string } | null> {
    const feeProgression: Array<'medium' | 'high' | 'veryHigh'> = ['medium', 'high', 'veryHigh'];
    const currentIndex = feeProgression.indexOf(previousFeeLevel);
    const nextLevel = feeProgression[Math.min(currentIndex + 1, feeProgression.length - 1)];
    
    const result = await this.buildSwapTransaction(quote, userPublicKey, nextLevel);
    
    if (!result) return null;
    
    return {
      transaction: result.transaction,
      priorityFee: result.priorityFee,
      feeLevel: nextLevel,
    };
  }

  async checkTokenPrice(tokenMint: string): Promise<{
    priceUsd: number;
    priceSol: number;
  } | null> {
    try {
      const quote = await this.getSwapQuote(
        tokenMint,
        SOL_MINT,
        '1000000000',
        50
      );

      if (!quote) return null;

      const tokensIn = parseFloat(quote.inAmount);
      const solOut = parseFloat(quote.outAmount) / 1e9;
      const priceSol = solOut / tokensIn;
      
      const solPrice = await this.getSolPrice();
      const priceUsd = priceSol * solPrice;

      return { priceUsd, priceSol };
    } catch (error) {
      console.error('[TradeExecutor] Price check error:', error);
      return null;
    }
  }

  async getSolPrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        { timeout: 5000 }
      );
      return response.data?.solana?.usd || 0;
    } catch {
      return 0;
    }
  }

  shouldTriggerExit(
    entryPriceSol: number,
    currentPriceSol: number,
    config: SnipePresetConfig
  ): { trigger: boolean; reason: 'take_profit' | 'stop_loss' | 'trailing_stop' | null } {
    const changePercent = ((currentPriceSol - entryPriceSol) / entryPriceSol) * 100;

    if (changePercent >= config.tradeControls.takeProfitPercent) {
      return { trigger: true, reason: 'take_profit' };
    }

    if (changePercent <= -config.tradeControls.stopLossPercent) {
      return { trigger: true, reason: 'stop_loss' };
    }

    return { trigger: false, reason: null };
  }

  async getWalletSolBalance(walletAddress: string): Promise<number> {
    return rpcService.getBalance(walletAddress);
  }

  async getWalletTokenBalance(
    walletAddress: string,
    tokenMint: string
  ): Promise<{ amount: string; decimals: number } | null> {
    try {
      const connection = rpcService.getActiveConnection();
      const walletPubkey = new PublicKey(walletAddress);
      const mintPubkey = new PublicKey(tokenMint);

      const accounts = await connection.getParsedTokenAccountsByOwner(
        walletPubkey,
        { mint: mintPubkey }
      );

      if (accounts.value.length === 0) return null;

      const account = accounts.value[0].account.data.parsed.info;
      return {
        amount: account.tokenAmount.amount,
        decimals: account.tokenAmount.decimals,
      };
    } catch (error) {
      console.error('[TradeExecutor] Token balance error:', error);
      return null;
    }
  }

  async simulateBuy(
    tokenMint: string,
    solAmount: number,
    slippagePercent: number
  ): Promise<{
    success: boolean;
    expectedTokens: string;
    priceImpact: string;
    estimatedPriorityFee?: number;
    error?: string;
  }> {
    const quote = await this.getBuyQuoteWithFee(tokenMint, solAmount, slippagePercent, 'auto');
    
    if (!quote) {
      return {
        success: false,
        expectedTokens: '0',
        priceImpact: '0',
        error: 'Failed to get quote',
      };
    }

    return {
      success: true,
      expectedTokens: quote.outAmount,
      priceImpact: quote.priceImpactPct,
      estimatedPriorityFee: quote.estimatedPriorityFee,
    };
  }

  async simulateSell(
    tokenMint: string,
    tokenAmount: string,
    slippagePercent: number
  ): Promise<{
    success: boolean;
    expectedSol: string;
    priceImpact: string;
    error?: string;
  }> {
    const quote = await this.getSellQuote(tokenMint, tokenAmount, slippagePercent);
    
    if (!quote) {
      return {
        success: false,
        expectedSol: '0',
        priceImpact: '0',
        error: 'Failed to get quote',
      };
    }

    return {
      success: true,
      expectedSol: (parseFloat(quote.outAmount) / 1e9).toFixed(6),
      priceImpact: quote.priceImpactPct,
    };
  }

  async getTransactionFeeEstimate(
    tokenMint: string,
    priorityLevel: 'min' | 'low' | 'medium' | 'high' | 'veryHigh' | 'auto' = 'auto'
  ): Promise<{
    priorityFee: number;
    priorityFeeSol: number;
    estimatedTotalFee: number;
    level: string;
  }> {
    const priorityFee = await rpcService.getOptimalPriorityFee(priorityLevel, [
      SOL_MINT,
      tokenMint,
    ]);

    const baseFee = 5000;
    const computeUnits = 200000;
    
    const priorityFeeLamports = (priorityFee * computeUnits) / 1_000_000;
    const totalFeeLamports = baseFee + priorityFeeLamports;

    return {
      priorityFee,
      priorityFeeSol: priorityFeeLamports / 1e9,
      estimatedTotalFee: totalFeeLamports / 1e9,
      level: priorityLevel,
    };
  }
}

export const tradeExecutorService = new TradeExecutorService();
