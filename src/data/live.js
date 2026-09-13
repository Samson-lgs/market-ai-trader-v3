import { MarketDataProvider } from './provider.js';
import { analyzeMultiTimeframe } from '../analysis/index.js';

const TIMEFRAME_MAP = {
  '1H': '1h',
  '30M': '30min',
  '15M': '15min',
  '5M': '5min',
  '1M': '1min'
};

export async function loadLiveAnalysis(symbol, outputsize = 200) {
  const provider = new MarketDataProvider();
  const entries = await Promise.all(
    Object.entries(TIMEFRAME_MAP).map(async ([label, interval]) => {
      const candles = await provider.candles(symbol, interval, outputsize);
      return [label, candles];
    })
  );

  return analyzeMultiTimeframe(Object.fromEntries(entries));
}
