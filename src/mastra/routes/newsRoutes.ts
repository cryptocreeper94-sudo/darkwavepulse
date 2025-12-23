import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Pulse/1.0 (DarkWave Studios)',
  },
});

interface NewsItem {
  source: string;
  title: string;
  time: string;
  url: string;
}

const NEWS_FEEDS = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  { name: 'The Block', url: 'https://www.theblock.co/rss.xml' },
];

let cachedNews: NewsItem[] = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000;

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

async function fetchAllNews(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return parsed.items.slice(0, 5).map((item) => ({
          source: feed.name,
          title: item.title || 'Untitled',
          time: item.pubDate ? formatTimeAgo(new Date(item.pubDate)) : 'Today',
          url: item.link || `https://${feed.name.toLowerCase().replace(/\s/g, '')}.com`,
        }));
      } catch (err) {
        console.log(`Failed to fetch ${feed.name} RSS:`, err);
        return [];
      }
    })
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
    }
  });

  allNews.sort((a, b) => {
    const timeOrder = ['m ago', 'h ago', 'Yesterday', 'd ago', 'Today'];
    const getOrder = (t: string) => {
      for (let i = 0; i < timeOrder.length; i++) {
        if (t.includes(timeOrder[i].replace('m ago', '')) || t === timeOrder[i]) {
          const num = parseInt(t) || 0;
          return i * 1000 + num;
        }
      }
      return 9999;
    };
    return getOrder(a.time) - getOrder(b.time);
  });

  return allNews.slice(0, 20);
}

export const newsRoutes = [
  {
    path: '/api/crypto/news',
    method: 'GET' as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra?.getLogger();
      
      try {
        const now = Date.now();
        
        if (cachedNews.length > 0 && now - lastFetch < CACHE_DURATION) {
          return c.json({ news: cachedNews, cached: true });
        }

        const news = await fetchAllNews();
        
        if (news.length > 0) {
          cachedNews = news;
          lastFetch = now;
        }

        logger?.info(`[News] Fetched ${news.length} articles from RSS feeds`);
        
        return c.json({ 
          news: news.length > 0 ? news : cachedNews,
          cached: news.length === 0 && cachedNews.length > 0 
        });
      } catch (err) {
        logger?.error('[News] Error fetching news:', err);
        
        if (cachedNews.length > 0) {
          return c.json({ news: cachedNews, cached: true, error: 'Using cached data' });
        }
        
        return c.json({ 
          news: [
            { source: 'CoinDesk', title: 'Market Analysis: Key Levels to Watch This Week', time: 'Today', url: 'https://coindesk.com' },
            { source: 'CoinTelegraph', title: 'Institutional Adoption Continues to Drive Crypto Growth', time: 'Today', url: 'https://cointelegraph.com' },
            { source: 'The Block', title: 'DeFi Protocol Activity Reaches New Highs', time: 'Today', url: 'https://theblock.co' },
            { source: 'Decrypt', title: 'AI and Blockchain Integration Trends for 2025', time: 'Today', url: 'https://decrypt.co' },
          ],
          cached: false,
          fallback: true 
        });
      }
    },
  },
];
