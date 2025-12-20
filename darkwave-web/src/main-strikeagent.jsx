import React from 'react'
import ReactDOM from 'react-dom/client'
import StrikeAgentApp from './StrikeAgentApp'
import './index.css'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister()
      console.log('[StrikeAgent] Unregistered old service worker:', registration.scope)
    })
  })
  
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name)
        console.log('[StrikeAgent] Deleted cache:', name)
      })
    })
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StrikeAgentApp />
  </React.StrictMode>
)
