import { useState } from 'react';

const SHARE_PLATFORMS = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    color: '#000000',
    getUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    color: '#0088cc',
    getUrl: (text, url) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '💬',
    color: '#5865F2',
    getUrl: (text, url) => null
  },
  {
    id: 'copy',
    name: 'Copy Link',
    icon: '📋',
    color: '#00d4aa',
    getUrl: () => null
  }
];

export default function SocialShareButtons({ 
  shareText = "Check out Pulse - AI-powered predictive trading with StrikeAgent!",
  shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pulse.darkwavestudios.io',
  referralCode = null,
  variant = 'horizontal',
  showLabels = true 
}) {
  const [copied, setCopied] = useState(false);
  
  const fullUrl = referralCode ? `${shareUrl}?ref=${referralCode}` : shareUrl;
  const fullText = referralCode 
    ? `${shareText} Use my referral code: ${referralCode}` 
    : shareText;

  const handleShare = async (platform) => {
    if (platform.id === 'copy') {
      try {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      return;
    }

    if (platform.id === 'discord') {
      try {
        await navigator.clipboard.writeText(`${fullText}\n${fullUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy for Discord:', err);
      }
      return;
    }

    const url = platform.getUrl(fullText, fullUrl);
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className={`social-share-buttons ${variant}`} style={{
      display: 'flex',
      flexDirection: variant === 'vertical' ? 'column' : 'row',
      gap: 8,
      flexWrap: 'wrap'
    }}>
      {SHARE_PLATFORMS.map(platform => (
        <button
          key={platform.id}
          onClick={() => handleShare(platform)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: showLabels ? '10px 16px' : '10px 12px',
            background: `linear-gradient(135deg, ${platform.color}22, ${platform.color}11)`,
            border: `1px solid ${platform.color}44`,
            borderRadius: 10,
            color: platform.color === '#000000' ? '#fff' : platform.color,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: showLabels ? 120 : 44
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 4px 15px ${platform.color}33`;
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: 16 }}>{platform.icon}</span>
          {showLabels && (
            <span>
              {platform.id === 'copy' 
                ? (copied ? '✓ Copied!' : platform.name)
                : platform.id === 'discord'
                  ? (copied ? '✓ Copied!' : platform.name)
                  : platform.name
              }
            </span>
          )}
        </button>
      ))}
      
      <style>{`
        .social-share-buttons button:hover {
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}

export function ShareTradeButton({ trade, variant = 'icon' }) {
  const shareText = trade 
    ? `Just ${trade.type === 'buy' ? 'bought' : 'sold'} ${trade.symbol} on Pulse StrikeAgent! ${trade.pnl > 0 ? `+${trade.pnl.toFixed(2)}%` : ''}`
    : "Trading with AI-powered StrikeAgent on Pulse!";
  
  return (
    <SocialShareButtons 
      shareText={shareText}
      variant={variant === 'icon' ? 'horizontal' : 'vertical'}
      showLabels={variant !== 'icon'}
    />
  );
}

export function SharePnLCard({ totalPnL, winRate, tradeCount }) {
  const [shared, setShared] = useState(false);
  
  const shareText = `My Pulse StrikeAgent Stats:\n📈 P&L: ${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}%\n🎯 Win Rate: ${winRate.toFixed(1)}%\n📊 Trades: ${tradeCount}\n\nTry StrikeAgent free for 3 days!`;
  
  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: 16,
      padding: 20,
      border: '1px solid rgba(0, 212, 170, 0.3)',
      boxShadow: '0 0 30px rgba(0, 212, 170, 0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>Share Your Results</h3>
        <span style={{ color: totalPnL >= 0 ? '#39FF14' : '#ff4444', fontWeight: 700 }}>
          {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}%
        </span>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 12, 
        marginBottom: 16 
      }}>
        <div style={{ textAlign: 'center', padding: 12, background: '#0f0f0f', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>P&L</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: totalPnL >= 0 ? '#39FF14' : '#ff4444' }}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(1)}%
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: 12, background: '#0f0f0f', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Win Rate</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#00d4aa' }}>{winRate.toFixed(0)}%</div>
        </div>
        <div style={{ textAlign: 'center', padding: 12, background: '#0f0f0f', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Trades</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{tradeCount}</div>
        </div>
      </div>
      
      <SocialShareButtons 
        shareText={shareText}
        showLabels={true}
      />
    </div>
  );
}
