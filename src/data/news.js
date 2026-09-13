const CACHE_MS = 60_000;
const cache = new Map();

function currenciesForSymbol(symbol = '') {
  const parts = String(symbol).toUpperCase().split('/');
  if (parts.length === 2) return parts;
  return [];
}

export async function loadNewsRisk(symbol) {
  const key = String(symbol || '').toUpperCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_MS) return cached.data;

  const currencies = currenciesForSymbol(symbol);
  const params = new URLSearchParams({ symbol: key, currencies: currencies.join(','), horizonMinutes: '180' });
  const response = await fetch(`/.netlify/functions/calendar?${params}`);
  if (!response.ok) throw new Error('Economic calendar unavailable.');
  const data = await response.json();
  const result = {
    level: ['LOW', 'MEDIUM', 'HIGH'].includes(data.level) ? data.level : 'UNKNOWN',
    events: Array.isArray(data.events) ? data.events : [],
    fetchedAt: data.fetchedAt || new Date().toISOString()
  };
  cache.set(key, { timestamp: Date.now(), data: result });
  return result;
}

export function clearNewsCache() { cache.clear(); }
