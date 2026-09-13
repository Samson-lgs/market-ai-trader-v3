// Public runtime configuration only. Never place provider API keys here.
// Set these globals before app.js if a deployed backend is available.
export const MARKET_API_BASE_URL = globalThis.MARKET_API_BASE_URL || '';
export const CALENDAR_API_BASE_URL = globalThis.CALENDAR_API_BASE_URL || MARKET_API_BASE_URL;
export const REALTIME_WS_URL = globalThis.MARKET_AI_REALTIME_WS_URL || '';
