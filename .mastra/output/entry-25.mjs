import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
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
const withdrawTool = createTool({
  id: "withdraw-tool",
  description: "Withdraws SOL from the user's bot wallet to their Phantom wallet address. Specify amount and destination address.",
  inputSchema: z.object({
    amount: z.number().describe("Amount of SOL to withdraw"),
    destinationAddress: z.string().describe("Phantom wallet address to send SOL to")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    signature: z.string(),
    message: z.string(),
    amountWithdrawn: z.number()
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    const logger = mastra?.getLogger();
    try {
      const userId = runtimeContext?.resourceId || context.userId || "default-user";
      logger?.info("\u{1F527} [WithdrawTool] Starting withdrawal", {
        userId,
        amount: context.amount,
        destination: context.destinationAddress
      });
      const WALLET_KEY = `user_wallet_${userId}`;
      const memory = mastra?.memory;
      if (!memory) {
        throw new Error("Memory storage not available");
      }
      const messages = await memory.getMessages({
        resourceId: userId,
        threadId: WALLET_KEY
      });
      if (!messages || messages.length === 0) {
        throw new Error("No wallet found. Create a wallet first with /wallet");
      }
      const lastMessage = messages[messages.length - 1];
      const walletData = JSON.parse(lastMessage.content);
      const decryptedPrivateKey = decryptPrivateKey(walletData.privateKey);
      logger?.info("\u{1F513} [WithdrawTool] Private key decrypted", { userId });
      const privateKeyArray = bs58.decode(decryptedPrivateKey);
      const keypair = Keypair.fromSecretKey(privateKeyArray);
      logger?.info("\u{1F511} [WithdrawTool] Loaded wallet keypair", {
        userId,
        fromAddress: keypair.publicKey.toBase58()
      });
      const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
      let destinationPubKey;
      try {
        destinationPubKey = new PublicKey(context.destinationAddress);
      } catch (e) {
        throw new Error("Invalid destination wallet address");
      }
      const balance = await connection.getBalance(keypair.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      if (balanceSOL < context.amount) {
        throw new Error(`Insufficient balance. You have ${balanceSOL.toFixed(4)} SOL, trying to withdraw ${context.amount} SOL`);
      }
      const amountLamports = Math.floor(context.amount * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: destinationPubKey,
          lamports: amountLamports
        })
      );
      logger?.info("\u{1F4E4} [WithdrawTool] Sending transaction", {
        from: keypair.publicKey.toBase58(),
        to: context.destinationAddress,
        amount: context.amount
      });
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [keypair],
        {
          commitment: "confirmed"
        }
      );
      logger?.info("\u2705 [WithdrawTool] Withdrawal successful", {
        userId,
        signature,
        amount: context.amount
      });
      return {
        success: true,
        signature,
        message: `Successfully withdrew ${context.amount} SOL to ${context.destinationAddress}. Transaction: https://solscan.io/tx/${signature}`,
        amountWithdrawn: context.amount
      };
    } catch (error) {
      logger?.error("\u274C [WithdrawTool] Error withdrawing", { error: error.message });
      return {
        success: false,
        signature: "",
        message: `Withdrawal failed: ${error.message}`,
        amountWithdrawn: 0
      };
    }
  }
});

export { withdrawTool };
