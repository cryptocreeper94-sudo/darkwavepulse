// DarkWave Banner - Enhanced Waveform with Layered Depth
// Multiple sine waves with red→magenta→purple→blue gradient, horizontal scroll
window.bannerChartManager = {
  canvas: null,
  ctx: null,
  animationFrame: null,
  scrollOffset: 0,
  initialized: false,

  init: function() {
    console.log('🎬 Enhanced Waveform Banner init');
    
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
    console.log('✅ Enhanced waveform banner ready');
    
    this.animate();
  },

  animate: function() {
    this.draw();
    
    // Ultra-slow scroll: canvas.width pixels in 180 seconds (3 minutes)
    this.scrollOffset += this.canvas.width / 10800;
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  },

  draw: function() {
    if (!this.canvas || !this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Black background
    this.ctx.fillStyle = '#0a0a14';
    this.ctx.fillRect(0, 0, w, h);

    // Draw waveform layers with depth
    this.drawWaveformLayers(w, h);
  },

  drawWaveformLayers: function(w, h) {
    const centerY = h / 2;
    const amplitude = h * 0.42; // Increased amplitude for deeper waves
    
    // Rich color gradient: red → magenta → purple → blue
    const colors = [
      { r: 255, g: 30, b: 70 },      // Bright Red
      { r: 255, g: 50, b: 120 },     // Red-Magenta
      { r: 255, g: 70, b: 150 },     // Magenta-Pink
      { r: 240, g: 100, b: 170 },    // Pink-Purple
      { r: 200, g: 120, b: 190 },    // Purple-Pink
      { r: 160, g: 140, b: 210 },    // Light Purple
      { r: 120, g: 160, b: 230 },    // Purple-Blue
      { r: 80, g: 180, b: 250 },     // Blue-Purple
      { r: 60, g: 200, b: 255 },     // Bright Blue
      { r: 50, g: 150, b: 220 },     // Deep Blue
      { r: 80, g: 120, b: 200 },     // Blue-Purple
      { r: 100, g: 100, b: 180 }     // Dark Purple
    ];
    
    // Draw multiple overlapping wave layers
    const frequencies = [0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7];
    
    frequencies.forEach((freq, layerIdx) => {
      const color = colors[layerIdx % colors.length];
      
      // Opacity varies by layer - center layers brighter
      const centerDist = Math.abs(layerIdx - frequencies.length / 2);
      const opacity = 0.95 - (centerDist / frequencies.length) * 0.35;
      
      this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
      this.ctx.lineWidth = 1.8;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      // Glow effect for brighter appearance
      this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.7})`;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
      
      this.ctx.beginPath();
      let pathStarted = false;
      
      for (let x = 0; x <= w; x += 1.5) {
        // Wave calculation with scroll offset
        const phase = (x - this.scrollOffset) * 0.004 * freq;
        const y = centerY - Math.sin(phase) * amplitude;
        
        if (!pathStarted) {
          this.ctx.moveTo(x, y);
          pathStarted = true;
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      
      this.ctx.stroke();
    });
    
    // Remove shadow effects
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
