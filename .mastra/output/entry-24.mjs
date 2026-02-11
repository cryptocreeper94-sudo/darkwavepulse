import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import crypto from 'crypto';

"use strict";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
function deriveKey(masterSecret, salt) {
  return crypto.pbkdf2Sync(masterSecret, salt, 1e5, 32, "sha256");
}
function encryptPrivateKey(privateKey) {
  const masterSecret = process.env.WALLET_ENCRYPTION_KEY;
  if (!masterSecret) {
    throw new Error("WALLET_ENCRYPTION_KEY environment variable not set");
  }
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(masterSecret, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return [
    encrypted.toString("base64"),
    iv.toString("base64"),
    authTag.toString("base64"),
    salt.toString("base64")
  ].join(":");
}
function decryptPrivateKey(encryptedData) {
  const masterSecret = process.env.WALLET_ENCRYPTION_KEY;
  if (!masterSecret) {
    throw new Error("WALLET_ENCRYPTION_KEY environment variable not set");
  }
  const [ciphertextB64, ivB64, authTagB64, saltB64] = encryptedData.split(":");
  if (!ciphertextB64 || !ivB64 || !authTagB64 || !saltB64) {
    throw new Error("Invalid encrypted data format");
  }
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const salt = Buffer.from(saltB64, "base64");
  const key = deriveKey(masterSecret, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

"use strict";
const walletGeneratorTool = createTool({
  id: "wallet-generator-tool",
  description: "Generates a new Solana wallet for the user. Returns the wallet address (public key) that users can send SOL to from their Phantom wallet. The bot manages this wallet for trading.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    walletAddress: z.string(),
    success: z.boolean(),
    message: z.string(),
    isNewWallet: z.boolean()
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    try {
      const userId = context.userId || "default-user";
      logger?.info("\u{1F527} [WalletGeneratorTool] Starting wallet retrieval/generation", { userId });
      const WALLET_KEY = `user_wallet_${userId}`;
      let existingWallet = null;
      try {
        const memory2 = mastra?.memory;
        if (memory2) {
          const messages = await memory2.getMessages({
            resourceId: userId,
            threadId: WALLET_KEY
          });
          if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.content) {
              existingWallet = JSON.parse(lastMessage.content);
              logger?.info("\u2705 [WalletGeneratorTool] Found existing wallet", {
                userId,
                walletAddress: existingWallet.publicKey
              });
              return {
                walletAddress: existingWallet.publicKey,
                success: true,
                message: `Your existing wallet address: ${existingWallet.publicKey}`,
                isNewWallet: false
              };
            }
          }
        }
      } catch (e) {
        logger?.info("[WalletGeneratorTool] No existing wallet found, creating new one");
      }
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toBase58();
      const privateKey = bs58.encode(keypair.secretKey);
      logger?.info("\u{1F511} [WalletGeneratorTool] Generated new wallet", {
        userId,
        walletAddress: publicKey
      });
      const encryptedPrivateKey = encryptPrivateKey(privateKey);
      logger?.info("\u{1F512} [WalletGeneratorTool] Private key encrypted", { userId });
      const memory = mastra?.memory;
      if (memory) {
        await memory.saveMessages({
          messages: [{
            role: "system",
            content: JSON.stringify({
              publicKey,
              privateKey: encryptedPrivateKey,
              // Encrypted using AES-256-GCM
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            })
          }],
          resourceId: userId,
          threadId: WALLET_KEY
        });
        logger?.info("\u{1F4BE} [WalletGeneratorTool] Saved encrypted wallet to database", { userId });
      }
      logger?.info("\u2705 [WalletGeneratorTool] Wallet generation complete", {
        userId,
        walletAddress: publicKey
      });
      return {
        walletAddress: publicKey,
        success: true,
        message: `New wallet created! Send SOL from your Phantom wallet to: ${publicKey}`,
        isNewWallet: true
      };
    } catch (error) {
      logger?.error("\u274C [WalletGeneratorTool] Error generating wallet", { error: error.message });
      return {
        walletAddress: "",
        success: false,
        message: `Failed to generate wallet: ${error.message}`,
        isNewWallet: false
      };
    }
  }
});

export { walletGeneratorTool };
