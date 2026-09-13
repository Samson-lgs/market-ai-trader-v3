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

function validCandles(candles) {
  return Array.isArray(candles) && candles.length >= 40;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function zoneForSide(map, side, price) {
  const zones = side === 'CALL' ? map?.zones?.demand : map?.zones?.supply;
  if (!Array.isArray(zones) || !Number.isFinite(price)) return null;
  return zones
    .filter(z => Number.isFinite(z.low) && Number.isFinite(z.high))
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
  const bullishSweep = Boolean(sweep.bullishSweep);
  const bearishSweep = Boolean(sweep.bearishSweep);
  const hasSweep = side === 'CALL' ? bullishSweep : bearishSweep;
  const hasDisplacement = impulse === (side === 'CALL' ? 'BULLISH' : 'BEARISH');
  const structureEvent = mapData.structure?.bos || mapData.structure?.choch;
  const eventMatches = structureEvent && structureEvent.type.startsWith(side === 'CALL' ? 'BULLISH' : 'BEARISH');
  const zone = zoneForSide(mapData, side, price);

  // Prefer a broken-structure level as invalidation; otherwise use ATR risk.
  const structuralLevel = Number(structureEvent?.level);
  const atrStop = side === 'CALL' ? price - atrValue * 1.5 : price + atrValue * 1.5;
  const invalidation = Number.isFinite(structuralLevel)
    ? (side === 'CALL' ? Math.min(atrStop, structuralLevel - atrValue * 0.15) : Math.max(atrStop, structuralLevel + atrValue * 0.15))
    : atrStop;
  const target = nearestTarget(mapData, side, price, invalidation);
  const risk = Math.abs(price - invalidation);
  const reward = Math.abs(target - price);
  const rr = risk > 0 ? reward / risk : 0;

  const reasons = [];
  let score = 0;
  if (bias === (side === 'CALL' ? 'BULLISH' : 'BEARISH')) { score += 20; reasons.push('Higher-timeframe bias aligned.'); }
  if (hasSweep) { score += 15; reasons.push(`${side === 'CALL' ? 'Sell-side' : 'Buy-side'} liquidity sweep detected.`); }
  if (hasDisplacement) { score += 15; reasons.push('Displacement confirms directional intent.'); }
  if (eventMatches) { score += 15; reasons.push(`${structureEvent.type.replace('_', ' ')} confirms structure.`); }
  if (zone) { score += 10; reasons.push(`${side === 'CALL' ? 'Demand' : 'Supply'} zone is nearby.`); }
  if (rr >= 2) { score += 10; reasons.push(`Projected risk/reward is ${rr.toFixed(1)}R.`); }
  else if (rr >= MIN_RR) { score += 7; reasons.push(`Projected risk/reward is ${rr.toFixed(1)}R.`); }
  else reasons.push('Projected risk/reward is below the minimum threshold.');

  if (sessionLevel === 'ELEVATED') { score -= 10; reasons.push('Session risk is elevated.'); }
  if (newsRisk === 'MEDIUM') { score -= 8; reasons.push('Medium event risk reduces setup quality.'); }
  if (newsRisk === 'HIGH') { score -= 30; reasons.push('High event risk blocks the setup.'); }
  if (newsRisk === 'UNKNOWN') reasons.push('News status is unknown; verify the economic calendar.');

  const hardBlock = !hasSweep || !eventMatches || !hasDisplacement || rr < MIN_RR || newsRisk === 'HIGH';
  const finalScore = clamp(Math.round(score));
  const grade = hardBlock || finalScore < 65 ? 'D'
    : finalScore >= 85 ? 'A' : finalScore >= 75 ? 'B' : 'C';

  return {
    side,
    type: hasSweep && eventMatches ? 'LIQUIDITY_REVERSAL' : eventMatches ? 'BOS_RETEST' : 'SUPPLY_DEMAND',
    trigger: hasSweep && hasDisplacement && eventMatches ? 'CONFIRMED' : 'WAITING_FOR_CONFIRMATION',
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

/**
 * Detect and rank CALL/PUT setup candidates from execution candles.
 */
export function detectSetups({ candles, analysis, map, newsRisk = 'UNKNOWN', sessionLevel = 'NORMAL' } = {}) {
  const execution = analysis?.frames?.['5M'];
  const bias = analysis?.higherTimeframeBias;
  if (!validCandles(candles) || !execution || bias === 'CONFLICT' || bias === 'RANGE') {
    return { candidates: [], strongest: null, decision: 'NO TRADE' };
  }

  const candidates = ['CALL', 'PUT']
    .map(side => candidateFor(side, candles, execution, bias, map, newsRisk, sessionLevel))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.rr - a.rr);

  const strongest = candidates.find(c => !c.blocked && c.score >= 65) || candidates[0] || null;
  return {
    candidates,
    strongest,
    decision: strongest && !strongest.blocked && strongest.score >= 65 ? strongest.side : 'NO TRADE'
  };
}
