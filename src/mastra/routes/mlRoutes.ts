import { db } from '../../db/client.js';
import { predictionEvents, predictionOutcomes, predictionModelVersions } from '../../db/schema';
import { desc } from 'drizzle-orm';

export const mlRoutes = [
  {
    path: "/api/ml/stats",
    method: "GET",
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const predictions = await db.select().from(predictionEvents);
        const outcomes = await db.select().from(predictionOutcomes);

        const buySignals = predictions.filter((p: any) => 
          p.signalType === 'BUY' || p.signalType === 'STRONG_BUY'
        ).length;
        const sellSignals = predictions.filter((p: any) => 
          p.signalType === 'SELL' || p.signalType === 'STRONG_SELL'
        ).length;
        const holdSignals = predictions.filter((p: any) => 
          p.signalType === 'HOLD' || p.signalType === 'NEUTRAL'
        ).length;

        const horizons = ['1h', '4h', '24h', '7d'];
        const outcomesByHorizon: Record<string, { total: number; correct: number; winRate: string }> = {};

        for (const h of horizons) {
          const hOutcomes = outcomes.filter((o: any) => o.horizon === h);
          const correct = hOutcomes.filter((o: any) => o.isCorrect).length;
          outcomesByHorizon[h] = {
            total: hOutcomes.length,
            correct,
            winRate: hOutcomes.length > 0 ? ((correct / hOutcomes.length) * 100).toFixed(1) : '0',
          };
        }

        const recentPredictions = await db.select()
          .from(predictionEvents)
          .orderBy(desc(predictionEvents.createdAt))
          .limit(10);

        return c.json({
          totalPredictions: predictions.length,
          buySignals,
          sellSignals,
          holdSignals,
          outcomesByHorizon,
          recentPredictions: recentPredictions.map((p: any) => ({
            id: p.id,
            ticker: p.ticker,
            signalType: p.signalType,
            confidence: p.confidence,
            price: p.price,
            createdAt: p.createdAt
          }))
        });
      } catch (error: any) {
        logger?.error('❌ [MLStats] Error fetching stats', { error: error.message });
        return c.json({ 
          totalPredictions: 0,
          buySignals: 0,
          sellSignals: 0,
          holdSignals: 0,
          outcomesByHorizon: {},
          recentPredictions: []
        });
      }
    }
  },
  {
    path: "/api/ml/model-status",
    method: "GET",
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const allModels = await db.select()
          .from(predictionModelVersions)
          .orderBy(desc(predictionModelVersions.trainedAt));
        
        const activeModels = allModels.filter((m: any) => m.isActive);
        
        return c.json({
          activeModels: activeModels.length,
          totalModels: allModels.length,
          models: allModels.map((m: any) => ({
            id: m.id,
            ticker: m.ticker,
            horizon: m.horizon,
            accuracy: m.validationAccuracy,
            isActive: m.isActive,
            trainedAt: m.trainedAt,
            sampleCount: m.trainingSampleCount
          }))
        });
      } catch (error: any) {
        logger?.error('❌ [MLStats] Error fetching model status', { error: error.message });
        return c.json({ 
          activeModels: 0,
          totalModels: 0,
          models: []
        });
      }
    }
  }
];
