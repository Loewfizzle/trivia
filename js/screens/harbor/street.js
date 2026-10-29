// CITY 2.0 — THE HARBOR, FP2: THE STREET UNDER THE DOCK (baked into 'stage' — no per-frame cost) + THE STONE PAINTER the promenade's
// setts share. The band below the promenade's front curb is a FINISHED STREET, full-bleed to the screen's foot (the owner, Oct 23:
// "an unfinished grey band shows when the dock fades away" — no camera slide): a granite gutter along the curb (a storm drain's grate
// + its inlet in the curb's face), the street's own setts (cooler, a touch darker + more worn than the promenade's: the tyres' polished
// paths, an oil line down each lane), ONE streetcar track (two steel rails inset in granite stretchers, their polished running
// tops catching the light), a cast-iron manhole, the season in the gutter (autumn leaves, spring petals, winter grit), and THE WET
// HOOK (L.wet 0..1 — Part 9; &force=wet-street): the stones darker, puddles mirroring the sky, the lamps' reflections as long broken
// streaks. At night every stone, joint + rail takes the lamps' pools where it lies (stage.js#lightField, passed in as lightAt).
// The plan (where the lanes, the rails, the manhole, the drain are) is PURE: core/harbor-promenade.js#streetPlan.
// The car that rolls across while the dock rests: motorcar.js (drawn live by roadlight.js).
import { project, groundY } from '../../core/harbor-layout.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, shade, mix } from './shapes.js';

const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
const cl = v => (v < 0 ? 0 : v > 255 ? 255 : v);
const addc = (c, l, k = 1) => [cl(c[0] + l[0] * k), cl(c[1] + l[1] * k), cl(c[2] + l[2] * k)];
const mulc = (c, m) => [c[0] * m, c[1] * m, c[2] * m];

// ------------------------------------------------------------------ THE STONE PAINTER (the promenade's setts + the street's)
/**
 * One granite sett on screen (ax, ay = its far top-left, ww × hh pt), rounded: its body (c — its light already in it), its TOP (the
 * half facing the sky: lighter, the lamps' sheen on it), a small bright LIP, a soft fall-off toward its near edge. By day crisp (a
 * clean top / body edge, a hairline shade at the near edge); at night (FP2 — the owner's "piano keys"): the top fades into the body
 * (rounded, never a hard step), the near edge falls off toward the GROUT (never black), the lamps' extra on the top lower (the
 * contrast between the lit tops and the joints down). o: { lt (the lamps' light here | null), day, night (0..1), lip, grout, a, b
 * (two random draws 0..1: the lip's strength, a worn stone), wet (0..1), sky (what a wet top mirrors), amb (a faint sheen of the night
 * sky on every crown — the street's, where no lamp reaches) }
 */
export function paintSett(x, ax, ay, ww, hh, c, o) {
  const { lt, day, night, lip, grout } = o, wet = o.wet || 0;
  if (o.flat) { paintFlat(x, ax, ay, ww, hh, c, o); return; }
  const rad = Math.min(hh * (0.34 + 0.08 * night), ww * 0.22);
  // the body, falling off toward the near edge (by night into the grout's tone: rounded, no black rim)
  const bot = mix(shade(c, -0.06 - 0.03 * day), grout, 0.3 * night);
  if (night > 0.05 && hh > 1.6) {
    const g = x.createLinearGradient(0, ay, 0, ay + hh);
    g.addColorStop(0, rgb(c)); g.addColorStop(0.55, rgb(c)); g.addColorStop(1, rgb(bot));
    x.fillStyle = g;
  } else x.fillStyle = rgb(c);
  x.beginPath(); x.roundRect(ax, ay, ww, hh, rad); x.fill();
  // the top (the far half, facing the sky): + the lamps' sheen (less at night than the body's light × 2: lower contrast)
  let top = shade(c, 0.1 + 0.06 * day);
  if (lt) top = addc(top, lt, 0.5 - 0.24 * night);
  if (wet > 0.01 && o.sky) top = mix(top, o.sky, 0.25 * wet);
  const th = hh * (0.48 + 0.1 * night), tx = ax + ww * 0.08, tw = ww * 0.84;
  if (night > 0.05 && th > 1.2) {
    // soft: solid over its far part, fading into the body (the stone's rounded crown)
    const g = x.createLinearGradient(0, ay, 0, ay + th), s = 0.86 - 0.5 * night;
    g.addColorStop(0, rgb(top)); g.addColorStop(Math.max(0.1, s), rgb(top)); g.addColorStop(1, rgb(top, 0));
    x.fillStyle = g;
  } else x.fillStyle = rgb(top);
  x.beginPath(); x.roundRect(tx, ay, tw, th, rad * 0.8); x.fill();
  // the lip: a small bright highlight on the crown (the sun by day, the lamps at night; a wet stone shines everywhere)
  const la = day * 0.5 + (lt ? Math.min(0.85, (lt[0] + lt[1] + lt[2]) / 240) : 0) + 0.45 * wet + (o.amb || 0);
  if (la > 0.03 && hh > 1.1) {
    const lc = lt && day < 0.3 ? addc(lip, lt, 0.8) : lip;
    x.fillStyle = rgb(wet > 0.01 && o.sky ? mix(lc, o.sky, 0.4 * wet) : lc, Math.min(0.8, la) * (0.55 + o.a * 0.45));
    x.fillRect(ax + ww * 0.24, ay + hh * 0.12, ww * 0.5, Math.max(0.35, hh * 0.13));
  }
  if (o.b < 0.08) { x.fillStyle = `rgba(0,0,0,${0.12 - 0.05 * night})`; x.beginPath(); x.roundRect(ax, ay, ww, hh, rad); x.fill(); }
  // (by day a hairline of shade at the near edge — the crisp look; at night the gradient above does it softly)
  if (night < 0.95) { x.fillStyle = `rgba(0,0,0,${0.07 * (1 - night)})`; x.fillRect(ax + rad * 0.5, ay + hh - Math.max(0.3, hh * 0.12), ww - rad, Math.max(0.3, hh * 0.12)); }
}

/**
 * 8P — FLAT paving (the owner, iPhone, day: "too bumpy… needs grout"): a stone / a brick laid FLAT — its face one tone (the lamps'
 * light already in c), a faint bevel (the far edge a hair lighter, the near edge a hair darker), small corners, NO pillow crown, no
 * lip; the grout round it does the rest. o.brick: square corners (a paving brick); o.wet: a sky glaze on the face (Part 9).
 */
export function paintFlat(x, ax, ay, ww, hh, c, o) {
  const day = o.day || 0, night = o.night || 0, wet = o.wet || 0, r = o.brick ? Math.min(0.5, hh * 0.12) : Math.min(hh * 0.2, ww * 0.12);
  let face = c;
  if (wet > 0.01 && o.sky) face = mix(face, o.sky, 0.2 * wet);
  x.fillStyle = rgb(face); x.beginPath(); if (r > 0.2) x.roundRect(ax, ay, ww, hh, r); else x.rect(ax, ay, ww, hh); x.fill();
  const e = Math.max(0.3, hh * 0.13);
  x.fillStyle = rgb(shade(face, 0.05 + 0.04 * day + (o.lt ? 0.03 : 0))); x.fillRect(ax + r * 0.5, ay, ww - r, e);
  x.fillStyle = `rgba(0,0,0,${(0.06 + 0.05 * (1 - night)).toFixed(3)})`; x.fillRect(ax + r * 0.5, ay + hh - e, ww - r, e);
  if (o.b != null && o.b < 0.08) { x.fillStyle = `rgba(0,0,0,${(0.1 - 0.04 * night).toFixed(3)})`; x.fillRect(ax, ay, ww, hh); }
}

// ------------------------------------------------------------------ THE STREET's colours
// PF (the owner's iPhone review: "the street must read as a different SURFACE from the promenade"): TARRED setts — the granite
// darkened + cooled by decades of tar, oil + tyre grime (an asphalt tone, blue-grey, never the promenade's warm sand-grey), TAR in the
// joints (a dark pitch line, lifted where the lamps reach so the night never goes black), the gutter a step darker than the curb
// 8P — THE STREET UNDER THE DOCK, A 1920s MIDWEST BRICK STREET (the owner: "too bumpy", wanted its own shade — a reddish brick): small
// regular paving bricks laid in tight rows across the street, a muted aged OXBLOOD / brown-red — darker + less saturated than the
// promenade and the brick compass, so it frames the screen's foot without pulling the eye; thin dark tar / sand joints; flat
const SETT = { d: [118, 70, 62], g: [138, 78, 64], n: [54, 37, 48] };          // (PF's tarred granite [98,100,108] · [122,96,94] · [44,45,66])
const GROUT = { d: [58, 46, 46], g: [66, 46, 44], n: [24, 20, 32] };          // the joints: tar + sand (PF [56,55,61] · [66,52,54] · [28,28,42])
const GUT = { d: [118, 118, 122], g: [140, 112, 104], n: [46, 46, 66] };      // the gutter's dressed slabs (FP2 [164,158,150] · [186,142,122] · [64,60,84])
const STRETCH = { d: [126, 126, 130], g: [148, 118, 108], n: [50, 50, 70] };  // the rails' granite stretchers (FP2 [162,156,148] · [186,140,120] · [64,60,84])
const HEAD = { d: [226, 232, 242], g: [255, 214, 172], n: [138, 138, 170] };  // a railhead's polished running top (the sky / the sun in it)
const FLANK = { d: [92, 90, 94], g: [96, 72, 68], n: [30, 29, 42] };          // the rail's rusty flank + the groove beside it
const IRON = { d: [72, 70, 74], g: [84, 62, 58], n: [32, 31, 44] };
const SKYREF = { d: [170, 196, 226], g: [246, 176, 138], n: [34, 38, 70] };    // what a puddle / a wet stone mirrors
const LIP = { d: [212, 216, 226], g: [238, 198, 162], n: [70, 66, 96] };   // (PF: the tarred crowns duller + cooler — FP2 [255,248,232] · [255,206,160]; the worn paths shine: SHEEN)
/** PF: the tyres' worn paths — their crowns' sky sheen (paintSett's wet glaze at this strength) */
export const SHEEN = 0.3;
/** PF — THE CURB STEP (streetOver, over stage.js's front curb): the face's extra shade (top → foot), its crisp lit ARRIS (the top's
 *  near edge: the sun by day, the sky + the lamps at night), the curb's shadow on the gutter (pt tall at 402 ≈ face × 0.6) */
export const CURB_STEP = Object.freeze({ face: [0.26, 0.46], faceN: [0.16, 0.3], arris: 0.75, arrisN: 0.4, shadow: 0.42 });

/** the street's look for these tones — the colours a car / a test needs too */
export function streetLook(T, wet = 0) {
  const dark = 1 - 0.28 * wet;   // (a wet stone is darker)
  return { sett: mulc(tri(T, SETT.d, SETT.g, SETT.n), dark), grout: mulc(tri(T, GROUT.d, GROUT.g, GROUT.n), dark), gut: mulc(tri(T, GUT.d, GUT.g, GUT.n), dark),
    stretch: mulc(tri(T, STRETCH.d, STRETCH.g, STRETCH.n), dark), head: tri(T, HEAD.d, HEAD.g, HEAD.n), flank: tri(T, FLANK.d, FLANK.g, FLANK.n),
    iron: tri(T, IRON.d, IRON.g, IRON.n), sky: tri(T, SKYREF.d, SKYREF.g, SKYREF.n), lip: tri(T, LIP.d, LIP.g, LIP.n) };
}

/**
 * THE STREET's bake steps (under the front curb: stage.js draws the curb + its face over the street's top). lightAt: the lamps' light
 * on the ground at (x, z) | null (by day). L.impliedRoad.street: the plan; L.wet: the wet hook; L.season: what lies in the gutter.
 */
export function streetSteps(L, T, lightAt) {
  const cam = L.cam, st = L.impliedRoad && L.impliedRoad.street;
  if (!st) return [];
  const wet = Math.max(0, Math.min(1, L.wet || 0)), K = streetLook(T, wet);
  const day = (T.day || 0) + 0.7 * (T.gold || 0), night = T.night || 0;
  const hw = z => cam.hw(z) * 1.04 + 1.2;
  const P = (x, z) => project(cam, x, 0, z);
  const lit = (x, z) => (lightAt ? lightAt(x, z) : null);
  const so = { day, night, lip: K.lip, grout: K.grout, wet, sky: K.sky, amb: 0.22 * night };
  const lanes = st.lanes, C = { w: 2.1 };
  // the tyres' paths (polished: a brighter sheen) + each lane's oil line (a darker smudge between them)
  const paths = []; for (const l of lanes) paths.push(l.z + 0.3, l.z + C.w - 0.3);
  const onPath = z => paths.some(p => Math.abs(z - p) < 0.28);
  const RB = 0.5, railBed = z => st.rails.some(r => Math.abs(z - r) < RB - 0.1);
  const steps = [];
  // 0. the base: the grout's tone from the curb to the screen's foot (+ a little above: the curb's face covers the seam)
  steps.push(x => { const y0 = groundY(cam, st.z0) - 1; x.fillStyle = rgb(K.grout); x.fillRect(0, y0, cam.W, cam.H - y0 + 2); });
  // 1. THE GUTTER: long dressed granite slabs along the curb (most of the strip hides under the curb's face; ~3 pt shows)
  steps.push(x => {
    const r = rngFrom(733), [z0, z1] = st.gutter;
    for (let wx = -hw(z0) - 0.4; wx < hw(z0); wx += 2.1) {
      const [ax, ay] = P(wx + 0.03, z1 - 0.02), [bx, by] = P(wx + 2.07, z0 + 0.03), lt = lit(wx + 1, z0 + 0.3);
      let c = mulc(K.gut, 0.92 + r() * 0.12); if (lt) c = addc(c, lt, 0.58);
      x.fillStyle = rgb(mix(K.grout, c, 0.5)); x.fillRect(ax - 0.5, ay, bx - ax + 1, by - ay);
      paintFlat(x, ax, ay, bx - ax, by - ay, c, { ...so, lt, b: 1 });
    }
  });
  // 2. THE SETTS, course by course toward us (the grout under each stone lit a little less than its top: no dark gaps)
  // (8P: bricks — SMALLER + more regular than the promenade's cobbles (0.95 × 0.72): ~0.5 long across the street × 0.3 deep, tight)
  const [DX, DZ] = [0.5, 0.3], GAP = 0.04, rows = [];
  for (let z1 = st.gutter[0], i = 0; z1 > st.foot - DZ; z1 -= DZ, i++) rows.push([z1 - DZ, z1, i]);
  const paint = (x, z0, z1, ri) => {
    const r = rngFrom(6067 + ri * 151), off = (ri % 2) * DX * 0.5, H = hw(z0), zc = (z0 + z1) / 2;
    if (railBed(zc)) return;                                   // (the rails' stretchers go there: step 3)
    const stones = [];
    for (let wx = -H - off; wx < H; wx += DX) {
      const w = DX, x0 = wx + GAP / 2, x1 = wx + w - GAP / 2, za = z0 + GAP / 2, zb = z1 - GAP / 2;
      stones.push({ wx, x0, x1, za, zb, v: 0.88 + r() * 0.18, tint: r(), a: r(), b: r() });
    }
    // the grout band of this course, lit where it lies (a mid tone: packed sand catching the lamps)
    for (const s of stones) {
      const lt = lit(s.wx + DX / 2, zc), [gx, gy] = P(s.wx, z1), [hx, hy] = P(s.wx + DX, z0);
      if (hx < -2 || gx > cam.W + 2) continue;
      x.fillStyle = rgb(lt ? addc(K.grout, lt, 0.42) : K.grout); x.fillRect(gx, gy, hx - gx + 0.6, hy - gy + 0.4);
    }
    const polished = onPath(zc);
    for (const s of stones) {
      const [ax, ay] = P(s.x0, s.zb), [bx, by] = P(s.x1, s.za), ww = bx - ax, hh = by - ay;
      if (ww < 0.6 || hh < 0.4 || bx < -2 || ax > cam.W + 2) continue;
      // (8P: worn SMOOTHER + DARKER along the wheel paths + beside the rails — the kiln colour evened out by the tyres)
      const nearRail = st.rails.some(rz => Math.abs(zc - rz) < RB + 0.35);
      let c = mulc(K.sett, polished || nearRail ? 0.86 + (s.v - 0.97) * 0.3 : s.v);
      if (s.tint < 0.12) c = addc(c, [-14, -8, -6], 0.6 + 0.4 * day); else if (s.tint < 0.22) c = addc(c, [10, 2, -4], 0.6 + 0.4 * day); else if (s.tint < 0.28) c = addc(c, [-6, -4, 2], 0.6 + 0.4 * day);
      const lt = lit((s.x0 + s.x1) / 2, zc);
      if (lt) c = addc(c, lt, 0.6);
      // (PF: the tyres' paths WORN SMOOTH — their crowns take a faint sheen of the sky, through the painter's wet path: a glaze, not water)
      paintFlat(x, ax, ay, ww, hh, c, { ...so, lt, brick: true, b: polished ? 1 : s.b, wet: polished ? Math.max(wet, SHEEN * 0.6) : wet });
    }
  };
  // (FP2: the soft night stones cost ~2× a day stone — two rows a step at night, so no bake step grows past a tree's)
  const per = night > 0.05 ? 2 : 4;
  for (let i = 0; i < rows.length; i += per) { const part = rows.slice(i, i + per); steps.push(x => { for (const [z0, z1, ri] of part) paint(x, z0, z1, ri); }); }
  // 3. THE TRACK: per rail, granite stretchers either side (long, smooth), the groove on the gauge side, the steel rail with its
  //    polished running top — catching the sky by day, the lamps' pools at night (a brighter streak where a pool lies on it)
  steps.push(x => {
    const r = rngFrom(4441);
    st.rails.forEach((zr, k) => {
      // (exaggerated ~3× like the setts, so the track reads on a phone: two dressed stretchers a side, the head ~0.2 u, the groove 0.1)
      for (const [za, zb] of [[zr + 0.12, zr + RB], [zr - RB, zr - 0.12]]) {
        const off = r() * 1.9;
        for (let wx = -hw(za) - off; wx < hw(za); wx += 1.9) {
          const [ax, ay] = P(wx + 0.03, zb), [bx, by] = P(wx + 1.87, za), lt = lit(wx + 0.95, za);
          let c = mulc(K.stretch, 0.9 + r() * 0.14); if (lt) c = addc(c, lt, 0.6);
          x.fillStyle = rgb(lt ? addc(K.grout, lt, 0.42) : K.grout); x.fillRect(ax - 0.4, ay - 0.3, bx - ax + 0.8, by - ay + 0.6);
          paintFlat(x, ax, ay, bx - ax, by - ay, c, { ...so, lt, b: 1 });
        }
      }
      // the rail: the groove (the flange's slot, on the track's inner side), the rusty flank, the polished head — in short runs so
      // the light along it changes (a pool's streak, the sky's sheen)
      const y = groundY(cam, zr), u = cam.F * cam.CAMH / (zr * zr), th = Math.max(1.4, 0.2 * u), inner = k === 0 ? -1 : 1;   // (rail 0 is the nearer: its inner side up the screen)
      const gw = Math.max(0.9, 0.1 * u), gy = inner < 0 ? y - th / 2 - gw : y + th / 2;
      x.fillStyle = rgb(shade(K.grout, -0.55)); x.fillRect(0, gy, cam.W, gw);                   // the groove (the flange's slot)
      x.fillStyle = rgb(K.flank); x.fillRect(0, y - th / 2 - 0.3, cam.W, th + 0.6);
      for (let sx = 0; sx < cam.W; sx += 5) {
        const wx = (sx + 2.5 - cam.VPX) * zr / cam.F, lt = lit(wx, zr);
        let c = mulc(K.head, 0.9 + 0.12 * Math.sin(sx * 0.07 + k * 2) + 0.06 * r());
        if (lt) c = addc(c, lt, 1.3);
        if (wet > 0.01) c = mix(c, addc(K.sky, [40, 40, 40]), 0.3 * wet);
        x.fillStyle = rgb(c); x.fillRect(sx, y - th / 2, 5.4, th * 0.7);
        x.fillStyle = rgb(shade(c, 0.25), 0.7); x.fillRect(sx, y - th / 2, 5.4, Math.max(0.4, th * 0.22));   // (the crown's brightest line)
      }
    });
  });
  // 4. THE DETAILS: the oil lines, the manhole, the drain's grate, the season in the gutter
  steps.push(x => {
    const r = rngFrom(919);
    // the oil line down each lane (between the tyres' paths): a soft darker smear, broken
    for (const l of (st.two ? lanes : lanes.slice(0, 1))) {
      const z = l.z + C.w / 2, y = groundY(cam, z), hh = Math.max(1.5, cam.F * cam.CAMH * 0.5 / (z * z));
      for (let sx = -10; sx < cam.W; sx += 14 + r() * 26) { x.fillStyle = `rgba(16,14,24,${0.07 + 0.06 * r()})`; x.beginPath(); x.ellipse(sx, y, 6 + r() * 14, hh * (0.3 + r() * 0.3), 0, 0, Math.PI * 2); x.fill(); }
    }
    manhole(x, cam, st.manhole, K, lit, day, night, wet);
    grate(x, cam, st.drain, K, lit, day);
    gutterSeason(x, cam, st, L.season || 'autumn', r, night);
  });
  // 5. THE WET HOOK (Part 9): the stones darker (in the colours above), puddles mirroring the sky, the lamps' long broken reflections
  if (wet > 0.01) steps.push(x => wetPass(x, L, st, K, T, wet));
  return steps;
}
/** after the front curb (stage.js): THE CURB STEP (PF) + the drain's inlet in the curb's face */
export function streetOver(L, T) {
  const cam = L.cam, st = L.impliedRoad && L.impliedRoad.street;
  if (!st) return null;
  return x => {
    const d = st.drain, za = st.z0, yb = groundY(cam, za), face = Math.max(1.2, cam.F * 0.32 / za), s = cam.F / za;
    const [cx] = project(cam, d.x, 0, za), w = d.w * s * 0.92, h = face * 0.62, K = streetLook(T, L.wet || 0);
    // PF — THE CURB STEP (the owner: "a CLEAR step between the promenade and the street"): the face deeper in shade (the street's
    // tar-dark below it), a crisp lit ARRIS along the top's near edge, the curb's own shadow on the gutter just under the face
    { const day = (T.day || 0) + 0.7 * (T.gold || 0), night = T.night || 0, C = CURB_STEP;
      const fa = C.face.map((v, i) => v * (1 - night) + C.faceN[i] * night), g = x.createLinearGradient(0, yb, 0, yb + face);
      g.addColorStop(0, `rgba(10,10,22,${fa[0].toFixed(3)})`); g.addColorStop(1, `rgba(10,10,22,${fa[1].toFixed(3)})`);
      x.fillStyle = g; x.fillRect(0, yb, cam.W, face);
      const sh = Math.max(1, face * 0.6), sg = x.createLinearGradient(0, yb + face, 0, yb + face + sh);
      sg.addColorStop(0, `rgba(8,8,18,${(C.shadow * (0.6 + 0.4 * day)).toFixed(3)})`); sg.addColorStop(1, 'rgba(8,8,18,0)');
      x.fillStyle = sg; x.fillRect(0, yb + face, cam.W, sh);
      const ac = mix(mix(K.lip, [255, 255, 255], 0.2 * day), [150, 156, 190], night), aa = C.arris * (1 - night) * Math.min(1, 0.45 + day) + C.arrisN * night;
      x.fillStyle = rgb(ac, aa); x.fillRect(0, yb - 0.55, cam.W, 0.55); }
    x.fillStyle = rgb(shade(K.iron, -0.35)); x.beginPath(); x.roundRect(cx - w / 2, yb + face - h, w, h, [1.4, 1.4, 0, 0]); x.fill();
    x.fillStyle = rgb(shade(K.iron, 0.18)); x.fillRect(cx - w / 2 - 0.6, yb + face - h - 0.7, w + 1.2, 0.9);   // the iron lintel
    x.fillStyle = 'rgba(0,0,0,0.35)';
    for (let i = 1; i < 4; i++) x.fillRect(cx - w / 2 + (w * i) / 4 - 0.35, yb + face - h, 0.7, h);           // the inlet's bars
  };
}

function manhole(x, cam, m, K, lit, day, night, wet) {
  const [cx, cy] = project(cam, m.x, 0, m.z), rx = cam.F * m.r / m.z, ry = cam.F * cam.CAMH * m.r / (m.z * m.z), lt = lit(m.x, m.z);
  let ir = K.iron; if (lt) ir = addc(ir, lt, 0.5);
  // the frame (a ring a little wider), the lid's shade + its far rim lit, a waffle of raised studs, a ring, two pick holes
  x.fillStyle = rgb(shade(K.grout, -0.2)); x.beginPath(); x.ellipse(cx, cy, rx + 1.6, ry + 1, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgb(shade(ir, 0.12 + 0.1 * day)); x.beginPath(); x.ellipse(cx, cy, rx + 0.9, ry + 0.55, 0, 0, Math.PI * 2); x.fill();
  const g = x.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, rgb(shade(ir, 0.08 + 0.08 * day))); g.addColorStop(1, rgb(shade(ir, -0.18)));
  x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill();
  x.save(); x.beginPath(); x.ellipse(cx, cy, rx * 0.86, ry * 0.86, 0, 0, Math.PI * 2); x.clip();
  const st = rx / 6, hi = rgb(shade(ir, 0.22 + 0.2 * day + (wet > 0.01 ? 0.2 * wet : 0)), 0.9), lo = rgb(shade(ir, -0.3), 0.8);
  for (let i = -6; i <= 6; i++) for (let j = -3; j <= 3; j++) {
    const px = cx + i * st + (j % 2 ? st / 2 : 0), py = cy + j * st * ry / rx;
    x.fillStyle = lo; x.fillRect(px - st * 0.28, py - st * 0.12 * ry / rx + 0.35, st * 0.56, Math.max(0.5, st * 0.24 * ry / rx));
    x.fillStyle = hi; x.fillRect(px - st * 0.28, py - st * 0.12 * ry / rx, st * 0.56, Math.max(0.4, st * 0.18 * ry / rx));
  }
  x.restore();
  x.strokeStyle = rgb(shade(ir, -0.28)); x.lineWidth = 0.8; x.beginPath(); x.ellipse(cx, cy, rx * 0.88, ry * 0.88, 0, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = rgb(shade(ir, 0.25 + 0.15 * day), 0.7); x.lineWidth = 0.6; x.beginPath(); x.ellipse(cx, cy, rx * 0.88, ry * 0.88, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
  x.fillStyle = 'rgba(0,0,0,0.6)'; for (const d of [-0.5, 0.5]) { x.beginPath(); x.ellipse(cx + d * rx, cy, 1.1, 0.55, 0, 0, Math.PI * 2); x.fill(); }
  if (night > 0.3 && !lt) { x.fillStyle = rgb(K.sky, 0.12); x.beginPath(); x.ellipse(cx, cy - ry * 0.4, rx * 0.6, ry * 0.25, 0, 0, Math.PI * 2); x.fill(); }   // (a faint sky sheen)
}
function grate(x, cam, d, K, lit, day) {
  const [ax, ay] = project(cam, d.x - d.w / 2, 0, d.z1), [bx, by] = project(cam, d.x + d.w / 2, 0, d.z0), lt = lit(d.x, d.z0);
  let ir = K.iron; if (lt) ir = addc(ir, lt, 0.5);
  x.fillStyle = rgb(shade(ir, 0.1 + 0.12 * day)); x.fillRect(ax - 0.7, ay - 0.4, bx - ax + 1.4, by - ay + 0.8);
  x.fillStyle = 'rgba(6,6,12,0.85)'; x.fillRect(ax, ay, bx - ax, by - ay);
  const n = 9, w = (bx - ax) / n;
  for (let i = 0; i < n; i++) { x.fillStyle = rgb(shade(ir, 0.05 + 0.1 * day)); x.fillRect(ax + i * w + w * 0.6, ay, w * 0.4, by - ay); }
  x.fillStyle = rgb(shade(ir, 0.3 + 0.2 * day), 0.7); x.fillRect(ax - 0.7, ay - 0.4, bx - ax + 1.4, 0.5);
}
function gutterSeason(x, cam, st, season, r, night) {
  const [z0] = st.gutter, zv = z0 + 0.25, yv = groundY(cam, zv), dim = 1 - 0.6 * night;
  const cols = season === 'autumn' ? [[196, 64, 38], [222, 120, 40], [214, 168, 58], [150, 52, 40], [176, 98, 44]] : season === 'spring' ? [[250, 222, 230], [244, 196, 210]] : season === 'winter' ? [[210, 210, 214], [168, 160, 150]] : null;
  if (!cols) return;
  const n = season === 'autumn' ? 46 : season === 'spring' ? 18 : 60;
  for (let i = 0; i < n; i++) {
    // (clustered toward the drain: the water carries them there)
    const near = r() < 0.4, sx = near ? project(cam, st.drain.x, 0, zv)[0] + (r() - 0.5) * 60 : r() * cam.W, sy = yv + (r() - 0.5) * 2.4;
    const c = mulc(cols[(r() * cols.length) | 0], dim);
    if (season === 'winter') { x.fillStyle = rgb(c, 0.5); x.fillRect(sx, sy, 0.8, 0.6); continue; }
    x.fillStyle = rgb(c, 0.9); x.beginPath(); x.ellipse(sx, sy, 1.3 + r() * 1.1, 0.6 + r() * 0.4, (r() - 0.5) * 1.2, 0, Math.PI * 2); x.fill();
  }
}
function wetPass(x, L, st, K, T, wet) {
  const cam = L.cam, r = rngFrom(2027), y0 = groundY(cam, st.z0), night = T.night || 0;
  // puddles: in the gutter, between the rails, in the lanes' low spots — the sky mirrored (lighter at the far edge)
  const spots = [[st.gutter[0] + 0.2, 6], [(st.rails[0] + st.rails[1]) / 2, 4], [st.lanes[0].z + 1.05, 3], [st.lanes[1].z + 1.05, 3]];
  for (const [z, n] of spots) for (let i = 0; i < n; i++) {
    const sx = r() * cam.W, y = groundY(cam, z), w = 14 + r() * 34, h = Math.max(1.4, cam.F * cam.CAMH * (0.35 + r() * 0.3) / (z * z));
    // (a soft-edged pool: the sky mirrored, brighter toward its far edge, fading out at its rim — two lobes, never an oval sticker)
    for (const [ox, oy, kw, kh] of [[0, 0, 1, 1], [0.6, 0.3, 0.55, 0.75]]) {
      const g = x.createRadialGradient(0, -0.25, 0, 0, 0, 1);
      g.addColorStop(0, rgb(addc(K.sky, [26, 26, 26]), 0.78 * wet)); g.addColorStop(0.7, rgb(K.sky, 0.42 * wet)); g.addColorStop(1, rgb(K.sky, 0));
      x.save(); x.translate(sx + w * ox, y + h * oy); x.scale(w * kw, h * kh); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, Math.PI * 2); x.fill(); x.restore();
    }
  }
  // the lamps' reflections — C4a (the owner: two dotted streaks "going their own ways"; C4d — H1: the posts' streaks gone with them):
  // never the IMPLIED lamps (they stand BEHIND us, below the screen: a wet floor can't mirror them) — their light comes back
  // as THE SHEEN below: the whole wet street glazed by their pools, brightest at the screen's foot (nearest them), the puddles bright
  const k = (T.lamps || 0) * wet;
  if (k > 0.02) {
    const g = x.createLinearGradient(0, y0, 0, cam.H);
    g.addColorStop(0, 'rgba(240,190,130,0)'); g.addColorStop(0.55, `rgba(240,190,130,${(0.05 * k).toFixed(3)})`); g.addColorStop(1, `rgba(240,190,130,${(0.16 * k).toFixed(3)})`);
    x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(0, y0, cam.W, cam.H - y0);
    x.globalCompositeOperation = 'source-over';
  }
  // the whole street's sheen: the sky's light along the far edge of every course (a glaze)
  x.fillStyle = rgb(K.sky, 0.08 * wet * (1 - 0.5 * night)); x.fillRect(0, y0, cam.W, cam.H - y0);
}
