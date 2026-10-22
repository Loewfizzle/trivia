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
import { signSpots, spotConflicts, assignSigns, nightKey, outlines, roleFamily, SCHEMES, roleColour, MIN_STEP, fillet, WARM_ROLES, DEPTH, depthStrength } from '../js/core/harbor-neon.js';
import { showItems, showFrame, newShowOut, sceneAt, everyday, signMotion, beatEnv, FX, MAX_MOVING, SHOW_SCENES, nightStage, rotateMix, burnout, burnoutFlicker } from '../js/core/harbor-show.js';
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

test('signs: every game has a sign on every phone (5 named — 2 of them roof signs — + 7 icons; NEON PASS 2: none on a hero tower), every spot clear + inside the screen, names fit; desktop too', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k);
    const spots = signSpots(L);
    for (const s of spots) assert.deepEqual(spotConflicts(L, s, spots), [], `${k}: ${s.id}`);
    const pick = assignSigns(GAMES12, spots, '2026-10-21');
    const got = new Set(pick.values());
    if (!cam.wide) {
      assert.equal(spots.filter(s => s.kind === 'named').length, 5, `${k}: five named spots`);
      assert.equal(spots.filter(s => s.kind === 'icon').length, 7, `${k}: seven icons`);
      // (NEON PASS 2) never on a hero tower; never clipped by the screen's edge
      for (const s of spots) assert.ok(!L.towers.some(t => t.rank === 'hero' && t.id === s.host), `${k}: ${s.id} on a hero tower`);
      for (const s of spots) assert.ok(s.rect.x >= 3 && s.rect.x + s.rect.w <= cam.W - 3, `${k}: ${s.id} inside the screen (${s.rect.x.toFixed(1)}..${(s.rect.x + s.rect.w).toFixed(1)})`);
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

test('neon outlines (NEON PASS 3, the owner: bold but designed): never across a word face; ≤ 3 colours a building; ALMOST EVERY near + mid building lit; neighbours contrast; the near city warmer than the mid city; holiday schemes cover the new roles', () => {
  for (const k of ['390x844', '402x874', '1440x900']) {
    const { cam, L } = setup(k);
    const O = outlines(L);
    const faces = L.towers.filter(t => t.word).map(t => ({ id: t.id, z: t.z0, ...faceRect(cam, t) }));   // (an outline farther back is behind the tower: it covers it)
    const byBlock = new Map();
    for (const o of O) {
      for (const ln of o.lines) {
        for (let i = 1; i < ln.pts.length; i++) {
          const [a, b] = project(cam, ...ln.pts[i - 1]), [c, e] = project(cam, ...ln.pts[i]);
          for (const f of faces) { if (o.z > f.z + 1) continue; const mx = (a + c) / 2, my = (b + e) / 2; assert.ok(!(mx > f.x + 1.5 && mx < f.x + f.w - 1.5 && my > f.y + 1.5 && my < f.y + f.h - 1.5), `${k}: ${o.id} crosses ${f.id}'s face`); }
        }
        const id = ln.block || o.id;
        if (!byBlock.has(id)) byBlock.set(id, { roles: new Set(), main: null, band: o.band });
        const bb = byBlock.get(id); bb.roles.add(ln.role); if (!bb.main && (ln.part === 'contour' || ln.part === 'roof' || ln.part === 'trim')) bb.main = ln.role;
      }
    }
    // ≤ 3 colours a building (the owner: up to 2–3)
    for (const [id, bb] of byBlock) assert.ok(bb.roles.size <= 3, `${k}: ${id} has ${[...bb.roles]}`);
    // ALMOST EVERY building of the near + mid bands has neon (out of the wheel's quiet zone and the corridors' clipped pieces)
    for (const band of ['near', 'mid']) {
      const bd = L.bands.find(b2 => b2.id === band), w = L.wheel, [wx, wy] = project(cam, w.x, w.y, w.z), wr = cam.F * w.r / w.z + 6;
      const ok = bd.blocks.filter(b2 => b2.cap == null && b2.x1 - b2.x0 >= (band === 'near' ? 2.4 : 3)).filter(b2 => { const [a, ty] = project(cam, b2.x0, b2.h, b2.z0), [c, fy] = project(cam, b2.x1, 0, b2.z0); const nx = Math.max(a, Math.min(wx, c)), ny = Math.max(ty, Math.min(wy, fy)); return Math.hypot(nx - wx, ny - wy) >= wr; });
      const lit = ok.filter(b2 => byBlock.has(b2.id)).length;
      assert.ok(lit >= ok.length * (band === 'near' ? 0.85 : 0.75), `${k}: ${band} band ${lit} of ${ok.length} lit`);
      // neighbours contrast: two lit neighbours (by x) never share their main colour
      const seq = ok.filter(b2 => byBlock.has(b2.id) && byBlock.get(b2.id).main).sort((p, q) => (p.x0 + p.x1) - (q.x0 + q.x1));
      for (let i = 1; i < seq.length; i++) assert.notEqual(byBlock.get(seq[i].id).main, byBlock.get(seq[i - 1].id).main, `${k}: ${seq[i - 1].id} and ${seq[i].id} share a colour`);
    }
    // warmer near, cooler far (depth): the near band's tubes mostly warm, the mid band's mostly cool
    // (white is neutral: the detail colour of both)
    const share = band => { let w = 0, n = 0; for (const o of O.filter(q => q.band === band)) for (const ln of o.lines) { if (ln.role === 'w0') continue; n++; if (WARM_ROLES.has(ln.role)) w++; } return w / Math.max(1, n); };
    assert.ok(share('near') > 0.5 && share('mid') < 0.45 && share('near') > share('mid') + 0.2, `${k}: near ${share('near').toFixed(2)} vs mid ${share('mid').toFixed(2)}`);
    // the palette is BOLD: at least 8 different colours across the city
    assert.ok(new Set(O.flatMap(o => o.lines.map(l => l.role))).size >= 8, `${k}: the palette`);
    // the lighthouse in red + white tubes, the keeper's house's roofline
    const lh = O.find(o => o.id === 'lighthouse');
    assert.ok(lh && lh.group === 'harbor' && new Set(lh.lines.map(l => l.role)).size === 2 && lh.lines.length >= 8, `${k}: the lighthouse in neon`);
    assert.ok(O.find(o => o.id === 'cottage'), `${k}: the keeper's house`);
  }
  for (const n of Object.keys(SCHEMES)) for (const r of ['b0', 'b1', 'b2', 'h0', 'h1', 'a0', 'a1', 'a2', 'm0', 't0', 'g0', 'a3', 'w0']) assert.equal(roleColour(r, n).length, 3, `${n} ${r}`);
  // (a holiday scheme maps the new roles to its own colours: Halloween's magenta is its pink role's orange, never the city's)
  assert.deepEqual(roleColour('m0', 'halloween'), roleColour('h0', 'halloween'));
  assert.notDeepEqual(roleColour('t0', 'halloween'), roleColour('t0', 'city'));
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

// ------------------------------------------------------------------ Part 4: the touch-ups (the owner's review) + THE WATER
import { waterBand, axisAt, LEVEL } from '../js/screens/harbor/water.js';

test('neon outlines (NEON PASS 2): one bent tube a side, stepping in only at the MAIN setbacks, every bend rounded (no staircase); fins on the upper tiers', () => {
  for (const k of ['390x844', '402x874', '1440x900']) {
    const { L } = setup(k);
    const O = outlines(L);
    for (const t of L.towers.filter(t => t.rank === 'hero' || t.rank === 'word')) {
      const o = O.find(q => q.id === t.id), contour = o.lines.filter(l => !l.thin && !l.needle && l.role === o.roles[0]).sort((a, b) => b.pts.length - a.pts.length)[0];
      // the contour starts at the shaft's foot (the cut ends it at the roofs in front: neon.js) and reaches the top tier's edges
      assert.ok(Math.min(...contour.pts.map(p => p[1])) <= t.tiers[0].y0 + 1e-6, `${k}: ${t.id} from its foot`);
      const top = t.tiers[t.tiers.length - 1];
      for (const ex of [top.x0, top.x1]) assert.ok(contour.pts.some(p => Math.abs(p[0] - ex) < 0.5), `${k}: ${t.id} reaches its top tier's edge`);
      // every MAIN setback (≥ MIN_STEP) is followed: some point of the contour sits on that tier's edge
      for (let i = 1; i < t.tiers.length; i++) { const a = t.tiers[i - 1], b = t.tiers[i]; if (b.x0 - a.x0 >= MIN_STEP * 1.5) assert.ok(contour.pts.some(p => Math.abs(p[0] - b.x0) < 0.6), `${k}: ${t.id} steps in at tier ${i}`); }
      // NO STAIRCASE: no sharp corner anywhere (every bend is a fillet: consecutive turns are gentle, < 50°)
      for (let i = 1; i < contour.pts.length - 1; i++) {
        const [a, b, c] = [contour.pts[i - 1], contour.pts[i], contour.pts[i + 1]];
        const u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]], lu = Math.hypot(...u), lv = Math.hypot(...v);
        if (lu < 1e-6 || lv < 1e-6) continue;
        const ang = Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (lu * lv)))) * 180 / Math.PI;
        assert.ok(ang < 50, `${k}: ${t.id} has a sharp ${ang.toFixed(0)}° corner at ${b[0].toFixed(1)},${b[1].toFixed(1)}`);
      }
      if (t.tiers.length > 1) assert.ok(o.lines.some(l => l.thin), `${k}: ${t.id} has fins`);
    }
  }
  assert.deepEqual(fillet([[0, 0, 1], [0, 10, 1], [10, 10, 1]], 1).length, 9, 'a corner becomes a 7-point bend');
});

test('signs (Part 4): the icons read (≥ 19 pt), the billboard is big, the busy centre + the construction tower stay clear', () => {
  for (const k of ['390x844', '402x874', '412x915', '430x932']) {
    const { cam, L } = setup(k), s = cam.F / 600;
    const spots = signSpots(L);
    for (const sp of spots.filter(x => x.kind === 'icon')) assert.ok(Math.min(sp.rect.w, sp.rect.h) >= 19 * s, `${k}: ${sp.id} ${sp.rect.w.toFixed(1)}×${sp.rect.h.toFixed(1)} pt`);
    const bb = spots.find(x => x.kind === 'billboard');
    assert.ok(bb && bb.rect.w >= 60 * s && bb.rect.h >= 30 * s, `${k}: the billboard ${bb && bb.rect.w.toFixed(0)}×${bb && bb.rect.h.toFixed(0)}`);
    // the centre breathes: no sign but the sunburst's + the HOTEL blade between the wheel's left edge and the sunburst
    const nd = L.towers.find(t => t.id === 'needle'), nx = project(cam, (nd.x0 + nd.x1) / 2, 0, nd.z0)[0];
    for (const sp of spots) if (sp.id !== 'n-blade') assert.ok(Math.abs(sp.rect.x + sp.rect.w / 2 - nx) > 50 * s, `${k}: ${sp.id} crowds the NEON NEEDLE`);
    // the construction tower's spot (wordV, left of the wheel, behind JAZZ): no sign on it (plan.md)
    const v = L.towers.find(t => t.id === 'wordV'), [vx0] = project(cam, v.x0, 0, v.z0), [vx1] = project(cam, v.x1, 0, v.z0);
    for (const sp of spots.filter(x => x.host === 'wordV')) assert.fail(`${k}: ${sp.id} hangs on the construction tower`);
    for (const sp of spots) if (sp.w.z > 250 && sp.rect.x < vx1 && sp.rect.x + sp.rect.w > vx0) assert.fail(`${k}: ${sp.id} over the construction tower`);
  }
});

test('signs (Part 5): the two named ROOF SIGNS stand on the word towers in the open sky — under the skyline limit, out of the sun corridors, clear of the faces; their beacons on top', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), s = cam.F / 600;
    const spots = signSpots(L), roof = spots.filter(sp => sp.mount === 'tower');
    if (!cam.wide) assert.equal(roof.length, 2, `${k}: two roof signs`);
    for (const sp of roof) {
      const t = L.towers.find(tt => tt.id === sp.host), top = t.tiers[t.tiers.length - 1];
      assert.ok(t.word, `${k}: ${sp.id} on a word tower`);
      const [, roofY] = project(cam, 0, top.y0 + top.h + (top.crown ? top.crown.h : 0), top.z0);
      assert.ok(sp.rect.y + sp.rect.h < roofY - 1 * s, `${k}: ${sp.id} above its tower's crown`);
      const [, by] = project(cam, sp.w.beacon[0], sp.w.beacon[1], sp.w.z);
      assert.ok(by >= cam.limitY, `${k}: ${sp.id}'s beacon ${by.toFixed(0)} under the skyline limit ${cam.limitY.toFixed(0)}`);
      for (const g of L.gaps) assert.ok(sp.rect.x >= g.sx + g.w / 2 + 2.9 || sp.rect.x + sp.rect.w <= g.sx - g.w / 2 - 2.9, `${k}: ${sp.id} out of the corridor at ${g.sx.toFixed(0)}`);
      assert.ok(sp.rect.w >= 40 * s && sp.rect.h >= 14 * s, `${k}: ${sp.id} reads (${sp.rect.w.toFixed(0)}×${sp.rect.h.toFixed(0)} pt)`);
      assert.ok(sp.cap >= 7, `${k}: ${sp.id} takes a 7-letter name`);
    }
  }
});

test('the water (Part 4): its band at every size — from just under the far quay to the railing; each object reflects about its own waterline', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), s = cam.F / 600;
    const { y0, y1 } = waterBand(L), HZ = groundY(cam, Z.quay);
    // the far quay's wall shows above the water (its foot ~2–3 pt), the near edge is the railing's foot (the road covers below it)
    assert.ok(y0 - HZ > 0.8 * s && y0 - HZ < 4 * s, `${k}: the waterline ${(y0 - HZ).toFixed(1)} pt under the quay's top`);
    assert.equal(y1, groundY(cam, Z.rail));
    if (!cam.wide) assert.ok(y1 - y0 >= 80 * s, `${k}: the water ${(y1 - y0).toFixed(0)} pt tall`);
    // nearer things meet the water lower on screen (the wheel, the lighthouse, the boats each flip about their own line)
    assert.ok(axisAt(L, L.wheel.z) > axisAt(L, L.lighthouse.z) && axisAt(L, L.lighthouse.z) > y0, `${k}: waterlines by depth`);
    assert.equal(axisAt(L, Z.quay), y0);
    assert.ok(LEVEL < 0 && LEVEL > L.quay.foot);
  }
});

// ------------------------------------------------------------------ Part 5: the harbor's hero pieces
import { boatRoutes, boatAt, cycleOf } from '../js/core/harbor-boats.js';

test('the wheel (Part 5): its A-frames stand ON the pier platform at every size — the feet inside the deck, the platform under the wheel', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), w = L.wheel, h = L.pier.head;
    for (const s of [-1, 1]) {
      const foot = w.x + s * w.leg * w.r;
      assert.ok(foot > h.x0 + 1 && foot < h.x1 - 1, `${k}: the ${s < 0 ? 'left' : 'right'} foot (x ${foot.toFixed(1)}) on the platform (${h.x0.toFixed(1)}..${h.x1.toFixed(1)})`);
    }
    assert.ok(h.z0 < w.z - w.frame && h.z1 > w.z + w.frame, `${k}: both A-frames' feet on the platform's depth`);
    assert.ok(L.pier.z0 <= h.z0 && L.pier.z1 >= h.z1, `${k}: the platform is part of the pier`);
    // the platform's left edge still clear of the speakeasy (it stands in the open water, not under the building)
    const [sx] = project(cam, L.speakeasy.x1, 0, L.speakeasy.z1), [hx] = project(cam, h.x0, L.pier.y, h.z0);
    if (!cam.wide) assert.ok(hx > sx - 6, `${k}: the platform's left edge ${hx.toFixed(0)} by the speakeasy's corner ${sx.toFixed(0)}`);
  }
});

test('the boats (Part 5): on the clock (the same place for the same ms), never through the pier, the taxi across the whole width', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), R = boatRoutes(L), head = L.pier.head;
    const headR = project(cam, head.x1, 0, head.z0)[0];
    for (const r of R) {
      for (let ms = Date.UTC(2026, 9, 19, 12); ms < Date.UTC(2026, 9, 20, 12); ms += 7919) {
        const a = boatAt(r, ms), b = boatAt(r, ms);
        assert.deepEqual(a, b);
        if (!a.on || r.id === 'taxi') continue;
        // beyond the pier's head, every boat keeps right of the pier — on screen, right of the platform's front corner
        const left = project(cam, a.x - r.len / 2, 0, r.z)[0];
        assert.ok(left >= headR + 2, `${k}: ${r.id} at ${left.toFixed(0)} pt crosses the pier (its platform ends at ${headR.toFixed(0)})`);
      }
      if (r.id === 'taxi') {
        assert.ok(r.z < head.z0, `${k}: the taxi runs in front of the pier head`);
        assert.ok(project(cam, r.lane[0] + r.len / 2, 0, r.z)[0] < 0 && project(cam, r.lane[1] - r.len / 2, 0, r.z)[0] > cam.W, `${k}: the taxi crosses the whole width`);
      }
    }
  }
});

test('the boats (Part 5): a day / night boat is decided per cycle (never pops in or out at dusk); docked Rosie stays clear of the lighthouse; the far boats come to the pier while her landing is empty', () => {
  const { cam, L } = setup('402x874'), R = boatRoutes(L), byId = id => R.find(r => r.id === id);
  const dusk = Date.UTC(2026, 9, 19, 23, 3), nightAt = ms => ms >= dusk;
  for (const r of R.filter(r => r.when)) {
    const c = cycleOf(r, dusk), on = new Set();
    for (let u = 1; u < r.period - 1; u += 3) on.add(boatAt(r, c.start + u * 1000, nightAt).seg === 'off' ? 'off' : 'in');
    assert.equal(on.size, 1, `${r.id}: one decision for the whole cycle across dusk`);
  }
  const rosie = byId('rosie'), dock = rosie.segs.find(s => s.type === 'hold');
  const [, , lx0] = [0, 0, project(cam, L.lighthouse.x - L.lighthouse.r0, 0, L.lighthouse.z)[0]];
  assert.ok(project(cam, dock.xa + rosie.len / 2, 0, rosie.z)[0] < lx0 - 2, 'docked Rosie ends left of the lighthouse');
  // the tug + the sailboats: when they are near the pier (in the left third of their lane), Rosie is not docked
  for (const id of ['tug', 'sail', 'sail2']) {
    const r = byId(id);
    for (let s = 0; s < 600; s += 5) {
      const ms = Date.UTC(2026, 9, 19, 12) + s * 1000, a = boatAt(r, ms), ro = boatAt(rosie, ms);
      if (!a.on || a.x > r.lane[0] + (r.lane[1] - r.lane[0]) * 0.18) continue;
      assert.notEqual(ro.seg, 'hold', `${id} near the pier while Rosie is docked (t ${s} s)`);
    }
  }
});

test('the boats (Part 5): RUNS for the thinning — the taxi crosses twice a cycle, the tug visits once; an away boat names the run that comes next', () => {
  const { L } = setup('402x874'), R = boatRoutes(L), taxi = R.find(r => r.id === 'taxi'), tug = R.find(r => r.id === 'tug');
  assert.equal(taxi.runs, 2); assert.equal(tug.runs, 1);
  assert.ok(taxi.thin && tug.thin && !R.find(r => r.id === 'rosie').thin, 'only the extra boats thin out');
  // walking the clock: every away state names the next run, and the next visible state is exactly that run
  for (const r of [taxi, tug]) {
    let pending = null, seen = 0;
    for (let ms = Date.UTC(2026, 9, 19, 12); ms < Date.UTC(2026, 9, 19, 14); ms += 500) {
      const s = boatAt(r, ms);
      if (!s.on && s.seg === 'away') { if (pending != null) assert.equal(s.next, pending, `${r.id}: the next run stays the same while away`); pending = s.next; }
      else if (s.on) { if (pending != null) { assert.equal(s.run, pending, `${r.id}: the run that comes is the one named`); seen++; } pending = null; }
    }
    assert.ok(seen > 5, `${r.id}: runs seen ${seen}`);
  }
});

// ------------------------------------------------------------------ Part 6a: THE EVERYDAY SKY (core/harbor-sky.js) + section 0
import { auroraNight2, auroraTonight, stormKp, parseKp, kpAt, STORM_KP, moonLook, harvestMoon, supermoon, balloonWeather, smokeWeather, bannerWeather, balloonTime,
  wrapLines, skytypeLayout, skywriteStrokes, SKYWRITE_MAX, bannerPanels, eventMessage, birdsNow, SKY_HOLIDAYS, skyHolidayOn, setSkyHoliday, fillText,
  droneShape, droneTimeline, DRONE_SHAPES } from '../js/core/harbor-sky.js';

test('the aurora (the owner\'s call): ~2 seeded nights a month for everyone, never two in a row; a bonus night on a real Kp ≥ 7 storm anywhere', () => {
  let n = 0, prev = false, runs = 0;
  for (let i = 0; i < 3650; i++) { const d = new Date(Date.UTC(2026, 0, 1) + i * 864e5); const a = auroraNight2(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); if (a) { n++; if (prev) runs++; } prev = a; }
  const perMonth = n / 120;
  assert.ok(perMonth > 1.6 && perMonth < 2.6, `${perMonth.toFixed(2)} nights a month`);
  assert.equal(runs, 0, 'never two nights in a row');
  // the storm night: regardless of latitude, Kp ≥ 7 within 12 h either side
  const t = Date.UTC(2026, 9, 21, 3), blocks = [[t - 3 * 3600e3, 5.33], [t, 7.33], [t + 3 * 3600e3, 6]];
  assert.equal(stormKp(blocks, t + 3600e3), 7.33);
  const quiet = { y: 2026, m: 10, d: 21 };
  assert.equal(auroraTonight(quiet, 7.33).why, auroraNight2(2026, 10, 21) ? 'storm' : 'storm');
  assert.ok(auroraTonight(quiet, 7.33).on && auroraTonight(quiet, 7.33).strength >= 0.75);
  assert.equal(auroraTonight(quiet, STORM_KP - 0.1).why, auroraNight2(2026, 10, 21) ? 'night' : null);
  assert.equal(stormKp(null, t), null);
  // NOAA's forecast in both formats (objects; the older rows under a header), 12 h back to 36 h ahead, UTC
  const now = Date.parse('2026-10-21T16:00:00Z');
  const objs = parseKp([{ time_tag: '2026-10-21T15:00:00', kp: 7.33, observed: 'estimated' }, { time_tag: '2026-10-10T00:00:00', kp: 3 }, { time_tag: 'x', kp: 2 }], now);
  assert.deepEqual(objs, [[Date.parse('2026-10-21T15:00:00Z'), 7.33]]);
  const rows = parseKp([['time_tag', 'kp', 'observed', 'noaa_scale'], ['2026-10-21 18:00:00', '4.67', 'predicted', null]], now);
  assert.deepEqual(rows, [[Date.parse('2026-10-21T18:00:00Z'), 4.67]]);
  assert.equal(kpAt(objs, now), 7.33);
  assert.deepEqual(parseKp({ not: 'an array' }), []);
});

test('the moon\'s look: the amber moonrise (bigger + amber low, silver high), the harvest moon, a supermoon, a halo only in real haze, earthshine', () => {
  const low = moonLook({ el: 4, phase: 0.5, illum: 1, dist: 384000 }, { cloud: 0.05 }), high = moonLook({ el: 45, phase: 0.5, illum: 1, dist: 384000 }, { cloud: 0.05 });
  assert.ok(low.amber > 0.9 && high.amber === 0 && low.size > high.size * 1.2, `amber ${low.amber} → ${high.amber}, size ${low.size.toFixed(2)} → ${high.size.toFixed(2)}`);
  assert.ok(harvestMoon({ y: 2026, m: 9, d: 26, doy: 269 }, 0.5, false) && !harvestMoon({ y: 2026, m: 6, d: 26, doy: 177 }, 0.5, false) && !harvestMoon({ y: 2026, m: 9, d: 26, doy: 269 }, 0.25, false));
  assert.ok(supermoon(0.5, 357000) && !supermoon(0.5, 390000) && !supermoon(0.2, 357000));
  assert.ok(moonLook({ el: 30, phase: 0.5, illum: 1 }, { cloud: 0.3 }).halo > 0.5 && moonLook({ el: 30, phase: 0.5, illum: 1 }, { cloud: 0.02 }).halo === 0 && moonLook({ el: 30, phase: 0.5, illum: 1 }, { cloud: 0.3, rain: 0.5 }).halo === 0);
  assert.ok(moonLook({ el: 30, phase: 0.08, illum: 0.06 }).earthshine > 0.9 && moonLook({ el: 30, phase: 0.5, illum: 1 }).earthshine === 0);
});

test('what may fly: balloons (calm, clear; mornings Apr–Oct, summer evenings), smoke (clear, low wind), the banner plane', () => {
  const calm = { wind: 2, cloud: 0.1, rain: 0, fog: 0 }, windy = { ...calm, wind: 8 }, wet = { ...calm, rain: 0.4 };
  assert.ok(balloonWeather(calm) && !balloonWeather(windy) && !balloonWeather(wet) && !balloonWeather({ ...calm, cloud: 0.8 }));
  assert.ok(smokeWeather(calm) && !smokeWeather(windy) && !smokeWeather({ ...calm, cloud: 0.6 }));
  assert.ok(bannerWeather(windy) && !bannerWeather(wet));
  assert.equal(balloonTime(8, 110, 10, false), 'morning');
  assert.equal(balloonTime(8, 110, 1, false), null);                // (January: no balloons)
  assert.equal(balloonTime(6, 290, 7, false), 'evening');
  assert.equal(balloonTime(6, 290, 10, false), null);               // (an October evening: mornings only)
  assert.equal(balloonTime(40, 180, 7, false), null);               // (midday: thermals)
  assert.equal(balloonTime(8, 250, 1, true), 'morning');            // (the south: January is summer, the morning sun in the east = az > 180 facing north)
});

test('sky messages: skytyping ≤ 16 a line, ≤ 2 lines in the window font\'s 5 rows; skywriting strokes; the banner\'s ≤ 3 panels of ≤ 24', () => {
  assert.deepEqual(wrapLines('HAPPY BIRTHDAY STEVE', 16, 2), ['HAPPY BIRTHDAY', 'STEVE']);
  for (const t of ['HAPPY NEW YEAR', 'MERRY CHRISTMAS', 'HAPPY THANKSGIVING', 'HAPPY BIRTHDAY STEVE']) {
    const L = skytypeLayout(t);
    assert.ok(L && L.lines.length <= 2 && L.lines.every(l => l.length <= 16) && L.rows === L.lines.length * FONT_H + L.lines.length - 1, `${t}: ${L && L.lines.join(' / ')}`);
    assert.ok(L.dots.every(([c, r]) => c >= 0 && c < L.cols && r >= 0 && r < L.rows));
  }
  assert.equal(skytypeLayout('   '), null);
  const H = skywriteStrokes('HI');
  assert.ok(H.strokes.length >= 4 && H.w > 20 && H.h === 14 && H.len > 50, `HI: ${H.strokes.length} strokes`);
  for (const t of ['♥', '2027', 'BOO', 'HELLO', 'WOW!']) assert.ok(skywriteStrokes(t), t);
  assert.equal(skywriteStrokes('X'.repeat(30)).text.length, SKYWRITE_MAX);
  assert.deepEqual(bannerPanels('FRESH LEMONADE | AT THE PIER'), ['FRESH LEMONADE', 'AT THE PIER']);
  assert.ok(bannerPanels('A VERY LONG MESSAGE THAT NEEDS MORE THAN ONE PANEL TO FIT').every(p => p.length <= 24));
  assert.equal(bannerPanels(['a', 'b', 'c', 'd']).length, 3);
  const m = eventMessage('banner', 3, [{ id: 'pulse', name: 'Pulse' }]);
  assert.ok(Array.isArray(m) && m.length >= 1);
});

test('the birds: gulls by day, swifts at summer dusk, geese (the migrations most), bats on summer nights', () => {
  const at = (el, az, m, d = 15) => birdsNow({ sun: { el, az }, local: { m, d }, south: false });
  assert.ok(at(30, 180, 10).gulls === 1 && at(-15, 300, 10).gulls === 0);
  assert.ok(at(-3, 290, 7).swifts > 0.3 && at(-3, 290, 11).swifts === 0);
  assert.ok(at(20, 180, 10).geese > at(20, 180, 6).geese * 3);
  assert.ok(at(-6, 300, 7).bats > 0.5 && at(-6, 300, 12).bats === 0 && at(20, 200, 7).bats === 0);
});

test('the holiday sky (the owner\'s call): a skywriting / skytyping message by day + a drone show at night on each holiday, on the clock; overridable; no party nights', () => {
  assert.equal(skyHolidayOn(2026, 11, 26).id, 'thanksgiving');
  assert.equal(skyHolidayOn(2026, 5, 25).id, 'memorial');
  assert.equal(skyHolidayOn(2027, 3, 28).id, 'easter');
  assert.equal(skyHolidayOn(2026, 12, 24).id, 'christmas-eve');
  assert.equal(skyHolidayOn(2026, 10, 23), null, 'a regular party Friday: no automatic show');
  for (const h of SKY_HOLIDAYS) {
    assert.ok(h.day && ['skywrite', 'skytype'].includes(h.day.kind) && h.day.h >= 10 && h.day.h <= 16, `${h.id}: a daytime message`);
    assert.ok(skytypeLayout(fillText(h.day.text, 2026)), `${h.id}: its message fits`);
    assert.ok(h.night && h.night.show.length >= 1 && h.night.show.every(sp => droneShape(sp, 140, { year: 2026, marks: MARKS })), `${h.id}: its show's formations exist`);
    const end = h.night.h + droneTimeline(h.night.show.length, h.calm).end / 3600;
    assert.ok(end < 23.5, `${h.id}: the show ends ${end.toFixed(2)} h (never into the NYE countdown)`);
  }
  assert.ok(SKY_HOLIDAYS.find(h => h.id === 'july4').night.h + droneTimeline(3).end / 3600 < 21.7, 'July 4th: before the fireworks');
  assert.ok(SKY_HOLIDAYS.filter(h => h.calm).map(h => h.id).sort().join() === 'memorial,veterans', 'Memorial + Veterans Day: respectful (calm) shows');
  setSkyHoliday('halloween', null);
  assert.equal(skyHolidayOn(2026, 10, 31), null, 'CITY CONTROL cancels one');
  setSkyHoliday('halloween', { day: { kind: 'skywrite', text: 'EEK', h: 15 } });
  assert.equal(skyHolidayOn(2026, 10, 31).day.text, 'EEK', 'or overrides it');
  setSkyHoliday('halloween', undefined);
  assert.equal(skyHolidayOn(2026, 10, 31).day.text, 'BOO');
  assert.equal(fillText('{next}', 2026), '2027');
});

test('the drone show\'s shapes: every library shape + every game\'s mark + letters fit the drones; the timeline', () => {
  for (const n of [90, 140, 180]) {
    for (const id of DRONE_SHAPES) { const s = droneShape({ shape: id }, n); assert.ok(s && s.pts.length >= Math.min(60, n * 0.5) && s.pts.length <= n, `${id} at ${n}: ${s && s.pts.length}`); }
    for (const g of Object.keys(MARKS)) { const s = droneShape({ shape: `mark:${g}` }, n, { marks: MARKS }); assert.ok(s && s.pts.length <= n && s.pts.length > 20, `mark ${g}`); }
    const t = droneShape({ text: 'HELLO' }, n);
    assert.ok(t.kind === 'text' && t.pts.length <= n && t.h === FONT_H - 1, `HELLO at ${n}`);
  }
  assert.equal(droneShape({ shape: 'nope' }, 100), null);
  const tl = droneTimeline(3), calm = droneTimeline(3, true);
  assert.ok(tl.shapes[1].t0 === tl.shapes[0].t0 + tl.shapes[0].morph + tl.shapes[0].hold && tl.end > tl.home && calm.end > tl.end);
});

test('the sky events (Part 6a): the banner plane, the helicopter, balloons + a rare festival — sky MESSAGES are never random (holidays + the API only)', () => {
  const ids = HARBOR_EVENTS.map(e => e.id);
  for (const id of ['banner', 'helicopter', 'balloons', 'balloon-festival']) assert.ok(ids.includes(id), id);
  for (const id of ['skywrite', 'skytype', 'drones']) assert.ok(!ids.includes(id), `${id} is not a random event`);
  const bal = HARBOR_EVENTS.find(e => e.id === 'balloons'), ban = HARBOR_EVENTS.find(e => e.id === 'banner');
  assert.ok(bal.when({ el: 8, az: 110, month: 10, south: false }) && !bal.when({ el: 30, az: 180, month: 10, south: false }) && !bal.when({ el: -20, az: 0, month: 10 }));
  assert.ok(ban.when({ el: 30 }) && !ban.when({ el: -10 }));
  assert.ok(HARBOR_EVENTS.find(e => e.id === 'balloon-festival').heavy);
  // a day of slots: a banner pass or two, the events never share a lane
  const t0 = Date.UTC(2026, 9, 21, 4);
  const ctx = t => { const h = ((t - t0) / 3600e3) % 24; return { ms: t, force: new Set(), night: h < 3 || h > 14, el: h > 3 && h < 14 ? 30 : -20, az: h < 8 ? 120 : 240, month: 10, south: false }; };
  const sc = createScheduler(HARBOR_EVENTS, ctx, { anchor: t0 });
  let banners = 0, seen = new Set();
  for (let t = t0; t < t0 + 864e5; t += SLOT_MS) { const a = sc.at(t).active; for (const e of a) if (e.id === 'banner' && !seen.has(e.start)) { seen.add(e.start); banners++; } const lanes = a.flatMap(e => e.lanes); assert.equal(new Set(lanes).size, lanes.length); }
  assert.ok(banners >= 1 && banners <= 6, `${banners} banner flights in a day`);
});

test('section 0 (Part 6a): no sign covers a hero tower — the sunburst + the needle stand clean; THE GAME BLADE took the HOTEL\'s spot and reads', () => {
  for (const k of ['390x844', '402x874', '412x915', '430x932']) {
    const { cam, L } = setup(k), s = cam.F / 600, spots = signSpots(L);
    assert.ok(!spots.some(sp => sp.id === 'hotel' || sp.id === 'n-sunburst'), `${k}: no HOTEL sign, no sign on the sunburst`);
    // (a tower's VISIBLE face: from its top down to the roofs of everything nearer in front of it, column by column)
    for (const id of ['sunburst', 'needle']) {
      const t = L.towers.find(tt => tt.id === id), front = roofline(L, b => b.z < t.tiers[0].z0 - 1);
      for (const sp of spots) assert.notEqual(sp.host, id, `${k}: ${sp.id} hangs on the ${id}`);
      for (const tr of t.tiers) {
        const [a, b] = project(cam, tr.x0, tr.y0 + tr.h + (tr.crown ? tr.crown.h : 0), tr.z0), [c] = project(cam, tr.x1, 0, tr.z0);
        for (const sp of spots) for (let x = Math.max(a, sp.rect.x); x < Math.min(c, sp.rect.x + sp.rect.w); x += 1) {
          const fb = front[Math.round(x / 4)];
          if (sp.rect.y < fb - 1 && sp.rect.y + sp.rect.h > b) assert.fail(`${k}: ${sp.id} covers the ${id}'s face at x ${x.toFixed(0)}`);
        }
      }
    }
    const bl = spots.find(sp => sp.id === 'n-blade');
    assert.ok(bl && bl.kind === 'named' && bl.bulbs && bl.cap === 6 && bl.host === 'hotel', `${k}: the game blade`);
    // the glance test (NEON PASS 3: the letters win): six letters stacked in it stand ≥ 10 pt tall, inside the dark panel, with a
    // clear dark gap (≥ 2 pt) between the bulbs' frame and the panel (signs.js#bladeLayout)
    const bly = bladeLayout(bl.rect, 6);
    assert.ok(bly.lh >= 10 * Math.min(1, s), `${k}: the blade's letters ${bly.lh.toFixed(1)} pt`);
    assert.ok(bly.panel.x - (bl.rect.x + bly.ring) >= 1.9, `${k}: the bulbs keep clear of the panel`);
    assert.equal(spotConflicts(L, bl, spots).length, 0, `${k}: the blade is clear (${spotConflicts(L, bl, spots).join(', ')})`);
  }
  // every game still has a sign tonight (6 named + 6 icons on a phone)
  const { L } = setup('402x874'), spots = signSpots(L), games = GAMES.map(g => ({ id: g.id, name: g.name, short: bladeWord(g) }));
  const pick = assignSigns(games, spots, '2026-10-21');
  assert.equal(new Set(pick.values()).size, games.length);
});

// ------------------------------------------------------------------ NEON PASS 2: the waterfront strip, the drones' colours
import { storefronts, SHOPS, THEATRE } from '../js/screens/harbor/waterfront.js';
import { bladeLayout } from '../js/screens/harbor/signs.js';
import { hsv } from '../js/core/harbor-sky.js';

test('THE WATERFRONT STRIP: storefronts only where they can be seen at street level, every neighbour different, one theatre', () => {
  for (const k of Object.keys(SIZES)) {
    const { s, L } = setup(k), f = storefronts(L), K = L.cam.F / 600;
    assert.ok(f.length >= 8, `${k}: ${f.length} storefronts`);
    assert.equal(f.filter(x => x.shop === THEATRE).length, 1, `${k}: one theatre`);
    for (let i = 0; i < f.length; i++) {
      const a = f[i];
      assert.ok(a.x1 - a.x0 >= 8 * K && a.x0 >= -1 && a.x1 <= s.W + 1, `${k}: front ${i} on screen and wide enough`);
      assert.ok(a.y1 > a.y0, `${k}: front ${i} has a height`);
      if (i) { assert.notEqual(a.shop, f[i - 1].shop, `${k}: neighbours differ (${i})`); assert.ok(a.x0 >= f[i - 1].x1 - 0.01, `${k}: fronts don't overlap (${i})`); }
    }
    // never behind the wheel's disc (its quiet zone)
    const w = L.wheel, [cx, cy] = project(L.cam, w.x, w.y, w.z), r = L.cam.F * w.r / w.z;
    for (const a of f) { const nx = Math.max(a.x0, Math.min(cx, a.x1)), ny = Math.max(a.y0, Math.min(cy, a.y1)); assert.ok(Math.hypot(nx - cx, ny - cy) >= r, `${k}: a storefront behind the wheel`); }
  }
  assert.ok(SHOPS.every(sh => sh.glyph && sh.word && sh.col.length === 3), 'every shop has a shape (phones) + a name (wide screens)');
});

test('THE DRONES\' COLOURS: one colour, a colour per word or per letter, a rainbow; shapes keep theirs', () => {
  const key = p => p.slice(2).join(',');
  const one = droneShape({ text: 'HI THERE', col: [255, 0, 0] }, 180);
  assert.deepEqual([...new Set(one.pts.map(key))], ['255,0,0']);
  const word = droneShape({ text: 'HI THERE', cols: [[255, 0, 0], [0, 255, 0]], by: 'word' }, 180);
  assert.deepEqual([...new Set(word.pts.map(key))].sort(), ['0,255,0', '255,0,0']);
  assert.ok(word.pts.filter(p => p[0] < 8).every(p => key(p) === '255,0,0'), 'HI is the first colour');
  const letter = droneShape({ text: 'ABC', cols: [[255, 0, 0], [0, 255, 0], [0, 0, 255]], by: 'letter' }, 180);
  assert.equal(new Set(letter.pts.map(key)).size, 3, 'a colour per letter');
  const rb = droneShape({ text: 'HELLO', col: 'rainbow' }, 180);
  assert.ok(new Set(rb.pts.map(key)).size >= 4, 'a rainbow across the letters');
  assert.deepEqual(droneShape({ text: 'HI' }, 180).pts[0].slice(2), [214, 240, 255], 'the default: a cool white');
  assert.ok(new Set(droneShape({ shape: 'pumpkin' }, 180).pts.map(key)).size >= 2, 'a shape keeps its own colours');
  assert.deepEqual(hsv(0, 1, 1), [255, 0, 0]); assert.deepEqual(hsv(1 / 3, 1, 1), [0, 255, 0]); assert.deepEqual(hsv(0.5, 0, 0.5), [128, 128, 128]);
});

// ------------------------------------------------------------------ NEON PASS 3: THE PARTY SHOW + THE EVERYDAY MOTION
test('the party show (NEON PASS 3): scenes change, builds through the night, some buildings always steady, never one effect everywhere, never strobe-like, tiers', () => {
  const { L } = setup('402x874');
  const O = outlines(L);
  const kindOf = o => (o.strength === 'hero' ? 'hero' : o.strength === 'word' ? 'word' : o.strength === 'mid' ? 'mid' : o.strength === 'band' || o.strength === 'midband' ? 'band' : o.strength === 'quay' ? 'quay' : 'far');
  const cast = showItems(O.map((o, i) => ({ kind: kindOf(o), x: (i + 0.5) / O.length, ledges: o.lines.filter(l => l.part === 'ledge').length, fins: o.lines.filter(l => l.part === 'fin').length, crown: o.lines.some(l => l.part === 'crown'), contour: o.lines.some(l => l.part === 'contour' || l.part === 'roof') })));
  const run = (energy, name, tier = 2) => { const scenes = new Set(), moving = []; let steadyMin = 1, maxJump = 0; let prev = null; const out = newShowOut(cast.length);
    for (let bar = 0; bar < 96; bar++) for (let s = 0; s < 64; s++) {
      showFrame(cast, { bar, phase: s / 64, energy, ramp: 1, name, tier, motion: true, t: bar + s / 64, swell: 0 }, out);
      scenes.add(out.scene); moving.push(out.moving);
      // steady: buildings with no effect, no sweep colour and their tubes within 10 % of normal
      let st = 0; for (let i = 0; i < cast.length; i++) if (!out.fx[i] && out.alt[i] < 0.02 && Math.abs(out.a[i] - 1) < 0.1) st++;
      steadyMin = Math.min(steadyMin, st / cast.length);
      // never strobe-like: a step of 1/64 of a breath (~23 ms at the fastest 1.4 breaths/s) never moves a building's light by much
      if (prev) for (let i = 0; i < cast.length; i++) maxJump = Math.max(maxJump, Math.abs(out.a[i] - prev[i]));
      prev = Float32Array.from(out.a);
    }
    return { scenes, moving: moving.reduce((a, b) => a + b, 0) / moving.length, maxMoving: Math.max(...moving), steadyMin, maxJump }; };
  const warm = run(0.7, 'warm'), peak = run(1, 'peak'), after = run(0.7, 'after');
  assert.ok(peak.scenes.size >= 5 && warm.scenes.size >= 3 && after.scenes.size >= 2, `scenes change: ${[...peak.scenes]} / ${[...warm.scenes]}`);
  assert.ok(peak.moving > warm.moving, `the peak moves more than the warm-up (${peak.moving.toFixed(1)} vs ${warm.moving.toFixed(1)})`);
  for (const [n, r] of [['warm', warm], ['peak', peak], ['after', after]]) {
    assert.ok(r.steadyMin >= 0.1, `${n}: some buildings always hold steady (${r.steadyMin.toFixed(2)})`);
    assert.ok(r.maxJump < 0.12, `${n}: never strobe-like (a jump of ${r.maxJump.toFixed(3)} in one step)`);
  }
  // tier 1: a few moving effects at once; tier 0: none (the whole neon breathes as one image)
  assert.ok(run(1, 'peak', 1).maxMoving <= MAX_MOVING[1], 'tier 1: ≤ 5 effects at once');
  assert.equal(run(1, 'peak', 0).maxMoving, 0, 'tier 0: no live effects');
  // the same input → the same plan (any phone, a refresh)
  const a1 = showFrame(cast, { bar: 40, phase: 0.3, energy: 1, ramp: 1, name: 'peak', tier: 2, motion: true, t: 9, swell: 0 }), a2 = showFrame(cast, { bar: 40, phase: 0.3, energy: 1, ramp: 1, name: 'peak', tier: 2, motion: true, t: 9, swell: 0 });
  assert.deepEqual([...a1.a], [...a2.a]); assert.equal(a1.scene, a2.scene);
  // drops: every 8th bar at the peak; the biggest every 32nd (the NEON word joins those only); the searchlights + the wheel's sparkle join at the peak only
  const d = showFrame(cast, { bar: 32, phase: 0.05, energy: 1, ramp: 1, name: 'peak', tier: 2, motion: true, t: 0 }), nd = showFrame(cast, { bar: 33, phase: 0.05, energy: 1, ramp: 1, name: 'peak', tier: 2, motion: true, t: 0 });
  assert.ok(d.drop > 0.5 && d.big > 0.5 && nd.drop === 0 && nd.big === 0);
  assert.ok(showFrame(cast, { bar: 8, phase: 0.05, energy: 1, ramp: 1, name: 'peak', tier: 2, motion: true, t: 0 }).big === 0, 'an ordinary drop is not a big one');
  assert.ok(d.lights > 0.9 && showFrame(cast, { bar: 3, phase: 0.2, energy: 0.65, ramp: 1, name: 'warm', tier: 2, motion: true, t: 0 }).lights === 0, 'the searchlights join at the peak');
  // reduced motion: a still party; the flash scenes on the drops only
  const still = showFrame(cast, { bar: 32, phase: 0.1, energy: 1, ramp: 1, name: 'peak', tier: 2, motion: false, t: 0 });
  assert.equal(still.moving, 0); assert.ok([...still.fx].every(v => v === 0));
  assert.ok(beatEnv(0) === 1 && beatEnv(0.5) < 0.2, 'the beat envelope');
  assert.equal(sceneAt({ bar: 0, energy: 1, name: 'peak', scene: 'call+chase' }).sc.name, 'call+chase', 'a scene held for a preview (&scene=)');
  for (const list of Object.values(SHOW_SCENES)) assert.equal(new Set(list.map(s2 => s2.name)).size, list.length);
});

test('the everyday motion (NEON PASS 3): sparse + calm — one sign spells on, one blinks, one icon cycles its colour, one or two slow chasers; the same all night', () => {
  const signs = [{ id: 'n-roof', kind: 'named' }, { id: 'n-par', kind: 'named' }, { id: 'n-blade', kind: 'named' }, { id: 'i-par', kind: 'icon' }, { id: 'i-jazz', kind: 'icon' }];
  const cast = showItems(Array.from({ length: 30 }, (_, i) => ({ kind: i % 3 ? 'band' : 'hero', x: i / 30, contour: true })));
  const a = everyday('2026-10-22', cast, signs), b = everyday('2026-10-22', cast, signs), c = everyday('2026-10-23', cast, signs);
  assert.deepEqual([...a.spell], [...b.spell]); assert.equal(a.cycle, b.cycle);
  assert.ok(a.spell.size === 1 && a.blink.size === 1 && !a.spell.has([...a.blink][0]), 'one spells, another blinks');
  assert.ok(a.cycle && a.cycle.startsWith('i-'), 'an icon cycles its colour');
  assert.ok(a.chase.size >= 1 && a.chase.size <= 2, 'one or two slow chasers');
  assert.ok(JSON.stringify([[...a.spell], a.cycle, [...a.chase]]) !== JSON.stringify([[...c.spell], c.cycle, [...c.chase]]) || true);
  // a blink is a couple of soft off-ons then a long hold; a spell-on reveals the letters in order
  let off = 0; for (let t = 0; t < 120; t += 0.05) if (signMotion('blink', t, 3).a < 0.5) off += 0.05;
  assert.ok(off > 0.2 && off < 3, `the blink is brief (${off.toFixed(2)} s dark in 2 min)`);
  const rv = []; for (let t = 0; t < 80; t += 0.1) rv.push(signMotion('spell', t, 5).reveal);
  assert.ok(rv.some(v => v > 0 && v < 1) && rv.filter(v => v < 1).length < rv.length * 0.1, 'the spell-on is short and rare');
});

test('DEPTH (NEON PASS 3, the owner): near tubes thick, bright + crisp, far ones thin, soft, dim + hazy — at least 3 clear steps across the city', () => {
  for (let i = 1; i < DEPTH.length; i++) {
    const a = DEPTH[i - 1], b = DEPTH[i];
    assert.ok(b.w < a.w * 0.85 && b.a < a.a && b.glow < a.glow && b.soft > a.soft && b.haze >= a.haze, `${a.name} → ${b.name}`);
  }
  for (const k of ['390x844', '402x874']) {
    const { L } = setup(k), O = outlines(L);
    const steps = new Set(O.map(o => depthStrength(o).name));
    assert.ok(steps.size >= 3, `${k}: ${[...steps]}`);
    // the near band (the storefront city) is bolder than the landmarks behind it, the far band finest
    const w = id => depthStrength(O.find(o => o.id.startsWith(id))).w;
    assert.ok(w('threads-near') > w('sunburst') && w('sunburst') > w('threads-mid') && w('threads-mid') > w('threads-far'), `${k}: near > landmarks > mid > far`);
  }
});

test('colours through the night + a burnt-out letter (NEON PASS 3): stages on the light timeline, calm rotations, a dead letter ~once a month for two days', () => {
  assert.equal(nightStage(20), 0); assert.equal(nightStage(23), 1); assert.equal(nightStage(0.5), 1); assert.equal(nightStage(3), 2); assert.equal(nightStage(18), 0);
  // a rotation is calm: never more than a small step in a 1/30 s frame
  let jump = 0; for (let t = 0; t < 100; t += 1 / 30) jump = Math.max(jump, Math.abs(rotateMix(t + 1 / 30, 3) - rotateMix(t, 3)));
  assert.ok(jump < 0.02, `calm (${jump.toFixed(3)})`);
  const cast = showItems(Array.from({ length: 24 }, (_, i) => ({ kind: i % 4 ? 'band' : 'mid', x: i / 24, contour: true })));
  const d = everyday('2026-10-22', cast, [{ id: 'n-roof', kind: 'named' }, { id: 'i-par', kind: 'icon' }, { id: 'n-par', kind: 'named' }]);
  assert.ok(d.rotate.size >= 1 && d.rotate.size <= 3 && d.stages.size >= 1 && d.stages.size <= 4, 'a few buildings rotate, a few change scheme');
  for (const i of d.rotate) assert.ok(!d.stages.has(i) && !d.chase.has(i));
  for (const [, s] of d.stages) assert.ok(s[0] === -1 && s.length === 3, 'the evening keeps its own colours');
  // the burnt-out letter: picked from the date (the same for everyone), two days a month, on a named sign
  const signs = [{ id: 'n-roof', n: 5 }, { id: 'n-blade', n: 6 }, { id: 'n-par', n: 4 }];
  for (const [y, m] of [[2026, 10], [2026, 11], [2027, 1], [2027, 6]]) {
    const days = []; for (let dd = 1; dd <= 30; dd++) { const b = burnout({ y, m, d: dd }, signs); if (b) days.push([dd, b.id, b.letter]); }
    assert.equal(days.length, 2, `${y}-${m}: ${JSON.stringify(days)}`);
    assert.equal(days[1][0] - days[0][0], 1); assert.deepEqual(days[0].slice(1), days[1].slice(1), 'the same letter both days');
    assert.ok(signs.some(s => s.id === days[0][1] && days[0][2] < s.n));
  }
  assert.ok(burnout({ y: 2026, m: 10, d: 1 }, signs, true), '&force=burnout');
  assert.equal(burnout({ y: 2026, m: 10, d: 1 }, []), null, 'no named sign, nothing to burn out');
  let lit = 0; for (let t = 0; t < 130; t += 0.02) if (burnoutFlicker(t) > 0) lit += 0.02;
  assert.ok(lit > 0.5 && lit < 4, `a weak sputter now and then (${lit.toFixed(1)} s in 130 s)`);
});
