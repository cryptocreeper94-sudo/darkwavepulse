import { useState, useEffect, useRef } from 'react'
import './ArbitrageTab.css'

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : ''

export default function ArbitrageTab({ userId }) {
  const [opportunities, setOpportunities] = useState([])
  const [dexOpportunities, setDexOpportunities] = useState([])
  const [triangular, setTriangular] = useState([])
  const [loading, setLoading] = useState(true)
  const [minSpread, setMinSpread] = useState(0.5)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [cexOpen, setCexOpen] = useState(true)
  const [dexOpen, setDexOpen] = useState(false)
  const [triOpen, setTriOpen] = useState(false)
  const carouselRef = useRef(null)

  useEffect(() => {
    fetchAllOpportunities()
    const interval = setInterval(fetchAllOpportunities, 30000)
    return () => clearInterval(interval)
  }, [minSpread])

  const fetchAllOpportunities = async () => {
    try {
      setLoading(true)
      const [cexRes, dexRes, triRes] = await Promise.all([
        fetch(`${API_BASE}/api/arbitrage/opportunities?minSpread=${minSpread}`),
        fetch(`${API_BASE}/api/arbitrage/dex-opportunities`),
        fetch(`${API_BASE}/api/arbitrage/triangular`)
      ])
      
      const cexData = await cexRes.json()
      const dexData = await dexRes.json()
      const triData = await triRes.json()
      
      setOpportunities(cexData.opportunities || [])
      setDexOpportunities(dexData.opportunities || [])
      setTriangular(triData.opportunities || [])
      setLastUpdated(cexData.lastUpdated || new Date().toISOString())
    } catch (error) {
      console.error('Failed to fetch opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const totalOpportunities = opportunities.length + dexOpportunities.length + triangular.length
  const bestSpread = opportunities.length > 0 ? Math.max(...opportunities.map(o => parseFloat(o.spreadPercent))) : 0

  return (
    <div className="arbitrage-tab">
      <div className="arbitrage-header">
        <div className="header-text">
          <h1>Arbitrage Scanner</h1>
          <p>Find price differences across exchanges in real-time</p>
        </div>
        <div className="header-controls">
          <div className="min-spread-control">
            <label>Min Spread</label>
            <input 
              type="number" 
              value={minSpread} 
              onChange={(e) => setMinSpread(parseFloat(e.target.value) || 0)}
              step="0.1"
              min="0"
            />
            <span>%</span>
          </div>
          <button 
            className={`refresh-btn ${loading ? 'loading' : ''}`} 
            onClick={fetchAllOpportunities}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            {loading ? 'Scanning...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="arbitrage-bento-grid">
        <div className="stat-card">
          <h3>Total Opportunities</h3>
          <div className="value">{totalOpportunities}</div>
          <div className="subtext">across all markets</div>
        </div>
        <div className="stat-card">
          <h3>Best Spread</h3>
          <div className="value">{bestSpread.toFixed(2)}%</div>
          <div className="subtext">highest profit potential</div>
        </div>
        <div className="stat-card large">
          <h3>CEX Opportunities</h3>
          <div className="value">{opportunities.length}</div>
          <div className="subtext">Binance, KuCoin, Coinbase</div>
        </div>
        <div className="stat-card">
          <h3>DEX Opportunities</h3>
          <div className="value">{dexOpportunities.length}</div>
          <div className="subtext">Uniswap, Raydium, etc</div>
        </div>
        <div className="stat-card">
          <h3>Last Scan</h3>
          <div className="value" style={{ fontSize: '18px' }}>
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--'}
          </div>
          <div className="subtext">auto-updates every 30s</div>
        </div>
      </div>

      {/* CEX Accordion */}
      <div className="accordion-section">
        <div 
          className={`accordion-header ${cexOpen ? 'open' : ''}`}
          onClick={() => setCexOpen(!cexOpen)}
        >
          <h2>
            <span className="icon">🏦</span>
            CEX Arbitrage
            <span className="count">{opportunities.length}</span>
          </h2>
          <div className="accordion-toggle">▼</div>
        </div>
        <div className={`accordion-content ${cexOpen ? 'open' : ''}`}>
          <div className="accordion-inner">
            {opportunities.length > 0 ? (
              <div className="opportunities-carousel-wrapper">
                <button className="carousel-nav prev" onClick={() => scrollCarousel('left')}>‹</button>
                <div className="opportunities-carousel" ref={carouselRef}>
                  {opportunities.map((opp, i) => (
                    <div 
                      key={i} 
                      className={`opportunity-card ${parseFloat(opp.spreadPercent) > 1 ? 'high-value' : ''}`}
                    >
                      <div className="opportunity-header">
                        <span className="opportunity-symbol">{opp.symbol}</span>
                        <span className={`opportunity-spread ${parseFloat(opp.spreadPercent) > 1 ? 'high' : ''}`}>
                          +{opp.spreadPercent}%
                        </span>
                      </div>
                      <div className="opportunity-flow">
                        <div className="exchange-box buy">
                          <div className="name">{opp.buyExchange}</div>
                          <div className="price">${parseFloat(opp.buyPrice).toLocaleString()}</div>
                        </div>
                        <span className="flow-arrow">→</span>
                        <div className="exchange-box sell">
                          <div className="name">{opp.sellExchange}</div>
                          <div className="price">${parseFloat(opp.sellPrice).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="opportunity-stats">
                        <div className="opp-stat">
                          <div className="label">Profit/100</div>
                          <div className="value">${opp.potentialProfit}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="carousel-nav next" onClick={() => scrollCarousel('right')}>›</button>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3>No CEX opportunities found</h3>
                <p>Try lowering the minimum spread threshold</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEX Accordion */}
      <div className="accordion-section">
        <div 
          className={`accordion-header ${dexOpen ? 'open' : ''}`}
          onClick={() => setDexOpen(!dexOpen)}
        >
          <h2>
            <span className="icon">🔄</span>
            DEX Arbitrage
            <span className="count">{dexOpportunities.length}</span>
          </h2>
          <div className="accordion-toggle">▼</div>
        </div>
        <div className={`accordion-content ${dexOpen ? 'open' : ''}`}>
          <div className="accordion-inner">
            {dexOpportunities.length > 0 ? (
              <table className="arb-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Chain</th>
                    <th>Buy DEX</th>
                    <th>Buy Price</th>
                    <th>Sell DEX</th>
                    <th>Sell Price</th>
                    <th>Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {dexOpportunities.map((opp, i) => (
                    <tr key={i}>
                      <td><strong>{opp.symbol}</strong></td>
                      <td>{opp.chain}</td>
                      <td>{opp.buyDex}</td>
                      <td>${opp.buyPrice}</td>
                      <td>{opp.sellDex}</td>
                      <td>${opp.sellPrice}</td>
                      <td style={{ color: '#00D4FF', fontWeight: 600 }}>{opp.spreadPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔗</div>
                <h3>No DEX opportunities found</h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Triangular Accordion */}
      <div className="accordion-section">
        <div 
          className={`accordion-header ${triOpen ? 'open' : ''}`}
          onClick={() => setTriOpen(!triOpen)}
        >
          <h2>
            <span className="icon">🔺</span>
            Triangular Arbitrage
            <span className="count">{triangular.length}</span>
          </h2>
          <div className="accordion-toggle">▼</div>
        </div>
        <div className={`accordion-content ${triOpen ? 'open' : ''}`}>
          <div className="accordion-inner">
            {triangular.length > 0 ? (
              <table className="arb-table">
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Exchange</th>
                    <th>Est. Profit</th>
                    <th>Capital Req.</th>
                    <th>Gas Est.</th>
                    <th>Complexity</th>
                  </tr>
                </thead>
                <tbody>
                  {triangular.map((opp, i) => (
                    <tr key={i}>
                      <td><strong>{opp.path}</strong></td>
                      <td>{opp.exchange}</td>
                      <td style={{ color: '#00ff88' }}>{opp.estimatedProfit}</td>
                      <td>{opp.requiredCapital}</td>
                      <td>{opp.gasEstimate}</td>
                      <td>{opp.complexity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📐</div>
                <h3>No triangular opportunities found</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
