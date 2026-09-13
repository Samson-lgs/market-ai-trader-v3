# Market AI Trader V3

A decision-intelligence dashboard for multi-timeframe market analysis across Forex, crypto, indices and commodities.

## Built so far
- Multi-timeframe engine: 1H → 30M → 15M → 5M → 1M
- EMA, SMA, RSI, MACD and ATR
- Market structure, support/resistance, liquidity sweeps and displacement
- Smart-money-style BOS / CHOCH, liquidity pools and supply/demand zones
- AI setup detection/ranking with entry, invalidation, TP1/TP2 and R:R
- Session-aware setup grading and explicit NO-TRADE gating
- Secure server-side market-data proxy
- Economic-calendar proxy with HIGH / MEDIUM / LOW / UNKNOWN risk
- Currency-aware event filtering for forex pairs
- Walk-forward historical backtesting using the same setup engine
- Backtest metrics: win rate, expectancy, profit factor, net R, max drawdown and loss streak
- Setup grade/type performance breakdown and trade log
- Browser Backtest Lab
- Safe simulated fallback when live data is unavailable

## Backtest Lab
Open `backtest.html` from the deployed dashboard and load chronological multi-timeframe JSON:

```json
{
  "candlesByTimeframe": {
    "1H": [], "30M": [], "15M": [], "5M": [], "1M": []
  }
}
```

The backtester uses only candles available at the decision timestamp. Future candles are used only for outcome evaluation. Same-candle stop/target collisions are resolved conservatively as stop-first. Holding period, cooldown, slippage and fees are configurable.

## Live setup
Keep provider credentials server-side. Configure `TWELVE_DATA_API_KEY` for market candles and `CALENDAR_API_URL` plus optional `CALENDAR_API_KEY` for the economic calendar. Never place real keys in frontend files.

## Architecture
`Market data → secure proxy → MTF analysis → liquidity/BOS/CHOCH → setup ranking → economic-event risk → session/risk gates → historical validation → UI`

## Safety
This is an analysis/education interface, not financial advice or an automated trading system. Signals and backtests are model outputs, not guarantees of future performance. Forex, crypto and leveraged products can result in substantial losses.
