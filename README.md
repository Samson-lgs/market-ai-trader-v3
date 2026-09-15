# Market AI Trader V3

A decision-intelligence dashboard for multi-timeframe market analysis across Forex, crypto, indices and commodities.

## Engineering stage: live-data integrity
The current production stage treats live market data as a hard prerequisite for a trade call. The dashboard no longer generates simulated candles as a substitute for unavailable live data. When the backend is unavailable or the provider is not configured, the UI shows **NO TRADE / LIVE DATA REQUIRED** and explains the failure state.

## Built so far
- Multi-timeframe engine: 1H → 30M → 15M → 5M → 1M
- EMA, SMA, RSI, MACD and ATR
- Market structure, support/resistance, liquidity sweeps and displacement
- Smart-money-style BOS / CHOCH, liquidity pools and supply/demand zones
- AI setup detection/ranking with entry, invalidation, TP1/TP2 and R:R
- Session-aware setup grading and explicit NO-TRADE gating
- Secure server-side market-data proxy
- Backend health diagnostics
- Economic-calendar proxy with HIGH / MEDIUM / LOW / UNKNOWN risk
- Currency-aware event filtering for forex pairs
- Walk-forward historical backtesting using the same setup engine
- Backtest metrics: win rate, expectancy, profit factor, net R, max drawdown and loss streak
- Setup grade/type performance breakdown and trade log
- **AI Performance Intelligence:** ranks setup types, grades, sessions, score bands and news-risk segments from completed backtest trades
- Browser Backtest Lab
- Browser Performance Intelligence Lab
- Live-only setup generation (no synthetic candles for live decisions)

## Connecting GitHub Pages to the backend
GitHub Pages cannot execute Netlify Functions. Deploy the `netlify/functions` directory to a Netlify site (or another compatible server) and configure the provider secrets there.

The frontend accepts the public backend base URL in this priority order:
1. `MARKET_API_BASE_URL` global
2. `<meta name="market-api" content="...">`
3. URL parameter `?api=https://YOUR-BACKEND/.netlify/functions`
4. browser localStorage key `market-ai-api-base-url`
5. same-origin `/.netlify/functions` when hosted with the functions

Example GitHub Pages URL:
`https://YOUR-USER.github.io/YOUR-REPO/?api=https://YOUR-BACKEND.netlify.app/.netlify/functions`

The URL may be public; **never put `TWELVE_DATA_API_KEY` or `CALENDAR_API_KEY` in the frontend**.

## Backend health
`GET /.netlify/functions/health` returns whether the market-data and calendar services are configured. The dashboard checks this before requesting live candles.

## Backtest Lab
Open `backtest.html` from the deployed dashboard and load chronological multi-timeframe JSON. The Backtest Lab evaluates decisions without using future candles.

## Performance Intelligence
Open `performance.html` after exporting or preparing a backtest trade-log JSON. The analyzer reports overall expectancy plus segment rankings by setup type, grade, session, score band and news risk. It also flags weak segments, insufficient sample sizes and non-positive overall expectancy.

Performance Intelligence is evidence analysis, not a predictive model. A segment is only ranked as meaningful when it meets the configured minimum trade count.

## Live setup
Keep provider credentials server-side. Configure `TWELVE_DATA_API_KEY` for market candles and `CALENDAR_API_URL` plus optional `CALENDAR_API_KEY` for the economic calendar. Never place real keys in frontend files.

## Architecture
`Live market data → health gate → secure proxy → MTF analysis → liquidity/BOS/CHOCH → setup ranking → economic-event risk → session/risk gates → trade-call UI`

## Safety
This is an analysis/education interface, not financial advice or an automated trading system. Calls and backtests are model outputs, not guarantees of future performance. Forex, crypto and leveraged products can result in substantial losses.
