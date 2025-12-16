import express from 'express';
import cors from 'cors';
import { apiKeyService } from '../services/apiKeyService.js';

const app = express();
app.use(cors());
app.use(express.json());

async function validateApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const startTime = Date.now();
  const apiKey = req.headers['x-pulse-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key', code: 'MISSING_API_KEY' });
  }
  
  const validation = await apiKeyService.validateApiKey(apiKey);
  
  if (!validation.valid || !validation.keyRecord) {
    return res.status(401).json({ error: validation.error || 'Invalid API key', code: 'INVALID_API_KEY' });
  }
  
  const keyRecord = validation.keyRecord;
  const rateLimit = await apiKeyService.checkRateLimit(keyRecord.id, keyRecord.rateLimit || 60);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      code: 'RATE_LIMIT_EXCEEDED',
      resetIn: rateLimit.resetIn 
    });
  }
  
  const permissions = keyRecord.permissions ? JSON.parse(keyRecord.permissions) : ['market:read'];
  
  (req as any).apiKey = {
    keyId: keyRecord.id,
    tier: keyRecord.tier,
    permissions,
    userId: keyRecord.userId,
    rateLimit: keyRecord.rateLimit
  };
  (req as any).startTime = startTime;
  
  next();
}

function requirePermission(permission: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const permissions = (req as any).apiKey?.permissions || [];
    if (!permissions.includes(permission) && !permissions.includes('*')) {
      return res.status(403).json({ 
        error: `Missing required permission: ${permission}`, 
        code: 'INSUFFICIENT_PERMISSION' 
      });
    }
    next();
  };
}

app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '1.0.0', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/v1/market-overview', validateApiKey, requirePermission('market:read'), async (req, res) => {
  try {
    const category = (req.query.category as string) || 'top';
    const { coinGeckoClient } = await import('../lib/coinGeckoClient.js');
    
    const categoryMap: Record<string, string | undefined> = {
      'top': undefined,
      'defi': 'decentralized-finance-defi',
      'meme': 'meme-token',
      'layer1': 'layer-1',
      'layer2': 'layer-2'
    };
    
    const data = await coinGeckoClient.getMarkets({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 20,
      category: categoryMap[category]
    });
    
    res.json({
      success: true,
      data,
      meta: {
        category,
        count: data.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[Public API] Market overview error:', error.message);
    res.status(500).json({ error: 'Failed to fetch market data', code: 'INTERNAL_ERROR' });
  }
});

app.get('/api/v1/price/:symbol', validateApiKey, requirePermission('market:read'), async (req, res) => {
  try {
    const { symbol } = req.params;
    const { coinGeckoClient } = await import('../lib/coinGeckoClient.js');
    
    const data = await coinGeckoClient.getSimplePrice(symbol.toLowerCase());
    
    if (!data || Object.keys(data).length === 0) {
      return res.status(404).json({ error: 'Symbol not found', code: 'NOT_FOUND' });
    }
    
    res.json({
      success: true,
      data,
      meta: { symbol: symbol.toUpperCase(), timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Public API] Price error:', error.message);
    res.status(500).json({ error: 'Failed to fetch price', code: 'INTERNAL_ERROR' });
  }
});

app.get('/api/v1/signals', validateApiKey, requirePermission('signals:read'), async (req, res) => {
  try {
    const { db } = await import('../db/client.js');
    const { predictionEvents } = await import('../db/schema.js');
    const { desc } = await import('drizzle-orm');
    
    const signals = await db.select()
      .from(predictionEvents)
      .orderBy(desc(predictionEvents.createdAt))
      .limit(20);
    
    res.json({
      success: true,
      data: signals.map(s => ({
        id: s.id,
        ticker: s.ticker,
        signal: s.signal,
        confidence: s.confidence,
        priceAtPrediction: s.priceAtPrediction,
        createdAt: s.createdAt
      })),
      meta: { count: signals.length, timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Public API] Signals error:', error.message);
    res.status(500).json({ error: 'Failed to fetch signals', code: 'INTERNAL_ERROR' });
  }
});

app.get('/api/v1/predictions/:symbol', validateApiKey, requirePermission('predictions:read'), async (req, res) => {
  try {
    const tier = (req as any).apiKey?.tier;
    if (tier === 'free') {
      return res.status(403).json({ 
        error: 'Predictions require Pro or Enterprise tier', 
        code: 'UPGRADE_REQUIRED' 
      });
    }
    
    const { symbol } = req.params;
    const { db } = await import('../db/client.js');
    const { predictionEvents, predictionOutcomes } = await import('../db/schema.js');
    const { eq, desc } = await import('drizzle-orm');
    
    const predictions = await db.select()
      .from(predictionEvents)
      .leftJoin(predictionOutcomes, eq(predictionEvents.id, predictionOutcomes.predictionId))
      .where(eq(predictionEvents.ticker, symbol.toUpperCase()))
      .orderBy(desc(predictionEvents.createdAt))
      .limit(10);
    
    res.json({
      success: true,
      data: predictions,
      meta: { symbol: symbol.toUpperCase(), count: predictions.length, timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Public API] Predictions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch predictions', code: 'INTERNAL_ERROR' });
  }
});

app.get('/api/v1/accuracy', validateApiKey, requirePermission('signals:read'), async (req, res) => {
  try {
    const { db } = await import('../db/client.js');
    const { predictionAccuracyStats } = await import('../db/schema.js');
    
    const stats = await db.select().from(predictionAccuracyStats).limit(50);
    
    res.json({
      success: true,
      data: stats,
      meta: { count: stats.length, timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Public API] Accuracy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch accuracy stats', code: 'INTERNAL_ERROR' });
  }
});

export function startPublicApiServer(port: number = 3002) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🔌 Public API Server running on port ${port}`);
  });
}

// Start server when run directly
startPublicApiServer(3002);

export default app;
