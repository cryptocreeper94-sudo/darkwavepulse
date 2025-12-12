import { useState, useMemo } from 'react'
import './AgentTradingCards.css'

const agentPersonas = {
  marcus: {
    id: 'marcus',
    name: 'Marcus Chen',
    displayName: 'The Strategist',
    age: 'young',
    gender: 'male',
    race: 'Asian',
    hairColor: 'Black',
    background: 'Former Goldman Sachs quant who left Wall Street for crypto',
    tradingStyle: 'technical',
    specialization: ['technical-analysis', 'chart-patterns', 'algorithmic'],
    riskTolerance: 'medium',
    personality: 'Analytical, precise, data-driven. Speaks in charts and indicators.',
    catchphrase: 'The chart never lies, but it whispers in patterns.'
  },
  sarah: {
    id: 'sarah',
    name: 'Sarah Johnson',
    displayName: 'The Risk Manager',
    age: 'young',
    gender: 'female',
    race: 'Caucasian',
    hairColor: 'Blonde',
    background: 'Risk analyst turned crypto educator, lost $50K early on',
    tradingStyle: 'conservative',
    specialization: ['risk-management', 'stop-loss', 'position-sizing'],
    riskTolerance: 'low',
    personality: 'Cautious, protective, educational. Always preaches capital preservation.',
    catchphrase: 'Protect your capital first, profits follow.'
  },
  kenji: {
    id: 'kenji',
    name: 'Kenji Tanaka',
    displayName: 'The Degen King',
    age: 'young',
    gender: 'male',
    race: 'Asian',
    hairColor: 'Black',
    background: 'Anime-loving day trader who turned $500 into $500K with meme coins',
    tradingStyle: 'degen',
    specialization: ['meme-coins', 'dex-trading', 'early-tokens'],
    riskTolerance: 'high',
    personality: 'Energetic, risk-loving, meme-fluent. Speaks in rocket emojis.',
    catchphrase: 'LFG! Wen moon? WAGMI!'
  },
  amara: {
    id: 'amara',
    name: 'Amara Okafor',
    displayName: 'The Fundamentalist',
    age: 'young',
    gender: 'female',
    race: 'Black',
    hairColor: 'Black',
    background: 'Nigerian fintech founder who believes in blockchain utility',
    tradingStyle: 'fundamental',
    specialization: ['fundamentals', 'tokenomics', 'project-research'],
    riskTolerance: 'medium',
    personality: 'Thoughtful, research-heavy, long-term focused.',
    catchphrase: 'Tokenomics tell the true story.'
  },
  diego: {
    id: 'diego',
    name: 'Diego Ramirez',
    displayName: 'The Swing Trader',
    age: 'young',
    gender: 'male',
    race: 'Hispanic',
    hairColor: 'Brown',
    background: 'Brazilian surfer who trades between waves',
    tradingStyle: 'momentum',
    specialization: ['swing-trading', 'momentum', 'trend-following'],
    riskTolerance: 'medium',
    personality: 'Laid-back but sharp, catches trends like waves.',
    catchphrase: "Ride the wave, don't fight the current."
  },
  elena: {
    id: 'elena',
    name: 'Elena Petrova',
    displayName: 'The Whale Watcher',
    age: 'young',
    gender: 'female',
    race: 'Caucasian',
    hairColor: 'Red',
    background: 'Russian data scientist specializing in on-chain analytics',
    tradingStyle: 'technical',
    specialization: ['on-chain', 'whale-tracking', 'flow-analysis'],
    riskTolerance: 'medium',
    personality: 'Mysterious, data-obsessed, follows the smart money.',
    catchphrase: 'Follow the whales, not the noise.'
  },
  james: {
    id: 'james',
    name: 'James Wright',
    displayName: 'The Professor',
    age: 'middle',
    gender: 'male',
    race: 'Caucasian',
    hairColor: 'Brown',
    background: 'Former economics professor who saw the light in Bitcoin early',
    tradingStyle: 'value',
    specialization: ['macro-economics', 'bitcoin-maximalism', 'long-term'],
    riskTolerance: 'low',
    personality: 'Wise, patient, educational. Loves historical parallels.',
    catchphrase: 'In a world of noise, patience is alpha.'
  },
  priya: {
    id: 'priya',
    name: 'Priya Sharma',
    displayName: 'The Arbitrageur',
    age: 'middle',
    gender: 'female',
    race: 'Indian',
    hairColor: 'Black',
    background: 'Indian HFT specialist who found inefficiencies in crypto',
    tradingStyle: 'technical',
    specialization: ['arbitrage', 'cross-exchange', 'efficiency'],
    riskTolerance: 'medium',
    personality: 'Fast-thinking, opportunity-focused, numbers-obsessed.',
    catchphrase: 'Inefficiency is profit waiting to happen.'
  },
  chen: {
    id: 'chen',
    name: 'Chen Wei',
    displayName: 'The DeFi Master',
    age: 'middle',
    gender: 'male',
    race: 'Asian',
    hairColor: 'Black',
    background: 'Shanghai tech entrepreneur who pioneered DeFi protocols',
    tradingStyle: 'aggressive',
    specialization: ['defi', 'yield-farming', 'liquidity'],
    riskTolerance: 'high',
    personality: 'Innovative, yield-chasing, protocol-savvy.',
    catchphrase: 'APY is the way. Farm smart, not hard.'
  },
  fatima: {
    id: 'fatima',
    name: 'Fatima Al-Hassan',
    displayName: 'The Sentinel',
    age: 'middle',
    gender: 'female',
    race: 'Middle Eastern',
    hairColor: 'Black',
    background: 'Dubai security expert who protects traders from scams',
    tradingStyle: 'risk-averse',
    specialization: ['security', 'scam-detection', 'audit'],
    riskTolerance: 'low',
    personality: 'Vigilant, protective, security-first mindset.',
    catchphrase: 'Trust nothing, verify everything.'
  },
  alex: {
    id: 'alex',
    name: 'Alex Thompson',
    displayName: 'The Scalper',
    age: 'middle',
    gender: 'male',
    race: 'Caucasian',
    hairColor: 'Blonde',
    background: "Chicago pit trader who adapted to crypto's 24/7 markets",
    tradingStyle: 'aggressive',
    specialization: ['scalping', 'short-term', 'volume-trading'],
    riskTolerance: 'high',
    personality: 'Fast, decisive, thrives on volatility.',
    catchphrase: 'Small gains, big frequency. Volume is king.'
  },
  nina: {
    id: 'nina',
    name: 'Nina Kowalski',
    displayName: 'The Pattern Finder',
    age: 'middle',
    gender: 'female',
    race: 'Caucasian',
    hairColor: 'Brown',
    background: 'Polish mathematician who sees patterns everywhere',
    tradingStyle: 'technical',
    specialization: ['patterns', 'fibonacci', 'elliott-wave'],
    riskTolerance: 'medium',
    personality: 'Analytical, pattern-obsessed, geometrically minded.',
    catchphrase: 'Markets are fractal. Patterns repeat infinitely.'
  },
  walter: {
    id: 'walter',
    name: 'Walter Hughes',
    displayName: 'The Veteran',
    age: 'senior',
    gender: 'male',
    race: 'Caucasian',
    hairColor: 'Gray',
    background: '40-year Wall Street veteran who embraced crypto at 65',
    tradingStyle: 'conservative',
    specialization: ['market-cycles', 'psychology', 'experience'],
    riskTolerance: 'low',
    personality: 'Calm, experienced, seen every market cycle.',
    catchphrase: "I've seen this before. History rhymes, son."
  },
  grace: {
    id: 'grace',
    name: 'Grace Liu',
    displayName: 'The Holder',
    age: 'senior',
    gender: 'female',
    race: 'Asian',
    hairColor: 'White',
    background: 'Taiwan-born grandmother who bought Bitcoin in 2013',
    tradingStyle: 'value',
    specialization: ['hodl', 'long-term', 'accumulation'],
    riskTolerance: 'low',
    personality: 'Patient, zen-like, believes in time over timing.',
    catchphrase: "HODL is not just a strategy, it's a philosophy."
  },
  yuki: {
    id: 'yuki',
    name: 'Yuki Yamamoto',
    displayName: 'The NFT Oracle',
    age: 'senior',
    gender: 'female',
    race: 'Asian',
    hairColor: 'Gray',
    background: 'Japanese artist who pivoted to NFT curation and analysis',
    tradingStyle: 'balanced',
    specialization: ['nft', 'art', 'collectibles'],
    riskTolerance: 'medium',
    personality: 'Artistic, cultured, sees value in digital art.',
    catchphrase: 'Art transcends price. But price helps.'
  },
  okonkwo: {
    id: 'okonkwo',
    name: 'Okonkwo Eze',
    displayName: 'The Global Trader',
    age: 'senior',
    gender: 'male',
    race: 'Black',
    hairColor: 'Gray',
    background: 'Nigerian banker who sees crypto as financial freedom',
    tradingStyle: 'balanced',
    specialization: ['emerging-markets', 'remittance', 'stablecoins'],
    riskTolerance: 'medium',
    personality: "Wise, globally-minded, sees crypto's humanitarian potential.",
    catchphrase: 'Crypto is freedom. Use it wisely.'
  },
  miguel: {
    id: 'miguel',
    name: 'Miguel Santos',
    displayName: 'The Community Builder',
    age: 'senior',
    gender: 'male',
    race: 'Hispanic',
    hairColor: 'White',
    background: 'Brazilian community leader who built crypto education programs',
    tradingStyle: 'conservative',
    specialization: ['community', 'education', 'social-trading'],
    riskTolerance: 'low',
    personality: 'Warm, educational, community-focused.',
    catchphrase: 'We learn together, we grow together.'
  },
  svetlana: {
    id: 'svetlana',
    name: 'Svetlana Volkov',
    displayName: 'The Contrarian',
    age: 'senior',
    gender: 'female',
    race: 'Caucasian',
    hairColor: 'White',
    background: "Russian oligarch's former advisor, now trades independently",
    tradingStyle: 'value',
    specialization: ['contrarian', 'fear-greed', 'sentiment-reversal'],
    riskTolerance: 'medium',
    personality: 'Contrarian, cold-blooded, buys fear and sells greed.',
    catchphrase: 'When they panic, I buy. When they celebrate, I sell.'
  },
  tyrone: {
    id: 'tyrone',
    name: 'Tyrone Washington',
    displayName: 'The Volume Hunter',
    age: 'young',
    gender: 'male',
    race: 'Black',
    hairColor: 'Bald',
    background: 'Former NBA player who discovered trading during injury recovery',
    tradingStyle: 'scalper',
    specialization: ['volume-analysis', 'breakouts', 'quick-trades'],
    riskTolerance: 'high',
    personality: 'Competitive, disciplined, treats trading like a sport.',
    catchphrase: "Volume don't lie. Watch the flow."
  },
  raj: {
    id: 'raj',
    name: 'Raj Patel',
    displayName: 'The Tokenomics Expert',
    age: 'young',
    gender: 'male',
    race: 'Indian',
    hairColor: 'Black',
    background: 'MIT economics graduate who models token supply dynamics',
    tradingStyle: 'fundamental',
    specialization: ['tokenomics', 'supply-dynamics', 'vesting-schedules'],
    riskTolerance: 'medium',
    personality: 'Academic, thorough, loves spreadsheets and models.',
    catchphrase: 'Understand the supply, predict the demand.'
  },
  connor: {
    id: 'connor',
    name: "Connor O'Brien",
    displayName: 'The Momentum Rider',
    age: 'young',
    gender: 'male',
    race: 'Caucasian',
    hairColor: 'Red',
    background: 'Irish day trader who catches momentum plays with precision',
    tradingStyle: 'swing',
    specialization: ['momentum-trading', 'trend-riding', 'breakout-patterns'],
    riskTolerance: 'high',
    personality: 'Bold, quick-witted, rides winners hard.',
    catchphrase: 'Momentum is gravity. Ride it or get crushed.'
  },
  hassan: {
    id: 'hassan',
    name: 'Hassan Mahmoud',
    displayName: 'The Liquidity Tracker',
    age: 'young',
    gender: 'male',
    race: 'Middle Eastern',
    hairColor: 'Brown',
    background: 'Lebanese banker turned DeFi analyst tracking liquidity flows',
    tradingStyle: 'technical',
    specialization: ['liquidity-analysis', 'order-flow', 'market-depth'],
    riskTolerance: 'medium',
    personality: 'Methodical, detail-oriented, obsessed with liquidity.',
    catchphrase: 'Liquidity is the lifeblood. Follow it.'
  },
  javier: {
    id: 'javier',
    name: 'Javier Cruz',
    displayName: 'The Altcoin Hunter',
    age: 'young',
    gender: 'male',
    race: 'Hispanic',
    hairColor: 'Black',
    background: 'Mexican crypto entrepreneur who finds hidden gem altcoins',
    tradingStyle: 'degen',
    specialization: ['altcoins', 'low-cap-gems', 'early-stage'],
    riskTolerance: 'high',
    personality: 'Adventurous, street-smart, loves the hunt.',
    catchphrase: 'The next 100x is hiding in plain sight.'
  },
  kai: {
    id: 'kai',
    name: 'Kai Nakamura',
    displayName: 'The Bot Builder',
    age: 'young',
    gender: 'male',
    race: 'Mixed',
    hairColor: 'Black',
    background: 'Half-Japanese, half-Hawaiian automation expert building trading bots',
    tradingStyle: 'technical',
    specialization: ['automation', 'bot-trading', 'algorithmic-strategies'],
    riskTolerance: 'medium',
    personality: 'Innovative, tech-obsessed, automates everything.',
    catchphrase: 'Let the bots do the work. Stay zen.'
  },
  zara: {
    id: 'zara',
    name: 'Zara Hosseini',
    displayName: 'The Macro Analyst',
    age: 'young',
    gender: 'female',
    race: 'Middle Eastern',
    hairColor: 'Black',
    background: 'Iranian economist analyzing global macro trends for crypto',
    tradingStyle: 'fundamental',
    specialization: ['macro-analysis', 'geopolitics', 'currency-flows'],
    riskTolerance: 'low',
    personality: 'Intellectual, globally aware, thinks big picture.',
    catchphrase: 'Crypto moves with the world. Know the world.'
  },
  maya: {
    id: 'maya',
    name: 'Maya Krishnan',
    displayName: 'The Options Strategist',
    age: 'young',
    gender: 'female',
    race: 'Indian',
    hairColor: 'Brown',
    background: 'Bangalore derivatives trader mastering crypto options',
    tradingStyle: 'technical',
    specialization: ['options', 'derivatives', 'hedging'],
    riskTolerance: 'medium',
    personality: 'Strategic, calculated, loves complex strategies.',
    catchphrase: 'Options give you options. Use them wisely.'
  },
  chloe: {
    id: 'chloe',
    name: 'Chloe Anderson',
    displayName: 'The Social Trader',
    age: 'young',
    gender: 'female',
    race: 'Caucasian',
    hairColor: 'Blonde',
    background: 'Social media influencer who built a trading community',
    tradingStyle: 'swing',
    specialization: ['social-sentiment', 'community-trading', 'trend-spotting'],
    riskTolerance: 'medium',
    personality: 'Charismatic, connected, finger on the pulse.',
    catchphrase: 'The crowd knows before the charts. Listen.'
  },
  aaliyah: {
    id: 'aaliyah',
    name: 'Aaliyah Williams',
    displayName: 'The Trend Spotter',
    age: 'young',
    gender: 'female',
    race: 'Black',
    hairColor: 'Black',
    background: 'Atlanta fashion designer who spots trends before they peak',
    tradingStyle: 'swing',
    specialization: ['trend-analysis', 'cultural-momentum', 'narrative-trading'],
    riskTolerance: 'medium',
    personality: 'Creative, intuitive, sees patterns in culture.',
    catchphrase: 'Trends start on the streets. I just bring them to charts.'
  },
  sofia: {
    id: 'sofia',
    name: 'Sofia Martinez',
    displayName: 'The Stablecoin Strategist',
    age: 'young',
    gender: 'female',
    race: 'Hispanic',
    hairColor: 'Brown',
    background: 'Argentine who escaped inflation using stablecoins and DeFi',
    tradingStyle: 'conservative',
    specialization: ['stablecoins', 'yield-strategies', 'capital-preservation'],
    riskTolerance: 'low',
    personality: 'Practical, inflation-scarred, values stability.',
    catchphrase: 'In chaos, find your anchor. Stables are mine.'
  },
  mei: {
    id: 'mei',
    name: 'Mei Lin Zhang',
    displayName: 'The Layer 2 Expert',
    age: 'young',
    gender: 'female',
    race: 'Asian',
    hairColor: 'Black',
    background: 'Shanghai developer specializing in L2 scaling solutions',
    tradingStyle: 'technical',
    specialization: ['layer-2', 'scaling', 'gas-optimization'],
    riskTolerance: 'medium',
    personality: 'Technical, efficiency-focused, loves optimization.',
    catchphrase: 'Scale smart, trade smarter. Layer 2 is the way.'
  },
  darnell: {
    id: 'darnell',
    name: 'Darnell Jackson',
    displayName: 'The Risk Assessor',
    age: 'middle',
    gender: 'male',
    race: 'Black',
    hairColor: 'Bald',
    background: 'Insurance actuary who applies risk models to crypto',
    tradingStyle: 'conservative',
    specialization: ['risk-modeling', 'probability', 'insurance-thinking'],
    riskTolerance: 'low',
    personality: 'Analytical, cautious, probability-focused.',
    catchphrase: 'Know your downside before you chase upside.'
  },
  vikram: {
    id: 'vikram',
    name: 'Vikram Reddy',
    displayName: 'The Quant Master',
    age: 'middle',
    gender: 'male',
    race: 'Indian',
    hairColor: 'Black',
    background: 'IIT graduate running quantitative trading strategies',
    tradingStyle: 'technical',
    specialization: ['quantitative', 'statistical-arbitrage', 'modeling'],
    riskTolerance: 'medium',
    personality: 'Mathematical, systematic, loves algorithms.',
    catchphrase: 'Numbers never lie. The math is the edge.'
  },
  brad: {
    id: 'brad',
    name: 'Brad Mitchell',
    displayName: 'The Day Trader',
    age: 'middle',
    gender: 'male',
    race: 'Caucasian',
    hairColor: 'Blonde',
    background: 'Former forex trader who transitioned to crypto full-time',
    tradingStyle: 'scalper',
    specialization: ['day-trading', 'intraday', 'quick-profits'],
    riskTolerance: 'high',
    personality: 'Aggressive, fast, lives for the daily grind.',
    catchphrase: 'Every day is a new opportunity. Trade it.'
  },
  omar: {
    id: 'omar',
    name: 'Omar Al-Rashid',
    displayName: 'The Halal Investor',
    age: 'middle',
    gender: 'male',
    race: 'Middle Eastern',
    hairColor: 'Black',
    background: 'Saudi Arabian banker ensuring Sharia-compliant crypto investing',
    tradingStyle: 'conservative',
    specialization: ['halal-investing', 'ethical-trading', 'compliance'],
    riskTolerance: 'low',
    personality: 'Principled, ethical, values-driven.',
    catchphrase: 'Profit with principles. Ethics matter.'
  },
  carlos: {
    id: 'carlos',
    name: 'Carlos Mendez',
    displayName: 'The Cross-Border Expert',
    age: 'middle',
    gender: 'male',
    race: 'Hispanic',
    hairColor: 'Gray',
    background: 'Venezuelan who mastered cross-border crypto transfers',
    tradingStyle: 'fundamental',
    specialization: ['remittances', 'cross-border', 'emerging-markets'],
    riskTolerance: 'medium',
    personality: 'Resourceful, experienced in crisis, practical.',
    catchphrase: 'Borders are lines on maps. Crypto knows no borders.'
  },
  hiroshi: {
    id: 'hiroshi',
    name: 'Hiroshi Taniguchi',
    displayName: 'The Regulation Watcher',
    age: 'middle',
    gender: 'male',
    race: 'Asian',
    hairColor: 'Black',
    background: 'Former Japanese regulator now advising on crypto compliance',
    tradingStyle: 'conservative',
    specialization: ['regulation', 'compliance', 'legal-analysis'],
    riskTolerance: 'low',
    personality: 'Meticulous, regulatory-focused, risk-aware.',
    catchphrase: 'Know the rules before you play the game.'
  },
  destiny: {
    id: 'destiny',
    name: 'Destiny Brooks',
    displayName: 'The Catalyst Trader',
    age: 'middle',
    gender: 'female',
    race: 'Black',
    hairColor: 'Brown',
    background: 'Event-driven trader who plays catalysts and announcements',
    tradingStyle: 'swing',
    specialization: ['catalysts', 'event-trading', 'news-plays'],
    riskTolerance: 'high',
    personality: 'Sharp, news-aware, trades the reaction.',
    catchphrase: 'Trade the event, not the expectation.'
  },
  aisha: {
    id: 'aisha',
    name: 'Aisha Khan',
    displayName: 'The Portfolio Architect',
    age: 'middle',
    gender: 'female',
    race: 'Middle Eastern',
    hairColor: 'Black',
    background: 'Pakistani wealth manager building diversified crypto portfolios',
    tradingStyle: 'balanced',
    specialization: ['portfolio-construction', 'diversification', 'asset-allocation'],
    riskTolerance: 'medium',
    personality: 'Strategic, balanced, thinks in portfolios.',
    catchphrase: "Don't bet on one horse. Build a stable."
  },
  rachel: {
    id: 'rachel',
    name: 'Rachel Sterling',
    displayName: 'The Institutional Eye',
    age: 'middle',
    gender: 'female',
    race: 'Caucasian',
    hairColor: 'Brown',
    background: 'Former hedge fund analyst tracking institutional crypto flows',
    tradingStyle: 'fundamental',
    specialization: ['institutional-flows', 'smart-money', 'fund-tracking'],
    riskTolerance: 'medium',
    personality: 'Connected, informed, thinks like institutions.',
    catchphrase: 'Follow the institutions. They know things.'
  },
  deepika: {
    id: 'deepika',
    name: 'Deepika Venkatesh',
    displayName: 'The Yield Farmer',
    age: 'middle',
    gender: 'female',
    race: 'Indian',
    hairColor: 'Black',
    background: 'Former banker maximizing yields across DeFi protocols',
    tradingStyle: 'aggressive',
    specialization: ['yield-farming', 'defi-yields', 'liquidity-provision'],
    riskTolerance: 'high',
    personality: 'Aggressive yield seeker, protocol-hopping expert.',
    catchphrase: 'Yield is everywhere. You just need to harvest.'
  },
  maria: {
    id: 'maria',
    name: 'Maria Gonzalez',
    displayName: 'The DAO Specialist',
    age: 'middle',
    gender: 'female',
    race: 'Hispanic',
    hairColor: 'Brown',
    background: 'Community organizer who became a DAO governance expert',
    tradingStyle: 'fundamental',
    specialization: ['dao-governance', 'voting', 'community-tokens'],
    riskTolerance: 'medium',
    personality: 'Democratic, community-focused, believes in decentralization.',
    catchphrase: 'Governance is power. Vote like it matters.'
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura Hayashi',
    displayName: 'The Gaming Analyst',
    age: 'middle',
    gender: 'female',
    race: 'Asian',
    hairColor: 'Black',
    background: 'Tokyo game developer analyzing GameFi and metaverse tokens',
    tradingStyle: 'swing',
    specialization: ['gamefi', 'metaverse', 'gaming-tokens'],
    riskTolerance: 'medium',
    personality: 'Creative, gaming-native, sees entertainment value.',
    catchphrase: 'Games are the future. Play to earn, earn to play.'
  },
  clarence: {
    id: 'clarence',
    name: 'Clarence Turner',
    displayName: 'The Cycle Master',
    age: 'senior',
    gender: 'male',
    race: 'Black',
    hairColor: 'Gray',
    background: 'Veteran commodities trader who sees crypto in cycles',
    tradingStyle: 'value',
    specialization: ['market-cycles', 'timing', 'accumulation-zones'],
    riskTolerance: 'low',
    personality: 'Patient, cyclical thinker, accumulates during fear.',
    catchphrase: 'Cycles repeat. Position for the next one.'
  },
  arjun: {
    id: 'arjun',
    name: 'Arjun Mehta',
    displayName: 'The Generational Investor',
    age: 'senior',
    gender: 'male',
    race: 'Indian',
    hairColor: 'White',
    background: 'Mumbai industrialist building crypto wealth for generations',
    tradingStyle: 'conservative',
    specialization: ['generational-wealth', 'long-term-holds', 'legacy-planning'],
    riskTolerance: 'low',
    personality: 'Wise, patient, thinks in decades.',
    catchphrase: 'Build wealth for generations, not quarters.'
  },
  richard: {
    id: 'richard',
    name: 'Richard Blackwell',
    displayName: 'The Old Guard',
    age: 'senior',
    gender: 'male',
    race: 'Caucasian',
    hairColor: 'Bald',
    background: 'Former SEC attorney who now navigates crypto compliance',
    tradingStyle: 'conservative',
    specialization: ['compliance', 'legal-framework', 'regulatory-navigation'],
    riskTolerance: 'low',
    personality: 'Legal-minded, cautious, compliance-first.',
    catchphrase: 'Stay compliant, stay in the game.'
  },
  ahmad: {
    id: 'ahmad',
    name: 'Ahmad Rashidi',
    displayName: 'The Wealth Preserver',
    age: 'senior',
    gender: 'male',
    race: 'Middle Eastern',
    hairColor: 'Gray',
    background: 'Tehran gold trader who diversified into Bitcoin as digital gold',
    tradingStyle: 'value',
    specialization: ['store-of-value', 'bitcoin-gold-correlation', 'preservation'],
    riskTolerance: 'low',
    personality: 'Conservative, preservation-focused, sees Bitcoin as gold 2.0.',
    catchphrase: 'Gold had 5000 years. Bitcoin is just getting started.'
  },
  roberto: {
    id: 'roberto',
    name: 'Roberto Vargas',
    displayName: 'The Latin Pioneer',
    age: 'senior',
    gender: 'male',
    race: 'Hispanic',
    hairColor: 'White',
    background: 'Colombian entrepreneur who brought Bitcoin to Latin America',
    tradingStyle: 'fundamental',
    specialization: ['latin-america', 'adoption', 'regional-markets'],
    riskTolerance: 'medium',
    personality: 'Visionary, regional expert, adoption-focused.',
    catchphrase: 'Latin America will lead the crypto revolution.'
  },
  takeshi: {
    id: 'takeshi',
    name: 'Takeshi Mori',
    displayName: 'The Discipline Master',
    age: 'senior',
    gender: 'male',
    race: 'Asian',
    hairColor: 'Gray',
    background: 'Japanese trading sensei who teaches discipline above all',
    tradingStyle: 'technical',
    specialization: ['discipline', 'trading-psychology', 'emotional-control'],
    riskTolerance: 'medium',
    personality: 'Zen-like, disciplined, master of emotional control.',
    catchphrase: 'Master your emotions, master the market.'
  },
  dorothy: {
    id: 'dorothy',
    name: 'Dorothy Washington',
    displayName: 'The Legacy Builder',
    age: 'senior',
    gender: 'female',
    race: 'Black',
    hairColor: 'White',
    background: 'Retired teacher building generational wealth through crypto',
    tradingStyle: 'conservative',
    specialization: ['education', 'generational-wealth', 'simple-strategies'],
    riskTolerance: 'low',
    personality: 'Educational, patient, explains complex concepts simply.',
    catchphrase: "If you can't explain it simply, you don't understand it."
  },
  kamala: {
    id: 'kamala',
    name: 'Kamala Deshmukh',
    displayName: 'The Passive Income Queen',
    age: 'senior',
    gender: 'female',
    race: 'Indian',
    hairColor: 'Gray',
    background: 'Retired Mumbai banker building passive crypto income streams',
    tradingStyle: 'conservative',
    specialization: ['passive-income', 'staking', 'dividend-tokens'],
    riskTolerance: 'low',
    personality: 'Steady, income-focused, values consistency.',
    catchphrase: 'Build income streams, not stress lines.'
  },
  margaret: {
    id: 'margaret',
    name: "Margaret O'Connor",
    displayName: 'The Dividend Hunter',
    age: 'senior',
    gender: 'female',
    race: 'Caucasian',
    hairColor: 'Gray',
    background: 'Irish pension fund manager seeking yield in crypto',
    tradingStyle: 'value',
    specialization: ['yield-bearing', 'dividends', 'income-strategies'],
    riskTolerance: 'low',
    personality: 'Income-focused, yield-seeking, values steady returns.',
    catchphrase: 'Yield today, wealth tomorrow.'
  },
  layla: {
    id: 'layla',
    name: 'Layla Abboud',
    displayName: 'The Heritage Keeper',
    age: 'senior',
    gender: 'female',
    race: 'Middle Eastern',
    hairColor: 'White',
    background: 'Lebanese art collector preserving cultural heritage through NFTs',
    tradingStyle: 'balanced',
    specialization: ['cultural-nfts', 'heritage', 'art-preservation'],
    riskTolerance: 'medium',
    personality: 'Cultured, preservation-focused, values heritage.',
    catchphrase: 'Art survives empires. NFTs will survive chains.'
  },
  carmen: {
    id: 'carmen',
    name: 'Carmen Rodriguez',
    displayName: 'The Family Office',
    age: 'senior',
    gender: 'female',
    race: 'Hispanic',
    hairColor: 'Gray',
    background: 'Mexican family office manager allocating to crypto',
    tradingStyle: 'conservative',
    specialization: ['family-office', 'institutional-allocation', 'wealth-management'],
    riskTolerance: 'low',
    personality: 'Professional, institutional mindset, family-focused.',
    catchphrase: 'Protect the family. Grow the legacy.'
  },
  keiko: {
    id: 'keiko',
    name: 'Keiko Watanabe',
    displayName: 'The Zen Trader',
    age: 'senior',
    gender: 'female',
    race: 'Asian',
    hairColor: 'White',
    background: 'Former Zen monastery resident who applies mindfulness to trading',
    tradingStyle: 'balanced',
    specialization: ['mindful-trading', 'emotional-balance', 'patience'],
    riskTolerance: 'low',
    personality: 'Peaceful, centered, trades with clarity.',
    catchphrase: 'Clear mind, clear trades. Find your center.'
  }
}

const tradingStyles = [
  'all', 'technical', 'conservative', 'aggressive', 'fundamental', 
  'degen', 'value', 'swing', 'scalper', 'balanced', 'momentum', 'risk-averse'
]

const rarities = ['all', 'legendary', 'epic', 'rare', 'common']

function getRarity(agent) {
  const legendarySpecs = ['nft', 'compliance', 'cross-border', 'heritage', 'generational-wealth', 'discipline']
  const epicSpecs = ['defi', 'arbitrage', 'whale-tracking', 'automation', 'options', 'quantitative']
  const rareSpecs = ['meme-coins', 'yield-farming', 'gamefi', 'layer-2', 'catalysts', 'institutional-flows']
  
  const hasLegendary = agent.specialization.some(s => legendarySpecs.some(ls => s.includes(ls)))
  const hasEpic = agent.specialization.some(s => epicSpecs.some(es => s.includes(es)))
  const hasRare = agent.specialization.some(s => rareSpecs.some(rs => s.includes(rs)))
  
  if (agent.age === 'senior' || hasLegendary) return 'legendary'
  if ((agent.tradingStyle === 'aggressive' || agent.tradingStyle === 'degen') && agent.riskTolerance === 'high') return 'epic'
  if (hasEpic) return 'epic'
  if (hasRare || agent.tradingStyle === 'technical') return 'rare'
  return 'common'
}

function getRarityColor(rarity) {
  switch (rarity) {
    case 'legendary': return '#FFD700'
    case 'epic': return '#A855F7'
    case 'rare': return '#3B82F6'
    case 'common': return '#6B7280'
    default: return '#6B7280'
  }
}

function getRarityGlow(rarity) {
  switch (rarity) {
    case 'legendary': return '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)'
    case 'epic': return '0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)'
    case 'rare': return '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)'
    case 'common': return '0 0 15px rgba(107, 114, 128, 0.3)'
    default: return 'none'
  }
}

function getAvatarUrl(agent) {
  const skinColors = {
    'Asian': 'f5d0c5',
    'Caucasian': 'ffdbb4',
    'Black': '8d5524',
    'Hispanic': 'd4a574',
    'Indian': 'c68642',
    'Middle Eastern': 'e0ac69',
    'Mixed': 'd4a574'
  }
  
  const hairColors = {
    'Black': '1a1a1a',
    'Brown': '6a4e42',
    'Blonde': 'd4a76a',
    'Red': '8b3a3a',
    'Gray': '888888',
    'White': 'e0e0e0',
    'Bald': 'transparent'
  }
  
  const skinColor = skinColors[agent.race] || 'c68642'
  const hairColor = hairColors[agent.hairColor] || '1a1a1a'
  const seed = agent.id + agent.name
  
  return `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1a1a1a&skinColor=${skinColor}&size=200`
}

function TradingCard({ agent }) {
  const rarity = getRarity(agent)
  const rarityColor = getRarityColor(rarity)
  const rarityGlow = getRarityGlow(rarity)
  const avatarUrl = getAvatarUrl(agent)
  
  return (
    <div 
      className="trading-card"
      style={{ 
        '--rarity-color': rarityColor,
        '--rarity-glow': rarityGlow
      }}
    >
      <div className="card-border">
        <div className="card-inner">
          <div className="card-header">
            <span className={`rarity-badge rarity-${rarity}`}>
              {rarity.toUpperCase()}
            </span>
            <span className="card-number">#{Object.keys(agentPersonas).indexOf(agent.id) + 1}/54</span>
          </div>
          
          <div className="avatar-container">
            <img 
              src={avatarUrl} 
              alt={agent.name}
              className="agent-avatar"
            />
            <div className="avatar-glow" />
          </div>
          
          <div className="card-name">
            <h3>{agent.name}</h3>
            <span className="display-name">{agent.displayName}</span>
          </div>
          
          <div className="badge-row">
            <span className="badge badge-age">{agent.age}</span>
            <span className="badge badge-gender">{agent.gender}</span>
            <span className="badge badge-race">{agent.race}</span>
          </div>
          
          <div className="card-stats">
            <div className="stat-row">
              <span className="stat-label">Style</span>
              <span className="stat-value">{agent.tradingStyle}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Risk</span>
              <span className={`stat-value risk-${agent.riskTolerance}`}>
                {agent.riskTolerance}
              </span>
            </div>
          </div>
          
          <div className="specializations">
            {agent.specialization.slice(0, 3).map((spec, i) => (
              <span key={i} className="spec-tag">{spec}</span>
            ))}
          </div>
          
          <div className="personality">
            <p>{agent.personality.split('.')[0]}.</p>
          </div>
          
          <div className="catchphrase">
            <span>"{agent.catchphrase}"</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgentTradingCards() {
  const [styleFilter, setStyleFilter] = useState('all')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const agents = useMemo(() => Object.values(agentPersonas), [])
  
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesStyle = styleFilter === 'all' || agent.tradingStyle === styleFilter
      const matchesRarity = rarityFilter === 'all' || getRarity(agent) === rarityFilter
      const matchesSearch = searchTerm === '' || 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.specialization.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return matchesStyle && matchesRarity && matchesSearch
    })
  }, [agents, styleFilter, rarityFilter, searchTerm])
  
  const stats = useMemo(() => {
    const rarityCount = { legendary: 0, epic: 0, rare: 0, common: 0 }
    agents.forEach(agent => {
      rarityCount[getRarity(agent)]++
    })
    return rarityCount
  }, [agents])
  
  return (
    <div className="trading-cards-container">
      <div className="cards-header">
        <h1>AI Agent Trading Cards</h1>
        <p className="subtitle">54 Unique AI Trading Personas</p>
        
        <div className="rarity-stats">
          <span className="stat legendary">
            <span className="dot" />
            Legendary: {stats.legendary}
          </span>
          <span className="stat epic">
            <span className="dot" />
            Epic: {stats.epic}
          </span>
          <span className="stat rare">
            <span className="dot" />
            Rare: {stats.rare}
          </span>
          <span className="stat common">
            <span className="dot" />
            Common: {stats.common}
          </span>
        </div>
      </div>
      
      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>Trading Style</label>
          <select 
            value={styleFilter} 
            onChange={(e) => setStyleFilter(e.target.value)}
          >
            {tradingStyles.map(style => (
              <option key={style} value={style}>
                {style === 'all' ? 'All Styles' : style.charAt(0).toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Rarity</label>
          <select 
            value={rarityFilter} 
            onChange={(e) => setRarityFilter(e.target.value)}
          >
            {rarities.map(rarity => (
              <option key={rarity} value={rarity}>
                {rarity === 'all' ? 'All Rarities' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="results-count">
        Showing {filteredAgents.length} of {agents.length} agents
      </div>
      
      <div className="cards-grid">
        {filteredAgents.map(agent => (
          <TradingCard key={agent.id} agent={agent} />
        ))}
      </div>
      
      {filteredAgents.length === 0 && (
        <div className="no-results">
          <p>No agents match your filters</p>
          <button onClick={() => {
            setStyleFilter('all')
            setRarityFilter('all')
            setSearchTerm('')
          }}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}
