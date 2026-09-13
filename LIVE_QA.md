# Live end-to-end QA

1. Health endpoint returns `status: ok`.
2. Market endpoint returns at least 40 candles per requested timeframe.
3. Frontend receives all five timeframes.
4. Frontend shows LIVE only after all required market requests succeed.
5. Calendar errors remain UNKNOWN rather than fabricated.
6. CORS accepts only configured frontend origins.
7. No provider key appears in network requests from the browser.
