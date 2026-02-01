import { useState, useEffect, useRef } from 'react'
import './NFTTab.css'

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : ''

export default function NFTTab({ userId }) {
  const [activeView, setActiveView] = useState('portfolio')
  const [portfolio, setPortfolio] = useState({ nfts: [], summary: {} })
  const [trending, setTrending] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncWallet, setSyncWallet] = useState({ address: '', chain: 'ethereum' })
  const [syncing, setSyncing] = useState(false)
  const [newAlert, setNewAlert] = useState({ collection: '', price: '', direction: 'below' })
  const nftCarouselRef = useRef(null)

  useEffect(() => {
    fetchData()
  }, [userId, activeView])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeView === 'portfolio') {
        const res = await fetch(`${API_BASE}/api/nft/portfolio/${userId}`)
        const data = await res.json()
        setPortfolio(data)
      } else if (activeView === 'trending') {
        const res = await fetch(`${API_BASE}/api/nft/collections/trending`)
        const data = await res.json()
        setTrending(data.collections || [])
      } else if (activeView === 'alerts') {
        const res = await fetch(`${API_BASE}/api/nft/floor-alerts/${userId}`)
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncWallet = async () => {
    if (!syncWallet.address) return
    try {
      setSyncing(true)
      await fetch(`${API_BASE}/api/nft/sync-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...syncWallet })
      })
      fetchData()
      setSyncWallet({ address: '', chain: 'ethereum' })
    } catch (error) {
      console.error('Failed to sync:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleCreateAlert = async () => {
    if (!newAlert.collection || !newAlert.price) return
    try {
      await fetch(`${API_BASE}/api/nft/floor-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          collectionSlug: newAlert.collection,
          targetPrice: parseFloat(newAlert.price),
          direction: newAlert.direction
        })
      })
      setNewAlert({ collection: '', price: '', direction: 'below' })
      fetchData()
    } catch (error) {
      console.error('Failed to create alert:', error)
    }
  }

  const scrollCarousel = (direction) => {
    if (nftCarouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      nftCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="nft-tab">
      <div className="nft-header">
        <h1>NFT Portfolio</h1>
        <p>Track your NFT holdings across chains</p>
      </div>

      <div className="nft-nav">
        <button 
          className={activeView === 'portfolio' ? 'active' : ''} 
          onClick={() => setActiveView('portfolio')}
        >
          My NFTs
        </button>
        <button 
          className={activeView === 'trending' ? 'active' : ''} 
          onClick={() => setActiveView('trending')}
        >
          Trending Collections
        </button>
        <button 
          className={activeView === 'alerts' ? 'active' : ''} 
          onClick={() => setActiveView('alerts')}
        >
          Floor Alerts
        </button>
      </div>

      {activeView === 'portfolio' && (
        <div className="sync-wallet-form">
          <input
            type="text"
            placeholder="Enter wallet address..."
            value={syncWallet.address}
            onChange={(e) => setSyncWallet({ ...syncWallet, address: e.target.value })}
          />
          <select
            value={syncWallet.chain}
            onChange={(e) => setSyncWallet({ ...syncWallet, chain: e.target.value })}
          >
            <option value="ethereum">Ethereum</option>
            <option value="solana">Solana</option>
            <option value="polygon">Polygon</option>
          </select>
          <button className="sync-btn" onClick={handleSyncWallet} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Wallet'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="nft-loading">Loading...</div>
      ) : (
        <div className="nft-content">
          {activeView === 'portfolio' && (
            <>
              {/* Bento Summary */}
              <div className="portfolio-summary-bento">
                <div className="summary-card">
                  <h3>Total NFTs</h3>
                  <div className="value">{portfolio.summary?.totalNfts || 0}</div>
                </div>
                <div className="summary-card large">
                  <h3>Estimated Value</h3>
                  <div className="value">${portfolio.summary?.totalValue?.toLocaleString() || 0}</div>
                </div>
                <div className="summary-card">
                  <h3>Collections</h3>
                  <div className="value">{portfolio.summary?.uniqueCollections || 0}</div>
                </div>
                <div className="summary-card">
                  <h3>Chains</h3>
                  <div className="value">{portfolio.summary?.chains?.length || 0}</div>
                </div>
              </div>

              {/* NFT Carousel */}
              {portfolio.nfts?.length > 0 ? (
                <div className="nft-carousel-wrapper">
                  <h3 className="section-title">Your NFTs</h3>
                  <button className="carousel-nav prev" onClick={() => scrollCarousel('left')}>‹</button>
                  <div className="nft-carousel" ref={nftCarouselRef}>
                    {portfolio.nfts.map((nft, i) => (
                      <div key={i} className="nft-card">
                        <div className="nft-image">
                          {nft.image_url ? (
                            <img src={nft.image_url} alt={nft.name} />
                          ) : '🖼️'}
                        </div>
                        <div className="nft-info">
                          <div className="nft-collection">{nft.collection_name}</div>
                          <div className="nft-name">{nft.name || 'Unnamed'}</div>
                          <div className="nft-details">
                            <span className="nft-chain">
                              {nft.chain === 'solana' ? '◎' : nft.chain === 'polygon' ? '⬡' : '⟠'} {nft.chain}
                            </span>
                            {nft.estimated_value > 0 && (
                              <span className="nft-value">${nft.estimated_value}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="carousel-nav next" onClick={() => scrollCarousel('right')}>›</button>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🖼️</div>
                  <h3>No NFTs found</h3>
                  <p>Sync a wallet above to see your NFTs</p>
                </div>
              )}
            </>
          )}

          {activeView === 'trending' && (
            <>
              <h3 className="section-title">Trending Collections</h3>
              <div className="trending-bento-grid">
                {trending.map((col, i) => (
                  <div key={i} className="collection-card">
                    <div className="collection-header">
                      <div className="collection-avatar">
                        {col.chain === 'solana' ? '◎' : col.chain === 'polygon' ? '⬡' : '⟠'}
                      </div>
                      <div className="collection-meta">
                        <div className="collection-name">{col.name}</div>
                        <span className="collection-chain-badge">{col.chain}</span>
                      </div>
                    </div>
                    <div className="collection-stats">
                      <div className="coll-stat">
                        <div className="label">Floor</div>
                        <div className="value">{col.floor} {col.chain === 'solana' ? 'SOL' : 'ETH'}</div>
                      </div>
                      <div className="coll-stat">
                        <div className="label">24h Vol</div>
                        <div className="value">{col.volume24h}</div>
                      </div>
                      <div className="coll-stat">
                        <div className="label">24h Change</div>
                        <div className={`value ${col.change24h >= 0 ? 'positive' : 'negative'}`}>
                          {col.change24h >= 0 ? '+' : ''}{col.change24h}%
                        </div>
                      </div>
                      {i === 0 && (
                        <div className="coll-stat">
                          <div className="label">Rank</div>
                          <div className="value">#1</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeView === 'alerts' && (
            <div className="alerts-section">
              <h3 className="section-title">Floor Price Alerts</h3>
              
              <div className="alert-form">
                <input
                  type="text"
                  placeholder="Collection slug (e.g., boredapeyachtclub)"
                  value={newAlert.collection}
                  onChange={(e) => setNewAlert({ ...newAlert, collection: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Target price"
                  value={newAlert.price}
                  onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
                  step="0.01"
                />
                <select
                  value={newAlert.direction}
                  onChange={(e) => setNewAlert({ ...newAlert, direction: e.target.value })}
                >
                  <option value="below">Below</option>
                  <option value="above">Above</option>
                </select>
                <button onClick={handleCreateAlert}>Create Alert</button>
              </div>

              {alerts.length > 0 ? (
                <div className="alerts-list">
                  {alerts.map((alert, i) => (
                    <div key={i} className="alert-item">
                      <div className="alert-details">
                        <h4>{alert.collection_slug}</h4>
                        <p>Alert when floor goes {alert.direction} {alert.target_price} ETH</p>
                      </div>
                      <button className="alert-delete">×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🔔</div>
                  <h3>No floor alerts set</h3>
                  <p>Create an alert above to get notified when prices hit your targets</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
