// Analysis Indicators - Pure functions for technical calculations

const analysisIndicators = {
  
  // Simple Moving Average
  calculateSMA(data, period) {
    if (data.length < period) return null;
    
    const smaValues = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      smaValues.push(sum / period);
    }
    
    return {
      values: smaValues,
      latest: smaValues[smaValues.length - 1]
    };
  },
  
  // Exponential Moving Average
  calculateEMA(data, period) {
    if (data.length < period) return null;
    
    const k = 2 / (period + 1);
    const emaValues = [];
    
    // Start with SMA for first value
    const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    emaValues.push(firstSMA);
    
    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
      const ema = data[i] * k + emaValues[emaValues.length - 1] * (1 - k);
      emaValues.push(ema);
    }
    
    return {
      values: emaValues,
      latest: emaValues[emaValues.length - 1]
    };
  },
  
  // Relative Strength Index
  calculateRSI(data, period = 14) {
    if (data.length < period + 1) return null;
    
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i] - data[i - 1]);
    }
    
    const rsiValues = [];
    
    // Calculate first RSI using simple averages
    let gains = 0;
    let losses = 0;
    
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        gains += changes[i];
      } else {
        losses += Math.abs(changes[i]);
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    let rs = avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
    
    // Calculate subsequent RSI values using Wilder's smoothing
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
      }
      
      rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    return {
      values: rsiValues,
      latest: rsiValues[rsiValues.length - 1]
    };
  },
  
  // MACD (Moving Average Convergence Divergence)
  calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calculateEMA(data, fastPeriod);
    const slowEMA = this.calculateEMA(data, slowPeriod);
    
    if (!fastEMA || !slowEMA) return null;
    
    // MACD line = fast EMA - slow EMA
    const macdLine = [];
    const offset = slowPeriod - fastPeriod;
    
    for (let i = 0; i < slowEMA.values.length; i++) {
      macdLine.push(fastEMA.values[i + offset] - slowEMA.values[i]);
    }
    
    // Signal line = EMA of MACD line
    const signalEMA = this.calculateEMA(macdLine, signalPeriod);
    
    if (!signalEMA) return null;
    
    // Histogram = MACD line - signal line
    const histogram = [];
    const signalOffset = macdLine.length - signalEMA.values.length;
    
    for (let i = 0; i < signalEMA.values.length; i++) {
      histogram.push(macdLine[i + signalOffset] - signalEMA.values[i]);
    }
    
    return {
      macdLine: macdLine[macdLine.length - 1],
      signalLine: signalEMA.latest,
      histogram: histogram[histogram.length - 1],
      latest: macdLine[macdLine.length - 1]
    };
  },
  
  // Detect Golden Cross / Death Cross
  detectCross(sma50Values, sma200Values) {
    if (!sma50Values || !sma200Values) return null;
    
    const lookback = Math.min(30, sma50Values.length, sma200Values.length);
    
    // Check last 30 bars for cross
    for (let i = lookback - 1; i > 0; i--) {
      const currentIdx = sma50Values.length - i;
      const prevIdx = currentIdx - 1;
      
      if (prevIdx < 0) continue;
      
      const current50 = sma50Values[currentIdx];
      const current200 = sma200Values[currentIdx];
      const prev50 = sma50Values[prevIdx];
      const prev200 = sma200Values[prevIdx];
      
      // Golden Cross: 50 crosses above 200
      if (prev50 <= prev200 && current50 > current200) {
        return {
          type: 'golden',
          daysAgo: i,
          message: `🟢 GOLDEN CROSS detected ${i} days ago! 50-day SMA crossed above 200-day SMA - bullish signal.`
        };
      }
      
      // Death Cross: 50 crosses below 200
      if (prev50 >= prev200 && current50 < current200) {
        return {
          type: 'death',
          daysAgo: i,
          message: `🔴 DEATH CROSS detected ${i} days ago! 50-day SMA crossed below 200-day SMA - bearish signal.`
        };
      }
    }
    
    // No recent cross, return current position
    const latest50 = sma50Values[sma50Values.length - 1];
    const latest200 = sma200Values[sma200Values.length - 1];
    
    return {
      type: 'none',
      position: latest50 > latest200 ? 'above' : 'below',
      message: latest50 > latest200 
        ? '50-day SMA is above 200-day SMA (bullish position)'
        : '50-day SMA is below 200-day SMA (bearish position)'
    };
  },
  
  // Generate Buy/Sell/Hold signal
  generateSignal(indicators) {
    let score = 0;
    const reasons = [];
    
    // RSI analysis
    if (indicators.rsi) {
      if (indicators.rsi < 30) {
        score += 2;
        reasons.push('RSI oversold (<30)');
      } else if (indicators.rsi > 70) {
        score -= 2;
        reasons.push('RSI overbought (>70)');
      } else if (indicators.rsi >= 40 && indicators.rsi <= 60) {
        score += 0.5;
        reasons.push('RSI neutral');
      }
    }
    
    // MACD analysis
    if (indicators.macd) {
      if (indicators.macd.histogram > 0) {
        score += 1;
        reasons.push('MACD bullish');
      } else {
        score -= 1;
        reasons.push('MACD bearish');
      }
    }
    
    // Cross analysis
    if (indicators.cross) {
      if (indicators.cross.type === 'golden') {
        score += 3;
        reasons.push('Recent Golden Cross');
      } else if (indicators.cross.type === 'death') {
        score -= 3;
        reasons.push('Recent Death Cross');
      } else if (indicators.cross.position === 'above') {
        score += 1;
        reasons.push('50-day above 200-day');
      } else {
        score -= 1;
        reasons.push('50-day below 200-day');
      }
    }
    
    // Price vs moving averages
    if (indicators.price && indicators.sma50) {
      if (indicators.price > indicators.sma50) {
        score += 0.5;
      } else {
        score -= 0.5;
      }
    }
    
    // Determine signal
    let signal, confidence;
    if (score >= 3) {
      signal = 'BUY';
      confidence = 'Strong';
    } else if (score >= 1) {
      signal = 'BUY';
      confidence = 'Moderate';
    } else if (score >= -1) {
      signal = 'HOLD';
      confidence = 'Neutral';
    } else if (score >= -3) {
      signal = 'SELL';
      confidence = 'Moderate';
    } else {
      signal = 'SELL';
      confidence = 'Strong';
    }
    
    return {
      signal,
      confidence,
      score,
      reasons
    };
  }
};
