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
  // (PFIX-3 — Ben, Nov 14: the ART STRIP's height is each daily's own — THE DROP's board taller, COAST CLEAR's lamps shorter, THE PASSWORD's
  //  the rhythm's (grown for a tall grid); the name, the big time and the stat line are the SAME numbers in every section)
  assert.equal(DROP_H, RHYTHM.H - RHYTHM.artH + 228);
  for (const p of ['js/games/password/share.js', 'js/games/coastclear/share.js', 'js/games/drop/share.js']) {
    const s = read(p), sec = s.slice(s.indexOf(s.includes('export function stripOf') ? 'export function stripOf' : 'export function paintSection'));
    assert.match(s, p.includes('password') ? /export const SECTION_H = RHYTHM\.H;/ : /export const SECTION_H = RHYTHM\.H - RHYTHM\.artH \+ STRIP_H;/, p);
    for (const k of ['nameY', 'namePx', 'bigY', 'bigPx', 'statY', 'statPx', 'artY']) assert.match(sec, new RegExp(`R\\.${k}\\b`), `${p} reads RHYTHM.${k}`);
    // (SKINS 2B) the three text pieces are the KIT's — the same name, time and stat line in every section
    assert.match(sec, /paintName\(c, look, NAME, W \/ 2, R\.nameY, R\.namePx, [^;]+\);/, `${p}: the kit's name`);
    assert.match(sec, /paintBig\(c, look, [^;]+, W \/ 2, R\.bigY, R\.bigPx(, [^;]+)?\);/, `${p}: the kit's big score`);
    assert.match(sec, /paintStat\(c, look, [^;]+, W \/ 2, R\.statY, R\.statPx, /, `${p}: the kit's stat line`);
    assert.doesNotMatch(code(p), /paintSign|paintHead|WORD_K|doubledName|HEAD_IN|glowText/, `${p}: no sign, headline or win word of its own`);
    assert.doesNotMatch(sec.split('\n/** SHARE')[0], /\b(1[0-9]{2}|[2-9][0-9]{2})px\b/, `${p}: no size of its own in the section`);
  }
  const T = read('js/daily/share-today.js');
  assert.match(T, /s = Math\.min\(1\.45, avail \/ hs\.reduce\(\(a, h\) => a \+ h, 0\)\);/, 'SHARE TODAY scales every section by ONE factor (fitted to the sum of their natural heights)');
  assert.match(T, /M\.S\.paintSection\(c, \{ \.\.\.M\.input\(share\[sec\.id\]\), look, W: W \/ s, H: box \/ s, k: s \}\);/, 'every section at the same scale');
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
  assert.match(kit, /export function shareFoot\(c, \{ dayNo = null, note = null, dim, color, site = SITE, W = SHARE_W, look = 'night' \}\)/);   // (PFIX-3: `note` — THE DROP's date in the Nº's place)
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
  assert.match(d, /P\.drawBoardMiddle\(c, BOARD_BOX, \{ look, board: I\.b \|\| null \}, \{ solid: true \}\)/, "the DROP's own card");
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
  assert.match(kit, /export function paintName\(c, look, name, cx, y, px, fitW = 0, result = null, ink = null\)/);   // (HIGH RISE DAILY B: + `ink` — THE BIG FIVE's names in their ticket's ink)
  assert.match(kit, /export function paintStat\(c, look, text, cx, y, px, fitW = 0\)/);
  const stat = kit.slice(kit.indexOf('export function paintStat'), kit.indexOf('/**\n * THE FOOT'));
  assert.match(stat, /c\.fillStyle = inkOf\(look\)\.stat;/, 'the stat line is ONE grey — never a coloured word');
  assert.doesNotMatch(stat, /red|failed|made/);
  // a MODEST glow: the name's blur stays under half its size (WELCOME IN's headline glowed at 0.375 × 92 px)
  for (const m of kit.slice(kit.indexOf('export function paintName'), kit.indexOf('/** (2) THE BIG SCORE')).matchAll(/shadowBlur = p \* (?:\(result \? ([\d.]+) : ([\d.]+)\)|([\d.]+))/g)) for (const v of m.slice(1).filter(Boolean)) assert.ok(Number(v) <= 0.55, `a blur of ${v} × the name's size`);
  // COAST CLEAR: a clear = MADE · its time · its line; a caught run = FAILED · the time its line ends with · the spots alone (no CAUGHT word)
  assert.deepEqual(partsOf({ head: 'COAST CLEAR', caught: false, time: '2:12', line: '1 SPOTTED · +30 s', spots: 1 }), { result: MADE, big: '2:12', stat: '1 SPOTTED · +30 s' });
  assert.deepEqual(partsOf({ head: 'CAUGHT', caught: true, time: null, line: '3 SPOTTED · 1:58', spots: 3 }), { result: FAILED, big: '1:58', stat: '3 SPOTTED' });
  assert.equal(partsOf({ head: 'CAUGHT', caught: true, time: null, line: '3 SPOTTED · 12:07', spots: 3 }).big, '12:07');
  assert.deepEqual(partsOf(null), { result: MADE, big: '', stat: '' });
  const cc = code('js/games/coastclear/share.js');
  assert.doesNotMatch(cc.slice(cc.indexOf('export function renderShare')), /I\.head/, "COAST CLEAR's card never prints its result word");
  // THE PASSWORD: the stat line = the TIME alone (FIXES R3 — the guesses are its big score); the name's colour = both doors opened or not; the strip = the tiles only
  const pw = read('js/games/password/share.js');
  assert.match(pw, /export const resultOf = run => \(scoreOf\(run\)\.doors === DOORS \? MADE : FAILED\);/);
  assert.match(pw, /export const statOf = run => \(byGuesses\(\) \? timeOf\(run\) : guessesLine\(run\)\);/);
  // (HIGH RISE DAILY B — THE BIG FIVE, text only: a failed run's fail word IS its big line — the one place LOCKED OUT is drawn: fiveLine; never THE ONE RULE's section / own card)
  const pwCode = code('js/games/password/share.js'), five = pwCode.indexOf('export const fiveLine');
  assert.doesNotMatch(five < 0 ? pwCode : pwCode.slice(0, five) + pwCode.slice(pwCode.indexOf('\n', five)), /HEAD_OUT|HEAD_IN|LOCKED OUT|WELCOME IN/);
  const sec = pw.slice(pw.indexOf('export function paintSection'));
  assert.doesNotMatch(sec, /door\(|paintDoor|paintDoors/, "no doors in SHARE TODAY's strip (the daily's own card keeps them)");
  assert.match(pw, /export const TILE_MAX = (4[0-9]|5[0-9]), TILE_FLOOR = 22;/, 'the tiles are bigger (they were ≤ 36) + never under the floor');
  // THE DROP: no win / lose — its name stays white
  const dr = read('js/games/drop/share.js');
  assert.match(dr, /paintName\(c, look, NAME, W \/ 2, R\.nameY, R\.namePx, cw\);/, 'no result passed: white');
  // every daily's OWN card draws the same three pieces
  for (const p of ['js/games/password/share.js', 'js/games/coastclear/share.js']) {
    const own = read(p).slice(read(p).indexOf('export function renderShare'), read(p).indexOf('export const SECTION_H'));
    assert.match(own, /paintName\(c, look, NAME, W \/ 2, OWN\.nameY, OWN\.namePx, W - 120, [^;]+\);/, p);
    assert.match(own, /paintBig\(c, look, [^;]+, W \/ 2, OWN\.bigY, OWN\.bigPx(, [^;]+)?\);/, p);
    assert.match(own, /paintStat\(c, look, [^;]+, W \/ 2, OWN\.statY, OWN\.statPx, /, p);
  }
});

test("THE ADD-ON (Ben, Nov 14 11:25 am) — THE PASSWORD: each room ONE centred column on its own card; SHARE TODAY's tiles never under the floor — a tall grid makes its strip grow", async () => {
  const PW = await import('../js/games/password/share.js');
  const { HIT: H, NEAR: N, MISS: M } = await import('../js/games/password/logic.js');
  const door = (state, rows) => ({ state, marks: Array.from({ length: rows }, () => [M, N, H, M, M]), guesses: new Array(rows).fill('') });
  const run = (a, b) => ({ done: true, door: 1, startedAt: 1000, finishedAt: 175000, doors: [door(a[0], a[1]), door(b[0], b[1])] });
  const short = run(['solved', 3], ['solved', 2]), tall = run(['solved', 2], ['failed', 6]), front = run(['failed', 6], ['open', 0]);
  // THE STRIP: short grids fill the rhythm's strip; a six-row grid stops at the FLOOR (22 px on the card at any section scale) and the strip grows
  const s1 = PW.stripOf(short, 1080, 1);
  assert.ok(s1.cell > 36 && s1.cell <= PW.TILE_MAX && s1.stripH === RHYTHM.artH, `short: ${s1.cell.toFixed(1)}-px tiles in the rhythm's strip`);
  assert.equal(PW.sectionH({ run: short, W: 1080, k: 1 }), RHYTHM.H);
  for (const k of [1.45, 1, 0.94, 0.8]) for (const r of [tall, front]) {
    const T = PW.stripOf(r, 1080 / k, k);
    assert.ok(T.cell * k >= PW.TILE_FLOOR - 1e-9, `k ${k}: ${(T.cell * k).toFixed(2)} px on the card — never a sliver`);
    assert.ok(T.stripH >= T.gridH - 1e-9, 'the strip holds the whole grid');
    assert.equal(PW.sectionH({ run: r, W: 1080 / k, k }), RHYTHM.H - RHYTHM.artH + T.stripH);
  }
  assert.ok(PW.sectionH({ run: tall, W: 1080, k: 1 }) > RHYTHM.H, 'a tall grid grows its section (readability beats equal strip heights)');
  // THE OWN CARD: paintRooms — each room's door + label + grid share ONE centre; both rooms start at the same top
  const calls = [];
  // (a canvas WITH letterSpacing — `has`: the kit's spacedText then prints a label in ONE fillText, as a current browser does)
  const ctx = new Proxy({}, { has: () => true, get: (_, k) => (k === 'measureText' ? () => ({ width: 100 }) : (...a) => { calls.push([k, ...a]); }), set: (_, k, v) => { calls.push(['set', k, v]); return true; } });
  PW.paintRooms(ctx, tall, PW.tokens('night'), 'night', 540, 600);
  const G = PW.ROOMS, gw = 5 * G.cell + 4 * G.gap, mids = [540 - (gw + G.colGap) / 2, 540 + (gw + G.colGap) / 2];
  const labels = calls.filter(c => c[0] === 'fillText');
  assert.deepEqual(labels.map(l => l[1]), ['THE FRONT DOOR', 'THE BACK ROOM']);
  labels.forEach((l, i) => { assert.ok(Math.abs(l[2] - G.ls / 2 - mids[i]) < 1e-6, `${l[1]} is centred on its own column`); assert.equal(l[3], labels[0][3], 'the labels share one line'); });
  const doors = calls.filter(c => c[0] === 'translate');
  assert.equal(doors.length, 2);
  doors.forEach((d, i) => { assert.ok(Math.abs(d[1] + 34 * G.S / 2 - mids[i]) < 1e-6, 'the door is centred over its column'); assert.equal(d[2], 600, 'both columns start at the same top'); });
  // a label never reaches into the other column: its widest (14 letters at 24 px + spacing) is narrower than its grid, and the gap is even
  assert.ok(14 * (G.label * 0.62 + G.ls) < gw && G.colGap >= 80);
  // the rooms fit the card's art box even at six rows; a room never played = its door + label alone
  assert.ok(PW.roomsH(tall) <= OWN.artBot - OWN.artY, `a six-row room fits (${PW.roomsH(tall)} of ${OWN.artBot - OWN.artY})`);
  assert.ok(PW.roomsH(short) < PW.roomsH(tall));
  const src = read('js/games/password/share.js');
  assert.match(src, /if \(d && d\.marks\.length\) grid\(c, d\.marks, mid - gw \/ 2, top \+ roomsHead\(\), G\.cell, G\.gap, L\);/, 'every grid starts at the same y under its own label');
  assert.doesNotMatch(src, /paintDoors|xs: \[250, 650\]/, 'no label hanging beside a door');
  assert.match(src, /c\.fillStyle = st === 'open' \? \(look === 'day' \? '#1f7a45' : L\.good\) : st === 'on' \? L\.doorOn : st === 'held' \? \(L\.heldInk \|\| L\.doorHeld\) : L\.faint;/, "a held room's label stays red (PFIX-3: by day the solid dark red — >= 4.5:1 on the sky)");
});

// ---------------------------------------------------------------- PFIX-3 (FABLE REVIEW 2's share-card fixes — the pure halves; the pixels: tests/integration/share-same.html)
test('PFIX-3 — S10, LETTER-SPACING BY HAND: ONE helper (spacedText / spacedWidth) — no share file sets canvas letterSpacing itself; without the property a line is drawn letter by letter, as wide and as centred as the tracked one', async () => {
  const K = await import('../js/daily/share.js');
  for (const p of [...KIT, 'js/games/overclock/share.js']) {
    const c = code(p);
    if (p === 'js/daily/share.js') assert.equal((c.match(/c\.letterSpacing = /g) || []).length, 2, 'only inside the helper (spacedWidth + spacedText)');
    else assert.doesNotMatch(c, /letterSpacing/, `${p}: every tracked line goes through the kit's helper`);
  }
  // a canvas WITHOUT letterSpacing (an iPhone before iOS 18.4): every letter 10 px wide
  const calls = [];
  const old = { textAlign: 'center', measureText: t => ({ width: 10 * [...String(t)].length }), fillText: (t, x, y) => calls.push([t, x, y]), strokeText: (t, x, y) => calls.push(['s' + t, x, y]), save() {}, restore() {} };
  assert.equal(K.spacedWidth(old, 'ABCD', 5), 60, 'four letters + a gap after each (the trailing one too — what the canvas measures)');
  K.spacedText(old, 'ABCD', 500 + 2.5, 80, 5);                       // (the callers' own half-gap shift)
  assert.deepEqual(calls.map(c => c[0]), ['A', 'B', 'C', 'D']);
  assert.deepEqual(calls.map(c => c[1]), [472.5, 487.5, 502.5, 517.5], 'letter by letter from the left');
  const inkMid = (calls[0][1] + calls[3][1] + 10) / 2;
  assert.equal(inkMid, 500, 'the INK is centred on the card\'s centre line (it sat 4–8 px right, and the names shrank)');
  calls.length = 0; old.textAlign = 'left';
  K.spacedText(old, 'AB', 100, 80, 6);
  assert.deepEqual(calls.map(c => c[1]), [100, 116]);
  // a canvas WITH it: ONE call, the property set
  const now = { textAlign: 'center', letterSpacing: '0px', measureText: () => ({ width: 77 }), fillText: (t, x, y) => calls.push([t, x, y]) };
  calls.length = 0;
  K.spacedText(now, 'ABCD', 502.5, 80, 5);
  assert.deepEqual(calls, [['ABCD', 502.5, 80]]); assert.equal(now.letterSpacing, '5px');
  assert.equal(K.spacedWidth(now, 'ABCD', 5), 77);
  // the tests' switch: by hand even where the canvas could
  K.forceManualSpacing(true); calls.length = 0;
  K.spacedText({ ...old, letterSpacing: '0px', textAlign: 'left' }, 'AB', 0, 0, 4);
  K.forceManualSpacing(false);
  assert.deepEqual(calls.map(c => c[0]), ['A', 'B']);
});

test('PFIX-3 — S7, COAST CLEAR\'s LAMPS: centred on their INK, never wider than the column (SHARE TODAY with 2 + 3 dailies, its own card)', async () => {
  const CC = await import('../js/games/coastclear/share.js');
  const { x0, x1 } = CC.LAMP_INK;
  // three lamps at scale S: the ink runs from the first lamp's bulb to the last lamp's cone tip
  const S = 6, gap = S * 8.5, calls = [];
  const ctx = new Proxy({}, { get: (_, k) => (...a) => { calls.push([k, ...a]); return undefined; }, set: () => true });
  CC.paintLamps(ctx, { spots: 1 }, CC.tokens('night'), 'night', 540, 100, S, gap);
  const xs = calls.filter(c => c[0] === 'translate').map(c => c[1]);
  assert.equal(xs.length, 3);
  const left = xs[0] + x0 * S, right = xs[2] + x1 * S;
  assert.ok(Math.abs((left + right) / 2 - 540) < 1e-6, `the ink's middle is the centre line (${((left + right) / 2).toFixed(2)})`);
  assert.ok(Math.abs(right - left - CC.lampsWidth(S, gap)) < 1e-6);
  // the cap: the scale the column allows — at 1.45× (two dailies) the lamps shrink to fit, at ~1× (three) the strip's height decides
  for (const k of [1.45, 0.97]) {
    const W = 1080 / k, cw = W - 2 * RHYTHM.COL, s = Math.min((CC.STRIP_H - 12) / 22, CC.lampScale(cw, 8.5));
    assert.ok(CC.lampsWidth(s, s * 8.5) <= cw + 1e-6, `${k}×: the lamps fit the column (${(CC.lampsWidth(s, s * 8.5) * k).toFixed(0)} of ${(cw * k).toFixed(0)} px on the card)`);
  }
  assert.ok(CC.lampScale(1080 / 1.45 - 2 * RHYTHM.COL, 8.5) < (CC.STRIP_H - 12) / 22, 'with two dailies the column — not the strip — decides');
  const own = Math.min(8, CC.lampScale(1080 - 2 * RHYTHM.COL, 6.25));
  assert.ok(CC.lampsWidth(own, own * 6.25) <= 1080 - 2 * RHYTHM.COL + 1e-6, 'its own card too');
  assert.match(read('js/games/coastclear/share.js'), /const S = Math\.min\(\(STRIP_H - 12\) \/ 22, lampScale\(cw, 8\.5\)\);/);
});

test('PFIX-3 — S8 / N6 / S9: THE PASSWORD\'s door takes the LOOK (day fills), its SHARE TODAY grids are BOTTOM-aligned (its own card top-aligned); THE DROP\'s own card is on the kit\'s rule', async () => {
  const pw = read('js/games/password/share.js');
  assert.match(pw, /function door\(c, x, y, S, st, L, look = 'night'\) \{\n  const day = look === 'day';/);
  assert.doesNotMatch(code('js/games/password/share.js'), /L === LOOK\.day/, 'the old test was never true (tokens() hands out a copy)');
  assert.match(pw, /door\(c, mid - dw \/ 2, top, G\.S, st, L, look\);/);
  assert.match(pw, /st === 'held' \? \(L\.heldInk \|\| L\.doorHeld\) : L\.faint/, 'a failed room\'s label: the solid day red');
  // the grids: each starts (rows - its rows) × (cell + gap) lower — they end on ONE floor
  const calls = [];
  const ctx = new Proxy({}, { get: (_, k) => (...a) => { calls.push([k, ...a]); return undefined; }, set: () => true });
  const PW = await import('../js/games/password/share.js'), G = await import('../js/games/password/logic.js');
  const run = { doors: [{ guesses: ['a', 'b', 'c'], marks: [[G.MISS], [G.MISS], [G.MISS]] }, { guesses: ['a'], marks: [[G.MISS]] }] };
  PW.paintGrids(ctx, run, PW.tokens('night'), 540, 200, 40, 8, 60);
  const ys = calls.filter(c => c[0] === 'moveTo').map(c => c[2]);
  assert.deepEqual([...new Set(ys)].sort((a, b) => a - b), [200, 248, 296], 'the tall grid\'s three rows');
  assert.equal(ys[ys.length - 1], 296, 'the one-row grid sits on the tall grid\'s LAST row (bottom-aligned)');
  assert.match(pw, /if \(d && d\.marks\.length\) grid\(c, d\.marks, mid - gw \/ 2, top \+ roomsHead\(\), G\.cell, G\.gap, L\);/, 'its own card: every column from the same top');
  // THE DROP's own card: the kit's frame + the kit's three painters + the kit's foot — never SHARE YOUR RUN's frame
  const d = read('js/games/drop/share.js'), card = d.slice(d.indexOf('export async function renderShare'), d.indexOf('export const prepDrop'));
  assert.match(card, /shareFrame\(L, look\)/); assert.match(card, /paintName\(c, look, NAME, W \/ 2, OWN\.nameY, OWN\.namePx, W - 120\);/, 'the name: no result → WHITE');
  assert.match(card, /paintBig\(c, look, timeOf\(I\.t\), W \/ 2, OWN\.bigY, OWN\.bigPx\);/); assert.match(card, /paintStat\(c, look, statOf\(I\), W \/ 2, OWN\.statY, OWN\.statPx, W - 120\);/);
  assert.match(card, /shareFoot\(c, \{ note: dateOf\(I\.day\)/);
  assert.doesNotMatch(code('js/games/drop/share.js'), /runCard|drawRunCard|share-run\.js/);
  const DR = await import('../js/games/drop/share.js');
  assert.ok(DR.BOARD_BOX.y > OWN.statY + OWN.statPx / 2 + 20, 'the board starts clear of the stat line');
  assert.ok(DR.BOARD_BOX.y + DR.BOARD_BOX.h <= FOOT.lineY - 50, '… and ends clear of the date + the foot');
  assert.equal(DR.shareLine({ t: 1000, ln: 2, day: 'd20261113' }).includes('https://'), false, 'the bare domain, like the other dailies\' lines');
});

test('PFIX-3 — S11, THE CARD IS BUILT BEFORE THE TAP: prepShare builds once, the tap sends the ready file with nothing awaited that takes time; one send at a time; never a download', async () => {
  const K = await import('../js/daily/share.js');
  const kit = code('js/daily/share.js');
  assert.doesNotMatch(kit, /\.download\b|a\.click\(\)|createElement\('a'\)/, 'never a silent download');
  assert.match(read('js/daily/share.js'), /PRESS AND HOLD TO SAVE/);
  // a fake phone that shares files
  const shares = [];
  const nav = { canShare: d => !!(d && d.files && d.files.length), share: d => { shares.push(d); return new Promise(r => setTimeout(r, 30)); } };
  const had = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: nav });
  try {
    let made = 0;
    const cv = () => ({ width: 1080, height: 1350, toBlob: cb => cb(new Blob(['png'], { type: 'image/png' })) });
    const H = K.prepShare(async () => { made++; return { cv: cv(), name: 'card.png', line: 'the line' }; });
    H.warm(); H.warm();
    assert.equal(await H.ready(), true);
    assert.equal(made, 1, 'built ONCE, when the screen opened');
    const a = H.send(), b = H.send();
    assert.equal(await b, 'busy', 'a double tap: ONE send');
    assert.equal(await a, 'shared');
    assert.equal(shares.length, 1); assert.equal(shares[0].files[0].name, 'card.png'); assert.equal(shares[0].text, 'the line');
    assert.equal(made, 1, 'the tap built nothing');
    // the player closes the share sheet: nothing else happens
    nav.share = () => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' }));
    assert.equal(await H.send(), 'none');
    // a build that fails is tried again by the next send
    let n = 0;
    const F = K.prepShare(async () => { if (!n++) throw new Error('no'); return { cv: cv(), name: 'c.png', line: '' }; });
    assert.equal(await F.ready(), false);
    nav.share = d => { shares.push(d); return Promise.resolve(); };
    assert.equal(await F.send(), 'shared');
  } finally { if (had) Object.defineProperty(globalThis, 'navigator', had); else delete globalThis.navigator; }
  // the lettering is in before a card is drawn (a card built as a screen opens could come before a font weight the screen never used)
  assert.match(read('js/daily/share.js'), /const build = \(\) => \(p \|\|= shareFonts\(\)\.then\(make\)/);
  assert.deepEqual(K.SHARE_FONTS, ['900 72px "Orbitron"', '700 84px "Chakra Petch"', '800 52px "Chakra Petch"']);
  await K.shareFonts();   // (no document: returns at once, never throws)
  // no message over the YOUR CARD sheet (the add-on, Nov 14 4:14 pm)
  assert.doesNotMatch(kit, /toast\(/);
  // where it is warmed: the DAILY screen as TODAY shows the button, each daily's end screen, THE DROP's end card
  assert.match(read('js/screens/daily.js'), /if \(share\) warmShare\(t\);/);
  assert.match(read('js/games/drop/view.js'), /sharer\(sc\)\.then\(H => H\.warm\(\)\)/);
  assert.match(read('js/daily/share-today.js'), /export function prepToday\(today, lineOf, \{ streak = 0, look, pid = null \} = \{\}\) \{\n  return prepShare\(async \(\) => \{/);
});

test('PFIX-3 (Ben, Nov 14) — SHARE TODAY: THE DROP\'s board box is DECENT SIZED — its strip is taller than the rhythm\'s, COAST CLEAR\'s lamps gave up the room', async () => {
  const DR = await import('../js/games/drop/share.js'), CC = await import('../js/games/coastclear/share.js'), PW = await import('../js/games/password/share.js'), G = await import('../js/games/password/logic.js');
  assert.ok(DR.STRIP_H >= 1.5 * RHYTHM.artH, `THE DROP's strip ${DR.STRIP_H} (the rhythm's ${RHYTHM.artH})`);
  assert.ok(CC.STRIP_H < RHYTHM.artH && CC.STRIP_H >= 0.7 * RHYTHM.artH, `the lamps shrink a LITTLE (${CC.STRIP_H} of ${RHYTHM.artH})`);
  assert.equal(DR.sectionH(), RHYTHM.H - RHYTHM.artH + DR.STRIP_H); assert.equal(CC.sectionH(), RHYTHM.H - RHYTHM.artH + CC.STRIP_H);
  // the card with all three, as share-today.js lays it out (the header with a streak, three sections, two gaps): the board's box on the card
  const T = read('js/daily/share-today.js');
  assert.match(T, /const natural = \(sec, k\) => \{ const M = sec\.own \? mods\[sec\.id\] : null; return M && M\.S\.sectionH \? M\.S\.sectionH\(/, 'each section is laid out by ITS OWN height');
  const H = MISSV => MISSV;
  const door = marks => ({ state: 'solved', marks, guesses: marks.map(() => 'xxxxx') });
  const run = { doors: [door([[G.MISS], [G.MISS], [G.MISS]]), door([[G.MISS], [G.MISS]])] };
  const avail = 1200 - 248 - 2 * 24;
  let s = 1; for (let i = 0; i < 6; i++) s = Math.min(1.45, avail / (PW.sectionH({ run, W: 1080 / s, k: s }) + CC.sectionH() + DR.sectionH()));
  const boxH = DR.STRIP_H * s, cell = boxH / DR.STRIP_ROWS, lamp = 22 * ((CC.STRIP_H - 12) / 22) * s;
  assert.ok(boxH >= 195 && cell >= 24, `the board's box is ${boxH.toFixed(0)} px tall on the card — ${cell.toFixed(1)}-px cells (it was 138 px, 17-px cells)`);
  assert.ok(lamp >= 80, `the lamps still read: ${lamp.toFixed(0)} px tall`);
  assert.ok(RHYTHM.namePx * s >= 34 && RHYTHM.bigPx * s >= 72, `the names + the times stay their size (${(RHYTHM.namePx * s).toFixed(0)} / ${(RHYTHM.bigPx * s).toFixed(0)} px)`);
  void H;
});

// FIXES R3 — THE ONE RULE's big score (the owner, Nov 15): "ONE big SCORE = the daily's main measure" — THE PASSWORD: its GUESSES big, the
// time the grey stat line; COAST CLEAR + THE DROP: the time big. Every DAILIES row declares its measure (a future daily declares its own).
test('FIXES R3 — ONE big SCORE = the daily\'s MAIN MEASURE: THE PASSWORD its guesses (the time grey), COAST CLEAR + THE DROP their time', async () => {
  const { DAILIES } = await import('../js/config.js');
  const S = await import('../js/daily/share.js');
  for (const d of DAILIES) assert.ok(S.MEASURES.includes(d.measure), `${d.id} declares its measure (${d.measure})`);
  assert.equal(S.measureOf('password'), 'guesses'); assert.equal(S.measureOf('coastclear'), 'time'); assert.equal(S.measureOf('drop'), 'time');
  assert.equal(S.measureOf('nope'), 'time', 'a daily that names none: the time');
  const PW = await import('../js/games/password/share.js');
  const run = { done: true, startedAt: 1000, finishedAt: 1000 + 174e3, doors: [{ state: 'solved', guesses: ['a', 'b', 'c'], marks: [] }, { state: 'solved', guesses: ['d', 'e', 'f', 'g', 'h'], marks: [] }] };
  assert.equal(PW.bigOf(run), '8 GUESSES', 'the guesses BIG');
  assert.equal(PW.statOf(run), '2:54', 'the time = the grey stat line');
  const pw = read('js/games/password/share.js');
  assert.match(pw, /paintBig\(c, look, bigOf\(run\), W \/ 2, OWN\.bigY, OWN\.bigPx, W - 120\);/, 'its own card: the guesses big (fitted)');
  assert.match(pw, /paintBig\(c, look, bigOf\(run\), W \/ 2, R\.bigY, R\.bigPx, W - 2 \* R\.COL\);/, 'SHARE TODAY\'s section: the same');
  for (const p of ['js/games/coastclear/share.js', 'js/games/drop/share.js']) assert.doesNotMatch(read(p), /bigOf|measureOf\('(coastclear|drop)'\) === 'guesses'/, `${p}: the time stays big`);
  assert.match(read('js/daily/share.js'), /export function paintBig\(c, look, text, cx, y, px, fitW = 0\)/, 'a long word line shrinks to its column');
});
