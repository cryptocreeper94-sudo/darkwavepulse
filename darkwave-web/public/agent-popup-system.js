// Agent Popup System - Agent Cutouts (Transparent Silhouettes) in All Popups
console.log('✅ Agent Popup System loaded');

let currentPopupAgent = null;
let agentPopupMode = 'off'; // 'off', 'business', 'casual'

// Get user's selected agent or random one
function getPopupAgent() {
  if (currentPopupAgent) return currentPopupAgent;
  const savedAgentId = localStorage.getItem('userSelectedAgent');
  if (savedAgentId) {
    currentPopupAgent = getAgentById(parseInt(savedAgentId));
  } else {
    currentPopupAgent = getRandomAgent();
  }
  return currentPopupAgent;
}

// Set popup agent
function setPopupAgent(agentId) {
  currentPopupAgent = getAgentById(agentId);
  localStorage.setItem('userSelectedAgent', agentId);
}

// Business mode responses
const businessResponses = {
  'liquidation': 'Forced position closure when margin requirements aren\'t met. Risk management is crucial.',
  'fomo': 'Fear Of Missing Out - emotion-driven investment decisions typically lead to buying at peaks.',
  'hodl': 'Long-term holding strategy, originally a misspelling that became crypto culture.',
  'whale': 'Entity holding significant cryptocurrency amounts, capable of influencing market prices.',
  'pump': 'Rapid price increase, often artificially induced through coordinated buying.',
  'dump': 'Large-scale selling causing significant price decrease. Watch for volume spikes.',
  'rug pull': 'Exit scam where developers abandon project and drain liquidity. Due diligence is essential.',
  'moon': 'Significant price appreciation. Set realistic targets and take profits incrementally.',
  'dyor': 'Do Your Own Research - fundamental analysis is critical before any investment.',
  'rekt': 'Substantial financial loss. Proper risk management and position sizing prevent this.',
  'ath': 'All-Time High - historical peak price. Useful resistance level for technical analysis.',
  'atl': 'All-Time Low - historical bottom price. Potential support level when analyzing trends.',
  'bag holder': 'Investor holding depreciated assets. Dollar-cost averaging can mitigate this risk.',
  'diamond hands': 'Strong conviction holding despite volatility. Requires solid fundamental thesis.',
  'paper hands': 'Premature selling under pressure. Sometimes cutting losses is the prudent choice.',
  'degen': 'High-risk trader prioritizing potential returns over safety. Not recommended for beginners.',
  'gas fee': 'Transaction cost on blockchain networks. Higher fees during network congestion.',
  'bear market': 'Extended period of declining prices. Opportunity for accumulation at lower valuations.',
  'bull market': 'Sustained upward price trend. Be cautious of euphoria and maintain discipline.',
  'shitcoin': 'Low-quality cryptocurrency with questionable fundamentals. Thorough vetting required.'
};

// Casual mode responses
const casualResponses = {
  'liquidation': '💧 Where your tears flow when the market decides you had too much leverage!',
  'fomo': '😱 That feeling when everyone is making money except you... spoiler: they aren\'t!',
  'hodl': '💎 Hold On for Dear Life... or just can\'t spell "hold". Both valid!',
  'whale': '🐋 Not the ocean kind. These are the folks who can move markets with a sneeze!',
  'pump': '🚀 When price goes up fast. Usually followed by...',
  'dump': '📉 When whales decide it\'s time to take profits. RIP your portfolio!',
  'rug pull': '🏃 When developers say "thanks for the money, suckers!" and vanish!',
  'moon': '🌙 That mythical place your coins will never reach. But we keep hoping!',
  'dyor': '🔍 Do Your Own Research... but you won\'t, and that\'s why I\'m here!',
  'rekt': '💀 Past tense of "wrecked". Your portfolio after ignoring my advice!',
  'ath': '📊 All-Time High. That price you bought at before it crashed!',
  'atl': '🔻 All-Time Low. Where you should\'ve bought but didn\'t!',
  'bag holder': '🎒 Congrats! You\'re holding worthless tokens while pretending it\'s "investing"!',
  'diamond hands': '💎 Refusing to sell even as your portfolio burns. Brave or stupid? You decide!',
  'paper hands': '📄 Selling at the first sign of trouble. Probably the smarter move, honestly!',
  'degen': '🎰 Someone who makes terrible financial decisions. Hi there!',
  'gas fee': '⛽ The fee that costs more than your actual transaction. Welcome to Ethereum!',
  'bear market': '🐻 When everything goes down and hopium is all you have left!',
  'bull market': '🐂 When everyone\'s a genius and buying high seems like a great idea!',
  'shitcoin': '💩 99% of all cryptocurrencies. But yours is different, right?'
};

// Show agent popup with transparent cutout image
function showAgentPopup(term, definition) {
  const existingPopup = document.getElementById('agentPopupOverlay');
  if (existingPopup) existingPopup.remove();

  const agent = getPopupAgent();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'agentPopupOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10100;
  `;

  // Determine response text
  let responseText;
  if (agentPopupMode === 'off') {
    responseText = definition;
  } else if (agentPopupMode === 'business') {
    responseText = businessResponses[term.toLowerCase()] || definition;
  } else {
    responseText = casualResponses[term.toLowerCase()] || definition;
  }

  // Create modal with agent image on left, text on right
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #1a1a1a;
    border: 3px solid #3861fb;
    border-radius: 12px;
    padding: 30px;
    max-width: 650px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    display: flex;
    gap: 20px;
    box-shadow: 0 0 40px rgba(56, 97, 251, 0.6);
    position: relative;
    align-items: flex-start;
  `;

  modal.innerHTML = `
    <button onclick="closeAgentPopup()" style="
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      color: #3861fb;
      font-size: 32px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    ">×</button>

    <div style="
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      min-width: 140px;
    ">
      <img src="${agent.image}" alt="${agent.name}" style="
        width: 140px;
        height: auto;
        object-fit: contain;
        filter: drop-shadow(0 0 8px rgba(56, 97, 251, 0.4));
      ">
      <div style="
        font-size: 11px;
        font-weight: 700;
        color: #3861fb;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-align: center;
      ">${agent.name}</div>
      <button onclick="switchAgentInPopup()" style="
        background: linear-gradient(135deg, rgba(56, 97, 251, 0.2), rgba(131, 56, 236, 0.2));
        border: 1px solid #3861fb;
        color: #3861fb;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 9px;
        cursor: pointer;
        font-weight: 700;
        transition: all 0.2s;
      ">Switch</button>
    </div>

    <div style="flex: 1;">
      <div style="font-size: 24px; font-weight: 900; color: #3861fb; margin-bottom: 12px; text-transform: uppercase;">${term}</div>
      <div style="font-size: 14px; color: #ddd; line-height: 1.6;">${responseText}</div>
      
      <div style="
        margin-top: 16px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      ">
        <button onclick="setAgentPopupMode('off')" style="
          padding: 5px 10px;
          background: ${agentPopupMode === 'off' ? '#3861fb' : 'rgba(56, 97, 251, 0.2)'};
          border: 1px solid #3861fb;
          color: #3861fb;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          transition: all 0.2s;
        ">Definition</button>
        <button onclick="setAgentPopupMode('business')" style="
          padding: 5px 10px;
          background: ${agentPopupMode === 'business' ? '#3861fb' : 'rgba(56, 97, 251, 0.2)'};
          border: 1px solid #3861fb;
          color: #3861fb;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          transition: all 0.2s;
        ">Pro</button>
        <button onclick="setAgentPopupMode('casual')" style="
          padding: 5px 10px;
          background: ${agentPopupMode === 'casual' ? '#3861fb' : 'rgba(56, 97, 251, 0.2)'};
          border: 1px solid #3861fb;
          color: #3861fb;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          transition: all 0.2s;
        ">Casual</button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) closeAgentPopup();
  };

  // Auto close after 10 seconds
  setTimeout(closeAgentPopup, 10000);
}

function closeAgentPopup() {
  const overlay = document.getElementById('agentPopupOverlay');
  if (overlay) overlay.remove();
}

function setAgentPopupMode(mode) {
  agentPopupMode = mode;
  localStorage.setItem('agentPopupMode', mode);
  // Get the term from the modal
  const modal = document.querySelector('[style*="gap: 20px"]');
  if (modal) {
    const termDiv = modal.querySelector('div[style*="font-size: 24px"]');
    if (termDiv) {
      const term = termDiv.textContent;
      // Close and reopen to refresh
      closeAgentPopup();
      setTimeout(() => showAgentPopup(term, ''), 100);
    }
  }
}

function switchAgentInPopup() {
  if (typeof openAgentSelector === 'function') {
    closeAgentPopup();
    openAgentSelector();
  }
}

// Initialize popup mode
function initAgentPopupSystem() {
  const savedMode = localStorage.getItem('agentPopupMode') || 'off';
  agentPopupMode = savedMode;
  console.log('✅ Agent popup mode:', agentPopupMode);
}

// Export functions globally
window.showAgentPopup = showAgentPopup;
window.closeAgentPopup = closeAgentPopup;
window.setAgentPopupMode = setAgentPopupMode;
window.switchAgentInPopup = switchAgentInPopup;
window.getPopupAgent = getPopupAgent;
window.setPopupAgent = setPopupAgent;

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgentPopupSystem);
} else {
  initAgentPopupSystem();
}
