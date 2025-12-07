import { auditTrailService, AUDIT_EVENT_TYPES } from '../src/services/auditTrailService.js';

async function stampVersion() {
  const version = 'v2.0.6';
  
  console.log(`\n🔐 Stamping version ${version} to Solana blockchain...\n`);
  
  try {
    const event = await auditTrailService.logEvent({
      userId: 'system',
      eventType: AUDIT_EVENT_TYPES.SYSTEM_VERSION_STAMP,
      category: 'system',
      actor: 'darkwave-admin',
      data: {
        version: version,
        releaseDate: '2025-12-07',
        changes: [
          'Slim single-line footer redesign',
          'Business documents created (Executive Summary, Investor Brief, Roadmap, Bootstrap Plan)',
          'Version stamp visible in Electric Blue (#00D4FF)',
          'Mobile-optimized footer styling',
          'All pages synced (index, landing pages)'
        ],
        platform: 'DarkWave PULSE',
        network: 'Solana Mainnet'
      }
    });
    
    console.log(`✅ Event created: ${event.id}`);
    console.log(`📝 Payload hash: ${event.payloadHash}`);
    
    // Wait for on-chain confirmation
    console.log(`\n⏳ Posting to Solana mainnet...`);
    const signature = await auditTrailService.postOnChainAndWait(event.id);
    
    if (signature) {
      console.log(`\n✅ SUCCESS! Version ${version} stamped to Solana!`);
      console.log(`\n📋 Details:`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Hash: ${event.payloadHash}`);
      console.log(`   Signature: ${signature}`);
      console.log(`   Explorer: https://solscan.io/tx/${signature}`);
    } else {
      console.log(`\n⚠️ Event logged but not posted on-chain (wallet may not be configured)`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Hash: ${event.payloadHash}`);
    }
    
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
  
  process.exit(0);
}

stampVersion();
