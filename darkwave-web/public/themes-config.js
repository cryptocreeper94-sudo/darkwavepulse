// Comprehensive Theme System with Nature, Lifestyle, and Sports Branding
const THEMES_CONFIG = {
  nature: {
    label: 'Nature & Cosmos',
    requiresSubscription: false,
    themes: {
      'space': {
        name: 'Deep Space',
        description: 'Cosmic depths with cosmic stars',
        icon: '🌌',
        requiresSubscription: false,
        colors: { bg: '#0B0C10', accent: '#66FCF1', primary: '#1F2833' },
        watermark: '/themes/stars-bg.png'
      },
      'space-nebula': {
        name: 'Nebula Dreams',
        description: 'Colorful cosmic nebula',
        icon: '🎆',
        requiresSubscription: false,
        colors: { bg: '#0a0e27', accent: '#a78bfa', primary: '#1e1b4b' },
        watermark: '/themes/nebula.png'
      },
      'paisley': {
        name: 'Paisley Garden',
        description: 'Ornate paisley watermarks',
        icon: '🌀',
        requiresSubscription: false,
        colors: { bg: '#1a0f1f', accent: '#d8a8ff', primary: '#2d1b2e' },
        watermark: '/themes/paisley.png'
      },
      'countryside': {
        name: 'Countryside Sunrise',
        description: 'Sunny day in the countryside',
        icon: '🌄',
        requiresSubscription: false,
        colors: { bg: '#2A2416', accent: '#FFA726', primary: '#3D3420' },
        watermark: '/themes/countryside.png'
      },
      'forest': {
        name: 'Forest Canopy',
        description: 'Dense forest with green hues',
        icon: '🌲',
        requiresSubscription: false,
        colors: { bg: '#0f1419', accent: '#4ecca3', primary: '#1a2f2a' },
        watermark: '/themes/forest.png'
      },
      'ocean': {
        name: 'Deep Ocean',
        description: 'Blue ocean depths',
        icon: '🌊',
        requiresSubscription: false,
        colors: { bg: '#0d1b2a', accent: '#00bcd4', primary: '#1a2633' },
        watermark: '/themes/ocean.png'
      }
    }
  },
  lifestyle: {
    label: 'Lifestyle & Culture',
    requiresSubscription: false,
    themes: {
      'dark': {
        name: 'Professional Dark',
        description: 'Clean professional look',
        icon: '💼',
        requiresSubscription: false,
        colors: { bg: '#000000', accent: '#3861FB', primary: '#1A1A1A' },
        watermark: null
      },
      'light': {
        name: 'Professional Light',
        description: 'Bright professional look',
        icon: '☀️',
        requiresSubscription: false,
        colors: { bg: '#D4D4D4', accent: '#3861FB', primary: '#E8E8E8' },
        watermark: null
      },
      'cyberpunk': {
        name: 'Cyberpunk Neon',
        description: 'Futuristic neon vibes',
        icon: '⚡',
        requiresSubscription: false,
        colors: { bg: '#0a0a0a', accent: '#ff00ff', primary: '#1a0a1a' },
        watermark: '/themes/cyberpunk-grid.png'
      },
      'retro': {
        name: 'Retro Arcade',
        description: '80s arcade aesthetic',
        icon: '👾',
        requiresSubscription: false,
        colors: { bg: '#1a1a2e', accent: '#ff006e', primary: '#16213e' },
        watermark: '/themes/arcade-grid.png'
      }
    }
  },
  college_sports: {
    label: 'College Sports',
    requiresSubscription: true,
    themes: {
      'alabama': { name: 'Alabama Crimson Tide', icon: '🏈', requiresSubscription: true, color: '#A00000', logo: '🅰️' },
      'clemson': { name: 'Clemson Tigers', icon: '🐯', requiresSubscription: true, color: '#F66733', logo: '🐯' },
      'georgia': { name: 'Georgia Bulldogs', icon: '🐕', requiresSubscription: true, color: '#BA0000', logo: '🐕' },
      'lsu': { name: 'LSU Tigers', icon: '🐯', requiresSubscription: true, color: '#FDD835', logo: '🐯' },
      'ohio-state': { name: 'Ohio State Buckeyes', icon: '🏈', requiresSubscription: true, color: '#BA0000', logo: '🅾️' },
      'oklahoma': { name: 'Oklahoma Sooners', icon: '🏈', requiresSubscription: true, color: '#B22234', logo: '🏈' },
      'texas': { name: 'Texas Longhorns', icon: '🐂', requiresSubscription: true, color: '#BF5700', logo: '🐂' },
      'usc': { name: 'USC Trojans', icon: '🛡️', requiresSubscription: true, color: '#990000', logo: '⚔️' },
      'notre-dame': { name: 'Notre Dame Fighting Irish', icon: '☘️', requiresSubscription: true, color: '#0C2340', logo: '☘️' },
      'duke': { name: 'Duke Blue Devils', icon: '👿', requiresSubscription: true, color: '#003366', logo: '👿' }
    }
  },
  nfl: {
    label: 'NFL Teams',
    requiresSubscription: true,
    themes: {
      'patriots': { name: 'New England Patriots', icon: '🏈', requiresSubscription: true, color: '#002244', logo: '🇺🇸' },
      'chiefs': { name: 'Kansas City Chiefs', icon: '👑', requiresSubscription: true, color: '#E31828', logo: '👑' },
      '49ers': { name: 'San Francisco 49ers', icon: '🏈', requiresSubscription: true, color: '#AA0000', logo: '4️⃣' },
      'cowboys': { name: 'Dallas Cowboys', icon: '🤠', requiresSubscription: true, color: '#003594', logo: '⭐' },
      'packers': { name: 'Green Bay Packers', icon: '📦', requiresSubscription: true, color: '#203731', logo: '🧀' },
      'ravens': { name: 'Baltimore Ravens', icon: '🐦', requiresSubscription: true, color: '#241773', logo: '🐦' },
      'steelers': { name: 'Pittsburgh Steelers', icon: '⚙️', requiresSubscription: true, color: '#27251F', logo: '⚙️' },
      'broncos': { name: 'Denver Broncos', icon: '🐴', requiresSubscription: true, color: '#FB4F14', logo: '🐴' }
    }
  },
  nba: {
    label: 'NBA Teams',
    requiresSubscription: true,
    themes: {
      'lakers': { name: 'LA Lakers', icon: '🏀', requiresSubscription: true, color: '#1D428A', logo: '🏀' },
      'celtics': { name: 'Boston Celtics', icon: '☘️', requiresSubscription: true, color: '#007A33', logo: '☘️' },
      'warriors': { name: 'Golden State Warriors', icon: '⚔️', requiresSubscription: true, color: '#1D428A', logo: '⚔️' },
      'heat': { name: 'Miami Heat', icon: '🔥', requiresSubscription: true, color: '#98002E', logo: '🔥' },
      'bulls': { name: 'Chicago Bulls', icon: '🐂', requiresSubscription: true, color: '#CE1141', logo: '🐂' },
      'nets': { name: 'Brooklyn Nets', icon: '🕸️', requiresSubscription: true, color: '#000000', logo: '🕸️' }
    }
  },
  mlb: {
    label: 'MLB Teams',
    requiresSubscription: true,
    themes: {
      'yankees': { name: 'New York Yankees', icon: '⚾', requiresSubscription: true, color: '#0C2C56', logo: '🆈' },
      'redsox': { name: 'Boston Red Sox', icon: '⚾', requiresSubscription: true, color: '#BD3039', logo: '🔴' },
      'dodgers': { name: 'Los Angeles Dodgers', icon: '⚾', requiresSubscription: true, color: '#005A9C', logo: '🔵' },
      'cubs': { name: 'Chicago Cubs', icon: '⚾', requiresSubscription: true, color: '#0E3386', logo: '🐻' }
    }
  },
  nhl: {
    label: 'NHL Teams',
    requiresSubscription: true,
    themes: {
      'penguins': { name: 'Pittsburgh Penguins', icon: '🏒', requiresSubscription: true, color: '#27251F', logo: '🐧' },
      'kings': { name: 'LA Kings', icon: '🏒', requiresSubscription: true, color: '#111111', logo: '👑' },
      'avalanche': { name: 'Colorado Avalanche', icon: '🏒', requiresSubscription: true, color: '#6F263D', logo: '❄️' },
      'rangers': { name: 'NY Rangers', icon: '🏒', requiresSubscription: true, color: '#0038A8', logo: '⚔️' }
    }
  },
  soccer: {
    label: 'Soccer / Football',
    requiresSubscription: true,
    themes: {
      'manchester-united': { name: 'Manchester United', icon: '⚽', requiresSubscription: true, color: '#DA291C', logo: '🔴' },
      'barcelona': { name: 'FC Barcelona', icon: '⚽', requiresSubscription: true, color: '#004687', logo: '🔵' },
      'real-madrid': { name: 'Real Madrid', icon: '⚽', requiresSubscription: true, color: '#FFFFFF', logo: '👑' },
      'liverpool': { name: 'Liverpool FC', icon: '⚽', requiresSubscription: true, color: '#C8102E', logo: '🐦' }
    }
  }
};

window.THEMES_CONFIG = THEMES_CONFIG;
