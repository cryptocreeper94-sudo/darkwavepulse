# DWC Coin Smart Contract

## Overview

DWC is the native coin of DarkWave Smart Chain (DSC), designed to power the DarkWave Studios ecosystem with real utility.

## Coin Specifications

| Property | Value |
|----------|-------|
| **Network** | DarkWave Smart Chain (DSC) |
| **Standard** | Native Coin |
| **Total Supply** | 100,000,000 DWC |
| **Decimals** | 18 |
| **Buy Tax** | 0% |
| **Sell Tax** | 5% |
| **Transfer Tax** | 5% |

## Tax Distribution

When coins are sold or transferred, the 5% tax is distributed:

- **2% Treasury** - Platform development and operations
- **2% Liquidity** - Automated liquidity provision
- **1% Marketing** - Growth and community building

## Architecture

```
darkwave-chain/
├── contracts/
│   └── dwc-coin/
│       └── src/
│           └── lib.rs          # Main program logic
├── config.toml                  # Chain configuration
├── Cargo.toml                   # Rust dependencies
└── README.md                    # This file
```

## Key Features

### 1. Zero Buy Tax
Encourages accumulation and makes it easier for new holders to enter.

### 2. Transfer Tax
Discourages frequent trading and rewards long-term holders.

### 3. Authority Transfer
Allows transition to DAO governance when community is ready.

### 4. Tax Wallet Management
Configurable treasury, liquidity, and marketing wallets.

## Building

```bash
cd darkwave-chain/contracts/dwc-coin
cargo build --release
```

## Testing

```bash
cargo test
```

## Deployment

```bash
dwc deploy --network mainnet
```

## Security Considerations

- Authority keys should be stored in hardware wallets
- Consider multi-sig for treasury operations
- Regular audits recommended before mainnet launch
- Time-locks for parameter changes

## Integration

The DWC coin integrates with:

- **Pulse Platform** - Premium feature access
- **StrikeAgent** - Trading fee discounts
- **Staking System** - 12-24% APY rewards
- **Governance** - Voting on proposals
- **NFT Trading Cards** - Unlock collectibles

## Resources

- [Whitepaper](/docs/DWC_WHITEPAPER.md)
- [Coin Info](/docs/DWC_COIN_INFO.md)
- [DarkWave Smart Chain](https://darkwavechain.com)

---

*Built by DarkWave Studios, LLC*
