# Market AI Trader V3

A decision-intelligence dashboard for multi-timeframe market analysis across Forex, crypto, indices and commodities.

## Built so far
- Multi-timeframe engine: 1H → 30M → 15M → 5M → 1M
- EMA, SMA, RSI, MACD and ATR indicators
- Market-structure and support/resistance detection
- Liquidity zones, sweeps and displacement context
- Smart-money-style BOS / CHOCH, liquidity pools and supply/demand zones
- AI-style setup detection and ranking with entry, invalidation, TP1/TP2 and R:R
- Weighted CALL / PUT / NO-TRADE decision engine
- Secure server-side market-data and economic-calendar proxy architecture
- Live OHLC candles with refresh/cache
- Session-aware setup quality grading
- HIGH / MEDIUM / LOW / UNKNOWN economic-event risk states
- Walk-forward historical backtesting with no-future-leak decision timestamps
- Backtest metrics: win rate, expectancy, profit factor, net R, max drawdown and loss streak
- Backtest breakdown by setup grade and setup type
- Backtest Lab browser page
- Explicit final NO-TRADE gate
- Safe simulated fallback when live data is unavailable

## Backtest Lab
Open `backtest.html` from the deployed dashboard to load chronological multi-timeframe JSON and evaluate the same setup engine historically.

The backtester uses only candles available at the decision timestamp. Future candles are used only to evaluate outcomes. Same-candle stop/target collisions are treated conservatively as stop-first. Holding period, cooldown, slippage and fees are configurable.

Expected JSON shape:

```json
{
  "candlesByTimeframe": {
    "1H": [], "30M": [], "15M": [], "5M": [], "1M": []
  }
}
```

## Live-data setup
Configure provider credentials only on the server. Never put real API keys in frontend JavaScript or HTML.

## Safety
This is an analysis/education interface, not financial advice and not an automated trading system. Signals and backtests are model outputs, not guarantees of future performance. Forex, crypto and leveraged products can result in substantial losses.
