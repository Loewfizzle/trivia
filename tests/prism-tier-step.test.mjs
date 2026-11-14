// SKINS 2A — THE TIER STEP (docs/prism.md "THE TIERS"; docs/games/plan.md "SKINS 2A"): on AUTO a slow phone BY DAY used to step straight from
// tier 3 to tier 0 — the world's silhouettes + the extra particles went TOGETHER with the board's 3×. The owner's order: THE EXTRAS FIRST (an
// intermediate step — the board stays 3×), THE BOARD's SHARPNESS LAST.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TIERS, TOP_TIER, LITE_TIER, dayClass, stepTier, tierOf } from '../js/games/prism/tiers.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** what a page skin shows at a tier: its extras (the silhouettes — view.js's `lite`; the particles — the fx's lean cap) + the board's ratio */
const shows = t => ({ extras: !(t <= LITE_TIER), particles: tierOf(t).sparks > 100, board: tierOf(t).board });

test('BY DAY, DOWN: the extras drop FIRST (the board still 3×), the board\'s sharpness LAST — 3 → 1 → 0', () => {
  const path = [TOP_TIER];
  for (let i = 0; i < 6; i++) { const d = stepTier(path[path.length - 1], -1, 'crayon'); if (d === path[path.length - 1]) break; path.push(d); }
  assert.deepEqual(path, [3, 1, 0]);
  assert.deepEqual(shows(3), { extras: true, particles: true, board: 3 });
  assert.deepEqual(shows(1), { extras: false, particles: false, board: 3 }, 'the intermediate step: the silhouettes + the extra particles gone, the board untouched');
  assert.deepEqual(shows(0), { extras: false, particles: false, board: 2 }, 'the last step: the board\'s 2×');
  // (from the middle of the top class too — a manual tier 2)
  assert.equal(stepTier(2, -1, 'crayon'), 1);
  // never the old jump: no day step down drops the extras AND the board's ratio at once
  for (let t = 1; t <= TOP_TIER; t++) {
    const d = stepTier(t, -1, 'crayon'), a = shows(t), b = shows(d);
    assert.ok(!(a.extras && !b.extras && a.board !== b.board), `day ${t} → ${d}: the extras and the 3× never go together`);
    assert.ok(a.board === b.board || !a.extras, `day ${t} → ${d}: the board's ratio only moves once the extras are already off`);
  }
});

test('BY DAY, UP: the board\'s 3× comes back first, the extras last — 0 → 1 → 3; the classes; the night is untouched (one tier at a time)', () => {
  assert.equal(stepTier(0, 1, 'crayon'), 1);
  assert.equal(stepTier(1, 1, 'crayon'), TOP_TIER, 'to the top of the full class');
  assert.equal(stepTier(TOP_TIER, 1, 'crayon'), TOP_TIER);
  assert.equal(stepTier(0, -1, 'crayon'), 0);
  assert.deepEqual([0, 1, 2, 3].map(dayClass), [0, 1, 2, 2]);
  assert.equal(LITE_TIER, 1);
  assert.ok(TIERS[LITE_TIER].sparks <= 100 && TIERS[LITE_TIER + 1].sparks > 100, 'the fx\'s lean cap (≤ 100 particles) switches at the same tier as the page\'s `lite`');
  assert.equal(TIERS[LITE_TIER].board, 3, 'the intermediate tier keeps the full board');
  for (let t = 0; t <= TOP_TIER; t++) for (const dir of [-1, 1]) assert.equal(stepTier(t, dir, 'neon'), Math.max(0, Math.min(TOP_TIER, t + dir)));
});

test('the view: the cheap step arms no cap probe + is judged again after a few frames; the probe goes back to where the descent began; `lite` + the fx read the same tier', () => {
  const v = read('js/games/prism/view.js');
  assert.match(v, /const cheap = tierLook === 'crayon' && tierOf\(down\)\.board === tierOf\(tier\)\.board;/);
  assert.match(v, /if \(cheap\) \{ if \(descentFrom == null\) descentFrom = tier; \}\n      else \{\n        if \(!capped && !capProbe\) capProbe = \{ from: descentFrom != null \? descentFrom : tier, /);
  assert.match(v, /tierCool = cheap \? 8 : 30;/, 'a slow phone still reaches the 2× board quickly');
  assert.match(v, /lite: !!\(pg && pg\.lite\) && tier <= LITE_TIER \}\);/);
  assert.match(v, /const tierLook = skin\.world === 'page' \? 'crayon' : 'neon';/, 'every PAGE skin (crayon · watercolor · paper) steps the day\'s way');
  for (const f of ['waterfx.js', 'paperfx.js']) assert.match(read(`js/games/prism/${f}`), /const lean = \(\) => cap <= 100;/);
});
