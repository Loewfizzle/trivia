// F5B — THE END-SCREEN BOARD (js/ui/end-board.js — the podium's ONE shared leaderboard block, a per-game OPT-IN: a cartridge's END_BOARD).
// The pure half here (the rows it picks, the YOU line, the ordinals) + the wiring: ui/final.js mounts it ONLY for a cartridge that names
// END_BOARD (every other game's end screen is exactly as it was), FREEFALL is the only game on, the reads stay small.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const EB = await import(new URL('../js/ui/end-board.js', import.meta.url));

test('the rows: the TOP 3 + YOU only when you are not among them — the YOU line "YOU · 12TH · 88 FLOORS"', () => {
  const rows = [5, 4, 3, 2, 1].map((v, i) => ({ rank: i + 1, v: v * 10 }));
  assert.deepEqual(EB.pickRows(rows).top.map(r => r.rank), [1, 2, 3]);
  assert.equal(EB.pickRows(rows).you, null, 'not on the board: no YOU line');
  const meIn = rows.map(r => ({ ...r, me: r.rank === 2 }));
  assert.equal(EB.pickRows(meIn).you, null, 'in the top 3: your row glows there — no line');
  const meOut = rows.map(r => ({ ...r, me: r.rank === 5 }));
  assert.equal(EB.pickRows(meOut).you.rank, 5);
  assert.deepEqual(EB.pickRows([]), { top: [], you: null });
  // F5C — a SHARED 3rd place (the 8-phone match E2E): 4th in the list but ranked 3rd → in the top 3 (the last slot of that place), no YOU line
  const tie = [{ uid: 'a', rank: 1, v: 60 }, { uid: 'b', rank: 2, v: 55 }, { uid: 'c', rank: 3, v: 50 }, { uid: 'me', rank: 3, v: 50, me: true }, { uid: 'e', rank: 5, v: 49 }];
  assert.deepEqual(EB.pickRows(tie).top.map(r => r.uid), ['a', 'b', 'me']); assert.equal(EB.pickRows(tie).you, null);
  assert.equal(EB.pickRows(tie.map(r => ({ ...r, me: r.uid === 'e' }))).you.uid, 'e', 'a 5th place still gets the line');
  assert.deepEqual(EB.pickRows([{ rank: 1, v: 'x' }, null, { rank: 2, v: 7 }]).top.map(r => r.v), [7], 'a row with no number is never shown');
  assert.equal(EB.youLine(12, 88, 'FLOORS'), 'YOU · 12TH · 88 FLOORS');
  assert.equal(EB.youLine(5, 49, 'FLOORS'), 'YOU · 5TH · 49 FLOORS');
  assert.equal(EB.youLine(0, 1234, 'FLOORS'), 'YOU · 1,234 FLOORS', 'no rank known: the score alone');
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(EB.ordinal), ['1ST', '2ND', '3RD', '4TH', '11TH', '12TH', '13TH', '21ST', '22ND', '23RD', '101ST', '111TH']);
  assert.equal(EB.TOP, 3);
});

test('THE OPT-IN: ui/final.js mounts the block ONLY for a cartridge naming END_BOARD (lazy) — every other game\'s frame is unchanged', () => {
  const f = read('js/ui/final.js');
  assert.match(f, /const ebCfg = mod && mod\.END_BOARD, ebThis = /, 'the frame asks the cartridge');
  assert.match(f, /const eb = ebThis && g && /);
  assert.match(f, /lazyImport\(import\('\.\/end-board\.js'\), '\.\/end-board\.js'\)/, 'loaded only then — never a static import');
  assert.doesNotMatch(f, /^import [^\n]*end-board/m);
  const on = readdirSync(new URL('../js/games/', import.meta.url), { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(new URL(`../js/games/${d.name}/index.js`, import.meta.url)))
    .filter(d => /export const END_BOARD\b/.test(read(`js/games/${d.name}/index.js`))).map(d => d.name);
  assert.deepEqual(on.sort(), ['freefall', 'highrise', 'jaywalk', 'overclock', 'prism'], 'THE END-BOARD SWITCH-ON (Nov 27): the five playable solo games opt in — never HOLD\'EM');
  assert.match(read('js/games/freefall/index.js'), /export const END_BOARD = Object\.freeze\(\{ b: BOARD, word: 'FLOORS', avg: true \}\);/);
  assert.match(read('js/games/contract.js'), /END_BOARD: 'object',/, 'written into THE CONTRACT');
});

test('THE READS stay small: ONE board fetch (the all-time top 100) a session + YOUR TABLE only once FRIENDS is ticked — both kept; the FRIENDS tick is ONE remembered setting (wrapped storage); the AVG is each row\'s STORED average', () => {
  const s = read('js/ui/end-board.js');
  assert.match(s, /A\.board\(b, 'all', \{ n: 100 \}\)/);
  assert.ok(s.includes('if (!boards.has(b)) boards.set(b,') && s.includes('if (!tables.has(b)) tables.set(b,'), 'each read once a session (a failed one may be asked again)');
  assert.ok(s.includes("export const FRIENDS_KEY = 'ns:endb:fr';") && /try \{ return localStorage\.getItem\(FRIENDS_KEY\) === '1'; \} catch/.test(s) && /try \{ localStorage\.setItem\(FRIENDS_KEY/.test(s));
  assert.ok(s.includes("AV.avgLabel(r.av != null && Number.isFinite(Number(r.av)) ? r.av : null)"), 'the stored average — a dash under 5 runs (core/board-avg.js)');
  assert.ok(s.includes("if (friends && !R.some(r => !r.me)) { const none = R.friends === 0; if (none) writeFr(false); setFriends(false, false, byTap ? (none ? 'NO FRIENDS YET' : 'NO FRIENDS ON THIS BOARD YET') : ''); return; }"), 'no friends yet: the world stays — FIX C S11: REMEMBERED off (\'0\') only with NO friends at all (the server\'s count); none on this board = this screen only; the line only on the tap');
  assert.match(read('api/_lib/friends.js'), /return \{ b: def\.id, rows, friends: pids\.length - 1 \};/);
  // FIX C — S10: a counted run's NEW BEST (the server's `pbs`) drops that board's kept reads + every block showing it reads again
  assert.ok(s.includes("Q.onOutcome((k, o) => newBests(o))") && s.includes('boards.set(p.b, boards.get(p.b).then(R => patchMine(R, p.b, Number(p.v)))') && s.includes('tables.delete(p.b);'), 'S10: the outcome\'s pbs → the world list PATCHED (a refetch is stale behind the caches), YOUR TABLE read again');
});

test('FIX C — S10 patchMine (PURE): YOUR row takes the new best, the list is ranked again (a tie shares its place); no row of yours = unchanged', async () => {
  const { patchMine } = await import('../js/ui/end-board.js'), s = read('js/ui/end-board.js');   // (`s`: the block's own checks below ride here)
  const R = [{ id: 'a', v: 120, rank: 1 }, { id: 'b', v: 90, rank: 2 }, { id: 'me', v: 60, rank: 3, me: true }, { id: 'c', v: 50, rank: 4 }];
  assert.deepEqual(patchMine(R, 'freefall-solo', 130).map(r => [r.id, r.rank, r.v]), [['me', 1, 130], ['a', 2, 120], ['b', 3, 90], ['c', 4, 50]]);
  assert.deepEqual(patchMine(R, 'freefall-solo', 90).map(r => [r.id, r.rank]), [['a', 1], ['me', 2], ['b', 2], ['c', 4]]);
  const none = R.filter(r => !r.me); assert.equal(patchMine(none, 'freefall-solo', 500), none);
  assert.doesNotMatch(s, /\b999px\b|border-radius/, 'no pill');
  const css = read('css/components.css');
  assert.match(css, /\.eb-tick::before \{ content: ''; position: absolute; inset: -7px -8px; \}/, 'the tick\'s tap area: 44 pt tall');
});
