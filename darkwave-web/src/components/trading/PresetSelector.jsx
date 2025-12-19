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
