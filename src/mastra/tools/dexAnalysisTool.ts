import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { RSI, MACD, EMA, SMA, BollingerBands } from "technicalindicators";

/**
 * DEX Technical Analysis Tool - Specialized analysis for DEX pairs and meme coins
 * Adapts technical indicators for high-volatility, low-liquidity assets
 */

export const dexAnalysisTool = createTool({
  id: "dex-analysis-tool",
  description: "Performs specialized technical analysis on DEX pairs and meme coins. Adapts indicators for high volatility and includes DEX-specific metrics (liquidity, transaction count, rug risk assessment).",

  inputSchema: z.object({
    ticker: z.string(),
    name: z.string(),
    chain: z.string(),
    dex: z.string(),
    currentPrice: z.number(),
    priceChange24h: z.number(),
    priceChangePercent24h: z.number(),
    priceChange6h: z.number().optional(),
    priceChangePercent6h: z.number().optional(),
    volume24h: z.number(),
    volume6h: z.number().optional(),
    liquidity: z.number(),
    marketCap: z.number().optional(),
    txns24h: z.number().optional(),
    priceHistory: z.array(z.object({
      timestamp: z.number(),
      price: z.number(),
    })),
  }),

  outputSchema: z.object({
    ticker: z.string(),
    name: z.string(),
    chain: z.string(),
    dex: z.string(),
    currentPrice: z.number(),
    priceChange24h: z.number(),
    priceChangePercent24h: z.number(),
    rsi: z.number(),
    macd: z.object({
      value: z.number(),
      signal: z.number(),
      histogram: z.number(),
    }),
    ema9: z.number(),
    ema21: z.number(),
    sma20: z.number(),
    bollingerBands: z.object({
      upper: z.number(),
      middle: z.number(),
      lower: z.number(),
      bandwidth: z.number(),
    }),
    liquidity: z.number(),
    volume24h: z.number(),
    txns24h: z.number(),
    volatility: z.number(),
    liquidityScore: z.string(),
    rugRisk: z.string(),
    signals: z.array(z.string()),
    recommendation: z.enum(['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL', 'EXTREME_RISK']),
    signalCount: z.object({
      bullish: z.number(),
      bearish: z.number(),
    }),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔧 [DexAnalysisTool] Starting DEX analysis', { ticker: context.ticker });

    const closePrices = context.priceHistory.map(p => p.price);

    logger?.info('📊 [DexAnalysisTool] Calculating indicators', { dataPoints: closePrices.length });

    // Calculate RSI (shorter period for DEX - more responsive)
    const rsiValues = RSI.calculate({ values: closePrices, period: 14 });
    const currentRSI = rsiValues[rsiValues.length - 1] || 50;

    // Calculate MACD
    const macdValues = MACD.calculate({
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const currentMACD = macdValues[macdValues.length - 1] || { MACD: 0, signal: 0, histogram: 0 };

    // Calculate shorter EMAs for DEX (faster signals)
    const ema9Values = EMA.calculate({ values: closePrices, period: 9 });
    const ema21Values = EMA.calculate({ values: closePrices, period: 21 });
    const currentEMA9 = ema9Values[ema9Values.length - 1] || context.currentPrice;
    const currentEMA21 = ema21Values[ema21Values.length - 1] || context.currentPrice;

    // Calculate SMA
    const sma20Values = SMA.calculate({ values: closePrices, period: 20 });
    const currentSMA20 = sma20Values[sma20Values.length - 1] || context.currentPrice;

    // Calculate Bollinger Bands
    const bbValues = BollingerBands.calculate({
      values: closePrices,
      period: 20,
      stdDev: 2,
    });
    const currentBB = bbValues[bbValues.length - 1] || { upper: 0, middle: 0, lower: 0 };
    const bandwidth = ((currentBB.upper - currentBB.lower) / currentBB.middle) * 100;

    // Calculate volatility
    const volatility = calculateVolatility(closePrices);

    // DEX-specific assessments
    const liquidityScore = assessLiquidity(context.liquidity, context.volume24h);
    const rugRisk = assessRugRisk(context.liquidity, context.marketCap || 0, context.txns24h || 0, closePrices);

    logger?.info('📝 [DexAnalysisTool] Generating signals');

    // Generate signals
    const signals: string[] = [];
    let bullishCount = 0;
    let bearishCount = 0;

    // RSI signals
    if (currentRSI < 30) {
      signals.push('RSI oversold - potential bounce');
      bullishCount++;
    } else if (currentRSI > 70) {
      signals.push('RSI overbought - take profits');
      bearishCount++;
    }

    // MACD signals
    if (currentMACD.histogram && currentMACD.MACD && currentMACD.signal) {
      if (currentMACD.histogram > 0 && currentMACD.MACD > currentMACD.signal) {
        signals.push('MACD bullish momentum');
        bullishCount++;
      } else if (currentMACD.histogram < 0 && currentMACD.MACD < currentMACD.signal) {
        signals.push('MACD bearish momentum');
        bearishCount++;
      }
    }

    // Short-term EMA crossover
    if (context.currentPrice > currentEMA9 && currentEMA9 > currentEMA21) {
      signals.push('Short-term uptrend (EMA 9 > EMA 21)');
      bullishCount++;
    } else if (context.currentPrice < currentEMA9 && currentEMA9 < currentEMA21) {
      signals.push('Short-term downtrend (EMA 9 < EMA 21)');
      bearishCount++;
    }

    // Bollinger Band signals
    if (context.currentPrice < currentBB.lower) {
      signals.push('Price below lower BB - oversold');
      bullishCount++;
    } else if (context.currentPrice > currentBB.upper) {
      signals.push('Price above upper BB - overbought');
      bearishCount++;
    }

    // Liquidity signals (DEX-specific)
    if (liquidityScore === 'Critical' || liquidityScore === 'Low') {
      signals.push(`⚠️ ${liquidityScore} liquidity - high slippage risk`);
      bearishCount += 2; // Extra weight for low liquidity
    } else if (liquidityScore === 'Excellent') {
      signals.push('Strong liquidity - safe entry/exit');
      bullishCount++;
    }

    // Rug risk assessment (DEX-specific)
    if (rugRisk === 'EXTREME' || rugRisk === 'HIGH') {
      signals.push(`🚨 ${rugRisk} rug risk - proceed with extreme caution`);
      bearishCount += 3; // Heavy weight for rug risk
    }

    // Volume signals
    const volumeToLiqRatio = context.volume24h / context.liquidity;
    if (volumeToLiqRatio > 2) {
      signals.push('High volume/liquidity ratio - strong interest');
      bullishCount++;
    } else if (volumeToLiqRatio < 0.1) {
      signals.push('Low volume - dead coin risk');
      bearishCount++;
    }

    // Transaction count signals
    if (context.txns24h && context.txns24h > 1000) {
      signals.push('High transaction count - active trading');
      bullishCount++;
    } else if (context.txns24h && context.txns24h < 50) {
      signals.push('Low transaction count - low interest');
      bearishCount++;
    }

    // Determine recommendation
    let recommendation: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL' | 'EXTREME_RISK';
    
    // Override with EXTREME_RISK if rug risk is high
    if (rugRisk === 'EXTREME') {
      recommendation = 'EXTREME_RISK';
    } else {
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
    }

    logger?.info('✅ [DexAnalysisTool] Analysis complete', { 
      ticker: context.ticker,
      recommendation,
      rugRisk,
      liquidityScore
    });

    return {
      ticker: context.ticker,
      name: context.name,
      chain: context.chain,
      dex: context.dex,
      currentPrice: context.currentPrice,
      priceChange24h: context.priceChange24h,
      priceChangePercent24h: context.priceChangePercent24h,
      rsi: parseFloat(currentRSI.toFixed(1)),
      macd: {
        value: parseFloat((currentMACD.MACD || 0).toFixed(6)),
        signal: parseFloat((currentMACD.signal || 0).toFixed(6)),
        histogram: parseFloat((currentMACD.histogram || 0).toFixed(6)),
      },
      ema9: parseFloat(currentEMA9.toFixed(8)),
      ema21: parseFloat(currentEMA21.toFixed(8)),
      sma20: parseFloat(currentSMA20.toFixed(8)),
      bollingerBands: {
        upper: parseFloat(currentBB.upper.toFixed(8)),
        middle: parseFloat(currentBB.middle.toFixed(8)),
        lower: parseFloat(currentBB.lower.toFixed(8)),
        bandwidth: parseFloat(bandwidth.toFixed(2)),
      },
      liquidity: context.liquidity,
      volume24h: context.volume24h,
      txns24h: context.txns24h || 0,
      volatility: parseFloat(volatility.toFixed(1)),
      liquidityScore,
      rugRisk,
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

function calculateVolatility(prices: number[]): number {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev * 100;
}

function assessLiquidity(liquidity: number, volume24h: number): string {
  // Liquidity assessment based on USD value
  if (liquidity < 5000) return 'Critical';
  if (liquidity < 25000) return 'Low';
  if (liquidity < 100000) return 'Moderate';
  if (liquidity < 500000) return 'Good';
  return 'Excellent';
}

function assessRugRisk(liquidity: number, marketCap: number, txns24h: number, prices: number[]): string {
  let riskScore = 0;
  
  // Very low liquidity
  if (liquidity < 10000) riskScore += 3;
  else if (liquidity < 50000) riskScore += 1;
  
  // Low transaction count
  if (txns24h < 50) riskScore += 2;
  else if (txns24h < 200) riskScore += 1;
  
  // Market cap to liquidity ratio
  if (marketCap > 0) {
    const mcToLiq = marketCap / liquidity;
    if (mcToLiq > 100) riskScore += 2; // Very high MC vs liquidity = suspicious
  }
  
  // Extreme volatility check (potential pump & dump)
  const recentPrices = prices.slice(-7); // Last week
  const maxPrice = Math.max(...recentPrices);
  const minPrice = Math.min(...recentPrices);
  const priceRange = ((maxPrice - minPrice) / minPrice) * 100;
  
  if (priceRange > 300) riskScore += 2; // >300% swing in a week
  else if (priceRange > 150) riskScore += 1;
  
  // Determine risk level
  if (riskScore >= 5) return 'EXTREME';
  if (riskScore >= 3) return 'HIGH';
  if (riskScore >= 1) return 'MODERATE';
  return 'LOW';
}
