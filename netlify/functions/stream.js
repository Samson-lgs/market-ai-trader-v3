export default async function handler(request) {
  const origin = request.headers.get('origin') || '';
  const allowed = (process.env.ALLOWED_ORIGIN || '*').split(',').map(x => x.trim());
  const allowOrigin = allowed.includes('*') || allowed.includes(origin) ? (allowed.includes('*') ? '*' : origin) : 'null';
  if (request.method === 'OPTIONS') return new Response('', { status: 204, headers: { 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'GET,OPTIONS' } });
  return new Response(JSON.stringify({ status: 'ready', service: 'market-ai-trader-v3-stream', configured: Boolean(process.env.TWELVE_DATA_WS_URL), message: 'WebSocket gateway contract is ready; provider-specific socket forwarding is enabled only when configured.' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': allowOrigin } });
}
