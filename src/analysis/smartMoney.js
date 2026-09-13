// Smart-money style structure model: BOS/CHOCH, liquidity pools and supply/demand zones.
// These are analytical labels, not proof of institutional activity.

function lastTwo(list) { return list.slice(-2); }

export function swingPoints(candles, left = 2, right = 2) {
  const highs = [], lows = [];
  for (let i = left; i < candles.length - right; i++) {
    const h = candles[i].high, l = candles[i].low;
    if (candles.slice(i - left, i + right + 1).every(c => h >= c.high)) highs.push({ index: i, price: h });
    if (candles.slice(i - left, i + right + 1).every(c => l <= c.low)) lows.push({ index: i, price: l });
  }
  return { highs, lows };
}

export function structureEvents(candles) {
  if (!candles?.length) return { bos: null, choch: null, direction: 'RANGE' };
  const { highs, lows } = swingPoints(candles);
  const last = candles[candles.length - 1];
  const recentHighs = lastTwo(highs), recentLows = lastTwo(lows);
  const prevHigh = recentHighs.at(-1)?.price, prevLow = recentLows.at(-1)?.price;
  const olderHigh = recentHighs.at(-2)?.price, olderLow = recentLows.at(-2)?.price;
  const higherHigh = prevHigh > olderHigh, higherLow = prevLow > olderLow;
  const lowerHigh = prevHigh < olderHigh, lowerLow = prevLow < olderLow;
  const trend = higherHigh && higherLow ? 'BULLISH' : lowerHigh && lowerLow ? 'BEARISH' : 'RANGE';
  const bos = prevHigh && last.close > prevHigh ? { type: 'BULLISH_BOS', level: prevHigh } : prevLow && last.close < prevLow ? { type: 'BEARISH_BOS', level: prevLow } : null;
  const choch = trend === 'BEARISH' && prevHigh && last.close > prevHigh ? { type: 'BULLISH_CHOCH', level: prevHigh } : trend === 'BULLISH' && prevLow && last.close < prevLow ? { type: 'BEARISH_CHOCH', level: prevLow } : null;
  return { bos, choch, direction: trend, swings: { highs, lows } };
}

export function liquidityPools(candles, tolerance = 0.0005) {
  const { highs, lows } = swingPoints(candles);
  const cluster = (points, side) => {
    const pools = [];
    points.forEach(p => {
      const existing = pools.find(x => Math.abs(x.price - p.price) / Math.max(Math.abs(p.price), 1) <= tolerance);
      if (existing) { existing.touches++; existing.indices.push(p.index); existing.price = (existing.price + p.price) / 2; }
      else pools.push({ side, price: p.price, touches: 1, indices: [p.index] });
    });
    return pools.filter(x => x.touches >= 2).sort((a, b) => b.touches - a.touches);
  };
  return { buySide: cluster(highs, 'BUY_SIDE_LIQUIDITY'), sellSide: cluster(lows, 'SELL_SIDE_LIQUIDITY') };
}

export function supplyDemandZones(candles, atrValue = 0) {
  if (!candles?.length) return { supply: [], demand: [] };
  const range = atrValue > 0 ? atrValue : (candles.at(-1).high - candles.at(-1).low);
  const zones = { supply: [], demand: [] };
  candles.slice(-60).forEach((c, index) => {
    const body = Math.abs(c.close - c.open);
    if (body < range * 0.45) return;
    if (c.close < c.open && index > 0) zones.supply.push({ high: c.high, low: Math.min(c.open, c.close), index });
    if (c.close > c.open && index > 0) zones.demand.push({ high: Math.max(c.open, c.close), low: c.low, index });
  });
  return { supply: zones.supply.slice(-5), demand: zones.demand.slice(-5) };
}

export function liquidityMap(candles, atrValue) {
  return { structure: structureEvents(candles), pools: liquidityPools(candles), zones: supplyDemandZones(candles, atrValue) };
}
