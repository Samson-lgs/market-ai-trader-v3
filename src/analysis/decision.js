// Confluence scoring and the NO-TRADE gate.
// Risk is a gate, not a bullish/bearish directional factor.

const WEIGHTS = {
  structure: 30,
  momentum: 15,
  higherTimeframe: 25,
  liquidity: 10,
  volatility: 10,
  execution: 10
};

export function scoreCandidate(factors) {
  let bull = 0, bear = 0;
  const add = (factor, direction) => {
    const w = WEIGHTS[factor] || 0;
    if (direction === 'BULLISH') bull += w;
    if (direction === 'BEARISH') bear += w;
  };

  add('structure', factors.structure);
  add('momentum', factors.momentum);
  add('higherTimeframe', factors.higherTimeframe);
  add('liquidity', factors.liquidity);
  add('volatility', factors.volatility);
  add('execution', factors.execution);

  const direction = bull === bear ? 'NONE' : bull > bear ? 'CALL' : 'PUT';
  const score = Math.max(bull, bear);
  const opposing = Math.min(bull, bear);
  const edge = score - opposing;

  const blocked = factors.risk === 'BLOCK'
    || score < 65
    || edge < 20
    || factors.higherTimeframe === 'CONFLICT'
    || direction === 'NONE';

  return {
    decision: blocked ? 'NO TRADE' : direction,
    score,
    edge,
    blocked,
    reason: blocked
      ? 'Confluence is insufficient, conflicting, or risk filters are blocking the setup.'
      : 'Independent factors align strongly enough for a candidate setup; validate execution conditions.'
  };
}
