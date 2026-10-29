// CITY 2.0 — THE LIGHT ON THE PROMENADE (core/harbor-light.js, FP3a / FREV A1 H2): one home for the lamps' light + the sun's shadow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { cornerLamp, CORNER_LAMP, lightSources, lightField, sunShadow, lampOn, treeLamps, roadLampAt, pieceCtx, REACH, FACE, impliedAt, lampShadow, castShadow } from '../js/core/harbor-light.js';
import { project } from '../js/core/harbor-layout.js';

const setup = (W = 402, H = 874) => { const cam = cameraFor(W, H, {}, { top: 59, bottom: 34 }); return harborLayout(cam, 'gr'); };

test('FP3a — THE LIGHT: the pools only at night, brightest at a lamp\'s heart; every lamp + the speakeasy\'s spill a source', () => {
  const L = setup();
  assert.equal(lightField(L, { lamps: 0 }), null, 'by day: no pools');
  const at = lightField(L, { lamps: 1 }), src = lightSources(L);
  assert.ok(src.length >= L.lamps.length + 2 && src.some(s => s.kind === 'spill'), 'the lamps + the spill');
  // (PROM: no lampposts — the IMPLIED LAMPS below the screen: a pool on the street under the dock right in front of each, brightest at
  // the FRONT CURB of the promenade, falling off toward the railing; the street's pools distinct (dim between two lamps))
  const lamp = src.find(s => s.implied), lum = c => (c ? c[0] + c[1] + c[2] : 0);
  assert.ok(lamp && L.lamps.every(l => l.implied) && !L.lamps.some(l => l.kind === 'tall' || l.kind === 'globe'), 'no lampposts: every lamp implied');
  const yz = z => project(L.cam, 0, 0, z)[1];
  assert.ok(yz(lamp.z) > L.cam.H, `the implied lamps stand below the screen's foot (${yz(lamp.z).toFixed(0)} > ${L.cam.H})`);
  const street = at(lamp.x, lamp.z + 6), between = at(lamp.x + 4.5, lamp.z + 6), front = at(lamp.x, 37.4), mid = at(lamp.x, 44), back = at(lamp.x, 51.5);
  assert.ok(lum(street) > lum(between) * 2, `distinct pools on the street (${lum(street).toFixed(0)} vs ${lum(between).toFixed(0)} between)`);
  assert.ok(lum(front) > lum(mid) * 1.6 && lum(mid) > lum(back) * 1.3 && lum(back) > 0, `brightest at the front curb, falling off toward the railing (${lum(front).toFixed(0)} › ${lum(mid).toFixed(0)} › ${lum(back).toFixed(0)})`);
  assert.equal(impliedAt(lamp, lamp.x, lamp.z - 1), 0, 'nothing behind the lamp');
});
test('PROM — THE SHADOWS CLIMB UP THE SCREEN at night (away from the implied lamps behind the viewer); the sun\'s by day', () => {
  const L = setup(), b = L.cabStand, sh = lampShadow(L.lamps, 2, b.x, b.z, 1);
  assert.ok(sh && sh.dz > 0 && sh.dz > Math.abs(sh.dx), `away from us, up the screen (dz ${sh && sh.dz.toFixed(2)}, dx ${sh && sh.dx.toFixed(2)})`);
  assert.ok(project(L.cam, b.x + sh.dx, 0, b.z + sh.dz)[1] < project(L.cam, b.x, 0, b.z)[1], 'its tip higher on the screen than its foot');
  assert.equal(lampShadow(L.lamps, 2, b.x, b.z, 0), null, 'the lamps off: none');
  assert.equal(castShadow({ night: 1, lamps: 0 }, 2, b.x, b.z, L.lamps), null, 'night, lamps off: none');
  assert.ok(castShadow({ night: 1, lamps: 1 }, 2, b.x, b.z, L.lamps).dz > 0, 'night, lamps on: the lamps\' shadow');
  const day = castShadow({ day: 1, sunEl: 30, sunDir: 0.5, lamps: 0 }, 2, b.x, b.z, L.lamps);
  assert.deepEqual(day, sunShadow({ day: 1, sunEl: 30, sunDir: 0.5, lamps: 0 }, 2), 'by day the sun\'s');
});

test('FP3a — THE LIGHT: a face takes the NEAREST lamp (its colour, reach, direction); none at night far away; the trees + the road read the same lamps', () => {
  const L = setup(), ctx = pieceCtx(L), b = L.cabStand;
  // (PROM: the cab stand's face toward us takes the nearest IMPLIED lamp — warm, from the front + above)
  const near = lampOn(ctx.lights, b.x, b.z, 1);
  // (C4b: + its OWN lamp off-screen right — the colour the implied lamps' warm white blended toward it, the light from the RIGHT + above)
  assert.ok(near.lcol.every((v, i) => v <= Math.max(FACE.col.implied[i], FACE.col.hidden[i]) + 1e-9 && v >= Math.min(FACE.col.implied[i], FACE.col.hidden[i]) - 1e-9), 'warm: the implied lamps + the cab lamp');
  assert.ok(near.lk > 0.5 && near.ld[1] > 0 && near.ld[0] > 0.1, `lit from the right + above (${near.lk.toFixed(2)}, ${near.ld.map(v => v.toFixed(2))})`);
  assert.equal(lampOn(ctx.lights, b.x + 400, b.z, 1).lk, 0, 'out of reach: no lamp light');
  assert.equal(lampOn([], 0, 0, 1).lk, 0);
  const t = L.trees[0], tl = treeLamps(ctx, t);
  for (const l of tl) assert.ok(Math.abs(l.x) <= 12 && l.k > 0, 'a tree sees only its neighbours');
  assert.ok(tl.some(l => l.w > 5), 'the implied lamps light a crown from the front (toward us)');
  const front = L.lamps.find(l => l.z <= 40);
  if (front) assert.ok(roadLampAt(L.lamps, front.x) > 0.9 && roadLampAt(L.lamps, front.x + 400) === 0, 'the car under a front lamp');
});

test('FP3a — THE SUN\'S SHADOW: away from the sun, longer when it\'s low, none at night or under a deck', () => {
  assert.equal(sunShadow({ night: 1 }, 2), null);
  assert.equal(sunShadow({ day: 1, ovc: 1 }, 2), null);
  const lo = sunShadow({ day: 1, sunEl: 8, sunDir: 1 }, 2), hi = sunShadow({ day: 1, sunEl: 50, sunDir: 1 }, 2);
  assert.ok(lo.dx < 0 && Math.hypot(lo.dx, lo.dz) > Math.hypot(hi.dx, hi.dz), 'a low sun on the right throws a longer shadow left');
});

test('FP3a — the stage ↔ props import cycle is broken (both read core/harbor-light.js)', () => {
  const src = f => readFileSync(new URL(`../js/screens/harbor/${f}`, import.meta.url), 'utf8');
  assert.ok(!/from '\.\/stage\.js'/.test(src('props.js')), 'props.js no longer imports stage.js');
  for (const f of ['motorcar.js', 'centre.js', 'people.js']) assert.ok(!/from '\.\/stage\.js'/.test(src(f)), `${f} reads the pure light module, not stage.js`);
});

test("C4b — THE CAB STAND's OWN LAMP: just off-screen right at the front curb, high; it lights the maple's lower-right crown (brighter there than up-left), the bench from the right, a pool round the bench; the bench's shadow falls LEFT", async () => {
  const { cabLamp, TREE_LAMP, lightField, lampShadow, hiddenLamps } = await import('../js/core/harbor-light.js');
  for (const [W, H] of [[390, 844], [402, 874], [430, 932]]) {
    const k = `${W}x${H}`, L = setup(W, H), cam = L.cam, c = cabLamp(L), [sx] = project(cam, c.x, 0, c.z);
    assert.ok(sx > cam.W + 10 && sx < cam.W + 60, `${k}: off-screen right (${sx.toFixed(0)} of ${cam.W})`);
    assert.ok(hiddenLamps(L).some(h => h.cab), 'one of the hidden lamps');
    // the maple's crown: a lower-right point nearer the lamp than an upper-left one — the lamp's share falls off up + left
    const ctx = pieceCtx(L), mp = L.trees.find(t => t.big), lp = treeLamps(ctx, mp).find(l => l.col === TREE_LAMP.cab.col);
    assert.ok(lp && lp.x > 0 && lp.w > 0, `${k}: the maple sees it from the right + front`);
    const share = (u, v) => lp.k / (1 + (Math.hypot(lp.x - u, lp.y - v, lp.w) / lp.fall) ** 2);
    assert.ok(share(2, 4) > 1.5 * share(2, 7.5) && share(2, 4) > 3 * share(-2, 7.5), `${k}: the lower right ${share(2, 4).toFixed(2)} vs the upper right ${share(2, 7.5).toFixed(2)} + the upper left ${share(-2, 7.5).toFixed(2)}`);
    // the pool at the bench: brighter than 8 u left of it along the front strip
    const f = lightField(L, { lamps: 1 }), lum = v => (v ? v[0] + v[1] + v[2] : 0);
    assert.ok(lum(f(L.cabStand.x, L.cabStand.z + 0.6)) > lum(f(L.cabStand.x - 8, L.cabStand.z + 0.6)), `${k}: a pool at the cab stand`);
    // the bench's shadow (and a waiter's) falls LEFT, away from the lamp
    const sh = lampShadow([...L.lamps, c], 1, L.cabStand.x, L.cabStand.z, 1);
    assert.ok(sh && sh.dx < -0.5, `${k}: the shadow falls left (${sh && sh.dx.toFixed(2)})`);
  }
});

test('C4c — THE HYDRANT CORNER\'s LAMP: unseen just past the LEFT edge at 390 / 402 / 430; the ground at the hydrant + its holiday spot lit (≥ 1.4× without it), never brighter than the shopfront\'s spill; the hydrant\'s shadow falls RIGHT', () => {
  for (const [W, H] of [[390, 844], [402, 874], [430, 932]]) {
    const L = setup(W, H), cam = L.cam, cl = cornerLamp(L);
    assert.ok(cl && cl.kind === 'hidden', `${W}: a hidden lamp`);
    const [sx] = project(cam, cl.x, 0, cl.z); assert.ok(sx < -8, `${W}: off the left edge (${sx.toFixed(1)} pt)`);
    const at = lightField(L, { lamps: 1 }), sum = v => (v ? v[0] + v[1] + v[2] : 0);
    const without = lightField({ ...L, hydrant: null }, { lamps: 1 });
    const hx = L.hydrant.x, hz = L.hydrant.z, spotX = hx + 2.1;
    for (const x of [hx + 0.3, spotX]) assert.ok(sum(at(x, hz)) >= 1.4 * sum(without(x, hz)), `${W}: x ${x.toFixed(1)} lit by it: ${sum(at(x, hz)).toFixed(0)} vs ${sum(without(x, hz)).toFixed(0)} without`);
    const s = L.speakeasy, shopX = s.x0 + (s.shop.win[0] + s.shop.win[1]) / 2;
    assert.ok(sum(at(hx + 0.3, hz)) <= sum(at(shopX, s.z0 - 1.2)) * 1.05, `${W}: the hydrant (${sum(at(hx + 0.3, hz)).toFixed(0)}) never brighter than the shopfront (${sum(at(shopX, s.z0 - 1.2)).toFixed(0)})`);
    const sh = lampShadow([...L.lamps, cl], 1, hx, hz, 1);
    assert.ok(sh && sh.dx > 0, `${W}: its shadow falls right (${sh && sh.dx.toFixed(2)})`);
  }
  assert.ok(CORNER_LAMP.k < 0.9, 'dimmer than the cab stand\'s');
});

test('NIGHT-A — THE NEW NIGHT LIGHT (&light=new): an even base + ONE warm wash by depth — no pools across the street or the promenade; only the shopfront + the cab stand (+ the cart) as local light; faces lit from the front; shadows long + soft from one direction; the tree\'s night shadow short; the old light untouched', async () => {
  const M = await import('../js/core/harbor-light.js');
  const L = setup(), lum = c => (c ? c[0] + c[1] + c[2] : 0);
  const old = lightField(L, { lamps: 1 }), oldStreet = [-4.5, 0, 4.5].map(x => lum(old(x, 27)));
  assert.ok(Math.max(...oldStreet) > Math.min(...oldStreet) * 1.4, 'the old light: the street shows pools (the owner\'s spotlight patches)');
  try {
    assert.equal(M.setLightMode('new'), true); assert.equal(M.lightMode(), 'new'); assert.equal(M.setLightMode('new'), false, 'no change → false');
    const at = lightField(L, { lamps: 1 });
    for (const z of [25, 30, 34, 40, 47]) {   // across the full width at each depth (away from the shop + the cab stand): one level
      const row = [-1.5, 0, 1.5, 2.5].map(x => lum(at(x, z))); assert.ok(Math.max(...row) - Math.min(...row) < 2, `even across at z ${z}: ${row.map(Math.round)}`);
    }
    { const st = [-11, -9, -4.5, 0, 4.5, 9, 11].map(x => lum(at(x, 27))); assert.ok(Math.max(...st) - Math.min(...st) < 2, `the street under the dock: no patches across its whole width (${st.map(Math.round)})`); }
    assert.ok(lum(at(0, 25)) > lum(at(0, 36)) && lum(at(0, 36)) > lum(at(0, 46)) && lum(at(0, 46)) > lum(at(0, 53)), 'warmest at the screen\'s foot, fading toward the railing');
    assert.ok(lum(at(0, 53)) > 0, 'the base never black'); const c = at(0, 25); assert.ok(c[0] > c[2] * 1.5, 'the wash is warm');
    assert.ok(!lightSources(L).some(s => s.implied), 'no implied pools'); assert.deepEqual(M.hiddenLamps(L).map(h => !!h.cab), [true], 'only the cab stand\'s lamp');
    const s = L.speakeasy, shopX = s.x0 + (s.door.u0 + s.door.u1) / 2;
    assert.ok(lum(at(shopX, s.z0 - 1.3)) > lum(at(3, s.z0 - 1.3)) + 40, 'the shopfront stands out');
    const sh = lampShadow(L.lamps, 1.7, 0, 40, 1), sh2 = lampShadow(L.lamps, 1.7, -4, 40, 1);
    assert.ok(sh.soft && sh.dz > 3 && sh.a < 0.4 && sh.dx < 0 && sh2.dx < 0, 'long, faint, soft, up the screen, all leaning one way');
    const f = lampOn(L.lamps, 0, 40, 1); assert.ok(f.ld[2] < -0.5 && f.lk > 0.3, 'a face lit from the front');
    assert.equal(roadLampAt(L.lamps, 0.1), roadLampAt(L.lamps, 0.37), 'the road: even');
    assert.ok(M.NIGHT_LIGHT.treeShadow.throw < 0.5 && M.NIGHT_LIGHT.treeShadow.a < 1, 'the tree\'s night shadow short + gentle');
  } finally { M.setLightMode('old'); }
  assert.deepEqual([-4.5, 0, 4.5].map(x => lum(lightField(L, { lamps: 1 })(x, 27))), oldStreet, 'back to old: the same light as before');
});
