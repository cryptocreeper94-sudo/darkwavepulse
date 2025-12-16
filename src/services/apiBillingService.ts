import Stripe from 'stripe';
import { db } from '../db/client';
import { apiSubscriptions, apiKeys } from '../db/schema';
import { eq } from 'drizzle-orm';
import { API_TIERS } from './apiKeyService';

export class ApiBillingService {
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    const subscriptionId = subscription.id;
    const metadata = subscription.metadata || {};
    const userId = metadata.userId;
    
    if (!userId) {
      console.error('[ApiBillingService] No userId in subscription metadata');
      return;
    }

    const planType = metadata.planType || 'api_pro';
    const tier = planType.includes('enterprise') ? 'enterprise' : 'pro';

    const existing = await db.select().from(apiSubscriptions).where(eq(apiSubscriptions.userId, userId));

    if (existing.length > 0) {
      await db.update(apiSubscriptions)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          tier,
          status: subscription.status === 'active' ? 'active' : subscription.status,
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date(),
        })
        .where(eq(apiSubscriptions.userId, userId));
    } else {
      await db.insert(apiSubscriptions).values({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        tier,
        status: subscription.status === 'active' ? 'active' : subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await this.upgradeApiKeysTier(userId, tier as keyof typeof API_TIERS);
    console.log(`[ApiBillingService] Created/updated subscription for user ${userId} with tier ${tier}`);
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const subscriptionId = subscription.id;
    
    const existing = await db.select().from(apiSubscriptions)
      .where(eq(apiSubscriptions.stripeSubscriptionId, subscriptionId));

    if (existing.length === 0) {
      console.warn(`[ApiBillingService] Subscription ${subscriptionId} not found for update`);
      return;
    }

    const record = existing[0];
    const metadata = subscription.metadata || {};
    const planType = metadata.planType || '';
    const tier = planType.includes('enterprise') ? 'enterprise' : 
                 planType.includes('pro') ? 'pro' : record.tier;

    await db.update(apiSubscriptions)
      .set({
        tier,
        status: subscription.status === 'active' ? 'active' : 
                subscription.status === 'canceled' ? 'canceled' : 
                subscription.status === 'past_due' ? 'past_due' : subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      })
      .where(eq(apiSubscriptions.stripeSubscriptionId, subscriptionId));

    if (tier !== record.tier) {
      await this.upgradeApiKeysTier(record.userId, tier as keyof typeof API_TIERS);
    }

    console.log(`[ApiBillingService] Updated subscription ${subscriptionId}`);
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const subscriptionId = subscription.id;
    
    const existing = await db.select().from(apiSubscriptions)
      .where(eq(apiSubscriptions.stripeSubscriptionId, subscriptionId));

    if (existing.length === 0) {
      console.warn(`[ApiBillingService] Subscription ${subscriptionId} not found for deletion`);
      return;
    }

    const record = existing[0];

    await db.update(apiSubscriptions)
      .set({
        tier: 'free',
        status: 'canceled',
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(apiSubscriptions.stripeSubscriptionId, subscriptionId));

    await this.upgradeApiKeysTier(record.userId, 'free');
    console.log(`[ApiBillingService] Deleted subscription ${subscriptionId}, downgraded user ${record.userId} to free tier`);
  }

  async getUserApiSubscription(userId: string): Promise<{
    tier: string;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null> {
    const records = await db.select().from(apiSubscriptions)
      .where(eq(apiSubscriptions.userId, userId));

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    return {
      tier: record.tier,
      status: record.status,
      currentPeriodEnd: record.currentPeriodEnd,
      cancelAtPeriodEnd: record.cancelAtPeriodEnd || false,
    };
  }

  async upgradeApiKeysTier(userId: string, tier: keyof typeof API_TIERS): Promise<void> {
    const tierConfig = API_TIERS[tier];
    
    await db.update(apiKeys)
      .set({
        tier,
        rateLimit: tierConfig.rateLimit,
        dailyLimit: tierConfig.dailyLimit,
        permissions: JSON.stringify(tierConfig.scopes),
      })
      .where(eq(apiKeys.userId, userId));

    console.log(`[ApiBillingService] Upgraded all API keys for user ${userId} to tier ${tier}`);
  }

  async getOrCreateStripeCustomer(userId: string, email?: string): Promise<string> {
    const existing = await db.select().from(apiSubscriptions)
      .where(eq(apiSubscriptions.userId, userId));

    if (existing.length > 0 && existing[0].stripeCustomerId) {
      return existing[0].stripeCustomerId;
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_LIVE_SECRET_KEY || '', {
      apiVersion: '2025-10-29.clover'
    });

    const customer = await stripe.customers.create({
      metadata: { userId },
      email: email || undefined,
    });

    if (existing.length > 0) {
      await db.update(apiSubscriptions)
        .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
        .where(eq(apiSubscriptions.userId, userId));
    } else {
      await db.insert(apiSubscriptions).values({
        userId,
        stripeCustomerId: customer.id,
        tier: 'free',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return customer.id;
  }
}

export const apiBillingService = new ApiBillingService();
