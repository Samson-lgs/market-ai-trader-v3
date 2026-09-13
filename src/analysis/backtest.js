/**
 * Historical walk-forward backtesting.
 * Uses only candles available at the decision timestamp and evaluates
 * future candles strictly after entry. No order execution is performed.
 */

function finite(value) { return Number.isFinite(Number(value)); }
function timestamp(candle, fallback) {
  const raw = candle?.datetime ?? candle?.time ?? candle?.timestamp;
  const value = raw == null ? NaN : Date.parse(raw);
  return Number.isFinite(value) ? value : fallback;
}

function prefixThrough(candles, time) {
  let end = 0;
  while (end < candles.length && timestamp(candles[end], end) <= time) end++;
  return candles.slice(0, end);
}

function outcomeForTrade(candles, startIndex, trade, maxHoldBars) {
  const end = Math.min(candles.length - 1, startIndex + maxHoldBars);
  const risk = Math.abs(trade.entry - trade.invalidation);
  if (!(risk > 0)) return { r: 0, result: 'INVALID' };

  for (let i = startIndex + 1; i <= end; i++) {
    const bar = candles[i];
    const stopHit = trade.side === 'CALL' ? bar.low <= trade.invalidation : bar.high >= trade.invalidation;
    const targetHit = trade.side === 'CALL' ? bar.high >= trade.target : bar.low <= trade.target;

    // Conservative assumption when both levels are touched in one candle.
    if (stopHit) return { r: -1, result: 'LOSS', exitIndex: i, exit: trade.invalidation };
    if (targetHit) return { r: Math.abs(trade.target - trade.entry) / risk, result: 'WIN', exitIndex: i, exit: trade.target };
  }

  const last = candles[end];
  const exit = Number(last.close);
  const r = trade.side === 'CALL' ? (exit - trade.entry) / risk : (trade.entry - exit) / risk;
  return { r, result: r > 0 ? 'TIME_EXIT_WIN' : r < 0 ? 'TIME_EXIT_LOSS' : 'BREAKEVEN', exitIndex: end, exit };
}

function metrics(trades) {
  const count = trades.length;
  const wins = trades.filter(t => t.r > 0);
  const losses = trades.filter(t => t.r < 0);
  const netR = trades.reduce((sum, t) => sum + t.r, 0);
  const grossWin = wins.reduce((sum, t) => sum + t.r, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.r, 0));
  let equity = 0, peak = 0, maxDrawdownR = 0, losingStreak = 0, maxLosingStreak = 0;
  for (const trade of trades) {
    equity += trade.r;
    peak = Math.max(peak, equity);
    maxDrawdownR = Math.max(maxDrawdownR, peak - equity);
    losingStreak = trade.r < 0 ? losingStreak + 1 : 0;
    maxLosingStreak = Math.max(maxLosingStreak, losingStreak);
  }
  const expectancyR = count ? netR / count : 0;
  return {
    trades: count,
    wins: wins.length,
    losses: losses.length,
    winRate: count ? wins.length / count : 0,
    netR,
    avgR: expectancyR,
    expectancyR,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    maxDrawdownR,
    maxLosingStreak
  };
}

function groupedMetrics(trades, key) {
  const groups = {};
  for (const trade of trades) {
    const value = trade[key] || 'UNKNOWN';
    (groups[value] ||= []).push(trade);
  }
  return Object.fromEntries(Object.entries(groups).map(([name, list]) => [name, metrics(list)]));
}

/**
 * Backtest the current setup engine against synchronized multi-timeframe data.
 * `candlesByTimeframe` should contain 1H, 30M, 15M, 5M and 1M chronological candles.
 */
export async function backtestMultiTimeframe({
  candlesByTimeframe,
  analyze,
  detect,
  newsRisk = 'UNKNOWN',
  sessionLevel = 'NORMAL',
  startIndex = 60,
  maxHoldBars = 24,
  cooldownBars = 3,
  slippageR = 0,
  feeR = 0
} = {}) {
  const execution = candlesByTimeframe?.['5M'];
  if (!Array.isArray(execution) || execution.length < startIndex + 5) {
    return { status: 'INSUFFICIENT_DATA', trades: [], metrics: metrics([]), byGrade: {}, byType: {} };
  }
  if (typeof analyze !== 'function' || typeof detect !== 'function') {
    throw new Error('Backtest requires analyze and detect functions.');
  }

  const trades = [];
  let cooldownUntil = -1;

  for (let i = startIndex; i < execution.length - maxHoldBars; i++) {
    if (i <= cooldownUntil) continue;
    const decisionTime = timestamp(execution[i], i);
    const frames = {};
    for (const tf of ['1H', '30M', '15M', '5M', '1M']) {
      frames[tf] = prefixThrough(candlesByTimeframe?.[tf] || [], decisionTime);
    }
    if (frames['1H'].length < 40 || frames['30M'].length < 40 || frames['15M'].length < 40 || frames['5M'].length < 40 || frames['1M'].length < 40) continue;

    const analysis = analyze(frames);
    const map = undefined;
    const ranked = detect({ candles: frames['5M'], analysis, map, newsRisk, sessionLevel });
    const setup = ranked?.strongest;
    if (!setup || ranked.decision === 'NO TRADE' || setup.blocked || setup.score < 65) continue;

    const target = Number(setup.targets?.[0]);
    if (!finite(target) || !finite(setup.entry) || !finite(setup.invalidation)) continue;

    const result = outcomeForTrade(execution, i, { side: setup.side, entry: setup.entry, invalidation: setup.invalidation, target }, maxHoldBars);
    if (result.result === 'INVALID') continue;

    const netR = result.r - Number(slippageR || 0) - Number(feeR || 0);
    trades.push({
      index: i,
      time: execution[i].datetime ?? execution[i].time ?? null,
      side: setup.side,
      type: setup.type,
      grade: setup.grade,
      score: setup.score,
      rr: setup.rr,
      entry: setup.entry,
      invalidation: setup.invalidation,
      target,
      r: netR,
      result: netR > 0 ? result.result : netR < 0 ? 'LOSS' : 'BREAKEVEN',
      exit: result.exit,
      exitIndex: result.exitIndex
    });
    cooldownUntil = result.exitIndex + cooldownBars;
  }

  return {
    status: 'READY',
    settings: { startIndex, maxHoldBars, cooldownBars, slippageR, feeR },
    trades,
    metrics: metrics(trades),
    byGrade: groupedMetrics(trades, 'grade'),
    byType: groupedMetrics(trades, 'type')
  };
}

export { metrics };
