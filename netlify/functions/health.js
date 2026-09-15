const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

function response(statusCode, body) {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}

exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'GET') return response(405, { error: 'Method not allowed.' });

  const marketConfigured = Boolean(process.env.TWELVE_DATA_API_KEY);
  const calendarConfigured = Boolean(process.env.CALENDAR_API_URL);

  return response(marketConfigured ? 200 : 503, {
    ok: marketConfigured,
    service: 'market-ai-trader-v3',
    marketData: {
      configured: marketConfigured,
      provider: 'twelve-data',
    },
    calendar: {
      configured: calendarConfigured,
      provider: calendarConfigured ? 'configured-provider' : 'not-configured',
    },
    serverTime: new Date().toISOString(),
    error: marketConfigured ? null : 'TWELVE_DATA_API_KEY is not configured on the backend.',
  });
};
