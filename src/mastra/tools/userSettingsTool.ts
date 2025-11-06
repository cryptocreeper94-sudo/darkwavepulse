import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * User Settings Tool - Manages bot preferences and toggles
 * Stores user preferences like auto-execute, exchange links, safety limits
 */

export const userSettingsTool = createTool({
  id: 'user-settings',
  description: `Manages user bot settings and toggles. 
  Use this when the user wants to:
  - Turn auto-trading on/off
  - Change exchange link preferences (kraken/dexscreener)
  - Set spending limits for auto-execution
  - View current settings`,
  inputSchema: z.object({
    action: z.enum(['view', 'update']).describe('View or update settings'),
    userId: z.string().describe('User ID from Telegram'),
    settings: z.object({
      autoExecuteLimitOrders: z.boolean().optional().describe('Auto-execute limit orders when triggered'),
      autoExecuteSniping: z.boolean().optional().describe('Auto-execute token sniping when criteria met'),
      defaultExchangeLink: z.enum(['kraken', 'dexscreener']).optional().describe('Default exchange for hyperlinks'),
      maxAutoSpendPerTrade: z.number().optional().describe('Max SOL to spend per auto-executed trade'),
      snipingEnabled: z.boolean().optional().describe('Enable/disable sniping features'),
    }).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    settings: z.object({
      autoExecuteLimitOrders: z.boolean(),
      autoExecuteSniping: z.boolean(),
      defaultExchangeLink: z.string(),
      maxAutoSpendPerTrade: z.number(),
      snipingEnabled: z.boolean(),
    }).optional(),
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    const logger = mastra?.getLogger();
    const { action, settings } = context;
    const userId = context.userId || (runtimeContext as any)?.resourceId || 'default-user';
    const SETTINGS_KEY = `user_settings_${userId}`;

    logger?.info('⚙️ [UserSettings] Starting settings operation', {
      action,
      userId,
    });

    try {
      const memory = mastra?.memory;
      
      // Get current settings from memory
      let currentSettings = {
        autoExecuteLimitOrders: false,
        autoExecuteSniping: false,
        defaultExchangeLink: 'dexscreener',
        maxAutoSpendPerTrade: 0.1, // 0.1 SOL default (~$15-20)
        snipingEnabled: false,
      };
      
      try {
        if (memory) {
          const messages = await memory.getMessages({
            resourceId: userId,
            threadId: SETTINGS_KEY,
          });
          
          if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.content) {
              currentSettings = { ...currentSettings, ...JSON.parse(lastMessage.content as string) };
            }
          }
        }
      } catch (e) {
        logger?.warn('[UserSettings] No existing settings found, using defaults');
      }

      if (action === 'view') {
        logger?.info('👁️ [UserSettings] Viewing settings', { userId });

        const statusEmoji = (enabled: boolean) => enabled ? '✅' : '❌';
        
        return {
          success: true,
          message: `⚙️ Bot Settings:\n\n` +
            `${statusEmoji(currentSettings.autoExecuteLimitOrders)} Auto-Execute Limit Orders\n` +
            `${statusEmoji(currentSettings.autoExecuteSniping)} Auto-Execute Sniping\n` +
            `${statusEmoji(currentSettings.snipingEnabled)} Sniping Features\n` +
            `🔗 Exchange Links: ${currentSettings.defaultExchangeLink}\n` +
            `💰 Max Auto-Spend: ${currentSettings.maxAutoSpendPerTrade} SOL/trade\n\n` +
            `Use commands like "enable auto trading" or "set max spend to 0.5 SOL" to change settings.`,
          settings: currentSettings,
        };
      }

      if (action === 'update') {
        if (!settings) {
          return {
            success: false,
            message: 'No settings provided to update',
          };
        }

        // Merge new settings
        const updatedSettings = { ...currentSettings, ...settings };

        // Validation
        if (updatedSettings.maxAutoSpendPerTrade < 0 || updatedSettings.maxAutoSpendPerTrade > 10) {
          return {
            success: false,
            message: 'Max auto-spend must be between 0 and 10 SOL for safety',
          };
        }

        // Save to memory
        if (memory) {
          await memory.saveMessages({
            messages: [{
              role: 'assistant',
              content: JSON.stringify(updatedSettings),
            }],
            resourceId: userId,
            threadId: SETTINGS_KEY,
          });
        }

        logger?.info('✅ [UserSettings] Settings updated', {
          userId,
          changes: settings,
        });

        // Build update message
        let updateMsg = '✅ Settings updated:\n\n';
        if (settings.autoExecuteLimitOrders !== undefined) {
          updateMsg += `${settings.autoExecuteLimitOrders ? '✅' : '❌'} Auto-execute limit orders: ${settings.autoExecuteLimitOrders ? 'ENABLED' : 'DISABLED'}\n`;
        }
        if (settings.autoExecuteSniping !== undefined) {
          updateMsg += `${settings.autoExecuteSniping ? '✅' : '❌'} Auto-execute sniping: ${settings.autoExecuteSniping ? 'ENABLED' : 'DISABLED'}\n`;
        }
        if (settings.snipingEnabled !== undefined) {
          updateMsg += `${settings.snipingEnabled ? '✅' : '❌'} Sniping features: ${settings.snipingEnabled ? 'ENABLED' : 'DISABLED'}\n`;
        }
        if (settings.defaultExchangeLink) {
          updateMsg += `🔗 Exchange links: ${settings.defaultExchangeLink}\n`;
        }
        if (settings.maxAutoSpendPerTrade !== undefined) {
          updateMsg += `💰 Max auto-spend: ${settings.maxAutoSpendPerTrade} SOL/trade\n`;
        }

        if (updatedSettings.autoExecuteLimitOrders || updatedSettings.autoExecuteSniping) {
          updateMsg += `\n⚠️ AUTO-TRADING ENABLED - The bot will execute trades automatically using your connected wallet.`;
        }

        return {
          success: true,
          message: updateMsg,
          settings: updatedSettings,
        };
      }

      return {
        success: false,
        message: 'Unknown action',
      };
    } catch (error) {
      logger?.error('❌ [UserSettings] Error:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
