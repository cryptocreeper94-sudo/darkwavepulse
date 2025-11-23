// DarkWave Banner - Smoldering Candlestick Chart with Holographic Smoke
// Black background, holographic colored smoke trail, prominent candlestick zig-zag line
window.bannerChartManager = {
  canvas: null,
  ctx: null,
  animationFrame: null,
  scrollTime: 0,
  initialized: false,
  candleData: [],
  smokeParticles: [],
  smokeColors: [
    { r: 255, g: 30, b: 80 },      // Maroon/Red
    { r: 255, g: 60, b: 120 },     // Red-Pink
    { r: 240, g: 80, b: 140 },     // Pink-Purple
    { r: 220, g: 100, b: 160 },    // Purple-Pink
    { r: 200, g: 120, b: 180 },    // Purple
    { r: 180, g: 140, b: 190 },    // Lavender-Purple
    { r: 160, g: 160, b: 200 },    // Lavender
    { r: 240, g: 100, b: 120 }     // Orange-Pink
  ],

  init: function() {
    console.log('🎬 Smoldering Chart Banner init');
    
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

    // Generate year-like candlestick data (365 candles)
    this.generateYearCandleData(365);
    this.initializeSmokeParticles();
    this.initialized = true;
    console.log('✅ Smoldering banner ready');
    
    this.animate();
  },

  generateYearCandleData: function(count) {
    let price = 50000;
    this.candleData = [];
    
    for (let i = 0; i < count; i++) {
      const volatility = 0.3 + Math.random() * 0.5;
      const change = (Math.random() - 0.48) * price * volatility * 0.01;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * price * 0.005;
      const low = Math.min(open, close) - Math.random() * price * 0.005;
      price = Math.max(low, Math.min(high, close));
      
      this.candleData.push({ open, high, low, close });
    }
  },

  initializeSmokeParticles: function() {
    this.smokeParticles = [];
    for (let i = 0; i < 100; i++) {
      this.smokeParticles.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 1.8,
        vy: -Math.random() * 1,
        life: Math.random() * 0.7,
        colorIdx: Math.floor(Math.random() * this.smokeColors.length),
        size: Math.random() * 25 + 12
      });
    }
  },

  animate: function() {
    this.draw();
    this.scrollTime += 0.015; // Slow horizontal scroll
    
    // Update smoke particles with subtle motion
    this.smokeParticles.forEach((p, idx) => {
      p.x += p.vx * 0.6;
      p.y += p.vy * 0.4;
      p.life -= 0.0035;
      
      if (p.life <= 0) {
        // Reset particle at centerline
        p.x = Math.random() * this.canvas.width;
        p.y = this.canvas.height / 2 + (Math.random() - 0.5) * 8;
        p.vy = -Math.random() * 1;
        p.vx = (Math.random() - 0.5) * 1.8;
        p.life = 0.7;
        p.colorIdx = Math.floor(Math.random() * this.smokeColors.length);
      }
    });
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  },

  draw: function() {
    if (!this.canvas || !this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Pure black background
    this.ctx.fillStyle = '#0F0F23';
    this.ctx.fillRect(0, 0, w, h);

    // Layer 1: Holographic colored smoke (smoldering effect)
    this.drawHolographicSmoke(w, h);
    
    // Layer 2: Prominent candlestick line
    this.drawCandlestickLine(w, h);
  },

  drawHolographicSmoke: function(w, h) {
    // Draw smoke particles with holographic color gradient
    this.smokeParticles.forEach(particle => {
      if (particle.life > 0) {
        const color = this.smokeColors[particle.colorIdx];
        
        // Subtle opacity that fades as particles die
        const opacity = (particle.life * 0.8) * 0.18;
        
        // Holographic colored smoke
        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Add soft holographic glow overlay following the candle path
    this.ctx.strokeStyle = 'rgba(220, 100, 160, 0.08)';
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const pixelsPerCandle = w / this.candleData.length;
    const startCandle = Math.floor((this.scrollTime * 100) % this.candleData.length);
    
    const maxPrice = Math.max(...this.candleData.map(c => c.high));
    const minPrice = Math.min(...this.candleData.map(c => c.low));
    const priceRange = maxPrice - minPrice || 1;
    const centerY = h / 2;
    const maxAmplitude = h * 0.20;
    
    this.ctx.beginPath();
    let pathStarted = false;

    for (let i = 0; i < this.candleData.length; i++) {
      const candleIdx = (startCandle + i) % this.candleData.length;
      const candle = this.candleData[candleIdx];
      
      const x = i * pixelsPerCandle;
      const closeNorm = (candle.close - minPrice) / priceRange;
      const y = centerY + (0.5 - closeNorm) * maxAmplitude * 2;
      
      if (!pathStarted) {
        this.ctx.moveTo(x, y);
        pathStarted = true;
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();
  },

  drawCandlestickLine: function(w, h) {
    const centerY = h / 2;
    const maxAmplitude = h * 0.20; // Stays within 20-30% range
    
    // Get price range
    const maxPrice = Math.max(...this.candleData.map(c => c.high));
    const minPrice = Math.min(...this.candleData.map(c => c.low));
    const priceRange = maxPrice - minPrice || 1;
    
    const pixelsPerCandle = w / this.candleData.length;
    const startCandle = Math.floor((this.scrollTime * 100) % this.candleData.length);
    
    // ===== MAIN CANDLESTICK LINE =====
    this.ctx.strokeStyle = '#00FF88';
    this.ctx.lineWidth = 2.8;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.globalAlpha = 0.98;
    
    this.ctx.beginPath();
    let pathStarted = false;

    for (let i = 0; i < this.candleData.length; i++) {
      const candleIdx = (startCandle + i) % this.candleData.length;
      const candle = this.candleData[candleIdx];
      
      const x = i * pixelsPerCandle;
      const closeNorm = (candle.close - minPrice) / priceRange;
      const y = centerY + (0.5 - closeNorm) * maxAmplitude * 2;
      
      if (!pathStarted) {
        this.ctx.moveTo(x, y);
        pathStarted = true;
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    // ===== SUBTLE VERTICAL WICKS (every 5 candles) =====
    this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.35)';
    this.ctx.lineWidth = 0.6;
    this.ctx.globalAlpha = 0.7;

    for (let i = 0; i < this.candleData.length; i += 5) {
      const candleIdx = (startCandle + i) % this.candleData.length;
      const candle = this.candleData[candleIdx];
      
      const x = i * pixelsPerCandle;
      
      const highNorm = (candle.high - minPrice) / priceRange;
      const lowNorm = (candle.low - minPrice) / priceRange;
      
      const highY = centerY + (0.5 - highNorm) * maxAmplitude * 2;
      const lowY = centerY + (0.5 - lowNorm) * maxAmplitude * 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, highY);
      this.ctx.lineTo(x, lowY);
      this.ctx.stroke();
    }

    // ===== SUBTLE GREEN GLOW EFFECT =====
    this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.12)';
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.globalAlpha = 0.5;

    this.ctx.beginPath();
    let glowStarted = false;

    for (let i = 0; i < this.candleData.length; i++) {
      const candleIdx = (startCandle + i) % this.candleData.length;
      const candle = this.candleData[candleIdx];
      
      const x = i * pixelsPerCandle;
      const closeNorm = (candle.close - minPrice) / priceRange;
      const y = centerY + (0.5 - closeNorm) * maxAmplitude * 2;
      
      if (!glowStarted) {
        this.ctx.moveTo(x, y);
        glowStarted = true;
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    this.ctx.globalAlpha = 1.0;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.bannerChartManager.init(), 100);
  });
} else {
  setTimeout(() => window.bannerChartManager.init(), 100);
}
