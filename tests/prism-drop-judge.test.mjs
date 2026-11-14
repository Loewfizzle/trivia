// THE DROP A — Group 2's PURE half (js/games/prism/drop-judge.js): the server's record through a whole run on a fake clock — the checkpoints'
// incremental replay, the finish's whole replay + THE SLOW-MOTION CHECK, a refresh = one of the 3 pauses (backdated to the checkpoint), the
// player pauses' caps, THE ROOM WINS' free pause, a log from the future, a run in slow motion, a lost answer (resync), an abandoned run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDropRun, input, stepTo, replay, TICK, COUNT_MS, scoreOf } from '../js/games/prism/drop.js';
import { act, begin, upload, judgeFinish, joinChunks, abandoned, abandon, dueMs, clockOf, storable, chunkKey, isPaused, PAUSES, PAUSE_MS, CK_MS, SLOW_TOL_MS, MAX_TAIL_MS } from '../js/games/prism/drop-judge.js';
import { dropKey } from '../js/games/prism/bot.js';
import { rngFrom } from '../js/core/rng.js';

const SEED = '123456789';
/** the server: a record + the chunks, a clock */
function server(st = 1_000_000) {
  const S = { now: st, rec: begin(null, { startedAt: st, now: st }), chunks: {} };
  S.calls = 0;
  S.move = (action, body = {}, room = false) => {
    S.calls++;
    // (the stash, as api/_lib/drop.js: the record read first — stored only when the judge would take it, keyed by offset + length; else `ns`)
    if (body.add) { if (storable(S.rec, body, { now: S.now })) S.chunks[chunkKey(body.at, body.add)] = body.add; else body = { ...body, ns: 1 }; }
    const r = act({ action, body, record: S.rec, now: S.now, seed: SEED, room });
    if (r.record) S.rec = r.record;
    return r;
  };
  S.finish = () => judgeFinish(S.rec, joinChunks(S.chunks, S.rec.len), { seed: SEED });
  return S;
}
/** the phone: the run + its sent length, a bot; `speed` < 1 = slow motion */
function phone(S, { speed = 1, every = 80, rnd = rngFrom('p') } = {}) {
  const P = { run: createDropRun(SEED), sent: 0, plan: null, next: 0, pm: 0, go: S.rec.go, paused: false };
  P.tick = () => Math.floor((((S.now - P.go - P.pm) * speed)) / TICK);
  P.frame = () => {
    if (P.paused || P.run.over) return;
    stepTo(P.run, P.tick());
    if (P.run.over) return;
    if (S.now >= P.next) { P.next = S.now + every; const r = dropKey(P.run.eng, P.plan, { rnd }); P.plan = r.plan; if (r.code) input(P.run, r.code); }
  };
  P.body = (extra = {}) => { const b = { at: P.sent, add: P.run.log.slice(P.sent), k: P.run.k, ...(P.run.over ? { fin: 1 } : {}), ...extra }; return b; };
  P.send = (action = 'checkpoint') => { const b = P.body(); const r = S.move(action, b); if (r.resp && !r.resp.resync && !r.refused) P.sent = b.at + b.add.length; return r; };
  return P;
}
/** run the clock: frames of ~16 ms, a checkpoint every CK_MS */
function runFor(S, P, ms, { ck = true } = {}) {
  const until = S.now + ms;
  let nextCk = S.now + CK_MS;
  while (S.now < until && !P.run.over) {
    S.now += 16; P.frame();
    if (ck && S.now >= nextCk) { nextCk += CK_MS; const r = P.send(); if (r.refused) return r; }
  }
  return null;
}

test('A WHOLE RUN: a checkpoint every 30 s (bounded, NEVER replayed) → the final upload → the finish replays the whole log ONCE = the same score; ≲ 30 calls', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go;
  runFor(S, P, 10 * 60_000);
  assert.ok(P.run.over, 'the bot topped out');
  const last = P.send();
  assert.ok(!last.refused, last.refused);
  assert.equal(S.rec.e, 1); assert.equal(S.rec.o, 'fin');
  assert.equal(S.rec.k, P.run.k);
  const mins = P.run.k * TICK / 60_000;
  assert.ok(S.calls <= Math.ceil(mins * 2) + 2 && S.calls <= 30, `${S.calls} uploads for ${mins.toFixed(1)} min of play (the start + the finish on top)`);
  assert.equal(S.rec.sv, undefined, 'no snapshot kept — nothing was replayed on the way');
  const F = S.finish();
  assert.ok(F.score != null, `scored: ${F.refused}`);
  assert.equal(F.score, scoreOf(P.run.k * TICK, P.run.eng.lines));
  assert.ok(F.ms < 200, `the finish's whole replay ${F.ms.toFixed(1)} ms`);
  // once ended, nothing else moves it
  assert.equal(S.move('checkpoint', P.body()).refused, 'done');
});

test('A REFRESH: back at the LATEST checkpoint, the time since a PLAYER PAUSE (one of the 3, backdated) — RESUME continues; no pause left → ended at the checkpoint', () => {
  const S = server(); let P = phone(S);
  S.now = S.rec.go;
  runFor(S, P, 65_000);
  const ckK = S.rec.k, ckT = S.rec.t;
  assert.ok(ckK > 0, 'a checkpoint reached the server');
  S.now += 4000;                                                   // the phone dies 4 s after a checkpoint …
  S.now += 30_000;                                                 // … and comes back 30 s later
  const lost = dueMs(S.rec, S.now) - ckT;                          // (the play since that checkpoint — gone; the time a pause)
  S.rec = begin(S.rec, { startedAt: S.rec.st, now: S.now });
  assert.equal(S.rec.pz.n, 1, 'one of the 3 pauses used');
  assert.equal(S.rec.pz.rf, 1);
  assert.ok(Math.abs(dueMs(S.rec, S.now) - ckT) < 1, 'the clock stands at the checkpoint (never ahead of the board)');
  assert.equal(S.move('checkpoint', { at: S.rec.len, add: '', k: ckK + 10 }).refused, 'paused', 'nothing but a resume while paused');
  // the phone rebuilds from the stored log (the start's answer) and resumes
  const log = joinChunks(S.chunks, S.rec.len);
  const R = replay(log, SEED, { to: S.rec.k });
  assert.ok(R.ok);
  P = phone(S); P.run = R.run; P.run.log = log; P.sent = log.length;
  const r = S.move('resume');
  P.pm = r.resp.pm; P.go = r.resp.go;
  assert.ok(Math.abs(P.tick() - ckK) <= 1, `the phone's clock at the checkpoint (${P.tick()} vs ${ckK})`);
  assert.ok(lost > 34_000 && Math.abs(S.rec.pz.ms - lost) < 50, `the pause = the time since the checkpoint (${S.rec.pz.ms} vs ${lost})`);
  const bad = runFor(S, P, 35_000);
  assert.equal(bad, null, 'the run goes on — its checkpoints accepted');
  if (!S.rec.e) P.send();
  assert.ok(S.rec.k > ckK + 600, 'the run went on past the checkpoint');
  if (S.rec.e) return;   // (the bot topped out in that stretch — the refresh + resume above is what this test is for)
  // two more refreshes use the other two; the 4th ends the run at its last checkpoint
  for (let i = 2; i <= PAUSES; i++) { S.now += 5000; S.rec = begin(S.rec, { startedAt: S.rec.st, now: S.now }); assert.equal(S.rec.pz.n, i); S.move('resume'); }
  const before = S.rec.t;
  S.now += 9000;
  S.rec = begin(S.rec, { startedAt: S.rec.st, now: S.now });
  assert.equal(S.rec.e, 1); assert.equal(S.rec.o, 'abandoned'); assert.equal(S.rec.t, before, 'ended AT its last checkpoint');
  const F = S.finish();
  assert.ok(F.score != null && F.t === before, `scored from the checkpoint — ONE replay there (${F.refused || ''})`);
});

test('PLAYER PAUSES: 3 a run, the board\'s clock stopped (server-timed), a 4th refused; 20 minutes in all — over it the run ends at its checkpoint', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go;
  runFor(S, P, 8000);
  for (let i = 1; i <= PAUSES; i++) {
    const r = P.send('ppause');
    assert.ok(!r.refused, r.refused);
    assert.equal(S.rec.pz.n, i); P.paused = true;
    const k0 = S.rec.k;
    S.now += 60_000;
    assert.ok(Math.abs(dueMs(S.rec, S.now) - S.rec.t) < 200, 'the clock stands still while paused');
    const back = S.move('resume');
    P.pm = back.resp.pm; P.paused = false;
    assert.ok(Math.abs(P.tick() - k0) < 30, 'back where it paused');
    runFor(S, P, 3000);
  }
  assert.equal(P.send('ppause').refused, undefined, 'a 4th with a chunk: the chunk lands …');
  assert.equal(S.rec.pz.at, undefined, '… but no pause opens');
  assert.equal(S.move('ppause', {}).refused, 'pause_limit');
  // the 20 minutes: a fresh run, one long pause
  const S2 = server(); const P2 = phone(S2);
  S2.now = S2.rec.go; runFor(S2, P2, 7000);
  P2.send('ppause');
  S2.now += PAUSE_MS + 1000;
  assert.ok(abandoned(S2.rec, S2.now), 'over the 20 minutes: abandoned');
  const r = S2.move('resume');
  assert.equal(S2.rec.e, 1); assert.equal(S2.rec.o, 'pause_over'); assert.equal(r.resp.e, 1);
  assert.ok(S2.finish().score != null);
});

test('THE ROOM WINS: a room pause uses none of the 3 (only with the room checked); a resume closes it', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go; runFor(S, P, 7000);
  assert.equal(S.move('pause', P.body(), false).refused, 'no_room_game');
  const r = P.send('pause'); void r;
  const r2 = S.move('pause', P.body(), true);
  assert.ok(!r2.refused);
  assert.equal(S.rec.pz.kd, 'r'); assert.equal(S.rec.pz.n || 0, 0, 'none of the 3');
  S.now += 5 * 60_000;
  S.move('resume');
  assert.ok(Math.abs(S.rec.rz - 5 * 60_000) < 100); assert.equal(S.rec.pz.n || 0, 0);
  assert.equal(clockOf(S.rec, S.now).left, PAUSES);
});

test('THE SLOW-MOTION CHECK: a log ahead of the clock is refused; a run played in slow motion (or a finish arriving late) ends at its real-time bound', () => {
  // ahead: a log built faster than real time (a bot's 60 s of play 10 s after the start)
  const S = server(); const P = phone(S);
  S.now = S.rec.go;
  const fake = createDropRun(SEED); let plan = null; const rnd = rngFrom('f');
  for (let k = 0; k < 7200 && !fake.over; k += 6) { stepTo(fake, k); const x = dropKey(fake.eng, plan, { rnd }); plan = x.plan; if (x.code) input(fake, x.code); }
  S.now += 10_000;
  assert.equal(S.move('checkpoint', { at: 0, add: fake.log, k: fake.k }).refused, 'too_early');
  // slow motion: the phone's run at half speed — once it falls SLOW_TOL behind, the run ends at the last checkpoint + MAX_TAIL of play
  const S2 = server(); const P2 = phone(S2, { speed: 0.5 });
  S2.now = S2.rec.go;
  let res = null;
  for (let i = 0; i < 400 && !S2.rec.e; i++) { res = runFor(S2, P2, CK_MS); if (res) break; }
  assert.equal(S2.rec.e, 1); assert.equal(S2.rec.o, 'late');
  assert.ok(S2.rec.t <= SLOW_TOL_MS * 2 + MAX_TAIL_MS + CK_MS, `the slowed run keeps little (${(S2.rec.t / 1000).toFixed(1)} s)`);
  const F = S2.finish();
  assert.ok(F.score != null, `a late run still scores its real-time part (${F.refused || ''})`);
  void P;
});

test('A LOST ANSWER (resync): an upload at the wrong offset is answered with the server\'s length — the phone resends from there', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go; runFor(S, P, 35_000);
  assert.ok(S.rec.len > 0, 'a checkpoint landed');
  const r = S.move('checkpoint', { at: 0, add: 'C', k: P.run.k });
  assert.equal(r.resp.resync, true); assert.equal(r.resp.len, S.rec.len);
  assert.equal(r.record, null, 'nothing written');
  const ok = P.send();
  assert.ok(!ok.refused && !ok.resp.resync);
});

test('A TAMPERED LOG: a checkpoint is only bounded (a char no log has → refused at once); a forged lock passes the checkpoint but THE RE-PLAY CHECK at the finish refuses the run', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go; runFor(S, P, 35_000);
  for (let i = 0; i < 200; i++) { S.now += 16; P.frame(); }
  const b = P.body();
  const keep = S.rec;
  assert.equal(S.move('checkpoint', { ...b, add: b.add + 'Q' }).refused, 'bad_log', 'a char no log has');
  assert.equal(S.rec, keep, 'the record untouched');
  const forged = { ...b, add: '1K' + b.add };
  const r = S.move('checkpoint', forged);
  assert.ok(!r.refused, 'a checkpoint is NOT replayed: the forged chunk is stored');
  S.rec = abandon(S.rec, S.now);
  const F = S.finish();
  assert.ok(F.refused, `the one replay refuses it (${F.refused})`);
  // the stash can't help a forger: the finish only reads the chunks the CHECKED length covers
  assert.equal(joinChunks({ 0: 'xx' }, 5), null);
});

test('ABANDONED: silent past every budget (or no resume possible) → the close ends it at its last checkpoint; a run with pauses left is not', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go; runFor(S, P, 35_000);
  assert.ok(S.rec.k > 0);
  assert.equal(abandoned(S.rec, S.now + 60_000), false, 'pauses left, inside the 20 minutes: it can still come back');
  assert.equal(abandoned(S.rec, S.now + PAUSE_MS + 60_000), true, 'past the 20 minutes');
  const A = abandon(S.rec, S.now + PAUSE_MS + 60_000);
  assert.equal(A.o, 'abandoned'); assert.equal(A.t, S.rec.t);
  const F = judgeFinish(A, joinChunks(S.chunks, A.len), { seed: SEED });
  assert.ok(F.score != null && F.t === S.rec.t, `scored at its last checkpoint by ONE replay (${F.refused || ''})`);
  void COUNT_MS; void upload;
});

test('THE DROP B — AWAY WITH NO PAUSE LEFT (`aw`): checked on the server\'s clock — a short hide goes on; past SLOW_TOL_MS the run ends at the checkpoint + MAX_TAIL_MS and scores', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go;
  runFor(S, P, 8000, { ck: false });
  P.send();
  const t0 = S.rec.t, k0 = P.run.k;
  // a claim with no real gap: nothing ends
  S.now += 5000; stepTo(P.run, P.tick());
  let r = S.move('checkpoint', P.body({ aw: 1 }));
  assert.ok(!r.refused && !S.rec.e, 'a short hide with `aw` is just a checkpoint');
  P.sent = S.rec.len;
  const t1 = S.rec.t, k1 = P.run.k;
  // away 30 s: the phone steps 15 s of play (no input) and says aw → ended late at the checkpoint + 15 s
  S.now += 30_000;
  stepTo(P.run, Math.min(P.tick(), k1 + Math.round(MAX_TAIL_MS / TICK)));
  r = S.move('checkpoint', P.body({ aw: 1 }));
  assert.equal(S.rec.e, 1); assert.equal(S.rec.o, 'late');
  assert.ok(P.run.over || Math.abs(S.rec.t - (t1 + MAX_TAIL_MS)) <= TICK, `ended at the checkpoint + 15 s (${S.rec.t} vs ${t1 + MAX_TAIL_MS})`);
  const F = S.finish();
  assert.ok(F.score != null, `scored (${F.refused || F.score})`);
  void t0; void k0;
});

// ---------------------------------------------------------------- PFIX-3 — NO HONEST RUN LOST (FABLE REVIEW 2: M1, M2, M3, S1, S2)
test('PFIX-3 — TWO UPLOADS FROM ONE OFFSET (M2 order A / S2): the checkpoint lands first, the pause\'s LONGER chunk from the same offset is in step — its tail taken, the pause granted at the BOARD\'s tick', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go; runFor(S, P, 35_000);
  for (let i = 0; i < 300; i++) { S.now += 16; P.frame(); }
  const ck = P.body();                                              // the checkpoint in flight …
  for (let i = 0; i < 40; i++) { S.now += 16; P.frame(); }
  const pz = P.body();                                              // … and the hide's pause, built later from the SAME offset
  assert.equal(pz.at, ck.at); assert.ok(pz.add.length >= ck.add.length && pz.k > ck.k);
  S.now += 200;
  assert.ok(!S.move('checkpoint', ck).refused);
  const r = S.move('ppause', pz);
  assert.ok(!r.refused && !r.resp.resync, 'in step: one growing log');
  assert.ok(r.resp.pa != null && isPaused(S.rec), 'the pause is granted');
  assert.equal(S.rec.len, pz.at + pz.add.length, 'the tail past the checked length was taken');
  assert.equal(S.rec.k, pz.k);
  assert.equal(S.rec.pz.n, 1);
  assert.ok(Math.abs(dueMs(S.rec, S.now) - pz.k * TICK) < 1, 'the clock stands at the board\'s tick (the pause backdated by the call\'s own time)');
  assert.equal(joinChunks(S.chunks, S.rec.len), P.run.log.slice(0, S.rec.len), 'the stored log has no hole');
  // the same chunk again from the old offset (THE ROOM WINS' pause after the close's checkpoint — S2): nothing new, still in step
  const S2 = server(); const P2 = phone(S2);
  S2.now = S2.rec.go; runFor(S2, P2, 9000, { ck: false });
  const b = P2.body();
  assert.ok(!S2.move('checkpoint', b).refused);
  const r2 = S2.move('pause', b, true);
  assert.ok(!r2.refused && r2.resp.pa != null && S2.rec.pz.kd === 'r', 'the room\'s pause is granted though its chunk had already landed');
  assert.equal(S2.rec.pz.n || 0, 0, 'free');
});

test('PFIX-3 — A PAUSE NEVER WAITS ON ITS CHUNK (M2): an out-of-step ppause / pause STILL pauses — `resync: true` + the pause\'s clock, nothing of the chunk counted', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go; runFor(S, P, 35_000);
  const len = S.rec.len, k = S.rec.k;
  // an OLDER body (shorter, behind the record) — it brings nothing in step
  const r = S.move('ppause', { at: 0, add: P.run.log.slice(0, 3), k: 5 });
  assert.ok(!r.refused);
  assert.equal(r.resp.resync, true); assert.equal(r.resp.len, len);
  assert.ok(r.resp.pa != null && isPaused(S.rec), 'paused all the same');
  assert.equal(S.rec.len, len); assert.equal(S.rec.k, k); assert.equal(S.rec.pz.n, 1);
  assert.equal(r.resp.left, PAUSES - 1);
  // a checkpoint out of step is still only a resync (no pause, nothing written)
  const S2 = server(); const P2 = phone(S2);
  S2.now = S2.rec.go; runFor(S2, P2, 35_000);
  const c = S2.move('checkpoint', { at: 0, add: 'C', k: 3 });
  assert.equal(c.resp.resync, true); assert.equal(c.record, null);
  // THE ROOM WINS, out of step: granted, free
  const rr = S2.move('pause', { at: 0, add: 'C', k: 3 }, true);
  assert.equal(rr.resp.resync, true); assert.equal(S2.rec.pz.kd, 'r'); assert.equal(S2.rec.pz.n || 0, 0);
  // `ns` (the api could not store the chunk): never counted — a resync
  const S3 = server(); const P3 = phone(S3);
  S3.now = S3.rec.go; runFor(S3, P3, 9000, { ck: false });
  const u = upload(S3.rec, { ...P3.body(), ns: 1 }, { now: S3.now });
  assert.equal(u.resync, true);
});

test('PFIX-3 — THE LOST HIDE (M3): a ppause that arrives far behind the clock with a pause left = a BACKDATED pause (one of the 3) — the run goes on from the board\'s tick; none left → late, as before', () => {
  const S = server(); const P = phone(S);
  S.now = S.rec.go;
  runFor(S, P, 55_000);
  const k0 = P.run.k, body = P.body();                              // the page hides at 55 s — the hide's call is LOST
  assert.ok(body.add.length > 0 && S.rec.k < k0);
  S.now += 60_000;                                                  // asked again on the return, 60 s later
  const r = S.move('ppause', body);
  assert.ok(!r.refused, r.refused);
  assert.ok(!S.rec.e, 'the run is NOT ended late');
  assert.equal(S.rec.pz.n, 1, 'one of the 3');
  assert.equal(S.rec.k, k0); assert.equal(S.rec.len, body.at + body.add.length, 'the hide\'s chunk is in');
  assert.ok(Math.abs(S.rec.pz.at - (S.now - 60_000)) < 20, `backdated to the hide (${S.now - S.rec.pz.at} ms back)`);
  assert.ok(Math.abs(dueMs(S.rec, S.now) - k0 * TICK) < 1, 'the clock stands at the board');
  P.sent = S.rec.len; P.paused = true;
  S.now += 5000;
  const back = S.move('resume');
  P.pm = back.resp.pm; P.paused = false;
  assert.ok(Math.abs(P.tick() - k0) <= 1, 'RESUME: the board is exactly where it hid — nothing fast-forwards');
  assert.ok(Math.abs(S.rec.pz.ms - 65_000) < 30, 'the whole time away is pause time (inside the 20 minutes)');
  assert.equal(runFor(S, P, 20_000), null, 'the run goes on');
  if (!S.rec.e) P.send();
  if (!S.rec.e) { S.rec = abandon(S.rec, S.now); }
  const F = S.finish();
  assert.ok(F.score != null && F.t >= k0 * TICK, `scored past the hide (${F.refused || F.t})`);
  // no pause left: the same late call ends the run at its real-time bound (the old rule)
  const S2 = server(); const P2 = phone(S2);
  S2.now = S2.rec.go; runFor(S2, P2, 8000, { ck: false });
  for (let i = 1; i <= PAUSES; i++) { P2.send('ppause'); S2.now += 1000; const b = S2.move('resume'); P2.pm = b.resp.pm; runFor(S2, P2, 2000, { ck: false }); }
  P2.send();
  const t2 = S2.rec.t, b2 = (runFor(S2, P2, 3000, { ck: false }), P2.body());
  S2.now += 60_000;
  const r2 = S2.move('ppause', b2);
  assert.equal(S2.rec.e, 1); assert.equal(S2.rec.o, 'late'); assert.equal(r2.resp.e, 1);
  assert.ok(S2.rec.t <= t2 + MAX_TAIL_MS + TICK);
  // over the 20 minutes: not backdated — late
  const S3 = server(); const P3 = phone(S3);
  S3.now = S3.rec.go; runFor(S3, P3, 8000, { ck: false });
  const b3 = P3.body();
  S3.now += PAUSE_MS + 5000;
  S3.move('ppause', b3);
  assert.equal(S3.rec.e, 1); assert.equal(S3.rec.o, 'late');
});

test('PFIX-3 — THE CHUNK STORE (M2 order B, S1): keyed by offset + length — a SHORTER chunk never replaces a longer one; stored only for a run in flight the judge would take; the join reads both key forms', () => {
  // the join: two chunks at ONE offset → the furthest-reaching wins; the old `{offset}` keys still read
  assert.equal(joinChunks({ '0_5': 'LLRRC', '0_3': 'LLR', 5: 'XK' }, 7), 'LLRRCXK');
  assert.equal(joinChunks({ 0: 'LLR', '3_4': 'RCXK' }, 7), 'LLRRCXK');
  assert.equal(joinChunks({ '0_3': 'LLR', '5_2': 'XK' }, 7), null, 'a hole is a hole');
  assert.equal(chunkKey(12, 'LLR'), '12_3');
  // order B: the pause (longer) lands first, then the checkpoint in flight (shorter, the same offset)
  const S = server(); const P = phone(S);
  S.now = S.rec.go; runFor(S, P, 35_000);
  for (let i = 0; i < 300; i++) { S.now += 16; P.frame(); }
  const ck = P.body();
  for (let i = 0; i < 40; i++) { S.now += 16; P.frame(); }
  const pz = P.body();
  assert.ok(pz.add.length > ck.add.length, 'the pause carries more');
  assert.ok(!S.move('ppause', pz).refused);
  const keys = Object.keys(S.chunks).length;
  assert.equal(S.move('checkpoint', ck).refused, 'paused');
  assert.equal(Object.keys(S.chunks).length, keys, 'the late, shorter chunk is NOT stored');
  assert.equal(joinChunks(S.chunks, S.rec.len), P.run.log.slice(0, S.rec.len), 'the log has no hole');
  P.sent = S.rec.len; P.paused = true;
  S.now += 3000; const b = S.move('resume'); P.pm = b.resp.pm; P.paused = false;
  // … and the same without a pause (a checkpoint that timed out on the phone, landing after its longer retry — S1b)
  for (let i = 0; i < 200; i++) { S.now += 16; P.frame(); }
  const short = P.body();
  for (let i = 0; i < 200; i++) { S.now += 16; P.frame(); }
  assert.ok(!P.send().refused);
  const z = S.move('checkpoint', short);
  assert.ok(z.resp.resync || z.record == null, 'the zombie brings nothing');
  runFor(S, P, 10 * 60_000);
  assert.ok(P.run.over);
  P.send();
  const F = S.finish();
  assert.ok(F.score != null, `the finish still scores (${F.refused || ''})`);
  assert.equal(F.score, scoreOf(P.run.k * TICK, P.run.eng.lines));
  // storable: the gate
  const S2 = server(); const P2 = phone(S2);
  S2.now = S2.rec.go; runFor(S2, P2, 9000, { ck: false });
  const body = P2.body();
  assert.equal(storable(null, body, { now: S2.now }), false, 'no run → nothing stored');
  assert.equal(storable(S2.rec, body, { now: S2.now }), true);
  assert.equal(storable(S2.rec, { ...body, at: 5 }, { now: S2.now }), false, 'past the checked length');
  assert.equal(storable(S2.rec, { ...body, add: '' }, { now: S2.now }), false);
  assert.equal(storable(S2.rec, { ...body, k: body.k + 120 * 30 }, { now: S2.now }), false, 'ahead of the clock');
  assert.equal(storable(S2.rec, { ...body, add: body.add + 'Q' }, { now: S2.now }), false, 'not a log');
  assert.equal(storable({ ...S2.rec, e: 1, o: 'fin' }, body, { now: S2.now }), false, 'an ended run');
  assert.equal(storable({ ...S2.rec, pz: { n: 1, ms: 0, at: S2.now, kd: 'p' } }, body, { now: S2.now }), false, 'a paused run');
  S2.move('checkpoint', body);
  assert.equal(storable(S2.rec, body, { now: S2.now }), false, 'nothing new');
});
