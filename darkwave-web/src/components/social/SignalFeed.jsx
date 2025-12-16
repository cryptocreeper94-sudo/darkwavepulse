import React, { useState, useEffect } from 'react';

export default function SignalFeed({ onSignalClick, currentUserId }) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    try {
      const response = await fetch('/api/social/signals?limit=30');
      const data = await response.json();
      if (data.success) {
        setSignals(data.signals);
      } else {
        setError(data.error || 'Failed to fetch signals');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (signalId, vote) => {
    if (!currentUserId) {
      alert('Please log in to vote');
      return;
    }

    try {
      const response = await fetch(`/api/social/signals/${signalId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, vote }),
      });
      const data = await response.json();
      if (data.success) {
        setSignals(signals.map(s => 
          s.id === signalId 
            ? { ...s, upvotes: data.upvotes, downvotes: data.downvotes, score: data.score }
            : s
        ));
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getSignalColor = (signal) => {
    switch (signal?.toUpperCase()) {
      case 'BUY': return '#10b981';
      case 'SELL': return '#ef4444';
      case 'HOLD': return '#fbbf24';
      default: return '#6366f1';
    }
  };

  if (loading) {
    return (
      <div className="signal-feed loading">
        <div className="spinner"></div>
        <p>Loading signals...</p>
        <style>{feedStyles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="signal-feed error">
        <p>⚠️ {error}</p>
        <button onClick={fetchSignals}>Retry</button>
        <style>{feedStyles}</style>
      </div>
    );
  }

  return (
    <div className="signal-feed">
      <div className="feed-header">
        <h3>📡 Community Signals</h3>
        <button className="refresh-btn" onClick={fetchSignals}>🔄</button>
      </div>

      {signals.length === 0 ? (
        <div className="empty-state">
          <p>No signals yet. Be the first to share one!</p>
        </div>
      ) : (
        <div className="signals-list">
          {signals.map((signal) => (
            <div 
              key={signal.id} 
              className="signal-card"
              onClick={() => onSignalClick?.(signal)}
            >
              <div className="signal-header">
                <div className="trader-info">
                  <div className="trader-avatar-small">
                    {signal.traderName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="trader-name">
                    {signal.traderName || 'Anonymous'}
                  </span>
                </div>
                <span className="signal-time">{formatTimeAgo(signal.createdAt)}</span>
              </div>

              <div className="signal-body">
                <div className="signal-main">
                  <span 
                    className="signal-badge"
                    style={{ backgroundColor: `${getSignalColor(signal.signal)}20`, color: getSignalColor(signal.signal) }}
                  >
                    {signal.signal}
                  </span>
                  <span className="signal-ticker">{signal.ticker}</span>
                </div>

                {(signal.targetPrice || signal.stopLoss) && (
                  <div className="signal-targets">
                    {signal.targetPrice && (
                      <span className="target">🎯 ${parseFloat(signal.targetPrice).toFixed(2)}</span>
                    )}
                    {signal.stopLoss && (
                      <span className="stop-loss">🛑 ${parseFloat(signal.stopLoss).toFixed(2)}</span>
                    )}
                  </div>
                )}

                {signal.analysis && (
                  <p className="signal-analysis">{signal.analysis}</p>
                )}
              </div>

              <div className="signal-footer">
                <div className="vote-buttons">
                  <button 
                    className="vote-btn upvote"
                    onClick={(e) => { e.stopPropagation(); handleVote(signal.id, 1); }}
                  >
                    👍 {signal.upvotes || 0}
                  </button>
                  <button 
                    className="vote-btn downvote"
                    onClick={(e) => { e.stopPropagation(); handleVote(signal.id, -1); }}
                  >
                    👎 {signal.downvotes || 0}
                  </button>
                </div>
                <div className={`signal-score ${(signal.score || 0) >= 0 ? 'positive' : 'negative'}`}>
                  Score: {signal.score || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{feedStyles}</style>
    </div>
  );
}

const feedStyles = `
  .signal-feed {
    background: rgba(20, 20, 35, 0.9);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-height: 600px;
    overflow-y: auto;
  }
  .signal-feed.loading, .signal-feed.error {
    text-align: center;
    padding: 40px;
    color: rgba(255, 255, 255, 0.6);
  }
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .feed-header h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
  }
  .refresh-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.2s;
  }
  .refresh-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .empty-state {
    text-align: center;
    padding: 40px;
    color: rgba(255, 255, 255, 0.5);
  }
  .signals-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .signal-card {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }
  .signal-card:hover {
    background: rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.1);
  }
  .signal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .trader-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .trader-avatar-small {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
  }
  .trader-name {
    color: #fff;
    font-size: 14px;
  }
  .signal-time {
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
  }
  .signal-body {
    margin-bottom: 12px;
  }
  .signal-main {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .signal-badge {
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .signal-ticker {
    color: #fff;
    font-size: 18px;
    font-weight: bold;
  }
  .signal-targets {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }
  .target { color: #10b981; }
  .stop-loss { color: #ef4444; }
  .signal-analysis {
    margin: 12px 0 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    line-height: 1.4;
  }
  .signal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  .vote-buttons {
    display: flex;
    gap: 8px;
  }
  .vote-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .vote-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .signal-score {
    font-size: 13px;
    font-weight: 500;
  }
  .signal-score.positive { color: #10b981; }
  .signal-score.negative { color: #ef4444; }
`;
