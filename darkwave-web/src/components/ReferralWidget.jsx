import { useState, useEffect } from 'react';

export default function ReferralWidget({ userId }) {
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/user/referral/stats?userId=${userId}`);
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
          setReferralCode(data.stats.referralCode);
        }
      } catch (err) {
        console.error('Failed to fetch referral stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${referralCode}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: 20,
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ color: '#888', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: 20,
      background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(57, 255, 20, 0.1) 100%)',
      borderRadius: 12,
      border: '1px solid rgba(0, 212, 255, 0.3)',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10, 
        marginBottom: 16 
      }}>
        <span style={{ fontSize: 24 }}>🎁</span>
        <h3 style={{ 
          margin: 0, 
          fontSize: 18, 
          fontWeight: 700,
          color: '#fff'
        }}>
          Refer Friends & Earn
        </h3>
      </div>

      <p style={{ 
        fontSize: 13, 
        color: '#aaa', 
        marginBottom: 16,
        lineHeight: 1.5
      }}>
        Share your referral link and earn $5 for each friend who signs up!
      </p>

      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          fontSize: 11, 
          color: '#888', 
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          Your Referral Code
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: 8,
            border: '1px solid rgba(0, 212, 255, 0.2)',
            fontFamily: 'monospace',
            fontSize: 14,
            color: '#00D4FF',
            letterSpacing: 1,
          }}>
            {referralCode || 'Generating...'}
          </div>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '12px 16px',
              background: copied ? '#39FF14' : '#00D4FF',
              border: 'none',
              borderRadius: 8,
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
        </div>
      </div>

      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginTop: 16,
        }}>
          <div style={{
            padding: 16,
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 8,
            textAlign: 'center',
          }}>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 800, 
              color: '#00D4FF',
              marginBottom: 4
            }}>
              {stats.completedReferrals}
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>
              Successful Referrals
            </div>
          </div>
          <div style={{
            padding: 16,
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 8,
            textAlign: 'center',
          }}>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 800, 
              color: '#39FF14',
              marginBottom: 4
            }}>
              ${stats.totalRewards.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>
              Rewards Earned
            </div>
          </div>
        </div>
      )}

      {stats && stats.pendingReferrals > 0 && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'rgba(255, 165, 0, 0.1)',
          borderRadius: 8,
          border: '1px solid rgba(255, 165, 0, 0.3)',
          fontSize: 12,
          color: '#FFA500',
          textAlign: 'center',
        }}>
          ⏳ {stats.pendingReferrals} pending referral{stats.pendingReferrals > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
