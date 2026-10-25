// CITY 2.0 — THE HARBOR, PART 7a: THE SPEAKEASY — the closest, biggest building on screen, so the most crafted thing in the city.
// A once-grand 1920s Deco corner building over warm brick (cream terracotta trim, a carved cornice, spandrel panels, a stepped
// crest), cozy and a bit worn (soot + rain streaks, chipped terracotta, faded gilt, ivy on the corner, a patched awning), its
// BARBERSHOP front the cover (the big window with the chair + the mirror wall + gold-leaf lettering, the turning pole, the
// "EST. 1924" awning, the unmarked side door), ONE quiet hint of the secret (the basement window's amber glow, even by day), and
// on its side wall a weekly GHOST AD for one of our games under three gooseneck lamps (core/harbor-speakeasy.js: the plan).
//
// HOW IT'S DRAWN — every wall is PAINTED FLAT in its own units (u across, v up; the same material system as the skyline: blocks.js
// #faces, the real sun's side + height, the day / golden / night tones) and projected: the front faces us (one affine map), the
// side wall recedes (perspective, one source column per device pixel — exact for a vertical wall). Baked per look into 'stage'
// (speakeasySteps, in small steps); what changes at night is LIVE (createSpeakeasy): the windows' rooms lit (one cached canvas,
// re-rendered only when a window's light changes), their glow on the brick, the shop's one lamp, the sconce, the basement's amber,
// the ad's lamps, the barber pole turning. HOOKS for 7b: windows() (each window's rect + room), light(id, k), mirror(k).
import { drawDoor } from './doors.js';
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V, ROOMS, roomLight } from '../../core/harbor-speakeasy.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, mix, shade, box, poly } from './shapes.js';
import { faces } from './blocks.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { dayPaint } from './signs.js';
import { paintRoom, createWindowLife, lateOf } from './windows.js';
import { createHushSign } from './hushsign.js';
import { frontProfile } from './strings.js';
import { clamp01, tri, FONT, V, W_FRONT, GLASS_IN, AWNING_LAMP, VAL, awningBulbs, SHOP_GLOW, DOOR_FLOOD, speakGeo, mats, wallMap, R, devRect, fillPat, text, brickTile, streak, fan, chevrons } from './speakeasy-geo.js';
import { BLADE, BLADE_GLOW, bladeGeo, bladeOutline, MARQUEE, marqueeBulbs, marqueeScreen, marqueeLevel, LETTER, BLADE_SPLIT, BLADE_ONE, bladeWords, bladeLetters, paintLetters, paintBlade } from './speakeasy-blade.js';
import { paintStructure, paintFrontDeco, DATE, paintDateStone, paintWindow, paintGround, paintGilt, GILT, WASH, washCone, smooth, paintWashers, paintWasherLamps, paintLight, bladeStep, speakeasySteps } from './speakeasy-bake.js';
export * from './speakeasy-geo.js';
export * from './speakeasy-blade.js';
export * from './speakeasy-bake.js';

/** 8P — THE BASEMENT WINDOW's colours (the only window this colour: a smoky amber edging to copper — darker + smokier at the top) */
export const BASEMENT = Object.freeze({ top: [150, 52, 22], mid: [236, 112, 44], low: [255, 150, 70], day: 0.38, night: 0.34, pass: 13, beat: 0.32 });
const hh01 = (n, s) => { let h = (n * 374761393 + s * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/**
 * The basement's light at t (s) — PURE: { a (its level), shadows: [{ x (0..1 across), s (size × the opening's height), a }], flick }.
 * night 0..1 (brighter after dark), beat 0..1 (a party night's punch × its ramp). A pass every BASEMENT.pass s or so (seeded by the
 * slot: ~3 in 5 slots), one or two figures walking across in ~3–4 s, dimming the light a little as they pass; a flicker ~once in 8
 * minutes (two quick dips).
 */
export function basementLight(t, { night = 0, beat = 0 } = {}) {
  const B = BASEMENT, slot = Math.floor(t / B.pass), u = t - slot * B.pass, shadows = [];
  let dim = 0;
  if (hh01(slot, 3) < 0.6) {
    const dur = 3 + hh01(slot, 4) * 1.4, dir = hh01(slot, 5) < 0.5 ? 1 : -1, n = hh01(slot, 6) < 0.35 ? 2 : 1, t0 = 1 + hh01(slot, 7) * (B.pass - dur - 2);
    for (let i = 0; i < n; i++) {
      const p = (u - t0 - i * 0.55) / dur;
      if (p <= 0 || p >= 1) continue;
      const x = dir > 0 ? -0.15 + 1.3 * p : 1.15 - 1.3 * p;
      shadows.push({ x, s: 0.95 + 0.25 * hh01(slot, 8 + i), a: 0.55 + 0.2 * hh01(slot, 10 + i) });
      dim = Math.max(dim, 0.14 * Math.sin(Math.PI * p));
    }
  }
  // the rare flicker: one slot in ~8 minutes, two quick dips at a seeded second
  const fs = Math.floor(t / 480), ft = t - fs * 480 - (20 + hh01(fs, 21) * 440);
  const flick = hh01(fs, 20) < 0.5 && ft > 0 && ft < 0.45 ? (ft < 0.08 || (ft > 0.18 && ft < 0.26) ? 0.45 : 0) : 0;
  const a = (B.day + B.night * Math.max(0, Math.min(1, night))) * (1 - dim) * (1 + B.beat * beat) * (1 - flick);
  return { a, shadows, flick };
}
// ------------------------------------------------------------------ LIVE: the lit rooms, the glows, the pole, the ad's lamps
/** THE BARBER POLE's turn (FP, PURE): the stripes' phase (0..1 of a period) after dt s — the shop's pace by day, the slow night turn
 *  when lit; continuous (never rounded to a pixel or a frame: the strip slides at a fractional offset) */
export const POLE_DAY = 0.42, POLE_NIGHT = 0.16;        // (periods a second)
export const poleRate = lit => POLE_DAY + (POLE_NIGHT - POLE_DAY) * clamp01(lit);
export const poleTurn = (ph, dt, lit) => (ph + Math.max(0, dt) * poleRate(lit)) % 1;
/** FP2 — THE TURN BY REAL TIME (the owner: "still jittery" on her iPhone): the phase is a pure function of the frame's timestamp from
 *  an ANCHOR { t, ph, rate } — never a sum of frame steps (a skipped frame, the 30 fps battery saver or a long frame can't step it).
 *  poleAnchor() re-anchors only when the rate changes (dusk's ramp, the raid, reduced motion), keeping the phase continuous. */
export const polePhase = (a, t) => { const v = a.ph + Math.max(0, t - a.t) * a.rate; return v - Math.floor(v); };
export const poleAnchor = (a, t, rate, ph0 = 0.3) => (a && Math.abs(a.rate - rate) < 1e-9 && t >= a.t ? a : { t, ph: a ? polePhase(a, t) : ph0, rate });   // (a clock that went back: re-anchored, held)
/** the helix's stripes at a point (PURE): v = the distance along the glass in the helix's frame (pt), band (pt), w = the pixel's
 *  footprint along v (pt: a box filter — the analytic antialiasing) → [red, blue] coverage 0..1 (the rest: the white) */
const POLE_RISE = 0.9, POLE_TH = 0.42;          // (a helix's rise across the glass's front, the stripe's thickness — in bands)
export function poleStripe(v, band, w) {
  const P = 2 * band, TH = POLE_TH * band, hw = Math.max(1e-4, w) / 2;
  const seg = a => { let u = v - a; u -= Math.floor(u / P) * P; let s = 0; for (const o of [-P, 0, P]) s += Math.max(0, Math.min(u + hw, o + TH) - Math.max(u - hw, o)); return Math.min(1, s / (2 * hw)); };
  return [seg(0), seg(band)];
}
/** the pole's three colours (PURE): the paint by day (dimmed by the light: lum), the glass LIT from inside at night (FP2: a cool,
 *  LED-bright white, the red + blue vivid), a PARTY night's neon (red → magenta, blue → electric blue, white → gold; party = the
 *  party's ramp × lit — back to red / white / blue as the 2 am wind-down ramps it out), punch: the beat's gentle lift */
export const POLE_PAINT = { w: [244, 242, 236], r: [200, 30, 40], b: [30, 60, 160] };
export const POLE_LIT = { w: [240, 247, 255], r: [255, 52, 70], b: [58, 112, 255] };
export function poleColours({ lum = 1, lit = 0, party = 0, pal = null, punch = 0 } = {}) {
  const P = pal && pal.length >= 2 ? pal : [[255, 63, 176], [63, 224, 255], [166, 91, 255], [255, 204, 90]];
  const neon = { r: P[0], b: mix(P[1], [60, 110, 255], 0.35), w: mix([255, 246, 226], P[3] || P[2] || [255, 204, 90], 0.62) };
  const lift = 1 + 0.22 * clamp01(punch) * clamp01(party);
  const o = {};
  for (const k of ['w', 'r', 'b']) {
    const day = POLE_PAINT[k].map(v => v * lum + 8 * (1 - lum));
    const c = mix(mix(day, POLE_LIT[k], clamp01(lit)), neon[k], clamp01(party));
    o[k] = c.map(v => Math.min(255, v * lift));
  }
  return o;
}
/** the light round the lit glass (PURE, FP2 — no smoke): a TIGHT halo hugging the glass (gone within POLE_HALO.tight glass radii of
 *  its edge) + the light LANDING on the brick beside it (faint, gone within POLE_HALO.land radii). d = the distance from the glass (pt),
 *  r = its radius (pt) → alpha 0..1 */
export const POLE_HALO = Object.freeze({ tight: 1.8, land: 4.2, a: 0.42, aLand: 0.17 });
export function poleHalo(d, r) {
  const H = POLE_HALO, t = Math.max(0, d) / r;
  return (t < H.tight ? H.a * Math.pow(1 - t / H.tight, 2) : 0) + (t < H.land ? H.aLand * Math.pow(1 - t / H.land, 2) : 0);
}
/**
 * createSpeakeasy(): what changes at night (and the pole by day). layout(L, { dpr }) → the windows on screen; draw(c, f) with
 * f = { k (the windows' light 0..1), lamp (the ad's lamps), sconce, day, night, t (the frame's timestamp, s), motion, fade, hour, game,
 * party: { ramp, punch, pal } | null (FP2: the barber pole's party neon + the beat) }.
 * HOOKS (7b): windows() → [{ id, room, floor, col, edge, rect }], light(id, k|null) (a window's own level, null = the
 * timeline's), mirror(k) (the hidden door's opening 0..1 — 7b animates it; today a hook only), roomDraw(id, fn) (a moment's own
 * painter over a window).
 */
export function createSpeakeasy() {
  let G = null, dpr = 1, wins = [], box = null, litCv = null, litKey = '', basement = null;
  const own = new Map(), drawers = new Map();
  let mirror = 0, lastK = -1;   // (mirror: the hidden door's hook — FP3b's real doors read it; lastK: debug().k)
  // PART 7b — THE LIFE: the window moments, the rooms' states, the taps (screens/harbor/windows.js; the plan: core/harbor-moments.js)
  const life = createWindowLife();
  // 8P — THE HUSH WORD SIGN in the shop window (hushsign.js; Lobby 2.0: hush(word))
  const hush = createHushSign();
  let basementDbg = null;
  let giltCv = null, giltKey = '', giltAt = null, lastT = 0, lastGame = null, bedsNow = { club: 0, tv: 0, party: false };
  function layout(L, o = {}) {
    G = speakGeo(L); dpr = Math.min(2, o.dpr || 1);
    const s = G.s;
    wins = ROOMS.map(rm => { const [a, b] = s.windows[rm.col], [r0, r1] = s.rows[rm.floor - 2], [x0, y0] = G.front(a, r1), [x1, y1] = G.front(b, r0); return { ...rm, u: [a, b], v: [r0, r1], rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } }; });
    bulbKey = '';
    const [bx0, by0] = G.front(0, V.crest + 0.2), [bx1] = G.side(G.len, 0), [, by1] = G.front(0, 0);
    box = { x: Math.max(0, Math.floor(bx0)), y: Math.floor(by0), w: Math.ceil(Math.min(G.cam.W, bx1) - Math.max(0, bx0)) + 1, h: Math.ceil(by1 - by0) + 1 };
    const [b0, b1, bv0, bv1] = s.shop.basement, [p, py] = G.front(b0, bv1), [q, qy] = G.front(b1, bv0);
    basement = { x: p, y: py, w: q - p, h: qy - py };
    litKey = bladeKey = '';
    hush.layout(G, { dpr });
  }
  // the window's level now: its own (a hook) or the timeline's (core/harbor-speakeasy.js#roomLight)
  const levelOf = (rm, f) => (own.has(rm.id) ? own.get(rm.id) : roomLight(rm.id, f.hour));
  function canvasFor(cv) { cv = cv || document.createElement('canvas'); const w = Math.ceil(box.w * dpr), h = Math.ceil(box.h * dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return cv; }
  // the rooms, lit (one canvas over the speakeasy's box; re-painted only when a window's level moves a step)
  function paintLit(levels, late = 0) {
    litCv = canvasFor(litCv);
    const x = safeCtx(litCv);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, litCv.width, litCv.height);
    x.setTransform(dpr, 0, 0, dpr, -box.x * dpr, -box.y * dpr);
    const [ox, oy] = G.front(0, 0);
    x.save(); wallMap(x, ox, oy, G.K);
    wins.forEach((w, i) => { const a = levels[i]; if (a > 0.01) { x.globalAlpha = a; paintRoom(x, w, { late }); x.globalAlpha = 1; } });
    // the barbershop after hours: one dim lamp over the empty chair, its pool on the floor + the chair, the mirror catching it
    const [w0, w1, wv0, wv1] = G.s.shop.win, lx = w0 + (w1 - w0) * 0.38;
    x.save(); x.beginPath(); x.rect(w0, wv0, w1 - w0, wv1 - wv0); x.clip();
    // SP2 — CRISP, the shop the cleanest warm-white of the facade (the owner): the globe a bright source with a TIGHT halo, its light
    // LANDING — a cone down the back wall + the mirror panels under it, the chair's top edges + the headrest catching it, a pool on the
    // floor, a glint in the mirror; the dark shop round it stays dark (no wide glow over the glass)
    { const ly = wv1 - 0.48, W = [255, 238, 210], c = a => `rgba(${W},${a})`;
      // (the pool on the back wall + the mirrors under the lamp: an upright oval, bright near the lamp, gone within ~1.3 units)
      { const g = x.createRadialGradient(lx, ly - 0.25, 0, lx, ly - 0.25, 1.35); g.addColorStop(0, c(0.55)); g.addColorStop(0.35, c(0.28)); g.addColorStop(0.7, c(0.08)); g.addColorStop(1, c(0));
        x.save(); x.translate(lx, ly - 0.25); x.scale(0.72, 1); x.translate(-lx, -(ly - 0.25)); x.fillStyle = g; x.fillRect(lx - 1.35, ly - 1.6, 2.7, 2.7); x.restore(); }
      const cx = w0 + (w1 - w0) * 0.36, base = wv0 + 0.02;
      x.fillStyle = c(0.9); x.fillRect(cx - 0.36, base + 0.84, 0.82, 0.05); x.fillRect(cx - 0.42, base + 1.58, 0.2, 0.05); x.fillRect(cx - 0.48, base + 1.99, 0.36, 0.05); x.fillRect(cx - 0.3, base + 1.03, 0.72, 0.03);
      const fl = x.createRadialGradient(lx, wv0 + 0.44, 0, lx, wv0 + 0.44, 1.1); fl.addColorStop(0, c(0.4)); fl.addColorStop(1, c(0));
      x.save(); x.translate(lx, wv0 + 0.44); x.scale(1, 0.18); x.translate(-lx, -(wv0 + 0.44)); x.fillStyle = fl; x.fillRect(lx - 1.1, wv0 + 0.44 - 1.1, 2.2, 2.2); x.restore();
      x.fillStyle = c(0.55); x.fillRect(lx + 0.62, wv0 + 1.0, 0.035, 0.9);
      const hg = x.createRadialGradient(lx, ly, 0, lx, ly, 0.28); hg.addColorStop(0, c(0.9)); hg.addColorStop(0.45, c(0.3)); hg.addColorStop(1, c(0)); x.fillStyle = hg; x.fillRect(lx - 0.28, ly - 0.28, 0.56, 0.56); }
    x.fillStyle = 'rgb(255,250,236)'; x.beginPath(); x.arc(lx, wv1 - 0.48, 0.1, 0, Math.PI * 2); x.fill();
    x.restore();
    x.restore();
  }
  // SP2 — THE BLADE AT NIGHT: its letters LIT (warm-white, a crisp bright letter + a tight baked glow), one canvas per game + size
  let bladeCv = null, bladeKey = '', bladeAt = null;
  function paintBladeLit(game) {
    const bg = bladeGeo(G), R0 = bg.rect, pad = 4, ow = R0.w + pad * 2 + G.K, oh = R0.h + pad * 2;
    bladeCv = bladeCv || document.createElement('canvas');
    bladeCv.width = Math.ceil(ow * dpr); bladeCv.height = Math.ceil(oh * dpr);
    const x = safeCtx(bladeCv), ox = R0.x - pad - G.K * 0.5, oy = R0.y - pad;
    x.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr); x.clearRect(ox, oy, ow, oh);
    x.save(); wallMap(x, bg.ox, bg.oy, bg.k);
    paintBlade(x, { ...mats({ day: 0, gold: 0, night: 1, sunDir: 0, sunEl: 30, ovc: 0, haze: [40, 40, 70] }), glowPx: BLADE_GLOW * dpr }, game, true);
    x.restore();
    return { x: ox, y: oy, w: ow, h: oh };
  }
  // the gold leaf laid again over whatever moves behind the shop's glass (7b: the barber, the customer, the mirror door's light) —
  // one small canvas per look (the gilt's colours by the day / golden / night tones), drawn 1:1 over the window
  function giltOver(c, f) {
    const T = f.tw || { day: 1, gold: 0, night: 0 }, key = [T.day || 0, T.gold || 0, T.night || 0].map(v => v.toFixed(1)).join(',') + '|' + dpr + '|' + G.K.toFixed(2);
    if (key !== giltKey || !giltCv) {
      giltKey = key;
      const [w0, w1, wv0, wv1] = G.s.shop.win, [ax, ay] = G.front(w0, wv1), [bx, by] = G.front(w1, wv0);
      // (on whole DEVICE pixels, drawn at its natural size: never resampled)
      giltAt = { x: Math.floor(ax * dpr) / dpr, y: Math.floor(ay * dpr) / dpr, w: 0, h: 0 };
      giltCv = giltCv || document.createElement('canvas'); giltCv.width = Math.ceil((bx - giltAt.x + 2) * dpr); giltCv.height = Math.ceil((by - giltAt.y + 2) * dpr);
      giltAt.w = giltCv.width / dpr; giltAt.h = giltCv.height / dpr;
      const x = safeCtx(giltCv), [ox, oy] = G.front(0, 0);
      x.setTransform(dpr, 0, 0, dpr, -giltAt.x * dpr, -giltAt.y * dpr);
      x.save(); wallMap(x, ox, oy, G.K); x.beginPath(); x.rect(w0, wv0, w1 - w0, wv1 - wv0); x.clip();
      paintGilt(x, { gilt: tri(T, [214, 168, 78], [236, 176, 90], [86, 70, 58]), giltHi: tri(T, [255, 232, 160], [255, 214, 140], [120, 100, 80]), giltLo: tri(T, [128, 86, 34], [140, 80, 40], [40, 30, 34]), night: T.night || 0, lamps: T.night || 0 }, G.s.shop);
      x.restore();
    }
    c.drawImage(giltCv, giltAt.x, giltAt.y, giltAt.w, giltAt.h);
  }
  // THE MARQUEE's lit bulbs, all in one sprite over the blade (screen pt + a halo's pad): each a crisp warm-white globe (the hot core) + a
  // small TIGHT halo (none at tier 0) at its level (steady; the party's slow chase: marqueeLevel)
  let bulbCv = null, bulbKey = '', bulbAt = null;
  function paintBulbs(a, tier, pk, beats, beatU) {
    const S = marqueeScreen(bladeGeo(G)), pad = S[0].r * MARQUEE.halo + 2;
    const x0 = Math.min(...S.map(b => b.x)) - pad, y0 = Math.min(...S.map(b => b.y)) - pad, x1 = Math.max(...S.map(b => b.x)) + pad, y1 = Math.max(...S.map(b => b.y)) + pad;
    bulbAt = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    bulbCv = bulbCv || document.createElement('canvas'); bulbCv.width = Math.ceil(bulbAt.w * dpr); bulbCv.height = Math.ceil(bulbAt.h * dpr);
    const x = safeCtx(bulbCv); x.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr); x.clearRect(x0, y0, bulbAt.w, bulbAt.h);
    x.globalCompositeOperation = 'lighter';
    for (const b of S) {
      const lv = marqueeLevel(b.i, pk, beats, beatU) * a * (b.i === dead.i ? dead.k : 1);   // (8b1: a dead bulb — the repairman's next morning)
      if (tier !== 0) soft(x, [255, 206, 140], b.x, b.y, b.r * MARQUEE.halo, 0.55 * lv);
      soft(x, [255, 236, 196], b.x, b.y, b.r * 1.7, 0.9 * lv);
      soft(x, [255, 252, 240], b.x, b.y, b.r * 0.95, lv);
    }
  }
  // FP — A SOFT GLOW (the owner: the sconce + the shop's lamp read as hard-edged blobs): a near-gaussian falloff, no knee, per colour
  const softs = new Map();
  function softGlow(col) {
    const key = col.join(','); let cv = softs.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const x = safeCtx(cv), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [t, a] of [[0, 1], [0.1, 0.86], [0.22, 0.6], [0.36, 0.34], [0.52, 0.15], [0.7, 0.05], [0.86, 0.012], [1, 0]]) g.addColorStop(t, `rgba(${key},${a})`);
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); softs.set(key, cv);
    return cv;
  }
  const soft = (c, col, cx, cy, r, a, sy = 1) => { if (a <= 0.004) return; c.globalAlpha = Math.min(1, a); c.drawImage(softGlow(col), cx - r, cy - r * sy, r * 2, r * 2 * sy); };
  // THE BARBER POLE (live): a glass cylinder of red / white / blue spirals in chrome caps. It ALWAYS turns — by day unlit, at the
  // shop's pace; from DUSK until MORNING lit from inside and turning SLOWLY, even with the CLOSED card up: the secret "we're open".
  // (7b's raid: pole({ on: false }) snaps it dark and stops it; pole({ on: true }) gives it back.)
  // FP2 — the owner, on her iPhone: "still jittery". FP slid a strip texture (3 px a point) under the glass: on the phone's canvas
  // (dpr 1.5 at tier 1, 2 at tier 2) that is a 2:1 / 3:2 DOWNSAMPLE every frame — bilinear minification aliases a slow slide (the
  // helices' edges crawl + shimmer), and any browser that snaps an image to whole pixels steps it. Now the glass is computed PER
  // DEVICE PIXEL every drawn frame (a ~10 × 60 px patch: < 0.1 ms): each pixel's helix coordinate at the exact fractional phase, its
  // stripe coverage box-filtered over the pixel's footprint (analytic antialiasing, band-limited: no crawl), the cylinder's edges
  // antialiased the same way — then put at a WHOLE device pixel, 1:1, so nothing resamples it at all. The phase is a pure function
  // of the frame's timestamp (polePhase: never a sum of frame steps), so the 30 fps battery saver only draws fewer, evenly spaced
  // positions of the same smooth slide (night 1.6 pt/s ≈ 0.05 pt a frame; day ≈ 0.14 pt). Lit: an LED-bright cool white, the red +
  // blue vivid, a TIGHT halo + a little light on the brick beside it (no smoky wash: poleHalo); a party night: neon colours + the beat.
  let poleA = null, polePh = 0.3, poleOff = false, poleRect = null, polePx = null;
  const glowAt = {};                                    // (the e2e: where the sconce + the shop lamp glow)
  let poleCv = null, poleImg = null, haloCv = null, haloKey = '';
  // the glass, per device pixel (m: the canvas's transform — device px a point + its offset): → { cv, X, Y } (whole device pixels)
  function poleGlass(m, gx, gy, gh, cx, r, band, ph, C) {
    const k = m.a, X0 = Math.floor((cx - r) * k + m.e), X1 = Math.ceil((cx + r) * k + m.e), Y0 = Math.floor(gy * k + m.f), Y1 = Math.ceil((gy + gh) * k + m.f);
    const W = Math.max(1, X1 - X0), H = Math.max(1, Y1 - Y0);
    if (!poleCv) poleCv = document.createElement('canvas');
    if (poleCv.width !== W || poleCv.height !== H) { poleCv.width = W; poleCv.height = H; poleImg = null; }
    const x = safeCtx(poleCv); if (!x || !x.createImageData) return null;
    if (!poleImg) poleImg = x.createImageData(W, H);
    const d = poleImg.data, P = 2 * band, rise = POLE_RISE * band / 2, off = ph * P, top = gy - r * 0.35 - off - band;
    for (let i = 0; i < W; i++) {
      const px = (X0 + i + 0.5 - m.e) / k, dx = px - cx, cvx = clamp01(0.5 + (r - Math.abs(dx)) * k);
      const xn = Math.max(-0.995, Math.min(0.995, dx / r)), dy = -rise * Math.asin(xn) / (Math.PI / 2);
      const slope = rise * (2 / Math.PI) / Math.sqrt(1 - xn * xn) / r, w = Math.min(band * 0.8, Math.hypot(1, slope) * 1.15 / k);
      for (let j = 0; j < H; j++) {
        const o = (j * W + i) * 4;
        if (cvx <= 0) { d[o + 3] = 0; continue; }
        const py = (Y0 + j + 0.5 - m.f) / k, cvy = clamp01(0.5 + Math.min(py - gy, gy + gh - py) * k);
        const [cr, cb] = poleStripe(py - top - dy, band, w), cw = 1 - cr - cb;
        d[o] = C.w[0] * cw + C.r[0] * cr + C.b[0] * cb; d[o + 1] = C.w[1] * cw + C.r[1] * cr + C.b[1] * cb; d[o + 2] = C.w[2] * cw + C.r[2] * cr + C.b[2] * cb;
        d[o + 3] = 255 * cvx * cvy;
      }
    }
    x.putImageData(poleImg, 0, 0);
    return { cv: poleCv, X: X0, Y: Y0, W, H };
  }
  // the halo sprite (per size + colour step; device pixels): the tight halo + the light landing on the brick beside the glass
  function poleHaloCv(m, gx, gy, gh, r, col) {
    const k = m.a, R = POLE_HALO.land * r, key = [r, gh, k, col.join(',')].map(v => (typeof v === 'number' ? v.toFixed(2) : v)).join('|');
    const X0 = Math.floor((gx - R) * k + m.e), Y0 = Math.floor((gy - R) * k + m.f), W = Math.ceil((2 * r + 2 * R) * k) + 2, H = Math.ceil((gh + 2 * R) * k) + 2;
    if (haloCv && haloKey === key) return { cv: haloCv, X: X0, Y: Y0 };
    haloCv = haloCv || document.createElement('canvas'); haloCv.width = W; haloCv.height = H; haloKey = key;
    const x = safeCtx(haloCv); if (!x || !x.createImageData) return null;
    const im = x.createImageData(W, H), d = im.data;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const px = (X0 + i + 0.5 - m.e) / k, py = (Y0 + j + 0.5 - m.f) / k;
      const ex = Math.max(gx - px, 0, px - gx - 2 * r), ey = Math.max(gy - py, 0, py - gy - gh), a = poleHalo(Math.hypot(ex, ey), r), o = (j * W + i) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.min(255, 255 * a);
    }
    x.putImageData(im, 0, 0);
    return { cv: haloCv, X: X0, Y: Y0 };
  }
  /** POL4 — a door's FLOOD: a warm wash from its lamp at (u, v top) down over the door (half width hw, height h) + onto its step — an
   *  elliptical falloff brightest just under the lamp, additive (the caller is in 'lighter') */
  function flood(c, u, v, hw, h, a) {
    const [cx, cy] = G.front(u, v - h * 0.38), rx = hw * DOOR_FLOOD.w * 2.2 * G.K, ry = h * DOOR_FLOOD.h * 0.62 * G.K;
    const g = c.createRadialGradient(cx, cy - ry * 0.35, 0, cx, cy - ry * 0.35, Math.max(rx, ry));
    const col = DOOR_FLOOD.col.join(','), k = DOOR_FLOOD.k * a;
    g.addColorStop(0, `rgba(${col},${k.toFixed(3)})`); g.addColorStop(0.45, `rgba(${col},${(k * 0.45).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`);
    c.save(); c.globalAlpha = 1; c.translate(cx, cy); c.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); c.translate(-cx, -cy);
    c.fillStyle = g; c.fillRect(cx - Math.max(rx, ry), cy - Math.max(rx, ry) * 1.4, Math.max(rx, ry) * 2, Math.max(rx, ry) * 2.8); c.restore();
  }
  function drawPole(c, f) {
    const s = G.s, p = s.shop.pole, z = s.z0 - 0.42, [cx, y0] = project(G.cam, s.x0 + p.u, p.v1, z), [, y1] = project(G.cam, s.x0 + p.u, p.v0, z), sc = G.cam.F / z, r = 0.17 * sc, h = y1 - y0;
    const day = clamp01(f.day), lit = poleOff ? 0 : clamp01(f.pole == null ? f.k : f.pole), fade = f.fade == null ? 1 : f.fade;
    const pt = f.party || null, partyK = pt ? clamp01(pt.ramp == null ? pt.on : pt.ramp) * lit : 0, punch = pt && f.motion ? clamp01(pt.punch || 0) : 0;
    const lum = 0.2 + 0.8 * day;
    // the turn: the frame's timestamp → the phase (re-anchored only when the rate changes; still when the motion is off or the raid)
    poleA = poleAnchor(poleA, f.t, f.motion && !poleOff ? poleRate(lit) : 0, polePh); polePh = polePhase(poleA, f.t);
    poleRect = { x: cx - r, y: y0, w: 2 * r, h };
    const m = c.getTransform(), kk = m.a || 1, band = r * 2.2;
    const gx = cx - r, gy = y0 + r * 0.35, gh = h - r * 0.7, C = poleColours({ lum, lit, party: partyK, pal: pt && pt.pal, punch });
    c.save();
    // the TIGHT halo + the light on the brick beside it (FP2: no wide wash — poleHalo), cool white; tinted by a party night's neon
    if (lit > 0.01) {
      const q = Math.round(partyK * 8) / 8, hc = mix([214, 232, 255], mix(C.r, C.b, 0.5), q * 0.6).map(Math.round), hs = poleHaloCv(m, gx, gy, gh, r, hc);
      if (hs) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, lit * fade * (f.tier === 0 ? 0.8 : 1) * (1 + 0.5 * punch)); c.drawImage(hs.cv, hs.X, hs.Y); c.restore(); }
    }
    c.globalAlpha = fade;
    // the chrome cap + finial, the base (lit: catching the glass's cool light)
    c.fillStyle = rgb(mix([196, 200, 210].map(v => v * lum + 8 * (1 - lum)), [206, 218, 236], lit * 0.6)); c.beginPath(); c.ellipse(cx, y0, r * 1.25, r * 0.5, 0, Math.PI, 0); c.fill(); c.fillRect(cx - r * 1.25, y0, r * 2.5, r * 0.35);
    c.beginPath(); c.arc(cx, y0 - r * 0.85, r * 0.35, 0, Math.PI * 2); c.fill();
    c.fillRect(cx - r * 1.25, y1 - r * 0.35, r * 2.5, r * 0.5);
    // the glass: computed per device pixel at the exact phase, put at a whole device pixel (no resampling: never stepped, never crawling)
    const pg = poleGlass(m, gx, gy, gh, cx, r, band, polePh, C);
    if (pg) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = fade; c.drawImage(pg.cv, pg.X, pg.Y); c.restore(); polePx = { X: pg.X, Y: pg.Y, W: pg.W, H: pg.H, band: +band.toFixed(3), k: kk }; }
    c.beginPath(); c.rect(gx, gy, r * 2, gh); c.clip();
    // the glass's roundness: lit — the edges a cool dark, an LED-bright core ADDED down the middle; by day dark edges + a highlight
    const g = c.createLinearGradient(gx, 0, gx + r * 2, 0);
    if (lit > 0.01) { const e0 = (0.46 - 0.2 * lit).toFixed(3), e1 = (0.5 - 0.18 * lit).toFixed(3); g.addColorStop(0, `rgba(16,20,40,${e0})`); g.addColorStop(0.3, 'rgba(16,20,40,0)'); g.addColorStop(0.7, 'rgba(12,14,32,0)'); g.addColorStop(1, `rgba(12,14,32,${e1})`); }
    else { g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(0.3, 'rgba(255,255,255,0.32)'); g.addColorStop(0.42, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); }
    c.fillStyle = g; c.fillRect(gx, gy, r * 2, gh);
    if (lit > 0.01) {
      const hg = c.createLinearGradient(gx, 0, gx + r * 2, 0), a = (0.5 * lit * (1 + 0.4 * punch)).toFixed(3);
      hg.addColorStop(0.2, 'rgba(236,244,255,0)'); hg.addColorStop(0.45, `rgba(236,244,255,${a})`); hg.addColorStop(0.7, 'rgba(236,244,255,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = hg; c.fillRect(gx, gy, r * 2, gh); c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  }
  // FP3a (FREV H1) — THE FACADE'S ONE POWER HOOK: power(k) dims every light on the building at once — the rooms (k), the blade +
  // its bulbs (lamp), the sconce + the awning's lamps, the barber pole, the basement, the hush sign. 1 = untouched (the frame f
  // passes through as it is); 8b's raid drives it (harbor().raid → speak.power)
  let quiet = false, quietF = null;   // (FP3b: the tests' hold — the basement steady, the windows' moments paused, the facade's light levels
  // frozen where they were (a slow machine may still be ramping the city up): a light probe compares only what it switches)
  let power = 1, doorState = { side: 0, shop: 0, inside: null }, doorRects = { side: null, shop: null };
  // 8b1 — CAUSE AND EFFECT: one marquee bulb out (its index, its level: 0 dead, the repairman's test flicker between) — core/harbor-crew.js
  let dead = { i: -1, k: 1 };
  function draw(c, f1) {
    if (!G) return;
    if (quiet && !quietF) quietF = { k: f1.k, lamp: f1.lamp, sconce: f1.sconce, night: f1.night, fade: f1.fade, day: f1.day };
    const f0 = quiet ? { ...f1, ...quietF } : f1;
    const P = power, f = P >= 1 ? f0 : { ...f0, k: clamp01(f0.k) * P, lamp: (f0.lamp || 0) * P, sconce: clamp01(f0.sconce == null ? f0.k : f0.sconce) * P, pole: clamp01(f0.pole == null ? f0.k : f0.pole) * P };
    const fade = f.fade == null ? 1 : f.fade;
    c.save();
    const k = clamp01(f.k) * fade; lastK = k; lastT = f.t || 0; lastGame = f.game || null;
    // (7b: the life's frame first — a window it draws whole this frame (the TV, the night lamp, a routine) is 0 in the lit canvas)
    const fr = life.frame(f);
    const levels = wins.map(w => (fr.full.has(w.id) ? 0 : Math.round(levelOf(w, f) * 8) / 8));
    if (k > 0.004) {
      const late = Math.round(lateOf(f.hour) * 4) / 4, key = levels.join(',') + '|' + late + '|' + dpr;
      if (key !== litKey || !litCv) { paintLit(levels, late); litKey = key; }
      c.globalAlpha = k; c.drawImage(litCv, box.x, box.y, box.w, box.h);
      // (SP2 — no smoke: the soft blob round each lit window is gone; their light LANDS on the sill, the reveal + the sill's edge — the lit
      // canvas: windows.js#landing)
      c.globalCompositeOperation = 'lighter';
      // (FP2 — no smoke: the shop lamp's light lands INSIDE the window — paintLit's pool on the floor, the chair, the mirror — and the globe
      // keeps a small tight halo; the 14 pt soft cloud it threw over the glass + the gold leaf is gone)
      const [w0, w1, , wv1] = G.s.shop.win, [lx, ly] = G.front(w0 + (w1 - w0) * 0.38, wv1 - 0.48); soft(c, [255, 222, 172], lx, ly, G.K * SHOP_GLOW.lamp, 0.62 * k); glowAt.lamp = [lx, ly];
      c.globalCompositeOperation = 'source-over';
    }
    // PART 7b — THE LIFE: the people, the cat, the TV, the night lamp, the bar's afternoon + last light, the shop's day, the mirror door
    c.globalAlpha = 1;
    const [ox, oy] = G.front(0, 0);
    if (!quiet && P > 0.04) life.draw(c, {   // (POL4: in a blackout the life's own lit windows — the TV, the night lamp — go dark with the rest)
      map: x => wallMap(x, ox, oy, G.K), wins, levels, k, f, shopWin: G.s.shop.win, card: null, gilt: null, play: f.play });
    // 8P — THE HUSH WORD SIGN: bare neon tubes inside the lower-right upstairs window (the jazz room — its life shows between the letters),
    // only while a lobby is open (hushsign.js) — POLISH 5: one clear pane, nothing laid over them
    { if (f.hush !== undefined) hush.set(f.hush);
      hush.draw(c, { t: f.t || 0, T: f.tw || { day: 1 - k, gold: 0, night: k }, fade: fade * P, motion: f.motion });
    }
    // THE GOLD LEAF on the glass — once (8P), over the shop's life + the sign inside
    c.save(); c.globalAlpha = fade; giltOver(c, f); c.restore();
    // FP3b — REAL DOORS (doors.js): the side door + the shop door swinging open while someone walks through (people.js drives
    // doors({ side, shop, inside }) from core/harbor-people.js#folkAt's doors), the side door's amber spill at night
    { const sh = G.s.shop, sd = G.s.door, df = { day: f.day, night: f.night == null ? k : f.night, fade, power: P };
      const ins = id => (doorState.inside ? (cc, r) => doorState.inside(cc, id, r) : null);
      doorRects.side = drawDoor(c, G, { u0: sd.u0, u1: sd.u1, v0: 0.12, v1: sd.h }, 'side', doorState.side, df, ins('side'));
      doorRects.shop = drawDoor(c, G, { u0: sh.door[0], u1: sh.door[1], v0: V.plinth - 0.05, v1: sh.door[2] }, 'shop', doorState.shop, df, ins('shop')); }
    bedsNow = { ...life.bedLevels(k, !!(f.party && (f.party.ramp == null ? 1 : f.party.ramp) > 0.3)), fr, k, motion: f.motion !== false };   // (8P: the moments' + the shop's sound cues read the frame — sounds.js)
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // for 7b: a moment's own painter over its window
    for (const [id, fn] of drawers) { const w = wins.find(o => o.id === id); if (w) fn(c, w, f); }
    c.globalCompositeOperation = 'lighter';
    // the sconce by the side door (warm, from dusk). FP2 — no smoke: the SOURCE (its glass lit: a warm bright pane), a small TIGHT halo,
    // and its light LANDING on the brick, the door's granite frame + the oak (baked into the night's facade: paintGround) — the 46 pt
    // soft wash it threw over the door is gone
    { const sc = G.s.shop.sconce, [sx, sy] = G.front(sc.u, sc.v + 0.13), a = clamp01(f.sconce == null ? f.k : f.sconce) * fade;
      if (a > 0.004) { const [p, py] = G.front(sc.u - 0.1, sc.v + 0.26), [q, qy] = G.front(sc.u + 0.1, sc.v); c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a); c.fillStyle = 'rgb(255,226,170)'; c.fillRect(p, py, q - p, qy - py); c.globalCompositeOperation = 'lighter'; }
      soft(c, [255, 210, 150], sx, sy, G.K * SHOP_GLOW.sconce, 0.95 * a); glowAt.sconce = [sx, sy];
      // (POL4: THE DOOR FLOODED — the sconce's warm wash down over the side door + its steps)
      if (a > 0.004) { const d = G.s.door; flood(c, (d.u0 + d.u1) / 2, d.h + 0.15, (d.u1 - d.u0) / 2, d.h, a); } }
    // 8P — THE AWNING'S THREE LAMPS lit: each bulb a crisp warm globe + a small TIGHT halo (their light on the canvas, the shopfront and
    // the pavement is baked — speakeasySteps); the barber pole stays the brightest light on the front
    { const a = clamp01(f.sconce == null ? f.k : f.sconce) * fade;
      if (a > 0.004) for (const b of awningBulbs(G.s.awning)) {
        const [bx, by0] = project(G.cam, G.s.x0 + b.u, b.y, b.z), r = AWNING_LAMP.bulb * G.cam.F / b.z, by = by0 + r * 0.3;
        soft(c, [255, 204, 146], bx, by, AWNING_LAMP.halo * G.cam.F / b.z, 0.55 * a * AWNING_LAMP.k);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a); c.fillStyle = 'rgb(255,238,208)'; c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgb(255,252,240)'; c.beginPath(); c.arc(bx, by + r * 0.15, r * 0.5, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'lighter';
      }
      // (POL4: the barbershop's door flooded from the lamp now centred over it — awningBulbs' first)
      if (a > 0.004) { const dd = G.s.shop.door; flood(c, (dd[0] + dd[1]) / 2, dd[2] - 0.1, (dd[1] - dd[0]) / 2, dd[2] - V.plinth, a * 0.85); } }
    // THE BASEMENT WINDOW: the one hint of the secret — 8P (the owner: "you can't really tell"): the club's heart, unlike every room above —
    // a DEEPER smoky amber edging to copper, a bit brighter; alive through MOVEMENT: now and then the shadows of people passing behind it
    // (the light warming + dimming as they pass), a gentle pulse with the beat on party nights (the music's heart is down there), a very
    // rare brief flicker (an old wire). basementLight() is PURE (tested).
    { const b = basement, t = f.t || 0, pt = f.party, beat = pt && f.motion ? clamp01(pt.ramp == null ? 1 : pt.ramp) * clamp01(pt.punch || 0) : 0;
      const L2 = basementLight(f.motion ? t : 0, { night: clamp01(f.night), beat }), L1 = quiet ? { a: BASEMENT.day + BASEMENT.night * clamp01(f.night), shadows: [], flick: 0 } : L2, L0 = P >= 1 ? L1 : { ...L1, a: L1.a * P };
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, L0.a * fade);
      const g = c.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, rgb(BASEMENT.top)); g.addColorStop(0.55, rgb(BASEMENT.mid)); g.addColorStop(1, rgb(BASEMENT.low));
      c.fillStyle = g; c.fillRect(b.x, b.y, b.w, b.h);
      // the shadows passing (head + shoulders, soft-edged, against the light) — clipped to the opening
      if (L0.shadows.length) {
        c.save(); c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip(); c.fillStyle = 'rgb(34,12,8)';
        for (const sh of L0.shadows) {
          const sx = b.x + b.w * sh.x, hh = b.h * sh.s, hy = b.y + b.h * 0.42;
          c.globalAlpha = Math.min(1, sh.a * fade);
          c.beginPath(); c.ellipse(sx, hy, hh * 0.26, hh * 0.3, 0, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.ellipse(sx, hy + hh * 0.78, hh * 0.62, hh * 0.5, 0, Math.PI, 0); c.fill(); c.fillRect(sx - hh * 0.62, hy + hh * 0.78, hh * 1.24, b.h);
        }
        c.restore();
      }
      // its light landing on the sill under it + the iron bars over the glow (the bake's bars are under this layer)
      c.globalAlpha = Math.min(1, L0.a * 0.75 * fade); c.fillStyle = rgb(BASEMENT.low); c.fillRect(b.x - 1, b.y + b.h, b.w + 2, Math.max(0.6, b.h * 0.12));
      c.globalAlpha = fade; c.fillStyle = 'rgb(16,12,14)';
      const [b0, b1] = G.s.shop.basement;
      for (let u = b0 + 0.2; u < b1; u += 0.24) { const [px] = G.front(u - 0.025, 0); c.fillRect(px, b.y, Math.max(0.6, 0.05 * G.K), b.h); }
      basementDbg = L0; }
    c.globalCompositeOperation = 'source-over';
    // THE BLADE AT NIGHT: the lit letters, the bulbs
    if (f.game && (f.lamp || 0) > 0.004) {
      const key = f.game.id + '|' + dpr + '|' + G.K.toFixed(2);
      if (key !== bladeKey || !bladeCv) { bladeAt = paintBladeLit(f.game); bladeKey = key; }
      const a = clamp01(f.lamp) * fade;
      c.globalAlpha = a; c.drawImage(bladeCv, bladeAt.x, bladeAt.y, bladeAt.w, bladeAt.h);
      c.globalCompositeOperation = 'lighter';
      // 7b — THE MARQUEE'S BULBS lit: each a crisp warm-white globe (the hot core) + a small TIGHT halo (none at tier 0) — steady; a
      // party night's slow chase (marqueeLevel: a step a beat)
      const pt = f.party, pk = pt && f.motion ? clamp01(pt.ramp == null ? 1 : pt.ramp) : 0;
      // (one sprite of every lit bulb, re-painted only when the level or the chase steps — a steady night is one drawImage a frame)
      const beats = pt ? pt.beats || 0 : 0, fq = pt ? Math.round(clamp01((pt.beatU || 0) * 3) * 4) / 4 : 1, aq = Math.round(a * 16) / 16;
      const bk = `${dead.i}:${dead.k}|${aq}|${f.tier === 0 ? 0 : 1}|${pk > 0.01 ? `${((beats % 3) + 3) % 3}|${fq}|${Math.round(pk * 8)}` : 's'}|${dpr}|${G.K.toFixed(2)}`;
      if (bk !== bulbKey) { bulbKey = bk; paintBulbs(aq, f.tier, pk, beats, fq / 3); }
      if (bulbCv && bulbAt) { c.globalAlpha = 1; c.drawImage(bulbCv, bulbAt.x, bulbAt.y, bulbAt.w, bulbAt.h); }
      c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = fade;
    drawPole(c, f);
    if (P < 0.999) blackout(c, P, fade);
    c.restore();
  }
  // POL4 — THE BLACKOUT (the TR-3B's power drain, 8b's raid): power(0) takes EVERY light on the building dark — the live ones are × the
  // power above; the BAKED ones (the wall-washers' light on the brick, the sconce's + the awning lamps' landing, the date stone's wash)
  // are taken down by a MULTIPLY over the building's own silhouette (the front's roofline + the side wall — light: the promenade's own
  // blackout veil (scene.js) lays over it too): warm light falls to a dim
  // moonlit tone, the dark brick stays nearly as it was. One fill a frame, only while the power is down.
  let outline = null, outlineKey = '';
  function blackout(c, P, fade) {
    const key = `${G.cam.W}x${G.cam.H}|${G.K.toFixed(3)}`;
    if (key !== outlineKey) {
      outlineKey = key;
      const top = frontProfile().filter(([u]) => u >= -0.05 && u <= W_FRONT + 0.05).map(([u, v]) => G.front(Math.max(0, Math.min(W_FRONT, u)), v));
      outline = { front: [G.front(0, -0.05), ...top, G.front(W_FRONT, -0.05)], side: [G.side(0, -0.05), G.side(0, V.parapet), G.side(G.len, V.parapet), G.side(G.len, -0.05)] };
    }
    const k = (1 - clamp01(P)) * fade, col = [162, 158, 192].map(v => Math.round(255 - (255 - v) * k));
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 1; c.fillStyle = `rgb(${col.join(',')})`;
    for (const poly of [outline.front, outline.side]) { c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); }
    c.restore();
    // (the BAKED lights themselves, which the multiply only dims — the owner's iPhone after POLISH 4: "these lights are still on": the
    // three wall-washers' lit lamp heads, the side door's sconce + its warm landing on the brick, the date stone's wash — laid back dark,
    // in the facade's own units)
    if (k > 0.01) {
      const [ox, oy] = G.front(0, 0);
      c.save(); wallMap(c, ox, oy, G.K); c.globalAlpha = Math.min(1, k);
      for (const [a0, b0] of WASH.piers) { const u = (a0 + b0) / 2, v = WASH.lampV; R(c, u - 0.21, v - 0.09, u + 0.21, v + 0.05, 'rgb(20,18,26)'); }
      c.globalCompositeOperation = 'multiply';
      for (const [a0, b0] of WASH.piers) { const v = WASH.lampV; R(c, a0 - 0.15, v - WASH.drop - 0.3, b0 + 0.15, v, 'rgb(104,96,116)'); }   // (their warm cones down the piers)
      c.globalCompositeOperation = 'source-over';
      const sc = G.s.shop.sconce; R(c, sc.u - 0.11, sc.v - 0.01, sc.u + 0.11, sc.v + 0.27, 'rgb(34,26,24)');
      c.globalCompositeOperation = 'multiply';
      { const r0 = SHOP_GLOW.landR * 1.3, g = c.createRadialGradient(sc.u, sc.v - 0.17, 0, sc.u, sc.v - 0.17, r0);
        g.addColorStop(0, 'rgb(96,88,104)'); g.addColorStop(0.5, 'rgb(170,162,176)'); g.addColorStop(1, 'rgb(255,255,255)'); c.fillStyle = g; c.fillRect(sc.u - r0, sc.v - 0.17 - r0, r0 * 2, r0 * 2); }
      R(c, 5.6 - DATE.hw - 0.05, DATE.v0 - 0.05, 5.6 + DATE.hw + 0.05, DATE.v1 + 0.05, 'rgb(118,112,130)');
      c.restore();
    }
  }
  return {
    layout, draw,
    windows: () => wins.map(w => ({ id: w.id, room: w.room, floor: w.floor, col: w.col, edge: !!w.edge, rect: { ...w.rect } })),
    /** 8b2 — THE RAID's wash: the side wall (the face toward the road) on screen → [[x, y] × 4] | null */
    sidePoly: () => (G ? [G.side(0, -0.05), G.side(0, V.parapet), G.side(G.len, V.parapet), G.side(G.len, -0.05)] : null),
    light(id, k) { if (k == null) own.delete(id); else own.set(id, clamp01(k)); },
    mirror(k) { mirror = clamp01(k || 0); },
    /** FP3b — tests: quiet(true) holds the basement's light steady + pauses the windows' moments (the mirror door's light), quiet(false) back */
    quiet(on) { quiet = !!on; quietF = null; return quiet; },
    /** FP3b — REAL DOORS: { side, shop } how open (0..1), inside(c, id, rect) draws whoever is in that doorway → the doors now */
    doors(o) { if (o) doorState = { side: clamp01(o.side || 0), shop: clamp01(o.shop || 0), inside: o.inside || null }; return { side: doorState.side, shop: doorState.shop, rects: { ...doorRects } }; },
    /** FP3a: every light on the facade × k (0 = dark, 1 = as the night has it) → the level now; power() reads it */
    power(k) { if (k !== undefined) power = clamp01(+k); return power; },
    /** 8b1: a dead marquee bulb — bulb(i, k): bulb i at level k (0 dead … 1 fixed); bulb(null) all lit; bulb() → { i, k, n } */
    bulb(i, k = 0) { if (i !== undefined) { const ni = i == null ? -1 : i | 0, nk = Math.round(clamp01(k) * 8) / 8; dead = { i: ni, k: ni < 0 ? 1 : nk }; } return { ...dead, n: marqueeBulbs().length }; },
    /** the barber pole: { on: false } dark + still (7b's raid), { on: true } back to its lamp + its turn */
    pole(o = {}) { if ('on' in o) poleOff = !o.on; },
    roomDraw(id, fn) { if (fn) drawers.set(id, fn); else drawers.delete(id); },
    /** 8P — THE HUSH WORD SIGN: hush(word) sets the lobby's word (null = no lobby); hush() → the sign's state */
    hush(w) { if (w !== undefined) hush.set(w); return hush.debug(); },
    /** PART 7b: a tap on the speakeasy's windows → { kind: 'window', id, tap } | { kind: 'cat', id } | null */
    hit: (x, y) => (G ? life.hit(x, y, wins, lastT) : null),
    life: () => life.debug(),
    /** PART 7b: the speakeasy's sound beds now (sounds.js#speakeasy): { club, tv, party } */
    beds: () => bedsNow,
    debug: () => ({ basement: basementDbg ? { a: +basementDbg.a.toFixed(3), shadows: basementDbg.shadows.length, flick: basementDbg.flick } : null, marquee: G && lastGame ? marqueeScreen(bladeGeo(G)).map(b => ({ x: +b.x.toFixed(1), y: +b.y.toFixed(1) })) : [], poleRect, glowAt: { ...glowAt }, turned: G ? G.turned : null, side: G ? +G.len.toFixed(2) : 0, sidePt: G ? Math.round(G.side(G.len, 0)[0] - G.side(0, 0)[0]) : 0, windows: wins.length, mirror, poleOn: !poleOff, polePh: +polePh.toFixed(4), poleRate: poleA ? +poleA.rate.toFixed(3) : 0, polePx, box, dpr, k: lastK, lit: !!litCv, mb: +(((litCv ? litCv.width * litCv.height : 0) + (bladeCv ? bladeCv.width * bladeCv.height : 0)) * 4 / 1e6).toFixed(2) }),
    destroy() { life.destroy(); hush.destroy(); for (const cv of [litCv, bladeCv, poleCv, haloCv, giltCv, bulbCv, ...softs.values()]) if (cv) cv.width = cv.height = 0; giltCv = bulbCv = null; bulbKey = ''; litCv = bladeCv = poleCv = haloCv = poleImg = null; haloKey = ''; softs.clear(); },
  };
}
