import { db } from '../../db/client.js';
import { quantScanConfig, quantTradeSessions, quantTradeActions, quantLearningMetrics } from '../../db/schema';
import { desc, eq, and, gte, sql } from 'drizzle-orm';

const QUANT_PIN = '0424';

export const quantRoutes = [
  {
    path: "/api/quant/metrics",
    method: "GET",
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const metrics = await db.select()
          .from(quantLearningMetrics)
          .orderBy(desc(quantLearningMetrics.periodStart))
          .limit(30);

        const totals = metrics.reduce((acc, m) => ({
          totalScans: acc.totalScans + (m.totalScans || 0),
          totalTokens: acc.totalTokens + (m.totalTokensAnalyzed || 0),
          signalsGenerated: acc.signalsGenerated + (m.signalsGenerated || 0),
          totalTrades: acc.totalTrades + (m.totalTrades || 0),
          winningTrades: acc.winningTrades + (m.winningTrades || 0),
        }), { totalScans: 0, totalTokens: 0, signalsGenerated: 0, totalTrades: 0, winningTrades: 0 });

        const winRate = totals.totalTrades > 0 
          ? ((totals.winningTrades / totals.totalTrades) * 100).toFixed(1)
          : '0';

        return c.json({
          totalScans: totals.totalScans,
          totalTokensAnalyzed: totals.totalTokens,
          signalsGenerated: totals.signalsGenerated,
          tradesExecuted: totals.totalTrades,
          winRate,
          modelAccuracy: metrics[0]?.modelAccuracy || '0',
          recentMetrics: metrics.slice(0, 7).map(m => ({
            date: m.periodStart,
            scans: m.totalScans,
            tokens: m.totalTokensAnalyzed,
            signals: m.signalsGenerated,
          }))
        });
      } catch (error: any) {
        logger?.error('❌ [QuantMetrics] Error fetching metrics', { error: error.message });
        return c.json({
          totalScans: 0,
          totalTokensAnalyzed: 0,
          signalsGenerated: 0,
          tradesExecuted: 0,
          winRate: '0',
          modelAccuracy: '0',
          recentMetrics: []
        });
      }
    }
  },
  {
    path: "/api/quant/trade-feed",
    method: "GET",
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const recentTrades = await db.select()
          .from(quantTradeActions)
          .orderBy(desc(quantTradeActions.executedAt))
          .limit(20);

        return c.json({
          trades: recentTrades.map(t => ({
            id: t.id,
            type: t.actionType,
            tokenSymbol: t.tokenSymbol,
            tokenAddress: t.tokenAddress,
            priceUsd: t.priceAtAction,
            amountSol: t.amountSol,
            pnlPercent: t.pnlPercent,
            pnlUsd: t.pnlUsd,
            executedAt: t.executedAt,
            status: t.status,
          }))
        });
      } catch (error: any) {
        logger?.error('❌ [QuantTradeFeed] Error fetching trades', { error: error.message });
        return c.json({ trades: [] });
      }
    }
  },
  {
    path: "/api/quant/scan-config",
    method: "GET",
    createHandler: async ({ mastra }: any) => async (c: any) => {
      try {
        const configs = await db.select().from(quantScanConfig);
        return c.json({ configs });
      } catch (error: any) {
        return c.json({ configs: [] });
      }
    }
  },
  {
    path: "/api/quant/scan-config",
    method: "POST",
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const body = await c.req.json();
        const { pin, category, enabled, scanIntervalMinutes, minLiquidityUsd, minMarketCapUsd, maxMarketCapUsd, minSafetyScore, minCompositeScore } = body;

        if (pin !== QUANT_PIN) {
          return c.json({ error: 'Invalid PIN' }, 403);
        }

        const existing = await db.select()
          .from(quantScanConfig)
          .where(eq(quantScanConfig.category, category))
          .limit(1);

        const now = new Date();
        if (existing.length > 0) {
          await db.update(quantScanConfig)
            .set({
              enabled: enabled ?? existing[0].enabled,
              scanIntervalMinutes: scanIntervalMinutes ?? existing[0].scanIntervalMinutes,
              minLiquidityUsd: minLiquidityUsd ?? existing[0].minLiquidityUsd,
              minMarketCapUsd: minMarketCapUsd ?? existing[0].minMarketCapUsd,
              maxMarketCapUsd: maxMarketCapUsd ?? existing[0].maxMarketCapUsd,
              minSafetyScore: minSafetyScore ?? existing[0].minSafetyScore,
              minCompositeScore: minCompositeScore ?? existing[0].minCompositeScore,
              updatedAt: now,
            })
            .where(eq(quantScanConfig.id, existing[0].id));

          return c.json({ success: true, updated: true });
        } else {
          const id = `qsc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
          await db.insert(quantScanConfig).values({
            id,
            userId: 'system',
            category,
            enabled: enabled ?? true,
            scanIntervalMinutes: scanIntervalMinutes ?? 5,
            minLiquidityUsd: minLiquidityUsd?.toString() ?? '5000',
            minMarketCapUsd: minMarketCapUsd?.toString() ?? '10000',
            maxMarketCapUsd: maxMarketCapUsd?.toString() ?? null,
            minSafetyScore: minSafetyScore ?? 50,
            minCompositeScore: minCompositeScore ?? 60,
            createdAt: now,
            updatedAt: now,
          });

          return c.json({ success: true, created: true });
        }
      } catch (error: any) {
        logger?.error('❌ [QuantScanConfig] Error updating config', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },
  {
    path: "/api/quant/sessions",
    method: "GET",
    createHandler: async ({ mastra }: any) => async (c: any) => {
      try {
        const sessions = await db.select()
          .from(quantTradeSessions)
          .orderBy(desc(quantTradeSessions.startedAt))
          .limit(10);

        return c.json({ sessions });
      } catch (error: any) {
        return c.json({ sessions: [] });
      }
    }
  },
];
