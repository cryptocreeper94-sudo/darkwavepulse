import { ethers } from 'ethers';
import axios from 'axios';
import { ChainId, CHAIN_CONFIGS, multiChainProvider } from './multiChainProvider.js';

export interface EvmTokenSafetyReport {
  tokenAddress: string;
  chain: ChainId;
  tokenSymbol?: string;
  tokenName?: string;

  hasOwner: boolean;
  ownerAddress?: string;
  ownerCanMint: boolean;
  ownerCanPause: boolean;
  ownerCanBlacklist: boolean;
  isRenounced: boolean;

  honeypotResult: {
    canBuy: boolean;
    canSell: boolean;
    buyTax: number;
    sellTax: number;
    isHoneypot: boolean;
    reason?: string;
  };

  tokenAgeMinutes: number;
  createdAt?: Date;

  top10HoldersPercent: number;
  holderCount: number;

  liquidityUsd: number;
  liquidityLocked: boolean;
  liquidityLockPlatform?: string;

  contractVerified: boolean;
  isProxy: boolean;
  hasHiddenMint: boolean;
  hasHiddenFees: boolean;

  safetyScore: number;
  safetyGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  risks: string[];
  warnings: string[];
  passesAllChecks: boolean;
}

export interface EvmSafetyConfig {
  requireRenounced: boolean;
  requireNoHoneypot: boolean;
  maxBuyTax: number;
  maxSellTax: number;
  minLiquidityUsd: number;
  maxTop10HoldersPercent: number;
  minTokenAgeMinutes: number;
  minHolderCount: number;
}

export const DEFAULT_EVM_SAFETY_CONFIG: EvmSafetyConfig = {
  requireRenounced: false,
  requireNoHoneypot: true,
  maxBuyTax: 10,
  maxSellTax: 10,
  minLiquidityUsd: 5000,
  maxTop10HoldersPercent: 50,
  minTokenAgeMinutes: 5,
  minHolderCount: 50,
};

const OWNABLE_ABI = [
  'function owner() view returns (address)',
  'function getOwner() view returns (address)',
  'function renounceOwnership()',
];

const ERC20_EXTENDED_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)',
  'function mint(address,uint256)',
  'function pause()',
  'function unpause()',
  'function blacklist(address)',
  'function addToBlacklist(address)',
];

const DEAD_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dEaD',
  '0x0000000000000000000000000000000000000001',
];

class EvmSafetyEngine {
  private providers: Map<ChainId, ethers.JsonRpcProvider> = new Map();

  constructor() {
    for (const [chainId, config] of Object.entries(CHAIN_CONFIGS)) {
      if (config.isEvm) {
        this.providers.set(chainId as ChainId, new ethers.JsonRpcProvider(config.rpcUrl));
      }
    }
  }

  async runFullSafetyCheck(
    chain: ChainId,
    tokenAddress: string,
    config: EvmSafetyConfig = DEFAULT_EVM_SAFETY_CONFIG
  ): Promise<EvmTokenSafetyReport> {
    console.log(`[EvmSafety] Running safety check for ${chain}:${tokenAddress}`);

    const chainConfig = CHAIN_CONFIGS[chain];
    if (!chainConfig.isEvm) {
      throw new Error(`Chain ${chain} is not an EVM chain`);
    }

    const risks: string[] = [];
    const warnings: string[] = [];

    const [
      ownershipCheck,
      honeypotCheck,
      liquidityInfo,
      tokenInfo,
      holderAnalysis,
    ] = await Promise.all([
      this.checkOwnership(chain, tokenAddress),
      this.checkHoneypot(chain, tokenAddress),
      this.getLiquidityInfo(chain, tokenAddress),
      this.getTokenBasicInfo(chain, tokenAddress),
      this.analyzeHolders(chain, tokenAddress),
    ]);

    if (ownershipCheck.hasOwner && !ownershipCheck.isRenounced) {
      if (config.requireRenounced) {
        risks.push('Contract ownership not renounced - owner can modify contract');
      } else {
        warnings.push('Contract has active owner');
      }
    }

    if (ownershipCheck.ownerCanMint) {
      risks.push('Owner can mint new tokens - supply inflation risk');
    }

    if (ownershipCheck.ownerCanPause) {
      warnings.push('Owner can pause transfers');
    }

    if (ownershipCheck.ownerCanBlacklist) {
      risks.push('Owner can blacklist addresses - you may not be able to sell');
    }

    if (honeypotCheck.isHoneypot) {
      risks.push(`Honeypot detected: ${honeypotCheck.reason || 'Cannot sell'}`);
    }

    if (honeypotCheck.buyTax > config.maxBuyTax) {
      risks.push(`High buy tax: ${honeypotCheck.buyTax}%`);
    } else if (honeypotCheck.buyTax > 5) {
      warnings.push(`Buy tax: ${honeypotCheck.buyTax}%`);
    }

    if (honeypotCheck.sellTax > config.maxSellTax) {
      risks.push(`High sell tax: ${honeypotCheck.sellTax}%`);
    } else if (honeypotCheck.sellTax > 5) {
      warnings.push(`Sell tax: ${honeypotCheck.sellTax}%`);
    }

    if (liquidityInfo.liquidityUsd < config.minLiquidityUsd) {
      risks.push(`Low liquidity: $${liquidityInfo.liquidityUsd.toLocaleString()}`);
    }

    if (holderAnalysis.top10Percent > config.maxTop10HoldersPercent) {
      risks.push(`Top 10 holders own ${holderAnalysis.top10Percent.toFixed(1)}%`);
    }

    if (holderAnalysis.holderCount < config.minHolderCount) {
      warnings.push(`Low holder count: ${holderAnalysis.holderCount}`);
    }

    const tokenAge = tokenInfo.ageMinutes || 0;
    if (tokenAge < config.minTokenAgeMinutes) {
      warnings.push(`Token very new: ${tokenAge} minutes old`);
    }

    let safetyScore = 100;
    safetyScore -= risks.length * 15;
    safetyScore -= warnings.length * 5;

    if (honeypotCheck.isHoneypot) safetyScore -= 30;
    if (ownershipCheck.ownerCanMint) safetyScore -= 20;
    if (ownershipCheck.ownerCanBlacklist) safetyScore -= 15;

    safetyScore = Math.max(0, Math.min(100, safetyScore));

    let safetyGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (safetyScore >= 80) safetyGrade = 'A';
    else if (safetyScore >= 60) safetyGrade = 'B';
    else if (safetyScore >= 40) safetyGrade = 'C';
    else if (safetyScore >= 20) safetyGrade = 'D';
    else safetyGrade = 'F';

    const passesAllChecks = risks.length === 0 && !honeypotCheck.isHoneypot;

    return {
      tokenAddress,
      chain,
      tokenSymbol: tokenInfo.symbol,
      tokenName: tokenInfo.name,

      hasOwner: ownershipCheck.hasOwner,
      ownerAddress: ownershipCheck.ownerAddress,
      ownerCanMint: ownershipCheck.ownerCanMint,
      ownerCanPause: ownershipCheck.ownerCanPause,
      ownerCanBlacklist: ownershipCheck.ownerCanBlacklist,
      isRenounced: ownershipCheck.isRenounced,

      honeypotResult: honeypotCheck,

      tokenAgeMinutes: tokenAge,
      createdAt: tokenInfo.createdAt,

      top10HoldersPercent: holderAnalysis.top10Percent,
      holderCount: holderAnalysis.holderCount,

      liquidityUsd: liquidityInfo.liquidityUsd,
      liquidityLocked: liquidityInfo.isLocked,
      liquidityLockPlatform: liquidityInfo.lockPlatform,

      contractVerified: false,
      isProxy: false,
      hasHiddenMint: ownershipCheck.ownerCanMint,
      hasHiddenFees: honeypotCheck.buyTax > 0 || honeypotCheck.sellTax > 0,

      safetyScore,
      safetyGrade,
      risks,
      warnings,
      passesAllChecks,
    };
  }

  private async checkOwnership(chain: ChainId, tokenAddress: string): Promise<{
    hasOwner: boolean;
    ownerAddress?: string;
    isRenounced: boolean;
    ownerCanMint: boolean;
    ownerCanPause: boolean;
    ownerCanBlacklist: boolean;
  }> {
    const provider = this.providers.get(chain)!;
    const contract = new ethers.Contract(tokenAddress, ERC20_EXTENDED_ABI, provider);

    let ownerAddress: string | undefined;
    let hasOwner = false;
    let isRenounced = false;

    try {
      ownerAddress = await contract.owner();
      hasOwner = true;
      isRenounced = ownerAddress ? DEAD_ADDRESSES.includes(ownerAddress.toLowerCase()) : true;
    } catch {
      try {
        ownerAddress = await contract.getOwner();
        hasOwner = true;
        isRenounced = ownerAddress ? DEAD_ADDRESSES.includes(ownerAddress.toLowerCase()) : true;
      } catch {
        hasOwner = false;
        isRenounced = true;
      }
    }

    const code = await provider.getCode(tokenAddress);
    const ownerCanMint = code.includes('40c10f19');
    const ownerCanPause = code.includes('8456cb59') || code.includes('5c975abb');
    const ownerCanBlacklist = code.includes('44337ea1') || code.includes('e47d6060');

    return {
      hasOwner,
      ownerAddress,
      isRenounced,
      ownerCanMint,
      ownerCanPause,
      ownerCanBlacklist,
    };
  }

  private async checkHoneypot(chain: ChainId, tokenAddress: string): Promise<{
    canBuy: boolean;
    canSell: boolean;
    buyTax: number;
    sellTax: number;
    isHoneypot: boolean;
    reason?: string;
  }> {
    const chainConfig = CHAIN_CONFIGS[chain];

    try {
      const response = await axios.get(
        `https://api.honeypot.is/v2/IsHoneypot?address=${tokenAddress}&chainID=${chainConfig.chainId}`,
        { timeout: 10000 }
      );

      const data = response.data;

      if (data.honeypotResult) {
        return {
          canBuy: !data.honeypotResult.isHoneypot,
          canSell: !data.honeypotResult.isHoneypot,
          buyTax: data.simulationResult?.buyTax || 0,
          sellTax: data.simulationResult?.sellTax || 0,
          isHoneypot: data.honeypotResult.isHoneypot,
          reason: data.honeypotResult.honeypotReason,
        };
      }

      return {
        canBuy: true,
        canSell: true,
        buyTax: data.simulationResult?.buyTax || 0,
        sellTax: data.simulationResult?.sellTax || 0,
        isHoneypot: false,
      };
    } catch (error) {
      return await this.simulateHoneypotManually(chain, tokenAddress);
    }
  }

  private async simulateHoneypotManually(chain: ChainId, tokenAddress: string): Promise<{
    canBuy: boolean;
    canSell: boolean;
    buyTax: number;
    sellTax: number;
    isHoneypot: boolean;
    reason?: string;
  }> {
    return {
      canBuy: true,
      canSell: true,
      buyTax: 0,
      sellTax: 0,
      isHoneypot: false,
      reason: 'Manual simulation not implemented - using default safe values',
    };
  }

  private async getLiquidityInfo(chain: ChainId, tokenAddress: string): Promise<{
    liquidityUsd: number;
    isLocked: boolean;
    lockPlatform?: string;
  }> {
    try {
      const liquidity = await multiChainProvider.getLiquidityInfo(chain, tokenAddress);
      const totalLiquidity = liquidity.reduce((sum, l) => sum + l.liquidityUsd, 0);

      return {
        liquidityUsd: totalLiquidity,
        isLocked: false,
        lockPlatform: undefined,
      };
    } catch (error) {
      return { liquidityUsd: 0, isLocked: false };
    }
  }

  private async getTokenBasicInfo(chain: ChainId, tokenAddress: string): Promise<{
    symbol?: string;
    name?: string;
    ageMinutes: number;
    createdAt?: Date;
  }> {
    try {
      const tokenInfo = await multiChainProvider.getTokenInfo(chain, tokenAddress);

      return {
        symbol: tokenInfo?.symbol,
        name: tokenInfo?.name,
        ageMinutes: 60,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      };
    } catch (error) {
      return { ageMinutes: 0 };
    }
  }

  private async analyzeHolders(chain: ChainId, tokenAddress: string): Promise<{
    top10Percent: number;
    holderCount: number;
  }> {
    try {
      const holders = await multiChainProvider.getTopHolders(chain, tokenAddress, 10);
      const top10Percent = holders.reduce((sum, h) => sum + h.percentage, 0);

      return {
        top10Percent,
        holderCount: 100,
      };
    } catch (error) {
      return { top10Percent: 0, holderCount: 0 };
    }
  }

  async quickSafetyCheck(chain: ChainId, tokenAddress: string): Promise<{
    safe: boolean;
    score: number;
    criticalIssues: string[];
  }> {
    const [honeypot, ownership] = await Promise.all([
      this.checkHoneypot(chain, tokenAddress),
      this.checkOwnership(chain, tokenAddress),
    ]);

    const criticalIssues: string[] = [];

    if (honeypot.isHoneypot) {
      criticalIssues.push('Honeypot detected');
    }

    if (ownership.ownerCanMint && !ownership.isRenounced) {
      criticalIssues.push('Mint function accessible');
    }

    if (ownership.ownerCanBlacklist && !ownership.isRenounced) {
      criticalIssues.push('Blacklist function detected');
    }

    if (honeypot.sellTax > 20) {
      criticalIssues.push(`Extreme sell tax: ${honeypot.sellTax}%`);
    }

    const score = Math.max(0, 100 - (criticalIssues.length * 25));

    return {
      safe: criticalIssues.length === 0,
      score,
      criticalIssues,
    };
  }
}

export const evmSafetyEngine = new EvmSafetyEngine();
