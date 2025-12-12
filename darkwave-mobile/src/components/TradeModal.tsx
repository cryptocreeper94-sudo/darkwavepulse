import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import type { Token } from '../services/marketService';
import { marketService } from '../services/marketService';
import { tradeService } from '../services/tradeService';

interface TradeModalProps {
  visible: boolean;
  token: Token | null;
  balance: number;
  onClose: () => void;
  onTradeComplete: () => void;
}

export function TradeModal({ visible, token, balance, onClose, onTradeComplete }: TradeModalProps) {
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetAmounts = [100, 500, 1000, 5000];

  const handleBuy = async () => {
    if (!token) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Enter a valid amount');
      return;
    }

    if (amountNum > balance) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await tradeService.buyToken(token.address, token.symbol, token.name, amountNum);

    setLoading(false);

    if (result.success) {
      onTradeComplete();
      onClose();
      setAmount('100');
    } else {
      setError(result.message || 'Trade failed');
    }
  };

  if (!token) return null;

  const safetyColor = marketService.getSafetyColor(token.safetyGrade);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.symbol}>{token.symbol}</Text>
              <Text style={styles.name}>{token.name}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>CURRENT PRICE</Text>
            <Text style={styles.price}>${marketService.formatPrice(token.price)}</Text>
            <View style={styles.safetyRow}>
              <View style={[styles.safetyBadge, { borderColor: safetyColor }]}>
                <Text style={[styles.safetyGrade, { color: safetyColor }]}>{token.safetyGrade}</Text>
              </View>
              <Text style={styles.safetyLabel}>Safety: {token.safetyScore}/100</Text>
            </View>
          </View>

          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>{tradeService.formatCurrency(balance)}</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>TRADE AMOUNT (USD)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError(null);
              }}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor="#666"
            />
            <View style={styles.presets}>
              {presetAmounts.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetButton, amount === String(preset) && styles.presetActive]}
                  onPress={() => setAmount(String(preset))}
                >
                  <Text style={[styles.presetText, amount === String(preset) && styles.presetActiveText]}>
                    ${preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.estimateSection}>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>You'll receive (est.)</Text>
              <Text style={styles.estimateValue}>
                ~{token.price > 0 ? (parseFloat(amount || '0') / token.price).toFixed(2) : '0'} {token.symbol}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.buyButton, loading && styles.buyButtonLoading]}
            onPress={handleBuy}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={styles.buyButtonText}>BUY {token.symbol}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Paper trading only. No real funds are used.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  symbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00d4aa',
  },
  name: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#888',
  },
  priceSection: {
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  safetyBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  safetyGrade: {
    fontSize: 12,
    fontWeight: '700',
  },
  safetyLabel: {
    fontSize: 12,
    color: '#888',
  },
  balanceSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00d9ff',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  presetActive: {
    borderColor: '#00d4aa',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  presetText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  presetActiveText: {
    color: '#00d4aa',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#FF8888',
    textAlign: 'center',
  },
  estimateSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  estimateLabel: {
    fontSize: 12,
    color: '#888',
  },
  estimateValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: '#00d4aa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buyButtonLoading: {
    opacity: 0.7,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0a0a',
    letterSpacing: 1,
  },
  disclaimer: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});

export default TradeModal;
