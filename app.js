import { analyzeMultiTimeframe } from './src/analysis/index.js';
import { loadLiveAnalysis } from './src/data/live.js';
import { MarketDataProvider } from './src/data/provider.js';

const $ = id => document.getElementById(id);
const symbols = {
  Forex: ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD'],
  Crypto: ['BTC/USD','ETH/USD','SOL/USD','XRP/USD','BNB/USD'],
  Indices: ['S&P 500','NASDAQ 100','DOW 30','NIFTY 50','DAX 40'],
  Commodities: ['Gold','Silver','WTI Crude','Brent Crude','Natural Gas']
};

const prices = {'EUR/USD':1.0842,'GBP/USD':1.2631,'USD/JPY':157.42,'AUD/USD':0.6512,'USD/CAD':1.3711,'BTC/USD':104250,'ETH/USD':3820,'SOL/USD':242.5,'XRP/USD':2.31,'BNB/USD':701,'S&P 500':5600,'NASDAQ 100':19750,'DOW 30':40900,'NIFTY 50':24800,'DAX 40':18800,'Gold':2350,'Silver':29.1,'WTI Crude':78.2,'Brent Crude':82.4,'Natural Gas':2.7};

const state = { price: 1.0842, analysis: null, candles: null, feed: 'SIMULATED', loading: false, lastUpdated: null };
const LIVE_REFRESH_MS = 60_000;
let refreshTimer;

function seedCandles(base, count = 180, trend = 0.00035) {
  const candles = [];
  let p = base;
  for (let i = 0; i < count; i++) {
    const wave = Math.sin(i * 0.19) * base * 0.0007;
    const drift = base * trend;
    const open = p;
    const close = Math.max(base * 0.01, p + drift + wave + (Math.random() - 0.5) * base * 0.0025);
    const high = Math.max(open, close) + Math.abs(Math.random()) * base * 0.0015;
    const low = Math.min(open, close) - Math.abs(Math.random()) * base * 0.0015;
    candles.push({ open, high, low, close, volume: 1000 + Math.random() * 500 });
    p = close;
  }
  return candles;
}

function makeSimulatedAnalysis() {
  const base = state.price;
  const bias = Math.random() > 0.5 ? 0.00035 : -0.00035;
  const candlesByTimeframe = {
    '1H': seedCandles(base, 180, bias),
    '30M': seedCandles(base, 180, bias * 1.05),
    '15M': seedCandles(base, 180, bias * 0.9),
    '5M': seedCandles(base, 180, bias * 0.75),
    '1M': seedCandles(base, 180, bias * 0.55)
  };
  state.candles = candlesByTimeframe;
  state.analysis = analyzeMultiTimeframe(candlesByTimeframe);
  state.feed = 'SIMULATED';
}

async function loadMarketAnalysis() {
  const symbol = $('symbol').value;
  const base = prices[symbol] ?? 1;
  state.price = base;
  state.loading = true;
  setStatus('LOADING LIVE FEED…');

  try {
    const result = await loadLiveAnalysis(symbol, 200);
    state.analysis = result;
    state.feed = 'LIVE';
    state.lastUpdated = new Date();
    state.loading = false;
    renderAnalysis();
  } catch (error) {
    console.warn('Live market data unavailable:', error);
    makeSimulatedAnalysis();
    state.loading = false;
    state.lastUpdated = new Date();
    renderAnalysis('LIVE DATA UNAVAILABLE · SAFE DEMO FALLBACK');
  }
}

function setStatus(message) {
  const el = $('statusText');
  if (el) el.textContent = message;
}

function populate() {
  const cls = $('assetClass').value;
  $('symbol').innerHTML = symbols[cls].map(s => `<option>${s}</option>`).join('');
  updateTitle();
}
function updateTitle() { $('chartTitle').textContent = `${$('symbol').value} · ${$('tf').value}`; }
populate();
$('assetClass').onchange = () => { populate(); refreshAnalysis(); watch(); };
$('tf').onchange = () => { updateTitle(); draw(); };
$('symbol').onchange = () => { updateTitle(); refreshAnalysis(); watch(); };

function draw() {
  const c = $('chart'), ctx = c.getContext('2d'), dpr = devicePixelRatio || 1, w = c.clientWidth, h = 260;
  c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#183249'; ctx.lineWidth = 1;
  for (let y = 25; y < h; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  const tf = $('tf').value;
  const candles = state.candles?.[tf];
  if (!candles?.length) return drawFallbackLine(ctx, w, h);

  const visible = candles.slice(-80);
  const lows = visible.map(x => x.low), highs = visible.map(x => x.high);
  const min = Math.min(...lows), max = Math.max(...highs), range = Math.max(max - min, Number.EPSILON);
  const bodyWidth = Math.max(3, (w - 24) / visible.length * 0.62);
  const step = (w - 24) / visible.length;
  const y = value => 14 + (max - value) / range * (h - 28);

  visible.forEach((k, i) => {
    const x = 12 + i * step + step / 2;
    ctx.strokeStyle = k.close >= k.open ? '#75d58a' : '#e47777';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y(k.high)); ctx.lineTo(x, y(k.low)); ctx.stroke();
    const top = Math.min(y(k.open), y(k.close));
    const height = Math.max(1.5, Math.abs(y(k.open) - y(k.close)));
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(x - bodyWidth / 2, top, bodyWidth, height);
  });
}

function drawFallbackLine(ctx, w, h) {
  let pts = [], v = h * .57;
  for (let i = 0; i < 80; i++) { v += Math.sin(i * .45) * 1.8 + (Math.random() - .48) * 5; v = Math.max(28, Math.min(h - 25, v)); pts.push(v); }
  ctx.strokeStyle = '#8be28b'; ctx.lineWidth = 2; ctx.beginPath();
  pts.forEach((yy, i) => { const x = i * (w - 18) / 79 + 9; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }); ctx.stroke();
}

function renderAnalysis(statusOverride) {
  const result = state.analysis;
  if (!result) return;
  const mode = $('mode').value;
  const signal = result.decision;
  const confidence = Math.min(99, Math.max(35, result.execution.score ?? 45));
  const bullish = signal === 'CALL';
  const displaySignal = mode === 'Conservative' && confidence < 75 ? 'NO TRADE' : signal;

  $('signal').textContent = displaySignal;
  $('confidence').textContent = `${confidence}%`;
  $('signalPill').textContent = displaySignal === 'NO TRADE' ? 'WAIT FOR CONFIRMATION' : bullish ? 'LONG BIAS' : 'SHORT BIAS';
  $('signalPill').style.borderColor = displaySignal === 'NO TRADE' ? '#465d70' : '#426f51';

  const entry = result.execution.entry;
  const stopDistance = result.execution.stopDistance;
  const targetDistance = result.execution.targetDistance;
  const stop = entry && stopDistance ? (bullish ? entry - stopDistance : entry + stopDistance) : null;
  const target = entry && targetDistance ? (bullish ? entry + targetDistance : entry - targetDistance) : null;
  const format = x => x == null ? '—' : Number(x).toFixed(4);

  $('entry').textContent = displaySignal === 'NO TRADE' ? '—' : format(entry);
  $('stop').textContent = displaySignal === 'NO TRADE' ? '—' : format(stop);
  $('target').textContent = displaySignal === 'NO TRADE' ? '—' : format(target);
  $('rr').textContent = displaySignal === 'NO TRADE' ? '—' : '1:2';
  $('regime').textContent = result.higherTimeframeBias === 'BULLISH' ? 'Bullish' : result.higherTimeframeBias === 'BEARISH' ? 'Bearish' : 'Balanced';
  $('regimeDetail').textContent = `MTF bias · ${result.timeframes.join(' → ')}`;
  $('strongest').textContent = displaySignal === 'NO TRADE' ? 'No valid setup yet' : `${displaySignal} continuation candidate`;
  $('strongestText').textContent = displaySignal === 'NO TRADE' ? result.execution.reason : `${result.execution.reason} Score ${confidence}/100. Treat this as model confluence, not a probability of profit.`;
  $('why').textContent = displaySignal === 'NO TRADE' ? result.execution.reason : `Higher-timeframe bias is ${result.higherTimeframeBias.toLowerCase()}, with lower-timeframe momentum aligned. Validate execution conditions before acting.`;

  const frame = result.frames;
  const checks = [
    ['1H / 30M / 15M structure', result.higherTimeframeBias === 'CONFLICT' ? 'WAIT' : 'PASS'],
    ['5M momentum', frame['5M'].momentum === result.higherTimeframeBias ? 'PASS' : 'WAIT'],
    ['1M trigger', frame['1M'].momentum === result.higherTimeframeBias ? 'PASS' : 'WAIT'],
    ['Volatility / ATR', frame['5M'].atr > 0 ? 'PASS' : 'WAIT'],
    ['Liquidity context', frame['1M'].sweep ? 'PASS' : 'WAIT'],
    ['Risk filter', result.execution.decision === 'NO TRADE' ? 'WAIT' : 'PASS']
  ];
  $('checks').innerHTML = checks.map(([n, s]) => `<div class="check"><span>${n}</span><b class="${s === 'PASS' ? 'ok' : 'warn'}">${s}</b></div>`).join('');

  const source = state.feed === 'LIVE' ? 'LIVE FEED · TWELVE DATA' : 'SIMULATED FEED';
  setStatus(statusOverride || `${source} · MTF ENGINE · UPDATED ${(state.lastUpdated || new Date()).toLocaleTimeString()}`);
  draw();
}

async function refreshAnalysis() {
  if (state.loading) return;
  await loadMarketAnalysis();
}

function watch() {
  const names = symbols[$('assetClass').value];
  $('watchlist').innerHTML = names.map(n => `<div class="watch"><strong>${n}</strong><small>15m structure</small><b>ANALYZE</b></div>`).join('');
}

$('mode').onchange = renderAnalysis;
window.addEventListener('resize', draw);
$('scanBtn').onclick = () => { refreshAnalysis(); watch(); };
$('refreshBtn').onclick = () => { refreshAnalysis(); watch(); };

watch();
refreshAnalysis();
clearInterval(refreshTimer);
refreshTimer = setInterval(() => refreshAnalysis(), LIVE_REFRESH_MS);
