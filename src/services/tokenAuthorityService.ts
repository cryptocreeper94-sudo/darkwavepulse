import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

interface TokenAuthorities {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  updateAuthority: string | null;
  isMutable: boolean;
}

interface AuthoritySafetyResult {
  isSafe: boolean;
  risks: string[];
  warnings: string[];
  authorities: TokenAuthorities;
  isPumpFun: boolean;
}

interface LiquidityLockInfo {
  isLocked: boolean;
  isBurned: boolean;
  lockPercentage: number;
  unlockDate: Date | null;
  lockerName: string | null;
  notChecked?: boolean;
}

const PUMP_FUN_AUTHORITY = 'TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM';
const KNOWN_LOCKERS = [
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
];

class TokenAuthorityService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(HELIUS_RPC, 'confirmed');
  }

  async checkTokenAuthorities(tokenAddress: string): Promise<AuthoritySafetyResult> {
    const risks: string[] = [];
    const warnings: string[] = [];
    let authorities: TokenAuthorities = {
      mintAuthority: null,
      freezeAuthority: null,
      updateAuthority: null,
      isMutable: false
    };
    let isPumpFun = false;

    try {
      const [mintAccountData, assetResponse] = await Promise.all([
        this.checkMintAccount(tokenAddress),
        axios.post(
          HELIUS_RPC,
          {
            jsonrpc: '2.0',
            id: 'token-auth-check',
            method: 'getAsset',
            params: { id: tokenAddress }
          },
          { timeout: 10000 }
        )
      ]);

      const asset = assetResponse.data?.result;
      
      authorities.mintAuthority = mintAccountData.mintAuthority;
      authorities.freezeAuthority = mintAccountData.freezeAuthority;
      
      if (asset) {
        const authority = asset.authorities?.[0] || {};
        authorities.updateAuthority = authority.address || null;
        authorities.isMutable = asset.mutable === true;
        
        if (authorities.updateAuthority === PUMP_FUN_AUTHORITY) {
          isPumpFun = true;
        }
      }

      if (isPumpFun) {
        return { isSafe: true, risks: [], warnings: ['Pump.fun token - authorities managed by protocol'], authorities, isPumpFun };
      }

      const hasMintAuthority = authorities.mintAuthority && 
        authorities.mintAuthority !== 'UNKNOWN' && 
        authorities.mintAuthority !== null;
      
      const hasFreezeAuthority = authorities.freezeAuthority && 
        authorities.freezeAuthority !== 'UNKNOWN' && 
        authorities.freezeAuthority !== null;

      if (hasMintAuthority) {
        risks.push('MINT AUTHORITY ACTIVE - Dev can create unlimited tokens');
      }

      if (hasFreezeAuthority) {
        risks.push('FREEZE AUTHORITY ACTIVE - Dev can freeze your tokens');
      }

      if (authorities.isMutable) {
        warnings.push('Metadata is mutable - token info can be changed');
      }

    } catch (error) {
      console.error('[TokenAuthority] Check error:', error);
      warnings.push('Authority check failed - proceed with caution');
    }

    const isSafe = risks.length === 0;
    return { isSafe, risks, warnings, authorities, isPumpFun };
  }

  async checkMintAccount(tokenAddress: string): Promise<{
    mintAuthority: string | null;
    freezeAuthority: string | null;
    supply: string;
    decimals: number;
  }> {
    try {
      const mintPubkey = new PublicKey(tokenAddress);
      const accountInfo = await this.connection.getParsedAccountInfo(mintPubkey);
      
      if (!accountInfo.value) {
        throw new Error('Mint account not found');
      }

      const parsedData = (accountInfo.value.data as any)?.parsed?.info;
      if (!parsedData) {
        throw new Error('Could not parse mint data');
      }

      return {
        mintAuthority: parsedData.mintAuthority || null,
        freezeAuthority: parsedData.freezeAuthority || null,
        supply: parsedData.supply || '0',
        decimals: parsedData.decimals || 0
      };
    } catch (error) {
      console.error('[TokenAuthority] Mint check error:', error);
      return {
        mintAuthority: 'UNKNOWN',
        freezeAuthority: 'UNKNOWN',
        supply: '0',
        decimals: 0
      };
    }
  }

  async checkLiquidityLock(pairAddress: string): Promise<LiquidityLockInfo> {
    try {
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`,
        { timeout: 10000 }
      );

      const pair = response.data?.pair;
      if (!pair) {
        return {
          isLocked: false,
          isBurned: false,
          lockPercentage: 0,
          unlockDate: null,
          lockerName: null
        };
      }

      const lpBurned = pair.liquidity?.lpBurned || false;
      
      if (lpBurned) {
        return {
          isLocked: true,
          isBurned: true,
          lockPercentage: 100,
          unlockDate: null,
          lockerName: 'BURNED'
        };
      }

      return {
        isLocked: false,
        isBurned: false,
        lockPercentage: 0,
        unlockDate: null,
        lockerName: null
      };
    } catch (error) {
      console.error('[TokenAuthority] Liquidity check error:', error);
      return {
        isLocked: false,
        isBurned: false,
        lockPercentage: 0,
        unlockDate: null,
        lockerName: null
      };
    }
  }

  async simulateHoneypot(tokenAddress: string, amountSol: number = 0.01): Promise<{
    canBuy: boolean;
    canSell: boolean;
    buyTax: number;
    sellTax: number;
    isHoneypot: boolean;
    error?: string;
  }> {
    try {
      const jupiterQuoteUrl = 'https://quote-api.jup.ag/v6/quote';
      const SOL_MINT = 'So11111111111111111111111111111111111111112';
      const amountLamports = Math.floor(amountSol * 1e9);

      const buyQuote = await axios.get(jupiterQuoteUrl, {
        params: {
          inputMint: SOL_MINT,
          outputMint: tokenAddress,
          amount: amountLamports,
          slippageBps: 5000
        },
        timeout: 10000
      });

      const canBuy = buyQuote.data?.outAmount > 0;
      const buyTax = buyQuote.data?.priceImpactPct ? parseFloat(buyQuote.data.priceImpactPct) : 0;

      if (!canBuy) {
        return {
          canBuy: false,
          canSell: false,
          buyTax: 100,
          sellTax: 100,
          isHoneypot: true,
          error: 'Cannot buy token'
        };
      }

      const tokensReceived = buyQuote.data.outAmount;

      const sellQuote = await axios.get(jupiterQuoteUrl, {
        params: {
          inputMint: tokenAddress,
          outputMint: SOL_MINT,
          amount: tokensReceived,
          slippageBps: 5000
        },
        timeout: 10000
      });

      const canSell = sellQuote.data?.outAmount > 0;
      const sellTax = sellQuote.data?.priceImpactPct ? parseFloat(sellQuote.data.priceImpactPct) : 0;

      if (!canSell) {
        return {
          canBuy: true,
          canSell: false,
          buyTax,
          sellTax: 100,
          isHoneypot: true,
          error: 'Cannot sell token - HONEYPOT DETECTED'
        };
      }

      const roundTripLoss = ((amountLamports - parseFloat(sellQuote.data.outAmount)) / amountLamports) * 100;
      const isHoneypot = roundTripLoss > 50 || sellTax > 30;

      return {
        canBuy: true,
        canSell: true,
        buyTax,
        sellTax,
        isHoneypot,
        error: isHoneypot ? `High round-trip loss: ${roundTripLoss.toFixed(1)}%` : undefined
      };

    } catch (error: any) {
      console.error('[TokenAuthority] Honeypot simulation error:', error);
      return {
        canBuy: false,
        canSell: false,
        buyTax: 0,
        sellTax: 0,
        isHoneypot: true,
        error: error.message || 'Simulation failed'
      };
    }
  }

  async getComprehensiveSafetyCheck(tokenAddress: string, pairAddress?: string): Promise<{
    overallSafe: boolean;
    riskScore: number;
    authorities: AuthoritySafetyResult;
    liquidity: LiquidityLockInfo;
    honeypot: { canBuy: boolean; canSell: boolean; isHoneypot: boolean };
    allRisks: string[];
    allWarnings: string[];
  }> {
    const [authorities, liquidity, honeypot] = await Promise.all([
      this.checkTokenAuthorities(tokenAddress),
      pairAddress ? this.checkLiquidityLock(pairAddress) : Promise.resolve({
        isLocked: false,
        isBurned: false,
        lockPercentage: 0,
        unlockDate: null,
        lockerName: null,
        notChecked: true
      }),
      this.simulateHoneypot(tokenAddress)
    ]);

    const allRisks: string[] = [...authorities.risks];
    const allWarnings: string[] = [...authorities.warnings];

    if (honeypot.isHoneypot) {
      allRisks.push('HONEYPOT DETECTED - Cannot sell tokens');
    }

    const liquidityNotChecked = liquidity.notChecked === true;
    
    if (!liquidityNotChecked && !liquidity.isLocked && !liquidity.isBurned && !authorities.isPumpFun) {
      allRisks.push('LIQUIDITY NOT LOCKED - Dev can pull liquidity');
    } else if (liquidityNotChecked && !authorities.isPumpFun) {
      allWarnings.push('Liquidity lock status unknown - no pair address provided');
    }

    let riskScore = 100;
    riskScore -= allRisks.length * 30;
    riskScore -= allWarnings.length * 10;
    riskScore = Math.max(0, Math.min(100, riskScore));

    const overallSafe = allRisks.length === 0 && !honeypot.isHoneypot;

    return {
      overallSafe,
      riskScore,
      authorities,
      liquidity,
      honeypot: {
        canBuy: honeypot.canBuy,
        canSell: honeypot.canSell,
        isHoneypot: honeypot.isHoneypot
      },
      allRisks,
      allWarnings
    };
  }
}

export const tokenAuthorityService = new TokenAuthorityService();
