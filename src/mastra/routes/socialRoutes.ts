import { db } from '../../db/client.js';
import { socialProfiles, socialFollows, tradingSignals, leaderboardHistory } from '../../db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const socialRoutes = [
  {
    path: "/api/social/leaderboard",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const period = c.req.query('period') || 'weekly';
        const limit = parseInt(c.req.query('limit') || '50');

        const traders = await db.select()
          .from(socialProfiles)
          .where(eq(socialProfiles.isPublic, true))
          .orderBy(desc(socialProfiles.totalPnlUsd))
          .limit(limit);

        const rankedTraders = traders.map((t, i) => ({
          ...t,
          rank: i + 1
        }));

        return c.json({ traders: rankedTraders, period });
      } catch (error: any) {
        logger?.error('Leaderboard error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/social/profile",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const profiles = await db.select()
          .from(socialProfiles)
          .where(eq(socialProfiles.userId, userId))
          .limit(1);

        return c.json({ profile: profiles[0] || null });
      } catch (error: any) {
        logger?.error('Profile error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/social/profile",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { userId, displayName, bio, isPublic } = await c.req.json();
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const existing = await db.select()
          .from(socialProfiles)
          .where(eq(socialProfiles.userId, userId))
          .limit(1);

        if (existing.length > 0) {
          await db.update(socialProfiles)
            .set({ displayName, bio, isPublic, updatedAt: new Date() })
            .where(eq(socialProfiles.userId, userId));
          return c.json({ success: true, updated: true });
        }

        const profile = {
          id: uuidv4(),
          userId,
          displayName: displayName || 'Anonymous Trader',
          bio,
          isPublic: isPublic ?? true,
          verifiedTrader: false,
          followersCount: 0,
          followingCount: 0,
          totalTrades: 0,
          winRate: '0',
          totalPnlUsd: '0',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.insert(socialProfiles).values(profile);
        return c.json({ success: true, profile });
      } catch (error: any) {
        logger?.error('Create profile error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/social/follow",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { followerId, followedId } = await c.req.json();
        if (!followerId || !followedId) {
          return c.json({ error: 'followerId and followedId required' }, 400);
        }

        if (followerId === followedId) {
          return c.json({ error: 'Cannot follow yourself' }, 400);
        }

        const existing = await db.select()
          .from(socialFollows)
          .where(and(
            eq(socialFollows.followerId, followerId),
            eq(socialFollows.followedId, followedId)
          ))
          .limit(1);

        if (existing.length > 0) {
          return c.json({ error: 'Already following' }, 400);
        }

        const follow = {
          id: uuidv4(),
          followerId,
          followedId,
          copyTrading: false,
          notifyOnSignals: true,
          createdAt: new Date()
        };

        await db.insert(socialFollows).values(follow);

        await db.update(socialProfiles)
          .set({ followersCount: sql`${socialProfiles.followersCount} + 1` })
          .where(eq(socialProfiles.userId, followedId));

        await db.update(socialProfiles)
          .set({ followingCount: sql`${socialProfiles.followingCount} + 1` })
          .where(eq(socialProfiles.userId, followerId));

        return c.json({ success: true });
      } catch (error: any) {
        logger?.error('Follow error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/social/signals",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const limit = parseInt(c.req.query('limit') || '20');
        const userId = c.req.query('userId');

        let query = db.select()
          .from(tradingSignals)
          .where(eq(tradingSignals.isPublic, true))
          .orderBy(desc(tradingSignals.createdAt))
          .limit(limit);

        const signals = await query;

        return c.json({ signals });
      } catch (error: any) {
        logger?.error('Signals error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/social/signals",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { userId, tokenSymbol, tokenAddress, chain, signalType, entryPrice, targetPrice, stopLoss, reasoning, isPublic } = await c.req.json();
        if (!userId || !tokenSymbol || !signalType) {
          return c.json({ error: 'Missing required fields' }, 400);
        }

        const signal = {
          id: uuidv4(),
          userId,
          tokenSymbol,
          tokenAddress,
          chain: chain || 'solana',
          signalType,
          entryPrice: entryPrice?.toString(),
          targetPrice: targetPrice?.toString(),
          stopLoss: stopLoss?.toString(),
          reasoning,
          isPublic: isPublic ?? true,
          likesCount: 0,
          commentsCount: 0,
          copiesCount: 0,
          createdAt: new Date()
        };

        await db.insert(tradingSignals).values(signal);
        return c.json({ success: true, signal });
      } catch (error: any) {
        logger?.error('Create signal error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/social/following",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const following = await db.select()
          .from(socialFollows)
          .where(eq(socialFollows.followerId, userId))
          .orderBy(desc(socialFollows.createdAt));

        return c.json({ following });
      } catch (error: any) {
        logger?.error('Following error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  }
];
