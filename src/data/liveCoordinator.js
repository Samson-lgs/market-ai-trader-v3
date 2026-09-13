import { loadLiveCandles } from './live.js';
import { createRealtimeProvider } from './realtimeProvider.js';
import { CandleAggregator } from '../market/realtimeBars.js';
import { aggregateCandles } from '../market/mtfAggregate.js';

export async function startEndToEndFeed({ symbol, onUpdate, onStatus } = {}) {
  const seeded = await loadLiveCandles(symbol, 200);
  const oneMinute = new CandleAggregator({ seed: seeded?.['1M'] || [] });
  const emit = (reason = 'REST seed') => {
    const candles = aggregateCandles(oneMinute.snapshot());
    onUpdate?.({ symbol, candles, reason, fetchedAt: new Date().toISOString() });
  };
  emit();

  const provider = createRealtimeProvider({
    symbol,
    onStatus,
    onTick: tick => {
      oneMinute.push(tick);
      emit('realtime tick');
    }
  });
  provider?.connect();

  return {
    provider,
    refreshSeed: async () => {
      const fresh = await loadLiveCandles(symbol, 200);
      const replacement = new CandleAggregator({ seed: fresh?.['1M'] || [] });
      for (const candle of replacement.snapshot()) oneMinute.candles.push(candle);
      oneMinute.candles = oneMinute.candles.slice(-500);
      emit('REST resync');
    },
    close: () => provider?.close()
  };
}
