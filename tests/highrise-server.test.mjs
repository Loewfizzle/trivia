// HIGH RISE S1 — THE JUDGE, THE SERVER HALF (api/_lib/highrise.js — PURE, NOT an endpoint, NOT wired into /api/report yet): it imports the
// SAME js/games/highrise modules the phone runs. It accepts honest bot logs, refuses every forged one, and its result == the live engine's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { judgeRun, judgePacked, serverRow } from '../api/_lib/highrise.js';
import { createRun, stepTo, tap, isOver, resultOf, slideOff } from '../js/games/highrise/engine.js';
import { packTaps, tapsProblem, seedProblem, maxTaps, replay } from '../js/games/highrise/replay.js';
import { BOTS, BOT_IDS, gaussBot, playBot } from '../js/games/highrise/bot.js';
import { MODES, MODE_IDS, BEAT, PERFECT, FUSE_SWEEPS, FLOOR_TICKS_MAX, MAX_TAPS, SEED_MAX } from '../js/games/highrise/tuning.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const abs = n => (n < 0 ? -n : n);
/** a bot's whole run → { taps, live: the LIVE engine's result } */
function botRun(seed, mode, sigma, maxFloor = 400) {
  const run = createRun({ seed, mode }), taps = playBot(run, gaussBot({ sigmaMs: sigma, seed }), { maxFloor });
  if (!isOver(run)) stepTo(run, run.t + BEAT + FLOOR_TICKS_MAX);   // (a stopped endless run: the fuse ends it — as the judge will see it)
  return { taps, live: resultOf(run) };
}
/** a perfect player's taps for `n` floors (dead on, first pass) */
function perfectTaps(seed, mode, n) {
  const run = createRun({ seed, mode }), taps = [];
  for (let i = 0; i < n && !isOver(run); i++) {
    stepTo(run, run.s0);
    let t = run.s0; while (abs(slideOff(run.S, run.e, t - run.s0)) > PERFECT) t++;
    tap(run, t); taps.push(t);
  }
  return taps;
}

test('THE SERVER HALF is PURE and NOT WIRED: no fb.js, no endpoint, the SAME engine modules as the phone; /api still has 8 functions', () => {
  const src = read('api/_lib/highrise.js');
  const imports = [...src.matchAll(/^import [^\n]* from '([^']+)';$/gm)].map(m => m[1]);
  assert.deepEqual(imports, ['../../js/games/highrise/replay.js', '../../js/games/highrise/logic.js'], 'it imports the phone\'s own modules — nothing else');
  assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1'), /fb\.js|firebase|export default|\breq\b|\bres\./);
  const fns = readdirSync(new URL('../api/', import.meta.url)).filter(f => f.endsWith('.js'));
  assert.equal(fns.length, 8, `the function count stays 8 (${fns.join(' ')})`);
  for (const f of fns) assert.doesNotMatch(read(`api/${f}`), /highrise/, `api/${f} does not know HIGH RISE yet`);
  for (const f of readdirSync(new URL('../api/_lib/', import.meta.url))) if (f !== 'highrise.js' && f.endsWith('.js')) assert.doesNotMatch(read(`api/_lib/${f}`), /highrise/, `api/_lib/${f}: not wired`);
});

test('THE JUDGE accepts honest bot logs — all four bots, every mode — and returns the run\'s own numbers', () => {
  let made = 0, outs = 0;
  for (const mode of MODE_IDS) for (const id of BOT_IDS) for (let i = 0; i < 6; i++) {
    const seed = `ok-${mode}-${id}-${i}`, { taps, live } = botRun(seed, mode, BOTS[id]);
    const v = judgeRun({ seed, mode, taps });
    assert.equal(v.ok, true, `${seed}: ${v.why}`);
    assert.deepEqual([v.floor, v.tick, v.end, v.cause, v.perfects, v.maxStreak, v.taps], [live.floor, live.tick, live.end, live.cause, live.perfects, live.maxStreak, taps.length]);
    assert.deepEqual(v.feats, { reachedClouds: live.floor >= 60, reachedTop: live.floor >= 200 });
    assert.deepEqual(judgePacked({ seed, mode, log: packTaps(taps) }), v, 'the packed log judges the same');
    if (v.made) made++; else outs++;
    assert.ok(['miss', 'thin', 'slow', 'made', 'cap'].includes(v.cause));
  }
  assert.ok(made >= 6 && outs >= 30, `finishes (${made}) and outs (${outs}) both judged`);
  // an empty log is an honest run too: nobody tapped — THE FUSE
  const idle = judgeRun({ seed: 'idle', mode: 'match', taps: [] });
  assert.deepEqual([idle.ok, idle.floor, idle.cause, idle.tick], [true, 0, 'slow', 0]);
  assert.deepEqual(serverRow(idle), { f: 0, t: 0, w: 'slow', e: idle.end, p: 0, s: 0 });
  const top = judgeRun({ seed: 'top', mode: 'daily', taps: perfectTaps('top', 'daily', 200) });
  assert.deepEqual([top.ok, top.floor, top.cause, top.made], [true, 200, 'made', true]);
  assert.deepEqual(serverRow(top), { f: 200, t: top.tick, w: 'made', e: top.end, p: 200, s: 200, ft: 'reachedClouds reachedTop' });
  assert.deepEqual(serverRow({ ok: false, why: 'ticks not rising' }), { f: 0, t: 0, w: '', e: -1, p: 0, s: 0, bad: 'ticks not rising' });
});

test('THE JUDGE == THE LIVE ENGINE for 500 bot runs across all modes (floor, tick, end, cause, perfects, streak — to the tick)', () => {
  let n = 0;
  const causes = {};
  for (let i = 0; i < 500; i++) {
    const mode = MODE_IDS[i % 3], id = BOT_IDS[i % 4], seed = `eq${i}`;
    const { taps, live } = botRun(seed, mode, BOTS[id], 320);
    const v = judgeRun({ seed, mode, taps });
    assert.equal(v.ok, true, `${seed}: ${v.why}`);
    const { ok, ...mine } = v; void ok;
    const { over, ...theirs } = live;
    assert.equal(over, true);
    assert.deepEqual(mine, theirs, seed);
    causes[v.cause] = (causes[v.cause] || 0) + 1; n++;
  }
  assert.equal(n, 500);
  assert.ok(causes.miss > 20 && causes.thin > 20 && causes.made > 20, `the causes seen: ${JSON.stringify(causes)}`);
});

test('FORGED LOGS — every one refused, by name', () => {
  const seed = 'forge', mode = 'match', honest = perfectTaps(seed, mode, 40);
  assert.equal(judgeRun({ seed, mode, taps: honest }).ok, true);
  const why = (taps, m = mode, s = seed) => { const v = judgeRun({ seed: s, mode: m, taps }); assert.equal(v.ok, false, JSON.stringify(v).slice(0, 120)); assert.deepEqual(Object.keys(v), ['ok', 'why']); return v.why; };
  const swap = (i, x) => { const t = honest.slice(); t[i] = x; return t; };
  // a tick that is not a whole number ≥ 0
  for (const x of [honest[5] + 0.5, String(honest[5]), NaN, Infinity, -Infinity, null, undefined, {}, [honest[5]], true, 2 ** 53]) {
    assert.equal(why(swap(5, x)), 'entry', String(x));
  }
  assert.equal(why(swap(5, honest[5] + 0.5)), 'entry'); assert.equal(why(swap(5, String(honest[5]))), 'entry');
  assert.equal(why([-5, ...honest]), 'entry'); assert.equal(why(swap(0, -1)), 'entry');
  { const holes = honest.slice(); delete holes[7]; assert.equal(why(holes), 'entry', 'a hole in the list'); }
  // ticks not rising
  assert.equal(why(swap(6, honest[5])), 'ticks not rising'); assert.equal(why(swap(6, honest[5] - 3)), 'ticks not rising');
  assert.equal(why([...honest.slice(0, 10), honest[9], ...honest.slice(10)]), 'ticks not rising', 'a tap twice');
  // a tap in a landing beat (no slab to drop)
  assert.equal(why([...honest.slice(0, 10), honest[9] + 1]), 'in the landing beat');
  assert.equal(why([...honest.slice(0, 10), honest[9] + BEAT - 1]), 'in the landing beat');
  assert.equal(why([BEAT - 1]), 'in the landing beat', 'before the first slab');
  assert.equal(why([0]), 'in the landing beat');
  assert.equal(judgeRun({ seed, mode, taps: [BEAT] }).ok, true, 'the tick the first slab enters is a real (losing) drop');
  // a tap after the run ended: an out …
  const out = judgeRun({ seed, mode, taps: [...honest, honest[39] + BEAT] });   // (a drop the tick the slab enters: a miss)
  assert.deepEqual([out.ok, out.cause, out.floor], [true, 'miss', 40]);
  assert.equal(why([...honest, honest[39] + BEAT, honest[39] + BEAT + 60]), 'past the end');
  // … the fuse's own drop (a gap the cheap bounds let through — the replay catches it) …
  const run = createRun({ seed, mode }); for (const t of honest) tap(run, t); stepTo(run, run.s0);
  const fuse = run.s0 + FUSE_SWEEPS * run.S;
  assert.ok(fuse - honest[39] < FLOOR_TICKS_MAX);
  assert.equal(why([...honest, fuse]), 'past the end', 'a tap AT the fuse\'s tick');
  if (fuse + 2 - honest[39] < FLOOR_TICKS_MAX) assert.equal(why([...honest, fuse + 2]), 'past the end');
  assert.equal(why([...honest, honest[39] + FLOOR_TICKS_MAX]), 'after the fuse', 'a gap no honest run has');
  assert.equal(why([...honest, honest[39] + 100000]), 'past the cap'); assert.equal(why([...honest, honest[39] + 100000], 'solo'), 'after the fuse');
  assert.equal(why([FLOOR_TICKS_MAX]), 'after the fuse');
  // … the finish
  const full = perfectTaps('full', 'match', 200);
  assert.equal(judgeRun({ seed: 'full', mode: 'match', taps: full }).made, true);
  assert.equal(why([...full, full[199] + 60], 'match', 'full'), 'too many taps', 'more taps than floors');
  assert.equal(why([...full, full[199] + BEAT], 'daily', 'full'), 'too many taps');
  {  // (the same log on another seed: a tap after ITS end — or it simply plays a different run: never the same result)
    const v = judgeRun({ seed: 'other', mode: 'match', taps: full });
    assert.ok(!v.ok || v.floor < 200, 'a log copied onto another seed is not that run');
  }
  // more taps than any run holds (solo)
  assert.equal(maxTaps('solo'), MAX_TAPS); assert.equal(maxTaps('match'), 200); assert.equal(maxTaps('daily'), 200);
  assert.equal(why(Array.from({ length: MAX_TAPS + 1 }, (_, i) => (i + 1) * 60), 'solo'), 'too many taps');
  assert.equal(why(Array.from({ length: 201 }, (_, i) => (i + 1) * 60)), 'too many taps');
  // ticks past the mode's cap
  for (const m of ['match', 'daily']) {
    const cap = MODES[m].capTicks, slow = [];
    const r = createRun({ seed: 'capf', mode: m });
    while (!isOver(r)) { stepTo(r, r.s0); if (r.st !== 'slide') break; let t = r.s0 + r.S; while (abs(slideOff(r.S, r.e, t - r.s0)) > PERFECT) t++; if (!tap(r, t)) break; slow.push(t); }
    assert.equal(r.st, 'cap');
    const v = judgeRun({ seed: 'capf', mode: m, taps: slow });
    assert.deepEqual([v.ok, v.cause, v.end, v.floor], [true, 'cap', cap, slow.length]);
    const last = slow[slow.length - 1];
    assert.ok(cap - last < FLOOR_TICKS_MAX);
    assert.equal(why([...slow, cap], m, 'capf'), 'past the cap', 'a tap AT the cap');
    assert.equal(why([...slow, cap + 30], m, 'capf'), 'past the cap');
    assert.equal(tapsProblem([cap], m), 'past the cap');
  }
  assert.notEqual(tapsProblem([MODES.match.capTicks], 'solo'), 'past the cap', 'solo has no cap');
  // a malformed seed · an unknown mode · a log that is not a list
  for (const s of [undefined, null, '', 12, {}, ['a'], 'x'.repeat(SEED_MAX + 1), true]) assert.deepEqual(judgeRun({ seed: s, mode, taps: honest }), { ok: false, why: 'seed' }, String(s));
  assert.equal(seedProblem('x'.repeat(SEED_MAX)), null);
  for (const m of [null, '', 'hard', 'constructor', '__proto__', 'toString', 'Solo', 7, {}]) assert.equal(why(honest, m), 'mode', String(m));
  for (const t of [undefined, null, 'abc', '12.40', 12, { length: 2, 0: 12, 1: 40 }, new Set([12])]) assert.equal(why(t), 'taps', String(t));
  assert.equal(judgePacked({ seed, mode, log: 'c..x' }).why, 'log'); assert.equal(judgePacked({ seed, mode, log: null }).why, 'log'); assert.equal(judgePacked().why, 'log');
  // THE MODE IS REQUIRED (the review: a missing one must never be quietly judged as solo — no finish, no cap)
  assert.deepEqual(judgeRun({ seed, taps: honest }), { ok: false, why: 'mode' }); assert.deepEqual(judgeRun({ seed, mode: undefined, taps: honest }), { ok: false, why: 'mode' });
  assert.deepEqual(judgePacked({ seed, log: packTaps(honest) }), { ok: false, why: 'mode' });
  // nothing throws: every hostile input gets its { ok: false, why }
  for (const x of [undefined, null, 0, 'x', 12, true, []]) { assert.deepEqual(judgeRun(x), { ok: false, why: 'mode' }, String(x)); assert.deepEqual(judgePacked(x), { ok: false, why: 'log' }, String(x)); }
  // a seed a transport could mangle: only printable ASCII, no space
  for (const sd of ['a b', ' x', 'x\n', 'x\u0000y', 'caf\u00e9', '\ud83d\ude80', '\ud800', 'tab\tbed']) assert.deepEqual(judgeRun({ seed: sd, mode, taps: [] }), { ok: false, why: 'seed' }, JSON.stringify(sd));
  for (const sd of ['a', 'h1x2y3', 'A-Z_0.9:~!', 'x'.repeat(SEED_MAX)]) assert.equal(judgeRun({ seed: sd, mode, taps: [] }).ok, true, sd);
  // THE PACKED LOG: canonical only (packTaps(unpackTaps(s)) === s), and a string longer than any log packs to is refused before it is read
  const packed = packTaps(honest);
  assert.equal(judgePacked({ seed, mode, log: packed }).ok, true);
  for (const bad of [`0${packed}`, packed.replace('.', '.0'), packed.toUpperCase() === packed ? 'A' : packed.toUpperCase(), `${packed}.`, `${packed} `, 'c.'.repeat(4000000)]) assert.deepEqual(judgePacked({ seed, mode, log: bad }), { ok: false, why: 'log' }, bad.slice(0, 24));
  assert.equal(judgePacked({ seed, mode: 'solo', log: 'c.'.repeat(MAX_TAPS) + 'c' }).why, 'too many taps', 'a log just over the tap limit is read, then refused by name');
  // a claimed result is never read: there is no field for one
  const lie = judgeRun({ seed, mode, taps: honest.slice(0, 3), floor: 200, made: true, cause: 'made', result: { floor: 200 } });
  assert.deepEqual([lie.ok, lie.floor, lie.cause], [true, 3, 'slow']);
});

test('THE BOUNDS ARE THE ENGINE\'S OWN: every log the cheap bounds refuse, the replay refuses too — and a log the engine made always passes them', () => {
  for (let i = 0; i < 60; i++) {
    const mode = MODE_IDS[i % 3], seed = `b${i}`, { taps } = botRun(seed, mode, BOTS[BOT_IDS[i % 4]], 260);
    assert.equal(tapsProblem(taps, mode), null, `${seed}: an engine-made log passes the bounds`);
    if (taps.length < 4) continue;
    // break it four ways: each one the replay itself also refuses (bad ≥ 0)
    const k = 1 + (i % (taps.length - 2));
    for (const forged of [
      [...taps.slice(0, k), taps[k - 1] + 1, ...taps.slice(k)],            // a tap in a beat
      [...taps.slice(0, k), taps[k - 1] + FLOOR_TICKS_MAX + 7],            // after the fuse
      [...taps.slice(0, k), taps[k - 1]],                                  // not rising
    ]) {
      assert.notEqual(tapsProblem(forged, mode), null);
      const r = replay({ seed, mode, taps: forged });
      assert.ok(r.bad >= 0, 'the engine\'s own tap() refuses it too');
    }
  }
});
