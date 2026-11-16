// JAYWALK H1 — THE WHOLE-RUN SIMULATIONS (docs/jaywalk.md "FAIR BY CONSTRUCTION"): a greedy bot + a random bot over 2,000 seeds PER MODE
// through the real engine, and every lane's own numbers checked — every lane has a crossable window (no impossible lane), the opening is
// calm, the difficulty rises, THE BLACKBIRD's tell ≥ 1.5 s every time, THE UFO + THE BLACKBIRD never share a stretch. (The deep runs, the
// caps + the card moments: tests/jaywalk-deep.test.mjs. H4 — ONE LIFE in every mode: the first hit ends the run.)
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../js/games/jaywalk/tuning.js';
import { buildLane, specials, createCourse, pulseAt, typeAt } from '../js/games/jaywalk/course.js';
import { createRun, resultOf } from '../js/games/jaywalk/engine.js';
import { greedyBot, randomBot, playBot } from '../js/games/jaywalk/bot.js';

const SEEDS = 2000;
const seedOf = (mode, s) => `${mode}-${s}`;

/** one lane's own numbers → why it could not be crossed (null = it has a window) */
function laneProblem(seed, L) {
  if (L.type === 'grass') {
    if (L.obs[T.MID_COL]) return 'an obstacle on the centre column';
    if (L.obs.filter(Boolean).length > 6) return 'too many obstacles';
    return null;
  }
  if (L.type === 'road' || L.type === 'water') {
    if (L.period < T.WIDTH + L.pad) return 'a lap shorter than the screen';
    const it = L.items;
    for (let j = 0; j < it.length; j++) {
      const gap = (j + 1 < it.length ? it[j + 1].off : L.period) - (it[j].off + it[j].len);
      if (L.type === 'road' && gap < 2 * T.KID_HALF + L.v * (T.HOP_TICKS + 12)) return `a gap of ${gap} no kid fits through at v ${L.v}`;
      if (L.type === 'water') {
        // (H3: every log its OWN length, 1–4 whole cells; a 1-cell log only on a slow lane with no water beside it; a landing window ≥ 26 ticks)
        if (![1, 2, 3, 4].includes(it[j].len / T.FP)) return `a log of ${it[j].len}`;
        if (it[j].len === T.FP && (L.v > T.WATER.oneV || [L.i - 1, L.i + 1].some(n => buildLane(seed, n).type === 'water'))) return `a 1-cell log on a lane at v ${L.v} / beside water`;
        if ((it[j].len + 2 * T.LOG_GRACE) / L.v < 26) return `a log of ${it[j].len} at v ${L.v}: a landing window under 26 ticks`;
        if (gap < T.WATER.gapShort[0] || gap > T.WATER.gapMin + 3200) return `${gap} of open water between two logs`;
      }
    }
    if (L.type === 'water') {
      for (const n of [L.i - 1, L.i + 1]) { const N = buildLane(seed, n); if (N.type === 'water' && N.dir === L.dir) return 'two water lanes side by side running the same way'; if (N.type === 'grass' && N.obs.some(Boolean)) return 'an obstacle beside the water'; }
      if (L.ufo) return 'water under a UFO';
    }
    return null;
  }
  const p = L.pulse;   // rail / flight
  if (p.period - p.pass - p.tell < 40) return `no quiet time in a lap of ${p.period}`;
  if (L.type === 'flight' && p.tell < T.MIN_TELL_TICKS) return `a tell of ${p.tell} ticks`;
  if (L.type === 'rail' && L.ufo) return 'a rail under a UFO';
  return null;
}

test(`${SEEDS} seeds: EVERY LANE HAS A CROSSABLE WINDOW (cars' gaps, logs within reach + opposite ways, a train's quiet time, the centre column free) · the opening is CALM`, () => {
  const bad = [];
  let lanes = 0;
  for (let s = 0; s < SEEDS; s++) {
    const seed = `c${s}`;
    for (let i = 0; i < 4; i++) { const L = buildLane(seed, i); if (L.type !== 'grass' || L.obs.some(Boolean)) bad.push(`${seed} lane ${i}: the first lanes are plain grass`); }
    // the opening (every lane to 40) + lanes all the way up the curve and into the loop
    for (let i = 4; i < 700; i += i < 40 ? 1 : 13 + (s % 7)) {
      const L = buildLane(seed, i); lanes++;
      if (i < T.FIRST.water && L.type === 'water') bad.push(`${seed} lane ${i}: water in the opening`);
      if (i < T.FIRST.rail && L.type === 'rail') bad.push(`${seed} lane ${i}: a rail in the opening`);
      if (i < T.FIRST.ufo - 1 && L.ufo) bad.push(`${seed} lane ${i}: a UFO before lane 100`);
      if (i < T.FIRST.flight && L.type === 'flight') bad.push(`${seed} lane ${i}: THE BLACKBIRD before lane 150`);
      const why = laneProblem(seed, L);
      if (why) bad.push(`${seed} lane ${i} (${L.type}): ${why}`);
    }
    for (let i = 20; i < 700; i += 61) { let run = 0; for (let k = 0; k < 5; k++) run = typeAt(seed, i + k) === 'water' ? run + 1 : 0; if (run > T.WATER_RUN_MAX) bad.push(`${seed} lane ${i}: ${run} water lanes in a row`); }
  }
  assert.ok(lanes > 100000, `${lanes} lanes checked`);
  assert.deepEqual(bad.slice(0, 8), [], 'every lane, every seed');
});

test(`${SEEDS} seeds: THE UFO + THE BLACKBIRD are never in one stretch · the UFO from lane 100, THE BLACKBIRD from 150 · its tell ≥ 1.5 s EVERY time`, () => {
  let ufos = 0, bbs = 0, laps = 0;
  for (let s = 0; s < SEEDS; s++) {
    const seed = `sp${s}`;
    for (let st = 0; st < 14; st++) {
      const sp = specials(seed, st);
      assert.ok(!(sp.ufo && sp.bb), `${seed} stretch ${st}: both`);
      if (sp.ufo) { ufos++; assert.ok(sp.ufo.y0 >= T.FIRST.ufo && sp.ufo.y0 + sp.ufo.h < (st + 1) * T.STRETCH, 'the UFO: from lane 100, inside its stretch'); assert.ok(sp.ufo.vx !== 0 && sp.ufo.vy !== 0, 'it drifts both ways: no lane stays covered'); }
      if (sp.bb) {
        bbs++;
        assert.ok(sp.bb.y0 >= T.FIRST.flight && sp.bb.y0 + sp.bb.n < (st + 1) * T.STRETCH, 'the flight path: from lane 150, inside its stretch');
        const p = sp.bb.pulse;
        assert.ok(p.tell >= T.MIN_TELL_TICKS && p.tell * 1000 / T.TICK_HZ >= 1500, 'the tell ≥ 1.5 s');
        if (s % 20 === 0) {   // (walk a whole lap tick by tick: the pass is always announced by ≥ 90 ticks of tell)
          let tell = 0; laps++;
          for (let t = p.phase + p.pass; t < p.phase + p.period + 1; t++) { const st2 = pulseAt(p, t).st; if (st2 === 'tell') tell++; else if (st2 === 'pass') { assert.ok(tell >= T.MIN_TELL_TICKS, `${tell} ticks of tell before the pass`); tell = -1; break; } else assert.equal(tell, 0, 'the tell runs unbroken into the pass'); }
          assert.equal(tell, -1, 'the lap reached its pass');
          assert.ok(p.pass * 1000 / T.TICK_HZ <= 300, 'the pass is a split second');
        }
      }
      if (st < 2) assert.ok(!sp.ufo && !sp.bb, 'nothing rare before lane 100');
      if (st === 2) assert.ok(!sp.bb, 'no Blackbird before lane 150');
    }
  }
  assert.ok(ufos > SEEDS && bbs > SEEDS && laps > 50, `both show up (${ufos} UFOs, ${bbs} flight paths over ${SEEDS} seeds × 14 stretches) — and stay rare`);
  assert.ok(ufos < SEEDS * 14 * 0.5 && bbs < SEEDS * 14 * 0.5);
});

test('THE DIFFICULTY RISES with the lane index — the SAME curve on every course: less grass, faster cars, shorter + faster logs, more trains; harder again in the loop', () => {
  const band = (lo, hi) => {
    const o = { n: 0, grass: 0, rail: 0, carV: 0, cars: 0, logV: 0, logLen: 0, logs: 0 };
    for (let s = 0; s < 300; s++) for (let i = lo; i < hi; i++) {
      const L = buildLane(`d${s}`, i); o.n++;
      if (L.type === 'grass') o.grass++; else if (L.type === 'rail') o.rail++;
      else if (L.type === 'road') { o.carV += L.v; o.cars++; } else if (L.type === 'water') { o.logV += L.v; o.logs++; o.logLen += L.items.reduce((a, x) => a + x.len, 0) / L.items.length; }
    }
    return { grass: o.grass / o.n, rail: o.rail / o.n, carV: o.carV / o.cars, logV: o.logV / o.logs, logLen: o.logLen / o.logs };
  };
  const a = band(30, 48), b = band(205, 223), c = band(370, 388), d = band(560, 578);
  for (const [x, y, name] of [[a, b, 'lane 30 → 205'], [b, c, '205 → 370'], [c, d, '370 → 560 (the loop)']]) {
    assert.ok(y.grass < x.grass, `${name}: less grass (${x.grass.toFixed(2)} → ${y.grass.toFixed(2)})`);
    assert.ok(y.carV > x.carV, `${name}: faster cars`);
    assert.ok(y.logV > x.logV && y.logLen < x.logLen, `${name}: faster, shorter logs`);
    assert.ok(y.rail > x.rail, `${name}: more trains`);
  }
  assert.ok(a.logLen > 3 * T.FP && d.logLen <= 2.4 * T.FP, `the logs: long at first (mostly 3–4 cells: ${(a.logLen / T.FP).toFixed(2)}), short deep in the loop (mostly 1–2: ${(d.logLen / T.FP).toFixed(2)})`);
  // the same curve on every course: two seeds' heat is the lane's alone
  for (const i of [0, 77, 400, 999]) assert.equal(buildLane('x', i).heat, buildLane('y', i).heat);
});

test('H3 — THE LOGS: every log its OWN length (1–4 cells, all four show up; long ones more common early, short ones later), UNEVEN gaps (short + long on the same lane), the same lane on every build', () => {
  const count = (lo, hi) => {
    const n = [0, 0, 0, 0, 0], g = { short: 0, long: 0, mixed: 0, lanes: 0, own: 0 };
    for (let s = 0; s < 400; s++) for (let i = lo; i < hi; i++) {
      const L = buildLane(`w${s}`, i);
      if (L.type !== 'water') continue;
      g.lanes++;
      const gaps = L.items.map((it, j) => (j + 1 < L.items.length ? L.items[j + 1].off : L.period) - (it.off + it.len));
      for (const it of L.items) n[it.len / T.FP]++;
      for (const x of gaps) if (x <= T.WATER.gapShort[1]) g.short++; else g.long++;
      if (Math.max(...gaps) - Math.min(...gaps) >= 500) g.mixed++;
      if (new Set(L.items.map(it => it.len)).size > 1) g.own++;
      assert.equal(JSON.stringify(buildLane(`w${s}`, i)), JSON.stringify(L), 'the same lane, built again');
    }
    const all = n[1] + n[2] + n[3] + n[4];
    return { n, all, long: (n[3] + n[4]) / all, short: (n[1] + n[2]) / all, g };
  };
  const early = count(12, 60), mid = count(200, 248), late = count(420, 468);
  for (const b of [early, mid, late]) for (const k of [1, 2, 3, 4]) assert.ok(b.n[k] > 0, `a ${k}-cell log shows up (${b.n.slice(1)})`);
  assert.ok(early.long > 0.7 && early.long > mid.long && mid.long > late.long, `long logs more common early: ${early.long.toFixed(2)} → ${mid.long.toFixed(2)} → ${late.long.toFixed(2)}`);
  assert.ok(late.short > 0.6 && late.short > mid.short && mid.short > early.short, `short ones later: ${early.short.toFixed(2)} → ${mid.short.toFixed(2)} → ${late.short.toFixed(2)}`);
  for (const b of [early, mid, late]) {
    assert.ok(b.g.short > b.all * 0.2 && b.g.long > b.all * 0.3, `short AND long gaps (${b.g.short} short, ${b.g.long} long)`);
    assert.ok(b.g.mixed > b.g.lanes * 0.8, `uneven gaps on a lane (${b.g.mixed} of ${b.g.lanes} lanes)`);
    assert.ok(b.g.own > b.g.lanes * 0.6, `logs of different lengths on a lane (${b.g.own} of ${b.g.lanes})`);
  }
});

for (const mode of T.MODE_IDS) {
  test(`${SEEDS} seeds, ${mode.toUpperCase()}: the GREEDY bot crosses the opening on every course (no impossible lane: the wall never catches it there), the RANDOM bot never breaks the rules`, () => {
    const TICKS = 900;
    let wall = 0, reached = 0, sum = 0;
    const dead = [];
    for (let s = 0; s < SEEDS; s++) {
      const seed = seedOf(mode, s), course = createCourse(seed), run = createRun({ seed, mode });
      playBot(run, course, greedyBot({ seed }), TICKS);
      const r = resultOf(run);
      sum += r.lanes;
      if (r.lanes >= 25) reached++;
      if (run.hits && r.cause === 'wall') { wall++; dead.push(`${seed} at lane ${run.y}`); }
      assert.ok(run.t <= TICKS && !r.taken, 'nobody is taken in the first 15 s');
      assert.ok(run.hits <= 1 && (run.hits === 1) === (run.st === 'out'), 'ONE LIFE: a hit = out, never a second one');
      // the random bot: any hops at all leave a legal run (lanes ≥ 0, a cause from the list, one hit at most)
      if (s % 4 === 0) {
        const c2 = createCourse(seed), r2 = createRun({ seed, mode });
        playBot(r2, c2, randomBot({ seed }), 1500);
        const q = resultOf(r2);
        assert.ok(q.lanes >= 0 && q.hits <= 1 && (q.cause === '' || T.CAUSES.includes(q.cause)), `${seed}: the random bot's run is legal (${q.cause})`);
        assert.ok(r2.best >= r2.y - 1 || r2.st !== 'idle', 'the best lane is the farthest landed on');
      }
    }
    assert.ok(wall <= SEEDS * 0.01, `the wall caught the greedy bot on ${wall} of ${SEEDS} courses in the opening (a stuck bot, never a wall of lanes): ${dead.slice(0, 5).join(' · ')}`);
    assert.ok(reached >= SEEDS * 0.9, `${reached} of ${SEEDS} past lane 25 in 15 s — the opening is calm`);
    assert.ok(sum / SEEDS > 35, `the bot's average: ${(sum / SEEDS).toFixed(1)} lanes in 15 s`);
  });
}
