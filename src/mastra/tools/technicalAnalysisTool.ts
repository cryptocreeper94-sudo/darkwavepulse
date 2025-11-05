import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { RSI, MACD, EMA, SMA, BollingerBands } from "technicalindicators";

/**
 * Technical Analysis Tool - Calculates all technical indicators and generates buy/sell signals
 * Analyzes: RSI, MACD, EMAs, SMAs, Bollinger Bands, Support/Resistance, Volume
 */

export const technicalAnalysisTool = createTool({
  id: "technical-analysis-tool",
  description: "Performs comprehensive technical analysis on price data. Calculates RSI, MACD, moving averages, Bollinger Bands, support/resistance levels, and generates buy/sell signals.",

  inputSchema: z.object({
    ticker: z.string().describe("Ticker symbol"),
    currentPrice: z.number().describe("Current market price"),
    priceChange24h: z.number().describe("24h price change in dollars"),
    priceChangePercent24h: z.number().describe("24h price change percentage"),
    volume24h: z.number().optional().describe("24h trading volume"),
    prices: z.array(z.object({
      timestamp: z.number(),
      open: z.number(),
      high: z.number(),
      low: z.number(),
      close: z.number(),
      volume: z.number(),
    })).describe("Historical OHLCV data"),
  }),

  outputSchema: z.object({
    ticker: z.string(),
    currentPrice: z.number(),
    priceChange24h: z.number(),
    priceChangePercent24h: z.number(),
    rsi: z.number(),
    macd: z.object({
      value: z.number(),
      signal: z.number(),
      histogram: z.number(),
    }),
    ema50: z.number(),
    ema200: z.number(),
    sma50: z.number(),
    sma200: z.number(),
    bollingerBands: z.object({
      upper: z.number(),
      middle: z.number(),
      lower: z.number(),
      bandwidth: z.number(),
    }),
    support: z.number(),
    resistance: z.number(),
    volume: z.object({
      current: z.number(),
      average: z.number(),
      changePercent: z.number(),
    }),
    volatility: z.number(),
    signals: z.array(z.string()),
    recommendation: z.enum(['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL']),
    signalCount: z.object({
      bullish: z.number(),
      bearish: z.number(),
    }),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔧 [TechnicalAnalysisTool] Starting analysis', { ticker: context.ticker });

    const closePrices = context.prices.map(p => p.close);
    const highPrices = context.prices.map(p => p.high);
    const lowPrices = context.prices.map(p => p.low);
    const volumes = context.prices.map(p => p.volume);

    logger?.info('📊 [TechnicalAnalysisTool] Calculating indicators', { dataPoints: closePrices.length });

    // Calculate RSI (14 period)
    const rsiValues = RSI.calculate({ values: closePrices, period: 14 });
    const currentRSI = rsiValues[rsiValues.length - 1] || 50;

    // Calculate MACD (12, 26, 9)
    const macdValues = MACD.calculate({
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const currentMACD = macdValues[macdValues.length - 1] || { MACD: 0, signal: 0, histogram: 0 };

    // Calculate EMAs
    const ema50Values = EMA.calculate({ values: closePrices, period: 50 });
    const ema200Values = EMA.calculate({ values: closePrices, period: 200 });
    const currentEMA50 = ema50Values[ema50Values.length - 1] || context.currentPrice;
    const currentEMA200 = ema200Values[ema200Values.length - 1] || context.currentPrice;

    // Calculate SMAs
    const sma50Values = SMA.calculate({ values: closePrices, period: 50 });
    const sma200Values = SMA.calculate({ values: closePrices, period: 200 });
    const currentSMA50 = sma50Values[sma50Values.length - 1] || context.currentPrice;
    const currentSMA200 = sma200Values[sma200Values.length - 1] || context.currentPrice;

    // Calculate Bollinger Bands
    const bbValues = BollingerBands.calculate({
      values: closePrices,
      period: 20,
      stdDev: 2,
    });
    const currentBB = bbValues[bbValues.length - 1] || { upper: 0, middle: 0, lower: 0 };
    const bandwidth = ((currentBB.upper - currentBB.lower) / currentBB.middle) * 100;

    // Calculate dynamic support and resistance (recent 30-day window)
    const recentPrices = context.prices.slice(-30);
    const support = calculateDynamicSupport(recentPrices, context.currentPrice);
    const resistance = calculateDynamicResistance(recentPrices, context.currentPrice);

    // Calculate volume metrics
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = context.volume24h || volumes[volumes.length - 1] || 0;
    const volumeChangePercent = ((currentVolume - avgVolume) / avgVolume) * 100;

    // Calculate volatility (standard deviation of recent returns)
    const volatility = calculateVolatility(closePrices.slice(-30));

    logger?.info('📝 [TechnicalAnalysisTool] Generating signals');

    // Generate signals
    const signals: string[] = [];
    let bullishCount = 0;
    let bearishCount = 0;

    // RSI signals
    if (currentRSI < 30) {
      signals.push('RSI oversold (bullish)');
      bullishCount++;
    } else if (currentRSI > 70) {
      signals.push('RSI overbought (bearish)');
      bearishCount++;
    }

    // MACD signals
    if (currentMACD.histogram && currentMACD.MACD && currentMACD.signal) {
      if (currentMACD.histogram > 0 && currentMACD.MACD > currentMACD.signal) {
        signals.push('MACD bullish crossover');
        bullishCount++;
      } else if (currentMACD.histogram < 0 && currentMACD.MACD < currentMACD.signal) {
        signals.push('MACD bearish crossover');
        bearishCount++;
      }
    }

    // Moving average signals
    if (context.currentPrice > currentEMA50 && currentEMA50 > currentEMA200) {
      signals.push('Golden cross pattern (bullish)');
      bullishCount++;
    } else if (context.currentPrice < currentEMA50 && currentEMA50 < currentEMA200) {
      signals.push('Death cross pattern (bearish)');
      bearishCount++;
    }

    // Price vs MA signals
    if (context.currentPrice > currentSMA50) {
      bullishCount++;
    } else {
      bearishCount++;
    }

    if (context.currentPrice > currentSMA200) {
      bullishCount++;
    } else {
      bearishCount++;
    }

    // Bollinger Band signals
    if (context.currentPrice < currentBB.lower) {
      signals.push('Price below lower Bollinger Band (bullish)');
      bullishCount++;
    } else if (context.currentPrice > currentBB.upper) {
      signals.push('Price above upper Bollinger Band (bearish)');
      bearishCount++;
    }

    // Support/Resistance signals
    const distanceToSupport = ((context.currentPrice - support) / support) * 100;
    const distanceToResistance = ((resistance - context.currentPrice) / context.currentPrice) * 100;

    if (distanceToSupport < 2) {
      signals.push('Near support level (potential bounce)');
      bullishCount++;
    }

    if (distanceToResistance < 2) {
      signals.push('Near resistance level (potential rejection)');
      bearishCount++;
    }

    // Volume signals
    if (volumeChangePercent > 50 && context.priceChangePercent24h > 0) {
      signals.push('High volume breakout (bullish)');
      bullishCount++;
    } else if (volumeChangePercent > 50 && context.priceChangePercent24h < 0) {
      signals.push('High volume selloff (bearish)');
      bearishCount++;
    }

    // Determine recommendation
    let recommendation: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
    const netSignal = bullishCount - bearishCount;

    if (netSignal >= 3) {
      recommendation = 'STRONG_BUY';
    } else if (netSignal >= 1) {
      recommendation = 'BUY';
    } else if (netSignal <= -3) {
      recommendation = 'STRONG_SELL';
    } else if (netSignal <= -1) {
      recommendation = 'SELL';
    } else {
      recommendation = 'HOLD';
    }

    logger?.info('✅ [TechnicalAnalysisTool] Analysis complete', { 
      ticker: context.ticker,
      recommendation,
      signals: signals.length 
    });

    return {
      ticker: context.ticker,
      currentPrice: context.currentPrice,
      priceChange24h: context.priceChange24h,
      priceChangePercent24h: context.priceChangePercent24h,
      rsi: parseFloat(currentRSI.toFixed(1)),
      macd: {
        value: parseFloat((currentMACD.MACD || 0).toFixed(2)),
        signal: parseFloat((currentMACD.signal || 0).toFixed(2)),
        histogram: parseFloat((currentMACD.histogram || 0).toFixed(2)),
      },
      ema50: parseFloat(currentEMA50.toFixed(2)),
      ema200: parseFloat(currentEMA200.toFixed(2)),
      sma50: parseFloat(currentSMA50.toFixed(2)),
      sma200: parseFloat(currentSMA200.toFixed(2)),
      bollingerBands: {
        upper: parseFloat(currentBB.upper.toFixed(2)),
        middle: parseFloat(currentBB.middle.toFixed(2)),
        lower: parseFloat(currentBB.lower.toFixed(2)),
        bandwidth: parseFloat(bandwidth.toFixed(2)),
      },
      support: parseFloat(support.toFixed(2)),
      resistance: parseFloat(resistance.toFixed(2)),
      volume: {
        current: parseFloat(currentVolume.toFixed(2)),
        average: parseFloat(avgVolume.toFixed(2)),
        changePercent: parseFloat(volumeChangePercent.toFixed(1)),
      },
      volatility: parseFloat(volatility.toFixed(1)),
      signals,
      recommendation,
      signalCount: {
        bullish: bullishCount,
        bearish: bearishCount,
      },
    };
  },
});

// Helper functions

function calculateDynamicSupport(recentPrices: any[], currentPrice: number): number {
  const lows = recentPrices.map(p => p.low);
  const sortedLows = [...lows].sort((a, b) => a - b);
  
  // Find support levels below current price
  const belowCurrent = sortedLows.filter(low => low < currentPrice);
  
  if (belowCurrent.length === 0) return sortedLows[0];
  
  // Return the highest low below current price (nearest support)
  return belowCurrent[belowCurrent.length - 1];
}

function calculateDynamicResistance(recentPrices: any[], currentPrice: number): number {
  const highs = recentPrices.map(p => p.high);
  const sortedHighs = [...highs].sort((a, b) => b - a);
  
  // Find resistance levels above current price
  const aboveCurrent = sortedHighs.filter(high => high > currentPrice);
  
  if (aboveCurrent.length === 0) return sortedHighs[0];
  
  // Return the lowest high above current price (nearest resistance)
  return aboveCurrent[aboveCurrent.length - 1];
}

function calculateVolatility(prices: number[]): number {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev * 100; // Convert to percentage
}
