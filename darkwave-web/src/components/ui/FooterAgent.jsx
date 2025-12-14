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
  const [isExpanded, setIsExpanded] = useState(false)
  const [showInitialGreeting, setShowInitialGreeting] = useState(false)
  const [agentImage] = useState(() => agentImages[Math.floor(Math.random() * agentImages.length)])
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)])

  useEffect(() => {
    const hasSeenGreeting = sessionStorage.getItem('agent_greeted')
    if (!hasSeenGreeting) {
      setShowInitialGreeting(true)
      const timer = setTimeout(() => {
        setShowInitialGreeting(false)
        sessionStorage.setItem('agent_greeted', 'true')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClick = () => {
    setIsExpanded(!isExpanded)
  }

  const showBubble = showInitialGreeting || isExpanded

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 10,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {showBubble && (
        <div 
          style={{
            background: '#141414',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: 16,
            padding: '14px 18px',
            marginBottom: 10,
            maxWidth: 260,
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.2)',
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          <div style={{
            fontSize: 13,
            color: '#fff',
            lineHeight: 1.5,
          }}>
            {greeting}
          </div>
        </div>
      )}

      <div 
        onClick={handleClick}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
          border: '2px solid rgba(0, 212, 255, 0.4)',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.2)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.2)'
        }}
      >
        <img 
          src={agentImage}
          alt="AI Agent"
          style={{
            width: 44,
            height: 44,
            objectFit: 'cover',
            objectPosition: 'top',
            borderRadius: '50%',
          }}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.parentElement.innerHTML = '<span style="font-size: 24px">🤖</span>'
          }}
        />
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 640px) {
          .footer-agent-container {
            right: 10px !important;
            bottom: 70px !important;
          }
        }
      `}</style>
    </div>
  )
}
