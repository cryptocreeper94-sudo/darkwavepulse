import { useGlossary } from '../../context/GlossaryContext'
import { PIXAR_AGENT_PRIMARIES } from '../../data/agents'

export default function GlossaryPopup() {
  const { activeTerm, position, sassMode, hideDefinition, toggleSassMode } = useGlossary()
  
  if (!activeTerm) return null
  
  const definition = sassMode ? activeTerm.smartass : activeTerm.plain
  const agent = PIXAR_AGENT_PRIMARIES.find(a => a.id === 2) || PIXAR_AGENT_PRIMARIES[1]
  
  const categoryColors = {
    'Crypto': '#00D4FF',
    'Finance': '#39FF14',
    'DeFi': '#9D4EDD',
    'Technical Analysis': '#FFD700',
    'Crypto Slang': '#FF006E',
    'Regulation': '#FF6B35'
  }
  
  const categoryColor = categoryColors[activeTerm.category] || '#00D4FF'

  return (
    <>
      <div 
        className="glossary-popup-overlay"
        onClick={(e) => { e.stopPropagation(); hideDefinition() }}
      />
      <div 
        className="glossary-popup"
        style={{
          left: Math.min(position.x, window.innerWidth - 320),
          top: position.y
        }}
      >
        <button 
          className="glossary-close-btn"
          onClick={(e) => { e.stopPropagation(); hideDefinition() }}
        >
          ×
        </button>
        
        <div className="glossary-header">
          <span className="glossary-term">{activeTerm.term}</span>
          <span 
            className="glossary-category"
            style={{ color: categoryColor }}
          >
            {activeTerm.category}
          </span>
        </div>
        
        <div className="glossary-content">
          <div className="glossary-agent-avatar">
            <img 
              src={agent.image} 
              alt={agent.name}
              onError={(e) => { e.target.src = '/agents/pixar/aria.png' }}
            />
          </div>
          <div className="glossary-definition">
            {definition}
          </div>
        </div>
        
        <div className="glossary-actions">
          <button
            onClick={(e) => { e.stopPropagation(); toggleSassMode() }}
            className="glossary-sass-btn"
            style={{
              background: sassMode ? 'rgba(255, 0, 110, 0.2)' : 'rgba(0, 212, 255, 0.2)',
              borderColor: sassMode ? 'rgba(255, 0, 110, 0.4)' : 'rgba(0, 212, 255, 0.4)',
              color: sassMode ? '#FF006E' : '#00D4FF'
            }}
          >
            <span>{sassMode ? '😾' : '📚'}</span>
            <span>{sassMode ? 'Sass Mode' : 'Plain'}</span>
          </button>
          <div className="glossary-hint">Tap to switch</div>
        </div>
      </div>

      <style>{`
        .glossary-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: transparent;
        }

        .glossary-popup {
          position: fixed;
          z-index: 9999;
          background: #1a1a1a;
          border: 2px solid #00d4ff;
          border-radius: 12px;
          padding: 14px 16px;
          max-width: 300px;
          min-width: 240px;
          box-shadow: 0 4px 24px rgba(0, 212, 255, 0.25);
          animation: popupFadeIn 0.2s ease-out;
        }

        @keyframes popupFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .glossary-close-btn {
          position: absolute;
          top: 6px;
          right: 8px;
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

        .glossary-close-btn:hover {
          color: #ff4466;
        }

        .glossary-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          padding-right: 24px;
        }

        .glossary-term {
          font-size: 15px;
          font-weight: 700;
          color: #00d4ff;
        }

        .glossary-category {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .glossary-content {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .glossary-agent-avatar {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #00d4ff;
          background: #0a0a0a;
        }

        .glossary-agent-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .glossary-definition {
          font-size: 13px;
          color: #ccc;
          line-height: 1.5;
          flex: 1;
        }

        .glossary-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .glossary-sass-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: 1px solid;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .glossary-hint {
          font-size: 10px;
          color: #666;
        }

        @media (max-width: 480px) {
          .glossary-popup {
            left: 10px !important;
            right: 10px;
            max-width: calc(100vw - 20px);
          }
        }
      `}</style>
    </>
  )
}
