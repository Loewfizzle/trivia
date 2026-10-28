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
import { clearBoardCache } from '../../api/_lib/lb.js';
import { finalGame } from '../fixtures/finals.mjs';
import { weekKey } from '../../js/core/week.js';
import { RANKS } from '../../js/core/ranks.js';

const NOW = Date.UTC(2026, 9, 14, 23, 0, 0);       // Wed 2026-10-14, 7 pm Eastern
const DAY = 86_400_000;
let clock = NOW;
const tick = (ms = 60_000) => (clock += ms);
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'errlog', 'wx', 'phonelog'];

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
  const ranks = (await import('../../js/core/match-report.js')).extractMatch(game, {});
  const night = { g: id, at: clock, p: {}, n: {} };
  for (const [u, r] of Object.entries(ranks.rows)) { night.p[u] = NIGHT[r.rank] || 0; night.n[u] = names[u] || u.toUpperCase(); }
  await ref(`rooms/${code}`).set({
    meta: { hostId: uids[0], status: 'playing', createdAt: clock, activeAt: clock },
    players: Object.fromEntries(uids.map((u, i) => [u, { name: names[u] || u.toUpperCase(), color: 'cyan', avatar: 'bolt', joinedAt: i }])),
    game,
    night: { [game.matchId]: night },
  });
  return { code, matchId: game.matchId, game };
}
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

test('existing players (no server profile yet) get one from their room name when a match is counted', async () => {
  const room = await seedRoom('cipher', ['u-old1', 'u-old2'], {}, { 'u-old1': 'VETERAN', 'u-old2': 'ROOKIE' });
  const r = await report('u-old1', room);
  assert.equal(r.status, 'counted');
  const pid2 = await val('uids/u-old2');
  assert.ok(pid2, 'the other player got a profile too');
  assert.equal((await val(`profiles/${pid2}`)).n, 'ROOKIE');
  assert.equal((await stats('u-old2')).g.cipher.p, 1);
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
  assert.equal(await val(`profiles/${blank.pid}`), null, 'the blank profile is gone');
  const me = await profileAction('u-alice-phone2', { action: 'me' }, '', clock);
  assert.equal(me.stats.g.slip.p, 1, 'stats came along');
  // regenerate: the old key stops working, the new one works
  const { key } = await profileAction('u-alice', { action: 'regen' }, '', clock);
  assert.notEqual(key, a.key);
  await rejects(profileAction('u-other', { action: 'restore', key: a.key }, '', clock), 404, 'no_key');
  assert.equal((await profileAction('u-other', { action: 'restore', key }, '', clock)).pid, a.pid);
});

test('restores are rate-limited per device', async () => {
  for (let i = 0; i < 10; i++) await rejects(profileAction('u-guesser', { action: 'restore', key: `NEON-AAAA-BBBB-CC${'ABCDEFGHJK'[i]}${'ABCDEFGHJK'[i]}` }, '', clock), 404, 'no_key');
  await rejects(profileAction('u-guesser', { action: 'restore', key: 'NEON-AAAA-BBBB-CCZZ' }, '', clock), 429, 'restore_limit');
});

test('renames: once a day, the tag follows when free, every board shows the new name', async () => {
  const m = await ensure('u-ren', 'Ren');
  const room = await seedRoom('golf', ['u-ren', 'u-ren2'], {}, { 'u-ren': 'Ren', 'u-ren2': 'Stimpy' });
  await report('u-ren', room);
  clearBoardCache();
  let wk = await boardQuery({ b: 'golf-par9', p: 'week' }, clock);
  assert.equal(wk.rows.find(r => r.pid === m.pid).n, 'Ren');
  const r1 = await profileAction('u-ren', { action: 'rename', name: 'Renaldo' }, '', clock);
  assert.equal(r1.profile.n, 'Renaldo');
  assert.equal(r1.profile.t, m.profile.t, 'Ren#tag → Renaldo#tag');
  clearBoardCache();
  wk = await boardQuery({ b: 'golf-par9', p: 'week' }, clock);
  const al = await boardQuery({ b: 'golf-par9', p: 'all' }, clock);
  assert.equal(wk.rows.find(r => r.pid === m.pid).n, 'Renaldo', 'this week');
  assert.equal(al.rows.find(r => r.pid === m.pid).n, 'Renaldo', 'all time (a past record)');
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

test('offensive names read "Player" on the boards, and may be changed at once', async () => {
  const p = await ensure('u-rude', 'Rudy');
  await profileAction('u-rude', { action: 'rename', name: 'sh1tlord' }, '', clock);
  const room = await seedRoom('slip', ['u-rude', 'u-nice'], {}, { 'u-rude': 'sh1tlord', 'u-nice': 'Nice' });
  await report('u-nice', room);
  clearBoardCache();
  const b = await boardQuery({ b: 'slip-dist', p: 'all' }, clock);
  const row = b.rows.find(r => r.pid === p.pid);
  assert.equal(row.n, 'Player');
  assert.equal(row.t, p.profile.t, 'Player#tag');
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
  assert.ok(!(await boardQuery({ b: 'slip-dist', p: 'all' }, clock)).rows.some(r => r.pid === a.pid), 'not on the board');
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
  assert.equal((await boardQuery({ b: 'slip-dist', p: 'all' }, clock)).rows[0].pid, a.pid, 'back on top');
  tick();
});

test('forged and impossible reports are refused; the match itself still counts', async () => {
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
  await rejects(report('u-f2', moved, clock, forged), 409);
  // …the honest snapshot is accepted
  const ok = await report('u-f1', moved, clock, moved.game);
  assert.equal(ok.status, 'counted');
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
  assert.equal(all.rows.find(x => x.pid === w.pid).v, 7000, 'all time keeps the best');
  assert.equal(week.rows.find(x => x.pid === w.pid).v, 3000, 'this week only this week');
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
    patch[`profiles/${pid}`] = { n: `Rider${i}`, nk: `rider${i}`, t: String(1000 + i), a: 'bolt', c: 'cyan', x: 0, r: 0, at: clock };
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
  assert.ok(!top.rows.some(r => r.pid === me.pid), 'not in the top 100');
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
  const room = await seedRoom('cipher', [u.localId, 'u-http2']);
  const ok = await call(reportHandler, { token: u.idToken, body: { code: room.code, matchId: room.matchId } });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.status, 'counted');
  const b = await call(boardHandler, { method: 'GET', url: '/api/board?b=cipher-wins&p=all' });
  assert.equal(b.status, 200);
  assert.match(b.headers['cache-control'], /s-maxage/);
  assert.ok(b.body.rows.length > 0);
  assert.equal((await call(boardHandler, { method: 'GET', url: '/api/board?b=nope&p=all' })).status, 400);
  assert.equal((await call(boardHandler, { method: 'POST', url: '/api/board?b=cipher-wins' })).status, 405);
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
    assert.deepEqual(r.body.live, { state: { force: ['banner'], text: 'HI ALL' }, startAt: now, until: now + 60_000, by: 'ptest00000000' });
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
