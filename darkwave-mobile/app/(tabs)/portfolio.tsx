import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { tradeService, Portfolio, Position } from '../../src/services/tradeService';

function PositionCard({ position, onSell }: { position: Position; onSell: (position: Position) => void }) {
  const isProfit = position.pnl >= 0;
  const pnlColor = isProfit ? '#39FF14' : '#FF4444';

  return (
    <View style={styles.positionCard}>
      <View style={styles.positionHeader}>
        <View style={styles.positionInfo}>
          <Text style={styles.positionSymbol}>{position.symbol}</Text>
          <Text style={styles.positionName} numberOfLines={1}>{position.name}</Text>
        </View>
        <View style={styles.positionValue}>
          <Text style={styles.positionValueAmount}>{tradeService.formatCurrency(position.value)}</Text>
          <Text style={[styles.positionPnl, { color: pnlColor }]}>
            {tradeService.formatPercent(position.pnlPercent)}
          </Text>
        </View>
      </View>

      <View style={styles.positionDetails}>
        <View style={styles.positionDetail}>
          <Text style={styles.detailLabel}>Entry</Text>
          <Text style={styles.detailValue}>${position.entryPrice.toFixed(6)}</Text>
        </View>
        <View style={styles.positionDetail}>
          <Text style={styles.detailLabel}>Current</Text>
          <Text style={styles.detailValue}>${position.currentPrice.toFixed(6)}</Text>
        </View>
        <View style={styles.positionDetail}>
          <Text style={styles.detailLabel}>Qty</Text>
          <Text style={styles.detailValue}>{position.quantity.toFixed(2)}</Text>
        </View>
        <View style={styles.positionDetail}>
          <Text style={styles.detailLabel}>P&L</Text>
          <Text style={[styles.detailValue, { color: pnlColor }]}>{tradeService.formatCurrency(position.pnl)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.sellButton} onPress={() => onSell(position)}>
        <Text style={styles.sellButtonText}>SELL</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PortfolioTab() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selling, setSelling] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    const data = await tradeService.getPortfolio();
    setPortfolio(data);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPortfolio();
      setLoading(false);
    };
    loadData();
  }, [fetchPortfolio]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPortfolio();
    setRefreshing(false);
  };

  const handleSell = async (position: Position) => {
    Alert.alert(
      'Sell Position',
      `Are you sure you want to sell all ${position.symbol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sell',
          style: 'destructive',
          onPress: async () => {
            setSelling(position.address);
            const result = await tradeService.sellToken(position.address);
            setSelling(null);
            if (result.success) {
              fetchPortfolio();
            } else {
              Alert.alert('Error', result.message || 'Failed to sell');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d4aa" />
          <Text style={styles.loadingText}>Loading portfolio...</Text>
        </View>
      </View>
    );
  }

  const totalPnlColor = (portfolio?.totalPnl || 0) >= 0 ? '#39FF14' : '#FF4444';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>PAPER TRADING</Text>
        </View>
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>{tradeService.formatCurrency(portfolio?.totalValue || 0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Balance</Text>
            <Text style={styles.summaryItemValue}>{tradeService.formatCurrency(portfolio?.balance || 0)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>P&L</Text>
            <Text style={[styles.summaryItemValue, { color: totalPnlColor }]}>
              {tradeService.formatCurrency(portfolio?.totalPnl || 0)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Trades</Text>
            <Text style={styles.summaryItemValue}>{portfolio?.tradeCount || 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d4aa"
            colors={['#00d4aa']}
          />
        }
      >
        <Text style={styles.sectionTitle}>Open Positions</Text>

        {portfolio?.positions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No Positions</Text>
            <Text style={styles.emptyText}>Trade tokens in the StrikeAgent tab to see them here</Text>
          </View>
        ) : (
          portfolio?.positions.map((position) => (
            <PositionCard key={position.address} position={position} onSell={handleSell} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#888',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  demoBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00d4aa',
    letterSpacing: 0.5,
  },
  summarySection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  summaryCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00d9ff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  summaryItemLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
  },
  positionCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    marginBottom: 12,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  positionInfo: {
    flex: 1,
  },
  positionSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d4aa',
  },
  positionName: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  positionValue: {
    alignItems: 'flex-end',
  },
  positionValueAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  positionPnl: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  positionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  positionDetail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '500',
  },
  sellButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sellButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF4444',
    letterSpacing: 1,
  },
});
