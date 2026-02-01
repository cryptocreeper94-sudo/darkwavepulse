import { useState, useEffect } from 'react'
import './AlertsTab.css'

const ALERT_TYPES = [
  { id: 'price_above', label: 'Price Above', icon: '📈' },
  { id: 'price_below', label: 'Price Below', icon: '📉' },
  { id: 'percent_change', label: 'Percent Change', icon: '📊' },
  { id: 'volume_spike', label: 'Volume Spike', icon: '🔊' }
]

export default function AlertsTab({ userId }) {
  const [priceAlerts, setPriceAlerts] = useState([])
  const [whaleAlerts, setWhaleAlerts] = useState([])
  const [smartMoney, setSmartMoney] = useState([])
  const [whaleTxs, setWhaleTxs] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('price')
  const [showNewAlert, setShowNewAlert] = useState(false)
  const [newAlert, setNewAlert] = useState({
    tokenSymbol: '',
    alertType: 'price_above',
    targetPrice: '',
    note: ''
  })

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    if (!userId) { setLoading(false); return }
    
    try {
      const [priceRes, whaleRes, smartRes, txRes, notifRes] = await Promise.all([
        fetch(`/api/alerts/price?userId=${userId}`).catch(() => null),
        fetch(`/api/alerts/whale?userId=${userId}`).catch(() => null),
        fetch(`/api/alerts/smart-money?chain=solana&limit=20`).catch(() => null),
        fetch(`/api/alerts/whale-transactions?chain=solana&limit=20`).catch(() => null),
        fetch(`/api/alerts/notifications?userId=${userId}&limit=20`).catch(() => null)
      ])

      if (priceRes?.ok) setPriceAlerts((await priceRes.json()).alerts || [])
      if (whaleRes?.ok) setWhaleAlerts((await whaleRes.json()).alerts || [])
      if (smartRes?.ok) setSmartMoney((await smartRes.json()).wallets || [])
      if (txRes?.ok) setWhaleTxs((await txRes.json()).transactions || [])
      if (notifRes?.ok) setNotifications((await notifRes.json()).notifications || [])
    } catch (err) {
      console.error('Alerts fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async () => {
    if (!userId || !newAlert.tokenSymbol) return
    
    try {
      const res = await fetch('/api/alerts/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tokenSymbol: newAlert.tokenSymbol.toUpperCase(),
          alertType: newAlert.alertType,
          condition: newAlert.alertType.includes('above') ? 'gt' : 'lt',
          targetPrice: newAlert.targetPrice,
          note: newAlert.note
        })
      })
      
      if (res.ok) {
        setShowNewAlert(false)
        setNewAlert({ tokenSymbol: '', alertType: 'price_above', targetPrice: '', note: '' })
        fetchData()
      }
    } catch (err) {
      console.error('Create alert error:', err)
    }
  }

  const handleDeleteAlert = async (alertId) => {
    try {
      await fetch(`/api/alerts/price/${alertId}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      console.error('Delete alert error:', err)
    }
  }

  if (loading) {
    return (
      <div className="alerts-tab">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" />
          <p style={{ color: '#888', marginTop: 16 }}>Loading alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="alerts-tab">
      <div className="alerts-header">
        <div>
          <h2 className="alerts-title">Alerts Center</h2>
          <p className="alerts-subtitle">Monitor prices, whales, and smart money</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewAlert(true)}>
          + New Alert
        </button>
      </div>

      <div className="alerts-nav">
        {['price', 'whale', 'smart', 'notifications'].map(section => (
          <button
            key={section}
            className={`alerts-nav-btn ${activeSection === section ? 'active' : ''}`}
            onClick={() => setActiveSection(section)}
          >
            {section === 'price' && '🔔 Price Alerts'}
            {section === 'whale' && '🐋 Whale Tracking'}
            {section === 'smart' && '🧠 Smart Money'}
            {section === 'notifications' && '📬 History'}
          </button>
        ))}
      </div>

      {activeSection === 'price' && (
        <div className="alerts-section">
          <div className="section-header">
            <h3>Price Alerts</h3>
            <span className="badge">{priceAlerts.length} active</span>
          </div>
          
          {priceAlerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <p>No price alerts set</p>
              <button className="btn btn-primary" onClick={() => setShowNewAlert(true)}>
                Create Your First Alert
              </button>
            </div>
          ) : (
            <div className="alerts-list">
              {priceAlerts.map(alert => (
                <div key={alert.id} className={`alert-card ${alert.isTriggered ? 'triggered' : ''}`}>
                  <div className="alert-icon">
                    {ALERT_TYPES.find(t => t.id === alert.alertType)?.icon || '🔔'}
                  </div>
                  <div className="alert-info">
                    <div className="alert-token">{alert.tokenSymbol}</div>
                    <div className="alert-condition">
                      {alert.alertType?.replace('_', ' ')} ${alert.targetPrice}
                    </div>
                    {alert.note && <div className="alert-note">{alert.note}</div>}
                  </div>
                  <div className="alert-status">
                    {alert.isTriggered ? (
                      <span className="status-triggered">Triggered</span>
                    ) : (
                      <span className="status-active">Active</span>
                    )}
                  </div>
                  <button className="alert-delete" onClick={() => handleDeleteAlert(alert.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'whale' && (
        <div className="alerts-section">
          <div className="section-header">
            <h3>Recent Whale Transactions</h3>
          </div>
          
          {whaleTxs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🐋</div>
              <p>No whale transactions detected yet</p>
            </div>
          ) : (
            <div className="whale-txs">
              {whaleTxs.map((tx, i) => (
                <div key={tx.id || i} className="whale-tx">
                  <div className={`tx-type ${tx.txType?.toLowerCase()}`}>{tx.txType}</div>
                  <div className="tx-info">
                    <div className="tx-token">{tx.tokenSymbol || 'Unknown'}</div>
                    <div className="tx-address">
                      {tx.whaleAddress?.slice(0, 8)}...{tx.whaleAddress?.slice(-6)}
                    </div>
                  </div>
                  <div className="tx-value">${parseFloat(tx.valueUsd || 0).toLocaleString()}</div>
                  <div className="tx-time">
                    {tx.txTimestamp ? new Date(tx.txTimestamp).toLocaleTimeString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'smart' && (
        <div className="alerts-section">
          <div className="section-header">
            <h3>Smart Money Wallets</h3>
            <span className="badge">{smartMoney.length} tracked</span>
          </div>
          
          {smartMoney.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧠</div>
              <p>No smart money wallets tracked yet</p>
            </div>
          ) : (
            <div className="smart-money-list">
              {smartMoney.map((wallet, i) => (
                <div key={wallet.id || i} className="smart-wallet">
                  <div className="wallet-label">{wallet.label || 'Whale'}</div>
                  <div className="wallet-address">
                    {wallet.address?.slice(0, 10)}...{wallet.address?.slice(-8)}
                  </div>
                  <div className="wallet-stats">
                    <span className="stat">
                      <span className="stat-label">Win Rate</span>
                      <span className="stat-value positive">{wallet.winRate || 0}%</span>
                    </span>
                    <span className="stat">
                      <span className="stat-label">P&L</span>
                      <span className={`stat-value ${parseFloat(wallet.totalPnlUsd || 0) >= 0 ? 'positive' : 'negative'}`}>
                        ${parseFloat(wallet.totalPnlUsd || 0).toLocaleString()}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'notifications' && (
        <div className="alerts-section">
          <div className="section-header">
            <h3>Notification History</h3>
          </div>
          
          {notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📬</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif, i) => (
                <div key={notif.id || i} className="notification">
                  <div className="notif-type">{notif.alertType}</div>
                  <div className="notif-message">{notif.message}</div>
                  <div className="notif-time">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showNewAlert && (
        <div className="modal-overlay" onClick={() => setShowNewAlert(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Create Price Alert</h3>
            
            <div className="form-field">
              <label>Token Symbol</label>
              <input
                type="text"
                placeholder="e.g., BTC, ETH, SOL"
                value={newAlert.tokenSymbol}
                onChange={e => setNewAlert({ ...newAlert, tokenSymbol: e.target.value })}
              />
            </div>
            
            <div className="form-field">
              <label>Alert Type</label>
              <select
                value={newAlert.alertType}
                onChange={e => setNewAlert({ ...newAlert, alertType: e.target.value })}
              >
                {ALERT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-field">
              <label>Target Price (USD)</label>
              <input
                type="number"
                placeholder="e.g., 50000"
                value={newAlert.targetPrice}
                onChange={e => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
              />
            </div>
            
            <div className="form-field">
              <label>Note (Optional)</label>
              <input
                type="text"
                placeholder="Reminder note..."
                value={newAlert.note}
                onChange={e => setNewAlert({ ...newAlert, note: e.target.value })}
              />
            </div>
            
            <div className="modal-buttons">
              <button className="btn btn-secondary" onClick={() => setShowNewAlert(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateAlert}>Create Alert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
