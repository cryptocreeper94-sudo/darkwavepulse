import React, { useState } from 'react';

export default function CopyTradeModal({ trader, onClose, onConfirm, currentUserId }) {
  const [settings, setSettings] = useState({
    allocationPercent: 10,
    maxPositionSize: 1000,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      setError('Please log in to copy trades');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: currentUserId,
          traderId: trader.id,
          allocationPercent: settings.allocationPercent,
          maxPositionSize: settings.maxPositionSize,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onConfirm?.(data);
        onClose?.();
      } else {
        setError(data.error || 'Failed to follow trader');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!trader) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2>📋 Copy Trading Setup</h2>
        
        <div className="trader-preview">
          <div className="trader-avatar">
            {trader.displayName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="trader-details">
            <h3>{trader.displayName || `Trader ${trader.id?.slice(0, 6)}`}</h3>
            <div className="trader-stats">
              <span className={parseFloat(trader.totalPnl) >= 0 ? 'positive' : 'negative'}>
                PnL: ${parseFloat(trader.totalPnl || 0).toLocaleString()}
              </span>
              <span>Win Rate: {parseFloat(trader.winRate || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Portfolio Allocation (%)</label>
            <p className="field-description">
              Percentage of your portfolio to allocate for copying this trader's trades
            </p>
            <input
              type="range"
              min="1"
              max="50"
              value={settings.allocationPercent}
              onChange={(e) => setSettings({ ...settings, allocationPercent: parseInt(e.target.value) })}
            />
            <div className="range-value">{settings.allocationPercent}%</div>
          </div>

          <div className="form-group">
            <label>Max Position Size ($)</label>
            <p className="field-description">
              Maximum amount to invest in any single copied trade
            </p>
            <input
              type="number"
              min="10"
              max="100000"
              step="10"
              value={settings.maxPositionSize}
              onChange={(e) => setSettings({ ...settings, maxPositionSize: parseInt(e.target.value) })}
            />
          </div>

          <div className="risk-warning">
            ⚠️ <strong>Risk Warning:</strong> Past performance is not indicative of future results. 
            Only invest what you can afford to lose.
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="confirm-button" disabled={loading}>
              {loading ? 'Setting up...' : 'Start Copying'}
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }
          .modal-content {
            background: rgba(20, 20, 35, 0.98);
            border-radius: 16px;
            padding: 32px;
            max-width: 480px;
            width: 100%;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-height: 90vh;
            overflow-y: auto;
          }
          .close-button {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            font-size: 28px;
            cursor: pointer;
            line-height: 1;
          }
          .close-button:hover {
            color: #fff;
          }
          h2 {
            margin: 0 0 24px;
            color: #fff;
            font-size: 24px;
          }
          .trader-preview {
            display: flex;
            align-items: center;
            gap: 16px;
            background: rgba(0, 0, 0, 0.3);
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 24px;
          }
          .trader-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
            color: #fff;
          }
          .trader-details h3 {
            margin: 0 0 4px;
            color: #fff;
            font-size: 18px;
          }
          .trader-stats {
            display: flex;
            gap: 16px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
          }
          .trader-stats .positive { color: #10b981; }
          .trader-stats .negative { color: #ef4444; }
          .form-group {
            margin-bottom: 24px;
          }
          .form-group label {
            display: block;
            color: #fff;
            font-weight: 500;
            margin-bottom: 4px;
          }
          .field-description {
            color: rgba(255, 255, 255, 0.5);
            font-size: 13px;
            margin: 0 0 12px;
          }
          .form-group input[type="range"] {
            width: 100%;
            height: 8px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
            appearance: none;
          }
          .form-group input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #6366f1;
            cursor: pointer;
          }
          .range-value {
            text-align: center;
            color: #6366f1;
            font-size: 24px;
            font-weight: bold;
            margin-top: 8px;
          }
          .form-group input[type="number"] {
            width: 100%;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
          }
          .form-group input[type="number"]:focus {
            outline: none;
            border-color: #6366f1;
          }
          .risk-warning {
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.3);
            padding: 12px 16px;
            border-radius: 8px;
            color: #fbbf24;
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            padding: 12px 16px;
            border-radius: 8px;
            color: #ef4444;
            font-size: 14px;
            margin-bottom: 16px;
          }
          .modal-actions {
            display: flex;
            gap: 12px;
          }
          .cancel-button, .confirm-button {
            flex: 1;
            padding: 14px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          .cancel-button {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
          }
          .cancel-button:hover {
            background: rgba(255, 255, 255, 0.15);
          }
          .confirm-button {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
          }
          .confirm-button:hover {
            opacity: 0.9;
          }
          .confirm-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}
