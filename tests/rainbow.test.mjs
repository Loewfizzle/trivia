// RAINBOWS (core/rainbow.js + core/weather.js#wetAtOf): only after real rain, on the rain's own schedule; the sky picks the bow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bowSchedule, bowEnvelope, lastRain, bowWeights, bowGeometry, MIN } from '../js/core/rainbow.js';
import { wetAtOf, normalize, forcedWeather } from '../js/core/weather.js';
import { look, skyClock } from '../js/core/sky.js';

const T0 = Date.UTC(2026, 9, 19, 21, 0);          // 17:00 in Grand Rapids
const GR = { lat: 42.96, lon: -85.67, forced: true };
const at = (when, wx = 'clear', extra = {}) => { const ck = skyClock(`?when=${when}&tz=America/Detroit`); const ms = ck.now(); return { ms, L: look(ms, 'America/Detroit', { wx: { ...forcedWeather(wx), ...GR, ...extra }, alwaysNight: !!extra.alwaysNight }) }; };

test('wetAt: the end of the last wet quarter hour that has passed; dry or missing = null; raining now = now', () => {
  const t = [0, 900, 1800, 2700, 3600].map(s => 1_800_000_000 + s);
  assert.equal(wetAtOf({ time: t, precipitation: [0, 0.5, 0.05, 0, 0] }, t[4] * 1000), t[1] * 1000, 'a trace (< 0.1 mm) is not rain');
  assert.equal(wetAtOf({ time: t, precipitation: [0, 0, 0, 0, 0] }, t[4] * 1000), null);
  assert.equal(wetAtOf({ time: t, precipitation: [0, 0, 0, 0, 2] }, t[2] * 1000), null, 'a forecast quarter hour never counts');
  assert.equal(wetAtOf(null), null);
  assert.equal(normalize({ weather_code: 61 }, {}, 5000).wetAt, 5000, 'raining now: now');
  assert.equal(normalize({ weather_code: 0 }, {}, t[4] * 1000, { time: t, precipitation: [0, 1, 0, 0, 0] }).wetAt, t[1] * 1000);
  assert.equal(normalize({ weather_code: 0 }).wetAt, null, 'no history: dry');
});

test('the schedule: a few minutes after the rain, a minute or two in, 10–20 minutes, two out; the same for every phone', () => {
  for (let i = 0; i < 200; i++) {
    const end = T0 + i * 7 * MIN + i * 1337;
    const s = bowSchedule(end);
    assert.ok(s.start - end >= 2 * MIN && s.start - end <= 7 * MIN, 'starts 2–7 minutes after the last drops');
    assert.ok(s.fadeIn >= 60_000 && s.fadeIn <= 120_000, 'fades in over a minute or two');
    assert.ok(s.hold >= 10 * MIN && s.hold <= 20 * MIN, 'holds 10–20 minutes');
    assert.equal(s.fadeOut, 2 * MIN);
    assert.ok(s.end - end <= 32 * MIN, 'all within about half an hour of the rain');
    assert.deepEqual(bowSchedule(end), s, 'deterministic');
  }
  assert.equal(bowSchedule(null), null);
  const secondaries = Array.from({ length: 400 }, (_, i) => bowSchedule(T0 + i * 15 * MIN).secondary).filter(Boolean).length;
  assert.ok(secondaries > 100 && secondaries < 220, `the secondary bow only sometimes (${secondaries}/400)`);
});

test('the envelope: 0 before, a smooth rise, 1 while it holds, a smooth fall, 0 after — never a step', () => {
  const end = T0, s = bowSchedule(end);
  assert.equal(bowEnvelope(s.start - 1000, end), 0);
  assert.equal(bowEnvelope(s.start + s.fadeIn + 60_000, end), 1);
  assert.equal(bowEnvelope(s.end + 1000, end), 0);
  let prev = 0, maxStep = 0;
  for (let t = s.start - 5000; t <= s.end + 5000; t += 1000) { const v = bowEnvelope(t, end); maxStep = Math.max(maxStep, Math.abs(v - prev)); prev = v; }
  assert.ok(maxStep < 0.03, `at most a few % a second (${maxStep.toFixed(3)})`);
  assert.equal(bowEnvelope(T0, null), 0, 'dry: never');
});

test('lastRain: the later of the live answer and the device\'s memory; nothing invented', () => {
  assert.equal(lastRain(null, null), null);
  assert.equal(lastRain({ wetAt: 100 }, null), 100);
  assert.equal(lastRain(null, 50), 50);
  assert.equal(lastRain({ wetAt: 100 }, 300), 300);
  assert.equal(lastRain({ kind: 'clear' }, null), null);
});

test('which bow: the day bow with a low sun, none with a high one; the moonbow under a bright moon; the neon bow on a party night', () => {
  const pm = at('2026-10-19T17:15');                 // late afternoon, sun ~12°
  const w = bowWeights(pm.L);
  assert.ok(w.day > 0.8 && w.moon === 0 && w.neon === 0, `late afternoon: the day bow (${JSON.stringify(w)})`);
  const noon = bowWeights(at('2026-06-21T13:30').L);  // the summer sun at ~70°: no rainbow is possible
  assert.equal(noon.day, 0, 'a very high sun: none');
  const oct = bowWeights(at('2026-10-19T13:30').L);   // ~35°: possible, weaker
  assert.ok(oct.day > 0 && oct.day < w.day + 1e-9 && oct.strength < w.strength, 'a higher sun: a weaker bow');
  assert.equal(bowWeights(at('2026-10-19T17:15', 'overcast').L).day, 0, 'thick overcast hides it');
  assert.equal(bowWeights(at('2026-10-19T17:15', 'fog').L).day, 0, 'fog hides it');
  assert.equal(bowWeights(at('2026-10-19T17:15', 'rain').L).day, 0, 'still raining hard: none');
  const full = at('2026-10-26T22:00');                // a full moon up in the east
  assert.ok(full.L.moon.illum > 0.9 && full.L.moon.el > 10, 'the fixture: a bright moon up');
  const m = bowWeights(full.L);
  assert.ok(m.moon > 0.5 && m.day === 0 && m.neon === 0, `a bright moon: the moonbow (${JSON.stringify(m)})`);
  assert.equal(bowWeights(at('2026-10-12T22:00').L).moon, 0, 'a thin moon: no moonbow');
  assert.equal(bowWeights(at('2026-10-26T22:00', 'overcast').L).moon, 0, 'overcast: no moonbow');
  const party = bowWeights(full.L, { party: 1 });
  assert.ok(party.neon > 0.8 && party.moon === 0, 'a party night: the neon bow instead of the moonbow');
  const partyNoMoon = bowWeights(at('2026-10-12T22:00').L, { party: 1 });
  assert.ok(partyNoMoon.neon > 0.8, 'the neon bow needs no moon');
  assert.equal(bowWeights(at('2026-10-19T17:15').L, { party: 1 }).neon, 0, 'not in daylight');
  const an = bowWeights(at('2026-10-19T17:15', 'clear', { alwaysNight: true }).L);
  assert.equal(an.day, 0, 'ALWAYS NIGHT: never the day bow');
  assert.ok(bowWeights(at("2026-10-26T22:00", "clear", { alwaysNight: true }).L).moon > 0.5, 'ALWAYS NIGHT: the moonbow rules as at night');
});

test('the after-rain path end to end: rain just ended → a bow; still raining → none; dry all day → none', () => {
  const ck = skyClock('?when=2026-10-19T17:15&tz=America/Detroit&at=42.96,-85.67&rained=12');
  const now = ck.now();
  const wet = lastRain(ck.wx, null);
  assert.equal(Math.round((now - wet) / MIN), 12, '&rained= says when the rain stopped');
  assert.equal(bowEnvelope(now, wet), 1, '12 minutes after the rain the bow is out (it holds at least until 13)');
  assert.ok(bowEnvelope(now, wet) * bowWeights(look(now, ck.tz, { wx: ck.wx })).day > 0.8);
  const raining = skyClock('?when=2026-10-19T17:15&tz=America/Detroit&wx=rain&rained=0');
  assert.equal(bowEnvelope(raining.now(), lastRain(raining.wx)), 0, 'still raining: not yet');
  const dry = skyClock('?when=2026-10-19T17:15&tz=America/Detroit&wx=clear');
  assert.equal(lastRain(dry.wx), null, 'dry all day: no rain to follow');
  const long = skyClock('?when=2026-10-19T17:15&tz=America/Detroit&rained=45');
  assert.equal(bowEnvelope(long.now(), lastRain(long.wx)), 0, 'long after the rain: gone');
});

test('where: a phone\'s arc tops out under the tagline and drops behind the towers; a wide screen arches over the sign', () => {
  const roof = x => (x < 60 || x > 330 ? 330 : 300);
  const tx = { neon: { x: 50, y: 105, w: 290, h: 90 }, word: { x: 100, y: 212, w: 190, h: 22 }, tag: { x: 40, y: 246, w: 310, h: 16 } };
  const g = bowGeometry({ W: 390, H: 844, HZ: 698, roof, ...tx });
  assert.ok(g.phone && g.top > tx.tag.y + tx.tag.h, 'under the tagline');
  const edgeY = g.cy - Math.sqrt(g.R * g.R - 195 * 195);
  assert.ok(edgeY > 330, `it reaches the screen's edges below the roofs there (${edgeY.toFixed(0)})`);
  const n = bowGeometry({ W: 390, H: 844, HZ: 698, roof, ...tx, kind: 'neon' });
  assert.ok(n.top > g.top, 'the neon bow sits lower');
  const d = bowGeometry({ W: 1440, H: 900, HZ: 667, roof: () => 410, neon: { x: 510, y: 140, w: 420, h: 135 }, word: { x: 595, y: 308, w: 270, h: 24 }, tag: { x: 553, y: 350, w: 335, h: 14 } });
  assert.ok(!d.phone && d.top + d.band < 140, 'a wide screen: the whole band passes over the NEON letters');
  const dy = x => d.cy - Math.sqrt(d.R * d.R - (x - d.cx) ** 2);
  assert.ok(dy(510) + d.band < 140 && dy(930) + d.band < 140, 'never crossing a letter, even at the sign\'s corners');
  assert.ok(dy(2) > 410 && dy(1438) > 410, 'its feet behind the far towers');
  const low = bowGeometry({ W: 1440, H: 900, HZ: 667, roof: x => (x > 1400 ? 440 : 410), neon: { x: 510, y: 140, w: 420, h: 135 }, word: { x: 595, y: 308, w: 270, h: 24 }, tag: { x: 553, y: 350, w: 335, h: 14 } });
  assert.ok(low.cy - Math.sqrt(low.R ** 2 - 718 ** 2) > 440, 'a low building at the very edge: the arc still meets the edge below its roof');
});
