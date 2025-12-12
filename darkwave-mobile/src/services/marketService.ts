import apiClient from './apiClient';

export interface Token {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume: number;
  liquidity: number;
  safetyScore: number;
  safetyGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  risks: string[];
  dex: string;
  pairAddress: string;
  fdv: number;
  txns24h: number;
}

export interface DiscoverResponse {
  success: boolean;
  tokens: Token[];
  timestamp: string;
  source: 'live' | 'demo';
}

export const marketService = {
  async discoverTokens(): Promise<DiscoverResponse> {
    try {
      const response = await apiClient.get('/api/demo/discover');
      return response.data;
    } catch (error) {
      console.error('Failed to discover tokens:', error);
      return {
        success: false,
        tokens: [],
        timestamp: new Date().toISOString(),
        source: 'demo',
      };
    }
  },

  async getTokenPrices(addresses: string[]): Promise<Record<string, number>> {
    try {
      const response = await apiClient.post('/api/demo/prices', { addresses });
      return response.data.prices || {};
    } catch (error) {
      console.error('Failed to get prices:', error);
      return {};
    }
  },

  formatPrice(price: number): string {
    if (price < 0.00001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  },

  formatVolume(volume: number): string {
    if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(2)}M`;
    if (volume >= 1_000) return `$${(volume / 1_000).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  },

  getSafetyColor(grade: string): string {
    switch (grade) {
      case 'A': return '#39FF14';
      case 'B': return '#00d4aa';
      case 'C': return '#FFD700';
      case 'D': return '#FF8C00';
      case 'F': return '#FF4444';
      default: return '#888888';
    }
  },
};

export default marketService;
