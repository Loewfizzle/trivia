// JAYWALK H1 — THE WHOLE-RUN SIMULATIONS (docs/jaywalk.md "FAIR BY CONSTRUCTION"): a greedy bot + a random bot over 2,000 seeds PER MODE
// through the real engine, and every lane's own numbers checked — every lane has a crossable window (no impossible lane), the opening is
// calm, the difficulty rises, THE BLACKBIRD's tell ≥ 1.5 s every time, THE UFO + THE BLACKBIRD never share a stretch. (The deep runs, the
// caps + the card moments: tests/jaywalk-deep.test.mjs. H4 — ONE LIFE in every mode: the first hit ends the run.)
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../js/games/jaywalk/tuning.js';
import { readFileSync } from 'node:fs';
import { buildLane, specials, createCourse, pulseAt, typeAt, area, gateName } from '../js/games/jaywalk/course.js';
import { createRun, resultOf, step, isOver } from '../js/games/jaywalk/engine.js';
import { replay } from '../js/games/jaywalk/replay.js';
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

test('THE DIFFICULTY RISES with the lane index — the SAME curve on every course, UNDER the areas\' leans (H5A): faster cars, shorter + faster logs everywhere; less grass + more trains like for like (the same area one loop later)', () => {
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
  // the speeds, the logs: the heat's alone — whatever area the lanes are in
  for (const [x, y, name] of [[a, b, 'lane 30 → 205'], [b, c, '205 → 370'], [c, d, '370 → 560 (the loop)']]) {
    assert.ok(y.carV > x.carV, `${name}: faster cars`);
    assert.ok(y.logV > x.logV && y.logLen < x.logLen, `${name}: faster, shorter logs`);
  }
  // the mix, like for like: the SAME area one loop later (lane + 400) — less grass, more trains: the curve under the lean
  for (const lo of [60, 110, 160, 210, 260, 310, 360]) {
    const x = band(lo, lo + 30), y = band(lo + T.LOOP_LANES, lo + T.LOOP_LANES + 30);
    assert.ok(y.grass < x.grass, `lane ${lo} → ${lo + 400}: less grass (${x.grass.toFixed(2)} → ${y.grass.toFixed(2)})`);
    assert.ok(y.rail > x.rail, `lane ${lo} → ${lo + 400}: more trains (${x.rail.toFixed(2)} → ${y.rail.toFixed(2)})`);
    assert.ok(y.carV > x.carV && y.logV > x.logV, `lane ${lo} → ${lo + 400}: faster`);
  }
  assert.ok(a.logLen > 3 * T.FP && d.logLen <= 2.4 * T.FP, `the logs: long at first (mostly 3–4 cells: ${(a.logLen / T.FP).toFixed(2)}), short deep in the loop (mostly 1–2: ${(d.logLen / T.FP).toFixed(2)})`);
  // the same curve on every course: two seeds' heat is the lane's alone
  for (const i of [0, 77, 400, 999]) assert.equal(buildLane('x', i).heat, buildLane('y', i).heat);
});

// ---- H5A — THE AREAS (docs/jaywalk.md "THE AREAS"): the table, each area's lean, the gateway lanes, FAIRNESS in all 8 + the loop
test('H5A — THE AREA TABLE: a new area every 50 lanes in the fixed order, then the loop again (named: LAP 2); lanes 0–49 = the plain opening; every gateway lane is calm, plain ground', () => {
  assert.deepEqual(T.AREAS.map(a => a.name), T.LANDMARKS, 'the areas ARE the landmarks, in their order');
  assert.deepEqual(T.LANDMARKS, ['THE DOCKS', 'THE FISH MARKET', 'THE RAIL YARD', 'THE BRIDGE', 'DOWNTOWN', 'THE CANAL', 'THE LIGHTHOUSE', 'THE AIRFIELD']);
  assert.deepEqual([0, 49].map(area), [{ name: '', index: -1, loop: 0 }, { name: '', index: -1, loop: 0 }], 'the opening: no area');
  assert.deepEqual([50, 99, 100, 150, 200, 250, 300, 350, 400, 449].map(l => area(l).name), ['THE DOCKS', 'THE DOCKS', 'THE FISH MARKET', 'THE RAIL YARD', 'THE BRIDGE', 'DOWNTOWN', 'THE CANAL', 'THE LIGHTHOUSE', 'THE AIRFIELD', 'THE AIRFIELD']);
  assert.deepEqual(area(450), { name: 'THE DOCKS', index: 0, loop: 1 }); assert.deepEqual(area(849), { name: 'THE AIRFIELD', index: 7, loop: 1 }); assert.deepEqual(area(850), { name: 'THE DOCKS', index: 0, loop: 2 });
  assert.deepEqual([50, 400, 450, 500, 850, 49, 0].map(gateName), ['THE DOCKS', 'THE AIRFIELD', 'THE DOCKS · LAP 2', 'THE FISH MARKET · LAP 2', 'THE DOCKS · LAP 3', '', ''], 'the loop\'s laps are named');
  for (let l = 0; l < 900; l++) { assert.equal(T.areaIndex(l), area(l).index); if (l % T.STRETCH === 0 && l) assert.equal(T.landmarkAt(l), area(l).name, 'a landmark\'s lane = the gateway into its area'); }
  for (const A of T.AREAS) { assert.equal(A.mix.length, 4); for (const m of A.mix) assert.ok(Number.isInteger(m) && m >= 20 && m <= 500, `${A.name}: a lean of ${m} %`); }
  assert.deepEqual(T.NO_LEAN.mix, [100, 100, 100, 100]);
  // THE GATEWAY LANES: plain calm ground on every course — no obstacle, never water / a road / a rail under the arch
  for (let s = 0; s < 300; s++) for (let g = 50; g <= 850; g += 50) { const L = buildLane(`g${s}`, g); assert.ok(L.type === 'grass' && L.mark === area(g).name && !L.obs.some(Boolean), `g${s} lane ${g}: the gateway`); }
  // … and the opening is untouched by any lean: lanes 0–49 read MIX alone (the calm start every course has)
  assert.match(readFileSync(new URL('../js/games/jaywalk/course.js', import.meta.url), 'utf8'), /const leanOf = i => \{ const k = areaIndex\(i\); return k < 0 \? NO_LEAN : AREAS\[k\]; \};/);
});

test('H5A — EACH AREA LEANS ITS MIX: the rail yard = more trains, the canal = more water, downtown = roads + heavier traffic, the bridge = water with roads, the airfield = its flight paths for sure — in the loop too', () => {
  const share = st => {
    const o = { grass: 0, road: 0, water: 0, rail: 0, flight: 0, cars: 0, n: 0 };
    for (let s = 0; s < 200; s++) for (let i = st * 50 + 1; i < st * 50 + 50; i++) { const L = buildLane(`q${s}`, i); o[L.type]++; o.n++; if (L.type === 'road') o.cars += L.items.length; }
    return { grass: o.grass / o.n, road: o.road / o.n, water: o.water / o.n, rail: o.rail / o.n, flight: o.flight / o.n, cars: o.cars / (o.road * 200 || 1) * 200 };
  };
  for (const lap of [0, 1]) {
    const S = Array.from({ length: 8 }, (_, k) => share(1 + k + lap * 8)), others = (k, f) => S.filter((_, j) => j !== k).map(f);
    const [docks, fish, yard, bridge, down, canal, light, air] = S, tag = `lap ${lap + 1}`;
    assert.ok(yard.rail > 2 * Math.max(...others(2, x => x.rail)), `${tag} THE RAIL YARD: far more trains (${yard.rail.toFixed(2)} vs ≤ ${Math.max(...others(2, x => x.rail)).toFixed(2)})`);
    assert.ok(canal.water > Math.max(...others(5, x => x.water)), `${tag} THE CANAL: the most water (${canal.water.toFixed(2)})`);
    assert.ok(down.road > Math.max(...others(4, x => x.road)) && down.road > 0.6, `${tag} DOWNTOWN: the most roads (${down.road.toFixed(2)})`);
    assert.ok(down.cars > Math.max(...others(4, x => x.cars)) + 0.7, `${tag} … and HEAVIER TRAFFIC: ${down.cars.toFixed(2)} cars a lap (the others ≤ ${Math.max(...others(4, x => x.cars)).toFixed(2)})`);
    assert.ok(bridge.water + bridge.road > 0.78 && bridge.water > 0.28, `${tag} THE BRIDGE: water with roads (${bridge.water.toFixed(2)} + ${bridge.road.toFixed(2)})`);
    for (const [x, name] of [[docks, 'THE DOCKS'], [fish, 'THE FISH MARKET'], [light, 'THE LIGHTHOUSE']]) assert.ok(x.water + x.grass > 0.5 && x.water > 0.15, `${tag} ${name}: water + its own ground (${x.water.toFixed(2)} + ${x.grass.toFixed(2)})`);
    assert.ok(air.flight > 3 * Math.max(...others(7, x => x.flight)) && air.road > 0.45, `${tag} THE AIRFIELD: its flight paths (${air.flight.toFixed(3)} of its lanes) + tarmac`);
  }
  // THE AIRFIELD's flight paths: two bands for sure, apart, inside the stretch, never a UFO; every other stretch as before (one band at most)
  for (let s = 0; s < SEEDS; s++) for (const st of [8, 16]) {
    const sp = specials(`af${s}`, st);
    assert.ok(sp.bb && sp.bb2 && !sp.ufo, 'two flight paths, no UFO');
    assert.ok(Math.abs(sp.bb.y0 - sp.bb2.y0) >= 16, 'the two bands stand apart');
    for (const q of [sp.bb, sp.bb2]) { assert.ok(q.y0 >= st * 50 + 8 && q.y0 + q.n < (st + 1) * 50, 'inside the stretch, clear of both gateways'); assert.ok(q.pulse.tell >= T.MIN_TELL_TICKS && q.pulse.period - q.pulse.pass - q.pulse.tell >= 40, 'its tell ≥ 1.5 s, quiet time in its lap'); assert.equal(q.pulse.band, q.y0); }
    for (const l of [sp.bb.y0, sp.bb.y0 + 1, sp.bb2.y0, sp.bb2.y0 + 1]) assert.equal(buildLane(`af${s}`, l).type, 'flight');
    assert.deepEqual(buildLane(`af${s}`, sp.bb2.y0).pulse, buildLane(`af${s}`, sp.bb2.y0 + 1).pulse, 'a band\'s lanes share ONE pulse'); assert.deepEqual(buildLane(`af${s}`, sp.bb.y0).pulse, sp.bb.pulse);
    for (const o of [1, 3, 9]) assert.equal(specials(`af${s}`, o).bb2, null, 'only the airfield has a second band');
  }
});

test(`H5A — FAIR IN EVERY AREA: ${SEEDS} seeds — every lane of all 8 areas + the loop has a crossable window; never more than 3 water / 3 rail lanes in a row; the same lane whatever the order it is built in`, () => {
  const bad = [];
  let lanes = 0;
  for (let s = 0; s < SEEDS; s++) {
    const seed = `ar${s}`;
    for (let st = 1; st <= 16; st++) for (let k = 0; k < 6; k++) {
      const i = st * 50 + (s * 7 + k * 11 + st) % 50, L = buildLane(seed, i); lanes++;
      const why = laneProblem(seed, L);
      if (why) bad.push(`${seed} lane ${i} (${area(i).name}, ${L.type}): ${why}`);
    }
    if (s % 10 === 0) for (let st = 1; st <= 16; st++) {
      let w = 0, r = 0;
      for (let i = st * 50; i < st * 50 + 54; i++) {
        const t = typeAt(seed, i);
        w = t === 'water' ? w + 1 : 0; r = t === 'rail' ? r + 1 : 0;
        if (w > T.WATER_RUN_MAX) bad.push(`${seed} lane ${i}: ${w} water lanes in a row`);
        if (r > T.RAIL_RUN_MAX) bad.push(`${seed} lane ${i}: ${r} rail lanes in a row`);
      }
    }
  }
  assert.ok(lanes >= SEEDS * 96, `${lanes} lanes checked`);
  assert.deepEqual(bad.slice(0, 8), [], 'every lane, every area, every seed');
  // DETERMINISM: a lane is f(seed, index) — built alone, backwards or from a course's cache it is the same lane, in every area
  for (let s = 0; s < 40; s++) {
    const seed = `det${s}`, c1 = createCourse(seed), c2 = createCourse(seed);
    for (let i = 849; i >= 0; i -= 7) c2.lane(i);
    for (let i = 3; i < 850; i += 7) { const a = JSON.stringify(c1.lane(i)); assert.equal(a, JSON.stringify(c2.lane(i))); assert.equal(a, JSON.stringify(buildLane(seed, i))); }
  }
});

for (const mode of T.MODE_IDS) {
  test(`H5A — ${SEEDS} seeds, ${mode.toUpperCase()}: the GREEDY bot dropped at EVERY area's gateway (all 8 + the loop's second lap) plays on — the wall never traps it (no wall of lanes anywhere), every end has its cause`, () => {
    const wall = Array(17).fill(0), adv = Array(17).fill(0), n = Array(17).fill(0);
    for (let s = 0; s < SEEDS; s++) {
      const st = 1 + s % 16, at = st * 50, seed = `ab-${mode}-${s}`, course = createCourse(seed), run = createRun({ seed, mode });
      run.y = at; run.best = at; run.wall = (at - 8) * T.FP;
      playBot(run, course, greedyBot({ seed }), 900);
      n[st]++; adv[st] += run.best - at;
      if (run.hits) { assert.ok(T.CAUSES.includes(run.cause), `a named cause (${run.cause})`); if (run.cause === 'wall') wall[st]++; }
      assert.ok(run.hits <= 1 && (run.hits === 1) === (run.st === 'out'), 'ONE LIFE');
    }
    const walls = wall.reduce((a, b) => a + b, 0);
    assert.ok(walls <= SEEDS * 0.015, `the wall caught the bot ${walls} times in ${SEEDS} drops (a stuck bot, never a wall of lanes)`);
    for (let st = 1; st <= 16; st++) {
      assert.ok(wall[st] <= n[st] * 0.06, `${area(st * 50).name} lap ${area(st * 50).loop + 1}: the wall ${wall[st]} of ${n[st]}`);
      assert.ok(adv[st] / n[st] >= 8, `${area(st * 50).name} lap ${area(st * 50).loop + 1}: the bot gets on — + ${(adv[st] / n[st]).toFixed(1)} lanes in 15 s`);
    }
  });
}

test('H5A — THE REPLAY + THE SERVER read the same course: runs through 3 + areas replay to the phone\'s own result, hop for hop', () => {
  let deep = 0;
  for (let s = 0; s < 60 && deep < 6; s++) {
    const seed = `rp${s}`, course = createCourse(seed), run = createRun({ seed, mode: 'solo' });
    const log = playBot(run, course, greedyBot({ seed }), 9000);
    while (!isOver(run)) step(run, course, '');
    const live = resultOf(run);
    if (live.lanes < 200) continue;
    deep++;
    const { used, ...r } = replay({ seed, mode: 'solo', log });
    assert.deepEqual(r, live, `${seed}: the replay = the live run (lane ${live.lanes}, through ${Math.floor(live.lanes / 50)} areas)`); assert.equal(used, log.length);
  }
  assert.ok(deep >= 3, `${deep} runs past lane 200`);
  const srv = readFileSync(new URL('../api/_lib/jaywalk.js', import.meta.url), 'utf8');
  assert.match(srv, /from '\.\.\/\.\.\/js\/games\/jaywalk\/replay\.js'/, 'the server\'s judge is the game\'s own replay — the same course.js');
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
