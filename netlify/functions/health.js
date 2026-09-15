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

  return response(200, {
    ok: true,
    service: 'market-ai-trader-v3',
    marketData: {
      configured: Boolean(process.env.TWELVE_DATA_API_KEY),
      provider: 'twelve-data',
    },
    calendar: {
      configured: Boolean(process.env.CALENDAR_API_URL),
      provider: process.env.CALENDAR_API_URL ? 'configured-provider' : 'not-configured',
    },
    serverTime: new Date().toISOString(),
  });
};
