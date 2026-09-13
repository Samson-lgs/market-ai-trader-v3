# Secure backend

The frontend must never contain the Twelve Data API key. The Netlify function in `netlify/functions/candles.js` receives a validated request, reads `TWELVE_DATA_API_KEY` from the server environment, calls Twelve Data, and returns normalized OHLCV candles.

## REST configuration

- `TWELVE_DATA_API_KEY` — required server-side secret.
- `ALLOWED_ORIGIN` — recommended in production.
- `CALENDAR_API_URL` / `CALENDAR_API_KEY` — optional calendar provider configuration.

## Realtime gateway

`realtime-server.js` is the persistent WebSocket gateway scaffold. Deploy it to a WebSocket-capable Node host rather than treating a Netlify Function as a persistent socket server.

Realtime environment variables:

- `PORT`
- `TWELVE_DATA_WS_URL`
- `TWELVE_DATA_API_KEY`

Expose `/stream` as `wss://.../stream` and `/health` over HTTPS. Keep provider credentials server-side.

Do not commit `.env` files containing real credentials.
