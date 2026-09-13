# Real-Time Server Stage

Adds the server-side readiness contract for the streaming layer.

`stream-status` reports whether a provider WebSocket URL is configured without exposing credentials or the URL itself.

A provider-specific WebSocket proxy still requires a persistent connection-capable deployment target. Netlify Functions remain suitable for REST endpoints, but should not be treated as a persistent WebSocket server.
