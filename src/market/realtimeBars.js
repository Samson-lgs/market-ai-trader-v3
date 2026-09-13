const BUCKET_MS = 60_000;

export class CandleAggregator {
  constructor({ intervalMs = BUCKET_MS, seed = [] } = {}) {
    this.intervalMs = intervalMs;
    this.candles = seed.slice(-500).map(c => ({ ...c }));
  }

  push(tick) {
    const ts = Number(tick.timestamp);
    const price = Number(tick.price);
    if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0) return null;
    const bucket = Math.floor(ts / this.intervalMs) * this.intervalMs;
    let candle = this.candles.at(-1);
    if (!candle || candle.timestamp !== bucket) {
      candle = { timestamp: bucket, open: price, high: price, low: price, close: price, volume: tick.volume || 0 };
      this.candles.push(candle);
      if (this.candles.length > 500) this.candles.shift();
    } else {
      candle.high = Math.max(candle.high, price);
      candle.low = Math.min(candle.low, price);
      candle.close = price;
      candle.volume += tick.volume || 0;
    }
    return { ...candle };
  }

  snapshot() { return this.candles.map(c => ({ ...c })); }
}
