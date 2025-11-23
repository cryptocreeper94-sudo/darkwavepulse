// Theme Manager - Unified Theme Control System with Tier-Based Access
window.themeManager = {
  async openThemeSelector() {
    const modal = document.getElementById('themeSelectorModal');
    if (!modal) {
      await this.createThemeSelectorModal();
    }
    const m = document.getElementById('themeSelectorModal');
    if (m) {
      m.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  },

  closeThemeSelector() {
    const modal = document.getElementById('themeSelectorModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  },

  async getSubscriptionTier() {
    try {
      const userId = window.currentUser?.id || localStorage.getItem('userId');
      if (!userId) return 'trial';

      const res = await fetch(`/api/user/profile`, {
        headers: { 'x-user-id': userId }
      });
      
      if (!res.ok) return 'trial';
      const data = await res.json();
      return data.subscription_tier || 'trial';
    } catch (e) {
      return 'trial';
    }
  },

  isSubscriber(tier) {
    return tier && tier !== 'trial';
  },

  async createThemeSelectorModal() {
    if (!window.THEMES_CONFIG) {
      console.warn('⚠️ THEMES_CONFIG not loaded');
      return;
    }

    const tier = await this.getSubscriptionTier();
    const isSubscriber = this.isSubscriber(tier);

    let html = `<div id="themeSelectorModal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; align-items: center; justify-content: center;">
      <div style="background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; max-width: 90vw; max-height: 90vh; overflow-y: auto; padding: 30px; width: 100%; max-width: 1000px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <div>
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: white;">Customize Your Theme</h2>
            ${!isSubscriber ? '<p style="margin: 0; font-size: 12px; color: #60a5fa;">Subscribe to unlock sports team themes</p>' : ''}
          </div>
          <button onclick="themeManager.closeThemeSelector()" style="background: transparent; border: none; font-size: 28px; color: #888; cursor: pointer; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">×</button>
        </div>`;

    Object.entries(window.THEMES_CONFIG).forEach(([categoryKey, category]) => {
      const requiresSubscription = category.requiresSubscription;
      const isCategoryLocked = requiresSubscription && !isSubscriber;
      
      if (isCategoryLocked) {
        html += `<div style="margin-bottom: 30px; opacity: 0.5; pointer-events: none;">
          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 15px;">
            ${category.label} 🔒
          </h3>
          <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; font-size: 12px; color: #aaa;">
            Subscribe to unlock ${category.label} themes
          </div>
        </div>`;
        return;
      }

      html += `<div style="margin-bottom: 30px;">
        <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #60a5fa; margin-bottom: 15px;">${category.label}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 12px;">`;

      if (category.themes) {
        Object.entries(category.themes).forEach(([themeKey, theme]) => {
          const themeClass = categoryKey.includes('college') || categoryKey.includes('nfl') || categoryKey.includes('nba') || categoryKey.includes('mlb') || categoryKey.includes('nhl') || categoryKey.includes('soccer')
            ? `theme-${categoryKey}-${themeKey}`
            : `theme-${themeKey}`;
          
          const displayName = theme.name || theme.displayName || themeKey;
          const displayIcon = theme.icon || theme.logo || '🎨';
          const bgColor = theme.color || theme.colors?.bg || '#1a1a1a';
          
          html += `<button onclick="themeManager.applyTheme('${themeClass}')" style="background: ${bgColor}; border: 2px solid rgba(96, 165, 250, 0.3); border-radius: 8px; padding: 12px; cursor: pointer; color: white; text-align: center; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 100px; font-size: 12px; font-weight: 600;">
            <div style="font-size: 28px;">${displayIcon}</div>
            <div style="line-height: 1.2;">${displayName}</div>
          </button>`;
        });
      }
      
      html += `</div></div>`;
    });

    html += `</div></div>`;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.getElementById('app').appendChild(tempDiv.firstElementChild);
  },

  applyTheme(themeClass) {
    // Preserve commentary mode when changing theme
    const savedCommentaryMode = window.currentCatMode || 'off';
    
    document.body.className = themeClass;
    localStorage.setItem('selectedTheme', themeClass);
    
    // Restore commentary mode
    window.currentCatMode = savedCommentaryMode;
    
    // Force chart redraw to ensure visibility
    setTimeout(() => {
      if (window.dashboardCandleChart) {
        window.dashboardCandleChart.applyOptions({ timeScale: { timeVisible: true, secondsVisible: false } });
      }
      if (window.dashboardSparklineChart) {
        window.dashboardSparklineChart.applyOptions({ timeScale: { timeVisible: true, secondsVisible: false } });
      }
      if (window.analysisChart) {
        window.analysisChart.applyOptions({ timeScale: { timeVisible: true, secondsVisible: false } });
      }
    }, 100);
    
    const userId = window.currentUser?.id || localStorage.getItem('userId');
    if (userId) {
      fetch('/api/user/update-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ theme: themeClass })
      }).catch(err => console.log('Theme save:', err));
    }
    
    this.closeThemeSelector();
  },

  async loadThemeFromBackend() {
    const userId = window.currentUser?.id || localStorage.getItem('userId');
    if (!userId) {
      this.loadLocalTheme();
      return;
    }

    try {
      const res = await fetch(`/api/user/profile`, {
        headers: { 'x-user-id': userId }
      });
      
      if (!res.ok) {
        this.loadLocalTheme();
        return;
      }

      const data = await res.json();
      const theme = data.theme_preference || localStorage.getItem('selectedTheme') || 'theme-dark';
      document.body.className = theme;
      localStorage.setItem('selectedTheme', theme);
    } catch (e) {
      this.loadLocalTheme();
    }
  },

  loadLocalTheme() {
    const saved = localStorage.getItem('selectedTheme') || 'theme-dark';
    document.body.className = saved;
  },

  async getUserTierFromBackend() {
    const userId = window.currentUser?.id || localStorage.getItem('userId');
    if (!userId) return 'trial';

    try {
      const res = await fetch(`/api/user/profile`, {
        headers: { 'x-user-id': userId }
      });
      
      if (!res.ok) return 'trial';
      const data = await res.json();
      return data.subscription_tier || 'trial';
    } catch (e) {
      return 'trial';
    }
  }
};

// Load theme when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  themeManager.loadLocalTheme();
});
