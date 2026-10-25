// CITY 2.0 — THE HARBOR, 8b2 Group 3: THE BOATS' MODELS (boat3d.js's kit). Boat-local units: a from the stern (0) to the stem
// (len), u up from the waterline, s across (+ = starboard: the side we see when she heads right). Colours are ROLES (boats.js's
// palettes, lit for the hour). Each model: { parts, c0 (her centre's a), dots (lights the frame draws: running lights, bulbs,
// the deck lamps, the lantern), smoke (her stacks' tops), wheel (Rosie's paddlewheel, drawn live between her back + front) }.
// The proportions + colours follow the Part 5 sprites they replace (the look reference), now with depth: a beam, decks you see
// the edge of, a stem you see head-on, a stern wheel you see from behind.
import { newPart, face, dec, decS, decA, archS, ringS, box, prismS, prismU, cylU, loft, line, dotAt, text } from './boat3d.js';

const PI = Math.PI;
const ID = (a, u, s) => [a, u, s];

// an arched window on an END face (s0..s1 across × u0..u1 at a)
function archA(F, s0, s1, u0, u1, a, c, o) {
  const r = (s1 - s0) / 2, cy = u1 - r, pts = [ID(a, u0, s0), ID(a, u0, s1), ID(a, cy, s1)];
  for (let i = 1; i < 6; i++) { const t = (i / 6) * PI; pts.push(ID(a, cy + r * Math.sin(t), s0 + r + r * Math.cos(t))); }
  pts.push(ID(a, cy, s0));
  return dec(F, pts, c, o);
}
// a catenary of bulbs between two points (the old sprite's sag): → [[a,u,s]…]
function droop(p, q, step = 0.75) {
  const n = Math.max(2, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / step)), out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, sag = Math.sin(PI * t) * Math.min(1.3, Math.abs(q[0] - p[0]) * 0.06); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t - sag, p[2] + (q[2] - p[2]) * t]); }
  return out;
}
// a stack's feathered crown: 8 points flaring out from its rim
function crown(P, a, s, r, u0, u1, c) {
  const n = 8;
  for (let i = 0; i < n; i++) {
    const t0 = (i / n) * 2 * PI, t1 = ((i + 1) / n) * 2 * PI, tm = (t0 + t1) / 2, R = r * 1.55;
    face(P, [ID(a + r * Math.cos(t0), u0, s + r * Math.sin(t0)), ID(a + r * Math.cos(t1), u0, s + r * Math.sin(t1)), ID(a + R * Math.cos(tm), u1, s + R * Math.sin(tm))], c, { two: true, out: [a, u0 - 1, s] });
  }
}

// ------------------------------------------------------------------ ROSIE (len 24): the riverboat
export const ROSIE_STACKS = [[16.4, 0.95], [17.6, -0.95]];            // [a, s] — staggered abreast: two stacks from the side AND head-on
export const ROSIE_WHEEL = Object.freeze({ a: -0.45, u: 1.3, r: 1.55, hw: 1.95, n: 10 });
export function rosieModel() {
  const parts = [], dots = [];
  // THE HULL: white, the red boot stripe, the dark bottom, the rub rail; the sheer rising to a raked stem
  const H = newPart('hull'); parts.push(H);
  const st = [
    { a: 1.0, aw: 1.15, b: 2.6, bw: 2.4, h: 1.5 }, { a: 2.5, aw: 2.5, b: 2.85, bw: 2.7, h: 1.5 }, { a: 6, aw: 6, b: 2.95, bw: 2.8, h: 1.52 },
    { a: 12, aw: 12, b: 2.95, bw: 2.8, h: 1.55 }, { a: 17, aw: 17, b: 2.9, bw: 2.75, h: 1.58 }, { a: 20, aw: 20, b: 2.62, bw: 2.42, h: 1.62 },
    { a: 21.8, aw: 21.8, b: 2.12, bw: 1.86, h: 1.68 }, { a: 23.0, aw: 22.75, b: 1.38, bw: 1.0, h: 1.8 }, { a: 23.7, aw: 23.1, b: 0.62, bw: 0.3, h: 1.95 },
    { a: 24.15, aw: 23.3, b: 0.04, bw: 0.02, h: 2.1 },
  ];
  loft(H, st, [[-1, 0.12, 'dark'], [0.12, 0.23, 'white'], [0.23, 0.55, 'red'], [0.55, 1.42, 'white'], [1.42, 99, 'rail']], 'deck');
  // THE MAIN DECK: the cabin (arched windows all round), its edge catching the light, the shadow under the overhang
  const C1 = newPart('cabin1', { on: 'hull' }); parts.push(C1);
  const c1 = box(C1, 2.4, 21.8, 1.5, 3.9, -2.55, 2.55, 'white', { skip: ['bot', 'top'] });
  for (const [F, s] of [[c1.stbd, 2.55], [c1.port, -2.55]]) {
    for (let a = 3.2; a < 21.2; a += 1.05) archS(F, a, a + 0.62, 2.15, 3.4, s, 'win', { win: true });
    decS(F, 2.4, 21.8, 3.66, 3.9, s, 'shadow');
    for (const a of [6.1, 18.4]) ringS(F, a + 0.31, 2.5, s + 0.03 * Math.sign(s), 0.36, 0.17, 'buoy', 12);
  }
  for (let s = -1.9; s < 1.9; s += 0.95) { archA(c1.fore, s, s + 0.55, 2.15, 3.4, 21.8, 'win', { win: true }); archA(c1.aft, s, s + 0.55, 2.15, 3.4, 2.4, 'win', { win: true }); }
  decA(c1.fore, -2.55, 2.55, 3.66, 3.9, 21.8, 'shadow'); decA(c1.aft, -2.55, 2.55, 3.66, 3.9, 2.4, 'shadow');
  const S1 = newPart('slab1', { on: 'cabin1' }); parts.push(S1);
  const s1 = box(S1, 2.1, 22.2, 3.9, 4.15, -2.8, 2.8, 'edge');
  for (const [F, s] of [[s1.stbd, 2.8], [s1.port, -2.8]]) decS(F, 2.1, 22.2, 3.92, 3.98, s, 'trim');
  decA(s1.fore, -2.8, 2.8, 3.92, 3.98, 22.2, 'trim');
  // THE PROMENADE DECK: the cabin set back in the shade, its windows; the columns + the railing at the deck's edge (each side its
  // own part: the near row in front of the cabin, the far row behind it)
  const C2 = newPart('cabin2', { on: 'slab1' }); parts.push(C2);
  const c2 = box(C2, 4.6, 19.2, 4.15, 6.1, -1.95, 1.95, 'shadeW', { skip: ['bot', 'top'] });
  for (const [F, s] of [[c2.stbd, 1.95], [c2.port, -1.95]]) for (let a = 5.0; a < 19; a += 1.15) decS(F, a, a + 0.72, 4.65, 5.6, s, 'win', { win: true });
  for (let s = -1.5; s < 1.5; s += 1.0) { decA(c2.fore, s, s + 0.6, 4.65, 5.6, 19.2, 'win', { win: true }); decA(c2.aft, s, s + 0.6, 4.65, 5.6, 4.6, 'win', { win: true }); }
  for (const sg of [1, -1]) {
    const R = newPart(sg > 0 ? 'railS' : 'railP', { on: 'slab1' }); parts.push(R);
    const s = 2.6 * sg;
    for (let a = 4.4; a <= 19.7; a += 1.9) line(R, [ID(a, 4.15, s), ID(a, 6.1, s)], 'white', 0.09);
    line(R, [ID(4.2, 4.8, s), ID(19.6, 4.8, s)], 'white', 0.07);
  }
  { const R = newPart('railF', { on: 'slab1' }); parts.push(R); line(R, [ID(19.6, 4.8, -2.6), ID(19.6, 4.8, 2.6)], 'white', 0.07); line(R, [ID(19.6, 4.15, -2.6), ID(19.6, 6.1, -2.6)], 'white', 0.09); line(R, [ID(19.6, 4.15, 2.6), ID(19.6, 6.1, 2.6)], 'white', 0.09); }
  { const R = newPart('railA', { on: 'slab1' }); parts.push(R); line(R, [ID(4.4, 4.8, -2.6), ID(4.4, 4.8, 2.6)], 'white', 0.07); }
  const S2 = newPart('slab2', { on: 'cabin2' }); parts.push(S2);
  const s2 = box(S2, 4.0, 19.8, 6.1, 6.35, -2.7, 2.7, 'edge');
  for (const [F, s] of [[s2.stbd, 2.7], [s2.port, -2.7]]) decS(F, 4.0, 19.8, 6.12, 6.18, s, 'trim');
  decA(s2.fore, -2.7, 2.7, 6.12, 6.18, 19.8, 'trim');
  // THE TEXAS DECK + THE PILOTHOUSE (windows all round, the red roof)
  const C3 = newPart('cabin3', { on: 'slab2' }); parts.push(C3);
  const c3 = box(C3, 8.6, 15.4, 6.35, 7.7, -1.55, 1.55, 'white', { skip: ['bot', 'top'] });
  for (const [F, s] of [[c3.stbd, 1.55], [c3.port, -1.55]]) { for (let a = 9.3; a < 15; a += 1.1) decS(F, a, a + 0.6, 6.65, 7.35, s, 'win', { win: true }); decS(F, 8.6, 15.4, 7.5, 7.7, s, 'shadow'); }
  for (let s = -1.1; s < 1.1; s += 0.8) { decA(c3.fore, s, s + 0.5, 6.65, 7.35, 15.4, 'win', { win: true }); decA(c3.aft, s, s + 0.5, 6.65, 7.35, 8.6, 'win', { win: true }); }
  const S3 = newPart('slab3', { on: 'cabin3' }); parts.push(S3);
  box(S3, 8.45, 15.55, 7.7, 7.82, -1.7, 1.7, 'edge');
  const PH = newPart('pilot', { on: 'slab3' }); parts.push(PH);
  const ph = box(PH, 12.4, 15.0, 7.82, 9.0, -1.05, 1.05, 'white', { skip: ['bot', 'top'] });
  decS(ph.stbd, 12.8, 14.6, 8.0, 8.75, 1.05, 'win', { win: true }); decS(ph.port, 12.8, 14.6, 8.0, 8.75, -1.05, 'win', { win: true });
  decA(ph.fore, -0.85, 0.85, 8.0, 8.75, 15.0, 'win', { win: true }); decA(ph.aft, -0.6, 0.6, 8.0, 8.75, 12.4, 'win', { win: true });
  const RF = newPart('roof', { on: 'pilot' }); parts.push(RF);
  box(RF, 12.2, 15.2, 8.95, 9.25, -1.25, 1.25, 'roof');
  // TWIN STACKS: black, a gold band, feathered crowns; a spreader between their tops
  ROSIE_STACKS.forEach(([a, s], i) => {
    const K = newPart(`stack${i}`, { on: 'slab2' }); parts.push(K);
    cylU(K, a, s, 0.3, 6.35, 11.2, 10, 'stack');
    const B = newPart(`band${i}`, { on: `stack${i}` }); parts.push(B);
    cylU(B, a, s, 0.325, 9.15, 9.4, 10, 'trim', { noTop: true });
    const Cr = newPart(`crown${i}`, { on: `stack${i}` }); parts.push(Cr);
    crown(Cr, a, s, 0.3, 11.2, 11.75, 'stack');
  });
  { const Sp = newPart('spreader', { on: 'stack1' }); parts.push(Sp); line(Sp, [ID(16.4, 10.55, 0.95), ID(17.6, 10.55, -0.95)], 'stack', 0.08); line(Sp, [ID(16.4, 10.75, 0.95), ID(17.6, 10.75, -0.95)], 'trim', 0.05); }
  // THE STERN WHEEL'S HOOD (the paddle box with her name, gold-trimmed), its posts + the pitman arms; the wheel itself turns (boats.js)
  const wheel = newPart('wheel'); parts.push(wheel);
  line(wheel, [ID(ROSIE_WHEEL.a, ROSIE_WHEEL.u, -ROSIE_WHEEL.hw), ID(ROSIE_WHEEL.a, ROSIE_WHEEL.u, ROSIE_WHEEL.hw)], 'none');   // (only its place in the sort: the live wheel is drawn here)
  const hoodProf = [[-2.05, 2.9], [1.3, 2.9], [1.3, 3.45]];
  for (let i = 1; i < 8; i++) { const t = i / 8; hoodProf.push([1.3 + (-2.05 - 1.3) * t, 3.45 + 0.8 * Math.sin(PI * t)]); }
  hoodProf.push([-2.05, 3.45]);
  const HD = newPart('hood', { on: 'wheel' }); parts.push(HD);
  const hd = prismS(HD, hoodProf, -2.3, 2.3, 'red');
  for (const [F, s, dirA] of [[hd.stbd, 2.3, 1], [hd.port, -2.3, -1]]) {
    dec(F, hoodProf.map(([a, u]) => ID(a, u, s)), 'trim', { w: 0.09 });
    for (let i = 0; i < 4; i++) { const a = -1.85 + i * 0.95; decS(F, a, a + 0.1, 2.95, 3.12, s, 'redD'); }
    text(HD, F, 'ROSIE', ID(-0.375, 3.3, s + 0.02 * Math.sign(s)), ID(dirA, 0, 0), ID(0, 1, 0), 0.6, 'trim');
  }
  for (const sg of [1, -1]) {
    const Po = newPart(sg > 0 ? 'postS' : 'postP'); parts.push(Po);
    const s = 2.2 * sg;
    line(Po, [ID(1.15, 1.5, s), ID(1.15, 2.9, s)], 'redD', 0.12); line(Po, [ID(-1.9, 0.9, s), ID(-1.9, 2.9, s)], 'redD', 0.12);
    line(Po, [ID(1.6, 1.62, s * 0.98), ID(ROSIE_WHEEL.a, ROSIE_WHEEL.u, s)], 'dark', 0.1);    // (the pitman arm to the crank)
  }
  // THE FLAGSTAFFS + their pennants (bow + stern)
  { const F = newPart('bowstaff', { on: 'hull' }); parts.push(F); line(F, [ID(23.6, 1.95, 0), ID(23.6, 5.2, 0)], 'dark', 0.07); face(F, [ID(23.6, 5.2, 0), ID(24.6, 4.95, 0), ID(23.6, 4.7, 0)], 'red', { two: true, n: [0, 0, 1] }); }
  { const F = newPart('sternstaff', { on: 'hood' }); parts.push(F); line(F, [ID(-0.9, 4.2, 0), ID(-0.9, 6.4, 0)], 'dark', 0.07); face(F, [ID(-0.9, 6.4, 0), ID(-2.0, 6.1, 0), ID(-0.9, 5.8, 0)], 'red', { two: true, n: [0, 0, 1] }); }
  // THE BULB STRINGS: bow staff → the stacks' tops → stern staff, sagging between (the wire here; the bulbs are dots: boats.js lights them)
  const W = newPart('strings', { last: true }); parts.push(W);
  const runs = [[[23.6, 5.2, 0], [17.6, 11.2, -0.95]], [[17.6, 11.2, -0.95], [16.4, 11.2, 0.95]], [[16.4, 11.2, 0.95], [-0.9, 6.4, 0]]];
  let bi = 0;
  for (const [p, q] of runs) { const pts = droop(p, q); line(W, pts, 'wire', 0.035); pts.forEach((b, i) => { if (i > 0 && i < pts.length - 1) dotAt(W, b, 'bulb', { i: bi++ }); }); }
  // her lights: the deck lamps along the main deck's edge (each side), the sidelights at the pilothouse
  for (const sg of [1, -1]) for (let a = 3; a < 22; a += 2.4) dotAt(C1, [a, 3.95, 2.82 * sg], 'lamp', { n: [0, 0, sg] });
  dotAt(PH, [14.7, 8.45, 1.1], 'side', { n: [0, 0, 1], col: [90, 255, 140] });
  dotAt(PH, [14.7, 8.45, -1.1], 'side', { n: [0, 0, -1], col: [255, 70, 60] });
  return { parts, c0: 12, dots, wheel: ROSIE_WHEEL, smoke: ROSIE_STACKS.map(([a, s]) => [a, 11.75, s]), steam: [17.0, 11.8, 0] };
}

// ------------------------------------------------------------------ THE WATER TAXI (len 6): yellow, its checker band, bow up
export function taxiModel() {
  const parts = [];
  const H = newPart('hull'); parts.push(H);
  const st = [{ a: 0, aw: 0.15, b: 1.0, bw: 0.85, h: 1.2 }, { a: 1.0, aw: 1.0, b: 1.1, bw: 0.98, h: 1.22 }, { a: 3.0, aw: 3.0, b: 1.12, bw: 1.0, h: 1.25 }, { a: 4.4, aw: 4.4, b: 1.0, bw: 0.85, h: 1.28 },
    { a: 5.3, aw: 5.05, b: 0.62, bw: 0.4, h: 1.32 }, { a: 5.9, aw: 5.4, b: 0.22, bw: 0.08, h: 1.36 }, { a: 6.15, aw: 5.5, b: 0.02, bw: 0.01, h: 1.38 }];
  const hl = loft(H, st, [[-1, 0.12, 'black'], [0.12, 0.47, 'yellow'], [0.47, 0.95, 'yellow'], [0.95, 99, 'yellow']], 'teak');
  // the checker band: two rows of squares along each side, mapped onto the hull's surface
  const cs = 0.3;
  for (const sg of [1, -1]) for (let k = 1; k * cs < 5.5; k++) for (let j = 0; j < 2; j++) {
    const a0 = k * cs, a1 = a0 + cs, u0 = 0.47 + j * 0.24, u1 = u0 + 0.24;
    hl.decal(sg, [[a0, u0], [a1, u0], [a1, u1], [a0, u1]], (k + j) % 2 ? 'black' : 'white');
  }
  // the cabin: white, a rounded front, its windows (the windscreen across the front); the yellow roof; the little mast + flag
  const C = newPart('cabin', { on: 'hull' }); parts.push(C);
  const plan = [[1.1, -0.8], [3.9, -0.8], [4.25, -0.62], [4.42, -0.25], [4.42, 0.25], [4.25, 0.62], [3.9, 0.8], [1.1, 0.8]];
  const cb = prismU(C, plan, 1.22, 2.45, 'white', { noTop: true });
  cb.walls.forEach((F, i) => {
    const [p, q] = [plan[i], plan[(i + 1) % plan.length]], len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const at = (t, u) => ID(p[0] + (q[0] - p[0]) * t, u, p[1] + (q[1] - p[1]) * t);
    if (len > 2) { const n = 4; for (let w = 0; w < n; w++) { const t0 = (0.08 + w * 0.92 / n) , t1 = t0 + 0.92 / n * 0.68; dec(F, [at(t0, 1.65), at(t1, 1.65), at(t1, 2.2), at(t0, 2.2)], 'win', { win: true }); } }
    else if (i >= 1 && i <= 5) dec(F, [at(0.1, 1.68), at(0.9, 1.68), at(0.9, 2.25), at(0.1, 2.25)], 'win', { win: true });
    else dec(F, [at(0.2, 1.65), at(0.8, 1.65), at(0.8, 2.2), at(0.2, 2.2)], 'win', { win: true });
  });
  const R = newPart('roof', { on: 'cabin' }); parts.push(R);
  prismU(R, plan.map(([a, s]) => [a + (a > 3 ? 0.08 : -0.08), s * 1.1]), 2.45, 2.63, 'yellow');
  const M = newPart('mast', { on: 'roof' }); parts.push(M);
  line(M, [ID(1.5, 2.63, 0), ID(1.5, 3.5, 0)], 'black', 0.05);
  face(M, [ID(1.5, 3.5, 0), ID(0.95, 3.5, 0), ID(0.95, 3.18, 0), ID(1.5, 3.18, 0)], 'flag', { two: true, n: [0, 0, 1] });
  const dots = [];
  dotAt(C, [4.1, 1.5, 0.9], 'side', { n: [0, 0, 1], col: [90, 255, 140] });
  dotAt(C, [4.1, 1.5, -0.9], 'side', { n: [0, 0, -1], col: [255, 70, 60] });
  dotAt(C, [2.7, 1.9, 0], 'glow', {});
  return { parts, c0: 3, dots };
}

// ------------------------------------------------------------------ THE TUG (len 9.5) + THE FISHING TUG (len 8: the same build, its colours)
export function tugModel(len = 9.5, h = 5.2, fish = false) {
  const parts = [], k = len / 9.5;
  const A = a => a * k;
  const H = newPart('hull'); parts.push(H);
  const st = [{ a: 0.2, aw: 0.4, b: 1.55, bw: 1.35, h: 1.3 }, { a: 1.5, aw: 1.5, b: 1.7, bw: 1.5, h: 1.32 }, { a: 5, aw: 5, b: 1.75, bw: 1.55, h: 1.4 }, { a: 7.5, aw: 7.5, b: 1.55, bw: 1.3, h: 1.5 },
    { a: 8.6, aw: 8.4, b: 1.05, bw: 0.75, h: 1.62 }, { a: 9.3, aw: 8.75, b: 0.45, bw: 0.2, h: 1.75 }, { a: 9.6, aw: 8.85, b: 0.05, bw: 0.02, h: 1.8 }].map(s => ({ ...s, a: A(s.a), aw: A(s.aw) }));
  const hl = loft(H, st, [[-1, 0.75, 'hull'], [0.75, 1.25, 'band'], [1.25, 99, 'hull']], 'deck');
  if (!fish) for (const sg of [1, -1]) for (let a = 1; a < 8.3; a += 1.2) { const F = hl.faceAt(A(a), 1.0, sg), p = hl.at(A(a), 1.0, sg); ringS(F, p[0], 1.0, p[2] + 0.04 * sg, 0.24, 0.12, 'tyre', 8); }
  { const Fd = newPart('fender', { on: 'hull' }); parts.push(Fd); cylU(Fd, A(9.25), 0, 0.42, 0.45, 1.75, 8, 'fender'); }
  // the deckhouse (cream), the wheelhouse up top (its windows all round), the red roof band; the stack; the mast
  const D = newPart('house', { on: 'hull' }); parts.push(D);
  const dh = box(D, A(2.4), A(6.6), 1.3, 3.1, -1.25, 1.25, 'cream', { skip: ['bot'] });
  for (const [F, s] of [[dh.stbd, 1.25], [dh.port, -1.25]]) for (let a = 2.8; a < 4; a += 0.8) decS(F, A(a), A(a + 0.45), 2.2, 2.7, s, 'winDim', { win: true });
  const WH = newPart('wheelhouse', { on: 'house' }); parts.push(WH);
  const wh = box(WH, A(4.2), A(6.8), 3.1, 4.3, -1.05, 1.05, 'cream', { skip: ['bot', 'top'] });
  for (const [F, s] of [[wh.stbd, 1.05], [wh.port, -1.05]]) for (let a = 4.5; a < 6.6; a += 0.7) decS(F, A(a), A(a + 0.48), 3.5, 4.1, s, 'win', { win: true });
  for (let s = -0.85; s < 0.85; s += 0.58) decA(wh.fore, s, s + 0.44, 3.5, 4.1, A(6.8), 'win', { win: true });
  decA(wh.aft, -0.4, 0.4, 3.5, 4.1, A(4.2), 'win', { win: true });
  const RB = newPart('roof', { on: 'wheelhouse' }); parts.push(RB);
  box(RB, A(4.0), A(7.0), 4.27, 4.45, -1.18, 1.18, 'band');
  const K = newPart('stack', { on: 'house' }); parts.push(K);
  cylU(K, A(3.15), 0, 0.45, 3.1, 4.8, 10, 'buff');
  const KB = newPart('stackTop', { on: 'stack' }); parts.push(KB);
  cylU(KB, A(3.15), 0, 0.47, 4.8, 5.2, 10, 'hull');
  const KR = newPart('stackBand', { on: 'stack' }); parts.push(KR);
  cylU(KR, A(3.15), 0, 0.465, 4.3, 4.6, 10, 'band', { noTop: true });
  const M = newPart('mast', { on: 'roof' }); parts.push(M);
  line(M, [ID(A(6), 4.45, 0), ID(A(6), h + 1.4, 0)], 'hull', 0.08);
  const dots = [];
  dotAt(M, [A(6), h + 1.3, 0], 'mast', {}); dotAt(M, [A(6), h + 0.7, 0], 'mast', {});
  dotAt(H, [A(0.4), 2.2, 0], 'stern', { n: [-1, 0, 0] });
  dotAt(WH, [A(6.7), 3.75, 1.1], 'side', { n: [0, 0, 1], col: [90, 255, 140] });
  dotAt(WH, [A(6.7), 3.75, -1.1], 'side', { n: [0, 0, -1], col: [255, 70, 60] });
  dotAt(WH, [A(5.5), 4.6, 0], 'glow', {});
  if (fish) dotAt(H, [len - 0.35, 2.1, 0], 'lantern', {});
  return { parts, c0: len / 2, dots, smoke: fish ? [[A(3.15), 5.25, 0]] : null };
}

// ------------------------------------------------------------------ THE SLOOP (len 6.5, mast h 10): main + jib on the leeward side
/** o: { boom: radians off the centreline, side: +1 (the sails to starboard) | −1, luff: 0..1 (head to wind: the sails slack) } */
export function sailModel(len = 6.5, h = 10, o = {}) {
  const parts = [], side = o.side || 1, beta = o.boom ?? 0.35, m = 3.1;
  const H = newPart('hull'); parts.push(H);
  const st = [{ a: 0.2, aw: 0.8, b: 0.85, bw: 0.6, h: 0.9 }, { a: 1.5, aw: 1.5, b: 1.05, bw: 0.8, h: 0.92 }, { a: 3.5, aw: 3.5, b: 1.12, bw: 0.85, h: 0.95 }, { a: 5.0, aw: 5.0, b: 0.85, bw: 0.55, h: 0.98 },
    { a: 5.9, aw: 5.45, b: 0.4, bw: 0.15, h: 1.02 }, { a: 6.5, aw: 5.6, b: 0.03, bw: 0.01, h: 1.05 }];
  loft(H, st, [[-1, 0.48, 'hullW'], [0.48, 0.62, 'stripe'], [0.62, 99, 'hullW']], 'teak');
  const C = newPart('cabin', { on: 'hull' }); parts.push(C);
  box(C, 2.2, 3.8, 0.9, 1.35, -0.6, 0.6, 'cabinT');
  // the spars: the mast, the boom swung out to leeward, the forestay + backstay
  const S = newPart('spars', { on: 'cabin' }); parts.push(S);
  const bl = 2.4, bE = [m - bl * Math.cos(beta), 1.58, side * bl * Math.sin(beta)];
  line(S, [ID(m, 0.95, 0), ID(m, h, 0)], 'spar', 0.07);
  line(S, [ID(m, 1.6, 0), bE], 'spar', 0.06);
  line(S, [ID(m, h - 0.1, 0), ID(6.25, 1.1, 0)], 'stay', 0.025);
  line(S, [ID(m, h - 0.1, 0), ID(0.3, 0.95, 0)], 'stay', 0.025);
  // THE MAINSAIL: luff on the mast, foot on the boom, a curved leech (the roach) + a belly to leeward — 4 rows of 2 quads
  const MS = newPart('main', { on: 'spars', sort: true, two: true }); parts.push(MS);
  const head = [m, h - 0.2, 0], belly = 0.32 * (1 - (o.luff || 0)) * side;
  const nB = [Math.sin(beta) * side, 0, Math.cos(beta)];          // (the boom's sideways normal, toward leeward)
  const row = v => {
    const L = [m, 1.7 + (h - 1.9) * v, 0];
    const E0 = [bE[0] + (head[0] - bE[0]) * v, 1.68 + (head[1] - 1.68) * v, bE[2] * (1 - v)];
    const roach = 0.38 * Math.sin(PI * v) * (1 - v * 0.4);
    const E = [E0[0] - roach * Math.cos(beta), E0[1], E0[2] + roach * Math.sin(beta) * side];
    const Mm = [L[0] + (E[0] - L[0]) * 0.45 + nB[0] * 0 , L[1] + (E[1] - L[1]) * 0.45, L[2] + (E[2] - L[2]) * 0.45 + belly * (1 - v * 0.7) * Math.cos(beta)];
    return [L, Mm, E];
  };
  const rows = [0, 0.25, 0.5, 0.75, 1].map(row);
  for (let i = 0; i + 1 < rows.length; i++) for (let j = 0; j < 2; j++) face(MS, [rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]], 'sail', { two: true });
  for (let i = 1; i < 4; i++) { const r0 = rows[i]; line(MS, [r0[0], r0[1], r0[2]], 'seam', 0.02); }
  // THE JIB: tack at the stem, head up the forestay, its clew aft by the mast, to leeward
  const JB = newPart('jib', { on: 'spars', sort: true, two: true }); parts.push(JB);
  const T = [6.2, 1.15, 0], Hh = [m + 0.12, h - 0.9, 0], Cl = [m + 0.55 - 0.4 * Math.cos(beta), 1.5, side * (0.35 + 0.9 * Math.sin(beta))];
  const jr = v => { const Lv = [T[0] + (Hh[0] - T[0]) * v, T[1] + (Hh[1] - T[1]) * v, 0], Ev = [Cl[0] + (Hh[0] - Cl[0]) * v, Cl[1] + (Hh[1] - Cl[1]) * v, Cl[2] * (1 - v)];
    const Mv = [(Lv[0] + Ev[0]) / 2, (Lv[1] + Ev[1]) / 2, (Lv[2] + Ev[2]) / 2 + 0.22 * side * (1 - v) * (1 - (o.luff || 0))]; return [Lv, Mv, Ev]; };
  const jrows = [0, 0.33, 0.66, 1].map(jr);
  for (let i = 0; i + 1 < jrows.length; i++) for (let j = 0; j < 2; j++) face(JB, [jrows[i][j], jrows[i][j + 1], jrows[i + 1][j + 1], jrows[i + 1][j]], 'sail', { two: true });
  const dots = [];
  dotAt(H, [5.7, 1.15, 0.42], 'side', { n: [0, 0, 1], col: [90, 255, 140] });
  dotAt(H, [5.7, 1.15, -0.42], 'side', { n: [0, 0, -1], col: [255, 70, 60] });
  return { parts, c0: len / 2, dots };
}
