const ALLOWED_INTERVALS = new Set(['1min','5min','15min','30min','1h','4h','1day']);
const MAX_OUTPUTSIZE = 500;
const DEFAULT_OUTPUTSIZE = 200;

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

function response(statusCode, body) {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}

function cleanSymbol(value) {
  return String(value || '').trim().toUpperCase();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'GET') return response(405, { error: 'Method not allowed.' });

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return response(503, { error: 'Market data provider is not configured on the server.' });

  const symbol = cleanSymbol(event.queryStringParameters?.symbol);
  const interval = String(event.queryStringParameters?.interval || '15min').toLowerCase();
  const requestedSize = Number(event.queryStringParameters?.outputsize || DEFAULT_OUTPUTSIZE);

  if (!symbol || symbol.length > 30 || !/^[A-Z0-9 ./&_-]+$/.test(symbol)) {
    return response(400, { error: 'Invalid symbol.' });
  }
  if (!ALLOWED_INTERVALS.has(interval)) {
    return response(400, { error: 'Unsupported interval.' });
  }
  if (!Number.isInteger(requestedSize) || requestedSize < 20 || requestedSize > MAX_OUTPUTSIZE) {
    return response(400, { error: `outputsize must be an integer from 20 to ${MAX_OUTPUTSIZE}.` });
  }

  const url = new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('outputsize', String(requestedSize));
  url.searchParams.set('apikey', apiKey);

  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await upstream.json();

    if (!upstream.ok || data.status === 'error') {
      console.error('Provider error', { status: upstream.status, message: data.message });
      return response(502, { error: 'Market data provider returned an error.' });
    }

    const values = Array.isArray(data.values) ? data.values : [];
    const candles = values.map(row => ({
      datetime: row.datetime,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: row.volume == null ? null : Number(row.volume),
    })).filter(c => [c.open, c.high, c.low, c.close].every(Number.isFinite));

    if (!candles.length) return response(502, { error: 'Provider returned no usable candles.' });

    candles.reverse();
    return response(200, {
      symbol,
      interval,
      candles,
      source: 'twelve-data',
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Proxy request failed', error);
    return response(502, { error: 'Unable to retrieve market data.' });
  }
};
