// THE STREET — the street's life, PURE (no DOM; docs/title.md "THE STREET"). district/furniture.js + street.js draw it.
//   streetLayout   where the lamps, the trees (each beside its own lamp), the bus shelter, the stop light(s) and the clear spot
//                  for THE SPEAKEASY'S DOOR stand — seeded, stable per size, clear of the side neon signs' bottoms
//   busGap / busSlot  the timetable: tied to the clock like the trains (rush hours often, a near-empty night owl, none 2–5 am)
//   signalAt       the stop light: green ~20 s, yellow 3 s, red ~20 s (seeded phase), flashing yellow ~1–5 am
//   carKind        the car mix by the hour (vans + trucks in the morning, cabs at night)
//   plowDue        snowplows only in real snow
//   lampLit        the street lamps' photocells: one by one around sunset, off one by one after sunrise

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
function rng(seed) { let a = Math.floor(hash(String(seed)) * 4294967296) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// sizes in points at K = 1 (a 390-pt phone); everything scales with K
export const SIZE = { lampH: 44, arm: 7, canopyW: 32, canopyH: 26, trunkH: 9, treeGap: 13, shelterW: 22, shelterH: 15, signalH: 40, signalArm: 13, doorW: 30 };

/** PURE: the street's furniture. o: { W, HZ, K, phone, seed, blades: [{x,w,bottom}] (the side neon signs), dockTop,
 *  signal: 'right'|'middle' }. Returns { lamps: [{x, side, tree?}], trees: [{x, lamp, cherry, w}], shelter: {x, w, side} | null,
 *  stopSign: {x}, signals: [{x}], door: {x, w} } — x in points, everything standing on the sidewalk line (HZ). */
export function streetLayout(o) {
  const { W, HZ, K = 1, phone = true, seed = 'street' } = o;
  const R = rng(`${seed}|${Math.round(W)}|${Math.round(HZ)}`);
  const tall = SIZE.lampH * K + 4;
  // the free sidewalk: everything minus the blade signs whose bottoms come down within the tallest piece's reach
  let free = [[4 * K, W - 4 * K]];
  const cut = (a, b) => { const out = []; for (const [x0, x1] of free) { if (b <= x0 || a >= x1) out.push([x0, x1]); else { if (a > x0) out.push([x0, a]); if (b < x1) out.push([b, x1]); } } free = out.filter(([x0, x1]) => x1 - x0 > 2); };
  for (const bl of o.blades || []) if (bl.bottom > HZ - tall) cut(bl.x - 5 * K, bl.x + bl.w + 5 * K);
  // THE SPEAKEASY'S DOOR (Part 2): a clear spot near the middle
  const door = { x: W / 2 + (R() - 0.5) * W * 0.06, w: SIZE.doorW * K };
  cut(door.x - door.w / 2, door.x + door.w / 2);
  const fits = (a, b) => free.some(([x0, x1]) => a >= x0 && b <= x1);
  // the stop light(s): a phone has one in the right third (or, if it doesn't fit there, right of the middle); a wide screen two
  const signals = [];
  const sigFoot = x => [x - (SIZE.signalArm + 3) * K, x + 3 * K];
  const placeSignal = (lo, hi) => {
    const cands = [];
    for (let x = lo; x <= hi; x += 2 * K) { const [a, b] = sigFoot(x); if (fits(a - 4 * K, b + 4 * K)) cands.push(x); }
    if (!cands.length) return null;
    const x = cands[Math.floor(R() * cands.length)];
    const [a, b] = sigFoot(x); cut(a - 3 * K, b + 3 * K);
    signals.push({ x });
    return x;
  };
  if (phone) {
    if (o.signal === 'middle' || placeSignal(W * 0.68, W - 8 * K) == null) placeSignal(W * 0.52, W * 0.66);
  } else { placeSignal(W * 0.2, W * 0.3); placeSignal(W * 0.72, W * 0.82); }
  // the units: a lamp with its tree (the trunk 10–16 pt from the post, on the side the arm reaches; the lamp head just above the
  // canopy's near edge), the shelter's pair (lamp | tree | shelter), lone lamps
  const lamps = [], trees = [];
  let shelter = null, stopSign = null;
  const pair = (withShelter) => {
    const side = R() < 0.5 ? 1 : -1;                       // which way the lamp's arm (and its tree) reaches
    const gap = (10 + 6 * R()) * K;                         // post → trunk
    const cw = (30 + 4 * R()) * K;
    const span = gap + cw / 2 + (withShelter ? (SIZE.shelterW + 6) * K : 0);
    return { side, gap, cw, span, withShelter };
  };
  const units = [];
  if (phone) {
    units.push(pair(true), pair(false));
    if (R() < 0.6) units.push(pair(false));
    units.push({ lone: true });
    if (units.length < 4) units.push({ lone: true });
  } else {
    const n = Math.max(5, Math.round(W / 200));
    units.push(pair(true));
    for (let i = 1; i < n; i++) units.push(i % 4 === 3 ? { lone: true } : pair(false));
    units.push({ lone: true }, { lone: true });
  }
  const place = (u) => {
    const left = u.lone ? 3 * K : u.side > 0 ? 4 * K : u.span + 4 * K;
    const right = u.lone ? 3 * K : u.side > 0 ? u.span + 4 * K : 4 * K;
    const want = u.withShelter ? (phone ? [0.2, 0.8] : [0.52, 0.68]) : [0, 1];
    // (the shelter's own centre must be in range: the bus pulls in there)
    const shelterAt = x => x + u.side * (u.gap + u.cw / 2 + (SIZE.shelterW / 2 + 2) * K);
    const cands = [];
    for (const [x0, x1] of free) for (let x = x0 + left; x <= x1 - right; x += 3 * K) { const c = u.withShelter ? shelterAt(x) : x; if (c >= W * want[0] && c <= W * want[1]) cands.push(x); }
    if (!cands.length) return false;
    // uneven but never bunched: prefer spots well away from the lamps already standing (relaxing if there's no room)
    const away = x => Math.min(Infinity, ...lamps.map(l => Math.abs(l.x - x)), ...signals.map(g => Math.abs(g.x - x) + 10 * K));
    const minGap = (phone ? 50 : 90) * K;
    let pool = cands.filter(x => away(x) >= minGap);
    if (!pool.length) pool = cands.filter(x => away(x) >= minGap * 0.6);
    if (!pool.length) { const best = Math.max(...cands.map(away)); pool = cands.filter(x => away(x) >= best - 6 * K); }
    const p = pool[Math.floor(R() * pool.length)];
    cut(p - left - 6 * K, p + right + 6 * K);                // (spacing: never a fence)
    const lamp = { x: p, side: u.lone ? (R() < 0.5 ? 1 : -1) : u.side, tree: null };
    lamps.push(lamp);
    if (!u.lone) {
      const tree = { x: p + u.side * u.gap, w: u.cw, lamp: null, cherry: false, lampRef: lamp };
      trees.push(tree); lamp.treeRef = tree;
      if (u.withShelter) {
        const sx = tree.x + u.side * (u.cw / 2 + (SIZE.shelterW / 2 + 2) * K);
        shelter = { x: sx, w: SIZE.shelterW * K, side: u.side };
        stopSign = { x: sx + u.side * (SIZE.shelterW / 2 + 3) * K };
      }
    }
    return true;
  };
  for (const u of units) if (!place(u) && !u.lone) place({ lone: true });
  // the cherry: one tree on a phone, one or two on a wide screen (never the shelter's)
  const cands = trees.map((t, i) => i).filter(i => !shelter || Math.abs(trees[i].x - shelter.x) > 30 * K);
  const pick = cands.length ? cands : trees.map((t, i) => i);
  if (pick.length) trees[pick[Math.floor(R() * pick.length)]].cherry = true;
  if (!phone && pick.length > 2) trees[pick[(Math.floor(R() * pick.length) + 1) % pick.length]].cherry = true;
  // left → right (the chase runs along them); each lamp knows its tree and each tree its lamp, by index
  lamps.sort((a, b) => a.x - b.x); trees.sort((a, b) => a.x - b.x);
  for (const l of lamps) { l.tree = l.treeRef ? trees.indexOf(l.treeRef) : null; delete l.treeRef; }
  for (const t of trees) { t.lamp = lamps.indexOf(t.lampRef); delete t.lampRef; }
  signals.sort((a, b) => a.x - b.x);
  return { lamps, trees, shelter, stopSign, signals, door, K };
}

/** PURE: minutes between buses at a local hour (Infinity from ~2 to ~5 am). owl: the near-empty night bus around 1 am. */
export function busGap(hr) {
  if (hr >= 2 && hr < 5) return Infinity;
  if (hr >= 0.5 && hr < 2) return 26;                         // the night owl
  if ((hr >= 7 && hr < 9.5) || (hr >= 16 && hr < 19)) return 5;
  if (hr >= 9.5 && hr < 16) return 8;
  if (hr >= 19 || hr < 0.5) return 11;
  return 13;                                                  // the first buses, 5–7 am
}
export const isOwlHour = hr => hr >= 0.5 && hr < 2;
/** PURE: which bus is due (an index that changes when the next one leaves), from the clock (ms) and the gap (minutes). */
export function busSlot(ms, gap, seed = 'bus') {
  if (!Number.isFinite(gap)) return null;
  return Math.floor(ms / 60000 / gap + hash(seed));
}

const ROUTES = ['12 UPTOWN', '4 RIVERSIDE', '7 HARBOR', '22 MIDTOWN', '9 UNION STN', '15 NEON DIST', '3 OLD TOWN', '18 WATERFRONT'];
const RARE = ['LAST CALL', 'NOT IN SERVICE'];
const PARTY = ['PARTY EXPRESS', 'AFTER HOURS', 'DANCE FLOOR 1', 'NEON NIGHT'];
/** PURE: the route sign for bus number n (seeded; party buses on party nights; the rare easter egg). */
export function busRoute(n, { party = false, owl = false } = {}) {
  const r = hash(`route|${n}`);
  if (party) return PARTY[Math.floor(r * PARTY.length)];
  if (hash(`egg|${n}`) < 0.03) return RARE[Math.floor(r * RARE.length)];
  if (owl) return 'N1 NIGHT OWL';
  return ROUTES[Math.floor(r * ROUTES.length)];
}

/** PURE: the stop light at clock time ms: { state: 'green'|'yellow'|'red'|'flash'|'dark', t (s into the state) }.
 *  Flashing yellow late at night (~1–5 am): on/off each second. offset: seconds (a second light, a green wave). */
export const SIGNAL = { green: 20, yellow: 3, red: 20 };
export function signalAt(ms, hr, { seed = 'signal', offset = 0 } = {}) {
  const s = ms / 1000 + hash(seed) * 43 + offset;
  if (hr >= 1 && hr < 5) return { state: (Math.floor(s) % 2) ? 'dark' : 'flash', t: s % 1 };
  const cyc = SIGNAL.green + SIGNAL.yellow + SIGNAL.red;
  const u = ((s % cyc) + cyc) % cyc;
  if (u < SIGNAL.green) return { state: 'green', t: u };
  if (u < SIGNAL.green + SIGNAL.yellow) return { state: 'yellow', t: u - SIGNAL.green };
  return { state: 'red', t: u - SIGNAL.green - SIGNAL.yellow };
}

/** PURE: what kind of vehicle a new car is (r: 0..1), weighted by the hour: vans + trucks in the morning, cabs at night. */
export const KINDS = ['sedan', 'suv', 'compact', 'van', 'pickup', 'truck', 'moto', 'cab', 'vintage'];
export function carWeights(hr, { party = false } = {}) {
  const w = { sedan: 0.38, suv: 0.2, compact: 0.14, van: 0.07, pickup: 0.05, truck: 0.022, moto: 0.03, cab: 0.1, vintage: 0.003 };
  if (hr >= 6 && hr < 10) { w.van *= 2.2; w.truck *= 2.6; w.pickup *= 1.4; }
  if (hr >= 21 || hr < 5) { w.cab *= party ? 2.8 : 2.2; w.truck *= 0.4; w.van *= 0.5; }
  return w;
}
export function carKind(r, hr, opts = {}) {
  const w = carWeights(hr, opts);
  const sum = KINDS.reduce((a, k) => a + w[k], 0);
  let acc = 0;
  for (const k of KINDS) { acc += w[k] / sum; if (r < acc) return k; }
  return 'sedan';
}

/** PURE: snowplows run during real snow only (the live weather), never in clear weather. Minutes between plows, or Infinity. */
export function plowDue(L) {
  if (!L || !L.live || !(L.snow >= 0.2)) return Infinity;
  return L.snow > 0.6 ? 4 : 7;
}

/** PURE: is lamp i on (its photocell)? On one by one around sunset (sun under ~1.5° … −0.3°), off one by one after sunrise
 *  (sun over ~0.5° … 2.3°). ALWAYS NIGHT: always on. d: the lamp's own delay 0..1 (seeded). */
export function lampLit(L, d = 0) {
  if (L.alwaysNight) return true;
  const el = L.sun ? L.sun.el : -30;
  const morning = (L.local ? L.local.h : 20) < 12;
  return morning ? el < 0.5 + 1.8 * clamp01(d) : el < 1.5 - 1.8 * clamp01(d);
}
