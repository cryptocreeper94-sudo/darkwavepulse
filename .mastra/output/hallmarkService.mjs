import { randomBytes, createHash } from 'crypto';
import { d as db, h as hallmarkProfiles, b as auditEvents, c as hallmarkMints } from './client.mjs';
import { eq, desc, and, sql } from 'drizzle-orm';
import { a as auditTrailService, E as EVENT_CATEGORIES, A as AUDIT_EVENT_TYPES, d as darkwaveChainClient } from './index.mjs';
import 'drizzle-orm/node-postgres';
import 'pg';
import 'drizzle-orm/pg-core';
import '@mastra/core/eval';
import '@mastra/core/hooks';
import '@mastra/core/storage';
import '@mastra/core/scores/scoreTraces';
import '@mastra/core/utils';
import '@mastra/core';
import '@mastra/core/error';
import '@mastra/loggers';
import '@mastra/mcp';
import 'inngest';
import 'zod';
import 'axios';
import '@mastra/pg';
import '@inngest/realtime';
import '@mastra/inngest';
import '@solana/web3.js';
import 'bs58';
import './technicalAnalysisTool.mjs';
import '@mastra/core/tools';
import 'technicalindicators';
import './subscriptionCheck.mjs';
import 'uuid';
import 'pino';
import 'ethers';
import './tools/73773572-120f-4e57-b602-05418ec056ec.mjs';
import './tools/c353523b-5a88-4609-8252-05f87fc942cd.mjs';
import './tools/8ae78feb-6375-4ada-bee1-ed5ef3af9617.mjs';
import './tools/667e65e2-e9a9-4df3-8944-c901bd36670d.mjs';
import './tools/654f464a-ea5d-4fc5-81c0-0d7e39da6e39.mjs';
import './tools/3dd6c6fe-0afb-4d4d-8525-4697cfcbbbda.mjs';
import '@ai-sdk/openai';
import '@mastra/core/agent';
import '@mastra/memory';
import './tools/47c65d08-415b-4fda-9553-7c3b929395e1.mjs';
import './tools/5e248367-9c3a-4d0d-825e-4076829be4b2.mjs';
import './tools/183ca9ca-5c85-4a5d-baed-09e8b4afd64a.mjs';
import './tools/10bea300-046b-4ebc-8e95-4aa1270167ad.mjs';
import './tools/fab1e5fb-d5b1-4c75-b8d3-c211b251e9b6.mjs';
import './tools/e14aa057-d543-4e74-ba82-f09be4f5f5b0.mjs';
import './tools/a9c72d7c-c7af-415f-9ba5-6185ecabea85.mjs';
import './tools/9e96244a-f3e9-415b-bd6f-ea4dc07858d6.mjs';
import './tools/afe4514f-d97a-4a8c-94c8-b8807e74d406.mjs';
import './tools/da1a5a4d-6fe3-4eb0-93a7-309286bb45ce.mjs';
import './tools/91cc5732-654a-481a-834f-d6d5499c7aa3.mjs';
import './tools/14e8d541-b915-4a94-8665-c032aa3c0936.mjs';
import './tools/15fcef4b-d691-4e5d-88d1-c02c175cfb91.mjs';
import './tools/f21a06c5-673f-4fb7-a562-611062676608.mjs';
import 'stripe';
import 'bip39';
import 'ed25519-hd-key';
import '@trustwallet/wallet-core';
import '@solana/spl-token';
import '@sqds/multisig';
import '@safe-global/protocol-kit';
import 'bcrypt';
import '@simplewebauthn/server';
import 'fs/promises';
import 'https';
import 'path/posix';
import 'http';
import 'http2';
import 'stream';
import 'fs';
import 'path';
import '@mastra/core/runtime-context';
import '@mastra/core/telemetry';
import '@mastra/core/llm';
import '@mastra/core/stream';
import 'util';
import 'buffer';
import '@mastra/core/ai-tracing';
import '@mastra/core/utils/zod-to-json';
import '@mastra/core/a2a';
import 'stream/web';
import '@mastra/core/memory';
import 'zod/v4';
import 'zod/v3';
import 'child_process';
import 'module';
import 'os';
import '@mastra/core/workflows';
import './tools.mjs';

class HallmarkService {
  HALLMARK_PRICE_USD = "1.99";
  /**
   * Generate a unique Hallmark ID
   */
  generateHallmarkId() {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString("hex");
    return `hm_${timestamp}_${random}`;
  }
  /**
   * Generate a unique serial number for a user
   * Format: HW-{USERID}-{0001} where USERID is the sanitized user ID
   */
  generateSerialNumber(userId, serial) {
    const cleanUserId = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 12);
    return `HW-${cleanUserId}-${serial.toString().padStart(4, "0")}`;
  }
  /**
   * Get or create a user's Hallmark profile
   */
  async getOrCreateProfile(userId, displayName) {
    const [existing] = await db.select().from(hallmarkProfiles).where(eq(hallmarkProfiles.userId, userId)).limit(1);
    if (existing) {
      return existing;
    }
    const [profile] = await db.insert(hallmarkProfiles).values({
      userId,
      avatarType: "agent",
      currentSerial: 0,
      preferredTemplate: "classic",
      displayName: displayName || null
    }).returning();
    return profile;
  }
  /**
   * Update a user's Hallmark profile
   */
  async updateProfile(userId, updates) {
    const [profile] = await db.update(hallmarkProfiles).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(hallmarkProfiles.userId, userId)).returning();
    return profile;
  }
  /**
   * Create a draft Hallmark (before payment)
   */
  async createDraftHallmark(userId, options) {
    const profile = await this.getOrCreateProfile(userId);
    const recentEvents = await db.select().from(auditEvents).where(eq(auditEvents.userId, userId)).orderBy(desc(auditEvents.createdAt)).limit(10);
    const newSerial = profile.currentSerial + 1;
    const serialNumber = this.generateSerialNumber(userId, newSerial);
    const payload = {
      userId,
      serialNumber,
      avatarType: options?.avatarType || profile.avatarType,
      avatarId: options?.avatarId || profile.avatarId,
      template: options?.template || profile.preferredTemplate || "classic",
      recentEventHashes: recentEvents.map((e) => e.payloadHash),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const payloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    const hallmarkId = this.generateHallmarkId();
    const [mint] = await db.insert(hallmarkMints).values({
      id: hallmarkId,
      userId,
      serialNumber,
      avatarSnapshot: JSON.stringify({
        type: options?.avatarType || profile.avatarType,
        id: options?.avatarId || profile.avatarId
      }),
      templateUsed: options?.template || profile.preferredTemplate || "classic",
      payloadHash,
      auditEventIds: JSON.stringify(recentEvents.map((e) => e.id)),
      priceUsd: this.HALLMARK_PRICE_USD,
      status: "draft"
    }).returning();
    console.log(`\u{1F4CB} [Hallmark] Draft created: ${serialNumber}`, { hallmarkId, payloadHash: payloadHash.substring(0, 16) + "..." });
    return mint;
  }
  /**
   * Process payment for a Hallmark
   */
  async processPayment(hallmarkId, paymentInfo) {
    const [hallmark] = await db.select().from(hallmarkMints).where(eq(hallmarkMints.id, hallmarkId)).limit(1);
    if (!hallmark) {
      throw new Error("Hallmark not found");
    }
    if (hallmark.status !== "draft") {
      throw new Error("Hallmark is not in draft status");
    }
    const [updated] = await db.update(hallmarkMints).set({
      paymentProvider: paymentInfo.provider,
      paymentId: paymentInfo.paymentId,
      status: "paid",
      paidAt: /* @__PURE__ */ new Date()
    }).where(eq(hallmarkMints.id, hallmarkId)).returning();
    const [profile] = await db.select().from(hallmarkProfiles).where(eq(hallmarkProfiles.userId, hallmark.userId)).limit(1);
    if (profile) {
      await db.update(hallmarkProfiles).set({
        currentSerial: profile.currentSerial + 1,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(hallmarkProfiles.userId, hallmark.userId));
    }
    await auditTrailService.logEvent({
      userId: hallmark.userId,
      eventType: AUDIT_EVENT_TYPES.HALLMARK_PURCHASED,
      category: EVENT_CATEGORIES.HALLMARK,
      data: {
        hallmarkId,
        serialNumber: hallmark.serialNumber,
        amount: this.HALLMARK_PRICE_USD,
        provider: paymentInfo.provider
      }
    });
    console.log(`\u{1F4B0} [Hallmark] Payment processed: ${hallmark.serialNumber}`);
    this.queueForMinting(hallmarkId);
    return updated;
  }
  /**
   * Queue a hallmark for on-chain minting
   */
  async queueForMinting(hallmarkId) {
    const walletConfigured = await auditTrailService.isWalletConfigured();
    if (!walletConfigured) {
      console.log(`\u23F3 [Hallmark] ${hallmarkId} queued for minting - waiting for wallet`);
      return;
    }
    this.processHallmarkMint(hallmarkId);
  }
  /**
   * Process the actual NFT minting via DarkWave Chain
   */
  async processHallmarkMint(hallmarkId) {
    try {
      const hallmark = await this.getHallmark(hallmarkId);
      if (!hallmark) {
        console.error(`\u274C [Hallmark] Hallmark not found: ${hallmarkId}`);
        return;
      }
      const result = await darkwaveChainClient.generateHallmark({
        productType: "pulse_hallmark",
        productId: hallmarkId,
        metadata: {
          serialNumber: hallmark.serialNumber,
          template: hallmark.templateUsed,
          payloadHash: hallmark.payloadHash,
          userId: hallmark.userId
        }
      });
      if (result.id) {
        await db.update(hallmarkMints).set({
          memoSignature: result.txHash || result.id,
          metadataUri: result.verificationUrl,
          status: "minted",
          mintedAt: /* @__PURE__ */ new Date()
        }).where(eq(hallmarkMints.id, hallmarkId));
        console.log(`\u{1F3A8} [Hallmark] ${hallmarkId} minted on DarkWave Chain: ${result.id}`);
      }
    } catch (error) {
      console.warn(`\u26A0\uFE0F [Hallmark] DarkWave Chain minting unavailable: ${error.message}`);
    }
  }
  /**
   * Verify a hallmark on DarkWave Chain
   */
  async verifyOnChain(hallmarkId) {
    try {
      const result = await darkwaveChainClient.verifyHallmark(hallmarkId);
      return {
        valid: result.valid,
        onChain: result.onChain,
        blockNumber: result.blockNumber,
        verificationUrl: result.hallmark?.verificationUrl
      };
    } catch (error) {
      return { valid: false, onChain: false };
    }
  }
  /**
   * Get a user's Hallmark collection
   */
  async getUserHallmarks(userId) {
    const hallmarks = await db.select().from(hallmarkMints).where(and(
      eq(hallmarkMints.userId, userId),
      sql`${hallmarkMints.status} != 'draft'`
    )).orderBy(desc(hallmarkMints.createdAt));
    return hallmarks;
  }
  /**
   * Get a specific Hallmark by ID
   */
  async getHallmark(hallmarkId) {
    const [hallmark] = await db.select().from(hallmarkMints).where(eq(hallmarkMints.id, hallmarkId)).limit(1);
    return hallmark;
  }
  /**
   * Get Hallmark by serial number
   */
  async getHallmarkBySerial(serialNumber) {
    const [hallmark] = await db.select().from(hallmarkMints).where(eq(hallmarkMints.serialNumber, serialNumber)).limit(1);
    return hallmark;
  }
  /**
   * Verify a Hallmark's authenticity
   */
  async verifyHallmark(serialNumber) {
    const hallmark = await this.getHallmarkBySerial(serialNumber);
    if (!hallmark) {
      return { valid: false };
    }
    return {
      valid: true,
      hallmark,
      onChain: !!hallmark.memoSignature
    };
  }
  /**
   * Get statistics for admin dashboard
   */
  async getStats() {
    const allHallmarks = await db.select().from(hallmarkMints).where(sql`${hallmarkMints.status} != 'draft'`);
    const stats = {
      totalHallmarks: allHallmarks.length,
      pendingMints: allHallmarks.filter((h) => h.status === "paid").length,
      mintedHallmarks: allHallmarks.filter((h) => h.status === "minted").length,
      totalRevenue: allHallmarks.filter((h) => h.paidAt).length * parseFloat(this.HALLMARK_PRICE_USD),
      hallmarksByTemplate: {}
    };
    allHallmarks.forEach((h) => {
      const template = h.templateUsed;
      stats.hallmarksByTemplate[template] = (stats.hallmarksByTemplate[template] || 0) + 1;
    });
    return stats;
  }
}
const hallmarkService = new HallmarkService();

export { hallmarkService };
//# sourceMappingURL=hallmarkService.mjs.map
