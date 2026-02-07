import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { initFirebase, signInWithGoogle, signInWithGithub, signOut, onAuthChange, handleRedirectResult } from '../lib/firebase'

const AuthContext = createContext(null)

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
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false)
  const [signUpPromptFeature, setSignUpPromptFeature] = useState('')

  useEffect(() => {
    if (isDevPreview()) {
      console.log('[Auth] Dev preview - admin access')
      setUser(DEV_USER)
      setUserConfig(DEV_CONFIG)
      setLoading(false)
      return
    }

    initFirebase()

    handleRedirectResult().catch(() => {})

    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        console.log('[Auth] Signed in:', firebaseUser.email)
        const authedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL
        }
        setUser(authedUser)
        setUserConfig({
          accessLevel: 'user',
          plan: 'free',
          subscriptionTier: 'free',
          hallmarkId: null
        })
        setShowSignUpPrompt(false)
        localStorage.setItem('dwp_user', JSON.stringify(authedUser))

        syncUserToBackend(authedUser)
      } else {
        console.log('[Auth] No user - guest browsing mode')
        setUser(GUEST_USER)
        setUserConfig(GUEST_CONFIG)
        localStorage.removeItem('dwp_user')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function syncUserToBackend(authedUser) {
    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: authedUser.uid,
          email: authedUser.email,
          displayName: authedUser.displayName,
          photoURL: authedUser.photoURL
        })
      })
    } catch (err) {
      console.warn('[Auth] Backend sync failed (non-fatal):', err.message)
    }
  }

  function upgradeUserConfig(newConfig) {
    setUserConfig(prev => ({ ...prev, ...newConfig }))
  }

  const isGuest = user?.uid === 'guest-user'

  const requireAuth = useCallback((featureName) => {
    if (isGuest) {
      setSignUpPromptFeature(featureName || 'this feature')
      setShowSignUpPrompt(true)
      return false
    }
    return true
  }, [isGuest])

  const dismissSignUpPrompt = useCallback(() => {
    setShowSignUpPrompt(false)
    setSignUpPromptFeature('')
  }, [])

  async function loginWithGoogle() {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loginWithGithub() {
    setError(null)
    setLoading(true)
    try {
      await signInWithGithub()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      await signOut()
    } catch (err) {
      console.error('[Auth] Logout error:', err)
    }
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
    loginWithGoogle,
    loginWithGithub,
    isAuthenticated: !!user && !isGuest,
    isGuest,
    requireAuth,
    showSignUpPrompt,
    signUpPromptFeature,
    dismissSignUpPrompt
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
