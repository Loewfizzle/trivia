// CITY 2.0 — THE HARBOR, PART 11a-2: THE SPEAKEASY's CHRISTMAS STRINGS (the first of Christmas — core/harbor-xmas.js). Big old-fashioned
// C9 bulbs (red, green, gold, blue, orange) on a dark green wire, swagged in shallow scallops along every upper sill, under the cornice
// and along the awning's edge. By day the coloured glass catches the light; after dark each bulb glows with a soft halo. Drawn two ways
// with ONE painter: while the Black Friday crew hangs them (core/harbor-crew.js#PLAN.xlights → workers.js: each string as far as it's
// hung) and every evening after (scene.js: all of them).
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V } from '../../core/harbor-speakeasy.js';
import { xlightSegments } from '../../core/harbor-xmas.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const BULBS = [[255, 52, 44], [40, 214, 92], [255, 190, 52], [64, 120, 255], [255, 128, 36]];
/** the bulbs' size (wall units: exaggerated a little so they read on a phone) + the halo's reach after dark */
const XL = Object.freeze({ r: 0.085, len: 0.15, halo: 0.42, hook: 1.05 });

let segCache = null, segKey = '';
function segsOf(s) {
  const key = `${s.x0}|${s.z0}`;
  if (key !== segKey) { const aw = s.awning; segCache = xlightSegments(s.windows, s.rows, SPEAK_V.cornice[0], aw ? { u0: aw.u0, u1: aw.u1, v: aw.y1 - 0.36 } : null); segKey = key; }
  return segCache;
}
/** every string fully hung */
export const XL_ALL = Object.freeze(new Proxy({}, { get: () => 1 }));

/**
 * paint the strings: prog[id] = the share of each string hung (0..1; XL_ALL = all of them); o: { lit 0..1 (switched on × the power),
 * dark 0..1 (the night: unlit glass goes dim), T (the bake's tones) }
 */
export function paintXLights(c, cam, s, prog, o = {}) {
  const segs = segsOf(s), lit = clamp01(o.lit || 0), dark = clamp01(o.dark || 0), day = 1 - dark;
  const glows = [];
  c.save(); c.lineCap = 'round';
  for (const g of segs) {
    const k = clamp01(prog[g.id] || 0);
    if (k <= 0.001) continue;
    const z = g.awning ? s.awning.z - 0.04 : s.z0 - 0.07, sp = cam.F / z;
    const span = g.u1 - g.u0, nh = Math.max(1, Math.round(span / XL.hook)), hs = span / nh;
    // (the hung part runs from its start side: g.from 0 = left → right, 1 = right → left)
    const ua = g.from ? g.u1 - span * k : g.u0, ub = g.from ? g.u1 : g.u0 + span * k;
    const vOf = u => { const f = ((u - g.u0) / hs) % 1; return g.v - g.sag * Math.sin(Math.PI * f); };
    const P = (u, v) => project(cam, s.x0 + u, v, z);
    // the wire: scallop by scallop
    c.strokeStyle = `rgba(${Math.round(30 + 30 * day)},${Math.round(52 + 40 * day)},${Math.round(36 + 26 * day)},0.95)`; c.lineWidth = Math.max(0.55, 0.028 * sp);
    c.beginPath();
    const steps = Math.max(6, Math.ceil((ub - ua) / 0.12));
    for (let i = 0; i <= steps; i++) { const u = ua + (ub - ua) * i / steps, [x, y] = P(u, vOf(u)); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke();
    // the bulbs, hanging from the wire (pointing down), in their colours
    for (let i = 0; i < g.n; i++) {
      const u = g.u0 + (i + 0.5) / g.n * span;
      if (u < ua - 1e-6 || u > ub + 1e-6) continue;
      const col = BULBS[(i + (g.floor || 0) * 2 + (g.win || 0)) % BULBS.length], v = vOf(u) - 0.03;
      const [x, y] = P(u, v), rr = Math.max(0.7, XL.r * sp), ln = Math.max(1.1, XL.len * sp);
      // the socket
      c.fillStyle = `rgba(28,44,30,0.95)`; c.fillRect(x - rr * 0.55, y - rr * 0.2, rr * 1.1, rr * 0.7);
      // the glass: unlit — the colour in daylight (dim after dark); lit — a hot core
      const base = col.map(v0 => v0 * (0.55 + 0.35 * day) * (1 - 0.6 * dark * (1 - lit)));
      const on = col.map(v0 => Math.min(255, v0 * 0.55 + 140));
      const fc = base.map((v0, j) => v0 + (on[j] - v0) * lit);
      c.fillStyle = `rgb(${fc[0] | 0},${fc[1] | 0},${fc[2] | 0})`;
      c.beginPath(); c.ellipse(x, y + ln * 0.45, rr, ln * 0.55, 0, 0, TAU); c.fill();
      if (day > 0.3 && lit < 0.5) { c.fillStyle = `rgba(255,255,255,${(0.55 * day).toFixed(3)})`; c.beginPath(); c.arc(x - rr * 0.35, y + ln * 0.3, Math.max(0.35, rr * 0.3), 0, TAU); c.fill(); }
      if (lit > 0.02) glows.push([x, y + ln * 0.5, XL.halo * sp, col]);
    }
  }
  // after dark: each bulb's halo on the wall + the air ('lighter')
  if (glows.length) {
    c.globalCompositeOperation = 'lighter';
    for (const [x, y, R, col] of glows) {
      const g = c.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${(0.5 * lit).toFixed(3)})`); g.addColorStop(0.35, `rgba(${col[0]},${col[1]},${col[2]},${(0.16 * lit).toFixed(3)})`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      c.fillStyle = g; c.fillRect(x - R, y - R, R * 2, R * 2);
    }
  }
  c.restore();
  return glows.length;
}
