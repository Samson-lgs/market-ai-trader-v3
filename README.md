# Market AI Trader V3 — Backtest Stage

This branch contains the historical validation stage for Market AI Trader V3.

## Engine
`src/analysis/backtest.js` performs walk-forward evaluation using the same multi-timeframe analysis and setup detector. Decisions are made only from candles available at the decision timestamp; later candles are used only for outcome evaluation.

## Metrics
- trades
- wins / losses
- win rate
- net R
- average / expectancy R
- profit factor
- maximum drawdown in R
- maximum losing streak
- performance by setup grade
- performance by setup type

## Conservative assumptions
- same-candle stop/target collision resolves as stop-first
- maximum holding period is configurable
- cooldown is configurable
- slippage and fees are deducted in R

## UI
`backtest.html` provides a browser-based Backtest Lab. It accepts chronological JSON containing `1H`, `30M`, `15M`, `5M`, and `1M` candle arrays.

Historical backtests are model measurements, not guarantees of future performance.
