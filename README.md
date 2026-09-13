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
- **AI Performance Intelligence:** ranks setup types, grades, sessions, score bands and news-risk segments from completed backtest trades
- Browser Backtest Lab
- Browser Performance Intelligence Lab
- Safe simulated fallback when live data is unavailable

## Backtest Lab
Open `backtest.html` from the deployed dashboard and load chronological multi-timeframe JSON. The Backtest Lab evaluates decisions without using future candles.

## Performance Intelligence
Open `performance.html` after exporting or preparing a backtest trade-log JSON. The analyzer reports overall expectancy plus segment rankings by setup type, grade, session, score band and news risk. It also flags weak segments, insufficient sample sizes and non-positive overall expectancy.

Performance Intelligence is evidence analysis, not a predictive model. A segment is only ranked as meaningful when it meets the configured minimum trade count.

## Live setup
Keep provider credentials server-side. Configure `TWELVE_DATA_API_KEY` for market candles and `CALENDAR_API_URL` plus optional `CALENDAR_API_KEY` for the economic calendar. Never place real keys in frontend files.

## Architecture
`Market data → secure proxy → MTF analysis → liquidity/BOS/CHOCH → setup ranking → economic-event risk → session/risk gates → historical validation → performance intelligence → UI`

## Safety
This is an analysis/education interface, not financial advice or an automated trading system. Signals and backtests are model outputs, not guarantees of future performance. Forex, crypto and leveraged products can result in substantial losses.
