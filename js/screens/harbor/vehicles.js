// CITY 2.0 — THE HARBOR, POL4: THE VEHICLE KIT — the city's period motorcars (~1915–1935), shared by every road: the street under the
// dock (motorcar.js, the implied road's pass), the back road by the crossing (traffic.js) and 8b's police cars, cabs, the bootleggers'
// truck + the trash truck (new MODELS of the same shape). The owner (FP3b note 11 + POL4's add-on): "too CARTOONISH — rebuild them as
// late-1920s / early-1930s MOBSTER cars … a VARIETY … never the same car twice in a row … premium, readable at phone size".
//
// THE MODELS (side view, facing right; world units, 1 ≈ 0.85 m): each a set of numbers + a few style flags read by ONE painter:
//   modelT    the 1920s Ford Model T sedan — tall + upright, a flat brass-rimmed radiator, slim cycle fenders, wooden artillery wheels
//   modelA    the 1929 Ford Model A Tudor — a tall nickel radiator shell, a crowned roof, two-tone paint, wire wheels
//   packard   the big Packard / Cadillac sedan (the mobster's car) — a LONG louvred hood, a tall chrome shield grille with its vertical
//             bars, big headlamps on a bar + a pair of fog lamps, a SIDE-MOUNT spare in the front fender, chrome wire wheels on
//             whitewalls, a trunk on its rack, deep paint
//   roadster  a two-seat roadster with its top folded down + a RUMBLE SEAT behind (its lid open now and then, a passenger in it)
//   coupe     a close-coupled coupe — a short cabin, a long rear deck, a chrome strip along its belt
//   van       a panel delivery van — a tall box body with its trade lettered on the side (the bakery, the laundry, the ice man)
//   taxi      a Checker-style cab — yellow over black, the CHECKER BAND along its belt, the TAXI lamp on its roof
// THE LOOK (every model): deep GLOSSY paint (a lit shoulder band, the sky's reflection along the crown, a darker skirt), chrome glints
// (crisp white specks on the grille, the lamps' rims, the bumpers, the hub caps), panel seams + door handles, the windows mirroring the
// sky with a driver behind, the fenders sweeping into the running boards; at night deep tones lit by the street lamps (a 'lamp' look)
// with the lamps LIT (live: motorcar.js / traffic.js — headlamp cores + tight halos, the tail lamp an ember); party nights a few carry a
// soft NEON UNDERGLOW + lit trim (live — drawUnderglow).
// BAKED once per model + look + paint + size into a sprite (bodySprite) + a wheel sprite per wheel kind (wheelSprite: its still tyre +
// its turning part); only the wheels turn live.
import { safeCtx } from '../../ui/canvas-safe.js';
import { rgb, shade, mix } from './shapes.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** the paints (deep, glossy, period): body colours by name */
export const PAINT = Object.freeze({
  black: [22, 22, 28], maroon: [100, 22, 34], green: [24, 66, 44], navy: [26, 38, 76], niagara: [58, 90, 132], cream: [218, 204, 164],
  primrose: [216, 192, 112], burgundy: [76, 18, 30], taxi: [226, 178, 44], dairy: [226, 222, 204], forest: [36, 72, 50], grey: [96, 100, 108],
});
const BLACK = [20, 20, 26];

/**
 * THE MODELS: len, h (the roof), r (the wheels' radius), base (the wheelbase), ovR (the rear wheel's centre from the tail), sill (the
 * body's foot), belt (the belt line), hood (the hood's top), cowl (the windshield's foot, u), cab ([u0, u1] of the cabin's glass), rake
 * (the windshield's lean, u), roof ('hard' | 'box' | 'none' | 'van'), grille ('brass' | 'nickel' | 'shield'), fender ('cycle' | 'sweep'
 * | 'long'), wheel ('wood' | 'wire'), white (whitewalls), spare ('rear' | 'side'), paints ([[body, fenders, trim?], …]), extra flags
 */
export const MODELS = Object.freeze({
  modelT: { len: 4.05, h: 2.28, r: 0.5, base: 2.75, ovR: 0.7, sill: 0.72, belt: 1.4, hood: 1.44, cowl: 2.72, cab: [0.34, 2.62], rake: 0.02, roof: 'box', grille: 'brass', fender: 'cycle', wheel: 'wood', white: false, spare: 'rear', louvre: 0,
    paints: [['black', 'black'], ['green', 'black'], ['maroon', 'black']] },
  modelA: { len: 4.5, h: 2.08, r: 0.46, base: 3.0, ovR: 0.78, sill: 0.64, belt: 1.38, hood: 1.42, cowl: 2.86, cab: [0.46, 2.72], rake: 0.12, roof: 'hard', grille: 'nickel', fender: 'sweep', wheel: 'wire', white: false, spare: 'rear', louvre: 14,
    paints: [['niagara', 'black', 'cream'], ['green', 'black', 'cream'], ['primrose', 'black', 'black'], ['maroon', 'black', 'cream']] },
  packard: { len: 5.85, h: 2.12, r: 0.5, base: 4.0, ovR: 0.86, sill: 0.64, belt: 1.42, hood: 1.48, cowl: 3.62, cab: [0.66, 3.5], rake: 0.14, roof: 'hard', grille: 'shield', fender: 'long', wheel: 'wire', white: true, spare: 'side', louvre: 22, trunk: true, fog: true,
    paints: [['black', 'black'], ['maroon', 'maroon'], ['green', 'green'], ['navy', 'navy'], ['burgundy', 'black']] },
  roadster: { len: 4.6, h: 1.62, r: 0.46, base: 3.06, ovR: 0.8, sill: 0.62, belt: 1.32, hood: 1.4, cowl: 2.96, cab: [1.9, 2.86], rake: 0.1, roof: 'none', grille: 'nickel', fender: 'sweep', wheel: 'wire', white: true, spare: 'side', louvre: 14, rumble: true,
    paints: [['cream', 'maroon'], ['primrose', 'black'], ['maroon', 'black'], ['niagara', 'navy']] },
  coupe: { len: 4.55, h: 1.98, r: 0.46, base: 3.04, ovR: 0.8, sill: 0.64, belt: 1.36, hood: 1.42, cowl: 2.94, cab: [1.5, 2.8], rake: 0.13, roof: 'hard', grille: 'nickel', fender: 'sweep', wheel: 'wire', white: false, spare: 'rear', louvre: 14, deck: true,
    paints: [['black', 'black', 'cream'], ['grey', 'black', 'maroon'], ['niagara', 'black', 'cream'], ['green', 'black', 'cream']] },
  van: { len: 5.05, h: 2.6, r: 0.48, base: 3.25, ovR: 0.86, sill: 0.68, belt: 1.42, hood: 1.46, cowl: 3.6, cab: [3.0, 3.52], rake: 0.06, roof: 'van', grille: 'nickel', fender: 'sweep', wheel: 'wood', white: false, spare: 'none', louvre: 10,
    paints: [['dairy', 'black', 'forest'], ['forest', 'black', 'cream'], ['navy', 'black', 'cream'], ['maroon', 'black', 'cream']], trades: ['HARBOR DAIRY', 'BAKERY', 'ICE CO.', 'LAUNDRY'] },
  taxi: { len: 4.85, h: 2.18, r: 0.47, base: 3.2, ovR: 0.82, sill: 0.66, belt: 1.4, hood: 1.44, cowl: 3.16, cab: [0.5, 3.02], rake: 0.08, roof: 'hard', grille: 'nickel', fender: 'sweep', wheel: 'wood', white: false, spare: 'rear', louvre: 12, checker: true, taxiSign: true,
    paints: [['taxi', 'black', 'black']] },
  // 8b1 — THE WORKERS' TRUCKS (roof 'cab': a closed cab behind the hood + a BED behind it): the city's DUMP TRUCK (a riveted steel body
  // with its ribs, CITY SANITATION stencilled on it) + the bootleggers' STAKE TRUCK (wooden stakes + a canvas tarp lashed over the load)
  dump: { len: 6.0, h: 2.32, r: 0.5, base: 3.75, ovR: 1.02, sill: 0.74, belt: 1.44, hood: 1.5, cowl: 4.62, cab: [3.62, 4.5], rake: 0.04, roof: 'cab', grille: 'nickel', fender: 'cycle', wheel: 'wood', white: false, spare: 'none', louvre: 8,
    bed: { u0: 0.1, u1: 3.48, v1: 2.42, kind: 'dump' }, paints: [['forest', 'black', 'cream'], ['grey', 'black', 'cream']], trades: ['CITY SANITATION'] },
  stake: { len: 6.25, h: 2.26, r: 0.5, base: 3.95, ovR: 1.05, sill: 0.74, belt: 1.44, hood: 1.5, cowl: 4.86, cab: [3.86, 4.74], rake: 0.04, roof: 'cab', grille: 'brass', fender: 'cycle', wheel: 'wood', white: false, spare: 'none', louvre: 8,
    bed: { u0: 0.1, u1: 3.72, v1: 2.5, kind: 'tarp' }, paints: [['black', 'black'], ['green', 'black']] },
});
export const MODEL_IDS = Object.freeze(Object.keys(MODELS));
/** 8b1: the paint a slot wears AFTER DARK — the VAN's pale body (luminance > 150: the cream dairy livery) steps on to its next deep
 *  paint (a big pale panel reads as a flat grey box at night; the sedans' small cream / primrose bodies read fine); every other paint
 *  unchanged. PURE (tests/harbor-traffic.test.mjs) */
export function nightPaint(id, paint) {
  const M = MODELS[id] || MODELS.modelA, n = M.paints.length, lum = p => 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2];
  if (M.roof !== 'van') return paint;
  for (let k = 0; k < n; k++) { const i = (((paint + k) % n) + n) % n; if (lum(PAINT[M.paints[i][0]]) <= 150) return i; }
  return paint;
}
/** the order the models take on a road (a fixed cycle, stepped on every seventh pass: never the same model twice in a row) */
/** the order the models take on a road (a fixed cycle, stepped on at the end of every lap: never the same model twice in a row on
 *  consecutive slots). THE BACK ROAD takes all seven; THE STREET under the dock only the ones whose roof stays under the dock's top
 *  (its lanes are planned for a 1928 sedan's height — the Model T + the van stand too tall there) */
export const SEQ = Object.freeze({ back: ['packard', 'modelA', 'taxi', 'roadster', 'modelT', 'coupe', 'van'], street: ['packard', 'modelA', 'taxi', 'roadster', 'coupe'] });
/** the vehicle for slot n (an integer) on a road ('back' | 'street'): { model, paint (index into its paints), trade, rumble } — PURE,
 *  the same on every phone; slot n and n + 1 never share a model (nor n + 2 … n + L − 1 for a cycle of L) */
export function vehicleFor(n, road = 'back', salt = 0) {
  const Q = SEQ[road] || SEQ.back, L = Q.length, i = Math.floor(n), m = Q[(((i + Math.floor(i / L)) % L) + L) % L], M = MODELS[m];
  const h = (Math.imul(i ^ 0x5bd1e995, 2654435761) ^ Math.imul(salt + 7, 40503)) >>> 0;
  return { model: m, paint: h % M.paints.length, trade: M.trades ? (h >>> 4) % M.trades.length : 0, rumble: !!M.rumble && (h >>> 7) % 3 === 0 };
}

/** the look's colours: the paint's multiplier, what its gloss mirrors (the sky / the sun / a lamp), the glass, the chrome (day / golden /
 *  night / lamp: night under a street lamp) */
export function lookOf(name, paint) {
  if (name === 'day') return { name, p: paint, hi: [206, 224, 246], hiA: 0.42, sun: [255, 250, 236], glassT: [150, 172, 200], glassB: [52, 62, 84], bk: BLACK, bkHi: [170, 186, 210], chrome: [218, 224, 234], chromeLo: [92, 98, 112], spoke: [226, 206, 160], tyre: [18, 18, 22], white: [232, 232, 226] };
  if (name === 'golden') return { name, p: mix(paint, [255, 160, 110], 0.12), hi: [255, 196, 150], hiA: 0.42, sun: [255, 214, 160], glassT: [236, 170, 140], glassB: [70, 50, 60], bk: [26, 20, 24], bkHi: [236, 160, 120], chrome: [246, 206, 166], chromeLo: [110, 80, 76], spoke: [236, 192, 140], tyre: [20, 16, 18], white: [244, 214, 182] };
  const lit = name === 'lamp';
  return { name, p: mix(shade(paint, lit ? -0.36 : -0.58), [40, 44, 80], lit ? 0.08 : 0.22), hi: lit ? [255, 200, 140] : [96, 104, 150], hiA: lit ? 0.42 : 0.32, sun: lit ? [255, 214, 160] : [120, 128, 170], glassT: lit ? [96, 76, 70] : [40, 44, 70], glassB: [10, 11, 20], bk: [10, 10, 16], bkHi: lit ? [230, 170, 110] : [84, 92, 136], chrome: lit ? [224, 186, 140] : [104, 108, 140], chromeLo: [30, 30, 44], spoke: lit ? [150, 120, 90] : [70, 66, 80], tyre: [8, 8, 12], white: lit ? [170, 150, 130] : [80, 82, 100] };
}

/** where a model's lamps are (u from the tail, v up — world units) + the wheels' centres (u) + the sprite's extent */
export function anatomy(id) {
  const M = MODELS[id] || MODELS.modelA, rw = M.ovR, fw = M.ovR + M.base;
  const nose = M.len - (M.grille === 'shield' ? 0.12 : 0.16);
  return {
    wheels: [rw, fw], head: [M.len - 0.06, M.hood - 0.32], fog: M.fog ? [M.len + 0.02, M.sill - 0.02] : null, tail: [0.1, M.belt - 0.36],
    nose, top: M.h + (M.taxiSign ? 0.34 : 0.06), pad: 0.36, len: M.len, h: M.h, r: M.r,
  };
}

// ------------------------------------------------------------------ THE BODY (baked)
/** the body (everything but the turning wheels) at s px a unit, facing right; o: { trade, rumble } → canvas */
export function bodySprite(id, s, K, o = {}) {
  const M = MODELS[id] || MODELS.modelA, A = anatomy(id), PAD = A.pad, TOP = A.top + 0.06;
  const W = Math.ceil((M.len + PAD * 2) * s), H = Math.ceil((TOP + 0.12) * s), cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = safeCtx(cv); if (!x) return cv;
  const X = u => (u + PAD) * s, Y = v => (TOP - v) * s, lw = v => Math.max(0.6, v * s);
  const p = K.p, fendC = o.fender || K.bk, trimC = o.trim || null;
  const [rw, fw] = A.wheels, R = M.r;
  // ---- the spare on the back (a tyre in its carrier, a nickel hub plate) — or the trunk on its rack (the Packard)
  if (M.trunk) {
    x.fillStyle = rgb(shade(K.bk, 0.04)); x.beginPath(); x.roundRect(X(-0.3), Y(1.36), 0.36 * s, 0.6 * s, 0.06 * s); x.fill();
    x.strokeStyle = rgb(K.bkHi, 0.5); x.lineWidth = lw(0.02); x.beginPath(); x.moveTo(X(-0.27), Y(1.3)); x.lineTo(X(0.02), Y(1.3)); x.stroke();
    x.fillStyle = rgb(K.chrome, 0.8); for (const v of [1.1, 0.88]) x.fillRect(X(-0.32), Y(v), 0.4 * s, Math.max(0.5, 0.025 * s));
  } else if (M.spare === 'rear') {
    x.fillStyle = rgb(K.tyre); x.beginPath(); x.roundRect(X(-0.28), Y(M.belt - 0.08), 0.32 * s, (M.belt - 0.5) * s, 0.15 * s); x.fill();
    x.strokeStyle = rgb(shade(K.bkHi, -0.3), 0.7); x.lineWidth = lw(0.025); x.beginPath(); x.roundRect(X(-0.23), Y(M.belt - 0.14), 0.22 * s, (M.belt - 0.62) * s, 0.1 * s); x.stroke();
    x.fillStyle = rgb(K.chrome, 0.85); x.beginPath(); x.roundRect(X(-0.17), Y((M.belt + 0.42) / 2 + 0.05), 0.1 * s, 0.12 * s, 0.03 * s); x.fill();
  }
  // ---- the chassis' dark valance under the body (the frame rail, the splash aprons)
  x.fillStyle = rgb(shade(K.bk, 0.05)); x.fillRect(X(0.24), Y(M.sill), (M.len - 0.5) * s, 0.22 * s);
  // ---- THE BODY: one silhouette (the tail, the roof / the open tub, the windshield, the cowl, the hood, the radiator)
  const g = x.createLinearGradient(0, Y(M.h), 0, Y(M.sill - 0.04));
  const st = (v, c) => g.addColorStop(clamp01((M.h - v) / (M.h - M.sill + 0.04)), rgb(c));
  st(M.h, p); st(M.belt + 0.22, p); st(M.belt + 0.06, mix(p, K.hi, 0.18)); st(M.belt + 0.01, mix(p, K.hi, K.hiA)); st(M.belt - 0.03, shade(p, -0.22)); st(M.belt - 0.12, mix(p, K.hi, 0.2)); st((M.belt + M.sill) / 2, p); st(M.sill - 0.04, shade(p, -0.4));
  const rU = M.len - (M.grille === 'shield' ? 0.24 : 0.18);       // the radiator's back face (the hood ends here)
  const shell = () => {
    x.beginPath();
    const tail = 0.1, top = M.h;
    x.moveTo(X(tail + 0.12), Y(M.sill - 0.02));
    if (M.roof === 'cab') {
      // (8b1) the truck's closed cab: its back wall straight up behind the bed, a flat roof, the windshield
      const b0 = M.cab[0] - 0.12; x.lineTo(X(b0), Y(M.sill - 0.02)); x.lineTo(X(b0), Y(top - 0.1)); x.quadraticCurveTo(X(b0), Y(top), X(b0 + 0.12), Y(top));
      const r1 = M.cab[1] - 0.04;
      x.lineTo(X(r1 - 0.12), Y(top)); x.quadraticCurveTo(X(r1 - 0.02), Y(top - 0.01), X(r1 + 0.02), Y(top - 0.08));
      x.lineTo(X(M.cowl + M.rake), Y(M.hood + 0.04));
    } else if (M.roof === 'van') {
      // the box: square-ish, its top a gentle crown, the cab's roof stepping down to the windshield
      x.lineTo(X(0.04), Y(M.sill + 0.2)); x.lineTo(X(0.02), Y(top - 0.12)); x.quadraticCurveTo(X(0.04), Y(top), X(0.2), Y(top));
      x.lineTo(X(M.cab[0] - 0.08), Y(top)); x.quadraticCurveTo(X(M.cab[0] + 0.04), Y(top), X(M.cab[0] + 0.06), Y(top - 0.14));
      x.lineTo(X(M.cab[0] + 0.1), Y(M.h - 0.24)); x.lineTo(X(M.cab[1] - 0.05), Y(M.h - 0.26)); x.quadraticCurveTo(X(M.cab[1] + 0.02), Y(M.h - 0.28), X(M.cab[1] + 0.04), Y(M.h - 0.34));
      x.lineTo(X(M.cowl + M.rake), Y(M.hood + 0.04));
    } else if (M.roof === 'none') {
      // the open tub: a rounded tail with the rumble seat's deck, the cockpit's rim, the cowl
      x.bezierCurveTo(X(0.0), Y(M.sill + 0.3), X(0.0), Y(M.belt + 0.04), X(0.34), Y(M.belt + 0.1));
      x.lineTo(X(M.cab[0] - 0.1), Y(M.belt + 0.12)); x.quadraticCurveTo(X(M.cab[0]), Y(M.belt + 0.14), X(M.cab[0] + 0.12), Y(M.belt + 0.06));
      x.lineTo(X(M.cowl - 0.06), Y(M.belt + 0.06)); x.quadraticCurveTo(X(M.cowl + 0.04), Y(M.belt + 0.12), X(M.cowl + 0.12), Y(M.hood + 0.04));
    } else {
      const box = M.roof === 'box', deck = M.deck;
      if (deck) {
        // the coupe's long rear deck, then the short cabin
        // (a rounded TURTLE DECK falling to the tail — never a flat bed: a flat one read as a pickup at phone size)
        x.bezierCurveTo(X(-0.02), Y(M.sill + 0.34), X(0.04), Y(M.belt + 0.18), X(0.5), Y(M.belt + 0.4));
        x.bezierCurveTo(X(0.9), Y(M.belt + 0.56), X(M.cab[0] - 0.28), Y(M.belt + 0.54), X(M.cab[0] - 0.12), Y(M.belt + 0.5));
        x.bezierCurveTo(X(M.cab[0] - 0.02), Y(top - 0.08), X(M.cab[0] + 0.12), Y(top), X(M.cab[0] + 0.36), Y(top));
      } else if (box) {
        // the Model T: an upright box — a near-vertical tail, a flat roof with a little overhang
        x.lineTo(X(0.06), Y(M.sill + 0.16)); x.lineTo(X(0.06), Y(top - 0.12)); x.quadraticCurveTo(X(0.06), Y(top), X(0.2), Y(top + 0.02));
      } else {
        x.lineTo(X(0.1), Y(M.belt - 0.2)); x.bezierCurveTo(X(0.04), Y(M.belt + 0.3), X(0.14), Y(top - 0.12), X(0.46), Y(top - 0.04));
        x.quadraticCurveTo(X(0.64), Y(top), X(0.94), Y(top));
      }
      const r1 = M.cab[1] - 0.04;
      x.lineTo(X(r1 - 0.12), Y(top)); x.quadraticCurveTo(X(r1 - 0.02), Y(top - 0.01), X(r1 + 0.02), Y(top - 0.08));
      x.lineTo(X(M.cowl + M.rake), Y(M.hood + 0.04));
    }
    // the hood to the radiator, the radiator's face down to the apron
    x.lineTo(X(rU), Y(M.hood)); x.lineTo(X(rU + 0.02), Y(M.hood + 0.05)); x.lineTo(X(M.len - 0.04), Y(M.hood + 0.04)); x.lineTo(X(M.len - 0.02), Y(M.sill - 0.02));
    x.closePath();
  };
  if (M.bed) truckBed(x, X, Y, s, K, M, o);
  x.fillStyle = g; shell(); x.fill();
  // the roof's top: a black leatherette crown (the sedans), the van's box the body colour
  if (M.roof === 'hard' || M.roof === 'box' || M.roof === 'cab') {
    x.save(); shell(); x.clip(); x.fillStyle = rgb(K.bk); x.fillRect(X(-0.1), Y(M.h + 0.1), (M.cab[1] + 0.2) * s, 0.24 * s); x.restore();
    x.strokeStyle = rgb(K.bkHi, 0.55); x.lineWidth = lw(0.025); x.beginPath(); x.moveTo(X(M.cab[0] + 0.3), Y(M.h - 0.03)); x.quadraticCurveTo(X((M.cab[0] + M.cab[1]) / 2), Y(M.h - 0.01), X(M.cab[1] - 0.2), Y(M.h - 0.03)); x.stroke();
    // the sun visor over the windshield
    x.fillStyle = rgb(K.bk); x.beginPath(); x.moveTo(X(M.cab[1] - 0.08), Y(M.h - 0.06)); x.lineTo(X(M.cab[1] + 0.14), Y(M.h - 0.1)); x.lineTo(X(M.cab[1] + 0.13), Y(M.h - 0.13)); x.lineTo(X(M.cab[1] - 0.06), Y(M.h - 0.12)); x.closePath(); x.fill();
  }
  // TWO-TONE: the trim colour on the belt panel (the Model A's cream stripe, the coupe's maroon) / THE CHECKER BAND (the cab)
  if (M.checker) {
    const v0 = M.belt - 0.2, v1 = M.belt - 0.02, n = Math.round((M.cowl - 0.3) / 0.12);
    x.save(); shell(); x.clip();
    for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { x.fillStyle = rgb((i + j) % 2 ? mix([238, 236, 228], K.p, 0.12) : shade(K.bk, 0.1)); x.fillRect(X(0.2 + i * 0.12), Y(v1 - j * 0.09), 0.12 * s + 0.5, 0.09 * s + 0.5); }
    x.restore();
  } else if (trimC) {
    x.save(); shell(); x.clip(); x.fillStyle = rgb(trimC); x.fillRect(X(0), Y(M.belt + 0.02), M.len * s, 0.07 * s); x.restore();
  }
  // ---- THE WINDOWS: the glass mirroring the sky, the driver behind the front one (+ a passenger in the back on the big sedans)
  if (M.roof !== 'none') {
    const v1 = M.h - (M.roof === 'van' ? 0.32 : 0.12), v0 = M.belt + 0.1, h = v1 - v0;
    const panes = M.roof === 'van' ? [[M.cab[0] + 0.16, M.cab[1] - 0.04, true]] : M.roof === 'cab' ? [[M.cab[0] + 0.06, M.cab[1] - 0.06, true]] : M.deck ? [[M.cab[0] + 0.2, M.cab[1] - 0.06, true]]
      : M.roof === 'box' ? [[0.32, 1.32, false], [1.42, M.cab[1] - 0.06, true]] : id === 'packard' ? [[0.62, 1.6, false], [1.7, 2.6, 'p'], [2.7, M.cab[1] - 0.06, true]] : [[0.56, 1.74, false], [1.86, M.cab[1] - 0.06, true]];
    for (const [u0, u1, drv] of panes) {
      const rr = [0.03 * s, u1 > M.cab[1] - 0.2 ? 0.1 * s : 0.03 * s, 0.03 * s, 0.03 * s];
      x.save(); x.beginPath(); x.roundRect(X(u0), Y(v1), (u1 - u0) * s, h * s, rr); x.clip();
      x.fillStyle = rgb(mix(K.glassB, K.glassT, 0.25)); x.fillRect(X(u0), Y(v1), (u1 - u0) * s, h * s);
      if (drv) { const hx = drv === 'p' ? (u0 + u1) / 2 : u1 - 0.36; figure(x, X, Y, s, hx, v0, shade(K.glassB, -0.4), K.hi, drv !== 'p'); }
      const gg = x.createLinearGradient(0, Y(v1), 0, Y(v0)); gg.addColorStop(0, rgb(K.glassT, 0.75)); gg.addColorStop(1, rgb(K.glassB, 0.35));
      x.fillStyle = gg; x.fillRect(X(u0), Y(v1), (u1 - u0) * s, h * s);
      x.fillStyle = rgb(K.sun, 0.22); x.beginPath(); x.moveTo(X(u0 + 0.18), Y(v1)); x.lineTo(X(u0 + 0.34), Y(v1)); x.lineTo(X(u0 + 0.12), Y(v0)); x.lineTo(X(u0 - 0.04), Y(v0)); x.closePath(); x.fill();
      x.restore();
      x.strokeStyle = rgb(K.chrome, 0.6); x.lineWidth = lw(0.018); x.beginPath(); x.roundRect(X(u0), Y(v1), (u1 - u0) * s, h * s, rr); x.stroke();
    }
  } else {
    // THE ROADSTER: the windshield's frame + glass (edge-on, raked), the driver in the open cockpit, the folded top behind him, the
    // rumble seat's lid (open: a passenger in it)
    const wv = M.belt + 0.62;
    x.strokeStyle = rgb(K.chrome); x.lineWidth = lw(0.035); x.beginPath(); x.moveTo(X(M.cab[1] + 0.02), Y(M.belt + 0.08)); x.lineTo(X(M.cab[1] - 0.06), Y(wv)); x.stroke();
    x.fillStyle = rgb(K.glassT, 0.28); x.beginPath(); x.moveTo(X(M.cab[1] + 0.02), Y(M.belt + 0.08)); x.lineTo(X(M.cab[1] - 0.06), Y(wv)); x.lineTo(X(M.cab[1] - 0.16), Y(wv)); x.lineTo(X(M.cab[1] - 0.08), Y(M.belt + 0.08)); x.closePath(); x.fill();
    const open = K.name === 'day' || K.name === 'golden', skin = open ? (K.name === 'golden' ? [236, 170, 130] : [222, 182, 150]) : null;
    figure(x, X, Y, s, M.cab[1] - 0.5, M.belt - 0.06, open ? [52, 46, 48] : shade(K.bk, 0.06), K.hi, true, 'man', skin, open ? [70, 60, 50] : null);
    // the folded top: a black canvas bundle on its bows behind the seat
    x.fillStyle = rgb(K.bk); x.beginPath(); x.ellipse(X(M.cab[0] - 0.08), Y(M.belt + 0.2), 0.34 * s, 0.13 * s, -0.08, 0, TAU); x.fill();
    x.strokeStyle = rgb(K.bkHi, 0.5); x.lineWidth = lw(0.02); x.beginPath(); x.ellipse(X(M.cab[0] - 0.08), Y(M.belt + 0.22), 0.28 * s, 0.08 * s, -0.08, Math.PI * 1.1, Math.PI * 1.9); x.stroke();
    if (o.rumble) {
      // the lid swung up as a back rest, a passenger's head + shoulders above it
      x.fillStyle = rgb(shade(p, -0.15)); x.beginPath(); x.moveTo(X(0.42), Y(M.belt + 0.1)); x.lineTo(X(0.34), Y(M.belt + 0.62)); x.lineTo(X(0.5), Y(M.belt + 0.64)); x.lineTo(X(0.6), Y(M.belt + 0.12)); x.closePath(); x.fill();
      figure(x, X, Y, s, 0.86, M.belt - 0.08, open ? [120, 40, 52] : shade(K.bk, 0.04), K.hi, false, 'lady', skin, open ? [40, 30, 34] : null);
    } else { x.strokeStyle = rgb(shade(p, -0.4)); x.lineWidth = lw(0.016); x.beginPath(); x.moveTo(X(0.38), Y(M.belt + 0.09)); x.lineTo(X(1.2), Y(M.belt + 0.11)); x.stroke(); }
  }
  if (id === 'packard') { x.strokeStyle = rgb(K.chrome); x.lineWidth = lw(0.035); x.beginPath(); x.moveTo(X(0.34), Y(M.belt + 0.42)); x.bezierCurveTo(X(0.64), Y(M.belt + 0.48), X(0.4), Y(M.belt + 0.12), X(0.72), Y(M.belt + 0.14)); x.stroke(); x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(X(0.4), Y(M.belt + 0.44), Math.max(0.4, 0.04 * s), Math.max(0.4, 0.015 * s)); }
  // ---- the doors (their seams + the handle), the belt moulding (a fine pinstripe), the cowl's vent
  x.strokeStyle = rgb(shade(p, -0.45), 0.9); x.lineWidth = lw(0.016);
  const doors = M.roof === 'van' || M.roof === 'cab' ? [[M.cab[0] + 0.0, M.cowl - 0.04]] : M.roof === 'none' || M.deck ? [[M.cab[0] + 0.02, M.cowl - 0.06]] : M.roof === 'box' ? [[1.38, M.cowl - 0.06]] : id === 'packard' ? [[0.96, 2.0], [2.1, M.cowl - 0.06]] : [[1.8, M.cowl - 0.06]];
  for (const [a, b] of doors) {
    x.beginPath(); x.moveTo(X(a), Y(M.sill + 0.04)); x.lineTo(X(a), Y(M.roof === 'none' ? M.belt + 0.06 : M.h - 0.14)); x.moveTo(X(b), Y(M.sill + 0.04)); x.lineTo(X(b), Y(M.roof === 'none' ? M.belt + 0.06 : M.h - 0.16)); x.moveTo(X(a), Y(M.sill + 0.04)); x.lineTo(X(b), Y(M.sill + 0.04)); x.stroke();
    x.fillStyle = rgb(K.chrome); x.fillRect(X(a + 0.07), Y(M.belt - 0.08), 0.13 * s, Math.max(0.6, 0.03 * s));
    x.fillStyle = rgb([255, 255, 255], 0.7); x.fillRect(X(a + 0.08), Y(M.belt - 0.08), Math.max(0.4, 0.03 * s), Math.max(0.4, 0.012 * s));   // (its glint)
  }
  if (!M.checker) { x.fillStyle = rgb(trimC ? mix(trimC, K.hi, 0.2) : mix(p, [236, 220, 170], 0.5), 0.85); x.fillRect(X(0.16), Y(M.belt - 0.005), (rU - 0.2) * s, Math.max(0.5, 0.014 * s)); }
  if (M.deck) { x.fillStyle = rgb(K.chrome, 0.85); x.fillRect(X(0.2), Y(M.belt - 0.16), (rU - 0.3) * s, Math.max(0.5, 0.02 * s)); }   // (the coupe's chrome strip)
  // THE VAN's trade, lettered on its box (gilt, shadowed — a sign-writer's hand)
  if (M.roof === 'van') {
    const word = o.word || (M.trades || [''])[o.trade || 0], cx = X(M.cab[0] / 2 + 0.05), cy = Y((M.belt + M.h) / 2 - 0.06), size = 0.36 * s;
    x.save(); x.font = `800 ${size}px "Chakra Petch", Orbitron, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    const tw = x.measureText(word).width, sq = Math.min(1, (M.cab[0] - 0.36) * s / Math.max(1, tw));
    x.translate(cx, cy); x.scale(sq, 1);
    x.fillStyle = rgb(shade(p, -0.5), 0.9); x.fillText(word, 0.03 * s, 0.03 * s);
    x.fillStyle = rgb(trimC || [214, 170, 82]); x.fillText(word, 0, 0); x.restore();
    x.strokeStyle = rgb(trimC || [214, 170, 82], 0.8); x.lineWidth = lw(0.016); x.strokeRect(X(0.2), Y(M.h - 0.24), (M.cab[0] - 0.36) * s, (M.h - 0.24 - M.belt + 0.1) * s);
  }
  // ---- THE LONG HOOD: its hinge line + the LOUVRES (lit edges), the cowl lamps (the Packard)
  x.strokeStyle = rgb(shade(p, -0.35)); x.lineWidth = lw(0.014); x.beginPath(); x.moveTo(X(M.cowl + M.rake + 0.02), Y(M.hood - 0.06)); x.lineTo(X(rU - 0.02), Y(M.hood - 0.07)); x.stroke();
  if (M.louvre) {
    const span = Math.min(rU - M.cowl - 0.4, M.louvre * 0.07), u0 = rU - 0.22 - span, step = span / M.louvre;
    for (let i = 0; i < M.louvre; i++) {
      const u = u0 + i * step;
      x.fillStyle = rgb(shade(p, -0.5)); x.fillRect(X(u), Y(M.hood - 0.16), Math.max(0.5, 0.02 * s), 0.34 * s);
      x.fillStyle = rgb(mix(p, K.hi, 0.55), 0.6); x.fillRect(X(u + 0.022), Y(M.hood - 0.16), Math.max(0.4, 0.012 * s), 0.34 * s);
    }
  }
  // ---- THE RADIATOR: the T's flat black core in a brass rim / the A's tall nickel shell / the big sedan's chrome SHIELD with its bars
  const ry0 = M.sill - 0.04, ry1 = M.hood + 0.04;
  if (M.grille === 'brass') {
    const brass = mix([196, 150, 64], K.chrome, 0.25);
    x.fillStyle = rgb(brass); x.fillRect(X(M.len - 0.16), Y(ry1 + 0.02), 0.16 * s, (ry1 - ry0 + 0.02) * s);
    x.fillStyle = rgb(K.bk); x.fillRect(X(M.len - 0.12), Y(ry1 - 0.04), 0.09 * s, (ry1 - ry0 - 0.1) * s);
    x.fillStyle = rgb(brass); x.beginPath(); x.roundRect(X(M.len - 0.13), Y(ry1 + 0.1), 0.08 * s, 0.07 * s, 0.02 * s); x.fill();   // (its cap)
  } else {
    const shieldW = M.grille === 'shield' ? 0.24 : 0.17, a = M.len - shieldW;
    const rg = x.createLinearGradient(0, Y(ry1), 0, Y(ry0));
    rg.addColorStop(0, rgb(K.chrome)); rg.addColorStop(0.4, rgb(K.chromeLo)); rg.addColorStop(0.52, rgb(mix(K.chrome, [255, 255, 255], 0.3))); rg.addColorStop(1, rgb(K.chromeLo));
    x.fillStyle = rg; x.beginPath(); x.moveTo(X(a), Y(ry1)); x.lineTo(X(M.len - 0.02), Y(ry1 - 0.01)); x.lineTo(X(M.len), Y(ry0)); x.lineTo(X(a + 0.04), Y(ry0)); x.closePath(); x.fill();
    if (M.grille === 'shield') {
      // the shield's vertical bars (seen edge-on: fine dark lines on the bright shell) + the mascot on the cap
      x.fillStyle = rgb(K.chromeLo, 0.8); for (let i = 1; i < 4; i++) x.fillRect(X(a + i * shieldW / 4), Y(ry1 - 0.04), Math.max(0.4, 0.012 * s), (ry1 - ry0 - 0.08) * s);
      x.fillStyle = rgb(K.chrome); x.beginPath(); x.moveTo(X(M.len - 0.16), Y(ry1 + 0.02)); x.quadraticCurveTo(X(M.len - 0.1), Y(ry1 + 0.24), X(M.len - 0.02), Y(ry1 + 0.18)); x.lineTo(X(M.len - 0.06), Y(ry1 + 0.02)); x.closePath(); x.fill();
    } else { x.fillStyle = rgb(K.chrome); x.beginPath(); x.roundRect(X(M.len - 0.15), Y(ry1 + 0.06), 0.08 * s, 0.06 * s, 0.02 * s); x.fill(); }
    // its glint (a crisp white fleck high on the shell)
    x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillRect(X(a + 0.04), Y(ry1 - 0.06), Math.max(0.5, 0.035 * s), Math.max(0.6, 0.12 * s));
  }
  // ---- THE WHEEL ARCHES: cut out of the body + the valance (the wheels show through, drawn under this sprite)
  x.globalCompositeOperation = 'destination-out';
  for (const u of A.wheels) { x.beginPath(); x.arc(X(u), Y(R), (R + 0.14) * s, 0, TAU); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  // ---- THE FENDERS (glossy, a sweep over each wheel down to the running board — the big sedan's front one long + low to its tip;
  // the Model T's slim cycle wings) + THE RUNNING BOARD with its bright edge strip
  // THE SIDE-MOUNT SPARE: a full wheel standing in the front fender's well just behind the front wheel (its face toward us: a circle),
  // the whitewall, the chrome ring + its hub cap, a small mirror on a stalk over it; the fender's sweep laps over its foot
  if (M.spare === 'side') {
    const cx = X(fw - R * 2 - 0.36), cy = Y(R + 0.42), rr = (R + 0.02) * s;
    x.fillStyle = rgb(K.tyre); x.beginPath(); x.arc(cx, cy, rr, 0, TAU); x.fill();
    if (M.white) { x.strokeStyle = rgb(K.white, 0.92); x.lineWidth = Math.max(0.8, rr * 0.16); x.beginPath(); x.arc(cx, cy, rr * 0.72, 0, TAU); x.stroke(); }
    x.strokeStyle = rgb(K.chrome); x.lineWidth = Math.max(0.7, rr * 0.08); x.beginPath(); x.arc(cx, cy, rr * 0.93, 0, TAU); x.stroke();
    const hg = x.createRadialGradient(cx - rr * 0.1, cy - rr * 0.1, 0, cx, cy, rr * 0.45); hg.addColorStop(0, 'rgb(255,255,255)'); hg.addColorStop(0.4, rgb(K.chrome)); hg.addColorStop(1, rgb(K.chromeLo));
    x.fillStyle = hg; x.beginPath(); x.arc(cx, cy, rr * 0.42, 0, TAU); x.fill();
    x.strokeStyle = rgb(K.chrome); x.lineWidth = lw(0.03); x.beginPath(); x.moveTo(cx, cy - rr); x.lineTo(cx + 0.04 * s, cy - rr - 0.2 * s); x.stroke();
    x.fillStyle = rgb(K.chrome); x.beginPath(); x.ellipse(cx + 0.05 * s, cy - rr - 0.24 * s, 0.07 * s, 0.05 * s, 0, 0, TAU); x.fill();
  }
  const fK = { ...K, bk: fendC, bkHi: mix(fendC, K.hi, 0.6) };
  fender(x, X, Y, s, fK, rw, R, false, M);
  fender(x, X, Y, s, fK, fw, R, true, M);
  const rb0 = rw + R + 0.12, rb1 = fw - R - 0.12;
  x.fillStyle = rgb(fendC); x.fillRect(X(rb0 - 0.04), Y(0.47), (rb1 - rb0 + 0.08) * s, 0.08 * s);
  x.fillStyle = rgb(K.chrome, 0.85); x.fillRect(X(rb0 - 0.04), Y(0.47), (rb1 - rb0 + 0.08) * s, Math.max(0.5, 0.02 * s));
  // ---- THE LAMPS (their housings — the lenses are lit live): big drum headlamps on a bar, the fog pair low on the apron, the tail lamp
  const [hu, hv] = A.head, hr = (id === 'packard' ? 0.25 : M.roof === 'box' ? 0.16 : 0.2);
  x.strokeStyle = rgb(K.chrome); x.lineWidth = lw(0.04); x.beginPath(); x.moveTo(X(hu - 0.16), Y(hv - hr)); x.lineTo(X(hu - 0.2), Y(M.sill + 0.1)); x.stroke();   // (the lamp bar's post)
  x.fillStyle = rgb(K.bk); x.beginPath(); x.moveTo(X(hu - 0.3), Y(hv)); x.quadraticCurveTo(X(hu - 0.26), Y(hv + hr), X(hu - 0.02), Y(hv + hr)); x.lineTo(X(hu), Y(hv - hr)); x.quadraticCurveTo(X(hu - 0.26), Y(hv - hr), X(hu - 0.3), Y(hv)); x.closePath(); x.fill();
  x.strokeStyle = rgb(K.bkHi, 0.7); x.lineWidth = lw(0.025); x.beginPath(); x.moveTo(X(hu - 0.25), Y(hv + hr * 0.55)); x.quadraticCurveTo(X(hu - 0.18), Y(hv + hr * 0.85), X(hu - 0.06), Y(hv + hr * 0.85)); x.stroke();
  x.fillStyle = rgb(K.chrome); x.beginPath(); x.ellipse(X(hu), Y(hv), 0.05 * s, hr * s, 0, 0, TAU); x.fill();   // (the chrome rim, edge-on)
  if (A.fog) { const [fu, fv] = A.fog; x.fillStyle = rgb(K.chrome); x.beginPath(); x.ellipse(X(fu - 0.05), Y(fv), 0.04 * s, 0.09 * s, 0, 0, TAU); x.fill(); }
  // the bumpers (chrome bars front + back, their glints)
  x.fillStyle = rgb(K.chrome); x.fillRect(X(M.len - 0.06), Y(M.sill + 0.04), 0.2 * s, 0.1 * s); x.fillRect(X(-0.34), Y(M.sill - 0.04), 0.18 * s, 0.1 * s);
  x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(X(M.len - 0.02), Y(M.sill + 0.03), Math.max(0.5, 0.05 * s), Math.max(0.4, 0.025 * s));
  const [tu, tv] = A.tail; x.fillStyle = rgb(K.bk); x.beginPath(); x.roundRect(X(tu), Y(tv + 0.07), 0.14 * s, 0.13 * s, 0.03 * s); x.fill();
  x.fillStyle = rgb([150, 20, 24]); x.fillRect(X(tu - 0.02), Y(tv + 0.05), 0.04 * s, 0.09 * s);
  // THE TAXI sign on the roof (its lamp lit live at night)
  if (M.taxiSign) {
    const u = (M.cab[0] + M.cab[1]) / 2 + 0.2;
    x.fillStyle = rgb(K.bk); x.fillRect(X(u - 0.36), Y(M.h + 0.06), 0.72 * s, 0.06 * s);
    x.fillStyle = rgb(mix([240, 214, 120], K.p, 0.2)); x.beginPath(); x.roundRect(X(u - 0.3), Y(M.h + 0.3), 0.6 * s, 0.24 * s, 0.04 * s); x.fill();
    x.save(); x.font = `800 ${0.18 * s}px "Chakra Petch", Orbitron, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = rgb(K.bk); x.fillText('TAXI', X(u), Y(M.h + 0.18)); x.restore();
  }
  return cv;
}
/** 8b1 — A TRUCK's BED behind its cab (drawn before the cab + hood): the city's riveted steel DUMP body (its ribs, a lit top rail, CITY
 *  SANITATION stencilled in cream) or the bootleggers' STAKE sides + a CANVAS TARP lashed over the load on its hoops (the ropes, the
 *  folds, a crate's corner showing at the tail) */
function truckBed(x, X, Y, s, K, M, o) {
  const B = M.bed, v0 = M.sill + 0.02, u0 = B.u0, u1 = B.u1, p = K.p, lw = v => Math.max(0.5, v * s);
  if (B.kind === 'dump') {
    const g = x.createLinearGradient(0, Y(B.v1), 0, Y(v0));
    g.addColorStop(0, rgb(mix(p, K.hi, 0.28))); g.addColorStop(0.12, rgb(p)); g.addColorStop(0.7, rgb(shade(p, -0.12))); g.addColorStop(1, rgb(shade(p, -0.35)));
    x.fillStyle = g; x.beginPath(); x.moveTo(X(u0), Y(v0)); x.lineTo(X(u0 - 0.05), Y(B.v1)); x.lineTo(X(u1), Y(B.v1)); x.lineTo(X(u1), Y(v0)); x.closePath(); x.fill();
    // the ribs (vertical stiffeners, each a lit edge + a shadow), the top rail, the rivets along it, the tailgate's hinge
    for (let u = u0 + 0.42; u < u1 - 0.1; u += 0.62) { x.fillStyle = rgb(shade(p, -0.42)); x.fillRect(X(u), Y(B.v1 - 0.06), 0.06 * s, (B.v1 - v0 - 0.08) * s); x.fillStyle = rgb(mix(p, K.hi, 0.4), 0.7); x.fillRect(X(u - 0.02), Y(B.v1 - 0.06), lw(0.018), (B.v1 - v0 - 0.08) * s); }
    x.fillStyle = rgb(shade(p, -0.3)); x.fillRect(X(u0 - 0.06), Y(B.v1 + 0.02), (u1 - u0 + 0.06) * s, 0.1 * s);
    x.fillStyle = rgb(mix(p, K.hi, 0.6), 0.8); x.fillRect(X(u0 - 0.06), Y(B.v1 + 0.02), (u1 - u0 + 0.06) * s, lw(0.02));
    x.fillStyle = rgb(mix(p, [240, 236, 220], 0.4), 0.7); for (let u = u0 + 0.1; u < u1; u += 0.22) { x.beginPath(); x.arc(X(u), Y(B.v1 - 0.03), Math.max(0.35, 0.018 * s), 0, TAU); x.fill(); }
    const word = o.word || (M.trades || [''])[0];
    if (word) { x.save(); x.font = `800 ${0.27 * s}px "Chakra Petch", Orbitron, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; const tw = x.measureText(word).width, sq = Math.min(1, (u1 - u0 - 0.4) * s / Math.max(1, tw)); x.translate(X((u0 + u1) / 2), Y((B.v1 + v0) / 2 + 0.04)); x.scale(sq, 1); x.fillStyle = rgb(shade(p, -0.5), 0.8); x.fillText(word, 0.025 * s, 0.025 * s); x.fillStyle = rgb(mix([226, 214, 170], p, K.name === 'night' ? 0.55 : 0.1)); x.fillText(word, 0, 0); x.restore(); }
    return;
  }
  // THE STAKE BED: the deck's edge, the wooden stakes + two rails, then the tarp over the hoops (rounded, sagging between them)
  const wood = mix([118, 92, 60], p, 0.15), wv = M.belt + 0.32;
  x.fillStyle = rgb(shade(wood, -0.2)); x.fillRect(X(u0), Y(v0 + 0.16), (u1 - u0) * s, 0.16 * s);
  x.fillStyle = rgb(K.name === 'night' ? shade(wood, -0.5) : wood); for (let u = u0 + 0.05; u < u1; u += 0.5) x.fillRect(X(u), Y(wv), 0.08 * s, (wv - v0 - 0.02) * s);
  for (const v of [wv - 0.06, (wv + v0) / 2]) x.fillRect(X(u0), Y(v), (u1 - u0) * s, 0.07 * s);
  const canvas = K.name === 'night' ? [34, 36, 32] : K.name === 'golden' ? [104, 96, 70] : [86, 90, 70], hoops = 4;
  const tg = x.createLinearGradient(0, Y(B.v1), 0, Y(wv));
  tg.addColorStop(0, rgb(mix(canvas, K.hi, 0.22))); tg.addColorStop(0.5, rgb(canvas)); tg.addColorStop(1, rgb(shade(canvas, -0.3)));
  x.fillStyle = tg; x.beginPath(); x.moveTo(X(u0), Y(wv - 0.04));
  x.quadraticCurveTo(X(u0 - 0.02), Y(B.v1), X(u0 + 0.3), Y(B.v1));
  for (let i = 1; i <= hoops; i++) { const ua = u0 + 0.3 + (u1 - u0 - 0.6) * (i - 1) / hoops, ub = u0 + 0.3 + (u1 - u0 - 0.6) * i / hoops; x.quadraticCurveTo(X((ua + ub) / 2), Y(B.v1 - 0.09), X(ub), Y(B.v1)); }
  x.quadraticCurveTo(X(u1), Y(B.v1), X(u1), Y(wv - 0.04)); x.closePath(); x.fill();
  // the folds (darker creases from each hoop down), the ropes lashed to the stakes, a crate's corner peeking under the tail flap
  x.strokeStyle = rgb(shade(canvas, -0.45), 0.8); x.lineWidth = lw(0.022);
  for (let i = 0; i <= hoops; i++) { const u = u0 + 0.3 + (u1 - u0 - 0.6) * i / hoops; x.beginPath(); x.moveTo(X(u), Y(B.v1 - 0.02)); x.quadraticCurveTo(X(u + 0.06), Y((B.v1 + wv) / 2), X(u - 0.04), Y(wv)); x.stroke(); }
  x.strokeStyle = rgb(K.name === 'night' ? [70, 64, 52] : [196, 178, 132], 0.9); x.lineWidth = lw(0.018);
  for (let u = u0 + 0.35; u < u1 - 0.2; u += 0.75) { x.beginPath(); x.moveTo(X(u - 0.3), Y(B.v1 - 0.1)); x.lineTo(X(u + 0.1), Y(wv - 0.02)); x.stroke(); }
  x.fillStyle = rgb(K.name === 'night' ? shade(wood, -0.45) : mix(wood, [200, 170, 120], 0.3)); x.fillRect(X(u0 + 0.02), Y(wv + 0.04), 0.34 * s, 0.22 * s);
}
/** a person seated behind the glass / in the open cockpit: shoulders, a head, a hat (a fedora / a cloche), a rim of the light outside */
function figure(x, X, Y, s, u, v, col, rimC, wheel, look = 'man', skin = null, hatC = null) {
  x.fillStyle = rgb(col);
  x.beginPath(); x.roundRect(X(u - 0.24), Y(v + 0.4), 0.48 * s, 0.4 * s, 0.1 * s); x.fill();
  x.fillStyle = rgb(skin || col); x.beginPath(); x.ellipse(X(u), Y(v + 0.5), 0.09 * s, 0.11 * s, 0, 0, TAU); x.fill();
  if (skin) { x.fillStyle = rgb(shade(skin, -0.25)); x.beginPath(); x.ellipse(X(u - 0.04), Y(v + 0.48), 0.05 * s, 0.09 * s, 0, 0, TAU); x.fill(); }   // (the far cheek in shade)
  x.fillStyle = rgb(hatC || col);
  if (look === 'lady') { x.beginPath(); x.ellipse(X(u), Y(v + 0.58), 0.12 * s, 0.08 * s, 0, Math.PI, 0); x.fill(); x.fillRect(X(u - 0.12), Y(v + 0.58), 0.24 * s, 0.04 * s); }
  else { x.beginPath(); x.ellipse(X(u + 0.02), Y(v + 0.59), 0.16 * s, 0.035 * s, -0.04, 0, TAU); x.fill(); x.beginPath(); x.ellipse(X(u), Y(v + 0.62), 0.1 * s, 0.07 * s, 0, Math.PI, 0); x.fill(); }
  x.fillStyle = rgb(rimC, 0.25); x.fillRect(X(u + 0.08), Y(v + 0.56), Math.max(0.4, 0.025 * s), 0.1 * s);
  if (wheel) { x.strokeStyle = rgb(col); x.lineWidth = Math.max(0.6, 0.03 * s); x.beginPath(); x.moveTo(X(u + 0.18), Y(v + 0.34)); x.lineTo(X(u + 0.28), Y(v + 0.16)); x.stroke(); }
}
/** a fender over the wheel at u (the front one sweeping forward + down to its tip; 'long': the big sedan's long low wing; 'cycle': a
 *  slim arc) — the sweep's back end running into the running board */
function fender(x, X, Y, s, K, u, R, front, M) {
  const cx = X(u), cy = Y(R), ro = (R + 0.19) * s, ri = (R + 0.08) * s, lw = v => Math.max(0.6, v * s);
  x.beginPath();
  if (M.fender === 'cycle') {
    // a slim arc over the wheel, a little apron down at each end
    x.arc(cx, cy, ro, Math.PI * 1.08, Math.PI * 1.92); x.arc(cx, cy, ri, Math.PI * 1.92, Math.PI * 1.08, true); x.closePath();
    x.fillStyle = rgb(K.bk); x.fill();
    if (front) { x.beginPath(); x.moveTo(cx - ro * 0.95, cy + ro * 0.15); x.lineTo(X(u - R - 0.6), Y(0.47)); x.lineTo(X(u - R - 0.6), Y(0.4)); x.lineTo(cx - ri * 0.98, cy + ri * 0.2); x.closePath(); x.fill(); }
    else { x.beginPath(); x.moveTo(cx + ro * 0.95, cy + ro * 0.15); x.lineTo(X(u + R + 0.6), Y(0.47)); x.lineTo(X(u + R + 0.6), Y(0.4)); x.lineTo(cx + ri * 0.98, cy + ri * 0.2); x.closePath(); x.fill(); }
  } else if (front) {
    const tip = M.fender === 'long' ? 0.95 : 0.66, a0 = -2.95, a1 = -0.22;
    x.moveTo(X(u - R - 0.62), Y(0.4)); x.lineTo(X(u - R - 0.62), Y(0.47)); x.quadraticCurveTo(X(u - R - 0.5), Y(0.58), cx + ro * Math.cos(a0), cy + ro * Math.sin(a0));
    x.arc(cx, cy, ro, a0, a1, false);
    x.quadraticCurveTo(X(u + R + tip * 0.55), Y(R + 0.42), X(u + R + tip * 0.7), Y(M.fender === 'long' ? 0.5 : 0.6)); x.lineTo(X(u + R + tip * 0.6), Y(M.fender === 'long' ? 0.45 : 0.55));
    x.arc(cx, cy, ri, -0.26, -2.9, true); x.lineTo(X(u - R - 0.48), Y(0.4));
    x.closePath(); x.fillStyle = rgb(K.bk); x.fill();
  } else {
    const a0 = -0.36, a1 = -3.3;
    x.moveTo(X(u + R + 0.6), Y(0.4)); x.lineTo(X(u + R + 0.6), Y(0.47)); x.quadraticCurveTo(X(u + R + 0.52), Y(0.6), cx + ro * Math.cos(a0), cy + ro * Math.sin(a0));
    x.arc(cx, cy, ro, a0, a1, true);
    x.quadraticCurveTo(X(u - R - 0.32), Y(R + 0.1), X(u - R - 0.38), Y(0.5)); x.lineTo(X(u - R - 0.26), Y(0.48));
    x.arc(cx, cy, ri, -3.24, -0.44, false); x.lineTo(X(u + R + 0.46), Y(0.4));
    x.closePath(); x.fillStyle = rgb(K.bk); x.fill();
  }
  // the gloss along its crown (the sky in the paint), a crisp highlight + a softer band
  x.strokeStyle = rgb(K.bkHi, 0.8); x.lineWidth = lw(0.03); x.beginPath();
  if (front) x.arc(cx, cy, ro - 0.04 * s, -2.55, -0.85, false); else x.arc(cx, cy, ro - 0.04 * s, -0.75, -2.4, true);
  x.stroke();
  x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = lw(0.012); x.beginPath(); x.arc(cx, cy, ro - 0.05 * s, front ? -2.1 : -1.4, front ? -1.75 : -1.05); x.stroke();
  // the shade it throws on the tyre's top
  const sg = x.createRadialGradient(cx, cy, ri * 0.8, cx, cy, ri);
  sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.32)');
  x.fillStyle = sg; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, ri, -3.0, -0.14, false); x.closePath(); x.fill();
}

// ------------------------------------------------------------------ THE WHEELS (baked: the still tyre + the turning part)
/** a wheel at s px a unit: kind 'wood' (12 artillery spokes) | 'wire' (laced chrome spokes, a big hub cap) → { tyre, spin, N } */
export function wheelSprite(id, s, K) {
  const M = MODELS[id] || MODELS.modelA, R = M.r * s, N = Math.ceil(R * 2 + 4);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
  const tyre = mk(), spin = mk(), t = safeCtx(tyre), x = safeCtx(spin), m = N / 2;
  if (t) {
    t.fillStyle = rgb(K.tyre); t.beginPath(); t.arc(m, m, R, 0, TAU); t.fill();
    if (M.white) { t.strokeStyle = rgb(K.white, 0.92); t.lineWidth = Math.max(0.8, R * 0.16); t.beginPath(); t.arc(m, m, R * 0.72, 0, TAU); t.stroke(); }
    t.strokeStyle = rgb(shade(K.bkHi, -0.35), 0.8); t.lineWidth = Math.max(0.6, R * 0.06); t.beginPath(); t.arc(m, m, R * 0.88, 0, TAU); t.stroke();
    t.strokeStyle = rgb(K.bkHi, 0.45); t.lineWidth = Math.max(0.5, R * 0.05); t.beginPath(); t.arc(m, m, R * 0.95, -2.6, -0.6); t.stroke();
  }
  if (x) {
    const rim = R * (M.white ? 0.6 : 0.7);
    if (M.wheel === 'wire') {
      // the laced wire spokes (a fine bright mesh), the felloe's chrome ring, the big domed hub cap with its glint
      x.strokeStyle = rgb(K.chromeLo); x.lineWidth = Math.max(0.7, R * 0.08); x.beginPath(); x.arc(m, m, rim, 0, TAU); x.stroke();
      x.strokeStyle = rgb(mix(K.chrome, K.chromeLo, 0.35), 0.85); x.lineWidth = Math.max(0.35, R * 0.025);
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, b = a + (i % 2 ? 0.5 : -0.5); x.beginPath(); x.moveTo(m + Math.cos(b) * R * 0.2, m + Math.sin(b) * R * 0.2); x.lineTo(m + Math.cos(a) * rim, m + Math.sin(a) * rim); x.stroke(); }
      const hg = x.createRadialGradient(m - R * 0.08, m - R * 0.08, 0, m, m, R * 0.3); hg.addColorStop(0, 'rgb(255,255,255)'); hg.addColorStop(0.35, rgb(K.chrome)); hg.addColorStop(1, rgb(K.chromeLo));
      x.fillStyle = hg; x.beginPath(); x.arc(m, m, R * 0.28, 0, TAU); x.fill();
    } else {
      const sp = K.spoke;
      x.strokeStyle = rgb(shade(sp, -0.25)); x.lineWidth = Math.max(0.8, R * 0.1); x.beginPath(); x.arc(m, m, rim, 0, TAU); x.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        x.strokeStyle = rgb(i % 2 ? sp : shade(sp, -0.12)); x.lineWidth = Math.max(0.7, R * 0.11); x.lineCap = 'butt';
        x.beginPath(); x.moveTo(m + ca * R * 0.16, m + sa * R * 0.16); x.lineTo(m + ca * rim, m + sa * rim); x.stroke();
      }
      x.fillStyle = rgb(K.chrome); x.beginPath(); x.arc(m, m, R * 0.2, 0, TAU); x.fill();
      x.fillStyle = rgb(K.chromeLo); x.beginPath(); x.arc(m, m, R * 0.09, 0, TAU); x.fill();
    }
  }
  return { tyre, spin, N };
}

// ------------------------------------------------------------------ THE KIT (a cache of sprites + one call that draws a vehicle)
let glowW = null, glowR = null, glowAny = new Map();
const glowSprite = (col, soft) => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = safeCtx(c);
  if (x) { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(soft, `rgba(${col},0.4)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  return c;
};
const glowOf = col => { const k = col.join(','); let g = glowAny.get(k); if (!g) { g = glowSprite(k, 0.35); glowAny.set(k, g); } return g; };
/** the party's NEON UNDERGLOW colours (a car carries one at random on a party night: traffic.js / motorcar.js pick) */
export const UNDERGLOW = Object.freeze([[255, 60, 190], [60, 220, 255], [170, 90, 255], [80, 255, 170]]);

export function createVehicles() {
  const cache = new Map();
  const get = (key, mk) => {
    let v = cache.get(key);
    if (!v) { v = mk(); if (cache.size > 40) { for (const o of cache.values()) for (const cv of o.tyre ? [o.tyre, o.spin] : [o]) cv.width = cv.height = 0; cache.clear(); } cache.set(key, v); }
    return v;
  };
  const paintsOf = (id, paint) => { const M = MODELS[id] || MODELS.modelA, P = M.paints[((paint % M.paints.length) + M.paints.length) % M.paints.length]; return { body: PAINT[P[0]], fender: PAINT[P[1]], trim: P[2] ? PAINT[P[2]] : null }; };
  /** the body sprite for a model / look / paint at s px a unit */
  function body(id, look, paint, s, o = {}) {
    const key = `b|${id}|${look}|${paint}|${o.trade || 0}|${o.word || ''}|${o.rumble ? 1 : 0}|${Math.round(s * 8)}`;
    return get(key, () => { const P = paintsOf(id, paint), K = lookOf(look, P.body), F = lookOf(look, P.fender), Tm = P.trim ? lookOf(look, P.trim).p : null; return bodySprite(id, s, K, { fender: F.p, trim: Tm, trade: o.trade, word: o.word, rumble: o.rumble }); });
  }
  function wheel(id, look, s) {
    const M = MODELS[id] || MODELS.modelA;
    return get(`w|${M.wheel}|${M.white ? 1 : 0}|${M.r}|${look}|${Math.round(s * 8)}`, () => wheelSprite(id, s, lookOf(look, PAINT.black)));
  }
  /**
   * one vehicle, side-on, its tail → nose along dir: c, v = { id (model), paint, trade, rumble, x (screen: its middle), y (screen: the
   * ground under it), sp (pt a unit), dir (±1), dist (world units rolled — the wheels' turn), speed (u / s — the motion blur), look
   * ('day' | 'golden' | 'night'), lampK (0..1: a street lamp's light on it at night), lit (0..1: its own lamps), underglow ([r,g,b] |
   * null), glowK (0..1), dpr, bob (pt), k (alpha) } → its box { x0, x1, top }
   */
  function draw(c, v) {
    const id = MODELS[v.id] ? v.id : 'modelA', M = MODELS[id], A = anatomy(id), sp = v.sp, dpr = v.dpr || 2, s = sp * dpr, k = v.k == null ? 1 : v.k;
    const len = M.len * sp, look = v.look || 'day';
    c.save(); c.globalAlpha = k; c.translate(v.x, v.y); c.scale(v.dir < 0 ? -1 : 1, 1);
    // the underglow (a party night's neon strip under the chassis, its soft pool on the road) — under the car
    if (v.underglow && (v.glowK || 0) > 0.02) {
      const g = glowOf(v.underglow), gk = v.glowK * k;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.55 * gk; c.drawImage(g, -len * 0.62, -0.5 * sp, len * 1.24, 0.9 * sp);
      c.globalAlpha = 0.9 * gk; c.fillStyle = `rgb(${v.underglow.join(',')})`; c.fillRect((A.wheels[0] - M.len / 2 + M.r) * sp, -0.42 * sp, (M.base - 2 * M.r) * sp, Math.max(0.6, 0.05 * sp));
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = k;
    }
    // the wheels (the tyre still, the spokes turning by the distance rolled — a half-step ghost for motion blur)
    const wh = wheel(id, look, s), wn = wh.N / dpr, roll = (v.dist || 0) / M.r, step = ((v.speed || 0) / M.r) / 60;
    for (const u of A.wheels) {
      const wx = (u - M.len / 2) * sp, wy = -M.r * sp;
      c.drawImage(wh.tyre, wx - wn / 2, wy - wn / 2, wn, wn);
      for (const [da, a] of [[0, 1], [-step * 0.5, 0.45]]) { c.save(); c.translate(wx, wy); c.rotate(roll + da); c.globalAlpha = k * a; c.drawImage(wh.spin, -wn / 2, -wn / 2, wn, wn); c.restore(); }
    }
    c.globalAlpha = k;
    // (8b1 — POL4's known issue "the cream van reads grey at night": a big pale panel at night is a flat grey box. The cream DAIRY livery
    // is a daytime van — after dark its slot wears one of the van's deep paints (forest / navy / maroon, cream lettering), which keep
    // their colour + a lamp-lit gloss in the dark; every phone the same (the slot's paint, stepped))
    const pnt = look === 'night' ? nightPaint(id, v.paint || 0) : v.paint || 0;
    const b = body(id, look, pnt, s, v), bw = b.width / dpr, bh = b.height / dpr, bx = (-A.pad - M.len / 2) * sp, by = -(A.top + 0.06) * sp + (v.bob || 0);
    c.drawImage(b, bx, by, bw, bh);
    if ((v.lampK || 0) > 0.03 && look === 'night') { c.globalAlpha = k * v.lampK; c.drawImage(body(id, 'lamp', pnt, s, v), bx, by, bw, bh); c.globalAlpha = k; }
    // a party night's LIT TRIM: the running board's edge + the belt line in the underglow's colour (crisp, a tight glow)
    if (v.underglow && (v.glowK || 0) > 0.02) {
      const col = v.underglow, rb0 = A.wheels[0] + M.r + 0.12 - M.len / 2, rb1 = A.wheels[1] - M.r - 0.12 - M.len / 2;
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * v.glowK * k; c.fillStyle = `rgb(${col.join(',')})`;
      c.fillRect(rb0 * sp, -0.47 * sp + (v.bob || 0), (rb1 - rb0) * sp, Math.max(0.5, 0.025 * sp));
      c.fillRect((0.2 - M.len / 2) * sp, -(M.belt - 0.005) * sp + (v.bob || 0), (M.len - 0.5) * sp, Math.max(0.5, 0.016 * sp));
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = k;
    }
    // ITS LAMPS LIT (a white-hot core + a tight halo — never a haze; the fog pair amber; the tail lamp an ember; the taxi's roof sign)
    const hk = (v.lit || 0) * k;
    if (hk > 0.02) {
      if (!glowW) glowW = glowSprite('255,236,200', 0.28);
      if (!glowR) glowR = glowSprite('255,40,40', 0.3);
      c.globalCompositeOperation = 'lighter';
      // (8b1: the van's lamps a size up — a tall box body read as unlit behind the sedans' lamps)
      const [hu, hv] = A.head, hx = (hu - M.len / 2) * sp, hy = -hv * sp + (v.bob || 0), hr = (id === 'packard' ? 0.25 : M.roof === 'van' ? 0.26 : M.roof === 'box' ? 0.16 : 0.2), r1 = (hr * 3) * sp, r2 = hr * sp * 1.1;
      c.globalAlpha = 0.55 * hk; c.drawImage(glowW, hx - r1, hy - r1, r1 * 2, r1 * 2);
      c.globalAlpha = hk; c.drawImage(glowW, hx - r2, hy - r2 * 1.6, r2 * 2, r2 * 3.2);
      c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(255,250,236,${Math.min(1, hk)})`; c.beginPath(); c.ellipse(hx, hy, 0.045 * sp, hr * 0.9 * sp, 0, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter';
      if (A.fog) { const fx = (A.fog[0] - M.len / 2 - 0.05) * sp, fy = -A.fog[1] * sp + (v.bob || 0), rf = 0.3 * sp; c.globalAlpha = 0.7 * hk; c.drawImage(glowOf([255, 200, 120]), fx - rf, fy - rf, rf * 2, rf * 2); }
      const tx = (A.tail[0] - M.len / 2) * sp, ty = -A.tail[1] * sp + (v.bob || 0), r3 = 0.22 * sp;
      c.globalAlpha = 0.85 * hk; c.drawImage(glowR, tx - r3, ty - r3, r3 * 2, r3 * 2);
      if (M.taxiSign) { const u = (M.cab[0] + M.cab[1]) / 2 + 0.2 - M.len / 2, rs = 0.55 * sp; c.globalAlpha = 0.6 * hk; c.drawImage(glowOf([255, 220, 120]), u * sp - rs, -(M.h + 0.18) * sp - rs * 0.6, rs * 2, rs * 1.2); }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
    return { x0: v.x - len / 2, x1: v.x + len / 2, top: v.y - M.h * sp, head: [v.x + v.dir * (A.head[0] - M.len / 2) * sp, v.y - A.head[1] * sp], len };
  }
  return {
    draw, body, wheel, anatomy,
    destroy() { for (const o of cache.values()) for (const cv of o.tyre ? [o.tyre, o.spin] : [o]) cv.width = cv.height = 0; cache.clear(); },
  };
}
