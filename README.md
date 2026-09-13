# Market AI Trader V3

A decision-intelligence dashboard for multi-timeframe market analysis across Forex, crypto, indices and commodities.

## Built so far
- Multi-timeframe engine: 1H → 30M → 15M → 5M → 1M
- EMA, SMA, RSI, MACD and ATR indicators
- Market structure and support/resistance
- Liquidity sweeps, displacement, BOS / CHOCH and supply/demand zones
- AI-style setup detection/ranking with entry, invalidation, TP1/TP2 and R:R
- CALL / PUT / NO-TRADE decision engine
- Secure server-side market-data and economic-calendar proxy architecture
- Session-aware setup quality grading
- HIGH / MEDIUM / LOW / UNKNOWN event risk
- Walk-forward historical backtesting with no-future-leak timestamps
- Backtest metrics: win rate, expectancy, profit factor, net R, max drawdown and loss streak
- Backtest breakdown by setup grade and setup type
- Browser Backtest Lab
- Explicit NO-TRADE gate and safe simulated fallback

## Backtest Lab
Open `backtest.html` from the deployed dashboard to load chronological multi-timeframe JSON.

Decisions use only candles available at the decision timestamp. Future candles are used only for outcome evaluation. Same-candle stop/target collisions are treated conservatively as stop-first. Holding period, cooldown, slippage and fees are configurable.

Expected JSON shape:

```json
{
  "candlesByTimeframe": {
    "1H": [], "30M": [], "15M": [], "5M": [], "1M": []
  }
}
```

## Safety
This is an analysis/education interface, not financial advice and not an automated trading system. Signals and historical backtests are model outputs, not guarantees of future performance. Forex, crypto and leveraged products can result in substantial losses.
