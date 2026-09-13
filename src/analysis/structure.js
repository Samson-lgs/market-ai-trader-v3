// Market-structure primitives. Intentionally conservative: a candidate is not a trade by itself.

export function pivots(candles, left = 2, right = 2) {
  const highs = [], lows = [];
  for (let i = left; i < candles.length - right; i++) {
    const h = candles[i].high, l = candles[i].low;
    const high = candles.slice(i-left, i+right+1).every((c, j) => j === left || c.high <= h);
    const low = candles.slice(i-left, i+right+1).every((c, j) => j === left || c.low >= l);
    if (high) highs.push({ index: i, price: h });
    if (low) lows.push({ index: i, price: l });
  }
  return { highs, lows };
}

export function marketStructure(candles) {
  const { highs, lows } = pivots(candles);
  const recentHighs = highs.slice(-3);
  const recentLows = lows.slice(-3);
  let bias = 'RANGE';
  if (recentHighs.length >= 2 && recentLows.length >= 2) {
    const hh = recentHighs.at(-1).price > recentHighs.at(-2).price;
    const hl = recentLows.at(-1).price > recentLows.at(-2).price;
    const lh = recentHighs.at(-1).price < recentHighs.at(-2).price;
    const ll = recentLows.at(-1).price < recentLows.at(-2).price;
    if (hh && hl) bias = 'BULLISH';
    else if (lh && ll) bias = 'BEARISH';
  }
  return { bias, highs: recentHighs, lows: recentLows };
}

export function nearestLevels(candles, lookback = 80) {
  const slice = candles.slice(-lookback);
  if (!slice.length) return { support: null, resistance: null };
  return {
    support: Math.min(...slice.map(c => c.low)),
    resistance: Math.max(...slice.map(c => c.high))
  };
}
