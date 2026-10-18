// Profiles + global boards, the pure parts: Eastern week keys, ranks and XP, the board-name filter, restore keys,
// the board catalog, and what every game's finished match puts on the boards (with the plausibility checks).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { weekKey, dayKey, weekEndsAt } from '../js/core/week.js';
import { RANKS, rankIndex, progress, matchXp } from '../js/core/ranks.js';
import { isOffensive, boardName, nameKey, fold } from '../js/core/names.js';
import { keyFromBytes, formatKey, normalizeKey, KEY_ALPHABET } from '../js/core/pkey.js';
import { boardDef, careerBoards, recordBoards, primaryBoard, fmtValue, toSort, fromSort, better, BOARD_GAMES } from '../js/core/boards.js';
import { extractMatch, maxPulseScore, maxSlipDistance, REPORT_GAMES, unreportable } from '../js/core/match-report.js';
import { finalGame, T0 } from './fixtures/finals.mjs';
import { GAMES } from '../js/config.js';

const manifest = JSON.parse(readFileSync('data/pulse/manifest.json', 'utf8'));
const pulseCounts = Object.fromEntries(manifest.songs.map(s => [s.id, s.counts]));
const U = ['ua', 'ub', 'uc', 'ud'];

test('weeks start Monday 00:00 Eastern, across both DST changes', () => {
  // Sun 2026-10-18 23:59 EDT = Mon 03:59 UTC → still the week of Mon 10-12
  assert.equal(weekKey(Date.UTC(2026, 9, 19, 3, 59)), 'w20261012');
  // Mon 2026-10-19 00:00 EDT = 04:00 UTC → the new week
  assert.equal(weekKey(Date.UTC(2026, 9, 19, 4, 0)), 'w20261019');
  // after DST ends (Nov 1): Mon 2026-11-02 00:00 EST = 05:00 UTC
  assert.equal(weekKey(Date.UTC(2026, 10, 2, 4, 59)), 'w20261026');
  assert.equal(weekKey(Date.UTC(2026, 10, 2, 5, 0)), 'w20261102');
  // spring forward (Mar 8 2026): Mon 2026-03-09 00:00 EDT = 04:00 UTC
  assert.equal(weekKey(Date.UTC(2026, 2, 9, 3, 59)), 'w20260302');
  assert.equal(weekKey(Date.UTC(2026, 2, 9, 4, 0)), 'w20260309');
  assert.equal(weekEndsAt(Date.UTC(2026, 9, 14, 12)), Date.UTC(2026, 9, 19, 4, 0));
  assert.equal(weekEndsAt(Date.UTC(2026, 9, 30, 12)), Date.UTC(2026, 10, 2, 5, 0));
  assert.equal(dayKey(Date.UTC(2026, 9, 19, 3, 59)), 'd20261018');
  // a year end: Thu 2027-01-01 is in the week of Mon 2026-12-28
  assert.equal(weekKey(Date.UTC(2027, 0, 1, 15)), 'w20261228');
});

test('ranks: thresholds climb, REGULAR comes in the first evening, LEGEND takes months', () => {
  assert.deepEqual(RANKS.map(r => r.id), ['newcomer', 'regular', 'insider', 'made', 'legend']);
  assert.equal(rankIndex(0), 0);
  assert.equal(rankIndex(249), 0);
  assert.equal(rankIndex(250), 1);
  assert.equal(rankIndex(1e9), 4);
  const p = progress(1000);
  assert.equal(p.i, 1);
  assert.equal(p.need, 1000);
  assert.ok(Math.abs(p.frac - 750 / 1750) < 1e-9);
  assert.equal(progress(30000).frac, 1);
  // an average evening: 8 matches of 4 players over 4 games, a quarter of them won
  let xp = 0;
  for (let m = 0; m < 8; m++) xp += matchXp({ rank: (m % 4) + 1, win: m % 4 === 0, n: 4, firstToday: m < 4, gamesToday: Math.min(4, m + 1) }).total;
  assert.ok(xp >= RANKS[1].xp, `one evening (${xp} XP) reaches REGULAR`);
  assert.ok(xp < RANKS[2].xp, 'but not INSIDER');
  const evenings = RANKS[4].xp / xp;
  assert.ok(evenings > 40, `LEGEND takes ${evenings.toFixed(0)} evenings (months of weekly play)`);
});

test('match XP: placing, wins scale with the table, PBs and variety', () => {
  assert.equal(matchXp({ rank: 3, win: false, n: 3 }).total, 30);
  assert.equal(matchXp({ rank: 1, win: true, n: 2 }).total, 70);
  assert.equal(matchXp({ rank: 1, win: true, n: 8 }).total, 30 + 40 + 36);
  assert.equal(matchXp({ rank: 2, win: false, n: 4 }).total, 30 + 23);
  const x = matchXp({ rank: 4, win: false, n: 4, pbs: 5, firstToday: true, gamesToday: 3 });
  assert.equal(x.total, 30 + 60 + 25 + 10);
  assert.deepEqual(x.parts.map(p => p.k), ['played', 'pb', 'new', 'variety']);
});

test('board names: offensive names are caught through disguises, ordinary names are not', () => {
  for (const bad of ['fuck', 'FvCk3r', 'f.u.c.k', 'phuuuck', 'sh1t', 'Shiiit', 'b1tch', 'n1gger', 'NiGgA', 'a$$hole', 'kys', 'Cum Lord', 'ANAL', 'big dick', 'hitler88', 'KKK']) {
    assert.ok(isOffensive(bad), `${bad} is caught`);
  }
  for (const ok of ['Bob', 'Mike', 'Nigel', 'Dickens', 'Cassandra', 'Scunthorpe', 'Hancock', 'Assunta', 'Analise', 'Titus', 'Peacock', 'Shitake', 'Torpedo', 'Pedro', 'Grace', 'HAL', 'Essex', 'Sexton', 'Cumberbatch', 'Kyser', 'Mississippi', 'Classic', 'Bass', 'Cocktail', 'Therapist']) {
    assert.ok(!isOffensive(ok), `${ok} is fine`);
  }
  assert.equal(boardName('sh1thead'), 'Player');
  assert.equal(boardName('Mike'), 'Mike');
  assert.equal(nameKey('  Mike  '), 'mike');
  assert.equal(nameKey('MIKE'), nameKey('mike'));
  assert.equal(fold('Ñigel'), 'nigel');
});

test('restore keys: NEON-XXXX-XXXX-XXXX, no look-alikes, typed any way', () => {
  assert.equal(KEY_ALPHABET.length, 32);
  for (const ch of 'O0I1') assert.ok(!KEY_ALPHABET.includes(ch));
  const raw = keyFromBytes(Uint8Array.from({ length: 12 }, (_, i) => i * 37));
  assert.match(formatKey(raw), /^NEON-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal(normalizeKey(formatKey(raw)), raw);
  assert.equal(normalizeKey(formatKey(raw).toLowerCase().replace(/-/g, ' ')), raw);
  assert.equal(normalizeKey(raw), raw);
  assert.equal(normalizeKey('NEON-OOOO-1111-2222'), '');
  assert.equal(normalizeKey('NEON-ABCD'), '');
  // every letter equally likely: 256 is a multiple of 32
  const seen = new Set();
  for (let b = 0; b < 256; b++) seen.add(keyFromBytes(new Uint8Array(12).fill(b))[0]);
  assert.equal(seen.size, 32);
});

test('board catalog: every game has WINS + WIN RATE; records, pulse songs, sort order', () => {
  assert.deepEqual([...BOARD_GAMES].sort(), GAMES.map(g => g.id).sort());
  for (const g of BOARD_GAMES) {
    const c = careerBoards(g);
    assert.equal(c[0].id, `${g}-wins`);
    assert.equal(c[1].id, `${g}-wr`);
    for (const b of [...c, ...recordBoards(g, manifest.songs)]) assert.ok(boardDef(b.id), b.id);
  }
  assert.equal(recordBoards('pulse', manifest.songs).length, manifest.songs.length * 3);
  assert.equal(boardDef('pulse-pulse3-hard').diff, 'hard');
  assert.equal(boardDef('nope-wins'), null);
  assert.equal(boardDef('pulse-x-hard'), null);
  assert.deepEqual(careerBoards('gridlock').map(b => b.id), ['gridlock-wins', 'gridlock-wr', 'gridlock-sunk', 'gridlock-w-classic', 'gridlock-w-salvo', 'gridlock-w-royale', 'gridlock-w-arcade']);
  assert.equal(primaryBoard('slip').id, 'slip-dist');
  assert.equal(primaryBoard('signal').id, 'signal-wins');
  const fast = boardDef('cipher-fast5');
  assert.ok(toSort(fast, 9000) > toSort(fast, 12000), 'a faster solve sorts higher');
  assert.equal(fromSort(fast, toSort(fast, 9000)), 9000);
  assert.ok(better(boardDef('golf-par9'), -4, -2));
  assert.equal(fmtValue(boardDef('golf-par9'), -4), '−4');
  assert.equal(fmtValue(boardDef('golf-par9'), 0), 'E');
  assert.equal(fmtValue(boardDef('slip-dist'), 2412), '2.41 km');
  assert.equal(fmtValue(boardDef('cipher-fast5'), 9420), '9.42 s');
  assert.equal(fmtValue(boardDef('cipher-wr'), 6250), '62.5%');
});

test('every game reports its finished match: placings, wins, highlights, records', () => {
  assert.deepEqual([...REPORT_GAMES].sort(), GAMES.map(g => g.id).sort());
  const expectRec = { cipher: ['cipher-score', 'cipher-fast5'], overclock: ['overclock-std'], pulse: ['pulse-pulse1-normal'], golf: ['golf-par9'], slip: ['slip-dist'], stakes: ['stakes-chips', 'stakes-big'] };
  const expectC = { signal: 'el', bluff: 'fool', agent: 'esc', prism: 'ko', gridlock: 'sunk' };
  for (const id of REPORT_GAMES) {
    const ex = extractMatch(finalGame(id, U), { pulseCounts });
    assert.equal(ex.gid, id);
    assert.equal(ex.n, 4);
    assert.equal(ex.rows.ua.rank, 1, `${id}: the winner`);
    assert.ok(ex.rows.ua.win && !ex.rows.ub.win, `${id}: one win`);
    for (const u of U) assert.equal(ex.rows[u].c.p, 1, `${id}: played`);
    assert.deepEqual(ex.rejected, [], `${id}: nothing rejected`);
    for (const b of expectRec[id] || []) assert.ok(ex.rows.ua.rec[b] != null, `${id}: record ${b}`);
    if (expectC[id]) assert.ok(ex.rows.ua.c[expectC[id]] > 0, `${id}: highlight ${expectC[id]}`);
  }
  // Score Rush is a PRISM DROP record; battle isn't
  assert.ok(extractMatch(finalGame('prism', U, { mode: 'rush' })).rows.ua.rec['prism-rush'] > 0);
  assert.equal(extractMatch(finalGame('prism', U)).rows.ua.rec['prism-rush'], undefined);
  // OVERCLOCK: only the Standard (12) match is a record
  assert.equal(extractMatch(finalGame('overclock', U, { mode: 'quick' })).rows.ua.rec['overclock-std'], undefined);
  // golf: 9 holes relative to par (par 27)
  assert.equal(extractMatch(finalGame('golf', U)).rows.ua.rec['golf-par9'], 22 - 27);
  // signal: the winner struck down all three
  assert.equal(extractMatch(finalGame('signal', U)).rows.ua.c.el, 3);
});

test('GRIDLOCK: wins are counted per mode (Classic, Salvo, Battle Royale, Arcade) and fleets sunk', () => {
  for (const mode of ['classic', 'salvo', 'royale', 'arcade']) {
    const ex = extractMatch(finalGame('gridlock', U, { mode }));
    assert.equal(ex.mode, mode);
    assert.equal(ex.rows.ua.c[`w_${mode}`], 1, `${mode} win`);
    assert.equal(ex.rows.ub.c[`w_${mode}`], undefined);
    assert.equal(ex.rows.ua.c.sunk, 3);
  }
});

test('plausibility: impossible records are rejected, the match still counts', () => {
  const imp = [
    ['pulse', { pulseScore: maxPulseScore(317) + 1 }, 'pulse-pulse1-normal'],
    ['slip', { dist: Math.ceil(maxSlipDistance(243) * 1.05 + 41) }, 'slip-dist'],
    ['cipher', { fast5: 400 }, 'cipher-fast5'],
    ['prism', { mode: 'rush', rushScore: 99_999_999 }, 'prism-rush'],
    ['overclock', { ocPts: 9999 }, 'overclock-std'],
    ['golf', { golfStroke: 0 }, 'golf-par9'],
  ];
  for (const [id, opts, board] of imp) {
    const ex = extractMatch(finalGame(id, U, opts), { pulseCounts });
    assert.ok(ex.rejected.some(r => r.uid === 'ua' && r.board === board), `${id}: ${board} rejected`);
    assert.equal(ex.rows.ua.rec[board], undefined, `${id}: no record`);
    assert.equal(ex.rows.ua.c.p, 1, `${id}: still played`);
  }
  // just under the ceiling is fine
  assert.ok(extractMatch(finalGame('pulse', U, { pulseScore: maxPulseScore(317) }), { pulseCounts }).rows.ua.rec['pulse-pulse1-normal']);
  assert.equal(maxPulseScore(10), 1000);
  assert.equal(maxPulseScore(11), 1200);
  // an unknown song has no record
  assert.equal(extractMatch(finalGame('pulse', U, { song: 'pulse99' }), { pulseCounts }).rows.ua.rec['pulse-pulse99-normal'], undefined);
});

test('unfinished, unknown or solo matches are not reportable; a total deadlock is nobody\'s win', () => {
  assert.equal(unreportable({ ...finalGame('cipher', U), phase: 'play' }), 'not finished');
  assert.equal(unreportable(finalGame('cipher', ['solo'])), 'too few players');
  assert.equal(unreportable({ id: 'chess', phase: 'final', participants: { a: true, b: true } }), 'unknown game');
  const tie = finalGame('bluff', ['a', 'b']);
  for (const r of Object.values(tie.results)) { r.a.pts = 100; r.b.pts = 100; }
  const ex = extractMatch(tie);
  assert.ok(ex.rows.a.rank === 1 && ex.rows.b.rank === 1);
  assert.ok(!ex.rows.a.win && !ex.rows.b.win);
  assert.equal(T0 % 1000, 0);
});
