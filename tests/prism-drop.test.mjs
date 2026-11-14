// THE DROP A — Group 1 (rules first): THE DROP's run (js/games/prism/drop.js — PURE). The schedule + its guaranteed end, the recorder, the
// server's replay (whole + incremental from a checkpoint's snapshot), every refusal, the phone ≡ the server for many seeds, the replay's cost.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dropEvery, dropRowAt, dropRows, MAX_ROWS, DROP_END_MS, DROP_TAIL_MS, DROP_FAST_MS, END_TICK, TICK, FLOOR, LOG_MAX,
  createDropRun, input, stepTo, replay, snapshot, fromSnapshot, scoreOf, tenthsOf, linesOf, dropLine,
} from '../js/games/prism/drop.js';
import { survivalRowAt, survivalEvery } from '../js/games/prism/logic.js';
import { boardString } from '../js/games/prism/engine.js';
import { dropKey } from '../js/games/prism/bot.js';
import { rngFrom } from '../js/core/rng.js';

/** a phone playing a run: frames of 8–33 ms (wall time → the run's tick), the bot pressing a key every `every` ms; checkpoints every `ck` ms */
function play(seed, { every = 70, skill = 1, frames = null, ck = 5000, maxMs = DROP_END_MS + 5000, rnd = rngFrom(`bot:${seed}`) } = {}) {
  const run = createDropRun(seed);
  let ms = 0, next = 0, plan = null, nextCk = ck;
  const cks = [];
  while (!run.over && ms < maxMs) {
    ms += frames ? frames(rnd) : 8 + Math.floor(rnd() * 26);
    stepTo(run, Math.floor(ms / TICK));
    if (run.over) break;
    if (ms >= next) {
      next = ms + every;
      const r = dropKey(run.eng, plan, { skill, rnd });
      plan = r.plan;
      if (r.code) input(run, r.code);
    }
    if (ms >= nextCk) { nextCk += ck; cks.push({ k: run.k, len: run.log.length }); }
  }
  return { run, cks };
}

test('THE SCHEDULE: SURVIVAL\'s rows until 4:00, then faster and faster to one every 0.6 s; never slower as time goes on', () => {
  assert.equal(dropEvery(0), 10_000);
  assert.equal(Math.round(dropEvery(150_000)), 4_000);
  assert.equal(Math.round(dropEvery(DROP_TAIL_MS)), 4_000);
  assert.equal(Math.round(dropEvery(DROP_TAIL_MS + 180_000)), DROP_FAST_MS);
  assert.equal(Math.round(dropEvery(DROP_END_MS)), DROP_FAST_MS);
  for (let t = 0; t < DROP_END_MS; t += 1000) assert.ok(dropEvery(t + 1000) <= dropEvery(t) + 1e-9, `never slower at ${t}`);
  // the same rows as a room's SURVIVAL until the tail
  for (let k = 0; dropRowAt(k) < DROP_TAIL_MS; k++) assert.equal(dropRowAt(k), survivalRowAt(k), `row ${k}`);
  assert.equal(survivalEvery(DROP_TAIL_MS), dropEvery(DROP_TAIL_MS));
  assert.equal(dropRows(9_999), 0); assert.equal(dropRows(10_000), 1);
  assert.ok(MAX_ROWS > 150 && MAX_ROWS < 260, `a whole run's rows: ${MAX_ROWS}`);
  assert.equal(END_TICK, 57_600);
});

test('A GUARANTEED END: no run outlasts 8:00 — a perfect bot at the human floor, a perfect bot at 70 ms a key, a player who does nothing', () => {
  // the fastest the floor allows: a key every tick (the slam every FLOOR.slamTicks)
  const fast = play('end-fast', { every: 1, frames: () => 9, skill: 1 }).run;
  assert.ok(fast.over && fast.k <= END_TICK, `the perfect bot ends by THE END (${(fast.k * TICK / 1000).toFixed(1)} s, ${fast.why})`);
  const bot = play('end-bot', { every: 70 }).run;
  assert.ok(bot.over && bot.k <= END_TICK);
  const idle = createDropRun('end-idle');
  stepTo(idle, END_TICK + 1000);
  assert.ok(idle.over && idle.why === 'top' && idle.k < END_TICK, `doing nothing tops out early (${(idle.k * TICK / 1000).toFixed(1)} s)`);
  // THE END itself: a run is over at END_TICK whatever its board — stepTo never goes past it
  const r = createDropRun('end-cap');
  r.eng.cells.fill(0); r.eng.sd = 1e6;   // (no rows will ever rise: only THE END can stop it)
  const rr = createDropRun('end-cap2'); rr.eng.sd = 1e6;
  stepTo(rr, END_TICK - 1);
  assert.ok(!rr.over || rr.why === 'top');
  if (!rr.over) { stepTo(rr, END_TICK + 50); assert.equal(rr.k, END_TICK); assert.equal(rr.why, 'end'); }
});

test('RECORD → REPLAY: the server\'s replay of the phone\'s log = the same time, lines, pieces + the same board', () => {
  for (const seed of ['day-a', 'day-b', 'day-c']) {
    const { run } = play(seed);
    const R = replay(run.log, seed, { to: run.k, final: true });
    assert.ok(R.ok, `${seed}: replayed (${R.refused || ''} at ${R.at})`);
    assert.equal(R.k, run.k); assert.equal(R.lines, run.eng.lines); assert.equal(R.pieces, run.eng.stats.pieces);
    assert.equal(boardString(R.run.eng), boardString(run.eng));
    assert.equal(R.why, run.why);
    assert.ok(run.eng.stats.pieces > 20, `${seed}: a real run (${run.eng.stats.pieces} pieces, ${run.eng.lines} lines, ${(run.k * TICK / 1000).toFixed(1)} s)`);
  }
});

test('CHECKPOINTS: replaying chunk by chunk from each checkpoint\'s snapshot = the whole replay (the server\'s incremental check)', () => {
  const seed = 'ck-1';
  const { run, cks } = play(seed, { ck: 4000 });
  assert.ok(cks.length >= 4, `checkpoints: ${cks.length}`);
  let snap = null;
  for (const c of cks) {
    const R = replay(run.log.slice(0, c.len), seed, { from: snap, to: c.k });
    assert.ok(R.ok, `checkpoint at ${c.k}: ${R.refused}`);
    snap = snapshot(R.run);
    assert.equal(fromSnapshot(snap).k, c.k);
  }
  const F = replay(run.log, seed, { from: snap, to: run.k, final: true });
  assert.ok(F.ok, F.refused);
  assert.equal(F.lines, run.eng.lines); assert.equal(F.k, run.k);
  assert.equal(boardString(F.run.eng), boardString(run.eng), 'the same board');
  // a snapshot is exact: a run restored from one and played on is the run that was never stopped
  const mid = cks[Math.floor(cks.length / 2)];
  const back = fromSnapshot(snapshot(replay(run.log.slice(0, mid.len), seed, { to: mid.k }).run));
  const whole = replay(run.log.slice(0, mid.len), seed, { to: mid.k }).run;
  stepTo(back, mid.k + 600); stepTo(whole, mid.k + 600);
  assert.equal(boardString(back.eng), boardString(whole.eng));
});

test('THE REFUSALS: a changed move, a shifted tick, a forged / missing lock, too fast, past the end, not over, too big, a bad char, out of order', () => {
  const seed = 'tamper';
  const { run } = play(seed);
  const log = run.log, k = run.k;
  assert.ok(replay(log, seed, { to: k, final: true }).ok);
  const refused = (l, opts = { to: k, final: true }) => { const R = replay(l, seed, opts); assert.equal(R.ok, false, `refused: ${l.slice(0, 40)}…`); return R.refused; };
  // a move changed (the first L → R, or the first R → L)
  const i = log.search(/[LR]/);
  const swapped = log.slice(0, i) + (log[i] === 'L' ? 'R' : 'L') + log.slice(i + 1);
  assert.ok(['illegal', 'lock_mismatch', 'past_end', 'not_over'].includes(refused(swapped)));
  // a tick shifted (the first number + 7)
  const nm = /\d+/.exec(log);
  const shifted = log.slice(0, nm.index) + String(Number(nm[0]) + 7) + log.slice(nm.index + nm[0].length);
  assert.ok(['lock_mismatch', 'illegal', 'past_end', 'not_over', 'too_fast'].includes(refused(shifted)), 'a shifted tick never replays the same');
  // a forged lock: a K where nothing locked
  assert.equal(refused('5K' + log), 'lock_mismatch');
  // a lock dropped (its K removed)
  const kk = log.indexOf('K');
  const prev = log.slice(0, kk).match(/\d*$/)[0];
  const noK = log.slice(0, kk - prev.length) + log.slice(kk + 1);
  assert.ok(['lock_mismatch', 'out_of_order', 'illegal'].includes(refused(noK)));
  // too fast: 30 inputs in one tick
  assert.equal(refused('10' + 'C'.repeat(30), { to: 20 }), 'too_fast');
  assert.equal(refused('10X1X', { to: 20 }), 'too_fast', 'two slams one tick apart');
  // past the end: a slam after the top-out
  assert.equal(refused(log + '1X'), 'past_end');
  assert.equal(refused(log, { to: k + 10, final: true }), 'past_end', 'a checkpoint past the run\'s end');
  // not over: the log cut half-way, called final
  assert.equal(refused(log.slice(0, Math.floor(log.length / 2)).replace(/\d*$/, ''), { to: Math.floor(k / 2), final: true }) !== undefined, true);
  // too big + a char no log has
  assert.equal(refused('1C'.repeat(LOG_MAX)), 'too_big');
  assert.equal(refused('12Q'), 'bad_log');
  assert.equal(refused('012C'), 'bad_log');
  // out of order: a chunk whose first event lands inside the span the snapshot already checked
  const a = replay(log.slice(0, 200).replace(/\d*$/, ''), seed, { to: 2000 });
  if (a.ok && a.run.k > a.run.lastEv + 2) {
    const snap = snapshot(a.run);
    const base = log.slice(0, 200).replace(/\d*$/, '');
    assert.equal(replay(base + '1C', seed, { from: snap, to: 2100 }).refused, 'out_of_order');
  }
  // an illegal input: a hold twice on one piece
  const r2 = createDropRun('hold2');
  stepTo(r2, 5);
  assert.equal(input(r2, 'H'), 'ok'); assert.equal(input(r2, 'H'), 'noop', 'the phone never logs a second hold');
  assert.equal(refused('5HH', { to: 10 }), 'illegal');
});

test('THE HUMAN FLOOR on the phone: a slam too soon waits for its tick; a flood is dropped — the log it writes always replays', () => {
  const r = createDropRun('floor');
  stepTo(r, 30);
  assert.equal(input(r, 'X'), 'ok');
  assert.equal(input(r, 'X'), 'wait', 'a second slam inside the floor waits');
  stepTo(r, 30 + FLOOR.slamTicks);
  assert.ok(r.eng.stats.pieces >= 2, 'it landed on the first tick the floor allows');
  for (let i = 0; i < 60; i++) input(r, i % 2 ? 'L' : 'R');
  stepTo(r, 400);
  const R = replay(r.log, 'floor', { to: r.k });
  assert.ok(R.ok, R.refused);
});

test('THE PHONE ≡ THE SERVER for many seeds (any frame rhythm — the rows, the pieces, the board, the lines identical)', () => {
  for (let s = 0; s < 12; s++) {
    const seed = `many-${s}`;
    const frames = s % 3 === 0 ? () => 16 : s % 3 === 1 ? r => 5 + Math.floor(r() * 60) : r => (r() < 0.05 ? 250 : 8);
    const { run } = play(seed, { every: 40 + s * 10, frames, skill: 0.85, maxMs: 120_000 });
    const R = replay(run.log, seed, { to: run.k, final: run.over });
    assert.ok(R.ok, `${seed}: ${R.refused} at ${R.at}`);
    assert.equal(boardString(R.run.eng), boardString(run.eng), seed);
    assert.equal(R.run.eng.sd, run.eng.sd, `${seed}: the same rows`);
    assert.equal(R.lines, run.eng.lines);
  }
});

test('THE SCORE: ONE number — tenths × 1000 + lines; a longer run always higher; the line', () => {
  assert.equal(scoreOf(252_340, 37), 2523 * 1000 + 37);
  assert.ok(scoreOf(100_000, 0) > scoreOf(99_900, 999));
  assert.equal(tenthsOf(scoreOf(252_340, 37)), 2523); assert.equal(linesOf(scoreOf(252_340, 37)), 37);
  assert.equal(scoreOf(DROP_END_MS + 5000, 12), 4800 * 1000 + 12, 'capped at THE END');
  assert.equal(dropLine(scoreOf(252_340, 37)), '4:12.3 · 37 LINES');
  assert.equal(dropLine(scoreOf(61_000, 1)), '1:01.0 · 1 LINE');
  assert.equal(dropLine(scoreOf(DROP_END_MS, 120)), '8:00 · THE END');
});

test('THE REPLAY\'s COST: a long log replays well under 1 s (whole), a checkpoint\'s chunk in a few ms', () => {
  const seed = 'cost';
  const { run, cks } = play(seed, { every: 40, maxMs: DROP_END_MS + 1000 });
  const t0 = performance.now();
  const R = replay(run.log, seed, { to: run.k, final: true });
  const whole = performance.now() - t0;
  assert.ok(R.ok);
  let snap = null, worst = 0;
  for (const c of cks) {
    const t1 = performance.now();
    const C = replay(run.log.slice(0, c.len), seed, { from: snap, to: c.k });
    worst = Math.max(worst, performance.now() - t1);
    snap = snapshot(C.run);
  }
  console.log(`# THE DROP replay: ${(run.k * TICK / 1000).toFixed(1)} s of play, ${run.eng.stats.pieces} pieces, ${run.log.length} chars — whole ${whole.toFixed(1)} ms, the worst checkpoint ${worst.toFixed(1)} ms (${cks.length} checkpoints)`);
  assert.ok(whole < 1000, `whole replay ${whole.toFixed(0)} ms`);
  assert.ok(run.log.length < LOG_MAX / 2, 'an honest log far under the cap');
});
