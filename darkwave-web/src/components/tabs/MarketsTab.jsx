import { useState, useEffect } from 'react'
import { Carousel, BentoGrid, BentoItem, CategoryPills } from '../ui'

const coinCategories = [
  { id: 'top', label: 'Top 10' },
  { id: 'meme', icon: '🎪', label: 'Memes' },
  { id: 'defi', icon: '💎', label: 'DeFi' },
  { id: 'bluechip', icon: '🏆', label: 'Blue Chips' },
]

function MetricCard({ title, value, change, onClick }) {
  const isPositive = change && change.startsWith('+')
  
  return (
    <div className="metric-card" onClick={onClick}>
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      {change && (
        <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
          {change}
        </div>
      )}
    </div>
  )
}

function NewsCard({ source, title, time, url }) {
  return (
    <div className="news-card" onClick={() => url && window.open(url, '_blank')}>
      <div className="news-source">{source}</div>
      <div className="news-title">{title}</div>
      {time && <div className="news-time">{time}</div>}
    </div>
  )
}

function CoinRow({ coin, onClick }) {
  const isPositive = parseFloat(coin.change) > 0
  
  return (
    <tr className="clickable-row" onClick={onClick}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={coin.logo} 
            alt={coin.name}
            style={{ width: 24, height: 24, borderRadius: '50%' }}
            onError={(e) => e.target.src = '/darkwave-coin.png'}
          />
          <strong>{coin.symbol}</strong>
        </div>
      </td>
      <td>{coin.price}</td>
      <td className={isPositive ? 'positive' : 'negative'}>{coin.change}</td>
      <td>{coin.volume}</td>
    </tr>
  )
}

export default function MarketsTab() {
  const [activeCategory, setActiveCategory] = useState('top')
  const [marketData, setMarketData] = useState({
    fearGreed: 65,
    altcoinSeason: 75,
    marketCap: '$3.14T',
    volume: '$64.1B',
  })
  const [coins, setCoins] = useState([
    { symbol: 'BTC', name: 'Bitcoin', logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', price: '$97,234', change: '+2.3%', volume: '$28.5B' },
    { symbol: 'ETH', name: 'Ethereum', logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', price: '$3,845', change: '+1.8%', volume: '$12.1B' },
    { symbol: 'SOL', name: 'Solana', logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', price: '$242.50', change: '-0.5%', volume: '$2.3B' },
    { symbol: 'BNB', name: 'BNB', logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', price: '$698.20', change: '+3.1%', volume: '$1.8B' },
  ])
  const [news, setNews] = useState([
    { source: 'CoinDesk', title: 'Bitcoin Surges Past $97K as Institutional Demand Grows', time: '2h ago' },
    { source: 'Bloomberg', title: 'Ethereum ETF Sees Record Inflows', time: '4h ago' },
    { source: 'Reuters', title: 'Fed Signals Potential Rate Cuts in 2025', time: '6h ago' },
    { source: 'CryptoNews', title: 'Solana DeFi TVL Reaches New All-Time High', time: '8h ago' },
    { source: 'The Block', title: 'Major Exchange Announces New Listing Requirements', time: '10h ago' },
  ])
  
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
  
  return (
    <div className="markets-tab">
      <Carousel itemWidth={160} showDots={true}>
        <MetricCard 
          title="FEAR & GREED" 
          value={marketData.fearGreed}
          change={marketData.fearGreed > 50 ? 'Greed' : 'Fear'}
        />
        <MetricCard 
          title="ALTCOIN SEASON" 
          value={marketData.altcoinSeason}
          change={marketData.altcoinSeason > 50 ? 'Alt Season' : 'BTC Season'}
        />
        <MetricCard 
          title="MARKET CAP" 
          value={marketData.marketCap}
        />
        <MetricCard 
          title="24H VOLUME" 
          value={marketData.volume}
        />
      </Carousel>
      
      <div className="section-box mb-md">
        <div className="section-header">
          <h3 className="section-title">📊 Live Prices</h3>
        </div>
        <div className="section-content">
          <CategoryPills 
            categories={coinCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
          
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Price</th>
                  <th>24h %</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {coins.map(coin => (
                  <CoinRow 
                    key={coin.symbol} 
                    coin={coin}
                    onClick={() => console.log('Open analysis for', coin.symbol)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="section-box mb-md">
        <div className="section-header">
          <h3 className="section-title">📰 Latest News</h3>
        </div>
        <div className="section-content">
          <Carousel itemWidth={280}>
            {news.map((item, i) => (
              <NewsCard key={i} {...item} />
            ))}
          </Carousel>
        </div>
      </div>
    </div>
  )
}
