/**
 * Chart Enhancer - Integrates indicator manager with analysis modal
 * Seamlessly adds toggle controls to existing TradingView charts
 */

const chartEnhancer = {
  indicatorManager: null,
  
  /**
   * Initialize and integrate indicator controls into analysis modal
   */
  init(chartContainer) {
    if (!chartContainer) {
      console.warn('⚠️ Chart container not found');
      return;
    }

    // Create the indicator manager instance
    this.indicatorManager = new ChartIndicatorManager(chartContainer);
    
    // Create and inject the control UI
    this.indicatorManager.createIndicatorControls();
    
    console.log('✅ Chart enhancer initialized with indicator controls');
  },

  /**
   * Connect to TradingView chart instance
   */
  setChart(chart) {
    if (this.indicatorManager) {
      this.indicatorManager.setChart(chart);
      console.log('✅ Chart connected to indicator manager');
    }
  },

  /**
   * Update with price data when chart changes
   */
  updatePriceData(priceData) {
    if (this.indicatorManager) {
      this.indicatorManager.setPriceData(priceData);
    }
  },

  /**
   * Get active indicators for analytics
   */
  getActiveIndicators() {
    return this.indicatorManager ? Array.from(this.indicatorManager.activeIndicators) : [];
  }
};

// Make available globally
window.chartEnhancer = chartEnhancer;
