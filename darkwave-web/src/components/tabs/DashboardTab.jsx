import { useState, useEffect, useRef } from 'react'
import { useFavorites } from '../../context/FavoritesContext'
import { useAvatar } from '../../context/AvatarContext'
import BitcoinChart from '../charts/BitcoinChart'
import CoinAnalysisModal from '../modals/CoinAnalysisModal'
import Gauge from '../ui/Gauge'

function formatMarketCap(value) {
  if (!value) return '—'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function MiniSparkline({ data, positive }) {
  if (!data || data.length < 2) return null
  
  const samples = data.length > 20 ? data.filter((_, i) => i % Math.floor(data.length / 20) === 0) : data
  const min = Math.min(...samples)
  const max = Math.max(...samples)
  const range = max - min || 1
  
  const width = 60
  const height = 24
  const points = samples.map((val, i) => {
    const x = (i / (samples.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  const color = positive ? '#39FF14' : '#FF4444'
  
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CarouselRow({ children, title, showArrows = false }) {
  const scrollRef = useRef(null)
  const [scrollPos, setScrollPos] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)
  const childCount = Array.isArray(children) ? children.length : 1
  const forceArrows = showArrows || childCount >= 4
  
  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setScrollPos(scrollLeft)
      setMaxScroll(scrollWidth - clientWidth)
    }
  }
  
  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', updateScrollState)
      window.addEventListener('resize', updateScrollState)
    }
    return () => {
      if (el) el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [children])
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 180
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      })
    }
  }

  const canScrollLeft = scrollPos > 5
  const canScrollRight = scrollPos < maxScroll - 5
  
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 8,
      }}>
        {title && (
          <div style={{ 
            fontSize: 10, 
            fontWeight: 700, 
            color: '#555', 
            textTransform: 'uppercase', 
            letterSpacing: 1,
          }}>
            {title}
          </div>
        )}
        {forceArrows && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: canScrollLeft ? '#1a1a1a' : '#111',
                border: '1px solid #333',
                color: canScrollLeft ? '#fff' : '#444',
                fontSize: 12,
                cursor: canScrollLeft ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ‹
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: canScrollRight ? '#1a1a1a' : '#111',
                border: '1px solid #333',
                color: canScrollRight ? '#fff' : '#444',
                fontSize: 12,
                cursor: canScrollRight ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}
        className="hide-scrollbar"
      >
        {children}
      </div>
    </div>
  )
}

function BentoCard({ children, onClick, style = {} }) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: '#0f0f0f',
        border: '1px solid #222',
        borderRadius: 12,
        padding: 12,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
        flex: '0 0 auto',
        ...style,
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.borderColor = '#00D4FF')}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222'}
    >
      {children}
    </div>
  )
}

function QuickActionCard({ icon, title, subtitle, onClick, accentColor = '#00D4FF' }) {
  return (
    <BentoCard onClick={onClick} style={{ flex: '1 0 18%', minWidth: 100, scrollSnapAlign: 'start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ 
          fontSize: 16, 
          width: 28, 
          height: 28, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: `${accentColor}15`,
          borderRadius: 6,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
        </div>
      </div>
    </BentoCard>
  )
}

function MetricCard({ title, value, change, inflow }) {
  const isPositive = change >= 0
  return (
    <BentoCard style={{ flex: '1 0 22%', minWidth: 100, scrollSnapAlign: 'start' }}>
      <div style={{ fontSize: 9, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: isPositive ? '#39FF14' : '#ff4444' }}>
          {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
        </span>
        {inflow !== undefined && (
          <span style={{ fontSize: 9, color: inflow >= 0 ? '#39FF14' : '#ff4444' }}>
            {inflow >= 0 ? '+' : ''}{formatMarketCap(inflow)}
          </span>
        )}
      </div>
    </BentoCard>
  )
}

function GaugeCard({ title, value, type, accentColor }) {
  return (
    <BentoCard style={{ flex: '1 0 22%', minWidth: 100, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ color: accentColor, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ width: '80%', maxWidth: 100 }}>
        <Gauge value={value} type={type} size={100} showLabels={false} />
      </div>
    </BentoCard>
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
    return <span style={{ color }}>{arrow} {Math.abs(change).toFixed(1)}%</span>
  }

  const tabs = [
    { id: 'top10', label: 'Top 10' },
    { id: 'favorites', label: 'Favs' },
    { id: 'gainers', label: 'Gainers' },
    { id: 'losers', label: 'Losers' }
  ]

  return (
    <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 12, marginBottom: 16 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '8px 10px', 
        borderBottom: '1px solid #222',
        overflowX: 'auto',
        gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              style={{
                padding: '5px 8px',
                fontSize: 10,
                height: 26,
                background: activeView === tab.id ? '#00D4FF' : '#1a1a1a',
                color: activeView === tab.id ? '#000' : '#888',
                border: activeView === tab.id ? '1px solid #00D4FF' : '1px solid #333',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: activeView === tab.id ? 700 : 500,
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
          {['1H', '24H'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf.toLowerCase())}
              style={{
                padding: '5px 8px',
                fontSize: 10,
                height: 26,
                background: timeframe === tf.toLowerCase() ? '#1a1a1a' : 'transparent',
                color: timeframe === tf.toLowerCase() ? '#00D4FF' : '#555',
                border: timeframe === tf.toLowerCase() ? '1px solid #00D4FF' : '1px solid #333',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              border: '2px solid #333', 
              borderTop: '2px solid #00D4FF', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 8px'
            }}></div>
            Loading...
          </div>
        ) : displayCoins.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 12 }}>
            {activeView === 'favorites' ? 'No favorites yet' : 'No coins found'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: '#555', fontWeight: 600, fontSize: 10 }}>#</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: '#555', fontWeight: 600, fontSize: 10 }}>Coin</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: '#555', fontWeight: 600, fontSize: 10 }}>Price</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: '#555', fontWeight: 600, fontSize: 10 }}>{timeframe.toUpperCase()}</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: '#555', fontWeight: 600, fontSize: 10 }}>Market Cap</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: '#555', fontWeight: 600, fontSize: 10 }}>Volume</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#555', fontWeight: 600, fontSize: 10 }}>7D</th>
              </tr>
            </thead>
            <tbody>
              {displayCoins.map((coin, index) => {
                const change = timeframe === '1h' 
                  ? (coin.price_change_percentage_1h_in_currency || coin.priceChange1h)
                  : (coin.price_change_percentage_24h || coin.priceChange24h)
                const sparkline = coin.sparkline_in_7d?.price || []
                const sparklinePositive = sparkline.length > 1 ? sparkline[sparkline.length - 1] > sparkline[0] : true
                return (
                  <tr 
                    key={coin.id || coin.symbol} 
                    onClick={() => onCoinClick(coin)}
                    style={{ borderBottom: '1px solid #1a1a1a', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 8px', color: '#444' }}>{index + 1}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {coin.image && (
                          <img 
                            src={coin.image} 
                            alt="" 
                            style={{ width: 24, height: 24, borderRadius: '50%' }}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#fff' }}>
                            {coin.symbol?.toUpperCase()}
                            {isFavorite(coin.symbol) && <span style={{ color: '#FFD700', marginLeft: 4 }}>★</span>}
                          </div>
                          <div style={{ fontSize: 10, color: '#666' }}>{coin.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: '#fff', fontSize: 12 }}>
                      {formatPrice(coin.current_price || coin.price)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, fontSize: 11 }}>
                      {formatChange(change)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#999', fontSize: 11 }}>
                      {formatMarketCap(coin.market_cap)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#888', fontSize: 11 }}>
                      {formatMarketCap(coin.total_volume)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {sparkline.length > 0 ? (
                        <MiniSparkline data={sparkline} positive={sparklinePositive} />
                      ) : (
                        <span style={{ color: '#444', fontSize: 10 }}>—</span>
                      )}
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

function ChartWidget() {
  return (
    <div style={{ 
      background: '#0f0f0f', 
      border: '1px solid #222', 
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16
    }}>
      <div style={{ 
        padding: '10px 12px', 
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span style={{ fontSize: 14 }}>📈</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Bitcoin Chart</span>
      </div>
      <BitcoinChart />
    </div>
  )
}

function TrendingCoinCard({ coin, onClick, isFavorite }) {
  const change = coin.price_change_percentage_24h || 0
  const isPositive = change >= 0
  
  const formatPrice = (price) => {
    if (!price) return '$0.00'
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  return (
    <BentoCard onClick={onClick} style={{ flex: '1 0 8%', minWidth: 90, scrollSnapAlign: 'start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {coin.image && (
          <img 
            src={coin.image} 
            alt="" 
            style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }}
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {coin.symbol?.toUpperCase()}
            {isFavorite && <span style={{ color: '#FFD700', marginLeft: 3 }}>★</span>}
          </div>
          <div style={{ fontSize: 8, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{coin.name}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
        {formatPrice(coin.current_price || coin.price)}
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, color: isPositive ? '#39FF14' : '#ff4444' }}>
        {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
      </div>
    </BentoCard>
  )
}

function NewsCard({ news }) {
  return (
    <BentoCard 
      onClick={() => news.url && window.open(news.url, '_blank')}
      style={{ flex: '1 0 22%', minWidth: 160, scrollSnapAlign: 'start' }}
    >
      <div style={{ fontSize: 9, color: '#00D4FF', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
        {news.source}
      </div>
      <div style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: '#fff', 
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        marginBottom: 6,
      }}>
        {news.title}
      </div>
      <div style={{ fontSize: 9, color: '#555' }}>{news.time}</div>
    </BentoCard>
  )
}

function Footer() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '8px 0',
      color: '#666',
      fontSize: 11,
      fontWeight: 500,
    }}>
      Powered by DarkWave Studios, LLC © 2025 | v2.0.6
    </div>
  )
}

export default function DashboardTab({ userId, userConfig, onNavigate }) {
  const { favorites, loading: favoritesLoading } = useFavorites()
  const { avatarSvg } = useAvatar()
  const [selectedCoin, setSelectedCoin] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [coins, setCoins] = useState([])
  const [coinsLoading, setCoinsLoading] = useState(true)
  const [activeView, setActiveView] = useState('top10')
  const [timeframe, setTimeframe] = useState('24h')
  const [marketData, setMarketData] = useState({
    fearGreed: 65,
    altcoinSeason: 75,
    totalMarketCap: 3.2e12,
    totalMarketCapChange: 2.1,
    totalVolume: 98e9,
    totalVolumeChange: -1.8,
  })
  const [news, setNews] = useState([])

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
          const coinList = Array.isArray(data) ? data : (data.coins || [])
          setCoins(coinList)
        }
      } catch (err) {
        console.log('Failed to fetch coins')
      } finally {
        setCoinsLoading(false)
      }
    }
    fetchCoins()
    const interval = setInterval(fetchCoins, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const defaultNews = [
      { source: 'CoinDesk', title: 'Bitcoin Holds Above $90K as Market Awaits Fed Decision', time: '2h ago', url: 'https://coindesk.com' },
      { source: 'CoinTelegraph', title: 'Ethereum Layer-2 Solutions See Record Growth in Q4', time: '4h ago', url: 'https://cointelegraph.com' },
      { source: 'The Block', title: 'Solana DeFi TVL Surges Past $5 Billion Milestone', time: '6h ago', url: 'https://theblock.co' },
      { source: 'Decrypt', title: 'AI Tokens Lead Altcoin Rally as Sector Gains Momentum', time: '8h ago', url: 'https://decrypt.co' },
    ]
    
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/crypto/news')
        if (response.ok) {
          const data = await response.json()
          setNews(data.news || data || defaultNews)
        } else {
          setNews(defaultNews)
        }
      } catch (err) {
        setNews(defaultNews)
      }
    }
    
    fetchNews()
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCoinClick = (coin) => {
    setSelectedCoin(coin)
    setIsModalOpen(true)
  }

  const isFavorite = (symbol) => favorites?.some(f => f.symbol?.toUpperCase() === symbol?.toUpperCase())

  const quickActions = [
    { icon: '🎯', title: 'Sniper Bot', subtitle: 'AI trading', color: '#00D4FF', tab: 'sniper' },
    { icon: '💼', title: 'Wallet', subtitle: 'Multi-chain', color: '#9D4EDD', tab: 'wallet' },
    { icon: '📋', title: 'Watchlist', subtitle: 'Limit orders', color: '#39FF14', tab: 'watchlist' },
    { icon: '📊', title: 'Markets', subtitle: 'Live prices', color: '#FF006E', tab: 'markets' },
    { icon: '⚙️', title: 'Settings', subtitle: 'Preferences', color: '#888', tab: 'settings' },
  ]

  return (
    <div style={{ padding: '12px 12px 0' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      {/* Quick Actions Carousel */}
      <CarouselRow title="Quick Actions" showArrows>
        {quickActions.map((action, i) => (
          <QuickActionCard 
            key={i}
            icon={action.icon}
            title={action.title}
            subtitle={action.subtitle}
            accentColor={action.color}
            onClick={() => onNavigate && onNavigate(action.tab)}
          />
        ))}
      </CarouselRow>
      
      {/* Market Metrics & Gauges Carousel */}
      <CarouselRow title="Market Overview" showArrows>
        <MetricCard 
          title="Market Cap" 
          value={formatMarketCap(marketData.totalMarketCap)} 
          change={marketData.totalMarketCapChange || 2.1}
        />
        <MetricCard 
          title="24h Volume" 
          value={formatMarketCap(marketData.totalVolume)} 
          change={marketData.totalVolumeChange || -1.8}
        />
        <GaugeCard 
          title="Fear & Greed" 
          value={marketData.fearGreed} 
          type="fearGreed" 
          accentColor="#FF006E" 
        />
        <GaugeCard 
          title="Altcoin Season" 
          value={marketData.altcoinSeason} 
          type="altcoinSeason" 
          accentColor="#00D4FF" 
        />
      </CarouselRow>
      
      {/* Trending Coins Carousel */}
      <CarouselRow title="Trending" showArrows>
        {coinsLoading ? (
          <BentoCard style={{ minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
            <div style={{ color: '#666', fontSize: 11 }}>Loading...</div>
          </BentoCard>
        ) : (
          coins.slice(0, 12).map((coin, i) => (
            <TrendingCoinCard 
              key={coin.id || i}
              coin={coin}
              onClick={() => handleCoinClick(coin)}
              isFavorite={isFavorite(coin.symbol)}
            />
          ))
        )}
      </CarouselRow>
      
      {/* Coin Table */}
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
      
      {/* Bitcoin Chart */}
      <ChartWidget />
      
      {/* News Carousel */}
      <CarouselRow title="News" showArrows>
        {news.map((item, i) => (
          <NewsCard key={i} news={item} />
        ))}
      </CarouselRow>
      
      <Footer />
      
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
