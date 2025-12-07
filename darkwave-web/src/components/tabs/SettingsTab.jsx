import { Accordion, AccordionItem } from '../ui'

export default function SettingsTab() {
  return (
    <div className="settings-tab">
      <div className="section-box mb-md">
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 60, 
            height: 60, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #00D4FF, #9D4EDD)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            👤
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Founder Account</div>
            <div style={{ fontSize: 12, color: '#39FF14' }}>✓ Beta V1 Access</div>
            <div style={{ fontSize: 11, color: '#888' }}>Member since 2025</div>
          </div>
        </div>
      </div>
      
      <Accordion singleOpen={false}>
        <AccordionItem title="Account Settings" icon="👤">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Email Notifications</span>
              <label style={{ 
                width: 44, 
                height: 24, 
                background: '#39FF14', 
                borderRadius: 12,
                position: 'relative',
                cursor: 'pointer'
              }}>
                <span style={{
                  position: 'absolute',
                  right: 4,
                  top: 4,
                  width: 16,
                  height: 16,
                  background: '#fff',
                  borderRadius: '50%'
                }} />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Push Notifications</span>
              <label style={{ 
                width: 44, 
                height: 24, 
                background: '#333', 
                borderRadius: 12,
                position: 'relative',
                cursor: 'pointer'
              }}>
                <span style={{
                  position: 'absolute',
                  left: 4,
                  top: 4,
                  width: 16,
                  height: 16,
                  background: '#888',
                  borderRadius: '50%'
                }} />
              </label>
            </div>
          </div>
        </AccordionItem>
        
        <AccordionItem title="Display Settings" icon="🎨">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              🌙 Dark Theme (Active)
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              🐱 Crypto Cat Mode
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              👔 Business Mode
            </button>
          </div>
        </AccordionItem>
        
        <AccordionItem title="Subscription" icon="💎">
          <div style={{ 
            padding: 16, 
            background: 'rgba(57, 255, 20, 0.1)', 
            border: '1px solid rgba(57, 255, 20, 0.3)',
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ color: '#39FF14', fontWeight: 700, marginBottom: 4 }}>
              ✓ Legacy Founder
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>$4/month</div>
            <div style={{ fontSize: 11, color: '#888' }}>Locked in forever</div>
          </div>
        </AccordionItem>
        
        <AccordionItem title="Security" icon="🔒">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-secondary">Change Password</button>
            <button className="btn btn-secondary">Enable 2FA</button>
            <button className="btn btn-secondary">View Login History</button>
          </div>
        </AccordionItem>
        
        <AccordionItem title="About" icon="ℹ️">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>
              <span style={{ color: '#00D4FF' }}>PULSE</span>
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Version 2.0.6</div>
            <div style={{ fontSize: 11, color: '#666' }}>
              Powered by DarkWave Studios, LLC © 2025
            </div>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
