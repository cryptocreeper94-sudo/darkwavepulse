// Character System - Floating buttons and slide-in popups with transparent cutouts
console.log('✅ Character System loaded');

class CharacterSystem {
  constructor() {
    this.currentMode = 'agent'; // 'agent', 'business', 'casual', 'off'
    this.currentAgent = null;
    this.popupTimeout = null;
    this.isPopupVisible = false;
    this.lastEntryDirection = 'left';
    
    this.init();
  }
  
  init() {
    this.loadMode();
    this.createFloatingButton();
    this.injectStyles();
    this.listenForModeChanges();
    console.log('✅ Character System initialized - Mode:', this.currentMode);
  }
  
  loadMode() {
    const savedMode = localStorage.getItem('darkwave-persona-mode');
    if (savedMode && ['agent', 'business', 'casual', 'off'].includes(savedMode)) {
      this.currentMode = savedMode;
    }
    
    const savedAgentId = localStorage.getItem('userSelectedAgent');
    if (savedAgentId && window.AGENTS) {
      this.currentAgent = window.AGENTS.find(a => a.id === parseInt(savedAgentId));
    }
    if (!this.currentAgent && window.AGENTS && window.AGENTS.length > 0) {
      this.currentAgent = window.AGENTS[0];
    }
  }
  
  setMode(mode) {
    this.currentMode = mode;
    localStorage.setItem('darkwave-persona-mode', mode);
    this.updateFloatingButton();
    window.dispatchEvent(new CustomEvent('characterModeChanged', { detail: { mode } }));
  }
  
  setAgent(agent) {
    this.currentAgent = agent;
    if (agent && agent.id) {
      localStorage.setItem('userSelectedAgent', agent.id);
    }
    this.updateFloatingButton();
  }
  
  getCharacterImage() {
    if (this.currentMode === 'off') {
      return null;
    }
    
    if (this.currentMode === 'agent') {
      if (this.currentAgent && this.currentAgent.image) {
        return this.currentAgent.image.replace('/trading-cards/', '/trading-cards-cutouts/');
      }
      return '/trading-cards-cutouts/caucasian_blonde_male_agent.png';
    }
    
    if (this.currentMode === 'business') {
      return '/trading-cards-cutouts/Grumpy_cat_neutral_pose_ba4a1b4d.png';
    }
    
    if (this.currentMode === 'casual') {
      return '/trading-cards-cutouts/Grumpy_cat_sideeye_pose_5e52df88.png';
    }
    
    return '/trading-cards-cutouts/Grumpy_cat_neutral_pose_ba4a1b4d.png';
  }
  
  getCharacterName() {
    if (this.currentMode === 'agent' && this.currentAgent) {
      return this.currentAgent.name || 'Agent';
    }
    if (this.currentMode === 'business') {
      return 'Business Cat';
    }
    if (this.currentMode === 'casual') {
      return 'Grumpy Cat';
    }
    return 'Assistant';
  }
  
  createFloatingButton() {
    const existing = document.getElementById('characterFloatingBtn');
    if (existing) existing.remove();
    
    const btn = document.createElement('div');
    btn.id = 'characterFloatingBtn';
    btn.className = 'character-floating-btn';
    
    this.updateFloatingButtonContent(btn);
    
    btn.addEventListener('click', () => this.onFloatingButtonClick());
    
    document.body.appendChild(btn);
  }
  
  updateFloatingButton() {
    const btn = document.getElementById('characterFloatingBtn');
    if (btn) {
      this.updateFloatingButtonContent(btn);
    }
  }
  
  updateFloatingButtonContent(btn) {
    const image = this.getCharacterImage();
    
    if (this.currentMode === 'off' || !image) {
      btn.innerHTML = `<span class="character-btn-emoji">🤖</span>`;
      btn.classList.add('character-btn-off');
      btn.classList.remove('character-btn-active');
    } else {
      btn.innerHTML = `<img src="${image}" alt="${this.getCharacterName()}" class="character-btn-img" onerror="this.parentElement.innerHTML='<span class=\\'character-btn-emoji\\'>🤖</span>'">`;
      btn.classList.remove('character-btn-off');
      btn.classList.add('character-btn-active');
    }
  }
  
  onFloatingButtonClick() {
    this.cycleMode();
  }
  
  cycleMode() {
    const modes = ['agent', 'business', 'casual', 'off'];
    const currentIndex = modes.indexOf(this.currentMode);
    const newMode = modes[(currentIndex + 1) % modes.length];
    this.setMode(newMode);
    
    if (newMode !== 'off') {
      this.showGreeting();
    }
  }
  
  showGreeting() {
    const greetings = {
      agent: [
        "Agent reporting for duty. What intel do you need?",
        "Standing by for market analysis.",
        "Ready to decode the charts for you."
      ],
      business: [
        "Let's review the fundamentals.",
        "Professional analysis mode activated.",
        "Ready for serious market discussion."
      ],
      casual: [
        "Alright, let's see what chaos the market's cooking up today!",
        "Oh great, another dip? Shocker.",
        "HODL? More like HOPIUM, am I right?"
      ]
    };
    
    const modeGreetings = greetings[this.currentMode] || greetings.agent;
    const greeting = modeGreetings[Math.floor(Math.random() * modeGreetings.length)];
    
    this.showPopup({
      title: this.getCharacterName(),
      message: greeting,
      duration: 4000
    });
  }
  
  showPopup(options = {}) {
    const {
      title = '',
      message = '',
      duration = 8000
    } = options;
    
    if (this.currentMode === 'off') return;
    
    this.closePopup();
    
    const direction = Math.random() > 0.5 ? 'left' : 'right';
    this.lastEntryDirection = direction;
    
    const container = document.createElement('div');
    container.id = 'characterPopup';
    container.className = `character-popup character-popup-${direction}`;
    container.setAttribute('data-direction', direction);
    
    const image = this.getCharacterImage();
    const name = this.getCharacterName();
    
    container.innerHTML = `
      <div class="character-speech-bubble">
        ${title ? `<div class="character-speech-title">${title}</div>` : ''}
        <div class="character-speech-message">${message}</div>
        <div class="character-speech-tail character-speech-tail-${direction}"></div>
      </div>
      <div class="character-image-container">
        <img src="${image}" alt="${name}" class="character-popup-img" onerror="this.src='/trading-cards-cutouts/Grumpy_cat_neutral_pose_ba4a1b4d.png'">
      </div>
    `;
    
    container.addEventListener('click', () => this.closePopup());
    
    document.body.appendChild(container);
    this.isPopupVisible = true;
    
    requestAnimationFrame(() => {
      container.classList.add('character-popup-enter');
    });
    
    this.popupTimeout = setTimeout(() => this.closePopup(), duration);
  }
  
  closePopup() {
    const container = document.getElementById('characterPopup');
    if (!container) return;
    
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout);
      this.popupTimeout = null;
    }
    
    const direction = container.getAttribute('data-direction') || 'left';
    const exitDirection = direction === 'left' ? 'right' : 'left';
    
    container.classList.remove('character-popup-enter');
    container.classList.add(`character-popup-exit-${exitDirection}`);
    
    setTimeout(() => {
      container.remove();
      this.isPopupVisible = false;
    }, 500);
  }
  
  showTermDefinition(term, definition) {
    if (this.currentMode === 'off') {
      this.showSimplePopup(term, definition);
      return;
    }
    
    let message = definition;
    
    if (this.currentMode === 'casual' && window.casualResponses) {
      message = window.casualResponses[term.toLowerCase()] || definition;
    } else if (this.currentMode === 'business' && window.businessResponses) {
      message = window.businessResponses[term.toLowerCase()] || definition;
    }
    
    this.showPopup({
      title: term.toUpperCase(),
      message: message,
      duration: 10000
    });
  }
  
  showSimplePopup(title, message) {
    this.closePopup();
    
    const container = document.createElement('div');
    container.id = 'characterPopup';
    container.className = 'character-popup character-popup-simple';
    
    container.innerHTML = `
      <div class="character-speech-bubble character-speech-simple">
        ${title ? `<div class="character-speech-title">${title}</div>` : ''}
        <div class="character-speech-message">${message}</div>
      </div>
    `;
    
    container.addEventListener('click', () => this.closePopup());
    document.body.appendChild(container);
    
    requestAnimationFrame(() => {
      container.classList.add('character-popup-fade-in');
    });
    
    this.popupTimeout = setTimeout(() => this.closePopup(), 8000);
  }
  
  listenForModeChanges() {
    window.addEventListener('personaChanged', (e) => {
      if (e.detail && e.detail.persona) {
        this.currentMode = e.detail.persona;
        this.updateFloatingButton();
      }
    });
  }
  
  injectStyles() {
    if (document.getElementById('characterSystemStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'characterSystemStyles';
    style.textContent = `
      .character-floating-btn {
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(131, 56, 236, 0.3));
        border: 2px solid rgba(0, 212, 255, 0.6);
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
      }
      
      .character-floating-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(0, 212, 255, 0.5);
        border-color: #00D4FF;
      }
      
      .character-btn-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }
      
      .character-btn-emoji {
        font-size: 32px;
      }
      
      .character-btn-off {
        opacity: 0.5;
      }
      
      .character-popup {
        position: fixed;
        bottom: 20px;
        z-index: 10100;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: auto;
      }
      
      .character-popup-left {
        left: 20px;
        transform: translateX(-120%);
      }
      
      .character-popup-right {
        right: 20px;
        transform: translateX(120%);
      }
      
      .character-popup-enter {
        transform: translateX(0) !important;
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .character-popup-exit-left {
        transform: translateX(-150%) !important;
        transition: transform 0.4s ease-in;
      }
      
      .character-popup-exit-right {
        transform: translateX(150%) !important;
        transition: transform 0.4s ease-in;
      }
      
      .character-popup-simple {
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        opacity: 0;
        bottom: 100px;
      }
      
      .character-popup-fade-in {
        transform: translateX(-50%) translateY(0) !important;
        opacity: 1 !important;
        transition: all 0.4s ease-out;
      }
      
      /* Comic-style oblong oval speech bubble */
      .character-speech-bubble {
        background: linear-gradient(180deg, #ffffff 0%, #f0f4ff 100%);
        border: 3px solid #1a1a2e;
        border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
        padding: 18px 28px;
        max-width: 320px;
        min-width: 180px;
        margin-bottom: 12px;
        position: relative;
        box-shadow: 
          4px 4px 0 #1a1a2e,
          0 8px 25px rgba(0, 0, 0, 0.3);
        animation: bubbleAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
        text-align: center;
      }
      
      @keyframes bubbleAppear {
        from {
          opacity: 0;
          transform: scale(0.6) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      .character-speech-simple {
        border-radius: 45% 45% 45% 45% / 35% 35% 50% 50%;
      }
      
      /* Comic-style curved tail pointing down to character */
      .character-speech-tail {
        position: absolute;
        bottom: -22px;
        width: 25px;
        height: 25px;
        background: linear-gradient(180deg, #ffffff 0%, #f0f4ff 100%);
        border-right: 3px solid #1a1a2e;
        border-bottom: 3px solid #1a1a2e;
        transform: rotate(45deg) skew(15deg, 15deg);
        box-shadow: 3px 3px 0 #1a1a2e;
      }
      
      .character-speech-tail-left {
        left: 35px;
      }
      
      .character-speech-tail-right {
        right: 35px;
      }
      
      /* Inner white cover to hide the tail overlap */
      .character-speech-bubble::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 20px;
        right: 20px;
        height: 15px;
        background: linear-gradient(180deg, #f0f4ff 0%, #f0f4ff 100%);
      }
      
      .character-speech-title {
        font-size: 16px;
        font-weight: 900;
        color: #1a1a2e;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
      }
      
      .character-speech-message {
        font-size: 15px;
        color: #2a2a3e;
        line-height: 1.5;
        font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
        font-weight: 500;
      }
      
      .character-image-container {
        animation: characterBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      
      @keyframes characterBounceIn {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .character-popup-img {
        height: 200px;
        width: auto;
        object-fit: contain;
        filter: drop-shadow(0 8px 25px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 15px rgba(0, 212, 255, 0.2));
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      
      .character-popup-img:hover {
        transform: scale(1.05);
      }
      
      @media (max-width: 600px) {
        .character-floating-btn {
          width: 56px;
          height: 56px;
          bottom: 80px;
          right: 12px;
        }
        
        .character-btn-emoji {
          font-size: 26px;
        }
        
        .character-speech-bubble {
          max-width: 260px;
          min-width: 150px;
          padding: 14px 20px;
        }
        
        .character-speech-title {
          font-size: 14px;
        }
        
        .character-speech-message {
          font-size: 13px;
        }
        
        .character-popup-img {
          height: 150px;
        }
        
        .character-popup-left {
          left: 10px;
        }
        
        .character-popup-right {
          right: 10px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}

window.characterSystem = null;

function initCharacterSystem() {
  if (!window.characterSystem) {
    window.characterSystem = new CharacterSystem();
  }
}

window.showCharacterPopup = function(options) {
  if (window.characterSystem) {
    window.characterSystem.showPopup(options);
  }
};

window.showTermPopup = function(term, definition) {
  if (window.characterSystem) {
    window.characterSystem.showTermDefinition(term, definition);
  }
};

window.closeCharacterPopup = function() {
  if (window.characterSystem) {
    window.characterSystem.closePopup();
  }
};

window.setCharacterMode = function(mode) {
  if (window.characterSystem) {
    window.characterSystem.setMode(mode);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCharacterSystem);
} else {
  initCharacterSystem();
}

console.log('✅ Character System functions registered');
