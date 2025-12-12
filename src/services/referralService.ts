import { db } from '../db/client';
import { referrals } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  referralCode: string;
}

class ReferralService {
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'PULSE-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async generateReferralCode(userId: string): Promise<string> {
    const existing = await db
      .select()
      .from(referrals)
      .where(and(
        eq(referrals.referrerUserId, userId),
        sql`${referrals.referredUserId} IS NULL`
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0].referralCode;
    }

    let code = this.generateCode();
    let attempts = 0;
    
    while (attempts < 5) {
      const duplicate = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referralCode, code))
        .limit(1);
      
      if (duplicate.length === 0) break;
      code = this.generateCode();
      attempts++;
    }

    const id = crypto.randomUUID();
    await db.insert(referrals).values({
      id,
      referrerUserId: userId,
      referredUserId: null,
      referralCode: code,
      status: 'pending',
      rewardAmount: '0',
    });

    return code;
  }

  async trackReferral(referralCode: string, newUserId: string): Promise<{ success: boolean; error?: string }> {
    const referral = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, referralCode))
      .limit(1);

    if (referral.length === 0) {
      return { success: false, error: 'Invalid referral code' };
    }

    const ref = referral[0];

    if (ref.referrerUserId === newUserId) {
      return { success: false, error: 'Cannot use your own referral code' };
    }

    if (ref.referredUserId) {
      return { success: false, error: 'Referral code already used' };
    }

    const rewardAmount = '5.00';

    await db
      .update(referrals)
      .set({
        referredUserId: newUserId,
        status: 'completed',
        rewardAmount,
      })
      .where(eq(referrals.id, ref.id));

    const newId = crypto.randomUUID();
    const newCode = this.generateCode();
    await db.insert(referrals).values({
      id: newId,
      referrerUserId: ref.referrerUserId,
      referredUserId: null,
      referralCode: newCode,
      status: 'pending',
      rewardAmount: '0',
    });

    return { success: true };
  }

  async getReferralStats(userId: string): Promise<ReferralStats> {
    const userReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerUserId, userId));

    let referralCode = '';
    let totalReferrals = 0;
    let completedReferrals = 0;
    let pendingReferrals = 0;
    let totalRewards = 0;

    for (const ref of userReferrals) {
      if (!ref.referredUserId) {
        referralCode = ref.referralCode;
        continue;
      }

      totalReferrals++;
      if (ref.status === 'completed' || ref.status === 'rewarded') {
        completedReferrals++;
        totalRewards += parseFloat(ref.rewardAmount || '0');
      } else if (ref.status === 'pending') {
        pendingReferrals++;
      }
    }

    if (!referralCode) {
      referralCode = await this.generateReferralCode(userId);
    }

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalRewards,
      referralCode,
    };
  }

  async getUserReferralCode(userId: string): Promise<string> {
    const stats = await this.getReferralStats(userId);
    return stats.referralCode;
  }
}

export const referralService = new ReferralService();
