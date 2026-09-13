const KEY = 'market-ai-trader-v3:signals:v1';
const MAX = 250;

function read() {
  try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}

export function recordSignal(signal, context = {}) {
  if (!signal) return null;
  const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, timestamp: new Date().toISOString(), symbol: context.symbol || null, lifecycle: context.lifecycle || null, side: signal.side || null, score: signal.score ?? null, grade: signal.grade || null, type: signal.type || null, rr: signal.rr ?? null, entry: signal.entry ?? null, invalidation: signal.invalidation ?? null, newsRisk: context.newsRisk || 'UNKNOWN', session: context.session || 'UNKNOWN' };
  const next = [item, ...read()].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage may be disabled */ }
  return item;
}

export function getSignalHistory(limit = MAX) { return read().slice(0, Math.max(1, Math.min(MAX, limit))); }
export function clearSignalHistory() { try { localStorage.removeItem(KEY); } catch { /* noop */ } }
