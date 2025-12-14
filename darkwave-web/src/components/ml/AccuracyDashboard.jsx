import { useState, useEffect, useCallback } from 'react'

const getWinRateColor = (rate) => {
  if (rate > 55) return '#14F195'
  if (rate >= 45) return '#F3BA2F'
  return '#FF6B6B'
}

const StatCard = ({ title, value, icon, color = '#00D4FF' }) => (
  <div style={{
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    minWidth: '140px',
    flex: 1
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{ color: '#888', fontSize: '13px', fontWeight: 500 }}>{title}</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 700, color }}>
      {value}
    </div>
  </div>
)

const WinRateCard = ({ horizon, data, trend }) => {
  const winRate = parseFloat(data?.winRate || 0)
  const total = data?.total || 0
  const correct = data?.correct || 0
  const color = getWinRateColor(winRate)
  const trendData = trend || {}
  const delta = parseFloat(trendData.delta || 0)
  const trendDirection = trendData.trend || 'neutral'
  
  const horizonLabels = {
    '1h': '1 Hour',
    '4h': '4 Hours',
    '24h': '24 Hours',
    '7d': '7 Days'
  }
  
  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '20px',
      minWidth: '200px',
      flex: 1
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <span style={{ color: '#888', fontSize: '14px', fontWeight: 500 }}>
          {horizonLabels[horizon] || horizon}
        </span>
        {trendDirection !== 'neutral' && trendDirection !== 'new' && (
          <span style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            background: trendDirection === 'improving' ? '#14F19515' : '#FF6B6B15',
            color: trendDirection === 'improving' ? '#14F195' : '#FF6B6B',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600
          }}>
            {trendDirection === 'improving' ? '↑' : '↓'}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {trendDirection === 'new' && (
          <span style={{ 
            padding: '4px 8px',
            background: '#00D4FF15',
            color: '#00D4FF',
            borderRadius: '6px',
            fontSize: '11px'
          }}>
            NEW
          </span>
        )}
      </div>
      
      <div style={{ 
        fontSize: '36px', 
        fontWeight: 700, 
        color,
        marginBottom: '8px'
      }}>
        {winRate.toFixed(1)}%
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ 
          height: '8px',
          background: '#0f0f0f',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(winRate, 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00D4FF, #9945FF)',
            borderRadius: '4px'
          }} />
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        color: '#666',
        fontSize: '12px'
      }}>
        <span>{correct} correct</span>
        <span>{total} total</span>
      </div>
    </div>
  )
}

const SampleProgressBar = ({ horizon, current, target = 50 }) => {
  const percent = Math.min((current / target) * 100, 100)
  const isComplete = current >= target
  
  const horizonLabels = {
    '1h': '1-Hour',
    '4h': '4-Hour',
    '24h': '24-Hour',
    '7d': '7-Day'
  }
  
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '6px',
        fontSize: '13px'
      }}>
        <span style={{ color: '#fff' }}>{horizonLabels[horizon]} Samples</span>
        <span style={{ color: isComplete ? '#14F195' : '#888' }}>
          {current} / {target} {isComplete && '✓'}
        </span>
      </div>
      <div style={{ 
        height: '6px',
        background: '#0f0f0f',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: isComplete 
            ? '#14F195' 
            : 'linear-gradient(90deg, #00D4FF, #9945FF)',
          borderRadius: '3px',
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  )
}

const ModelCard = ({ model }) => {
  const accuracy = parseFloat(model.accuracy || 0)
  const color = getWinRateColor(accuracy * 100)
  
  return (
    <div style={{
      background: '#141414',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{ 
            color: '#fff', 
            fontSize: '14px', 
            fontWeight: 600 
          }}>
            {model.ticker}
          </span>
          <span style={{ 
            padding: '2px 6px',
            background: '#0f0f0f',
            color: '#888',
            borderRadius: '4px',
            fontSize: '11px'
          }}>
            {model.horizon}
          </span>
          {model.isActive && (
            <span style={{ 
              padding: '2px 6px',
              background: '#14F19515',
              color: '#14F195',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600
            }}>
              ACTIVE
            </span>
          )}
        </div>
        <div style={{ color: '#666', fontSize: '11px' }}>
          Trained: {model.trainedAt ? new Date(model.trainedAt).toLocaleDateString() : 'N/A'} • 
          {model.sampleCount || 0} samples
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 700, 
          color 
        }}>
          {(accuracy * 100).toFixed(1)}%
        </div>
        <div style={{ color: '#666', fontSize: '11px' }}>accuracy</div>
      </div>
    </div>
  )
}

const PredictionRow = ({ prediction }) => {
  const signalColors = {
    'BUY': '#14F195',
    'STRONG_BUY': '#14F195',
    'SELL': '#FF6B6B',
    'STRONG_SELL': '#FF6B6B',
    'HOLD': '#F3BA2F',
    'NEUTRAL': '#888'
  }
  
  const signalColor = signalColors[prediction.signalType] || '#888'
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 100px 80px 100px 120px',
      gap: '12px',
      padding: '12px 16px',
      background: '#141414',
      borderRadius: '8px',
      alignItems: 'center',
      fontSize: '13px'
    }}>
      <span style={{ color: '#fff', fontWeight: 500 }}>
        {prediction.ticker}
      </span>
      <span style={{ 
        color: signalColor,
        fontWeight: 600
      }}>
        {prediction.signalType}
      </span>
      <span style={{ color: '#888' }}>
        {(prediction.confidence * 100).toFixed(0)}%
      </span>
      <span style={{ color: '#00D4FF' }}>
        ${parseFloat(prediction.price || 0).toFixed(4)}
      </span>
      <span style={{ color: '#666', fontSize: '11px' }}>
        {prediction.createdAt ? new Date(prediction.createdAt).toLocaleString() : 'N/A'}
      </span>
    </div>
  )
}

export default function AccuracyDashboard() {
  const [stats, setStats] = useState(null)
  const [modelStatus, setModelStatus] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, modelRes, trendsRes] = await Promise.all([
        fetch('/api/ml/stats'),
        fetch('/api/ml/model-status'),
        fetch('/api/ml/accuracy-trends')
      ])
      
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
      
      if (modelRes.ok) {
        const data = await modelRes.json()
        setModelStatus(data)
      }
      
      if (trendsRes.ok) {
        const data = await trendsRes.json()
        setTrends(data)
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch accuracy data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
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
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <div style={{ color: '#888' }}>Loading AI Performance Data...</div>
      </div>
    )
  }

  const horizons = ['1h', '4h', '24h', '7d']
  const trendsByHorizon = trends?.technicalAnalysis?.byHorizon || {}

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
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
            <span>📊</span>
            AI Prediction Performance
          </h1>
          <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0 0' }}>
            Track accuracy and model performance across all time horizons
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
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <StatCard 
          icon="📈" 
          title="Total Predictions" 
          value={stats?.totalPredictions || 0}
          color="#00D4FF"
        />
        <StatCard 
          icon="🟢" 
          title="Buy Signals" 
          value={stats?.buySignals || 0}
          color="#14F195"
        />
        <StatCard 
          icon="🔴" 
          title="Sell Signals" 
          value={stats?.sellSignals || 0}
          color="#FF6B6B"
        />
        <StatCard 
          icon="🟡" 
          title="Hold Signals" 
          value={stats?.holdSignals || 0}
          color="#F3BA2F"
        />
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
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>🎯</span>
          Win Rates by Horizon
          {trends?.technicalAnalysis?.overall?.trend === 'improving' && (
            <span style={{ 
              padding: '4px 12px',
              background: '#14F19515',
              color: '#14F195',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ↑ Improving
            </span>
          )}
          {trends?.technicalAnalysis?.overall?.trend === 'declining' && (
            <span style={{ 
              padding: '4px 12px',
              background: '#FF6B6B15',
              color: '#FF6B6B',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ↓ Declining
            </span>
          )}
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          {horizons.map(h => (
            <WinRateCard 
              key={h}
              horizon={h}
              data={stats?.outcomesByHorizon?.[h]}
              trend={trendsByHorizon[h]}
            />
          ))}
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
          <span>📚</span>
          Training Data Progress
          <span style={{ 
            color: '#888', 
            fontSize: '12px', 
            fontWeight: 400 
          }}>
            (50 samples needed per horizon)
          </span>
        </h2>
        
        {horizons.map(h => (
          <SampleProgressBar 
            key={h}
            horizon={h}
            current={stats?.outcomesByHorizon?.[h]?.total || 0}
            target={50}
          />
        ))}
      </div>

      {modelStatus && modelStatus.models && modelStatus.models.length > 0 && (
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
            <span>🧠</span>
            Model Status
            <span style={{ 
              padding: '4px 10px',
              background: '#00D4FF15',
              color: '#00D4FF',
              borderRadius: '8px',
              fontSize: '12px'
            }}>
              {modelStatus.activeModels} active / {modelStatus.totalModels} total
            </span>
          </h2>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px' 
          }}>
            {modelStatus.models.slice(0, 10).map((model, idx) => (
              <ModelCard key={model.id || idx} model={model} />
            ))}
          </div>
        </div>
      )}

      {stats?.recentPredictions && stats.recentPredictions.length > 0 && (
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
            Recent Predictions
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 80px 100px 120px',
            gap: '12px',
            padding: '8px 16px',
            color: '#666',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            <span>Ticker</span>
            <span>Signal</span>
            <span>Confidence</span>
            <span>Price</span>
            <span>Time</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '6px' 
          }}>
            {stats.recentPredictions.map((prediction, idx) => (
              <PredictionRow key={prediction.id || idx} prediction={prediction} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
