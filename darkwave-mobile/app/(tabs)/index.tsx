import { useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { Coin } from '../../src/config/coins';
import { COINS, getFeaturedCoin, getCoinsByCategory } from '../../src/config/coins';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const coinImages: { [key: string]: any } = {
  'yahu-yahusha': require('../../src/assets/coins/yahu-yahusha.jpg'),
  'yah-yahuah': require('../../src/assets/coins/yah-yahuah.jpg'),
  'rhodi-rhodium': require('../../src/assets/coins/rhodi-rhodium.jpg'),
  'jh25-justice': require('../../src/assets/coins/jh25-justice.jpg'),
  'justice-for-humanity': require('../../src/assets/coins/justice-for-humanity.jpg'),
  'obey-illuminati': require('../../src/assets/coins/obey-illuminati.jpg'),
  'v25-vertigo': require('../../src/assets/coins/v25-vertigo.jpg'),
  'cheers-pumpaholic': require('../../src/assets/coins/cheers-pumpaholic.jpg'),
  'p25-pumpocracy': require('../../src/assets/coins/p25-pumpocracy.jpg'),
  'rektmeow-liquidation': require('../../src/assets/coins/rektmeow-liquidation.jpg'),
  'uncat-uncertainty': require('../../src/assets/coins/uncat-uncertainty.jpg'),
  'overstimulated': require('../../src/assets/coins/overstimulated.jpg'),
  'ccat-cryptocat': require('../../src/assets/coins/ccat-cryptocat.jpg'),
  'cwc-catwifcash': require('../../src/assets/coins/cwc-catwifcash.png')
};

const getImage = (imagePath: string) => {
  return coinImages[imagePath] || null;
};

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  hasGauge?: boolean;
}

function MetricCard({ title, value, change, isPositive, hasGauge }: MetricCardProps) {
  return (
    <TouchableOpacity style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, hasGauge ? styles.metricValueWhite : styles.metricValueGreen]}>
        {value}
      </Text>
      {change && (
        <Text style={[styles.metricChange, isPositive ? styles.changePositive : styles.changeNegative]}>
          {change}
        </Text>
      )}
      {hasGauge && (
        <View style={styles.gaugeContainer}>
          <View style={styles.gaugePlaceholder}>
            <Text style={styles.gaugeText}>Gauge</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CoinCard({ coin }: { coin: Coin }) {
  return (
    <TouchableOpacity style={styles.coinCard}>
      <View style={styles.coinCardInner}>
        {getImage(coin.imagePath) && (
          <Image source={getImage(coin.imagePath)} style={styles.coinImage} />
        )}
        <Text style={styles.coinTicker}>{coin.ticker}</Text>
        <Text style={styles.coinName}>{coin.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MarketsTab() {
  const featuredCoin = getFeaturedCoin();
  const spiritualCoins = getCoinsByCategory('spiritual');
  const conspiracyCoins = getCoinsByCategory('conspiracy');
  const memeCoins = getCoinsByCategory('meme');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PULSE</Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v2.0</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.metricsGrid}>
          <MetricCard title="FEAR & GREED INDEX" value="65" hasGauge />
          <MetricCard title="ALTCOIN SEASON INDEX" value="75" hasGauge />
          <MetricCard title="TOTAL MARKET CAP" value="$3.07T" change="+1.5%" isPositive />
          <MetricCard title="24H TRADING VOLUME" value="$136.5B" change="-1.5%" isPositive={false} />
        </View>

        <LinearGradient
          colors={['#FF006E', '#9D4EDD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredContainer}
        >
          <Text style={styles.featuredLabel}>FEATURED</Text>
          {getImage(featuredCoin.imagePath) && (
            <Image source={getImage(featuredCoin.imagePath)} style={styles.featuredImage} />
          )}
          <Text style={styles.featuredTicker}>{featuredCoin.ticker}</Text>
          <Text style={styles.featuredName}>{featuredCoin.name}</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>BUY NOW</Text>
          </TouchableOpacity>
        </LinearGradient>

        {spiritualCoins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Spiritual & Unity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinsScroll}>
              {spiritualCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}
            </ScrollView>
          </View>
        )}

        {conspiracyCoins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👁️ Conspiracy & Mystery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinsScroll}>
              {conspiracyCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}
            </ScrollView>
          </View>
        )}

        {memeCoins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎪 Meme & Degen</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinsScroll}>
              {memeCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}
            </ScrollView>
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
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#00d9ff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 217, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  versionBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  versionText: {
    fontSize: 12,
    color: '#666',
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 24) / 2,
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 12,
    alignItems: 'center',
    minHeight: 120,
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FE9FF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricValueWhite: { color: '#ffffff' },
  metricValueGreen: { color: '#39FF14' },
  metricChange: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  changePositive: { color: '#39FF14' },
  changeNegative: { color: '#ff4444' },
  gaugeContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 8,
  },
  gaugePlaceholder: {
    width: '80%',
    height: 30,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeText: {
    fontSize: 10,
    color: '#666',
  },
  featuredContainer: {
    marginHorizontal: 15,
    marginVertical: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9D4EDD',
  },
  featuredLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.8,
    letterSpacing: 2,
  },
  featuredImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginVertical: 15,
  },
  featuredTicker: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  featuredName: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  buyButton: {
    marginTop: 15,
    backgroundColor: '#FF006E',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginLeft: 20,
    marginBottom: 12,
    letterSpacing: 1,
  },
  coinsScroll: {
    paddingHorizontal: 15,
  },
  coinCard: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coinCardInner: {
    width: 140,
    backgroundColor: '#141414',
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
  },
  coinImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  coinTicker: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginTop: 8,
    letterSpacing: 1,
  },
  coinName: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'center',
  },
});
