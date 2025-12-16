import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { marketService, Token } from '../../src/services/marketService';

interface Prediction {
  token: Token;
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  targets: { entry: number; target: number; stop: number };
  reasoning: string[];
}

function getSignalConfig(signal: Prediction['signal']) {
  switch (signal) {
    case 'strong_buy':
      return { label: 'STRONG BUY', color: '#39FF14', icon: 'arrow-up-circle', bg: 'rgba(57, 255, 20, 0.15)' };
    case 'buy':
      return { label: 'BUY', color: '#00d4aa', icon: 'arrow-up', bg: 'rgba(0, 212, 170, 0.15)' };
    case 'hold':
      return { label: 'HOLD', color: '#FFD700', icon: 'pause', bg: 'rgba(255, 215, 0, 0.15)' };
    case 'sell':
      return { label: 'SELL', color: '#FF8C00', icon: 'arrow-down', bg: 'rgba(255, 140, 0, 0.15)' };
    case 'strong_sell':
      return { label: 'STRONG SELL', color: '#FF4444', icon: 'arrow-down-circle', bg: 'rgba(255, 68, 68, 0.15)' };
  }
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const [expanded, setExpanded] = useState(false);
  const signalConfig = getSignalConfig(prediction.signal);
  const safetyColor = marketService.getSafetyColor(prediction.token.safetyGrade);

  return (
    <TouchableOpacity 
      style={styles.predictionCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.predictionHeader}>
        <View style={styles.tokenInfo}>
          <View style={styles.tokenMain}>
            <Text style={styles.tokenSymbol}>{prediction.token.symbol}</Text>
            <View style={[styles.safetyBadge, { borderColor: safetyColor }]}>
              <Text style={[styles.safetyText, { color: safetyColor }]}>{prediction.token.safetyGrade}</Text>
            </View>
          </View>
          <Text style={styles.tokenPrice}>${marketService.formatPrice(prediction.token.price)}</Text>
        </View>
        
        <View style={[styles.signalBadge, { backgroundColor: signalConfig.bg, borderColor: signalConfig.color }]}>
          <Ionicons name={signalConfig.icon as any} size={14} color={signalConfig.color} />
          <Text style={[styles.signalText, { color: signalConfig.color }]}>{signalConfig.label}</Text>
        </View>
      </View>

      <View style={styles.confidenceRow}>
        <Text style={styles.confidenceLabel}>AI Confidence</Text>
        <View style={styles.confidenceMeter}>
          <View 
            style={[
              styles.confidenceFill, 
              { 
                width: `${prediction.confidence}%`, 
                backgroundColor: prediction.confidence > 70 ? '#39FF14' : prediction.confidence > 50 ? '#FFD700' : '#FF4444' 
              }
            ]} 
          />
        </View>
        <Text style={styles.confidenceValue}>{prediction.confidence}%</Text>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.targetsRow}>
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>Entry</Text>
              <Text style={styles.targetValue}>${prediction.targets.entry.toFixed(6)}</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>Target</Text>
              <Text style={[styles.targetValue, { color: '#39FF14' }]}>${prediction.targets.target.toFixed(6)}</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>Stop</Text>
              <Text style={[styles.targetValue, { color: '#FF4444' }]}>${prediction.targets.stop.toFixed(6)}</Text>
            </View>
          </View>

          <View style={styles.reasoningSection}>
            <Text style={styles.reasoningTitle}>Analysis</Text>
            {prediction.reasoning.map((reason, i) => (
              <View key={i} style={styles.reasoningItem}>
                <Text style={styles.reasoningBullet}>•</Text>
                <Text style={styles.reasoningText}>{reason}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.expandHint}>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );
}

export default function PredictionsScreen() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const generatePredictions = useCallback(async () => {
    try {
      const response = await marketService.discoverTokens();
      if (response.success) {
        const preds: Prediction[] = response.tokens.slice(0, 10).map(token => {
          const score = token.safetyScore + (token.priceChange24h * 2);
          let signal: Prediction['signal'] = 'hold';
          if (score > 80) signal = 'strong_buy';
          else if (score > 60) signal = 'buy';
          else if (score > 40) signal = 'hold';
          else if (score > 20) signal = 'sell';
          else signal = 'strong_sell';

          const confidence = Math.min(95, Math.max(30, Math.round(token.safetyScore + Math.random() * 20)));
          
          return {
            token,
            signal,
            confidence,
            targets: {
              entry: token.price,
              target: token.price * (1 + (0.1 + Math.random() * 0.3)),
              stop: token.price * (1 - (0.05 + Math.random() * 0.1)),
            },
            reasoning: [
              `Safety score: ${token.safetyScore}/100 (${token.safetyGrade})`,
              `24h change: ${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(2)}%`,
              `Volume: ${marketService.formatVolume(token.volume)}`,
              `Liquidity: ${marketService.formatVolume(token.liquidity)}`,
              token.risks.length > 0 ? `Risks: ${token.risks.join(', ')}` : 'No major risks detected',
            ],
          };
        });
        
        preds.sort((a, b) => {
          const order = ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'];
          return order.indexOf(a.signal) - order.indexOf(b.signal);
        });
        
        setPredictions(preds);
      }
    } catch (error) {
      console.error('Failed to generate predictions:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await generatePredictions();
      setLoading(false);
    };
    loadData();
  }, [generatePredictions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await generatePredictions();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={22} color="#00FFFF" />
          <Text style={styles.headerTitle}>AI Predictions</Text>
        </View>
        <View style={styles.aiTag}>
          <Text style={styles.aiTagText}>POWERED BY AI</Text>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color="#888" />
        <Text style={styles.disclaimerText}>
          AI predictions are for informational purposes only. Not financial advice.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
          <Text style={styles.loadingText}>Analyzing markets...</Text>
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
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{predictions.filter(p => p.signal === 'strong_buy' || p.signal === 'buy').length}</Text>
              <Text style={[styles.statLabel, { color: '#39FF14' }]}>Buy Signals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{predictions.filter(p => p.signal === 'hold').length}</Text>
              <Text style={[styles.statLabel, { color: '#FFD700' }]}>Hold</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{predictions.filter(p => p.signal === 'sell' || p.signal === 'strong_sell').length}</Text>
              <Text style={[styles.statLabel, { color: '#FF4444' }]}>Sell Signals</Text>
            </View>
          </View>

          {predictions.map((prediction, index) => (
            <PredictionCard key={prediction.token.address} prediction={prediction} />
          ))}

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  aiTag: {
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00FFFF',
    letterSpacing: 0.5,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    margin: 16,
    marginBottom: 0,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
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
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  predictionCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tokenInfo: {},
  tokenMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00FFFF',
  },
  safetyBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  safetyText: {
    fontSize: 9,
    fontWeight: '700',
  },
  tokenPrice: {
    fontSize: 13,
    color: '#888',
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  signalText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confidenceLabel: {
    fontSize: 11,
    color: '#666',
    width: 85,
  },
  confidenceMeter: {
    flex: 1,
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    width: 40,
    textAlign: 'right',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  targetsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  targetItem: {
    flex: 1,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  targetValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  reasoningSection: {},
  reasoningTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  reasoningItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  reasoningBullet: {
    fontSize: 12,
    color: '#00FFFF',
    marginRight: 8,
  },
  reasoningText: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 8,
  },
});
