import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { darkwaveAgent } from "../agents/darkwaveAgent";

/**
 * DarkWave-V2 Workflow - Processes Telegram messages and returns technical analysis
 */

const processMessage = createStep({
  id: "process-telegram-message",
  description: "Processes incoming Telegram message and generates technical analysis response",

  inputSchema: z.object({
    message: z.string(),
    userId: z.string().optional(),
  }),

  outputSchema: z.object({
    response: z.string(),
    success: z.boolean(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🚀 [DarkWaveWorkflow] Processing message', { 
      message: inputData.message.substring(0, 50),
      userId: inputData.userId 
    });

    try {
      const userId = inputData.userId || "default-user";
      
      // Use the agent with memory context (using generateLegacy for AI SDK v4 compatibility)
      const response = await darkwaveAgent.generateLegacy([
        { 
          role: "user", 
          content: inputData.message 
        }
      ], {
        resourceId: userId,
        threadId: userId, // Use userId as threadId for conversation context
      });

      logger?.info('✅ [DarkWaveWorkflow] Analysis complete', { 
        responseLength: response.text.length 
      });

      return {
        response: response.text,
        success: true,
      };
    } catch (error: any) {
      logger?.error('❌ [DarkWaveWorkflow] Error processing message', { 
        error: error.message 
      });

      return {
        response: `⚠️ Error processing request: ${error.message}\n\nPlease try again or use a different ticker.`,
        success: false,
      };
    }
  },
});

export const darkwaveWorkflow = createWorkflow({
  id: "darkwave-workflow",
  
  inputSchema: z.object({
    message: z.string(),
    userId: z.string().optional(),
  }),

  outputSchema: z.object({
    response: z.string(),
    success: z.boolean(),
  }),
})
  .then(processMessage)
  .commit();
