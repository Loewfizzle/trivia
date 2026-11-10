// PRISM DROP — THE QUALITY TIERS (PD-3; docs/prism.md "THE TIERS"). PURE. The view starts at the TOP tier and steps DOWN one tier while the p75
// frame stays > 19.5 ms (view.js#trackPerf), back up after ~4 s of headroom. The order is the owner's: the moving LIGHT (bloom → spill → the
// particles) steps down FIRST; the world loses resolution + detail; the board's full 3× goes ONLY at the last step (tier 0 → 2×).
//   board   the board canvas's pixel ratio cap (layout.js#prismLayout → boardDpr)      fx      the shards' canvas (fx.js) pixel ratio cap
//   world   the world shader's resolution (× the screen's real pixels, DPR capped at 2) oct     the world's fbm octaves
//   light   the light layer's resolution (× CSS px)    bloom   its GPU bloom levels (0–3)    spill   the falling piece's coloured light
//   sparks  the light layer's spark cap               shards  fx.js's shard cap             glow    the stack's baked glow ring on (1) / off (0)
export const TIERS = Object.freeze([
  Object.freeze({ board: 2, fx: 1, world: 0.24, oct: 1, light: 0.5, bloom: 0, spill: false, sparks: 40, shards: 40, glow: 0 }),
  Object.freeze({ board: 3, fx: 1, world: 0.28, oct: 2, light: 0.5, bloom: 0, spill: false, sparks: 90, shards: 80, glow: 1 }),
  Object.freeze({ board: 3, fx: 1.5, world: 0.34, oct: 3, light: 0.75, bloom: 2, spill: true, sparks: 160, shards: 130, glow: 1 }),
  Object.freeze({ board: 3, fx: 2, world: 0.45, oct: 4, light: 1, bloom: 3, spill: true, sparks: 260, shards: 200, glow: 1 }),
]);
export const TOP_TIER = TIERS.length - 1;
export const tierOf = t => TIERS[Math.max(0, Math.min(TOP_TIER, t | 0))];

/** PFIX-B (FABLE REVIEW finding 10): THE STEPS, by look. NIGHT steps one tier at a time (the light first, the board's 3× last). THE DAY LOOK
 *  (crayon) draws no world and no light layer: of a tier it draws only the board's ratio, the effects canvas and the crumbs (`sparks`), and only
 *  the board's ratio moves its frame time (the review, at 4× CPU: DAY HEAVY 15 / 17 / 19 / 38.5 fps at tiers 3 / 2 / 1 / 0 — 15.5 s on AUTO to
 *  reach the one that helps). So by day a step goes straight to the next tier whose BOARD differs — down 3 → 0, up 0 → 3 (the top of its class).
 *  dir: −1 down · +1 up → the tier to step to (the same tier = nowhere to go). */
export function stepTier(t, dir, look = 'neon') {
  const cur = tierOf(t);
  t = TIERS.indexOf(cur);
  if (look !== 'crayon') return Math.max(0, Math.min(TOP_TIER, t + Math.sign(dir)));
  if (dir < 0) {
    for (let k = t - 1; k >= 0; k--) if (TIERS[k].board !== cur.board) return k;
    return t;
  }
  for (let k = t + 1; k <= TOP_TIER; k++) {
    if (TIERS[k].board === cur.board) continue;
    let top = k;
    while (top < TOP_TIER && TIERS[top + 1].board === TIERS[k].board) top++;
    return top;
  }
  return t;
}
/** what the day look draws of a tier (the keys a day step must change at least one of — tests/prism-neon.test.mjs) */
export const DAY_KEYS = Object.freeze(['board', 'fx', 'sparks']);
