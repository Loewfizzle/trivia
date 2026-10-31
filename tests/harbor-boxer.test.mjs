// SKY-B — THE SHADOWBOXER: core/harbor-boxer.js (his nights, his sets + rounds, the end of his night, Friday, his sounds). PURE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boxerNight, boxerPlan, boxerForced, boxerAt, roundOf, swingAt, boxerCues } from '../js/core/harbor-boxer.js';
import { knob } from '../js/core/harbor-schedule.js';

const P = knob('boxer'), H = h => h * 3600;
// Oct 2026: Mon 26, Tue 27, Wed 28, Fri 30, Sat 31
test('HIS NIGHTS: Monday, Wednesday, Friday — never the rest, never a legendary\'s night; every phone the same', () => {
  assert.ok(boxerNight('2026-10-26').on && boxerNight('2026-10-28').on && boxerNight('2026-10-30').on);
  for (const k of ['2026-10-25', '2026-10-27', '2026-10-29', '2026-10-31']) assert.equal(boxerNight(k).on, false, k);
  assert.equal(boxerNight('2026-10-26', { legend: () => true }).on, false, 'a legendary night has its own sky');
  assert.equal(boxerNight('2026-10-26', { legend: () => ({ kind: 'ufo', h: 21.5 }) }).on, false, 'a legendary DURING his evening: he sits it out');
  assert.equal(boxerNight('2026-10-26', { legend: () => ({ kind: 'ufo', h: 24.15 }) }).on, true, '…one after it leaves him his training');
  assert.deepEqual(boxerNight('2026-10-30', { seed: 7 }), boxerNight('2026-10-30', { seed: 7 }));
  let stay = 0; for (let d = 0; d < 52; d++) { const dt = new Date(Date.UTC(2027, 0, 1 + 7 * d)); while (dt.getUTCDay() !== 5) dt.setUTCDate(dt.getUTCDate() + 1); const n = boxerNight(`${dt.getUTCFullYear()}-${dt.getUTCMonth() + 1}-${dt.getUTCDate()}`); assert.ok(n.friday); if (n.stay) stay++; }
  assert.ok(stay > 14 && stay < 38, `a Friday ~50/50: he stays ${stay} of 52`);
});
test('A SET = 10 rounds of 3 min + 1-min rests (40 min) → a 10-min break → again from 7 pm; at 11 he FINISHES the set he\'s in; a Friday wrap-up finishes the ROUND at 8:30', () => {
  const p = boxerPlan({ on: true, friday: false, stay: true });
  assert.equal(p.start, H(19)); assert.equal(p.set, 2400); assert.equal(p.cycle, 3000);
  assert.ok(p.end >= H(23) && p.end <= H(23) + 2400, `out at ${(p.end / 3600).toFixed(2)} h — the set in progress at 11 finished`);
  assert.equal((p.end - p.sets[p.sets.length - 1]) % 2400, 0, 'he ends on a set\'s end');
  const w = boxerPlan({ on: true, friday: true, stay: false });
  assert.ok(w.end <= H(P.wrapAt) + P.round && w.end >= H(P.wrapAt) - P.round - P.rest, `a Friday wrap-up: out at ${(w.end / 3600).toFixed(3)} h (~8:30, the round finished)`);
  const s = boxerPlan({ on: true, friday: true, stay: true }); assert.equal(s.end, p.end, 'a Friday he stays: the whole evening');
});
test('HIM over an evening: the blind up before him, rounds + rests + the long break, out after; a late page joins mid-round (pure of the clock)', () => {
  const p = boxerPlan({ on: true, friday: false, stay: true }), K = '2026-10-26';
  assert.equal(boxerAt(H(18.5), p, K).phase, 'off');
  const up = boxerAt(H(19) - 1, p, K); assert.equal(up.phase, 'blind-up'); assert.ok(up.blind > 0 && up.blind < 1, 'the blind going up IS his entrance');
  const r = boxerAt(H(19) + 100, p, K); assert.equal(r.phase, 'round'); assert.equal(r.round, 1); assert.ok(r.inView && r.blind === 0);
  assert.equal(boxerAt(H(19) + 190, p, K).phase, 'rest');
  assert.equal(boxerAt(H(19) + 2400 + 60, p, K).phase, 'break');
  assert.equal(boxerAt(H(19) + 3000 + 10, p, K).round, 1);
  assert.deepEqual(boxerAt(H(20.3), p, K), boxerAt(H(20.3), p, K), 'every phone the same');
  const d = boxerAt(p.end + 2, p, K); assert.equal(d.phase, 'done'); assert.ok(d.inView, 'he towels off + walks out');
  const o = boxerAt(p.end + P.outWalk + 1, p, K); assert.ok(o.phase === 'out' && o.blind > 0 && o.blind < 1 && o.lamp === 1, 'the blind comes down warm-lit');
  const late = boxerAt(p.end + P.outWalk + P.blindDown + P.lampOff + 5, p, K); assert.ok(late.blind === 1 && late.lamp === 0, '…then the bulb goes out');
});
test('A ROUND: seeded kinds (shadow / bag / weave), big readable beats, a breath between combinations; the bag + the bulb swing on its hits, damped', () => {
  const kinds = new Set();
  for (let r = 1; r <= 10; r++) { const R = roundOf('2026-10-26', 0, r); kinds.add(R.kind); assert.ok(R.beats.length > 40, `${R.beats.length} beats`); for (let i = 1; i < R.beats.length; i++) assert.ok(R.beats[i].t >= R.beats[i - 1].t + R.beats[i - 1].d - 1e-9, 'never overlapping'); }
  assert.ok(kinds.size >= 2, [...kinds].join(','));
  let bagR = null; for (let r = 1; r <= 10 && !bagR; r++) if (roundOf('2026-10-26', 0, r).kind === 'bag') bagR = r;
  assert.ok(bagR, 'a bag round in the set');
  let mx = 0; for (let t = 5; t < 170; t += 0.1) mx = Math.max(mx, Math.abs(swingAt('2026-10-26', 0, bagR, t).bag));
  assert.ok(mx > 0.05 && mx < 0.6, `the bag swings ${mx.toFixed(2)} rad`);
});
test('HIS SOUNDS: ding-ding-ding at a round\'s start + one ding at its end, a thud per bag hit (the chain after a hard one), the rope in his long break; none outside his night', () => {
  const p = boxerPlan({ on: true, friday: false, stay: true }), K = '2026-10-26';
  // (MODELS: the real files — the start is the bell's own ding-ding-ding burst, ONE cue; the end ONE ding)
  const start = boxerCues(H(19) - 1, H(19) + 1, p, K).filter(q => q.slot === 'boxer-bell3');
  assert.equal(start.length, 1, 'ding-ding-ding (one burst)');
  assert.equal(boxerCues(H(19) + 179, H(19) + 181, p, K).filter(q => q.slot === 'boxer-bell').length, 1, 'one ding at the end');
  let bag = 0, chain = 0, rope = 0;
  for (let s = H(19); s < H(19) + 3000; s += 20) for (const q of boxerCues(s, s + 20, p, K)) { if (q.slot === 'boxer-bag') bag++; if (q.slot === 'boxer-chain') chain++; if (q.slot === 'boxer-rope') rope++; }
  assert.ok(bag > 40 && chain > 3 && rope >= 3, `bag ${bag}, chain ${chain}, rope ${rope}`);
  assert.equal(boxerCues(H(12), H(12) + 20, p, K).length, 0);
  assert.equal(boxerCues(H(19) - 1, H(19) + 20, p, K).length > 0, true);   // (MODELS: the round's bell is ONE cue at its very start)
  assert.equal(boxerCues(H(19), H(19) + 120, null, K).length, 0);
});
test('THE PREVIEW (&force=boxer, &round=N): round N starts a few seconds after it opens, the blind up first', () => {
  const f = boxerForced(4, 4), a = boxerAt(4.5, f, 'forced');
  assert.equal(a.phase, 'round'); assert.equal(a.round, 4);
  assert.equal(boxerAt(f.start - 1, f, 'forced').phase, 'blind-up');
  assert.equal(boxerAt(1, boxerForced(1, 4), 'forced').phase, 'blind-up');
});

test('MODELS — THE ROOM REWORKED: THE BAG NEVER MOVES SIDES; MOSTLY IN THE AIR, turned away from the bag, long combinations (up to six), slips + ducks, Ali footwork; bursts on the bag (it swings); a turn passes through his front', async () => {
  const { BAG_SIDE, faceAt } = await import('../js/core/harbor-boxer.js');
  const p = boxerPlan({ on: true, friday: false, stay: true }), K = '2026-11-02';
  // the bag's side: the same at every moment of the night (it used to be seeded per round: right → left)
  const sides = new Set();
  for (let s = H(19); s < H(23); s += 37) sides.add(boxerAt(s, p, K).bagSide);
  assert.deepEqual([...sides], [BAG_SIDE], 'one side all night');
  let air = 0, bag = 0, longest = 0, def = 0, foot = 0, turns = 0, swingMax = 0;
  for (let r = 1; r <= 10; r++) {
    const R = roundOf(K, 0, r);
    for (const b of R.beats) { if (b.at === 'air') air += b.d; else bag += b.d; longest = Math.max(longest, b.punches.length); if (['slip', 'duck', 'weave', 'pull'].includes(b.act)) def++; if (['step', 'shuffle', 'bounce'].includes(b.act)) foot++; if (b.act === 'turn') turns++; }
    for (let t = 5; t < 175; t += 0.2) swingMax = Math.max(swingMax, Math.abs(swingAt(K, 0, r, t).bag));
    assert.equal(R.bagSide, BAG_SIDE);
  }
  assert.ok(air > bag * 2, `mostly shadowboxing in the air (${air.toFixed(0)} s vs ${bag.toFixed(0)} s on the bag)`);
  assert.ok(longest >= 6, `long combinations (the longest ${longest} punches)`);
  assert.ok(def > 40 && foot > 80 && turns >= 10, `slips + ducks (${def}), footwork (${foot}), turns to the bag + back (${turns})`);
  assert.ok(swingMax > 0.08 && swingMax <= 0.2 + 1e-9, `the bag swings visibly, never out of the frame (${swingMax.toFixed(2)} rad)`);
  // facing: AWAY from the bag in the air, toward it at the bag; a turn passes through his front (|face| < 1 mid-turn)
  const R2 = roundOf(K, 0, 2), turn = R2.beats.find(b => b.act === 'turn');
  const r0 = p.sets[0] + (P.round + P.rest), mid = boxerAt(r0 + turn.t + turn.d / 2, p, K);
  assert.ok(Math.abs(mid.face) < 0.5, `mid-turn through his front (face ${mid.face.toFixed(2)})`);
  assert.equal(faceAt('air'), -BAG_SIDE); assert.equal(faceAt('bag'), BAG_SIDE);
  for (const b of R2.beats.filter(b => b.act !== 'turn').slice(0, 80)) { const a = boxerAt(r0 + b.t + b.d / 2, p, K); assert.equal(Math.sign(a.face), b.at === 'bag' ? BAG_SIDE : -BAG_SIDE, `${b.act} at the ${b.at}`); }
});
test('MODELS — THE REST: he walks it off, shakes out his arms, SITS ON THE FLOOR back to the wall, gets up for the bell; THE LONG BREAK the same, longer, then out of the frame (the rope + the speed bag only after he has left)', async () => {
  const { restAt } = await import('../js/core/harbor-boxer.js');
  const acts = len => { const seq = []; for (let t = 0; t < len; t += 0.5) { const a = restAt(t, len).act; if (seq[seq.length - 1] !== a) seq.push(a); } return seq; };
  assert.deepEqual(acts(60), ['walk', 'shake', 'sitdown', 'sit', 'getup', 'back']);
  assert.deepEqual(acts(600), ['walk', 'shake', 'sitdown', 'sit', 'getup', 'walkout', 'out']);
  let sit = 0; for (let t = 0; t < 60; t += 0.5) if (restAt(t, 60).act === 'sit') sit += 0.5;
  assert.ok(sit >= 30, `most of the minute sitting (${sit} s)`);
  const p = boxerPlan({ on: true, friday: false, stay: true }), K = '2026-11-02';
  const b0 = p.sets[0] + p.set;
  const cues = boxerCues(b0, b0 + 30, p, K).concat(...Array.from({ length: 19 }, (_, i) => boxerCues(b0 + 30 * (i + 1), b0 + 30 * (i + 2), p, K)));
  const out = cues.filter(q => q.slot === 'boxer-rope' || q.slot === 'boxer-speedbag');
  assert.ok(out.length >= 4 && out.every(q => !boxerAt(q.at, p, K).inView), `the rope + the speed bag only once he's out of view (${out.length})`);
  assert.ok(out.some(q => q.slot === 'boxer-speedbag') && out.some(q => q.slot === 'boxer-rope'));
});
