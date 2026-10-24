// CITY 2.0 — PART 8P: THE PEOPLE (+ section 0's pure pieces: the hush word sign, the lamps' life, the basement window, the crossing's
// light). node --test tests/harbor-people.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { hushPlan, hushState, strikeLevel, HUSH } from '../js/core/harbor-hush.js';
import { lampThresholds, warmUp, lampMoment, LAMP_LIFE } from '../js/core/harbor-lamps.js';

const SIZES = {
  '390x844': { W: 390, H: 844, safe: { top: 47, bottom: 34 } },
  '402x874': { W: 402, H: 874, safe: { top: 62, bottom: 34 } },
  '430x932': { W: 430, H: 932, safe: { top: 59, bottom: 34 } },
};
const setup = k => { const s = SIZES[k]; const cam = cameraFor(s.W, s.H, { dock: { x: 14, y: s.H - 116, w: s.W - 28, h: 76 } }, s.safe); return { cam, L: harborLayout(cam) }; };

// ------------------------------------------------------------------ THE HUSH WORD SIGN
test('8P — THE HUSH WORD SIGN: sized for 5 letters, never under 14 pt on a 390 / 402 / 430 phone, inside the shop window under its arch', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), s = L.speakeasy, K = cam.F / s.z0, win = s.shop.win;
    for (const w of ['JAZZ', 'OPEN', 'BLUES', 'SWING']) {
      const p = hushPlan(w, win);
      assert.ok(p.cap * K >= HUSH.minPt, `${k} ${w}: letters ${(p.cap * K).toFixed(1)} pt`);
      const [b0, b1, v0, v1] = p.board;
      assert.ok(b0 >= win[0] && b1 <= win[1] && v0 >= win[2] && v1 <= win[3], `${k} ${w}: the board inside the glass`);
      assert.ok(v1 <= win[2] + (win[3] - win[2]) * 0.66, `${k} ${w}: in the window's lower part (the arch above)`);
      for (const l of p.letters) assert.ok(l.u0 >= b0 && l.u0 + l.w <= b1 + 1e-9, `${k} ${w}: ${l.ch} on the board`);
      assert.ok(p.key.u0 + p.key.w < p.letters[0].u0, 'the keyhole beside the word');
      // the window's left edge (where the sign sits) is on screen
      const x0 = cam.VPX + cam.F * (s.x0 + win[0]) / s.z0;
      assert.ok(x0 > 4, `${k}: the shop window's left edge on screen (${x0.toFixed(1)} pt)`);
    }
    const four = hushPlan('JAZZ', win), five = hushPlan('BLUES', win);
    assert.equal(four.cap, five.cap, 'a 4-letter word keeps the 5-letter size');
  }
});
test('8P — THE HUSH WORD SIGN says: the lobby word day + night; no lobby → OPEN lit while the shop is open by day, dark at night', () => {
  assert.deepEqual(hushState({ word: 'jazz', shop: 'closed', night: 1 }), { text: 'JAZZ', lit: 1 });
  assert.deepEqual(hushState({ word: null, shop: 'open', night: 0 }), { text: 'OPEN', lit: 1 });
  assert.equal(hushState({ shop: 'closed', night: 0 }).lit, 0, 'before the opening: unlit');
  assert.equal(hushState({ shop: 'open', night: 1 }).lit, 0, 'dark at night with no lobby');
  // a new word re-lights letter by letter: the keyhole first, each letter later than the one before, all on in under ~2.5 s
  const first = i => { for (let t = 0; t < 5; t += 0.01) if (strikeLevel(i, t) > 0) return t; return 99; };
  assert.ok(first(-1) < first(0) && first(0) < first(1) && first(1) < first(4), 'strikes in turn');
  for (let i = -1; i < 5; i++) assert.equal(strikeLevel(i, 2.5), 1, 'all on');
  assert.ok([0.32, 0.36, 0.4, 0.45].some(t => strikeLevel(-1, t) < 0.5), 'a cold tube flickers as it catches');
});

// ------------------------------------------------------------------ THE LAMPS' LIFE
test('8P — THE LAMPS\' LIFE: one by one at dusk (a seeded order), a warm-up stutter, rare moments — never two at once, never the crossing pair during an event', () => {
  const th = lampThresholds(4, 1924);
  assert.equal(new Set(th.map(v => v.toFixed(4))).size, 4, 'each lamp its own moment');
  assert.ok(Math.min(...th) >= LAMP_LIFE.from - 1e-9 && Math.max(...th) <= LAMP_LIFE.to + 1e-9, 'inside the ramp');
  assert.notDeepEqual(th, [...th].sort((a, b) => a - b), 'not simply left → right');
  assert.equal(warmUp(-1), 0); assert.equal(warmUp(LAMP_LIFE.warm + 0.1), 1);
  assert.ok(warmUp(0.03) > 0.5 && warmUp(0.1) < 0.2, 'a flash, then dark: the stutter');
  for (let u = 0.4; u < LAMP_LIFE.warm; u += 0.1) assert.ok(warmUp(u + 0.1) >= warmUp(u) - 1e-9, 'then a steady climb');
  // a day of moments: how often, which lamp, one at a time, the skip list
  let n = 0, outs = 0; const day = 86400e3, at0 = Date.UTC(2026, 9, 22);
  const seen = new Set();
  for (let ms = at0; ms < at0 + day; ms += LAMP_LIFE.slot * 1000) {
    const m = lampMoment(ms + 1000, 4, { skip: [0, 1] });
    if (!m) continue;
    n++; if (m.kind === 'out') outs++; seen.add(m.i);
    assert.ok(![0, 1].includes(m.i), 'never a skipped lamp');
    assert.ok(m.at >= Math.floor((ms + 1000) / 1000 / LAMP_LIFE.slot) * LAMP_LIFE.slot * 1000, 'inside its slot');
    assert.ok(m.len < LAMP_LIFE.slot - 30, 'short');
    assert.equal(m.level(m.at - 1), 1); assert.equal(m.level(m.at + m.len * 1000 + 1), 1);
    const lows = []; for (let t = m.at; t < m.at + m.len * 1000; t += 20) lows.push(m.level(t));
    assert.ok(Math.min(...lows) < 0.5, 'a visible dip');
  }
  const slots = day / 1000 / LAMP_LIFE.slot;
  assert.ok(n > slots * 0.3 && n < slots * 0.7, `rare: ${n} moments in ${slots} slots (one lamp at most each)`);
  assert.ok(outs > 0 && outs < n * 0.4, `the outage rarer (${outs} of ${n})`);
  assert.deepEqual([...seen].sort(), [2, 3]);
  assert.equal(lampMoment(at0, 2, { skip: [0, 1] }), null, 'nothing when every lamp is skipped');
  // the same moment on every phone
  assert.deepEqual(JSON.stringify(lampMoment(at0 + 5e6, 4)), JSON.stringify(lampMoment(at0 + 5e6, 4)));
});

// ------------------------------------------------------------------ THE BASEMENT WINDOW + THE CROSSING'S LIGHT (their DOM-free parts)
test('8P — THE BASEMENT WINDOW: shadows pass now and then, the beat lifts it on party nights, a flicker only rarely; brighter at night', async () => {
  globalThis.document = globalThis.document || { createElement: () => ({ getContext: () => null }) };
  const { basementLight, BASEMENT } = await import('../js/screens/harbor/speakeasy.js');
  let passing = 0, flicks = 0; const N = 3600 * 4;
  for (let t = 0; t < N; t += 0.25) { const b = basementLight(t, { night: 1 }); if (b.shadows.length) passing++; if (b.flick) flicks++; }
  const share = passing / (N / 0.25);
  assert.ok(share > 0.08 && share < 0.4, `people pass now and then (${(share * 100).toFixed(0)} % of the time)`);
  assert.ok(flicks > 0 && flicks / (N / 0.25) < 0.003, `a rare flicker (${flicks} quarter-seconds in 4 h)`);
  const still = t => { for (; ; t += 0.25) { const b = basementLight(t); if (!b.shadows.length && !b.flick) return t; } };
  const t0 = still(0);
  assert.ok(basementLight(t0, { night: 1 }).a > basementLight(t0, { night: 0 }).a, 'brighter at night');
  assert.ok(basementLight(t0, { night: 1, beat: 1 }).a > basementLight(t0, { night: 1 }).a * (1 + BASEMENT.beat * 0.9), 'the beat lifts it');
});
test('8P — THE CROSSWALK LIT: the two lamps framing it light the crossing — brightest on the stripes nearest the promenade, fading across', async () => {
  const { crossLightOf, crossPools } = await import('../js/screens/harbor/road.js');
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k), cw = L.crosswalk, f = crossLightOf(L), mid = (cw.x0 + cw.x1) / 2;
    assert.equal(crossPools(L).length, 2, `${k}: the pair`);
    assert.ok(f(mid, 56.5) > 1, `${k}: the pools overlap on the crossing (${f(mid, 56.5).toFixed(2)})`);
    for (const x of [cw.x0, mid, cw.x1]) assert.ok(f(x, 55.5) > 0.6, `${k}: lit across its width`);
    assert.ok(f(mid, 63.9) < 0.2, `${k}: fading by the far kerb`);
  }
});
