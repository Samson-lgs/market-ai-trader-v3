import {
  analyzeMultiTimeframe,
  setupQuality,
  eventRiskGate,
  liquidityMap,
  detectSetups
} from './src/analysis/index.js';
import { loadLiveCandles } from './src/data/live.js';

const $ = id => document.getElementById(id);
const symbols = {
  Forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'],
  Crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'BNB/USD'],
  Indices: ['S&P 500', 'NASDAQ 100', 'DOW 30', 'NIFTY 50', 'DAX 40'],
  Commodities: ['Gold', 'Silver', 'WTI Crude', 'Brent Crude', 'Natural Gas']
};
const prices = {
  'EUR/USD': 1.0842, 'GBP/USD': 1.2631, 'USD/JPY': 157.42, 'AUD/USD': .6512, 'USD/CAD': 1.3711,
  'BTC/USD': 104250, 'ETH/USD': 3820, 'SOL/USD': 242.5, 'XRP/USD': 2.31, 'BNB/USD': 701,
  'S&P 500': 5600, 'NASDAQ 100': 19750, 'DOW 30': 40900, 'NIFTY 50': 24800, 'DAX 40': 18800,
  Gold: 2350, Silver: 29.1, 'WTI Crude': 78.2, 'Brent Crude': 82.4, 'Natural Gas': 2.7
};

const state = {
  price: 1.0842, analysis: null, candles: null, feed: 'SIMULATED', loading: false,
  lastUpdated: null, setup: null, newsRisk: 'UNKNOWN', map: null, ranked: null
};
const LIVE_REFRESH_MS = 60000;
let refreshTimer;

function seedCandles(base, count = 180, trend = .00035) {
  const a = []; let p = base;
  for (let i = 0; i < count; i++) {
    const wave = Math.sin(i * .19) * base * .0007;
    const open = p;
    const close = Math.max(base * .01, p + base * trend + wave + (Math.random() - .5) * base * .0025);
    const high = Math.max(open, close) + Math.abs(Math.random()) * base * .0015;
    const low = Math.min(open, close) - Math.abs(Math.random()) * base * .0015;
    a.push({ open, high, low, close, volume: 1000 + Math.random() * 500 }); p = close;
  }
  return a;
}

function makeSimulatedAnalysis() {
  const b = state.price, t = Math.random() > .5 ? .00035 : -.00035;
  state.candles = {
    '1H': seedCandles(b, 180, t), '30M': seedCandles(b, 180, t * 1.05),
    '15M': seedCandles(b, 180, t * .9), '5M': seedCandles(b, 180, t * .75),
    '1M': seedCandles(b, 180, t * .55)
  };
  state.analysis = analyzeMultiTimeframe(state.candles);
  state.feed = 'SIMULATED';
}

async function loadMarketAnalysis() {
  const symbol = $('symbol').value;
  state.price = prices[symbol] ?? 1;
  state.loading = true;
  setStatus('LOADING MARKET DATA…');
  try {
    state.candles = await loadLiveCandles(symbol, 200);
    state.analysis = analyzeMultiTimeframe(state.candles);
    state.feed = 'LIVE';
    state.lastUpdated = new Date();
    state.loading = false;
    renderAnalysis();
  } catch (e) {
    console.warn('Live market data unavailable:', e);
    makeSimulatedAnalysis();
    state.loading = false;
    state.lastUpdated = new Date();
    renderAnalysis('LIVE DATA UNAVAILABLE · SAFE DEMO FALLBACK');
  }
}

function setStatus(x) { if ($('statusText')) $('statusText').textContent = x; }
function populate() {
  const c = $('assetClass').value;
  $('symbol').innerHTML = symbols[c].map(s => `<option>${s}</option>`).join('');
  updateTitle();
}
function updateTitle() { $('chartTitle').textContent = `${$('symbol').value} · ${$('tf').value}`; }
populate();
$('assetClass').onchange = () => { populate(); refreshAnalysis(); watch(); };
$('tf').onchange = () => { updateTitle(); draw(); };
$('symbol').onchange = () => { updateTitle(); refreshAnalysis(); watch(); };

function draw() {
  const c = $('chart'), x = c.getContext('2d'), d = devicePixelRatio || 1, w = c.clientWidth, h = 300;
  c.width = w * d; c.height = h * d; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
  x.strokeStyle = '#183249';
  for (let y = 25; y < h; y += 42) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
  const key = ({ '1m': '1M', '5m': '5M', '15m': '15M', '30m': '30M', '1h': '1H' })[$('tf').value];
  const a = state.candles?.[key]; if (!a?.length) return;
  const v = a.slice(-80), lo = Math.min(...v.map(k => k.low)), hi = Math.max(...v.map(k => k.high));
  const r = Math.max(hi - lo, Number.EPSILON), step = (w - 24) / v.length, bw = Math.max(3, step * .62), y = z => 14 + (hi - z) / r * (h - 28);
  v.forEach((k, i) => {
    const px = 12 + i * step + step / 2, up = k.close >= k.open;
    x.strokeStyle = up ? '#75d58a' : '#e47777'; x.beginPath(); x.moveTo(px, y(k.high)); x.lineTo(px, y(k.low)); x.stroke();
    const top = Math.min(y(k.open), y(k.close)), ht = Math.max(1.5, Math.abs(y(k.open) - y(k.close)));
    x.fillStyle = x.strokeStyle; x.fillRect(px - bw / 2, top, bw, ht);
  });

  if (state.map) {
    x.save(); x.setLineDash([5, 5]); x.strokeStyle = '#d5a85c';
    [...state.map.pools.buySide, ...state.map.pools.sellSide].slice(0, 6).forEach(p => {
      if (p.price >= lo && p.price <= hi) { x.beginPath(); x.moveTo(0, y(p.price)); x.lineTo(w, y(p.price)); x.stroke(); }
    });
    x.restore();
    const e = state.map.structure.bos || state.map.structure.choch;
    if (e && e.level >= lo && e.level <= hi) {
      x.strokeStyle = '#b99cff'; x.setLineDash([3, 4]); x.beginPath(); x.moveTo(0, y(e.level)); x.lineTo(w, y(e.level)); x.stroke();
      x.setLineDash([]); x.fillStyle = '#b99cff'; x.font = '10px system-ui'; x.fillText(e.type, 8, Math.max(12, y(e.level) - 5));
    }
  }

  const s = state.ranked?.strongest;
  if (s) {
    const levels = [
      [s.entry, '#76c7ff', 'ENTRY'],
      [s.invalidation, '#e47777', 'INVALIDATION'],
      ...s.targets.map((t, i) => [t, '#75d58a', `TP${i + 1}`])
    ];
    levels.forEach(([price, stroke, label]) => {
      if (!Number.isFinite(price) || price < lo || price > hi) return;
      x.save(); x.strokeStyle = stroke; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(w * .38, y(price)); x.lineTo(w, y(price)); x.stroke();
      x.setLineDash([]); x.fillStyle = stroke; x.font = '10px system-ui'; x.fillText(label, w * .38 + 5, Math.max(12, y(price) - 4)); x.restore();
    });
    const z = s.entryZone;
    if (z && Number.isFinite(z.low) && Number.isFinite(z.high) && z.high >= lo && z.low <= hi) {
      const top = y(Math.min(z.high, hi)), bottom = y(Math.max(z.low, lo));
      x.fillStyle = 'rgba(118,199,255,.10)'; x.fillRect(w * .38, top, w * .62, Math.max(2, bottom - top));
    }
  }
}

function renderAnalysis(statusOverride) {
  const a = state.analysis; if (!a) return;
  const mode = $('mode').value, eventGate = eventRiskGate({ level: state.newsRisk }), f = a.frames['5M'];
  state.setup = setupQuality({ analysis: a, newsRisk: state.newsRisk });
  state.map = liquidityMap(state.candles?.['5M'] || [], f?.atr || 0);
  state.ranked = detectSetups({
    candles: state.candles?.['5M'], analysis: a, map: state.map,
    newsRisk: state.newsRisk, sessionLevel: state.setup.session.level
  });

  const ranked = state.ranked.strongest;
  const signal = ranked && !ranked.blocked ? ranked.side : 'NO TRADE';
  const confidence = ranked ? ranked.score : Math.min(99, Math.max(35, state.setup.score));
  const display = mode === 'Conservative' && confidence < 75 || state.setup.blocked || eventGate.blocked ? 'NO TRADE' : signal;
  const bull = display === 'CALL';

  $('signal').textContent = display;
  $('confidence').textContent = `${confidence}%`;
  $('signalPill').textContent = display === 'NO TRADE' ? 'WAIT FOR CONFIRMATION' : bull ? 'LONG BIAS' : 'SHORT BIAS';
  $('signalPill').style.borderColor = display === 'NO TRADE' ? '#465d70' : '#426f51';

  const entry = display === 'NO TRADE' ? null : ranked?.entry;
  const stop = display === 'NO TRADE' ? null : ranked?.invalidation;
  const target = display === 'NO TRADE' ? null : ranked?.targets?.[0];
  const fmt = z => z == null ? '—' : Number(z).toFixed(4);
  $('entry').textContent = fmt(entry); $('stop').textContent = fmt(stop); $('target').textContent = fmt(target);
  $('rr').textContent = display === 'NO TRADE' ? '—' : `1:${(ranked.rr || 0).toFixed(1)}`;
  $('regime').textContent = a.higherTimeframeBias === 'BULLISH' ? 'Bullish' : a.higherTimeframeBias === 'BEARISH' ? 'Bearish' : 'Balanced';
  $('regimeDetail').textContent = `MTF · ${state.setup.session.active} · ${ranked?.grade || state.setup.grade}-grade`;

  const reasons = [...(ranked?.reasons || []), ...(eventGate.warning ? [eventGate.warning] : [])];
  $('strongest').textContent = display === 'NO TRADE' ? 'No valid setup yet' : `${ranked.type.replaceAll('_', ' ')} · ${display} · Grade ${ranked.grade}`;
  $('strongestText').textContent = reasons.length ? reasons.join(' ') : `${a.execution.reason} Setup quality ${confidence}/100.`;
  $('why').textContent = display === 'NO TRADE'
    ? (ranked?.reasons?.find(r => r.includes('below') || r.includes('risk') || r.includes('sweep') || r.includes('structure')) || a.execution.reason)
    : `${ranked.type.replaceAll('_', ' ')} detected with ${ranked.rr.toFixed(1)}R projected reward/risk. Validate the entry trigger before acting.`;

  const checks = [
    ['HTF structure', a.higherTimeframeBias === 'CONFLICT' || a.higherTimeframeBias === 'RANGE' ? 'WAIT' : 'PASS'],
    ['Liquidity sweep', ranked?.reasons?.some(r => r.includes('liquidity sweep')) ? 'PASS' : 'WAIT'],
    ['Displacement', ranked?.reasons?.some(r => r.includes('Displacement')) ? 'PASS' : 'WAIT'],
    ['BOS / CHOCH', state.map.structure.bos || state.map.structure.choch ? 'PASS' : 'WAIT'],
    ['Setup ranking', ranked ? `${ranked.score}/100` : 'WAIT'],
    ['Risk / reward', ranked && ranked.rr >= 1.5 ? 'PASS' : 'BLOCK'],
    ['Session quality', state.setup.session.level === 'NORMAL' ? 'PASS' : 'WAIT'],
    ['News risk', state.newsRisk === 'HIGH' ? 'BLOCK' : state.newsRisk === 'UNKNOWN' ? 'UNKNOWN' : 'PASS'],
    ['Final risk gate', display === 'NO TRADE' ? 'BLOCK' : 'PASS']
  ];
  $('checks').innerHTML = checks.map(([n, s]) => `<div class="check"><span>${n}</span><b class="${s === 'PASS' ? 'ok' : 'warn'}">${s}</b></div>`).join('');
  setStatus(statusOverride || (state.feed === 'LIVE' ? `LIVE FEED · TWELVE DATA · ${ranked?.grade || state.setup.grade}-GRADE` : `SIMULATED FEED · ${ranked?.grade || state.setup.grade}-GRADE`) + ` · UPDATED ${(state.lastUpdated || new Date()).toLocaleTimeString()}`);
  draw();
}

async function refreshAnalysis() { if (!state.loading) await loadMarketAnalysis(); }
function watch() {
  $('watchlist').innerHTML = symbols[$('assetClass').value].map(n => `<div class="watch"><strong>${n}</strong><small>Setup ranking + liquidity</small><b>ANALYZE</b></div>`).join('');
}
$('mode').onchange = renderAnalysis;
window.addEventListener('resize', draw);
$('scanBtn').onclick = () => { refreshAnalysis(); watch(); };
$('refreshBtn').onclick = () => { refreshAnalysis(); watch(); };
watch(); refreshAnalysis(); clearInterval(refreshTimer); refreshTimer = setInterval(refreshAnalysis, LIVE_REFRESH_MS);
