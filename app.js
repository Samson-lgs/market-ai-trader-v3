import { analyzeMultiTimeframe, setupQuality, eventRiskGate } from './src/analysis/index.js';
import { loadLiveAnalysis, loadLiveCandles } from './src/data/live.js';

const $ = id => document.getElementById(id);
const symbols = {
  Forex: ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD'],
  Crypto: ['BTC/USD','ETH/USD','SOL/USD','XRP/USD','BNB/USD'],
  Indices: ['S&P 500','NASDAQ 100','DOW 30','NIFTY 50','DAX 40'],
  Commodities: ['Gold','Silver','WTI Crude','Brent Crude','Natural Gas']
};
const prices = {'EUR/USD':1.0842,'GBP/USD':1.2631,'USD/JPY':157.42,'AUD/USD':0.6512,'USD/CAD':1.3711,'BTC/USD':104250,'ETH/USD':3820,'SOL/USD':242.5,'XRP/USD':2.31,'BNB/USD':701,'S&P 500':5600,'NASDAQ 100':19750,'DOW 30':40900,'NIFTY 50':24800,'DAX 40':18800,'Gold':2350,'Silver':29.1,'WTI Crude':78.2,'Brent Crude':82.4,'Natural Gas':2.7};
const state = { price: 1.0842, analysis: null, candles: null, feed: 'SIMULATED', loading: false, lastUpdated: null, setup: null, newsRisk: 'UNKNOWN' };
const LIVE_REFRESH_MS = 60_000;
let refreshTimer;

function seedCandles(base, count = 180, trend = 0.00035) {
  const candles = []; let p = base;
  for (let i = 0; i < count; i++) {
    const wave = Math.sin(i * 0.19) * base * 0.0007, drift = base * trend, open = p;
    const close = Math.max(base * 0.01, p + drift + wave + (Math.random() - 0.5) * base * 0.0025);
    const high = Math.max(open, close) + Math.abs(Math.random()) * base * 0.0015;
    const low = Math.min(open, close) - Math.abs(Math.random()) * base * 0.0015;
    candles.push({ open, high, low, close, volume: 1000 + Math.random() * 500 }); p = close;
  }
  return candles;
}

function makeSimulatedAnalysis() {
  const base = state.price, bias = Math.random() > 0.5 ? 0.00035 : -0.00035;
  state.candles = {
    '1H': seedCandles(base, 180, bias), '30M': seedCandles(base, 180, bias * 1.05),
    '15M': seedCandles(base, 180, bias * 0.9), '5M': seedCandles(base, 180, bias * 0.75),
    '1M': seedCandles(base, 180, bias * 0.55)
  };
  state.analysis = analyzeMultiTimeframe(state.candles); state.feed = 'SIMULATED';
}

async function loadMarketAnalysis() {
  const symbol = $('symbol').value; state.price = prices[symbol] ?? 1; state.loading = true; setStatus('LOADING MARKET DATA…');
  try {
    state.candles = await loadLiveCandles(symbol, 200);
    state.analysis = analyzeMultiTimeframe(state.candles); state.feed = 'LIVE'; state.lastUpdated = new Date(); state.loading = false; renderAnalysis();
  } catch (error) {
    console.warn('Live market data unavailable:', error); makeSimulatedAnalysis(); state.loading = false; state.lastUpdated = new Date();
    renderAnalysis('LIVE DATA UNAVAILABLE · SAFE DEMO FALLBACK');
  }
}

function setStatus(message) { const el = $('statusText'); if (el) el.textContent = message; }
function populate() { const cls = $('assetClass').value; $('symbol').innerHTML = symbols[cls].map(s => `<option>${s}</option>`).join(''); updateTitle(); }
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
  const candles = state.candles?.[({ '1m':'1M','5m':'5M','15m':'15M','30m':'30M','1h':'1H' })[$('tf').value]];
  if (!candles?.length) return;
  const visible = candles.slice(-80), lows = visible.map(x => x.low), highs = visible.map(x => x.high);
  const min = Math.min(...lows), max = Math.max(...highs), range = Math.max(max - min, Number.EPSILON), step = (w - 24) / visible.length, bodyWidth = Math.max(3, step * 0.62);
  const y = value => 14 + (max - value) / range * (h - 28);
  visible.forEach((k, i) => {
    const x = 12 + i * step + step / 2, up = k.close >= k.open; ctx.strokeStyle = up ? '#75d58a' : '#e47777'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y(k.high)); ctx.lineTo(x, y(k.low)); ctx.stroke();
    const top = Math.min(y(k.open), y(k.close)), height = Math.max(1.5, Math.abs(y(k.open) - y(k.close))); ctx.fillStyle = ctx.strokeStyle; ctx.fillRect(x - bodyWidth / 2, top, bodyWidth, height);
  });
}

function renderAnalysis(statusOverride) {
  const result = state.analysis; if (!result) return;
  const mode = $('mode').value, eventGate = eventRiskGate({ level: state.newsRisk });
  state.setup = setupQuality({ analysis: result, newsRisk: state.newsRisk });
  const signal = result.decision, confidence = Math.min(99, Math.max(35, state.setup.score)), bullish = signal === 'CALL';
  const conservativeBlock = mode === 'Conservative' && confidence < 75;
  const displaySignal = conservativeBlock || state.setup.blocked || eventGate.blocked ? 'NO TRADE' : signal;
  $('signal').textContent = displaySignal; $('confidence').textContent = `${confidence}%`;
  $('signalPill').textContent = displaySignal === 'NO TRADE' ? 'WAIT FOR CONFIRMATION' : bullish ? 'LONG BIAS' : 'SHORT BIAS';
  $('signalPill').style.borderColor = displaySignal === 'NO TRADE' ? '#465d70' : '#426f51';
  const entry = result.execution.entry, sd = result.execution.stopDistance, td = result.execution.targetDistance;
  const stop = entry && sd ? (bullish ? entry - sd : entry + sd) : null, target = entry && td ? (bullish ? entry + td : entry - td) : null;
  const format = x => x == null ? '—' : Number(x).toFixed(4);
  $('entry').textContent = displaySignal === 'NO TRADE' ? '—' : format(entry); $('stop').textContent = displaySignal === 'NO TRADE' ? '—' : format(stop);
  $('target').textContent = displaySignal === 'NO TRADE' ? '—' : format(target); $('rr').textContent = displaySignal === 'NO TRADE' ? '—' : '1:2';
  $('regime').textContent = result.higherTimeframeBias === 'BULLISH' ? 'Bullish' : result.higherTimeframeBias === 'BEARISH' ? 'Bearish' : 'Balanced';
  $('regimeDetail').textContent = `MTF bias · ${result.timeframes.join(' → ')} · Session ${state.setup.session.active}`;
  const reasons = [...state.setup.reasons, ...(eventGate.warning ? [eventGate.warning] : [])];
  $('strongest').textContent = displaySignal === 'NO TRADE' ? 'No valid setup yet' : `${displaySignal} continuation candidate · Grade ${state.setup.grade}`;
  $('strongestText').textContent = reasons.length ? reasons.join(' ') : `${result.execution.reason} Setup quality ${state.setup.score}/100.`;
  $('why').textContent = displaySignal === 'NO TRADE' ? (reasons[0] || result.execution.reason) : `Higher-timeframe bias is ${result.higherTimeframeBias.toLowerCase()} and setup quality is ${state.setup.grade}. Validate execution conditions before acting.`;
  const frame = result.frames;
  const checks = [
    ['HTF structure', result.higherTimeframeBias === 'CONFLICT' || result.higherTimeframeBias === 'RANGE' ? 'WAIT' : 'PASS'],
    ['5M momentum', frame['5M'].momentum === result.higherTimeframeBias ? 'PASS' : 'WAIT'], ['1M trigger', frame['1M'].momentum === result.higherTimeframeBias ? 'PASS' : 'WAIT'],
    ['Volatility / ATR', frame['5M'].atr > 0 ? 'PASS' : 'WAIT'], ['Liquidity context', frame['1M'].sweep ? 'PASS' : 'WAIT'],
    ['Session quality', state.setup.session.level === 'NORMAL' ? 'PASS' : 'WAIT'], ['News risk', state.newsRisk === 'HIGH' ? 'BLOCK' : state.newsRisk === 'UNKNOWN' ? 'UNKNOWN' : 'PASS'],
    ['Final risk gate', displaySignal === 'NO TRADE' ? 'BLOCK' : 'PASS']
  ];
  $('checks').innerHTML = checks.map(([n, s]) => `<div class="check"><span>${n}</span><b class="${s === 'PASS' ? 'ok' : 'warn'}">${s}</b></div>`).join('');
  const source = state.feed === 'LIVE' ? 'LIVE FEED · TWELVE DATA' : 'SIMULATED FEED'; setStatus(statusOverride || `${source} · ${state.setup.grade}-GRADE ENGINE · UPDATED ${(state.lastUpdated || new Date()).toLocaleTimeString()}`); draw();
}

async function refreshAnalysis() { if (!state.loading) await loadMarketAnalysis(); }
function watch() { $('watchlist').innerHTML = symbols[$('assetClass').value].map(n => `<div class="watch"><strong>${n}</strong><small>15m structure</small><b>ANALYZE</b></div>`).join(''); }
$('mode').onchange = renderAnalysis; window.addEventListener('resize', draw);
$('scanBtn').onclick = () => { refreshAnalysis(); watch(); }; $('refreshBtn').onclick = () => { refreshAnalysis(); watch(); };
watch(); refreshAnalysis(); clearInterval(refreshTimer); refreshTimer = setInterval(refreshAnalysis, LIVE_REFRESH_MS);
