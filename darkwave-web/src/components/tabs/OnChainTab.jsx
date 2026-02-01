import { useState, useEffect } from 'react'
import './OnChainTab.css'

const CHAINS = [
  { id: 'solana', name: 'Solana', icon: '◎' },
  { id: 'ethereum', name: 'Ethereum', icon: 'Ξ' },
  { id: 'base', name: 'Base', icon: '🔵' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' }
]

export default function OnChainTab() {
  const [gasPrices, setGasPrices] = useState({})
  const [dexVolumes, setDexVolumes] = useState([])
  const [holderStats, setHolderStats] = useState(null)
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedChain, setSelectedChain] = useState('solana')
  const [tokenAddress, setTokenAddress] = useState('')

  useEffect(() => {
    fetchData()
  }, [selectedChain])

  const fetchData = async () => {
    try {
      const [gasRes, volumeRes] = await Promise.all([
        fetch('/api/onchain/gas').catch(() => null),
        fetch(`/api/onchain/dex-volume?chain=${selectedChain}`).catch(() => null)
      ])

      if (gasRes?.ok) setGasPrices((await gasRes.json()).gasPrices || {})
      if (volumeRes?.ok) setDexVolumes((await volumeRes.json()).volumes || [])
    } catch (err) {
      console.error('OnChain fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTokenData = async () => {
    if (!tokenAddress) return
    
    try {
      const [holderRes, flowRes] = await Promise.all([
        fetch(`/api/onchain/holders?tokenAddress=${tokenAddress}&chain=${selectedChain}`).catch(() => null),
        fetch(`/api/onchain/flows?tokenAddress=${tokenAddress}&chain=${selectedChain}`).catch(() => null)
      ])

      if (holderRes?.ok) setHolderStats((await holderRes.json()).stats || null)
      if (flowRes?.ok) setFlows((await flowRes.json()).flows || [])
    } catch (err) {
      console.error('Token data fetch error:', err)
    }
  }

  const formatValue = (value) => {
    const num = parseFloat(value) || 0
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="onchain-tab">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" />
          <p style={{ color: '#888', marginTop: 16 }}>Loading on-chain data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="onchain-tab">
      <div className="onchain-header">
        <div>
          <h2 className="onchain-title">On-Chain Analytics</h2>
          <p className="onchain-subtitle">Gas prices, DEX volume, holder distribution & token flows</p>
        </div>
        <div className="chain-selector">
          {CHAINS.map(chain => (
            <button
              key={chain.id}
              className={`chain-btn ${selectedChain === chain.id ? 'active' : ''}`}
              onClick={() => setSelectedChain(chain.id)}
            >
              {chain.icon} {chain.name}
            </button>
          ))}
        </div>
      </div>

      <div className="gas-section">
        <h3>⛽ Gas Tracker</h3>
        <div className="gas-grid">
          {Object.entries(gasPrices).map(([chain, data]) => (
            <div key={chain} className="gas-card">
              <div className="gas-chain">
                {CHAINS.find(c => c.id === chain)?.icon || '⛓️'} {chain}
              </div>
              <div className="gas-levels">
                <div className="gas-level slow">
                  <span className="level-label">Slow</span>
                  <span className="level-value">{parseFloat(data.slow || 0).toFixed(1)} gwei</span>
                </div>
                <div className="gas-level standard">
                  <span className="level-label">Standard</span>
                  <span className="level-value">{parseFloat(data.standard || 0).toFixed(1)} gwei</span>
                </div>
                <div className="gas-level fast">
                  <span className="level-label">Fast</span>
                  <span className="level-value">{parseFloat(data.fast || 0).toFixed(1)} gwei</span>
                </div>
                <div className="gas-level instant">
                  <span className="level-label">Instant</span>
                  <span className="level-value">{parseFloat(data.instant || 0).toFixed(1)} gwei</span>
                </div>
              </div>
              {data.swapCostUsd && (
                <div className="swap-cost">
                  Est. Swap: {formatValue(data.swapCostUsd)}
                </div>
              )}
              <div className={`congestion ${data.congestion?.toLowerCase()}`}>
                {data.congestion || 'Normal'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="volume-section">
        <div className="section-header">
          <h3>📊 DEX Volume (24h)</h3>
        </div>
        
        {dexVolumes.length === 0 ? (
          <div className="empty-state">
            <p>No DEX volume data available for {selectedChain}</p>
          </div>
        ) : (
          <div className="volume-table">
            <div className="volume-header">
              <span>Token</span>
              <span>DEX</span>
              <span>Volume (24h)</span>
              <span>Trades</span>
              <span>Buy/Sell</span>
            </div>
            {dexVolumes.slice(0, 15).map((vol, i) => (
              <div key={vol.id || i} className="volume-row">
                <div className="vol-token">{vol.tokenSymbol || 'Unknown'}</div>
                <div className="vol-dex">{vol.dexName || '-'}</div>
                <div className="vol-volume">{formatValue(vol.volume24h)}</div>
                <div className="vol-trades">{vol.trades24h || 0}</div>
                <div className="vol-ratio">
                  <div className="ratio-bar">
                    <div 
                      className="ratio-buy" 
                      style={{ 
                        width: `${(parseFloat(vol.buyVolume || 0) / (parseFloat(vol.buyVolume || 0) + parseFloat(vol.sellVolume || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  <span className="ratio-text">
                    {formatValue(vol.buyVolume)} / {formatValue(vol.sellVolume)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="token-lookup">
        <h3>🔍 Token Lookup</h3>
        <div className="lookup-form">
          <input
            type="text"
            placeholder="Enter token address..."
            value={tokenAddress}
            onChange={e => setTokenAddress(e.target.value)}
            className="lookup-input"
          />
          <button className="btn btn-primary" onClick={fetchTokenData}>
            Analyze
          </button>
        </div>

        {holderStats && (
          <div className="holder-stats">
            <h4>Holder Distribution</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Holders</span>
                <span className="stat-value">{holderStats.totalHolders?.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Top 10 Hold</span>
                <span className="stat-value">{parseFloat(holderStats.top10Percent || 0).toFixed(2)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Top 50 Hold</span>
                <span className="stat-value">{parseFloat(holderStats.top50Percent || 0).toFixed(2)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">24h Change</span>
                <span className={`stat-value ${holderStats.holdersChange24h >= 0 ? 'positive' : 'negative'}`}>
                  {holderStats.holdersChange24h >= 0 ? '+' : ''}{holderStats.holdersChange24h}
                </span>
              </div>
            </div>
          </div>
        )}

        {flows.length > 0 && (
          <div className="token-flows">
            <h4>Recent Token Flows</h4>
            <div className="flows-list">
              {flows.slice(0, 10).map((flow, i) => (
                <div key={flow.id || i} className="flow-item">
                  <div className={`flow-type ${flow.flowType?.toLowerCase()}`}>
                    {flow.flowType}
                  </div>
                  <div className="flow-categories">
                    {flow.fromCategory} → {flow.toCategory}
                  </div>
                  <div className="flow-value">{formatValue(flow.valueUsd)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
