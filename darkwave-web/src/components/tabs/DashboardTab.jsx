import { useState, useEffect } from 'react'
import { useFavorites } from '../../context/FavoritesContext'
import { useAvatar } from '../../context/AvatarContext'
import BitcoinChart from '../charts/BitcoinChart'
import CoinAnalysisModal from '../modals/CoinAnalysisModal'
import { GaugeCard } from '../ui'

function WelcomeCard({ hallmarkId, avatarSvg }) {
  return (
    <div className="dashboard-welcome-card">
      <div className="welcome-avatar">
        {avatarSvg ? (
          <div 
            className="avatar-preview-small"
            dangerouslySetInnerHTML={{ __html: avatarSvg }}
            style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden' }}
          />
        ) : (
          <div className="avatar-placeholder" style={{ width: 60, height: 60, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 24 }}>👤</span>
          </div>
        )}
      </div>
      <div className="welcome-text">
        <h2 style={{ margin: 0, fontSize: 18 }}>Welcome back!</h2>
        {hallmarkId && (
          <div className="hallmark-badge" style={{ fontSize: 12, color: '#00D4FF', marginTop: 4 }}>
            {hallmarkId}
          </div>
        )}
      </div>
    </div>
  )
}

function CoinTableWidget({ coins, favorites, onCoinClick, activeView, setActiveView, timeframe, setTimeframe, loading }) {
  const getDisplayCoins = () => {
    if (!coins || coins.length === 0) return []
    
    switch (activeView) {
      case 'favorites':
        return favorites || []
      case 'gainers':
        return [...coins]
          .sort((a, b) => (timeframe === '1h' 
            ? (b.price_change_percentage_1h_in_currency || 0) - (a.price_change_percentage_1h_in_currency || 0)
            : (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)))
          .slice(0, 10)
      case 'losers':
        return [...coins]
          .sort((a, b) => (timeframe === '1h'
            ? (a.price_change_percentage_1h_in_currency || 0) - (b.price_change_percentage_1h_in_currency || 0)
            : (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)))
          .slice(0, 10)
      default:
        return coins.slice(0, 10)
    }
  }

  const displayCoins = getDisplayCoins()
  const isFavorite = (symbol) => favorites?.some(f => f.symbol?.toUpperCase() === symbol?.toUpperCase())

  const formatPrice = (price) => {
    if (!price) return '$0.00'
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatChange = (change) => {
    if (change === null || change === undefined) return '-'
    const formatted = change.toFixed(2)
    const color = change >= 0 ? '#39FF14' : '#ff4444'
    const arrow = change >= 0 ? '▲' : '▼'
    return <span style={{ color }}>{arrow} {Math.abs(change).toFixed(2)}%</span>
  }

  const formatMarketCap = (cap) => {
    if (!cap) return '-'
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`
    return `$${cap.toLocaleString()}`
  }

  return (
    <div className="section-box mb-md">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['top10', 'favorites', 'gainers', 'losers'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                background: activeView === view ? '#00D4FF' : '#1a1a1a',
                color: activeView === view ? '#000' : '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: activeView === view ? 600 : 400,
              }}
            >
              {view === 'top10' ? 'Top 10' : view === 'favorites' ? '⭐ Favorites' : view === 'gainers' ? '📈 Gainers' : '📉 Losers'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['1h', '24h'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '6px 10px',
                fontSize: 11,
                background: timeframe === tf ? '#333' : '#1a1a1a',
                color: timeframe === tf ? '#00D4FF' : '#888',
                border: timeframe === tf ? '1px solid #00D4FF' : '1px solid #333',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="section-content" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Loading coins...</div>
        ) : displayCoins.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
            {activeView === 'favorites' ? 'No favorites yet. Go to Markets to add some!' : 'No coins found'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#888', fontWeight: 500 }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Coin</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#888', fontWeight: 500 }}>Price</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#888', fontWeight: 500 }}>{timeframe.toUpperCase()}</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#888', fontWeight: 500 }}>Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {displayCoins.map((coin, index) => {
                const change = timeframe === '1h' 
                  ? (coin.price_change_percentage_1h_in_currency || coin.priceChange1h)
                  : (coin.price_change_percentage_24h || coin.priceChange24h)
                return (
                  <tr 
                    key={coin.id || coin.symbol} 
                    onClick={() => onCoinClick(coin)}
                    style={{ 
                      borderBottom: '1px solid #222', 
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px', color: '#666' }}>{index + 1}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {coin.image && (
                          <img 
                            src={coin.image} 
                            alt={coin.symbol} 
                            style={{ width: 24, height: 24, borderRadius: '50%' }}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {coin.symbol?.toUpperCase()}
                            {isFavorite(coin.symbol) && <span style={{ color: '#FFD700', fontSize: 12 }}>★</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#888' }}>{coin.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>
                      {formatPrice(coin.current_price || coin.price)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {formatChange(change)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#888' }}>
                      {formatMarketCap(coin.market_cap || coin.marketCap)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function QuickStatsWidget({ marketData }) {
  return (
    <div className="gauge-row" style={{ marginBottom: 16 }}>
      <GaugeCard 
        title="FEAR & GREED" 
        value={marketData.fearGreed}
        type="fearGreed"
      />
      <GaugeCard 
        title="ALTCOIN SEASON" 
        value={marketData.altcoinSeason}
        type="altcoinSeason"
      />
    </div>
  )
}

function MainChartWidget({ defaultChart, userConfig }) {
  return (
    <div className="section-box mb-md">
      <div className="section-header">
        <h3 className="section-title">📈 {defaultChart?.toUpperCase() || 'BTC'} Chart</h3>
      </div>
      <div className="section-content">
        <BitcoinChart />
      </div>
    </div>
  )
}

export default function DashboardTab({ userId, userConfig }) {
  const { favorites, loading: favoritesLoading } = useFavorites()
  const { avatarSvg } = useAvatar()
  const [selectedCoin, setSelectedCoin] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hallmarkId, setHallmarkId] = useState(userConfig?.hallmarkId || null)
  const [coins, setCoins] = useState([])
  const [coinsLoading, setCoinsLoading] = useState(true)
  const [activeView, setActiveView] = useState('top10')
  const [timeframe, setTimeframe] = useState('24h')
  const [marketData, setMarketData] = useState({
    fearGreed: 65,
    altcoinSeason: 75,
  })

  useEffect(() => {
    if (userConfig?.hallmarkId) {
      setHallmarkId(userConfig.hallmarkId)
    } else if (userId && !hallmarkId) {
      fetch(`/api/users/${userId}/hallmark`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.hallmarkId) {
            setHallmarkId(data.hallmarkId)
          }
        })
        .catch(err => console.log('Failed to generate hallmark'))
    }
  }, [userId, userConfig, hallmarkId])

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/crypto/market-overview')
        if (response.ok) {
          const data = await response.json()
          setMarketData(prev => ({ ...prev, ...data }))
        }
      } catch (err) {
        console.log('Using default market data')
      }
    }
    fetchMarketData()
  }, [])

  useEffect(() => {
    const fetchCoins = async () => {
      setCoinsLoading(true)
      try {
        const response = await fetch('/api/market-overview?category=top')
        if (response.ok) {
          const data = await response.json()
          setCoins(data.coins || data || [])
        }
      } catch (err) {
        console.log('Failed to fetch coins')
      } finally {
        setCoinsLoading(false)
      }
    }
    fetchCoins()
  }, [])

  const handleCoinClick = (coin) => {
    setSelectedCoin(coin)
    setIsModalOpen(true)
  }

  return (
    <div className="dashboard-tab">
      <WelcomeCard hallmarkId={hallmarkId} avatarSvg={avatarSvg} />
      
      <QuickStatsWidget marketData={marketData} />
      
      <CoinTableWidget 
        coins={coins}
        favorites={favorites}
        onCoinClick={handleCoinClick}
        activeView={activeView}
        setActiveView={setActiveView}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        loading={coinsLoading}
      />
      
      <MainChartWidget 
        defaultChart={userConfig?.defaultChart || 'bitcoin'} 
        userConfig={userConfig}
      />
      
      <CoinAnalysisModal 
        coin={selectedCoin}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedCoin(null)
        }}
      />
    </div>
  )
}
