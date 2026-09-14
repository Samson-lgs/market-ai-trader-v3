export async function serveCandles(url, res, apiKey) {
  const symbol=String(url.searchParams.get('symbol')||'').trim().toUpperCase();
  const interval=String(url.searchParams.get('interval')||'15min').toLowerCase();
  const output=Number(url.searchParams.get('outputsize')||200);
  const intervals=new Set(['1min','5min','15min','30min','1h','4h','1day']);
  const send=(status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(body));};
  if(!apiKey)return send(503,{error:'Twelve Data API key is not configured.'});
  if(!symbol||symbol.length>40||!/^[A-Z0-9 ./&_-]+$/.test(symbol))return send(400,{error:'Invalid symbol.'});
  if(!intervals.has(interval)||!Number.isInteger(output)||output<40||output>500)return send(400,{error:'Invalid interval or outputsize.'});
  const target=new URL('https://api.twelvedata.com/time_series');
  target.searchParams.set('symbol',symbol);target.searchParams.set('interval',interval);target.searchParams.set('outputsize',String(output));target.searchParams.set('apikey',apiKey);
  try{
    const upstream=await fetch(target,{headers:{accept:'application/json'},cache:'no-store'});
    const data=await upstream.json();
    if(!upstream.ok||data.status==='error')return send(502,{error:'Market provider error.'});
    const candles=(Array.isArray(data.values)?data.values:[]).map(r=>({datetime:r.datetime,open:Number(r.open),high:Number(r.high),low:Number(r.low),close:Number(r.close),volume:Number(r.volume||0)})).filter(c=>[c.open,c.high,c.low,c.close].every(Number.isFinite)).reverse();
    if(candles.length<40)return send(502,{error:`Only ${candles.length} usable candles returned.`});
    return send(200,{symbol,interval,candles,source:'twelve-data',fetchedAt:new Date().toISOString()});
  }catch(error){console.error('Candle proxy error',error);return send(502,{error:'Unable to retrieve market data.'});}
}
