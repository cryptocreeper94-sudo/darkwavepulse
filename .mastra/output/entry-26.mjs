import axios from 'axios';

"use strict";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "";
const USE_PRO_API = COINGECKO_API_KEY.startsWith("CG-") || process.env.COINGECKO_PRO === "true";
const COINGECKO_PRO_URL = "https://pro-api.coingecko.com/api/v3";
const COINGECKO_FREE_URL = "https://api.coingecko.com/api/v3";
const FALLBACK_APIS = [
  { name: "CoinCap", baseUrl: "https://api.coincap.io/v2", rateLimit: 200 },
  { name: "CryptoCompare", baseUrl: "https://min-api.cryptocompare.com", rateLimit: 100 },
  { name: "Kraken", baseUrl: "https://api.kraken.com/0/public", rateLimit: 60 }
];
const CACHE_TTLS = {
  "/simple/price": 6e4,
  "/coins/markets": 12e4,
  "/coins/": 3e5,
  "/global": 3e5,
  "/search/trending": 3e5,
  "/coins/.*/ohlc": 12e4,
  "/coins/.*/market_chart": 12e4
};
function getCacheTTL(endpoint) {
  for (const [pattern, ttl] of Object.entries(CACHE_TTLS)) {
    if (endpoint.match(new RegExp(pattern))) return ttl;
  }
  return 6e4;
}
console.log(`[CoinGecko] Using ${USE_PRO_API ? "PRO" : "Demo"} API at ${USE_PRO_API ? COINGECKO_PRO_URL : COINGECKO_FREE_URL}`);
class CoinGeckoClient {
  client;
  freeClient;
  requestQueue = [];
  isProcessingQueue = false;
  lastRequestTime = 0;
  minRequestInterval = USE_PRO_API ? 500 : 2100;
  fallbackState = {
    currentIndex: 0,
    lastRotation: Date.now(),
    failureCount: {},
    cooldowns: {}
  };
  usingFallback = false;
  coinGeckoFailures = 0;
  MAX_COINGECKO_FAILURES = 3;
  COOLDOWN_DURATION = 6e4;
  responseCache = /* @__PURE__ */ new Map();
  dailyCallCount = 0;
  dailyCallDate = (/* @__PURE__ */ new Date()).toDateString();
  DAILY_CALL_BUDGET = 8e3;
  constructor() {
    this.client = axios.create({
      baseURL: USE_PRO_API ? COINGECKO_PRO_URL : COINGECKO_FREE_URL,
      timeout: 15e3,
      headers: { "Accept": "application/json" }
    });
    this.freeClient = axios.create({
      baseURL: COINGECKO_FREE_URL,
      timeout: 15e3,
      headers: { "Accept": "application/json" }
    });
    this.client.interceptors.request.use((config) => {
      if (COINGECKO_API_KEY) {
        if (USE_PRO_API) {
          config.headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
        } else {
          config.params = { ...config.params, x_cg_demo_api_key: COINGECKO_API_KEY };
        }
      }
      return config;
    });
    this.client.interceptors.response.use(
      (response) => {
        this.coinGeckoFailures = 0;
        return response;
      },
      async (error) => {
        if (error.response?.status === 429 || error.response?.status === 503 || error.response?.status >= 500) {
          this.coinGeckoFailures++;
          console.warn(`[CoinGecko] API error (${error.response?.status}) - failure count: ${this.coinGeckoFailures}/${this.MAX_COINGECKO_FAILURES}`);
          if (this.coinGeckoFailures >= this.MAX_COINGECKO_FAILURES) {
            console.warn("[CoinGecko] Max failures reached - switching to fallback APIs");
            this.usingFallback = true;
          }
        }
        throw error;
      }
    );
    setInterval(() => this.cleanCache(), 12e4);
  }
  getCacheKey(endpoint, config) {
    const params = config?.params ? JSON.stringify(config.params, Object.keys(config.params).sort()) : "";
    return `${endpoint}:${params}`;
  }
  getFromCache(key) {
    const entry = this.responseCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.responseCache.delete(key);
      return null;
    }
    return entry.data;
  }
  setCache(key, data, endpoint) {
    this.responseCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: getCacheTTL(endpoint)
    });
  }
  cleanCache() {
    const now = Date.now();
    for (const [key, entry] of this.responseCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.responseCache.delete(key);
      }
    }
  }
  trackDailyCall() {
    const today = (/* @__PURE__ */ new Date()).toDateString();
    if (today !== this.dailyCallDate) {
      console.log(`[CoinGecko] Daily reset - yesterday: ${this.dailyCallCount} calls`);
      this.dailyCallCount = 0;
      this.dailyCallDate = today;
    }
    this.dailyCallCount++;
    if (this.dailyCallCount % 100 === 0) {
      console.log(`[CoinGecko] Daily call count: ${this.dailyCallCount}/${this.DAILY_CALL_BUDGET}`);
    }
    if (this.dailyCallCount >= this.DAILY_CALL_BUDGET) {
      console.warn(`[CoinGecko] DAILY BUDGET EXCEEDED (${this.dailyCallCount}) - switching to fallbacks`);
      this.usingFallback = true;
    }
  }
  async throttledRequest(requestFn) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(
        (resolve) => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
    return requestFn();
  }
  getNextFallbackApi() {
    const now = Date.now();
    for (let i = 0; i < FALLBACK_APIS.length; i++) {
      const idx = (this.fallbackState.currentIndex + i) % FALLBACK_APIS.length;
      const api = FALLBACK_APIS[idx];
      const cooldownEnd = this.fallbackState.cooldowns[api.name] || 0;
      if (now > cooldownEnd) {
        this.fallbackState.currentIndex = (idx + 1) % FALLBACK_APIS.length;
        return api;
      }
    }
    return null;
  }
  setCooldown(apiName) {
    this.fallbackState.cooldowns[apiName] = Date.now() + this.COOLDOWN_DURATION;
    this.fallbackState.failureCount[apiName] = (this.fallbackState.failureCount[apiName] || 0) + 1;
    console.warn(`[Fallback] ${apiName} on cooldown for ${this.COOLDOWN_DURATION / 1e3}s`);
  }
  async fetchFromCoinCap(endpoint, params) {
    const api = FALLBACK_APIS[0];
    if (endpoint.includes("/coins/markets") || endpoint.includes("/simple/price")) {
      const response = await axios.get(`${api.baseUrl}/assets`, {
        timeout: 1e4,
        params: { limit: params.per_page || 50 }
      });
      return response.data.data.map((coin) => ({
        id: coin.id,
        symbol: coin.symbol.toLowerCase(),
        name: coin.name,
        current_price: parseFloat(coin.priceUsd),
        market_cap: parseFloat(coin.marketCapUsd),
        market_cap_rank: parseInt(coin.rank),
        total_volume: parseFloat(coin.volumeUsd24Hr),
        price_change_percentage_24h: parseFloat(coin.changePercent24Hr),
        image: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
      }));
    }
    if (endpoint.includes("/global")) {
      const response = await axios.get(`${api.baseUrl}/global`, { timeout: 1e4 });
      return {
        data: {
          total_market_cap: { usd: parseFloat(response.data.data.totalMarketCapUsd) },
          market_cap_change_percentage_24h_usd: parseFloat(response.data.data.marketCapChangePercent24Hr)
        }
      };
    }
    throw new Error("Endpoint not supported by CoinCap fallback");
  }
  async fetchFromCryptoCompare(endpoint, params) {
    const api = FALLBACK_APIS[1];
    if (endpoint.includes("/coins/markets") || endpoint.includes("/simple/price")) {
      const response = await axios.get(`${api.baseUrl}/data/top/mktcapfull`, {
        timeout: 1e4,
        params: { limit: params.per_page || 50, tsym: "USD" }
      });
      return response.data.Data.map((item, index) => ({
        id: item.CoinInfo.Name.toLowerCase(),
        symbol: item.CoinInfo.Name.toLowerCase(),
        name: item.CoinInfo.FullName,
        current_price: item.RAW?.USD?.PRICE || 0,
        market_cap: item.RAW?.USD?.MKTCAP || 0,
        market_cap_rank: index + 1,
        total_volume: item.RAW?.USD?.VOLUME24HOUR || 0,
        price_change_percentage_24h: item.RAW?.USD?.CHANGEPCT24HOUR || 0,
        image: `https://www.cryptocompare.com${item.CoinInfo.ImageUrl}`
      }));
    }
    throw new Error("Endpoint not supported by CryptoCompare fallback");
  }
  async fetchFromKraken(endpoint, params) {
    const api = FALLBACK_APIS[2];
    if (endpoint.includes("/simple/price")) {
      const ids = params.ids?.split(",") || [];
      const results = {};
      for (const id of ids.slice(0, 10)) {
        const symbol = this.coinIdToKrakenPair(id);
        if (!symbol) continue;
        try {
          const response = await axios.get(`${api.baseUrl}/Ticker`, {
            timeout: 5e3,
            params: { pair: symbol }
          });
          if (response.data.result) {
            const pairData = Object.values(response.data.result)[0];
            results[id] = {
              usd: parseFloat(pairData.c[0]),
              usd_24h_change: (parseFloat(pairData.c[0]) - parseFloat(pairData.o)) / parseFloat(pairData.o) * 100,
              usd_24h_vol: parseFloat(pairData.v[1])
            };
          }
        } catch (e) {
          continue;
        }
      }
      return results;
    }
    if (endpoint.includes("/coins/markets")) {
      const response = await axios.get(`${api.baseUrl}/Ticker`, {
        timeout: 1e4,
        params: { pair: "BTCUSD,ETHUSD,SOLUSD,XRPUSD,ADAUSD,DOGEUSD,DOTUSD,LINKUSD,LTCUSD,UNIUSD" }
      });
      if (response.data.result) {
        const coins = [];
        const pairMapping = {
          "XXBTZUSD": { id: "bitcoin", name: "Bitcoin", symbol: "btc" },
          "XETHZUSD": { id: "ethereum", name: "Ethereum", symbol: "eth" },
          "SOLUSD": { id: "solana", name: "Solana", symbol: "sol" },
          "XXRPZUSD": { id: "ripple", name: "XRP", symbol: "xrp" },
          "ADAUSD": { id: "cardano", name: "Cardano", symbol: "ada" },
          "XDGUSD": { id: "dogecoin", name: "Dogecoin", symbol: "doge" },
          "DOTUSD": { id: "polkadot", name: "Polkadot", symbol: "dot" },
          "LINKUSD": { id: "chainlink", name: "Chainlink", symbol: "link" },
          "XLTCZUSD": { id: "litecoin", name: "Litecoin", symbol: "ltc" },
          "UNIUSD": { id: "uniswap", name: "Uniswap", symbol: "uni" }
        };
        let rank = 1;
        for (const [pair, data] of Object.entries(response.data.result)) {
          const mapping = pairMapping[pair];
          if (mapping) {
            const pairData = data;
            coins.push({
              id: mapping.id,
              symbol: mapping.symbol,
              name: mapping.name,
              current_price: parseFloat(pairData.c[0]),
              market_cap: 0,
              market_cap_rank: rank++,
              total_volume: parseFloat(pairData.v[1]) * parseFloat(pairData.c[0]),
              price_change_percentage_24h: (parseFloat(pairData.c[0]) - parseFloat(pairData.o)) / parseFloat(pairData.o) * 100,
              image: `https://assets.coincap.io/assets/icons/${mapping.symbol}@2x.png`
            });
          }
        }
        return coins;
      }
    }
    throw new Error("Endpoint not supported by Kraken fallback");
  }
  coinIdToKrakenPair(coinId) {
    const mapping = {
      "bitcoin": "XBTUSD",
      "ethereum": "ETHUSD",
      "solana": "SOLUSD",
      "ripple": "XRPUSD",
      "cardano": "ADAUSD",
      "dogecoin": "DOGEUSD",
      "polkadot": "DOTUSD",
      "chainlink": "LINKUSD",
      "litecoin": "LTCUSD",
      "uniswap": "UNIUSD",
      "stellar": "XLMUSD",
      "cosmos": "ATOMUSD"
    };
    return mapping[coinId] || null;
  }
  coinIdToSymbol(coinId) {
    const mapping = {
      "bitcoin": "BTC",
      "ethereum": "ETH",
      "solana": "SOL",
      "binancecoin": "BNB",
      "ripple": "XRP",
      "cardano": "ADA",
      "dogecoin": "DOGE",
      "polkadot": "DOT",
      "avalanche-2": "AVAX",
      "chainlink": "LINK",
      "polygon": "MATIC",
      "litecoin": "LTC",
      "uniswap": "UNI",
      "stellar": "XLM",
      "cosmos": "ATOM"
    };
    return mapping[coinId] || null;
  }
  async tryFallbackApis(endpoint, params) {
    const errors = [];
    for (let attempt = 0; attempt < FALLBACK_APIS.length; attempt++) {
      const api = this.getNextFallbackApi();
      if (!api) {
        console.warn("[Fallback] All APIs on cooldown - waiting...");
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        continue;
      }
      try {
        console.log(`[Fallback] Trying ${api.name}...`);
        let result;
        switch (api.name) {
          case "CoinCap":
            result = await this.fetchFromCoinCap(endpoint, params);
            break;
          case "CryptoCompare":
            result = await this.fetchFromCryptoCompare(endpoint, params);
            break;
          case "Kraken":
            result = await this.fetchFromKraken(endpoint, params);
            break;
          default:
            throw new Error(`Unknown API: ${api.name}`);
        }
        console.log(`[Fallback] ${api.name} succeeded`);
        this.fallbackState.failureCount[api.name] = 0;
        return result;
      } catch (error) {
        errors.push(`${api.name}: ${error.message}`);
        this.setCooldown(api.name);
      }
    }
    throw new Error(`All fallback APIs failed: ${errors.join("; ")}`);
  }
  async get(endpoint, config) {
    const cacheKey = this.getCacheKey(endpoint, config);
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) {
      return cached;
    }
    return this.throttledRequest(async () => {
      const cachedAgain = this.getFromCache(cacheKey);
      if (cachedAgain !== null) return cachedAgain;
      this.trackDailyCall();
      if (!this.usingFallback) {
        try {
          const response = await this.client.get(endpoint, config);
          this.setCache(cacheKey, response.data, endpoint);
          return response.data;
        } catch (error) {
          if (error.response?.status === 429 || error.response?.status >= 500) {
            console.warn(`[CoinGecko] Pro API failed (${error.response?.status}), trying fallback APIs...`);
            try {
              const result = await this.tryFallbackApis(endpoint, config?.params || {});
              this.setCache(cacheKey, result, endpoint);
              return result;
            } catch (fallbackError) {
              console.warn(`[CoinGecko] All fallbacks failed: ${fallbackError.message}`);
              throw error;
            }
          }
          throw error;
        }
      } else {
        const now = Date.now();
        if (now - this.fallbackState.lastRotation > 3e5) {
          console.log("[CoinGecko] Attempting to restore primary API...");
          this.usingFallback = false;
          this.coinGeckoFailures = 0;
          this.fallbackState.lastRotation = now;
          try {
            const response = await this.client.get(endpoint, config);
            console.log("[CoinGecko] Primary API restored successfully");
            this.setCache(cacheKey, response.data, endpoint);
            return response.data;
          } catch (error) {
            console.warn("[CoinGecko] Primary API still failing, continuing with fallbacks");
            this.usingFallback = true;
          }
        }
        const result = await this.tryFallbackApis(endpoint, config?.params || {});
        this.setCache(cacheKey, result, endpoint);
        return result;
      }
    });
  }
  async getMarketChart(coinId = "bitcoin", days = 1, vsCurrency = "usd") {
    return this.get(`/coins/${coinId}/market_chart`, {
      params: { vs_currency: vsCurrency, days }
    });
  }
  async getOHLC(coinId = "bitcoin", days = 1, vsCurrency = "usd") {
    return this.get(`/coins/${coinId}/ohlc`, {
      params: { vs_currency: vsCurrency, days }
    });
  }
  async getMarkets(params = {}) {
    return this.get("/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: "24h",
        ...params
      }
    });
  }
  async getSimplePrice(ids, vsCurrencies = "usd", includeMarketCap = true, include24hrVol = true, include24hrChange = true) {
    return this.get("/simple/price", {
      params: {
        ids,
        vs_currencies: vsCurrencies,
        include_market_cap: includeMarketCap,
        include_24hr_vol: include24hrVol,
        include_24hr_change: include24hrChange,
        include_market_cap_change_percentage_24h_in: vsCurrencies
      }
    });
  }
  async getCoinDetails(coinId) {
    return this.get(`/coins/${coinId}`, {
      params: { localization: false }
    });
  }
  async getGlobal() {
    return this.get("/global");
  }
  async getTrending() {
    return this.get("/search/trending");
  }
  hasApiKey() {
    return !!COINGECKO_API_KEY;
  }
  getApiStatus() {
    return {
      hasKey: !!COINGECKO_API_KEY,
      isPro: USE_PRO_API,
      baseUrl: USE_PRO_API ? COINGECKO_PRO_URL : COINGECKO_FREE_URL,
      usingFallback: this.usingFallback,
      failureCount: this.coinGeckoFailures,
      dailyCalls: this.dailyCallCount,
      cacheSize: this.responseCache.size
    };
  }
  resetFallbackState() {
    this.usingFallback = false;
    this.coinGeckoFailures = 0;
    this.fallbackState = {
      currentIndex: 0,
      lastRotation: Date.now(),
      failureCount: {},
      cooldowns: {}
    };
    console.log("[CoinGecko] Fallback state reset");
  }
}
const coinGeckoClient = new CoinGeckoClient();

"use strict";
const STOCK_TICKERS = {
  top: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK.B", "V", "JPM", "WMT", "LLY", "UNH", "XOM", "MA", "PG", "JNJ", "HD", "MRK", "CVX"],
  trending: ["NVDA", "TSLA", "AMD", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NFLX", "COIN", "PLTR", "RIVN", "LCID", "NIO", "SOFI", "HOOD", "RBLX", "U", "SNOW", "DKNG"],
  gainers: ["NVDA", "AMD", "TSLA", "PLTR", "COIN", "RBLX", "SNOW", "DKNG", "NET", "DDOG", "ZS", "CRWD", "OKTA", "TEAM", "SHOP", "SQ", "PYPL", "ROKU", "UBER", "LYFT"],
  losers: ["INTC", "T", "VZ", "PFE", "CVS", "KO", "PEP", "WMT", "TGT", "HD", "LOW", "NKE", "DIS", "BA", "GE", "F", "GM", "DAL", "AAL", "UAL"],
  new: ["RIVN", "LCID", "RBLX", "COIN", "HOOD", "SOFI", "UPST", "OPEN", "WISH", "CLOV"],
  defi: [],
  // Stocks don't have DeFi category
  nft: []
  // Stocks don't have NFT category
};
const marketCache = /* @__PURE__ */ new Map();
const CACHE_TTL = 10 * 60 * 1e3;
async function fetchStocksOverview(category, logger) {
  logger?.info("\u{1F4CA} [MarketOverview] Fetching stocks", { category });
  const cacheKey = `market:stocks:${category}`;
  const cached = marketCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger?.info("\u{1F4E6} [MarketOverview] Using cached stocks data", { category });
    return cached.data;
  }
  const tickers = STOCK_TICKERS[category] || STOCK_TICKERS.top;
  if (tickers.length === 0) {
    logger?.warn("\u26A0\uFE0F [MarketOverview] No stock tickers for category", { category });
    return [];
  }
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    logger?.error("\u274C [MarketOverview] Finnhub API key not found");
    return [];
  }
  try {
    const normalized = [];
    const topTickers = tickers.slice(0, 20);
    logger?.info("\u{1F310} [MarketOverview] Fetching from Finnhub", { count: topTickers.length });
    const batchSize = 5;
    for (let i = 0; i < topTickers.length; i += batchSize) {
      const batch = topTickers.slice(i, i + batchSize);
      await Promise.all(batch.map(async (symbol) => {
        try {
          const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
          const quoteResp = await axios.get(quoteUrl, { timeout: 1e4 });
          const quote = quoteResp.data;
          const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
          const profileResp = await axios.get(profileUrl, { timeout: 1e4 });
          const profile = profileResp.data;
          if (quote && quote.c) {
            const price = quote.c;
            const changePercent = quote.dp || 0;
            normalized.push({
              rank: normalized.length + 1,
              symbol,
              name: profile?.name || symbol,
              price,
              change_1h: 0,
              // Finnhub doesn't provide 1h change for stocks
              change_24h: changePercent,
              change_7d: 0,
              market_cap: profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : 0,
              volume_24h: quote.v || 0,
              // v = volume
              sparkline_7d: []
            });
            logger?.info(`\u2705 [MarketOverview] Fetched ${symbol}`, {
              price,
              change: changePercent
            });
          }
        } catch (err) {
          logger?.warn("\u26A0\uFE0F [MarketOverview] Failed to fetch stock", {
            symbol,
            error: err.message
          });
        }
      }));
      if (i + batchSize < topTickers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
    }
    if (category === "gainers") {
      normalized.sort((a, b) => b.change_24h - a.change_24h);
    } else if (category === "losers") {
      normalized.sort((a, b) => a.change_24h - b.change_24h);
    } else if (category === "trending") {
      normalized.sort((a, b) => b.volume_24h - a.volume_24h);
    } else {
      normalized.sort((a, b) => b.market_cap - a.market_cap);
    }
    normalized.forEach((item, index) => {
      item.rank = index + 1;
    });
    marketCache.set(cacheKey, {
      data: normalized,
      timestamp: Date.now()
    });
    logger?.info("\u2705 [MarketOverview] Stocks data normalized", { count: normalized.length });
    return normalized;
  } catch (error) {
    logger?.error("\u274C [MarketOverview] Finnhub error", {
      error: error.message,
      category
    });
    return [];
  }
}
async function fetchCryptoOverview(category, logger) {
  logger?.info("\u{1F4CA} [MarketOverview] Fetching crypto", { category });
  const cacheKey = `market:crypto:${category}`;
  const cached = marketCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger?.info("\u{1F4E6} [MarketOverview] Using cached crypto data", { category });
    return cached.data;
  }
  try {
    let params = {
      vs_currency: "usd",
      sparkline: true,
      price_change_percentage: "1h,24h,7d",
      per_page: 50,
      order: "market_cap_desc"
    };
    if (category === "trending") {
      params.order = "volume_desc";
    } else if (category === "gainers" || category === "losers") {
      params.per_page = 100;
    } else if (category === "new") {
      params.order = "gecko_desc";
    } else if (category === "defi") {
      params.ids = "uniswap,aave,maker,lido-dao,curve-dao-token,compound-governance-token,pancakeswap-token,synthetix-network-token,yearn-finance,sushi,thorchain,convex-finance,frax-share,rocket-pool,balancer,1inch,0x,raydium,gmx,ribbon-finance";
    }
    let data = await coinGeckoClient.getMarkets(params);
    if (category === "gainers") {
      data = data.filter((coin) => coin.price_change_percentage_24h > 0).sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)).slice(0, 100);
    } else if (category === "losers") {
      data = data.filter((coin) => coin.price_change_percentage_24h < 0).sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)).slice(0, 100);
    }
    marketCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    logger?.info("\u2705 [MarketOverview] Crypto data fetched", { count: data.length });
    return data;
  } catch (error) {
    logger?.error("\u274C [MarketOverview] CoinGecko error", {
      error: error.message,
      category
    });
    return [];
  }
}

export { STOCK_TICKERS, fetchCryptoOverview, fetchStocksOverview };
