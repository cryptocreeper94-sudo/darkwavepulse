import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Token } from '../services/marketService';
import { marketService } from '../services/marketService';

interface TokenCardProps {
  token: Token;
  onPress?: (token: Token) => void;
  onBuy?: (token: Token) => void;
}

export function TokenCard({ token, onPress, onBuy }: TokenCardProps) {
  const safetyColor = marketService.getSafetyColor(token.safetyGrade);
  const priceChangeColor = token.priceChange24h >= 0 ? '#39FF14' : '#FF4444';
  const priceChangePrefix = token.priceChange24h >= 0 ? '+' : '';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(token)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.tokenInfo}>
          <View style={styles.symbolContainer}>
            <Text style={styles.symbol}>{token.symbol}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{token.name}</Text>
        </View>
        <View style={[styles.safetyBadge, { borderColor: safetyColor }]}>
          <Text style={[styles.safetyGrade, { color: safetyColor }]}>{token.safetyGrade}</Text>
          <Text style={styles.safetyScore}>{token.safetyScore}</Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>${marketService.formatPrice(token.price)}</Text>
        <Text style={[styles.priceChange, { color: priceChangeColor }]}>
          {priceChangePrefix}{token.priceChange24h.toFixed(2)}%
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>VOL 24H</Text>
          <Text style={styles.statValue}>{marketService.formatVolume(token.volume)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>LIQ</Text>
          <Text style={styles.statValue}>{marketService.formatVolume(token.liquidity)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TXS</Text>
          <Text style={styles.statValue}>{token.txns24h.toLocaleString()}</Text>
        </View>
      </View>

      {token.risks.length > 0 && (
        <View style={styles.risksRow}>
          {token.risks.slice(0, 2).map((risk, i) => (
            <View key={i} style={styles.riskBadge}>
              <Text style={styles.riskText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}

      {onBuy && (
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => onBuy(token)}
        >
          <Text style={styles.buyButtonText}>PAPER TRADE</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tokenInfo: {
    flex: 1,
    marginRight: 10,
  },
  symbolContainer: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  symbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00d4aa',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 12,
    color: '#888',
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  safetyGrade: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 4,
  },
  safetyScore: {
    fontSize: 11,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '500',
  },
  risksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  riskBadge: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  riskText: {
    fontSize: 10,
    color: '#FF8888',
  },
  buyButton: {
    backgroundColor: '#00d4aa',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0a0a0a',
    letterSpacing: 1,
  },
});

export default TokenCard;
