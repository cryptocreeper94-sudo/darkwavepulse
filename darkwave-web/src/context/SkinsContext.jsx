import { createContext, useContext, useState, useEffect } from 'react';
import { allThemes, FREE_THEMES, getThemeById } from '../data/themes';

const SkinsContext = createContext(null);

const STORAGE_KEY = 'pulse_skin_id';

export function SkinsProvider({ children }) {
  const [currentSkin, setCurrentSkin] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        const found = getThemeById(savedId);
        if (found) return found;
      }
    }
    return getThemeById('classic-dark') || allThemes[0];
  });

  const setSkin = (skinId) => {
    const skin = getThemeById(skinId);
    if (skin) {
      setCurrentSkin(skin);
      localStorage.setItem(STORAGE_KEY, skinId);
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentSkin.id);
  }, [currentSkin]);

  return (
    <SkinsContext.Provider value={{ currentSkin, setSkin, allThemes }}>
      {children}
    </SkinsContext.Provider>
  );
}

export function useSkinsContext() {
  const context = useContext(SkinsContext);
  if (!context) {
    throw new Error('useSkinsContext must be used within a SkinsProvider');
  }
  return context;
}

export function getAvailableThemes(userTier) {
  const premiumTiers = ['RM', 'FOUNDER', 'ADMIN', 'OWNER'];
  
  if (userTier && premiumTiers.includes(userTier.toUpperCase())) {
    return allThemes;
  }
  
  return allThemes.filter(theme => FREE_THEMES.includes(theme.id));
}

export function canAccessTheme(themeId, userTier) {
  if (FREE_THEMES.includes(themeId)) {
    return true;
  }
  
  const premiumTiers = ['RM', 'FOUNDER', 'ADMIN', 'OWNER'];
  return userTier && premiumTiers.includes(userTier.toUpperCase());
}
