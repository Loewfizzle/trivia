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
import { extractMatch, maxPulseScore, maxSlipDistance, REPORT_GAMES, DEALER_GAMES, unreportable } from '../js/core/match-report.js';
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
  assert.deepEqual([...BOARD_GAMES].sort(), GAMES.filter(g => !g.preview).map(g => g.id).sort());   // (HOLD'EM IN THE CITY: HOLD'EM's board — the skip removed)
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
  assert.deepEqual([...REPORT_GAMES].sort(), GAMES.filter(g => !g.preview && !DEALER_GAMES.includes(g.id)).map(g => g.id).sort());   // (HE3 / HE10: HOLD'EM's result is the SERVER DEALER's own — api/_lib/holdem-store.js#reportMatch, never extractMatch; api/report.js#DEALER_GAMES)
  const expectRec = { cipher: ['cipher-score', 'cipher-fast5'], overclock: ['overclock-std'], pulse: ['pulse-pulse1-normal'], golf: ['golf-par9'], slip: ['slip-dist'], stakes: ['stakes-chips', 'stakes-big'], rum: ['rum-f15'] };
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

// FR6 FIXES A — C3: PRISM DROP's SCORE RUSH bound no longer trusts the HOST's song lengths (game.sd): a hacked host's sd [1e9] made any
// score "possible". The bound's seconds are capped at RUSH_MAX_S (the longest real song + 10 s); a rush with an impossible song is rejected
test('PRISM DROP rush: a hacked host\'s song length can\'t lift the bound (C3)', async () => {
  const { RUSH_MAX_S, maxRushScore } = await import('../js/core/match-report.js');
  const { readFileSync } = await import('node:fs');
  const songs = JSON.parse(readFileSync(new URL('../data/prism/manifest.json', import.meta.url), 'utf8')).songs;
  assert.ok(RUSH_MAX_S >= Math.max(...songs.map(x => x.duration)) + 10, 'RUSH_MAX_S covers the longest song + 10 s — raise it with a longer song');
  const huge = maxRushScore(60, 1e6);
  const hacked = { ...finalGame('prism', U, { mode: 'rush', rushScore: huge }), sd: [1e9] };
  const ex = extractMatch(hacked);
  assert.ok(ex.rejected.some(r => r.uid === 'ua' && r.board === 'prism-rush'), 'the hacked song length is rejected');
  assert.equal(ex.rows.ua.rec['prism-rush'], undefined);
  assert.equal(ex.rows.ua.c.p, 1, 'the match still counts');
  // a score possible in the longest song's time passes; one possible only in a longer "song" doesn't
  const ok = { ...finalGame('prism', U, { mode: 'rush', rushScore: maxRushScore(60, 227.84) }), sd: [227_840] };
  assert.ok(extractMatch(ok).rows.ua.rec['prism-rush'] > 0, 'a real song, a score at the ceiling');
  const twoSongs = { ...finalGame('prism', U, { mode: 'rush', rushScore: 40_000 }), sd: [200_000, 200_000] };
  assert.ok(extractMatch(twoSongs).rejected.some(r => r.board === 'prism-rush'), 'a rush is ONE song');
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

// OC5 — THE HORSESHOE: `overclock-horseshoe` = backed the winning horse in a DUMB LUCK race (2+ players), the server REPLAYS the race from the
// room's own record (game/dl/{ci}: the locked picks + the lock's ms → the draw; every result its payout) — never a client claim
test('OVERCLOCK — THE HORSESHOE: a backed winner ✓ · a losing ticket ✗ · no ticket ✗ · a tampered record ✗ · solo never', async () => {
  const L = await import('../js/games/overclock/luck.js');
  const seed = 'hs-seed', ci = 2;
  const field = L.dlField(seed, ci);
  const race = (uids, pk, lk = 1_762_000_123_456) => {
    const g = finalGame('overclock', uids, { mode: 'quick' });
    g.seed = seed;
    g.order = ['math', 'memory', 'dumbluck', 'stroop', 'count', 'trivia'];
    g.dl = { [ci]: { pk, lk, w: L.dlDraw(seed, ci, field, pk, lk) } };
    g.results[ci] = L.dlResults(g, ci, g.dl[ci]);
    return g;
  };
  const flag = (ex, u) => !!(ex.rows[u] && ex.rows[u].f && ex.rows[u].f.horseshoe);
  // ua + uc back lane 0, ub lane 1, ud has no ticket — a lock ms where lane 0 comes in (the draw is the stored record's, as a host makes it)
  const pick = { ua: 0, ub: 1, uc: 0 };
  let lk = 1_762_000_000_000;
  while (L.dlDraw(seed, ci, field, pick, lk) !== 0) lk++;
  const g = race(U, pick, lk);
  const win = g.dl[ci].w, pk = g.dl[ci].pk;
  let ex = extractMatch(g);
  assert.deepEqual(ex.rejected, []);
  for (const u of U) assert.equal(flag(ex, u), pk[u] === win, `${u}: ${pk[u] === win ? 'backed the winner' : 'no winning ticket'}`);
  assert.ok(U.some(u => pk[u] === win) && U.some(u => u in pk && pk[u] !== win) && U.some(u => !(u in pk)), 'hit + miss + no ticket all covered');
  // a TAMPERED record: the stored winner moved to ub's horse (the draw no longer replays) → nobody's flag
  const t1 = structuredClone(g); t1.dl[ci].w = pk.ub; t1.results[ci] = L.dlResults(t1, ci, t1.dl[ci]);
  ex = extractMatch(t1);
  for (const u of U) assert.ok(!flag(ex, u), `${u}: a draw that doesn't replay unlocks nothing`);
  // a padded payout (the result isn't the ticket's) → no flag either
  const t2 = structuredClone(g); const someWinner = U.find(u => pk[u] === win); t2.results[ci][someWinner].pts += 20;
  assert.ok(!flag(extractMatch(t2), someWinner));
  // SOLO never (Dumb Luck is never dealt alone — and a record that claims one still unlocks nothing)
  let slk = 1_762_000_000_000;
  while (L.dlDraw(seed, ci, field, { ua: 3 }, slk) !== 3) slk++;
  ex = extractMatch(race(['ua'], { ua: 3 }, slk));
  assert.ok(ex.solo && !flag(ex, 'ua'), 'solo: no horseshoe');
  // the flag's key is database-safe + the achievement awards THE HORSESHOE emblem (the art is THE LAB's — pending: the glyph until then)
  const { ACH_ROWS, ITEM_ROWS } = await import('../api/_lib/catalog.js');
  const a = ACH_ROWS.find(x => x.id === 'horseshoe');
  assert.equal(a.item, 'emb-horseshoe');
  assert.equal(a.game, 'overclock');
  assert.ok(a.check({}, { gf: { 'overclock-horseshoe': 1 } }) && !a.check({}, { gf: {} }));
  assert.ok(ITEM_ROWS.find(x => x.id === 'emb-horseshoe' && x.kind === 'emblem' && x.glyph));
});


test('progression: tiers inside ranks, the nightly streak, the weekly goal, per-game mastery', async () => {
  const R = await import('../js/core/ranks.js');
  // tiers: three steps inside each rank, LEGEND has none
  assert.equal(R.step(0).name, 'NEWCOMER I');
  assert.equal(R.step(249).name, 'NEWCOMER III');
  assert.equal(R.step(250).name, 'REGULAR I');
  const ins = R.RANKS.find(r => r.id === 'insider'), made = R.RANKS.find(r => r.id === 'made');
  const third = (made.xp - ins.xp) / 3;
  assert.equal(R.step(Math.ceil(ins.xp + third)).name, 'INSIDER II');
  assert.equal(R.step(made.xp - 1).nextName, 'MADE I');
  assert.equal(R.step(1e9).name, 'LEGEND'); assert.equal(R.step(1e9).tier, null);
  assert.ok(R.stepIndex(Math.ceil(ins.xp + third)) === R.stepIndex(ins.xp) + 1, 'a step up inside the rank');
  for (let x = 0; x < 30000; x += 137) { const st = R.step(x); assert.ok(st.frac >= 0 && st.frac <= 1 && (st.to == null || (x >= st.from && x < st.to))); }
  // streak
  assert.deepEqual(R.streakAfter(null, 'd20261018', 'd20261017'), { n: 1, d: 'd20261018' });
  assert.deepEqual(R.streakAfter({ n: 3, d: 'd20261017' }, 'd20261018', 'd20261017'), { n: 4, d: 'd20261018' });
  assert.deepEqual(R.streakAfter({ n: 4, d: 'd20261018' }, 'd20261018', 'd20261017'), { n: 4, d: 'd20261018' }, 'a second match the same night keeps it');
  assert.deepEqual(R.streakAfter({ n: 9, d: 'd20261015' }, 'd20261018', 'd20261017'), { n: 1, d: 'd20261018' }, 'a missed night resets it');
  assert.equal(R.streakPart(100, 1), null);
  assert.equal(R.streakPart(100, 2).v, 10);
  assert.equal(R.streakPart(100, 12).v, 40, 'capped at +40 %');
  // weekly goal: the same for everyone, measured from this week's counters
  const g1 = R.weeklyGoal('w20261012', ['cipher', 'slip']), g2 = R.weeklyGoal('w20261012', ['cipher', 'slip']);
  assert.deepEqual(g1, g2);
  const kinds = new Set(Array.from({ length: 40 }, (_, k) => R.weeklyGoal(`w2026${String(k).padStart(4, '0')}`, ['cipher']).kind));
  assert.ok(kinds.size >= 3, 'the goal rotates');
  assert.ok(R.goalProgress({ kind: 'play', n: 8 }, { cipher: { p: 5 }, slip: { p: 3 } }).done);
  assert.ok(!R.goalProgress({ kind: 'win', n: 3 }, { cipher: { p: 5, w: 2 } }).done);
  assert.equal(R.goalProgress({ kind: 'variety', n: 5 }, { a: { p: 1 }, b: { p: 1 }, c: { p: 0 } }).have, 2);
  assert.ok(R.goalProgress({ kind: 'game', game: 'slip', n: 4 }, { slip: { p: 4 } }).done);
  // mastery
  assert.equal(R.mastery({}).lvl, 0);
  assert.equal(R.mastery({ p: 1 }).lvl, 1);
  assert.equal(R.mastery({ p: 5, w: 2 }).lvl, 3);
  assert.ok(R.mastery({ p: 500, w: 200 }).max);
});


test('THE VAULT: unlocks by rank step; what you wear is always something you have', async () => {
  const R = await import('../js/core/ranks.js');
  assert.deepEqual(R.worn(0, 'legend', 'prism'), { f: 'midnight', g: 'none' }, 'a newcomer cannot wear what is locked');
  const made = R.RANKS.find(r => r.id === 'made').xp;
  assert.equal(R.worn(made, null, null).f, 'gold', 'none chosen: the newest unlocked finish');
  assert.equal(R.worn(made, 'brass', 'ice').f, 'brass');
  assert.equal(R.worn(made, 'brass', 'ice').g, 'ice');
  assert.equal(R.worn(1e9, null, null).f, 'legend');
  const ul = R.unlockedBetween(R.RANKS[2].xp - 1, R.RANKS[2].xp);
  assert.deepEqual(ul.map(x => x.id), ['chrome'], 'reaching INSIDER unlocks SILVER CHROME');
  // every step from REGULAR I on unlocks something (no dry stretch)
  for (let k = 2; k <= 12; k++) assert.ok([...R.FINISHES, ...R.GLOWS].some(x => x.at === k) || k === 4, `step ${k} (${R.stepNameAt(k)}) unlocks something`);
});

// OC5 — THE QUICK SOLO PERSONAL BEST: board overclock-quick-solo, computed by the SERVER from the room's record (a solo QUICK run, all six,
// every result inside THE SCORING TABLE — logic.js#ptsCeiling — the order six real skill challenges); STANDARD's solo board unchanged
test('OVERCLOCK — THE QUICK SOLO BOARD: a real solo QUICK run counts; a score no QUICK run can reach is refused; multiplayer + STANDARD unchanged', async () => {
  const { createGame, nextStep } = await import('../js/games/overclock/director.js');
  const { partsFor } = await import('../js/games/overclock/challenges.js');
  const { matchMax, ptsCeiling, levelOf } = await import('../js/games/overclock/logic.js');
  const apply = (g, p) => { for (const [k, v] of Object.entries(p || {})) { if (k === '$room') continue; const ks = k.split('/'); let o = g; for (const x of ks.slice(0, -1)) o = o[x] ??= {}; o[ks.at(-1)] = structuredClone(v); } };
  /** a whole solo match through the director: `ok(ci, parts)` = the player's right answers in each challenge */
  const solo = (mode, seed, ok = (ci, p) => p) => {
    const g = createGame({ matchId: `s-${seed}`, settings: { mode }, participants: { ua: true }, now: 0, seed, bank: {}, trivia: { n: 99 } });
    let now = 0;
    for (let ci = 0; ci < g.total; ci++) {
      now = g.phaseEndsAt; apply(g, nextStep(g, { now, boards: {}, online: { ua: true }, fallback: () => null }));
      const parts = partsFor(g.order[ci], levelOf(ci, g.total));
      now = g.playStartAt + 6000;
      apply(g, nextStep(g, { now, boards: { ua: { p: parts, ok: ok(ci, parts), n: parts, done: true, doneAt: now } }, online: { ua: true }, fallback: () => null }));
      if (g.phase === 'standings') { now = g.phaseEndsAt; apply(g, nextStep(g, { now, boards: {}, online: { ua: true }, fallback: () => null })); }
    }
    assert.equal(g.phase, 'final');
    return g;
  };
  // a perfect run + a sloppy one: both on the board, at their real totals
  for (const [seed, okf] of [['qs-1', (ci, p) => p], ['qs-2', (ci, p) => Math.max(0, p - 1 - (ci % 2))]]) {
    const g = solo('quick', seed, okf);
    assert.ok(!g.order.includes('dumbluck'), 'solo never deals DUMB LUCK');
    const ex = extractMatch(g);
    assert.ok(ex.solo);
    const total = Object.values(g.results).reduce((s, r) => s + r.ua.pts, 0);
    assert.equal(ex.rows.ua.rec['overclock-quick-solo'], total, `${seed}: the QUICK solo board = the run's total (${total})`);
    assert.equal(ex.rows.ua.rec['overclock-std-solo'], undefined);
    assert.deepEqual(ex.rejected, []);
    assert.ok(total <= matchMax(g.order));
  }
  // the bound: one result over its scoring-table ceiling (ok 2 of 4 can never score 160) → refused, the match still counts
  const g = solo('quick', 'qs-3', (ci, p) => (ci === 2 ? Math.floor(p / 2) : p));
  const t1 = structuredClone(g); t1.results[2].ua.pts = ptsCeiling(t1.order[2], t1.results[2].ua.ok, t1.results[2].ua.parts, false) + 1;
  let ex = extractMatch(t1);
  assert.equal(ex.rows.ua.rec['overclock-quick-solo'], undefined);
  assert.ok(ex.rejected.some(r => r.uid === 'ua' && r.board === 'overclock-quick-solo'));
  assert.equal(ex.rows.ua.c.p, 1, 'still played');
  // the ceiling itself is fine (a run AT the table's max)
  const t2 = structuredClone(g); t2.results[2].ua.pts = ptsCeiling(t2.order[2], t2.results[2].ua.ok, t2.results[2].ua.parts, false);
  assert.ok(extractMatch(t2).rows.ua.rec['overclock-quick-solo'] > 0);
  // a solo "QUICK" with DUMB LUCK in it / a missing challenge / a fake 9999 / a non-integer → refused
  const t3 = structuredClone(g); t3.order[1] = 'dumbluck';
  assert.equal(extractMatch(t3).rows.ua.rec['overclock-quick-solo'], undefined);
  const t4 = structuredClone(g); delete t4.results[5];
  assert.equal(extractMatch(t4).rows.ua.rec['overclock-quick-solo'], undefined, 'not all six played: no record (nothing to refuse)');
  const t5 = structuredClone(g); t5.results[0].ua.pts = 9999;
  assert.ok(extractMatch(t5).rejected.some(r => r.board === 'overclock-quick-solo'));
  const t6 = structuredClone(g); t6.results[0].ua.pts += 0.5;
  assert.ok(extractMatch(t6).rejected.some(r => r.board === 'overclock-quick-solo'));
  // the board exists (+ its label); MULTIPLAYER QUICK writes no solo record; STANDARD solo is unchanged
  assert.equal(boardDef('overclock-quick-solo').label, 'QUICK · SOLO');
  assert.equal(boardDef('overclock-quick'), null, 'no multiplayer QUICK board');
  ex = extractMatch(finalGame('overclock', U, { mode: 'quick' }));
  for (const u of U) assert.equal(ex.rows[u].rec['overclock-quick-solo'], undefined);
  const std = solo('standard', 'ss-1');
  ex = extractMatch(std);
  assert.ok(ex.rows.ua.rec['overclock-std-solo'] > 0 && ex.rows.ua.rec['overclock-quick-solo'] === undefined, 'STANDARD solo → its own board, as before');
  // OC8 — B1 (THE FABLE REVIEW: an AFK solo run wrote a 0 + "NEW PERSONAL BEST"): a run with nothing answered is never a record — QUICK or
  // STANDARD — and never a cheat (nothing refused); the match itself still reaches the server (the console's streak / XP rule is its own)
  for (const mode of ['quick', 'standard']) {
    const afk = solo(mode, `afk-${mode}`, () => 0);
    assert.equal(Object.values(afk.results).reduce((s, r) => s + r.ua.pts, 0), 0, `${mode}: the AFK run scored 0`);
    const e0 = extractMatch(afk);
    assert.equal(e0.rows.ua.rec['overclock-quick-solo'], undefined, `${mode}: no 0 on the QUICK · SOLO board`);
    assert.equal(e0.rows.ua.rec['overclock-std-solo'], undefined, `${mode}: no 0 on the STANDARD solo board`);
    assert.deepEqual(e0.rejected, [], `${mode}: an AFK run is not a cheat`);
  }
  // one right answer is enough to count (the smallest real run)
  const one = solo('quick', 'afk-one', ci => (ci === 0 ? 1 : 0));
  assert.ok(extractMatch(one).rows.ua.rec['overclock-quick-solo'] > 0, 'one answered part → on the board');
});

// PFIX-B (FABLE REVIEW finding 9) — THE SCORE RUSH BOUND FROM A SIM: full-skill bot runs on the real engine (scripts/sim-prism-rush.mjs) at the
// fast human pace; the bound sits ≥ 2.5 × the best run of the longest + the shortest song, an honest run keeps its record, the review's forged
// score is refused (the old bound let 222 M through for 923 lines in the longest song)
test('PFIX-B: the SCORE RUSH bound = the sim\'s best runs × ~3 — honest runs pass, the forgeries don\'t', async () => {
  const { maxRushScore, maxRushLines, RUSH_PACE } = await import('../js/core/match-report.js');
  const { rushRun } = await import('../scripts/sim-prism-rush.mjs');
  const songs = JSON.parse(readFileSync(new URL('../data/prism/manifest.json', import.meta.url), 'utf8')).songs;
  const by = [...songs].sort((a, b) => a.duration - b.duration);
  for (const s of [by[0], by.at(-1)]) {
    let best = { sc: 0, ln: 0 };
    for (let k = 0; k < 4; k++) { const r = rushRun(`pin-${s.id}-${k}`, s.duration, RUSH_PACE.pps); if (r.sc > best.sc) best = r; }
    const bound = maxRushScore(Infinity, s.duration);
    assert.ok(bound >= 2.5 * best.sc, `${s.id}: the bound ${bound} ≥ 2.5 × the best run ${best.sc}`);
    assert.ok(bound <= 6 * best.sc, `${s.id}: … and close to honest play (≤ 6 ×, was 100–200 ×)`);
    assert.ok(maxRushLines(s.duration) >= 1.5 * best.ln, `${s.id}: the lines bound clears the best run`);
    const g = { ...finalGame('prism', U, { mode: 'rush', rushScore: best.sc }), sd: [Math.round(s.duration * 1000)] };
    g.results.ua.ln = best.ln;
    assert.equal(extractMatch(g).rows.ua.rec['prism-rush'], best.sc, `${s.id}: an honest best run keeps its record`);
  }
  // the review's numbers: 60 000 000 / 900 lines for one song, and the old bound's 222 M at 923 lines in the longest song
  for (const [sc, ln] of [[60_000_000, 900], [222_000_000, 923], [3_000_000, 500], [500_000, 10]]) {
    const g = { ...finalGame('prism', U, { mode: 'rush', rushScore: sc }), sd: [230_833] };
    g.results.ua.ln = ln;
    assert.ok(extractMatch(g).rejected.some(r => r.uid === 'ua' && r.board === 'prism-rush'), `${sc} pts / ${ln} lines: refused`);
  }
  assert.ok(maxRushScore(923, 230.8) < 3_000_000, 'the longest song\'s bound: under 3 M');
});

// PFIX-B (FABLE REVIEW finding 6) — the award flags only from plausible numbers: the review's forged match gives no flag
test('PFIX-B: a forged PRISM match → no FOUR ON THE FLOOR, no PERFECT CLEAR; the honest ones still flag', () => {
  const f = (opts, tweak, uid = 'ub', more = {}) => {
    const g = { ...finalGame('prism', U, opts), ...more };
    g.results[uid] = { ...g.results[uid], ...tweak };
    return (extractMatch(g).rows[uid] || {}).f || {};
  };
  assert.equal(f({}, { best: 'quad' }).quad, 1, 'an honest four-line best');
  assert.equal(f({}, { pc: 1 }).pc, 1, 'an honest perfect clear');
  assert.ok(!f({}, { best: 'quad', ln: 1 }).quad, 'quad with one line');
  assert.ok(!f({}, { pc: 1, ln: 1 }).pc, 'a perfect clear with one line');
  assert.ok(!f({}, { pc: 5, ln: 9 }).pc, 'more perfect clears than two lines each');
  assert.ok(!f({ mode: 'rush' }, { pc: 3, pn: 8 }, 'ua').pc, 'SCORE RUSH: three perfect clears from eight pieces');
  assert.ok(!f({}, { best: 'quad', pc: 1, pn: 5000 }).quad, 'more pieces than a person can place (90 s, 5 000)');
  assert.ok(!f({}, { best: 'quad', pc: 1, pn: 5000 }).pc);
  // a match that didn't last: out 5 s after GO
  const short = { out: { ub: { at: T0 + 15_000, place: 2, by: 'ua' }, uc: { at: T0 + 100_001, place: 3, by: 'ua' }, ud: { at: T0 + 100_002, place: 4, by: 'ua' } } };
  assert.ok(!f({}, { best: 'quad', pc: 1, pn: 20 }, 'ub', short).quad, 'a five-second match');
  assert.ok(!f({}, { best: 'quad', pc: 1, pn: 20 }, 'ub', short).pc);
  // a SOLO run's forged count (the review: f: { pc: 1 }) — the solo lane's flags pass the same checks
  const solo = { ...finalGame('prism', ['ua'], { mode: 'rush' }) };
  solo.results.ua = { ...solo.results.ua, pc: 4, ln: 3, pn: 12 };
  assert.ok(!((extractMatch(solo).rows.ua || {}).f || {}).pc, 'a solo run: four perfect clears in three lines');
  solo.results.ua = { ...solo.results.ua, pc: 1, ln: 30, pn: 80 };
  assert.equal(((extractMatch(solo).rows.ua || {}).f || {}).pc, 1, 'a solo run\'s real perfect clear stays (Ben: keep it)');
});
