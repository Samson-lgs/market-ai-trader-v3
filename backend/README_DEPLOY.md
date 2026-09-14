# V4 Backend Deployment

## What this service does

The V4 backend is the private bridge between the browser dashboard and Twelve Data.

It provides two things:

- `GET /health` — confirms that the backend is online and whether the Twelve Data key is configured.
- `GET /candles?...` — securely fetches market candles without exposing the API key to the browser.
- `WS /stream` — streams live price ticks from Twelve Data to subscribed browser clients.

## Environment variables

Set these in the hosting provider. Do not put them in GitHub Pages or frontend JavaScript.

```text
TWELVE_DATA_API_KEY=your_private_key
TWELVE_DATA_WS_URL=wss://ws.twelvedata.com/v1/quotes/price
ALLOWED_ORIGIN=https://samson-lgs.github.io
PORT=10000
```

## Render

Create a new Blueprint/Web Service from the repository and use `backend/render.yaml`.

The service must expose the generated HTTPS URL. The realtime browser URL is the same host with `wss://` and `/stream`, for example:

```text
HTTPS: https://your-service.onrender.com
WSS:   wss://your-service.onrender.com/stream
```

The V4 dashboard stores these public URLs in browser localStorage so the frontend does not need a rebuild after deployment.
