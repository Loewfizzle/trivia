// HOLD'EM IN THE CITY — THE HOLD'EM BOARD (core/boards.js holdem-tw): TOURNAMENT WINS this week / all time, KNOCKOUTS the tie-break, then
// the earlier to reach it — ONE sort value (tieSort); the counters ONLY from the dealer's own record (holdem-dealer.js#resultRows →
// match-report.js#holdemCounters, bounded); CASH never counts; a match under COUNTS (3 hands) never counts; the board rows from the stats
// (api/_lib/lb.js#boardPaths) — a public row stays ROW_KEYS only (tests/integration/holdem-server.test.mjs proves it on the emulators);
// the back-fill from the records (core/board-fill.js#holdemFromRecords + filledHoldem).
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRecord, applyOp, advance, dueOf, resultRows, COUNTS } from '../api/_lib/holdem-dealer.js';
import { legalActions } from '../js/games/holdem/table.js';
import { rngFrom } from '../js/core/rng.js';
import { boardDef, careerBoards, tabBoards, primaryBoard, tieSort, tieOf, fmtValue, BOARD_GAMES, GOAL_GAMES } from '../js/core/boards.js';
import { holdemCounters } from '../js/core/match-report.js';
import { matchStep } from '../js/core/progress.js';
import { boardPaths } from '../api/_lib/lb.js';
import { weekKey, weekEndsAt } from '../js/core/week.js';
import { holdemFromRecords, filledHoldem } from '../js/core/board-fill.js';
import { readFileSync } from 'node:fs';

const T0 = Date.UTC(2026, 10, 11, 23);   // a Wednesday evening, Eastern
const weekStart = weekEndsAt(T0) - 7 * 864e5;

test('the catalog: HOLD\'EM has a board + a tab; the tab shows ONE board — TOURNAMENT WINS (this week / all time) — with its explainer', () => {
  assert.ok(BOARD_GAMES.includes('holdem'));
  assert.ok(GOAL_GAMES.includes('holdem'), 'a playable board game can be the weekly goal\'s featured game');
  const view = readFileSync(new URL('../js/board/view.js', import.meta.url), 'utf8');   // (the view needs a browser — read its list)
  assert.ok(view.includes("export const TABS = Object.freeze(['xp', 'dailies', 'overclock', 'prism', 'holdem']);"), 'FIVE TABS');
  const d = boardDef('holdem-tw');
  assert.equal(d.game, 'holdem');
  assert.equal(d.tie, 'ko');
  assert.equal(d.label, 'TOURNAMENT WINS', 'one line on the plate — RESETS MONDAY says the week');
  assert.ok(d.note.includes('TOURNAMENTS ONLY (NOT CASH)'), 'its one-line explainer says CASH doesn\'t count');
  assert.deepEqual(tabBoards('holdem').map(b => b.id), ['holdem-tw']);
  assert.equal(primaryBoard('holdem').id, 'holdem-tw', 'the sign\'s preview shows the same board');
  assert.ok(careerBoards('holdem').some(b => b.id === 'holdem-wins'), 'the generic WINS stays (the profile\'s game card)');
  assert.equal(tabBoards('prism'), null, 'the other tabs keep their RECORDS / CAREER switch');
});

test('THE SORT: wins first, then knockouts, then the earlier to reach it — one value; shown as "3 WINS · 5 KOs"', () => {
  const a = tieSort(3, 5, T0, { weekStart }), b = tieSort(3, 5, T0 + 60e3, { weekStart }), c = tieSort(3, 6, T0 + 3 * 864e5, { weekStart }), d = tieSort(4, 0, T0 + 4 * 864e5, { weekStart });
  assert.ok(a > b, 'the same wins + KOs: the earlier ranks higher');
  assert.ok(c > a, 'a knockout more beats being earlier');
  assert.ok(d > c, 'a win more beats any number of knockouts');
  assert.deepEqual(tieOf(a), { n: 3, tie: 5 });
  assert.equal(tieSort(0, 4, T0, { weekStart }), null, 'no tournament win: off the board');
  assert.ok(Number.isSafeInteger(tieSort(5000, 999, T0)), 'all time: safe integers');
  assert.equal(fmtValue(boardDef('holdem-tw'), a), '3 WINS · 5 KOs');
  assert.equal(fmtValue(boardDef('holdem-tw'), tieSort(1, 1, T0, { weekStart })), '1 WIN · 1 KO');
});

test('the counters, bounded: a tournament win = 1, knockouts ≤ players − 1; CASH counts for neither', () => {
  assert.deepEqual(holdemCounters({ mode: 'tournament', win: true, kos: 2, n: 4 }), { tw: 1, ko: 2, reach: true });
  assert.deepEqual(holdemCounters({ mode: 'tournament', win: false, kos: 99, n: 4 }), { tw: 0, ko: 3, reach: true });
  assert.deepEqual(holdemCounters({ mode: 'tournament', win: false, kos: 0, n: 4 }), { tw: 0, ko: 0, reach: false });
  assert.deepEqual(holdemCounters({ mode: 'cash', win: true, kos: 3, n: 4 }), { tw: 0, ko: 0, reach: false });
});

// a whole tournament on the dealer (the engine + the server's ops — no database)
function playTournament(n, seed) {
  const rng = rngFrom(seed);
  const rec = newRecord({ code: 'ABCD', uids: Array.from({ length: n }, (_, i) => `u${i + 1}`), mode: 'tournament', speed: 'turbo', now: T0, rng });
  advance(rec, T0, rng);
  let now = T0 + 1, guard = 0;
  while (!rec.m.ended && ++guard < 20000) {
    const L = legalActions(rec.m.table);
    if (L) applyOp(rec, 'act', L.id, { hand: rec.m.table.hand, seq: rec.seq, action: L.canRaise && rec.m.hands >= 3 && rng() < 0.4 ? 'allin' : L.canCheck ? 'check' : 'call' }, { now: now += 500, rng });
    else { now = Math.max(now + 100, dueOf(rec) ?? now); advance(rec, now, rng); }
  }
  return rec;
}

test('the dealer\'s rows carry the board\'s counters: the winner\'s tournament win + every knockout, from the record', () => {
  let rec = null;
  for (const seed of ['hb1', 'hb2', 'hb3', 'hb4', 'hb5']) { rec = playTournament(4, seed); if (rec.m.hands >= COUNTS.tournament.hands) break; }
  assert.ok(rec.m.ended && rec.m.hands >= COUNTS.tournament.hands, 'a counted tournament');
  const ex = resultRows(rec);
  const w = ex.rows[rec.m.winner];
  assert.equal(w.c.tw, 1);
  assert.equal(Object.values(ex.rows).filter(r => r.c.tw).length, 1, 'one tournament win');
  const kos = Object.values(rec.m.players).reduce((a, p) => a + p.kos, 0);
  assert.equal(Object.values(ex.rows).reduce((a, r) => a + (r.c.ko || 0), 0), kos, 'every knockout credited');
  assert.equal(kos, 3, 'four players: three knockouts');
  for (const [id, r] of Object.entries(ex.rows)) assert.equal(!!r.reach, !!(r.c.tw || r.c.ko), `${id}: reach = the standing moved`);
  // a match under COUNTS: no rows at all
  rec.m.hands = COUNTS.tournament.hands - 1;
  assert.equal(resultRows(rec), null, 'a 2-hand match → no row');
});

test('the stats step + the board rows: the winner on holdem-tw this week + all time; a tie on wins → KOs decide; CASH → no row', () => {
  const pay = (s, key, c, reach, at) => matchStep(s, { key, gid: 'holdem', row: { rank: c.tw ? 1 : 2, win: !!c.tw, c: { p: 1, ...c }, rec: {}, reach }, n: 4, now: at, gap: 0 }).next;
  const wk = weekKey(T0);
  let A = pay(null, 'k1', { w: 1, tw: 1, ko: 1 }, true, T0);
  let B = pay(null, 'k2', { w: 1, tw: 1, ko: 2 }, true, T0 + 3600e3);
  const pa = boardPaths('pa', A, { now: T0 + 7200e3 }), pb = boardPaths('pb', B, { now: T0 + 7200e3 });
  assert.ok(pa[`lb/holdem-tw/${wk}/pa`] > 0 && pa['lb/holdem-tw/all/pa'] > 0, 'on this week + all time');
  assert.ok(pb[`lb/holdem-tw/${wk}/pb`] > pa[`lb/holdem-tw/${wk}/pa`], 'one win each: the more KOs wins the tie (though later)');
  assert.deepEqual(tieOf(pb[`lb/holdem-tw/${wk}/pb`]), { n: 1, tie: 2 });
  // CASH: the generic win counts for the profile, never the HOLD'EM board
  const C = pay(null, 'k3', { w: 1 }, false, T0);
  const pc = boardPaths('pc', C, { now: T0 + 7200e3 });
  assert.equal(pc[`lb/holdem-tw/${wk}/pc`] ?? null, null);
  assert.equal(pc['lb/holdem-tw/all/pc'] ?? null, null);
  // the earlier to reach it: equal wins + KOs → the first there ranks higher
  const D = pay(null, 'k4', { w: 1, tw: 1, ko: 1 }, true, T0 + 7200e3);
  assert.ok(pa[`lb/holdem-tw/${wk}/pa`] > boardPaths('pd', D, { now: T0 + 9000e3 })[`lb/holdem-tw/${wk}/pd`]);
  // the next week: this week's row starts again (all time keeps it)
  const next = boardPaths('pa', A, { now: T0 + 7 * 864e5 });
  assert.equal(next[`lb/holdem-tw/${weekKey(T0 + 7 * 864e5)}/pa`] ?? null, null);
  assert.ok(next['lb/holdem-tw/all/pa'] > 0);
  // the ALL TIME tie-break: wins then KOs over every week
  A = pay(A, 'k5', { p: 0, tw: 1, ko: 0 }, true, T0 + 8 * 864e5);
  assert.deepEqual(tieOf(boardPaths('pa', A, { now: T0 + 8 * 864e5 })['lb/holdem-tw/all/pa']), { n: 2, tie: 1 });
});

test('THE BACK-FILL from the dealer\'s records: tournament wins (+ the KOs the records keep), never CASH, never a skipped outcome; idempotent', () => {
  const wk = weekKey(T0);
  const results = {
    ABCD_m1: { st: 'done', at: T0 - 3600e3, g: 'holdem', mode: 'turbo', n: 3, src: 'dealer', o: { pa: { win: true, rank: 1 }, pb: { win: false, rank: 2 }, pc: { win: false, rank: 3 } }, ko: { pa: 1, pb: 1 } },
    ABCD_m2: { st: 'done', at: T0, g: 'holdem', mode: 'standard', n: 2, src: 'dealer', o: { pb: { win: true, rank: 1 }, pa: { win: false, rank: 2 } } },   // (an old record — no ko)
    ABCD_m3: { st: 'done', at: T0, g: 'holdem', mode: 'cash', n: 2, src: 'dealer', o: { pc: { win: true, rank: 1 }, pa: { win: false, rank: 2 } } },
    ABCD_m4: { st: 'done', at: T0, g: 'holdem', mode: 'turbo', n: 2, src: 'dealer', o: { pc: { win: true, rank: 1, skip: 'too_soon' } } },
    ABCD_m5: { st: 'done', at: T0 - 9 * 864e5, g: 'holdem', mode: 'turbo', n: 2, src: 'dealer', o: { pa: { win: true, rank: 1 } } },   // (a past week)
    ABCD_m6: { st: 'done', at: T0, g: 'prism', mode: 'battle', n: 2, o: { pc: { win: true, rank: 1 } } },
  };
  const F = holdemFromRecords({ results, wk });
  assert.deepEqual(F.pa.all, { tw: 2, ko: 1, ra: T0 - 3600e3 });
  assert.deepEqual(F.pa.week, { tw: 1, ko: 1, ra: T0 - 3600e3 });
  assert.deepEqual(F.pb.week, { tw: 1, ko: 1, ra: T0 });
  assert.equal(F.pc, undefined, 'CASH, a skipped outcome and other games never count');
  const cur = { wk, g: { holdem: { p: 4, w: 3 } }, gw: { holdem: { p: 3, w: 2 } } };
  const once = filledHoldem(cur, F.pa, wk), twice = filledHoldem({ ...cur, ...once }, F.pa, wk);
  assert.deepEqual(once, twice, 'a second run writes the same numbers');
  assert.equal(once.g.holdem.p, 4, 'the other counters untouched');
  assert.equal(once.gw.holdem.tw, 1);
  const rows = boardPaths('pa', { ...cur, ...once }, { now: T0 + 60e3 });
  assert.deepEqual(tieOf(rows[`lb/holdem-tw/${wk}/pa`]), { n: 1, tie: 1 });
  assert.deepEqual(tieOf(rows['lb/holdem-tw/all/pa']), { n: 2, tie: 1 });
  // a live counter ahead of the records (a match landing during the run) is never lowered
  assert.equal(filledHoldem({ wk, g: { holdem: { tw: 5 } }, gw: {} }, F.pa, wk).g.holdem.tw, 5);
});
