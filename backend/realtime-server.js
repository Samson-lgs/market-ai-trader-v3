import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const PROVIDER_WS_URL = process.env.TWELVE_DATA_WS_URL || '';
const API_KEY = process.env.TWELVE_DATA_API_KEY || '';

if (!PROVIDER_WS_URL || !API_KEY) console.warn('Realtime provider is not configured; gateway starts in readiness mode.');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ status: 'ok', service: 'market-ai-trader-v3-realtime', providerConfigured: Boolean(PROVIDER_WS_URL && API_KEY) }));
  }
  res.writeHead(404); res.end();
});

const wss = new WebSocketServer({ server, path: '/stream' });
const clients = new Set();

wss.on('connection', client => {
  clients.add(client);
  client.on('message', raw => {
    let message; try { message = JSON.parse(raw.toString()); } catch { return; }
    if (message.action === 'ping') return client.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
    if (message.action === 'subscribe' && message.symbol) client.send(JSON.stringify({ type: 'subscription', symbol: message.symbol, status: 'accepted' }));
  });
  client.on('close', () => clients.delete(client));
});

// Provider-specific forwarding is intentionally isolated here. A production deployment should
// create one authenticated provider socket per upstream session and broadcast normalized ticks.
server.listen(PORT, () => console.log(`Realtime gateway listening on ${PORT}`));
