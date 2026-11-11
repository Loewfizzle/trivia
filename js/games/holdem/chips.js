// HOLD'EM — THE CHIPS' ARITHMETIC (HE5 — docs/holdem.md "THE CHIPS"), PURE: an amount → a small set of STACKS in the six colours (the
// fewest chips — the six values are a canonical set, so taking the biggest first IS the fewest), capped so a stack never towers and a bet
// never sprawls. The AMOUNT label always rides beside the stacks (the exact number — a capped stack only draws fewer chips).
//   5 red · 25 green · 100 black · 500 purple · 1K yellow · 5K orange
export const DENOMS = Object.freeze([[5000, 'orange'], [1000, 'yellow'], [500, 'purple'], [100, 'black'], [25, 'green'], [5, 'red']]);
export const COLORS = Object.freeze(['red', 'green', 'black', 'purple', 'yellow', 'orange']);
/** a bet: ≤ 3 stacks of ≤ 6 · a pot: bigger, still capped (THE SIZE — the view's `d` per place) */
export const BET = Object.freeze({ maxStacks: 3, maxPer: 6 });
export const POT = Object.freeze({ maxStacks: 3, maxPer: 8 });

/**
 * → [{ color, value, n }] left → right, the biggest value first (a value whose count passes maxPer splits into more stacks of it);
 * at most maxStacks stacks, each ≤ maxPer chips. An amount under 5 (never a real bet) still shows one red chip; 0 → [].
 */
export function chipStacks(amount, { maxStacks = BET.maxStacks, maxPer = BET.maxPer } = {}) {
  let left = Math.max(0, Math.round(Number(amount) || 0));
  if (!left) return [];
  const out = [];
  for (const [value, color] of DENOMS) {
    let n = Math.floor(left / value);
    left -= n * value;
    while (n > 0 && out.length < maxStacks) { const k = Math.min(maxPer, n); out.push({ color, value, n: k }); n -= k; }
    if (out.length >= maxStacks) break;
  }
  if (!out.length) out.push({ color: 'red', value: 5, n: 1 });
  return out;
}

/** the chips a breakdown draws (for the tests + the size of the art) */
export const chipCount = stacks => stacks.reduce((n, s) => n + s.n, 0);
