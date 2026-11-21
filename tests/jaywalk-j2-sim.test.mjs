// JAYWALK J2 — COURSE RULES v2, FAIR BY CONSTRUCTION (docs/jaywalk.md "EVEN STARTS" · "THE BLACKBIRD's RUNWAYS"): the even opening's rules on
// thousands of seeds (and the same overall difficulty as v1); every runway's shape (3–4 lanes, a jet a lane, the tell ≥ MIN_TELL_TICKS, the
// trail, a SAFE lane before + after, from lane 120, THE AIRFIELD full of them) and its PASSABILITY — a careful kid (waiting + hopping) gets
// across from every start tick, checked by a search of its own through the REAL hit test at three columns; the blind cross is a real threat
// (v1 ≈ 5 %); the trail kills with 'blackbird' and the boom moment still works; v2 lanes are pure (any order) and differ from v1's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCourse, specials, typeAt, laneHit, pulseAt, runwaySlack, runwayWait } from '../js/games/jaywalk/course.js';
import { createRun, step, isOver } from '../js/games/jaywalk/engine.js';
import { replay } from '../js/games/jaywalk/replay.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';
import { CALM_LANES, STRETCH, EVEN, RUNWAY, MIN_TELL_TICKS, FIRST, WATER_RUN_MAX, RAIL_RUN_MAX, FP, HOP_TICKS } from '../js/games/jaywalk/tuning.js';

const seeds = (n, tag) => Array.from({ length: n }, (_, k) => `${tag}${k}`);
const runwaysOf = (seed, upTo = 18) => { const out = []; for (let s = 1; s < upTo; s++) for (const r of specials(seed, s, 2).rw) out.push(r); return out; };

test('EVEN STARTS (v2): the opening never runs free — ≤ 2 ground lanes in a row, ≤ 5 in any 10, ≤ 3 hazards in a row, the calm first lanes, no early water / rail, the run caps — 3,000 seeds', () => {
  let g1 = 0, g2 = 0;
  for (const s of seeds(3000, 'ev')) {
    const k = i => typeAt(s, i, null, 2);
    for (let i = 0; i < CALM_LANES; i++) assert.equal(k(i), 'grass', `${s} lane ${i}: the calm opening`);
    let g = 0, hz = 0, w = 0, r = 0;
    for (let i = CALM_LANES; i < STRETCH; i++) {
      const t = k(i);
      g = t === 'grass' ? g + 1 : 0; hz = t === 'grass' ? 0 : hz + 1; w = t === 'water' ? w + 1 : 0; r = t === 'rail' ? r + 1 : 0;
      assert.ok(g <= EVEN.grassRun, `${s} lane ${i}: ${g} ground lanes in a row`);
      assert.ok(hz <= EVEN.hazardRun + 1, `${s} lane ${i}: ${hz} hazards in a row`);   // (a water / rail cap may force ground only where ground is allowed)
      assert.ok(w <= WATER_RUN_MAX && r <= RAIL_RUN_MAX, `${s} lane ${i}: the run caps`);
      if (t === 'water') assert.ok(i >= FIRST.water); if (t === 'rail') assert.ok(i >= FIRST.rail);
      if (i >= CALM_LANES + 9) { let n = 0; for (let j = i - 9; j <= i; j++) if (k(j) === 'grass') n++; assert.ok(n <= EVEN.grassPer10, `${s} lanes ${i - 9}–${i}: ${n} ground lanes in 10`); }
      if (t === 'grass') g2++;
      if (typeAt(s, i, null, 1) === 'grass') g1++;
    }
  }
  const n = 3000 * (STRETCH - CALM_LANES), a = g1 / n, b = g2 / n;
  assert.ok(Math.abs(a - b) < 0.06, `the overall ground share stays the curve's: v1 ${(a * 100).toFixed(1)} % · v2 ${(b * 100).toFixed(1)} %`);
});

test('EVEN STARTS: past the opening a v2 lane KIND is v1\'s — except a runway, its safe lanes and a UFO\'s stretch (the areas + the curve untouched)', () => {
  let same = 0, all = 0;
  for (const s of seeds(150, 'ek')) {
    const R = runwaysOf(s, 10), near = i => R.some(r => i >= r.y0 - 1 && i <= r.y0 + r.n);
    for (let i = STRETCH; i < 500; i++) {
      const sp1 = specials(s, Math.floor(i / STRETCH), 1), sp2 = specials(s, Math.floor(i / STRETCH), 2);
      if (near(i) || sp1.bb || sp1.ufo || sp2.ufo) continue;
      all++; if (typeAt(s, i, null, 1) === typeAt(s, i, null, 2)) same++;
    }
  }
  assert.equal(same, all, `${same} / ${all}`);
});

test('THE RUNWAYS (v2): 3–4 flight lanes, a jet a lane on ONE lap, every tell 1.2 s (J2 FIX), the jet’s speed by where it is, THE TRAIL, the lap 3 – 6 s, a SAFE ground lane before + after, from lane 120, never back to back, THE AIRFIELD four — 1,500 seeds', () => {
  let n = 0, af = 0;
  for (const s of seeds(1500, 'rw')) {
    const C = createCourse(s, { cv: 2 }), R = runwaysOf(s);
    for (let k = 0; k < R.length; k++) {
      const r = R[k];
      n++;
      assert.ok(r.n === 3 || r.n === 4, `${s} @${r.y0}: ${r.n} lanes`);
      assert.ok(r.y0 >= RUNWAY.first, `${s}: a runway at ${r.y0}`);
      assert.equal(C.lane(r.y0 - 1).type, 'grass', `${s} @${r.y0}: the safe lane before`);
      assert.equal(C.lane(r.y0 + r.n).type, 'grass', `${s} @${r.y0}: the safe lane after`);
      if (k) assert.ok(r.y0 > R[k - 1].y0 + R[k - 1].n, `${s}: two runways back to back`);
      for (let j = 0; j < r.n; j++) {
        const L = C.lane(r.y0 + j), p = L.pulse;
        assert.equal(L.type, 'flight');
        assert.ok(p.tell >= RUNWAY.tellMin && p.tell === RUNWAY.tell, 'the tell = 1.2 s (J2 FIX — v2’s own floor)');
        assert.ok(p.period >= RUNWAY.periodMin && p.period <= 360, `the lap ${p.period}`);
        assert.equal(p.trail, RUNWAY.trail); assert.equal(p.band, r.y0 + j); assert.equal(p.n, 1); assert.equal(p.rw, r.y0); assert.equal(p.rn, r.n);
        assert.ok(p.period - p.tell >= p.pass + p.trail, 'the tell begins only once the trail is out');
      }
      const phases = r.lanes.map(p => p.phase);
      assert.ok(new Set(phases).size > 1, `${s} @${r.y0}: never all at once`);
      assert.ok(runwaySlack(r.lanes) >= RUNWAY.slack, `${s} @${r.y0}: a careful way across`);
      assert.ok(runwayWait(r.lanes) <= RUNWAY.wait, `${s} @${r.y0}: the careful wait ≤ ${RUNWAY.wait} ticks (J2 FIX)`);
      const air = (Math.floor(r.y0 / STRETCH) - 1) % 8 === 7, v = r.lanes[0].v;
      assert.equal(v, RUNWAY.v[air ? 2 : r.y0 < 250 ? 0 : 1], `${s} @${r.y0}: the jet's speed`); assert.ok(r.lanes.every(p => p.v === v && p.len === RUNWAY.len));
    }
    for (let s2 = 8; s2 < 18; s2 += 8) { const sp = specials(s, s2, 2); assert.equal(sp.rw.length, RUNWAY.airfield, `${s}: THE AIRFIELD's runways`); assert.equal(sp.ufo, null); af++; }
  }
  assert.ok(n > 15000, `${n} runways`); assert.equal(af, 3000);
});

/** THE CAREFUL KID, a search of its own (independent of runwaySlack): wait a tick / hop up — the REAL hit test (course.js#laneHit) at THREE
 *  columns at once (the strictest); from the lane before the runway at tick t0 → the tick he lands on the lane after it (−1 = none in H) */
function across(C, r, t0, H = 600) {
  const deadly = (L, T) => [500, 4500, 8500].some(x => laneHit(C.lane(L), T, x));
  const half = HOP_TICKS >> 1, seen = new Set(), q = [[r.y0 - 1, t0]];
  for (let h = 0; h < q.length; h++) {
    const [L, t] = q[h], key = L * 1e6 + t;
    if (seen.has(key)) continue; seen.add(key);
    if (L === r.y0 + r.n) return t;
    if (t - t0 > H) continue;
    if (!deadly(L, t + 1)) q.push([L, t + 1]);
    let ok = true;
    for (let u = 1; u < half && ok; u++) if (deadly(L, t + u)) ok = false;
    for (let u = half; u <= HOP_TICKS && ok; u++) if (deadly(L + 1, t + u)) ok = false;
    if (ok) q.push([L + 1, t + HOP_TICKS]);
  }
  return -1;
}

test('FAIR BY CONSTRUCTION: a careful kid is NEVER trapped — from every start tick of a lap (every 4th) at every runway of 160 seeds he gets across, the worst wait ≤ 4 s (the solo wall gives him 8 s at its nearest)', () => {
  let starts = 0, worst = 0;
  for (const s of seeds(160, 'fair')) {
    const C = createCourse(s, { cv: 2 });
    for (const r of runwaysOf(s)) {
      const P = r.lanes[0].period;
      for (let t0 = 0; t0 < P; t0 += 4) {
        const T0 = 100 * P + t0, got = across(C, r, T0);
        assert.ok(got >= 0, `${s} runway @${r.y0} (×${r.n}, lap ${P}): trapped from tick ${t0}`);
        worst = Math.max(worst, got - T0 - (r.n + 1) * HOP_TICKS); starts++;
      }
    }
  }
  assert.ok(worst <= 240, `the worst wait ${worst} ticks`);
  assert.ok(starts > 50000, `${starts} start ticks`);
});

test('A REAL THREAT: a BLIND cross (straight up, hop after hop, at a random tick) is hit far more often on a v2 runway than on a v1 band (≈ 5 %) — 250 seeds each', () => {
  const blind = cv => {
    let hit = 0, n = 0;
    for (const s of seeds(250, 'bl')) {
      const C = createCourse(s, { cv });
      const bands = []; for (let k = 1; k < 18; k++) { const sp = specials(s, k, cv); if (sp.rw) bands.push(...sp.rw); else for (const b of [sp.bb, sp.bb2]) if (b) bands.push(b); }
      for (const b of bands) {
        const P = C.lane(b.y0).pulse.period;
        for (let t0 = 0; t0 < P; t0 += 7) {
          const run = createRun({ seed: s, mode: 'solo' }); Object.assign(run, { y: b.y0 - 1, x: 4500, t: 50 * P + t0, best: b.y0 - 1, wall: -1e12 });
          let d = 'u', ups = 1;
          for (let i = 0; i < 9 * (b.n + 2) && !isOver(run) && run.y < b.y0 + b.n; i++) { step(run, C, d); d = ''; if (run.st === 'hop' && !run.buf && ups < b.n + 1) { d = 'u'; ups++; } }
          if (run.cause && run.cause !== 'blackbird') continue;
          n++; if (run.cause === 'blackbird') hit++;
        }
      }
    }
    return hit / n;
  };
  const v1 = blind(1), v2 = blind(2);
  assert.ok(v1 < 0.1, `v1 ${(v1 * 100).toFixed(1)} %`);
  assert.ok(v2 > 0.5 && v2 < 0.9, `v2 ${(v2 * 100).toFixed(1)} %`);
});

test('THE AFTERBURNER TRAIL in the engine: a kid standing on a runway lane is hit through the pass (behind the jet) and the trail — cause \'blackbird\' — and safe once it is out; the SONIC BOOM still means a close pass', () => {
  const s = 'trailtest', C = createCourse(s, { cv: 2 }), r = runwaysOf(s)[0], L = r.y0, p = C.lane(L).pulse, P = p.period;
  const standAt = t => { const run = createRun({ seed: s, mode: 'solo' }); Object.assign(run, { y: L, x: 4500, t: t - 1, best: L, wall: -1e12 }); step(run, C, ''); return run; };
  const base = 40 * P + p.phase;   // (a lap's first pass tick)
  for (let u = 0; u < p.pass + p.trail; u++) {
    const T = base + u, inPass = u < p.pass, x = 4500;
    const want = inPass ? laneHit(C.lane(L), T, x) === 'blackbird' : true;
    if (!want) continue;   // (in the pass, before the jet has reached the middle column)
    assert.equal(standAt(T).cause, 'blackbird', `u ${u}`);
  }
  for (const u of [p.pass + p.trail, p.pass + p.trail + 5, P - p.tell - 1, P - 5]) assert.equal(standAt(base + u).cause, '', `quiet at u ${u}`);
  assert.equal(pulseAt(p, base + p.pass + 3).st, 'trail'); assert.equal(pulseAt(p, base + p.pass + p.trail).st, 'idle');
  // THE BOOM: on the lane as its tell begins, off it (one hop down — the safe lane) before the pass → the moment
  const run = createRun({ seed: s, mode: 'solo' }), t0 = 40 * P + p.phase - p.tell - 1;
  Object.assign(run, { y: L, x: 4500, t: t0, best: L, wall: -1e12 });
  step(run, C, ''); step(run, C, 'd');
  for (let i = 0; i < p.tell + p.pass + 4 && !isOver(run); i++) step(run, C, '');
  assert.equal(run.cause, ''); assert.equal(run.boom, 1, 'SONIC BOOM: the close pass');
});

test('v2 is PURE + its own: the same lanes in any order (runways included); a whole bot run replays = the live run; it differs from v1', () => {
  for (const s of seeds(30, 'pure')) {
    const a = createCourse(s, { cv: 2 }), b = createCourse(s, { cv: 2 }), c = createCourse(s, { cv: 1 });
    const fwd = []; for (let i = 0; i < 520; i++) fwd.push(JSON.stringify(a.lane(i)));
    for (let i = 519; i >= 0; i--) assert.equal(JSON.stringify(b.lane(i)), fwd[i], `${s} lane ${i}`);
    let diff = 0; for (let i = 0; i < 520; i++) if (JSON.stringify(c.lane(i)) !== fwd[i]) diff++;
    assert.ok(diff > 20, `${s}: v2 differs from v1 (${diff} lanes)`);
  }
  for (const s of seeds(12, 'live')) {
    const C = createCourse(s, { cv: 2 }), run = createRun({ seed: s, mode: 'solo' }), log = playBot(run, C, greedyBot({ seed: s }), 4 * 60 * 60);
    while (!isOver(run)) step(run, C, '');
    const r = replay({ seed: s, mode: 'solo', log, cv: 2 });
    assert.equal(r.lanes, run.best); assert.equal(r.cause, run.cause); assert.deepEqual(r.splits, run.sp);
  }
  void FP;
});
