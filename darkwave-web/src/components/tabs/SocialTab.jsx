import { useState, useEffect } from 'react'
import './SocialTab.css'

export default function SocialTab({ userId }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [signals, setSignals] = useState([])
  const [myProfile, setMyProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('leaderboard')
  const [period, setPeriod] = useState('weekly')

  useEffect(() => {
    fetchData()
  }, [userId, period])

  const fetchData = async () => {
    try {
      const [leaderRes, signalsRes] = await Promise.all([
        fetch(`/api/social/leaderboard?period=${period}&limit=50`).catch(() => null),
        fetch('/api/social/signals?limit=20').catch(() => null)
      ])

      if (leaderRes?.ok) setLeaderboard((await leaderRes.json()).traders || [])
      if (signalsRes?.ok) setSignals((await signalsRes.json()).signals || [])
    } catch (err) {
      console.error('Social fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatPnl = (pnl) => {
    const num = parseFloat(pnl) || 0
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`
    return `$${num.toFixed(0)}`
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (loading) {
    return (
      <div className="social-tab">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" />
          <p style={{ color: '#888', marginTop: 16 }}>Loading social hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="social-tab">
      <div className="social-header">
        <div>
          <h2 className="social-title">Social Trading Hub</h2>
          <p className="social-subtitle">Follow top traders, share signals, compete on leaderboards</p>
        </div>
      </div>

      <div className="social-nav">
        {['leaderboard', 'signals', 'following'].map(view => (
          <button
            key={view}
            className={`social-nav-btn ${activeView === view ? 'active' : ''}`}
            onClick={() => setActiveView(view)}
          >
            {view === 'leaderboard' && '🏆 Leaderboard'}
            {view === 'signals' && '📡 Signals Feed'}
            {view === 'following' && '👥 Following'}
          </button>
        ))}
      </div>

      {activeView === 'leaderboard' && (
        <div className="leaderboard-section">
          <div className="section-header">
            <h3>Top Traders</h3>
            <div className="period-selector">
              {['daily', 'weekly', 'monthly', 'all'].map(p => (
                <button
                  key={p}
                  className={`period-btn ${period === p ? 'active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <p>No traders on the leaderboard yet</p>
              <p className="empty-subtext">Be the first to compete!</p>
            </div>
          ) : (
            <div className="leaderboard-table">
              <div className="leaderboard-header">
                <span>Rank</span>
                <span>Trader</span>
                <span>Win Rate</span>
                <span>P&L</span>
                <span>Trades</span>
                <span>Followers</span>
                <span></span>
              </div>
              {leaderboard.map((trader, i) => (
                <div key={trader.id || i} className="leaderboard-row">
                  <div className="trader-rank">
                    {getRankBadge(trader.rank || i + 1)}
                  </div>
                  <div className="trader-info">
                    <div className="trader-avatar">
                      {trader.displayName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="trader-name">{trader.displayName || `Trader ${i + 1}`}</div>
                      {trader.verifiedTrader && <span className="verified-badge">✓ Verified</span>}
                    </div>
                  </div>
                  <div className="trader-winrate">
                    <span className="winrate-value">{parseFloat(trader.winRate || 0).toFixed(1)}%</span>
                  </div>
                  <div className={`trader-pnl ${parseFloat(trader.totalPnl || trader.totalPnlUsd || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(trader.totalPnl || trader.totalPnlUsd || 0) >= 0 ? '+' : ''}
                    {formatPnl(trader.totalPnl || trader.totalPnlUsd)}
                  </div>
                  <div className="trader-trades">{trader.totalTrades || trader.tradesCount || 0}</div>
                  <div className="trader-followers">{trader.followers || trader.followersCount || 0}</div>
                  <div className="trader-actions">
                    <button className="follow-btn">Follow</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'signals' && (
        <div className="signals-section">
          <div className="section-header">
            <h3>Community Signals</h3>
          </div>

          {signals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📡</div>
              <p>No signals shared yet</p>
              <button className="btn btn-primary">Share Your First Signal</button>
            </div>
          ) : (
            <div className="signals-feed">
              {signals.map((signal, i) => (
                <div key={signal.id || i} className="signal-card">
                  <div className="signal-header">
                    <div className="signal-author">
                      <div className="author-avatar">
                        {signal.userId?.charAt(0) || '?'}
                      </div>
                      <span className="author-name">Trader</span>
                    </div>
                    <div className={`signal-type ${signal.signalType?.toLowerCase()}`}>
                      {signal.signalType}
                    </div>
                  </div>
                  <div className="signal-token">
                    <span className="token-symbol">{signal.tokenSymbol}</span>
                    {signal.chain && <span className="token-chain">{signal.chain}</span>}
                  </div>
                  <div className="signal-details">
                    {signal.entryPrice && (
                      <div className="detail">
                        <span className="detail-label">Entry</span>
                        <span className="detail-value">${parseFloat(signal.entryPrice).toFixed(6)}</span>
                      </div>
                    )}
                    {signal.targetPrice && (
                      <div className="detail">
                        <span className="detail-label">Target</span>
                        <span className="detail-value positive">${parseFloat(signal.targetPrice).toFixed(6)}</span>
                      </div>
                    )}
                    {signal.stopLoss && (
                      <div className="detail">
                        <span className="detail-label">Stop Loss</span>
                        <span className="detail-value negative">${parseFloat(signal.stopLoss).toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                  {signal.reasoning && (
                    <div className="signal-reasoning">{signal.reasoning}</div>
                  )}
                  <div className="signal-footer">
                    <div className="signal-stats">
                      <span>❤️ {signal.likesCount || 0}</span>
                      <span>💬 {signal.commentsCount || 0}</span>
                      <span>📋 {signal.copiesCount || 0}</span>
                    </div>
                    {signal.outcome && (
                      <div className={`signal-outcome ${signal.outcome?.toLowerCase()}`}>
                        {signal.outcome} ({signal.outcomePercent ? `${parseFloat(signal.outcomePercent) >= 0 ? '+' : ''}${parseFloat(signal.outcomePercent).toFixed(1)}%` : '-'})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'following' && (
        <div className="following-section">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>Not Following Anyone Yet</h3>
            <p>Follow top traders to see their trades and signals here</p>
            <button className="btn btn-primary" onClick={() => setActiveView('leaderboard')}>
              Browse Leaderboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
