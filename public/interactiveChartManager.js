// Interactive Chart Manager using Lightweight Charts for Analysis Modal
// Provides touch-enabled crosshair with price/time/date tooltips

const interactiveChartManager = {
  chart: null,
  candlestickSeries: null,
  areaSeries: null,
  histogramSeries: null,
  currentMode: 'sparkline', // 'candle' or 'sparkline' - DEFAULT TO SPARKLINE
  currentDataType: 'price', // 'price' or 'volume'
  tooltipEl: null,
  containerEl: null,
  resizeObserver: null,
  candleData: [], // Store for fullscreen access
  areaData: [],   // Store for fullscreen access
  volumeData: [],  // Store for volume histogram
  
  // Initialize chart when modal opens
  createChart(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Chart container not found:', containerId);
      return;
    }
    
    // Clean up existing chart
    if (this.chart) {
      this.destroyChart();
    }
    
    // Store container reference for resize (after destroy to avoid nulling it)
    this.containerEl = container;
    
    // Create chart with mobile-friendly options
    this.chart = LightweightCharts.createChart(container, {
      width: container.clientWidth,
      height: 350,
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
        vertLine: {
          color: '#3861FB',
          width: 1,
          style: LightweightCharts.LineStyle.Dashed,
          labelBackgroundColor: '#3861FB',
        },
        horzLine: {
          color: '#3861FB',
          width: 1,
          style: LightweightCharts.LineStyle.Dashed,
          labelBackgroundColor: '#3861FB',
        },
      },
      timeScale: {
        borderColor: '#2B2B2B',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2B2B2B',
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        axisDoubleClickReset: {
          time: true,
          price: true,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      ...options
    });
    
    // Create tooltip element
    this.createTooltip(container);
    
    // Handle resize
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !this.chart) return;
      const { width } = entries[0].contentRect;
      this.chart.applyOptions({ width, height: 350 });
    });
    this.resizeObserver.observe(container);
    
    // Subscribe to crosshair move for tooltip
    this.chart.subscribeCrosshairMove(param => {
      this.updateTooltip(param);
    });
    
    // Add double-tap to trigger landscape fullscreen
    this.addLandscapeFullscreenHandler(container);
    
    console.log('✅ Interactive chart created');
    return this.chart;
  },
  
  // Add double-tap handler for landscape fullscreen
  addLandscapeFullscreenHandler(container) {
    let lastTap = 0;
    
    container.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        // Double-tap detected - trigger landscape fullscreen
        console.log('📱 Double-tap detected - activating landscape fullscreen');
        
        if (window.landscapeChartController && window.analysisModalController) {
          const currentData = this.currentMode === 'candle' ? this.candleData : this.areaData;
          const assetData = window.analysisModalController.currentAssetData || {};
          
          window.landscapeChartController.activate(
            currentData,
            this.currentMode,
            assetData
          );
        }
      }
      
      lastTap = currentTime;
    });
  },
  
  // Create tooltip element
  createTooltip(container) {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
    }
    
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'chart-tooltip';
    this.tooltipEl.style.cssText = `
      position: absolute;
      display: none;
      background: rgba(26, 26, 26, 0.95);
      border: 1px solid #3861FB;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      color: #D9D9D9;
      z-index: 1000;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    container.style.position = 'relative';
    container.appendChild(this.tooltipEl);
  },
  
  // Update tooltip on crosshair move
  updateTooltip(param) {
    if (!this.tooltipEl || !param.time) {
      if (this.tooltipEl) this.tooltipEl.style.display = 'none';
      return;
    }
    
    // Determine which series to query based on data type and mode
    let series, data;
    
    if (this.currentDataType === 'volume' && this.histogramSeries) {
      series = this.histogramSeries;
      data = param.seriesData.get(series);
    } else if (this.currentMode === 'candle' && this.candlestickSeries) {
      series = this.candlestickSeries;
      data = param.seriesData.get(series);
    } else if (this.areaSeries) {
      series = this.areaSeries;
      data = param.seriesData.get(series);
    }
    
    if (!data) {
      this.tooltipEl.style.display = 'none';
      return;
    }
    
    // Format tooltip content
    let content = '';
    const date = new Date(param.time * 1000);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    if (this.currentDataType === 'volume') {
      // Volume histogram data
      const volume = data.value || 0;
      const volumeStr = volume >= 1e9 ? `${(volume / 1e9).toFixed(2)}B` :
                        volume >= 1e6 ? `${(volume / 1e6).toFixed(2)}M` :
                        volume >= 1e3 ? `${(volume / 1e3).toFixed(2)}K` :
                        volume.toFixed(0);
      content = `
        <div style="font-weight: bold; margin-bottom: 4px;">${dateStr} ${timeStr}</div>
        <div><span style="color: #888;">Volume:</span> <span style="font-size: 14px;">${volumeStr}</span></div>
      `;
    } else if (this.currentMode === 'candle' && data.open !== undefined) {
      // Candlestick data
      content = `
        <div style="font-weight: bold; margin-bottom: 4px;">${dateStr} ${timeStr}</div>
        <div style="display: grid; grid-template-columns: 60px 1fr; gap: 4px;">
          <span style="color: #888;">Open:</span><span>$${data.open.toFixed(2)}</span>
          <span style="color: #888;">High:</span><span style="color: #10B981;">$${data.high.toFixed(2)}</span>
          <span style="color: #888;">Low:</span><span style="color: #EF4444;">$${data.low.toFixed(2)}</span>
          <span style="color: #888;">Close:</span><span>$${data.close.toFixed(2)}</span>
        </div>
      `;
    } else {
      // Area/Line data
      const price = data.value || data.close || 0;
      content = `
        <div style="font-weight: bold; margin-bottom: 4px;">${dateStr} ${timeStr}</div>
        <div><span style="color: #888;">Price:</span> <span style="font-size: 14px;">$${price.toFixed(2)}</span></div>
      `;
    }
    
    this.tooltipEl.innerHTML = content;
    this.tooltipEl.style.display = 'block';
    
    // Position tooltip
    const toolbarHeight = 50;
    const left = Math.min(param.point.x + 15, this.tooltipEl.parentElement.clientWidth - this.tooltipEl.clientWidth - 10);
    const top = Math.max(param.point.y - this.tooltipEl.clientHeight - 10, toolbarHeight);
    
    this.tooltipEl.style.left = left + 'px';
    this.tooltipEl.style.top = top + 'px';
  },
  
  // Set candlestick data
  setCandlestickData(ohlcData) {
    if (!this.chart) return;
    
    // Store data for fullscreen access
    this.candleData = ohlcData;
    
    // Remove area series if exists
    if (this.areaSeries) {
      this.chart.removeSeries(this.areaSeries);
      this.areaSeries = null;
    }
    
    // Remove histogram series if exists
    if (this.histogramSeries) {
      this.chart.removeSeries(this.histogramSeries);
      this.histogramSeries = null;
    }
    
    // Create or update candlestick series
    if (!this.candlestickSeries) {
      this.candlestickSeries = this.chart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
    }
    
    this.candlestickSeries.setData(ohlcData);
    this.currentMode = 'candle';
    this.currentDataType = 'price';
    this.chart.timeScale().fitContent();
    console.log('✅ Candlestick data loaded:', ohlcData.length, 'points');
  },
  
  // Set sparkline (area) data
  setSparklineData(priceData) {
    if (!this.chart) return;
    
    // Store data for fullscreen access
    this.areaData = priceData;
    
    // Remove candlestick series if exists
    if (this.candlestickSeries) {
      this.chart.removeSeries(this.candlestickSeries);
      this.candlestickSeries = null;
    }
    
    // Remove histogram series if exists
    if (this.histogramSeries) {
      this.chart.removeSeries(this.histogramSeries);
      this.histogramSeries = null;
    }
    
    // Create or update area series
    if (!this.areaSeries) {
      this.areaSeries = this.chart.addAreaSeries({
        lineColor: '#3861FB',
        topColor: 'rgba(56, 97, 251, 0.4)',
        bottomColor: 'rgba(56, 97, 251, 0.0)',
        lineWidth: 2,
      });
    }
    
    this.areaSeries.setData(priceData);
    this.currentMode = 'sparkline';
    this.currentDataType = 'price';
    this.chart.timeScale().fitContent();
    console.log('✅ Sparkline data loaded:', priceData.length, 'points');
  },
  
  // Set volume histogram data (currentMode stays as 'candle' or 'sparkline' for compatibility)
  setVolumeData(volumeData, mode = 'candle') {
    if (!this.chart) return;
    
    // Store data for fullscreen access
    this.volumeData = volumeData;
    
    // Remove candlestick series if exists
    if (this.candlestickSeries) {
      this.chart.removeSeries(this.candlestickSeries);
      this.candlestickSeries = null;
    }
    
    // Remove area series if exists
    if (this.areaSeries) {
      this.chart.removeSeries(this.areaSeries);
      this.areaSeries = null;
    }
    
    // Create or update histogram series for volume
    if (!this.histogramSeries) {
      this.histogramSeries = this.chart.addHistogramSeries({
        color: '#3861FB',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'right',
      });
    }
    
    this.histogramSeries.setData(volumeData);
    this.currentMode = mode; // Keep as 'candle' or 'sparkline' for UI state
    this.currentDataType = 'volume';
    this.chart.timeScale().fitContent();
    console.log('✅ Volume histogram data loaded:', volumeData.length, 'bars');
  },
  
  // Destroy chart and clean up
  destroyChart() {
    if (this.resizeObserver && this.containerEl) {
      this.resizeObserver.unobserve(this.containerEl);
      this.resizeObserver = null;
    }
    
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
    
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
    
    this.candlestickSeries = null;
    this.areaSeries = null;
    this.containerEl = null;
  },
  
  // Resize chart (call when modal is opened or window resizes)
  resize() {
    if (this.chart && this.containerEl) {
      this.chart.applyOptions({
        width: this.containerEl.clientWidth,
        height: 350
      });
    }
  },
  
  // Transform historical data to Lightweight Charts format
  transformToLWCFormat(historical) {
    if (!historical || historical.length === 0) return [];
    
    return historical.map(candle => {
      let time;
      
      if (candle.time) {
        time = candle.time;
      } else if (candle.timestamp) {
        // Handle timestamp field - could be seconds, milliseconds, or ISO string
        if (typeof candle.timestamp === 'number') {
          time = candle.timestamp;
        } else if (typeof candle.timestamp === 'string') {
          // Try to coerce stringified numbers first
          const numericValue = Number(candle.timestamp);
          if (Number.isFinite(numericValue)) {
            time = numericValue;
          } else {
            // Parse as ISO string
            time = Math.floor(new Date(candle.timestamp).getTime() / 1000);
          }
        }
      } else {
        time = Math.floor(Date.now() / 1000);
      }
      
      // Guard against NaN
      if (!time || isNaN(time)) {
        time = Math.floor(Date.now() / 1000);
      }
      
      // Normalize millisecond timestamps to seconds (detect by magnitude > 1e10)
      if (time > 1e10) {
        time = Math.floor(time / 1000);
      }
      
      return {
        time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      };
    });
  },
  
  // Transform sparkline array to LWC format
  transformSparklineToLWCFormat(prices, historical = null, interval = 60) {
    if (!prices || prices.length === 0) return [];
    
    // If we have historical data with timestamps, use those
    if (historical && historical.length === prices.length) {
      return prices.map((price, index) => {
        let timestamp;
        
        // Try to extract timestamp from historical data
        if (historical[index].time) {
          timestamp = historical[index].time;
        } else if (historical[index].timestamp) {
          // Handle timestamp field - could be seconds, milliseconds, or ISO string
          if (typeof historical[index].timestamp === 'number') {
            timestamp = historical[index].timestamp;
          } else if (typeof historical[index].timestamp === 'string') {
            // Try to coerce stringified numbers first
            const numericValue = Number(historical[index].timestamp);
            if (Number.isFinite(numericValue)) {
              timestamp = numericValue;
            } else {
              // Parse as ISO string
              const parsed = new Date(historical[index].timestamp).getTime() / 1000;
              timestamp = isNaN(parsed) ? null : Math.floor(parsed);
            }
          }
        }
        
        // Normalize millisecond timestamps to seconds (detect by magnitude > 1e10)
        if (timestamp && timestamp > 1e10) {
          timestamp = Math.floor(timestamp / 1000);
        }
        
        // Defensive fallback: calculate timestamp if missing or invalid
        if (!timestamp || isNaN(timestamp)) {
          const baseTime = Math.floor(Date.now() / 1000) - (prices.length * interval);
          timestamp = baseTime + (index * interval);
        }
        
        return {
          time: timestamp,
          value: price
        };
      });
    }
    
    // Fallback: evenly space prices based on interval
    const baseTime = Math.floor(Date.now() / 1000) - (prices.length * interval);
    return prices.map((price, index) => ({
      time: baseTime + (index * interval),
      value: price
    }));
  }
};

// Expose globally for access from other modules
window.interactiveChartManager = interactiveChartManager;

console.log('✅ Interactive Chart Manager loaded');
