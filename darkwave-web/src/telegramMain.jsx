import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TelegramApp from './TelegramApp.jsx'
import { WalletProvider } from './context/WalletContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WalletProvider>
      <TelegramApp />
    </WalletProvider>
  </StrictMode>,
)
