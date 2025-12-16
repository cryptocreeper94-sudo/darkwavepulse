import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { marketService, Token } from '../../src/services/marketService';

type Category = 'top' | 'gainers' | 'losers' | 'meme' | 'defi';

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'top', label: 'Top', icon: 'trophy' },
  { id: 'gainers', label: 'Gainers', icon: 'trending-up' },
  { id: 'losers', label: 'Losers', icon: 'trending-down' },
  { id: 'meme', label: 'Meme', icon: 'happy' },
  { id: 'defi', label: 'DeFi', icon: 'layers' },
];

function CategoryPill({ category, selected, onPress }: { category: typeof CATEGORIES[0]; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.categoryPill, selected && styles.categoryPillSelected]}
      onPress={onPress}
    >
      <Ionicons 
        name={category.icon as any} 
        size={14} 
        color={selected ? '#0a0a0a' : '#888'} 
      />
      <Text style={[styles.categoryPillText, selected && styles.categoryPillTextSelected]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

function TokenRow({ token, index }: { token: Token; index: number }) {
  const isPositive = token.priceChange24h >= 0;
  const changeColor = isPositive ? '#39FF14' : '#FF4444';
  const safetyColor = marketService.getSafetyColor(token.safetyGrade);

  return (
    <View style={styles.tokenRow}>
      <Text style={styles.tokenRank}>{index + 1}</Text>
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenSymbol}>{token.symbol}</Text>
        <Text style={styles.tokenName} numberOfLines={1}>{token.name}</Text>
      </View>
      <View style={styles.tokenPrice}>
        <Text style={styles.tokenPriceValue}>${marketService.formatPrice(token.price)}</Text>
      </View>
      <View style={styles.tokenChange}>
        <View style={[styles.changeBadge, { backgroundColor: isPositive ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 68, 68, 0.15)' }]}>
          <Ionicons 
            name={isPositive ? 'caret-up' : 'caret-down'} 
            size={10} 
            color={changeColor} 
          />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {Math.abs(token.priceChange24h).toFixed(1)}%
          </Text>
        </View>
      </View>
      <View style={[styles.safetyBadge, { borderColor: safetyColor }]}>
        <Text style={[styles.safetyText, { color: safetyColor }]}>{token.safetyGrade}</Text>
      </View>
    </View>
  );
}

export default function MarketsScreen() {
  const [category, setCategory] = useState<Category>('top');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTokens = useCallback(async () => {
    try {
      const response = await marketService.discoverTokens();
      if (response.success) {
        setTokens(response.tokens);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchTokens();
      setLoading(false);
    };
    loadData();
  }, [fetchTokens]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTokens();
    setRefreshing(false);
  };

  const getFilteredTokens = () => {
    switch (category) {
      case 'top':
        return [...tokens].sort((a, b) => b.volume - a.volume);
      case 'gainers':
        return [...tokens].filter(t => t.priceChange24h > 0).sort((a, b) => b.priceChange24h - a.priceChange24h);
      case 'losers':
        return [...tokens].filter(t => t.priceChange24h < 0).sort((a, b) => a.priceChange24h - b.priceChange24h);
      case 'meme':
        return tokens.filter(t => 
          t.symbol.toLowerCase().includes('cat') || 
          t.symbol.toLowerCase().includes('dog') ||
          t.symbol.toLowerCase().includes('pepe') ||
          t.safetyGrade === 'C' || t.safetyGrade === 'D' || t.safetyGrade === 'F'
        );
      case 'defi':
        return tokens.filter(t => t.safetyGrade === 'A' || t.safetyGrade === 'B');
      default:
        return tokens;
    }
  };

  const filteredTokens = getFilteredTokens();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Markets</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat.id}
            category={cat}
            selected={category === cat.id}
            onPress={() => setCategory(cat.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { width: 30 }]}>#</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Token</Text>
        <Text style={[styles.tableHeaderText, { width: 80 }]}>Price</Text>
        <Text style={[styles.tableHeaderText, { width: 70 }]}>24h</Text>
        <Text style={[styles.tableHeaderText, { width: 30 }]}>Safe</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
          <Text style={styles.loadingText}>Loading markets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTokens}
          keyExtractor={(item) => item.address}
          renderItem={({ item, index }) => <TokenRow token={item} index={index} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFFF" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#333" />
              <Text style={styles.emptyTitle}>No Tokens Found</Text>
              <Text style={styles.emptyText}>Try a different category</Text>
            </View>
          }
        />
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
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39FF14',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 1,
  },
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryPillSelected: {
    backgroundColor: '#00FFFF',
    borderColor: '#00FFFF',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  categoryPillTextSelected: {
    color: '#0a0a0a',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
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
  listContent: {
    paddingBottom: 100,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tokenRank: {
    width: 30,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  tokenInfo: {
    flex: 1,
    paddingRight: 8,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00FFFF',
  },
  tokenName: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  tokenPrice: {
    width: 80,
  },
  tokenPriceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  tokenChange: {
    width: 70,
    alignItems: 'flex-start',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  safetyBadge: {
    width: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
  },
  safetyText: {
    fontSize: 10,
    fontWeight: '700',
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
  },
});
