import { BentoGrid, BentoItem } from '../ui'

export default function StakingTab() {
  return (
    <div className="staking-tab">
      <div className="section-box mb-md" style={{ 
        background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1), rgba(0, 212, 255, 0.1))',
        border: '1px solid rgba(157, 78, 221, 0.3)'
      }}>
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💎</div>
          <h2 style={{ marginBottom: 8 }}>DWAV Staking</h2>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
            Stake your DWAV tokens to earn hourly rewards
          </p>
          <div style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            background: 'rgba(255, 165, 0, 0.2)', 
            border: '1px solid rgba(255, 165, 0, 0.4)',
            borderRadius: 20,
            fontSize: 12,
            color: '#FFA500'
          }}>
            🔒 Launching February 14, 2026
          </div>
        </div>
      </div>
      
      <BentoGrid columns={2}>
        <BentoItem>
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 11, color: '#9D4EDD', fontWeight: 700, marginBottom: 4 }}>APY</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#39FF14' }}>12%</div>
            <div style={{ fontSize: 10, color: '#888' }}>Annual yield</div>
          </div>
        </BentoItem>
        <BentoItem>
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 11, color: '#9D4EDD', fontWeight: 700, marginBottom: 4 }}>REWARDS</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Hourly</div>
            <div style={{ fontSize: 10, color: '#888' }}>Claim anytime</div>
          </div>
        </BentoItem>
      </BentoGrid>
      
      <div className="section-box" style={{ marginTop: 16 }}>
        <div className="section-header">
          <h3 className="section-title">Staking Tiers</h3>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ 
            padding: 16, 
            background: '#1a1a1a', 
            borderRadius: 12,
            border: '1px solid #333',
            marginBottom: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>🥉 Bronze</div>
                <div style={{ fontSize: 11, color: '#888' }}>1,000 - 9,999 DWAV</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#39FF14', fontWeight: 700 }}>8% APY</div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            padding: 16, 
            background: '#1a1a1a', 
            borderRadius: 12,
            border: '1px solid #333',
            marginBottom: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>🥈 Silver</div>
                <div style={{ fontSize: 11, color: '#888' }}>10,000 - 49,999 DWAV</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#39FF14', fontWeight: 700 }}>10% APY</div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            padding: 16, 
            background: '#1a1a1a', 
            borderRadius: 12,
            border: '1px solid #9D4EDD',
            marginBottom: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4, color: '#9D4EDD' }}>🥇 Gold</div>
                <div style={{ fontSize: 11, color: '#888' }}>50,000+ DWAV</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#39FF14', fontWeight: 700 }}>12% APY</div>
                <div style={{ fontSize: 10, color: '#9D4EDD' }}>+ Bonus rewards</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
