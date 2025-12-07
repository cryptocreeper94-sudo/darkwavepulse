import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getGlossaryTerm } from '../data/glossary'

const SASS_MODE_KEY = 'pulse-sass-mode'

const GlossaryContext = createContext(null)

export function GlossaryProvider({ children }) {
  const [activeTerm, setActiveTerm] = useState(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [sassMode, setSassMode] = useState(() => {
    return localStorage.getItem(SASS_MODE_KEY) !== 'false'
  })
  const [termListeners, setTermListeners] = useState([])
  
  const showDefinition = useCallback((term, event) => {
    const termData = getGlossaryTerm(term)
    if (!termData) return
    
    let x = 0, y = 0
    if (event) {
      const rect = event.target.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.bottom + 8
      
      if (x > window.innerWidth - 180) x = window.innerWidth - 180
      if (x < 20) x = 20
      if (y > window.innerHeight - 200) y = rect.top - 8
    }
    
    setPosition({ x, y })
    setActiveTerm(termData)
  }, [])
  
  const hideDefinition = useCallback(() => {
    setActiveTerm(null)
  }, [])
  
  const toggleSassMode = useCallback(() => {
    setSassMode(prev => {
      const newValue = !prev
      localStorage.setItem(SASS_MODE_KEY, String(newValue))
      window.dispatchEvent(new CustomEvent('pulse-sass-mode-changed', { detail: newValue }))
      return newValue
    })
  }, [])
  
  const onTermShow = useCallback((callback) => {
    setTermListeners(prev => [...prev, callback])
    return () => {
      setTermListeners(prev => prev.filter(cb => cb !== callback))
    }
  }, [])
  
  useEffect(() => {
    if (activeTerm) {
      termListeners.forEach(cb => cb(activeTerm))
    }
  }, [activeTerm, termListeners])
  
  return (
    <GlossaryContext.Provider value={{
      activeTerm,
      position,
      sassMode,
      showDefinition,
      hideDefinition,
      toggleSassMode,
      onTermShow
    }}>
      {children}
    </GlossaryContext.Provider>
  )
}

export function useGlossary() {
  const context = useContext(GlossaryContext)
  if (!context) {
    throw new Error('useGlossary must be used within a GlossaryProvider')
  }
  return context
}
