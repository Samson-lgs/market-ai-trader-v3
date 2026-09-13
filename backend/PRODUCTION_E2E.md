# Production Realtime E2E Verification

## Architecture

GitHub Pages hosts the static frontend. A persistent Node/WebSocket service hosts `backend/realtime-server.js`. The gateway authenticates to Twelve Data using server-side environment variables and exposes only normalized ticks to the browser.

## Required server environment

```text
TWELVE_DATA_API_KEY=<server secret>
TWELVE_DATA_WS_URL=wss://ws.twelvedata.com/v1/quotes/price
PORT=8787
```

Never put `TWELVE_DATA_API_KEY` in frontend code, GitHub Pages configuration, or committed files.

## Production checks

1. Deploy `backend/` to a WebSocket-capable Node host.
2. Confirm `GET /health` returns `status: ok` and `providerConfigured: true`.
3. Set the frontend runtime `MARKET_AI_REALTIME_WS_URL` to the gateway `wss://.../stream` URL.
4. Open the dashboard and subscribe to `EUR/USD`.
5. Verify browser WebSocket messages include `gateway`, `subscription`, and normalized `tick` messages.
6. Verify each tick updates the active 1-minute OHLC candle.
7. Verify 5M/15M/30M/1H candles update from the 1M stream.
8. Verify the analysis engine recalculates without using future candles.
9. Disconnect the gateway/provider and confirm the UI transitions to stale/disconnected state and does not present a fresh live signal.
10. Restore connectivity and confirm ticks resume and the stale gate clears.
11. Confirm changing symbols unsubscribes the old symbol and does not leak provider subscriptions.

## Acceptance criteria

- Provider credentials never appear in browser network payloads.
- At least one real provider tick reaches the browser after a valid subscription.
- Tick timestamp and price are finite and normalized.
- No duplicate provider subscription is created for multiple browser clients using the same symbol.
- Client disconnect removes its subscriptions; provider closes when no symbols remain.
- Stale feeds cannot produce a fresh realtime status.
- REST seed remains available as recovery/resynchronization data.

This stage provides live market data infrastructure only. It does not execute trades or guarantee signal accuracy or profitability.
