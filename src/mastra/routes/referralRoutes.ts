import { db } from '../../db/client.js';
import { referralCodes, referralAttributions, referralPayouts } from '../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

function generateReferralCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const referralRoutes = [
  {
    path: "/api/referral/code",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const existing = await db.select()
          .from(referralCodes)
          .where(eq(referralCodes.userId, userId))
          .limit(1);

        if (existing.length > 0) {
          return c.json({ code: existing[0] });
        }

        const newCode = {
          id: uuidv4(),
          userId,
          code: generateReferralCode(),
          rewardPercent: '10',
          lifetimeReferrals: 0,
          lifetimeEarningsUsd: '0',
          pendingPayoutUsd: '0',
          isActive: true,
          createdAt: new Date()
        };

        await db.insert(referralCodes).values(newCode);
        return c.json({ code: newCode });
      } catch (error: any) {
        logger?.error('Referral code error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/referral/apply",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { referralCode, newUserId } = await c.req.json();
        if (!referralCode || !newUserId) {
          return c.json({ error: 'referralCode and newUserId required' }, 400);
        }

        const codeRecord = await db.select()
          .from(referralCodes)
          .where(eq(referralCodes.code, referralCode.toUpperCase()))
          .limit(1);

        if (codeRecord.length === 0 || !codeRecord[0].isActive) {
          return c.json({ error: 'Invalid referral code' }, 400);
        }

        const existingAttribution = await db.select()
          .from(referralAttributions)
          .where(eq(referralAttributions.referredUserId, newUserId))
          .limit(1);

        if (existingAttribution.length > 0) {
          return c.json({ error: 'User already has a referrer' }, 400);
        }

        const attribution = {
          id: uuidv4(),
          referrerUserId: codeRecord[0].userId,
          referredUserId: newUserId,
          referralCode: referralCode.toUpperCase(),
          signupDate: new Date(),
          totalSpendUsd: '0',
          commissionPaidUsd: '0',
          status: 'active'
        };

        await db.insert(referralAttributions).values(attribution);

        await db.update(referralCodes)
          .set({ lifetimeReferrals: sql`${referralCodes.lifetimeReferrals} + 1` })
          .where(eq(referralCodes.code, referralCode.toUpperCase()));

        logger?.info('Referral applied', { referralCode, newUserId });
        return c.json({ success: true });
      } catch (error: any) {
        logger?.error('Apply referral error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/referral/stats",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const codeRecord = await db.select()
          .from(referralCodes)
          .where(eq(referralCodes.userId, userId))
          .limit(1);

        if (codeRecord.length === 0) {
          return c.json({ 
            code: null,
            referrals: 0,
            earnings: '0',
            pending: '0'
          });
        }

        const referrals = await db.select()
          .from(referralAttributions)
          .where(eq(referralAttributions.referrerUserId, userId));

        return c.json({
          code: codeRecord[0].code,
          referrals: codeRecord[0].lifetimeReferrals,
          earnings: codeRecord[0].lifetimeEarningsUsd,
          pending: codeRecord[0].pendingPayoutUsd,
          recentReferrals: referrals.slice(0, 10)
        });
      } catch (error: any) {
        logger?.error('Referral stats error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/referral/payout",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { userId, payoutMethod, payoutAddress } = await c.req.json();
        if (!userId || !payoutMethod || !payoutAddress) {
          return c.json({ error: 'Missing required fields' }, 400);
        }

        const codeRecord = await db.select()
          .from(referralCodes)
          .where(eq(referralCodes.userId, userId))
          .limit(1);

        if (codeRecord.length === 0) {
          return c.json({ error: 'No referral code found' }, 400);
        }

        const pendingAmount = parseFloat(codeRecord[0].pendingPayoutUsd || '0');
        if (pendingAmount < 10) {
          return c.json({ error: 'Minimum payout is $10' }, 400);
        }

        const payout = {
          id: uuidv4(),
          userId,
          amountUsd: pendingAmount.toString(),
          payoutMethod,
          payoutAddress,
          status: 'pending',
          createdAt: new Date()
        };

        await db.insert(referralPayouts).values(payout);

        await db.update(referralCodes)
          .set({ pendingPayoutUsd: '0' })
          .where(eq(referralCodes.userId, userId));

        logger?.info('Payout requested', { userId, amount: pendingAmount });
        return c.json({ success: true, payout });
      } catch (error: any) {
        logger?.error('Payout error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  }
];
