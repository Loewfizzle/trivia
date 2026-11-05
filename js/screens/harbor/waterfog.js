// CITY 2.0 — PART 9a: THE FOG ON THE WATER (only in real fog / mist — the scene's WXS.fog — or a preview). A low bank lying on the harbor:
// densest along the far quay (the far shore melts into it), thinning toward the near railing; soft wisps drifting slowly with the real
// wind; pale grey-white by day, at night lit from inside by the city (its glow + a touch of the neon's colour). One baked tile of soft
// blobs (made once), scrolled + drawn twice at two speeds (a parallax); a vertical gradient over it. A frame: three drawImage + a fill.
import { safeCtx } from '../../ui/canvas-safe.js';
import { phaseClock } from '../../core/harbor-phase.js';
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

export function createWaterFog() {
  const ph = phaseClock();
  let tile = null, grad = null, gradKey = '', wisp = null;   // (PERF-A: grad = a 1-px-wide strip of the body's gradient; wisp = the two layers at CSS resolution)
  function bake() {
    tile = mk(512, 64);
    const x = safeCtx(tile);
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 46; i++) {
      const cx = r() * 512, cy = 20 + r() * 30, rw = 30 + r() * 70, rh = 6 + r() * 12, a = 0.18 + r() * 0.28;
      for (const ox of [-512, 0, 512]) {
        const g = x.createRadialGradient(cx + ox, cy, 0, cx + ox, cy, rw);
        g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.save(); x.translate(cx + ox, cy); x.scale(1, rh / rw); x.translate(-(cx + ox), -cy); x.fillStyle = g; x.fillRect(cx + ox - rw, cy - rw, rw * 2, rw * 2); x.restore();
      }
    }
  }
  return {
    /** s: { y0, y1 (the water's band), W, fog 0..1, day 0..1, glow [r,g,b] (the city's light at night), t, motion, wind (signed m/s) } */
    draw(c, s) {
      const k = clamp01((s.fog - 0.15) / 0.75);
      if (k <= 0.01 || !(s.y1 > s.y0)) return;
      if (!tile) bake();
      const h = s.y1 - s.y0, top = s.y0 - h * 0.35, H = h * 1.45;
      const day = clamp01(s.day), col = day > 0.5 ? [228, 232, 238] : s.glow || [118, 96, 150];
      const mixC = [col[0] + (226 - col[0]) * day, col[1] + (230 - col[1]) * day, col[2] + (238 - col[2]) * day].map(Math.round);
      // the bank's body: thick at the far quay, thin at the near rail
      // (PERF-A — the fog's CPU raster on the owner's engine: the body's gradient FILL is a cached 1-pixel-wide strip stretched across, and
      //  the two drifting wisp layers are laid into ONE strip at CSS resolution (the 512 × 64 tile is softer than that) drawn once — the same
      //  stops, the same blend: source-over / lighter twice into the strip then once onto the city = the same picture)
      const dpr = Math.abs(c.getTransform().d) || 1, hp = Math.max(2, Math.ceil(H * dpr));
      const gk = `${mixC}|${Math.round(k * 20)}|${hp}`;
      if (gk !== gradKey) {
        gradKey = gk;
        if (!grad || grad.height !== hp) { if (grad) grad.width = 0; grad = mk(1, hp); }
        const gx = safeCtx(grad), g = gx.createLinearGradient(0, 0, 0, hp);
        g.addColorStop(0, `rgba(${mixC},0)`); g.addColorStop(0.22, `rgba(${mixC},${(0.62 * k).toFixed(3)})`); g.addColorStop(0.5, `rgba(${mixC},${(0.42 * k).toFixed(3)})`); g.addColorStop(1, `rgba(${mixC},${(0.06 * k).toFixed(3)})`);
        gx.clearRect(0, 0, 1, hp); gx.fillStyle = g; gx.fillRect(0, 0, 1, hp);
      }
      c.save();
      c.drawImage(grad, 0, 0, 1, hp, 0, top, s.W, H);
      // the wisps: the tile at two depths, drifting with the wind (the far one slower)
      // (SHELL 2.0 B1: the wisps' drift = the wind's INTEGRAL — core/harbor-phase.js; a new wind never flings them)
      const v = (s.wind == null ? 2 : s.wind) * 2.2, dist = s.motion ? ph.at(s.t, v) : 0, op = day > 0.5 ? 'source-over' : 'lighter';
      const ww = Math.ceil(s.W), wh = Math.ceil(H) + 2;
      if (!wisp || wisp.width !== ww || wisp.height !== wh) { if (wisp) wisp.width = 0; wisp = mk(ww, wh); }
      const wx = safeCtx(wisp);
      wx.setTransform(1, 0, 0, 1, 0, 0); wx.globalAlpha = 1; wx.globalCompositeOperation = 'source-over'; wx.clearRect(0, 0, ww, wh); wx.globalCompositeOperation = op;
      for (const [sp, y, hh, a] of [[0.45, top + H * 0.08, H * 0.42, 0.7], [1, top + H * 0.3, H * 0.5, 0.5]]) {
        const off = (((dist * sp) % 512) + 512) % 512, sc = hh / 64, tw = 512 * sc;
        wx.globalAlpha = a * k * (day > 0.5 ? 0.9 : 0.55);
        for (let x0 = -off * sc; x0 < s.W; x0 += tw) wx.drawImage(tile, x0, y - top, tw, hh);
      }
      c.globalCompositeOperation = op; c.globalAlpha = 1;
      c.drawImage(wisp, 0, top, ww, wh);
      if (day <= 0.5) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.25 * k; c.fillStyle = `rgb(${mixC})`; c.fillRect(0, top + H * 0.15, s.W, H * 0.5); }
      c.restore();
    },
    destroy() { if (tile) tile.width = 0; if (grad) grad.width = 0; if (wisp) wisp.width = 0; tile = grad = wisp = null; },
  };
}
