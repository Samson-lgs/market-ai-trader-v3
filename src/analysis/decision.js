// Confluence scoring and the NO-TRADE gate.
// The gate deliberately requires multiple independent confirmations.

const WEIGHTS = {
  structure: 25,
  momentum: 15,
  higherTimeframe: 20,
  liquidity: 15,
  volatility: 10,
  risk: 15
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
  add('risk', factors.risk);

  const direction = bull === bear ? 'NONE' : bull > bear ? 'CALL' : 'PUT';
  const score = Math.max(bull, bear);
  const opposing = Math.min(bull, bear);
  const edge = score - opposing;

  // NO TRADE rules: insufficient score, weak edge, or explicit risk block.
  const blocked = factors.risk === 'BLOCK' || score < 65 || edge < 20 || factors.higherTimeframe === 'CONFLICT';
  return {
    decision: blocked ? 'NO TRADE' : direction,
    score,
    edge,
    blocked,
    reason: blocked ? 'Confluence is insufficient or risk filters are blocking the setup.' : 'Independent factors align strongly enough for a candidate setup; validate execution conditions.'
  };
}
