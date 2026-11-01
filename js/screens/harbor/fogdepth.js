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
import { tierVal } from '../../core/harbor-tiers.js';
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
  const grads = new Map();             // `${which}|${device rows}|${alphas}|${cols}` → a 1-px-wide strip canvas of the veil's gradient (a frame keeps ~5)
  const halos = new Map();             // colour key → a soft halo sprite
  let tile = null, drawn = { veils: 0, halos: 0, banks: 0, wisps: 0 };
  // PERF-B — THE CLEAN GLASS (the owner, Nov 1: "the haze over the lit windows reads as SMUDGES", dense fog + the blizzard): the speakeasy's
  // windows are the near stage — the stage veil, the promenade's bank, the lamps' lift + the window halos are drawn AROUND the glass (an
  // even-odd clip; the glow hangs round each window, never over it), and the only fog over the glass is a WISP the wind carries across
  // in a few seconds (wisps()). glassK: how clean (the windows' light — by day the glass takes the veil like the bricks)
  let glass = null, glassK = 0, wisp = null, mul = 1;
  function holed(c, fn) {
    if (!glass || !glass.length || glassK <= 0.01) { mul = 1; fn(); return; }
    c.save(); c.beginPath(); c.rect(-20, -20, W + 40, 1e5); for (const r of glass) c.rect(r.x, r.y, r.w, r.h); c.clip('evenodd'); mul = 1; fn(); c.restore();
    if (glassK < 0.99) { c.save(); c.beginPath(); for (const r of glass) c.rect(r.x, r.y, r.w, r.h); c.clip(); mul = 1 - glassK; fn(); c.restore(); }
    mul = 1;
  }
  // the wisp: a long soft streak (blobs along a line, tapered), white — tinted per fog colour like the bank
  function wispArt(col) {
    const tk = col.join(',');
    if (wisp && wisp.key === tk) return wisp.cv;
    if (!wisp) {
      const base = mk(160, 40), x = safeCtx(base);
      let sd = 7; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (let i = 0; i < 14; i++) {
        const u = (i + 0.5) / 14, cx = 14 + u * 132, cy = 20 + (r() - 0.5) * 8, rw = 16 + r() * 18, a = (0.22 + r() * 0.18) * Math.sin(Math.PI * u);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rw); g.addColorStop(0, `rgba(255,255,255,${a.toFixed(3)})`); g.addColorStop(0.55, `rgba(255,255,255,${(a * 0.4).toFixed(3)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.save(); x.translate(cx, cy); x.scale(1, 0.42); x.translate(-cx, -cy); x.fillStyle = g; x.fillRect(cx - rw, cy - rw, rw * 2, rw * 2); x.restore();
      }
      wisp = { base, cv: mk(160, 40), key: '' };
    }
    const x = safeCtx(wisp.cv);
    x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, 160, 40); x.drawImage(wisp.base, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = `rgb(${tk})`; x.fillRect(0, 0, 160, 40);
    wisp.key = tk;
    return wisp.cv;
  }
  const strips = new Map();             // (PERF-A) a bank's two layers, composited at CSS resolution: which → canvas
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
      g.addColorStop(0, rgba(col, 0.9)); g.addColorStop(0.25, rgba(col, 0.42)); g.addColorStop(0.6, rgba(col, 0.12));
      // (PART 10 — the rim eased out (0.12 · (1 − s)²): a straight fall to 0 left a crease at the edge, read as a line on the bright fog)
      for (const s of [0.25, 0.5, 0.75]) g.addColorStop(0.6 + 0.4 * s, rgba(col, 0.12 * (1 - s) * (1 - s)));
      g.addColorStop(1, rgba(col, 0));
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
      drawn = { veils: 0, halos: 0, banks: 0, wisps: 0 };
      return look;
    },
    on: () => look.k > 0.01,
    look: () => look,
    /** a depth's veil: the fog colour over everything behind, its alpha from the top (y0) to the bottom (y1) — the bottom thicker */
    veil(c, which, y0, y1) {
      if (look.k <= 0.01 || !(y1 > y0)) return;
      const [a0, a1] = veilOf(which, look);
      if (a1 < 0.004) return;
      // (PERF-A — the veils were 5 gradient FILLS a frame (~6 ms of the fog's CPU raster in WebKit, the owner's engine): each is now a
      //  cached 1-pixel-wide strip of the same gradient at the screen's device rows, stretched across — an image draw, the same stops)
      const dpr = Math.abs(c.getTransform().d) || 1, hp = Math.max(2, Math.ceil((y1 - y0) * dpr));
      const key = `${which}|${hp}|${Math.round(a0 * 200)}|${Math.round(a1 * 200)}|${cols[0]}|${cols[1]}|${y0 > 2 ? 1 : 0}`;
      let st = grads.get(key);
      if (!st) {
        st = mk(1, hp); const x = safeCtx(st), g = x.createLinearGradient(0, 0, 0, hp);
        // (ATM-D — NO SEAMS: a veil that starts below the top of the screen FADES IN over its first ~50 pt — its top was a hard horizontal
        // line across the sky (the mid + the harbor veils at full strength from their first row), cutting the beams + the halos in two)
        const fi = y0 > 2 ? Math.min(0.45, 50 / (y1 - y0)) : 0;
        if (fi > 0) { g.addColorStop(0, rgba(cols[0], 0)); g.addColorStop(fi, rgba(cols[0], a0)); } else g.addColorStop(0, rgba(cols[0], a0));
        g.addColorStop(Math.max(fi + 0.01, 0.7), rgba(mixC(cols[0], cols[1], 0.6), lerp(a0, a1, 0.8))); g.addColorStop(1, rgba(cols[1], a1));
        x.fillStyle = g; x.fillRect(0, 0, 1, hp);
        if (grads.size > 12) { for (const cv of grads.values()) cv.width = 0; grads.clear(); }
        grads.set(key, st);
      }
      const put = () => { c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = mul; c.drawImage(st, 0, 0, 1, hp, 0, y0, W, y1 - y0); c.restore(); };
      if (which === 'stage') holed(c, put); else put();
      drawn.veils++;
    },
    /** THE LIGHTS IN FOG: each a soft halo hanging in the air (list: [{ x, y, w, h, col, k }]); the denser the fog, the wider + stronger;
     *  by day only a faint bloom. max: the tier table's count */
    halos(c, list, max = 24, cap = 64, round = false) {
      if (look.k <= 0.01 || !list || !list.length) return;
      if (round) { holed(c, () => this.halos(c, list, max, cap, false)); return; }
      const D = lerp(0.45, 1, look.m), base = look.k * (0.22 + 0.4 * D) * lerp(1, 0.28, day);
      if (base < 0.01) return;
      c.save(); c.globalCompositeOperation = 'lighter';
      let n = 0; const m0 = mul;
      for (const l of list) {
        if (n >= max) break;
        if (!(l.k > 0.02)) continue;
        // (the radius CAPPED: an additive sprite's cost is its area — the 4×-CPU A/B found the uncapped halos (the logo's ~1100 pt) the fog's
        // biggest cost; l.cap: the NEON logo's own)
        const r = Math.min(l.cap || cap, Math.max(l.w, l.h) * 0.5 * (1.2 + 1.3 * D) + 4 + 6 * D), a = Math.min(1, base * l.k);
        if (a < 0.01) continue;
        c.globalAlpha = a * m0;
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
      // (PERF-A: a cached 1-pixel-wide strip, stretched — not a new gradient filled every frame)
      const dpr = Math.abs(c.getTransform().d) || 1, hp = Math.max(2, Math.ceil((y1 - y0) * dpr)), key = `glow|${hp}|${Math.round(a * 400)}`;
      let st = grads.get(key);
      if (!st) {
        st = mk(1, hp); const x = safeCtx(st), g = x.createLinearGradient(0, 0, 0, hp);
        g.addColorStop(0, 'rgba(255,196,140,0)'); g.addColorStop(1, `rgba(255,196,140,${a.toFixed(3)})`);
        x.fillStyle = g; x.fillRect(0, 0, 1, hp);
        if (grads.size > 12) { for (const cv of grads.values()) cv.width = 0; grads.clear(); }
        grads.set(key, st);
      }
      holed(c, () => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = mul; c.drawImage(st, 0, 0, 1, hp, 0, y0, W, y1 - y0); c.restore(); });
    },
    /** A BANK drifting across a band (the road, the promenade) on the shared wind: the baked patchy tile at two depths, the near one
     *  faster; thicker at the band's top (the far side) — people walking through it fade in + out. dense: the strength, × the look */
    bank(c, which, y0, y1) {
      if (look.k <= 0.01 || !(y1 > y0) || (!tierVal('fogPromBank', tier) && which !== 'road')) return;
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
      // (PERF-A — the owner's iPhone fog frame painted 12.3 MP: the two drifting layers are laid into ONE small strip at CSS resolution —
      //  the 512 × 96 tile is softer than that already — and the strip drawn once at the screen's dpr: half the bank's painted pixels;
      //  source-over twice into the strip then once onto the city = the same picture as twice onto the city)
      const top = y0 - h * 0.25, sh = Math.ceil(h * 1.4) + 2, sw = Math.ceil(W);
      let st = strips.get(which);
      if (!st || st.width !== sw || st.height !== sh) { if (st) st.width = 0; st = mk(sw, sh); strips.set(which, st); }
      const x = safeCtx(st);
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, sw, sh);
      for (const [sp, yy, hh, a] of [[0.55, y0 - h * 0.25, h * 0.85, 1], [1, y0 + h * 0.2, h * 0.95, 0.75]]) {
        const sc = hh / 96, tw = 512 * sc * 1.6, off = (((motion ? t : 0) * v * sp) % tw + tw) % tw;
        x.globalAlpha = Math.min(1, amp * a * 1.6);
        for (let x0 = off - tw; x0 < W; x0 += tw) x.drawImage(src, x0, yy - top, tw, hh);
      }
      const put = () => { c.globalAlpha = mul; c.drawImage(st, 0, top, sw, sh); };
      if (which === 'prom') holed(c, put); else put();
      c.restore();
      drawn.banks++;
    },
    /** PERF-B — this frame's clean glass: rects (the speakeasy's windows, CSS px) + k (0 = fogged like the bricks … 1 = clean) */
    glass(rects, k) { glass = rects && rects.length ? rects : null; glassK = clamp01(k || 0); },
    /** PERF-B — THE WISPS over the glass: long soft streaks carried across the facade on the wind (WF: the signed m/s at the facade),
     *  one row of windows at a time, each crossing a window in a few seconds — the only fog the clean glass ever shows */
    wisps(c, windV) {
      if (!glass || !glass.length || glassK <= 0.01 || look.k <= 0.01 || !motion) return;
      const a = look.k * lerp(0.35, 0.7, look.m) * (1 + 0.4 * (look.x || 0)) * glassK;
      if (a < 0.02) return;
      // the rows of windows (by their middle), the facade's span
      let x0 = 1e9, x1 = -1e9; const rows = [];
      for (const r of glass) { x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x + r.w); const cy = r.y + r.h / 2; let row = rows.find(q => Math.abs(q.cy - cy) < r.h * 0.5); if (!row) rows.push(row = { cy, h: r.h }); }
      const v = windV == null ? 2 : windV, sp = Math.max(14, Math.abs(v) * 5) * (v < 0 ? -1 : 1), art = wispArt(mixC(cols[0], cols[1], 0.55));
      c.save(); c.globalCompositeOperation = 'source-over';
      rows.forEach((row, i) => {
        const L = Math.max(60, row.h * 3.2), Hh = row.h * 0.9, span = x1 - x0 + L, cross = span / Math.abs(sp);
        // (two tracks a row on their own periods: a wisp every ~6–11 s, never a rhythm you can count)
        for (const [per, ph, dy] of [[cross + 6.3 + 2.1 * i, 0.37 * i, -0.18], [cross + 9.7 + 1.3 * i, 3.9 + 0.71 * i, 0.22]]) {
          const u = ((t + ph * per) % per) / per * (per / cross);
          if (u > 1) continue;
          const lx = sp > 0 ? x0 - L + u * span : x1 - u * span;
          c.globalAlpha = Math.min(1, a);
          c.drawImage(art, lx, row.cy + dy * row.h - Hh / 2, L, Hh);
          drawn.wisps++;
        }
      });
      c.restore();
    },
    debug: () => ({ k: +look.k.toFixed(2), m: +look.m.toFixed(2), dense: look.dense, mode: look.k <= 0.01 ? 'none' : look.x > 0.5 ? 'whiteout' : snowK > 0.3 ? 'snow' : look.m > 0.5 ? 'dense' : 'mist', x: +(look.x || 0).toFixed(2), col: cols, ...drawn, sprites: halos.size }),
    destroy() { for (const st of strips.values()) st.width = 0; strips.clear(); for (const h of halos.values()) h.width = 0; halos.clear(); if (wisp) { wisp.base.width = 0; wisp.cv.width = 0; wisp = null; } glass = null; if (tile) { if (tile.tinted && tile.tinted.cv) tile.tinted.cv.width = 0; tile.width = 0; } tile = null; for (const cv of grads.values()) cv.width = 0; grads.clear(); },
  };
}
