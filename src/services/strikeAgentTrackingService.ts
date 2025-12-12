import { createHash, randomBytes } from 'crypto';
import { db } from '../db/client.js';
import { strikeagentPredictions, strikeagentOutcomes } from '../db/schema.js';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { tokenScannerService } from './tokenScannerService.js';

interface TokenSafetyMetrics {
  botPercent: number;
  bundlePercent: number;
  top10HoldersPercent: number;
  liquidityUsd: number;
  holderCount: number;
  creatorWalletRisky: boolean;
  mintAuthorityActive?: boolean;
  freezeAuthorityActive?: boolean;
  isHoneypot?: boolean;
  liquidityLocked?: boolean;
  isPumpFun?: boolean;
}

interface TokenMovementMetrics {
  priceChangePercent: number;
  volumeMultiplier: number;
  tradesPerMinute: number;
  buySellRatio: number;
  holderGrowthPercent: number;
}

interface StrikeAgentPredictionInput {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName?: string;
  dex?: string;
  chain?: string;
  priceUsd: number;
  priceSol?: number;
  marketCapUsd?: number;
  liquidityUsd?: number;
  tokenAgeMinutes?: number;
  aiRecommendation: 'snipe' | 'watch' | 'avoid';
  aiScore: number;
  aiReasoning?: string;
  safetyMetrics?: TokenSafetyMetrics;
  movementMetrics?: TokenMovementMetrics;
  userId?: string;
}

interface StrikeAgentOutcomeInput {
  predictionId: string;
  horizon: '1h' | '4h' | '24h' | '7d';
  priceAtCheck: number;
  marketCapAtCheck?: number;
  liquidityAtCheck?: number;
  holderCountAtCheck?: number;
  volumeChange?: number;
  isRugged?: boolean;
  hit2x?: boolean;
  hit5x?: boolean;
  hit10x?: boolean;
  maxGainPercent?: number;
  maxDrawdownPercent?: number;
}

class StrikeAgentTrackingService {
  private generatePredictionId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `sa_${timestamp}_${random}`;
  }

  private hashPayload(payload: object): string {
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }

  async logPrediction(input: StrikeAgentPredictionInput): Promise<{
    id: string;
    payloadHash: string;
    success: boolean;
  }> {
    const predictionId = this.generatePredictionId();
    
    const payload = {
      id: predictionId,
      tokenAddress: input.tokenAddress,
      tokenSymbol: input.tokenSymbol,
      priceUsd: input.priceUsd,
      aiRecommendation: input.aiRecommendation,
      aiScore: input.aiScore,
      timestamp: new Date().toISOString(),
    };

    const payloadHash = this.hashPayload(payload);

    try {
      await db.insert(strikeagentPredictions).values({
        id: predictionId,
        userId: input.userId || null,
        tokenAddress: input.tokenAddress,
        tokenSymbol: input.tokenSymbol.toUpperCase(),
        tokenName: input.tokenName,
        dex: input.dex,
        chain: input.chain || 'solana',
        priceUsd: input.priceUsd.toString(),
        priceSol: input.priceSol?.toString(),
        marketCapUsd: input.marketCapUsd?.toString(),
        liquidityUsd: input.liquidityUsd?.toString(),
        tokenAgeMinutes: input.tokenAgeMinutes,
        aiRecommendation: input.aiRecommendation,
        aiScore: input.aiScore,
        aiReasoning: input.aiReasoning,
        safetyMetrics: input.safetyMetrics ? JSON.stringify(input.safetyMetrics) : null,
        movementMetrics: input.movementMetrics ? JSON.stringify(input.movementMetrics) : null,
        holderCount: input.safetyMetrics?.holderCount,
        top10HoldersPercent: input.safetyMetrics?.top10HoldersPercent?.toString(),
        botPercent: input.safetyMetrics?.botPercent?.toString(),
        bundlePercent: input.safetyMetrics?.bundlePercent?.toString(),
        mintAuthorityActive: input.safetyMetrics?.mintAuthorityActive,
        freezeAuthorityActive: input.safetyMetrics?.freezeAuthorityActive,
        isHoneypot: input.safetyMetrics?.isHoneypot,
        liquidityLocked: input.safetyMetrics?.liquidityLocked,
        isPumpFun: input.safetyMetrics?.isPumpFun,
        creatorWalletRisky: input.safetyMetrics?.creatorWalletRisky,
        payloadHash,
        status: 'pending',
      });

      console.log(`🎯 [StrikeAgentTracking] Logged prediction ${predictionId}: ${input.aiRecommendation.toUpperCase()} ${input.tokenSymbol} @ $${input.priceUsd}`);

      return { id: predictionId, payloadHash, success: true };
    } catch (error: any) {
      console.error('❌ [StrikeAgentTracking] Failed to log prediction:', error);
      return { id: predictionId, payloadHash, success: false };
    }
  }

  async recordOutcome(input: StrikeAgentOutcomeInput): Promise<boolean> {
    try {
      const [prediction] = await db.select()
        .from(strikeagentPredictions)
        .where(eq(strikeagentPredictions.id, input.predictionId))
        .limit(1);

      if (!prediction) {
        console.error(`❌ [StrikeAgentTracking] Prediction not found: ${input.predictionId}`);
        return false;
      }

      const originalPrice = parseFloat(prediction.priceUsd);
      const priceChangePercent = ((input.priceAtCheck - originalPrice) / originalPrice) * 100;

      const outcome = this.classifyOutcome(priceChangePercent, input);
      const isCorrect = this.evaluateOutcome(prediction.aiRecommendation, outcome, priceChangePercent);

      const outcomeId = `sao_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;

      await db.insert(strikeagentOutcomes).values({
        id: outcomeId,
        predictionId: input.predictionId,
        horizon: input.horizon,
        priceAtCheck: input.priceAtCheck.toString(),
        priceChangePercent: priceChangePercent.toFixed(4),
        marketCapAtCheck: input.marketCapAtCheck?.toString(),
        liquidityAtCheck: input.liquidityAtCheck?.toString(),
        holderCountAtCheck: input.holderCountAtCheck,
        volumeChange: input.volumeChange?.toString(),
        outcome,
        isCorrect,
        hit2x: input.hit2x || priceChangePercent >= 100,
        hit5x: input.hit5x || priceChangePercent >= 400,
        hit10x: input.hit10x || priceChangePercent >= 900,
        maxGainPercent: input.maxGainPercent?.toString(),
        maxDrawdownPercent: input.maxDrawdownPercent?.toString(),
        isRugged: input.isRugged,
        liquidityRemaining: input.liquidityAtCheck?.toString(),
      });

      await db.update(strikeagentPredictions)
        .set({ status: 'evaluated' })
        .where(eq(strikeagentPredictions.id, input.predictionId));

      console.log(`📊 [StrikeAgentTracking] Recorded outcome for ${prediction.tokenSymbol} @ ${input.horizon}: ${outcome} (${priceChangePercent.toFixed(2)}%)`);

      return true;
    } catch (error: any) {
      console.error('❌ [StrikeAgentTracking] Failed to record outcome:', error);
      return false;
    }
  }

  private classifyOutcome(priceChangePercent: number, input: StrikeAgentOutcomeInput): string {
    if (input.isRugged) return 'RUG';
    if (priceChangePercent >= 500) return 'MOON';
    if (priceChangePercent >= 50) return 'PUMP';
    if (priceChangePercent <= -50) return 'RUG';
    return 'SIDEWAYS';
  }

  private evaluateOutcome(recommendation: string, outcome: string, priceChangePercent: number): boolean {
    if (recommendation === 'snipe') {
      return outcome === 'PUMP' || outcome === 'MOON' || priceChangePercent > 20;
    } else if (recommendation === 'avoid') {
      return outcome === 'RUG' || priceChangePercent < -20;
    } else {
      return outcome === 'SIDEWAYS' || (priceChangePercent > -30 && priceChangePercent < 100);
    }
  }

  async getPendingOutcomeChecks(horizon: '1h' | '4h' | '24h' | '7d', limit = 50): Promise<any[]> {
    const horizonMs = {
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };

    const cutoffTime = new Date(Date.now() - horizonMs[horizon]);

    try {
      const predictions = await db.select()
        .from(strikeagentPredictions)
        .where(and(
          eq(strikeagentPredictions.status, 'pending'),
        ))
        .orderBy(strikeagentPredictions.createdAt)
        .limit(limit);

      return predictions.filter(p => {
        const createdAt = new Date(p.createdAt);
        return createdAt <= cutoffTime;
      });
    } catch (error) {
      console.error('❌ [StrikeAgentTracking] Failed to get pending checks:', error);
      return [];
    }
  }

  async checkOutcomeForPrediction(predictionId: string, horizon: '1h' | '4h' | '24h' | '7d'): Promise<boolean> {
    try {
      const [prediction] = await db.select()
        .from(strikeagentPredictions)
        .where(eq(strikeagentPredictions.id, predictionId))
        .limit(1);

      if (!prediction) return false;

      const tokenDetails = await tokenScannerService.getTokenDetails(prediction.tokenAddress);
      if (!tokenDetails) {
        await this.recordOutcome({
          predictionId,
          horizon,
          priceAtCheck: 0,
          isRugged: true,
          liquidityAtCheck: 0,
        });
        return true;
      }

      await this.recordOutcome({
        predictionId,
        horizon,
        priceAtCheck: parseFloat(tokenDetails.priceUsd || '0'),
        marketCapAtCheck: tokenDetails.fdv,
        liquidityAtCheck: tokenDetails.liquidity?.usd,
        isRugged: (tokenDetails.liquidity?.usd || 0) < 100,
      });

      return true;
    } catch (error) {
      console.error('❌ [StrikeAgentTracking] Outcome check failed:', error);
      return false;
    }
  }

  async getStats(): Promise<{
    totalPredictions: number;
    snipeRecommendations: number;
    watchRecommendations: number;
    avoidRecommendations: number;
    outcomesByHorizon: Record<string, { total: number; correct: number; winRate: string }>;
  }> {
    try {
      const predictions = await db.select().from(strikeagentPredictions);
      const outcomes = await db.select().from(strikeagentOutcomes);

      const snipe = predictions.filter(p => p.aiRecommendation === 'snipe').length;
      const watch = predictions.filter(p => p.aiRecommendation === 'watch').length;
      const avoid = predictions.filter(p => p.aiRecommendation === 'avoid').length;

      const horizons = ['1h', '4h', '24h', '7d'];
      const outcomesByHorizon: Record<string, { total: number; correct: number; winRate: string }> = {};

      for (const h of horizons) {
        const hOutcomes = outcomes.filter(o => o.horizon === h);
        const correct = hOutcomes.filter(o => o.isCorrect).length;
        outcomesByHorizon[h] = {
          total: hOutcomes.length,
          correct,
          winRate: hOutcomes.length > 0 ? ((correct / hOutcomes.length) * 100).toFixed(1) : '0',
        };
      }

      return {
        totalPredictions: predictions.length,
        snipeRecommendations: snipe,
        watchRecommendations: watch,
        avoidRecommendations: avoid,
        outcomesByHorizon,
      };
    } catch (error) {
      console.error('❌ [StrikeAgentTracking] Failed to get stats:', error);
      return {
        totalPredictions: 0,
        snipeRecommendations: 0,
        watchRecommendations: 0,
        avoidRecommendations: 0,
        outcomesByHorizon: {},
      };
    }
  }
}

export const strikeAgentTrackingService = new StrikeAgentTrackingService();
