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
import { processReport } from '../../api/report.js';
import { progressEvent } from '../../api/_lib/events.js';
import { finalGame } from '../fixtures/finals.mjs';
import { extractMatch } from '../../js/core/match-report.js';

const NOW = Date.UTC(2026, 10, 10, 1, 0, 0);   // Mon Nov 9 2026, 8 pm Eastern
const DAY = 86_400_000;
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'dly', 'pcount', 'streak', 'progress', 'radio', 'testAdmins', 'gplay', 'pfr'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = NOW - 7 * 86_400_000) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
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
  const cat = (await ensure('d-cat', 'Cat')).pid || await val('uids/d-cat');
  // (FRIENDS A: YOUR TABLE reads the FRIENDS LIST — a stranger named by id is never read)
  const strangers = await dailyAction('d-cat', { action: 'today', pids: [ann, bob] }, NOW);
  assert.deepEqual(strangers.friends, {}, 'not friends yet: nothing of theirs');
  await ref('pfr').update({ [`${cat}/f/${ann}`]: NOW - 2000, [`${ann}/f/${cat}`]: NOW - 2000, [`${cat}/f/${bob}`]: NOW - 1000, [`${bob}/f/${cat}`]: NOW - 1000 });
  const before = await dailyAction('d-cat', { action: 'today', pids: [ann, bob, 'not-a-pid'] }, NOW);
  assert.deepEqual(before.friends[ann], { test: { done: true } });
  assert.deepEqual(before.mine, {});
  const s = await dailyAction('d-cat', { action: 'start', game: 'test' }, NOW);
  await dailyAction('d-cat', { action: 'finish', game: 'test', result: { guess: FAKE_DAILY.target(s.seed) } }, NOW + 1e3);
  const after = await dailyAction('d-cat', { action: 'today', pids: [ann, bob] }, NOW);
  assert.deepEqual(after.friends[ann], { test: { score: 1000 } });
  assert.equal(after.day, day);
  // no pick: the friends you PLAYED WITH last, then the newest friendships — at most 12
  const auto = await dailyAction('d-cat', { action: 'today' }, NOW);
  assert.deepEqual(auto.table, [bob, ann], 'the newest friendship first (nobody played together yet)');
  await ref(`pfr/${cat}/rp/${ann}`).set(NOW - 500);
  assert.deepEqual((await dailyAction('d-cat', { action: 'today' }, NOW)).table, [ann, bob], 'the one you played with last leads');
  const AL = 'abcdefghijkmnpqrstuvwxyz23456789', many = {};
  for (let i = 0; i < 20; i++) many[`pt${AL[i]}aaaaaaaaa`] = NOW - 10e3 - i;
  await ref(`pfr/${cat}/f`).update(many);
  const t12 = await dailyAction('d-cat', { action: 'today' }, NOW);
  assert.equal(t12.table.length, 12, 'YOUR TABLE: at most 12 friends a read');
  await ref(`pfr/${cat}`).remove();
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

// ------------------------------------------------------------------ Group 3: the award engine through the real report, wearing, X%, events, FOUNDER
const NIGHTPTS = { 1: 3, 2: 2, 3: 1 };
let codeN = 0;
async function seedRoom(id, uids, at, hostUid = uids[0]) {
  const code = `P${'ABCDEFGHJKLMNPQRSTUVWXYZ'[codeN++ % 24]}QZ`;
  const game = finalGame(id, uids, {});
  game.phaseStartAt = at;
  const ex = extractMatch(game, {});
  const night = { g: id, at, p: {}, n: {} };
  for (const [u, r] of Object.entries(ex.rows)) { night.p[u] = NIGHTPTS[r.rank] || 0; night.n[u] = u.toUpperCase(); }
  await ref(`rooms/${code}`).set({ meta: { hostId: hostUid, status: 'playing', createdAt: at, activeAt: at },
    players: Object.fromEntries(uids.map((u, i) => [u, { name: u.toUpperCase(), color: 'cyan', avatar: 'bolt', joinedAt: i }])), game, night: { [game.matchId]: night } });
  return { code, matchId: game.matchId };
}

test('a counted match runs THE AWARD ENGINE: the level rewards, the achievements, FOUNDER (the window open by default), the X% counts', async () => {
  const at = NOW + 10 * DAY;
  const h = await ensure('g-host', 'Hosty', at), g2 = await ensure('g-two', 'Two', at);
  const room = await seedRoom('prism', ['g-host', 'g-two'], at);
  const r = await processReport('g-host', room, at + 1000);
  assert.equal(r.status, 'counted');
  const o = r.outcome;
  assert.ok(o.lv && o.lv.to >= 2, 'a level');
  for (const id of ['card-gilded', 'glow-ember', 'emb-key', 'card-founder']) assert.ok(o.items.includes(id), id);
  for (const id of ['first-round', 'house-warming']) assert.ok(o.ach.includes(id), id);
  assert.equal(o.st.n, 1);
  const s = await val(`pstats/${h.pid}`);
  assert.ok(s.it['card-founder'] && s.ac['house-warming']);
  assert.equal((await val(`profiles/${h.pid}`)).fd, true);
  assert.equal((await val(`profiles/${h.pid}`)).l, o.lv.to);
  // the other player: no HOUSE WARMING (not the host)
  const s2 = await val(`pstats/${g2.pid}`);
  assert.ok(s2.ac['first-round'] && !s2.ac['house-warming']);
  // a replay is the stored outcome — nothing granted twice
  const again = await processReport('g-host', room, at + 5000);
  assert.equal(again.status, 'done');
  assert.ok(await val('pcount/i/card-founder') >= 2, 'the owners counted (the daily players above got it too)');
  // X% OF PLAYERS HAVE THIS — only for what the caller owns
  const pc = await profileAction('g-two', { action: 'pct' }, '', at + 6000);
  assert.ok(pc.n >= 2);
  assert.equal(pc.pct.a['house-warming'], undefined, 'nothing about what you don’t hold');
  assert.ok(pc.pct.a['first-round'] >= 1 && pc.pct.i['card-founder'] >= 1);
});

test('WEAR what you own — never what you don’t', async () => {
  const at = NOW + 10 * DAY;
  const r = await profileAction('g-host', { action: 'style', card: 'card-founder', glow: 'glow-ember' }, '', at);
  assert.equal(r.profile.cd, 'card-founder'); assert.equal(r.profile.g, 'glow-ember');
  await rejects(profileAction('g-host', { action: 'style', card: 'card-house' }, '', at), 403, 'locked');
  await rejects(profileAction('g-host', { action: 'style', card: 'glow-ember' }, '', at), 403, 'locked');   // a glow is not a card
  assert.equal((await profileAction('g-host', { action: 'style', card: '' }, '', at)).profile.cd, null, 'back to the default GILDED');
  assert.equal((await profileAction('g-two', { action: 'style', card: 'card-gilded' }, '', at)).profile.cd, 'card-gilded', 'the GILDED is everyone’s');
});

test('EVENTS: the knock (once), THE WATCHER’s hour on the server’s clock, the REAL weather where the phone is', async () => {
  const at = NOW + 10 * DAY;
  const pid = await val('uids/g-host');
  const k = await progressEvent(pid, 'knock', {}, at);
  assert.deepEqual(k.ach, ['knock-knock']);
  assert.deepEqual((await progressEvent(pid, 'knock', {}, at + 1)).ach, [], 'a second knock is nothing');
  assert.equal((await progressEvent(pid, 'watch', {}, at)).why, 'not_yet');
  await progressEvent(pid, 'watchStart', {}, at);
  assert.equal((await progressEvent(pid, 'watch', {}, at + 30 * 60e3)).why, 'not_yet', 'half an hour is not the hour');
  assert.deepEqual((await progressEvent(pid, 'watch', {}, at + 56 * 60e3)).ach, ['patience-pays']);
  // the weather: the server's own answer (a fake skyFor) — a storm right after a match
  const sky = kind => async () => ({ kind });
  assert.deepEqual((await progressEvent(pid, 'weather', { place: { key: 'x' }, skyFor: sky('storm') }, at + 2000)).ach, ['rainmaker']);
  assert.equal((await progressEvent(pid, 'weather', { place: { key: 'x' }, skyFor: sky('snow') }, at + 4 * 3600e3)).why, 'no_match', 'no match in the last 3 h');
  await rejects(profileAction('g-host', { action: 'event', ev: 'sighting' }, '', at), 400, 'bad_event');   // PROGRESSION B's — not from a phone yet
});

test('THE FOUNDER WINDOW: the owner’s switch (server-checked, audited); a crew member or a stranger can’t; closing sweeps', async () => {
  const at = NOW + 11 * DAY;
  const boss = await ensure('g-boss', 'Boss', at), pal = await ensure('g-pal', 'Pal', at);
  await ref(`radio/crew/${pal.pid}`).set({ at, by: boss.pid });
  await rejects(adminAction('g-pal', { action: 'radioFounder', open: false }, at), 403, 'not_owner');
  await rejects(adminAction('g-two', { action: 'radioFounder', open: false }, at), 403, 'not_radio');
  // a player who played before PROGRESSION A existed (no card yet) — the sweep must catch them
  const old = await ensure('g-old', 'Oldie', at);
  await ref(`pstats/${old.pid}`).set({ xp: 300, g: { prism: { p: 2 } } });
  process.env.ADMIN_PIDS = boss.pid;
  try {
    const L = await adminAction('g-boss', { action: 'radioLedger' }, at);
    assert.equal(L.founder.open, true, 'OPEN by default');
    const r = await adminAction('g-boss', { action: 'radioFounder', open: false }, at);
    assert.equal(r.founder.open, false); assert.equal(r.founder.swept, 1);
    assert.ok((await val(`pstats/${old.pid}/it`))['card-founder'] && (await val(`profiles/${old.pid}`)).fd);
    const log = Object.values((await val('audit')) || {});
    assert.ok(log.some(x => x.act === 'founderClose' && x.by === boss.pid));
    // closed: a new player's first match gets no FOUNDING MEMBER
    await ensure('g-late', 'Late', at); await ensure('g-late2', 'Late2', at);
    const room = await seedRoom('prism', ['g-late', 'g-late2'], at + 60e3);
    const rep = await processReport('g-late', room, at + 61e3);
    assert.ok(!rep.outcome.items.includes('card-founder'));
    assert.ok(!((await val(`pstats/${await val('uids/g-late')}/it`)) || {})['card-founder'], 'closed means closed');
    // reopen (the switch goes both ways until launch)
    assert.equal((await adminAction('g-boss', { action: 'radioFounder', open: true }, at)).founder.open, true);
  } finally { process.env.ADMIN_PIDS = ''; }
});

// THE VAULT 1B — ITEM NAMES ONLY TO OWNERS: /api/profile 'me' (through the route's withShow) describes exactly what the player owns + holds
test('NAMES ONLY TO OWNERS: me → show = display rows for the owned items + the held achievements, nothing else', async () => {
  const { withShow } = await import('../../api/_lib/catalog.js');
  const r = withShow(await profileAction('g-host', { action: 'me' }, '', NOW + 9e6));
  const owned = Object.keys(r.stats.it || {}).sort(), held = Object.keys(r.stats.ac || {}).sort();
  assert.ok(owned.length >= 3 && r.show, `${owned.length} owned`);
  // (the public items — the GILDED + THE VAULT 2C's 12 sign-up shapes, every member's — ship with the site: no show rows needed)
  const { STARTER } = await import('../../js/core/items.js');
  assert.deepEqual(Object.keys(r.show.items).sort(), owned.filter(id => !STARTER.includes(id) || r.show.items[id]));
  assert.deepEqual(Object.keys(r.show.ach).sort(), held);
  assert.ok(!r.show.items['card-house'] && !r.show.items['card-sg-tr3b'], 'never an item the player doesn\'t own');
  for (const a of Object.values(r.show.ach)) assert.ok(!('check' in a));
});
