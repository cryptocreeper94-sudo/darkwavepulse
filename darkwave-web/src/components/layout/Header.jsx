import { useWalletState, WalletMultiButton } from '../../context/WalletContext'
import VerificationBadge from '../ui/VerificationBadge'
import DarkWaveVerificationBadge from '../ui/DarkWaveVerificationBadge'
import { useState, useEffect } from 'react'

export default function Header({ onMenuToggle, isMenuOpen, activeTab, onBackClick }) {
  const wallet = useWalletState()
  const showBackButton = activeTab && activeTab !== 'dashboard' && activeTab !== 'markets'
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isScreenMobile = screenWidth < 640
  const isVerySmall = screenWidth < 400
  
  const hallmarkId = '000000000-01'
  const walletAddress = wallet?.publicKey?.toBase58() || null
  
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showBackButton ? (
          <button 
            className="header-back-btn"
            onClick={onBackClick}
            aria-label="Back to Dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        ) : (
          <button 
            className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
            onClick={onMenuToggle}
            aria-label="Menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}
      </div>
      
      <h1 className="header-title">PULSE</h1>
      
      <div className="header-right" style={{ gap: isVerySmall ? '2px' : (isScreenMobile ? '4px' : '8px') }}>
        {!isVerySmall && (
          <a
            href="/whitepaper"
            title="View Whitepaper"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isScreenMobile ? '0' : '4px',
              padding: isScreenMobile ? '4px 6px' : '6px 8px',
              background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.15), rgba(0, 212, 255, 0.15))',
              border: '1px solid rgba(57, 255, 20, 0.3)',
              borderRadius: '6px',
              color: '#39FF14',
              fontSize: isScreenMobile ? '10px' : '11px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 0 12px rgba(57, 255, 20, 0.4)';
              e.currentTarget.style.borderColor = '#39FF14';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(57, 255, 20, 0.25), rgba(0, 212, 255, 0.25))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(57, 255, 20, 0.15), rgba(0, 212, 255, 0.15))';
            }}
          >
            <span style={{ fontSize: isScreenMobile ? '10px' : '12px' }}>📄</span>
            {!isScreenMobile && <span>Whitepaper</span>}
          </a>
        )}
        <VerificationBadge 
          hallmarkId={hallmarkId}
          walletAddress={walletAddress}
        />
        {!isVerySmall && (
          <DarkWaveVerificationBadge 
            hallmarkId={hallmarkId}
            walletAddress={walletAddress}
          />
        )}
        <WalletMultiButton />
      </div>
    </header>
  )
}
