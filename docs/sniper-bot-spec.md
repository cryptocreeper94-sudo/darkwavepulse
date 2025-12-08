# Pulse AI Sniper Bot - Feature Specification

## Core Concept
AI-powered sniper that analyzes the full picture, user sets rules, bot finds and executes opportunities. Clean interface, not overwhelming.

---

## Token Safety Filters (What to AVOID)
- Bot % threshold (skip if too many bots, e.g., >80%)
- Bundle % detection (bundled launches = red flag)
- Top 10 holders % (concentration = rug risk)
- Blocks per trade analysis
- Creator wallet history check
- Liquidity depth minimum

## Token Discovery Filters (What to LOOK FOR)
- Token age (new launches, or specific range)
- Sentiment analysis (social buzz, activity)
- Number of real people watching/trading
- Volume momentum
- Holder growth rate

## Movement Filters (Critical - What Old Bots Missed)
- Price momentum - Must be moving X% in last Y minutes
- Volume spike - Current volume vs average (2x, 5x, 10x normal)
- Trade frequency - Minimum trades per minute
- Holder growth rate - New wallets buying in
- Buy/sell ratio - More buyers than sellers

---

## DEX Support
- Raydium (all pools)
- Pump.fun
- Jupiter aggregator
- Orca
- Meteora
- More as discovered

---

## Trade Execution Controls
- Entry % (buy at X% from launch/trigger)
- Exit % (take profit target)
- Stop loss %
- Buy amount (SOL or USD value)
- Slippage tolerance
- Priority fee (gas) level
- Custom RPC option
- Timeout after failed trade
- Cooldown after executed trade (avoid bot clusters)
- Max retries

---

## AI Intelligence Layer
- Uses Pulse prediction system
- Analyzes sentiment + holder data + volume
- Recommends snipes based on user filters
- Learns from trade outcomes
- Warns about risky setups
- Pattern recognition: "When it goes up 1.5%, it generally goes 8%"

---

## Smart Auto Mode
- Set SOL per trade (e.g., 0.5 SOL)
- Set parameters and filters
- Toggle "Smart Auto" ON
- Bot runs continuously until stopped OR wallet runs low
- Timeouts/cooldowns prevent cluster trading
- Each trade logged with outcome for learning
- Per-trade SOL limit
- Session SOL limit (max to spend in one auto session)
- Auto-stop conditions (X losses in a row, etc.)

---

## UI Modes
- **Simple Mode**: AI picks, you approve, minimal settings
- **Advanced Mode**: Full control over all parameters
- **Save Presets**: Favorite configurations saved

---

## Database Tables Needed
- user_wallets (connected wallet addresses)
- wallet_holdings (token balances)
- snipe_orders (order configs, status, filters)
- snipe_executions (completed trades, outcomes)
- snipe_presets (saved configurations)

---

## Integration Points
- Prediction tracking system (existing)
- ML learning system (existing)
- Technical analysis tools (existing)
- Helius API for Solana data
- Jupiter API for swaps
- DEX APIs for real-time data

---

Created: December 8, 2025
Status: Planning complete, ready for implementation
