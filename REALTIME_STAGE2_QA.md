# Stage 2 QA Protocol

## Unit-level invariants

- Candle bucket boundaries are deterministic.
- OHLC values preserve first open, max high, min low, last close.
- Invalid ticks are ignored.
- Aggregated volume is finite.
- 1M aggregation can feed every configured higher timeframe.
- Realtime freshness gate blocks `CONNECTING`, `DISCONNECTED`, `ERROR`, `STALE`, and missing timestamps.

## Security

- Provider API key is server-only.
- Browser configuration contains only a public `wss://` endpoint.
- `/health` reports configuration state but never credentials.

## Production gate

Do not switch the dashboard to LIVE until the deployed gateway successfully receives provider ticks, emits normalized ticks, and passes stale/reconnect tests.
