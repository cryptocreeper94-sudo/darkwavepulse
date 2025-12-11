import { useState } from 'react'

const API_BASE = ''

export default function SafetyReport({ tokenAddress, onClose }) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  const runSafetyCheck = async () => {
    if (!tokenAddress) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/sniper/safety/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to run safety check')
      }
      
      const data = await response.json()
      setReport(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return '#39FF14'
      case 'B': return '#00D4FF'
      case 'C': return '#FFD700'
      case 'D': return '#FF8C00'
      case 'F': return '#FF4444'
      default: return '#888'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#39FF14'
    if (score >= 60) return '#00D4FF'
    if (score >= 40) return '#FFD700'
    if (score >= 20) return '#FF8C00'
    return '#FF4444'
  }

  return (
    <div className="safety-report">
      <div className="safety-header">
        <h3>Safety Analysis</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <div className="token-input-row">
        <input
          type="text"
          value={tokenAddress || ''}
          readOnly
          placeholder="Token address"
          className="token-address-display"
        />
        <button 
          onClick={runSafetyCheck} 
          disabled={loading || !tokenAddress}
          className="run-check-btn"
        >
          {loading ? 'Checking...' : 'Run Safety Check'}
        </button>
      </div>

      {error && (
        <div className="safety-error">
          {error}
        </div>
      )}

      {report && (
        <div className="safety-results">
          <div className="score-section">
            <div className="score-circle" style={{ borderColor: getScoreColor(report.safetyScore) }}>
              <span className="score-value" style={{ color: getScoreColor(report.safetyScore) }}>
                {report.safetyScore}
              </span>
              <span className="score-label">/ 100</span>
            </div>
            <div className="grade-badge" style={{ backgroundColor: getGradeColor(report.safetyGrade) }}>
              Grade {report.safetyGrade}
            </div>
            <div className={`pass-status ${report.passesAllChecks ? 'pass' : 'fail'}`}>
              {report.passesAllChecks ? '✓ PASSES ALL CHECKS' : '✗ HAS RISKS'}
            </div>
          </div>

          {report.risks.length > 0 && (
            <div className="risks-section">
              <h4>Risks</h4>
              {report.risks.map((risk, i) => (
                <div key={i} className="risk-item">
                  <span className="risk-icon">⚠️</span>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          )}

          {report.warnings.length > 0 && (
            <div className="warnings-section">
              <h4>Warnings</h4>
              {report.warnings.map((warning, i) => (
                <div key={i} className="warning-item">
                  <span className="warning-icon">⚡</span>
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          <div className="checks-grid">
            <div className="check-card">
              <div className="check-title">Mint Authority</div>
              <div className={`check-status ${!report.hasMintAuthority ? 'safe' : 'danger'}`}>
                {!report.hasMintAuthority ? '✓ Disabled' : '✗ Active'}
              </div>
            </div>

            <div className="check-card">
              <div className="check-title">Freeze Authority</div>
              <div className={`check-status ${!report.hasFreezeAuthority ? 'safe' : 'danger'}`}>
                {!report.hasFreezeAuthority ? '✓ Disabled' : '✗ Active'}
              </div>
            </div>

            <div className="check-card">
              <div className="check-title">Liquidity</div>
              <div className={`check-status ${report.liquidityLocked || report.liquidityBurned ? 'safe' : 'warning'}`}>
                {report.liquidityBurned ? '✓ Burned' : report.liquidityLocked ? '✓ Locked' : '⚠ Unlocked'}
              </div>
              {report.liquidityLockPlatform && (
                <div className="check-detail">{report.liquidityLockPlatform}</div>
              )}
            </div>

            <div className="check-card">
              <div className="check-title">Honeypot</div>
              <div className={`check-status ${report.honeypotResult?.canSell && !report.honeypotResult?.isHoneypot ? 'safe' : 'danger'}`}>
                {report.honeypotResult?.isHoneypot 
                  ? '✗ HONEYPOT' 
                  : report.honeypotResult?.canSell 
                    ? '✓ Can Sell' 
                    : '⚠ Check Failed'}
              </div>
              {report.honeypotResult?.sellTax > 0 && (
                <div className="check-detail">Sell Tax: {report.honeypotResult.sellTax.toFixed(1)}%</div>
              )}
            </div>

            <div className="check-card">
              <div className="check-title">Token Age</div>
              <div className="check-status neutral">
                {report.tokenAgeMinutes < 60 
                  ? `${report.tokenAgeMinutes}m` 
                  : report.tokenAgeMinutes < 1440 
                    ? `${Math.floor(report.tokenAgeMinutes / 60)}h` 
                    : `${Math.floor(report.tokenAgeMinutes / 1440)}d`}
              </div>
            </div>

            <div className="check-card">
              <div className="check-title">Top 10 Holders</div>
              <div className={`check-status ${report.top10HoldersPercent < 50 ? 'safe' : report.top10HoldersPercent < 70 ? 'warning' : 'danger'}`}>
                {report.top10HoldersPercent?.toFixed(1)}%
              </div>
            </div>

            <div className="check-card">
              <div className="check-title">Holder Count</div>
              <div className={`check-status ${report.holderCount > 100 ? 'safe' : report.holderCount > 50 ? 'warning' : 'danger'}`}>
                {report.holderCount?.toLocaleString()}
              </div>
            </div>

            <div className="check-card">
              <div className="check-title">Creator Risk</div>
              <div className={`check-status ${report.creatorRiskScore < 40 ? 'safe' : report.creatorRiskScore < 70 ? 'warning' : 'danger'}`}>
                {report.creatorRiskScore}/100
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .safety-report {
          background: #0f0f0f;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
        }
        
        .safety-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .safety-header h3 {
          color: #00D4FF;
          margin: 0;
          font-size: 16px;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: #666;
          font-size: 20px;
          cursor: pointer;
        }
        
        .close-btn:hover {
          color: #FF4444;
        }
        
        .token-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .token-address-display {
          flex: 1;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 10px 12px;
          color: #888;
          font-size: 12px;
          font-family: monospace;
        }
        
        .run-check-btn {
          background: linear-gradient(135deg, #00D4FF, #0099CC);
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          color: #000;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        
        .run-check-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .run-check-btn:hover:not(:disabled) {
          transform: scale(1.02);
        }
        
        .safety-error {
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid #FF4444;
          border-radius: 8px;
          padding: 12px;
          color: #FF4444;
          margin-bottom: 16px;
        }
        
        .score-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: #1a1a1a;
          border-radius: 12px;
        }
        
        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 4px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
        }
        
        .score-value {
          font-size: 28px;
          font-weight: 700;
        }
        
        .score-label {
          font-size: 12px;
          color: #666;
        }
        
        .grade-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          color: #000;
          font-size: 14px;
        }
        
        .pass-status {
          margin-left: auto;
          font-weight: 600;
          font-size: 13px;
        }
        
        .pass-status.pass {
          color: #39FF14;
        }
        
        .pass-status.fail {
          color: #FF4444;
        }
        
        .risks-section, .warnings-section {
          margin-bottom: 16px;
        }
        
        .risks-section h4, .warnings-section h4 {
          color: #888;
          font-size: 12px;
          text-transform: uppercase;
          margin: 0 0 8px 0;
        }
        
        .risk-item, .warning-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255, 68, 68, 0.1);
          border-radius: 8px;
          margin-bottom: 6px;
          color: #FF6B6B;
          font-size: 13px;
        }
        
        .warning-item {
          background: rgba(255, 215, 0, 0.1);
          color: #FFD700;
        }
        
        .checks-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        
        @media (max-width: 768px) {
          .checks-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .score-section {
            flex-wrap: wrap;
          }
        }
        
        .check-card {
          background: #1a1a1a;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 12px;
          text-align: center;
        }
        
        .check-title {
          color: #666;
          font-size: 11px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        
        .check-status {
          font-weight: 600;
          font-size: 14px;
        }
        
        .check-status.safe {
          color: #39FF14;
        }
        
        .check-status.warning {
          color: #FFD700;
        }
        
        .check-status.danger {
          color: #FF4444;
        }
        
        .check-status.neutral {
          color: #00D4FF;
        }
        
        .check-detail {
          color: #666;
          font-size: 10px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  )
}
