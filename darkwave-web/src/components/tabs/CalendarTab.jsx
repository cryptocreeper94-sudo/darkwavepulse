import { useState, useEffect } from 'react'
import './CalendarTab.css'

const EVENT_ICONS = {
  token_unlock: '🔓',
  airdrop: '🪂',
  ido: '🚀',
  upgrade: '⚡',
  conference: '🎤',
  partnership: '🤝',
  listing: '📊',
  other: '📅'
}

export default function CalendarTab({ userId }) {
  const [events, setEvents] = useState([])
  const [unlocks, setUnlocks] = useState([])
  const [airdrops, setAirdrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [eventsRes, unlocksRes, airdropsRes] = await Promise.all([
        fetch('/api/calendar/events').catch(() => null),
        fetch('/api/calendar/unlocks?days=30').catch(() => null),
        fetch('/api/calendar/airdrops?status=upcoming').catch(() => null)
      ])

      if (eventsRes?.ok) setEvents((await eventsRes.json()).events || [])
      if (unlocksRes?.ok) setUnlocks((await unlocksRes.json()).unlocks || [])
      if (airdropsRes?.ok) setAirdrops((await airdropsRes.json()).airdrops || [])
    } catch (err) {
      console.error('Calendar fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatValue = (value) => {
    const num = parseFloat(value) || 0
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`
    return `$${num.toFixed(0)}`
  }

  const getDaysUntil = (date) => {
    const diff = new Date(date).getTime() - Date.now()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return 'Past'
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `${days} days`
  }

  if (loading) {
    return (
      <div className="calendar-tab">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" />
          <p style={{ color: '#888', marginTop: 16 }}>Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-tab">
      <div className="calendar-header">
        <div>
          <h2 className="calendar-title">Crypto Calendar</h2>
          <p className="calendar-subtitle">Token unlocks, airdrops, IDOs & events</p>
        </div>
      </div>

      <div className="calendar-nav">
        {['all', 'unlocks', 'airdrops', 'events'].map(view => (
          <button
            key={view}
            className={`calendar-nav-btn ${activeView === view ? 'active' : ''}`}
            onClick={() => setActiveView(view)}
          >
            {view === 'all' && '📅 All'}
            {view === 'unlocks' && '🔓 Token Unlocks'}
            {view === 'airdrops' && '🪂 Airdrops'}
            {view === 'events' && '🎤 Events'}
          </button>
        ))}
      </div>

      <div className="calendar-stats">
        <div className="stat-card">
          <div className="stat-icon">🔓</div>
          <div className="stat-value">{unlocks.length}</div>
          <div className="stat-label">Upcoming Unlocks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🪂</div>
          <div className="stat-value">{airdrops.length}</div>
          <div className="stat-label">Active Airdrops</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{events.length}</div>
          <div className="stat-label">Upcoming Events</div>
        </div>
      </div>

      {(activeView === 'all' || activeView === 'unlocks') && unlocks.length > 0 && (
        <div className="calendar-section">
          <div className="section-header">
            <h3>🔓 Token Unlocks</h3>
            <span className="section-badge">Next 30 days</span>
          </div>
          <div className="unlocks-grid">
            {unlocks.slice(0, 8).map((unlock, i) => (
              <div key={unlock.id || i} className="unlock-card">
                <div className="unlock-header">
                  <span className="unlock-token">{unlock.tokenSymbol}</span>
                  <span className="unlock-date">{getDaysUntil(unlock.unlockDate)}</span>
                </div>
                <div className="unlock-amount">
                  {parseFloat(unlock.unlockAmount || 0).toLocaleString()} tokens
                </div>
                <div className="unlock-value">
                  {formatValue(unlock.unlockValueUsd)}
                  {unlock.percentOfSupply && (
                    <span className="unlock-percent">
                      ({parseFloat(unlock.percentOfSupply).toFixed(2)}% supply)
                    </span>
                  )}
                </div>
                <div className="unlock-type">{unlock.recipientType || 'Unknown'}</div>
                <div className="unlock-full-date">{formatDate(unlock.unlockDate)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeView === 'all' || activeView === 'airdrops') && airdrops.length > 0 && (
        <div className="calendar-section">
          <div className="section-header">
            <h3>🪂 Upcoming Airdrops</h3>
          </div>
          <div className="airdrops-grid">
            {airdrops.slice(0, 6).map((airdrop, i) => (
              <div key={airdrop.id || i} className="airdrop-card">
                <div className="airdrop-header">
                  <span className="airdrop-name">{airdrop.projectName}</span>
                  <span className={`airdrop-status ${airdrop.status}`}>{airdrop.status}</span>
                </div>
                {airdrop.tokenSymbol && (
                  <div className="airdrop-token">${airdrop.tokenSymbol}</div>
                )}
                {airdrop.estimatedValueUsd && (
                  <div className="airdrop-value">Est. {formatValue(airdrop.estimatedValueUsd)}</div>
                )}
                {airdrop.snapshotDate && (
                  <div className="airdrop-date">
                    <span className="date-label">Snapshot:</span>
                    {formatDate(airdrop.snapshotDate)}
                  </div>
                )}
                {airdrop.eligibilityCriteria && (
                  <div className="airdrop-criteria">{airdrop.eligibilityCriteria}</div>
                )}
                <div className="airdrop-links">
                  {airdrop.websiteUrl && (
                    <a href={airdrop.websiteUrl} target="_blank" rel="noopener noreferrer">🌐</a>
                  )}
                  {airdrop.twitterUrl && (
                    <a href={airdrop.twitterUrl} target="_blank" rel="noopener noreferrer">𝕏</a>
                  )}
                  {airdrop.discordUrl && (
                    <a href={airdrop.discordUrl} target="_blank" rel="noopener noreferrer">💬</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeView === 'all' || activeView === 'events') && events.length > 0 && (
        <div className="calendar-section">
          <div className="section-header">
            <h3>📅 Upcoming Events</h3>
          </div>
          <div className="events-list">
            {events.slice(0, 10).map((event, i) => (
              <div key={event.id || i} className="event-card">
                <div className="event-icon">
                  {EVENT_ICONS[event.eventType] || EVENT_ICONS.other}
                </div>
                <div className="event-info">
                  <div className="event-title">{event.title}</div>
                  {event.tokenSymbol && (
                    <span className="event-token">{event.tokenSymbol}</span>
                  )}
                  {event.description && (
                    <div className="event-desc">{event.description}</div>
                  )}
                </div>
                <div className="event-date">
                  <div className="date-days">{getDaysUntil(event.eventDate)}</div>
                  <div className="date-full">{formatDate(event.eventDate)}</div>
                </div>
                {event.impactLevel && (
                  <div className={`event-impact ${event.impactLevel}`}>
                    {event.impactLevel}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {unlocks.length === 0 && airdrops.length === 0 && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No upcoming events found</p>
          <p className="empty-subtext">Check back later for token unlocks, airdrops, and crypto events</p>
        </div>
      )}
    </div>
  )
}
