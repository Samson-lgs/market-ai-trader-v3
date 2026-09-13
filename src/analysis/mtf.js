/**
 * Multi-timeframe analysis.
 *
 * The engine deliberately separates context from execution:
 * higher timeframes establish directional bias, while lower
 * timeframes are only allowed to trigger a setup when they agree.
 */
import { atr, rsi, ema, macd } from './indicators.js';
import { marketStructure, nearestLevels } from './structure.js';
import { liquiditySweep, displacement } from './liquidity.js';
import { scoreCandidate } from './decision.js';

const ORDER = ['1H', '30M', '15M', '5M', '1M'];

function closes(candles) {
  return candles.map(c => Number(c.close)).filter(Number.isFinite);
}

function frameAnalysis(candles) {
  if (!Array.isArray(candles) || candles.length < 40) {
    return { status: 'INSUFFICIENT_DATA', decision: 'NO TRADE' };
  }

  const close = closes(candles);
  const current = close.at(-1);
  const fast = ema(close, 20).at(-1);
  const slow = ema(close, 50).at(-1);
  const rsiValue = rsi(close, 14).at(-1);
  const macdValue = macd(close).at(-1);
  const atrValue = atr(candles, 14).at(-1);
  const structure = marketStructure(candles);
  const levels = nearestLevels(candles);
  const sweep = liquiditySweep(candles);
  const impulse = displacement(candles, atrValue);

  const momentum = fast > slow && rsiValue >= 50 ? 'BULLISH'
    : fast < slow && rsiValue <= 50 ? 'BEARISH' : 'NEUTRAL';
  const macdBias = macdValue && macdValue.histogram > 0 ? 'BULLISH'
    : macdValue && macdValue.histogram < 0 ? 'BEARISH' : 'NEUTRAL';

  return {
    status: 'READY',
    price: current,
    structure: structure.label,
    momentum,
    macd: macdBias,
    rsi: rsiValue,
    atr: atrValue,
    sweep,
    displacement: impulse,
    support: levels.support,
    resistance: levels.resistance,
    decision: structure.label === 'BULLISH' && momentum === 'BULLISH' ? 'CALL'
      : structure.label === 'BEARISH' && momentum === 'BEARISH' ? 'PUT'
      : 'NO TRADE'
  };
}

function higherTimeframeBias(frames) {
  const higher = [frames['1H'], frames['30M'], frames['15M']]
    .filter(x => x && x.status === 'READY');
  if (higher.length < 2) return 'CONFLICT';
  const bullish = higher.filter(x => x.structure === 'BULLISH').length;
  const bearish = higher.filter(x => x.structure === 'BEARISH').length;
  if (bullish >= 2 && bullish > bearish) return 'BULLISH';
  if (bearish >= 2 && bearish > bullish) return 'BEARISH';
  return 'CONFLICT';
}

function executionCandidate(frames, bias) {
  const execution = frames['5M'];
  const trigger = frames['1M'];
  if (!execution || !trigger || execution.status !== 'READY' || trigger.status !== 'READY') {
    return { decision: 'NO TRADE', reason: 'Insufficient lower-timeframe confirmation.' };
  }

  const aligned = bias === 'BULLISH'
    ? execution.momentum === 'BULLISH' && trigger.momentum === 'BULLISH'
    : bias === 'BEARISH'
      ? execution.momentum === 'BEARISH' && trigger.momentum === 'BEARISH'
      : false;

  if (!aligned) return { decision: 'NO TRADE', reason: 'Lower timeframes conflict with higher-timeframe bias.' };

  const direction = bias === 'BULLISH' ? 'CALL' : 'PUT';
  const risk = Number.isFinite(execution.atr) && execution.atr > 0 ? 'PASS' : 'BLOCK';
  const score = scoreCandidate({
    structure: bias === execution.structure ? bias : 'NEUTRAL',
    momentum: direction,
    higherTimeframe: bias,
    liquidity: trigger.sweep ? direction : 'NEUTRAL',
    volatility: execution.displacement ? direction : 'NEUTRAL',
    risk
  });

  return {
    decision: score.decision,
    score: score.score,
    edge: score.edge,
    reason: score.reason,
    entry: trigger.price,
    stopDistance: execution.atr * 1.5,
    targetDistance: execution.atr * 3,
    riskReward: 2
  };
}

/**
 * Analyze candles keyed by timeframe: { '1H': [...], '30M': [...], ... }.
 */
export function analyzeMultiTimeframe(candlesByTimeframe) {
  const frames = {};
  for (const tf of ORDER) frames[tf] = frameAnalysis(candlesByTimeframe?.[tf]);
  const bias = higherTimeframeBias(frames);
  const candidate = executionCandidate(frames, bias);
  return {
    timeframes: ORDER,
    frames,
    higherTimeframeBias: bias,
    execution: candidate,
    decision: candidate.decision,
    generatedAt: new Date().toISOString()
  };
}
