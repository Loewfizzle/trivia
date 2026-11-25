// FREEFALL F1 — THE TOWER (js/games/freefall/tower-gen.js — docs/freefall.md "THE TOWER" · "FAIR BY CONSTRUCTION"): buildFloor(seed, i) is a
// pure function of (seed, floor index), and every fairness rule of the owner's plan holds on every floor of 2,000 seeds — checked HERE
// FROM THE OUTSIDE (this file's own maths, angle by angle or slice by slice — never the generator's own helpers for the rule under test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { TURN, SLICES, BALL, SAFE, GAP, RED, GEN, REACH, HOP, FALL, BOUNCE, HUMAN, RULE_SETS, makeRuleSet, rampOf } from '../js/games/freefall/tuning.js';
import { buildFloor, floorAt, floorInto, seedHash, twistOf, gapsOf, sliceStart, sliceOf, sliceUnder, kindAt, wrap, angDiff, windowOk, reachOk, reachAt } from '../js/games/freefall/tower-gen.js';

const SEEDS = 2000, FLOORS = 240;          // every seed: floors 0 … 239 (THE ROOFTOP … THE BOTTOM + the first lap of THE TRENCH)
const DEEP_SEEDS = 250, DEEP_TO = 520;     // + THE TRENCH's laps for 250 seeds
const bit = (m, s) => (m >> ((s % SLICES + SLICES) % SLICES)) & 1;
const count = m => { let n = 0; for (let s = 0; s < SLICES; s++) n += bit(m, s); return n; };
const row = fl => Array.from({ length: SLICES }, (_, s) => 'sGR'[kindAt(fl, s)]).join('');
/** every floor of the proof, once: (h, i, floor, the floor above | null, seed index) */
function eachFloor(fn, seeds = SEEDS, floors = FLOORS, from = 0) {
  const a = { i: 0, twist: 0, gap: 0, red: 0 }, b = { i: 0, twist: 0, gap: 0, red: 0 };
  for (let k = 0; k < seeds; k++) {
    const h = seedHash(`t${k}`);
    let up = null, cur = a;
    for (let i = from; i < floors; i++) {
      if (i > from || from === 0) { /* (the floor above is the one built in the pass before) */ }
      floorInto(h, i, RULE_SETS.classic, cur);
      if (i > 0 && !up) { up = cur === a ? b : a; floorInto(h, i - 1, RULE_SETS.classic, up); }
      fn(h, i, cur, i > 0 ? up : null, k);
      up = cur; cur = cur === a ? b : a;
    }
  }
}

// ---- THE FOUR PROOFS SHARE ONE SWEEP of the towers (2,000 seeds are built once, not four times): a proof = its checker + its own verdict
const PROOFS = [];
let swept = false;
function proof(check) { const p = { check, err: null }; PROOFS.push(p); return p; }
function verdict(p) {
  if (!swept) {
    swept = true;
    // (no try / catch in the hot loop: a proof that fails is named by `at`, struck off, and the sweep runs again for the others)
    for (let live = PROOFS.slice(); live.length;) {
      let at = null;
      const all = (h, i, fl, up, k) => { for (let n = 0; n < live.length; n++) { at = live[n]; at.check(h, i, fl, up, k); } };
      try { eachFloor(all); eachFloor(all, DEEP_SEEDS, DEEP_TO, FLOORS); break; }
      catch (e) { at.err = e; live = live.filter(q => q !== at); for (const P of [P1, P2, P3, P4]) for (const key of Object.keys(P)) P[key] = key === 'minSafe' ? 12 : 0; }
    }
  }
  if (p.err) throw p.err;
}

test('THE ANGLE MATH (integers): one turn = 4096 units, 12 slices of 341 or 342 units — every unit in exactly one slice; THE SLICE UNDER THE BALL = floor(((BALL − A − twist) mod 4096) × 12 / 4096)', () => {
  assert.deepEqual([TURN, SLICES, BALL, SAFE, GAP, RED], [4096, 12, 0, 0, 1, 2]);
  assert.equal(sliceStart(0), 0); assert.equal(sliceStart(SLICES), TURN);
  let seen = 0;
  for (let s = 0; s < SLICES; s++) {
    const lo = sliceStart(s), hi = sliceStart(s + 1), w = hi - lo;
    assert.ok(w === 341 || w === 342, `slice ${s} is ${w} units wide`);
    assert.equal(sliceOf(lo), s, `the first unit of slice ${s}`); assert.equal(sliceOf(hi - 1), s, `its last unit`);
    if (s) assert.equal(sliceOf(lo - 1), s - 1, 'the unit before it is the slice before — no edge belongs to two slices');
    seen += w;
  }
  assert.equal(seen, TURN);
  for (let u = 0; u < TURN; u++) assert.equal(sliceOf(u), Math.floor(u * 12 / 4096));
  // the plan's formula, to the letter — every angle, a handful of twists
  for (const tw of [0, 1, 341, 342, 2047, 4095]) for (let A = 0; A < TURN; A += 7) {
    assert.equal(sliceUnder(A, tw), Math.floor(((((BALL - A - tw) % 4096) + 4096) % 4096) * 12 / 4096));
  }
  // turning the tower by +1 moves the floor under the ball by −1: the slice changes exactly at a slice's first unit
  for (let s = 1; s < SLICES; s++) {
    const A = wrap(BALL - sliceStart(s));   // (twist 0: the first unit of slice s is under the ball)
    assert.equal(sliceUnder(A, 0), s); assert.equal(sliceUnder(wrap(A + 1), 0), s - 1); assert.equal(sliceUnder(wrap(A - 1), 0), s);
  }
  assert.equal(wrap(-1), 4095); assert.equal(wrap(4096), 0); assert.equal(wrap(-4097), 4095);
  assert.equal(angDiff(10, 4090), 16); assert.equal(angDiff(4090, 10), -16); assert.equal(angDiff(2048, 0), -2048); assert.equal(angDiff(2047, 0), 2047); assert.equal(angDiff(5, 5), 0);
});

test('buildFloor(seed, i) IS A PURE FUNCTION of (seed, floor index): any floor, in any order, any number of times — the same floor; another seed, another tower', () => {
  const order = [199, 0, 57, 3, 120, 56, 58, 400, 1, 239], first = order.map(i => buildFloor('pure', i));
  for (let pass = 0; pass < 3; pass++) for (const [n, i] of [...order.entries()].reverse()) assert.deepEqual(buildFloor('pure', i), first[n], `floor ${i} again`);
  const f = buildFloor('pure', 57);
  assert.deepEqual(Object.keys(f).sort(), ['gap', 'i', 'red', 'slices', 'twist']);
  assert.equal(f.i, 57); assert.ok(Number.isInteger(f.twist) && f.twist >= 0 && f.twist < TURN);
  assert.equal(f.slices.length, 12);
  for (let s = 0; s < SLICES; s++) assert.equal(f.slices[s], bit(f.gap, s) ? GAP : bit(f.red, s) ? RED : SAFE);
  assert.equal(f.gap & f.red, 0, 'a slice is one kind');
  const h = seedHash('pure');
  assert.deepEqual(floorAt(h, 57), { i: 57, twist: f.twist, gap: f.gap, red: f.red }, 'the engine\'s own reader builds the same floor');
  assert.equal(twistOf(h, 57), f.twist); assert.equal(gapsOf(h, 57), f.gap);
  assert.equal(seedHash(57), seedHash('57'), 'a seed is its text');
  // another seed = another tower (the twists alone differ on almost every floor)
  let same = 0;
  for (let i = 0; i < 200; i++) if (row(buildFloor('pure', i)) === row(buildFloor('other', i)) && buildFloor('pure', i).twist === buildFloor('other', i).twist) same++;
  assert.ok(same < 3, `${same} of 200 floors alike between two seeds`);
  // the twists use the whole turn
  const tw = new Set(); for (let i = 0; i < 400; i++) tw.add(twistOf(h, i) >> 8);
  assert.equal(tw.size, 16, 'the twists land all round the ring');
});

const P1 = { floors: 0, hugEarly: 0, reds: 0, maxRed: 0, minSafe: 12 };
const proof1 = proof((h, i, fl) => {
  P1.floors++;
  const g = count(fl.gap), r = count(fl.red), safe = SLICES - g - r;
  // (the messages are only built when a rule breaks — this runs 550,000 times)
  if (g < 1) assert.fail(`floor ${i}: no gap`);
  if (safe < 3) assert.fail(`floor ${i}: ${safe} safe slices (${row(fl)})`);
  if (r > 8) assert.fail(`floor ${i}: ${r} red`);
  if (fl.gap & fl.red) assert.fail(`floor ${i}: a slice of two kinds`);
  if (g > GEN.gapSlicesMax) assert.fail(`floor ${i}: ${g} gap slices`);
  if (i < 10 && fl.red) assert.fail(`floor ${i} has red (${row(fl)})`);
  for (let s = 0; s < SLICES; s++) {
    if (bit(fl.gap, s) && bit(fl.gap, s - 1) && bit(fl.gap, s + 1)) assert.fail(`floor ${i}: a gap wider than 2 slices (${row(fl)})`);
    if (bit(fl.red, s) && (bit(fl.gap, s - 1) || bit(fl.gap, s + 1))) { if (i < 40) P1.hugEarly++; }
  }
  P1.reds += r; if (r > P1.maxRed) P1.maxRed = r; if (safe < P1.minSafe) P1.minSafe = safe;
});
test(`FAIR BY CONSTRUCTION 1 — over ${SEEDS} seeds × ${FLOORS} floors (+ ${DEEP_SEEDS} seeds down to floor ${DEEP_TO}): every floor has ≥ 1 gap and ≥ 3 safe slices, red is never more than 8 of 12, floors 0–9 have NO red, red sits beside a gap only from floor 40, gaps are 1 or 2 slices wide and never touch`, () => {
  verdict(proof1);
  const { floors, hugEarly, maxRed, minSafe } = P1;
  assert.equal(hugEarly, 0, 'above floor 40 no red slice touches a gap');
  assert.equal(floors, SEEDS * FLOORS + DEEP_SEEDS * (DEEP_TO - FLOORS));
  assert.ok(maxRed === 8 && minSafe === 3, `the bounds are reached deep down (red ≤ ${maxRed}, safe ≥ ${minSafe}) — and never passed`);
});

const P2 = { pairs: 0 };
const proof2 = proof((h, i, fl, up) => {
  if (i === 0) { assert.equal(kindAt(fl, sliceUnder(0, fl.twist)), SAFE, 'floor 0: solid, not red, under the ball at the start'); return; }
  if (i >= GEN.belowUntil || !fl.red) return;
  // this file's own maths: every slice of THIS floor that shares an angle with a gap slice of the floor above
  for (let g = 0; g < SLICES; g++) {
    if (!bit(up.gap, g)) continue;
    const lo = wrap(sliceStart(g) + up.twist - fl.twist), hi = wrap(sliceStart(g + 1) - 1 + up.twist - fl.twist);
    for (let s = sliceOf(lo); ; s = (s + 1) % SLICES) {
      P2.pairs++;
      if (bit(fl.red, s)) assert.fail(`floor ${i}: slice ${s} is red straight below a gap of floor ${i - 1} (${row(up)} twist ${up.twist} over ${row(fl)} twist ${fl.twist})`);
      if (s === sliceOf(hi)) break;
    }
  }
});
test(`FAIR BY CONSTRUCTION 2 — FLOOR 0 + THE EARLY AREAS over ${SEEDS} seeds: the slice under the ball at the start (A = 0) is SAFE; on floors < ${GEN.belowUntil} every slice straight below a gap (the two twists counted) is never red`, () => {
  assert.equal(GEN.belowUntil, 120, 'the early areas = THE ROOFTOP + THE OFFICES + THE SPEAKEASY');
  verdict(proof2);
  const { pairs } = P2;
  assert.ok(pairs > 500000, `${pairs} slice pairs looked at`);
  // … and angle by angle for 20 seeds: a ball that falls through ANY point of a gap without a touch lands on SAFE or a GAP
  let drops = 0;
  for (let k = 0; k < 20; k++) {
    const h = seedHash(`t${k}`);
    for (let i = 1; i < GEN.belowUntil; i++) {
      const up = floorAt(h, i - 1), fl = floorAt(h, i);
      for (let A = 0; A < TURN; A++) {
        if (kindAt(up, sliceUnder(A, up.twist)) !== GAP) continue;
        drops++;
        if (kindAt(fl, sliceUnder(A, fl.twist)) === RED) assert.fail(`seed t${k} floor ${i} angle ${A}: red straight below a gap`);
      }
    }
  }
  assert.ok(drops > 1500000, `${drops} straight drops`);
});

const P3 = { runs: 0, traps: 0, widest: 0 };
const inArc = (x, lo, len) => wrap(x - lo) < len;
// slice by slice, this file's own interval maths: a red run's TRAP (its points further than REACH from both its ends) never shares an angle with a gap above
const proof3 = proof((h, i, fl, up) => {
  if (i === 0 || !fl.red) return;
  for (let s = 0; s < SLICES; s++) {
    if (!bit(fl.red, s) || bit(fl.red, s - 1)) continue;
    let k = 1; while (bit(fl.red, s + k)) k++;
    P3.runs++; if (k > P3.widest) P3.widest = k;
    let width = 0; for (let q = 0; q < k; q++) width += sliceStart((s + q) % SLICES + 1) - sliceStart((s + q) % SLICES);
    const reach = i < GEN.belowUntil ? 0 : REACH, t0 = wrap(sliceStart(s) + reach), tl = width - 2 * reach;
    if (tl <= 0) continue;
    P3.traps++;
    for (let g = 0; g < SLICES; g++) {
      if (!bit(up.gap, g)) continue;
      const g0 = wrap(sliceStart(g) + up.twist - fl.twist), gl = sliceStart(g + 1) - sliceStart(g);
      // (two arcs of a ring meet exactly when one's first point lies in the other)
      if (inArc(t0, g0, gl) || inArc(g0, t0, tl)) assert.fail(`floor ${i}: a trap of red under a gap (${row(up)} twist ${up.twist} over ${row(fl)} twist ${fl.twist})`);
    }
  }
});
test(`FAIR BY CONSTRUCTION 3 — THE FALL WINDOW over ${SEEDS} seeds, every floor: from ANY point of ANY gap, a human-paced spin (a ${HUMAN.react}-tick reaction, then ≤ ${HUMAN.spin} units a tick — 1 turn a second) reaches a SAFE or GAP point of the floor below before the landing`, () => {
  assert.deepEqual(HUMAN, { react: 12, spin: 68 }, '200 ms, then 1 turn a second (4096 / 60 ≈ 68 units a tick)');
  assert.equal(REACH, (FALL - HUMAN.react) * HUMAN.spin, 'the reach = the ticks left after the reaction × the human spin');
  assert.ok(REACH > 0, 'the fall is longer than the reaction');
  verdict(proof3);
  const { runs, traps, widest } = P3;
  assert.ok(runs > 400000 && traps > 100000 && widest >= 6, `${runs} red runs, ${traps} with a trap, the longest ${widest} slices`);
  // … and ANGLE BY ANGLE for 24 seeds, floors 1 … 259: the nearest not-red point is never further than REACH from where the ball comes through
  let points = 0, worst = 0;
  const far = new Int32Array(TURN), band = new Array(13).fill(0);   // (the hardest escape seen, per 20 floors)
  for (let k = 0; k < 24; k++) {
    const h = seedHash(`t${k}`);
    for (let i = 1; i < 260; i++) {
      const up = floorAt(h, i - 1), fl = floorAt(h, i);
      if (!fl.red) continue;
      // the distance from every angle of this floor to its nearest point that is not red (two sweeps round the ring)
      let d = TURN;
      for (let n = 0; n < 2 * TURN; n++) { const u = n % TURN; d = kindAt(fl, sliceOf(u)) === RED ? d + 1 : 0; if (n >= TURN || d < TURN) far[u] = d > TURN ? TURN : d; }
      d = TURN;
      for (let n = 2 * TURN - 1; n >= 0; n--) { const u = n % TURN; d = kindAt(fl, sliceOf(u)) === RED ? d + 1 : 0; if (d < far[u]) far[u] = d; }
      // (THE RAMP — the reviewer's find: no cliff at floor 120. The escape a floor may ask for grows from 0 to the human reach over 40 floors)
      const reach = reachAt(i);
      for (let A = 0; A < TURN; A++) {
        if (kindAt(up, sliceUnder(A, up.twist)) !== GAP) continue;
        points++;
        const need = far[wrap(BALL - A - fl.twist)];
        if (need > worst) worst = need;
        if (need > band[Math.min(band.length - 1, Math.floor(i / 20))]) band[Math.min(band.length - 1, Math.floor(i / 20))] = need;
        if (need > reach) assert.fail(`seed t${k} floor ${i} angle ${A}: the nearest safe point is ${need} units away (this floor may ask for ${reach})`);
      }
    }
  }
  assert.ok(points > 2000000, `${points} points of gaps tried`);
  assert.ok(worst > REACH / 2 && worst <= REACH, `the tightest escape in the proof: ${worst} of ${REACH} units`);
  // THE RAMP: nothing to escape above floor 120, then a little more every 20 floors, the full human reach only from floor 160
  assert.deepEqual([GEN.belowUntil, GEN.windowRamp], [120, 40]);
  assert.deepEqual([reachAt(0), reachAt(119), reachAt(120), reachAt(130), reachAt(140), reachAt(159), reachAt(160), reachAt(999)], [0, 0, 0, 102, 204, 397, 408, 408]);
  assert.deepEqual(band.slice(0, 6), [0, 0, 0, 0, 0, 0], 'floors 0–119: a straight drop through a gap never needs an escape');
  assert.ok(band[6] > 0 && band[6] <= reachAt(139) && band[7] > band[6] && band[7] <= reachAt(159) && band[8] > band[7], `the hardest escape by depth: floors 120–139 ${band[6]} units · 140–159 ${band[7]} · 160–179 ${band[8]}`);
});

const P4 = { safeSlices: 0, hops: 0 };
const proof4 = proof((h, i, fl) => {
  if (!fl.red) return;
  // this file's own search: from each safe slice, step to a neighbour that is not red, or hop a red run of ≤ HOP slices — until a gap
  for (let s0 = 0; s0 < SLICES; s0++) {
    if (bit(fl.gap, s0) || bit(fl.red, s0)) continue;
    P4.safeSlices++;
    let seen = 1 << s0, todo = 1 << s0, found = false;   // (two 12-bit sets: the slices reached · the ones still to walk from)
    while (todo && !found) {
      const s = 31 - Math.clz32(todo);
      todo &= ~(1 << s);
      for (let dir = 1; dir >= -1; dir -= 2) {
        let k = 0;
        while (k < SLICES && bit(fl.red, s + dir * (k + 1))) k++;
        if (k > HOP) continue;
        const to = ((s + dir * (k + 1)) % SLICES + SLICES) % SLICES;
        if (k) P4.hops++;
        if (bit(fl.gap, to)) { found = true; break; }
        if (!((seen >> to) & 1)) { seen |= 1 << to; todo |= 1 << to; }
      }
    }
    if (!found) assert.fail(`floor ${i}: slice ${s0} is walled in (${row(fl)})`);
  }
});
test(`FAIR BY CONSTRUCTION 4 — NO ISLAND over ${SEEDS} seeds, every floor: from EVERY safe slice a gap can be reached by human-paced hops — a red run is crossed inside one bounce only when it is ≤ ${HOP} slices`, () => {
  assert.equal(HOP, Math.floor(((BOUNCE - HUMAN.react) * HUMAN.spin) / 342) - 1, 'the hop = the slices a human-paced spin crosses in one bounce after the reaction, a slice of slack kept');
  assert.ok(HOP >= 2);
  verdict(proof4);
  const { safeSlices, hops } = P4;
  assert.ok(safeSlices > 2000000 && hops > 100000, `${safeSlices} safe slices, ${hops} hops over red`);
  // the two checks the builder uses, on hand-made rings (bit s = slice s)
  const m = str => [...str].reduce((a, c, s) => a | ((c === 'G' ? 1 : 0) << s), 0), r = str => [...str].reduce((a, c, s) => a | ((c === 'R' ? 1 : 0) << s), 0);
  const island = (str, hop) => reachOk(m(str), r(str), hop);
  assert.equal(island('GsssRRRRRRRR', 2), true, 'one stretch, it holds the gap');
  assert.equal(island('GRRRsssRRRRR', 2), false, 'three safe slices walled in by runs of 3 and 5');
  assert.equal(island('GRRRsssRRRRR', 3), true, '… a hop of 3 gets out');
  assert.equal(island('GRRsRRRsRRRs', 2), false, 'the middle slice hops 2 to the gap\'s side — the others are walled in by runs of 3');
  assert.equal(island('GRRsRRsRRsRR', 2), true, 'hop after hop');
  assert.equal(island('RRRRRRRRRRRR', 9), false);
  assert.equal(windowOk(r('RRRsssssssss'), 0, m('sGssssssssss'), 0, 0), false, 'red straight below a gap (no reach)');
  assert.equal(windowOk(r('RRRsssssssss'), 0, m('ssssGsssssss'), 0, 0), true);
  assert.equal(windowOk(r('RRRsssssssss'), 0, m('sGssssssssss'), 0, 408), false, 'the middle of a 3-slice run is further than 408 units from both ends');
  assert.equal(windowOk(r('RRssssssssss'), 0, m('sGssssssssss'), 0, 408), true, 'a 2-slice run (683 units): every point is within 408 of an end');
  assert.equal(windowOk(r('RRRsssssssss'), 3000, m('sGssssssssss'), 0, 0), true, 'the twists count: this floor turned 3000 units, the gap above is no longer over the red');
});

test('THE DIFFICULTY RAMPS BY LAYOUT ONLY: down the tower the gaps get fewer and narrower (2-slice → 1-slice), the red grows and hugs the gaps — and THE TRENCH is harder each lap', () => {
  const bands = [[0, 10], [10, 40], [40, 80], [80, 120], [120, 160], [160, 200], [201, 241], [241, 281], [401, 441]].map(([from, to]) => ({ from, to, n: 0, gaps: 0, open: 0, wide: 0, red: 0, hug: 0, beside: 0 }));
  for (let k = 0; k < 300; k++) {
    const h = seedHash(`t${k}`);
    for (const b of bands) for (let i = b.from; i < b.to; i++) {
      const fl = floorAt(h, i);
      b.n++; b.open += count(fl.gap); b.red += count(fl.red);
      for (let s = 0; s < SLICES; s++) {
        if (bit(fl.gap, s) && !bit(fl.gap, s - 1)) { b.gaps++; if (bit(fl.gap, s + 1)) b.wide++; }
        if (!bit(fl.gap, s) && (bit(fl.gap, s - 1) || bit(fl.gap, s + 1))) { b.beside++; if (bit(fl.red, s)) b.hug++; }
      }
    }
  }
  const t = bands.map(b => ({ area: `${b.from}–${b.to - 1}`, gaps: b.gaps / b.n, open: b.open / b.n, wide: b.wide / b.gaps, red: b.red / b.n, hug: b.hug / b.beside }));
  console.log(`[freefall-tower] the layout by area — ${t.map(x => `${x.area}: ${x.gaps.toFixed(2)} gaps (${(x.wide * 100).toFixed(0)} % wide), ${x.red.toFixed(2)} red, ${(x.hug * 100).toFixed(0)} % hug`).join(' | ')}`);
  for (let j = 1; j < t.length; j++) {
    assert.ok(t[j].red >= t[j - 1].red - 0.02, `the red grows: ${t[j].area}`);
    assert.ok(t[j].open <= t[j - 1].open + 0.02, `the open slices shrink: ${t[j].area}`);
    assert.ok(t[j].wide <= t[j - 1].wide + 0.02, `the gaps narrow: ${t[j].area}`);
    assert.ok(t[j].hug >= t[j - 1].hug - 0.02, `the red hugs the gaps more: ${t[j].area}`);
  }
  assert.equal(t[0].red, 0); assert.equal(t[1].hug, 0, 'no hugging above floor 40');
  assert.ok(t[0].wide === 1 && t[0].gaps > 1.9, 'THE ROOFTOP: two 2-slice gaps a floor (now and then one)');
  assert.ok(t[5].wide < 0.2 && t[5].gaps < 1.3, 'THE DEEP: mostly ONE 1-slice gap');
  assert.ok(t[6].wide === 0 && t[6].gaps === 1, 'THE TRENCH: one 1-slice gap');
  assert.ok(t[8].red > t[6].red + 0.5 && t[8].red <= 8, `THE TRENCH's laps: ${t[6].red.toFixed(2)} → ${t[8].red.toFixed(2)} red slices`);
  // the curves themselves: integers, straight lines between their knots, held past the ends
  assert.equal(rampOf([[10, 100], [20, 200]], 5), 100); assert.equal(rampOf([[10, 100], [20, 200]], 15), 150); assert.equal(rampOf([[10, 100], [20, 200]], 99), 200);
  for (const K of [GEN.gaps, GEN.wide, GEN.red, GEN.hug]) for (let i = 0; i < 260; i++) assert.ok(Number.isInteger(rampOf(K, i)));
});

test('A RULE-SET ROW owns the layout: a what-if row (makeRuleSet) builds its own tower, the classic row is untouched — and its derived reach + hop follow its own numbers', () => {
  const plain = JSON.parse(JSON.stringify(RULE_SETS.classic));
  delete plain.reach; delete plain.hop;
  const soft = makeRuleSet({ ...plain, id: 'soft', fall: 12, gen: { ...plain.gen, red: [[10, 256], [200, 512]] } });
  assert.equal(soft.reach, 0, 'a fall no longer than the reaction: no reach — red is never straight below a gap, on any floor');
  assert.ok(Object.isFrozen(soft) && Object.isFrozen(soft.gen) && Object.isFrozen(soft.gen.red[0]) && Object.isFrozen(RULE_SETS.classic.modes.match));
  const h = seedHash('row');
  let less = 0, same = 0;
  for (let i = 0; i < 200; i++) {
    const a = floorAt(h, i), b = floorAt(h, i, soft);
    assert.equal(a.twist, b.twist); assert.equal(a.gap, b.gap, 'the gaps + the twists are the seed\'s own');
    if (count(b.red) < count(a.red)) less++; else if (b.red === a.red) same++;
    if (i > 0 && b.red) for (let A = 0; A < TURN; A += 3) { const up = floorAt(h, i - 1, soft); if (kindAt(up, sliceUnder(A, up.twist)) === GAP) assert.notEqual(kindAt(b, sliceUnder(A, b.twist)), RED); }
  }
  assert.ok(less > 100, `the softer row lays less red on ${less} of 200 floors`);
  assert.deepEqual(floorAt(h, 150), floorAt(h, 150, RULE_SETS.classic));
});
