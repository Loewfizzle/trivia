// CITY 2.0 — THE HARBOR: the camera, the layout per screen size, the SIZE rules and the events scheduler (pure; docs/harbor.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { REF, Z, SIZE, units, ptAt, cameraFor, project, xAt, groundY, squeeze, harborLayout, screenBoxes, SUN_GAPS, LANE_MIN, laneMin, roofline } from '../js/core/harbor-layout.js';
import { winHash, winTraits, buildingDice, isLit, layoutText, lineWidth, glyph, FONT_H } from '../js/core/harbor-windows.js';
import { LANES, SLOT_MS, RARITY, BUDGET, QUIET, defineEvent, schedule, createScheduler, anchorFor, densityOf, startChance, HARBOR_EVENTS } from '../js/core/harbor-events.js';

// the title's real rects at each size (measured from the real title, Oct 20 2026, with iPhone safe areas)
const SIZES = {
  '390x844': { W: 390, H: 844, tag: { y: 296, h: 14 }, dock: { x: 14, y: 728, w: 362, h: 76 }, safe: { top: 47, bottom: 34 } },
  '402x874': { W: 402, H: 874, tag: { y: 319, h: 14 }, dock: { x: 14, y: 758, w: 374, h: 76 }, safe: { top: 62, bottom: 34 } },
  '412x915': { W: 412, H: 915, tag: { y: 308, h: 14 }, dock: { x: 14, y: 799, w: 384, h: 76 }, safe: { top: 47, bottom: 34 } },
  '430x932': { W: 430, H: 932, tag: { y: 322, h: 14 }, dock: { x: 14, y: 816, w: 402, h: 76 }, safe: { top: 59, bottom: 34 } },
  '874x402': { W: 874, H: 402, tag: { y: 179, h: 14 }, dock: { x: 227, y: 305, w: 420, h: 70 }, safe: { top: 0, bottom: 21 } },
  '1440x900': { W: 1440, H: 900, tag: { y: 351, h: 15 }, dock: { x: 510, y: 794, w: 420, h: 86 }, safe: { top: 0, bottom: 0 } },
};
// the sign + the corner buttons, relative to the tagline (measured from the real title, Oct 21 2026)
const signOf = s => { const wide = s.W > s.H, desk = wide && s.W >= 1000;
  return { neon: { x: s.W / 2 - 140, y: s.tag.y - (desk ? 205 : wide ? 121 : 141), w: 280, h: desk ? 125 : wide ? 72 : 85 }, word: { x: s.W / 2 - 150, y: s.tag.y - 34, w: 300, h: 21 }, corner: { x: s.W - 56, y: s.safe.top + 10, w: 44, h: 90 } }; };
const setup = k => { const s = SIZES[k]; const cam = cameraFor(s.W, s.H, { tag: s.tag, dock: s.dock, ...signOf(s) }, s.safe); return { s, cam, L: harborLayout(cam) }; };
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('the projector: the mockup camera at the reference phone', () => {
  const cam = { W: 402, H: 874, VPX: 201, VPY: REF.VPY, F: REF.F, CAMH: REF.CAMH };
  assert.deepEqual(project(cam, 0, REF.CAMH, 100), [201, 540]);              // eye height sits on the horizon
  const [x, y] = project(cam, 10, 0, 50);
  assert.equal(x, 201 + 600 * 10 / 50); assert.equal(y, 540 + 600 * 13.5 / 50);
  assert.ok(Math.abs(xAt(cam, x, 50) - 10) < 1e-9);
  assert.equal(groundY(cam, 50), y);
  // the mockup's reference sizes: the 11-unit bus at z 60 is 110 pt
  assert.equal(ptAt(cam, 11, 60), 110);
});

test('SIZE rules: world units ↔ pt at the reference phone', () => {
  const cam = { F: REF.F };
  for (const [name, r] of Object.entries(SIZE)) assert.ok(Math.abs(ptAt(cam, units(name), r.z) - r.pt) < 1e-9, name);
  assert.ok(units('person') > 1.4 && units('person') < 1.7);
  assert.ok(Math.abs(units('bus') - 11) < 0.01);
});

test('the squeeze: monotonic, the tallest lands on the limit, low roofs untouched', () => {
  const { cam } = setup('402x874');
  const yMax = cam.VPY + cam.F * (cam.CAMH - 125) / 255;
  const sq = squeeze(cam, yMax);
  assert.ok(sq.s < 1 && sq.s > 0.3);
  const top = h => cam.VPY + cam.F * (cam.CAMH - sq(h, 255)) / 255;
  assert.ok(Math.abs(top(125) - cam.limitY) < 0.5, 'the tallest crown stops at the limit');
  let prev = -1;
  for (let h = 0; h <= 125; h += 2.5) { const v = sq(h, 255); assert.ok(v >= prev - 1e-9, 'taller stays taller'); prev = v; }
  assert.equal(sq(10, 255), 10, 'a low roof is not squeezed');
  // the tall shrink more than the low: the ratio falls with height
  assert.ok(sq(125, 255) / 125 < sq(70, 255) / 70);
});

for (const k of Object.keys(SIZES)) {
  test(`layout ${k}: no reserved zone violated`, () => {
    const { s, cam, L } = setup(k);
    const boxes = screenBoxes(L);
    // the skyline stops under the tagline (crowns included)
    for (const b of boxes.filter(b => b.kind === 'sky')) assert.ok(b.y >= cam.limitY - 0.6, `${b.id} top ${b.y.toFixed(1)} above the limit ${cam.limitY}`);
    assert.ok(cam.limitY >= s.tag.y + s.tag.h + 9.5);
    // the landmarks stay the tallest (a landmark's top is the highest on screen)
    const sky = boxes.filter(b => b.kind === 'sky');
    const best = sky.reduce((a, b) => (b.y < a.y ? b : a));
    assert.ok(L.landmarks.some(l => l.id === best.id), `the highest is ${best.id}`);
    // nothing alive under the dock
    for (const b of boxes.filter(b => b.kind === 'alive')) assert.ok(!overlap(b, { ...s.dock, h: s.H }), `${b.id} under the dock`);
    // the door: on screen, ≥ 44 pt, clear of the dock and the corner buttons
    const d = L.door.rect;
    assert.ok(d.w >= 44 && d.h >= 44);
    assert.ok(d.x >= 0 && d.x + d.w <= s.W && d.y >= 0, 'the door is on screen');
    assert.ok(!overlap(d, s.dock), 'the door clear of the dock');
    assert.ok(!overlap(d, { x: s.W - 60, y: 0, w: 60, h: 160 }), 'the door clear of the corner buttons');
    // the bands keep their order and some depth: the water and the promenade are visible
    assert.ok(groundY(cam, Z.rail) - groundY(cam, Z.quay) > (cam.wide && s.H < 500 ? 12 : 40), 'the water reads');
    assert.ok(cam.dock.y - groundY(cam, Z.road[0]) > (s.H < 500 ? 10 : 40), 'the promenade reads');
    // the speakeasy bleeds off the left edge
    assert.ok(project(cam, L.speakeasy.x0, 0, L.speakeasy.z0)[0] < 0);
    assert.ok(project(cam, L.speakeasy.x1, 0, L.speakeasy.z0)[0] > 40);
  });

  test(`layout ${k}: the sizes`, () => {
    const { s, cam, L } = setup(k);
    const person = ptAt(cam, units('person'), SIZE.person.z), bus = ptAt(cam, L.bus.len, L.bus.z);
    if (!cam.wide) {
      // the SIZE rules on a phone held upright (390–430 pt follow the width)
      const f = s.W / REF.W;
      assert.ok(person > 17 * f && person < 23 * f, `person ${person}`);
      assert.ok(bus > 100 * f && bus < 120 * f, `bus ${bus}`);
      assert.ok(ptAt(cam, L.cars[0].len, L.cars[0].z) > 48 * f && ptAt(cam, L.cars[0].len, L.cars[0].z) < 62 * f);
      assert.ok(ptAt(cam, L.lamps[0].h, L.lamps[0].z) > 45 * f && ptAt(cam, L.lamps[0].h, L.lamps[0].z) < 55 * f);
      assert.ok(ptAt(cam, L.trees[0].r * 2, L.trees[0].z) > 36 * f && ptAt(cam, L.trees[0].r * 2, L.trees[0].z) < 44 * f);
      assert.ok(ptAt(cam, L.signals[0].h, L.signals[0].z) > 50 * f && ptAt(cam, L.signals[0].h, L.signals[0].z) < 60 * f);
    } else if (s.H < 500) {
      assert.ok(person >= 8.5, `sideways people ${person}`);   // the owner's call: the whole city, smaller
    } else {
      assert.ok(person > 17 && person < 23, `desktop person ${person}`);
      assert.ok(cam.spread > 2, 'a panorama, not a stretched phone');
    }
  });
}

// the screen span of a box (its side face toward the middle included)
const spanOf = (cam, b) => { const a = project(cam, b.x0, 0, b.z0)[0], c = project(cam, b.x1, 0, b.z0)[0]; return [b.x0 > 0 ? project(cam, b.x0, 0, b.z1)[0] : a, b.x1 < 0 ? project(cam, b.x1, 0, b.z1)[0] : c]; };
const topOf = (cam, b) => project(cam, 0, (b.y0 || 0) + b.h + (b.crown ? b.crown.h : 0), b.z0)[1];
const PHONES = ['390x844', '402x874', '412x915', '430x932'];

test('layout: the sun gaps are clear against the WHOLE silhouette (towers, landmarks, heroes, the panorama) — finding 1', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k);
    assert.ok(L.gaps.length >= SUN_GAPS.length, `${k}: every corridor`);
    for (const g of L.gaps) {
      const g0 = g.sx - g.w / 2, g1 = g.sx + g.w / 2;
      for (const t of L.towers) for (const tr of t.tiers) { const [a, b] = spanOf(cam, tr); assert.ok(b <= g0 || a >= g1, `${k}: ${t.id} stands in the corridor at ${g.sx.toFixed(0)}`); }
      // a hero block on the quay is the base itself: under a corridor only if its roof is no higher than the base's floor
      const HZ = groundY(cam, Z.quay), u = cam.F / REF.F;
      for (const h of L.heroes) { const [a, b] = spanOf(cam, h); assert.ok(b <= g0 || a >= g1 || topOf(cam, h) >= HZ - 78 * u - 1, `${k}: the ${h.id} block stands in the corridor at ${g.sx.toFixed(0)}`); }
    }
  }
});

test('layout: a corridor clips the bands, never drops them — the base under it stays one dense wall, a farther band fills in — finding 4', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k);
    const HZ = groundY(cam, Z.quay), u = cam.F / REF.F;
    for (const g of L.cuts) {
      const g0 = g.sx - g.w / 2, g1 = g.sx + g.w / 2;
      for (const bd of L.bands) {
        // nothing of the band rises above its floor inside the corridor
        for (const b of bd.blocks) { const [a, c] = spanOf(cam, b); if (c > g0 + 0.5 && a < g1 - 0.5) assert.ok(topOf(cam, b) >= HZ - g.floor[bd.id] * u - 0.6, `${k}: a ${bd.id} block rises into the corridor at ${g.sx.toFixed(0)}`); }
      }
      // …and the near band covers the corridor's whole width (no hole through the city), its floor well above the quay
      if (g.sx < 4 || g.sx > cam.W - 4) continue;
      for (let sx = Math.max(0, g0); sx <= Math.min(cam.W, g1); sx += 1) {
        const cover = [...L.bands.find(b => b.id === 'near').blocks, ...L.heroes].some(b => { const [a, c] = spanOf(cam, b); return a <= sx + 0.01 && c >= sx - 0.01 && topOf(cam, b) < HZ - 20 * u; });
        assert.ok(cover, `${k}: a hole in the base at x ${sx.toFixed(1)} (the corridor at ${g.sx.toFixed(0)})`);
      }
    }
  }
});

test('layout: every upright phone shows the same skyline (one squeeze), the crown at the limit on the tightest, never past it', () => {
  const ref = setup('402x874');
  for (const k of PHONES) {
    const { cam, L } = setup(k);
    assert.ok(Math.abs(L.squeeze - ref.L.squeeze) < 1e-9, `${k}: squeeze ${L.squeeze} vs ${ref.L.squeeze}`);
    for (const t of L.towers) { const r = ref.L.towers.find(x => x.id === t.id); assert.ok(Math.abs(t.h - r.h) < 1e-6 && Math.abs(t.x0 - r.x0) < 1e-6, `${k}: ${t.id} as on the reference phone`); }
    const top = Math.min(...screenBoxes(L).filter(b => b.kind === 'sky').map(b => b.y));
    assert.ok(top >= cam.limitY - 0.6, `${k}: the tallest crown ${top.toFixed(1)} past the limit ${cam.limitY}`);
    if (k === '402x874') assert.ok(top - cam.limitY < 2.5, `the tallest crown lands on the limit on the reference phone (${top.toFixed(1)} vs ${cam.limitY})`);
  }
  assert.ok(ref.L.squeeze > 0.55 && ref.L.squeeze < 0.85, `a gentle squeeze keeps the peaks apart (${ref.L.squeeze.toFixed(2)})`);
});

test('layout: the hierarchy — the sunburst tallest, the EMPIRE second, one gold crown, the middle tier and the bands well under them', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k);
    const top = id => topOf(cam, L.towers.find(t => t.id === id).tiers.at(-1));
    const centre = L.towers.filter(t => !t.id.startsWith('pano'));
    const order = [...centre].sort((a, b) => topOf(cam, a.tiers.at(-1)) - topOf(cam, b.tiers.at(-1))).map(t => t.id);
    assert.equal(order[0], 'sunburst', `${k}: ${order.join(' ')}`);
    assert.ok(top('empire') <= Math.min(...centre.filter(t => !['sunburst', 'empire'].includes(t.id)).map(t => topOf(cam, t.tiers.at(-1)))) + 1, `${k}: the EMPIRE second`);
    assert.equal(L.towers.filter(t => t.gold).length, 1, 'one gold crown');
    const bandTop = Math.min(...L.bands.flatMap(b => b.blocks).map(b => topOf(cam, b)));
    assert.ok(bandTop > top('needle') + 10, `${k}: the bands stay under the towers (${bandTop.toFixed(0)} vs the needle ${top('needle').toFixed(0)})`);
  }
});

test('layout: the Ferris wheel stands on its pier over water — legs clear of the speakeasy, its deck below the roofline, clear of the word towers and the hero crowns', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k);
    const w = L.wheel, s = L.speakeasy, [cx, cy] = project(cam, w.x, w.y, w.z), r = cam.F * w.r / w.z, [, deck] = project(cam, w.x, L.pier.y, w.z);
    const back = project(cam, s.x1, 0, s.z1)[0], roof = project(cam, s.x1, s.h, s.z0)[1];
    assert.ok(cx - w.leg * r >= back + 10, `${k}: the left leg ${(cx - w.leg * r).toFixed(0)} vs the speakeasy ${back.toFixed(0)}`);
    assert.ok(deck >= roof + 6, `${k}: the deck ${deck.toFixed(0)} is not level with the roofline ${roof.toFixed(0)}`);
    assert.ok(deck < groundY(cam, Z.rail) - 20 * cam.F / REF.F, `${k}: water in front of the pier`);
    const wheelBox = { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r };
    for (const t of L.towers) {
      const tr = t.tiers.at(-1);
      if (t.word) { const f = t.tiers[0]; const [a, b] = spanOf(cam, f); assert.ok(!overlap(wheelBox, { x: a, y: t.face.y - 200, w: b - a, h: 200 }), `${k}: the wheel over ${t.id}`); }
      if (t.rank === 'hero' && tr.crown) { const [a, b] = spanOf(cam, tr); const y1 = topOf(cam, tr), y0 = project(cam, 0, tr.y0 + tr.h, tr.z0)[1]; assert.ok(!overlap(wheelBox, { x: a, y: y1, w: b - a, h: y0 - y1 }), `${k}: the wheel over the ${t.id}'s crown`); }
    }
  }
});

test('layout: the word towers — windows big enough for letters, rows enough for two lines (A, B) and three letters (V), nothing in front of the face', () => {
  for (const k of PHONES) {
    const { cam, L } = setup(k);
    for (const t of L.towers.filter(t => t.word)) {
      const g = t.tiers[0].win, colPt = cam.F * g.pitch[0] / t.z0, rowPt = cam.F * g.pitch[1] / t.z0;
      assert.ok(colPt >= 2.5 && rowPt >= 4.3, `${k}: ${t.id} windows ${colPt.toFixed(1)}×${rowPt.toFixed(1)} pt`);
      // (A: two lines · B: one line (it takes the last word of a long message) · V: three letters)
      assert.ok(t.face.rows >= (t.word === 'v' ? 17 : t.id === 'wordB' ? FONT_H + 2 : 11), `${k}: ${t.id} ${t.face.rows} free rows`);
      // the face (from its lowest word row up) is clear of everything nearer
      const [a, b] = spanOf(cam, t.tiers[0]);
      for (const o of [...L.bands.flatMap(d => d.blocks), ...L.heroes, ...L.towers]) {
        if (o === t || o.z0 >= t.z0) continue;
        const boxes = o.tiers || [o];
        for (const ob of boxes) { const [c, d] = spanOf(cam, ob); if (d > a + 1 && c < b - 1) assert.ok(topOf(cam, ob) >= t.face.y - 0.6, `${k}: ${o.id} covers ${t.id}'s words`); }
      }
    }
  }
});

test('windows: every building has a grid; the grids and the dice survive a relayout (finding 5)', () => {
  const a = setup('402x874').L;
  const s = SIZES['402x874'], cam2 = cameraFor(s.W, s.H, { tag: { y: s.tag.y + 3, h: 14 }, dock: s.dock, ...signOf(s) }, s.safe), b = harborLayout(cam2);
  for (const bd of a.bands) for (const blk of bd.blocks) assert.ok(blk.win && blk.win.cols >= 1 && Number.isFinite(blk.win.u0), `${blk.id} has a grid`);
  for (const t of a.towers) for (const tr of t.tiers) assert.ok(tr.win && tr.win.pitch.length === 2, `${t.id} tier has a grid`);
  const ids = L => L.bands.flatMap(d => d.blocks.map(x => `${x.id}:${x.seed}`));
  assert.deepEqual(ids(a), ids(b), 'the same buildings, the same seeds');
  const tw = id => a.towers.find(t => t.id === id), tw2 = id => b.towers.find(t => t.id === id);
  assert.equal(tw('wordA').seed, tw2('wordA').seed);
  assert.equal(tw('wordA').tiers[0].win.cols, tw2('wordA').tiers[0].win.cols);
});

test('windows: the light timeline is City 1.0\'s — each window one order; more of the night = a superset of the lit set', () => {
  const dice = buildingDice(12345, 'band');
  const lit = share => { const out = []; for (let r = 0; r < 30; r++) for (let c = 0; c < 8; c++) { const t = winTraits(12345, 0, c, r, dice); if (isLit(t, share)) out.push(`${c},${r}`); } return out; };
  const l3 = lit(0.32), l9 = lit(0.9), l1 = lit(1);
  assert.ok(l3.every(w => l9.includes(w)) && l9.every(w => l1.includes(w)), 'nested: dusk lights them in one order, the night puts them out in reverse');
  assert.ok(l3.length > 0 && l3.length < l1.length);
  assert.deepEqual(lit(0.5), lit(0.5), 'deterministic');
  assert.equal(lit(0).length, 0, 'none by day');
  assert.equal(winHash(1, 2, 3, 4), winHash(1, 2, 3, 4));
});

test('windows: words — the font, one line, two lines, across two towers, down the tall tower', () => {
  const towers = { wordA: { cols: 19, rows: 11, word: 'h' }, wordB: { cols: 15, rows: 12, word: 'h' }, wordV: { cols: 5, rows: 18, word: 'v' } };
  const one = layoutText('HELLO', towers);
  assert.equal(one.length, 1); assert.equal(one[0].tower, 'wordA'); assert.equal(one[0].rows, FONT_H);
  assert.ok(one[0].cells.every(([c, r]) => c >= 0 && c < 19 && r >= 0 && r < 11));
  assert.equal(layoutText('2027', towers)[0].tower, 'wordA');
  const boo = layoutText('BOO', towers);
  assert.equal(boo[0].tower, 'wordV'); assert.equal(boo[0].rows, 17);
  const hny = layoutText('HAPPY NEW YEAR', towers);
  assert.deepEqual(hny.map(p => p.tower), ['wordA', 'wordB']);
  assert.equal(hny[0].rows, 2 * FONT_H + 1);
  assert.ok(layoutText('<3', towers)[0].cells.length > 10, 'a heart');
  assert.equal(layoutText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', towers), null, 'too long: nothing, never a cut word');
  assert.equal(lineWidth('2027'), 15);
  for (const ch of '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ♥★⚑') assert.ok(glyph(ch) && glyph(ch).length === FONT_H, `glyph ${ch}`);
});

test('events: the searchlights and the words in the windows run only at night', () => {
  const day = ms => ({ ms, force: new Set(), night: false }), night = ms => ({ ms, force: new Set(), night: true });
  const t = Date.UTC(2026, 9, 21, 12), runs = (ctx) => { const sc = createScheduler(HARBOR_EVENTS, ctx, { anchor: t }); const seen = new Set(); for (let ms = t; ms < t + 60 * 864e5; ms += SLOT_MS) for (const e of sc.at(ms).active) if (e.id === 'searchlights' || e.id === 'spell') seen.add(`${e.id}@${e.start}`); return [...seen]; };
  assert.equal(runs(day).length, 0, 'never by day');
  const n = runs(night);
  assert.ok(n.some(s => s.startsWith('spell')), 'a word now and then (weekly)');
  assert.ok(n.filter(s => s.startsWith('spell')).length < 30, 'not every night');
  assert.ok(HARBOR_EVENTS.find(e => e.id === 'searchlights').lanes.includes('skyline'));
});

test('layout: the lanes are places — on screen, clear of the sign and the corner buttons, tall enough for what runs there', () => {
  for (const k of Object.keys(SIZES)) {
    const { s, cam, L } = setup(k);
    assert.deepEqual(Object.keys(L.lanes).sort(), [...LANES].sort(), `${k}: a rect per lane`);
    const sign = signOf(s);
    for (const [id, r] of Object.entries(L.lanes)) {
      assert.ok(r.x >= 0 && r.x + r.w <= s.W + 0.01 && r.y >= cam.safeTop && r.y + r.h <= s.H, `${k}: ${id} on screen`);
      assert.ok(r.h >= laneMin(cam, id), `${k}: ${id} ${r.h.toFixed(1)} pt tall (≥ ${laneMin(cam, id).toFixed(1)})`);
      for (const [n, z] of [['neon', sign.neon], ['word', sign.word], ['tag', s.tag], ['corner buttons', sign.corner], ['dock', s.dock]]) if (!(id === 'tagline' && n === 'tag')) assert.ok(!overlap(r, { w: s.W, ...z }), `${k}: ${id} over the ${n}`);
    }
    // a banner plane needs a long strip; a parade needs the promenade's whole width; sky-low grows when the tagline goes
    assert.ok(L.lanes['sky-high'].w >= s.W * 0.6, `${k}: sky-high ${L.lanes['sky-high'].w} wide`);
    assert.ok(L.lanes.promenade.w >= s.W * 0.99);
    assert.ok(L.lanes['sky-low'].y0NoTag < L.lanes['sky-low'].y && L.lanes['sky-low'].y0NoTag > sign.word.y + sign.word.h);
    assert.ok(L.lanes.promenade.h >= 2 * ptAt(cam, units('person'), Z.ref), `${k}: a float two people tall fits the promenade`);
    assert.ok(roofline(L).every(v => v >= cam.limitY - 0.6));
  }
});

test('layout: deterministic (the same seed, the same city)', () => {
  const a = setup('402x874').L, b = setup('402x874').L;
  assert.deepEqual(a.bands.map(x => x.blocks.length), b.bands.map(x => x.blocks.length));
  assert.deepEqual(a.bands[1].blocks[3], b.bands[1].blocks[3]);
});

// ---------------------------------------------------------------- events
const ctxAt = force => ms => ({ ms, force: new Set(force), night: true });

test('events: definitions are checked', () => {
  assert.throws(() => defineEvent({ id: 'x', lanes: ['moon'], rarity: 'common', duration: 1000 }));
  assert.throws(() => defineEvent({ id: 'x', lanes: ['sky-high'], rarity: 'often', duration: 1000 }));
  assert.throws(() => defineEvent({ id: 'x', lanes: ['sky-high'], rarity: 'common', duration: 0 }));
  assert.equal(LANES.length, 9);
  assert.ok(startChance(defineEvent({ id: 'l', lanes: ['sky-high'], rarity: 'legendary', duration: 1000 })) < startChance(defineEvent({ id: 'c', lanes: ['sky-high'], rarity: 'common', duration: 1000 })));
});

test('events: deterministic — the same time gives the same schedule (a refresh never reshuffles)', () => {
  const evs = ['a', 'b', 'c', 'd'].map((id, i) => defineEvent({ id, lanes: [LANES[i % 3]], rarity: 'common', duration: 40000 }));
  for (let ms = 1.8e12; ms < 1.8e12 + 30 * SLOT_MS; ms += 13000) {
    assert.deepEqual(schedule(evs, ms, ctxAt([])), schedule(evs, ms, ctxAt([])));
  }
});

// the long, contended case (Part 1's review measured 5217 pop-ins in 9000 samples with the sliding window): 5 sky events of
// 4 slots, 5 water events of 6 slots, 3 parade-length (8 slots) heavy events in the promenade, all common
const CONTENDED = [
  ...Array.from({ length: 5 }, (_, i) => defineEvent({ id: `sky${i}`, lanes: ['sky-high'], rarity: 'common', duration: 4 * SLOT_MS })),
  ...Array.from({ length: 5 }, (_, i) => defineEvent({ id: `wat${i}`, lanes: ['water'], rarity: 'common', duration: 6 * SLOT_MS })),
  ...Array.from({ length: 3 }, (_, i) => defineEvent({ id: `par${i}`, lanes: ['promenade', 'road'], rarity: 'common', duration: 8 * SLOT_MS, heavy: true, cost: 1 })),
];
const sig = e => `${e.id}|${e.start}|${e.end}`;

test('events: schedule(t) and schedule(t − SLOT_MS) agree on every event spanning both (the past is never re-decided)', () => {
  const t0 = Math.floor(1.8e12 / 864e5) * 864e5 + 3600e3;     // inside one UTC day: one anchor for every sample
  let spans = 0;
  for (let ms = t0; ms < t0 + 300 * SLOT_MS; ms += SLOT_MS / 3 + 7000) {
    const now = schedule(CONTENDED, ms, ctxAt([])).active, before = schedule(CONTENDED, ms - SLOT_MS, ctxAt([])).active;
    for (const e of now) if (e.start <= ms - SLOT_MS) { spans++; assert.ok(before.some(b => sig(b) === sig(e)), `${e.id} popped in mid-flight at ${ms}`); }
    for (const b of before) if (b.end > ms) assert.ok(now.some(e => sig(e) === sig(b)), `${b.id} vanished mid-flight at ${ms}`);
  }
  assert.ok(spans > 300, `enough long events seen (${spans})`);
});

test('events: the stateful scheduler (advanced slot by slot, as the scene does) never pops in or drops an event', () => {
  const t0 = 1.8e12 + 7200e3;
  const s = createScheduler(CONTENDED, ctxAt([]), { anchor: t0 - 864e5 });
  let prev = null, pops = 0, samples = 0, lanesOk = true;
  for (let ms = t0; ms < t0 + 3000 * SLOT_MS; ms += 30000) {
    const { active } = s.at(ms);
    samples++;
    const lanes = active.flatMap(e => e.lanes);
    if (new Set(lanes).size !== lanes.length) lanesOk = false;
    if (prev) {
      for (const e of active) if (e.start < ms - 30000 && !prev.some(p => sig(p) === sig(e))) pops++;
      for (const p of prev) if (p.end > ms && !active.some(e => sig(e) === sig(p))) pops++;
    }
    prev = active;
  }
  assert.equal(pops, 0, `${pops} pop-ins / drops in ${samples} samples`);
  assert.ok(lanesOk, 'a lane taken twice');
  // the scene's live path and a fresh replay with the same anchor tell the same story
  const ms = t0 + 3000 * SLOT_MS - 1;
  assert.deepEqual(s.at(ms).active.map(sig), schedule(CONTENDED, ms, ctxAt([]), { anchor: t0 - 864e5 }).active.map(sig));
  assert.ok(s.decided <= 3000 + 960 + 2, `each slot decided once (${s.decided})`);
});

test('events: anchors a day apart (a session across midnight vs. a fresh load) agree within the day of replay', () => {
  const day = 864e5, mid = Math.ceil(1.8e12 / day) * day;
  const a = createScheduler(CONTENDED, ctxAt([]), { anchor: mid - 2 * day }), b = createScheduler(CONTENDED, ctxAt([]), { anchor: mid - day });
  for (let ms = mid + 3600e3; ms < mid + 6 * 3600e3; ms += 45000) assert.deepEqual(a.at(ms).active.map(sig), b.at(ms).active.map(sig));
  // the scene's anchor: the local midnight one day back
  assert.equal(anchorFor(mid + 5 * 3600e3 + 61500, { h: 5, mi: 1, s: 1 }), mid - day);
});

test('events: a quiet lane thins out (densityOf)', () => {
  const d = densityOf(['sky-high', 'water']);
  assert.equal(d['sky-high'], QUIET); assert.equal(d.water, QUIET); assert.equal(d.promenade, 1);
  assert.ok(QUIET < 0.5, 'a heavy event really thins the others');
});

test('events: two events never share a lane; the budget holds; heavy events quiet the other lanes', () => {
  const evs = [
    ...Array.from({ length: 6 }, (_, i) => defineEvent({ id: `sky${i}`, lanes: ['sky-high'], rarity: 'common', duration: 2 * SLOT_MS })),
    ...Array.from({ length: 6 }, (_, i) => defineEvent({ id: `w${i}`, lanes: ['water', 'road'], rarity: 'common', duration: SLOT_MS, cost: 1 })),
    defineEvent({ id: 'parade', lanes: ['promenade', 'road'], rarity: 'common', duration: SLOT_MS, heavy: true, cost: 1.2 }),
  ];
  let sawQuiet = false, sawTwo = false;
  const sch = createScheduler(evs, ctxAt([]), { anchor: 1.8e12 - 864e5 });
  for (let ms = 1.8e12; ms < 1.8e12 + 400 * SLOT_MS; ms += SLOT_MS / 3) {
    const { active, quiet } = sch.at(ms);
    const lanes = active.flatMap(e => e.lanes);
    assert.equal(new Set(lanes).size, lanes.length, 'a lane taken twice');
    assert.ok(active.reduce((s, e) => s + e.cost, 0) <= BUDGET.total + 1e-9, 'over budget');
    for (const e of active) assert.ok(e.k >= 0 && e.k < 1);
    if (active.some(e => e.heavy)) { sawQuiet = true; assert.ok(quiet.includes('sky-high') && !quiet.includes('promenade')); }
    if (active.length >= 2) sawTwo = true;
  }
  assert.ok(sawQuiet && sawTwo);
});

test('events: rarity — common is common, legendary is rare', () => {
  const evs = [defineEvent({ id: 'c', lanes: ['sky-high'], rarity: 'common', duration: 20000 }), defineEvent({ id: 'l', lanes: ['water'], rarity: 'legendary', duration: 20000 }), defineEvent({ id: 'w', lanes: ['road'], rarity: 'weekly', duration: 20000 })];
  const seen = { c: 0, l: 0, w: 0 }, starts = new Set();
  const day = 864e5, step = SLOT_MS;
  // (an event of 20 s inside a 90 s slot: sample the slot every 10 s and count each start once)
  const sch = createScheduler(evs, ctxAt([]), { anchor: 1.8e12 - day });
  for (let ms = 1.8e12; ms < 1.8e12 + 14 * day; ms += step) for (let o = 0; o < step; o += 10000) for (const e of sch.at(ms + o).active) { const k = `${e.id}|${e.start}`; if (!starts.has(k)) { starts.add(k); seen[e.id]++; } }
  const slots = 14 * day / SLOT_MS;
  assert.ok(seen.c > slots / RARITY.common * SLOT_MS * 0.7 && seen.c < slots / RARITY.common * SLOT_MS * 1.3, `common ${seen.c}`);
  assert.ok(seen.w >= 0 && seen.w <= 8, `weekly ${seen.w}`);
  assert.ok(seen.l <= 2, `legendary ${seen.l}`);
});

test('events: when() gates by the context; forced events run at once', () => {
  const evs = [defineEvent({ id: 'snowy', lanes: ['promenade'], rarity: 'common', duration: 20000, when: c => c.snow })];
  for (let ms = 1.8e12; ms < 1.8e12 + 50 * SLOT_MS; ms += SLOT_MS / 2) assert.equal(schedule(evs, ms, ms2 => ({ ms: ms2, snow: false })).active.length, 0);
  // the demo: only with &force=demo, and then it is running right away
  assert.equal(schedule(HARBOR_EVENTS, 1.8e12, ctxAt([])).active.length, 0);
  const on = schedule(HARBOR_EVENTS, 1.8e12 + 1234, ctxAt(['demo']), { forced: ['demo'] });
  assert.deepEqual(on.active.map(e => e.id), ['demo']);
  assert.deepEqual(on.active[0].lanes, ['sky-low']);
});

// ================================================================== Part 3: NEON + SIGNS + BILLBOARDS
import { signSpots, spotConflicts, assignSigns, nightKey, outlines, roleFamily, SCHEMES, roleColour } from '../js/core/harbor-neon.js';
import { flattenPath, tubeLight } from '../js/core/tube-path.js';
import { scrollColumns } from '../js/core/harbor-windows.js';
import { lighthouseBoxes } from '../js/core/harbor-layout.js';
import { GAMES } from '../js/config.js';
import { MARKS, bladeWord } from '../js/screens/district/marks.js';

const GAMES12 = GAMES.filter(g => g.playable).map(g => ({ id: g.id, name: g.name, short: bladeWord(g) === 'NEONPAR' ? 'NEON PAR' : bladeWord(g) }));
const faceRect = (cam, t) => { const tr = t.tiers[0], [a, b] = project(cam, tr.x0, tr.y0 + tr.h, tr.z0), [c] = project(cam, tr.x1, 0, tr.z0); return { x: a, y: b, w: c - a, h: t.face.y - b }; };

test('word towers (Part 3): both faces fully on screen, nothing nearer over them — the lighthouse, the wheel, the boats, the signs', () => {
  for (const k of PHONES) {
    const { cam, L } = setup(k);
    const w = L.wheel, [cx, cy] = project(cam, w.x, w.y, w.z), r = cam.F * w.r / w.z;
    const near = [
      ...lighthouseBoxes(L.lighthouse).map(b => { const [a, y] = project(cam, b.x0, b.y1, b.z0), [c, d] = project(cam, b.x1, b.y0, b.z0); return { id: 'lighthouse', x: a, y, w: c - a, h: d - y }; }),
      { id: 'wheel', x: cx - r, y: cy - r, w: 2 * r, h: 2 * r },
      ...L.boats.map(b => { const [a, y] = project(cam, b.x - b.len / 2, b.h, b.z), [c, d] = project(cam, b.x + b.len / 2, 0, b.z); return { id: b.id, x: a, y, w: c - a, h: d - y }; }),
      ...signSpots(L).map(s => ({ id: s.id, ...s.rect })),
    ];
    for (const t of L.towers.filter(t => t.word)) {
      const f = faceRect(cam, t);
      assert.ok(f.x >= 4 && f.x + f.w <= cam.W - 4, `${k}: ${t.id}'s face on screen (${f.x.toFixed(0)}..${(f.x + f.w).toFixed(0)} of ${cam.W})`);
      for (const o of near) assert.ok(!overlap(f, { ...o, x: o.x + 0.5, w: o.w - 1 }), `${k}: ${o.id} over ${t.id}'s face`);
    }
  }
});

test('signs: every game has a sign on every phone (4 named + 8 icons), every spot clear, names fit; desktop too', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k);
    const spots = signSpots(L);
    for (const s of spots) assert.deepEqual(spotConflicts(L, s, spots), [], `${k}: ${s.id}`);
    const pick = assignSigns(GAMES12, spots, '2026-10-21');
    const got = new Set(pick.values());
    if (!cam.wide) {
      assert.equal(spots.filter(s => s.kind === 'named').length, 4, `${k}: four named spots`);
      assert.equal(got.size, 12, `${k}: all 12 games have a sign`);
    } else if (k === '1440x900') assert.equal(got.size, 12, 'desktop: all 12 games');
    for (const s of spots.filter(s => s.kind === 'named')) { const g = GAMES12.find(x => x.id === pick.get(s.id)); if (g) assert.ok(g.short.replace(/ /g, '').length <= s.cap, `${k}: ${g.short} fits ${s.id}`); }
    // the named spots read on a phone: a vertical sign's letters ≥ 6 pt
    if (!cam.wide) for (const s of spots.filter(s => s.kind === 'named' && s.type === 'vbox')) assert.ok(s.rect.h / s.cap >= 6 * (cam.F / 600) * 0.95, `${k}: ${s.id} letters ${(s.rect.h / s.cap).toFixed(1)} pt`);
  }
});

test('signs: a new pick each night (the same all night), and a game list that grows or shrinks just fills more or fewer spots', () => {
  const { L } = setup('402x874');
  const spots = signSpots(L);
  const a = assignSigns(GAMES12, spots, '2026-10-21'), b = assignSigns(GAMES12, spots, '2026-10-21');
  assert.deepEqual([...a], [...b]);
  const named = m => spots.filter(s => s.kind === 'named').map(s => m.get(s.id)).join();
  let differs = 0;
  for (let d = 1; d <= 14; d++) if (named(assignSigns(GAMES12, spots, `2026-11-${String(d).padStart(2, '0')}`)) !== named(a)) differs++;
  assert.ok(differs >= 10, `the named spots rotate night to night (${differs} of 14)`);
  assert.equal(new Set(assignSigns(GAMES12.slice(0, 7), spots, 'x').values()).size, 7);
  const slots = spots.filter(s => s.kind === 'named' || s.kind === 'icon').length;
  assert.equal(new Set(assignSigns([...GAMES12, { id: 'new1', short: 'BINGO' }, { id: 'new2', short: 'DARTS' }], spots, 'x').values()).size, Math.min(14, slots));
  // tonight: the evening's date — before noon it is still last night (the pick changes by day, while the neon is dark)
  assert.equal(nightKey({ y: 2026, m: 10, d: 22, h: 1 }), '2026-10-21');
  assert.equal(nightKey({ y: 2026, m: 10, d: 22, h: 19 }), '2026-10-22');
  for (const g of GAMES12) assert.ok(MARKS[g.id], `${g.id} has a tube mark`);
});

test('neon outlines: never across a word face, at most two colours a building, base > heat > accent', () => {
  for (const k of ['390x844', '402x874', '1440x900']) {
    const { cam, L } = setup(k);
    const O = outlines(L), len = { base: 0, heat: 0, accent: 0 };
    const faces = L.towers.filter(t => t.word).map(t => ({ id: t.id, z: t.z0, ...faceRect(cam, t) }));   // (an outline farther back is behind the tower: it covers it)
    for (const o of O) {
      const roles = new Set(o.lines.map(l => l.role));
      if (!o.id.startsWith('threads')) assert.ok(roles.size <= 2, `${k}: ${o.id} ${[...roles]}`);
      for (const ln of o.lines) {
        let d = 0;
        for (let i = 1; i < ln.pts.length; i++) {
          const [a, b] = project(cam, ...ln.pts[i - 1]), [c, e] = project(cam, ...ln.pts[i]);
          d += Math.hypot(c - a, e - b);
          for (const f of faces) { if (o.z > f.z + 1) continue; const mx = (a + c) / 2, my = (b + e) / 2; assert.ok(!(mx > f.x + 1.5 && mx < f.x + f.w - 1.5 && my > f.y + 1.5 && my < f.y + f.h - 1.5), `${k}: ${o.id} crosses ${f.id}'s face`); }
        }
        len[roleFamily(ln.role)] += d;
      }
    }
    assert.ok(len.base > len.heat && len.heat > len.accent && len.accent > 0, `${k}: ${JSON.stringify(len)}`);
  }
  for (const n of Object.keys(SCHEMES)) for (const r of ['b0', 'b1', 'b2', 'h0', 'h1', 'a0', 'a1', 'a2']) assert.equal(roleColour(r, n).length, 3, `${n} ${r}`);
});

test('tubes: SVG paths → polylines (lines, curves, arcs), the light hotter on the bends and dimmer at the electrodes', () => {
  const sq = flattenPath('M0 0 H10 V10 H0 Z');
  assert.equal(sq.length, 1); assert.ok(sq[0].closed); assert.deepEqual(sq[0].pts.at(-1), [0, 0]);
  const circ = flattenPath('M80 50 A30 30 0 1 0 20 50 A30 30 0 1 0 80 50', 1, 0, 0, 2)[0].pts;
  for (const [x, y] of circ) assert.ok(Math.abs(Math.hypot(x - 50, y - 50) - 30) < 0.6, 'an arc stays on its circle');
  for (const m of Object.values(MARKS)) for (const t of m.tubes) assert.ok(flattenPath(t.d).length >= 1);
  const pts = [[0, 0], [10, 0], [20, 0], [30, 0], [30, 10], [30, 20], [30, 30]], lv = tubeLight(pts, false, 1);
  assert.ok(lv[3] > lv[1] && lv[0] < lv[1], `bend ${lv[3]} > straight ${lv[1]} > electrode ${lv[0]}`);
});

test('words: the scroll — any length, column by column', () => {
  const sc = scrollColumns('HAPPY BIRTHDAY SAM');
  assert.equal(sc.text, 'HAPPY BIRTHDAY SAM');
  assert.equal(sc.cols.length, lineWidth('HAPPY BIRTHDAY SAM'));
  assert.ok(sc.cols.every(m => m > 0 || m === 0));
  assert.equal(scrollColumns('x'.repeat(300)).text.length, 120);
});
