import { useEffect, useRef } from 'react'
import PIXAR_AGENTS, { PIXAR_AGENT_PRIMARIES, getRandomAgent } from '../../data/agents'

export default function AgentSpeechOverlay({ 
  isVisible, 
  onClose, 
  title,
  message,
  agentId = null,
  usePrimaryAgent = false,
  actions = null,
  position = 'bottom-right',
  autoClose = false,
  autoCloseDelay = 8000
}) {
  const overlayRef = useRef(null)
  
  const agent = usePrimaryAgent 
    ? (PIXAR_AGENT_PRIMARIES.find(a => a.id === agentId) || PIXAR_AGENT_PRIMARIES[0])
    : (agentId ? PIXAR_AGENTS.find(a => a.id === agentId) : getRandomAgent())

  useEffect(() => {
    if (!isVisible) return
    
    const handleClickOutside = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        onClose?.()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isVisible, onClose])

  useEffect(() => {
    if (isVisible && autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => onClose?.(), autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoClose, autoCloseDelay, onClose])

  if (!isVisible || !agent) return null

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-left': return { left: '40px', bottom: '80px' }
      case 'bottom-right': return { right: '40px', bottom: '80px' }
      case 'top-left': return { left: '40px', top: '100px' }
      case 'top-right': return { right: '40px', top: '100px' }
      case 'center': return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
      default: return { right: '40px', bottom: '80px' }
    }
  }

  const isLeft = position.includes('left')

  return (
    <>
      <div 
        ref={overlayRef}
        className={`agent-speech-overlay ${isLeft ? 'from-left' : 'from-right'}`}
        style={getPositionStyle()}
      >
        {isLeft ? (
          <>
            <div className="agent-character-overlay">
              <div className="agent-glow-overlay"></div>
              <img 
                src={agent.image} 
                alt={agent.name || 'Agent'}
                className="agent-image-overlay"
                onError={(e) => {
                  e.target.src = '/agents/pixar/marcus.png'
                }}
              />
              <div className="agent-name-tag-overlay">{agent.name || 'Agent'}</div>
            </div>
            <div className="speech-bubble-overlay tail-left">
              <button 
                className="close-btn-overlay" 
                onClick={(e) => { e.stopPropagation(); onClose?.() }}
              >
                ×
              </button>
              {title && <div className="bubble-title-overlay">{title}</div>}
              <div className="bubble-message-overlay">{message}</div>
              {actions && <div className="bubble-actions-overlay">{actions}</div>}
            </div>
          </>
        ) : (
          <>
            <div className="speech-bubble-overlay tail-right">
              <button 
                className="close-btn-overlay" 
                onClick={(e) => { e.stopPropagation(); onClose?.() }}
              >
                ×
              </button>
              {title && <div className="bubble-title-overlay">{title}</div>}
              <div className="bubble-message-overlay">{message}</div>
              {actions && <div className="bubble-actions-overlay">{actions}</div>}
            </div>
            <div className="agent-character-overlay">
              <div className="agent-glow-overlay"></div>
              <img 
                src={agent.image} 
                alt={agent.name || 'Agent'}
                className="agent-image-overlay"
                onError={(e) => {
                  e.target.src = '/agents/pixar/marcus.png'
                }}
              />
              <div className="agent-name-tag-overlay">{agent.name || 'Agent'}</div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .agent-speech-overlay {
          position: fixed;
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          gap: 16px;
          pointer-events: auto;
        }

        .agent-speech-overlay.from-right {
          animation: sweepInRight 0.5s ease-out forwards;
        }

        .agent-speech-overlay.from-left {
          animation: sweepInLeft 0.5s ease-out forwards;
        }

        @keyframes sweepInRight {
          0% { transform: translateX(150px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        @keyframes sweepInLeft {
          0% { transform: translateX(-150px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        .agent-character-overlay {
          position: relative;
          width: 160px;
          height: 260px;
          flex-shrink: 0;
        }

        .agent-glow-overlay {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 100px;
          background: radial-gradient(ellipse, rgba(0, 212, 255, 0.4) 0%, transparent 70%);
          filter: blur(20px);
          animation: glowPulseOverlay 2s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes glowPulseOverlay {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
        }

        .agent-image-overlay {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5));
        }

        .agent-name-tag-overlay {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #00d4ff, #0099ff);
          color: #000;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 12px;
          white-space: nowrap;
          z-index: 3;
        }

        .speech-bubble-overlay {
          position: relative;
          background: #1a1a1a;
          border: 2px solid #00d4ff;
          border-radius: 16px;
          padding: 16px 20px;
          max-width: 300px;
          min-width: 200px;
          box-shadow: 0 4px 30px rgba(0, 212, 255, 0.25);
          animation: bubblePopIn 0.4s ease-out 0.2s both;
        }

        @keyframes bubblePopIn {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 1; }
        }

        .speech-bubble-overlay::after {
          content: '';
          position: absolute;
          bottom: 30px;
          width: 0;
          height: 0;
          border: 12px solid transparent;
        }

        .speech-bubble-overlay.tail-right::after {
          right: -22px;
          border-left-color: #00d4ff;
        }

        .speech-bubble-overlay.tail-left::after {
          left: -22px;
          border-right-color: #00d4ff;
        }

        .close-btn-overlay {
          position: absolute;
          top: 8px;
          right: 10px;
          background: none;
          border: none;
          color: #666;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
          z-index: 10;
          transition: color 0.2s;
        }

        .close-btn-overlay:hover {
          color: #ff4466;
        }

        .bubble-title-overlay {
          font-size: 15px;
          font-weight: 700;
          color: #00d4ff;
          margin-bottom: 8px;
          padding-right: 24px;
        }

        .bubble-message-overlay {
          font-size: 13px;
          color: #ccc;
          line-height: 1.5;
        }

        .bubble-actions-overlay {
          margin-top: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        @media (max-width: 600px) {
          .agent-speech-overlay {
            flex-direction: column !important;
            align-items: center !important;
            left: 50% !important;
            right: auto !important;
            bottom: 20px !important;
            transform: translateX(-50%) !important;
          }

          .speech-bubble-overlay {
            max-width: 90vw;
            order: -1;
          }

          .speech-bubble-overlay::after {
            display: none;
          }

          .agent-character-overlay {
            width: 120px;
            height: 200px;
          }
        }
      `}</style>
    </>
  )
}
