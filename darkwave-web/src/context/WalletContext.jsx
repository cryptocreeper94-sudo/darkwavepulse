import { useMemo, createContext, useContext, useState, useEffect } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

const SOLANA_MAINNET_RPC = clusterApiUrl('mainnet-beta')

const WalletStateContext = createContext(null)

function WalletStateProvider({ children }) {
  const { publicKey, connected, connecting, disconnecting, wallet } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetchBalance = async () => {
      if (!publicKey || !connected) {
        setBalance(null)
        return
      }

      setBalanceLoading(true)
      try {
        const bal = await connection.getBalance(publicKey)
        if (mounted) {
          setBalance(bal / LAMPORTS_PER_SOL)
        }
      } catch (err) {
        console.error('Failed to fetch balance:', err)
        if (mounted) setBalance(null)
      } finally {
        if (mounted) setBalanceLoading(false)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [publicKey, connected, connection])

  const value = useMemo(() => ({
    publicKey,
    address: publicKey?.toBase58() || null,
    shortAddress: publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : null,
    connected,
    connecting,
    disconnecting,
    wallet,
    walletName: wallet?.adapter?.name || null,
    balance,
    balanceLoading,
    connection,
  }), [publicKey, connected, connecting, disconnecting, wallet, balance, balanceLoading, connection])

  return (
    <WalletStateContext.Provider value={value}>
      {children}
    </WalletStateContext.Provider>
  )
}

export function WalletProvider({ children }) {
  const endpoint = useMemo(() => SOLANA_MAINNET_RPC, [])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletStateProvider>
            {children}
          </WalletStateProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}

export function useWalletState() {
  const context = useContext(WalletStateContext)
  if (!context) {
    throw new Error('useWalletState must be used within a WalletProvider')
  }
  return context
}

export { WalletMultiButton }
