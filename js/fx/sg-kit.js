// THE SIGHTING CARDS' KIT (THE VAULT 1C) — what the eight new legendary scenes share (the UFO's card, js/fx/ufo.js, came first: its pattern,
// generalised): a LAZY city module (each card draws the city's OWN model / painter — never a second version — loaded on its first frame,
// the backdrop standing alone until it's in), images by URL (the hero bakes in assets/vault/sg/), a NIGHT (or day) backdrop baked once per
// size (a sky gradient, a glow, stars, the harbor skyline with lit windows, the water), the strip / full-card layout numbers.
// Every scene: a pure function of t + its seed (the same frame on every phone; the still frame for free), particles scaled by Q.q.
import { sprite, rng } from './kit.js';

/** a city module, imported on first use: city('legends') → the module or null (still loading / failed) */
const mods = new Map();
export function city(name, load) {
  let m = mods.get(name);
  if (!m) { m = { v: null }; mods.set(name, m); load().then(v => { m.v = v; }).catch(() => { /* the backdrop stands alone */ }); }
  return m.v;
}
/** an image (decoded) by URL, or null until it's in */
const imgs = new Map();
export function image(url) {
  let m = imgs.get(url);
  if (!m) {
    m = { v: null }; imgs.set(url, m);
    const i = new Image(); i.decoding = 'async';
    i.onload = () => { (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => { m.v = i; }); };
    i.src = url;
  }
  return m.v;
}
/** a JSON file by URL, or null until it's in */
const jsons = new Map();
export function json(url) {
  let m = jsons.get(url);
  if (!m) { m = { v: null }; jsons.set(url, m); fetch(url).then(r => (r.ok ? r.json() : null)).then(v => { m.v = v; }).catch(() => {}); }
  return m.v;
}
export const SG_ASSETS = new URL('../../assets/vault/sg/', import.meta.url).href;

/** the phone's pixel ratio for a bake (quarter steps, ≤ 3) */
export const bakeDpr = Q => Math.min(3, Math.max(1, Math.round(Q.dpr * 4) / 4));

/**
 * THE BACKDROP — baked once per size: o = {
 *   sky: [[u, css colour]…] top → bottom · glow: [{ x, y (0..1), r (of w), rgb, a }] · stars: n per 100 pt of width (0 = none), starRgb
 *   skyline: { y (0..1, the near row's roofline), tall (0..1 of h), dark: [far, near] colours, win: [[rgb, share]…], p (a window's chance), rim? }
 *   water: { y (0..1), top, bottom (colours), shine (rgb) } }
 * key = the scene's id (+ 'full' / 'lit' / 'dark' …)
 */
export function backdrop(key, w, h, dpr, o) {
  return sprite(`sg-bd:${key}:${w}x${h}@${dpr}`, w * dpr, h * dpr, (c) => {
    c.scale(dpr, dpr);
    const g = c.createLinearGradient(0, 0, 0, h);
    for (const [u, col] of o.sky) g.addColorStop(u, col);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (const gl of o.glow || []) {
      const R = gl.r * w, x = gl.x * w, y = gl.y * h, rg = c.createRadialGradient(x, y, 0, x, y, R);
      rg.addColorStop(0, `rgba(${gl.rgb},${gl.a})`); rg.addColorStop(0.45, `rgba(${gl.rgb},${gl.a * 0.35})`); rg.addColorStop(1, `rgba(${gl.rgb},0)`);
      c.save(); if (gl.sy) { c.translate(x, y); c.scale(1, gl.sy); c.translate(-x, -y); }
      c.fillStyle = rg; c.fillRect(x - R, y - R, R * 2, R * 2); c.restore();
    }
    const r = rng(o.seed || 1947);
    // CLOUDS (o.clouds: [{ y0, y1 (0..1), rgb, a, n, sx (stretch) }]): long soft banks — stretched blobs, a lit top edge (moonlight / dusk)
    for (const cl of o.clouds || []) {
      const cr = rng(cl.seed || 5);
      for (let i = 0; i < cl.n; i++) {
        const x = cr() * w * 1.2 - w * 0.1, y = (cl.y0 + (cl.y1 - cl.y0) * cr()) * h, rx = w * (0.08 + cr() * 0.16), ry = rx / (cl.sx || 5);
        const g2 = c.createRadialGradient(x, y, 0, x, y, rx);
        g2.addColorStop(0, `rgba(${cl.rgb},${cl.a * (0.5 + 0.5 * cr())})`); g2.addColorStop(0.6, `rgba(${cl.rgb},${cl.a * 0.3})`); g2.addColorStop(1, `rgba(${cl.rgb},0)`);
        c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = g2; c.fillRect(x - rx, y - rx, rx * 2, rx * 2); c.restore();
      }
    }
    const ns = Math.round((o.stars || 0) * w / 100);
    for (let i = 0; i < ns; i++) {
      const x = r() * w, y = Math.pow(r(), 1.3) * h * (o.starTo || 0.7), a = 0.2 + r() * 0.7, s = r() < 0.1 ? 1.4 : r() < 0.4 ? 0.9 : 0.6;
      c.fillStyle = `rgba(${o.starRgb || '235,240,255'},${a})`; c.fillRect(x, y, s, s);
    }
    if (o.water) {
      const wy = o.water.y * h, wg = c.createLinearGradient(0, wy, 0, h);
      wg.addColorStop(0, o.water.top); wg.addColorStop(1, o.water.bottom);
      c.fillStyle = wg; c.fillRect(0, wy, w, h - wy);
      if (o.water.shine) { c.fillStyle = `rgba(${o.water.shine},0.16)`; c.fillRect(0, wy, w, 1); }
    }
    if (o.skyline) skyline(c, w, h, r, o.skyline, o.water ? o.water.y * h : h);
  });
}
/** the harbor skyline: two rows of towers (a far, paler row + the near row), their windows lit by share; foot = where it stands.
 *  S.mode: 'all' (default) · 'shape' (the towers, no windows) · 'win' (the windows alone, on nothing) — the same seed draws the same city */
export function skyline(c, w, h, r, S, foot) {
  const drawShape = S.mode !== 'win', drawWin = S.mode !== 'shape';
  const rows = [{ y: S.y - (S.gap || 0.07), dark: S.dark[0], n: 1, k: 0.7 }, { y: S.y, dark: S.dark[1], n: 0, k: 1 }];
  const tall = (S.tall || 0.12) * h, unit = S.unit || 1;
  for (const row of rows) {
    let x = -4;
    while (x < w + 4) {
      const bw = (9 + r() * 18) * unit, top = row.y * h - r() * tall * (row.n + 1);
      c.fillStyle = row.dark; if (drawShape) c.fillRect(x, top, bw, foot - top);
      if (r() < 0.25 && drawShape) { c.fillRect(x + bw * 0.3, top - tall * 0.25, bw * 0.4, tall * 0.25); }          // (a stepped crown now and then)
      if (S.rim && drawShape) { c.fillStyle = S.rim; c.fillRect(x, top, bw, 0.8); }
      const ws = 3.3 * unit, wsy = 3.5 * unit;
      for (let wy = top + 3; wy < foot - 2; wy += wsy) for (let wx = x + 2; wx < x + bw - 2; wx += ws) {
        if (r() < (S.p || 0.16) * row.k) {
          let k = r(), col = S.win[S.win.length - 1][0];
          for (const [rgb, share] of S.win) { if (k < share) { col = rgb; break; } k -= share; }
          const al = 0.6 + 0.35 * r();
          if (drawWin) { c.fillStyle = `rgba(${col},${al})`; c.fillRect(wx, wy, 1.1 * unit, 1.2 * unit); }
        }
      }
      x += bw + (r() < 0.3 ? 1 : 0);
    }
  }
}
/** a skyline layer alone (transparent elsewhere): mode 'shape' | 'win' | 'all' — the same seed as its backdrop's */
export function skylineLayer(key, w, h, dpr, S, foot, seed, mode) {
  return sprite(`sg-sk:${key}:${mode}:${w}x${h}@${dpr}`, w * dpr, h * dpr, (c) => { c.scale(dpr, dpr); skyline(c, w, h, rng(seed), { ...S, mode }, foot); });
}
/** the layout: the subject's box on a strip (right of the name plate, clear of the tier tag) or on a full card (centred high) */
export function stage(s) {
  const { w, h } = s, full = !!(s.opts && s.opts.full);
  return full ? { full, w, h, cx: w * 0.5, cy: h * 0.27, u: h * 0.46, span: w * 0.62 } : { full, w, h, cx: w * 0.7, cy: h * 0.42, u: h, span: w * 0.42 };
}
/** a stepped flicker 0..1 (a light failing): mostly on, dropping out in bursts — seeded per i */
export function failing(t, i, rate = 9) {
  const step = Math.floor(t * rate), a = (Math.sin(step * 12.9898 + i * 78.233) * 43758.5453) % 1;
  return Math.abs(a) < 0.35 ? 0.15 + Math.abs(a) : 1;
}
