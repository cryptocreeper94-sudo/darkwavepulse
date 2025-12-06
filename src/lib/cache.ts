interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 100;

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  getStale<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? entry.data as T : null;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const apiCache = new InMemoryCache();

export const CACHE_TTL = {
  MARKET_CHART: 60000,      // 60 seconds - for chart data
  COIN_PRICES: 30000,       // 30 seconds - for price updates
  MARKET_DATA: 120000,      // 2 minutes - for market overview
  GLOBAL: 300000,           // 5 minutes - for global stats
  TRENDING: 600000,         // 10 minutes - for trending coins
  COIN_DETAILS: 300000,     // 5 minutes - for coin details
  NEWS: 300000,             // 5 minutes - for news
  FEAR_GREED: 300000        // 5 minutes - for sentiment
};

export default apiCache;
