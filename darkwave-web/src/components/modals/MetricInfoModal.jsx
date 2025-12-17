export default function MetricInfoModal({ isOpen, onClose, metric }) {
  if (!isOpen || !metric) return null

  const metricInfo = {
    'Fear & Greed': {
      title: 'Fear & Greed Index',
      description: 'Measures overall market sentiment on a scale of 0-100.',
      details: [
        { range: '0-20', label: 'Extreme Fear', meaning: 'Market is very fearful. Historically, this has been a good buying opportunity.' },
        { range: '21-40', label: 'Fear', meaning: 'Investors are worried. Prices may be undervalued.' },
        { range: '41-60', label: 'Neutral', meaning: 'Market sentiment is balanced. No strong bias either way.' },
        { range: '61-80', label: 'Greed', meaning: 'Investors are getting greedy. Prices may be overvalued.' },
        { range: '81-100', label: 'Extreme Greed', meaning: 'Market is euphoric. Historically, this signals potential corrections.' },
      ],
      source: 'Calculated from volatility, volume, social media, surveys, and dominance data.',
    },
    'Altcoin Season': {
      title: 'Altcoin Season Index',
      description: 'Indicates whether Bitcoin or altcoins are leading the market.',
      details: [
        { range: '0-25', label: 'Bitcoin Season', meaning: 'Bitcoin is outperforming most altcoins. Capital flows to BTC.' },
        { range: '26-45', label: 'BTC Leaning', meaning: 'Bitcoin still leads, but altcoins show some strength.' },
        { range: '46-55', label: 'Neutral', meaning: 'Mixed performance between Bitcoin and altcoins.' },
        { range: '56-75', label: 'Alt Leaning', meaning: 'Altcoins starting to outperform Bitcoin.' },
        { range: '76-100', label: 'Altcoin Season', meaning: 'Altcoins significantly outperforming Bitcoin. Risk-on environment.' },
      ],
      source: 'Compares top 50 altcoin performance vs Bitcoin over 90 days.',
    },
    'Market Cap': {
      title: 'Total Market Capitalization',
      description: 'The combined value of all cryptocurrencies in the market.',
      details: [
        { label: 'What it means', meaning: 'Higher market cap = more money invested in crypto overall.' },
        { label: 'Rising market cap', meaning: 'New money entering the market. Generally bullish signal.' },
        { label: 'Falling market cap', meaning: 'Money leaving the market. Generally bearish signal.' },
      ],
      source: 'Sum of (price x circulating supply) for all tracked cryptocurrencies.',
    },
    '24h Volume': {
      title: '24-Hour Trading Volume',
      description: 'Total value of all cryptocurrency trades in the last 24 hours.',
      details: [
        { label: 'High volume', meaning: 'Strong market activity. Confirms price movements are significant.' },
        { label: 'Low volume', meaning: 'Weak market activity. Price movements may not be sustained.' },
        { label: 'Volume spike', meaning: 'Sudden interest. Often precedes major price moves.' },
      ],
      source: 'Aggregated from major exchanges worldwide.',
    },
    'BTC Dominance': {
      title: 'Bitcoin Dominance',
      description: 'Percentage of total crypto market cap held by Bitcoin.',
      details: [
        { label: 'Rising dominance', meaning: 'Bitcoin gaining market share. Often during fear or correction periods.' },
        { label: 'Falling dominance', meaning: 'Altcoins gaining market share. Often during altcoin seasons.' },
        { label: 'Historical range', meaning: 'BTC dominance typically ranges between 40-70%. Currently sits around 50-55%.' },
      ],
      source: 'Bitcoin market cap divided by total crypto market cap.',
    },
  }

  const info = metricInfo[metric] || {
    title: metric,
    description: 'Information about this metric.',
    details: [],
    source: '',
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-metric-info" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>x</button>
        
        <div className="modal-header">
          <span className="modal-icon">📊</span>
          <h2 className="modal-title">{info.title}</h2>
        </div>

        <div className="modal-body">
          <p style={{ 
            fontSize: 14, 
            color: 'rgba(255,255,255,0.8)', 
            lineHeight: 1.6, 
            marginBottom: 20 
          }}>
            {info.description}
          </p>

          <div style={{ marginBottom: 20 }}>
            {info.details.map((detail, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 4,
                }}>
                  {detail.range && (
                    <span style={{ 
                      fontSize: 12, 
                      fontWeight: 700, 
                      color: '#00D4FF',
                      background: 'rgba(0,212,255,0.15)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {detail.range}
                    </span>
                  )}
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: '#fff',
                    flex: 1,
                    marginLeft: detail.range ? 10 : 0,
                  }}>
                    {detail.label}
                  </span>
                </div>
                <p style={{ 
                  fontSize: 12, 
                  color: 'rgba(255,255,255,0.6)', 
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {detail.meaning}
                </p>
              </div>
            ))}
          </div>

          {info.source && (
            <div style={{ 
              fontSize: 11, 
              color: 'rgba(255,255,255,0.4)', 
              fontStyle: 'italic',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: 12,
            }}>
              <strong>Data Source:</strong> {info.source}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
