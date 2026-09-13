// Pure technical-indicator helpers for Market AI Trader V3.
// These functions operate on completed OHLC candles and contain no provider-specific code.

export function ema(values, period) {
  if (!values.length || period <= 0) return [];
  const k = 2 / (period + 1);
  const out = [values[0]];
  for (let i = 1; i < values.length; i++) out.push(values[i] * k + out[i - 1] * (1 - k));
  return out;
}

export function sma(values, period) {
  if (period <= 0) return [];
  return values.map((_, i) => {
    if (i + 1 < period) return null;
    const slice = values.slice(i + 1 - period, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

export function rsi(closes, period = 14) {
  if (closes.length <= period) return [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    gains += Math.max(d, 0);
    losses += Math.max(-d, 0);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  const out = [100 - 100 / (1 + avgGain / (avgLoss || Number.EPSILON))];
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    out.push(100 - 100 / (1 + avgGain / (avgLoss || Number.EPSILON)));
  }
  return out;
}

export function trueRange(candles) {
  return candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    return Math.max(c.high - c.low, Math.abs(c.high - candles[i - 1].close), Math.abs(c.low - candles[i - 1].close));
  });
}

export function atr(candles, period = 14) {
  return ema(trueRange(candles), period);
}

export function macd(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fast = ema(closes, fastPeriod);
  const slow = ema(closes, slowPeriod);
  const line = closes.map((_, i) => fast[i] - slow[i]);
  const signal = ema(line, signalPeriod);
  return { line, signal, histogram: line.map((v, i) => v - signal[i]) };
}
