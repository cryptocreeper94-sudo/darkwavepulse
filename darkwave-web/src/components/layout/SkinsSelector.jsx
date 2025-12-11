import { useState } from 'react';
import { useSkinsContext, getAvailableThemes, canAccessTheme } from '../../context/SkinsContext';
import { themeCategories, getThemesByCategory, FREE_THEMES } from '../../data/themes';

export default function SkinsSelector({ userTier, onClose }) {
  const { currentSkin, setSkin } = useSkinsContext();
  const [expandedCategories, setExpandedCategories] = useState(['classic']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectSkin = (skin) => {
    if (canAccessTheme(skin.id, userTier)) {
      setSkin(skin.id);
      if (onClose) onClose();
    }
  };

  const filteredThemes = searchQuery.trim() 
    ? Object.keys(themeCategories).reduce((acc, category) => {
        const themes = getThemesByCategory(category).filter(t => 
          t.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (themes.length > 0) acc[category] = themes;
        return acc;
      }, {})
    : null;

  const categoriesToShow = filteredThemes 
    ? Object.keys(filteredThemes)
    : Object.keys(themeCategories);

  return (
    <div className="skins-selector">
      <div className="skins-header">
        <h3>🎨 Skins</h3>
        <span className="skin-count">{getAvailableThemes(userTier).length} available</span>
      </div>

      <div className="skins-search">
        <input
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="skins-search-input"
        />
      </div>

      <div className="skins-categories">
        {categoriesToShow.map(category => {
          const categoryInfo = themeCategories[category];
          const themes = filteredThemes 
            ? filteredThemes[category] 
            : getThemesByCategory(category);
          const isExpanded = expandedCategories.includes(category) || searchQuery.trim();

          return (
            <div key={category} className="skin-category">
              <button 
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <span className="category-icon">{categoryInfo.icon}</span>
                <span className="category-name">{categoryInfo.name}</span>
                <span className="category-count">({themes.length})</span>
                <span className={`category-arrow ${isExpanded ? 'expanded' : ''}`}>
                  ▼
                </span>
              </button>

              {isExpanded && (
                <div className="category-themes">
                  {themes.map(skin => {
                    const isLocked = !canAccessTheme(skin.id, userTier);
                    const isActive = currentSkin.id === skin.id;

                    return (
                      <button
                        key={skin.id}
                        className={`skin-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                        onClick={() => handleSelectSkin(skin)}
                        disabled={isLocked}
                      >
                        {skin.watermark && (
                          <img 
                            src={skin.watermark} 
                            alt="" 
                            className="skin-logo"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div 
                          className="skin-preview"
                          style={{
                            background: `linear-gradient(135deg, ${getGradientColors(skin.colors.primary)})`
                          }}
                        />
                        <span className="skin-name">{skin.name}</span>
                        {isActive && <span className="skin-check">✓</span>}
                        {isLocked && <span className="skin-lock">🔒</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!canAccessTheme('bills', userTier) && (
        <div className="skins-upgrade-prompt">
          <p>🔓 Upgrade to RM tier to unlock 250+ team skins!</p>
        </div>
      )}

      <style>{`
        .skins-selector {
          padding: 8px 0;
        }
        .skins-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 8px;
        }
        .skins-header h3 {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary);
        }
        .skin-count {
          font-size: 11px;
          color: var(--text-muted);
        }
        .skins-search {
          padding: 0 12px 8px;
        }
        .skins-search-input {
          width: 100%;
          padding: 8px 12px;
          background: var(--bg-surface-2);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 13px;
        }
        .skins-search-input::placeholder {
          color: var(--text-muted);
        }
        .skins-categories {
          max-height: 400px;
          overflow-y: auto;
        }
        .skin-category {
          border-bottom: 1px solid var(--border-light);
        }
        .category-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
        }
        .category-header:hover {
          background: var(--bg-hover);
        }
        .category-icon {
          font-size: 16px;
        }
        .category-name {
          flex: 1;
        }
        .category-count {
          color: var(--text-muted);
          font-weight: 400;
          font-size: 12px;
        }
        .category-arrow {
          font-size: 10px;
          color: var(--text-muted);
          transition: transform 0.2s;
        }
        .category-arrow.expanded {
          transform: rotate(180deg);
        }
        .category-themes {
          padding: 4px 8px 8px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        .skin-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .skin-item:hover:not(.locked) {
          background: var(--bg-hover);
          border-color: var(--neon-blue);
        }
        .skin-item.active {
          border-color: var(--neon-green);
          background: rgba(57, 255, 20, 0.1);
        }
        .skin-item.locked {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .skin-logo {
          width: 20px;
          height: 20px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .skin-preview {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .skin-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .skin-check {
          color: var(--neon-green);
          font-size: 14px;
        }
        .skin-lock {
          font-size: 12px;
        }
        .skins-upgrade-prompt {
          padding: 12px;
          text-align: center;
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(57, 255, 20, 0.1));
          border-top: 1px solid var(--border-color);
          margin-top: 8px;
        }
        .skins-upgrade-prompt p {
          margin: 0;
          font-size: 12px;
          color: var(--neon-blue);
        }
      `}</style>
    </div>
  );
}

function getGradientColors(gradientClass) {
  const colorMap = {
    'from-blue-900': '#1e3a8a',
    'from-red-900': '#7f1d1d',
    'from-green-900': '#14532d',
    'from-purple-900': '#581c87',
    'from-orange-900': '#7c2d12',
    'from-yellow-700': '#a16207',
    'from-yellow-800': '#854d0e',
    'from-teal-900': '#134e4a',
    'from-black': '#000000',
    'from-slate-900': '#0f172a',
    'from-slate-100': '#f1f5f9',
    'from-amber-900': '#78350f',
    'from-amber-800': '#92400e',
    'from-sky-800': '#075985',
    'from-pink-800': '#9d174d',
    'from-indigo-900': '#312e81',
    'via-red-800': '#991b1b',
    'via-blue-800': '#1e40af',
    'via-green-800': '#166534',
    'via-yellow-700': '#a16207',
    'via-yellow-800': '#854d0e',
    'via-orange-700': '#c2410c',
    'via-orange-800': '#9a3412',
    'via-slate-800': '#1e293b',
    'via-black': '#000000',
    'via-purple-800': '#6b21a8',
    'via-teal-800': '#115e59',
    'via-amber-800': '#92400e',
    'to-blue-900': '#1e3a8a',
    'to-red-900': '#7f1d1d',
    'to-green-900': '#14532d',
    'to-purple-900': '#581c87',
    'to-orange-900': '#7c2d12',
    'to-yellow-700': '#a16207',
    'to-teal-900': '#134e4a',
    'to-black': '#000000',
    'to-slate-900': '#0f172a',
    'to-slate-100': '#f1f5f9',
    'to-amber-900': '#78350f',
    'to-sky-800': '#075985',
    'to-pink-800': '#9d174d',
    'to-indigo-900': '#312e81',
  };

  const parts = gradientClass.split(' ');
  const colors = parts.map(part => colorMap[part] || '#1e3a8a').filter(Boolean);
  
  if (colors.length >= 3) {
    return `${colors[0]}, ${colors[1]}, ${colors[2]}`;
  } else if (colors.length === 2) {
    return `${colors[0]}, ${colors[1]}`;
  }
  return `${colors[0] || '#1e3a8a'}, ${colors[0] || '#1e3a8a'}`;
}
