import React, { useState, useEffect } from 'react';
import TraderCard from './TraderCard';

const TIMEFRAMES = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'alltime', label: 'All Time' },
];

export default function LeaderboardTable({ onSelectTrader }) {
  const [traders, setTraders] = useState([]);
  const [timeframe, setTimeframe] = useState('alltime');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/social/leaderboard?timeframe=${timeframe}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setTraders(data.leaderboard);
      } else {
        setError(data.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatPnL = (pnl) => {
    const value = parseFloat(pnl);
    const formatted = Math.abs(value).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    if (value >= 0) return `+${formatted}`;
    return `-${formatted}`;
  };

  const formatWinRate = (rate) => {
    return `${parseFloat(rate).toFixed(1)}%`;
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>🏆 Top Traders</h2>
        <div className="timeframe-tabs">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              className={`timeframe-tab ${timeframe === tf.value ? 'active' : ''}`}
              onClick={() => setTimeframe(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={fetchLeaderboard}>Retry</button>
        </div>
      )}

      {!loading && !error && traders.length === 0 && (
        <div className="empty-state">
          <p>No traders found for this period.</p>
        </div>
      )}

      {!loading && !error && traders.length > 0 && (
        <div className="leaderboard-table">
          <div className="table-header">
            <span className="rank-col">Rank</span>
            <span className="trader-col">Trader</span>
            <span className="pnl-col">Total PnL</span>
            <span className="winrate-col">Win Rate</span>
            <span className="trades-col">Trades</span>
            <span className="followers-col">Followers</span>
            <span className="action-col"></span>
          </div>

          {traders.map((trader, index) => (
            <div 
              key={trader.id} 
              className={`table-row ${index < 3 ? 'top-three' : ''}`}
              onClick={() => onSelectTrader?.(trader)}
            >
              <span className="rank-col">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </span>
              <span className="trader-col">
                <div className="trader-info">
                  <div className="trader-avatar">
                    {trader.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="trader-name">
                    {trader.displayName || `Trader ${trader.id.slice(0, 6)}`}
                  </div>
                </div>
              </span>
              <span className={`pnl-col ${parseFloat(trader.totalPnl) >= 0 ? 'positive' : 'negative'}`}>
                {formatPnL(trader.totalPnl)}
              </span>
              <span className="winrate-col">{formatWinRate(trader.winRate)}</span>
              <span className="trades-col">{trader.totalTrades}</span>
              <span className="followers-col">{trader.followers || 0}</span>
              <span className="action-col">
                <button className="follow-btn" onClick={(e) => { e.stopPropagation(); onSelectTrader?.(trader); }}>
                  Copy
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .leaderboard-container {
          background: rgba(20, 20, 35, 0.9);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .leaderboard-header h2 {
          margin: 0;
          color: #fff;
          font-size: 24px;
        }
        .timeframe-tabs {
          display: flex;
          gap: 8px;
          background: rgba(0, 0, 0, 0.3);
          padding: 4px;
          border-radius: 8px;
        }
        .timeframe-tab {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
        }
        .timeframe-tab:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }
        .timeframe-tab.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
        }
        .loading-state, .error-state, .empty-state {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.6);
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .error-state button {
          margin-top: 16px;
          padding: 8px 16px;
          background: #6366f1;
          border: none;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
        }
        .leaderboard-table {
          overflow-x: auto;
        }
        .table-header, .table-row {
          display: grid;
          grid-template-columns: 60px 1fr 120px 100px 80px 100px 80px;
          gap: 12px;
          padding: 12px 16px;
          align-items: center;
        }
        .table-header {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .table-row {
          color: #fff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: background 0.2s;
        }
        .table-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .table-row.top-three {
          background: rgba(255, 215, 0, 0.05);
        }
        .rank-col {
          font-size: 18px;
          font-weight: bold;
        }
        .trader-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .trader-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }
        .pnl-col.positive { color: #10b981; }
        .pnl-col.negative { color: #ef4444; }
        .follow-btn {
          padding: 6px 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .follow-btn:hover {
          opacity: 0.9;
        }
        @media (max-width: 768px) {
          .table-header, .table-row {
            grid-template-columns: 50px 1fr 80px 60px;
          }
          .trades-col, .followers-col, .action-col {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
