import { useState, useEffect } from 'react'
import './DeFiTab.css'

const POSITION_TYPES = {
  staking: { icon: '🥩', label: 'Staking' },
  lp: { icon: '💧', label: 'Liquidity Pool' },
  lending: { icon: '🏦', label: 'Lending' },
  farming: { icon: '🌾', label: 'Yield Farming' },
  vault: { icon: '🔐', label: 'Vault' }
}

export default function DeFiTab({ userId }) {
  const [positions, setPositions] = useState([])
  const [summary, setSummary] = useState(null)
  const [protocols, setProtocols] = useState([])
  const [yields, setYields] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('positions')
  const [selectedChain, setSelectedChain] = useState('all')

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      const [posRes, protocolRes, yieldRes] = await Promise.all([
        userId ? fetch(`/api/defi/positions?userId=${userId}`).catch(() => null) : null,
        fetch('/api/defi/protocols').catch(() => null),
        fetch('/api/defi/yields?minApy=5').catch(() => null)
      ])

      if (posRes?.ok) {
        const data = await posRes.json()
        setPositions(data.positions || [])
        setSummary(data.summary || null)
      }
      if (protocolRes?.ok) setProtocols((await protocolRes.json()).protocols || [])
      if (yieldRes?.ok) setYields((await yieldRes.json()).opportunities || [])
    } catch (err) {
      console.error('DeFi fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value) => {
    const num = parseFloat(value) || 0
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatApy = (apy) => {
    const num = parseFloat(apy) || 0
    return `${num.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="defi-tab">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" />
          <p style={{ color: '#888', marginTop: 16 }}>Loading DeFi dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="defi-tab">
      <div className="defi-header">
        <div>
          <h2 className="defi-title">DeFi Dashboard</h2>
          <p className="defi-subtitle">Track staking, liquidity, and yield opportunities</p>
        </div>
      </div>

      {summary && (
        <div className="defi-summary">
          <div className="summary-card primary">
            <div className="summary-label">Total DeFi Value</div>
            <div className="summary-value">{formatValue(summary.totalValue)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Daily Yield</div>
            <div className="summary-value positive">+{formatValue(summary.totalDailyYield)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Avg APY</div>
            <div className="summary-value">{formatApy(summary.avgApy)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Positions</div>
            <div className="summary-value">{summary.positionsCount}</div>
          </div>
        </div>
      )}

      <div className="defi-nav">
        {['positions', 'yields', 'protocols'].map(view => (
          <button
            key={view}
            className={`defi-nav-btn ${activeView === view ? 'active' : ''}`}
            onClick={() => setActiveView(view)}
          >
            {view === 'positions' && '📊 My Positions'}
            {view === 'yields' && '🌾 Yield Finder'}
            {view === 'protocols' && '🏛️ Protocols'}
          </button>
        ))}
      </div>

      {activeView === 'positions' && (
        <div className="defi-section">
          {positions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💧</div>
              <h3>No DeFi Positions</h3>
              <p>Connect your wallet to track staking, LPs, and yield farming positions</p>
              <button className="btn btn-primary" onClick={fetchData}>Refresh</button>
            </div>
          ) : (
            <div className="positions-grid">
              {positions.map((pos, i) => (
                <div key={pos.id || i} className="position-card">
                  <div className="position-header">
                    <div className="position-type">
                      {POSITION_TYPES[pos.positionType]?.icon || '📊'}
                      <span>{POSITION_TYPES[pos.positionType]?.label || pos.positionType}</span>
                    </div>
                    <span className="position-chain">{pos.chain}</span>
                  </div>
                  <div className="position-protocol">{pos.protocol}</div>
                  <div className="position-pool">{pos.poolName}</div>
                  <div className="position-stats">
                    <div className="pos-stat">
                      <span className="pos-stat-label">Value</span>
                      <span className="pos-stat-value">{formatValue(pos.valueUsd)}</span>
                    </div>
                    <div className="pos-stat">
                      <span className="pos-stat-label">APY</span>
                      <span className="pos-stat-value positive">{formatApy(pos.apy)}</span>
                    </div>
                    {pos.dailyYieldUsd && (
                      <div className="pos-stat">
                        <span className="pos-stat-label">Daily</span>
                        <span className="pos-stat-value positive">+{formatValue(pos.dailyYieldUsd)}</span>
                      </div>
                    )}
                  </div>
                  {pos.pendingRewards && parseFloat(pos.pendingRewards) > 0 && (
                    <div className="position-rewards">
                      <span className="rewards-label">Pending:</span>
                      <span className="rewards-value">{parseFloat(pos.pendingRewards).toFixed(4)} {pos.rewardToken}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'yields' && (
        <div className="defi-section">
          <div className="section-header">
            <h3>Top Yield Opportunities</h3>
            <select 
              className="chain-select"
              value={selectedChain}
              onChange={e => setSelectedChain(e.target.value)}
            >
              <option value="all">All Chains</option>
              <option value="solana">Solana</option>
              <option value="ethereum">Ethereum</option>
              <option value="base">Base</option>
              <option value="arbitrum">Arbitrum</option>
            </select>
          </div>
          
          {yields.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🌾</div>
              <p>No yield opportunities found</p>
            </div>
          ) : (
            <div className="yields-table">
              <div className="yields-header">
                <span>Pool</span>
                <span>Protocol</span>
                <span>Chain</span>
                <span>TVL</span>
                <span>APY</span>
                <span>Risk</span>
              </div>
              {yields
                .filter(y => selectedChain === 'all' || y.chain === selectedChain)
                .slice(0, 20)
                .map((y, i) => (
                  <div key={y.id || i} className="yield-row">
                    <div className="yield-pool">
                      <div className="pool-name">{y.poolName}</div>
                      <div className="pool-tokens">{y.tokens}</div>
                    </div>
                    <div className="yield-protocol">{y.protocolId}</div>
                    <div className="yield-chain">{y.chain}</div>
                    <div className="yield-tvl">{formatValue(y.tvl)}</div>
                    <div className="yield-apy">
                      <span className="apy-value">{formatApy(y.apy)}</span>
                      {y.rewardApy && parseFloat(y.rewardApy) > 0 && (
                        <span className="apy-breakdown">
                          Base: {formatApy(y.baseApy)} + Rewards: {formatApy(y.rewardApy)}
                        </span>
                      )}
                    </div>
                    <div className={`yield-risk ${y.riskLevel?.toLowerCase()}`}>
                      {y.riskLevel || 'Unknown'}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'protocols' && (
        <div className="defi-section">
          <div className="section-header">
            <h3>DeFi Protocols</h3>
          </div>
          
          {protocols.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏛️</div>
              <p>No protocols data available</p>
            </div>
          ) : (
            <div className="protocols-grid">
              {protocols.slice(0, 12).map((protocol, i) => (
                <div key={protocol.id || i} className="protocol-card">
                  <div className="protocol-header">
                    {protocol.logoUrl && <img src={protocol.logoUrl} alt="" className="protocol-logo" />}
                    <div className="protocol-info">
                      <div className="protocol-name">{protocol.name}</div>
                      <div className="protocol-chain">{protocol.chain}</div>
                    </div>
                  </div>
                  <div className="protocol-stats">
                    <div className="protocol-stat">
                      <span className="stat-label">TVL</span>
                      <span className="stat-value">{formatValue(protocol.tvl)}</span>
                    </div>
                    <div className="protocol-stat">
                      <span className="stat-label">Avg APY</span>
                      <span className="stat-value positive">{formatApy(protocol.avgApy)}</span>
                    </div>
                  </div>
                  {protocol.tvlChange24h && (
                    <div className={`protocol-change ${parseFloat(protocol.tvlChange24h) >= 0 ? 'positive' : 'negative'}`}>
                      {parseFloat(protocol.tvlChange24h) >= 0 ? '+' : ''}{parseFloat(protocol.tvlChange24h).toFixed(2)}% (24h)
                    </div>
                  )}
                  <div className="protocol-badges">
                    {protocol.isAudited && <span className="badge audit">Audited</span>}
                    <span className={`badge risk-${protocol.riskScore?.toLowerCase()}`}>{protocol.riskScore} Risk</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
