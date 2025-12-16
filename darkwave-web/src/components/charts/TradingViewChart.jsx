import { useEffect, useRef, memo } from 'react'

const CRYPTO_SYMBOLS = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  SOL: 'BINANCE:SOLUSDT',
  DOGE: 'BINANCE:DOGEUSDT',
  XRP: 'BINANCE:XRPUSDT',
  ADA: 'BINANCE:ADAUSDT',
  AVAX: 'BINANCE:AVAXUSDT',
  DOT: 'BINANCE:DOTUSDT',
  LINK: 'BINANCE:LINKUSDT',
  MATIC: 'BINANCE:MATICUSDT',
  SHIB: 'BINANCE:SHIBUSDT',
  LTC: 'BINANCE:LTCUSDT',
  ATOM: 'BINANCE:ATOMUSDT',
  UNI: 'BINANCE:UNIUSDT',
  XLM: 'BINANCE:XLMUSDT',
  BTCUSD: 'BINANCE:BTCUSDT',
  ETHUSD: 'BINANCE:ETHUSDT',
  SOLUSD: 'BINANCE:SOLUSDT',
}

const TIMEFRAME_MAP = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '4h': '240',
  '1D': 'D',
  '1W': 'W',
  '1M': 'M',
}

const DEFAULT_STUDIES = [
  'MASimple@tv-basicstudies',
  'RSI@tv-basicstudies',
  'MACD@tv-basicstudies',
  'BB@tv-basicstudies',
]

function TradingViewChart({
  symbol = 'BTC',
  interval = '1D',
  theme = 'dark',
  height = 500,
  width = '100%',
  autosize = true,
  showToolbar = true,
  showDrawingTools = true,
  showIndicators = true,
  indicators = ['ema', 'rsi', 'macd', 'bb'],
  hideTopToolbar = false,
  hideLegend = false,
  allowSymbolChange = true,
  saveImage = true,
  containerStyle = {},
  onSymbolChange = null,
  onIntervalChange = null,
  className = '',
}) {
  const containerRef = useRef(null)
  const widgetRef = useRef(null)
  const scriptRef = useRef(null)

  const resolveSymbol = (sym) => {
    const upperSym = sym?.toUpperCase() || 'BTC'
    return CRYPTO_SYMBOLS[upperSym] || `BINANCE:${upperSym}USDT`
  }

  const resolveInterval = (int) => {
    return TIMEFRAME_MAP[int] || int || 'D'
  }

  const buildStudies = (activeIndicators) => {
    const studies = []
    if (activeIndicators.includes('ema') || activeIndicators.includes('sma')) {
      studies.push('MASimple@tv-basicstudies')
      studies.push('MAExp@tv-basicstudies')
    }
    if (activeIndicators.includes('rsi')) {
      studies.push('RSI@tv-basicstudies')
    }
    if (activeIndicators.includes('macd')) {
      studies.push('MACD@tv-basicstudies')
    }
    if (activeIndicators.includes('bb') || activeIndicators.includes('bollinger')) {
      studies.push('BB@tv-basicstudies')
    }
    if (activeIndicators.includes('volume')) {
      studies.push('Volume@tv-basicstudies')
    }
    return studies
  }

  useEffect(() => {
    if (!containerRef.current) return

    const containerId = `tradingview_${Math.random().toString(36).substring(7)}`
    containerRef.current.id = containerId

    const cleanup = () => {
      if (widgetRef.current) {
        widgetRef.current = null
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }

    cleanup()

    const initWidget = () => {
      if (!window.TradingView || !containerRef.current) return

      try {
        const studies = showIndicators ? buildStudies(indicators) : []
        
        const widgetOptions = {
          container_id: containerId,
          symbol: resolveSymbol(symbol),
          interval: resolveInterval(interval),
          timezone: 'Etc/UTC',
          theme: theme === 'light' ? 'light' : 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: theme === 'light' ? '#f1f3f6' : '#0f0f0f',
          enable_publishing: false,
          allow_symbol_change: allowSymbolChange,
          save_image: saveImage,
          hide_top_toolbar: hideTopToolbar,
          hide_legend: hideLegend,
          studies: studies,
          withdateranges: true,
          hide_side_toolbar: !showDrawingTools,
          details: true,
          hotlist: false,
          calendar: false,
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          autosize: autosize,
          width: autosize ? '100%' : width,
          height: autosize ? '100%' : height,
          backgroundColor: theme === 'light' ? '#ffffff' : '#0f0f0f',
          gridColor: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
          overrides: {
            'paneProperties.background': theme === 'light' ? '#ffffff' : '#0f0f0f',
            'paneProperties.backgroundType': 'solid',
            'paneProperties.vertGridProperties.color': theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
            'paneProperties.horzGridProperties.color': theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
            'scalesProperties.textColor': theme === 'light' ? '#131722' : 'rgba(255,255,255,0.7)',
            'scalesProperties.lineColor': theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            'mainSeriesProperties.candleStyle.upColor': '#39FF14',
            'mainSeriesProperties.candleStyle.downColor': '#FF4444',
            'mainSeriesProperties.candleStyle.borderUpColor': '#39FF14',
            'mainSeriesProperties.candleStyle.borderDownColor': '#FF4444',
            'mainSeriesProperties.candleStyle.wickUpColor': '#39FF14',
            'mainSeriesProperties.candleStyle.wickDownColor': '#FF4444',
          },
        }

        widgetRef.current = new window.TradingView.widget(widgetOptions)

        if (onSymbolChange && widgetRef.current.onSymbolChanged) {
          widgetRef.current.onSymbolChanged(onSymbolChange)
        }
        if (onIntervalChange && widgetRef.current.onIntervalChanged) {
          widgetRef.current.onIntervalChanged(onIntervalChange)
        }
      } catch (err) {
        console.error('TradingView widget init error:', err)
      }
    }

    if (window.TradingView) {
      initWidget()
    } else {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = initWidget
      script.onerror = () => {
        console.error('Failed to load TradingView library')
      }
      document.head.appendChild(script)
      scriptRef.current = script
    }

    return cleanup
  }, [symbol, interval, theme, showIndicators, indicators.join(','), showDrawingTools, hideTopToolbar, hideLegend, allowSymbolChange])

  const containerStyles = {
    width: autosize ? '100%' : width,
    height: autosize ? '100%' : height,
    minHeight: height,
    borderRadius: '8px',
    overflow: 'hidden',
    background: theme === 'light' ? '#ffffff' : '#0f0f0f',
    ...containerStyle,
  }

  return (
    <div 
      ref={containerRef} 
      style={containerStyles}
      className={`tradingview-chart-container ${className}`}
    />
  )
}

export default memo(TradingViewChart)
