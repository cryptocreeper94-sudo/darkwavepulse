import { useState, useEffect, useCallback } from 'react'

const StatCard = ({ title, value, subtitle, color = '#00D4FF', icon }) => (
  <div style={{
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    minWidth: '200px',
    boxShadow: `0 0 20px ${color}20`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{ color: '#888', fontSize: '13px', fontWeight: 500 }}>{title}</span>
    </div>
    <div style={{ fontSize: '32px', fontWeight: 700, color }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
        {subtitle}
      </div>
    )}
  </div>
)

const RiskMeter = ({ label, current, max, warningThreshold = 0.7, dangerThreshold = 0.9 }) => {
  const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const getColor = () => {
    if (percent >= dangerThreshold * 100) return '#ff4444'
    if (percent >= warningThreshold * 100) return '#ffaa00'
    return '#00D4FF'
  }
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: '#fff', fontSize: '13px' }}>{label}</span>
        <span style={{ color: getColor(), fontSize: '13px', fontWeight: 600 }}>
          {current} / {max} ({percent.toFixed(0)}%)
        </span>
      </div>
      <div style={{ 
        background: '#333', 
        borderRadius: '6px', 
        height: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: getColor(),
          borderRadius: '6px',
          transition: 'width 0.5s ease',
          boxShadow: `0 0 10px ${getColor()}40`
        }} />
      </div>
    </div>
  )
}

const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'executed':
        return { bg: '#39FF1422', color: '#39FF14' }
      case 'awaiting_approval':
        return { bg: '#ffaa0022', color: '#ffaa00' }
      case 'pending':
        return { bg: '#00D4FF22', color: '#00D4FF' }
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return { bg: '#ff444422', color: '#ff4444' }
      default:
        return { bg: '#88888822', color: '#888' }
    }
  }
  
  const style = getStatusStyle()
  return (
    <span style={{
      padding: '4px 8px',
      background: style.bg,
      color: style.color,
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase'
    }}>
      {status?.replace('_', ' ') || 'unknown'}
    </span>
  )
}

export default function RiskDashboardTab({ userId }) {
  const [stats, setStats] = useState(null)
  const [pendingTradesList, setPendingTradesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchStats = useCallback(async () => {
    if (!userId) return
    try {
      const [statsResponse, pendingResponse] = await Promise.all([
        fetch(`/api/auto-trade/stats?userId=${userId}`),
        fetch(`/api/auto-trade/trades?userId=${userId}&status=awaiting_approval`)
      ])
      
      if (statsResponse.ok) {
        const data = await statsResponse.json()
        if (data.success) {
          setStats(data)
        }
        setLastRefresh(new Date())
      }
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        if (pendingData.success && pendingData.trades) {
          setPendingTradesList(pendingData.trades)
        }
      }
    } catch (err) {
      console.error('Failed to fetch auto-trade stats:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const handlePause = async () => {
    if (!userId) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/auto-trade/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: 'Manual emergency stop' })
      })
      if (response.ok) {
        await fetchStats()
      }
    } catch (err) {
      console.error('Failed to pause trading:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResume = async () => {
    if (!userId) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/auto-trade/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      if (response.ok) {
        await fetchStats()
      }
    } catch (err) {
      console.error('Failed to resume trading:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async (tradeId) => {
    if (!userId) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/auto-trade/trades/${tradeId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      if (response.ok) {
        await fetchStats()
      }
    } catch (err) {
      console.error('Failed to approve trade:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (tradeId) => {
    if (!userId) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/auto-trade/trades/${tradeId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: 'Manual rejection' })
      })
      if (response.ok) {
        await fetchStats()
      }
    } catch (err) {
      console.error('Failed to reject trade:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price) => {
    if (!price && price !== 0) return '-'
    return `$${parseFloat(price).toFixed(6)}`
  }

  const formatPnL = (pnl) => {
    if (!pnl && pnl !== 0) return '-'
    const value = parseFloat(pnl)
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}$${value.toFixed(2)}`
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
        <div style={{ color: '#888' }}>Loading risk dashboard...</div>
      </div>
    )
  }

  const config = stats?.config || {}
  const recentTrades = stats?.recentTrades || []
  const openPositions = stats?.openPositions || 0
  const winRate = stats?.winRate || 0
  const dailyPnL = parseFloat(stats?.dailyProfitLoss) || 0
  const totalPnL = parseFloat(config.totalProfitLoss) || 0
  const consecutiveLosses = config.consecutiveLosses || 0
  const dailySpent = 0

  const isPaused = config.isPaused
  const isEnabled = config.enabled
  const mode = config.mode || 'observer'

  const getPnLColor = (value) => parseFloat(value) >= 0 ? '#39FF14' : '#ff4444'
  const getWinRateColor = (rate) => {
    if (rate >= 55) return '#39FF14'
    if (rate >= 50) return '#ffaa00'
    return '#ff4444'
  }

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Header Section */}
      <div style={{
        background: '#0f0f0f',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #222'
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ 
              color: '#fff', 
              margin: 0, 
              marginBottom: '8px',
              fontSize: '24px',
              fontWeight: 700
            }}>
              ⚡ Risk Dashboard
            </h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                padding: '4px 12px',
                background: isEnabled ? '#39FF1422' : '#ff444422',
                color: isEnabled ? '#39FF14' : '#ff4444',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {isEnabled ? '● ENABLED' : '○ DISABLED'}
              </span>
              <span style={{
                padding: '4px 12px',
                background: '#00D4FF22',
                color: '#00D4FF',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                {mode}
              </span>
              {isPaused && (
                <span style={{
                  padding: '4px 12px',
                  background: '#ff444422',
                  color: '#ff4444',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  ⏸ PAUSED {config.pauseReason ? `(${config.pauseReason})` : ''}
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {isPaused ? (
              <button
                onClick={handleResume}
                disabled={actionLoading}
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #39FF14, #00cc00)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.6 : 1,
                  boxShadow: '0 0 30px #39FF1440',
                  transition: 'all 0.2s ease'
                }}
              >
                ▶ RESUME TRADING
              </button>
            ) : (
              <button
                onClick={handlePause}
                disabled={actionLoading || !isEnabled}
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: (actionLoading || !isEnabled) ? 'not-allowed' : 'pointer',
                  opacity: (actionLoading || !isEnabled) ? 0.6 : 1,
                  boxShadow: '0 0 30px #ff444440',
                  transition: 'all 0.2s ease'
                }}
              >
                ⏹ EMERGENCY STOP
              </button>
            )}
          </div>
        </div>
        
        {lastRefresh && (
          <div style={{ 
            color: '#666', 
            fontSize: '11px', 
            marginTop: '12px' 
          }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Stat Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          title="Total P&L"
          value={formatPnL(totalPnL)}
          icon="💰"
          color={getPnLColor(totalPnL)}
          subtitle="All time"
        />
        <StatCard
          title="Daily P&L"
          value={formatPnL(dailyPnL)}
          icon="📊"
          color={getPnLColor(dailyPnL)}
          subtitle="Today"
        />
        <StatCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          icon="🎯"
          color={getWinRateColor(winRate)}
          subtitle="Success rate"
        />
        <StatCard
          title="Open Positions"
          value={`${openPositions} / ${config.maxOpenPositions || 3}`}
          icon="📈"
          color={openPositions >= (config.maxOpenPositions || 3) ? '#ffaa00' : '#00D4FF'}
          subtitle="Active trades"
        />
      </div>

      {/* Risk Meters Section */}
      <div style={{
        background: '#141414',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #222'
      }}>
        <h3 style={{ 
          color: '#fff', 
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: 600
        }}>
          📊 Risk Meters
        </h3>
        
        <RiskMeter
          label="Consecutive Losses"
          current={consecutiveLosses}
          max={config.stopAfterLosses || 3}
          warningThreshold={0.6}
          dangerThreshold={0.8}
        />
        
        <RiskMeter
          label="Daily Spending"
          current={dailySpent}
          max={config.maxPerDay || 500}
          warningThreshold={0.7}
          dangerThreshold={0.9}
        />
      </div>

      {/* Pending Approvals Section */}
      {pendingTradesList.length > 0 && (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #ffaa0044',
          boxShadow: '0 0 20px #ffaa0020'
        }}>
          <h3 style={{ 
            color: '#ffaa00', 
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⏳ Pending Approvals ({pendingTradesList.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingTradesList.map((trade) => (
              <div 
                key={trade.id}
                style={{
                  background: '#0f0f0f',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ 
                    color: '#fff', 
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}>
                    {trade.tokenSymbol || trade.tokenAddress?.slice(0, 8) + '...'}
                  </div>
                  <div style={{ color: '#888', fontSize: '12px' }}>
                    {trade.tradeType} • ${parseFloat(trade.amountUSD || 0).toFixed(2)} • Confidence: {(parseFloat(trade.signalConfidence || 0) * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApprove(trade.id)}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 20px',
                      background: '#39FF14',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading ? 0.6 : 1
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(trade.id)}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 20px',
                      background: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading ? 0.6 : 1
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trades Table */}
      <div style={{
        background: '#141414',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #222'
      }}>
        <h3 style={{ 
          color: '#fff', 
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: 600
        }}>
          📜 Recent Trades
        </h3>
        
        {recentTrades.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#666'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <div>No trades yet</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Token</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Type</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontWeight: 500 }}>Amount</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontWeight: 500 }}>Entry</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontWeight: 500 }}>Exit</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontWeight: 500 }}>P&L</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', color: '#888', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontWeight: 500 }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.slice(0, 10).map((trade, index) => (
                  <tr 
                    key={trade.id || index}
                    style={{ 
                      borderBottom: '1px solid #222',
                      background: index % 2 === 0 ? 'transparent' : '#0f0f0f'
                    }}
                  >
                    <td style={{ padding: '12px 8px', color: '#fff', fontWeight: 500 }}>
                      {trade.tokenSymbol || trade.tokenAddress?.slice(0, 8) + '...'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        color: trade.tradeType === 'BUY' ? '#39FF14' : '#ff4444',
                        fontWeight: 600
                      }}>
                        {trade.tradeType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#fff' }}>
                      ${parseFloat(trade.amountUSD || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#888' }}>
                      {formatPrice(trade.entryPrice)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#888' }}>
                      {formatPrice(trade.exitPrice)}
                    </td>
                    <td style={{ 
                      padding: '12px 8px', 
                      textAlign: 'right',
                      color: getPnLColor(trade.profitLossUSD),
                      fontWeight: 600
                    }}>
                      {formatPnL(trade.profitLossUSD)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <StatusBadge status={trade.status} />
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#666', fontSize: '12px' }}>
                      {formatTime(trade.createdAt || trade.executedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
