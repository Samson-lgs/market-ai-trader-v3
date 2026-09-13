# Secure market-data proxy

The frontend must never contain the Twelve Data API key. The Netlify function in `netlify/functions/candles.js` receives a validated symbol/timeframe request, reads `TWELVE_DATA_API_KEY` from the server environment, calls Twelve Data, and returns normalized OHLCV candles.

## Local/Netlify configuration

Set these environment variables in the deployment platform:

- `TWELVE_DATA_API_KEY` — required, server-side secret.
- `ALLOWED_ORIGIN` — recommended in production; set to the exact frontend origin.

Do not commit `.env` files containing real credentials.

## Endpoint

`GET /.netlify/functions/candles?symbol=EUR/USD&interval=15min&outputsize=200`

Supported intervals are `1min`, `5min`, `15min`, `30min`, `1h`, `4h`, and `1day`. The proxy caps requests at 500 candles.

The endpoint is read-only. It does not place trades or expose provider credentials to the browser.
