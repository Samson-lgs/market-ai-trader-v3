// Public runtime configuration only. Never place provider API keys here.
// Priority: explicit global -> <meta name="market-api"> -> ?api= URL parameter -> localStorage -> same-origin Netlify functions.
// A bare Netlify site URL is normalized automatically to /.netlify/functions.
function normalizeApiBase(value) {
  const raw = String(value || '').trim().replace(/\/$/, '');
  if (!raw) return '';
  try {
    const url = new URL(raw, globalThis.location?.origin);
    if (/\.netlify\.app$/i.test(url.hostname) && !url.pathname.includes('/.netlify/functions')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/.netlify/functions`;
    }
    return url.href.replace(/\/$/, '');
  } catch (_) {
    return raw;
  }
}

function configuredApiBase() {
  const globalValue = globalThis.MARKET_API_BASE_URL;
  if (globalValue) return normalizeApiBase(globalValue);

  try {
    const metaValue = document.querySelector('meta[name="market-api"]')?.content;
    if (metaValue) return normalizeApiBase(metaValue);

    const queryValue = new URLSearchParams(globalThis.location?.search || '').get('api');
    if (queryValue) {
      const normalized = normalizeApiBase(queryValue);
      localStorage.setItem('market-ai-api-base-url', normalized);
      return normalized;
    }

    const stored = localStorage.getItem('market-ai-api-base-url');
    if (stored) return normalizeApiBase(stored);
  } catch (_) {
    // Runtime config must never prevent the dashboard from loading.
  }

  return '';
}

export const MARKET_API_BASE_URL = configuredApiBase();
export const CALENDAR_API_BASE_URL = globalThis.CALENDAR_API_BASE_URL
  ? normalizeApiBase(globalThis.CALENDAR_API_BASE_URL)
  : MARKET_API_BASE_URL;
export const REALTIME_WS_URL = globalThis.MARKET_AI_REALTIME_WS_URL || '';
