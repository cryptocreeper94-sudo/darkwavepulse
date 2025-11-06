import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Jupiter Limit Order Tool - Places limit orders on Jupiter DEX
 * Supports buy/sell orders with target prices and auto-execution
 */

export const jupiterLimitOrderTool = createTool({
  id: 'jupiter-limit-order',
  description: `Creates limit orders for token trading via Jupiter DEX. 
  Use this when the user wants to:
  - Buy a token when price reaches a specific level
  - Sell a token when price hits a target
  - Set auto-sell targets
  - View or cancel active orders
  
  Example: "Buy BONK at $0.002" or "Sell JUP at $1.50"`,
  inputSchema: z.object({
    action: z.enum(['create', 'list', 'cancel']).describe('Action to perform'),
    userId: z.string().describe('User ID from Telegram'),
    orderType: z.enum(['buy', 'sell']).optional().describe('Order type'),
    ticker: z.string().optional().describe('Token symbol (e.g., BONK, JUP)'),
    contractAddress: z.string().optional().describe('Token contract address (optional, for specific tokens)'),
    targetPrice: z.number().optional().describe('Trigger price for the order'),
    amount: z.number().optional().describe('Amount in SOL (for buy) or tokens (for sell)'),
    orderId: z.string().optional().describe('Order ID to cancel'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    orders: z.array(z.object({
      id: z.string(),
      type: z.string(),
      ticker: z.string(),
      targetPrice: z.number(),
      amount: z.number(),
      status: z.string(),
      createdAt: z.string(),
    })).optional(),
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    const logger = mastra?.getLogger();
    const { action, orderType, ticker, targetPrice, amount, orderId } = context;
    const userId = context.userId || (runtimeContext as any)?.resourceId || 'default-user';
    const ORDERS_KEY = `limit_orders_${userId}`;
    const WALLET_KEY = `user_wallet_${userId}`;
    const SETTINGS_KEY = `user_settings_${userId}`;

    logger?.info('📊 [JupiterLimitOrder] Starting limit order operation', {
      action,
      userId,
      orderType,
      ticker,
    });

    try {
      const memory = mastra?.memory;
      
      // Check if wallet is connected
      let walletAddress: string | null = null;
      try {
        if (memory) {
          const walletMessages = await memory.getMessages({
            resourceId: userId,
            threadId: WALLET_KEY,
          });
          
          if (walletMessages && walletMessages.length > 0) {
            const lastMessage = walletMessages[walletMessages.length - 1];
            if (lastMessage.content) {
              const walletData = JSON.parse(lastMessage.content as string);
              walletAddress = walletData?.address;
            }
          }
        }
      } catch (e) {
        logger?.warn('[JupiterLimitOrder] No wallet found');
      }

      if (!walletAddress) {
        return {
          success: false,
          message: '⚠️ No wallet connected. Use /connect to link your Phantom wallet first.',
        };
      }

      // Get current orders from memory
      let orders: any[] = [];
      try {
        if (memory) {
          const messages = await memory.getMessages({
            resourceId: userId,
            threadId: ORDERS_KEY,
          });
          
          if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.content) {
              orders = JSON.parse(lastMessage.content as string);
            }
          }
        }
      } catch (e) {
        logger?.warn('[JupiterLimitOrder] No existing orders found');
        orders = [];
      }

      if (action === 'list') {
        logger?.info('📋 [JupiterLimitOrder] Listing orders', { count: orders.length });

        if (orders.length === 0) {
          return {
            success: true,
            message: '📋 No active limit orders.\n\nUse commands like "buy BONK at 0.002" to create orders.',
            orders: [],
          };
        }

        let message = `📋 Active Limit Orders (${orders.length}):\n\n`;
        orders.forEach((order, idx) => {
          const typeEmoji = order.type === 'buy' ? '🟢' : '🔴';
          message += `${idx + 1}. ${typeEmoji} ${order.type.toUpperCase()} ${order.ticker}\n`;
          message += `   Target: $${order.targetPrice}\n`;
          message += `   Amount: ${order.amount} ${order.type === 'buy' ? 'SOL' : order.ticker}\n`;
          message += `   Status: ${order.status}\n`;
          message += `   Created: ${new Date(order.createdAt).toLocaleString()}\n\n`;
        });

        return {
          success: true,
          message,
          orders,
        };
      }

      if (action === 'cancel') {
        if (!orderId && orders.length > 0) {
          return {
            success: false,
            message: 'Please specify which order to cancel (by number or ID)',
          };
        }

        // Find order by ID or index
        let orderIndex = -1;
        if (orderId) {
          orderIndex = orders.findIndex(o => o.id === orderId || o.id === `order_${orderId}`);
          if (orderIndex === -1 && !isNaN(parseInt(orderId))) {
            orderIndex = parseInt(orderId) - 1; // Allow numeric index (1-based)
          }
        }

        if (orderIndex === -1 || orderIndex >= orders.length) {
          return {
            success: false,
            message: 'Order not found',
          };
        }

        const cancelledOrder = orders.splice(orderIndex, 1)[0];

        // Save updated orders
        if (memory) {
          await memory.saveMessages({
            messages: [{
              role: 'assistant',
              content: JSON.stringify(orders),
            }],
            resourceId: userId,
            threadId: ORDERS_KEY,
          });
        }

        logger?.info('✅ [JupiterLimitOrder] Order cancelled', { orderId: cancelledOrder.id });

        return {
          success: true,
          message: `✅ Cancelled ${cancelledOrder.type.toUpperCase()} order for ${cancelledOrder.ticker} at $${cancelledOrder.targetPrice}`,
          orders,
        };
      }

      if (action === 'create') {
        if (!orderType || !ticker || !targetPrice || !amount) {
          return {
            success: false,
            message: 'Missing required fields: orderType, ticker, targetPrice, amount',
          };
        }

        // Get user settings to check auto-execute preference
        let autoExecute = false;
        try {
          if (memory) {
            const settingsMessages = await memory.getMessages({
              resourceId: userId,
              threadId: SETTINGS_KEY,
            });
            
            if (settingsMessages && settingsMessages.length > 0) {
              const lastMessage = settingsMessages[settingsMessages.length - 1];
              if (lastMessage.content) {
                const settings = JSON.parse(lastMessage.content as string);
                autoExecute = settings?.autoExecuteLimitOrders || false;
              }
            }
          }
        } catch (e) {
          logger?.warn('[JupiterLimitOrder] Could not load settings');
        }

        // Create new order
        const newOrder = {
          id: `order_${Date.now()}`,
          type: orderType,
          ticker: ticker.toUpperCase(),
          targetPrice,
          amount,
          status: autoExecute ? 'active (auto-execute ON)' : 'active (manual approval required)',
          createdAt: new Date().toISOString(),
          walletAddress,
          autoExecute,
        };

        orders.push(newOrder);

        // Save orders
        if (memory) {
          await memory.saveMessages({
            messages: [{
              role: 'assistant',
              content: JSON.stringify(orders),
            }],
            resourceId: userId,
            threadId: ORDERS_KEY,
          });
        }

        logger?.info('✅ [JupiterLimitOrder] Order created', {
          orderId: newOrder.id,
          type: orderType,
          ticker,
        });

        let message = `✅ Limit Order Created\n\n`;
        message += `${orderType === 'buy' ? '🟢' : '🔴'} ${orderType.toUpperCase()} ${ticker.toUpperCase()}\n`;
        message += `💰 Amount: ${amount} ${orderType === 'buy' ? 'SOL' : ticker.toUpperCase()}\n`;
        message += `🎯 Target Price: $${targetPrice}\n`;
        message += `📍 Wallet: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}\n\n`;

        if (autoExecute) {
          message += `⚡ AUTO-EXECUTE ENABLED - Order will execute automatically when price hits target\n\n`;
          message += `⚠️ NOTE: Actual execution requires Jupiter integration (currently in test mode)`;
        } else {
          message += `⚠️ AUTO-EXECUTE DISABLED - You'll receive a notification when price hits target, but must approve manually\n\n`;
          message += `Enable auto-execute with "enable auto trading"`;
        }

        return {
          success: true,
          message,
          orders: [newOrder],
        };
      }

      return {
        success: false,
        message: 'Unknown action',
      };
    } catch (error) {
      logger?.error('❌ [JupiterLimitOrder] Error:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
