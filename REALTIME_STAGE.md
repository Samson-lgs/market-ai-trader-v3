# Real-Time Streaming Stage

This stage adds the provider-neutral client and tick-to-1M candle aggregation foundation.

## Components

- `src/data/realtime.js` — browser WebSocket client with reconnect, heartbeat, stale-feed detection and normalized ticks.
- `src/market/realtimeBars.js` — deterministic tick-to-candle aggregation.
- `netlify/functions/stream.js` — backend readiness/health contract for the streaming layer.

## Safety

No API key is placed in browser code. The frontend remains compatible with the existing GitHub Pages safe fallback. The stream gateway is intentionally provider-neutral; `TWELVE_DATA_WS_URL` must be configured server-side before a real provider socket is used.

## Next integration

Wire the backend WebSocket provider to the client, seed the 1M aggregator from REST candles, rebuild 5M/15M/30M/1H bars, and trigger the existing MTF/setup lifecycle engine only after feed freshness checks pass.
