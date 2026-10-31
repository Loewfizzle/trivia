// CITY 2.0 — ATM-B: FOG AS DEPTH (the owner, Oct 26 after 9a: "fog doesn't really do anything"; decisions.md §10 FOG). Real fog is DEPTH:
// the FAR skyline GONE, the MIDDLE rows ghostly silhouettes, only the NEAR STAGE clear; every light a soft HALO with its glow HANGING in the
// air (the signs' neon blooming, the speakeasy's windows smeared warm, the implied lamps' light lifting the murk over the promenade); fog
// drifting in BANKS across the road + the promenade on the SHARED WIND (thicker + thinner, moving — people fade in + out of it); colours
// muted. MIST (fog ~0.25–0.55: the far rows softened, a haze, wider halos) and DENSE FOG (≥ 0.6: the whiteout with depth) are clearly
// different. Driven by the live visibility (core/weather.js#fogOf — only a real low visibility; a live "none" never beats a real answer) or
// &force=fog / mist (+ their panel rows). The lighthouse's broad cone, its glow + the foghorn, the beams' softening and the beacons' red
// breathing halos are their own modules (lighthouse.js, fogbeam.js, lights.js#drawBeacons, sounds.js) — they read the same LK.fog.
// THE COST: three veils (one gradient fill each, cached by colour + band), ≤ ~24 halo sprites (cached per colour), two bank strips (one
// baked tile drawn ~2× per strip) — the tier table's `fogHalos` + `fogBanks` step them down on weak phones.
import { safeCtx } from '../../ui/canvas-safe.js';
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const k = clamp01((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const mixC = (a, b, k) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k));
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

/** PURE: the fog's look from the weather's fog level (0..1) → { k (0..1 shown), m (0 mist … 1 dense), dense } */
export function fogLook(fog) {
  const f = clamp01(fog || 0);
  return { k: smooth(0.15, 0.32, f), m: smooth(0.5, 0.72, f), dense: f >= 0.6 };
}
/** PURE: each depth's veil [top alpha, bottom alpha] for a look — far gone, middle ghostly, the harbor softened, the stage clear */
export function veilOf(which, look) {
  const { k, m } = look, x = look.x || 0;
  const V = { far: [[0.36, 0.6], [0.86, 0.97]], mid: [[0.15, 0.34], [0.52, 0.76]], harbor: [[0.06, 0.2], [0.24, 0.48]], road: [[0.02, 0.1], [0.18, 0.34]], stage: [[0, 0.05], [0.07, 0.15]] }[which];
  if (!V) return [0, 0];
  // (ATM-B — THE BLIZZARD's whiteout: the middle rows + the harbor + the road go too, the stage only softened)
  const xb = which === 'far' ? 1 : 1 + (which === 'stage' ? 0.6 : 0.4) * x;
  return [Math.min(0.97, lerp(V[0][0], V[1][0], m) * k * xb), Math.min(0.97, lerp(V[0][1], V[1][1], m) * k * xb)];
}
/** PURE: the fog's colour [top, bottom] — pale grey-white by day (warmer near dusk), a dim violet-grey at night lit warm from below by the
 *  city (+ a magenta lean on a party night) */
export function fogColours({ day = 0, golden = 0, party = false } = {}) {
  const dTop = mixC([212, 216, 222], [226, 210, 196], clamp01(golden)), dBot = mixC([198, 202, 208], [222, 200, 182], clamp01(golden));
  const nTop = party ? [82, 58, 94] : [72, 68, 88], nBot = party ? [142, 92, 136] : [126, 108, 120];
  const d = clamp01(day);
  return [mixC(nTop, dTop, d), mixC(nBot, dBot, d)];
}

export function createFogDepth() {
  let snowK = 0, look = { k: 0, m: 0, dense: false }, cols = [[0, 0, 0], [0, 0, 0]], day = 0, night = 0, t = 0, motion = true, wind = 2, W = 1, tier = 2;
  const grads = new Map();             // `${which}|${y0}|${y1}|${alphas}|${cols}` → gradient (a frame keeps ~3)
  const halos = new Map();             // colour key → a soft halo sprite
  let tile = null, drawn = { veils: 0, halos: 0, banks: 0 };
  function bakeTile() {
    // a soft patchy bank: blobs of every size, tileable across x (the waterfog's recipe, taller + lumpier)
    tile = mk(512, 96);
    const x = safeCtx(tile);
    let s = 19; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 64; i++) {
      const cx = r() * 512, cy = 22 + r() * 52, rw = 26 + r() * 90, rh = 8 + r() * 22, a = 0.14 + r() * 0.3;
      for (const ox of [-512, 0, 512]) {
        const g = x.createRadialGradient(cx + ox, cy, 0, cx + ox, cy, rw);
        g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.6, `rgba(255,255,255,${a * 0.45})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.save(); x.translate(cx + ox, cy); x.scale(1, rh / rw); x.translate(-(cx + ox), -cy); x.fillStyle = g; x.fillRect(cx + ox - rw, cy - rw, rw * 2, rw * 2); x.restore();
      }
    }
  }
  function haloOf(col) {
    const key = col.map(v => Math.round(v / 16)).join(',');
    let h = halos.get(key);
    if (!h) {
      h = mk(64, 64); const x = safeCtx(h), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, rgba(col, 0.9)); g.addColorStop(0.25, rgba(col, 0.42)); g.addColorStop(0.6, rgba(col, 0.12)); g.addColorStop(1, rgba(col, 0));
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      if (halos.size > 24) { const first = halos.keys().next().value; const cv = halos.get(first); if (cv) cv.width = 0; halos.delete(first); }
      halos.set(key, h);
    }
    return h;
  }
  return {
    /** once a frame: s = { fog (0..1), day, golden, night, party, t, motion, wind (signed m/s on screen), W, tier } → the look */
    frame(s) {
      look = fogLook(s.fog); look.x = clamp01(s.whiteout || 0); snowK = clamp01(s.snow || 0);
      day = clamp01(s.day || 0); night = clamp01(s.night || 0); t = s.t || 0; motion = s.motion !== false; wind = s.wind == null ? 2 : s.wind; W = s.W || W; tier = s.tier == null ? 2 : s.tier;
      cols = fogColours({ day, golden: s.golden || 0, party: !!s.party });
      // (ATM-B: falling snow whitens the murk — by day a white wall, at night the city's glow on the snow, brighter than fog)
      if (snowK > 0.01) { const sc = [mixC([132, 134, 160], [236, 240, 248], day), mixC([176, 166, 184], [226, 230, 240], day)]; cols = [mixC(cols[0], sc[0], snowK), mixC(cols[1], sc[1], snowK)]; }
      drawn = { veils: 0, halos: 0, banks: 0 };
      return look;
    },
    on: () => look.k > 0.01,
    look: () => look,
    /** a depth's veil: the fog colour over everything behind, its alpha from the top (y0) to the bottom (y1) — the bottom thicker */
    veil(c, which, y0, y1) {
      if (look.k <= 0.01 || !(y1 > y0)) return;
      const [a0, a1] = veilOf(which, look);
      if (a1 < 0.004) return;
      const key = `${which}|${Math.round(y0)}|${Math.round(y1)}|${Math.round(a0 * 200)}|${Math.round(a1 * 200)}|${cols[0]}|${cols[1]}`;
      let g = grads.get(key);
      if (!g) {
        g = c.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, rgba(cols[0], a0)); g.addColorStop(0.7, rgba(mixC(cols[0], cols[1], 0.6), lerp(a0, a1, 0.8))); g.addColorStop(1, rgba(cols[1], a1));
        if (grads.size > 12) grads.clear();
        grads.set(key, g);
      }
      c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); c.restore();
      drawn.veils++;
    },
    /** THE LIGHTS IN FOG: each a soft halo hanging in the air (list: [{ x, y, w, h, col, k }]); the denser the fog, the wider + stronger;
     *  by day only a faint bloom. max: the tier table's count */
    halos(c, list, max = 24, cap = 64) {
      if (look.k <= 0.01 || !list || !list.length) return;
      const D = lerp(0.45, 1, look.m), base = look.k * (0.22 + 0.4 * D) * lerp(1, 0.28, day);
      if (base < 0.01) return;
      c.save(); c.globalCompositeOperation = 'lighter';
      let n = 0;
      for (const l of list) {
        if (n >= max) break;
        if (!(l.k > 0.02)) continue;
        // (the radius CAPPED: an additive sprite's cost is its area — the 4×-CPU A/B found the uncapped halos (the logo's ~1100 pt) the fog's
        // biggest cost; l.cap: the NEON logo's own)
        const r = Math.min(l.cap || cap, Math.max(l.w, l.h) * 0.5 * (1.2 + 1.3 * D) + 4 + 6 * D), a = Math.min(1, base * l.k);
        if (a < 0.01) continue;
        c.globalAlpha = a;
        c.drawImage(haloOf(l.col), l.x + l.w / 2 - r, l.y + l.h / 2 - r * 0.85, r * 2, r * 1.7);
        n++;
      }
      c.restore();
      drawn.halos += n;
    },
    /** the implied lamps' light hanging in the murk over the promenade at night (they stand behind the viewer — NO LAMPPOSTS): a warm lift
     *  rising from the screen's foot */
    lampGlow(c, y0, y1) {
      const a = look.k * lerp(0.05, 0.13, look.m) * night;
      if (a < 0.006 || !(y1 > y0)) return;
      const g = c.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(255,196,140,0)'); g.addColorStop(1, `rgba(255,196,140,${a.toFixed(3)})`);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); c.restore();
    },
    /** A BANK drifting across a band (the road, the promenade) on the shared wind: the baked patchy tile at two depths, the near one
     *  faster; thicker at the band's top (the far side) — people walking through it fade in + out. dense: the strength, × the look */
    bank(c, which, y0, y1) {
      if (look.k <= 0.01 || !(y1 > y0) || tier < 1 && which !== 'road') return;
      const amp = (which === 'road' ? lerp(0.16, 0.55, look.m) : lerp(0.07, 0.3, look.m)) * look.k;
      if (amp < 0.01) return;
      if (!tile) bakeTile();
      const h = y1 - y0, col = mixC(cols[0], cols[1], 0.5);
      c.save(); c.globalCompositeOperation = 'source-over';
      // the tile is white: tint it by drawing it as a mask over a colour fill on a small strip canvas once per colour
      const tk = col.join(',');
      if (!tile.tinted || tile.tinted.key !== tk) {
        const tc = tile.tinted && tile.tinted.cv ? tile.tinted.cv : mk(512, 96), x = safeCtx(tc);
        x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, 512, 96); x.drawImage(tile, 0, 0);
        x.globalCompositeOperation = 'source-in'; x.fillStyle = `rgb(${tk})`; x.fillRect(0, 0, 512, 96);
        tile.tinted = { key: tk, cv: tc };
      }
      const src = tile.tinted.cv, v = wind * 3.2;   // (pt/s: a 2.5 m/s fog air drifts ~8 pt/s — the banks visibly move, never race)
      for (const [sp, yy, hh, a] of [[0.55, y0 - h * 0.25, h * 0.85, 1], [1, y0 + h * 0.2, h * 0.95, 0.75]]) {
        const sc = hh / 96, tw = 512 * sc * 1.6, off = (((motion ? t : 0) * v * sp) % tw + tw) % tw;
        c.globalAlpha = Math.min(1, amp * a * 1.6);
        for (let x0 = off - tw; x0 < W; x0 += tw) c.drawImage(src, x0, yy, tw, hh);
      }
      c.restore();
      drawn.banks++;
    },
    debug: () => ({ k: +look.k.toFixed(2), m: +look.m.toFixed(2), dense: look.dense, mode: look.k <= 0.01 ? 'none' : look.x > 0.5 ? 'whiteout' : snowK > 0.3 ? 'snow' : look.m > 0.5 ? 'dense' : 'mist', x: +(look.x || 0).toFixed(2), col: cols, ...drawn, sprites: halos.size }),
    destroy() { for (const h of halos.values()) h.width = 0; halos.clear(); if (tile) { if (tile.tinted && tile.tinted.cv) tile.tinted.cv.width = 0; tile.width = 0; } tile = null; grads.clear(); },
  };
}
