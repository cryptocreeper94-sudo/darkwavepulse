// DarkWave Banner - Waveform Visualization (like the reference image)
// Horizontal wave moving left-to-right with vertical geometric pattern inside
window.bannerChartManager = {
  canvas: null,
  ctx: null,
  animationFrame: null,
  time: 0,
  initialized: false,
  candleData: [],

  init: function() {
    console.log('🎬 Waveform Banner init');
    
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

    this.generateCandleData(300);
    this.initialized = true;
    console.log('✅ Waveform banner ready');
    
    this.animate();
  },

  generateCandleData: function(count) {
    let price = 50000;
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.48) * 1500;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 800;
      const low = Math.min(open, close) - Math.random() * 800;
      price = close;
      
      this.candleData.push({ open, high, low, close, volume: Math.random() * 1000000 });
    }
  },

  animate: function() {
    this.draw();
    this.time += 0.003; // Very slow horizontal movement
    this.animationFrame = requestAnimationFrame(() => this.animate());
  },

  draw: function() {
    if (!this.canvas || !this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const time = this.time;

    this.ctx.fillStyle = 'rgba(15, 15, 35, 0.96)';
    this.ctx.fillRect(0, 0, w, h);

    // Draw waveform with geometric pattern
    this.drawWaveform(w, h, time);
    
    // Draw candlesticks underneath
    this.drawCandleStream(w, h, time);
  },

  drawWaveform: function(w, h, time) {
    const centerY = h / 2;
    const maxAmplitude = h * 0.3; // 50-60% range as requested
    
    // Wave properties
    const waveLength = w * 0.6; // Wavelength (how wide each wave cycle is)
    const frequency = (2 * Math.PI) / waveLength;
    
    // Holographic colors for the wave fill
    const colors = [
      'rgba(255, 30, 80, 0.35)',
      'rgba(255, 60, 120, 0.40)',
      'rgba(240, 80, 140, 0.42)',
      'rgba(220, 100, 160, 0.40)',
      'rgba(200, 120, 180, 0.38)',
      'rgba(180, 140, 190, 0.36)',
      'rgba(160, 160, 200, 0.34)',
    ];

    // Draw the wave envelope with fill
    this.ctx.fillStyle = 'rgba(150, 80, 180, 0.15)';
    this.ctx.strokeStyle = 'rgba(255, 100, 150, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    let startX = null;

    // Top boundary of wave
    for (let x = 0; x < w; x += 1) {
      const phase = (x - time * 60) * frequency;
      const amplitude = Math.sin(phase) * maxAmplitude;
      const y = centerY - Math.abs(amplitude); // Top half of wave
      
      if (x === 0) {
        this.ctx.moveTo(x, y);
        startX = x;
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    // Bottom boundary of wave (return path)
    for (let x = w - 1; x >= 0; x -= 1) {
      const phase = (x - time * 60) * frequency;
      const amplitude = Math.sin(phase) * maxAmplitude;
      const y = centerY + Math.abs(amplitude); // Bottom half of wave
      this.ctx.lineTo(x, y);
    }

    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Draw vertical ribbed lines inside the wave (geometric pattern)
    this.drawWaveGeometry(w, h, centerY, time, frequency, maxAmplitude);

    // Draw horizontal baseline
    this.ctx.strokeStyle = 'rgba(255, 100, 150, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);
    this.ctx.lineTo(w, centerY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  },

  drawWaveGeometry: function(w, h, centerY, time, frequency, maxAmplitude) {
    const verticalSpacing = 8; // Lines every 8 pixels
    const colors = [
      'rgba(255, 80, 150, 0.6)',
      'rgba(220, 100, 180, 0.6)',
      'rgba(180, 140, 200, 0.6)',
      'rgba(150, 160, 220, 0.6)',
    ];

    // Draw vertical lines at regular intervals
    for (let x = 0; x < w; x += verticalSpacing) {
      const phase = (x - time * 60) * frequency;
      const amplitude = Math.sin(phase) * maxAmplitude;
      
      // Only draw line if inside the wave
      if (Math.abs(amplitude) > 2) {
        const colorIdx = Math.floor(x / verticalSpacing) % colors.length;
        this.ctx.strokeStyle = colors[colorIdx];
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.7;

        this.ctx.beginPath();
        this.ctx.moveTo(x, centerY - amplitude);
        this.ctx.lineTo(x, centerY + amplitude);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1.0;
      }
    }
  },

  drawCandleStream: function(w, h, time) {
    const maxPrice = Math.max(...this.candleData.map(c => c.high));
    const minPrice = Math.min(...this.candleData.map(c => c.low));
    const priceRange = maxPrice - minPrice || 1;
    
    const candleWidth = 1.2;
    const spacing = candleWidth + 0.3;
    const totalWidth = this.candleData.length * spacing;
    const scrollPos = (time * 20) % (totalWidth + w);
    
    // Candlesticks in bottom portion
    const chartTop = h * 0.65;
    const chartHeight = h * 0.30;

    for (let i = 0; i < this.candleData.length; i++) {
      const candle = this.candleData[i];
      const x = scrollPos - (this.candleData.length - i) * spacing;
      
      if (x < -10 || x > w + 10) continue;

      const high = chartTop + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const low = chartTop + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;
      const open = chartTop + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const close = chartTop + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;

      const isGreen = close < open;

      // Wick
      this.ctx.strokeStyle = isGreen ? 'rgba(100, 240, 120, 0.6)' : 'rgba(255, 100, 80, 0.6)';
      this.ctx.lineWidth = 0.6;
      this.ctx.globalAlpha = 0.5;

      this.ctx.beginPath();
      this.ctx.moveTo(x + candleWidth / 2, high);
      this.ctx.lineTo(x + candleWidth / 2, low);
      this.ctx.stroke();

      // Body
      const bodyColor = isGreen ? 'rgba(100, 240, 120, 0.7)' : 'rgba(255, 100, 80, 0.7)';
      this.ctx.fillStyle = bodyColor;
      this.ctx.globalAlpha = 0.6;

      const bodyTop = Math.min(open, close);
      const bodyHeight = Math.max(Math.abs(close - open), 0.5);
      this.ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);

      this.ctx.globalAlpha = 1.0;
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.bannerChartManager.init(), 100);
  });
} else {
  setTimeout(() => window.bannerChartManager.init(), 100);
}
