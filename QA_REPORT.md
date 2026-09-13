# Market AI Trader V3 — QA Report

Static frontend QA completed.

## Fixed
- GitHub Pages cannot serve the included Netlify functions, so the dashboard now fails fast to a safe simulated mode on `*.github.io` unless `MARKET_API_BASE_URL` is configured.
- News risk returns `UNKNOWN` on static GitHub Pages instead of making an unavailable function request.
- BOS/CHOCH directional matching was corrected so bullish and bearish BOS/CHOCH events are recognised.
- Watchlist ANALYZE cards are now interactive and trigger symbol selection plus refresh.

## Verified
- Dashboard entry point and relative asset paths.
- Multi-timeframe analysis wiring.
- Setup detection/ranking.
- Backtest Lab JSON flow and walk-forward evaluation.
- Performance Intelligence JSON flow and segment ranking.
- GitHub Pages deployment workflow.

## Release recommendation
PASS for the static/demo frontend.

Live market/news data requires a separately hosted backend that supports the included Netlify functions. API keys must remain server-side.
