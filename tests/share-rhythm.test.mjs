// SKINS 2A — THE SHARE CARDS: NO PILLS, ONE RHYTHM (the owner, Nov 14 — docs/games/plan.md "SKINS 2A"; docs/progression.md "SHARE TODAY").
//   ONE RHYTHM   every SHARE TODAY section = the name · ONE big result · ONE stat line · ONE art strip at the SAME sizes (js/daily/share.js#RHYTHM)
//   NO PILLS     no rounded capsule left in the share kit: the address's tube frame is gone (ONE straight line + plain lettering — shareAddress)
//   THE DROP     its junk rows draw SOLID FILLED (board.js#SOLID_JUNK); its strip = a crop of the board's top rows (cropRows — PURE)
//   COAST CLEAR  no beam wedge (the lamps stay)
// The pixels: tests/integration/share-same.html (the expected copies + the no-frame check).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RHYTHM, OWN, FOOT, WORD_K } from '../js/daily/share.js';
import { cropRows, STRIP_ROWS, SECTION_H as DROP_H, solidJunk } from '../js/games/drop/share.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const KIT = ['js/daily/share.js', 'js/daily/share-today.js', 'js/games/password/share.js', 'js/games/coastclear/share.js', 'js/games/drop/share.js', 'js/games/kit/share-run.js', 'js/games/prism/share.js'];
const code = p => read(p).split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');   // (the comments may say "pill" — the code may not draw one)

test('ONE RHYTHM: the four pieces stack inside the box with EQUAL gaps (the name · the big result · the stat line · the art strip)', () => {
  const R = RHYTHM;
  // (a text's MIDDLE sits a little above its nominal y, by the font's metrics: the name + the stat ≈ 2 px, the big ≈ 7 % of its size; cap ≈ 0.72 em)
  const box = (y, px, lift) => [y - lift - px * 0.36, y - lift + px * 0.36];
  const name = box(R.nameY, R.namePx, 2.5), big = box(R.bigY, R.bigPx, R.bigPx * 0.07), stat = box(R.statY, R.statPx, 2);
  const gaps = [big[0] - name[1], stat[0] - big[1], R.artY - stat[1]];
  for (const g of gaps) assert.ok(g >= 15 && g <= 24, `a gap of ${g.toFixed(1)}`);
  assert.ok(Math.max(...gaps) - Math.min(...gaps) <= 6, `the gaps are even: ${gaps.map(g => g.toFixed(1))}`);
  assert.ok(R.artY + R.artH <= R.H && name[0] >= 0, 'the strip ends inside the box');
  assert.ok(R.bigPx >= 2 * R.namePx && R.namePx > R.statPx, 'the big result is the big thing; the stat line the smallest');
  assert.ok(WORD_K > 0.8 && WORD_K < 1, 'a WORD result prints a little smaller than a TIME — the same height by eye');
  assert.ok(OWN.nameY < OWN.bigY && OWN.bigY < OWN.statY && OWN.statY < OWN.artY && OWN.artBot < FOOT.lineY && FOOT.lineY < FOOT.y, "a daily's own card keeps the same order over the foot");
});

test('every section is laid out by the SAME numbers: each daily\'s paintSection reads RHYTHM (name · big · stat · art) and its SECTION_H is the rhythm\'s', () => {
  assert.equal(DROP_H, RHYTHM.H);
  for (const p of ['js/games/password/share.js', 'js/games/coastclear/share.js', 'js/games/drop/share.js']) {
    const s = read(p), sec = s.slice(s.indexOf('export function paintSection'));
    assert.match(s, /export const SECTION_H = RHYTHM\.H;/, p);
    for (const k of ['nameY', 'namePx', 'bigY', 'bigPx', 'statY', 'statPx', 'artY', 'artH']) assert.match(sec, new RegExp(`R\\.${k}\\b`), `${p} reads RHYTHM.${k}`);
    assert.doesNotMatch(sec.split('\n/** SHARE')[0], /\b(1[0-9]{2}|[2-9][0-9]{2})px\b/, `${p}: no size of its own in the section`);
  }
  const T = read('js/daily/share-today.js');
  assert.match(T, /const s = Math\.min\(1\.45, each \/ RHYTHM\.H\);/, 'SHARE TODAY scales every section by ONE factor');
});

test('NO PILLS in the share kit: no rounded-rect helper, no roundRect / arcTo frame — the foot is ONE straight line + plain lettering', () => {
  for (const p of KIT) {
    const s = code(p);
    if (p !== 'js/games/password/share.js' && p !== 'js/games/prism/share.js') assert.doesNotMatch(s, /roundRect|arcTo/, `${p} draws no rounded shape`);
  }
  // (THE PASSWORD keeps its rounded TILES — squares, cell × 0.18; the hit tile's mark is a straight bar now, never a capsule)
  const pw = code('js/games/password/share.js');
  assert.equal((pw.match(/rr\(c, /g) || []).length, 3, 'the three tile shapes only');
  assert.doesNotMatch(pw, /cell \* 0\.05\)/);
  // (the board's frame on SHARE YOUR RUN's card: a rounded RECT, r 22 on a 350 × 690 box — not a capsule)
  assert.match(code('js/games/prism/share.js'), /c\.roundRect\(x - 14, y - 14, cw \+ 28, ch \+ 28, 22\)/);
  const kit = read('js/daily/share.js'), foot = kit.slice(kit.indexOf('export function shareAddress'), kit.indexOf('/** a daily\'s OWN card\'s foot'));
  assert.match(foot, /c\.moveTo\(pad, lineY\); c\.lineTo\(W - pad, lineY\);/, 'ONE straight line across the column');
  assert.equal((foot.match(/lineTo\(/g) || []).length, 1);
  // every card's foot is the kit's
  assert.match(read('js/daily/share-today.js'), /shareAddress\(c, look, \{ W \}\);/);
  assert.match(read('js/games/kit/share-run.js'), /shareAddress\(c, card\.look, /);
  for (const p of ['js/games/password/share.js', 'js/games/coastclear/share.js']) assert.match(read(p), /shareFoot\(c, \{ dayNo/, `${p}: the kit's foot (the name is on the card once — never again in the foot)`);
  assert.match(kit, /export function shareFoot\(c, \{ dayNo = null, dim, color, site = SITE, W = SHARE_W, look = 'night' \}\)/);
});

test('COAST CLEAR: the beam wedge is gone (the card + the section); the three lamps stay', () => {
  const s = read('js/games/coastclear/share.js');
  assert.doesNotMatch(code('js/games/coastclear/share.js'), /paintBeam|beam:/);
  assert.equal((s.match(/paintLamps\(c, I, L, look, W \/ 2, /g) || []).length, 2, 'the lamps, centred, on the card + in the section');
});

test("THE DROP: the junk rows draw SOLID FILLED; the strip = the stack's top rows (cropRows — PURE)", () => {
  const b = read('js/games/prism/board.js');
  assert.match(b, /export const SOLID_JUNK = Object\.freeze\(\{ night: Object\.freeze\(\{ fill: '#[0-9a-f]{6}', edge: '#[0-9a-f]{6}' \}\), day: /);
  assert.match(b, /if \(SJ && t === 8\) \{[^}]*ctx\.fillRect\(X, Y, px, px\);[^}]*ctx\.fillRect\(X \+ se, Y \+ se, px - 2 \* se, px - 2 \* se\); return; \}/, 'a filled block with a darker edge — never an outline square');
  const d = read('js/games/drop/share.js');
  assert.match(d, /P\.drawBoardMiddle\(c, box, k, \{ solid: true \}\)/, "the DROP's own card");
  assert.match(d, /look: day \? 'crayon' : 'neon', solid: P\.SOLID_JUNK\[day \? 'day' : 'night'\] \}\)/, "SHARE TODAY's strip");
  assert.match(read('js/games/prism/share.js'), /solid: solid \? SOLID_JUNK\[day \? 'day' : 'night'\] : null \}\)/, 'the card picks the pair by its look — board.js never tests one');
  // the crop
  const row = ch => ch.repeat(10), board = rows => rows.join('');
  assert.deepEqual(cropRows(board(Array.from({ length: 20 }, () => row('8')))), { from: 20 - STRIP_ROWS, to: 20 }, 'a topped-out board: its top rows');
  assert.deepEqual(cropRows(board([row('8'), row('8'), '1100000000'])), { from: 0, to: STRIP_ROWS }, 'a low stack: from the floor');
  assert.deepEqual(cropRows(board([...Array.from({ length: 9 }, () => row('8')), '0003300000'])), { from: 10 - STRIP_ROWS, to: 10 }, "the stack's top row is the strip's top row");
  assert.deepEqual(cropRows(''), { from: 0, to: STRIP_ROWS });
  assert.deepEqual(cropRows(null), { from: 0, to: STRIP_ROWS });
  assert.ok(STRIP_ROWS >= 5 && STRIP_ROWS <= 8, 'a cell stays readable: the strip is 128 tall');
  assert.equal(solidJunk('8808888888'), '8888888888');
});
