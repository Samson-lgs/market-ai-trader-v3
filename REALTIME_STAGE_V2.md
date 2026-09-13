# Real-Time Feed Foundation

- WebSocket client: reconnect/backoff, heartbeat, stale detection, tick normalization.
- Tick-to-1M OHLCV aggregation with bounded history.
- Public runtime socket URL configuration; no API keys in frontend.
- Analysis freshness gate blocks updates when the stream is stale/unavailable.

This stage is provider-neutral. It does not claim a live provider connection until a secure server-side WebSocket gateway is deployed and configured.
