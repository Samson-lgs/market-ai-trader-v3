# Market AI Trader V4

Market AI Trader V4 is a web-based market analysis assistant. It reads market prices, studies several timeframes, checks trend, momentum, liquidity, price structure, trading sessions and news risk, and produces a simple result: CALL, PUT or NO TRADE.

## In simple words

- CALL: the model sees stronger upward pressure.
- PUT: the model sees stronger downward pressure.
- NO TRADE: the market is mixed or risky and the model recommends waiting.

The purpose is to turn a large amount of market information into something a trader can understand quickly. It is a forecasting tool, not a machine that knows the future.

## Assets

V4 is designed for supported Forex, crypto, commodities and index symbols, for example:

EUR/USD, GBP/USD, USD/JPY, BTC/USD, ETH/USD, XAU/USD, XAG/USD and NIFTY.

The dashboard also supports custom symbols when the connected market-data provider supports them.

## Forecast time horizons

V4 gives separate forecasts for:

| Horizon | Meaning |
| --- | --- |
| 5 min | Very short-term direction |
| 10 min | Short-term direction |
| 15 min | Short-term direction |
| 30 min | Medium short-term direction |
| 60 min | Longer short-term direction |

Example:

```text
5 MIN   -> CALL
10 MIN  -> CALL
15 MIN  -> CALL
30 MIN  -> NO TRADE
60 MIN  -> PUT
```

The horizons are calculated separately because a market can look bullish for a few minutes and still face resistance over a longer period.

## What does the AI check?

### 1. Multiple timeframes

The main analysis uses:

1H -> 30M -> 15M -> 5M -> 1M

Higher timeframes provide the big picture. Lower timeframes help identify short-term momentum and possible entries.

### 2. Market structure

The engine checks:

- Higher highs and higher lows
- Lower highs and lower lows
- Bullish and bearish structure
- Break of Structure (BOS)
- Change of Character (CHOCH)
- Support and resistance

### 3. Momentum and indicators

The project calculates:

- EMA
- SMA
- RSI
- MACD
- ATR

These help measure trend strength, momentum and volatility.

### 4. Liquidity and price behaviour

The engine checks:

- Equal highs and lows
- Liquidity pools
- Liquidity sweeps
- Displacement moves
- Supply zones
- Demand zones

### 5. Trading sessions

Session context is included because market behaviour changes between Asian, London and New York sessions.

### 6. Economic news

The project supports an economic-calendar provider and uses:

LOW, MEDIUM, HIGH and UNKNOWN risk states.

High-impact news can block a setup rather than forcing a trade call.

## How a signal is produced

```text
Real market data
      |
      v
Multi-timeframe analysis
      |
      v
Trend + structure
      |
      v
Momentum
      |
      v
Liquidity / BOS / CHOCH
      |
      v
Supply + demand
      |
      v
Session conditions
      |
      v
News risk
      |
      v
Setup quality + risk checks
      |
      v
CALL / PUT / NO TRADE
```

NO TRADE is a valid output. The system should not invent a trade just because the user clicked Scan.

## What appears on the dashboard?

### Primary Decision

The main panel shows:

CALL / PUT / NO TRADE

It also shows a model score, entry information when available, invalidation/stop information, target information and the reasons behind the decision.

### AI Expiry Forecast

V4 shows the five horizons together:

5m, 10m, 15m, 30m and 60m.

Each horizon has its own directional result and model score.

### Price chart

The dashboard displays OHLC candles. When the realtime backend is connected, new price ticks can update the active 1-minute candle and higher-timeframe candles derived from it.

## Live market data

The browser does not contain the market-data API key.

```text
Browser
   |
   v
Secure backend / proxy
   |
   v
Market-data provider
   |
   v
Candles + realtime ticks
   |
   v
V4 analysis engine
   |
   v
Dashboard
```

Twelve Data is supported through a server-side variable such as:

```text
TWELVE_DATA_API_KEY=your_key_here
```

Never put a real provider key in frontend files or commit it to GitHub.

## Realtime backend

V4 includes a WebSocket gateway for realtime prices. It provides symbol subscriptions, tick forwarding, heartbeats, automatic reconnects, tick normalization, client cleanup and a health endpoint.

A GitHub Pages frontend alone cannot run this server-side service. The realtime gateway needs to be deployed separately and its public WSS URL must be configured for the frontend.

## When live data is unavailable

The app is designed to fail safely instead of pretending that demo data is live data. During development it can use clearly labelled demo or simulated data when the provider is unavailable.

## Backtesting

V4 includes a Backtest Lab. Backtesting means running the strategy on historical candles to see how it would have behaved.

The project can calculate:

- Number of trades
- Wins and losses
- Win rate
- Net R
- Expectancy
- Profit factor
- Maximum drawdown
- Maximum losing streak

The backtest engine uses chronological walk-forward processing and avoids using future candles for earlier decisions.

## Performance Intelligence

The Performance Intelligence area studies completed backtest trades and compares results by setup type, grade, CALL or PUT side, session, score range, symbol and news-risk state.

This helps answer questions such as: Which setups historically performed better? Which setups performed poorly?

Historical performance is evidence from past data, not a guarantee about future trades.

## Project structure

```text
Market AI Trader V4
|
+-- index.html                 Main dashboard
+-- app.js                    Dashboard logic
+-- styles.css                UI styling
|
+-- src/analysis/
|   +-- indicators.js         EMA / RSI / MACD / ATR
|   +-- structure.js          Market structure / levels
|   +-- liquidity.js          Sweeps / displacement
|   +-- smartMoney.js         BOS / CHOCH / zones / pools
|   +-- setups.js             Setup detection and ranking
|   +-- mtf.js                Multi-timeframe analysis
|   +-- expiry.js             5-60 minute forecasts
|   +-- professional.js       Session / quality / risk
|   +-- events.js             News risk
|   +-- backtest.js           Historical testing
|   +-- performance.js        Performance analysis
|
+-- src/data/
|   +-- live.js               Market candle loading
|   +-- news.js               Economic calendar loading
|   +-- realtime.js            Browser realtime client
|
+-- netlify/functions/
|   +-- candles.js            Secure market-data proxy
|   +-- calendar.js            Economic-calendar proxy
|
+-- backend/
    +-- realtime-server.js    WebSocket realtime gateway
```

## Running locally

Use a local web server rather than opening the HTML file directly.

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

For real market data, configure and deploy the backend with the required provider credentials.

## Security

Keep all secrets on the server. Do not commit:

```text
TWELVE_DATA_API_KEY
CALENDAR_API_KEY
.env files containing real credentials
```

## V4 status

V4 is the next version of Market AI Trader. It adds live-data architecture, realtime price streaming support and multi-horizon CALL / PUT / NO TRADE forecasting on top of the earlier market-structure, liquidity, setup-ranking, backtesting and performance work.

The V4 work is kept on a separate branch while it is tested.

V4 Pull Request:
https://github.com/Samson-lgs/market-ai-trader-v3/pull/12

## Responsible use

This project is an analysis and education tool, not financial advice and not an automated order-execution system.

No technical system can guarantee the exact future direction of a market. Forex, crypto, leveraged products and binary or digital options can cause rapid and substantial losses. Always verify market data, understand the product, test the strategy and use appropriate risk controls before risking real money.
