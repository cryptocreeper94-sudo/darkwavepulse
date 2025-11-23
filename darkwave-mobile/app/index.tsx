import { ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COINS, getFeaturedCoin, getCoinsByCategory } from '../src/config/coins';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const featuredCoin = getFeaturedCoin();
  const spiritualCoins = getCoinsByCategory('spiritual');
  const conspiracyCoins = getCoinsByCategory('conspiracy');
  const memeCoins = getCoinsByCategory('meme');

  return (
    <LinearGradient colors={['#0a0a0a', '#0f1419']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>DARKWAVE PULSE</Text>
          <Text style={styles.subtitle}>Predictive Trading. Maximum Edge.</Text>
        </View>

        {/* Featured Coin */}
        <LinearGradient
          colors={['#FF006E', '#FFB703']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredContainer}
        >
          <Text style={styles.featuredLabel}>FEATURED</Text>
          <Image source={featuredCoin.image} style={styles.featuredImage} />
          <Text style={styles.featuredTicker}>{featuredCoin.ticker}</Text>
          <Text style={styles.featuredName}>{featuredCoin.name}</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>BUY NOW</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Spiritual Section */}
        {spiritualCoins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Spiritual & Unity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinsScroll}>
              {spiritualCoins.map(coin => (
                <CoinCard key={coin.id} coin={coin} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Conspiracy Section */}
        {conspiracyCoins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👁️ Conspiracy & Mystery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinsScroll}>
              {conspiracyCoins.map(coin => (
                <CoinCard key={coin.id} coin={coin} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Meme Section */}
        {memeCoins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎪 Meme & Degen</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinsScroll}>
              {memeCoins.map(coin => (
                <CoinCard key={coin.id} coin={coin} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Footer Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

interface CoinCardProps {
  coin: typeof COINS[0];
}

function CoinCard({ coin }: CoinCardProps) {
  return (
    <TouchableOpacity style={styles.coinCard}>
      <LinearGradient
        colors={['#1a1f2e', '#0f1419']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.coinCardGradient}
      >
        <Image source={coin.image} style={styles.coinImage} />
        <Text style={styles.coinTicker}>{coin.ticker}</Text>
        <Text style={styles.coinName}>{coin.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  scrollContent: {
    paddingBottom: 20
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d9ff',
    letterSpacing: 3
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    letterSpacing: 1
  },
  featuredContainer: {
    marginHorizontal: 15,
    marginVertical: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFB703'
  },
  featuredLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.8,
    letterSpacing: 2
  },
  featuredImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginVertical: 15
  },
  featuredTicker: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1
  },
  featuredName: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9
  },
  buyButton: {
    marginTop: 15,
    backgroundColor: '#FF006E',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff'
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1
  },
  section: {
    marginVertical: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginLeft: 20,
    marginBottom: 12,
    letterSpacing: 1
  },
  coinsScroll: {
    paddingHorizontal: 15
  },
  coinCard: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden'
  },
  coinCardGradient: {
    width: 140,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d9ff'
  },
  coinImage: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  coinTicker: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginTop: 8,
    letterSpacing: 1
  },
  coinName: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'center'
  }
});
