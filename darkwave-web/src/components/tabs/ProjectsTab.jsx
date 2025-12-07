import { useState } from 'react'
import { Carousel, CategoryPills, Accordion, AccordionItem } from '../ui'

const coinCategories = [
  { id: 'cryptocat', icon: '🐱', label: 'Crypto Cat' },
  { id: 'conspiracy', icon: '👁️', label: 'Conspiracy' },
  { id: 'spiritual', icon: '✨', label: 'Spiritual' },
  { id: 'meme', icon: '🎪', label: 'Meme' },
]

const projectCoins = {
  cryptocat: [
    { id: 'ccat', name: 'CryptoCat', ticker: '$CCAT', logo: '/coins/ccat-cryptocat.jpg' },
    { id: 'cwc', name: 'Cat Wif Cash', ticker: '$CWC', logo: '/coins/cwc-catwifcash.png' },
    { id: 'uncat', name: 'Uncertainty Cat', ticker: '$UNCAT', logo: '/coins/uncat-uncertainty.jpg' },
    { id: 'rektmeow', name: 'RektMeow', ticker: '$REKT', logo: '/coins/rektmeow-liquidation.jpg' },
  ],
  conspiracy: [
    { id: 'obey', name: 'Illuminati', ticker: '$OBEY', logo: '/coins/obey-illuminati.jpg' },
    { id: 'v25', name: 'Vertigo', ticker: '$V25', logo: '/coins/v25-vertigo.jpg' },
    { id: 'p25', name: 'Pumpocracy', ticker: '$P25', logo: '/coins/p25-pumpocracy.jpg' },
    { id: 'insane', name: 'Overstimulated', ticker: '$INSANE', logo: '/coins/insane-overstimulated.jpg' },
  ],
  spiritual: [
    { id: 'yah', name: 'Yahuah', ticker: '$YAH', logo: '/coins/yah-yahuah.jpg' },
    { id: 'yahu', name: 'Yahusha', ticker: '$YAHU', logo: '/coins/yahu-yahusha.jpg' },
    { id: 'jh25', name: 'Justice', ticker: '$JH25', logo: '/coins/jh25-justice.jpg' },
  ],
  meme: [
    { id: 'love', name: 'United', ticker: '$LOVE', logo: '/coins/love-united.jpg' },
    { id: 'cheers', name: 'Pumpaholic', ticker: '$CHEERS', logo: '/coins/cheers-pumpaholic.jpg' },
    { id: 'rhodi', name: 'Rhodium', ticker: '$RHODI', logo: '/coins/rhodi-rhodium.jpg' },
  ],
}

function CoinCard({ coin, onClick }) {
  return (
    <div className="coin-card" onClick={() => onClick?.(coin)}>
      <img 
        src={coin.logo} 
        alt={coin.name} 
        className="coin-logo"
        onError={(e) => e.target.src = '/darkwave-coin.png'}
      />
      <div className="coin-name">{coin.name}</div>
      <div className="coin-ticker">{coin.ticker}</div>
    </div>
  )
}

function AgentCard({ agent }) {
  return (
    <div className="card" style={{ width: 140, textAlign: 'center' }}>
      <div style={{ 
        width: 60, 
        height: 60, 
        borderRadius: '50%', 
        background: 'linear-gradient(135deg, #00D4FF, #9D4EDD)',
        margin: '0 auto 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24
      }}>
        👤
      </div>
      <div style={{ fontSize: 12, fontWeight: 700 }}>{agent.name}</div>
      <div style={{ fontSize: 10, color: '#888' }}>{agent.specialty}</div>
    </div>
  )
}

export default function ProjectsTab() {
  const [activeCategory, setActiveCategory] = useState('cryptocat')
  
  const agents = [
    { id: 1, name: 'Devon', specialty: 'Market Analysis' },
    { id: 2, name: 'Claire', specialty: 'Technical Trading' },
    { id: 3, name: 'Marcus', specialty: 'Risk Management' },
    { id: 4, name: 'Aria', specialty: 'DeFi Expert' },
    { id: 5, name: 'Jin', specialty: 'Altcoin Hunter' },
    { id: 6, name: 'Sophia', specialty: 'Macro Analysis' },
  ]
  
  const handleCoinClick = (coin) => {
    console.log('Open coin details for', coin.name)
  }
  
  return (
    <div className="projects-tab">
      <div className="section-box mb-md" style={{ 
        background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.1), rgba(0, 212, 255, 0.1))',
        border: '1px solid rgba(57, 255, 20, 0.3)'
      }}>
        <div style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#39FF14', fontWeight: 700, marginBottom: 4 }}>
            ⭐ FEATURED
          </div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>United ($LOVE)</h2>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
            💜 United in Love & Community. Live on Solana.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => window.open('https://jup.ag/swap/SOL-Gvt8zjmMrUXKgvckQzJMobsegF373M6ALYtmCq6qpump', '_blank')}
          >
            🪐 Buy on Jupiter
          </button>
        </div>
      </div>
      
      <div className="section-box mb-md">
        <div className="section-header">
          <h3 className="section-title">🕵️ Agent Series</h3>
        </div>
        <div className="section-content">
          <Carousel itemWidth={140}>
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </Carousel>
        </div>
      </div>
      
      <div className="section-box mb-md">
        <div className="section-header">
          <h3 className="section-title">🪙 Project Coins</h3>
        </div>
        <div className="section-content">
          <CategoryPills 
            categories={coinCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
          
          <Carousel itemWidth={160}>
            {projectCoins[activeCategory]?.map(coin => (
              <CoinCard 
                key={coin.id} 
                coin={coin}
                onClick={handleCoinClick}
              />
            ))}
          </Carousel>
        </div>
      </div>
      
      <Accordion singleOpen={true}>
        <AccordionItem title="Submit Your Project" icon="📝">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input 
              type="text" 
              placeholder="Token Ticker (e.g., PULSE)"
              style={{
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14
              }}
            />
            <input 
              type="text" 
              placeholder="Token Name"
              style={{
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14
              }}
            />
            <input 
              type="text" 
              placeholder="Contract Address"
              style={{
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14
              }}
            />
            <button className="btn btn-primary">Submit for Review</button>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
