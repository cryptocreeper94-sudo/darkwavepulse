export default function DisclaimerModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-disclaimer" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <span className="modal-icon">⚠️</span>
          <h2 className="modal-title">Disclaimer</h2>
        </div>

        <div className="modal-body">
          <div className="disclaimer-section">
            <h3>Risk Warning</h3>
            <p>
              Cryptocurrency trading involves substantial risk of loss and is not suitable for 
              every investor. The valuation of cryptocurrencies may fluctuate, and as a result, 
              you may lose more than your original investment.
            </p>
          </div>

          <div className="disclaimer-section">
            <h3>Not Financial Advice</h3>
            <p>
              The information provided in this application is for general informational purposes 
              only and should not be construed as financial, investment, or trading advice. 
              DarkWave Pulse does not provide personalized investment recommendations.
            </p>
          </div>

          <div className="disclaimer-section">
            <h3>No Guarantees</h3>
            <p>
              Past performance is not indicative of future results. Any analysis, predictions, 
              or signals provided are based on algorithms and historical data, and do not 
              guarantee future performance or returns.
            </p>
          </div>

          <div className="disclaimer-section">
            <h3>Your Responsibility</h3>
            <p>
              You are solely responsible for your trading decisions. Always conduct your own 
              research and consult with a qualified financial advisor before making any 
              investment decisions.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  )
}
