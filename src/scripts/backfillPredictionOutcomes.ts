import { db } from '../db/client.js';
import { predictionEvents, predictionOutcomes } from '../db/schema.js';
import { eq, and, sql, notInArray } from 'drizzle-orm';
import { predictionTrackingService } from '../services/predictionTrackingService.js';
import { predictionLearningService } from '../services/predictionLearningService.js';
import axios from 'axios';

type Horizon = '1h' | '4h' | '24h' | '7d';

const HORIZONS: Horizon[] = ['1h', '4h', '24h', '7d'];

const HORIZON_MS: Record<Horizon, number> = {
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

const TICKER_TO_COINGECKO: Record<string, string> = {
  'btc': 'bitcoin',
  'bitcoin': 'bitcoin',
  'eth': 'ethereum',
  'ethereum': 'ethereum',
  'sol': 'solana',
  'solana': 'solana',
  'xrp': 'ripple',
  'ripple': 'ripple',
  'doge': 'dogecoin',
  'dogecoin': 'dogecoin',
  'ada': 'cardano',
  'cardano': 'cardano',
  'avax': 'avalanche-2',
  'avalanche': 'avalanche-2',
  'avalanche-2': 'avalanche-2',
  'dot': 'polkadot',
  'polkadot': 'polkadot',
  'link': 'chainlink',
  'chainlink': 'chainlink',
  'near': 'near',
  'atom': 'cosmos',
  'cosmos': 'cosmos',
  'ltc': 'litecoin',
  'litecoin': 'litecoin',
  'uni': 'uniswap',
  'uniswap': 'uniswap',
  'xlm': 'stellar',
  'stellar': 'stellar',
  'algo': 'algorand',
  'algorand': 'algorand',
  'vet': 'vechain',
  'vechain': 'vechain',
  'icp': 'internet-computer',
  'internet-computer': 'internet-computer',
  'fil': 'filecoin',
  'filecoin': 'filecoin',
  'grt': 'the-graph',
  'the-graph': 'the-graph',
  'aave': 'aave',
  'bnb': 'binancecoin',
  'binancecoin': 'binancecoin',
  'usdt': 'tether',
  'tether': 'tether',
  'usdc': 'usd-coin',
  'usd-coin': 'usd-coin',
  'matic': 'matic-network',
  'polygon': 'matic-network',
  'shib': 'shiba-inu',
  'shiba-inu': 'shiba-inu',
  'trx': 'tron',
  'tron': 'tron',
  'ton': 'the-open-network',
  'the-open-network': 'the-open-network',
  'sui': 'sui',
  'apt': 'aptos',
  'aptos': 'aptos',
  'arb': 'arbitrum',
  'arbitrum': 'arbitrum',
  'op': 'optimism',
  'optimism': 'optimism',
  'sei': 'sei-network',
  'sei-network': 'sei-network',
  'inj': 'injective-protocol',
  'injective': 'injective-protocol',
  'injective-protocol': 'injective-protocol',
  'render': 'render-token',
  'rndr': 'render-token',
  'render-token': 'render-token',
  'hbar': 'hedera-hashgraph',
  'hedera': 'hedera-hashgraph',
  'hedera-hashgraph': 'hedera-hashgraph',
  'ftm': 'fantom',
  'fantom': 'fantom',
  'sand': 'the-sandbox',
  'the-sandbox': 'the-sandbox',
  'mana': 'decentraland',
  'decentraland': 'decentraland',
  'axs': 'axie-infinity',
  'axie-infinity': 'axie-infinity',
  'ape': 'apecoin',
  'apecoin': 'apecoin',
  'ldo': 'lido-dao',
  'lido-dao': 'lido-dao',
  'crv': 'curve-dao-token',
  'curve-dao-token': 'curve-dao-token',
  'mkr': 'maker',
  'maker': 'maker',
  'snx': 'synthetix-network-token',
  'synthetix-network-token': 'synthetix-network-token',
  'comp': 'compound-governance-token',
  'compound-governance-token': 'compound-governance-token',
  'rune': 'thorchain',
  'thorchain': 'thorchain',
  'kava': 'kava',
  'celo': 'celo',
  'flow': 'flow',
  'mina': 'mina-protocol',
  'mina-protocol': 'mina-protocol',
  'theta': 'theta-token',
  'theta-token': 'theta-token',
  'egld': 'elrond-erd-2',
  'elrond-erd-2': 'elrond-erd-2',
  'xtz': 'tezos',
  'tezos': 'tezos',
  'eos': 'eos',
  'neo': 'neo',
  'zec': 'zcash',
  'zcash': 'zcash',
  'xmr': 'monero',
  'monero': 'monero',
  'dash': 'dash',
  'etc': 'ethereum-classic',
  'ethereum-classic': 'ethereum-classic',
  'bch': 'bitcoin-cash',
  'bitcoin-cash': 'bitcoin-cash',
  'pepe': 'pepe',
  'wif': 'dogwifcoin',
  'dogwifcoin': 'dogwifcoin',
  'bonk': 'bonk',
  'floki': 'floki',
  'brett': 'brett',
  'popcat': 'popcat',
  'mog': 'mog-coin',
  'mog-coin': 'mog-coin',
  'celestia': 'celestia',
  'stacks': 'stacks',
  'immutable-x': 'immutable-x',
  'zilliqa': 'zilliqa',
  'iotex': 'iotex',
  'arweave': 'arweave',
  'akash-network': 'akash-network',
  'ocean-protocol': 'ocean-protocol',
  'fetch-ai': 'fetch-ai',
  'singularitynet': 'singularitynet',
  'bittensor': 'bittensor',
};

function getCoingeckoId(ticker: string): string {
  const normalized = ticker.toLowerCase().trim();
  return TICKER_TO_COINGECKO[normalized] || normalized;
}

async function fetchCurrentPrice(ticker: string): Promise<number | null> {
  try {
    const coinId = getCoingeckoId(ticker);
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price`,
      {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
        },
        timeout: 10000,
        headers: process.env.COINGECKO_API_KEY ? {
          'x-cg-pro-api-key': process.env.COINGECKO_API_KEY,
        } : {},
      }
    );
    
    return response.data[coinId]?.usd || null;
  } catch (error: any) {
    console.error(`[Backfill] Failed to fetch price for ${ticker} (${getCoingeckoId(ticker)}):`, error.message);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPredictionsMissingOutcomes(): Promise<Map<string, { prediction: any; missingHorizons: Horizon[] }>> {
  console.log('[Backfill] Fetching all predictions...');
  
  const allPredictions = await db.select()
    .from(predictionEvents)
    .orderBy(sql`${predictionEvents.createdAt} ASC`);
  
  console.log(`[Backfill] Found ${allPredictions.length} total predictions`);
  
  const allOutcomes = await db.select()
    .from(predictionOutcomes);
  
  console.log(`[Backfill] Found ${allOutcomes.length} total outcomes`);
  
  const outcomesByPrediction = new Map<string, Set<string>>();
  for (const outcome of allOutcomes) {
    if (!outcomesByPrediction.has(outcome.predictionId)) {
      outcomesByPrediction.set(outcome.predictionId, new Set());
    }
    outcomesByPrediction.get(outcome.predictionId)!.add(outcome.horizon);
  }
  
  const now = Date.now();
  const result = new Map<string, { prediction: any; missingHorizons: Horizon[] }>();
  
  for (const prediction of allPredictions) {
    const predictionTime = new Date(prediction.createdAt).getTime();
    const existingHorizons = outcomesByPrediction.get(prediction.id) || new Set();
    const missingHorizons: Horizon[] = [];
    
    for (const horizon of HORIZONS) {
      const horizonEndTime = predictionTime + HORIZON_MS[horizon];
      
      if (horizonEndTime <= now && !existingHorizons.has(horizon)) {
        missingHorizons.push(horizon);
      }
    }
    
    if (missingHorizons.length > 0) {
      result.set(prediction.id, { prediction, missingHorizons });
    }
  }
  
  return result;
}

async function backfillOutcomes(): Promise<void> {
  console.log('🔄 [Backfill] Starting prediction outcomes backfill...');
  console.log('='.repeat(60));
  
  const missingOutcomes = await getPredictionsMissingOutcomes();
  
  console.log(`[Backfill] Found ${missingOutcomes.size} predictions with missing outcomes`);
  
  if (missingOutcomes.size === 0) {
    console.log('✅ [Backfill] No missing outcomes to backfill!');
    return;
  }
  
  let horizonCounts: Record<Horizon, number> = { '1h': 0, '4h': 0, '24h': 0, '7d': 0 };
  for (const { missingHorizons } of missingOutcomes.values()) {
    for (const h of missingHorizons) {
      horizonCounts[h]++;
    }
  }
  
  console.log('[Backfill] Missing outcomes by horizon:');
  for (const [horizon, count] of Object.entries(horizonCounts)) {
    console.log(`  ${horizon}: ${count}`);
  }
  console.log('');
  
  const entries = Array.from(missingOutcomes.entries());
  const BATCH_SIZE = 10;
  const RATE_LIMIT_DELAY = 2000;
  
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const priceCache = new Map<string, number | null>();
  
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    
    console.log(`[Backfill] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(entries.length / BATCH_SIZE)} (${batch.length} predictions)`);
    
    for (const [predictionId, { prediction, missingHorizons }] of batch) {
      const ticker = prediction.ticker;
      
      let currentPrice: number | null;
      if (priceCache.has(ticker)) {
        currentPrice = priceCache.get(ticker)!;
      } else {
        currentPrice = await fetchCurrentPrice(ticker);
        priceCache.set(ticker, currentPrice);
        await sleep(RATE_LIMIT_DELAY);
      }
      
      if (currentPrice === null) {
        console.warn(`⚠️ [Backfill] Skipping ${ticker} - could not fetch price`);
        errorCount += missingHorizons.length;
        continue;
      }
      
      for (const horizon of missingHorizons) {
        try {
          const success = await predictionTrackingService.recordOutcome({
            predictionId,
            horizon,
            priceAtCheck: currentPrice,
          });
          
          if (success) {
            successCount++;
            console.log(`✅ [Backfill] Recorded ${horizon} outcome for ${ticker} (${predictionId.substring(0, 12)}...)`);
          } else {
            errorCount++;
            console.warn(`⚠️ [Backfill] Failed to record ${horizon} outcome for ${predictionId}`);
          }
        } catch (error: any) {
          errorCount++;
          console.error(`❌ [Backfill] Error recording ${horizon} for ${predictionId}:`, error.message);
        }
      }
      
      processedCount++;
    }
    
    console.log(`[Backfill] Progress: ${processedCount}/${entries.length} predictions, ${successCount} outcomes recorded, ${errorCount} errors`);
    console.log('');
    
    if (i + BATCH_SIZE < entries.length) {
      console.log(`[Backfill] Waiting ${RATE_LIMIT_DELAY}ms before next batch...`);
      await sleep(RATE_LIMIT_DELAY);
    }
  }
  
  console.log('='.repeat(60));
  console.log('🎉 [Backfill] Completed!');
  console.log(`   Total predictions processed: ${processedCount}`);
  console.log(`   Outcomes recorded: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('');
  
  console.log('[Backfill] Checking model training eligibility...');
  const status = await predictionLearningService.getModelStatus();
  console.log(`   Total features: ${status.totalFeatures}`);
  for (const horizon of HORIZONS) {
    console.log(`   ${horizon} ready to train: ${status.readyToTrain[horizon]}`);
  }
}

backfillOutcomes()
  .then(() => {
    console.log('[Backfill] Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Backfill] Script failed:', error);
    process.exit(1);
  });
