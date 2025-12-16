import React, { useState } from 'react';

const SIGNAL_TYPES = ['BUY', 'SELL', 'HOLD'];

export default function PostSignalModal({ onClose, onSuccess, traderId }) {
  const [formData, setFormData] = useState({
    ticker: '',
    signal: 'BUY',
    targetPrice: '',
    stopLoss: '',
    analysis: '',
    expiresIn: '24',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.ticker.trim()) {
      setError('Ticker is required');
      return;
    }

    if (!traderId) {
      setError('Please log in to post signals');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const expiresAt = formData.expiresIn 
        ? new Date(Date.now() + parseInt(formData.expiresIn) * 60 * 60 * 1000).toISOString()
        : null;

      const response = await fetch('/api/social/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traderId,
          ticker: formData.ticker.toUpperCase(),
          signal: formData.signal,
          targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
          stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
          analysis: formData.analysis,
          expiresAt,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.signal);
        onClose?.();
      } else {
        setError(data.error || 'Failed to post signal');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2>📡 Share Signal</h2>
        <p className="modal-description">
          Share your trading insight with the community
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Ticker *</label>
              <input
                type="text"
                placeholder="BTC, ETH, SOL..."
                value={formData.ticker}
                onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label>Signal Type *</label>
              <div className="signal-buttons">
                {SIGNAL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`signal-type-btn ${type.toLowerCase()} ${formData.signal === type ? 'active' : ''}`}
                    onClick={() => handleChange('signal', type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Price</label>
              <input
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={formData.targetPrice}
                onChange={(e) => handleChange('targetPrice', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Stop Loss</label>
              <input
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={formData.stopLoss}
                onChange={(e) => handleChange('stopLoss', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Expires In</label>
            <select
              value={formData.expiresIn}
              onChange={(e) => handleChange('expiresIn', e.target.value)}
            >
              <option value="1">1 hour</option>
              <option value="4">4 hours</option>
              <option value="24">24 hours</option>
              <option value="72">3 days</option>
              <option value="168">1 week</option>
            </select>
          </div>

          <div className="form-group">
            <label>Analysis</label>
            <textarea
              placeholder="Share your reasoning for this signal..."
              value={formData.analysis}
              onChange={(e) => handleChange('analysis', e.target.value)}
              rows={4}
              maxLength={500}
            />
            <div className="char-count">{formData.analysis.length}/500</div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Posting...' : '📡 Post Signal'}
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
            max-width: 520px;
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
            margin: 0 0 8px;
            color: #fff;
            font-size: 24px;
          }
          .modal-description {
            margin: 0 0 24px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
          }
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-group label {
            display: block;
            color: #fff;
            font-weight: 500;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
            box-sizing: border-box;
          }
          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #6366f1;
          }
          .form-group textarea {
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
          }
          .char-count {
            text-align: right;
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            margin-top: 4px;
          }
          .signal-buttons {
            display: flex;
            gap: 8px;
          }
          .signal-type-btn {
            flex: 1;
            padding: 10px;
            border: 2px solid transparent;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.6);
          }
          .signal-type-btn:hover {
            background: rgba(255, 255, 255, 0.15);
          }
          .signal-type-btn.buy.active {
            background: rgba(16, 185, 129, 0.2);
            border-color: #10b981;
            color: #10b981;
          }
          .signal-type-btn.sell.active {
            background: rgba(239, 68, 68, 0.2);
            border-color: #ef4444;
            color: #ef4444;
          }
          .signal-type-btn.hold.active {
            background: rgba(251, 191, 36, 0.2);
            border-color: #fbbf24;
            color: #fbbf24;
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
            margin-top: 8px;
          }
          .cancel-button, .submit-button {
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
          .submit-button {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
          }
          .submit-button:hover {
            opacity: 0.9;
          }
          .submit-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          @media (max-width: 480px) {
            .form-row {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
