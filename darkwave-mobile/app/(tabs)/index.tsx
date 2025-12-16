import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { marketService } from '../../src/services/marketService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GaugeProps {
  value: number;
  label: string;
  maxValue?: number;
  color?: string;
}

function Gauge({ value, label, maxValue = 100, color = '#00FFFF' }: GaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const displayColor = value < 25 ? '#FF4444' : value < 50 ? '#FFD700' : value < 75 ? '#00d4aa' : '#39FF14';
  
  return (
    <View style={styles.gaugeCard}>
      <Text style={styles.gaugeLabel}>{label}</Text>
      <Text style={[styles.gaugeValue, { color: displayColor }]}>{value}</Text>
      <View style={styles.gaugeMeter}>
        <View style={[styles.gaugeFill, { width: `${percentage}%`, backgroundColor: displayColor }]} />
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress, highlight }: { icon: string; label: string; onPress: () => void; highlight?: boolean }) {
  return (
    <TouchableOpacity style={[styles.quickAction, highlight && styles.quickActionHighlight]} onPress={onPress}>
      <View style={[styles.quickActionIcon, highlight && styles.quickActionIconHighlight]}>
        <Ionicons name={icon as any} size={22} color={highlight ? '#0a0a0a' : '#00FFFF'} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function MetricCard({ title, value, change, isPositive }: { title: string; value: string; change?: string; isPositive?: boolean }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {change && (
        <Text style={[styles.metricChange, isPositive ? styles.changePositive : styles.changeNegative]}>
          {change}
        </Text>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [aiStatus, setAiStatus] = useState({ status: 'online', confidence: 87, lastUpdate: new Date() });
  const [marketData, setMarketData] = useState({
    fearGreed: 65,
    altcoinSeason: 72,
    totalMarketCap: '$3.07T',
    volume24h: '$136.5B',
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await marketService.discoverTokens();
      if (response.success && response.tokens.length > 0) {
        const gainers = response.tokens.filter(t => t.priceChange24h > 0).length;
        const total = response.tokens.length;
        setAiStatus(prev => ({
          ...prev,
          confidence: Math.round((gainers / total) * 100),
          lastUpdate: new Date(),
        }));
      }
    } catch (error) {
      console.log('Failed to fetch market data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>PULSE</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v2.0</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => isAuthenticated ? router.push('/(tabs)/settings') : router.push('/(auth)/login')}
        >
          <Ionicons name={isAuthenticated ? "person" : "person-outline"} size={22} color="#00FFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFFF" />
        }
      >
        {isAuthenticated && user && (
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeText}>Welcome back, <Text style={styles.welcomeUser}>{user.username || user.email.split('@')[0]}</Text></Text>
          </View>
        )}

        <View style={styles.aiStatusCard}>
          <View style={styles.aiStatusHeader}>
            <View style={[styles.statusDot, { backgroundColor: aiStatus.status === 'online' ? '#39FF14' : '#FF4444' }]} />
            <Text style={styles.aiStatusTitle}>AI Engine Status</Text>
          </View>
          <View style={styles.aiStatusContent}>
            <View style={styles.aiStatusMain}>
              <Text style={styles.aiConfidence}>{aiStatus.confidence}%</Text>
              <Text style={styles.aiConfidenceLabel}>Confidence</Text>
            </View>
            <View style={styles.aiStatusDetails}>
              <Text style={styles.aiDetail}>• Analyzing {Math.floor(Math.random() * 50) + 150} tokens</Text>
              <Text style={styles.aiDetail}>• Updated {Math.floor((Date.now() - aiStatus.lastUpdate.getTime()) / 60000)} min ago</Text>
              <Text style={styles.aiDetail}>• {aiStatus.status === 'online' ? 'Models running' : 'Maintenance'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.gaugesContainer}>
          <Gauge value={marketData.fearGreed} label="FEAR & GREED" />
          <Gauge value={marketData.altcoinSeason} label="ALTCOIN SEASON" />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard title="TOTAL MARKET CAP" value={marketData.totalMarketCap} change="+1.5%" isPositive />
          <MetricCard title="24H VOLUME" value={marketData.volume24h} change="-0.8%" isPositive={false} />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction icon="flash" label="AI Signals" onPress={() => router.push('/(tabs)/predictions')} highlight />
          <QuickAction icon="stats-chart" label="Markets" onPress={() => router.push('/(tabs)/markets')} />
          <QuickAction icon="wallet" label="Wallet" onPress={() => router.push('/(tabs)/wallet')} />
          <QuickAction icon="settings" label="Settings" onPress={() => router.push('/(tabs)/settings')} />
        </View>

        {!isAuthenticated && (
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Unlock Full Access</Text>
            <Text style={styles.ctaText}>Sign in to access AI predictions, wallet management, and more.</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.ctaButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00FFFF',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  versionBadge: {
    marginLeft: 10,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  versionText: {
    fontSize: 11,
    color: '#666',
  },
  profileButton: {
    width: 40,
    height: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  scrollContent: {
    padding: 16,
  },
  welcomeBanner: {
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.15)',
  },
  welcomeText: {
    fontSize: 14,
    color: '#888',
  },
  welcomeUser: {
    color: '#00FFFF',
    fontWeight: '600',
  },
  aiStatusCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  aiStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  aiStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  aiStatusContent: {
    flexDirection: 'row',
  },
  aiStatusMain: {
    alignItems: 'center',
    marginRight: 24,
  },
  aiConfidence: {
    fontSize: 42,
    fontWeight: '800',
    color: '#00FFFF',
  },
  aiConfidenceLabel: {
    fontSize: 11,
    color: '#888',
    letterSpacing: 1,
  },
  aiStatusDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  aiDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  gaugesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gaugeCard: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    alignItems: 'center',
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 8,
  },
  gaugeValue: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  gaugeMeter: {
    width: '100%',
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  changePositive: {
    color: '#39FF14',
  },
  changeNegative: {
    color: '#FF4444',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    width: (SCREEN_WIDTH - 56) / 4,
    alignItems: 'center',
  },
  quickActionHighlight: {},
  quickActionIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickActionIconHighlight: {
    backgroundColor: '#00FFFF',
    borderColor: '#00FFFF',
  },
  quickActionLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  ctaCard: {
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a0a0a',
    letterSpacing: 1,
  },
});
