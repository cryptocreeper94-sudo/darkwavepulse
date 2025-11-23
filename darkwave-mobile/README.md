# DarkWave Pulse - React Native Mobile App

**Predictive Trading. Maximum Edge. Mobile-First.**

A React Native Expo mobile app for browsing and tracking 14 featured Solana coins organized by category.

## Project Structure

```
darkwave-mobile/
├── app/                          # Expo Router app screens
│   ├── _layout.tsx              # Root layout with navigation
│   └── index.tsx                # Home screen with coin carousels
├── src/
│   ├── assets/coins/            # Coin images (14 JPGs)
│   ├── config/
│   │   └── coins.ts             # Coin data & contract addresses
│   ├── components/              # Reusable React components
│   └── screens/                 # Additional screens
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── app.json                    # Expo config
└── README.md
```

## Features

✅ **14 Featured Coins** - All Solana tokens with contract addresses  
✅ **Category-Based Organization** - Spiritual, Conspiracy, Meme, Featured  
✅ **Horizontal Carousels** - Smooth scrolling coin lists  
✅ **Dark Theme** - DarkWave brand colors (navy, cyan, orange)  
✅ **Mobile-Optimized** - Built with React Native & Expo

## Coin Data

All coins configured in `src/config/coins.ts`:

| Ticker | Name | Category |
|--------|------|----------|
| SolDump | SolDump | Featured |
| $LOVE | United | Spiritual |
| $YAHU | Yahusha | Spiritual |
| $YAH | Yahuah | Spiritual |
| $RHODI | Rhodium | Spiritual |
| $JH-25 | Justice for Humanity | Conspiracy |
| $OBEY | Illuminati | Conspiracy |
| $V-25 | Vertigo I | Meme |
| $CHEERS | Pumpaholic 2025 | Meme |
| $P-25 | Pumpocracy 2025 | Meme |
| $REKTMEOW | Liquidation (Crypto Cat) | Meme |
| $UNCAT | Uncertainty | Meme |
| $GRIMCAT | Crypto Cat Halloween 2025 | Meme |
| $CCAT | CryptoCat | Meme |
| $CWC | Catwifcash (Raydium) | Meme |

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start the app
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### Environment Setup

1. Install Expo Go on your phone (iOS/Android)
2. Scan QR code from terminal when running `npm start`
3. App loads instantly on device

## Coin Image Assets

Coin images stored in `src/assets/coins/`:
- **4 images received** ✅
- **10 images pending** ⏳

Map image filenames to coin tickers in `coins.ts` configuration.

## Mobile-First Design

- **Portrait orientation** (default)
- **Dark navy theme** (#0a0a0a, #0f1419)
- **Cyan accents** (#00d9ff)
- **Orange/Pink highlights** (#FF006E, #FFB703)
- **Responsive cards** - auto-scaling for different screen sizes
- **Horizontal carousels** - smooth scrolling, category-based

## Next Steps

1. ✅ Project structure created
2. ✅ 14 coins configured with CAs
3. ✅ 4 coin images integrated
4. ⏳ Remaining 10 coin images (awaiting upload)
5. ⏳ Deploy to Play Store / App Store

## Technologies

- **React Native** 18.2.0
- **Expo** 51.0.0
- **Expo Router** 3.0.0
- **LinearGradient** - Beautiful gradients
- **TypeScript** - Type safety

---

**Ready for mobile app store submission!** 🚀
