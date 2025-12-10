import axios from 'axios';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const DEFAULT_HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';

export interface RPCConfig {
  endpoint: string;
  type: 'helius' | 'custom' | 'public';
  name: string;
  isDefault: boolean;
}

export interface PriorityFeeEstimate {
  priorityFeeLevels: {
    min: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
    unsafeMax: number;
  };
  recommendedFee: number;
  baseFee: number;
}

export interface TransactionOptions {
  priorityLevel: 'min' | 'low' | 'medium' | 'high' | 'veryHigh' | 'auto';
  maxRetries: number;
  skipPreflight: boolean;
  commitment: 'processed' | 'confirmed' | 'finalized';
}

const DEFAULT_TX_OPTIONS: TransactionOptions = {
  priorityLevel: 'auto',
  maxRetries: 3,
  skipPreflight: false,
  commitment: 'confirmed',
};

class RPCService {
  private primaryConnection: Connection;
  private fallbackConnection: Connection;
  private heliusEndpoint: string;
  private customEndpoint: string | null = null;
  private useCustomRPC: boolean = false;

  constructor() {
    this.heliusEndpoint = DEFAULT_HELIUS_RPC;
    this.primaryConnection = new Connection(
      HELIUS_API_KEY ? DEFAULT_HELIUS_RPC : PUBLIC_RPC,
      { commitment: 'confirmed' }
    );
    this.fallbackConnection = new Connection(PUBLIC_RPC, { commitment: 'confirmed' });
    
    console.log(`[RPC] Initialized with ${HELIUS_API_KEY ? 'Helius' : 'Public'} RPC`);
  }

  getActiveEndpoint(): string {
    if (this.useCustomRPC && this.customEndpoint) {
      return this.customEndpoint;
    }
    return this.heliusEndpoint;
  }

  getActiveConnection(): Connection {
    if (this.useCustomRPC && this.customEndpoint) {
      return new Connection(this.customEndpoint, { commitment: 'confirmed' });
    }
    return this.primaryConnection;
  }

  setCustomRPC(endpoint: string | null): void {
    if (endpoint) {
      this.customEndpoint = endpoint;
      this.useCustomRPC = true;
      console.log(`[RPC] Switched to custom RPC: ${endpoint.substring(0, 50)}...`);
    } else {
      this.customEndpoint = null;
      this.useCustomRPC = false;
      console.log(`[RPC] Switched back to Helius RPC`);
    }
  }

  async getPriorityFeeEstimate(
    accountKeys?: string[],
    transaction?: string
  ): Promise<PriorityFeeEstimate> {
    if (!HELIUS_API_KEY) {
      return this.getDefaultPriorityFees();
    }

    try {
      const payload: any = {
        jsonrpc: '2.0',
        id: 'priority-fee-estimate',
        method: 'getPriorityFeeEstimate',
        params: [
          {
            options: {
              includeAllPriorityFeeLevels: true,
              recommended: true,
            },
          },
        ],
      };

      if (accountKeys && accountKeys.length > 0) {
        payload.params[0].accountKeys = accountKeys;
      } else if (transaction) {
        payload.params[0].transaction = transaction;
      }

      const response = await axios.post(this.heliusEndpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      const result = response.data?.result;
      
      if (result?.priorityFeeLevels) {
        const recommended = result.priorityFeeEstimate || result.priorityFeeLevels.medium;
        
        console.log(`[RPC] Priority fees - Min: ${result.priorityFeeLevels.min}, Med: ${result.priorityFeeLevels.medium}, High: ${result.priorityFeeLevels.high}`);
        
        return {
          priorityFeeLevels: result.priorityFeeLevels,
          recommendedFee: recommended,
          baseFee: result.priorityFeeLevels.min,
        };
      }

      return this.getDefaultPriorityFees();
    } catch (error: any) {
      console.error('[RPC] Priority fee estimation failed:', error.message);
      return this.getDefaultPriorityFees();
    }
  }

  private getDefaultPriorityFees(): PriorityFeeEstimate {
    return {
      priorityFeeLevels: {
        min: 1000,
        low: 5000,
        medium: 10000,
        high: 50000,
        veryHigh: 100000,
        unsafeMax: 500000,
      },
      recommendedFee: 10000,
      baseFee: 1000,
    };
  }

  async getOptimalPriorityFee(
    level: 'min' | 'low' | 'medium' | 'high' | 'veryHigh' | 'auto',
    accountKeys?: string[]
  ): Promise<number> {
    const estimate = await this.getPriorityFeeEstimate(accountKeys);
    
    if (level === 'auto') {
      return estimate.recommendedFee;
    }
    
    return estimate.priorityFeeLevels[level] || estimate.recommendedFee;
  }

  async sendTransaction(
    signedTransaction: string,
    options: Partial<TransactionOptions> = {}
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    const opts = { ...DEFAULT_TX_OPTIONS, ...options };
    const connection = this.getActiveConnection();
    
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        const txBuffer = Buffer.from(signedTransaction, 'base64');
        
        const signature = await connection.sendRawTransaction(txBuffer, {
          skipPreflight: opts.skipPreflight,
          preflightCommitment: opts.commitment,
          maxRetries: 0,
        });

        console.log(`[RPC] Transaction sent (attempt ${attempt}): ${signature}`);

        const confirmation = await connection.confirmTransaction(
          signature,
          opts.commitment
        );

        if (confirmation.value.err) {
          lastError = `Transaction failed: ${JSON.stringify(confirmation.value.err)}`;
          console.error(`[RPC] Confirmation error:`, lastError);
          continue;
        }

        console.log(`[RPC] Transaction confirmed: ${signature}`);
        return { success: true, signature };
        
      } catch (error: any) {
        lastError = error.message;
        console.error(`[RPC] Attempt ${attempt} failed:`, error.message);
        
        if (attempt < opts.maxRetries) {
          const delayMs = Math.min(1000 * attempt, 3000);
          await this.sleep(delayMs);
        }
      }
    }

    if (this.useCustomRPC) {
      console.log('[RPC] Custom RPC failed, falling back to Helius...');
      return this.sendTransactionWithFallback(signedTransaction, opts);
    }

    return { success: false, error: lastError };
  }

  private async sendTransactionWithFallback(
    signedTransaction: string,
    options: TransactionOptions
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      const txBuffer = Buffer.from(signedTransaction, 'base64');
      
      const signature = await this.primaryConnection.sendRawTransaction(txBuffer, {
        skipPreflight: options.skipPreflight,
        preflightCommitment: options.commitment,
        maxRetries: 2,
      });

      const confirmation = await this.primaryConnection.confirmTransaction(
        signature,
        options.commitment
      );

      if (confirmation.value.err) {
        return {
          success: false,
          error: `Fallback failed: ${JSON.stringify(confirmation.value.err)}`,
        };
      }

      return { success: true, signature };
    } catch (error: any) {
      return { success: false, error: `Fallback failed: ${error.message}` };
    }
  }

  async getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    const connection = this.getActiveConnection();
    const result = await connection.getLatestBlockhash('confirmed');
    return {
      blockhash: result.blockhash,
      lastValidBlockHeight: result.lastValidBlockHeight,
    };
  }

  async getBalance(walletAddress: string): Promise<number> {
    try {
      const connection = this.getActiveConnection();
      const pubkey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(pubkey);
      return balance / 1e9;
    } catch (error) {
      console.error('[RPC] Balance check failed:', error);
      return 0;
    }
  }

  async getSlot(): Promise<number> {
    const connection = this.getActiveConnection();
    return connection.getSlot();
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latencyMs: number;
    endpoint: string;
    type: string;
  }> {
    const startTime = Date.now();
    
    try {
      const connection = this.getActiveConnection();
      await connection.getSlot();
      const latencyMs = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (latencyMs > 2000) status = 'degraded';
      if (latencyMs > 5000) status = 'unhealthy';
      
      return {
        status,
        latencyMs,
        endpoint: this.useCustomRPC ? 'Custom RPC' : 'Helius',
        type: this.useCustomRPC ? 'custom' : (HELIUS_API_KEY ? 'helius' : 'public'),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - startTime,
        endpoint: this.useCustomRPC ? 'Custom RPC' : 'Helius',
        type: this.useCustomRPC ? 'custom' : (HELIUS_API_KEY ? 'helius' : 'public'),
      };
    }
  }

  getRPCInfo(): {
    active: string;
    type: string;
    hasHelius: boolean;
    hasCustom: boolean;
  } {
    return {
      active: this.useCustomRPC ? 'Custom' : (HELIUS_API_KEY ? 'Helius Premium' : 'Public'),
      type: this.useCustomRPC ? 'custom' : (HELIUS_API_KEY ? 'helius' : 'public'),
      hasHelius: !!HELIUS_API_KEY,
      hasCustom: !!this.customEndpoint,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const rpcService = new RPCService();
