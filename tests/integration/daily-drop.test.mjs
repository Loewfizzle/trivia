// THE DROP A — THE SERVER HALF on the emulators (/api, no browser; docs/prism.md "THE DROP"): start (the seed + the run) → checkpoints (each
// chunk replayed from the record's snapshot) → finish (the WHOLE log replayed — ONE score, tenths × 1000 + lines; the points) · a REFRESH
// (resumes at the latest checkpoint, one of the 3 pauses) · the player pauses + their caps · THE ROOM WINS' free pause · the refusals (a
// forged chunk, a log from the future, a finish before the end) · THE SLOW-MOTION CHECK · an ABANDONED run scored at its checkpoint by the next
// call + THE DAY'S CLOSE · the own day (a run started before 4 am finishes on its day) · Server-Timing + the replay's cost.
//   cd tests/integration && node --test daily-drop.test.mjs        (the emulators running)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.MATCH_GAP_MS = '20000';
process.env.ADMIN_PIDS = '';
process.env.BOARD_MIN_MATCHES = '1';
process.env.DAILY_TEST = '1';
process.env.DAILY_TEST_OFF = 'drop';     // (THE DROP's row ships OFF — opened here only, on the emulators)

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { dailyAction } from '../../api/daily.js';
import { clearSwitchCache, forgetPicks, loadDailies } from '../../api/_lib/dailies.js';
import { forgetDropDays } from '../../api/_lib/drop.js';
import { forgetClosed, forgetSwept } from '../../api/_lib/daily-close.js';
import { todaysDailies } from '../../js/core/daily.js';
import { streakDay, dayStartAt, dayNum, dayOf } from '../../js/core/streak.js';
import { timing } from '../../api/_lib/timing.js';
import { createDropRun, input, stepTo, TICK, scoreOf, COUNT_MS } from '../../js/games/prism/drop.js';
import { PAUSES, CK_MS, PAUSE_MS } from '../../js/games/prism/drop-judge.js';
import { dailyPoints } from '../../js/core/daily-points.js';
import { dropKey } from '../../js/games/prism/bot.js';
import { rngFrom } from '../../js/core/rng.js';

const NOW = Date.UTC(2026, 10, 10, 1, 0, 0);   // Mon Nov 9 2026, 8 pm Eastern
const DAY = 86_400_000, WEEK_AGO = NOW - 30 * DAY;
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'dly', 'dsched', 'pcount', 'streak', 'progress', 'pfr', 'seats', 'dsecret'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); forgetPicks(); forgetDropDays(); clearSwitchCache(); loadDailies(); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = WEEK_AGO) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
let CALLS = 0;
const D = (uid, body, at, T) => { CALLS++; return dailyAction(uid, body, at, T); };
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} ${e.code} (${e.message})`); if (code) assert.equal(e.code, code); return e; }
  assert.fail(`expected ${status} ${code}`);
};
const pidOf = uid => val(`uids/${uid}`);

/** a phone playing THE DROP over /api: the run, the bot, the clock (the server's), the sent length; send() = one upload */
function phone(uid, start, { every = 80, rnd = rngFrom(uid) } = {}) {
  const P = { uid, run: createDropRun(start.run.seed), sent: 0, plan: null, next: 0, go: start.run.go, pm: start.run.pm || 0, day: start.day, now: start.now };
  P.tick = () => Math.floor((P.now - P.go - P.pm) / TICK);
  P.frame = () => { if (P.run.over) return; stepTo(P.run, P.tick()); if (P.run.over) return; if (P.now >= P.next) { P.next = P.now + every; const r = dropKey(P.run.eng, P.plan, { rnd }); P.plan = r.plan; if (r.code) input(P.run, r.code); } };
  P.body = (action, extra = {}) => ({ action, game: 'drop', day: P.day, at: P.sent, add: P.run.log.slice(P.sent), k: P.run.k, ...(P.run.over ? { fin: 1 } : {}), ...extra });
  P.send = async (action = 'checkpoint', extra = {}) => { const b = P.body(action, extra); const r = await D(uid, b, P.now); if (!r.resync) P.sent = b.at + b.add.length; return r; };
  /** play for ms of the clock (16 ms frames), a checkpoint every CK_MS */
  P.play = async ms => { const until = P.now + ms; let ck = P.now + CK_MS; while (P.now < until && !P.run.over) { P.now += 16; P.frame(); if (P.now >= ck) { ck += CK_MS; await P.send(); } } };
  return P;
}

test('THE DROP is registered only through the test opener (its row ships OFF); the seed comes from THE DAILY SECRET', async () => {
  assert.ok(todaysDailies().includes('drop'), 'opened by DAILY_TEST_OFF on the emulators');
  await ensure('dr-ann', 'DropAnn');
  const s = await D('dr-ann', { action: 'start', game: 'drop' }, NOW);
  assert.ok(s.run && /^\d+$/.test(s.run.seed), 'a seed (the HMAC of THE DAILY SECRET)');
  assert.equal(s.run.go, s.startedAt + COUNT_MS, 'tick 0 = the start + the 3-2-1');
  assert.equal(s.run.left, PAUSES);
  await ensure('dr-bob', 'DropBob');
  const b = await D('dr-bob', { action: 'start', game: 'drop' }, NOW + 5000);
  assert.equal(b.run.seed, s.run.seed, 'everyone gets the same day');
  assert.equal(await val(`dly/drop/${s.day}/b`), null, 'nothing stored for the day — the seed is an HMAC, never a file');
});

test('A WHOLE RUN over /api: checkpoints → the final upload → finish = the replayed score (tenths × 1000 + lines), stored once, the points; Server-Timing carries the replay', async () => {
  await ensure('dr-cal', 'DropCal');
  CALLS = 0;
  const s = await D('dr-cal', { action: 'start', game: 'drop' }, NOW + 60e3);
  const P = phone('dr-cal', s);
  P.now = s.run.go;
  await P.play(10 * 60e3);
  assert.ok(P.run.over, 'the bot topped out');
  const last = await P.send();
  assert.equal(last.e, 1);
  const pr = await val(`dly/drop/${P.day}/p/${await pidOf('dr-cal')}`);
  assert.equal(pr.sv, undefined, 'no snapshot: a checkpoint is never replayed (THE ADD-ON)');
  const T = timing();
  const f = await D('dr-cal', { action: 'finish', game: 'drop', day: P.day }, P.now + 500, T);
  const mins = P.run.k * TICK / 60_000;
  assert.ok(CALLS <= Math.ceil(mins * 2) + 3, `${CALLS} calls for a ${mins.toFixed(1)}-min run (a checkpoint every 30 s + the start, the final upload, the finish)`);
  console.log(`# THE DROP requests: ${CALLS} for ${mins.toFixed(1)} min — an 8-min run ≈ ${16 + 3}; the record ${JSON.stringify(pr).length} bytes, the log ${P.run.log.length} chars`);
  const want = scoreOf(P.run.k * TICK, P.run.eng.lines);
  assert.equal(f.score, want, 'the server\'s replay = the phone\'s run');
  assert.equal(f.counted, true);
  assert.equal(f.outcome.points, dailyPoints('drop', want));
  assert.equal(await val(`dly/drop/${P.day}/r/${await pidOf('dr-cal')}`), want);
  const h = T.header();
  assert.match(h, /replay;dur=[\d.]+;desc="[\d.]+ ms"/, `Server-Timing names the replay (${h})`);
  console.log(`# THE DROP finish: ${(P.run.k * TICK / 1000).toFixed(1)} s, ${P.run.log.length} chars — ${h}`);
  // a second finish = the same score back
  assert.equal((await D('dr-cal', { action: 'finish', game: 'drop', day: P.day }, P.now + 900)).again, true);
  await rejects(P.send(), 409, 'finished');
});

test('THE DROP B — SHARE TODAY’s inputs (`today { share }`, the tap only): the finished run replayed once → the time, the lines + the final board with every junk row SOLID; nothing else', async () => {
  const t = await D('dr-cal', { action: 'today', share: true }, NOW + 60e3 + 15 * 60e3);
  const sh = t.share && t.share.drop;
  assert.ok(sh, 'THE DROP’s share inputs');
  assert.deepEqual(Object.keys(sh).sort(), ['b', 'day', 'ln', 't']);
  const sc = t.mine.drop;
  assert.equal(Math.round(sh.t / 100), Math.floor(sc / 1000), 'the time = the stored score’s'); assert.equal(sh.ln, sc % 1000, 'the lines');
  assert.ok(/^[0-9]*$/.test(sh.b) && sh.b.length % 10 === 0 && sh.b.length <= 200, 'a board string');
  assert.equal((sh.b.match(/.{10}/g) || []).filter(r => r.includes('8') && r.includes('0')).length, 0, 'no junk row keeps its hole');
  const plain = await D('dr-cal', { action: 'today' }, NOW + 60e3 + 15 * 60e3 + 500);
  assert.equal(plain.share, undefined, 'never without the tap');
});

test('A REFRESH: start again mid-run → the latest checkpoint + its log, paused (one of the 3); nothing but a resume while paused; RESUME → the run goes on', async () => {
  await ensure('dr-dee', 'DropDee');
  const s = await D('dr-dee', { action: 'start', game: 'drop' }, NOW + 2 * 60e3);
  let P = phone('dr-dee', s);
  P.now = s.run.go;
  await P.play(35e3);
  const k0 = P.run.k;
  const r = await D('dr-dee', { action: 'start', game: 'drop', day: P.day }, P.now + 25e3);
  assert.equal(r.run.refresh, 1); assert.equal(r.run.left, PAUSES - 1, 'one pause used');
  assert.ok(r.run.pa != null, 'paused');
  assert.ok(r.run.log.length > 0 && r.run.k <= k0 && r.run.k > k0 - CK_MS / TICK - 2, 'back at the LATEST checkpoint, with its log');
  await rejects(D('dr-dee', { action: 'checkpoint', game: 'drop', day: P.day, at: r.run.len, add: '', k: r.run.k + 5 }, P.now + 26e3), 409, 'paused');
  // the phone rebuilds its run from the log (the same steps) and resumes
  P = phone('dr-dee', r); P.now = r.now;
  const { replay } = await import('../../js/games/prism/drop.js');
  const R = replay(r.run.log, r.run.seed, { to: r.run.k });
  assert.ok(R.ok);
  P.run = R.run; P.run.log = r.run.log; P.sent = r.run.len;
  P.now += 3000;
  const back = await D('dr-dee', { action: 'resume', game: 'drop', day: P.day }, P.now);
  P.pm = back.pm; P.go = back.go;
  assert.ok(Math.abs(P.tick() - r.run.k) <= 1, 'the clock stands at the checkpoint');
  await P.play(35e3);
  if (!P.run.over) await P.send();
  const pr = await val(`dly/drop/${P.day}/p/${await pidOf('dr-dee')}`);
  assert.ok(pr.k > r.run.k + 600, 'the run went on, its checkpoints accepted');
});

test('PLAYER PAUSES: 3 a run (server-timed, the board\'s clock stopped), a 4th refused; THE ROOM WINS\' pause needs a room and uses none of the 3', async () => {
  await ensure('dr-eve', 'DropEve');
  const s = await D('dr-eve', { action: 'start', game: 'drop' }, NOW + 3 * 60e3);
  const P = phone('dr-eve', s);
  P.now = s.run.go;
  await P.play(7e3);
  for (let i = 1; i <= PAUSES; i++) {
    const p = await P.send('ppause');
    assert.equal(p.left, PAUSES - i); assert.ok(p.pa != null);
    P.now += 30e3;
    const b = await D('dr-eve', { action: 'resume', game: 'drop', day: P.day }, P.now);
    P.pm = b.pm;
    assert.ok(Math.abs(P.tick() - P.run.k) < 30, 'back where it paused');
    await P.play(2e3);
  }
  await rejects(D('dr-eve', { action: 'ppause', game: 'drop', day: P.day }, P.now), 409, 'pause_limit');
  await rejects(D('dr-eve', { action: 'pause', game: 'drop', day: P.day }, P.now + 100), 409, 'no_room_game');
  // a real room that started a game (2 players): accepted, free
  const pa = await pidOf('dr-eve');
  // (THE FIX PASS — S6: a room one person made — the second seat an incognito tab with no profile — is refused; a real party with another
  //  COUNTED profile in a started game pauses ONCE a game start)
  await ref('rooms/DRPX').set({ meta: { hostId: 'x', status: 'playing', createdAt: P.now, go: { m: 'gs1', at: P.now - 1000 } }, players: { 'dr-eve': { name: 'Eve', pid: pa }, x: { name: 'X' } } });
  await rejects(P.send('pause', { room: 'DRPX' }), 409, 'no_room_game');
  await ensure('dr-xav', 'Xav');
  await ref('rooms/DRPX/players/x').set({ name: 'X', pid: await pidOf('dr-xav') });
  const rp = await P.send('pause', { room: 'DRPX' });
  assert.equal(rp.kd, 'r'); assert.equal(rp.left, 0, 'none of the 3 (all used before)');
  P.now += 5 * 60e3;
  const b = await D('dr-eve', { action: 'resume', game: 'drop', day: P.day }, P.now);
  P.pm = b.pm;
  await rejects(P.send('pause', { room: 'DRPX' }), 409, 'room_used');   // (THE FIX PASS — S6: ONE room pause a game start)
  await P.play(3e3);
  assert.ok(!(await val(`dly/drop/${P.day}/p/${pa}`)).e, 'the run goes on after a 5-minute room game');
});

test('THE DROP B — HIDING THE PAGE: each hide = a PLAYER pause (the chunk carried, one of the 3, server-timed); the 4th hide pauses nothing (the chunk still lands); away past the bound with none left (`aw`) → ended at the checkpoint + 15 s, scored', async () => {
  await ensure('dr-hid', 'DropHid');
  const s = await D('dr-hid', { action: 'start', game: 'drop' }, NOW + 3.5 * 60e3);
  const P = phone('dr-hid', s);
  P.now = s.run.go;
  await P.play(6e3);
  const pa = await pidOf('dr-hid');
  for (let i = 1; i <= PAUSES; i++) {
    const k0 = P.run.k;
    const p = await P.send('ppause');                                           // (the hide: a ppause with the freshest chunk — keepalive on a phone)
    assert.equal(p.left, PAUSES - i, `hide ${i}: one of the 3`); assert.ok(p.pa != null, `hide ${i}: paused`);
    const rec = await val(`dly/drop/${P.day}/p/${pa}`);
    assert.equal(rec.k, k0, `hide ${i}: the chunk carried to the hide's tick`); assert.equal(rec.pz.n, i);
    P.now += 10e3;                                                              // (10 s away)
    const b = await D('dr-hid', { action: 'resume', game: 'drop', day: P.day }, P.now);
    P.pm = b.pm;
    assert.ok(Math.abs(P.tick() - k0) < 30, `hide ${i}: the clock stood still while away`);
    await P.play(3e3);
  }
  // the 4th hide: no pause left — the phone sends a checkpoint (a ppause would be answered the same: the chunk stored, no pause)
  const k4 = P.run.k;
  const q = await P.send('ppause');
  assert.equal(q.refusedPause, 'pause_limit'); assert.equal(q.pa, null, 'no pause granted');
  assert.equal((await val(`dly/drop/${P.day}/p/${pa}`)).k, k4, 'its chunk still landed');
  // a short hide (≤ 20 s) with `aw` claimed is NOT an end: the server checks the gap on its own clock
  P.now += 8e3;
  stepTo(P.run, P.tick());
  const short = await P.send('checkpoint', { aw: 1 });
  assert.ok(!short.e, 'a short hide: the run goes on (the gap is under the bound)');
  await P.play(4e3);
  const kh = P.run.k; await P.send('checkpoint');                               // (the 5th hide's checkpoint — keepalive on a phone)
  const t0 = (await val(`dly/drop/${P.day}/p/${pa}`)).t;
  // away 30 s, no pause left: back on the page the phone steps 15 s of play (no input) and says `aw`
  P.now += 30e3;
  stepTo(P.run, Math.min(P.tick(), kh + Math.round(15e3 / TICK)));
  const e = await P.send('checkpoint', { aw: 1 });
  assert.equal(e.e, 1); assert.equal(e.o, 'late');
  const rec = await val(`dly/drop/${P.day}/p/${pa}`);
  assert.ok(Math.abs(rec.t - (t0 + 15e3)) <= TICK || P.run.over, `ended at the checkpoint + 15 s of play (${rec.t} vs ${t0 + 15e3})`);
  const f = await D('dr-hid', { action: 'finish', game: 'drop', day: P.day }, P.now + 500);
  assert.ok(Number.isFinite(f.score) && f.score > 0, `scored at the cut (${f.score})`);
});

test('THE REFUSALS: a forged log (stored by a checkpoint — refused by THE RE-PLAY CHECK at the finish), a log from the future, a finish before the end', async () => {
  await ensure('dr-fay', 'DropFay');
  const s = await D('dr-fay', { action: 'start', game: 'drop' }, NOW + 4 * 60e3);
  const P = phone('dr-fay', s);
  P.now = s.run.go;
  await P.play(35e3);
  const pid = await pidOf('dr-fay');
  for (let i = 0; i < 100; i++) { P.now += 16; P.frame(); }
  const bad = await rejects(D('dr-fay', { ...P.body('checkpoint'), add: P.body('checkpoint').add + 'Q' }, P.now), 422, 'bad_log');
  void bad;
  // a forged lock: a checkpoint is only bounded (size / order / time) — it stores it; the run's ONE replay at the finish refuses it
  const ck = await D('dr-fay', { ...P.body('checkpoint'), add: '1K' + P.body('checkpoint').add, fin: 1 }, P.now);
  assert.equal(ck.e, 1, 'stored + ended (fin)');
  // PFIX-3 (FABLE REVIEW 2 — S3): the refused finish is NOT a dead end any more — the run is scored at the last point its log can prove (just
  // before the forged event), its record marked, the refusal reported; TODAY shows it done + unchecked (never RESUME all day)
  const good = (await val(`dly/drop/${P.day}/p/${pid}`));
  await ref('errlog').remove();
  const f = await D('dr-fay', { action: 'finish', game: 'drop', day: P.day }, P.now + 300);
  assert.equal(f.rf, true, 'the finish says the run could not be checked');
  const stored = await val(`dly/drop/${P.day}/r/${pid}`);
  assert.equal(stored, f.score, 'a score IS stored');
  assert.ok(Math.floor(f.score / 1000) >= 250 && Math.floor(f.score / 1000) <= Math.round(good.t / 100), `… at the last provable point: ${(Math.floor(f.score / 1000) / 10).toFixed(1)} s of a ${(good.t / 1000).toFixed(1)} s claim — nothing past the forgery`);
  const marked = await val(`dly/drop/${P.day}/p/${pid}`);
  assert.equal(marked.rf, 'lock_mismatch'); assert.ok(marked.rk > 0 && marked.rk < marked.k, 'the record is marked: the reason + the tick it was scored at');
  let errs = null; for (let i = 0; i < 30 && !errs; i++) { errs = await val('errlog'); if (!errs) await new Promise(r => setTimeout(r, 50)); }
  const row = Object.values(errs || {})[0];
  assert.ok(row && /PRISM DROP: a finish the replay refused \(lock_mismatch\)/.test(row.m) && row.p === 'server' && row.w === 'drop-refused' && row.n === 1, `reported to /admin's error log (${row && row.m})`);
  assert.ok(!JSON.stringify(row).includes(pid), 'no id in the report');
  const td = await D('dr-fay', { action: 'today' }, P.now + 600);
  assert.equal(td.mine.drop, f.score); assert.ok(!td.started.drop, 'TODAY: done — never RESUME all day'); assert.deepEqual(td.rf, { drop: true });
  const again = await D('dr-fay', { action: 'finish', game: 'drop', day: P.day }, P.now + 900);
  assert.equal(again.score, f.score); assert.equal(again.again, true); assert.equal(again.rf, true, 'a repeat gets the same answer');
  const re = await D('dr-fay', { action: 'start', game: 'drop' }, P.now + 1200);
  assert.equal(re.done, f.score); assert.equal(re.run.rf, 1, 'a re-opened run: done + unchecked (never "SENDING YOUR RUN…")');
  const sh = await D('dr-fay', { action: 'today', share: true }, P.now + 1500);
  assert.ok(sh.share && sh.share.drop && typeof sh.share.drop.b === 'string', 'SHARE TODAY still gets a board — the one at the scored point');
  // a log built faster than real time: 60 s of play uploaded 5 s later
  const fast = createDropRun(s.run.seed); let plan = null; const rnd = rngFrom('fast');
  for (let k = 0; k < 7200 && !fast.over; k += 12) { stepTo(fast, k); const x = dropKey(fast.eng, plan, { rnd }); plan = x.plan; if (x.code) input(fast, x.code); }
  await ensure('dr-gus', 'DropGus');
  const g = await D('dr-gus', { action: 'start', game: 'drop' }, NOW + 5 * 60e3);
  await rejects(D('dr-gus', { action: 'checkpoint', game: 'drop', day: g.day, at: 0, add: fast.log, k: fast.k }, g.run.go + 5000), 422, 'too_early');
  await rejects(D('dr-gus', { action: 'finish', game: 'drop', day: g.day }, g.run.go + 6000), 409, 'not_done');
});

test('ABANDONED: a run silent past its budgets is scored at its LAST checkpoint by the next `today`; the day before\'s leftovers by THE DAY\'S CLOSE', async () => {
  await ensure('dr-hal', 'DropHal');
  const s = await D('dr-hal', { action: 'start', game: 'drop' }, NOW + 6 * 60e3);
  const P = phone('dr-hal', s);
  P.now = s.run.go;
  await P.play(35e3);
  const pid = await pidOf('dr-hal');
  const rec = await val(`dly/drop/${P.day}/p/${pid}`);
  assert.ok(rec.k > 0, 'a checkpoint landed');
  // a minute later: pauses left, inside the 20 minutes — still resumable (RESUME on TODAY)
  const t1 = await D('dr-hal', { action: 'today' }, P.now + 60e3);
  assert.equal(t1.started.drop, true); assert.equal(t1.mine.drop, undefined);
  // 25 minutes of silence: it can never come back → scored at its last checkpoint
  const t2 = await D('dr-hal', { action: 'today' }, P.now + PAUSE_MS + 5 * 60e3);
  assert.equal(Math.floor(t2.mine.drop / 1000), Math.round(rec.t / 100), 'the checkpoint\'s time (+ its lines — ONE replay to there)');
  assert.ok(!t2.started.drop);
  // THE DAY'S CLOSE: a run of the day before yesterday left in flight (a room pause — never abandoned on its own) is swept
  await ensure('dr-ivy', 'DropIvy');
  const old = NOW - 2 * DAY + 3600e3;
  const so = await D('dr-ivy', { action: 'start', game: 'drop' }, old);
  const Q = phone('dr-ivy', so);
  Q.now = so.run.go;
  await Q.play(35e3);
  const ivy = await pidOf('dr-ivy');
  await ensure('dr-yul', 'Yul');
  await ref('rooms/DRPY').set({ meta: { hostId: 'y', status: 'playing', createdAt: Q.now, go: { m: 'gs2', at: Q.now - 1000 } }, players: { 'dr-ivy': { name: 'Ivy', pid: ivy }, y: { name: 'Y', pid: await pidOf('dr-yul') } } });
  await Q.send('pause', { room: 'DRPY' });
  forgetClosed(); forgetSwept();
  await D('dr-ann', { action: 'today' }, NOW + 7 * 60e3);
  const r = await val(`dly/drop/${so.day}/r/${ivy}`);
  assert.ok(r != null && r > 0, `swept at the day's close (${r})`);
});

test('THE OWN DAY (DFIX1): a run started at 3:59:30 am finishes after 4 am on ITS day', async () => {
  await ensure('dr-jo', 'DropJo');
  const turn = dayStartAt(dayOf(dayNum(streakDay(NOW)) + 2));          // a 4 am two days on
  const s = await D('dr-jo', { action: 'start', game: 'drop' }, turn - 30e3);
  const P = phone('dr-jo', s);
  P.now = s.run.go;
  await P.play(10 * 60e3);
  assert.ok(P.now > turn, 'the run crossed 4 am');
  await P.send();
  const f = await D('dr-jo', { action: 'finish', game: 'drop', day: P.day }, P.now + 400);
  assert.equal(f.day, s.day, 'scored on the day it began');
  assert.equal(await val(`dly/drop/${s.day}/r/${await pidOf('dr-jo')}`), f.score);
});

test('/admin\'s PROGRESS RESET clears THE DROP\'s records like the others: its points + its board go; a run started before the reset is never paid', async () => {
  const { adminAction } = await import('../../api/admin.js');
  const { weekOfDay } = await import('../../js/core/daily-points.js');
  const T = NOW + 20 * DAY;
  const me = await ensure('dr-kit', 'DropKit');
  const s = await D('dr-kit', { action: 'start', game: 'drop' }, T);
  const P = phone('dr-kit', s);
  P.now = s.run.go; await P.play(10 * 60e3); await P.send();
  const f = await D('dr-kit', { action: 'finish', game: 'drop', day: P.day }, P.now + 300);
  assert.ok(f.outcome.points >= 10);
  const wk = weekOfDay(P.day);
  assert.equal(await val(`lb/daily-drop/${wk}/${me.pid}`), f.outcome.points, 'THE DROP\'s own board (THIS WEEK)');
  assert.ok((await val(`pstats/${me.pid}/dp/a/g/drop`)).t > 0);
  // a second player mid-run when the reset lands
  await ensure('dr-lee', 'DropLee');
  const s2 = await D('dr-lee', { action: 'start', game: 'drop' }, P.now + 1000);
  process.env.ADMIN_PIDS = me.pid;
  try {
    const r = await adminAction('dr-kit', { action: 'progressReset', confirm: true, typed: 'RESET' }, P.now + 2000);
    assert.ok(r.done);
    assert.equal(await val(`pstats/${me.pid}/dp`), null, 'the points gone');
    assert.equal(await val(`lb/daily-drop`), null, 'the board gone');
    const Q = phone('dr-lee', s2); Q.now = s2.run.go; await Q.play(10 * 60e3); await Q.send();
    const f2 = await D('dr-lee', { action: 'finish', game: 'drop', day: Q.day }, Q.now + 300);
    assert.equal(f2.pre, true, 'started before the reset: kept for the player, never paid'); assert.equal(f2.outcome, null);
  } finally { process.env.ADMIN_PIDS = ''; await ref('progress/resetAt').remove(); await ref('backups').remove(); }   // (the reset's backup: other suites expect none)
});

test('THE PRUNE (the cost check): once a day\'s board is final, only the top runs keep their record + log (7 days) — everyone else the score row; never a profile scan', async () => {
  const { keepOf, PRUNE_KEEP, KEEP_LOG_DAYS } = await import('../../api/_lib/drop.js');
  const old = NOW - 3 * DAY, day = streakDay(old), base = `dly/drop/${day}`;
  const patch = { [`${base}/pr`]: null };   // (an earlier test's sweep already pruned this day while it was empty)
  for (let i = 0; i < 14; i++) { const pid = `pr${i}`; patch[`${base}/s/${pid}`] = old; patch[`${base}/r/${pid}`] = (100 + i) * 1000; patch[`${base}/p/${pid}`] = { st: old, e: 1, len: 5 }; patch[`${base}/l/${pid}/0`] = '5X5X5'; }
  await ref('/').update(patch);
  assert.equal(keepOf({ a: 1, b: 2, c: 2 }, 2).size, 2); assert.equal(keepOf({ a: 3, b: 2, c: 2 }, 2).size, 3, 'ties at the cut kept');
  forgetClosed(); forgetSwept();
  await D('dr-ann', { action: 'today' }, NOW + 9 * 60e3);
  const left = Object.keys((await val(`${base}/l`)) || {}).sort();
  assert.equal(left.length, PRUNE_KEEP, `the top ${PRUNE_KEEP} logs kept (${left.join(',')})`);
  assert.ok(!left.includes('pr0') && left.includes('pr13'), 'the best ones');
  assert.equal(Object.keys((await val(`${base}/p`)) || {}).length, PRUNE_KEEP);
  assert.equal(Object.keys((await val(`${base}/r`)) || {}).length, 14, 'every score row stays');
  assert.equal(await val(`${base}/pr`), 1);
  // KEEP_LOG_DAYS on: the rest go too
  forgetClosed(); forgetSwept();
  await D('dr-ann', { action: 'today' }, old + (KEEP_LOG_DAYS + 2) * DAY + 60e3);
  assert.equal(await val(`${base}/l`), null); assert.equal(await val(`${base}/p`), null);
  assert.equal(Object.keys((await val(`${base}/r`)) || {}).length, 14, 'the score rows stay');
  assert.equal(await val(`${base}/pr`), 2);
});

// ---------------------------------------------------------------- PFIX-3 — NO HONEST RUN LOST (FABLE REVIEW 2: M2, M3, S1)
test('PFIX-3 — THE CHUNK STORE over /api: a SHORTER chunk after a longer one from the same offset never makes a hole (M2 order B + the timed-out checkpoint) → the finish still scores; a chunk from a profile with NO run is never stored (S1)', async () => {
  await ensure('dr-m2', 'DropMtwo');
  const pid = await pidOf('dr-m2');
  // S1: no run yet — 5 refused uploads store NOTHING
  for (let i = 0; i < 5; i++) await rejects(D('dr-m2', { action: 'checkpoint', game: 'drop', at: i * 24_000, add: 'L'.repeat(24_000), k: 10 }, NOW + 20 * 60e3), 409, 'not_started');
  assert.equal(await val(`dly/drop/${streakDay(NOW)}/l/${pid}`), null, 'a profile with no run stores no chunk');
  const s = await D('dr-m2', { action: 'start', game: 'drop' }, NOW + 20 * 60e3);
  const P = phone('dr-m2', s);
  P.now = s.run.go;
  await P.play(8e3);
  // junk that the judge would not take is not stored either: past the checked length · ahead of the clock
  const r0 = await D('dr-m2', { ...P.body('checkpoint'), at: 9000, add: 'L'.repeat(100) }, P.now);
  assert.equal(r0.resync, true);
  await rejects(D('dr-m2', { ...P.body('checkpoint'), add: 'L'.repeat(50), k: P.run.k + 120 * 60 }, P.now), 422, 'too_early');
  assert.equal(await val(`dly/drop/${P.day}/l/${pid}`), null, 'nothing stored for a chunk the judge refuses');
  // M2 order B: the checkpoint in flight (shorter) + the hide's pause (longer) from the SAME offset — the pause lands first
  const ck = P.body('checkpoint');
  for (let i = 0; i < 60; i++) { P.now += 16; P.frame(); }
  const pz = P.body('ppause');
  assert.equal(pz.at, ck.at); assert.ok(pz.add.length > ck.add.length, 'the pause carries more');
  const p = await D('dr-m2', pz, P.now);
  assert.ok(p.pa != null);
  await rejects(D('dr-m2', ck, P.now + 50), 409, 'paused');
  let chunks = await val(`dly/drop/${P.day}/l/${pid}`);
  assert.deepEqual(Object.keys(chunks), [`${pz.at}_${pz.add.length}`], 'ONE chunk, keyed by offset + length — the shorter one never replaced it');
  P.sent = pz.at + pz.add.length;
  P.now += 5e3;
  P.pm = (await D('dr-m2', { action: 'resume', game: 'drop', day: P.day }, P.now)).pm;
  // order A: the checkpoint lands first, the pause's longer chunk from the same offset is in step (its tail taken)
  await P.play(3e3);
  const ck2 = P.body('checkpoint');
  for (let i = 0; i < 60; i++) { P.now += 16; P.frame(); }
  const pz2 = P.body('ppause');
  await D('dr-m2', ck2, P.now);
  const p2 = await D('dr-m2', pz2, P.now + 30);
  assert.ok(p2.pa != null && !p2.resync, 'paused, in step');
  assert.equal(p2.len, pz2.at + pz2.add.length);
  P.sent = p2.len;
  P.now += 5e3;
  P.pm = (await D('dr-m2', { action: 'resume', game: 'drop', day: P.day }, P.now)).pm;
  // S1b: a checkpoint that timed out on the phone lands AFTER its longer retry
  await P.play(2e3);
  const short = P.body('checkpoint');
  for (let i = 0; i < 120; i++) { P.now += 16; P.frame(); }
  await P.send();
  const z = await D('dr-m2', short, P.now + 40);
  assert.equal(z.resync, true, 'the late, shorter chunk brings nothing');
  chunks = await val(`dly/drop/${P.day}/l/${pid}`);
  assert.ok(!Object.keys(chunks).includes(`${short.at}_${short.add.length}`), '… and is not stored');
  await P.play(10 * 60e3);
  assert.ok(P.run.over);
  await P.send();
  const f = await D('dr-m2', { action: 'finish', game: 'drop', day: P.day }, P.now + 500);
  assert.equal(f.score, scoreOf(P.run.k * TICK, P.run.eng.lines), 'the finish scores the whole run — no hole in the log');
  // a finished run stores nothing more
  await rejects(D('dr-m2', { action: 'checkpoint', game: 'drop', day: P.day, at: P.sent, add: 'LLLL', k: P.run.k }, P.now + 900), 409, 'finished');
  const after = await val(`dly/drop/${P.day}/l/${pid}`);
  assert.deepEqual(Object.keys(after).sort(), Object.keys(await val(`dly/drop/${P.day}/l/${pid}`)).sort());
  assert.ok(!Object.keys(after).some(k => k.endsWith('_4') && k.startsWith(`${P.sent}_`)), 'nothing stored after the end');
});

test('PFIX-3 — THE LOST HIDE over /api (M3): the hide\'s pause call never arrived — asked again 60 s later with pauses left = a BACKDATED pause (one of the 3), the run goes on from the hide\'s tick and scores past it', async () => {
  await ensure('dr-m3', 'DropMthree');
  const pid = await pidOf('dr-m3');
  const s = await D('dr-m3', { action: 'start', game: 'drop' }, NOW + 40 * 60e3);
  const P = phone('dr-m3', s);
  P.now = s.run.go;
  await P.play(55e3);
  const k0 = P.run.k, body = P.body('ppause');                                 // the page hides at 55 s — this call is LOST
  P.now += 60e3;
  const p = await D('dr-m3', body, P.now);                                      // the return asks again
  assert.ok(p.pa != null && !p.e, 'paused — NOT ended late');
  assert.equal(p.left, PAUSES - 1, 'one of the 3');
  const rec = await val(`dly/drop/${P.day}/p/${pid}`);
  assert.equal(rec.k, k0); assert.ok(!rec.e);
  assert.ok(Math.abs(rec.pz.at - (P.now - 60e3)) < 30, 'the pause is backdated to the hide');
  P.sent = body.at + body.add.length;
  P.now += 4e3;
  P.pm = (await D('dr-m3', { action: 'resume', game: 'drop', day: P.day }, P.now)).pm;
  assert.ok(Math.abs(P.tick() - k0) <= 1, 'RESUME: the board is exactly where it hid');
  await P.play(10 * 60e3);
  assert.ok(P.run.over);
  await P.send();
  const f = await D('dr-m3', { action: 'finish', game: 'drop', day: P.day }, P.now + 500);
  assert.equal(f.score, scoreOf(P.run.k * TICK, P.run.eng.lines));
  assert.ok(P.run.k * TICK > 55e3, 'the run went on past the hide');
});

test('PFIX-3 — A REFUSED FINISH over /api (S3): a HOLE in the stored log → scored at the last event before it (never the unproven rest); an honest run is untouched (no rf)', async () => {
  await ensure('dr-s3', 'DropSthree');
  const pid = await pidOf('dr-s3');
  const s = await D('dr-s3', { action: 'start', game: 'drop' }, NOW + 50 * 60e3);
  const P = phone('dr-s3', s);
  P.now = s.run.go;
  await P.play(10 * 60e3);
  assert.ok(P.run.over);
  await P.send();
  const chunks = await val(`dly/drop/${P.day}/l/${pid}`);
  const keys = Object.keys(chunks).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  assert.ok(keys.length >= 3, `${keys.length} chunks`);
  await ref(`dly/drop/${P.day}/l/${pid}/${keys[1]}`).remove();                 // (the hole FABLE REVIEW 2 made with a shorter chunk over a longer one)
  const f = await D('dr-s3', { action: 'finish', game: 'drop', day: P.day }, P.now + 500);
  assert.equal(f.rf, true);
  const t = Math.floor(f.score / 1000) / 10, full = P.run.k * TICK / 1000;
  assert.ok(t > 15 && t <= 31 && t < full, `scored at the last event before the hole: ${t.toFixed(1)} s of a ${full.toFixed(1)} s run`);
  assert.equal((await val(`dly/drop/${P.day}/p/${pid}`)).rf, 'log_missing');
  assert.ok(f.outcome && f.counted, 'it counts like any finish (the streak, the XP, the points of the time it could prove)');
  // … and an honest run carries no mark
  const cal = await pidOf('dr-cal');
  assert.equal((await val(`dly/drop/${streakDay(NOW)}/p/${cal}`)).rf, undefined);
  const tc = await D('dr-cal', { action: 'today' }, NOW + 55 * 60e3);
  assert.equal(tc.rf, undefined);
});

test('FIXES R2 — TAP A TICKET: `ended` for THE DROP = the final board + the time + the lines (the share\'s replay, junk SOLID) — never its log; refused mid-run', async () => {
  await ensure('dr-tk', 'DropTik');
  const s = await D('dr-tk', { action: 'start', game: 'drop' }, NOW + 60e3);
  const P = phone('dr-tk', s);
  P.now = s.run.go;
  await P.play(20e3);
  await rejects(D('dr-tk', { action: 'ended', game: 'drop' }, P.now), 409, 'not_finished');
  await P.play(10 * 60e3);
  await P.send();
  const f = await D('dr-tk', { action: 'finish', game: 'drop', day: P.day }, P.now + 500);
  const r = await D('dr-tk', { action: 'ended', game: 'drop' }, P.now + 900);
  assert.equal(r.done, f.score);
  assert.ok(r.run && typeof r.run.b === 'string' && r.run.t > 0 && r.run.ln >= 0, `the end view: ${JSON.stringify(r.run).slice(0, 120)}`);
  assert.equal(r.run.log, undefined, 'never the log'); assert.equal(r.run.seed, undefined, 'never the seed');
});
