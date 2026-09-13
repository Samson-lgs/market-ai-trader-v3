const BUCKET_MS = 60_000;
export class CandleAggregator {
  constructor({ intervalMs = BUCKET_MS, seed = [] } = {}) { this.intervalMs = intervalMs; this.candles = seed.slice(-500).map(c => ({ ...c })); }
  push(tick) {
    const ts = Number(tick?.timestamp), price = Number(tick?.price);
    if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0) return null;
    const bucket = Math.floor(ts / this.intervalMs) * this.intervalMs;
    let c = this.candles.at(-1);
    if (!c || c.timestamp !== bucket) { c = { timestamp: bucket, open: price, high: price, low: price, close: price, volume: Number(tick.volume) || 0 }; this.candles.push(c); if (this.candles.length > 500) this.candles.shift(); }
    else { c.high = Math.max(c.high, price); c.low = Math.min(c.low, price); c.close = price; c.volume += Number(tick.volume) || 0; }
    return { ...c };
  }
  snapshot() { return this.candles.map(c => ({ ...c })); }
}
