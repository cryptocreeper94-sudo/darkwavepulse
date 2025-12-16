import crypto from 'crypto';

export type ExchangeType = 'CEX' | 'DEX';

export interface Balance {
  available: number;
  locked: number;
}

export interface MarketInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  minOrderSize: number;
  maxOrderSize?: number;
  tickSize: number;
  stepSize: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

export interface Ticker {
  symbol: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT';
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED' | 'PENDING';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD';

export interface CreateOrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
  clientOrderId?: string;
}

export interface Order {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price: number;
  stopPrice?: number;
  quantity: number;
  executedQty: number;
  avgPrice: number;
  fee?: number;
  feeAsset?: string;
  timeInForce: TimeInForce;
  createdAt: number;
  updatedAt: number;
}

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  priceImpact: number;
  fee: number;
  route: string[];
  expiresAt: number;
}

export interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
  walletAddress: string;
}

export interface SwapResult {
  success: boolean;
  txSignature?: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  error?: string;
}

export interface ExchangeConnector {
  name: string;
  type: ExchangeType;
  chains?: string[];

  getBalance(asset: string): Promise<Balance>;
  getBalances(): Promise<Record<string, Balance>>;

  getMarkets(): Promise<MarketInfo[]>;
  getOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  getTicker(symbol: string): Promise<Ticker>;

  createOrder(params: CreateOrderParams): Promise<Order>;
  cancelOrder(orderId: string, symbol: string): Promise<boolean>;
  getOrder(orderId: string, symbol: string): Promise<Order>;
  getOpenOrders(symbol?: string): Promise<Order[]>;
  getOrderHistory(symbol?: string, limit?: number): Promise<Order[]>;

  validateConnection(): Promise<boolean>;
}

export interface DEXConnector extends ExchangeConnector {
  type: 'DEX';
  chains: string[];

  getSwapQuote(params: SwapParams): Promise<SwapQuote>;
  executeSwap(params: SwapParams): Promise<SwapResult>;
  getTokenBalance(tokenMint: string): Promise<number>;
}

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  subaccount?: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 32;
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 16;
  private static readonly AUTH_TAG_LENGTH = 16;

  static getEncryptionKey(): string {
    const key = process.env.EXCHANGE_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('EXCHANGE_ENCRYPTION_KEY environment variable not set');
    }
    return key;
  }

  static encrypt(data: string): string {
    const password = this.getEncryptionKey();
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const key = crypto.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEY_LENGTH, 'sha256');
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');
  }

  static decrypt(encryptedData: string): string {
    try {
      const password = this.getEncryptionKey();
      const data = Buffer.from(encryptedData, 'base64');

      const salt = data.subarray(0, this.SALT_LENGTH);
      const iv = data.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const authTag = data.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH
      );
      const encrypted = data.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH);

      const key = crypto.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEY_LENGTH, 'sha256');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('Failed to decrypt credentials - invalid key or corrupted data');
    }
  }

  static encryptCredentials(credentials: ExchangeCredentials): string {
    return this.encrypt(JSON.stringify(credentials));
  }

  static decryptCredentials(encryptedCredentials: string): ExchangeCredentials {
    const decrypted = this.decrypt(encryptedCredentials);
    return JSON.parse(decrypted);
  }
}

export abstract class BaseExchangeAdapter implements ExchangeConnector {
  abstract name: string;
  abstract type: ExchangeType;
  chains?: string[];

  protected credentials: ExchangeCredentials;
  protected lastRequestTime: number = 0;
  protected minRequestInterval: number = 100;

  constructor(credentials: ExchangeCredentials) {
    this.credentials = credentials;
  }

  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  protected logError(method: string, error: any): void {
    console.error(`[${this.name}] ${method} error:`, error.message || error);
  }

  abstract getBalance(asset: string): Promise<Balance>;
  abstract getBalances(): Promise<Record<string, Balance>>;
  abstract getMarkets(): Promise<MarketInfo[]>;
  abstract getOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  abstract getTicker(symbol: string): Promise<Ticker>;
  abstract createOrder(params: CreateOrderParams): Promise<Order>;
  abstract cancelOrder(orderId: string, symbol: string): Promise<boolean>;
  abstract getOrder(orderId: string, symbol: string): Promise<Order>;
  abstract getOpenOrders(symbol?: string): Promise<Order[]>;
  abstract getOrderHistory(symbol?: string, limit?: number): Promise<Order[]>;
  abstract validateConnection(): Promise<boolean>;
}
