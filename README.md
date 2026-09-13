# Market AI Trader V3

A decision-intelligence dashboard for multi-timeframe market analysis across Forex, crypto, indices and commodities.

## Built so far
- Multi-timeframe engine: 1H → 30M → 15M → 5M → 1M
- EMA, SMA, RSI, MACD and ATR indicators
- Market-structure and support/resistance detection
- Liquidity zones, sweeps and displacement context
- Weighted CALL / PUT / NO-TRADE decision engine
- Secure Netlify/Twelve Data server-side candle proxy
- Live OHLC candles with 60-second refresh and short client cache
- Session-aware setup quality grading
- Conservative event/news-risk adapter
- Explicit final NO-TRADE gate
- Safe simulated fallback when live data is unavailable

## Live-data setup
Configure `TWELVE_DATA_API_KEY` as a server-side deployment environment variable. Never put the provider key in `app.js`, HTML, or any public frontend file.

The frontend calls:

`/.netlify/functions/candles?symbol=EUR/USD&interval=15min&outputsize=200`

The backend reads the provider secret and returns normalized candles to the browser.

## News-risk status
The event layer deliberately reports `UNKNOWN` until a real economic-calendar/news provider is connected. It never invents upcoming events. A future calendar integration should supply LOW / MEDIUM / HIGH risk and event metadata.

## Architecture
`Market provider → secure serverless proxy → normalized OHLC → MTF analysis → setup grading → risk gate → UI`

## Safety
This is an analysis/education interface, not financial advice and not an automated trading system. Signals are model outputs, not guaranteed probabilities of profit. Forex, crypto and leveraged products can result in substantial losses. Paper trading and historical backtesting should come before any execution integration.
