// SKINS 2A — THE SHARE CARDS: NO PILLS, ONE RHYTHM (the owner, Nov 14 — docs/games/plan.md "SKINS 2A"; docs/progression.md "SHARE TODAY").
//   ONE RHYTHM   every SHARE TODAY section = the name · ONE big result · ONE stat line · ONE art strip at the SAME sizes (js/daily/share.js#RHYTHM)
//   NO PILLS     no rounded capsule left in the share kit: the address's tube frame is gone (ONE straight line + plain lettering — shareAddress)
//   THE DROP     its junk rows draw SOLID FILLED (board.js#SOLID_JUNK); its strip = a crop of the board's top rows (cropRows — PURE)
//   COAST CLEAR  no beam wedge (the lamps stay)
// SKINS 2B (the owner, Nov 14 + his 11:16 am add-on) — THE SHARE CARD's ONE RULE: (1) the daily's NAME, the same small size for all — IT CARRIES
//   THE RESULT (green made · red failed · THE DROP white; no win word, no name-swap, no extra lost word) · (2) ONE big TIME, white, the same
//   size for all · (3) ONE grey stat line · (4) the art strip, a little
//   taller (THE PASSWORD's tiles without the doors, COAST CLEAR's 3 lamps, THE DROP's top 8 rows) — the three text pieces = the KIT's painters.
// The pixels: tests/integration/share-same.html (the expected copies + the no-frame check + the name check).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RHYTHM, OWN, FOOT, INK, MADE, FAILED, nameInk } from '../js/daily/share.js';
import { cropRows, STRIP_ROWS, SECTION_H as DROP_H, solidJunk } from '../js/games/drop/share.js';
import { partsOf } from '../js/games/coastclear/share.js';
import { contrast } from '../js/games/prism/skin-kit.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const KIT = ['js/daily/share.js', 'js/daily/share-today.js', 'js/games/password/share.js', 'js/games/coastclear/share.js', 'js/games/drop/share.js', 'js/games/kit/share-run.js', 'js/games/prism/share.js'];
const code = p => read(p).split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');   // (the comments may say "pill" — the code may not draw one)

test('ONE RHYTHM: the four pieces stack inside the box with EQUAL gaps (the name · the big result · the stat line · the art strip)', () => {
  const R = RHYTHM;
  // (a text's MIDDLE sits a little above its nominal y, by the font's metrics: the name + the stat ≈ 2 px, the big ≈ 7 % of its size; cap ≈ 0.72 em)
  const box = (y, px, lift) => [y - lift - px * 0.36, y - lift + px * 0.36];
  const name = box(R.nameY, R.namePx, -0.5), big = box(R.bigY, R.bigPx, R.bigPx * 0.07), stat = box(R.statY, R.statPx, 2);
  const gaps = [big[0] - name[1], stat[0] - big[1], R.artY - stat[1]];
  for (const g of gaps) assert.ok(g >= 15 && g <= 24, `a gap of ${g.toFixed(1)}`);
  assert.ok(Math.max(...gaps) - Math.min(...gaps) <= 6, `the gaps are even: ${gaps.map(g => g.toFixed(1))}`);
  assert.ok(R.artY + R.artH <= R.H && name[0] >= 0, 'the strip ends inside the box');
  assert.ok(R.bigPx >= 2 * R.namePx && R.namePx > R.statPx, 'the big result is the big thing; the stat line the smallest');
  assert.ok(R.bigPx < 92 && R.bigPx >= 80, "the big TIME is a bit smaller than THE DROP's was (92)");
  assert.ok(R.artH > 128 && R.artH <= 160, 'the art strip is a little taller than it was (128)');
  assert.ok(OWN.nameY < OWN.bigY && OWN.bigY < OWN.statY && OWN.statY < OWN.artY && OWN.artBot < FOOT.lineY && FOOT.lineY < FOOT.y, "a daily's own card keeps the same order over the foot");
});

test('every section is laid out by the SAME numbers: each daily\'s paintSection reads RHYTHM (name · big · stat · art) and its SECTION_H is the rhythm\'s', () => {
  assert.equal(DROP_H, RHYTHM.H);
  for (const p of ['js/games/password/share.js', 'js/games/coastclear/share.js', 'js/games/drop/share.js']) {
    const s = read(p), sec = s.slice(s.indexOf('export function paintSection'));
    assert.match(s, /export const SECTION_H = RHYTHM\.H;/, p);
    for (const k of ['nameY', 'namePx', 'bigY', 'bigPx', 'statY', 'statPx', 'artY', 'artH']) assert.match(sec, new RegExp(`R\\.${k}\\b`), `${p} reads RHYTHM.${k}`);
    // (SKINS 2B) the three text pieces are the KIT's — the same name, time and stat line in every section
    assert.match(sec, /paintName\(c, look, NAME, W \/ 2, R\.nameY, R\.namePx, [^;]+\);/, `${p}: the kit's name`);
    assert.match(sec, /paintBig\(c, look, [^;]+, W \/ 2, R\.bigY, R\.bigPx\);/, `${p}: the kit's big time`);
    assert.match(sec, /paintStat\(c, look, [^;]+, W \/ 2, R\.statY, R\.statPx, /, `${p}: the kit's stat line`);
    assert.doesNotMatch(code(p), /paintSign|paintHead|WORD_K|doubledName|HEAD_IN|glowText/, `${p}: no sign, headline or win word of its own`);
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
  assert.deepEqual(cropRows(board([...Array.from({ length: 11 }, () => row('8')), '0003300000'])), { from: 12 - STRIP_ROWS, to: 12 }, "the stack's top row is the strip's top row");
  assert.deepEqual(cropRows(''), { from: 0, to: STRIP_ROWS });
  assert.deepEqual(cropRows(null), { from: 0, to: STRIP_ROWS });
  assert.equal(STRIP_ROWS, 8, 'the top 8 rows (SKINS 2B — it was 6)');
  assert.equal(solidJunk('8808888888'), '8888888888');
});

test('SKINS 2B — THE ONE RULE: the NAME carries the result (green made · red failed · white for none); the time white, the stat line grey — no result word', () => {
  assert.equal(INK.night.name, '#ffffff');
  for (const [look, bg] of [['night', '#0a0618'], ['day', '#c8e2ff']]) {
    const K = INK[look];
    assert.ok(contrast(K.ink, bg) >= 7, `${look}: the big time reads`);
    for (const k of ['name', 'made', 'failed', 'stat']) assert.ok(contrast(K[k], bg) >= 4.5, `${look}: ${k} reads (${contrast(K[k], bg).toFixed(2)})`);
    assert.equal(nameInk(look, MADE), K.made); assert.equal(nameInk(look, FAILED), K.failed); assert.equal(nameInk(look), K.name);
    // green is green, red is red — in both palettes
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const [r1, g1, b1] = rgb(K.made), [r2, g2, b2] = rgb(K.failed);
    assert.ok(g1 > r1 + 40 && g1 > b1 + 25, `${look}: made is green`);
    assert.ok(r2 > g2 + 70 && r2 > b2 + 50, `${look}: failed is red`);
  }
  const kit = read('js/daily/share.js');
  assert.match(kit, /export function paintName\(c, look, name, cx, y, px, fitW = 0, result = null\)/);
  assert.match(kit, /export function paintStat\(c, look, text, cx, y, px, fitW = 0\)/);
  const stat = kit.slice(kit.indexOf('export function paintStat'), kit.indexOf('/**\n * THE FOOT'));
  assert.match(stat, /c\.fillStyle = inkOf\(look\)\.stat;/, 'the stat line is ONE grey — never a coloured word');
  assert.doesNotMatch(stat, /red|failed|made/);
  // a MODEST glow: the name's blur stays under half its size (WELCOME IN's headline glowed at 0.375 × 92 px)
  for (const m of kit.slice(kit.indexOf('export function paintName'), kit.indexOf('/** (2) THE BIG TIME')).matchAll(/shadowBlur = p \* (?:\(result \? ([\d.]+) : ([\d.]+)\)|([\d.]+))/g)) for (const v of m.slice(1).filter(Boolean)) assert.ok(Number(v) <= 0.55, `a blur of ${v} × the name's size`);
  // COAST CLEAR: a clear = MADE · its time · its line; a caught run = FAILED · the time its line ends with · the spots alone (no CAUGHT word)
  assert.deepEqual(partsOf({ head: 'COAST CLEAR', caught: false, time: '2:12', line: '1 SPOTTED · +30 s', spots: 1 }), { result: MADE, big: '2:12', stat: '1 SPOTTED · +30 s' });
  assert.deepEqual(partsOf({ head: 'CAUGHT', caught: true, time: null, line: '3 SPOTTED · 1:58', spots: 3 }), { result: FAILED, big: '1:58', stat: '3 SPOTTED' });
  assert.equal(partsOf({ head: 'CAUGHT', caught: true, time: null, line: '3 SPOTTED · 12:07', spots: 3 }).big, '12:07');
  assert.deepEqual(partsOf(null), { result: MADE, big: '', stat: '' });
  const cc = code('js/games/coastclear/share.js');
  assert.doesNotMatch(cc.slice(cc.indexOf('export function renderShare')), /I\.head/, "COAST CLEAR's card never prints its result word");
  // THE PASSWORD: the stat line = the guesses alone; the name's colour = both doors opened or not; the strip = the tiles only
  const pw = read('js/games/password/share.js');
  assert.match(pw, /export const resultOf = run => \(scoreOf\(run\)\.doors === DOORS \? MADE : FAILED\);/);
  assert.match(pw, /export const statOf = run => guessesLine\(run\);/);
  assert.doesNotMatch(code('js/games/password/share.js'), /HEAD_OUT|HEAD_IN|LOCKED OUT|WELCOME IN/);
  const sec = pw.slice(pw.indexOf('export function paintSection'));
  assert.doesNotMatch(sec, /door\(|paintDoor|paintDoors/, "no doors in SHARE TODAY's strip (the daily's own card keeps them)");
  assert.match(pw, /export const TILE_MAX = (4[0-9]|5[0-9]);/, 'the tiles are bigger (they were ≤ 36)');
  // THE DROP: no win / lose — its name stays white
  const dr = read('js/games/drop/share.js');
  assert.match(dr, /paintName\(c, look, NAME, W \/ 2, R\.nameY, R\.namePx, cw\);/, 'no result passed: white');
  // every daily's OWN card draws the same three pieces
  for (const p of ['js/games/password/share.js', 'js/games/coastclear/share.js']) {
    const own = read(p).slice(read(p).indexOf('export function renderShare'), read(p).indexOf('export const SECTION_H'));
    assert.match(own, /paintName\(c, look, NAME, W \/ 2, OWN\.nameY, OWN\.namePx, W - 120, [^;]+\);/, p);
    assert.match(own, /paintBig\(c, look, [^;]+, W \/ 2, OWN\.bigY, OWN\.bigPx\);/, p);
    assert.match(own, /paintStat\(c, look, [^;]+, W \/ 2, OWN\.statY, OWN\.statPx, /, p);
  }
});
