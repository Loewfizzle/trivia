// HIGH RISE DAILY A — THE HIGH RISE DAILY, THE SERVER HALF on the emulators (/api, no browser; docs/highrise.md "THE DAILY"):
//   start → the tap chunks on the leg's proof node (server-stamped — written here as the database would stamp them) → a HOLD (a hidden page's
//   next start: the leg closed, the slab's entry from what the SERVER has, a new leg) → finish: the server's floors = the phone's · refused:
//   a 2nd run, a 4th hold, a chunk after FIN, a chunk from another day · the close scores an abandoned run · DAILY POINTS · DAILY BEST ·
//   THE ROOM WINS' free hold · forged chunks · THE PRUNE.
//   cd tests/integration && node --test daily-highrise.test.mjs        (the emulators running — its OWN file: it opens the OFF row)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.MATCH_GAP_MS = '20000';
process.env.ADMIN_PIDS = '';
process.env.BOARD_MIN_MATCHES = '1';
process.env.DAILY_TEST = '1';
process.env.DAILY_TEST_OFF = 'highrise';     // (HIGH RISE's daily row ships OFF — opened here only, on the emulators)

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { dailyAction, settleRun, forgetPids } from '../../api/daily.js';
import { clearSwitchCache, forgetPicks, loadDailies } from '../../api/_lib/dailies.js';
import { forgetHrDays, HIGHRISE_DAILY } from '../../api/_lib/highrise-daily.js';
import { sweepRuns, forgetSwept, forgetClosed } from '../../api/_lib/daily-close.js';
import { todaysDailies } from '../../js/core/daily.js';
import { dayStartAt, dayNum, dayOf } from '../../js/core/streak.js';
import { createRun, stepTo, tap, hold, isOver, resultOf, endBy } from '../../js/games/highrise/engine.js';
import { gaussBot } from '../../js/games/highrise/bot.js';
import { packFrom } from '../../js/games/highrise/proof.js';
import { TICK_HZ } from '../../js/games/highrise/tuning.js';
import { LEAD_MS, HOLDS, standAfter, hrScore, hrFloors, legEnd } from '../../js/games/highrise/held.js';
import { dailyPoints } from '../../js/core/daily-points.js';

const NOW = Date.UTC(2026, 10, 21, 18, 0, 0);   // Sat Nov 21 2026, 1 pm Eastern
const DAY = 86_400_000, WEEK_AGO = NOW - 30 * DAY;
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'dly', 'dsched', 'pcount', 'streak', 'progress', 'pfr', 'seats', 'dsecret'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); forgetPicks(); forgetHrDays(); clearSwitchCache(); loadDailies(); forgetClosed(); forgetSwept(); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = WEEK_AGO) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
const D = (uid, body, at) => dailyAction(uid, body, at);
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} ${e.code} (${e.message})`); if (code) assert.equal(e.code, code); return e; }
  assert.fail(`expected ${status} ${code}`);
};
const pidOf = uid => val(`uids/${uid}`);
const msOf = ticks => Math.round(ticks * 1000 / TICK_HZ);

/**
 * A PHONE playing ONE LEG: from the server's answer (the seed, the log so far, the leg's GO + tick T) the run rebuilt (held.js#standAfter —
 * the phone's own rebuild), then a bot plays on; each tap's chunk uploaded the moment it lands (stamped GO + its local time + lag — what the
 * database's server timestamp would say). floors = stop after this many more floors (the page hidden there); lose = the LAST tap's chunk
 * never lands (hidden right after it). → { run (the phone's), end (the server time it stopped), taps (play ticks) }
 */
async function playLeg(answer, { sigma = 25, floors = Infinity, lose = false, lag = 120, warp = 1, botSeed = 'b' } = {}) {
  const { seed, go, t: T, path, ev } = answer.run;
  const run = standAfter(seed, ev), bot = gaussBot({ sigmaMs: sigma, seed: `${botSeed}:${answer.run.leg}` }), taps = [];
  const f0 = run.floor;
  while (!isOver(run) && run.floor - f0 < floors) {
    stepTo(run, run.s0);
    if (run.st !== 'slide') break;
    const t = bot(run);
    if (!tap(run, t)) break;
    taps.push(t);
  }
  const patch = {};
  const send = lose ? taps.slice(0, -1) : taps;
  send.forEach((t, k) => { patch[`${path}/c/${k}`] = { s: packFrom(send.map(x => x - T), k, k + 1), at: go + Math.round(msOf(t - T) * warp) + lag }; });
  if (Object.keys(patch).length) await ref('/').update(patch);
  const last = taps.length ? taps[taps.length - 1] : T;
  return { run, taps, end: go + msOf(last - T) + lag + 50, endAll: go + msOf((isOver(run) ? run.end : last) - T) + lag + 400 };
}
/** the phone's end of a leg: `e` = the server's time (the rules: once, inside the leg's window) */
const writeEnd = (path, at) => ref(`${path}/e`).set(at);

test('HIGH RISE\'s daily opens only through the test opener (its row ships OFF); START = ONE SHOT: the seed from THE DAILY SECRET, the server\'s GO, leg 0 opened', async () => {
  assert.ok(todaysDailies().includes('highrise'), 'opened by DAILY_TEST_OFF on the emulators');
  await ensure('hd-ann', 'HiAnn');
  const s = await D('hd-ann', { action: 'start', game: 'highrise' }, NOW);
  assert.ok(s.run && /^h\d+$/.test(s.run.seed), 'a seed (the HMAC of THE DAILY SECRET)');
  assert.equal(s.run.go, NOW + LEAD_MS, 'tick 0 = the start + the 3 · 2 · 1 (the SERVER\'s clock)');
  assert.equal(s.run.z, legEnd(s.run.go, 0));
  assert.deepEqual([s.run.leg, s.run.t, s.run.left, s.run.ev], [0, 0, HOLDS, []]);
  assert.equal(s.run.path, `dly/highrise/${s.day}/w/hd-ann/0`);
  assert.deepEqual(await val(s.run.path), { go: s.run.go, z: s.run.z, p: await pidOf('hd-ann') }, 'the leg node opened by the SERVER (go + z + its profile — THE FIX PASS S5)');
  await ensure('hd-bob', 'HiBob');
  const b = await D('hd-bob', { action: 'start', game: 'highrise' }, NOW + 5000);
  assert.equal(b.run.seed, s.run.seed, 'everyone gets the same course');
});

test('A FULL RUN: start → the tap chunks → finish: the SERVER\'s floors = the phone\'s; the streak + XP once; DAILY POINTS + DAILY BEST; a 2nd run refused (start answers the day\'s score)', async () => {
  const uid = 'hd-cal'; await ensure(uid, 'HiCal');
  const pid = await pidOf(uid);
  const s = await D(uid, { action: 'start', game: 'highrise' }, NOW + 60e3);
  const p = await playLeg(s, { sigma: 25, botSeed: 'cal' });
  await writeEnd(s.run.path, p.endAll);
  const f = await D(uid, { action: 'finish', game: 'highrise' }, p.endAll + 100);
  const L = resultOf(p.run);
  assert.equal(f.score, hrScore(L.floor, L.perfects, L.tick), `the server's replay = the phone's run (${L.floor} floors, ${L.perfects} perfects)`);
  assert.equal(f.counted, true); assert.ok(f.outcome && f.outcome.xp.total > 0, 'the XP, once');
  assert.equal(f.first, true, 'DAILY BEST: the first ever');
  assert.equal(await val(`pstats/${pid}/dp/d/${s.day}/g/highrise`), dailyPoints('highrise', f.score), 'DAILY POINTS from the one table');
  assert.equal((await val(`pstats/${pid}/db/highrise`)).s, f.score, 'DAILY BEST = the server-kept best');
  const rec = await val(`dly/highrise/${s.day}/p/${pid}`);
  assert.equal(rec.f, L.floor); assert.equal(rec.o, 'fin'); assert.ok(rec.e);
  // ONE SHOT: the next start answers the day's score, no run
  const again = await D(uid, { action: 'start', game: 'highrise' }, p.endAll + 5000);
  assert.equal(again.done, f.score); assert.equal(again.run, null);
  const f2 = await D(uid, { action: 'finish', game: 'highrise' }, p.endAll + 6000);
  assert.equal(f2.score, f.score); assert.equal(f2.again, true, 'finish again: idempotent');
  // a chunk after FIN never counts (the rules refuse it on the phone — the admin write here: the server never reads past the end either)
  // `ended` (TAP A TICKET): the judge's own numbers
  const e = await D(uid, { action: 'ended', game: 'highrise' }, p.endAll + 7000);
  assert.equal(e.run.f, L.floor); assert.equal(e.run.p, L.perfects);
  // SHARE TODAY's inputs (spoiler-free)
  const t = await D(uid, { action: 'today', share: true }, p.endAll + 8000);
  const sh = t.share.highrise;
  assert.equal(sh.f, L.floor); assert.equal(sh.w.length, L.floor); assert.equal(sh.pf.reduce((a, b) => a + b, 0), L.perfects);
  assert.ok(!('seed' in sh) && !('ev' in sh), 'no seed, no tap');
  assert.equal(t.mine.highrise, f.score); assert.ok(t.best.highrise && t.best.highrise.best.s === f.score);
  // EVERYONE ON SCORES: the counted finish in the day's list (a public face, the score once you have played)
  const ev = await D(uid, { action: 'every', game: 'highrise' }, p.endAll + 9000);
  assert.ok(ev.every.highrise.played); assert.ok(ev.every.highrise.rows.some(r => r.me && r.v === f.score), 'YOUR row on EVERYONE');
});

test('THE HELD RUN: a hidden page RESUMES (a hold used) — from the last tap the SERVER has (a lost tap is gone); the slab enters at its own entry after the 3 · 2 · 1; 3 holds, then a hide ENDS the run (scored, counted); the floors = the phone\'s', async () => {
  const uid = 'hd-dee'; await ensure(uid, 'HiDee');
  const pid = await pidOf(uid);
  let s = await D(uid, { action: 'start', game: 'highrise' }, NOW + 120e3);
  let p = await playLeg(s, { floors: 12, lose: true, botSeed: 'dee' });   // (hidden right after a tap whose chunk never landed)
  let at = p.end + 30e3;
  const leg0 = s.run.path;
  for (let h = 1; h <= HOLDS; h++) {
    const r = await D(uid, { action: 'start', game: 'highrise' }, at);
    assert.equal(r.run.leg, h, `hold ${h}: a new leg`); assert.equal(r.run.held, 1); assert.equal(r.run.left, HOLDS - h);
    assert.equal(r.run.go, at + LEAD_MS, 'the slab enters after the 3 · 2 · 1');
    const prev = standAfter(r.run.seed, r.run.ev);
    assert.equal(r.run.t, prev.s0, 'the slab that was swinging enters at its own entry (no run time lost)');
    if (h === 1) {
      assert.equal(r.run.ev.length, p.taps.length - 1, 'the tap the server never got is GONE with the hold');
      assert.ok(Number.isFinite(await val(`${leg0}/e`)), 'the old leg CLOSED by the server (no queued chunk lands after the hold)');
    }
    s = r;
    p = await playLeg(s, { floors: 10, botSeed: 'dee' });
    at = p.end + 15e3;
  }
  // the 4th hide: no hold left → the run ENDS at its last server tap (the phone's own FIN never came) — the next start says so + scores it
  const r4 = await D(uid, { action: 'start', game: 'highrise' }, at);
  assert.equal(r4.run, null); assert.equal(r4.ended, 'holds', 'a 4th hold refused: the run ended');
  const rec = await val(`dly/highrise/${s.day}/p/${pid}`);
  // the phone's own view of the whole run (every leg's kept taps) = the server's floors
  const phone = createRun({ seed: s.run.seed, mode: 'daily' });
  for (const x of [...s.run.ev, ...p.taps]) { if (typeof x === 'number') tap(phone, x); else hold(phone, x.t, !!x.r); }
  stepTo(phone, endBy(phone, phone.t));
  assert.equal(rec.f, phone.floor, `the server's floors = the phone's (${phone.floor})`);
  assert.equal(rec.h, HOLDS); assert.equal(rec.o, 'holds');
  assert.equal(r4.done, hrScore(phone.floor, phone.perfects, phone.at)); assert.equal(r4.fin.counted, true);
  assert.equal(await val(`dly/highrise/${s.day}/r/${pid}`), r4.done);
});

test('REFUSED: chunks AHEAD of the clock = no tower (0 floors — still the day\'s one shot) · a chunk on ANOTHER day\'s node never counts · a call naming a day two back = bad_day', async () => {
  const uid = 'hd-eve'; await ensure(uid, 'HiEve');
  const pid = await pidOf(uid);
  const s = await D(uid, { action: 'start', game: 'highrise' }, NOW + 200e3);
  const p = await playLeg(s, { warp: 0.5, botSeed: 'eve' });   // (a sped-up game: the taps reach the server faster than real time)
  await writeEnd(s.run.path, p.endAll);
  const f = await D(uid, { action: 'finish', game: 'highrise' }, p.endAll + 100);
  assert.equal(hrFloors(f.score), 0, 'ahead of the clock: no tower');
  assert.equal((await val(`dly/highrise/${s.day}/p/${pid}`)).bad, 'ahead of the clock');
  // a chunk of YESTERDAY's node never counts today (another day's node — never read for this day's run)
  const uid2 = 'hd-fay'; await ensure(uid2, 'HiFay');
  const pid2 = await pidOf(uid2);
  const s2 = await D(uid2, { action: 'start', game: 'highrise' }, NOW + 300e3);
  const yday = dayOf(dayNum(s2.day) - 1);
  await ref(`dly/highrise/${yday}/w/${uid2}/0/c/0`).set({ s: '1c', at: s2.run.go + 500 });
  const p2 = await playLeg(s2, { sigma: 40, botSeed: 'fay' });
  await writeEnd(s2.run.path, p2.endAll);
  const f2 = await D(uid2, { action: 'finish', game: 'highrise' }, p2.endAll + 100);
  const L2 = resultOf(p2.run);
  assert.equal(f2.score, hrScore(L2.floor, L2.perfects, L2.tick), 'today\'s run = today\'s node only');
  // another day named by the call: refused (A RUN KEEPS ITS OWN DAY — today's or yesterday's only)
  await rejects(D(uid2, { action: 'finish', game: 'highrise', day: dayOf(dayNum(s2.day) - 2) }, p2.endAll + 200), 400, 'bad_day');
  void pid2;
});

test('THE ROOM WINS: a FREE hold (the room really started a game) — uses none of the 3; a fake / lonely room refused (DAILY B: + a game start id, + an OTHER player with a counted profile; ONE free hold a start, never an older start); a pause on a finished run refused', async () => {
  const uid = 'hd-gus'; await ensure(uid, 'HiGus');
  const pid = await pidOf(uid);
  const s = await D(uid, { action: 'start', game: 'highrise' }, NOW + 400e3);
  const p = await playLeg(s, { floors: 8, botSeed: 'gus' });
  await rejects(D(uid, { action: 'pause', game: 'highrise', day: s.day }, p.end + 100), 409, 'no_room_game');
  // (HIGH RISE DAILY B — THE FRESH-EYES REVIEW: a room one player made alone — status 'playing', a second uid with no counted profile, no
  //  game start id — paid 3 free holds; now refused)
  await ref('rooms/HRWX').set({ meta: { hostId: 'host', status: 'playing' }, players: { [uid]: { name: 'GUS', pid }, host: { name: 'HOST' } } });
  await rejects(D(uid, { action: 'pause', game: 'highrise', day: s.day, room: 'HRWX' }, p.end + 150), 409, 'no_room_game');
  const hpid = (await ensure('hd-gus-host', 'HiGusHost'), await pidOf('hd-gus-host'));
  const fresh = (await ensure('hd-gus-alt', 'HiGusAlt', p.end - 1000), await pidOf('hd-gus-alt'));   // (a same-day second account: not a party)
  await ref('rooms/HRWX').set({ meta: { hostId: 'host', status: 'playing', go: { at: p.end + 150, m: 'mhrwx1', g: 'overclock' } }, players: { [uid]: { name: 'GUS', pid }, host: { name: 'ALT', pid: fresh } } });
  await rejects(D(uid, { action: 'pause', game: 'highrise', day: s.day, room: 'HRWX' }, p.end + 180), 409, 'no_room_game');
  await ref('rooms/HRWX/players/host').set({ name: 'HOST', pid: hpid });
  const r = await D(uid, { action: 'pause', game: 'highrise', day: s.day, room: 'HRWX' }, p.end + 200);
  assert.equal(r.held, 1);
  const back = await D(uid, { action: 'start', game: 'highrise' }, p.end + 60e3);
  assert.equal(back.run.leg, 1); assert.equal(back.run.room, 1, 'the free hold'); assert.equal(back.run.left, HOLDS, 'none of the 3 used');
  // ONE free hold a game start: the same start again → room_used; a start from before this leg's GO → room_old
  await rejects(D(uid, { action: 'pause', game: 'highrise', day: s.day, room: 'HRWX' }, back.run.go + 2000), 409, 'room_used');
  await ref('rooms/HRWX/meta/go').set({ at: p.end + 170, m: 'mhrwx0', g: 'overclock' });
  await rejects(D(uid, { action: 'pause', game: 'highrise', day: s.day, room: 'HRWX' }, back.run.go + 2100), 409, 'room_old');
  const p2 = await playLeg(back, { botSeed: 'gus' });
  await writeEnd(back.run.path, p2.endAll);
  const f = await D(uid, { action: 'finish', game: 'highrise' }, p2.endAll + 100);
  assert.equal(f.score, hrScore(p2.run.floor, p2.run.perfects, p2.run.at));
  await rejects(D(uid, { action: 'pause', game: 'highrise', day: s.day, room: 'HRWX' }, p2.endAll + 200), 409, 'finished');
});

test('AN ABANDONED RUN is scored at its last server tap: `today` once it can\'t come back (its own FIN that never reached FINISH · no hold left + quiet) — never while a hold is left; THE DAY\'S CLOSE whatever its state', async () => {
  // (a) the phone's run ended (its leg's `e`) but FINISH never came → `today` scores it
  const a = 'hd-hal'; await ensure(a, 'HiHal');
  const sa = await D(a, { action: 'start', game: 'highrise' }, NOW + 500e3);
  const pa = await playLeg(sa, { botSeed: 'hal' });
  await writeEnd(sa.run.path, pa.endAll);
  const ta = await D(a, { action: 'today' }, pa.endAll + 30e3);
  assert.equal(ta.mine.highrise, hrScore(pa.run.floor, pa.run.perfects, pa.run.at), 'scored by `today`');
  // (a2 — HIGH RISE DAILY B, THE FRESH-EYES REVIEW: the phone's OWN end (the fuse — not in the log) with its FINISH blocked, then a START →
  //  the run ENDED there (scored), never a hold that revives it; the leg keeps saying it was the phone's (no `x` written over its `e`))
  const a2 = 'hd-hap'; await ensure(a2, 'HiHap');
  const s2a = await D(a2, { action: 'start', game: 'highrise' }, NOW + 520e3);
  const p2a = await playLeg(s2a, { floors: 3, botSeed: 'hap' });
  await writeEnd(s2a.run.path, p2a.end + 500);
  const again = await D(a2, { action: 'start', game: 'highrise' }, p2a.end + 4000);
  assert.ok(!again.run && again.done != null, `a START after the phone's own end: the run is over (${JSON.stringify({ run: !!again.run, done: again.done, ended: again.ended })})`);
  assert.equal(again.ended, 'fin');
  assert.equal((await val(s2a.run.path)).x ?? null, null, 'the phone’s end stays the phone’s');
  // (b) hidden mid-run WITH holds left: `today` never scores it — RESUME
  const b = 'hd-ivy'; await ensure(b, 'HiIvy');
  const pidB = await pidOf(b);
  const sb = await D(b, { action: 'start', game: 'highrise' }, NOW + 600e3);
  const pb = await playLeg(sb, { floors: 20, botSeed: 'ivy' });
  const tb = await D(b, { action: 'today' }, pb.end + 120e3);
  assert.equal(tb.mine.highrise, undefined, 'not scored while it can come back');
  // (THE RACE the E2E found: the app's `today` on the return, beside the resume's START that has just CLOSED the leg — the server's close
  //  (`x`) is never the phone's own FIN)
  await ref(`${sb.run.path}/x`).set('hold'); await ref(`${sb.run.path}/e`).set(pb.end + 121e3);
  const tb2 = await D(b, { action: 'today' }, pb.end + 122e3);
  assert.equal(tb2.mine.highrise, undefined, 'a leg the SERVER closed (a hold mid-resume) never ends the run');
  assert.equal(tb.started.highrise, true, 'RESUME on the ticket');
  // THE DAY'S CLOSE (two days on — force): scored at its last server tap
  await sweepRuns({ games: ['highrise'], now: dayStartAt(dayOf(dayNum(sb.day) + 2)) + 3600e3, settle: settleRun });
  const want = createRun({ seed: sb.run.seed, mode: 'daily' }); for (const t of pb.taps) tap(want, t); stepTo(want, endBy(want, want.t));
  assert.equal(await val(`dly/highrise/${sb.day}/r/${pidB}`), hrScore(want.floor, want.perfects, want.at), 'THE DAY\'S CLOSE: the floors to its last server tap');
  assert.equal((await val(`dly/highrise/${sb.day}/p/${pidB}`)).o, 'close');
  // (c) YESTERDAY's held run, not in play after 4 am: its start ends + scores it (a held run's day closed at its 4 am)
  const c = 'hd-jon'; await ensure(c, 'HiJon');
  const sc = await D(c, { action: 'start', game: 'highrise' }, NOW + 700e3);
  const pc = await playLeg(sc, { floors: 15, botSeed: 'jon' });
  const next = dayStartAt(dayOf(dayNum(sc.day) + 1)) + 3600e3;
  const rc = await D(c, { action: 'start', game: 'highrise', day: sc.day }, next);
  assert.equal(rc.day, sc.day, 'the run keeps its own day'); assert.equal(rc.ended, 'close'); assert.equal(rc.run, null);
  assert.equal(hrFloors(rc.done), pc.run.floor);
});

test('THE PRUNE: the leg nodes past 7 days are deleted, the run\'s record + the day\'s scores kept', async () => {
  const day = dayOf(dayNum('d20261121') - 9);
  await ref(`dly/highrise/${day}`).set({ w: { u1: { 0: { go: 1, z: 2 } } }, p: { pX: { f: 3 } }, r: { pX: 300099999 } });
  assert.equal(await HIGHRISE_DAILY.prune({ day, back: 9 }), 1);
  assert.equal(await val(`dly/highrise/${day}/w`), null); assert.ok(await val(`dly/highrise/${day}/p`)); assert.ok(await val(`dly/highrise/${day}/r`));
  assert.equal(await HIGHRISE_DAILY.prune({ day, back: 9 }), 0, 'once');
  assert.equal(await HIGHRISE_DAILY.prune({ day: dayOf(dayNum('d20261121') - 5), back: 5 }), 0, 'a recent day keeps them');
});

// THE FIX PASS — S5 (THE FABLE REVIEW): a SECOND PROFILE on the SAME phone (a restore key: the same uid, another pid) STARTs — the first
// profile's open leg is ENDED + JUDGED from its node as it stands before the path is taken; its next START is the run ended, never a new tower
test('THE FIX PASS — S5: a second profile on the same phone never wipes the open leg — the first run is ended + judged first, ONE SHOT kept', async () => {
  const uid = 'hd-shr';
  await ensure(uid, 'ShareOne');
  const p1 = await pidOf(uid);
  const T0 = NOW + 3 * 3600e3;
  const s1 = await D(uid, { action: 'start', game: 'highrise' }, T0);
  const a = await playLeg(s1, { sigma: 25, floors: 6, botSeed: 'shr1' });
  // the phone switches to ANOTHER profile (its restore key) — the same uid now names pid 2
  await ensure('hd-shr-2', 'ShareTwo');
  const p2 = await pidOf('hd-shr-2');
  await ref(`uids/${uid}`).set(p2); forgetPids();   // (the function's uid → pid memo: a restore re-reads it)
  const s2 = await D(uid, { action: 'start', game: 'highrise' }, a.end + 60e3);
  assert.equal(s2.run.path, s1.run.path, 'the same node path (the device’s uid, leg 0)');
  assert.equal((await val(s2.run.path)).p, p2, 'the node is profile 2’s now');
  const r1 = await val(`dly/highrise/${s1.day}/p/${p1}`);
  assert.ok(r1.e, 'profile 1’s run was ENDED before its node was taken');
  assert.equal(r1.f, a.run.floor, `… and JUDGED from its node as it stood: ${r1.f} floors kept (the phone's ${a.run.floor})`);
  // back on profile 1: its START is the run ended — never a fresh tower from floor 0
  await ref(`uids/${uid}`).set(p1); forgetPids();
  const back = await D(uid, { action: 'start', game: 'highrise' }, a.end + 120e3);
  assert.ok(!back.run || !back.run.go, `ONE SHOT kept: no new leg (${JSON.stringify(back).slice(0, 120)})`);
  await ref(`uids/${uid}`).set(p1);
});

