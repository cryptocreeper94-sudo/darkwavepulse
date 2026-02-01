import { db } from '../../db/client.js';
import { tokenHolderStats, tokenFlows, dexVolumeStats, gasPrices } from '../../db/schema';
import { desc, eq, and, gte } from 'drizzle-orm';

export const onchainRoutes = [
  {
    path: "/api/onchain/holders",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const tokenAddress = c.req.query('tokenAddress');
        const chain = c.req.query('chain') || 'solana';
        
        if (!tokenAddress) return c.json({ error: 'tokenAddress required' }, 400);

        const stats = await db.select()
          .from(tokenHolderStats)
          .where(and(
            eq(tokenHolderStats.tokenAddress, tokenAddress),
            eq(tokenHolderStats.chain, chain)
          ))
          .orderBy(desc(tokenHolderStats.snapshotAt))
          .limit(1);

        return c.json({ stats: stats[0] || null });
      } catch (error: any) {
        logger?.error('Holder stats error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/onchain/flows",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const tokenAddress = c.req.query('tokenAddress');
        const chain = c.req.query('chain') || 'solana';
        const days = parseInt(c.req.query('days') || '7');
        
        if (!tokenAddress) return c.json({ error: 'tokenAddress required' }, 400);

        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const flows = await db.select()
          .from(tokenFlows)
          .where(and(
            eq(tokenFlows.tokenAddress, tokenAddress),
            eq(tokenFlows.chain, chain),
            gte(tokenFlows.periodStart, startDate)
          ))
          .orderBy(desc(tokenFlows.periodStart))
          .limit(50);

        return c.json({ flows });
      } catch (error: any) {
        logger?.error('Token flows error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/onchain/dex-volume",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const chain = c.req.query('chain') || 'solana';
        const tokenAddress = c.req.query('tokenAddress');

        const conditions = [eq(dexVolumeStats.chain, chain)];
        if (tokenAddress) {
          conditions.push(eq(dexVolumeStats.tokenAddress, tokenAddress));
        }

        const volumes = await db.select()
          .from(dexVolumeStats)
          .where(and(...conditions))
          .orderBy(desc(dexVolumeStats.volume24h))
          .limit(50);

        return c.json({ volumes });
      } catch (error: any) {
        logger?.error('DEX volume error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/onchain/gas",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const prices = await db.select()
          .from(gasPrices)
          .orderBy(desc(gasPrices.updatedAt));

        const byChain = prices.reduce((acc: any, p) => {
          acc[p.chain] = {
            slow: p.slowGwei,
            standard: p.standardGwei,
            fast: p.fastGwei,
            instant: p.instantGwei,
            baseFee: p.baseFee,
            swapCostUsd: p.estimatedSwapCostUsd,
            congestion: p.congestionLevel,
            updatedAt: p.updatedAt
          };
          return acc;
        }, {});

        return c.json({ gasPrices: byChain });
      } catch (error: any) {
        logger?.error('Gas prices error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  }
];
