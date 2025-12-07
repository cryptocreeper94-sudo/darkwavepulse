import { useState, useEffect, useMemo } from 'react'

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

function generateSparklineData(isPositive) {
  const points = []
  let value = 50
  for (let i = 0; i < 48; i++) {
    value += (Math.random() - (isPositive ? 0.45 : 0.55)) * 3
    value = Math.max(20, Math.min(80, value))
    points.push(value)
  }
  return points
}

function SparklineChart({ data, isPositive }) {
  const width = 300
  const height = 100
  const padding = 5
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((val - min) / range) * (height - 2 * padding)
    return `${x},${y}`
  }).join(' ')
  
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkGrad-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? 'rgba(57, 255, 20, 0.3)' : 'rgba(255, 68, 68, 0.3)'} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <polygon 
        points={areaPoints} 
        fill={`url(#sparkGrad-${isPositive ? 'up' : 'down'})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? '#39FF14' : '#FF4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IndicatorRow({ label, value, status }) {
  let statusColor = 'var(--text-secondary)'
  if (status === 'bullish') statusColor = 'var(--neon-green)'
  if (status === 'bearish') statusColor = 'var(--accent-red)'
  if (status === 'neutral') statusColor = 'var(--text-muted)'
  
  return (
    <div className="analysis-indicator-row">
      <span className="analysis-indicator-label">{label}</span>
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

export default function CoinAnalysisModal({ coin, isOpen, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }
  
  const indicators = useMemo(() => coin ? generateMockIndicators(coin) : null, [coin])
  const prediction = useMemo(() => indicators ? generateMockPrediction(indicators) : null, [indicators])
  const levels = useMemo(() => coin ? generateMockLevels(coin.price) : null, [coin])
  const sparklineData = useMemo(() => {
    if (!coin) return []
    const isPositive = parseFloat(coin.change) > 0
    return generateSparklineData(isPositive)
  }, [coin])
  
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
          
          <div className="analysis-section">
            <h3 className="analysis-section-title">📈 Price Chart (48h)</h3>
            <div className="analysis-chart-container">
              <SparklineChart data={sparklineData} isPositive={isPositive} />
            </div>
          </div>
          
          <div className="analysis-section">
            <h3 className="analysis-section-title">📊 Technical Indicators</h3>
            <div className="analysis-indicators-grid">
              <IndicatorRow 
                label="RSI (14)" 
                value={indicators.rsi} 
                status={getRSIStatus(indicators.rsi)}
              />
              <IndicatorRow 
                label="MACD" 
                value={indicators.macd.value} 
                status={getMACDStatus(indicators.macd)}
              />
              <IndicatorRow 
                label="Signal Line" 
                value={indicators.macd.signal} 
                status={getMACDStatus(indicators.macd)}
              />
              <IndicatorRow 
                label="SMA (20)" 
                value={formatPrice(indicators.sma20)} 
                status={currentPrice > indicators.sma20 ? 'bullish' : 'bearish'}
              />
              <IndicatorRow 
                label="SMA (50)" 
                value={formatPrice(indicators.sma50)} 
                status={currentPrice > indicators.sma50 ? 'bullish' : 'bearish'}
              />
              <IndicatorRow 
                label="EMA (12)" 
                value={formatPrice(indicators.ema12)} 
                status={currentPrice > indicators.ema12 ? 'bullish' : 'bearish'}
              />
            </div>
          </div>
          
          <div className="analysis-section">
            <h3 className="analysis-section-title">🤖 AI Prediction</h3>
            <div className="analysis-prediction-card">
              <div className={`analysis-signal-badge ${prediction.signal.toLowerCase()}`}>
                {prediction.signal}
              </div>
              <div className="analysis-confidence">
                <span className="analysis-confidence-label">Confidence</span>
                <span className="analysis-confidence-value">{prediction.confidence}%</span>
              </div>
              <div className="analysis-confidence-bar">
                <div 
                  className="analysis-confidence-fill" 
                  style={{ 
                    width: `${prediction.confidence}%`,
                    background: prediction.signal === 'BUY' ? 'var(--neon-green)' : 
                               prediction.signal === 'SELL' ? 'var(--accent-red)' : 'var(--neon-blue)'
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
                <span className="level-value">{formatPrice(levels.resistance2)}</span>
              </div>
              <div className="analysis-level resistance">
                <span className="level-label">R1</span>
                <span className="level-value">{formatPrice(levels.resistance1)}</span>
              </div>
              <div className="analysis-level current">
                <span className="level-label">Current</span>
                <span className="level-value">{coin.price}</span>
              </div>
              <div className="analysis-level support">
                <span className="level-label">S1</span>
                <span className="level-value">{formatPrice(levels.support1)}</span>
              </div>
              <div className="analysis-level support">
                <span className="level-label">S2</span>
                <span className="level-value">{formatPrice(levels.support2)}</span>
              </div>
            </div>
          </div>
          
          <div className="analysis-section">
            <h3 className="analysis-section-title">📋 Key Statistics</h3>
            <div className="analysis-stats-grid">
              <StatBox label="24h High" value={formatPrice(high24h)} />
              <StatBox label="24h Low" value={formatPrice(low24h)} />
              <StatBox label="24h Volume" value={coin.volume} />
              <StatBox label="Market Cap" value="—" subValue="Loading..." />
            </div>
          </div>
          
          <button className="analysis-close-btn" onClick={handleClose}>
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  )
}
