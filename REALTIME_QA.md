# Real-Time QA Checklist

- [ ] Browser does not contain provider API keys.
- [ ] WebSocket disabled when `MARKET_AI_REALTIME_WS_URL` is empty.
- [ ] CONNECTING → CONNECTED → LIVE status transitions work.
- [ ] Disconnect triggers bounded exponential reconnect.
- [ ] Heartbeat does not create duplicate subscriptions.
- [ ] No tick updates are accepted with invalid/non-positive prices.
- [ ] Timestamp seconds are normalized to milliseconds.
- [ ] Stale feed enters STALE state after configured threshold.
- [ ] Tick aggregation creates exactly one candle per time bucket.
- [ ] OHLC rules remain deterministic.
- [ ] Volume accumulates without becoming NaN.
- [ ] Aggregator keeps bounded history.
- [ ] REST seed + streaming ticks do not create duplicate minute bars.
- [ ] MTF analysis is not executed while the stream is stale.
- [ ] Existing SIMULATED fallback still works on GitHub Pages.
