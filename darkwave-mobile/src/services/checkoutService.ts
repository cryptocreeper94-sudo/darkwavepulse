import * as WebBrowser from 'expo-web-browser';
import apiClient from './apiClient';

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  badge?: string;
  trialBadge?: string;
  savings?: string;
  popular?: boolean;
  disabled?: boolean;
  action?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free_demo',
    name: 'Free Demo',
    price: '$0',
    period: 'forever',
    description: 'Paper trading to learn the ropes',
    features: [
      'Paper trading mode',
      '10 AI discoveries/day',
      'Basic safety checks',
      'Trade history',
    ],
    disabled: true,
  },
  {
    id: 'rm_monthly',
    name: 'RM+ Monthly',
    badge: 'RECOMMENDED',
    trialBadge: '3-DAY FREE TRIAL',
    price: '$8',
    period: '/month',
    description: 'Full trading power unlocked',
    features: [
      'Real trading enabled',
      'Unlimited AI discoveries',
      'Advanced safety (anti-MEV, honeypot)',
      'Multi-chain support (23 chains)',
      'Built-in wallet',
      '3-day free trial',
    ],
    popular: true,
    action: 'subscribe_monthly',
  },
  {
    id: 'rm_annual',
    name: 'RM+ Annual',
    trialBadge: '3-DAY FREE TRIAL',
    price: '$80',
    period: '/year',
    savings: 'Save 17% (2 months free)',
    description: 'Best value for serious traders',
    features: [
      'Everything in Monthly',
      '2 months FREE',
      'Priority support',
      'Early feature access',
    ],
    action: 'subscribe_annual',
  },
  {
    id: 'legacy_founder',
    name: 'Legacy Founder',
    badge: 'LIMITED TIME',
    price: '$24',
    period: 'one-time',
    savings: '6 months + 35K DWAV tokens',
    description: 'Early supporter exclusive offer',
    features: [
      '6 months full access',
      '35,000 DWAV tokens',
      'Founder badge',
      'No recurring billing',
      'Launch celebration access',
    ],
    action: 'subscribe_founder',
  },
];

export const checkoutService = {
  async initiateCheckout(planId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post('/api/demo/checkout', {
        planId,
        returnUrl: 'strikeagent://checkout-complete',
      });

      if (response.data.checkoutUrl) {
        await WebBrowser.openBrowserAsync(response.data.checkoutUrl);
        return { success: true };
      }

      return {
        success: false,
        message: 'No checkout URL received',
      };
    } catch (error: any) {
      console.error('Checkout failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Checkout failed',
      };
    }
  },

  getPlanById(planId: string): PricingPlan | undefined {
    return PRICING_PLANS.find((plan) => plan.id === planId);
  },

  getAvailablePlans(): PricingPlan[] {
    return PRICING_PLANS.filter((plan) => !plan.disabled);
  },
};

export default checkoutService;
