# Realtime V2 QA

- No API key exists in frontend runtime configuration.
- Empty WebSocket URL leaves the existing REST/demo path untouched.
- Invalid tick price is rejected.
- Seconds timestamps normalize to milliseconds.
- Reconnect backoff is bounded.
- Heartbeat is active only while connected.
- Stale feed is detected.
- Tick aggregation updates OHLCV deterministically.
- Aggregation history remains bounded.
- Stale/disconnected data blocks new signal updates.
