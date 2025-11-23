// Collectible Agent Cards System for Projects Page
console.log('✅ Agent Cards system loaded');

// Create collectible agent card for projects page
function createAgentCard(agent) {
  const card = document.createElement('div');
  card.className = 'agent-collectible-card';
  card.innerHTML = `
    <div class="agent-card-header">
      <img src="${agent.image}" alt="${agent.name}" class="agent-card-image">
      <div class="agent-card-badge">#${agent.id.toString().padStart(2, '0')}</div>
    </div>
    <div class="agent-card-body">
      <h3 class="agent-card-name">${agent.name}</h3>
      <p class="agent-card-title">${agent.title}</p>
      <div class="agent-card-stats">
        <span class="agent-card-stat">🌍 ${agent.race}</span>
        <span class="agent-card-stat">👥 ${agent.gender}</span>
      </div>
    </div>
    <div class="agent-card-footer">
      <div class="agent-card-highlight">
        <span class="agent-card-label">Career Highlight:</span>
        <p class="agent-card-text">"${agent.careerHighlight}"</p>
      </div>
      <div class="agent-card-funfact">
        <span class="agent-card-label">Fun Fact:</span>
        <p class="agent-card-text">"${agent.funFact}"</p>
      </div>
    </div>
    <div class="agent-card-actions">
      <button class="agent-card-btn" onclick="setUserSelectedAgent(${agent.id}); showAgentPopup(getAgentById(${agent.id}));">
        Select Agent
      </button>
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
  container.className = 'agent-cards-grid';
  
  AGENTS.forEach(agent => {
    const card = createAgentCard(agent);
    container.appendChild(card);
  });
  
  console.log(`✅ Rendered ${AGENTS.length} Agent cards`);
}

// Expose globally
window.createAgentCard = createAgentCard;
window.renderAgentCards = renderAgentCards;
