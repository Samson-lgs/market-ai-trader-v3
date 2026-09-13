# Market AI Trader V3

A decision-intelligence dashboard for multi-timeframe market analysis across Forex, crypto, indices and commodities.

## Backtest stage
The `backtesting-v1` branch adds a walk-forward historical validation engine and Backtest Lab. It uses the same MTF analysis and setup-ranking logic, makes decisions only from candles available at the decision timestamp, and evaluates later candles for outcomes.

Metrics include win rate, expectancy, profit factor, net R, maximum drawdown, loss streak, setup grade and setup type. Same-candle stop/target collisions are resolved conservatively as stop-first; holding period, cooldown, slippage and fee assumptions are configurable.

Open `backtest.html` for the browser validation interface and `src/analysis/backtest.js` for the engine.

## Data shape
```json
{
  "candlesByTimeframe": {
    "1H": [], "30M": [], "15M": [], "5M": [], "1M": []
  }
}
```

## Safety
Backtests are historical model measurements, not guarantees of future performance. Use realistic transaction costs, multiple market regimes and an untouched out-of-sample period before relying on results.
