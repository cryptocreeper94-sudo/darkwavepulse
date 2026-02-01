import { useState, useEffect, useRef } from 'react'
import './TaxTab.css'

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : ''

export default function TaxTab({ userId }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [costBasisMethod, setCostBasisMethod] = useState('fifo')
  const [eventsOpen, setEventsOpen] = useState(true)
  const holdingsRef = useRef(null)

  useEffect(() => {
    fetchTaxReport()
  }, [userId, year, costBasisMethod])

  const fetchTaxReport = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/tax/reports/${userId}?year=${year}&method=${costBasisMethod}`)
      const data = await res.json()
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch tax report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    try {
      const res = await fetch(`${API_BASE}/api/tax/export/${userId}?year=${year}&format=${format}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax_report_${year}.${format === 'turbotax' ? 'txf' : 'csv'}`
      a.click()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const scrollCarousel = (direction) => {
    if (holdingsRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      holdingsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (loading) {
    return <div className="tax-loading">Loading tax report...</div>
  }

  return (
    <div className="tax-tab">
      <div className="tax-header">
        <h1>Tax Reports</h1>
        <div className="tax-controls">
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2026, 2025, 2024, 2023, 2022].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select value={costBasisMethod} onChange={(e) => setCostBasisMethod(e.target.value)}>
            <option value="fifo">FIFO</option>
            <option value="lifo">LIFO</option>
            <option value="hifo">HIFO</option>
          </select>
        </div>
      </div>

      {/* Bento Grid Summary */}
      <div className="tax-bento-grid">
        <div className="glass-card tax-card gains">
          <h3>Total Gains</h3>
          <p className="amount positive">${report?.summary?.totalGains?.toLocaleString() || '0'}</p>
        </div>
        <div className="glass-card tax-card losses">
          <h3>Total Losses</h3>
          <p className="amount negative">-${report?.summary?.totalLosses?.toLocaleString() || '0'}</p>
        </div>
        <div className="glass-card tax-card net">
          <h3>Net Gain/Loss</h3>
          <p className={`amount ${(report?.summary?.netGainLoss || 0) >= 0 ? 'positive' : 'negative'}`}>
            ${report?.summary?.netGainLoss?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="glass-card tax-card short-term">
          <h3>Short-Term Gains</h3>
          <p className="amount">${report?.summary?.shortTermGains?.toLocaleString() || '0'}</p>
        </div>
        <div className="glass-card tax-card long-term">
          <h3>Long-Term Gains</h3>
          <p className="amount positive">${report?.summary?.longTermGains?.toLocaleString() || '0'}</p>
        </div>
        <div className="glass-card tax-card events-count">
          <h3>Taxable Events</h3>
          <p className="amount">{report?.summary?.taxableEvents || 0}</p>
        </div>
      </div>

      {/* Export Section */}
      <div className="export-section">
        <button onClick={() => handleExport('csv')} className="export-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Export CSV
        </button>
        <button onClick={() => handleExport('turbotax')} className="export-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          TurboTax (.txf)
        </button>
      </div>

      {/* Holdings Carousel */}
      {report?.holdings?.length > 0 && (
        <div className="holdings-carousel-wrapper">
          <h3 className="section-title">Cost Basis by Asset</h3>
          <button className="carousel-nav prev" onClick={() => scrollCarousel('left')}>‹</button>
          <div className="holdings-carousel" ref={holdingsRef}>
            {report.holdings.map((holding, i) => (
              <div key={i} className="holding-card">
                <div className="symbol">{holding.symbol}</div>
                <div className="stat">
                  <span className="stat-label">Quantity</span>
                  <span className="stat-value">{holding.quantity?.toFixed(4)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Cost Basis</span>
                  <span className="stat-value">${holding.costBasis?.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg Cost</span>
                  <span className="stat-value">${holding.avgCostPerUnit?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="carousel-nav next" onClick={() => scrollCarousel('right')}>›</button>
        </div>
      )}

      {/* Accordion: Taxable Events */}
      <div className="accordion-section">
        <div 
          className={`accordion-header ${eventsOpen ? 'open' : ''}`}
          onClick={() => setEventsOpen(!eventsOpen)}
        >
          <h2>
            <span>📊</span> Taxable Events 
            <span className="count">({report?.taxEvents?.length || 0})</span>
          </h2>
          <div className="accordion-toggle">▼</div>
        </div>
        <div className={`accordion-content ${eventsOpen ? 'open' : ''}`}>
          <div className="events-table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Proceeds</th>
                  <th>Cost Basis</th>
                  <th>Gain/Loss</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                {report?.taxEvents?.length > 0 ? (
                  report.taxEvents.map((event, i) => (
                    <tr key={i}>
                      <td>{new Date(event.date).toLocaleDateString()}</td>
                      <td><strong>{event.symbol}</strong></td>
                      <td>{event.type}</td>
                      <td>{event.quantity}</td>
                      <td>${event.proceeds?.toLocaleString()}</td>
                      <td>${event.costBasis?.toLocaleString()}</td>
                      <td className={event.gainLoss >= 0 ? 'positive' : 'negative'}>
                        {event.gainLoss >= 0 ? '+' : ''}{event.gainLoss?.toLocaleString()}
                      </td>
                      <td>
                        <span className={`term-badge ${event.term}`}>
                          {event.term}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}>
                      No taxable events for {year}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
