import { useState } from 'react'
import { CategoryPills, Accordion, AccordionItem } from '../ui'

const learnCategories = [
  { id: 'founder', icon: '👤', label: 'Founder' },
  { id: 'why', icon: '🎯', label: 'Why Pulse' },
  { id: 'faqs', icon: '❓', label: 'FAQs' },
  { id: 'glossary', icon: '📖', label: 'Glossary' },
]

const faqs = [
  {
    question: 'What is Pulse?',
    answer: 'Pulse is an AI-powered predictive trading analysis platform that provides institutional-grade market insights for crypto and stocks. Our AI agents analyze market data 24/7 to deliver actionable trading signals.'
  },
  {
    question: 'How much does it cost?',
    answer: 'During our Beta V1 phase, Founders can lock in lifetime pricing at just $4/month. This includes access to all AI agents, trading signals, and 35K DWAV token rewards.'
  },
  {
    question: 'What is the DWAV token?',
    answer: 'DWAV is the DarkWave Studios ecosystem token on Solana. It provides staking rewards, premium access across all DarkWave apps, and governance rights. Launch date: February 14, 2026.'
  },
  {
    question: 'How accurate are the predictions?',
    answer: 'Our AI models are continuously trained on market data and track prediction accuracy across 1hr, 4hr, 24hr, and 7-day timeframes. Every prediction is blockchain-stamped for transparency.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. We use industry-standard encryption, secure authentication, and never share your personal data. All predictions are audited on Solana blockchain for transparency.'
  },
]

const glossaryTerms = [
  { term: 'RSI', definition: 'Relative Strength Index - A momentum indicator measuring speed and magnitude of price changes.' },
  { term: 'MACD', definition: 'Moving Average Convergence Divergence - Shows relationship between two moving averages.' },
  { term: 'Fear & Greed Index', definition: 'Market sentiment indicator from 0 (Extreme Fear) to 100 (Extreme Greed).' },
  { term: 'Altcoin Season', definition: 'Period when altcoins outperform Bitcoin in terms of price gains.' },
  { term: 'DeFi', definition: 'Decentralized Finance - Financial services built on blockchain without intermediaries.' },
]

export default function LearnTab() {
  const [activeSection, setActiveSection] = useState('founder')
  
  const renderContent = () => {
    switch (activeSection) {
      case 'founder':
        return (
          <div className="section-box">
            <div style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #00D4FF, #9D4EDD)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36
              }}>
                👨‍💻
              </div>
              <h2 style={{ marginBottom: 8 }}>Jason</h2>
              <p style={{ color: '#00D4FF', fontSize: 12, marginBottom: 16 }}>Founder & CEO, DarkWave Studios</p>
              <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
                Building the future of AI-powered trading analysis. With a background in software engineering 
                and a passion for democratizing financial tools, Jason created Pulse to give everyday traders 
                access to institutional-grade market intelligence.
              </p>
            </div>
          </div>
        )
        
      case 'why':
        return (
          <div className="section-box">
            <div style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 16, color: '#00D4FF' }}>Why Choose Pulse?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                  <h4 style={{ marginBottom: 4 }}>AI-Powered Analysis</h4>
                  <p style={{ fontSize: 12, color: '#888' }}>18 specialized AI agents analyzing markets 24/7</p>
                </div>
                <div className="card">
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⛓️</div>
                  <h4 style={{ marginBottom: 4 }}>Blockchain Verified</h4>
                  <p style={{ fontSize: 12, color: '#888' }}>Every prediction stamped on Solana for transparency</p>
                </div>
                <div className="card">
                  <div style={{ fontSize: 24, marginBottom: 8 }}>💰</div>
                  <h4 style={{ marginBottom: 4 }}>Affordable Access</h4>
                  <p style={{ fontSize: 12, color: '#888' }}>Institutional tools at $4/month for founders</p>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'faqs':
        return (
          <Accordion singleOpen={true}>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} title={faq.question} icon="❓">
                <p>{faq.answer}</p>
              </AccordionItem>
            ))}
          </Accordion>
        )
        
      case 'glossary':
        return (
          <div className="section-box">
            <div style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 16 }}>Trading Glossary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {glossaryTerms.map((item, i) => (
                  <div key={i} style={{ 
                    padding: 12, 
                    background: '#1a1a1a', 
                    borderRadius: 8,
                    borderLeft: '3px solid #00D4FF'
                  }}>
                    <div style={{ fontWeight: 700, color: '#00D4FF', marginBottom: 4 }}>
                      {item.term}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {item.definition}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="learn-tab">
      <CategoryPills 
        categories={learnCategories}
        activeCategory={activeSection}
        onSelect={setActiveSection}
      />
      
      <div style={{ marginTop: 16 }}>
        {renderContent()}
      </div>
    </div>
  )
}
