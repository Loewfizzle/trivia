// THE DAILY MODULE — THE ENGINE on the emulators (DM1 — /api, no browser; docs/progression.md "THE DAILY MODULE"):
//   PLUG-AND-PLAY (a FAKE 3rd + 4th daily join the live list, `today`, the picker, THE SWEEP + the XP cap with no other change) · THE 4 AM
//   PICKER (the day's set stored once, two first calls → one day) · THE THROWAWAY GATE (3:59 counts, 4:01 doesn't — until tomorrow; a
//   throwaway's perfect run awards nothing and is missing from the band + YOUR TABLE) · the IP cap on new profiles · THE CALL BUDGET ·
//   THE ROOM WINS (a pause only for a room that really started a game) + the mid-daily read · THE GO-LIVE SWITCH (off → production refuses,
//   on → they answer, DAILY_TEST still works).
//   cd tests/integration && node --test daily-module.test.mjs        (the emulators running)
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
import { dailyAction, countsOn, CALLS } from '../../api/daily.js';
import { adminAction } from '../../api/admin.js';
import { FAKE_DAILY, registerTestDaily, removeTestDaily, clearSwitchCache, forgetPicks, pickDay, SWITCH_PATH, loadDailies } from '../../api/_lib/dailies.js';
import { wordsFor, forgetPwDays, SCHED_PATH } from '../../api/_lib/pw.js';
import { forgetBoards } from '../../api/_lib/cc-board.js';
import { NEW_PROFILES } from '../../api/_lib/profiles.js';
import { todaysDailies, dailyOf, DAILY_XP, SWEEP_XP } from '../../js/core/daily.js';
import { streakDay, dayStartAt, dayNum, dayOf } from '../../js/core/streak.js';
import { DAILIES } from '../../js/config.js';

const NOW = Date.UTC(2026, 10, 10, 1, 0, 0);   // Mon Nov 9 2026, 8 pm Eastern
const DAY = 86_400_000, WEEK_AGO = NOW - 7 * DAY;
const day = streakDay(NOW);
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'dly', 'dsched', 'pcount', 'streak', 'progress', 'pfr', 'seats', 'dsecret'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); forgetPicks(); forgetPwDays(); forgetBoards(); clearSwitchCache(); loadDailies(); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = WEEK_AGO, ip = '') => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, ip, at);
const D = (uid, body, at) => dailyAction(uid, body, at);
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} (${e.message})`); if (code) assert.equal(e.code, code); return e; }
  assert.fail(`expected ${status} ${code}`);
};
const pidOf = uid => val(`uids/${uid}`);
/** a perfect run of THE FAKE DAILY (or a test-registered one built on it) */
async function perfect(uid, game, at) {
  const s = await D(uid, { action: 'start', game }, at);
  return D(uid, { action: 'finish', game, result: { guess: FAKE_DAILY.target(s.seed) } }, at + 1000);
}
const fakeCart = id => ({ ...FAKE_DAILY, id, name: id.toUpperCase() });

test('PLUG-AND-PLAY: a FAKE 3rd + 4th daily join the live list, `today`, the picker, THE SWEEP + the XP cap — no other code change; one removed → the sweep needs one fewer', async () => {
  await ensure('m-ann', 'Ann');
  assert.deepEqual(todaysDailies(), ['password', 'coastclear', 'test'], 'under DAILY_TEST: the list + the fake');
  let loaded = [];
  registerTestDaily({ order: 3 }, { ...fakeCart('fake3'), load: d => { loaded.push(`fake3:${d}`); return null; } });
  registerTestDaily({ order: 4 }, { ...fakeCart('fake4'), load: d => { loaded.push(`fake4:${d}`); return null; } });
  // the two real ones taken off the list for the sweep (the list drives it: a row switched off is gone)
  const rows = DAILIES.filter(r => r.id === 'password' || r.id === 'coastclear');
  for (const r of rows) r.on = false;
  try {
    const t0 = await D('m-ann', { action: 'today' }, NOW);
    assert.deepEqual(t0.dailies.map(d => d.id), ['fake3', 'fake4', 'test'], 'the live list in order (the test fake has no row → last)');
    assert.ok(t0.dailies.every(d => d.ticket && typeof d.lesson === 'boolean'));
    let xp = 0, last = null;
    for (const g of ['fake3', 'fake4', 'test']) { last = await perfect('m-ann', g, NOW + xp * 10); xp += last.outcome.xp.total; assert.equal(last.outcome.swept, g === 'test', `${g}: the sweep only on the last of three`); }
    assert.ok(loaded.includes(`fake3:${day}`) && loaded.includes(`fake4:${day}`), 'THE 4 AM PICKER fixed their day too');
    assert.equal(xp, 3 * DAILY_XP + SWEEP_XP, 'the XP cap: one credit per daily on the list (+ DM2: the sweep bonus once)');
    assert.ok(last.outcome.ach.includes('the-triple'), 'THE SWEEP (the-triple)');
    const prof = await val(`profiles/${await pidOf('m-ann')}`);
    assert.equal(prof.x, 3 * DAILY_XP + SWEEP_XP, 'the daily XP lands on the public profile');
    // one removed → two to sweep tomorrow
    removeTestDaily('fake4');
    assert.deepEqual(todaysDailies(), ['fake3', 'test']);
    await ensure('m-bea', 'Bea');
    const a = await perfect('m-bea', 'fake3', NOW + 5e3), b = await perfect('m-bea', 'test', NOW + 9e3);
    assert.equal(a.outcome.swept, false); assert.equal(b.outcome.swept, true);
  } finally {
    for (const r of rows) r.on = true;
    removeTestDaily('fake3'); removeTestDaily('fake4'); loadDailies();
  }
  assert.deepEqual(todaysDailies(), ['password', 'coastclear', 'test']);
});

test('THE 4 AM PICKER: the day\'s set stored ONCE for every daily (the pair, the board); two first calls at once → ONE day; the frozen schedule = the formula while the list is untouched', async () => {
  const d1 = dayOf(dayNum(day) + 3);
  forgetPicks(); forgetPwDays(); forgetBoards();
  await Promise.all([pickDay(d1, NOW + 3 * DAY), pickDay(d1, NOW + 3 * DAY)]);
  forgetPicks(); forgetPwDays(); forgetBoards();
  await pickDay(d1, NOW + 3 * DAY);
  const pw = await val(`dly/password/${d1}/b`), cc = await val(`dly/coastclear/${d1}/b`);
  assert.ok(pw && pw.v === 1 && /^[A-Z]{5},[A-Z]{5}$/.test(pw.w), 'THE PASSWORD\'s pair, stored');
  assert.equal(pw.w, (await wordsFor(d1)).join(','), 'the frozen schedule = the formula (untouched list)');
  assert.ok(cc && cc.v === 1 && cc.l, 'COAST CLEAR\'s board, stored');
  const sched = await val(SCHED_PATH);
  assert.ok(sched && sched.v === 1 && sched.s.split(',').length >= 1000 && sched.h, 'THE FROZEN SCHEDULE, server-only');
  // a later list edit can't move a stored day: the stored pair wins
  await ref(`dly/password/${d1}/b`).set({ v: 1, w: 'ABOUT,CRANE' });
  forgetPwDays();
  const { pwDay } = await import('../../api/_lib/pw.js');
  assert.deepEqual((await pwDay(d1)).words, ['ABOUT', 'CRANE']);
  await ref(`dly/password/${d1}/b`).remove(); forgetPwDays();
});

test('THE THROWAWAY GATE: a profile made at 3:59 counts that day, one made at 4:01 doesn\'t (until tomorrow); its perfect run awards nothing, out of the band + YOUR TABLE; the streak + the XP as usual', async () => {
  const d = 'd20261111', start = dayStartAt(d);
  assert.equal(new Date(start).toISOString(), '2026-11-11T09:00:00.000Z', '4 am Eastern (EST) = 09:00 UTC');
  assert.equal(new Date(dayStartAt('d20260701')).toISOString(), '2026-07-01T08:00:00.000Z', 'summer time: 08:00 UTC');
  assert.equal(countsOn(start - 60e3, d), true); assert.equal(countsOn(start + 60e3, d), false); assert.equal(countsOn(null, d), true, 'an old profile with no creation time counts');
  const PLAY = start + 6 * 3600e3;   // 10 am Eastern that day
  await ensure('g-early', 'Early', start - 60e3);   // 3:59 am
  await ensure('g-late', 'Late', start + 60e3);     // 4:01 am
  const early = await perfect('g-early', 'test', PLAY);
  assert.equal(early.counted, true); assert.equal(early.stand.n, 1);
  const late = await perfect('g-late', 'test', PLAY + 5e3);
  assert.equal(late.counted, false, 'the 4:01 profile: does not count today');
  assert.equal(late.score, 1000, 'its own score is kept + shown');
  assert.equal(late.stand.band, null); assert.equal(late.stand.n, 2, 'shown where it WOULD stand');
  assert.equal(await val(`dly/test/${d}/n`), 1, 'out of the histogram');
  assert.equal(await val(`dly/test/${d}/x/${await pidOf('g-late')}`), 1);
  assert.equal(late.countsFrom, dayStartAt('d20261112'), 'counts from tomorrow\'s 4 am');
  assert.equal(late.outcome.streak.n, 1, 'the streak as usual'); assert.equal(late.outcome.xp.total, DAILY_XP, 'the XP as usual');
  assert.deepEqual(late.outcome.ach, [], 'no reward');
  // one try, whatever the gate said
  const again = await perfect('g-late', 'test', PLAY + 9e3);
  assert.equal(again.again, true); assert.equal(again.counted, false);
  // YOUR TABLE: the throwaway's result is missing for a friend; the early one's is there
  await ensure('g-pal', 'Pal');
  const [pal, e, l] = await Promise.all([pidOf('g-pal'), pidOf('g-early'), pidOf('g-late')]);
  await ref('pfr').update({ [`${pal}/f/${e}`]: NOW, [`${e}/f/${pal}`]: NOW, [`${pal}/f/${l}`]: NOW, [`${l}/f/${pal}`]: NOW });
  await perfect('g-pal', 'test', PLAY + 20e3);
  const t = await D('g-pal', { action: 'today', pids: [e, l] }, PLAY + 30e3);
  assert.deepEqual(t.friends[e], { test: { score: 1000 } });
  assert.deepEqual(t.friends[l], {}, 'the throwaway\'s result: missing from YOUR TABLE');
  const own = await D('g-late', { action: 'today' }, PLAY + 30e3);
  assert.equal(own.mine.test, 1000); assert.equal(own.gated.test, true, 'the player sees their own score (+ that it doesn\'t count)');
  // tomorrow it counts
  const next = await perfect('g-late', 'test', PLAY + DAY);
  assert.equal(next.counted, true); assert.equal(next.outcome.streak.n, 2);
});

test('THE THROWAWAY GATE on a real daily: a same-day profile cracks THE PASSWORD in two — no KEYHOLE, no SAFECRACKER, no band', async () => {
  const d = streakDay(NOW), at = NOW;
  await ensure('g-crack', 'Cracker', dayStartAt(d) + 3600e3);   // made today
  const [W1, W2] = await wordsFor(d);
  await D('g-crack', { action: 'start', game: 'password' }, at);
  await D('g-crack', { action: 'guess', game: 'password', word: W1 }, at + 1e3);
  await D('g-crack', { action: 'guess', game: 'password', word: W2 }, at + 2e3);
  const f = await D('g-crack', { action: 'finish', game: 'password', result: null }, at + 3e3);
  assert.equal(f.counted, false); assert.equal(f.score, 2);
  assert.deepEqual(f.outcome.ach, [], 'a perfect run by a throwaway: nothing');
  const st = await val(`pstats/${await pidOf('g-crack')}`);
  assert.ok(!(st.pa && st.pa.gf), 'no flags kept'); assert.ok(!(st.it && (st.it['emb-keyhole'] || st.it['card-safecracker'])));
  assert.equal(await val(`dly/password/${d}/n`), null, 'out of the day\'s finishers');
});

test('the IP cap on new profiles: NEW_PROFILES.ip a day from one address, then 429; another address + a loopback are fine', async () => {
  const IP = '203.0.113.9';
  for (let i = 0; i < NEW_PROFILES.ip; i++) await ensure(`ip-${i}`, `Guest${i}`, NOW, IP);
  await rejects(ensure('ip-over', 'Over', NOW, IP), 429, 'too_many_profiles');
  assert.equal(await val('uids/ip-over'), null, 'nothing made');
  assert.ok((await ensure('ip-other', 'Other', NOW, '198.51.100.4')).pid);
  assert.ok((await ensure('ip-local', 'Local', NOW, '127.0.0.1')).pid && (await ensure('ip-local6', 'Local6', NOW, '::1')).pid);
  // an existing profile coming back from the same address is never stopped
  assert.ok((await ensure('ip-3', 'Guest3', NOW + 1000, IP)).pid);
  // the next day: the address may make new ones again
  assert.ok((await ensure('ip-tomorrow', 'Tomorrow', NOW + DAY + 1000, IP)).pid);
});

test('THE CALL BUDGET: a flood is refused (429 slow_down); the window resets', async () => {
  await ensure('c-flood', 'Flood');
  const T = NOW + 2 * DAY;
  for (let i = 0; i < CALLS.max; i++) await D('c-flood', { action: 'today' }, T + i);
  await rejects(D('c-flood', { action: 'today' }, T + CALLS.max), 429, 'slow_down');
  assert.ok(await D('c-flood', { action: 'today' }, T + CALLS.windowMs + 1));
  assert.ok(CALLS.max >= 3 * 110, 'room for both dailies played through with retries + refreshes (a COAST CLEAR run ≈ 50–110 calls, a PASSWORD run ≤ 15)');
});

test('THE ROOM WINS: a pause only while the player\'s room has REALLY started a game; the mid-daily read names uids only', async () => {
  const T = NOW + 4 * DAY;
  await ensure('r-ann', 'RoomAnn'); await ensure('r-bob', 'RoomBob');
  const pa = await pidOf('r-ann'), pb = await pidOf('r-bob');
  await D('r-ann', { action: 'start', game: 'coastclear' }, T);
  // no room at all → refused, the clock running
  await rejects(D('r-ann', { action: 'pause', game: 'coastclear' }, T + 1e3), 409, 'no_room_game');
  // a room in the LOBBY → refused
  await ref('rooms/DMXX').set({ meta: { hostId: 'r-bob', status: 'lobby', createdAt: T }, players: { 'r-ann': { name: 'RoomAnn', pid: pa }, 'r-bob': { name: 'RoomBob', pid: pb } } });
  await rejects(D('r-ann', { action: 'pause', game: 'coastclear', room: 'DMXX' }, T + 2e3), 409, 'no_room_game');
  // a room that started — but she isn't in it → refused
  await ref('rooms/DMYY').set({ meta: { hostId: 'x', status: 'playing', createdAt: T }, players: { x: { name: 'X' } } });
  await rejects(D('r-ann', { action: 'pause', game: 'coastclear', room: 'DMYY' }, T + 3e3), 409, 'no_room_game');
  // THE GAME START's stamp (the walk inside): accepted
  await ref('rooms/DMXX/meta/go').set({ at: T + 3500, m: 'm1', g: 'overclock' });
  const p = await D('r-ann', { action: 'pause', game: 'coastclear', room: 'DMXX' }, T + 4e3);
  assert.equal(p.paused, true);
  await D('r-ann', { action: 'resume', game: 'coastclear' }, T + 30e3);
  // a stale stamp alone (the game long over, the room back in the lobby) → refused
  await rejects(D('r-ann', { action: 'pause', game: 'coastclear', room: 'DMXX' }, T + 10 * 60e3), 409, 'no_room_game');
  // status 'playing', the room from the SEAT (no code in the call)
  await ref('rooms/DMXX/meta/status').set('playing');
  await ref(`seats/${pa}`).set({ code: 'DMXX', uid: 'r-ann', at: T });
  assert.equal((await D('r-ann', { action: 'pause', game: 'coastclear' }, T + 11 * 60e3)).paused, true);
  // the mid-daily read: Ann (a run in flight) — never Bob (none); only someone in the room may ask; nothing about the run
  const m = await D('r-bob', { action: 'room', room: 'DMXX' }, T + 11 * 60e3);
  assert.deepEqual(m, { mid: ['r-ann'] });
  await rejects(D('r-bob', { action: 'room', room: 'DMYY' }, T + 11 * 60e3), 403, 'not_in_room');
  // THE PASSWORD has nothing to pause
  await D('r-bob', { action: 'start', game: 'password' }, T);
  await rejects(D('r-bob', { action: 'pause', game: 'password', room: 'DMXX' }, T + 12 * 60e3), 400, 'bad_action');
  assert.deepEqual((await D('r-ann', { action: 'room', room: 'DMXX' }, T + 12 * 60e3)).mid, ['r-ann', 'r-bob']);
});

test('THE GO-LIVE SWITCH: off → production refuses every daily; on (the owner, audited) → they answer (never the fake); DAILY_TEST still works', async () => {
  const T = NOW + 6 * DAY;
  await ensure('s-own', 'Owner'); await ensure('s-pat', 'Patron');
  const own = await pidOf('s-own');
  const saved = process.env.DAILY_TEST;
  process.env.DAILY_TEST = '';
  clearSwitchCache();
  try {
    for (const g of ['password', 'coastclear', 'test']) await rejects(D('s-pat', { action: 'start', game: g }, T), 404, 'no_daily');
    assert.deepEqual((await D('s-pat', { action: 'today' }, T)).dailies, [], 'nothing live');
    // only the owner flips it
    await rejects(adminAction('s-pat', { action: 'dailySwitch', on: true }, T), 403, 'not_admin');
    process.env.ADMIN_PIDS = own;
    const on = await adminAction('s-own', { action: 'dailySwitch', on: true }, T);
    assert.equal(on.dailies.on, true); assert.deepEqual(on.dailies.live, ['password', 'coastclear']);
    assert.equal((await val(SWITCH_PATH)).by, own);
    assert.ok(Object.values((await val('audit')) || {}).some(a => a.act === 'dailiesOn'), 'audited');
    assert.ok((await D('s-pat', { action: 'start', game: 'password' }, T + 1e3)).run, 'ON: THE PASSWORD answers');
    assert.ok((await D('s-pat', { action: 'start', game: 'coastclear' }, T + 2e3)).run, 'ON: COAST CLEAR answers');
    await rejects(D('s-pat', { action: 'start', game: 'test' }, T + 3e3), 404, 'no_daily');
    // FRESH is refused while the switch is ON
    await rejects(adminAction('s-own', { action: 'dailyFresh', confirm: true, typed: 'FRESH' }, T), 409, 'switch_on');
    const off = await adminAction('s-own', { action: 'dailySwitch', on: false }, T + 4e3);
    assert.equal(off.dailies.on, false); assert.deepEqual(off.dailies.live, []);
    await rejects(D('s-pat', { action: 'guess', game: 'password', word: 'ABOUT' }, T + 5e3), 404, 'no_daily');
    // FRESH (off): a dry run, then the wipe — every stored day + the frozen schedule
    assert.equal((await adminAction('s-own', { action: 'dailyFresh' }, T)).dryRun, true);
    assert.ok(await val('dly'));
    await adminAction('s-own', { action: 'dailyFresh', confirm: true, typed: 'FRESH' }, T + 6e3);
    assert.equal(await val('dly'), null); assert.equal(await val('dsched'), null);
  } finally {
    process.env.DAILY_TEST = saved; process.env.ADMIN_PIDS = ''; clearSwitchCache();
  }
  // DAILY_TEST: open again whatever the switch says
  assert.ok((await D('s-pat', { action: 'start', game: 'test' }, T + 7e3)).seed != null);
  assert.ok(dailyOf('password') && dailyOf('coastclear'));
});

// ---------------------------------------------------------------- DM1 ADD-ON — THE DAILY SECRET + THE RESEED
import { reseedDailies, dailySecret, dailyKeys, clearSecretCache, BASE_DAY, SECRET_PATH } from '../../api/_lib/daily-secret.js';
import { reseedSchedule, pwDay } from '../../api/_lib/pw.js';
import { ccBoard } from '../../api/_lib/cc.js';
import { buildBoard } from '../../api/_lib/cc-board.js';
import { keyHash } from '../../api/_lib/profiles.js';

test('THE DAILY SECRET is its own (never the pepper): the days come from it; it lives only in the database', async () => {
  const k = await dailyKeys(NOW);
  assert.ok(k[BASE_DAY] && /^[0-9a-f]{64}$/.test(k[BASE_DAY]), 'a random base key, made + stored once');
  assert.notEqual(k[BASE_DAY], fb().pepper);
  assert.equal((await val(SECRET_PATH)).k[BASE_DAY], k[BASE_DAY]);
  forgetBoards();
  assert.deepEqual((await ccBoard(day)).lights, buildBoard(day, k[BASE_DAY]).board.lights, 'COAST CLEAR\'s board = the daily secret\'s');
  assert.notDeepEqual(buildBoard(day, fb().pepper).board.lights, buildBoard(day, k[BASE_DAY]).board.lights, '… not the pepper\'s');
});

test('THE RESEED: a new key from the NEXT 4 am — past days + today unchanged, tomorrow differs, nothing using the pepper changes; safe twice; a dry run writes nothing', async () => {
  const T = NOW + 8 * DAY, today = streakDay(T), past = dayOf(dayNum(today) - 2), tomorrow = dayOf(dayNum(today) + 1);
  forgetPicks(); forgetPwDays(); forgetBoards(); clearSecretCache();
  // a past day + today built (+ a result on today's), tomorrow only computed (never built before its day)
  await ensure('rs-ann', 'Reseeder');
  const pastPw = (await pwDay(past, T)).words, todayPw = (await pwDay(today, T)).words;
  const pastCc = (await ccBoard(past)).lights, todayCc = (await ccBoard(today)).lights;
  await perfect('rs-ann', 'test', T);
  const resBefore = await val(`dly/test/${today}/r/${await pidOf('rs-ann')}`);
  const seedTomorrow = await (await import('../../api/_lib/dailies.js')).dailySeed('test', tomorrow);
  const tomorrowCc = buildBoard(tomorrow, await dailySecret(tomorrow, T)).board.lights;
  const sched0 = (await val(SCHED_PATH)).s.split(',');
  const tIdx = dayNum(tomorrow) - dayNum('d20261101');
  const tomorrowPw = [sched0[2 * tIdx], sched0[2 * tIdx + 1]];
  const pepper = fb().pepper, kh = keyHash('ABCD-EFGH-IJKL');
  // a stray stored future day (a clock skew) — dropped
  await ref(`dly/coastclear/${tomorrow}/b`).set({ v: 1, stray: true });
  const hooks = { games: ['password', 'coastclear', 'test'], schedule: reseedSchedule };
  // the dry run: the plan, nothing written
  const dry = await reseedDailies({ now: T, dryRun: true, hooks });
  assert.equal(dry.dryRun, true); assert.equal(dry.from, tomorrow);
  assert.equal((await dailyKeys(T))[tomorrow], undefined); assert.deepEqual((await val(SCHED_PATH)).s.split(','), sched0);
  // the reseed
  const r = await reseedDailies({ now: T, hooks });
  assert.equal(r.changed, true); assert.ok(r.steps.length >= 3, r.steps.join(' | '));
  forgetPicks(); forgetPwDays(); forgetBoards(); clearSecretCache();
  assert.deepEqual((await pwDay(past, T)).words, pastPw, 'a past day: unchanged'); assert.deepEqual((await pwDay(today, T)).words, todayPw, 'today: unchanged');
  assert.deepEqual((await ccBoard(past)).lights, pastCc); assert.deepEqual((await ccBoard(today)).lights, todayCc);
  assert.equal(await val(`dly/test/${today}/r/${await pidOf('rs-ann')}`), resBefore, 'today\'s result untouched');
  const sched1 = (await val(SCHED_PATH)).s.split(',');
  assert.deepEqual(sched1.slice(0, 2 * tIdx), sched0.slice(0, 2 * tIdx), 'the schedule through today kept word for word');
  assert.deepEqual([...sched1].sort(), [...sched0].sort(), 'the same words — none lost, none added');
  assert.notDeepEqual((await pwDay(tomorrow, T + DAY)).words, tomorrowPw, 'tomorrow\'s PASSWORD differs');
  assert.equal(await val(`dly/coastclear/${tomorrow}/b/stray`), null, 'the stray future day dropped');
  assert.notDeepEqual((await ccBoard(tomorrow)).lights, tomorrowCc, 'tomorrow\'s harbor differs');
  assert.notEqual(await (await import('../../api/_lib/dailies.js')).dailySeed('test', tomorrow), seedTomorrow, 'tomorrow\'s seed differs');
  assert.equal(fb().pepper, pepper, 'the pepper: untouched'); assert.equal(keyHash('ABCD-EFGH-IJKL'), kh, 'a restore key still hashes the same');
  // twice: nothing
  const again = await reseedDailies({ now: T, hooks });
  assert.equal(again.changed, false); assert.match(again.steps[0], /already reseeded/);
  assert.deepEqual((await val(SCHED_PATH)).s.split(','), sched1);
});

test('DM2 ADD-ON — THE RESEED from /admin (server-side — no key on a PC): owner only; no confirm = the dry run (nothing written); confirm = a key from the next 4 am, audited; a second run changes nothing', async () => {
  const T = NOW + 20 * DAY, tomorrow = dayOf(dayNum(streakDay(T)) + 1);
  forgetPicks(); forgetPwDays(); forgetBoards(); clearSecretCache();
  await ensure('ar-own', 'Owner'); await ensure('ar-pat', 'Patron');
  const own = await pidOf('ar-own');
  try {
    await rejects(adminAction('ar-pat', { action: 'dailyReseed', confirm: true }, T), 403, 'not_admin');
    process.env.ADMIN_PIDS = own;
    const dry = (await adminAction('ar-own', { action: 'dailyReseed' }, T)).reseed;
    assert.equal(dry.dryRun, true); assert.equal(dry.from, tomorrow); assert.ok(dry.steps.length >= 1);
    assert.equal((await dailyKeys(T))[tomorrow], undefined, 'the dry run wrote nothing');
    const r = (await adminAction('ar-own', { action: 'dailyReseed', confirm: true }, T)).reseed;
    assert.equal(r.changed, true); assert.ok((await dailyKeys(T))[tomorrow], 'a key from the next 4 am');
    assert.ok(Object.values((await val('audit')) || {}).some(a => a.act === 'dailyReseed'), 'audited');
    const again = (await adminAction('ar-own', { action: 'dailyReseed', confirm: true }, T)).reseed;
    assert.equal(again.changed, false, 'safe twice');
  } finally { process.env.ADMIN_PIDS = ''; clearSecretCache(); }
});

test('DM2 — `today` for the screens: answered with no profile (the list only), started (IN PROGRESS) · lessons · countsFrom; `lesson` remembers a lesson ONCE per player (refused for a daily without one)', async () => {
  const T = NOW + 30 * DAY;
  const anon = await D('dm2-anon', { action: 'today' }, T);
  assert.equal(anon.noProfile, true); assert.ok(anon.dailies.length >= 1 && anon.dailies.every(d => d.better && 'hook' in d), 'the list + better + hook');
  await ensure('dm2-ann', 'Ann');
  await D('dm2-ann', { action: 'start', game: 'test' }, T);
  let t = await D('dm2-ann', { action: 'today' }, T + 1e3);
  assert.equal(t.started.test, true, 'a start with no score = IN PROGRESS'); assert.deepEqual(t.lessons, {});
  await rejects(D('dm2-ann', { action: 'lesson', game: 'password' }, T), 400, 'no_lesson');
  assert.deepEqual(await D('dm2-ann', { action: 'lesson', game: 'coastclear' }, T), { ok: true });
  t = await D('dm2-ann', { action: 'today' }, T + 2e3);
  assert.equal(t.lessons.coastclear, 1, 'seen — on the profile (every device)');
});

// ---------------------------------------------------------------- DFIX2 — THE DAILIES FIX PASS (FABLE REVIEW #2 — docs/games/review-dailies-2.md)
import { closeDays, closeDay, forgetClosed, LOOK_BACK } from '../../api/_lib/daily-close.js';
import { MIN_PARTY } from '../../api/_lib/daily-room.js';
import { penthouseCut } from '../../js/core/daily.js';
import { secretOf } from '../../api/_lib/daily-secret.js';

test('DFIX2 finding 1 (MUST FIX): a run that crossed 4 am finishes on YESTERDAY after today\'s finishes — BOTH days keep THE SWEEP, PERFECT WEEK\'s run grows (the review\'s three-daily timeline, over /api)', async () => {
  const rows = DAILIES.filter(r => r.id === 'password' || r.id === 'coastclear');
  for (const r of rows) r.on = false;
  registerTestDaily({ order: 3 }, fakeCart('fa')); registerTestDaily({ order: 4 }, fakeCart('fb'));
  try {
    assert.deepEqual(todaysDailies(), ['fa', 'fb', 'test']);
    const A = 'd20261120', B = 'd20261121';                       // day A (Fri Nov 20) · day B
    const tenPmA = dayStartAt(A) + 18 * 3600e3, lateA = dayStartAt(B) - 10 * 60e3, earlyB = dayStartAt(B) + 5 * 60e3;   // 10 pm · 3:50 am · 4:05 am
    await ensure('x4-ann', 'Crosser');
    const pid = await pidOf('x4-ann');
    await perfect('x4-ann', 'fa', tenPmA); await perfect('x4-ann', 'fb', tenPmA + 60e3);
    const s = await D('x4-ann', { action: 'start', game: 'test' }, lateA);           // 3:50 am: the run starts on day A …
    assert.equal(s.day, A);
    await perfect('x4-ann', 'fa', earlyB); const fb = await perfect('x4-ann', 'fb', earlyB + 60e3);   // 4:05 / 4:06: day B's two
    assert.equal(fb.outcome.swept, false);
    // RESUME (finding 7): yesterday's run still in flight reads started on `today` + its day
    const t = await D('x4-ann', { action: 'today' }, earlyB + 2 * 60e3);
    assert.equal(t.started.test, true, 'yesterday\'s unfinished run → RESUME, not PLAY'); assert.equal(t.startedDay.test, A);
    assert.equal(t.started.fa, undefined);
    // 4:10: the run from 3:50 finishes on ITS day (DFIX1) → day A swept; day B's two finishes KEPT
    const fin = await D('x4-ann', { action: 'finish', game: 'test', day: A, result: { guess: FAKE_DAILY.target(s.seed) } }, earlyB + 5 * 60e3);
    assert.equal(fin.day, A); assert.equal(fin.outcome.swept, true, 'day A swept (was: swept false — dl.day replaced)');
    let st = await val(`pstats/${pid}`);
    assert.deepEqual(st.dl.days[B].g, { fa: 1, fb: 1 }, 'day B\'s finishes survive yesterday\'s late finish (were wiped)');
    const t2 = await D('x4-ann', { action: 'today' }, earlyB + 6 * 60e3);
    assert.equal(t2.started.test, undefined, 'scored → PLAY today\'s');
    // 4:15: today's test → day B swept too
    const last = await perfect('x4-ann', 'test', earlyB + 10 * 60e3);
    assert.equal(last.outcome.swept, true); assert.equal(last.outcome.run, 2, 'PERFECT WEEK\'s run: 2');
    st = await val(`pstats/${pid}`);
    assert.equal(st.dl.sw, 2); assert.deepEqual(st.dl.sr, { d: B, n: 2 }); assert.ok(st.ac && st.ac['the-triple'], 'THE SWEEP awarded');
    assert.equal(Object.keys(st.m).filter(k => k.startsWith('daily_')).length, 6, 'every finish counted once');
    assert.equal(st.xp, 6 * DAILY_XP + 2 * SWEEP_XP, 'the XP: six dailies + two sweeps');
  } finally {
    for (const r of rows) r.on = true;
    removeTestDaily('fa'); removeTestDaily('fb'); loadDailies();
  }
});

test('DFIX2 finding 2 → decision 2 — PENTHOUSE at THE DAY\'S CLOSE: the first call after 4 am closes yesterday ONCE; the early best wins, a rank-1-at-50 who drops out loses, two racing closers grant once, 49 finishers award nobody, a week of silence closes every day', async () => {
  const T = NOW + 40 * DAY, day = streakDay(T), tomorrow = dayOf(dayNum(day) + 1), after = dayStartAt(tomorrow) + 60e3;   // 4:01 am the next day
  forgetClosed();
  // the review's probe: 60 established profiles — #1 = 950 (the day's early best), #2–#49 = 500, #50 = 950, #51 = 1000, #52–#60 = 500
  const score = i => (i === 1 || i === 50 ? 950 : i === 51 ? 1000 : 500);
  const pids = [];
  for (let i = 1; i <= 60; i++) {
    const uid = `ph-${i}`; await ensure(uid, `Guest${i}`); pids.push(await pidOf(uid));
    const s = await D(uid, { action: 'start', game: 'test' }, T + i * 1000);
    const g = FAKE_DAILY.target(s.seed), want = score(i);
    const off = 1000 - want, guess = g + off <= 999 ? g + off : g - off;   // (a guess stays 0–999: the fake refuses one outside)
    const f = await D(uid, { action: 'finish', game: 'test', result: { guess } }, T + i * 1000 + 500);
    assert.equal(f.score, want);
    assert.ok(!(f.outcome.ach || []).includes('penthouse-suite'), `#${i}: nothing at finish time (was: #50 + #51)`);
  }
  // a same-day profile with the best score of all: never counted, never a winner
  await ensure('ph-throw', 'Throwaway', dayStartAt(day) + 60e3);
  const ts = await D('ph-throw', { action: 'start', game: 'test' }, T + 70e3);
  assert.equal((await D('ph-throw', { action: 'finish', game: 'test', result: { guess: FAKE_DAILY.target(ts.seed) } }, T + 71e3)).counted, false);
  assert.equal(await val(`dly/test/${day}/c`), null, 'nothing closed before 4 am');
  // the day's first call after 4 am (a `today` from the title) closes yesterday — two at once: ONE grant
  await Promise.all([D('ph-1', { action: 'today' }, after), D('ph-2', { action: 'today' }, after + 1)]);
  const c = await val(`dly/test/${day}/c`);
  assert.equal(c.st, 'done'); assert.equal(c.n, 60, 'the throwaway out of the count'); assert.deepEqual(c.w, [pids[50]], 'the one true rank 1 (#51) — #50 lost it, #1 never had it');
  const s51 = await val(`pstats/${pids[50]}`);
  assert.equal(s51.dl.ph, 1); assert.ok(s51.ac['penthouse-suite'] && s51.it['card-penthouse'], 'PENTHOUSE SUITE + the card, waiting for their next visit');
  assert.equal(((await val(`pstats/${pids[49]}`)).dl || {}).ph || 0, 0, '#50 (rank 2 by the day\'s end): nothing');
  assert.equal(await val('pcount/a/penthouse-suite'), 1, 'counted once in X%');
  // a second closer later (a fresh instance): nothing more
  forgetClosed();
  await D('ph-3', { action: 'start', game: 'test' }, after + 60e3);
  assert.equal((await val(`pstats/${pids[50]}`)).dl.ph, 1); assert.equal(await val('pcount/a/penthouse-suite'), 1);
  // a tie at the top, closed directly: all of them win (the early best included)
  const d2 = dayOf(dayNum(day) + 2), r2 = {};
  for (let i = 0; i < 60; i++) r2[pids[i]] = i < 3 ? 950 : 500;
  await ref(`dly/test/${d2}`).set({ r: r2, n: 60 });
  const tie = await closeDay({ game: 'test', day: d2, now: dayStartAt(dayOf(dayNum(d2) + 1)) + 1 });
  assert.deepEqual(tie.winners, [pids[0], pids[1], pids[2]].sort());
  // 49 finishers: nobody; a day with no finishers: closed quietly
  const d3 = dayOf(dayNum(day) + 3), r3 = {};
  for (let i = 0; i < 49; i++) r3[pids[i]] = 900 + i;
  await ref(`dly/test/${d3}`).set({ r: r3, n: 49 });
  assert.deepEqual((await closeDay({ game: 'test', day: d3, now: T })).winners, []);
  assert.equal((await val(`dly/test/${d3}/c`)).n, 49);
  assert.equal((await closeDay({ game: 'test', day: dayOf(dayNum(day) + 4), now: T })).n, 0);
  // a 'busy' marker left by a closer that died is retaken after STALE_MS; a fresh one is respected
  const d5 = dayOf(dayNum(day) + 5);
  await ref(`dly/test/${d5}`).set({ r: r2, n: 60, c: { at: T, st: 'busy' } });
  assert.equal((await closeDay({ game: 'test', day: d5, now: T + 60e3 })).closed, false, 'a live closer is at work');
  assert.equal((await closeDay({ game: 'test', day: d5, now: T + 11 * 60e3 })).closed, true, 'a dead one is retaken');
  // a week with no traffic: the next call closes every unclosed day it finds (LOOK_BACK back from yesterday), none twice — the days closed
  // above carry their 'done' marker and are left alone
  forgetClosed();
  const d6 = dayOf(dayNum(day) + 6), d7 = dayOf(dayNum(day) + 7);
  await ref(`dly/test/${d6}`).set({ r: r2, n: 60 }); await ref(`dly/test/${d7}`).set({ r: { [pids[0]]: 1 }, n: 1 });
  const far = dayStartAt(dayOf(dayNum(day) + 8)) + 60e3;            // 4:01 am, 8 days on: the window = day+1 … day+7
  const closed = await closeDays({ games: ['test'], now: far });
  // (tomorrow = the day ph-3's start opened — a day with a start and no finisher is closed with n 0)
  assert.deepEqual(closed.map(x => x.day).sort(), [tomorrow, d6, d7], `the unclosed days within ${LOOK_BACK}, closed; the done ones untouched`);
  assert.equal(closed.find(x => x.day === tomorrow).n, 0);
  assert.deepEqual(closed.find(x => x.day === d6).winners, [pids[0], pids[1], pids[2]].sort());
  assert.deepEqual(await closeDays({ games: ['test'], now: far }), [], 'the memo: nothing on the next call');
  assert.equal(penthouseCut(60), 1);
});

test('DFIX2 finding 3 → decision 5 — a RESEED in the last minute before 4 am: COAST CLEAR\'s new day uses the NEW key on a WARM instance (pickDay reads the secret afresh for a day it has not seen)', async () => {
  const T = NOW + 50 * DAY, today = streakDay(T), dayB = dayOf(dayNum(today) + 1);
  const T0 = dayStartAt(dayB) - 30e3;                                   // 3:59:30 — this instance's key cache fills
  forgetPicks(); forgetPwDays(); forgetBoards(); clearSecretCache();
  await pickDay(today, T0);
  const warm = await dailyKeys(T0), oldKey = secretOf(warm, dayB);
  // ANOTHER instance (the admin function) reseeds at 3:59:35 — its clears never reach this one (modelled: the key written under us)
  const fresh = 'ab'.repeat(32);
  await ref(`${SECRET_PATH}/k/${dayB}`).set(fresh);
  assert.equal(secretOf(await dailyKeys(T0 + 35e3), dayB), oldKey, 'the warm cache (60 s) still says the old key at 4:00:05');
  // 4:00:05 — the new day's first start on THIS instance
  await pickDay(dayB, T0 + 35e3);
  const stored = await val(`dly/coastclear/${dayB}/b`);
  assert.equal(stored.l, buildBoard(dayB, fresh).board.lights.join(','), 'the stored board = the NEW key\'s (was: the old key\'s)');
  assert.notEqual(stored.l, buildBoard(dayB, oldKey).board.lights.join(','));
  await ref(`${SECRET_PATH}/k/${dayB}`).remove(); await ref(`dly/coastclear/${dayB}/b`).remove(); await ref(`dly/password/${dayB}/b`).remove();
  forgetPicks(); forgetPwDays(); forgetBoards(); clearSecretCache();
});

test('DFIX2 finding 8 → decision 3 — THE ROOM WINS needs 2+ players: a room of ONE that started a game can\'t pause a daily; two can', async () => {
  const T = NOW + 60 * DAY;
  assert.equal(MIN_PARTY, 2);
  await ensure('solo-ann', 'Solo'); await ensure('solo-bob', 'Partner');
  const pa = await pidOf('solo-ann');
  await D('solo-ann', { action: 'start', game: 'coastclear' }, T);
  await ref('rooms/SOLO').set({ meta: { hostId: 'solo-ann', status: 'playing', createdAt: T }, players: { 'solo-ann': { name: 'Solo', pid: pa } } });
  await rejects(D('solo-ann', { action: 'pause', game: 'coastclear', room: 'SOLO' }, T + 1e3), 409, 'no_room_game');
  await ref('rooms/SOLO/players/solo-bob').set({ name: 'Partner' });
  assert.equal((await D('solo-ann', { action: 'pause', game: 'coastclear', room: 'SOLO' }, T + 2e3)).paused, true, 'two in the room: the clock stops');
  await D('solo-ann', { action: 'resume', game: 'coastclear' }, T + 3e3);
});

test('DFIX2 OPTIONAL — the day\'s first start while the database hiccups → 503 busy (the phone retries), never a 500', async () => {
  const T = NOW + 70 * DAY;
  let fails = 2;
  registerTestDaily({ order: 5 }, { ...fakeCart('flaky'), judged: true, moves: [], resume: () => ({}), act: () => ({}), load: async () => { if (fails-- > 0) throw new Error('ETIMEDOUT'); return { ok: 1 }; } });
  try {
    await ensure('bz-ann', 'Busy');
    const e = await rejects(D('bz-ann', { action: 'start', game: 'flaky' }, T), 503, 'busy');
    assert.match(e.message, /try again/i);
    assert.ok((await D('bz-ann', { action: 'start', game: 'flaky' }, T + 2e3)).run, 'the retry: the day loads');
  } finally { removeTestDaily('flaky'); loadDailies(); forgetPicks(); }
});

// BOARD 2.0 A — DAILY POINTS over /api: a counted PASSWORD in two → 100 points on THE RUN's day, THE DAILIES' BOARDS (THIS WEEK; ALL TIME only
// from 10 days — YOUR average still returned by `ranks`); a repeat finish writes nothing; a same-day profile earns none (THE THROWAWAY GATE —
// g-crack above); THE BACK-FILL re-scores the stored results to the same numbers
test('FR7 FIXES C — S2: a counting finish on a day ALREADY CLOSED re-ranks it once more (the late 50th finisher opens PENTHOUSE) — it only ever ADDS', async () => {
  const T = NOW + 60 * DAY, day = streakDay(T), next = dayOf(dayNum(day) + 1), after = dayStartAt(next) + 60e3;
  forgetClosed();
  const pids = [];
  for (let i = 1; i <= 49; i++) {
    const uid = `s2-${i}`; await ensure(uid, `Late${i}`); pids.push(await pidOf(uid));
    const s = await D(uid, { action: 'start', game: 'test' }, T + i * 1000);
    const g = FAKE_DAILY.target(s.seed), off = 500, guess = g + off <= 999 ? g + off : g - off;
    await D(uid, { action: 'finish', game: 'test', result: { guess } }, T + i * 1000 + 500);
  }
  // the 50th starts at 3:59 am (the day's last minute) …
  await ensure('s2-late', 'Latecomer');
  const lateStart = await D('s2-late', { action: 'start', game: 'test' }, dayStartAt(next) - 60e3);
  assert.equal(lateStart.day, day);
  // … the first call after 4 am closes the day with 49 counting finishers: nobody wins
  await D('s2-1', { action: 'today' }, after);
  const c0 = await val(`dly/test/${day}/c`);
  assert.equal(c0.st, 'done'); assert.equal(c0.n, 49); assert.equal(c0.w, undefined);
  // … then the 50th finishes on ITS day (a run keeps its own day) with the best score: the day re-ranks — 50 finishers, the winner granted
  const f = await D('s2-late', { action: 'finish', game: 'test', day, result: { guess: FAKE_DAILY.target(lateStart.seed) } }, after + 120e3);
  assert.equal(f.counted, true);
  const c1 = await val(`dly/test/${day}/c`);
  assert.equal(c1.n, 50); assert.deepEqual(c1.w, [await pidOf('s2-late')]);
  const won = await val(`pstats/${await pidOf('s2-late')}`);
  assert.equal(won.dl.ph, 1, 'PENTHOUSE granted');
  // a re-rank never takes one away: a better score than the winner's can't exist on the fake (1000 is the top), so a recount simply keeps him
  const { recloseDay } = await import('../../api/_lib/daily-close.js');
  const again = await recloseDay({ game: 'test', day, now: after + 200e3 });
  assert.deepEqual(again.added, []); assert.deepEqual(again.winners, [await pidOf('s2-late')]);
  assert.equal((await val(`pstats/${await pidOf('s2-late')}`)).dl.ph, 1, 'granted once');
  // a day not closed yet is left to its close
  assert.equal(await recloseDay({ game: 'test', day: dayOf(dayNum(day) + 400), now: after }), null);
});

test('FR7 FIXES C — S4: a daily STARTED BEFORE THE PROGRESS RESET and finished after it is not paid (no streak, no XP, no points, out of the day\'s count)', async () => {
  const T = NOW + 70 * DAY, R = T + 10 * 60e3;
  await ensure('s4-a', 'Straddle'); await ensure('s4-b', 'After');
  const pa = await pidOf('s4-a');
  const before = await val(`pstats/${pa}`);
  const sa = await D('s4-a', { action: 'start', game: 'test' }, R - 60e3);
  await ref('progress/resetAt').set(R);
  try {
    const f = await D('s4-a', { action: 'finish', game: 'test', result: { guess: FAKE_DAILY.target(sa.seed) } }, R + 60e3);
    assert.equal(f.pre, true); assert.equal(f.counted, false); assert.equal(f.outcome, null);
    const s = await val(`pstats/${pa}`);
    assert.deepEqual(s, before, 'the stats untouched');
    assert.equal(await val(`dly/test/${streakDay(R)}/x/${pa}`), 1, 'out of the day\'s histogram + PENTHOUSE');
    // a run started after the reset is paid as usual
    const sb = await D('s4-b', { action: 'start', game: 'test' }, R + 2 * 60e3);
    const fb2 = await D('s4-b', { action: 'finish', game: 'test', result: { guess: FAKE_DAILY.target(sb.seed) } }, R + 3 * 60e3);
    assert.equal(fb2.counted, true); assert.ok(fb2.outcome && fb2.outcome.xp.total > 0);
  } finally { await ref('progress/resetAt').remove(); }
});

test('BOARD 2.0 A — DAILY POINTS: the server\'s score → points, the boards, YOUR average under 10 days, a repeat, THE BACK-FILL', async () => {
  const { weekOfDay, dailyPoints } = await import('../../js/core/daily-points.js');
  const d = streakDay(NOW), at = NOW + 60e3, wk = weekOfDay(d);
  const me = await ensure('bp-one', 'Pointer');
  const [W1, W2] = await wordsFor(d);
  await D('bp-one', { action: 'start', game: 'password' }, at);
  await D('bp-one', { action: 'guess', game: 'password', word: W1 }, at + 1e3);
  await D('bp-one', { action: 'guess', game: 'password', word: W2 }, at + 2e3);
  const f = await D('bp-one', { action: 'finish', game: 'password', result: { score: 999 } }, at + 3e3);
  assert.equal(f.counted, true); assert.equal(f.score, 2);
  assert.equal(f.outcome.points, 100, 'both doors in 2 = 100 (the server\'s own score — the phone\'s claim ignored)');
  const st = await val(`pstats/${me.pid}`);
  assert.deepEqual(st.dp.d[d], { g: { password: 100 }, t: 100 });
  assert.equal(await val(`lb/daily-password/${wk}/${me.pid}`), 100, 'THIS WEEK on the password board');
  assert.equal(await val(`lb/daily/${wk}/${me.pid}`), 100, 'and on the dailies\' board');
  assert.equal(await val(`lb/daily/all/${me.pid}`), null, 'ALL TIME: unranked under 10 days played');
  const rk = (await profileAction('bp-one', { action: 'ranks', boards: ['daily', 'daily-password'] }, '', at + 4e3)).ranks;
  assert.deepEqual(rk.daily.mine, { avg: 100, days: 1, need: 10 }, 'YOUR average returned below the threshold');
  assert.ok(rk['daily-password'].week && rk['daily-password'].week.v === 100 && rk['daily-password'].week.rank >= 1);
  // a repeat finish (a retry, a second tap): the same score, nothing written
  const again = await D('bp-one', { action: 'finish', game: 'password', result: null }, at + 9e3);
  assert.equal(again.again, true);
  assert.deepEqual((await val(`pstats/${me.pid}`)).dp, st.dp);
  // the throwaway (g-crack, made today) earned no points
  assert.equal(await val(`pstats/${await pidOf('g-crack')}/dp`), null);
  // THE BACK-FILL: the points rebuilt from the stored results — the same numbers
  process.env.ADMIN_PIDS = me.pid;
  try {
    await ref(`pstats/${me.pid}/dp`).remove(); await ref(`lb/daily/${wk}/${me.pid}`).remove();
    const r = (await adminAction('bp-one', { action: 'boardsBackfill', confirm: true }, at + 20e3)).backfill;
    assert.ok(r.done && r.preview.pointsPlayers >= 1, JSON.stringify(r.preview));
    const dp = (await val(`pstats/${me.pid}`)).dp;
    assert.equal(dp.d[d].g.password, dailyPoints('password', 2));
    assert.equal(dp.a.t, st.dp.a.t); assert.equal(dp.a.n, 1);
    assert.equal(await val(`lb/daily/${wk}/${me.pid}`), 100, 'back on the board');
    assert.equal(await val(`pstats/${await pidOf('g-crack')}/dp`), null, 'a non-counting result still earns nothing');
  } finally { process.env.ADMIN_PIDS = ''; }
});

// ---------------------------------------------------------------- THE DROP B — THE SCHEDULED GO-LIVE (Ben, Nov 13 — /admin → GO LIVE AT THE NEXT 4 AM)
test('THE DROP B — THE SCHEDULED GO-LIVE: the owner schedules an OFF daily at THE NEXT 4 AM (audited) → the day before = two dailies (swept with two), from that 4 am = three (the sweep + the XP cap need all three), never mid-day; a run that crossed 4 am keeps ITS day\'s set; a finished sweep is never turned incomplete; CANCEL only before its day', async () => {
  const { dailySchedule, SCHED_PATH: DLIVE } = await import('../../api/_lib/dailies.js');
  const A0 = NOW + 30 * DAY, A = streakDay(A0), B = dayOf(dayNum(A) + 1), C = dayOf(dayNum(A) + 2);
  const atA = A0, at4B = dayStartAt(B), atB = at4B + 3 * 3600e3, atC = dayStartAt(C) + 3600e3;
  await ensure('g-own', 'GoOwner'); await ensure('g-amy', 'GoAmy'); await ensure('g-bob', 'GoBob');
  const own = await pidOf('g-own');
  const rows = DAILIES.filter(r => r.id === 'password' || r.id === 'coastclear');
  for (const r of rows) r.on = false;                                    // (the sweep's set = the test dailies alone: early + the fake + the late one)
  registerTestDaily({ order: 3 }, fakeCart('early'));
  registerTestDaily({ order: 4, on: false }, fakeCart('late'));
  process.env.ADMIN_PIDS = own;
  try {
    const t0 = await D('g-amy', { action: 'today' }, atA);
    assert.deepEqual(t0.dailies.map(d => d.id), ['early', 'test'], 'an OFF row is not in the set');
    await rejects(adminAction('g-amy', { action: 'dailySchedule', game: 'late' }, atA), 403, 'not_admin');
    const sc = await adminAction('g-own', { action: 'dailySchedule', game: 'late' }, atA);
    const lr = sc.dailies.rows.find(r => r.id === 'late');
    assert.equal(lr.state, 'scheduled'); assert.equal(lr.from, B, 'from = THE NEXT 4 AM\'s day');
    assert.equal((await val(`${DLIVE}/late`)).from, B);
    assert.ok(Object.values((await val('audit')) || {}).some(a => a.act === 'dailyGoLive'), 'audited');
    // the day before: still two — `late` refused, THE SWEEP complete with two
    clearSwitchCache();
    assert.deepEqual((await D('g-amy', { action: 'today' }, atA + 1e3)).dailies.map(d => d.id), ['early', 'test'], 'never mid-day');
    await rejects(D('g-amy', { action: 'start', game: 'late' }, atA + 2e3), 404, 'no_daily');
    const a1 = await perfect('g-amy', 'early', atA + 3e3), a2 = await perfect('g-amy', 'test', atA + 6e3);
    assert.equal(a1.outcome.swept, false); assert.equal(a2.outcome.swept, true, 'day A swept with its two');
    // bob: early on A, then THE FAKE started at 3:59 on A and finished at 4:01 on B (DFIX1) — swept on A with A's set (two), not B's three
    await perfect('g-bob', 'early', atA + 9e3);
    const s0 = await D('g-bob', { action: 'start', game: 'test' }, at4B - 60e3);
    const crossed = await D('g-bob', { action: 'finish', game: 'test', day: A, result: { guess: FAKE_DAILY.target(s0.seed) } }, at4B + 60e3);
    assert.equal(crossed.day, A); assert.equal(crossed.outcome.swept, true, 'a run that crossed 4 am keeps ITS day\'s set (two)');
    // from B's 4 am: three — the sweep + the XP cap need all three
    const tB = await D('g-amy', { action: 'today' }, at4B + 5e3);
    assert.deepEqual(tB.dailies.map(d => d.id), ['early', 'late', 'test'], 'live from that 4 am turn, by itself');
    let xp = 0, last = null;
    for (const g of ['early', 'test', 'late']) { last = await perfect('g-amy', g, atB + xp * 10); xp += last.outcome.xp.total; assert.equal(last.outcome.swept, g === 'late', `${g}: the sweep only with all three`); }
    assert.equal(xp, 3 * DAILY_XP + SWEEP_XP, 'daily XP 3 × 15 + 10');
    assert.equal(last.outcome.run, 2, 'PERFECT WEEK\'s run: A + B in a row');
    const st = await val(`pstats/${await pidOf('g-amy')}/dl/days`);
    assert.equal(st[A].sw, 1, 'day A\'s sweep stays complete (never turned incomplete by the third daily)');
    // CANCEL: refused once live (never mid-day); a fresh schedule cancelled before its day → never opens
    await rejects(adminAction('g-own', { action: 'dailySchedule', game: 'late', cancel: true }, atB), 409, 'already_live');
    registerTestDaily({ order: 5, on: false }, fakeCart('later'));
    const s2 = await adminAction('g-own', { action: 'dailySchedule', game: 'later' }, atB + 1e3);
    assert.equal(s2.dailies.rows.find(r => r.id === 'later').from, C);
    const c2 = await adminAction('g-own', { action: 'dailySchedule', game: 'later', cancel: true }, atB + 2e3);
    assert.equal(c2.dailies.rows.find(r => r.id === 'later').state, 'off');
    assert.ok(Object.values((await val('audit')) || {}).some(a => a.act === 'dailyGoLiveCancel'), 'the cancel audited');
    clearSwitchCache();
    assert.deepEqual((await D('g-amy', { action: 'today' }, atC)).dailies.map(d => d.id), ['early', 'late', 'test'], 'the cancelled one never opened; the live one stays');
    assert.deepEqual(Object.keys(await dailySchedule(atC)).sort(), ['late']);
    await rejects(adminAction('g-own', { action: 'dailySchedule', game: 'early' }, atC), 409, 'always_on');
  } finally {
    for (const r of rows) r.on = true;
    process.env.ADMIN_PIDS = '';
    await ref(DLIVE).remove();
    removeTestDaily('early'); removeTestDaily('late'); removeTestDaily('later'); clearSwitchCache(); loadDailies();
  }
});
