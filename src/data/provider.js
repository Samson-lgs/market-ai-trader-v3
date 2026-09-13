// Provider-neutral market-data contract.
// Keep API credentials on a server/proxy; never place provider keys in browser code.

export class MarketDataProvider {
  constructor({ baseUrl }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async candles(symbol, interval, outputsize = 200) {
    const url = new URL(`${this.baseUrl}/candles`);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('outputsize', String(outputsize));
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Market data request failed: ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.data)) throw new Error('Invalid candle payload');
    return payload.data.map(c => ({
      time: c.time,
      open: Number(c.open), high: Number(c.high), low: Number(c.low), close: Number(c.close), volume: Number(c.volume || 0)
    }));
  }
}
