// CITY 2.0 — 9e: THE CONSTRUCTION TOWER, its LIVE layer (the stage itself — the empty lot, the rising steel frame, the dark shell — is baked:
// core/harbor-layout.js#towerStage + blocks.js#worksBlock). Drawn right after the near skyline, CLIPPED above the roofs nearer than the slot
// (JAZZ, the near band): everything here stands behind them, as the building does.
//   THE CRANE (rising → the crane's day off in November): a tower crane on the slot's right — its lattice mast climbing with the building,
//     the jib slewing slowly by day (seen end-on it shortens), the hook + a load; at night a dark silhouette + its RED BEACON (a slow
//     blink — STEADY when it would sit beside the NEON letters: the owner's rule) · THE WORK LIGHTS (night, rising / topping): warm
//     floods on the frame's top floors · TOPPING OUT: a small evergreen + a flag on the top beam (big enough to read: ~6 pt)
//   THE IMPLOSION (core/harbor-tower.js#implosionAt): the old building drawn live, the charges FLASHING down the floors, the DROP straight
//     down, the DUST billowing up + out and settling over minutes (a haze hangs over the lot for the rubble's first minutes)
//   THE GRAND OPENING (its night): two searchlights sweeping from the foot (the neon outline itself lights with the re-bake at 7 pm)
// Phone first: every piece a clear silhouette + one bright accent (the beacon, the work lights, the flashes, the beams).
import { project, roofline } from '../../core/harbor-layout.js';
import { TOWER_ID, implosionAt } from '../../core/harbor-tower.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const TAU = Math.PI * 2;

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
      const blink = nearSign || !f.motion ? 0.55 : (Math.sin(f.t * Math.PI) > 0 ? 1 : 0.12);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = night * blink * f.power;
      const r = Math.max(3, 2.2 * s); c.drawImage(sprite_red(), mx - r, by - r, r * 2, r * 2); c.restore();
    }
  }
  let redSp = null; const sprite_red = () => redSp || (redSp = sprite('rgba(255,70,60,1)', 'rgba(255,40,30,0.35)'));

  function workLights(c, f) {
    const s = geo.s, y = frameTop(), k = f.night * f.power;
    if (k < 0.05) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    const n = 3;
    for (let i = 0; i < n; i++) {
      const x = geo.xL + (geo.xR - geo.xL) * (i + 0.5) / n, fl = f.motion ? 0.88 + 0.12 * Math.sin(f.t * 7 + i * 2.1) : 1;
      c.globalAlpha = 0.5 * k * fl; const r = 7 * s; c.drawImage(glow(), x - r, y - r * 0.4, r * 2, r * 1.6);
      c.globalAlpha = k * fl; const rc = Math.max(1.6, 1.0 * s); c.drawImage(glow(), x - rc, y + 1.2 * s - rc, rc * 2, rc * 2);
    }
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
  function implosion(c, f, st) {
    const I = implosionAt(st.s), s = geo.s, full = t.full0 || { h: t.h }, H = geo.yB - geo.yT, night = f.night;
    const drop = I.drop * H, sq = 1 - 0.06 * I.drop;
    // the old building, live: its stone, its window grid (dark by day, a few lit at night), sliding down behind the roofs
    if (I.drop < 1) {
      const top = geo.yT + drop, w = geo.xR - geo.xL, xl = geo.xL + w * (1 - sq) / 2;
      const stone = night > 0.5 ? [52, 50, 64] : [196, 186, 164], lit = night > 0.5;
      c.fillStyle = `rgb(${stone})`; c.fillRect(xl, top, w * sq, geo.yB - top + 2);
      c.fillStyle = lit ? 'rgba(255,214,150,0.75)' : 'rgba(60,58,70,0.6)';
      const rows = Math.max(6, Math.round((geo.yB - top) / (3.6 * s))), cols = 4;
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { if (lit && ((r * 7 + q * 3) % 5)) continue; c.fillRect(xl + w * sq * (q + 0.3) / cols, top + 2 * s + r * 3.6 * s, w * sq * 0.4 / cols, 1.6 * s); }
      // the crown (a spire) on the old one while it stands
      if (I.standing) { c.fillStyle = `rgb(${stone})`; c.beginPath(); c.moveTo(geo.cx - w * 0.2, top); c.lineTo(geo.cx, top - 9 * s); c.lineTo(geo.cx + w * 0.2, top); c.closePath(); c.fill(); }
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
    /** f: { st (core/harbor-tower.js), night (0..1), t (s), motion, power (the legendary's / blackout's 0..1), logo (the sign's rect), fade, wind } */
    draw(c, f) {
      const st = f.st;
      if (!st || !geo || !t || f.fade <= 0) return;
      const any = st.crane || st.stage === 'rising' || st.stage === 'topping' || st.stage === 'implosion' || (st.stage === 'rubble' && st.k > 0.02) || st.stage === 'opening';
      if (!any) return;
      c.save(); c.globalAlpha = f.fade; clipFront(c);
      if (st.stage === 'implosion') implosion(c, f, st);
      if (st.stage === 'rubble' && st.k > 0.02) dustCloud(c, f, 1, st.k * 0.5, 300);
      if (st.stage === 'rising' || st.stage === 'topping') workLights(c, f);
      if (st.stage === 'topping') topping(c, f);
      if (st.crane) crane(c, f);
      c.restore();
      if (st.stage === 'opening') searchlights(c, f, st.k == null ? 1 : st.k);
    },
    debug: () => (geo ? { x: Math.round(geo.cx), top: Math.round(geo.yT), foot: Math.round(geo.yB), frameTop: t ? Math.round(frameTop()) : null, works: t ? t.works || null : null, stage: t ? t.stage || null : null } : null),
  };
}
