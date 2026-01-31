import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Guest user - allows everyone to access the site freely
// Premium features (StrikeAgent, etc.) require subscription via Stripe
const GUEST_USER = {
  uid: 'guest-user',
  email: 'guest@darkwavepulse.com',
  displayName: 'Guest',
  photoURL: null
}

const GUEST_CONFIG = {
  accessLevel: 'guest',
  plan: 'free',
  subscriptionTier: 'free',
  hallmarkId: null
}

// Dev preview gets admin access for testing
const DEV_USER = {
  uid: 'dev-preview-user',
  email: 'dev@darkwavepulse.com',
  displayName: 'Dev Preview',
  photoURL: null
}

const DEV_CONFIG = {
  accessLevel: 'admin',
  plan: 'pro',
  subscriptionTier: 'complete_bundle',
  hallmarkId: 'DEV-PREVIEW'
}

const isDevPreview = () => {
  const hostname = window.location.hostname
  return hostname.includes('.replit.dev') || 
         hostname.includes('.kirk.replit.dev') ||
         hostname.includes('localhost') ||
         hostname === '127.0.0.1'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userConfig, setUserConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // BYPASS ALL AUTHENTICATION - Allow everyone in as guest
    // Premium features require Stripe subscription, not Firebase login
    
    if (isDevPreview()) {
      console.log('[Auth] Dev preview - admin access')
      setUser(DEV_USER)
      setUserConfig(DEV_CONFIG)
    } else {
      console.log('[Auth] Public access - guest mode (no login required)')
      setUser(GUEST_USER)
      setUserConfig(GUEST_CONFIG)
    }
    
    setLoading(false)
  }, [])

  // Upgrade user config when they subscribe via Stripe
  function upgradeUserConfig(newConfig) {
    setUserConfig(prev => ({ ...prev, ...newConfig }))
  }

  // No login required - subscription handled via Stripe checkout
  async function logout() {
    // Reset to guest mode
    setUser(GUEST_USER)
    setUserConfig(GUEST_CONFIG)
  }

  const value = {
    user,
    userConfig,
    setUserConfig,
    upgradeUserConfig,
    loading,
    error,
    logout,
    isAuthenticated: !!user  // Always true since we set guest user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
