import { useState, useEffect } from 'react'

const agentImages = [
  '/agents/marcus_pixar-style_friendly_agent.png',
  '/agents/aria_pixar-style_friendly_agent.png',
  '/agents/devon_pixar-style_friendly_agent.png',
  '/agents/claire_pixar-style_friendly_agent.png',
]

const greetings = [
  "Hi! I'm here to help you navigate the markets. Just ask anytime!",
  "Welcome back! Ready to find your next trade? I'm always here.",
  "Hey there! Need market insights? I've got you covered.",
  "Hello! Your AI assistant is standing by whenever you need me.",
]

export default function FooterAgent() {
  const [isGreeting, setIsGreeting] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [agentImage] = useState(() => agentImages[Math.floor(Math.random() * agentImages.length)])
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)])
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const hasSeenGreeting = sessionStorage.getItem('agent_greeted')
    if (hasSeenGreeting) {
      setIsGreeting(false)
      return
    }

    const timer = setTimeout(() => {
      setIsGreeting(false)
      sessionStorage.setItem('agent_greeted', 'true')
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleAgentClick = () => {
    if (!isGreeting) {
      setIsGreeting(true)
      setTimeout(() => setIsGreeting(false), 5000)
    }
  }

  return (
    <div 
      className="footer-agent-container"
      style={{
        position: 'fixed',
        bottom: 0,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      <div 
        className={`agent-speech-bubble ${isGreeting ? 'visible' : 'hidden'}`}
        style={{
          background: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: 16,
          padding: '14px 18px',
          marginBottom: 10,
          maxWidth: 280,
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.2)',
          opacity: isGreeting ? 1 : 0,
          transform: isGreeting ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'auto',
        }}
      >
        <div style={{
          fontSize: 13,
          color: '#fff',
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          {greeting}
        </div>
        <div style={{
          position: 'absolute',
          bottom: -8,
          right: 40,
          width: 16,
          height: 16,
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderTop: 'none',
          borderLeft: 'none',
          transform: 'rotate(45deg)',
        }} />
      </div>

      <div 
        onClick={handleAgentClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: isGreeting ? 120 : 70,
          height: isGreeting ? 140 : 80,
          cursor: 'pointer',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isHovered && !isGreeting ? 'scale(1.1) translateY(-5px)' : 'translateY(0)',
          pointerEvents: 'auto',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: isGreeting ? 60 : 40,
          height: 8,
          background: 'radial-gradient(ellipse, rgba(0,212,255,0.4) 0%, transparent 70%)',
          filter: 'blur(4px)',
          transition: 'all 0.5s ease',
        }} />
        
        <img 
          src={agentImage}
          alt="AI Agent"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'bottom',
            filter: 'drop-shadow(0 0 15px rgba(0, 212, 255, 0.3))',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      </div>

      <style>{`
        @keyframes agent-wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        
        @keyframes agent-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .footer-agent-container img {
          animation: ${isGreeting ? 'agent-bounce 1s ease-in-out infinite' : 'none'};
        }
        
        @media (max-width: 640px) {
          .footer-agent-container {
            right: 10px !important;
          }
          .agent-speech-bubble {
            max-width: 220px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  )
}
