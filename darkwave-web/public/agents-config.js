// Agent Series Configuration - 18 diverse agents with career highlights and fun facts
console.log('✅ Agent Series Configuration loaded');

const AGENTS = [
  {
    id: 1,
    name: 'Agent Alex',
    image: '/trading-cards/african_american_female_agent.png',
    title: 'Security Analyst',
    careerHighlight: 'Cracked a $100M ransomware network that the FBI had been chasing for 2 years',
    funFact: 'Memorized the Bitcoin whitepaper backwards. Literally. For fun.',
    race: 'Black',
    gender: 'Female',
    age: 28,
    ageGroup: 'young'
  },
  {
    id: 2,
    name: 'Agent Marcus',
    image: '/trading-cards/asian_male_agent_headshot.png',
    title: 'Data Scientist',
    careerHighlight: 'Predicted the 2024 bull market 3 months before it happened using only price data',
    funFact: 'Can identify any coin by its chart pattern in under 5 seconds',
    race: 'Asian',
    gender: 'Male',
    age: 42,
    ageGroup: 'middle'
  },
  {
    id: 3,
    name: 'Agent Sofia',
    image: '/trading-cards/latina_female_agent.png',
    title: 'Blockchain Engineer',
    careerHighlight: 'Designed the liquidity protocol that saved a $50M DeFi platform from collapse',
    funFact: 'Learned Solidity in 2 weeks. Now teaches it to Wall Street traders.',
    race: 'Latina',
    gender: 'Female',
    age: 26,
    ageGroup: 'young'
  },
  {
    id: 4,
    name: 'Agent Raj',
    image: '/trading-cards/asian_male_agent_headshot.png',
    title: 'Portfolio Manager',
    careerHighlight: 'Managed a $500M crypto portfolio that outperformed Wall Street by 300%',
    funFact: 'Codes trading bots while meditating. Seriously.',
    race: 'South Asian',
    gender: 'Male',
    age: 48,
    ageGroup: 'middle'
  },
  {
    id: 5,
    name: 'Agent Layla',
    image: '/trading-cards/asian_female_agent.png',
    title: 'Risk Manager',
    careerHighlight: 'Built the risk model that prevented a $200M algorithmic trading disaster',
    funFact: 'Knows every exploit in DeFi history. By heart.',
    race: 'Middle Eastern',
    gender: 'Female',
    age: 51,
    ageGroup: 'middle'
  },
  {
    id: 6,
    name: 'Agent Blake',
    image: '/trading-cards/caucasian_blonde_male_agent.png',
    title: 'Market Analyst',
    careerHighlight: 'Called the bottom of the last three bear markets. Exactly.',
    funFact: 'Sleeps with 2 monitors showing live crypto charts. No, seriously.',
    race: 'White',
    gender: 'Male',
    age: 58,
    ageGroup: 'old'
  },
  {
    id: 7,
    name: 'Agent Devon',
    image: '/trading-cards/african_american_bald_male.png',
    title: 'Compliance Officer',
    careerHighlight: 'Navigated a crypto company through regulatory hell and came out untouched',
    funFact: 'Reads 500+ page regulatory documents for fun. Yes, for fun.',
    race: 'Black',
    gender: 'Male',
    age: 45,
    ageGroup: 'middle'
  },
  {
    id: 8,
    name: 'Agent Aria',
    image: '/trading-cards/asian_female_agent.png',
    title: 'Community Manager',
    careerHighlight: 'Built a 100K member community from zero. Now it self-governs.',
    funFact: 'Can talk markets in 7 languages. Still prefers memes.',
    race: 'Indigenous',
    gender: 'Female',
    age: 31,
    ageGroup: 'young'
  },
  {
    id: 9,
    name: 'Agent Mei',
    image: '/trading-cards/asian_female_agent.png',
    title: 'Technical Architect',
    careerHighlight: 'Designed the infrastructure handling 1M transactions per second',
    funFact: 'Debugged a critical smart contract bug with only console.log statements',
    race: 'Southeast Asian',
    gender: 'Female',
    age: 27,
    ageGroup: 'young'
  },
  {
    id: 10,
    name: 'Agent Claire',
    image: '/trading-cards/caucasian_brown-haired_female.png',
    title: 'Strategic Advisor',
    careerHighlight: 'Advised 5 crypto projects that became unicorns worth $1B+',
    funFact: 'Sees market trends 6 months before they happen. Has a secret method.',
    race: 'White',
    gender: 'Female',
    age: 61,
    ageGroup: 'old'
  },
  {
    id: 11,
    name: 'Agent Vikram',
    image: '/trading-cards/asian_male_agent_headshot.png',
    title: 'Smart Contract Auditor',
    careerHighlight: 'Found a vulnerability in a $2B smart contract nobody else saw coming',
    funFact: 'Codes in Rust while reviewing Solidity. Multi-tasking level 9000.',
    race: 'East Indian',
    gender: 'Male',
    age: 39,
    ageGroup: 'middle'
  },
  {
    id: 12,
    name: 'Agent Zara',
    image: '/trading-cards/african_american_female_agent.png',
    title: 'Growth Hacker',
    careerHighlight: 'Took a crypto project from 1K to 1M users in 6 months using pure strategy',
    funFact: 'Can predict user behavior better than AI models. Actually supernatural.',
    race: 'African',
    gender: 'Female',
    age: 29,
    ageGroup: 'young'
  },
  {
    id: 13,
    name: 'Agent Marco',
    image: '/trading-cards/caucasian_brown-haired_male.png',
    title: 'Market Maker',
    careerHighlight: 'Provides liquidity for 50+ trading pairs with 99.9% uptime',
    funFact: 'Can spot a pump-and-dump from across the room. It\'s a gift.',
    race: 'Mediterranean',
    gender: 'Male',
    age: 46,
    ageGroup: 'middle'
  },
  {
    id: 14,
    name: 'Agent Jade',
    image: '/trading-cards/asian_female_agent.png',
    title: 'Quantum Analyst',
    careerHighlight: 'Applied quantum computing to crypto price prediction with 78% accuracy',
    funFact: 'Thinks in superposition. Both bullish AND bearish at the same time.',
    race: 'East Asian',
    gender: 'Female',
    age: 35,
    ageGroup: 'middle'
  },
  {
    id: 15,
    name: 'Agent Luis',
    image: '/trading-cards/latino_male_agent.png',
    title: 'Tokenomics Designer',
    careerHighlight: 'Designed token models that achieved 80% user retention (industry avg 10%)',
    funFact: 'Can balance a complex tokenomics system in his sleep. Literally happened once.',
    race: 'Latin American',
    gender: 'Male',
    age: 25,
    ageGroup: 'young'
  },
  {
    id: 16,
    name: 'Agent Kaia',
    image: '/trading-cards/asian_female_agent.png',
    title: 'Cultural Ambassador',
    careerHighlight: 'Built bridges between crypto culture and mainstream finance. Successfully.',
    funFact: 'Convinced her grandmother to buy Bitcoin. Now her gram hodls better than anyone.',
    race: 'Pacific Islander',
    gender: 'Female',
    age: 56,
    ageGroup: 'old'
  },
  {
    id: 17,
    name: 'Agent Nova',
    image: '/trading-cards/african_american_female_agent.png',
    title: 'AI Integration Specialist',
    careerHighlight: 'Built the first AI trading system to beat 10,000+ human traders simultaneously',
    funFact: 'Codes with AI assistance and jokes that she\'s "collaborating with her future self."',
    race: 'Afro-Caribbean',
    gender: 'Female',
    age: 32,
    ageGroup: 'young'
  },
  {
    id: 18,
    name: 'Agent Kai',
    image: '/trading-cards/caucasian_redhead_male_agent.png',
    title: 'Future Tech Architect',
    careerHighlight: 'Designed the decentralized network powering the next generation of Web4 platforms',
    funFact: 'Believes the future is already here. You just have to look at the blockchain.',
    race: 'Mixed Race',
    gender: 'Male',
    age: 52,
    ageGroup: 'middle'
  }
];

// Get a random agent
function getRandomAgent() {
  return AGENTS[Math.floor(Math.random() * AGENTS.length)];
}

// Get agent by ID
function getAgentById(id) {
  return AGENTS.find(a => a.id === id);
}

// Expose globally
window.AGENTS = AGENTS;
window.getRandomAgent = getRandomAgent;
window.getAgentById = getAgentById;
