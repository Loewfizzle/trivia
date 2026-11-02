// PROGRESSION A on the emulators (/api, no browser): THE DAILY CONTRACT (one official try, the server's score, the percentile + bands, the
// streak, YOUR TABLE's TODAY) with the TEST-ONLY fake daily, THE OUTAGE button, levels + items through a real report, the award engine.
//   cd tests/integration && node --test progression.test.mjs        (the emulators running)
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
import { adminAction } from '../../api/admin.js';
import { dailyAction } from '../../api/daily.js';
import { dailySeed, FAKE_DAILY } from '../../api/_lib/dailies.js';
import { streakDay, dayNum, dayOf } from '../../js/core/streak.js';
import { BAND_MIN } from '../../js/core/daily.js';

const NOW = Date.UTC(2026, 10, 10, 1, 0, 0);   // Mon Nov 9 2026, 8 pm Eastern
const DAY = 86_400_000;
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'dly', 'pcount', 'streak'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = NOW) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} (${e.message})`); if (code) assert.equal(e.code, code); return; }
  assert.fail(`expected ${status} ${code}`);
};

test('THE DAILY CONTRACT: one official try, the score checked on the server, the streak kept', async () => {
  const a = await ensure('d-ann', 'Ann');
  const day = streakDay(NOW);
  await rejects(dailyAction('d-ann', { action: 'finish', game: 'test', result: { guess: 1 } }, NOW), 409, 'not_started');
  await rejects(dailyAction('d-ann', { action: 'start', game: 'nope' }, NOW), 404, 'no_daily');
  const s = await dailyAction('d-ann', { action: 'start', game: 'test' }, NOW);
  assert.equal(s.day, day); assert.equal(s.seed, dailySeed('test', day)); assert.equal(s.done, null);
  // a refresh = the same try (its clock started at the first start)
  const s2 = await dailyAction('d-ann', { action: 'start', game: 'test' }, NOW + 30e3);
  assert.equal(s2.startedAt, s.startedAt);
  // a result that doesn't check out is refused
  await rejects(dailyAction('d-ann', { action: 'finish', game: 'test', result: { guess: 5000 } }, NOW + 60e3), 422, 'refused');
  const target = FAKE_DAILY.target(s.seed);
  const f = await dailyAction('d-ann', { action: 'finish', game: 'test', result: { guess: target } }, NOW + 60e3);
  assert.equal(f.score, 1000);
  assert.equal(f.stand.n, 1); assert.equal(f.stand.band, null, 'no band under ~50 finishers');
  assert.equal(f.outcome.streak.n, 1);
  // ONE official try: a second finish gets the first score back, counts nothing again
  const again = await dailyAction('d-ann', { action: 'finish', game: 'test', result: { guess: (target + 300) % 1000 } }, NOW + 90e3);
  assert.equal(again.score, 1000); assert.equal(again.again, true); assert.equal(again.outcome, null);
  assert.equal(await val(`dly/test/${day}/n`), 1);
  // the client can never have written any of it: the score + the streak are the server's
  const st = await val(`pstats/${a.pid}`);
  assert.equal(st.st.n, 1); assert.equal(st.dl.n, 1);
  assert.equal((await val(`profiles/${a.pid}`)).s, 1);
  assert.equal(s2.done, null);
  assert.equal((await dailyAction('d-ann', { action: 'start', game: 'test' }, NOW + 120e3)).done, 1000);
});

test('the percentile + THE BANDS (shown from ~50 finishers)', async () => {
  const day = streakDay(NOW);
  // 59 finishers already on the histogram (scores 0, 10 … 580), via the counts only
  const hist = {};
  for (let i = 0; i < 59; i++) hist[i] = (hist[i] || 0) + 1;
  await ref(`dly/test/${day}`).update({ h: { ...(await val(`dly/test/${day}/h`)), ...hist }, n: 60 });
  await ensure('d-bob', 'Bob');
  const s = await dailyAction('d-bob', { action: 'start', game: 'test' }, NOW);
  const f = await dailyAction('d-bob', { action: 'finish', game: 'test', result: { guess: (FAKE_DAILY.target(s.seed) + 1) % 1000 } }, NOW + 5e3);
  assert.equal(f.score, 999);
  assert.ok(f.stand.n >= BAND_MIN);
  assert.ok(f.stand.pct >= 95, `better than nearly everyone (${f.stand.pct} %)`);
  assert.equal(f.stand.band, 'VIP ROOM', 'second of 61: top 3 % → the VIP ROOM');
});

test('YOUR TABLE\'s TODAY: a friend\'s score hidden until you have played that daily', async () => {
  const day = streakDay(NOW);
  const ann = await val('uids/d-ann'), bob = await val('uids/d-bob');
  await ensure('d-cat', 'Cat');
  const before = await dailyAction('d-cat', { action: 'today', pids: [ann, bob, 'not-a-pid'] }, NOW);
  assert.deepEqual(before.friends[ann], { test: { done: true } });
  assert.deepEqual(before.mine, {});
  const s = await dailyAction('d-cat', { action: 'start', game: 'test' }, NOW);
  await dailyAction('d-cat', { action: 'finish', game: 'test', result: { guess: FAKE_DAILY.target(s.seed) } }, NOW + 1e3);
  const after = await dailyAction('d-cat', { action: 'today', pids: [ann, bob] }, NOW);
  assert.deepEqual(after.friends[ann], { test: { score: 1000 } });
  assert.equal(after.day, day);
});

test('a daily keeps THE STREAK like a match: tomorrow → 2 nights', async () => {
  const s = await dailyAction('d-ann', { action: 'start', game: 'test' }, NOW + DAY);
  const f = await dailyAction('d-ann', { action: 'finish', game: 'test', result: { guess: 0 } }, NOW + DAY + 1e3);
  assert.ok(f.score >= 0 && s.day === streakDay(NOW + DAY));
  assert.equal(f.outcome.streak.n, 2);
});

test('THE OUTAGE BUTTON: admins only, audited; a marked day breaks nobody\'s streak', async () => {
  const boss = await ensure('d-boss', 'Boss');
  const today = streakDay(NOW + 3 * DAY);
  const missed = dayOf(dayNum(streakDay(NOW + DAY)) + 1);   // Ann played day 0 + 1; day 2 missed
  await rejects(adminAction('d-ann', { action: 'outage', day: missed }, NOW + 3 * DAY), 403, 'not_admin');
  process.env.ADMIN_PIDS = boss.pid;
  try {
    await rejects(adminAction('d-boss', { action: 'outage', day: 'd2099010' }, NOW + 3 * DAY), 400, 'bad_day');
    const r = await adminAction('d-boss', { action: 'outage', day: missed }, NOW + 3 * DAY);
    assert.ok(r.outage[missed]);
    const log = Object.values((await val('audit')) || {});
    assert.ok(log.some(x => x.act === 'outageOn' && x.by === boss.pid));
  } finally { process.env.ADMIN_PIDS = ''; }
  // Ann (2 nights, no freeze yet) comes back on day 3: the outage day covers day 2 → 3 nights
  await dailyAction('d-ann', { action: 'start', game: 'test' }, NOW + 3 * DAY);
  const f = await dailyAction('d-ann', { action: 'finish', game: 'test', result: { guess: 1 } }, NOW + 3 * DAY + 1e3);
  assert.equal(f.day, today);
  assert.equal(f.outcome.streak.n, 3);
  assert.deepEqual(f.outcome.streak.ev.outage, [missed]);
  assert.ok(f.outcome.items.includes('flame-full'), 'THE 3-NIGHT MILESTONE: full neon');
});
