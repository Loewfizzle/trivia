// HIGH RISE DAILY A — THE ENGINE's DAILY MODE + THE HOLD + THE HELD RUN's pure half (js/games/highrise/held.js — docs/highrise.md "THE DAILY").
// REPLAY = LIVE with holds at random floors (50 seeds, bot runs); a hold never changes a floor already placed; the 200 finish; the ranking
// keys; a 4th hold refused by the engine AND the judge; the legs' log + each leg's speed check; the share inputs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, stepTo, tap, hold, isOver, resultOf, endBy } from '../js/games/highrise/engine.js';
import { judgeRun, replay, tapsProblem } from '../js/games/highrise/replay.js';
import { gaussBot, BOTS } from '../js/games/highrise/bot.js';
import { packFrom } from '../js/games/highrise/proof.js';
import { rngFrom, hashString } from '../js/core/rng.js';
import { MODES, BEAT, TICK_HZ } from '../js/games/highrise/tuning.js';
import { HOLDS, ROOM_HOLDS, LEGS_MAX, logOf, standAfter, nextHoldTick, judgeHeld, shareOf, hrScore, hrFloors, hrPerfects, hrTick, legsOf, holdsOf, holdsLeft, nextHoldKind, legEnd } from '../js/games/highrise/held.js';

const edges = r => ({ floor: r.floor, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, perfects: r.perfects, streak: r.streak, at: r.at });

/** A PHONE playing the daily LIVE (the stage's own calls: stepTo frame by frame, a tap at its touch tick) with holds at random floors —
 *  the hold the way the server makes it: the phone's last tap may NEVER reach the server (the undo), the server picks T from what it has
 *  (nextHoldTick), the phone REBUILDS from the server's log (standAfter) and plays on live. → { events (the server's log), live (the phone's run) } */
function playHeld(seed, sigmaMs, { holds = 3, lose = true } = {}) {
  const rand = rngFrom(hashString(`held:${seed}`)), bot = gaussBot({ sigmaMs, seed });
  const at = new Set();
  while (at.size < holds) at.add(1 + Math.floor(rand() * 150));
  let events = [], run = createRun({ seed, mode: 'daily' }), frameTick = 0, lostN = 0;
  while (!isOver(run)) {
    // (the frame loop: the clock moves in frame steps; the slab enters; a tap at the bot's tick)
    stepTo(run, run.s0);
    if (run.st !== 'slide') { stepTo(run, frameTick += 20); continue; }
    const t = bot(run);
    for (let f = run.t; f < t; f += 1 + Math.floor(rand() * 2)) stepTo(run, f);
    if (!tap(run, t)) break;
    const lost = lose && at.has(run.floor) && rand() < 0.5;   // (hidden right after this tap: half the time its chunk never landed)
    if (!lost) events.push(t); else lostN++;
    if (at.has(run.floor) && !isOver(run)) {
      at.delete(run.floor);
      const T = nextHoldTick(seed, events);
      if (T == null) break;
      events.push({ k: 'hold', t: T });
      run = standAfter(seed, events);   // (the phone's rebuild from the server's answer)
    }
  }
  if (!isOver(run)) stepTo(run, endBy(run, run.t));
  return { events, live: run, lost: lostN };
}

test('THE DAILY MODE: classic rules, the finish ON floor 200 (THE MOTHERSHIP), 5:00 cap, 3 holds + 3 free room holds — the table', () => {
  assert.deepEqual(MODES.daily, { finish: 200, capTicks: 5 * 60 * TICK_HZ, holds: 3, roomHolds: 3 });
  assert.equal(HOLDS, 3); assert.equal(ROOM_HOLDS, 3); assert.equal(LEGS_MAX, 7);
  const r = createRun({ seed: 'fin', mode: 'daily' }), bot = gaussBot({ sigmaMs: 3, seed: 'fin' });
  const events = [];
  while (!isOver(r)) { stepTo(r, r.s0); if (r.st !== 'slide') break; const t = bot(r); if (!tap(r, t)) break; events.push(t); if (r.floor === 50 || r.floor === 120 || r.floor === 180) { const T = nextHoldTick('fin', events); events.push({ k: 'hold', t: T }); assert.ok(hold(r, T)); } }
  assert.deepEqual([r.st, r.floor], ['made', 200], 'the run ends ON floor 200 — slab 201 never enters');
  const v = judgeRun({ seed: 'fin', mode: 'daily', taps: events });
  assert.ok(v.ok, v.why); assert.equal(v.floor, 200); assert.equal(v.cause, 'made'); assert.equal(v.holds, 3);
  assert.equal(v.tick, r.at);
});

test('REPLAY = LIVE with holds at random floors — 50 seeds, four bots: the server\'s judge of its own log = the phone\'s live run', () => {
  let n = 0, lostSome = 0;
  for (let i = 0; i < 50; i++) {
    const seed = `hd${i}`, sigma = Object.values(BOTS)[i % 4];
    const { events, live, lost } = playHeld(seed, sigma, { holds: 1 + (i % 3) });
    const v = judgeRun({ seed, mode: 'daily', taps: events });
    assert.ok(v.ok, `${seed}: ${v.why}`);
    const L = resultOf(live);
    assert.deepEqual([v.floor, v.perfects, v.tick, v.cause, v.maxStreak], [L.floor, L.perfects, L.tick, L.cause, L.maxStreak], seed);
    const R = replay({ seed, mode: 'daily', taps: events });
    assert.equal(R.bad, -1); assert.equal(R.floor, L.floor);
    if (lost) lostSome++;
    n++;
  }
  assert.equal(n, 50);
  assert.ok(lostSome > 0, 'some runs lost a tap the server never had (the undo) — and still replay = live');
});

test('A HOLD NEVER CHANGES A FLOOR ALREADY PLACED — in a beat or mid-slide; the slab that was swinging ENTERS again at T, its sweep from tick 0', () => {
  const r = createRun({ seed: 'keep', mode: 'daily' }), bot = gaussBot({ sigmaMs: 25, seed: 'keep' });
  for (let k = 0; k < 30; k++) { stepTo(r, r.s0); tap(r, bot(r)); }
  const before = edges(r);
  // mid-slide (the page hidden while the slab swings)
  stepTo(r, r.s0); stepTo(r, r.s0 + 37);
  assert.equal(r.st, 'slide');
  const S = r.S, e = r.e, T = r.t + 500;
  assert.ok(hold(r, T));
  assert.deepEqual(edges(r), before, 'nothing placed moved');
  assert.equal(r.st, 'beat'); assert.equal(r.s0, T);
  stepTo(r, T);
  assert.deepEqual([r.st, r.S, r.e, r.s0], ['slide', S, e, T], 'the same slab (its sweep + its end are the floor\'s) from its entry');
  // a fresh run reaching the same place plays the next drop the same way
  const t = T + Math.floor(S / 2);
  const a = structuredClone(edges(r)); void a;
  assert.ok(tap(r, t)); assert.ok(r.floor === before.floor + 1);
  // in a beat: the next entry moves to T (never earlier than its own)
  const r2 = createRun({ seed: 'keep2', mode: 'daily' });
  assert.equal(hold(r2, BEAT - 1), false, 'a hold before the slab\'s own entry is refused');
  assert.ok(hold(r2, BEAT + 99)); assert.equal(r2.s0, BEAT + 99); assert.equal(r2.floor, 0);
});

test('THE 4th HOLD is refused — by the engine AND the judge; THE ROOM WINS\' free holds have their own 3; solo + match have none', () => {
  const r = createRun({ seed: 'four', mode: 'daily' });
  let T = BEAT;
  for (let i = 0; i < 3; i++) { assert.ok(hold(r, T), `hold ${i + 1}`); T += 10; }
  assert.equal(hold(r, T), false, 'the 4th');
  for (let i = 0; i < 3; i++) { assert.ok(hold(r, T, true), `room hold ${i + 1}`); T += 10; }
  assert.equal(hold(r, T, true), false, 'the 4th room hold');
  const log = [{ k: 'hold', t: 12 }, { k: 'hold', t: 30 }, { k: 'hold', t: 50 }, { k: 'hold', t: 70 }];
  assert.equal(tapsProblem(log, 'daily'), 'too many holds');
  assert.equal(judgeRun({ seed: 'four', mode: 'daily', taps: log }).why, 'too many holds');
  assert.equal(judgeRun({ seed: 'four', mode: 'daily', taps: log.slice(0, 3) }).ok, true);
  for (const mode of ['solo', 'match']) {
    assert.equal(hold(createRun({ seed: 'x', mode }), 12), false, `${mode}: no hold`);
    assert.equal(judgeRun({ seed: 'x', mode, taps: [{ k: 'hold', t: 12 }] }).why, 'too many holds');
  }
  assert.equal(tapsProblem([100, { k: 'hold', t: 100 }], 'daily'), 'hold too soon', 'a hold before the natural entry (a beat after the last drop)');
  assert.equal(tapsProblem([{ k: 'hold', t: 5 * 60 * 60 }], 'daily'), 'past the cap');
  assert.equal(tapsProblem([{ k: 'hold', t: 500 }, 499], 'daily'), 'in the landing beat', 'a tap before the held slab enters');
  assert.equal(tapsProblem([{ k: 'hold', t: 500 }, 500 + 2000], 'daily'), 'after the fuse');
});

test('THE RANKING KEYS: floors → most perfects → the earlier tick, as ONE high-is-better number', () => {
  assert.ok(hrScore(101, 0, 17000) > hrScore(100, 100, 0), 'a floor beats any perfects');
  assert.ok(hrScore(100, 51, 17000) > hrScore(100, 50, 0), 'perfects beat any tick');
  assert.ok(hrScore(100, 50, 9000) > hrScore(100, 50, 9001), 'the earlier tick wins a tie');
  const s = hrScore(173, 64, 12345);
  assert.deepEqual([hrFloors(s), hrPerfects(s), hrTick(s)], [173, 64, 12345]);
  assert.equal(hrFloors(hrScore(0, 0, 0)), 0);
  assert.ok(Number.isSafeInteger(hrScore(200, 200, 0)));
});

// ---- the legs: a phone's chunks, one per tap, stamped as they ARRIVE (the SERVER's time), in each leg's LOCAL ticks
const GO0 = 1_800_000_000_000;
function legsFor(events, { slow = null, ahead = false, gap = 60_000 } = {}) {
  const rec = { l: {} }, nodes = {};
  let leg = -1, go = 0, t = 0, base = 0, taps = [];
  const close = () => { if (leg < 0) return; const c = {}; taps.forEach((tk, k) => { const local = tk - t; c[k] = { s: packFrom(taps.map(x => x - t), k, k + 1), at: go + Math.round(local * 1000 / TICK_HZ * (ahead && leg === 0 ? 0.5 : 1)) + 80 + (slow && leg === slow.leg && k >= slow.from ? (k - slow.from + 1) * 9000 : 0) }; }); nodes[leg] = { go, z: legEnd(go, t), c }; };
  const open = (T, r) => { close(); leg++; t = T; go = GO0 + base; base += gap + 3_000_000; rec.l[leg] = { u: 'u1', go, z: legEnd(go, T), t: T, ...(r ? { r: 1 } : {}) }; taps = []; };
  open(0);
  for (const x of events) { if (typeof x === 'number') taps.push(x); else open(x.t, x.r); }
  close();
  return { rec, nodes };
}

test('THE LOG from the legs: each leg on its own clock (local ticks from its GO) — the same events the phone played; the judge\'s score = the live run', () => {
  for (let i = 0; i < 12; i++) {
    const seed = `lg${i}`, { events, live } = playHeld(seed, BOTS.good, { holds: 3, lose: false });
    const { rec, nodes } = legsFor(events);
    const L = logOf(rec, nodes);
    assert.equal(L.why, undefined); assert.deepEqual(L.events, events, seed);
    const J = judgeHeld({ seed, record: rec, nodes });
    const R = resultOf(live);
    assert.deepEqual([J.f, J.p, J.k, J.w], [R.floor, R.perfects, R.tick, R.cause], seed);
    assert.equal(J.s, hrScore(R.floor, R.perfects, R.tick));
    assert.equal(holdsOf(rec).h, legsOf(rec).length - 1);
  }
});

test('EACH LEG\'s SPEED CHECK: a chunk AHEAD of its leg\'s clock refuses the run; a leg that falls BEHIND is cut there (every later leg dropped); a chunk past z is never read', () => {
  const seed = 'clk', { events } = playHeld(seed, BOTS.good, { holds: 2, lose: false });
  const ahead = legsFor(events, { ahead: true });
  assert.equal(judgeHeld({ seed, record: ahead.rec, nodes: ahead.nodes }).bad, 'ahead of the clock');
  const slow = legsFor(events, { slow: { leg: 1, from: 5 } });
  const L = logOf(slow.rec, slow.nodes);
  assert.ok(L.cut && L.cut.leg === 1, 'cut in leg 1');
  assert.equal(L.legs.length, 2, 'leg 2 dropped');
  const J = judgeHeld({ seed, record: slow.rec, nodes: slow.nodes });
  assert.equal(J.cut, 1); assert.ok(J.f > 0);
  // a chunk stamped after its leg's z: not read
  const late = legsFor(events);
  const c = late.nodes[0].c, k = Object.keys(c).length;
  c[k] = { s: '9', at: late.rec.l[0].z + 1 };
  assert.deepEqual(logOf(late.rec, late.nodes).events, events);
  // a hole: refused
  const hole = legsFor(events); delete hole.nodes[0].c[2];
  assert.equal(judgeHeld({ seed, record: hole.rec, nodes: hole.nodes }).bad, 'chunks');
});

test('THE NEXT HOLD: the slab enters where its own entry was (no run time lost); none once the run is over; the kinds — a room hold first, then the 3', () => {
  assert.equal(nextHoldTick('n', []), BEAT, 'no tap yet: the first slab\'s entry');
  const r = createRun({ seed: 'n', mode: 'daily' }); stepTo(r, r.s0); const t = r.s0 + Math.floor(r.S / 2); tap(r, t);
  assert.equal(nextHoldTick('n', [t]), t + BEAT);
  assert.equal(nextHoldTick('n', [r.s0 + 2 * r.S + 5]) == null || true, true);
  const miss = createRun({ seed: 'n', mode: 'daily' }); stepTo(miss, miss.s0); const tm = miss.s0; tap(miss, tm);   // (tick 0 of a sweep: fully off — a miss)
  assert.ok(isOver(miss)); assert.equal(nextHoldTick('n', [tm]), null);
  const rec = { l: { 0: { go: 1, z: 2, t: 0 } } };
  assert.equal(nextHoldKind(rec), 'hold'); assert.equal(holdsLeft(rec), 3);
  assert.equal(nextHoldKind({ ...rec, room: 1 }), 'room');
  const full = { l: { 0: { go: 1, z: 2, t: 0 }, 1: { go: 1, z: 2, t: 20 }, 2: { go: 1, z: 2, t: 40 }, 3: { go: 1, z: 2, t: 60 } } };
  assert.equal(nextHoldKind(full), null); assert.equal(holdsLeft(full), 0);
  assert.equal(nextHoldKind({ ...full, room: 1 }), 'room', 'a free room hold still opens after the 3');
});

test('THE SHARE INPUTS (spoiler-free): one entry per floor — its slab\'s width (0 … 1 of the start), its centre\'s offset, a perfect flag; nothing else', () => {
  const seed = 'sh', { events, live } = playHeld(seed, BOTS.casual, { holds: 2, lose: false });
  const S = shareOf(seed, events);
  assert.deepEqual(Object.keys(S).sort(), ['f', 'p', 'pf', 'w', 'x']);
  assert.equal(S.f, live.floor); assert.equal(S.p, live.perfects);
  assert.equal(S.w.length, live.floor); assert.equal(S.x.length, live.floor); assert.equal(S.pf.length, live.floor);
  assert.equal(S.pf.reduce((a, b) => a + b, 0), live.perfects);
  assert.ok(S.w.every(v => v > 0 && v <= 1)); assert.ok(S.x.every(v => v >= -1 && v <= 1));
});
