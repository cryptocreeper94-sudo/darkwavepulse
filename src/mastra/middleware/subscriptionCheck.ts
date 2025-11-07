import { db } from "../../db/client.js";
import { subscriptions, userUsage } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export async function checkSubscriptionLimit(userId: string, feature: 'search' | 'alert'): Promise<{ allowed: boolean; isPremium: boolean; message?: string }> {
  try {
    // Get user's subscription status
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    
    const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active';
    
    // Premium users have unlimited access
    if (isPremium) {
      return { allowed: true, isPremium: true };
    }
    
    // Free users have limits
    const limits = {
      search: 10,
      alert: 3
    };
    
    // Get or create usage record
    let [usage] = await db
      .select()
      .from(userUsage)
      .where(eq(userUsage.userId, userId));
    
    if (!usage) {
      // Create new usage record
      await db.insert(userUsage).values({
        userId,
        searchCount: 0,
        alertCount: 0,
      });
      usage = { userId, searchCount: 0, alertCount: 0, lastResetDate: new Date(), createdAt: new Date(), updatedAt: new Date() };
    }
    
    // Check if we need to reset (daily reset)
    const now = new Date();
    const lastReset = new Date(usage.lastResetDate);
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceReset >= 1) {
      // Reset counts
      await db.update(userUsage)
        .set({ searchCount: 0, alertCount: 0, lastResetDate: now, updatedAt: now })
        .where(eq(userUsage.userId, userId));
      usage.searchCount = 0;
      usage.alertCount = 0;
    }
    
    // Check current usage
    const currentCount = feature === 'search' ? usage.searchCount : usage.alertCount;
    const limit = limits[feature];
    
    if (currentCount >= limit) {
      return {
        allowed: false,
        isPremium: false,
        message: `Daily limit reached (${limit} ${feature}es per day on free plan). Upgrade to Premium for unlimited access!`
      };
    }
    
    // Increment usage
    const updateField = feature === 'search' ? { searchCount: currentCount + 1 } : { alertCount: currentCount + 1 };
    await db.update(userUsage)
      .set({ ...updateField, updatedAt: now })
      .where(eq(userUsage.userId, userId));
    
    return { allowed: true, isPremium: false };
  } catch (error) {
    // SECURITY: Fail closed on errors to prevent bypass
    console.error('Subscription check error:', error);
    return { 
      allowed: false, 
      isPremium: false, 
      message: 'Unable to verify subscription status. Please try again.' 
    };
  }
}
