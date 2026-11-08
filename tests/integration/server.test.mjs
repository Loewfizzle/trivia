// The /api functions against the Firebase emulators (database :9000 + auth :9099):
//   cd tests/integration && npm run emulators        (in another terminal; Java needed)
//   node --test server.test.mjs
// Profiles (automatic creation, migration, key restore on a "new device", key regeneration, renames that update every
// board, the opt-out), match reports (forged, impossible, duplicate and offline-retried reports), weekly vs all-time
// boards, ranks outside the top 100, XP and rank-ups, the admin actions and their access control, the board-name filter,
// and every game (all four GRIDLOCK modes) counted from its room.
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.MATCH_GAP_MS = '20000';
process.env.ADMIN_PIDS = '';
// BNAME: the 3-match floor is its own test below; the older tests list a player from their first match
process.env.BOARD_MIN_MATCHES = '1';

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { processReport } from '../../api/report.js';
import { profileAction } from '../../api/profile.js';
import { boardQuery } from '../../api/board.js';
import adminHandler, { adminAction, LIVE_CACHE } from '../../api/admin.js';
import reportHandler from '../../api/report.js';
import boardHandler from '../../api/board.js';
import logHandler, { logErrors, errorSig, logReport, cleanReport, REPORT_LIMITS } from '../../api/log.js';
import skyHandler, { placeOf, skyFor, clearSkyCache, setKpFetcher } from '../../api/sky.js';
import { clearBoardCache, boardId } from '../../api/_lib/lb.js';
import { flagRow, FLAG_LIMITS } from '../../api/board.js';
import { houseNick, NICK_ADJ, NICK_NOUN } from '../../js/core/nicknames.js';
import { isOffensive } from '../../js/core/names.js';
import { finalGame, cipherSigned } from '../fixtures/finals.mjs';
import { weekKey } from '../../js/core/week.js';
import { RANKS } from '../../js/core/ranks.js';
import { softAuthenticator } from './kit/soft-authenticator.mjs';
import { rpOf, deviceLabel } from '../../api/_lib/passkeys.js';

const NOW = Date.UTC(2026, 9, 14, 23, 0, 0);       // Wed 2026-10-14, 7 pm Eastern
const DAY = 86_400_000;
let clock = NOW;
const tick = (ms = 60_000) => (clock += ms);
const NODES = ['pkc', 'pkx', 'pkch', 'profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'errlog', 'wx', 'phonelog', 'flags', 'members', 'seats'];

before(async () => {
  await ref('/').update(Object.fromEntries(NODES.map(n => [n, null])));
});
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, extra = {}) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan', ...extra }, '', clock);
const NIGHT = { 1: 3, 2: 2, 3: 1 };
let codeN = 0;
const nextCode = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; codeN++; return `T${A[Math.floor(codeN / 24) % 24]}${A[codeN % 24]}Z`; };

/** Seeds a room whose match just finished; returns { code, matchId, game }. */
async function seedRoom(id, uids, opts = {}, names = {}) {
  const code = opts.code || nextCode();
  const game = finalGame(id, uids, opts);
  game.phaseStartAt = clock;
  if (game.playStartAt) { game.phaseStartAt = game.playStartAt + 240_000; }
  let boards = null;
  if (id === 'cipher') ({ boards } = cipherSigned(game, code));
  const ranks = (await import('../../js/core/match-report.js')).extractMatch(game, {});
  const night = { g: id, at: clock, p: {}, n: {} };
  for (const [u, r] of Object.entries(ranks.rows)) { night.p[u] = NIGHT[r.rank] || 0; night.n[u] = names[u] || u.toUpperCase(); }
  await ref(`rooms/${code}`).set({
    meta: { hostId: uids[0], status: 'playing', createdAt: clock, activeAt: clock },
    players: Object.fromEntries(uids.map((u, i) => [u, { name: names[u] || u.toUpperCase(), color: 'cyan', avatar: 'bolt', joinedAt: i }])),
    game,
    night: { [game.matchId]: night },
    ...(boards ? { boards: { [game.matchId]: boards } } : {}),
  });
  return { code, matchId: game.matchId, game };
}
// (cipherSigned: tests/fixtures/finals.mjs — a CIPHER final as the real clients leave it)
const report = (uid, room, now = clock, snap) => processReport(uid, { code: room.code, matchId: room.matchId, ...(snap ? { snap } : {}) }, now);
const stats = async uid => val(`pstats/${await val(`uids/${uid}`)}`);
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} (${e.message})`); if (code) assert.equal(e.code, code); return; }
  assert.fail(`expected ${status} ${code}`);
};

test('profiles are created automatically, once, with a name tag and a key', async () => {
  const a = await ensure('u-mike', 'Mike');
  assert.match(a.pid, /^p[a-z2-9]{11}$/);
  assert.match(a.profile.t, /^\d{4}$/);
  assert.equal(a.profile.n, 'Mike');
  assert.match(a.key, /^NEON-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  const again = await ensure('u-mike', 'Mike', { avatar: 'star', color: 'violet' });
  assert.equal(again.pid, a.pid, 'the same profile');
  assert.equal(again.key, undefined, 'the key is only shown when created');
  assert.equal(again.profile.a, 'star');
  assert.equal(again.profile.c, 'violet');
  // racing first calls from one device make one profile
  const [x, y] = await Promise.all([ensure('u-race', 'Racer'), ensure('u-race', 'Racer')]);
  assert.equal(x.pid, y.pid);
  // the key itself is never stored: only its hash maps to the profile
  const dump = JSON.stringify(await val('ppriv')) + JSON.stringify(await val('pkeys')) + JSON.stringify(await val('profiles'));
  assert.ok(!dump.includes(a.key.slice(5, 9) + a.key.slice(10, 14)), 'no plain key in the database');
  // two Mikes get different tags
  const b = await ensure('u-mike2', 'MIKE');
  assert.notEqual(b.profile.t, a.profile.t);
});

// APP FIXES (Grok 2.2): a report never MINTS a profile (a forged room could have made profiles for anyone) — each phone makes its own
test('a player with no profile is not given one by a report (each phone makes its own when it joins)', async () => {
  await ensure('u-old1', 'VETERAN');
  const room = await seedRoom('cipher', ['u-old1', 'u-old2'], {}, { 'u-old1': 'VETERAN', 'u-old2': 'ROOKIE' });
  const r = await report('u-old1', room);
  assert.equal(r.status, 'counted');
  assert.equal(await val('uids/u-old2'), null, 'no profile minted for the other player');
  assert.equal((await stats('u-old1')).g.cipher.p, 1, 'the reporter (with a profile) is counted');
  tick();
});

test('restore key: a new device takes over the profile; regenerating retires the old key', async () => {
  const a = await ensure('u-alice', 'Alice');
  const room = await seedRoom('slip', ['u-alice', 'u-bob'], {}, { 'u-alice': 'Alice', 'u-bob': 'Bob' });
  await report('u-alice', room);
  tick();
  // the new phone made its own blank profile on first load
  const blank = await ensure('u-alice-phone2', 'Alice');
  assert.notEqual(blank.pid, a.pid);
  await rejects(profileAction('u-alice-phone2', { action: 'restore', key: 'NEON-AAAA' }, '', clock), 400, 'bad_key');
  await rejects(profileAction('u-alice-phone2', { action: 'restore', key: 'NEON-AAAA-BBBB-CCCC' }, '', clock), 404, 'no_key');
  const r = await profileAction('u-alice-phone2', { action: 'restore', key: a.key.toLowerCase() }, '', clock);
  assert.equal(r.pid, a.pid);
  assert.equal(await val('uids/u-alice-phone2'), a.pid);
  // (FR6 FIXES A — C1: a new profile holds a MEMBER Nº from its creation — it OWNS something, so it is kept, only unlinked from this device)
  assert.ok(await val(`profiles/${blank.pid}`), 'a numbered profile is kept');
  assert.equal(await val(`ppriv/${blank.pid}/uids/u-alice-phone2`), null, 'unlinked from the device');
  const me = await profileAction('u-alice-phone2', { action: 'me' }, '', clock);
  assert.equal(me.stats.g.slip.p, 1, 'stats came along');
  // regenerate: the old key stops working, the new one works
  const { key } = await profileAction('u-alice', { action: 'regen' }, '', clock);
  assert.notEqual(key, a.key);
  await rejects(profileAction('u-other', { action: 'restore', key: a.key }, '', clock), 404, 'no_key');
  assert.equal((await profileAction('u-other', { action: 'restore', key }, '', clock)).pid, a.pid);
});

// FR6 FIXES A — C1: the real path — the Home Screen app opens as a stranger (a new profile), the player taps the UFO (a SIGHTING CARD),
// then BRING YOUR CARD restores their real profile: the stranger profile went WITH the card. Now one that owns anything is never deleted;
// one that owns NOTHING (no match, no item beyond the starter set, no sighting, no XP, no daily, no member Nº) still is
test('restore never deletes a profile that owns something — a blank profile\'s sighting card survives (C1)', async () => {
  const { ownsAnything } = await import('../../api/_lib/profiles.js');
  const { STARTER } = await import('../../js/core/items.js');
  assert.equal(ownsAnything(null, null), false);
  assert.equal(ownsAnything({ it: Object.fromEntries(STARTER.map(id => [id, 1])) }, { n: 'X' }), false, 'the free starter set is not owning');
  assert.equal(ownsAnything({ it: { 'card-sg-ufo': 1 } }, {}), true, 'a sighting card');
  assert.equal(ownsAnything({ pa: { sgt: 1, sg: { ufo: 1 } } }, {}), true, 'a sighting');
  assert.equal(ownsAnything({ xp: 40 }, {}), true, 'XP');
  assert.equal(ownsAnything({ dl: { n: 1 } }, {}), true, 'a daily');
  assert.equal(ownsAnything({ g: { slip: { p: 1 } } }, {}), true, 'a counted match');
  assert.equal(ownsAnything({}, { mn: 47 }), true, 'a member number');
  const real = await ensure('u-hs-safari', 'Hana');
  const stranger = await ensure('u-hs-homescreen', 'Hana');
  assert.notEqual(stranger.pid, real.pid);
  // the stranger profile taps the UFO (as the server's sighting transaction leaves it)
  await ref(`pstats/${stranger.pid}`).update({ it: { 'card-sg-ufo': clock }, pa: { sg: { ufo: 1 }, sgt: 1 } });
  await ref(`profiles/${stranger.pid}/mn`).remove();   // (even without its member number: the card alone keeps it)
  const r = await profileAction('u-hs-homescreen', { action: 'restore', key: real.key }, '', clock);
  assert.equal(r.pid, real.pid);
  assert.ok(await val(`profiles/${stranger.pid}`), 'the profile with the card is kept');
  assert.equal((await val(`pstats/${stranger.pid}/it`))['card-sg-ufo'], clock, 'its sighting card is still there');
  assert.ok(await val(`pkeys/${(await val(`ppriv/${stranger.pid}/kh`))}`), 'its key still opens it (the device keeps it as YOUR PREVIOUS KEY)');
  // a truly blank one (no member Nº, nothing earned) still goes
  const empty = await ensure('u-hs-empty', 'Empty');
  await ref(`profiles/${empty.pid}/mn`).remove();
  await profileAction('u-hs-empty', { action: 'restore', key: real.key }, '', clock);
  assert.equal(await val(`profiles/${empty.pid}`), null, 'a profile that owns nothing is still removed (its tag freed)');
});

// FR6 FIXES A — C3: a hacked HOST writes PRISM DROP's song lengths (game.sd) — /api/report must not take them as the rush bound
test('PRISM DROP rush: a hacked host\'s song length posts no impossible record (C3)', async () => {
  const { maxRushScore } = await import('../../js/core/match-report.js');
  const uids = ['u-rh1', 'u-rh2'];
  const pid = (await ensure('u-rh1', 'RUSHER')).pid;
  await ensure('u-rh2', 'RUSHTWO');
  tick(5 * 60_000);
  const room = await seedRoom('prism', uids, { mode: 'rush', rushScore: maxRushScore(60, 1e6) }, { 'u-rh1': 'RUSHER', 'u-rh2': 'RUSHTWO' });
  await ref(`rooms/${room.code}/game/sd`).set([1e9]);
  const r = await report('u-rh2', room);
  assert.equal(r.status, 'counted', 'the match still counts');
  assert.equal(await val(`lb/prism-rush/all/${pid}`), null, 'no impossible world record on THE BOARD');
});

test('restores are rate-limited per device', async () => {
  for (let i = 0; i < 10; i++) await rejects(profileAction('u-guesser', { action: 'restore', key: `NEON-AAAA-BBBB-CC${'ABCDEFGHJK'[i]}${'ABCDEFGHJK'[i]}` }, '', clock), 404, 'no_key');
  await rejects(profileAction('u-guesser', { action: 'restore', key: 'NEON-AAAA-BBBB-CCZZ' }, '', clock), 429, 'restore_limit');
});

test('renames: once a day, the tag follows when free; the boards show the NEW USERNAME at once (LOBBY 2.0 A — real usernames)', async () => {
  const m = await ensure('u-ren', 'Ren');
  const room = await seedRoom('golf', ['u-ren', 'u-ren2'], {}, { 'u-ren': 'Ren', 'u-ren2': 'Stimpy' });
  await report('u-ren', room);
  clearBoardCache();
  let wk = await boardQuery({ b: 'golf-par9', p: 'week' }, clock);
  assert.equal(wk.rows.find(r => r.id === m.profile.bid).n, 'Ren', 'the username');
  const r1 = await profileAction('u-ren', { action: 'rename', name: 'Renaldo' }, '', clock);
  assert.equal(r1.profile.n, 'Renaldo');
  assert.equal(r1.profile.t, m.profile.t, 'Ren#tag → Renaldo#tag');
  clearBoardCache();
  wk = await boardQuery({ b: 'golf-par9', p: 'week' }, clock);
  const al = await boardQuery({ b: 'golf-par9', p: 'all' }, clock);
  assert.equal(wk.rows.find(r => r.id === m.profile.bid).n, 'Renaldo', 'this week: the new username after a rename');
  assert.equal(al.rows.find(r => r.id === m.profile.bid).n, 'Renaldo', 'all time (a past record) — joined with the profile, so renamed too');
  assert.equal(r1.profile.bid, m.profile.bid, 'the board id never changes');
  await rejects(profileAction('u-ren', { action: 'rename', name: 'Rennie' }, '', clock + 3600_000), 429, 'rename_limit');
  // capitals only: free
  assert.equal((await profileAction('u-ren', { action: 'rename', name: 'RENALDO' }, '', clock + 3600_000)).profile.n, 'RENALDO');
  // a day later; the tag is already taken under the new name → a new tag
  const other = await ensure('u-zed', 'Zed');
  const taken = other.profile.t;
  await ref(`profiles/${m.pid}/t`).set(taken);  // make Renaldo's tag collide with Zed's
  const r2 = await profileAction('u-ren', { action: 'rename', name: 'Zed' }, '', clock + DAY + 1);
  assert.equal(r2.profile.n, 'Zed');
  assert.notEqual(r2.profile.t, taken, 'Zed#tag was taken: a new tag');
  // ensure() with a new name renames too (the setup screen)
  const e = await ensure('u-zed', 'Zedd');
  assert.equal(e.profile.n, 'Zedd');
  const e2 = await ensure('u-zed', 'Zeddy');
  assert.ok(e2.rename && e2.rename.blocked, 'twice in a day is blocked, not an error');
});

test('offensive names never reach a board (a house nickname stands in), and may be changed at once', async () => {
  const p = await ensure('u-rude', 'Rudy');
  await profileAction('u-rude', { action: 'rename', name: 'sh1tlord' }, '', clock);
  const room = await seedRoom('slip', ['u-rude', 'u-nice'], {}, { 'u-rude': 'sh1tlord', 'u-nice': 'Nice' });
  await report('u-nice', room);
  clearBoardCache();
  const b = await boardQuery({ b: 'slip-dist', p: 'all' }, clock);
  const row = b.rows.find(r => r.id === p.profile.bid);
  assert.equal(row.n, houseNick(p.profile.bid).n);
  assert.ok(!JSON.stringify(b).toLowerCase().includes('sh1t'), 'the typed name is nowhere in the response');
  // renamed a moment ago, but leaving an offensive name is always allowed
  const r = await profileAction('u-rude', { action: 'rename', name: 'Polite' }, '', clock + 10);
  assert.equal(r.profile.n, 'Polite');
  assert.equal(r.profile.t, p.profile.t);
  await rejects(profileAction('u-rude', { action: 'rename', name: 'Again' }, '', clock + 20), 429, 'rename_limit');
  tick();
});

test('opt-out: off the boards, stats still count, ranks still known privately; back on restores', async () => {
  const a = await ensure('u-shy', 'Shy');
  await ensure('u-loud', 'Loud');
  let room = await seedRoom('slip', ['u-shy', 'u-loud'], { dist: 5000 }, { 'u-shy': 'Shy', 'u-loud': 'Loud' });
  await report('u-shy', room);
  tick();
  await profileAction('u-shy', { action: 'show', on: false }, '', clock);
  clearBoardCache();
  assert.ok(!(await boardQuery({ b: 'slip-dist', p: 'all' }, clock)).rows.some(r => r.id === a.profile.bid), 'not on the board');
  assert.equal(await val(`lb/slip-dist/all/${a.pid}`), null, 'no entry at all');
  room = await seedRoom('slip', ['u-shy', 'u-loud'], { dist: 5100 }, { 'u-shy': 'Shy', 'u-loud': 'Loud' });
  const r = await report('u-loud', room);
  assert.equal(r.status, 'counted');
  const s = await stats('u-shy');
  assert.equal(s.g.slip.p, 2, 'still counted');
  assert.equal(s.b['slip-dist'].a, 5100, 'records still kept');
  assert.equal(await val(`lb/slip-dist/all/${a.pid}`), null, 'still off the board');
  const ranks = (await profileAction('u-shy', { action: 'ranks', boards: ['slip-dist'] }, '', clock)).ranks;
  assert.equal(ranks['slip-dist'].all.v, 5100);
  assert.equal(ranks['slip-dist'].all.rank, 1, 'would be #1');
  await profileAction('u-shy', { action: 'show', on: true }, '', clock);
  clearBoardCache();
  assert.equal((await boardQuery({ b: 'slip-dist', p: 'all' }, clock)).rows[0].id, a.profile.bid, 'back on top');
  tick();
});

test('forged and impossible reports are refused; the match itself still counts', async () => {
  await ensure('u-f1', 'FONE'); await ensure('u-f2', 'FTWO');
  await rejects(processReport('u-x', { code: 'nope', matchId: 'm1' }, clock), 400, 'bad_match');
  await rejects(processReport('u-x', { code: 'QQQQ', matchId: 'nosuch' }, clock), 409, 'unverifiable');
  // still running
  const run = await seedRoom('cipher', ['u-f1', 'u-f2']);
  await ref(`rooms/${run.code}/game/phase`).set('play');
  await rejects(report('u-f1', run), 425, 'not_final');
  // a stranger can't report someone else's match
  const room = await seedRoom('cipher', ['u-f1', 'u-f2']);
  await rejects(report('u-intruder', room), 403, 'not_in_match');
  // the room moved on (rematch): a snapshot whose placings disagree with the night record is refused
  const moved = await seedRoom('cipher', ['u-f1', 'u-f2']);
  const forged = structuredClone(moved.game);
  for (const r of Object.values(forged.results)) { r['u-f2'].pts = 9999; }
  await ref(`rooms/${moved.code}/game`).set({ id: 'cipher', matchId: 'next', phase: 'intro', participants: { 'u-f1': true } });
  // (APP FIXES: a snapshot is PLACINGS ONLY, from the night record — its numbers are never read, so a forged one counts the same)
  const ok = await report('u-f1', moved, clock, forged);
  assert.equal(ok.status, 'counted');
  assert.equal(await val(`lb/cipher-score/all/${await val('uids/u-f2')}`), null, 'no score from a client\'s snapshot');
  assert.equal((await stats('u-f2')).g.cipher.p, 1, 'the placing counts');
  tick();
  // impossible PULSE score: rejected record, the match counts
  const pulse = await seedRoom('pulse', ['u-f1', 'u-f2'], { pulseScore: 10_000_000 });
  const r = await report('u-f1', pulse);
  assert.deepEqual(r.rejected, ['pulse-pulse1-normal']);
  const s = await stats('u-f1');
  assert.equal(s.g.pulse.p, 1);
  assert.equal(s.b && s.b['pulse-pulse1-normal'], undefined);
  assert.equal(await val(`lb/pulse-pulse1-normal/all/${await val('uids/u-f1')}`), null);
  tick();
});

// APP FIXES (Grok 2.2) — NO INVENTED MATCHES ON THE BOARD
test('INVENTED MATCHES: a forged CIPHER final, a record with no time, a ghost in night.n — refused or not credited', async () => {
  for (const u of ['u-iv1', 'u-iv2', 'u-ghost']) await ensure(u, u.slice(2).toUpperCase());
  // 1. the forged final: the host writes "u-iv2 solved every round in 1 guess" — the boards u-iv2 signed say otherwise
  const forged = await seedRoom('cipher', ['u-iv1', 'u-iv2']);
  const g = structuredClone(forged.game);
  for (const r of Object.keys(g.results)) g.results[r]['u-iv2'] = { pts: 999, solved: true, n: 1, t: 1000, speed: 99, eff: 99 };
  // (its placings rewritten to match, so only the boards can tell)
  await ref(`rooms/${forged.code}/game`).set(g);
  await ref(`rooms/${forged.code}/night/${forged.matchId}/p`).set({ 'u-iv1': 2, 'u-iv2': 3 });
  await rejects(report('u-iv2', forged), 409, 'mismatch');
  // 2. a record with no time (the 6-hour cap was skipped) — and one from the future
  const noAt = await seedRoom('bluff', ['u-iv1', 'u-iv2']);
  await ref(`rooms/${noAt.code}/night/${noAt.matchId}/at`).set(null);
  await rejects(report('u-iv1', noAt), 409, 'unverifiable');
  const future = await seedRoom('bluff', ['u-iv1', 'u-iv2']);
  await ref(`rooms/${future.code}/night/${future.matchId}/at`).set(clock + 10 * DAY);
  await rejects(report('u-iv1', future), 409, 'unverifiable');
  const old = await seedRoom('bluff', ['u-iv1', 'u-iv2']);
  await rejects(report('u-iv1', old, clock + 7 * 3600_000), 409, 'too_old');
  // 3. a uid that never sat in the room: in the game + night.n, no players/{uid} → not credited (even with a profile)
  const ghost = await seedRoom('bluff', ['u-iv1', 'u-iv2', 'u-ghost']);
  await ref(`rooms/${ghost.code}/players/u-ghost`).set(null);
  const before = (await stats('u-ghost'))?.g?.bluff?.p || 0;
  const r = await report('u-iv1', ghost);
  assert.equal(r.status, 'counted');
  assert.equal((await stats('u-ghost'))?.g?.bluff?.p || 0, before, 'the ghost got nothing');
  await rejects(report('u-ghost', await seedRoom('bluff', ['u-iv1', 'u-ghost']).then(async x => { await ref(`rooms/${x.code}/players/u-ghost`).set(null); return x; })), 403, 'not_in_match');
  tick();
});

test('a HUSH WORD with an I or an O (MOON) reports like any room (the old code alphabet refused it)', async () => {
  for (const u of ['u-hw1', 'u-hw2']) await ensure(u, u.slice(2).toUpperCase());
  const room = await seedRoom('bluff', ['u-hw1', 'u-hw2'], { code: 'MOON' });
  assert.equal((await report('u-hw1', room)).status, 'counted');
  tick();
});

test('offline retries and every phone reporting never count a match twice', async () => {
  const uids = ['u-q1', 'u-q2', 'u-q3', 'u-q4'];
  for (const u of uids) await ensure(u, u.slice(2).toUpperCase());
  const room = await seedRoom('bluff', uids);
  // all four phones at once, then the queued retries
  const first = await Promise.allSettled(uids.map(u => report(u, room)));
  const firstOk = first.filter(x => x.status === 'fulfilled');
  assert.ok(firstOk.length >= 1);
  for (const x of first) if (x.status === 'rejected') assert.equal(x.reason.status, 425, 'the others are told to retry');
  const again = await Promise.all(uids.map(u => report(u, room, clock + 5000)));
  for (const r of again) assert.equal(r.status, 'done');
  for (const u of uids) assert.equal((await stats(u)).g.bluff.p, 1, `${u} counted once`);
  assert.equal(again[0].outcome.win, true);
  assert.ok(again[0].outcome.xp.gain > 0, 'each phone gets its own outcome back');
  const xp = (await stats('u-q1')).xp;
  await report('u-q1', room, clock + 60_000);
  assert.equal((await stats('u-q1')).xp, xp);
  // a forged room that "finishes" a second match moments later doesn't count for the same player
  const quick = await seedRoom('bluff', uids);
  const q = await report('u-q1', quick, clock + 6000);
  assert.equal(q.outcome.skip, 'too_soon');
  assert.equal((await stats('u-q1')).g.bluff.p, 1);
  tick();
});

test('weekly vs all-time boards: a new week starts empty, the all-time best stays', async () => {
  const w = await ensure('u-wk', 'Weekly');
  await ensure('u-wk2', 'Rival');
  const start = clock;
  let room = await seedRoom('slip', ['u-wk', 'u-wk2'], { dist: 7000 }, { 'u-wk': 'Weekly', 'u-wk2': 'Rival' });
  await report('u-wk', room);
  const nextWeek = start + 7 * DAY;
  clock = nextWeek;
  room = await seedRoom('slip', ['u-wk', 'u-wk2'], { dist: 3000 }, { 'u-wk': 'Weekly', 'u-wk2': 'Rival' });
  const r = await report('u-wk', room, nextWeek);
  assert.notEqual(weekKey(start), weekKey(nextWeek));
  clearBoardCache();
  const all = await boardQuery({ b: 'slip-dist', p: 'all' }, nextWeek);
  const week = await boardQuery({ b: 'slip-dist', p: 'week' }, nextWeek);
  assert.equal(all.rows.find(x => x.id === w.profile.bid).v, 7000, 'all time keeps the best');
  assert.equal(week.rows.find(x => x.id === w.profile.bid).v, 3000, 'this week only this week');
  assert.equal(week.key, weekKey(nextWeek));
  assert.ok(r.outcome.pbs.length === 0, 'not a personal best');
  const s = await stats('u-wk');
  assert.equal(s.gw.slip.p, 1, 'weekly career restarted');
  assert.equal(s.g.slip.p, 2);
  clock = start + 60_000 * 30;
});

test('ranks outside the top 100 are exact; the board pages', async () => {
  // 150 riders with distances 1000..1149
  const patch = {};
  for (let i = 0; i < 150; i++) {
    const pid = `pfill${String(i).padStart(4, '0')}`;
    patch[`profiles/${pid}`] = { n: `Rider${i}`, nk: `rider${i}`, t: String(1000 + i), a: 'bolt', c: 'cyan', x: 0, r: 0, at: clock, m: 5 };
    patch[`lb/slip-dist/${weekKey(clock)}/${pid}`] = 1000 + i;
  }
  await ref('/').update(patch);
  const me = await ensure('u-mid', 'Middling');
  await ref(`lb/slip-dist/${weekKey(clock)}/${me.pid}`).set(1019.5);
  await ref(`pstats/${me.pid}`).update({ wk: weekKey(clock), b: { 'slip-dist': { a: 1019.5, w: 1019.5, wk: weekKey(clock) } } });
  clearBoardCache();
  const top = await boardQuery({ b: 'slip-dist', p: 'week' }, clock);
  const page2 = await boardQuery({ b: 'slip-dist', p: 'week', start: 25, n: 25 }, clock);
  assert.ok(top.rows.length <= 100);
  assert.equal(page2.rows[0].rank, top.rows[25].rank);
  assert.ok(!top.rows.some(r => r.id === me.profile.bid), 'not in the top 100');
  const others = Object.keys((await val(`lb/slip-dist/${weekKey(clock)}`)) || {}).length - 1;
  const better = Object.values((await val(`lb/slip-dist/${weekKey(clock)}`)) || {}).filter(v => v > 1019.5).length;
  const ranks = (await profileAction('u-mid', { action: 'ranks', boards: ['slip-dist'] }, '', clock)).ranks;
  assert.equal(ranks['slip-dist'].week.rank, better + 1, `exact rank (${better + 1} of ${others + 1})`);
  assert.ok(ranks['slip-dist'].week.rank > 100);
});

test('XP accumulates on the server and the rank goes up (REGULAR in an evening)', async () => {
  const uids = ['u-xp', 'u-xp2', 'u-xp3'];
  for (const u of uids) await ensure(u, u.toUpperCase().replace('-', ''));
  const games = ['cipher', 'gridlock', 'slip', 'agent', 'bluff', 'golf'];
  let up = null, last = 0;
  for (const g of games) {
    tick(5 * 60_000);
    const room = await seedRoom(g, uids, {}, Object.fromEntries(uids.map(u => [u, u.toUpperCase().replace('-', '')])));
    const r = await report('u-xp', room);
    assert.ok(r.outcome.xp.to > last, 'XP only goes up');
    assert.equal(r.outcome.xp.from, last);
    last = r.outcome.xp.to;
    if (r.outcome.rk.to > r.outcome.rk.from) up = r.outcome;
  }
  assert.ok(up, 'ranked up at some point');
  assert.equal(up.rk.from, 0);
  assert.equal(up.rk.to, 1);
  assert.ok(last >= RANKS[1].xp);
  const pid = await val('uids/u-xp');
  assert.equal((await val(`profiles/${pid}`)).r, 1, 'the public profile shows REGULAR');
  assert.equal((await val(`profiles/${pid}`)).x, last);
});

test('every game (and every GRIDLOCK mode) is counted from its room with the right boards', async () => {
  const uids = ['u-all1', 'u-all2', 'u-all3'];
  for (const u of uids) await ensure(u, u.toUpperCase().replace('-', ''));
  const cases = [['cipher', {}], ['signal', {}], ['overclock', {}], ['bluff', {}], ['pulse', {}], ['golf', {}], ['agent', {}],
    ['prism', {}], ['prism', { mode: 'rush' }], ['slip', {}], ['gridlock', { mode: 'classic' }], ['gridlock', { mode: 'salvo' }],
    ['gridlock', { mode: 'royale' }], ['gridlock', { mode: 'arcade' }]];
  const expectBoards = { cipher: ['cipher-wins', 'cipher-score', 'cipher-fast5'], signal: ['signal-wins', 'signal-el'], overclock: ['overclock-wins', 'overclock-std'],
    bluff: ['bluff-wins', 'bluff-fool'], pulse: ['pulse-wins', 'pulse-pulse1-normal'], golf: ['golf-wins', 'golf-par9'], agent: ['agent-wins', 'agent-esc'],
    prism: ['prism-wins', 'prism-ko'], slip: ['slip-wins', 'slip-dist'], gridlock: ['gridlock-wins', 'gridlock-sunk'] };
  const pid = (await ensure('u-all1', 'UALL1')).pid;
  for (const [g, opts] of cases) {
    tick(5 * 60_000);
    const room = await seedRoom(g, uids, opts, Object.fromEntries(uids.map(u => [u, u.toUpperCase().replace('-', '')])));
    const r = await report(uids[1], room);   // a non-host phone reports first: fine
    assert.equal(r.status, 'counted', `${g} ${opts.mode || ''}`);
    for (const b of expectBoards[g]) assert.ok(await val(`lb/${b}/all/${pid}`) != null, `${g}: on ${b}`);
    if (g === 'gridlock') assert.equal(await val(`lb/gridlock-w-${opts.mode}/all/${pid}`), 1, `GRIDLOCK ${opts.mode} win`);
    if (g === 'prism' && opts.mode === 'rush') assert.ok(await val(`lb/prism-rush/all/${pid}`) > 0);
  }
  const s = await val(`pstats/${pid}`);
  assert.equal(s.g.gridlock.p, 4);
  assert.equal(s.g.gridlock.w, 4);
  assert.equal(s.g.prism.p, 2);
  // a fast-solve board sorts lower-is-better: stored negated, shown positive
  clearBoardCache();
  const f = await boardQuery({ b: 'cipher-fast5', p: 'all' }, clock);
  assert.ok(f.rows[0].v > 0);
  // every game's boards render from the public rows (LOBBY 2.0 A: the fixtures' players by USERNAME; board ids, values; never the pid)
  const bid = boardId(pid);
  for (const b of Object.values(expectBoards).flat()) {
    const q = await boardQuery({ b, p: 'all' }, clock);
    const row = q.rows.find(r => r.id === bid);
    assert.ok(row && row.rank >= 1 && row.v != null && /^UALL/i.test(row.n), `${b}: UALL1's row as the public sees it (${row && row.n})`);
    assert.ok(!JSON.stringify(q).includes(pid), `${b}: no profile id`);
  }
});

// LOBBY FIXES — REMOVE TEST PLAYERS: the list (made since the cut-off + named ones), the dry run, then ONLY the ticked go — everything they
// had (profile, stats + items, key, tag, device link, seat, board entries); the unticked + a real player untouched; an admin never; the
// member counter rolls back only when every number above the new top is going (a gap is never re-used)
test('REMOVE TEST PLAYERS: the ticked go (and only they); the member counter never re-uses a number', async () => {
  const { counterAfter, TEST_SINCE } = await import('../../api/_lib/testplayers.js');
  // the counter rule (PURE): 10 numbers given out (next 11); removing 9 + 10 → back to 9; removing 9 but keeping 10 → stays; 9 + 10 removed
  // over an older gap at 8 (the kept top is 7) → stays at 11: 8 is never re-used
  assert.deepEqual(counterAfter(11, [1, 2, 3, 4, 5, 6, 7, 8], [9, 10]), { from: 11, to: 9 });
  assert.deepEqual(counterAfter(11, [1, 2, 3, 4, 5, 6, 7, 8, 10], [9]), { from: 11, to: 11 });
  assert.deepEqual(counterAfter(11, [1, 2, 3, 4, 5, 6, 7], [9, 10]), { from: 11, to: 11 }, 'the gap at 8 is never re-used');
  assert.ok(TEST_SINCE === Date.UTC(2026, 10, 4, 15, 30), 'Nov 4 10:30 am EST');
  const real = await ensure('u-real1', 'Regular');
  const since = clock + 1;
  tick();
  const wka = await ensure('u-wka', 'WKA'), wkb = await ensure('u-wkb', 'WKB'), keep = await ensure('u-keepme', 'Newbie');
  const owner = await ensure('u-own', 'Owner');
  const room = await seedRoom('slip', ['u-wka', 'u-wkb'], { dist: 7000 }, { 'u-wka': 'WKA', 'u-wkb': 'WKB' });
  await report('u-wka', room); tick();
  await ref(`seats/${wka.pid}`).set({ code: room.code, uid: 'u-wka', at: clock });
  const nos = await Promise.all([real, wka, wkb, keep].map(x => val(`profiles/${x.pid}/mn`)));
  assert.ok(nos.every(n => n > 0), 'everyone has a member number');
  process.env.ADMIN_PIDS = `${owner.pid}`;
  try {
    await rejects(adminAction('u-wka', { action: 'testPlayers' }), 403, 'not_admin');
    const list = await adminAction('u-own', { action: 'testPlayers', since, also: [`Regular#${real.profile.t}`] });
    const ids = list.players.map(p => p.pid);
    for (const x of [wka, wkb, keep, real]) assert.ok(ids.includes(x.pid), `listed ${x.profile.n}`);
    const row = list.players.find(p => p.pid === wka.pid);
    assert.ok(row.mn && row.m === 1 && row.xp > 0 && row.t === wka.profile.t, `a row says name + tag, Nº, XP, matches (${JSON.stringify(row)})`);
    assert.ok(list.players.find(p => p.pid === owner.pid).admin, 'the admin is marked (never removable)');
    await rejects(adminAction('u-own', { action: 'removeTestPlayers', pids: [owner.pid] }), 400, 'admin_pid');
    // THE DRY RUN: nothing changes
    const dry = await adminAction('u-own', { action: 'removeTestPlayers', pids: [wka.pid, wkb.pid] });
    assert.equal(dry.done, false);
    assert.deepEqual(dry.remove.map(r => r.pid).sort(), [wka.pid, wkb.pid].sort());
    assert.ok(await val(`profiles/${wka.pid}`), 'the dry run removed nothing');
    const before = await val('members/next');
    // CONFIRM: only the ticked go
    const tagA = wka.profile.t;
    const done = await adminAction('u-own', { action: 'removeTestPlayers', pids: [wka.pid, wkb.pid], confirm: true });
    assert.equal(done.done, true);
    for (const x of [wka, wkb]) {
      for (const path of [`profiles/${x.pid}`, `pstats/${x.pid}`, `ppriv/${x.pid}`, `seats/${x.pid}`]) assert.equal(await val(path), null, `${path} gone`);
    }
    assert.equal(await val('uids/u-wka'), null, 'the device link gone');
    assert.equal(await val(`tags/wka/${tagA}`), null, 'the tag freed');
    const lb = (await val('lb')) || {};
    assert.ok(!JSON.stringify(lb).includes(wka.pid), 'no board entry left');
    for (const x of [real, keep, owner]) assert.ok(await val(`profiles/${x.pid}/n`), `${x.profile.n} untouched`);
    // the counter: WKA + WKB weren't the newest (Newbie + Owner came after) → no roll-back
    assert.equal(await val('members/next'), before, 'never re-used: Newbie + Owner hold the numbers above');
    const audit = Object.values((await val('audit')) || {}).find(a => a.act === 'removeTestPlayers');
    assert.ok(audit && /WKA#/.test(audit.b) && audit.by === owner.pid, 'audited');
    // the newest go → the counter rolls back to just above the new top
    const late = await ensure('u-late', 'Latest');
    const lateNo = await val(`profiles/${late.pid}/mn`);
    const r2 = await adminAction('u-own', { action: 'removeTestPlayers', pids: [late.pid], confirm: true });
    assert.deepEqual(r2.counter, { from: lateNo + 1, to: lateNo });
    assert.equal(await val('members/next'), lateNo, 'the newest number is free again');
  } finally { process.env.ADMIN_PIDS = ''; await ref('audit').remove(); }
});

// THE SPEED PASS — TEST PLAYERS, ALL OF THEM: the list from the very first profile (CREATED SINCE), each row's nights + last seen, the
// "looks like a test" PRE-TICK (two of: 0 nights · a test-ish name · a test burst) — never an admin, TESTER#2599 or a 2-night player;
// THE GROUPED LOGS: MARK SEEN (errlog/{sig}/seen = its count; phonelog/{id}/seen) + CLEAR a group by its ids — admins only, audited
test('TEST PLAYERS from the first profile + the pre-tick; the grouped logs: MARK SEEN + CLEAR a group', async () => {
  const { preTick, testName, nightsOf } = await import('../../api/_lib/testplayers.js');
  assert.ok(testName('WKA') && testName('rulescheck') && testName('AVA') && !testName('LOEWFIZZLE') && !testName('Regular'));
  assert.equal(nightsOf({ m: { a: Date.UTC(2026, 10, 3, 23), b: Date.UTC(2026, 10, 4, 1), c: Date.UTC(2026, 10, 5, 23) } }), 2, 'two nights (the streak day turns at 4 am Eastern)');
  const T = Date.UTC(2026, 10, 4, 16);
  const rows = preTick([
    { pid: 'p1', n: 'WKA', t: '1111', at: T, nights: 0 }, { pid: 'p2', n: 'WKB', t: '2222', at: T + 60_000, nights: 0 }, { pid: 'p3', n: 'Mike', t: '3333', at: T + 120_000, nights: 0 },
    { pid: 'p4', n: 'TESTER', t: '2599', at: T - 9 * DAY, nights: 0 }, { pid: 'p5', n: 'Bro', t: '5555', at: T - 5 * DAY, nights: 3 }, { pid: 'p6', n: 'test1', t: '6666', at: T - 3 * DAY, nights: 2 },
    { pid: 'p7', n: 'Owner', t: '7777', at: T + 30_000, nights: 0, admin: true }, { pid: 'p8', n: 'Lonely', t: '8888', at: T - 2 * DAY, nights: 1 }]);
  const pre = Object.fromEntries(rows.map(r => [r.pid, r.pre]));
  assert.deepEqual(pre, { p1: true, p2: true, p3: true, p4: false, p5: false, p6: false, p7: false, p8: false },
    `pre-ticked: the burst's 0-night test names + the burst's 0-night "Mike" (two reasons); never TESTER#2599, a 2+ night player, an admin, a one-reason profile (${JSON.stringify(rows.map(r => [r.n, r.why]))})`);
  // the real list: from the first profile by default, with nights + last seen
  const old = await ensure('u-tpold', 'Oldtimer');
  tick(DAY);
  const owner = await ensure('u-tpown', 'Owner2');
  const t1 = await ensure('u-tp1', 'WKA'), t2 = await ensure('u-tp2', 'WKB');
  const room = await seedRoom('slip', ['u-tp1', 'u-tp2'], { dist: 7000 }, { 'u-tp1': 'WKA', 'u-tp2': 'WKB' });
  await report('u-tp1', room); tick();
  process.env.ADMIN_PIDS = `${owner.pid}`;
  try {
    const list = await adminAction('u-tpown', { action: 'testPlayers' });
    const ids = list.players.map(p => p.pid);
    assert.ok(ids.includes(old.pid) && ids.includes(t1.pid), 'CREATED SINCE defaults to the very first profile');
    assert.ok(list.first && list.first <= (await val(`profiles/${old.pid}/at`)) && list.total >= 4, `the first profile's date + the total (${list.first}, ${list.total})`);
    const r1 = list.players.find(p => p.pid === t1.pid);
    assert.ok(r1.nights === 1 && r1.last > 0 && r1.m === 1 && Array.isArray(r1.why), `a row: nights + last seen + its reasons (${JSON.stringify(r1)})`);
    assert.ok(!list.players.find(p => p.pid === owner.pid).pre, 'the admin is never pre-ticked');
    const later = await adminAction('u-tpown', { action: 'testPlayers', since: clock - 30 * 60_000 });
    assert.ok(!later.players.some(p => p.pid === old.pid), 'a CREATED SINCE date leaves the older ones out');
    // the grouped logs
    await ref('errlog').set({ e000000000000001: { m: 'Boom 12345', n: 4, first: clock - 5000, last: clock }, e000000000000002: { m: 'Boom 99999', n: 2, first: clock - 4000, last: clock }, e000000000000003: { m: 'Other', n: 1, first: clock, last: clock } });
    await ref('phonelog').set({ rep0000000001: { at: clock, kind: 'hang', text: 'x' }, rep0000000002: { at: clock, kind: 'tap', text: 'y' } });
    await rejects(adminAction('u-tp1', { action: 'seenLogs', sigs: ['e000000000000001'] }), 403, 'not_admin');
    await rejects(adminAction('u-tpown', { action: 'seenLogs', sigs: ['../profiles'] }), 400, 'bad_ids');
    const seen = await adminAction('u-tpown', { action: 'seenLogs', sigs: ['e000000000000001', 'e000000000000002'], ids: ['rep0000000001'] });
    assert.equal(await val('errlog/e000000000000001/seen'), 4); assert.equal(await val('errlog/e000000000000002/seen'), 2); assert.equal(await val('errlog/e000000000000003/seen'), null);
    assert.equal(await val('phonelog/rep0000000001/seen'), true); assert.equal(await val('phonelog/rep0000000002/seen'), null);
    assert.ok(seen.errors.length === 3 && seen.reports.length === 2, 'MARK SEEN returns the fresh lists');
    const cl = await adminAction('u-tpown', { action: 'clearErrors', sigs: ['e000000000000001', 'e000000000000002'] });
    assert.deepEqual(cl.errors.map(e => e.sig), ['e000000000000003'], 'CLEAR a group: only its entries go');
    const cr = await adminAction('u-tpown', { action: 'clearReports', ids: ['rep0000000002'] });
    assert.deepEqual(cr.reports.map(r => r.id), ['rep0000000001']);
    const acts = Object.values((await val('audit')) || {}).map(a => a.act);
    assert.ok(acts.includes('seenLogs') && acts.includes('clearError') && acts.includes('clearReport'), `audited (${acts.join(', ')})`);
  } finally { process.env.ADMIN_PIDS = ''; await ref('audit').remove(); await ref('errlog').remove(); await ref('phonelog').remove(); }
});

// THE SPEED PASS add-on — THE PROGRESS RESET: admins only; the preview writes nothing; CONFIRM (typed RESET) writes a BACKUP first, stamps
// FOUNDING MEMBER on everyone who qualifies FIRST, then zeroes XP / levels / ranks / streaks / achievements / records + THE BOARD — every item,
// the member Nº, the founder card + the equipped card stay; a second run is harmless; a backup restores the progress (never takes an item)
test('THE PROGRESS RESET: a backup + FOUNDING MEMBER first, progress + THE BOARD zeroed, every item kept, a second run harmless, a restore', async () => {
  const a = await ensure('u-rsa', 'Resetter'), b = await ensure('u-rsb', 'Other'), own = await ensure('u-rsown', 'Boss');
  const room = await seedRoom('slip', ['u-rsa', 'u-rsb'], { dist: 7000 }, { 'u-rsa': 'Resetter', 'u-rsb': 'Other' });
  await report('u-rsa', room); tick();
  // (b played but the founder card never reached it — the sweep must give it BEFORE the wipe)
  await ref(`pstats/${b.pid}/it/card-founder`).remove(); await ref(`profiles/${b.pid}/fd`).remove();
  await ref(`pstats/${a.pid}/it/card-dev-switchboard`).set(clock);   // (a 1-of-1 — kept)
  await ref(`profiles/${a.pid}/cd`).set('card-founder');
  await ref(`lb/slip-wins/all/${a.pid}`).set(5); await ref(`pstats/${a.pid}/st`).set({ n: 4, d: 'd20261014', b: 4, f: 1 });
  const before = await val(`pstats/${a.pid}`), mnA = await val(`profiles/${a.pid}/mn`), itA = before.it;
  assert.ok(before.xp > 0 && Object.keys(before.g || {}).length, 'a has progress');
  process.env.ADMIN_PIDS = `${own.pid}`;
  try {
    await rejects(adminAction('u-rsa', { action: 'progressReset' }), 403, 'not_admin');
    const dry = await adminAction('u-rsown', { action: 'progressReset' });
    assert.equal(dry.done, false); assert.ok(dry.preview.profiles >= 3 && dry.preview.xp >= before.xp && dry.preview.items === 0, `the preview (${dry.line})`);
    assert.match(dry.line, /profiles · [\d,]+ XP · \d+ board records? · \d+ achievements? · \d+ streaks? will be reset; 0 items removed/);
    assert.ok((await val(`pstats/${a.pid}/xp`)) > 0 && (await val('backups')) == null, 'the preview wrote nothing');
    await rejects(adminAction('u-rsown', { action: 'progressReset', confirm: true, typed: 'reset please' }), 400, 'type_reset');
    const r = await adminAction('u-rsown', { action: 'progressReset', confirm: true, typed: 'RESET' });
    assert.ok(r.done && /^b\d+$/.test(r.stamp) && r.founders >= 1, `done (backup ${r.stamp}, ${r.founders} founder cards first)`);
    const bk = await val(`backups/${r.stamp}`);
    assert.ok(bk && bk.s[a.pid].xp === before.xp && bk.lb && bk.p[a.pid].x === before.xp, 'THE BACKUP holds the progress as it was');
    const sa = await val(`pstats/${a.pid}`), pa = await val(`profiles/${a.pid}`), sb = await val(`pstats/${b.pid}`);
    assert.ok(!sa.xp && !sa.g && !sa.b && !sa.ac && !sa.pa && !sa.gw, 'XP, mastery counters, records, achievements, the week: gone');
    assert.deepEqual(sa.st, { f: 1 }, 'the streak gone, the freeze held kept');
    assert.deepEqual(sa.it, itA, 'EVERY item kept (the 1-of-1 + FOUNDING MEMBER)');
    assert.ok(pa.x === 0 && pa.l === 1 && pa.r === 0 && pa.m === 0 && pa.mn === mnA && pa.cd === 'card-founder' && pa.n === 'Resetter', 'the profile: level 1, rank 0 — name, Nº, the equipped card kept');
    assert.ok(sb.it['card-founder'] && (await val(`profiles/${b.pid}/fd`)) === true, 'FOUNDING MEMBER stamped on b BEFORE the wipe');
    assert.equal(await val('lb'), null, 'THE BOARD is empty');
    // RE-CLIMBING: a new match after the reset re-grants nothing a player already owns, and the tease names a level whose reward isn't owned
    tick(DAY);
    const room2 = await seedRoom('slip', ['u-rsa', 'u-rsb'], { dist: 7000 }, { 'u-rsa': 'Resetter', 'u-rsb': 'Other' });
    const rr = await report('u-rsa', room2); tick();
    const o = rr.outcome, { LEVEL_REWARDS } = await import('../../js/core/levels.js');
    assert.ok(o && !(o.items || []).some(id => itA[id]), `no owned reward re-granted (${JSON.stringify(o && o.items)})`);
    assert.ok(o && (o.nx === null || LEVEL_REWARDS.some(x => x.lvl === o.nx && !itA[x.item])), `the tease: level ${o && o.nx} — a reward not owned yet`);
    // a second run: harmless
    const r2 = await adminAction('u-rsown', { action: 'progressReset', confirm: true, typed: 'RESET' });
    assert.ok(r2.done && r2.preview.items === 0 && !(await val(`pstats/${a.pid}/xp`)) && (await val(`profiles/${a.pid}/x`)) === 0, 'a second run: only the new progress goes (the re-climb), never an item');
    assert.deepEqual((await val(`pstats/${a.pid}`)).it, itA, '…and still takes no item');
    const bl = await adminAction('u-rsown', { action: 'progressBackups' });
    assert.ok(bl.backups.length === 2 && bl.backups[0].at >= bl.backups[1].at, 'the backups, newest first');
    // RESTORE the first backup
    await rejects(adminAction('u-rsown', { action: 'progressRestore', stamp: r.stamp, confirm: true, typed: 'yes' }), 400, 'type_restore');
    await adminAction('u-rsown', { action: 'progressRestore', stamp: r.stamp, confirm: true, typed: 'RESTORE' });
    assert.ok((await val(`pstats/${a.pid}/xp`)) === before.xp && (await val(`profiles/${a.pid}/x`)) === before.xp && (await val(`lb/slip-wins/all/${a.pid}`)) === 5, 'restored: XP + THE BOARD back');
    assert.ok((await val(`pstats/${b.pid}/it/card-founder`)), 'a restore never takes an item away (b keeps the founder card it got)');
    const acts = Object.values((await val('audit')) || {}).map(x => x.act);
    assert.ok(acts.filter(x => x === 'progressReset').length === 2 && acts.includes('progressRestore'), 'audited');
  } finally { process.env.ADMIN_PIDS = ''; await ref('audit').remove(); await ref('backups').remove(); }
});

// LOBBY FIXES — ONE PROFILE, ONE SEAT + ONE ACCOUNT, ONE ROOM: whatever a client does, the server credits a profile once per match (its
// WORSE seat) and never for a match that overlaps one it already counted in ANOTHER room
test('ONE ACCOUNT, ONE ROOM: one profile in two seats is credited once (the worse); two rooms at once — the second never counts', async () => {
  const dupe = await ensure('u-dupe1', 'Dupe');
  await ensure('u-dupeo', 'Other');
  await ref('uids/u-dupe2').set(dupe.pid);   // (the laptop restored the phone's card)
  const one = await seedRoom('slip', ['u-dupe1', 'u-dupe2', 'u-dupeo'], {}, { 'u-dupe1': 'Dupe', 'u-dupe2': 'Dupe', 'u-dupeo': 'Other' });
  const r1 = await report('u-dupe1', one);
  assert.equal(r1.status, 'counted');
  let st = await val(`pstats/${dupe.pid}`);
  assert.equal(st.g.slip.p, 1, 'one match, once');
  assert.ok(!st.g.slip.w, 'credited with the WORSE seat (2nd) — never the win the other seat took');
  // two rooms at once: room A ran from 5 min ago to now; room B (the laptop, another room) ended 1 min ago — inside A
  tick(60_000);
  const solo = await ensure('u-solo1', 'Solo');
  await ref('uids/u-solo2').set(solo.pid);
  await ensure('u-sa', 'Ann'); await ensure('u-sb', 'Bea');
  const a = await seedRoom('slip', ['u-sa', 'u-solo1'], {}, { 'u-sa': 'Ann', 'u-solo1': 'Solo' });
  await ref(`rooms/${a.code}/game/go`).set(clock - 300_000);
  const b = await seedRoom('slip', ['u-solo2', 'u-sb'], {}, { 'u-solo2': 'Solo', 'u-sb': 'Bea' });
  await ref(`rooms/${b.code}/night/${b.matchId}/at`).set(clock - 60_000);
  assert.equal((await report('u-sa', a)).status, 'counted');
  tick(60_000);
  const rb = await report('u-sb', b);
  assert.equal(rb.status, 'counted', 'the room itself counts');
  st = await val(`pstats/${solo.pid}`);
  assert.equal(st.g.slip.p, 1, 'Solo is credited for ONE of the two overlapping matches');
  assert.ok(Array.isArray(st.ov) && st.ov.length === 1 && st.ov[0].c === a.code, 'the counted window is kept');
  assert.ok((await val(`pstats/${(await val('uids/u-sb'))}`)).g.slip.p === 1, 'the other player in room B is credited as usual');
  tick(60_000);
});

test('admin: only ADMIN_PIDS, every action works and is audited', async () => {
  const boss = await ensure('u-boss', 'Boss');
  const target = await ensure('u-target', 'Cheater');
  await ensure('u-target2', 'Victim');
  const room = await seedRoom('slip', ['u-target', 'u-target2'], { dist: 9000 }, { 'u-target': 'Cheater', 'u-target2': 'Victim' });
  await report('u-target', room);
  tick();
  assert.deepEqual(await adminAction('u-boss', { action: 'whoami' }), { pid: boss.pid, admin: false });
  await rejects(adminAction('u-boss', { action: 'search', q: 'che' }), 403, 'not_admin');
  await rejects(adminAction('u-nobody', { action: 'player', pid: target.pid }), 403, 'not_admin');
  process.env.ADMIN_PIDS = `${boss.pid}`;
  try {
    assert.equal((await adminAction('u-boss', { action: 'whoami' })).admin, true);
    const found = (await adminAction('u-boss', { action: 'search', q: 'chea' })).players;
    assert.ok(found.some(p => p.pid === target.pid), 'by name prefix');
    assert.equal((await adminAction('u-boss', { action: 'search', q: `Cheater#${target.profile.t}` })).players[0].pid, target.pid, 'by tag');
    assert.equal((await adminAction('u-boss', { action: 'search', q: target.pid })).players[0].pid, target.pid, 'by id');
    let v = await adminAction('u-boss', { action: 'player', pid: target.pid });
    assert.ok(v.boards.some(b => b.b === 'slip-dist' && b.all.v === 9000));
    // remove a record (both periods)
    v = await adminAction('u-boss', { action: 'removeRecord', pid: target.pid, b: 'slip-dist' }, clock);
    assert.equal(await val(`lb/slip-dist/all/${target.pid}`), null);
    assert.equal(await val(`lb/slip-dist/${weekKey(clock)}/${target.pid}`), null);
    assert.equal((await val(`pstats/${target.pid}/b/slip-dist`)), null);
    // reset a career board
    assert.equal(await val(`lb/slip-wins/all/${target.pid}`), 1);
    await adminAction('u-boss', { action: 'resetBoard', pid: target.pid, b: 'slip-wins' }, clock);
    assert.equal(await val(`lb/slip-wins/all/${target.pid}`), null);
    assert.equal((await val(`pstats/${target.pid}/g/slip/w`)), null);
    // rename (no daily limit)
    await adminAction('u-boss', { action: 'rename', pid: target.pid, name: 'Renamed' }, clock);
    await adminAction('u-boss', { action: 'rename', pid: target.pid, name: 'Renamed2' }, clock + 10);
    assert.equal((await val(`profiles/${target.pid}`)).n, 'Renamed2');
    // hide: off every board; the player can't opt back in
    await adminAction('u-boss', { action: 'hide', pid: target.pid, on: true }, clock);
    assert.equal((await val(`profiles/${target.pid}`)).h, true);
    await profileAction('u-target', { action: 'show', on: true }, '', clock);
    assert.equal((await val(`profiles/${target.pid}`)).h, true, 'still hidden');
    tick();
    const r2 = await seedRoom('slip', ['u-target', 'u-target2'], { dist: 100 }, { 'u-target': 'Renamed2', 'u-target2': 'Victim' });
    await report('u-target', r2);
    assert.equal(await val(`lb/slip-dist/all/${target.pid}`), null, 'a hidden player\'s new results stay off the boards');
    await adminAction('u-boss', { action: 'hide', pid: target.pid, on: false }, clock);
    assert.ok(!(await val(`profiles/${target.pid}`)).h);
    assert.equal(await val(`lb/slip-dist/all/${target.pid}`), 100, 'unhidden: back on');
    const log = (await adminAction('u-boss', { action: 'audit' })).log;
    assert.deepEqual(log.slice(0, 6).map(l => l.act), ['unhide', 'hide', 'rename', 'rename', 'resetBoard', 'removeRecord']);
    assert.ok(log.every(l => l.by === boss.pid));
  } finally { process.env.ADMIN_PIDS = ''; }
});

// ---- the HTTP layer: real ID tokens from the auth emulator
async function signUp() {
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"returnSecureToken":true}' });
  return r.json();
}
function call(handler, { method = 'POST', url = '/', token, body } = {}) {
  return new Promise(resolve => {
    const req = { method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, body: body || {} };
    const headers = {};
    const res = { statusCode: 200, setHeader: (k, v) => { headers[k.toLowerCase()] = v; }, end: t => resolve({ status: res.statusCode, headers, body: JSON.parse(t) }) };
    handler(req, res);
  });
}

test('HTTP: every call needs a valid ID token; the board is public and cacheable', async () => {
  clock = Date.now();
  const u = await signUp();
  assert.equal((await call(reportHandler, { body: { code: 'ABCD', matchId: 'x1' } })).status, 401);
  assert.equal((await call(reportHandler, { token: 'forged.token.here', body: { code: 'ABCD', matchId: 'x1' } })).status, 401);
  await ensure(u.localId, 'HTTPU');   // (a phone makes its profile when it joins — a report never mints one)
  const room = await seedRoom('cipher', [u.localId, 'u-http2']);
  const ok = await call(reportHandler, { token: u.idToken, body: { code: room.code, matchId: room.matchId } });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.status, 'counted');
  const b = await call(boardHandler, { method: 'GET', url: '/api/board?b=cipher-wins&p=all' });
  assert.equal(b.status, 200);
  assert.match(b.headers['cache-control'], /s-maxage/);
  assert.ok(b.body.rows.length > 0);
  assert.equal((await call(boardHandler, { method: 'GET', url: '/api/board?b=nope&p=all' })).status, 400);
  assert.equal((await call(boardHandler, { method: 'POST', url: '/api/board?b=cipher-wins' })).status, 400, 'POST is only REPORT');
  assert.equal((await call(boardHandler, { method: 'PUT', url: '/api/board?b=cipher-wins' })).status, 405);
  // LOBBY 2.0 A — REAL USERNAMES: the cached (CDN) response carries the USERNAME and nothing else of the player's — no profile id, no key,
  // no tag's digits; the row's keys exactly (n = the username)
  const text = JSON.stringify(b.body);
  const pid = await val(`uids/${u.localId}`);
  assert.ok(!text.includes(pid), 'no profile id in the public response');
  for (const r of b.body.rows) assert.deepEqual(Object.keys(r).sort(), ['a', 'c', 'id', 'l', 'n', 'r', 'rank', 'v']);   // (BNAME's t — the nickname's number — is gone)
});

// ---- THE BOARD's PUBLIC NAMES — REAL USERNAMES (LOBBY 2.0 A; reverses BNAME's house nicknames — kept only to stand in for a rude name)
test('REAL USERNAMES: the username on every public row — never the pid, the key or the tag; the board id stable; the stand-in nicknames clean', async () => {
  for (const a of NICK_ADJ) for (const n of NICK_NOUN) assert.ok(!isOffensive(`${a} ${n}`) && !isOffensive(`${a}${n}`), `${a} ${n}`);
  assert.ok(NICK_ADJ.length * NICK_NOUN.length >= 200, '~200 nicknames');
  const names = { 'u-bn1': 'Margaret', 'u-bn2': 'Theodore', 'u-bn3': 'Bartholomew' };
  const ps = {};
  for (const [u, n] of Object.entries(names)) ps[u] = await ensure(u, n);
  tick();
  const room = await seedRoom('cipher', Object.keys(names), {}, names);
  await report('u-bn1', room);
  tick();
  clearBoardCache();
  const seen = [];
  for (const b of ['cipher-wins', 'cipher-score']) for (const p of ['week', 'all']) seen.push(await boardQuery({ b, p }, clock));
  const text = JSON.stringify(seen);
  for (const [u, n] of Object.entries(names)) {
    assert.ok(!text.includes(ps[u].pid), `${n}: no profile id`);
    assert.ok(ps[u].key && !text.includes(ps[u].key), `${n}: no key (the server keeps only its hash)`);
    assert.ok(!text.includes(`"t":"${ps[u].profile.t}"`) && !text.includes(`#${ps[u].profile.t}`), `${n}: no tag digits`);
    assert.equal(ps[u].profile.bid, boardId(ps[u].pid), 'the profile carries its board id');
    const rows = seen.flatMap(q => q.rows).filter(r => r.id === ps[u].profile.bid);
    if (u === 'u-bn1' || rows.length) assert.ok(rows.length, `${n} is on a board`);
    for (const row of rows) assert.equal(row.n, n, 'the username'), assert.equal(row.t, undefined, 'no tag');
  }
  // stable: the same board id on the next call and the next week
  clearBoardCache();
  assert.equal(boardId(ps['u-bn1'].pid), ps['u-bn1'].profile.bid);
  assert.match(ps['u-bn1'].profile.bid, /^[0-9a-f]{16}$/);
  const again = await ensure('u-bn1', 'Margaret');
  assert.equal(again.profile.bid, ps['u-bn1'].profile.bid);
});

test('BNAME: the 3-match floor — listed from the 3rd counted match (all games together), every game\'s boards at once', async () => {
  process.env.BOARD_MIN_MATCHES = '3';
  try {
    const me = await ensure('u-floor', 'Newcomer');
    await ensure('u-floor2', 'Pal');
    const names = { 'u-floor': 'Newcomer', 'u-floor2': 'Pal' };
    const listed = async b => { clearBoardCache(); const q = await boardQuery({ b, p: 'all' }, clock); return q.rows.some(r => r.id === me.profile.bid); };
    tick(60_000);
    let room = await seedRoom('slip', ['u-floor', 'u-floor2'], { dist: 4000 }, names);
    { const rr = await report('u-floor', room); assert.equal(rr.status, 'counted'); assert.ok(!rr.outcome.skip, JSON.stringify(rr.outcome)); }
    assert.equal(await val(`profiles/${me.pid}/m`), 1, 'the server counts the matches');
    assert.equal(await listed('slip-dist'), false, '1 match: not listed');
    assert.equal(await val(`lb/slip-dist/all/${me.pid}`), null, 'no board entry is written yet');
    tick(60_000);
    room = await seedRoom('golf', ['u-floor', 'u-floor2'], {}, names);
    { const rr = await report('u-floor', room); assert.equal(rr.status, 'counted'); assert.ok(!rr.outcome.skip, JSON.stringify(rr.outcome)); }
    const two = await profileAction('u-floor', { action: 'me' }, '', clock);
    assert.equal(two.profile.m, 2);
    assert.equal(two.profile.mm, 3, 'the client learns the floor (2 more → "1 MORE MATCH")');
    assert.equal(await listed('slip-dist'), false, '2 matches: not listed');
    tick(60_000);
    room = await seedRoom('cipher', ['u-floor', 'u-floor2'], {}, names);
    await report('u-floor', room);
    assert.equal(await val(`profiles/${me.pid}/m`), 3);
    assert.equal(await listed('cipher-wins') || await listed('cipher-score'), true, '3rd match: listed');
    assert.equal(await listed('slip-dist'), true, 'the earlier games\' boards go up at once');
    assert.ok(await val(`lb/golf-par9/all/${me.pid}`) != null, 'golf too');
    // an older profile without a stored count: taken from its stats
    await ref(`profiles/${me.pid}/m`).remove();
    assert.equal(await listed('slip-dist'), true, 'counted from pstats');
  } finally { process.env.BOARD_MIN_MATCHES = '1'; }
});

test('REPORT a row — stored for /admin with the real profile, limited per device + IP, admins only read it; the owner gets ONE push (LOBBY 2.0 A)', async () => {
  await ref('/').update({ flags: null, rl: null });
  const bad = await ensure('u-rep1', 'Suspect');
  const boss = await ensure('u-repboss', 'Boss');
  tick(60_000);
  const room = await seedRoom('slip', ['u-rep1', 'u-rep2'], { dist: 9900 }, { 'u-rep1': 'Suspect', 'u-rep2': 'Witness' });
  await report('u-rep1', room);
  clearBoardCache();
  const id = bad.profile.bid;
  await rejects(flagRow({ b: 'slip-dist', id: 'nope', why: 'score' }, { ip: '9.9.9.1', now: clock }), 400, 'bad_report');
  await rejects(flagRow({ b: 'slip-dist', id, why: 'cheese' }, { ip: '9.9.9.1', now: clock }), 400, 'bad_report');
  await rejects(flagRow({ b: 'slip-dist', id: '0123456789abcdef', why: 'score' }, { ip: '9.9.9.1', now: clock }), 404, 'no_row');
  // LOBBY 2.0 A — THE REPORT PUSH: the owner's subscribed phone (a local receiver here — the emulators allow an http://127.0.0.1 endpoint)
  // gets ONE push for the reported row ("Name reported: …"), the second report within the hour none; a dead receiver never fails a report
  const { createServer } = await import('node:http'), C = await import('node:crypto');
  const hits = [];
  const rx = createServer((req, res) => { let n = 0; req.on('data', d => { n += d.length; }); req.on('end', () => { hits.push({ ttl: req.headers.ttl, enc: req.headers['content-encoding'], n }); res.writeHead(201).end(); }); });
  await new Promise(r => rx.listen(0, '127.0.0.1', r));
  const ua = C.createECDH('prime256v1'); ua.generateKeys();
  await ref('radio/push/subs/test').set({ endpoint: `http://127.0.0.1:${rx.address().port}/push`, keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: C.randomBytes(16).toString('base64url') } });
  try {
    assert.deepEqual(await flagRow({ b: 'slip-dist', id, why: 'score', dev: 'device00001' }, { ip: '9.9.9.1', now: clock }), { ok: true });
    await flagRow({ b: 'slip-dist', id, why: 'name', dev: 'device00002' }, { ip: '9.9.9.2', now: clock });
    assert.equal(hits.length, 1, `ONE push for the row in the hour (${hits.length})`);
    assert.equal(hits[0].enc, 'aes128gcm', 'an encrypted Web Push');
    assert.ok((await val(`flags/${id}/pushedAt`)) === clock, 'the push is marked on the flag');
  } finally { rx.close(); await ref('radio/push').remove(); }
  const f = await val(`flags/${id}`);
  assert.equal(f.pid, bad.pid, 'the server keeps whose row it was');
  assert.equal(f.n, 2);
  assert.deepEqual(f.why, { score: 1, name: 1 });
  assert.deepEqual(f.b, { 'slip-dist': 2 });
  // per device: the 6th report in an hour from one device is refused (from new IPs each time)
  for (let i = 1; i < FLAG_LIMITS.devPerHour; i++) await flagRow({ b: 'slip-dist', id, why: 'score', dev: 'device00001' }, { ip: `8.8.8.${i}`, now: clock });
  await rejects(flagRow({ b: 'slip-dist', id, why: 'score', dev: 'device00001' }, { ip: '8.8.9.9', now: clock }), 429, 'report_limit');
  // per IP: new devices, one address
  for (let i = 1; i < FLAG_LIMITS.ipPerHour; i++) await flagRow({ b: 'slip-dist', id, why: 'score', dev: `devipx0000${i}` }, { ip: '9.9.9.2', now: clock });
  await rejects(flagRow({ b: 'slip-dist', id, why: 'score', dev: 'devipx00099' }, { ip: '9.9.9.2', now: clock }), 429, 'report_limit');
  // an hour later the device may report again
  assert.deepEqual(await flagRow({ b: 'slip-dist', id, why: 'score', dev: 'device00001' }, { ip: '7.7.7.7', now: clock + 3600_001 }), { ok: true });
  // the HTTP route (no sign-in)
  const viaHttp = await call(boardHandler, { method: 'POST', url: '/api/board', body: { action: 'report', b: 'slip-dist', id, why: 'score', dev: 'devhttp0001' } });
  assert.equal(viaHttp.status, 200, JSON.stringify(viaHttp.body));
  // /admin: admins only; the real name is there, the dismiss is audited
  await rejects(adminAction('u-repboss', { action: 'flags' }), 403, 'not_admin');
  process.env.ADMIN_PIDS = boss.pid;
  try {
    const { flags } = await adminAction('u-repboss', { action: 'flags' }, clock);
    const mine = flags.find(x => x.id === id);
    assert.equal(mine.player.n, 'Suspect');
    assert.deepEqual(mine.nick, { n: 'Suspect' }, 'the name the board shows (LOBBY 2.0 A: the username)');
    await adminAction('u-repboss', { action: 'hide', pid: bad.pid, on: true }, clock);
    clearBoardCache();
    assert.ok(!(await boardQuery({ b: 'slip-dist', p: 'all' }, clock)).rows.some(r => r.id === id), 'hidden from the boards');
    const after = await adminAction('u-repboss', { action: 'clearFlag', id }, clock);
    assert.ok(!after.flags.some(x => x.id === id), 'dismissed');
    await rejects(adminAction('u-repboss', { action: 'clearFlag', id: 'x' }, clock), 400, 'bad_id');
  } finally { process.env.ADMIN_PIDS = ''; }
});

// ---- errors from phones (api/log.js) and the admin's view of them
test('error log: grouped by error, rate-limited, readable and clearable by admins only', async () => {
  await ref('/').update({ errlog: null, rl: null });
  const now = Date.now();
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  const android = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
  const err = { m: "TypeError: Cannot read properties of undefined (reading 'si')", s: 'js/games/pulse/view.js', l: 210, c: 14, k: 'at update (/js/games/pulse/view.js:210:14)', w: 'game:pulse/play' };
  assert.equal(await logErrors({ p: 'app', e: [err] }, { ip: '1.1.1.1', ua: iphone, now }), 1);
  assert.equal(await logErrors({ p: 'app', e: [err, { m: 'other', s: 'js/app.js', l: 3 }] }, { ip: '2.2.2.2', ua: android, now: now + 1 }), 2);
  const all = await val('errlog');
  assert.equal(Object.keys(all).length, 2, 'the same error from two phones is one entry');
  const e = all[errorSig(err)];
  assert.equal(e.n, 2);
  assert.deepEqual(e.d, { iPhone: 1, Android: 1 });
  assert.deepEqual(e.b, { Safari: 1, Chrome: 1 });
  assert.equal(e.w, 'game:pulse/play');
  // junk and oversized batches
  assert.equal(await logErrors({ e: 'nope' }, { ip: '3.3.3.3', now }), 0);
  assert.equal(await logErrors({ e: [{ m: '' }, null, 5] }, { ip: '3.3.3.3', now }), 0);
  // per-IP limit: 40 an hour
  const many = Array.from({ length: 10 }, (_, i) => ({ m: `spam ${i}x`, s: 'js/app.js', l: i }));
  let kept = 0;
  for (let i = 0; i < 6; i++) kept += await logErrors({ e: many }, { ip: '9.9.9.9', now: now + i });
  assert.equal(kept, 40);
  assert.equal(await logErrors({ e: [err] }, { ip: '9.9.9.9', now: now + 3_700_000 }), 1, 'an hour later it is allowed again');
  // HTTP: no sign-in needed; a text/plain beacon body works; too big is refused
  const r = await call(logHandler, { body: JSON.stringify({ p: 'board', e: [{ m: 'from the board', s: 'js/board/view.js', l: 1 }] }) });
  assert.equal(r.status, 200);
  assert.equal(r.body.kept, 1);
  const big = await new Promise(resolve => {
    const res = { statusCode: 200, setHeader() {}, end: t => resolve({ status: res.statusCode, body: JSON.parse(t) }) };
    logHandler({ method: 'POST', url: '/', headers: { 'content-length': '50000' }, body: '{}' }, res);
  });
  assert.equal(big.status, 413);
  // the admin side
  const boss = await ensure('u-errboss', 'ErrBoss');
  await rejects(adminAction('u-errboss', { action: 'errors' }), 403, 'not_admin');
  process.env.ADMIN_PIDS = boss.pid;
  try {
    let list = (await adminAction('u-errboss', { action: 'errors' }, now + 3_800_000)).errors;
    assert.ok(list.length >= 3);
    assert.ok(list[0].last >= list[list.length - 1].last, 'newest first');
    assert.ok(list.some(x => x.p === 'board'));
    const sig = errorSig(err);
    list = (await adminAction('u-errboss', { action: 'clearErrors', sig }, now)).errors;
    assert.ok(!list.some(x => x.sig === sig), 'one cleared');
    await rejects(adminAction('u-errboss', { action: 'clearErrors', sig: '../profiles' }), 400, 'bad_sig');
    // entries quiet for 30 days are pruned when the list is read
    list = (await adminAction('u-errboss', { action: 'errors' }, now + 31 * DAY)).errors;
    assert.equal(list.length, 0);
    assert.equal(await val('errlog'), null);
    await logErrors({ e: [err] }, { ip: '4.4.4.4', now });
    list = (await adminAction('u-errboss', { action: 'clearErrors' }, now)).errors;
    assert.equal(list.length, 0, 'all cleared');
    assert.equal((await adminAction('u-errboss', { action: 'audit' })).log[0].act, 'clearErrors');
  } finally { process.env.ADMIN_PIDS = ''; }
});

// ---- 9e — SEND REPORT + the hang watch (api/log.js#logReport) and the admin's view of them
test('phone reports: stored as plain text, rate-limited, newest 40 kept, admins only', async () => {
  await ref('/').update({ phonelog: null, rl: null });
  const now = Date.UTC(2026, 9, 28, 3);
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  assert.equal(cleanReport(null), null);
  assert.equal(cleanReport({ text: '   ' }), null);
  assert.deepEqual(cleanReport({ kind: 'weird', text: 'x' }), { kind: 'tap', text: 'x' });
  assert.equal(cleanReport({ kind: 'hang', text: 'y'.repeat(99_999) }).text.length, REPORT_LIMITS.text);
  assert.equal(await logReport({ p: 'report', r: { kind: 'hang', text: 'THE MAIN THREAD STOPPED' } }, { ip: '5.5.5.5', ua: iphone, now }), 1);
  const all = Object.values(await val('phonelog'));
  assert.equal(all.length, 1);
  assert.equal(all[0].kind, 'hang'); assert.equal(all[0].d, 'iPhone'); assert.equal(all[0].text, 'THE MAIN THREAD STOPPED');
  // 8 an hour per IP
  let kept = 0; for (let i = 0; i < 12; i++) kept += await logReport({ r: { text: `r${i}` } }, { ip: '6.6.6.6', now: now + i });
  assert.equal(kept, REPORT_LIMITS.ipPerHour);
  // HTTP: the same endpoint as the errors, a report body
  const r = await call(logHandler, { body: JSON.stringify({ p: 'report', r: { kind: 'tap', text: 'SEND REPORT' } }) });
  assert.equal(r.status, 200); assert.equal(r.body.kept, 1);
  const boss = await ensure('u-repboss', 'RepBoss');
  await rejects(adminAction('u-repboss', { action: 'reports' }), 403, 'not_admin');
  process.env.ADMIN_PIDS = boss.pid;
  try {
    let list = (await adminAction('u-repboss', { action: 'reports' })).reports;
    assert.ok(list.length >= 9 && list[0].at >= list[list.length - 1].at, 'newest first');
    list = (await adminAction('u-repboss', { action: 'clearReports', id: list[0].id })).reports;
    assert.ok(list.length >= 8);
    await rejects(adminAction('u-repboss', { action: 'clearReports', id: '../profiles' }), 400, 'bad_id');
    list = (await adminAction('u-repboss', { action: 'clearReports' })).reports;
    assert.equal(list.length, 0);
  } finally { process.env.ADMIN_PIDS = ''; }
});

test('CITY 2.0 preview panel: cityLive / cityClear — admins only, validated plain values, one public node, audited', async () => {
  await ref('city2').remove();
  const boss = await ensure('u-cityboss', 'CityBoss');
  await ensure('u-cityguest', 'CityGuest');
  const st = { force: ['drones', 'aurora'], text: 'happy birthday', show: 'heart', when: '2026-10-24T23:00', speed: 20, wx: 'rain' };
  await rejects(adminAction('u-cityboss', { action: 'cityLive', state: st }), 403, 'not_admin');
  await rejects(adminAction('u-cityguest', { action: 'cityClear' }), 403, 'not_admin');
  assert.equal(await val('city2/live'), null, 'nothing written by a non-admin');
  process.env.ADMIN_PIDS = boss.pid;
  try {
    const now = Date.now();
    const r = await adminAction('u-cityboss', { action: 'cityLive', state: st, mins: 45 }, now);
    const live = await val('city2/live');
    assert.deepEqual(live, r.live);
    assert.equal(live.startAt, now); assert.equal(live.until, now + 45 * 60_000); assert.equal(live.by, boss.pid);
    // (POLISH 4: the drone show is a MESSAGE now — no shapes: its `show` is no longer one of its inputs, so it's dropped, never stored)
    assert.deepEqual(live.state, { force: ['drones', 'aurora'], text: 'HAPPY BIRTHDAY', when: '2026-10-24T23:00', speed: 20, wx: 'rain' });
    assert.equal(live.params.force, 'drones,aurora'); assert.equal(live.params.speed, '20');
    assert.match(live.label, /DRONE SHOW “HAPPY BIRTHDAY” · AURORA/);
    // (C2 — THE PANEL'S DELAY: startAt pushed by 0–10 s, `until` counted from it; anything else refused)
    { const d = (await adminAction('u-cityboss', { action: 'cityLive', state: { wx: 'snow' }, mins: 15, delay: 3 }, now)).live;
      assert.equal(d.startAt, now + 3000); assert.equal(d.until, now + 3000 + 15 * 60_000); }
    await rejects(adminAction('u-cityboss', { action: 'cityLive', state: { wx: 'snow' }, delay: 60 }), 400, 'bad_delay');
    await rejects(adminAction('u-cityboss', { action: 'cityLive', state: { wx: 'snow' }, delay: 1.5 }), 400, 'bad_delay');
    // the default is 30 minutes; anything the registry doesn't know is refused, nothing half-written
    assert.equal((await adminAction('u-cityboss', { action: 'cityLive', state: { force: ['banner'], text: 'HI' } }, now)).live.until, now + 30 * 60_000);
    await rejects(adminAction('u-cityboss', { action: 'cityLive', state: { force: ['banner', '<img src=x>'] } }), 400, 'bad_state');
    await rejects(adminAction('u-cityboss', { action: 'cityLive', state: { force: ['banner'], when: 'tomorrow' } }), 400, 'bad_state');
    await rejects(adminAction('u-cityboss', { action: 'cityLive', state: { wx: 'rain' }, mins: 9999 }), 400, 'bad_mins');
    await rejects(adminAction('u-cityboss', { action: 'cityLive', state: {} }), 400, 'empty_state');
    await rejects(adminAction('u-cityboss', { action: 'cityLive', state: 'force=banner' }), 400, 'empty_state');
    assert.equal((await val('city2/live')).state.text, 'HI', 'the refused calls left the last good state');
    assert.deepEqual(await adminAction('u-cityboss', { action: 'cityClear' }), { live: null });
    assert.equal(await val('city2/live'), null);
    const log = (await adminAction('u-cityboss', { action: 'audit' })).log.filter(l => l.by === boss.pid).map(l => l.act);
    assert.deepEqual(log.slice(0, 3), ['cityClear', 'cityLive', 'cityLive'], 'every send + the clear in the audit log');
  } finally { process.env.ADMIN_PIDS = ''; }
});

// CONN — the public read of EVERYONE's preview: GET /api/admin?live=1 (no sign-in, edge-cached 15 s) instead of a database socket
test('CONN: GET /api/admin?live=1 — city2/live for any visitor, edge-cached, only the fields a phone plays, nothing else by GET', async () => {
  const call = url => new Promise(resolve => {
    const h = {};
    const res = { statusCode: 200, setHeader(k, v) { h[k.toLowerCase()] = v; }, end: b => resolve({ code: res.statusCode, h, body: b ? JSON.parse(b) : null }) };
    adminHandler({ method: 'GET', url, headers: {} }, res);
  });
  await ref('city2').remove();
  { const r = await call('/api/admin?live=1');
    assert.equal(r.code, 200); assert.equal(r.body.live, null); assert.ok(Math.abs(r.body.at - Date.now()) < 5000, 'the server time it was read');
    assert.equal(r.h['cache-control'], LIVE_CACHE); assert.match(LIVE_CACHE, /s-maxage=\d+/); assert.match(LIVE_CACHE, /public/); }
  const now = Date.now();
  await ref('city2/live').set({ v: 1, kind: 'preview', state: { force: ['banner'], text: 'HI ALL' }, params: { force: 'banner' }, label: 'secret label', startAt: now, until: now + 60_000, by: 'ptest00000000' });
  { const r = await call('/api/admin?live=1');
    assert.deepEqual(r.body.live, { state: { force: ['banner'], text: 'HI ALL' }, startAt: now, until: now + 60_000, by: 'owner' });
    assert.ok(!JSON.stringify(r.body).includes('ptest00000000'), 'FR6 FIXES A (C5): the admin profile id never in the public response');
    assert.ok(!JSON.stringify(r.body).includes('secret label'), 'the label stays private'); }
  // a finished preview reads as nothing (the phones go back to the real city)
  await ref('city2/live').update({ until: now - 1 });
  assert.equal((await call('/api/admin?live=1')).body.live, null);
  // GET does nothing else: no actions, no admin reads, never cached when refused
  { const r = await call('/api/admin?action=stats'); assert.equal(r.code, 400); assert.equal(r.h['cache-control'], 'no-store'); }
  { const r = await new Promise(resolve => { const res = { statusCode: 200, setHeader() {}, end: b => resolve({ code: res.statusCode, body: JSON.parse(b) }) }; adminHandler({ method: 'PUT', url: '/api/admin', headers: {} }, res); });
    assert.equal(r.code, 405); }
  await ref('city2').remove();
});

// CITY CONTROLS A — THE RADIO (api/_lib/radio.js): the ROLE per action, the jack + the audience allowed, the dark, ONE at a time per lane
// (the owner first), the crew's limits, the deliveries (the city through the cached GET, a room through its node), STOP, CLEAR ALL, the
// billboard, the dial, the record + the audit log — and a nobody refused at every action, nothing written
test('CITY CONTROLS A — THE RADIO: roles per action, the dark, one at a time, the crew limits, delivery, the record + the audit', async () => {
  await ref('/').update({ radio: null, here: null, 'city2/showcase': null });
  const boss = await ensure('u-radioboss', 'RadioBoss');
  const pal = await ensure('u-radiopal', 'RadioPal');
  await ensure('u-radiokid', 'RadioKid');
  const NIGHT_T = Date.UTC(2026, 10, 3, 3, 0, 0), DAY_T = Date.UTC(2026, 10, 3, 17, 0, 0);   // (Nov 2, 10 pm + Nov 3, noon — Eastern)
  // a NOBODY: no radio, every action refused, nothing written
  for (const a of ['radioState', 'radioFire', 'radioStop', 'radioClearAll', 'radioBoard', 'radioDial', 'radioRooms']) await rejects(adminAction('u-radiokid', { action: a, jack: 'ufo', aud: 'everyone', level: 'low', lines: ['HI'] }, NIGHT_T), 403, 'not_radio');
  assert.deepEqual(await adminAction('u-radiokid', { action: 'radioWho' }), { role: null });
  assert.equal(await val('radio/q'), null, 'a nobody wrote nothing');
  assert.equal(await val('city2/showcase'), null);
  process.env.ADMIN_PIDS = boss.pid;
  try {
    assert.deepEqual(await adminAction('u-radioboss', { action: 'radioWho' }), { role: 'owner' });
    // THE DESK's jacks come FROM THE TIMETABLE (14 now — no yacht until it exists); the UFO greyed by day with its "after dark — at …"
    { const st = await adminAction('u-radioboss', { action: 'radioState' }, DAY_T);
      assert.equal(st.role, 'owner'); assert.ok(st.jacks.length >= 14 && st.jacks.some(j => j.id === 'billboard') && !st.jacks.some(j => j.id === 'yacht'));
      const ufo = st.jacks.find(j => j.id === 'ufo'); assert.equal(ufo.run.ok, false); assert.match(ufo.run.note, /AFTER DARK ONLY — AT \d/); }
    await rejects(adminAction('u-radioboss', { action: 'radioFire', jack: 'ufo', aud: 'everyone' }, DAY_T), 409, 'cant_now');
    // by night: on its way (AMBER) for the city's ~45 s lead; the next legendary WAITS its turn; a skywrite (another lane) doesn't
    const a = (await adminAction('u-radioboss', { action: 'radioFire', jack: 'ufo', aud: 'everyone' }, NIGHT_T)).moment;
    assert.equal(a.at, NIGHT_T + 45_000); assert.equal(a.until, a.at + 40_000); assert.equal(a.state, 'q');
    const b = (await adminAction('u-radioboss', { action: 'radioFire', jack: 'tr3b', aud: 'everyone' }, NIGHT_T + 1000)).moment;
    assert.equal(b.at, a.until + 4000, 'the second legendary waits its turn');
    const w = (await adminAction('u-radioboss', { action: 'radioFire', jack: 'skywrite', aud: 'everyone', text: 'happy birthday', colour: '2ee6ff' }, NIGHT_T + 2000)).moment;
    assert.equal(w.at, NIGHT_T + 2000 + 45_000, 'a sky message is its own lane'); assert.equal(w.text, 'HAPPY BIRTHDAY');
    await rejects(adminAction('u-radioboss', { action: 'radioFire', jack: 'banner', aud: 'everyone', text: 'what the fuck' }, NIGHT_T), 400, 'words_words');
    await rejects(adminAction('u-radioboss', { action: 'radioFire', jack: 'banner', aud: 'everyone', text: 'X'.repeat(30) }, NIGHT_T), 400, 'words_long');
    await rejects(adminAction('u-radioboss', { action: 'radioFire', jack: 'nope', aud: 'everyone' }, NIGHT_T), 400, 'bad_jack');
    await rejects(adminAction('u-radioboss', { action: 'radioFire', jack: 'ufo', aud: 'mars' }, NIGHT_T), 400, 'bad_audience');
    // THE CITY's delivery: the cached GET carries the city's moments — never who fired them
    { const { cityLiveNow } = await import('../../api/admin.js'); const r = await cityLiveNow(NIGHT_T + 3000);
      const ids = r.radio.moments.map(m => m.id); assert.ok(ids.includes(a.id) && ids.includes(b.id) && ids.includes(w.id));
      assert.ok(!JSON.stringify(r.radio).includes(boss.pid), 'no profile id in public'); assert.equal(r.radio.moments.find(m => m.id === a.id).by, 'owner'); }
    // JUST ME: a preview on his phone — queued for his desk, never public, never a sighting
    const me = (await adminAction('u-radioboss', { action: 'radioFire', jack: 'blackbird', aud: 'me' }, NIGHT_T)).moment;
    assert.equal(me.at, NIGHT_T + 600);
    { const { cityLiveNow } = await import('../../api/admin.js'); assert.ok(!(await cityLiveNow(NIGHT_T + 3000)).radio.moments.some(m => m.id === me.id)); }
    assert.equal((await val(`radio/fired/${me.id}`)).sight, false); assert.equal((await val(`radio/fired/${a.id}`)).sight, true);
    // ONE ROOM: its node, ~2 s; a closed room refused
    await ref('rooms/RDIO').set({ meta: { hostId: 'u-radiopal', status: 'lobby', createdAt: NIGHT_T, activeAt: NIGHT_T }, players: { 'u-radiopal': { name: 'JESSICA', color: 'cyan', avatar: 'bolt', joinedAt: 1 } } });
    const rm = (await adminAction('u-radioboss', { action: 'radioFire', jack: 'balloons', aud: 'room', room: 'RDIO' }, NIGHT_T)).moment;
    assert.equal(rm.at, NIGHT_T + 2000); assert.equal((await val(`rooms/RDIO/radio/${rm.id}`)).jack, 'balloons');
    await rejects(adminAction('u-radioboss', { action: 'radioFire', jack: 'balloons', aud: 'room', room: 'NONE' }, NIGHT_T), 404, 'no_room');
    // BNAME: none of the room's players' typed names in the sky
    await rejects(adminAction('u-radioboss', { action: 'radioFire', jack: 'banner', aud: 'room', room: 'RDIO', text: 'HI JESSICA' }, NIGHT_T), 400, 'words_name');
    assert.deepEqual((await adminAction('u-radioboss', { action: 'radioRooms' }, NIGHT_T)).rooms.find(r => r.code === 'RDIO'), { code: 'RDIO', players: 1, online: 0, status: 'lobby', game: null });
    // STOP + CLEAR ALL
    await adminAction('u-radioboss', { action: 'radioStop', id: b.id }, NIGHT_T + 5000);
    assert.equal((await val(`radio/q/${b.id}`)).state, 'stopped');
    // THE DIAL + THE BILLBOARD
    assert.deepEqual(await adminAction('u-radioboss', { action: 'radioDial', level: 'normal' }), { showcase: 'normal' });
    await rejects(adminAction('u-radioboss', { action: 'radioDial', level: 'max' }), 400, 'bad_level');
    const msg = (await adminAction('u-radioboss', { action: 'radioBoard', lines: ['game night', '8 pm'], local: { h: 19, mi: 45 }, repeat: { dows: [5] } }, NIGHT_T)).message;
    assert.deepEqual(msg.lines, ['GAME NIGHT', '8 PM']); assert.deepEqual(msg.repeat, { dows: [5] });
    await rejects(adminAction('u-radioboss', { action: 'radioBoard', lines: ['THIS LINE IS FAR TOO LONG', 'X'] }, NIGHT_T), 400, 'words_long');
    { const { cityLiveNow } = await import('../../api/admin.js'); const r = await cityLiveNow(NIGHT_T + 3000); assert.equal(r.radio.showcase, 'normal'); assert.equal(r.radio.board[0].lines[0], 'GAME NIGHT'); }
    // THE CREW (CC-B grants it; the role is checked now): room only, its 11 jacks, in the room its phone is in, the limits
    await ref(`radio/crew/${pal.pid}`).set({ at: NIGHT_T, by: boss.pid });
    assert.deepEqual(await adminAction('u-radiopal', { action: 'radioWho' }), { role: 'crew' });
    { const st = await adminAction('u-radiopal', { action: 'radioState', room: 'RDIO' }, NIGHT_T); assert.equal(st.jacks.length, 11); assert.ok(!st.board && !st.rooms, 'no queue, no rooms list for the crew'); }
    await rejects(adminAction('u-radiopal', { action: 'radioFire', jack: 'party', aud: 'room', room: 'RDIO' }, NIGHT_T), 403, 'not_your_jack');
    await rejects(adminAction('u-radiopal', { action: 'radioFire', jack: 'billboard', aud: 'room', room: 'RDIO' }, NIGHT_T), 403, 'not_your_jack');
    await rejects(adminAction('u-radiopal', { action: 'radioFire', jack: 'ufo', aud: 'everyone' }, NIGHT_T), 403, 'not_your_audience');
    await rejects(adminAction('u-radiopal', { action: 'radioDial', level: 'low' }), 403, 'not_owner');
    await rejects(adminAction('u-radiopal', { action: 'radioBoard', lines: ['HI'] }), 403, 'not_owner');
    await rejects(adminAction('u-radiopal', { action: 'radioStop', id: a.id }, NIGHT_T), 403, 'not_yours');
    await ref('rooms/OTHR').set({ meta: { hostId: 'x', status: 'lobby', createdAt: NIGHT_T, activeAt: NIGHT_T }, players: { x: { name: 'X', color: 'cyan', avatar: 'bolt', joinedAt: 1 } } });
    await rejects(adminAction('u-radiopal', { action: 'radioFire', jack: 'ufo', aud: 'room', room: 'OTHR' }, NIGHT_T), 403, 'not_in_room');
    const c1 = (await adminAction('u-radiopal', { action: 'radioFire', jack: 'flyby', aud: 'room', room: 'RDIO' }, NIGHT_T + 10_000)).moment;
    assert.ok(c1.at >= NIGHT_T + 12_000);
    await rejects(adminAction('u-radiopal', { action: 'radioFire', jack: 'blackbird', aud: 'room', room: 'RDIO' }, NIGHT_T + 20_000), 429, 'cooldown');
    // the OWNER goes first: his room moment jumps ahead of the crew's waiting one
    const own = (await adminAction('u-radioboss', { action: 'radioFire', jack: 'ufo', aud: 'room', room: 'RDIO' }, NIGHT_T + 10_500)).moment;
    { const moved = await val(`radio/q/${c1.id}`); assert.ok(own.at <= moved.at, 'the owner first'); assert.ok(moved.at >= own.until, `the crew's flyby moved behind (${moved.at} vs ${own.until})`); }
    // each legendary ≤ 3 a night: at the limit the jack says so
    const night = (await import('../../js/core/harbor-radio.js')).nightKey(NIGHT_T, 'America/Detroit');
    await ref(`radio/limits/RDIO/${night}`).set({ counts: { legend: 3 }, lastEnd: 0 });
    try { await adminAction('u-radiopal', { action: 'radioFire', jack: 'ufo', aud: 'room', room: 'RDIO' }, NIGHT_T + 900_000); assert.fail('over the limit'); }
    catch (e) { assert.equal(e.status, 429); assert.equal(e.code, 'limit'); assert.match(e.message, /THAT'S ENOUGH UFOS FOR TONIGHT/); }
    // CLEAR ALL (the owner): his running + waiting moments stop, the billboard empties; the crew's stay
    await adminAction('u-radioboss', { action: 'radioClearAll' }, NIGHT_T + 6000);
    assert.equal((await val(`radio/q/${a.id}`)).state, 'stopped'); assert.equal(await val('radio/board'), null);
    assert.notEqual((await val(`radio/q/${c1.id}`)).state, 'stopped', 'the crew’s own moment is theirs');
    await rejects(adminAction('u-radiopal', { action: 'radioClearAll' }), 403, 'not_owner');
    // THE AUDIT: every action — who, what, the words
    const log = (await adminAction('u-radioboss', { action: 'audit', limit: 60 })).log.filter(l => /^radio/.test(l.act));
    for (const act of ['radioFire', 'radioStop', 'radioDial', 'radioBoard', 'radioClearAll']) assert.ok(log.some(l => l.act === act), act);
    assert.ok(log.some(l => l.act === 'radioFire' && /HAPPY BIRTHDAY/.test(l.b)), 'the words in the log');
    assert.ok(log.some(l => l.by === pal.pid && l.role === 'crew'), 'the crew in the log');
  } finally { process.env.ADMIN_PIDS = ''; await ref('/').update({ radio: null, 'rooms/RDIO': null, 'rooms/OTHR': null, 'city2/showcase': null }); }
});


test('admin stats: live rooms, games, players and busiest times from the real nodes', async () => {
  const boss = await ensure('u-statboss', 'StatBoss');
  await rejects(adminAction('u-statboss', { action: 'stats' }), 403, 'not_admin');
  const now = Date.now();
  await ref('rooms/STAT').set({ meta: { hostId: 'u-s1', status: 'playing', createdAt: now - 600_000 }, players: { 'u-s1': { name: 'A' }, 'u-s2': { name: 'B' } }, presence: { 'u-s1': { online: true }, 'u-s2': { online: true } }, game: { id: 'golf', phase: 'play' } });
  process.env.ADMIN_PIDS = boss.pid;
  try {
    const S = await adminAction('u-statboss', { action: 'stats', fresh: true }, now);
    assert.ok(S.live.rooms >= 1 && S.live.online >= 2);
    assert.ok(S.live.playing.golf >= 1);
    assert.ok(!JSON.stringify(S.live).includes('STAT'), 'no room codes');
    assert.ok(S.totals.matches > 0, 'the matches counted by the tests above');
    assert.ok(S.totals.players > 0);
    assert.equal(S.games.daily.length, 30);
    assert.equal(S.times.grid.length, 7);
    assert.ok(Object.values(S.games.all).reduce((a, b) => a + b, 0) > 0, 'gplay counts');
  } finally { process.env.ADMIN_PIDS = ''; await ref('rooms/STAT').remove(); }
});

// ---- live weather (api/sky.js): the visitor's area from Vercel's headers, rounded; Open-Meteo cached per area
test('sky: weather for the visitor\'s rounded area, cached 15 minutes, nothing without a location', async () => {
  clearSkyCache();
  await ref('wx').remove();
  let calls = 0;
  const fetcher = async url => { calls++; assert.match(url, /latitude=43&longitude=-85\.5/); return { ok: true, json: async () => ({ current: { weather_code: 95, cloud_cover: 100, wind_speed_10m: 9.1, wind_direction_10m: 260, temperature_2m: 18.4, visibility: 12000 } }) }; };
  const req = { url: '/api/sky', headers: { 'x-vercel-ip-latitude': '42.9634', 'x-vercel-ip-longitude': '-85.6681', 'x-vercel-ip-city': 'Grand%20Rapids' } };
  const place = placeOf(req);
  assert.deepEqual([place.lat, place.lon, place.city], [43, -85.5, 'Grand Rapids']);
  const now = Date.now();
  const a = await skyFor(place, { now, fetcher });
  assert.equal(a.kind, 'storm');
  assert.equal(a.storm, 1);
  assert.equal(a.city, 'Grand Rapids');
  await skyFor(place, { now: now + 60_000, fetcher });
  assert.equal(calls, 1, 'the same area within 15 minutes: no second request');
  const stored = await val(`wx/${place.key}`);
  assert.equal(stored.kind, 'storm');
  assert.equal(stored.city, undefined, 'the stored copy keeps no city, only the rounded area');
  clearSkyCache();
  await skyFor(place, { now: now + 120_000, fetcher });
  assert.equal(calls, 1, 'another instance reads the shared copy');
  await skyFor(place, { now: now + 16 * 60_000, fetcher });
  assert.equal(calls, 2, 'stale after 15 minutes');
  assert.equal(placeOf({ url: '/api/sky', headers: {} }), null);
  const call = () => new Promise(resolve => { const res = { statusCode: 200, setHeader() {}, end: b => resolve({ code: res.statusCode, body: b ? JSON.parse(b) : null }) }; skyHandler({ method: 'GET', url: '/api/sky', headers: {} }, res); });
  setKpFetcher(async () => ({ ok: false, status: 503 }));
  assert.equal((await call()).code, 204, 'no location + no Kp: no answer (the city keeps its own weather)');
  // CITY 2.0 (Part 6a): NOAA's planetary Kp rides along for everyone (the aurora's storm night) — even with no location
  const t0 = new Date(Math.floor(Date.now() / 10800e3) * 10800e3).toISOString().slice(0, 19);
  let kpCalls = 0;
  setKpFetcher(async () => { kpCalls++; return { ok: true, json: async () => [{ time_tag: t0, kp: 7.33, observed: 'estimated', noaa_scale: 'G3' }] }; });
  const k = await call();
  assert.equal(k.code, 200);
  assert.equal(k.body.kind, undefined, 'no weather without a location');
  assert.equal(k.body.kp[0][1], 7.33, 'the Kp blocks: [ms, kp]');
  await call();
  assert.equal(kpCalls, 1, 'Kp cached for everyone (an hour)');
  setKpFetcher(null);
});

test('sky: when the rain really stopped (RAINBOWS) — the past quarter hours, never the forecast', async () => {
  clearSkyCache();
  await ref('wx').remove();
  // (5 minutes into a quarter hour: within a minute of the next one, wetAtOf's grace counts it as past — a flake in CI, Oct 21 2026)
  const now = Math.floor(Date.now() / 900_000) * 900_000 + 300_000, q = Math.floor(now / 900_000) * 900;
  const times = [-7, -6, -5, -4, -3, -2, -1, 0, 1].map(i => q + i * 900);
  let url = '';
  const fetcher = async u => { url = u; return { ok: true, json: async () => ({ current: { weather_code: 1, cloud_cover: 30 }, minutely_15: { time: times, precipitation: [0, 0, 0.4, 1.2, 0.6, 0.2, 0, 0, 3] } }) }; };
  const place = placeOf({ url: '/api/sky?lat=42.96&lon=-85.67', headers: {} });
  const a = await skyFor(place, { now, fetcher });
  assert.match(url, /minutely_15=precipitation&past_minutely_15=8&forecast_minutely_15=0/);
  assert.equal(a.kind, 'clear');
  assert.equal(a.wetAt, times[5] * 1000, 'the end of the last wet quarter hour (the next one is a forecast: ignored)');
  clearSkyCache(); await ref('wx').remove();
  const dry = await skyFor(place, { now: now + 1, fetcher: async () => ({ ok: true, json: async () => ({ current: { weather_code: 0 }, minutely_15: { time: times, precipitation: times.map(() => 0) } }) }) });
  assert.equal(dry.wetAt, null, 'dry all along: no rain to follow');
});


// CITY CONTROLS B — THE INTERCOM · THE CREW (the grant, one radio per lobby, the ask + the hand-over) · PRESETS · "A ROOM JUST OPENED"
test('CITY CONTROLS B: the intercom, the crew, presets + the room push — every action by role, every one written + audited by the server', async () => {
  await ref('/').update({ radio: null, here: null });
  const boss = await ensure('u-ccbboss', 'CcbBoss'), pal = await ensure('u-ccbpal', 'CcbPal'), two = await ensure('u-ccbtwo', 'CcbTwo');
  await ensure('u-ccbkid', 'CcbKid');
  process.env.ADMIN_PIDS = boss.pid;
  try {
    const clip = Buffer.alloc(3000, 5).toString('base64'), T = Date.now();
    // ---- THE INTERCOM (the owner only)
    for (const a of ['radioIntercom', 'radioUnsend', 'radioCrewSet', 'radioCrewPeek', 'radioPreset', 'radioPresetFire', 'radioPush']) await rejects(adminAction('u-ccbkid', { action: a, aud: 'me', mime: 'audio/mp4', dur: 2, b64: clip, op: 'state' }, T), 403, 'not_radio');
    await ref('rooms/CCBA').set({ meta: { hostId: 'u-ccbpal', status: 'lobby', createdAt: T, activeAt: T }, players: { 'u-ccbpal': { name: 'JESSICA', color: 'cyan', avatar: 'bolt', joinedAt: 1 }, 'u-ccbtwo': { name: 'MIKE', color: 'pink', avatar: 'star', joinedAt: 2 } } });
    const ic = (await adminAction('u-ccbboss', { action: 'radioIntercom', aud: 'room', room: 'CCBA', mime: 'audio/mp4', dur: 4.2, b64: clip, head: 'game night at 8', wait: true }, T)).intercom;
    assert.equal(ic.head, 'GAME NIGHT AT 8'); assert.equal(ic.at, T + 2500); assert.ok(ic.until > ic.at + 4200);
    { const node = await val(`rooms/CCBA/radio/${ic.id}`); assert.equal(node.kind, 'intercom'); assert.ok(!JSON.stringify(node).includes(boss.pid), 'no profile id in the lobby'); }
    assert.equal((await val(`radio/clips/${ic.id}`)).b64, clip, 'the clip kept by the server');
    { const { clipOf } = await import('../../api/_lib/radio.js'); const c = await clipOf(ic.id, T + 1000); assert.equal(c.mime, 'audio/mp4'); assert.equal(c.buf.length, 3000); }
    await rejects(adminAction('u-ccbboss', { action: 'radioIntercom', aud: 'room', room: 'CCBA', mime: 'audio/mp4', dur: 2, b64: clip, head: 'hi jessica' }, T), 400, 'words_name');
    await rejects(adminAction('u-ccbboss', { action: 'radioIntercom', aud: 'everyone', mime: 'audio/mp4', dur: 99, b64: clip }, T), 400, 'bad_length');
    const ev = (await adminAction('u-ccbboss', { action: 'radioIntercom', aud: 'everyone', mime: 'audio/webm;codecs=opus', dur: 3, b64: clip, wait: false }, T)).intercom;
    assert.equal((await val(`rooms/CCBA/radio/${ev.id}`)).wait, false, 'EVERYONE: every open lobby gets its copy');
    { const { cityLiveNow } = await import('../../api/admin.js'); const r = await cityLiveNow(T + 1000); assert.ok(r.radio.intercom.some(m => m.id === ev.id) && !r.radio.intercom.some(m => m.id === ic.id), 'the city feed: EVERYONE only'); }
    await adminAction('u-ccbboss', { action: 'radioUnsend', id: ev.id }, T + 5000);
    { const { clipOf } = await import('../../api/_lib/radio.js'); assert.equal(await clipOf(ev.id, T + 6000), null, 'UNSEND: the clip gone'); assert.equal((await val(`rooms/CCBA/radio/${ev.id}`)).state, 'stopped'); }
    { const st = await adminAction('u-ccbboss', { action: 'radioState' }, T + 6000); assert.equal(st.intercom.find(m => m.id === ic.id).unsend, true); assert.equal(st.intercom.find(m => m.id === ev.id).state, 'stopped'); }
    // ---- THE CREW: the owner grants by the uid he tapped + by name tag; cap; the crew refused beyond the role
    assert.equal((await adminAction('u-ccbboss', { action: 'radioCrewPeek', uid: 'u-ccbpal' })).on, false);
    await adminAction('u-ccbboss', { action: 'radioCrewSet', uid: 'u-ccbpal', on: true }, T);
    const tp = await val(`profiles/${two.pid}`);
    const list = (await adminAction('u-ccbboss', { action: 'radioCrewSet', tag: `${tp.n}#${tp.t}`, on: true }, T)).crew;
    assert.deepEqual(list.map(c => c.pid).sort(), [pal.pid, two.pid].sort());
    await rejects(adminAction('u-ccbboss', { action: 'radioCrewSet', tag: 'NOBODY#0001', on: true }), 404, 'no_tag');
    await rejects(adminAction('u-ccbboss', { action: 'radioCrewSet', uid: 'u-ccbboss', on: true }), 400, 'is_owner');
    await rejects(adminAction('u-ccbpal', { action: 'radioCrewSet', uid: 'u-ccbtwo', on: false }), 403, 'not_owner');
    await rejects(adminAction('u-ccbpal', { action: 'radioIntercom', aud: 'room', room: 'CCBA', mime: 'audio/mp4', dur: 2, b64: clip }), 403, 'crew_ic_off');   // (FRIENDS A: the crew's own intercom waits behind the owner's switch — OFF by default)
    await rejects(adminAction('u-ccbpal', { action: 'radioPreset', op: 'delete', id: 'x' }), 403, 'not_owner');
    await rejects(adminAction('u-ccbpal', { action: 'radioPush', op: 'test' }), 403, 'not_owner');
    // ---- ONE RADIO PER LOBBY: the host (pal) holds it; two is refused + asks; pal hands it over
    assert.equal((await adminAction('u-ccbpal', { action: 'radioState', room: 'CCBA' }, T)).lobby.mine, true);
    assert.equal((await adminAction('u-ccbtwo', { action: 'radioState', room: 'CCBA' }, T)).lobby.holderName, 'JESSICA');
    await rejects(adminAction('u-ccbtwo', { action: 'radioFire', jack: 'flyby', aud: 'room', room: 'CCBA' }, T), 403, 'not_holder');
    await adminAction('u-ccbtwo', { action: 'radioAsk', room: 'CCBA' }, T);
    assert.equal((await val('rooms/CCBA/radioCrew/ask')).name, 'MIKE');
    await rejects(adminAction('u-ccbtwo', { action: 'radioHand', room: 'CCBA', give: true }, T), 403, 'not_holder');
    await adminAction('u-ccbpal', { action: 'radioHand', room: 'CCBA', give: true }, T);
    assert.equal((await adminAction('u-ccbtwo', { action: 'radioState', room: 'CCBA' }, T)).lobby.mine, true, 'handed over');
    const fm = (await adminAction('u-ccbtwo', { action: 'radioFire', jack: 'flyby', aud: 'room', room: 'CCBA' }, T)).moment;
    assert.equal((await val(`radio/fired/${fm.id}`)).sight, false, 'the crew’s never a sighting');
    // the host changes → the rule again (a new host who isn't crew: the first crew to join — pal)
    await ref('rooms/CCBA/meta/hostId').set('u-ccbtwo');
    assert.equal((await adminAction('u-ccbtwo', { action: 'radioState', room: 'CCBA' }, T)).lobby.mine, true, 'the host (crew) holds it');
    await ref('rooms/CCBA/meta/hostId').set('u-x'); await ref('rooms/CCBA/players/u-x').set({ name: 'X', color: 'cyan', avatar: 'bolt', joinedAt: 3 });
    assert.equal((await adminAction('u-ccbpal', { action: 'radioState', room: 'CCBA' }, T)).lobby.mine, true, 'a non-crew host: the first crew member to join');
    // ---- PRESETS: steps re-checked, fired through the live rules
    const P = (await adminAction('u-ccbboss', { action: 'radioPreset', op: 'add', name: 'game night', step: { kind: 'board', body: { lines: ['GAME NIGHT', '8 PM'], local: { h: 19, mi: 45 }, repeat: { dows: [5] } } } }, T)).presets[0];
    assert.equal(P.name, 'GAME NIGHT');
    await adminAction('u-ccbboss', { action: 'radioPreset', op: 'add', id: P.id, step: { kind: 'fire', body: { jack: 'blackbird', aud: 'me' } } }, T);
    await rejects(adminAction('u-ccbboss', { action: 'radioPreset', op: 'add', id: P.id, step: { kind: 'fire', body: { jack: 'nope', aud: 'me' } } }, T), 400, 'bad_step');
    const fired = (await adminAction('u-ccbboss', { action: 'radioPresetFire', id: P.id }, T)).results;
    assert.deepEqual(fired.map(r => [r.kind, r.ok]), [['board', true], ['fire', true]]);
    await adminAction('u-ccbboss', { action: 'radioPreset', op: 'delete', id: P.id }, T);
    assert.equal(await val('radio/presets'), null);
    // ---- "A ROOM JUST OPENED": off → nothing; a room not yours / not new → nothing; the encryption round-trips
    await ref('rooms/CCBN').set({ meta: { hostId: 'u-ccbkid', status: 'lobby', createdAt: Date.now(), activeAt: Date.now() }, players: { 'u-ccbkid': { name: 'K', color: 'cyan', avatar: 'bolt', joinedAt: 1 } } });
    assert.equal((await adminAction('u-ccbkid', { action: 'radioRoomOpened', room: 'CCBN' })).sent, 0, 'the switch is off');
    await ref('radio/push/on').set(true);
    assert.equal((await adminAction('u-ccbtwo', { action: 'radioRoomOpened', room: 'CCBN' })).sent, 0, 'not your room');
    // (FR6 FIXES A: the push only for a room STILL OPEN with its host online — a room opened + abandoned never pings, and isn't marked)
    { const r = await adminAction('u-ccbkid', { action: 'radioRoomOpened', room: 'CCBN' }); assert.equal(r.sent, 0); assert.equal(r.why, 'not_open', 'the host offline: no push'); }
    assert.equal(await val('radio/push/sent/CCBN'), null, 'an abandoned room is not marked (nothing was sent)');
    await ref('rooms/CCBN/players/u-ccbkid').remove(); await ref('rooms/CCBN/presence/u-ccbkid').set({ v: 2, online: true, lastSeen: Date.now(), c: { k1: true } });
    assert.equal((await adminAction('u-ccbkid', { action: 'radioRoomOpened', room: 'CCBN' })).why, 'not_open', 'the host no longer a player: no push');
    await ref('rooms/CCBN/players/u-ccbkid').set({ name: 'K', color: 'cyan', avatar: 'bolt', joinedAt: 1 });
    { const r = await adminAction('u-ccbkid', { action: 'radioRoomOpened', room: 'CCBN' }); assert.equal(r.sent, 0, 'no phones subscribed'); assert.notEqual(r.why, 'not_open'); }
    assert.ok(await val('radio/push/sent/CCBN'), 'once a room');
    // (FR6 FIXES A — C4: one push per sender an hour + PUSH_LIMITS.perHour in all; G7: a TEST tab's room is marked, never pushed)
    { const room = async (code, uid) => { await ref(`rooms/${code}`).set({ meta: { hostId: uid, status: 'lobby', createdAt: Date.now(), activeAt: Date.now() }, players: { [uid]: { name: 'K', color: 'cyan', avatar: 'bolt', joinedAt: 1 } }, presence: { [uid]: { v: 2, online: true, lastSeen: Date.now(), c: { k1: true } } } }); };
      await room('CCBO', 'u-ccbkid');
      assert.equal((await adminAction('u-ccbkid', { action: 'radioRoomOpened', room: 'CCBO' })).why, 'limit', 'a second room from the same sender within the hour: no push');
      await room('CCBS', 'u-ccbsil');
      const sil = await adminAction('u-ccbsil', { action: 'radioRoomOpened', room: 'CCBS', silent: true });
      assert.equal(sil.silent, true, 'a test room is silent'); assert.ok(await val('radio/push/sent/CCBS'), 'and marked');
      const { PUSH_LIMITS } = await import('../../api/_lib/radio.js');
      await ref(`rl/push_all_${Math.floor(Date.now() / 3600e3)}`).set({ n: PUSH_LIMITS.perHour, t: Date.now() });
      await room('CCBG', 'u-ccbglo');
      assert.equal((await adminAction('u-ccbglo', { action: 'radioRoomOpened', room: 'CCBG' })).why, 'limit', 'the hour’s pushes in all: no more');
      await ref('/').update({ 'rooms/CCBO': null, 'rooms/CCBS': null, 'rooms/CCBG': null, rl: null }); }
    await rejects(adminAction('u-ccbboss', { action: 'radioPush', op: 'sub', sub: { endpoint: 'https://evil.example.com/x', keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } } }), 400, 'bad_sub');
    { const { encrypt } = await import('../../api/_lib/push.js'), C = await import('node:crypto');
      const ua = C.createECDH('prime256v1'); ua.generateKeys(); const auth = C.randomBytes(16);
      const body = encrypt('{"title":"A ROOM JUST OPENED"}', { keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } });
      const hk = (salt, ikm, info, n) => { const prk = C.createHmac('sha256', salt).update(ikm).digest(); return C.createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest().subarray(0, n); };
      const salt = body.subarray(0, 16), as = body.subarray(21, 86), ct = body.subarray(86);
      const ikm = hk(auth, ua.computeSecret(as), Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), as]), 32);
      const d = C.createDecipheriv('aes-128-gcm', hk(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), hk(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12));
      d.setAuthTag(ct.subarray(-16)); const pt = Buffer.concat([d.update(ct.subarray(0, -16)), d.final()]);
      assert.equal(pt.subarray(0, -1).toString(), '{"title":"A ROOM JUST OPENED"}', 'RFC 8291 round trip'); assert.equal(pt[pt.length - 1], 2); }
    // ---- THE AUDIT
    const log = (await adminAction('u-ccbboss', { action: 'audit', limit: 80 })).log.map(l => l.act);
    for (const a of ['radioIntercom', 'radioUnsend', 'radioCrewAdd', 'radioAsk', 'radioHandOver', 'radioPreset', 'radioPresetFire']) assert.ok(log.includes(a), a);
  } finally { process.env.ADMIN_PIDS = ''; await ref('/').update({ radio: null, 'rooms/CCBA': null, 'rooms/CCBN': null }); }
});

// FR6 FIXES A — C8: the logs were pruned only when an admin opened /admin (rl/ never): now a log write prunes them, at most once an hour
test('the logs are pruned on write — the reports to the newest 40, errors quiet 30 days, stale rate-limit buckets (C8)', async () => {
  const { pruneLogsIfDue, prunePlan, REPORT_KEEP, ERR_KEEP_MS, RL_KEEP_MS } = await import('../../api/_lib/prune.js');
  const now = Date.now();
  const phonelog = Object.fromEntries(Array.from({ length: REPORT_KEEP + 5 }, (_, i) => [`r${String(i).padStart(3, '0')}`, { at: now - i * 1000, kind: 'tap', text: 'x' }]));
  await ref('/').update({ phonelog, 'errlog/eold': { m: 'old', last: now - ERR_KEEP_MS - 1 }, 'errlog/enew': { m: 'new', last: now }, 'rl/stale_x': { n: 3, t: now - RL_KEEP_MS - 1 }, 'rl/fresh_y': { n: 1, t: now }, 'rl/zz_prune': null });
  const plan = prunePlan({ phonelog, errlog: { a: { last: now } }, rl: { zz_prune: { t: 0 } } }, now);
  assert.equal(plan.phonelog.length, 5); assert.deepEqual(plan.rl, [], 'the prune marker itself is never pruned');
  const r = await pruneLogsIfDue(now);
  assert.deepEqual(r, { phonelog: 5, errlog: 1, rl: 1 });
  assert.equal(Object.keys((await val('phonelog')) || {}).length, REPORT_KEEP, 'the newest 40 reports kept');
  assert.ok(await val('errlog/enew')); assert.equal(await val('errlog/eold'), null);
  assert.ok(await val('rl/fresh_y')); assert.equal(await val('rl/stale_x'), null);
  assert.equal(await pruneLogsIfDue(now + 60_000), null, 'at most once an hour');
  await ref('/').update({ phonelog: null, errlog: null, rl: null });
});

// SHELL 2.0 B1 — THE SOLO LANE on the server: a room of ONE playing a SOLO cartridge (OVERCLOCK) is counted ONCE — the streak + a SMALL XP
// (ranks.js#SOLO_XP), never a win, never night points (a host that writes 3 for a solo match is refused); PRISM DROP alone never counts
test('THE SOLO LANE: a solo OVERCLOCK counts once, small XP, no win; 3 night points for it refused; a solo PRISM DROP never counts', async () => {
  const { SOLO_XP } = await import('../../js/core/ranks.js');
  await ensure('u-solo', 'SOLO');
  const room = await seedRoom('overclock', ['u-solo']);
  await ref(`rooms/${room.code}/night/${room.matchId}/p/u-solo`).set(0);   // (host.js: a solo match = 0 points)
  const r = await report('u-solo', room);
  assert.equal(r.status, 'counted');
  assert.equal(r.outcome.win, false, 'never a win');
  assert.equal(r.outcome.xp.gain, SOLO_XP, `a SOLO RUN's XP (${r.outcome.xp.gain})`);
  assert.equal((await stats('u-solo')).g.overclock.p, 1);
  assert.equal((await report('u-solo', room, clock + 5000)).status, 'done', 'credited once');
  tick();
  const hacked = await seedRoom('overclock', ['u-solo']);   // (seedRoom's night = the placing's 3 points)
  await rejects(report('u-solo', hacked, clock + 10 * 60e3), 409, 'mismatch');
  await ensure('u-solo2', 'SOLOTWO');
  const pr = await seedRoom('prism', ['u-solo2'], {}).catch(e => e);
  if (pr && pr.code) await rejects(report('u-solo2', pr), 409, 'unverifiable');
  else assert.match(String(pr && pr.message), /too few players/, 'PRISM DROP alone is not a reportable match');
  tick();
});

// SHELL 2.0 B2 — THE GIFT TOOL (api/_lib/gifts.js): the owner GIVES a 1-of-1 card to a name tag — server-granted (the item, equipped, a
// reveal waiting), audited; ONE PROFILE EVER (a second give refused, whoever asks); a non-owner refused; THE OWNER's OWN CARD never
// giftable — granted to the owner (ADMIN_PIDS) on 'me', refused to anyone else on 'style'
test('THE GIFT TOOL: owner-only, one profile ever, equipped + revealed once; the owner\'s own card his alone', async () => {
  const owner = await ensure('u-gift-owner', 'Giver'), kid = await ensure('u-gift-kid', 'Nephew'), other = await ensure('u-gift-other', 'Other');
  const tagOf = p => `${p.profile.n}#${p.profile.t}`;
  await rejects(adminAction('u-gift-other', { action: 'giftGive', card: 'card-gift-enforcer', tag: tagOf(kid) }), 403, 'not_admin');
  process.env.ADMIN_PIDS = `${owner.pid}`;
  try {
    const list0 = (await adminAction('u-gift-owner', { action: 'giftList' })).gifts;
    assert.equal(list0.length, 18, 'eighteen giftable cards (the owner\'s own never listed; + the seeing-stars card, Nov 6; + THE CARD PASS\'s seven, Nov 7)');
    assert.ok(!list0.some(g => g.id === 'card-gift-anarchist') && list0.every(g => !g.given && g.name && g.name !== g.id));
    await rejects(adminAction('u-gift-owner', { action: 'giftGive', card: 'card-gift-anarchist', tag: tagOf(kid) }), 403, 'not_giftable');
    await rejects(adminAction('u-gift-owner', { action: 'giftGive', card: 'card-gilded', tag: tagOf(kid) }), 400, 'bad_card');
    await rejects(adminAction('u-gift-owner', { action: 'giftGive', card: 'card-gift-enforcer', tag: 'NOBODY#0000' }), 404, 'no_tag');
    const r = await adminAction('u-gift-owner', { action: 'giftGive', card: 'card-gift-enforcer', tag: tagOf(kid) }, clock);
    assert.equal(r.gift.pid, kid.pid);
    assert.ok(await val(`pstats/${kid.pid}/it/card-gift-enforcer`), 'in their items');
    assert.equal(await val(`profiles/${kid.pid}/cd`), 'card-gift-enforcer', 'EQUIPPED');
    assert.equal((await val(`gifts/card-gift-enforcer`)).pid, kid.pid, 'the one-owner lock');
    assert.ok(r.gifts.find(g => g.id === 'card-gift-enforcer').given, 'the list says GIVEN');
    assert.ok(Object.values((await val('audit')) || {}).some(l => l.act === 'giftGive' && l.pid === kid.pid), 'audited');
    // ONE PROFILE EVER: the same card again (to another player, or to the same) — refused
    await rejects(adminAction('u-gift-owner', { action: 'giftGive', card: 'card-gift-enforcer', tag: tagOf(other) }), 409, 'taken');
    await rejects(adminAction('u-gift-owner', { action: 'giftGive', card: 'card-gift-enforcer', tag: tagOf(kid) }), 409, 'taken');
    assert.equal(await val(`pstats/${other.pid}/it/card-gift-enforcer`), null, 'the other player got nothing');
    // the reveal: waiting once, then seen
    assert.equal((await profileAction('u-gift-kid', { action: 'giftCheck' }, '', clock)).gift.id, 'card-gift-enforcer');
    await profileAction('u-gift-kid', { action: 'giftSeen' }, '', clock);
    assert.equal((await profileAction('u-gift-kid', { action: 'giftCheck' }, '', clock)).gift, null, 'shown once');
    // THE OWNER's OWN CARD: his on 'me' (audited), wearable by him; never anyone else's
    await profileAction('u-gift-owner', { action: 'me' }, '', clock);
    assert.ok(await val(`pstats/${owner.pid}/it/card-gift-anarchist`), 'the owner owns his card');
    assert.ok(Object.values((await val('audit')) || {}).some(l => l.act === 'giftOwner' && l.pid === owner.pid), 'its grant audited');
    await profileAction('u-gift-owner', { action: 'style', card: 'card-gift-anarchist' }, '', clock);
    assert.equal(await val(`profiles/${owner.pid}/cd`), 'card-gift-anarchist', 'he can wear it');
    await ref(`pstats/${other.pid}/it/card-gift-anarchist`).set(clock);   // (a forged grant …)
    await rejects(profileAction('u-gift-other', { action: 'style', card: 'card-gift-anarchist' }, '', clock), 403, 'locked');
    await profileAction('u-gift-other', { action: 'me' }, '', clock);
    assert.equal(await val(`pstats/${other.pid}/it/card-gift-anarchist`), null, '… taken back on their next open');
  } finally { process.env.ADMIN_PIDS = ''; await ref('audit').remove(); await ref('gifts').remove(); }
});

// THE CARD PASS — THE GIFT QUEUE: five gifts → five reveals IN ORDER; a seen one never replays; a refresh mid-line resumes at the next
// unseen, numbered in the same line; the line clears once all are seen; an old single-slot gift MIGRATES into the line (first); an old
// phone's giftSeen (no k) still clears the first.
test('THE GIFT QUEUE: five in order, seen never replays, a refresh resumes, the old slot migrates', async () => {
  const owner = await ensure('u-gq-owner', 'Giver'), kid = await ensure('u-gq-kid', 'Queue');
  const tagOf = p => `${p.profile.n}#${p.profile.t}`;
  process.env.ADMIN_PIDS = owner.pid;
  const five = ['card-gift-playerone', 'card-gift-halloffame', 'card-gift-enforcer', 'card-gift-linebacker', 'card-gift-underlights'];
  try {
    // (an old single-slot gift, written the way the server did before the queue)
    await ref(`ppriv/${kid.pid}/gift`).set({ id: 'card-gift-sunsetstrip', at: clock - 5000 });
    for (const [i, card] of five.entries()) await adminAction('u-gq-owner', { action: 'giftGive', card, tag: tagOf(kid) }, clock + i);
    assert.equal(await val(`profiles/${kid.pid}/cd`), five[4], 'the newest gift is the one equipped');
    let q = await profileAction('u-gq-kid', { action: 'giftCheck' }, '', clock);
    assert.deepEqual(q.gifts.map(g => g.id), ['card-gift-sunsetstrip', ...five], 'the old slot first, then the five in the order given');
    assert.equal(q.done, 0); assert.equal(q.gift.id, 'card-gift-sunsetstrip', '(an old phone still gets the first)');
    assert.equal(await val(`ppriv/${kid.pid}/gift`), null, 'the old slot is gone (migrated)');
    // see the first two, then "refresh"
    await profileAction('u-gq-kid', { action: 'giftSeen', k: q.gifts[0].k }, '', clock);
    await profileAction('u-gq-kid', { action: 'giftSeen', k: q.gifts[1].k }, '', clock);
    await profileAction('u-gq-kid', { action: 'giftSeen', k: q.gifts[1].k }, '', clock);   // (a double tap marks nothing new)
    q = await profileAction('u-gq-kid', { action: 'giftCheck' }, '', clock);
    assert.deepEqual(q.gifts.map(g => g.id), five.slice(1), 'resumes at the next unseen — seen ones never replay');
    assert.equal(q.done, 2, 'numbered in the same line (GIFT 3 OF 6)');
    // an old phone's giftSeen (no k) = the first unseen
    await profileAction('u-gq-kid', { action: 'giftSeen' }, '', clock);
    q = await profileAction('u-gq-kid', { action: 'giftCheck' }, '', clock);
    assert.deepEqual(q.gifts.map(g => g.id), five.slice(2)); assert.equal(q.done, 3);
    for (const g of q.gifts) await profileAction('u-gq-kid', { action: 'giftSeen', k: g.k }, '', clock);
    q = await profileAction('u-gq-kid', { action: 'giftCheck' }, '', clock);
    assert.deepEqual(q.gifts, []); assert.equal(q.done, 0); assert.equal(q.gift, null, 'all seen');
    assert.equal(await val(`ppriv/${kid.pid}/gq`), null, 'the finished line is cleared');
  } finally { process.env.ADMIN_PIDS = ''; await ref('audit').remove(); await ref('gifts').remove(); }
});

// FRIENDS B — FACE ID / PASSKEY SIGN-IN (api/_lib/passkeys.js): ADD on the card's ACCOUNT → a new device SIGNS IN WITH FACE ID → the same card,
// exactly like a restore key; a wrong origin, a replayed challenge, a removed passkey, a cloned one (the counter) and no Face ID all refuse
test('PASSKEYS: add → sign in on a new device → the same card; the bad cases refuse', async () => {
  const O = 'http://localhost:5173', UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
  const P = (uid, body) => profileAction(uid, { origin: O, ...body }, '', clock);
  const pkA = await ensure('u-pk-phone', 'PASSKAT');
  const auth = softAuthenticator({ origin: O, rpID: 'localhost' });
  // the RP: neonspeakeasy.com + localhost (off production) — nothing else
  assert.equal(rpOf('https://neonspeakeasy.com').rpID, 'neonspeakeasy.com');
  assert.equal(rpOf('http://localhost:5173/').rpID, 'localhost');
  assert.throws(() => rpOf('https://evil.example'), e => e.code === 'pk_origin');
  assert.equal(deviceLabel(UA), 'iPhone');
  await rejects(P('u-pk-phone', { action: 'pkRegOptions', origin: 'https://neon-speakeasy.evil' }), 400, 'pk_origin');
  // ADD FACE ID SIGN-IN: discoverable + Face ID required; the user handle is opaque (never the pid)
  const { options: ro } = await P('u-pk-phone', { action: 'pkRegOptions' });
  assert.equal(ro.rp.id, 'localhost');
  assert.equal(ro.authenticatorSelection.userVerification, 'required');
  assert.equal(ro.authenticatorSelection.residentKey, 'required');
  assert.ok(!String(ro.user.id).includes(pkA.pid) && ro.user.name.startsWith('PASSKAT#'), 'an opaque handle; the name tag as the account name');
  const reg = await profileAction('u-pk-phone', { action: 'pkRegister', origin: O, ua: UA, response: auth.create(ro) }, '', clock);
  assert.equal(reg.ok, true);
  assert.equal(reg.pk.length, 1); assert.equal(reg.pk[0].n, 'iPhone'); assert.equal(reg.pk[0].at, clock);
  assert.equal(await val('pkch/u-pk-phone/r'), null, 'the challenge is used once');
  // the same answer again (a replayed challenge) → refused
  await rejects(P('u-pk-phone', { action: 'pkRegister', response: auth.create(ro) }), 400, 'pk_stale');
  // the card's 'me' lists it (ACCOUNT's PASSKEYS) — label + dates only, never the key material
  const me = await P('u-pk-phone', { action: 'me' });
  assert.deepEqual(Object.keys(me.pk[0]).sort(), ['at', 'h', 'n', 'u']);
  // a NEW DEVICE (another uid, nothing saved) signs in → the same card
  tick();
  const { options: ao } = await P('u-pk-new', { action: 'pkAuthOptions' });
  assert.equal(ao.userVerification, 'required'); assert.deepEqual(ao.allowCredentials || [], []);
  const r = await P('u-pk-new', { action: 'pkAuth', response: auth.get(ao) });
  assert.equal(r.pid, pkA.pid); assert.equal(r.via, 'passkey');
  assert.equal(await val('uids/u-pk-new'), pkA.pid, 'this device joined the card');
  assert.ok(await val(`ppriv/${pkA.pid}/uids/u-pk-new`));
  assert.equal((await P('u-pk-phone', { action: 'me' })).pk[0].u, clock, 'last used');
  // a replayed sign-in (the same signed answer) → refused (the challenge went with the first)
  const { options: ao2 } = await P('u-pk-new2', { action: 'pkAuthOptions' });
  const ans2 = auth.get(ao2);
  assert.equal((await P('u-pk-new2', { action: 'pkAuth', response: ans2 })).pid, pkA.pid);
  await rejects(P('u-pk-new2', { action: 'pkAuth', response: ans2 }), 400, 'pk_stale');
  // a challenge made for ANOTHER device can't be answered from this one
  const { options: ao3 } = await P('u-pk-x1', { action: 'pkAuthOptions' });
  await rejects(P('u-pk-x2', { action: 'pkAuth', response: auth.get(ao3) }), 400, 'pk_stale');
  // a wrong origin inside the signed answer (a phishing page) → refused
  const { options: ao4 } = await P('u-pk-x3', { action: 'pkAuthOptions' });
  await rejects(P('u-pk-x3', { action: 'pkAuth', response: auth.get(ao4, { origin: 'https://neonspeakeasy.evil' }) }), 400, 'pk_bad');
  // an expired challenge (5 min) → refused
  const { options: ao5 } = await P('u-pk-x4', { action: 'pkAuthOptions' });
  tick(6 * 60_000);
  await rejects(P('u-pk-x4', { action: 'pkAuth', response: auth.get(ao5) }), 400, 'pk_stale');
  // the signature counter went backwards (a cloned authenticator) → refused
  const { options: ao6 } = await P('u-pk-x5', { action: 'pkAuthOptions' });
  await rejects(P('u-pk-x5', { action: 'pkAuth', response: auth.get(ao6, { counter: 1 }) }), 400, 'pk_bad');
  // no Face ID (user verification missing) → refused
  const noUv = softAuthenticator({ origin: O, rpID: 'localhost', uv: false });
  const { options: ro2 } = await P('u-pk-phone', { action: 'pkRegOptions' });
  assert.ok(ro2.excludeCredentials.some(c => c.id === auth.id), 'the phone is told which passkey it already holds');
  await rejects(P('u-pk-phone', { action: 'pkRegister', response: noUv.create(ro2) }), 400, 'pk_bad');
  // a passkey nobody registered → refused
  const stray = softAuthenticator({ origin: O, rpID: 'localhost' });
  const { options: ao7 } = await P('u-pk-x6', { action: 'pkAuthOptions' });
  await rejects(P('u-pk-x6', { action: 'pkAuth', response: stray.get(ao7) }), 404, 'pk_unknown');
  // REMOVE on ACCOUNT → that passkey no longer signs in (the Signal API's list comes back for the phone)
  const rm = await P('u-pk-phone', { action: 'pkRemove', h: reg.h });
  assert.deepEqual(rm.pk, []); assert.equal(rm.signal.rpId, 'localhost'); assert.deepEqual(rm.signal.ids, []);
  assert.equal(await val(`pkx/${reg.h}`), null);
  const { options: ao8 } = await P('u-pk-x7', { action: 'pkAuthOptions' });
  await rejects(P('u-pk-x7', { action: 'pkAuth', response: auth.get(ao8) }), 404, 'pk_unknown');
  // the sign-ins share the restore key's limit (10 an hour a device)
  for (let i = 0; i < 10; i++) { const { options } = await P('u-pk-lim', { action: 'pkAuthOptions' }); await P('u-pk-lim', { action: 'pkAuth', response: stray.get(options) }).catch(() => {}); }
  const { options: ao9 } = await P('u-pk-lim', { action: 'pkAuthOptions' });
  await rejects(P('u-pk-lim', { action: 'pkAuth', response: stray.get(ao9) }), 429, 'restore_limit');
  tick();
});
