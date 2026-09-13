# Persistent Realtime Gateway

The browser cannot safely hold the provider API key. Deploy `realtime-server.js` to a persistent Node/WebSocket-capable service.

Environment:

- `PORT`
- `TWELVE_DATA_WS_URL`
- `TWELVE_DATA_API_KEY`

The gateway exposes `/health` and `/stream`. Provider forwarding must normalize upstream messages before broadcasting ticks. The current scaffold intentionally does not fabricate provider data.

Netlify Functions remain the REST/API layer; use a WebSocket-capable host for this persistent process.
