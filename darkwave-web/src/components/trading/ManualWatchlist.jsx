import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import InfoTooltip, { TRADING_DEFINITIONS } from '../ui/InfoTooltip'

const STORAGE_KEY = 'darkwave_manual_watchlist'
const STATUS = {
  EMPTY: 'empty',
  WATCHING: 'watching',
  READY_TO_EXECUTE: 'ready_to_execute',
  FILLED_ENTRY: 'filled_entry',
  READY_TO_EXIT: 'ready_to_exit',
  READY_TO_STOP: 'ready_to_stop',
  FILLED_EXIT: 'filled_exit',
  STOPPED_OUT: 'stopped_out',
  PAUSED: 'paused',
}

function mapBackendStatusToFrontend(backendStatus) {
  const statusMap = {
    'PENDING': STATUS.WATCHING,
    'WATCHING': STATUS.WATCHING,
    'READY_TO_EXECUTE': STATUS.READY_TO_EXECUTE,
    'FILLED_ENTRY': STATUS.FILLED_ENTRY,
    'READY_TO_EXIT': STATUS.READY_TO_EXIT,
    'READY_TO_STOP': STATUS.READY_TO_STOP,
    'FILLED_EXIT': STATUS.FILLED_EXIT,
    'STOPPED_OUT': STATUS.STOPPED_OUT,
    'CANCELLED': STATUS.EMPTY,
  }
  return statusMap[backendStatus] || STATUS.EMPTY
}

const defaultSlot = {
  id: null,
  address: '',
  tokenInfo: null,
  entryPrice: '',
  exitPrice: '',
  stopLoss: '',
  buyAmount: '0.1',
  isActive: true,
  status: STATUS.EMPTY,
  currentPrice: null,
  lastUpdated: null,
}

function PriceIndicator({ currentPrice, entryPrice, exitPrice, stopLoss }) {
  if (!currentPrice || !entryPrice) return null

  const current = parseFloat(currentPrice)
  const entry = parseFloat(entryPrice)
  const exit = exitPrice ? parseFloat(exitPrice) : null
  const stop = stopLoss ? parseFloat(stopLoss) : null

  let position = 'neutral'
  let color = '#888'

  if (exit && current >= exit) {
    position = 'above_exit'
    color = '#39FF14'
  } else if (current > entry) {
    position = 'above_entry'
    color = '#39FF14'
  } else if (stop && current <= stop) {
    position = 'below_stop'
    color = '#FF4444'
  } else if (current < entry) {
    position = 'below_entry'
    color = '#FF4444'
  } else {
    position = 'at_entry'
    color = '#00D4FF'
  }

  const pctFromEntry = entry > 0 ? ((current - entry) / entry) * 100 : 0

  return (
    <div className="watchlist-price-indicator">
      <div className="watchlist-price-bar">
        {stop && (
          <div 
            className="watchlist-price-marker stop" 
            title={`Stop: $${stop.toFixed(8)}`}
          />
        )}
        <div 
          className="watchlist-price-marker entry" 
          title={`Entry: $${entry.toFixed(8)}`}
        />
        {exit && (
          <div 
            className="watchlist-price-marker exit" 
            title={`Exit: $${exit.toFixed(8)}`}
          />
        )}
        <div 
          className="watchlist-price-current"
          style={{ borderColor: color, background: color + '33' }}
        />
      </div>
      <div className="watchlist-price-pct" style={{ color }}>
        {pctFromEntry >= 0 ? '+' : ''}{pctFromEntry.toFixed(2)}%
      </div>
    </div>
  )
}

const STATUS_TOOLTIPS = {
  [STATUS.EMPTY]: null,
  [STATUS.WATCHING]: TRADING_DEFINITIONS.statusWatching,
  [STATUS.READY_TO_EXECUTE]: TRADING_DEFINITIONS.statusReadyToBuy,
  [STATUS.FILLED_ENTRY]: TRADING_DEFINITIONS.statusPositionOpen,
  [STATUS.READY_TO_EXIT]: TRADING_DEFINITIONS.statusReadyToSell,
  [STATUS.READY_TO_STOP]: TRADING_DEFINITIONS.statusStopLossHit,
  [STATUS.FILLED_EXIT]: null,
  [STATUS.STOPPED_OUT]: null,
  [STATUS.PAUSED]: null,
}

function StatusBadge({ status }) {
  const statusConfig = {
    [STATUS.EMPTY]: { label: 'Empty', color: '#666' },
    [STATUS.WATCHING]: { label: 'Watching', color: '#00D4FF' },
    [STATUS.READY_TO_EXECUTE]: { label: '⚡ Ready to Buy', color: '#FFD700' },
    [STATUS.FILLED_ENTRY]: { label: 'Position Open', color: '#39FF14' },
    [STATUS.READY_TO_EXIT]: { label: '⚡ Ready to Sell', color: '#FFD700' },
    [STATUS.READY_TO_STOP]: { label: '⚡ Stop Loss Hit', color: '#FF6B00' },
    [STATUS.FILLED_EXIT]: { label: 'Sold', color: '#39FF14' },
    [STATUS.STOPPED_OUT]: { label: 'Stopped Out', color: '#FF4444' },
    [STATUS.PAUSED]: { label: 'Paused', color: '#888' },
  }

  const config = statusConfig[status] || statusConfig[STATUS.EMPTY]
  const tooltip = STATUS_TOOLTIPS[status]

  return (
    <span 
      className="watchlist-status-badge"
      style={{ 
        background: config.color + '20', 
        color: config.color,
        borderColor: config.color + '60',
      }}
    >
      {config.label}
      {tooltip && <InfoTooltip {...tooltip} position="right" />}
    </span>
  )
}

function WatchlistSlot({ slot, index, onUpdate, onClear, onToggle }) {
  const [addressInput, setAddressInput] = useState(slot.address || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTokenInfo = useCallback(async (address) => {
    if (!address || address.length < 32) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/sniper/analyze-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: address })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Token not found')
      }

      const data = await res.json()
      
      onUpdate(index, {
        address,
        tokenInfo: {
          name: data.token.name,
          symbol: data.token.symbol,
          logo: data.token.logo || null,
        },
        currentPrice: data.token.priceUsd,
        status: STATUS.WATCHING,
        lastUpdated: Date.now(),
      })
    } catch (err) {
      setError(err.message)
      onUpdate(index, {
        address,
        tokenInfo: null,
        currentPrice: null,
        status: STATUS.EMPTY,
      })
    } finally {
      setIsLoading(false)
    }
  }, [index, onUpdate])

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    if (addressInput.trim()) {
      fetchTokenInfo(addressInput.trim())
    }
  }

  const handleAddressChange = (e) => {
    setAddressInput(e.target.value)
  }

  const handleAddressBlur = () => {
    if (addressInput.trim() && addressInput !== slot.address) {
      fetchTokenInfo(addressInput.trim())
    }
  }

  const handleFieldChange = (field, value) => {
    const updates = { [field]: value }
    
    if (slot.tokenInfo && field === 'entryPrice' && value) {
      updates.status = STATUS.WATCHING
    }
    
    onUpdate(index, updates)
  }

  return (
    <div className={`section-box watchlist-slot ${slot.status !== STATUS.EMPTY ? 'active' : ''} ${!slot.isActive ? 'paused' : ''}`}>
      <div className="watchlist-slot-header">
        <div className="watchlist-slot-number">#{index + 1}</div>
        <StatusBadge status={slot.isActive ? slot.status : STATUS.PAUSED} />
        <div className="watchlist-slot-actions">
          <button 
            className={`watchlist-toggle-btn ${slot.isActive ? 'active' : ''}`}
            onClick={() => onToggle(index)}
            title={slot.isActive ? 'Pause' : 'Activate'}
          >
            {slot.isActive ? '⏸' : '▶'}
          </button>
          <button 
            className="watchlist-clear-btn"
            onClick={() => onClear(index)}
            title="Clear Slot"
          >
            ✕
          </button>
        </div>
      </div>

      <form onSubmit={handleAddressSubmit} className="watchlist-address-form">
        <div className="watchlist-address-label">
          <span>Token Address</span>
          <InfoTooltip {...TRADING_DEFINITIONS.tokenAddress} position="left" />
        </div>
        <input
          type="text"
          placeholder="Paste Solana token address..."
          value={addressInput}
          onChange={handleAddressChange}
          onBlur={handleAddressBlur}
          className="sniper-input watchlist-address-input"
          disabled={isLoading}
        />
        {isLoading && <span className="watchlist-loading">...</span>}
      </form>

      {error && (
        <div className="watchlist-error">{error}</div>
      )}

      {slot.tokenInfo && (
        <div className="watchlist-token-info">
          <div className="watchlist-token-left">
            <div className="watchlist-token-icon">
              {slot.tokenInfo.logo ? (
                <img src={slot.tokenInfo.logo} alt={slot.tokenInfo.symbol} />
              ) : (
                <span>{slot.tokenInfo.symbol?.slice(0, 2) || '??'}</span>
              )}
            </div>
            <div className="watchlist-token-details">
              <div className="watchlist-token-symbol">{slot.tokenInfo.symbol}</div>
              <div className="watchlist-token-name">{slot.tokenInfo.name}</div>
            </div>
          </div>
          <div className="watchlist-token-price">
            <span className="watchlist-price-label">
              Current
              <InfoTooltip {...TRADING_DEFINITIONS.currentPrice} position="right" />
            </span>
            <span className="watchlist-price-value">
              ${parseFloat(slot.currentPrice || 0).toFixed(8)}
            </span>
          </div>
        </div>
      )}

      <div className="watchlist-inputs-grid">
        <label className="watchlist-input-item">
          <span className="watchlist-input-label">
            Entry Price ($)
            <InfoTooltip {...TRADING_DEFINITIONS.entryPrice} position="left" />
          </span>
          <input
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            value={slot.entryPrice}
            onChange={(e) => handleFieldChange('entryPrice', e.target.value)}
            className="sniper-input"
          />
        </label>
        <label className="watchlist-input-item">
          <span className="watchlist-input-label">
            Take Profit ($)
            <InfoTooltip {...TRADING_DEFINITIONS.exitPrice} position="right" />
          </span>
          <input
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            value={slot.exitPrice}
            onChange={(e) => handleFieldChange('exitPrice', e.target.value)}
            className="sniper-input"
          />
        </label>
        <label className="watchlist-input-item">
          <span className="watchlist-input-label">
            Stop Loss ($)
            <InfoTooltip {...TRADING_DEFINITIONS.stopLoss} position="left" />
          </span>
          <input
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            value={slot.stopLoss}
            onChange={(e) => handleFieldChange('stopLoss', e.target.value)}
            className="sniper-input"
          />
        </label>
        <label className="watchlist-input-item">
          <span className="watchlist-input-label">
            Buy Amount (SOL)
            <InfoTooltip {...TRADING_DEFINITIONS.buyAmount} position="right" />
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.1"
            value={slot.buyAmount}
            onChange={(e) => handleFieldChange('buyAmount', e.target.value)}
            className="sniper-input"
          />
        </label>
      </div>

      {slot.tokenInfo && slot.entryPrice && (
        <PriceIndicator 
          currentPrice={slot.currentPrice}
          entryPrice={slot.entryPrice}
          exitPrice={slot.exitPrice}
          stopLoss={slot.stopLoss}
        />
      )}
    </div>
  )
}

export default function ManualWatchlist() {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58() || null
  const syncedOrderIds = useRef(new Map())
  
  const [slots, setSlots] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to load watchlist from localStorage:', e)
    }
    return Array(4).fill(null).map((_, i) => ({ ...defaultSlot, id: `slot-${i}` }))
  })
  
  const syncSlotToBackend = useCallback(async (slot, index) => {
    if (!walletAddress || !slot.address || !slot.entryPrice) return
    
    const orderId = syncedOrderIds.current.get(index)
    
    try {
      if (orderId && slot.status !== STATUS.EMPTY) {
        const protectedStatuses = [
          STATUS.READY_TO_EXECUTE, 
          STATUS.READY_TO_EXIT, 
          STATUS.READY_TO_STOP,
          STATUS.FILLED_ENTRY,
          STATUS.FILLED_EXIT,
          STATUS.STOPPED_OUT
        ]
        
        const updatePayload = {
          userId: walletAddress,
          entryPrice: slot.entryPrice,
          exitPrice: slot.exitPrice || null,
          stopLoss: slot.stopLoss || null,
          buyAmountSol: slot.buyAmount,
        }
        
        if (!slot.isActive) {
          updatePayload.status = 'CANCELLED'
        } else if (!protectedStatuses.includes(slot.status)) {
          updatePayload.status = slot.status === STATUS.WATCHING ? 'WATCHING' : 'PENDING'
        }
        
        await fetch(`/api/limit-orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        })
      } else if (slot.address && slot.entryPrice && slot.status !== STATUS.EMPTY) {
        const res = await fetch('/api/limit-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: walletAddress,
            tokenAddress: slot.address,
            tokenSymbol: slot.tokenInfo?.symbol || 'UNKNOWN',
            entryPrice: slot.entryPrice,
            exitPrice: slot.exitPrice || null,
            stopLoss: slot.stopLoss || null,
            buyAmountSol: slot.buyAmount,
            walletAddress
          })
        })
        if (res.ok) {
          const data = await res.json()
          if (data.order?.id) {
            syncedOrderIds.current.set(index, data.order.id)
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync slot to backend:', err)
    }
  }, [walletAddress])

  useEffect(() => {
    const loadOrdersFromBackend = async () => {
      if (!walletAddress) return
      
      try {
        const res = await fetch(`/api/limit-orders?userId=${walletAddress}`)
        if (res.ok) {
          const data = await res.json()
          if (data.orders && data.orders.length > 0) {
            const activeOrders = data.orders.filter(o => 
              !['CANCELLED', 'FILLED_EXIT', 'STOPPED_OUT'].includes(o.status)
            ).slice(0, 4)
            
            if (activeOrders.length > 0) {
              setSlots(prev => {
                const updated = [...prev]
                activeOrders.forEach((order, i) => {
                  if (i < 4) {
                    syncedOrderIds.current.set(i, order.id)
                    updated[i] = {
                      ...defaultSlot,
                      id: order.id,
                      address: order.tokenAddress,
                      tokenInfo: { symbol: order.tokenSymbol, name: order.tokenSymbol },
                      entryPrice: order.entryPrice,
                      exitPrice: order.exitPrice || '',
                      stopLoss: order.stopLoss || '',
                      buyAmount: order.buyAmountSol,
                      isActive: order.status !== 'CANCELLED',
                      status: mapBackendStatusToFrontend(order.status),
                      currentPrice: null,
                      lastUpdated: null,
                    }
                  }
                })
                return updated
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to load orders from backend:', err)
      }
    }
    
    loadOrdersFromBackend()
  }, [walletAddress])
  
  useEffect(() => {
    if (walletAddress) {
      slots.forEach((slot, index) => {
        if (slot.status === STATUS.WATCHING && slot.isActive) {
          syncSlotToBackend(slot, index)
        }
      })
    }
  }, [slots.map(s => `${s.address}-${s.entryPrice}-${s.exitPrice}-${s.stopLoss}-${s.isActive}`).join(','), walletAddress, syncSlotToBackend])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
    } catch (e) {
      console.error('Failed to save watchlist to localStorage:', e)
    }
  }, [slots])

  useEffect(() => {
    const refreshPrices = async () => {
      const activeSlots = slots.filter(s => s.address && s.tokenInfo && s.isActive)
      if (activeSlots.length === 0) return

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        if (!slot.address || !slot.tokenInfo || !slot.isActive) continue

        try {
          const res = await fetch(`/api/sniper/analyze-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenAddress: slot.address })
          })

          if (res.ok) {
            const data = await res.json()
            if (data.token?.priceUsd) {
              setSlots(prev => {
                const updated = [...prev]
                updated[i] = {
                  ...updated[i],
                  currentPrice: data.token.priceUsd,
                  lastUpdated: Date.now(),
                }

                const current = parseFloat(data.token.priceUsd)
                const exit = parseFloat(updated[i].exitPrice)
                const stop = parseFloat(updated[i].stopLoss)

                if (exit && current >= exit && updated[i].status === STATUS.WATCHING) {
                  updated[i].status = STATUS.FILLED_EXIT
                } else if (stop && current <= stop && updated[i].status === STATUS.WATCHING) {
                  updated[i].status = STATUS.STOPPED_OUT
                }

                return updated
              })
            }
          }
        } catch (err) {
          console.error('Price refresh error for slot', i, err)
        }
      }
    }

    refreshPrices()
    const interval = setInterval(refreshPrices, 30000)
    return () => clearInterval(interval)
  }, [slots.map(s => s.address + s.isActive).join(',')])

  const handleUpdate = useCallback((index, updates) => {
    setSlots(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...updates }
      return updated
    })
  }, [])

  const handleClear = useCallback(async (index) => {
    const orderId = syncedOrderIds.current.get(index)
    if (orderId) {
      try {
        await fetch(`/api/limit-orders/${orderId}`, { method: 'DELETE' })
        syncedOrderIds.current.delete(index)
      } catch (err) {
        console.error('Failed to cancel order:', err)
      }
    }
    setSlots(prev => {
      const updated = [...prev]
      updated[index] = { ...defaultSlot, id: `slot-${index}` }
      return updated
    })
  }, [])

  const handleToggle = useCallback((index) => {
    setSlots(prev => {
      const updated = [...prev]
      updated[index] = { 
        ...updated[index], 
        isActive: !updated[index].isActive 
      }
      return updated
    })
  }, [])

  const activeCount = slots.filter(s => s.status === STATUS.WATCHING && s.isActive).length

  return (
    <div className="section-box watchlist-container">
      <div className="sniper-section-header">
        <h3 className="sniper-section-title">
          Manual Token Watchlist
          <span className="watchlist-count">{activeCount}/4 Active</span>
        </h3>
      </div>
      <div className="watchlist-slots-grid">
        {slots.map((slot, index) => (
          <WatchlistSlot
            key={slot.id || index}
            slot={slot}
            index={index}
            onUpdate={handleUpdate}
            onClear={handleClear}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
