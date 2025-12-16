import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { tradeService, Portfolio } from '../../src/services/tradeService';

function WalletCard({ title, address, balance, chain, onPress }: { 
  title: string; 
  address: string; 
  balance: string; 
  chain: string;
  onPress?: () => void;
}) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  return (
    <TouchableOpacity style={styles.walletCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.walletHeader}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletTitle}>{title}</Text>
          <View style={styles.chainBadge}>
            <Text style={styles.chainText}>{chain}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#666" />
      </View>
      <View style={styles.walletBody}>
        <Text style={styles.walletBalance}>{balance}</Text>
        <TouchableOpacity 
          style={styles.addressRow}
          onPress={() => {
            Alert.alert('Address Copied', address);
          }}
        >
          <Text style={styles.walletAddress}>{shortAddress}</Text>
          <Ionicons name="copy-outline" size={14} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function PositionItem({ symbol, value, pnl, pnlPercent }: { symbol: string; value: number; pnl: number; pnlPercent: number }) {
  const isProfit = pnl >= 0;
  const pnlColor = isProfit ? '#39FF14' : '#FF4444';
  
  return (
    <View style={styles.positionItem}>
      <Text style={styles.positionSymbol}>{symbol}</Text>
      <View style={styles.positionRight}>
        <Text style={styles.positionValue}>${value.toFixed(2)}</Text>
        <Text style={[styles.positionPnl, { color: pnlColor }]}>
          {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const { isAuthenticated, user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = useCallback(async () => {
    try {
      const data = await tradeService.getPortfolio();
      setPortfolio(data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchWalletData();
      setLoading(false);
    };
    loadData();
  }, [fetchWalletData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  const totalPnlColor = (portfolio?.totalPnl || 0) >= 0 ? '#39FF14' : '#FF4444';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>PAPER TRADING</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFFF" />
          }
        >
          <View style={styles.totalValueCard}>
            <Text style={styles.totalValueLabel}>Total Portfolio Value</Text>
            <Text style={styles.totalValue}>{tradeService.formatCurrency(portfolio?.totalValue || 0)}</Text>
            <View style={styles.pnlRow}>
              <Text style={[styles.totalPnl, { color: totalPnlColor }]}>
                {(portfolio?.totalPnl || 0) >= 0 ? '+' : ''}{tradeService.formatCurrency(portfolio?.totalPnl || 0)}
              </Text>
              <Text style={[styles.totalPnlPercent, { color: totalPnlColor }]}>
                ({(portfolio?.totalPnlPercent || 0) >= 0 ? '+' : ''}{(portfolio?.totalPnlPercent || 0).toFixed(2)}%)
              </Text>
            </View>
          </View>

          <View style={styles.balanceCards}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available</Text>
              <Text style={styles.balanceValue}>{tradeService.formatCurrency(portfolio?.balance || 0)}</Text>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>In Positions</Text>
              <Text style={styles.balanceValue}>
                {tradeService.formatCurrency((portfolio?.totalValue || 0) - (portfolio?.balance || 0))}
              </Text>
            </View>
          </View>

          {!isAuthenticated && (
            <View style={styles.connectBanner}>
              <Ionicons name="wallet" size={24} color="#00FFFF" />
              <View style={styles.connectBannerContent}>
                <Text style={styles.connectBannerTitle}>Connect Your Wallet</Text>
                <Text style={styles.connectBannerText}>Sign in to connect external wallets and enable real trading</Text>
              </View>
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.connectButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Paper Wallets</Text>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={18} color="#00FFFF" />
              </TouchableOpacity>
            </View>
            
            <WalletCard
              title="Demo Wallet"
              address="DemoWallet1234567890abcdefghijklmnopqrstuvwxyz"
              balance={tradeService.formatCurrency(portfolio?.balance || 100000)}
              chain="Solana"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Positions</Text>
              <Text style={styles.positionCount}>{portfolio?.positions.length || 0}</Text>
            </View>
            
            {portfolio?.positions.length === 0 ? (
              <View style={styles.emptyPositions}>
                <Ionicons name="layers-outline" size={40} color="#333" />
                <Text style={styles.emptyText}>No active positions</Text>
                <TouchableOpacity 
                  style={styles.tradeButton}
                  onPress={() => router.push('/(tabs)/predictions')}
                >
                  <Text style={styles.tradeButtonText}>Start Trading</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.positionsList}>
                {portfolio?.positions.map((position) => (
                  <PositionItem
                    key={position.address}
                    symbol={position.symbol}
                    value={position.value}
                    pnl={position.pnl}
                    pnlPercent={position.pnlPercent}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download" size={20} color="#00FFFF" />
              <Text style={styles.actionButtonText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane" size={20} color="#00FFFF" />
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="swap-horizontal" size={20} color="#00FFFF" />
              <Text style={styles.actionButtonText}>Swap</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  demoBadge: {
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00FFFF',
    letterSpacing: 0.5,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  totalValueCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  totalValueLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#00FFFF',
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  totalPnl: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalPnlPercent: {
    fontSize: 14,
  },
  balanceCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    gap: 12,
  },
  connectBannerContent: {
    flex: 1,
  },
  connectBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  connectBannerText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  connectButton: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 28,
    height: 28,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  positionCount: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  walletCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  chainBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chainText: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  walletBody: {},
  walletBalance: {
    fontSize: 22,
    fontWeight: '700',
    color: '#00FFFF',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  emptyPositions: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 16,
  },
  tradeButton: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  positionsList: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  positionSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00FFFF',
  },
  positionRight: {
    alignItems: 'flex-end',
  },
  positionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  positionPnl: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00FFFF',
  },
});
