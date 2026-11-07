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
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'dly', 'pcount', 'streak', 'progress'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = NOW) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
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
  const [W1, W2] = wordsFor(day);
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
  const [W1, W2] = wordsFor(day);
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
  const [W1, W2] = wordsFor(day);
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
  // three finishers: Ann 3 · Cat 108 · Bob 206 → Cat beat Bob, not Ann
  assert.equal(f.stand.n, 3); assert.equal(f.stand.pct, 50);
});

test('the day turns at 4 am Eastern: tomorrow is a new try with new words; the streak follows', async () => {
  const day0 = streakDay(NOW), day1 = streakDay(NOW + DAY);
  assert.notEqual(day0, day1);
  assert.notDeepEqual(wordsFor(day0), wordsFor(day1));
  const s = await S('pw-ann', NOW + DAY);
  assert.equal(s.done, null); assert.equal(s.run.door, 0); assert.equal(s.run.doors[0].guesses.length, 0);
  const [W1, W2] = wordsFor(day1);
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
