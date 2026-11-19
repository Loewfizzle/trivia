// HIGH RISE S1 — THE ENGINE (js/games/highrise/{tuning,engine,logic,replay}.js — docs/highrise.md): every rule, with HAND-BUILT tap logs.
// THE ONE RULE: the same seed + the same tap log = the exact same run (REPLAY = LIVE); integers only; no clock, no Math.random.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TICK_HZ, START, PERFECT, GROW, GROW_STREAK, THIN, TRAVEL, FUSE_SWEEPS, BEAT, SWEEP, WOBBLE, SWEEP_MIN, SWEEP_MAX, sweepBase, sweepFloorMin, TIGHT, MODES, MODE_IDS, MAX_TAPS, FLOOR_TICKS_MAX, PALETTE_N, CLOUDS_FLOOR, TOP_FLOOR } from '../js/games/highrise/tuning.js';
import { createRun, stepTo, tap, isOver, resultOf, slabAt, topOf, slideOff, sweepTicks, endOf, axisOf, seedHash, modeRow, flyerFor, paletteFor } from '../js/games/highrise/engine.js';
import { END_WORDS, endWords, seedOf, tickOf, featsOf, standings, rankCompare, perfectsLine } from '../js/games/highrise/logic.js';
import { replay, packTaps, unpackTaps } from '../js/games/highrise/replay.js';
import { BOTS, BOT_IDS, gaussBot, playBot } from '../js/games/highrise/bot.js';
import { hashString } from '../js/core/rng.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const abs = n => (n < 0 ? -n : n);
/** the next slab enters */
const enter = run => { stepTo(run, run.s0); assert.equal(run.st, 'slide'); return run; };
const offAt = (run, t) => slideOff(run.S, run.e, t - run.s0);
/** the first tick (from `from` ticks after its entry) at which the sliding slab's offset passes `ok` */
function tickWhere(run, ok, from = 0) { for (let t = run.s0 + from; t < run.s0 + FUSE_SWEEPS * run.S; t++) if (ok(offAt(run, t))) return t; return -1; }
/** drop the next slab PERFECT (the offset nearest 0 that is not 0 when there is one — the snap must be seen) → its tick */
function perfect(run, ev) { enter(run); const t = tickWhere(run, o => abs(o) <= PERFECT); assert.ok(t >= 0); assert.ok(tap(run, t, ev)); return t; }
/** drop the next slab cut by between lo and hi units → { t, off } */
function cut(run, lo, hi, ev) { enter(run); const t = tickWhere(run, o => abs(o) >= lo && abs(o) <= hi); assert.ok(t >= 0, `a tick cutting ${lo}–${hi}`); const off = offAt(run, t); assert.ok(tap(run, t, ev)); return { t, off }; }
const size = run => ({ w: run.x1 - run.x0, d: run.z1 - run.z0 });

test('THE NUMBERS (fixed point): START 10000 · PERFECT 500 (5 %) · GROW 400 (4 %) after 6 · THIN 500 · the travel ±1.5 × the start width · 60 ticks a second · THE BEAT 12 · THE FUSE 2 sweeps', () => {
  assert.deepEqual([TICK_HZ, START, PERFECT, GROW, GROW_STREAK, THIN, TRAVEL, FUSE_SWEEPS, BEAT], [60, 10000, 500, 400, 6, 500, 15000, 2, 12]);
  assert.equal(PERFECT * 20, START); assert.equal(GROW * 25, START); assert.equal(THIN * 20, START); assert.equal(TRAVEL * 2, START * 3);
  assert.deepEqual(MODES, { solo: { finish: null, capTicks: null }, match: { finish: 200, capTicks: 6 * 60 * 60 }, daily: { finish: 200, capTicks: 5 * 60 * 60 } });
  assert.deepEqual(MODE_IDS, ['solo', 'match', 'daily']);
  assert.ok(TRAVEL >= START, 'at either end of its travel a slab is FULLY OFF the tower — even two full-size slabs do not touch');
  assert.equal(FLOOR_TICKS_MAX, BEAT + FUSE_SWEEPS * SWEEP_MAX);
  assert.equal(modeRow('constructor'), null); assert.equal(modeRow('__proto__'), null); assert.equal(modeRow(undefined), null); assert.equal(modeRow('match'), MODES.match);
  assert.throws(() => createRun({ seed: 'a', mode: 'toString' }), /unknown mode/);
});

test('A NEW RUN: the base slab START × START centred on 0, "landed" at tick 0 — the first slab enters at tick BEAT, fully off the tower', () => {
  const run = createRun({ seed: 'a', mode: 'solo' });
  assert.deepEqual([run.x0, run.x1, run.z0, run.z1, run.floor, run.st, run.s0, run.t], [-5000, 5000, -5000, 5000, 0, 'beat', BEAT, 0]);
  assert.deepEqual(topOf(run), { cx: 0, cz: 0, w: START, d: START });
  assert.equal(slabAt(run, 5), null, 'no slab in the beat');
  assert.equal(tap(run, BEAT - 1), false, 'a tap in the first beat is not a drop');
  assert.equal(run.taps, 0);
  enter(run);
  const s = slabAt(run, run.s0);
  assert.equal(s.floor, 1); assert.equal(abs(s.off), TRAVEL);
  assert.ok(s.axis === 'z' && (s.z0 >= run.z1 || s.z1 <= run.z0), 'it enters fully off the tower');
  assert.deepEqual([s.x0, s.x1], [run.x0, run.x1], 'lined up with the tower on the other axis');
});

test('THE SLIDE: a triangle wave in integers — e × TRAVEL at entry, dead on at half a sweep, the far end after one sweep, back after two; the two directions mirror exactly', () => {
  for (const S of [SWEEP_MIN, 85, 97, 120, SWEEP_MAX]) {
    for (const e of [1, -1]) {
      assert.equal(slideOff(S, e, 0), e * TRAVEL); assert.equal(slideOff(S, e, S), -e * TRAVEL); assert.equal(slideOff(S, e, 2 * S), e * TRAVEL);
      if (S % 2 === 0) assert.equal(slideOff(S, e, S / 2), 0, 'an even sweep passes dead on the tower');
      let hits = [0, 0];
      for (let k = 0; k <= 2 * S; k++) {
        const o = slideOff(S, e, k);
        assert.ok(Number.isInteger(o) && abs(o) <= TRAVEL);
        assert.equal(o + slideOff(S, -e, k), 0, 'mirrored'); assert.ok(!Object.is(o, -0), 'never a negative zero');
        assert.equal(o, slideOff(S, e, 2 * S - k), 'the second sweep retraces the first');
        if (abs(o) <= PERFECT) hits[k < S ? 0 : 1]++;
      }
      assert.ok(hits[0] >= 2 && hits[1] >= 2, `S ${S}: at least two PERFECT ticks on each pass (${hits})`);
    }
  }
});

test('THE AXES ALTERNATE (even floors x, odd floors z) + THE CUT: the overhang is sliced off — the slab keeps only what sits on the slab below; the piece + its side are rules data', () => {
  assert.deepEqual([1, 2, 3, 4].map(axisOf), ['z', 'x', 'z', 'x']);
  const run = createRun({ seed: 'cut', mode: 'solo' }), ev = [];
  const a = cut(run, 900, 1400, ev);          // floor 1: z
  assert.deepEqual(size(run), { w: START, d: START - abs(a.off) }, 'floor 1 cuts z only');
  assert.deepEqual(a.off > 0 ? [run.z0, run.z1] : [run.z0, run.z1], a.off > 0 ? [-5000 + a.off, 5000] : [-5000, 5000 + a.off], 'the part over the slab below stays where it is');
  const c = ev.find(e => e.e === 'cut');
  assert.deepEqual([c.floor, c.axis, c.side, c.piece.size, c.piece.hi - c.piece.lo], [1, 'z', a.off > 0 ? 1 : -1, abs(a.off), abs(a.off)]);
  assert.equal(a.off > 0 ? c.piece.lo : c.piece.hi, a.off > 0 ? 5000 : -5000, 'the piece hangs past the edge of the slab below');
  assert.deepEqual([run.floor, run.at, run.streak, run.st, run.s0], [1, a.t, 0, 'beat', a.t + BEAT]);
  const b = cut(run, 2000, 2600, ev);         // floor 2: x
  assert.deepEqual(size(run), { w: START - abs(b.off), d: START - abs(a.off) }, 'floor 2 cuts x only');
  assert.equal(run.floor, 2);
  // the next slab is the size of the top
  enter(run); const s = slabAt(run, run.s0);
  assert.deepEqual([s.x1 - s.x0, s.z1 - s.z0], [run.x1 - run.x0, run.z1 - run.z0]);
});

test('A PERFECT (|offset| ≤ 500 — a FIXED window): the slab SNAPS onto the slab below exactly; the streak counts; a miss by one unit past the window is a cut', () => {
  const run = createRun({ seed: 'snap', mode: 'solo' }), ev = [];
  enter(run);
  const t = tickWhere(run, o => o !== 0 && abs(o) <= PERFECT);
  assert.ok(t >= 0, 'a perfect tick that is not dead on');
  const before = [run.x0, run.x1, run.z0, run.z1];
  assert.ok(tap(run, t, ev));
  assert.deepEqual([run.x0, run.x1, run.z0, run.z1], before, 'snapped: exactly the slab below');
  assert.deepEqual([run.floor, run.streak, run.perfects, run.maxStreak], [1, 1, 1, 1]);
  assert.ok(ev.some(e => e.e === 'perfect' && e.streak === 1) && !ev.some(e => e.e === 'cut'));
  // the window never shrinks: on a narrow slab it is still ± 500
  const r2 = createRun({ seed: 'narrow', mode: 'solo' });
  cut(r2, 7000, 8000); cut(r2, 7000, 8000);
  const w0 = size(r2);
  assert.ok(w0.w <= 3000 && w0.d <= 3000);
  enter(r2); const tp = tickWhere(r2, o => abs(o) > 300 && abs(o) <= PERFECT);
  if (tp >= 0) { tap(r2, tp); assert.deepEqual(size(r2), w0, 'still a perfect at 300–500 off on a narrow slab'); }
  // just past the window: a cut, the streak ends
  const r3 = createRun({ seed: 'edge', mode: 'solo' });
  perfect(r3); perfect(r3);
  assert.equal(r3.streak, 2);
  const c = cut(r3, PERFECT + 1, PERFECT + 400);
  assert.equal(r3.streak, 0); assert.equal(r3.maxStreak, 2);
  assert.equal(r3.floor % 2 === 0 ? size(r3).w : size(r3).d, START - abs(c.off));
});

test('GROW-BACK: 6 perfects in a row grow nothing — the 7th and every further one adds 400 back on its own slide axis, never past the start size', () => {
  const run = createRun({ seed: 'grow', mode: 'solo' }), ev = [];
  const a = cut(run, 1900, 2300), b = cut(run, 1900, 2300);   // z then x
  let d = START - abs(a.off), w = START - abs(b.off);
  for (let i = 1; i <= GROW_STREAK; i++) { perfect(run, ev); assert.deepEqual(size(run), { w, d }, `perfect ${i} in a row: no growth yet`); }
  assert.equal(ev.filter(e => e.e === 'grow').length, 0);
  let grows = 0;
  for (let i = 0; i < 16; i++) {
    const floor = run.floor + 1, x = floor % 2 === 0, was = x ? w : d;
    ev.length = 0; perfect(run, ev);
    const g = ev.find(e => e.e === 'grow'), want = Math.min(GROW, START - was);
    if (want > 0) { assert.deepEqual([g.axis, g.by], [x ? 'x' : 'z', want]); grows++; } else assert.equal(g, undefined, 'full size: nothing to grow');
    if (x) w += want; else d += want;
    assert.deepEqual(size(run), { w, d });
    assert.ok(w <= START && d <= START, 'never past the start size');
  }
  assert.deepEqual(size(run), { w: START, d: START }, 'grown all the way back');
  assert.ok(grows >= 10);
  assert.ok((START - (START - abs(a.off))) % GROW !== 0, 'the last step was a part step (the cap, not a multiple of 400)');
  assert.equal(run.streak, GROW_STREAK + 16);
  // a cut ends the streak: the next 6 perfects grow nothing again
  cut(run, 900, 1300); const s0 = size(run);
  for (let i = 0; i < GROW_STREAK; i++) perfect(run);
  assert.deepEqual(size(run), s0);
  // the growth is centred on the slab (half each side) — integers
  const lo0 = run.floor % 2 === 0 ? run.z0 : run.x0, hi0 = run.floor % 2 === 0 ? run.z1 : run.x1;
  perfect(run);
  const grewX = run.floor % 2 === 0, lo1 = grewX ? run.x0 : run.z0, hi1 = grewX ? run.x1 : run.z1;
  if (hi0 - lo0 <= START - GROW) assert.deepEqual([lo0 - lo1, hi1 - hi0], [GROW / 2, GROW / 2]);
});

test('OUT — MISSED THE STACK: a tap with no overlap ends the run; the floor does not count', () => {
  const run = createRun({ seed: 'miss', mode: 'solo' }), ev = [];
  perfect(run);
  enter(run);
  assert.ok(tap(run, run.s0, ev), 'a tap the tick it enters IS a drop — fully off the tower');
  assert.deepEqual([run.st, run.cause, run.floor, run.end], ['out', 'miss', 1, run.s0]);
  assert.deepEqual(ev.map(e => e.e), ['drop', 'out']);
  const r = resultOf(run);
  assert.deepEqual([r.floor, r.cause, r.over, r.made, endWords(r)], [1, 'miss', true, false, 'MISSED THE STACK']);
  assert.equal(tap(run, run.end + 50), false, 'no tap after the end');
  // exactly no overlap (|offset| = the slab's size) is a miss too
  const r2 = createRun({ seed: 'miss2', mode: 'solo' });
  cut(r2, 6000, 9000);
  enter(r2);
  const d = size(r2).w, t = tickWhere(r2, o => abs(o) >= d);
  tap(r2, t); assert.equal(r2.cause, 'miss');
});

test('OUT — SLIPPED OFF: a slab cut to under 500 on a side slips off (the floor does not count); at 500 or more it stays', () => {
  const run = createRun({ seed: 'thin', mode: 'solo' }), ev = [];
  enter(run);
  const t = tickWhere(run, o => abs(o) > START - THIN && abs(o) < START);
  assert.ok(t >= 0);
  assert.ok(tap(run, t, ev));
  assert.deepEqual([run.st, run.cause, run.floor], ['out', 'thin', 0]);
  assert.deepEqual(ev.map(e => e.e), ['drop', 'cut', 'out']);
  assert.equal(endWords(resultOf(run)), 'SLIPPED OFF');
  assert.deepEqual(size(run), { w: START, d: START }, 'the tower\'s top is untouched');
  const r2 = createRun({ seed: 'thin2', mode: 'solo' });
  enter(r2);
  const t2 = tickWhere(r2, o => abs(o) > START - 2600 && abs(o) <= START - THIN);
  tap(r2, t2);
  assert.equal(r2.st, 'beat'); assert.ok(size(r2).d >= THIN && size(r2).d < 2600, 'a thin slab that is still ≥ 500 stays');
});

test('THE FUSE: an untapped slab drops by itself at the END OF ITS 2ND SWEEP — fully off the tower: TOO SLOW', () => {
  const run = createRun({ seed: 'fuse', mode: 'solo' }), ev = [];
  perfect(run); perfect(run);
  enter(run);
  const fuse = run.s0 + FUSE_SWEEPS * run.S;
  stepTo(run, fuse - 1, ev);
  assert.equal(run.st, 'slide', 'one tick before the fuse it still slides');
  stepTo(run, fuse, ev);
  assert.deepEqual([run.st, run.cause, run.end, run.floor, run.taps], ['out', 'slow', fuse, 2, 2]);
  assert.deepEqual(ev.map(e => e.e), ['drop', 'out']); assert.equal(ev[0].fuse, true); assert.equal(abs(ev[0].off), TRAVEL);
  assert.equal(endWords(resultOf(run)), 'TOO SLOW');
  // a tap AT the fuse's tick is too late: the fuse dropped it
  const r2 = createRun({ seed: 'fuse', mode: 'solo' });
  perfect(r2); perfect(r2); enter(r2);
  assert.equal(tap(r2, fuse), false); assert.equal(r2.cause, 'slow');
  // … and one tick before it is the player's own drop (a miss: the slab is off the tower)
  const r3 = createRun({ seed: 'fuse', mode: 'solo' });
  perfect(r3); perfect(r3); enter(r3);
  assert.equal(tap(r3, fuse - 1), true); assert.equal(r3.cause, 'miss');
  // a run nobody plays ends by itself
  const idle = createRun({ seed: 'idle', mode: 'solo' });
  stepTo(idle, 100000);
  assert.deepEqual([idle.st, idle.cause, idle.floor, idle.end], ['out', 'slow', 0, BEAT + FUSE_SWEEPS * sweepTicks(seedHash('idle'), 1)]);
  assert.match(code('js/games/highrise/engine.js'), /if \(run\.st === 'beat'\) spawn\(run, ev\); else drop\(run, next, true, ev\);/, 'the fuse\'s drop is the SAME drop a tap makes');
  assert.match(code('js/games/highrise/engine.js'), /finish\(run, 'out', fuse \? 'slow' : 'miss', T, ev\)[\s\S]*finish\(run, 'out', fuse \? 'slow' : 'thin', T, ev\)/, 'only the cause differs: a fuse drop that misses / thins out = TOO SLOW');
});

test('THE LANDING BEAT: 12 ticks after a drop there is no slab — a tap then is not a drop, changes nothing, and the next slab enters at drop + 12', () => {
  const run = createRun({ seed: 'beat', mode: 'solo' });
  const t = perfect(run), snap = JSON.stringify(run);
  for (let k = 0; k < BEAT; k++) {
    assert.equal(tap(run, t + k), false, `tick +${k}: in the beat`);
    assert.equal(JSON.stringify({ ...run, t: t }), JSON.stringify({ ...JSON.parse(snap), t: t }), 'nothing changed but the clock');
  }
  assert.equal(run.taps, 1);
  assert.equal(tap(run, t + BEAT), true, 'the tick it enters, it can be dropped');
  assert.equal(run.taps, 2);
});

test('FAIR TAPS: a tap counts at the tick of the TOUCH — even when the run was already stepped past it (nothing happens while a slab slides)', () => {
  const a = createRun({ seed: 'fair', mode: 'solo' }), b = createRun({ seed: 'fair', mode: 'solo' });
  perfect(a); perfect(b);
  enter(a); enter(b);
  const t = tickWhere(a, o => abs(o) > PERFECT && abs(o) < 3000);
  tap(a, t);                                   // on time
  stepTo(b, t + 9); assert.equal(b.t, t + 9);  // the frame loop ran ahead of the touch's own time
  assert.ok(tap(b, t));
  assert.deepEqual({ ...b, t: 0 }, { ...a, t: 0 }, 'the same drop');
  // … and the next slab's entry is still in order (its beat counted from the TOUCH)
  stepTo(a, t + 40); stepTo(b, t + 40);
  assert.deepEqual(b, a);
  // a touch older than the slab itself (from the beat before it) is not a drop
  const c = createRun({ seed: 'fair', mode: 'solo' });
  const tc = perfect(c); stepTo(c, tc + BEAT + 5);
  assert.equal(tap(c, tc + BEAT - 1), false);
  assert.equal(c.st, 'slide');
  assert.equal(tickOf(1000 + 16.7 * 30, 1000), 30); assert.equal(tickOf(1000 + 16.7 * 30 + 8, 1000), 31, 'a touch\'s time → the NEAREST tick');
});

test('THE FINISH (match / daily): floor 200 = MADE IT TO THE MOTHERSHIP — a finish, not an out; SOLO is endless', () => {
  for (const mode of ['match', 'daily']) {
    const run = createRun({ seed: `fin-${mode}`, mode }), ev = [];
    let t = 0;
    for (let i = 0; i < 200; i++) { assert.equal(isOver(run), false); t = perfect(run, ev); }
    assert.deepEqual([run.st, run.floor, run.at, run.end, run.cause], ['made', 200, t, t, '']);
    const r = resultOf(run);
    assert.deepEqual([r.floor, r.tick, r.cause, r.made, r.over, r.perfects, r.maxStreak, r.taps], [200, t, 'made', true, true, 200, 200, 200]);
    assert.deepEqual(r.feats, { reachedClouds: true, reachedTop: true });
    assert.equal(endWords(r), 'MADE IT TO THE MOTHERSHIP');
    assert.equal(ev[ev.length - 1].e, 'made');
    assert.equal(tap(run, t + BEAT), false, 'nothing after the finish');
    assert.ok(t < MODES[mode].capTicks, 'a perfect run is home before the cap');
  }
  const solo = createRun({ seed: 'fin-solo', mode: 'solo' });
  for (let i = 0; i < 230; i++) perfect(solo);
  assert.deepEqual([solo.st, solo.floor], ['beat', 230]);
  assert.deepEqual(resultOf(solo).feats, { reachedClouds: true, reachedTop: true });
  const low = createRun({ seed: 'low', mode: 'solo' });
  for (let i = 0; i < CLOUDS_FLOOR - 1; i++) perfect(low);
  assert.deepEqual(resultOf(low).feats, { reachedClouds: false, reachedTop: false });
  perfect(low); assert.deepEqual(resultOf(low).feats, { reachedClouds: true, reachedTop: false });
  assert.deepEqual([CLOUDS_FLOOR, TOP_FLOOR], [60, 200]);
  assert.equal(featsOf(resultOf(low)), 'reachedClouds'); assert.equal(featsOf(resultOf(createRun({ seed: 'x' }))), '');
});

test('THE CAP (match 6:00 · daily 5:00): the run ends WHERE IT STANDS at the cap\'s tick — no tap at or after it; solo has none', () => {
  for (const mode of ['match', 'daily']) {
    const cap = MODES[mode].capTicks, run = createRun({ seed: `cap-${mode}`, mode }), ev = [];
    // a slow, careful player: every slab dropped dead on at its SECOND pass
    while (!isOver(run)) {
      stepTo(run, run.s0);
      if (run.st !== 'slide') break;
      const t = tickWhere(run, o => abs(o) <= PERFECT, run.S);
      if (!tap(run, t, ev)) break;
    }
    assert.deepEqual([run.st, run.end, run.cause], ['cap', cap, '']);
    assert.ok(run.floor > 60 && run.floor < 200, `it stands on floor ${run.floor}`);
    const r = resultOf(run);
    assert.deepEqual([r.cause, r.made, r.over, r.floor, endWords(r)], ['cap', false, true, run.floor, 'TIME’S UP']);
    assert.ok(r.tick < cap, 'the ranking tick = when that floor landed');
    assert.equal(tap(run, cap), false); assert.equal(tap(run, cap + 5), false);
    // the tick before the cap a slab can still be dropped
    const r2 = createRun({ seed: `cap2-${mode}`, mode });
    while (r2.s0 + FUSE_SWEEPS * 140 < cap - 1) { stepTo(r2, r2.s0); tap(r2, tickWhere(r2, o => abs(o) <= PERFECT, r2.S)); }
    stepTo(r2, cap - 1);
    if (r2.st === 'slide') { assert.equal(tap(r2, cap - 1), true); stepTo(r2, cap); assert.equal(r2.st === 'cap' || r2.st === 'out', true); }
    // the cap comes BEFORE a fuse / an entry on the same tick
    const r3 = createRun({ seed: `cap3-${mode}`, mode });
    stepTo(r3, 10 ** 7);
    assert.equal(r3.cause, 'slow', 'an idle run is out long before the cap');
  }
  const solo = createRun({ seed: 'cap-solo', mode: 'solo' });
  for (let i = 0; i < 150; i++) { stepTo(solo, solo.s0); tap(solo, tickWhere(solo, o => abs(o) <= PERFECT, solo.S)); }
  assert.ok(solo.t > MODES.match.capTicks && !isOver(solo), 'solo: no cap');
});

test('THE SEED picks ONLY which end each slab enters from (+ its sweep\'s wobble): both ends come up, the same seed = the same slabs, another seed = others', () => {
  const h = seedHash('ends'), ends = Array.from({ length: 200 }, (_, i) => endOf(h, i + 1));
  assert.ok(ends.every(e => e === 1 || e === -1));
  const plus = ends.filter(e => e === 1).length;
  assert.ok(plus > 70 && plus < 130, `both ends (${plus} / 200 from +)`);
  assert.deepEqual(ends, Array.from({ length: 200 }, (_, i) => endOf(seedHash('ends'), i + 1)));
  assert.notDeepEqual(ends, Array.from({ length: 200 }, (_, i) => endOf(seedHash('ends2'), i + 1)));
  // on each axis both ends come up too
  for (const par of [0, 1]) { const e = ends.filter((_, i) => (i + 1) % 2 === par); assert.ok(e.includes(1) && e.includes(-1)); }
  const run = createRun({ seed: 'ends', mode: 'solo' });
  for (let f = 1; f <= 30; f++) {
    enter(run);
    const s = slabAt(run, run.s0);
    assert.equal(s.off, endOf(h, f) * TRAVEL); assert.equal(s.axis, axisOf(f)); assert.equal(run.S, sweepTicks(h, f));
    tap(run, tickWhere(run, o => abs(o) <= PERFECT));
  }
});

test('THE SPEED CURVE + THE WOBBLE: sweep ticks fall along the curve to floor 120, then hold; the wobble is ± 3 ticks, seeded, and never leaves the curve\'s band', () => {
  assert.deepEqual(SWEEP.map(k => [...k]), [[1, 140], [120, 84]], 'the sims\' curve (the owner\'s starting points were 96 → 45: docs/games/passes/highrise-s1.md)');
  assert.deepEqual([sweepBase(0), sweepBase(1), sweepBase(120), sweepBase(121), sweepBase(200)], [140, 140, 84, 84, 84]);
  for (let f = 1; f < 700; f++) { assert.ok(Number.isInteger(sweepBase(f))); assert.ok(sweepBase(f + 1) <= sweepBase(f), 'never slower as it climbs'); }
  assert.equal(WOBBLE, 3);
  const seen = new Set();
  for (let s = 0; s < 60; s++) {
    const h = seedHash(`w${s}`);
    for (let f = 1; f <= 600; f++) {
      const S = sweepTicks(h, f), w = S - sweepBase(f);
      assert.ok(Number.isInteger(S) && S >= sweepFloorMin(f) && S <= SWEEP_MAX, 'in the band');
      if (f < TIGHT.from + TIGHT.every) assert.ok(S >= SWEEP_MIN, 'up to the first notch: S1\'s band, unchanged');
      assert.ok(abs(w) <= WOBBLE);
      if (f > 10 && f < 110) seen.add(w);
    }
  }
  assert.deepEqual([...seen].sort((a, b) => a - b), [-3, -2, -1, 0, 1, 2, 3], 'every wobble comes up');
  assert.equal(sweepTicks(seedHash('w1'), 77), sweepTicks(seedHash('w1'), 77));
  assert.ok(SWEEP_MIN >= 60, 'the fastest sweep up to floor 200 still gives two perfect ticks a pass (500 units a tick at most)');
});

test('SOLO PAST 200 KEEPS TIGHTENING (S2 — the owner): from floor 200 the sweep loses 3 ticks every 10 floors, never under 24 — MATCH + DAILY (they end ON floor 200) are S1\'s runs, tick for tick', () => {
  assert.deepEqual({ ...TIGHT }, { from: 200, every: 10, by: 3, min: 24 });
  assert.deepEqual([200, 201, 209, 210, 219, 220, 300, 390, 399, 400, 401, 1000, 20000].map(sweepBase), [84, 84, 84, 81, 81, 78, 54, 27, 27, 24, 24, 24, 24]);
  assert.deepEqual([1, 200, 201, 209, 210, 5000].map(sweepFloorMin), [84, 84, 84, 84, 24, 24], 'floors 201 … 209 keep S1\'s band: the first notch is floor 210');
  for (let s = 0; s < 40; s++) for (let f = 201; f < 210; f++) { const S = sweepTicks(seedHash(`n${s}`), f); assert.ok(S >= 84 && S <= 87, `floor ${f}: ${S}`); }
  // past the tightening's floor NOBODY climbs for ever: on a sweep of an ODD number of ticks under 30 no tick is within the perfect
  // window (the slab is never closer than 30000 / (2 S) > 500 units) — a cut every such floor, whoever taps
  for (const S of [25, 27, 29]) { let best = 1e9; for (let k = 0; k <= 2 * S; k++) best = Math.min(best, abs(slideOff(S, 1, k))); assert.ok(best > PERFECT, `S ${S}: the nearest tick is ${best} off`); }
  for (const S of [24, 26, 84]) assert.equal(slideOff(S, 1, S / 2), 0, 'an even sweep still has its dead-on tick');
  // an ENDLESS run reaches the tightened floors — and the engine plays them (the slab of floor 231 sweeps in 75 ± 3)
  const h = seedHash('tight'); for (let f = 230; f < 240; f++) assert.ok(abs(sweepTicks(h, f) - 75) <= WOBBLE);
  // S1's runs, PINNED (the digests were taken on S1's code, ae444bf3, before this change): four bots × 60 seeds a mode, every run's
  // floor / ticks / end / streaks / last slab / last tap — a match + a daily never spawn slab 201; a solo run is the same up to floor 200
  const digest = mode => {
    let s = '';
    for (const id of BOT_IDS) for (let i = 0; i < 60; i++) {
      const seed = `gold-${id}-${i}`, run = createRun({ seed, mode }), taps = playBot(run, gaussBot({ sigmaMs: BOTS[id], seed }), { maxFloor: 200 });
      s += `${run.floor},${run.at},${run.end},${run.st},${run.cause},${run.perfects},${run.maxStreak},${run.x0},${run.x1},${run.z0},${run.z1},${taps.length ? taps[taps.length - 1] : 0};`;
    }
    return `${hashString(s).toString(36)}-${hashString(`b:${s}`).toString(36)}-${s.length}`;
  };
  assert.equal(digest('match'), '7hhk6j-1ma91zn-13058', 'MATCH: S1\'s runs, unchanged');
  assert.equal(digest('daily'), '7hhk6j-1ma91zn-13058', 'DAILY: S1\'s runs, unchanged');
  assert.equal(digest('solo'), 'ozbkhw-t5pysc-12878', 'SOLO up to floor 200: S1\'s runs, unchanged');
  for (const mode of ['match', 'daily']) { const r = createRun({ seed: 'fin', mode }); playBot(r, gaussBot({ sigmaMs: 4, seed: 'fin' })); assert.deepEqual([r.st, r.floor], ['made', 200], `${mode}: the run ends ON floor 200 — slab 201 never enters`); }
});

test('INTEGERS ONLY + THE SAME LOG TWICE = THE SAME RUN: every number of the state and of every event is a whole number; a replay is identical, tick by tick or in jumps', () => {
  const ints = (o, where) => { for (const [k, v] of Object.entries(o)) { if (typeof v === 'number') assert.ok(Number.isInteger(v), `${where}.${k} = ${v}`); else if (v && typeof v === 'object') ints(v, `${where}.${k}`); } };
  for (const [i, sigma] of [60, 40, 25, 10, 25, 40].entries()) {
    const seed = `int${i}`, mode = MODE_IDS[i % 3];
    const live = createRun({ seed, mode }), bot = gaussBot({ sigmaMs: sigma, seed }), evLive = [];
    // the live run, with its events, checked after every drop
    const taps = [];
    while (!isOver(live) && live.floor < 260) {
      stepTo(live, live.s0, evLive);
      if (live.st !== 'slide') break;
      const t = bot(live);
      if (!tap(live, t, evLive)) break;
      taps.push(t); ints(live, 'run');
    }
    if (!isOver(live)) stepTo(live, live.t + FLOOR_TICKS_MAX + BEAT, evLive);
    ints(live, 'run'); for (const e of evLive) ints(e, `event ${e.e}`);
    assert.ok(isOver(live));
    // twice from the log, in jumps
    const a = createRun({ seed, mode }), b = createRun({ seed, mode }), evA = [], evB = [];
    for (const t of taps) assert.ok(tap(a, t, evA));
    stepTo(a, live.end + 5, evA);
    // … and tick by tick (the way a frame loop steps it)
    let j = 0;
    for (let t = 0; t <= live.end + 5; t++) { stepTo(b, t, evB); if (j < taps.length && taps[j] === t) { assert.ok(tap(b, t, evB)); j++; } }
    assert.deepEqual(a, live); assert.deepEqual(b, live);
    assert.deepEqual(evA, evLive); assert.deepEqual(evB, evLive);
    const r = replay({ seed, mode, taps });
    assert.deepEqual({ ...resultOf(live), used: taps.length, bad: -1, why: '' }, r);
  }
});

test('THE RULES NEVER READ A CLOCK OR A DICE: no Date / Math.random / performance / frame clock / float math in the rules\' files', () => {
  for (const f of ['tuning.js', 'engine.js', 'replay.js', 'logic.js']) {
    const s = code(`js/games/highrise/${f}`);
    assert.doesNotMatch(s, /Date\b|Math\.random|performance\.|requestAnimationFrame|setTimeout|setInterval/, `${f}: no clock, no dice`);
    assert.doesNotMatch(s, /Math\.(sin|cos|tan|pow|sqrt|exp|log|hypot|atan2?|cbrt|fround|trunc|ceil)\b|parseFloat|toFixed/, `${f}: no float math`);
    assert.doesNotMatch(s, /\bdocument\b|\bwindow\b|from 'three'/, `${f}: no DOM, no three.js`);
  }
  const eng = code('js/games/highrise/engine.js');
  assert.doesNotMatch(eng, /Math\.round/, 'the engine never rounds a float');
  assert.doesNotMatch(eng, /for \(const \w+ (in|of) /, 'no iteration whose order could differ');
  assert.match(read('js/games/highrise/engine.js'), /^import \{ hashString \} from '\.\.\/\.\.\/core\/rng\.js';\nimport \{[^}]+\} from '\.\/tuning\.js';$/m, 'the engine imports only the integer hash + its own tuning');
  assert.doesNotMatch(code('js/games/highrise/bot.js'), /Math\.random|Date\b/, 'the bots have their own seeded rng');
});

test('THE PURE EXTRAS (view-only, the same on every phone): flyerFor(seed) = blackbird | f22 · paletteFor(seed, floor) = a colour index walking the wheel', () => {
  const f = Array.from({ length: 200 }, (_, i) => flyerFor(`f${i}`));
  assert.ok(f.every(x => x === 'blackbird' || x === 'f22'));
  const bb = f.filter(x => x === 'blackbird').length;
  assert.ok(bb > 70 && bb < 130, `both flyers come up (${bb} / 200 blackbird)`);
  assert.equal(flyerFor('same'), flyerFor('same'));
  for (const seed of ['a', 'b', 'c']) for (let fl = 0; fl < 60; fl++) {
    const p = paletteFor(seed, fl);
    assert.ok(Number.isInteger(p) && p >= 0 && p < PALETTE_N);
    assert.equal(paletteFor(seed, fl + 1), (p + 1) % PALETTE_N, 'one step a floor');
  }
  assert.ok(new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(s => paletteFor(s, 0))).size > 2, 'the seed picks where the wheel starts');
});

test('THE RANKING (S2 — the floor, then THE MOST PERFECTS, then the EARLIER tick) + THE SEED + THE END\'s WORDS + THE PACKED LOG', () => {
  assert.ok(rankCompare({ floor: 9, tick: 500 }, { floor: 8, tick: 100 }) < 0, 'the floor first — whatever the perfects + the tick');
  assert.ok(rankCompare({ floor: 9, perfects: 1, tick: 500 }, { floor: 8, perfects: 8, tick: 100 }) < 0);
  assert.ok(rankCompare({ floor: 200, perfects: 182, tick: 12490 }, { floor: 200, perfects: 171, tick: 12470 }) < 0, 'two Mothership finishers: the most perfects wins, not the hair-earlier tick');
  assert.ok(rankCompare({ floor: 9, perfects: 4, tick: 400 }, { floor: 9, perfects: 4, tick: 500 }) < 0, 'the same floor + perfects: the earlier tick');
  assert.ok(rankCompare({ floor: 9, tick: 400 }, { floor: 9, tick: 500 }) < 0, 'a row without perfects counts 0');
  assert.deepEqual(standings([{ uid: 'a', floor: 40, perfects: 12, tick: 900 }, { uid: 'b', floor: 55, perfects: 3, tick: 2000 }, { uid: 'c', floor: 40, perfects: 12, tick: 800 }, { uid: 'd', floor: 40, perfects: 12, tick: 900 }, { uid: 'e', floor: 40, perfects: 30, tick: 990 }]),
    [{ uid: 'b', rank: 1, floor: 55, perfects: 3, tick: 2000 }, { uid: 'e', rank: 2, floor: 40, perfects: 30, tick: 990 }, { uid: 'c', rank: 3, floor: 40, perfects: 12, tick: 800 }, { uid: 'a', rank: 4, floor: 40, perfects: 12, tick: 900 }, { uid: 'd', rank: 4, floor: 40, perfects: 12, tick: 900 }]);
  assert.deepEqual(standings([{ uid: 'x', floor: '7', perfects: 'NaN', tick: null }]), [{ uid: 'x', rank: 1, floor: 7, perfects: 0, tick: 0 }], 'a bad number counts 0');
  assert.equal(perfectsLine(182), '182 PERFECTS'); assert.equal(perfectsLine(1), '1 PERFECT'); assert.equal(perfectsLine(0), '0 PERFECTS');
  // the judge's row carries what the ranking reads: the floor, the perfects, the tick
  const rk = createRun({ seed: 'rank', mode: 'match' }); playBot(rk, gaussBot({ sigmaMs: 25, seed: 'rank' }));
  const res = resultOf(rk); assert.ok(Number.isInteger(res.floor) && Number.isInteger(res.perfects) && Number.isInteger(res.tick));
  assert.deepEqual(END_WORDS, { miss: 'MISSED THE STACK', thin: 'SLIPPED OFF', slow: 'TOO SLOW', made: 'MADE IT TO THE MOTHERSHIP', cap: 'TIME’S UP' });
  assert.equal(endWords(resultOf(createRun({ seed: 'x' }))), '', 'a run still going has no end words');
  assert.equal(seedOf('WORD', 'm1', 1700000000000), seedOf('WORD', 'm1', 1700000000000)); assert.notEqual(seedOf('WORD', 'm1', 1700000000000), seedOf('WORD', 'm1', 1700000000001));
  assert.match(seedOf('WORD', 'm1', 1700000000000), /^h[0-9a-z]+$/);
  const run = createRun({ seed: 'pack', mode: 'solo' }), taps = playBot(run, gaussBot({ sigmaMs: 25, seed: 'pack' }));
  assert.ok(taps.length > 20);
  assert.deepEqual(unpackTaps(packTaps(taps)), taps);
  assert.match(packTaps(taps), /^[0-9a-z]+(\.[0-9a-z]+)*$/);
  assert.deepEqual(unpackTaps(''), []); assert.equal(packTaps([]), '');
  for (const bad of ['1c..2', '.1c', '1c.', 'A.1', '1c,2', '1234567.1', null, 12, undefined]) assert.equal(unpackTaps(bad), null, String(bad));
  assert.equal(MAX_TAPS, 20000);
});

test('THE REVIEW\'S CORNERS, PINNED: PERFECT is judged FIRST (a slab cut to exactly 500, dropped exactly 500 off, snaps on — the plan\'s own order) · stepTo moves nothing on a tick that is not a whole number · a bad `until` counts nothing', () => {
  // a 500-wide slab, a sweep of 120 ticks (250 units a tick: ±500 is a tick of its own)
  const run = createRun({ seed: 'corner', mode: 'solo' });
  enter(run);
  run.S = 120; run.z0 = -250; run.z1 = 250;   // (the test's own poke: floor 1 slides on z)
  const t = tickWhere(run, o => abs(o) === PERFECT);
  assert.ok(t >= 0);
  const ev = [];
  assert.ok(tap(run, t, ev));
  assert.deepEqual(ev.map(e => e.e), ['drop', 'perfect', 'land'], '|offset| = 500 on a 500 slab: a PERFECT (within the window), not a miss');
  assert.deepEqual([run.floor, run.z0, run.z1, run.st], [1, -250, 250, 'beat']);
  // … one tick further out (750 off) there is no overlap at all: a miss
  const r2 = createRun({ seed: 'corner', mode: 'solo' });
  enter(r2); r2.S = 120; r2.z0 = -250; r2.z1 = 250;
  tap(r2, tickWhere(r2, o => abs(o) === 750));
  assert.deepEqual([r2.st, r2.cause, r2.floor], ['out', 'miss', 0]);
  // stepTo: a tick is a whole number
  const r3 = createRun({ seed: 'nan', mode: 'match' }), snap = JSON.stringify(r3);
  for (const bad of [NaN, Infinity, -Infinity, 12.5, '50', null, undefined, {}, 2 ** 53]) { stepTo(r3, bad); assert.equal(JSON.stringify(r3), snap, `stepTo(${String(bad)}) moves nothing`); }
  stepTo(r3, -5); assert.equal(JSON.stringify(r3), snap, 'a tick before the start moves nothing');
  // replay's `until`: a bad one counts NOTHING (never the whole run)
  const taps = playBot(createRun({ seed: 'until', mode: 'solo' }), gaussBot({ sigmaMs: 10, seed: 'until' }), { maxFloor: 30 });
  assert.equal(replay({ seed: 'until', mode: 'solo', taps, until: taps[9] }).floor, 10, 'the run as it stood at the 10th tap');
  for (const bad of [NaN, '500', 12.5, -1, Infinity, {}]) { const r = replay({ seed: 'until', mode: 'solo', taps, until: bad }); assert.deepEqual([r.floor, r.over, r.used], [0, false, 0], `until ${String(bad)}`); }
  assert.equal(replay({ seed: 'until', mode: 'solo', taps }).floor, 30);
});
