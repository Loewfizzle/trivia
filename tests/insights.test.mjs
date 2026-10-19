// The admin page's STATS (js/core/insights.js), from rooms, counted matches and profiles.
import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, liveRooms, lastDays, lastWeeks } from '../js/core/insights.js';
import { weekKey, easternParts } from '../js/core/week.js';

const NOW = Date.UTC(2026, 9, 21, 2, 30);          // Tue Oct 20 2026, 10:30 pm Eastern
const H = 3600_000, DAY = 24 * H;

test('Eastern parts: weekday (Monday = 0) and hour', () => {
  const p = easternParts(NOW);
  assert.deepEqual([p.y, p.m, p.d, p.h, p.dow], [2026, 10, 20, 22, 1]);
  assert.equal(easternParts(Date.UTC(2026, 9, 26, 3)).dow, 6, 'Sunday 11 pm Eastern');
});

test('day and week ranges, DST included', () => {
  const d = lastDays(NOW, 30);
  assert.equal(d.length, 30);
  assert.equal(d[29], 'd20261020');
  assert.equal(d[0], 'd20260921');
  const across = lastDays(Date.UTC(2026, 10, 2, 4, 30), 3);       // Nov 1 2026 (clocks go back) 11:30 pm Eastern
  assert.deepEqual(across, ['d20261030', 'd20261031', 'd20261101']);
  const w = lastWeeks(NOW, 8);
  assert.equal(w.length, 8);
  assert.equal(w[7], 'w20261019');
  assert.equal(w[0], 'w20260831');
});

test('live rooms: only rooms with someone connected; games in progress by game; no codes', () => {
  const rooms = {
    ABCD: { meta: { status: 'playing', createdAt: NOW - 40 * 60_000 }, players: { a: {}, b: {}, c: {} }, presence: { a: { online: true }, b: { online: true }, c: { online: false } }, game: { id: 'golf', phase: 'play' } },
    EFGH: { meta: { status: 'lobby', createdAt: NOW - 5 * 60_000 }, players: { d: {} }, presence: { d: { online: true } } },
    IJKL: { meta: { status: 'lobby', createdAt: NOW - 2 * H }, players: { e: {} }, presence: { e: { online: false } } },
    MNOP: { meta: { status: 'playing', createdAt: NOW - 60_000 }, players: { f: {}, g: {} }, presence: { f: { online: true }, g: { online: true } }, game: { id: 'golf', phase: 'intro' } },
  };
  const L = liveRooms(rooms, NOW);
  assert.equal(L.rooms, 3);
  assert.equal(L.online, 5);
  assert.deepEqual(L.playing, { golf: 2 });
  assert.deepEqual(L.list.map(x => [x.online, x.game]), [[2, 'golf'], [2, 'golf'], [1, null]]);
  assert.ok(!JSON.stringify(L).includes('ABCD'), 'no room codes');
});

test('games, players and busiest times from counted matches', () => {
  const m = (at, g, pids, extra = {}) => ({ st: 'done', at, g, n: pids.length, o: Object.fromEntries(pids.map(p => [p, { rank: 1 }])), ...extra });
  const results = {
    r1: m(NOW - 1 * H, 'golf', ['pA', 'pB', 'pC']),                 // this week, Tue 9:30 pm
    r2: m(NOW - 2 * H, 'cipher', ['pA', 'pB']),                     // this week
    r3: m(NOW - 3 * DAY, 'golf', ['pA', 'pD']),                     // last week (Sat Oct 17)
    r4: m(NOW - 40 * DAY, 'pulse', ['pE']),                         // outside the 30 days
    r5: { st: 'busy', at: NOW, g: 'golf' },                         // still being counted: ignored
  };
  const profiles = {
    pA: { n: 'Ann', t: 1111, x: 900, r: 2, at: NOW - 20 * DAY },
    pB: { n: 'Bo', t: 2222, x: 300, r: 1, at: NOW - 1 * DAY },
    pC: { n: 'Cy', t: 3333, x: 50, at: NOW - 2 * H, h: true },
    pD: { n: 'Di', t: 4444, x: 120, at: NOW - 3 * DAY },
    pE: { n: 'Ed', t: 5555, x: 10, at: NOW - 41 * DAY },
  };
  const S = summarize({ results, profiles, gplay: { week: { golf: 1, cipher: 1 }, all: { golf: 2, cipher: 1, pulse: 1 } }, now: NOW });
  assert.equal(S.totals.matches, 4);
  assert.equal(S.totals.players, 5);
  assert.equal(S.totals.played, 5);
  assert.equal(S.totals.multiNight, 1, 'only Ann played on two different nights');
  assert.deepEqual(S.games.last30, { golf: 2, cipher: 1 });
  assert.deepEqual(S.games.avgPlayers, { golf: 2.5, cipher: 2, pulse: 1 });
  assert.equal(S.games.daily.length, 30);
  assert.equal(S.games.daily[29].n, 2);
  assert.equal(S.games.daily[26].n, 1);
  assert.deepEqual(S.games.week, { golf: 1, cipher: 1 });
  // players
  assert.deepEqual(S.players.topWeek.map(p => [p.n, p.n_matches]), [['Ann', 2], ['Bo', 2], ['Cy', 1]]);
  assert.equal(S.players.topWeek[2].h, true, 'hidden players are marked, not dropped (the admin sees everyone)');
  assert.deepEqual(S.players.topXp.map(p => p.n).slice(0, 2), ['Ann', 'Bo']);
  assert.equal(S.players.topAll[0].n, 'Ann');
  assert.equal(S.players.activeWeek, 3);
  // today (the Eastern day): r1 + r2 only
  assert.deepEqual(S.today, { matches: 2, players: 3 });
  assert.deepEqual(S.games.today, { golf: 1, cipher: 1 });
  assert.deepEqual(S.players.topToday.map(p => [p.n, p.n_matches]), [['Ann', 2], ['Bo', 2], ['Cy', 1]]);
  assert.equal(S.players.activeToday, 3);
  // just after midnight Eastern: a new day, nothing yet
  const T = summarize({ results, profiles, now: NOW + 3 * H });
  assert.deepEqual(T.today, { matches: 0, players: 0 });
  assert.deepEqual(T.players.topToday, []);
  assert.equal(S.players.returningWeek, 1, 'Ann played last week too');
  assert.equal(S.players.newByWeek.length, 8);
  assert.equal(S.players.newByWeek[7].wk, weekKey(NOW));
  assert.equal(S.players.newByWeek[7].n, 2, 'Bo and Cy joined this week');
  assert.equal(S.players.newByWeek[6].n, 1, 'Di last week');
  // busiest times (last 90 days): Tuesday 9 pm and 8 pm, Saturday 10 pm
  assert.equal(S.times.grid[1][21], 1);
  assert.equal(S.times.grid[1][20], 1);
  assert.equal(S.times.grid[5][22], 1);
  assert.equal(S.times.grid.flat().reduce((a, b) => a + b, 0), 4);
  assert.equal(S.times.max, 1);
});

test('empty data is a valid (empty) panel', () => {
  const S = summarize({ now: NOW });
  assert.equal(S.live.online, 0);
  assert.equal(S.totals.matches, 0);
  assert.equal(S.players.topWeek.length, 0);
  assert.equal(S.times.max, 0);
  assert.equal(S.games.daily.every(d => d.n === 0), true);
});
