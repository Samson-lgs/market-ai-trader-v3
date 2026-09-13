/**
 * Real-time setup lifecycle.
 * State machine: WATCH -> FORMING -> CONFIRMED -> INVALIDATED / EXPIRED.
 * Analytical only; never executes trades.
 */
const STATES = ['WATCH','FORMING','CONFIRMED','INVALIDATED','EXPIRED'];

export function setupLifecycle(previous, setup, now = Date.now()) {
  const current = previous || { state: 'WATCH', since: now, confirmations: 0 };
  const candidate = setup || null;
  if (!candidate) {
    return current.state === 'CONFIRMED'
      ? { ...current, state: 'EXPIRED', updatedAt: now }
      : { ...current, state: 'WATCH', updatedAt: now };
  }

  const invalid = Boolean(candidate.blocked) || !Number.isFinite(candidate.entry) || !Number.isFinite(candidate.invalidation) || (Number.isFinite(candidate.rr) && candidate.rr < 1.5);
  const confirmed = candidate.trigger === 'CONFIRMED' && !candidate.blocked && candidate.score >= 65 && candidate.rr >= 1.5;
  const forming = candidate.trigger === 'WAITING_FOR_CONFIRMATION' || candidate.score >= 45;
  let state = invalid ? 'INVALIDATED' : confirmed ? 'CONFIRMED' : forming ? 'FORMING' : 'WATCH';
  if (current.state === 'CONFIRMED' && !invalid) state = confirmed ? 'CONFIRMED' : 'EXPIRED';
  const confirmations = state === 'CONFIRMED' ? current.confirmations + (current.state === 'CONFIRMED' ? 0 : 1) : current.confirmations;
  return { state: STATES.includes(state) ? state : 'WATCH', since: current.state === state ? current.since : now, updatedAt: now, confirmations, side: candidate.side || null, score: candidate.score ?? null, grade: candidate.grade || null, entry: candidate.entry ?? null, invalidation: candidate.invalidation ?? null, rr: candidate.rr ?? null };
}

export function lifecycleLabel(state) {
  return ({ WATCH: 'WATCH', FORMING: 'FORMING', CONFIRMED: 'CONFIRMED', INVALIDATED: 'INVALIDATED', EXPIRED: 'EXPIRED' })[state] || 'WATCH';
}
