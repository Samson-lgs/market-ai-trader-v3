// Public runtime configuration only. Never place provider API keys here.
// A deployed frontend may set globals before app.js; V4 also accepts localStorage values so
// a user can configure a backend endpoint without rebuilding the static site.
const storedMarket=typeof localStorage!=='undefined'?localStorage.getItem('MARKET_API_BASE_URL')||'':'';
const storedCalendar=typeof localStorage!=='undefined'?localStorage.getItem('CALENDAR_API_BASE_URL')||'':'';
const storedRealtime=typeof localStorage!=='undefined'?localStorage.getItem('MARKET_AI_REALTIME_WS_URL')||'':'';
export const MARKET_API_BASE_URL=globalThis.MARKET_API_BASE_URL||storedMarket||'';
export const CALENDAR_API_BASE_URL=globalThis.CALENDAR_API_BASE_URL||storedCalendar||MARKET_API_BASE_URL;
export const REALTIME_WS_URL=globalThis.MARKET_AI_REALTIME_WS_URL||storedRealtime||'';
