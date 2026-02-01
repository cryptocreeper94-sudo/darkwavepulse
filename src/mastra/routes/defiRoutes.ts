import { db } from '../../db/client.js';
import { defiPositions, defiProtocols, yieldOpportunities } from '../../db/schema';
import { desc, eq, and, sql, gte } from 'drizzle-orm';

export const defiRoutes = [
  {
    path: "/api/defi/positions",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const positions = await db.select()
          .from(defiPositions)
          .where(eq(defiPositions.userId, userId))
          .orderBy(desc(defiPositions.valueUsd));

        const totalValue = positions.reduce((sum, p) => sum + parseFloat(String(p.valueUsd) || '0'), 0);
        const totalDailyYield = positions.reduce((sum, p) => sum + parseFloat(String(p.dailyYieldUsd) || '0'), 0);
        const avgApy = positions.length > 0 
          ? positions.reduce((sum, p) => sum + parseFloat(String(p.apy) || '0'), 0) / positions.length
          : 0;

        return c.json({ 
          positions,
          summary: {
            totalValue: totalValue.toFixed(2),
            totalDailyYield: totalDailyYield.toFixed(2),
            avgApy: avgApy.toFixed(2),
            positionsCount: positions.length
          }
        });
      } catch (error: any) {
        logger?.error('DeFi positions error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/defi/protocols",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const chain = c.req.query('chain');
        const category = c.req.query('category');

        let query = db.select().from(defiProtocols);
        
        if (chain) {
          query = query.where(eq(defiProtocols.chain, chain)) as any;
        }
        if (category) {
          query = query.where(eq(defiProtocols.category, category)) as any;
        }

        const protocols = await query.orderBy(desc(defiProtocols.tvl)).limit(50);

        return c.json({ protocols });
      } catch (error: any) {
        logger?.error('DeFi protocols error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/defi/yields",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const chain = c.req.query('chain');
        const minApy = parseFloat(c.req.query('minApy') || '0');
        const sortBy = c.req.query('sortBy') || 'apy';

        let query = db.select().from(yieldOpportunities);
        
        if (chain) {
          query = query.where(eq(yieldOpportunities.chain, chain)) as any;
        }
        if (minApy > 0) {
          query = query.where(gte(yieldOpportunities.apy, minApy.toString())) as any;
        }

        const opportunities = await query
          .orderBy(desc(yieldOpportunities.apy))
          .limit(100);

        return c.json({ opportunities });
      } catch (error: any) {
        logger?.error('Yield opportunities error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/defi/sync",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { userId, walletAddress, chain } = await c.req.json();
        if (!userId || !walletAddress) {
          return c.json({ error: 'userId and walletAddress required' }, 400);
        }

        logger?.info('DeFi sync requested', { userId, walletAddress, chain });
        return c.json({ success: true, message: 'DeFi sync queued' });
      } catch (error: any) {
        logger?.error('DeFi sync error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  }
];
