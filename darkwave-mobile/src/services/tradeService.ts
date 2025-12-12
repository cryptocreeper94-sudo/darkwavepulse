import apiClient from './apiClient';

export interface Position {
  symbol: string;
  name: string;
  address: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  value: number;
}

export interface Portfolio {
  sessionId: string;
  balance: number;
  startingBalance: number;
  positions: Position[];
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  tradeCount: number;
}

export interface TradeResult {
  success: boolean;
  message?: string;
  trade?: {
    symbol: string;
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    total: number;
  };
  portfolio?: Portfolio;
}

const SESSION_ID = `mobile_${Date.now()}`;

export const tradeService = {
  getSessionId(): string {
    return SESSION_ID;
  },

  async getPortfolio(): Promise<Portfolio> {
    try {
      const response = await apiClient.get('/api/demo/positions', {
        params: { sessionId: SESSION_ID },
      });
      return response.data.portfolio || this.getDefaultPortfolio();
    } catch (error) {
      console.error('Failed to get portfolio:', error);
      return this.getDefaultPortfolio();
    }
  },

  async buyToken(tokenAddress: string, symbol: string, name: string, amount: number): Promise<TradeResult> {
    try {
      const response = await apiClient.post('/api/demo/buy', {
        sessionId: SESSION_ID,
        tokenAddress,
        symbol,
        name,
        amountUsd: amount,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to buy token:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Trade failed',
      };
    }
  },

  async sellToken(tokenAddress: string, quantity?: number): Promise<TradeResult> {
    try {
      const response = await apiClient.post('/api/demo/sell', {
        sessionId: SESSION_ID,
        tokenAddress,
        quantity,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to sell token:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Trade failed',
      };
    }
  },

  getDefaultPortfolio(): Portfolio {
    return {
      sessionId: SESSION_ID,
      balance: 100000,
      startingBalance: 100000,
      positions: [],
      totalValue: 100000,
      totalPnl: 0,
      totalPnlPercent: 0,
      tradeCount: 0,
    };
  },

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  formatPercent(percent: number): string {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  },
};

export default tradeService;
