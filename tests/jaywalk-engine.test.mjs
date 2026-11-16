// JAYWALK H1 — THE PURE ENGINE (js/games/jaywalk/ — docs/jaywalk.md): determinism (the same seed + log → the same result, through JSON too,
// lanes built in any order), the rules' math is cross-engine safe, the hop's basics, the log's packed form. (The whole-run simulations:
// tests/jaywalk-sim.test.mjs + jaywalk-deep.test.mjs; the server half: tests/jaywalk-server.test.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from '../js/games/jaywalk/tuning.js';
import { buildLane, createCourse, typeAt, pulseAt, moverLeft } from '../js/games/jaywalk/course.js';
import { createRun, step, resultOf, kidAt } from '../js/games/jaywalk/engine.js';
import { replay, packLog, unpackLog } from '../js/games/jaywalk/replay.js';
import { greedyBot, randomBot, playBot } from '../js/games/jaywalk/bot.js';

const RULES = ['tuning.js', 'course.js', 'engine.js', 'replay.js'];
const src = f => readFileSync(new URL(`../js/games/jaywalk/${f}`, import.meta.url), 'utf8');
const code = f => src(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

test('THE RULES ARE PURE + CROSS-ENGINE SAFE: no Math.random / Date.now / performance.now / a frame clock, no sin / cos / pow / exp / sqrt, no DOM, no three.js', () => {
  for (const f of RULES) {
    const s = code(f);
    for (const bad of [/Math\.random/, /Date\.now/, /performance\./, /requestAnimationFrame/, /new Date/, /Math\.(sin|cos|tan|pow|exp|sqrt|log|atan2?|hypot|cbrt|round)\b/, /\*\*/, /\bdocument\b/, /\bwindow\b/, /from 'three'/]) assert.doesNotMatch(s, bad, `${f}: ${bad}`);
    for (const m of s.matchAll(/^import .* from '([^']+)'/gm)) assert.match(m[1], /^\.\/(tuning|course|engine|replay)\.js$|^\.\.\/\.\.\/core\/rng\.js$/, `${f} imports only the rules + core/rng.js (${m[1]})`);
  }
  assert.match(src('course.js'), /rngFrom\(hashString\(`\$\{seed\}:\$\{i\}`\)\)/, 'ALL randomness: core/rng.js seeded per lane');
});

test('THE FIXED STEP + THE HOP: 60 ticks a second; a hop = 8 ticks (133 ms — inside the snappy 120–150 ms)', () => {
  assert.equal(T.TICK_HZ, 60);
  const ms = T.HOP_TICKS * 1000 / T.TICK_HZ;
  assert.ok(ms >= 120 && ms <= 150, `a hop takes ${ms} ms`);
  const run = createRun({ seed: 'a', mode: 'solo' }), course = createCourse('a');
  const ev = [];
  step(run, course, 'u', ev);
  assert.equal(run.st, 'hop'); assert.deepEqual(ev.map(e => e.e), ['hop']);
  for (let i = 1; i < T.HOP_TICKS; i++) { assert.equal(run.st, 'hop', `tick ${i}: still in flight`); step(run, course, '', ev); }
  assert.equal(run.st, 'idle'); assert.equal(run.y, 1); assert.equal(run.best, 1); assert.equal(run.bestT, T.HOP_TICKS);
  assert.deepEqual(ev.map(e => e.e), ['hop', 'land', 'best']);
  assert.ok(kidAt(run).y === 1.5 && kidAt(run).x === 4.5, 'the kid stands at the centre of its cell');
});

test('ONE BUFFERED HOP while a hop is in flight (a second one in the same flight is dropped); back at lane 0, the edges + an obstacle are a bump', () => {
  const course = createCourse('a');
  let run = createRun({ seed: 'a' });
  step(run, course, 'u'); step(run, course, ''); step(run, course, 'u'); step(run, course, ''); step(run, course, 'r');   // (u, buffered u, the r is dropped)
  for (let i = 0; i < 2 * T.HOP_TICKS; i++) step(run, course, '');
  assert.equal(run.y, 2); assert.equal(run.x, 4500, 'the buffered hop ran; the third never did');
  run = createRun({ seed: 'a' });
  const ev = [];
  step(run, course, 'd', ev);
  assert.equal(run.st, 'idle'); assert.equal(ev[0].e, 'bump', 'no lane behind lane 0');
  for (let n = 0; n < 6; n++) { step(run, course, 'r'); for (let i = 0; i < T.HOP_TICKS; i++) step(run, course, ''); }
  assert.equal(run.x, 8500, 'the right edge: column 8, never past it');
  // an obstacle: find a grass lane with one, stand beside / under it
  let L = null;
  for (let i = T.CALM_LANES; i < 400 && !L; i++) { const l = course.lane(i); if (l.type === 'grass' && l.obs.some(Boolean) && course.lane(i - 1).type === 'grass') L = l; }
  assert.ok(L, 'a grass lane with an obstacle');
  const col = L.obs.indexOf(1);
  run = createRun({ seed: 'a' }); run.y = L.i - 1; run.best = L.i - 1; run.x = col * T.FP + 500;
  if (course.lane(L.i - 1).obs[col]) run.x = T.MID_COL * T.FP + 500;
  else { const e2 = []; step(run, course, 'u', e2); assert.equal(e2[0].e, 'bump', 'an obstacle ahead: the hop is refused'); assert.equal(run.st, 'idle'); }
});

test('DETERMINISM: the same seed + log → the same result twice; the log through JSON → identical; a live run = its replay', () => {
  for (const mode of T.MODE_IDS) for (let s = 0; s < 25; s++) {
    const seed = `det${s}`, course = createCourse(seed), run = createRun({ seed, mode });
    const log = playBot(run, course, s % 2 ? greedyBot({ seed }) : randomBot({ seed }), 4000);
    const live = resultOf(run);
    const a = replay({ seed, mode, log, until: run.t }), b = replay({ seed, mode, log: JSON.parse(JSON.stringify(log)), until: run.t });
    const { used, ...ra } = a, { used: u2, ...rb } = b; void used; void u2;
    assert.deepEqual(ra, live, `${mode} ${seed}: the replay = the live run`);
    assert.deepEqual(rb, live, `${mode} ${seed}: through JSON`);
    assert.deepEqual(replay({ seed, mode, log }), replay({ seed, mode, log }), 'twice');
    assert.deepEqual(unpackLog(packLog(log)), log, 'the packed log unpacks to the same hops');
  }
});

test('LANES BUILT OUT OF ORDER = THE SAME LANES (each a pure function of the seed + its index); another seed = another course', () => {
  const seed = 'order', a = [], b = [];
  for (let i = 0; i < 520; i++) a[i] = JSON.stringify(buildLane(seed, i));
  for (let i = 519; i >= 0; i -= 7) b[i] = JSON.stringify(buildLane(seed, i));
  for (let i = 519; i >= 0; i -= 7) assert.equal(b[i], a[i], `lane ${i}`);
  const c = createCourse(seed, { keep: 40 });
  for (const i of [300, 2, 517, 44, 300, 2, 199, 450]) assert.equal(JSON.stringify(c.lane(i)), a[i], `the course's lane ${i} (asked in any order, its cache turned over)`);
  let diff = 0;
  for (let i = 4; i < 200; i++) if (JSON.stringify(buildLane('other', i)) !== a[i]) diff++;
  assert.ok(diff > 150, 'a new seed = a new course');
  assert.equal(typeAt(seed, 250), 'grass'); assert.equal(buildLane(seed, 250).mark, 'DOWNTOWN');
});

test('A HAZARD\'s POSITION = a pure function of (lane, tick): a car / a log moves v a tick; a train / THE BLACKBIRD laps idle → tell → pass', () => {
  const course = createCourse('pos');
  let road = null, rail = null;
  for (let i = 4; i < 300; i++) { const l = course.lane(i); if (!road && l.type === 'road') road = l; if (!rail && l.type === 'rail') rail = l; }
  const it = road.items[0];
  for (const t of [0, 1, 500, 99999]) {
    const d = moverLeft(road, it, t + 1) - moverLeft(road, it, t);
    assert.ok(d === road.dir * road.v || Math.abs(d) > T.WIDTH, `tick ${t}: one step (or the lap's wrap, off the screen)`);
  }
  assert.equal(moverLeft(road, it, 123456), moverLeft(road, it, 123456 + 0), 'no state: asked again = the same');
  const p = rail.pulse, seen = [];
  for (let t = p.phase; t < p.phase + p.period; t++) { const s = pulseAt(p, t).st; if (seen[seen.length - 1] !== s) seen.push(s); }
  assert.deepEqual(seen, ['pass', 'idle', 'tell'], 'one lap: the pass, the quiet, the signal lights');
  assert.equal(pulseAt(p, p.phase + p.period - p.tell).left, p.tell, 'the tell begins `tell` ticks before the pass');
});

test('THE MODES in one table: ONE LIFE everywhere (H4) · solo no speed-up, no end · match faster from 4 min, THE MOTHERSHIP at 6 · daily from 3, at 5', () => {
  const { solo, match, daily } = T.MODES;
  assert.deepEqual([solo.cap, solo.wall.rampAt], [0, 0]);
  assert.deepEqual([match.cap, match.wall.rampAt], [6 * 60 * 60, 4 * 60 * 60]);
  assert.deepEqual([daily.cap, daily.wall.rampAt], [5 * 60 * 60, 3 * 60 * 60]);
  for (const m of T.MODE_IDS) assert.deepEqual(Object.keys(T.MODES[m]).sort(), ['cap', 'wall'], `${m}: the wall + the cap — no lives, no lives option, no one-up`);
  assert.equal(T.wallPace('solo', 10), 0, 'the wall waits out the calm opening');
  assert.equal(T.wallPace('solo', 999999), solo.wall.base, 'solo: a steady pace for ever');
  assert.equal(T.wallPace('match', match.wall.rampAt), match.wall.base);
  assert.ok(T.wallPace('match', match.wall.rampAt + 3600) > match.wall.base && T.wallPace('match', match.cap) === match.wall.max, 'the match speeds up to its max by the end');
  assert.deepEqual(T.LANDMARKS, ['THE DOCKS', 'THE FISH MARKET', 'THE RAIL YARD', 'THE BRIDGE', 'DOWNTOWN', 'THE CANAL', 'THE LIGHTHOUSE', 'THE AIRFIELD']);
  assert.deepEqual([50, 100, 400, 450, 49, 0].map(T.landmarkAt), ['THE DOCKS', 'THE FISH MARKET', 'THE AIRFIELD', 'THE DOCKS', null, null]);
});

test('ONE LIFE EVERYWHERE (H4 — the owner, Nov 16): the lives option, respawn + blink, THE ONE-UP are GONE from the rules — code, tuning, lanes, runs, events', () => {
  for (const f of RULES) for (const bad of [/\blives\b/i, /\bblink\b/i, /oneUp|ONE_UP|one-up/i, /respawn/i, /safeLane/, /'down'/, /\.down\b/]) assert.doesNotMatch(code(f), bad, `${f}: ${bad}`);
  for (const k of ['DOWN_TICKS', 'BLINK_TICKS', 'MAX_LIVES', 'ONE_UP', 'ONE_UP_FROM', 'ONE_UP_CHANCE']) assert.equal(T[k], undefined, `tuning.js#${k} is gone`);
  assert.equal(T.WALL.respawnGap, undefined);
  for (const mode of T.MODE_IDS) {
    const run = createRun({ seed: 'x', mode, lives: 3, oneUp: true });
    for (const k of ['lives', 'blink', 'down', 'oneUp', 'ups']) assert.ok(!(k in run), `${mode}: a run has no ${k}`);
  }
  for (let i = 0; i < 300; i++) assert.ok(!('oneUp' in buildLane('gone', i)), `lane ${i}: no one-up on any lane`);
  assert.ok(!('lives' in resultOf(createRun({ seed: 'x' }))), 'a result has no lives');
  assert.doesNotMatch(code('../../../js/games/jaywalk/meta.js'), /\blives\b|LIVES|AGAIN_LABEL/, 'the meta: no lives option, no HOP AGAIN label');
});

test('ONE HIT = OUT in every mode: a kid who stops is caught by the wall — the run ends there (no second life, nothing after it); the events never say hit / respawn / oneup', () => {
  for (const mode of T.MODE_IDS) {
    const seed = `wall-${mode}`, course = createCourse(seed), run = createRun({ seed, mode });
    playBot(run, course, greedyBot({ seed }), 900);
    assert.ok(run.best > 20 && run.st !== 'out', `${mode}: the bot is on its way (lane ${run.best})`);
    assert.ok(run.wall >= (run.best - T.WALL.behind) * T.FP, 'the wall keeps up with the best lane (no banking distance)');
    const ev = [], t0 = run.t;
    for (let i = 0; i < 2000 && run.st !== 'out'; i++) step(run, course, '', ev);
    assert.equal(run.st, 'out', `${mode}: standing still → out`);
    assert.ok(run.t - t0 < 20 * T.TICK_HZ, `caught within 20 s (${((run.t - t0) / T.TICK_HZ).toFixed(1)} s)`);
    assert.equal(run.hits, 1); assert.equal(run.end, run.t);
    const outs = ev.filter(e => e.e === 'out');
    assert.equal(outs.length, 1); assert.ok(T.CAUSES.includes(outs[0].cause), `a named cause (${outs[0].cause})`);
    assert.ok(!ev.some(e => ['hit', 'respawn', 'oneup'].includes(e.e)), 'no hit / respawn / oneup events');
    const snap = JSON.stringify(run);
    for (let i = 0; i < 300; i++) step(run, course, i % 9 ? '' : 'u');
    assert.equal(JSON.stringify(run), snap, 'out is final: nothing moves after it');
  }
});
