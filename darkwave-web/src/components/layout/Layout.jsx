import { useState } from 'react'
import Header from './Header'
import HamburgerMenu from './HamburgerMenu'

export default function Layout({ children, activeTab, onTabChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }
  
  const handleClose = () => {
    setIsMenuOpen(false)
  }
  
  const handleAction = (actionId) => {
    switch (actionId) {
      case 'agent':
        console.log('Open agent builder')
        break
      case 'theme':
        console.log('Open theme selector')
        break
      case 'bug':
        console.log('Open bug report')
        break
      case 'disclaimer':
        console.log('Open disclaimer')
        break
      case 'logout':
        window.location.href = '/lockscreen.html'
        break
      default:
        break
    }
  }
  
  return (
    <div className="app-layout">
      <Header 
        onMenuToggle={handleMenuToggle}
        isMenuOpen={isMenuOpen}
      />
      
      <HamburgerMenu
        isOpen={isMenuOpen}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onClose={handleClose}
        onAction={handleAction}
      />
      
      <main className="app-content">
        {children}
      </main>
    </div>
  )
}
