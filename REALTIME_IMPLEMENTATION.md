# Realtime Implementation Notes

This stage deliberately stops short of claiming provider connectivity.

## Data flow

`Provider WebSocket -> normalized tick -> CandleAggregator(1M) -> higher timeframe aggregation -> freshness gate -> existing MTF/setup lifecycle engine`

## Invariants

1. No provider secret is shipped to the browser.
2. A stale/disconnected stream must block new signal updates.
3. Reconnects use bounded exponential backoff.
4. Timestamps are normalized to milliseconds.
5. Tick prices must be finite and positive.
6. Candle history is bounded.
7. Existing REST/simulated fallback remains available until a live socket is explicitly configured.
