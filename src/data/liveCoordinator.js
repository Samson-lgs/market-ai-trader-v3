import { loadLiveCandles } from './live.js';
import { createRealtimeProvider } from './realtimeProvider.js';
import { CandleAggregator } from '../market/realtimeBars.js';
import { aggregateCandles } from '../market/mtfAggregate.js';

export async function startEndToEndFeed({ symbol, initialCandles, onUpdate, onStatus } = {}) {
  const seeded = initialCandles || await loadLiveCandles(symbol, 200);
  const oneMinute = new CandleAggregator({ seed: seeded?.['1M'] || [] });
  const emit = (reason = 'REST seed') => {
    onUpdate?.({ symbol, candles: aggregateCandles(oneMinute.snapshot()), reason, fetchedAt: new Date().toISOString() });
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
      oneMinute.candles = (fresh?.['1M'] || []).slice(-500).map(c => ({ ...c }));
      emit('REST resync');
    },
    close: () => provider?.close()
  };
}
