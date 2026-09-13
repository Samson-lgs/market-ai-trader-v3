// Event-risk adapter. Keep provider integration separate from the decision engine.
// Until a calendar/news provider is connected, the engine stays conservative.

export function normalizeNewsRisk(input = {}) {
  const level = String(input.level || 'UNKNOWN').toUpperCase();
  if (['LOW', 'MEDIUM', 'HIGH'].includes(level)) return { level, events: input.events || [] };
  return { level: 'UNKNOWN', events: input.events || [] };
}

export function eventRiskGate(newsRisk) {
  const risk = normalizeNewsRisk(newsRisk);
  if (risk.level === 'HIGH') return { blocked: true, reason: 'High-impact event risk: wait until volatility normalizes.' };
  if (risk.level === 'UNKNOWN') return { blocked: false, warning: 'Economic-calendar feed not connected; news risk cannot be confirmed.' };
  return { blocked: false, warning: risk.level === 'MEDIUM' ? 'Moderate event risk; require stronger confirmation.' : null };
}
