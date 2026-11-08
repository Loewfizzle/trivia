// DM2 — THE DAILY SCREENS' RULES (js/daily/today-logic.js, PURE): the dock button's states + count from the list (a fake 3rd daily → 3), the
// TODAY rows, the sweep meter, YOUR TABLE's places (ties, friends' scores hidden until you play, waiting friends, a same-day result unranked),
// the everyone line (only with a standing — the server sends one from 50 counting finishers), the host's MID-DAILY line, SHARE TODAY's line.
import test from 'node:test';
import assert from 'node:assert/strict';
import { dockState, rowState, sweepState, tableFor, ordinal, everyoneLine, midLine, shareTodayLine, COUNTS_FROM_TOMORROW, ROOM_BANNER, RESUME_CHIP } from '../js/daily/today-logic.js';

const D = (...ids) => ids.map((id, i) => ({ id, name: id.toUpperCase(), order: i + 1, better: 'low' }));

test('the dock button: hidden with no live daily (the switch off · /api down), WAITING + the count from the LIST, ALL DONE', () => {
  assert.deepEqual(dockState(null), { show: false, state: 'hidden', left: 0 });
  assert.deepEqual(dockState({ dailies: [] }), { show: false, state: 'hidden', left: 0 });
  assert.deepEqual(dockState({ dailies: D('password', 'coastclear'), mine: {} }), { show: true, state: 'waiting', left: 2 });
  assert.deepEqual(dockState({ dailies: D('password', 'coastclear'), mine: { password: 7 } }), { show: true, state: 'waiting', left: 1 });
  assert.deepEqual(dockState({ dailies: D('password', 'coastclear'), mine: { password: 7, coastclear: 140 } }), { show: true, state: 'done', left: 0 });
  // a FAKE 3rd daily: the count follows the registry, nothing else changes
  assert.equal(dockState({ dailies: D('password', 'coastclear', 'fake3'), mine: {} }).left, 3);
  assert.equal(dockState({ dailies: D('password', 'coastclear', 'fake3'), mine: { password: 0 } }).left, 2, 'a score of 0 is a score');
});

test('TODAY rows + THE SWEEP meter (one segment per daily, 1–6)', () => {
  const t = { dailies: D('a', 'b', 'c'), mine: { a: 3 }, started: { b: true } };
  assert.deepEqual(['a', 'b', 'c'].map(id => rowState(t, id)), ['done', 'progress', 'waiting']);
  assert.deepEqual(sweepState(t), { segs: [{ id: 'a', done: true }, { id: 'b', done: false }, { id: 'c', done: false }], done: 1, of: 3, swept: false });
  assert.equal(sweepState({ dailies: D('a'), mine: { a: 1 } }).swept, true);
  assert.equal(sweepState({ dailies: D('a', 'b', 'c', 'd', 'e', 'f', 'g') }).of, 6, 'at most 6 rows');
});

test('YOUR TABLE: places share ties, friends hidden until you play, waiting friends last, never a stranger, a same-day result unranked', () => {
  const me = { pid: 'P0', name: 'AVA' }, names = { P1: 'BEN', P2: 'KIM', P3: 'LOU', P4: 'MAX' };
  // before you play: the server sends { done } for a friend who has — never their score
  let t = { dailies: D('pw'), mine: {}, table: ['P1', 'P2', 'P3'], friends: { P1: { pw: { done: true } }, P2: {}, P3: {} } };
  let r = tableFor(t, 'pw', { names, me, better: 'low' });
  assert.equal(r.line, ''); assert.equal(r.place, null);
  assert.deepEqual(r.rows.map(x => [x.name, x.score, x.played, x.waiting]), [['BEN', null, true, false], ['AVA', null, false, true], ['KIM', null, false, true], ['LOU', null, false, true]]);
  // after: places (lower is better), a tie shares the place
  t = { dailies: D('pw'), mine: { pw: 6 }, table: ['P1', 'P2', 'P3', 'P4'], friends: { P1: { pw: { score: 4 } }, P2: { pw: { score: 8 } }, P3: {}, P4: { pw: { score: 6 } } } };
  r = tableFor(t, 'pw', { names, me, better: 'low' });
  assert.equal(r.line, '2ND OF 4 AT YOUR TABLE'); assert.equal(r.of, 4);
  assert.deepEqual(r.rows.map(x => [x.name, x.place || null]), [['BEN', 1], ['AVA', 2], ['MAX', 2], ['KIM', 4], ['LOU', null]]);
  // a 'high' daily flips the order
  assert.equal(tableFor({ ...t, friends: { P1: { pw: { score: 4 } } }, table: ['P1'] }, 'pw', { names, me, better: 'high' }).line, '1ST OF 2 AT YOUR TABLE');
  // a pid not in the server's table is never drawn (the server reads YOUR friends list — this is what it sent)
  assert.ok(!tableFor({ ...t, table: ['P1'], friends: { ...t.friends, P9: { pw: { score: 1 } } } }, 'pw', { names, me }).rows.some(x => x.pid === 'P9'));
  // alone at the table: no place line
  assert.equal(tableFor({ dailies: D('pw'), mine: { pw: 5 }, table: [], friends: {} }, 'pw', { me }).line, '');
  // a same-day profile: its own score shows, never ranked
  r = tableFor({ dailies: D('pw'), mine: { pw: 2 }, gated: { pw: true }, table: ['P1'], friends: { P1: { pw: { score: 4 } } } }, 'pw', { names, me, better: 'low' });
  assert.equal(r.place, null); assert.equal(r.line, ''); assert.equal(r.rows.find(x => x.me).score, 2);
});

test('the everyone line, the ordinals, the host\'s line, the words', () => {
  assert.equal(everyoneLine(null), ''); assert.equal(everyoneLine({ n: 0, top: 1 }), '');
  assert.equal(everyoneLine({ n: 212, top: 11.4 }), 'TOP 12% OF EVERYONE');
  assert.equal(everyoneLine({ n: 80, top: 0.4 }), 'TOP 1% OF EVERYONE');
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal), ['1ST', '2ND', '3RD', '4TH', '11TH', '12TH', '13TH', '21ST', '22ND', '101ST']);
  assert.equal(midLine(0), ''); assert.equal(midLine(1), '1 PLAYER IS MID-DAILY'); assert.equal(midLine(2), '2 PLAYERS ARE MID-DAILY');
  assert.equal(COUNTS_FROM_TOMORROW, 'YOUR SCORE COUNTS FROM TOMORROW');
  assert.equal(ROOM_BANNER, 'GAME STARTING · YOUR DAILY IS SAVED'); assert.equal(RESUME_CHIP, 'RESUME YOUR DAILY');
  const line = shareTodayLine({ dailies: D('password', 'coastclear'), mine: { password: 7, coastclear: 161 } }, (id, s) => (id === 'password' ? `${s} guesses` : '2:41'));
  assert.equal(line, 'NEON SPEAKEASY DAILIES · PASSWORD 7 guesses · COASTCLEAR 2:41 · SWEPT · neonspeakeasy.com');
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(line), 'no emoji');
});

// ---------------------------------------------------------------- DFIX2 — THE DAILIES FIX PASS (FABLE REVIEW #2)
import { dayTurned, chipState, tableCut, cardRows, stillToPlay, TABLE_TOP } from '../js/daily/today-logic.js';

test('DFIX2 finding 4 — the 4 am turn: a `today` from another day is stale (re-read, never a reload)', () => {
  assert.equal(dayTurned({ day: 'd20261108' }, 'd20261109'), true);
  assert.equal(dayTurned({ day: 'd20261109' }, 'd20261109'), false);
  assert.equal(dayTurned(null, 'd20261109'), false); assert.equal(dayTurned({ dailies: [] }, 'd20261109'), false, 'an answer with no day (an old server) is never stale by day');
});

test('DFIX2 finding 5 — THE RESUME CHIP shows only while its run is still resumable; a stale hold clears itself', () => {
  const t = { day: 'd20261109', dailies: D('password', 'coastclear'), mine: {}, started: {}, startedDay: {} };
  assert.equal(chipState(t, null), 'none');
  assert.equal(chipState({ dailies: [] }, { id: 'coastclear', day: 'd20261109' }), 'none', 'the dailies off / no answer yet: hidden, the hold kept');
  assert.equal(chipState(t, { id: 'coastclear', day: 'd20261109' }), 'show', 'held today, unplayed');
  assert.equal(chipState(t, { id: 'coastclear', day: null }), 'show', 'an old hold with no day: today\'s');
  assert.equal(chipState({ ...t, mine: { coastclear: 140 } }, { id: 'coastclear', day: 'd20261109' }), 'drop', 'finished elsewhere');
  assert.equal(chipState(t, { id: 'coastclear', day: 'd20261108' }), 'drop', 'yesterday\'s hold with no run in flight there (the run is lost to the 4 am rule)');
  assert.equal(chipState({ ...t, started: { coastclear: true }, startedDay: { coastclear: 'd20261108' } }, { id: 'coastclear', day: 'd20261108' }), 'show', 'yesterday\'s run still in flight (finding 7): RESUME');
  assert.equal(chipState({ ...t, started: { coastclear: true }, startedDay: {} }, { id: 'coastclear', day: 'd20261108' }), 'show', 'an older server (no startedDay): started is enough');
  assert.equal(chipState({ ...t, started: { coastclear: true } }, { id: 'coastclear', day: 'd20261107' }), 'drop', 'two days back: gone');
  assert.equal(chipState(t, { id: 'nightcap', day: 'd20261109' }), 'drop', 'a daily no longer on the list');
});

test('DFIX2 — SLIM CARDS ON SCORES: the finishers vs STILL TO PLAY, the top 5 + you, SHOW ALL n', () => {
  const me = { pid: 'P0', name: 'AVA' }, names = { P1: 'BEN', P2: 'KIM', P3: 'LOU', P4: 'MAXIMILIANOS' };
  const t = { dailies: D('pw'), mine: { pw: 6 }, table: ['P1', 'P2', 'P3', 'P4'], friends: { P1: { pw: { score: 4 } }, P2: { pw: { score: 8 } }, P3: {}, P4: {} } };
  const { finishers, waiting } = cardRows(tableFor(t, 'pw', { names, me, better: 'low' }).rows);
  assert.deepEqual(finishers.map(r => [r.name, r.place]), [['BEN', 1], ['AVA', 2], ['KIM', 3]]);
  assert.equal(stillToPlay(waiting), 'STILL TO PLAY · LOU · MAXIMILIANOS', 'whole names, one line');
  assert.equal(stillToPlay([]), '');
  // you not yet played: YOU leads the line; a friend who PLAYED (score hidden) is a finisher (a card reading PLAYED)
  const u = { dailies: D('pw'), mine: {}, table: ['P1', 'P3'], friends: { P1: { pw: { done: true } }, P3: {} } };
  const cr = cardRows(tableFor(u, 'pw', { names, me, better: 'low' }).rows);
  assert.deepEqual(cr.finishers.map(r => [r.name, r.played, r.score]), [['BEN', true, null]]);
  assert.equal(stillToPlay(cr.waiting), 'STILL TO PLAY · YOU · LOU');
  // the cut: ≤ 6 finishers all shown; 11 → the top 5 + you at 9TH + SHOW ALL 11; you inside the top 5 → just the top 5
  const rows = n => Array.from({ length: n }, (_, i) => ({ pid: `P${i}`, name: `N${i}`, place: i + 1, me: i === 8 }));
  assert.equal(TABLE_TOP, 5);
  assert.deepEqual(tableCut(rows(6)), { shown: rows(6), hidden: [], more: 0 }, 'six: no row for one more');
  const c = tableCut(rows(11));
  assert.deepEqual(c.shown.map(r => r.place), [1, 2, 3, 4, 5, 9]); assert.equal(c.hidden.length, 5); assert.equal(c.more, 11);
  const inTop = tableCut(rows(11).map(r => ({ ...r, me: r.place === 2 })));
  assert.deepEqual(inTop.shown.map(r => r.place), [1, 2, 3, 4, 5]); assert.equal(inTop.hidden.length, 6);
  assert.deepEqual(tableCut(rows(11), { all: true }).hidden, [], 'SHOW ALL opens the rest in place');
});
