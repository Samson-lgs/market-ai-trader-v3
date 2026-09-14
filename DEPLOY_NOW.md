# Market AI Trader V4 — Deploy Now

This branch is prepared as a single Render web service. It serves the dashboard, the `/candles` market-data proxy, and the `/stream` realtime WebSocket from one public HTTPS/WSS origin.

## 1. Deploy

Open Render and choose **New → Blueprint**. Connect this repository and select the `v4-live-trader-assistant` branch. The root `render.yaml` creates the web service `market-ai-trader-v4`.

Render docs: https://render.com/docs/infrastructure-as-code

## 2. Required secret

Set this server environment variable in Render:

`TWELVE_DATA_API_KEY`

Do not put the key into `app.js`, `src/config.js`, GitHub Pages, or any frontend file.

## 3. Allowed origin

For the first deployment, `ALLOWED_ORIGIN` can remain `*`. For a production setup, replace it with the exact frontend origin.

## 4. Verify backend

Open:

`https://<your-render-service>.onrender.com/health`

Expected JSON contains:

- `status: "ok"`
- `providerConfigured: true`
- `websocket: true`
- `candlesProxy: true`

## 5. Open the live dashboard

Use:

`https://<your-render-service>.onrender.com/`

Because V4 detects a non-GitHub-Pages deployment, it can use the same origin for `/candles` and `/stream` automatically.

## 6. Test

1. Select `EUR/USD`.
2. Click **Run AI Scan**.
3. Confirm the chart loads real candles.
4. Confirm the status changes away from `STARTING`.
5. Confirm the primary decision shows `CALL`, `PUT`, or `NO TRADE`.
6. Confirm the 5 / 10 / 15 / 30 / 60 minute forecast cards update.
7. If the realtime stream is available on the Twelve Data plan, confirm the last-price line and 1-minute candle update as ticks arrive.

## Important

No system can guarantee the exact future price direction or a profitable trade. V4 provides analytical CALL/PUT/NO TRADE guidance from the connected market data and its rule-based forecasting engine. It does not place orders automatically.
