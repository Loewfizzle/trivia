// PART 10 — THE FIREWORKS' PLANNER (core/harbor-fireworks.js): every night's shows, their times + conflicts, the scripted format, the weather.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fireworksNight, planShow, scriptShow, fireworksWeather, fireworksBusy, syncToBeat, SHELL_TYPES, FW_LAYERS, FW_COLORS } from '../js/core/harbor-fireworks.js';
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
  assert.deepEqual([...new Set(p.cues.map(c => c.layer))].sort(), ['barge', 'light', 'near', 'sky'], 'all four launch layers');
  // PERF-A — THE NEAR LAUNCHES (the owner: "ALL the fireworks launch from BEHIND THE BUILDINGS"): through the show, more in the build-up
  const near = p.cues.filter(c => c.layer === 'near'), F = knob('fireworks.party').finale;
  assert.ok(near.length >= 15, `${near.length} near launches in a party show`);
  assert.ok(near.filter(c => c.t > p.dur - F - 40 && c.t < p.dur - F).length >= 6, 'thicker in the build-up');
  assert.ok(near.every(c => c.h <= 0.8), 'low — never up at the sign');
  assert.ok(planShow('show', 7).cues.some(c => c.layer === 'near'), 'the weeknight show has a few too');
});

test('the party show builds to its finale → THE DRAGON EGGS → ends on the GOLD WILLOW CURTAIN (WINDOWS: the last order swapped)', () => {
  const p = planShow('party', 99), F = knob('fireworks.party').finale;
  const rate = (a, b) => p.cues.filter(c => c.t >= a && c.t < b).length / (b - a);
  assert.ok(rate(p.dur - F, p.dur - 14) > 2.2 * rate(20, p.dur - F), 'the finale far denser than the show');
  const curtain = p.cues.filter(c => c.type === 'willow' && c.c1 === 'gold' && c.big && c.t > p.dur - 12);
  assert.ok(curtain.length >= 8, 'a curtain of gold willows');
  const xs = curtain.map(c => c.x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.75, 'across the whole skyline');
  // PERF-A — THE CLOSING DRAGON EGGS across the FULL width (the owner, Nov 1: they were 4 over the right third)
  const eggs = p.cues.filter(c => c.type === 'crackle' && c.big && c.t > p.dur - 14);
  assert.ok(eggs.length >= 6 && eggs.length <= 8, `${eggs.length} dragon eggs at the end`);
  assert.ok(Math.min(...eggs.map(c => c.x)) < 0.12 && Math.max(...eggs.map(c => c.x)) > 0.88, 'left edge → right edge');
  assert.ok(eggs.every(c => c.t < Math.min(...curtain.map(q => q.t)) - 2), 'the eggs BEFORE the curtain (WINDOWS: the curtain is last)');
  // CITY CONTROLS A — THE FINALE's GAP: the willows LAUNCH 0.5–1.25 s after the eggs' burst (one continuous close, never a silent pause)
  { const L = Math.min(...curtain.map(c => c.t - c.rise)) - eggs[0].t; assert.ok(L >= 0.5 && L <= 1.25, `the curtain launches ${L} s after the eggs`); }
  assert.ok(p.cues.every(c => curtain.includes(c) || c.t < Math.min(...curtain.map(q => q.t))), 'nothing bursts after the curtain starts');
  // ...and the beat sync never flips them, whatever the grid (tempo + phase)
  for (const beat of [0.4, 0.5, 0.55, 0.62]) for (const b0 of [1000, 1000.13, 1000.31, 1000.5]) {
    const q = syncToBeat(p, 1000, () => ({ b0, beat, bar: 4, down: 0 }));
    const cu = q.cues.filter(c => c.type === 'willow' && c.c1 === 'gold' && c.big && c.t > q.dur - 14), eg = q.cues.filter(c => c.type === 'crackle' && c.big && c.t > q.dur - 16);
    assert.ok(Math.max(...eg.map(c => c.t)) + 2 < Math.min(...cu.map(c => c.t)), `beat ${beat} b0 ${b0}: eggs ${Math.max(...eg.map(c => c.t))} before the curtain ${Math.min(...cu.map(c => c.t))}`);
    // ...the willows LAUNCH on the next strong beat (or beat) 0.5–1.25 s after the eggs' burst — never a bar later
    const L = Math.min(...cu.map(c => c.t - c.rise)), gap = L - eg[0].t, onBeat = Math.abs(((L + 1000 - b0) / beat) - Math.round((L + 1000 - b0) / beat)) < 1e-6;
    assert.ok(gap >= 0.5 - 1e-6 && gap <= 1.25 + 1e-6 && onBeat, `beat ${beat} b0 ${b0}: the curtain launches ${gap.toFixed(3)} s after the eggs (on a beat: ${onBeat})`);
  }
  // CITY CONTROLS B — THE SWEEP (the owner's CC-A review): left → right, edge to edge, each willow LAUNCHING after the one to its left
  // — the owner's CC-B review: A FAST ROLLING CURTAIN (PART 10's first finale: the city in ~0.9 s) — curtainStep apart, synced or not (on
  // the song only the first willow takes the strong beat), the bursts in the same order
  for (const [q, beat] of [[p, null], ...[0.4, 0.5, 0.62].map(b => [syncToBeat(p, 1000, () => ({ b0: 1000.13, beat: b, bar: 4, down: 0 })), b])]) {
    const cu = q.cues.filter(c => c.type === 'willow' && c.c1 === 'gold' && c.big && c.t > q.dur - 14).sort((a, b) => a.x - b.x);
    assert.ok(cu[0].x <= 0.08 + 1e-9 && cu[cu.length - 1].x >= 0.92 - 1e-9, 'edge to edge');
    const step = knob('fireworks.party').curtainStep;
    { const span = (cu[cu.length - 1].t - cu[cu.length - 1].rise) - (cu[0].t - cu[0].rise); assert.ok(span <= 1.0, `beat ${beat}: the whole city in ${span.toFixed(2)} s (a fast rolling curtain, ≤ 1 s)`); }
    for (let k = 1; k < cu.length; k++) {
      const d = (cu[k].t - cu[k].rise) - (cu[k - 1].t - cu[k - 1].rise);
      assert.ok(Math.abs(d - step) < (beat == null ? 0.04 : 2e-3), `beat ${beat}: willow ${k} launches ${d.toFixed(3)} s after the one to its left (want ${step})`);
      assert.ok(cu[k].t > cu[k - 1].t, `beat ${beat}: willow ${k} bursts after the one to its left`);
    }
  }
  // WSP — ONE SALVO (the owner's PERF-B review): the same launch + the same burst for every egg, before + after the beat sync
  for (const q of [p, syncToBeat(p, 1000, t => ({ b0: 1000.13, beat: 0.5, bar: 4, down: 0 }))]) {
    const e = q.cues.filter(c => c.type === 'crackle' && c.big && c.t > q.dur - 16);
    assert.equal(e.length, 8, 'all eight eggs');
    assert.equal(new Set(e.map(c => c.t)).size, 1, `one burst moment (${e.map(c => c.t)})`);
    assert.equal(new Set(e.map(c => Math.round((c.t - c.rise) * 1000))).size, 1, 'one launch moment');
  }
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
