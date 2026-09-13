// Liquidity and price-action context. This layer identifies areas to investigate,
// not automatic entries.

export function equalHighLowZones(candles, tolerance = 0.0005) {
  const zones = [];
  for (let i = 1; i < candles.length; i++) {
    const a = candles[i - 1], b = candles[i];
    if (Math.abs(a.high - b.high) / Math.max(Math.abs(a.high), 1) <= tolerance) zones.push({ type: 'EQUAL_HIGH', price: (a.high + b.high) / 2 });
    if (Math.abs(a.low - b.low) / Math.max(Math.abs(a.low), 1) <= tolerance) zones.push({ type: 'EQUAL_LOW', price: (a.low + b.low) / 2 });
  }
  return zones.slice(-10);
}

export function liquiditySweep(candles, lookback = 20) {
  if (candles.length < lookback + 2) return { bullishSweep: false, bearishSweep: false };
  const current = candles.at(-1);
  const prior = candles.slice(-(lookback + 1), -1);
  const priorHigh = Math.max(...prior.map(c => c.high));
  const priorLow = Math.min(...prior.map(c => c.low));
  return {
    bearishSweep: current.high > priorHigh && current.close < priorHigh,
    bullishSweep: current.low < priorLow && current.close > priorLow
  };
}

export function displacement(candles, atrValue) {
  const c = candles.at(-1);
  if (!c || !atrValue) return 'NONE';
  const body = Math.abs(c.close - c.open);
  if (body >= atrValue * 1.2 && c.close > c.open) return 'BULLISH';
  if (body >= atrValue * 1.2 && c.close < c.open) return 'BEARISH';
  return 'NONE';
}
