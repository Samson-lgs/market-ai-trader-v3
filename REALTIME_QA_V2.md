# Real-Time QA

- Invalid prices are rejected.
- Seconds timestamps are converted to milliseconds.
- Disconnects reconnect with bounded backoff.
- Heartbeat runs only while connected.
- Stale streams are explicitly marked.
- Tick aggregation produces deterministic OHLCV.
- Candle history remains bounded.
- Analysis freshness gate blocks stale streams.
- No provider API key is exposed to the browser.
- Empty public WebSocket configuration keeps existing fallback behavior.
