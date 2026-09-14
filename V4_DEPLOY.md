# Market AI Trader V4 — Live deployment

V4 uses a secure architecture:

`Browser (GitHub Pages or static host) -> HTTPS REST backend -> Twelve Data` for historical candles, plus
`Browser -> WSS realtime gateway -> Twelve Data WebSocket` for live ticks.

## Backend environment

Set these variables on the backend/gateway host:

- `TWELVE_DATA_API_KEY` — Twelve Data API key. Keep server-side only.
- `ALLOWED_ORIGIN` — exact frontend origin, for example `https://samson-lgs.github.io`.
- `PORT` — supplied by the host; defaults to 8787.
- `TWELVE_DATA_WS_URL` — optional; defaults to `wss://ws.twelvedata.com/v1/quotes/price`.

Run from `backend/` with Node 20+:

```bash
npm install
npm start
```

The gateway exposes:

- `GET /health`
- `WSS /stream`

## Frontend runtime configuration

Before loading `app.js`, define:

```html
<script>
  window.MARKET_API_BASE_URL = 'https://YOUR-BACKEND.example.com/.netlify/functions';
  window.CALENDAR_API_BASE_URL = window.MARKET_API_BASE_URL;
  window.MARKET_AI_REALTIME_WS_URL = 'wss://YOUR-GATEWAY.example.com/stream';
</script>
```

Do not put `TWELVE_DATA_API_KEY` in this file.

V4 polls historical candles frequently and uses the WebSocket gateway when `MARKET_AI_REALTIME_WS_URL` is configured. Without a deployed backend/gateway, the UI intentionally falls back to clearly labelled demo data.

## Important

The signal engine is probabilistic. `CALL`, `PUT`, and `NO TRADE` are analytical guidance, not guaranteed outcomes. The V4 site does not place Quotex/binary-option orders automatically.
