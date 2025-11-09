import axios from 'axios';

/**
 * Market Overview Helper
 * Provides batch fetching for stocks and crypto market data
 * Maps categories to ticker lists and normalizes data for CMC-style tables
 */

// Stock ticker mappings by category
export const STOCK_TICKERS = {
  top: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'V', 'JPM', 'WMT', 'LLY', 'UNH', 'XOM', 'MA', 'PG', 'JNJ', 'HD', 'MRK', 'CVX'],
  trending: ['NVDA', 'TSLA', 'AMD', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'COIN', 'PLTR', 'RIVN', 'LCID', 'NIO', 'SOFI', 'HOOD', 'RBLX', 'U', 'SNOW', 'DKNG'],
  gainers: ['NVDA', 'AMD', 'TSLA', 'PLTR', 'COIN', 'RBLX', 'SNOW', 'DKNG', 'NET', 'DDOG', 'ZS', 'CRWD', 'OKTA', 'TEAM', 'SHOP', 'SQ', 'PYPL', 'ROKU', 'UBER', 'LYFT'],
  losers: ['INTC', 'T', 'VZ', 'PFE', 'CVS', 'KO', 'PEP', 'WMT', 'TGT', 'HD', 'LOW', 'NKE', 'DIS', 'BA', 'GE', 'F', 'GM', 'DAL', 'AAL', 'UAL'],
  new: ['RIVN', 'LCID', 'RBLX', 'COIN', 'HOOD', 'SOFI', 'UPST', 'OPEN', 'WISH', 'CLOV'],
  defi: [], // Stocks don't have DeFi category
  nft: [] // Stocks don't have NFT category
};

// Cache for market data (5 minutes TTL)
const marketCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface MarketOverviewItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  change_1h?: number;
  change_24h: number;
  change_7d?: number;
  market_cap: number;
  volume_24h: number;
  sparkline_7d?: number[];
}

/**
 * Fetch stock market overview data from Finnhub (60 calls/min - much faster than Alpha Vantage!)
 */
export async function fetchStocksOverview(category: string, logger?: any): Promise<MarketOverviewItem[]> {
  logger?.info('📊 [MarketOverview] Fetching stocks', { category });
  
  // Check cache first
  const cacheKey = `market:stocks:${category}`;
  const cached = marketCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    logger?.info('📦 [MarketOverview] Using cached stocks data', { category });
    return cached.data;
  }
  
  const tickers = STOCK_TICKERS[category as keyof typeof STOCK_TICKERS] || STOCK_TICKERS.top;
  
  if (tickers.length === 0) {
    logger?.warn('⚠️ [MarketOverview] No stock tickers for category', { category });
    return [];
  }
  
  const apiKey = process.env.FINNHUB_API_KEY;
  
  if (!apiKey) {
    logger?.error('❌ [MarketOverview] Finnhub API key not found');
    return [];
  }
  
  try {
    const normalized: MarketOverviewItem[] = [];
    const topTickers = tickers.slice(0, 20); // Can fetch 20 stocks quickly (60 calls/min limit)
    
    logger?.info('🌐 [MarketOverview] Fetching from Finnhub', { count: topTickers.length });
    
    // Fetch all stocks in parallel batches to stay under rate limit
    const batchSize = 5;
    for (let i = 0; i < topTickers.length; i += batchSize) {
      const batch = topTickers.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (symbol) => {
        try {
          // Get quote data
          const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
          const quoteResp = await axios.get(quoteUrl, { timeout: 10000 });
          const quote = quoteResp.data;
          
          // Get company profile for name and market cap
          const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
          const profileResp = await axios.get(profileUrl, { timeout: 10000 });
          const profile = profileResp.data;
          
          if (quote && quote.c) { // c = current price
            const price = quote.c;
            const changePercent = quote.dp || 0; // dp = percent change
            
            normalized.push({
              rank: normalized.length + 1,
              symbol: symbol,
              name: profile?.name || symbol,
              price: price,
              change_1h: 0, // Finnhub doesn't provide 1h change for stocks
              change_24h: changePercent,
              change_7d: 0,
              market_cap: profile?.marketCapitalization ? profile.marketCapitalization * 1000000 : 0,
              volume_24h: quote.v || 0, // v = volume
              sparkline_7d: []
            });
            
            logger?.info(`✅ [MarketOverview] Fetched ${symbol}`, { 
              price,
              change: changePercent 
            });
          }
        } catch (err: any) {
          logger?.warn('⚠️ [MarketOverview] Failed to fetch stock', { 
            symbol,
            error: err.message 
          });
        }
      }));
      
      // Wait 1 second between batches to respect rate limit (60 calls/min = 1 call/second)
      if (i + batchSize < topTickers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Sort by category
    if (category === 'gainers') {
      normalized.sort((a, b) => b.change_24h - a.change_24h);
    } else if (category === 'losers') {
      normalized.sort((a, b) => a.change_24h - b.change_24h);
    } else if (category === 'trending') {
      normalized.sort((a, b) => b.volume_24h - a.volume_24h);
    } else {
      normalized.sort((a, b) => b.market_cap - a.market_cap);
    }
    
    // Update ranks after sorting
    normalized.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    // Cache the result
    marketCache.set(cacheKey, {
      data: normalized,
      timestamp: Date.now()
    });
    
    logger?.info('✅ [MarketOverview] Stocks data normalized', { count: normalized.length });
    return normalized;
    
  } catch (error: any) {
    logger?.error('❌ [MarketOverview] Finnhub error', { 
      error: error.message,
      category 
    });
    
    return [];
  }
}

/**
 * Fetch crypto market overview from CoinGecko
 * (Keep this for potential backend caching in the future)
 */
export async function fetchCryptoOverview(category: string, logger?: any): Promise<any[]> {
  logger?.info('📊 [MarketOverview] Fetching crypto', { category });
  
  // Check cache first
  const cacheKey = `market:crypto:${category}`;
  const cached = marketCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    logger?.info('📦 [MarketOverview] Using cached crypto data', { category });
    return cached.data;
  }
  
  try {
    let url = '';
    
    // Build CoinGecko URL based on category
    if (category === 'top') {
      url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=true&price_change_percentage=1h,24h,7d';
    } else if (category === 'trending') {
      url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=50&sparkline=true&price_change_percentage=1h,24h,7d';
    } else if (category === 'gainers' || category === 'losers') {
      url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=true&price_change_percentage=1h,24h,7d';
    } else if (category === 'new') {
      url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=gecko_desc&per_page=50&sparkline=true&price_change_percentage=1h,24h,7d';
    } else if (category === 'defi') {
      const defiIds = 'uniswap,aave,maker,lido-dao,curve-dao-token,compound-governance-token,pancakeswap-token,synthetix-network-token,yearn-finance,sushi,thorchain,convex-finance,frax-share,rocket-pool,balancer,1inch,0x,raydium,gmx,ribbon-finance';
      url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${defiIds}&order=market_cap_desc&per_page=50&sparkline=true&price_change_percentage=1h,24h,7d`;
    } else {
      // Default to top
      url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=true&price_change_percentage=1h,24h,7d';
    }
    
    const response = await axios.get(url, { timeout: 10000 });
    let data = response.data;
    
    // Filter and sort for gainers/losers
    if (category === 'gainers') {
      data = data
        .filter((coin: any) => coin.price_change_percentage_24h > 0)
        .sort((a: any, b: any) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
        .slice(0, 100);
    } else if (category === 'losers') {
      data = data
        .filter((coin: any) => coin.price_change_percentage_24h < 0)
        .sort((a: any, b: any) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
        .slice(0, 100);
    }
    
    // Cache the result
    marketCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    logger?.info('✅ [MarketOverview] Crypto data fetched', { count: data.length });
    return data;
    
  } catch (error: any) {
    logger?.error('❌ [MarketOverview] CoinGecko error', { 
      error: error.message,
      category 
    });
    return [];
  }
}
