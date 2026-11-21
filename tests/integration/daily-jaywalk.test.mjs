// DAILY A — JAYWALK's DAILY, THE SERVER HALF on the emulators (/api, no browser; docs/jaywalk.md "THE DAILY") + DAILY BEST (all four dailies):
//   start → the hop chunks on the proof node (server-stamped — written here as the database would stamp them) → finish: 3 tries, the BEST
//   counts, a 4th refused · the FIRST closed try counts the day (the streak, the XP once), a better one RAISES the score + the points + the
//   lists · an unfinished try scored on the next start / `today` (once it can't be in play) / THE DAY'S CLOSE · THE ROOM WINS ends a try ·
//   forged chunks (ahead of the clock / past the window / after FINISH) never count · a slowed log CUT, a dropped signal accepted ·
//   DAILY BEST on the finish + `today` · THE DAILY BEST BACKFILL (safe twice) · THE PRUNE of the proof nodes.
//   cd tests/integration && node --test daily-jaywalk.test.mjs        (the emulators running — its OWN file: it opens the OFF row)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.MATCH_GAP_MS = '20000';
process.env.ADMIN_PIDS = '';
process.env.BOARD_MIN_MATCHES = '1';
process.env.DAILY_TEST = '1';
process.env.DAILY_TEST_OFF = 'jaywalk';     // (JAYWALK's row ships OFF — opened here only, on the emulators)

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { dailyAction, settleRun } from '../../api/daily.js';
import { clearSwitchCache, forgetPicks, loadDailies } from '../../api/_lib/dailies.js';
import { forgetJwDays, JAYWALK_DAILY } from '../../api/_lib/jaywalk-daily.js';
import { sweepRuns, forgetSwept, forgetClosed } from '../../api/_lib/daily-close.js';
import { bestBackfill } from '../../api/_lib/daily-best-fill.js';
import { todaysDailies } from '../../js/core/daily.js';
import { streakDay, dayStartAt, dayNum, dayOf } from '../../js/core/streak.js';
import { createRun, step, isOver, resultOf, canLog } from '../../js/games/jaywalk/engine.js';
import { createCourse } from '../../js/games/jaywalk/course.js';
import { greedyBot } from '../../js/games/jaywalk/bot.js';
import { packLog } from '../../js/games/jaywalk/replay.js';
import { TICK_HZ } from '../../js/games/jaywalk/tuning.js';
import { jwScore, jwLanes } from '../../js/core/daily-best.js';
import { dailyPoints } from '../../js/core/daily-points.js';
import { TRIES, LEAD_MS, CAP_MS, GRACE_MS, QUIET_MS } from '../../api/_lib/jaywalk-tries.js';
import { dayFromTries } from '../../js/core/jw-times.js';
import { boardId } from '../../api/_lib/lb.js';

const NOW = Date.UTC(2026, 10, 18, 18, 0, 0);   // Wed Nov 18 2026, 1 pm Eastern
const DAY = 86_400_000, WEEK_AGO = NOW - 30 * DAY;
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'dly', 'dsched', 'pcount', 'streak', 'progress', 'pfr', 'seats', 'dsecret'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); forgetPicks(); forgetJwDays(); clearSwitchCache(); loadDailies(); forgetClosed(); forgetSwept(); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = WEEK_AGO) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
const D = (uid, body, at) => dailyAction(uid, body, at);
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} ${e.code} (${e.message})`); if (code) assert.equal(e.code, code); return e; }
  assert.fail(`expected ${status} ${code}`);
};
const pidOf = uid => val(`uids/${uid}`);

/**
 * A PHONE playing a try: the greedy bot (lazy = a weaker player) on the day's course, its hops uploaded to the proof node every second of its
 * own clock — each chunk stamped `go + its time + lag` (what the database's server timestamp would say). stopAt = a tick to stop at (a refresh /
 * hidden / THE ROOM WINS mid-run); warp = the chunks' times stretched (a slowed game); → { live, end (the server time the run ended / stopped) }
 */
async function playTry(start, { lazy = false, stopAt = null, lag = 300, warp = 1, botSeed = 'b' } = {}) {
  const { seed, go, path } = start.run;
  const run = createRun({ seed, mode: 'daily' }), course = createCourse(seed), bot = greedyBot({ seed: botSeed, lazy }), log = [];
  while (!isOver(run) && (stopAt == null || run.t < stopAt)) {
    let d = (run.t % (lazy ? 7 : 1) === 0 ? bot(run, course) : '') || '';
    if (d && !canLog(log, run.t, d, 'daily')) d = '';
    if (d) log.push({ t: run.t, d });
    step(run, course, d);
  }
  const per = TICK_HZ, patch = {};
  let from = 0, k = 0;
  for (let t = per; from < log.length; t += per) {
    let to = from; while (to < log.length && log[to].t < t) to++;
    if (to > from) { patch[`${path}/c/${k++}`] = { s: packLog(log.slice(0, to), from), at: go + Math.round(t * 1000 / TICK_HZ * warp) + lag }; from = to; }
  }
  if (Object.keys(patch).length) await ref('/').update(patch);
  return { live: resultOf(run), end: go + Math.round(run.t * 1000 / TICK_HZ * warp) + lag + 50, log };
}

test('JAYWALK\'s daily opens only through the test opener (its row ships OFF); START = a try: the seed from THE DAILY SECRET, the server\'s GO, the proof node opened', async () => {
  assert.ok(todaysDailies().includes('jaywalk'), 'opened by DAILY_TEST_OFF on the emulators');
  await ensure('jd-ann', 'JayAnn');
  const s = await D('jd-ann', { action: 'start', game: 'jaywalk' }, NOW);
  assert.ok(s.run && /^d\d+$/.test(s.run.seed), 'a seed (the HMAC of THE DAILY SECRET)');
  assert.equal(s.run.go, NOW + LEAD_MS, 'tick 0 = the start + the count-in (the SERVER\'s clock)');
  assert.equal(s.run.z, s.run.go + CAP_MS + GRACE_MS);
  assert.equal(s.run.try, 0); assert.equal(s.run.left, TRIES - 1);
  const uid = 'jd-ann';
  assert.equal(s.run.path, `dly/jaywalk/${s.day}/w/${uid}/0`);
  assert.deepEqual(await val(s.run.path), { go: s.run.go, z: s.run.z }, 'the proof node opened by the SERVER (go + z)');
  await ensure('jd-bob', 'JayBob');
  const b = await D('jd-bob', { action: 'start', game: 'jaywalk' }, NOW + 5000);
  assert.equal(b.run.seed, s.run.seed, 'everyone gets the same course');
  await rejects(D('jd-ann', { action: 'pause', game: 'jaywalk' }, NOW + 6000), 400, 'bad_action');   // (a try never pauses)
});

let ANN_FIRST = null;
test('THREE TRIES: the FIRST closed try counts the day (streak, XP once); a BETTER try RAISES the score + the points; a worse one changes nothing; a 4th refused', async () => {
  const uid = 'jd-cal'; await ensure(uid, 'JayCal');
  const pid = await pidOf(uid);
  // try 1: a weak run
  let s = await D(uid, { action: 'start', game: 'jaywalk' }, NOW + 60e3);
  let p = await playTry(s, { lazy: true, botSeed: 'w' });
  let f = await D(uid, { action: 'finish', game: 'jaywalk' }, p.end);
  assert.equal(f.try.l, p.live.lanes, `try 1 = the replay of its chunks (${f.try.l} lanes)`);
  assert.equal(f.score, jwScore(p.live.lanes, p.live.tick)); assert.equal(f.counted, true); assert.ok(f.outcome && f.outcome.xp.total > 0, 'the XP, once');
  assert.equal(f.left, 2); assert.equal(f.first, true, 'DAILY BEST: the first ever');
  const xp1 = (await val(`pstats/${pid}/xp`)), st1 = await val(`pstats/${pid}/st`);
  const pts1 = dailyPoints('jaywalk', f.score);
  assert.equal((await val(`pstats/${pid}/dp/d/${s.day}/g/jaywalk`)), pts1);
  ANN_FIRST = f.score;
  // try 2: a strong run → RAISES
  s = await D(uid, { action: 'start', game: 'jaywalk' }, p.end + 10e3);
  assert.equal(s.run.try, 1); assert.equal(s.done, ANN_FIRST, 'the day\'s score so far');
  p = await playTry(s, { botSeed: 's' });
  f = await D(uid, { action: 'finish', game: 'jaywalk' }, p.end);
  const strong = jwScore(p.live.lanes, p.live.tick);
  assert.ok(strong > ANN_FIRST, `the strong try is better (${jwLanes(strong)} > ${jwLanes(ANN_FIRST)} lanes)`);
  assert.equal(f.raised, true); assert.equal(f.score, strong); assert.equal(f.from, ANN_FIRST);
  assert.equal(await val(`dly/jaywalk/${s.day}/r/${pid}`), strong, 'the day\'s score = the best try');
  assert.equal(await val(`pstats/${pid}/xp`), xp1, 'no second XP'); assert.deepEqual(await val(`pstats/${pid}/st`), st1, 'no second streak step');
  assert.equal(await val(`pstats/${pid}/dp/d/${s.day}/g/jaywalk`), dailyPoints('jaywalk', strong), 'the points RAISED to the best try');
  assert.equal(await val(`pstats/${pid}/dp/a/n`), 1, 'still ONE day played');
  assert.equal(f.newBest, false, 'DAILY BEST: beating your own first try TODAY is no NEW best'); assert.equal(f.first, true, '… still the first best ever');
  const top = await val(`dly/jaywalk/${s.day}/t`);
  assert.equal(top.rows.filter(r => r.k === pid).length, 1); assert.equal(top.rows.find(r => r.k === pid).s, strong, 'the day\'s top: ONE row, the best');
  const hist = await val(`dly/jaywalk/${s.day}/h`);
  assert.equal(Object.values(hist).reduce((a, b) => a + b, 0), await val(`dly/jaywalk/${s.day}/n`), 'the histogram moved the bucket (never a second finisher)');
  // try 3: a weak one → nothing changes
  s = await D(uid, { action: 'start', game: 'jaywalk' }, p.end + 10e3);
  assert.equal(s.run.try, 2); assert.equal(s.run.left, 0);
  p = await playTry(s, { lazy: true, botSeed: 'w2', stopAt: 20 * TICK_HZ });
  f = await D(uid, { action: 'finish', game: 'jaywalk' }, p.end);
  assert.equal(f.score, strong, 'a worse try never lowers the day'); assert.ok(!f.raised); assert.equal(f.left, 0);
  // a 4th: refused, the day's score in the answer
  const e = await rejects(D(uid, { action: 'start', game: 'jaywalk' }, p.end + 10e3), 409, 'no_tries');
  assert.equal(e.extra.done, strong); assert.equal(e.extra.run.tries.length, 3);
  // finish again: idempotent
  const again = await D(uid, { action: 'finish', game: 'jaywalk' }, p.end + 20e3);
  assert.equal(again.score, strong); assert.equal(again.again, true);
  // `today`: the tries + DAILY BEST + the place
  const t = await D(uid, { action: 'today' }, p.end + 30e3);
  assert.equal(t.mine.jaywalk, strong); assert.equal(t.tries.jaywalk.left, 0); assert.equal(t.tries.jaywalk.open, false);
  assert.equal(t.best.jaywalk.best.s, strong); assert.equal(t.best.jaywalk.first, true);
  assert.equal(t.dailies.find(d => d.id === 'jaywalk').tries, 3);
  // DAILY B — the tries' CARDS + YOUR BEST, from the SERVER's replay of each try: the jaywalk-solo record = the best try's lanes; every feat
  // a try earned (the record's `f`) is the cards' flag
  assert.equal((await val(`pstats/${pid}/b/jaywalk-solo`)).a, jwLanes(strong), 'YOUR BEST raised by the daily');
  const feats = Object.values((await val(`dly/jaywalk/${s.day}/p/${pid}/t`)) || {}).map(x => x.f || '').join(' ').split(' ').filter(Boolean);
  const gf = (await val(`pstats/${pid}/pa/gf`)) || {};
  assert.ok(feats.every(k => gf[`jaywalk-${k}`]), `every feat is a card flag (${feats.join(' ') || 'none'})`);
  // SHARE TODAY's JAYWALK inputs — spoiler-free: the tries' lanes + the best, never the course
  const sh = await D(uid, { action: 'today', share: true }, p.end + 40e3);
  assert.deepEqual(Object.keys(sh.share.jaywalk).filter(k => k !== 'hs').sort(), ['b', 'day', 'nb', 't'], '(J3: + hs — the best-time split — once a 50 was reached)');
  assert.equal(sh.share.jaywalk.t.length, 3); assert.equal(sh.share.jaywalk.t[sh.share.jaywalk.b], jwLanes(strong));
});

test('J3 — THE TIME BOARDS: the day split board = each player best SERVER split per 50 from any try; `every` + `today` carry the tabs; a gated player out; a refused try writes nothing; the build from the records', async () => {
  const day = streakDay(NOW);
  const cal = await pidOf('jd-cal');
  const triesOf = async pid => Object.entries((await val(`dly/jaywalk/${day}/p/${pid}/t`)) || {}).map(([i, x]) => ({ i: Number(i), ...x }));
  const want = dayFromTries(await triesOf(cal));
  assert.ok(want.length >= 1, `JayCal's strong try reached 50 (${want.length} splits)`);
  assert.deepEqual(await val(`dly/jaywalk/${day}/sp/${cal}`), want, 'the board = the best per split of the closed tries (raised at every close)');
  // a second counted player: one strong try
  await ensure('jt-dee', 'TimDee');
  const dee = await pidOf('jt-dee');
  let s = await D('jt-dee', { action: 'start', game: 'jaywalk' }, NOW + 3600e3);
  let p = await playTry(s, { botSeed: 'dee' });
  await D('jt-dee', { action: 'finish', game: 'jaywalk' }, p.end);
  const wantDee = dayFromTries(await triesOf(dee));
  // a SAME-DAY account (THE THROWAWAY GATE): on the board's node, never on anyone else's view; its own view = NOT COUNTED, no place
  await ensure('jt-eve', 'TimEve', NOW);
  s = await D('jt-eve', { action: 'start', game: 'jaywalk' }, NOW + 7200e3);
  p = await playTry(s, { botSeed: 'eve' });
  await D('jt-eve', { action: 'finish', game: 'jaywalk' }, p.end);
  const eve = await pidOf('jt-eve');
  const E = (await D('jd-cal', { action: 'every' }, p.end + 1000)).every.jaywalk;
  assert.ok(E.times, 'EVERYONE · TODAY carries the time boards (JayCal has played)');
  assert.deepEqual(E.times.tabs, Array.from({ length: Math.max(want.length, wantDee.length) }, (_, i) => (i + 1) * 50), `a tab per 50 anyone counted reached (${E.times.tabs.join(' · ')})`);
  const rows50 = [...E.times.b[50].rows, ...(E.times.b[50].me ? [E.times.b[50].me] : [])];
  assert.equal(rows50.find(r => r.me).t, want[0], 'your time to 50 = your best server split');
  assert.ok(rows50.some(r => r.t === wantDee[0] && !r.me), 'JayDee — their time to 50 listed');
  assert.ok(!rows50.some(r => r.id === boardId(eve) || /^timeve$/i.test(String(r.n || ''))), 'the same-day account is never on a time board (by its board id)');
  assert.ok(rows50.every(r => !r.k && !r.pid), 'never a pid in a public row');
  const sorted = rows50.map(r => r.t); assert.deepEqual(sorted, [...sorted].sort((a, b) => a - b), 'fastest first');
  if (want[0] === wantDee[0]) assert.equal(rows50[0].rank, rows50[1].rank, 'equal times share a place');
  if ((await val(`dly/jaywalk/${day}/sp/${eve}`))) {
    const Ev = (await D('jt-eve', { action: 'every' }, p.end + 2000)).every.jaywalk;
    const mine = Ev.times && Ev.times.b[50] && Ev.times.b[50].me;
    assert.ok(mine && mine.gated && !mine.rank, 'the gated player — its own row: NOT COUNTED, no place');
  }
  // a player who has NOT played sees no time boards (the scores' own rule)
  await ensure('jt-fay', 'TimFay');
  assert.equal((await D('jt-fay', { action: 'every' }, p.end + 3000)).every.jaywalk.times, undefined);
  // YOUR TABLE (`today`): your own split view
  const t = await D('jd-cal', { action: 'today' }, p.end + 4000);
  assert.deepEqual(t.jt.jaywalk.tabs, want.map((_, i) => (i + 1) * 50)); assert.equal(t.jt.jaywalk.b[50].list[0].k, cal);
  // a REFUSED try (forged ahead of the clock) writes nothing — the board unchanged
  await ensure('jt-gus', 'TimGus');
  const gus = await pidOf('jt-gus');
  s = await D('jt-gus', { action: 'start', game: 'jaywalk' }, NOW + 9000e3);
  const live = await playTry(s, { botSeed: 'gus' });
  await ref(`${s.run.path}/c`).set({ 0: { s: packLog(live.log, 0), at: s.run.go + 10 } });   // (the WHOLE log in one chunk stamped 10 ms after GO — far AHEAD of the clock)
  const fg = await D('jt-gus', { action: 'finish', game: 'jaywalk' }, live.end);
  assert.ok(fg.try && fg.try.bad, `the forged log is refused (${JSON.stringify(fg.try)})`);
  assert.equal(await val(`dly/jaywalk/${day}/sp/${gus}`), null, 'a refused try is never on a time board');
  // THE BUILD: a day whose board is missing (tries closed before J3) is built ONCE from the records — the same numbers
  const before = await val(`dly/jaywalk/${day}/sp`);
  await ref(`dly/jaywalk/${day}`).update({ sp: null, spb: null });
  const E2 = (await D('jd-cal', { action: 'every' }, p.end + 5000)).every.jaywalk;
  assert.deepEqual(E2.times.tabs, E.times.tabs, 'rebuilt: the same tabs');
  assert.deepEqual(await val(`dly/jaywalk/${day}/sp`), before, 'rebuilt from the records: the same board');
  assert.equal(await val(`dly/jaywalk/${day}/spb`), 1);
  // the time boards are a VIEW: the lanes result + the points unchanged
  assert.equal(await val(`pstats/${cal}/dp/d/${day}/g/jaywalk`), dailyPoints('jaywalk', await val(`dly/jaywalk/${day}/r/${cal}`)));
});

test('condition 1 — AN UNFINISHED TRY is scored: on the next START (as it stands), by `today` only once it can\'t be in play, at THE DAY\'S CLOSE', async () => {
  const uid = 'jd-dee'; await ensure(uid, 'JayDee');
  const pid = await pidOf(uid);
  let s = await D(uid, { action: 'start', game: 'jaywalk' }, NOW + 2 * 3600e3);
  let p = await playTry(s, { stopAt: 30 * TICK_HZ, botSeed: 'd1' });   // (a refresh 30 s in — no FINISH)
  // `today` while it may still be in play (a chunk 2 s ago): left open
  let t = await D(uid, { action: 'today' }, p.end + 2000);
  assert.equal(t.tries.jaywalk.open, true, 'still in play → left open'); assert.equal(t.mine.jaywalk, undefined); assert.equal(t.started.jaywalk, true);
  // the next START: closes it as it stands, counts the day, opens try 2
  const s2 = await D(uid, { action: 'start', game: 'jaywalk' }, p.end + 5000);
  assert.equal(s2.run.try, 1);
  assert.ok(s2.prior && s2.prior.score != null, 'the open try scored by the next START');
  const rec = await val(`dly/jaywalk/${s.day}/p/${pid}`);
  assert.equal(rec.t[0].why, 'start'); assert.ok(rec.t[0].l >= 1 && rec.t[0].l <= p.live.lanes + 1, `as it stands: ${rec.t[0].l} lanes (reached ${p.live.lanes})`);
  assert.ok((await val(`${s.run.path}/e`)) > 0, 'its proof node closed (no chunk after)');
  assert.equal(await val(`dly/jaywalk/${s.day}/r/${pid}`), s2.done);
  // try 2 left open, then `today` after QUIET_MS of silence: closed + counted
  p = await playTry(s2, { stopAt: 15 * TICK_HZ, botSeed: 'd2' });
  t = await D(uid, { action: 'today' }, p.end + QUIET_MS + 1000);
  assert.equal(t.tries.jaywalk.open, false, '`today`: a try silent for QUIET_MS is closed'); assert.equal(t.tries.jaywalk.left, 1);
  // try 3 left open into THE DAY'S CLOSE (the next day's first call — sweepRuns force-closes it)
  const s3 = await D(uid, { action: 'start', game: 'jaywalk' }, p.end + QUIET_MS + 5000);
  await playTry(s3, { stopAt: 10 * TICK_HZ, botSeed: 'd3' });
  forgetSwept();
  await sweepRuns({ games: ['jaywalk'], now: dayStartAt(dayOf(dayNum(s.day) + 2)) + 3600e3, settle: settleRun });   // (two days on: the window over — force)
  const rec3 = await val(`dly/jaywalk/${s.day}/p/${pid}`);
  assert.ok(rec3.t[2].e > 0 && rec3.t[2].why === 'close', 'THE DAY\'S CLOSE closed the open try');
});

test('condition 2 — THE ROOM WINS: joining a room (2+ players, this player in it) ends the open try as it stands; a fake / lonely room is refused', async () => {
  const uid = 'jd-eve'; await ensure(uid, 'JayEve');
  const pid = await pidOf(uid);
  const s = await D(uid, { action: 'start', game: 'jaywalk' }, NOW + 4 * 3600e3);
  const p = await playTry(s, { stopAt: 25 * TICK_HZ, botSeed: 'e' });
  await ref('rooms/ROOM').set({ meta: { hostId: 'host', status: 'lobby' }, players: { [uid]: { name: 'EVE', pid } } });
  await rejects(D(uid, { action: 'roomWins', game: 'jaywalk', room: 'ROOM' }, p.end), 403, 'not_in_room');   // (a room of one)
  await rejects(D(uid, { action: 'roomWins', game: 'jaywalk', room: 'NOPE' }, p.end), 403, 'not_in_room');
  await ref('rooms/ROOM/players/host').set({ name: 'HOST' });
  const f = await D(uid, { action: 'roomWins', game: 'jaywalk', room: 'ROOM' }, p.end + 100);
  assert.ok(f.try && f.try.l >= 0 && f.left === 2, 'the try ended, scored as it stands');
  assert.equal((await val(`dly/jaywalk/${s.day}/p/${pid}`)).t[0].why, 'room');
  assert.equal(await val(`dly/jaywalk/${s.day}/r/${pid}`), f.score, 'and counted');
  await rejects(D(uid, { action: 'roomWins', game: 'password', room: 'ROOM' }, p.end + 200), 400, 'bad_action');
});

test('forged chunks never count: AHEAD of the clock (refused — 0 lanes), stamped past the try\'s window (z), after FINISH; a SLOWED log CUT; a DROPPED signal in full', async () => {
  const run = async (uid, mod) => {
    await ensure(uid, uid.slice(3).toUpperCase());
    const s = await D(uid, { action: 'start', game: 'jaywalk' }, NOW + 5 * 3600e3);
    const p = await playTry(s, { botSeed: 'f', ...(mod.play || {}) });
    if (mod.after) await mod.after(s, p);
    const f = await D(uid, { action: 'finish', game: 'jaywalk' }, mod.at ? mod.at(s, p) : p.end);
    return { s, p, f, rec: (await val(`dly/jaywalk/${s.day}/p/${await pidOf(uid)}`)).t[0] };
  };
  // ahead: the chunks re-stamped 5 s early (a sped-up game)
  const A = await run('jd-fa', { after: async (s) => { const c = await val(`${s.run.path}/c`); await ref(`${s.run.path}/c`).set(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, { ...v, at: v.at - 5000 }]))); } });
  assert.ok(A.rec.bad && A.f.try.l === 0, `AHEAD → refused, 0 lanes (${A.rec.bad})`);
  // slowed: 1.5× slow motion
  const S = await run('jd-fs', { play: { warp: 1.5 } });
  assert.ok(S.rec.cut === 1 && S.f.try.l < S.p.live.lanes, `SLOWED → CUT (${S.f.try.l} of ${S.p.live.lanes})`);
  // dropped: chunks 5 … 20 held offline then landing together
  const DR = await run('jd-fd', { after: async (s) => { const c = await val(`${s.run.path}/c`); const at = c[21].at - 50; await ref('/').update(Object.fromEntries(Array.from({ length: 16 }, (_, n) => [`${s.run.path}/c/${n + 5}/at`, at + n]))); } });
  assert.ok(!DR.rec.bad && !DR.rec.cut && DR.f.try.l === DR.p.live.lanes, `a DROPPED SIGNAL → the full run (${DR.f.try.l})`);
  // past z: the chunks from 10 on stamped after the window → only the first 10 read
  const Z = await run('jd-fz', { after: async (s) => { const c = await val(`${s.run.path}/c`); await ref('/').update(Object.fromEntries(Object.keys(c).filter(k => Number(k) >= 10).map(k => [`${s.run.path}/c/${k}/at`, s.run.z + 1000 + Number(k)]))); }, at: (s) => s.run.z + 5000 });
  assert.ok(Z.f.try.l < Z.p.live.lanes, `chunks past z never read (${Z.f.try.l} of ${Z.p.live.lanes})`);
  // after FINISH: an extra chunk changes nothing
  const before = A.f.score, path = A.s.run.path;
  await ref(`${path}/c/999`).set({ s: 'U0U2U2U2', at: A.p.end + 100 });
  const again = await D('jd-fa', { action: 'finish', game: 'jaywalk' }, A.p.end + 200);
  assert.equal(again.score, before, 'a chunk after FINISH never re-scores the try');
});

test('DAILY BEST (all four): the finish + `today` carry { best, newBest, first }; THE BACKFILL builds it from the kept days — safe twice', async () => {
  // a past PASSWORD + COAST CLEAR + THE DROP history for one player, written as the days would hold it (r/ — the day's score per pid)
  const uid = 'jd-gus'; await ensure(uid, 'JayGus');
  const pid = await pidOf(uid);
  const day = streakDay(NOW), d1 = dayOf(dayNum(day) - 3), d2 = dayOf(dayNum(day) - 2);
  await ref('/').update({ [`dly/password/${d1}/r/${pid}`]: 7, [`dly/password/${d2}/r/${pid}`]: 104, [`dly/coastclear/${d1}/r/${pid}`]: 10003, [`dly/coastclear/${d2}/r/${pid}`]: 96, [`dly/drop/${d2}/r/${pid}`]: 900 * 1000 + 12 });
  const dry = await bestBackfill({ now: NOW });
  assert.equal(dry.dryRun, true); assert.ok(dry.preview.players >= 1); assert.equal(await val(`pstats/${pid}/db`), null, 'the preview writes nothing');
  assert.ok(dry.preview.games.password.missing.length > 0, 'the days with nothing kept are named');
  const r1 = await bestBackfill({ confirm: true, now: NOW });
  assert.ok(r1.done && r1.written >= 1);
  const db = await val(`pstats/${pid}/db`);
  assert.equal(db.password.s, 7, 'THE PASSWORD: the clean crack (the lockout never counts)');
  assert.equal(db.coastclear.s, 96, 'COAST CLEAR: the clear (caught never counts)');
  assert.equal(db.drop.s, 900012);
  const r2 = await bestBackfill({ confirm: true, now: NOW });
  assert.deepEqual(await val(`pstats/${pid}/db`), db, 'run twice: nothing changes'); assert.equal(r2.written >= 0, true);
  // today's JAYWALK run: its best appears beside the backfilled ones; `today` carries them
  const s = await D(uid, { action: 'start', game: 'jaywalk' }, NOW + 6 * 3600e3);
  const p = await playTry(s, { botSeed: 'g' });
  const f = await D(uid, { action: 'finish', game: 'jaywalk' }, p.end);
  assert.deepEqual(f.best, { s: f.score, day }); assert.equal(f.first, true);
  const t = await D(uid, { action: 'today' }, p.end + 1000);
  assert.equal(t.best.jaywalk.best.s, f.score);
  assert.equal(t.best.password.best.s, 7, '`today` carries every live daily best (the backfilled PASSWORD too)'); assert.equal(t.best.password.newBest, false);
  assert.ok(t.place.jaywalk && t.place.jaywalk.p >= 1 && t.place.jaywalk.n >= t.place.jaywalk.p, `the place + the day's players (${JSON.stringify(t.place.jaywalk)})`);
});

test('condition 4 — THE PRUNE: the proof nodes past 7 days are deleted, the tries\' results + the day\'s scores kept', async () => {
  const day = streakDay(NOW), old = dayOf(dayNum(day) - 9);
  await ref(`dly/jaywalk/${old}`).set({ w: { u: { 0: { go: 1, z: 2, c: { 0: { s: 'U0', at: 1 } } } } }, p: { pAAAAAAAAAAA: { st: 1, t: { 0: { l: 3, e: 2 } } } }, r: { pAAAAAAAAAAA: 3099990 } });
  assert.equal(await JAYWALK_DAILY.prune({ day: old, back: 9 }), 1);
  assert.equal(await val(`dly/jaywalk/${old}/w`), null, 'the proof nodes gone');
  assert.ok(await val(`dly/jaywalk/${old}/p`), 'the tries\' results kept'); assert.equal(await val(`dly/jaywalk/${old}/r/pAAAAAAAAAAA`), 3099990, 'the score kept');
  assert.equal(await JAYWALK_DAILY.prune({ day: old, back: 9 }), 0, 'once');
  assert.equal(await JAYWALK_DAILY.prune({ day: dayOf(dayNum(day) - 5), back: 5 }), 0, 'a recent day keeps them');
});
