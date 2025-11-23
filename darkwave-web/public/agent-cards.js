// Collectible Agent Cards System for Projects Page
console.log('✅ Agent Cards system loaded');

// Create small carousel-style agent card
function createAgentCard(agent) {
  const card = document.createElement('div');
  card.className = 'carousel-coin-card';
  card.onclick = () => {
    setUserSelectedAgent(agent.id);
    showAgentPopup(agent);
  };
  card.innerHTML = `
    <div class="coin-card-wrapper">
      <div class="coin-card-image-container">
        <img src="${agent.image}" alt="${agent.name}" class="coin-card-image" onerror="this.src='/darkwave-coin.png'" />
        <div class="coin-card-badge" style="background: linear-gradient(135deg, var(--accent-blue), #7C3AED); font-size: 11px; padding: 3px 6px;">Agent</div>
      </div>
      <div class="coin-card-info">
        <h4 class="coin-card-name">${agent.name}</h4>
        <p class="coin-card-symbol" style="font-size: 10px; margin: 2px 0;">#${agent.id.toString().padStart(2, '0')}</p>
      </div>
    </div>
  `;
  return card;
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
