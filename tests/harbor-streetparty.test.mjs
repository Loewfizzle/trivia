// CITY 2.0 — NIGHT-B Group 2: THE STREET PARTY (core/harbor-streetparty.js through core/harbor-people.js#folkAt).
// node --test tests/harbor-streetparty.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { folkMap, folkAt, capByTier, route, lineRect, LINE, FOLK } from '../js/core/harbor-people.js';
import { promenadeSolids } from '../js/core/harbor-solids.js';
import { crowdK, danceBreaks, forcedBreaks, eveningOf, pocketsOf, clearZones, partySongs, KINDS, SP } from '../js/core/harbor-streetparty.js';
import { knob } from '../js/core/harbor-schedule.js';
import { TIERS } from '../js/core/harbor-tiers.js';
import { cartEvening } from '../js/core/harbor-routines.js';

const SIZES = { '390x844': [390, 844, 47], '402x660': [402, 660, 62], '430x932': [430, 932, 59] };
const setup = (k = '402x660') => { const [W, H, top] = SIZES[k]; const cam = cameraFor(W, H, { dock: { x: 14, y: H - 116, w: W - 28, h: 76 } }, { top, bottom: 34 }); const L = harborLayout(cam); return { cam, L, M: folkMap(L), S: promenadeSolids(L, null) }; };
const OFF = -240;
const SAT = Date.parse('2026-10-31T20:00:00-04:00') / 1000, THU = Date.parse('2026-10-29T20:00:00-04:00') / 1000;
const ctxOf = S => ({ off: OFF, seed: 1924, budget: 1, shopOpen: () => true, solids: S, solidsKey: 'sp' });

test('NIGHT-B — THE PARTY NIGHT\'s SHAPE: the crowd grows through the warm-up (8:30), fullest at the peak, thins after 1, gone by 2', () => {
  assert.equal(crowdK(20.4), 0); assert.ok(crowdK(21) > 0.1 && crowdK(21) < 0.8, 'the warm-up'); assert.equal(crowdK(22.5), 1); assert.equal(crowdK(24.5), 1);
  assert.ok(crowdK(25.5) < 0.8 && crowdK(25.5) > 0.1, 'thinning after 1'); assert.equal(crowdK(26), 0, 'gone by 2');
  const ev = eveningOf(SAT + 5 * 3600, OFF); assert.equal(ev.key, '2026-10-31'); assert.ok(Math.abs(ev.h - 25) < 1e-6, '1 am = hour 25 of the evening');
});

test('NIGHT-B — THE DANCE BREAKS: ~every 20 min on a Saturday, each ON a party song\'s start (one song long), never the same kind twice in a row, the same on every phone; none on a Thursday', () => {
  const ev = eveningOf(SAT + 3600, OFF), br = danceBreaks(ev.day0, ev.key, { off: OFF, seed: 1924 }), B = knob('party.break');
  assert.ok(br.length >= 11 && br.length <= 15, `${br.length} breaks`);
  const songs = partySongs(ev.day0 + knob('party.songs').from * 3600, ev.day0 + knob('party.songs').to * 3600, `1924|${ev.key}`);
  for (let i = 0; i < br.length; i++) {
    const b = br[i];
    assert.ok(songs.some(s => s.t0 === b.s0 && s.t1 === b.s1), 'on a song\'s start, one song long');
    assert.ok(b.s0 >= ev.day0 + (B.from - 0.1) * 3600 && b.s1 <= ev.day0 + (B.to + 0.25) * 3600, 'inside the window');
    if (i) { assert.notEqual(b.kind, br[i - 1].kind, 'never the same kind twice in a row'); assert.ok(b.s0 - br[i - 1].s0 >= B.minGap_min * 60, 'never too close'); }
    assert.ok(KINDS.includes(b.kind));
  }
  assert.ok(new Set(br.map(b => b.kind)).size >= 4, 'a night shows most of the kinds');
  assert.deepEqual(danceBreaks(ev.day0, ev.key, { off: OFF, seed: 1924 }), br, 'every phone the same');
  assert.deepEqual(danceBreaks(ev.day0, ev.key, { off: OFF, seed: 1924, blocked: () => true }), [], 'none while blocked (a raid, a legendary)');
  const { L, M, S } = setup(), cache = new Map();
  for (let t = THU; t < THU + 6 * 3600; t += 600) { const p = folkAt(t, { L, M, ctx: ctxOf(S) }, cache).party; assert.ok(!p || (!p.crowd && !p.brk && !p.pockets), 'a Thursday has no street party'); }
  // (&force=dance: one every 5 min, the kinds in turn; &dance=conga picks one)
  const fb = forcedBreaks(1000, 1000, 3000); assert.equal(fb[1].s0 - fb[0].s0, knob('party.break.force').every); assert.notEqual(fb[0].kind, fb[1].kind);
  assert.ok(forcedBreaks(1000, 1000, 3000, { danceKind: 'conga' }).every(b => b.kind === 'conga'));
});

test('NIGHT-B — THE POCKETS: a mix of sizes (big groups, small groups, pairs, a loner) scattered across the floor, clear of the door + its approach, THE LINE, the crossing, the cab bench + every solid; a walker\'s way left ↔ right always exists — at 390 / 402×660 / 430', () => {
  for (const k of Object.keys(SIZES)) {
    const { L, M, S } = setup(k), W = { L, M, route, solids: S, line: lineRect(L, LINE.max) }, P = pocketsOf('2026-10-31', W, {});
    assert.ok(P.length >= TIERS.pockets[1] + 1, `${k}: ${P.length} pockets`);
    for (const kind of ['big', 'small', 'pair', 'loner']) assert.ok(P.some(p => p.kind === kind), `${k}: a ${kind}`);
    const Z = clearZones(W, {});
    for (const p of P) for (const sl of p.slots) for (const q of Z.rects) assert.ok(!(sl.x > q.x0 && sl.x < q.x1 && sl.z > q.z0 && sl.z < q.z1), `${k}: ${p.kind} in ${q.id}`);
    for (const p of P) assert.ok(Math.abs(p.x) + p.R < L.cam.hw(p.z), `${k}: on screen`);
    // (the left half is the door, its approach + THE LINE — the owner's 4:02 pm shot: everything piled up there; the pockets fill the rest)
    const xs = P.map(p => p.x); assert.ok(Math.min(...xs) < 2 && Math.max(...xs) > 8, `${k}: spread across the promenade (${xs.map(x => x.toFixed(1))})`);
    // (left ↔ right round the pockets: on the walkers' own map + the pockets as obstacles)
    const MS = { rects: M.rects, circles: [...M.circles, ...P.map(p => ({ x: p.x, z: p.z, r: p.R + 0.1 }))] };
    for (const z of [40.2, 46, 50]) { const w = route(MS, { x: -L.cam.hw(z) - 1, z: Math.min(z, 42.4) }, { x: L.cam.hw(z) + 1, z }); assert.ok(w.length >= 2 && w.slice(1).every((p, i) => !MS.circles.some(c => Math.hypot(p.x - c.x, p.z - c.z) < c.r - 0.05)), `${k}: a way through at z ${z}`); }
  }
});

test('NIGHT-B — THE STREET PARTY over a Saturday: everyone walks in off a screen edge + out the same way (THE PEOPLE RULE); mostly mingling, almost everyone dances in a break; the street + the bench only in a break; the conga in off the right + off the left; the cart packs up before the crowd; the cab stand pauses', () => {
  const { L, M, S } = setup(), cache = new Map(), ctx = ctxOf(S), hw = z => L.cam.hw(z);
  const seen = new Map(); let mingle = 0, inBreakPocket = 0, dancingPocket = 0, street = 0, bench = 0, maxConga = 0, cabInBreak = 0;
  for (let t = SAT + 0.5 * 3600; t < SAT + 6.2 * 3600; t += 3) {
    const f = folkAt(t, { L, M, ctx }, cache), brk = f.party && f.party.brk, onBrk = brk && t >= brk.s0 + 8 && t < brk.s1 - 8;
    for (const m of f.members) {
      if (m.sp) seen.set(m.vid, m);
      if (m.kind === 'mingler' && m.s.pose === 'mingle') mingle++;
      if (m.kind === 'mingler' && onBrk && m.s.pose !== 'walk') { inBreakPocket++; if (m.s.pose === 'wands') dancingPocket++; }
      if (m.kind === 'spiller' && m.s.z < FOLK.zMin - 1) { street++; assert.ok(brk, 'in the street only in a break'); }
      if (m.kind === 'bencher' && (m.s.y || 0) > 0.3) { bench++; assert.ok(brk, 'on the bench only in a break'); }
      if (m.kind === 'cabwait' && onBrk && m.s.pose === 'sit') cabInBreak++;
    }
    maxConga = Math.max(maxConga, f.members.filter(m => m.kind === 'conga').length);
  }
  assert.ok(mingle > 20000, `mostly mingling (${mingle})`);
  assert.ok(dancingPocket / inBreakPocket > 0.85, `almost everyone dances in a break (${dancingPocket} / ${inBreakPocket})`);
  assert.ok(street > 300 && bench > 100, `the spill (${street}) + the bench (${bench}) in the breaks`);
  assert.ok(maxConga >= TIERS.conga[2] - 2, `the big conga (${maxConga} at once)`);
  assert.equal(cabInBreak, 0, 'the cab stand pauses for a break');
  // (THE PEOPLE RULE — every visit's first + last point off a screen edge, the conga in off the RIGHT + off the LEFT)
  const vis = new Map(); for (let t = SAT + 0.5 * 3600; t < SAT + 6.2 * 3600; t += 60) for (const v of folkAt(t, { L, M, ctx }, cache).visits) if (v.sp) vis.set(v.id, v);
  for (const v of vis.values()) {
    const a = v.legs[0].pts[0], b = v.legs[v.legs.length - 1].pts.at(-1);
    assert.ok(Math.abs(a.x) > hw(a.z), `${v.kind} ${v.id} appears in view (${a.x.toFixed(1)}, ${a.z.toFixed(1)})`);
    assert.ok(Math.abs(b.x) > hw(b.z), `${v.kind} ${v.id} vanishes in view (${b.x.toFixed(1)}, ${b.z.toFixed(1)})`);
    if (v.kind === 'conga') { assert.ok(a.x > 0 && b.x < 0, 'the conga: in off the right, off the left'); }
  }
  // (the cart: a party night packs up before the crowd's warm-up)
  const ev = cartEvening('2026-10-31', 10, eveningOf(SAT, OFF).day0, 30.4, 38.4, { party: true }), dayEv = cartEvening('2026-10-29', 10, eveningOf(THU, OFF).day0, 30.4, 38.4);
  assert.ok((ev.tb - eveningOf(SAT, OFF).day0) / 3600 <= knob('party.crowd').warm, 'packed up before the warm-up'); assert.ok(dayEv.tb - eveningOf(THU, OFF).day0 > ev.tb - eveningOf(SAT, OFF).day0, 'later on a plain night');
});

test('NIGHT-B — THE TIERS + JOINED MID-WAY: a weaker phone draws the first pockets / the line\'s first n (the same people on every phone of a tier); a page opened mid-break sees exactly what a page open all night sees', () => {
  const { L, M, S } = setup(), ctx = ctxOf(S), ev = eveningOf(SAT + 3600, OFF), br = danceBreaks(ev.day0, ev.key, { off: OFF, seed: 1924 }), conga = br.find(b => b.kind === 'conga');
  const long = new Map(); for (let t = conga.s0 - 1200; t < conga.s0 + 60; t += 2) folkAt(t, { L, M, ctx }, long);
  const t = conga.s0 + 60, a = folkAt(t, { L, M, ctx }, long), b = folkAt(t, { L, M, ctx }, new Map());
  const pos = f => f.members.filter(m => m.sp).map(m => `${m.vid}:${m.s.x.toFixed(3)},${m.s.z.toFixed(3)},${m.s.pose}`).sort();
  assert.deepEqual(pos(b), pos(a), 'joined mid-way = the same');
  const n = k => capByTier(a.members, k).filter(m => m.sp);
  assert.ok(n(0).length < n(1).length && n(1).length < n(2).length, `tier 0 < 1 < 2 (${n(0).length} / ${n(1).length} / ${n(2).length})`);
  for (let k = 0; k < 3; k++) { assert.ok(n(k).filter(m => m.kind === 'conga').length <= TIERS.conga[k]); assert.ok(n(k).every(m => m.sp.pocket == null || m.sp.pocket < TIERS.pockets[k])); }
  assert.deepEqual(capByTier(a.members, 0).map(m => m.vid), capByTier(b.members, 0).map(m => m.vid), 'the same ones on every phone of a tier');
});

test('NIGHT-B — PERF: a street party frame costs little once planned (the warm cache — every phone plans ahead)', () => {
  const { L, M, S } = setup(), ctx = ctxOf(S), cache = new Map(), ev = eveningOf(SAT + 3600, OFF), b = danceBreaks(ev.day0, ev.key, { off: OFF, seed: 1924 }).find(x => x.kind === 'mix');
  for (let t = b.s0 - 300; t < b.s0 + 60; t += 1) folkAt(t, { L, M, ctx }, cache);
  const ts = []; for (let i = 0; i < 300; i++) { const a = performance.now(); folkAt(b.s0 + 60 + i / 60, { L, M, ctx }, cache); ts.push(performance.now() - a); }
  ts.sort((x, y) => x - y);
  assert.ok(ts[150] < 3, `the median frame ${ts[150].toFixed(2)} ms`);
});
