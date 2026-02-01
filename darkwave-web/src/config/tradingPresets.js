export const TRADING_PRESETS = {
  conservative: {
    id: 'conservative',
    name: 'Conservative',
    icon: '🛡️',
    tagline: 'Capital preservation first',
    description: 'Strict safety filters, lower position sizes, tight stop losses. Best for protecting capital while learning.',
    color: '#00D4FF',
    colorRgb: '0, 212, 255',
    tradeConfig: {
      buyAmountSol: 0.1,
      slippagePercent: 3,
      stopLossPercent: 10,
      takeProfitPercent: 20,
    },
    executionConfig: {
      priorityFee: 'low',
      mevProtection: true,
      jitoTipsLamports: 0,
      autoSellOnProfit: true,
      autoSellOnLoss: true,
      retryAttempts: 2,
    },
    trailingStop: {
      enabled: false,
      trailPercent: 5,
    },
    takeProfitLevels: [
      { percent: 20, sellAmount: 100 },
    ],
    safetyFilters: {
      minLiquidityUsd: 25000,
      maxBotPercent: 40,
      minHolders: 150,
      maxTop10HoldersPercent: 50,
      requireLiquidityLock: true,
      blockHoneypots: true,
      maxTokenAgeHours: 168,
    },
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    icon: '⚖️',
    tagline: 'Risk meets reward',
    description: 'Moderate filters, balanced position sizing. Good for consistent performance with manageable risk.',
    color: '#8B5CF6',
    colorRgb: '139, 92, 246',
    tradeConfig: {
      buyAmountSol: 0.25,
      slippagePercent: 5,
      stopLossPercent: 15,
      takeProfitPercent: 40,
    },
    executionConfig: {
      priorityFee: 'medium',
      mevProtection: true,
      jitoTipsLamports: 10000,
      autoSellOnProfit: true,
      autoSellOnLoss: true,
      retryAttempts: 3,
    },
    trailingStop: {
      enabled: true,
      trailPercent: 8,
    },
    takeProfitLevels: [
      { percent: 25, sellAmount: 50 },
      { percent: 50, sellAmount: 50 },
    ],
    safetyFilters: {
      minLiquidityUsd: 15000,
      maxBotPercent: 55,
      minHolders: 100,
      maxTop10HoldersPercent: 65,
      requireLiquidityLock: true,
      blockHoneypots: true,
      maxTokenAgeHours: 72,
    },
  },
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive',
    icon: '🚀',
    tagline: 'High risk, high reward',
    description: 'Looser filters, larger positions. For experienced traders hunting bigger gains.',
    color: '#39FF14',
    colorRgb: '57, 255, 20',
    tradeConfig: {
      buyAmountSol: 0.5,
      slippagePercent: 10,
      stopLossPercent: 25,
      takeProfitPercent: 75,
    },
    executionConfig: {
      priorityFee: 'high',
      mevProtection: true,
      jitoTipsLamports: 50000,
      autoSellOnProfit: true,
      autoSellOnLoss: true,
      retryAttempts: 3,
    },
    trailingStop: {
      enabled: true,
      trailPercent: 12,
    },
    takeProfitLevels: [
      { percent: 30, sellAmount: 30 },
      { percent: 60, sellAmount: 40 },
      { percent: 100, sellAmount: 30 },
    ],
    safetyFilters: {
      minLiquidityUsd: 8000,
      maxBotPercent: 70,
      minHolders: 60,
      maxTop10HoldersPercent: 75,
      requireLiquidityLock: false,
      blockHoneypots: true,
      maxTokenAgeHours: 48,
    },
  },
  ultraDegen: {
    id: 'ultraDegen',
    name: 'Ultra Degen',
    icon: '💀',
    tagline: 'Full send mode',
    description: 'Maximum risk tolerance. Minimal filters for catching early pumps. Only for degens who can handle losses.',
    color: '#FF4444',
    colorRgb: '255, 68, 68',
    tradeConfig: {
      buyAmountSol: 1.0,
      slippagePercent: 20,
      stopLossPercent: 40,
      takeProfitPercent: 150,
    },
    executionConfig: {
      priorityFee: 'turbo',
      mevProtection: false,
      jitoTipsLamports: 100000,
      autoSellOnProfit: true,
      autoSellOnLoss: false,
      retryAttempts: 5,
    },
    trailingStop: {
      enabled: true,
      trailPercent: 20,
    },
    takeProfitLevels: [
      { percent: 50, sellAmount: 25 },
      { percent: 100, sellAmount: 25 },
      { percent: 200, sellAmount: 25 },
      { percent: 500, sellAmount: 25 },
    ],
    safetyFilters: {
      minLiquidityUsd: 3000,
      maxBotPercent: 90,
      minHolders: 25,
      maxTop10HoldersPercent: 90,
      requireLiquidityLock: false,
      blockHoneypots: true,
      maxTokenAgeHours: 24,
    },
  },
  scalper: {
    id: 'scalper',
    name: 'Scalper',
    icon: '⚡',
    tagline: 'Quick in, quick out',
    description: 'Small gains, fast exits. Tight stop losses with quick take profits for rapid-fire trades.',
    color: '#FFB800',
    colorRgb: '255, 184, 0',
    tradeConfig: {
      buyAmountSol: 0.15,
      slippagePercent: 8,
      stopLossPercent: 5,
      takeProfitPercent: 12,
    },
    executionConfig: {
      priorityFee: 'turbo',
      mevProtection: true,
      jitoTipsLamports: 75000,
      autoSellOnProfit: true,
      autoSellOnLoss: true,
      retryAttempts: 2,
    },
    trailingStop: {
      enabled: false,
      trailPercent: 3,
    },
    takeProfitLevels: [
      { percent: 12, sellAmount: 100 },
    ],
    safetyFilters: {
      minLiquidityUsd: 20000,
      maxBotPercent: 60,
      minHolders: 80,
      maxTop10HoldersPercent: 70,
      requireLiquidityLock: true,
      blockHoneypots: true,
      maxTokenAgeHours: 12,
    },
  },
  dca: {
    id: 'dca',
    name: 'DCA Mode',
    icon: '📊',
    tagline: 'Average into positions',
    description: 'Dollar-cost averaging strategy. Splits entry across multiple buys to reduce timing risk.',
    color: '#E91E63',
    colorRgb: '233, 30, 99',
    tradeConfig: {
      buyAmountSol: 0.3,
      slippagePercent: 5,
      stopLossPercent: 20,
      takeProfitPercent: 50,
    },
    executionConfig: {
      priorityFee: 'medium',
      mevProtection: true,
      jitoTipsLamports: 25000,
      autoSellOnProfit: true,
      autoSellOnLoss: true,
      retryAttempts: 3,
      dcaEnabled: true,
      dcaSplits: 3,
      dcaIntervalSeconds: 30,
    },
    trailingStop: {
      enabled: true,
      trailPercent: 10,
    },
    takeProfitLevels: [
      { percent: 25, sellAmount: 33 },
      { percent: 50, sellAmount: 33 },
      { percent: 100, sellAmount: 34 },
    ],
    safetyFilters: {
      minLiquidityUsd: 15000,
      maxBotPercent: 60,
      minHolders: 100,
      maxTop10HoldersPercent: 65,
      requireLiquidityLock: true,
      blockHoneypots: true,
      maxTokenAgeHours: 48,
    },
  },
}

export const PRESET_ORDER = ['conservative', 'balanced', 'aggressive', 'ultraDegen', 'scalper', 'dca']

export const getPresetById = (id) => TRADING_PRESETS[id] || TRADING_PRESETS.balanced

export const getPresetConfig = (id) => {
  const preset = getPresetById(id)
  return {
    safetyFilters: { ...preset.safetyFilters },
    discoveryFilters: {
      minHolders: preset.safetyFilters.minHolders,
    },
    tradeControls: {
      buyAmountSol: preset.tradeConfig.buyAmountSol,
      slippagePercent: preset.tradeConfig.slippagePercent,
      stopLossPercent: preset.tradeConfig.stopLossPercent,
      takeProfitPercent: preset.tradeConfig.takeProfitPercent,
    },
    executionConfig: { ...preset.executionConfig },
    trailingStop: { ...preset.trailingStop },
    takeProfitLevels: [...preset.takeProfitLevels],
    autoModeSettings: {},
  }
}

export const getPresetDisplayValues = (id) => {
  const preset = getPresetById(id)
  return {
    ...preset.tradeConfig,
    ...preset.safetyFilters,
    ...preset.executionConfig,
    trailingStop: preset.trailingStop,
    takeProfitLevels: preset.takeProfitLevels,
  }
}

export const PRIORITY_FEE_OPTIONS = {
  low: { label: 'Low', lamports: 5000, description: 'Slower but cheaper' },
  medium: { label: 'Medium', lamports: 25000, description: 'Balanced speed/cost' },
  high: { label: 'High', lamports: 75000, description: 'Faster execution' },
  turbo: { label: 'Turbo', lamports: 150000, description: 'Maximum speed' },
}

export default TRADING_PRESETS
