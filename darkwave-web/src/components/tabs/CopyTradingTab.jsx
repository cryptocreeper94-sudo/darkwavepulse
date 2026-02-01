import { useState, useEffect, useRef } from 'react'
import './CopyTradingTab.css'

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : ''

export default function CopyTradingTab({ userId }) {
  const [activeView, setActiveView] = useState('discover')
  const [traders, setTraders] = useState([])
  const [myCopies, setMyCopies] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState({})
  const carouselRef = useRef(null)

  useEffect(() => {
    fetchData()
  }, [userId, activeView])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeView === 'discover') {
        const res = await fetch(`${API_BASE}/api/copy-trading/available-traders`)
        const data = await res.json()
        setTraders(data.traders || [])
      } else if (activeView === 'my-copies') {
        const res = await fetch(`${API_BASE}/api/copy-trading/my-copies/${userId}`)
        const data = await res.json()
        setMyCopies(data.copies || [])
      } else if (activeView === 'history') {
        const res = await fetch(`${API_BASE}/api/copy-trading/history/${userId}`)
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (traderId) => {
    try {
      await fetch(`${API_BASE}/api/copy-trading/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          traderId,
          settings: { allocationPercent: 10, maxTradeSize: 100 }
        })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to follow:', error)
    }
  }

  const handleUnfollow = async (traderId) => {
    try {
      await fetch(`${API_BASE}/api/copy-trading/unfollow/${userId}/${traderId}`, {
        method: 'DELETE'
      })
      fetchData()
    } catch (error) {
      console.error('Failed to unfollow:', error)
    }
  }

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const toggleSettings = (id) => {
    setSettingsOpen(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const renderTraderCard = (trader, index, isFeatured = false) => (
    <div key={trader.user_id || index} className={`trader-card ${isFeatured ? 'featured' : ''}`}>
      <div className="trader-profile">
        <div className="trader-avatar">
          {trader.avatar_url ? (
            <img src={trader.avatar_url} alt={trader.display_name} />
          ) : '👤'}
        </div>
        <div className="trader-info">
          <div className="trader-name">{trader.display_name || `Trader ${index + 1}`}</div>
          {trader.copier_count > 5 && (
            <span className="trader-badge">⭐ Top Trader</span>
          )}
        </div>
      </div>
      
      <div className="trader-stats">
        <div className="stat-box">
          <div className="label">Total P&L</div>
          <div className={`value ${(trader.total_pnl || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(trader.total_pnl || 0) >= 0 ? '+' : ''}${Math.abs(trader.total_pnl || 0).toLocaleString()}
          </div>
        </div>
        <div className="stat-box">
          <div className="label">Win Rate</div>
          <div className="value">{trader.win_rate || 0}%</div>
        </div>
        <div className="stat-box">
          <div className="label">Trades</div>
          <div className="value">{trader.total_trades || 0}</div>
        </div>
        <div className="stat-box">
          <div className="label">Copiers</div>
          <div className="value">{trader.copier_count || 0}</div>
        </div>
      </div>
      
      <button className="follow-btn" onClick={() => handleFollow(trader.user_id)}>
        Start Copying
      </button>
    </div>
  )

  return (
    <div className="copy-trading-tab">
      <div className="copy-header">
        <h1>Copy Trading</h1>
        <p>Automatically mirror trades from top performers</p>
      </div>

      <div className="copy-nav">
        <button 
          className={activeView === 'discover' ? 'active' : ''} 
          onClick={() => setActiveView('discover')}
        >
          Discover Traders
        </button>
        <button 
          className={activeView === 'my-copies' ? 'active' : ''} 
          onClick={() => setActiveView('my-copies')}
        >
          My Copies
        </button>
        <button 
          className={activeView === 'history' ? 'active' : ''} 
          onClick={() => setActiveView('history')}
        >
          Trade History
        </button>
      </div>

      {loading ? (
        <div className="copy-loading">Loading...</div>
      ) : activeView === 'discover' ? (
        <>
          {/* Featured Carousel */}
          <div className="traders-carousel-wrapper">
            <h3 className="section-title">Featured Traders</h3>
            <button className="carousel-nav prev" onClick={() => scrollCarousel('left')}>‹</button>
            <div className="traders-carousel" ref={carouselRef}>
              {traders.slice(0, 10).map((trader, i) => renderTraderCard(trader, i, i === 0))}
            </div>
            <button className="carousel-nav next" onClick={() => scrollCarousel('right')}>›</button>
          </div>

          {/* Bento Grid */}
          <h3 className="section-title">All Traders</h3>
          <div className="traders-bento-grid">
            {traders.map((trader, i) => renderTraderCard(trader, i, i === 0))}
          </div>

          {traders.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No traders available yet</h3>
              <p>Check back soon for top performers to copy</p>
            </div>
          )}
        </>
      ) : activeView === 'my-copies' ? (
        <div className="my-copies-grid">
          {myCopies.length > 0 ? myCopies.map((copy, i) => (
            <div key={copy.trader_id || i} className="copy-card">
              <div className="copy-card-header">
                <div className="trader-profile">
                  <div className="trader-avatar">👤</div>
                  <div className="trader-info">
                    <div className="trader-name">{copy.display_name || 'Unknown Trader'}</div>
                    <span className={`copy-status ${copy.enabled ? 'active' : 'paused'}`}>
                      {copy.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="trader-stats">
                <div className="stat-box">
                  <div className="label">Trader P&L</div>
                  <div className={`value ${(copy.trader_pnl || 0) >= 0 ? 'positive' : 'negative'}`}>
                    ${copy.trader_pnl?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="label">Win Rate</div>
                  <div className="value">{copy.trader_win_rate || 0}%</div>
                </div>
                <div className="stat-box">
                  <div className="label">Allocation</div>
                  <div className="value">{copy.allocation_percent || 10}%</div>
                </div>
                <div className="stat-box">
                  <div className="label">Max Trade</div>
                  <div className="value">${copy.max_trade_size || 100}</div>
                </div>
              </div>

              {/* Accordion Settings */}
              <div className="copy-settings">
                <div className="settings-accordion">
                  <div 
                    className={`settings-header ${settingsOpen[copy.trader_id] ? 'open' : ''}`}
                    onClick={() => toggleSettings(copy.trader_id)}
                  >
                    <h4>Copy Settings</h4>
                    <span className="settings-toggle">▼</span>
                  </div>
                  <div className={`settings-content ${settingsOpen[copy.trader_id] ? 'open' : ''}`}>
                    <div className="settings-grid">
                      <div className="setting-control">
                        <label>Allocation %</label>
                        <input type="number" defaultValue={copy.allocation_percent || 10} min="1" max="100" />
                      </div>
                      <div className="setting-control">
                        <label>Max Trade Size</label>
                        <input type="number" defaultValue={copy.max_trade_size || 100} min="10" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                className="follow-btn unfollow-btn" 
                onClick={() => handleUnfollow(copy.trader_id)}
              >
                Stop Copying
              </button>
            </div>
          )) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No active copy trades</h3>
              <p>Start copying traders to see them here</p>
            </div>
          )}
        </div>
      ) : (
        <div className="history-table-wrapper">
          {history.length > 0 ? (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Trader</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {history.map((trade, i) => (
                  <tr key={i}>
                    <td>{new Date(trade.executed_at).toLocaleDateString()}</td>
                    <td>{trade.trader_name || 'Unknown'}</td>
                    <td><strong>{trade.symbol}</strong></td>
                    <td>{trade.type}</td>
                    <td>${trade.amount?.toLocaleString()}</td>
                    <td className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <h3>No trade history yet</h3>
              <p>Copied trades will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
