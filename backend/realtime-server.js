import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.TWELVE_DATA_API_KEY || '';
const PROVIDER_WS_URL = process.env.TWELVE_DATA_WS_URL || 'wss://ws.twelvedata.com/v1/quotes/price';
const PROVIDER_HEARTBEAT_MS = 10_000;
const RECONNECT_MS = 2_000;

function providerUrl() {
  const url = new URL(PROVIDER_WS_URL);
  url.searchParams.set('apikey', API_KEY);
  return url.toString();
}

function normalizeSymbol(value) {
  return String(value || '').trim().toUpperCase().slice(0, 30);
}

function normalizeProviderMessage(message) {
  if (!message || message.event !== 'price') return null;
  const symbol = normalizeSymbol(message.symbol);
  const price = Number(message.price);
  const timestamp = Number(message.timestamp);
  if (!symbol || !Number.isFinite(price) || price <= 0 || !Number.isFinite(timestamp)) return null;
  return {
    type: 'tick',
    symbol,
    price,
    timestamp: timestamp < 1e12 ? timestamp * 1000 : timestamp,
    volume: Number(message.day_volume ?? message.volume ?? 0) || 0,
    source: 'twelve-data'
  };
}

class TwelveDataProvider {
  constructor(broadcast) {
    this.broadcast = broadcast;
    this.socket = null;
    this.subscriptions = new Set();
    this.heartbeat = null;
    this.reconnectTimer = null;
    this.closed = false;
    this.connecting = false;
  }

  add(symbol) {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return;
    const wasEmpty = this.subscriptions.size === 0;
    this.subscriptions.add(normalized);
    if (wasEmpty) this.connect();
    else if (this.socket?.readyState === WebSocket.OPEN) this.sendSubscriptions();
  }

  remove(symbol) {
    this.subscriptions.delete(normalizeSymbol(symbol));
    if (!this.subscriptions.size) this.disconnect();
    else if (this.socket?.readyState === WebSocket.OPEN) this.sendSubscriptions();
  }

  connect() {
    if (this.closed || !API_KEY || !this.subscriptions.size || this.connecting) return;
    this.connecting = true;
    let socket;
    try { socket = new WebSocket(providerUrl()); } catch { this.connecting = false; return this.scheduleReconnect(); }
    this.socket = socket;
    socket.on('open', () => {
      this.connecting = false;
      this.sendSubscriptions();
      clearInterval(this.heartbeat);
      this.heartbeat = setInterval(() => {
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ action: 'heartbeat' }));
      }, PROVIDER_HEARTBEAT_MS);
    });
    socket.on('message', raw => {
      let message; try { message = JSON.parse(raw.toString()); } catch { return; }
      const tick = normalizeProviderMessage(message);
      if (tick && this.subscriptions.has(tick.symbol)) this.broadcast(tick);
      if (message.event === 'subscribe-status') this.broadcast({ type: 'subscription', symbol: normalizeSymbol(message.symbol), status: message.status || 'accepted', source: 'twelve-data' });
    });
    socket.on('error', () => {});
    socket.on('close', () => {
      this.connecting = false;
      clearInterval(this.heartbeat);
      this.heartbeat = null;
      if (this.socket === socket) this.socket = null;
      if (!this.closed && this.subscriptions.size) this.scheduleReconnect();
    });
  }

  sendSubscriptions() {
    if (this.socket?.readyState !== WebSocket.OPEN || !this.subscriptions.size) return;
    this.socket.send(JSON.stringify({ action: 'subscribe', params: { symbols: [...this.subscriptions].join(',') } }));
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.closed || !this.subscriptions.size) return;
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer = null; this.connect(); }, RECONNECT_MS);
  }

  disconnect() {
    clearTimeout(this.reconnectTimer); this.reconnectTimer = null;
    clearInterval(this.heartbeat); this.heartbeat = null;
    this.socket?.close(); this.socket = null;
  }

  close() {
    this.closed = true;
    this.disconnect();
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ status: 'ok', service: 'market-ai-trader-v3-realtime', providerConfigured: Boolean(API_KEY) }));
  }
  res.writeHead(404); res.end();
});

const wss = new WebSocketServer({ server, path: '/stream' });
const clients = new Map();
const provider = new TwelveDataProvider(tick => {
  const payload = JSON.stringify(tick);
  for (const client of clients.keys()) if (client.readyState === WebSocket.OPEN) client.send(payload);
});

wss.on('connection', client => {
  clients.set(client, new Set());
  client.send(JSON.stringify({ type: 'gateway', status: API_KEY ? 'READY' : 'UNCONFIGURED', timestamp: Date.now() }));
  client.on('message', raw => {
    let message; try { message = JSON.parse(raw.toString()); } catch { return; }
    if (message.action === 'ping') return client.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
    if (message.action === 'subscribe' && message.symbol) {
      const symbol = normalizeSymbol(message.symbol);
      clients.get(client).add(symbol); provider.add(symbol);
      return client.send(JSON.stringify({ type: 'subscription', symbol, status: 'pending', source: 'gateway' }));
    }
    if (message.action === 'unsubscribe' && message.symbol) {
      const symbol = normalizeSymbol(message.symbol); clients.get(client).delete(symbol);
      if (![...clients.values()].some(set => set.has(symbol))) provider.remove(symbol);
      return client.send(JSON.stringify({ type: 'subscription', symbol, status: 'removed', source: 'gateway' }));
    }
  });
  client.on('close', () => {
    const symbols = clients.get(client) || new Set();
    clients.delete(client);
    for (const symbol of symbols) if (![...clients.values()].some(set => set.has(symbol))) provider.remove(symbol);
  });
});

process.on('SIGTERM', () => { provider.close(); wss.close(); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { provider.close(); wss.close(); server.close(() => process.exit(0)); });

server.listen(PORT, () => console.log(`Realtime gateway listening on ${PORT}`));
