// CITY 2.0 — THE HARBOR: GOLDEN-HOUR RAYS (Part 2). When the low sun passes behind the skyline, shafts of light stream through the
// SUN GAPS (the corridors in the skyline's tops, core/harbor-layout.js#SUN_GAPS) and between the towers: each shaft fans out from
// the sun through its corridor into the hazy air (light falls off along it), the nearer buildings drawn over its foot. Two
// passes: the shafts in the haze behind the near buildings (after the far layer), and a fainter veil over the whole city (after
// the near layer: the air in front of it is lit too). Cheap: a few gradient wedges a frame, only at golden hour / dawn.
import { groundY, Z, REF } from '../../core/harbor-layout.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/** how strong the rays are now (0..1) from the look: golden hour / dawn, the sun low, clear air */
export function rayStrength(LK, sunNow) {
  if (!sunNow || !LK || LK.alwaysNight) return 0;
  const g = (LK.w.golden || 0) + (LK.w.dawn || 0), el = LK.sun.el;
  if (g < 0.2 || el < -1.5 || el > 14 || LK.rain || (LK.cloud || 0) > 0.7 || (LK.fog || 0) > 0.35) return 0;
  return smooth(0.2, 0.7, g) * (1 - smooth(8, 14, el)) * smooth(-1.5, 0.5, el) * (1 - smooth(0.4, 0.7, LK.cloud || 0)) * Math.min(1, (sunNow.vis || 0) * 1.4 + 0.25);
}

/**
 * pass: 'behind' (after the far layer) | 'front' (after the near layer). sun: { x, y, r }; L: the layout (its gaps, its camera);
 * k: rayStrength; t: seconds (the shafts breathe a little).
 */
export function drawRays(c, L, sun, k, t, pass, motion = true, tier = 2) {
  if (k <= 0.01 || !sun || (tier === 0 && pass === 'front')) return;   // tier 0: the shafts behind the city only
  const cam = L.cam, W = cam.W, hUnit = cam.F / REF.F, HZ = groundY(cam, Z.quay);
  const floorY = HZ - 78 * hUnit, topY = cam.limitY;
  const reach = (cam.VPY - cam.limitY) * 1.6 + W * 0.25;   // the shafts stay in the air over the city, never across the sign
  c.save();
  c.globalCompositeOperation = 'lighter';
  const col = sun.el != null && sun.el < 3 ? [255, 150, 80] : [255, 190, 120];
  for (const g of L.gaps) {
    const dist = Math.abs(g.sx - sun.x);
    if (dist > W * 0.62 || dist < 2) continue;
    const near = 1 - smooth(W * 0.08, W * 0.62, dist);
    // the corridor's opening is a slot from its floor up to the tops: seen from the sun, the light through it fans out beyond
    // it, between the directions to the slot's top and its floor — a broad fan from a corridor beside the sun, a thin shaft
    // from a far one. Striated: the slot's own edges (a cornice, a tank, a spire) break the light into several shafts.
    const top = { x: g.sx, y: topY }, bot = { x: g.sx, y: Math.max(floorY, sun.y + 6) };
    const ang = p => Math.atan2(p.y - sun.y, p.x - sun.x);
    let a0 = ang(top), a1 = ang(bot);
    if (Math.abs(a1 - a0) > Math.PI) a1 += a1 < a0 ? Math.PI * 2 : -Math.PI * 2;
    const r0 = Math.hypot(g.sx - sun.x, (topY + floorY) / 2 - sun.y), r1 = r0 + reach;
    // (the shafts start outside the sun's disc: added over it, they bleached a 6° golden sun to lemon — district/sun.js#sunColourAt)
    const rs = Math.max(r0 * 0.92, (sun.r || 0) * 1.4);
    const n = tier === 2 ? 5 : 3;
    // one gradient per corridor (alpha 1), each shaft's strength by globalAlpha
    const gr = c.createRadialGradient(sun.x, sun.y, rs, sun.x, sun.y, Math.max(r1, rs + 1));
    gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(0.2, `rgba(${col},0.5)`); gr.addColorStop(0.6, `rgba(${col},0.12)`); gr.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = gr;
    for (let i = 0; i < n; i++) {
      const h = Math.sin(g.sx * 12.9898 + i * 78.233) * 43758.5453, hk = h - Math.floor(h);
      const f0 = (i + 0.12) / n, f1 = (i + 0.88 - hk * 0.35) / n;
      const b0 = a0 + (a1 - a0) * f0, b1 = a0 + (a1 - a0) * f1;
      const breathe = motion ? 0.8 + 0.2 * Math.sin(t * (0.17 + hk * 0.1) + i * 1.9 + g.sx * 0.05) : 1;
      const a = (pass === 'behind' ? 0.16 : 0.06) * k * near * breathe * (0.45 + 0.55 * hk);
      if (a < 0.004) continue;
      c.globalAlpha = a;
      c.beginPath();
      c.moveTo(sun.x + Math.cos(b0) * rs, sun.y + Math.sin(b0) * rs);
      c.lineTo(sun.x + Math.cos(b0) * r1, sun.y + Math.sin(b0) * r1);
      c.lineTo(sun.x + Math.cos(b1) * r1, sun.y + Math.sin(b1) * r1);
      c.lineTo(sun.x + Math.cos(b1) * rs, sun.y + Math.sin(b1) * rs);
      c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
    // the opening itself glows (the lit haze in the corridor)
    if (pass === 'behind') {
      const cy = (floorY + topY) / 2, rr = (floorY - topY) * 0.55;
      const gg = c.createRadialGradient(g.sx, cy, 0, g.sx, cy, rr);
      gg.addColorStop(0, `rgba(${col},${0.2 * k * near})`); gg.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = gg;
      // (never over the sun's own disc: the glow is the air around it — over it, it bleached a golden sun to lemon)
      if (sun.r && Math.hypot(sun.x - g.sx, sun.y - cy) < rr + sun.r) {
        c.save(); c.beginPath(); c.rect(g.sx - rr, cy - rr, rr * 2, rr * 2); c.ellipse(sun.x, sun.y, sun.r * 0.98, sun.r * 0.98, 0, 0, Math.PI * 2); c.clip('evenodd');
        c.fillRect(g.sx - rr, cy - rr, rr * 2, rr * 2); c.restore();
      } else c.fillRect(g.sx - rr, cy - rr, rr * 2, rr * 2);
    }
  }
  c.restore();
}
