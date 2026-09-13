// Provider-neutral market-data contract.
// Credentials remain server-side; the browser only calls our proxy.

export class MarketDataProvider {
  constructor({ baseUrl } = {}) {
    const configured = baseUrl || globalThis.MARKET_API_BASE_URL || '/.netlify/functions';
    this.baseUrl = configured.replace(/\/$/, '');
  }

  async candles(symbol, interval, outputsize = 200, { signal } = {}) {
    // GitHub Pages is static hosting and cannot serve the Netlify function path.
    // Fail fast so the dashboard can use its safe simulated fallback instead of
    // waiting for a 404/timeout on every refresh.
    if (globalThis.location?.hostname?.endsWith('.github.io') && !globalThis.MARKET_API_BASE_URL) {
      throw new Error('Live backend is not configured for GitHub Pages.');
    }

    const url = new URL(`${this.baseUrl}/candles`, window.location.origin);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('outputsize', String(outputsize));

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Market data request failed: ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload.candles)) throw new Error('Invalid candle payload');

    return payload.candles.map(c => ({
      time: c.datetime,
      datetime: c.datetime,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume || 0)
    })).filter(c => [c.open, c.high, c.low, c.close].every(Number.isFinite));
  }
}
