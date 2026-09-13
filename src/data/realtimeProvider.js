import { RealtimeFeedClient } from './realtime.js';
import { REALTIME_WS_URL } from './realtimeConfig.js';

export function createRealtimeProvider({ symbol, onTick, onStatus } = {}) {
  if (!REALTIME_WS_URL) return null;
  return new RealtimeFeedClient({ url: REALTIME_WS_URL, symbol, onTick, onStatus });
}
