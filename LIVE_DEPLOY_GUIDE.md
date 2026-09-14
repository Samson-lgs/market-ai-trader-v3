# Market AI Trader V4 — Live Deployment

## What is required

V4 can run as one Render Node web service. The service serves the dashboard, the market-data proxy, and the realtime WebSocket from the same HTTPS/WSS origin.

## Deploy

1. Open Render.
2. Choose **New → Blueprint**.
3. Connect this repository.
4. Select the `v4-live-trader-assistant` branch.
5. Apply the Blueprint from the root `render.yaml`.
6. Add `TWELVE_DATA_API_KEY` as a secret environment variable.
7. Deploy.

Render then provides an `https://<service>.onrender.com` URL.

## Verify

Open `https://<service>.onrender.com/health`.

You should see `status: ok`, `providerConfigured: true`, `websocket: true`, and `candlesProxy: true`.

Then open the root URL and click **Run AI Scan**.

## Security

The Twelve Data key must stay in Render environment variables. Never place a real key in frontend code, GitHub Pages, or a committed file.

## Signal output

V4 provides `CALL`, `PUT`, or `NO TRADE` plus separate 5, 10, 15, 30 and 60 minute directional model forecasts. These are analytical forecasts, not guarantees of future market movement.

Render documentation: https://render.com/docs/web-services
