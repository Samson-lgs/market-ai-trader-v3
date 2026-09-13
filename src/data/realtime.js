import { loadLiveCandles } from './live.js';

const DEFAULT_INTERVAL = 60_000;

export function createRealtimeCoordinator({ symbol, onUpdate, onError, intervalMs = DEFAULT_INTERVAL } = {}) {
  let timer = null;
  let running = false;
  let generation = 0;

  async function tick() {
    const run = ++generation;
    try {
      const candles = await loadLiveCandles(symbol, 200);
      if (run !== generation) return;
      onUpdate?.({ symbol, candles, fetchedAt: new Date().toISOString() });
    } catch (error) {
      if (run !== generation) return;
      onError?.(error);
    }
  }

  return {
    start() { if (running) return; running = true; tick(); timer = setInterval(tick, intervalMs); },
    stop() { running = false; generation++; if (timer) clearInterval(timer); timer = null; },
    refresh: tick,
    get running() { return running; }
  };
}
