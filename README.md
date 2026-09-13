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
- Explicit final NO-TRADE gate
- Safe simulated fallback when live data is unavailable

## Live-data setup
Configure `TWELVE_DATA_API_KEY` as a server-side deployment environment variable. Never put the provider key in `app.js`, HTML, or any public frontend file.

The frontend calls:

`/.netlify/functions/candles?symbol=EUR/USD&interval=15min&outputsize=200`

The backend reads the provider secret and returns normalized candles to the browser.

## Economic-calendar setup
The frontend calls the server-side calendar proxy:

`/.netlify/functions/calendar?symbol=EUR/USD&currencies=EUR,USD&horizonMinutes=180`

Configure these server-side variables:

- `CALENDAR_API_URL` — provider endpoint returning upcoming events.
- `CALENDAR_API_KEY` — optional provider credential.

The adapter accepts common event shapes and normalizes title, currency, impact, time, forecast, previous and actual values. It derives HIGH / MEDIUM / LOW risk from the events in the configured forward window.

If the provider is not configured or fails, the application deliberately stays `UNKNOWN`; it does not invent economic events.

Twelve Data currently documents market-data APIs and an earnings calendar, so the project keeps the full economic-calendar integration provider-neutral rather than assuming Twelve Data supplies a forex macro calendar.

## Architecture
`Market provider → secure serverless proxy → normalized OHLC → MTF analysis → liquidity/BOS/CHOCH → setup ranking → economic-event risk → session/risk gates → UI`

## Safety
This is an analysis/education interface, not financial advice and not an automated trading system. Signals are model outputs, not guaranteed probabilities of profit. Forex, crypto and leveraged products can result in substantial losses. Paper trading and historical backtesting should come before any execution integration.
