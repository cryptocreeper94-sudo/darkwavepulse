# Pulse - AI Trading Analysis Platform

## Overview
Pulse (powered by DarkWave Studios, LLC) is a predictive trading platform built on the Mastra AI framework, offering predictive signals and institutional-grade technical analysis for cryptocurrency and stocks. Its mission is to provide an AI-powered trading advantage by catching trends early and offering risk-adjusted analytics.

**V2 Founders Launch**: December 25, 2025 (20 days remaining as of Dec 5, 2025)

## User Preferences
- User name: Jason (Owner/Admin)
- Preferred communication style: Simple, everyday language
- Call him "Jason" not "DW"
- **IMPORTANT**: Always check with Jason before proceeding to verify any task - confirm changes look correct before moving on
- Agent diversity: Equal distribution across age groups, gender, race, and hair color
- Design aesthetic: Solid black/dark gray backgrounds (#0f0f0f, #1a1a1a, #141414) with free-floating elements featuring glow effects - NO glassmorphism, NO transparency, NO backdrop-filter

---

## STATUS SUMMARY (December 5, 2025)

### WORKING (Ready for Production)
- Core platform operational on Vite + Express backend
- User authentication system (email whitelist + access codes)
- 12 of 13 whitelisted users verified working
- Slim 50px header with hamburger menu navigation
- Redesigned metric cards (Fear & Greed, Altcoin Season, Market Cap, Volume)
- Live candlestick charts with 30-second refresh (TradingView-style)
- Bitcoin and crypto price tracking via CoinGecko API
- Admin dashboard with full user management
- Telegram bot integration
- Solana blockchain audit trail system (LIVE on mainnet)
  - Latest stamp: `5aH8etqix...eSeBhyQr` (v1205a deployment)
  - SHA-256 hash: `ba98e81e96b45e06...d793a6`
- Admin/Owner login now redirects to `/app?tab=dev` (developer dashboard)
- Cache busting applied (version v1205a)
- Dark theme UI (solid black/gray, no transparency)
- 18 AI Agent personas with NFT Trading Cards
- Knowledge Base (8 chapters, 143-term glossary)

### NEEDS ATTENTION
- CoinGecko API rate limiting (429 errors) - affects chart data refresh
- User still seeing cached old layout - needs full republish with v1205a
- Port 3001 conflicts occasionally (auto-resolves on restart)
- Mobile app (React Native Expo) needs polish before V2

### NOT YET IMPLEMENTED (V2 Features)
- PULSE token smart contract deployment
- Staking platform with hourly rewards
- Liquidity pool creation
- CoinGecko/Jupiter listings
- Sniper trading (buy/sell limit orders) - UI locked
- Native iOS/Android apps (Q2 2026)
- Cryptocurrency payments via Coinbase Commerce

---

## REVISED V2 ROADMAP (December 5-25, 2025)

### WEEK 1: Dec 5-11 (Foundation)
| Priority | Task | Status |
|----------|------|--------|
| P0 | Republish with v1205a cache busting | PENDING |
| P0 | Fix rate limiting with backup data sources | PENDING |
| P1 | PULSE token smart contract development | PENDING |
| P1 | Complete staking dashboard UI | PENDING |
| P2 | Mobile app ScrollView/header fixes | DONE |

### WEEK 2: Dec 12-18 (Token Infrastructure)
| Priority | Task | Status |
|----------|------|--------|
| P0 | Deploy PULSE token on Solana devnet | PENDING |
| P0 | Liquidity pool setup (Raydium/Orca) | PENDING |
| P1 | Apply for CoinGecko listing | PENDING |
| P1 | Apply for Jupiter aggregator | PENDING |
| P2 | Final mobile app testing | PENDING |

### WEEK 3: Dec 19-24 (Final Testing)
| Priority | Task | Status |
|----------|------|--------|
| P0 | Security audit of smart contracts | PENDING |
| P0 | Full E2E testing (web + Telegram) | PENDING |
| P0 | Deploy PULSE to mainnet | PENDING |
| P1 | Marketing material finalization | PENDING |
| P2 | Discord/Telegram community prep | PENDING |

### DECEMBER 25: FOUNDERS LAUNCH
- V2 platform goes live
- Legacy Founder pricing ends ($4/month)
- Pricing increases to $8/month Dec 26+
- 35,000 PULSE token rewards for early subscribers

---

## System Architecture

### Frontend (Web)
- **Framework**: React 19 + Vite 7
- **Location**: `public/` and `darkwave-web/public/`
- **Design**: CoinMarketCap-style market overview, 9-column data table, 7 category tabs
- **Theme**: Solid dark (#0f0f0f, #1a1a1a) - NO transparency effects
- **UI Features**:
  - Slim 50px header with hamburger menu
  - Redesigned metric cards with animations
  - 9-theme personalization system
  - Toggleable Crypto Cat mascot

### Frontend (Mobile)
- **Framework**: React Native + Expo
- **Location**: `darkwave-mobile/`
- **Status**: In development, Q2 2026 App Store target

### Backend
- **Framework**: Mastra AI + Express
- **AI Agent**: DarkWave-V2 with tool calling and memory
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Authentication**: Session-based with email whitelist + access codes
- **Workflows**: Inngest for event-driven processing

### Blockchain Integration
- **Network**: Solana (mainnet)
- **Audit Trail**: SHA-256 hashing via Memo Program
- **Token**: PULSE (pending deployment)
- **Wallet Support**: Solana, Ethereum, Polygon, Arbitrum, Base, BSC

---

## Important Files

### Core Application
- `public/index.html` - Main web app HTML
- `public/app.js` - Core JavaScript logic
- `public/styles.css` - Global styles
- `public/lockscreen.html` - Login/authentication page
- `darkwave-web/public/` - Mirror of public/ for deployment

### Backend Services
- `src/services/auditTrailService.ts` - Solana blockchain stamping
- `src/mastra/agents/index.ts` - AI agent configuration
- `server.ts` - Express server entry point
- `run-dev.sh` - Development startup script

### Mobile App
- `darkwave-mobile/app/index.tsx` - Main mobile entry point
- `darkwave-mobile/app/_layout.tsx` - Navigation layout

---

## External Dependencies

### AI & LLM Services
- OpenAI GPT-4o-mini (via Replit AI Integrations)
- Vercel AI SDK (`ai`, `@ai-sdk/openai`)

### Market Data APIs
- CoinGecko API (primary - has rate limits)
- Yahoo Finance
- Dexscreener API
- QuickChart.io
- Helius API (Solana)
- Alchemy API

### Database & Storage
- PostgreSQL (`@mastra/pg`)

### Infrastructure & Deployment
- Inngest (`inngest`, `@mastra/inngest`)
- Stripe (payments pending)
- Coinbase Commerce (crypto payments pending)

### Messaging Platform
- Telegram Bot API

### Technical Analysis Libraries
- `technicalindicators`

### Supporting Libraries
- `axios`, `zod`, React 19, Vite 7

---

## Recent Changes (December 5, 2025)

1. **Solana Audit Trail LIVE** - Successfully stamped v1205a deployment to mainnet
2. **Admin/Owner Login Flow** - Now redirects to `/app?tab=dev` instead of `/admin`
3. **URL Tab Parameter** - Added support for `?tab=dev` query parameter
4. **Cache Busting** - Version v1205a applied to all static assets
5. **Mobile Fixes** - ScrollView marginTop: 56, header z-index elevated
6. **Files Synced** - lockscreen.html and app.js copied to darkwave-web

---

## Deployment Notes

- **Development**: `./run-dev.sh` starts Vite + Express on port 5000
- **Production**: Republish required to deploy v1205a changes
- **Critical**: Always copy changes to BOTH `public/` and `darkwave-web/public/`
