// PARTY NIGHTS: the window, the phases, the beat clock, the palette, the party windows (js/core/party.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { partyHour, inPartyWindow, partyPhase, partyEnergy, partyState, partyLateK, finaleDue, breathShape, breathDiv, createBeatClock, advanceBeat, partyPalette, pickPartyWindows, partySeed, FALLBACK_BREATH_S } from '../js/core/party.js';
import { localParts, look } from '../js/core/sky.js';
import { partyLine, tickerText } from '../js/screens/district/sign-logic.js';

const at = (dow, h, mi = 0, s = 0) => ({ dow, h, mi, s, y: 2026, m: 10, d: 23 });

test('the window: Friday and Saturday 8 pm → 2 am, into Saturday / Sunday morning; nothing else', () => {
  assert.ok(inPartyWindow(at(5, 20)), 'Fri 8 pm');
  assert.ok(inPartyWindow(at(5, 23, 59)), 'Fri 11:59 pm');
  assert.ok(inPartyWindow(at(6, 1, 59)), 'Sat 1:59 am (Friday night)');
  assert.ok(!inPartyWindow(at(6, 2)), 'Sat 2 am: over');
  assert.ok(inPartyWindow(at(6, 20)), 'Sat 8 pm');
  assert.ok(inPartyWindow(at(0, 1, 30)), 'Sun 1:30 am (Saturday night)');
  assert.ok(!inPartyWindow(at(0, 20)), 'Sunday evening: no');
  assert.ok(!inPartyWindow(at(5, 19, 59)), 'Fri 7:59 pm: not yet');
  assert.ok(!inPartyWindow(at(3, 22)), 'a Wednesday: no');
  assert.ok(!inPartyWindow(at(1, 1)), 'Monday 1 am: no');
  assert.equal(partyHour(at(6, 1)), 25, 'the small hours count on from the evening');
});

test('the shape of the night: warm-up, peak, after hours — energy blends, never jumps', () => {
  assert.equal(partyPhase(at(5, 20, 30)), 'warm');
  assert.equal(partyPhase(at(5, 22, 30)), 'peak');
  assert.equal(partyPhase(at(6, 0, 30)), 'after');
  assert.equal(partyPhase(at(6, 2, 30)), null);
  const e = h => partyEnergy({ dow: h >= 24 ? 6 : 5, h: Math.floor(h % 24), mi: Math.round((h % 1) * 60) });
  assert.ok(e(20) < e(21.9) && e(21.9) < e(22.5), 'rising into the peak');
  assert.ok(Math.abs(e(23) - 1) < 0.01, 'the peak is 1');
  assert.ok(e(25) < e(23) && e(25) > 0.6, 'after hours calmer, still alive');
  let prev = e(20);
  for (let h = 20; h <= 26; h += 1 / 60) { const v = e(h); assert.ok(Math.abs(v - prev) < 0.02, `no jump at ${h.toFixed(2)}`); prev = v; }
});

test('the party starts at 8 pm OR the catch, whichever is later; winds down over ~1.5 min after 2 am; a preview forces it', () => {
  assert.equal(partyState(at(5, 21), { caught: false }).on, 0, 'no catch yet (a summer evening): no party');
  assert.equal(partyState(at(5, 21), { caught: true }).on, 1);
  assert.equal(partyState(at(5, 19, 30), { caught: true }).on, 0, 'before 8 pm');
  const w = partyState(at(6, 2, 0, 40));
  assert.ok(w.on > 0 && w.on < 1 && w.ending, `winding down at 2:00:40 (${w.on.toFixed(2)})`);
  assert.equal(partyState(at(6, 2, 2)).on, 0, 'over by 2:02');
  assert.deepEqual(partyState(at(2, 12), { force: true }).phase, 'peak');
  assert.equal(partyState(at(2, 12)).on, 0);
});

test('the late-night wind-down waits for the party: lit until 2 am, out over the next hour', () => {
  assert.equal(partyLateK(at(5, 23)), 0);
  assert.equal(partyLateK(at(6, 1, 59)), 0);
  assert.ok(partyLateK(at(6, 2, 30)) > 0.4 && partyLateK(at(6, 2, 30)) < 0.6);
  assert.equal(partyLateK(at(6, 3, 5)), 1);
  assert.equal(partyLateK(at(2, 23)), null, 'a weeknight: the usual rule');
  // through core/sky.js#look: at 11:30 pm the city is still fully lit on a Friday, winding down on a Wednesday
  const tz = 'America/Detroit';
  const fri = look(Date.parse('2026-10-24T03:30:00Z'), tz, {}), wed = look(Date.parse('2026-10-22T03:30:00Z'), tz, {});
  assert.equal(localParts(Date.parse('2026-10-24T03:30:00Z'), tz).dow, 5, 'that is Friday 11:30 pm in Detroit');
  assert.ok(fri.w.late < 0.01 && wed.w.late > 0.2, `late: Fri ${fri.w.late.toFixed(2)} vs Wed ${wed.w.late.toFixed(2)}`);
  const sat3 = look(Date.parse('2026-10-24T07:05:00Z'), tz, {});
  assert.ok(sat3.w.late > 0.9, 'by 3 am Saturday the city has wound down');
});

test('the ticker: IT\'S FRIDAY NIGHT / IT\'S SATURDAY NIGHT join the rotation on party nights', () => {
  const L = (dow, h) => ({ partyNight: true, local: { dow, h, mi: 0, y: 2026, m: 10, d: 23 }, holiday: null, nye: null });
  assert.equal(partyLine(L(5, 22)), "IT'S FRIDAY NIGHT");
  assert.equal(partyLine(L(6, 1)), "IT'S FRIDAY NIGHT", 'Saturday 1 am is still Friday night');
  assert.equal(partyLine(L(6, 23)), "IT'S SATURDAY NIGHT");
  assert.equal(partyLine(L(0, 1)), "IT'S SATURDAY NIGHT");
  assert.equal(partyLine({ partyNight: false, local: { dow: 5, h: 22 } }), '');
  assert.equal(tickerText(L(5, 22), ['CIPHER', 'PULSE']), "IT'S FRIDAY NIGHT   ★   NOW PLAYING: CIPHER · PULSE");
  assert.equal(tickerText({ partyNight: false, local: { dow: 3, h: 22 }, holiday: null, nye: null }, ['CIPHER']), 'NOW PLAYING: CIPHER');
});

test('the finale is due the moment local midnight passes on a party night, once', () => {
  assert.ok(finaleDue(23.9995, 24.0002));
  assert.ok(!finaleDue(24.0002, 24.001), 'not again');
  assert.ok(!finaleDue(null, 24.0002));
  assert.ok(!finaleDue(22, 22.01));
});

test('the breath: peaks on the beat, relaxes until the next; a breath per beat, or every second beat when the song is fast', () => {
  assert.ok(breathShape(0) > 0.99 && breathShape(0.999) > 0.95, 'full on the beat');
  assert.ok(breathShape(0.5) < 0.3 && breathShape(0.8) < 0.05, 'relaxed between');
  assert.ok(breathShape(0.9) > 0.4 && breathShape(0.9) < 0.6, 'rising into the beat');
  assert.equal(breathDiv(76), 1); assert.equal(breathDiv(112), 2); assert.equal(breathDiv(136), 2); assert.equal(breathDiv(180), 4);
  for (const bpm of [60, 76, 112, 136, 170]) assert.ok(bpm / 60 / breathDiv(bpm) <= 1.45, `${bpm} bpm breathes at ≤ 1.45 / s`);
});

test('the beat clock: a slow steady breath with no song, then it eases onto the song — no jump — and lets go the same way', () => {
  const bc = createBeatClock();
  for (let i = 0; i < 300; i++) advanceBeat(bc, 16.7, null);
  assert.ok(Math.abs(bc.rate - 1 / FALLBACK_BREATH_S) < 1e-6, 'the fallback rate');
  // a 112 bpm song, 30 s in
  let pos = 30, maxStep = 0, lastB = bc.breath, lastPhase = bc.phase;
  for (let i = 0; i < 600; i++) {
    advanceBeat(bc, 16.7, { bpm: 112, pos }); pos += 0.0167;
    const dphase = Math.abs((bc.phase - lastPhase + 1.5) % 1 - 0.5);
    maxStep = Math.max(maxStep, dphase); lastPhase = bc.phase; lastB = bc.breath;
  }
  assert.ok(maxStep < 0.06, `the phase never jumps (max step ${maxStep.toFixed(3)} of a breath per frame)`);
  assert.ok(Math.abs(bc.rate - 112 / 60 / 2) < 0.01, `at the song's rate (${bc.rate.toFixed(3)} breaths / s)`);
  assert.ok(bc.locked > 0.99);
  const tp = (pos * 112 / 60 / 2) % 1;
  assert.ok(Math.abs((bc.phase - tp + 1.5) % 1 - 0.5) < 0.06, `in phase with the song (${bc.phase.toFixed(2)} vs ${tp.toFixed(2)})`);
  // the music stops: back to the slow breath, gently
  let steps = 0;
  for (let i = 0; i < 400; i++) { const r0 = bc.rate; advanceBeat(bc, 16.7, null); steps = Math.max(steps, Math.abs(bc.rate - r0)); }
  assert.ok(Math.abs(bc.rate - 1 / FALLBACK_BREATH_S) < 0.01 && steps < 0.03, 'eased back to the fallback');
  void lastB;
});

test('the palette: the city\'s neon, or the holiday\'s; the party windows: ~a quarter, some floors, seeded by the evening', () => {
  assert.equal(partyPalette(null), partyPalette('nonsense'));
  assert.notEqual(partyPalette('halloween'), partyPalette(null));
  const windows = [];
  for (let b = 0; b < 6; b++) for (let f = 0; f < 10; f++) for (let k = 0; k < 7; k++) windows.push({ x: b * 60 + k * 6, y: 400 - f * 9, w: 3, h: 4 });
  const a = pickPartyWindows(windows, 'party:2026-10-23', partyPalette(null));
  const b = pickPartyWindows(windows, 'party:2026-10-23', partyPalette(null));
  const c = pickPartyWindows(windows, 'party:2026-10-24', partyPalette(null));
  assert.deepEqual(a, b, 'the same every rebuild tonight');
  assert.notDeepEqual(a.map(p => p.i), c.map(p => p.i), 'another night, another set');
  assert.ok(Math.abs(a.length / windows.length - 0.25) < 0.03, `about a quarter (${(a.length / windows.length * 100).toFixed(0)} %)`);
  assert.ok(a.some(p => p.floor) && a.filter(p => p.floor).length < a.length * 0.5, 'some whole floors, not most');
  assert.ok(a.some(p => p.extra), 'a few extras for the peak');
  assert.equal(new Set(a.map(p => p.i)).size, a.length, 'no window twice');
  assert.equal(partySeed({ y: 2026, m: 10, d: 24, h: 1 }), 'party:2026-10-23', 'the small hours belong to the evening before');
  assert.equal(partySeed({ y: 2026, m: 10, d: 23, h: 22 }), 'party:2026-10-23');
});
