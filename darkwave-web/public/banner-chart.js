// DarkWave Banner - Holographic Dual-Layer Wave System
// Background: 30 holographic neon lines with independent wave pattern
// Foreground: Candlestick chart with different harmonic wave pattern
window.bannerChartManager = {
  canvas: null,
  ctx: null,
  animationFrame: null,
  time: 0,
  initialized: false,

  init: function() {
    console.log('🎬 Holographic Banner init called');
    
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

    this.initialized = true;
    console.log('✅ Holographic dual-layer banner initialized');
    
    this.animate();
  },

  animate: function() {
    this.draw();
    this.time += 0.01;
    this.animationFrame = requestAnimationFrame(() => this.animate());
  },

  draw: function() {
    if (!this.canvas || !this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const time = this.time;

    // Dark background
    this.ctx.fillStyle = 'rgba(15, 15, 35, 0.95)';
    this.ctx.fillRect(0, 0, w, h);

    // Layer 1: Holographic neon lines with independent wave pattern
    this.drawHolographicWaves(w, h, time);
    
    // Layer 2: Candlestick chart with different harmonic wave pattern
    this.drawHarmonicCandles(w, h, time);
  },

  drawHolographicWaves: function(w, h, time) {
    const centerY = h / 2;
    const numLines = 32; // 30+ parallel lines
    const spacing = h / (numLines + 1);
    
    // Holographic color palette: maroon → purple → lavender → orange
    const holographicColors = [
      'rgba(100, 20, 50, 0.6)',      // Deep maroon
      'rgba(120, 30, 70, 0.65)',     // Maroon-purple
      'rgba(140, 40, 90, 0.7)',      // Purple-maroon
      'rgba(160, 50, 120, 0.7)',     // Purple
      'rgba(180, 70, 150, 0.75)',    // Bright purple
      'rgba(200, 100, 180, 0.75)',   // Purple-lavender
      'rgba(220, 130, 200, 0.8)',    // Lavender
      'rgba(230, 150, 210, 0.8)',    // Bright lavender
      'rgba(240, 160, 180, 0.75)',   // Lavender-pink
      'rgba(250, 140, 100, 0.7)',    // Orange-pink
      'rgba(255, 120, 80, 0.65)',    // Orange
    ];

    for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
      const baseY = spacing * (lineIdx + 1);
      const colorIdx = lineIdx % holographicColors.length;
      const color = holographicColors[colorIdx];

      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.8;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      this.ctx.beginPath();
      
      for (let x = 0; x < w; x += 2) {
        // WAVE PATTERN 1 (for background lines): Slower, broader waves
        const waveTime = time * 0.8; // Slower motion
        const waveFreq = 0.007; // Lower frequency = broader waves
        
        // Multi-layer sine waves for complex motion
        const wave1 = Math.sin((x * waveFreq + waveTime) * Math.PI / 80) * 40;
        const wave2 = Math.sin((x * waveFreq * 0.4 - waveTime * 0.6) * Math.PI / 100) * 20;
        const wave3 = Math.cos((x * waveFreq * 0.2 + waveTime * 0.3) * Math.PI / 120) * 10;
        
        const y = baseY + wave1 + wave2 + wave3;

        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      
      this.ctx.stroke();
    }

    // Holographic glow effect
    this.ctx.shadowColor = 'rgba(200, 100, 180, 0.3)';
    this.ctx.shadowBlur = 25;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  },

  drawHarmonicCandles: function(w, h, time) {
    const centerY = h / 2;
    const spacing = 48;
    
    // WAVE PATTERN 2 (for candles): Different frequency & speed = harmonic variation
    const candleWaveTime = time * 1.3; // Faster motion than background
    const candleWaveFreq = 0.009; // Different frequency = different wavelength

    for (let i = 0; i < (w / spacing) + 2; i++) {
      const x = i * spacing;
      
      // Calculate position with DIFFERENT wave pattern than background
      const waveValue = Math.sin((x * candleWaveFreq + candleWaveTime) * Math.PI / 60) * 30 +
                        Math.sin((x * candleWaveFreq * 0.6 - candleWaveTime * 0.8) * Math.PI / 90) * 18 +
                        Math.cos((x * candleWaveFreq * 0.3 + candleWaveTime * 0.5) * Math.PI / 110) * 12;
      
      const isGreen = i % 2 === 0;
      
      // Determine trend from harmonic pattern
      const trend = Math.sin((i + candleWaveTime) * 0.5);
      
      // High/low points
      const high = centerY - Math.abs(waveValue) - 18;
      const low = centerY + Math.abs(waveValue) + 18;
      
      // Open/close follows trend
      const openOffset = trend * 12;
      const closeOffset = -trend * 12;
      const open = centerY + openOffset + (waveValue * 0.2);
      const close = centerY + closeOffset + (waveValue * 0.2);

      // Draw wick with glow
      const wickColor = isGreen ? 'rgba(100, 255, 150, 0.85)' : 'rgba(255, 100, 100, 0.85)';
      this.ctx.strokeStyle = wickColor;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.shadowColor = isGreen ? 'rgba(100, 255, 150, 0.5)' : 'rgba(255, 100, 100, 0.5)';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;

      this.ctx.beginPath();
      this.ctx.moveTo(x + 7, high);
      this.ctx.lineTo(x + 7, low);
      this.ctx.stroke();

      // Draw body
      const bodyColor = isGreen ? 'rgba(100, 255, 150, 0.7)' : 'rgba(255, 100, 100, 0.7)';
      const bodyStrokeColor = isGreen ? 'rgba(150, 255, 200, 0.95)' : 'rgba(255, 150, 150, 0.95)';
      
      this.ctx.fillStyle = bodyColor;
      this.ctx.strokeStyle = bodyStrokeColor;
      this.ctx.lineWidth = 1.8;
      this.ctx.shadowColor = isGreen ? 'rgba(100, 255, 150, 0.4)' : 'rgba(255, 100, 100, 0.4)';
      this.ctx.shadowBlur = 8;

      const bodyTop = Math.min(open, close);
      const bodyHeight = Math.max(Math.abs(close - open), 5);
      
      this.ctx.fillRect(x + 1, bodyTop, 12, bodyHeight);
      this.ctx.strokeRect(x + 1, bodyTop, 12, bodyHeight);
    }

    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }
};

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - initializing holographic banner');
    setTimeout(() => window.bannerChartManager.init(), 100);
  });
} else {
  console.log('DOM ready - initializing holographic banner immediately');
  setTimeout(() => window.bannerChartManager.init(), 100);
}
