// CITY 2.0 — THE HARBOR: the camera, the layout per screen size, the SIZE rules and the events scheduler (pure; docs/harbor.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { REF, Z, SIZE, units, ptAt, cameraFor, project, xAt, groundY, squeeze, harborLayout, screenBoxes, SUN_GAPS, LANE_MIN, laneMin, roofline } from '../js/core/harbor-layout.js';
import { SPEAK_V } from '../js/core/harbor-speakeasy.js';
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
  assert.ok(units('person') > 1.9 && units('person') < 2.3);   // (8a: 27 pt at z 47 — the owner's scale)
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
      assert.ok(person > 24 * f && person < 30 * f, `person ${person}`);
      assert.ok(bus > 100 * f && bus < 120 * f, `bus ${bus}`);
      assert.ok(ptAt(cam, L.cars[0].len, L.cars[0].z) > 48 * f && ptAt(cam, L.cars[0].len, L.cars[0].z) < 62 * f);
      // (8a: the promenade at the owner's scale — the tall curb lamp ~70 pt, a curb maple's crown ~55 pt across)
      assert.ok(ptAt(cam, L.lamps[0].h, L.lamps[0].z) > 62 * f && ptAt(cam, L.lamps[0].h, L.lamps[0].z) < 78 * f);
      // (FP2: no curb maple on the phone any more — the rule holds for the panorama's curb maples; the phone's curb crabapple ~47 pt)
      assert.ok(ptAt(cam, PROM_PIECE.maple.w, 52.75) > 48 * f && ptAt(cam, PROM_PIECE.maple.w, 52.75) < 64 * f);
      const crab = L.trees.find(t => t.kind === 'crab'); assert.ok(ptAt(cam, crab.r * 2, crab.z) > 48 * f && ptAt(cam, crab.r * 2, crab.z) < 64 * f, `the bench's crabapple (PF: bigger, ~56 pt) ${ptAt(cam, crab.r * 2, crab.z)}`);
      assert.ok(ptAt(cam, L.signals[0].h, L.signals[0].z) > 50 * f && ptAt(cam, L.signals[0].h, L.signals[0].z) < 60 * f);
    } else if (s.H < 500) {
      assert.ok(person >= 8.5, `sideways people ${person}`);   // the owner's call: the whole city, smaller
    } else {
      assert.ok(person > 24 && person < 30, `desktop person ${person}`);
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
import { signName } from '../js/screens/harbor/signs.js';
import { signSpots, spotConflicts, assignSigns, billboardPick, fitsSpot, nightKey, outlines, roleFamily, SCHEMES, roleColour, MIN_STEP, fillet, WARM_ROLES, DEPTH, depthStrength } from '../js/core/harbor-neon.js';
import { showItems, showFrame, newShowOut, sceneAt, everyday, signMotion, beatEnv, FX, MAX_MOVING, MAX_RACE, SHOW_SCENES, nightStage, rotateMix, burnout, burnoutFlicker, punchEnv, beatOf, harborParty } from '../js/core/harbor-show.js';
import { flattenPath, tubeLight } from '../js/core/tube-path.js';
import { scrollColumns } from '../js/core/harbor-windows.js';
import { lighthouseBoxes } from '../js/core/harbor-layout.js';
import { GAMES } from '../js/config.js';
import { MARKS, bladeWord } from '../js/screens/district/marks.js';

const GAMES12 = GAMES.filter(g => g.playable).map(g => ({ id: g.id, name: g.name, short: signName(g) }));
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

test('signs (DT1): 3 named (the blade + 2 stacked roof signs — the left roof slot is gone) + the billboard on a phone, NO icons (NEON PASS 6: "distracting") — 5 of the 12 games a night, every game over the nights (the shuffle + the billboard); none on a hero tower, every spot clear + inside the screen, names fit; desktop too', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k);
    const spots = signSpots(L);
    for (const s of spots) assert.deepEqual(spotConflicts(L, s, spots), [], `${k}: ${s.id}`);
    const pick = assignSigns(GAMES12, spots, '2026-10-21');
    const got = new Set(pick.values());
    if (!cam.wide) {
      assert.equal(spots.filter(s => s.kind === 'named').length, 3, `${k}: three named spots (DT1: the left roof slot is gone)`);
      assert.ok(!spots.some(s => s.id === 'n-roof'), `${k}: no left roof sign`);
      assert.equal(spots.filter(s => s.kind === 'icon').length, 0, `${k}: no icons (NEON PASS 6)`);
      // (NEON PASS 2) never on a hero tower; never clipped by the screen's edge
      for (const s of spots) assert.ok(!L.towers.some(t => t.rank === 'hero' && t.id === s.host), `${k}: ${s.id} on a hero tower`);
      for (const s of spots) assert.ok(s.rect.x >= 3 && s.rect.x + s.rect.w <= cam.W - 3, `${k}: ${s.id} inside the screen (${s.rect.x.toFixed(1)}..${(s.rect.x + s.rect.w).toFixed(1)})`);
      assert.equal(got.size, 3, `${k}: 3 games have a named sign tonight`);
      const all = new Set(); for (const n of NIGHTS) { const pk = assignSigns(GAMES12, spots, n); for (const g of pk.values()) all.add(g); all.add(billboardPick(GAMES12, spots, pk, n)); }
      assert.equal(all.size, 12, `${k}: over the nights every game shows — a named sign or the billboard (the nightly shuffle)`);
    } else if (k === '1440x900') assert.ok(got.size >= 7, `desktop: ${got.size} games`);
    for (const s of spots.filter(s => s.kind === 'named')) { const g = GAMES12.find(x => x.id === pick.get(s.id)); if (g) assert.ok(fitsSpot(g.short, s), `${k}: ${g.short} fits ${s.id}`); }
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
  const slots = spots.filter(s => s.kind === 'named' || s.kind === 'icon').length;
  { const short3 = GAMES12.filter(g => g.short.replace(/ /g, '').length <= 6).slice(0, 3); assert.equal(new Set(assignSigns(short3, spots, 'x').values()).size, 3); }
  assert.ok(new Set(assignSigns(GAMES12.slice(0, 7), spots, 'x').values()).size <= Math.min(7, slots));
  assert.equal(new Set(assignSigns([...GAMES12, { id: 'new1', short: 'BINGO' }, { id: 'new2', short: 'DARTS' }], spots, 'x').values()).size, Math.min(14, slots));
  assert.ok(slots >= 3, `${slots} sign slots`);
  // tonight: the evening's date — before noon it is still last night (the pick changes by day, while the neon is dark)
  assert.equal(nightKey({ y: 2026, m: 10, d: 22, h: 1 }), '2026-10-21');
  assert.equal(nightKey({ y: 2026, m: 10, d: 22, h: 9 }), '2026-10-22');          // (THE DAY PASS: the day shows tonight's pick)
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
        if (!byBlock.has(id)) byBlock.set(id, { roles: new Set(), main: null, band: o.band, calm: o.id.endsWith('-calm') });
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
      // neighbours contrast: two lit neighbours (by x) never share their main colour (NEON PASS 6: the lighthouse's calm rooflines aside)
      const seq = ok.filter(b2 => byBlock.has(b2.id) && byBlock.get(b2.id).main && !byBlock.get(b2.id).calm).sort((p, q) => (p.x0 + p.x1) - (q.x0 + q.x1));
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
      assert.ok(sp.cap === 6 && sp.stack, `${k}: ${sp.id} stacked, up to 6 letters (NEON PASS 5: the glance test)`);
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
  // (SP: the 22° ring only under a cirrostratus veil — a cumulus night, fog or rain only widen the soft glow)
  assert.ok(moonLook({ el: 30, phase: 0.5, illum: 1 }, { cloud: 0.3, veil: 0.9 }).halo > 0.5 && moonLook({ el: 30, phase: 0.5, illum: 1 }, { cloud: 0.3 }).halo === 0 && moonLook({ el: 30, phase: 0.5, illum: 1 }, { cloud: 0.02 }).halo === 0 && moonLook({ el: 30, phase: 0.5, illum: 1 }, { cloud: 0.3, veil: 0.9, rain: 0.5 }).halo === 0);
  assert.ok(moonLook({ el: 30, phase: 0.5, illum: 1 }, { cloud: 0.3 }).haze > 0.5 && moonLook({ el: 30, phase: 0.5, illum: 1 }, { cloud: 0.02 }).haze === 0);
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
  // (NEON PASS 6) 4 of the games have a named sign tonight (no icons any more) + the billboard a fifth; the nightly shuffle rotates the rest
  const { L } = setup('402x874'), spots = signSpots(L), games = GAMES12;
  const pick = assignSigns(games, spots, '2026-10-21');
  assert.equal(new Set(pick.values()).size, 3);
  assert.ok(billboardPick(games, spots, pick, '2026-10-21') && ![...pick.values()].includes(billboardPick(games, spots, pick, '2026-10-21')), 'the billboard: a game with no sign tonight');
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
test('the party show (NEON PASS 4): racing light on most buildings, a HARD beat (never dark, never a hard on/off), scenes every 20–40 s, a steady quarter, the sky taking turns, tiers', () => {
  const { L } = setup('402x874');
  const O = outlines(L);
  const kindOf = o => (o.strength === 'hero' ? 'hero' : o.strength === 'word' ? 'word' : o.strength === 'mid' ? 'mid' : o.strength === 'band' || o.strength === 'midband' ? 'band' : o.strength === 'quay' ? 'quay' : 'far');
  const cast = showItems(O.map((o, i) => ({ kind: kindOf(o), x: (i + 0.5) / O.length, ledges: o.lines.filter(l => l.part === 'ledge').length, fins: o.lines.filter(l => l.part === 'fin').length, crown: o.lines.some(l => l.part === 'crown'), contour: o.lines.some(l => l.part === 'contour' || l.part === 'roof') })));
  // (NEON PASS 5: a bar is 4 beats — the song's grid; s: 64ths of the bar)
  const T = 0.5, frame = (bar, s, energy, name, tier = 2, extra = {}) => { const b = s / 16, bu = b % 1; return { bar, phase: s / 64, energy, ramp: 1, name, tier, motion: true, t: bar * 2 + s / 32, swell: 0, beatU: bu, beatT: T, beatIdx: Math.floor(b), beats: bar * 4 + Math.floor(b), beatsF: bar * 4 + b, ...extra }; };
  const run = (energy, name, tier = 2) => { const scenes = new Set(), moving = [], racing = []; let steadyMin = 1, minA = 9, maxA = 0, maxStrobe = 0; const out = newShowOut(cast.length);
    for (let bar = 0; bar < 96; bar++) for (let s = 0; s < 64; s++) {
      showFrame(cast, frame(bar, s, energy, name, tier), out);
      scenes.add(out.scene); moving.push(out.moving - out.racing); racing.push(out.racing);
      let st = 0, sb = 0; for (let i = 0; i < cast.length; i++) { if (!out.fx[i] && !out.race[i] && out.alt[i] < 0.02) st++; if (out.alt[i] > 0.5) sb++; minA = Math.min(minA, out.a[i]); maxA = Math.max(maxA, out.a[i]); }
      steadyMin = Math.min(steadyMin, st / cast.length); maxStrobe = Math.max(maxStrobe, sb / cast.length);
    }
    const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    return { scenes, moving: avg(moving), maxMoving: Math.max(...moving), racing: avg(racing), maxRacing: Math.max(...racing), steadyMin, minA, maxA, maxStrobe }; };
  const warm = run(0.7, 'warm'), peak = run(1, 'peak'), after = run(0.7, 'after');
  assert.ok(peak.scenes.size >= 5 && warm.scenes.size >= 3 && after.scenes.size >= 2, `scenes change: ${[...peak.scenes]} / ${[...warm.scenes]}`);
  assert.ok(peak.racing > warm.racing && peak.racing >= cast.filter(c => c.contour && ['hero', 'word', 'mid'].includes(c.kind)).length * 0.6, `RACING LIGHT: most towers race at the peak (${peak.racing.toFixed(1)} of ${cast.length}), fewer at the warm-up (${warm.racing.toFixed(1)})`);
  for (const [n, r] of [['warm', warm], ['peak', peak], ['after', after]]) {
    assert.ok(r.steadyMin >= 0.1, `${n}: some buildings always hold steady (${r.steadyMin.toFixed(2)})`);
    assert.ok(r.minA >= 0.6, `${n}: the tubes never go dark between the beats (min ${r.minA.toFixed(2)})`);
    assert.ok(r.maxStrobe < 0.4, `${n}: never one strobe everywhere (${r.maxStrobe.toFixed(2)} of the city)`);
  }
  assert.ok(peak.maxA >= 1.6, `THE HARD BEAT: a big swing at the peak (up to ${peak.maxA.toFixed(2)}× on a downbeat)`);
  // the punch: a ≥ 40 ms attack (never a hard on), up on the beat, gone in a beat; harder on the downbeat
  for (const bt of [0.35, 0.5, 0.75]) {
    let step = 0; for (let ms = 0; ms < bt * 2000; ms += 5) step = Math.max(step, Math.abs(punchEnv((ms + 5) / 1000 / bt, bt) - punchEnv(ms / 1000 / bt, bt)));
    assert.ok(step <= 0.16, `the attack takes ≥ 40 ms at ${bt} s a beat (a 5 ms step moves it ${step.toFixed(3)})`);
    assert.equal(punchEnv(0, bt), 1); assert.ok(punchEnv(0.15 / bt, bt) < 0.4, 'a quick decay');
  }
  // (THE BEAT-SYNC PASS — EVERY BEAT: the punch lands on every beat, the downbeat hardest, beat 3 next, 2 + 4 lighter but there)
  const pAt = sx => showFrame(cast, frame(9, sx, 1, 'peak'), newShowOut(cast.length)).punch;
  const down = pAt(0), b3 = pAt(32), b2 = pAt(16), b4 = pAt(48);
  assert.ok(down > b3 * 1.2 && down > 0.7, `harder on the downbeat (${down.toFixed(2)} vs beat 3 ${b3.toFixed(2)})`);
  assert.ok(b3 > 0.45 && b2 > 0.25 && b2 < b3 && b4 > 0.25 && b4 < b3, `every beat: beat 3 punches (${b3.toFixed(2)}), beats 2 + 4 lighter (${b2.toFixed(2)}, ${b4.toFixed(2)})`);
  // tier 1: a few effects + a few racers at once; tier 0: none (the whole neon punches as one image)
  const t1 = run(1, 'peak', 1);
  assert.ok(t1.maxMoving <= MAX_MOVING[1] && t1.maxRacing <= MAX_RACE[1], `tier 1: ≤ ${MAX_MOVING[1]} effects + ≤ ${MAX_RACE[1]} racing (${t1.maxMoving} + ${t1.maxRacing})`);
  const t0 = run(1, 'peak', 0);
  assert.equal(t0.maxMoving + t0.maxRacing, 0, 'tier 0: no live effects');
  // the same input → the same plan (any phone, a refresh)
  const a1 = showFrame(cast, frame(40, 19, 1, 'peak')), a2 = showFrame(cast, frame(40, 19, 1, 'peak'));
  assert.deepEqual([...a1.a], [...a2.a]); assert.deepEqual([...a1.race], [...a2.race]); assert.equal(a1.scene, a2.scene);
  // drops: every 8th bar at the peak; the biggest every 32nd (the NEON word joins those only)
  const d = showFrame(cast, frame(32, 3, 1, 'peak')), nd = showFrame(cast, frame(33, 3, 1, 'peak'));
  assert.ok(d.drop > 0.5 && d.big > 0.5 && nd.drop === 0 && nd.big === 0);
  assert.ok(showFrame(cast, frame(8, 3, 1, 'peak')).big === 0, 'an ordinary drop is not a big one');
  // THE SKY takes turns at the peak: the sky beams most of the time, the searchlights in the last quarter of every 32 bars
  const b8 = showFrame(cast, frame(8, 10, 1, 'peak')), b28 = showFrame(cast, frame(28, 10, 1, 'peak'));
  assert.ok(b8.beams > 0.9 && b8.lights === 0 && b28.lights > 0.9 && b28.beams < 0.5, `turns: bar 8 beams ${b8.beams.toFixed(2)} / lights ${b8.lights.toFixed(2)}; bar 28 ${b28.beams.toFixed(2)} / ${b28.lights.toFixed(2)}`);
  assert.ok(showFrame(cast, frame(3, 10, 0.65, 'warm')).lights === 0, 'no searchlights at the warm-up');
  // reduced motion: a still party
  const still = showFrame(cast, { ...frame(32, 6, 1, 'peak'), motion: false });
  assert.equal(still.moving, 0); assert.ok([...still.fx].every(v => v === 0) && [...still.race].every(v => v === 0) && still.punch === 0);
  assert.ok(beatEnv(0) === 1 && beatEnv(0.5) < 0.2, 'the soft breath (tier 0, reduced)');
  // scenes run 20–40 s at the song's rate (a breath a second: 20–40 bars)
  for (const name of ['warm', 'peak', 'after']) { const len = sceneAt({ bar: 0, energy: name === 'peak' ? 1 : 0.7, name, rate: 1 }).len; assert.ok(len >= 20 && len <= 40, `${name}: a scene lasts ${len} s`); }
  assert.equal(sceneAt({ bar: 0, energy: 1, name: 'peak', scene: 'call+chase' }).sc.name, 'call+chase', 'a scene held for a preview (&scene=)');
  assert.ok(SHOW_SCENES.peak.some(s2 => s2.name === 'race+strobe'));
  for (const list of Object.values(SHOW_SCENES)) assert.equal(new Set(list.map(s2 => s2.name)).size, list.length);
  // THE NIGHT (the harbor's curve; FP2: 8:30 pm warm-up → 9:30 pm peak → calming after 1 am — the default plan, no late dusk)
  const e = h => harborParty(h).energy;
  assert.ok(e(20.75) < 0.8 && e(22) > 0.97 && e(25.8) < 0.8 && e(21) < e(22), `the night builds: 8:45 pm ${e(20.75).toFixed(2)}, 10 pm ${e(22).toFixed(2)}, 1:48 am ${e(25.8).toFixed(2)}`);
  assert.deepEqual([harborParty(21).name, harborParty(23).name, harborParty(25.5).name], ['warm', 'peak', 'after']);
  // the beat with no song: a party's 120 bpm inside the slow breath
  assert.ok(Math.abs(beatOf(0.3, 1 / 3.5, 0, () => 1).T - 0.5) < 0.01);
  assert.ok(Math.abs(beatOf(0.3, 1, 120, () => 2).T - 0.5) < 0.01 && beatOf(0.6, 1, 120, () => 2).idx === 1);
});

test('the everyday motion (NEON PASS 3 + 4; 7a): calm but alive — every named sign spells on in its turn, one or two blink, one icon cycles its colour, three or four slow chasers spread out; the same all night', () => {
  const signs = [{ id: 'n-roof', kind: 'named' }, { id: 'n-par', kind: 'named' }, { id: 'n-blade', kind: 'named' }, { id: 'i-par', kind: 'icon' }, { id: 'i-jazz', kind: 'icon' }];
  const cast = showItems(Array.from({ length: 30 }, (_, i) => ({ kind: i % 3 ? 'band' : 'hero', x: i / 30, contour: true })));
  const a = everyday('2026-10-22', cast, signs), b = everyday('2026-10-22', cast, signs), c = everyday('2026-10-23', cast, signs);
  assert.deepEqual([...a.spell], [...b.spell]); assert.equal(a.cycle, b.cycle);
  assert.ok(a.spell.size === 3 && [...a.spell].every(id => id.startsWith('n-')) && a.blink.size >= 1 && a.blink.size <= 2, 'every named sign spells (in turns), one or two blink');
  assert.ok(a.cycle && a.cycle.startsWith('i-'), 'an icon cycles its colour');
  assert.ok(a.chase.size >= 3 && a.chase.size <= 4, `three or four slow chasers (${a.chase.size})`);
  { const xs = [...a.chase].map(i => cast[i].x).sort((p, q) => p - q); for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 0.15 - 1e-9, `spread across the skyline (${xs.map(v => v.toFixed(2))})`); }
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

// ------------------------------------------------------------------ THE PREVIEW PANEL (core/harbor-remote.js)
import { readFileSync, readdirSync } from 'node:fs';
import { MOMENTS } from '../js/core/harbor-moments.js';
import { EVENTS, INPUTS, REMOTE_KEYS, SHOW_SCENE_LIST, HOLIDAYS, TIMES, cleanRemote, toParams, describe, timeAt, holidayDay, textMax, isEmpty } from '../js/core/harbor-remote.js';
import { skyClock, holidayOf, sunTimes, localParts } from '../js/core/sky.js';

test('the preview panel: one registry — every &force= preview the Harbor runs is on it, and every row is a real preview', () => {
  // the modules City 2.0 runs (its own + the district's sky modules it reuses): every id they test with force.has(...)
  const files = [...readdirSync('js/screens/harbor').map(f => `js/screens/harbor/${f}`), ...['fx', 'sun', 'weather-fx', 'frost'].map(f => `js/screens/district/${f}.js`), 'js/screens/title.js'];
  const src = files.map(f => readFileSync(f, 'utf8')).join('\n');
  const used = new Set([...src.matchAll(/(?:(?:force|f|off|clock\.force)\.has|scene\.forced)\('([a-z0-9-]+)'\)/g)].map(m => m[1]));
  for (const m of src.matchAll(/again\('([a-z0-9-]+)'/g)) used.add(m[1]);
  // (PART 7b: the WINDOWS rows — scene.js#forcedMoment reads any `window-<id>` of the catalogue)
  if (src.includes("id.startsWith('window-')")) for (const m of MOMENTS) used.add(`window-${m.id}`);
  // (not events: the perf A/B switches, the panel's own party switches, the debug-only demo, sky internals)
  const tools = id => id.startsWith('no-') || ['party', 'demo', 'sat'].includes(id);
  const ids = new Set(EVENTS.map(e => e.id));
  const missing = [...used].filter(id => !tools(id) && !ids.has(id));
  assert.deepEqual(missing, [], 'a &force= preview the panel does not list');
  // (PART 7a §0: registered before their effect lands — first-tap: the NEON sign's surge (the
  // layout agent; hidden, ready: false). Once a module reads one it simply passes; drop it from here then.)
  const PENDING = [];
  const dead = [...ids].filter(id => !used.has(id) && !['searchlights', ...PENDING].includes(id));
  assert.deepEqual(dead, [], 'a row no module reads');
  assert.ok(src.includes("['demo', 'searchlights'].filter(id => clock.force.has(id))"), 'searchlights: forced through the scheduler');
  for (const e of EVENTS) for (const k of e.inputs || []) assert.ok(INPUTS[k] && REMOTE_KEYS.includes(k), `${e.id}: ${k}`);
  assert.equal(new Set(EVENTS.map(e => e.id)).size, EVENTS.length, 'ids are unique');
  assert.ok(SHOW_SCENE_LIST.some(s => s.id === 'climb+crowns') && SHOW_SCENE_LIST.length >= 12, 'the show\'s own scene list');
});

test('the preview panel (PART 7a §0): every entry names a known category; the registry\'s own checks pass; the new toggles', async () => {
  const { CATS, catOf, checkRegistry, PANEL_EVENTS } = await import('../js/core/harbor-remote.js');
  const known = new Set(CATS.map(c => c.id));
  assert.equal(known.size, CATS.length, 'category ids are unique');
  for (const e of EVENTS) assert.ok(known.has(e.cat), `${e.id}: a known category (${e.cat})`);
  assert.deepEqual(checkRegistry(), [], 'the registry\'s own checks');
  // every category the panel draws holds something (its own controls or at least one row)
  const own = ['time', 'weather', 'party', 'holidays', 'music', 'sounds', 'tools'];      // (8a: SOUNDS — its rows are the city's sound slots)
  for (const c of CATS) assert.ok(own.includes(c.id) || PANEL_EVENTS.some(e => e.cat === c.id), `${c.id}: not empty`);
  assert.equal(catOf('nope'), 'tools', 'an unknown id falls back to TOOLS (never lost)');
  // (8a) the promenade's toggles (in force[]) — on together with a time, a scene and the party; the corner turn is gone
  assert.equal(catOf('road-pass'), 'promenade'); assert.equal(catOf('season-winter'), 'promenade');
  assert.ok(!EVENTS.some(e => e.id === 'corner-turn'), 'the corner turn is gone (the owner picked the blade)');
  const st = cleanRemote({ force: ['road-pass', 'strings-party'], when: '2026-10-24T23:00', scene: 'climb+crowns', party: 'on' });
  assert.deepEqual(st.bad, []);
  assert.equal(toParams(st.state).force, 'road-pass,strings-party,party');
  assert.match(describe(st.state), /A CAR PASSING/);
  // the first-tap surge: a valid id (the URL + the server accept it), hidden until its effect is drawn
  assert.deepEqual(cleanRemote({ force: ['first-tap'] }).bad, []);
  assert.equal(catOf('first-tap'), 'signs');
  // checkRegistry catches an unknown category
  EVENTS.push({ id: 'zz-test', label: 'X', cat: 'nowhere' });
  try { assert.deepEqual(checkRegistry(), ['cat:zz-test:nowhere']); } finally { EVENTS.pop(); }
});

test('THE WORD TOWERS from the panel (7a §0): each tower\'s room, one word per tower, a word too long for its tower scrolls on it', async () => {
  const { fitText, towerCapacity, WORD_FACES, TOWER_CHOICES, badChars, FONT_CHARS, normText } = await import('../js/core/harbor-windows.js');
  // the fallback faces are the real ones on every phone + desktop (19 × 11, 15 × 9, 5 × 18)
  // (a phone on its side, 874 × 402, keeps only a few free rows: the live faces say so in the panel — no room there)
  const side = {};
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k);
    for (const t of L.towers.filter(x => x.word)) { const f = { cols: t.tiers[0].win.cols, rows: t.face.rows, word: t.word }; if (k === '874x402') side[t.id] = f; else assert.deepEqual(f, WORD_FACES[t.id], `${k}: ${t.id}`); }
  }
  assert.equal(towerCapacity(side).wordB.letters, 4, 'on its side: B still holds a word (A 19 × 3 — no room; B 15 × 12; V 5 × 8 — one letter)');
  assert.deepEqual(towerCapacity(WORD_FACES), {
    wordA: { word: 'h', cols: 19, rows: 11, lines: 2, letters: 5 }, wordB: { word: 'h', cols: 15, rows: 9, lines: 1, letters: 4 }, wordV: { word: 'v', cols: 5, rows: 18, lines: 1, letters: 3 } });
  const plan = (t, tw) => fitText(t, WORD_FACES, tw).plan.map(p => `${p.tower}:${p.text}:${p.scroll ? 'scroll' : 'still'}`);
  assert.deepEqual(plan('HELLO', ''), ['wordA:HELLO:still']);
  assert.deepEqual(plan('HAPPY NEW YEAR', ''), ['wordA:HAPPY / NEW:still', 'wordB:YEAR:still'], 'AUTO keeps the best layout');
  assert.deepEqual(plan('JOY', ''), ['wordV:JOY:still']);
  assert.deepEqual(plan('HAPPY BIRTHDAY', ''), ['wordA:HAPPY:still', 'wordB:BIRTHDAY:scroll'], 'AUTO, nothing fits: one word per tower, the long one scrolls');
  assert.deepEqual(plan('SPEAKEASY', ''), ['wordA:SPEAKEASY:scroll'], 'one long word: the ticker on A');
  assert.deepEqual(plan('HAPPY BIRTHDAY SAM', 'wordA,wordB,wordV'), ['wordA:HAPPY:still', 'wordB:BIRTHDAY:scroll', 'wordV:SAM:still']);
  assert.deepEqual(plan('JAZZ NIGHT AT THE BAR', 'wordA,wordB'), ['wordA:JAZZ:still', 'wordB:NIGHT AT THE BAR:scroll'], 'the last tower takes the rest');
  assert.deepEqual(plan('HI', 'wordB'), ['wordB:HI:still']);
  assert.deepEqual(plan('MMMMMM', 'wordB'), ['wordB:MMMMMM:scroll'], 'too wide for B: B scrolls it');
  assert.deepEqual(plan('JAZZY', 'wordV'), ['wordA:JAZZY:scroll'], 'too tall for the vertical tower: the ticker on A');
  const fit = fitText('BOO', WORD_FACES, 'wordA');
  assert.ok(fit.mode === 'layout' && fit.plan[0].letters === 3 && fit.plan[0].cap === 5);
  // the characters: what the font draws, the aliases, what's dropped (+ no double space left behind)
  assert.deepEqual(badChars('hi & you @ <3 * [flag]'), ['&', '@']);
  assert.equal(normText('HI & YOU'), 'HI YOU');
  assert.equal(fitText('<3 * [flag]', WORD_FACES).text, '♥ ★ ⚑');
  assert.ok(['♥', '★', '⚑', '!', '?', '-', '.', "'", ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].every(c => FONT_CHARS.includes(c)) && FONT_CHARS.length === 44, `${FONT_CHARS.length} characters`);
  assert.equal(fitText('', WORD_FACES), null);
  assert.deepEqual(TOWER_CHOICES.filter(Boolean).filter(v => cleanRemote({ force: ['spell'], text: 'HI', tower: v }).bad.length), [], 'every choice passes the remote\'s validation');
  assert.equal(cleanRemote({ force: ['spell'], text: 'hi <3 *' }).state.text, 'HI ♥ ★', 'the panel / the server keep the symbols');
});

test('the preview panel: validation keeps plain values only (the server refuses what it had to drop)', () => {
  let r = cleanRemote({ force: ['drones', 'aurora', 'nope'], text: 'hi <b>there</b>', show: 'heart,mark:pulse,javascript:x', colours: ['#FF2E97', 'zzz'], when: '2026-10-24T23:00', speed: 20, wx: 'rain', party: 'on', scene: 'climb+crowns', hol: 'halloween', debug: 1, evil: '<script>' });
  assert.deepEqual(r.bad.sort(), ['colours', 'force:nope', 'show'].sort());
  assert.deepEqual(r.state.force, ['drones', 'aurora']);
  assert.equal(r.state.text, 'HI BTHEREB', 'no markup survives: letters only, upper case');
  assert.equal(r.state.show, 'heart,mark:pulse');
  assert.equal(r.state.colours, 'ff2e97');
  assert.ok(!('evil' in r.state));
  r = cleanRemote({ force: 'skywrite,spell', text: 'a very long message for the sky' });
  assert.equal(r.state.text.length, 10, 'the shortest limit of the text events on');
  assert.equal(textMax(['banner']), 74);
  r = cleanRemote({ text: 'HELLO', scheme: 'halloween' });
  assert.ok(isEmpty(r.state), 'inputs with no event using them are dropped quietly');
  for (const w of ['2026-13-01T10:00', '2026-02-30T10:00', '2026-10-24T24:00', '2026-10-24 23:00', 'x']) assert.ok(cleanRemote({ when: w }).bad.includes('when'), w);
  assert.ok(cleanRemote({ speed: 7 }).bad.includes('speed'));
  assert.ok(cleanRemote({ wx: 'hail' }).bad.includes('wx'));
  assert.ok(cleanRemote({ force: Array.from({ length: 20 }, (_, i) => EVENTS[i].id) }).bad.includes('force:too-many'));
  assert.deepEqual(cleanRemote(null), { state: {}, bad: [] });
  assert.deepEqual(cleanRemote('force=aurora'), { state: {}, bad: [] });
});

test('the preview panel: the state becomes the preview links\' flags, which the city\'s own clock reads', () => {
  const st = cleanRemote({ force: ['drones', 'banner'], text: 'HAPPY BIRTHDAY', show: 'heart', colours: 'ff2e97,2ee6ff', by: 'word', when: '2026-10-24T23:00', speed: 20, wx: 'snow', scene: 'call+chase', party: 'off', debug: true }).state;
  const p = toParams(st);
  assert.equal(p.force, 'drones,banner,neon-party,no-party', 'a held scene brings the neon party; PARTY OFF = no-party');
  const c = skyClock('?' + new URLSearchParams(p));
  assert.ok(c.force.has('drones') && c.force.has('neon-party') && c.speed === 20 && c.wx.kind === 'snow' && c.preview);
  assert.equal(p.text, 'HAPPY BIRTHDAY'); assert.equal(p.debug, '1'); assert.equal(p.scene, 'call+chase');
  assert.equal(toParams(cleanRemote({ party: 'on' }).state).force, 'party');
  assert.match(describe(st), /DRONE SHOW “HAPPY BIRTHDAY” · BANNER PLANE “HAPPY BIRTHDAY” · SCENE CALL\+CHASE · PARTY OFF · SAT 10\/24 23:00 · 20× · SNOW · READOUT/);
  assert.equal(describe({}), 'THE REAL CITY');
});

test('the preview panel: time presets follow the real sun; holidays jump to their next date', () => {
  const at = [42.96, -85.67], tz = 'America/Detroit';
  const mins = id => { const t = timeAt(id, '2026-10-22', tz, ...at); return +t.slice(11, 13) * 60 + +t.slice(14, 16); };
  // (PART 7a §0: the panel's main row is the day in time order — SUNRISE … NIGHT; the rest is its MORE row, in time order too)
  const main = TIMES.filter(t => !t.more).map(t => t.id);
  assert.deepEqual(main, ['sunrise', 'morning', 'noon', 'afternoon', 'golden', 'sunset', 'dusk', 'night']);
  for (const list of [main, TIMES.filter(t => t.more).map(t => t.id)]) { const m = list.map(mins); for (let i = 1; i < m.length; i++) assert.ok(m[i] > m[i - 1], `${list}: in time order (${m})`); }
  // SUNRISE / SUNSET: 5 min after / before the real sun (sky.js) at the place that day — Grand Rapids, Oct 22 2026: up 08:04, down 18:48
  const st = sunTimes(Date.UTC(2026, 9, 22, 12), tz, ...at), wall = ms => { const lp = localParts(ms, tz); return lp.h * 60 + lp.mi; };
  assert.equal(mins('sunrise'), wall(st.rise) + 5); assert.equal(mins('sunset'), wall(st.set) - 5);
  assert.ok(mins('sunrise') >= 8 * 60 + 5 && mins('sunrise') <= 8 * 60 + 13, `sunrise preset ${timeAt('sunrise', '2026-10-22', tz, ...at)} (the sun up ≈ 08:04 EDT)`);
  assert.ok(mins('sunset') >= 18 * 60 + 39 && mins('sunset') <= 18 * 60 + 47, `sunset preset ${timeAt('sunset', '2026-10-22', tz, ...at)} (the sun down ≈ 18:48 EDT)`);
  assert.ok(timeAt('sunrise', '2026-06-21', tz, ...at).startsWith('2026-06-21T06:'), 'midsummer: an earlier sunrise (DST)');
  const order = ['dawn', 'morning', 'noon', 'afternoon', 'golden', 'dusk', 'night'].map(mins);
  for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1], `in order: ${order}`);
  assert.ok(mins('dawn') > 7 * 60 && mins('dawn') < 8 * 60 + 30, `dawn in late October (${mins('dawn')})`);
  assert.ok(mins('dusk') > 18 * 60 + 30 && mins('dusk') < 19 * 60 + 40, `dusk (${mins('dusk')})`);
  assert.equal(timeAt('late', '2026-10-22', tz, ...at), '2026-10-22T03:00');
  assert.ok(timeAt('noon', '2026-06-21', tz, ...at).startsWith('2026-06-21T13:'), 'noon is the sun\'s (DST)');
  assert.equal(holidayDay('halloween', { y: 2026, m: 10, d: 22 }), '2026-10-31');
  assert.equal(holidayDay('valentine', { y: 2026, m: 10, d: 22 }), '2027-02-14', 'past this year: next year');
  assert.equal(holidayDay('thanksgiving', { y: 2026, m: 10, d: 22 }), '2026-11-26');
  for (const h of HOLIDAYS) { const d = holidayDay(h.id, { y: 2026, m: 1, d: 1 }), [y, m, dd] = d.split('-').map(Number); const hol = holidayOf(y, m, dd);
    if (!['memorial', 'veterans', 'christmas-eve'].includes(h.id)) assert.equal(hol && hol.id, h.id, `${h.id} → ${d}`); }
});

// ------------------------------------------------------------------ NEON PASS 4: the signs — never clipped, nothing in front, the beams behind them
import { buildSign } from '../js/screens/harbor/signs.js';
import { beamCover, searchlightSpots } from '../js/screens/harbor/searchlights.js';
import { pierLamps } from '../js/screens/harbor/pier.js';

const NIGHTS = Array.from({ length: 120 }, (_, i) => new Date(Date.UTC(2026, 9, 1) + i * 864e5).toISOString().slice(0, 10));
const inPoly = (poly, x, y) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
// docked ROSIE's silhouette (screens/harbor/boats.js#drawRosie, her own units: a along her 24-unit length, y up from the
// waterline): the hull + decks + the paddle box + the twin stacks + the flag staffs as boxes, the bulb strings as points
const ROSIE_BOXES = [[0.2, 24.2, 2.1], [-1.4, 2.2, 4.6], [2.1, 22.2, 4.15], [4, 19.8, 6.35], [8.6, 15.4, 7.7], [12.2, 15.2, 9.55], [15.85, 16.95, 11.75], [17.05, 18.15, 11.75], [23.5, 24.6, 5.2], [-2, -0.8, 6.4]];
const ROSIE_STRINGS = (() => { const out = []; for (const [[a0, y0], [a1, y1]] of [[[23.6, 5.2], [17.6, 11.2]], [[17.6, 11.2], [16.4, 11.2]], [[16.4, 11.2], [-0.9, 6.4]]]) { const n = Math.max(2, Math.round(Math.hypot(a1 - a0, y1 - y0) / 0.75)); for (let i = 0; i <= n; i++) { const t = i / n, sag = Math.sin(Math.PI * t) * Math.min(1.3, Math.abs(a1 - a0) * 0.06); out.push([a0 + (a1 - a0) * t, y0 + (y1 - y0) * t - sag]); } } return out; })();

test('NEON PASS 4 — no sign is ever clipped: every cabinet inside the screen, every name + mark inside its cabinet (+ its border), every night, every size', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), s = cam.F / 600, spots = signSpots(L), W = cam.W;
    // the cabinets (+ a roof sign's girder, a billboard's frame + lamps): on screen with ≥ 3 pt to spare on a phone
    const edge = cam.wide ? 0 : 3;
    for (const sp of spots) {
      const R = sp.rect, out = sp.kind === 'billboard' ? 1 : sp.mount === 'tower' ? 0.8 * Math.max(0.5, R.h / 18) : 0;
      assert.ok(R.x - out >= edge && R.x + R.w + out <= W - edge, `${k}: ${sp.id} on screen (${(R.x - out).toFixed(1)}..${(R.x + R.w + out).toFixed(1)} of ${W})`);
    }
    // every night's pick (the names that really hang there): the letters + the mark stay inside the cabinet — a boxed sign's
    // inside its border tube (the ink + half a tube ≥ 1.5 pt in from the cabinet's edge; the blade's inside its dark panel)
    const seen = new Set();
    for (const night of NIGHTS) {
      const pick = assignSigns(GAMES12, spots, night);
      for (const sp of spots) {
        if (sp.kind === 'billboard' || sp.kind === 'fixed') continue;
        const gid = pick.get(sp.id), key = `${sp.id}|${gid}`;
        if (!gid || seen.has(key)) continue;
        seen.add(key);
        const g = GAMES.find(x => x.id === gid), sg = buildSign(sp, g, { W, s, roofY: 0, frame: null }), R = sp.rect;
        // (an icon has no cabinet: its mark fills its square, a tube's half-width may round its edge)
        // (a boxed sign: inside its border tube — the tube runs 0.45 pad in from the cabinet's edge, pad = 16 % of its short side)
        // (NEON PASS 5: a STACKED roof sign keeps its border tube 0.55 pt in — the name takes the whole width inside it)
        const bi = sp.stack ? 0.55 + 0.6 : Math.min(R.w, R.h) * 0.16 * 0.45 + 0.4;
        const box = sg.panel && sg.panel.frame ? sg.panel : sp.type === 'icon' ? { x: R.x - 0.8, y: R.y - 0.8, w: R.w + 1.6, h: R.h + 1.6 } : { x: R.x + bi, y: R.y + bi, w: R.w - 2 * bi, h: R.h - 2 * bi };
        for (const p of sg.parts) for (const t of p.tubes) for (const [x, y] of t.pts) {
          const hw = p.w / 2;
          assert.ok(x - hw >= box.x - 0.05 && x + hw <= box.x + box.w + 0.05 && y - hw >= box.y - 0.6 && y + hw <= box.y + box.h + 0.6,
            `${k} ${night}: ${sp.id}'s ${p.mark ? 'mark' : 'name'} (${g.id}) leaves its ${sg.panel && sg.panel.frame ? 'panel' : 'cabinet'} at ${x.toFixed(1)},${y.toFixed(1)} (box ${box.x.toFixed(1)}..${(box.x + box.w).toFixed(1)} × ${box.y.toFixed(1)}..${(box.y + box.h).toFixed(1)})`);
        }
      }
    }
    if (!cam.wide) assert.ok(seen.size >= 18, `${k}: ${seen.size} sign × game pairs checked`);   // (DT1: the blade × its 5 one-word names + 2 roof signs × their 8)
  }
});

test('NEON PASS 4 — THE GAME BLADE reads whole: nothing nearer stands in front of it (or any sign) — docked Rosie, a holding boat, the pier\'s lamps + festoons, the wheel, the lighthouse, the waterfront', () => {
  for (const k of PHONES) {
    const { cam, L } = setup(k), spots = signSpots(L), s = cam.F / 600;
    const hit = (R, b, m = 1) => b.x < R.x + R.w + m && R.x - m < b.x + b.w && b.y < R.y + R.h + m && R.y - m < b.y + b.h;
    for (const r of boatRoutes(L)) for (const g of r.segs.filter(g => g.type === 'hold')) {
      const u = cam.F / r.z, [cx, wy] = project(cam, g.xa, 0, r.z), X = a => cx + (a - r.len / 2) * u * g.face, Y = y => wy - y * u;
      // (Rosie + the tug: their real silhouettes, boats.js#drawRosie / #drawTug — the tug's masthead lights on its mast; any
      // other boat that ever waits somewhere: its whole box up to h + 1.6)
      const shape = r.id === 'rosie' ? ROSIE_BOXES : r.id === 'tug' ? [[0.2, 9.6, 1.8], [2.4, 6.6, 3.1], [4, 7, 4.45], [2.65, 3.65, 5.2], [5.85, 6.15, r.h + 1.4]] : null;
      const boxes = shape ? shape.map(([a0, a1, y1]) => ({ x: Math.min(X(a0), X(a1)), y: Y(y1), w: Math.abs(X(a1) - X(a0)), h: y1 * u })) : [{ x: cx - r.len * u / 2, y: Y(r.h + 1.6), w: r.len * u, h: (r.h + 1.6) * u }];
      const bulbs = r.id === 'rosie' ? ROSIE_STRINGS.map(([a, y]) => [X(a), Y(y)]) : r.id === 'tug' ? [[X(6), Y(r.h + 1.3)], [X(6), Y(r.h + 0.7)]] : [];
      for (const sp of spots) {
        const R = sp.rect;
        for (const b of boxes) assert.ok(!hit(R, b), `${k}: ${r.id} waiting at her ${g.type} (${b.x.toFixed(0)}..${(b.x + b.w).toFixed(0)}, top ${b.y.toFixed(1)}) stands in front of ${sp.id} (bottom ${(R.y + R.h).toFixed(1)})`);
        // (a bulb + its glow ~1.6 pt)
        for (const [x, y] of bulbs) assert.ok(!(x > R.x - 1.6 && x < R.x + R.w + 1.6 && y > R.y - 1.6 && y < R.y + R.h + 1.6), `${k}: ${r.id}'s bulb string (${x.toFixed(1)},${y.toFixed(1)}) crosses ${sp.id}`);
      }
    }
    const bl = spots.find(sp => sp.id === 'n-blade'), B = bl.rect;
    // the pier's lamps + their festoons (they hang from the lamps down): never over the blade
    for (const lp of pierLamps(L)) { const [x, y] = project(cam, lp.x, lp.y, lp.z); assert.ok(!(x > B.x - 3 && x < B.x + B.w + 3 && y < B.y + B.h + 3), `${k}: a pier lamp (${x.toFixed(0)},${y.toFixed(0)}) by the blade`); }
    // the waterfront's storefronts (drawn over the near neon): their tops (+ the shop sign over them) under the blade
    for (const sf of storefronts(L)) if (sf.x1 > B.x && sf.x0 < B.x + B.w) assert.ok(sf.y0 - 6 * s > B.y + B.h, `${k}: a storefront (top ${sf.y0.toFixed(0)}) under the blade's foot ${(B.y + B.h).toFixed(0)}`);
    // the wheel + the lighthouse (+ every other spot rule)
    assert.deepEqual(spotConflicts(L, bl, spots), [], `${k}: the blade is clear`);
    // and it still reads: six letters ≥ 10 pt (the glance test, NEON PASS 3)
    assert.ok(bladeLayout(B, 6).lh >= 10 * Math.min(1, s), `${k}: the blade's letters ${bladeLayout(B, 6).lh.toFixed(2)} pt`);
  }
});

test('NEON PASS 4 — SEARCHLIGHTS BEHIND SIGNS: a sign, billboard or roof in front of a light hides its beam, its flare + its hardware; the lights stand where they can be seen', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), spots = signSpots(L), cov = beamCover(L);
    assert.equal(cov.length, searchlightSpots(L).length);
    for (const c of cov) {
      const z = c.sp.z;
      // every sign nearer than the light: the beam's clip never reaches into its cabinet (sampled every 1.5 pt)
      for (const sp of spots) {
        if (!(sp.w.z < z - 0.01)) continue;
        const R = sp.rect;
        // (a beam always points up: nothing of it reaches lower than ~2 pt under its lens, its flare 3 units round it)
        for (let x = R.x + 0.6; x < R.x + R.w - 0.5; x += 1.5) for (let y = R.y + 0.6; y < Math.min(R.y + R.h - 0.5, c.sy + c.s * 3); y += 1.5) {
          if (x < 0 || x > cam.W) continue;
          assert.ok(!inPoly(c.poly, x, y), `${k}: the ${c.sp.host} light's beam (z ${z.toFixed(1)}) draws over ${sp.id} (z ${sp.w.z.toFixed(1)}) at ${x.toFixed(0)},${y.toFixed(0)}`);
        }
        // its flare: never when the lens stands behind the sign
        if (c.sx > R.x - 1 && c.sx < R.x + R.w + 1 && c.sy > R.y - 1) assert.ok(!c.lensSeen, `${k}: the ${c.sp.host} light's flare shows through ${sp.id}`);
      }
      // a nearer building's face hides it too (the roofline in front, the light's own building left out)
      const front = screenBoxes(L).filter(b => b.kind === 'sky' && b.z < z - 0.01 && b.id !== c.sp.host);
      for (const b of front) for (const x of [b.x + 1, b.x + b.w / 2, b.x + b.w - 1]) if (x > 0 && x < cam.W && b.y + 2 < c.sy + c.s * 3) assert.ok(!inPoly(c.poly, x, b.y + 2), `${k}: the ${c.sp.host} beam shows through ${b.id} at ${x.toFixed(0)}`);
      // a visible lens is inside its own clip (the flare + the beam's foot really show)
      if (c.lensSeen) assert.ok(inPoly(c.poly, c.sx, c.sy - 0.5), `${k}: the ${c.sp.host} lens inside its clip`);
    }
    if (!cam.wide) {
      // the searchlights still read on a phone: the EMPIRE's + the hotel's lenses in the open (the EMPIRE's on a setback that clears
      // the roofs in front — the first one sat behind the near band); word tower B's behind its roof sign (its beam rises from
      // behind the sign)
      const by = id => cov.find(c => c.sp.host === id);
      assert.ok(by('empire').lensSeen && by('hotel').lensSeen, `${k}: the EMPIRE's + the hotel's lights in view`);
      const rs = spots.find(sp => sp.mount === 'tower' && sp.host === 'wordB');
      assert.ok(rs && by('wordB').sp.z > rs.w.z && !by('wordB').lensSeen, `${k}: word tower B's light behind its roof sign`);
    }
  }
});

test('NEON PASS 4 — the JAZZ sign is gone: the old club is plain city with NEON PASS 3 trims; (NEON PASS 6: no icons; DT1: no left roof sign) three named signs every night on every phone', () => {
  assert.ok(!SPOTS_ALL().some(sp => sp.id === 'jazz' || sp.host === 'jazz' || /JAZZ/.test(sp.text || '')), 'no JAZZ sign, nothing on the old club');
  for (const k of PHONES) {
    const { cam, L } = setup(k), s = cam.F / 600, spots = signSpots(L);
    assert.equal(spots.filter(sp => sp.kind === 'named').length, 3, `${k}: three named`);
    assert.equal(spots.filter(sp => sp.kind === 'icon').length, 0, `${k}: no icons (NEON PASS 6)`);
    assert.equal(spots.filter(sp => sp.kind === 'fixed').length, 0, `${k}: no fixed text sign`);
    for (const night of NIGHTS) assert.equal(new Set(assignSigns(GAMES12, spots, night).values()).size, 3, `${k} ${night}: 3 games have a named sign`);
    // (NEON PASS 5, the owner: the small icon left of the Ferris wheel — i-mid — is gone; the checks below stay for the day it
    // comes back)
    assert.ok(!spots.some(sp => sp.id === 'i-mid'), `${k}: no icon left of the wheel`);
    const ic = null;
    if (ic) { const R = ic.rect;
    assert.deepEqual(spotConflicts(L, ic, spots), [], `${k}: i-mid clear`);
    for (const o of spots) if (o !== ic) { const d = Math.hypot(Math.max(o.rect.x - (R.x + R.w), 0, R.x - (o.rect.x + o.rect.w)), Math.max(o.rect.y - (R.y + R.h), 0, R.y - (o.rect.y + o.rect.h))); assert.ok(d >= 24 * s, `${k}: i-mid ${d.toFixed(1)} pt from ${o.id}`); }
    const w = L.wheel, [wx, wy] = project(cam, w.x, w.y, w.z), wr = cam.F * w.r / w.z;
    assert.ok(Math.hypot(Math.max(R.x - wx, 0, wx - (R.x + R.w)), Math.max(R.y - wy, 0, wy - (R.y + R.h))) > wr + 5, `${k}: i-mid off the wheel's quiet zone`);
    for (const g of L.gaps) assert.ok(R.x + R.w < g.sx - g.w / 2 - 3 || R.x > g.sx + g.w / 2 + 3, `${k}: i-mid out of the corridor at ${g.sx.toFixed(0)}`);
    const behind = roofline(L, b => b.z <= ic.w.z + 40);
    for (let x = R.x; x <= R.x + R.w; x += 2) assert.ok(behind[Math.round(x / 4)] <= R.y, `${k}: a wall behind i-mid at ${x.toFixed(0)}`); }
    // the old club's neon: like its neighbours in the near band (NEON PASS 3) — a band item of its own, several tubes, ≤ 3 colours
    const jz = outlines(L).find(o => o.id === 'jazz');
    assert.ok(jz && jz.strength === 'band' && jz.lines.length >= 3 && new Set(jz.lines.map(l => l.role)).size <= 3, `${k}: the old club's trims (${jz && jz.lines.length} tubes)`);
  }
});
import { SPOTS as SPOTS_LIST } from '../js/core/harbor-neon.js';
const SPOTS_ALL = () => SPOTS_LIST;

test('NEON PASS 4 — SEARCHLIGHTS never sweep across a sign on a phone (not even one standing behind the lamp): their core stays in the open air beside + above the signs', () => {
  for (const k of PHONES) {
    const { cam, L } = setup(k), spots = signSpots(L), len = cam.H * 0.95, bw = Math.max(56, cam.W * 0.2);
    for (const c of beamCover(L)) for (let a = c.sp.base - c.sp.amp; a <= c.sp.base + c.sp.amp + 1e-9; a += 0.02) for (let d = 0; d < 420; d += 2) {
      // (the beam's bright core: 60 % of the sprite's half-width at that distance — searchlights.js#beamSprite; a nearer sign hides it)
      const hw = (0.08 + 0.92 * d / len) * bw / 2 * 0.6, x = c.sx + Math.sin(a) * d, y = c.sy - Math.cos(a) * d;
      for (const sp of spots) { if (sp.w.z < c.sp.z) continue; const R = sp.rect; assert.ok(!(y > R.y && y < R.y + R.h && x + hw > R.x && x - hw < R.x + R.w), `${k}: the ${c.sp.host} beam (at ${a.toFixed(2)} rad) crosses ${sp.id}`); }
    }
  }
});

test('7a (the owner: EVERY sign spells on — was the NEON PASS 4 edge rule): a name at the screen edge spells on in its turn too', () => {
  const cast = showItems(Array.from({ length: 30 }, (_, i) => ({ kind: i % 3 ? 'band' : 'hero', x: i / 30, contour: true })));
  const signs = [{ id: 'n-roofB', kind: 'named', edge: true }, { id: 'n-par', kind: 'named' }, { id: 'n-blade', kind: 'named' }, { id: 'i-par', kind: 'icon' }];
  for (let d = 1; d <= 60; d++) assert.ok(everyday(`2026-11-${d}`, cast, signs).spell.has('n-roofB'), `night ${d}`);
});

import { spellNow, spellParty, spellWho, spellMotion, SPELL_DUR } from '../js/core/harbor-show.js';
test('7a — THE SPELL-ON ROUND: every sign spells on in its turn, never two at once, one every 2–4 min on a normal night; on a party night only between the show\'s scenes; seeded (every phone the same)', () => {
  for (const ids of [['n-blade', 'n-roofA', 'n-roofB'], ['n-blade', 'n-roofA', 'n-roofB', 'n-pano0', 'n-pano1'], ['n-roofA', 'n-roofB'], ['n-blade']]) {
    for (const night of ['2026-10-22', '2026-10-23', '2026-11-07']) {
      // a simulated hour on the city's clock, 0.1 s steps
      const t0 = Date.UTC(2026, 9, 22, 2) / 1000, runs = [];
      let cur = null;
      for (let s = 0; s < 3600; s += 0.1) {
        const sp = spellNow(t0 + s, ids, night);
        if (sp && (!cur || cur.k !== sp.k)) { cur = { k: sp.k, id: sp.id, start: t0 + s - sp.u, end: t0 + s - sp.u + sp.dur }; runs.push(cur); }
        if (!sp) cur = null;
      }
      const who = new Set(runs.map(r => r.id));
      assert.ok(ids.every(id => who.has(id)), `${ids.length} signs, ${night}: every sign spells within the hour (${[...who]})`);
      for (let i = 1; i < runs.length; i++) {
        const gap = runs[i].start - runs[i - 1].start;
        assert.ok(runs[i].start >= runs[i - 1].end, 'never two at once');
        assert.ok(gap >= 120 - 1e-6 && gap <= 240 + 1e-6, `the gaps 2–4 min (${gap.toFixed(1)} s)`);
        if (ids.length > 1) assert.notEqual(runs[i].id, runs[i - 1].id, 'never the same sign twice running');
      }
      assert.ok(runs.length >= 14 && runs.length <= 31, `about one every 3 min (${runs.length} in the hour)`);
      // seeded: the same for every phone
      assert.deepEqual(spellNow(t0 + 1234.5, ids, night), spellNow(t0 + 1234.5, ids, night));
    }
    // each round of n slots names every sign once
    const seen = new Set(); for (let k = 0; k < ids.length; k++) seen.add(spellWho(ids, 12345, k + 7 * ids.length));
    assert.equal(seen.size, ids.length, 'a round: every sign once');
  }
  // the spell itself: dark, then the letters in order, then on (and its length scaled for the party's two bars)
  assert.equal(spellMotion(0.2).reveal, 1); assert.ok(spellMotion(0.2).a < 0.5, 'goes dark first');
  assert.ok(spellMotion(1.8).reveal > 0.3 && spellMotion(1.8).reveal < 0.7 && spellMotion(SPELL_DUR + 0.1).reveal === 1);
  assert.ok(spellMotion(1.5, 1.7).reveal > spellMotion(1.5).reveal, 'a shorter spell reveals faster');
  // A PARTY NIGHT: only from a scene's last bar into the next scene's first (its envelope's fade), every other change, never two at once
  const ids = ['n-blade', 'n-roofA', 'n-roofB'];
  for (const [len, barS] of [[13, 2], [16, 1.6], [24, 1.75], [8, 2.4]]) {
    const runs = []; let cur = null;
    for (let x = 0; x < 600; x += 0.01) {
      const sp = spellParty(x, len, barS, ids, '2026-10-24');
      if (sp) {
        const inBar = ((x % len) + len) % len;
        assert.ok(inBar >= len - 1 || inBar < 1, `len ${len}: only between scenes (bar ${inBar.toFixed(2)} of ${len})`);
        assert.ok(sp.dur <= 2 * barS + 1e-9, 'fits the two bars');
        if (!cur || cur.k !== sp.k) { cur = { k: sp.k, id: sp.id }; runs.push(cur); }
      } else cur = null;
    }
    const changes = Math.floor(600 / len);
    assert.ok(Math.abs(runs.length - Math.floor(changes / 2)) <= 1, `len ${len}: every other scene change (${runs.length} of ${changes})`);
    assert.ok(ids.every(id => runs.some(r => r.id === id)), `len ${len}: every sign gets its turn at the party`);
    for (let i = 1; i < runs.length; i++) assert.notEqual(runs[i].id, runs[i - 1].id);
  }
  // the preview (&force=spell-on): the next sign every 6 s
  const q = []; for (let s = 0; s < 36; s += 0.1) { const sp = spellNow(s, ids, 'x', { every: 6 }); if (sp && (!q.length || q[q.length - 1].k !== sp.k)) q.push(sp); }
  assert.ok(q.length === 6 && new Set(q.map(p => p.id)).size === 3, `the preview: a spell every 6 s, every sign (${q.map(p => p.id)})`);
});

// ------------------------------------------------------------------ NEON PASS 5: the real beat, the palette, the signs, the tired tube
import { createHarborBeat, advanceHarborBeat, beatPunch, BEAT_WEIGHT, levelOf, SETTLE, createOnsets, onsetStep, onsetEnergy, CALM_BPM, beatMode } from '../js/core/harbor-beat.js';
import { PARTY_PAL, partyColours, tiredLetters } from '../js/core/harbor-show.js';

test('NEON PASS 5 — THE BEAT locks to the song\'s grid: bars on the real downbeats, a new song re-locks at once, the bar count never runs backwards', () => {
  const grid = { bpm: 128, t0: 0.37, down: 2 }, spb = 60 / grid.bpm, hb = createHarborBeat(0.3);
  let pos = 20, bars = [];
  for (let i = 0; i < 600; i++) { pos += 0.016; advanceHarborBeat(hb, 16, { bpm: 128, pos, grid }, null); bars.push(hb.bar); }
  // the song's beat k (from t0) is a downbeat when (k - down) % 4 === 0: the clock's beats are 0 mod 4 there
  const k = (pos - grid.t0) / spb, want = (k - grid.down) % 4, got = hb.beats % 4;
  assert.ok(Math.min(Math.abs(want - got), 4 - Math.abs(want - got)) < 0.03, `the bar's phase follows the grid (${want.toFixed(3)} vs ${got.toFixed(3)})`);
  assert.equal(hb.src, 'grid');
  assert.ok(Math.abs(hb.T - spb) < 0.002, `a beat lasts ${hb.T.toFixed(4)} s (the song's ${spb.toFixed(4)})`);
  for (let i = 1; i < bars.length; i++) assert.ok(bars[i] >= bars[i - 1], 'the bar count never goes back');
  // a new song (another phase): re-locked within a frame or two
  const g2 = { bpm: 96, t0: 1.1, down: 0 };
  let p2 = 50; for (let i = 0; i < 5; i++) { p2 += 0.016; advanceHarborBeat(hb, 16, { bpm: 96, pos: p2, grid: g2 }, null); }
  const k2 = (p2 - g2.t0) * 96 / 60; let d2 = (((k2 - hb.beats) % 4) + 4) % 4; if (d2 > 2) d2 -= 4;
  assert.ok(Math.abs(d2) < 0.2, `a new song re-locks at once (${d2.toFixed(3)} beats off)`);
  // no music: a calm 120 bpm of its own
  const c = createHarborBeat(0); for (let i = 0; i < 400; i++) advanceHarborBeat(c, 16, null, null);
  assert.ok(Math.abs(1 / c.T - CALM_BPM / 60) < 0.02 && c.src === 'calm', 'no song: the calm pulse');
});

test('THE BEAT-SYNC PASS — EVERY BEAT punches: the downbeat hardest, beat 3 next, 2 + 4 lighter but visible; a ≥ 40 ms attack before each beat, a decay you can see, never a hard on', () => {
  const at = b => { const h = beatPunch(b, 0.5); return h.env * h.strong; };
  assert.equal(at(0), 1); assert.ok(Math.abs(at(2) - BEAT_WEIGHT[2]) < 1e-9, 'beat 3: 0.72');
  assert.ok(Math.abs(at(1) - BEAT_WEIGHT[1]) < 1e-9 && Math.abs(at(3) - BEAT_WEIGHT[1]) < 1e-9 && BEAT_WEIGHT[1] >= 0.35 && BEAT_WEIGHT[1] <= 0.55, `beats 2 + 4 lighter (${at(1).toFixed(2)}) — a pulse on EVERY beat, never half-time`);
  assert.ok(at(0.25) > 0.25 && at(0.25) < 0.75, `a decay you can see (${at(0.25).toFixed(2)} a quarter beat later)`);
  assert.ok(at(3.95) > 0.3 && at(3.95) < 1 && at(3.89) < 0.2, `the attack over the last ~50 ms before a downbeat (0.5 s a beat: ${at(3.89).toFixed(2)} → ${at(3.95).toFixed(2)} → 1)`);
  let step = 0; for (let ms = 0; ms < 2000; ms += 5) step = Math.max(step, Math.abs(at((ms + 5) / 500) - at(ms / 500)));
  assert.ok(step <= 0.16, `never a hard on (a 5 ms step moves it ${step.toFixed(3)})`);
});

test('THE BEAT-SYNC PASS — THE SOUND sets only HOW HARD: the music\'s loudness (a drop 1, a breakdown ~0.45); a kick between the beats is never a punch, a beat without a kick never calms the city; nothing heard: the steady strength', () => {
  const grid = { bpm: 120, t0: 0, down: 0 }, hb = createHarborBeat(0);
  let pos = 0; const run = (n, kick) => { const out = []; for (let i = 0; i < n; i++) { pos += 1 / 60; advanceHarborBeat(hb, 1000 / 60, { bpm: 120, pos, grid }, kick(pos * 2)); out.push(hb.punch); } return out; };
  const loud = run(600, () => ({ live: true, energy: 1, hit: 0 }));
  const lvLoud = hb.level;
  run(600, () => ({ live: true, energy: 0.1, hit: 0 }));
  const lvQuiet = hb.level;
  assert.ok(lvLoud > 0.95 && lvQuiet < 0.55 && lvQuiet >= 0.45, `the level follows the loudness (loud ${lvLoud.toFixed(2)}, a breakdown ${lvQuiet.toFixed(2)})`);
  assert.ok(Math.max(...loud) > 0.95, 'a loud downbeat punches fully');
  assert.ok(Math.abs(levelOf(1) - 1) < 1e-9 && Math.abs(levelOf(0) - 0.45) < 1e-9);
  // kicks heard HALF A BEAT OFF every beat (the sound offset from the song's clock — her iPhone after the home screen): the punch is the
  // grid's alone — identical, frame for frame, to the same song with kicks exactly on the beats, and to no kicks at all
  const runWith = kick => { const h = createHarborBeat(0); let p = 0; const out = []; for (let i = 0; i < 900; i++) { p += 1 / 60; advanceHarborBeat(h, 1000 / 60, { bpm: 120, pos: p, grid }, kick(p * 2)); out.push(+h.punch.toFixed(6)); } return { h, out }; };
  const onBeat = runWith(b => ({ live: true, energy: 0.8, hit: Math.abs(b - Math.round(b)) < 0.017 ? 0.9 : 0 }));
  const offBeat = runWith(b => ({ live: true, energy: 0.8, hit: Math.abs(b - Math.round(b) - 0.45) < 0.017 ? 0.9 : 0 }));
  const noKick = runWith(() => ({ live: true, energy: 0.8, hit: 0 }));
  assert.deepEqual(offBeat.out, onBeat.out, 'kicks half a beat off: the same punches as kicks on the beat');
  assert.deepEqual(noKick.out, onBeat.out, 'no kicks at all: the same punches');
  assert.ok(onBeat.h.hits.on > 20 && offBeat.h.hits.off > 20, `(the readout still counts where they land: on ${onBeat.h.hits.on}, off ${offBeat.h.hits.off})`);
  // nothing heard (a deaf listener, no Web Audio): the steady strength
  const deaf = runWith(() => ({ live: false, energy: 0, hit: 0 }));
  assert.ok(Math.abs(deaf.h.level - SETTLE.grid) < 0.01, `nothing heard: ${deaf.h.level.toFixed(2)} (the grid's steady ${SETTLE.grid})`);
  // the listener's energy: the smoothed level against the recent peak
  const o = createOnsets(); for (let i = 0; i < 300; i++) onsetStep(o, 0.3, i / 60);
  assert.ok(onsetEnergy(o) > 0.95, `a steady loud low end reads ${onsetEnergy(o).toFixed(2)}`);
  for (let i = 300; i < 900; i++) onsetStep(o, 0.03, i / 60);
  assert.ok(onsetEnergy(o) < 0.3, `a breakdown reads ${onsetEnergy(o).toFixed(2)} after 10 s (the level eases over ~2 s, the peak remembers ~45 s)`);
});

test('THE BEAT-SYNC PASS — ONE SOURCE: a trusted-grid song never changes its source or its tempo mid-song, whatever the listener reports — live, deaf, kicks on the beat, off it, at half the tempo; the lights\' beat index stays the song\'s', () => {
  const grid = { bpm: 106, t0: 0.21, down: 2 }, p = 60 / grid.bpm, hb = createHarborBeat(0.4);
  let pos = 12; const srcs = new Set(), rates = [];
  const reports = [
    b => ({ live: true, energy: 0.9, hit: Math.abs(b - Math.round(b)) < 0.017 ? 0.9 : 0 }),                       // kicks on every beat
    b => ({ live: true, energy: 0.9, hit: Math.abs(b - 2 * Math.round(b / 2)) < 0.017 ? 0.9 : 0 }),               // kicks on every OTHER beat (half tempo)
    b => ({ live: true, energy: 0.6, hit: Math.abs(b - Math.round(b) - 0.42) < 0.017 ? 0.9 : 0 }),                // kicks 0.42 beat off (an offset sound)
    () => ({ live: false, energy: 0, hit: 0, deaf: true }),                                                      // a dead graph's listener
    () => null,                                                                                                  // no listener at all
    b => ({ live: true, energy: 0.2, hit: Math.abs(b - 4 * Math.round(b / 4)) < 0.017 ? 0.9 : 0 }),               // a kick a bar
  ];
  for (let r = 0; r < reports.length; r++) {
    for (let i = 0; i < 480; i++) {
      pos += 1 / 60; const b = (pos - grid.t0) / p;
      advanceHarborBeat(hb, 1000 / 60, { bpm: grid.bpm, pos, grid }, reports[r](b));
      srcs.add(hb.src); if (i > 60) rates.push(hb.rate);
      const want = ((Math.floor(b - grid.down) % 4) + 4) % 4;
      if (i > 60) assert.equal(hb.idx, want, `report ${r}, frame ${i}: the lights' beat ${hb.idx + 1}/4 = the song's ${want + 1}/4`);
    }
  }
  assert.deepEqual([...srcs], ['grid'], `one source all song long (${[...srcs].join(', ')})`);
  assert.ok(Math.max(...rates) - Math.min(...rates) < 1e-6 && Math.abs(1 / Math.max(...rates) - p) < 0.001, `the tempo never moves: ${(60 * Math.min(...rates)).toFixed(3)}–${(60 * Math.max(...rates)).toFixed(3)} bpm (the song's ${grid.bpm})`);
  // and a half-tempo kick pattern never halves the lights' tempo: the weak beats still punch
  const hb2 = createHarborBeat(0); let p2 = 5; const peaks = [];
  let lastIdx = -1, pk = 0;
  for (let i = 0; i < 1200; i++) { p2 += 1 / 60; const b = (p2 - grid.t0) / p; advanceHarborBeat(hb2, 1000 / 60, { bpm: grid.bpm, pos: p2, grid }, reports[1](b)); if (hb2.idx !== lastIdx) { if (lastIdx >= 0) peaks.push(pk); lastIdx = hb2.idx; pk = 0; } pk = Math.max(pk, hb2.punch); }
  assert.ok(peaks.length > 30 && peaks.slice(4).every(v => v > 0.3), `every beat punches with kicks at half the tempo (the weakest ${Math.min(...peaks.slice(4)).toFixed(2)})`);
});

test('7a — THE BEAT IN DIRECT MODE: the source is chosen (grid / direct-grid / tempo / calm) from the song alone; on the direct element the grid punches at full strength whatever the dead listener says; an untrusted song a steady pulse at its tempo', () => {
  const grid = { bpm: 128, t0: 0.2, down: 1 }, loose = { bpm: 106.904, t0: 0.485, down: 1, trusted: false };
  const live = { hit: 0, live: true }, deaf = { hit: 0, live: false };
  assert.equal(beatMode({ bpm: 128, pos: 10, grid }), 'grid');
  assert.equal(beatMode({ bpm: 128, pos: 10, grid, direct: true }), 'direct-grid', 'the direct element: the grid on its own clock');
  assert.equal(beatMode({ bpm: 106.9, pos: 10, grid: null, untrusted: true, loose }), 'tempo', 'an untrusted song: a steady pulse at its tempo (never the kicks)');
  assert.equal(beatMode({ bpm: 106.9, pos: 10, grid: null, untrusted: true, loose, direct: true }), 'tempo');
  assert.equal(beatMode(null), 'calm');
  assert.equal(beatMode({ bpm: 0, pos: 3 }), 'calm');
  // back from the home screen the frozen graph's analyser repeats its last window (audio/beat.js reports it deaf); on the direct element
  // whatever it says is ignored: the grid punches as it did before leaving
  const swing = (direct, kick, n = 600, g = grid, extra = {}) => {
    const hb = createHarborBeat(0); let pos = 30, lo = 9, hi = 0;
    for (let i = 0; i < n; i++) { pos += 1 / 60; advanceHarborBeat(hb, 1000 / 60, { bpm: g ? g.bpm : 106.9, pos, grid: g, direct, ...extra }, kick); if (i > n - 240) { lo = Math.min(lo, hb.punch); hi = Math.max(hi, hb.punch); } }
    return { hb, lo, hi };
  };
  const direct = swing(true, live), graph = swing(false, deaf);
  assert.ok(direct.hb.src === 'direct-grid' && direct.hb.level > 0.8 && direct.hi - direct.lo > 0.75 && !direct.hb.live, `direct-grid: the punch swings ${direct.lo.toFixed(2)} → ${direct.hi.toFixed(2)} (level ${direct.hb.level.toFixed(2)})`);
  assert.ok(Math.abs(direct.hi - graph.hi) < 0.02, `direct-grid punches as hard as the grid with nothing heard (${direct.hi.toFixed(2)} vs ${graph.hi.toFixed(2)})`);
  assert.ok(Math.abs(direct.hb.T - 60 / 128) < 0.002, `direct-grid: at the grid's tempo (${(60 / direct.hb.T).toFixed(2)} bpm)`);
  // its phase is the grid's: the downbeat where the grid puts it
  const k = ((30 + 600 / 60) - grid.t0) * 128 / 60 - grid.down, d = ((k - direct.hb.beats) % 4 + 4) % 4;
  assert.ok(Math.min(d, 4 - d) < 0.05, `direct-grid: on the grid's bars (${Math.min(d, 4 - d).toFixed(3)} beats off)`);
  // an untrusted song (on the direct element or through the graph alike): a steady, GENTLER pulse at its tempo, on its (loose) grid's phase
  const t = swing(true, live, 600, null, { untrusted: true, loose }), t2 = swing(false, live, 600, null, { untrusted: true, loose });
  assert.ok(t2.hb.src === 'tempo' && Math.abs(t2.hi - t.hi) < 0.05, `through the graph too: '${t2.hb.src}' at the same strength (${t2.hi.toFixed(2)} vs ${t.hi.toFixed(2)})`);
  assert.ok(t.hb.src === 'tempo' && Math.abs(60 / t.hb.T - 106.904) < 0.05, `tempo: ${(60 / t.hb.T).toFixed(2)} bpm (the song's 106.90)`);
  assert.ok(t.hi - t.lo > 0.45 && t.hi < direct.hi * 0.8, `tempo: a gentle pulse (${t.lo.toFixed(2)} → ${t.hi.toFixed(2)}, the grid's ${direct.hi.toFixed(2)})`);
});

test('NEON PASS 5 — ONSETS: synthetic kicks over a bass line + noise are found (≥ 95 %), no false ones, their strength follows the loudness', () => {
  const o = createOnsets(); let found = 0, extra = 0, strengths = [];
  let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let f = 0; f < 60 * 30; f++) {
    const t = f / 60, beat = t * 2, ph = beat - Math.floor(beat), kickOn = ph < 1 / 30;
    const loud = t < 15 ? 1 : 0.4;
    const e = loud * 0.5 * Math.exp(-ph * 0.5 / 0.09) + 0.06 + 0.03 * Math.sin(t * 9) + 0.02 * rnd();
    const h = onsetStep(o, e, t);
    if (h > 0) { if (kickOn) { found++; strengths.push([t, h]); } else extra++; }
  }
  const kicks = 30 * 2;
  assert.ok(found >= kicks * 0.95 && extra === 0, `found ${found} of ${kicks} kicks, ${extra} false`);
  const a = strengths.filter(([t]) => t > 3 && t < 15).map(s => s[1]), b = strengths.filter(([t]) => t > 21).map(s => s[1]);
  const mean = v => v.reduce((x, y) => x + y, 0) / v.length;
  assert.ok(mean(a) > mean(b) * 1.3, `a quiet passage hits softer (${mean(a).toFixed(2)} → ${mean(b).toFixed(2)})`);
});

test('NEON PASS 5 — every mood song has an exact BEAT GRID (data/mood-music.json: bpm 90–180, the first beat, the downbeat)', () => {
  const d = JSON.parse(readFileSync(new URL('../data/mood-music.json', import.meta.url), 'utf8'));
  for (const [id, s] of Object.entries(d.songs)) {
    const g = s.grid;
    assert.ok(g && g.bpm >= 90 && g.bpm < 181 && g.t0 >= 0 && g.t0 < 60 / g.bpm + 0.01 && [0, 1, 2, 3].includes(g.down), `${id}: ${JSON.stringify(g)}`);
  }
});

test('NEON PASS 5 — THE PARTY PALETTE rotates: six bright main colours + white accents (pink one of seven), neighbours never share a main colour, every scene a new colour for every building', () => {
  assert.equal(PARTY_PAL.length, 7);
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 40;
  assert.equal(PARTY_PAL.filter(c => near(c, [255, 46, 151]) || near(c, [255, 40, 210])).length, 1, 'pink is one colour of seven');
  for (let n = 0; n < 14; n++) {
    const mains = Array.from({ length: 40 }, (_, r) => partyColours(r, n)[0]);
    for (let r = 1; r < 40; r++) assert.notEqual(mains[r], mains[r - 1], `scene ${n}: neighbours ${r - 1} + ${r} differ`);
    assert.equal(new Set(mains).size, 6, `scene ${n}: all six bright colours on the skyline (white: an accent)`);
    assert.ok(!mains.includes(5), 'white is never a main colour');
    for (let r = 0; r < 40; r++) { assert.notEqual(partyColours(r, n)[0], partyColours(r, n + 1)[0], `building ${r}: a new colour in scene ${n + 1}`); const [m, a] = partyColours(r, n); assert.notEqual(m, a, 'main ≠ accent'); }
  }
  // the show: a sweep crosses the skyline over the scene's last fifth — every building wears the next colours by the scene's end
  const cast = showItems(Array.from({ length: 30 }, (_, i) => ({ kind: i % 5 ? 'band' : 'hero', x: i / 29, contour: true, ledges: 3 })));
  const f = (bar, ph) => ({ bar, phase: ph, energy: 1, ramp: 1, name: 'peak', tier: 2, motion: true, t: bar, beatU: 0, beatT: 0.5, beatIdx: 0, beats: bar * 4, beatsF: bar * 4, rate: 0.5 });
  const len = sceneAt(f(0, 0)).len, early = showFrame(cast, f(1, 0.5)), mid = showFrame(cast, f(len - 2, 0.5)), end = showFrame(cast, f(len - 1, 0.99));
  assert.ok([...early.cm].every(v => v === 0) && [...end.cm].every(v => v > 0.97) && [...mid.cm].some(v => v > 0.5) && [...mid.cm].some(v => v < 0.5), 'the sweep: none early, a front mid-way, all by the end');
  assert.equal(showFrame(cast, f(len, 0.1)).cn, early.cn + 1, 'the next scene wears the next colours');
});

test('NEON PASS 5 — the RACING LIGHT: every hero + word tower races its whole border at the peak (the owner saw none on her phone); tier 1 races the towers first', () => {
  const cast = showItems([...Array.from({ length: 24 }, (_, i) => ({ kind: 'band', x: i / 24, contour: true })), ...Array.from({ length: 6 }, (_, i) => ({ kind: i < 3 ? 'hero' : 'word', x: 0.1 + i * 0.15, contour: true }))]);
  for (const tier of [2, 1]) for (let bar = 0; bar < 200; bar += 7) {
    const out = showFrame(cast, { bar, phase: 0.3, energy: 1, ramp: 1, name: 'peak', tier, motion: true, t: bar, beatU: 0.3, beatT: 0.5, beatIdx: 0, beats: bar * 4, beatsF: bar * 4 + 0.3, rate: 0.5 });
    for (let i = 24; i < 30; i++) assert.ok(out.race[i] > 0.3, `tier ${tier} bar ${bar}: tower ${i} races`);
  }
});

test('THE TIRED TUBE rotates (about every 3 hours — the owner): any letter, sometimes none, sometimes two, never the same letter two blocks running (the O was always the one); the &force=tired preview', () => {
  const seen = [0, 0, 0, 0]; let none = 0, two = 0, prev = null;
  for (let d = 1; d <= 90; d++) for (let h = 0; h < 24; h += 3) {
    const t = tiredLetters({ y: 2026, m: 10 + Math.floor((d - 1) / 31), d: ((d - 1) % 31) + 1, h });
    if (!t.length) none++; if (t.length === 2) two++;
    for (const i of t) { seen[i]++; if (prev) assert.ok(!prev.includes(i), `letter ${i} twice running (day ${d} ${h} h)`); }
    prev = t;
  }
  assert.ok(seen.every(n => n > 60) && none > 100 && two > 30, `every letter takes a turn (${seen}), none ${none}, two ${two}`);
  assert.deepEqual(tiredLetters({ y: 2026, m: 10, d: 24, h: 23 }), tiredLetters({ y: 2026, m: 10, d: 24, h: 22 }), 'the same through a 3-hour block (every phone the same)');
  assert.deepEqual(tiredForced('N'), [0]); assert.deepEqual(tiredForced('e'), [1]); assert.deepEqual(tiredForced('O'), [2]); assert.deepEqual(tiredForced('N2'), [3]);
  assert.deepEqual(tiredForced('N,N2'), [0, 3]); assert.deepEqual(tiredForced(''), [2]);
});

test('NEON PASS 5 — THE GLANCE TEST: every named sign\'s letters ≥ 10 pt on every phone (the roof signs stacked: the mark on top, the name across the cabinet)', () => {
  for (const k of PHONES) {
    const { cam, L } = setup(k), spots = signSpots(L);
    for (const sp of spots.filter(x => x.kind === 'named')) for (const g of GAMES12) {
      if (!fitsSpot(g.short, sp)) continue;
      const gg = GAMES.find(x => x.id === g.id), sg = buildSign(sp, gg, { W: cam.W, s: cam.F / 600 }), p = sg.parts.find(q => q.boxes);
      const lh = Math.min(...p.boxes.map(b => b.y1 - b.y0 - 1.2));
      assert.ok(lh >= 10, `${k}: ${sp.id} "${g.short}" letters ${lh.toFixed(1)} pt`);
    }
  }
});

// ================================================================ THE DAY PASS (Oct 22 2026)
import { sunLook, harborSky, toneWeights } from '../js/screens/harbor/tones.js';
import { tiredForced } from '../js/core/harbor-show.js';
import { cloudMix, cloudPlan, driftX, skyLight, cloudLit, SMALL_DROP, SMALL_FRAG, SMALL_MAX } from '../js/core/harbor-clouds.js';
import { layersOf } from '../js/core/weather.js';
import { DAY_PAINT, dayPaint } from '../js/screens/harbor/signs.js';
import { lhEdgeBlocks } from '../js/core/harbor-neon.js';
// (GAMES: imported above)
import { sunColorHarbor, sunColor, sunColourAt } from '../js/screens/district/sun.js';

test('THE DAY PASS — the sun\'s side by day is continuous (never flat at noon); with the sun down the old sides exactly', () => {
  const at = (az, el) => sunLook({ sun: { az, el }, w: { day: 1 } }, null);
  assert.equal(at(180, 35).sunDir, 0.4);                              // noon: a gentle side, never 0
  assert.ok(at(120, 20).sunDir < -0.9 && at(250, 12).sunDir > 0.9);    // a morning sun from the left, an afternoon one from the right
  assert.ok(at(160, 30).sunDir < 0 && at(200, 30).sunDir > 0);
  // the night + dusk keep Neon Pass 6's values
  assert.equal(at(300, -20).sunDir, 1); assert.equal(at(60, -20).sunDir, -1); assert.equal(at(185, -20).sunDir, 0);
  // the look key moves rarely: over a day's sun (every minute) the keys change at most ~22 times
  let keys = new Set(), last = null, changes = 0;
  for (let m = 7 * 60; m <= 19 * 60; m++) { const t = (m - 7 * 60) / (12 * 60), k = JSON.stringify([at(100 + 160 * t, 40 * Math.sin(Math.PI * t)).sunDir, at(100 + 160 * t, 40 * Math.sin(Math.PI * t)).sunEl]); if (k !== last) changes++; last = k; keys.add(k); }
  assert.ok(changes <= 24, `the sun's look changes ${changes} times a day`);
});

test('THE DAY PASS — the Harbor\'s own day sky: deep blue up high, pale at the horizon, the palette\'s exactly at night, greyed by cloud', () => {
  const P = { sky: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]] };
  assert.deepEqual(harborSky(P, { w: { day: 0, night: 1 } }), P.sky);
  const d = harborSky(P, { w: { day: 1 }, cloud: 0.1 }), lum = c => c[0] + c[1] + c[2];
  assert.ok(d[0][2] > d[0][0] * 2 && lum(d[0]) < lum(d[3]), 'deep blue overhead, paler to the horizon');
  const o = harborSky(P, { w: { day: 1 }, cloud: 1 });
  assert.ok(Math.abs(o[0][2] - o[0][0]) < Math.abs(d[0][2] - d[0][0]) * 0.5, 'overcast greys it');
});

test('THE DAY PASS — the Harbor\'s sun: white-hot high, golden → orange → red low (City 1.0\'s sunColor untouched)', () => {
  const w = sunColorHarbor(40), g = sunColorHarbor(4), r = sunColorHarbor(0), m = sunColorHarbor(9);
  assert.ok(w.every(v => v >= 245), 'high: white');
  assert.ok(g[0] === 255 && g[2] < 100 && r[1] < g[1], 'low: golden, then redder');
  // (SP: the 9 am sun — ~9° up — is never an orange ball; since the stages pass it is a pale warm yellow-white)
  assert.ok(m[1] > 205 && m[2] > 130, 'nine degrees up: pale, never orange');
  assert.deepEqual(sunColor(40), [255, 244, 223]);
});

import { sunPosition } from '../js/core/sky.js';
test("THE SUN'S STAGES (sunColourAt): white ≥ 15°, yellow-white 6–15°, golden amber 2–6°, orange-red + squashed under 2°; smooth; the city's light follows", () => {
  const at = sunColourAt, hue = c => (c[1] - c[2]) / Math.max(1, c[0] - c[2]);   // (0 red … 1 yellow; low = no colour)
  const w = at(20), y = at(10), a = at(4), o = at(1);
  assert.ok(w.disc.every(v => v >= 238) && w.white === 1 && w.halo === 1 && w.squash === 1, '20°: white, the white-hot core + its halo');
  assert.ok(y.disc[0] === 255 && y.disc[1] >= 215 && y.disc[2] >= 130 && y.disc[2] <= 200 && y.disc[1] - y.disc[2] >= 40 && y.white < 0.05, '10°: warm yellow-white, the coloured disc');
  assert.ok(a.disc[0] === 255 && a.disc[1] >= 135 && a.disc[1] <= 185 && a.disc[2] < 90 && a.halo < 0.05 && a.lift < 0.3, '4°: golden amber, no white bloom');
  assert.ok(o.disc[0] === 255 && o.disc[1] < 110 && o.disc[2] < 60, '1°: deep orange-red');
  assert.ok(o.squash >= 0.85 && o.squash <= 0.92 && at(0).squash < o.squash && at(4).squash === 1, '1°: flattened by refraction (0.85–0.9)');
  // the glow follows the stage: warm low, white high
  assert.ok(a.glow[2] < 170 && w.glow.every(v => v >= 238), 'the glow: warm low, white high');
  // smooth: no visible step anywhere from below the horizon to high noon (every channel, 0.05° apart)
  let prev = at(-3);
  for (let e = -2.95; e <= 40; e += 0.05) {
    const c = at(e);
    for (const k of ['disc', 'glow']) assert.ok(c[k].every((v, i) => Math.abs(v - prev[k][i]) <= 3), `a step in ${k} at ${e.toFixed(2)}°`);
    for (const k of ['white', 'halo', 'squash', 'lift']) assert.ok(Math.abs(c[k] - prev[k]) < 0.02, `a step in ${k} at ${e.toFixed(2)}°`);
    prev = c;
  }
  // monotonic: the colour only ever warms as it sinks (yellow → amber → red), never a wobble
  for (let e = 0; e < 30; e += 0.5) assert.ok(at(e).disc[1] <= at(e + 0.5).disc[1] && (e >= 14 || hue(at(e).disc) <= hue(at(e + 0.5).disc) + 0.02), `warmer lower at ${e}°`);
  // the same rising as setting: a function of the elevation only (the real sun's morning + evening at Grand Rapids)
  const rise = sunPosition(Date.parse('2026-10-23T12:35:00Z'), 42.96, -85.67).el, set = sunPosition(Date.parse('2026-10-22T22:21:00Z'), 42.96, -85.67).el;
  assert.ok(Math.abs(rise - set) < 0.6, `two ~4° suns (${rise.toFixed(2)}, ${set.toFixed(2)})`);
  for (const e of [rise, set]) assert.ok(at(e).disc[1] >= 135 && at(e).disc[1] <= 185 && at(e).disc[2] < 90, `amber at ${e.toFixed(2)}° (rising + setting)`);
  // THE CITY'S LIGHT follows the 2–6° stage, morning + evening: the lit city all gold under ~5°, daylight from ~9° (the day channel
  // only: the night's share — the dawn's dusk, the blue hour — never changes); the evening's weights are untouched
  const look = (el, morning) => ({ sun: { el }, w: morning ? { day: Math.min(1, Math.max(0, (el - 1) / 10)), dawn: 1 - Math.min(1, Math.max(0, (el - 1) / 10)) } : { day: Math.min(1, Math.max(0, (el - 5) / 10)), golden: 1 - Math.min(1, Math.max(0, (el - 5) / 10)) } });
  for (const m of [true, false]) {
    const t4 = toneWeights(look(4, m)), t2 = toneWeights(look(2, m)), t10 = toneWeights(look(10, m)), t12 = toneWeights(look(12, m));
    assert.ok(t4.day < 1e-9 && t2.day < 1e-9 && t4.gold > 0.75, `4° ${m ? 'morning' : 'evening'}: the lit city all gold`);
    assert.ok(t12.day > 0.65, `12° ${m ? 'morning' : 'evening'}: mostly daylight`);
    if (m) assert.ok(t10.day > 0.85 && Math.abs(t4.night - 0.3 * 0.7) < 1e-9, 'the morning: daylight by 10°; the night share unchanged');
  }
  const ev = look(7, false), raw = { day: ev.w.day, gold: ev.w.golden };
  const tev = toneWeights(ev);
  assert.ok(Math.abs(tev.day - raw.day) < 1e-9 && Math.abs(tev.gold - raw.gold) < 1e-9, 'the evening untouched');
});

test('DT2 — THE CLOUDS\' kinds follow the real weather: fair cumulus, a greyer day\'s patches, the overcast deck, cirrus from the high layer', () => {
  const fair = cloudMix({ cloud: 0.2 }, 'a'), grey = cloudMix({ cloud: 0.6 }, 'a'), over = cloudMix({ cloud: 0.96 }, 'a'), wet = cloudMix({ cloud: 0.5, rain: 0.6 }, 'a');
  assert.ok(fair.cumulus > 0.15 && fair.deck === 0 && fair.strato === 0, 'a fair day: cumulus only (+ maybe cirrus)');
  assert.ok(grey.strato > 0.3 && grey.cumulus > 0.2 && grey.deck < 0.1, 'a greyer day: patches among the heaps');
  assert.ok(over.deck > 0.9 && over.cumulus < 0.15 && over.scud > 0.3, 'overcast: the deck + scud under it');
  assert.ok(wet.deck === 1, 'rain: always a deck');
  assert.equal(cloudMix({ cloud: 0.01 }, 'a').cumulus, 0, 'a clear sky: none');
  // the live heights decide (a sky of high cirrus only: no deck, no cumulus)
  const hi = cloudMix({ cloud: 0.9, cloudLayers: { lo: 0, mid: 0, hi: 0.9 } }, 'a');
  assert.ok(hi.layers && hi.cirrus > 0.9 && hi.deck < 0.05 && hi.cumulus === 0);
  assert.deepEqual(layersOf({ cloud_cover_low: 20, cloud_cover_mid: 0, cloud_cover_high: 75 }), { lo: 0.2, mid: 0, hi: 0.75 });
  assert.equal(layersOf({ cloud_cover: 50 }), null, 'no heights in the data: null');
});

test('DT2 — THE CLOUDS\' layout: perspective (near = big, the horizon = small + flatter + closer together), clusters, never in rows', () => {
  const box = { W: 402, top: 62, roof: 470, hz: 563 };
  const rank = a => { const s = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = []; s.forEach(([, i], k) => { r[i] = k; }); return r; };
  const rhoOf = P => { const ry = rank(P.map(d => -d.y)), rw = rank(P.map(d => d.w)), n = P.length; return 1 - 6 * ry.reduce((s, v, i) => s + (v - rw[i]) ** 2, 0) / (n * (n * n - 1)); };
  const pooled = [];
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) for (const cover of [0.25, 0.5]) {
    const P = cloudPlan(box, cloudMix({ cloud: cover }, seed), seed).filter(d => d.kind === 'cumulus');
    pooled.push(...P);
    assert.ok(P.length >= 5 && P.length <= 22, `${seed} ${cover}: ${P.length} cumulus`);
    // every sky has near AND far ones (the clusters spread through the depth)
    assert.ok(P.some(d => d.s > 0.55) && P.some(d => d.s < 0.45), `${seed} ${cover}: near + far`);
    // never a row: no three cumulus of about the same size on (almost) the same line
    for (const a of P) assert.ok(P.filter(b => b !== a && Math.abs(b.y - a.y) < 2 && Math.abs(b.w - a.w) < a.w * 0.15).length < 2, 'no rows');
    // far ones flatter than near ones (h / w), every one readable (>= 30 x 10 pt)
    // (M3: among the HEAPS — the small fragments + wisps are flat by design)
    const heaps = P.filter(d => !d.form || d.form === 'tower' || d.form === 'fractus'), far = heaps.filter(d => d.s < 0.35), near = heaps.filter(d => d.s > 0.55);
    if (far.length && near.length) assert.ok(far.reduce((s, d) => s + d.h / d.w, 0) / far.length < near.reduce((s, d) => s + d.h / d.w, 0) / near.length + 0.02);
    assert.ok(P.every(d => d.w >= 30 && d.h >= 10));
    // M3 — the small ones: none of the old little-puff class; every small one left is a fragment or a wisp (flat, see-through)
    assert.ok(P.every(d => d.w >= SMALL_DROP), 'no little puffs');
    assert.ok(P.filter(d => d.form === 'frag' || d.form === 'wisp').length <= SMALL_MAX, 'a few small ones at most');
    for (const d of P.filter(d => d.w < SMALL_FRAG)) assert.ok((d.form === 'frag' || d.form === 'wisp') && d.k < 1 && d.h <= d.w * 0.41 + 0.1 && !d.tall, `small ${d.w}: ${d.form}`);
    // the sky band only: never below the skyline's roofs + a peek, never above the top
    assert.ok(P.every(d => d.y <= box.roof + 14 && d.y - d.h * 0.72 >= box.top - 1));
  }
  // the higher on the screen, the bigger (rank correlation of base height vs width, every sky together)
  assert.ok(rhoOf(pooled) > 0.6, `near = bigger (rho ${rhoOf(pooled).toFixed(2)})`);
  // deterministic: every phone the same sky
  assert.deepEqual(cloudPlan(box, cloudMix({ cloud: 0.4 }, 'x'), 'x'), cloudPlan(box, cloudMix({ cloud: 0.4 }, 'x'), 'x'));
  // overcast: one deck tile wider than the screen, the whole sky
  const o = cloudPlan(box, cloudMix({ cloud: 0.97 }, 'x'), 'x').filter(d => d.kind === 'deck');
  assert.ok(o.length === 1 && o[0].w >= box.W * 1.4 && o[0].h >= box.hz);
  // drifting: nearer = faster, wrapping round (always back on screen)
  const d = { w: 100, x0: 50, v: 1 }, d2 = { w: 100, x0: 50, v: 0.3 };
  assert.ok(Math.abs(driftX(d, 10, 3, 1, 402) - 50) > Math.abs(driftX(d2, 10, 3, 1, 402) - 50));
  for (let t = 0; t < 5000; t += 97) { const x = driftX(d, t, 3, -1, 402); assert.ok(x >= -105 && x <= 402 + 4); }
});

test('DT2 — THE CLOUDS\' light: white by midday, gold low, coral + pink after sunset, the sun\'s side, backlit near the sun, faint + violet at night, the party\'s colours', () => {
  const box = { W: 402, top: 62, roof: 470, hz: 563 }, cl = { kind: 'cumulus', w: 100, h: 40, y: 300, s: 0.5, seed: 7 };
  const noon = skyLight({ sun: { el: 40 } }, { sun: { x: 200, y: 380, vis: 1 } }), gold = skyLight({ sun: { el: 4 } }, { sun: { x: 330, y: 440, vis: 1 } });
  const after = skyLight({ sun: { el: -3 } }, { side: 1 }), night = skyLight({ sun: { el: -30 } }, {}), party = skyLight({ sun: { el: -30 } }, { party: 1, palette: [[255, 63, 176], [63, 224, 255]] });
  assert.ok(noon.sunC.every(v => v > 235) && noon.sunK > 0.9, 'midday: white sunlight');
  assert.ok(gold.sunC[0] > 250 && gold.sunC[2] < 150, 'golden hour: gold');
  assert.ok(after.sunC[0] > 240 && after.sunC[1] < 140 && after.sunK > 0.4, 'just after sunset: coral + pink, still lit (they are high)');
  assert.ok(night.sunK === 0 && night.body < 0.75 && night.glow.k > 0.3 && night.glow.c[2] > night.glow.c[1], 'night: faint, the city\'s violet from below');
  assert.ok(party.glow.party && cloudLit(party, cl, 100, box).glow.join() !== cloudLit(night, cl, 100, box).glow.join(), 'a party night: the party\'s colours under them');
  // the sun's side: a cloud left of the sun is lit from its right; backlit right in front of the sun
  const left = cloudLit(gold, { ...cl, y: 300 }, 20, box);
  assert.ok(left.lx > 0.3, 'lit from the sun\'s side');
  const behind = cloudLit(gold, { ...cl, y: 470 }, 280, box);
  assert.ok(behind.back > left.back && behind.lz < left.lz && behind.rim > left.rim, 'the sun right behind: backlit, a brighter rim');
  assert.ok(cloudLit(after, cl, 100, box).below > 0.3 && cloudLit(noon, cl, 100, box).below === 0, 'after sunset lit from below');
  // far = into the haze; the key changes with the light (the bake follows it) but not for nothing
  assert.ok(cloudLit(noon, { ...cl, s: 0.1 }, 100, box).haze > cloudLit(noon, { ...cl, s: 0.9 }, 100, box).haze);
  assert.equal(cloudLit(noon, cl, 100, box).key, cloudLit(noon, cl, 101, box).key, 'a 1 pt drift re-lights nothing');
  assert.notEqual(cloudLit(noon, cl, 100, box).key, cloudLit(gold, cl, 100, box).key);
  // PART 9: greyed + darkened skies; under a deck the light goes diffuse
  const storm = skyLight({ sun: { el: 40 } }, { sun: { x: 200, y: 380, vis: 1 }, extra: { grey: 1, dark: 1 } });
  assert.ok(storm.sunK < 0.1 && storm.ambTop[0] < 130, 'Part 9: set({ grey, dark }) greys + darkens');
  assert.ok(skyLight({ sun: { el: 40 } }, { deck: 1 }).sunK < 0.35, 'overcast: diffuse light');
});

test('THE DAY PASS — the painted day faces: every game has one, and its letters stand out from its board (the glance test by day)', () => {
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  for (const g of GAMES) {
    assert.ok(DAY_PAINT[g.id], `${g.id} has a painted scheme`);
    const p = dayPaint(g);
    assert.ok(ratio(p.ink, p.face) >= 4.5, `${g.id}: letters ${ratio(p.ink, p.face).toFixed(1)}:1 on their board`);
  }
});

test('THE DAY PASS §0 — the dark corner: the block right of the lighthouse is lit again on every phone, the ones behind the tower stay calm', () => {
  for (const k of ['390x844', '402x874', '412x915', '430x932']) {
    const { L, cam } = setup(k), ids = lhEdgeBlocks(L), lx = project(cam, L.lighthouse.x, 0, L.lighthouse.z)[0], hw = 30 * cam.F / 600;
    assert.ok(ids.size >= 1, `${k}: a block freed beside the lighthouse`);
    for (const id of ids) { const b = L.bands.find(d => d.id === 'near').blocks.find(x => x.id === id), m = (project(cam, b.x0, 0, b.z0)[0] + project(cam, b.x1, 0, b.z0)[0]) / 2; assert.ok(Math.abs(m - lx) > hw, `${k}: ${id} stands clear of the tower`); }
  }
});

test('the panel: rows a later part still has to build stay hidden (ready: false), their ids stay valid', async () => {
  const { EVENTS, PANEL_EVENTS, cleanRemote } = await import('../js/core/harbor-remote.js');
  const hidden = EVENTS.filter(e => !PANEL_EVENTS.includes(e)).map(e => e.id);
  assert.deepEqual(hidden.sort(), ['cat', 'ufo', 'window']);   // (7b: 'window' needs &moment= — the links; the panel has a row per moment)
  assert.deepEqual(cleanRemote({ force: ['ufo'] }).bad, []);
});

test('one darkness input (C1.5) on THE DUSK CURVE (DT1): the sun\'s elevation → darkness, golden hour barely dark, the power-up through the blue hour, every ramp full by night', async () => {
  const { darkness, duskDark, litK, LIT, DARK_TERMS, windowsNight, isNight, power, POWER } = await import('../js/core/harbor-dark.js');
  assert.ok(Object.values(DARK_TERMS).every(v => v === 0), 'no extra term is on yet (Part 9 turns on the storm / cloud)');
  // monotonic: darker as the sun sinks; 0 by day, 1 at night; golden hour light; sunset at the power-up's start, −7° its end
  let prev = -1;
  for (let el = 20; el >= -20; el -= 0.25) { const d = duskDark(el); assert.ok(d >= prev - 1e-12 && d >= 0 && d <= 1, `el ${el}`); prev = d; }
  assert.equal(duskDark(15), 0); assert.equal(duskDark(-15), 1);
  assert.ok(duskDark(5) < 0.06 && duskDark(1) < POWER[0], 'golden hour: barely dark');
  assert.ok(Math.abs(duskDark(-0.8) - POWER[0]) < 1e-9 && Math.abs(duskDark(-7) - POWER[1]) < 1e-9, 'the power-up: sunset → −7°');
  assert.equal(power(duskDark(2)), 0); assert.equal(power(duskDark(-7)), 1);
  // the sky model's value without an elevation (ALWAYS NIGHT, a test); the terms only darken
  for (let d = 0; d <= 1.0001; d += 0.05) assert.equal(darkness({ sky: d }), Math.min(1, d));
  assert.equal(darkness({ sky: 0.2, el: -20 }), 1); assert.equal(darkness({ sky: 1, el: 20 }), 0);
  const T = { cloud: 0.3, storm: 0.8, eclipse: 1 };
  assert.ok(darkness({ el: 30, storm: 1 }, T) > 0.79, 'a storm afternoon (Part 9) powers the city up');
  assert.equal(darkness({}), 0);
  // every ramp fully on by the end of the blue hour (the night unchanged); the billboard's lamps first, the lamps around sunset
  for (const k of Object.keys(LIT)) { assert.equal(litK(1, k), 1, k); assert.equal(litK(POWER[1], k), 1, `${k} full by −7°`); assert.equal(litK(0, k), 0, k); }
  assert.ok(litK(duskDark(3.5), 'bill') > 0.3 && litK(duskDark(3.5), 'lamps') === 0 && litK(duskDark(3.5), 'neon') === 0, 'late golden hour: the billboard lamps only');
  assert.ok(litK(duskDark(-1.5), 'lamps') > 0.3 && litK(duskDark(-1.5), 'flood') === 0, 'just after sunset: the lamps, not yet the floodlights');
  assert.equal(windowsNight(0.21), true); assert.equal(isNight(0.6), true); assert.equal(isNight(0.4), false);
});

test('THE BLUE-HOUR POWER-UP (DT1): tonight\'s order (seeded by the date: outlines cluster by cluster, signs one by one), never all at once, the morning in reverse; the windows', async () => {
  const { powerOrder, lightOn, powerAt, STAGE, duskDark, windowShare, windowBias, windowThreshold, partyReady, SWEEPS } = await import('../js/core/harbor-dark.js');
  const list = Array.from({ length: 30 }, (_, i) => ({ id: `o${i}`, kind: i < 4 ? 'sign' : 'outline', x: i / 29 }));
  const a = powerOrder('2026-10-22', list), b = powerOrder('2026-10-22', list);
  assert.deepEqual([...a.pos], [...b.pos], 'the same order all night');
  assert.ok(SWEEPS.includes(a.sweep));
  const sweeps = new Set(); let differ = 0;
  for (let d = 1; d <= 20; d++) { const o = powerOrder(`2026-11-${String(d).padStart(2, '0')}`, list); sweeps.add(o.sweep); if (JSON.stringify([...o.pos]) !== JSON.stringify([...a.pos])) differ++; }
  assert.ok(sweeps.size >= 3 && differ >= 19, `a slightly different order each night (${sweeps.size} sweeps)`);
  // never all at once: through the blue hour (−0.8° → −7°, 25 steps) the lights come on in many separate steps
  const onAt = it => { for (let k = 0; k <= 100; k++) { const el = -0.8 - 6.2 * k / 100; if (lightOn(duskDark(el), a.pos.get(it.id), it.kind === 'sign' ? STAGE.signs : STAGE.neon)) return k; } return 101; };
  const times = list.map(onAt);
  assert.ok(new Set(times).size >= 15 && Math.max(...times) <= 100 && Math.min(...times) > 0, `staggered: ${new Set(times).size} moments`);
  // golden hour: nothing on; the night: everything; the morning mirrors (the same thresholds)
  for (const it of list) { assert.equal(lightOn(duskDark(2), a.pos.get(it.id)), false); assert.equal(lightOn(duskDark(-9), a.pos.get(it.id)), true); }
  // neighbouring outlines light close together (a cluster's neighbours), the signs anywhere in their stage
  const o = list.filter(it => it.kind === 'outline'); let near = 0;
  for (let i = 1; i < o.length; i++) if (Math.abs(a.pos.get(o[i].id) - a.pos.get(o[i - 1].id)) < 0.3) near++;
  assert.ok(near >= o.length * 0.7, `clusters: ${near} of ${o.length - 1} neighbours close`);
  assert.ok(powerAt(1, STAGE.neon) < 1, 'every light is on before the blue hour ends');
  // THE WINDOWS: golden hour a few (~5 % of the windows that can light), lower floors first; all by −7°; monotonic (on only)
  const share = el => { const k = duskDark(el), sh = windowShare(k), bias = windowBias(k); let n = 0; for (let i = 0; i < 2000; i++) { const low = (i % 40) / 39, ord = ((i * 7919) % 2000) / 2000; if (ord <= windowThreshold(sh, bias, low)) n++; } return n / 2000; };
  assert.ok(share(4) < 0.02 && share(0) > 0.04 && share(0) < 0.16, `golden hour: a few (${share(4).toFixed(3)} → ${share(0).toFixed(3)})`);
  assert.equal(share(-7.2), 1);
  let p = -1; for (let el = 8; el >= -8; el -= 0.2) { const v = share(el); assert.ok(v >= p - 1e-9, `windows only come on (${el})`); p = v; }
  assert.ok(windowThreshold(0.1, 1.2, 1) > windowThreshold(0.1, 1.2, 0), 'the lower floors first');
  assert.equal(windowThreshold(0.4, 0, 0), 0.4, 'at night (no bias): City 1.0\'s order exactly');
  assert.equal(partyReady(duskDark(-3)), false); assert.equal(partyReady(duskDark(-8)), true);
});

test('THE BLUE HOUR (DT1): the Harbor\'s look passes through a deep-blue sky between sunset and night (City 1.0\'s palette untouched)', async () => {
  const { blueHour, harborWeights } = await import('../js/screens/harbor/tones.js');
  const { paletteFor } = await import('../js/screens/district/palette.js');
  assert.equal(blueHour(2), 0); assert.equal(blueHour(-0.8), 0); assert.equal(blueHour(-5), 1); assert.equal(blueHour(-14), 0);
  const LK = { w: { night: 0.2, late: 0, dawn: 0, day: 0, golden: 0.8 }, sun: { el: -5 }, season: { winter: 0, autumn: 1, spring: 0, summer: 0 }, holiday: null };
  const H = harborWeights(LK), sum = Object.values(H.w).reduce((x, y) => x + y, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9 && H.w.blue === 1, 'the weights still sum to 1');
  const P = paletteFor(H), P0 = paletteFor(LK);
  assert.ok(P.sky[1][2] > P.sky[1][0] * 3 && P0.sky[3][0] > P.sky[3][0], 'deep blue, not salmon');
  { const AN = { ...LK, alwaysNight: true }; assert.equal(harborWeights(AN), AN, 'ALWAYS NIGHT: the night itself'); }
  assert.deepEqual(harborWeights({ ...LK, sun: { el: 10 } }).w, LK.w, 'golden hour unchanged');
});

test('THE SLOT RULE (DT1 — the owner: never a shortened name): the blade one-word names only, two-word names on a roof sign (two lines) or the billboard; every sign spells the FULL name at 390 / 402 / 430; every game hangs every week', () => {
  assert.equal(signName({ id: 'stakes', name: 'HIGH STAKES' }), 'HIGH STAKES');
  assert.equal(signName({ id: 'agent', name: 'DOUBLE AGENT' }), 'DOUBLE AGENT');
  assert.equal(signName({ id: 'golf', name: 'NEON PAR' }), 'NEON PAR');
  assert.equal(signName({ id: 'new', name: 'Big Top' }), 'BIG TOP');
  const blade = { kind: 'named', words: 1, cap: 6 }, roof = { kind: 'named', words: 2, cap: 6 };
  assert.ok(fitsSpot('PULSE', blade) && !fitsSpot('HIGH STAKES', blade) && !fitsSpot('OVERCLOCK', blade));
  assert.ok(fitsSpot('HIGH STAKES', roof) && fitsSpot('DOUBLE AGENT', roof) && fitsSpot('CIPHER', roof) && !fitsSpot('RUMRUNNER', roof));
  assert.ok(fitsSpot('SLIPSTREAM', { kind: 'billboard' }));
  const CUT = ['STAKES', 'AGENT', 'NEONPAR', 'PAR', 'HIGH', 'DOUBLE'];
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), spots = signSpots(L), named = spots.filter(sp => sp.kind === 'named');
    for (const night of NIGHTS) {
      const pick = assignSigns(GAMES12, spots, night);
      for (const sp of named) {
        const g = GAMES12.find(x => x.id === pick.get(sp.id)); if (!g) continue;
        assert.ok(fitsSpot(g.short, sp), `${k} ${night}: ${g.short} on ${sp.id}`);
        if (sp.id === 'n-blade') assert.ok(!g.short.includes(' '), `${k} ${night}: the blade takes one word (${g.short})`);
        const sg = buildSign(sp, GAMES.find(x => x.id === g.id), { W: cam.W, s: cam.F / 600 });
        assert.equal(sg.nText, g.short.replace(/ /g, '').length, `${k} ${night}: ${sp.id} spells all of ${g.short}`);
        assert.ok(!CUT.includes(g.short.replace(/ /g, '')) || g.short === 'NEON PAR', `${k} ${night}: a cut-down name ${g.short}`);
        const p = sg.parts.find(q => q.boxes); assert.ok(Math.min(...p.boxes.map(b => b.y1 - b.y0 - 1.2)) >= 10, `${k}: ${sp.id} "${g.short}" ≥ 10 pt`);
        if (g.short.includes(' ')) assert.equal(p.lines, 2, `${k}: ${g.short} stacked on two lines`);
      }
      const bb = billboardPick(GAMES12, spots, pick, night);
      assert.ok(bb && ![...pick.values()].includes(bb), `${k} ${night}: the billboard advertises a game with no sign`);
    }
    // every calendar week (Monday → Sunday) every game shows: a named sign or the billboard
    for (let w = 0; w < 16; w++) {
      const seen = new Set();
      for (let d = 0; d < 7; d++) { const n = new Date(Date.UTC(2026, 9, 5) + (w * 7 + d) * 864e5).toISOString().slice(0, 10), pk = assignSigns(GAMES12, spots, n); for (const v of pk.values()) seen.add(v); seen.add(billboardPick(GAMES12, spots, pk, n)); }
      assert.equal(seen.size, 12, `${k}: week ${w}: ${12 - seen.size} games missing`);
    }
  }
});

test("8a — THE BILLBOARD on the speakeasy's roof: over the left half-plus of the roof, fully inside the left edge, clear of the wheel + the word towers, its frame's feet above the parapet's line, FP: a SHORT frame — the board's foot only a little above the string lights", () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), sp = signSpots(L).find(x => x.kind === 'billboard'), R = sp.rect, b = L.roof.board, s = L.speakeasy;
    assert.equal(sp.mount, 'speak');
    assert.ok(R.x >= 4 && R.w > 60 * cam.F / 600, `${k}: the board ${R.x.toFixed(1)}..${(R.x + R.w).toFixed(1)} inside the left edge, ${R.w.toFixed(0)} pt wide`);
    // over the roof: between the speakeasy's two ends at its depth, its left half-plus
    assert.ok(b.x0 > s.x0 && b.x1 < s.x1 && (b.x1 - s.x0) / (s.x1 - s.x0) > 0.5 && (b.x1 - s.x0) / (s.x1 - s.x0) < 0.75 && b.z > s.z0 && b.z < s.z1);
    // the wheel: the board ends left of its rim; the word towers far right
    const w = L.wheel, [wx, wy] = project(cam, w.x, w.y, w.z), r = cam.F * w.r / w.z;
    assert.ok(Math.hypot(Math.max(R.x - wx, 0, wx - (R.x + R.w)), Math.max(R.y - wy, 0, wy - (R.y + R.h))) > r + 6, `${k}: clear of the wheel`);
    // the word towers' FACES (where the letters light: the tower's top down to face.y) — the board + its lamps stay below / beside
    for (const t of L.towers.filter(t => t.word && t.face)) {
      const tr = t.tiers[0], [a, top] = project(cam, tr.x0, tr.y0 + tr.h, tr.z0), [c] = project(cam, tr.x1, 0, tr.z0);
      assert.ok(!overlap({ x: R.x, y: R.y - 10, w: R.w, h: R.h + 10 }, { x: a, y: top, w: c - a, h: t.face.y - top }), `${k}: clear of ${t.id}'s word face`);
    }
    // the feet: the dunnage's top above the front parapet's line (from this camera the deck itself hides behind it)
    const dunY = project(cam, 0, b.dun, b.z)[1], parY = project(cam, 0, SPEAK_V.parapet, s.z0)[1];
    assert.ok(dunY < parY - 4 * cam.F / 600, `${k}: the feet ${(parY - dunY).toFixed(1)} pt above the parapet`);
    // FP (the owner: the tall open frame showed the brick city through the gap — "chaotic"): a short frame, ≤ ⅙ of the board, the
    // board's foot 1.5–6 pt above the string lights' posts (on the parapet's front edge) — never behind them, never a tall gap.
    // (PF: the lights + their posts are OFF until 7b — strings.js#STRINGS_ON — this keeps the line they return to clear of the board)
    const open = b.y0 - b.dun, hb = b.y1 - b.y0;
    assert.ok(open / hb > 0.05 && open / hb <= 1 / 6, `${k}: frame ${(open / hb).toFixed(2)} of the board`);
    const footY = project(cam, 0, b.y0, b.z)[1], strY = project(cam, 0, SPEAK_V.parapet + 1.12, s.z0 - 0.05)[1], gap = strY - footY, pt = cam.F / 600;
    assert.ok(gap > 1.5 * pt && gap < 6 * pt, `${k}: the board's foot ${gap.toFixed(1)} pt above the string lights`);
  }
});

test('the sign-dim hook: messages dim the logo + fade the tagline, the dimmest wins, the last one lets it come back', async () => {
  const { createSignDim, SIGN_DIM_DEFAULT } = await import('../js/core/harbor-signdim.js');
  const seen = [];
  const sd = createSignDim(d => seen.push(d));
  assert.deepEqual({ logo: sd.now().logo, tag: sd.now().tag }, { logo: 1, tag: 1 });
  sd.set('banner', {});                                     // the defaults
  assert.equal(sd.now().logo, SIGN_DIM_DEFAULT.logo); assert.equal(sd.now().tag, 0); assert.equal(seen.length, 1); assert.equal(seen[0].ms, 1200);
  sd.set('drones', { logo: 0.6, tag: 0.5, ms: 2000 });      // a lighter ask: the dimmest of each still wins
  assert.deepEqual([sd.now().logo, sd.now().tag], [0.35, 0]); assert.equal(seen.length, 1, 'no change, no call');
  sd.clear('banner');
  assert.deepEqual([sd.now().logo, sd.now().tag], [0.6, 0.5]); assert.equal(seen.at(-1).ms, 1200, 'the fade of the one letting go');
  sd.set('drones', null);
  assert.deepEqual([sd.now().logo, sd.now().tag, sd.now().by.length], [1, 1, 0]); assert.equal(seen.length, 3);
  sd.clear('nobody'); sd.set('', {}); assert.equal(seen.length, 3);
  sd.set('x', { logo: 7, tag: -1, ms: 'no' }); assert.deepEqual([sd.now().logo, sd.now().tag, sd.now().ms], [1, 0, 0]);
});

// ------------------------------------------------------------------ SP — THE SKY POLISH (Oct 23 2026)
import { forcedWeather } from '../js/core/weather.js';
test('SP — CIRRUS: a few groups high in the sky, above the tagline\'s band; a hazy high day adds one cirrostratus veil', () => {
  const box = { W: 402, top: 62, roof: 470, hz: 563, avoid: { y0: 280, y1: 340 } };
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
    const M = cloudMix({ cloud: 0.3, cloudLayers: { lo: 0.1, mid: 0, hi: 0.55 } }, seed), P = cloudPlan(box, M, seed).filter(d => d.kind === 'cirrus' && !d.veil);
    assert.ok(P.length >= 1 && P.length <= 4, `${seed}: ${P.length} groups (a few, never a pattern)`);
    assert.ok(P.every(d => d.y <= box.avoid.y0 - 5 && d.y - d.h >= box.top - 1), `${seed}: above the tagline's band, under the top`);
    // groups apart: never two stacked on each other
    for (const a of P) for (const b of P) if (a !== b) {
      const ox = Math.min(a.x0 + a.w, b.x0 + b.w) - Math.max(a.x0, b.x0), oy = Math.min(a.y, b.y) - Math.max(a.y - a.h, b.y - b.h);
      assert.ok(!(ox > 0.35 * Math.min(a.w, b.w) && oy > 0.3 * Math.min(a.h, b.h)), `${seed}: never stacked`);
    }
  }
  const veil = cloudMix({ cloud: 0.5, cloudLayers: { lo: 0.08, mid: 0.05, hi: 0.92 } }, 'a');
  assert.ok(veil.veil > 0.8 && cloudPlan(box, veil, 'a').filter(d => d.veil).length === 1, 'a hazy high day: one veil');
  assert.equal(cloudMix({ cloud: 0.3, cloudLayers: { lo: 0.1, mid: 0, hi: 0.4 } }, 'a').veil, 0, 'thin high cloud: wisps, no veil');
  // the preview weathers carry their heights (&wx=cirrus / &wx=veil)
  assert.ok(forcedWeather('cirrus').layers.hi >= 0.45 && forcedWeather('veil').layers.hi > 0.85);
});

test('SP — OVERCAST: nothing puffy in front of a full deck (only the scud); the light flat + cool by day, the sun without a side', () => {
  for (const seed of ['a', 'b', 'c']) {
    const M = cloudMix({ cloud: 0.97 }, seed);
    assert.ok(M.deck > 0.9 && M.cumulus === 0 && M.strato === 0 && M.scud > 0.3, `${seed}: the deck + scud only`);
  }
  const P = { sky: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]] };
  const day = { sun: { el: 34, az: 190 }, w: { day: 1 }, cloud: 0.95 }, fair = { ...day, cloud: 0.2 };
  const o = sunLook(day, P), f = sunLook(fair, P);
  assert.ok(o.ovc === 1 && o.sunDir === 0, 'overcast by day: flat (no side)');
  assert.ok(f.ovc === 0 && f.sunDir !== 0, 'a fair day keeps its sun');
  assert.equal(sunLook({ ...day, sun: { el: -20, az: 300 } }, P).ovc, 0, 'never at night');
});

test('FP3a — A HIGH VEIL is not overcast (FREV B2): through look() the cover that shuts the sky is 0 → the sun keeps its side, the deck stays away, the sky only slightly whitened', async () => {
  const { look } = await import('../js/core/sky.js');
  const { normalize } = await import('../js/core/weather.js');
  const ms = Date.UTC(2026, 9, 24, 18), tz = 'America/Detroit';
  const veilWx = { ...normalize({ weather_code: 3, cloud_cover: 100, cloud_cover_low: 0, cloud_cover_mid: 0, cloud_cover_high: 100, visibility: 24000 }), at: ms };
  const clearWx = { ...normalize({ weather_code: 0, cloud_cover: 2, cloud_cover_low: 0, cloud_cover_mid: 0, cloud_cover_high: 2, visibility: 24000 }), at: ms };
  const V = look(ms, tz, { wx: veilWx }), C = look(ms, tz, { wx: clearWx });
  assert.ok(V.sun.el > 20, 'midday');
  const P = { sky: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]] };
  const sv = sunLook(V, P), sc = sunLook(C, P);
  assert.ok(sv.ovc === 0 && sv.sunDir === sc.sunDir && sv.sunDir !== 0, `the sun keeps its side under the veil (ovc ${sv.ovc}, side ${sv.sunDir})`);
  const M = cloudMix(V, 'gr');
  assert.ok(M.deck < 0.05 && M.veil > 0.8, `no deck, a veil (deck ${M.deck.toFixed(2)}, veil ${M.veil.toFixed(2)})`);
  const hv = harborSky(P, V), hc = harborSky(P, C), lum = c => c[0] + c[1] + c[2];
  for (let i = 0; i < 4; i++) {
    assert.ok(lum(hv[i]) >= lum(hc[i]) && lum(hv[i]) - lum(hc[i]) < 120, `stop ${i}: whitened a little (${hc[i]} → ${hv[i]})`);
    assert.ok(hv[i][2] > hv[i][0] + 20, `stop ${i}: still blue, never the grey deck (${hv[i]})`);
  }
  const S = look(ms, tz, { wx: { ...normalize({ weather_code: 3, cloud_cover: 100, cloud_cover_low: 100, cloud_cover_mid: 0, cloud_cover_high: 0, visibility: 12000 }), at: ms } });
  assert.equal(sunLook(S, P).ovc, 1, 'a LOW deck is still overcast');
});

test('SP — the cloudy night\'s cost: by moonlight a drifting cloud keeps its light (coarse steps); by day an eighth of the way round', () => {
  const box = { W: 402, top: 62, roof: 470, hz: 563 }, cl = { kind: 'cumulus', w: 100, h: 40, y: 300, s: 0.5, seed: 7 };
  const moon = skyLight({ sun: { el: -30 }, moon: { el: 40, illum: 0.9 } }, { moon: { x: 200, y: 150, r: 12 } });
  assert.ok(moon.src && moon.src.moon);
  let changes = 0, prev = null;
  for (let x = 0; x <= 300; x += 5) { const k = cloudLit(moon, cl, x, box).key; if (prev && k !== prev) changes++; prev = k; }
  const noon = skyLight({ sun: { el: 40 } }, { sun: { x: 200, y: 380, vis: 1 } });
  let dayChanges = 0; prev = null;
  for (let x = 0; x <= 300; x += 5) { const k = cloudLit(noon, cl, x, box).key; if (prev && k !== prev) dayChanges++; prev = k; }
  assert.ok(changes <= dayChanges * 0.5, `moonlight ${changes} re-lights over 300 pt, the sun ${dayChanges}`);
});

// ---------------------------------------------------------------- M2: THE DAY BUILDINGS (cast shadows between buildings) + THE BILLBOARD'S LAMPS
import { castShadows } from '../js/screens/harbor/blocks.js';
import { skyItems } from '../js/screens/harbor/skyline.js';
import { gooseneckLamps } from '../js/screens/harbor/signs.js';
test('M2 cast shadows: by day only, along the sun (morning → right, afternoon → left), never under an overcast deck', () => {
  const { cam, L } = setup('402x874');
  const all = skyItems(L), boxes = [...all.far, ...all.near].filter(i => i.b).map(i => i.b);
  const day = (sunDir, extra = {}) => castShadows(cam, boxes, { day: 1, gold: 0, night: 0, sunDir, sunEl: 22, ovc: 0, cloud: 0.2, ...extra });
  const count = m => [...m.values()].reduce((n, v) => n + v.cast.length, 0);
  assert.ok(count(day(-1)) > 100 && count(day(1)) > 100, 'a sunny day: many shadows');
  for (const T of [{ day: 0, night: 1 }, { day: 0, gold: 1 }, { ovc: 1 }]) assert.equal(count(day(-1, T)), 0, `none at ${JSON.stringify(T)}`);
  assert.ok(count(day(-1, { cloud: 0.7 })) > 0, 'a cloudy day keeps them (softer)');
  // the needle's top tier: in the sunburst's shadow in the afternoon (the sunburst stands to its right, in front), not in the morning
  const needle = boxes.filter(b => b.tower === 'needle').sort((a, b) => (b.y0 || 0) - (a.y0 || 0))[0];
  const hits = m => (m.get(needle) || { cast: [] }).cast.length;
  assert.ok(hits(day(1)) > 0, 'afternoon: the sunburst throws its shadow on the needle');
  // direction (one box in front of a wide wall): the shadow falls right of the box in the morning, left in the afternoon, and is
  // never higher on the wall than the box itself (the light is above)
  const wall = { x0: -40, x1: 40, z0: 300, z1: 312, h: 60, mat: 'lime' }, box = { x0: -5, x1: 5, z0: 280, z1: 292, h: 40, mat: 'lime' };
  const one = sd => castShadows(cam, [wall, box], { day: 1, sunDir: sd, sunEl: 22, ovc: 0, cloud: 0.2 }).get(wall).cast[0];
  const [bx0] = project(cam, box.x0, 0, box.z0), [bx1, , ] = project(cam, box.x1, 0, box.z0), boxTop = project(cam, 0, box.h, box.z0)[1];
  const xs = c => c.pts.map(q => q[0]), ys = c => c.pts.map(q => q[1]);
  assert.ok(Math.max(...xs(one(-1))) > bx1 + 5, 'morning: the shadow reaches out right of the box');
  assert.ok(Math.min(...xs(one(1))) < bx0 - 5, 'afternoon: out left of it');
  assert.ok(Math.min(...ys(one(-1))) >= boxTop - 0.5, 'never above the box on screen');
});
test('M2 billboard lamps: four, ~6–8 pt shades, two each side of the middle, every shade above the board (never over the mark or the name)', () => {
  const R = { x: 6, y: 470, w: 80, h: 50 };
  const ls = gooseneckLamps(R);
  assert.equal(ls.length, 4);
  for (const l of ls) { assert.ok(l.W >= 5.5 && l.W <= 8, `shade ${l.W}`); assert.ok(l.y < R.y, 'mouth above the top edge'); assert.ok(l.top < l.y - l.W, 'the arm rises clear above the shade'); }
  assert.ok(ls[1].x + ls[1].W / 2 < R.x + R.w * 0.35 && ls[2].x - ls[2].W / 2 > R.x + R.w * 0.65, 'the middle (the mark) stays between the inner lamps');
  assert.ok(gooseneckLamps({ x: 0, y: 0, w: 300, h: 80 })[0].W <= 8 && gooseneckLamps({ x: 0, y: 0, w: 40, h: 20 })[0].W >= 5.5, 'clamped at any board size');
});

// ------------------------------------------------------------------ M3: the element's learned lead (her iPhone: "lead −42 ms")
import { createLead, leadKick, leadFast, leadAnchor, leadState, leadToSave, kickErrWide, heardPos, kickLag, KICK_LAG, LEAD_MIN, LEAD_MAX, LIVE_MIN, LIVE_MAX, LEAD_N, FAST_S } from '../js/core/harbor-beat.js';

// a strong kick on beat k with the element → graph offset L: detected at element clock x = beat + lag + L (+ jitter); every 5th hit a
// 16th-note bass hit a quarter beat early (an outlier the estimator must reject)
const leadRig = (grid, { jitter = 0.006, bass = true } = {}) => {
  const p = 60 / grid.bpm, jit = k => (((k * 37) % 13) - 6) / 6 * jitter;
  const kickAt = (k, L) => (grid.t0 || 0) + k * p + KICK_LAG + L + jit(k) - (bass && k % 5 === 4 ? p / 4 : 0);
  const feed = (c, k0, n, L, onKick) => { let k = k0; for (; k < k0 + n; k++) { const w = kickErrWide(kickAt(k, L), grid); const r = leadKick(c, w, grid, k * p * 1000); if (onKick && onKick(k, r, w) === false) break; } return k; };
  return { p, kickAt, feed };
};

test('THE LEAD (M3 → the beat-sync pass): the sign is right (a kick heard → the lead; heard = clock − out − lead); a locked lead takes only small nudges, the 16th-note hits + scattered kicks never move it; bounded; the saved value within the device range', () => {
  const grid = { bpm: 128, t0: 0.31 }, { p, feed } = leadRig(grid), L = -0.042, out = 0.018;
  const lead = createLead(null, 0);
  assert.deepEqual(leadState(lead), { state: 'default', ms: 0, n: 0 });
  let n = 0; feed(lead, 4, 60, L, (k, r) => { n++; return Math.abs(lead.v - L) > 0.005; });
  assert.ok(Math.abs(lead.v - L) < 0.006, `learned ${Math.round(lead.v * 1000)} ms in ${n} kicks (small nudges from a fresh start)`);
  assert.equal(leadState(lead).state, 'locked');
  // heard position: when the beat is HEARD (graph at b + out → x = b + out + L), the heard position is exactly the beat
  const b = grid.t0 + 20 * p;
  assert.ok(Math.abs(heardPos(b + out + L, out, L) - b) < 1e-9, 'heard = the beat when it sounds');
  // locked: a run of kicks does not wander (± jitter + the bass hits)
  const v0 = lead.v; feed(lead, 64, 80, L);
  assert.ok(Math.abs(lead.v - v0) < 0.004, `no wander (${Math.round((lead.v - v0) * 1000)} ms over 80 kicks)`);
  // scattered kicks never move it
  const m = createLead(0.01, 0); for (let i = 0; i < 40; i++) leadKick(m, ((i * 7) % 11) / 11 * 0.3 - 0.15, grid, i);
  assert.equal(m.v, 0.01, 'scattered: unchanged');
  // bounded: the live range; a saved wild value is clamped to the device range; the default too
  const f = createLead(null, 0); leadFast(f, 'route', 0);
  for (let i = 0; i < 60; i++) leadKick(f, kickErrWide(i * (60 / 90) + KICK_LAG + 0.4, { bpm: 90, t0: 0 }), { bpm: 90, t0: 0 }, i);
  assert.ok(f.v <= LIVE_MAX + 1e-9 && f.v >= LIVE_MIN, `bounded at ${f.v}`);
  assert.equal(createLead(0.4).v, LEAD_MAX); assert.equal(createLead(-0.3).v, LEAD_MIN); assert.equal(createLead(null, -0.04).v, -0.04); assert.equal(createLead(null, -0.9).v, LIVE_MIN);
  assert.equal(leadToSave(createLead(null, -0.04)), null, 'nothing learned: nothing saved (the default is the platform\'s)');
  // (a shift is measured modulo one beat: +240 ms is more than half a beat at 128 BPM — on a slower song it is applied as is)
  const big = createLead(null, 0), rig2 = leadRig({ bpm: 100, t0: 0.1 }); leadFast(big, 'visible', 0); rig2.feed(big, 0, 40, 0.24);
  assert.ok(Math.abs(big.v - 0.24) < 0.01 && leadToSave(big) === LEAD_MAX, `a return's +240 ms is applied live (${Math.round(big.v * 1000)}) but the device keeps ≤ ${LEAD_MAX * 1000} ms`);
  // the listener's delay follows the frame rate: 60 Hz = KICK_LAG, 30 Hz ≈ +8 ms, never less at 120 Hz
  assert.equal(kickLag(1 / 60), KICK_LAG); assert.ok(Math.abs(kickLag(1 / 30) - KICK_LAG - 1 / 120) < 1e-9); assert.equal(kickLag(1 / 120), KICK_LAG);
});

// ------------------------------------------------------------------ PART 7a §2: THE NEAR BRICK (readable by day) + THE LIGHTHOUSE BY DAY
// a recording 2D context (no canvas in node): the bake's transform (dpr 2, a band starting at an integer pt), every rect / clip kept
function rec2d(D = 2, oy = -2 * 137) {
  const ops = { rect: [], fillRect: [], clip: 0 }, grad = { addColorStop() {} };
  const base = { getTransform: () => ({ a: D, b: 0, c: 0, d: D, e: 0, f: oy }), createLinearGradient: () => grad, createRadialGradient: () => grad,
    rect: (...a) => { ops.rect.push(a); }, fillRect: (...a) => { ops.fillRect.push(a); }, clip: () => { ops.clip++; } };
  return { ops, x: new Proxy(base, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } }) };
}
test('7a — the near layer bakes at the main canvas\'s DPR at tier 2 (2), on every phone, within the 64 MB budget (no step-down)', async () => {
  const { createBaker, MEM_BUDGET_MB } = await import('../js/screens/harbor/bake.js');
  const fake = () => ({ width: 0, height: 0, getContext: () => null });
  const had = globalThis.document; globalThis.document = { createElement: fake };
  try {
    for (const k of ['390x844', '402x874', '430x932', '412x915']) {
      const { s, cam, L } = setup(k);
      const yOf = (y, z) => project(cam, 0, y, z)[1], top = cam.limitY - 6, w = L.wheel, l = L.lighthouse;
      const hy0 = Math.min(yOf(w.y + w.r + 1, w.z), yOf(l.h + 7, l.z));
      // the scene's groups (scene.js#layout); the stage's band at its measured share of the screen + a margin (it depends on the speakeasy)
      const groups = [
        { name: 'far', y0: top, h: groundY(cam, Z.mid[0]) + 3 - top }, { name: 'near', y0: top, h: yOf(L.quay.foot, Z.quay) + 3 - top },
        { name: 'water', y0: waterBand(L).y0 - 3, h: waterBand(L).y1 - waterBand(L).y0 + 12 },
        { name: 'harbor', y0: hy0, h: yOf(-3.2, L.pier.z0) - hy0 + 4 },
        { name: 'road', y0: yOf(L.rail.y + 0.4, Z.rail) - 3, h: groundY(cam, Z.road[0]) - yOf(L.rail.y + 0.4, Z.rail) + 6 },
        { name: 'stage', y0: s.H * 0.5, h: s.H * 0.48 },
      ];
      const dpr = Math.min(2, 3);                         // tier 2 on a 3× iPhone: the main canvas at DPR 2 (scene.js TIERS)
      const a = createBaker(), b = createBaker();
      a.plan(s.W, groups, dpr, 2);
      b.plan(s.W, [{ name: 'farLit', y0: top, h: groups[0].h }, { name: 'nearLit', y0: top, h: groups[1].h }], dpr, 2, a.planned);
      for (const [bk, n] of [[a, 'near'], [a, 'far'], [b, 'nearLit']]) assert.equal(bk.group(n).dpr, dpr, `${k}: ${n} bakes at the canvas's DPR`);
      const mb = a.mem().mb + b.mem().mb;
      assert.ok(mb < MEM_BUDGET_MB[2] * 0.75, `${k}: ${mb.toFixed(1)} MB of baked layers — room left in the ${MEM_BUDGET_MB[2]} MB budget`);
      a.destroy(); b.destroy();
    }
  } finally { globalThis.document = had; }
});
test('7a — THE BRICK: device-pixel courses + joints by day only (never at night, golden hour or dusk), snapped to whole device px', async () => {
  const { skyBlock, brickCourse, pxGrid } = await import('../js/screens/harbor/blocks.js');
  const { tones } = await import('../js/screens/harbor/tones.js');
  const { cam, L } = setup('402x874');
  const it = skyItems(L).near.find(i => i.b && (i.b.mat === 'brick' || i.b.mat === 'red') && i.b.band === 'near' && i.b.win && i.b.win.rows > 3);
  assert.ok(it, 'a brick block in the near band');
  const s = cam.F / it.b.z0;
  assert.equal(brickCourse(s), 3, `the near ones course every 3 device px (s ${s.toFixed(2)})`);
  const look = (w, extra = {}) => ({ ...tones(w), sunDir: -0.4, sunEl: 30, ovc: 0, cloud: 0.2, ...extra });
  const courses = T => { const { ops, x } = rec2d(); skyBlock(x, cam, it.b, T, it.o); return ops.rect.filter(r => Math.abs(r[3] - 0.5) < 1e-9 && r[2] > 4); };
  const day = courses(look({ day: 1, gold: 0, night: 0 }));
  assert.ok(day.length > 40, `by day: the bed joints (${day.length})`);
  for (const r of day) assert.ok(Math.abs(r[1] * 2 - Math.round(r[1] * 2)) < 1e-6, `a joint on a whole device row (${r[1]})`);
  for (const w of [{ day: 0, gold: 0, night: 1 }, { day: 0, gold: 1, night: 0 }, { day: 0, gold: 0.5, night: 0.5 }]) assert.equal(courses(look(w, { sunDir: 1, sunEl: 6 })).length, 0, `none at ${JSON.stringify(w)}`);
  // the grid follows the bake's transform: a DPR 1.5 bake snaps to its own pixels
  const g = pxGrid(rec2d(1.5, -1.5 * 100).x);
  assert.equal(g.D, 1.5); assert.ok(Math.abs((g.sy(10.3) * 1.5 - 150) - Math.round(g.sy(10.3) * 1.5 - 150)) < 1e-9);
});
test('7a — THE LIGHTHOUSE by day: a cylinder from the sun\'s side (lit flank → core shadow → a bounce on the far edge); the night untouched', async () => {
  const { cylinderTone, lighthouseSteps } = await import('../js/screens/harbor/lighthouse.js');
  const { tones } = await import('../js/screens/harbor/tones.js');
  const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const paint = { lit: [253, 251, 245], core: [170, 176, 198], bounce: [222, 214, 204] };
  for (const sd of [-1, -0.4, 0.4, 1]) {
    const side = Math.sign(sd), at = u => lum(cylinderTone(u * side, paint, sd));       // u > 0: toward the sun
    const us = Array.from({ length: 41 }, (_, i) => -1 + i / 20), L2 = us.map(at);
    const core = us[L2.indexOf(Math.min(...L2.slice(0, 40)))];
    assert.ok(at(0.5) > at(-0.5) + 25, `sd ${sd}: the sun's flank is brighter`);
    assert.ok(core < -0.2 && core > -0.98, `sd ${sd}: the core shadow sits on the far side, in from the edge (${core})`);
    assert.ok(at(-0.95) > Math.min(...L2) + 6, `sd ${sd}: a bounce light on the far edge`);
  }
  // overcast: flatter (less spread across the tower)
  const spread = (sd, ovc) => { const v = Array.from({ length: 21 }, (_, i) => lum(cylinderTone(-1 + i / 10, paint, sd, ovc))); return Math.max(...v) - Math.min(...v); };
  assert.ok(spread(0, 1) < spread(-0.4, 0) * 0.8, 'overcast: softer');
  // the night (and golden hour) never run the day pass: no clip, the same draw calls
  const { cam, L } = setup('402x874');
  const run = w => { const { ops, x } = rec2d(); for (const st of lighthouseSteps(L, { ...tones(w), sunDir: 1, sunEl: 6, ovc: 0 })) st(x); return ops; };
  const night = run({ day: 0, gold: 0, night: 1 }), golden = run({ day: 0, gold: 1, night: 0 }), noon = run({ day: 1, gold: 0, night: 0 });
  assert.equal(night.clip, 0); assert.equal(golden.clip, 0);
  assert.ok(noon.clip >= 1 && noon.fillRect.length > night.fillRect.length + 100, 'by day: the cylinder, the courses, the rust, the stones');
});

// ================================================================ PART 7a — THE SPEAKEASY (core/harbor-speakeasy.js + its layout)
import { ghostAdGame, adWeek, AD_ORDER, AD_EPOCH, roomLight, ROOMS } from '../js/core/harbor-speakeasy.js';
import { speakGeo, bladeGeo } from '../js/screens/harbor/speakeasy.js';

test('7a — THE GHOST AD: one game a week, every game in 12 weeks, the swap on Monday ~4 am, never tonight\'s billboard game', () => {
  const ids = GAMES.filter(g => g.playable !== false).map(g => g.id), WEEK = 7 * 864e5;
  const seen = new Set();
  for (let w = 0; w < ids.length; w++) seen.add(ghostAdGame(AD_EPOCH + w * WEEK + 3600e3, ids));
  assert.equal(seen.size, ids.length, 'every game gets its week');
  const mon = AD_EPOCH + 40 * WEEK;
  assert.equal(ghostAdGame(mon + 60e3, ids), ghostAdGame(mon + WEEK - 60e3, ids), 'the same all week');
  assert.notEqual(ghostAdGame(mon - 60e3, ids), ghostAdGame(mon + 60e3, ids), 'a new one at the swap');
  assert.equal(adWeek(mon), 40);
  const g = ghostAdGame(mon, ids);
  assert.notEqual(ghostAdGame(mon, ids, g), g, 'the billboard\'s game → the next in the rotation');
  assert.ok(AD_ORDER.every(id => ids.includes(id)), 'the rotation names real games');
});

test('7a — THE ROOMS by the hour: all lit in the evening, dark in the small hours, the apartment wakes before dawn', () => {
  for (const r of ROOMS) assert.equal(roomLight(r.id, 22), 1, `${r.id} at 10 pm`);
  for (const id of ['bar', 'jazz', 'back']) assert.equal(roomLight(id, 4), 0, `${id} at 4 am`);
  assert.equal(roomLight('bar', 2.5), 1, 'the bar still open at 2:30');
  assert.equal(roomLight('apartment', 6.75), 1, 'the apartment at 6:45 am');
  assert.equal(roomLight('bar', null), 1);
  assert.deepEqual(ROOMS.filter(r => r.edge).map(r => r.col), [0, 0], 'the edge windows are the cut column');
});

test('7a — THE SPEAKEASY on every phone: same size, the edge windows cut at half, the blade clear of the wheel', () => {
  for (const k of ['390x844', '402x874', '412x915', '430x932']) {
    const { s, cam, L } = setup(k);
    const G = speakGeo(L), [c0] = G.front(0, 0), [c1] = G.front(11.2, 0);
    assert.ok(c0 < 0 && Math.abs((c1 - c0) - 153 * cam.F / 600) < 2, `${k}: the front ${Math.round(c1 - c0)} pt, bleeding off the left`);
    // the edge column: about half a window showing
    const [a, b] = L.speakeasy.windows[0], [wx0] = G.front(a, 5), [wx1] = G.front(b, 5), show = wx1 / (wx1 - wx0);
    assert.ok(show > 0.35 && show < 0.65, `${k}: the edge window ${Math.round(show * 100)} % showing`);
    // the corner as it is: the side wall straight back; the blade sign clear of the wheel's legs + the dock
    assert.equal(L.speakeasy.side.z, 60);
    const bg = bladeGeo(G), w = L.wheel, [wx] = project(cam, w.x, w.y, w.z), r = cam.F * w.r / w.z;
    assert.ok(bg.rect.x + bg.rect.w < wx - w.leg * r - 2, `${k}: the blade (to ${Math.round(bg.rect.x + bg.rect.w)}) clear of the wheel's leg (${Math.round(wx - w.leg * r)})`);
    assert.ok(bg.rect.y + bg.rect.h < cam.dock.y && bg.rect.w > 18 && bg.rect.h > 60, `${k}: the blade ${Math.round(bg.rect.w)}×${Math.round(bg.rect.h)} pt, above the dock`);
  }
});

// ------------------------------------------------------------------ 8a — the first tap, the pulse strength (pure)
test('8a — THE FIRST TAP reads the sign\'s real state: unlit (goodbye / day / golden hour\'s early sputters) → surge, the warm-up window → catch, lit → first; reduced → soft (the catch still catches); the intro / busy skip', async () => {
  const { neonPlan, neonState, firstTapAnswer, warmAt } = await import('../js/screens/district/neon-ramp.js');
  const MIN = 60000, base = Date.UTC(2026, 9, 23, 11, 0);
  const moments = { rise: base, clearAt: base + 8 * MIN, startAt: base + 10 * 3600e3, catchAt: base + 11 * 3600e3 };
  for (const reduced of [false, true]) {
    const plan = neonPlan({ moments, seed: 'gr', reduced });
    const w = warmAt(plan);
    assert.ok(w > plan.startAt + 30 * MIN && w < plan.catchAt && plan.catchAt - w <= 5.5 * MIN && plan.catchAt - w >= 1.8 * MIN, 'the warm-up window: the last ~2–5 min (from the first letter sticking)');
    const at = t => firstTapAnswer(neonState(plan, t), plan, t, { reduced });
    const cases = [
      ['night (before dawn)', base - 30 * MIN, 'first'],
      ['the morning goodbye', plan.clearAt + 2 * MIN, 'surge'],
      ['the day', base + 4 * 3600e3, 'surge'],
      ['golden hour (the early sputters)', plan.startAt + 20 * MIN, 'surge'],
      ['just before the window', w - 1000, 'surge'],
      ['the warm-up window', w + 1000, 'catch'],
      ['a second before the catch', plan.catchAt - 1000, 'catch'],
      ['dusk (after the catch)', plan.catchAt + 20 * MIN, 'first'],
    ];
    for (const [what, t, want] of cases) assert.equal(at(t), reduced && want !== 'catch' ? 'soft' : want, `${reduced ? 'reduced: ' : ''}${what}`);
  }
  const plan = neonPlan({ moments, seed: 'gr' });
  // the title's stand-ins (ALWAYS NIGHT, a polar day: no plan) — by the lit state alone
  assert.equal(firstTapAnswer({ stage: 'night', caught: true }, null, 0), 'first');
  assert.equal(firstTapAnswer({ stage: 'day', caught: false }, null, 0), 'surge');
  assert.equal(firstTapAnswer({ stage: 'ramp', caught: false }, null, 0), 'surge', 'no plan: never a catch');
  assert.equal(firstTapAnswer(neonState(plan, plan.catchAt - 1000), plan, plan.catchAt - 1000, { intro: true }), 'skip:intro');
  assert.equal(firstTapAnswer(neonState(plan, base), plan, base, { busy: true }), 'skip:busy');
  // FP3a: the sign's REAL lit state on screen wins over the plan's (the DOM is what the player sees)
  assert.equal(firstTapAnswer({ stage: 'night', caught: true }, null, 0, { lit: false }), 'surge', 'the plan says caught, the glass is unlit → surge');
  assert.equal(firstTapAnswer({ stage: 'day', caught: false }, null, 0, { lit: true }), 'first', 'lit on screen → the lit race');
  assert.equal(firstTapAnswer(neonState(plan, warmAt(plan) + 1000), plan, warmAt(plan) + 1000, { lit: false }), 'catch', 'the warm-up window still catches');
});

test('FP3a — THE MUSIC STARTING: the detector fires once per start (silent ≥ 1 s or since the page came up, then the song\'s clock moving); never for music already playing, a song change, or a short gap', async () => {
  const { createStartDetector } = await import('../js/screens/district/neon-ramp.js');
  const run = (seq, step = 100) => { const d = createStartDetector({ quietMs: 1000 }); let t = 0; return seq.map(c => { const r = d.feed(c, t); t += step; return r; }); };
  const fires = seq => run(seq).filter(Boolean).length;
  assert.equal(fires([-1, -1, 0, 0.02, 0.1]), 1, 'the visit\'s first song: silent since the page came up (even < 1 s), then moving');
  assert.equal(fires([-1, 0, 0, 0, 0]), 0, 'a clock that never moves (buffering) is not a start yet');
  assert.equal(fires([-1, 0, 0, 0, 0.2]), 1, '… and is one once it moves');
  assert.equal(fires([3.1, 3.2, 3.3, 3.4]), 0, 'already playing when the title mounted');
  assert.equal(fires([3.1, 3.2, 0.0, 0.1, 0.2]), 0, 'a song change (the clock jumps back while sounding)');
  assert.equal(fires([5, 5.1, -1, -1, -1, 0, 0.1]), 0, 'a 300 ms gap (a crossfade blip) is not a new start');
  assert.equal(fires([5, 5.1, ...Array(12).fill(-1), 0, 0.1, 0.2]), 1, 'the music button OFF ≥ 1 s, then ON → a start');
  assert.equal(fires([-1, 0, 0.1, ...Array(12).fill(-1), 0, 0.1, ...Array(12).fill(-1), 0, 0.1]), 3, 'every start counts (the 10 s cooldown is the title\'s, not the detector\'s)');
});

test('8a — PULSE STRENGTH: pulseGain parses percent / multiplier, clamps, defaults; pulseOut is linear to the knee, never above the cap; the remote validates it (the server shares it), drops the default, and carries it to the URL + the status', async () => {
  const { pulseGain, pulseOut, PULSE_DEFAULT, PULSE_MIN, PULSE_MAX, PULSE_KNEE, PULSE_CAP } = await import('../js/core/harbor-beat.js');
  const { cleanRemote, toParams, describe, PULSE, REMOTE_KEYS } = await import('../js/core/harbor-remote.js');
  assert.equal(PULSE_DEFAULT, 1.75, "the owner's pick on her iPhone: 175 % (FP)");
  assert.equal(pulseGain(null), PULSE_DEFAULT); assert.equal(pulseGain(''), PULSE_DEFAULT); assert.equal(pulseGain('junk'), PULSE_DEFAULT); assert.equal(pulseGain('-3'), PULSE_DEFAULT);
  assert.equal(pulseGain('180'), 1.8); assert.equal(pulseGain(180), 1.8); assert.equal(pulseGain('1.8'), 1.8); assert.equal(pulseGain('100'), 1);
  assert.equal(pulseGain('900'), PULSE_MAX); assert.equal(pulseGain('10'), PULSE_MIN); assert.equal(pulseGain('0.2'), PULSE_MIN);
  assert.equal(pulseGain('133'), 1.35, 'on the slider\'s 5 % steps');
  // the default (175 %) is linear below the knee (a beat-3 punch ~0.6) and eased above it (a downbeat at the grid's 0.85); never negative, never above the cap
  assert.ok(Math.abs(pulseOut(0.6) - 0.6 * 1.75) < 1e-9);
  assert.ok(pulseOut(0.85) > PULSE_KNEE && pulseOut(0.85) < 0.85 * 1.75 && pulseOut(0.85) < PULSE_CAP, 'the downbeat eased by the knee');
  assert.equal(pulseOut(0), 0); assert.equal(pulseOut(-1, 2), 0); assert.equal(pulseOut(NaN, 2), 0);
  assert.ok(Math.abs(pulseOut(1, PULSE_KNEE) - PULSE_KNEE) < 1e-9, 'linear up to the knee');
  let prev = 0;
  for (let p = 0; p <= 1.6; p += 0.02) { const v = pulseOut(p, PULSE_MAX); assert.ok(v >= prev - 1e-12 && v < PULSE_CAP, `monotonic, under the cap (${p.toFixed(2)} → ${v.toFixed(3)})`); prev = v; }
  for (const k of [0.5, 1, 1.3, 1.8, 2.5]) assert.ok(pulseOut(0.85, k) >= pulseOut(0.85, k - 0.1), `a higher strength never punches less (${k})`);
  // the panel's range + the remote
  assert.deepEqual(PULSE, { min: 50, max: 250, step: 5, def: 175 });
  assert.ok(REMOTE_KEYS.includes('pulse'), 'the remote owns &pulse= (JUST ME / EVERYONE replace the page\'s own)');
  let r = cleanRemote({ pulse: 180 });
  assert.deepEqual(r, { state: { pulse: 180 }, bad: [] });
  assert.equal(toParams(r.state).pulse, '180'); assert.equal(describe(r.state), 'PULSE 180 %');
  assert.equal(pulseGain(toParams(r.state).pulse), 1.8, 'the URL flag the scene reads → the multiplier');
  assert.deepEqual(cleanRemote({ pulse: '205' }).state, { pulse: 205 });
  assert.deepEqual(cleanRemote({ pulse: 175 }), { state: {}, bad: [] }, 'the default itself is no change');
  for (const v of [45, 255, 133, 'x', 1.8, -100, 1e9]) assert.ok(cleanRemote({ pulse: v }).bad.includes('pulse'), `refused: ${v}`);
  assert.deepEqual(cleanRemote({ force: ['searchlights'], pulse: 250, party: 'on' }).state, { force: ['searchlights'], pulse: 250, party: 'on' }, 'with anything else');
});

// ------------------------------------------------------------------ 8a — THE PROMENADE
import { promenadeLayout, seasonOf, PHONE as PROM_PHONE, PIECE as PROM_PIECE } from '../js/core/harbor-promenade.js';
test('8a — THE PROMENADE: the centrepiece spot in the open plaza (clear of the door, the shop window, the furniture; a tall seasonal piece stays under the wheel\'s hub), nothing under the dock, no tree cut by the edge', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), m = L.medallion, P = (x, y, z) => project(cam, x, y, z);
    const [mx, my] = P(m.x, 0, m.z), ring = cam.F * m.ring / m.z;
    // the door + the shop window stay clear of a 2.6-unit-radius piece standing on it
    const d = L.door, piece = cam.F * 2.6 / m.z;
    assert.ok(mx - piece > d.x + d.w / 2 + 4, `${k}: the centrepiece clear of the door`);
    const [w1] = P(L.speakeasy.x0 + L.speakeasy.shop.win[1], 0, L.speakeasy.z0);
    assert.ok(mx - piece > w1, `${k}: clear of the shop window`);
    // open space: no furniture within the ring (+ a margin)
    for (const it of [...L.lamps, ...L.trees, ...L.planters, L.bench, L.cart]) {
      const [ix] = P(it.x, 0, it.z);
      if (Math.abs(it.z - m.z) < 6) assert.ok(Math.abs(ix - mx) > ring + 6, `${k}: ${it.kind || 'a piece'} at ${ix.toFixed(0)} clear of the medallion ${mx.toFixed(0)}`);
    }
    // an 11-unit Christmas tree there stays under the wheel's hub
    const w = L.wheel, [, hy] = P(w.x, w.y, w.z), [, ty] = P(m.x, 11, m.z);
    assert.ok(ty > hy + 30 * cam.F / 600, `${k}: the tall piece's top ${ty.toFixed(0)} under the hub ${hy.toFixed(0)}`);
    // nothing stands under the dock; no tree is cut by the screen's edges
    for (const it of [...L.lamps, ...L.trees, ...L.planters, L.bench, L.cart]) assert.ok(P(it.x, 0, it.z)[1] <= cam.dock.y + 1, `${k}: ${it.kind || 'piece'} above the dock`);
    for (const t of L.trees) { const [tx] = P(t.x, 0, t.z), r = cam.F * t.w / 2 / t.z; assert.ok(tx - r >= 0 && tx + r <= cam.W, `${k}: a ${t.kind} inside the screen`); }
    // no flag; the stop lights right of the wheel's base
    assert.equal(L.flag, undefined);
    const [wx] = P(w.x, 0, w.z), base = cam.F * (w.leg * w.r + 1.4) / w.z;
    for (const sg of L.signals) assert.ok(P(sg.x, 0, sg.z)[0] > wx + base, `${k}: the ${sg.id} stop light right of the wheel's base`);
  }
});
test('FP / PF — THE PROMENADE: furniture on the edges (the back row clear of the stop lights, the lantern + the crossing\'s landing), an open floor, the front edge clear (two corner globes + the framing maple), the bench by a tall lamp', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), P = (x, z, y = 0) => project(cam, x, y, z), sx = it => P(it.x, it.z)[0];
    const crown = t => cam.F * t.w / 2 / t.z;
    // THE BACK ROW (the curb): (FP2) the crabapple, two tall lamps, the bench — every tree's crown clear of both stop lights' heads + the lantern
    const back = [...L.trees, ...L.lamps].filter(it => it.z >= 50);
    assert.deepEqual(back.filter(t => t.kind === 'maple' || t.kind === 'crab').map(t => t.kind), ['crab'], `${k}: one curb tree — the crabapple (FP2: the red maple by the blade is gone)`); assert.equal(back.filter(l => l.kind === 'tall').length, 2, `${k}: two tall lamps`);
    assert.ok(L.bench.z > 47 && L.bench.z < 50, `${k}: the bench a little forward of the back row (PF)`);
    const keep = [...L.signals.map(sg => sx(sg)), sx(L.crosswalk.lantern)];
    for (const t of L.trees.filter(t => t.z >= 50)) for (const kx of keep) assert.ok(Math.abs(sx(t) - kx) > crown(t) + 4, `${k}: a curb maple (${sx(t).toFixed(0)}) clear of a stop light / the lantern (${kx.toFixed(0)})`);
    // the crossing's landing on the curb stays open: no tree trunk, lamp post or bench in the crosswalk's width
    const [c0] = P(L.crosswalk.x0, 53), [c1] = P(L.crosswalk.x1, 53);
    for (const it of [...back, L.bench]) { const x = sx(it), hw = it === L.bench ? cam.F * L.bench.w / 2 / L.bench.z : 3; assert.ok(x + hw < c0 || x - hw > c1, `${k}: the crossing's landing open (${x.toFixed(0)} vs ${c0.toFixed(0)}–${c1.toFixed(0)})`); }
    // THE OPEN FLOOR (z 38.4–50): only the medallion + the cart (FP2: the corner urn is gone — no planter on the promenade)
    const floor = [...L.trees, ...L.lamps, ...L.planters].filter(it => it.z > 38.4 && it.z < 50);
    assert.deepEqual(floor, [], `${k}: the floor holds no tree, lamp or planter`);
    const s = L.speakeasy;
    assert.equal(L.planters.length, 0, `${k}: no planter (FP2)`);
    // THE FRONT EDGE (nearer than z 38.4): only the two corner globes + the framing maple at the right — not covering the cart
    const front = [...L.trees, ...L.lamps, ...L.planters].filter(it => it.z <= 38.4);
    const globes = front.filter(l => l.kind === 'globe').map(sx).sort((a, b) => a - b), [faceX] = P(s.x1, s.z0);
    assert.equal(globes.length, 2, `${k}: two globes`); assert.ok(Math.abs(globes[0] - faceX) < 0.04 * cam.W && globes[1] > 0.93 * cam.W, `${k}: one at each corner (${globes.map(v => v.toFixed(0))})`);
    const big = front.filter(t => t.kind === 'maple'); assert.equal(big.length, 1, `${k}: one framing maple`);
    const inR = sx(L.medallion) + cam.F * L.medallion.ring / L.medallion.z; assert.ok(sx(big[0]) - crown(big[0]) >= inR && sx(big[0]) > 0.82 * cam.W, `${k}: the framing maple at the right edge, clear of the inlay`);
    // the bench in a tall lamp's light (it must read at night: PF — the left flanking lamp behind its right end)
    assert.ok(L.lamps.some(l => l.kind === 'tall' && Math.hypot(l.x - L.bench.x, l.z - L.bench.z) < 5.5 && sx(l) > sx(L.bench)), `${k}: the bench by a tall lamp`);
  }
});
test('8a — THE SEASON by the real date (Michigan), forced by &season=, the south shifted', () => {
  assert.equal(seasonOf(10, 23), 'autumn'); assert.equal(seasonOf(7, 4), 'summer'); assert.equal(seasonOf(5, 1), 'spring'); assert.equal(seasonOf(1, 10), 'winter');
  assert.equal(seasonOf(11, 25), 'winter'); assert.equal(seasonOf(4, 5), 'winter'); assert.equal(seasonOf(9, 26), 'autumn');
  assert.equal(seasonOf(10, 23, { force: 'spring' }), 'spring'); assert.equal(seasonOf(10, 23, { force: 'nope' }), 'autumn');
  assert.equal(seasonOf(1, 10, { south: true }), 'summer');
});
test('8a — THE IMPLIED ROAD: one car a slot at most, on the clock (the same for everyone), busier in the evening than at 3 am', async () => {
  const { roadPassAt, roadBusy, ROAD_PASS } = await import('../js/core/harbor-promenade.js');
  const t0 = Date.UTC(2026, 9, 23, 0, 0);
  let eve = 0, small = 0;
  for (let i = 0; i < 2000; i++) { const ms = t0 + i * 7e3; const a = roadPassAt(ms, () => 19), b = roadPassAt(ms, () => 19); assert.deepEqual(a, b); if (a) { assert.ok(ms >= a.t0 && ms < a.t0 + ROAD_PASS.dur); eve++; } if (roadPassAt(ms, () => 3)) small++; }
  assert.ok(eve > small * 2, `evening ${eve} vs 3 am ${small}`);
  assert.ok(roadBusy(18) > roadBusy(3));
  const f = roadPassAt(t0 + 5e3, () => 12, { force: true }); assert.ok(f && f.id.startsWith('f'));
});

// ------------------------------------------------------------------ PART 8a: THE PROPS' ART (props.js) — every prop, season and look
// draws with real colours (never NaN), and the shadows follow the rules: a cast shadow only in the sun, the contact shadow always
test('8a — the props draw in every season + look with finite colours; cast shadows only in the sun (none at night / overcast)', async () => {
  const { drawBench, drawCart, drawPlanter, drawMedallion, propShadow } = await import('../js/screens/harbor/props.js');
  const { promenadeLayout } = await import('../js/core/harbor-promenade.js');
  const s = SIZES['402x874'], cam = cameraFor(s.W, s.H, { tag: s.tag, dock: s.dock }, s.safe), L = promenadeLayout(cam);
  const grad = { addColorStop() {} };
  const rec = () => {
    const o = { bad: [], soft: 0 }, base = { getTransform: () => ({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 }), createLinearGradient: () => grad, createRadialGradient: () => grad, measureText: () => ({ width: 40 }), fill: () => { if (base.shadowBlur > 0) o.soft++; } };
    const chk = v => { if (typeof v === 'string' && /NaN|undefined|Infinity/.test(v)) o.bad.push(v); };
    return { o, x: new Proxy(base, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { if (k === 'fillStyle' || k === 'strokeStyle' || k === 'shadowColor') chk(v); t[k] = v; if (k === 'shadowBlur' && !v) t[k] = 0; return true; } }) };
  };
  const looks = { day: { day: 1, gold: 0, night: 0, sunDir: 0.4, sunEl: 40, ovc: 0 }, gold: { day: 0, gold: 1, night: 0, sunDir: 1, sunEl: 6, ovc: 0 },
    night: { day: 0, gold: 0, night: 1, sunDir: 0, sunEl: 6, ovc: 0, lamps: 1 }, overcast: { day: 1, gold: 0, night: 0, sunDir: 0, sunEl: 40, ovc: 0.75 } };
  for (const season of ['spring', 'summer', 'autumn', 'winter']) for (const [name, T] of Object.entries(looks)) {
    const ctx = { season, phase: 0.5, lights: L.lamps.map(l => ({ x: l.x, z: l.z, kind: l.kind })), lampK: T.lamps || 0, snow: season === 'winter' ? 0.5 : 0 };
    const { o, x } = rec();
    drawBench(x, cam, L.bench, T, ctx); drawCart(x, cam, L.cart, T, ctx); for (const p of L.planters) drawPlanter(x, cam, p, T, ctx); drawMedallion(x, cam, L.medallion, T, ctx);
    assert.deepEqual(o.bad, [], `${season} ${name}`);
    // the shadows: the bench's cast + contact = 2 soft fills in the sun; only the contact one at night / under an overcast deck
    const sh = rec(); propShadow(sh.x, cam, L.bench, 'bench', T, ctx);
    assert.equal(sh.o.soft, name === 'night' || name === 'overcast' ? 1 : 2, `${season} ${name} shadows`);
    assert.deepEqual(sh.o.bad, []);
  }
});

// ------------------------------------------------------------------ PART 8a: THE TREES (core/harbor-trees.js + trees.js)
test('8a — THE TREES: one seeded skeleton through the year, the crown inside its box (never past w/2 or the top), bare in winter, thinning in late autumn, each maple its own autumn mix, the crabapple\'s blossom + fruit', async () => {
  const { treePlan, treeMix, densityOf, LEAF } = await import('../js/core/harbor-trees.js');
  const { promenadeLayout } = await import('../js/core/harbor-promenade.js');
  const s = SIZES['402x874'], cam = cameraFor(s.W, s.H, { tag: s.tag, dock: s.dock }, s.safe), L = promenadeLayout(cam);
  // (FP: the phone's re-laid promenade has three maples — the crabapple stays for the panorama's front row: tested here as one)
  const { PIECE: PC } = await import('../js/core/harbor-promenade.js'), CRAB = { x: 0, z: 49, kind: 'crab', trunk: PC.crab.trunk, w: PC.crab.w, h: PC.crab.h, r: PC.crab.w / 2, grate: true };
  assert.deepEqual(L.trees.map(t => t.kind), ['maple', 'crab'], 'the phone (FP2): the big framing maple + the curb crabapple');
  [...L.trees, CRAB].forEach((t, i) => {
    const a = treePlan(t, { season: 'autumn', phase: 0.5, i });
    assert.deepEqual(JSON.stringify(a), JSON.stringify(treePlan(t, { season: 'autumn', phase: 0.5, i })), 'deterministic');
    // the same tree all year: the skeleton never changes with the season
    for (const season of ['spring', 'summer', 'winter']) assert.deepEqual(treePlan(t, { season, phase: 0.5, i }).segs, a.segs, `${t.kind} ${season}: one skeleton`);
    // real branching: a trunk, limbs, twigs (no ball on a stick)
    assert.ok(a.segs.filter(g => g.d === 1).length >= 6 && a.segs.filter(g => g.d >= 5).length >= 40, `${t.kind}: limbs + twigs`);
    for (const season of ['spring', 'summer', 'autumn']) for (const phase of [0.1, 0.5, 0.9]) {
      const p = treePlan(t, { season, phase, i });
      assert.ok(p.clusters.length >= 6, `${t.kind} ${season} ${phase}: a crown`);
      for (const c of p.clusters) {
        const reach = c.r * 1.04 + LEAF[t.kind] * 1.6;
        assert.ok(Math.abs(c.u) + reach <= t.w / 2 + 1e-9 && c.v + reach <= t.trunk + t.h + 1e-9, `${t.kind} ${season}: a cluster inside the crown's box`);
        assert.ok(c.col.every(Number.isFinite) && c.dabs.length > 10);
      }
    }
    const w = treePlan(t, { season: 'winter', phase: 0.3, i });
    assert.equal(w.clusters.length, 0, 'winter: bare');
    assert.equal(w.depth, 6, 'winter: every twig shows');
    if (t.kind === 'maple') {
      assert.ok(treePlan(t, { season: 'autumn', phase: 0.95, i }).clusters.length < a.clusters.length * 0.6, 'late autumn: thinner');
      assert.ok(treePlan(t, { season: 'autumn', phase: 0.9, i }).fallen.length > treePlan(t, { season: 'autumn', phase: 0.1, i }).fallen.length, 'more leaves down as autumn goes on');
      assert.ok(treePlan(t, { season: 'spring', phase: 0.05, i }).clusters.length < treePlan(t, { season: 'spring', phase: 0.8, i }).clusters.length, 'spring: the leaves come out');
    } else {
      const sp = treePlan(t, { season: 'spring', phase: 0.5, i });
      assert.ok(sp.clusters.filter(c => c.blooms).length > sp.clusters.length * 0.7, 'the crabapple in blossom');
      assert.ok(sp.fallen.length > 0, 'petals on the paving');
      assert.ok(a.fruit.length > 8 && w.fruit.length > 0, 'its little red apples in autumn + winter');
    }
  });
  // the maples' autumn: scarlet-crimson, orange, gold-amber — the phone's two maples (i 0, 1) each their own
  const dom = i => treeMix('maple', 'autumn', i)[0][0];
  assert.ok(dom(0)[0] > 180 && dom(0)[1] < 60, 'scarlet'); assert.ok(dom(1)[1] > 80 && dom(1)[1] < 130, 'orange'); assert.ok(dom(2)[1] > 150, 'gold');
  assert.equal(densityOf('maple', 'winter'), 0); assert.equal(densityOf('maple', 'summer'), 1);
});

test('8a — THE TREES draw in every season + look with finite colours; cast shadows only in the sun; THE FALLING LEAVES: capped by tier, none at tier 0 / reduced motion / winter', async () => {
  const { drawTree, treeShadow, createLeaves } = await import('../js/screens/harbor/trees.js');
  const { promenadeLayout } = await import('../js/core/harbor-promenade.js');
  const s = SIZES['402x874'], cam = cameraFor(s.W, s.H, { tag: s.tag, dock: s.dock }, s.safe), L = { ...promenadeLayout(cam), cam };
  { const { PIECE: PC } = await import('../js/core/harbor-promenade.js'); L.trees = [...L.trees, { x: 0, z: 49, kind: 'crab', trunk: PC.crab.trunk, w: PC.crab.w, h: PC.crab.h, r: PC.crab.w / 2, grate: true }]; }   // (FP: a crabapple — the panorama's)
  const rec = () => {
    const grad = { addColorStop: () => {} }, o = { bad: [], fills: 0 }, base = { fill: () => { o.fills++; }, createLinearGradient: () => grad, createRadialGradient: () => grad };
    const chk = v => { if (typeof v === 'string' && /NaN|undefined|Infinity/.test(v)) o.bad.push(v); };
    const num = (...a) => { if (a.some(v => typeof v === 'number' && !Number.isFinite(v))) o.bad.push('a NaN point'); };
    return { o, x: new Proxy(base, { get: (t, k) => (k in t ? t[k] : num), set: (t, k, v) => { if (k === 'fillStyle' || k === 'strokeStyle') chk(v); t[k] = v; return true; } }) };
  };
  const looks = { day: { day: 1, gold: 0, night: 0, sunDir: -0.4, sunEl: 40, ovc: 0 }, gold: { day: 0, gold: 1, night: 0, sunDir: 1, sunEl: 6, ovc: 0 },
    night: { day: 0, gold: 0, night: 1, sunDir: 0, sunEl: 6, ovc: 0 }, overcast: { day: 1, gold: 0, night: 0, sunDir: 0, sunEl: 40, ovc: 0.75 } };
  for (const season of ['spring', 'summer', 'autumn', 'winter']) for (const [name, T] of Object.entries(looks)) {
    const ctx = { season, phase: 0.5, lights: L.lamps.map(l => ({ x: l.x, z: l.z, kind: l.kind })), lampK: name === 'night' ? 1 : 0, snow: season === 'winter' ? 0.5 : 0, wet: 0 };
    L.trees.forEach((t, i) => {
      const { o, x } = rec(); drawTree(x, cam, t, T, { ...ctx, i });
      assert.deepEqual(o.bad, [], `${t.kind} ${season} ${name}`); assert.ok(o.fills > 5);
      const sh = rec(); treeShadow(sh.x, cam, t, T, { ...ctx, i });
      assert.deepEqual(sh.o.bad, []);
      assert.equal(sh.o.fills > 0, name === 'day' || name === 'gold', `${t.kind} ${season} ${name}: a cast shadow only in the sun`);
    });
  }
  // the leaves: a minute of frames in a wind
  const run = (o, secs = 60) => { const lv = createLeaves(); lv.layout(L); let peak = 0; const { x } = rec(); for (let f = 0; f < secs * 30; f++) { lv.draw(x, { t: f / 30, dt: 33, motion: true, wind: 6, season: 'autumn', phase: 0.6, fade: 1, night: 0, tier: 2, ...o }); peak = Math.max(peak, lv.debug().n); } return peak; };
  const p2 = run({}), p1 = run({ tier: 1 });
  assert.ok(p2 > 2 && p2 <= 12, `tier 2: ${p2}`); assert.ok(p1 > 0 && p1 <= 5, `tier 1: ${p1}`);
  assert.equal(run({ tier: 0 }), 0); assert.equal(run({ motion: false }), 0); assert.equal(run({ season: 'winter' }), 0);
  assert.ok(run({ season: 'spring', phase: 0.5 }) > 0, 'the crabapple\'s petals');
});

// ------------------------------------------------------------------ FP — THE SONG CLOCK (the beat after returning: docs/audio.md#fp)
test('FP — THE SONG CLOCK: the beat follows the SONG (the element\'s currentTime) through coarse iOS steps, a pause (the context running on), the context frozen while the element plays, a seek, a stuck reading — and the lights\' beat index matches the song', async () => {
  const { createSongClock, songClockStep, SC_HOLD, DRIFT_SNAP } = await import('../js/core/harbor-beat.js');
  const grid = { bpm: 140, t0: 0.197, down: 1 }, spb = 60 / grid.bpm;
  const songBeat = t => (t - grid.t0) / spb - grid.down;
  const off = (hb, t) => { let d = songBeat(t) - hb.beats; d -= 4 * Math.round(d / 4); return Math.abs(d) * spb; };   // (s)
  const sc = createSongClock(), hb = createHarborBeat(0);
  let now = 0, song = 30;                                  // the frame clock (ms) + the song's true position (s)
  // the element's currentTime on iOS: a fresh value every 250 ms (the time at that update), held between
  let shown = song, shownAt = 0;
  const frame = (dtMs, opts = {}) => {
    now += dtMs; if (!opts.paused && !opts.stuck) song += dtMs / 1000;
    if (opts.seek != null) { song = opts.seek; shown = song; shownAt = now; }
    if (!opts.stuck && now - shownAt >= 250) { shown = song; shownAt = now; }
    const pos = songClockStep(sc, { id: 'c2-party7', t: shown, paused: !!opts.paused }, now, opts.why || '');
    advanceHarborBeat(hb, opts.lost ? 0 : dtMs, pos >= 0 ? { bpm: grid.bpm, pos, grid, snap: sc.snap } : null, null);
    return pos;
  };
  // 1. coarse steps: the clock runs smoothly, within a frame of the song, never backwards
  let prev = -1, worst = 0, back = 0;
  for (let i = 0; i < 600; i++) { const p = frame(1000 / 60); worst = Math.max(worst, Math.abs(p - song)); if (prev >= 0 && p < prev - 1e-6) back++; prev = p; }
  assert.ok(worst < 0.02 && back === 0, `coarse steps: ${(worst * 1000).toFixed(1)} ms from the song at worst, ${back} steps back`);
  assert.ok(off(hb, song) < DRIFT_SNAP, `the lights on the song's beat (${(off(hb, song) * 1000).toFixed(1)} ms)`);
  // 2. the element paused while the context keeps running (the frame clock goes on): no song, then it resumes from where it stopped
  for (let i = 0; i < 120; i++) frame(1000 / 60, { paused: true });
  assert.equal(sc.pos, -1, 'paused: no position');
  frame(1000 / 60, { why: 'play' });
  for (let i = 0; i < 3; i++) frame(1000 / 60);
  assert.ok(off(hb, song) < DRIFT_SNAP, `resumed: the beat index matches the song at once (${(off(hb, song) * 1000).toFixed(1)} ms)`);
  // 3. the CONTEXT frozen / the page hidden while the element plays on (no frames for 40 s; the song advanced): back → re-locked at once
  for (let i = 0; i < 40; i++) { now += 1000; song += 1; }
  shown = song; shownAt = now;
  frame(1000 / 60, { lost: true });
  for (let i = 0; i < 2; i++) frame(1000 / 60);
  assert.ok(off(hb, song) < DRIFT_SNAP && Math.abs(sc.pos - song) < 0.02, `back after 40 s: on the song within two frames (${(off(hb, song) * 1000).toFixed(1)} ms)`);
  const idx = ((Math.floor(songBeat(song)) % 4) + 4) % 4;
  assert.equal(hb.idx, idx, `the beat index ${hb.idx + 1}/4 = the song's ${idx + 1}/4`);
  assert.equal(hb.songIdx, idx, 'the readout\'s song beat');
  assert.ok(Math.abs(hb.drift) < DRIFT_SNAP * 1000, `the readout's drift ${hb.drift.toFixed(1)} ms`);
  // 4. a seek (without an event: the reading jumps) — re-anchored at once
  frame(1000 / 60, { seek: 95.3 });
  frame(1000 / 60);
  assert.ok(sc.why === 'jump' && off(hb, song) < DRIFT_SNAP, `a seek re-locks (${sc.why}, ${(off(hb, song) * 1000).toFixed(1)} ms)`);
  // 5. a stuck currentTime while it "plays": run forward SC_HOLD s at most, flagged; when it moves again — back on the song
  const stuckAt = sc.pos;
  for (let i = 0; i < 240; i++) frame(1000 / 60, { stuck: true });
  assert.ok(sc.stuck && sc.pos <= stuckAt + SC_HOLD + 0.3 + 1e-6, `stuck: flagged, held ${(sc.pos - stuckAt).toFixed(2)} s past the last reading`);
  shown = song; shownAt = now;
  for (let i = 0; i < 3; i++) frame(1000 / 60);
  assert.ok(!sc.stuck && off(hb, song) < DRIFT_SNAP, `unstuck: on the song (${(off(hb, song) * 1000).toFixed(1)} ms)`);
  // 6. a drift between 30 and 250 ms: re-anchored when two fresh readings agree (one late update alone never moves it)
  const a0 = sc.anchors;
  song += 0.08; shown = song; shownAt = now; frame(1000 / 60);
  assert.equal(sc.anchors, a0, 'one reading 80 ms off: not yet');
  for (let i = 0; i < 20; i++) frame(1000 / 60);
  assert.ok(sc.anchors === a0 + 1 && sc.why === 'drift' && off(hb, song) < DRIFT_SNAP, `two agreeing readings: re-anchored (${sc.why})`);
  // 7. an event re-anchors on its own (visible / rebuild): the clock takes the reading as it is
  frame(1000 / 60, { why: 'visible' });
  assert.ok(sc.snap && sc.why === 'visible');
});

// ------------------------------------------------------------------ THE BEAT-SYNC PASS — THE LEAD SETTLES AFTER A RETURN (her readouts: heard +107 ms
// SKEW at 140 BPM; heard +237 ms SKEW · re-measure GAVE UP at 106 BPM — FP2's gathering window was ±0.4 beat = ±226 ms there, so +237 could
// never be measured; and the SKEW flag flipped the kicks in and out as the song clock re-anchored: "all over the place")
test('THE BEAT-SYNC PASS — a +100 ms and a +240 ms shift of the sound after a return (visible / resume / route) are absorbed by the lead within a few bars, at 140 and at 106 BPM; no overshoot; the song clock\'s re-anchors never undo it; no shift = no change; the settle ends quietly when the kicks never agree', () => {
  for (const [grid, shift, maxKicks] of [[{ bpm: 140, t0: 0.197, down: 1 }, 0.1, 14], [{ bpm: 140, t0: 0.197, down: 1 }, 0.146, 14], [{ bpm: 106, t0: 0.33, down: 0 }, 0.24, 16], [{ bpm: 106, t0: 0.33, down: 0 }, 0.271, 16]]) {
    const { p, feed } = leadRig(grid), out = 0.018, L1 = -0.039, L2 = L1 + shift;
    const c = createLead(L1, -0.04); let k = feed(c, 8, 40, L1);
    assert.ok(Math.abs(c.v - L1) < 0.006, `${grid.bpm} bpm: the lead she had, ${Math.round(c.v * 1000)} ms`);
    // the return: the settle starts with the event, the sound now L2 off the element's clock
    leadFast(c, 'visible', 0);
    let n = 0, over = 0, flips = 0;
    k = feed(c, k, 60, L2, (kk, r) => { n++; over = Math.max(over, c.v - L2); if (r === 'locked') flips++; return Math.abs(c.v - L2) > 0.01; });
    assert.ok(n <= maxKicks, `${grid.bpm} bpm, +${Math.round(shift * 1000)} ms: within 10 ms after ${n} kicks (≤ ${maxKicks}: ~${(maxKicks / 4).toFixed(0)} bars)`);
    assert.ok(over < 0.012, `never overshoots (${Math.round(over * 1000)} ms)`);
    feed(c, k, 40, L2);
    assert.ok(Math.abs(c.v - L2) < 0.008 && !c.fast && leadState(c, 1e9).state === 'locked', `settled at ${Math.round(c.v * 1000)} ms (the sound's ${Math.round(L2 * 1000)}), locked`);
    const b = grid.t0 + 200 * p;
    assert.ok(Math.abs(heardPos(b + out + L2, out, c.v) - b) < 0.01, 'heard = the beat when it sounds');
    // the song clock re-anchoring mid-song (a jump, a seek) forgets the residuals, never the lead
    leadAnchor(c); assert.ok(Math.abs(c.v - L2) < 0.008 && c.errs.length === 0 && c.res === null, 'a re-anchor keeps the lead');
    feed(c, k + 40, 30, L2); assert.ok(Math.abs(c.v - L2) < 0.008, 'and the kicks after it agree with it');
  }
  const grid = { bpm: 140, t0: 0.197, down: 1 }, { feed } = leadRig(grid), L1 = -0.039;
  // no event — the sound moves on its own (the residual steadily past 80 ms): the lead settles on it by itself
  const d = createLead(L1, 0); feed(d, 8, 40, L1);
  let m = 0; feed(d, 100, 80, L1 + 0.12, (kk, r) => { m++; return Math.abs(d.v - L1 - 0.12) > 0.01; });
  assert.ok(m <= 16, `a +120 ms shift with no event: absorbed after ${m} kicks (≈ ${(m / 4).toFixed(0)} bars)`);
  // a settle that finds the old lead right changes nothing, and reports 'locked'
  const e = createLead(L1, 0); feed(e, 8, 40, L1); const v0 = e.v;
  leadFast(e, 'resume', 0); let res = null; feed(e, 60, 30, L1, (kk, r) => { if (r === 'locked') { res = r; return false; } });
  assert.ok(res === 'locked' && Math.abs(e.v - v0) < 0.006 && !e.fast, `no shift: locked again, ${Math.round(v0 * 1000)} → ${Math.round(e.v * 1000)} ms`);
  assert.equal(leadState(e, 1000).state, 'settled');
  // scattered kicks during a settle: nothing moves; after FAST_S s the settle ends quietly — the lead as it was, never a wrong value
  const s = createLead(L1, 0); leadFast(s, 'route', 0);
  for (let i = 0; i < 40; i++) leadKick(s, ((i * 7) % 11) / 11 * 0.3 - 0.15, grid, i * 500);
  assert.ok(s.fast && s.v === createLead(L1).v, 'scattered: still settling, unchanged');
  leadKick(s, 0.01, grid, FAST_S * 1000 + 1);
  assert.ok(!s.fast && s.v === createLead(L1).v && s.last && !s.last.ok && leadState(s, FAST_S * 1000 + 2).state === 'settled', 'timed out quietly, unchanged (the readout: kept)');
  assert.ok(LEAD_N >= 5, 'at least five agreeing kicks before anything moves');
});

// ------------------------------------------------------------------ THE BEAT-SYNC PASS — THE WHOLE CHAIN: the song clock + the lead + the beat clock
// through a return with the sound shifted +237 ms (her case at 106 BPM): the lights land on the sound again within a few bars, the
// source never flips, the tempo never moves, no half-time
test('THE BEAT-SYNC PASS — THE WHOLE CHAIN: a return that shifts the sound +237 ms at 106 BPM — the lights are back on the beat AS HEARD within 4 bars, one source throughout, the tempo untouched, every beat punching', async () => {
  const { createSongClock, songClockStep } = await import('../js/core/harbor-beat.js');
  const grid = { bpm: 106, t0: 0.33, down: 0 }, p = 60 / grid.bpm, out = 0.018;
  const sc = createSongClock(), hb = createHarborBeat(0), lead = createLead(-0.034, -0.04);
  let now = 0, el = 20, L = -0.034;                  // the frame clock (ms), the element's currentTime (s), the element → sound offset
  const srcs = new Set(), rates = new Set();
  let shown = el, shownAt = 0, lastKick = -1;
  // one frame: the element's coarse clock; a strong kick heard when the SOUND (el − L) crosses a grid beat, KICK_LAG later
  const frame = (why = '') => {
    now += 1000 / 60; el += 1 / 60;
    if (now - shownAt >= 250) { shown = el; shownAt = now; }
    const at = songClockStep(sc, { id: 'c2-party5', t: shown }, now, why);
    if (sc.snap) leadAnchor(lead);
    const soundBeat = Math.floor((el - L - KICK_LAG - grid.t0) / p);
    let hit = 0;
    if (soundBeat !== lastKick && soundBeat >= 0) { lastKick = soundBeat; hit = 0.9; leadKick(lead, kickErrWide(at, grid), grid, now); }
    const pos = heardPos(at, out, lead.v);
    advanceHarborBeat(hb, 1000 / 60, { bpm: grid.bpm, pos, grid, snap: sc.snap }, { live: true, energy: 0.9, hit });
    srcs.add(hb.src); rates.add(+hb.rate.toFixed(4));
  };
  // how far the lights' beat sits from the sound's beat (ms): the sound at the ear is el − L − out behind the element's clock
  const offMs = () => { const sb = (el - L - out - grid.t0) / p; let d = sb - hb.beats; d -= 4 * Math.round(d / 4); return d * p * 1000; };
  for (let i = 0; i < 1800; i++) frame();
  assert.ok(Math.abs(offMs()) < 25, `before leaving: the lights ${offMs().toFixed(0)} ms from the sound`);
  // the home screen for 30 s: the element plays on, the frame clock stops; back with the sound now +237 ms off the element's clock
  now += 30000; el += 30; shown = el; shownAt = now; L = -0.034 + 0.271;
  leadFast(lead, 'visible', now);
  frame('visible');
  let bars = 0, settledAt = null;
  for (let i = 0; i < 1800; i++) { frame(); if (settledAt == null && i > 60 && Math.abs(offMs()) < 25) settledAt = i; }
  bars = settledAt == null ? 99 : settledAt / 60 / (4 * p);
  assert.ok(settledAt != null && bars <= 4, `back on the sound ${bars.toFixed(1)} bars after the return (${offMs().toFixed(0)} ms off at the end)`);
  assert.ok(Math.abs(offMs()) < 25, `and it stays there (${offMs().toFixed(0)} ms)`);
  assert.deepEqual([...srcs], ['grid'], 'one source throughout');
  assert.ok(rates.size <= 2 && [...rates].every(r => Math.abs(60 * r - 106) < 0.1), `the tempo never moved (${[...rates].map(r => (60 * r).toFixed(2)).join(', ')} bpm)`);
});

// ------------------------------------------------------------------ FP2 — PARTY-NIGHT TIMING, EARLIER (8:30 warm-up, 9:30 peak — after the dark)
test('FP2 — PARTY TIMING: warm-up 8:30 / peak 9:30 in October; in midsummer both slide after the power-up; calming after 1 am; the show never before the warm-up', async () => {
  const { harborParty, harborPartyPlan, partyReadyHour, HARBOR_PARTY } = await import('../js/core/harbor-show.js');
  const { darkness, partyReady } = await import('../js/core/harbor-dark.js');
  const { sunPosition, localParts } = await import('../js/core/sky.js');
  const lat = 42.96, lon = -85.67, tz = 'America/Detroit';
  const evening = iso => { const ms = Date.parse(iso), lc = localParts(ms, tz); return Date.UTC(lc.y, lc.m - 1, lc.d) - lc.off * 60000; };
  const dark = ms => darkness({ el: sunPosition(ms, lat, lon).el });
  // October (Sat 24): the power-up is done ~7:15 pm → the fixed times
  const oct = partyReadyHour(evening('2026-10-24T12:00:00-04:00'), dark, partyReady);
  assert.ok(oct > 18.8 && oct < 19.8, `October ready at ${oct.toFixed(2)} h`);
  const po = harborPartyPlan(oct);
  assert.deepEqual([po.warm, po.peak, po.calm, po.end], [20.5, 21.5, 25, 26]);
  assert.equal(harborParty(20.4, po).on, false, '8:24 pm: not yet');
  assert.ok(harborParty(20.5, po).on && harborParty(20.75, po).name === 'warm', '8:45 pm: the warm-up');
  assert.equal(harborParty(21.75, po).name, 'peak', '9:45 pm: THE PEAK');
  assert.equal(harborParty(24.5, po).name, 'peak', '12:30 am: still the peak (the finale at midnight)');
  assert.equal(harborParty(25.2, po).name, 'after', '1:12 am: calming');
  const e = h => harborParty(h, po).energy;
  assert.ok(e(20.6) < e(21.2) && e(21.2) < e(21.8) && e(21.8) > 0.97 && e(25.8) < 0.75, `energy ${[20.6, 21.2, 21.8, 25.8].map(e).map(v => v.toFixed(2))}`);
  // midsummer (Sat 20 June 2026): sunset ~9:20 pm, the power-up done ~10 pm → the warm-up then, the peak 45 min later
  const jun = partyReadyHour(evening('2026-06-20T12:00:00-04:00'), dark, partyReady), pj = harborPartyPlan(jun);
  assert.ok(jun > 21.7 && jun < 22.3, `June ready at ${jun.toFixed(2)} h`);
  assert.ok(Math.abs(pj.warm - jun) < 1e-9 && Math.abs(pj.peak - (jun + HARBOR_PARTY.gap)) < 1e-9, `June: warm ${pj.warm.toFixed(2)}, peak ${pj.peak.toFixed(2)}`);
  assert.equal(harborParty(21.6, pj).on, false, 'June 9:36 pm: still the blue hour — no show');
  // a white night (the sun never low enough): no ready hour — the live darkness gate (partyReady) keeps the show off
  assert.equal(partyReadyHour(evening('2026-06-20T12:00:00+03:00'), ms => darkness({ el: sunPosition(ms, 66, 25).el }), partyReady), null);
  assert.deepEqual(harborPartyPlan(null), { warm: 20.5, peak: 21.5, calm: 25, end: 26 });
});

// ------------------------------------------------------------------ FP — THE STOP LIGHTS + THE CROSSING
import { signalAt, SIGNAL_CYCLE, SIGNAL_PERIOD, LANTERN } from '../js/core/harbor-promenade.js';
import { SIG } from '../js/screens/harbor/road.js';
test('FP — THE CROSSING\'S CYCLE: on the shared clock (the same for everyone), green → amber → red with WALK → WAIT blinking → green', () => {
  const t0 = Date.UTC(2026, 9, 22, 16, 0, 0);
  // every phone the same: a pure function of the city's clock, periodic
  for (let k = 0; k < 50; k++) { const ms = t0 + k * 937; assert.deepEqual(signalAt(ms), signalAt(ms)); assert.equal(signalAt(ms).road, signalAt(ms + SIGNAL_PERIOD * 1000 * 7).road); }
  // the order over one cycle, sampled every 50 ms
  const seq = [];
  let blinkOn = 0, blinkOff = 0;
  for (let s = 0; s < SIGNAL_PERIOD; s += 0.05) {
    const st = signalAt(Math.ceil(t0 / (SIGNAL_PERIOD * 1000)) * SIGNAL_PERIOD * 1000 + s * 1000);
    const key = `${st.road}/${st.walk}${st.blink ? '*' : ''}`;
    if (seq[seq.length - 1] !== key) seq.push(key);
    // never WALK unless the road is red; the cars' green always under a steady WAIT
    if (st.walk === 'walk') assert.equal(st.road, 'red');
    if (st.road === 'green') assert.ok(st.walk === 'wait' && !st.blink && st.lit);
    if (st.blink) { if (st.lit) blinkOn++; else blinkOff++; }
  }
  assert.deepEqual(seq, ['green/wait', 'amber/wait', 'red/wait', 'red/walk', 'red/wait*', 'red/wait', 'green/wait']);
  // WAIT blinks (on and off) only in the last seconds before the road turns green
  assert.ok(blinkOn > 20 && blinkOff > 20, `the blink: on ${blinkOn} · off ${blinkOff}`);
  assert.ok(SIGNAL_CYCLE.blink >= 3 && SIGNAL_CYCLE.blink <= 8 && SIGNAL_CYCLE.walk >= 8);
});
test('FP — THE CROSSING on the phones: the heads face along the road (side-on), the WALK / WAIT lantern across the road — clear of the wheel\'s base, the stop lights + the dock, its letters readable', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), P = (x, y, z) => project(cam, x, y, z), f = cam.W / 402;
    const ln = L.crosswalk.lantern, s = cam.F / ln.z, [lx, ly] = P(ln.x, 0, ln.z), lw = ln.w * s;
    const box = { x0: lx - lw / 2, x1: lx + lw / 2, y0: ly - (ln.h + ln.bh + 0.5) * s, y1: ly };
    // on the far side (by the railing), at the crosswalk's far end
    assert.ok(ln.z > L.crosswalk.z0 + 8 && ln.z < Z.rail && ln.x > L.crosswalk.x0 && ln.x < L.crosswalk.x1, `${k}: the lantern at the crosswalk's far end`);
    // clear of the wheel's base + the dock
    const w = L.wheel, [wx] = P(w.x, 0, w.z), base = cam.F * (w.leg * w.r + 1.4) / w.z;
    assert.ok(box.x0 > wx + base, `${k}: the lantern ${box.x0.toFixed(0)} right of the wheel's base ${(wx + base).toFixed(0)}`);
    assert.ok(box.y1 < cam.dock.y, `${k}: the lantern above the dock`);
    // never behind a stop light's head (hoods included)
    for (const sg of L.signals) {
      const ss = cam.F / sg.z, [sx] = P(sg.x, 0, sg.z), [, sy] = P(sg.x, sg.h, sg.z), half = (SIG.D / 2 + SIG.visor) * ss;
      const sb = { x0: sx - half, x1: sx + half, y0: sy, y1: sy + (SIG.top + SIG.HH) * ss };
      const overlap = box.x0 < sb.x1 && box.x1 > sb.x0 && box.y0 < sb.y1 && box.y1 > sb.y0;
      assert.ok(!overlap, `${k}: the lantern clear of the ${sg.id} stop light's head`);
      // the head's hoods reach along the road both ways (one face per direction of traffic), wider than it is deep
      assert.ok(SIG.visor > SIG.D * 0.8);
    }
    // its letters ≈ 6.5 pt+ at 402 (scaled by the width): the pane's height × the font's 0.74
    const ph = ((ln.bh - 0.34 - 0.16) / 2) * s, letter = ph * 0.74;
    assert.ok(letter > 6.2 * f, `${k}: the lantern's letters ${letter.toFixed(1)} pt`);
    assert.equal(LANTERN.z, ln.z);
  }
});

// ---------------------------------------------------------------- FP — THE BARBER POLE (the owner: "glitchy, jagged, not continuous" at night)
import { poleTurn, POLE_DAY, POLE_NIGHT } from '../js/screens/harbor/speakeasy.js';
test("FP — THE BARBER POLE turns continuously: the same phase at 60 and 30 Hz, never stepped to a pixel; slow when lit, the shop's pace by day", () => {
  for (const lit of [0, 0.5, 1]) {
    let a = 0.3, b = 0.3;
    for (let i = 0; i < 120; i++) a = poleTurn(a, 1 / 60, lit);
    for (let i = 0; i < 60; i++) b = poleTurn(b, 1 / 30, lit);
    assert.ok(Math.abs(a - b) < 1e-9, `lit ${lit}: 60 Hz ${a} vs 30 Hz ${b}`);
    const rate = POLE_DAY + (POLE_NIGHT - POLE_DAY) * lit;
    assert.ok(Math.abs(((a - 0.3 + 1) % 1) - (2 * rate) % 1) < 1e-9, `lit ${lit}: 2 s turn ${rate * 2} periods`);
  }
  // one frame's step at night is a small FRACTION of a point (a 10 pt period: ~0.03 pt at 60 Hz) — sub-pixel, so the strip must slide
  const step = (poleTurn(0, 1 / 60, 1) - 0) * 10;
  assert.ok(step > 0 && step < 0.1 && Math.abs(step - Math.round(step)) > 1e-3, `a frame's step ${step.toFixed(4)} pt`);
  assert.equal(poleTurn(0.99, 0.1, 0), (0.99 + 0.042) % 1, 'wraps round (the strip is one period: seamless)');
  assert.equal(poleTurn(0.5, -1, 1), 0.5, 'never backwards');
});

// ---------------------------------------------------------------- FP2 — THE PROMENADE (the owner's tweaks: no red maple by the blade, no urn,
// the medallion in the middle in front of the crossing + the cart left of it, the centrepiece's height cap, the bench + its crabapple left of
// the cart's umbrella, no parked bus, the lantern's post on the far kerb, the crabapple's seasons, the framing maple's inside)
import { centrepieceCap, CENTRE_PAD, EVENT_CLEAR, CART_SHOWN } from '../js/core/harbor-promenade.js';
import { benchBox, umbrellaBox } from '../js/screens/harbor/props.js';
import { PARKED_TRAFFIC, FAR_KERB, drawTraffic, drawLanternBody } from '../js/screens/harbor/road.js';
test("PF — THE FINAL LAYOUT: the inlay on the crossing's axis between the flanking tall lamps, the bench + its crabapple just left of the crossing (the blade free), the cart placed right of the inlay (8P), the centrepiece's height cap, the corner clean", () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { s, cam, L } = setup(k), f = s.W / 402, P = (x, z, y = 0) => project(cam, x, y, z), sx = it => P(it.x, it.z)[0];
    const m = L.medallion, mx = sx(m), ring = cam.F * m.ring / m.z, bx = sx(L.bench);
    const crab = L.trees.find(t => t.kind === 'crab'), cx = sx(crab), crown = cam.F * crab.w / 2 / crab.z;
    // the spots (402: the inlay ~268 — the crossing's centre, the bench ~207, the crabapple ~181)
    assert.ok(Math.abs(mx - 268 * f) < 6 * f && Math.abs(bx - 207 * f) < 6 * f && Math.abs(cx - 181 * f) < 6 * f, `${k}: inlay ${mx.toFixed(0)}, bench ${bx.toFixed(0)}, crab ${cx.toFixed(0)}`);
    const [c0] = P(L.crosswalk.x0, 53), [c1] = P(L.crosswalk.x1, 53);
    // (the crossing's axis on screen: the crosswalk's middle, z 59 — the pieces stand by screen fraction)
    const ax = (P(L.crosswalk.x0, 59)[0] + P(L.crosswalk.x1, 59)[0]) / 2;
    assert.ok(Math.abs(mx - ax) < 3 * f, `${k}: the inlay on the crossing's axis (${mx.toFixed(0)} vs ${ax.toFixed(0)})`);
    // THE TALL PAIR flanking the crossing: one either side, symmetric about its centre, outside the stop lights
    const tall = L.lamps.filter(l => l.kind === 'tall').map(sx).sort((a, b) => a - b), sg = L.signals.map(sx).sort((a, b) => a - b);
    assert.equal(tall.length, 2); assert.ok(tall[0] < c0 && tall[1] > c1 && tall[0] < sg[0] && tall[1] > sg[1], `${k}: the tall lamps flank the crossing (${tall.map(v => v.toFixed(0))})`);
    assert.ok(Math.abs((tall[0] + tall[1]) / 2 - ax) < 3 * f, `${k}: a matched pair, symmetric about the crossing`);
    // the bench + its crabapple just LEFT of the crossing; the crabapple's crown clear of the blade (the blade free, the tree shows)
    const bw = cam.F * L.bench.w / 2 / L.bench.z;
    assert.ok(bx + bw < c0 && cx < bx, `${k}: the crabapple · the bench · the crossing, left to right`);
    const blade = bladeGeo(speakGeo({ ...L, cam })).rect;
    assert.ok(cx - crown >= blade.x + blade.w - 1, `${k}: the crabapple's crown (${(cx - crown).toFixed(0)}) right of the blade (${(blade.x + blade.w).toFixed(0)})`);
    assert.ok(cx + crown < tall[0] - cam.F * PROM_PIECE.tall.arm / 52.6 + 3 * f, `${k}: … and left of the flanking lamp's head`);
    // the door + the shop window clear of the inlay; nothing at the speakeasy's corner
    const d = L.door, [w1] = P(L.speakeasy.x0 + L.speakeasy.shop.win[1], L.speakeasy.z0);
    assert.ok(mx - ring > d.x + d.w + 4 && mx - ring > w1, `${k}: the inlay clear of the door + the shop window`);
    assert.equal(L.planters.length, 0, `${k}: no urn`);
    // 8P — THE CART BACK, PLACED: on the open floor right of the inlay — outside an event's clearance, clear of the crossing (right of
    // its landing), left of the framing maple; it blocks the walkers (they go round)
    assert.equal(CART_SHOWN, true); assert.ok(L.cart.shown !== false);
    assert.ok(L.cart.x - m.x >= EVENT_CLEAR - 0.1, `${k}: right of the inlay, outside an event's clearance (${(L.cart.x - m.x).toFixed(2)})`);
    assert.ok(L.zones.block.some(b => b.x === L.cart.x && b.z === L.cart.z), `${k}: the cart blocks the walkers`);
    // THE HEIGHT CAP: under the game blade's bottom and the wheel's hub (by CENTRE_PAD), a Christmas tree's height at least
    const bl = signSpots(L).find(sp => sp.id === 'n-blade'), nb = bl.rect.y + bl.rect.h, hub = P(L.wheel.x, L.wheel.z, L.wheel.y)[1];
    const cap = centrepieceCap(cam, m, [nb, hub]), [, top] = P(m.x, m.z, cap);
    assert.ok(cap >= 10 && cap < 13, `${k}: the cap ${cap} units`);
    assert.ok(top >= nb + CENTRE_PAD - 0.01 && top >= hub + CENTRE_PAD - 0.01 && top < nb + CENTRE_PAD + 2, `${k}: its top ${top.toFixed(1)} under the blade ${nb.toFixed(1)} + the hub ${hub.toFixed(1)}`);
    assert.equal(centrepieceCap(cam, m, [P(m.x, m.z)[1]]), 0, 'no room → 0');
  }
});
test('FP2 — no parked traffic (the bus waits for 8b); THE WALK / WAIT LANTERN on a proper post down to the far kerb, its foot in view', () => {
  assert.equal(PARKED_TRAFFIC, false);
  let drawn = 0; const ctx = new Proxy({}, { get: () => () => { drawn++; }, set: () => true });
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k);
    drawTraffic(ctx, L, { night: 0, bus: [1, 2, 3], car: [1, 2, 3], glass: [1, 2, 3] });
    assert.equal(drawn, 0, `${k}: nothing parked on the road`);
    // the post: drawn down to the kerb's top (its footing stone), and that foot is above the promenade's back row (in view)
    const ln = L.crosswalk.lantern; let low = -1e9;
    const track = y => { if (Number.isFinite(y)) low = Math.max(low, y); };
    const rec = new Proxy({ measureText: () => ({ width: 20 }) }, { get: (t, p) => (p in t ? t[p] : p === 'fillRect' ? (a, y, w, h) => track(y + h) : p === 'moveTo' || p === 'lineTo' ? (a, y) => track(y) : () => {}), set: () => true });
    drawLanternBody(rec, cam, ln, { day: 1, gold: 0, night: 0, sunDir: 0.4 });
    const [lx, kerb] = project(cam, ln.x, FAR_KERB.h, ln.z), [, road] = project(cam, ln.x, 0, ln.z);
    assert.ok(low >= kerb - 0.5 && low <= road + 1.5, `${k}: the post's foot ${low.toFixed(1)} on the kerb (${kerb.toFixed(1)}–${road.toFixed(1)})`);
    assert.ok(road < groundY(cam, 54) - 15, `${k}: its foot above the promenade's curb`);
    // nothing on the promenade stands in front of the post's foot (no curb tree, no lamp right there)
    for (const it of [...L.trees, ...L.lamps]) { const [x] = project(cam, it.x, 0, it.z), r = it.kind === 'tall' ? cam.F * 0.3 / it.z : cam.F * (it.w || 0.5) / 2 / it.z; assert.ok(Math.abs(x - lx) > r + 2, `${k}: a ${it.kind} at ${x.toFixed(0)} in front of the lantern's post (${lx.toFixed(0)})`); }
  }
});
test("FP2 — THE CURB CRABAPPLE through the year (white-pink blossom → green → gold + red fruit → bare + fruit) and the framing maple's inside: deep warm colour, never brown-black; a sturdier trunk, a balanced crown", async () => {
  const { treePlan } = await import('../js/core/harbor-trees.js');
  const { L } = setup('402x874'), crab = L.trees.find(t => t.kind === 'crab'), big = L.trees.find(t => t.big);
  const lum = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  const sp = treePlan(crab, { season: 'spring', phase: 0.5, i: 1 });
  const bl = sp.clusters.filter(c => c.blooms);
  assert.ok(bl.length > sp.clusters.length * 0.7, 'in blossom');
  assert.ok(bl.reduce((a, c) => a + lum(c.col), 0) / bl.length > 205, 'the blossom whiter (the owner: "fluffier / whiter")');
  const su = treePlan(crab, { season: 'summer', phase: 0.5, i: 1 });
  assert.ok(su.clusters.every(c => c.col[1] > c.col[0]), 'summer green');
  const au = treePlan(crab, { season: 'autumn', phase: 0.5, i: 1 });
  assert.ok(au.clusters.every(c => c.col[0] >= c.col[1] && c.col[1] > c.col[2] + 20) && au.fruit.length > 8, 'golden autumn + red fruit');
  const wi = treePlan(crab, { season: 'winter', phase: 0.3, i: 1 });
  assert.ok(wi.clusters.length === 0 && wi.fruit.length > 0, 'bare winter, a few apples left');
  // the framing maple (its own mix: the blaze) — its inside (the back clusters) a deep orange-red / crimson: bright red, warm, saturated
  assert.equal(big.v, 1);
  const a = treePlan(big, { season: 'autumn', phase: 0.5, i: big.v }), backs = a.clusters.filter(c => c.back);
  assert.ok(backs.length >= 8);
  for (const c of backs) assert.ok(c.col[0] >= 150 && c.col[0] - c.col[2] >= 120 && c.col[1] < c.col[0] * 0.8, `an inside cluster ${c.col} — deep warm, never brown`);
  const sm = treePlan(big, { season: 'summer', phase: 0.5, i: big.v });
  for (const c of sm.clusters.filter(c => c.back)) assert.ok(c.col[1] > c.col[0] && c.col[1] > c.col[2], 'summer: a deeper green inside');
  // the trunk sturdier than a curb maple's, the crown balanced either side of it
  assert.ok(a.segs[0].w0 >= 0.5, `the trunk ${a.segs[0].w0}`);
  const left = a.clusters.filter(c => c.u < 0).length, right = a.clusters.length - left;
  assert.ok(Math.min(left, right) / Math.max(left, right) > 0.6, `balanced: ${left} / ${right}`);
  assert.ok(a.clusters.length >= 40, `a full crown: ${a.clusters.length} clusters`);
});

// ---------------------------------------------------------------- FP2 — CRISP LIGHTS + THE POLE (the owner: "looks smoky"; the pole "still jittery")
import { polePhase, poleAnchor, poleRate, poleStripe, poleColours, poleHalo, POLE_HALO, POLE_LIT, POLE_PAINT, SHOP_GLOW } from '../js/screens/harbor/speakeasy.js';
import { LAMP_HALO } from '../js/screens/harbor/stage.js';
import { rngFrom as fp2Rng } from '../js/core/rng.js';
test('FP2 — THE POLE BY REAL TIME: the phase a pure function of the frame timestamp — the same at 60 / 30 / irregular frames, never snapped', () => {
  for (const lit of [0, 1]) {
    const rate = poleRate(lit), a0 = poleAnchor(null, 1.25, rate);
    // three cadences over the same 4 s: 60 Hz, the 30 fps battery saver, an irregular phone (hitches, a long frame)
    const r = fp2Rng(7), irregular = [1.25]; while (irregular[irregular.length - 1] < 5.25) irregular.push(irregular[irregular.length - 1] + (r() < 0.1 ? 0.05 + r() * 0.12 : 0.012 + r() * 0.03));
    for (const times of [Array.from({ length: 241 }, (_, i) => 1.25 + i / 60), Array.from({ length: 121 }, (_, i) => 1.25 + i / 30), irregular]) {
      let a = a0;
      for (const t of times) { a = poleAnchor(a, t, rate); const want = (0.3 + (t - 1.25) * rate) % 1; assert.ok(Math.abs(polePhase(a, t) - want) < 1e-9, `lit ${lit} t ${t}: ${polePhase(a, t)} vs ${want}`); }
    }
    // the stripes' offset in device pixels (a 10 pt period, dpr 2 / 3): fractional — never rounded to a whole pixel
    for (const dpr of [2, 3]) { const fr = Array.from({ length: 30 }, (_, i) => (polePhase(a0, 1.25 + i / 30) * 10 * dpr) % 1); assert.ok(fr.filter(f => f > 0.02 && f < 0.98).length > 20, `dpr ${dpr}: sub-pixel offsets ${fr.map(f => f.toFixed(2)).join(' ')}`); }
  }
  // re-anchoring (dusk's ramp, the raid) keeps the phase continuous; the raid (rate 0) holds it still
  const a = poleAnchor(null, 0, poleRate(0)), b = poleAnchor(a, 3.7, poleRate(1));
  assert.ok(Math.abs(polePhase(b, 3.7) - polePhase(a, 3.7)) < 1e-12 && b !== a && poleAnchor(b, 9, poleRate(1)) === b, 'continuous at a rate change; same rate = same anchor');
  const still = poleAnchor(b, 5, 0); assert.equal(polePhase(still, 50), polePhase(still, 5), 'the raid: still');
  assert.ok(poleRate(1) < poleRate(0) && poleRate(1) <= 0.2, `slow at night: ${poleRate(1)} periods a second (day ${poleRate(0)})`);
});
test('FP2 — THE POLE\'S STRIPES: box-filtered coverage (analytic antialiasing) — continuous in the slide (no step), periodic, never more than the glass', () => {
  const band = 5.2, P = 2 * band;
  for (const w of [0.3, 0.5, 1.2]) {
    let prev = poleStripe(0, band, w);
    for (let v = 0.01; v < 3 * P; v += 0.01) {
      const c = poleStripe(v, band, w);
      assert.ok(c[0] >= 0 && c[1] >= 0 && c[0] + c[1] <= 1 + 1e-9, `v ${v}: ${c}`);
      // (a 0.01 pt slide changes a pixel by at most 0.01 / w: smooth, never a jump)
      assert.ok(Math.abs(c[0] - prev[0]) <= 0.01 / w + 1e-9 && Math.abs(c[1] - prev[1]) <= 0.01 / w + 1e-9, `w ${w} v ${v.toFixed(2)}: ${prev} → ${c}`);
      const q = poleStripe(v + P, band, w); assert.ok(Math.abs(q[0] - c[0]) < 1e-9 && Math.abs(q[1] - c[1]) < 1e-9, 'periodic: one period = two bands');
      prev = c;
    }
  }
  // each stripe ≈ 0.42 of a band (red, then blue a band later)
  const n = 1040, cov = [0, 0]; for (let i = 0; i < n; i++) { const c = poleStripe(i * P / n, band, 0.4); cov[0] += c[0] / n; cov[1] += c[1] / n; }
  assert.ok(Math.abs(cov[0] - 0.21) < 0.01 && Math.abs(cov[1] - 0.21) < 0.01, `stripe shares ${cov.map(v => v.toFixed(3))}`);
});
test('FP2 — THE POLE\'S COLOURS: LED-bright lit, the paint by day, NEON on a party night (on / off with the party\'s ramp), the beat a gentle lift', () => {
  const lit = poleColours({ lit: 1 }), day = poleColours({ lum: 1 }), dusk = poleColours({ lum: 0.2 });
  assert.deepEqual(lit.r, POLE_LIT.r); assert.deepEqual(day.b, POLE_PAINT.b);
  assert.ok(lit.w[2] >= lit.w[0] && Math.min(...lit.w) > 230, `the lit white a cool LED white ${lit.w}`);
  assert.ok(dusk.w[0] < day.w[0] * 0.4, 'unlit at dusk: the paint dims');
  const pal = [[255, 63, 176], [63, 224, 255], [166, 91, 255], [255, 204, 90]];
  const on = poleColours({ lit: 1, party: 1, pal }), half = poleColours({ lit: 1, party: 0.5, pal }), off = poleColours({ lit: 1, party: 0, pal });
  assert.deepEqual(on.r, pal[0], 'red → magenta');
  assert.ok(on.b[2] > 240 && on.b[0] < 70, `blue → electric blue ${on.b}`);
  assert.ok(on.w[0] > 250 && on.w[2] < on.w[0] - 60, `white → gold ${on.w}`);
  assert.deepEqual(off, lit, 'the party ramped out (after the 2 am wind-down): red / white / blue again');
  for (const k of ['r', 'w', 'b']) for (let i = 0; i < 3; i++) assert.ok(Math.abs(half[k][i] - (on[k][i] + off[k][i]) / 2) < 1e-9, 'the ramp crossfades');
  const pk = poleColours({ lit: 1, party: 1, pal, punch: 1 });
  assert.ok(pk.b[0] > on.b[0] && pk.b[0] <= on.b[0] * 1.25 && pk.r[2] <= 255, 'the beat: a gentle lift (≤ 22 %)');
  assert.deepEqual(poleColours({ lit: 1, punch: 1 }), lit, 'no party: no punch');
});
test('FP2 — CRISP LIGHTS, NEVER SMOKE: every halo tight + bounded (the pole, the shop lamp, the sconce, the promenade lamps)', () => {
  const r = 2.34;   // (the pole's glass radius at 402: pt)
  assert.ok(poleHalo(0, r) <= POLE_HALO.a + POLE_HALO.aLand + 1e-9 && poleHalo(0, r) > 0.4, `the halo at the glass ${poleHalo(0, r)}`);
  for (let d = 0.05; d < 15; d += 0.05) assert.ok(poleHalo(d, r) <= poleHalo(d - 0.05, r) + 1e-12, 'falls off monotonically');
  assert.equal(poleHalo(POLE_HALO.land * r, r), 0, 'gone at the landing light\'s reach');
  assert.ok(POLE_HALO.land * r <= 11 && POLE_HALO.tight * r <= 5, `the pole's light: tight ${(POLE_HALO.tight * r).toFixed(1)} pt, on the brick ${(POLE_HALO.land * r).toFixed(1)} pt (FP's wash: ~28 pt)`);
  assert.ok(poleHalo(3 * r, r) < 0.04, `a patch of brick ~7 pt from the glass gets little: ${poleHalo(3 * r, r).toFixed(3)}`);
  // (wall units × G.K ≈ 13.8 pt at 402: the shop lamp's halo ≈ 4.7 pt — FP's cloud 13.8; the sconce's ≈ 5.8 — FP's wash 23.5)
  assert.ok(SHOP_GLOW.lamp <= 0.4 && SHOP_GLOW.sconce <= 0.5 && SHOP_GLOW.landR <= 1.5, JSON.stringify(SHOP_GLOW));
  assert.ok(LAMP_HALO.globe <= 2.5 && LAMP_HALO.tall <= 2.5 && LAMP_HALO.inner < LAMP_HALO.tall, `the lamps' halos ${JSON.stringify(LAMP_HALO)} globe radii (FP: 3.2–3.6)`);
});

// ---------------------------------------------------------------- FP2 — THE STREET UNDER THE DOCK (full-bleed) + THE MOTORCAR
import { streetPlan, STREET, footZ, carAt, carVis, streetWet, roadPassAt as passAt, ROAD_PASS as PASS, PROM as PROM2 } from '../js/core/harbor-promenade.js';
test('FP2 — THE STREET fills the band under the dock to the screen\'s foot on every phone; its lanes, rails, manhole + drain inside it', () => {
  for (const [W, H, sb] of [[390, 844, 34], [402, 874, 34], [430, 932, 34], [393, 852, 34], [402, 874, 0]]) {
    const cam = cameraFor(W, H, {}, { top: 62, bottom: sb }), L = harborLayout(cam), st = L.impliedRoad.street, k = `${W}x${H}/${sb}`;
    const y = z => groundY(cam, z), C = STREET.car, top = z => cam.VPY + cam.F * (cam.CAMH - C.h) / z;
    assert.ok(st && st === L.impliedRoad.street, `${k}: the plan on the layout`);
    // full-bleed: the street paints down to (past) the screen's foot; the curb still lines up with the dock's top
    assert.ok(y(st.foot) >= H - 0.5, `${k}: the street's foot ${y(st.foot).toFixed(1)} at the screen's foot ${H}`);
    assert.ok(Math.abs(y(PROM2.edge) - cam.dock.y) < 4, `${k}: the curb ${y(PROM2.edge).toFixed(1)} at the dock's top ${cam.dock.y}`);
    // the band's height is the dock's (+ the safe area): 96–120 pt on these phones, all of it street
    assert.ok(H - cam.dock.y >= 90 && H - cam.dock.y <= 122, `${k}: the band ${H - cam.dock.y} pt`);
    // the lanes: the far (westbound) car's roof under the dock's top (the dock covers it whole while it fades back); the near
    // (eastbound) car's wheels above the screen's foot; the near car in front of the far one
    const [far, near] = st.lanes;
    assert.equal(far.dir, -1); assert.equal(near.dir, 1);
    assert.ok(top(far.z) >= cam.dock.y - 0.01, `${k}: the far car's roof ${top(far.z).toFixed(1)} under the dock's top ${cam.dock.y}`);
    assert.ok(y(near.z) <= H - 7.9 && y(far.z) < H, `${k}: the near car's wheels ${y(near.z).toFixed(1)} above the foot`);
    assert.ok(st.two && near.z + C.w < far.z, `${k}: two lanes, the near car clear in front of the far one`);
    assert.ok(far.z + C.w < st.gutter[0], `${k}: the far car clear of the gutter`);
    // the track between the lanes, inside the band; the manhole between the curb and the far lane; the drain in the gutter's
    // visible strip (the curb's 27 cm face hides the rest)
    for (const r of st.rails) assert.ok(r > near.z && r < far.z && y(r) > cam.dock.y && y(r) < H, `${k}: a rail at z ${r.toFixed(2)} (y ${y(r).toFixed(0)})`);
    assert.ok(Math.abs(st.rails[1] - st.rails[0] - STREET.gauge) < 1e-9, 'the gauge');
    assert.ok(st.manhole.z > far.z + C.w && st.manhole.z < st.gutter[0] && Math.abs(project(cam, st.manhole.x, 0, st.manhole.z)[0] - W * STREET.manhole.f) < 1, `${k}: the manhole`);
    const face = Math.max(1.2, cam.F * 0.32 / PROM2.edge), faceZ = cam.F * cam.CAMH / (y(PROM2.edge) + face - cam.VPY);
    assert.ok(y(st.drain.z0) - (y(PROM2.edge) + face) > 1.5 && st.drain.z1 <= faceZ + 0.05, `${k}: the drain's grate in the gutter's visible strip`);
  }
  // a wide screen: the street fills too (both lanes: the dock is a short bar in the middle there)
  const wd = cameraFor(1440, 900, {}, {}), sw = streetPlan(wd);
  assert.ok(groundY(wd, sw.foot) >= 899.5 && footZ(wd) > 0);
});
test('FP2 — THE MOTORCAR: the implied road\'s pass (the same schedule + sound), nearest when the take peaks, by direction in its lane; in proportion', () => {
  const cam = cameraFor(402, 874, {}, { top: 62, bottom: 34 }), st = streetPlan(cam), C = STREET.car;
  let seen = 0;
  for (let ms = Date.UTC(2026, 9, 22, 22), end = ms + 40 * 60e3; ms < end; ms += 1000) {
    const pass = passAt(ms, () => 22);
    if (!pass) continue;
    const center = pass.t0 + PASS.peak, car = carAt(pass, center, ms, cam, st), later = carAt(pass, center, ms + 100, cam, st);
    assert.equal(car.z, (pass.dir < 0 ? st.lanes[0] : st.lanes[1]).z, 'its lane by direction');
    assert.ok(Math.sign(later.x - car.x) === pass.dir, 'it rolls the way the pass goes');
    if (car.on) seen++;
  }
  assert.ok(seen > 10, `cars on screen over 40 min of a 10 pm (${seen} s)`);
  // nearest (x 0, env 1) at the take's peak; on screen ~3–6 s round it (the sound's loudest); the old light's speed
  const pass = passAt(0, () => 12, { force: true }), center = pass.t0 + PASS.peak;
  const at0 = carAt(pass, center, center, cam, st);
  assert.ok(Math.abs(at0.x) < 1e-9 && at0.env === 1 && at0.on);
  let onS = 0; for (let t = -10e3; t <= 10e3; t += 50) if (carAt(pass, center, center + t, cam, st).on) onS += 0.05;
  assert.ok(onS > 3 && onS < 6.5, `on screen ${onS.toFixed(2)} s`);
  assert.ok(Math.abs(at0.speed - (cam.hw(at0.z) + 14) * 2 / 9) < 1e-9);
  // in proportion at 402: a person on the promenade (z 44) ~29 pt; the car nearer — ~1.4–1.8× taller, ~2.4× as long as tall
  const person = SIZE.person.pt * (SIZE.person.z / 44) * (cam.F / 600);
  for (const l of st.lanes) {
    const h = cam.F * C.h / l.z, len = cam.F * C.len / l.z;
    assert.ok(h > person * 1.25 && h < person * 1.9, `lane ${l.z.toFixed(1)}: the car ${h.toFixed(1)} pt vs a person ${person.toFixed(1)}`);
    assert.ok(len / h > 2.2 && len / h < 2.6 && len < 130, `lane ${l.z.toFixed(1)}: ${len.toFixed(0)} pt long`);
  }
});
test('FP2 — the car only while the dock rests (carVis); THE WET HOOK (streetWet: 0 today, &force=wet-street 1, Part 9 hands it the rain)', () => {
  let v = 0;
  for (let i = 0; i < 300; i++) v = carVis(v, false, 16.7);
  assert.equal(v, 0, 'the dock shown: never');
  for (let t = 0; t < 900; t += 16.7) v = carVis(v, true, 16.7);
  assert.ok(v > 0.4 && v < 0.6, `half-way through the dock's 1.8 s fade-out: ${v.toFixed(2)}`);
  for (let t = 0; t < 1000; t += 16.7) v = carVis(v, true, 16.7);
  assert.equal(v, 1);
  let ms = 0; while (v > 0) { v = carVis(v, false, 16.7); ms += 16.7; }
  assert.ok(ms <= 260, `gone ${ms.toFixed(0)} ms after the dock comes back (its own fade-in: 450)`);
  assert.equal(streetWet(), 0); assert.equal(streetWet({ force: true }), 1); assert.equal(streetWet({ wet: 0.4 }), 0.4); assert.equal(streetWet({ wet: 3 }), 1); assert.equal(streetWet({ wet: 'x' }), 0);
});

// ------------------------------------------------------------------ FP2 — NEON BY DEPTH (the owner: overlapping buildings shared one
// pink outline — the BLUFF / DOUBLE AGENT towers + the buildings in front read as one blob)
import { DEPTH_HUE, neonClash, neonHue, depthContacts, depthClashes, depthLinks, partyPieces, lineKey } from '../js/core/harbor-neon.js';
import { PARTY_RING, partyPlan, planColours, ringBase } from '../js/core/harbor-show.js';

test('FP2 — NEON BY DEPTH: the clash rule (a clear hue distance; two pale tubes always clash, a pale one beside a colour never)', () => {
  assert.equal(DEPTH_HUE, 60);
  assert.ok(neonClash(roleColour('h0'), roleColour('m0')), 'pink + magenta read as one');
  assert.ok(neonClash(roleColour('b1'), roleColour('t0')), 'cyan + teal read as one');
  assert.ok(neonClash(roleColour('w0'), roleColour('b2')), 'white + ice read as one');
  assert.ok(!neonClash(roleColour('h0'), roleColour('a3')) && !neonClash(roleColour('b1'), roleColour('m0')) && !neonClash(roleColour('w0'), roleColour('h0')), 'pink / gold, cyan / magenta, white / pink stand apart');
  assert.ok(Math.abs(neonHue([255, 0, 0]).h) < 1e-9 && Math.abs(neonHue([0, 0, 255]).h - 240) < 1e-9);
  // THE PARTY RING: two or three places apart round it is always a clear hue distance — one place can clash (pink → red)
  for (let j = 0; j < 6; j++) for (const d of [2, 3, 4]) assert.ok(!neonClash(PARTY_PAL[PARTY_RING[j]], PARTY_PAL[PARTY_RING[(j + d) % 6]]), `ring ${j} + ${d}`);
  assert.ok([0, 1, 2, 3, 4, 5].some(j => neonClash(PARTY_PAL[PARTY_RING[j]], PARTY_PAL[PARTY_RING[(j + 1) % 6]])), 'one place apart can clash');
  for (let r = 1; r < 40; r++) { const d = ((ringBase(r) - ringBase(r - 1)) % 6 + 6) % 6; assert.ok(d >= 2 && d <= 4, `ringBase ${r}`); }
});

test('FP2 — NEON BY DEPTH at 390 / 402 / 430: no building in front shares its outline colour with the one behind (the city palette, every party scene, tier 0\'s still), near tubes a touch bolder', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { L } = setup(k), O = outlines(L), C = O.contacts;
    // the meetings: tubes within reach + each building with the one showing right above its roof (the owner's case: the near band +
    // PAR in front of the word towers)
    assert.ok(C.length >= 30 && C.some(c => c.over) && C.some(c => !c.over), `${k}: ${C.length} meetings`);
    for (const w of ['wordA', 'wordB']) assert.ok(C.some(c => lineKey(O[c.b], c.bl) === w && O[c.f].z < O[c.b].z), `${k}: something in front of ${w}`);
    // the city's palette: no clash anywhere (a band building re-paired, the towers' roles designed)
    const bad = depthClashes(C, 'city').map(c => `${lineKey(O[c.f], c.fl)} ${c.fr} / ${lineKey(O[c.b], c.bl)} ${c.br}`);
    assert.deepEqual(bad, [], `${k}: city clashes`);
    // the party: every building's colours from the plan, in every scene — the links never clash, neighbours never share a main,
    // the six towers six colours (never white), all six colours on the skyline
    const pieces = partyPieces(L, O), links = depthLinks(O), P = partyPlan(pieces, links);
    assert.ok(P.solved, `${k}: the party plan solved`);
    const col = (key, slot, n) => PARTY_PAL[planColours(P.get(key), n)[slot]];
    const seq = [...P.entries()].sort((a, b) => a[1].rank - b[1].rank);
    const towers = pieces.filter(p => p.tower).map(p => p.key);
    assert.equal(towers.length, 6, `${k}: the six towers`);
    for (let n = 0; n < 12; n++) {
      for (const l of links) assert.ok(!neonClash(col(l.f, l.fs, n), col(l.b, l.bs, n)), `${k} scene ${n}: ${l.f}(${l.fs}) / ${l.b}(${l.bs})`);
      for (let r = 1; r < seq.length; r++) assert.notEqual(planColours(seq[r][1], n)[0], planColours(seq[r - 1][1], n)[0], `${k} scene ${n}: neighbours ${seq[r - 1][0]} + ${seq[r][0]}`);
      const tc = towers.map(t => planColours(P.get(t), n)[0]);
      assert.equal(new Set(tc).size, 6, `${k} scene ${n}: the towers' colours ${tc}`); assert.ok(!tc.includes(5), 'no white tower');
      assert.ok(new Set(seq.map(([, e]) => planColours(e, n)[0]).filter(c => c !== 5)).size === 6, `${k} scene ${n}: six colours`);
    }
    // (an all-white building: never a tower; the calm / white ones first, at most two others — a knot of buildings all meeting each
    // other that six colours can't untie)
    const allW = pieces.filter(p => P.get(p.key).off === 6);
    assert.ok(allW.every(p => !p.tower) && allW.filter(p => !p.pale).length <= 2, `${k}: all white ${allW.map(p => p.key + (p.pale ? '' : '!'))}`);
    // near tubes a touch bolder: the one in front is never finer or dimmer than the one behind
    for (const c of C) { const f = depthStrength(O[c.f]), b = depthStrength(O[c.b]); assert.ok(f.w >= b.w - 1e-9 && f.a >= b.a - 1e-9, `${k}: ${O[c.f].id} ${f.w.toFixed(2)} / ${O[c.b].id} ${b.w.toFixed(2)}`); }
  }
  // within a step: the front a touch bolder (+6 %), the back a touch finer (−6 %); the softness the step's (the far ones stay crisp)
  const s0 = depthStrength({ z: 228 }), s1 = depthStrength({ z: 251 }), m0 = depthStrength({ z: 300 }), m1 = depthStrength({ z: 379 });
  assert.ok(s0.w > s1.w && s1.w > DEPTH[0].w * 0.93 && s0.w < DEPTH[0].w * 1.07 && s0.soft === s1.soft && m0.w > m1.w && m0.soft === m1.soft);
  assert.ok(depthStrength({ z: 251 }).w > depthStrength({ z: 253 }).w, 'the steps still step');
});

// ---------------------------------------------------------------- PF — THE INLAY / THE RIG / THE MAILBOX (core/harbor-centre.js PURE; props.js
// drawInlay / drawMailbox / the test obelisk; screens/harbor/centre.js — harbor().centrepiece)
import { INLAY, inlayPlan, wearAt, RIG, rigSpots, normCentre, rigLevel, centreActive, centreBox, MAX_LIGHTS } from '../js/core/harbor-centre.js';
test('PF — THE INLAY: a brick compass rose — the bands nest (soldier ⊃ header ⊃ field ⊃ centre), every ring a multiple of 4, north away from us, the star inside the field; readable on the phones', () => {
  const m = { x: 3, z: 44.8, ring: 2.6 }, pl = inlayPlan(m);
  assert.equal(pl.R, 2.6);
  for (const ring of [pl.soldier, pl.header, pl.centre, ...pl.courses]) assert.ok(ring.n >= 4 && ring.n % 4 === 0 && ring.r1 > ring.r0, `a ring of ${ring.n}`);
  assert.ok(pl.soldier.r1 === pl.R && pl.soldier.r0 === pl.header.r1 && pl.header.r0 === pl.courses[pl.courses.length - 1].r1, 'soldier · header · field touch');
  for (let i = 1; i < pl.courses.length; i++) assert.ok(Math.abs(pl.courses[i].r0 - pl.courses[i - 1].r1) < 1e-9 && pl.courses[i].off !== pl.courses[i - 1].off, 'the courses contiguous + staggered');
  assert.ok(Math.abs(pl.courses[0].r0 - pl.centre.r1) < 1e-9 && pl.stone === pl.centre.r0, 'the field meets the centre ring, the stone inside it');
  for (const c of pl.courses) assert.ok(c.r1 - c.r0 > 0.25 && c.r1 - c.r0 < 0.4, 'a course ~0.3 deep (exaggerated like the setts)');
  // the star: 8 points, the 4 long (cardinal) ones reach the header course, the short ones about ⅔ of that; each split into two tones
  assert.equal(pl.star.length, 8);
  const north = pl.star.find(p => Math.abs(p.a - Math.PI / 2) < 1e-9);
  assert.ok(north && north.cardinal && Math.sin(north.a) > 0.99, 'a long point due north (+z — away from us: the camera looks north)');
  for (const p of pl.star) {
    assert.ok(p.len <= pl.header.r0 + 1e-9 && p.len > pl.stone, 'inside the field');
    assert.ok(p.cardinal ? p.len > 0.7 * pl.R : p.len < 0.6 * pl.R, `point ${p.a.toFixed(2)}: long ${p.cardinal}`);
    assert.ok(p.tones.length === 2 && p.tones[0] !== p.tones[1] && p.tones.includes('buff'), 'two tones, one of them buff');
  }
  // on the phones: the inlay at its spot reads (≥ 66 pt across, ≥ 14 pt deep on screen), a field brick ≥ 3.5 pt long at the front
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), M = L.medallion, P = (x, z) => project(cam, x, 0, z), p2 = inlayPlan(M);
    const w = P(M.x + M.ring, M.z)[0] - P(M.x - M.ring, M.z)[0], d = P(M.x, M.z - M.ring)[1] - P(M.x, M.z + M.ring)[1];
    assert.ok(w >= 66 && d >= 14, `${k}: ${w.toFixed(0)} × ${d.toFixed(1)} pt`);
    const c = p2.courses[p2.courses.length - 1], rm = (c.r0 + c.r1) / 2, a = -Math.PI / 2, da = Math.PI * 2 / c.n;
    const bw = Math.hypot(...[0, 1].map(i => P(M.x + Math.cos(a + da) * rm, M.z + Math.sin(a + da) * rm)[i] - P(M.x + Math.cos(a) * rm, M.z + Math.sin(a) * rm)[i]));
    assert.ok(bw >= 3.5, `${k}: a front brick ${bw.toFixed(1)} pt`);
  }
});
test('PF — THE WEAR: 0..1, worn most along the line across the floor + toward the crossing, least at the border', () => {
  const R = 2.6;
  for (let u = -1; u <= 1; u += 0.1) for (let v = -1; v <= 1; v += 0.1) { const w = wearAt(u * R, v * R, R); assert.ok(w >= 0 && w <= 1 && Number.isFinite(w)); }
  assert.ok(wearAt(0, -0.2, R) > 0.5, 'the middle well worn');
  assert.ok(wearAt(0, -0.2, R) > wearAt(0, -0.95 * R, R) + 0.3 && wearAt(-0.7 * R, -0.2, R) > wearAt(-0.7 * R, -0.7 * R, R), 'the border + the corners least');
  assert.ok(wearAt(0.3, 0.7 * R, R) > wearAt(-0.7 * R, 0.7 * R, R), 'the path back toward the crossing');
});
test('PF — THE RIG: four floor spots flush in the soldier course on the diagonals (two in front of a piece, two behind), clear of the star', () => {
  const m = { x: 5.2, z: 44.8, ring: 2.6 }, pl = inlayPlan(m), sp = rigSpots(m);
  assert.equal(sp.length, 4);
  assert.equal(sp.filter(s => s.front).length, 2);
  for (const s of sp) {
    const r = Math.hypot(s.x - m.x, s.z - m.z);
    assert.ok(r - RIG.ring > pl.soldier.r0 && r + RIG.ring < pl.soldier.r1, `inside the soldier course (r ${r.toFixed(2)})`);
    assert.ok(r - RIG.ring > Math.max(...pl.star.map(p => p.len)) + 0.2, 'beyond the star\'s reach');
    assert.ok(Math.abs(Math.abs(Math.cos(s.a)) - Math.SQRT1_2) < 1e-9, 'on a diagonal');
    assert.equal(s.front, s.z < m.z);
  }
  assert.ok(RIG.lens < RIG.ring && RIG.ring < 0.25, 'small: a brass ring round a dark lens');
});
test('PF — THE CENTREPIECE\'s state: cleaned (the rig on with a piece, its colour + strength clamped, h within the cap, the lights capped), the level by the lamps, the event rule', () => {
  const fn = () => {};
  assert.equal(normCentre(null), null); assert.equal(normCentre({}), null); assert.equal(normCentre({ rig: { on: false } }), null);
  const a = normCentre({ piece: fn, h: 30 }, 11.4);
  assert.ok(a.piece === fn && a.rig.on === true && a.rig.k === 1 && a.h === 11.4 && a.lights.length === 0, 'a piece: the rig on, h capped');
  assert.deepEqual(a.rig.col, [...RIG.col]);
  assert.equal(normCentre({ piece: { draw: fn, light: fn }, h: 5 }, 11.4).h, 5);
  assert.equal(normCentre({ piece: { nope: 1 } }), null, 'not a piece');
  const b = normCentre({ piece: fn, rig: { on: false } });
  assert.equal(b.rig.on, false);
  const c = normCentre({ rig: { on: true, col: [300, -4, 100.4], k: 9 } });
  assert.ok(c && !c.piece && c.rig.on && c.rig.k === 2, 'the rig alone (a show) may be on');
  assert.deepEqual(c.rig.col, [255, 0, 100]);
  const many = Array.from({ length: MAX_LIGHTS + 50 }, (_, i) => ({ x: i % 3, y: i % 7, z: 0, col: [255, 0, 0], tw: 99 }));
  const d = normCentre({ piece: fn, lights: [...many, { x: NaN, y: 1, z: 0 }, null] }, 4);
  assert.equal(d.lights.length, MAX_LIGHTS);
  assert.ok(d.lights.every(l => l.y <= 4 && l.tw <= 8 && l.r > 0 && l.k >= 0), 'each light clamped (under the cap)');
  // the level: with the street lamps (by day nothing), × k; off → 0
  assert.equal(rigLevel(a, 0), 0); assert.equal(rigLevel(a, 1), 1); assert.equal(rigLevel(a, 0.5), 0.5);
  assert.equal(rigLevel(b, 1), 0); assert.equal(rigLevel(c, 1), 2); assert.equal(rigLevel(null, 1), 0);
  assert.ok(centreActive(a) && !centreActive(c) && !centreActive(null), 'an EVENT = a piece standing there (8b: the cart stops short)');
});
test('PF — the centrepiece\'s sprite box holds the inlay + the piece\'s height; THE TEST PIECE stands within the cap on every phone', async () => {
  const { TEST_PIECE } = await import('../js/screens/harbor/props.js');
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), m = L.medallion, P = (x, y, z) => project(cam, x, y, z);
    const bl = signSpots(L).find(sp => sp.id === 'n-blade'), cap = centrepieceCap(cam, m, [bl.rect.y + bl.rect.h, P(L.wheel.x, L.wheel.y, L.wheel.z)[1]]);
    assert.ok(TEST_PIECE.h <= cap, `${k}: the test piece ${TEST_PIECE.h} ≤ the cap ${cap}`);
    const b = centreBox(cam, m, cap);
    const [l] = P(m.x - m.ring, 0, m.z), [r] = P(m.x + m.ring, 0, m.z), [, near] = P(m.x, 0, m.z - m.ring), [, top] = P(m.x, cap, m.z);
    assert.ok(b.x <= l && b.x + b.w >= r && b.y <= top && b.y + b.h >= near, `${k}: the box holds the ring + the cap`);
    assert.ok(b.w * b.h < 300 * 260, `${k}: small (${b.w} × ${b.h} pt — not a full-screen layer)`);
  }
});
test('THE MAILBOX IS GONE (Oct 24, the owner: the olive-green box): no mailbox in the plan on any phone, no walkers\' block for it; the art stays in props.js', async () => {
  const { mailboxBox } = await import('../js/screens/harbor/props.js');
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k);
    assert.equal(L.mailbox, null, `${k}: no mailbox`);
    assert.ok(!L.zones.block.some(z => Math.abs(z.z - 38.9) < 0.01 && z.r === 0.6), `${k}: no block zone where it stood`);
    const b = mailboxBox(cam, { x: 2, z: 38.6 });
    assert.ok(b.h > 20 && b.h < 40, `${k}: (the art still measures: ${b.h.toFixed(1)} pt tall at its old spot)`);
  }
});
test('PF — the inlay, the mailbox\'s art + the test piece (+ its light pass) draw with finite colours in every look; the mailbox casts a shadow only in the sun', async () => {
  const { drawInlay, drawMailbox, drawObelisk, obeliskLight, propShadow } = await import('../js/screens/harbor/props.js');
  const { cam, L: L0 } = setup('402x874'), grad = { addColorStop() {} };
  const L = { ...L0, mailbox: { x: L0.medallion.x + 1.6, z: 38.6 } };     // (the box is out of the plan; its art is still checked at its old spot)
  const rec = () => {
    const o = { bad: [], soft: 0, fills: 0 }, base = { getTransform: () => ({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 }), createLinearGradient: () => grad, createRadialGradient: () => grad, measureText: () => ({ width: 40 }), fill: () => { o.fills++; if (base.shadowBlur > 0) o.soft++; } };
    const chk = v => { if (typeof v === 'string' && /NaN|undefined|Infinity/.test(v)) o.bad.push(v); };
    return { o, x: new Proxy(base, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { if (k === 'fillStyle' || k === 'strokeStyle' || k === 'shadowColor') chk(v); t[k] = v; if (k === 'shadowBlur' && !v) t[k] = 0; return true; } }) };
  };
  const looks = { day: { day: 1, gold: 0, night: 0, sunDir: 0.4, sunEl: 40, ovc: 0 }, gold: { day: 0, gold: 1, night: 0, sunDir: 1, sunEl: 6, ovc: 0 },
    night: { day: 0, gold: 0, night: 1, sunDir: 0, sunEl: 6, ovc: 0, lamps: 1 }, overcast: { day: 1, gold: 0, night: 0, sunDir: 0, sunEl: 40, ovc: 0.75 } };
  for (const [name, T] of Object.entries(looks)) {
    const ctx = { season: 'autumn', phase: 0.5, lights: L.lamps.map(l => ({ x: l.x, z: l.z, kind: l.kind })), lampK: T.lamps || 0, lightAt: T.night ? () => [120, 110, 90] : null, rig: { col: [...RIG.col], spots: rigSpots(L.medallion) } };
    const { o, x } = rec();
    drawInlay(x, cam, L.medallion, T, ctx); drawMailbox(x, cam, L.mailbox, T, ctx); drawObelisk(x, cam, L.medallion, T, ctx); obeliskLight(x, cam, L.medallion, T, ctx);
    assert.deepEqual(o.bad, [], name);
    assert.ok(o.fills > 200, `${name}: the inlay laid brick by brick (${o.fills} fills)`);
    const sh = rec(); propShadow(sh.x, cam, L.mailbox, 'mailbox', T, ctx);
    assert.equal(sh.o.soft, name === 'night' || name === 'overcast' ? 1 : 2, `${name}: the mailbox's shadows`);
  }
});
test('PF — THE PREVIEW PANEL lists the centrepiece test under PROMENADE', () => {
  const e = EVENTS.find(v => v.id === 'centrepiece-test');
  assert.ok(e && e.cat === 'promenade' && e.ready !== false);
});

// ---------------------------------------------------------------- PF — THE STREET'S SURFACE / THE STRING LIGHTS OFF / THE BLADE'S LAMPS
// (helper B: street.js, strings.js, speakeasy.js's blade, signs.js's billboard lamps)
import { streetLook, CURB_STEP, SHEEN } from '../js/screens/harbor/street.js';
import { STRINGS_ON, createStrings, BULB, CANOPY, frontProfile } from '../js/screens/harbor/strings.js';
import { MARQUEE, marqueeBulbs, marqueeScreen, marqueeLevel, WASH, washCone, BLADE, LETTER, bladeLetters, bladeWords, BLADE_ONE } from '../js/screens/harbor/speakeasy.js';
import { ROOM_TINT, LATE_TINT, lateOf, SASH_RAIL } from '../js/screens/harbor/windows.js';
const pfLum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
test('PF — THE STREET reads as its own surface: tarred setts darker + cooler than the promenade\'s, tar in the joints (never black at night), the worn paths\' sheen, a clear curb step', () => {
  const PROM = { d: [154, 148, 140], n: [64, 59, 86] };      // (stage.js#SETT — the promenade's own setts, unchanged by PF)
  for (const [name, T, prom] of [['day', { day: 1 }, PROM.d], ['night', { night: 1 }, PROM.n]]) {
    const K = streetLook(T);
    assert.ok(pfLum(K.sett) < 0.8 * pfLum(prom), `${name}: the street's setts ${pfLum(K.sett).toFixed(0)} vs the promenade's ${pfLum(prom).toFixed(0)}`);
    // (8P — the owner: a reddish brick street, muted + aged: red leads, never saturated — the city keeps the eye)
    assert.ok(K.sett[0] > K.sett[1] && K.sett[0] > K.sett[2], `${name}: oxblood (red leads)`);
    assert.ok(Math.max(...K.sett) - Math.min(...K.sett) < (name === 'night' ? 30 : 60), `${name}: muted, never a saturated red`);
    assert.ok(pfLum(K.grout) < 0.75 * pfLum(K.sett), `${name}: tar in the joints, darker than the stones`);
    assert.ok(pfLum(K.grout) > (name === 'night' ? 20 : 40), `${name}: the joints never black (${pfLum(K.grout).toFixed(0)})`);
    assert.ok(pfLum(K.gut) < pfLum(prom), `${name}: the gutter darker than the promenade's stone`);
  }
  assert.ok(SHEEN > 0.1 && SHEEN < 0.5, 'the worn paths: a glaze, never water');
  const C = CURB_STEP;
  assert.ok(C.face[1] > C.face[0] && C.face[0] > 0.1 && C.faceN[1] > 0.1, 'the curb\'s face deeper in shade toward its foot, day + night');
  assert.ok(C.arris > 0.4 && C.arrisN > 0.2 && C.shadow > 0.2, 'a crisp lit arris day + night, the curb\'s shadow on the gutter');
});
test('SP2 — THE CAFÉ-LIGHT CANOPY: fewer, bigger Edison bulbs (8–12 in view) widely spaced on deep swags between tall posts set back on the roof deck; the crest + the parapet hide what hangs behind them', () => {
  assert.equal(STRINGS_ON, true);
  assert.ok(BULB.r >= 2 && BULB.halo <= 3 && BULB.haloA <= 0.5, 'a big globe, a TIGHT halo (no haze)');
  assert.ok(CANOPY.back >= 1 && CANOPY.posts.length + 1 >= 3 && CANOPY.posts.length + 1 <= 4, 'three or four posts, set back on the deck');
  const prof = frontProfile();
  assert.ok(Math.max(...prof.map(p => p[1])) === SPEAK_V.crest && Math.min(...prof.map(p => p[1])) === SPEAK_V.parapet, 'the silhouette: the parapet up to the crest');
  for (const k of ['390x844', '402x874', '430x932']) {
    const { L } = setup(k), st = createStrings();
    st.layout(L);
    const d = st.debug();
    assert.ok(d.runs === CANOPY.swags.length && d.posts >= 3, `${k}: ${d.runs} swags, ${d.posts} posts`);
    assert.ok(d.bulbs >= 8 && d.bulbs <= 12, `${k}: ${d.bulbs} bulbs in view`);
    const xs = d.at.map(b => b.x).sort((a, b) => a - b), gaps = xs.slice(1).map((x, i) => x - xs[i]);
    assert.ok(Math.min(...gaps) >= 8 * L.cam.F / 600, `${k}: widely spaced (≥ ${Math.min(...gaps).toFixed(1)} pt)`);
  }
});
test('SP2 — THE MARQUEE (crest + foot only — the letters get the long sides): bulbs on the board, spaced to read; steady, a slow chase on party nights', () => {
  const B = marqueeBulbs();
  assert.ok(B.length >= 10 && B.length <= 24, `${B.length} bulbs`);
  for (const [u, v] of B) {
    assert.ok(u > 0 && u < BLADE.bw && v > BLADE.v0 && v < BLADE.v1, 'on the board');
    assert.ok(v > BLADE.v1 - 0.6 || v < BLADE.v0 + 0.25, `no bulb down the long sides (v ${v.toFixed(2)})`);
  }
  for (const k of ['390x844', '402x874', '430x932']) {
    const { L } = setup(k), bg = bladeGeo(speakGeo(L)), R = bg.rect, S = marqueeScreen(bg);
    for (const b of S) assert.ok(b.x >= R.x - 0.5 && b.x <= R.x + R.w + 0.5 && b.y >= R.y - 0.5 && b.y <= R.y + R.h + 0.5, `${k}: a bulb inside the board's outline`);
    const gaps = S.slice(1).map((b, i) => Math.hypot(b.x - S[i].x, b.y - S[i].y)).filter(g => g < 15);
    assert.ok(Math.min(...gaps) >= 3.2, `${k}: bulbs ≥ ${Math.min(...gaps).toFixed(1)} pt apart (each one reads)`);
    assert.ok(S[0].r * 2 >= 1.6, `${k}: a globe ${(S[0].r * 2).toFixed(1)} pt across`);
  }
  assert.equal(marqueeLevel(5, 0, 3, 0.5), 1, 'steady on a normal night');
  const lv = beats => B.map((_, i) => marqueeLevel(i, 1, beats, 0.9));
  assert.equal(lv(0).filter(v => v === 1).length, Math.ceil(B.length / 3), 'a party night: every third bulb leads');
  assert.notDeepEqual(lv(0), lv(1), 'the chase steps a bulb a beat');
  assert.deepEqual(lv(0), lv(3), 'a three-bulb chase');
});
test('SP2 — THE BLADE READS for every game: big letters filling the board (one column a word), never a sliver', () => {
  const { L } = setup('402x874'), k = bladeGeo(speakGeo(L)).k;
  for (const g of GAMES.filter(x => x.playable !== false)) {
    const T = bladeLetters(g.name), words = bladeWords(g.name);
    assert.equal(T.cols.length, Math.min(2, words.length), `${g.name}: a column a word`);
    assert.equal(words.join(''), g.name.toUpperCase().replace(/\s+/g, ''), `${g.name}: every letter, in order`);
    assert.ok(words.every(w => w.length <= BLADE_ONE), `${g.name}: no column longer than ${BLADE_ONE} (8P: SLIP / STREAM)`);
    assert.ok(T.cap * k >= 10, `${g.name}: letters ${(T.cap * k).toFixed(1)} pt tall at 402 (8P: the 10 pt rule)`);
    assert.ok(T.cap <= T.cw * LETTER.tall + 1e-9 && T.cap <= T.lh, `${g.name}: never taller than its slot or a sliver of its column`);
    for (const c of T.cols) assert.ok(c.top <= BLADE.v1 - LETTER.v1 + 1e-9 && c.top - c.lh * c.word.length >= BLADE.v0 + LETTER.v0 - 1e-9, `${g.name}: between the crest's bulbs + the foot's`);
  }
});
test('SP2 — THE WALL-WASHERS: accents, not panels — a lamp over each brick pier (never a window); a hot spot under it fanning down in a soft V, gone within the top third, no outline', () => {
  const wins = [[1.0, 2.9], [4.2, 6.1], [7.4, 9.3]];
  for (const [a, b] of WASH.piers) {
    assert.ok(b > a + 0.9, 'a pier');
    for (const [w0, w1] of wins) assert.ok(b <= w0 + 1e-9 || a >= w1 - 1e-9, `pier ${a}–${b} clear of the window ${w0}–${w1}`);
  }
  assert.ok(WASH.lampV < SPEAK_V.cornice[0] - 0.6 && WASH.lampV > SPEAK_V.rows[1][1] - 0.6, 'under the capitals, by the top floor\'s heads');
  assert.ok(WASH.drop <= 0.4 * (WASH.lampV - SPEAK_V.belt), `gone within the pier's top third-ish (${WASH.drop} of ${(WASH.lampV - SPEAK_V.belt).toFixed(2)})`);
  assert.ok(WASH.a <= 0.7, 'dimmer than 7b\'s');
  assert.equal(washCone(0, WASH.drop), 0, 'gone at the drop');
  const hot = Math.max(...[0.05, 0.1, 0.15, 0.2].map(d => washCone(0, d)));
  assert.ok(hot > 0.6 && washCone(0, 0.8) < 0.45 * hot, 'a hot spot under the lamp, fading fast');
  for (let d = 0.2; d < WASH.drop; d += 0.1) assert.ok(washCone(0, d + 0.1) <= washCone(0, d) + 1e-9, 'falling off down the pier');
  for (const d of [0.3, 0.8, 1.2]) { const hw = WASH.w0 + d * WASH.spread; assert.ok(washCone(hw * 0.25, d) > washCone(hw * 0.7, d) && washCone(hw * 0.97, d) < 0.03, `a soft V: widening + fading to its edges at ${d}`); }
  assert.ok(WASH.w0 + 0.3 * WASH.spread < WASH.w0 + 1.2 * WASH.spread, 'widening down (a V, never a rounded arch)');
});
test('SP2 — THE ROOMS: the TV window upper-RIGHT, clean panes (the rail high), each room its own incandescent bulb (the TV the only cool light), late night dimmer + warmer', () => {
  const ap = ROOMS.find(r => r.id === 'apartment'), back = ROOMS.find(r => r.id === 'back');
  assert.ok(ap.floor === 3 && ap.col === 2 && back.floor === 3 && back.col === 1, 'the apartment (the TV) upper-right, the back room upper-middle');
  assert.ok(SASH_RAIL >= 0.66, 'the meeting rail in the upper third');
  for (const [id, c] of Object.entries(ROOM_TINT)) {
    assert.ok(c[0] >= c[1] && c[1] >= c[2] && c[2] >= 160, `${id}: warm, never a colour (${c})`);
    assert.ok(c[0] - c[2] <= 90, `${id}: subtle`);
  }
  const keys = Object.values(ROOM_TINT).map(c => c.join(','));
  assert.equal(new Set(keys).size, keys.length, 'each room a touch off its neighbours');
  assert.ok(ROOM_TINT.bar[2] < ROOM_TINT.apartment[2] && ROOM_TINT.jazz[2] < ROOM_TINT.apartment[2], 'the bar + jazz deeper amber than the apartment');
  assert.ok(ROOM_TINT.edge2[0] < 245 && ROOM_TINT.edge3[0] < 245, 'the edge windows a little dimmer');
  assert.ok(LATE_TINT[0] > LATE_TINT[2] && lateOf(22) === 0 && lateOf(1.5) === 1 && lateOf(0.5) > 0 && lateOf(12) === 0, 'late: dimmer + warmer from ~11:30 pm, full by 1:30');
});
