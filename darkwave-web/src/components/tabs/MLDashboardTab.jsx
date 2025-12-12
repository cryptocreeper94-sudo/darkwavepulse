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

const ProgressBar = ({ current, target, label, color = '#00D4FF' }) => {
  const percent = Math.min((current / target) * 100, 100)
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: '#fff', fontSize: '13px' }}>{label}</span>
        <span style={{ color: percent >= 100 ? '#00ff88' : '#888', fontSize: '13px' }}>
          {current} / {target} {percent >= 100 ? '✓' : ''}
        </span>
      </div>
      <div style={{ 
        background: '#333', 
        borderRadius: '6px', 
        height: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: percent >= 100 ? '#00ff88' : color,
          borderRadius: '6px',
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  )
}

const HorizonCard = ({ horizon, data }) => {
  const winRate = parseFloat(data?.winRate || 0)
  const color = winRate >= 60 ? '#00ff88' : winRate >= 50 ? '#ffaa00' : '#ff4466'
  
  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center'
    }}>
      <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
        {horizon} Horizon
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color }}>
        {winRate.toFixed(1)}%
      </div>
      <div style={{ color: '#666', fontSize: '11px' }}>
        {data?.correct || 0} / {data?.total || 0} correct
      </div>
    </div>
  )
}

const ApiUsageCard = ({ name, icon, data }) => {
  const percent = parseFloat(data?.percentUsed || 0)
  const statusColor = data?.status === 'healthy' ? '#00ff88' : data?.status === 'warning' ? '#ffaa00' : '#888'
  
  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '16px',
      flex: '1',
      minWidth: '240px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{name}</span>
        <span style={{ 
          marginLeft: 'auto',
          padding: '2px 8px',
          background: statusColor + '22',
          color: statusColor,
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600
        }}>
          {data?.status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#888', fontSize: '12px' }}>Monthly Usage</span>
          <span style={{ color: '#fff', fontSize: '12px' }}>{percent}%</span>
        </div>
        <div style={{ background: '#333', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(percent, 100)}%`,
            height: '100%',
            background: statusColor,
            borderRadius: '4px',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
        <div>
          <div style={{ color: '#666' }}>Today</div>
          <div style={{ color: '#fff', fontWeight: 600 }}>{data?.callsToday?.toLocaleString() || 0}</div>
        </div>
        <div>
          <div style={{ color: '#666' }}>This Month</div>
          <div style={{ color: '#fff', fontWeight: 600 }}>{data?.callsThisMonth?.toLocaleString() || 0}</div>
        </div>
        <div>
          <div style={{ color: '#666' }}>Limit</div>
          <div style={{ color: '#888' }}>{data?.monthlyLimit?.toLocaleString() || 0}</div>
        </div>
        <div>
          <div style={{ color: '#666' }}>Est. Cost</div>
          <div style={{ color: '#00ff88', fontWeight: 600 }}>{data?.estimatedMonthlyCost || '$0'}</div>
        </div>
      </div>
    </div>
  )
}

const WinRateCard = ({ title, icon, data, color = '#00D4FF' }) => {
  const winRate = data?.currentWinRate
  const delta = parseFloat(data?.delta || 0)
  const trend = data?.trend || 'neutral'
  const samples = data?.currentSamples || 0
  
  const getTrendIcon = () => {
    if (trend === 'improving') return '↑'
    if (trend === 'declining') return '↓'
    if (trend === 'new') return '★'
    return '→'
  }
  
  const getTrendColor = () => {
    if (trend === 'improving') return '#00ff88'
    if (trend === 'declining') return '#ff4466'
    if (trend === 'new') return '#00D4FF'
    return '#888'
  }
  
  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'center',
      flex: 1,
      minWidth: '200px',
      border: `1px solid ${color}33`
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>{title}</div>
      
      {winRate !== null ? (
        <>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 700, 
            color: parseFloat(winRate) >= 60 ? '#00ff88' : parseFloat(winRate) >= 50 ? '#ffaa00' : '#ff4466',
            lineHeight: 1
          }}>
            {winRate}%
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '6px',
            marginTop: '12px'
          }}>
            {data?.delta !== null && (
              <span style={{ 
                padding: '4px 10px',
                background: getTrendColor() + '22',
                color: getTrendColor(),
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {getTrendIcon()} {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs last week
              </span>
            )}
            {trend === 'new' && (
              <span style={{ 
                padding: '4px 10px',
                background: '#00D4FF22',
                color: '#00D4FF',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                New data
              </span>
            )}
          </div>
          <div style={{ color: '#666', fontSize: '11px', marginTop: '8px' }}>
            Based on {samples} predictions this week
          </div>
        </>
      ) : (
        <div style={{ color: '#666', fontSize: '14px' }}>
          Collecting data...
          <div style={{ fontSize: '11px', marginTop: '4px' }}>
            Need more predictions to calculate
          </div>
        </div>
      )}
    </div>
  )
}

export default function MLDashboardTab() {
  const [stats, setStats] = useState(null)
  const [strikeAgentStats, setStrikeAgentStats] = useState(null)
  const [apiUsage, setApiUsage] = useState(null)
  const [accuracyTrends, setAccuracyTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [apiAccordionOpen, setApiAccordionOpen] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const [predRes, saRes, apiRes, trendsRes] = await Promise.all([
        fetch('/api/ml/stats'),
        fetch('/api/sniper/ml/stats'),
        fetch('/api/ml/api-usage'),
        fetch('/api/ml/accuracy-trends')
      ])
      
      if (predRes.ok) {
        const data = await predRes.json()
        setStats(data)
      }
      
      if (saRes.ok) {
        const data = await saRes.json()
        setStrikeAgentStats(data)
      }
      
      if (apiRes.ok) {
        const data = await apiRes.json()
        setApiUsage(data)
      }
      
      if (trendsRes.ok) {
        const data = await trendsRes.json()
        setAccuracyTrends(data)
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch ML stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
        <div style={{ color: '#888' }}>Loading ML Dashboard...</div>
      </div>
    )
  }

  const totalPredictions = (stats?.totalPredictions || 0)
  const totalSA = (strikeAgentStats?.totalPredictions || 0)
  const samplesNeeded = 50

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '24px', margin: 0 }}>
            🧠 AI Learning Dashboard
          </h1>
          <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0 0' }}>
            Watch the ML system collect data and improve predictions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastRefresh && (
            <span style={{ color: '#666', fontSize: '12px' }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStats}
            style={{
              padding: '8px 16px',
              background: '#333',
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

      {/* AI Performance Overview - Win Rates with Deltas */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f1a0f, #1a2a1a)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #00ff8833'
      }}>
        <h2 style={{ color: '#fff', fontSize: '18px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>📈</span> AI Performance Overview
          {accuracyTrends?.technicalAnalysis?.overall?.trend === 'improving' && (
            <span style={{ 
              padding: '4px 12px',
              background: '#00ff8822',
              color: '#00ff88',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              ↑ Improving
            </span>
          )}
        </h2>
        
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}>
          <WinRateCard 
            title="Technical Analysis Win Rate"
            icon="📊"
            data={accuracyTrends?.technicalAnalysis?.overall}
            color="#00D4FF"
          />
          <WinRateCard 
            title="StrikeAgent Win Rate"
            icon="🎯"
            data={accuracyTrends?.strikeAgent}
            color="#ff6b00"
          />
        </div>
        
        {/* Horizon breakdown */}
        {accuracyTrends?.technicalAnalysis?.byHorizon && Object.keys(accuracyTrends.technicalAnalysis.byHorizon).some(
          h => accuracyTrends.technicalAnalysis.byHorizon[h]?.currentWinRate !== null
        ) && (
          <div style={{ 
            background: '#1a1a1a', 
            borderRadius: '12px', 
            padding: '16px' 
          }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
              Win Rate by Time Horizon (This Week vs Last Week)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              {['1h', '4h', '24h', '7d'].map(h => {
                const hData = accuracyTrends?.technicalAnalysis?.byHorizon?.[h]
                const winRate = hData?.currentWinRate
                const delta = parseFloat(hData?.delta || 0)
                const trend = hData?.trend
                
                return (
                  <div key={h} style={{ textAlign: 'center', padding: '12px', background: '#141414', borderRadius: '8px' }}>
                    <div style={{ color: '#666', fontSize: '11px', marginBottom: '4px' }}>{h} Horizon</div>
                    {winRate !== null ? (
                      <>
                        <div style={{ 
                          fontSize: '24px', 
                          fontWeight: 700, 
                          color: parseFloat(winRate) >= 60 ? '#00ff88' : parseFloat(winRate) >= 50 ? '#ffaa00' : '#ff4466'
                        }}>
                          {winRate}%
                        </div>
                        {hData?.delta !== null && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: trend === 'improving' ? '#00ff88' : trend === 'declining' ? '#ff4466' : '#888',
                            marginTop: '4px'
                          }}>
                            {trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→'} {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: '#444', fontSize: '12px' }}>--</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* API Cost Monitor Accordion */}
      <div style={{ 
        background: '#141414',
        borderRadius: '16px',
        marginBottom: '24px',
        border: '1px solid #222',
        overflow: 'hidden'
      }}>
        <button 
          onClick={() => setApiAccordionOpen(!apiAccordionOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#fff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>💰</span>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>API Cost Monitor</span>
            {apiUsage?.summary && (
              <span style={{ 
                padding: '4px 10px',
                background: '#00ff8822',
                color: '#00ff88',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                Est. {apiUsage.summary.estimatedTotalCost}
              </span>
            )}
          </div>
          <span style={{ 
            transform: apiAccordionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            color: '#00D4FF'
          }}>
            ▼
          </span>
        </button>
        
        {apiAccordionOpen && (
          <div style={{ padding: '0 20px 20px 20px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              flexWrap: 'wrap',
              marginBottom: '16px'
            }}>
              <ApiUsageCard 
                name="CoinGecko PRO" 
                icon="🦎" 
                data={apiUsage?.coingecko}
              />
              <ApiUsageCard 
                name="Helius RPC" 
                icon="☀️" 
                data={apiUsage?.helius}
              />
            </div>
            
            <div style={{ 
              background: '#1a1a1a', 
              borderRadius: '12px', 
              padding: '16px' 
            }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
                {apiUsage?.period?.month} {apiUsage?.period?.year} Breakdown (Day {apiUsage?.period?.dayOfMonth} of {apiUsage?.period?.daysInMonth})
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#666', fontSize: '11px' }}>Predictions Logged</div>
                  <div style={{ color: '#00D4FF', fontSize: '18px', fontWeight: 600 }}>
                    {apiUsage?.breakdown?.predictions || 0}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '11px' }}>Token Scans</div>
                  <div style={{ color: '#ff6b00', fontSize: '18px', fontWeight: 600 }}>
                    {apiUsage?.breakdown?.tokenScans || 0}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '11px' }}>Outcome Checks</div>
                  <div style={{ color: '#888', fontSize: '18px', fontWeight: 600 }}>
                    {apiUsage?.breakdown?.outcomeChecks || 0}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '11px' }}>Total API Calls</div>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>
                    {apiUsage?.summary?.totalApiCalls?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        background: '#141414',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '16px', margin: '0 0 20px 0' }}>
          📊 Technical Analysis Predictions
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <StatCard 
            icon="📈" 
            title="Total Predictions" 
            value={totalPredictions} 
            subtitle="From /analyze calls"
            color="#00D4FF"
          />
          <StatCard 
            icon="🎯" 
            title="BUY Signals" 
            value={stats?.buySignals || 0}
            color="#00ff88"
          />
          <StatCard 
            icon="📉" 
            title="SELL Signals" 
            value={stats?.sellSignals || 0}
            color="#ff4466"
          />
          <StatCard 
            icon="⏸️" 
            title="HOLD Signals" 
            value={stats?.holdSignals || 0}
            color="#ffaa00"
          />
        </div>

        <h3 style={{ color: '#888', fontSize: '14px', margin: '0 0 12px 0' }}>
          Data Collection Progress (need 50+ for model training)
        </h3>
        <ProgressBar 
          current={stats?.outcomesByHorizon?.['1h']?.total || 0} 
          target={samplesNeeded} 
          label="1-Hour Outcomes" 
          color="#00D4FF"
        />
        <ProgressBar 
          current={stats?.outcomesByHorizon?.['4h']?.total || 0} 
          target={samplesNeeded} 
          label="4-Hour Outcomes" 
          color="#00A0CC"
        />
        <ProgressBar 
          current={stats?.outcomesByHorizon?.['24h']?.total || 0} 
          target={samplesNeeded} 
          label="24-Hour Outcomes" 
          color="#0088AA"
        />
        <ProgressBar 
          current={stats?.outcomesByHorizon?.['7d']?.total || 0} 
          target={samplesNeeded} 
          label="7-Day Outcomes" 
          color="#006688"
        />

        {(stats?.outcomesByHorizon?.['1h']?.total || 0) > 0 && (
          <>
            <h3 style={{ color: '#888', fontSize: '14px', margin: '24px 0 12px 0' }}>
              Current Accuracy by Time Horizon
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px'
            }}>
              <HorizonCard horizon="1h" data={stats?.outcomesByHorizon?.['1h']} />
              <HorizonCard horizon="4h" data={stats?.outcomesByHorizon?.['4h']} />
              <HorizonCard horizon="24h" data={stats?.outcomesByHorizon?.['24h']} />
              <HorizonCard horizon="7d" data={stats?.outcomesByHorizon?.['7d']} />
            </div>
          </>
        )}
      </div>

      <div style={{ 
        background: '#141414',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '16px', margin: '0 0 20px 0' }}>
          🎯 StrikeAgent Token Discoveries
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <StatCard 
            icon="🔍" 
            title="Tokens Analyzed" 
            value={totalSA}
            subtitle="From token scans"
            color="#ff6b00"
          />
          <StatCard 
            icon="🚀" 
            title="Snipe Recommendations" 
            value={strikeAgentStats?.snipeRecommendations || 0}
            color="#00ff88"
          />
          <StatCard 
            icon="👀" 
            title="Watch Recommendations" 
            value={strikeAgentStats?.watchRecommendations || 0}
            color="#ffaa00"
          />
          <StatCard 
            icon="⚠️" 
            title="Avoid Recommendations" 
            value={strikeAgentStats?.avoidRecommendations || 0}
            color="#ff4466"
          />
        </div>

        <h3 style={{ color: '#888', fontSize: '14px', margin: '0 0 12px 0' }}>
          Token Outcome Tracking Progress
        </h3>
        <ProgressBar 
          current={strikeAgentStats?.outcomesByHorizon?.['1h']?.total || 0} 
          target={samplesNeeded} 
          label="1-Hour Token Outcomes" 
          color="#ff6b00"
        />
        <ProgressBar 
          current={strikeAgentStats?.outcomesByHorizon?.['4h']?.total || 0} 
          target={samplesNeeded} 
          label="4-Hour Token Outcomes" 
          color="#cc5500"
        />
        <ProgressBar 
          current={strikeAgentStats?.outcomesByHorizon?.['24h']?.total || 0} 
          target={samplesNeeded} 
          label="24-Hour Token Outcomes" 
          color="#aa4400"
        />

        {(strikeAgentStats?.outcomesByHorizon?.['1h']?.total || 0) > 0 && (
          <>
            <h3 style={{ color: '#888', fontSize: '14px', margin: '24px 0 12px 0' }}>
              Token Prediction Accuracy
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px'
            }}>
              <HorizonCard horizon="1h" data={strikeAgentStats?.outcomesByHorizon?.['1h']} />
              <HorizonCard horizon="4h" data={strikeAgentStats?.outcomesByHorizon?.['4h']} />
              <HorizonCard horizon="24h" data={strikeAgentStats?.outcomesByHorizon?.['24h']} />
              <HorizonCard horizon="7d" data={strikeAgentStats?.outcomesByHorizon?.['7d']} />
            </div>
          </>
        )}
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #00D4FF33'
      }}>
        <h2 style={{ color: '#fff', fontSize: '16px', margin: '0 0 16px 0' }}>
          🤖 How the AI Learning System Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ color: '#00D4FF', fontWeight: 600, marginBottom: '8px' }}>
              1. Data Collection (Current Phase)
            </div>
            <p style={{ color: '#888', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Every time you analyze a coin or scan a token, the system logs the prediction with all indicators. 
              We need 50+ samples per time horizon before training.
            </p>
          </div>
          <div>
            <div style={{ color: '#00D4FF', fontWeight: 600, marginBottom: '8px' }}>
              2. Outcome Tracking (Running Hourly)
            </div>
            <p style={{ color: '#888', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Background workers check each prediction at 1h, 4h, 24h, and 7d to see if the price moved as predicted.
              This builds a dataset of "what worked" and "what didn't".
            </p>
          </div>
          <div>
            <div style={{ color: '#00D4FF', fontWeight: 600, marginBottom: '8px' }}>
              3. Model Training (Weekly)
            </div>
            <p style={{ color: '#888', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Every Sunday at 3 AM, the system trains ML models on the collected data.
              Models with &gt;55% accuracy get activated for live predictions.
            </p>
          </div>
          <div>
            <div style={{ color: '#00D4FF', fontWeight: 600, marginBottom: '8px' }}>
              4. Autonomous Trading (Future)
            </div>
            <p style={{ color: '#888', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Once accuracy is proven &gt;60% over 30+ days, the system can auto-trigger trades through StrikeAgent.
              Gradual rollout: Observer → Approval → Semi-Auto → Full Auto.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
