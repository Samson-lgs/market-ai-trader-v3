# Live architecture

```text
GitHub Pages frontend
        |
        | HTTPS / JSON
        v
Netlify Functions
  |             |
  v             v
Twelve Data   Economic Calendar
```

The browser never receives either provider credential. The backend validates symbols/intervals, normalizes provider responses, and applies CORS restrictions.

GitHub Pages remains usable in safe simulated mode if the public backend URL is not configured. This avoids misleading `LIVE` status when the serverless backend is unavailable.
