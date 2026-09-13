# Market AI Trader V3 — Backtest Stage

`src/analysis/backtest.js` adds walk-forward historical validation using the same MTF analysis and setup detector. Decisions use only candles available at the decision timestamp; future candles are used only for outcome evaluation.

Metrics: trades, win rate, net R, expectancy, profit factor, maximum drawdown, loss streak, setup grade/type breakdowns.

Assumptions: same-candle stop/target collisions are stop-first; holding period, cooldown, slippage and fees are configurable.

`backtest.html` provides the browser Backtest Lab for chronological JSON containing 1H, 30M, 15M, 5M and 1M candle arrays.

Historical results are model measurements, not guarantees of future performance.
