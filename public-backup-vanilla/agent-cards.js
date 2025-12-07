// Collectible Agent Cards System for Projects Page
console.log('✅ Agent Cards system loaded');

// Create small carousel-style agent card
function createAgentCard(agent) {
  const card = document.createElement('div');
  card.className = 'featured-coin-card';
  card.onclick = () => showAgentRefractorModal(agent);
  card.innerHTML = `
    <div style="position: relative; width: 100%; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; background: ${agent.refractorColor}; background-size: 400% 400%; animation: holographic 8s ease infinite; border-radius: 6px;">
      <img src="${agent.image}" alt="${agent.name}" class="featured-coin-image" onerror="this.src='/darkwave-coin.png'" style="border-radius: 4px;" />
      <img src="/Copilot_20251122_024330_1763939988156.png" alt="DarkWave lapel pin" style="position: absolute; width: 32%; height: 32%; top: 6%; left: 10%; filter: drop-shadow(0 0 6px rgba(255, 100, 150, 0.8)); pointer-events: none; border-radius: 50%;" />
    </div>
    <div style="font-size: 9px; font-weight: 700; color: #FFF; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${agent.name}</div>
  `;
  return card;
}

// Show agent refractor card modal
function showAgentRefractorModal(agent) {
  const modal = document.createElement('div');
  modal.className = 'agent-refractor-overlay';
  modal.onclick = (e) => {
    if (e.target === modal) closeAgentRefractor();
  };
  
  const qrUrl = getAgentQRUrl(agent);
  
  modal.innerHTML = `
    <div class="agent-refractor-modal">
      <button class="refractor-close" onclick="closeAgentRefractor()">×</button>
      
      <div class="refractor-card-container">
        <!-- Front of card -->
        <div class="refractor-front">
          <div class="refractor-header">
            <h2 style="margin: 0; font-family: Orbitron; color: #9D4EDD; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">AGENT REFRACTOR</h2>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #9D4EDD; letter-spacing: 2px;">${agent.rarity.toUpperCase()}</p>
          </div>
          
          <div style="position: relative; margin: 16px 0;">
            <img src="${agent.image}" alt="${agent.name}" style="width: 100%; max-width: 220px; border-radius: 12px; border: 3px solid rgba(255, 215, 0, 0.3); box-shadow: 0 0 25px rgba(0, 212, 255, 0.4);" />
          </div>
          
          <div class="refractor-name-block">
            <h3 style="margin: 0; font-size: 16px; font-weight: 900;">${agent.name}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #00D4FF;">${agent.title}</p>
          </div>
          
          <div class="refractor-stats-grid">
            <div class="stat-cell">
              <span class="stat-label">Trading Power</span>
              <span class="stat-value">${agent.tradingPower}</span>
            </div>
            <div class="stat-cell">
              <span class="stat-label">Trust Rating</span>
              <span class="stat-value">${agent.trustRating}%</span>
            </div>
            <div class="stat-cell">
              <span class="stat-label">Age</span>
              <span class="stat-value">${agent.age} yrs</span>
            </div>
            <div class="stat-cell">
              <span class="stat-label">Experience</span>
              <span class="stat-value">${agent.experience}</span>
            </div>
          </div>
          
          <div class="refractor-serial">
            <span style="font-size: 9px; font-weight: 700; background: linear-gradient(90deg, #9D4EDD, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 1px; text-transform: uppercase;">✨ Serial: ${agent.serialNumber} ✨</span>
          </div>
          
          <div class="refractor-qr-section">
            <img src="${qrUrl}" alt="QR Code" style="width: 140px; height: 140px; border: 2px solid rgba(255, 215, 0, 0.4); border-radius: 8px; padding: 6px; background: #FFF;" />
            <button class="qr-download-btn" onclick="downloadAgentQR('${agent.serialNumber}', '${qrUrl}')">
              ⬇️ DOWNLOAD QR
            </button>
          </div>
          
          <button class="refractor-view-profile" onclick="window.location.href='/agent/${agent.id}?code=${agent.serialNumber}'">
            👁️ VIEW AGENT PROFILE →
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Close refractor modal
function closeAgentRefractor() {
  const modal = document.querySelector('.agent-refractor-overlay');
  if (modal) modal.remove();
}

// Download QR code
function downloadAgentQR(serialNumber, qrUrl) {
  const link = document.createElement('a');
  link.href = qrUrl;
  link.download = `darkwave-agent-${serialNumber}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Render all agent cards in a container
function renderAgentCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Agent cards container "${containerId}" not found`);
    return;
  }
  
  container.innerHTML = '';
  container.className = 'featured-coins-grid';
  
  AGENTS.forEach(agent => {
    const card = createAgentCard(agent);
    container.appendChild(card);
  });
  
  console.log(`✅ Rendered ${AGENTS.length} Agent cards in carousel`);
}

// Expose globally
window.createAgentCard = createAgentCard;
window.renderAgentCards = renderAgentCards;
window.showAgentRefractorModal = showAgentRefractorModal;
window.closeAgentRefractor = closeAgentRefractor;
window.downloadAgentQR = downloadAgentQR;
