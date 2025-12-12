import './SniperBotTab.css'

export default function DemoUpgradeCTA({ onUpgrade }) {
  return (
    <div className="demo-upgrade-cta">
      <div className="upgrade-badge">Limited Time Offer</div>
      <div className="upgrade-icon">🎯</div>
      <h3 className="upgrade-title">Unlock Full Trading Power</h3>
      <p className="upgrade-desc">
        You've seen what StrikeAgent can do. Now imagine executing real trades with AI-powered precision across 23 blockchains.
      </p>
      
      <div className="upgrade-features">
        <div className="upgrade-feature">
          <span className="upgrade-feature-icon">✓</span>
          <span>Real money trading on Solana + 22 EVM chains</span>
        </div>
        <div className="upgrade-feature">
          <span className="upgrade-feature-icon">✓</span>
          <span>Unlimited AI token discovery with safety scoring</span>
        </div>
        <div className="upgrade-feature">
          <span className="upgrade-feature-icon">✓</span>
          <span>Anti-MEV protection & honeypot simulation</span>
        </div>
        <div className="upgrade-feature">
          <span className="upgrade-feature-icon">✓</span>
          <span>Built-in multi-chain HD wallet with encryption</span>
        </div>
        <div className="upgrade-feature">
          <span className="upgrade-feature-icon">✓</span>
          <span>Priority Telegram alerts for hot tokens</span>
        </div>
        <div className="upgrade-feature">
          <span className="upgrade-feature-icon">✓</span>
          <span>3-day free trial - cancel anytime</span>
        </div>
      </div>

      <button className="upgrade-btn" onClick={onUpgrade}>
        View Pricing Plans
      </button>
      <p className="upgrade-price">
        Starting at <strong>$8/month</strong> - Try free for 3 days
      </p>
    </div>
  )
}
