import { CALENDAR_API_BASE_URL } from '../config.js';

const CACHE_MS=60000;
const REQUEST_TIMEOUT_MS=6000;
const cache=new Map();
function currenciesForSymbol(symbol=''){const parts=String(symbol).toUpperCase().split('/');return parts.length===2?parts:[]}
export async function loadNewsRisk(symbol){
  const key=String(symbol||'').toUpperCase(),cached=cache.get(key);
  if(cached&&Date.now()-cached.timestamp<CACHE_MS)return cached.data;
  if(globalThis.location?.hostname?.endsWith('.github.io')&&!CALENDAR_API_BASE_URL)return {level:'UNKNOWN',events:[],fetchedAt:new Date().toISOString()};
  const currencies=currenciesForSymbol(symbol),params=new URLSearchParams({symbol:key,currencies:currencies.join(','),horizonMinutes:'180'}),base=CALENDAR_API_BASE_URL||'/.netlify/functions',controller=new AbortController(),timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
  try{
    const response=await fetch(`${base.replace(/\/$/,'')}/calendar?${params}`,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('Economic calendar unavailable.');
    const data=await response.json(),result={level:['LOW','MEDIUM','HIGH'].includes(data.level)?data.level:'UNKNOWN',events:Array.isArray(data.events)?data.events:[],fetchedAt:data.fetchedAt||new Date().toISOString()};
    cache.set(key,{timestamp:Date.now(),data:result});return result;
  }catch(error){
    return {level:'UNKNOWN',events:[],fetchedAt:new Date().toISOString(),error:error?.name==='AbortError'?'Economic calendar timed out.':'Economic calendar unavailable.'};
  }finally{clearTimeout(timer)}
}
export function clearNewsCache(){cache.clear()}
