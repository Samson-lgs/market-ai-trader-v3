# Live backend checklist

## Netlify
- [ ] Create/import the `market-ai-trader-v3` site in Netlify.
- [ ] Confirm build uses `netlify.toml`.
- [ ] Add `TWELVE_DATA_API_KEY` as a Netlify environment variable.
- [ ] Add `CALENDAR_API_URL`.
- [ ] Add `CALENDAR_API_KEY` if the calendar provider requires it.
- [ ] Set `ALLOWED_ORIGIN` to `https://samson-lgs.github.io`.
- [ ] Open `/.netlify/functions/health` and confirm `status: ok`.
- [ ] Confirm `marketDataConfigured: true`.
- [ ] Confirm `calendarConfigured: true`.

## GitHub Pages
- [ ] Put the public Netlify Functions URL into `src/config.js`.
- [ ] Do not add any provider API keys to `src/config.js`.
- [ ] Confirm dashboard status changes to `LIVE FEED` after a successful scan.
- [ ] Confirm news status is not stuck at UNKNOWN when the calendar provider is healthy.

## End-to-end
- [ ] EUR/USD: 1H, 30M, 15M, 5M and 1M all return usable candles.
- [ ] GBP/USD symbol switch refreshes data.
- [ ] Watchlist Analyze switches symbol and refreshes analysis.
- [ ] Refresh does not create duplicate timers or concurrent requests.
- [ ] Provider failure falls back to simulated mode without exposing credentials.
- [ ] Backtest Lab remains functional.
- [ ] Performance Intelligence remains functional.
