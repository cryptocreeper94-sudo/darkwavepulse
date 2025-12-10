import { useState } from 'react'

const tooltipStyles = {
  container: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '6px',
  },
  trigger: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'rgba(0, 212, 255, 0.2)',
    border: '1px solid rgba(0, 212, 255, 0.4)',
    color: '#00D4FF',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  triggerHover: {
    background: 'rgba(0, 212, 255, 0.4)',
    boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
  },
  popup: {
    position: 'absolute',
    bottom: 'calc(100% + 10px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '280px',
    padding: '14px',
    background: '#1a1a1a',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 212, 255, 0.1)',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  popupRight: {
    left: 'auto',
    right: '0',
    transform: 'none',
  },
  popupLeft: {
    left: '0',
    transform: 'none',
  },
  title: {
    color: '#00D4FF',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  description: {
    color: '#ccc',
    fontSize: '12px',
    lineHeight: '1.5',
    marginBottom: '10px',
  },
  example: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '8px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#888',
    borderLeft: '2px solid #39FF14',
  },
  exampleLabel: {
    color: '#39FF14',
    fontSize: '10px',
    textTransform: 'uppercase',
    marginBottom: '4px',
    fontWeight: '600',
  },
  arrow: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: '12px',
    height: '12px',
    background: '#1a1a1a',
    borderRight: '1px solid rgba(0, 212, 255, 0.3)',
    borderBottom: '1px solid rgba(0, 212, 255, 0.3)',
  },
  close: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
  },
}

export default function InfoTooltip({ term, definition, example, position = 'center' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const getPopupStyle = () => {
    let style = { ...tooltipStyles.popup }
    if (position === 'right') {
      style = { ...style, ...tooltipStyles.popupRight }
    } else if (position === 'left') {
      style = { ...style, ...tooltipStyles.popupLeft }
    }
    return style
  }

  const getArrowStyle = () => {
    let style = { ...tooltipStyles.arrow }
    if (position === 'right') {
      style.left = 'auto'
      style.right = '20px'
      style.transform = 'rotate(45deg)'
    } else if (position === 'left') {
      style.left = '20px'
      style.transform = 'rotate(45deg)'
    }
    return style
  }

  return (
    <span style={tooltipStyles.container}>
      <button
        style={{
          ...tooltipStyles.trigger,
          ...(isHovered ? tooltipStyles.triggerHover : {}),
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`Learn about ${term}`}
      >
        ?
      </button>
      
      {isOpen && (
        <div style={getPopupStyle()}>
          <button 
            style={tooltipStyles.close} 
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          <div style={tooltipStyles.title}>
            <span>📚</span> {term}
          </div>
          <div style={tooltipStyles.description}>{definition}</div>
          {example && (
            <div style={tooltipStyles.example}>
              <div style={tooltipStyles.exampleLabel}>Example</div>
              {example}
            </div>
          )}
          <div style={getArrowStyle()} />
        </div>
      )}
    </span>
  )
}

export const TRADING_DEFINITIONS = {
  tokenAddress: {
    term: 'Token Address',
    definition: 'The unique identifier (contract address) for a cryptocurrency token on the Solana blockchain. Every token has its own address that never changes. You can find this on sites like Dexscreener, Birdeye, or the token\'s official page.',
    example: 'A Solana token address looks like: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (USDC)',
  },
  entryPrice: {
    term: 'Entry Price',
    definition: 'The price at which you want to BUY the token. When the token\'s current price drops to or below this price, the system will flag the order as "Ready to Buy" so you can execute the purchase. Set this lower than the current price if you\'re waiting for a dip.',
    example: 'If a token is $0.05 and you set entry at $0.04, the system waits until it drops to $0.04 before alerting you.',
  },
  exitPrice: {
    term: 'Exit Price (Take Profit)',
    definition: 'The price at which you want to SELL the token for a profit. After you\'ve bought in, if the price rises to this level, the system flags it as "Ready to Sell." This locks in your gains. Set this higher than your entry price.',
    example: 'If you bought at $0.04 and set exit at $0.08, you\'d make a 100% profit when the exit is triggered.',
  },
  stopLoss: {
    term: 'Stop Loss',
    definition: 'A safety net price that limits your losses. If the token price drops to this level after you\'ve bought, the system alerts you to sell before losing more. It\'s like an emergency exit. Always set this BELOW your entry price.',
    example: 'Entry at $0.04, stop loss at $0.03 means you\'d lose 25% max instead of potentially everything.',
  },
  buyAmount: {
    term: 'Buy Amount (SOL)',
    definition: 'How much SOL (Solana\'s native currency) you want to spend when buying this token. This is not the number of tokens—it\'s how much of your SOL you\'re investing. Start small while learning.',
    example: 'If you set 0.5 SOL and SOL is worth $100, you\'re spending about $50 on this trade.',
  },
  currentPrice: {
    term: 'Current Price',
    definition: 'The live market price of the token right now. This updates automatically as the market moves. Compare this to your entry/exit prices to see how close you are to your targets.',
    example: 'If current price is $0.045 and your entry is $0.04, you\'re close to your buy target.',
  },
  statusWatching: {
    term: 'Status: Watching',
    definition: 'The system is actively monitoring this token\'s price every minute. It\'s checking if the price has hit your entry target. No action needed—just wait.',
    example: 'Your order is set and the bot is doing its job. Check back later or enable notifications.',
  },
  statusReadyToBuy: {
    term: 'Status: Ready to Buy',
    definition: 'The token price has hit or dropped below your entry price! The system is alerting you to execute the buy. You need to click to sign the transaction with your wallet—the bot can\'t spend your money without your approval.',
    example: 'You set entry at $0.04, price dropped to $0.039. Time to buy if you still want in!',
  },
  statusPositionOpen: {
    term: 'Status: Position Open',
    definition: 'You\'ve bought the token and now own it. The system is watching for your exit price or stop loss to be hit. Your money is now in this token until you sell.',
    example: 'You bought at $0.04, now waiting for it to rise to your exit at $0.08.',
  },
  statusReadyToSell: {
    term: 'Status: Ready to Sell',
    definition: 'Congratulations! The price has reached your exit target. This is your profit-taking moment. Click to sign the sell transaction and lock in your gains.',
    example: 'You bought at $0.04, set exit at $0.08, and it hit $0.08. Time to take profits!',
  },
  statusStopLossHit: {
    term: 'Status: Stop Loss Hit',
    definition: 'The price dropped to your stop loss level. This is your safety exit to prevent further losses. Sign the transaction to sell and protect what\'s left of your investment.',
    example: 'You bought at $0.04, stop loss was $0.03, price dropped to $0.03. Sell now to limit the damage.',
  },
  slippage: {
    term: 'Slippage',
    definition: 'The difference between the price you expect and the price you actually get. In fast markets, prices move quickly between when you click and when the trade executes. Higher slippage tolerance = faster execution but possibly worse price.',
    example: '1% slippage on a $100 trade means you might pay up to $101 or receive as little as $99.',
  },
  liquidity: {
    term: 'Liquidity',
    definition: 'How easily a token can be bought or sold without dramatically affecting its price. High liquidity = lots of buyers/sellers, stable prices. Low liquidity = risky, big price swings on trades.',
    example: 'Bitcoin has high liquidity. A brand new meme coin with $1,000 in the pool has very low liquidity.',
  },
  marketCap: {
    term: 'Market Cap',
    definition: 'The total value of all tokens in circulation. Calculated as: current price × total supply. Gives you an idea of the token\'s size and potential for growth.',
    example: 'A token at $0.01 with 1 billion supply = $10 million market cap.',
  },
  volume24h: {
    term: '24h Volume',
    definition: 'The total dollar amount of this token that was bought and sold in the last 24 hours. High volume = active trading and interest. Low volume = less interest or dead token.',
    example: '$500K daily volume means half a million dollars worth was traded today.',
  },
  priceChange: {
    term: 'Price Change %',
    definition: 'How much the price has moved over a specific time period, shown as a percentage. Green/positive = price went up. Red/negative = price went down.',
    example: '+25% in 24h means if it was $0.04 yesterday, it\'s now $0.05.',
  },
  botPercentage: {
    term: 'Bot Percentage',
    definition: 'An estimate of how much trading activity comes from automated bots vs real humans. High bot % can mean artificial activity, potential manipulation, or just active market makers. Use caution with very high bot activity.',
    example: '80% bot activity might indicate wash trading or a token being artificially pumped.',
  },
  holders: {
    term: 'Holders',
    definition: 'The number of unique wallets that own this token. More holders generally means wider distribution and potentially more stability. Few holders = risky, as one whale selling can crash the price.',
    example: '10,000 holders is healthier than 50 holders where one might own 90% of supply.',
  },
}
