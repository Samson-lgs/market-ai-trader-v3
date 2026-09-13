/**
 * AI Performance Intelligence.
 * Turns completed backtest trades into evidence-based diagnostics.
 * It does not predict profits or place orders.
 */

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
function median(values) {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
function pct(n, d) { return d ? n / d : 0; }
function bucketHour(value) {
  if (value == null) return 'UNKNOWN';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'UNKNOWN';
  const h = d.getUTCHours();
  if (h < 7) return 'ASIA';
  if (h < 12) return 'LONDON';
  if (h < 16) return 'LONDON + NY';
  if (h < 21) return 'NEW YORK';
  return 'OFF-SESSION';
}
function metrics(trades) {
  const wins = trades.filter(t => Number(t.r) > 0);
  const losses = trades.filter(t => Number(t.r) < 0);
  const rs = trades.map(t => Number(t.r) || 0);
  const netR = rs.reduce((a, b) => a + b, 0);
  const grossWin = wins.reduce((a, t) => a + Number(t.r), 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + Number(t.r), 0));
  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: pct(wins.length, trades.length),
    netR,
    expectancyR: mean(rs),
    medianR: median(rs),
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    avgWinR: mean(wins.map(t => Number(t.r))),
    avgLossR: mean(losses.map(t => Number(t.r))),
  };
}
function groupBy(trades, keyFn) {
  const groups = {};
  for (const trade of trades) {
    const key = keyFn(trade) || 'UNKNOWN';
    (groups[key] ||= []).push(trade);
  }
  return Object.fromEntries(Object.entries(groups).map(([key, list]) => [key, metrics(list)]));
}
function rankGroups(groups, minTrades = 5) {
  return Object.entries(groups)
    .filter(([, m]) => m.trades >= minTrades)
    .sort((a, b) => b[1].expectancyR - a[1].expectancyR)
    .map(([key, m]) => ({ key, ...m }));
}

export function analyzePerformance(trades = [], options = {}) {
  const list = Array.isArray(trades) ? trades.filter(t => Number.isFinite(Number(t.r))) : [];
  const minTrades = Math.max(1, Number(options.minTrades || 5));
  const overall = metrics(list);
  const byGrade = groupBy(list, t => t.grade);
  const byType = groupBy(list, t => t.type);
  const bySide = groupBy(list, t => t.side);
  const bySession = groupBy(list, t => t.session || bucketHour(t.time));
  const bySymbol = groupBy(list, t => t.symbol);
  const byScoreBand = groupBy(list, t => {
    const s = Number(t.score);
    return s >= 85 ? '85-100' : s >= 75 ? '75-84' : s >= 65 ? '65-74' : '<65';
  });
  const byNewsRisk = groupBy(list, t => t.newsRisk);

  const ranked = {
    grade: rankGroups(byGrade, minTrades),
    type: rankGroups(byType, minTrades),
    session: rankGroups(bySession, minTrades),
    symbol: rankGroups(bySymbol, minTrades),
    scoreBand: rankGroups(byScoreBand, minTrades),
    newsRisk: rankGroups(byNewsRisk, minTrades),
  };

  const best = (ranked.type[0] || ranked.grade[0] || ranked.session[0] || null);
  const weakest = [...ranked.type, ...ranked.grade].sort((a, b) => a.expectancyR - b.expectancyR)[0] || null;
  const profitable = ranked.type.filter(x => x.expectancyR > 0);
  const highConfidence = ranked.scoreBand.find(x => x.key === '85-100');
  const lowConfidence = ranked.scoreBand.find(x => x.key === '65-74');

  const insights = [];
  if (!list.length) insights.push({ level: 'WAIT', text: 'No completed backtest trades are available yet.' });
  if (best) insights.push({ level: best.expectancyR > 0 ? 'POSITIVE' : 'WARNING', text: `${best.key} currently has the strongest observed expectancy at ${best.expectancyR.toFixed(3)}R across ${best.trades} trades.` });
  if (weakest && weakest.expectancyR < 0) insights.push({ level: 'WARNING', text: `${weakest.key} is currently the weakest observed segment at ${weakest.expectancyR.toFixed(3)}R expectancy.` });
  if (highConfidence && lowConfidence && highConfidence.expectancyR > lowConfidence.expectancyR) insights.push({ level: 'POSITIVE', text: 'Higher setup scores are outperforming lower-score setups in this sample.' });
  if (profitable.length === 1) insights.push({ level: 'FOCUS', text: `Only one setup type clears positive expectancy: ${profitable[0].key}.` });
  if (overall.trades >= minTrades && overall.expectancyR <= 0) insights.push({ level: 'BLOCK', text: 'The tested strategy has non-positive expectancy in this sample; do not treat the signal engine as validated.' });
  if (overall.trades < minTrades) insights.push({ level: 'WAIT', text: `Only ${overall.trades} trades are available; use at least ${minTrades} observations before trusting segment rankings.` });

  return { overall, byGrade, byType, bySide, bySession, bySymbol, byScoreBand, byNewsRisk, ranked, insights, best, weakest };
}

export function performanceSummary(result) {
  if (!result) return 'No performance analysis available.';
  const m = result.overall;
  return `${m.trades} trades · ${(m.winRate * 100).toFixed(1)}% win rate · ${m.expectancyR.toFixed(3)}R expectancy · ${Number.isFinite(m.profitFactor) ? m.profitFactor.toFixed(2) : '∞'} profit factor.`;
}
