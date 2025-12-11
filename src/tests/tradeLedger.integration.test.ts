import { tradeLedgerService } from '../services/tradeLedgerService';
import { db } from '../db/client';
import { sql } from 'drizzle-orm';

describe('TradeLedger Integration Tests', () => {
  const testUserId = 'test_user_integration';
  const testTradeIds: string[] = [];

  afterAll(async () => {
    for (const tradeId of testTradeIds) {
      await db.execute(sql`DELETE FROM strike_agent_trades WHERE id = ${tradeId}`);
    }
  });

  describe('Post-Restart Adaptive Learning', () => {
    it('should persist predictionId and horizon to database', async () => {
      const tradeId = await tradeLedgerService.recordTrade({
        userId: testUserId,
        chain: 'solana',
        tokenAddress: 'TestToken123',
        tokenSymbol: 'TEST',
        tokenName: 'Test Token',
        tradeType: 'buy',
        source: 'strikeagent_auto',
        entryPrice: 0.001,
        amount: 1000,
        amountUsd: 1.0,
        safetyScore: 85,
        safetyGrade: 'A',
        status: 'executed',
        entryTimestamp: new Date(),
        predictionId: 'pred_test_123',
        horizon: '4h',
      });

      testTradeIds.push(tradeId);

      const result = await db.execute(sql`
        SELECT prediction_id, horizon FROM strike_agent_trades WHERE id = ${tradeId}
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].prediction_id).toBe('pred_test_123');
      expect(result.rows[0].horizon).toBe('4h');
    });

    it('should reload trade from database when not in memory for feedToAdaptiveAI', async () => {
      const tradeId = await tradeLedgerService.recordTrade({
        userId: testUserId,
        chain: 'solana',
        tokenAddress: 'TestToken456',
        tokenSymbol: 'TEST2',
        tokenName: 'Test Token 2',
        tradeType: 'buy',
        source: 'strikeagent_auto',
        entryPrice: 0.002,
        amount: 500,
        amountUsd: 1.0,
        safetyScore: 90,
        safetyGrade: 'A',
        status: 'executed',
        entryTimestamp: new Date(),
        predictionId: 'pred_reload_test',
        horizon: '24h',
      });

      testTradeIds.push(tradeId);

      (tradeLedgerService as any).trades.delete(tradeId);

      await tradeLedgerService.recordTradeOutcome({
        tradeId,
        exitPrice: 0.004,
        exitTimestamp: new Date(),
        profitLoss: 0.002,
        profitLossPercent: 100,
        isWin: true,
        exitReason: 'take_profit',
      });

      const reloadedTrade = (tradeLedgerService as any).trades.get(tradeId);
      expect(reloadedTrade).toBeDefined();
      expect(reloadedTrade.predictionId).toBe('pred_reload_test');
      expect(reloadedTrade.horizon).toBe('24h');
      expect(reloadedTrade.isWin).toBe(true);
    });

    it('should record trades without predictionId but not break learning loop', async () => {
      const tradeId = await tradeLedgerService.recordTrade({
        userId: testUserId,
        chain: 'ethereum',
        tokenAddress: '0xTestToken789',
        tokenSymbol: 'TEST3',
        tokenName: 'Test Token 3',
        tradeType: 'buy',
        source: 'strikeagent_manual',
        entryPrice: 0.003,
        amount: 200,
        amountUsd: 0.6,
        safetyScore: 75,
        safetyGrade: 'B',
        status: 'executed',
        entryTimestamp: new Date(),
      });

      testTradeIds.push(tradeId);

      const result = await db.execute(sql`
        SELECT prediction_id, horizon FROM strike_agent_trades WHERE id = ${tradeId}
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].prediction_id).toBeNull();
      expect(result.rows[0].horizon).toBeNull();
    });
  });

  describe('Trade Recording and Retrieval', () => {
    it('should retrieve user trades from database', async () => {
      const tradeId = await tradeLedgerService.recordTrade({
        userId: testUserId,
        chain: 'base',
        tokenAddress: '0xBaseToken',
        tokenSymbol: 'BASE',
        tokenName: 'Base Token',
        tradeType: 'buy',
        source: 'strikeagent_auto',
        entryPrice: 0.01,
        amount: 100,
        amountUsd: 1.0,
        status: 'executed',
        entryTimestamp: new Date(),
        predictionId: 'pred_user_trades_test',
        horizon: '1h',
      });

      testTradeIds.push(tradeId);

      const trades = await tradeLedgerService.getUserTrades(testUserId, 10);
      expect(trades.length).toBeGreaterThan(0);
      
      const foundTrade = trades.find(t => t.id === tradeId);
      expect(foundTrade).toBeDefined();
      expect(foundTrade?.predictionId).toBe('pred_user_trades_test');
    });
  });
});
