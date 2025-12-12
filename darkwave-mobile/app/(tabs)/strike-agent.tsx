import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TokenCard } from '../../src/components/TokenCard';
import { TradeModal } from '../../src/components/TradeModal';
import { marketService, Token } from '../../src/services/marketService';
import { tradeService } from '../../src/services/tradeService';

export default function StrikeAgentTab() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(100000);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);

  const fetchTokens = useCallback(async () => {
    try {
      setError(null);
      const response = await marketService.discoverTokens();
      if (response.success) {
        setTokens(response.tokens);
      } else {
        setError('Failed to load tokens');
      }
    } catch (err) {
      setError('Network error');
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    const portfolio = await tradeService.getPortfolio();
    setBalance(portfolio.balance);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTokens(), fetchPortfolio()]);
      setLoading(false);
    };
    loadData();
  }, [fetchTokens, fetchPortfolio]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTokens(), fetchPortfolio()]);
    setRefreshing(false);
  };

  const handleBuy = (token: Token) => {
    setSelectedToken(token);
    setTradeModalVisible(true);
  };

  const handleTradeComplete = () => {
    fetchPortfolio();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={24} color="#00d4aa" />
          <Text style={styles.headerTitle}>StrikeAgent</Text>
        </View>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceLabel}>BALANCE</Text>
          <Text style={styles.balanceValue}>{tradeService.formatCurrency(balance)}</Text>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <View style={styles.infoIcon}>
          <Text style={styles.infoIconText}>📊</Text>
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>AI Token Discovery</Text>
          <Text style={styles.infoText}>Tokens analyzed for safety, liquidity, and momentum</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d4aa" />
          <Text style={styles.loadingText}>Discovering tokens...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="search" size={16} color="#00d4aa" />
              <Text style={styles.statValue}>{tokens.length}</Text>
              <Text style={styles.statLabel}>Tokens Found</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="shield-checkmark" size={16} color="#39FF14" />
              <Text style={styles.statValue}>{tokens.filter(t => t.safetyGrade === 'A').length}</Text>
              <Text style={styles.statLabel}>Grade A</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={16} color="#00d9ff" />
              <Text style={styles.statValue}>{tokens.filter(t => t.priceChange24h > 0).length}</Text>
              <Text style={styles.statLabel}>Positive 24h</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Discovered Tokens</Text>

          {tokens.map((token) => (
            <TokenCard
              key={token.address}
              token={token}
              onPress={() => {}}
              onBuy={handleBuy}
            />
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <TradeModal
        visible={tradeModalVisible}
        token={selectedToken}
        balance={balance}
        onClose={() => setTradeModalVisible(false)}
        onTradeComplete={handleTradeComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 50,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00d4aa',
    marginLeft: 8,
    letterSpacing: 1,
  },
  balanceBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  balanceLabel: {
    fontSize: 9,
    color: '#666',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00d9ff',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
  },
  infoIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoIconText: {
    fontSize: 18,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4aa',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#00d4aa',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
});
