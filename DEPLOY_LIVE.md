# Live backend deployment

Market AI Trader V3 uses a split deployment:

- **Frontend:** GitHub Pages (`https://samson-lgs.github.io/market-ai-trader-v3/`)
- **Backend:** Netlify Functions in `netlify/functions/`
- **Market data:** Twelve Data, accessed only by the backend
- **Economic calendar:** configurable calendar provider, accessed only by the backend

## 1. Deploy the backend

Create a Netlify site from this repository and use the repository root as the publish directory. `netlify.toml` already points Netlify to `netlify/functions`.

## 2. Add Netlify environment variables

In Netlify site settings, add:

```text
TWELVE_DATA_API_KEY=<your Twelve Data key>
CALENDAR_API_URL=<your economic-calendar provider endpoint>
CALENDAR_API_KEY=<optional provider key>
ALLOWED_ORIGIN=https://samson-lgs.github.io
```

`ALLOWED_ORIGIN` also accepts a comma-separated list if more than one frontend origin needs access.

Never put `TWELVE_DATA_API_KEY` or `CALENDAR_API_KEY` in `index.html`, `app.js`, `src/config.js`, GitHub Pages, or any public client bundle.

## 3. Verify the backend

Open:

```text
https://<your-netlify-site>.netlify.app/.netlify/functions/health
```

Expected response includes:

```json
{
  "status": "ok",
  "marketDataConfigured": true,
  "calendarConfigured": true
}
```

Then test a candle request:

```text
https://<your-netlify-site>.netlify.app/.netlify/functions/candles?symbol=EUR%2FUSD&interval=15min&outputsize=200
```

The response must contain a non-empty `candles` array.

## 4. Connect GitHub Pages frontend

After the Netlify URL is known, set the public runtime backend URL in `src/config.js` to the Netlify functions origin, for example:

```js
export const MARKET_API_BASE_URL = 'https://<your-netlify-site>.netlify.app/.netlify/functions';
export const CALENDAR_API_BASE_URL = MARKET_API_BASE_URL;
```

Commit that public URL only. Do not commit credentials.

The dashboard will then use the live backend from GitHub Pages. If the backend URL is empty, GitHub Pages intentionally remains in safe simulated mode.

## 5. End-to-end QA

Check these flows after deployment:

1. Dashboard loads without console errors.
2. `EUR/USD` returns five MTF candle sets.
3. Status changes to `LIVE FEED` only after successful market-data retrieval.
4. News status is `LOW`, `MEDIUM`, or `HIGH` when the calendar provider responds; otherwise it remains `UNKNOWN`.
5. Switching watchlist symbols refreshes the live analysis.
6. A failed provider request falls back safely and does not expose credentials.
7. Performance Intelligence and Backtest Lab still work independently.

## GitHub Actions deployment

The repository includes a manual Netlify deployment workflow. Add GitHub Actions secrets named `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`, then run the workflow from the Actions tab. The workflow deploys the same repository configuration used by Netlify.
