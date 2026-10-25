// CITY 2.0 — C2 Group 3b: THE FAR BOATS TURN IN OPEN WATER (core/harbor-boats.js#boatRoutes `openAt`, #tableAt the fishing tug's
// dawn). PURE: node --test tests/harbor-boats.test.mjs
// The owner (his iPhone): "the far tug + the sailboats never turn behind the lighthouse (turn in open water)" — the tug's idle +
// swing, the sloops' tacks and the fishing tug's dawn swing never stand behind the lighthouse + the keeper's cottage on screen,
// nor behind docked Rosie; the timetables unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout, REF_TITLE } from '../js/core/harbor-layout.js';
import { boatRoutes, boatAt, FISH, FISH_TURN } from '../js/core/harbor-boats.js';

const OFF = -240;
const SIZES = [[390, 844], [402, 874], [430, 932], [412, 915], [874, 402], [1440, 900]];
const setup = (W, H) => { const cam = cameraFor(W, H, { tag: REF_TITLE.tag, dock: { ...REF_TITLE.dock, w: W - 28, y: H - 116 } }, REF_TITLE.safe); return { cam, L: harborLayout(cam, 1924) }; };
const local = (y, m, d, h) => (Date.UTC(y, m - 1, d) / 1000 - OFF * 60 + h * 3600) * 1000;

// the screen span a boat covers at a state (its hull's corners, broadside → bow-on, + a hair for the bowsprit / the fender)
const span = (cam, r, st) => {
  const fx = Math.cos(st.hd), fz = Math.sin(st.hd), b = r.len * 0.18, out = [];
  for (const [f, s] of [[r.len / 2, 0], [-r.len / 2, b], [-r.len / 2, -b], [r.len * 0.3, b], [r.len * 0.3, -b]]) out.push(cam.VPX + cam.F * (st.x + fx * f + fz * s) / (st.z + fz * f - fx * s));
  return [Math.min(...out), Math.max(...out)];
};
const blocked = (cam, L, rosie) => {
  const P = (x, z) => cam.VPX + cam.F * x / z, lh = L.lighthouse, co = L.cottage;
  return [
    ['the lighthouse + the cottage', P(lh.x - lh.r0, lh.z), P(co.x + co.w + 0.4, co.z + 1)],
    ['docked Rosie', P(rosie.lane[0] - rosie.len / 2, rosie.z), P(rosie.lane[0] + rosie.len / 2, rosie.z)],
  ];
};

test('C2 — OPEN WATER: the tug\'s idle + swing and the sloops\' tacks never behind the lighthouse, the cottage or docked Rosie — at every size', () => {
  for (const [W, H] of SIZES) {
    const { cam, L } = setup(W, H), R = boatRoutes(L), rosie = R.find(r => r.id === 'rosie'), B = blocked(cam, L, rosie);
    for (const r of R.filter(r => r.id === 'tug' || r.id.startsWith('sail'))) {
      let seen = 0;
      const c0 = Date.UTC(2026, 9, 26, 12);
      for (let s = 0; s < r.period; s += 0.5) {
        const st = boatAt(r, c0 + s * 1000, () => r.when === 'night');
        if (!st.on || (st.seg !== 'turn' && st.seg !== 'hold')) continue;
        seen++;
        const [a, b] = span(cam, r, st);
        for (const [what, x0, x1] of B) assert.ok(b < x0 || a > x1, `${W}x${H}: ${r.id}'s ${st.seg} (${a.toFixed(0)}..${b.toFixed(0)} pt) behind ${what} (${x0.toFixed(0)}..${x1.toFixed(0)})`);
        // (on screen: bow-on fully, broadside at most a few pt past the edge — never a turn half off it)
        assert.ok(a > 0 && (b <= W + 2 || Math.abs(Math.cos(st.hd)) > 0.5), `${W}x${H}: ${r.id}'s ${st.seg} off the screen (${a.toFixed(0)}..${b.toFixed(0)})`);
      }
      // (C2: on a phone the second sloop stays out — the strip right of the cottage is the first's)
      if (r.id === 'sail2' && !r.segs.some(g => g.type !== 'away')) continue;
      assert.ok(seen > 20, `${W}x${H}: ${r.id} turns / idles at all (${seen})`);
    }
  }
});

test('C2 — OPEN WATER: the fishing tug backs out of its mooring and swings in the open (never behind docked Rosie or the lighthouse), on the same dawn timetable', () => {
  for (const [W, H] of SIZES) {
    const { cam, L } = setup(W, H), R = boatRoutes(L), rosie = R.find(r => r.id === 'rosie'), fish = R.find(r => r.id === 'fish'), B = blocked(cam, L, rosie);
    const out = local(2026, 10, 26, FISH.out), at = s => boatAt(fish, out + s * 1000, undefined, { off: OFF });
    assert.ok(Math.abs(at(-5).hd - Math.PI) < 1e-9 && at(-5).moored, `${W}x${H}: moored bow toward the pier`);
    assert.ok(at(FISH_TURN.back / 2).astern && at(FISH_TURN.back / 2).lantern && Math.abs(at(FISH_TURN.back / 2).hd - Math.PI) < 1e-9, `${W}x${H}: backing out, its lantern lit`);
    let swung = 0;
    for (let s = FISH_TURN.back; s < FISH_TURN.back + FISH_TURN.d; s += 0.5) {
      const st = at(s); assert.equal(st.seg, 'turn');
      if (Math.abs(Math.sin(st.hd)) > 0.05) swung++;
      const [a, b] = span(cam, fish, st);
      for (const [what, x0, x1] of B) assert.ok(b < x0 || a > x1, `${W}x${H}: the fishing tug's swing (${a.toFixed(0)}..${b.toFixed(0)} pt) behind ${what} (${x0.toFixed(0)}..${x1.toFixed(0)})`);
      assert.ok(b <= W + 2, `${W}x${H}: the fishing tug's swing off the screen (${b.toFixed(0)})`);
    }
    assert.ok(swung > 40, 'it swings');
    assert.ok(Math.sin(at(FISH_TURN.back + FISH_TURN.d / 2).hd) < -0.9, `${W}x${H}: mid-swing its bow toward us`);
    const lead = FISH_TURN.back + FISH_TURN.d + 10;
    assert.ok(Math.abs(Math.cos(at(lead).hd) - 1) < 1e-9 && at(lead + 10).x > at(lead).x, `${W}x${H}: then out bow-first to the right`);
    assert.equal(at(FISH.move + 1).seg, 'away', `${W}x${H}: gone by the same moment (${FISH.move} s after it casts off)`);
    // the heading never jumps (≤ 10° a second)
    for (let s = -2; s < FISH.move; s += 1) { const d = Math.abs(((at(s + 1).hd - at(s).hd + 3 * Math.PI) % (2 * Math.PI)) - Math.PI); assert.ok(d < 10 * Math.PI / 180, `${W}x${H}: its heading jumps ${(d * 180 / Math.PI).toFixed(1)}° at ${s} s`); }
  }
});

test('C2 — the far boats\' timetables unchanged: the same periods + offsets, the tug + the sloops in the water the same seconds of each cycle', () => {
  const { L } = setup(402, 874), R = boatRoutes(L);
  for (const [id, period, offset] of [['tug', 600, 356], ['sail', 600, 490], ['sail2', 600, 400]]) {
    const r = R.find(x => x.id === id);
    assert.equal(r.period, period); assert.equal(r.offset, offset);
    const inWater = r.segs.filter(g => g.type !== 'away').reduce((s, g) => s + g.d, 0);
    assert.equal(inWater, id === 'tug' ? 376 : id === 'sail2' ? 0 : 418, `${id}: in the water the same time each cycle (C2: the second sloop stays out on a phone)`);
  }
  // the tug's bow-on idle (phones): its heading swings π → 3π/2 (toward us), holds, → 2π — never a flip
  const tug = R.find(x => x.id === 'tug'), c0 = Date.UTC(2026, 9, 27, 2);
  let prev = null;
  for (let s = 0; s < tug.period; s += 1) {
    const st = boatAt(tug, c0 + s * 1000, () => true);
    if (prev && st.on && prev.on) { const d = Math.abs(((st.hd - prev.hd + 3 * Math.PI) % (2 * Math.PI)) - Math.PI); assert.ok(d < 16 * Math.PI / 180, `the tug's heading jumps ${(d * 180 / Math.PI).toFixed(1)}°`); }
    prev = st;
  }
});

test('C2 — the second sloop: out of the harbor on a phone (one strip of open water), both sloops on a wide screen', () => {
  for (const [W, H, both] of [[390, 844, false], [402, 874, false], [1440, 900, true]]) {
    const R = boatRoutes(setup(W, H).L), s2 = R.find(x => x.id === 'sail2');
    assert.equal(s2.segs.some(g => g.type !== 'away'), both, `${W}x${H}`);
  }
});

