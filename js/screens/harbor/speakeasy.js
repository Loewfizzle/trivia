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
// the ad's lamps, the barber pole turning. Its HOOKS (the window life — windows.js — reads them): windows() (each window's rect + room), light(id, k), mirror(k).
import { drawDoor } from './doors.js';
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V, ROOMS, roomLight } from '../../core/harbor-speakeasy.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, mix, shade, box, poly } from './shapes.js';
import { faces } from './blocks.js';
import { safeCtx, BAKE_CAP } from '../../ui/canvas-safe.js';
import { dayPaint } from './signs.js';
import { paintRoom, createWindowLife, lateOf } from './windows.js';
import { paintShopRoom, shopGlass, shopLamp, boxOf } from './window-rooms.js';
import { createHushSign } from './hushsign.js';
import { wallVP } from '../../core/harbor-rooms.js';
import { frontProfile } from './strings.js';
import { clamp01, tri, FONT, V, W_FRONT, GLASS_IN, AWNING_LAMP, VAL, awningBulbs, SHOP_GLOW, speakGeo, mats, wallMap, R, devRect, fillPat, text, brickTile, streak, fan, chevrons } from './speakeasy-geo.js';
import { BLADE, BLADE_GLOW, bladeGeo, bladeOutline, MARQUEE, marqueeBulbs, marqueeScreen, marqueeLevel, LETTER, BLADE_SPLIT, BLADE_ONE, bladeWords, bladeLetters, paintLetters, paintBlade } from './speakeasy-blade.js';
import { paintStructure, paintFrontDeco, DATE, paintDateStone, paintWindow, paintGround, WASH, washCone, smooth, paintWashers, paintWasherLamps, paintLight, bladeStep, speakeasySteps, paintSideLeaf, paintShopLeaf } from './speakeasy-bake.js';
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
 * HOOKS (the window life, windows.js): windows() → [{ id, room, floor, col, edge, rect }], light(id, k|null) (a window's own level, null = the
 * timeline's), mirror(k) (the hidden door's opening 0..1 — the window life animates it), roomDraw(id, fn) (a moment's own
 * painter over a window).
 */
export function createSpeakeasy() {
  let G = null, dpr = 1, wins = [], box = null, litCv = null, litKey = '', basement = null;
  const own = new Map(), drawers = new Map();
  let mirror = 0, lastK = -1;   // (mirror: the hidden door's hook — FP3b's real doors read it; lastK: debug().k)
  // PART 7b — THE LIFE: the window moments, the rooms' states, the taps (screens/harbor/windows.js; the plan: core/harbor-moments.js)
  const life = createWindowLife();
  // 8P → WIN — THE HUSH WORD SIGN on the corner pier (hushsign.js; Lobby 2.0: hush(word))
  const hush = createHushSign();
  let basementDbg = null;
  let glassCv = null, glassKey = '', glassAt = null, lastT = 0, lastGame = null, bedsNow = { club: 0, tv: 0, party: false };
  function layout(L, o = {}) {
    G = speakGeo(L); dpr = Math.min(BAKE_CAP, o.dpr || 1);
    const s = G.s;
    wins = ROOMS.map(rm => { const [a, b] = s.windows[rm.col], [r0, r1] = s.rows[rm.floor - 2], [x0, y0] = G.front(a, r1), [x1, y1] = G.front(b, r0); return { ...rm, u: [a, b], v: [r0, r1], rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } }; });
    bulbKey = '';
    const [bx0, by0] = G.front(0, V.crest + 0.2), [bx1] = G.side(G.len, 0), [, by1] = G.front(0, 0);
    box = { x: Math.max(0, Math.floor(bx0)), y: Math.floor(by0), w: Math.ceil(Math.min(G.cam.W, bx1) - Math.max(0, bx0)) + 1, h: Math.ceil(by1 - by0) + 1 };
    const [b0, b1, bv0, bv1] = s.shop.basement, [p, py] = G.front(b0, bv1), [q, qy] = G.front(b1, bv0);
    basement = { x: p, y: py, w: q - p, h: qy - py };
    litKey = bladeKey = '';
    hush.layout(G, { dpr, blade: bladeGeo(G).rect });   // (WIN: the sign on the corner pier keeps a gap from the blade's board)
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
    const vp = wallVP(ox, oy, G.K, G.cam.VPX, G.cam.VPY);   // (WIN: the rooms' vanishing point — each room a box in perspective)
    wins.forEach((w, i) => { const a = levels[i]; if (a > 0.01) { x.globalAlpha = a; paintRoom(x, w, { late, vp }); x.globalAlpha = 1; } });
    // C4a — THE BARBERSHOP AFTER HOURS, A REAL ROOM (review-4 §C1 1a): closed + DIM — the same box as the bake (window-rooms.js#paintShopRoom)
    // in its lamp's light: ONE shaded lamp over the empty chair, its pool on the tiles + the chair, the mirrors catching it, the corners
    // dark (lampFall). The upright oval on the back wall, the halo, the chair-edge bars + the additive glow over the glass are gone
    { const SG = shopGlass(G.s.shop.win);
      x.save(); x.beginPath(); x.rect(SG.g0, SG.h0, SG.cw, SG.ch); x.clip();
      paintShopRoom(x, SG, boxOf(SG, vp), { lit: 1 });
      x.restore(); }
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
  // C4a — THE GLASS READS AS GLASS: its own faint reflection, IN FRONT of the room (two hard sheens: 0.08 by day, 0.04 at night; the sky
  // in its head by day; at night the lit awning's underside caught in its top — aw: the strip's level now, 0 after hours / in a blackout)
  // — one small canvas per look, drawn 1:1 over the window, over whatever moves inside (the barber, the customer, the mirror door's light)
  // (C4b: the HARBOR BARBERS gold leaf is gone — the owner, Oct 28 10:41 pm: the barber pole says barbershop)
  function glassOver(c, f) {
    const T = f.tw || { day: 1, gold: 0, night: 0 }, aw = Math.round(clamp01(f.awning || 0) * 8) / 8;
    const key = [T.day || 0, T.gold || 0, T.night || 0].map(v => v.toFixed(1)).join(',') + '|' + aw + '|' + dpr + '|' + G.K.toFixed(2);
    if (key !== glassKey || !glassCv) {
      glassKey = key;
      const [w0, w1, wv0, wv1] = G.s.shop.win, [ax, ay] = G.front(w0, wv1), [bx, by] = G.front(w1, wv0);
      // (on whole DEVICE pixels, drawn at its natural size: never resampled)
      glassAt = { x: Math.floor(ax * dpr) / dpr, y: Math.floor(ay * dpr) / dpr, w: 0, h: 0 };
      glassCv = glassCv || document.createElement('canvas'); glassCv.width = Math.ceil((bx - glassAt.x + 2) * dpr); glassCv.height = Math.ceil((by - glassAt.y + 2) * dpr);
      glassAt.w = glassCv.width / dpr; glassAt.h = glassCv.height / dpr;
      const x = safeCtx(glassCv), [ox, oy] = G.front(0, 0), dayK = clamp01((T.day || 0) + (T.gold || 0)), nk = clamp01(T.night || 0);
      x.setTransform(dpr, 0, 0, dpr, -glassAt.x * dpr, -glassAt.y * dpr); x.clearRect(glassAt.x, glassAt.y, glassAt.w, glassAt.h);
      x.save(); wallMap(x, ox, oy, G.K); x.beginPath(); x.rect(w0, wv0, w1 - w0, wv1 - wv0); x.clip();
      // the glass: the sky's tint in its head by day, two hard-edged sheens, the lit awning's underside caught in its top at night
      if (dayK > 0.01) { const sky = tri(T, [150, 180, 214], [214, 150, 120], [24, 22, 44]), g = x.createLinearGradient(0, wv0, 0, wv1); g.addColorStop(0, `rgba(236,232,220,${(0.06 * dayK).toFixed(3)})`); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(${sky.map(Math.round)},${(0.28 * dayK).toFixed(3)})`); x.fillStyle = g; x.fillRect(w0, wv0, w1 - w0, wv1 - wv0); }
      x.fillStyle = `rgba(255,255,255,${(0.08 * dayK + 0.04 * nk).toFixed(3)})`;
      for (const [p, q] of [[0.1, 0.55], [0.62, 0.78]]) { x.beginPath(); x.moveTo(w0 + (w1 - w0) * p, wv1); x.lineTo(w0 + (w1 - w0) * q, wv1); x.lineTo(w0 + (w1 - w0) * (q - 0.22), wv0); x.lineTo(w0 + (w1 - w0) * (p - 0.22), wv0); x.fill(); }
      if (aw > 0 && nk > 0.01) { const g = x.createLinearGradient(0, wv1, 0, wv1 - 0.7); g.addColorStop(0, `rgba(255,190,130,${(0.16 * aw * nk).toFixed(3)})`); g.addColorStop(1, 'rgba(255,190,130,0)'); x.fillStyle = g; x.fillRect(w0, wv1 - 0.7, w1 - w0, 0.7); }
      x.restore();
    }
    c.drawImage(glassCv, glassAt.x, glassAt.y, glassAt.w, glassAt.h);
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
    bulbsInto(x, a, tier, pk, beats, beatU);
  }
  /** the lit bulbs painted into x (in pt): the sprite above, or 9c's crisp layer at full dpr */
  function bulbsInto(x, a, tier, pk, beats, beatU) {
    const S = marqueeScreen(bladeGeo(G));
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
  // 9d — THE DOORS' LIGHT, REAL (the owner: "all the other lights look so realistic, but in the foreground, where it's the most important,
  // it looks the most cheap"). POL4's flood was ONE additive gradient laid over the door — orange haze on the mortar, the recess and the
  // oak alike, only ever "a weak blob" or "a washed-out blob". Now the lamp LIGHTS what it reaches: its light is a mask drawn with
  // 'color-dodge', which multiplies each pixel under it (lit brick faces brighten + warm, the mortar + the recesses stay dark — light ×
  // albedo); the mask is the lamp's SHAPE — a cone from under its shade or cap (a crisp top edge: nothing above the cap but a sliver,
  // brightest just inside the cone's edges: the scallop), falling off with distance — minus the SHADOWS (the lintel's band across the
  // door's head, the jambs' strips); a POOL on the cobbles (+ the side door's two treads, their nosings catching the light), and the
  // fixture's own HOT BULB with a small glare. Baked once per layout (the mask), one drawImage a frame.
  const DLIGHT = Object.freeze({
    col: [196, 146, 88],          // the light's colour as a dodge (≈ a gain of 4.3 / 2.3 / 1.5 at full: warm, never white)
    side: { cone: 1.32, soft: 0.3, reach: 2.45, up: 0.05, k: 1, pool: { dz: 0.95, rx: 1.45, rz: 1.1, k: 0.8 } },   // (the lantern under its iron cap: wide)
    shop: { cone: 0.82, soft: 0.24, reach: 2.2, up: 0.02, k: 0.62, pool: { dz: 0.8, rx: 1.2, rz: 0.9, k: 0.7 } },     // (the awning's bell-shaded bulb: a cone down)
    lintel: 0.62, lintelH: 0.24, jamb: 0.42, jambW: 0.07,
  });
  const dlMasks = new Map();
  /** the lamp's light on the wall as a mask in screen pt: lamp { u, v (where the light leaves: the shade's rim / the cap's underside) } */
  function lightMask(id, lamp, door) {
    const Lp = DLIGHT[id], o = G.front(0, 0), key = `${id}|${dpr}|${G.K.toFixed(4)}|${Math.round(o[0])}|${Math.round(o[1])}`;
    const had = dlMasks.get(id); if (had && had.key === key) return had;
    if (had) { had.cv.width = 0; dlMasks.delete(id); }
    // (the box holds the whole falloff — a mask cut short by its own box draws a hard edge)
    const R = Math.max(Lp.reach, (lamp.v + 0.2) * 1.42 + 0.1), [X0, Y0] = G.front(lamp.u - R, lamp.v + Lp.up + 0.06), [X1, Y1] = G.front(lamp.u + R, -0.02);
    const w = X1 - X0, h = Y1 - Y0, W = Math.max(1, Math.ceil(w * dpr)), H = Math.max(1, Math.ceil(h * dpr));
    const cv = document.createElement('canvas'), ang = document.createElement('canvas'); cv.width = ang.width = W; cv.height = ang.height = H;
    const x = safeCtx(cv), ax = safeCtx(ang); if (!x || !ax) { cv.width = ang.width = 0; return null; }
    for (const q of [x, ax]) q.setTransform(dpr, 0, 0, dpr, -X0 * dpr, -Y0 * dpr);
    const [lx, ly] = G.front(lamp.u, lamp.v), Rb = Math.hypot(w, h) * 1.2, N = 64;
    // 1. THE CONE: wedges from the lamp by the angle off straight down — full inside, a soft penumbra at the edge, a touch brighter just
    // inside it (the scallop), nothing above the shade (an up-spill only within `up` of it — the cap's lip)
    for (let i = 0; i < N; i++) {
      const t0 = -Math.PI / 2 + (i / N) * Math.PI, t1 = -Math.PI / 2 + ((i + 1) / N) * Math.PI, tm = Math.abs((t0 + t1) / 2);
      const e = (tm - (Lp.cone - Lp.soft)) / (Lp.soft * 1.4), a = (e <= 0 ? 1 : e >= 1 ? 0 : 1 - e * e * (3 - 2 * e)) * (1 + 0.28 * Math.exp(-(((tm - (Lp.cone - Lp.soft * 0.9)) / 0.16) ** 2)));
      if (a <= 0.003) continue;
      ax.fillStyle = `rgba(255,255,255,${Math.min(1, a / 1.28).toFixed(3)})`;
      ax.beginPath(); ax.moveTo(lx, ly); ax.lineTo(lx + Rb * Math.sin(t0), ly + Rb * Math.cos(t0)); ax.lineTo(lx + Rb * Math.sin(t1), ly + Rb * Math.cos(t1)); ax.closePath(); ax.fill();
    }
    if (Lp.up > 0) { const [, yu] = G.front(lamp.u, lamp.v + Lp.up); const g = ax.createLinearGradient(0, ly, 0, yu); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ax.fillStyle = g; ax.fillRect(lx - G.K * 0.45, yu, G.K * 0.9, ly - yu); }
    // 2. THE FALLOFF with distance (from just under the lamp), in the light's colour
    const col = DLIGHT.col, Rd = Math.max(1, (lamp.v + 0.2) * G.K) * 1.42, cy = ly + 0.06 * G.K;
    const g = x.createRadialGradient(lx, cy, 0, lx, cy, Rd);
    for (const [t, a] of [[0, 1], [0.1, 0.92], [0.32, 0.66], [0.6, 0.4], [0.82, 0.16], [1, 0]]) g.addColorStop(t, `rgba(${col[0]},${col[1]},${col[2]},${a})`);
    x.fillStyle = g; x.fillRect(X0, Y0, w, h);
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(ang, 0, 0); x.restore();
    ang.width = ang.height = 0;
    // 3. THE SHADOWS: the lintel's band across the door's head (the door sits back in its granite surround, the lamp above), the jambs
    if (door) {
      x.globalCompositeOperation = 'destination-out';
      const [a0, b0] = G.front(door.u0, door.h), [a1, b1] = G.front(door.u1, door.h - DLIGHT.lintelH), gl = x.createLinearGradient(0, b0, 0, b1);
      gl.addColorStop(0, `rgba(0,0,0,${DLIGHT.lintel})`); gl.addColorStop(0.55, `rgba(0,0,0,${DLIGHT.lintel * 0.45})`); gl.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gl; x.fillRect(a0, b0, a1 - a0, b1 - b0);
      const [, bb] = G.front(door.u0, door.v0), jw = DLIGHT.jambW * G.K;
      for (const [xa, dir] of [[a0, 1], [a1, -1]]) { const gj = x.createLinearGradient(xa, 0, xa + dir * jw, 0); gj.addColorStop(0, `rgba(0,0,0,${DLIGHT.jamb})`); gj.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gj; x.fillRect(Math.min(xa, xa + dir * jw), b0, jw, bb - b0); }
      x.globalCompositeOperation = 'source-over';
    }
    const m = { key, cv, X: X0, Y: Y0, w, h, lx, ly };
    dlMasks.set(id, m);
    return m;
  }
  /** the door's light this frame: a (0..1 the lamp's level × the power), the mask dodged over the wall + the door, the pool on the
   *  cobbles, the treads' nosings (side), the hot bulb at bulb [x, y] */
  function doorLight(c, id, lamp, door, a, bulb) {
    if (a <= 0.004) return;
    const Lp = DLIGHT[id], m = lightMask(id, lamp, door), col = DLIGHT.col, s = G.s, cam = G.cam;
    c.save();
    c.globalCompositeOperation = 'color-dodge';
    if (m) { c.globalAlpha = Math.min(1, a * Lp.k); c.drawImage(m.cv, m.X, m.Y, m.w, m.h); }
    // the POOL on the cobbles in front (an ellipse on the ground: its depth by the camera), the same dodge — the stones lit as stones
    { const P = Lp.pool, u = id === 'side' ? (door.u0 + door.u1) / 2 : lamp.u, [px] = project(cam, s.x0 + u, 0, s.z0 - P.dz), [, pn] = project(cam, s.x0 + u, 0, s.z0 - P.dz - P.rz), [, pf] = project(cam, s.x0 + u, 0, s.z0 - P.dz + P.rz);
      const rx = P.rx * cam.F / (s.z0 - P.dz), ry = Math.max(1, (pn - pf) / 2);
      c.globalAlpha = Math.min(1, a * P.k); c.save(); c.translate(px, (pn + pf) / 2); c.scale(1, ry / rx);
      const g = c.createRadialGradient(0, -rx * 0.25, 0, 0, 0, rx);
      for (const [t, k] of [[0, 1], [0.3, 0.7], [0.65, 0.26], [1, 0]]) g.addColorStop(t, `rgba(${col[0]},${col[1]},${col[2]},${k})`);
      c.fillStyle = g; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore(); }
    c.globalCompositeOperation = 'lighter';
    // the side door's two granite treads: their nosings catch the lamp (the treads lit, the risers not)
    if (id === 'side') {
      c.lineWidth = Math.max(0.5, G.K * 0.025); c.globalAlpha = Math.min(1, a * 0.5);
      for (const [y, z, wd] of [[0.26, -0.4, 0.15], [0.13, -0.75, 0.3]]) { const [p0, q0] = project(cam, s.x0 + door.u0 - wd, y, s.z0 + z), [p1, q1] = project(cam, s.x0 + door.u1 + wd, y, s.z0 + z); const g = c.createLinearGradient(p0, 0, p1, 0); g.addColorStop(0, 'rgba(255,190,120,0)'); g.addColorStop(0.5, 'rgba(255,200,132,0.9)'); g.addColorStop(1, 'rgba(255,190,120,0)'); c.strokeStyle = g; c.beginPath(); c.moveTo(p0, q0); c.lineTo(p1, q1); c.stroke(); }
    }
    // THE HOT BULB: a small bright core + a tight glare (the light's source — never a cloud)
    if (bulb) { const r = G.K * 0.05; c.globalAlpha = Math.min(1, a); soft(c, [255, 214, 160], bulb[0], bulb[1], G.K * 0.2, 0.75 * a); c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a); c.fillStyle = 'rgb(255,246,226)'; c.beginPath(); c.arc(bulb[0], bulb[1], r, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  // 9d — THE LEAVES' SPRITES: each door's leaf painted by the BAKE's own painters (speakeasy-bake.js#paintSideLeaf / paintShopLeaf,
  // + the wall's light over it: paintLight; the door lamp's light is live — doorLight — and lands on the swinging leaf too) from the BAKE's tones, at the city's dpr —
  // so the leaf that swings (doors.js) IS the baked door, and shutting hands over to the bake without a jump. Re-painted per bake.
  let leafT = null, leafAt = '';
  const leaves = { side: null, shop: null };
  const doorBox = id => (id === 'side' ? { u0: G.s.door.u0, u1: G.s.door.u1, v0: 0.12, v1: G.s.door.h } : { u0: G.s.shop.door[0], u1: G.s.shop.door[1], v0: V.plinth - 0.05, v1: G.s.shop.door[2] });
  function leafSprites(T) {
    const at = `${dpr}|${G.K.toFixed(4)}`;
    if (!T || (T === leafT && at === leafAt)) return;
    leafT = T; leafAt = at;
    const M = mats(T), k = G.K * dpr;
    for (const id of ['side', 'shop']) {
      const d = doorBox(id), w = Math.max(1, Math.ceil((d.u1 - d.u0) * k)), h = Math.max(1, Math.ceil((d.v1 - d.v0) * k));
      const cv = leaves[id] && leaves[id].cv || document.createElement('canvas'); cv.width = w; cv.height = h;
      const x = safeCtx(cv); if (!x) { leaves[id] = null; continue; }
      x.setTransform(k, 0, 0, -k, -d.u0 * k, d.v1 * k);
      x.save(); x.beginPath(); x.rect(d.u0, d.v0, d.u1 - d.u0, d.v1 - d.v0); x.clip();
      if (id === 'side') paintSideLeaf(x, M, G.s.door);
      else paintShopLeaf(x, M, G.s.shop);
      paintLight(x, M, 0, W_FRONT, false, 51);
      x.restore();
      leaves[id] = { cv, d };
    }
  }
  /** 9d: a clip that leaves out the awning's valance (its scallops traced) + its lamps — whatever the live shop door must stay behind */
  function awningClip(c) {
    const s = G.s, cam = G.cam, aw = s.awning;
    const [va, vy0] = project(cam, s.x0 + aw.u0, aw.y1 + 0.6, aw.z), [vb, vy1] = project(cam, s.x0 + aw.u1, aw.y1 - VAL, aw.z), sw = (vb - va) / 14;
    c.beginPath(); c.rect(va - 400, vy0 - 400, vb - va + 800, 1600);
    c.moveTo(va, vy0); c.lineTo(vb, vy0); c.lineTo(vb, vy1);
    for (let i = 13; i >= 0; i--) c.arc(va + sw * (i + 0.5), vy1, sw / 2, 0, Math.PI, false);
    c.lineTo(va, vy0); c.closePath();
    c.clip('evenodd');
    // (PROM: the awning's three little lamps are gone — the strip under its front edge is hidden: nothing else to leave out)
  }
  // PROM — THE BARBERSHOP AWNING LIT FROM UNDERNEATH (the owner, Oct 28 — "B"): a row of warm bulbs tucked UNDER the awning's front edge
  // (hidden from us). LIVE (its hours fade it: core/harbor-speakeasy.js#awningLight): the canvas glowing from beneath (the cream stripes
  // through the thin canvas, warmest at the front edge where the bulbs hang), the valance's scallops catching a warm rim, the shopfront
  // under it lit as SURFACES through the doors' real light model (a dodge — the brick, the glass + the HARBOR BARBERS lettering, no haze):
  // one clear lit band across the building's foot, and a long warm pool on the pavement. a: its level × the city's power × the fade
  // C4a (the owner: "brighter, lit from below"; review-4 §C1 1c): the stripes brighter (cream 0.52 → 1, red 0.26 → 0.55, the light a paler warm white) + dimmer at the
  // wall (the bulbs under the front edge aim up: wall 0.3 → 0.15 of the front), the valance's rim 0.6 → 0.85, the pool 0.75 → 0.9; THE DODGE
  // SPLIT — full from the strip down to the WINDOW HEAD (the transom, the frame), `side` on the brick + the door below it, NONE on the glass
  // (the flat orange haze over the shop came from there: the room behind the glass reads now)
  const AWN = Object.freeze({ cream: 1, red: 0.55, wall: 0.15, rim: 0.85, wash: 0.62, pool: { dz: 0.95, rz: 0.95, k: 0.9 }, top: 0.06, head: 0.85, side: 0.35, foot: 0.2 });
  let awnMask = null;
  function awningUnder(c, a) {
    if (a <= 0.004 || !G) return;
    const s = G.s, aw = s.awning, cam = G.cam, at = (u, y, z) => project(cam, s.x0 + u, y, z), W = [255, 208, 150];
    c.save(); c.globalCompositeOperation = 'lighter';
    // 1. the canvas, lit from below: stripe by stripe, from the wall (dim) to the front edge (bright)
    const n = 12, du = (aw.u1 - aw.u0) / n;
    for (let i = 0; i < n; i++) {
      const u0 = aw.u0 + i * du, u1 = u0 + du, k = a * (i % 2 ? AWN.cream : AWN.red), p = [at(u0, aw.y0, s.z0), at(u1, aw.y0, s.z0), at(u1, aw.y1, aw.z), at(u0, aw.y1, aw.z)];
      const g = c.createLinearGradient(0, p[0][1], 0, p[2][1]); g.addColorStop(0, `rgba(${W.join(',')},${(k * AWN.wall).toFixed(3)})`); g.addColorStop(1, `rgba(${W.join(',')},${k.toFixed(3)})`);
      c.fillStyle = g; c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (const q of p.slice(1)) c.lineTo(q[0], q[1]); c.closePath(); c.fill();
    }
    // 2. the valance's scallops: a warm rim on their lower edges (the bulbs right behind them)
    { const [va] = at(aw.u0, aw.y1, aw.z), [vb, vy1] = at(aw.u1, aw.y1 - VAL, aw.z), ns = 14, sw = (vb - va) / ns;
      c.strokeStyle = `rgba(255,214,160,${(AWN.rim * a).toFixed(3)})`; c.lineWidth = Math.max(0.5, 0.035 * cam.F / aw.z);
      for (let i = 0; i < ns; i++) { c.beginPath(); c.arc(va + sw * (i + 0.5), vy1, sw / 2 - c.lineWidth / 2, 0.15, Math.PI - 0.15); c.stroke(); } }
    // 3. the shopfront below, lit as SURFACES (the doors' dodge): a band from the strip down, strongest at the top, soft at its two ends
    const vS = aw.y1 - VAL - AWN.top, key = `${dpr}|${G.K.toFixed(4)}|${G.front(0, 0).map(Math.round).join(',')}`;
    if (!awnMask || awnMask.key !== key) {
      if (awnMask) awnMask.cv.width = 0;
      const [X0, Y0] = G.front(aw.u0 - 0.3, vS), [X1, Y1] = G.front(aw.u1 + 0.3, 0), w = X1 - X0, h = Y1 - Y0, Wd = Math.max(1, Math.ceil(w * dpr)), Hd = Math.max(1, Math.ceil(h * dpr));
      const cv = document.createElement('canvas'); cv.width = Wd; cv.height = Hd;
      const x = safeCtx(cv);
      if (x) {
        const col = DLIGHT.col, g = x.createLinearGradient(0, 0, 0, Hd);
        // (full from the strip to the window's head + its frame, then the brick + the door's band below it)
        const [w0, w1, , wv1] = s.shop.win, tH = clamp01((vS - wv1 - 0.08) / vS);
        for (const [t, k] of [[0, 1], [tH * 0.5, 0.95], [tH, AWN.head], [Math.min(1, tH + 0.025), AWN.side], [1, AWN.foot]]) g.addColorStop(t, `rgba(${col[0]},${col[1]},${col[2]},${k})`);
        x.fillStyle = g; x.fillRect(0, 0, Wd, Hd);
        x.globalCompositeOperation = 'destination-in';
        const e = x.createLinearGradient(0, 0, Wd, 0); for (const [t, k] of [[0, 0], [0.08, 1], [0.92, 1], [1, 0]]) e.addColorStop(t, `rgba(0,0,0,${k})`);
        x.fillStyle = e; x.fillRect(0, 0, Wd, Hd);
        // NO dodge on the glass: the pane cut out of the mask
        const [gx0, gy0] = G.front(w0, wv1), [gx1, gy1] = G.front(w1, s.shop.win[2]);
        x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.fillRect((gx0 - X0) * dpr, (gy0 - Y0) * dpr, (gx1 - gx0) * dpr, (gy1 - gy0) * dpr);
      }
      awnMask = { key, cv, X: X0, Y: Y0, w, h };
    }
    c.globalCompositeOperation = 'color-dodge'; c.globalAlpha = Math.min(1, a * AWN.wash);
    c.drawImage(awnMask.cv, awnMask.X, awnMask.Y, awnMask.w, awnMask.h);
    // 4. the pool on the pavement: long under the awning's width, the same dodge (the setts lit as setts)
    { const P = AWN.pool, uc = (aw.u0 + aw.u1) / 2, [px] = at(uc, 0, s.z0 - P.dz), [, pn] = at(uc, 0, s.z0 - P.dz - P.rz), [, pf] = at(uc, 0, s.z0 - P.dz + P.rz);
      const rx = (aw.u1 - aw.u0) * 0.62 * cam.F / (s.z0 - P.dz), ry = Math.max(1, (pn - pf) / 2), col = DLIGHT.col;
      c.globalAlpha = Math.min(1, a * P.k); c.save(); c.translate(px, (pn + pf) / 2); c.scale(1, ry / rx);
      const g = c.createRadialGradient(0, -rx * 0.15, 0, 0, 0, rx); for (const [t, k] of [[0, 0.9], [0.4, 0.6], [0.75, 0.2], [1, 0]]) g.addColorStop(t, `rgba(${col[0]},${col[1]},${col[2]},${k})`);
      c.fillStyle = g; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore(); }
    c.restore();
    // (the wet ground's reflections: where the strip's light falls — scene.js#wetReflect)
    glowAt.awning = { k: a, xs: [0.2, 0.5, 0.8].map(t => at(aw.u0 + (aw.u1 - aw.u0) * t, 0, s.z0)[0]) };
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
    const P = power, f = P >= 1 ? f0 : { ...f0, k: clamp01(f0.k) * P, lamp: (f0.lamp || 0) * P, sconce: clamp01(f0.sconce == null ? f0.k : f0.sconce) * P, pole: clamp01(f0.pole == null ? f0.k : f0.pole) * P, awning: clamp01(f0.awning || 0) * P };   // (PROM: the awning's strip dies with the rest)
    const fade = f.fade == null ? 1 : f.fade;
    c.save();
    const k = clamp01(f.k) * fade; lastK = k; lastT = f.t || 0; lastGame = f.game || null;
    // (7b: the life's frame first — a window it draws whole this frame (the TV, the night lamp, a routine) is 0 in the lit canvas)
    const fr = life.frame(f);
    const levels = wins.map(w => (fr.full.has(w.id) ? 0 : Math.round(levelOf(w, f) * (fr.bed && fr.bed[w.id] != null ? fr.bed[w.id] : 1) * 8) / 8));   // (WIN3: a room gone to bed on a quiet night)
    if (k > 0.004) {
      const late = Math.round(lateOf(f.hour) * 4) / 4, key = levels.join(',') + '|' + late + '|' + dpr;
      if (key !== litKey || !litCv) { paintLit(levels, late); litKey = key; }
      c.globalAlpha = k; c.drawImage(litCv, box.x, box.y, box.w, box.h);
      // (SP2 — no smoke: the soft blob round each lit window is gone; their light LANDS on the sill, the reveal + the sill's edge — the lit
      // canvas: windows.js#landing)
      // (C4a: the shop lamp's light is IN the room — paintLit's lampFall; no glow over the glass. Its place for the wet ground's reflection:)
      { const L = shopLamp(shopGlass(G.s.shop.win)); glowAt.lamp = G.front(L.u, L.v); }
      c.globalCompositeOperation = 'source-over';
    }
    // PART 7b — THE LIFE: the people, the cat, the TV, the night lamp, the bar's afternoon + last light, the shop's day, the mirror door
    c.globalAlpha = 1;
    const [ox, oy] = G.front(0, 0);
    if (!quiet && P > 0.04) life.draw(c, {   // (POL4: in a blackout the life's own lit windows — the TV, the night lamp — go dark with the rest)
      map: x => wallMap(x, ox, oy, G.K), vp: wallVP(ox, oy, G.K, G.cam.VPX, G.cam.VPY), wins, levels, k, f, shopWin: G.s.shop.win, card: null, play: f.play });
    // 8P → WIN — THE HUSH WORD SIGN: the door's password sign on the corner pier (the letters stacked on a dark plate, over the sconce),
    // only while a lobby is open (hushsign.js) — POLISH 5: one clear pane, nothing laid over them
    { if (f.hush !== undefined) hush.set(f.hush);
      hush.draw(c, { t: f.t || 0, T: f.tw || { day: 1 - k, gold: 0, night: k }, fade: fade * P, motion: f.motion });
    }
    // THE GLASS's reflection — once, over the shop's life + the sign inside (C4b: no gold leaf)
    c.save(); c.globalAlpha = fade; glassOver(c, f); c.restore();
    // FP3b — REAL DOORS (doors.js): the side door + the shop door swinging open while someone walks through (people.js drives
    // doors({ side, shop, inside }) from core/harbor-people.js#folkAt's doors), the side door's amber spill at night
    { const df = { day: f.day, night: f.night == null ? k : f.night, fade, power: P };
      const ins = id => (doorState.inside ? (cc, r) => doorState.inside(cc, id, r) : null);
      if (doorState.side > 0.002 || doorState.shop > 0.002) leafSprites(f.bakeT);
      doorRects.side = drawDoor(c, G, doorBox('side'), 'side', doorState.side, df, ins('side'), leaves.side);
      // (9d: the AWNING hangs in front of the shop door's head — its valance + scallops + the lamps under it are baked AFTER the front,
      // so the live door is clipped round them: the scallops no longer vanish while the door swings)
      if (doorState.shop > 0.002) { c.save(); awningClip(c); doorRects.shop = drawDoor(c, G, doorBox('shop'), 'shop', doorState.shop, df, ins('shop'), leaves.shop); c.restore(); }
      else doorRects.shop = null; }
    bedsNow = { ...life.bedLevels(k, !!(f.party && (f.party.ramp == null ? 1 : f.party.ramp) > 0.3)), fr, k, motion: f.motion !== false };   // (8P: the moments' + the shop's sound cues read the frame — sounds.js)
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // a moment's own painter over its window (windows.js)
    for (const [id, fn] of drawers) { const w = wins.find(o => o.id === id); if (w) fn(c, w, f); }
    c.globalCompositeOperation = 'lighter';
    // the sconce by the side door (warm, from dusk). FP2 — no smoke: the SOURCE (its glass lit: a warm bright pane), a small TIGHT halo,
    // and its light LANDING on the brick, the door's granite frame + the oak (baked into the night's facade: paintGround) — the 46 pt
    // soft wash it threw over the door is gone
    { const sc = G.s.shop.sconce, [sx, sy] = G.front(sc.u, sc.v + 0.13), a = clamp01(f.sconce == null ? f.k : f.sconce) * fade;
      if (a > 0.004) { const [p, py] = G.front(sc.u - 0.1, sc.v + 0.26), [q, qy] = G.front(sc.u + 0.1, sc.v); c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a); c.fillStyle = 'rgb(255,226,170)'; c.fillRect(p, py, q - p, qy - py); c.globalCompositeOperation = 'lighter'; }
      soft(c, [255, 210, 150], sx, sy, G.K * SHOP_GLOW.sconce, 0.6 * a); glowAt.sconce = [sx, sy];
      // (9d: THE DOOR's LIGHT, real — the lantern under its iron cap lights the brick, the granite, the oak, the treads + the cobbles)
      if (a > 0.004) { const d = G.s.door; doorLight(c, 'side', { u: sc.u, v: sc.v + 0.34 }, { u0: d.u0, u1: d.u1, h: d.h, v0: 0.12 }, a, G.front(sc.u, sc.v + 0.08)); c.globalCompositeOperation = 'lighter'; } }
    // PROM — THE AWNING LIT FROM UNDERNEATH (f.awning: its hours × the power; no bulbs to see — the strip is tucked under the front edge);
    // the barbershop's door lit by the strip right over it (9d's real door light, from the strip's line)
    { const a = clamp01(f.awning == null ? 0 : f.awning) * fade;
      if (a > 0.004) {
        c.save(); awningUnder(c, a); c.restore(); c.globalCompositeOperation = 'lighter';
        const dd = G.s.shop.door, aw = G.s.awning; c.save(); awningClip(c); doorLight(c, 'shop', { u: (dd[0] + dd[1]) / 2, v: aw.y1 - VAL - 0.06 }, { u0: dd[0], u1: dd[1], h: dd[2], v0: V.plinth - 0.05 }, a * 0.7, null); c.restore(); c.globalCompositeOperation = 'lighter';
      } else glowAt.awning = { k: 0, xs: [] }; }
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
      const key = f.game.id + '|' + (f.game.style ? f.game.style.key : '') + '|' + dpr + '|' + G.K.toFixed(2);   // (SP5: the week's look)
      if (key !== bladeKey || !bladeCv) { bladeAt = paintBladeLit(f.game); bladeKey = key; }
      const a = clamp01(f.lamp) * fade;
      // (9c — THE CRISP LAYER: on a DPR-3 phone the lit letters at the phone's full dpr over the board — f.crisp; else in the city's canvas)
      const CR = f.crisp && f.crisp.on ? f.crisp : null, bg0 = bladeGeo(G);
      const crispLit = CR && CR.show(c, { id: 'blade-lit', z: 2, box: bladeAt, key: `${key}|${CR.dpr}`, alpha: a, draw: x => { wallMap(x, bg0.ox, bg0.oy, bg0.k); paintBlade(x, { ...mats({ day: 0, gold: 0, night: 1, sunDir: 0, sunEl: 30, ovc: 0, haze: [40, 40, 70] }), glowPx: BLADE_GLOW * CR.dpr }, f.game, true); } });
      if (!crispLit) { c.globalAlpha = a; c.drawImage(bladeCv, bladeAt.x, bladeAt.y, bladeAt.w, bladeAt.h); }
      c.globalCompositeOperation = 'lighter';
      // 7b — THE MARQUEE'S BULBS lit: each a crisp warm-white globe (the hot core) + a small TIGHT halo (none at tier 0) — steady; a
      // party night's slow chase (marqueeLevel: a step a beat)
      const pt = f.party, pk = pt && f.motion ? clamp01(pt.ramp == null ? 1 : pt.ramp) : 0;
      // (one sprite of every lit bulb, re-painted only when the level or the chase steps — a steady night is one drawImage a frame)
      const beats = pt ? pt.beats || 0 : 0, fq = pt ? Math.round(clamp01((pt.beatU || 0) * 3) * 4) / 4 : 1, aq = Math.round(a * 16) / 16;
      const bk = `${dead.i}:${dead.k}|${aq}|${f.tier === 0 ? 0 : 1}|${pk > 0.01 ? `${((beats % 3) + 3) % 3}|${fq}|${Math.round(pk * 8)}` : 's'}|${dpr}|${G.K.toFixed(2)}`;
      if (bk !== bulbKey) { bulbKey = bk; paintBulbs(aq, f.tier, pk, beats, fq / 3); }
      const crispB = CR && bulbAt && CR.show(c, { id: 'blade-bulbs', z: 3, box: bulbAt, key: `${bk}|${CR.dpr}`, alpha: 1, draw: x => bulbsInto(x, aq, f.tier, pk, beats, fq / 3) });
      if (!crispB && bulbCv && bulbAt) { c.globalAlpha = 1; c.drawImage(bulbCv, bulbAt.x, bulbAt.y, bulbAt.w, bulbAt.h); }
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
      c.globalCompositeOperation = 'multiply';   // (9d: the sconce's baked landing is gone — its light is live (doorLight) and dies with the power)
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
    doors(o) { if (o) doorState = { side: clamp01(o.side || 0), shop: clamp01(o.shop || 0), inside: o.inside || null }; return { side: doorState.side, shop: doorState.shop, rects: { ...doorRects }, leaves: { side: leaves.side && leaves.side.cv, shop: leaves.shop && leaves.shop.cv } }; },
    /** FP3a: every light on the facade × k (0 = dark, 1 = as the night has it) → the level now; power() reads it */
    power(k) { if (k !== undefined) power = clamp01(+k); return power; },
    /** 8b1: a dead marquee bulb — bulb(i, k): bulb i at level k (0 dead … 1 fixed); bulb(null) all lit; bulb() → { i, k, n } */
    bulb(i, k = 0) { if (i !== undefined) { const ni = i == null ? -1 : i | 0, nk = Math.round(clamp01(k) * 8) / 8; dead = { i: ni, k: ni < 0 ? 1 : nk }; } return { ...dead, n: marqueeBulbs().length }; },
    /** WIN3 — the window party's colour on the cobbles: [{ id, u, col, k }] (life.partySpill over the facade's windows) */
    partySpill: () => (life && life.partySpill ? life.partySpill(wins) : []),
    /** the barber pole: { on: false } dark + still (7b's raid), { on: true } back to its lamp + its turn */
    pole(o = {}) { if ('on' in o) poleOff = !o.on; },
    roomDraw(id, fn) { if (fn) drawers.set(id, fn); else drawers.delete(id); },
    /** 8P — THE HUSH WORD SIGN: hush(word) sets the lobby's word (null = no lobby); hush() → the sign's state */
    hush(w) { if (w !== undefined) hush.set(w); return hush.debug(); },
    /** PART 7b: a tap on the speakeasy's windows → { kind: 'window', id, tap } | { kind: 'cat', id } | null */
    hit: (x, y) => (G ? life.hit(x, y, wins, lastT) : null),
    life: () => life.debug(),
    /** WIN: something moving in a window (a moment, a tap's answer, a passer-by) — scene.js#fastNow's 60-fps reason */
    busy: () => life.busy(),
    /** SP3: the blade's board on screen (the tree sway keeps clear of it) */
    bladeRect: () => (G ? bladeGeo(G).rect : null),
    /** PROM — where the sconce + the shop's lamp glow on screen (the wet ground's reflections): { sconce: [x, y], lamp: [x, y] } */
    glows: () => glowAt,
    /** PART 7b: the speakeasy's sound beds now (sounds.js#speakeasy): { club, tv, party } */
    beds: () => bedsNow,
    debug: () => ({ basement: basementDbg ? { a: +basementDbg.a.toFixed(3), shadows: basementDbg.shadows.length, flick: basementDbg.flick } : null, marquee: G && lastGame ? marqueeScreen(bladeGeo(G)).map(b => ({ x: +b.x.toFixed(1), y: +b.y.toFixed(1) })) : [], poleRect, glowAt: { ...glowAt }, turned: G ? G.turned : null, side: G ? +G.len.toFixed(2) : 0, sidePt: G ? Math.round(G.side(G.len, 0)[0] - G.side(0, 0)[0]) : 0, windows: wins.length, mirror, poleOn: !poleOff, polePh: +polePh.toFixed(4), poleRate: poleA ? +poleA.rate.toFixed(3) : 0, polePx, box, dpr, k: lastK, lit: !!litCv, mb: +(((litCv ? litCv.width * litCv.height : 0) + (bladeCv ? bladeCv.width * bladeCv.height : 0)) * 4 / 1e6).toFixed(2) }),
    destroy() { life.destroy(); hush.destroy(); for (const cv of [litCv, bladeCv, poleCv, haloCv, glassCv, bulbCv, ...softs.values()]) if (cv) cv.width = cv.height = 0; glassCv = bulbCv = null; bulbKey = ''; litCv = bladeCv = poleCv = haloCv = poleImg = null; haloKey = ''; softs.clear(); },
  };
}
