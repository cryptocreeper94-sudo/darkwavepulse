import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_LIVE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover' as any
});

async function createPricingStructure() {
  console.log('🚀 Creating new Stripe pricing structure...\n');

  const results: Record<string, string> = {};

  try {
    // 1. Create Pulse Pro Product
    console.log('📦 Creating Pulse Pro product...');
    const pulsePro = await stripe.products.create({
      name: 'Pulse Pro',
      description: 'AI-powered predictive market analysis for crypto and stocks. Unlimited searches, real-time signals, and institutional-grade analytics.',
      metadata: {
        tier: 'pulse_pro',
        features: 'predictive_analysis,unlimited_searches,ai_signals'
      }
    });
    console.log(`   ✅ Product created: ${pulsePro.id}`);

    // Pulse Pro Monthly - $14.99
    const pulseProMonthly = await stripe.prices.create({
      product: pulsePro.id,
      unit_amount: 1499,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'pulse_pro', billing: 'monthly' }
    });
    results.PULSE_PRO_MONTHLY_PRICE_ID = pulseProMonthly.id;
    console.log(`   ✅ Monthly price: ${pulseProMonthly.id} ($14.99/mo)`);

    // Pulse Pro Annual - $149.99
    const pulseProAnnual = await stripe.prices.create({
      product: pulsePro.id,
      unit_amount: 14999,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier: 'pulse_pro', billing: 'annual' }
    });
    results.PULSE_PRO_ANNUAL_PRICE_ID = pulseProAnnual.id;
    console.log(`   ✅ Annual price: ${pulseProAnnual.id} ($149.99/yr)\n`);

    // 2. Create StrikeAgent Elite Product
    console.log('📦 Creating StrikeAgent Elite product...');
    const strikeAgent = await stripe.products.create({
      name: 'StrikeAgent Elite',
      description: 'Professional-grade token sniper bot with safety checks, honeypot detection, multi-chain support, and ML-powered signal generation.',
      metadata: {
        tier: 'strike_agent',
        features: 'sniper_bot,safety_checks,honeypot_detection,multi_chain,ml_signals'
      }
    });
    console.log(`   ✅ Product created: ${strikeAgent.id}`);

    // StrikeAgent Monthly - $30
    const strikeAgentMonthly = await stripe.prices.create({
      product: strikeAgent.id,
      unit_amount: 3000,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'strike_agent', billing: 'monthly' }
    });
    results.STRIKE_AGENT_MONTHLY_PRICE_ID = strikeAgentMonthly.id;
    console.log(`   ✅ Monthly price: ${strikeAgentMonthly.id} ($30/mo)`);

    // StrikeAgent Annual - $300
    const strikeAgentAnnual = await stripe.prices.create({
      product: strikeAgent.id,
      unit_amount: 30000,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier: 'strike_agent', billing: 'annual' }
    });
    results.STRIKE_AGENT_ANNUAL_PRICE_ID = strikeAgentAnnual.id;
    console.log(`   ✅ Annual price: ${strikeAgentAnnual.id} ($300/yr)\n`);

    // 3. Create DarkWave Complete Bundle Product
    console.log('📦 Creating DarkWave Complete Bundle product...');
    const completeBundle = await stripe.products.create({
      name: 'DarkWave Complete',
      description: 'The ultimate trading package: Pulse Pro predictive analysis + StrikeAgent Elite sniper bot. Best value - save $5/mo vs buying separately.',
      metadata: {
        tier: 'complete_bundle',
        features: 'predictive_analysis,unlimited_searches,ai_signals,sniper_bot,safety_checks,honeypot_detection,multi_chain,ml_signals'
      }
    });
    console.log(`   ✅ Product created: ${completeBundle.id}`);

    // Complete Bundle Monthly - $39.99
    const completeBundleMonthly = await stripe.prices.create({
      product: completeBundle.id,
      unit_amount: 3999,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'complete_bundle', billing: 'monthly' }
    });
    results.COMPLETE_BUNDLE_MONTHLY_PRICE_ID = completeBundleMonthly.id;
    console.log(`   ✅ Monthly price: ${completeBundleMonthly.id} ($39.99/mo)`);

    // Complete Bundle Annual - $399.99
    const completeBundleAnnual = await stripe.prices.create({
      product: completeBundle.id,
      unit_amount: 39999,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier: 'complete_bundle', billing: 'annual' }
    });
    results.COMPLETE_BUNDLE_ANNUAL_PRICE_ID = completeBundleAnnual.id;
    console.log(`   ✅ Annual price: ${completeBundleAnnual.id} ($399.99/yr)\n`);

    // Print summary
    console.log('=' .repeat(60));
    console.log('🎉 SUCCESS! New pricing structure created.\n');
    console.log('Add these environment variables:\n');
    
    for (const [key, value] of Object.entries(results)) {
      console.log(`${key}=${value}`);
    }
    
    console.log('\n' + '='.repeat(60));

    return results;

  } catch (error: any) {
    console.error('❌ Error creating pricing structure:', error.message);
    throw error;
  }
}

createPricingStructure()
  .then((results) => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
