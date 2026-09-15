# Market AI Trader V3 — QA Report

## Engineering stage: live-data integrity + backend diagnostics

### Implemented
- Added `netlify/functions/health.js` to expose server-side configuration status without exposing API keys.
- Added `src/data/health.js` so the browser verifies backend availability before requesting market data.
- Added runtime backend URL resolution for GitHub Pages using a public global, `<meta name="market-api">`, `?api=...`, or localStorage.
- Removed simulated candles from the live decision path. An unavailable backend/provider now results in `NO TRADE` with `LIVE DATA REQUIRED`.
- Prevented stale live setup information from being presented as a current call after a live-data failure.
- Kept economic-calendar `UNKNOWN` as an explicit risk state when the calendar provider is unavailable.

### Verification targets
- `GET /.netlify/functions/health` returns HTTP 200 and configuration metadata.
- Frontend can connect to a separately hosted Netlify Functions backend through the runtime `api` configuration.
- Missing `TWELVE_DATA_API_KEY` blocks live setup generation.
- Failed/timeout candle requests do not generate synthetic trade calls.
- Live setup generation continues through the existing MTF, liquidity, structure, session, news and R:R gates when verified candles are available.

### Deployment requirement
GitHub Pages is static and cannot execute the included Netlify Functions. A compatible backend must be deployed separately and supplied to the frontend as the public functions base URL. Provider secrets remain server-side.

### Release status
**PASS for the live-only engineering stage**, subject to deployment configuration and successful provider connectivity. **Not a guarantee of profitable trading.**
