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
  assert.deepEqual(EB.pickRows([{ rank: 1, v: 'x' }, null, { rank: 2, v: 7 }]).top.map(r => r.v), [7], 'a row with no number is never shown');
  assert.equal(EB.youLine(12, 88, 'FLOORS'), 'YOU · 12TH · 88 FLOORS');
  assert.equal(EB.youLine(5, 49, 'FLOORS'), 'YOU · 5TH · 49 FLOORS');
  assert.equal(EB.youLine(0, 1234, 'FLOORS'), 'YOU · 1,234 FLOORS', 'no rank known: the score alone');
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(EB.ordinal), ['1ST', '2ND', '3RD', '4TH', '11TH', '12TH', '13TH', '21ST', '22ND', '23RD', '101ST', '111TH']);
  assert.equal(EB.TOP, 3);
});

test('THE OPT-IN: ui/final.js mounts the block ONLY for a cartridge naming END_BOARD (lazy) — every other game\'s frame is unchanged; FREEFALL is the only game on', () => {
  const f = read('js/ui/final.js');
  assert.match(f, /const eb = mod && mod\.END_BOARD && /, 'the frame asks the cartridge');
  assert.match(f, /lazyImport\(import\('\.\/end-board\.js'\), '\.\/end-board\.js'\)/, 'loaded only then — never a static import');
  assert.doesNotMatch(f, /^import [^\n]*end-board/m);
  const on = readdirSync(new URL('../js/games/', import.meta.url), { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(new URL(`../js/games/${d.name}/index.js`, import.meta.url)))
    .filter(d => /export const END_BOARD\b/.test(read(`js/games/${d.name}/index.js`))).map(d => d.name);
  assert.deepEqual(on, ['freefall'], 'FREEFALL alone opts in');
  assert.match(read('js/games/freefall/index.js'), /export const END_BOARD = Object\.freeze\(\{ b: BOARD, word: 'FLOORS', avg: true \}\);/);
  assert.match(read('js/games/contract.js'), /END_BOARD: 'object',/, 'written into THE CONTRACT');
});

test('THE READS stay small: ONE board fetch (the all-time top 100) a session + YOUR TABLE only once FRIENDS is ticked — both kept; the FRIENDS tick is ONE remembered setting (wrapped storage); the AVG is each row\'s STORED average', () => {
  const s = read('js/ui/end-board.js');
  assert.match(s, /A\.board\(b, 'all', \{ n: 100 \}\)/);
  assert.ok(s.includes('if (!boards.has(b)) boards.set(b,') && s.includes('if (!tables.has(b)) tables.set(b,'), 'each read once a session (a failed one may be asked again)');
  assert.ok(s.includes("export const FRIENDS_KEY = 'ns:endb:fr';") && /try \{ return localStorage\.getItem\(FRIENDS_KEY\) === '1'; \} catch/.test(s) && /try \{ localStorage\.setItem\(FRIENDS_KEY/.test(s));
  assert.ok(s.includes("AV.avgLabel(r.av != null && Number.isFinite(Number(r.av)) ? r.av : null)"), 'the stored average — a dash under 5 runs (core/board-avg.js)');
  assert.ok(s.includes("setFriends(false, false, 'NO FRIENDS YET')"), 'no friends yet: the line, the world stays');
  assert.doesNotMatch(s, /\b999px\b|border-radius/, 'no pill');
  const css = read('css/components.css');
  assert.match(css, /\.eb-tick::before \{ content: ''; position: absolute; inset: -7px -8px; \}/, 'the tick\'s tap area: 44 pt tall');
});
