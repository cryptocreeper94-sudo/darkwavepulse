import { useState, useEffect, useCallback } from 'react'
import TradingViewChart from './TradingViewChart'

const TIMEFRAMES = [
  { id: '1m', label: '1M' },
  { id: '5m', label: '5M' },
  { id: '15m', label: '15M' },
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
]

const INDICATORS = [
  { id: 'ema', label: 'EMA', description: 'Exponential Moving Average' },
  { id: 'rsi', label: 'RSI', description: 'Relative Strength Index' },
  { id: 'macd', label: 'MACD', description: 'Moving Average Convergence Divergence' },
  { id: 'bb', label: 'BB', description: 'Bollinger Bands' },
  { id: 'volume', label: 'VOL', description: 'Volume' },
]

const POPULAR_SYMBOLS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '🔺' },
  { symbol: 'LINK', name: 'Chainlink', icon: '⬡' },
]

export default function AdvancedChartWidget({
  initialSymbol = 'BTC',
  initialTimeframe = '1D',
  height = 500,
  showSymbolSearch = true,
  showTimeframes = true,
  showIndicators = true,
  showPriceInfo = true,
  theme = 'dark',
  onSymbolChange = null,
  className = '',
}) {
  const [symbol, setSymbol] = useState(initialSymbol)
  const [timeframe, setTimeframe] = useState(initialTimeframe)
  const [activeIndicators, setActiveIndicators] = useState(['ema', 'volume'])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)
  const [priceData, setPriceData] = useState({ price: null, change24h: null, loading: true })
  const [isFullscreen, setIsFullscreen] = useState(false)

  const fetchPriceData = useCallback(async () => {
    try {
      const endpoint = symbol === 'BTC' 
        ? '/api/btc-price' 
        : `/api/coin-price?symbol=${symbol}`
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setPriceData({
          price: data.price || data.current_price,
          change24h: data.change24h || data.price_change_percentage_24h,
          loading: false,
        })
      }
    } catch (err) {
      console.log('Price fetch error:', err)
      setPriceData(prev => ({ ...prev, loading: false }))
    }
  }, [symbol])

  useEffect(() => {
    fetchPriceData()
    const interval = setInterval(fetchPriceData, 30000)
    return () => clearInterval(interval)
  }, [fetchPriceData])

  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol)
    setShowSymbolDropdown(false)
    setSearchQuery('')
    setPriceData({ price: null, change24h: null, loading: true })
    onSymbolChange?.(newSymbol)
  }

  const toggleIndicator = (indicatorId) => {
    setActiveIndicators(prev => 
      prev.includes(indicatorId)
        ? prev.filter(id => id !== indicatorId)
        : [...prev, indicatorId]
    )
  }

  const filteredSymbols = POPULAR_SYMBOLS.filter(s =>
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatPrice = (price) => {
    if (!price) return '—'
    if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (price >= 1) return `$${price.toFixed(2)}`
    return `$${price.toFixed(6)}`
  }

  const formatChange = (change) => {
    if (change === null || change === undefined) return null
    const isPositive = change >= 0
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
      isPositive,
    }
  }

  const priceChange = formatChange(priceData.change24h)

  return (
    <div className={`advanced-chart-widget ${isFullscreen ? 'fullscreen' : ''} ${className}`} style={styles.container(isFullscreen, theme)}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {showSymbolSearch && (
            <div style={styles.symbolSelector}>
              <button
                onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
                style={styles.symbolButton(theme)}
              >
                <span style={styles.symbolIcon}>{POPULAR_SYMBOLS.find(s => s.symbol === symbol)?.icon || '🪙'}</span>
                <span style={styles.symbolText}>{symbol}/USD</span>
                <span style={styles.dropdownArrow}>▼</span>
              </button>
              
              {showSymbolDropdown && (
                <div style={styles.dropdown(theme)}>
                  <input
                    type="text"
                    placeholder="Search symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput(theme)}
                    autoFocus
                  />
                  <div style={styles.symbolList}>
                    {filteredSymbols.map(s => (
                      <button
                        key={s.symbol}
                        onClick={() => handleSymbolChange(s.symbol)}
                        style={{
                          ...styles.symbolOption(theme),
                          background: s.symbol === symbol ? 'rgba(0, 212, 255, 0.2)' : 'transparent',
                        }}
                      >
                        <span>{s.icon}</span>
                        <span style={styles.symbolName}>{s.symbol}</span>
                        <span style={styles.symbolFullName}>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {showPriceInfo && (
            <div style={styles.priceInfo}>
              <span style={styles.currentPrice(theme)}>
                {priceData.loading ? '...' : formatPrice(priceData.price)}
              </span>
              {priceChange && (
                <span style={styles.priceChange(priceChange.isPositive)}>
                  {priceChange.value}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={styles.headerRight}>
          {showTimeframes && (
            <div style={styles.timeframeButtons(theme)}>
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  style={{
                    ...styles.tfBtn(theme),
                    ...(timeframe === tf.id ? styles.tfBtnActive(theme) : {}),
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={styles.fullscreenBtn(theme)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
      </div>

      {showIndicators && (
        <div style={styles.indicatorBar(theme)}>
          <span style={styles.indicatorLabel}>Indicators:</span>
          {INDICATORS.map(ind => (
            <button
              key={ind.id}
              onClick={() => toggleIndicator(ind.id)}
              title={ind.description}
              style={{
                ...styles.indicatorBtn(theme),
                ...(activeIndicators.includes(ind.id) ? styles.indicatorBtnActive : {}),
              }}
            >
              {ind.label}
            </button>
          ))}
        </div>
      )}

      <div style={styles.chartWrapper(height, isFullscreen)}>
        <TradingViewChart
          symbol={symbol}
          interval={timeframe}
          theme={theme}
          height={isFullscreen ? window.innerHeight - 150 : height}
          autosize={true}
          indicators={activeIndicators}
          showIndicators={activeIndicators.length > 0}
          showDrawingTools={true}
          allowSymbolChange={false}
        />
      </div>

      <style>{`
        .advanced-chart-widget.fullscreen {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 10000 !important;
          border-radius: 0 !important;
          margin: 0 !important;
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: (isFullscreen, theme) => ({
    background: theme === 'light' 
      ? 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)'
      : 'linear-gradient(145deg, #0f0f0f 0%, #141414 100%)',
    border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: isFullscreen ? 0 : '16px',
    padding: '16px',
    marginBottom: isFullscreen ? 0 : '16px',
    transition: 'all 0.3s ease',
  }),
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  symbolSelector: {
    position: 'relative',
  },
  symbolButton: (theme) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: theme === 'light' ? '#131722' : '#fff',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  }),
  symbolIcon: {
    fontSize: '18px',
  },
  symbolText: {
    fontSize: '14px',
    fontWeight: 700,
  },
  dropdownArrow: {
    fontSize: '8px',
    opacity: 0.6,
    marginLeft: '4px',
  },
  dropdown: (theme) => ({
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    background: theme === 'light' ? '#fff' : '#1a1a1a',
    border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    zIndex: 100,
    minWidth: '220px',
    overflow: 'hidden',
  }),
  searchInput: (theme) => ({
    width: '100%',
    padding: '12px',
    background: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
    border: 'none',
    borderBottom: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
    color: theme === 'light' ? '#131722' : '#fff',
    fontSize: '14px',
    outline: 'none',
  }),
  symbolList: {
    maxHeight: '250px',
    overflowY: 'auto',
  },
  symbolOption: (theme) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: theme === 'light' ? '#131722' : '#fff',
    textAlign: 'left',
    transition: 'background 0.2s ease',
  }),
  symbolName: {
    fontWeight: 600,
    fontSize: '14px',
  },
  symbolFullName: {
    fontSize: '12px',
    opacity: 0.6,
    marginLeft: 'auto',
  },
  priceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  currentPrice: (theme) => ({
    fontSize: '20px',
    fontWeight: 700,
    color: theme === 'light' ? '#131722' : '#fff',
  }),
  priceChange: (isPositive) => ({
    fontSize: '14px',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '6px',
    color: isPositive ? '#39FF14' : '#FF4444',
    background: isPositive ? 'rgba(57,255,20,0.15)' : 'rgba(255,68,68,0.15)',
  }),
  timeframeButtons: (theme) => ({
    display: 'flex',
    gap: '2px',
    background: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '2px',
  }),
  tfBtn: (theme) => ({
    padding: '6px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: theme === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }),
  tfBtnActive: (theme) => ({
    background: 'rgba(0,212,255,0.2)',
    color: '#00D4FF',
    boxShadow: '0 0 10px rgba(0,212,255,0.3)',
  }),
  fullscreenBtn: (theme) => ({
    padding: '8px 12px',
    background: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    color: theme === 'light' ? '#131722' : '#fff',
    transition: 'all 0.2s ease',
  }),
  indicatorBar: (theme) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    padding: '10px 0',
    marginBottom: '8px',
    borderBottom: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
  }),
  indicatorLabel: {
    fontSize: '12px',
    color: 'rgba(156,163,175,1)',
    fontWeight: 500,
    marginRight: '4px',
  },
  indicatorBtn: (theme) => ({
    padding: '5px 10px',
    background: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    color: theme === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
    transition: 'all 0.2s ease',
  }),
  indicatorBtnActive: {
    background: 'rgba(139,92,246,0.2)',
    color: '#8B5CF6',
    boxShadow: '0 0 8px rgba(139,92,246,0.3)',
  },
  chartWrapper: (height, isFullscreen) => ({
    height: isFullscreen ? 'calc(100vh - 150px)' : height,
    borderRadius: '8px',
    overflow: 'hidden',
  }),
}
