import { MarketDataProvider } from './provider.js';
import { analyzeMultiTimeframe } from '../analysis/index.js';

const TIMEFRAME_MAP = {
  '1H': '1h',
  '30M': '30min',
  '15M': '15min',
  '5M': '5min',
  '1M': '1min'
};

const cache = new Map();
const CACHE_MS = 20_000;
const REQUEST_TIMEOUT_MS = 5_000;

async function fetchWithTimeout(provider, symbol, interval, outputsize) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await provider.candles(symbol, interval, outputsize, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadLiveCandles(symbol, outputsize = 200) {
  const key = `${symbol}:${outputsize}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_MS) return cached.candlesByTimeframe;

  const provider = new MarketDataProvider();
  const entries = await Promise.all(
    Object.entries(TIMEFRAME_MAP).map(async ([label, interval]) => {
      const candles = await fetchWithTimeout(provider, symbol, interval, outputsize);
      return [label, candles];
    })
  );
  const candlesByTimeframe = Object.fromEntries(entries);
  cache.set(key, { timestamp: Date.now(), candlesByTimeframe });
  return candlesByTimeframe;
}

export async function loadLiveAnalysis(symbol, outputsize = 200) {
  const candlesByTimeframe = await loadLiveCandles(symbol, outputsize);
  return analyzeMultiTimeframe(candlesByTimeframe);
}

export function clearLiveCache(symbol) {
  if (symbol) cache.delete(`${symbol}:200`);
  else cache.clear();
}
