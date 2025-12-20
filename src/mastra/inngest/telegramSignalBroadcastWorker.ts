import axios from 'axios';
import { inngest } from './client';
import { db } from '../../db/client.js';
import { predictionEvents } from '../../db/schema.js';
import { desc, gte } from 'drizzle-orm';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

async function sendChannelMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn('[TelegramBroadcast] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID');
    return false;
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHANNEL_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    console.log('[TelegramBroadcast] Message sent successfully');
    return response.data.ok;
  } catch (error: any) {
    console.error('[TelegramBroadcast] Failed to send message:', error.message);
    return false;
  }
}

interface SignalData {
  ticker: string;
  signal: string;
  confidence: string;
  price: number;
  reason: string;
}

async function getTopSignals(): Promise<SignalData[]> {
  try {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    
    const recentPredictions = await db.select()
      .from(predictionEvents)
      .where(gte(predictionEvents.createdAt, fourHoursAgo))
      .orderBy(desc(predictionEvents.createdAt))
      .limit(10);

    const signals: SignalData[] = [];
    const seenTickers = new Set<string>();

    for (const pred of recentPredictions) {
      if (seenTickers.has(pred.ticker)) continue;
      seenTickers.add(pred.ticker);

      let reason = 'Market momentum detected';
      try {
        const indicators = JSON.parse(pred.indicators || '{}');
        if (indicators.rsi) {
          if (indicators.rsi > 70) reason = 'Overbought conditions';
          else if (indicators.rsi < 30) reason = 'Oversold conditions';
          else if (indicators.rsi > 50) reason = 'Moderate upward trend';
          else reason = 'Downward pressure building';
        }
        if (indicators.macdSignal === 'bullish') reason = 'Bullish MACD crossover';
        if (indicators.macdSignal === 'bearish') reason = 'Bearish MACD crossover';
      } catch (e) {}

      const confidenceNum = pred.confidence === 'HIGH' ? 85 : pred.confidence === 'MEDIUM' ? 65 : 50;

      signals.push({
        ticker: pred.ticker,
        signal: pred.signal || 'HOLD',
        confidence: `${confidenceNum}%`,
        price: parseFloat(pred.priceAtPrediction?.toString() || '0'),
        reason
      });

      if (signals.length >= 3) break;
    }

    return signals;
  } catch (error: any) {
    console.error('[TelegramBroadcast] Error fetching signals:', error.message);
    return [];
  }
}

async function fetchLivePrices(): Promise<SignalData[]> {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      },
      timeout: 10000
    });

    const coins = response.data;
    const signals: SignalData[] = [];

    for (const coin of coins.slice(0, 3)) {
      const priceChange = coin.price_change_percentage_24h || 0;
      
      let signal = 'HOLD';
      let confidence = '50%';
      let reason = 'Consolidating';

      if (priceChange > 5) {
        signal = 'BUY';
        confidence = '75%';
        reason = 'Strong upward momentum';
      } else if (priceChange > 2) {
        signal = 'BUY';
        confidence = '65%';
        reason = 'Moderate upward trend';
      } else if (priceChange < -5) {
        signal = 'SELL';
        confidence = '75%';
        reason = 'Strong downward pressure';
      } else if (priceChange < -2) {
        signal = 'SELL';
        confidence = '65%';
        reason = 'Downward pressure building';
      }

      signals.push({
        ticker: coin.symbol.toUpperCase(),
        signal,
        confidence,
        price: coin.current_price,
        reason
      });
    }

    return signals;
  } catch (error: any) {
    console.error('[TelegramBroadcast] Error fetching live prices:', error.message);
    return [];
  }
}

function formatSignalMessage(signals: SignalData[]): string {
  if (signals.length === 0) {
    return '';
  }

  let message = `<b>DarkWave Studios</b>\n📊 <b>Latest Trading Signals</b>\n\n`;

  for (const signal of signals) {
    const emoji = signal.signal === 'BUY' ? '🟢' : signal.signal === 'SELL' ? '🔴' : '🟡';
    const priceFormatted = signal.price < 1 
      ? `$${signal.price.toFixed(4)}` 
      : `$${signal.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    message += `${emoji} <b>${signal.ticker}</b>\n`;
    message += `Signal: ${signal.signal} (${signal.confidence} confidence)\n`;
    message += `Price: ${priceFormatted}\n`;
    message += `Reason: ${signal.reason}\n\n`;
  }

  message += `<i>Signals update every 4 hours. Not financial advice.</i>`;

  return message;
}

export const telegramSignalBroadcast = inngest.createFunction(
  {
    id: "telegram-signal-broadcast",
    name: "Broadcast Signals to Telegram Channel",
  },
  [
    { cron: "0 */4 * * *" },
    { event: "telegram/broadcast-signals" },
  ],
  async ({ event, step }) => {
    console.log("📢 [TelegramBroadcast] Starting signal broadcast...");

    if (!TELEGRAM_CHANNEL_ID) {
      console.warn("⚠️ [TelegramBroadcast] TELEGRAM_CHANNEL_ID not configured - skipping broadcast");
      return { 
        success: false, 
        error: "TELEGRAM_CHANNEL_ID not configured",
        timestamp: new Date().toISOString() 
      };
    }

    let signals = await step.run("get-signals", async () => {
      const dbSignals = await getTopSignals();
      if (dbSignals.length >= 2) {
        return dbSignals;
      }
      return await fetchLivePrices();
    });

    if (signals.length === 0) {
      console.warn("⚠️ [TelegramBroadcast] No signals available");
      return { 
        success: false, 
        error: "No signals available",
        timestamp: new Date().toISOString() 
      };
    }

    const message = formatSignalMessage(signals);

    const sent = await step.run("send-broadcast", async () => {
      return await sendChannelMessage(message);
    });

    console.log(`✅ [TelegramBroadcast] Broadcast ${sent ? 'succeeded' : 'failed'}`);

    return {
      success: sent,
      signalsCount: signals.length,
      signals: signals.map(s => ({ ticker: s.ticker, signal: s.signal })),
      timestamp: new Date().toISOString()
    };
  }
);

export const telegramBroadcastWorkerFunctions = [
  telegramSignalBroadcast,
];
