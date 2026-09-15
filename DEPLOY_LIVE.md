# Make the dashboard live

The repository contains the frontend and Netlify Functions in one project. The simplest production setup is to deploy this repository itself to Netlify. Netlify will host the static dashboard and the functions together, so the dashboard can use the same-origin `/.netlify/functions` path without a `?api=` parameter.

## 1. Deploy the repository to Netlify

Create a new Netlify site from this GitHub repository:

`Samson-lgs/market-ai-trader-v3`

The checked-in `netlify.toml` already sets:

- Publish directory: `.`
- Functions directory: `netlify/functions`

Netlify automatically deploys functions from the configured functions directory when the repository is connected. See the Netlify Functions documentation for the current deployment behavior.

## 2. Add the server secret

In Netlify site settings, add this environment variable for the Functions/runtime scope:

`TWELVE_DATA_API_KEY`

Do not put this key in `index.html`, `src/config.js`, GitHub Pages, or any other frontend file.

Optional calendar settings:

`CALENDAR_API_URL`

`CALENDAR_API_KEY`

After changing environment variables, trigger a new deploy so the Functions runtime receives the updated values.

## 3. Verify the backend before testing the UI

Open:

`https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/health`

Expected result:

- HTTP 200
- `ok: true`
- `marketData.configured: true`

If the response is HTTP 503 or `marketData.configured` is false, the Twelve Data key is missing from the deployed Functions environment.

## 4. Verify a real candle request

Example:

`https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/candles?symbol=EUR%2FUSD&interval=5min&outputsize=40`

Expected result:

- HTTP 200
- `source: "twelve-data"`
- `candles` contains at least 40 normalized OHLC records

## 5. GitHub Pages option

GitHub Pages cannot execute `netlify/functions`. To keep using the GitHub Pages frontend, append the deployed backend functions base URL:

`https://YOUR-USER.github.io/YOUR-REPO/?api=https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions`

The frontend normalizes a bare Netlify site URL automatically, so this also works:

`?api=https://YOUR-NETLIFY-SITE.netlify.app`

The URL is public configuration; provider secrets remain server-side.

## 6. What the dashboard should do

When live candles are available:

`LIVE FEED -> MTF analysis -> structure/liquidity -> setup ranking -> news/session/R:R gates -> CALL/PUT or NO TRADE`

When live data is unavailable:

`LIVE DATA OFFLINE -> NO TRADE`

The dashboard must never fabricate candles or emit a synthetic CALL/PUT in live mode.
