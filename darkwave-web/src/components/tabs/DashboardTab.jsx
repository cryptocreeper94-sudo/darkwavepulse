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

const BENTO_STYLES = {
  grid: {
    display: 'grid',
    gap: 12,
  },
  card: {
    background: '#0f0f0f',
    border: '1px solid #222',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
}

function BentoCard({ children, onClick, span = 1, style = {} }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <div 
      onClick={onClick}
      style={{
        ...BENTO_STYLES.card,
        gridColumn: span > 1 ? `span ${span}` : undefined,
        cursor: onClick ? 'pointer' : 'default',
        borderColor: hovered && onClick ? '#00D4FF' : '#222',
        transform: hovered && onClick ? 'translateY(-2px)' : 'none',
        transition: 'border-color 0.2s, transform 0.2s',
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  )
}

function CarouselRow({ children, title }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
    }
  }
  
  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [children])
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      })
    }
  }
  
  return (
    <div style={{ marginBottom: 16, position: 'relative' }}>
      {title && (
        <div style={{ 
          fontSize: 11, 
          fontWeight: 700, 
          color: '#666', 
          textTransform: 'uppercase', 
          letterSpacing: 1,
          marginBottom: 8,
          paddingLeft: 4,
        }}>
          {title}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid #333',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ‹
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
            paddingBottom: 4,
          }}
        >
          <style>{`
            .carousel-row::-webkit-scrollbar { display: none; }
          `}</style>
          {children}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid #333',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ›
          </button>
        )}
      </div>
    </div>
  )
}

function QuickActionCard({ icon, title, subtitle, onClick, accentColor = '#00D4FF' }) {
  return (
    <BentoCard 
      onClick={onClick}
      style={{ 
        minWidth: 140, 
        flex: '0 0 auto',
        scrollSnapAlign: 'start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ 
          fontSize: 18, 
          width: 32, 
          height: 32, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: `${accentColor}15`,
          borderRadius: 8,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{title}</div>
          <div style={{ fontSize: 9, color: '#666' }}>{subtitle}</div>
        </div>
      </div>
    </BentoCard>
  )
}

function GaugeCard({ title, value, type, accentColor }) {
  return (
    <BentoCard style={{ 
      minWidth: 130, 
      flex: '0 0 auto',
      scrollSnapAlign: 'start',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ 
        color: accentColor, 
        fontSize: 9, 
        fontWeight: 700, 
        textTransform: 'uppercase', 
        letterSpacing: 1,
        marginBottom: 4,
      }}>
        {title}
      </div>
      <div style={{ width: 100, margin: '0 auto' }}>
        <Gauge value={value} type={type} size={100} showLabels={false} />
      </div>
    </BentoCard>
  )
}

function CoinCard({ coin, onClick, isFavorite }) {
  const change = coin.price_change_percentage_24h || 0
  const isPositive = change >= 0
  
  const formatPrice = (price) => {
    if (!price) return '$0.00'
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  return (
    <BentoCard 
      onClick={onClick}
      style={{ 
        minWidth: 140, 
        flex: '0 0 auto',
        scrollSnapAlign: 'start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {coin.image && (
          <img 
            src={coin.image} 
            alt="" 
            style={{ width: 24, height: 24, borderRadius: '50%' }}
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
            {coin.symbol?.toUpperCase()}
            {isFavorite && <span style={{ color: '#FFD700', marginLeft: 4 }}>★</span>}
          </div>
          <div style={{ fontSize: 9, color: '#666' }}>{coin.name}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
        {formatPrice(coin.current_price || coin.price)}
      </div>
      <div style={{ 
        fontSize: 10, 
        fontWeight: 600, 
        color: isPositive ? '#39FF14' : '#ff4444' 
      }}>
        {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
      </div>
    </BentoCard>
  )
}

function NewsCard({ news }) {
  const NEWS_IMAGES = [
    '/assets/news/bitcoin_cryptocurren_e03615e0.jpg',
    '/assets/news/bitcoin_cryptocurren_49ee9303.jpg',
  ]
  
  return (
    <BentoCard 
      onClick={() => news.url && window.open(news.url, '_blank')}
      style={{ 
        minWidth: 200, 
        flex: '0 0 auto',
        scrollSnapAlign: 'start',
      }}
    >
      <div style={{ 
        height: 80, 
        marginBottom: 8, 
        borderRadius: 8,
        backgroundImage: `url(${news.image || NEWS_IMAGES[0]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />
      <div style={{ fontSize: 9, color: '#00D4FF', fontWeight: 600, marginBottom: 4 }}>
        {news.source}
      </div>
      <div style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: '#fff', 
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {news.title}
      </div>
      <div style={{ fontSize: 9, color: '#555', marginTop: 6 }}>{news.time}</div>
    </BentoCard>
  )
}

function ChartCard() {
  return (
    <BentoCard style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ 
        padding: '10px 12px', 
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span style={{ fontSize: 14 }}>📈</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Bitcoin Chart</span>
      </div>
      <BitcoinChart />
    </BentoCard>
  )
}

function Footer() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '12px 0',
      color: '#555',
      fontSize: 10,
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
  const [marketData, setMarketData] = useState({
    fearGreed: 65,
    altcoinSeason: 75,
    btcDominance: 52,
    totalMarketCap: 2.8e12,
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
      { source: 'CoinTelegraph', title: 'Ethereum Layer-2 Solutions See Record Growth', time: '4h ago', url: 'https://cointelegraph.com' },
      { source: 'The Block', title: 'Solana DeFi TVL Surges Past $5 Billion', time: '6h ago', url: 'https://theblock.co' },
      { source: 'Decrypt', title: 'AI Tokens Lead Altcoin Rally', time: '8h ago', url: 'https://decrypt.co' },
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

  const gauges = [
    { title: 'Fear & Greed', value: marketData.fearGreed, type: 'fearGreed', color: '#FF006E' },
    { title: 'Altcoin Season', value: marketData.altcoinSeason, type: 'altcoinSeason', color: '#00D4FF' },
  ]

  return (
    <div style={{ padding: 12 }}>
      <style>{`
        .carousel-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      
      {/* Quick Actions Carousel */}
      <CarouselRow title="Quick Actions">
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
      
      {/* Gauges - 2 column grid on mobile, carousel if more */}
      <div style={{ 
        ...BENTO_STYLES.grid, 
        gridTemplateColumns: 'repeat(2, 1fr)',
        marginBottom: 16,
      }}>
        {gauges.map((gauge, i) => (
          <GaugeCard 
            key={i}
            title={gauge.title}
            value={gauge.value}
            type={gauge.type}
            accentColor={gauge.color}
          />
        ))}
      </div>
      
      {/* Top Coins Carousel */}
      <CarouselRow title="Trending">
        {coinsLoading ? (
          <BentoCard style={{ minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
            <div style={{ color: '#666', fontSize: 11 }}>Loading...</div>
          </BentoCard>
        ) : (
          coins.slice(0, 10).map((coin, i) => (
            <CoinCard 
              key={coin.id || i}
              coin={coin}
              onClick={() => handleCoinClick(coin)}
              isFavorite={isFavorite(coin.symbol)}
            />
          ))
        )}
      </CarouselRow>
      
      {/* Favorites Carousel (if any) */}
      {favorites && favorites.length > 0 && (
        <CarouselRow title="Favorites">
          {favorites.map((coin, i) => (
            <CoinCard 
              key={coin.id || i}
              coin={coin}
              onClick={() => handleCoinClick(coin)}
              isFavorite={true}
            />
          ))}
        </CarouselRow>
      )}
      
      {/* Chart - Full Width */}
      <div style={{ marginBottom: 16 }}>
        <ChartCard />
      </div>
      
      {/* News Carousel */}
      <CarouselRow title="News">
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
