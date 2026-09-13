const DEFAULT_HEARTBEAT_MS = 30_000;
const DEFAULT_STALE_MS = 90_000;
const DEFAULT_RECONNECT_MS = 2_000;

export class RealtimeFeedClient {
  constructor({ url, symbol, onTick, onStatus, heartbeatMs = DEFAULT_HEARTBEAT_MS, staleMs = DEFAULT_STALE_MS, reconnectMs = DEFAULT_RECONNECT_MS }) {
    if (!url) throw new Error('Realtime WebSocket URL is required');
    this.url = url;
    this.symbol = symbol;
    this.onTick = onTick;
    this.onStatus = onStatus;
    this.heartbeatMs = heartbeatMs;
    this.staleMs = staleMs;
    this.reconnectMs = reconnectMs;
    this.socket = null;
    this.timer = null;
    this.staleTimer = null;
    this.closed = false;
    this.retry = 0;
  }

  connect() {
    this.closed = false;
    this.clearTimers();
    this.emit('CONNECTING');
    this.socket = new WebSocket(this.url);
    this.socket.onopen = () => {
      this.retry = 0;
      this.emit('CONNECTED');
      this.startHeartbeat();
      this.subscribe();
    };
    this.socket.onmessage = event => {
      const message = this.parse(event.data);
      if (!message) return;
      if (message.type === 'heartbeat' || message.event === 'heartbeat') return;
      const tick = normalizeTick(message, this.symbol);
      if (tick) {
        this.onTick?.(tick);
        this.emit('LIVE');
      }
    };
    this.socket.onerror = () => this.emit('ERROR');
    this.socket.onclose = () => {
      this.clearTimers();
      if (this.closed) return;
      this.emit('DISCONNECTED');
      const delay = Math.min(30_000, this.reconnectMs * 2 ** this.retry++);
      setTimeout(() => { if (!this.closed) this.connect(); }, delay);
    };
    return this;
  }

  subscribe() {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ action: 'subscribe', symbol: this.symbol }));
  }

  startHeartbeat() {
    this.timer = setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) return;
      this.socket.send(JSON.stringify({ action: 'ping', ts: Date.now() }));
    }, this.heartbeatMs);
    this.staleTimer = setInterval(() => {
      if (this.lastTick && Date.now() - this.lastTick > this.staleMs) this.emit('STALE');
    }, Math.max(5_000, Math.floor(this.staleMs / 3)));
  }

  emit(status) { this.onStatus?.({ status, symbol: this.symbol, at: new Date().toISOString() }); }
  parse(data) { try { return typeof data === 'string' ? JSON.parse(data) : data; } catch { return null; } }
  close() { this.closed = true; this.clearTimers(); this.socket?.close(); this.socket = null; this.emit('CLOSED'); }
  clearTimers() { clearInterval(this.timer); clearInterval(this.staleTimer); this.timer = this.staleTimer = null; }
}

function normalizeTick(message, symbol) {
  const data = message?.data || message?.tick || message;
  const price = Number(data?.price ?? data?.close ?? data?.value);
  const timestamp = Number(data?.timestamp ?? data?.time ?? Date.now());
  if (!Number.isFinite(price) || price <= 0) return null;
  const ts = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  return { symbol, price, timestamp: ts, volume: Number(data?.volume ?? data?.size ?? 0) || 0 };
}
