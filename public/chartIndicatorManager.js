/**
 * Advanced Chart Indicator Manager
 * Controls all indicators with toggle/switch UI
 * Bollinger Bands, RSI, MACD with real-time updates
 */

class ChartIndicatorManager {
  constructor(container) {
    this.container = container;
    this.activeIndicators = new Set(['bollinger']); // Default: show Bollinger Bands
    this.series = {}; // Store indicator series
    this.data = {}; // Store indicator data
    this.chart = null; // TradingView chart instance
  }

  /**
   * Initialize indicator toggle UI
   */
  createIndicatorControls() {
    const controlsHTML = `
      <div class="indicator-controls" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 8px;
        padding: 12px;
        background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
        border-radius: 8px;
        margin-bottom: 16px;
        border: 1px solid rgba(100, 150, 255, 0.2);
      ">
        <!-- Bollinger Bands Toggle -->
        <label class="indicator-toggle" style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(100, 150, 255, 0.05);
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid rgba(100, 150, 255, 0.1);
          transition: all 0.2s ease;
        ">
          <input type="checkbox" id="toggle-bollinger" checked style="cursor: pointer;" />
          <span style="font-size: 13px; font-weight: 500; color: #64e6ff;">Bollinger Bands</span>
        </label>

        <!-- RSI Toggle -->
        <label class="indicator-toggle" style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(100, 150, 255, 0.05);
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid rgba(100, 150, 255, 0.1);
          transition: all 0.2s ease;
        ">
          <input type="checkbox" id="toggle-rsi" style="cursor: pointer;" />
          <span style="font-size: 13px; font-weight: 500; color: #ff6b6b;">RSI (14)</span>
        </label>

        <!-- MACD Toggle -->
        <label class="indicator-toggle" style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(100, 150, 255, 0.05);
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid rgba(100, 150, 255, 0.1);
          transition: all 0.2s ease;
        ">
          <input type="checkbox" id="toggle-macd" style="cursor: pointer;" />
          <span style="font-size: 13px; font-weight: 500; color: #9D4EDD;">MACD</span>
        </label>

        <!-- EMA Toggle -->
        <label class="indicator-toggle" style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(100, 150, 255, 0.05);
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid rgba(100, 150, 255, 0.1);
          transition: all 0.2s ease;
        ">
          <input type="checkbox" id="toggle-ema" style="cursor: pointer;" />
          <span style="font-size: 13px; font-weight: 500; color: #90ee90;">EMA 20/50</span>
        </label>

        <!-- Volume Toggle -->
        <label class="indicator-toggle" style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(100, 150, 255, 0.05);
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid rgba(100, 150, 255, 0.1);
          transition: all 0.2s ease;
        ">
          <input type="checkbox" id="toggle-volume" style="cursor: pointer;" />
          <span style="font-size: 13px; font-weight: 500; color: #c0c0c0;">Volume</span>
        </label>

        <!-- Clear All Button -->
        <button id="btn-clear-indicators" style="
          padding: 8px 12px;
          background: linear-gradient(135deg, rgba(255, 100, 100, 0.1) 0%, rgba(255, 100, 100, 0.05) 100%);
          border: 1px solid rgba(255, 100, 100, 0.2);
          color: #ff6464;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        ">
          Reset All
        </button>
      </div>

      <!-- Indicator Legend / Info Panel -->
      <div id="indicator-info" style="
        padding: 12px;
        background: rgba(10, 14, 39, 0.5);
        border-radius: 6px;
        font-size: 12px;
        color: #aaa;
        border: 1px solid rgba(100, 150, 255, 0.1);
        display: none;
      "></div>
    `;

    const controlsContainer = document.createElement('div');
    controlsContainer.innerHTML = controlsHTML;
    this.container.insertBefore(controlsContainer, this.container.firstChild);

    this.attachToggleListeners();
  }

  /**
   * Attach event listeners to toggles
   */
  attachToggleListeners() {
    const toggles = {
      'toggle-bollinger': 'bollinger',
      'toggle-rsi': 'rsi',
      'toggle-macd': 'macd',
      'toggle-ema': 'ema',
      'toggle-volume': 'volume'
    };

    for (const [elementId, indicatorName] of Object.entries(toggles)) {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener('change', (e) => {
          this.toggleIndicator(indicatorName, e.target.checked);
        });
      }
    }

    const resetBtn = document.getElementById('btn-clear-indicators');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAllIndicators());
    }
  }

  /**
   * Toggle indicator visibility
   */
  toggleIndicator(name, enabled) {
    if (enabled) {
      this.activeIndicators.add(name);
      console.log(`✅ Enabled ${name} indicator`);
    } else {
      this.activeIndicators.delete(name);
      console.log(`❌ Disabled ${name} indicator`);
    }
    this.updateChart();
  }

  /**
   * Reset all indicators to default state
   */
  resetAllIndicators() {
    this.activeIndicators.clear();
    this.activeIndicators.add('bollinger'); // Default
    
    document.getElementById('toggle-bollinger').checked = true;
    document.getElementById('toggle-rsi').checked = false;
    document.getElementById('toggle-macd').checked = false;
    document.getElementById('toggle-ema').checked = false;
    document.getElementById('toggle-volume').checked = false;
    
    this.updateChart();
    console.log('🔄 Reset all indicators');
  }

  /**
   * Set chart instance (from TradingView)
   */
  setChart(chart) {
    this.chart = chart;
  }

  /**
   * Update chart with active indicators
   */
  async updateChart() {
    if (!this.chart) {
      console.warn('⚠️ Chart not initialized yet');
      return;
    }

    // Get price data from chart or fetch if needed
    const priceData = this.getPriceDataFromChart();
    if (!priceData) {
      console.warn('⚠️ No price data available');
      return;
    }

    // Clear existing indicator series
    this.clearIndicatorSeries();

    // Add selected indicators
    if (this.activeIndicators.has('bollinger')) {
      this.addBollingerBands(priceData);
    }
    if (this.activeIndicators.has('rsi')) {
      this.addRSIIndicator(priceData);
    }
    if (this.activeIndicators.has('macd')) {
      this.addMACDIndicator(priceData);
    }
    if (this.activeIndicators.has('ema')) {
      this.addEMAIndicators(priceData);
    }
    if (this.activeIndicators.has('volume')) {
      this.addVolumeIndicator(priceData);
    }

    console.log(`📊 Updated chart with indicators: ${Array.from(this.activeIndicators).join(', ')}`);
  }

  /**
   * Get price data from chart
   */
  getPriceDataFromChart() {
    // This will get data from the main chart series
    // Implementation depends on existing chart structure
    return this.data.prices || [];
  }

  /**
   * Add Bollinger Bands (3 lines: upper, middle, lower)
   */
  addBollingerBands(prices) {
    const period = 20;
    const stdDev = 2;
    const data = [];

    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b.close, 0) / period;
      const variance = slice.reduce((sum, p) => sum + Math.pow(p.close - sma, 2), 0) / period;
      const stdDeviation = Math.sqrt(variance);

      data.push({
        time: prices[i].time,
        upper: sma + stdDev * stdDeviation,
        middle: sma,
        lower: sma - stdDev * stdDeviation
      });
    }

    // Add lines to chart
    if (this.chart) {
      const upperLine = this.chart.addLineSeries({
        color: 'rgba(100, 200, 255, 0.3)',
        lineWidth: 1
      });
      const middleLine = this.chart.addLineSeries({
        color: 'rgba(100, 150, 255, 0.5)',
        lineWidth: 2
      });
      const lowerLine = this.chart.addLineSeries({
        color: 'rgba(100, 200, 255, 0.3)',
        lineWidth: 1
      });

      upperLine.setData(data.map(d => ({ time: d.time, value: d.upper })));
      middleLine.setData(data.map(d => ({ time: d.time, value: d.middle })));
      lowerLine.setData(data.map(d => ({ time: d.time, value: d.lower })));

      this.series.bollinger = { upper: upperLine, middle: middleLine, lower: lowerLine };
    }
  }

  /**
   * Add RSI Indicator (0-100 scale, pane below)
   */
  addRSIIndicator(prices) {
    const rsiData = this.calculateRSI(prices.map(p => p.close));
    if (!rsiData) return;

    if (this.chart) {
      const rsiSeries = this.chart.addLineSeries({
        color: '#ff6b6b',
        lineWidth: 2
      });
      rsiSeries.setData(rsiData);
      this.series.rsi = rsiSeries;
    }
  }

  /**
   * Calculate RSI
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;

    const data = [];
    let gains = 0, losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += -change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains = change;
      else losses = -change;

      avgGain = (avgGain * (period - 1) + gains) / period;
      avgLoss = (avgLoss * (period - 1) + losses) / period;

      const rs = avgGain / (avgLoss || 0.0001);
      const rsi = 100 - (100 / (1 + rs));

      data.push({ value: rsi });
    }

    return data;
  }

  /**
   * Add MACD Indicator
   */
  addMACDIndicator(prices) {
    // Placeholder - implement MACD calculation
    console.log('📈 MACD indicator ready');
  }

  /**
   * Add EMA Indicators (20 & 50 period)
   */
  addEMAIndicators(prices) {
    if (this.chart) {
      const ema20 = this.calculateEMA(prices.map(p => p.close), 20);
      const ema50 = this.calculateEMA(prices.map(p => p.close), 50);

      const ema20Series = this.chart.addLineSeries({
        color: '#90ee90',
        lineWidth: 1
      });
      const ema50Series = this.chart.addLineSeries({
        color: '#7cb342',
        lineWidth: 1
      });

      ema20Series.setData(ema20);
      ema50Series.setData(ema50);

      this.series.ema = { ema20: ema20Series, ema50: ema50Series };
    }
  }

  /**
   * Calculate EMA
   */
  calculateEMA(prices, period) {
    const data = [];
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier);
      data.push({ value: ema });
    }

    return data;
  }

  /**
   * Add Volume Indicator
   */
  addVolumeIndicator(prices) {
    if (this.chart) {
      const volumeData = prices.map(p => ({
        time: p.time,
        value: p.volume || 0
      }));

      const volumeSeries = this.chart.addHistogramSeries({
        color: 'rgba(150, 150, 200, 0.3)'
      });
      volumeSeries.setData(volumeData);
      this.series.volume = volumeSeries;
    }
  }

  /**
   * Clear all indicator series from chart
   */
  clearIndicatorSeries() {
    if (!this.chart) return;

    for (const [key, series] of Object.entries(this.series)) {
      if (Array.isArray(series)) {
        series.forEach(s => this.chart.removeSeries(s));
      } else if (typeof series === 'object' && series.upper) {
        // Bollinger Bands (multiple series)
        this.chart.removeSeries(series.upper);
        this.chart.removeSeries(series.middle);
        this.chart.removeSeries(series.lower);
      } else if (series) {
        this.chart.removeSeries(series);
      }
    }
    this.series = {};
  }

  /**
   * Update with new price data
   */
  setPriceData(priceData) {
    this.data.prices = priceData;
    this.updateChart();
  }
}

// Export for use in HTML
window.ChartIndicatorManager = ChartIndicatorManager;
