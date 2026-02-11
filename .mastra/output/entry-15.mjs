import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { pgTable, timestamp, boolean, varchar, integer, text, numeric, serial, decimal, json } from 'drizzle-orm/pg-core';
import { sql, eq, and, isNotNull, desc, gte, lte } from 'drizzle-orm';
import { RSI, MACD, EMA, SMA, BollingerBands } from 'technicalindicators';
import { randomBytes } from 'crypto';

"use strict";
const subscriptions = pgTable("subscriptions", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  plan: varchar("plan", { length: 50 }).notNull().default("free"),
  // 'free' | 'basic' | 'premium'
  status: varchar("status", { length: 50 }).notNull().default("inactive"),
  // 'active' | 'inactive' | 'cancelled' | 'expired'
  provider: varchar("provider", { length: 50 }),
  // 'stripe' | 'telegram_stars' | 'crypto' | null
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  telegramPaymentId: varchar("telegram_payment_id", { length: 255 }),
  cryptoPaymentId: varchar("crypto_payment_id", { length: 255 }),
  // Coinbase Commerce charge ID
  expiryDate: timestamp("expiry_date"),
  autoRenew: boolean("auto_renew").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const userUsage = pgTable("user_usage", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  searchCount: integer("search_count").notNull().default(0),
  alertCount: integer("alert_count").notNull().default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const whitelistedUsers = pgTable("whitelisted_users", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }),
  // Optional: email address for email-based whitelist
  reason: text("reason"),
  // Optional: why they're whitelisted (e.g., "Early access", "Beta tester", "Paid subscriber")
  expiresAt: timestamp("expires_at"),
  // Optional: whitelist expiration date
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const sessions = pgTable("sessions", {
  token: varchar("token", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  // Optional: bind session to user (for future use)
  email: varchar("email", { length: 255 }),
  // Email address for email-based whitelist
  verifiedAt: timestamp("verified_at"),
  // When email was verified (null = unverified)
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  accessLevel: varchar("access_level", { length: 50 })
  // 'user' | 'premium' | 'admin' | 'owner'
});
const trackedWallets = pgTable("tracked_wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull().default("solana"),
  // 'solana' | 'ethereum' | 'polygon' | 'arbitrum' | 'base' | 'bsc'
  nickname: varchar("nickname", { length: 100 }),
  // Optional nickname for the wallet
  balance: text("balance"),
  // JSON string of token balances
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const tokenSubmissions = pgTable("token_submissions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenName: varchar("token_name", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenContract: varchar("token_contract", { length: 255 }).notNull(),
  tokenChain: varchar("token_chain", { length: 50 }).notNull(),
  tokenDescription: text("token_description").notNull(),
  tokenContact: varchar("token_contact", { length: 255 }),
  tokenLogo: text("token_logo"),
  // Base64 encoded image data
  // Social Links
  website: varchar("website", { length: 500 }),
  twitter: varchar("twitter", { length: 255 }),
  telegram: varchar("telegram", { length: 255 }),
  discord: varchar("discord", { length: 255 }),
  // Documentation (Base64 encoded PDF data or URLs)
  whitepaper: text("whitepaper"),
  tokenomics: text("tokenomics"),
  auditReport: text("audit_report"),
  // Project Qualifiers (Yes/No checkboxes)
  hasWhitepaper: boolean("has_whitepaper").default(false),
  hasAudit: boolean("has_audit").default(false),
  isDoxxedTeam: boolean("is_doxxed_team").default(false),
  hasLockedLiquidity: boolean("has_locked_liquidity").default(false),
  // Review Status
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // 'pending' | 'approved' | 'rejected'
  submittedBy: varchar("submitted_by", { length: 255 }).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason")
  // Optional: why it was rejected
});
const approvedTokens = pgTable("approved_tokens", {
  id: varchar("id", { length: 255 }).primaryKey(),
  address: varchar("address", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  description: text("description"),
  platform: varchar("platform", { length: 50 }).notNull().default("pumpfun"),
  // 'pumpfun' | 'raydium'
  chain: varchar("chain", { length: 50 }).notNull().default("solana"),
  logo: text("logo"),
  // Base64 encoded image or URL
  // Social Links
  website: varchar("website", { length: 500 }),
  twitter: varchar("twitter", { length: 255 }),
  telegram: varchar("telegram", { length: 255 }),
  discord: varchar("discord", { length: 255 }),
  // Documentation
  whitepaper: text("whitepaper"),
  tokenomics: text("tokenomics"),
  auditReport: text("audit_report"),
  // Project Qualifiers
  hasWhitepaper: boolean("has_whitepaper").default(false),
  hasAudit: boolean("has_audit").default(false),
  isDoxxedTeam: boolean("is_doxxed_team").default(false),
  hasLockedLiquidity: boolean("has_locked_liquidity").default(false),
  featured: boolean("featured").default(true),
  displayOrder: integer("display_order").default(0),
  // For sorting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const cryptoPayments = pgTable("crypto_payments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // UUID
  userId: varchar("user_id", { length: 255 }).notNull(),
  coinbaseChargeId: varchar("coinbase_charge_id", { length: 255 }).notNull().unique(),
  // Coinbase Commerce charge ID
  coinbaseChargeCode: varchar("coinbase_charge_code", { length: 255 }),
  // Charge code for URL
  // Payment Details
  amountUSD: varchar("amount_usd", { length: 50 }).notNull(),
  // Amount in USD (e.g., "5.00")
  cryptoCurrency: varchar("crypto_currency", { length: 50 }),
  // BTC, ETH, USDC, etc.
  cryptoAmount: varchar("crypto_amount", { length: 100 }),
  // Amount in crypto
  // Status Tracking
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // 'pending' | 'completed' | 'failed' | 'expired'
  hostedUrl: text("hosted_url"),
  // Coinbase Commerce payment page URL
  expiresAt: timestamp("expires_at"),
  // When the payment request expires
  // Metadata
  description: text("description"),
  // What the payment is for
  metadata: text("metadata"),
  // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  // When payment was confirmed
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const tokenLaunches = pgTable("token_launches", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenId: varchar("token_id", { length: 255 }).notNull(),
  // Links to approvedTokens
  // Launch Details
  launchDate: timestamp("launch_date").notNull(),
  launchPrice: varchar("launch_price", { length: 100 }),
  // e.g., "$0.01"
  totalSupply: varchar("total_supply", { length: 100 }),
  initialMarketCap: varchar("initial_market_cap", { length: 100 }),
  // Whitelist Configuration
  maxWhitelistSpots: integer("max_whitelist_spots").default(1e3),
  currentWhitelistCount: integer("current_whitelist_count").default(0),
  whitelistEnabled: boolean("whitelist_enabled").default(true),
  whitelistCloseDate: timestamp("whitelist_close_date"),
  // Allocation Details
  minAllocation: varchar("min_allocation", { length: 100 }),
  // Min investment (e.g., "0.1 SOL")
  maxAllocation: varchar("max_allocation", { length: 100 }),
  // Max investment (e.g., "5 SOL")
  acceptedCurrencies: text("accepted_currencies"),
  // JSON array: ["SOL", "USDC"]
  // Launch Status
  status: varchar("status", { length: 50 }).notNull().default("upcoming"),
  // 'upcoming' | 'live' | 'completed' | 'cancelled'
  featured: boolean("featured").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const launchWhitelist = pgTable("launch_whitelist", {
  id: varchar("id", { length: 255 }).primaryKey(),
  launchId: varchar("launch_id", { length: 255 }).notNull(),
  // Links to tokenLaunches
  userId: varchar("user_id", { length: 255 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull().default("solana"),
  // Allocation
  allocatedAmount: varchar("allocated_amount", { length: 100 }),
  // Amount they'll be able to invest
  contributedAmount: varchar("contributed_amount", { length: 100 }),
  // Amount they actually invested
  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // 'pending' | 'approved' | 'participated' | 'claimed'
  signedUpAt: timestamp("signed_up_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at")
});
const auditEvents = pgTable("audit_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Event Details
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventCategory: varchar("event_category", { length: 50 }).notNull(),
  actor: varchar("actor", { length: 255 }),
  // Payload & Hash
  payload: text("payload").notNull(),
  payloadHash: varchar("payload_hash", { length: 128 }).notNull(),
  hashAlgorithm: varchar("hash_algorithm", { length: 20 }).notNull().default("SHA-256"),
  // On-Chain Status
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  onchainSignature: varchar("onchain_signature", { length: 128 }),
  heliusTxId: varchar("helius_tx_id", { length: 128 }),
  solanaSlot: integer("solana_slot"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  confirmedAt: timestamp("confirmed_at")
});
const hallmarkProfiles = pgTable("hallmark_profiles", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  // Avatar Configuration
  avatarType: varchar("avatar_type", { length: 50 }).notNull().default("agent"),
  avatarId: varchar("avatar_id", { length: 100 }),
  customAvatarUrl: text("custom_avatar_url"),
  // Serial Number Tracking
  currentSerial: integer("current_serial").notNull().default(0),
  preferredTemplate: varchar("preferred_template", { length: 50 }).default("classic"),
  // Metadata
  displayName: varchar("display_name", { length: 100 }),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const hallmarkMints = pgTable("hallmark_mints", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Serial & Identity
  serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),
  avatarSnapshot: text("avatar_snapshot"),
  templateUsed: varchar("template_used", { length: 50 }).notNull().default("classic"),
  // Hash & On-Chain Reference
  payloadHash: varchar("payload_hash", { length: 128 }).notNull(),
  auditEventIds: text("audit_event_ids"),
  memoSignature: varchar("memo_signature", { length: 128 }),
  heliusTxId: varchar("helius_tx_id", { length: 128 }),
  // Artwork
  artworkUrl: text("artwork_url"),
  metadataUri: text("metadata_uri"),
  // Payment
  priceUsd: varchar("price_usd", { length: 20 }).notNull().default("1.99"),
  paymentProvider: varchar("payment_provider", { length: 50 }),
  paymentId: varchar("payment_id", { length: 255 }),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  mintedAt: timestamp("minted_at")
});
const systemConfig = pgTable("system_config", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  isSecret: boolean("is_secret").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const predictionEvents = pgTable("prediction_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  // null for system-generated predictions
  // Asset Information
  ticker: varchar("ticker", { length: 50 }).notNull(),
  assetType: varchar("asset_type", { length: 20 }).notNull().default("crypto"),
  // 'crypto' | 'stock'
  priceAtPrediction: varchar("price_at_prediction", { length: 50 }).notNull(),
  // The Prediction
  signal: varchar("signal", { length: 20 }).notNull(),
  // 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL'
  confidence: varchar("confidence", { length: 20 }),
  // 'HIGH' | 'MEDIUM' | 'LOW'
  // Full Indicator Snapshot (JSON)
  indicators: text("indicators").notNull(),
  // JSON: { rsi, macd, ema9, ema21, ema50, ema200, sma50, sma200, bollingerBands, support, resistance, volumeDelta, spikeScore, volatility }
  // Signal Details
  bullishSignals: integer("bullish_signals").notNull().default(0),
  bearishSignals: integer("bearish_signals").notNull().default(0),
  signalsList: text("signals_list"),
  // JSON array of individual signals
  // Blockchain Stamp
  payloadHash: varchar("payload_hash", { length: 128 }).notNull(),
  auditEventId: varchar("audit_event_id", { length: 255 }),
  // Reference to audit_events
  onchainSignature: varchar("onchain_signature", { length: 128 }),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // 'pending' | 'stamped' | 'evaluated'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stampedAt: timestamp("stamped_at")
});
const predictionOutcomes = pgTable("prediction_outcomes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  predictionId: varchar("prediction_id", { length: 255 }).notNull(),
  // Time Horizon
  horizon: varchar("horizon", { length: 20 }).notNull(),
  // '1h' | '4h' | '24h' | '7d'
  // Actual Results
  priceAtCheck: varchar("price_at_check", { length: 50 }).notNull(),
  priceChange: varchar("price_change", { length: 50 }).notNull(),
  // Dollar change
  priceChangePercent: varchar("price_change_percent", { length: 20 }).notNull(),
  // Percentage
  // Outcome Classification
  outcome: varchar("outcome", { length: 20 }).notNull(),
  // 'WIN' | 'LOSS' | 'NEUTRAL'
  isCorrect: boolean("is_correct").notNull(),
  // Did signal direction match price movement?
  // Additional Metrics
  volatilityDuring: varchar("volatility_during", { length: 20 }),
  // Volatility during the period
  maxDrawdown: varchar("max_drawdown", { length: 20 }),
  // Worst point during period
  maxGain: varchar("max_gain", { length: 20 }),
  // Best point during period
  createdAt: timestamp("created_at").defaultNow().notNull(),
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull()
});
const predictionAccuracyStats = pgTable("prediction_accuracy_stats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Grouping (can be null for global stats)
  ticker: varchar("ticker", { length: 50 }),
  // null = all tickers
  signal: varchar("signal", { length: 20 }),
  // null = all signals
  horizon: varchar("horizon", { length: 20 }),
  // null = all horizons
  // Accuracy Metrics
  totalPredictions: integer("total_predictions").notNull().default(0),
  correctPredictions: integer("correct_predictions").notNull().default(0),
  winRate: varchar("win_rate", { length: 10 }).notNull().default("0"),
  // Percentage
  // Performance Metrics
  avgReturn: varchar("avg_return", { length: 20 }),
  // Average % return when signal followed
  avgWinReturn: varchar("avg_win_return", { length: 20 }),
  // Avg return on wins
  avgLossReturn: varchar("avg_loss_return", { length: 20 }),
  // Avg return on losses
  bestReturn: varchar("best_return", { length: 20 }),
  worstReturn: varchar("worst_return", { length: 20 }),
  // Streaks
  currentStreak: integer("current_streak").default(0),
  // Positive = wins, negative = losses
  longestWinStreak: integer("longest_win_streak").default(0),
  longestLossStreak: integer("longest_loss_streak").default(0),
  // Time-weighted metrics (more recent predictions weighted higher)
  weightedWinRate: varchar("weighted_win_rate", { length: 10 }),
  // Last updated
  lastPredictionAt: timestamp("last_prediction_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const predictionFeatures = pgTable("prediction_features", {
  id: varchar("id", { length: 255 }).primaryKey(),
  predictionId: varchar("prediction_id", { length: 255 }).notNull(),
  horizon: varchar("horizon", { length: 20 }).notNull(),
  // '1h' | '4h' | '24h' | '7d'
  // Normalized Features (all scaled 0-1 or -1 to 1)
  rsiNormalized: varchar("rsi_normalized", { length: 20 }),
  // RSI / 100
  macdSignal: varchar("macd_signal", { length: 20 }),
  // MACD histogram direction (-1, 0, 1)
  macdStrength: varchar("macd_strength", { length: 20 }),
  // Normalized MACD distance
  // EMA Spreads (price position relative to EMAs)
  ema9Spread: varchar("ema9_spread", { length: 20 }),
  // (price - EMA9) / price * 100
  ema21Spread: varchar("ema21_spread", { length: 20 }),
  ema50Spread: varchar("ema50_spread", { length: 20 }),
  ema200Spread: varchar("ema200_spread", { length: 20 }),
  // EMA Crossovers
  ema9Over21: boolean("ema9_over_21"),
  // Golden cross indicator
  ema50Over200: boolean("ema50_over_200"),
  // Major trend indicator
  // Bollinger Band Position
  bbPosition: varchar("bb_position", { length: 20 }),
  // -1 (below lower) to 1 (above upper)
  bbWidth: varchar("bb_width", { length: 20 }),
  // Band width as % of price
  // Volume & Momentum
  volumeDeltaNorm: varchar("volume_delta_norm", { length: 20 }),
  // Normalized volume delta
  spikeScoreNorm: varchar("spike_score_norm", { length: 20 }),
  // Normalized spike score
  volatilityNorm: varchar("volatility_norm", { length: 20 }),
  // Normalized volatility
  // Support/Resistance
  distanceToSupport: varchar("distance_to_support", { length: 20 }),
  // % distance to support
  distanceToResistance: varchar("distance_to_resistance", { length: 20 }),
  // % distance to resistance
  // Labels (from outcomes)
  priceChangePercent: varchar("price_change_percent", { length: 20 }),
  isWin: boolean("is_win"),
  // Target label for classification
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const predictionModelVersions = pgTable("prediction_model_versions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Model Identity
  modelName: varchar("model_name", { length: 100 }).notNull().default("logistic_v1"),
  horizon: varchar("horizon", { length: 20 }).notNull(),
  // '1h' | '4h' | '24h' | '7d'
  version: integer("version").notNull(),
  // Model Coefficients (JSON)
  coefficients: text("coefficients").notNull(),
  // JSON: { intercept, weights: { rsi: 0.5, macd: -0.3, ... } }
  featureNames: text("feature_names").notNull(),
  // JSON array of feature names in order
  // Training Metadata
  trainingSamples: integer("training_samples").notNull(),
  validationSamples: integer("validation_samples").notNull(),
  trainingDateRange: text("training_date_range"),
  // JSON: { start, end }
  // Performance Metrics
  accuracy: varchar("accuracy", { length: 10 }).notNull(),
  // Validation accuracy
  precision: varchar("precision", { length: 10 }),
  // Precision for WIN class
  recall: varchar("recall", { length: 10 }),
  // Recall for WIN class
  f1Score: varchar("f1_score", { length: 10 }),
  auroc: varchar("auroc", { length: 10 }),
  // Area under ROC curve
  // Status
  status: varchar("status", { length: 20 }).notNull().default("training"),
  // 'training' | 'validated' | 'active' | 'retired'
  isActive: boolean("is_active").notNull().default(false),
  // Only one active per horizon
  // Timestamps
  trainedAt: timestamp("trained_at").defaultNow().notNull(),
  activatedAt: timestamp("activated_at"),
  retiredAt: timestamp("retired_at")
});
const predictionModelMetrics = pgTable("prediction_model_metrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  modelVersionId: varchar("model_version_id", { length: 255 }).notNull(),
  // Time Window
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  // Performance
  predictionsCount: integer("predictions_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  rollingAccuracy: varchar("rolling_accuracy", { length: 10 }),
  // Drift Detection
  featureDrift: varchar("feature_drift", { length: 20 }),
  // KL divergence or similar
  performanceDrift: boolean("performance_drift").default(false),
  // Flag if accuracy drops significantly
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const userFavorites = pgTable("user_favorites", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Asset Information
  assetId: varchar("asset_id", { length: 255 }).notNull(),
  // CoinGecko ID or stock ticker
  assetType: varchar("asset_type", { length: 20 }).notNull().default("crypto"),
  // 'crypto' | 'stock'
  symbol: varchar("symbol", { length: 50 }).notNull(),
  // BTC, ETH, XRP, etc.
  name: varchar("name", { length: 255 }).notNull(),
  // Bitcoin, Ethereum, etc.
  // User preferences for this favorite
  displayOrder: integer("display_order").default(0),
  // For custom sorting
  notes: text("notes"),
  // User notes about this asset
  alertsEnabled: boolean("alerts_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const userDashboardConfigs = pgTable("user_dashboard_configs", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  // Hallmark Identity
  hallmarkId: varchar("hallmark_id", { length: 100 }).unique(),
  // PULSE-XXXX-2026
  // Landing Page Preference
  defaultLandingTab: varchar("default_landing_tab", { length: 50 }).default("dashboard"),
  // 'dashboard' | 'markets' | 'portfolio' | 'stocks'
  // Dashboard Layout (JSON)
  layout: text("layout"),
  // JSON: widget positions, sizes, visibility
  // Display Preferences
  showFavoritesOnly: boolean("show_favorites_only").default(false),
  defaultChart: varchar("default_chart", { length: 50 }).default("bitcoin"),
  // Which coin to show by default
  chartTimeframe: varchar("chart_timeframe", { length: 20 }).default("7D"),
  // 1D, 7D, 30D, 1Y, ALL
  theme: varchar("theme", { length: 50 }).default("dark"),
  // Notification Preferences
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  // Avatar Config (can override or reference AvatarContext)
  avatarConfig: text("avatar_config"),
  // JSON: full avatar configuration
  avatarMode: varchar("avatar_mode", { length: 20 }).default("custom"),
  // 'custom' | 'agent'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const userWallets = pgTable("user_wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Wallet Details
  address: varchar("address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull().default("solana"),
  // 'solana' | 'ethereum' | etc.
  nickname: varchar("nickname", { length: 100 }),
  // Optional friendly name
  // Connection Status
  isConnected: boolean("is_connected").default(false),
  isPrimary: boolean("is_primary").default(false),
  // Primary trading wallet
  lastConnectedAt: timestamp("last_connected_at"),
  // Balance Cache (updated periodically)
  solBalance: varchar("sol_balance", { length: 50 }),
  // SOL balance
  lastBalanceUpdate: timestamp("last_balance_update"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const snipePresets = pgTable("snipe_presets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Preset Identity
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  // Mode
  mode: varchar("mode", { length: 20 }).notNull().default("simple"),
  // 'simple' | 'advanced'
  // === TOKEN SAFETY FILTERS (What to AVOID) ===
  maxBotPercent: integer("max_bot_percent").default(80),
  // Skip if bot % > this
  maxBundlePercent: integer("max_bundle_percent").default(50),
  // Bundle detection threshold
  maxTop10HoldersPercent: integer("max_top10_holders_percent").default(80),
  // Concentration limit
  minLiquidityUsd: integer("min_liquidity_usd").default(5e3),
  // Minimum liquidity depth
  checkCreatorWallet: boolean("check_creator_wallet").default(true),
  // Check creator history
  // === TOKEN DISCOVERY FILTERS (What to LOOK FOR) ===
  minTokenAgeMinutes: integer("min_token_age_minutes").default(5),
  // Minimum age
  maxTokenAgeMinutes: integer("max_token_age_minutes").default(1440),
  // Maximum age (24hrs default)
  minHolders: integer("min_holders").default(50),
  // Minimum holder count
  minWatchers: integer("min_watchers").default(10),
  // Minimum real people watching
  // === MOVEMENT FILTERS (Critical for finding momentum) ===
  minPriceChangePercent: varchar("min_price_change_percent", { length: 20 }).default("1.5"),
  // Min % move in timeframe
  movementTimeframeMinutes: integer("movement_timeframe_minutes").default(5),
  // Timeframe for movement check
  minVolumeMultiplier: varchar("min_volume_multiplier", { length: 20 }).default("2"),
  // Volume spike threshold (2x, 5x, 10x)
  minTradesPerMinute: integer("min_trades_per_minute").default(5),
  // Trade frequency
  minBuySellRatio: varchar("min_buy_sell_ratio", { length: 20 }).default("1.2"),
  // More buyers than sellers
  minHolderGrowthPercent: varchar("min_holder_growth_percent", { length: 20 }).default("5"),
  // Holder growth rate
  // === DEX PREFERENCES ===
  enabledDexes: text("enabled_dexes"),
  // JSON array: ['raydium', 'pumpfun', 'jupiter', 'orca', 'meteora']
  preferredDex: varchar("preferred_dex", { length: 50 }).default("jupiter"),
  // Primary DEX for swaps
  // === TRADE EXECUTION CONTROLS ===
  buyAmountSol: varchar("buy_amount_sol", { length: 50 }).default("0.5"),
  // Default buy amount
  slippagePercent: varchar("slippage_percent", { length: 20 }).default("5"),
  // Slippage tolerance
  priorityFee: varchar("priority_fee", { length: 20 }).default("auto"),
  // 'low' | 'medium' | 'high' | 'auto'
  takeProfitPercent: varchar("take_profit_percent", { length: 20 }).default("50"),
  // Exit at +X%
  stopLossPercent: varchar("stop_loss_percent", { length: 20 }).default("20"),
  // Exit at -X%
  trailingStopPercent: varchar("trailing_stop_percent", { length: 20 }),
  // Optional trailing stop
  // === SMART AUTO MODE SETTINGS ===
  maxTradesPerSession: integer("max_trades_per_session").default(10),
  maxSolPerSession: varchar("max_sol_per_session", { length: 50 }).default("5"),
  // Max SOL to spend
  cooldownSeconds: integer("cooldown_seconds").default(60),
  // Wait between trades
  maxConsecutiveLosses: integer("max_consecutive_losses").default(3),
  // Auto-stop trigger
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const snipeOrders = pgTable("snipe_orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  walletId: varchar("wallet_id", { length: 255 }).notNull(),
  // Reference to userWallets
  presetId: varchar("preset_id", { length: 255 }),
  // Optional preset used
  // Order Type
  orderType: varchar("order_type", { length: 50 }).notNull(),
  // 'snipe' | 'limit' | 'auto'
  // Target Token (for specific snipes, null for discovery mode)
  targetTokenAddress: varchar("target_token_address", { length: 255 }),
  targetTokenSymbol: varchar("target_token_symbol", { length: 50 }),
  targetTokenName: varchar("target_token_name", { length: 255 }),
  // Filter Snapshot (copy of active filters at order creation)
  filterSnapshot: text("filter_snapshot").notNull(),
  // JSON of all filter settings
  // Trade Parameters
  buyAmountSol: varchar("buy_amount_sol", { length: 50 }).notNull(),
  slippagePercent: varchar("slippage_percent", { length: 20 }).notNull(),
  priorityFee: varchar("priority_fee", { length: 20 }).notNull(),
  takeProfitPercent: varchar("take_profit_percent", { length: 20 }),
  stopLossPercent: varchar("stop_loss_percent", { length: 20 }),
  // Smart Auto Mode
  isAutoMode: boolean("is_auto_mode").default(false),
  maxTradesRemaining: integer("max_trades_remaining"),
  maxSolRemaining: varchar("max_sol_remaining", { length: 50 }),
  tradesExecuted: integer("trades_executed").default(0),
  consecutiveLosses: integer("consecutive_losses").default(0),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("active"),
  // 'active' | 'paused' | 'completed' | 'cancelled' | 'expired'
  statusReason: text("status_reason"),
  // Why it was stopped
  // Scheduling
  expiresAt: timestamp("expires_at"),
  // Optional expiration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});
const snipeExecutions = pgTable("snipe_executions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  // Reference to snipeOrders
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Token Details
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenName: varchar("token_name", { length: 255 }),
  // Trade Execution
  dex: varchar("dex", { length: 50 }).notNull(),
  // Which DEX was used
  txSignature: varchar("tx_signature", { length: 128 }),
  // Solana transaction signature
  // Entry Details
  entryPriceUsd: varchar("entry_price_usd", { length: 50 }),
  entryPriceSol: varchar("entry_price_sol", { length: 50 }),
  amountSolSpent: varchar("amount_sol_spent", { length: 50 }).notNull(),
  tokensReceived: varchar("tokens_received", { length: 100 }),
  actualSlippage: varchar("actual_slippage", { length: 20 }),
  // Exit Details (null until position closed)
  exitPriceUsd: varchar("exit_price_usd", { length: 50 }),
  exitPriceSol: varchar("exit_price_sol", { length: 50 }),
  exitTxSignature: varchar("exit_tx_signature", { length: 128 }),
  exitReason: varchar("exit_reason", { length: 50 }),
  // 'take_profit' | 'stop_loss' | 'manual' | 'trailing_stop'
  // Performance
  pnlSol: varchar("pnl_sol", { length: 50 }),
  // Profit/loss in SOL
  pnlUsd: varchar("pnl_usd", { length: 50 }),
  // Profit/loss in USD
  pnlPercent: varchar("pnl_percent", { length: 20 }),
  // % change
  holdDurationSeconds: integer("hold_duration_seconds"),
  // Token Safety Metrics at Entry (for learning)
  safetyMetrics: text("safety_metrics"),
  // JSON: { botPercent, bundlePercent, top10Percent, liquidity, holderCount }
  movementMetrics: text("movement_metrics"),
  // JSON: { priceChange, volumeMultiplier, tradesPerMin, buySellRatio }
  // AI Analysis
  aiRecommendation: varchar("ai_recommendation", { length: 50 }),
  // What AI suggested
  aiConfidence: varchar("ai_confidence", { length: 20 }),
  aiReasoning: text("ai_reasoning"),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // 'pending' | 'executed' | 'failed' | 'holding' | 'closed'
  errorMessage: text("error_message"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  executedAt: timestamp("executed_at"),
  closedAt: timestamp("closed_at")
});
const sniperSessionStats = pgTable("sniper_session_stats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Session Window
  sessionDate: timestamp("session_date").notNull(),
  // Date of session
  // Trade Counts
  totalTrades: integer("total_trades").notNull().default(0),
  winningTrades: integer("winning_trades").notNull().default(0),
  losingTrades: integer("losing_trades").notNull().default(0),
  // Performance
  winRate: varchar("win_rate", { length: 20 }),
  totalPnlSol: varchar("total_pnl_sol", { length: 50 }),
  totalPnlUsd: varchar("total_pnl_usd", { length: 50 }),
  avgPnlPercent: varchar("avg_pnl_percent", { length: 20 }),
  bestTradePnl: varchar("best_trade_pnl", { length: 50 }),
  worstTradePnl: varchar("worst_trade_pnl", { length: 50 }),
  // Volume
  totalSolSpent: varchar("total_sol_spent", { length: 50 }),
  totalSolReturned: varchar("total_sol_returned", { length: 50 }),
  // Learning Metrics
  avgHoldDuration: integer("avg_hold_duration"),
  // Seconds
  mostProfitableDex: varchar("most_profitable_dex", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const limitOrders = pgTable("limit_orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Token Details
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  // Price Targets
  entryPrice: numeric("entry_price", { precision: 30, scale: 18 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 30, scale: 18 }),
  stopLoss: numeric("stop_loss", { precision: 30, scale: 18 }),
  // Trade Amount
  buyAmountSol: numeric("buy_amount_sol", { precision: 18, scale: 9 }).notNull(),
  // Wallet
  walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
  // Status: PENDING | WATCHING | FILLED_ENTRY | FILLED_EXIT | STOPPED_OUT | CANCELLED
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  // Execution Details
  entryTxSignature: varchar("entry_tx_signature", { length: 128 }),
  exitTxSignature: varchar("exit_tx_signature", { length: 128 }),
  actualEntryPrice: numeric("actual_entry_price", { precision: 30, scale: 18 }),
  actualExitPrice: numeric("actual_exit_price", { precision: 30, scale: 18 }),
  tokensReceived: varchar("tokens_received", { length: 100 }),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  filledEntryAt: timestamp("filled_entry_at"),
  filledExitAt: timestamp("filled_exit_at")
});
const strikeAgentTrades = pgTable("strike_agent_trades", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  // solana, ethereum, base, polygon, arbitrum, bsc
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenName: varchar("token_name", { length: 255 }),
  tradeType: varchar("trade_type", { length: 20 }).notNull(),
  // buy, sell
  source: varchar("source", { length: 50 }).notNull(),
  // strikeagent_auto, strikeagent_manual, limit_order, watchlist
  entryPrice: varchar("entry_price", { length: 50 }).notNull(),
  exitPrice: varchar("exit_price", { length: 50 }),
  amount: varchar("amount", { length: 50 }).notNull(),
  amountUsd: varchar("amount_usd", { length: 50 }).notNull(),
  safetyScore: integer("safety_score"),
  safetyGrade: varchar("safety_grade", { length: 5 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // pending, executed, partial, cancelled, failed
  txHash: varchar("tx_hash", { length: 255 }),
  gasFeeUsd: varchar("gas_fee_usd", { length: 50 }),
  entryTimestamp: timestamp("entry_timestamp").notNull(),
  exitTimestamp: timestamp("exit_timestamp"),
  profitLoss: varchar("profit_loss", { length: 50 }),
  profitLossPercent: varchar("profit_loss_percent", { length: 50 }),
  isWin: boolean("is_win"),
  aiPrediction: text("ai_prediction"),
  // JSON: { signal, confidence, probability }
  indicators: text("indicators"),
  // JSON: technical indicators at entry
  notes: text("notes"),
  predictionId: varchar("prediction_id", { length: 255 }),
  // Links to prediction_events for adaptive AI learning
  horizon: varchar("horizon", { length: 10 }),
  // 1h, 4h, 24h, 7d - time horizon for prediction learning
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const referrals = pgTable("referrals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  referrerUserId: varchar("referrer_user_id", { length: 255 }).notNull(),
  referredUserId: varchar("referred_user_id", { length: 255 }),
  referralCode: varchar("referral_code", { length: 50 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // 'pending' | 'completed' | 'rewarded'
  rewardAmount: varchar("reward_amount", { length: 50 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const strikeagentPredictions = pgTable("strikeagent_predictions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  // Token Information
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenName: varchar("token_name", { length: 255 }),
  dex: varchar("dex", { length: 50 }),
  chain: varchar("chain", { length: 50 }).notNull().default("solana"),
  // Price at Discovery
  priceUsd: varchar("price_usd", { length: 50 }).notNull(),
  priceSol: varchar("price_sol", { length: 50 }),
  marketCapUsd: varchar("market_cap_usd", { length: 50 }),
  liquidityUsd: varchar("liquidity_usd", { length: 50 }),
  tokenAgeMinutes: integer("token_age_minutes"),
  // AI Recommendation
  aiRecommendation: varchar("ai_recommendation", { length: 20 }).notNull(),
  // 'snipe' | 'watch' | 'avoid'
  aiScore: integer("ai_score").notNull(),
  // 0-100
  aiReasoning: text("ai_reasoning"),
  // Safety Metrics (JSON)
  safetyMetrics: text("safety_metrics"),
  // { botPercent, bundlePercent, top10HoldersPercent, liquidityUsd, holderCount, etc }
  // Movement Metrics (JSON)
  movementMetrics: text("movement_metrics"),
  // { priceChangePercent, volumeMultiplier, tradesPerMinute, buySellRatio, holderGrowthPercent }
  // Additional Memecoin Features
  holderCount: integer("holder_count"),
  top10HoldersPercent: varchar("top10_holders_percent", { length: 20 }),
  botPercent: varchar("bot_percent", { length: 20 }),
  bundlePercent: varchar("bundle_percent", { length: 20 }),
  mintAuthorityActive: boolean("mint_authority_active"),
  freezeAuthorityActive: boolean("freeze_authority_active"),
  isHoneypot: boolean("is_honeypot"),
  liquidityLocked: boolean("liquidity_locked"),
  isPumpFun: boolean("is_pump_fun"),
  creatorWalletRisky: boolean("creator_wallet_risky"),
  // Blockchain Stamp
  payloadHash: varchar("payload_hash", { length: 128 }),
  onchainSignature: varchar("onchain_signature", { length: 128 }),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // 'pending' | 'stamped' | 'evaluated'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stampedAt: timestamp("stamped_at")
});
const strikeagentOutcomes = pgTable("strikeagent_outcomes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  predictionId: varchar("prediction_id", { length: 255 }).notNull(),
  // Time Horizon
  horizon: varchar("horizon", { length: 20 }).notNull(),
  // '1h' | '4h' | '24h' | '7d'
  // Actual Results
  priceAtCheck: varchar("price_at_check", { length: 50 }).notNull(),
  priceChangePercent: varchar("price_change_percent", { length: 20 }).notNull(),
  // Market Changes
  marketCapAtCheck: varchar("market_cap_at_check", { length: 50 }),
  liquidityAtCheck: varchar("liquidity_at_check", { length: 50 }),
  holderCountAtCheck: integer("holder_count_at_check"),
  volumeChange: varchar("volume_change", { length: 50 }),
  // Outcome Classification
  outcome: varchar("outcome", { length: 20 }).notNull(),
  // 'PUMP' | 'RUG' | 'SIDEWAYS' | 'MOON'
  isCorrect: boolean("is_correct").notNull(),
  // Did AI recommendation match actual outcome?
  // For snipe recommendations: Was the 2x target hit before any major dump?
  hit2x: boolean("hit_2x"),
  hit5x: boolean("hit_5x"),
  hit10x: boolean("hit_10x"),
  maxGainPercent: varchar("max_gain_percent", { length: 20 }),
  maxDrawdownPercent: varchar("max_drawdown_percent", { length: 20 }),
  // Token Status
  isRugged: boolean("is_rugged"),
  liquidityRemaining: varchar("liquidity_remaining", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull()
});
const dustBusterHistory = pgTable("dust_buster_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  walletAddress: varchar("wallet_address", { length: 64 }).notNull(),
  accountsClosed: integer("accounts_closed").default(0),
  tokensBurned: integer("tokens_burned").default(0),
  solRecovered: numeric("sol_recovered", { precision: 18, scale: 9 }).default("0"),
  feePaid: numeric("fee_paid", { precision: 18, scale: 9 }).default("0"),
  txSignatures: text("tx_signatures"),
  // JSON array of signatures
  createdAt: timestamp("created_at").defaultNow()
});
const dustBusterStats = pgTable("dust_buster_stats", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  totalSolRecovered: numeric("total_sol_recovered", { precision: 18, scale: 9 }).default("0"),
  totalFeePaid: numeric("total_fee_paid", { precision: 18, scale: 9 }).default("0"),
  totalAccountsClosed: integer("total_accounts_closed").default(0),
  totalTokensBurned: integer("total_tokens_burned").default(0),
  updatedAt: timestamp("updated_at").defaultNow()
});
const autoTradeConfig = pgTable("auto_trade_config", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  // Master Switch
  enabled: boolean("enabled").default(false),
  // Trading Mode: 'observer' | 'approval' | 'semi-auto' | 'full-auto'
  mode: varchar("mode", { length: 20 }).default("observer").notNull(),
  // Confidence & Accuracy Gates
  confidenceThreshold: numeric("confidence_threshold", { precision: 4, scale: 2 }).default("0.70"),
  // 0.60 - 0.90
  accuracyThreshold: numeric("accuracy_threshold", { precision: 4, scale: 2 }).default("0.55"),
  // 0.55 - 0.75
  // Position Limits
  maxPerTrade: numeric("max_per_trade", { precision: 10, scale: 2 }).default("10.00"),
  // USD
  maxPerDay: numeric("max_per_day", { precision: 10, scale: 2 }).default("50.00"),
  // USD
  maxOpenPositions: integer("max_open_positions").default(3),
  // Safety Controls
  stopAfterLosses: integer("stop_after_losses").default(3),
  // Pause after X consecutive losses
  isPaused: boolean("is_paused").default(false),
  // Manual or auto-triggered pause
  pauseReason: text("pause_reason"),
  // Why trading was paused
  pausedAt: timestamp("paused_at"),
  // Signal Filters (JSON arrays)
  allowedSignals: text("allowed_signals").default('["BUY", "STRONG_BUY"]'),
  // JSON array
  allowedHorizons: text("allowed_horizons").default('["1h", "4h"]'),
  // JSON array
  // Notification Settings
  notifyOnTrade: boolean("notify_on_trade").default(true),
  notifyOnRecommendation: boolean("notify_on_recommendation").default(true),
  notifyChannel: varchar("notify_channel", { length: 20 }).default("telegram"),
  // 'telegram' | 'email' | 'both'
  // Wallet for trading (references built-in wallet)
  tradingWalletId: varchar("trading_wallet_id", { length: 255 }),
  // Stats
  totalTradesExecuted: integer("total_trades_executed").default(0),
  winningTrades: integer("winning_trades").default(0),
  losingTrades: integer("losing_trades").default(0),
  totalProfitLoss: numeric("total_profit_loss", { precision: 18, scale: 8 }).default("0"),
  consecutiveLosses: integer("consecutive_losses").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const strikeAgentSignals = pgTable("strike_agent_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenName: varchar("token_name", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull().default("solana"),
  priceUsd: numeric("price_usd", { precision: 24, scale: 12 }),
  marketCapUsd: numeric("market_cap_usd", { precision: 24, scale: 2 }),
  liquidityUsd: numeric("liquidity_usd", { precision: 24, scale: 2 }),
  compositeScore: integer("composite_score").notNull().default(0),
  technicalScore: integer("technical_score").notNull().default(0),
  safetyScore: integer("safety_score").notNull().default(0),
  momentumScore: integer("momentum_score").notNull().default(0),
  mlConfidence: numeric("ml_confidence", { precision: 5, scale: 4 }),
  indicators: text("indicators"),
  reasoning: text("reasoning"),
  rank: integer("rank").notNull().default(0),
  category: varchar("category", { length: 50 }).notNull().default("new"),
  dex: varchar("dex", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const autoTrades = pgTable("auto_trades", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Trade Details
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }),
  tokenName: varchar("token_name", { length: 255 }),
  chain: varchar("chain", { length: 50 }).default("solana"),
  // Signal that triggered the trade
  signalType: varchar("signal_type", { length: 20 }).notNull(),
  // 'BUY' | 'STRONG_BUY' | 'SELL'
  signalConfidence: numeric("signal_confidence", { precision: 4, scale: 2 }).notNull(),
  modelAccuracy: numeric("model_accuracy", { precision: 4, scale: 2 }),
  horizon: varchar("horizon", { length: 20 }),
  // '1h' | '4h' | '24h'
  predictionId: varchar("prediction_id", { length: 255 }),
  // Link to prediction
  // Trade Execution
  tradeType: varchar("trade_type", { length: 10 }).notNull(),
  // 'BUY' | 'SELL'
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  // 'pending' | 'awaiting_approval' | 'approved' | 'executed' | 'failed' | 'cancelled' | 'rejected'
  // Amounts
  amountUSD: numeric("amount_usd", { precision: 10, scale: 2 }).notNull(),
  amountToken: numeric("amount_token", { precision: 18, scale: 8 }),
  amountNative: numeric("amount_native", { precision: 18, scale: 8 }),
  // SOL/ETH amount
  // Prices
  entryPrice: numeric("entry_price", { precision: 18, scale: 8 }),
  exitPrice: numeric("exit_price", { precision: 18, scale: 8 }),
  currentPrice: numeric("current_price", { precision: 18, scale: 8 }),
  // Profit/Loss
  profitLossUSD: numeric("profit_loss_usd", { precision: 10, scale: 2 }),
  profitLossPercent: numeric("profit_loss_percent", { precision: 6, scale: 2 }),
  isWinning: boolean("is_winning"),
  // Transaction Details
  txSignature: varchar("tx_signature", { length: 255 }),
  txError: text("tx_error"),
  gasUsed: numeric("gas_used", { precision: 18, scale: 8 }),
  // Approval (for approval mode)
  requiresApproval: boolean("requires_approval").default(false),
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  // Timing
  recommendedAt: timestamp("recommended_at").defaultNow().notNull(),
  executedAt: timestamp("executed_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const quantScanConfig = pgTable("quant_scan_config", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Category: 'top' | 'meme' | 'defi' | 'dex' | 'gainers' | 'losers' | 'blue_chip'
  category: varchar("category", { length: 50 }).notNull(),
  // Chains to scan (JSON array: ["solana", "ethereum", "base", "polygon", "arbitrum", "bsc"])
  chains: text("chains").default('["solana","ethereum","base","polygon","arbitrum","bsc"]'),
  // Scanning Configuration
  enabled: boolean("enabled").default(false),
  scanIntervalMinutes: integer("scan_interval_minutes").default(5),
  // 5-10 minutes
  maxTokensPerScan: integer("max_tokens_per_scan").default(20),
  // Filter Thresholds
  minLiquidityUsd: numeric("min_liquidity_usd", { precision: 18, scale: 2 }).default("5000"),
  minMarketCapUsd: numeric("min_market_cap_usd", { precision: 18, scale: 2 }).default("10000"),
  maxMarketCapUsd: numeric("max_market_cap_usd", { precision: 18, scale: 2 }),
  minSafetyScore: integer("min_safety_score").default(50),
  minCompositeScore: integer("min_composite_score").default(60),
  // Auto-trade settings for this category
  autoTradeEnabled: boolean("auto_trade_enabled").default(false),
  maxTradeAmountSol: numeric("max_trade_amount_sol", { precision: 10, scale: 4 }).default("0.1"),
  takeProfitPercent: numeric("take_profit_percent", { precision: 6, scale: 2 }).default("50"),
  stopLossPercent: numeric("stop_loss_percent", { precision: 6, scale: 2 }).default("20"),
  // Last Scan Info
  lastScanAt: timestamp("last_scan_at"),
  lastScanTokensFound: integer("last_scan_tokens_found").default(0),
  lastScanSignalsGenerated: integer("last_scan_signals_generated").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const quantTradeSessions = pgTable("quant_trade_sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Session Identity
  sessionName: varchar("session_name", { length: 100 }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  // 'active' | 'paused' | 'completed' | 'cancelled'
  // Session Limits
  maxTradesAllowed: integer("max_trades_allowed").default(10),
  maxSolAllowed: numeric("max_sol_allowed", { precision: 10, scale: 4 }).default("5"),
  // Session Performance
  totalTrades: integer("total_trades").default(0),
  winningTrades: integer("winning_trades").default(0),
  losingTrades: integer("losing_trades").default(0),
  totalSolUsed: numeric("total_sol_used", { precision: 10, scale: 4 }).default("0"),
  totalPnlSol: numeric("total_pnl_sol", { precision: 18, scale: 8 }).default("0"),
  totalPnlUsd: numeric("total_pnl_usd", { precision: 18, scale: 2 }).default("0"),
  // Best/Worst Trade
  bestTradePercent: numeric("best_trade_percent", { precision: 10, scale: 2 }),
  worstTradePercent: numeric("worst_trade_percent", { precision: 10, scale: 2 }),
  // Strategy Used
  strategyNotes: text("strategy_notes"),
  // Timing
  startedAt: timestamp("started_at").defaultNow().notNull(),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const quantTradeActions = pgTable("quant_trade_actions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Token Info
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }),
  tokenName: varchar("token_name", { length: 255 }),
  chain: varchar("chain", { length: 50 }).default("solana"),
  // Action Type
  actionType: varchar("action_type", { length: 10 }).notNull(),
  // 'BUY' | 'SELL'
  triggerSource: varchar("trigger_source", { length: 50 }),
  // 'manual' | 'auto_scanner' | 'signal' | 'stop_loss' | 'take_profit'
  // Status
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  // 'pending' | 'executing' | 'executed' | 'failed' | 'cancelled'
  // Amounts
  amountSol: numeric("amount_sol", { precision: 18, scale: 8 }),
  amountToken: numeric("amount_token", { precision: 24, scale: 8 }),
  amountUsd: numeric("amount_usd", { precision: 18, scale: 2 }),
  // Prices
  priceAtAction: numeric("price_at_action", { precision: 24, scale: 12 }),
  slippagePercent: numeric("slippage_percent", { precision: 6, scale: 2 }),
  // For SELL actions - Calculate P&L
  entryPriceUsd: numeric("entry_price_usd", { precision: 24, scale: 12 }),
  exitPriceUsd: numeric("exit_price_usd", { precision: 24, scale: 12 }),
  pnlSol: numeric("pnl_sol", { precision: 18, scale: 8 }),
  pnlUsd: numeric("pnl_usd", { precision: 18, scale: 2 }),
  pnlPercent: numeric("pnl_percent", { precision: 10, scale: 2 }),
  isWinning: boolean("is_winning"),
  // Signal that triggered this trade (if any)
  signalId: varchar("signal_id", { length: 255 }),
  compositeScore: integer("composite_score"),
  safetyScore: integer("safety_score"),
  // Transaction Details
  txSignature: varchar("tx_signature", { length: 255 }),
  txError: text("tx_error"),
  // Timing
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const quantLearningMetrics = pgTable("quant_learning_metrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Time Period
  periodType: varchar("period_type", { length: 20 }).notNull(),
  // 'daily' | 'weekly' | 'monthly' | 'all_time'
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end"),
  // Category Filter (null = all)
  category: varchar("category", { length: 50 }),
  // Scan Metrics
  totalScans: integer("total_scans").default(0),
  totalTokensAnalyzed: integer("total_tokens_analyzed").default(0),
  signalsGenerated: integer("signals_generated").default(0),
  // Trade Metrics
  totalTrades: integer("total_trades").default(0),
  winningTrades: integer("winning_trades").default(0),
  losingTrades: integer("losing_trades").default(0),
  winRate: numeric("win_rate", { precision: 6, scale: 2 }),
  // P&L
  totalPnlSol: numeric("total_pnl_sol", { precision: 18, scale: 8 }).default("0"),
  totalPnlUsd: numeric("total_pnl_usd", { precision: 18, scale: 2 }).default("0"),
  avgTradeReturn: numeric("avg_trade_return", { precision: 10, scale: 2 }),
  bestTradeReturn: numeric("best_trade_return", { precision: 10, scale: 2 }),
  worstTradeReturn: numeric("worst_trade_return", { precision: 10, scale: 2 }),
  // Model Performance (if ML is active)
  modelAccuracy: numeric("model_accuracy", { precision: 6, scale: 2 }),
  predictionsMade: integer("predictions_made").default(0),
  predictionsCorrect: integer("predictions_correct").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const multisigVaults = pgTable("multisig_vaults", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Vault Identity
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  // Chain Information
  chainType: varchar("chain_type", { length: 20 }).notNull(),
  // 'solana' | 'evm'
  chainId: varchar("chain_id", { length: 50 }).notNull(),
  // 'solana' | 'ethereum' | 'base' | 'polygon' etc.
  // Vault Address (PDA for Solana, Safe address for EVM)
  vaultAddress: varchar("vault_address", { length: 255 }).notNull(),
  // Solana-specific (Squads)
  multisigPda: varchar("multisig_pda", { length: 255 }),
  createKey: varchar("create_key", { length: 255 }),
  vaultBump: integer("vault_bump"),
  transactionIndex: integer("transaction_index").default(0),
  // EVM-specific (Safe)
  safeAddress: varchar("safe_address", { length: 255 }),
  safeVersion: varchar("safe_version", { length: 20 }),
  fallbackHandler: varchar("fallback_handler", { length: 255 }),
  // Threshold Configuration
  threshold: integer("threshold").notNull(),
  // Optional Features
  timeLock: integer("time_lock").default(0),
  spendingLimit: numeric("spending_limit", { precision: 24, scale: 8 }),
  spendingLimitToken: varchar("spending_limit_token", { length: 255 }),
  // Status
  status: varchar("status", { length: 20 }).default("active").notNull(),
  // Metadata
  avatarUrl: text("avatar_url"),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const vaultSigners = pgTable("vault_signers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  vaultId: varchar("vault_id", { length: 255 }).notNull(),
  // Signer Identity
  address: varchar("address", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  // Role & Permissions
  role: varchar("role", { length: 20 }).default("signer").notNull(),
  // Permissions
  canInitiate: boolean("can_initiate").default(true),
  canVote: boolean("can_vote").default(true),
  canExecute: boolean("can_execute").default(true),
  // Status
  status: varchar("status", { length: 20 }).default("active").notNull(),
  addedBy: varchar("added_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const vaultProposals = pgTable("vault_proposals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  vaultId: varchar("vault_id", { length: 255 }).notNull(),
  // Proposal Identity
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  proposalIndex: integer("proposal_index").notNull(),
  // Transaction Details
  txType: varchar("tx_type", { length: 50 }).notNull(),
  // For transfers
  toAddress: varchar("to_address", { length: 255 }),
  amount: numeric("amount", { precision: 24, scale: 8 }),
  tokenAddress: varchar("token_address", { length: 255 }),
  tokenSymbol: varchar("token_symbol", { length: 20 }),
  tokenDecimals: integer("token_decimals"),
  // For config changes
  newThreshold: integer("new_threshold"),
  signerToAdd: varchar("signer_to_add", { length: 255 }),
  signerToRemove: varchar("signer_to_remove", { length: 255 }),
  // Raw transaction data
  rawTxData: text("raw_tx_data"),
  // Solana-specific
  squadsTransactionPda: varchar("squads_transaction_pda", { length: 255 }),
  // EVM-specific
  safeTxHash: varchar("safe_tx_hash", { length: 255 }),
  safeNonce: integer("safe_nonce"),
  // Approval Tracking
  approvalsRequired: integer("approvals_required").notNull(),
  approvalsReceived: integer("approvals_received").default(0),
  rejectionsReceived: integer("rejections_received").default(0),
  // Timing
  expiresAt: timestamp("expires_at"),
  executionTimeLock: timestamp("execution_time_lock"),
  // Status
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  // Execution Details
  executedBy: varchar("executed_by", { length: 255 }),
  executedTxHash: varchar("executed_tx_hash", { length: 255 }),
  executionError: text("execution_error"),
  // Creator
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  executedAt: timestamp("executed_at")
});
const proposalVotes = pgTable("proposal_votes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  proposalId: varchar("proposal_id", { length: 255 }).notNull(),
  vaultId: varchar("vault_id", { length: 255 }).notNull(),
  // Voter
  signerAddress: varchar("signer_address", { length: 255 }).notNull(),
  // Vote
  vote: varchar("vote", { length: 20 }).notNull(),
  // On-chain signature
  signature: text("signature"),
  // EVM signature components
  signatureV: integer("signature_v"),
  signatureR: varchar("signature_r", { length: 255 }),
  signatureS: varchar("signature_s", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const vaultActivityLog = pgTable("vault_activity_log", {
  id: varchar("id", { length: 255 }).primaryKey(),
  vaultId: varchar("vault_id", { length: 255 }).notNull(),
  // Event Type
  eventType: varchar("event_type", { length: 50 }).notNull(),
  // Actor
  actorAddress: varchar("actor_address", { length: 255 }),
  // Event Data (JSON)
  eventData: text("event_data"),
  // Related entities
  proposalId: varchar("proposal_id", { length: 255 }),
  txHash: varchar("tx_hash", { length: 255 }),
  // Amount
  amount: numeric("amount", { precision: 24, scale: 8 }),
  tokenAddress: varchar("token_address", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const API_SCOPES = [
  "market:read",
  // Access market data, prices, overview
  "signals:read",
  // Access AI trading signals
  "predictions:read",
  // Access prediction history and outcomes
  "accuracy:read",
  // Access model accuracy statistics
  "strikeagent:read",
  // Access StrikeAgent token scanning
  "webhooks:write"
  // Register webhook callbacks
];
const apiKeys = pgTable("api_keys", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Key Details
  name: varchar("name", { length: 255 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  // Environment (live = production, test = sandbox with mock data)
  environment: varchar("environment", { length: 20 }).notNull().default("live"),
  // Tier & Limits
  tier: varchar("tier", { length: 50 }).notNull().default("free"),
  rateLimit: integer("rate_limit").notNull().default(60),
  dailyLimit: integer("daily_limit").notNull().default(2e3),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("active"),
  lastUsedAt: timestamp("last_used_at"),
  // Scoped Permissions (JSON array of scope strings)
  permissions: text("permissions"),
  // Metadata
  description: text("description"),
  webhookUrl: text("webhook_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at")
});
const apiUsageDaily = pgTable("api_usage_daily", {
  id: varchar("id", { length: 255 }).primaryKey(),
  keyId: varchar("key_id", { length: 255 }).notNull(),
  // Date (stored as YYYY-MM-DD string for easy grouping)
  date: varchar("date", { length: 10 }).notNull(),
  // Usage Counts
  requestCount: integer("request_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  // Endpoint Breakdown (JSON object with counts per endpoint)
  endpointBreakdown: text("endpoint_breakdown"),
  // Rate Limit Hits
  rateLimitHits: integer("rate_limit_hits").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const apiRequestLogs = pgTable("api_request_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  keyId: varchar("key_id", { length: 255 }).notNull(),
  // Request Details
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code").notNull(),
  // Performance
  latencyMs: integer("latency_ms"),
  // Request/Response (truncated for storage)
  requestParams: text("request_params"),
  responsePreview: text("response_preview"),
  // Error Details
  errorMessage: text("error_message"),
  // Client Info
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const apiSubscriptions = pgTable("api_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  tier: varchar("tier", { length: 50 }).notNull().default("free"),
  // free, pro, enterprise
  status: varchar("status", { length: 50 }).notNull().default("active"),
  // active, canceled, past_due
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const pageViews = pgTable("page_views", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: text("tenant_id").default("pulse"),
  page: text("page").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
  sessionId: text("session_id"),
  deviceType: text("device_type"),
  browser: text("browser"),
  country: text("country"),
  city: text("city"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const traderProfiles = pgTable("trader_profiles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull(),
  displayName: varchar("display_name", { length: 50 }),
  bio: text("bio"),
  totalPnl: decimal("total_pnl", { precision: 18, scale: 2 }).default("0"),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).default("0"),
  totalTrades: integer("total_trades").default(0),
  followers: integer("followers").default(0),
  rank: integer("rank"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const copyTradingSubscriptions = pgTable("copy_trading_subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id", { length: 36 }).notNull(),
  traderId: varchar("trader_id", { length: 36 }).notNull(),
  allocationPercent: decimal("allocation_percent", { precision: 5, scale: 2 }).default("10"),
  maxPositionSize: decimal("max_position_size", { precision: 18, scale: 2 }),
  isActive: boolean("is_active").default(true),
  totalCopiedTrades: integer("total_copied_trades").default(0),
  totalPnlFromCopying: decimal("total_pnl_from_copying", { precision: 18, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow()
});
const communitySignals = pgTable("community_signals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  traderId: varchar("trader_id", { length: 36 }).notNull(),
  ticker: varchar("ticker", { length: 20 }).notNull(),
  signal: varchar("signal", { length: 20 }).notNull(),
  targetPrice: decimal("target_price", { precision: 18, scale: 8 }),
  stopLoss: decimal("stop_loss", { precision: 18, scale: 8 }),
  analysis: text("analysis"),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at")
});
const signalVotes = pgTable("signal_votes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  signalId: varchar("signal_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  vote: integer("vote").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
const exchangeConnections = pgTable("exchange_connections", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  exchangeName: varchar("exchange_name", { length: 50 }).notNull(),
  exchangeType: varchar("exchange_type", { length: 10 }).notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  nickname: varchar("nickname", { length: 100 }),
  isActive: boolean("is_active").default(true),
  lastValidated: timestamp("last_validated"),
  validationStatus: varchar("validation_status", { length: 20 }).default("pending"),
  permissions: text("permissions"),
  rateLimitRemaining: integer("rate_limit_remaining"),
  rateLimitResetAt: timestamp("rate_limit_reset_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const exchangeOrders = pgTable("exchange_orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  connectionId: varchar("connection_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  exchangeOrderId: varchar("exchange_order_id", { length: 255 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  side: varchar("side", { length: 10 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  price: varchar("price", { length: 50 }),
  stopPrice: varchar("stop_price", { length: 50 }),
  quantity: varchar("quantity", { length: 50 }).notNull(),
  executedQty: varchar("executed_qty", { length: 50 }),
  avgPrice: varchar("avg_price", { length: 50 }),
  fee: varchar("fee", { length: 50 }),
  feeAsset: varchar("fee_asset", { length: 20 }),
  clientOrderId: varchar("client_order_id", { length: 255 }),
  timeInForce: varchar("time_in_force", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  filledAt: timestamp("filled_at")
});
const exchangeBalanceSnapshots = pgTable("exchange_balance_snapshots", {
  id: varchar("id", { length: 255 }).primaryKey(),
  connectionId: varchar("connection_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  balances: text("balances").notNull(),
  totalUsdValue: varchar("total_usd_value", { length: 50 }),
  snapshotAt: timestamp("snapshot_at").defaultNow().notNull()
});
const tradingProfiles = pgTable("trading_profiles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  mode: varchar("mode", { length: 50 }).notNull().default("observer"),
  maxPositionSizeUsd: decimal("max_position_size_usd", { precision: 18, scale: 2 }).default("100"),
  maxDailyLossUsd: decimal("max_daily_loss_usd", { precision: 18, scale: 2 }).default("50"),
  maxSimultaneousTrades: integer("max_simultaneous_trades").default(3),
  minConfidenceThreshold: decimal("min_confidence_threshold", { precision: 5, scale: 2 }).default("0.65"),
  killSwitchActive: boolean("kill_switch_active").default(false),
  killSwitchReason: text("kill_switch_reason"),
  fullAutoUnlocked: boolean("full_auto_unlocked").default(false),
  evaluatedOutcomesAtUnlock: integer("evaluated_outcomes_at_unlock"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const tradeSuggestions = pgTable("trade_suggestions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  predictionId: varchar("prediction_id", { length: 255 }),
  ticker: varchar("ticker", { length: 50 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull().default("solana"),
  signal: varchar("signal", { length: 50 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  suggestedSizeUsd: decimal("suggested_size_usd", { precision: 18, scale: 2 }),
  entryPrice: decimal("entry_price", { precision: 24, scale: 12 }),
  rationale: text("rationale"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  expiresAt: timestamp("expires_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const tradeExecutions = pgTable("trade_executions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  suggestionId: varchar("suggestion_id", { length: 255 }),
  exchangeConnectionId: varchar("exchange_connection_id", { length: 255 }),
  ticker: varchar("ticker", { length: 50 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  side: varchar("side", { length: 10 }).notNull(),
  sizeUsd: decimal("size_usd", { precision: 18, scale: 2 }),
  entryPrice: decimal("entry_price", { precision: 24, scale: 12 }),
  exitPrice: decimal("exit_price", { precision: 24, scale: 12 }),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  mode: varchar("mode", { length: 50 }).notNull(),
  realizedPnlUsd: decimal("realized_pnl_usd", { precision: 18, scale: 2 }),
  realizedPnlPercent: decimal("realized_pnl_percent", { precision: 10, scale: 4 }),
  exchangeOrderId: varchar("exchange_order_id", { length: 255 }),
  errorMessage: text("error_message"),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at")
});
const dailyRiskSnapshots = pgTable("daily_risk_snapshots", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  snapshotDate: timestamp("snapshot_date").notNull(),
  totalExposureUsd: decimal("total_exposure_usd", { precision: 18, scale: 2 }).default("0"),
  realizedPnlUsd: decimal("realized_pnl_usd", { precision: 18, scale: 2 }).default("0"),
  unrealizedPnlUsd: decimal("unrealized_pnl_usd", { precision: 18, scale: 2 }).default("0"),
  tradesExecuted: integer("trades_executed").default(0),
  killSwitchTriggered: boolean("kill_switch_triggered").default(false),
  killSwitchReason: text("kill_switch_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const tradingMilestones = pgTable("trading_milestones", {
  id: varchar("id", { length: 255 }).primaryKey(),
  milestoneName: varchar("milestone_name", { length: 100 }).notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const webauthnCredentials = pgTable("webauthn_credentials", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull(),
  credentialId: text("credential_id").notNull(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceName: varchar("device_name", { length: 255 }),
  transports: text("transports"),
  usedFor: varchar("used_for", { length: 50 }).notNull().default("2fa"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const webauthnChallenges = pgTable("webauthn_challenges", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull(),
  challenge: text("challenge").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const ecosystemApps = pgTable("ecosystem_apps", {
  id: varchar("id", { length: 255 }).primaryKey(),
  appName: varchar("app_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  hook: varchar("hook", { length: 255 }).notNull(),
  valueProposition: text("value_proposition").notNull(),
  keyTags: json("key_tags").$type().default([]),
  imagePrompt: text("image_prompt"),
  generatedImageUrl: text("generated_image_url"),
  websiteUrl: varchar("website_url", { length: 500 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  submittedBy: varchar("submitted_by", { length: 255 }),
  apiKey: varchar("api_key", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const portfolioWallets = pgTable("portfolio_wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  walletType: varchar("wallet_type", { length: 50 }).default("external"),
  isConnected: boolean("is_connected").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const portfolioHoldings = pgTable("portfolio_holdings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  walletId: varchar("wallet_id", { length: 255 }),
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenName: varchar("token_name", { length: 255 }),
  chain: varchar("chain", { length: 50 }).notNull(),
  balance: decimal("balance", { precision: 36, scale: 18 }).notNull(),
  balanceUsd: decimal("balance_usd", { precision: 18, scale: 2 }),
  price: decimal("price", { precision: 24, scale: 12 }),
  priceChange24h: decimal("price_change_24h", { precision: 10, scale: 4 }),
  costBasisUsd: decimal("cost_basis_usd", { precision: 18, scale: 2 }),
  unrealizedPnlUsd: decimal("unrealized_pnl_usd", { precision: 18, scale: 2 }),
  unrealizedPnlPercent: decimal("unrealized_pnl_percent", { precision: 10, scale: 4 }),
  lastUpdated: timestamp("last_updated").defaultNow().notNull()
});
const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  snapshotDate: timestamp("snapshot_date").notNull(),
  totalValueUsd: decimal("total_value_usd", { precision: 18, scale: 2 }).notNull(),
  totalCostBasisUsd: decimal("total_cost_basis_usd", { precision: 18, scale: 2 }),
  totalPnlUsd: decimal("total_pnl_usd", { precision: 18, scale: 2 }),
  totalPnlPercent: decimal("total_pnl_percent", { precision: 10, scale: 4 }),
  holdingsCount: integer("holdings_count").default(0),
  topHoldings: text("top_holdings"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const portfolioTransactions = pgTable("portfolio_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  walletId: varchar("wallet_id", { length: 255 }),
  txHash: varchar("tx_hash", { length: 255 }),
  chain: varchar("chain", { length: 50 }).notNull(),
  txType: varchar("tx_type", { length: 50 }).notNull(),
  tokenIn: varchar("token_in", { length: 255 }),
  tokenOut: varchar("token_out", { length: 255 }),
  amountIn: decimal("amount_in", { precision: 36, scale: 18 }),
  amountOut: decimal("amount_out", { precision: 36, scale: 18 }),
  priceUsd: decimal("price_usd", { precision: 24, scale: 12 }),
  valueUsd: decimal("value_usd", { precision: 18, scale: 2 }),
  feeUsd: decimal("fee_usd", { precision: 18, scale: 6 }),
  realizedPnlUsd: decimal("realized_pnl_usd", { precision: 18, scale: 2 }),
  costBasisMethod: varchar("cost_basis_method", { length: 20 }).default("FIFO"),
  txTimestamp: timestamp("tx_timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const costBasisLots = pgTable("cost_basis_lots", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  acquiredAmount: decimal("acquired_amount", { precision: 36, scale: 18 }).notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 36, scale: 18 }).notNull(),
  costBasisPerUnit: decimal("cost_basis_per_unit", { precision: 24, scale: 12 }).notNull(),
  totalCostBasis: decimal("total_cost_basis", { precision: 18, scale: 2 }).notNull(),
  acquiredAt: timestamp("acquired_at").notNull(),
  txHash: varchar("tx_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const priceAlerts = pgTable("price_alerts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tokenAddress: varchar("token_address", { length: 255 }),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  chain: varchar("chain", { length: 50 }).default("all"),
  alertType: varchar("alert_type", { length: 50 }).notNull(),
  condition: varchar("condition", { length: 20 }).notNull(),
  targetPrice: decimal("target_price", { precision: 24, scale: 12 }),
  targetPercent: decimal("target_percent", { precision: 10, scale: 4 }),
  currentPrice: decimal("current_price", { precision: 24, scale: 12 }),
  isActive: boolean("is_active").default(true),
  isTriggered: boolean("is_triggered").default(false),
  triggeredAt: timestamp("triggered_at"),
  notifyTelegram: boolean("notify_telegram").default(true),
  notifyEmail: boolean("notify_email").default(false),
  notifyPush: boolean("notify_push").default(false),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const whaleAlerts = pgTable("whale_alerts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  watchedAddress: varchar("watched_address", { length: 255 }).notNull(),
  addressLabel: varchar("address_label", { length: 100 }),
  chain: varchar("chain", { length: 50 }).notNull(),
  minAmountUsd: decimal("min_amount_usd", { precision: 18, scale: 2 }).default("10000"),
  alertOnBuy: boolean("alert_on_buy").default(true),
  alertOnSell: boolean("alert_on_sell").default(true),
  alertOnTransfer: boolean("alert_on_transfer").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const whaleTransactions = pgTable("whale_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  whaleAddress: varchar("whale_address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  txHash: varchar("tx_hash", { length: 255 }).notNull(),
  txType: varchar("tx_type", { length: 50 }).notNull(),
  tokenAddress: varchar("token_address", { length: 255 }),
  tokenSymbol: varchar("token_symbol", { length: 50 }),
  amount: decimal("amount", { precision: 36, scale: 18 }),
  valueUsd: decimal("value_usd", { precision: 18, scale: 2 }),
  fromAddress: varchar("from_address", { length: 255 }),
  toAddress: varchar("to_address", { length: 255 }),
  txTimestamp: timestamp("tx_timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const smartMoneyWallets = pgTable("smart_money_wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  address: varchar("address", { length: 255 }).notNull().unique(),
  chain: varchar("chain", { length: 50 }).notNull(),
  label: varchar("label", { length: 100 }),
  category: varchar("category", { length: 50 }),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }),
  totalPnlUsd: decimal("total_pnl_usd", { precision: 18, scale: 2 }),
  tradesCount: integer("trades_count").default(0),
  avgHoldTime: varchar("avg_hold_time", { length: 50 }),
  isVerified: boolean("is_verified").default(false),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const notificationChannels = pgTable("notification_channels", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  channelType: varchar("channel_type", { length: 50 }).notNull(),
  channelValue: varchar("channel_value", { length: 255 }).notNull(),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const notificationLogs = pgTable("notification_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  alertId: varchar("alert_id", { length: 255 }),
  alertType: varchar("alert_type", { length: 50 }).notNull(),
  channelType: varchar("channel_type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const traderFollows = pgTable("trader_follows", {
  id: varchar("id", { length: 255 }).primaryKey(),
  followerId: varchar("follower_id", { length: 255 }).notNull(),
  followingId: varchar("following_id", { length: 255 }).notNull(),
  copyTrading: boolean("copy_trading").default(false),
  copyPercent: decimal("copy_percent", { precision: 5, scale: 2 }),
  maxCopyAmountUsd: decimal("max_copy_amount_usd", { precision: 18, scale: 2 }),
  notifyOnTrade: boolean("notify_on_trade").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const sharedSignals = pgTable("shared_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenAddress: varchar("token_address", { length: 255 }),
  chain: varchar("chain", { length: 50 }),
  signalType: varchar("signal_type", { length: 20 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 24, scale: 12 }),
  targetPrice: decimal("target_price", { precision: 24, scale: 12 }),
  stopLoss: decimal("stop_loss", { precision: 24, scale: 12 }),
  reasoning: text("reasoning"),
  confidence: varchar("confidence", { length: 20 }),
  isPublic: boolean("is_public").default(true),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  copiesCount: integer("copies_count").default(0),
  outcome: varchar("outcome", { length: 20 }),
  outcomePercent: decimal("outcome_percent", { precision: 10, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at")
});
const signalComments = pgTable("signal_comments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  signalId: varchar("signal_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  comment: text("comment").notNull(),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const leaderboardSnapshots = pgTable("leaderboard_snapshots", {
  id: varchar("id", { length: 255 }).primaryKey(),
  period: varchar("period", { length: 20 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  rankings: text("rankings").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const defiPositions = pgTable("defi_positions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  protocol: varchar("protocol", { length: 100 }).notNull(),
  protocolLogo: text("protocol_logo"),
  positionType: varchar("position_type", { length: 50 }).notNull(),
  poolName: varchar("pool_name", { length: 255 }),
  poolAddress: varchar("pool_address", { length: 255 }),
  token0Symbol: varchar("token0_symbol", { length: 50 }),
  token0Address: varchar("token0_address", { length: 255 }),
  token0Amount: decimal("token0_amount", { precision: 36, scale: 18 }),
  token1Symbol: varchar("token1_symbol", { length: 50 }),
  token1Address: varchar("token1_address", { length: 255 }),
  token1Amount: decimal("token1_amount", { precision: 36, scale: 18 }),
  stakedAmount: decimal("staked_amount", { precision: 36, scale: 18 }),
  rewardToken: varchar("reward_token", { length: 50 }),
  pendingRewards: decimal("pending_rewards", { precision: 36, scale: 18 }),
  valueUsd: decimal("value_usd", { precision: 18, scale: 2 }),
  apy: decimal("apy", { precision: 10, scale: 4 }),
  apr: decimal("apr", { precision: 10, scale: 4 }),
  dailyYieldUsd: decimal("daily_yield_usd", { precision: 18, scale: 6 }),
  impermanentLossPercent: decimal("impermanent_loss_percent", { precision: 10, scale: 4 }),
  healthFactor: decimal("health_factor", { precision: 10, scale: 4 }),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const defiProtocols = pgTable("defi_protocols", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  chain: varchar("chain", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  tvl: decimal("tvl", { precision: 24, scale: 2 }),
  tvlChange24h: decimal("tvl_change_24h", { precision: 10, scale: 4 }),
  avgApy: decimal("avg_apy", { precision: 10, scale: 4 }),
  riskScore: varchar("risk_score", { length: 20 }),
  isAudited: boolean("is_audited").default(false),
  lastUpdated: timestamp("last_updated").defaultNow().notNull()
});
const yieldOpportunities = pgTable("yield_opportunities", {
  id: varchar("id", { length: 255 }).primaryKey(),
  protocolId: varchar("protocol_id", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  poolName: varchar("pool_name", { length: 255 }).notNull(),
  poolAddress: varchar("pool_address", { length: 255 }),
  tokens: text("tokens"),
  apy: decimal("apy", { precision: 10, scale: 4 }).notNull(),
  apr: decimal("apr", { precision: 10, scale: 4 }),
  baseApy: decimal("base_apy", { precision: 10, scale: 4 }),
  rewardApy: decimal("reward_apy", { precision: 10, scale: 4 }),
  tvl: decimal("tvl", { precision: 24, scale: 2 }),
  riskLevel: varchar("risk_level", { length: 20 }),
  ilRisk: varchar("il_risk", { length: 20 }),
  depositFee: decimal("deposit_fee", { precision: 5, scale: 4 }),
  withdrawFee: decimal("withdraw_fee", { precision: 5, scale: 4 }),
  lockupPeriod: varchar("lockup_period", { length: 50 }),
  minDeposit: decimal("min_deposit", { precision: 24, scale: 2 }),
  featured: boolean("featured").default(false),
  lastUpdated: timestamp("last_updated").defaultNow().notNull()
});
const cryptoEvents = pgTable("crypto_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  tokenSymbol: varchar("token_symbol", { length: 50 }),
  tokenAddress: varchar("token_address", { length: 255 }),
  chain: varchar("chain", { length: 50 }),
  eventDate: timestamp("event_date").notNull(),
  eventEndDate: timestamp("event_end_date"),
  valueUsd: decimal("value_usd", { precision: 24, scale: 2 }),
  impactLevel: varchar("impact_level", { length: 20 }),
  sourceUrl: text("source_url"),
  isConfirmed: boolean("is_confirmed").default(true),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const tokenUnlocks = pgTable("token_unlocks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenAddress: varchar("token_address", { length: 255 }),
  chain: varchar("chain", { length: 50 }),
  unlockDate: timestamp("unlock_date").notNull(),
  unlockAmount: decimal("unlock_amount", { precision: 36, scale: 18 }).notNull(),
  unlockValueUsd: decimal("unlock_value_usd", { precision: 24, scale: 2 }),
  percentOfSupply: decimal("percent_of_supply", { precision: 10, scale: 4 }),
  unlockType: varchar("unlock_type", { length: 50 }),
  recipientType: varchar("recipient_type", { length: 50 }),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const airdropTracking = pgTable("airdrop_tracking", {
  id: varchar("id", { length: 255 }).primaryKey(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }),
  chain: varchar("chain", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default("upcoming"),
  estimatedDate: timestamp("estimated_date"),
  snapshotDate: timestamp("snapshot_date"),
  claimStartDate: timestamp("claim_start_date"),
  claimEndDate: timestamp("claim_end_date"),
  eligibilityCriteria: text("eligibility_criteria"),
  estimatedValueUsd: decimal("estimated_value_usd", { precision: 18, scale: 2 }),
  websiteUrl: text("website_url"),
  twitterUrl: text("twitter_url"),
  discordUrl: text("discord_url"),
  isFeatured: boolean("is_featured").default(false),
  riskLevel: varchar("risk_level", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const userEventReminders = pgTable("user_event_reminders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  reminderTime: timestamp("reminder_time").notNull(),
  notified: boolean("notified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const tokenHolderStats = pgTable("token_holder_stats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  totalHolders: integer("total_holders").notNull(),
  top10Percent: decimal("top10_percent", { precision: 10, scale: 4 }),
  top50Percent: decimal("top50_percent", { precision: 10, scale: 4 }),
  top100Percent: decimal("top100_percent", { precision: 10, scale: 4 }),
  holdersChange24h: integer("holders_change_24h"),
  distribution: text("distribution"),
  snapshotAt: timestamp("snapshot_at").defaultNow().notNull()
});
const tokenFlows = pgTable("token_flows", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  flowType: varchar("flow_type", { length: 50 }).notNull(),
  fromCategory: varchar("from_category", { length: 50 }),
  toCategory: varchar("to_category", { length: 50 }),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  valueUsd: decimal("value_usd", { precision: 18, scale: 2 }),
  txCount: integer("tx_count").default(1),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const dexVolumeStats = pgTable("dex_volume_stats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  chain: varchar("chain", { length: 50 }).notNull(),
  dexName: varchar("dex_name", { length: 100 }),
  tokenAddress: varchar("token_address", { length: 255 }),
  tokenSymbol: varchar("token_symbol", { length: 50 }),
  volume24h: decimal("volume_24h", { precision: 24, scale: 2 }).notNull(),
  volumeChange24h: decimal("volume_change_24h", { precision: 10, scale: 4 }),
  trades24h: integer("trades_24h"),
  uniqueBuyers24h: integer("unique_buyers_24h"),
  uniqueSellers24h: integer("unique_sellers_24h"),
  buyVolume: decimal("buy_volume", { precision: 24, scale: 2 }),
  sellVolume: decimal("sell_volume", { precision: 24, scale: 2 }),
  snapshotAt: timestamp("snapshot_at").defaultNow().notNull()
});
const gasPrices = pgTable("gas_prices", {
  id: varchar("id", { length: 255 }).primaryKey(),
  chain: varchar("chain", { length: 50 }).notNull(),
  slowGwei: decimal("slow_gwei", { precision: 18, scale: 9 }),
  standardGwei: decimal("standard_gwei", { precision: 18, scale: 9 }),
  fastGwei: decimal("fast_gwei", { precision: 18, scale: 9 }),
  instantGwei: decimal("instant_gwei", { precision: 18, scale: 9 }),
  baseFee: decimal("base_fee", { precision: 18, scale: 9 }),
  priorityFee: decimal("priority_fee", { precision: 18, scale: 9 }),
  estimatedSwapCostUsd: decimal("estimated_swap_cost_usd", { precision: 10, scale: 4 }),
  congestionLevel: varchar("congestion_level", { length: 20 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const nftHoldings = pgTable("nft_holdings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  collectionAddress: varchar("collection_address", { length: 255 }).notNull(),
  collectionName: varchar("collection_name", { length: 255 }),
  tokenId: varchar("token_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  imageUrl: text("image_url"),
  rarity: varchar("rarity", { length: 50 }),
  rarityRank: integer("rarity_rank"),
  lastSalePrice: decimal("last_sale_price", { precision: 24, scale: 12 }),
  estimatedValue: decimal("estimated_value", { precision: 18, scale: 2 }),
  acquiredAt: timestamp("acquired_at"),
  acquiredPrice: decimal("acquired_price", { precision: 24, scale: 12 }),
  lastUpdated: timestamp("last_updated").defaultNow().notNull()
});
const nftCollections = pgTable("nft_collections", {
  id: varchar("id", { length: 255 }).primaryKey(),
  address: varchar("address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  symbol: varchar("symbol", { length: 50 }),
  imageUrl: text("image_url"),
  bannerUrl: text("banner_url"),
  description: text("description"),
  floorPrice: decimal("floor_price", { precision: 24, scale: 12 }),
  floorPriceUsd: decimal("floor_price_usd", { precision: 18, scale: 2 }),
  floorChange24h: decimal("floor_change_24h", { precision: 10, scale: 4 }),
  volume24h: decimal("volume_24h", { precision: 24, scale: 2 }),
  volumeChange24h: decimal("volume_change_24h", { precision: 10, scale: 4 }),
  totalSupply: integer("total_supply"),
  holders: integer("holders"),
  listedCount: integer("listed_count"),
  websiteUrl: text("website_url"),
  twitterUrl: text("twitter_url"),
  discordUrl: text("discord_url"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull()
});
const referralCodes = pgTable("referral_codes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  rewardPercent: decimal("reward_percent", { precision: 5, scale: 2 }).default("10"),
  lifetimeReferrals: integer("lifetime_referrals").default(0),
  lifetimeEarningsUsd: decimal("lifetime_earnings_usd", { precision: 18, scale: 2 }).default("0"),
  pendingPayoutUsd: decimal("pending_payout_usd", { precision: 18, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const referralAttributions = pgTable("referral_attributions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  referrerUserId: varchar("referrer_user_id", { length: 255 }).notNull(),
  referredUserId: varchar("referred_user_id", { length: 255 }).notNull(),
  referralCode: varchar("referral_code", { length: 50 }).notNull(),
  signupDate: timestamp("signup_date").defaultNow().notNull(),
  firstPurchaseDate: timestamp("first_purchase_date"),
  totalSpendUsd: decimal("total_spend_usd", { precision: 18, scale: 2 }).default("0"),
  commissionPaidUsd: decimal("commission_paid_usd", { precision: 18, scale: 2 }).default("0"),
  status: varchar("status", { length: 50 }).default("active")
});
const referralPayouts = pgTable("referral_payouts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  amountUsd: decimal("amount_usd", { precision: 18, scale: 2 }).notNull(),
  payoutMethod: varchar("payout_method", { length: 50 }).notNull(),
  payoutAddress: varchar("payout_address", { length: 255 }),
  txHash: varchar("tx_hash", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const arbitrageOpportunities = pgTable("arbitrage_opportunities", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenAddress: varchar("token_address", { length: 255 }),
  buyExchange: varchar("buy_exchange", { length: 100 }).notNull(),
  buyChain: varchar("buy_chain", { length: 50 }),
  buyPrice: decimal("buy_price", { precision: 24, scale: 12 }).notNull(),
  sellExchange: varchar("sell_exchange", { length: 100 }).notNull(),
  sellChain: varchar("sell_chain", { length: 50 }),
  sellPrice: decimal("sell_price", { precision: 24, scale: 12 }).notNull(),
  spreadPercent: decimal("spread_percent", { precision: 10, scale: 4 }).notNull(),
  estimatedProfitUsd: decimal("estimated_profit_usd", { precision: 18, scale: 2 }),
  minTradeSize: decimal("min_trade_size", { precision: 18, scale: 2 }),
  maxTradeSize: decimal("max_trade_size", { precision: 18, scale: 2 }),
  bridgeFeeUsd: decimal("bridge_fee_usd", { precision: 18, scale: 6 }),
  gasFeeUsd: decimal("gas_fee_usd", { precision: 18, scale: 6 }),
  netProfitUsd: decimal("net_profit_usd", { precision: 18, scale: 2 }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const userLocalePrefs = pgTable("user_locale_prefs", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  locale: varchar("locale", { length: 10 }).notNull().default("en"),
  timezone: varchar("timezone", { length: 100 }),
  dateFormat: varchar("date_format", { length: 50 }),
  numberFormat: varchar("number_format", { length: 50 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const socialProfiles = pgTable("social_profiles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  isPublic: boolean("is_public").default(true),
  verifiedTrader: boolean("verified_trader").default(false),
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  totalTrades: integer("total_trades").default(0),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).default("0"),
  totalPnlUsd: decimal("total_pnl_usd", { precision: 18, scale: 2 }).default("0"),
  avgTradeSize: decimal("avg_trade_size", { precision: 18, scale: 2 }),
  bestTrade: text("best_trade"),
  tradingStyle: varchar("trading_style", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const socialFollows = pgTable("social_follows", {
  id: varchar("id", { length: 255 }).primaryKey(),
  followerId: varchar("follower_id", { length: 255 }).notNull(),
  followedId: varchar("followed_id", { length: 255 }).notNull(),
  copyTrading: boolean("copy_trading").default(false),
  copyPercent: decimal("copy_percent", { precision: 5, scale: 2 }),
  maxCopyAmount: decimal("max_copy_amount", { precision: 18, scale: 2 }),
  notifyOnSignals: boolean("notify_on_signals").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const tradingSignals = pgTable("trading_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
  tokenAddress: varchar("token_address", { length: 255 }),
  chain: varchar("chain", { length: 50 }).default("solana"),
  signalType: varchar("signal_type", { length: 20 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 24, scale: 12 }),
  targetPrice: decimal("target_price", { precision: 24, scale: 12 }),
  stopLoss: decimal("stop_loss", { precision: 24, scale: 12 }),
  reasoning: text("reasoning"),
  isPublic: boolean("is_public").default(true),
  outcome: varchar("outcome", { length: 20 }),
  outcomePercent: decimal("outcome_percent", { precision: 10, scale: 4 }),
  closedAt: timestamp("closed_at"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  copiesCount: integer("copies_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const leaderboardHistory = pgTable("leaderboard_history", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  rank: integer("rank").notNull(),
  totalPnlUsd: decimal("total_pnl_usd", { precision: 18, scale: 2 }).notNull(),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }),
  tradesCount: integer("trades_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

var schema = /*#__PURE__*/Object.freeze({
  __proto__: null,
  API_SCOPES: API_SCOPES,
  airdropTracking: airdropTracking,
  apiKeys: apiKeys,
  apiRequestLogs: apiRequestLogs,
  apiSubscriptions: apiSubscriptions,
  apiUsageDaily: apiUsageDaily,
  approvedTokens: approvedTokens,
  arbitrageOpportunities: arbitrageOpportunities,
  auditEvents: auditEvents,
  autoTradeConfig: autoTradeConfig,
  autoTrades: autoTrades,
  communitySignals: communitySignals,
  copyTradingSubscriptions: copyTradingSubscriptions,
  costBasisLots: costBasisLots,
  cryptoEvents: cryptoEvents,
  cryptoPayments: cryptoPayments,
  dailyRiskSnapshots: dailyRiskSnapshots,
  defiPositions: defiPositions,
  defiProtocols: defiProtocols,
  dexVolumeStats: dexVolumeStats,
  dustBusterHistory: dustBusterHistory,
  dustBusterStats: dustBusterStats,
  ecosystemApps: ecosystemApps,
  exchangeBalanceSnapshots: exchangeBalanceSnapshots,
  exchangeConnections: exchangeConnections,
  exchangeOrders: exchangeOrders,
  gasPrices: gasPrices,
  hallmarkMints: hallmarkMints,
  hallmarkProfiles: hallmarkProfiles,
  launchWhitelist: launchWhitelist,
  leaderboardHistory: leaderboardHistory,
  leaderboardSnapshots: leaderboardSnapshots,
  limitOrders: limitOrders,
  multisigVaults: multisigVaults,
  nftCollections: nftCollections,
  nftHoldings: nftHoldings,
  notificationChannels: notificationChannels,
  notificationLogs: notificationLogs,
  pageViews: pageViews,
  portfolioHoldings: portfolioHoldings,
  portfolioSnapshots: portfolioSnapshots,
  portfolioTransactions: portfolioTransactions,
  portfolioWallets: portfolioWallets,
  predictionAccuracyStats: predictionAccuracyStats,
  predictionEvents: predictionEvents,
  predictionFeatures: predictionFeatures,
  predictionModelMetrics: predictionModelMetrics,
  predictionModelVersions: predictionModelVersions,
  predictionOutcomes: predictionOutcomes,
  priceAlerts: priceAlerts,
  proposalVotes: proposalVotes,
  quantLearningMetrics: quantLearningMetrics,
  quantScanConfig: quantScanConfig,
  quantTradeActions: quantTradeActions,
  quantTradeSessions: quantTradeSessions,
  referralAttributions: referralAttributions,
  referralCodes: referralCodes,
  referralPayouts: referralPayouts,
  referrals: referrals,
  sessions: sessions,
  sharedSignals: sharedSignals,
  signalComments: signalComments,
  signalVotes: signalVotes,
  smartMoneyWallets: smartMoneyWallets,
  snipeExecutions: snipeExecutions,
  snipeOrders: snipeOrders,
  snipePresets: snipePresets,
  sniperSessionStats: sniperSessionStats,
  socialFollows: socialFollows,
  socialProfiles: socialProfiles,
  strikeAgentSignals: strikeAgentSignals,
  strikeAgentTrades: strikeAgentTrades,
  strikeagentOutcomes: strikeagentOutcomes,
  strikeagentPredictions: strikeagentPredictions,
  subscriptions: subscriptions,
  systemConfig: systemConfig,
  tokenFlows: tokenFlows,
  tokenHolderStats: tokenHolderStats,
  tokenLaunches: tokenLaunches,
  tokenSubmissions: tokenSubmissions,
  tokenUnlocks: tokenUnlocks,
  trackedWallets: trackedWallets,
  tradeExecutions: tradeExecutions,
  tradeSuggestions: tradeSuggestions,
  traderFollows: traderFollows,
  traderProfiles: traderProfiles,
  tradingMilestones: tradingMilestones,
  tradingProfiles: tradingProfiles,
  tradingSignals: tradingSignals,
  userDashboardConfigs: userDashboardConfigs,
  userEventReminders: userEventReminders,
  userFavorites: userFavorites,
  userLocalePrefs: userLocalePrefs,
  userUsage: userUsage,
  userWallets: userWallets,
  vaultActivityLog: vaultActivityLog,
  vaultProposals: vaultProposals,
  vaultSigners: vaultSigners,
  webauthnChallenges: webauthnChallenges,
  webauthnCredentials: webauthnCredentials,
  whaleAlerts: whaleAlerts,
  whaleTransactions: whaleTransactions,
  whitelistedUsers: whitelistedUsers,
  yieldOpportunities: yieldOpportunities
});

"use strict";
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/mastra"
});
const db = drizzle(pool, { schema });

"use strict";
async function getEmailFromSession(sessionToken) {
  if (!sessionToken) return null;
  try {
    const { sessions } = await Promise.resolve().then(function () { return schema; });
    const [session] = await db.select().from(sessions).where(eq(sessions.token, sessionToken)).limit(1);
    return session?.email || null;
  } catch {
    return null;
  }
}
async function checkSubscriptionLimit(userId, feature, sessionToken) {
  try {
    console.log(`\u{1F513} [SubscriptionCheck] LIMITS DISABLED FOR TESTING - User ${userId} granted unlimited access`);
    return { allowed: true, isPremium: true, isWhitelisted: true };
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    const isPremium = subscription?.plan === "premium" && subscription?.status === "active";
    const isBasic = subscription?.plan === "basic" && subscription?.status === "active";
    if (isPremium) {
      return { allowed: true, isPremium: true };
    }
    const limits = {
      search: 20,
      // 20 searches/day for both Basic ($2/mo) and Free trial (7 days)
      alert: 3
      // 3 price alerts/day
    };
    let [usage] = await db.select().from(userUsage).where(eq(userUsage.userId, userId));
    if (!usage) {
      await db.insert(userUsage).values({
        userId,
        searchCount: 0,
        alertCount: 0
      });
      usage = { userId, searchCount: 0, alertCount: 0, lastResetDate: /* @__PURE__ */ new Date(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
    }
    const now = /* @__PURE__ */ new Date();
    const lastReset = new Date(usage.lastResetDate);
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1e3 * 60 * 60 * 24));
    if (daysSinceReset >= 1) {
      await db.update(userUsage).set({ searchCount: 0, alertCount: 0, lastResetDate: now, updatedAt: now }).where(eq(userUsage.userId, userId));
      usage.searchCount = 0;
      usage.alertCount = 0;
    }
    const currentCount = feature === "search" ? usage.searchCount : usage.alertCount;
    const limit = limits[feature];
    if (currentCount >= limit) {
      return {
        allowed: false,
        isPremium: false,
        message: `Daily limit reached (${limit} ${feature}es per day on free plan). Upgrade to Premium for unlimited access!`
      };
    }
    const updateField = feature === "search" ? { searchCount: currentCount + 1 } : { alertCount: currentCount + 1 };
    await db.update(userUsage).set({ ...updateField, updatedAt: now }).where(eq(userUsage.userId, userId));
    return { allowed: true, isPremium: false };
  } catch (error) {
    console.error("Subscription check error:", error);
    return {
      allowed: false,
      isPremium: false,
      message: "Unable to verify subscription status. Please try again."
    };
  }
}

"use strict";
const dataCache = /* @__PURE__ */ new Map();
const CACHE_TTL = 10 * 60 * 1e3;
const marketDataTool = createTool({
  id: "market-data-tool",
  description: "Fetches historical price data for crypto or stock tickers. Returns OHLCV (Open, High, Low, Close, Volume) data for technical analysis.",
  inputSchema: z.object({
    ticker: z.string().describe("Ticker symbol (e.g., BTC, ETH, AAPL, TSLA)"),
    days: z.number().optional().default(90).describe("Number of days of historical data (default: 90)"),
    type: z.enum(["crypto", "stock"]).optional().describe("Asset type - auto-detected if not specified")
  }),
  outputSchema: z.object({
    ticker: z.string(),
    type: z.string(),
    currentPrice: z.number(),
    priceChange24h: z.number(),
    priceChangePercent24h: z.number(),
    volume24h: z.number().optional(),
    prices: z.array(z.object({
      timestamp: z.number(),
      open: z.number(),
      high: z.number(),
      low: z.number(),
      close: z.number(),
      volume: z.number()
    })),
    marketCap: z.number().optional()
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    const logger = mastra?.getLogger();
    logger?.info("\u{1F527} [MarketDataTool] Starting execution", { ticker: context.ticker, days: context.days });
    const userId = runtimeContext?.resourceId || "unknown";
    const limitCheck = await checkSubscriptionLimit(userId, "search");
    logger?.info("\u{1F510} [MarketDataTool] Subscription check result", { userId, allowed: limitCheck.allowed, isPremium: limitCheck.isPremium });
    if (!limitCheck.allowed) {
      logger?.warn("\u26A0\uFE0F [MarketDataTool] Usage limit exceeded", { userId, message: limitCheck.message });
      throw new Error(limitCheck.message || "Daily search limit reached. Upgrade to Premium for unlimited access!");
    }
    const ticker = context.ticker.toUpperCase();
    const days = context.days || 90;
    let assetType = context.type;
    if (!assetType) {
      const knownCryptos = ["BTC", "ETH", "SOL", "USDT", "USDC", "BNB", "XRP", "ADA", "DOGE", "MATIC", "DOT", "SHIB", "AVAX", "UNI", "LINK", "ATOM", "LTC", "BCH", "XLM", "ALGO", "ICP", "FIL", "NEAR", "APT", "ARB", "OP", "SUI"];
      if (knownCryptos.includes(ticker)) {
        assetType = "crypto";
      } else if (ticker.includes(".")) {
        assetType = "stock";
      } else if (ticker.length > 5) {
        assetType = "crypto";
      } else {
        assetType = "stock";
      }
    }
    logger?.info("\u{1F4DD} [MarketDataTool] Initial detection", { ticker, assetType });
    try {
      if (assetType === "crypto") {
        logger?.info("\u{1F4CA} [MarketDataTool] Fetching as crypto", { ticker });
        try {
          return await fetchCryptoDataWithRetry(ticker, days, logger);
        } catch (cryptoError) {
          logger?.warn("\u26A0\uFE0F [MarketDataTool] Crypto fetch failed, trying as stock", {
            error: cryptoError.message
          });
          return await fetchStockData(ticker, days, logger);
        }
      } else {
        logger?.info("\u{1F4CA} [MarketDataTool] Fetching as stock", { ticker });
        try {
          return await fetchStockData(ticker, days, logger);
        } catch (stockError) {
          logger?.warn("\u26A0\uFE0F [MarketDataTool] Stock fetch failed, trying as crypto", {
            error: stockError.message
          });
          return await fetchCryptoDataWithRetry(ticker, days, logger);
        }
      }
    } catch (error) {
      logger?.error("\u274C [MarketDataTool] All fetch attempts failed", { error: error.message });
      throw new Error(`Failed to fetch market data for ${ticker}: Not found in crypto or stock markets`);
    }
  }
});
const COINGECKO_MAP = {
  // Top 10
  "BTC": "bitcoin",
  "ETH": "ethereum",
  "USDT": "tether",
  "BNB": "binancecoin",
  "SOL": "solana",
  "USDC": "usd-coin",
  "XRP": "ripple",
  "STETH": "staked-ether",
  "ADA": "cardano",
  "DOGE": "dogecoin",
  // Top 11-30
  "TRX": "tron",
  "TON": "the-open-network",
  "LINK": "chainlink",
  "AVAX": "avalanche-2",
  "SHIB": "shiba-inu",
  "WBTC": "wrapped-bitcoin",
  "DOT": "polkadot",
  "DAI": "dai",
  "BCH": "bitcoin-cash",
  "LTC": "litecoin",
  "MATIC": "matic-network",
  "UNI": "uniswap",
  "LEO": "leo-token",
  "NEAR": "near",
  "PEPE": "pepe",
  "APT": "aptos",
  "ICP": "internet-computer",
  "WIF": "dogwifcoin",
  "POL": "polygon-ecosystem-token",
  "ETC": "ethereum-classic",
  // Top 31-60
  "FET": "fetch-ai",
  "RENDER": "render-token",
  "STX": "blockstack",
  "ARB": "arbitrum",
  "XLM": "stellar",
  "IMX": "immutable-x",
  "MNT": "mantle",
  "HBAR": "hedera-hashgraph",
  "ATOM": "cosmos",
  "CRO": "crypto-com-chain",
  "INJ": "injective-protocol",
  "FIL": "filecoin",
  "OP": "optimism",
  "VET": "vechain",
  "TIA": "celestia",
  "TAO": "bittensor",
  "BONK": "bonk",
  "SUI": "sui",
  "ALGO": "algorand",
  "XMR": "monero",
  "SEI": "sei-network",
  "THETA": "theta-token",
  "AAVE": "aave",
  "GRT": "the-graph",
  "RUNE": "thorchain",
  "MKR": "maker",
  "FTM": "fantom",
  "FLOW": "flow",
  "EOS": "eos",
  "BSV": "bitcoin-cash-sv",
  // Top 61-100
  "SNX": "synthetix-network-token",
  "SAND": "the-sandbox",
  "MANA": "decentraland",
  "AXS": "axie-infinity",
  "AR": "arweave",
  "FLOKI": "floki",
  "KAVA": "kava",
  "NEO": "neo",
  "XTZ": "tezos",
  "GALA": "gala",
  "ZEC": "zcash",
  "QNT": "quant-network",
  "EGLD": "elrond-erd-2",
  "KLAY": "klay-token",
  "MINA": "mina-protocol",
  "CHZ": "chiliz",
  "ROSE": "oasis-network",
  "CFX": "conflux-token",
  "CELO": "celo",
  "ZIL": "zilliqa",
  "ENJ": "enjincoin",
  "IOTA": "iota",
  "LDO": "lido-dao",
  "COMP": "compound-governance-token",
  "CRV": "curve-dao-token",
  "1INCH": "1inch",
  "BAT": "basic-attention-token",
  "ZRX": "0x",
  "SUSHI": "sushi",
  "YFI": "yearn-finance",
  "DASH": "dash",
  "WAVES": "waves",
  "HOT": "holotoken",
  "DCR": "decred",
  "QTUM": "qtum",
  "OMG": "omisego",
  "ICX": "icon",
  "ZEN": "zencash",
  "ONT": "ontology",
  "XVG": "verge",
  // Other notable coins
  "OSMO": "osmosis",
  "JUNO": "juno-network",
  "LUNA": "terra-luna-2",
  "LUNC": "terra-luna",
  "FTT": "ftx-token"
};
async function fetchCryptoDataWithRetry(ticker, days, logger, maxRetries = 3) {
  const cacheKey = `crypto_${ticker}_${days}`;
  const cached = dataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger?.info("\u{1F4BE} [MarketDataTool] Using cached data", { ticker, age: Math.round((Date.now() - cached.timestamp) / 1e3) + "s" });
    return cached.data;
  }
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await fetchCryptoData(ticker, days, logger);
      dataCache.set(cacheKey, { data, timestamp: Date.now() });
      logger?.info("\u{1F4BE} [MarketDataTool] Data cached", { ticker, ttl: CACHE_TTL / 1e3 + "s" });
      return data;
    } catch (error) {
      const isRateLimit = error.response?.status === 429 || error.response?.status === 401 || error.message?.includes("429") || error.message?.includes("401");
      if (isRateLimit && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 2e3;
        logger?.warn(`\u23F3 [MarketDataTool] Rate limited/auth error, retrying in ${delay / 1e3}s (attempt ${attempt}/${maxRetries})`, {
          ticker,
          attempt
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}
async function fetchCryptoData(ticker, days, logger) {
  logger?.info("\u{1F4CA} [MarketDataTool] Fetching crypto data from CryptoCompare", { ticker, days });
  const priceUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${ticker}&tsyms=USD`;
  const priceResponse = await axios.get(priceUrl);
  const coinData = priceResponse.data?.RAW?.[ticker]?.USD;
  if (!coinData) {
    throw new Error(`Cryptocurrency ${ticker} not found on CryptoCompare`);
  }
  const currentPrice = coinData.PRICE || 0;
  const priceChangePercent24h = coinData.CHANGEPCT24HOUR || 0;
  const volume24h = coinData.VOLUME24HOURTO || 0;
  const marketCap = coinData.MKTCAP || 0;
  const limit = Math.min(days * 6, 2e3);
  const historyUrl = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${ticker}&tsym=USD&limit=${limit}`;
  const historyResponse = await axios.get(historyUrl);
  const histData = historyResponse.data?.Data?.Data || [];
  const candleSize = 4;
  const prices = [];
  for (let i = 0; i < histData.length; i += candleSize) {
    const candles = histData.slice(i, Math.min(i + candleSize, histData.length));
    if (candles.length === 0) continue;
    const open = candles[0].open;
    const close = candles[candles.length - 1].close;
    const high = Math.max(...candles.map((c) => c.high));
    const low = Math.min(...candles.map((c) => c.low));
    const volume = candles.reduce((sum, c) => sum + c.volumeto, 0);
    const timestamp = candles[0].time * 1e3;
    prices.push({ timestamp, open, high, low, close, volume });
  }
  logger?.info("\u2705 [MarketDataTool] Successfully fetched crypto data from CryptoCompare", {
    ticker,
    dataPoints: prices.length,
    currentPrice
  });
  return {
    ticker,
    type: "crypto",
    currentPrice,
    priceChange24h: currentPrice * (priceChangePercent24h / 100),
    priceChangePercent24h,
    volume24h,
    marketCap,
    prices
  };
}
async function fetchStockDataAlphaVantage(ticker, days, logger) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    logger?.warn("\u26A0\uFE0F [MarketDataTool] Alpha Vantage API key not configured, skipping fallback");
    throw new Error("Alpha Vantage API key not configured");
  }
  logger?.info("\u{1F4CA} [MarketDataTool] Fetching stock data from Alpha Vantage (fallback)", { ticker, days });
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=full&apikey=${apiKey}`;
  const response = await axios.get(url, {
    timeout: 15e3
  });
  if (response.data["Error Message"]) {
    throw new Error(`Alpha Vantage: ${response.data["Error Message"]}`);
  }
  if (response.data["Note"]) {
    throw new Error("Alpha Vantage rate limit exceeded (25 calls/day)");
  }
  const timeSeries = response.data["Time Series (Daily)"];
  if (!timeSeries) {
    throw new Error(`Stock ${ticker} not found on Alpha Vantage`);
  }
  const dates = Object.keys(timeSeries).slice(0, days);
  const prices = dates.map((date) => {
    const data = timeSeries[date];
    return {
      timestamp: new Date(date).getTime(),
      open: parseFloat(data["1. open"]),
      high: parseFloat(data["2. high"]),
      low: parseFloat(data["3. low"]),
      close: parseFloat(data["4. close"]),
      volume: parseFloat(data["5. volume"])
    };
  }).reverse();
  const latestData = timeSeries[dates[0]];
  const previousData = timeSeries[dates[1]] || latestData;
  const currentPrice = parseFloat(latestData["4. close"]);
  const previousClose = parseFloat(previousData["4. close"]);
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = priceChange / previousClose * 100;
  logger?.info("\u2705 [MarketDataTool] Successfully fetched stock data from Alpha Vantage", {
    ticker,
    dataPoints: prices.length,
    currentPrice
  });
  return {
    ticker,
    type: "stock",
    currentPrice,
    priceChange24h: priceChange,
    priceChangePercent24h: priceChangePercent,
    prices
  };
}
async function fetchStockData(ticker, days, logger) {
  const cacheKey = `stock_${ticker}_${days}`;
  const cached = dataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger?.info("\u{1F4BE} [MarketDataTool] Using cached data", { ticker, age: Math.round((Date.now() - cached.timestamp) / 1e3) + "s" });
    return cached.data;
  }
  try {
    logger?.info("\u{1F4CA} [MarketDataTool] Fetching stock data from Yahoo Finance", { ticker, days });
    const period2 = Math.floor(Date.now() / 1e3);
    const period1 = period2 - days * 24 * 60 * 60;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      },
      timeout: 1e4
    });
    const result = response.data.chart.result[0];
    if (!result) {
      throw new Error(`Stock ${ticker} not found on Yahoo Finance`);
    }
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp;
    const prices = timestamps.map((ts, i) => ({
      timestamp: ts * 1e3,
      open: quote.open[i] || 0,
      high: quote.high[i] || 0,
      low: quote.low[i] || 0,
      close: quote.close[i] || 0,
      volume: quote.volume[i] || 0
    }));
    const currentPrice = result.meta.regularMarketPrice;
    const previousClose = result.meta.chartPreviousClose;
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = priceChange / previousClose * 100;
    const data = {
      ticker,
      type: "stock",
      currentPrice,
      priceChange24h: priceChange,
      priceChangePercent24h: priceChangePercent,
      prices
    };
    dataCache.set(cacheKey, { data, timestamp: Date.now() });
    logger?.info("\u{1F4BE} [MarketDataTool] Data cached", { ticker, ttl: CACHE_TTL / 1e3 + "s" });
    logger?.info("\u2705 [MarketDataTool] Successfully fetched stock data from Yahoo Finance", {
      ticker,
      dataPoints: prices.length,
      currentPrice
    });
    return data;
  } catch (yahooError) {
    logger?.warn("\u26A0\uFE0F [MarketDataTool] Yahoo Finance failed, trying Alpha Vantage fallback", {
      error: yahooError.message
    });
    try {
      const data = await fetchStockDataAlphaVantage(ticker, days, logger);
      dataCache.set(cacheKey, { data, timestamp: Date.now() });
      logger?.info("\u{1F4BE} [MarketDataTool] Fallback data cached", { ticker, ttl: CACHE_TTL / 1e3 + "s" });
      return data;
    } catch (alphaError) {
      logger?.error("\u274C [MarketDataTool] Both Yahoo and Alpha Vantage failed", {
        yahooError: yahooError.message,
        alphaError: alphaError.message
      });
      throw new Error(`Failed to fetch stock data for ${ticker}: ${yahooError.message}`);
    }
  }
}

"use strict";
const FEATURE_NAMES = [
  "rsiNormalized",
  "macdSignal",
  "macdStrength",
  "ema9Spread",
  "ema21Spread",
  "ema50Spread",
  "ema200Spread",
  "ema9Over21",
  "ema50Over200",
  "bbPosition",
  "bbWidth",
  "volumeDeltaNorm",
  "spikeScoreNorm",
  "volatilityNorm",
  "distanceToSupport",
  "distanceToResistance"
];
const MIN_TRAINING_SAMPLES = 50;
class PredictionLearningService {
  modelCache = /* @__PURE__ */ new Map();
  async extractFeatures(predictionId, horizon, priceChangePercent, isWin) {
    const prediction = await db.select().from(predictionEvents).where(eq(predictionEvents.id, predictionId)).limit(1);
    if (!prediction.length) {
      console.log(`[ML] Prediction ${predictionId} not found`);
      return;
    }
    const pred = prediction[0];
    const indicators = JSON.parse(pred.indicators);
    const price = parseFloat(pred.priceAtPrediction);
    const features = this.normalizeIndicators(indicators, price);
    const featureId = `feat_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
    await db.insert(predictionFeatures).values({
      id: featureId,
      predictionId,
      horizon,
      rsiNormalized: features.rsiNormalized.toFixed(4),
      macdSignal: features.macdSignal.toFixed(4),
      macdStrength: features.macdStrength.toFixed(4),
      ema9Spread: features.ema9Spread.toFixed(4),
      ema21Spread: features.ema21Spread.toFixed(4),
      ema50Spread: features.ema50Spread.toFixed(4),
      ema200Spread: features.ema200Spread.toFixed(4),
      ema9Over21: features.ema9Over21 > 0,
      ema50Over200: features.ema50Over200 > 0,
      bbPosition: features.bbPosition.toFixed(4),
      bbWidth: features.bbWidth.toFixed(4),
      volumeDeltaNorm: features.volumeDeltaNorm.toFixed(4),
      spikeScoreNorm: features.spikeScoreNorm.toFixed(4),
      volatilityNorm: features.volatilityNorm.toFixed(4),
      distanceToSupport: features.distanceToSupport.toFixed(4),
      distanceToResistance: features.distanceToResistance.toFixed(4),
      priceChangePercent: priceChangePercent.toFixed(4),
      isWin
    });
    console.log(`[ML] Extracted features for prediction ${predictionId} horizon ${horizon}`);
  }
  normalizeIndicators(indicators, price) {
    const rsi = this.safeNumber(indicators.rsi, 50);
    const macdHistogram = this.safeNumber(indicators.macd?.histogram, 0);
    const macdValue = this.safeNumber(indicators.macd?.value, 0);
    const macdSignalLine = this.safeNumber(indicators.macd?.signal, 0);
    const ema9 = this.safeNumber(indicators.ema9, price);
    const ema21 = this.safeNumber(indicators.ema21, price);
    const ema50 = this.safeNumber(indicators.ema50, price);
    const ema200 = this.safeNumber(indicators.ema200, price);
    const bbUpper = this.safeNumber(indicators.bollingerBands?.upper, price * 1.02);
    const bbLower = this.safeNumber(indicators.bollingerBands?.lower, price * 0.98);
    const bbMiddle = this.safeNumber(indicators.bollingerBands?.middle, price);
    const volumeDeltaValue = typeof indicators.volumeDelta === "object" ? this.safeNumber(indicators.volumeDelta?.delta, 0) : this.safeNumber(indicators.volumeDelta, 0);
    const spikeScoreValue = typeof indicators.spikeScore === "object" ? this.safeNumber(indicators.spikeScore?.score, 0) : this.safeNumber(indicators.spikeScore, 0);
    const volatility = this.safeNumber(indicators.volatility, 0);
    const support = this.safeNumber(indicators.support, price * 0.95);
    const resistance = this.safeNumber(indicators.resistance, price * 1.05);
    const bbRange = bbUpper - bbLower;
    const bbPositionRaw = bbRange > 0 ? (price - bbMiddle) / (bbRange / 2) : 0;
    return {
      rsiNormalized: this.safeNumber(rsi / 100, 0.5),
      macdSignal: macdHistogram > 0 ? 1 : macdHistogram < 0 ? -1 : 0,
      macdStrength: price > 0 ? Math.min(Math.abs(macdValue - macdSignalLine) / price * 100, 1) : 0,
      ema9Spread: this.clamp((price - ema9) / (price || 1) * 100, -10, 10) / 10,
      ema21Spread: this.clamp((price - ema21) / (price || 1) * 100, -10, 10) / 10,
      ema50Spread: this.clamp((price - ema50) / (price || 1) * 100, -20, 20) / 20,
      ema200Spread: this.clamp((price - ema200) / (price || 1) * 100, -50, 50) / 50,
      ema9Over21: ema9 > ema21 ? 1 : 0,
      ema50Over200: ema50 > ema200 ? 1 : 0,
      bbPosition: this.clamp(bbPositionRaw, -1, 1),
      bbWidth: bbMiddle > 0 ? Math.min(bbRange / bbMiddle, 0.2) / 0.2 : 0,
      volumeDeltaNorm: this.clamp(volumeDeltaValue / 100, -1, 1),
      spikeScoreNorm: Math.min(Math.max(spikeScoreValue / 100, 0), 1),
      volatilityNorm: Math.min(Math.max(volatility / 10, 0), 1),
      distanceToSupport: this.clamp((price - support) / (price || 1) * 100, 0, 20) / 20,
      distanceToResistance: this.clamp((resistance - price) / (price || 1) * 100, 0, 20) / 20
    };
  }
  safeNumber(value, defaultValue) {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  async getTrainingData(horizon) {
    const features = await db.select().from(predictionFeatures).where(and(
      eq(predictionFeatures.horizon, horizon),
      isNotNull(predictionFeatures.isWin)
    ));
    const featureVectors = [];
    const labels = [];
    for (const f of features) {
      const vector = [
        parseFloat(f.rsiNormalized || "0.5"),
        parseFloat(f.macdSignal || "0"),
        parseFloat(f.macdStrength || "0"),
        parseFloat(f.ema9Spread || "0"),
        parseFloat(f.ema21Spread || "0"),
        parseFloat(f.ema50Spread || "0"),
        parseFloat(f.ema200Spread || "0"),
        f.ema9Over21 ? 1 : 0,
        f.ema50Over200 ? 1 : 0,
        parseFloat(f.bbPosition || "0"),
        parseFloat(f.bbWidth || "0"),
        parseFloat(f.volumeDeltaNorm || "0"),
        parseFloat(f.spikeScoreNorm || "0"),
        parseFloat(f.volatilityNorm || "0"),
        parseFloat(f.distanceToSupport || "0"),
        parseFloat(f.distanceToResistance || "0")
      ];
      featureVectors.push(vector);
      labels.push(f.isWin ? 1 : 0);
    }
    return { features: featureVectors, labels, featureNames: FEATURE_NAMES };
  }
  async trainModel(horizon) {
    console.log(`[ML] Starting model training for horizon ${horizon}`);
    const data = await this.getTrainingData(horizon);
    if (data.features.length < MIN_TRAINING_SAMPLES) {
      return {
        success: false,
        error: `Insufficient data: ${data.features.length}/${MIN_TRAINING_SAMPLES} samples`
      };
    }
    const splitIndex = Math.floor(data.features.length * 0.8);
    const indices = this.shuffleArray([...Array(data.features.length).keys()]);
    const trainIndices = indices.slice(0, splitIndex);
    const valIndices = indices.slice(splitIndex);
    const trainX = trainIndices.map((i) => data.features[i]);
    const trainY = trainIndices.map((i) => data.labels[i]);
    const valX = valIndices.map((i) => data.features[i]);
    const valY = valIndices.map((i) => data.labels[i]);
    const coefficients = this.trainLogisticRegression(trainX, trainY, 0.01, 1e3);
    const metrics = this.evaluateModel(coefficients, valX, valY);
    const existingModels = await db.select().from(predictionModelVersions).where(eq(predictionModelVersions.horizon, horizon)).orderBy(desc(predictionModelVersions.version)).limit(1);
    const newVersion = existingModels.length > 0 ? existingModels[0].version + 1 : 1;
    const modelId = `model_${horizon}_v${newVersion}_${randomBytes(4).toString("hex")}`;
    await db.insert(predictionModelVersions).values({
      id: modelId,
      modelName: "logistic_v1",
      horizon,
      version: newVersion,
      coefficients: JSON.stringify(coefficients),
      featureNames: JSON.stringify(FEATURE_NAMES),
      trainingSamples: trainX.length,
      validationSamples: valX.length,
      trainingDateRange: JSON.stringify({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString(),
        end: (/* @__PURE__ */ new Date()).toISOString()
      }),
      accuracy: metrics.accuracy.toFixed(4),
      precision: metrics.precision.toFixed(4),
      recall: metrics.recall.toFixed(4),
      f1Score: metrics.f1Score.toFixed(4),
      auroc: metrics.auroc.toFixed(4),
      status: "validated",
      isActive: false
    });
    console.log(`[ML] Model ${modelId} trained - Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
    if (metrics.accuracy >= 0.55) {
      await this.activateModel(modelId, horizon);
    }
    return { success: true, modelId, metrics };
  }
  trainLogisticRegression(X, y, learningRate, iterations) {
    const numFeatures = X[0].length;
    let weights = new Array(numFeatures).fill(0);
    let intercept = 0;
    for (let iter = 0; iter < iterations; iter++) {
      let interceptGrad = 0;
      const weightGrads = new Array(numFeatures).fill(0);
      for (let i = 0; i < X.length; i++) {
        const z = intercept + X[i].reduce((sum, x, j) => sum + x * weights[j], 0);
        const pred = this.sigmoid(z);
        const error = pred - y[i];
        interceptGrad += error;
        for (let j = 0; j < numFeatures; j++) {
          weightGrads[j] += error * X[i][j];
        }
      }
      intercept -= learningRate * (interceptGrad / X.length);
      for (let j = 0; j < numFeatures; j++) {
        weights[j] -= learningRate * (weightGrads[j] / X.length);
      }
    }
    const weightObj = {};
    FEATURE_NAMES.forEach((name, i) => {
      weightObj[name] = weights[i];
    });
    return { intercept, weights: weightObj };
  }
  sigmoid(z) {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
  }
  evaluateModel(coefficients, X, y) {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    const predictions = [];
    for (let i = 0; i < X.length; i++) {
      const prob = this.predictProbability(coefficients, X[i]);
      predictions.push(prob);
      const pred = prob >= 0.5 ? 1 : 0;
      if (pred === 1 && y[i] === 1) tp++;
      else if (pred === 1 && y[i] === 0) fp++;
      else if (pred === 0 && y[i] === 0) tn++;
      else fn++;
    }
    const accuracy = (tp + tn) / (tp + tn + fp + fn);
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    const auroc = this.calculateAUROC(predictions, y);
    return { accuracy, precision, recall, f1Score, auroc };
  }
  calculateAUROC(predictions, labels) {
    const pairs = predictions.map((p, i) => ({ pred: p, label: labels[i] }));
    pairs.sort((a, b) => b.pred - a.pred);
    let auc = 0;
    let tp = 0;
    let fp = 0;
    const totalPos = labels.filter((l) => l === 1).length;
    const totalNeg = labels.length - totalPos;
    if (totalPos === 0 || totalNeg === 0) return 0.5;
    for (const pair of pairs) {
      if (pair.label === 1) {
        tp++;
      } else {
        auc += tp;
        fp++;
      }
    }
    return auc / (totalPos * totalNeg);
  }
  predictProbability(coefficients, features) {
    let z = coefficients.intercept;
    FEATURE_NAMES.forEach((name, i) => {
      z += features[i] * (coefficients.weights[name] || 0);
    });
    return this.sigmoid(z);
  }
  async activateModel(modelId, horizon) {
    await db.update(predictionModelVersions).set({ isActive: false }).where(and(
      eq(predictionModelVersions.horizon, horizon),
      eq(predictionModelVersions.isActive, true)
    ));
    await db.update(predictionModelVersions).set({ isActive: true, status: "active", activatedAt: /* @__PURE__ */ new Date() }).where(eq(predictionModelVersions.id, modelId));
    this.modelCache.delete(horizon);
    console.log(`[ML] Activated model ${modelId} for horizon ${horizon}`);
  }
  async getActiveModel(horizon) {
    if (this.modelCache.has(horizon)) {
      return this.modelCache.get(horizon);
    }
    const model = await db.select().from(predictionModelVersions).where(and(
      eq(predictionModelVersions.horizon, horizon),
      eq(predictionModelVersions.isActive, true)
    )).limit(1);
    if (!model.length) return null;
    const cached = {
      coefficients: JSON.parse(model[0].coefficients),
      version: model[0].id
    };
    this.modelCache.set(horizon, cached);
    return cached;
  }
  async predictWithModel(indicators, price, horizon = "24h") {
    const model = await this.getActiveModel(horizon);
    if (!model) {
      return {
        probability: 0.5,
        confidence: "LOW",
        signal: "HOLD",
        modelVersion: "none",
        isModelBased: false
      };
    }
    const features = this.normalizeIndicators(indicators, price);
    const featureVector = FEATURE_NAMES.map((name) => features[name]);
    const probability = this.predictProbability(model.coefficients, featureVector);
    let signal;
    let confidence;
    if (probability >= 0.7) {
      signal = "BUY";
      confidence = "HIGH";
    } else if (probability >= 0.6) {
      signal = "BUY";
      confidence = "MEDIUM";
    } else if (probability <= 0.3) {
      signal = "SELL";
      confidence = "HIGH";
    } else if (probability <= 0.4) {
      signal = "SELL";
      confidence = "MEDIUM";
    } else {
      signal = "HOLD";
      confidence = probability >= 0.45 && probability <= 0.55 ? "MEDIUM" : "LOW";
    }
    return {
      probability,
      confidence,
      signal,
      modelVersion: model.version,
      isModelBased: true
    };
  }
  async getModelStatus() {
    const horizons = ["1h", "4h", "24h", "7d"];
    const result = { horizons: {}, totalFeatures: 0, readyToTrain: {} };
    for (const horizon of horizons) {
      const model = await db.select().from(predictionModelVersions).where(and(
        eq(predictionModelVersions.horizon, horizon),
        eq(predictionModelVersions.isActive, true)
      )).limit(1);
      const featureCount = await db.select({ count: sql`count(*)` }).from(predictionFeatures).where(and(
        eq(predictionFeatures.horizon, horizon),
        isNotNull(predictionFeatures.isWin)
      ));
      const count = Number(featureCount[0]?.count || 0);
      result.totalFeatures += count;
      result.readyToTrain[horizon] = count >= MIN_TRAINING_SAMPLES;
      if (model.length) {
        result.horizons[horizon] = {
          hasActiveModel: true,
          modelVersion: model[0].id,
          accuracy: parseFloat(model[0].accuracy),
          trainingSamples: model[0].trainingSamples,
          trainedAt: model[0].trainedAt?.toISOString()
        };
      } else {
        result.horizons[horizon] = {
          hasActiveModel: false
        };
      }
    }
    return result;
  }
  async trainAllHorizons() {
    const horizons = ["1h", "4h", "24h", "7d"];
    const results = {};
    for (const horizon of horizons) {
      const result = await this.trainModel(horizon);
      results[horizon] = {
        success: result.success,
        error: result.error,
        accuracy: result.metrics?.accuracy
      };
    }
    return results;
  }
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  async detectDrift(horizon, windowDays = 7) {
    const now = /* @__PURE__ */ new Date();
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1e3);
    const historicalStart = new Date(windowStart.getTime() - windowDays * 24 * 60 * 60 * 1e3);
    const recentFeatures = await db.select().from(predictionFeatures).where(and(
      eq(predictionFeatures.horizon, horizon),
      isNotNull(predictionFeatures.isWin),
      gte(predictionFeatures.createdAt, windowStart)
    ));
    const historicalFeatures = await db.select().from(predictionFeatures).where(and(
      eq(predictionFeatures.horizon, horizon),
      isNotNull(predictionFeatures.isWin),
      gte(predictionFeatures.createdAt, historicalStart),
      lte(predictionFeatures.createdAt, windowStart)
    ));
    const recentWins = recentFeatures.filter((f) => f.isWin).length;
    const recentTotal = recentFeatures.length;
    const historicalWins = historicalFeatures.filter((f) => f.isWin).length;
    const historicalTotal = historicalFeatures.length;
    const recentAccuracy = recentTotal > 0 ? recentWins / recentTotal * 100 : 50;
    const historicalAccuracy = historicalTotal > 0 ? historicalWins / historicalTotal * 100 : 50;
    const accuracyDrop = historicalAccuracy - recentAccuracy;
    let severity = "LOW";
    let hasDrift = false;
    let recommendation = "Model performing within expected parameters";
    if (accuracyDrop > 5 && recentTotal >= 10) {
      hasDrift = true;
      if (accuracyDrop > 20) {
        severity = "CRITICAL";
        recommendation = "Immediate retraining required - significant performance degradation detected";
      } else if (accuracyDrop > 15) {
        severity = "HIGH";
        recommendation = "Schedule retraining soon - notable performance decline";
      } else if (accuracyDrop > 10) {
        severity = "MEDIUM";
        recommendation = "Monitor closely - moderate performance decline observed";
      } else {
        severity = "LOW";
        recommendation = "Minor drift detected - continue monitoring";
      }
    }
    if (recentAccuracy < 45 && recentTotal >= 10) {
      hasDrift = true;
      severity = severity === "CRITICAL" ? "CRITICAL" : "HIGH";
      recommendation = "Model accuracy below threshold - retraining recommended";
    }
    return {
      hasDrift,
      severity,
      metrics: {
        recentAccuracy: Math.round(recentAccuracy * 10) / 10,
        historicalAccuracy: Math.round(historicalAccuracy * 10) / 10,
        accuracyDrop: Math.round(accuracyDrop * 10) / 10,
        recentSamples: recentTotal,
        historicalSamples: historicalTotal
      },
      recommendation
    };
  }
  async checkAllHorizonsDrift(windowDays = 7) {
    const horizons = ["1h", "4h", "24h", "7d"];
    const results = { hasAnyDrift: false, horizonStatus: {}, overallRecommendation: "" };
    let highestSeverity = "LOW";
    for (const horizon of horizons) {
      const drift = await this.detectDrift(horizon, windowDays);
      results.horizonStatus[horizon] = {
        hasDrift: drift.hasDrift,
        severity: drift.severity,
        recentAccuracy: drift.metrics.recentAccuracy,
        recommendation: drift.recommendation
      };
      if (drift.hasDrift) {
        results.hasAnyDrift = true;
        if (drift.severity === "CRITICAL" || drift.severity === "HIGH" && highestSeverity !== "CRITICAL") {
          highestSeverity = drift.severity;
        }
      }
    }
    if (highestSeverity === "CRITICAL") {
      results.overallRecommendation = "Immediate action needed: Critical drift detected in one or more models";
    } else if (highestSeverity === "HIGH") {
      results.overallRecommendation = "Schedule retraining: High drift detected";
    } else if (results.hasAnyDrift) {
      results.overallRecommendation = "Monitor: Minor drift detected in some models";
    } else {
      results.overallRecommendation = "All models performing within expected parameters";
    }
    return results;
  }
}
const predictionLearningService = new PredictionLearningService();

"use strict";
const technicalAnalysisTool = createTool({
  id: "technical-analysis-tool",
  description: "Performs comprehensive technical analysis on price data. Calculates RSI, MACD, moving averages, Bollinger Bands, support/resistance levels, and generates buy/sell signals.",
  inputSchema: z.object({
    ticker: z.string().describe("Ticker symbol"),
    currentPrice: z.number().describe("Current market price"),
    priceChange24h: z.number().describe("24h price change in dollars"),
    priceChangePercent24h: z.number().describe("24h price change percentage"),
    volume24h: z.number().optional().describe("24h trading volume"),
    prices: z.array(z.object({
      timestamp: z.number(),
      open: z.number(),
      high: z.number(),
      low: z.number(),
      close: z.number(),
      volume: z.number()
    })).describe("Historical OHLCV data")
  }),
  outputSchema: z.object({
    ticker: z.string(),
    currentPrice: z.number(),
    priceChange24h: z.number(),
    priceChangePercent24h: z.number(),
    rsi: z.number(),
    macd: z.object({
      value: z.number(),
      signal: z.number(),
      histogram: z.number()
    }),
    ema9: z.number(),
    ema21: z.number(),
    ema50: z.number(),
    ema200: z.number(),
    sma50: z.number(),
    sma200: z.number(),
    bollingerBands: z.object({
      upper: z.number(),
      middle: z.number(),
      lower: z.number(),
      bandwidth: z.number()
    }),
    support: z.number(),
    resistance: z.number(),
    volume: z.object({
      current: z.number(),
      average: z.number(),
      changePercent: z.number()
    }),
    volumeDelta: z.object({
      buyVolume: z.number(),
      sellVolume: z.number(),
      delta: z.number(),
      buySellRatio: z.number()
    }),
    spikeScore: z.object({
      score: z.number(),
      signal: z.enum(["SPIKE_SIGNAL", "WATCHLIST", "NO_SIGNAL"]),
      prediction: z.string()
    }),
    volatility: z.number(),
    patternDuration: z.object({
      estimate: z.string(),
      confidence: z.string(),
      type: z.string()
    }),
    signals: z.array(z.string()),
    recommendation: z.enum(["BUY", "SELL", "HOLD", "STRONG_BUY", "STRONG_SELL"]),
    signalCount: z.object({
      bullish: z.number(),
      bearish: z.number()
    })
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    const logger = mastra?.getLogger();
    logger?.info("\u{1F527} [TechnicalAnalysisTool] Starting analysis", { ticker: context.ticker });
    const userId = runtimeContext?.resourceId || "unknown";
    const limitCheck = await checkSubscriptionLimit(userId, "search");
    logger?.info("\u{1F510} [TechnicalAnalysisTool] Subscription check result", { userId, allowed: limitCheck.allowed, isPremium: limitCheck.isPremium });
    if (!limitCheck.allowed) {
      logger?.warn("\u26A0\uFE0F [TechnicalAnalysisTool] Usage limit exceeded", { userId, message: limitCheck.message });
      throw new Error(limitCheck.message || "Daily search limit reached. Upgrade to Premium for unlimited access!");
    }
    const closePrices = context.prices.map((p) => p.close);
    const highPrices = context.prices.map((p) => p.high);
    const lowPrices = context.prices.map((p) => p.low);
    const volumes = context.prices.map((p) => p.volume);
    logger?.info("\u{1F4CA} [TechnicalAnalysisTool] Calculating indicators", { dataPoints: closePrices.length });
    const rsiValues = RSI.calculate({ values: closePrices, period: 14 });
    const currentRSI = rsiValues[rsiValues.length - 1] || 50;
    const macdValues = MACD.calculate({
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    const currentMACD = macdValues[macdValues.length - 1] || { MACD: 0, signal: 0, histogram: 0 };
    const ema9Values = EMA.calculate({ values: closePrices, period: 9 });
    const ema21Values = EMA.calculate({ values: closePrices, period: 21 });
    const ema50Values = EMA.calculate({ values: closePrices, period: 50 });
    const ema200Values = EMA.calculate({ values: closePrices, period: 200 });
    const currentEMA9 = ema9Values[ema9Values.length - 1] || context.currentPrice;
    const currentEMA21 = ema21Values[ema21Values.length - 1] || context.currentPrice;
    const currentEMA50 = ema50Values[ema50Values.length - 1] || context.currentPrice;
    const currentEMA200 = ema200Values[ema200Values.length - 1] || context.currentPrice;
    const sma50Values = SMA.calculate({ values: closePrices, period: 50 });
    const sma200Values = SMA.calculate({ values: closePrices, period: 200 });
    const currentSMA50 = sma50Values[sma50Values.length - 1] || context.currentPrice;
    const currentSMA200 = sma200Values[sma200Values.length - 1] || context.currentPrice;
    const bbValues = BollingerBands.calculate({
      values: closePrices,
      period: 20,
      stdDev: 2
    });
    const currentBB = bbValues[bbValues.length - 1] || { upper: 0, middle: 0, lower: 0 };
    const bandwidth = (currentBB.upper - currentBB.lower) / currentBB.middle * 100;
    const recentPrices = context.prices.slice(-30);
    const support = calculateDynamicSupport(recentPrices, context.currentPrice);
    const resistance = calculateDynamicResistance(recentPrices, context.currentPrice);
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = context.volume24h || volumes[volumes.length - 1] || 0;
    const volumeChangePercent = (currentVolume - avgVolume) / avgVolume * 100;
    const volatility = calculateVolatility(closePrices.slice(-30));
    const volumeDelta = calculateVolumeDelta(
      context.prices.slice(-20),
      currentVolume,
      context.priceChangePercent24h
    );
    const spikeScore = calculateSpikeScore({
      volumeDelta: volumeDelta.delta,
      rsi: currentRSI,
      momentum: context.priceChangePercent24h,
      volumeChange: volumeChangePercent,
      trendStrength: Math.abs(currentEMA50 - currentEMA200) / context.currentPrice * 100
    });
    const patternDuration = estimatePatternDuration(
      context.prices,
      currentRSI,
      currentMACD,
      volumeChangePercent,
      context.currentPrice,
      currentEMA50,
      currentEMA200
    );
    logger?.info("\u{1F4DD} [TechnicalAnalysisTool] Generating signals");
    const signals = [];
    let bullishCount = 0;
    let bearishCount = 0;
    if (currentRSI < 30) {
      signals.push("RSI oversold (bullish)");
      bullishCount++;
    } else if (currentRSI > 70) {
      signals.push("RSI overbought (bearish)");
      bearishCount++;
    }
    if (currentMACD.histogram && currentMACD.MACD && currentMACD.signal) {
      if (currentMACD.histogram > 0 && currentMACD.MACD > currentMACD.signal) {
        signals.push("MACD bullish crossover");
        bullishCount++;
      } else if (currentMACD.histogram < 0 && currentMACD.MACD < currentMACD.signal) {
        signals.push("MACD bearish crossover");
        bearishCount++;
      }
    }
    if (context.currentPrice > currentEMA50 && currentEMA50 > currentEMA200) {
      signals.push("Golden cross pattern (bullish)");
      bullishCount++;
    } else if (context.currentPrice < currentEMA50 && currentEMA50 < currentEMA200) {
      signals.push("Death cross pattern (bearish)");
      bearishCount++;
    }
    if (context.currentPrice > currentSMA50) {
      bullishCount++;
    } else {
      bearishCount++;
    }
    if (context.currentPrice > currentSMA200) {
      bullishCount++;
    } else {
      bearishCount++;
    }
    if (context.currentPrice < currentBB.lower) {
      signals.push("Price below lower Bollinger Band (bullish)");
      bullishCount++;
    } else if (context.currentPrice > currentBB.upper) {
      signals.push("Price above upper Bollinger Band (bearish)");
      bearishCount++;
    }
    const distanceToSupport = (context.currentPrice - support) / support * 100;
    const distanceToResistance = (resistance - context.currentPrice) / context.currentPrice * 100;
    if (distanceToSupport < 2) {
      signals.push("Near support level (potential bounce)");
      bullishCount++;
    }
    if (distanceToResistance < 2) {
      signals.push("Near resistance level (potential rejection)");
      bearishCount++;
    }
    if (volumeChangePercent > 50 && context.priceChangePercent24h > 0) {
      signals.push("High volume breakout (bullish)");
      bullishCount++;
    } else if (volumeChangePercent > 50 && context.priceChangePercent24h < 0) {
      signals.push("High volume selloff (bearish)");
      bearishCount++;
    }
    let recommendation;
    const netSignal = bullishCount - bearishCount;
    let ruleBasedRec;
    if (netSignal >= 3) {
      ruleBasedRec = "STRONG_BUY";
    } else if (netSignal >= 1) {
      ruleBasedRec = "BUY";
    } else if (netSignal <= -3) {
      ruleBasedRec = "STRONG_SELL";
    } else if (netSignal <= -1) {
      ruleBasedRec = "SELL";
    } else {
      ruleBasedRec = "HOLD";
    }
    let isModelBased = false;
    let modelProbability = 0.5;
    try {
      const indicators = {
        rsi: currentRSI,
        macd: { macdLine: currentMACD.MACD, signalLine: currentMACD.signal, histogram: currentMACD.histogram },
        ema9: currentEMA9,
        ema21: currentEMA21,
        ema50: currentEMA50,
        ema200: currentEMA200,
        bollingerBands: { upper: currentBB.upper, middle: currentBB.middle, lower: currentBB.lower },
        support,
        resistance,
        volumeDelta: volumeDelta.delta,
        spikeScore: spikeScore.score,
        volatility
      };
      const mlPrediction = await predictionLearningService.predictWithModel(indicators, context.currentPrice, "24h");
      if (mlPrediction.isModelBased) {
        isModelBased = true;
        modelProbability = mlPrediction.probability;
        const mlSignal = mlPrediction.signal;
        const mlConfidence = mlPrediction.confidence;
        if (mlConfidence === "HIGH") {
          if (mlSignal === "BUY" && (ruleBasedRec === "BUY" || ruleBasedRec === "STRONG_BUY")) {
            recommendation = modelProbability >= 0.75 ? "STRONG_BUY" : "BUY";
            signals.push(`ML model: ${(modelProbability * 100).toFixed(0)}% bullish probability (HIGH confidence)`);
          } else if (mlSignal === "SELL" && (ruleBasedRec === "SELL" || ruleBasedRec === "STRONG_SELL")) {
            recommendation = modelProbability <= 0.25 ? "STRONG_SELL" : "SELL";
            signals.push(`ML model: ${((1 - modelProbability) * 100).toFixed(0)}% bearish probability (HIGH confidence)`);
          } else if (mlSignal !== ruleBasedRec && mlConfidence === "HIGH") {
            recommendation = mlSignal;
            signals.push(`ML model override: ${mlSignal} (${(mlPrediction.probability * 100).toFixed(0)}% probability)`);
          } else {
            recommendation = ruleBasedRec;
          }
        } else if (mlConfidence === "MEDIUM") {
          if (mlSignal === ruleBasedRec || mlSignal === "BUY" && ruleBasedRec === "STRONG_BUY" || mlSignal === "SELL" && ruleBasedRec === "STRONG_SELL") {
            recommendation = ruleBasedRec;
            signals.push(`ML model confirms: ${(modelProbability * 100).toFixed(0)}% probability`);
          } else {
            recommendation = "HOLD";
            signals.push(`ML model uncertain: ${(modelProbability * 100).toFixed(0)}% probability vs rule-based ${ruleBasedRec}`);
          }
        } else {
          recommendation = ruleBasedRec;
        }
        logger?.info("\u{1F9E0} [TechnicalAnalysisTool] ML prediction used", {
          mlSignal,
          mlConfidence,
          probability: modelProbability,
          ruleBasedRec,
          finalRec: recommendation
        });
      } else {
        recommendation = ruleBasedRec;
      }
    } catch (mlError) {
      logger?.warn("\u26A0\uFE0F [TechnicalAnalysisTool] ML prediction failed, using rule-based", { error: mlError });
      recommendation = ruleBasedRec;
    }
    logger?.info("\u2705 [TechnicalAnalysisTool] Analysis complete", {
      ticker: context.ticker,
      recommendation,
      isModelBased,
      signals: signals.length
    });
    return {
      ticker: context.ticker,
      currentPrice: context.currentPrice,
      priceChange24h: context.priceChange24h,
      priceChangePercent24h: context.priceChangePercent24h,
      rsi: parseFloat(currentRSI.toFixed(1)),
      macd: {
        value: parseFloat((currentMACD.MACD || 0).toFixed(2)),
        signal: parseFloat((currentMACD.signal || 0).toFixed(2)),
        histogram: parseFloat((currentMACD.histogram || 0).toFixed(2))
      },
      ema9: parseFloat(currentEMA9.toFixed(2)),
      ema21: parseFloat(currentEMA21.toFixed(2)),
      ema50: parseFloat(currentEMA50.toFixed(2)),
      ema200: parseFloat(currentEMA200.toFixed(2)),
      sma50: parseFloat(currentSMA50.toFixed(2)),
      sma200: parseFloat(currentSMA200.toFixed(2)),
      bollingerBands: {
        upper: parseFloat(currentBB.upper.toFixed(2)),
        middle: parseFloat(currentBB.middle.toFixed(2)),
        lower: parseFloat(currentBB.lower.toFixed(2)),
        bandwidth: parseFloat(bandwidth.toFixed(2))
      },
      support: parseFloat(support.toFixed(2)),
      resistance: parseFloat(resistance.toFixed(2)),
      volume: {
        current: parseFloat(currentVolume.toFixed(2)),
        average: parseFloat(avgVolume.toFixed(2)),
        changePercent: parseFloat(volumeChangePercent.toFixed(1))
      },
      volumeDelta: {
        buyVolume: parseFloat(volumeDelta.buyVolume.toFixed(2)),
        sellVolume: parseFloat(volumeDelta.sellVolume.toFixed(2)),
        delta: parseFloat(volumeDelta.delta.toFixed(2)),
        buySellRatio: parseFloat(volumeDelta.buySellRatio.toFixed(2))
      },
      spikeScore: {
        score: parseFloat(spikeScore.score.toFixed(1)),
        signal: spikeScore.signal,
        prediction: spikeScore.prediction
      },
      volatility: parseFloat(volatility.toFixed(1)),
      patternDuration,
      signals,
      recommendation,
      signalCount: {
        bullish: bullishCount,
        bearish: bearishCount
      }
    };
  }
});
function calculateDynamicSupport(recentPrices, currentPrice) {
  const lows = recentPrices.map((p) => p.low);
  const sortedLows = [...lows].sort((a, b) => a - b);
  const belowCurrent = sortedLows.filter((low) => low < currentPrice);
  if (belowCurrent.length === 0) return sortedLows[0];
  return belowCurrent[belowCurrent.length - 1];
}
function calculateDynamicResistance(recentPrices, currentPrice) {
  const highs = recentPrices.map((p) => p.high);
  const sortedHighs = [...highs].sort((a, b) => b - a);
  const aboveCurrent = sortedHighs.filter((high) => high > currentPrice);
  if (aboveCurrent.length === 0) return sortedHighs[0];
  return aboveCurrent[aboveCurrent.length - 1];
}
function calculateVolatility(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return stdDev * 100;
}
function estimatePatternDuration(prices, currentRSI, currentMACD, volumeChange, currentPrice, ema50, ema200) {
  const closePrices = prices.map((p) => p.close);
  let patternType = "consolidation";
  let estimatedDays = 0;
  let confidence = "low";
  if (currentRSI < 30) {
    const oversoldDurations = analyzeOversoldRecoveries(closePrices, prices);
    estimatedDays = oversoldDurations.avgDuration;
    confidence = oversoldDurations.confidence;
    patternType = "potential rally from oversold";
  } else if (currentRSI > 70) {
    const overboughtDurations = analyzeOverboughtCorrections(closePrices, prices);
    estimatedDays = overboughtDurations.avgDuration;
    confidence = overboughtDurations.confidence;
    patternType = "potential correction from overbought";
  } else if (currentMACD.histogram && Math.abs(currentMACD.histogram) > 0) {
    const macdDurations = analyzeMACDMomentum(closePrices, prices);
    estimatedDays = macdDurations.avgDuration;
    confidence = macdDurations.confidence;
    if (currentMACD.histogram > 0) {
      patternType = "bullish momentum continuation";
    } else {
      patternType = "bearish momentum continuation";
    }
  } else if (currentPrice > ema50 && ema50 > ema200) {
    const trendDurations = analyzeUptrends(closePrices, prices);
    estimatedDays = trendDurations.avgDuration;
    confidence = trendDurations.confidence;
    patternType = "uptrend continuation";
  } else if (currentPrice < ema50 && ema50 < ema200) {
    const trendDurations = analyzeDowntrends(closePrices, prices);
    estimatedDays = trendDurations.avgDuration;
    confidence = trendDurations.confidence;
    patternType = "downtrend continuation";
  } else if (volumeChange > 50) {
    estimatedDays = 5;
    confidence = "medium";
    patternType = "volume breakout pattern";
  } else {
    estimatedDays = 7;
    confidence = "low";
    patternType = "consolidation/range-bound";
  }
  let estimate = "";
  if (estimatedDays < 2) {
    estimate = "1-2 days";
  } else if (estimatedDays < 7) {
    estimate = `${Math.floor(estimatedDays)}-${Math.ceil(estimatedDays + 2)} days`;
  } else if (estimatedDays < 14) {
    estimate = "1-2 weeks";
  } else if (estimatedDays < 30) {
    estimate = "2-4 weeks";
  } else {
    estimate = "1-2 months";
  }
  return {
    estimate,
    confidence,
    type: patternType
  };
}
function analyzeOversoldRecoveries(closePrices, prices) {
  const rsiValues = RSI.calculate({ values: closePrices, period: 14 });
  const recoveries = [];
  let inOversold = false;
  let oversoldStart = 0;
  for (let i = 0; i < rsiValues.length; i++) {
    if (rsiValues[i] < 30 && !inOversold) {
      inOversold = true;
      oversoldStart = i;
    } else if (rsiValues[i] >= 50 && inOversold) {
      const duration = i - oversoldStart;
      if (duration > 0 && duration < 60) {
        recoveries.push(duration);
      }
      inOversold = false;
    }
  }
  if (recoveries.length >= 3) {
    const avg = recoveries.reduce((a, b) => a + b, 0) / recoveries.length;
    return { avgDuration: Math.round(avg), confidence: "high" };
  } else if (recoveries.length > 0) {
    const avg = recoveries.reduce((a, b) => a + b, 0) / recoveries.length;
    return { avgDuration: Math.round(avg), confidence: "medium" };
  }
  return { avgDuration: 5, confidence: "low" };
}
function analyzeOverboughtCorrections(closePrices, prices) {
  const rsiValues = RSI.calculate({ values: closePrices, period: 14 });
  const corrections = [];
  let inOverbought = false;
  let overboughtStart = 0;
  for (let i = 0; i < rsiValues.length; i++) {
    if (rsiValues[i] > 70 && !inOverbought) {
      inOverbought = true;
      overboughtStart = i;
    } else if (rsiValues[i] <= 50 && inOverbought) {
      const duration = i - overboughtStart;
      if (duration > 0 && duration < 60) {
        corrections.push(duration);
      }
      inOverbought = false;
    }
  }
  if (corrections.length >= 3) {
    const avg = corrections.reduce((a, b) => a + b, 0) / corrections.length;
    return { avgDuration: Math.round(avg), confidence: "high" };
  } else if (corrections.length > 0) {
    const avg = corrections.reduce((a, b) => a + b, 0) / corrections.length;
    return { avgDuration: Math.round(avg), confidence: "medium" };
  }
  return { avgDuration: 7, confidence: "low" };
}
function analyzeMACDMomentum(closePrices, prices) {
  const macdValues = MACD.calculate({
    values: closePrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const momentumPeriods = [];
  let currentSign = 0;
  let periodStart = 0;
  for (let i = 0; i < macdValues.length; i++) {
    const hist = macdValues[i].histogram || 0;
    const sign = hist > 0 ? 1 : hist < 0 ? -1 : 0;
    if (sign !== currentSign && currentSign !== 0) {
      const duration = i - periodStart;
      if (duration > 0 && duration < 60) {
        momentumPeriods.push(duration);
      }
      periodStart = i;
    }
    currentSign = sign;
  }
  if (momentumPeriods.length >= 3) {
    const avg = momentumPeriods.reduce((a, b) => a + b, 0) / momentumPeriods.length;
    return { avgDuration: Math.round(avg), confidence: "high" };
  } else if (momentumPeriods.length > 0) {
    const avg = momentumPeriods.reduce((a, b) => a + b, 0) / momentumPeriods.length;
    return { avgDuration: Math.round(avg), confidence: "medium" };
  }
  return { avgDuration: 8, confidence: "low" };
}
function analyzeUptrends(closePrices, prices) {
  const ema50 = EMA.calculate({ values: closePrices, period: 50 });
  const trends = [];
  let inUptrend = false;
  let trendStart = 0;
  for (let i = 50; i < closePrices.length; i++) {
    const idx = i - 50;
    if (idx >= ema50.length) continue;
    const priceAboveEMA = closePrices[i] > ema50[idx];
    if (priceAboveEMA && !inUptrend) {
      inUptrend = true;
      trendStart = i;
    } else if (!priceAboveEMA && inUptrend) {
      const duration = i - trendStart;
      if (duration > 0 && duration < 90) {
        trends.push(duration);
      }
      inUptrend = false;
    }
  }
  if (trends.length >= 2) {
    const avg = trends.reduce((a, b) => a + b, 0) / trends.length;
    return { avgDuration: Math.round(avg), confidence: "medium" };
  }
  return { avgDuration: 14, confidence: "low" };
}
function analyzeDowntrends(closePrices, prices) {
  const ema50 = EMA.calculate({ values: closePrices, period: 50 });
  const trends = [];
  let inDowntrend = false;
  let trendStart = 0;
  for (let i = 50; i < closePrices.length; i++) {
    const idx = i - 50;
    if (idx >= ema50.length) continue;
    const priceBelowEMA = closePrices[i] < ema50[idx];
    if (priceBelowEMA && !inDowntrend) {
      inDowntrend = true;
      trendStart = i;
    } else if (!priceBelowEMA && inDowntrend) {
      const duration = i - trendStart;
      if (duration > 0 && duration < 90) {
        trends.push(duration);
      }
      inDowntrend = false;
    }
  }
  if (trends.length >= 2) {
    const avg = trends.reduce((a, b) => a + b, 0) / trends.length;
    return { avgDuration: Math.round(avg), confidence: "medium" };
  }
  return { avgDuration: 12, confidence: "low" };
}
function calculateVolumeDelta(recentPrices, currentVolume, priceChangePercent) {
  let buyVolume = 0;
  let sellVolume = 0;
  for (let i = 1; i < recentPrices.length; i++) {
    const priceChange = recentPrices[i].close - recentPrices[i - 1].close;
    const volume = recentPrices[i].volume;
    if (priceChange > 0) {
      const buyRatio = Math.min(0.7 + Math.abs(priceChange) / recentPrices[i].close * 10, 0.95);
      buyVolume += volume * buyRatio;
      sellVolume += volume * (1 - buyRatio);
    } else if (priceChange < 0) {
      const sellRatio = Math.min(0.7 + Math.abs(priceChange) / recentPrices[i].close * 10, 0.95);
      sellVolume += volume * sellRatio;
      buyVolume += volume * (1 - sellRatio);
    } else {
      buyVolume += volume * 0.5;
      sellVolume += volume * 0.5;
    }
  }
  const delta = buyVolume - sellVolume;
  const ratio = buyVolume / (sellVolume + 1e-6);
  return {
    buyVolume,
    sellVolume,
    delta,
    buySellRatio: ratio
  };
}
function calculateSpikeScore(metrics) {
  const weights = {
    volumeDelta: 0.3,
    rsi: 0.2,
    momentum: 0.2,
    volumeChange: 0.15,
    trendStrength: 0.15
  };
  const normalizedVolumeDelta = Math.min(Math.max(metrics.volumeDelta / 1e6 * 50 + 50, 0), 100);
  const normalizedRSI = metrics.rsi;
  const normalizedMomentum = Math.min(Math.max(metrics.momentum * 2 + 50, 0), 100);
  const normalizedVolumeChange = Math.min(Math.max(metrics.volumeChange + 50, 0), 100);
  const normalizedTrendStrength = Math.min(metrics.trendStrength * 10, 100);
  const score = weights.volumeDelta * normalizedVolumeDelta + weights.rsi * normalizedRSI + weights.momentum * normalizedMomentum + weights.volumeChange * normalizedVolumeChange + weights.trendStrength * normalizedTrendStrength;
  let signal;
  let prediction;
  if (score > 75) {
    signal = "SPIKE_SIGNAL";
    prediction = "Strong upward momentum - high probability of price spike";
  } else if (score > 50) {
    signal = "WATCHLIST";
    prediction = "Moderate bullish signals - watch for breakout";
  } else {
    signal = "NO_SIGNAL";
    prediction = "Weak momentum - no clear entry signal";
  }
  return {
    score: Math.min(Math.max(score, 0), 100),
    signal,
    prediction
  };
}

"use strict";
const CRYPTO_NAMES = {
  "BTC": "Bitcoin",
  "ETH": "Ethereum",
  "SOL": "Solana",
  "BNB": "BNB",
  "XRP": "XRP",
  "ADA": "Cardano",
  "DOGE": "Dogecoin",
  "AVAX": "Avalanche",
  "LINK": "Chainlink",
  "MATIC": "Polygon",
  "DOT": "Polkadot",
  "UNI": "Uniswap",
  "ATOM": "Cosmos",
  "LTC": "Litecoin",
  "BCH": "Bitcoin Cash",
  "NEAR": "NEAR Protocol",
  "APT": "Aptos",
  "ARB": "Arbitrum",
  "OP": "Optimism",
  "SUI": "Sui",
  "FIL": "Filecoin",
  "ICP": "Internet Computer",
  "VET": "VeChain",
  "ALGO": "Algorand",
  "SAND": "The Sandbox",
  "MANA": "Decentraland",
  "AXS": "Axie Infinity",
  "FTM": "Fantom",
  "AAVE": "Aave",
  "GRT": "The Graph",
  "SNX": "Synthetix",
  "AR": "Arweave",
  "HBAR": "Hedera",
  "XLM": "Stellar",
  "TRX": "TRON",
  "ETC": "Ethereum Classic",
  "XMR": "Monero",
  "TON": "Toncoin",
  "SHIB": "Shiba Inu",
  "PEPE": "Pepe",
  "WIF": "dogwifhat",
  "BONK": "Bonk",
  "FLOKI": "FLOKI",
  "INJ": "Injective",
  "TIA": "Celestia",
  "SEI": "Sei",
  "RUNE": "THORChain",
  "OSMO": "Osmosis",
  "JUNO": "Juno",
  "CRV": "Curve DAO"
};
const scannerTool = createTool({
  id: "scanner-tool",
  description: "Scans top cryptocurrencies or stocks for spike potential based on historic patterns. Returns assets showing strong buy signals with bullish convergence (volume spikes, RSI recovery, MACD crossovers, resistance breaks). Use when user says 'crypto' or 'stock'.",
  inputSchema: z.object({
    type: z.enum(["crypto", "stock"]).describe("Type of assets to scan - 'crypto' for top 50 cryptocurrencies, 'stock' for top 100 stocks"),
    limit: z.number().optional().default(10).describe("Maximum number of results to return")
  }),
  outputSchema: z.object({
    scannedCount: z.number(),
    strongBuys: z.array(z.object({
      ticker: z.string(),
      name: z.string(),
      type: z.string(),
      currentPrice: z.number(),
      volume24h: z.number(),
      volumeChangePercent: z.number(),
      priceChangePercent24h: z.number(),
      rsi: z.number(),
      recommendation: z.string(),
      patternDuration: z.object({
        estimate: z.string(),
        confidence: z.string(),
        type: z.string()
      }).optional(),
      signalCount: z.object({
        bullish: z.number(),
        bearish: z.number()
      })
    })),
    message: z.string()
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("\u{1F527} [ScannerTool] Starting scan", { type: context.type, limit: context.limit });
    const TOP_50_CRYPTOS = [
      "BTC",
      "ETH",
      "SOL",
      "BNB",
      "XRP",
      "ADA",
      "DOGE",
      "AVAX",
      "LINK",
      "MATIC",
      "DOT",
      "UNI",
      "ATOM",
      "LTC",
      "BCH",
      "NEAR",
      "APT",
      "ARB",
      "OP",
      "SUI",
      "FIL",
      "ICP",
      "VET",
      "ALGO",
      "SAND",
      "MANA",
      "AXS",
      "FTM",
      "AAVE",
      "GRT",
      "SNX",
      "AR",
      "HBAR",
      "XLM",
      "TRX",
      "ETC",
      "XMR",
      "TON",
      "SHIB",
      "PEPE",
      "WIF",
      "BONK",
      "FLOKI",
      "INJ",
      "TIA",
      "SEI",
      "RUNE",
      "OSMO",
      "JUNO",
      "CRV"
    ];
    const TOP_100_STOCKS = [
      "AAPL",
      "MSFT",
      "GOOGL",
      "AMZN",
      "NVDA",
      "META",
      "TSLA",
      "JPM",
      "V",
      "WMT",
      "JNJ",
      "PG",
      "MA",
      "HD",
      "CVX",
      "MRK",
      "ABBV",
      "PEP",
      "KO",
      "COST",
      "AVGO",
      "TMO",
      "ORCL",
      "ACN",
      "MCD",
      "CSCO",
      "NKE",
      "ABT",
      "ADBE",
      "CRM",
      "LIN",
      "NFLX",
      "PFE",
      "DHR",
      "TXN",
      "DIS",
      "UNP",
      "VZ",
      "INTC",
      "AMD",
      "NEE",
      "CMCSA",
      "UNH",
      "RTX",
      "QCOM",
      "PM",
      "BMY",
      "HON",
      "T",
      "AMGN",
      "BA",
      "GE",
      "IBM",
      "CAT",
      "SBUX",
      "LOW",
      "INTU",
      "ISRG",
      "MS",
      "GS",
      "BLK",
      "AXP",
      "DE",
      "SPGI",
      "NOW",
      "GILD",
      "BKNG",
      "MDLZ",
      "LRCX",
      "ADI",
      "MMM",
      "SYK",
      "VRTX",
      "AMT",
      "PLD",
      "TJX",
      "REGN",
      "ZTS",
      "CI",
      "CVS",
      "MO",
      "CB",
      "SO",
      "BDX",
      "DUK",
      "TGT",
      "USB",
      "PNC",
      "EOG",
      "CCI",
      "CL",
      "ITW",
      "BSX",
      "SHW",
      "APD",
      "EL",
      "CME",
      "EQIX",
      "NSC",
      "MCO"
    ];
    let tickersToScan = [];
    if (context.type === "crypto") {
      tickersToScan.push(...TOP_50_CRYPTOS.map((t) => ({ ticker: t, type: "crypto" })));
    } else if (context.type === "stock") {
      tickersToScan.push(...TOP_100_STOCKS.map((t) => ({ ticker: t, type: "stock" })));
    }
    logger?.info("\u{1F4CA} [ScannerTool] Scanning tickers", { count: tickersToScan.length });
    const strongBuys = [];
    let scanned = 0;
    for (const { ticker, type } of tickersToScan) {
      try {
        logger?.info(`\u{1F50D} [ScannerTool] Analyzing ${ticker}`, { type });
        const marketData = await marketDataTool.execute({
          context: { ticker, days: 90, type },
          mastra,
          runtimeContext: void 0
        });
        const analysis = await technicalAnalysisTool.execute({
          context: {
            ticker: marketData.ticker,
            currentPrice: marketData.currentPrice,
            priceChange24h: marketData.priceChange24h,
            priceChangePercent24h: marketData.priceChangePercent24h,
            volume24h: marketData.volume24h,
            prices: marketData.prices
          },
          mastra,
          runtimeContext: void 0
        });
        scanned++;
        if (analysis.recommendation === "BUY" || analysis.recommendation === "STRONG_BUY") {
          strongBuys.push({
            ticker: analysis.ticker,
            name: type === "crypto" ? CRYPTO_NAMES[ticker] || ticker : ticker,
            type,
            currentPrice: analysis.currentPrice,
            volume24h: marketData.volume24h,
            volumeChangePercent: analysis.volume.changePercent,
            priceChangePercent24h: marketData.priceChangePercent24h,
            rsi: analysis.rsi,
            recommendation: analysis.recommendation,
            patternDuration: analysis.patternDuration,
            signalCount: analysis.signalCount
          });
        }
        await new Promise((resolve) => setTimeout(resolve, type === "crypto" ? 1e3 : 200));
      } catch (error) {
        logger?.warn(`\u26A0\uFE0F [ScannerTool] Failed to analyze ${ticker}`, { error: error.message });
      }
    }
    logger?.info("\u2705 [ScannerTool] Scan complete", {
      scanned,
      strongBuysFound: strongBuys.length
    });
    return {
      scannedCount: scanned,
      strongBuys,
      message: strongBuys.length > 0 ? `Found ${strongBuys.length} asset(s) with strong buy signals out of ${scanned} scanned.` : `No strong buy signals found in ${scanned} assets scanned.`
    };
  }
});

export { scannerTool };
