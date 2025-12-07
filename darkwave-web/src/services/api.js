const API_BASE = '/api';

export async function fetchCoinAnalysis(symbol) {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ticker: symbol.toUpperCase() }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: {
        rsi: data.rsi,
        macd: data.macd,
        ema9: data.ema9,
        ema21: data.ema21,
        ema50: data.ema50,
        ema200: data.ema200,
        sma50: data.sma50,
        sma200: data.sma200,
        bollingerBands: data.bollingerBands,
        support: data.support,
        resistance: data.resistance,
        recommendation: data.recommendation,
        signals: data.signals,
        signalCount: data.signalCount,
        volatility: data.volatility,
        spikeScore: data.spikeScore,
      },
    };
  } catch (error) {
    console.error('[API] fetchCoinAnalysis failed:', error);
    return { success: false, error: error.message };
  }
}

export async function fetchMarketData() {
  try {
    const response = await fetch(`${API_BASE}/crypto/market-overview`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('[API] fetchMarketData failed:', error);
    return { success: false, error: error.message };
  }
}

export async function fetchPredictions() {
  try {
    const response = await fetch(`${API_BASE}/prediction-accuracy`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('[API] fetchPredictions failed:', error);
    return { success: false, error: error.message };
  }
}

export async function fetchTopPredictions() {
  try {
    const response = await fetch(`${API_BASE}/crypto/coin-prices`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const coins = await response.json();
    
    const predictions = coins.slice(0, 3).map(coin => {
      const change = parseFloat(coin.priceChangePercent24h || coin.change24h || 0);
      let signal = 'HOLD';
      let confidence = 60;
      
      if (change > 5) {
        signal = 'BUY';
        confidence = Math.min(85, 65 + Math.abs(change));
      } else if (change < -5) {
        signal = 'SELL';
        confidence = Math.min(85, 65 + Math.abs(change));
      } else if (change > 2) {
        signal = 'BUY';
        confidence = 55 + Math.abs(change) * 2;
      } else if (change < -2) {
        signal = 'SELL';
        confidence = 55 + Math.abs(change) * 2;
      }
      
      return {
        symbol: coin.symbol || coin.ticker,
        name: coin.name,
        price: coin.price || coin.currentPrice,
        change: change,
        signal,
        confidence: Math.round(confidence),
      };
    });
    
    return { success: true, predictions };
  } catch (error) {
    console.error('[API] fetchTopPredictions failed:', error);
    return {
      success: false,
      predictions: [
        { symbol: 'BTC', name: 'Bitcoin', signal: 'BUY', confidence: 72, price: '$97,234', change: 2.3 },
        { symbol: 'ETH', name: 'Ethereum', signal: 'HOLD', confidence: 65, price: '$3,845', change: 1.8 },
        { symbol: 'SOL', name: 'Solana', signal: 'SELL', confidence: 58, price: '$242.50', change: -0.5 },
      ],
    };
  }
}
