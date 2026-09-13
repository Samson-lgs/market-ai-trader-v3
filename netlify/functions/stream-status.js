function cors(request) {
  const origin = request.headers.get('origin') || '';
  const allowed = (process.env.ALLOWED_ORIGIN || '*').split(',').map(x => x.trim());
  return allowed.includes('*') || allowed.includes(origin) ? (allowed.includes('*') ? '*' : origin) : 'null';
}

export default async function handler(request) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': cors(request), 'Access-Control-Allow-Methods': 'GET,OPTIONS' };
  if (request.method === 'OPTIONS') return new Response('', { status: 204, headers });
  if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'method-not-allowed' }), { status: 405, headers });
  return new Response(JSON.stringify({ service: 'market-ai-trader-v3-stream', providerConfigured: Boolean(process.env.TWELVE_DATA_WS_URL), provider: process.env.TWELVE_DATA_WS_URL ? 'configured' : 'not-configured', checkedAt: new Date().toISOString() }), { status: 200, headers });
}
