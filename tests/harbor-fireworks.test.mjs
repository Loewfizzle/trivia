// PART 10 — THE FIREWORKS' PLANNER (core/harbor-fireworks.js): every night's shows, their times + conflicts, the scripted format, the weather.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fireworksNight, planShow, scriptShow, fireworksWeather, fireworksBusy, SHELL_TYPES, FW_LAYERS, FW_COLORS } from '../js/core/harbor-fireworks.js';
import { knob } from '../js/core/harbor-schedule.js';

const DAY0 = 1793419200 - 24 * 3600;   // a local midnight (abs s)
const H = h => DAY0 + h * 3600;

test('every night a show: 9:30 pm on a weeknight, the full show at 10 pm on a party night, + the midnight shells', () => {
  const wk = fireworksNight(DAY0, 'k1', { party: false, dark: H(19) });
  assert.deepEqual(wk.map(s => s.kind), ['show', 'midnight']);
  assert.equal(wk[0].t0, H(knob('fireworks.show').at));
  const S = knob('fireworks.show');
  assert.ok(wk[0].t1 - wk[0].t0 >= S.dur[0] && wk[0].t1 - wk[0].t0 <= S.dur[1], 'the weeknight show ~60–90 s');
  const pt = fireworksNight(DAY0, 'k1', { party: true, dark: H(19) });
  assert.deepEqual(pt.map(s => s.kind), ['party', 'midnight']);
  assert.equal(pt[0].t0, H(22));
  assert.ok(pt[0].t1 - pt[0].t0 >= 240 && pt[0].t1 - pt[0].t0 <= 300, 'the party show ~4–5 min');
  assert.equal(pt[1].t0, H(24));
});

test('a summer twilight: the show waits until it is properly dark; a white night has none', () => {
  const late = fireworksNight(DAY0, 'k2', { party: true, dark: H(22.4) });
  assert.equal(late[0].t0, H(22.4));
  assert.equal(fireworksNight(DAY0, 'k2', { party: false, dark: null }).length, 0);
  // (dark only after the latest start → no main show; midnight still goes up when it is dark by then)
  const vlate = fireworksNight(DAY0, 'k2', { party: false, dark: H(23.8) });
  assert.deepEqual(vlate.map(s => s.kind), ['midnight']);
});

test('a show WAITS for a legendary / a raid / the ghost ship (busy) — never overlapping it', () => {
  const held = [H(21.4), H(21.4) + 600];
  const busy = (a, b) => (b > held[0] && a < held[1] ? held[1] : null);
  const v = fireworksNight(DAY0, 'k3', { party: false, dark: H(19), busy });
  const show = v.find(s => s.kind === 'show');
  assert.ok(show.t0 >= held[1] + knob('fireworks.show').gap, 'after the held window + its gap');
});

test('the plans: seeded (the same on every phone), sorted by the burst, real shell types + colours + layers', () => {
  for (const kind of ['show', 'party', 'midnight']) {
    const a = planShow(kind, 4242), b = planShow(kind, 4242);
    assert.deepEqual(a, b, `${kind}: the same seed → the same show`);
    assert.notDeepEqual(planShow(kind, 4243).cues, a.cues, `${kind}: another night, another show`);
    for (let i = 1; i < a.cues.length; i++) assert.ok(a.cues[i].t >= a.cues[i - 1].t, 'sorted by the burst');
    for (const c of a.cues) {
      assert.ok(SHELL_TYPES.includes(c.type), c.type);
      assert.ok(FW_COLORS[c.c1] && FW_COLORS[c.c2]);
      assert.ok(FW_LAYERS[c.layer]);
      assert.ok(c.t >= 0 && c.t <= a.dur, 'inside the show');
      assert.ok(c.t - c.rise > -0.5, 'never launched before the show starts');
      assert.ok(c.x >= 0 && c.x <= 1 && c.h >= 0 && c.h <= 1);
    }
  }
  const w = planShow('show', 7), p = planShow('party', 7), m = planShow('midnight', 7);
  assert.ok(w.cues.length >= 20 && w.cues.length <= 60, `a few dozen shells (${w.cues.length})`);
  assert.ok(p.cues.length > 150, `the party show is full (${p.cues.length})`);
  assert.ok(m.cues.length >= 2 && m.cues.length <= 4 && m.cues.every(c => c.low), 'midnight: 2–4, low (below the sign)');
  assert.ok(new Set(p.cues.map(c => c.type)).size >= 9, 'the party show uses the whole range of shells');
  assert.deepEqual([...new Set(p.cues.map(c => c.layer))].sort(), ['barge', 'light', 'sky'], 'all three launch layers');
});

test('the party show builds to its finale + ends on the GOLD WILLOW CURTAIN', () => {
  const p = planShow('party', 99), F = knob('fireworks.party').finale;
  const rate = (a, b) => p.cues.filter(c => c.t >= a && c.t < b).length / (b - a);
  assert.ok(rate(p.dur - F, p.dur - 10) > 2.2 * rate(20, p.dur - F), 'the finale far denser than the show');
  const curtain = p.cues.filter(c => c.type === 'willow' && c.c1 === 'gold' && c.big && c.t > p.dur - 12);
  assert.ok(curtain.length >= 8, 'a curtain of gold willows');
  const xs = curtain.map(c => c.x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.75, 'across the whole skyline');
});

test('the scripted format (New Year’s Eve + July 4th later): cues + fill sections', () => {
  const s = scriptShow({ dur: 30, cues: [{ t: 1, type: 'ring', layer: 'barge', x: 0.5, h: 0.5 }], fill: [{ from: 2, to: 28, every: [1, 2], types: ['peony'], layers: { sky: 1 } }] }, 'nye');
  assert.equal(s.cues[0].type, 'ring');
  assert.ok(s.cues.slice(1).every(c => c.type === 'peony' && c.layer === 'sky'));
  assert.ok(s.cues.length > 10);
});

test('the weather: cancelled in rain, storms, gales, dense fog + heavy snow; light snow + clear cold nights go ahead', () => {
  assert.equal(fireworksWeather({}).ok, true);
  assert.equal(fireworksWeather({ snow: 0.3 }).ok, true);
  assert.equal(fireworksWeather({ snow: 0.3 }).why, 'light snow');
  for (const w of [{ storm: true }, { rain: 0.5 }, { wind: 18 }, { fog: 0.8 }, { snow: 0.9 }]) assert.equal(fireworksWeather(w).ok, false, JSON.stringify(w));
});

test('the dance breaks + the patrol give way: fireworksBusy covers the lead-in + the smoke', () => {
  const v = fireworksNight(DAY0, 'k5', { party: true, dark: H(19) }), p = v[0];
  assert.ok(fireworksBusy(v, p.t0 - 3, p.t0 - 1));
  assert.ok(fireworksBusy(v, p.t1 + 2, p.t1 + 5));
  assert.equal(fireworksBusy(v, p.t0 - 600, p.t0 - 300), null);
});
