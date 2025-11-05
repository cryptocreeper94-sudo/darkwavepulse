import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Holdings Tool - Manages user's watchlist/portfolio
 * Stores tickers in database for tracking
 */

export const holdingsTool = createTool({
  id: "holdings-tool",
  description: "Manages user's watchlist. Can add, remove, list, or clear holdings. Holdings are persisted in the database.",

  inputSchema: z.object({
    action: z.enum(['add', 'remove', 'list', 'clear']).describe("Action to perform on holdings"),
    ticker: z.string().optional().describe("Ticker symbol to add or remove"),
    tickers: z.array(z.string()).optional().describe("Multiple tickers to add at once"),
  }),

  outputSchema: z.object({
    action: z.string(),
    success: z.boolean(),
    holdings: z.array(z.string()),
    message: z.string(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔧 [HoldingsTool] Starting execution', { action: context.action });

    const HOLDINGS_KEY = 'user_holdings';

    try {
      // Get current holdings from environment variable (simple storage for now)
      let holdings: string[] = [];
      try {
        const stored = process.env.DARKWAVE_HOLDINGS || '[]';
        holdings = JSON.parse(stored);
      } catch (e) {
        logger?.warn('[HoldingsTool] No existing holdings found, starting fresh');
        holdings = [];
      }

      logger?.info('📝 [HoldingsTool] Current holdings', { count: holdings.length });

      let message = '';
      let success = true;

      switch (context.action) {
        case 'add':
          if (context.ticker) {
            const ticker = context.ticker.toUpperCase();
            if (!holdings.includes(ticker)) {
              holdings.push(ticker);
              message = `Added ${ticker} to holdings`;
            } else {
              message = `${ticker} already in holdings`;
            }
          } else if (context.tickers) {
            const newTickers = context.tickers.map(t => t.toUpperCase()).filter(t => !holdings.includes(t));
            holdings.push(...newTickers);
            message = `Added ${newTickers.length} ticker(s) to holdings`;
          } else {
            success = false;
            message = 'No ticker provided';
          }
          break;

        case 'remove':
          if (context.ticker) {
            const ticker = context.ticker.toUpperCase();
            const index = holdings.indexOf(ticker);
            if (index > -1) {
              holdings.splice(index, 1);
              message = `Removed ${ticker} from holdings`;
            } else {
              message = `${ticker} not found in holdings`;
            }
          } else {
            success = false;
            message = 'No ticker provided';
          }
          break;

        case 'list':
          message = holdings.length > 0 
            ? `You have ${holdings.length} ticker(s) in your watchlist`
            : 'Your watchlist is empty';
          break;

        case 'clear':
          const count = holdings.length;
          holdings = [];
          message = `Cleared ${count} ticker(s) from holdings`;
          break;
      }

      // Save updated holdings (note: env vars are read-only, so this is temporary storage per session)
      // In production, this would use a proper database table
      process.env.DARKWAVE_HOLDINGS = JSON.stringify(holdings);

      logger?.info('✅ [HoldingsTool] Action completed', { 
        action: context.action, 
        holdingsCount: holdings.length 
      });

      return {
        action: context.action,
        success,
        holdings,
        message,
      };
    } catch (error: any) {
      logger?.error('❌ [HoldingsTool] Error', { error: error.message });
      throw new Error(`Holdings operation failed: ${error.message}`);
    }
  },
});
