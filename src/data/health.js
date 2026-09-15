import { MARKET_API_BASE_URL } from '../config.js';

const REQUEST_TIMEOUT_MS = 4000;

function baseUrl() {
  return MARKET_API_BASE_URL || '/.netlify/functions';
}

export async function checkBackendHealth() {
  if (globalThis.location?.hostname?.endsWith('.github.io') && !MARKET_API_BASE_URL) {
    return {
      ok: false,
      configured: false,
      error: 'Live backend is not configured for GitHub Pages.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const root = baseUrl().replace(/\/$/, '');
    const url = /^https?:\/\//i.test(root)
      ? new URL(`${root}/health`)
      : new URL(`${root}/health`, window.location.origin);
    const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    return response.ok && payload.ok
      ? { ok: true, configured: true, ...payload }
      : { ok: false, configured: true, error: payload.error || `Backend health check failed: ${response.status}` };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      error: error?.name === 'AbortError' ? 'Backend health check timed out.' : 'Backend is unreachable.',
    };
  } finally {
    clearTimeout(timer);
  }
}
