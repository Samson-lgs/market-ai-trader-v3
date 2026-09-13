# Market AI Trader V3 — Backtest Stage

This branch contains the historical validation stage for Market AI Trader V3.

`src/analysis/backtest.js` performs walk-forward evaluation using the same multi-timeframe analysis and setup detector. Decisions are made only from candles available at the decision timestamp; later candles are used only for outcome evaluation.

Metrics include trades, wins/losses, win rate, net R, expectancy, profit factor, maximum drawdown, maximum losing streak, and breakdowns by setup grade/type.

The engine conservatively resolves same-candle stop/target collisions as stop-first and supports configurable holding period, cooldown, slippage and fees. `backtest.html` provides the browser Backtest Lab and accepts chronological JSON with 1H, 30M, 15M, 5M and 1M candle arrays.

Historical results are model measurements, not guarantees of future performance.
