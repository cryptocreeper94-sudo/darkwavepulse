import { useState } from 'react'
import './BetaBadge.css'

export default function BetaBadge() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('betaBadgeDismissed') === 'true'
  })
  
  if (dismissed) {
    return (
      <button 
        className="beta-badge-minimized"
        onClick={() => {
          sessionStorage.removeItem('betaBadgeDismissed')
          setDismissed(false)
        }}
        title="Show Beta Notice"
      >
        BETA
      </button>
    )
  }
  
  return (
    <div className={`beta-badge ${isExpanded ? 'expanded' : ''}`}>
      <div className="beta-badge-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="beta-badge-label">
          <span className="beta-badge-icon">🚀</span>
          <span className="beta-badge-text">BETA VERSION</span>
          <span className="beta-badge-pulse"></span>
        </div>
        <button 
          className="beta-badge-toggle"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="beta-badge-content">
          <div className="beta-badge-message">
            <p className="beta-primary">
              <strong>UI In Active Development</strong> — You may experience visual inconsistencies 
              as we continuously improve the interface toward our Alpha release.
            </p>
            <div className="beta-status-section">
              <div className="beta-status-item functional">
                <span className="status-indicator"></span>
                <span>Predictive AI Engine — <strong>100% Functional</strong></span>
              </div>
              <div className="beta-status-item functional">
                <span className="status-indicator"></span>
                <span>Quantum Analysis Machine — <strong>100% Functional</strong></span>
              </div>
              <div className="beta-status-item functional">
                <span className="status-indicator"></span>
                <span>All Core Features — <strong>Fully Operational</strong></span>
              </div>
            </div>
            <p className="beta-secondary">
              Thank you for being an early adopter! Your feedback helps us build a better platform.
            </p>
          </div>
          <button 
            className="beta-badge-dismiss"
            onClick={(e) => {
              e.stopPropagation()
              sessionStorage.setItem('betaBadgeDismissed', 'true')
              setDismissed(true)
            }}
          >
            Got it
          </button>
        </div>
      )}
    </div>
  )
}
