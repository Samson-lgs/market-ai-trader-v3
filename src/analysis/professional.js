// Professional trading-context layer. It describes market conditions; it does not place orders.

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function sessionContext(date = new Date()) {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const sessions = [];
  if (utcHour >= 0 && utcHour < 8) sessions.push('ASIA');
  if (utcHour >= 7 && utcHour < 16) sessions.push('LONDON');
  if (utcHour >= 12 && utcHour < 21) sessions.push('NEW YORK');
  const overlap = sessions.length > 1;
  return { active: sessions.length ? sessions.join(' + ') : 'OFF-SESSION', overlap, utcHour };
}

export function sessionRisk(date = new Date()) {
  const { active, overlap } = sessionContext(date);
  if (active === 'OFF-SESSION') return { level: 'ELEVATED', score: 55, reason: 'Outside the primary liquid sessions.' };
  if (overlap) return { level: 'NORMAL', score: 90, reason: 'Major session overlap; liquidity is generally stronger.' };
  return { level: 'NORMAL', score: 80, reason: `${active} session is active.` };
}

export function setupQuality({ analysis, date = new Date(), newsRisk = 'UNKNOWN' }) {
  const session = sessionRisk(date);
  const execution = analysis?.execution;
  const bias = analysis?.higherTimeframeBias;
  let score = Number(execution?.score || 0);
  const reasons = [];

  if (bias === 'CONFLICT' || bias === 'RANGE') {
    score -= 20;
    reasons.push('Higher-timeframe structure is not directional.');
  }
  if (session.level === 'ELEVATED') {
    score -= 10;
    reasons.push(session.reason);
  }
  if (newsRisk === 'HIGH') {
    score -= 30;
    reasons.push('High-impact news risk is active or imminent.');
  } else if (newsRisk === 'MEDIUM') {
    score -= 12;
    reasons.push('Moderate event risk; execution should be more selective.');
  }
  if (execution?.decision === 'NO TRADE') reasons.push(execution.reason);

  const finalScore = clamp(score);
  const grade = finalScore >= 85 ? 'A' : finalScore >= 75 ? 'B' : finalScore >= 65 ? 'C' : 'D';
  const blocked = execution?.decision === 'NO TRADE' || finalScore < 65 || bias === 'CONFLICT' || newsRisk === 'HIGH';

  return {
    score: finalScore,
    grade,
    blocked,
    verdict: blocked ? 'NO TRADE' : analysis.decision,
    session,
    reasons
  };
}

export function riskGate({ analysis, setup, spreadOk = true }) {
  const failures = [];
  if (!spreadOk) failures.push('Spread/liquidity condition failed.');
  if (!setup || setup.blocked) failures.push(...(setup?.reasons || ['Setup quality below threshold.']));
  if (analysis?.execution?.decision === 'NO TRADE') failures.push(analysis.execution.reason);
  return { pass: failures.length === 0, failures };
}
