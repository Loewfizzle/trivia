// DAILY FIX (Nov 18 — docs/games/plan.md "DAILY FIX — approved Nov 18"): the ticket + share polish from DAILY B's OPEN FOR BEN. PURE — no browser
// (the screens: e2e-daily.mjs's SAVE YOUR KEY case + e2e-jaywalk-daily-run.mjs's FIT checks with the widest "LAST TRY · 888 LANES").
//   LAST TRY      JAYWALK between tries: the big line "LAST TRY · 143 LANES" (today's score is the BEST try, never the last)
//   SAVE YOUR KEY never over THE DAILIES screen (keypop.js#KEYPOP_COVERED names every .dy-overlay still up)
//   THE INKS      every PLAY / RESUME / TRY AGAIN in its ticket's TICKET_INK — its letters ≥ 4.5:1 on its tube in both looks
//   THE SERIAL    "Nº 1108" ≥ 4.5:1 on its paper in both looks · THE PASSWORD's day stamp ≥ 4.5:1 on the cream (a deeper ink than its ticket's)
//   THE 360 FLOOR no name / stat line under SMALL_MIN card px (≈ 10 px at a 360-px-wide downscale), whatever a section's scale
import '../api/_lib/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ticketState, LAST_TRY } from '../js/daily/today-logic.js';
import { TICKET_INK, stampInkOf, inkOf } from '../js/daily/ticket-art.js';
import { SMALL_MIN, floorPx, RHYTHM } from '../js/daily/share.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const DAY = 'd20261118', OLD = 'd20261110';
const lanes = (l, k = 4000) => l * 1e5 + (99999 - k);
const lineOf = (id, s) => (id === 'jaywalk' ? `${Math.floor(s / 1e5)} LANES` : String(s));
const JW = { id: 'jaywalk', name: 'JAYWALK', tries: 3, hook: 'Three tries.' };
const tr = (i, l) => ({ i, l, k: 4000, w: 'car' });

// ---- colour maths (WCAG 2): hex / rgb → luminance; `mix` = CSS color-mix(in srgb, a p%, b); `over` = an rgba over its ground
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = c => { const [r, g, b] = c.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (a, p, b) => a.map((v, i) => v * p + b[i] * (1 - p));
const over = (c, a, ground) => c.map((v, i) => v * a + ground[i] * (1 - a));
const CREAM = rgb('#f4ecda'), NIGHT_PAPER = rgb('#1b1331');

test('DAILY FIX — LAST TRY: the between-tries big line names it ("LAST TRY · 143 LANES"), DAILY BEST under it, TRY AGAIN + its tries left', () => {
  const one = { day: DAY, mine: { jaywalk: lanes(143) }, tries: { jaywalk: { used: 1, left: 2, tries: [tr(0, 143)] } }, best: { jaywalk: { best: { s: lanes(231), day: OLD } } } };
  const s = ticketState(one, JW, { lineOf });
  assert.deepEqual({ st: s.st, result: s.result, line: s.line.text, act: s.act, under: s.under }, { st: 'between', result: 'LAST TRY · 143 LANES', line: 'DAILY BEST · 231 LANES', act: 'TRY AGAIN', under: '2 TRIES LEFT' });
  assert.equal(LAST_TRY, 'LAST TRY');
  // the widest value (3 digits) + one lane
  assert.equal(ticketState({ ...one, tries: { jaywalk: { used: 1, left: 2, tries: [tr(0, 888)] } } }, JW, { lineOf }).result, 'LAST TRY · 888 LANES');
  assert.equal(ticketState({ ...one, tries: { jaywalk: { used: 1, left: 2, tries: [tr(0, 1)] } } }, JW, { lineOf }).result, 'LAST TRY · 1 LANE');
  // the LAST try — a worse second try is what the big line shows (the best stays in DAILY BEST)
  assert.equal(ticketState({ ...one, tries: { jaywalk: { used: 2, left: 1, tries: [tr(0, 143), tr(1, 98)] } } }, JW, { lineOf }).result, 'LAST TRY · 98 LANES');
  // ADMITTED keeps the BEST try as its result (no LAST TRY there)
  const done = ticketState({ ...one, tries: { jaywalk: { used: 3, left: 0, tries: [tr(0, 143), tr(1, 98), tr(2, 120)] } } }, JW, { lineOf });
  assert.equal(done.st, 'done'); assert.equal(done.result, '143 LANES');
  // the view draws it as ONE line: the label + the lanes (css .dy-result.is-last nowrap)
  assert.match(read('js/screens/daily.js'), /span\.dy-result\.is-last/);
  assert.match(read('css/daily.css'), /\.dy-result\.is-last \{ white-space: nowrap;/);
});

test('DAILY FIX — SAVE YOUR KEY waits while THE DAILIES screen is up (every .dy-overlay not leaving), a running daily too', () => {
  const m = /export const KEYPOP_COVERED = '([^']+)'/.exec(read('js/profile/keypop.js'));
  assert.ok(m, 'KEYPOP_COVERED found');
  const sel = m[1].split(',').map(s => s.trim());
  assert.ok(sel.includes('.dy-overlay:not(.screen-out)'), 'THE DAILIES screen (any daily overlay still up)');
  assert.ok(sel.includes('.dy-run'), 'a running daily (CITY G) kept');
  // the screen IS a .dy-overlay (screens/daily.js#overlay) and leaves through .screen-out
  assert.match(read('js/screens/daily.js'), /section\.screen\.screen-in\.dy-overlay\./);
  assert.match(read('js/screens/daily.js'), /classList\.add\('screen-out'\)/);
});

test('DAILY FIX — PLAY IN ITS TICKET\'s INK: every PLAY / RESUME / TRY AGAIN a tube of --tk; its letters ≥ 4.5:1 in both looks', () => {
  const css = read('css/daily.css');
  assert.match(css, /\.dy-ticket \.btn\.dy-play \{ --tc: var\(--tk\);/);
  assert.match(css, /body\[data-look="day"\] \.dy-overlay \.dy-ticket \.btn\.dy-play \{ --tc: var\(--tk\);[^}]*color: color-mix\(in srgb, var\(--tk\) 55%, #0b1630\)/);
  // night: white letters on the dark tube (--tube-in rgba(9, 7, 20, 0.94) over the night paper)
  const tubeNight = over([9, 7, 20], 0.94, NIGHT_PAPER);
  assert.ok(ratio([255, 255, 255], tubeNight) >= 4.5);
  // day: the ink deepened 55 % toward #0b1630 on the light tube (rgba(255,255,255,0.9) over the cream) — every ticket's day ink
  const tubeDay = over([255, 255, 255], 0.9, CREAM);
  for (const key of [...Object.keys(TICKET_INK), 'house']) {
    const text = mix(rgb(inkOf(key, 'day')), 0.55, rgb('#0b1630'));
    const r = ratio(text, tubeDay);
    assert.ok(r >= 4.5, `${key}'s day PLAY letters ${r.toFixed(2)}:1`);
  }
  // the screen never paints a ticket's PLAY as the house pink MAIN any more (the tube reads --tk; the class may stay btn-primary)
  assert.doesNotMatch(css, /\.dy-play[^{]*\{[^}]*--tube-pink/);
});

test('DAILY FIX — THE SERIAL + THE PASSWORD\'s DAY STAMP read at real size', () => {
  const css = read('css/daily.css');
  const night = /\.dy-overlay \{[^}]*--dy-serial: rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/.exec(css);
  const day = /body\[data-look="day"\] \.dy-overlay \{[^}]*--dy-serial: (#[0-9a-f]{6})/.exec(css);
  assert.ok(night && day, 'both looks set the serial ink');
  const nr = ratio(over([+night[1], +night[2], +night[3]], +night[4], NIGHT_PAPER), NIGHT_PAPER), dr = ratio(rgb(day[1]), CREAM);
  assert.ok(nr >= 4.5, `night serial ${nr.toFixed(2)}:1`); assert.ok(dr >= 4.5, `day serial ${dr.toFixed(2)}:1`);
  assert.match(css, /\.dy-serial \{ font: 700 10px\/1/, 'the serial stays a small quiet line (10 px)');
  // THE PASSWORD's day stamp: its own deeper ink (TICKET_INK.password.stampDay), ≥ 4.5:1 on the cream, darker than the ticket's day ink
  const st = stampInkOf('password', 'day');
  assert.equal(st, TICKET_INK.password.stampDay);
  assert.ok(ratio(rgb(st), CREAM) >= 4.5, `the day stamp ${ratio(rgb(st), CREAM).toFixed(2)}:1`);
  assert.ok(lum(rgb(st)) < lum(rgb(TICKET_INK.password.day)));
  // night unchanged: the stamp = the ticket's own night ink (THE DROP keeps its own stamp ink)
  assert.equal(stampInkOf('password', 'night'), TICKET_INK.password.night);
  assert.equal(stampInkOf('drop', 'night'), TICKET_INK.drop.night);   // (HIGH RISE DAILY B: THE DROP's own pale stamp ink went with its white)
  assert.equal(stampInkOf('coastclear', 'day'), TICKET_INK.coastclear.day);
  assert.match(css, /body\[data-look="day"\] \.dy-stamp \{ color: var\(--tksd,/);
});

test('DAILY FIX — THE 360 FLOOR: a name / stat line lands ≥ 10 px at a 360-px-wide downscale, whatever a section\'s scale', () => {
  assert.ok(SMALL_MIN * 360 / 1080 >= 10, `SMALL_MIN ${SMALL_MIN} = ${(SMALL_MIN / 3).toFixed(1)} px at 360`);
  const ctx = k => ({ getTransform: () => ({ a: k, b: 0 }) });
  // 4 sections (×0.63): the 32-px stat line lifted to land ≥ SMALL_MIN on the card
  assert.ok(floorPx(ctx(0.63), RHYTHM.statPx) * 0.63 >= SMALL_MIN - 1e-9);
  assert.ok(floorPx(ctx(0.63), RHYTHM.namePx) * 0.63 >= SMALL_MIN - 1e-9);
  // a big enough scale (1 or 2 sections, a daily's own card) keeps the RHYTHM size exactly — nothing else shifts
  assert.equal(floorPx(ctx(1.2), RHYTHM.statPx), RHYTHM.statPx);
  assert.equal(floorPx(ctx(1), 46), 46);
  // a context without getTransform = scale 1
  assert.equal(floorPx({}, RHYTHM.statPx), RHYTHM.statPx);
  // the section rules: 4 px in a firmer ink (they were 2 px at 12 % — gone at 360)
  const st = read('js/daily/share-today.js');
  assert.match(st, /c\.strokeStyle = L\.rule; c\.lineWidth = 4;/);
  assert.match(st, /rule: 'rgba\(226,222,246,0\.34\)'/);
});
