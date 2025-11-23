// Agent Selector & Display System
console.log('✅ Agent Selector System loaded');

// Store user's selected agent in localStorage
function getUserSelectedAgent() {
  const savedAgentId = localStorage.getItem('userSelectedAgent');
  if (savedAgentId) {
    return getAgentById(parseInt(savedAgentId));
  }
  // Default to random agent if none selected
  return getRandomAgent();
}

function setUserSelectedAgent(agentId) {
  localStorage.setItem('userSelectedAgent', agentId);
}

// Display agent popup with info
function showAgentPopup(agent) {
  if (!agent) agent = getUserSelectedAgent();
  
  const modal = document.getElementById('agentPopupModal');
  if (!modal) {
    console.warn('Agent popup modal not found in HTML');
    return;
  }
  
  const agentImage = document.getElementById('agentPopupImage');
  const agentName = document.getElementById('agentPopupName');
  const agentTitle = document.getElementById('agentPopupTitle');
  const agentHighlight = document.getElementById('agentPopupHighlight');
  const agentFunFact = document.getElementById('agentPopupFunFact');
  
  if (agentImage) agentImage.src = agent.image;
  if (agentName) agentName.textContent = agent.name;
  if (agentTitle) agentTitle.textContent = agent.title;
  if (agentHighlight) agentHighlight.textContent = `🏆 ${agent.careerHighlight}`;
  if (agentFunFact) agentFunFact.textContent = `⚡ ${agent.funFact}`;
  
  modal.style.display = 'flex';
  console.log(`✅ Agent ${agent.name} popup displayed`);
}

// Close agent popup
function closeAgentPopup() {
  const modal = document.getElementById('agentPopupModal');
  if (modal) modal.style.display = 'none';
}

// Open agent selector modal
function openAgentSelector() {
  const modal = document.getElementById('agentSelectorModal');
  if (!modal) {
    console.warn('Agent selector modal not found in HTML');
    return;
  }
  
  const agentGrid = document.getElementById('agentSelectorGrid');
  if (!agentGrid) return;
  
  // Clear existing
  agentGrid.innerHTML = '';
  
  // Create agent cards
  AGENTS.forEach(agent => {
    const card = document.createElement('div');
    card.className = 'agent-selector-card';
    card.innerHTML = `
      <img src="${agent.image}" alt="${agent.name}" class="agent-selector-image">
      <div class="agent-selector-info">
        <div class="agent-selector-name">${agent.name}</div>
        <div class="agent-selector-title">${agent.title}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      setUserSelectedAgent(agent.id);
      showAgentPopup(agent);
      closeAgentSelector();
      console.log(`✅ Agent ${agent.name} selected`);
    });
    agentGrid.appendChild(card);
  });
  
  modal.style.display = 'flex';
}

// Close agent selector modal
function closeAgentSelector() {
  const modal = document.getElementById('agentSelectorModal');
  if (modal) modal.style.display = 'none';
}

// Initialize: Show random agent on first visit or user's selected agent
function initializeAgentSystem() {
  const agent = getUserSelectedAgent();
  console.log(`✅ Agent System initialized with ${agent.name}`);
  
  // Store for later use in popups
  window.currentAgent = agent;
}

// Expose globally
window.showAgentPopup = showAgentPopup;
window.closeAgentPopup = closeAgentPopup;
window.openAgentSelector = openAgentSelector;
window.closeAgentSelector = closeAgentSelector;
window.initializeAgentSystem = initializeAgentSystem;
window.getUserSelectedAgent = getUserSelectedAgent;
window.setUserSelectedAgent = setUserSelectedAgent;
