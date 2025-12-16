import React, { useState, useEffect } from 'react';

export default function TraderCard({ trader, onFollow, onViewSignals, currentUserId }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trader?.id) {
      fetchTraderDetails();
    }
  }, [trader?.id]);

  const fetchTraderDetails = async () => {
    try {
      const response = await fetch(`/api/social/traders/${trader.id}`);
      const data = await response.json();
      if (data.success && data.recentSignals) {
        setSignals(data.recentSignals.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to fetch trader details:', err);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      alert('Please log in to follow traders');
      return;
    }
    setLoading(true);
    try {
      onFollow?.(trader);
    } finally {
      setLoading(false);
    }
  };

  const formatPnL = (pnl) => {
    const value = parseFloat(pnl || 0);
    const formatted = Math.abs(value).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  if (!trader) return null;

  return (
    <div className="trader-card">
      <div className="trader-header">
        <div className="trader-avatar-large">
          {trader.displayName?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="trader-info">
          <h3>{trader.displayName || `Trader ${trader.id?.slice(0, 6)}`}</h3>
          {trader.bio && <p className="trader-bio">{trader.bio}</p>}
        </div>
        {trader.rank && trader.rank <= 10 && (
          <div className="rank-badge">#{trader.rank}</div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total PnL</span>
          <span className={`stat-value ${parseFloat(trader.totalPnl) >= 0 ? 'positive' : 'negative'}`}>
            {formatPnL(trader.totalPnl)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Win Rate</span>
          <span className="stat-value">{parseFloat(trader.winRate || 0).toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Trades</span>
          <span className="stat-value">{trader.totalTrades || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Followers</span>
          <span className="stat-value">{trader.followers || 0}</span>
        </div>
      </div>

      {signals.length > 0 && (
        <div className="recent-signals">
          <h4>Recent Signals</h4>
          <div className="signals-list">
            {signals.map((signal) => (
              <div key={signal.id} className="signal-mini">
                <span className={`signal-type ${signal.signal.toLowerCase()}`}>
                  {signal.signal}
                </span>
                <span className="signal-ticker">{signal.ticker}</span>
                <span className="signal-score">
                  👍 {signal.upvotes || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-actions">
        <button 
          className="follow-button"
          onClick={handleFollow}
          disabled={loading}
        >
          {loading ? 'Loading...' : isFollowing ? 'Following' : '📋 Copy Trades'}
        </button>
        <button 
          className="signals-button"
          onClick={() => onViewSignals?.(trader)}
        >
          📊 View Signals
        </button>
      </div>

      <style>{`
        .trader-card {
          background: rgba(20, 20, 35, 0.95);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 400px;
        }
        .trader-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
          position: relative;
        }
        .trader-avatar-large {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          color: #fff;
          flex-shrink: 0;
        }
        .trader-info {
          flex: 1;
        }
        .trader-info h3 {
          margin: 0 0 4px;
          color: #fff;
          font-size: 20px;
        }
        .trader-bio {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          line-height: 1.4;
        }
        .rank-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-item {
          background: rgba(0, 0, 0, 0.3);
          padding: 12px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-label {
          display: block;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .stat-value {
          display: block;
          color: #fff;
          font-size: 16px;
          font-weight: bold;
        }
        .stat-value.positive { color: #10b981; }
        .stat-value.negative { color: #ef4444; }
        .recent-signals {
          margin-bottom: 20px;
        }
        .recent-signals h4 {
          margin: 0 0 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .signals-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .signal-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.2);
          padding: 8px 12px;
          border-radius: 6px;
        }
        .signal-type {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .signal-type.buy { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .signal-type.sell { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .signal-type.hold { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
        .signal-ticker {
          flex: 1;
          color: #fff;
          font-weight: 500;
        }
        .signal-score {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }
        .card-actions {
          display: flex;
          gap: 12px;
        }
        .follow-button, .signals-button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .follow-button {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
        }
        .follow-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .follow-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .signals-button {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .signals-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}
