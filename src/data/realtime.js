import { loadLiveCandles } from './live.js';

const DEFAULT_INTERVAL = 60_000;
const DEFAULT_HEARTBEAT_MS = 30_000;
const DEFAULT_STALE_MS = 90_000;

export function createRealtimeCoordinator({ symbol, onUpdate, onError, intervalMs = DEFAULT_INTERVAL } = {}) {
  let timer = null, running = false, generation = 0;
  async function tick() { const run = ++generation; try { const candles = await loadLiveCandles(symbol, 200); if (run !== generation) return; onUpdate?.({ symbol, candles, fetchedAt: new Date().toISOString() }); } catch (error) { if (run !== generation) return; onError?.(error); } }
  return { start() { if (running) return; running = true; tick(); timer = setInterval(tick, intervalMs); }, stop() { running = false; generation++; if (timer) clearInterval(timer); timer = null; }, refresh: tick, get running() { return running; } };
}

export class RealtimeFeedClient {
  constructor({ url, symbol, onTick, onStatus, heartbeatMs = DEFAULT_HEARTBEAT_MS, staleMs = DEFAULT_STALE_MS, reconnectMs = 2000 }) {
    if (!url) throw new Error('Realtime WebSocket URL is required');
    this.url=url; this.symbol=symbol; this.onTick=onTick; this.onStatus=onStatus; this.heartbeatMs=heartbeatMs; this.staleMs=staleMs; this.reconnectMs=reconnectMs; this.socket=null; this.heartbeat=null; this.staleTimer=null; this.reconnectTimer=null; this.closed=false; this.retry=0; this.lastTick=0; this.connectedAt=0;
  }
  connect() {
    this.closed=false; this.clearTimers(); this.emit('CONNECTING'); this.socket=new WebSocket(this.url);
    this.socket.onopen=()=>{this.retry=0;this.connectedAt=Date.now();this.emit('CONNECTED');this.subscribe();this.heartbeat=setInterval(()=>this.ping(),this.heartbeatMs);this.staleTimer=setInterval(()=>{const reference=this.lastTick||this.connectedAt;if(reference&&Date.now()-reference>this.staleMs)this.emit('STALE');},Math.max(5000,this.staleMs/3));};
    this.socket.onmessage=e=>{const m=this.parse(e.data);if(!m)return;const t=normalizeTick(m,this.symbol);if(!t)return;this.lastTick=t.timestamp;this.onTick?.(t);this.emit('LIVE');};
    this.socket.onerror=()=>this.emit('ERROR');
    this.socket.onclose=()=>{this.clearTimers();if(this.closed)return;this.emit('DISCONNECTED');const delay=Math.min(30000,this.reconnectMs*2**this.retry++);this.reconnectTimer=setTimeout(()=>!this.closed&&this.connect(),delay);};
    return this;
  }
  subscribe(){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({action:'subscribe',symbol:this.symbol}));}
  ping(){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({action:'ping',ts:Date.now()}));}
  parse(data){try{return typeof data==='string'?JSON.parse(data):data;}catch{return null;}}
  emit(status){this.onStatus?.({status,symbol:this.symbol,at:new Date().toISOString(),lastTickAt:this.lastTick});}
  close(){this.closed=true;this.clearTimers();clearTimeout(this.reconnectTimer);this.reconnectTimer=null;this.socket?.close();this.socket=null;this.emit('CLOSED');}
  clearTimers(){clearInterval(this.heartbeat);clearInterval(this.staleTimer);this.heartbeat=this.staleTimer=null;}
}
function normalizeTick(message,symbol){const d=message?.data||message?.tick||message;const price=Number(d?.price??d?.close??d?.value),raw=Number(d?.timestamp??d?.time??Date.now());if(!Number.isFinite(price)||price<=0||!Number.isFinite(raw))return null;return{symbol,price,timestamp:raw<1e12?raw*1000:raw,volume:Number(d?.volume??d?.size??0)||0};}
