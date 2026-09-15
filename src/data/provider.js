// Provider-neutral market-data contract.
// Credentials remain server-side; the browser only calls our proxy.
import { MARKET_API_BASE_URL } from '../config.js';

// UI labels are mapped to provider symbols before reaching Twelve Data.
const PROVIDER_SYMBOLS = {
  'S&P 500': 'SPX',
  'NASDAQ 100': 'NDX',
  'DOW 30': 'DJI',
  'NIFTY 50': 'NIFTY',
  'DAX 40': 'DAX',
  'Gold': 'XAU/USD',
  'Silver': 'XAG/USD',
  'WTI Crude': 'WTI/USD',
  'Brent Crude': 'XBR/USD',
  'Natural Gas': 'XNG/USD',
};

export class MarketDataProvider {
  constructor({ baseUrl } = {}) {
    const configured = baseUrl || MARKET_API_BASE_URL || '/.netlify/functions';
    this.baseUrl = configured.replace(/\/$/, '');
  }

  async candles(symbol, interval, outputsize = 200, { signal } = {}) {
    if (globalThis.location?.hostname?.endsWith('.github.io') && !MARKET_API_BASE_URL) {
      throw new Error('Live backend is not configured. Deploy the Netlify functions and set the backend URL with ?api=.');
    }

    const providerSymbol = PROVIDER_SYMBOLS[symbol] || symbol;
    const url = /^https?:\/\//i.test(this.baseUrl)
      ? new URL(`${this.baseUrl}/candles`)
      : new URL(`${this.baseUrl}/candles`, window.location.origin);
    url.searchParams.set('symbol', providerSymbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('outputsize', String(outputsize));

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Market data request failed: ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload.candles)) throw new Error('Invalid candle payload');

    const candles = payload.candles
      .map(c => ({
        time: c.datetime,
        datetime: c.datetime,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume || 0),
      }))
      .filter(c => [c.open, c.high, c.low, c.close].every(Number.isFinite));

    if (candles.length < 40) throw new Error(`Insufficient candle history: ${candles.length}`);
    return candles;
  }
}
