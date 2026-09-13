# Market AI Trader V3 — Backtest Stage

Historical validation for the Market AI Trader V3 setup engine.

`src/analysis/backtest.js` performs walk-forward evaluation using the same MTF analysis and setup detector. Decisions use only candles available at the decision timestamp; future candles are used only for outcome evaluation.

Metrics include trades, win rate, net R, expectancy, profit factor, maximum drawdown, loss streak, and setup grade/type breakdowns. Same-candle stop/target collisions are resolved conservatively as stop-first. Holding period, cooldown, slippage and fees are configurable.

`backtest.html` provides the browser Backtest Lab and accepts chronological JSON with 1H, 30M, 15M, 5M and 1M candle arrays.

Historical results are model measurements, not guarantees of future performance.
