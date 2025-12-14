import { useState, useEffect, useRef, useCallback } from 'react'
import { createChart, CandlestickSeries, AreaSeries, LineSeries } from 'lightweight-charts'
import { createPortal } from 'react-dom'

const TIMEFRAMES = [
  { id: '1S', label: '1S', days: 0, isLive: true },
  { id: '1D', label: '1D', days: 1 },
  { id: '7D', label: '7D', days: 7 },
  { id: '30D', label: '30D', days: 30 },
  { id: '1Y', label: '1Y', days: 365 },
  { id: 'ALL', label: 'ALL', days: 'max' },
]

const DEFAULT_COLORS = {
  upColor: '#39FF14',
  downColor: '#FF4444',
  lineColor: '#00D4FF',
  areaTopColor: 'rgba(0, 212, 255, 0.4)',
  areaBottomColor: 'rgba(0, 212, 255, 0.05)',
}

const INDICATOR_COLORS = {
  sma: '#FFD700',
  ema: '#FF6B9D',
}

function generateSampleOHLC(days = 30, basePrice = 100) {
  const data = []
  const now = Math.floor(Date.now() / 1000)
  const interval = days <= 1 ? 3600 : days <= 7 ? 3600 * 6 : 86400
  const points = days <= 1 ? 24 : days <= 7 ? 28 : Math.min(days, 365)
  
  let price = basePrice
  
  for (let i = points - 1; i >= 0; i--) {
    const time = now - i * interval
    const volatility = 0.03
    const change = (Math.random() - 0.5) * 2 * volatility
    const open = price
    const close = open * (1 + change)
    const high = Math.max(open, close) * (1 + Math.random() * 0.015)
    const low = Math.min(open, close) * (1 - Math.random() * 0.015)
    
    data.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    })
    
    price = close
  }
  
  return data
}

function calculateSMA(data, period) {
  const result = []
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    result.push({
      time: data[i].time,
      value: sum / period,
    })
  }
  return result
}

function calculateEMA(data, period) {
  const result = []
  const multiplier = 2 / (period + 1)
  let ema = data[0].close
  
  for (let i = 0; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema
    if (i >= period - 1) {
      result.push({
        time: data[i].time,
        value: ema,
      })
    }
  }
  return result
}

function FullscreenPortal({ children, isOpen, onClose }) {
  if (!isOpen) return null
  
  return createPortal(
    <div style={styles.fullscreenOverlay} onClick={onClose}>
      <div style={styles.fullscreenContainer} onClick={e => e.stopPropagation()}>
        <button style={styles.fullscreenClose} onClick={onClose}>✕</button>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default function AnalysisChart({ coin, activeIndicators = {}, fullWidth = false }) {
  const chartContainerRef = useRef(null)
  const fullscreenChartRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const fullscreenChartInstance = useRef(null)
  const basePriceRef = useRef(null)
  
  const [chartType, setChartType] = useState('candlestick')
  const [timeframe, setTimeframe] = useState('7D')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [priceInfo, setPriceInfo] = useState({ lastPrice: null, priceChange: null })

  const coinSymbol = coin?.symbol || 'BTC'
  const coinPrice = coin?.price
  const showSma = !!activeIndicators.sma
  const showEma = !!activeIndicators.ema

  const fetchLivePrice = useCallback(async () => {
    const symbol = coinSymbol?.toUpperCase() || 'BTC'
    try {
      const endpoint = symbol === 'BTC' ? '/api/crypto/btc-price' : `/api/crypto/coin-price?symbol=${symbol}`
      const response = await fetch(endpoint)
      if (response.ok) {
        const priceData = await response.json()
        const price = priceData?.price || priceData?.current_price
        if (price) {
          const now = Math.floor(Date.now() / 1000)
          
          setData(prev => {
            const newPoint = {
              time: now,
              open: price,
              high: price,
              low: price,
              close: price,
            }
            
            if (prev.length === 0) {
              basePriceRef.current = price
              return [newPoint]
            }
            
            const updated = [...prev]
            const lastPoint = updated[updated.length - 1]
            
            if (now - lastPoint.time < 1) {
              lastPoint.close = price
              lastPoint.high = Math.max(lastPoint.high, price)
              lastPoint.low = Math.min(lastPoint.low, price)
            } else {
              updated.push(newPoint)
              if (updated.length > 120) updated.shift()
            }
            
            return updated
          })
          
          setPriceInfo(prev => {
            const change = basePriceRef.current 
              ? ((price - basePriceRef.current) / basePriceRef.current) * 100
              : 0
            return {
              lastPrice: price,
              priceChange: change.toFixed(2),
            }
          })
        }
      }
    } catch (err) {
      console.log('Live price fetch error')
    }
  }, [coinSymbol])

  useEffect(() => {
    let cancelled = false
    const selectedTimeframe = TIMEFRAMES.find(t => t.id === timeframe)
    
    basePriceRef.current = null
    
    if (selectedTimeframe?.isLive) {
      setData([])
      setIsLoading(false)
      return
    }
    
    async function fetchData() {
      const days = selectedTimeframe?.days === 'max' ? 1825 : (selectedTimeframe?.days || 7)
      const symbol = coinSymbol?.toUpperCase() || 'BTC'
      
      setIsLoading(true)
      
      try {
        const response = await fetch(`/api/crypto/coin-history?symbol=${symbol}&days=${days}`)
        if (response.ok && !cancelled) {
          const apiData = await response.json()
          if (apiData && apiData.length > 0) {
            setData(apiData)
            if (apiData[0]) basePriceRef.current = apiData[0].open
            setIsLoading(false)
            return
          }
        }
      } catch (err) {
        console.log('API unavailable, using sample data')
      }
      
      if (!cancelled) {
        const basePrice = parseFloat(coinPrice?.replace(/[$,]/g, '') || 100)
        const sampleData = generateSampleOHLC(days, basePrice)
        setData(sampleData)
        if (sampleData[0]) basePriceRef.current = sampleData[0].open
        setIsLoading(false)
      }
    }
    
    fetchData()
    
    return () => { cancelled = true }
  }, [timeframe, coinSymbol, coinPrice])

  useEffect(() => {
    const selectedTimeframe = TIMEFRAMES.find(t => t.id === timeframe)
    
    if (selectedTimeframe?.isLive) {
      fetchLivePrice()
      const liveInterval = setInterval(fetchLivePrice, 1000)
      return () => clearInterval(liveInterval)
    }
  }, [timeframe, fetchLivePrice])

  useEffect(() => {
    if (data.length > 0) {
      const latest = data[data.length - 1]
      const first = data[0]
      const change = ((latest.close - first.open) / first.open) * 100
      setPriceInfo({
        lastPrice: latest.close,
        priceChange: change.toFixed(2),
      })
    }
  }, [data])

  useEffect(() => {
    if (!chartContainerRef.current) return

    let chart = null
    let isActive = true

    try {
      if (chartRef.current) {
        try { chartRef.current.remove() } catch (e) {}
        chartRef.current = null
        seriesRef.current = null
      }

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: 'transparent' },
          textColor: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.06)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.06)' },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: DEFAULT_COLORS.lineColor, width: 1, style: 2, labelBackgroundColor: DEFAULT_COLORS.lineColor },
          horzLine: { color: DEFAULT_COLORS.lineColor, width: 1, style: 2, labelBackgroundColor: DEFAULT_COLORS.lineColor },
        },
        rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)', scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true, secondsVisible: true },
        handleScale: { mouseWheel: true, pinch: true },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, touch: true },
      })

      if (!isActive) {
        chart.remove()
        return
      }

      chartRef.current = chart

      // For live mode (1S), always use area chart since we only have point prices
      const selectedTimeframe = TIMEFRAMES.find(t => t.id === timeframe)
      const useCandlestick = chartType === 'candlestick' && !selectedTimeframe?.isLive

      let series
      if (useCandlestick) {
        series = chart.addSeries(CandlestickSeries, {
          upColor: DEFAULT_COLORS.upColor,
          downColor: DEFAULT_COLORS.downColor,
          borderUpColor: DEFAULT_COLORS.upColor,
          borderDownColor: DEFAULT_COLORS.downColor,
          wickUpColor: DEFAULT_COLORS.upColor,
          wickDownColor: DEFAULT_COLORS.downColor,
        })
      } else {
        series = chart.addSeries(AreaSeries, {
          lineColor: DEFAULT_COLORS.lineColor,
          topColor: DEFAULT_COLORS.areaTopColor,
          bottomColor: DEFAULT_COLORS.areaBottomColor,
          lineWidth: 2,
        })
      }

      seriesRef.current = series

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          try {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight,
            })
          } catch (e) {}
        }
      }

      window.addEventListener('resize', handleResize)
      handleResize()

      const delayedResize = setTimeout(() => {
        handleResize()
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent()
        }
      }, 100)

      return () => {
        clearTimeout(delayedResize)
        isActive = false
        window.removeEventListener('resize', handleResize)
        if (chart) {
          try { chart.remove() } catch (e) {}
        }
        chartRef.current = null
        seriesRef.current = null
      }
    } catch (err) {
      console.log('Chart initialization error:', err)
    }
  }, [chartType, timeframe])

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return

    try {
      if (data.length > 0) {
        // For live mode (1S), always use area format since we only have point prices
        const selectedTimeframe = TIMEFRAMES.find(t => t.id === timeframe)
        const useCandlestick = chartType === 'candlestick' && !selectedTimeframe?.isLive
        
        if (useCandlestick) {
          seriesRef.current.setData(data)
        } else {
          seriesRef.current.setData(data.map(d => ({ time: d.time, value: d.close })))
        }
      }

      if (showSma && data.length >= 20 && chartRef.current) {
        const smaData = calculateSMA(data, 20)
        const smaSeries = chartRef.current.addSeries(LineSeries, {
          color: INDICATOR_COLORS.sma,
          lineWidth: 1,
          lineStyle: 0,
          priceLineVisible: false,
        })
        smaSeries.setData(smaData)
      }

      if (showEma && data.length >= 12 && chartRef.current) {
        const emaData = calculateEMA(data, 12)
        const emaSeries = chartRef.current.addSeries(LineSeries, {
          color: INDICATOR_COLORS.ema,
          lineWidth: 1,
          lineStyle: 0,
          priceLineVisible: false,
        })
        emaSeries.setData(emaData)
      }

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    } catch (err) {
      console.log('Chart data update error:', err)
    }
  }, [data, chartType, timeframe, showSma, showEma])

  useEffect(() => {
    if (!isFullscreen || !fullscreenChartRef.current || data.length === 0) {
      if (fullscreenChartInstance.current) {
        try { fullscreenChartInstance.current.remove() } catch (e) {}
        fullscreenChartInstance.current = null
      }
      return
    }

    const timer = setTimeout(() => {
      if (fullscreenChartInstance.current) {
        try { fullscreenChartInstance.current.remove() } catch (e) {}
      }

      const chart = createChart(fullscreenChartRef.current, {
        layout: { background: { type: 'solid', color: 'transparent' }, textColor: 'rgba(255, 255, 255, 0.7)' },
        grid: { vertLines: { color: 'rgba(255, 255, 255, 0.06)' }, horzLines: { color: 'rgba(255, 255, 255, 0.06)' } },
        crosshair: {
          mode: 1,
          vertLine: { color: DEFAULT_COLORS.lineColor, width: 1, style: 2, labelBackgroundColor: DEFAULT_COLORS.lineColor },
          horzLine: { color: DEFAULT_COLORS.lineColor, width: 1, style: 2, labelBackgroundColor: DEFAULT_COLORS.lineColor },
        },
        rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)', scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true, secondsVisible: true },
        handleScale: { mouseWheel: true, pinch: true },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, touch: true },
      })

      fullscreenChartInstance.current = chart

      // For live mode (1S), always use area chart since we only have point prices
      const selectedTimeframe = TIMEFRAMES.find(t => t.id === timeframe)
      const useCandlestick = chartType === 'candlestick' && !selectedTimeframe?.isLive

      if (useCandlestick) {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: DEFAULT_COLORS.upColor,
          downColor: DEFAULT_COLORS.downColor,
          borderUpColor: DEFAULT_COLORS.upColor,
          borderDownColor: DEFAULT_COLORS.downColor,
          wickUpColor: DEFAULT_COLORS.upColor,
          wickDownColor: DEFAULT_COLORS.downColor,
        })
        series.setData(data)
      } else {
        const series = chart.addSeries(AreaSeries, {
          lineColor: DEFAULT_COLORS.lineColor,
          topColor: DEFAULT_COLORS.areaTopColor,
          bottomColor: DEFAULT_COLORS.areaBottomColor,
          lineWidth: 2,
        })
        series.setData(data.map(d => ({ time: d.time, value: d.close })))
      }

      if (showSma && data.length >= 20) {
        const smaData = calculateSMA(data, 20)
        const smaSeries = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.sma,
          lineWidth: 1,
          priceLineVisible: false,
        })
        smaSeries.setData(smaData)
      }

      if (showEma && data.length >= 12) {
        const emaData = calculateEMA(data, 12)
        const emaSeries = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.ema,
          lineWidth: 1,
          priceLineVisible: false,
        })
        emaSeries.setData(emaData)
      }

      chart.timeScale().fitContent()

      try {
        chart.applyOptions({
          width: fullscreenChartRef.current.clientWidth,
          height: fullscreenChartRef.current.clientHeight,
        })
      } catch (e) {}
    }, 100)

    return () => {
      clearTimeout(timer)
      if (fullscreenChartInstance.current) {
        try { fullscreenChartInstance.current.remove() } catch (e) {}
        fullscreenChartInstance.current = null
      }
    }
  }, [isFullscreen, data, chartType, timeframe, showSma, showEma])

  const symbol = coinSymbol?.toUpperCase() || 'BTC'
  const { lastPrice, priceChange } = priceInfo
  const selectedTimeframe = TIMEFRAMES.find(t => t.id === timeframe)
  const isLive = selectedTimeframe?.isLive

  const renderIndicatorLegend = () => {
    const active = []
    if (showSma) active.push({ name: 'SMA(20)', color: INDICATOR_COLORS.sma })
    if (showEma) active.push({ name: 'EMA(12)', color: INDICATOR_COLORS.ema })
    
    if (active.length === 0) return null
    
    return (
      <div style={styles.indicatorLegend}>
        {active.map(ind => (
          <span key={ind.name} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: ind.color }} />
            {ind.name}
          </span>
        ))}
      </div>
    )
  }

  const chartHeight = fullWidth ? '320px' : '220px'

  return (
    <>
      <div style={styles.container}>
        <div style={styles.chartHeader}>
          <div style={styles.chartTitle}>
            <span style={styles.symbol}>{symbol}/USD</span>
            {isLive && (
              <span style={styles.liveBadge}>
                <span style={styles.liveDot} />
                LIVE
              </span>
            )}
            {lastPrice && (
              <span style={styles.priceInfo}>
                <span style={styles.currentPrice}>${lastPrice.toLocaleString()}</span>
                {priceChange && (
                  <span style={{
                    ...styles.priceChange,
                    color: parseFloat(priceChange) >= 0 ? '#39FF14' : '#FF4444',
                    background: parseFloat(priceChange) >= 0 ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 68, 68, 0.15)',
                  }}>
                    {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}%
                  </span>
                )}
              </span>
            )}
          </div>
          <div style={styles.chartControls}>
            <div style={styles.chartTypeToggle}>
              <button style={{ ...styles.toggleBtn, ...(chartType === 'candlestick' ? styles.toggleBtnActive : {}) }} onClick={() => setChartType('candlestick')} title="Candlestick">📊</button>
              <button style={{ ...styles.toggleBtn, ...(chartType === 'area' ? styles.toggleBtnActive : {}) }} onClick={() => setChartType('area')} title="Area">📈</button>
            </div>
            <div style={styles.timeframeButtons}>
              {TIMEFRAMES.map(tf => (
                <button 
                  key={tf.id} 
                  style={{ 
                    ...styles.tfBtn, 
                    ...(timeframe === tf.id ? styles.tfBtnActive : {}),
                    ...(tf.isLive ? styles.tfBtnLive : {}),
                  }} 
                  onClick={() => setTimeframe(tf.id)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            <button style={styles.actionBtn} onClick={() => setIsFullscreen(true)} title="Fullscreen">⛶</button>
          </div>
        </div>

        {renderIndicatorLegend()}

        <div style={{ ...styles.chartWrapper, height: chartHeight }} ref={chartContainerRef}>
          {isLoading && !isLive && (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <span>Loading chart...</span>
            </div>
          )}
          {isLive && data.length === 0 && (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <span>Connecting to live feed...</span>
            </div>
          )}
        </div>
      </div>

      <FullscreenPortal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <div style={styles.fullscreenHeader}>
          <div style={styles.chartTitle}>
            <span style={styles.symbol}>{symbol}/USD</span>
            {isLive && (
              <span style={styles.liveBadge}>
                <span style={styles.liveDot} />
                LIVE
              </span>
            )}
            {lastPrice && (
              <span style={styles.priceInfo}>
                <span style={styles.currentPrice}>${lastPrice.toLocaleString()}</span>
              </span>
            )}
          </div>
          <div style={styles.chartControls}>
            <div style={styles.chartTypeToggle}>
              <button style={{ ...styles.toggleBtn, ...(chartType === 'candlestick' ? styles.toggleBtnActive : {}) }} onClick={() => setChartType('candlestick')}>📊</button>
              <button style={{ ...styles.toggleBtn, ...(chartType === 'area' ? styles.toggleBtnActive : {}) }} onClick={() => setChartType('area')}>📈</button>
            </div>
            <div style={styles.timeframeButtons}>
              {TIMEFRAMES.map(tf => (
                <button 
                  key={tf.id} 
                  style={{ 
                    ...styles.tfBtn, 
                    ...(timeframe === tf.id ? styles.tfBtnActive : {}),
                    ...(tf.isLive ? styles.tfBtnLive : {}),
                  }} 
                  onClick={() => setTimeframe(tf.id)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {renderIndicatorLegend()}
        <div style={styles.fullscreenChart} ref={fullscreenChartRef} />
      </FullscreenPortal>
    </>
  )
}

const styles = {
  container: {
    background: 'linear-gradient(145deg, #0f0f0f 0%, #141414 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '12px',
  },
  chartHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  chartTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  symbol: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(57, 255, 20, 0.15)',
    color: '#39FF14',
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    background: '#39FF14',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite',
  },
  priceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  currentPrice: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
  },
  priceChange: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  chartControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  chartTypeToggle: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '2px',
  },
  toggleBtn: {
    padding: '6px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  toggleBtnActive: {
    background: 'rgba(0, 212, 255, 0.2)',
    boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
  },
  timeframeButtons: {
    display: 'flex',
    gap: '2px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '2px',
  },
  tfBtn: {
    padding: '5px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tfBtnActive: {
    background: 'rgba(0, 212, 255, 0.2)',
    color: '#00D4FF',
    boxShadow: '0 0 8px rgba(0, 212, 255, 0.3)',
  },
  tfBtnLive: {
    color: 'rgba(57, 255, 20, 0.8)',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    color: '#fff',
  },
  indicatorLegend: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  chartWrapper: {
    height: '220px',
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'rgba(0, 0, 0, 0.6)',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '13px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid rgba(0, 212, 255, 0.2)',
    borderTopColor: '#00D4FF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  fullscreenOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
  },
  fullscreenContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a0a',
    borderRadius: '12px',
    padding: '16px',
    position: 'relative',
  },
  fullscreenClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    background: 'rgba(255, 68, 68, 0.2)',
    border: '1px solid rgba(255, 68, 68, 0.4)',
    borderRadius: '50%',
    color: '#FF4444',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'all 0.2s ease',
  },
  fullscreenHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    paddingRight: '50px',
  },
  fullscreenChart: {
    flex: 1,
    minHeight: '300px',
    borderRadius: '8px',
    overflow: 'hidden',
  },
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`
if (!document.querySelector('[data-analysis-chart-styles]')) {
  styleSheet.setAttribute('data-analysis-chart-styles', 'true')
  document.head.appendChild(styleSheet)
}
