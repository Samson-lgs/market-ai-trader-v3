const ALLOWED_INTERVALS = new Set(['1min','5min','15min','30min','1h','4h','1day']);
const MAX_OUTPUTSIZE = 500;
const DEFAULT_OUTPUTSIZE = 200;

function responseHeaders(origin) {
  const allowed = String(process.env.ALLOWED_ORIGIN || '*').split(',').map(x => x.trim()).filter(Boolean);
  const allowOrigin = allowed.includes('*') ? '*' : (allowed.includes(origin) ? origin : allowed[0] || '*');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
}
function response(statusCode, body, origin) { return { statusCode, headers: responseHeaders(origin), body: JSON.stringify(body) }; }
function cleanSymbol(value) { return String(value || '').trim().toUpperCase(); }

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: responseHeaders(origin), body: '' };
  if (event.httpMethod !== 'GET') return response(405, { error: 'Method not allowed.' }, origin);

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return response(503, { error: 'Market data provider is not configured on the server.' }, origin);
  const symbol = cleanSymbol(event.queryStringParameters?.symbol);
  const interval = String(event.queryStringParameters?.interval || '15min').toLowerCase();
  const requestedSize = Number(event.queryStringParameters?.outputsize || DEFAULT_OUTPUTSIZE);
  if (!symbol || symbol.length > 30 || !/^[A-Z0-9 ./&_-]+$/.test(symbol)) return response(400, { error: 'Invalid symbol.' }, origin);
  if (!ALLOWED_INTERVALS.has(interval)) return response(400, { error: 'Unsupported interval.' }, origin);
  if (!Number.isInteger(requestedSize) || requestedSize < 20 || requestedSize > MAX_OUTPUTSIZE) return response(400, { error: `outputsize must be an integer from 20 to ${MAX_OUTPUTSIZE}.` }, origin);

  const url = new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol', symbol); url.searchParams.set('interval', interval); url.searchParams.set('outputsize', String(requestedSize)); url.searchParams.set('apikey', apiKey);
  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await upstream.json();
    if (!upstream.ok || data.status === 'error') { console.error('Provider error', { status: upstream.status, message: data.message }); return response(502, { error: 'Market data provider returned an error.' }, origin); }
    const values = Array.isArray(data.values) ? data.values : [];
    const candles = values.map(row => ({ datetime: row.datetime, open: Number(row.open), high: Number(row.high), low: Number(row.low), close: Number(row.close), volume: row.volume == null ? null : Number(row.volume) })).filter(c => [c.open,c.high,c.low,c.close].every(Number.isFinite));
    if (candles.length < 40) return response(502, { error: 'Provider returned insufficient usable candle history.' }, origin);
    candles.reverse();
    return response(200, { symbol, interval, candles, source: 'twelve-data', fetchedAt: new Date().toISOString() }, origin);
  } catch (error) { console.error('Proxy request failed', error); return response(502, { error: 'Unable to retrieve market data.' }, origin); }
};
