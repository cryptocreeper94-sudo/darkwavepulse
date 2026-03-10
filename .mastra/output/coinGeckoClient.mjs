import axios from 'axios';
import * as fs from 'fs';
import * as pathLib from 'path';

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
  "/simple/price": 3e5,
  "/coins/markets": 6e5,
  "/coins/": 6e5,
  "/global": 6e5,
  "/search/trending": 6e5,
  "/coins/.*/ohlc": 6e5,
  "/coins/.*/market_chart": 6e5
};
const STALE_MULTIPLIER = 5;
function getCacheTTL(endpoint) {
  for (const [pattern, ttl] of Object.entries(CACHE_TTLS)) {
    if (endpoint.match(new RegExp(pattern))) return ttl;
  }
  return 3e5;
}
const DISK_CACHE_DIR = pathLib.join(process.cwd(), ".cache");
try {
  if (!fs.existsSync(DISK_CACHE_DIR)) fs.mkdirSync(DISK_CACHE_DIR, { recursive: true });
} catch {
}
function saveToDisk(key, data) {
  try {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
    fs.writeFileSync(
      pathLib.join(DISK_CACHE_DIR, `${safeKey}.json`),
      JSON.stringify({ data, timestamp: Date.now() }),
      "utf-8"
    );
  } catch {
  }
}
function loadFromDisk(key) {
  try {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
    const filePath = pathLib.join(DISK_CACHE_DIR, `${safeKey}.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
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
  fallbackSwitchedAt = 0;
  FALLBACK_RECOVERY_INTERVAL = 3e5;
  coinGeckoFailures = 0;
  MAX_COINGECKO_FAILURES = 3;
  COOLDOWN_DURATION = 3e4;
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
            console.warn("[CoinGecko] Max failures reached - switching to fallback APIs for 5 minutes");
            this.usingFallback = true;
            this.fallbackSwitchedAt = Date.now();
          }
        }
        throw error;
      }
    );
    setInterval(() => this.cleanCache(), 12e4);
    this.loadDiskCacheOnStartup();
  }
  getCacheKey(endpoint, config) {
    const params = config?.params ? JSON.stringify(config.params, Object.keys(config.params).sort()) : "";
    return `${endpoint}:${params}`;
  }
  getFromCache(key) {
    const entry = this.responseCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      return null;
    }
    return entry.data;
  }
  getStaleFromCache(key) {
    const entry = this.responseCache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl * STALE_MULTIPLIER) {
      return entry.data;
    }
    const diskEntry = loadFromDisk(key);
    if (diskEntry && Date.now() - diskEntry.timestamp < 36e5) {
      return diskEntry.data;
    }
    return null;
  }
  setCache(key, data, endpoint) {
    const ttl = getCacheTTL(endpoint);
    this.responseCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    saveToDisk(key, data);
  }
  cleanCache() {
    const now = Date.now();
    for (const [key, entry] of this.responseCache.entries()) {
      if (now - entry.timestamp > entry.ttl * STALE_MULTIPLIER) {
        this.responseCache.delete(key);
      }
    }
  }
  loadDiskCacheOnStartup() {
    try {
      const files = fs.readdirSync(DISK_CACHE_DIR);
      let loaded = 0;
      const maxCacheEntries = 10;
      for (const file of files) {
        if (!file.endsWith(".json") || loaded >= maxCacheEntries) continue;
        try {
          const raw = fs.readFileSync(pathLib.join(DISK_CACHE_DIR, file), "utf-8");
          const { data, timestamp } = JSON.parse(raw);
          if (Date.now() - timestamp < 36e5) {
            const key = file.replace(".json", "");
            this.responseCache.set(key, { data, timestamp, ttl: 6e5 });
            loaded++;
          }
        } catch {
        }
      }
      console.log(`[Cache] Loaded ${this.responseCache.size} entries from disk (max ${maxCacheEntries})`);
    } catch {
    }
  }
  trackDailyCall() {
    const today = (/* @__PURE__ */ new Date()).toDateString();
    if (today !== this.dailyCallDate) {
      console.log(`[CoinGecko] Daily reset - yesterday: ${this.dailyCallCount} calls`);
      this.dailyCallCount = 0;
      this.dailyCallDate = today;
      this.usingFallback = false;
      this.coinGeckoFailures = 0;
      console.log("[CoinGecko] Daily reset - restored primary API");
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
        params: { limit: params.per_page || 10 }
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
    console.log(`[CryptoCompare DEBUG] endpoint="${endpoint}", params.per_page=${params.per_page}, params keys=${Object.keys(params).join(",")}`);
    if (endpoint.includes("/coins/markets") || endpoint.includes("/simple/price")) {
      const requestedLimit = params.per_page || 10;
      console.log(`[CryptoCompare] Requesting ${requestedLimit} coins (per_page: ${params.per_page}, endpoint: ${endpoint})`);
      const response = await axios.get(`${api.baseUrl}/data/top/mktcapfull`, {
        timeout: 1e4,
        params: { limit: requestedLimit, tsym: "USD" }
      });
      console.log(`[CryptoCompare] API returned ${response.data.Data?.length} coins`);
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
    if (endpoint.includes("/ohlc") || endpoint.includes("/market_chart")) {
      const coinMatch = endpoint.match(/\/coins\/([^/]+)\//);
      const coinId = coinMatch ? coinMatch[1] : "bitcoin";
      const symbol = this.coinIdToSymbol(coinId) || coinId.toUpperCase();
      const days = params.days || 7;
      const daysNum = typeof days === "string" ? parseInt(days) : days;
      let apiEndpoint;
      let limit;
      if (daysNum <= 1) {
        apiEndpoint = `${api.baseUrl}/data/v2/histohour`;
        limit = 24;
      } else if (daysNum <= 30) {
        apiEndpoint = `${api.baseUrl}/data/v2/histohour`;
        limit = Math.min(daysNum * 24, 720);
      } else {
        apiEndpoint = `${api.baseUrl}/data/v2/histoday`;
        limit = Math.min(daysNum, 365);
      }
      const response = await axios.get(apiEndpoint, {
        timeout: 1e4,
        params: { fsym: symbol, tsym: "USD", limit }
      });
      const histData = response.data?.Data?.Data || [];
      if (endpoint.includes("/ohlc")) {
        return histData.map((d) => [
          d.time * 1e3,
          d.open,
          d.high,
          d.low,
          d.close
        ]);
      }
      return {
        prices: histData.map((d) => [d.time * 1e3, d.close]),
        market_caps: histData.map((d) => [d.time * 1e3, 0]),
        total_volumes: histData.map((d) => [d.time * 1e3, d.volumeto])
      };
    }
    if (endpoint.includes("/global")) {
      const response = await axios.get(`${api.baseUrl}/data/top/mktcapfull`, {
        timeout: 1e4,
        params: { limit: 10, tsym: "USD" }
      });
      let totalMcap = 0;
      let btcMcap = 0;
      let ethMcap = 0;
      for (const item of response.data.Data || []) {
        const mcap = item.RAW?.USD?.MKTCAP || 0;
        totalMcap += mcap;
        if (item.CoinInfo.Name === "BTC") btcMcap = mcap;
        if (item.CoinInfo.Name === "ETH") ethMcap = mcap;
      }
      return {
        data: {
          total_market_cap: { usd: totalMcap },
          market_cap_change_percentage_24h_usd: 0,
          market_cap_percentage: {
            btc: totalMcap > 0 ? btcMcap / totalMcap * 100 : 54,
            eth: totalMcap > 0 ? ethMcap / totalMcap * 100 : 12
          },
          active_cryptocurrencies: 15e3,
          markets: 800
        }
      };
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
      const requestedCount = params.per_page || 10;
      if (requestedCount > 10) {
        throw new Error("Kraken only supports up to 10 market pairs - use CryptoCompare for larger requests");
      }
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
        throw new Error(`All fallback APIs on cooldown: ${errors.join("; ")}`);
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
    const staleData = this.getStaleFromCache(cacheKey);
    return this.throttledRequest(async () => {
      const cachedAgain = this.getFromCache(cacheKey);
      if (cachedAgain !== null) return cachedAgain;
      this.trackDailyCall();
      const tryFetchFresh = async () => {
        if (!this.usingFallback) {
          try {
            const response = await this.client.get(endpoint, config);
            this.setCache(cacheKey, response.data, endpoint);
            return response.data;
          } catch (error) {
            if (error.response?.status === 429 || error.response?.status >= 500) {
              console.warn(`[CoinGecko] Pro API failed (${error.response?.status}), trying fallback APIs...`);
              const result = await this.tryFallbackApis(endpoint, config?.params || {});
              this.setCache(cacheKey, result, endpoint);
              return result;
            }
            throw error;
          }
        } else {
          const now = Date.now();
          const timeSinceFallback = now - this.fallbackSwitchedAt;
          if (timeSinceFallback > this.FALLBACK_RECOVERY_INTERVAL) {
            console.log(`[CoinGecko] ${Math.round(timeSinceFallback / 6e4)}min on fallback - attempting to restore primary API...`);
            this.usingFallback = false;
            this.coinGeckoFailures = 0;
            this.fallbackSwitchedAt = now;
            try {
              const response = await this.client.get(endpoint, config);
              console.log("[CoinGecko] Primary API restored successfully");
              this.setCache(cacheKey, response.data, endpoint);
              return response.data;
            } catch (error) {
              console.warn("[CoinGecko] Primary API still failing, continuing with fallbacks");
              this.usingFallback = true;
              this.fallbackSwitchedAt = now;
            }
          }
          const result = await this.tryFallbackApis(endpoint, config?.params || {});
          this.setCache(cacheKey, result, endpoint);
          return result;
        }
      };
      try {
        return await tryFetchFresh();
      } catch (error) {
        if (staleData !== null) {
          console.warn(`[Cache] Serving stale data for ${endpoint} (all APIs failed)`);
          return staleData;
        }
        throw error;
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

export { coinGeckoClient as c };
//# sourceMappingURL=coinGeckoClient.mjs.map
