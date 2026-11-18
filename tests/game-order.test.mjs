// CITY H2 — THE GAMES LIST BY POPULARITY (js/core/game-order.js): DIFFERENT players in the last 14 days, ties by matches; a game's first 14
// days after its go-live ON TOP (newest first) with NEW; the served order is the ORDER only; the config's order the fallback.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { popularity, popularOrder, isNew, shelfOrder, dayKeyOf } from '../js/core/game-order.js';

const DAY = 864e5, NOW = Date.UTC(2026, 11, 20, 18);   // (Dec 20 — every game past its first 14 days)
const R = (g, daysAgo, pids, st = 'done') => ({ st, g, at: NOW - daysAgo * DAY, o: Object.fromEntries(pids.map(p => [p, 1])) });

test('popularity: DIFFERENT players over the last 14 days — a player counted once a game; older / unfinished matches out', () => {
  const res = { a: R('prism', 1, ['p1', 'p2']), b: R('prism', 2, ['p1', 'p2']), c: R('prism', 3, ['p1']), d: R('jaywalk', 1, ['p3']), e: R('jaywalk', 2, ['p4']), f: R('jaywalk', 3, ['p5']),
    old: R('holdem', 20, ['p6', 'p7', 'p8', 'p9']), retry: R('holdem', 1, ['p6', 'p7', 'p8', 'p9'], 'retry') };
  const P = popularity(res, NOW);
  assert.deepEqual(P.prism, { p: 2, m: 3 });
  assert.deepEqual(P.jaywalk, { p: 3, m: 3 });
  assert.equal(P.holdem, undefined, 'a match older than 14 days / not done counts for nothing');
  assert.deepEqual(popularOrder(['prism', 'overclock', 'holdem', 'jaywalk'], P), ['jaywalk', 'prism', 'overclock', 'holdem'], 'players first; none = the config order');
});

test('popularOrder: a tie in players → the matches; a full tie → the fallback order', () => {
  const P = { a: { p: 4, m: 9 }, b: { p: 4, m: 12 }, c: { p: 1, m: 50 } };
  assert.deepEqual(popularOrder(['a', 'b', 'c', 'd'], P), ['b', 'a', 'c', 'd']);
  assert.deepEqual(popularOrder(['x', 'y'], {}, ['y', 'x']), ['y', 'x']);
});

test('NEW: a game\'s first 14 days (its go-live day counted) — then it joins the order', () => {
  assert.equal(isNew('2026-11-17', '2026-11-17'), true);
  assert.equal(isNew('2026-11-17', '2026-11-30'), true, 'day 14');
  assert.equal(isNew('2026-11-17', '2026-12-01'), false, 'day 15');
  assert.equal(isNew('2026-11-17', '2026-11-16'), false, 'not before it');
  assert.equal(isNew(undefined, '2026-11-20'), false);
  assert.equal(dayKeyOf('d20261118'), '2026-11-18');
});

test('shelfOrder: NEW on top (newest first), then the served order, then the rest; a bad served order = the config order', () => {
  const G = [{ id: 'prism' }, { id: 'overclock' }, { id: 'holdem', live: '2026-11-08' }, { id: 'jaywalk', live: '2026-11-17' }];
  const nov18 = Date.UTC(2026, 10, 18, 20);
  const a = shelfOrder(G, ['overclock', 'prism', 'jaywalk', 'holdem'], nov18);
  assert.deepEqual(a.map(g => g.id), ['jaywalk', 'holdem', 'overclock', 'prism'], 'JAYWALK (Nov 17) + HOLD\'EM (Nov 8) new — newest first');
  assert.deepEqual(a.map(g => g.isNew), [true, true, false, false]);
  const later = shelfOrder(G, ['overclock', 'prism', 'jaywalk', 'holdem'], NOW);
  assert.deepEqual(later.map(g => g.id), ['overclock', 'prism', 'jaywalk', 'holdem'], 'past their 14 days: the served order alone');
  assert.deepEqual(shelfOrder(G, null, NOW).map(g => g.id), ['prism', 'overclock', 'holdem', 'jaywalk'], 'nothing served: the config order');
  assert.deepEqual(shelfOrder(G, ['jaywalk'], NOW).map(g => g.id), ['jaywalk', 'prism', 'overclock', 'holdem'], 'a game the order lacks: after it, the config order');
});

test('the wiring: the server once a streak day → progress/gameOrder, served in the cached ?live=1 (the order only); the phones lazy', () => {
  const act = readFileSync('api/_lib/activity.js', 'utf8'), adm = readFileSync('api/admin.js', 'utf8');
  assert.match(act, /if \(cur && cur\.day === day && Array\.isArray\(cur\.order\)\)/, 'once a streak day');
  assert.match(act, /ref\('progress\/gameOrder'\)\.set\(\{ day, order, at: now \}\)/);
  assert.match(adm, /return \{ live: [^\n]*, radio, order, at: now \};/, 'in the cached city feed — no new poll');
  assert.match(readFileSync('js/screens/harbor/remote.js', 'utf8'), /localStorage\.setItem\('nd:gorder', JSON\.stringify\(j\.order\)\)/);
  for (const f of ['js/screens/title-taps.js', 'js/screens/room-city.js']) assert.match(readFileSync(f, 'utf8'), /lazyImport\(import\('\.\.\/core\/game-order\.js'\), '\.\.\/core\/game-order\.js'\)/, `${f}: lazy`);
});
