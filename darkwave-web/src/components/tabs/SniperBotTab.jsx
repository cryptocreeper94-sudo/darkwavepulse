import { useState, useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

const API_BASE = ''

const DEFAULT_CONFIG = {
  mode: 'simple',
  safetyFilters: {
    maxBotPercent: 80,
    maxBundlePercent: 50,
    maxTop10HoldersPercent: 80,
    minLiquidityUsd: 5000,
    checkCreatorWallet: true,
  },
  discoveryFilters: {
    minTokenAgeMinutes: 5,
    maxTokenAgeMinutes: 1440,
    minHolders: 50,
    minWatchers: 10,
  },
  movementFilters: {
    minPriceChangePercent: 1.5,
    movementTimeframeMinutes: 5,
    minVolumeMultiplier: 2,
    minTradesPerMinute: 5,
    minBuySellRatio: 1.2,
    minHolderGrowthPercent: 5,
  },
  dexPreferences: {
    enabledDexes: ['raydium', 'pumpfun', 'jupiter', 'orca', 'meteora'],
    preferredDex: 'jupiter',
  },
  tradeControls: {
    buyAmountSol: 0.5,
    slippagePercent: 5,
    priorityFee: 'auto',
    takeProfitPercent: 50,
    stopLossPercent: 20,
  },
  autoModeSettings: {
    maxTradesPerSession: 10,
    maxSolPerSession: 5,
    cooldownSeconds: 60,
    maxConsecutiveLosses: 3,
  },
}

function LiveCandleChart({ tokenSymbol, priceData, entryPrice, takeProfitPrice, stopLossPrice }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: '#0a0a0a' },
        textColor: '#888',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 200,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: '#222',
      },
      rightPriceScale: {
        borderColor: '#222',
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(0, 212, 255, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(0, 212, 255, 0.3)', width: 1, style: 2 },
      },
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#39FF14',
      downColor: '#FF4444',
      borderUpColor: '#39FF14',
      borderDownColor: '#FF4444',
      wickUpColor: '#39FF14',
      wickDownColor: '#FF4444',
    })

    if (entryPrice) {
      candleSeries.createPriceLine({
        price: entryPrice,
        color: '#00D4FF',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'ENTRY',
      })
    }

    if (takeProfitPrice) {
      candleSeries.createPriceLine({
        price: takeProfitPrice,
        color: '#39FF14',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP',
      })
    }

    if (stopLossPrice) {
      candleSeries.createPriceLine({
        price: stopLossPrice,
        color: '#FF4444',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'SL',
      })
    }

    chartRef.current = chart
    candleSeriesRef.current = candleSeries

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [entryPrice, takeProfitPrice, stopLossPrice])

  useEffect(() => {
    if (candleSeriesRef.current && priceData?.length > 0) {
      candleSeriesRef.current.setData(priceData)
    }
  }, [priceData])

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: 8,
        left: 12,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ 
          fontSize: 12, 
          fontWeight: 700, 
          color: '#00D4FF',
          textShadow: '0 0 10px rgba(0,212,255,0.5)',
        }}>
          {tokenSymbol || 'SELECT TOKEN'}
        </span>
        <span style={{
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 9,
          background: 'rgba(57, 255, 20, 0.2)',
          border: '1px solid #39FF14',
          color: '#39FF14',
        }}>
          1s
        </span>
      </div>
      <div ref={chartContainerRef} style={{ borderRadius: 8, overflow: 'hidden' }} />
    </div>
  )
}

function ActivePositionCard({ position, onClose }) {
  const pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100
  const pnlColor = pnlPercent >= 0 ? '#39FF14' : '#FF4444'
  const pnlSol = position.amountSol * (pnlPercent / 100)

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(20,20,20,0.95))',
      border: `1px solid ${pnlPercent >= 0 ? 'rgba(57,255,20,0.4)' : 'rgba(255,68,68,0.4)'}`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      boxShadow: `0 0 20px ${pnlPercent >= 0 ? 'rgba(57,255,20,0.1)' : 'rgba(255,68,68,0.1)'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #00D4FF, #9D4EDD)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14,
          }}>
            {position.symbol?.slice(0, 2) || '??'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{position.symbol}</div>
            <div style={{ fontSize: 10, color: '#888' }}>
              via {position.dex} • {position.age}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 800, 
            color: pnlColor,
            textShadow: `0 0 15px ${pnlColor}40`,
          }}>
            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
          </div>
          <div style={{ fontSize: 11, color: pnlColor }}>
            {pnlSol >= 0 ? '+' : ''}{pnlSol.toFixed(4)} SOL
          </div>
        </div>
      </div>

      <LiveCandleChart
        tokenSymbol={position.symbol}
        priceData={position.priceHistory || []}
        entryPrice={position.entryPrice}
        takeProfitPrice={position.entryPrice * (1 + position.takeProfitPercent / 100)}
        stopLossPrice={position.entryPrice * (1 - position.stopLossPercent / 100)}
      />

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 8, 
        marginTop: 12,
        padding: 10,
        background: '#0a0a0a',
        borderRadius: 8,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#666' }}>ENTRY</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#00D4FF' }}>
            ${position.entryPrice?.toFixed(8)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#666' }}>CURRENT</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            ${position.currentPrice?.toFixed(8)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#666' }}>TP TARGET</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#39FF14' }}>
            +{position.takeProfitPercent}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#666' }}>SL LIMIT</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#FF4444' }}>
            -{position.stopLossPercent}%
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onClose?.(position.id, 'manual')}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: 11,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #FF4444, #CC0000)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          CLOSE POSITION
        </button>
        <button
          style={{
            padding: '10px 16px',
            fontSize: 11,
            fontWeight: 700,
            background: '#1a1a1a',
            color: '#888',
            border: '1px solid #333',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          ADJUST TP/SL
        </button>
      </div>
    </div>
  )
}

function DiscoveredTokenCard({ token, onSnipe, onWatch, isSelected }) {
  const getScoreColor = (score) => {
    if (score >= 70) return '#39FF14'
    if (score >= 45) return '#FFD700'
    return '#FF4444'
  }

  return (
    <div
      style={{
        background: isSelected ? 'rgba(0,212,255,0.08)' : '#0a0a0a',
        border: isSelected ? '1px solid rgba(0,212,255,0.4)' : '1px solid #1a1a1a',
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${getScoreColor(token.aiScore)}30, #00D4FF30)`,
            border: `1px solid ${getScoreColor(token.aiScore)}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
          }}>
            {token.symbol?.slice(0, 3)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{token.symbol}</div>
            <div style={{ fontSize: 10, color: '#666' }}>{token.name?.slice(0, 20)}</div>
          </div>
        </div>
        <div style={{ 
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: `conic-gradient(${getScoreColor(token.aiScore)} ${token.aiScore}%, #1a1a1a ${token.aiScore}%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
              color: getScoreColor(token.aiScore),
            }}>
              {token.aiScore}
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 6, 
        marginTop: 12,
        padding: 8,
        background: '#050505',
        borderRadius: 6,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#555', textTransform: 'uppercase' }}>Liquidity</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#00D4FF' }}>
            ${((token.liquidityUsd || 0) / 1000).toFixed(1)}K
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#555', textTransform: 'uppercase' }}>5m Change</div>
          <div style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: (token.priceChange5m || 0) >= 0 ? '#39FF14' : '#FF4444' 
          }}>
            {(token.priceChange5m || 0) >= 0 ? '+' : ''}{(token.priceChange5m || 0).toFixed(1)}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#555', textTransform: 'uppercase' }}>Volume</div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>
            {(token.volumeMultiplier || 1).toFixed(1)}x
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#555', textTransform: 'uppercase' }}>DEX</div>
          <div style={{ 
            fontSize: 10, 
            fontWeight: 600,
            color: token.dex === 'pumpfun' ? '#FF006E' : '#9D4EDD',
          }}>
            {token.dex}
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTop: '1px solid #1a1a1a',
      }}>
        <div style={{
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          background: token.aiRecommendation === 'snipe' 
            ? 'rgba(57,255,20,0.15)' 
            : token.aiRecommendation === 'watch'
              ? 'rgba(255,215,0,0.15)'
              : 'rgba(255,68,68,0.15)',
          border: `1px solid ${
            token.aiRecommendation === 'snipe' 
              ? '#39FF14' 
              : token.aiRecommendation === 'watch'
                ? '#FFD700'
                : '#FF4444'
          }`,
          color: token.aiRecommendation === 'snipe' 
            ? '#39FF14' 
            : token.aiRecommendation === 'watch'
              ? '#FFD700'
              : '#FF4444',
        }}>
          {token.aiRecommendation === 'snipe' ? '🎯 SNIPE' : 
           token.aiRecommendation === 'watch' ? '👀 WATCH' : '⚠️ AVOID'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onWatch?.(token); }}
            style={{
              padding: '6px 12px',
              fontSize: 10,
              fontWeight: 600,
              background: '#1a1a1a',
              color: '#888',
              border: '1px solid #333',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Watch
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSnipe?.(token); }}
            style={{
              padding: '6px 14px',
              fontSize: 10,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00D4FF, #39FF14)',
              color: '#000',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            SNIPE
          </button>
        </div>
      </div>
    </div>
  )
}

function SessionStatsPanel({ stats, isActive }) {
  return (
    <div style={{
      background: isActive 
        ? 'linear-gradient(135deg, rgba(57,255,20,0.05), rgba(0,212,255,0.05))'
        : '#0a0a0a',
      border: isActive ? '1px solid rgba(57,255,20,0.3)' : '1px solid #1a1a1a',
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: isActive ? '#39FF14' : '#444',
            boxShadow: isActive ? '0 0 10px #39FF14' : 'none',
            animation: isActive ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ 
            fontSize: 12, 
            fontWeight: 700,
            color: isActive ? '#39FF14' : '#666',
          }}>
            {isActive ? 'SESSION ACTIVE' : 'SESSION IDLE'}
          </span>
        </div>
        {isActive && (
          <span style={{ fontSize: 10, color: '#888' }}>
            {stats?.duration || '00:00:00'}
          </span>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 12,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>TRADES</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {stats?.tradesExecuted || 0}
            <span style={{ fontSize: 10, color: '#666' }}>/{stats?.maxTrades || 10}</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>WIN RATE</div>
          <div style={{ 
            fontSize: 20, 
            fontWeight: 800,
            color: (stats?.winRate || 0) >= 50 ? '#39FF14' : '#FF4444',
          }}>
            {(stats?.winRate || 0).toFixed(0)}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>SOL USED</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#00D4FF' }}>
            {(stats?.solUsed || 0).toFixed(2)}
            <span style={{ fontSize: 10, color: '#666' }}>/{stats?.maxSol || 5}</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>P&L</div>
          <div style={{ 
            fontSize: 20, 
            fontWeight: 800,
            color: (stats?.totalPnl || 0) >= 0 ? '#39FF14' : '#FF4444',
            textShadow: `0 0 10px ${(stats?.totalPnl || 0) >= 0 ? '#39FF1440' : '#FF444440'}`,
          }}>
            {(stats?.totalPnl || 0) >= 0 ? '+' : ''}{(stats?.totalPnl || 0).toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SniperBotTab() {
  const [mode, setMode] = useState('simple')
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [discoveredTokens, setDiscoveredTokens] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [activePositions, setActivePositions] = useState([])
  const [stats, setStats] = useState({ tradesExecuted: 0, winRate: 0, solUsed: 0, totalPnl: 0, maxTrades: 10, maxSol: 5 })
  const [solPrice, setSolPrice] = useState(0)
  const [selectedToken, setSelectedToken] = useState(null)
  const [autoModeActive, setAutoModeActive] = useState(false)
  const [scanInterval, setScanInterval] = useState(null)

  useEffect(() => {
    fetchSolPrice()
    const interval = setInterval(fetchSolPrice, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (autoModeActive && !scanInterval) {
      const interval = setInterval(discoverTokens, 10000)
      setScanInterval(interval)
    } else if (!autoModeActive && scanInterval) {
      clearInterval(scanInterval)
      setScanInterval(null)
    }
    return () => {
      if (scanInterval) clearInterval(scanInterval)
    }
  }, [autoModeActive])

  const fetchSolPrice = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sniper/sol-price`)
      const data = await res.json()
      if (data.price) setSolPrice(data.price)
    } catch (err) {
      console.error('Error fetching SOL price:', err)
    }
  }

  const discoverTokens = async () => {
    setIsScanning(true)
    try {
      const res = await fetch(`${API_BASE}/api/sniper/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })
      const data = await res.json()
      setDiscoveredTokens(data.tokens || [])
    } catch (err) {
      console.error('Discovery error:', err)
    }
    setIsScanning(false)
  }

  const handleSnipe = async (token) => {
    console.log('Sniping token:', token)
    setSelectedToken(token)
  }

  const updateConfig = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  return (
    <div className="sniper-bot-tab" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(0,212,255,0.3); }
          50% { box-shadow: 0 0 20px rgba(0,212,255,0.6); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        padding: '16px 20px',
        background: 'linear-gradient(90deg, rgba(0,212,255,0.1), rgba(157,78,221,0.1), rgba(57,255,20,0.05))',
        borderRadius: 12,
        border: '1px solid rgba(0,212,255,0.2)',
      }}>
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 800, 
            margin: 0,
            background: 'linear-gradient(90deg, #00D4FF, #9D4EDD, #39FF14)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            AI SNIPER BOT
          </h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            Real-time token discovery with intelligent execution
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#666' }}>SOL PRICE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#00D4FF' }}>
              ${solPrice.toFixed(2)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setMode('simple')}
              style={{
                padding: '8px 16px',
                fontSize: 11,
                fontWeight: mode === 'simple' ? 700 : 500,
                background: mode === 'simple' ? '#00D4FF' : 'transparent',
                color: mode === 'simple' ? '#000' : '#666',
                border: mode === 'simple' ? 'none' : '1px solid #333',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Simple
            </button>
            <button
              onClick={() => setMode('advanced')}
              style={{
                padding: '8px 16px',
                fontSize: 11,
                fontWeight: mode === 'advanced' ? 700 : 500,
                background: mode === 'advanced' ? '#9D4EDD' : 'transparent',
                color: mode === 'advanced' ? '#fff' : '#666',
                border: mode === 'advanced' ? 'none' : '1px solid #333',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: mode === 'advanced' ? '1fr 380px' : '1fr 380px',
        gap: 20,
      }}>
        <div>
          <SessionStatsPanel stats={stats} isActive={autoModeActive} />

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '20px 0 12px',
          }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
              Active Positions ({activePositions.length})
            </h3>
          </div>

          {activePositions.length > 0 ? (
            activePositions.map(pos => (
              <ActivePositionCard 
                key={pos.id} 
                position={pos} 
                onClose={(id, reason) => console.log('Close position', id, reason)}
              />
            ))
          ) : (
            <div style={{
              padding: 40,
              textAlign: 'center',
              background: '#0a0a0a',
              borderRadius: 12,
              border: '1px dashed #222',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
              <div style={{ color: '#666', fontSize: 12 }}>
                No active positions
              </div>
              <div style={{ color: '#444', fontSize: 11, marginTop: 4 }}>
                Snipe a token to see live tracking here
              </div>
            </div>
          )}

          {mode === 'advanced' && (
            <div style={{
              marginTop: 20,
              padding: 16,
              background: '#0a0a0a',
              borderRadius: 12,
              border: '1px solid #1a1a1a',
            }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 12, color: '#00D4FF' }}>
                QUICK SETTINGS
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#666' }}>Buy Amount (SOL)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={config.tradeControls.buyAmountSol}
                    onChange={(e) => updateConfig('tradeControls', 'buyAmountSol', parseFloat(e.target.value))}
                    style={{
                      padding: '8px 10px',
                      background: '#050505',
                      border: '1px solid #222',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#666' }}>Slippage %</span>
                  <input
                    type="number"
                    value={config.tradeControls.slippagePercent}
                    onChange={(e) => updateConfig('tradeControls', 'slippagePercent', parseInt(e.target.value))}
                    style={{
                      padding: '8px 10px',
                      background: '#050505',
                      border: '1px solid #222',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#39FF14' }}>Take Profit %</span>
                  <input
                    type="number"
                    value={config.tradeControls.takeProfitPercent}
                    onChange={(e) => updateConfig('tradeControls', 'takeProfitPercent', parseInt(e.target.value))}
                    style={{
                      padding: '8px 10px',
                      background: '#050505',
                      border: '1px solid #39FF1420',
                      borderRadius: 6,
                      color: '#39FF14',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#FF4444' }}>Stop Loss %</span>
                  <input
                    type="number"
                    value={config.tradeControls.stopLossPercent}
                    onChange={(e) => updateConfig('tradeControls', 'stopLossPercent', parseInt(e.target.value))}
                    style={{
                      padding: '8px 10px',
                      background: '#050505',
                      border: '1px solid #FF444420',
                      borderRadius: 6,
                      color: '#FF4444',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={{
            background: '#0a0a0a',
            borderRadius: 12,
            border: '1px solid #1a1a1a',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                Token Discovery
              </h3>
              <button
                onClick={discoverTokens}
                disabled={isScanning}
                style={{
                  padding: '6px 14px',
                  fontSize: 10,
                  fontWeight: 700,
                  background: isScanning ? '#222' : 'linear-gradient(135deg, #00D4FF, #9D4EDD)',
                  color: isScanning ? '#666' : '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: isScanning ? 'not-allowed' : 'pointer',
                }}
              >
                {isScanning ? 'Scanning...' : 'SCAN NOW'}
              </button>
            </div>

            <div style={{ 
              padding: 12, 
              maxHeight: 500, 
              overflowY: 'auto',
            }}>
              {discoveredTokens.length > 0 ? (
                discoveredTokens.map((token, i) => (
                  <DiscoveredTokenCard
                    key={token.address || i}
                    token={token}
                    isSelected={selectedToken?.address === token.address}
                    onSnipe={handleSnipe}
                    onWatch={(t) => console.log('Watch', t)}
                  />
                ))
              ) : (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  color: '#444',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 11 }}>
                    Click "SCAN NOW" to discover tokens
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{
            marginTop: 16,
            padding: 16,
            background: autoModeActive 
              ? 'linear-gradient(135deg, rgba(57,255,20,0.08), rgba(0,0,0,0.95))'
              : '#0a0a0a',
            borderRadius: 12,
            border: autoModeActive 
              ? '1px solid rgba(57,255,20,0.3)'
              : '1px solid #1a1a1a',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Smart Auto Mode</div>
                <div style={{ fontSize: 10, color: '#666' }}>
                  AI executes trades automatically
                </div>
              </div>
              <button
                onClick={() => setAutoModeActive(!autoModeActive)}
                style={{
                  padding: '10px 24px',
                  fontSize: 12,
                  fontWeight: 800,
                  background: autoModeActive 
                    ? 'linear-gradient(135deg, #FF4444, #CC0000)'
                    : 'linear-gradient(135deg, #39FF14, #00CC00)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: autoModeActive
                    ? '0 0 20px rgba(255,68,68,0.3)'
                    : '0 0 20px rgba(57,255,20,0.3)',
                }}
              >
                {autoModeActive ? '⏹ STOP' : '▶ START'}
              </button>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 8,
              fontSize: 11,
            }}>
              <div style={{ 
                padding: 10, 
                background: '#050505', 
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#666' }}>Max Trades</span>
                <span style={{ fontWeight: 600 }}>{config.autoModeSettings.maxTradesPerSession}</span>
              </div>
              <div style={{ 
                padding: 10, 
                background: '#050505', 
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#666' }}>Max SOL</span>
                <span style={{ fontWeight: 600, color: '#00D4FF' }}>{config.autoModeSettings.maxSolPerSession}</span>
              </div>
              <div style={{ 
                padding: 10, 
                background: '#050505', 
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#666' }}>Cooldown</span>
                <span style={{ fontWeight: 600 }}>{config.autoModeSettings.cooldownSeconds}s</span>
              </div>
              <div style={{ 
                padding: 10, 
                background: '#050505', 
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#666' }}>Auto-Stop</span>
                <span style={{ fontWeight: 600, color: '#FF4444' }}>{config.autoModeSettings.maxConsecutiveLosses} losses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
