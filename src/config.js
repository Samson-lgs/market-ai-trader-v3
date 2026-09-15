// Public runtime configuration only. Never place provider API keys here.
// Priority: explicit global -> <meta name="market-api"> -> ?api= URL parameter -> localStorage -> same-origin Netlify functions.
function configuredApiBase() {
  const globalValue = globalThis.MARKET_API_BASE_URL;
  if (globalValue) return String(globalValue).trim();

  try {
    const metaValue = document.querySelector('meta[name="market-api"]')?.content;
    if (metaValue) return metaValue.trim();

    const queryValue = new URLSearchParams(globalThis.location?.search || '').get('api');
    if (queryValue) return queryValue.trim();

    const stored = localStorage.getItem('market-ai-api-base-url');
    if (stored) return stored.trim();
  } catch (_) {
    // Runtime config must never prevent the dashboard from loading.
  }

  return '';
}

export const MARKET_API_BASE_URL = configuredApiBase();
export const CALENDAR_API_BASE_URL = globalThis.CALENDAR_API_BASE_URL || MARKET_API_BASE_URL;
export const REALTIME_WS_URL = globalThis.MARKET_AI_REALTIME_WS_URL || '';
