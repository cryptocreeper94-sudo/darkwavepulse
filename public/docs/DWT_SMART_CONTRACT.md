# DWT Token Smart Contract

## Overview

DWT is a Solana SPL token built with the Anchor framework, designed to power the DarkWave Studios ecosystem with real utility.

## Token Specifications

| Property | Value |
|----------|-------|
| **Network** | Solana Mainnet |
| **Standard** | SPL Token |
| **Total Supply** | 100,000,000 DWT |
| **Decimals** | 9 |
| **Buy Tax** | 0% |
| **Sell Tax** | 5% |
| **Transfer Tax** | 5% |

## Tax Distribution

When tokens are sold or transferred, the 5% tax is distributed:

- **2% Treasury** - Platform development and operations
- **2% Liquidity** - Automated liquidity provision
- **1% Marketing** - Growth and community building

## Architecture

```
contracts/dwav-token/
├── programs/
│   └── dwav-token/
│       └── src/
│           └── lib.rs          # Main program logic
├── Anchor.toml                  # Anchor configuration
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
cd contracts/dwav-token
anchor build
```

## Testing

```bash
anchor test
```

## Deployment

```bash
anchor deploy --provider.cluster mainnet
```

## Security Considerations

- Authority keys should be stored in hardware wallets
- Consider multi-sig for treasury operations
- Regular audits recommended before mainnet launch
- Time-locks for parameter changes

## Integration

The DWT token integrates with:

- **Pulse Platform** - Premium feature access
- **StrikeAgent** - Trading fee discounts
- **Staking System** - 12-24% APY rewards
- **Governance** - Voting on proposals
- **NFT Trading Cards** - Unlock collectibles

## Resources

- [Whitepaper](/docs/DWT_WHITEPAPER.md)
- [Token Info](/docs/DWT_TOKEN_INFO.md)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana SPL Token](https://spl.solana.com/token)

---

*Built by DarkWave Studios, LLC*
