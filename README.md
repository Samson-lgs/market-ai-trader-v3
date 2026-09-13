# Market AI Trader V3

A static decision-intelligence dashboard for multi-timeframe market analysis.

## Current status
- Frontend dashboard lives in this dedicated repository.
- Current feed is deterministic demo data; it is intentionally labeled as simulated.
- No trading orders are placed by this project.

## Live-data architecture
GitHub Pages can host the frontend, but API credentials should not be embedded in browser JavaScript. Add a secure server-side data proxy (for example a serverless function) that reads the market-data provider key from an environment secret and returns only the data needed by the UI.

Suggested pipeline:

`Market data provider -> secure backend/proxy -> WebSocket/REST -> Market AI Trader UI`

The analysis engine can then calculate EMA/SMA trend, RSI, MACD, ATR, ADX, Bollinger Bands, volatility regime, support/resistance, multi-timeframe agreement, and a confidence score. The confidence score should never be presented as a guaranteed probability of profit.

## Safety
This is an analysis/education interface, not financial advice. Forex, crypto and leveraged products can result in substantial losses. Add paper-trading/backtesting before considering any execution integration.
