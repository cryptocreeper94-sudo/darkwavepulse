import { useState } from 'react'
import { TRADING_PRESETS, PRESET_ORDER, PRIORITY_FEE_OPTIONS } from '../../config/tradingPresets'

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
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
  expandBtn: {
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
  expandArrow: (expanded) => ({
    display: 'inline-block',
    transition: 'transform 0.2s ease',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  }),
  advancedPanel: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '12px',
  },
  valueItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  valueLabel: {
    fontSize: '9px',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  valueNum: (color) => ({
    fontSize: '13px',
    fontWeight: '700',
    color: color,
  }),
  featureBadge: (enabled, color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '600',
    background: enabled ? `rgba(${color}, 0.15)` : 'rgba(255, 68, 68, 0.1)',
    color: enabled ? `rgb(${color})` : '#666',
    border: `1px solid ${enabled ? `rgba(${color}, 0.3)` : 'rgba(255, 255, 255, 0.05)'}`,
  }),
  tpLevelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 8px',
    background: 'rgba(57, 255, 20, 0.05)',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  tpLevelText: {
    fontSize: '10px',
    color: '#39FF14',
    fontWeight: '600',
  },
}

function PresetCard({ preset, isSelected, onSelect, disabled }) {
  const [isHovered, setIsHovered] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleClick = () => {
    if (!disabled) {
      onSelect(preset.id)
    }
  }

  const handleToggleAdvanced = (e) => {
    e.stopPropagation()
    setShowAdvanced(!showAdvanced)
  }

  const priorityFee = PRIORITY_FEE_OPTIONS[preset.executionConfig?.priorityFee] || PRIORITY_FEE_OPTIONS.medium

  return (
    <div
      style={styles.card(preset, isSelected, isHovered, disabled)}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
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
          ...styles.expandBtn,
          color: isHovered || showAdvanced ? preset.color : '#888',
        }}
        onClick={handleToggleAdvanced}
      >
        <span>{showAdvanced ? 'Hide' : 'View'} settings</span>
        <span style={styles.expandArrow(showAdvanced)}>▼</span>
      </button>

      {showAdvanced && (
        <div style={styles.advancedPanel}>
          <div style={styles.sectionTitle}>Trade Config</div>
          <div style={styles.valuesGrid}>
            <div style={styles.valueItem}>
              <span style={styles.valueLabel}>Buy Amount</span>
              <span style={styles.valueNum(preset.color)}>
                {preset.tradeConfig.buyAmountSol} SOL
              </span>
            </div>
            <div style={styles.valueItem}>
              <span style={styles.valueLabel}>Slippage</span>
              <span style={styles.valueNum('#FFB800')}>
                {preset.tradeConfig.slippagePercent}%
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
          </div>

          <div style={styles.sectionTitle}>Execution</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <span style={styles.featureBadge(true, preset.colorRgb)}>
              ⚡ {priorityFee.label} Priority
            </span>
            <span style={styles.featureBadge(preset.executionConfig?.mevProtection, '57, 255, 20')}>
              {preset.executionConfig?.mevProtection ? '🛡️ MEV Protected' : '⚠️ No MEV'}
            </span>
            {preset.executionConfig?.jitoTipsLamports > 0 && (
              <span style={styles.featureBadge(true, '139, 92, 246')}>
                💎 Jito {(preset.executionConfig.jitoTipsLamports / 1000).toFixed(0)}K
              </span>
            )}
            {preset.executionConfig?.dcaEnabled && (
              <span style={styles.featureBadge(true, '233, 30, 99')}>
                📊 DCA {preset.executionConfig.dcaSplits}x
              </span>
            )}
          </div>

          <div style={styles.sectionTitle}>Trailing Stop</div>
          <div style={{ marginBottom: '12px' }}>
            <span style={styles.featureBadge(preset.trailingStop?.enabled, '0, 212, 255')}>
              {preset.trailingStop?.enabled 
                ? `✓ Enabled @ ${preset.trailingStop.trailPercent}%` 
                : '✗ Disabled'}
            </span>
          </div>

          <div style={styles.sectionTitle}>Take Profit Levels</div>
          <div style={{ marginBottom: '12px' }}>
            {preset.takeProfitLevels?.map((level, i) => (
              <div key={i} style={styles.tpLevelRow}>
                <span style={styles.tpLevelText}>+{level.percent}%</span>
                <span style={styles.tpLevelText}>Sell {level.sellAmount}%</span>
              </div>
            ))}
          </div>

          <div style={styles.sectionTitle}>Safety Filters</div>
          <div style={styles.valuesGrid}>
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
              <span style={styles.valueLabel}>Max Age</span>
              <span style={styles.valueNum(preset.color)}>
                {preset.safetyFilters.maxTokenAgeHours}h
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={styles.featureBadge(preset.safetyFilters?.requireLiquidityLock, '57, 255, 20')}>
              {preset.safetyFilters?.requireLiquidityLock ? '🔒 LP Lock Required' : '🔓 No LP Lock'}
            </span>
            <span style={styles.featureBadge(preset.safetyFilters?.blockHoneypots, '255, 68, 68')}>
              {preset.safetyFilters?.blockHoneypots ? '🍯 Honeypot Block' : '⚠️ No HP Block'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PresetSelector({ 
  selectedPreset = 'balanced', 
  onSelectPreset, 
  disabled = false 
}) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Trading Strategy</h2>
        <p style={styles.subtitle}>
          Select a preset that matches your risk tolerance
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
