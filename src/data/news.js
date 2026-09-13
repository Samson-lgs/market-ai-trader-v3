import { CALENDAR_API_BASE_URL } from '../config.js';

const CACHE_MS = 60000;
const cache = new Map();
function currenciesForSymbol(symbol=''){const parts=String(symbol).toUpperCase().split('/');return parts.length===2?parts:[]}

export async function loadNewsRisk(symbol){
  const key=String(symbol||'').toUpperCase(),cached=cache.get(key);
  if(cached&&Date.now()-cached.timestamp<CACHE_MS)return cached.data;
  if(globalThis.location?.hostname?.endsWith('.github.io')&&!CALENDAR_API_BASE_URL){
    return {level:'UNKNOWN',events:[],fetchedAt:new Date().toISOString()};
  }
  const currencies=currenciesForSymbol(symbol),params=new URLSearchParams({symbol:key,currencies:currencies.join(','),horizonMinutes:'180'}),base=CALENDAR_API_BASE_URL||'/.netlify/functions',response=await fetch(`${base.replace(/\/$/,'')}/calendar?${params}`);
  if(!response.ok)throw new Error('Economic calendar unavailable.');
  const data=await response.json(),result={level:['LOW','MEDIUM','HIGH'].includes(data.level)?data.level:'UNKNOWN',events:Array.isArray(data.events)?data.events:[],fetchedAt:data.fetchedAt||new Date().toISOString()};
  cache.set(key,{timestamp:Date.now(),data:result});return result
}
export function clearNewsCache(){cache.clear()}
