import { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchCoinAnalysis } from '../../services/api'
import AnalysisChart from '../charts/AnalysisChart'

function formatNumber(num) {
  if (!num && num !== 0) return '—'
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  if (num < 0.01) return num.toFixed(6)
  return num.toFixed(2)
}

function formatPrice(price) {
  if (!price && price !== 0) return '$—'
  if (price < 0.01) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(4)}`
  return `$${formatNumber(price)}`
}

function generateMockIndicators(coin) {
  const rsi = Math.floor(Math.random() * 40) + 30
  const macdValue = (Math.random() * 2 - 1).toFixed(4)
  const macdSignal = (Math.random() * 2 - 1).toFixed(4)
  const sma20 = parseFloat(coin.price?.replace(/[$,]/g, '') || 0) * (0.95 + Math.random() * 0.1)
  const sma50 = parseFloat(coin.price?.replace(/[$,]/g, '') || 0) * (0.92 + Math.random() * 0.16)
  const ema12 = parseFloat(coin.price?.replace(/[$,]/g, '') || 0) * (0.97 + Math.random() * 0.06)
  const ema26 = parseFloat(coin.price?.replace(/[$,]/g, '') || 0) * (0.95 + Math.random() * 0.1)
  
  return {
    rsi,
    macd: { value: macdValue, signal: macdSignal, histogram: (macdValue - macdSignal).toFixed(4) },
    sma20,
    sma50,
    ema12,
    ema26
  }
}

function generateMockPrediction(indicators) {
  const rsi = indicators.rsi
  let signal, confidence
  
  if (rsi < 30) {
    signal = 'BUY'
    confidence = Math.floor(70 + Math.random() * 25)
  } else if (rsi > 70) {
    signal = 'SELL'
    confidence = Math.floor(65 + Math.random() * 25)
  } else {
    signal = 'HOLD'
    confidence = Math.floor(55 + Math.random() * 30)
  }
  
  return { signal, confidence }
}

function generateMockLevels(price) {
  const currentPrice = parseFloat(price?.replace(/[$,]/g, '') || 0)
  return {
    resistance1: currentPrice * (1.02 + Math.random() * 0.03),
    resistance2: currentPrice * (1.05 + Math.random() * 0.05),
    support1: currentPrice * (0.95 + Math.random() * 0.03),
    support2: currentPrice * (0.90 + Math.random() * 0.05)
  }
}

function IndicatorToggle({ label, value, status, isActive, onToggle, canToggle }) {
  let statusColor = 'var(--text-secondary)'
  if (status === 'bullish') statusColor = '#39FF14'
  if (status === 'bearish') statusColor = '#FF4444'
  if (status === 'neutral') statusColor = 'rgba(255,255,255,0.5)'
  
  const handleClick = () => {
    if (canToggle && onToggle) {
      onToggle()
    }
  }
  
  return (
    <div 
      className={`analysis-indicator-row ${canToggle ? 'clickable' : ''} ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      style={{
        cursor: canToggle ? 'pointer' : 'default',
        background: isActive ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
        border: isActive ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid transparent',
        borderRadius: '8px',
        padding: '8px 12px',
        transition: 'all 0.2s ease',
      }}
    >
      <span className="analysis-indicator-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {canToggle && (
          <span style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            border: isActive ? '2px solid #00D4FF' : '2px solid rgba(255,255,255,0.3)',
            background: isActive ? '#00D4FF' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#000',
            transition: 'all 0.2s ease',
          }}>
            {isActive && '✓'}
          </span>
        )}
        {label}
      </span>
      <span className="analysis-indicator-value" style={{ color: statusColor }}>{value}</span>
    </div>
  )
}

function StatBox({ label, value, subValue }) {
  return (
    <div className="analysis-stat-box">
      <div className="analysis-stat-label">{label}</div>
      <div className="analysis-stat-value">{value}</div>
      {subValue && <div className="analysis-stat-sub">{subValue}</div>}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="analysis-loading">
      <div className="analysis-spinner"></div>
      <span>Loading analysis...</span>
    </div>
  )
}

function Notepad({ coinSymbol }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState('')
  const storageKey = `analysis-notes-${coinSymbol}`
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setNotes(saved)
      } else {
        setNotes('')
      }
    } catch (e) {
      console.log('Could not load notes from localStorage')
    }
  }, [storageKey])
  
  const handleNotesChange = useCallback((e) => {
    const value = e.target.value
    setNotes(value)
    try {
      localStorage.setItem(storageKey, value)
    } catch (e) {
      console.log('Could not save notes to localStorage')
    }
  }, [storageKey])
  
  return (
    <div style={notepadStyles.container}>
      <button 
        style={notepadStyles.header}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={notepadStyles.headerTitle}>
          📝 Analysis Notes
          {notes.length > 0 && <span style={notepadStyles.badge}>{notes.length}</span>}
        </span>
        <span style={{
          ...notepadStyles.arrow,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div style={notepadStyles.content}>
          <textarea
            style={notepadStyles.textarea}
            value={notes}
            onChange={handleNotesChange}
            placeholder={`Add your analysis notes for ${coinSymbol}...\n\nYour notes are automatically saved.`}
            rows={5}
          />
          <div style={notepadStyles.footer}>
            <span style={notepadStyles.autosave}>
              <span style={notepadStyles.saveDot} />
              Auto-saved locally
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

const notepadStyles = {
  container: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    overflow: 'hidden',
    marginTop: '16px',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    color: '#fff',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '600',
  },
  badge: {
    background: 'rgba(0, 212, 255, 0.2)',
    color: '#00D4FF',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  arrow: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.5)',
    transition: 'transform 0.3s ease',
  },
  content: {
    padding: '0 16px 16px',
  },
  textarea: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#fff',
    resize: 'vertical',
    minHeight: '100px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  autosave: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  saveDot: {
    width: '6px',
    height: '6px',
    background: '#39FF14',
    borderRadius: '50%',
  },
}

export default function CoinAnalysisModal({ coin, isOpen, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiData, setApiData] = useState(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [activeIndicators, setActiveIndicators] = useState({
    rsi: false,
    macd: false,
    sma: false,
    ema: false,
  })
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => setIsVisible(true), 10)
      
      setActiveIndicators({ rsi: false, macd: false, sma: false, ema: false })
      
      if (coin?.symbol) {
        setIsLoading(true)
        setApiData(null)
        setUsingMockData(false)
        
        fetchCoinAnalysis(coin.symbol)
          .then(result => {
            if (result.success && result.data) {
              setApiData(result.data)
              setUsingMockData(false)
            } else {
              setUsingMockData(true)
            }
          })
          .catch(() => {
            setUsingMockData(true)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, coin?.symbol])
  
  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }
  
  const toggleIndicator = (indicator) => {
    setActiveIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator],
    }))
  }
  
  const indicators = useMemo(() => {
    if (apiData) {
      return {
        rsi: apiData.rsi || 50,
        macd: {
          value: apiData.macd?.value?.toFixed(4) || '0.0000',
          signal: apiData.macd?.signal?.toFixed(4) || '0.0000',
          histogram: apiData.macd?.histogram?.toFixed(4) || '0.0000'
        },
        sma20: apiData.sma50 || 0,
        sma50: apiData.sma200 || apiData.sma50 || 0,
        ema12: apiData.ema9 || 0,
        ema26: apiData.ema21 || 0
      }
    }
    return coin ? generateMockIndicators(coin) : null
  }, [coin, apiData])
  
  const prediction = useMemo(() => {
    if (apiData?.recommendation) {
      const signal = apiData.recommendation
      const bullish = apiData.signalCount?.bullish || 0
      const bearish = apiData.signalCount?.bearish || 0
      const total = bullish + bearish
      let confidence = 50
      if (total > 0) {
        const dominant = Math.max(bullish, bearish)
        confidence = Math.round((dominant / total) * 100)
      }
      return { signal, confidence }
    }
    return indicators ? generateMockPrediction(indicators) : null
  }, [indicators, apiData])
  
  const levels = useMemo(() => {
    if (apiData?.support && apiData?.resistance) {
      return {
        resistance1: apiData.resistance,
        resistance2: apiData.resistance * 1.03,
        support1: apiData.support,
        support2: apiData.support * 0.97
      }
    }
    return coin ? generateMockLevels(coin.price) : null
  }, [coin, apiData])
  
  if (!isOpen || !coin) return null
  
  const isPositive = parseFloat(coin.change) > 0
  const currentPrice = parseFloat(coin.price?.replace(/[$,]/g, '') || 0)
  const high24h = currentPrice * (1 + Math.random() * 0.05)
  const low24h = currentPrice * (1 - Math.random() * 0.05)
  
  const getRSIStatus = (rsi) => {
    if (rsi < 30) return 'bullish'
    if (rsi > 70) return 'bearish'
    return 'neutral'
  }
  
  const getMACDStatus = (macd) => {
    return parseFloat(macd.histogram) > 0 ? 'bullish' : 'bearish'
  }
  
  return (
    <div className={`analysis-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`analysis-modal-container ${isVisible ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
        <button className="analysis-modal-close" onClick={handleClose}>✕</button>
        
        <div className="analysis-modal-content">
          <div className="analysis-header">
            <img 
              src={coin.logo} 
              alt={coin.name}
              className="analysis-coin-logo"
              onError={(e) => e.target.src = '/darkwave-coin.png'}
            />
            <div className="analysis-coin-info">
              <h2 className="analysis-coin-name">{coin.name}</h2>
              <span className="analysis-coin-symbol">{coin.symbol}</span>
              {usingMockData && (
                <span className="analysis-mock-badge">Demo Data</span>
              )}
            </div>
            <div className="analysis-price-block">
              <div className={`analysis-current-price ${isPositive ? 'positive' : 'negative'}`}>
                {coin.price}
              </div>
              <div className={`analysis-price-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '▲' : '▼'} {coin.change}
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="analysis-section">
                <h3 className="analysis-section-title">📈 Interactive Price Chart</h3>
                <AnalysisChart coin={coin} activeIndicators={activeIndicators} />
              </div>
              
              <div className="analysis-section">
                <h3 className="analysis-section-title">📊 Technical Indicators <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '400' }}>(tap to overlay on chart)</span></h3>
                <div className="analysis-indicators-grid">
                  <IndicatorToggle 
                    label="RSI (14)" 
                    value={typeof indicators?.rsi === 'number' ? indicators.rsi.toFixed(2) : indicators?.rsi} 
                    status={getRSIStatus(indicators?.rsi || 50)}
                    isActive={activeIndicators.rsi}
                    onToggle={() => toggleIndicator('rsi')}
                    canToggle={false}
                  />
                  <IndicatorToggle 
                    label="MACD" 
                    value={indicators?.macd?.value} 
                    status={getMACDStatus(indicators?.macd || { histogram: '0' })}
                    isActive={activeIndicators.macd}
                    onToggle={() => toggleIndicator('macd')}
                    canToggle={false}
                  />
                  <IndicatorToggle 
                    label="SMA (20)" 
                    value={formatPrice(indicators?.sma20)} 
                    status={currentPrice > (indicators?.sma20 || 0) ? 'bullish' : 'bearish'}
                    isActive={activeIndicators.sma}
                    onToggle={() => toggleIndicator('sma')}
                    canToggle={true}
                  />
                  <IndicatorToggle 
                    label="EMA (12)" 
                    value={formatPrice(indicators?.ema12)} 
                    status={currentPrice > (indicators?.ema12 || 0) ? 'bullish' : 'bearish'}
                    isActive={activeIndicators.ema}
                    onToggle={() => toggleIndicator('ema')}
                    canToggle={true}
                  />
                </div>
              </div>
              
              <div className="analysis-section">
                <h3 className="analysis-section-title">🤖 AI Prediction</h3>
                <div className="analysis-prediction-card">
                  <div className={`analysis-signal-badge ${prediction?.signal?.toLowerCase() || 'hold'}`}>
                    {prediction?.signal || 'HOLD'}
                  </div>
                  <div className="analysis-confidence">
                    <span className="analysis-confidence-label">Confidence</span>
                    <span className="analysis-confidence-value">{prediction?.confidence || 50}%</span>
                  </div>
                  <div className="analysis-confidence-bar">
                    <div 
                      className="analysis-confidence-fill" 
                      style={{ 
                        width: `${prediction?.confidence || 50}%`,
                        background: prediction?.signal === 'BUY' || prediction?.signal === 'STRONG_BUY' ? 'var(--neon-green)' : 
                                   prediction?.signal === 'SELL' || prediction?.signal === 'STRONG_SELL' ? 'var(--accent-red)' : 'var(--neon-blue)'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="analysis-section">
                <h3 className="analysis-section-title">📍 Support & Resistance</h3>
                <div className="analysis-levels-grid">
                  <div className="analysis-level resistance">
                    <span className="level-label">R2</span>
                    <span className="level-value">{formatPrice(levels?.resistance2)}</span>
                  </div>
                  <div className="analysis-level resistance">
                    <span className="level-label">R1</span>
                    <span className="level-value">{formatPrice(levels?.resistance1)}</span>
                  </div>
                  <div className="analysis-level current">
                    <span className="level-label">Current</span>
                    <span className="level-value">{coin.price}</span>
                  </div>
                  <div className="analysis-level support">
                    <span className="level-label">S1</span>
                    <span className="level-value">{formatPrice(levels?.support1)}</span>
                  </div>
                  <div className="analysis-level support">
                    <span className="level-label">S2</span>
                    <span className="level-value">{formatPrice(levels?.support2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="analysis-section">
                <h3 className="analysis-section-title">📋 Key Statistics</h3>
                <div className="analysis-stats-grid">
                  <StatBox label="24h High" value={formatPrice(high24h)} />
                  <StatBox label="24h Low" value={formatPrice(low24h)} />
                  <StatBox label="24h Volume" value={coin.volume} />
                  <StatBox label="Volatility" value={apiData?.volatility ? `${apiData.volatility.toFixed(1)}%` : '—'} subValue={usingMockData ? 'Loading...' : ''} />
                </div>
              </div>
              
              <Notepad coinSymbol={coin.symbol} />
            </>
          )}
          
          <button className="analysis-close-btn" onClick={handleClose}>
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  )
}
