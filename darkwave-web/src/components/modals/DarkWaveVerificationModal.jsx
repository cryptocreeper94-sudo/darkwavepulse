import { QRCodeSVG } from 'qrcode.react'

export default function DarkWaveVerificationModal({ 
  isOpen, 
  onClose, 
  hallmarkId = '000000000-01',
  walletAddress = null 
}) {
  if (!isOpen) return null

  const darkwaveScanUrl = `https://scan.darkwave.io/hallmark/${hallmarkId}`

  const handleQRClick = () => {
    window.open(darkwaveScanUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="darkwave-modal-overlay" onClick={onClose}>
      <div className="darkwave-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="darkwave-modal-close" onClick={onClose}>×</button>
        
        <div className="darkwave-modal-header">
          <div className="darkwave-badge">
            <span className="darkwave-wave-large">🌊</span>
          </div>
          <h2 className="darkwave-modal-title">Verified on DarkWave Smart Chain</h2>
        </div>

        <div className="darkwave-hallmark-display">
          <span className="dw-hallmark-label">Hallmark ID</span>
          <span className="dw-hallmark-value">{hallmarkId}</span>
        </div>

        <div className="darkwave-qr-section" onClick={handleQRClick}>
          <div className="dw-qr-wrapper">
            <QRCodeSVG
              value={darkwaveScanUrl}
              size={160}
              bgColor="#1a1a1a"
              fgColor="#4FC3F7"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="dw-qr-hint">Tap to view on DarkWaveScan</p>
        </div>

        <div className="darkwave-info-section">
          <div className="dw-info-item">
            <span className="dw-info-icon">✓</span>
            <span className="dw-info-text">Verified on DarkWave Network</span>
          </div>
          <div className="dw-info-item">
            <span className="dw-info-icon">🔐</span>
            <span className="dw-info-text">Hallmark system protects your data with cryptographic signatures</span>
          </div>
          <div className="dw-info-item">
            <span className="dw-info-icon">⛓️</span>
            <span className="dw-info-text">All transactions are cryptographically stamped and immutable</span>
          </div>
          <div className="dw-info-item">
            <span className="dw-info-icon">🌊</span>
            <span className="dw-info-text">Part of the DarkWave ecosystem</span>
          </div>
        </div>

        <button className="darkwave-scan-btn" onClick={handleQRClick}>
          View on DarkWaveScan
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>

      <style>{`
        .darkwave-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow: hidden;
        }

        .darkwave-modal-container {
          width: 100%;
          max-width: 380px;
          max-height: 85vh;
          overflow-y: auto;
          background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
          border: 1px solid rgba(79, 195, 247, 0.3);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          box-shadow: 0 0 40px rgba(153, 69, 255, 0.2), 0 0 60px rgba(79, 195, 247, 0.1);
        }

        .darkwave-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          color: #fff;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .darkwave-modal-close:hover {
          background: rgba(255, 68, 68, 0.3);
          border-color: #ff4444;
          color: #ff4444;
        }

        .darkwave-modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .darkwave-badge {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #9945FF, #4FC3F7);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          box-shadow: 0 0 20px rgba(79, 195, 247, 0.4);
        }

        .darkwave-wave-large {
          font-size: 28px;
        }

        .darkwave-modal-title {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #9945FF, #4FC3F7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .darkwave-hallmark-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(79, 195, 247, 0.3);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .dw-hallmark-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }

        .dw-hallmark-value {
          font-size: 22px;
          font-weight: 800;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
          background: linear-gradient(135deg, #9945FF, #4FC3F7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 2px;
        }

        .darkwave-qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
          cursor: pointer;
        }

        .dw-qr-wrapper {
          background: #1a1a1a;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(79, 195, 247, 0.3);
          transition: all 0.3s ease;
        }

        .dw-qr-wrapper:hover {
          border-color: #4FC3F7;
          box-shadow: 0 0 20px rgba(79, 195, 247, 0.3);
        }

        .dw-qr-hint {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 8px;
        }

        .darkwave-info-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .dw-info-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .dw-info-icon {
          flex-shrink: 0;
          width: 20px;
          text-align: center;
        }

        .dw-info-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }

        .darkwave-scan-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: linear-gradient(135deg, #9945FF, #4FC3F7);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .darkwave-scan-btn:hover {
          box-shadow: 0 0 20px rgba(153, 69, 255, 0.5), 0 0 30px rgba(79, 195, 247, 0.3);
          transform: translateY(-2px);
        }

        .darkwave-scan-btn:active {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .darkwave-modal-container {
            padding: 20px;
          }

          .darkwave-modal-title {
            font-size: 18px;
          }

          .dw-hallmark-value {
            font-size: 18px;
            letter-spacing: 1px;
          }

          .dw-info-text {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  )
}
