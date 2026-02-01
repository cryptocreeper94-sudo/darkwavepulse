import { useState, useEffect } from 'react'
import './TradeHistory.css'

const API_BASE = ''

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function formatPrice(price) {
  if (!price || price === 0) return '$0.00'
  if (price < 0.00001) return '$' + price.toExponential(2)
  if (price < 0.01) return '$' + price.toFixed(6)
  if (price < 1) return '$' + price.toFixed(4)
  return '$' + price.toFixed(2)
}

function formatSol(amount) {
  if (!amount) return '0.000'
  return amount.toFixed(3)
}

const DEMO_TRADES = [
  { id: 'd1', tokenSymbol: 'BONK', status: 'closed', action: 'sell', pnlPercent: 42.5, pnlSol: 0.425, entryPrice: 0.00000134, exitPrice: 0.00000191, amountSol: 1.0, holdTime: '2h 15m', timestamp: Date.now() - 3600000 },
  { id: 'd2', tokenSymbol: 'WIF', status: 'closed', action: 'sell', pnlPercent: -12.3, pnlSol: -0.123, entryPrice: 2.45, exitPrice: 2.15, amountSol: 1.0, holdTime: '45m', timestamp: Date.now() - 7200000 },
  { id: 'd3', tokenSymbol: 'POPCAT', status: 'closed', action: 'sell', pnlPercent: 85.0, pnlSol: 0.425, entryPrice: 0.42, exitPrice: 0.777, amountSol: 0.5, holdTime: '4h 30m', timestamp: Date.now() - 14400000 },
  { id: 'd4', tokenSymbol: 'BRETT', status: 'closed', action: 'sell', pnlPercent: 28.5, pnlSol: 0.285, entryPrice: 0.085, exitPrice: 0.109, amountSol: 1.0, holdTime: '1h 20m', timestamp: Date.now() - 21600000 },
  { id: 'd5', tokenSymbol: 'MOODENG', status: 'closed', action: 'sell', pnlPercent: -25.0, pnlSol: -0.25, entryPrice: 0.15, exitPrice: 0.1125, amountSol: 1.0, holdTime: '30m', timestamp: Date.now() - 28800000 },
]

export default function TradeHistory({ userId, sessionId, mode = 'all', onClose, refreshKey }) {
  const [trades, setTrades] = useState(DEMO_TRADES)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('7d')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    fetchTradeHistory()
  }, [userId, sessionId, timeFilter, refreshKey])

  const fetchTradeHistory = async () => {
    setLoading(true)
    try {
      const endpoint = sessionId 
        ? `${API_BASE}/api/demo/trades/${sessionId}`
        : `${API_BASE}/api/trades/history?userId=${userId || 'demo'}&timeframe=${timeFilter}`
      
      const res = await fetch(endpoint)
      const data = await res.json()
      
      if (data.success && data.trades?.length > 0) {
        setTrades(data.trades)
        setStats(data.stats || calculateStats(data.trades))
      } else {
        setTrades(DEMO_TRADES)
        setStats(calculateStats(DEMO_TRADES))
      }
    } catch (err) {
      console.error('Failed to fetch trade history:', err)
      setTrades(DEMO_TRADES)
      setStats(calculateStats(DEMO_TRADES))
    }
    setLoading(false)
  }

  const calculateStats = (tradeList) => {
    const closed = tradeList.filter(t => t.status === 'closed')
    if (closed.length === 0) return null

    const wins = closed.filter(t => (t.pnlPercent || 0) > 0)
    const losses = closed.filter(t => (t.pnlPercent || 0) < 0)
    const totalPnl = closed.reduce((sum, t) => sum + (t.pnlSol || 0), 0)
    const pnlPercents = closed.map(t => t.pnlPercent || 0)

    return {
      totalTrades: closed.length,
      winRate: (wins.length / closed.length) * 100,
      totalPnlSol: totalPnl,
      avgPnlPercent: pnlPercents.reduce((a, b) => a + b, 0) / closed.length,
      bestTrade: Math.max(...pnlPercents),
      worstTrade: Math.min(...pnlPercents),
      totalWins: wins.length,
      totalLosses: losses.length,
      avgWin: wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? losses.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / losses.length : 0,
    }
  }

  const sortedTrades = [...trades].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.timestamp) - new Date(a.timestamp)
    if (sortBy === 'pnl_high') return (b.pnlPercent || 0) - (a.pnlPercent || 0)
    if (sortBy === 'pnl_low') return (a.pnlPercent || 0) - (b.pnlPercent || 0)
    if (sortBy === 'size') return (b.amountSol || 0) - (a.amountSol || 0)
    return 0
  })

  const closedTrades = sortedTrades.filter(t => t.status === 'closed' || t.action === 'sell')

  return (
    <div className="trade-history">
      <div className="th-header">
        <div className="th-title-row">
          <h3 className="th-title">Trade History</h3>
          {onClose && (
            <button className="th-close" onClick={onClose}>×</button>
          )}
        </div>
        <div className="th-filters">
          <div className="th-time-filters">
            {['24h', '7d', '30d', 'all'].map(tf => (
              <button
                key={tf}
                className={`th-time-btn ${timeFilter === tf ? 'active' : ''}`}
                onClick={() => setTimeFilter(tf)}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
          <select 
            className="th-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="pnl_high">Highest P&L</option>
            <option value="pnl_low">Lowest P&L</option>
            <option value="size">Largest Size</option>
          </select>
        </div>
      </div>

      {stats && (
        <div className="th-stats-panel">
          <div className="th-stats-row th-stats-main">
            <div className="th-stat-box highlight">
              <div className="th-stat-label">Total P&L</div>
              <div className={`th-stat-value xl ${stats.totalPnlSol >= 0 ? 'green' : 'red'}`}>
                {stats.totalPnlSol >= 0 ? '+' : ''}{formatSol(stats.totalPnlSol)} SOL
              </div>
            </div>
            <div className="th-stat-box">
              <div className="th-stat-label">Win Rate</div>
              <div className={`th-stat-value lg ${stats.winRate >= 50 ? 'green' : 'red'}`}>
                {stats.winRate.toFixed(1)}%
              </div>
              <div className="th-stat-sub">
                <span className="green">{stats.totalWins}W</span>
                <span className="separator">/</span>
                <span className="red">{stats.totalLosses}L</span>
              </div>
            </div>
            <div className="th-stat-box">
              <div className="th-stat-label">Total Trades</div>
              <div className="th-stat-value lg cyan">{stats.totalTrades}</div>
            </div>
          </div>
          
          <div className="th-stats-row th-stats-secondary">
            <div className="th-stat-mini">
              <span className="th-stat-mini-label">Best</span>
              <span className="th-stat-mini-value green">+{stats.bestTrade?.toFixed(1)}%</span>
            </div>
            <div className="th-stat-mini">
              <span className="th-stat-mini-label">Worst</span>
              <span className="th-stat-mini-value red">{stats.worstTrade?.toFixed(1)}%</span>
            </div>
            <div className="th-stat-mini">
              <span className="th-stat-mini-label">Avg Win</span>
              <span className="th-stat-mini-value green">+{stats.avgWin?.toFixed(1)}%</span>
            </div>
            <div className="th-stat-mini">
              <span className="th-stat-mini-label">Avg Loss</span>
              <span className="th-stat-mini-value red">{stats.avgLoss?.toFixed(1)}%</span>
            </div>
          </div>

          <div className="th-win-bar">
            <div 
              className="th-win-bar-fill" 
              style={{ width: `${stats.winRate}%` }}
            />
          </div>
        </div>
      )}

      <div className="th-trades-list">
        {loading ? (
          <div className="th-loading">
            <div className="th-loading-spinner" />
            <span>Loading trades...</span>
          </div>
        ) : closedTrades.length > 0 ? (
          closedTrades.map((trade, i) => (
            <div 
              key={trade.id || i} 
              className={`th-trade-item ${(trade.pnlPercent || 0) >= 0 ? 'profit' : 'loss'}`}
            >
              <div className="th-trade-main">
                <div className="th-trade-token">
                  <div className="th-trade-icon">
                    {trade.tokenSymbol?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className="th-trade-info">
                    <div className="th-trade-symbol">{trade.tokenSymbol || 'Unknown'}</div>
                    <div className="th-trade-time">{formatTime(trade.timestamp)}</div>
                  </div>
                </div>
                <div className="th-trade-pnl">
                  <div className={`th-trade-pnl-percent ${(trade.pnlPercent || 0) >= 0 ? 'green' : 'red'}`}>
                    {(trade.pnlPercent || 0) >= 0 ? '+' : ''}{(trade.pnlPercent || 0).toFixed(2)}%
                  </div>
                  <div className={`th-trade-pnl-sol ${(trade.pnlSol || 0) >= 0 ? 'green' : 'red'}`}>
                    {(trade.pnlSol || 0) >= 0 ? '+' : ''}{formatSol(trade.pnlSol)} SOL
                  </div>
                </div>
              </div>
              <div className="th-trade-details">
                <div className="th-trade-detail">
                  <span className="th-detail-label">Entry</span>
                  <span className="th-detail-value">{formatPrice(trade.entryPrice)}</span>
                </div>
                <div className="th-trade-arrow">→</div>
                <div className="th-trade-detail">
                  <span className="th-detail-label">Exit</span>
                  <span className="th-detail-value">{formatPrice(trade.exitPrice)}</span>
                </div>
                <div className="th-trade-detail">
                  <span className="th-detail-label">Size</span>
                  <span className="th-detail-value">{formatSol(trade.amountSol)} SOL</span>
                </div>
                <div className="th-trade-detail">
                  <span className="th-detail-label">Hold</span>
                  <span className="th-detail-value">{trade.holdTime || '--'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="th-empty">
            <div className="th-empty-icon">📊</div>
            <div className="th-empty-title">No trades yet</div>
            <div className="th-empty-text">Your completed trades will appear here with full P&L tracking</div>
          </div>
        )}
      </div>
    </div>
  )
}
