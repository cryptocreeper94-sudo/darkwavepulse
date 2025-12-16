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
      onClick={handleClick}
      style={{
        cursor: canToggle ? 'pointer' : 'default',
        background: isActive ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
        border: isActive ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        transition: 'all 0.2s ease',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px', fontWeight: '500' }}>
        {canToggle && (
          <span style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            border: isActive ? '2px solid #00D4FF' : '2px solid rgba(255,255,255,0.3)',
            background: isActive ? '#00D4FF' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: '#000',
            transition: 'all 0.2s ease',
          }}>
            {isActive && '✓'}
          </span>
        )}
        {label}
      </span>
      <span style={{ color: statusColor, fontSize: '14px', fontWeight: '600' }}>{value}</span>
    </div>
  )
}

function StatBox({ label, value, subValue }) {
  return (
    <div style={pageStyles.statBox}>
      <div style={pageStyles.statLabel}>{label}</div>
      <div style={pageStyles.statValue}>{value}</div>
      {subValue && <div style={pageStyles.statSub}>{subValue}</div>}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={pageStyles.loading}>
      <div style={pageStyles.spinner}></div>
      <span>Loading analysis...</span>
    </div>
  )
}

function Notepad({ coinSymbol }) {
  const [isExpanded, setIsExpanded] = useState(true)
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
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          transition: 'transform 0.3s ease',
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
            rows={6}
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
    background: 'linear-gradient(145deg, rgba(15, 15, 15, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    color: '#fff',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    fontWeight: '600',
  },
  badge: {
    background: 'rgba(0, 212, 255, 0.2)',
    color: '#00D4FF',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '12px',
  },
  content: {
    padding: '0 20px 20px',
  },
  textarea: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#fff',
    resize: 'vertical',
    minHeight: '120px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '10px',
  },
  autosave: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  saveDot: {
    width: '8px',
    height: '8px',
    background: '#39FF14',
    borderRadius: '50%',
  },
}

const pageStyles = {
  container: {
    minHeight: '100vh',
    paddingBottom: '100px',
  },
  coinInfoBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    padding: '8px 0',
  },
  coinLogoSmall: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    objectFit: 'cover',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  coinInfoText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  coinNameSmall: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
  },
  coinSymbolSmall: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingTop: '8px',
  },
  backButton: {
    width: '44px',
    height: '44px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  coinInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
  },
  coinLogo: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    objectFit: 'cover',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  coinDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  coinName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  coinSymbol: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  mockBadge: {
    background: 'rgba(255, 193, 7, 0.2)',
    color: '#FFC107',
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  priceBlock: {
    textAlign: 'right',
    flexShrink: 0,
  },
  currentPrice: {
    fontSize: '22px',
    fontWeight: '700',
  },
  priceChange: {
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '2px',
  },
  chartSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bentoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  bentoCard: {
    background: 'linear-gradient(145deg, rgba(15, 15, 15, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  indicatorsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  predictionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  signalBadge: {
    fontSize: '20px',
    fontWeight: '800',
    padding: '12px 28px',
    borderRadius: '12px',
    letterSpacing: '1px',
  },
  confidenceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  confidenceValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  confidenceBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  levelsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  levelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
  },
  levelLabel: {
    fontSize: '13px',
    fontWeight: '600',
  },
  levelValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  statBox: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '14px',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
  },
  statSub: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: '4px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '60px 20px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(0, 212, 255, 0.2)',
    borderTopColor: '#00D4FF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
}

export default function AnalysisTab({ coin, onBack }) {
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
    if (coin?.symbol) {
      setIsLoading(true)
      setApiData(null)
      setUsingMockData(false)
      setActiveIndicators({ rsi: false, macd: false, sma: false, ema: false })
      
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
  }, [coin?.symbol])
  
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
  
  if (!coin) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.header}>
          <button style={pageStyles.backButton} onClick={onBack}>←</button>
          <h2 style={{ color: '#fff', margin: 0 }}>No coin selected</h2>
        </div>
      </div>
    )
  }
  
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
  
  const getSignalColor = (signal) => {
    if (signal === 'BUY' || signal === 'STRONG_BUY') return { bg: 'rgba(57, 255, 20, 0.2)', color: '#39FF14' }
    if (signal === 'SELL' || signal === 'STRONG_SELL') return { bg: 'rgba(255, 68, 68, 0.2)', color: '#FF4444' }
    return { bg: 'rgba(0, 212, 255, 0.2)', color: '#00D4FF' }
  }
  
  const signalColors = getSignalColor(prediction?.signal)
  
  return (
    <div style={pageStyles.container}>
      <div style={pageStyles.coinInfoBar}>
        <img 
          src={coin?.logo || '/darkwave-coin.png'} 
          alt={coin?.name || 'Coin'}
          style={pageStyles.coinLogoSmall}
          onError={(e) => e.target.src = '/darkwave-coin.png'}
        />
        <div style={pageStyles.coinInfoText}>
          <span style={pageStyles.coinNameSmall}>{coin?.name || 'Unknown'}</span>
          <span style={pageStyles.coinSymbolSmall}>{coin?.symbol || '—'}</span>
        </div>
        {usingMockData && <span style={pageStyles.mockBadge}>Demo</span>}
      </div>
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div style={pageStyles.chartSection}>
            <AnalysisChart coin={coin} activeIndicators={activeIndicators} fullWidth />
          </div>
          
          <div style={pageStyles.bentoGrid}>
            <div style={pageStyles.bentoCard}>
              <h3 style={pageStyles.sectionTitle}>
                📊 Technical Indicators
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '400' }}>(tap to overlay)</span>
              </h3>
              <div style={pageStyles.indicatorsGrid}>
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
            
            <div style={pageStyles.bentoCard}>
              <h3 style={pageStyles.sectionTitle}>🤖 AI Prediction</h3>
              <div style={pageStyles.predictionCard}>
                <div style={{
                  ...pageStyles.signalBadge,
                  background: signalColors.bg,
                  color: signalColors.color,
                  boxShadow: `0 0 20px ${signalColors.bg}`,
                }}>
                  {prediction?.signal || 'HOLD'}
                </div>
                <div style={pageStyles.confidenceRow}>
                  <span style={pageStyles.confidenceLabel}>Confidence</span>
                  <span style={pageStyles.confidenceValue}>{prediction?.confidence || 50}%</span>
                </div>
                <div style={pageStyles.confidenceBar}>
                  <div 
                    style={{
                      ...pageStyles.confidenceFill,
                      width: `${prediction?.confidence || 50}%`,
                      background: signalColors.color,
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={pageStyles.bentoCard}>
              <h3 style={pageStyles.sectionTitle}>📍 Support & Resistance</h3>
              <div style={pageStyles.levelsGrid}>
                <div style={{ ...pageStyles.levelRow, borderLeft: '3px solid #FF4444' }}>
                  <span style={{ ...pageStyles.levelLabel, color: '#FF4444' }}>R2</span>
                  <span style={pageStyles.levelValue}>{formatPrice(levels?.resistance2)}</span>
                </div>
                <div style={{ ...pageStyles.levelRow, borderLeft: '3px solid #FF6B6B' }}>
                  <span style={{ ...pageStyles.levelLabel, color: '#FF6B6B' }}>R1</span>
                  <span style={pageStyles.levelValue}>{formatPrice(levels?.resistance1)}</span>
                </div>
                <div style={{ ...pageStyles.levelRow, borderLeft: '3px solid #00D4FF', background: 'rgba(0, 212, 255, 0.1)' }}>
                  <span style={{ ...pageStyles.levelLabel, color: '#00D4FF' }}>Current</span>
                  <span style={pageStyles.levelValue}>{coin.price}</span>
                </div>
                <div style={{ ...pageStyles.levelRow, borderLeft: '3px solid #39FF14' }}>
                  <span style={{ ...pageStyles.levelLabel, color: '#39FF14' }}>S1</span>
                  <span style={pageStyles.levelValue}>{formatPrice(levels?.support1)}</span>
                </div>
                <div style={{ ...pageStyles.levelRow, borderLeft: '3px solid #2ECC71' }}>
                  <span style={{ ...pageStyles.levelLabel, color: '#2ECC71' }}>S2</span>
                  <span style={pageStyles.levelValue}>{formatPrice(levels?.support2)}</span>
                </div>
              </div>
            </div>
            
            <div style={pageStyles.bentoCard}>
              <h3 style={pageStyles.sectionTitle}>📋 Key Statistics</h3>
              <div style={pageStyles.statsGrid}>
                <StatBox label="24h High" value={formatPrice(high24h)} />
                <StatBox label="24h Low" value={formatPrice(low24h)} />
                <StatBox label="24h Volume" value={coin.volume} />
                <StatBox label="Volatility" value={apiData?.volatility ? `${apiData.volatility.toFixed(1)}%` : '—'} subValue={usingMockData ? 'Loading...' : ''} />
              </div>
            </div>
          </div>
          
          <Notepad coinSymbol={coin.symbol} />
        </>
      )}
    </div>
  )
}

const spinnerStyle = document.createElement('style')
spinnerStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
if (!document.querySelector('[data-analysis-tab-spinner]')) {
  spinnerStyle.setAttribute('data-analysis-tab-spinner', 'true')
  document.head.appendChild(spinnerStyle)
}
