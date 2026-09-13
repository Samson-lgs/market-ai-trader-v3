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
- Secure Netlify/Twelve Data server-side candle proxy
- Live OHLC candles with 60-second refresh and short client cache
- Session-aware setup quality grading
- Economic-calendar risk adapter with HIGH / MEDIUM / LOW / UNKNOWN states
- Secure server-side calendar proxy; provider credentials never reach the browser
- Walk-forward historical backtesting with no-future-leak decision timestamps
- Backtest metrics: win rate, expectancy, profit factor, net R, max drawdown and loss streak
- Backtest breakdown by setup grade and setup type
- Explicit final NO-TRADE gate
- Safe simulated fallback when live data is unavailable

## Backtest Lab
Open `backtest.html` from the deployed dashboard to load chronological multi-timeframe JSON and evaluate the same setup engine historically.

Expected JSON shape:

```json
{
  "candlesByTimeframe": {
    "1H": [],
    "30M": [],
    "15M": [],
    "5M": [],
    "1M": []
  }
}
```

Validation rules:
- Decisions use only candles whose timestamps are at or before the execution candle.
- Future candles are used only after a setup has been accepted, for outcome evaluation.
- A same-candle stop/target collision is treated as a stop first.
- Trades have a configurable maximum holding period and cooldown.
- Slippage and fees are modeled as R deductions rather than ignored.
- Results are reported in R so they are independent of account size.

## Live-data setup
Configure `TWELVE_DATA_API_KEY` as a server-side deployment environment variable. Never put the provider key in `app.js`, HTML, or any public frontend file.

## Economic-calendar setup
Configure `CALENDAR_API_URL` and optional `CALENDAR_API_KEY` server-side. If the provider is not configured or fails, the application stays `UNKNOWN`; it does not invent economic events.

## Architecture
`Market provider → secure proxy → normalized OHLC → MTF → liquidity/BOS/CHOCH → setup ranking → economic-event risk → session/risk gates → backtesting → UI`

## Safety
This is an analysis/education interface, not financial advice and not an automated trading system. Signals are model outputs, not guaranteed probabilities of profit. Forex, crypto and leveraged products can result in substantial losses. Historical backtests are model measurements, not guarantees of future performance. Paper trading should come before any execution integration.
