import React from 'react'
import ReactDOM from 'react-dom/client'
import StrikeAgentApp from './StrikeAgentApp'
import './index.css'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED') {
      console.log('[StrikeAgent] New version activated, reloading...', event.data.version)
      window.location.reload()
    }
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-strikeagent.js')
      .then(registration => {
        console.log('[StrikeAgent] SW registered:', registration.scope)
        
        registration.update()
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[StrikeAgent] New version available, activating...')
                newWorker.postMessage('skipWaiting')
              }
            })
          }
        })
      })
      .catch(err => console.log('[StrikeAgent] SW registration failed:', err))
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StrikeAgentApp />
  </React.StrictMode>
)
