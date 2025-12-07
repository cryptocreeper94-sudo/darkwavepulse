// Advanced Theme Selector for Comprehensive Branding System
function openThemeSelector() {
  const modal = document.getElementById('themeSelectorModal');
  if (!modal) {
    createThemeSelectorModal();
  }
  document.getElementById('themeSelectorModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeThemeSelector() {
  const modal = document.getElementById('themeSelectorModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function createThemeSelectorModal() {
  let html = `<div id="themeSelectorModal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; align-items: center; justify-content: center;">
    <div style="background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; max-width: 90vw; max-height: 90vh; overflow-y: auto; padding: 30px; width: 100%; max-width: 1000px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">Customize Your Theme</h2>
        <button onclick="closeThemeSelector()" style="background: transparent; border: none; font-size: 28px; color: #888; cursor: pointer; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">×</button>
      </div>`;

  // Render all theme categories
  Object.entries(THEMES_CONFIG).forEach(([categoryKey, category]) => {
    html += `<div style="margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #60a5fa; margin-bottom: 15px;">${category.label}</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">`;

    if (category.themes) {
      Object.entries(category.themes).forEach(([themeKey, theme]) => {
        const themeClass = categoryKey.includes('college') || categoryKey.includes('nfl') || categoryKey.includes('nba') || categoryKey.includes('mlb') || categoryKey.includes('nhl') || categoryKey.includes('soccer')
          ? `theme-${categoryKey}-${themeKey}`
          : `theme-${themeKey}`;
        
        const displayName = theme.name || theme.displayName;
        const displayIcon = theme.icon || theme.logo || '🎨';
        const bgColor = theme.color || theme.colors?.bg || '#1a1a1a';
        
        html += `<button onclick="applyTheme('${themeClass}')" style="background: ${bgColor}; border: 2px solid rgba(96, 165, 250, 0.3); border-radius: 8px; padding: 12px; cursor: pointer; color: white; text-align: center; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 100px;">
          <div style="font-size: 28px;">${displayIcon}</div>
          <div style="font-size: 11px; font-weight: 600; line-height: 1.3;">${displayName}</div>
        </button>`;
      });
    }
    
    html += `</div></div>`;
  });

  html += `</div></div>`;
  
  // Insert modal
  const container = document.getElementById('app') || document.body;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  container.appendChild(tempDiv.firstElementChild);
}

function applyTheme(themeClass) {
  document.body.className = themeClass;
  localStorage.setItem('selectedTheme', themeClass);
  
  // Update theme preference in database
  const userId = window.currentUser?.id || localStorage.getItem('userId');
  if (userId) {
    fetch('/api/user/update-theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'Cookie': document.cookie
      },
      body: JSON.stringify({ theme: themeClass })
    }).catch(err => console.error('Theme save error:', err));
  }
  
  closeThemeSelector();
}

function loadTheme() {
  const savedTheme = localStorage.getItem('selectedTheme') || 'theme-dark';
  document.body.className = savedTheme;
}

// Load theme on page load
document.addEventListener('DOMContentLoaded', loadTheme);

window.openThemeSelector = openThemeSelector;
window.closeThemeSelector = closeThemeSelector;
window.applyTheme = applyTheme;
