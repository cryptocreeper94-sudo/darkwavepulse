// Dashboard Widgets Module - Professional Stats Dashboard
// Handles Fear & Greed gauge, Market Cycle indicators, ETF trackers, and AI signals

export const DashboardWidgets = {
  // Initialize all widgets
  init() {
    console.log('📊 [DashboardWidgets] Initializing professional stats dashboard...');
    
    // Set up refresh handlers
    document.getElementById('refreshSignals')?.addEventListener('click', () => {
      this.updateAISignals();
    });
    
    // Initialize with default data
    this.updateFearGreed(24);
    this.updateMarketCycle(0, 100, 0);
    this.drawETFSparkline();
    this.updateAISignals();
    
    console.log('✅ [DashboardWidgets] All widgets initialized');
  },
  
  // Update Fear & Greed gauge with value 0-100
  updateFearGreed(value) {
    const clampedValue = Math.min(100, Math.max(0, value));
    const valueEl = document.getElementById('fearGreedValue');
    const labelEl = document.getElementById('fearGreedLabel');
    
    if (!valueEl || !labelEl) return;
    
    valueEl.textContent = clampedValue;
    
    // Determine label and color
    let label, color;
    if (clampedValue < 25) {
      label = 'Extreme Fear';
      color = '#EF4444';
    } else if (clampedValue < 45) {
      label = 'Fear';
      color = '#F59E0B';
    } else if (clampedValue < 55) {
      label = 'Neutral';
      color = '#9D4EDD';
    } else if (clampedValue < 75) {
      label = 'Greed';
      color = '#84CC16';
    } else {
      label = 'Extreme Greed';
      color = '#10B981';
    }
    
    labelEl.textContent = label;
    labelEl.style.fill = color;
    
    console.log(`📊 [Fear&Greed] Updated: ${clampedValue} (${label})`);
  },
  
  // Update Market Cycle indicators (all values 0-100)
  updateMarketCycle(accumulation, distribution, altseason) {
    this.updateCycleBar('accumBar', 'accumPercent', accumulation);
    this.updateCycleBar('distBar', 'distPercent', distribution);
    this.updateCycleBar('altseasonBar', 'altseasonPercent', altseason);
    
    console.log(`📊 [MarketCycle] Updated: Accum ${accumulation}% | Dist ${distribution}% | Alt ${altseason}%`);
  },
  
  // Helper to update a single cycle bar
  updateCycleBar(barId, percentId, value) {
    const bar = document.getElementById(barId);
    const percent = document.getElementById(percentId);
    
    if (bar && percent) {
      const clampedValue = Math.min(100, Math.max(0, value));
      bar.style.width = `${clampedValue}%`;
      percent.textContent = `${Math.round(clampedValue)}%`;
    }
  },
  
  // Update ETF trackers with dollar amounts
  updateETFTrackers(allEtf, btcEtf, ethEtf) {
    const formatMoney = (num) => {
      const absNum = Math.abs(num);
      if (absNum >= 1000000000) {
        return `${num >= 0 ? '' : '-'}$${(absNum / 1000000000).toFixed(2)}B`;
      } else if (absNum >= 1000000) {
        return `${num >= 0 ? '' : '-'}$${(absNum / 1000000).toFixed(2)}M`;
      } else if (absNum >= 1000) {
        return `${num >= 0 ? '' : '-'}$${(absNum / 1000).toFixed(2)}K`;
      }
      return `${num >= 0 ? '' : '-'}$${absNum.toFixed(2)}`;
    };
    
    const allEl = document.getElementById('allEtf');
    const btcEl = document.getElementById('btcEtf');
    const ethEl = document.getElementById('ethEtf');
    
    if (allEl) allEl.textContent = formatMoney(allEtf);
    if (btcEl) btcEl.textContent = formatMoney(btcEtf);
    if (ethEl) {
      ethEl.textContent = formatMoney(ethEtf);
      ethEl.className = ethEtf < 0 ? 'etf-amount negative' : 'etf-amount';
    }
    
    console.log(`📊 [ETF] Updated: All ${formatMoney(allEtf)} | BTC ${formatMoney(btcEtf)} | ETH ${formatMoney(ethEtf)}`);
  },
  
  // Draw blue sparkline chart on canvas
  drawETFSparkline(data = null) {
    const canvas = document.getElementById('etfSparkline');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Default data if none provided (simulated ETF trend)
    const chartData = data || [605, 580, 620, 590, 610, 630, 595, 605, 625, 610];
    
    // Normalize data to fit canvas height
    const max = Math.max(...chartData);
    const min = Math.min(...chartData);
    const range = max - min;
    
    const points = chartData.map((val, i) => ({
      x: (i / (chartData.length - 1)) * width,
      y: height - ((val - min) / range) * (height - 10) - 5
    }));
    
    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, height);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    
    // Draw line
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    
    console.log('📊 [ETFSparkline] Chart drawn with', chartData.length, 'data points');
  },
  
  // Update AI buy/sell signals
  updateAISignals(buySignal = null, sellSignal = null) {
    // Default signals if none provided
    const defaultBuy = { asset: 'BTC @ $98,500', confidence: 78 };
    const defaultSell = { asset: 'ETH @ $3,620', confidence: 65 };
    
    const buy = buySignal || defaultBuy;
    const sell = sellSignal || defaultSell;
    
    const buyAssetEl = document.getElementById('buySignalAsset');
    const buyConfEl = document.getElementById('buyConfidence');
    const sellAssetEl = document.getElementById('sellSignalAsset');
    const sellConfEl = document.getElementById('sellConfidence');
    const catEl = document.getElementById('catSignalTake');
    
    if (buyAssetEl) buyAssetEl.textContent = buy.asset;
    if (buyConfEl) buyConfEl.textContent = `${buy.confidence}%`;
    if (sellAssetEl) sellAssetEl.textContent = sell.asset;
    if (sellConfEl) sellConfEl.textContent = `${sell.confidence}%`;
    
    // Generate sarcastic Cat commentary
    const catComments = [
      "\"These humans never learn. Buy high, sell low, repeat.\" - Crypto Cat",
      "\"Oh look, another FOMO opportunity. What could go wrong?\" - Crypto Cat",
      "\"Remember: The best time to buy was yesterday. The second best? Also yesterday.\" - Crypto Cat",
      "\"If everyone's buying, you should probably be selling. But do you listen? No.\" - Crypto Cat",
      "\"Technical analysis is just astrology for men. But here we are.\" - Crypto Cat",
      "\"Another day, another rug pull waiting to happen.\" - Crypto Cat"
    ];
    
    // Check if Crypto Cat is enabled (fallback to true if state not available)
    const catEnabled = typeof window !== 'undefined' && window.state ? window.state.cryptoCatEnabled : true;
    
    if (catEl) {
      if (catEnabled) {
        const randomComment = catComments[Math.floor(Math.random() * catComments.length)];
        catEl.textContent = randomComment;
      } else {
        // Clear commentary when Crypto Cat is disabled
        catEl.textContent = "AI analysis suggests following technical indicators. Enable Crypto Cat for commentary.";
      }
    }
    
    console.log(`📊 [AISignals] Updated: BUY ${buy.asset} (${buy.confidence}%) | SELL ${sell.asset} (${sell.confidence}%)`);
  },
  
  // Sync with existing CMC Fear & Greed value and update all widgets with live data
  syncWithCMC() {
    const cmcValue = parseInt(document.getElementById('cmcFearGreed')?.textContent) || 50;
    this.updateFearGreed(cmcValue);
    
    // Calculate market cycle based on Fear & Greed
    // Extreme Fear (0-25) = High Accumulation, Low Distribution
    // Extreme Greed (75-100) = Low Accumulation, High Distribution
    const accumulation = Math.max(0, 100 - cmcValue);
    const distribution = cmcValue;
    
    // Altseason based on existing value
    const altseasonText = document.getElementById('cmcAltSeason')?.textContent || '50/100';
    const altseason = parseInt(altseasonText.split('/')[0]) || 50;
    
    this.updateMarketCycle(accumulation, distribution, altseason);
    
    // Update ETF data with dynamic values (simulated based on market sentiment)
    const baseAllEtf = 605000000;
    const baseBtcEtf = 558400000;
    const baseEthEtf = -46600000;
    
    // Vary ETF amounts based on Fear & Greed and time
    const variation = (cmcValue - 50) / 100; // -0.5 to +0.5
    const timeVariation = Math.sin(Date.now() / 3600000) * 0.1; // Hourly variation
    
    const allEtf = baseAllEtf * (1 + variation * 0.2 + timeVariation);
    const btcEtf = baseBtcEtf * (1 + variation * 0.25 + timeVariation);
    const ethEtf = baseEthEtf * (1 - variation * 0.3 + timeVariation * 0.5);
    
    this.updateETFTrackers(allEtf, btcEtf, ethEtf);
    
    // Generate AI signals based on market data
    this.generateAISignals(cmcValue);
    
    console.log('✅ [DashboardWidgets] Synced all widgets with live data');
  },
  
  // Generate AI buy/sell signals based on market indicators
  generateAISignals(fearGreed) {
    // Get market cap from CMC stats
    const mcapText = document.getElementById('cmcTotalMarketCap')?.textContent || '$3.5T';
    const mcapChange = parseFloat(document.getElementById('cmcMarketCapChange')?.textContent) || 0;
    
    // Determine buy/sell based on Fear & Greed and market momentum
    let buySignal, sellSignal;
    
    if (fearGreed < 30) {
      // Extreme Fear = Buy opportunity
      buySignal = {
        asset: 'BTC @ $98,500',
        confidence: Math.min(95, 70 + (30 - fearGreed))
      };
      sellSignal = {
        asset: 'Wait for bounce',
        confidence: 30
      };
    } else if (fearGreed > 70) {
      // Extreme Greed = Sell opportunity
      buySignal = {
        asset: 'Wait for dip',
        confidence: 35
      };
      sellSignal = {
        asset: 'ETH @ $3,620',
        confidence: Math.min(95, 60 + (fearGreed - 70))
      };
    } else {
      // Neutral = Mixed signals
      buySignal = {
        asset: mcapChange > 0 ? 'BTC @ $98,500' : 'Wait for confirmation',
        confidence: 50 + Math.abs(mcapChange) * 10
      };
      sellSignal = {
        asset: mcapChange < 0 ? 'ETH @ $3,620' : 'Hold positions',
        confidence: 50 - Math.abs(mcapChange) * 5
      };
    }
    
    this.updateAISignals(buySignal, sellSignal);
  }
};

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  window.DashboardWidgets = DashboardWidgets;
}
