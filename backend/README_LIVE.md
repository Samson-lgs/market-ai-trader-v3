# Backend production checklist

The Netlify functions in this repository are designed to be deployed as a server-side proxy. Configure credentials in the hosting provider, not in the frontend.

Required:
- `TWELVE_DATA_API_KEY`
- `CALENDAR_API_URL`
- `ALLOWED_ORIGIN`

Optional:
- `CALENDAR_API_KEY`

Health endpoint:
`/.netlify/functions/health`

Market endpoint:
`/.netlify/functions/candles?symbol=EUR%2FUSD&interval=15min&outputsize=200`

Calendar endpoint:
`/.netlify/functions/calendar?symbol=EUR%2FUSD&horizonMinutes=180`
