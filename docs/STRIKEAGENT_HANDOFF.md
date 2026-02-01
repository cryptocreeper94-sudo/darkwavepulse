# StrikeAgent Implementation Handoff for DWSC.io

**Date:** February 1, 2026  
**From:** Pulse Build  
**To:** DWSC.io Agent  

This document contains all the StrikeAgent implementation files from the Pulse codebase. Copy each file to your project maintaining the same folder structure.

---

## File Structure Overview

```
src/
├── components/
│   ├── tabs/
│   │   ├── SniperBotTab.jsx (Main StrikeAgent component - 3132 lines)
│   │   └── SniperBotTab.css (Styles - 4855 lines)
│   ├── trading/
│   │   ├── ManualWatchlist.jsx (4-slot limit orders)
│   │   ├── SafetyReport.jsx (AI safety analysis)
│   │   └── PresetSelector.jsx (Guardian/Pathfinder/Velocity)
│   └── sniper/
│       ├── TopSignalsWidget.jsx (AI Top 10 signals)
│       └── TopSignalsWidget.css
└── config/
    └── tradingPresets.js (Trading preset configurations)
```

## Backend API Endpoints Required

```
POST /api/limit-orders - Create limit order
GET  /api/limit-orders?userId=xxx - Get user's orders
PUT  /api/limit-orders/:id - Update order
DELETE /api/limit-orders/:id - Cancel order

POST /api/sniper/analyze-token - Analyze token safety
POST /api/sniper/safety/check - Full safety check
POST /api/sniper/discover - Token discovery
GET  /api/sniper/sol-price - Get SOL price
GET  /api/sniper/rpc/status - RPC status
POST /api/sniper/rpc/custom - Set custom RPC

GET  /api/strike-agent/top-signals?chain=xxx - Get AI top signals
POST /api/demo/discover - Demo discovery
POST /api/demo/buy - Demo buy
POST /api/demo/sell - Demo sell
POST /api/demo/prices - Get live prices
```

---

## FILE: src/config/tradingPresets.js

```javascript
export const TRADING_PRESETS = {
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    icon: '🛡️',
    tagline: 'Prefer a calmer pace?',
    description: 'Conservative approach with strict safety filters. Lower risk, steadier gains. Best for capital preservation.',
    color: '#00D4FF',
    colorRgb: '0, 212, 255',
    tradeConfig: {
      buyAmountSol: 0.25,
      stopLossPercent: 12,
      takeProfitPercent: 22,
    },
    safetyFilters: {
      minLiquidityUsd: 20000,
      maxBotPercent: 50,
      minHolders: 100,
      maxTop10HoldersPercent: 60,
    },
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'Pathfinder',
    icon: '⚖️',
    tagline: 'Balance risk & reward',
    description: 'Balanced strategy for consistent performance. Moderate risk with solid upside potential.',
    color: '#8B5CF6',
    colorRgb: '139, 92, 246',
    tradeConfig: {
      buyAmountSol: 0.5,
      stopLossPercent: 18,
      takeProfitPercent: 35,
    },
    safetyFilters: {
      minLiquidityUsd: 10000,
      maxBotPercent: 65,
      minHolders: 75,
      maxTop10HoldersPercent: 70,
    },
  },
  velocity: {
    id: 'velocity',
    name: 'Velocity',
    icon: '🚀',
    tagline: 'Chase the momentum',
    description: 'Aggressive approach for experienced traders. Higher risk, maximum upside on volatile plays.',
    color: '#39FF14',
    colorRgb: '57, 255, 20',
    tradeConfig: {
      buyAmountSol: 0.75,
      stopLossPercent: 25,
      takeProfitPercent: 55,
    },
    safetyFilters: {
      minLiquidityUsd: 5000,
      maxBotPercent: 80,
      minHolders: 50,
      maxTop10HoldersPercent: 80,
    },
  },
}

export const PRESET_ORDER = ['guardian', 'pathfinder', 'velocity']

export const getPresetById = (id) => TRADING_PRESETS[id] || TRADING_PRESETS.pathfinder

export const getPresetConfig = (id) => {
  const preset = getPresetById(id)
  return {
    safetyFilters: {
      minLiquidityUsd: preset.safetyFilters.minLiquidityUsd,
      maxBotPercent: preset.safetyFilters.maxBotPercent,
      maxTop10HoldersPercent: preset.safetyFilters.maxTop10HoldersPercent,
    },
    discoveryFilters: {
      minHolders: preset.safetyFilters.minHolders,
    },
    tradeControls: {
      buyAmountSol: preset.tradeConfig.buyAmountSol,
      stopLossPercent: preset.tradeConfig.stopLossPercent,
      takeProfitPercent: preset.tradeConfig.takeProfitPercent,
    },
    autoModeSettings: {},
  }
}

export const getPresetDisplayValues = (id) => {
  const preset = getPresetById(id)
  return {
    ...preset.tradeConfig,
    ...preset.safetyFilters,
  }
}

export default TRADING_PRESETS
```

---

## FILE: src/components/trading/PresetSelector.jsx

```jsx
import { useState } from 'react'
import { TRADING_PRESETS, PRESET_ORDER } from '../../config/tradingPresets'

const styles = {
  container: {
    width: '100%',
    marginBottom: '20px',
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 4px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '12px',
    color: '#666',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  card: (preset, isSelected, isHovered, disabled) => ({
    position: 'relative',
    padding: '20px',
    background: isSelected 
      ? `rgba(${preset.colorRgb}, 0.08)` 
      : 'rgba(26, 26, 26, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${isSelected ? preset.color : isHovered ? `rgba(${preset.colorRgb}, 0.5)` : 'rgba(255, 255, 255, 0.06)'}`,
    borderRadius: '16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: disabled ? 0.6 : 1,
    boxShadow: isSelected 
      ? `0 0 30px rgba(${preset.colorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
      : isHovered 
        ? `0 0 20px rgba(${preset.colorRgb}, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)`
        : 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
    transform: isHovered && !disabled ? 'translateY(-2px)' : 'none',
  }),
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '16px',
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    zIndex: 10,
  },
  lockedIcon: {
    fontSize: '32px',
    opacity: 0.8,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  iconWrapper: (color) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: `linear-gradient(135deg, rgba(${color}, 0.2), rgba(${color}, 0.05))`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    border: `1px solid rgba(${color}, 0.3)`,
  }),
  activeBadge: (color) => ({
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: `linear-gradient(135deg, ${color}, rgba(${color.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.7))`,
    color: '#000',
    boxShadow: `0 0 12px rgba(${color.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.4)`,
  }),
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  name: (color) => ({
    fontSize: '18px',
    fontWeight: '800',
    color: color,
    margin: 0,
    letterSpacing: '-0.3px',
  }),
  tagline: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 8px 0',
    fontStyle: 'italic',
  },
  description: {
    fontSize: '12px',
    color: '#666',
    margin: 0,
    lineHeight: '1.5',
  },
  customizeBtn: {
    marginTop: '12px',
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'color 0.2s ease',
  },
  customizeArrow: (expanded) => ({
    display: 'inline-block',
    transition: 'transform 0.2s ease',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  }),
  valuesPanel: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  valueItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  valueLabel: {
    fontSize: '9px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  valueNum: (color) => ({
    fontSize: '14px',
    fontWeight: '700',
    color: color,
  }),
}

function PresetCard({ preset, isSelected, onSelect, disabled, onTermClick }) {
  const [isHovered, setIsHovered] = useState(false)
  const [showValues, setShowValues] = useState(false)

  const handleClick = () => {
    if (!disabled) {
      onSelect(preset.id)
    }
  }

  const handleCustomize = (e) => {
    e.stopPropagation()
    setShowValues(!showValues)
  }

  return (
    <div
      style={styles.card(preset, isSelected, isHovered, disabled)}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      {disabled && (
        <div style={styles.lockedOverlay}>
          <span style={styles.lockedIcon}>🔒</span>
        </div>
      )}
      
      <div style={styles.cardHeader}>
        <div style={styles.iconWrapper(preset.colorRgb)}>
          {preset.icon}
        </div>
        {isSelected && (
          <div style={styles.activeBadge(preset.color)}>
            Active
          </div>
        )}
      </div>

      <div style={styles.nameRow}>
        <h3 style={styles.name(preset.color)}>{preset.name}</h3>
      </div>
      
      <p style={styles.tagline}>{preset.tagline}</p>
      <p style={styles.description}>{preset.description}</p>

      <button 
        style={{
          ...styles.customizeBtn,
          color: isHovered || showValues ? preset.color : '#888',
        }}
        onClick={handleCustomize}
      >
        <span>View settings</span>
        <span style={styles.customizeArrow(showValues)}>▼</span>
      </button>

      {showValues && (
        <div style={styles.valuesPanel}>
          <div style={styles.valuesGrid}>
            <div style={styles.valueItem}>
              <span style={styles.valueLabel}>Buy Amount</span>
              <span style={styles.valueNum(preset.color)}>
                {preset.tradeConfig.buyAmountSol} SOL
              </span>
            </div>
            <div style={styles.valueItem}>
              <span style={styles.valueLabel}>Stop Loss</span>
              <span style={styles.valueNum('#FF4444')}>
                {preset.tradeConfig.stopLossPercent}%
              </span>
            </div>
            <div style={styles.valueItem}>
              <span style={styles.valueLabel}>Take Profit</span>
              <span style={styles.valueNum('#39FF14')}>
                {preset.tradeConfig.takeProfitPercent}%
              </span>
            </div>
            <div style={styles.valueItem}>
              <span style={styles.valueLabel}>Min Liquidity</span>
              <span style={styles.valueNum(preset.color)}>
                ${(preset.safetyFilters.minLiquidityUsd / 1000).toFixed(0)}K
              </span>
            </div>
            <div style={styles.valueItem}>
              <span style={styles.valueLabel}>Max Bot %</span>
              <span style={styles.valueNum(preset.color)}>
                {preset.safetyFilters.maxBotPercent}%
              </span>
            </div>
            <div style={styles.valueItem}>
              <span style={styles.valueLabel}>Min Holders</span>
              <span style={styles.valueNum(preset.color)}>
                {preset.safetyFilters.minHolders}
              </span>
            </div>
            <div style={styles.valueItem}>
              <span style={styles.valueLabel}>Max Top10 %</span>
              <span style={styles.valueNum(preset.color)}>
                {preset.safetyFilters.maxTop10HoldersPercent}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PresetSelector({ 
  selectedPreset = 'pathfinder', 
  onSelectPreset, 
  disabled = false 
}) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Trading Preset</h2>
        <p style={styles.subtitle}>
          Select a strategy that matches your risk tolerance
        </p>
      </div>
      
      <div style={styles.grid}>
        {PRESET_ORDER.map((presetId) => {
          const preset = TRADING_PRESETS[presetId]
          return (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPreset === preset.id}
              onSelect={onSelectPreset}
              disabled={disabled}
            />
          )
        })}
      </div>
    </div>
  )
}

export { PresetCard, TRADING_PRESETS, PRESET_ORDER }
```

---

## FILE: src/components/trading/ManualWatchlist.jsx

```jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import InfoTooltip, { TRADING_DEFINITIONS } from '../ui/InfoTooltip'

const STORAGE_KEY = 'darkwave_manual_watchlist'
const STATUS = {
  EMPTY: 'empty',
  WATCHING: 'watching',
  READY_TO_EXECUTE: 'ready_to_execute',
  FILLED_ENTRY: 'filled_entry',
  READY_TO_EXIT: 'ready_to_exit',
  READY_TO_STOP: 'ready_to_stop',
  FILLED_EXIT: 'filled_exit',
  STOPPED_OUT: 'stopped_out',
  PAUSED: 'paused',
}

function mapBackendStatusToFrontend(backendStatus) {
  const statusMap = {
    'PENDING': STATUS.WATCHING,
    'WATCHING': STATUS.WATCHING,
    'READY_TO_EXECUTE': STATUS.READY_TO_EXECUTE,
    'FILLED_ENTRY': STATUS.FILLED_ENTRY,
    'READY_TO_EXIT': STATUS.READY_TO_EXIT,
    'READY_TO_STOP': STATUS.READY_TO_STOP,
    'FILLED_EXIT': STATUS.FILLED_EXIT,
    'STOPPED_OUT': STATUS.STOPPED_OUT,
    'CANCELLED': STATUS.EMPTY,
  }
  return statusMap[backendStatus] || STATUS.EMPTY
}

const defaultSlot = {
  id: null,
  address: '',
  tokenInfo: null,
  entryPrice: '',
  exitPrice: '',
  stopLoss: '',
  buyAmount: '0.1',
  isActive: true,
  status: STATUS.EMPTY,
  currentPrice: null,
  lastUpdated: null,
}

function PriceIndicator({ currentPrice, entryPrice, exitPrice, stopLoss }) {
  if (!currentPrice || !entryPrice) return null

  const current = parseFloat(currentPrice)
  const entry = parseFloat(entryPrice)
  const exit = exitPrice ? parseFloat(exitPrice) : null
  const stop = stopLoss ? parseFloat(stopLoss) : null

  let position = 'neutral'
  let color = '#888'

  if (exit && current >= exit) {
    position = 'above_exit'
    color = '#39FF14'
  } else if (current > entry) {
    position = 'above_entry'
    color = '#39FF14'
  } else if (stop && current <= stop) {
    position = 'below_stop'
    color = '#FF4444'
  } else if (current < entry) {
    position = 'below_entry'
    color = '#FF4444'
  } else {
    position = 'at_entry'
    color = '#00D4FF'
  }

  const pctFromEntry = entry > 0 ? ((current - entry) / entry) * 100 : 0

  return (
    <div className="watchlist-price-indicator">
      <div className="watchlist-price-bar">
        {stop && (
          <div 
            className="watchlist-price-marker stop" 
            title={`Stop: $${stop.toFixed(8)}`}
          />
        )}
        <div 
          className="watchlist-price-marker entry" 
          title={`Entry: $${entry.toFixed(8)}`}
        />
        {exit && (
          <div 
            className="watchlist-price-marker exit" 
            title={`Exit: $${exit.toFixed(8)}`}
          />
        )}
        <div 
          className="watchlist-price-current"
          style={{ borderColor: color, background: color + '33' }}
        />
      </div>
      <div className="watchlist-price-pct" style={{ color }}>
        {pctFromEntry >= 0 ? '+' : ''}{pctFromEntry.toFixed(2)}%
      </div>
    </div>
  )
}

const STATUS_TOOLTIPS = {
  [STATUS.EMPTY]: null,
  [STATUS.WATCHING]: TRADING_DEFINITIONS.statusWatching,
  [STATUS.READY_TO_EXECUTE]: TRADING_DEFINITIONS.statusReadyToBuy,
  [STATUS.FILLED_ENTRY]: TRADING_DEFINITIONS.statusPositionOpen,
  [STATUS.READY_TO_EXIT]: TRADING_DEFINITIONS.statusReadyToSell,
  [STATUS.READY_TO_STOP]: TRADING_DEFINITIONS.statusStopLossHit,
  [STATUS.FILLED_EXIT]: null,
  [STATUS.STOPPED_OUT]: null,
  [STATUS.PAUSED]: null,
}

function StatusBadge({ status }) {
  const statusConfig = {
    [STATUS.EMPTY]: { label: 'Empty', color: '#666' },
    [STATUS.WATCHING]: { label: 'Watching', color: '#00D4FF' },
    [STATUS.READY_TO_EXECUTE]: { label: '⚡ Ready to Buy', color: '#FFD700' },
    [STATUS.FILLED_ENTRY]: { label: 'Position Open', color: '#39FF14' },
    [STATUS.READY_TO_EXIT]: { label: '⚡ Ready to Sell', color: '#FFD700' },
    [STATUS.READY_TO_STOP]: { label: '⚡ Stop Loss Hit', color: '#FF6B00' },
    [STATUS.FILLED_EXIT]: { label: 'Sold', color: '#39FF14' },
    [STATUS.STOPPED_OUT]: { label: 'Stopped Out', color: '#FF4444' },
    [STATUS.PAUSED]: { label: 'Paused', color: '#888' },
  }

  const config = statusConfig[status] || statusConfig[STATUS.EMPTY]
  const tooltip = STATUS_TOOLTIPS[status]

  return (
    <span 
      className="watchlist-status-badge"
      style={{ 
        background: config.color + '20', 
        color: config.color,
        borderColor: config.color + '60',
      }}
    >
      {config.label}
      {tooltip && <InfoTooltip {...tooltip} position="right" />}
    </span>
  )
}

function WatchlistSlot({ slot, index, onUpdate, onClear, onToggle }) {
  const [addressInput, setAddressInput] = useState(slot.address || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTokenInfo = useCallback(async (address) => {
    if (!address || address.length < 32) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/sniper/analyze-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: address })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Token not found')
      }

      const data = await res.json()
      
      onUpdate(index, {
        address,
        tokenInfo: {
          name: data.token.name,
          symbol: data.token.symbol,
          logo: data.token.logo || null,
        },
        currentPrice: data.token.priceUsd,
        status: STATUS.WATCHING,
        lastUpdated: Date.now(),
      })
    } catch (err) {
      setError(err.message)
      onUpdate(index, {
        address,
        tokenInfo: null,
        currentPrice: null,
        status: STATUS.EMPTY,
      })
    } finally {
      setIsLoading(false)
    }
  }, [index, onUpdate])

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    if (addressInput.trim()) {
      fetchTokenInfo(addressInput.trim())
    }
  }

  const handleAddressChange = (e) => {
    setAddressInput(e.target.value)
  }

  const handleAddressBlur = () => {
    if (addressInput.trim() && addressInput !== slot.address) {
      fetchTokenInfo(addressInput.trim())
    }
  }

  const handleFieldChange = (field, value) => {
    const updates = { [field]: value }
    
    if (slot.tokenInfo && field === 'entryPrice' && value) {
      updates.status = STATUS.WATCHING
    }
    
    onUpdate(index, updates)
  }

  return (
    <div className={`section-box watchlist-slot ${slot.status !== STATUS.EMPTY ? 'active' : ''} ${!slot.isActive ? 'paused' : ''}`}>
      <div className="watchlist-slot-header">
        <div className="watchlist-slot-number">#{index + 1}</div>
        <StatusBadge status={slot.isActive ? slot.status : STATUS.PAUSED} />
        <div className="watchlist-slot-actions">
          <button 
            className={`watchlist-toggle-btn ${slot.isActive ? 'active' : ''}`}
            onClick={() => onToggle(index)}
            title={slot.isActive ? 'Pause' : 'Activate'}
          >
            {slot.isActive ? '⏸' : '▶'}
          </button>
          <button 
            className="watchlist-clear-btn"
            onClick={() => onClear(index)}
            title="Clear Slot"
          >
            ✕
          </button>
        </div>
      </div>

      <form onSubmit={handleAddressSubmit} className="watchlist-address-form">
        <div className="watchlist-address-label">
          <span>Token Address</span>
          <InfoTooltip {...TRADING_DEFINITIONS.tokenAddress} position="left" />
        </div>
        <input
          type="text"
          placeholder="Paste Solana token address..."
          value={addressInput}
          onChange={handleAddressChange}
          onBlur={handleAddressBlur}
          className="sniper-input watchlist-address-input"
          disabled={isLoading}
        />
        {isLoading && <span className="watchlist-loading">...</span>}
      </form>

      {error && (
        <div className="watchlist-error">{error}</div>
      )}

      {slot.tokenInfo && (
        <div className="watchlist-token-info">
          <div className="watchlist-token-left">
            <div className="watchlist-token-icon">
              {slot.tokenInfo.logo ? (
                <img src={slot.tokenInfo.logo} alt={slot.tokenInfo.symbol} />
              ) : (
                <span>{slot.tokenInfo.symbol?.slice(0, 2) || '??'}</span>
              )}
            </div>
            <div className="watchlist-token-details">
              <div className="watchlist-token-symbol">{slot.tokenInfo.symbol}</div>
              <div className="watchlist-token-name">{slot.tokenInfo.name}</div>
            </div>
          </div>
          <div className="watchlist-token-price">
            <span className="watchlist-price-label">
              Current
              <InfoTooltip {...TRADING_DEFINITIONS.currentPrice} position="right" />
            </span>
            <span className="watchlist-price-value">
              ${parseFloat(slot.currentPrice || 0).toFixed(8)}
            </span>
          </div>
        </div>
      )}

      <div className="watchlist-inputs-grid">
        <label className="watchlist-input-item">
          <span className="watchlist-input-label">
            Entry Price ($)
            <InfoTooltip {...TRADING_DEFINITIONS.entryPrice} position="left" />
          </span>
          <input
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            value={slot.entryPrice}
            onChange={(e) => handleFieldChange('entryPrice', e.target.value)}
            className="sniper-input"
          />
        </label>
        <label className="watchlist-input-item">
          <span className="watchlist-input-label">
            Take Profit ($)
            <InfoTooltip {...TRADING_DEFINITIONS.exitPrice} position="right" />
          </span>
          <input
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            value={slot.exitPrice}
            onChange={(e) => handleFieldChange('exitPrice', e.target.value)}
            className="sniper-input"
          />
        </label>
        <label className="watchlist-input-item">
          <span className="watchlist-input-label">
            Stop Loss ($)
            <InfoTooltip {...TRADING_DEFINITIONS.stopLoss} position="left" />
          </span>
          <input
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            value={slot.stopLoss}
            onChange={(e) => handleFieldChange('stopLoss', e.target.value)}
            className="sniper-input"
          />
        </label>
        <label className="watchlist-input-item">
          <span className="watchlist-input-label">
            Buy Amount (SOL)
            <InfoTooltip {...TRADING_DEFINITIONS.buyAmount} position="right" />
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.1"
            value={slot.buyAmount}
            onChange={(e) => handleFieldChange('buyAmount', e.target.value)}
            className="sniper-input"
          />
        </label>
      </div>

      {slot.tokenInfo && slot.entryPrice && (
        <PriceIndicator 
          currentPrice={slot.currentPrice}
          entryPrice={slot.entryPrice}
          exitPrice={slot.exitPrice}
          stopLoss={slot.stopLoss}
        />
      )}
    </div>
  )
}

export default function ManualWatchlist() {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58() || null
  const syncedOrderIds = useRef(new Map())
  
  const [slots, setSlots] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to load watchlist from localStorage:', e)
    }
    return Array(4).fill(null).map((_, i) => ({ ...defaultSlot, id: `slot-${i}` }))
  })
  
  const syncSlotToBackend = useCallback(async (slot, index) => {
    if (!walletAddress || !slot.address || !slot.entryPrice) return
    
    const orderId = syncedOrderIds.current.get(index)
    
    try {
      if (orderId && slot.status !== STATUS.EMPTY) {
        const protectedStatuses = [
          STATUS.READY_TO_EXECUTE, 
          STATUS.READY_TO_EXIT, 
          STATUS.READY_TO_STOP,
          STATUS.FILLED_ENTRY,
          STATUS.FILLED_EXIT,
          STATUS.STOPPED_OUT
        ]
        
        const updatePayload = {
          userId: walletAddress,
          entryPrice: slot.entryPrice,
          exitPrice: slot.exitPrice || null,
          stopLoss: slot.stopLoss || null,
          buyAmountSol: slot.buyAmount,
        }
        
        if (!slot.isActive) {
          updatePayload.status = 'CANCELLED'
        } else if (!protectedStatuses.includes(slot.status)) {
          updatePayload.status = slot.status === STATUS.WATCHING ? 'WATCHING' : 'PENDING'
        }
        
        await fetch(`/api/limit-orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        })
      } else if (slot.address && slot.entryPrice && slot.status !== STATUS.EMPTY) {
        const res = await fetch('/api/limit-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: walletAddress,
            tokenAddress: slot.address,
            tokenSymbol: slot.tokenInfo?.symbol || 'UNKNOWN',
            entryPrice: slot.entryPrice,
            exitPrice: slot.exitPrice || null,
            stopLoss: slot.stopLoss || null,
            buyAmountSol: slot.buyAmount,
            walletAddress
          })
        })
        if (res.ok) {
          const data = await res.json()
          if (data.order?.id) {
            syncedOrderIds.current.set(index, data.order.id)
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync slot to backend:', err)
    }
  }, [walletAddress])

  useEffect(() => {
    const loadOrdersFromBackend = async () => {
      if (!walletAddress) return
      
      try {
        const res = await fetch(`/api/limit-orders?userId=${walletAddress}`)
        if (res.ok) {
          const data = await res.json()
          if (data.orders && data.orders.length > 0) {
            const activeOrders = data.orders.filter(o => 
              !['CANCELLED', 'FILLED_EXIT', 'STOPPED_OUT'].includes(o.status)
            ).slice(0, 4)
            
            if (activeOrders.length > 0) {
              setSlots(prev => {
                const updated = [...prev]
                activeOrders.forEach((order, i) => {
                  if (i < 4) {
                    syncedOrderIds.current.set(i, order.id)
                    updated[i] = {
                      ...defaultSlot,
                      id: order.id,
                      address: order.tokenAddress,
                      tokenInfo: { symbol: order.tokenSymbol, name: order.tokenSymbol },
                      entryPrice: order.entryPrice,
                      exitPrice: order.exitPrice || '',
                      stopLoss: order.stopLoss || '',
                      buyAmount: order.buyAmountSol,
                      isActive: order.status !== 'CANCELLED',
                      status: mapBackendStatusToFrontend(order.status),
                      currentPrice: null,
                      lastUpdated: null,
                    }
                  }
                })
                return updated
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to load orders from backend:', err)
      }
    }
    
    loadOrdersFromBackend()
  }, [walletAddress])
  
  useEffect(() => {
    if (walletAddress) {
      slots.forEach((slot, index) => {
        if (slot.status === STATUS.WATCHING && slot.isActive) {
          syncSlotToBackend(slot, index)
        }
      })
    }
  }, [slots.map(s => `${s.address}-${s.entryPrice}-${s.exitPrice}-${s.stopLoss}-${s.isActive}`).join(','), walletAddress, syncSlotToBackend])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
    } catch (e) {
      console.error('Failed to save watchlist to localStorage:', e)
    }
  }, [slots])

  useEffect(() => {
    const refreshPrices = async () => {
      const activeSlots = slots.filter(s => s.address && s.tokenInfo && s.isActive)
      if (activeSlots.length === 0) return

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        if (!slot.address || !slot.tokenInfo || !slot.isActive) continue

        try {
          const res = await fetch(`/api/sniper/analyze-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenAddress: slot.address })
          })

          if (res.ok) {
            const data = await res.json()
            if (data.token?.priceUsd) {
              setSlots(prev => {
                const updated = [...prev]
                updated[i] = {
                  ...updated[i],
                  currentPrice: data.token.priceUsd,
                  lastUpdated: Date.now(),
                }

                const current = parseFloat(data.token.priceUsd)
                const exit = parseFloat(updated[i].exitPrice)
                const stop = parseFloat(updated[i].stopLoss)

                if (exit && current >= exit && updated[i].status === STATUS.WATCHING) {
                  updated[i].status = STATUS.FILLED_EXIT
                } else if (stop && current <= stop && updated[i].status === STATUS.WATCHING) {
                  updated[i].status = STATUS.STOPPED_OUT
                }

                return updated
              })
            }
          }
        } catch (err) {
          console.error('Price refresh error for slot', i, err)
        }
      }
    }

    refreshPrices()
    const interval = setInterval(refreshPrices, 30000)
    return () => clearInterval(interval)
  }, [slots.map(s => s.address + s.isActive).join(',')])

  const handleUpdate = useCallback((index, updates) => {
    setSlots(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...updates }
      return updated
    })
  }, [])

  const handleClear = useCallback(async (index) => {
    const orderId = syncedOrderIds.current.get(index)
    if (orderId) {
      try {
        await fetch(`/api/limit-orders/${orderId}`, { method: 'DELETE' })
        syncedOrderIds.current.delete(index)
      } catch (err) {
        console.error('Failed to cancel order:', err)
      }
    }
    setSlots(prev => {
      const updated = [...prev]
      updated[index] = { ...defaultSlot, id: `slot-${index}` }
      return updated
    })
  }, [])

  const handleToggle = useCallback((index) => {
    setSlots(prev => {
      const updated = [...prev]
      updated[index] = { 
        ...updated[index], 
        isActive: !updated[index].isActive 
      }
      return updated
    })
  }, [])

  const activeCount = slots.filter(s => s.status === STATUS.WATCHING && s.isActive).length

  return (
    <div className="section-box watchlist-container">
      <div className="sniper-section-header">
        <h3 className="sniper-section-title">
          Manual Token Watchlist
          <span className="watchlist-count">{activeCount}/4 Active</span>
        </h3>
      </div>
      <div className="watchlist-slots-grid">
        {slots.map((slot, index) => (
          <WatchlistSlot
            key={slot.id || index}
            slot={slot}
            index={index}
            onUpdate={handleUpdate}
            onClear={handleClear}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## FILE: src/components/sniper/TopSignalsWidget.jsx

```jsx
import { useState, useEffect, useCallback } from 'react'
import './TopSignalsWidget.css'

const API_BASE = ''

const ChainLogos = {
  all: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10c-2.5-2.5-4-6-4-10s1.5-7.5 4-10z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  solana: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 16.5l2.5-2.5h12l-2.5 2.5H5z" fill="currentColor"/>
      <path d="M5 10l2.5 2.5h12L17 10H5z" fill="currentColor"/>
      <path d="M5 7.5L7.5 5h12L17 7.5H5z" fill="currentColor"/>
    </svg>
  ),
  ethereum: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L5 12l7 4 7-4-7-10z" fill="currentColor" opacity="0.6"/>
      <path d="M12 16l-7-4 7 10 7-10-7 4z" fill="currentColor"/>
    </svg>
  ),
  base: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor"/>
      <path d="M12 6c3.3 0 6 2.7 6 6s-2.7 6-6 6v-3c1.65 0 3-1.35 3-3s-1.35-3-3-3V6z" fill="#0a0a0a"/>
    </svg>
  ),
  polygon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M16 8l-4-2-4 2v4l4 2 4-2V8z" fill="currentColor"/>
      <path d="M20 10l-4-2v4l4 2v-4zM8 10l-4-2v4l4 2v-4z" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  arbitrum: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="currentColor" opacity="0.3"/>
      <path d="M12 8l4 6h-3v4l-4-6h3V8z" fill="currentColor"/>
    </svg>
  ),
  bsc: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3 3-3 3-3-3 3-3z" fill="currentColor"/>
      <path d="M19 9l3 3-3 3-3-3 3-3zM5 9l3 3-3 3-3-3 3-3z" fill="currentColor"/>
      <path d="M12 16l3 3-3 3-3-3 3-3z" fill="currentColor"/>
      <path d="M12 9l3 3-3 3-3-3 3-3z" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
}

const CHAIN_CONFIG = {
  all: { label: 'All Chains', short: 'ALL', color: '#00D4FF' },
  solana: { label: 'Solana', short: 'SOL', color: '#9945FF' },
  ethereum: { label: 'Ethereum', short: 'ETH', color: '#627EEA' },
  base: { label: 'Base', short: 'BASE', color: '#0052FF' },
  polygon: { label: 'Polygon', short: 'MATIC', color: '#8247E5' },
  arbitrum: { label: 'Arbitrum', short: 'ARB', color: '#28A0F0' },
  bsc: { label: 'BNB Chain', short: 'BNB', color: '#F0B90B' },
}

function getChainBadge(chain) {
  const config = CHAIN_CONFIG[chain?.toLowerCase()] || CHAIN_CONFIG.solana
  const shortLabels = {
    solana: 'SOL',
    ethereum: 'ETH',
    base: 'BASE',
    polygon: 'MATIC',
    arbitrum: 'ARB',
    bsc: 'BNB',
  }
  return {
    icon: config.icon,
    label: shortLabels[chain?.toLowerCase()] || 'SOL',
    color: config.color,
  }
}

function getScoreColor(score) {
  if (score >= 70) return '#39FF14'
  if (score >= 40) return '#FFD700'
  return '#FF4444'
}

function getCategoryColor(category) {
  switch (category) {
    case 'blue_chip': return { bg: 'rgba(0, 123, 255, 0.15)', color: '#007BFF', border: 'rgba(0, 123, 255, 0.4)' }
    case 'defi': return { bg: 'rgba(138, 43, 226, 0.15)', color: '#9D4EDD', border: 'rgba(138, 43, 226, 0.4)' }
    case 'meme': return { bg: 'rgba(255, 105, 180, 0.15)', color: '#FF69B4', border: 'rgba(255, 105, 180, 0.4)' }
    case 'dex': return { bg: 'rgba(0, 212, 255, 0.15)', color: '#00D4FF', border: 'rgba(0, 212, 255, 0.4)' }
    case 'new': return { bg: 'rgba(57, 255, 20, 0.15)', color: '#39FF14', border: 'rgba(57, 255, 20, 0.4)' }
    default: return { bg: 'rgba(136, 136, 136, 0.15)', color: '#888', border: 'rgba(136, 136, 136, 0.4)' }
  }
}

function getCategoryLabel(category) {
  switch (category) {
    case 'blue_chip': return 'Blue Chip'
    case 'defi': return 'DeFi'
    case 'meme': return 'Meme'
    case 'dex': return 'DEX'
    case 'new': return 'New'
    default: return category || 'Unknown'
  }
}

function getIndicatorStyle(indicator) {
  const lowerIndicator = indicator.toLowerCase()
  if (lowerIndicator.includes('bullish') || lowerIndicator.includes('oversold') || lowerIndicator.includes('surge') || lowerIndicator.includes('buy')) {
    return { bg: 'rgba(57, 255, 20, 0.15)', color: '#39FF14', border: 'rgba(57, 255, 20, 0.3)' }
  }
  if (lowerIndicator.includes('bearish') || lowerIndicator.includes('overbought') || lowerIndicator.includes('sell')) {
    return { bg: 'rgba(255, 68, 68, 0.15)', color: '#FF4444', border: 'rgba(255, 68, 68, 0.3)' }
  }
  return { bg: 'rgba(0, 212, 255, 0.15)', color: '#00D4FF', border: 'rgba(0, 212, 255, 0.3)' }
}

function formatPrice(price) {
  if (!price && price !== 0) return '$0.00'
  if (price < 0.0001) return `$${price.toExponential(2)}`
  if (price < 0.01) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(4)}`
  if (price < 1000) return `$${price.toFixed(2)}`
  return `$${(price / 1000).toFixed(2)}K`
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now'
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function TopSignalsWidget({ onAnalyze }) {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshCountdown, setRefreshCountdown] = useState(60)
  const [selectedChain, setSelectedChain] = useState('all')

  const fetchSignals = useCallback(async () => {
    try {
      setError(null)
      const chainParam = selectedChain !== 'all' ? `?chain=${selectedChain}` : ''
      const res = await fetch(`${API_BASE}/api/strike-agent/top-signals${chainParam}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      if (data.success && data.signals) {
        setSignals(data.signals.slice(0, 10))
        setLastUpdated(new Date())
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('Failed to fetch top signals:', err)
      setError(err.message || 'Failed to load signals')
    } finally {
      setLoading(false)
      setRefreshCountdown(60)
    }
  }, [selectedChain])

  useEffect(() => {
    fetchSignals()
    const interval = setInterval(fetchSignals, 60000)
    return () => clearInterval(interval)
  }, [fetchSignals])

  const handleChainChange = (chain) => {
    setSelectedChain(chain)
    setLoading(true)
  }

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setRefreshCountdown(prev => (prev > 0 ? prev - 1 : 60))
    }, 1000)
    return () => clearInterval(countdownInterval)
  }, [])

  const handleCardClick = (signal) => {
    if (onAnalyze) {
      onAnalyze(signal)
    }
  }

  if (loading) {
    return (
      <div className="top-signals-widget">
        <div className="signals-loading">
          <div className="signals-spinner"></div>
          <span>Analyzing markets...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="top-signals-widget">
      <div className="signals-disclaimer">
        ⚠️ Not financial advice - Always DYOR (Do Your Own Research)
      </div>

      <div className="signals-chain-selector">
        <div className="chain-selector-header">
          <span className="chain-selector-label">Select Network</span>
          <span className="chain-selector-count">{Object.keys(CHAIN_CONFIG).length} chains</span>
        </div>
        <div className="chain-grid">
          {Object.entries(CHAIN_CONFIG).map(([key, config]) => (
            <button
              key={key}
              className={`chain-tile ${selectedChain === key ? 'active' : ''}`}
              onClick={() => handleChainChange(key)}
              style={{ '--chain-color': config.color }}
            >
              <div className="chain-tile-logo" style={{ color: config.color }}>
                {ChainLogos[key]}
              </div>
              <div className="chain-tile-info">
                <span className="chain-tile-name">{config.label}</span>
                <span className="chain-tile-short">{config.short}</span>
              </div>
              {selectedChain === key && <div className="chain-tile-check">✓</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="signals-header">
        <div className="signals-title-group">
          <h3 className="signals-title">🎯 Top 10 Tokens to Watch</h3>
          <span className="signals-subtitle">AI-powered signal analysis</span>
        </div>
        <div className="signals-meta">
          {lastUpdated && (
            <span className="signals-last-updated">
              Updated {formatTimeAgo(lastUpdated)}
            </span>
          )}
          <span className="signals-refresh-timer">
            Refresh in {refreshCountdown}s
          </span>
          <button className="signals-refresh-btn" onClick={fetchSignals} disabled={loading}>
            ↻
          </button>
        </div>
      </div>

      {error && (
        <div className="signals-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="error-retry" onClick={fetchSignals}>Retry</button>
        </div>
      )}

      {!error && signals.length === 0 && (
        <div className="signals-empty">
          <div className="empty-icon">📊</div>
          <div className="empty-text">No signals available</div>
          <div className="empty-hint">Check back soon for AI-analyzed trading opportunities</div>
        </div>
      )}

      {!error && signals.length > 0 && (
        <div className="signals-list">
          {signals.map((signal, index) => {
            const catStyle = getCategoryColor(signal.category)
            const scoreColor = getScoreColor(signal.compositeScore || 0)
            
            return (
              <div
                key={signal.id || signal.tokenAddress || index}
                className="signal-card"
                onClick={() => handleCardClick(signal)}
              >
                <div className="signal-rank" style={{ color: index < 3 ? '#FFD700' : '#00D4FF' }}>
                  #{index + 1}
                </div>

                <div className="signal-main">
                  <div className="signal-token-info">
                    <span className="signal-symbol">{signal.tokenSymbol || signal.symbol}</span>
                    <span className="signal-name">{signal.tokenName || signal.name}</span>
                  </div>
                  <div className="signal-price">
                    {formatPrice(signal.priceUsd || signal.price)}
                  </div>
                </div>

                <div className="signal-score-section">
                  <div 
                    className="signal-score" 
                    style={{ 
                      color: scoreColor,
                      textShadow: `0 0 10px ${scoreColor}40`
                    }}
                  >
                    {Math.round(signal.compositeScore || 0)}
                  </div>
                  <span className="signal-score-label">Score</span>
                </div>

                <div className="signal-badges">
                  {(() => {
                    const chainBadge = getChainBadge(signal.chain || 'solana')
                    return (
                      <span 
                        className="signal-chain-badge"
                        style={{
                          background: `${chainBadge.color}15`,
                          color: chainBadge.color,
                          borderColor: `${chainBadge.color}40`
                        }}
                      >
                        {chainBadge.icon} {chainBadge.label}
                      </span>
                    )
                  })()}
                  <span 
                    className="signal-category-badge"
                    style={{
                      background: catStyle.bg,
                      color: catStyle.color,
                      borderColor: catStyle.border
                    }}
                  >
                    {getCategoryLabel(signal.category)}
                  </span>
                  
                  {Array.isArray(signal.indicators) && signal.indicators.slice(0, 2).map((indicator, i) => {
                    const indStyle = getIndicatorStyle(indicator)
                    return (
                      <span 
                        key={i}
                        className="signal-indicator-badge"
                        style={{
                          background: indStyle.bg,
                          color: indStyle.color,
                          borderColor: indStyle.border
                        }}
                      >
                        {indicator}
                      </span>
                    )
                  })}
                </div>

                <div className="signal-action">
                  <span className="signal-analyze-hint">Click to analyze →</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

---

## FILE: src/components/sniper/TopSignalsWidget.css

```css
.top-signals-widget {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.signals-disclaimer {
  background: #1f1f1f;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 11px;
  color: #FFD700;
  text-align: center;
  font-weight: 500;
}

.signals-chain-selector {
  margin-bottom: 20px;
  background: #151515;
  border: 1px solid #252525;
  border-radius: 12px;
  padding: 16px;
}

.chain-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #252525;
}

.chain-selector-label {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.chain-selector-count {
  font-size: 11px;
  color: #666;
  background: #1f1f1f;
  padding: 4px 10px;
  border-radius: 20px;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

@media (max-width: 640px) {
  .chain-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}

@media (max-width: 400px) {
  .chain-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chain-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px;
  border-radius: 10px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chain-tile:hover {
  background: #1f1f1f;
  border-color: var(--chain-color, #00D4FF);
  transform: translateY(-2px);
}

.chain-tile.active {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 100%);
  border-color: var(--chain-color, #00D4FF);
  box-shadow: 0 0 20px color-mix(in srgb, var(--chain-color) 30%, transparent),
              inset 0 0 15px color-mix(in srgb, var(--chain-color) 10%, transparent);
}

.chain-tile-logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.chain-tile-logo svg {
  width: 20px;
  height: 20px;
}

.chain-tile:hover .chain-tile-logo {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.chain-tile.active .chain-tile-logo {
  background: color-mix(in srgb, var(--chain-color) 15%, transparent);
  box-shadow: 0 0 15px color-mix(in srgb, var(--chain-color) 40%, transparent);
}

.chain-tile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.chain-tile-name {
  font-size: 11px;
  font-weight: 600;
  color: #ccc;
  text-align: center;
  line-height: 1.2;
}

.chain-tile.active .chain-tile-name {
  color: #fff;
}

.chain-tile-short {
  font-size: 9px;
  color: #666;
  font-weight: 500;
}

.chain-tile.active .chain-tile-short {
  color: var(--chain-color);
}

.chain-tile-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--chain-color);
  color: #000;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: checkPop 0.2s ease;
}

@keyframes checkPop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.signals-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #2a2a2a;
}

@media (min-width: 480px) {
  .signals-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.signals-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.signals-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.signals-subtitle {
  font-size: 11px;
  color: #666;
}

.signals-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.signals-last-updated {
  font-size: 10px;
  color: #888;
}

.signals-refresh-timer {
  font-size: 10px;
  color: #00D4FF;
  font-weight: 500;
}

.signals-refresh-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #252525;
  border: 1px solid #333;
  color: #00D4FF;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signals-refresh-btn:hover {
  background: #333;
  border-color: #00D4FF;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

.signals-refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.signals-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 12px;
}

.signals-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #2a2a2a;
  border-top-color: #00D4FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.signals-loading span {
  font-size: 12px;
  color: #666;
}

.signals-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: #1f1f1f;
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 8px;
  margin-bottom: 12px;
}

.signals-error .error-icon {
  font-size: 18px;
}

.signals-error .error-text {
  font-size: 12px;
  color: #FF4444;
}

.signals-error .error-retry {
  padding: 6px 12px;
  background: #252525;
  border: 1px solid #333;
  border-radius: 6px;
  color: #00D4FF;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.signals-error .error-retry:hover {
  background: #333;
  border-color: #00D4FF;
}

.signals-empty {
  text-align: center;
  padding: 40px 16px;
}

.signals-empty .empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.signals-empty .empty-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.signals-empty .empty-hint {
  font-size: 11px;
  color: #444;
}

.signals-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.signal-card {
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: grid;
  grid-template-columns: 36px 1fr auto;
  grid-template-rows: auto auto auto;
  gap: 8px 12px;
  align-items: center;
}

.signal-card:hover {
  border-color: #00D4FF;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.15);
  transform: translateY(-1px);
}

@media (min-width: 600px) {
  .signal-card {
    grid-template-columns: 40px 1fr auto auto;
    grid-template-rows: auto auto;
  }
}

.signal-rank {
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  grid-row: span 2;
}

@media (min-width: 600px) {
  .signal-rank {
    font-size: 18px;
  }
}

.signal-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

@media (min-width: 600px) {
  .signal-main {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
}

.signal-token-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.signal-symbol {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.signal-name {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

@media (min-width: 600px) {
  .signal-name {
    max-width: 150px;
  }
}

.signal-price {
  font-size: 13px;
  font-weight: 600;
  color: #00D4FF;
  font-family: monospace;
}

.signal-score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  grid-row: span 2;
}

.signal-score {
  font-size: 22px;
  font-weight: 800;
}

.signal-score-label {
  font-size: 9px;
  color: #666;
  text-transform: uppercase;
}

.signal-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  grid-column: 2 / -1;
}

@media (min-width: 600px) {
  .signal-badges {
    grid-column: 2;
  }
}

.signal-chain-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  border: 1px solid;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 3px;
}

.signal-category-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border: 1px solid;
}

.signal-indicator-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
}

.signal-action {
  display: none;
}

@media (min-width: 600px) {
  .signal-action {
    display: flex;
    align-items: center;
    grid-row: 2;
    grid-column: 3 / -1;
    justify-self: end;
  }
}

.signal-analyze-hint {
  font-size: 10px;
  color: #555;
  transition: color 0.2s ease;
}

.signal-card:hover .signal-analyze-hint {
  color: #00D4FF;
}
```

---

## Notes for DWSC.io Integration

### Dependencies Required
- `lightweight-charts` - For LiveCandleChart component
- `@solana/wallet-adapter-react` - For wallet integration
- React 18+ with hooks

### Context Providers Needed
- `WalletContext` - For external wallet state
- `BuiltInWalletContext` - For built-in wallet

### Files You Already Have
- QuickTradePanel.jsx
- dexSwapService.js
- Wallet hooks

### Features Still To Build
- DCA mode (Dollar Cost Averaging)
- Trailing stop-loss
- Copy trading
- MEV protection
- Stealth mode

### Backend Database Schema (limit_orders table)
```sql
CREATE TABLE limit_orders (
  id UUID PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  token_address VARCHAR NOT NULL,
  token_symbol VARCHAR,
  entry_price DECIMAL,
  exit_price DECIMAL,
  stop_loss DECIMAL,
  buy_amount_sol DECIMAL,
  status VARCHAR DEFAULT 'PENDING',
  wallet_address VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

---

## Main SniperBotTab.jsx

The main component is too large (3132 lines) to include in full here. Key sections:

1. **Lines 1-140**: Imports, glossary data, default config
2. **Lines 141-250**: LiveCandleChart component  
3. **Lines 250-340**: SessionStatsCard, ActivePositionCard
4. **Lines 340-515**: DiscoveredTokenCard, DemoPositionCard
5. **Lines 517-600**: SmartAutoModePanel, BuiltInWalletUnlock
6. **Lines 600-800**: QuickActionBar, ActiveTradesPanel
7. **Lines 800-1260**: ModeSettingsModal with Manual/Semi-Auto/Full-Auto settings
8. **Lines 1265-1550**: QuantSystemSection (learning metrics, trade feed, accuracy stats)
9. **Lines 1550-2000**: Main component state, hooks, effects
10. **Lines 2000-2400**: Trade handlers, config updates
11. **Lines 2400-3132**: Main JSX render with BentoGrid layout

The full file is available at: `darkwave-web/src/components/tabs/SniperBotTab.jsx`

---

**End of Handoff Document**
