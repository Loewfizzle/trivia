// WINDOWS — THE CRATE GUY, THE CHARLESTON, THE BOOKIE (core/harbor-crate.js · harbor-charleston.js · harbor-bookie.js).
// node --test tests/harbor-window-scenes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cratePlan, pileAt, PILE_MAX, CRATE, bulbAt, crateBumps, crateSceneCues, slotOf } from '../js/core/harbor-crate.js';
import { charlestonPlan, stepAt, movesAt } from '../js/core/harbor-charleston.js';
import { bookiePlan } from '../js/core/harbor-bookie.js';
import { scenesTonight } from '../js/core/harbor-scenes.js';

const LEN = 2 * 3600;
test('THE CRATE GUY — the pile grows over the shift to head height (three columns), a different size every glance; the bulb bumps on every crate set down', () => {
  const plan = cratePlan('2026-11-03', LEN);
  assert.deepEqual(cratePlan('2026-11-03', LEN), plan, 'every phone the same');
  const sizes = [0, 0.25, 0.5, 0.75, 0.99].map(f => pileAt(plan, LEN * f));
  for (let i = 1; i < sizes.length; i++) assert.ok(sizes[i] >= sizes[i - 1], 'it only grows');
  assert.ok(sizes[0] === 1 && sizes[4] >= PILE_MAX - 1 && new Set(sizes).size >= 4, `the pile ${sizes.join(' → ')}`);
  assert.equal(slotOf(0).col, 0); assert.equal(slotOf(CRATE.full[0]).col, 1);
  assert.ok(CRATE.full[0] * CRATE.crate[1] >= 0.85, 'the back column reaches head height');
  const kinds = new Set(plan.map(j => j.kind)); for (const k of ['carry', 'pry', 'bottle', 'wipe', 'listen', 'lean']) assert.ok(kinds.has(k), k);
  const bumps = crateBumps(plan); assert.equal(bumps.length, plan.filter(j => j.kind === 'carry').length + 1);
  assert.ok(Math.abs(bulbAt(bumps[3] + 0.6, bumps).a) > Math.abs(bulbAt(bumps[3] - 3, bumps).a), 'a crate set down swings the bulb more');
  const sc = scenesTonight('2026-11-03', { all: true }).find(x => x.id === 'crate'), cues = crateSceneCues(sc, sc.start, sc.start + 30, '2026-11-03');
  assert.ok(cues.length === 1 && cues[0].slot === 'crates-clink', 'the first crate set down in his entrance is heard');
});

test('THE CHARLESTON — a rehearsal with every step, the combination missed then nailed, the chair now + then; the fringe swings with the kicks', () => {
  const plan = charlestonPlan('2026-11-03', 3 * 3600);
  assert.deepEqual(charlestonPlan('2026-11-03', 3 * 3600), plan);
  const kinds = new Set(plan.map(s => s.kind)); for (const k of ['basic', 'kicks', 'knees', 'swing', 'breather', 'fix', 'combo', 'chair']) assert.ok(kinds.has(k), k);
  const miss = plan.findIndex(s => s.try === 'miss'); assert.ok(miss >= 0 && plan[miss + 2].try === 'nail', 'tried, a breath, then nailed');
  const k = plan.find(s => s.kind === 'kicks'); let maxKick = 0; for (let e = 0; e < 4; e += 0.02) maxKick = Math.max(maxKick, ...movesAt(k, e).kick);
  assert.ok(maxKick > 0.9, 'big kicks');
  assert.ok(plan.filter(s => s.kind === 'chair').length <= 8, 'the chair is now + then');
  assert.ok(stepAt(plan, 1000).seg);
});

test('THE BOOKIE — takes bets all night; the bad call is RARE (the highlight, never the loop)', () => {
  const plan = bookiePlan('2026-11-03', 3 * 3600), kinds = new Set(plan.map(s => s.kind));
  assert.deepEqual(bookiePlan('2026-11-03', 3 * 3600), plan);
  for (const k of ['write', 'count', 'call', 'pace', 'smoke', 'lean']) assert.ok(kinds.has(k), k);
  const bad = plan.filter(s => s.kind === 'bad'); assert.ok(bad.length >= 1 && bad.length <= 4, `${bad.length} bad calls in 3 h`);
  assert.ok(bad.every(s => s.t0 >= 600), 'never in his first 10 minutes');
});
