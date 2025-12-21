import { useState } from 'react'
import DarkWaveVerificationModal from '../modals/DarkWaveVerificationModal'

export default function DarkWaveVerificationBadge({ 
  hallmarkId = '000000000-01',
  walletAddress = null 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        className="darkwave-verification-badge"
        onClick={() => setIsModalOpen(true)}
        title="DarkWave Verification Badge"
      >
        <span className="darkwave-verification-wave">🌊</span>
        <span className="darkwave-verification-id">{hallmarkId}</span>
      </button>

      <DarkWaveVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hallmarkId={hallmarkId}
        walletAddress={walletAddress}
      />

      <style>{`
        .darkwave-verification-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          height: 32px;
          background: transparent;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
          margin-right: 8px;
        }

        .darkwave-verification-badge:hover {
          transform: scale(1.05);
        }

        .darkwave-verification-badge:active {
          transform: scale(0.98);
        }

        .darkwave-verification-wave {
          font-size: 14px;
          line-height: 1;
        }

        .darkwave-verification-id {
          font-size: 11px;
          font-weight: 700;
          background: linear-gradient(135deg, #9945FF, #4FC3F7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 0.5px;
        }

        @media (max-width: 480px) {
          .darkwave-verification-badge {
            padding: 5px;
            height: 28px;
            gap: 0;
            background: transparent;
            width: auto;
            justify-content: center;
          }

          .darkwave-verification-wave {
            font-size: 12px;
          }

          .darkwave-verification-id {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
