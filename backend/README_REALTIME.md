# Realtime Backend

Persistent Node/WebSocket gateway scaffold for Market AI Trader V3.

It deliberately separates provider credentials from the browser and provides a `/stream` WebSocket endpoint plus `/health` readiness endpoint. Provider-specific forwarding is the final deployment integration step.
