// DarkWave Pulse - Coin Configuration (14+ Featured Coins)
// All Solana-based tokens with contract addresses

export interface Coin {
  id: number;
  ticker: string;
  name: string;
  ca: string;
  category: 'spiritual' | 'conspiracy' | 'meme' | 'featured';
  imagePath: string;
  description: string;
  isFeatured?: boolean;
}

export const COINS: Coin[] = [
  // Featured
  {
    id: 1,
    ticker: '$CCAT',
    name: 'CryptoCat',
    ca: 'CyokFVBYyvdDzvScSSpHeJ3gR2oGPU5o9CjBHXwkpump',
    category: 'featured',
    imagePath: 'ccat-cryptocat',
    description: 'The original Crypto Cat',
    isFeatured: true
  },
  
  // Spiritual & Unity (4)
  {
    id: 2,
    ticker: '$JH-25',
    name: 'Justice for Humanity',
    ca: '22PXfkPGkhVUwMqQaeFzjtdzyFNU8ZQRk2shifwAuSkx',
    category: 'spiritual',
    imagePath: 'justice-for-humanity',
    description: 'Fighting for justice'
  },
  {
    id: 3,
    ticker: '$YAHU',
    name: 'Yahusha',
    ca: 'ADRs4hrVr729GDqCS5NeRSrVLPBvErpWJcF69vCJWsZT',
    category: 'spiritual',
    imagePath: 'yahu-yahusha',
    description: 'Spiritual awakening token'
  },
  {
    id: 4,
    ticker: '$YAH',
    name: 'Yahuah',
    ca: 'ERf16TD1VrUHdhpUFbUJpSPXVu9rbtzrzkKfCbwLMYiP',
    category: 'spiritual',
    imagePath: 'yah-yahuah',
    description: 'Divine consciousness'
  },
  {
    id: 5,
    ticker: '$RHODI',
    name: 'Rhodium',
    ca: 'HEkEQd1nwvD7qiRHcwLEw9d7bnsg2PffrkZrWMkKpump',
    category: 'spiritual',
    imagePath: 'rhodi-rhodium',
    description: 'Rare earth token'
  },
  
  // Justice & Conspiracy (2)
  {
    id: 7,
    ticker: '$OBEY',
    name: 'Illuminati',
    ca: 'FXXVV7T7MHptzLMd9b4cCtUYpqqbVg8rUGxMtRTuUq5k',
    category: 'conspiracy',
    imagePath: 'obey-illuminati',
    description: 'The all-seeing eye'
  },
  
  // Pump & Degen (7)
  {
    id: 8,
    ticker: '$V-25',
    name: 'Vertigo I',
    ca: 'DitutwBDmEU1fM82ePTymzjLStjraLdwSQDwvSdgCmTs',
    category: 'meme',
    imagePath: 'v25-vertigo',
    description: 'Spinning toward profits'
  },
  {
    id: 9,
    ticker: '$CHEERS',
    name: 'Pumpaholic 2025',
    ca: '3gyRB7GVxzM4tUj41WvWpcgaHqbmZsvU7ANP9vnaLSgZ',
    category: 'meme',
    imagePath: 'cheers-pumpaholic',
    description: 'Cheers to the pump 🚀'
  },
  {
    id: 10,
    ticker: '$P-25',
    name: 'Pumpocracy 2025',
    ca: '3eFj4ujRnuWH9SpvHyK9o4VJymkWHKsoweP5916Rywux',
    category: 'meme',
    imagePath: 'p25-pumpocracy',
    description: 'Government by the pump'
  },
  {
    id: 11,
    ticker: '$REKTMEOW',
    name: 'Liquidation (Crypto Cat)',
    ca: '4BqYgxjhcc3ew44WEkaxzxxtSUpL62emzmRvuraxpump',
    category: 'meme',
    imagePath: 'rektmeow-liquidation',
    description: 'When the cat gets liquidated'
  },
  {
    id: 12,
    ticker: '$UNCAT',
    name: 'Uncertainty',
    ca: 'H9BhViZnhNDpUAwv1vpt2waRNLcRNNQ1wYsaWJ6Npump',
    category: 'meme',
    imagePath: 'uncat-uncertainty',
    description: 'Schrödinger\'s pump'
  },
  {
    id: 13,
    ticker: '$INSANE',
    name: 'Overstimulated',
    ca: 'OVERstimulatedOVERstimulatedOVERstimulated',
    category: 'meme',
    imagePath: 'overstimulated',
    description: 'Overstimulated vibes'
  },
  {
    id: 14,
    ticker: '$CCAT',
    name: 'CryptoCat',
    ca: 'CyokFVBYyvdDzvScSSpHeJ3gR2oGPU5o9CjBHXwkpump',
    category: 'meme',
    imagePath: 'ccat-cryptocat',
    description: 'The original Crypto Cat'
  },
  {
    id: 15,
    ticker: '$CWC',
    name: 'Catwifcash (Raydium)',
    ca: '75A2MwNbiXMBNoJuKFgEsaN42fHAqjHhEuW4fPpKMGF',
    category: 'meme',
    imagePath: 'cwc-catwifcash',
    description: 'Cat with cash vibes'
  }
];

export const getCoinsByCategory = (category: string): Coin[] => {
  return COINS.filter(coin => coin.category === category);
};

export const getFeaturedCoin = (): Coin => {
  return COINS.find(coin => coin.isFeatured) || COINS[0];
};

export const getCoinById = (id: number): Coin | undefined => {
  return COINS.find(coin => coin.id === id);
};
