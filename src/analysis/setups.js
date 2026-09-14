/**
 * Setup detection/ranking layer.
 *
 * Produces analytical candidates only. It never places orders and does not
 * claim that a setup guarantees an outcome.
 */
import { atr } from './indicators.js';
import { liquiditySweep, displacement } from './liquidity.js';
import { liquidityMap } from './smartMoney.js';

const MIN_RR = 1.5;
const MIN_CALL_SCORE = 55;

function validCandles(candles) {
  return Array.isArray(candles) && candles.length >= 40;
}
function clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }
function zoneForSide(map, side, price) {
  const zones = side === 'CALL' ? map?.zones?.demand : map?.zones?.supply;
  if (!Array.isArray(zones) || !Number.isFinite(price)) return null;
  return zones.filter(z => Number.isFinite(z.low) && Number.isFinite(z.high))
    .map(z => ({ ...z, distance: Math.min(Math.abs(price - z.low), Math.abs(price - z.high)) }))
    .sort((a, b) => a.distance - b.distance)[0] || null;
}
function nearestTarget(map, side, entry, invalidation) {
  const pools = side === 'CALL' ? map?.pools?.buySide : map?.pools?.sellSide;
  const candidates = (pools || []).map(p => Number(p.price)).filter(Number.isFinite)
    .filter(price => side === 'CALL' ? price > entry : price < entry)
    .sort((a, b) => side === 'CALL' ? a - b : b - a);
  const fallbackRisk = Math.abs(entry - invalidation);
  return candidates[0] ?? (side === 'CALL' ? entry + fallbackRisk * 2 : entry - fallbackRisk * 2);
}
function candidateFor(side, candles, frame, bias, map, newsRisk = 'UNKNOWN', sessionLevel = 'NORMAL') {
  if (!validCandles(candles) || !frame || frame.status !== 'READY') return null;
  const price = Number(frame.price);
  const atrValue = Number(frame.atr) || atr(candles, 14).at(-1);
  if (!Number.isFinite(price) || !Number.isFinite(atrValue) || atrValue <= 0) return null;
  if (bias !== (side === 'CALL' ? 'BULLISH' : 'BEARISH')) return null;

  const sweep = liquiditySweep(candles);
  const impulse = displacement(candles, atrValue);
  const mapData = map || liquidityMap(candles, atrValue);
  const hasSweep = side === 'CALL' ? Boolean(sweep.bullishSweep) : Boolean(sweep.bearishSweep);
  const hasDisplacement = impulse === (side === 'CALL' ? 'BULLISH' : 'BEARISH');
  const structureEvent = mapData.structure?.bos || mapData.structure?.choch;
  const expectedStructureType = side === 'CALL' ? ['BULLISH_BOS', 'BULLISH_CHOCH'] : ['BEARISH_BOS', 'BEARISH_CHOCH'];
  const eventMatches = Boolean(structureEvent && expectedStructureType.includes(structureEvent.type));
  const zone = zoneForSide(mapData, side, price);
  const structuralLevel = Number(structureEvent?.level);
  const atrStop = side === 'CALL' ? price - atrValue * 1.5 : price + atrValue * 1.5;
  const invalidation = Number.isFinite(structuralLevel)
    ? (side === 'CALL' ? Math.min(atrStop, structuralLevel - atrValue * 0.15) : Math.max(atrStop, structuralLevel + atrValue * 0.15))
    : atrStop;
  const target = nearestTarget(mapData, side, price, invalidation);
  const risk = Math.abs(price - invalidation), reward = Math.abs(target - price), rr = risk > 0 ? reward / risk : 0;

  const reasons = [];
  let score = 20;
  reasons.push('Higher-timeframe bias aligned.');
  if (hasSweep) { score += 15; reasons.push(`${side === 'CALL' ? 'Sell-side' : 'Buy-side'} liquidity sweep detected.`); }
  else reasons.push('No fresh liquidity sweep; using structure/momentum confirmation.');
  if (hasDisplacement) { score += 15; reasons.push('Displacement confirms directional intent.'); }
  if (eventMatches) { score += 15; reasons.push(`${structureEvent.type.replace('_', ' ')} confirms structure.`); }
  if (zone) { score += 10; reasons.push(`${side === 'CALL' ? 'Demand' : 'Supply'} zone is nearby.`); }
  if (rr >= 2) { score += 10; reasons.push(`Projected risk/reward is ${rr.toFixed(1)}R.`); }
  else if (rr >= MIN_RR) { score += 7; reasons.push(`Projected risk/reward is ${rr.toFixed(1)}R.`); }
  else reasons.push('Projected risk/reward is below the preferred threshold.');
  if (sessionLevel === 'ELEVATED') { score -= 6; reasons.push('Session risk is elevated.'); }
  if (newsRisk === 'MEDIUM') { score -= 6; reasons.push('Medium event risk reduces setup quality.'); }
  if (newsRisk === 'HIGH') { score -= 30; reasons.push('High event risk blocks the setup.'); }
  if (newsRisk === 'UNKNOWN') reasons.push('News status is unknown; verify the economic calendar.');

  const hardBlock = newsRisk === 'HIGH' || rr < 1.0;
  const finalScore = clamp(Math.round(score));
  const grade = hardBlock || finalScore < 65 ? 'D' : finalScore >= 85 ? 'A' : finalScore >= 75 ? 'B' : 'C';
  return {
    side,
    type: hasSweep && eventMatches ? 'LIQUIDITY_REVERSAL' : eventMatches ? 'BOS_RETEST' : 'TREND_CONTINUATION',
    trigger: hasSweep && hasDisplacement && eventMatches ? 'CONFIRMED' : 'DIRECTIONAL_BIAS',
    entryZone: zone ? { low: zone.low, high: zone.high } : { low: price - atrValue * 0.15, high: price + atrValue * 0.15 },
    entry: price,
    invalidation,
    targets: [target, side === 'CALL' ? target + risk : target - risk],
    rr,
    score: finalScore,
    grade,
    blocked: hardBlock,
    reasons
  };
}

export function detectSetups({ candles, analysis, map, newsRisk = 'UNKNOWN', sessionLevel = 'NORMAL' } = {}) {
  const execution = analysis?.frames?.['5M'];
  const bias = analysis?.higherTimeframeBias;
  if (!validCandles(candles) || !execution || !['BULLISH', 'BEARISH'].includes(bias)) {
    return { candidates: [], strongest: null, decision: 'NO TRADE' };
  }
  const candidates = ['CALL', 'PUT'].map(side => candidateFor(side, candles, execution, bias, map, newsRisk, sessionLevel)).filter(Boolean)
    .sort((a, b) => b.score - a.score || b.rr - a.rr);
  const strongest = candidates[0] || null;
  const decision = strongest && !strongest.blocked && strongest.score >= MIN_CALL_SCORE ? strongest.side : 'NO TRADE';
  return { candidates, strongest, decision };
}
