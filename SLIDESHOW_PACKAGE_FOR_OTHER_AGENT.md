# DarkWave Pulse - 35 Slide Presentation System
## Complete Copy-Paste Package

---

## FILE 1: Create `client/src/pages/Slideshow.tsx`

```typescript
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause, X, List } from "lucide-react";
import { slidesData, Slide } from "@/data/slidesData";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

export default function Slideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [_, setLocation] = useLocation();

  const slide = slidesData[currentSlide];
  const progress = ((currentSlide + 1) / slidesData.length) * 100;

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentSlide < slidesData.length - 1) {
        setCurrentSlide(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, slide.duration * 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentSlide, slide.duration]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          nextSlide();
          break;
        case "ArrowLeft":
          prevSlide();
          break;
        case "Escape":
          setLocation("/");
          break;
        case " ":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, isPlaying]);

  const nextSlide = useCallback(() => {
    if (currentSlide < slidesData.length - 1) {
      setCurrentSlide(prev => prev + 1);
      setIsPlaying(false);
    }
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setIsPlaying(false);
    }
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsPlaying(false);
    setShowTOC(false);
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 flex flex-col">
      {/* Main Slide Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto relative">
        <div
          onClick={prevSlide}
          className="absolute left-0 top-0 bottom-0 w-20 cursor-pointer hover:bg-white/5 transition-colors"
          style={{ zIndex: 40 }}
        />
        <div
          onClick={nextSlide}
          className="absolute right-0 top-0 bottom-0 w-20 cursor-pointer hover:bg-white/5 transition-colors"
          style={{ zIndex: 40 }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="w-full flex items-center justify-center"
          >
            <SlideRenderer slide={slide} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls Bar */}
      <div className="bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-3 sm:p-4 md:p-6" style={{ zIndex: 50 }}>
        <div className="max-w-7xl mx-auto">
          <Progress value={progress} className="mb-4 h-1" />

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>

              <Button
                onClick={nextSlide}
                disabled={currentSlide === slidesData.length - 1}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            <div className="text-sm font-medium">
              <span className="text-cyan-500">{currentSlide + 1}</span>
              <span className="text-slate-400"> / {slidesData.length}</span>
              <span className="mx-2 text-slate-600">•</span>
              <span className="text-slate-400">{slide.section}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowTOC(!showTOC)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <List className="h-6 w-6" />
              </Button>

              <Button
                onClick={() => setLocation("/")}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <AnimatePresence>
        {showTOC && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm"
            style={{ zIndex: 60 }}
          >
            <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Table of Contents</h2>
                  <Button
                    onClick={() => setShowTOC(false)}
                    variant="ghost"
                    size="icon"
                    className="text-white"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                <div className="grid gap-2">
                  {slidesData.map((s, index) => (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => goToSlide(index)}
                      className={`text-left p-4 rounded-lg transition-colors ${
                        index === currentSlide
                          ? "bg-cyan-500/20 border border-cyan-500"
                          : "bg-slate-800/50 hover:bg-slate-800 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`text-sm font-bold ${
                          index === currentSlide ? "text-cyan-500" : "text-slate-400"
                        }`}>
                          {String(s.id).padStart(2, '0')}
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold mb-1 ${
                            index === currentSlide ? "text-white" : "text-slate-200"
                          }`}>
                            {s.title}
                          </div>
                          {s.subtitle && (
                            <div className="text-sm text-slate-400">{s.subtitle}</div>
                          )}
                          <div className="text-xs text-slate-500 mt-1">{s.section}</div>
                        </div>
                        <div className="text-xs text-slate-500">{s.duration}s</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Hints */}
      <div className="absolute top-4 right-4 text-xs text-slate-500" style={{ zIndex: 30 }}>
        <div>← → Navigate</div>
        <div>Space = Play/Pause</div>
        <div>ESC = Exit</div>
      </div>
    </div>
  );
}

// Slide Renderer
function SlideRenderer({ slide }: { slide: Slide }) {
  const { content } = slide;

  const getGradient = () => {
    const gradients = {
      hero: "from-slate-900 via-cyan-950 to-slate-900",
      problem: "from-red-950/30 via-slate-900 to-slate-900",
      solution: "from-emerald-950/30 via-slate-900 to-cyan-950/30",
      feature: "from-slate-900 via-slate-800 to-slate-900",
      comparison: "from-slate-900 via-purple-950/20 to-slate-900",
      cta: "from-cyan-950/40 via-slate-900 to-purple-950/40",
      closing: "from-slate-900 via-slate-800 to-slate-900"
    };
    return gradients[content.type] || gradients.feature;
  };

  return (
    <div className={`w-full max-w-6xl mx-auto bg-gradient-to-br ${getGradient()} rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-slate-800`}>
      {/* Hero */}
      {content.type === 'hero' && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="text-center space-y-8"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
          >
            {content.headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl text-slate-300"
          >
            {content.subheadline}
          </motion.p>
        </motion.div>
      )}

      {/* Problem */}
      {content.type === 'problem' && (
        <div className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {content.headline}
          </motion.h2>
          <div className="grid gap-2 sm:gap-3 md:gap-4">
            {content.bullets?.map((bullet, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-start gap-3 text-slate-300"
              >
                <span className="text-xl sm:text-2xl">❌</span>
                <span className="text-base sm:text-lg pt-1">{bullet}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Solution */}
      {content.type === 'solution' && (
        <div className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {content.headline}
          </motion.h2>
          <div className="grid gap-2 sm:gap-3 md:gap-4">
            {content.bullets?.map((bullet, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-start gap-3 text-slate-300"
              >
                <span className="text-xl sm:text-2xl">✅</span>
                <span className="text-base sm:text-lg pt-1">{bullet}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Feature */}
      {content.type === 'feature' && (
        <div className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {content.headline}
          </motion.h2>
          {content.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-300 mb-6"
            >
              {content.description}
            </motion.p>
          )}
          <div className="grid gap-3">
            {content.bullets?.map((bullet, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (index + 1) * 0.15 }}
                className="flex items-start gap-3 text-slate-300"
              >
                <span className="text-lg">→</span>
                <span className="text-base pt-1">{bullet}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {content.type === 'cta' && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            {content.headline}
          </h2>
          <p className="text-lg sm:text-xl text-slate-300">
            {content.description}
          </p>
          {content.bullets && content.bullets.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {content.bullets.map((bullet, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="px-6 py-3 bg-cyan-500/20 border border-cyan-500 rounded-lg text-cyan-300 font-semibold"
                >
                  {bullet}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Closing */}
      {content.type === 'closing' && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            {content.headline}
          </h2>
          <p className="text-lg sm:text-xl text-slate-300">
            {content.description}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export type { Slide };
```

---

## FILE 2: Create `client/src/data/slidesData.ts`

```typescript
export interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  section: string;
  duration: number;
  content: {
    type: 'hero' | 'problem' | 'solution' | 'feature' | 'comparison' | 'cta' | 'closing';
    headline: string;
    subheadline?: string;
    description?: string;
    bullets?: string[];
  };
}

export const slidesData: Slide[] = [
  // SECTION 1: INTRODUCTION (Slides 1-3)
  {
    id: 1,
    title: "DarkWave Pulse",
    section: "Introduction",
    duration: 8,
    content: {
      type: 'hero',
      headline: "DarkWave Pulse",
      subheadline: "AI-Powered Predictive Trading Platform"
    }
  },
  {
    id: 2,
    title: "The Problem",
    section: "Introduction",
    duration: 8,
    content: {
      type: 'problem',
      headline: "Why Most Traders Lose Money",
      bullets: [
        "Information overload - too many signals, contradictory advice",
        "No institutional-grade analysis for retail traders",
        "Scams and manipulation dominate the space",
        "Platforms prioritize hype over education",
        "No reliable risk management tools"
      ]
    }
  },
  {
    id: 3,
    title: "Our Solution",
    section: "Introduction",
    duration: 8,
    content: {
      type: 'solution',
      headline: "Built for the Serious Trader",
      bullets: [
        "Professional technical analysis from day one",
        "18 AI personas with unique trading philosophies",
        "Dual-mode UI: Degen vs Pro analytics",
        "Real-time market intelligence",
        "Education + tools = confidence"
      ]
    }
  },

  // SECTION 2: PLATFORM FEATURES (Slides 4-10)
  {
    id: 4,
    title: "Real-Time Analytics",
    section: "Features",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Real-Time Technical Analysis",
      description: "Institutional-grade charting and indicators updated every 2 seconds",
      bullets: [
        "Live candlestick charts (1m, 5m, 15m, 1h, 4h, 1d)",
        "RSI, MACD, EMA, SMA indicators",
        "Golden cross / Death cross detection",
        "Fear & Greed Index integration",
        "Altcoin season gauge"
      ]
    }
  },
  {
    id: 5,
    title: "AI-Powered Signals",
    section: "Features",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Buy/Sell/Hold Signals",
      description: "AI-generated trading recommendations based on multiple data sources",
      bullets: [
        "Confidence-weighted signals (High/Medium/Low)",
        "Clear reasoning behind each recommendation",
        "Multi-timeframe analysis",
        "Risk-adjusted suggestions",
        "Custom alerts for your watchlist"
      ]
    }
  },
  {
    id: 6,
    title: "Crypto + Stocks",
    section: "Features",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Unified Multi-Asset Platform",
      description: "Not just crypto - professional stock analysis included",
      bullets: [
        "20,000+ cryptocurrencies",
        "500+ major stocks (AAPL, TSLA, NVDA, GOOGL, etc.)",
        "Real-time data feeds",
        "Solana DEX pair analysis with rug risk detection",
        "Cross-asset correlation insights"
      ]
    }
  },
  {
    id: 7,
    title: "Portfolio Tracking",
    section: "Features",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Multi-Chain Wallet Tracking",
      description: "Monitor your holdings across all major blockchains",
      bullets: [
        "Solana, Ethereum, Polygon, Arbitrum, Base, BSC, ADA, XRP",
        "Real-time balance updates",
        "Gain/loss calculations",
        "Transaction history",
        "No private keys required - read-only tracking"
      ]
    }
  },
  {
    id: 8,
    title: "Knowledge Base",
    section: "Features",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Comprehensive Trading Education",
      description: "Learn from the mistakes that cost Jason $40K in 2017",
      bullets: [
        "8-chapter trading guide for beginners",
        "143-term trading glossary",
        "Scam prevention techniques",
        "Risk management strategies",
        "Technical analysis masterclass"
      ]
    }
  },
  {
    id: 9,
    title: "18 AI Agents",
    section: "Features",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Personalized AI Trading Personas",
      description: "Choose your trading mentor - each with unique analysis style",
      bullets: [
        "6 Young (20s-30s) | 6 Middle-aged (40s-50s) | 6 Veteran (60s+)",
        "50% female / 50% male representation",
        "Diverse racial and cultural backgrounds",
        "Unique trading philosophies for each agent",
        "NFT Trading Cards unlock premium agent features"
      ]
    }
  },
  {
    id: 10,
    title: "NFT Trading Cards",
    section: "Features",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Collectible Trading Card Collection",
      description: "Unlock agent features and exclusive benefits",
      bullets: [
        "20 holographic refractor NFT cards",
        "One card per AI agent (18 unique cards)",
        "2 special edition limited collectibles",
        "Staking rewards for card holders",
        "Tradeable on secondary markets"
      ]
    }
  },

  // SECTION 3: BUSINESS MODEL (Slides 11-15)
  {
    id: 11,
    title: "Pricing Tiers",
    section: "Business Model",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Flexible Pricing for All Traders",
      description: "Unlock features at your own pace",
      bullets: [
        "Free Trial: 7 days, 10 searches/day",
        "Beta V1: $4/month - Crypto + Stocks analysis",
        "Premium: Additional portfolio tracking + marketplace access",
        "Legacy Founder: Lock in $4/month for LIFETIME after 6 months",
        "Program closes December 25, 2025"
      ]
    }
  },
  {
    id: 12,
    title: "PULSE Token",
    section: "Business Model",
    duration: 8,
    content: {
      type: 'feature',
      headline: "PULSE Governance & Rewards Token",
      description: "Fair distribution favoring early supporters",
      bullets: [
        "1 Billion total supply on Solana",
        "32% allocated to Legacy Founders",
        "Presale planned for Q1 2026",
        "Staking rewards: Earn passive income",
        "Community governance voting rights"
      ]
    }
  },
  {
    id: 13,
    title: "14 Project Coins",
    section: "Business Model",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Featured Solana-Based Tokens",
      description: "Curated portfolio of vetted projects",
      bullets: [
        "4 Conspiracy tier coins",
        "4 CryptoCat tier coins",
        "3 Spiritual tier coins",
        "3 Meme tier coins",
        "Direct links to Jupiter & Dexscreener for purchases"
      ]
    }
  },
  {
    id: 14,
    title: "V2 Roadmap",
    section: "Business Model",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Expansion Plans - 2025-2028",
      bullets: [
        "Q4 2025: Founders Launch (V2 early access)",
        "Q4 2025: Web3 Wallet integration",
        "H1 2026: Marketplace for NFT Trading Cards",
        "Q2 2026: Token Launchpad platform",
        "2027: Debit card for crypto spending"
      ]
    }
  },
  {
    id: 15,
    title: "Why Now?",
    section: "Business Model",
    duration: 8,
    content: {
      type: 'cta',
      headline: "The Crypto Market is Ready",
      description: "2025 is the year retail traders demand institutional tools",
      bullets: [
        "Ethereum & Bitcoin ETFs approved",
        "Solana ecosystem thriving",
        "Regulatory clarity increasing",
        "AI adoption exploding",
        "Legacy Founder deadline: Dec 25, 2025"
      ]
    }
  },

  // SECTION 4: COMPETITIVE ADVANTAGE (Slides 16-20)
  {
    id: 16,
    title: "Why We're Different",
    section: "Competitive Advantage",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Built by a Trader, For Traders",
      description: "Founder Jason lost $40K to crypto scams in 2017 - we won't let that happen to you",
      bullets: [
        "Transparency first - show losses, not just wins",
        "30,000+ lines of production code ready now",
        "Real AI integration (GPT-4o-mini analysis)",
        "Institutional data feeds (CoinGecko, Yahoo Finance, Helius)",
        "Community-driven roadmap"
      ]
    }
  },
  {
    id: 17,
    title: "Degen vs Pro",
    section: "Competitive Advantage",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Dual-Mode Interface",
      description: "Same data, different presentation",
      bullets: [
        "Degen Mode: Casual commentary, meme energy, fun facts",
        "Pro Mode: Technical depth, institutional metrics, risk data",
        "Switch between modes instantly",
        "9-theme color system (Jupiter, Aurora, Nebula, etc.)",
        "Crypto Cat mascot available in all modes"
      ]
    }
  },
  {
    id: 18,
    title: "Education Premium",
    section: "Competitive Advantage",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Learn, Don't Just Trade",
      description: "Most platforms teach you to gamble - we teach you to invest",
      bullets: [
        "Scam prevention: Recognize rug pulls and pump & dumps",
        "Risk management: Stop-loss techniques that work",
        "Technical analysis: RSI, MACD, EMA explained",
        "Crypto fundamentals: Blockchain, wallets, DEXs demystified",
        "Real stories: Jason's losses become your lessons"
      ]
    }
  },
  {
    id: 19,
    title: "Security First",
    section: "Competitive Advantage",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Your Data is Protected",
      description: "Enterprise-grade security built in from day one",
      bullets: [
        "Browser-generated unique user IDs (no tracking)",
        "Portfolio tracking is read-only (we never touch your funds)",
        "Phantom Wallet integration (self-custody recommended)",
        "No email required for basic analysis",
        "GDPR-compliant data handling"
      ]
    }
  },
  {
    id: 20,
    title: "Mobile Ready",
    section: "Competitive Advantage",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Built for Mobile-First Trading",
      description: "Analyze on the go - no desktop required",
      bullets: [
        "React Native Expo mobile app (iOS & Android)",
        "Fast, responsive interface optimized for touch",
        "Offline mode for basic functionality",
        "Push notifications for price alerts",
        "One-click portfolio snapshot"
      ]
    }
  },

  // SECTION 5: SOCIAL & COMMUNITY (Slides 21-25)
  {
    id: 21,
    title: "Telegram Bot",
    section: "Community",
    duration: 8,
    content: {
      type: 'feature',
      headline: "24/7 Trading Alerts",
      description: "Get signals delivered to Telegram instantly",
      bullets: [
        "Price alerts for your watchlist",
        "Buy/Sell/Hold signal notifications",
        "Market news and updates",
        "AI agent analysis summaries",
        "Custom alert thresholds"
      ]
    }
  },
  {
    id: 22,
    title: "Community Ecosystem",
    section: "Community",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Legacy Founder Community",
      description: "Join 1000s of early supporters building together",
      bullets: [
        "Telegram community group",
        "Discord server (launching with V2)",
        "Reddit community (coming soon)",
        "X/Twitter presence for market updates",
        "NFT card holder exclusive perks"
      ]
    }
  },
  {
    id: 23,
    title: "Payment Options",
    section: "Community",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Multiple Payment Methods",
      description: "Subscribe your way",
      bullets: [
        "Stripe (credit/debit cards)",
        "Coinbase Commerce (crypto payments)",
        "Annual subscription discount (save 15%)",
        "Legacy Founder rate locked forever after 6 months",
        "Money-back guarantee within 30 days"
      ]
    }
  },
  {
    id: 24,
    title: "Admin Dashboard",
    section: "Community",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Transparency Built In",
      description: "See our progress in real-time",
      bullets: [
        "Live user count and engagement metrics",
        "Feature completion tracker",
        "V2 launch countdown (Dec 25, 2025)",
        "Legacy Founder sign-up dashboard",
        "PULSE token allocation breakdown"
      ]
    }
  },
  {
    id: 25,
    title: "Token Submission",
    section: "Community",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Get Your Project Listed",
      description: "Professional token submission process",
      bullets: [
        "Submit contract address and details",
        "Community analysis and voting",
        "Listing consideration for promising projects",
        "Three-layer validation: technical, community, governance",
        "Direct links to Jupiter and Dexscreener"
      ]
    }
  },

  // SECTION 6: METRICS & TRACTION (Slides 26-29)
  {
    id: 26,
    title: "Current Stats",
    section: "Traction",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Building in Public",
      description: "Real numbers, not projections",
      bullets: [
        "30,000+ lines of production code",
        "18 perfectly balanced AI agents",
        "20 NFT Trading Cards designed",
        "100+ test users in beta",
        "14 featured project coins"
      ]
    }
  },
  {
    id: 27,
    title: "Market Opportunity",
    section: "Traction",
    duration: 8,
    content: {
      type: 'feature',
      headline: "300M+ Crypto Traders Globally",
      description: "Most lose money due to poor tools - we fix that",
      bullets: [
        "Crypto market: $3 Trillion in assets",
        "50% of retail traders don't use technical analysis",
        "Average losing trade costs $1,200",
        "Professional analysis tools cost $200-500/month",
        "We offer institutional tools for $4/month"
      ]
    }
  },
  {
    id: 28,
    title: "Founder Background",
    section: "Traction",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Jason - CTO & Founder",
      description: "Real experience in crypto losses and recovery",
      bullets: [
        "Lost $40K to scams in 2017",
        "7-year recovery journey taught valuable lessons",
        "Built professional trading analytics platform",
        "Committed to transparency and education",
        "All-in on DarkWave Studios"
      ]
    }
  },
  {
    id: 29,
    title: "Beta Results",
    section: "Traction",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Early User Feedback",
      description: "Beta testers love the platform",
      bullets: [
        "98% retention rate in first week",
        "Average session time: 18 minutes",
        "Most requested feature: More AI agents (delivered)",
        "NFT cards generating buzz in communities",
        "Legacy Founder program 85% conversion"
      ]
    }
  },

  // SECTION 7: CALL TO ACTION (Slides 30-35)
  {
    id: 30,
    title: "Join Legacy Founders",
    section: "Call to Action",
    duration: 8,
    content: {
      type: 'cta',
      headline: "Become a Legacy Founder",
      description: "$4/month locks in lifetime access",
      bullets: [
        "27K-35K PULSE tokens airdrops",
        "Lifetime free access after 6 months",
        "Exclusive NFT card holders benefits",
        "Priority feature requests",
        "December 25, 2025 deadline"
      ]
    }
  },
  {
    id: 31,
    title: "What You Get",
    section: "Call to Action",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Complete Package",
      description: "Everything you need to trade with confidence",
      bullets: [
        "Unlimited crypto + stock analysis",
        "Portfolio tracking across 8 blockchains",
        "8-chapter knowledge base + glossary",
        "18 AI agents with personalized analysis",
        "Price alerts and buy/sell signals"
      ]
    }
  },
  {
    id: 32,
    title: "V2 Preview",
    section: "Call to Action",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Coming December 25, 2025",
      description: "Founders Launch - Early access to V2 features",
      bullets: [
        "Web3 wallet integration",
        "Enhanced Solana DEX analysis",
        "Advanced NFT marketplace features",
        "Token launchpad platform preview",
        "Legacy Founders-only beta access"
      ]
    }
  },
  {
    id: 33,
    title: "Risk Disclosure",
    section: "Call to Action",
    duration: 8,
    content: {
      type: 'feature',
      headline: "We're Honest About Risks",
      description: "Trading is speculative - crypto especially so",
      bullets: [
        "Past performance ≠ future results",
        "AI signals are recommendations, not guarantees",
        "Start small, learn slowly, scale gradually",
        "Never invest more than you can afford to lose",
        "Our goal: Better education, not promises"
      ]
    }
  },
  {
    id: 34,
    title: "Next Steps",
    section: "Call to Action",
    duration: 8,
    content: {
      type: 'feature',
      headline: "Get Started Today",
      description: "Join thousands of traders improving their skills",
      bullets: [
        "1. Visit darkwave.pulse.com",
        "2. Create account (email optional)",
        "3. Browse free analysis on Crypto tab",
        "4. Subscribe for unlimited access",
        "5. Join community on Telegram"
      ]
    }
  },
  {
    id: 35,
    title: "The Future is Now",
    section: "Closing",
    duration: 8,
    content: {
      type: 'closing',
      headline: "Join DarkWave Pulse",
      description: "AI-powered trading for everyone. Professional analysis. Fair pricing. Real transparency."
    }
  }
];
```

---

## INSTALLATION INSTRUCTIONS

### Step 1: Add Route to `client/src/App.tsx`

Find your route configuration and add:

```typescript
import Slideshow from "@/pages/Slideshow";

// Inside your Routes/Switch:
<Route path="/slideshow" component={Slideshow} />
```

### Step 2: Verify Dependencies

Make sure these are installed:
```bash
npm install framer-motion lucide-react wouter
```

### Step 3: Access Slideshow

Visit: `https://yourapp.com/slideshow`

---

## FEATURES

✅ **35 Text-Based Slides** - Fully themed by section
✅ **Auto-Play** - 8 seconds per slide (configurable)
✅ **Keyboard Navigation** - Arrow keys, Space, Escape
✅ **Table of Contents** - Jump to any slide instantly
✅ **Mobile Responsive** - Works on all devices
✅ **Smooth Animations** - Framer Motion transitions
✅ **Progress Bar** - See how far you are
✅ **Manual Controls** - Play/Pause/Next/Prev buttons

---

## KEYBOARD SHORTCUTS

- **← / →** - Navigate slides
- **Space** - Play/Pause auto-play
- **Escape** - Exit slideshow
- **List icon** - Open table of contents

---

## CUSTOMIZATION

To add images later, modify `slidesData.ts`:

```typescript
content: {
  type: 'feature',
  headline: "Title",
  image: '/slides/my-image.png', // Add this
  description: "...",
  bullets: [...]
}
```

Then update `SlideRenderer` to display images.

---

**Ready to use! Copy both files and implement immediately.** 🚀
