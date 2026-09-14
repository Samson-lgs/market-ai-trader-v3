const HORIZONS=[5,10,15,30,60];
function clamp(v,a=0,b=100){return Math.max(a,Math.min(b,v))}
function last(a){return Array.isArray(a)&&a.length?a[a.length-1]:null}
function trendScore(candles){if(!Array.isArray(candles)||candles.length<20)return 0;const c=candles.slice(-20),first=Number(c[0].close),lastp=Number(last(c).close);if(!Number.isFinite(first)||!Number.isFinite(lastp))return 0;return clamp(((lastp-first)/first)*10000,-20,20)}
function momentumScore(frame){const rsi=Number(frame?.rsi),m=Number(frame?.macd?.histogram??frame?.macd?.hist??frame?.macd?.value??0);let s=0;if(Number.isFinite(rsi))s+=(rsi-50)*0.55;if(Number.isFinite(m))s+=m>0?8:-8;return clamp(s,-30,30)}
function biasScore(bias){return bias==='BULLISH'?24:bias==='BEARISH'?-24:0}
function horizonPenalty(minutes){if(minutes<=5)return 0;if(minutes<=10)return 2;if(minutes<=15)return 5;if(minutes<=30)return 9;return 14}
export function expiryForecasts({analysis,candles,newsRisk='UNKNOWN',sessionLevel='NORMAL'}={}){
 const bias=analysis?.higherTimeframeBias, baseTrend=trendScore(candles?.['5M']), mom=momentumScore(analysis?.frames?.['5M']), b=biasScore(bias), results=[];
 for(const minutes of HORIZONS){
   let score=50+b+baseTrend+mom-horizonPenalty(minutes);
   if(sessionLevel==='ELEVATED')score-=6;
   if(newsRisk==='MEDIUM')score-=7;
   if(newsRisk==='HIGH')score=50;
   score=clamp(Math.round(score),0,100);
   let signal='NO TRADE';
   if(newsRisk!=='HIGH' && bias==='BULLISH' && score>=62)signal='CALL';
   if(newsRisk!=='HIGH' && bias==='BEARISH' && score<=38)signal='PUT';
   if(signal==='NO TRADE')score=Math.max(score,50);
   const strength=signal==='NO TRADE'?'WAIT':score>=85?'S+':score>=78?'S':score>=70?'A':score>=62?'B':'C';
   const reasons=[];
   reasons.push(bias==='BULLISH'?'Higher-timeframe structure is bullish.':bias==='BEARISH'?'Higher-timeframe structure is bearish.':'Higher-timeframe direction is mixed.');
   if(Math.abs(baseTrend)>=4)reasons.push(baseTrend>0?'Recent 5M price pressure is upward.':'Recent 5M price pressure is downward.');
   if(Math.abs(mom)>=6)reasons.push(mom>0?'Momentum supports upside.':'Momentum supports downside.');
   if(minutes>=30)reasons.push('Longer horizon carries more reversal and event risk.');
   if(newsRisk==='UNKNOWN')reasons.push('News risk is unknown; verify the calendar before acting.');
   results.push({minutes,signal,confidence:score,strength,reasons});
 }
 return results;
}
export const expiryHorizons=HORIZONS;
