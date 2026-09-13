# Market AI Trader V3

A decision-intelligence dashboard for multi-timeframe market analysis across Forex, crypto, indices and commodities.

## Backtest stage
The current `backtesting-v1` branch adds a walk-forward historical validation engine and Backtest Lab. It uses the same MTF analysis and setup-ranking logic, makes decisions only from candles available at the decision timestamp, and evaluates later candles for outcomes. Metrics include win rate, expectancy, profit factor, net R, maximum drawdown, loss streak, setup grade and setup type.

See `backtest.html` for the browser-based validation interface and `src/analysis/backtest.js` for the engine.
