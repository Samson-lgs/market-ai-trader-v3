export function realtimeGate({ status, lastTickAt, now = Date.now(), staleMs = 90_000 } = {}) {
  const ageMs = Number.isFinite(lastTickAt) ? Math.max(0, now - lastTickAt) : Infinity;
  const fresh = status === 'LIVE' && ageMs <= staleMs;
  return { fresh, blocked: !fresh, ageMs, reason: fresh ? 'Realtime feed is fresh.' : 'Realtime feed is unavailable or stale; block signal updates.' };
}
