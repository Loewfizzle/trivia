// CITY 2.0 — WSP: THE GALE's SEA (the owner, Nov 1 8:36 am: "there should be more of a REACTION — really windy days"). A breeze is
// untouched: everything here is scaled by galeK (core/harbor-wind.js's level → 0 below "windy", full at a gale). The ONE wind state
// (WF) drives it, so the gust waves roll through the water, the spray and the trees together.
//   rough(c, s)   on the water, right after it is drawn: the harbor DARKER + rougher, broad SWELL bands rolling downwind (soft dark
//                 troughs with a lighter shoulder, sliding across in perspective), and WHITECAPS — white crests that BREAK (a bright
//                 head stretching out) then FADE into a trailing foam streak drifting downwind; more of them inside a gust, bigger near
//                 us. White flecks + streaks that read on the phone, never foam detail.
//   spray(c, s)   in front of the breakwater + the pier head: in a gust a burst of white spray flung up off the rocks / the pier's face
//                 and blown downwind, falling back + fading.
// Cheap: a few dozen rects + a few soft sprites a frame at a gale (tier caps), nothing at all below "windy". Reduced motion / tier 0: a
// still, lighter sea (a fixed set of caps, no spray).
import { ctx2d } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
/** how much of the gale's drama a wind gets: 0 for a breeze (level ~0.3), ~0.3 on a windy day (14 m/s), 1 at a gale (20 m/s) */
export const galeK = WF => (WF ? smooth(0.62, 0.95, WF.level || 0) : 0);
/** the caps alive at a full gale, per tier */
export const CAPS = [16, 44, 72];
const SPRAY_MAX = [0, 60, 120];

export function createGaleSea() {
  const caps = [], spray = [];
  let puff = null, R = 9301;
  const rnd = () => { R = (R * 16807) % 2147483647; return R / 2147483647; };
  function puffSprite() {
    if (puff) return puff;
    const cv = document.createElement('canvas'); cv.width = cv.height = 32;
    const x = ctx2d(cv);
    if (x) { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); }
    puff = cv;
    return cv;
  }
  const light = (day, night) => (day > 0.5 ? [246, 250, 252] : [204 + 40 * day, 210 + 36 * day, 232 + 16 * day]);   // (night: pale foam catching the city's light)

  return {
    /** s: { W, y0, y1 (the water band), WF, day 0..1, gold 0..1, t (s), dt (ms), tier, motion, fade } */
    rough(c, s) {
      const g = galeK(s.WF) * (s.fade == null ? 1 : s.fade);
      if (g < 0.02) { caps.length = 0; return; }
      const { W, y0, y1, WF } = s, Hw = y1 - y0, side = WF.side || 1, day = clamp01(s.day), night = 1 - day, t = s.t || 0;
      const still = !s.motion || !(s.tier > 0), sec = Math.min(0.1, (s.dt || 16) / 1000);
      c.save();
      // 1. DARKER water: the gale's harbor a deep slate (the sky's light off it broken up)
      c.globalAlpha = 1;
      const dg = c.createLinearGradient(0, y0, 0, y1);
      dg.addColorStop(0, `rgba(8,18,30,${(0.16 * g).toFixed(3)})`); dg.addColorStop(1, `rgba(4,10,20,${((0.32 + 0.08 * night) * g).toFixed(3)})`);
      c.fillStyle = dg; c.fillRect(0, y0, W, Hw + 1);
      // 2. THE SWELL: broad bands sliding downwind across the harbor — a soft dark trough + a lighter shoulder, slanted in perspective
      //    (narrow far, wide near), ~4 on screen, their sideways speed the wind's
      const n = 4, per = W * 0.62, off = still ? 0 : ((t * (18 + 26 * g) * side) % per + per) % per;
      for (let i = -1; i < n + 1; i++) {
        const xc = i * per / 1.6 + off * 1 - per * 0.2;
        const wTop = 10 + 6 * g, wBot = 46 + 30 * g, slant = 70 * side;
        const tr = (a, dx) => { c.beginPath(); c.moveTo(xc + dx - wTop, y0); c.lineTo(xc + dx + wTop, y0); c.lineTo(xc + dx + slant + wBot, y1); c.lineTo(xc + dx + slant - wBot, y1); c.closePath(); c.globalAlpha = a; c.fill(); };
        c.fillStyle = 'rgb(2,8,18)'; tr((0.15 + 0.06 * night) * g, 0);
        c.fillStyle = day > 0.5 ? 'rgb(214,226,236)' : 'rgb(90,104,140)'; tr(0.05 * g * (0.4 + 0.6 * day), -(wTop + 6) * side);
      }
      // 3. THE WHITECAPS: born at random over the harbor (more in a gust: the wave at its x), each BREAKS (0 → 18 % of its life: the
      //    bright head stretching) then FADES into a trailing streak, drifting downwind; size by depth (far small, near big)
      const want = Math.round(CAPS[s.tier == null ? 2 : s.tier] * g);
      if (still) { if (caps.length !== want) { caps.length = 0; R = 9301; for (let i = 0; i < want; i++) caps.push(newCap(W, y0, Hw, 0.5 + 0.5 * rnd(), side)); } }
      else {
        for (let i = caps.length - 1; i >= 0; i--) { const p = caps[i]; p.age += sec; p.x += p.vx * sec; if (p.age >= p.life) caps.splice(i, 1); }
        // (the birth rate keeps ~want alive; a gust's wave decides where)
        let tries = 0;
        while (caps.length < want && tries++ < 6) {
          const u = rnd(), at = WF.at ? WF.at(u) : 0;
          if (rnd() > 0.3 + 0.7 * at) continue;
          caps.push(newCap(W, y0, Hw, 0, side, u * W));
        }
      }
      const col = light(day, night), cs = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`, aK = (day > 0.5 ? 1.15 : 0.95) * g * (s.gold ? 1 - 0.15 * s.gold : 1);
      c.fillStyle = cs;
      for (const p of caps) {
        const ph = p.age / p.life, br = smooth(0, 0.18, ph), fd = 1 - smooth(0.25, 1, ph);
        const a = aK * br * fd * p.b; if (a < 0.03) continue;
        const L0 = p.len * (0.45 + 0.55 * br), th = p.th;
        // the head (the breaking crest: brighter, at the downwind end) + the foam streak trailing upwind (longer as it fades)
        c.globalAlpha = Math.min(1, a);
        const hx = p.x - (side > 0 ? L0 : 0);
        c.fillRect(hx, p.y - th / 2, L0, th);
        // (the crest's lip: a shorter bright line just above the head — the wave curling over, so a cap reads as a breaking crest)
        c.globalAlpha = Math.min(1, a * 0.75 * br);
        c.fillRect(hx + L0 * (side > 0 ? 0.35 : 0.1), p.y - th * 1.35, L0 * 0.55, th * 0.7);
        c.globalAlpha = Math.min(1, a * 0.4);
        const tail = p.len * (0.6 + 1.4 * ph);
        c.fillRect(p.x - (side > 0 ? L0 + tail : -L0), p.y - th * 0.3, tail, th * 0.6);
      }
      c.restore();
    },
    /** s: { sites: [{ x0, x1, y, s (its scale) }] (the breakwater's top, the pier head's face), WF, day, t, dt, tier, motion, fade, W } */
    spray(c, s) {
      const g = galeK(s.WF) * (s.fade == null ? 1 : s.fade), tier = s.tier == null ? 2 : s.tier;
      if (g < 0.05 || !s.motion || !(tier > 0)) { spray.length = 0; return; }
      const sec = Math.min(0.1, (s.dt || 16) / 1000), WF = s.WF, side = WF.side || 1, W = s.W || 400, day = clamp01(s.day);
      // a burst in a gust: each site rolls for one where the gust is strong (~0.9 a second per site at a full gale + a gust)
      for (const st of s.sites || []) {
        const x = st.x0 + rnd() * (st.x1 - st.x0), at = WF.at ? WF.at(Math.max(0, Math.min(1, x / W))) : 0;
        if (spray.length < SPRAY_MAX[tier] * g && rnd() < sec * 1.6 * g * (0.15 + at)) {
          const n = 7 + Math.floor(rnd() * 7), k = st.s || 1;
          for (let i = 0; i < n; i++) spray.push({ x: x + (rnd() - 0.5) * 6 * k, y: st.y, vx: side * (14 + 34 * rnd()) * k * (0.6 + at), vy: -(18 + 30 * rnd()) * k, age: 0, life: 0.9 + 0.6 * rnd(), r: (0.9 + rnd()) * k, k });
        }
      }
      const P = puffSprite(), aK = (day > 0.5 ? 0.85 : 0.5) * g;
      c.save();
      for (let i = spray.length - 1; i >= 0; i--) {
        const p = spray[i];
        p.age += sec; if (p.age >= p.life) { spray.splice(i, 1); continue; }
        p.vy += 70 * p.k * sec; p.vx += side * 8 * sec; p.x += p.vx * sec; p.y += p.vy * sec;
        const ph = p.age / p.life, r = p.r * (1 + 2.2 * ph) * 2.4;
        c.globalAlpha = Math.min(1, aK * (1 - ph) * (ph < 0.12 ? ph / 0.12 : 1));
        c.drawImage(P, p.x - r, p.y - r, r * 2, r * 2);
      }
      c.restore();
    },
    debug: () => ({ caps: caps.length, spray: spray.length }),
    destroy() { caps.length = 0; spray.length = 0; if (puff) puff.width = 0; puff = null; },
  };
  function newCap(W, y0, Hw, age0, side, x) {
    const v = Math.pow(rnd(), 0.8), y = y0 + 2 + v * (Hw - 4), sc = 0.45 + 1.2 * v;
    return { x: x == null ? rnd() * W : x, y, len: (6 + 10 * rnd()) * sc, th: Math.max(1, 1.9 * sc), vx: side * (5 + 12 * sc), age: age0 * (1.4 + 1.2 * rnd()), life: 1.4 + 1.2 * rnd(), b: 0.7 + 0.3 * rnd() };
  }
}
