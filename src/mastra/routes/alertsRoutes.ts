import { db } from '../../db/client.js';
import { priceAlerts, whaleAlerts, smartMoneyWallets, notificationChannels, notificationLogs, whaleTransactions } from '../../db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const alertsRoutes = [
  {
    path: "/api/alerts/price",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const alerts = await db.select()
          .from(priceAlerts)
          .where(eq(priceAlerts.userId, userId))
          .orderBy(desc(priceAlerts.createdAt));

        return c.json({ alerts });
      } catch (error: any) {
        logger?.error('Price alerts error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/alerts/price",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const body = await c.req.json();
        const { userId, tokenSymbol, tokenAddress, chain, alertType, condition, targetPrice, targetPercent, note } = body;
        
        if (!userId || !tokenSymbol || !alertType || !condition) {
          return c.json({ error: 'Missing required fields' }, 400);
        }

        const alert = {
          id: uuidv4(),
          userId,
          tokenSymbol,
          tokenAddress,
          chain: chain || 'all',
          alertType,
          condition,
          targetPrice: targetPrice?.toString(),
          targetPercent: targetPercent?.toString(),
          note,
          isActive: true,
          isTriggered: false,
          notifyTelegram: true,
          notifyEmail: false,
          notifyPush: false,
          createdAt: new Date()
        };

        await db.insert(priceAlerts).values(alert);
        logger?.info('Created price alert', { userId, tokenSymbol, alertType });

        return c.json({ success: true, alert });
      } catch (error: any) {
        logger?.error('Create alert error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/alerts/price/:id",
    method: "DELETE" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const alertId = c.req.param('id');
        await db.delete(priceAlerts).where(eq(priceAlerts.id, alertId));
        return c.json({ success: true });
      } catch (error: any) {
        logger?.error('Delete alert error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/alerts/whale",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const alerts = await db.select()
          .from(whaleAlerts)
          .where(eq(whaleAlerts.userId, userId))
          .orderBy(desc(whaleAlerts.createdAt));

        return c.json({ alerts });
      } catch (error: any) {
        logger?.error('Whale alerts error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/alerts/whale",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const body = await c.req.json();
        const { userId, watchedAddress, addressLabel, chain, minAmountUsd } = body;
        
        if (!userId || !watchedAddress || !chain) {
          return c.json({ error: 'Missing required fields' }, 400);
        }

        const alert = {
          id: uuidv4(),
          userId,
          watchedAddress,
          addressLabel,
          chain,
          minAmountUsd: minAmountUsd?.toString() || '10000',
          alertOnBuy: true,
          alertOnSell: true,
          alertOnTransfer: false,
          isActive: true,
          createdAt: new Date()
        };

        await db.insert(whaleAlerts).values(alert);
        return c.json({ success: true, alert });
      } catch (error: any) {
        logger?.error('Create whale alert error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/alerts/smart-money",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const chain = c.req.query('chain') || 'solana';
        const limit = parseInt(c.req.query('limit') || '50');

        const wallets = await db.select()
          .from(smartMoneyWallets)
          .where(eq(smartMoneyWallets.chain, chain))
          .orderBy(desc(smartMoneyWallets.totalPnlUsd))
          .limit(limit);

        return c.json({ wallets });
      } catch (error: any) {
        logger?.error('Smart money error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/alerts/whale-transactions",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const chain = c.req.query('chain') || 'solana';
        const limit = parseInt(c.req.query('limit') || '50');

        const txs = await db.select()
          .from(whaleTransactions)
          .where(eq(whaleTransactions.chain, chain))
          .orderBy(desc(whaleTransactions.txTimestamp))
          .limit(limit);

        return c.json({ transactions: txs });
      } catch (error: any) {
        logger?.error('Whale transactions error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/alerts/notifications",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        const limit = parseInt(c.req.query('limit') || '50');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const notifications = await db.select()
          .from(notificationLogs)
          .where(eq(notificationLogs.userId, userId))
          .orderBy(desc(notificationLogs.createdAt))
          .limit(limit);

        return c.json({ notifications });
      } catch (error: any) {
        logger?.error('Notifications error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/alerts/channels",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const channels = await db.select()
          .from(notificationChannels)
          .where(eq(notificationChannels.userId, userId));

        return c.json({ channels });
      } catch (error: any) {
        logger?.error('Channels error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/alerts/channels",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { userId, channelType, channelValue } = await c.req.json();
        if (!userId || !channelType || !channelValue) {
          return c.json({ error: 'Missing required fields' }, 400);
        }

        const channel = {
          id: uuidv4(),
          userId,
          channelType,
          channelValue,
          isVerified: false,
          isActive: true,
          createdAt: new Date()
        };

        await db.insert(notificationChannels).values(channel);
        return c.json({ success: true, channel });
      } catch (error: any) {
        logger?.error('Create channel error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  }
];
