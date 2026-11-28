// CITY PART 1 — HIGH RISE IN THE CITY + THE DAY PAINT (the inbox: Nov 20 8:12 am + 5:52 pm — HIGH RISE's signage; Nov 20 8:55 am — JAYWALK's
// signs look lit by day). THE DAY PAINT GUARD: real neon is nearly invisible in sunlight — a sign's DAY face is PAINT (sun-faded enamel, cream /
// gold letters, a gold-leaf or dark keyline); no day ink / keyline may be a saturated, near-white-hot colour on a dark board (gold leaf + cream +
// the dark keylines pass). JAYWALK's old day face (pink-white + a HOT-PINK keyline on near-black plum) is the case it catches.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DAY_PAINT, dayPaint, SIGN_ACC, SIGN_ACC2 } from '../js/screens/harbor/signs.js';
import { SIGN_HOLD, SIGN_SPLIT, signRoster, signText, fitsSpot } from '../js/core/harbor-neon.js';
import { triFaces, highriseShow, highriseLive, faceDates, newestFace } from '../js/core/harbor-trivision.js';
import { GAMES } from '../js/config.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const hsv = ([r, g, b]) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: mx ? d / mx : 0, v: mx / 255 };
};
const lum3 = c => c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
const warm = c => { const { h } = hsv(c); return h >= 22 && h <= 65; };          // (gold leaf, cream, amber: the sun on paint)
/** the guard on one painted scheme: [] = it reads as PAINT by day */
export function litLooking(p) {
  const bad = [], dark = lum3(p.face) < 110, black = Math.max(...p.face) < 70;
  for (const [k, c] of Object.entries({ ink: p.ink, ink2: p.ink2, edge: p.edge })) {
    if (!c) continue;
    const { s, v } = hsv(c);
    if (dark && s > 0.45 && v > 0.8 && !warm(c)) bad.push(`${k} ${c} — a saturated bright colour on a dark board reads LIT`);
    if (black && k !== 'edge' && v > 0.85 && !warm(c) && s > 0.08) bad.push(`${k} ${c} — a tinted near-white on a near-black board reads like a lit tube`);
  }
  return bad;
}

test('THE DAY PAINT GUARD: every day face reads as PAINT — no saturated / near-white-hot ink or keyline on a dark board (gold leaf, cream, dark keylines pass)', () => {
  for (const id of Object.keys(DAY_PAINT)) assert.deepEqual(litLooking(dayPaint({ id })), [], `${id}: its day face looks lit`);
  // the case it is for: JAYWALK's old day face (CITY B) — caught
  assert.ok(litLooking({ face: [58, 4, 40], ink: [255, 214, 240], edge: [255, 79, 196] }).length >= 2, 'the old JAYWALK day face fails the guard');
});

test('THE DAY PASS still: every playable game\'s letters ≥ 4.5 : 1 on its board — HIGH RISE\'s TWO paints (HIGH raspberry, RISE teal) each', () => {
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  for (const g of signRoster(GAMES)) {
    const p = dayPaint(g);
    assert.ok(ratio(p.ink, p.face) >= 4.5, `${g.id}: ${ratio(p.ink, p.face).toFixed(1)} : 1`);
    if (p.ink2) assert.ok(ratio(p.ink2, p.face) >= 4.5, `${g.id} second word: ${ratio(p.ink2, p.face).toFixed(1)} : 1`);
  }
  assert.ok(DAY_PAINT.highrise.ink2, 'HIGH RISE paints its second word in its own colour');
});

test('the speakeasy blade\'s NEON kind by day = pale UNLIT glass (≥ 75 % toward grey-white — a faint tint, never a pastel that reads lit)', () => {
  const b = read('js/screens/harbor/speakeasy-blade.js');
  const m = /if \(style === 'day'\) text\(x, ch, col\.cx, vb, size, \{ fill: rgb\(mix\(ink, \[(\d+), (\d+), (\d+)\], ([\d.]+)\)\)/.exec(b);
  assert.ok(m, 'the neon day line');
  assert.ok(Number(m[4]) >= 0.75 && Math.min(+m[1], +m[2], +m[3]) >= 200, `the glass: ${m[4]} toward [${m[1]}, ${m[2]}, ${m[3]}]`);
});

test('HIGH RISE\'s ROOF TUBE SIGN: stacked HIGH / RISE (never one line), HIGH #ff4fd8 + RISE #35e3ff at night; never on the hotel blade (8 letters — PRISM / HOLDEM only)', () => {
  assert.ok(!SIGN_HOLD.includes('highrise'), 'THE SIGN HOLD lifted for HIGH RISE in the same pass as its signs (FREEFALL\'s GO-LIVE, Nov 28: FREEFALL held — its city pass lifts it)');
  assert.deepEqual(SIGN_SPLIT.highrise, ['HIGH', 'RISE']);
  assert.equal(SIGN_ACC.highrise, '#ff4fd8'); assert.equal(SIGN_ACC2.highrise, '#35e3ff');
  const g = { id: 'highrise', name: 'HIGH RISE', short: 'HIGH RISE' };
  assert.equal(signText(g, { kind: 'named', type: 'box', stack: true, cap: 6, words: 2 }), 'HIGH RISE', 'a roof sign: two stacked words');
  assert.equal(signText(g, { kind: 'named', type: 'vbox', cap: 6, words: 1, rot: 'hotel' }), null, 'the hotel blade: never');
  assert.ok(fitsSpot('HIGH RISE', { kind: 'named', type: 'box', cap: 6, words: 2 }));
  const s = read('js/screens/harbor/signs.js');
  assert.match(s, /if \(col2\) parts\.push\(\{ tubes: A\.polys, col, w: tw, boxes: A\.boxes, lines: 2 \}, \{ tubes: B\.polys, col: col2, w: tw, boxes: B\.boxes, lines: 2, word2: true \}\);/, 'two tube colours, one word each');
  assert.match(s, /p\.word2 && pt\.ink2 \? \{ \.\.\.pt, ink: pt\.ink2 \} : pt/, 'by day the second word in its own paint');
});

test('THE TRI-VISION: HIGH RISE\'s OPEN NOW face (B1) lit by its GO-LIVE alone; the rotation HIGH RISE → JAYWALK → HOLD\'EM; THE DROP removed; it opens on HIGH RISE (the newest)', () => {
  const row = GAMES.find(g => g.id === 'highrise');
  assert.equal(highriseLive(row), '2026-11-20');
  assert.equal(highriseShow('2026-11-19', row), null, 'the day before its go-live: nothing (no COMING SOON)');
  assert.equal(highriseShow('2026-11-20', row), 'highrise');
  assert.equal(highriseShow('2026-11-20', { ...row, playable: false }), null, 'its row off: nothing');
  const F = triFaces('2026-11-25');
  assert.equal(F[0], 'highrise', 'before FREEFALL\'s go-live: HIGH RISE first'); assert.ok(!F.includes('drop'));
  const F2 = triFaces('2026-11-28');
  assert.deepEqual(F2.slice(0, 3), ['freefall', 'highrise', 'jaywalk'], 'THE FREEFALL CITY PASS: FREEFALL → HIGH RISE → JAYWALK → HOLD\'EM');
  assert.equal(F2[newestFace(F2, faceDates())], 'freefall', 'the board opens on the NEWEST game — FREEFALL (its go-live the newest switch date)');
  // the face is a picture: drawn WHOLE once it has decoded (lazy — never the boot graph); the reveal waits for the pick's picture ≤ 4 s
  const sc = read('js/screens/harbor/scene.js');
  for (const id of ['highrise', 'freefall']) assert.ok(sc.includes(`${id}: () => lazyImport(import('./${id}-art.js'), './${id}-art.js')`), `${id}: its painter lazy`);
  assert.match(sc, /ROW_ART\[id\]\(\)\.then\(m => \{ if \(!destroyed\) m\.warm\(/);
  assert.match(sc, /\(!ROW_FACES\.includes\(f\) \|\| tri\.row\[f\]\)/, 'a face only once its picture has decoded (no flash)');
  assert.match(sc, /ROW_FACES\.includes\(bp\) \? !!tri\.row\[bp\]/, 'the reveal waits for the pick\'s picture (≤ REVEAL_MAX − 0.5 s)');
  for (const id of ['highrise', 'freefall']) {
    const art = read(`js/screens/harbor/${id}-art.js`);
    assert.ok(art.includes(`assets/city/${id}/billboard.webp`)); assert.match(art, /drawImage\(img, C\.dx, C\.dy, C\.dw, C\.dh\)/);
    assert.match(art, /export (function warm\(|\{ warmHighrise as warm)/, `${id}: the row faces' one shape`);
    assert.ok(!/fillText|word\(/.test(art), 'nothing lettered over the picture');
  }
  const boot = JSON.parse(read('tests/integration/boot-budget.json'));
  assert.ok(!JSON.stringify(boot).includes('-art.js'), 'never in the boot');
});
