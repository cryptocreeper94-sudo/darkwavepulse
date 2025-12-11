import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useTelegram } from '../../context/TelegramContext'

const TIER_LEVELS = {
  'free': 0,
  'base': 1,
  'rm-plus': 2,
  'founder': 3,
  'premium': 4
}

const SubscriptionGateContext = createContext(null)

function getTierLevel(tier) {
  return TIER_LEVELS[tier] ?? 0
}

function hasAccess(userTier, requiredTier) {
  return getTierLevel(userTier) >= getTierLevel(requiredTier)
}

export function useSubscriptionGate(requiredTier = 'rm-plus') {
  const context = useContext(SubscriptionGateContext)
  const [showModal, setShowModal] = useState(false)
  
  const currentTier = context?.currentTier || 'free'
  const isAllowed = hasAccess(currentTier, requiredTier)
  
  const showUpgrade = useCallback(() => {
    if (context?.showUpgradeModal) {
      context.showUpgradeModal(requiredTier)
    } else {
      setShowModal(true)
    }
  }, [context, requiredTier])
  
  return {
    isAllowed,
    showUpgrade,
    currentTier,
    showModal,
    setShowModal
  }
}

function UpgradeModal({ isOpen, onClose, featureName, requiredTier }) {
  const { webApp, isTelegram } = useTelegram()
  
  if (!isOpen) return null
  
  const tierNames = {
    'base': 'Base',
    'rm-plus': 'RM+',
    'founder': 'Legacy Founder',
    'premium': 'Premium'
  }
  
  const handleUpgrade = () => {
    const pricingUrl = '/pricing'
    
    if (isTelegram && webApp?.openLink) {
      webApp.openLink(window.location.origin + pricingUrl)
    } else {
      window.location.href = pricingUrl
    }
    onClose()
  }
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  return (
    <div className="subscription-gate-modal-backdrop" onClick={handleBackdropClick}>
      <div className="subscription-gate-modal">
        <button className="subscription-gate-modal-close" onClick={onClose}>
          &times;
        </button>
        
        <div className="subscription-gate-modal-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        
        <h2 className="subscription-gate-modal-title">
          Unlock {featureName || 'Premium Feature'}
        </h2>
        
        <p className="subscription-gate-modal-description">
          This feature requires a <strong>{tierNames[requiredTier] || requiredTier}</strong> subscription or higher.
          Upgrade now to unlock this and many more premium features!
        </p>
        
        <div className="subscription-gate-modal-benefits">
          <div className="subscription-gate-benefit">
            <span className="subscription-gate-benefit-icon">&#10003;</span>
            <span>Advanced AI Analysis</span>
          </div>
          <div className="subscription-gate-benefit">
            <span className="subscription-gate-benefit-icon">&#10003;</span>
            <span>StrikeAgent Trading Bot</span>
          </div>
          <div className="subscription-gate-benefit">
            <span className="subscription-gate-benefit-icon">&#10003;</span>
            <span>Real-time Alerts</span>
          </div>
        </div>
        
        <button className="subscription-gate-modal-cta" onClick={handleUpgrade}>
          Subscribe to Unlock
        </button>
        
        <button className="subscription-gate-modal-secondary" onClick={onClose}>
          Maybe Later
        </button>
      </div>
      
      <style>{`
        .subscription-gate-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .subscription-gate-modal {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          position: relative;
          animation: slideUp 0.3s ease;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 212, 255, 0.1);
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .subscription-gate-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
          transition: color 0.2s;
        }
        
        .subscription-gate-modal-close:hover {
          color: #fff;
        }
        
        .subscription-gate-modal-icon {
          color: #00d4ff;
          margin-bottom: 16px;
        }
        
        .subscription-gate-modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 12px 0;
        }
        
        .subscription-gate-modal-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0 0 20px 0;
        }
        
        .subscription-gate-modal-description strong {
          color: #00d4ff;
        }
        
        .subscription-gate-modal-benefits {
          background: rgba(0, 212, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .subscription-gate-benefit {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
        }
        
        .subscription-gate-benefit-icon {
          color: #10b981;
          font-weight: bold;
        }
        
        .subscription-gate-modal-cta {
          width: 100%;
          background: linear-gradient(135deg, #00d4ff, #00a8cc);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          padding: 14px 24px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
        }
        
        .subscription-gate-modal-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 212, 255, 0.4);
        }
        
        .subscription-gate-modal-secondary {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          padding: 12px 24px;
          cursor: pointer;
          margin-top: 12px;
          transition: background 0.2s, color 0.2s;
        }
        
        .subscription-gate-modal-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  )
}

export default function SubscriptionGate({ 
  children, 
  requiredTier = 'rm-plus',
  featureName = '',
  mode = 'overlay',
  currentTier: propCurrentTier
}) {
  const [showModal, setShowModal] = useState(false)
  
  const currentTier = propCurrentTier || 'free'
  const isAllowed = hasAccess(currentTier, requiredTier)
  
  const contextValue = useMemo(() => ({
    currentTier,
    showUpgradeModal: () => setShowModal(true)
  }), [currentTier])
  
  const handleGatedClick = (e) => {
    if (!isAllowed) {
      e.preventDefault()
      e.stopPropagation()
      setShowModal(true)
    }
  }
  
  if (isAllowed) {
    return (
      <SubscriptionGateContext.Provider value={contextValue}>
        {children}
      </SubscriptionGateContext.Provider>
    )
  }
  
  if (mode === 'hide') {
    return null
  }
  
  const gateStyles = {
    overlay: {
      container: {
        position: 'relative',
        cursor: 'pointer'
      },
      overlay: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0.9) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '20px',
        paddingBottom: '40px',
        borderRadius: '12px',
        zIndex: 10
      },
      content: {
        opacity: 0.6,
        pointerEvents: 'none'
      }
    },
    blur: {
      container: {
        position: 'relative',
        cursor: 'pointer'
      },
      overlay: {
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(8px)',
        background: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        borderRadius: '12px',
        zIndex: 10
      },
      content: {
        filter: 'blur(4px)',
        pointerEvents: 'none'
      }
    }
  }
  
  const styles = gateStyles[mode] || gateStyles.overlay
  
  return (
    <SubscriptionGateContext.Provider value={contextValue}>
      <div style={styles.container} onClick={handleGatedClick}>
        <div style={styles.content}>
          {children}
        </div>
        
        <div style={styles.overlay}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {featureName || 'Premium Feature'}
            </span>
          </div>
          
          <button style={{
            background: 'linear-gradient(135deg, #00d4ff, #00a8cc)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: '600',
            padding: '10px 20px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)'
          }}>
            Subscribe to Unlock
          </button>
        </div>
      </div>
      
      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureName={featureName}
        requiredTier={requiredTier}
      />
    </SubscriptionGateContext.Provider>
  )
}

export { SubscriptionGateContext }
