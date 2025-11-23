// DarkWave Banner - Flowing Waveform Over Candlesticks
// Large candlestick bars with smooth flowing curves on top
window.bannerChartManager = {
  canvas: null,
  ctx: null,
  animationFrame: null,
  scrollOffset: 0,
  initialized: false,
  candleData: [],

  init: function() {
    console.log('🎬 Flowing Waveform Banner init');
    
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

    this.generateCandleData(100);
    this.initialized = true;
    console.log('✅ Flowing waveform banner ready');
    
    this.animate();
  },

  generateCandleData: function(count) {
    let price = 45000;
    this.candleData = [];
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.45) * price * 0.03;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      price = close;
      this.candleData.push({ open, close, high, low });
    }
  },

  animate: function() {
    this.draw();
    this.scrollOffset += this.canvas.width / 10800;
    this.animationFrame = requestAnimationFrame(() => this.animate());
  },

  draw: function() {
    if (!this.canvas || !this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.fillStyle = '#0a0a14';
    this.ctx.fillRect(0, 0, w, h);

    // Layer 1: Candlestick bars
    this.drawCandleSticks(w, h);
    
    // Layer 2: Flowing waves on top
    this.drawFlowingWaves(w, h);
  },

  drawCandleSticks: function(w, h) {
    if (this.candleData.length === 0) return;
    
    const maxPrice = Math.max(...this.candleData.map(c => c.high));
    const minPrice = Math.min(...this.candleData.map(c => c.low));
    const priceRange = maxPrice - minPrice || 1;
    
    const candleWidth = w / (this.candleData.length * 1.2);
    const chartHeight = h * 0.9;
    const centerY = h / 2;
    
    this.candleData.forEach((candle, idx) => {
      const x = (idx * w / this.candleData.length - this.scrollOffset) % w;
      
      const openY = centerY - ((candle.open - minPrice) / priceRange - 0.5) * chartHeight;
      const closeY = centerY - ((candle.close - minPrice) / priceRange - 0.5) * chartHeight;
      const highY = centerY - ((candle.high - minPrice) / priceRange - 0.5) * chartHeight;
      const lowY = centerY - ((candle.low - minPrice) / priceRange - 0.5) * chartHeight;
      
      const isGreen = candle.close >= candle.open;
      
      // Draw wick
      this.ctx.strokeStyle = isGreen ? 'rgba(100, 200, 120, 0.4)' : 'rgba(200, 80, 80, 0.4)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x + candleWidth / 2, highY);
      this.ctx.lineTo(x + candleWidth / 2, lowY);
      this.ctx.stroke();
      
      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
      
      this.ctx.fillStyle = isGreen ? 'rgba(100, 200, 120, 0.5)' : 'rgba(200, 80, 80, 0.5)';
      this.ctx.fillRect(x, bodyTop, candleWidth * 0.8, bodyHeight);
    });
  },

  drawFlowingWaves: function(w, h) {
    // Color gradient: red → magenta → purple → blue
    const colors = [
      { r: 255, g: 30, b: 80 },
      { r: 255, g: 50, b: 120 },
      { r: 240, g: 80, b: 150 },
      { r: 200, g: 120, b: 180 },
      { r: 160, g: 150, b: 210 },
      { r: 120, g: 180, b: 240 },
      { r: 80, g: 200, b: 255 }
    ];
    
    const centerY = h / 2;
    const numCurves = 7;
    
    // Draw 7 smooth flowing curves
    for (let curveIdx = 0; curveIdx < numCurves; curveIdx++) {
      const frequency = 0.6 + curveIdx * 0.12;
      const amplitude = (h * 0.35) / (curveIdx + 1);
      const yOffset = (curveIdx - numCurves / 2) * (h * 0.08);
      
      const color = colors[curveIdx];
      const opacity = 0.8 - (curveIdx / numCurves) * 0.3;
      
      this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      // Add glow
      this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.5})`;
      this.ctx.shadowBlur = 8;
      
      this.ctx.beginPath();
      let pathStarted = false;
      
      for (let x = 0; x <= w; x += 1.5) {
        const phase = (x - this.scrollOffset) * 0.004 * frequency;
        const wave = Math.sin(phase) * amplitude;
        const y = centerY + yOffset + wave;
        
        if (!pathStarted) {
          this.ctx.moveTo(x, y);
          pathStarted = true;
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }
    
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.bannerChartManager.init(), 100);
  });
} else {
  setTimeout(() => window.bannerChartManager.init(), 100);
}
