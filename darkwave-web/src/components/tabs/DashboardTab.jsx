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

function FeatureCard({ title, subtitle, tag, image, onClick, size = 'medium' }) {
  const sizeStyles = {
    large: { gridColumn: 'span 2', minHeight: 200 },
    medium: { gridColumn: 'span 1', minHeight: 160 },
    small: { gridColumn: 'span 1', minHeight: 120 }
  }

  return (
    <div 
      className="feature-card"
      onClick={onClick}
      style={{
        ...sizeStyles[size],
        background: `linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%), url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 16,
        padding: 20,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 212, 255, 0.2)'
        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'
      }}
    >
      {tag && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: '#00D4FF',
          color: '#000',
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {tag}
        </div>
      )}
      <div>
        <h3 style={{ 
          margin: 0, 
          fontSize: size === 'large' ? 22 : 16, 
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 2px 10px rgba(0,0,0,0.8)'
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ 
            margin: '6px 0 0', 
            fontSize: 13, 
            color: 'rgba(255,255,255,0.7)',
            textShadow: '0 1px 5px rgba(0,0,0,0.8)'
          }}>
            {subtitle}
          </p>
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

  const buttonIcons = {
    top10: '/assets/dashboard/trading_dashboard_neon_glow.png',
    favorites: '/assets/dashboard/neon_star_favorites_icon.png',
    gainers: '/assets/dashboard/green_neon_gainers_arrow.png',
    losers: '/assets/dashboard/red_neon_losers_arrow.png'
  }

  return (
    <div className="section-box mb-md" style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 12 }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['top10', 'favorites', 'gainers', 'losers'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                background: activeView === view ? 'linear-gradient(135deg, #00D4FF 0%, #0099cc 100%)' : '#1a1a1a',
                color: activeView === view ? '#000' : '#fff',
                border: activeView === view ? 'none' : '1px solid #333',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: activeView === view ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
                boxShadow: activeView === view ? '0 0 15px rgba(0, 212, 255, 0.3)' : 'none',
              }}
            >
              <img 
                src={buttonIcons[view]} 
                alt="" 
                style={{ width: 16, height: 16, borderRadius: 3 }}
                onError={(e) => e.target.style.display = 'none'}
              />
              {view === 'top10' ? 'Top 10' : view === 'favorites' ? 'Favorites' : view === 'gainers' ? 'Gainers' : 'Losers'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['1h', '24h'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '6px 12px',
                fontSize: 11,
                background: timeframe === tf ? '#1a1a1a' : 'transparent',
                color: timeframe === tf ? '#00D4FF' : '#666',
                border: timeframe === tf ? '1px solid #00D4FF' : '1px solid #333',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="section-content" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#888' }}>
            <div style={{ 
              width: 30, 
              height: 30, 
              border: '3px solid #333', 
              borderTop: '3px solid #00D4FF', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px'
            }}></div>
            Loading coins...
          </div>
        ) : displayCoins.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#888' }}>
            {activeView === 'favorites' ? 'No favorites yet. Go to Markets to add some!' : 'No coins found'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Coin</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#666', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#666', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{timeframe.toUpperCase()}</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#666', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Market Cap</th>
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
                      borderBottom: '1px solid #1a1a1a', 
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', color: '#555', fontWeight: 600 }}>{index + 1}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {coin.image && (
                          <img 
                            src={coin.image} 
                            alt={coin.symbol} 
                            style={{ width: 28, height: 28, borderRadius: '50%' }}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {coin.symbol?.toUpperCase()}
                            {isFavorite(coin.symbol) && <span style={{ color: '#FFD700', fontSize: 14 }}>★</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#666' }}>{coin.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#fff' }}>
                      {formatPrice(coin.current_price || coin.price)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                      {formatChange(change)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#888' }}>
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
    <div className="gauge-row" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(2, 1fr)', 
      gap: 16, 
      marginBottom: 20 
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        borderRadius: 16,
        padding: 20,
        border: '1px solid #222',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ 
          color: '#FF006E', 
          fontSize: 12, 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: 1,
          marginBottom: 8,
          textAlign: 'center'
        }}>
          Fear & Greed
        </div>
        <GaugeCard 
          value={marketData.fearGreed}
          type="fearGreed"
        />
      </div>
      <div style={{
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        borderRadius: 16,
        padding: 20,
        border: '1px solid #222',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ 
          color: '#00D4FF', 
          fontSize: 12, 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: 1,
          marginBottom: 8,
          textAlign: 'center'
        }}>
          Altcoin Season
        </div>
        <GaugeCard 
          value={marketData.altcoinSeason}
          type="altcoinSeason"
        />
      </div>
    </div>
  )
}

function PromoBanner({ onNavigate }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(157, 78, 221, 0.1) 100%)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: 16,
      padding: 24,
      marginBottom: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}></div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'inline-block',
          background: '#39FF14',
          color: '#000',
          padding: '4px 12px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 12,
        }}>
          Coming Soon
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#fff' }}>
          AI Sniper Bot
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 400 }}>
          Set your parameters, let AI find opportunities. Smart limit orders with predictive intelligence.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('trading')}
          style={{
            background: 'linear-gradient(135deg, #00D4FF 0%, #0099cc 100%)',
            color: '#000',
            border: 'none',
            padding: '10px 24px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
          }}
        >
          Learn More
        </button>
      </div>
    </div>
  )
}

function MainChartWidget() {
  return (
    <div className="section-box mb-md" style={{ 
      background: '#0f0f0f', 
      border: '1px solid #222', 
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      <div className="section-header" style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <img 
          src="/assets/dashboard/trading_dashboard_neon_glow.png" 
          alt="" 
          style={{ width: 20, height: 20, borderRadius: 4 }}
          onError={(e) => e.target.style.display = 'none'}
        />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>Bitcoin Chart</h3>
      </div>
      <div className="section-content" style={{ padding: 0 }}>
        <BitcoinChart />
      </div>
    </div>
  )
}

export default function DashboardTab({ userId, userConfig, onNavigate }) {
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
    <div className="dashboard-tab" style={{ padding: '0 16px' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <WelcomeCard hallmarkId={hallmarkId} avatarSvg={avatarSvg} />
      
      <PromoBanner onNavigate={onNavigate} />
      
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
      
      <MainChartWidget />
      
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
