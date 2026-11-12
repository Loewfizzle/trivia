// THE PASSWORD on the emulators (PW1 — /api, no browser; docs/password.md "The server flow"): the server judges every guess — the answer never
// in any response before its door closes, an unplayed door's word never, a non-word costs nothing, the 6 cap, a second start = the same try with
// the same progress (a resume), one finish only (from the server's record), and production (no DAILY_TEST) refuses 'password'.
//   cd tests/integration && node --test password.test.mjs        (the emulators running)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.MATCH_GAP_MS = '20000';
process.env.ADMIN_PIDS = '';
process.env.BOARD_MIN_MATCHES = '1';
process.env.DAILY_TEST = '1';
// (DM1 ADD-ON: the days come from THE DAILY SECRET, random per emulator run unless set — pinned here to the key these tests' days were picked
//  against: `blank()` needs a word sharing no letter with four answers, which some random days don't have)
process.env.DAILY_SECRET = 'emulator-pepper';

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { dailyAction } from '../../api/daily.js';
import { loadDailies } from '../../api/_lib/dailies.js';
import { wordsFor, pwLists, PW_DAILY } from '../../api/_lib/pw.js';
import { unregisterDaily, dailyOf } from '../../js/core/daily.js';
import { streakDay } from '../../js/core/streak.js';
import { GUESSES, HIT } from '../../js/games/password/logic.js';

const NOW = Date.UTC(2026, 10, 10, 1, 0, 0);   // Mon Nov 9 2026, 8 pm Eastern
const DAY = 86_400_000;
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'dly', 'pcount', 'streak', 'progress', 'dsched', 'dsecret'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = NOW - 7 * 86_400_000) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} (${e.message})`); if (code) assert.equal(e.code, code); return e; }
  assert.fail(`expected ${status} ${code}`);
};
const G = (uid, word, at) => dailyAction(uid, { action: 'guess', game: 'password', word }, at);
const S = (uid, at) => dailyAction(uid, { action: 'start', game: 'password' }, at);
const F = (uid, at, result = null) => dailyAction(uid, { action: 'finish', game: 'password', result }, at);
/** a valid word that misses every letter of both answers (so a door never closes early) */
function blank(answers) {
  const bad = new Set(answers.join(''));
  const list = pwLists().answers.filter(w => ![...w].some(c => bad.has(c)));
  const miss = list.find(w => new Set(w).size === 5) || [...pwLists().valid].find(w => ![...w].some(c => bad.has(c)));
  assert.ok(miss, 'a word with none of the answers\' letters');
  return miss;
}
const noLeak = (o, words) => { const s = JSON.stringify(o); for (const w of words) assert.doesNotMatch(s, new RegExp(`"${w}"`), `${w} leaked: ${s.slice(0, 200)}`); };

test('a clean crack: start → guesses judged by the server → THE BACK ROOM → finish from the record; the answers never early; a non-word costs nothing', async () => {
  await ensure('pw-ann', 'Ann');
  const day = streakDay(NOW);
  const [W1, W2] = await wordsFor(day);
  assert.notEqual(W1, W2); assert.match(W1, /^[A-Z]{5}$/);
  await rejects(G('pw-ann', 'ABOUT', NOW), 409, 'not_started');
  const s = await S('pw-ann', NOW);
  assert.equal(s.seed, undefined, 'a judged daily hands out NO seed');
  assert.equal(s.run.door, 0); assert.equal(s.run.doors[0].guesses.length, 0); assert.equal(s.done, null);
  noLeak(s, [W1, W2]);
  // a non-word: refused with NO cost (nothing stored)
  const e = await rejects(G('pw-ann', 'QZXWV', NOW + 1e3), 422, 'not_a_word');
  assert.equal(await val(`dly/password/${day}/p/${(await val('uids/pw-ann'))}`), null, 'nothing written');
  await rejects(G('pw-ann', 'ABOU', NOW + 1e3), 422, 'not_a_word');
  await rejects(G('pw-ann', '', NOW + 1e3), 422, 'not_a_word');
  // a miss, then the crack
  const miss = blank([W1, W2]);
  const g1 = await G('pw-ann', miss.toLowerCase(), NOW + 2e3);
  assert.equal(g1.door, 0); assert.equal(g1.n, 1); assert.deepEqual(g1.marks, ['miss', 'miss', 'miss', 'miss', 'miss']); assert.equal(g1.solved, false); assert.equal(g1.word, undefined); assert.equal(g1.done, false);
  noLeak(g1, [W1, W2]);
  const g2 = await G('pw-ann', W1, NOW + 3e3);
  assert.equal(g2.solved, true); assert.equal(g2.word, W1); assert.equal(g2.next, 1); assert.equal(g2.done, false); assert.ok(g2.marks.every(m => m === HIT));
  noLeak(g2, [W2]);
  // a second start = the same try with the same progress (a refresh / a resume): the marks + THE DOOR's word, THE BACK ROOM's hidden
  const s2 = await S('pw-ann', NOW + 4e3);
  assert.equal(s2.startedAt, s.startedAt);
  assert.equal(s2.run.door, 1); assert.deepEqual(s2.run.doors[0].guesses, [miss.toUpperCase(), W1]); assert.equal(s2.run.doors[0].word, W1); assert.equal(s2.run.doors[0].state, 'solved');
  assert.equal(s2.run.doors[1].word, null); assert.deepEqual(s2.run.doors[1].guesses, []);
  noLeak(s2, [W2]);
  // a finish before the run is done: refused
  await rejects(F('pw-ann', NOW + 5e3), 409, 'not_done');
  const g3 = await G('pw-ann', W2, NOW + 60e3);
  assert.equal(g3.solved, true); assert.equal(g3.word, W2); assert.equal(g3.done, true); assert.equal(g3.finishedAt, NOW + 60e3);
  await rejects(G('pw-ann', miss, NOW + 61e3), 409, 'finished');
  // finish: the SERVER's record scores it — the phone's claim is ignored
  const f = await F('pw-ann', NOW + 62e3, { score: 2, lies: true });
  assert.equal(f.score, 3, '(2 − 2) × 100 + 3 guesses');
  assert.equal(f.stand.n, 1); assert.equal(f.outcome.streak.n, 1);
  // PW2 — THE REWARDS from the SERVER's record: a crack in 3 → KEYHOLE (the emblem) + SAFECRACKER (the card, ≤ 6); once
  assert.deepEqual(f.outcome.ach.map(a => a.id || a).sort(), ['keyhole', 'safecracker']);
  assert.ok(f.outcome.items.map(i => i.id || i).includes('emb-keyhole') && f.outcome.items.map(i => i.id || i).includes('card-safecracker'), JSON.stringify(f.outcome.items));
  const ps = await val(`pstats/${await val('uids/pw-ann')}`);
  assert.ok(ps.it['emb-keyhole'] && ps.it['card-safecracker'] && ps.ac.keyhole && ps.ac.safecracker && ps.pa.gf['password-crack'] === 1 && ps.pa.gf['password-safe'] === 1);
  const again = await F('pw-ann', NOW + 63e3, { score: 1 });
  assert.equal(again.score, 3); assert.equal(again.again, true); assert.equal(again.outcome, null);
  assert.equal(await val(`dly/password/${day}/n`), 1);
  assert.equal((await S('pw-ann', NOW + 64e3)).done, 3, 'a later start says: done, this score');
  await rejects(G('pw-ann', miss, NOW + 65e3), 409, 'finished');
  // the record on the server: words only — no marks, no answers beyond what was guessed
  const pid = await val('uids/pw-ann');
  const rec = await val(`dly/password/${day}/p/${pid}`);
  // (firebase hands dense keys back as arrays)
  assert.deepEqual([rec.g[0], rec.g[1], rec.e, Object.keys(rec).sort()], [[miss.toUpperCase(), W1], [W2], NOW + 60e3, ['e', 'g']]);
});

test('THE DOOR held: six misses close door 1, its word shown, the run over — THE BACK ROOM never opened, its word in NO response; the cap', async () => {
  await ensure('pw-bob', 'Bob');
  const day = streakDay(NOW);
  const [W1, W2] = await wordsFor(day);
  const miss = blank([W1, W2]);
  await S('pw-bob', NOW);
  const all = [];
  for (let i = 0; i < GUESSES; i++) all.push(await G('pw-bob', miss, NOW + (i + 1) * 1e3));
  assert.equal(all[GUESSES - 1].failed, true); assert.equal(all[GUESSES - 1].word, W1); assert.equal(all[GUESSES - 1].done, true); assert.equal(all[GUESSES - 1].next, undefined);
  for (const r of all.slice(0, -1)) { assert.equal(r.word, undefined); noLeak(r, [W1, W2]); }
  noLeak(all, [W2]);
  await rejects(G('pw-bob', miss, NOW + 9e3), 409, 'finished', 'a 7th guess');
  const s = await S('pw-bob', NOW + 10e3);
  assert.equal(s.run.done, true); assert.equal(s.run.doors[0].state, 'failed'); assert.equal(s.run.doors[0].word, W1);
  assert.equal(s.run.doors[1].word, null); assert.equal(s.run.doors[1].state, 'open'); assert.deepEqual(s.run.doors[1].guesses, []);
  noLeak(s, [W2]);
  const f = await F('pw-bob', NOW + 11e3);
  assert.equal(f.score, 206, '(2 − 0) × 100 + 6');
});

test('THE BACK ROOM held: door 1 in two, six misses on door 2 → 100 + 8; the standing is LOW = better', async () => {
  await ensure('pw-cat', 'Cat');
  const day = streakDay(NOW);
  const [W1, W2] = await wordsFor(day);
  const miss = blank([W1, W2]);
  await S('pw-cat', NOW);
  await G('pw-cat', miss, NOW + 1e3);
  const open = await G('pw-cat', W1, NOW + 2e3);
  assert.equal(open.next, 1);
  let last = null;
  for (let i = 0; i < GUESSES; i++) last = await G('pw-cat', miss, NOW + (3 + i) * 1e3);
  assert.equal(last.failed, true); assert.equal(last.word, W2); assert.equal(last.done, true);
  const f = await F('pw-cat', NOW + 20e3);
  assert.equal(f.score, 108);
  assert.deepEqual((f.outcome.ach || []).map(a => a.id || a).filter(a => a === 'keyhole' || a === 'safecracker'), [], 'a held door: no KEYHOLE, no SAFECRACKER');
  // three finishers: Ann 3 · Cat 108 · Bob 206 → Cat beat Bob, not Ann
  assert.equal(f.stand.n, 3); assert.equal(f.stand.pct, 50);
});

test('PW2 — a crack in SEVEN: KEYHOLE but not SAFECRACKER (the threshold is six, from the record — never a phone\'s claim)', async () => {
  await ensure('pw-dan', 'Dan');
  const day = streakDay(NOW);
  const [W1, W2] = await wordsFor(day);
  const miss = blank([W1, W2]);
  await S('pw-dan', NOW);
  for (let i = 0; i < 5; i++) await G('pw-dan', miss, NOW + (i + 1) * 1e3);
  assert.equal((await G('pw-dan', W1, NOW + 7e3)).next, 1);
  assert.equal((await G('pw-dan', W2, NOW + 8e3)).done, true);
  const f = await F('pw-dan', NOW + 9e3, { flags: { safe: 1 }, guesses: 2 });
  assert.equal(f.score, 7);
  assert.deepEqual(f.outcome.ach.map(a => a.id || a).filter(a => a === 'keyhole' || a === 'safecracker'), ['keyhole']);
  const ps = await val(`pstats/${await val('uids/pw-dan')}`);
  assert.ok(ps.it['emb-keyhole'] && !ps.it['card-safecracker'] && ps.pa.gf['password-crack'] === 1 && !ps.pa.gf['password-safe']);
});

test('the day turns at 4 am Eastern: tomorrow is a new try with new words; the streak follows', async () => {
  const day0 = streakDay(NOW), day1 = streakDay(NOW + DAY);
  assert.notEqual(day0, day1);
  assert.notDeepEqual(await wordsFor(day0), await wordsFor(day1));
  const s = await S('pw-ann', NOW + DAY);
  assert.equal(s.done, null); assert.equal(s.run.door, 0); assert.equal(s.run.doors[0].guesses.length, 0);
  const [W1, W2] = await wordsFor(day1);
  await G('pw-ann', W1, NOW + DAY + 1e3); await G('pw-ann', W2, NOW + DAY + 2e3);
  const f = await F('pw-ann', NOW + DAY + 3e3);
  assert.equal(f.score, 2); assert.equal(f.outcome.streak.n, 2);
});

test('the cartridge: LOW is better, one bucket per score 2…206; the list is in; PRODUCTION (no DAILY_TEST) refuses the game', async () => {
  assert.equal(PW_DAILY.better, 'low'); assert.equal(PW_DAILY.buckets, 205); assert.equal(PW_DAILY.bucket(2), 0); assert.equal(PW_DAILY.bucket(206), 204);
  assert.ok(pwLists().n >= 1300, `${pwLists().n} answers`);
  assert.equal(PW_DAILY.verify(0, { score: 2 }, { startedAt: 1, record: null, day: 'd20261107' }), null, 'no record → no score, whatever the phone claims');
  // production: the env flag off → loadDailies registers nothing → 404 no_daily (the fake daily too)
  const saved = process.env.DAILY_TEST;
  process.env.DAILY_TEST = '';
  unregisterDaily('password'); unregisterDaily('test');
  try {
    loadDailies();
    assert.equal(dailyOf('password'), null);
    await rejects(S('pw-ann', NOW), 404, 'no_daily');
    await rejects(G('pw-ann', 'ABOUT', NOW), 404, 'no_daily');
    await rejects(dailyAction('pw-ann', { action: 'start', game: 'test' }, NOW), 404, 'no_daily');
  } finally { process.env.DAILY_TEST = saved; loadDailies(); }
  assert.ok(dailyOf('password'), 'back under the flag');
  // the guess action is for judged dailies only
  await dailyAction('pw-bob', { action: 'start', game: 'test' }, NOW);
  await rejects(dailyAction('pw-bob', { action: 'guess', game: 'test', word: 'ABOUT' }, NOW), 400, 'bad_action');
});

// ---- DFIX1 — A RUN KEEPS ITS OWN DAY: the 4 am Eastern turn never loses a run in flight (FABLE REVIEW #1 finding 1 — its probe is this test)
const TURN = Date.UTC(2026, 11, 2, 9, 0, 0);   // Wed Dec 2 2026, 4:00 am Eastern (EST)
const GD = (uid, word, at, day) => dailyAction(uid, { action: 'guess', game: 'password', word, day }, at);
const FD = (uid, at, day) => dailyAction(uid, { action: 'finish', game: 'password', result: null, day }, at);
const SD = (uid, at, day) => dailyAction(uid, { action: 'start', game: 'password', day }, at);

test('DFIX1 — the 4 am turn: start 3:58 → guesses across 4:00 → finish 4:00:30 records on the START\'s day, its streak day + its rewards', async () => {
  await ensure('pw-tom', 'Tom', TURN - 3 * DAY);
  const d0 = streakDay(TURN - 120e3), d1 = streakDay(TURN + 30e3);
  assert.equal(d0, 'd20261201'); assert.equal(d1, 'd20261202');
  const [W1, W2] = await wordsFor(d0);
  const s = await S('pw-tom', TURN - 120e3);
  assert.equal(s.day, d0);
  const miss = blank([W1, W2, ...await wordsFor(d1)]);
  await GD('pw-tom', miss, TURN - 100e3, d0);
  // past the turn: the run's own day goes on — the old words, the same record
  const g2 = await GD('pw-tom', W1, TURN + 10e3, d0);
  assert.equal(g2.day, d0); assert.equal(g2.solved, true); assert.equal(g2.word, W1);
  // an OLD phone (no day) is out of step after the turn — today has no start for it
  await rejects(G('pw-tom', W2, TURN + 15e3), 409, 'not_started');
  // a refresh across the turn (the phone asks for its run's day) resumes the old run: door 2, the same start
  const back = await SD('pw-tom', TURN + 18e3, d0);
  assert.equal(back.day, d0); assert.equal(back.startedAt, s.startedAt); assert.equal(back.run.door, 1); assert.deepEqual(back.run.doors[0].guesses, [miss, W1]);
  assert.equal(await val(`dly/password/${d1}/s/${await val('uids/pw-tom')}`), null, 'the resume opened nothing on the new day');
  assert.equal((await GD('pw-tom', W2, TURN + 20e3, d0)).done, true);
  const f = await FD('pw-tom', TURN + 30e3, d0);
  assert.equal(f.day, d0); assert.equal(f.score, 3);
  assert.deepEqual(f.outcome.ach.map(a => a.id || a).sort(), ['keyhole', 'safecracker']);
  const pid = await val('uids/pw-tom');
  assert.equal(await val(`dly/password/${d0}/r/${pid}`), 3, 'recorded on the start\'s day');
  assert.equal(await val(`dly/password/${d1}/r/${pid}`), null);
  const ps = await val(`pstats/${pid}`);
  assert.equal(ps.st.d, d0, 'the streak day is the run\'s'); assert.equal(ps.st.n, 1);
  assert.ok(ps.m[`daily_password_${d0}`]);
  // ONE TRY still holds: the finished run is never reopened — a start asking for it gets TODAY's fresh run, a guess on it is refused
  const s1 = await SD('pw-tom', TURN + 40e3, d0);
  assert.equal(s1.day, d1); assert.equal(s1.done, null); assert.equal(s1.run.door, 0); assert.equal(s1.run.doors[0].guesses.length, 0);
  await rejects(GD('pw-tom', miss, TURN + 41e3, d0), 409, 'finished');
  // and today's run counts as today (the streak goes on to 2)
  const [V1, V2] = await wordsFor(d1);
  await GD('pw-tom', V1, TURN + 50e3, d1); await GD('pw-tom', V2, TURN + 60e3, d1);
  const f1 = await FD('pw-tom', TURN + 70e3, d1);
  assert.equal(f1.day, d1); assert.equal(f1.outcome.streak.n, 2);
});

test('DFIX1 — the review\'s case: both doors cracked at 3:58:40, the finish lands at 4:00:30 → recorded (never 409 not_started)', async () => {
  await ensure('pw-uma', 'Uma', TURN - 3 * DAY);
  const d0 = streakDay(TURN - 120e3);
  const [W1, W2] = await wordsFor(d0);
  await S('pw-uma', TURN - 120e3);
  await GD('pw-uma', W1, TURN - 90e3, d0);
  assert.equal((await GD('pw-uma', W2, TURN - 80e3, d0)).done, true);
  const f = await FD('pw-uma', TURN + 30e3, d0);
  assert.equal(f.score, 2); assert.equal(f.day, d0); assert.ok(f.outcome && f.outcome.streak.n === 1);
});

test('DFIX1 — the abuse checks: a made-up day, two days back, tomorrow, a day with no start → refused; a start never opens yesterday afresh', async () => {
  await ensure('pw-wes', 'Wes', TURN - 3 * DAY);
  const d1 = streakDay(TURN + 60e3), d0 = 'd20261201';
  const s = await SD('pw-wes', TURN + 60e3, d0);   // no start on d0: the start is today's, nothing written on d0
  assert.equal(s.day, d1);
  const pid = await val('uids/pw-wes');
  assert.equal(await val(`dly/password/${d0}/s/${pid}`), null, 'never a start on yesterday\'s day');
  const [W1] = await wordsFor(d1);
  await rejects(GD('pw-wes', W1, TURN + 61e3, d0), 409, 'not_started');            // yesterday, but no start there
  await rejects(GD('pw-wes', W1, TURN + 61e3, 'd20261130'), 400, 'bad_day');        // two back
  await rejects(GD('pw-wes', W1, TURN + 61e3, 'd20261203'), 400, 'bad_day');        // tomorrow
  await rejects(GD('pw-wes', W1, TURN + 61e3, 'd99999999'), 400, 'bad_day');        // made up
  await rejects(GD('pw-wes', W1, TURN + 61e3, 'yesterday'), 400, 'bad_day');
  await rejects(GD('pw-wes', W1, TURN + 61e3, { k: d0 }), 400, 'bad_day');
  await rejects(FD('pw-wes', TURN + 61e3, 'd20261130'), 400, 'bad_day');
  assert.equal((await SD('pw-wes', TURN + 62e3, 'd20261130')).day, d1, 'a start asking two days back: today\'s (the same try)');
  // a day of a run that was never on this profile's books → the guess goes nowhere; today's run is untouched
  assert.equal(await val(`dly/password/${d1}/p/${pid}`), null);
  // the clean errors (DFIX1 Group 3): a move THE PASSWORD doesn't own, a null body, a non-object
  await rejects(dailyAction('pw-wes', { action: 'dig', game: 'password', cell: 3 }, TURN + 63e3), 400, 'bad_action');
  await rejects(dailyAction('pw-wes', { action: 'pause', game: 'password' }, TURN + 63e3), 400, 'bad_action');
  await rejects(dailyAction('pw-wes', null, TURN + 63e3), 400, 'bad_action');
  await rejects(dailyAction('pw-wes', 'guess', TURN + 63e3), 400, 'bad_action');
  await rejects(dailyAction('pw-wes', { action: 'guess', game: 'password', word: { w: 'ABOUT' } }, TURN + 63e3), 422, 'not_a_word');
  await rejects(dailyAction('pw-wes', { action: 'guess', game: { id: 'password' } }, TURN + 63e3), 404, 'no_daily');
});

// FR7 FIXES A — DY2 (FR7-B's MUST-FIX): a guess whose answer is LOST is never counted twice — the guess carries its place `k`; a repeat is
// answered from the record (nothing written); a different word on a filled row → out_of_step; an old phone (no k) keeps the old path
const GK = (uid, word, k, at) => dailyAction(uid, { action: 'guess', game: 'password', word, k }, at);
test('FR7 FIXES A — DY2: THE GUESS IS IDEMPOTENT — a retry after a lost answer is the same answer, never guess n + 1', async () => {
  await ensure('pw-dy2', 'Dee');
  const day = streakDay(NOW), [W1, W2] = await wordsFor(day), miss = blank([W1, W2]);
  await S('pw-dy2', NOW);
  const pid = await val('uids/pw-dy2'), recOf = () => val(`dly/password/${day}/p/${pid}`);
  const a = await GK('pw-dy2', miss, 0, NOW + 1e3);
  assert.equal(a.n, 1);
  // the answer was lost on the way back; ENTER again → the SAME answer, the record unchanged
  const before = JSON.stringify(await recOf());
  const b = await GK('pw-dy2', miss, 0, NOW + 2e3);
  assert.equal(b.again, true); assert.equal(b.n, 1); assert.deepEqual(b.marks, a.marks);
  assert.equal(JSON.stringify(await recOf()), before, 'nothing written');
  // a different word on that row = out of step (the phone resyncs); a k past the end too
  await rejects(GK('pw-dy2', W1, 0, NOW + 3e3), 409, 'out_of_step');
  await rejects(GK('pw-dy2', W1, 5, NOW + 3e3), 409, 'out_of_step');
  // the lost answer that OPENED THE FRONT DOOR: the retry is that answer, never guess 1 of THE BACK ROOM
  const open = await GK('pw-dy2', W1, 1, NOW + 4e3);
  assert.equal(open.next, 1);
  const again = await GK('pw-dy2', W1, 1, NOW + 5e3);
  assert.equal(again.again, true); assert.equal(again.next, 1); assert.equal(again.word, W1);
  const s = await S('pw-dy2', NOW + 6e3);
  assert.deepEqual(s.run.doors[1].guesses, [], 'THE BACK ROOM untouched');
  // the finishing guess, lost and retried: the same done + finish time; then finish scores 3 (never 4)
  const fin = await GK('pw-dy2', W2, 2, NOW + 7e3);
  const fin2 = await GK('pw-dy2', W2, 2, NOW + 8e3);
  assert.equal(fin2.again, true); assert.equal(fin2.done, true); assert.equal(fin2.finishedAt, fin.finishedAt);
  assert.equal((await F('pw-dy2', NOW + 9e3)).score, 3);
  // an old phone (no k): the old path — a second SLATE is a second guess (accepted as before)
  await ensure('pw-old', 'Old'); await S('pw-old', NOW);
  await G('pw-old', miss, NOW + 1e3); const o2 = await G('pw-old', miss, NOW + 2e3);
  assert.equal(o2.n, 2, 'no k = the old path (kept for a phone on the old script)');
});
