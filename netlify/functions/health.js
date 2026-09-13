const allowedOrigins = String(process.env.ALLOWED_ORIGIN || '*')
  .split(',').map(x => x.trim()).filter(Boolean);

function headers(origin) {
  const allow = allowedOrigins.includes('*') ? '*' : (allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(origin), body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: headers(origin), body: JSON.stringify({ error: 'Method not allowed.' }) };

  return {
    statusCode: 200,
    headers: headers(origin),
    body: JSON.stringify({
      status: 'ok',
      service: 'market-ai-trader-v3',
      marketDataConfigured: Boolean(process.env.TWELVE_DATA_API_KEY),
      calendarConfigured: Boolean(process.env.CALENDAR_API_URL),
      timestamp: new Date().toISOString()
    })
  };
};
