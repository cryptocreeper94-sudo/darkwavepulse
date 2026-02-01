import { db } from '../../db/client.js';
import { portfolioWallets, portfolioHoldings, portfolioSnapshots, portfolioTransactions, costBasisLots } from '../../db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const portfolioRoutes = [
  {
    path: "/api/portfolio/wallets",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const wallets = await db.select()
          .from(portfolioWallets)
          .where(eq(portfolioWallets.userId, userId));

        return c.json({ wallets });
      } catch (error: any) {
        logger?.error('Portfolio wallets error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/portfolio/wallets",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { userId, address, chain, nickname } = await c.req.json();
        if (!userId || !address || !chain) {
          return c.json({ error: 'userId, address, chain required' }, 400);
        }

        const wallet = {
          id: uuidv4(),
          userId,
          address,
          chain,
          nickname: nickname || `${chain} Wallet`,
          walletType: 'external',
          isConnected: true,
          createdAt: new Date()
        };

        await db.insert(portfolioWallets).values(wallet);
        logger?.info('Added portfolio wallet', { userId, address, chain });

        return c.json({ success: true, wallet });
      } catch (error: any) {
        logger?.error('Add wallet error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/portfolio/holdings",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const holdings = await db.select()
          .from(portfolioHoldings)
          .where(eq(portfolioHoldings.userId, userId))
          .orderBy(desc(portfolioHoldings.balanceUsd));

        const totalValue = holdings.reduce((sum, h) => sum + parseFloat(String(h.balanceUsd) || '0'), 0);
        const totalCostBasis = holdings.reduce((sum, h) => sum + parseFloat(String(h.costBasisUsd) || '0'), 0);
        const totalPnl = totalValue - totalCostBasis;
        const pnlPercent = totalCostBasis > 0 ? ((totalPnl / totalCostBasis) * 100) : 0;

        const allocation = holdings.map(h => ({
          symbol: h.tokenSymbol,
          value: parseFloat(String(h.balanceUsd) || '0'),
          percent: totalValue > 0 ? (parseFloat(String(h.balanceUsd) || '0') / totalValue * 100) : 0
        })).filter(a => a.percent >= 0.1);

        return c.json({
          holdings,
          summary: {
            totalValue: totalValue.toFixed(2),
            totalCostBasis: totalCostBasis.toFixed(2),
            totalPnl: totalPnl.toFixed(2),
            pnlPercent: pnlPercent.toFixed(2),
            holdingsCount: holdings.length
          },
          allocation
        });
      } catch (error: any) {
        logger?.error('Portfolio holdings error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/portfolio/sync",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { userId, walletId } = await c.req.json();
        if (!userId) return c.json({ error: 'userId required' }, 400);

        logger?.info('Syncing portfolio', { userId, walletId });
        return c.json({ success: true, message: 'Portfolio sync queued' });
      } catch (error: any) {
        logger?.error('Portfolio sync error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/portfolio/transactions",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        const limit = parseInt(c.req.query('limit') || '50');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const txs = await db.select()
          .from(portfolioTransactions)
          .where(eq(portfolioTransactions.userId, userId))
          .orderBy(desc(portfolioTransactions.txTimestamp))
          .limit(limit);

        return c.json({ transactions: txs });
      } catch (error: any) {
        logger?.error('Portfolio transactions error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/portfolio/snapshots",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        const days = parseInt(c.req.query('days') || '30');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const snapshots = await db.select()
          .from(portfolioSnapshots)
          .where(eq(portfolioSnapshots.userId, userId))
          .orderBy(desc(portfolioSnapshots.snapshotDate))
          .limit(days);

        return c.json({ snapshots: snapshots.reverse() });
      } catch (error: any) {
        logger?.error('Portfolio snapshots error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/portfolio/tax-export",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        const year = c.req.query('year') || new Date().getFullYear();
        const format = c.req.query('format') || 'csv';
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const txs = await db.select()
          .from(portfolioTransactions)
          .where(eq(portfolioTransactions.userId, userId))
          .orderBy(portfolioTransactions.txTimestamp);

        const taxableTxs = txs.filter(tx => 
          tx.txType === 'sell' || tx.txType === 'swap'
        ).map(tx => ({
          date: tx.txTimestamp,
          type: tx.txType,
          asset: tx.tokenOut || tx.tokenIn,
          amount: tx.amountOut || tx.amountIn,
          proceeds: tx.valueUsd,
          costBasis: tx.valueUsd,
          gain: tx.realizedPnlUsd,
          method: tx.costBasisMethod
        }));

        if (format === 'csv') {
          const headers = 'Date,Type,Asset,Amount,Proceeds,Cost Basis,Gain/Loss,Method\n';
          const rows = taxableTxs.map(t => 
            `${t.date},${t.type},${t.asset},${t.amount},${t.proceeds},${t.costBasis},${t.gain},${t.method}`
          ).join('\n');
          
          c.header('Content-Type', 'text/csv');
          c.header('Content-Disposition', `attachment; filename="pulse-tax-report-${year}.csv"`);
          return c.body(headers + rows);
        }

        return c.json({ transactions: taxableTxs, year, format });
      } catch (error: any) {
        logger?.error('Tax export error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  }
];
