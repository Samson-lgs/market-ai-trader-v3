# Realtime Deployment Runbook

1. Deploy `backend/` to a WebSocket-capable Node hosting service.
2. Set `TWELVE_DATA_API_KEY` and the provider WebSocket endpoint as server environment variables.
3. Expose `/stream` over `wss://` and `/health` over HTTPS.
4. Set the frontend `MARKET_AI_REALTIME_WS_URL` to the public `wss://.../stream` endpoint.
5. Keep the GitHub Pages frontend free of provider credentials.
6. Verify reconnect, stale-feed blocking, and candle aggregation before enabling live analysis.

Do not label the feed LIVE until the health and end-to-end tick checks pass.
