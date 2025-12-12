import { useState, useCallback } from 'react'
import { useBuiltInWallet } from '../../context/BuiltInWalletContext'
import AgentSpeechOverlay from '../ui/AgentSpeechOverlay'

const THRESHOLD_PRESETS = [
  { label: '$1', value: 1 },
  { label: '$2', value: 2 },
  { label: '$5', value: 5 },
  { label: 'Custom', value: 'custom' }
]

export default function DustBuster() {
  const { solanaAddress, isUnlocked, signAndSendSolana } = useBuiltInWallet()
  
  const [threshold, setThreshold] = useState(2)
  const [selectedPreset, setSelectedPreset] = useState('$2')
  const [customThreshold, setCustomThreshold] = useState(5)
  const [burnMode, setBurnMode] = useState(true)
  
  const [scanResults, setScanResults] = useState([])
  const [selectedAccounts, setSelectedAccounts] = useState(new Set())
  const [preview, setPreview] = useState(null)
  
  const [scanning, setScanning] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [showComplete, setShowComplete] = useState(false)
  const [completionData, setCompletionData] = useState(null)
  
  const FEE_PERCENT = 12.5

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset.label)
    if (preset.value !== 'custom') {
      setThreshold(preset.value)
    } else {
      setThreshold(customThreshold)
    }
  }

  const handleCustomSliderChange = (e) => {
    const value = parseFloat(e.target.value)
    setCustomThreshold(value)
    if (selectedPreset === 'Custom') {
      setThreshold(value)
    }
  }

  const scanWallet = useCallback(async () => {
    if (!solanaAddress) {
      setError('Please unlock your wallet first')
      return
    }
    
    setScanning(true)
    setError('')
    setScanResults([])
    setSelectedAccounts(new Set())
    setPreview(null)
    
    try {
      const res = await fetch(`/api/dust-buster/scan?wallet=${solanaAddress}`)
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to scan wallet')
      }
      
      setScanResults(data.accounts || [])
      const allIds = new Set((data.accounts || []).map(a => a.id))
      setSelectedAccounts(allIds)
      setSuccess(`Found ${data.accounts?.length || 0} token accounts`)
    } catch (err) {
      setError(err.message)
    } finally {
      setScanning(false)
    }
  }, [solanaAddress])

  const previewCleanup = useCallback(async () => {
    if (!solanaAddress || selectedAccounts.size === 0) {
      setError('No accounts selected')
      return
    }
    
    setPreviewing(true)
    setError('')
    
    try {
      const res = await fetch('/api/dust-buster/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: solanaAddress,
          threshold,
          burnMode,
          selectedAccounts: Array.from(selectedAccounts)
        })
      })
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to preview cleanup')
      }
      
      setPreview(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setPreviewing(false)
    }
  }, [solanaAddress, threshold, burnMode, selectedAccounts])

  const executeCleanup = useCallback(async (password) => {
    if (!preview) {
      setError('Please preview first')
      return
    }
    
    setExecuting(true)
    setError('')
    
    try {
      const res = await fetch('/api/dust-buster/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: solanaAddress,
          threshold,
          burnMode,
          selectedAccounts: Array.from(selectedAccounts)
        })
      })
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute cleanup')
      }
      
      setCompletionData({
        accountsClosed: preview.accountsToClose,
        tokensBurned: preview.tokensToBurn,
        solRecovered: preview.netSolRecovery,
        lifetimeTotal: data.lifetimeTotal || preview.netSolRecovery,
        txHash: data.txHash
      })
      setShowComplete(true)
      
      setScanResults([])
      setSelectedAccounts(new Set())
      setPreview(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setExecuting(false)
    }
  }, [solanaAddress, threshold, burnMode, selectedAccounts, preview])

  const toggleAccount = (accountId) => {
    setSelectedAccounts(prev => {
      const next = new Set(prev)
      if (next.has(accountId)) {
        next.delete(accountId)
      } else {
        next.add(accountId)
      }
      return next
    })
    setPreview(null)
  }

  const toggleAll = () => {
    if (selectedAccounts.size === scanResults.length) {
      setSelectedAccounts(new Set())
    } else {
      setSelectedAccounts(new Set(scanResults.map(a => a.id)))
    }
    setPreview(null)
  }

  const getAccountStatus = (account) => {
    if (account.balance === 0) return 'empty'
    if (account.valueUsd < threshold) return 'dust'
    return 'valuable'
  }

  const filteredResults = scanResults.filter(account => {
    const status = getAccountStatus(account)
    if (burnMode) return status === 'empty' || status === 'dust'
    return status === 'empty'
  })

  if (!isUnlocked) {
    return (
      <div className="dust-buster-container">
        <div className="dust-buster-locked">
          <div className="locked-icon">🔒</div>
          <h3>Wallet Locked</h3>
          <p>Please unlock your wallet to use Dust Buster</p>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  return (
    <div className="dust-buster-container">
      <div className="dust-buster-header">
        <div className="dust-header-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2">
            <path d="M3 12h4l3-9 4 18 3-9h4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="dust-header-text">
          <h2>Dust Buster</h2>
          <p>Clean up worthless token accounts and recover locked SOL rent</p>
        </div>
      </div>

      <div className="dust-controls">
        <div className="control-section">
          <label className="control-label">Value Threshold</label>
          <div className="threshold-pills">
            {THRESHOLD_PRESETS.map(preset => (
              <button
                key={preset.label}
                className={`threshold-pill ${selectedPreset === preset.label ? 'active' : ''}`}
                onClick={() => handlePresetChange(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          {selectedPreset === 'Custom' && (
            <div className="custom-slider-wrapper">
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={customThreshold}
                onChange={handleCustomSliderChange}
                className="custom-slider"
              />
              <span className="slider-value">${customThreshold.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="control-section">
          <label className="control-label">Cleanup Mode</label>
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${burnMode ? 'active' : ''}`}
              onClick={() => setBurnMode(true)}
            >
              <span className="mode-icon">🔥</span>
              Burn Dust Tokens
            </button>
            <button 
              className={`mode-btn ${!burnMode ? 'active' : ''}`}
              onClick={() => setBurnMode(false)}
            >
              <span className="mode-icon">🧹</span>
              Close Empty Only
            </button>
          </div>
          <span className="mode-hint">
            {burnMode 
              ? 'Burns tokens worth less than threshold and closes accounts' 
              : 'Only closes accounts with zero balance'}
          </span>
        </div>
      </div>

      <div className="dust-actions-row">
        <button 
          className="dust-action-btn scan"
          onClick={scanWallet}
          disabled={scanning}
        >
          {scanning ? (
            <>
              <span className="btn-spinner"></span>
              Scanning...
            </>
          ) : (
            <>
              <span className="btn-icon">🔍</span>
              Scan Wallet
            </>
          )}
        </button>
      </div>

      {error && <div className="dust-error">{error}</div>}
      {success && !error && <div className="dust-success">{success}</div>}

      {filteredResults.length > 0 && (
        <div className="dust-results">
          <div className="results-header">
            <h3>Token Accounts ({filteredResults.length})</h3>
            <button className="select-all-btn" onClick={toggleAll}>
              {selectedAccounts.size === filteredResults.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="results-table">
            <div className="table-header">
              <span className="col-check"></span>
              <span className="col-token">Token</span>
              <span className="col-balance">Balance</span>
              <span className="col-value">Value (USD)</span>
              <span className="col-rent">Rent Locked</span>
              <span className="col-status">Status</span>
            </div>
            
            <div className="table-body">
              {filteredResults.map(account => {
                const status = getAccountStatus(account)
                return (
                  <div 
                    key={account.id} 
                    className={`table-row ${status} ${selectedAccounts.has(account.id) ? 'selected' : ''}`}
                    onClick={() => toggleAccount(account.id)}
                  >
                    <span className="col-check">
                      <input 
                        type="checkbox" 
                        checked={selectedAccounts.has(account.id)}
                        onChange={() => toggleAccount(account.id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </span>
                    <span className="col-token">
                      <span className="token-symbol">{account.symbol || 'Unknown'}</span>
                      <span className="token-mint">{account.mint?.slice(0, 6)}...{account.mint?.slice(-4)}</span>
                    </span>
                    <span className="col-balance">{account.balance?.toLocaleString() || '0'}</span>
                    <span className="col-value">${account.valueUsd?.toFixed(4) || '0.0000'}</span>
                    <span className="col-rent">{account.rentLamports ? `${(account.rentLamports / 1e9).toFixed(4)} SOL` : '~0.002 SOL'}</span>
                    <span className={`col-status status-${status}`}>
                      {status === 'empty' ? '✓ Empty' : status === 'dust' ? '⚠ Dust' : '$ Value'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {selectedAccounts.size > 0 && (
        <div className="dust-summary">
          <h3>Summary</h3>
          
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Accounts to Close</span>
              <span className="summary-value">{selectedAccounts.size}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Tokens to Burn</span>
              <span className="summary-value">
                {burnMode ? filteredResults.filter(a => selectedAccounts.has(a.id) && a.balance > 0).length : 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Est. SOL Recovery</span>
              <span className="summary-value highlight">
                {preview ? `~${preview.estimatedSolRecovery?.toFixed(4)} SOL` : `~${(selectedAccounts.size * 0.00203928).toFixed(4)} SOL`}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Fee ({FEE_PERCENT}%)</span>
              <span className="summary-value fee">
                {preview ? `-${preview.fee?.toFixed(4)} SOL` : `-${(selectedAccounts.size * 0.00203928 * FEE_PERCENT / 100).toFixed(4)} SOL`}
              </span>
            </div>
            <div className="summary-item net">
              <span className="summary-label">Net SOL You Receive</span>
              <span className="summary-value net-value">
                {preview ? `${preview.netSolRecovery?.toFixed(4)} SOL` : `~${(selectedAccounts.size * 0.00203928 * (1 - FEE_PERCENT / 100)).toFixed(4)} SOL`}
              </span>
            </div>
          </div>

          <div className="summary-actions">
            <button 
              className="dust-action-btn preview"
              onClick={previewCleanup}
              disabled={previewing || selectedAccounts.size === 0}
            >
              {previewing ? (
                <>
                  <span className="btn-spinner"></span>
                  Previewing...
                </>
              ) : (
                <>
                  <span className="btn-icon">👁️</span>
                  Preview
                </>
              )}
            </button>
            
            <button 
              className="dust-action-btn execute"
              onClick={() => executeCleanup()}
              disabled={executing || !preview}
            >
              {executing ? (
                <>
                  <span className="btn-spinner"></span>
                  Executing...
                </>
              ) : (
                <>
                  <span className="btn-icon">⚡</span>
                  Execute Cleanup
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showComplete && completionData && (
        <DustBusterComplete 
          data={completionData}
          onClose={() => setShowComplete(false)}
        />
      )}

      <style>{styles}</style>
    </div>
  )
}

function DustBusterComplete({ data, onClose }) {
  return (
    <div className="dust-complete-overlay">
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className="confetti-piece"
            style={{
              '--delay': `${Math.random() * 3}s`,
              '--x': `${Math.random() * 100}vw`,
              '--rotation': `${Math.random() * 360}deg`,
              '--color': ['#00D4FF', '#39FF14', '#FFD700', '#FF6B6B', '#9945FF'][Math.floor(Math.random() * 5)]
            }}
          />
        ))}
      </div>
      
      <AgentSpeechOverlay
        isVisible={true}
        onClose={onClose}
        title="Dust Busted!"
        position="center"
        message={
          <div className="complete-content">
            <div className="complete-stats">
              <div className="stat-item">
                <span className="stat-label">Accounts Closed</span>
                <span className="stat-value">{data.accountsClosed}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tokens Burned</span>
                <span className="stat-value">{data.tokensBurned}</span>
              </div>
              <div className="stat-item highlight">
                <span className="stat-label">SOL Recovered</span>
                <span className="stat-value">{data.solRecovered?.toFixed(4)} SOL</span>
              </div>
            </div>
            
            <div className="lifetime-stats">
              <span className="lifetime-label">Lifetime Recovered:</span>
              <span className="lifetime-value">{data.lifetimeTotal?.toFixed(4)} SOL</span>
            </div>
            
            {data.txHash && (
              <a 
                href={`https://solscan.io/tx/${data.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                View Transaction ↗
              </a>
            )}
          </div>
        }
        actions={
          <button className="complete-close-btn" onClick={onClose}>
            Close
          </button>
        }
      />
      
      <style>{completeStyles}</style>
    </div>
  )
}

const styles = `
  .dust-buster-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    background: #0f0f0f;
    border-radius: 16px;
    max-width: 800px;
    margin: 0 auto;
  }

  .dust-buster-locked {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .locked-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .dust-buster-locked h3 {
    font-size: 20px;
    color: #fff;
    margin: 0 0 8px;
  }

  .dust-buster-locked p {
    color: #666;
    font-size: 14px;
    margin: 0;
  }

  .dust-buster-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 20px;
    border-bottom: 1px solid #252525;
  }

  .dust-header-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a1a, #252525);
    border-radius: 14px;
    border: 1px solid #333;
  }

  .dust-header-text h2 {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 4px;
  }

  .dust-header-text p {
    font-size: 14px;
    color: #888;
    margin: 0;
  }

  .dust-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    background: #1a1a1a;
    border-radius: 12px;
    border: 1px solid #252525;
  }

  .control-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .control-label {
    font-size: 13px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .threshold-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .threshold-pill {
    padding: 10px 20px;
    background: #252525;
    border: 1px solid #333;
    border-radius: 20px;
    color: #888;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .threshold-pill:hover {
    border-color: #00D4FF;
    color: #00D4FF;
  }

  .threshold-pill.active {
    background: linear-gradient(135deg, #00D4FF, #0099FF);
    border-color: #00D4FF;
    color: #000;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }

  .custom-slider-wrapper {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
  }

  .custom-slider {
    flex: 1;
    height: 6px;
    background: #333;
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
  }

  .custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #00D4FF, #0099FF);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  }

  .slider-value {
    font-size: 16px;
    font-weight: 700;
    color: #00D4FF;
    min-width: 60px;
    text-align: right;
  }

  .mode-toggle {
    display: flex;
    gap: 12px;
  }

  .mode-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 16px;
    background: #252525;
    border: 1px solid #333;
    border-radius: 10px;
    color: #888;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-btn:hover {
    border-color: #00D4FF;
    color: #fff;
  }

  .mode-btn.active {
    background: #1a1a1a;
    border-color: #00D4FF;
    color: #00D4FF;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
  }

  .mode-icon {
    font-size: 18px;
  }

  .mode-hint {
    font-size: 12px;
    color: #555;
    font-style: italic;
  }

  .dust-actions-row {
    display: flex;
    gap: 12px;
  }

  .dust-action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 20px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .dust-action-btn.scan {
    background: linear-gradient(135deg, #00D4FF, #0099FF);
    color: #000;
    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
  }

  .dust-action-btn.preview {
    background: #252525;
    border: 1px solid #333;
    color: #fff;
  }

  .dust-action-btn.execute {
    background: linear-gradient(135deg, #39FF14, #00D4FF);
    color: #000;
    box-shadow: 0 4px 20px rgba(57, 255, 20, 0.3);
  }

  .dust-action-btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .dust-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-icon {
    font-size: 18px;
  }

  .btn-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .dust-error {
    padding: 14px;
    background: rgba(255, 107, 107, 0.15);
    border: 1px solid #FF6B6B;
    border-radius: 10px;
    color: #FF6B6B;
    font-size: 14px;
    text-align: center;
  }

  .dust-success {
    padding: 14px;
    background: rgba(57, 255, 20, 0.15);
    border: 1px solid #39FF14;
    border-radius: 10px;
    color: #39FF14;
    font-size: 14px;
    text-align: center;
  }

  .dust-results {
    background: #1a1a1a;
    border: 1px solid #252525;
    border-radius: 12px;
    overflow: hidden;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #252525;
  }

  .results-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .select-all-btn {
    background: none;
    border: 1px solid #333;
    padding: 6px 12px;
    border-radius: 6px;
    color: #888;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .select-all-btn:hover {
    border-color: #00D4FF;
    color: #00D4FF;
  }

  .results-table {
    overflow-x: auto;
  }

  .table-header {
    display: grid;
    grid-template-columns: 40px 2fr 1fr 1fr 1fr 100px;
    gap: 12px;
    padding: 12px 20px;
    background: #0f0f0f;
    font-size: 11px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .table-body {
    max-height: 300px;
    overflow-y: auto;
  }

  .table-row {
    display: grid;
    grid-template-columns: 40px 2fr 1fr 1fr 1fr 100px;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid #252525;
    cursor: pointer;
    transition: background 0.2s;
  }

  .table-row:hover {
    background: #252525;
  }

  .table-row.selected {
    background: rgba(0, 212, 255, 0.1);
  }

  .table-row.empty {
    border-left: 3px solid #39FF14;
  }

  .table-row.dust {
    border-left: 3px solid #FFD700;
  }

  .col-check {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .col-check input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #00D4FF;
    cursor: pointer;
  }

  .col-token {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .token-symbol {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }

  .token-mint {
    font-size: 11px;
    color: #555;
    font-family: monospace;
  }

  .col-balance,
  .col-value,
  .col-rent {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #ccc;
  }

  .col-status {
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
  }

  .status-empty {
    color: #39FF14;
  }

  .status-dust {
    color: #FFD700;
  }

  .status-valuable {
    color: #FF6B6B;
  }

  .dust-summary {
    background: #1a1a1a;
    border: 1px solid #252525;
    border-radius: 12px;
    padding: 20px;
  }

  .dust-summary h3 {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 16px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #0f0f0f;
    border-radius: 8px;
  }

  .summary-item.net {
    grid-column: span 2;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(57, 255, 20, 0.1));
    border: 1px solid #00D4FF;
  }

  .summary-label {
    font-size: 13px;
    color: #888;
  }

  .summary-value {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
  }

  .summary-value.highlight {
    color: #00D4FF;
  }

  .summary-value.fee {
    color: #FF6B6B;
  }

  .summary-value.net-value {
    color: #39FF14;
    font-size: 18px;
  }

  .summary-actions {
    display: flex;
    gap: 12px;
  }

  @media (max-width: 600px) {
    .table-header,
    .table-row {
      grid-template-columns: 30px 1fr 1fr 80px;
    }

    .col-value,
    .col-rent {
      display: none;
    }

    .threshold-pills {
      flex-wrap: wrap;
    }

    .mode-toggle {
      flex-direction: column;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .summary-item.net {
      grid-column: span 1;
    }

    .summary-actions {
      flex-direction: column;
    }
  }
`

const completeStyles = `
  .dust-complete-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.9);
  }

  .confetti-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .confetti-piece {
    position: absolute;
    width: 10px;
    height: 10px;
    background: var(--color);
    top: -10px;
    left: var(--x);
    transform: rotate(var(--rotation));
    animation: confetti-fall 3s ease-in var(--delay) infinite;
  }

  @keyframes confetti-fall {
    0% {
      top: -10px;
      opacity: 1;
    }
    100% {
      top: 110vh;
      opacity: 0;
      transform: rotate(calc(var(--rotation) + 720deg));
    }
  }

  .complete-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .complete-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #333;
  }

  .stat-item.highlight {
    border-bottom: none;
    padding-top: 12px;
  }

  .stat-label {
    font-size: 13px;
    color: #888;
  }

  .stat-value {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
  }

  .stat-item.highlight .stat-value {
    color: #39FF14;
    font-size: 18px;
  }

  .lifetime-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(0, 212, 255, 0.1);
    border-radius: 8px;
    margin-top: 8px;
  }

  .lifetime-label {
    font-size: 12px;
    color: #00D4FF;
  }

  .lifetime-value {
    font-size: 14px;
    font-weight: 700;
    color: #00D4FF;
  }

  .tx-link {
    display: inline-block;
    color: #00D4FF;
    font-size: 13px;
    text-decoration: none;
    margin-top: 8px;
  }

  .tx-link:hover {
    text-decoration: underline;
  }

  .complete-close-btn {
    width: 100%;
    padding: 12px 20px;
    background: linear-gradient(135deg, #00D4FF, #0099FF);
    border: none;
    border-radius: 8px;
    color: #000;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .complete-close-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
  }
`
