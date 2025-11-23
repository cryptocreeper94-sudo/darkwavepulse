// Dynamic Banner Market Chart
// Displays live candlestick pattern in the banner

const bannerChartManager = {
  canvas: null,
  ctx: null,
  animationFrame: null,
  marketData: [],
  
  init() {
    // Create canvas element for banner
    const bannerWave = document.querySelector('.banner-wave');
    if (!bannerWave) return;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'bannerMarketChart';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.opacity = '0.8';
    
    bannerWave.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Load market data and start animation
    this.loadMarketData();
  },
  
  resize() {
    if (!this.canvas) return;
    
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Redraw after resize
    if (this.marketData.length > 0) {
      this.drawChart();
    }
  },
  
  async loadMarketData() {
    try {
      // Fetch BTC daily data for background chart
      const response = await fetch('/api/coincap/history/bitcoin?interval=1d&limit=100');
      if (!response.ok) {
        console.error('Failed to load banner market data');
        return;
      }
      
      const data = await response.json();
      this.marketData = data.map(candle => ({
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        timestamp: candle.timestamp
      }));
      
      this.startAnimation();
      
    } catch (error) {
      console.error('Banner chart error:', error);
    }
  },
  
  startAnimation() {
    const animate = () => {
      this.drawChart();
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  },
  
  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  },
  
  drawChart() {
    if (!this.ctx || !this.marketData.length) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Calculate chart dimensions
    const padding = 0;
    const chartWidth = width - (padding * 2);
    const chartHeight = height;
    
    // Get min/max prices
    const prices = this.marketData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Calculate candle width
    const candleCount = Math.min(this.marketData.length, 60);
    const candleWidth = Math.max(2, chartWidth / candleCount);
    const candleSpacing = candleWidth * 0.3;
    const actualCandleWidth = candleWidth - candleSpacing;
    
    // Draw only the most recent candles that fit
    const visibleData = this.marketData.slice(-candleCount);
    
    visibleData.forEach((candle, i) => {
      const x = padding + (i * candleWidth);
      
      // Calculate Y positions
      const yHigh = chartHeight - ((candle.high - minPrice) / priceRange * chartHeight);
      const yLow = chartHeight - ((candle.low - minPrice) / priceRange * chartHeight);
      const yOpen = chartHeight - ((candle.open - minPrice) / priceRange * chartHeight);
      const yClose = chartHeight - ((candle.close - minPrice) / priceRange * chartHeight);
      
      // Determine candle color
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      const wickColor = isGreen ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';
      
      // Draw wick (high-low line)
      this.ctx.strokeStyle = wickColor;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x + actualCandleWidth / 2, yHigh);
      this.ctx.lineTo(x + actualCandleWidth / 2, yLow);
      this.ctx.stroke();
      
      // Draw body (open-close rectangle)
      this.ctx.fillStyle = color;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1);
      this.ctx.fillRect(x, bodyTop, actualCandleWidth, bodyHeight);
    });
    
    // Draw gradient overlay for fade effect
    const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }
};

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.bannerChartManager = bannerChartManager;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => bannerChartManager.init(), 500);
    });
  } else {
    setTimeout(() => bannerChartManager.init(), 500);
  }
}
