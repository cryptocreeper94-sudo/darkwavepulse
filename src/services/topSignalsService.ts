import axios from 'axios';
import { db } from '../db/client.js';
import { strikeAgentSignals } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { tokenScannerService } from './tokenScannerService.js';
import { safetyEngineService, TokenSafetyReport } from './safetyEngineService.js';
import { randomBytes } from 'crypto';

const DEX_SCREENER_API = 'https://api.dexscreener.com/latest/dex';

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  priceNative: string;
  liquidity: { usd: number };
  fdv: number;
  volume: { h24: number; h1: number; m5: number };
  priceChange: { h24: number; h1: number; m5: number };
  txns: {
    h24: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    m5: { buys: number; sells: number };
  };
  pairCreatedAt: number;
}

interface TokenSignal {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chain: string;
  priceUsd: number;
  marketCapUsd: number;
  liquidityUsd: number;
  compositeScore: number;
  technicalScore: number;
  safetyScore: number;
  momentumScore: number;
  mlConfidence: number | null;
  indicators: Record<string, any>;
  reasoning: string;
  rank: number;
  category: 'blue_chip' | 'defi' | 'meme' | 'dex' | 'new';
  dex: string;
}

interface TechnicalIndicators {
  rsiSignal: 'oversold' | 'neutral' | 'overbought';
  macdSignal: 'bullish' | 'neutral' | 'bearish';
  emaCrossover: 'golden' | 'none' | 'death';
  volumeSpike: boolean;
  priceAction: 'bullish' | 'neutral' | 'bearish';
}

const SCORING_WEIGHTS = {
  safety: 0.30,
  technical: 0.30,
  momentum: 0.25,
  mlConfidence: 0.15,
};

const CATEGORY_KEYWORDS = {
  blue_chip: ['BTC', 'ETH', 'SOL', 'USDC', 'USDT', 'BONK', 'JUP', 'RAY', 'ORCA'],
  defi: ['SWAP', 'STAKE', 'FARM', 'YIELD', 'LEND', 'BORROW', 'LP', 'DEX'],
  meme: ['DOGE', 'SHIB', 'PEPE', 'WOJAK', 'FROG', 'CAT', 'DOG', 'MEME', 'INU', 'MOON', 'PUMP'],
  dex: ['RAY', 'JUP', 'ORCA', 'METEOR', 'LIFINITY'],
};

class TopSignalsService {
  private generateSignalId(): string {
    return `sig_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
  }

  async scanAndScoreTokens(): Promise<TokenSignal[]> {
    console.log('[TopSignals] Starting token scan and scoring...');
    
    try {
      const [trendingTokens, gainersTokens] = await Promise.all([
        this.fetchTrendingTokens(),
        this.fetchTopGainers(),
      ]);

      const allPairs = [...trendingTokens, ...gainersTokens];
      const uniqueTokens = this.deduplicateByAddress(allPairs);
      
      console.log(`[TopSignals] Processing ${uniqueTokens.length} unique tokens...`);

      const signals: TokenSignal[] = [];

      for (const pair of uniqueTokens.slice(0, 50)) {
        try {
          const signal = await this.analyzeAndScoreToken(pair);
          if (signal && signal.compositeScore > 0) {
            signals.push(signal);
          }
        } catch (err) {
          console.warn(`[TopSignals] Failed to analyze ${pair.baseToken?.symbol}:`, err);
        }
      }

      signals.sort((a, b) => b.compositeScore - a.compositeScore);
      
      signals.forEach((signal, index) => {
        signal.rank = index + 1;
      });

      console.log(`[TopSignals] Scored ${signals.length} tokens, saving to database...`);
      await this.saveSignals(signals);

      return signals;
    } catch (error) {
      console.error('[TopSignals] Scan error:', error);
      return [];
    }
  }

  async analyzeAndScoreToken(pair: DexScreenerPair): Promise<TokenSignal | null> {
    const tokenAddress = pair.baseToken?.address;
    if (!tokenAddress) return null;

    const safetyReport = await safetyEngineService.runFullSafetyCheck(tokenAddress);
    
    if (!safetyReport.passesAllChecks && safetyReport.safetyScore < 30) {
      return null;
    }
    if (safetyReport.honeypotResult?.isHoneypot) {
      return null;
    }

    const technicalIndicators = this.analyzeTechnicalIndicators(pair);
    const technicalScore = this.calculateTechnicalScore(technicalIndicators);
    
    const momentumScore = this.calculateMomentumScore(pair);
    
    const safetyScore = safetyReport.safetyScore;
    
    const mlConfidence = await this.getMLConfidence(tokenAddress);
    
    const compositeScore = this.calculateCompositeScore({
      safetyScore,
      technicalScore,
      momentumScore,
      mlConfidence,
    });

    const category = this.categorizeToken(pair.baseToken.symbol, pair.baseToken.name);
    const reasoning = this.generateReasoning(pair, safetyReport, technicalIndicators, compositeScore);

    return {
      id: this.generateSignalId(),
      tokenAddress,
      tokenSymbol: pair.baseToken.symbol || 'UNKNOWN',
      tokenName: pair.baseToken.name || 'Unknown Token',
      chain: pair.chainId === 'solana' ? 'solana' : pair.chainId,
      priceUsd: parseFloat(pair.priceUsd || '0'),
      marketCapUsd: pair.fdv || 0,
      liquidityUsd: pair.liquidity?.usd || 0,
      compositeScore,
      technicalScore,
      safetyScore,
      momentumScore,
      mlConfidence,
      indicators: {
        technical: technicalIndicators,
        safety: {
          hasMintAuthority: safetyReport.hasMintAuthority,
          hasFreezeAuthority: safetyReport.hasFreezeAuthority,
          liquidityLocked: safetyReport.liquidityLocked,
          holderCount: safetyReport.holderCount,
          top10HoldersPercent: safetyReport.top10HoldersPercent,
        },
        priceChange: pair.priceChange,
        volume: pair.volume,
      },
      reasoning,
      rank: 0,
      category,
      dex: pair.dexId || 'unknown',
    };
  }

  calculateCompositeScore(scores: {
    safetyScore: number;
    technicalScore: number;
    momentumScore: number;
    mlConfidence: number | null;
  }): number {
    let weightedSum = 0;
    let totalWeight = 0;

    weightedSum += scores.safetyScore * SCORING_WEIGHTS.safety;
    totalWeight += SCORING_WEIGHTS.safety;

    weightedSum += scores.technicalScore * SCORING_WEIGHTS.technical;
    totalWeight += SCORING_WEIGHTS.technical;

    weightedSum += scores.momentumScore * SCORING_WEIGHTS.momentum;
    totalWeight += SCORING_WEIGHTS.momentum;

    if (scores.mlConfidence !== null) {
      weightedSum += (scores.mlConfidence * 100) * SCORING_WEIGHTS.mlConfidence;
      totalWeight += SCORING_WEIGHTS.mlConfidence;
    }

    const composite = Math.round(weightedSum / totalWeight);
    return Math.max(0, Math.min(100, composite));
  }

  calculateTechnicalScore(indicators: TechnicalIndicators): number {
    let score = 50;

    if (indicators.rsiSignal === 'oversold') score += 15;
    else if (indicators.rsiSignal === 'overbought') score -= 10;

    if (indicators.macdSignal === 'bullish') score += 15;
    else if (indicators.macdSignal === 'bearish') score -= 10;

    if (indicators.emaCrossover === 'golden') score += 20;
    else if (indicators.emaCrossover === 'death') score -= 15;

    if (indicators.volumeSpike) score += 10;

    if (indicators.priceAction === 'bullish') score += 10;
    else if (indicators.priceAction === 'bearish') score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  calculateMomentumScore(pair: DexScreenerPair): number {
    let score = 50;

    const priceChange24h = pair.priceChange?.h24 || 0;
    if (priceChange24h > 50) score += 25;
    else if (priceChange24h > 20) score += 15;
    else if (priceChange24h > 5) score += 10;
    else if (priceChange24h < -20) score -= 20;
    else if (priceChange24h < -10) score -= 10;

    const priceChange1h = pair.priceChange?.h1 || 0;
    if (priceChange1h > 10) score += 15;
    else if (priceChange1h > 5) score += 10;
    else if (priceChange1h < -10) score -= 15;

    const volume24h = pair.volume?.h24 || 0;
    if (volume24h > 1000000) score += 15;
    else if (volume24h > 100000) score += 10;
    else if (volume24h < 10000) score -= 10;

    const txns = pair.txns?.h24;
    if (txns) {
      const buyRatio = txns.buys / (txns.buys + txns.sells || 1);
      if (buyRatio > 0.6) score += 10;
      else if (buyRatio < 0.4) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  analyzeTechnicalIndicators(pair: DexScreenerPair): TechnicalIndicators {
    const priceChange1h = pair.priceChange?.h1 || 0;
    const priceChange24h = pair.priceChange?.h24 || 0;
    const volume1h = pair.volume?.h1 || 0;
    const volume24hAvg = (pair.volume?.h24 || 0) / 24;

    let rsiSignal: 'oversold' | 'neutral' | 'overbought' = 'neutral';
    if (priceChange24h < -15 && priceChange1h > 0) {
      rsiSignal = 'oversold';
    } else if (priceChange24h > 50 && priceChange1h < 0) {
      rsiSignal = 'overbought';
    }

    let macdSignal: 'bullish' | 'neutral' | 'bearish' = 'neutral';
    if (priceChange1h > 5 && priceChange24h > 0) {
      macdSignal = 'bullish';
    } else if (priceChange1h < -5 && priceChange24h < 0) {
      macdSignal = 'bearish';
    }

    let emaCrossover: 'golden' | 'none' | 'death' = 'none';
    if (priceChange24h > 20 && priceChange1h > 5) {
      emaCrossover = 'golden';
    } else if (priceChange24h < -20 && priceChange1h < -5) {
      emaCrossover = 'death';
    }

    const volumeSpike = volume1h > volume24hAvg * 2;

    let priceAction: 'bullish' | 'neutral' | 'bearish' = 'neutral';
    if (priceChange1h > 3 && priceChange24h > 5) {
      priceAction = 'bullish';
    } else if (priceChange1h < -3 && priceChange24h < -5) {
      priceAction = 'bearish';
    }

    return { rsiSignal, macdSignal, emaCrossover, volumeSpike, priceAction };
  }

  async getMLConfidence(tokenAddress: string): Promise<number | null> {
    try {
      return null;
    } catch (error) {
      return null;
    }
  }

  categorizeToken(symbol: string, name: string): 'blue_chip' | 'defi' | 'meme' | 'dex' | 'new' {
    const upperSymbol = symbol.toUpperCase();
    const upperName = name.toUpperCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (upperSymbol.includes(keyword) || upperName.includes(keyword)) {
          return category as 'blue_chip' | 'defi' | 'meme' | 'dex';
        }
      }
    }

    return 'new';
  }

  generateReasoning(
    pair: DexScreenerPair,
    safetyReport: TokenSafetyReport,
    indicators: TechnicalIndicators,
    compositeScore: number
  ): string {
    const reasons: string[] = [];

    if (compositeScore >= 70) {
      reasons.push(`Strong overall score of ${compositeScore}/100.`);
    } else if (compositeScore >= 50) {
      reasons.push(`Moderate opportunity score of ${compositeScore}/100.`);
    }

    if (safetyReport.safetyScore >= 70) {
      reasons.push('Passes key safety checks.');
    }
    if (safetyReport.liquidityLocked || safetyReport.liquidityBurned) {
      reasons.push('Liquidity is locked or burned.');
    }

    if (indicators.rsiSignal === 'oversold') {
      reasons.push('RSI indicates oversold conditions - potential bounce.');
    }
    if (indicators.macdSignal === 'bullish') {
      reasons.push('MACD showing bullish momentum.');
    }
    if (indicators.emaCrossover === 'golden') {
      reasons.push('Golden cross pattern detected.');
    }
    if (indicators.volumeSpike) {
      reasons.push('Volume spike indicates increased interest.');
    }

    const priceChange24h = pair.priceChange?.h24 || 0;
    if (priceChange24h > 20) {
      reasons.push(`Strong 24h gain of +${priceChange24h.toFixed(1)}%.`);
    }

    const volume24h = pair.volume?.h24 || 0;
    if (volume24h > 500000) {
      reasons.push(`High trading volume ($${(volume24h / 1000000).toFixed(2)}M in 24h).`);
    }

    if (reasons.length === 0) {
      reasons.push('Token shows potential based on combined metrics.');
    }

    return reasons.join(' ');
  }

  async getTopSignals(limit: number = 10, category?: string): Promise<TokenSignal[]> {
    try {
      let query = db.select().from(strikeAgentSignals).orderBy(desc(strikeAgentSignals.compositeScore));

      if (category) {
        query = query.where(eq(strikeAgentSignals.category, category)) as any;
      }

      const results = await query.limit(limit);

      return results.map(row => ({
        id: row.id,
        tokenAddress: row.tokenAddress,
        tokenSymbol: row.tokenSymbol,
        tokenName: row.tokenName,
        chain: row.chain,
        priceUsd: parseFloat(row.priceUsd || '0'),
        marketCapUsd: parseFloat(row.marketCapUsd || '0'),
        liquidityUsd: parseFloat(row.liquidityUsd || '0'),
        compositeScore: row.compositeScore,
        technicalScore: row.technicalScore,
        safetyScore: row.safetyScore,
        momentumScore: row.momentumScore,
        mlConfidence: row.mlConfidence ? parseFloat(row.mlConfidence) : null,
        indicators: row.indicators ? JSON.parse(row.indicators) : {},
        reasoning: row.reasoning || '',
        rank: row.rank,
        category: row.category as TokenSignal['category'],
        dex: row.dex || 'unknown',
      }));
    } catch (error) {
      console.error('[TopSignals] Error fetching signals:', error);
      return [];
    }
  }

  async saveSignals(signals: TokenSignal[]): Promise<void> {
    if (signals.length === 0) return;

    try {
      await db.delete(strikeAgentSignals);

      const records = signals.slice(0, 100).map(signal => ({
        id: signal.id,
        tokenAddress: signal.tokenAddress,
        tokenSymbol: signal.tokenSymbol,
        tokenName: signal.tokenName,
        chain: signal.chain,
        priceUsd: signal.priceUsd.toString(),
        marketCapUsd: signal.marketCapUsd.toString(),
        liquidityUsd: signal.liquidityUsd.toString(),
        compositeScore: signal.compositeScore,
        technicalScore: signal.technicalScore,
        safetyScore: signal.safetyScore,
        momentumScore: signal.momentumScore,
        mlConfidence: signal.mlConfidence?.toString() || null,
        indicators: JSON.stringify(signal.indicators),
        reasoning: signal.reasoning,
        rank: signal.rank,
        category: signal.category,
        dex: signal.dex,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(strikeAgentSignals).values(records);
      console.log(`[TopSignals] Saved ${records.length} signals to database`);
    } catch (error) {
      console.error('[TopSignals] Error saving signals:', error);
      throw error;
    }
  }

  private async fetchTrendingTokens(): Promise<DexScreenerPair[]> {
    try {
      const response = await axios.get(`${DEX_SCREENER_API}/tokens/solana`, {
        timeout: 15000,
      });
      return response.data?.pairs || [];
    } catch (error) {
      console.error('[TopSignals] Error fetching trending tokens:', error);
      return [];
    }
  }

  private async fetchTopGainers(): Promise<DexScreenerPair[]> {
    try {
      const response = await axios.get(`${DEX_SCREENER_API}/search?q=solana`, {
        timeout: 15000,
      });
      
      const pairs: DexScreenerPair[] = response.data?.pairs || [];
      return pairs
        .filter(p => p.chainId === 'solana' && (p.priceChange?.h24 || 0) > 10)
        .sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0))
        .slice(0, 50);
    } catch (error) {
      console.error('[TopSignals] Error fetching top gainers:', error);
      return [];
    }
  }

  private deduplicateByAddress(pairs: DexScreenerPair[]): DexScreenerPair[] {
    const seen = new Set<string>();
    const unique: DexScreenerPair[] = [];

    for (const pair of pairs) {
      const address = pair.baseToken?.address;
      if (address && !seen.has(address)) {
        seen.add(address);
        unique.push(pair);
      }
    }

    return unique;
  }
}

export const topSignalsService = new TopSignalsService();
