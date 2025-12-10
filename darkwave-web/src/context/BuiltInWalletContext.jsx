import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const BuiltInWalletContext = createContext(null)

const STORAGE_KEY = 'pulse_wallet_encrypted'

export function BuiltInWalletProvider({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [balances, setBalances] = useState({})
  const [totalUsd, setTotalUsd] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const hasWallet = !!localStorage.getItem(STORAGE_KEY)
  
  const unlock = useCallback(async (password) => {
    const encrypted = localStorage.getItem(STORAGE_KEY)
    if (!encrypted) throw new Error('No wallet found')
    
    setLoading(true)
    try {
      const res = await fetch('/api/wallet/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedMnemonic: encrypted, password }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Invalid password')
      
      const deriveRes = await fetch('/api/wallet/derive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonic: data.mnemonic }),
      })
      const deriveData = await deriveRes.json()
      if (!deriveData.success) throw new Error(deriveData.error)
      
      setWallet({ mnemonic: data.mnemonic, accounts: deriveData.accounts })
      setIsUnlocked(true)
      
      fetchBalances(deriveData.accounts)
      return true
    } finally {
      setLoading(false)
    }
  }, [])
  
  const lock = useCallback(() => {
    setWallet(null)
    setBalances({})
    setTotalUsd(0)
    setIsUnlocked(false)
  }, [])
  
  const fetchBalances = useCallback(async (accounts) => {
    if (!accounts?.length) return
    
    try {
      const res = await fetch('/api/wallet/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts }),
      })
      const data = await res.json()
      if (data.success) {
        setBalances(data.balances)
        setTotalUsd(data.totalUsd)
      }
    } catch (err) {
      console.error('Balance fetch error:', err)
    }
  }, [])
  
  const refreshBalances = useCallback(() => {
    if (wallet?.accounts) {
      fetchBalances(wallet.accounts)
    }
  }, [wallet, fetchBalances])
  
  const getSolanaAddress = useCallback(() => {
    return wallet?.accounts?.find(a => a.chain === 'solana')?.address || null
  }, [wallet])
  
  const getEvmAddress = useCallback(() => {
    return wallet?.accounts?.find(a => a.chain === 'ethereum')?.address || null
  }, [wallet])
  
  const getSolanaBalance = useCallback(() => {
    return balances.solana?.balance || 0
  }, [balances])
  
  const signAndSendSolana = useCallback(async (to, amount) => {
    if (!wallet?.mnemonic) throw new Error('Wallet not unlocked')
    
    const res = await fetch('/api/wallet/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chain: 'solana',
        mnemonic: wallet.mnemonic,
        to,
        amount,
      }),
    })
    const data = await res.json()
    
    if (data.success) {
      refreshBalances()
    }
    
    return data
  }, [wallet, refreshBalances])
  
  const value = {
    hasWallet,
    isUnlocked,
    loading,
    wallet,
    balances,
    totalUsd,
    unlock,
    lock,
    refreshBalances,
    getSolanaAddress,
    getEvmAddress,
    getSolanaBalance,
    signAndSendSolana,
    solanaAddress: getSolanaAddress(),
    solanaBalance: getSolanaBalance(),
  }
  
  return (
    <BuiltInWalletContext.Provider value={value}>
      {children}
    </BuiltInWalletContext.Provider>
  )
}

export function useBuiltInWallet() {
  const context = useContext(BuiltInWalletContext)
  if (!context) {
    throw new Error('useBuiltInWallet must be used within BuiltInWalletProvider')
  }
  return context
}

export default BuiltInWalletContext
