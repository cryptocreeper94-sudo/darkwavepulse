import { useState, useEffect, useCallback } from 'react'

const RiskGauge = ({ value, max, label, color, warningThreshold = 0.7 }) => {
  const percent = Math.min((value / max) * 100, 100)
  const isWarning = value >= max * warningThreshold
  const gaugeColor = isWarning ? '#FF6B6B' : color
  
  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '20px',
      flex: 1,
      minWidth: '200px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <span style={{ color: '#888', fontSize: '13px' }}>{label}</span>
        <span style={{ color: gaugeColor, fontWeight: 600, fontSize: '14px' }}>
          ${value.toFixed(2)} / ${max.toFixed(2)}
        </span>
      </div>
      <div style={{
        height: '10px',
        background: '#0f0f0f',
        borderRadius: '5px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: gaugeColor,
          borderRadius: '5px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      {isWarning && (
        <div style={{ 
          color: '#FF6B6B', 
          fontSize: '11px', 
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>⚠️</span> Approaching limit
        </div>
      )}
    </div>
  )
}

const SafetyIndicator = ({ label, status, message }) => {
  const statusColors = {
    'healthy': '#14F195',
    'warning': '#F3BA2F',
    'critical': '#FF6B6B',
    'paused': '#666'
  }
  
  const statusIcons = {
    'healthy': '✓',
    'warning': '⚠',
    'critical': '✕',
    'paused': '⏸'
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '14px 16px',
      background: '#141414',
      borderRadius: '8px',
      gap: '12px'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: `${statusColors[status]}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: statusColors[status],
        fontWeight: 700,
        fontSize: '14px'
      }}>
        {statusIcons[status]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
          {label}
        </div>
        <div style={{ color: '#666', fontSize: '12px' }}>
          {message}
        </div>
      </div>
      <div style={{
        padding: '4px 10px',
        background: `${statusColors[status]}15`,
        color: statusColors[status],
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase'
      }}>
        {status}
      </div>
    </div>
  )
}

const TradeCard = ({ trade }) => {
  const isPositive = parseFloat(trade.profitLossPercent || 0) >= 0
  const signalColors = {
    'BUY': '#14F195',
    'STRONG_BUY': '#14F195',
    'SELL': '#FF6B6B',
    'STRONG_SELL': '#FF6B6B'
  }
  
  return (
    <div style={{
      background: '#141414',
      borderRadius: '8px',
      padding: '16px',
      display: 'grid',
      gridTemplateColumns: '1fr 100px 100px 100px',
      gap: '12px',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ 
          color: '#fff', 
          fontWeight: 500, 
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {trade.tokenSymbol || trade.tokenAddress?.slice(0, 8)}
        </div>
        <div style={{ color: '#666', fontSize: '11px' }}>
          {trade.chain} • {trade.tradeType}
        </div>
      </div>
      <div style={{ 
        color: signalColors[trade.signalType] || '#888',
        fontWeight: 600,
        fontSize: '13px'
      }}>
        {trade.signalType}
      </div>
      <div style={{ color: '#00D4FF', fontSize: '13px' }}>
        ${parseFloat(trade.amountUSD).toFixed(2)}
      </div>
      <div style={{ 
        color: trade.status === 'executed' 
          ? (isPositive ? '#14F195' : '#FF6B6B')
          : '#888',
        fontWeight: 600,
        fontSize: '13px',
        textAlign: 'right'
      }}>
        {trade.status === 'executed' && trade.profitLossPercent
          ? `${isPositive ? '+' : ''}${parseFloat(trade.profitLossPercent).toFixed(2)}%`
          : trade.status.toUpperCase()
        }
      </div>
    </div>
  )
}

export default function RiskDashboard({ userId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/auto-trade/stats?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch risk stats:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div style={{ 
        padding: '60px', 
        textAlign: 'center',
        background: '#0f0f0f',
        minHeight: '100vh'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
        <div style={{ color: '#888' }}>Loading Risk Dashboard...</div>
      </div>
    )
  }

  const config = stats?.config || {}
  const maxPerDay = parseFloat(config.maxPerDay || 50)
  const dailyUsed = Math.abs(parseFloat(stats?.dailyProfitLoss || 0))
  const maxOpenPositions = config.maxOpenPositions || 3
  const openPositions = stats?.openPositions || 0
  const pendingApprovals = stats?.pendingApprovals || 0

  const getSafetyStatus = () => {
    if (config.isPaused) return { status: 'paused', message: config.pauseReason || 'Trading paused' }
    if (!config.enabled) return { status: 'paused', message: 'Auto-trading disabled' }
    if (config.consecutiveLosses >= config.stopAfterLosses) return { status: 'critical', message: `${config.consecutiveLosses} consecutive losses` }
    if (openPositions >= maxOpenPositions) return { status: 'warning', message: 'Max positions reached' }
    if (dailyUsed >= maxPerDay * 0.9) return { status: 'warning', message: 'Approaching daily limit' }
    return { status: 'healthy', message: 'All systems operational' }
  }

  const safety = getSafetyStatus()

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      background: '#0f0f0f',
      minHeight: '100vh'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ 
            color: '#fff', 
            fontSize: '24px', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>🛡️</span>
            Risk Dashboard
          </h1>
          <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0 0' }}>
            Monitor trading exposure and safety controls
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastRefresh && (
            <span style={{ color: '#666', fontSize: '12px' }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            style={{
              padding: '8px 16px',
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div style={{
        background: safety.status === 'healthy' ? '#14F19515' 
          : safety.status === 'warning' ? '#F3BA2F15' 
          : safety.status === 'critical' ? '#FF6B6B15' 
          : '#1a1a1a',
        border: `1px solid ${
          safety.status === 'healthy' ? '#14F195' 
          : safety.status === 'warning' ? '#F3BA2F' 
          : safety.status === 'critical' ? '#FF6B6B' 
          : '#333'
        }`,
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '40px' }}>
            {safety.status === 'healthy' ? '✅' 
              : safety.status === 'warning' ? '⚠️' 
              : safety.status === 'critical' ? '🚨' 
              : '⏸️'}
          </div>
          <div>
            <div style={{ 
              color: '#fff', 
              fontSize: '18px', 
              fontWeight: 600,
              marginBottom: '4px'
            }}>
              System Status: {safety.status.charAt(0).toUpperCase() + safety.status.slice(1)}
            </div>
            <div style={{ color: '#888', fontSize: '13px' }}>
              {safety.message}
            </div>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#00D4FF', fontSize: '28px', fontWeight: 700 }}>
              {config.mode || 'observer'}
            </div>
            <div style={{ color: '#666', fontSize: '11px' }}>Mode</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#14F195', fontSize: '28px', fontWeight: 700 }}>
              {stats?.winRate || 0}%
            </div>
            <div style={{ color: '#666', fontSize: '11px' }}>Win Rate</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              color: parseFloat(config.totalProfitLoss || 0) >= 0 ? '#14F195' : '#FF6B6B', 
              fontSize: '28px', 
              fontWeight: 700 
            }}>
              ${parseFloat(config.totalProfitLoss || 0).toFixed(2)}
            </div>
            <div style={{ color: '#666', fontSize: '11px' }}>Total P/L</div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <RiskGauge
          value={dailyUsed}
          max={maxPerDay}
          label="Daily Exposure"
          color="#00D4FF"
        />
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '20px',
          flex: 1,
          minWidth: '200px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ color: '#888', fontSize: '13px' }}>Open Positions</span>
            <span style={{ 
              color: openPositions >= maxOpenPositions ? '#FF6B6B' : '#00D4FF', 
              fontWeight: 600, 
              fontSize: '14px' 
            }}>
              {openPositions} / {maxOpenPositions}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(maxOpenPositions)].map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '10px',
                  borderRadius: '5px',
                  background: i < openPositions ? '#00D4FF' : '#0f0f0f'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          color: '#fff', 
          fontSize: '18px', 
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>⚡</span>
          Safety Controls
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SafetyIndicator
            label="Auto-Trading"
            status={config.enabled ? (config.isPaused ? 'paused' : 'healthy') : 'paused'}
            message={config.enabled ? (config.isPaused ? 'Paused' : 'Enabled and active') : 'Disabled'}
          />
          <SafetyIndicator
            label="Consecutive Loss Limit"
            status={
              config.consecutiveLosses >= config.stopAfterLosses ? 'critical' 
              : config.consecutiveLosses >= config.stopAfterLosses - 1 ? 'warning'
              : 'healthy'
            }
            message={`${config.consecutiveLosses || 0} of ${config.stopAfterLosses || 3} losses before pause`}
          />
          <SafetyIndicator
            label="Position Limit"
            status={
              openPositions >= maxOpenPositions ? 'warning' 
              : openPositions >= maxOpenPositions - 1 ? 'warning'
              : 'healthy'
            }
            message={`${openPositions} of ${maxOpenPositions} positions open`}
          />
          <SafetyIndicator
            label="Daily Limit"
            status={
              dailyUsed >= maxPerDay ? 'critical' 
              : dailyUsed >= maxPerDay * 0.8 ? 'warning'
              : 'healthy'
            }
            message={`$${dailyUsed.toFixed(2)} of $${maxPerDay.toFixed(2)} daily limit used`}
          />
        </div>
      </div>

      {pendingApprovals > 0 && (
        <div style={{
          background: '#F3BA2F15',
          border: '1px solid #F3BA2F',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>⏳</span>
          <div>
            <div style={{ color: '#F3BA2F', fontWeight: 600, fontSize: '14px' }}>
              {pendingApprovals} Trade{pendingApprovals > 1 ? 's' : ''} Awaiting Approval
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              Review and approve or reject pending trades
            </div>
          </div>
        </div>
      )}

      {stats?.recentTrades && stats.recentTrades.length > 0 && (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h2 style={{ 
            color: '#fff', 
            fontSize: '18px', 
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>📋</span>
            Recent Trades
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 100px 100px',
            gap: '12px',
            padding: '8px 16px',
            color: '#666',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            <span>Token</span>
            <span>Signal</span>
            <span>Amount</span>
            <span style={{ textAlign: 'right' }}>Result</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {stats.recentTrades.map((trade, idx) => (
              <TradeCard key={trade.id || idx} trade={trade} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
