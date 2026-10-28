// CITY 2.0 — 9e: THE CONSTRUCTION TOWER, its LIVE layer (the stage itself — the empty lot, the rising steel frame, the dark shell — is baked:
// core/harbor-layout.js#towerStage + blocks.js#worksBlock). Drawn right after the near skyline, CLIPPED above the roofs nearer than the slot
// (JAZZ, the near band): everything here stands behind them, as the building does.
//   THE CRANE (rising → the crane's day off in November): a tower crane on the slot's right — its lattice mast climbing with the building,
//     the jib slewing slowly by day (seen end-on it shortens), the hook + a load; at night a dark silhouette + its RED BEACON (a slow
//     blink — STEADY when it would sit beside the NEON letters: the owner's rule) · THE WORK LIGHTS (night, rising / topping): warm
//     floods on the frame's top floors · TOPPING OUT: a small evergreen + a flag on the top beam (big enough to read: ~6 pt)
//   THE IMPLOSION (core/harbor-tower.js#implosionAt): 9f — THE REAL BUILDING (the owner: "the original building should implode"): the
//     slot's original block (layout's t.orig) baked ONCE with the skyline's own skyBlock into a sprite — the same stone, tiers, crown +
//     shading — standing complete, the charges FLASHING down its floors, then cut into FLOOR BANDS that drop: the base first, the top a
//     beat later (the floors pancake: small gaps open between them), the upper half LEANING a few degrees, all straight
//     down, the DUST billowing up + out and settling over minutes (a haze hangs over the lot for the rubble's first minutes)
//   THE GRAND OPENING (its night): two searchlights sweeping from the foot (the neon outline itself lights with the re-bake at 7 pm)
// Phone first: every piece a clear silhouette + one bright accent (the beacon, the work lights, the flashes, the beams).
import { project, roofline } from '../../core/harbor-layout.js';
import { TOWER_ID, implosionAt, IMPLODE } from '../../core/harbor-tower.js';
import { safeCtx, blit } from '../../ui/canvas-safe.js';
import { skyBlock } from './blocks.js';
import { beaconPulse } from './lights.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const TAU = Math.PI * 2;
const IMPLODE_DROP0 = IMPLODE.drop0;

export function createTowerFx() {
  let L = null, t = null, front = null, geo = null, glowSp = null, dustSp = null;
  const sprite = (inner, outer) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = safeCtx(c), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, inner); g.addColorStop(0.4, outer); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c; };
  function layout(l) {
    L = l; t = L ? L.towers.find(x => x.id === TOWER_ID) : null; geo = null;
    if (!t) return;
    const z = t.z0, cam = L.cam;
    // what stands in front of the slot (nearer than it): the clip line
    front = roofline(L, b => b.z != null && b.z < z - 0.5);
    const full = t.full0 || { h: t.h, tiers: t.tiers };
    const [xL] = project(cam, t.x0, 0, z), [xR] = project(cam, t.x1, 0, z), [, yB] = project(cam, 0, 0, z), [, yT] = project(cam, 0, full.h, z);
    geo = { xL, xR, yB, yT, s: cam.F / z, z, cx: (xL + xR) / 2 };
  }
  function clipFront(c) {
    if (!front) return;
    c.beginPath(); c.moveTo(0, -10);
    const W = L.cam.W;
    c.lineTo(W + 10, -10);
    for (let i = front.length - 1; i >= 0; i--) c.lineTo(i * 4, front[i]);
    c.closePath(); c.clip();
  }
  const glow = () => glowSp || (glowSp = sprite('rgba(255,236,190,1)', 'rgba(255,200,120,0.35)'));
  let warmSp = null; const warm = () => warmSp || (warmSp = sprite('rgba(255,206,130,1)', 'rgba(255,170,80,0.32)'));   // (9f: the work lights' amber)
  // (a light beige-grey: dust, never soot; 3rd look pass — a FIRMER puff (a fuller core, a shorter falloff) so the cloud reads as billows)
  const dust = () => dustSp || (dustSp = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = safeCtx(c), g = x.createRadialGradient(28, 26, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(236,228,212,0.95)'); g.addColorStop(0.55, 'rgba(214,204,186,0.75)'); g.addColorStop(0.8, 'rgba(190,180,164,0.3)'); g.addColorStop(1, 'rgba(190,180,164,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c; })());
  /** the frame's top (pt) now */
  const frameTop = () => { const [, y] = project(L.cam, 0, t.h, t.z0); return y; };

  function crane(c, f) {
    const s = geo.s, night = f.night, top = Math.min(frameTop(), geo.yB - 20 * s) - 13 * s;
    const mx = geo.xR + 1.6 * s, w = Math.max(1.2, 0.9 * s);
    const col = night > 0.5 ? 'rgb(30,30,40)' : 'rgb(214,160,44)', dark = night > 0.5 ? 'rgb(20,20,28)' : 'rgb(120,92,40)';
    // the mast (two chords + the lattice), down behind the roofs in front
    c.strokeStyle = col; c.lineWidth = Math.max(0.8, 0.3 * s);
    c.beginPath(); c.moveTo(mx - w / 2, geo.yB); c.lineTo(mx - w / 2, top); c.moveTo(mx + w / 2, geo.yB); c.lineTo(mx + w / 2, top); c.stroke();
    c.lineWidth = Math.max(0.5, 0.18 * s); c.beginPath();
    for (let y = geo.yB, k = 0; y > top; y -= w * 1.4, k++) { c.moveTo(mx - w / 2, y); c.lineTo(mx + w / 2, y - w * 1.4); }
    c.stroke();
    // the slewing jib (by day it turns slowly; end-on it shortens), the counter-jib + its weight, the cab
    const a = f.motion ? Math.sin(f.t * 0.045 + 1.3) * 1.1 : 0.5, cosA = Math.cos(a), jl = 24 * s * cosA, cj = 8 * s * cosA;
    c.lineWidth = Math.max(1, 0.45 * s); c.strokeStyle = col;
    c.beginPath(); c.moveTo(mx - cj, top); c.lineTo(mx + jl, top); c.stroke();
    c.lineWidth = Math.max(0.5, 0.16 * s); c.beginPath(); c.moveTo(mx, top - 4 * s); c.lineTo(mx + jl * 0.8, top); c.moveTo(mx, top - 4 * s); c.lineTo(mx - cj, top); c.moveTo(mx, top - 4 * s); c.lineTo(mx, top); c.stroke();
    c.fillStyle = dark; c.fillRect(mx - cj - 1.6 * s * Math.abs(cosA), top - 0.4 * s, 2.4 * s * Math.abs(cosA) + 0.8, 1.6 * s);
    c.fillStyle = col; c.fillRect(mx - 0.9 * s, top + 0.2 * s, 1.8 * s, 1.4 * s);
    // the hook + its load (a bundle of beams), swaying a little
    const hx = mx + jl * 0.62, hy = top + (8 + 3 * Math.sin(f.t * 0.11)) * s, sw = f.motion ? Math.sin(f.t * 0.9) * 0.4 * s : 0;
    c.lineWidth = Math.max(0.4, 0.1 * s); c.beginPath(); c.moveTo(hx, top); c.lineTo(hx + sw, hy); c.stroke();
    c.fillStyle = dark; c.fillRect(hx + sw - 1.8 * s, hy, 3.6 * s, 0.9 * s);
    // THE BEACON at the mast's top: a slow red blink at night — STEADY + dimmer when it would sit beside the NEON letters
    if (night > 0.3) {
      const by = top - 4.6 * s, nearSign = f.logo && mx > f.logo.x - 30 && mx < f.logo.x + f.logo.w + 30 && by > f.logo.y - 30 && by < f.logo.y + f.logo.h * 1.8 + 30;
      // (9f: the skyline's own slow pulse — every beacon in the city on one clock, lights.js#beaconPulse — never a 1 Hz flasher)
      const blink = nearSign || !f.motion ? 0.55 : 0.14 + 0.86 * beaconPulse(f.bt == null ? f.t : f.bt);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = night * blink * f.power;
      const r = Math.max(3, 2.2 * s); c.drawImage(sprite_red(), mx - r, by - r, r * 2, r * 2);
      // (9f: the jib's tip carries one too)
      const tx = mx + jl, tipNear = f.logo && tx > f.logo.x - 30 && tx < f.logo.x + f.logo.w + 30 && top > f.logo.y - 30 && top < f.logo.y + f.logo.h * 1.8 + 30;
      c.globalAlpha = night * (tipNear || !f.motion ? 0.55 : 0.14 + 0.86 * beaconPulse(f.bt == null ? f.t : f.bt)) * f.power; const rt = r * 0.8; c.drawImage(sprite_red(), tx - rt, top - 0.6 * s - rt, rt * 2, rt * 2);
      c.restore();
    }
  }
  let redSp = null; const sprite_red = () => redSp || (redSp = sprite('rgba(255,70,60,1)', 'rgba(255,40,30,0.35)'));

  // 9f — THE SITE AT NIGHT (the owner: "the frame at night must stand out — real site lighting, not strobes"): STRINGS OF BARE WORK
  // BULBS along the floors' edges (rows of warm dots outlining the rising frame, a little sag between the columns — one string every
  // ~2 floors so the rows read apart on a phone), two FLOODS on the top deck lighting the steel from inside (a warm pool + the lit
  // columns, each with its shadow side), the RED OBSTRUCTION LIGHTS on the frame's top corners pulsing slowly with the skyline's beacons
  // (the speed round: everything but the red lights' pulse is static for a given frame height — baked into TWO cached layers when the frame
  // rises a step: the GLOW (the bulbs, the floods' pools + lamps, the lit columns; drawn 'lighter') and the SHADE (the columns' shadow
  // sides; drawn normally) — two blits a frame)
  let bulbs = null, bulbKey = '';
  function bulbLayer(f, top) {
    const s = geo.s, k = Math.min(2, f.dpr || 1), w = geo.xR - geo.xL, foot = geo.yB;
    const key = `${Math.round(geo.xL * 4)}|${Math.round(w * 4)}|${Math.round(top * 4)}|${Math.round(foot)}|${k}`;
    if (bulbs && key === bulbKey) return bulbs;
    bulbKey = key;
    const pad = Math.ceil(Math.max(12, w * 0.7)), x0 = Math.floor(geo.xL - pad), y0 = Math.floor(top - pad), cw = Math.ceil(w + pad * 2), ch = Math.ceil(foot - top + pad * 2);
    const mk = old => { const cv = old || document.createElement('canvas'); cv.width = Math.max(1, cw * k); cv.height = Math.max(1, ch * k); const x = safeCtx(cv); x.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); return [cv, x]; };
    const [cv, x] = mk(bulbs && bulbs.cv), [sv, z] = mk(bulbs && bulbs.sv);
    x.globalCompositeOperation = 'lighter';
    // the bulb strings
    const pitch = 3 * s, every = Math.max(1, Math.ceil(4.6 / pitch)), bays = Math.max(3, Math.round(w / (2.3 * s))), gap = Math.max(1.9, 1.15 * s);
    const n = Math.max(2, Math.round(w / gap));
    for (let yy = top + 0.6, j = 0; yy < foot; yy += pitch * every, j++) {
      for (let i = 0; i <= n; i++) {
        const u = (i + (j % 2 ? 0.5 : 0)) / n; if (u > 1) continue;
        const xx = geo.xL + u * w, bu = (u * bays) % 1, sag = Math.sin(bu * Math.PI) * Math.min(1.3, 0.55 * s);
        const r = Math.max(1.5, 0.95 * s);
        x.globalAlpha = 0.38 * 0.9; x.drawImage(warm(), xx - r * 1.6, yy + sag - r * 1.6, r * 3.2, r * 3.2);
        x.globalAlpha = 0.9; x.fillStyle = 'rgb(255,216,138)'; const cr = Math.max(0.45, 0.3 * s); x.beginPath(); x.arc(xx, yy + sag, cr, 0, TAU); x.fill();
      }
    }
    // THE FLOODS on the top deck: a warm pool down into the top floors + the columns it hits lit on the side facing it (+ their shadows)
    const depth = Math.min(foot - top, 14 * s);
    x.lineWidth = Math.max(0.6, 0.3 * s); z.lineWidth = Math.max(0.5, 0.22 * s); z.strokeStyle = 'rgb(8,8,14)';
    for (const fu of [0.28, 0.72]) {
      const fx = geo.xL + w * fu, R = Math.max(10, w * 0.62);
      x.globalAlpha = 0.62; x.drawImage(warm(), fx - R, top - R * 0.3, R * 2, R * 1.7);
      for (let i = 0; i <= bays; i++) {
        const cx = geo.xL + w * i / bays, d = Math.abs(cx - fx) / (w * 0.6);
        if (d > 1) continue;
        const side = cx < fx ? 1 : -1;
        x.globalAlpha = (1 - d) * 0.75; x.strokeStyle = 'rgb(255,214,150)'; x.beginPath(); x.moveTo(cx + side * 0.25 * s, top); x.lineTo(cx + side * 0.25 * s, top + depth * (1 - 0.5 * d)); x.stroke();
        if (d >= 0.08) { z.globalAlpha = (1 - d) * 0.6 * 0.55; z.beginPath(); z.moveTo(cx - side * 0.3 * s, top + 0.5 * s); z.lineTo(cx - side * 0.3 * s, top + depth * 0.8); z.stroke(); }
      }
      const rr = Math.max(2.2, 1.5 * s); x.globalAlpha = 1; x.drawImage(glow(), fx - rr, top - 0.6 * s - rr, rr * 2, rr * 2);
    }
    bulbs = { cv, sv, x0, y0, w: cw, h: ch };
    return bulbs;
  }
  function siteLights(c, f) {
    const top = frameTop(), k = f.night * f.power;
    if (k < 0.05) return;
    const b = bulbLayer(f, top);
    c.save();
    c.globalAlpha = k; blit(c, b.sv, 0, 0, b.sv.width, b.sv.height, b.x0, b.y0, b.w, b.h);
    c.globalCompositeOperation = 'lighter'; blit(c, b.cv, 0, 0, b.cv.width, b.cv.height, b.x0, b.y0, b.w, b.h);
    c.restore();
    obstruction(c, f, top);
  }
  /** the red obstruction lights on the frame's (or the dark shell's) two top corners — the skyline beacons' slow pulse */
  function obstruction(c, f, top) {
    const k = f.night * f.power; if (k < 0.05) return;
    const s = geo.s, a = f.motion ? 0.14 + 0.86 * beaconPulse(f.bt == null ? f.t : f.bt) : 0.7, r = Math.max(2.4, 1.7 * s);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * a;
    for (const x of [geo.xL + 0.5 * s, geo.xR - 0.5 * s]) c.drawImage(sprite_red(), x - r, top - 0.7 * s - r, r * 2, r * 2);
    c.restore();
  }
  function topping(c, f) {
    const s = geo.s, y = frameTop(), x = geo.cx + 1.5 * s;
    // the evergreen (a dark green tree on the top beam) + the flag on its pole (red + white stripes, waving)
    const th = Math.max(6, 4.5 * s), tw = th * 0.62;
    c.fillStyle = f.night > 0.5 ? 'rgb(24,50,34)' : 'rgb(36,96,52)'; c.beginPath(); c.moveTo(x, y - th); c.lineTo(x - tw / 2, y); c.lineTo(x + tw / 2, y); c.closePath(); c.fill();
    const px = geo.cx - 2.6 * s, ph = Math.max(10, 7 * s), fw = Math.max(6, 4 * s), fh = fw * 0.62, wv = f.motion ? Math.sin(f.t * 4.2) * 0.12 : 0;
    c.strokeStyle = f.night > 0.5 ? 'rgb(150,150,160)' : 'rgb(230,230,230)'; c.lineWidth = Math.max(0.6, 0.2 * s); c.beginPath(); c.moveTo(px, y); c.lineTo(px, y - ph); c.stroke();
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? 'rgb(240,240,236)' : 'rgb(200,40,48)'; c.beginPath(); c.moveTo(px, y - ph + i * fh / 5); c.lineTo(px + fw, y - ph + i * fh / 5 + fw * wv); c.lineTo(px + fw, y - ph + (i + 1) * fh / 5 + fw * wv); c.lineTo(px, y - ph + (i + 1) * fh / 5); c.closePath(); c.fill(); }
    c.fillStyle = 'rgb(40,60,140)'; c.fillRect(px, y - ph, fw * 0.4, fh * 0.55);
  }
  // 9f — THE OLD BUILDING's SPRITE: its tiers + crown drawn by skyBlock (the bake's own code + tones) at the bake's dpr, once per look
  let ghost = null;
  function oldSprite(f) {
    const o = t && t.orig, T = f.T;
    if (!o || !T || !o.tiers || !o.tiers.length) return null;
    const cam = L.cam, k = Math.min(2, f.dpr || 1);
    const key = `${T.day}|${T.night}|${T.sunDir}|${T.sunEl}|${T.ovc}|${k}|${Math.round(geo.xL)}|${Math.round(geo.yB)}|${o.form}|${o.mat}`;
    if (ghost && ghost.key === key) return ghost;
    let xa = Infinity, xb = -Infinity, ya = Infinity;
    for (const tr of o.tiers) { const [a, ty] = project(cam, tr.x0, (tr.y0 || 0) + tr.h, tr.z0), [b] = project(cam, tr.x1, 0, tr.z0); xa = Math.min(xa, a); xb = Math.max(xb, b); ya = Math.min(ya, ty); }
    const s = geo.s, cH = ((o.crown ? o.crown.h * 1.7 : 0) + 6) * s;
    const x0 = Math.floor(xa - 4 * s - 2), x1 = Math.ceil(xb + 4 * s + 2), y0 = Math.floor(ya - cH - 2), y1 = Math.ceil(geo.yB + 1);
    const cv = (ghost && ghost.cv) || document.createElement('canvas');
    cv.width = Math.max(1, Math.round((x1 - x0) * k)); cv.height = Math.max(1, Math.round((y1 - y0) * k));
    const x = safeCtx(cv);
    x.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
    try {
      o.tiers.forEach((tr, i) => skyBlock(x, cam, { ...tr, mat: o.mat, seed: o.seed, kind: 'landmark', tower: o.id, rank: o.rank, works: null }, T, { rank: o.rank, tierIndex: i, tiers: o.tiers.length, flood: null, gold: !!o.gold, tower: o }));
    } catch (e) { console.warn('[harbor] the old tower', e); }
    ghost = { key, cv, x0, y0, w: x1 - x0, h: y1 - y0, k, roof: ya };
    return ghost;
  }
  const ease = u => { const d = u * u * (3 - 2 * u) * 0.35 + u * u * 0.65; return d > 1 ? 1 : d; };
  function implosion(c, f, st) {
    const I = implosionAt(st.s), s = geo.s, H = geo.yB - geo.yT, g = oldSprite(f);
    if (g && I.drop < 1) {
      if (I.standing) blit(c, g.cv, 0, 0, g.cv.width, g.cv.height, g.x0, g.y0, g.w, g.h);
      else {
        // THE FALL in floor bands (the crown rides the top band): band j's drop starts LAG × its height up the building later (the
        // base gives way first, the top a beat behind), each band squashed a little as it goes (gaps open between the floors), the
        // upper half leaning about the foot toward the side the charges fired last
        const bh = g.roof, foot = geo.yB, Hb = foot - bh, nb = Math.max(8, Math.min(16, Math.round(Hb / (5 * s)))), span = 6.7, LAG = 0.7;
        const lean = (t.seed || 3) % 2 ? 1 : -1;
        for (let j = 0; j < nb; j++) {
          const yA = j === 0 ? g.y0 : bh + Hb * j / nb, yB = bh + Hb * (j + 1) / nb, fr = 1 - (j + 0.5) / nb;
          const u = clamp01((st.s - (IMPLODE_DROP0 + LAG * fr)) / (span - LAG)), d = ease(u);
          if (d >= 1) continue;
          const dy = d * Hb * 1.05, sq = 1 - 0.22 * d * (1 - 0.5 * fr), hh = (yB - yA) * sq;
          const ang = lean * 0.11 * clamp01((u - 0.08) / 0.55) * clamp01((fr - 0.3) / 0.7);
          const jit = f.motion && d > 0.02 ? Math.sin(st.s * 31 + j * 7.3) * 0.35 * s * (1 - d) : 0;
          c.save();
          if (ang) { c.translate(geo.cx, foot); c.rotate(ang); c.translate(-geo.cx, -foot); }
          blit(c, g.cv, 0, (yA - g.y0) * g.k, g.cv.width, (yB - yA) * g.k, g.x0 + jit, yA + dy + (yB - yA - hh), g.w, hh);
          c.restore();
        }
      }
    } else if (!g && I.drop < 1) {
      // (no sprite — no tones yet: the plain block as a stand-in for a frame)
      const top = geo.yT + I.drop * H;
      c.fillStyle = f.night > 0.5 ? 'rgb(52,50,64)' : 'rgb(196,186,164)'; c.fillRect(geo.xL, top, geo.xR - geo.xL, geo.yB - top + 2);
    }
    // THE CHARGES: bright white flashes racing down the floors, the ones already fired fading
    if (I.flash) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 6; k++) {
        const u = I.flash.u - k * 0.12; if (u < 0 || u > 1) continue;
        const y = geo.yT + u * H, a = (1 - k / 6) * (k === 0 ? 1 : 0.6);
        for (let q = 0; q < 3; q++) { const x = geo.xL + (geo.xR - geo.xL) * (q + 0.5) / 3, r = Math.max(3, 2.6 * s) * (k === 0 ? 1.4 : 1); c.globalAlpha = a; c.drawImage(glow(), x - r, y - r, r * 2, r * 2); }
      }
      c.restore();
    }
    // THE DUST: billowing up from the foot + out, drifting with the wind, settling over minutes
    dustCloud(c, f, I.dust.grow, I.dust.fade, st.s);
  }
  function dustCloud(c, f, grow, fade, sec) {
    if (grow <= 0.01 || fade <= 0.01) return;
    const s = geo.s, H = geo.yB - geo.yT, drift = (f.wind || 2) * 0.6 * Math.max(0, sec || 60) * s * 0.05;
    c.save();
    for (let i = 0; i < 34; i++) {
      const u = (i * 0.618) % 1, v = (i * 0.37) % 1;
      const r = (7 + 18 * u) * s * (0.4 + 0.8 * grow) * (1 + 0.4 * (sec > 30 ? Math.min(1, (sec - 30) / 120) : 0));
      const x = geo.cx + (u - 0.5) * (geo.xR - geo.xL) * (1.5 + 4 * grow) + drift * (0.4 + v);
      const y = geo.yB - (0.08 + 0.9 * v * grow) * H * 0.75 + (f.motion ? Math.sin((sec || 0) * 0.4 + i) * 1.2 : 0);
      c.globalAlpha = fade * (0.42 + 0.26 * v) * (f.night > 0.5 ? 0.55 : 1); c.drawImage(dust(), x - r, y - r, r * 2, r * 2);
    }
    c.restore();
  }
  function searchlights(c, f, k) {
    if (f.night < 0.3 || k <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2; i++) {
      const a = (i ? 1 : -1) * 0.3 + Math.sin(f.t * (0.35 + 0.1 * i) + i * 2) * 0.35, x0 = geo.cx + (i ? 3 : -3) * geo.s, y0 = geo.yB - 4 * geo.s, len = geo.yB + 40;
      const x1 = x0 + Math.sin(a) * len, y1 = y0 - Math.cos(a) * len, wd = len * 0.07;
      const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(255,250,232,${0.42 * k * f.night})`); g.addColorStop(1, 'rgba(255,250,232,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(a) * wd, y1 - Math.sin(a) * wd); c.lineTo(x1 + Math.cos(a) * wd, y1 + Math.sin(a) * wd); c.closePath(); c.fill();
    }
    c.restore();
  }

  return {
    layout,
    /** f: { st (core/harbor-tower.js), T (the bake's tones: the old building's sprite), dpr, night (0..1), t (s), motion, power (the legendary's / blackout's 0..1), logo (the sign's rect), fade, wind } */
    draw(c, f) {
      const st = f.st;
      if (!st || !geo || !t || f.fade <= 0) return;
      if (st.stage !== 'implosion' && ghost) { ghost.cv.width = ghost.cv.height = 0; ghost = null; }
      const any = st.crane || st.stage === 'finishing' || st.stage === 'rising' || st.stage === 'topping' || st.stage === 'implosion' || (st.stage === 'rubble' && st.k > 0.02) || st.stage === 'opening';
      if (!any) return;
      c.save(); c.globalAlpha = f.fade; clipFront(c);
      if (st.stage === 'implosion') implosion(c, f, st);
      if (st.stage === 'rubble' && st.k > 0.02) dustCloud(c, f, 1, st.k * 0.5, 300);
      if (st.stage === 'rising' || st.stage === 'topping') siteLights(c, f);
      else if (st.stage === 'finishing' && st.crane) obstruction(c, f, frameTop());
      if (st.stage === 'topping') topping(c, f);
      if (st.crane) crane(c, f);
      c.restore();
      if (st.stage === 'opening') searchlights(c, f, st.k == null ? 1 : st.k);
    },
    debug: () => (geo ? { x: Math.round(geo.cx), top: Math.round(geo.yT), foot: Math.round(geo.yB), frameTop: t ? Math.round(frameTop()) : null, works: t ? t.works || null : null, stage: t ? t.stage || null : null, old: ghost ? { w: ghost.w, h: ghost.h, form: t.orig && t.orig.form } : null, bulbs: !!bulbs } : null),
  };
}
