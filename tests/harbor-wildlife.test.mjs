// CITY 2.0 — PART 8b1 (Group 2): THE WILDLIFE's plan (core/harbor-wildlife.js — PURE). node --test tests/harbor-wildlife.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout, project } from '../js/core/harbor-layout.js';
import { FOLK, folkAt, folkMap, linePlaces } from '../js/core/harbor-people.js';
import { signalAt } from '../js/core/harbor-promenade.js';
import {
  localOf, wildSpots, spotPoint, canSpot, pilingSpot, PIGEON, pigeonCount, groundShare, pigeonSlot, pigeonAt, groundLife, gullSlot, owlDay, owlAt,
  squirrelSlot, coyoteNight, pathAt, coyoteTracks, raccoonNight, canAt, lidFixed, catEvening, fireflyCount, fireflyAt, heronMorning, fishSlot,
  duckDay, duckPlan, ducksBlock, SIZE,
} from '../js/core/harbor-wildlife.js';

const SIZES = {
  '390x844': { W: 390, H: 844, safe: { top: 47, bottom: 34 } },
  '402x874': { W: 402, H: 874, safe: { top: 62, bottom: 34 } },
  '430x932': { W: 430, H: 932, safe: { top: 59, bottom: 34 } },
};
const setup = k => { const s = SIZES[k]; const cam = cameraFor(s.W, s.H, { dock: { x: 14, y: s.H - 116, w: s.W - 28, h: 76 } }, s.safe); return { cam, L: harborLayout(cam) }; };
const { L } = setup('402x874');
const OFF = -240;                                       // (Grand Rapids in October: UTC − 4 h)
const SUN = { rise: 7.9, set: 18.8 };
const at = (y, mo, d, h, mi = 0) => Date.UTC(y, mo - 1, d, h, mi) / 1000 - OFF * 60;   // (local wall time → s abs)
const ctxOf = (o = {}) => ({ off: OFF, seed: 1924, spots: wildSpots(L), sun: SUN, rain: 0, wind: 3, force: new Set(), ...o });

test('8b1 — THE TRASH CAN: right of the front-left globe, fully above the dock at 390 / 402 / 430, nearer than anyone on the floor, clear of the lobby line', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), can = canSpot(L), [cx, foot] = project(cam, can.x, 0, can.z), [, top] = project(cam, can.x, can.h, can.z);
    const g = L.lamps.filter(l => l.kind === 'globe').sort((a, b) => a.x - b.x)[0], [gx] = project(cam, g.x, 0, g.z);
    assert.ok(foot <= cam.dock.y - 2, `${k}: its foot ${foot.toFixed(1)} above the dock ${cam.dock.y}`);
    assert.ok(cx > gx + 8 && cx < gx + 40, `${k}: just right of the front-left globe (${(cx - gx).toFixed(1)} pt)`);
    assert.ok(can.z < FOLK.zMin - 0.4, `${k}: in front of the walkable floor`);
    for (const p of linePlaces(L, 12)) assert.ok(project(cam, p.x, 0, p.z)[0] < cx - 6 || p.z > can.z + 2.5, `${k}: the lobby line stays clear of the can`);
    assert.ok(top > 0 && cx > 0 && cx < cam.W, `${k}: on screen`);
    assert.deepEqual(L.trashCan, can, 'the layout carries it (core/harbor-promenade.js)');
  }
});

test('8b1 — THE PERCHES: every spot on screen at 402 (the blade, the parapet, the billboard + its catwalk, the lamps, the café posts, the railing, the cobbles)', () => {
  const { cam, L } = setup('402x874');
  const sp = wildSpots(L), ids = sp.map(s => s.id);
  for (const id of ['blade', 'parapetR', 'bill', 'catwalk', 'crest', 'railA', 'railB', 'ground0', 'ground1', 'ground2', 'post1']) assert.ok(ids.includes(id), id);
  for (const s of sp) for (let k = 0; k < s.cap; k++) {
    const p = spotPoint(s, k, 3), [x, y] = project(cam, p.x, p.y, p.z);
    if (s.id === 'post0' || s.id === 'parapetL' && x < 0) continue;   // (the left post can stand off the left edge on a narrow phone)
    assert.ok(x > -2 && x < cam.W + 2 && y > 60 && y < cam.dock.y, `${s.id}[${k}] on screen (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }
  // the heron's piling: in the open water, its top over the lamps' globes line
  const p = pilingSpot(L), [px, py] = project(cam, p.x, p.y, p.z);
  assert.ok(px > 0 && px < cam.W && py < project(cam, 0, 0, 64)[1], 'the piling stands out in the water, behind the railing');
});

test('8b1 — THE PIGEONS: 2–8 by the clock (busy mornings, a couple roosting at night), winter + rain + a busy promenade put them up on the ledges; the same on every phone', () => {
  assert.equal(pigeonCount({ h: 3, sun: SUN }), 2, 'night: two roosting');
  assert.ok(pigeonCount({ h: 8.5, month: 6, sun: SUN }) >= 6, 'a summer morning: a full flock');
  assert.ok(pigeonCount({ h: 13, month: 1, sun: SUN }) < pigeonCount({ h: 13, month: 6, sun: SUN }), 'winter fewer');
  for (let h = 0; h < 24; h += 0.5) { const n = pigeonCount({ h, sun: SUN }); assert.ok(n >= 2 && n <= 8, `${h}: ${n}`); }
  assert.ok(groundShare({ month: 1, sun: SUN }) < groundShare({ month: 6, sun: SUN }), 'winter: rarely on the snowy cobbles');
  assert.ok(groundShare({ rain: 1, sun: SUN }) < 0.1, 'rain: huddled on the ledges');
  assert.ok(groundShare({ busy: 6, sun: SUN }) < groundShare({ busy: 1, sun: SUN }), 'a busy promenade: up high');
  const c = ctxOf();
  const j = Math.floor(at(2026, 10, 22, 9) / PIGEON.slot);
  assert.deepEqual(pigeonSlot(j, c), pigeonSlot(j, ctxOf()), 'the same plan on every phone');
  // never more birds on a ledge than it holds; a whole-flock gap now + then
  let gone = 0, slots = 0;
  for (let jj = j; jj < j + 600; jj++) {
    const s = pigeonSlot(jj, c), used = {};
    for (const b of s.birds) if (b.spot) used[b.spot] = (used[b.spot] || 0) + 1;
    for (const [id, n] of Object.entries(used)) { const sp = c.spots.find(x => x.id === id); assert.ok(n <= sp.cap, `${id}: ${n} > ${sp.cap}`); assert.ok(sp.who.includes('pigeon')); }
    slots++; if (s.gone) gone++;
  }
  assert.ok(gone > slots * 0.04 && gone < slots * 0.3, `the flock away for a stretch now + then (${gone} of ${slots} slots)`);
});

test('8b1 — THE PIGEONS JOIN MID-WAY: a bird\'s place is a pure function of the clock (a cold start = a phone that watched); slot changes fly, never jump', () => {
  const c = ctxOf(), t0 = at(2026, 10, 22, 10), cache = new Map();
  for (let t = t0; t < t0 + 3600; t += 7.3) for (let i = 0; i < PIGEON.max; i++) {
    const a = pigeonAt(i, t, c, cache), b = pigeonAt(i, t, ctxOf());
    assert.deepEqual(a, b);
    if (a.state === 'fly') assert.ok(a.u >= 0 && a.u <= 1 && a.t1 > a.t0);
  }
  // a ground bird's little life: small walks round its place, pecking, looking — continuous (no teleport)
  let last = groundLife(1000, 77);
  for (let t = 1000.05; t < 1300; t += 0.05) { const g = groundLife(t, 77); assert.ok(Math.hypot(g.dx - last.dx, g.dz - last.dz) < 0.08, `continuous at ${t}`); assert.ok(Math.hypot(g.dx, g.dz) < 1); last = g; }
});

test('8b1 — THE PIGEONS KEEP AWAY FROM THE OWL: no ledge within 4 units of the snowy owl\'s perch', () => {
  const owlSpot = 'billR', c = ctxOf({ owl: () => owlSpot }), sp = c.spots.find(s => s.id === owlSpot);
  const t0 = at(2027, 1, 12, 11);
  for (let j = Math.floor(t0 / PIGEON.slot), n = 0; n < 200; j++, n++) for (const b of pigeonSlot(j, c).birds) {
    if (!b.spot) continue; const s = c.spots.find(x => x.id === b.spot); if (s.kind === 'ground') continue;
    assert.ok(Math.hypot((s.x0 + s.x1) / 2 - (sp.x0 + sp.x1) / 2, s.y - sp.y, s.z - sp.z) >= 4, `${b.spot} near the owl`);
  }
});

test('8b1 — THE GULLS: by day only, on the billboard / its catwalk / the waterside railing; more on windy days', () => {
  const c = ctxOf(), cw = ctxOf({ wind: 12 });
  let n = 0, nw = 0;
  for (let d = 1; d <= 20; d++) for (let h = 0; h < 24; h += 0.25) {
    const t = at(2026, 7, d, Math.floor(h), (h % 1) * 60), j = Math.floor(t / 480);
    if (h % 2 === 0) for (const g of gullSlot(j, c)) { const lc = localOf(g.t0, OFF).h; assert.ok(lc > SUN.rise && lc < SUN.set + 0.2, `by day (${lc})`); assert.ok(['bill', 'catwalk', 'railA', 'railB'].includes(g.spot), g.spot); n++; }
    if (h % 2 === 0) nw += gullSlot(j, cw).length;
  }
  assert.ok(n > 30, `gulls land now + then (${n})`); assert.ok(nw > n, 'more on windy days');
});

test('8b1 — THE SNOWY OWL: winter days only (Dec–Mar), uncommon; on the billboard\'s corners / the date stone / a lamp top; in by day, off at dusk', () => {
  let days = 0, winter = 0;
  for (let k = 0; k < 365; k++) {
    const day0 = at(2026, 1, 1, 0) + k * 86400, lc = localOf(day0 + 43200, OFF), plan = owlDay(lc.key, day0, ctxOf());
    if (!plan) continue;
    assert.ok([12, 1, 2, 3].includes(lc.month), `a winter month (${lc.key})`);
    for (const s of plan.stops) assert.ok(['billL', 'billR', 'crest', 'lampTop0', 'lampTop1'].includes(s.spot), s.spot);
    assert.ok(localOf(plan.t1, OFF).h > SUN.set && localOf(plan.t1, OFF).h < SUN.set + 1, 'off at dusk');
    assert.equal(owlAt(plan, plan.t0 + 60).state, 'at');
    days++;
  }
  for (const m of [1, 2, 3, 12]) winter += 30;
  assert.ok(days > winter * 0.12 && days < winter * 0.45, `uncommon (${days} days)`);
});

test('8b1 — THE SQUIRREL: by day, never in rain; autumn the busiest, winter rare; down the trunk, hops, back up', () => {
  const count = (mo, season) => { let n = 0; for (let d = 1; d <= 14; d++) for (let h = 0; h < 24; h += 0.1167) { const t = at(2026, mo, d, Math.floor(h), (h % 1) * 60); const s = squirrelSlot(Math.floor(t / 420), ctxOf({ season })); if (s) { n++; const lh = localOf(s.t0, OFF).h; assert.ok(lh > SUN.rise && lh < SUN.set, 'by day'); assert.ok(s.hops.length >= 1 && s.t1 > s.back); } } return n; };
  const au = count(10, 'autumn'), wi = count(1, 'winter');
  assert.ok(au > wi * 3, `autumn busy (${au}), winter rare (${wi})`);
  assert.equal(squirrelSlot(Math.floor(at(2026, 10, 3, 13) / 420), ctxOf({ season: 'autumn', rain: 1 })), null, 'not in rain');
});

test('8b1 — THE COYOTE: rare, quiet nights only (10 pm → 4 am, the promenade nearly empty); stops under a lamp; tracks only where it walked; a howl on full moons', () => {
  let nights = 0;
  for (let k = 0; k < 200; k++) {
    const day0 = at(2026, 6, 1, 0) + k * 86400, key = localOf(day0 + 43200, OFF).key, p = coyoteNight(key, day0, L, ctxOf({ moon: k % 29 === 14 ? 1 : 0.3 }));
    if (!p || !p.legs) continue;
    nights++;
    const h = localOf(p.t0, OFF).h; assert.ok(h >= 22 || h < 4, `late (${h.toFixed(2)})`);
    const stop = p.legs.find(l => l.k === 'stop'); assert.ok(stop && stop.t1 - stop.t0 >= 6, 'it stops under the lamp a few seconds');
    assert.ok(pathAt(p, (stop.t0 + stop.t1) / 2).moving === false);
    const tr = coyoteTracks(p, p.t1 + 10); assert.ok(tr.length > 10 && tr.every(q => q.a > 0 && q.a <= 1), 'prints along its path');
  }
  assert.ok(nights > 8 && nights < 90, `rare (${nights} of 200 nights)`);
});

test('8b1 — THE RACCOON + THE CAN: late nights at the can; the lid tipped (off), left askew until the barber rights it at 8:30 — or whoever empties it first (lidFixedAt)', () => {
  let found = null;
  for (let k = 0; k < 40 && !found; k++) { const day0 = at(2026, 10, 1, 0) + k * 86400, key = localOf(day0 + 43200, OFF).key, p = raccoonNight(key, day0, L, ctxOf()); if (p) found = { p, key, day0 }; }
  assert.ok(found, 'a raccoon night within 40');
  const { p } = found, c = ctxOf();
  const h = localOf(p.t0, OFF).h; assert.ok(h >= 23 || h < 4, 'late');
  assert.equal(canAt(p.tTip - 5, L, c).lid, 'on');
  assert.equal(canAt(p.tTip + 5, L, c).lid, 'off');
  assert.equal(canAt(p.tb + 60, L, c).lid, 'askew');
  const fix = lidFixed(p.tTip, c); assert.equal(Math.round(localOf(fix, OFF).h * 60), 510, 'the barber at 8:30');
  assert.equal(canAt(fix - 60, L, c).lid, 'askew'); assert.equal(canAt(fix + 60, L, c).lid, 'on');
  const c2 = ctxOf({ lidFixedAt: tt => tt + 3 * 3600 }); assert.equal(canAt(p.tTip + 3 * 3600 + 5, L, c2).lid, 'on', 'the trash collector puts it back (Group 1)');
});

test('8b1 — THE CAT OUTSIDE: some evenings, never while the window moment shows the cat inside', () => {
  let n = 0, blocked = 0;
  for (let k = 0; k < 120; k++) {
    const day0 = at(2026, 6, 1, 0) + k * 86400, key = localOf(day0 + 43200, OFF).key;
    const p = catEvening(key, day0, L, ctxOf({ catInside: () => false }));
    const q = catEvening(key, day0, L, ctxOf({ catInside: () => true }));
    if (p) { n++; const h = localOf(p.t0, OFF).h; assert.ok(h >= 18 && h < 23.5, `an evening (${h})`); assert.ok(['sill', 'step'].includes(p.spot)); }
    if (q) blocked++;
  }
  assert.ok(n > 20 && n < 70, `some evenings (${n})`); assert.equal(blocked, 0, 'never with the window cat');
});

test('8b1 — FIREFLIES: summer nights only; THE HERON: dawn, April–October; FISH: likeliest at dawn + dusk', () => {
  assert.ok(fireflyCount({ h: 22.5, month: 7, day: 10 }) > 0); assert.equal(fireflyCount({ h: 22.5, month: 10, day: 10 }), 0); assert.equal(fireflyCount({ h: 14, month: 7, day: 10, dark: 0 }), 0);
  assert.equal(fireflyCount({ h: 22.5, month: 7, day: 10, rain: 1 }), 0, 'not in rain');
  const f = fireflyAt(3, 100, [{ x: 0, z: 46 }]); assert.ok(f.k >= 0 && f.k <= 1 && f.y > 0);
  let mornings = 0;
  for (let k = 0; k < 365; k++) { const day0 = at(2026, 1, 1, 0) + k * 86400, lc = localOf(day0 + 43200, OFF), p = heronMorning(lc.key, day0, ctxOf()); if (!p) continue; mornings++; assert.ok(lc.month >= 4 && lc.month <= 10); const h = localOf(p.ta, OFF).h; assert.ok(Math.abs(h - SUN.rise) < 0.6, 'round the sunrise'); }
  assert.ok(mornings > 60 && mornings < 140, `~45 % of the warm mornings (${mornings})`);
  const jumps = h0 => { let n = 0; for (let d = 1; d <= 20; d++) for (let m = 0; m < 60; m += 0.75) { const t = at(2026, 7, d, h0, m); if (fishSlot(Math.floor(t / 45), L, ctxOf())) n++; } return n; };
  assert.ok(jumps(8) > jumps(13), 'more at dawn than at midday'); assert.ok(jumps(13) > jumps(2), 'rare at night');
});

test('8b1 — THE DUCK CROSSING: spring only, rare; 2–4 mallards cross on WALK; the people at the kerb wait (crossBlocked) — nobody sets off across while they\'re on it', () => {
  let days = 0;
  for (let k = 0; k < 365; k++) { const day0 = at(2026, 1, 1, 0) + k * 86400, lc = localOf(day0 + 43200, OFF), p = duckDay(lc.key, day0, L, ctxOf()); if (!p) continue; days++; assert.ok(lc.month >= 4 && lc.month <= 6); assert.ok(p.n >= 2 && p.n <= 4); assert.equal(signalAt(p.tw * 1000 + 100).phase, 'walk', 'they set off on WALK'); }
  assert.ok(days > 5 && days < 30, `rare (${days} days)`);
  // the people wait: plan a crossing near a walk, check no walker STARTS across while the ducks are on it
  const plan = duckPlan(L, at(2026, 5, 12, 10), 3, Math.random);
  assert.ok(ducksBlock(plan, plan.tw, plan.tw + 1) && !ducksBlock(plan, plan.onX[1] + 1, plan.onX[1] + 2));
  const M = folkMap(L), cache = new Map(), ctx = { off: OFF, seed: 1924, crossBlocked: (a, b) => ducksBlock(plan, a, b) };
  const starts = new Set();
  for (let t = plan.onX[0] - 300; t < plan.onX[1] + 60; t += 0.5) {
    const r = folkAt(t, { L, M, ctx }, cache);
    for (const v of r.visits) for (const lg of v.legs) if (lg.k === 'walk' && lg.cross) starts.add(lg.t0);
  }
  assert.ok(starts.size > 0, 'walkers do cross round it (the check is not empty)');
  for (const s of starts) assert.ok(!(s > plan.onX[0] && s < plan.onX[1]), `a walker set off across at ${s - plan.tw} s with the ducks on it`);
  // (+ the same window WITHOUT the hook does have someone setting off during it — the hook is what holds them)
  const free = new Set(), c2 = new Map();
  for (let t = plan.onX[0] - 300; t < plan.onX[1] + 60; t += 0.5) for (const v of folkAt(t, { L, M, ctx: { off: OFF, seed: 1924 } }, c2).visits) for (const lg of v.legs) if (lg.k === 'walk' && lg.cross && lg.t0 > plan.onX[0] && lg.t0 < plan.onX[1]) free.add(lg.t0);
  console.log(`# duck crossing: ${starts.size} crossings round it with the hook, ${free.size} would have started during it without`);
});

test('8b1 — THE SIZES: every animal cheated up for the phone (the owner\'s phone test) — pigeons ~9 pt on the floor, the squirrel ~1.5×, the owl ~10+ pt, the heron ~15 pt', () => {
  const { cam } = setup('402x874');
  assert.ok(SIZE.pigeon.len * cam.F / 44 > 8.5);
  assert.ok(SIZE.squirrel.k >= 1.5);
  assert.ok(SIZE.owl.h * cam.F / 55 >= 10);
  assert.ok(SIZE.heron.h * cam.F / 100 >= 14);
});
