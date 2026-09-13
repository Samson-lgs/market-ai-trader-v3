const PERIODS = { '1M': 60_000, '5M': 300_000, '15M': 900_000, '30M': 1_800_000, '1H': 3_600_000 };

export function aggregateCandles(oneMinuteCandles, labels = Object.keys(PERIODS)) {
  const source = Array.isArray(oneMinuteCandles) ? oneMinuteCandles : [];
  return Object.fromEntries(labels.map(label => [label, aggregate(source, PERIODS[label])]));
}

function aggregate(source, period) {
  const out = [];
  for (const c of source) {
    const timestamp = Number(c.timestamp ?? c.time);
    if (!Number.isFinite(timestamp)) continue;
    const bucket = Math.floor(timestamp / period) * period;
    let last = out.at(-1);
    if (!last || last.timestamp !== bucket) {
      out.push({ timestamp: bucket, open: Number(c.open), high: Number(c.high), low: Number(c.low), close: Number(c.close), volume: Number(c.volume) || 0 });
    } else {
      last.high = Math.max(last.high, Number(c.high));
      last.low = Math.min(last.low, Number(c.low));
      last.close = Number(c.close);
      last.volume += Number(c.volume) || 0;
    }
  }
  return out;
}
