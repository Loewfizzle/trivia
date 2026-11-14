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

/** (SKINS 2A) at or below this tier a PAGE skin has dropped its EXTRAS — the world's silhouettes behind the board (view.js → the page's
 *  `lite`) + the moments' extra particles (the fx's lean cap: `sparks` ≤ 100) — while the board keeps its full 3× */
export const LITE_TIER = 1;
/** a tier's CLASS for a page skin (the day): 2 = everything · 1 = the 3× board, the extras dropped · 0 = the 2× board (the extras stay off) */
export const dayClass = t => { const k = TIERS.indexOf(tierOf(t)); return TIERS[k].board !== TIERS[TOP_TIER].board ? 0 : k <= LITE_TIER ? 1 : 2; };

/** PFIX-B (FABLE REVIEW finding 10): THE STEPS, by look. NIGHT steps one tier at a time (the light first, the board's 3× last). THE DAY LOOK
 *  (a PAGE skin — crayon, watercolor, paper) draws no world shader and no light layer: of a tier it draws only the board's ratio, the effects
 *  canvas, the particles (`sparks`) and its page's extras, and only the board's ratio moves its frame time (the review, at 4× CPU: DAY HEAVY
 *  15 / 17 / 19 / 38.5 fps at tiers 3 / 2 / 1 / 0), so a day step never walks tier by tier.
 *  SKINS 2A — THE TIER STEP (the owner's order: the extras FIRST, the board's sharpness LAST): a day step goes to the next CLASS (dayClass) —
 *  down 3 → 1 (the silhouettes + the extra particles go; the board stays 3×) → 0 (the board's 2×); up 0 → 1 → 3 (the top of its class). It
 *  was 3 → 0 in one step: the extras went TOGETHER with the 3×. (The first step is cheap — it can't make a frame faster: view.js arms no cap
 *  probe on it and waits only a few frames before judging again, so a slow phone still reaches the 2× board in ~3.5 s.)
 *  dir: −1 down · +1 up → the tier to step to (the same tier = nowhere to go). */
export function stepTier(t, dir, look = 'neon') {
  const cur = tierOf(t);
  t = TIERS.indexOf(cur);
  if (look !== 'crayon') return Math.max(0, Math.min(TOP_TIER, t + Math.sign(dir)));
  const c = dayClass(t);
  if (dir < 0) {
    for (let k = t - 1; k >= 0; k--) if (dayClass(k) < c) return k;
    return t;
  }
  for (let k = t + 1; k <= TOP_TIER; k++) {
    if (dayClass(k) <= c) continue;
    let top = k;
    while (top < TOP_TIER && dayClass(top + 1) === dayClass(k)) top++;
    return top;
  }
  return t;
}
/** what the day look draws of a tier (the keys a day step must change at least one of — tests/prism-neon.test.mjs) */
export const DAY_KEYS = Object.freeze(['board', 'fx', 'sparks']);
