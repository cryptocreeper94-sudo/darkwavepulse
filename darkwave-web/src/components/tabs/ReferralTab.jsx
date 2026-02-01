import { useState, useEffect } from 'react'
import './ReferralTab.css'

export default function ReferralTab({ userId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [userId])

  const fetchStats = async () => {
    if (!userId) { setLoading(false); return }
    
    try {
      const res = await fetch(`/api/referral/stats?userId=${userId}`)
      if (res.ok) setStats(await res.json())
    } catch (err) {
      console.error('Referral stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCode = async () => {
    if (!userId) return
    
    try {
      const res = await fetch(`/api/referral/code?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setStats(prev => ({ ...prev, code: data.code?.code || data.code }))
      }
    } catch (err) {
      console.error('Get code error:', err)
    }
  }

  const copyCode = () => {
    if (!stats?.code) return
    navigator.clipboard.writeText(stats.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = `https://pulse.darkwave.io/?ref=${stats?.code || ''}`

  if (loading) {
    return (
      <div className="referral-tab">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="referral-tab">
      <div className="referral-header">
        <h2>Referral Program</h2>
        <p>Earn 10% commission on every subscription from your referrals</p>
      </div>

      <div className="referral-hero">
        <div className="hero-icon">🎁</div>
        <div className="hero-text">
          <h3>Share & Earn</h3>
          <p>Get 10% of every subscription your friends make, forever!</p>
        </div>
      </div>

      <div className="referral-code-section">
        <div className="code-label">Your Referral Code</div>
        {stats?.code ? (
          <div className="code-display">
            <span className="code-value">{stats.code}</span>
            <button className="copy-btn" onClick={copyCode}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={getCode}>
            Generate My Code
          </button>
        )}
        
        {stats?.code && (
          <div className="share-link">
            <div className="link-label">Share Link</div>
            <div className="link-display">
              <span className="link-value">{shareLink}</span>
              <button 
                className="copy-btn" 
                onClick={() => {
                  navigator.clipboard.writeText(shareLink)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="referral-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats?.referrals || 0}</div>
          <div className="stat-label">Total Referrals</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">${parseFloat(stats?.earnings || 0).toFixed(2)}</div>
          <div className="stat-label">Lifetime Earnings</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">${parseFloat(stats?.pending || 0).toFixed(2)}</div>
          <div className="stat-label">Pending Payout</div>
        </div>
      </div>

      <div className="how-it-works">
        <h3>How It Works</h3>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Share Your Code</h4>
              <p>Send your unique referral code or link to friends</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Friends Subscribe</h4>
              <p>When they sign up and subscribe to any plan</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Earn Forever</h4>
              <p>Get 10% of their subscription fee, every month</p>
            </div>
          </div>
        </div>
      </div>

      {stats?.recentReferrals?.length > 0 && (
        <div className="recent-referrals">
          <h3>Recent Referrals</h3>
          <div className="referrals-list">
            {stats.recentReferrals.map((ref, i) => (
              <div key={ref.id || i} className="referral-item">
                <div className="ref-user">User #{ref.referredUserId?.slice(-6) || i + 1}</div>
                <div className="ref-date">
                  {ref.signupDate ? new Date(ref.signupDate).toLocaleDateString() : '-'}
                </div>
                <div className="ref-status">{ref.status}</div>
                <div className="ref-earned">${parseFloat(ref.commissionPaidUsd || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="payout-info">
        <h3>Payout Information</h3>
        <ul>
          <li>Minimum payout: $10</li>
          <li>Payouts processed weekly</li>
          <li>Receive in USDC, SOL, or crypto of choice</li>
          <li>Commissions are lifetime - earn as long as they stay subscribed</li>
        </ul>
      </div>
    </div>
  )
}
