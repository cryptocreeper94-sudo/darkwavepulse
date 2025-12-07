// Full-Screen Chart Controller with Advanced Features
// Handles chart expansion, color customization, and live streaming

const fullscreenChartController = {
  isFullscreen: false,
  websocket: null,
  currentSymbol: null,
  currentAssetType: 'crypto',
  colorPresets: {
    'Classic': { 
      positive: { from: '#10B981', via: '#059669', to: '#047857' },  // Green for up
      negative: { from: '#EF4444', via: '#DC2626', to: '#B91C1C' }   // Red for down
    },
    'Purple Wave': { 
      positive: { from: '#A78BFA', via: '#8B5CF6', to: '#7C3AED' },  // Light purple for up
      negative: { from: '#C084FC', via: '#A855F7', to: '#9333EA' }   // Dark purple for down
    },
    'Blue Ocean': { 
      positive: { from: '#38BDF8', via: '#0EA5E9', to: '#0284C7' },  // Light blue for up
      negative: { from: '#0EA5E9', via: '#0284C7', to: '#0369A1' }   // Dark blue for down
    },
    'Golden Sunrise': { 
      positive: { from: '#FCD34D', via: '#F59E0B', to: '#D97706' },  // Light gold for up
      negative: { from: '#F59E0B', via: '#D97706', to: '#B45309' }   // Dark gold for down
    },
    'Pink Passion': { 
      positive: { from: '#F9A8D4', via: '#EC4899', to: '#DB2777' },  // Light pink for up
      negative: { from: '#EC4899', via: '#DB2777', to: '#BE185D' }   // Dark pink for down
    },
    'Cyberpunk': { 
      positive: { from: '#22D3EE', via: '#06B6D4', to: '#0891B2' },  // Cyan for up
      negative: { from: '#F472B6', via: '#EC4899', to: '#DB2777' }   // Magenta for down
    }
  },
  selectedPreset: 'Classic',
  customColors: { 
    positive: { from: '#10B981', via: '#059669', to: '#047857' },
    negative: { from: '#EF4444', via: '#DC2626', to: '#B91C1C' }
  },
  priceChange24h: 0, // Track 24hr price change to determine color
  
  // Toggle full-screen mode
  toggleFullscreen(chartContainerId, symbol, assetType, priceChange24h = 0) {
    this.currentSymbol = symbol;
    this.currentAssetType = assetType;
    this.priceChange24h = priceChange24h || 0; // Store 24hr price change
    
    console.log(`📊 Price Change 24h: ${this.priceChange24h}% (${this.priceChange24h >= 0 ? 'Positive' : 'Negative'})`);
    
    if (!this.isFullscreen) {
      this.enterFullscreen(chartContainerId);
    } else {
      this.exitFullscreen();
    }
  },
  
  // Enter full-screen mode
  enterFullscreen(chartContainerId) {
    const container = document.getElementById(chartContainerId);
    if (!container) return;
    
    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'fullscreenChartOverlay';
    overlay.className = 'fullscreen-chart-overlay';
    overlay.innerHTML = `
      <div class="fullscreen-chart-header">
        <h3 class="fullscreen-chart-title">${this.currentSymbol} Interactive Chart</h3>
        <button class="fullscreen-close-btn" onclick="fullscreenChartController.exitFullscreen()">×</button>
      </div>
      
      <div class="fullscreen-chart-controls">
        <!-- Chart Type Toggle -->
        <div class="fullscreen-control-group">
          <button class="fullscreen-control-btn active" id="fs-sparkline-btn" onclick="fullscreenChartController.switchChartType('sparkline')">
            📈 Sparkline
          </button>
          <button class="fullscreen-control-btn" id="fs-candle-btn" onclick="fullscreenChartController.switchChartType('candle')">
            📊 Candles
          </button>
        </div>
        
        <!-- Color Picker Toggle -->
        <button class="fullscreen-control-btn color-btn" onclick="fullscreenChartController.toggleColorPicker()">
          🎨 Colors
        </button>
        
        <!-- Live Streaming Toggle -->
        <button class="fullscreen-control-btn live-btn" id="fs-live-btn" onclick="fullscreenChartController.toggleLiveStream()">
          🔴 LIVE
        </button>
      </div>
      
      <!-- Live Status Bar -->
      <div style="padding: 12px 16px; background: rgba(20, 20, 30, 0.8); border-bottom: 1px solid rgba(100, 150, 255, 0.1); display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
        <span id="fs-live-indicator" style="color: #999999; font-weight: 600;">⚫ OFFLINE</span>
        <span id="fs-last-update" style="color: #777777;">Waiting for update</span>
      </div>
      
      <!-- Color Picker Panel (Hidden by default) -->
      <div class="fullscreen-color-picker" id="fs-color-picker" style="display: none;">
        <div class="color-picker-header">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #888;">
            🟢 Positive = Price Up • 🔴 Negative = Price Down
          </p>
          <button class="color-picker-close-btn" onclick="fullscreenChartController.toggleColorPicker()">×</button>
        </div>
        <div class="color-presets">
          ${Object.keys(this.colorPresets).map(preset => `
            <button class="color-preset-btn ${preset === this.selectedPreset ? 'active' : ''}" 
                    data-preset="${preset}"
                    onclick="fullscreenChartController.applyPreset('${preset}')">
              <div class="preset-gradients">
                <span class="preset-gradient" style="background: linear-gradient(135deg, ${this.colorPresets[preset].positive.from}, ${this.colorPresets[preset].positive.via}, ${this.colorPresets[preset].positive.to})"></span>
                <span class="preset-gradient" style="background: linear-gradient(135deg, ${this.colorPresets[preset].negative.from}, ${this.colorPresets[preset].negative.via}, ${this.colorPresets[preset].negative.to})"></span>
              </div>
              <span class="preset-name">${preset}</span>
            </button>
          `).join('')}
        </div>
        <div class="custom-color-picker">
          <label style="font-size: 13px; font-weight: bold;">Custom Colors:</label>
          <div class="custom-color-section">
            <label style="font-size: 11px; color: #10B981; margin-bottom: 4px;">🟢 Positive (Up)</label>
            <div class="custom-color-inputs">
              <input type="color" id="fs-color-pos-from" value="#10B981" onchange="fullscreenChartController.updateCustomColors()">
              <input type="color" id="fs-color-pos-via" value="#059669" onchange="fullscreenChartController.updateCustomColors()">
              <input type="color" id="fs-color-pos-to" value="#047857" onchange="fullscreenChartController.updateCustomColors()">
            </div>
          </div>
          <div class="custom-color-section">
            <label style="font-size: 11px; color: #EF4444; margin-bottom: 4px;">🔴 Negative (Down)</label>
            <div class="custom-color-inputs">
              <input type="color" id="fs-color-neg-from" value="#EF4444" onchange="fullscreenChartController.updateCustomColors()">
              <input type="color" id="fs-color-neg-via" value="#DC2626" onchange="fullscreenChartController.updateCustomColors()">
              <input type="color" id="fs-color-neg-to" value="#B91C1C" onchange="fullscreenChartController.updateCustomColors()">
            </div>
          </div>
          <button class="apply-custom-btn" onclick="fullscreenChartController.applyCustomColors()">Apply Custom</button>
        </div>
      </div>
      
      <!-- Timeframe Selector -->
      <div class="fullscreen-timeframes">
        <button class="fs-tf-btn" onclick="fullscreenChartController.changeTimeframe('1m')">1m</button>
        <button class="fs-tf-btn" onclick="fullscreenChartController.changeTimeframe('5m')">5m</button>
        <button class="fs-tf-btn" onclick="fullscreenChartController.changeTimeframe('1h')">1hr</button>
        <button class="fs-tf-btn" onclick="fullscreenChartController.changeTimeframe('6h')">6hr</button>
        <button class="fs-tf-btn active" onclick="fullscreenChartController.changeTimeframe('1d')">24hr</button>
        <button class="fs-tf-btn" onclick="fullscreenChartController.changeTimeframe('30d')">30d</button>
        <button class="fs-tf-btn" onclick="fullscreenChartController.changeTimeframe('6mo')">6mo</button>
        <button class="fs-tf-btn" onclick="fullscreenChartController.changeTimeframe('1yr')">1yr</button>
        <button class="fs-tf-btn" onclick="fullscreenChartController.changeTimeframe('ytd')">YTD</button>
        <button class="fs-tf-btn" onclick="fullscreenChartController.changeTimeframe('all')">All</button>
      </div>
      
      <!-- Expanded Chart Container -->
      <div class="fullscreen-chart-container" id="fullscreen-chart-main">
        <!-- Chart will be cloned/recreated here -->
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.isFullscreen = true;
    
    // Clone/recreate the chart in fullscreen
    this.createFullscreenChart();
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Entered fullscreen chart mode');
  },
  
  // Exit fullscreen mode
  exitFullscreen() {
    // Cleanup fullscreen chart instance
    if (this.fullscreenChartInstance) {
      this.fullscreenChartInstance.remove();
      this.fullscreenChartInstance = null;
      this.fullscreenSeries = null;
    }
    
    const overlay = document.getElementById('fullscreenChartOverlay');
    if (overlay) {
      overlay.remove();
    }
    
    // Stop live streaming
    this.stopLiveStream();
    
    this.isFullscreen = false;
    document.body.style.overflow = '';
    
    // Original modal chart remains intact (we didn't touch it)
    console.log('✅ Exited fullscreen chart mode');
  },
  
  // Create fullscreen chart (separate instance)
  createFullscreenChart() {
    const container = document.getElementById('fullscreen-chart-main');
    if (!container || !window.interactiveChartManager) return;
    
    // Cache current series data BEFORE creating new chart
    const cachedData = {
      candleData: interactiveChartManager.candleData || [],
      areaData: interactiveChartManager.areaData || [],
      currentMode: interactiveChartManager.currentMode || 'candle'
    };
    
    if (!cachedData.candleData.length && !cachedData.areaData.length) {
      console.error('❌ No chart data available for fullscreen');
      return;
    }
    
    // Create DEDICATED fullscreen chart instance (not reusing singleton)
    const fullscreenChart = LightweightCharts.createChart(container, {
      width: container.clientWidth,
      height: window.innerHeight - 250,
      layout: {
        background: { color: '#1A1A1A' },
        textColor: '#D9D9D9',
      },
      grid: {
        vertLines: { color: '#2B2B2B' },
        horzLines: { color: '#2B2B2B' },
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Magnet,
      },
      timeScale: {
        borderColor: '#2B2B2B',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#2B2B2B',
      },
    });
    
    // Store fullscreen chart separately
    this.fullscreenChartInstance = fullscreenChart;
    
    // Add series based on cached mode
    if (cachedData.currentMode === 'candle' && cachedData.candleData.length) {
      const candleSeries = fullscreenChart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
      candleSeries.setData(cachedData.candleData);
      this.fullscreenSeries = candleSeries;
    } else if (cachedData.areaData.length) {
      const areaSeries = fullscreenChart.addAreaSeries({
        lineColor: '#6366F1',
        topColor: '#8B5CF680',
        bottomColor: '#3B82F600',
        lineWidth: 2,
      });
      areaSeries.setData(cachedData.areaData);
      this.fullscreenSeries = areaSeries;
    }
    
    console.log('✅ Fullscreen chart created with cached data');
  },
  
  // Switch chart type (in fullscreen)
  switchChartType(type) {
    const candleBtn = document.getElementById('fs-candle-btn');
    const sparklineBtn = document.getElementById('fs-sparkline-btn');
    
    if (!this.fullscreenChartInstance) return;
    
    // Remove current series
    if (this.fullscreenSeries) {
      this.fullscreenChartInstance.removeSeries(this.fullscreenSeries);
    }
    
    // Get cached data
    const candleData = interactiveChartManager.candleData || [];
    const sparklineData = interactiveChartManager.areaData || [];
    
    if (type === 'candle' && candleData.length) {
      candleBtn?.classList.add('active');
      sparklineBtn?.classList.remove('active');
      
      const candleSeries = this.fullscreenChartInstance.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
      candleSeries.setData(candleData);
      this.fullscreenSeries = candleSeries;
    } else if (sparklineData.length) {
      sparklineBtn?.classList.add('active');
      candleBtn?.classList.remove('active');
      
      const sparklineSeries = this.fullscreenChartInstance.addAreaSeries({
        lineColor: '#6366F1',
        topColor: '#8B5CF680',
        bottomColor: '#3B82F600',
        lineWidth: 2,
      });
      sparklineSeries.setData(sparklineData);
      this.fullscreenSeries = sparklineSeries;
    }
  },
  
  // Toggle color picker
  toggleColorPicker() {
    const picker = document.getElementById('fs-color-picker');
    if (picker) {
      picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    }
  },
  
  // Apply color preset
  applyPreset(presetName) {
    this.selectedPreset = presetName;
    const presetColors = this.colorPresets[presetName];
    
    // Update all preset buttons
    document.querySelectorAll('.color-preset-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.preset === presetName) {
        btn.classList.add('active');
      }
    });
    
    // Determine which colors to use based on 24hr change
    const colors = this.priceChange24h >= 0 ? presetColors.positive : presetColors.negative;
    
    // Apply colors to chart
    this.applyColorsToChart(colors);
    
    console.log(`🎨 Applied preset: ${presetName} (${this.priceChange24h >= 0 ? 'Positive' : 'Negative'})`);
  },
  
  // Update custom colors
  updateCustomColors() {
    const posFrom = document.getElementById('fs-color-pos-from')?.value || '#10B981';
    const posVia = document.getElementById('fs-color-pos-via')?.value || '#059669';
    const posTo = document.getElementById('fs-color-pos-to')?.value || '#047857';
    
    const negFrom = document.getElementById('fs-color-neg-from')?.value || '#EF4444';
    const negVia = document.getElementById('fs-color-neg-via')?.value || '#DC2626';
    const negTo = document.getElementById('fs-color-neg-to')?.value || '#B91C1C';
    
    this.customColors = { 
      positive: { from: posFrom, via: posVia, to: posTo },
      negative: { from: negFrom, via: negVia, to: negTo }
    };
  },
  
  // Apply custom colors
  applyCustomColors() {
    if (!this.customColors || !this.customColors.positive) {
      this.updateCustomColors();
    }
    
    // Deselect all presets
    document.querySelectorAll('.color-preset-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    this.selectedPreset = null;
    
    // Apply correct gradient based on 24hr change
    const colors = this.priceChange24h >= 0 ? this.customColors.positive : this.customColors.negative;
    this.applyColorsToChart(colors);
    
    console.log('🎨 Applied custom colors:', this.priceChange24h >= 0 ? 'Positive' : 'Negative', colors);
  },
  
  // Apply colors to chart (fullscreen only)
  applyColorsToChart(colors) {
    if (!this.fullscreenSeries || !this.fullscreenChartInstance) return;
    
    // Only apply colors to area series (not candlestick)
    const seriesType = this.fullscreenSeries.seriesType?.();
    if (seriesType !== 'Area') {
      console.log('🎨 Colors only apply to Area charts');
      return;
    }
    
    // Apply gradient color for area chart
    const topColor = colors.from;
    const bottomColor = colors.to;
    
    this.fullscreenSeries.applyOptions({
      lineColor: colors.via,
      topColor: topColor + '80', // 50% opacity
      bottomColor: bottomColor + '00', // Transparent
    });
    
    console.log('🎨 Chart colors updated');
  },
  
  // Change timeframe
  changeTimeframe(timeframe) {
    // Update button states
    document.querySelectorAll('.fs-tf-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event?.target?.classList.add('active');
    
    // Reload chart data with new timeframe
    if (window.analysisModalController) {
      analysisModalController.updateChartTimeframe(timeframe);
    }
    
    console.log(`📊 Changed timeframe to: ${timeframe}`);
  },
  
  // Toggle live streaming
  toggleLiveStream() {
    const liveBtn = document.getElementById('fs-live-btn');
    
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.stopLiveStream();
      liveBtn?.classList.remove('active');
      liveBtn.textContent = '🔴 LIVE';
    } else {
      this.startLiveStream();
      liveBtn?.classList.add('active');
      liveBtn.textContent = '⚫ STOP';
    }
  },
  
  // Start live WebSocket streaming
  startLiveStream() {
    if (this.currentAssetType === 'crypto') {
      this.startBinanceStream();
    } else {
      this.startFinnhubStream();
    }
  },
  
  // Start Binance WebSocket for crypto (1-second live ticker)
  startBinanceStream() {
    const symbol = this.currentSymbol.toLowerCase();
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}usdt@trade`;
    
    // Initialize candle aggregation for 1-second updates
    this.currentCandle = null;
    this.candleStartTime = null;
    this.tradeBuffer = [];
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('✅ Binance WebSocket connected for', this.currentSymbol);
      const liveIndicator = document.getElementById('fs-live-indicator');
      if (liveIndicator) {
        liveIndicator.textContent = '🔴 LIVE';
        liveIndicator.style.color = '#ef4444';
      }
    };
    
    this.websocket.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      const price = parseFloat(trade.p);
      const quantity = parseFloat(trade.q);
      const tradeTime = Math.floor(trade.T / 1000); // Convert to seconds
      
      // Add trade to buffer
      this.tradeBuffer.push({ price, quantity, time: tradeTime });
      
      // Aggregate into 1-second candles
      if (!this.candleStartTime) {
        this.candleStartTime = tradeTime;
        this.currentCandle = {
          time: tradeTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: quantity
        };
      } else if (tradeTime === this.candleStartTime) {
        // Same second - update current candle
        this.currentCandle.high = Math.max(this.currentCandle.high, price);
        this.currentCandle.low = Math.min(this.currentCandle.low, price);
        this.currentCandle.close = price;
        this.currentCandle.volume += quantity;
      } else {
        // New second - finalize current candle and create new one
        this.updateChartWithLiveData(this.currentCandle);
        
        this.candleStartTime = tradeTime;
        this.currentCandle = {
          time: tradeTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: quantity
        };
      }
      
      // Update live timestamp
      const lastUpdate = document.getElementById('fs-last-update');
      if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = `Updated: ${now.toLocaleTimeString()}`;
      }
    };
    
    this.websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      const liveIndicator = document.getElementById('fs-live-indicator');
      if (liveIndicator) {
        liveIndicator.textContent = '⚠️ ERROR';
        liveIndicator.style.color = '#f59e0b';
      }
    };
    
    this.websocket.onclose = () => {
      console.log('🔴 WebSocket closed');
      const liveIndicator = document.getElementById('fs-live-indicator');
      if (liveIndicator) {
        liveIndicator.textContent = '⚫ OFFLINE';
        liveIndicator.style.color = '#999999';
      }
    };
  },
  
  // Start Finnhub WebSocket for stocks (placeholder - would need Finnhub API key)
  startFinnhubStream() {
    console.log('📊 Stock live streaming coming soon (requires Finnhub WebSocket API)');
    // Would implement Finnhub WebSocket here with API key
  },
  
  // Stop live streaming
  stopLiveStream() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
      console.log('⚫ Live stream stopped');
    }
  },
  
  // Update fullscreen chart with live 1-second candle
  updateChartWithLiveData(candle) {
    if (!this.fullscreenChartInstance || !this.fullscreenSeries) {
      console.warn('⚠️ Fullscreen chart not ready for live updates');
      return;
    }
    
    try {
      // Update the fullscreen series (not modal series)
      this.fullscreenSeries.update(candle);
      
      // Log every 10 updates to avoid console spam
      if (this.tradeBuffer.length % 10 === 0) {
        console.log(`📊 [LIVE] ${this.currentSymbol} @ $${candle.close.toFixed(8)} | Vol: ${candle.volume.toFixed(2)}`);
      }
    } catch (error) {
      console.error('❌ Error updating live chart:', error);
    }
  }
};

// Make available globally
window.fullscreenChartController = fullscreenChartController;

console.log('✅ Fullscreen Chart Controller loaded');
