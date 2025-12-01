// Developer Dashboard Page - Full system controls with accordion UI

// ============================================
// FEATURE INVENTORY - All DarkWave Features
// ============================================
const FEATURE_CATEGORIES = [
  {
    name: "Core Platform",
    icon: "🔐",
    color: "purple",
    features: [
      { id: "core-login", name: "Access Code Login", description: "Secure login with email or access codes (777, admin codes)", status: "complete" },
      { id: "core-session", name: "Session Management", description: "30-day persistent sessions with browser fingerprinting", status: "complete" },
      { id: "core-themes", name: "9-Theme System", description: "Personalized themes with organic CSS gradient patterns", status: "complete" },
      { id: "core-responsive", name: "Mobile-First Design", description: "Responsive layouts for 320px to desktop", status: "complete" },
      { id: "core-pwa", name: "PWA Support", description: "Progressive Web App with offline capability", status: "complete" },
      { id: "core-sentry", name: "Error Tracking", description: "Sentry integration for frontend error monitoring", status: "complete" },
    ]
  },
  {
    name: "AI & Agents",
    icon: "🤖",
    color: "blue",
    features: [
      { id: "ai-18agents", name: "18 AI Agent Personas", description: "Balanced agents: 6 per age group, 9 male/9 female, diverse backgrounds", status: "complete" },
      { id: "ai-commentary", name: "Commentary Modes", description: "Agent, Business Cat, Casual Cat, or Off modes", status: "complete" },
      { id: "ai-popup", name: "Floating Agent Popups", description: "Interactive agent/cat popups with cutout images", status: "complete" },
      { id: "ai-trading-cards", name: "20 NFT Trading Cards", description: "Collectible agent cards with carousel display", status: "complete" },
      { id: "ai-mastra", name: "Mastra Framework", description: "Backend AI agent with tool calling and memory", status: "complete" },
      { id: "ai-openai", name: "GPT-4o Integration", description: "OpenAI integration via Replit AI Integrations", status: "complete" },
    ]
  },
  {
    name: "Trading Features",
    icon: "📈",
    color: "green",
    features: [
      { id: "trade-charts", name: "TradingView Charts", description: "Lightweight Charts with candlestick and sparkline", status: "complete" },
      { id: "trade-indicators", name: "Technical Indicators", description: "RSI, MACD, EMA, Golden/Death Cross, Bollinger Bands", status: "complete" },
      { id: "trade-coin-table", name: "Coin Data Table", description: "9-column CoinMarketCap-style market overview", status: "complete" },
      { id: "trade-categories", name: "Category Filters", description: "Filter by Trending, Gainers, Losers, Memes, Blue Chips, etc.", status: "complete" },
      { id: "trade-fear-greed", name: "Fear & Greed Index", description: "Live gauge with gradient needle display", status: "complete" },
      { id: "trade-altcoin", name: "Altcoin Season Index", description: "Market sentiment indicator with needle gauge", status: "complete" },
      { id: "trade-dex", name: "DEX Pair Analysis", description: "Dexscreener integration with rug-risk detection", status: "complete" },
      { id: "trade-stocks", name: "Stock Analysis", description: "Yahoo Finance integration for stock data", status: "complete" },
      { id: "trade-sniper", name: "Sniper Trading", description: "Buy/Sell limit orders (V2 locked)", status: "partial" },
    ]
  },
  {
    name: "Portfolio & Wallets",
    icon: "💼",
    color: "amber",
    features: [
      { id: "port-tracker", name: "Portfolio Tracker", description: "Track holdings across multiple wallets", status: "complete" },
      { id: "port-multichain", name: "Multi-Chain Wallets", description: "Solana, Ethereum, Polygon, Arbitrum, Base, BSC support", status: "complete" },
      { id: "port-whale", name: "Whale Tracking", description: "Monitor large wallet movements (V2 feature)", status: "partial" },
    ]
  },
  {
    name: "Staking & Tokens",
    icon: "💰",
    color: "cyan",
    features: [
      { id: "stake-tiers", name: "Staking Tiers", description: "Bronze, Silver, Gold, Platinum, Diamond with pastel colors", status: "complete" },
      { id: "stake-sandbox", name: "Staking Sandbox", description: "Preview staking with placeholder numbers", status: "complete" },
      { id: "stake-pulse", name: "PULSE Token", description: "Native token with 1B fixed supply", status: "planned" },
      { id: "stake-hourly", name: "Hourly Rewards", description: "Automated hourly compounding (V2)", status: "planned" },
      { id: "stake-pools", name: "Multi-Token Pools", description: "Community token staking platform (V2)", status: "planned" },
    ]
  },
  {
    name: "Blockchain & Audit",
    icon: "🔗",
    color: "teal",
    features: [
      { id: "audit-trail", name: "Solana Audit Trail", description: "SHA-256 hashing of events posted to Solana Memo program", status: "complete" },
      { id: "audit-helius", name: "Helius API Integration", description: "Blockchain transactions via Helius", status: "complete" },
      { id: "audit-verify", name: "Event Verification", description: "Verify audit events by ID or hash", status: "complete" },
      { id: "hallmark-nft", name: "Hallmark NFTs", description: "$1.99 collectible NFTs with serial numbers", status: "complete" },
      { id: "hallmark-templates", name: "Hallmark Templates", description: "Classic, Premium Gold, Cyber Neon, Vintage styles", status: "complete" },
    ]
  },
  {
    name: "Subscriptions & Payments",
    icon: "💳",
    color: "pink",
    features: [
      { id: "sub-stripe", name: "Stripe Integration", description: "Credit card payments with live/test keys", status: "complete" },
      { id: "sub-coinbase", name: "Coinbase Commerce", description: "Cryptocurrency payment processing", status: "complete" },
      { id: "sub-tiers", name: "Subscription Tiers", description: "Free Trial, Basic ($4/mo), Premium, Legacy Founder", status: "complete" },
      { id: "sub-pricing", name: "Pricing Modal", description: "Interactive pricing comparison with upgrade CTAs", status: "complete" },
      { id: "sub-affiliate", name: "Affiliate System", description: "Referral tracking and commission system", status: "complete" },
    ]
  },
  {
    name: "Education & Content",
    icon: "📚",
    color: "indigo",
    features: [
      { id: "edu-glossary", name: "143-Term Glossary", description: "Searchable crypto terminology database", status: "complete" },
      { id: "edu-knowledge", name: "8-Chapter Knowledge Base", description: "Comprehensive crypto education system", status: "complete" },
      { id: "edu-guide", name: "Interactive Guide", description: "Step-by-step learning with progress tracking", status: "complete" },
    ]
  },
  {
    name: "Projects & Community",
    icon: "🚀",
    color: "orange",
    features: [
      { id: "proj-coins", name: "14 Project Coins", description: "Solana-based ecosystem tokens in carousel", status: "complete" },
      { id: "proj-categories", name: "Project Categories", description: "CryptoCat, Conspiracy, Spiritual, Meme collections", status: "complete" },
      { id: "proj-likes", name: "Project Voting", description: "Like/upvote system for community projects", status: "complete" },
      { id: "proj-submit", name: "Token Submission", description: "Three-layer validation for new project submissions", status: "complete" },
      { id: "proj-launchpad", name: "Token Launchpad", description: "Countdown, whitelist signup (V2)", status: "partial" },
    ]
  },
  {
    name: "Admin & Developer",
    icon: "🛠️",
    color: "red",
    features: [
      { id: "admin-dashboard", name: "Admin Dashboard", description: "Full system controls and user management", status: "complete" },
      { id: "admin-dev", name: "Developer Dashboard", description: "Accordion UI with stats and config", status: "complete" },
      { id: "admin-feature-inv", name: "Feature Inventory", description: "This panel - track all features and publishes", status: "complete" },
      { id: "admin-whitelist", name: "User Whitelisting", description: "Email and access code management", status: "complete" },
    ]
  },
  {
    name: "Mobile & UX",
    icon: "📱",
    color: "emerald",
    features: [
      { id: "mobile-nav", name: "7-Tab Navigation", description: "Crypto, Stocks, Projects, Learn, Portfolio, Staking, Settings", status: "complete" },
      { id: "mobile-search", name: "Mobile Search Modal", description: "Full-screen search on mobile devices", status: "complete" },
      { id: "mobile-charts", name: "Fullscreen Charts", description: "Landscape-optimized chart viewing", status: "complete" },
      { id: "mobile-buttons", name: "Floating Buttons", description: "Mode-synced agent/cat buttons", status: "complete" },
      { id: "mobile-accordion", name: "Accordion UI", description: "Collapsible sections throughout app", status: "complete" },
    ]
  },
  {
    name: "V2 Roadmap",
    icon: "🎄",
    color: "violet",
    features: [
      { id: "v2-founders", name: "Founders Launch", description: "December 25th flexible launch date", status: "planned" },
      { id: "v2-presale", name: "PULSE Presale", description: "Q1 2026 token presale", status: "planned" },
      { id: "v2-mobile-app", name: "Mobile Apps", description: "React Native Expo for Google Play", status: "planned" },
      { id: "v2-telegram", name: "Telegram Bot", description: "Trading signals via Telegram", status: "partial" },
      { id: "v2-marketplace", name: "NFT Marketplace", description: "Trading card marketplace", status: "planned" },
    ]
  },
];

// Publish History Log
const PUBLISH_LOG = [
  { version: "1.0.0", date: "2025-10-15", time: "10:00 CST", notes: "Initial beta launch with core trading features" },
  { version: "1.1.0", date: "2025-10-28", time: "14:30 CST", notes: "Added 18 AI agent personas and trading card system" },
  { version: "1.2.0", date: "2025-11-10", time: "09:00 CST", notes: "Stripe and Coinbase Commerce integration" },
  { version: "1.3.0", date: "2025-11-18", time: "16:00 CST", notes: "Multi-chain wallet tracking, staking tiers" },
  { version: "1.4.0", date: "2025-11-24", time: "11:30 CST", notes: "Navigation consolidation, mobile optimization, metric box polish" },
  { version: "1.5.0", date: "2025-11-30", time: "15:00 CST", notes: "Solana audit trail system, Hallmark NFTs, developer dashboard" },
  { version: "1.5.1", date: "2025-12-01", time: "13:00 CST", notes: "V2 branding update: Founders Launch messaging, mode sync fixes" },
];

// Feature Inventory Module
const FeatureInventory = {
  checkedFeatures: [],
  expandedCategories: [],
  
  init() {
    // Load checked features from localStorage
    const saved = localStorage.getItem('darkwave_feature_checklist');
    this.checkedFeatures = saved ? JSON.parse(saved) : [];
    // Start with all categories expanded
    this.expandedCategories = FEATURE_CATEGORIES.map(c => c.name);
    console.log('✅ Feature Inventory initialized');
  },
  
  toggleFeature(featureId) {
    const idx = this.checkedFeatures.indexOf(featureId);
    if (idx > -1) {
      this.checkedFeatures.splice(idx, 1);
    } else {
      this.checkedFeatures.push(featureId);
    }
    localStorage.setItem('darkwave_feature_checklist', JSON.stringify(this.checkedFeatures));
    this.refreshUI();
  },
  
  toggleCategory(categoryName) {
    const idx = this.expandedCategories.indexOf(categoryName);
    if (idx > -1) {
      this.expandedCategories.splice(idx, 1);
    } else {
      this.expandedCategories.push(categoryName);
    }
    this.refreshUI();
  },
  
  resetChecklist() {
    this.checkedFeatures = [];
    localStorage.removeItem('darkwave_feature_checklist');
    this.refreshUI();
  },
  
  refreshUI() {
    const container = document.getElementById('featureInventoryContent');
    if (container) {
      container.innerHTML = this.renderContent();
    }
    // Update summary stats
    const statsEl = document.getElementById('featureInventoryStats');
    if (statsEl) {
      statsEl.innerHTML = this.renderStats();
    }
  },
  
  getStats() {
    const total = FEATURE_CATEGORIES.reduce((sum, cat) => sum + cat.features.length, 0);
    const complete = FEATURE_CATEGORIES.reduce((sum, cat) => 
      sum + cat.features.filter(f => f.status === 'complete').length, 0);
    const partial = FEATURE_CATEGORIES.reduce((sum, cat) => 
      sum + cat.features.filter(f => f.status === 'partial').length, 0);
    const planned = FEATURE_CATEGORIES.reduce((sum, cat) => 
      sum + cat.features.filter(f => f.status === 'planned').length, 0);
    const verified = this.checkedFeatures.length;
    return { total, complete, partial, planned, verified, publishes: PUBLISH_LOG.length };
  },
  
  renderStats() {
    const stats = this.getStats();
    return `
      <div class="fi-stats-grid">
        <div class="fi-stat fi-stat-emerald">
          <span class="fi-stat-value">${stats.total}</span>
          <span class="fi-stat-label">Total Features</span>
        </div>
        <div class="fi-stat fi-stat-green">
          <span class="fi-stat-value">${stats.complete}</span>
          <span class="fi-stat-label">Built & Ready</span>
        </div>
        <div class="fi-stat fi-stat-yellow">
          <span class="fi-stat-value">${stats.partial}</span>
          <span class="fi-stat-label">Partial/WIP</span>
        </div>
        <div class="fi-stat fi-stat-blue">
          <span class="fi-stat-value">${stats.verified}</span>
          <span class="fi-stat-label">Verified ✓</span>
        </div>
        <div class="fi-stat fi-stat-purple">
          <span class="fi-stat-value">${stats.publishes}</span>
          <span class="fi-stat-label">Publishes</span>
        </div>
      </div>
    `;
  },
  
  renderPublishLog() {
    const logs = [...PUBLISH_LOG].reverse();
    return `
      <div class="fi-publish-log">
        <h4 class="fi-section-title">🚀 Publish History</h4>
        <div class="fi-log-list">
          ${logs.map((log, idx) => `
            <div class="fi-log-item">
              <div class="fi-log-version">
                <span class="fi-version-number">${log.version}</span>
                <span class="fi-version-date">${log.date}</span>
                <span class="fi-version-time">${log.time}</span>
              </div>
              <div class="fi-log-notes">${log.notes}</div>
              ${idx === 0 ? '<span class="fi-badge fi-badge-latest">LATEST</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  renderContent() {
    const colorMap = {
      purple: 'fi-cat-purple',
      blue: 'fi-cat-blue',
      green: 'fi-cat-green',
      amber: 'fi-cat-amber',
      cyan: 'fi-cat-cyan',
      teal: 'fi-cat-teal',
      pink: 'fi-cat-pink',
      indigo: 'fi-cat-indigo',
      orange: 'fi-cat-orange',
      red: 'fi-cat-red',
      emerald: 'fi-cat-emerald',
      violet: 'fi-cat-violet',
    };
    
    return `
      ${this.renderPublishLog()}
      
      <div class="fi-categories">
        ${FEATURE_CATEGORIES.map(category => {
          const isExpanded = this.expandedCategories.includes(category.name);
          const checkedCount = category.features.filter(f => this.checkedFeatures.includes(f.id)).length;
          const colorClass = colorMap[category.color] || 'fi-cat-purple';
          
          return `
            <div class="fi-category ${colorClass}">
              <div class="fi-category-header" onclick="FeatureInventory.toggleCategory('${category.name}')">
                <span class="fi-category-icon">${category.icon}</span>
                <span class="fi-category-name">${category.name}</span>
                <span class="fi-category-count">${checkedCount}/${category.features.length}</span>
                <span class="fi-category-arrow">${isExpanded ? '▼' : '▶'}</span>
              </div>
              ${isExpanded ? `
                <div class="fi-category-content">
                  ${category.features.map(feature => {
                    const isChecked = this.checkedFeatures.includes(feature.id);
                    const statusBadge = feature.status === 'complete' ? 'BUILT' : 
                                       feature.status === 'partial' ? 'WIP' : 'PLANNED';
                    const statusClass = feature.status === 'complete' ? 'fi-badge-green' : 
                                        feature.status === 'partial' ? 'fi-badge-yellow' : 'fi-badge-blue';
                    
                    return `
                      <div class="fi-feature ${isChecked ? 'fi-feature-checked' : ''}" 
                           onclick="FeatureInventory.toggleFeature('${feature.id}')">
                        <span class="fi-feature-check">${isChecked ? '✓' : '○'}</span>
                        <div class="fi-feature-info">
                          <span class="fi-feature-name">${feature.name}</span>
                          <span class="fi-badge ${statusClass}">${statusBadge}</span>
                        </div>
                        <p class="fi-feature-desc">${feature.description}</p>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="fi-actions">
        <button onclick="FeatureInventory.resetChecklist()" class="fi-reset-btn">Reset Checklist</button>
      </div>
    `;
  },
  
  render() {
    this.init();
    return `
      <div class="feature-inventory">
        <div id="featureInventoryStats">${this.renderStats()}</div>
        <div id="featureInventoryContent">${this.renderContent()}</div>
      </div>
    `;
  }
};

// Export for global access
window.FeatureInventory = FeatureInventory;
window.FEATURE_CATEGORIES = FEATURE_CATEGORIES;
window.PUBLISH_LOG = PUBLISH_LOG;

// ============================================

const DevDashboard = {
  adminCode: null,
  dashboardData: null,
  
  async init(code) {
    this.adminCode = code || prompt('Enter Admin Access Code:');
    if (!this.adminCode) {
      alert('Access code required');
      return false;
    }
    
    await this.loadDashboard();
    return true;
  },
  
  async loadDashboard() {
    try {
      const response = await fetch(`/api/dev/dashboard?code=${encodeURIComponent(this.adminCode)}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('Invalid admin code');
          return;
        }
        throw new Error('Failed to load dashboard');
      }
      
      const data = await response.json();
      this.dashboardData = data.dashboard;
      console.log('✅ [DevDashboard] Data loaded', this.dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      alert('Failed to load developer dashboard');
    }
  },
  
  async updateConfig(key, value, description, isSecret = false) {
    try {
      const response = await fetch('/api/dev/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Code': this.adminCode
        },
        body: JSON.stringify({ key, value, description, isSecret })
      });
      
      if (response.ok) {
        alert(`Config "${key}" updated successfully`);
        await this.loadDashboard();
        return true;
      } else {
        alert('Failed to update config');
        return false;
      }
    } catch (error) {
      console.error('Config update error:', error);
      alert('Error updating config');
      return false;
    }
  },
  
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num || 0);
  },
  
  formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
  },
  
  renderPage() {
    const d = this.dashboardData;
    if (!d) return '<div class="dev-loading">Loading developer dashboard...</div>';
    
    return `
      <div class="dev-dashboard">
        <div class="dev-header">
          <h1>🛠️ Developer Dashboard</h1>
          <p class="dev-subtitle">Full system control and monitoring</p>
        </div>
        
        <!-- Quick Stats Row -->
        <div class="dev-stats-row">
          <div class="dev-stat">
            <span class="dev-stat-value">${this.formatNumber(d.subscriptions?.total)}</span>
            <span class="dev-stat-label">Total Users</span>
          </div>
          <div class="dev-stat dev-stat-green">
            <span class="dev-stat-value">${this.formatCurrency(d.subscriptions?.monthlyRevenue)}</span>
            <span class="dev-stat-label">Monthly Revenue</span>
          </div>
          <div class="dev-stat dev-stat-blue">
            <span class="dev-stat-value">${this.formatNumber(d.auditTrail?.total)}</span>
            <span class="dev-stat-label">Audit Events</span>
          </div>
          <div class="dev-stat dev-stat-purple">
            <span class="dev-stat-value">${this.formatNumber(d.hallmarks?.total)}</span>
            <span class="dev-stat-label">Hallmarks</span>
          </div>
        </div>
        
        <!-- Accordion Sections -->
        <div class="accordion-container">
          
          <!-- Subscriptions -->
          <div class="accordion-item">
            <div class="accordion-header" onclick="DevDashboard.toggleAccordion(this)">
              <span class="accordion-icon">💳</span>
              <span class="accordion-title">Subscriptions</span>
              <span class="accordion-arrow">▼</span>
            </div>
            <div class="accordion-content">
              <div class="dev-grid-2">
                <div class="dev-info-box">
                  <label>Premium Users</label>
                  <span class="dev-value">${d.subscriptions?.premium || 0}</span>
                </div>
                <div class="dev-info-box">
                  <label>Basic Users</label>
                  <span class="dev-value">${d.subscriptions?.basic || 0}</span>
                </div>
                <div class="dev-info-box">
                  <label>Total Subscribers</label>
                  <span class="dev-value">${d.subscriptions?.total || 0}</span>
                </div>
                <div class="dev-info-box">
                  <label>Monthly Revenue</label>
                  <span class="dev-value dev-value-green">${this.formatCurrency(d.subscriptions?.monthlyRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Users & Sessions -->
          <div class="accordion-item">
            <div class="accordion-header" onclick="DevDashboard.toggleAccordion(this)">
              <span class="accordion-icon">👥</span>
              <span class="accordion-title">Users & Sessions</span>
              <span class="accordion-arrow">▼</span>
            </div>
            <div class="accordion-content">
              <div class="dev-grid-2">
                <div class="dev-info-box">
                  <label>Whitelisted Users</label>
                  <span class="dev-value">${d.users?.whitelisted || 0}</span>
                </div>
                <div class="dev-info-box">
                  <label>Active Sessions</label>
                  <span class="dev-value">${d.users?.activeSessions || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Audit Trail -->
          <div class="accordion-item">
            <div class="accordion-header" onclick="DevDashboard.toggleAccordion(this)">
              <span class="accordion-icon">🔗</span>
              <span class="accordion-title">Blockchain Audit Trail</span>
              <span class="accordion-arrow">▼</span>
            </div>
            <div class="accordion-content">
              <div class="dev-grid-3">
                <div class="dev-info-box">
                  <label>Total Events</label>
                  <span class="dev-value">${d.auditTrail?.total || 0}</span>
                </div>
                <div class="dev-info-box">
                  <label>Pending</label>
                  <span class="dev-value dev-value-yellow">${d.auditTrail?.pending || 0}</span>
                </div>
                <div class="dev-info-box">
                  <label>On-Chain</label>
                  <span class="dev-value dev-value-green">${d.auditTrail?.confirmed || 0}</span>
                </div>
              </div>
              <div class="dev-status-row">
                <span class="dev-status ${d.heliusConfigured ? 'dev-status-ok' : 'dev-status-warn'}">
                  ${d.heliusConfigured ? '✅ Helius API Configured' : '⚠️ Helius API Not Set'}
                </span>
                <span class="dev-status ${d.walletConfigured ? 'dev-status-ok' : 'dev-status-warn'}">
                  ${d.walletConfigured ? '✅ Solana Wallet Set' : '⏳ Waiting for Wallet'}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Hallmarks -->
          <div class="accordion-item">
            <div class="accordion-header" onclick="DevDashboard.toggleAccordion(this)">
              <span class="accordion-icon">🏆</span>
              <span class="accordion-title">Hallmark NFTs</span>
              <span class="accordion-arrow">▼</span>
            </div>
            <div class="accordion-content">
              <div class="dev-grid-2">
                <div class="dev-info-box">
                  <label>Total Minted</label>
                  <span class="dev-value">${d.hallmarks?.total || 0}</span>
                </div>
                <div class="dev-info-box">
                  <label>Revenue</label>
                  <span class="dev-value dev-value-green">${this.formatCurrency(d.hallmarks?.revenue)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- System Configuration -->
          <div class="accordion-item">
            <div class="accordion-header" onclick="DevDashboard.toggleAccordion(this)">
              <span class="accordion-icon">⚙️</span>
              <span class="accordion-title">System Configuration</span>
              <span class="accordion-arrow">▼</span>
            </div>
            <div class="accordion-content">
              <div class="dev-config-section">
                <h4>Current Config</h4>
                <div class="dev-config-list">
                  ${Object.keys(d.systemConfig || {}).length > 0 
                    ? Object.entries(d.systemConfig).map(([key, value]) => `
                        <div class="dev-config-item">
                          <span class="dev-config-key">${key}</span>
                          <span class="dev-config-value">${value}</span>
                        </div>
                      `).join('')
                    : '<p class="dev-empty">No configuration set</p>'
                  }
                </div>
                
                <h4>Add/Update Config</h4>
                <div class="dev-config-form">
                  <input type="text" id="configKey" placeholder="Key (e.g., solana_audit_wallet)" class="dev-input">
                  <input type="text" id="configValue" placeholder="Value" class="dev-input">
                  <input type="text" id="configDesc" placeholder="Description (optional)" class="dev-input">
                  <label class="dev-checkbox">
                    <input type="checkbox" id="configSecret"> Is Secret
                  </label>
                  <button onclick="DevDashboard.saveConfig()" class="dev-button">Save Config</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="accordion-item">
            <div class="accordion-header" onclick="DevDashboard.toggleAccordion(this)">
              <span class="accordion-icon">⚡</span>
              <span class="accordion-title">Quick Actions</span>
              <span class="accordion-arrow">▼</span>
            </div>
            <div class="accordion-content">
              <div class="dev-actions-grid">
                <button onclick="DevDashboard.loadDashboard()" class="dev-action-btn">
                  🔄 Refresh Data
                </button>
                <button onclick="window.open('/admin?code=' + DevDashboard.adminCode, '_blank')" class="dev-action-btn">
                  📊 Full Admin Panel
                </button>
                <button onclick="DevDashboard.testAuditEvent()" class="dev-action-btn">
                  🧪 Test Audit Event
                </button>
                <button onclick="window.location.reload()" class="dev-action-btn">
                  ↻ Reload Page
                </button>
              </div>
            </div>
          </div>
          
          <!-- Feature Inventory -->
          <div class="accordion-item accordion-item-large">
            <div class="accordion-header" onclick="DevDashboard.toggleAccordion(this)">
              <span class="accordion-icon">📋</span>
              <span class="accordion-title">Feature Inventory</span>
              <span class="accordion-badge">${FEATURE_CATEGORIES.reduce((sum, cat) => sum + cat.features.length, 0)} features</span>
              <span class="accordion-arrow">▼</span>
            </div>
            <div class="accordion-content">
              ${FeatureInventory.render()}
            </div>
          </div>
          
        </div>
      </div>
    `;
  },
  
  toggleAccordion(header) {
    const item = header.parentElement;
    const content = item.querySelector('.accordion-content');
    const arrow = header.querySelector('.accordion-arrow');
    
    const isOpen = content.classList.contains('accordion-open');
    
    if (isOpen) {
      content.classList.remove('accordion-open');
      arrow.style.transform = 'rotate(0deg)';
    } else {
      content.classList.add('accordion-open');
      arrow.style.transform = 'rotate(180deg)';
    }
  },
  
  async saveConfig() {
    const key = document.getElementById('configKey')?.value;
    const value = document.getElementById('configValue')?.value;
    const description = document.getElementById('configDesc')?.value;
    const isSecret = document.getElementById('configSecret')?.checked;
    
    if (!key || !value) {
      alert('Key and Value are required');
      return;
    }
    
    await this.updateConfig(key, value, description, isSecret);
  },
  
  async testAuditEvent() {
    try {
      const response = await fetch('/api/audit-trail/stats');
      const data = await response.json();
      alert(`Audit Trail Stats:\nTotal: ${data.stats?.totalEvents || 0}\nPending: ${data.stats?.pendingEvents || 0}\nConfirmed: ${data.stats?.confirmedEvents || 0}`);
    } catch (error) {
      alert('Failed to fetch audit stats');
    }
  }
};

// Export for global access
window.DevDashboard = DevDashboard;

console.log('✅ Developer Dashboard module loaded');
