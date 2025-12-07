// ═══════════════════════════════════════════════════════════════
// 📚 DarkWave Pulse - Glossary Service
// Provides persona-aware definitions for all financial terms
// ═══════════════════════════════════════════════════════════════

class GlossaryService {
  constructor() {
    this.glossaryData = GLOSSARY_DATA || {};
    this.currentPersona = 'business'; // business, casual, or off
  }

  setPersona(persona) {
    this.currentPersona = persona;
  }

  /**
   * Get definition for a term with persona-aware commentary
   * @param {string} term - The term to look up
   * @returns {Object|null} - {term, definition, commentary, category} or null
   */
  getDefinition(term) {
    // Normalize term for lookup
    const normalizedTerm = this.normalizeTerm(term);
    const data = this.glossaryData[normalizedTerm];
    
    if (!data) {
      return null;
    }

    // Use plain definition as the base, smartass for commentary
    const definition = data.plain || '';
    const commentary = this.getCommentary(data);

    return {
      term: normalizedTerm,
      definition,
      commentary,
      category: data.category || 'General'
    };
  }

  /**
   * Get persona-aware commentary
   */
  getCommentary(data) {
    if (this.currentPersona === 'casual') {
      return data.smartass || data.plain || '';
    } else if (this.currentPersona === 'business') {
      // For business mode, return professional-styled version
      return `${data.plain || ''}`;
    } else {
      // Off mode - no commentary, just definition
      return '';
    }
  }

  /**
   * Normalize term for glossary lookup
   */
  normalizeTerm(term) {
    // Remove special characters and extra whitespace
    let normalized = term.trim();
    
    // Handle common variations
    const termMap = {
      // Technical indicators
      'EMA': 'EMA',
      'EMA (50-day)': 'EMA',
      'EMA (200-day)': 'EMA',
      'SMA': 'SMA',
      'SMA (50-day)': 'SMA',
      'SMA (200-day)': 'SMA',
      'RSI': 'RSI',
      'RSI (14-day)': 'RSI',
      'MACD': 'MACD',
      'All-Time High': 'ATH',
      'ATH': 'ATH',
      'ATH Date': 'ATH',
      'From ATH': 'ATH',
      'Golden Cross': 'Golden Cross',
      'Death Cross': 'Death Cross',
      // Market metrics
      'Market Cap': 'Market Cap',
      'Volume': 'Volume',
      '24H Volume': 'Volume',
      'Fear & Greed': 'Fear and Greed Index',
      'Altcoin Season': 'Altcoin Season Index',
      // Stock indices
      'NASDAQ': 'NASDAQ',
      'NASDAQ Composite': 'NASDAQ',
      'Dow Jones': 'Dow Jones',
      'Dow Jones Industrial Average': 'Dow Jones',
      'DJI': 'Dow Jones',
      'S&P 500': 'S&P 500',
      'S&P 500 Index': 'S&P 500',
      // Stock metrics
      'Market Breadth': 'Market Breadth',
      'Bullish': 'Bull Market',
      'Bearish': 'Bear Market',
      'Neutral': 'Neutral',
      'P/E Ratio': 'P/E Ratio',
      'Earnings': 'Earnings',
      'Dividend': 'Dividend'
    };

    return termMap[normalized] || normalized;
  }

  /**
   * Check if a term exists in the glossary
   */
  hasTerm(term) {
    const normalized = this.normalizeTerm(term);
    return !!this.glossaryData[normalized];
  }

  /**
   * Get all glossary terms
   */
  getAllTerms() {
    return Object.keys(this.glossaryData);
  }
}

// Create global singleton instance
window.glossaryService = new GlossaryService();
