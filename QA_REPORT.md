# Market AI Trader V3 — QA Report

## Scope
- GitHub Pages frontend entry point and navigation
- Dashboard JavaScript flow
- Multi-timeframe analysis wiring
- Setup detection/ranking
- Market-data/news provider failure handling
- Backtest Lab
- Performance Intelligence
- Responsive watchlist interaction
- GitHub Pages deployment compatibility

## Findings

### Fixed — P1: GitHub Pages attempted to call unavailable Netlify functions
GitHub Pages is static hosting. The dashboard previously called `/.netlify/functions/candles` and `/.netlify/functions/calendar` from the browser, causing 404/slow fallback behaviour when hosted at the project Pages URL.

Fix: fail fast on `*.github.io` unless `MARKET_API_BASE_URL` is explicitly configured. The UI now immediately uses the clearly labelled safe simulated fallback instead of appearing stuck.

### Fixed — P1: BOS/CHOCH direction matching bug
The setup engine compared structure event types such as `BULLISH_BOS` against a prefix of `BULLISH`, so valid BOS/CHOCH events were not recognised correctly.

Fix: explicit matching against `BULLISH_BOS`, `BULLISH_CHOCH`, `BEARISH_BOS`, and `BEARISH_CHOCH`.

### Fixed — P2: Watchlist ANALYZE controls were non-interactive
The watchlist rendered text that looked actionable but did not respond to clicks.

Fix: each watchlist card is now a real button that switches the selected symbol, refreshes the analysis, and redraws the dashboard.

### Verified — Backtest Lab
- Accepts chronological multi-timeframe JSON.
- Walk-forward logic evaluates future candles only after entry.
- Stop is evaluated before target when both are touched in the same candle.
- Costs are applied to resulting R.

### Verified — Performance Intelligence
- Accepts a backtest trade array or `{ trades: [...] }` payload.
- Calculates expectancy, win rate, profit factor and median R.
- Ranks setup type, grade, session, score band and news-risk segments.
- Emits sample-size warnings.

### Known architecture limitation
GitHub Pages cannot host the server-side Netlify functions. Therefore the GitHub Pages dashboard is intentionally safe/demo mode unless a separately hosted backend is supplied through `MARKET_API_BASE_URL`. The existing `netlify/functions` backend remains available for a Netlify deployment where `TWELVE_DATA_API_KEY` and calendar environment variables are configured.

## Release recommendation
PASS for static/demo frontend after the QA fixes.

For live market data, deploy the same repository to a serverless host that supports the included Netlify functions, or provide an equivalent backend URL via `MARKET_API_BASE_URL`. Never put provider API keys in the browser.
