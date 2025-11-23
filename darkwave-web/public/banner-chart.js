// DarkWave Banner - Holographic Rope Wave + Dense Candlestick Stream
// Background: 10 intertwined holographic lines creating unified horizontal wave
// Foreground: Dense 200+ candlestick chart scrolling horizontally
window.bannerChartManager = {
  canvas: null,
  ctx: null,
  animationFrame: null,
  time: 0,
  initialized: false,
  candleData: [], // Pre-generated candlestick data

  init: function() {
    console.log('🎬 Rope Wave + Candle Stream Banner init');
    
    if (this.initialized) return;

    let canvas = document.getElementById('banner-chart-canvas');
    if (!canvas) {
      const bannerWave = document.querySelector('.banner-wave');
      if (!bannerWave) {
        console.error('banner-wave not found!');
        return;
      }
      
      canvas = document.createElement('canvas');
      canvas.id = 'banner-chart-canvas';
      canvas.width = window.innerWidth;
      canvas.height = 150;
      canvas.style.cssText = 'display:block;position:absolute;top:0;left:0;width:100%;height:100%;';
      bannerWave.appendChild(canvas);
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      console.error('Failed to get 2D context');
      return;
    }

    // Pre-generate 300 candlesticks with realistic OHLC data
    this.generateCandleData(300);
    
    this.initialized = true;
    console.log('✅ Rope Wave + Candle Stream banner ready');
    
    this.animate();
  },

  generateCandleData: function(count) {
    let price = 50000;
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.48) * 1500; // Slight upward bias
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 800;
      const low = Math.min(open, close) - Math.random() * 800;
      price = close;
      
      this.candleData.push({
        open, high, low, close,
        volume: Math.random() * 1000000
      });
    }
  },

  animate: function() {
    this.draw();
    this.time += 0.012; // Horizontal scroll speed
    this.animationFrame = requestAnimationFrame(() => this.animate());
  },

  draw: function() {
    if (!this.canvas || !this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const time = this.time;

    // Dark background
    this.ctx.fillStyle = 'rgba(15, 15, 35, 0.96)';
    this.ctx.fillRect(0, 0, w, h);

    // Layer 1: Holographic rope wave (background)
    this.drawRopeWave(w, h, time);
    
    // Layer 2: Dense candlestick stream (foreground)
    this.drawCandleStream(w, h, time);
  },

  drawRopeWave: function(w, h, time) {
    const centerY = h / 2;
    const ropeWidth = 60; // Height range for the rope
    const numStrings = 10; // 10 intertwined lines
    
    // Holographic gradient: maroon → purple → lavender → orange
    const colors = [
      'rgba(100, 20, 50, 0.65)',
      'rgba(130, 35, 80, 0.68)',
      'rgba(160, 50, 110, 0.70)',
      'rgba(190, 70, 140, 0.72)',
      'rgba(210, 100, 160, 0.75)',
      'rgba(230, 140, 180, 0.77)',
      'rgba(245, 160, 170, 0.75)',
      'rgba(255, 140, 100, 0.70)',
      'rgba(240, 120, 80, 0.65)',
      'rgba(220, 100, 60, 0.60)',
    ];

    for (let stringIdx = 0; stringIdx < numStrings; stringIdx++) {
      const baseOffset = (stringIdx - numStrings / 2) * 5; // Offset between strings
      const color = colors[stringIdx % colors.length];

      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2.2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      this.ctx.beginPath();
      
      for (let x = 0; x < w; x += 3) {
        // Main horizontal wave (sine wave moving left to right)
        const wavePhase = (x * 0.006 - time * 1.2) * Math.PI / 50;
        const verticalOffset = Math.sin(wavePhase) * ropeWidth;
        
        // Add slight randomness per string for rope effect
        const randomWave = Math.sin((x * 0.008 + stringIdx * 2 + time * 0.5) * Math.PI / 60) * 8;
        
        // Harmonic variation (different frequencies create rope twist)
        const twist = Math.cos((x * 0.004 - time * 0.8 + stringIdx) * Math.PI / 40) * 12;
        
        const y = centerY + baseOffset + verticalOffset + randomWave + twist;

        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      
      this.ctx.stroke();
    }

    // Holographic glow
    this.ctx.shadowColor = 'rgba(200, 80, 150, 0.25)';
    this.ctx.shadowBlur = 22;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  },

  drawCandleStream: function(w, h, time) {
    const centerY = h / 2;
    const maxPrice = Math.max(...this.candleData.map(c => c.high));
    const minPrice = Math.min(...this.candleData.map(c => c.low));
    const priceRange = maxPrice - minPrice || 1;
    
    const candleWidth = 1.8; // Tight, compressed candles
    const spacing = candleWidth + 0.5; // Tight spacing
    const totalWidth = this.candleData.length * spacing;
    
    // Scroll position (moves left to right across screen)
    const scrollPos = (time * 120) % (totalWidth + w);
    
    const chartHeight = h * 0.5;
    const chartPadding = (h - chartHeight) / 2;

    for (let i = 0; i < this.candleData.length; i++) {
      const candle = this.candleData[i];
      const x = scrollPos - (this.candleData.length - i) * spacing;
      
      // Only draw candles visible on screen
      if (x < -10 || x > w + 10) continue;

      // Normalize prices to chart height
      const high = chartPadding + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const low = chartPadding + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;
      const open = chartPadding + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const close = chartPadding + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;

      const isGreen = close < open; // Green if price went up

      // Draw wick (thin vertical line)
      this.ctx.strokeStyle = isGreen ? 'rgba(80, 220, 120, 0.8)' : 'rgba(255, 90, 90, 0.8)';
      this.ctx.lineWidth = 0.8;
      this.ctx.shadowColor = isGreen ? 'rgba(80, 220, 120, 0.4)' : 'rgba(255, 90, 90, 0.4)';
      this.ctx.shadowBlur = 5;

      this.ctx.beginPath();
      this.ctx.moveTo(x + candleWidth / 2, high);
      this.ctx.lineTo(x + candleWidth / 2, low);
      this.ctx.stroke();

      // Draw body (rectangle)
      const bodyColor = isGreen ? 'rgba(80, 220, 120, 0.85)' : 'rgba(255, 90, 90, 0.85)';
      const bodyStroke = isGreen ? 'rgba(120, 255, 160, 1)' : 'rgba(255, 130, 130, 1)';
      
      this.ctx.fillStyle = bodyColor;
      this.ctx.strokeStyle = bodyStroke;
      this.ctx.lineWidth = 0.6;
      this.ctx.shadowColor = isGreen ? 'rgba(80, 220, 120, 0.35)' : 'rgba(255, 90, 90, 0.35)';
      this.ctx.shadowBlur = 4;

      const bodyTop = Math.min(open, close);
      const bodyHeight = Math.max(Math.abs(close - open), 1);
      
      this.ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      if (bodyHeight > 1) {
        this.ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);
      }
    }

    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }
};

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - initializing rope wave banner');
    setTimeout(() => window.bannerChartManager.init(), 100);
  });
} else {
  console.log('DOM ready - initializing rope wave banner');
  setTimeout(() => window.bannerChartManager.init(), 100);
}
