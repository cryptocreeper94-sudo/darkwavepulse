import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { PricingPlan } from '../services/checkoutService';

interface PricingCardProps {
  plan: PricingPlan;
  onSelect?: (plan: PricingPlan) => void;
}

export function PricingCard({ plan, onSelect }: PricingCardProps) {
  const isPopular = plan.popular;
  const isDisabled = plan.disabled;

  return (
    <View style={[styles.container, isPopular && styles.popularContainer]}>
      {plan.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{plan.badge}</Text>
        </View>
      )}

      {plan.trialBadge && (
        <View style={styles.trialBadge}>
          <Text style={styles.trialBadgeText}>{plan.trialBadge}</Text>
        </View>
      )}

      <Text style={styles.name}>{plan.name}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{plan.price}</Text>
        <Text style={styles.period}>{plan.period}</Text>
      </View>

      {plan.savings && (
        <Text style={styles.savings}>{plan.savings}</Text>
      )}

      <Text style={styles.description}>{plan.description}</Text>

      <View style={styles.features}>
        {plan.features.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isPopular && styles.primaryButton,
          isDisabled && styles.disabledButton,
        ]}
        onPress={() => !isDisabled && onSelect?.(plan)}
        disabled={isDisabled}
      >
        <Text style={[
          styles.buttonText,
          isPopular && styles.primaryButtonText,
          isDisabled && styles.disabledButtonText,
        ]}>
          {isDisabled ? 'Current Plan' : plan.action === 'subscribe_founder' ? 'Claim Founder Access' : 'Start Free Trial'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  popularContainer: {
    borderColor: '#00d4aa',
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#00d4aa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0a0a0a',
    letterSpacing: 0.5,
  },
  trialBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00d4aa',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  period: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
  },
  savings: {
    fontSize: 12,
    color: '#00d4aa',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  features: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 14,
    color: '#00d4aa',
    marginRight: 8,
    fontWeight: '600',
  },
  featureText: {
    fontSize: 13,
    color: '#ccc',
    flex: 1,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#00d4aa',
    borderColor: '#00d4aa',
  },
  disabledButton: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  primaryButtonText: {
    color: '#0a0a0a',
  },
  disabledButtonText: {
    color: '#666',
  },
});

export default PricingCard;
