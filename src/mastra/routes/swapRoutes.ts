import { Connection, VersionedTransaction } from '@solana/web3.js';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const SOLANA_RPC = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

export const swapRoutes = [
  {
    path: "/api/swap/tokens",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        logger?.info('🔄 [Swap] Fetching token list from Jupiter');
        
        const response = await fetch('https://token.jup.ag/all');
        if (!response.ok) {
          throw new Error(`Jupiter token API error: ${response.status}`);
        }
        
        const allTokens = await response.json();
        
        const sortedTokens = allTokens
          .filter((token: any) => token.address && token.symbol && token.name)
          .sort((a: any, b: any) => (b.daily_volume || 0) - (a.daily_volume || 0))
          .slice(0, 50)
          .map((token: any) => ({
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            logoURI: token.logoURI || null
          }));
        
        logger?.info('✅ [Swap] Token list fetched', { count: sortedTokens.length });
        
        return c.json({
          success: true,
          tokens: sortedTokens
        });
      } catch (error: any) {
        logger?.error('❌ [Swap] Token list error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/swap/quote",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const inputMint = c.req.query('inputMint');
        const outputMint = c.req.query('outputMint');
        const amount = c.req.query('amount');
        const slippageBps = c.req.query('slippageBps') || '50';
        
        if (!inputMint || !outputMint || !amount) {
          return c.json({ 
            error: 'Missing required parameters: inputMint, outputMint, amount' 
          }, 400);
        }
        
        logger?.info('🔄 [Swap] Getting quote from Jupiter', { 
          inputMint, 
          outputMint, 
          amount, 
          slippageBps 
        });
        
        const quoteUrl = new URL('https://quote-api.jup.ag/v6/quote');
        quoteUrl.searchParams.set('inputMint', inputMint);
        quoteUrl.searchParams.set('outputMint', outputMint);
        quoteUrl.searchParams.set('amount', amount);
        quoteUrl.searchParams.set('slippageBps', slippageBps);
        
        const response = await fetch(quoteUrl.toString());
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Jupiter quote API error: ${response.status} - ${errorText}`);
        }
        
        const quoteResponse = await response.json();
        
        logger?.info('✅ [Swap] Quote received', { 
          inputAmount: quoteResponse.inAmount,
          outputAmount: quoteResponse.outAmount,
          priceImpactPct: quoteResponse.priceImpactPct
        });
        
        return c.json({
          success: true,
          inputAmount: quoteResponse.inAmount,
          outputAmount: quoteResponse.outAmount,
          priceImpactPct: quoteResponse.priceImpactPct,
          routePlan: quoteResponse.routePlan,
          quoteResponse
        });
      } catch (error: any) {
        logger?.error('❌ [Swap] Quote error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/swap/prepare",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { quoteResponse, userPublicKey } = await c.req.json();
        
        if (!quoteResponse) {
          return c.json({ error: 'quoteResponse is required' }, 400);
        }
        
        if (!userPublicKey) {
          return c.json({ error: 'userPublicKey is required' }, 400);
        }
        
        logger?.info('🔄 [Swap] Preparing swap transaction (non-custodial)', { 
          userPublicKey,
          inputMint: quoteResponse.inputMint,
          outputMint: quoteResponse.outputMint
        });
        
        const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteResponse,
            userPublicKey,
            wrapAndUnwrapSol: true,
            dynamicComputeUnitLimit: true,
            prioritizationFeeLamports: 'auto'
          })
        });
        
        if (!swapResponse.ok) {
          const errorText = await swapResponse.text();
          throw new Error(`Jupiter swap API error: ${swapResponse.status} - ${errorText}`);
        }
        
        const { swapTransaction } = await swapResponse.json();
        
        logger?.info('✅ [Swap] Transaction prepared - ready for client-side signing');
        
        return c.json({
          success: true,
          swapTransaction,
          message: 'Sign this transaction client-side, then call /api/swap/broadcast'
        });
      } catch (error: any) {
        logger?.error('❌ [Swap] Prepare error', { error: error.message });
        return c.json({ 
          success: false, 
          error: error.message 
        }, 500);
      }
    }
  },

  {
    path: "/api/swap/broadcast",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { signedTransaction } = await c.req.json();
        
        if (!signedTransaction) {
          return c.json({ error: 'signedTransaction (base64) is required' }, 400);
        }
        
        logger?.info('🔄 [Swap] Broadcasting signed transaction');
        
        const transactionBuf = Buffer.from(signedTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(transactionBuf);
        
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        
        const rawTransaction = transaction.serialize();
        const txHash = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          maxRetries: 2
        });
        
        await connection.confirmTransaction(txHash, 'confirmed');
        
        const explorerUrl = `https://solscan.io/tx/${txHash}`;
        
        logger?.info('✅ [Swap] Transaction successful', { txHash, explorerUrl });
        
        return c.json({
          success: true,
          txHash,
          explorerUrl
        });
      } catch (error: any) {
        logger?.error('❌ [Swap] Broadcast error', { error: error.message });
        return c.json({ 
          success: false, 
          error: error.message 
        }, 500);
      }
    }
  }
];
