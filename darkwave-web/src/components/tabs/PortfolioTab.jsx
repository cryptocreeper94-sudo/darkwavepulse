import { useState, useEffect, useRef } from 'react'
import './PortfolioTab.css'

const CHAIN_OPTIONS = [
  { id: 'solana', name: 'Solana', icon: '◎' },
  { id: 'ethereum', name: 'Ethereum', icon: 'Ξ' },
  { id: 'base', name: 'Base', icon: '🔵' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
  { id: 'polygon', name: 'Polygon', icon: '⬡' },
  { id: 'bsc', name: 'BSC', icon: '🟡' },
  { id: 'avalanche', name: 'Avalanche', icon: '🔺' },
  { id: 'optimism', name: 'Optimism', icon: '🔴' }
]

const CHART_COLORS = [
  '#00D4FF', '#39FF14', '#FF6B35', '#9B59B6', '#F39C12',
  '#E74C3C', '#1ABC9C', '#3498DB', '#E91E63', '#00BCD4'
]

function AllocationPieChart({ data }) {
  const canvasRef = useRef(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || data.length === 0) return
    
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const size = 180
    
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)
    
    const cx = size / 2
    const cy = size / 2
    const radius = 70
    const innerRadius = 45
    
    ctx.clearRect(0, 0, size, size)
    
    let startAngle = -Math.PI / 2
    
    data.forEach((item, i) => {
      const sliceAngle = (item.percent / 100) * 2 * Math.PI
      const endAngle = startAngle + sliceAngle
      
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
      ctx.fill()
      
      startAngle = endAngle
    })
    
    ctx.beginPath()
    ctx.arc(cx, cy, innerRadius - 2, 0, 2 * Math.PI)
    ctx.fillStyle = '#0f0f0f'
    ctx.fill()
  }, [data])
  
  return <canvas ref={canvasRef} />
}

function PortfolioValueChart({ snapshots }) {
  const canvasRef = useRef(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !snapshots || snapshots.length < 2) return
    
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const width = canvas.parentElement.offsetWidth || 300
    const height = 120
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
    
    const values = snapshots.map(s => parseFloat(s.totalValueUsd) || 0)
    const min = Math.min(...values) * 0.95
    const max = Math.max(...values) * 1.05
    const range = max - min || 1
    
    const points = values.map((val, i) => ({
      x: (i / (values.length - 1)) * width,
      y: height - ((val - min) / range) * (height - 20) - 10
    }))
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)')
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)')
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, height)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = '#00D4FF'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [snapshots])
  
  return <canvas ref={canvasRef} style={{ width: '100%' }} />
}

export default function PortfolioTab({ userId }) {
  const [holdings, setHoldings] = useState([])
  const [summary, setSummary] = useState(null)
  const [allocation, setAllocation] = useState([])
  const [wallets, setWallets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [newWallet, setNewWallet] = useState({ address: '', chain: 'solana', nickname: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('holdings')

  useEffect(() => {
    fetchPortfolioData()
  }, [userId])

  const fetchPortfolioData = async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    try {
      const [holdingsRes, walletsRes, txRes, snapshotsRes] = await Promise.all([
        fetch(`/api/portfolio/holdings?userId=${userId}`).catch(() => null),
        fetch(`/api/portfolio/wallets?userId=${userId}`).catch(() => null),
        fetch(`/api/portfolio/transactions?userId=${userId}&limit=20`).catch(() => null),
        fetch(`/api/portfolio/snapshots?userId=${userId}&days=30`).catch(() => null)
      ])

      if (holdingsRes?.ok) {
        const data = await holdingsRes.json()
        setHoldings(data.holdings || [])
        setSummary(data.summary || null)
        setAllocation(data.allocation || [])
      }
      
      if (walletsRes?.ok) {
        const data = await walletsRes.json()
        setWallets(data.wallets || [])
      }

      if (txRes?.ok) {
        const data = await txRes.json()
        setTransactions(data.transactions || [])
      }

      if (snapshotsRes?.ok) {
        const data = await snapshotsRes.json()
        setSnapshots(data.snapshots || [])
      }
    } catch (err) {
      console.error('Portfolio fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWallet = async () => {
    if (!newWallet.address || !userId) return
    
    try {
      const res = await fetch('/api/portfolio/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          address: newWallet.address,
          chain: newWallet.chain,
          nickname: newWallet.nickname || `${newWallet.chain} Wallet`
        })
      })
      
      if (res.ok) {
        setShowAddWallet(false)
        setNewWallet({ address: '', chain: 'solana', nickname: '' })
        fetchPortfolioData()
      }
    } catch (err) {
      console.error('Add wallet error:', err)
    }
  }

  const handleExportTax = async () => {
    if (!userId) return
    window.open(`/api/portfolio/tax-export?userId=${userId}&format=csv`, '_blank')
  }

  const filteredHoldings = holdings.filter(h => 
    h.tokenSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.tokenName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatNumber = (num, decimals = 2) => {
    const n = parseFloat(num) || 0
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
    if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`
    return `$${n.toFixed(decimals)}`
  }

  if (loading) {
    return (
      <div className="portfolio-tab">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" />
          <p style={{ color: '#888', marginTop: 16 }}>Loading portfolio...</p>
        </div>
      </div>
    )
  }

  const hasData = wallets.length > 0 || holdings.length > 0

  return (
    <div className="portfolio-tab">
      <div className="portfolio-header">
        <div className="portfolio-value-card">
          <div className="portfolio-value-label">Total Portfolio Value</div>
          <div className="portfolio-value-amount">
            {summary ? formatNumber(summary.totalValue) : '$0.00'}
          </div>
          <div className="portfolio-pnl">
            <span className={`portfolio-pnl-value ${parseFloat(summary?.totalPnl || 0) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(summary?.totalPnl || 0) >= 0 ? '+' : ''}{formatNumber(summary?.totalPnl || 0)}
            </span>
            <span style={{ color: '#888' }}>
              ({parseFloat(summary?.pnlPercent || 0) >= 0 ? '+' : ''}{summary?.pnlPercent || '0.00'}%)
            </span>
            <span style={{ color: '#666', fontSize: 12 }}>All Time</span>
          </div>
          {snapshots.length > 1 && (
            <div style={{ marginTop: 16 }}>
              <PortfolioValueChart snapshots={snapshots} />
            </div>
          )}
        </div>
        
        <div className="portfolio-actions">
          <button className="btn btn-primary" onClick={() => setShowAddWallet(true)}>
            + Add Wallet
          </button>
          <button className="btn btn-secondary" onClick={fetchPortfolioData}>
            ↻ Sync
          </button>
          {holdings.length > 0 && (
            <button className="btn btn-secondary" onClick={handleExportTax}>
              📊 Export Tax Report
            </button>
          )}
        </div>
      </div>

      <div className="portfolio-stats-grid">
        <div className="portfolio-stat-card">
          <div className="portfolio-stat-icon">💰</div>
          <div className="portfolio-stat-label">Assets</div>
          <div className="portfolio-stat-value">{summary?.holdingsCount || holdings.length || 0}</div>
        </div>
        <div className="portfolio-stat-card">
          <div className="portfolio-stat-icon">🔗</div>
          <div className="portfolio-stat-label">Wallets</div>
          <div className="portfolio-stat-value">{wallets.length}</div>
        </div>
        <div className="portfolio-stat-card">
          <div className="portfolio-stat-icon">📈</div>
          <div className="portfolio-stat-label">Best Performer</div>
          <div className="portfolio-stat-value" style={{ color: '#39FF14', fontSize: 16 }}>
            {holdings[0]?.tokenSymbol || '-'}
          </div>
        </div>
        <div className="portfolio-stat-card">
          <div className="portfolio-stat-icon">💵</div>
          <div className="portfolio-stat-label">Cost Basis</div>
          <div className="portfolio-stat-value">{formatNumber(summary?.totalCostBasis || 0)}</div>
        </div>
      </div>

      {!hasData ? (
        <div className="holdings-section">
          <div className="empty-portfolio">
            <div className="empty-portfolio-icon">📈</div>
            <div className="empty-portfolio-title">Track Your Crypto Portfolio</div>
            <div className="empty-portfolio-text">
              Add your wallet addresses to see all your holdings, track P&L, and analyze your portfolio allocation.
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddWallet(true)}>
              + Add Your First Wallet
            </button>
          </div>
        </div>
      ) : (
        <div className="portfolio-content">
          <div>
            <div className="holdings-section">
              <div className="holdings-header">
                <div style={{ display: 'flex', gap: 16 }}>
                  <button 
                    className={`btn ${activeTab === 'holdings' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('holdings')}
                    style={{ padding: '6px 16px', fontSize: 13 }}
                  >
                    Holdings
                  </button>
                  <button 
                    className={`btn ${activeTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('transactions')}
                    style={{ padding: '6px 16px', fontSize: 13 }}
                  >
                    Transactions
                  </button>
                </div>
                {activeTab === 'holdings' && (
                  <input 
                    type="text"
                    className="holdings-search"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                )}
              </div>

              {activeTab === 'holdings' ? (
                <table className="holdings-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Balance</th>
                      <th>Price</th>
                      <th>24h</th>
                      <th>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHoldings.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                          No holdings found. Sync your wallets to import.
                        </td>
                      </tr>
                    ) : (
                      filteredHoldings.map((h, i) => (
                        <tr key={h.id || i}>
                          <td>
                            <div className="holding-asset">
                              <div className="holding-icon">
                                {h.tokenSymbol?.charAt(0) || '?'}
                              </div>
                              <div>
                                <div className="holding-name">{h.tokenSymbol}</div>
                                <div className="holding-chain">{h.chain}</div>
                              </div>
                            </div>
                          </td>
                          <td className="holding-balance">
                            <div className="holding-amount">
                              {parseFloat(h.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </div>
                            <div className="holding-usd">{formatNumber(h.balanceUsd)}</div>
                          </td>
                          <td className="holding-price">
                            ${parseFloat(h.price || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </td>
                          <td className={`holding-change ${parseFloat(h.priceChange24h || 0) >= 0 ? 'positive' : 'negative'}`}>
                            {parseFloat(h.priceChange24h || 0) >= 0 ? '+' : ''}{parseFloat(h.priceChange24h || 0).toFixed(2)}%
                          </td>
                          <td className="holding-pnl">
                            <div className={`holding-pnl-value ${parseFloat(h.unrealizedPnlUsd || 0) >= 0 ? 'positive' : 'negative'}`}>
                              {parseFloat(h.unrealizedPnlUsd || 0) >= 0 ? '+' : ''}{formatNumber(h.unrealizedPnlUsd || 0)}
                            </div>
                            <div className="holding-pnl-percent">
                              {parseFloat(h.unrealizedPnlPercent || 0) >= 0 ? '+' : ''}{parseFloat(h.unrealizedPnlPercent || 0).toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div>
                  {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                      No transactions found.
                    </div>
                  ) : (
                    transactions.map((tx, i) => (
                      <div className="tx-row" key={tx.id || i}>
                        <div className={`tx-type ${tx.txType?.toLowerCase()}`}>
                          {tx.txType}
                        </div>
                        <div className="tx-details">
                          <div className="tx-asset">{tx.tokenOut || tx.tokenIn}</div>
                          <div className="tx-date">
                            {new Date(tx.txTimestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="tx-value">{formatNumber(tx.valueUsd)}</div>
                        <div className={`tx-pnl ${parseFloat(tx.realizedPnlUsd || 0) >= 0 ? 'positive' : 'negative'}`}>
                          {tx.realizedPnlUsd ? (
                            <>
                              {parseFloat(tx.realizedPnlUsd) >= 0 ? '+' : ''}{formatNumber(tx.realizedPnlUsd)}
                            </>
                          ) : '-'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {wallets.length > 0 && (
              <div className="wallets-list">
                <div className="wallets-title">Connected Wallets</div>
                {wallets.map((w, i) => (
                  <div className="wallet-item" key={w.id || i}>
                    <div className="wallet-icon">
                      {CHAIN_OPTIONS.find(c => c.id === w.chain)?.icon || '🔗'}
                    </div>
                    <div className="wallet-info">
                      <div className="wallet-name">{w.nickname || w.chain}</div>
                      <div className="wallet-address">
                        {w.address?.slice(0, 8)}...{w.address?.slice(-6)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="allocation-section">
            <div className="allocation-title">Allocation</div>
            <div className="allocation-chart">
              {allocation.length > 0 ? (
                <AllocationPieChart data={allocation} />
              ) : (
                <div style={{ color: '#888', fontSize: 14 }}>No allocation data</div>
              )}
            </div>
            <div className="allocation-legend">
              {allocation.slice(0, 8).map((item, i) => (
                <div className="allocation-item" key={i}>
                  <div 
                    className="allocation-color" 
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} 
                  />
                  <div className="allocation-label">{item.symbol}</div>
                  <div className="allocation-percent">{item.percent.toFixed(1)}%</div>
                </div>
              ))}
              {allocation.length > 8 && (
                <div className="allocation-item">
                  <div className="allocation-color" style={{ background: '#666' }} />
                  <div className="allocation-label">Others</div>
                  <div className="allocation-percent">
                    {allocation.slice(8).reduce((sum, a) => sum + a.percent, 0).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddWallet && (
        <div className="add-wallet-modal" onClick={() => setShowAddWallet(false)}>
          <div className="add-wallet-content" onClick={e => e.stopPropagation()}>
            <div className="add-wallet-title">Add Wallet</div>
            
            <div className="add-wallet-field">
              <label className="add-wallet-label">Blockchain</label>
              <select 
                className="add-wallet-select"
                value={newWallet.chain}
                onChange={e => setNewWallet({ ...newWallet, chain: e.target.value })}
              >
                {CHAIN_OPTIONS.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="add-wallet-field">
              <label className="add-wallet-label">Wallet Address</label>
              <input 
                className="add-wallet-input"
                placeholder="Enter wallet address..."
                value={newWallet.address}
                onChange={e => setNewWallet({ ...newWallet, address: e.target.value })}
              />
            </div>
            
            <div className="add-wallet-field">
              <label className="add-wallet-label">Nickname (Optional)</label>
              <input 
                className="add-wallet-input"
                placeholder="e.g., Main Trading Wallet"
                value={newWallet.nickname}
                onChange={e => setNewWallet({ ...newWallet, nickname: e.target.value })}
              />
            </div>
            
            <div className="add-wallet-buttons">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddWallet(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddWallet}>
                Add Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
