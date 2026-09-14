import { loadLiveCandles } from './live.js';

export function createRealtimeCoordinator({ symbol, onUpdate, onError, intervalMs = 15000 } = {}) {
  let timer=null,running=false,generation=0;
  async function tick(){const run=++generation;try{const candles=await loadLiveCandles(symbol,200);if(run!==generation)return;onUpdate?.({symbol,candles,fetchedAt:new Date().toISOString()})}catch(error){if(run!==generation)return;onError?.(error)}}
  return {start(){if(running)return;running=true;tick();timer=setInterval(tick,intervalMs)},stop(){running=false;generation++;if(timer)clearInterval(timer);timer=null},refresh:tick,get running(){return running}};
}

export class RealtimeFeedClient {
  constructor({url,symbol,onTick,onStatus,reconnectMs=2000,staleMs=15000}={}){if(!url)throw new Error('Realtime WebSocket URL is required');this.url=url;this.symbol=symbol;this.onTick=onTick;this.onStatus=onStatus;this.reconnectMs=reconnectMs;this.staleMs=staleMs;this.ws=null;this.retry=0;this.closed=false;this.heartbeat=null;this.staleTimer=null;this.lastTick=0}
  connect(){this.closed=false;this.clear();this.emit('CONNECTING');this.ws=new WebSocket(this.url);this.ws.onopen=()=>{this.retry=0;this.emit('CONNECTED');this.ws.send(JSON.stringify({action:'subscribe',symbol:this.symbol}));this.heartbeat=setInterval(()=>{if(this.ws?.readyState===WebSocket.OPEN)this.ws.send(JSON.stringify({action:'ping',ts:Date.now()}))},10000);this.staleTimer=setInterval(()=>{if(this.lastTick&&Date.now()-this.lastTick>this.staleMs)this.emit('STALE')},5000)};this.ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.type!=='tick'||String(m.symbol).toUpperCase()!==String(this.symbol).toUpperCase())return;const price=Number(m.price),ts=Number(m.timestamp)||Date.now();if(!Number.isFinite(price)||price<=0)return;this.lastTick=ts<1e12?ts*1000:ts;this.onTick?.({symbol:this.symbol,price,timestamp:this.lastTick,volume:Number(m.volume)||0});this.emit('LIVE')};this.ws.onerror=()=>this.emit('ERROR');this.ws.onclose=()=>{this.clear();if(this.closed)return;this.emit('DISCONNECTED');const d=Math.min(30000,this.reconnectMs*2**this.retry++);setTimeout(()=>!this.closed&&this.connect(),d)};return this}
  emit(status){this.onStatus?.({status,symbol:this.symbol,lastTick:this.lastTick,at:new Date().toISOString()})}
  close(){this.closed=true;this.clear();this.ws?.close();this.ws=null;this.emit('CLOSED')}
  clear(){clearInterval(this.heartbeat);clearInterval(this.staleTimer);this.heartbeat=this.staleTimer=null}
}
