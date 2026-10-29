// LIVE WEATHER — a deep freeze (core/sky.js#look → freeze 0..1: the real temperature from −4 °C / 25 °F, full by −12 °C / 10 °F).
//   pane(c, s)              over everything: frost creeping in from the edges of the screen like a frozen window — feathery
//                           dendrites grown from the corners and edges, thick at the rim and gone well before the sign and the
//                           buttons; it forms slowly when the cold arrives (baked once per screen size)
//   decorate(x, L, li, k)   baked into a skyline row (scene.js#compose, so it costs nothing per frame): icicles under the
//                           roof lines of the nearer rows, glinting; rime along the roofs (with the snow / frost line there)
// Preview: &wx=freeze.

const TAU = Math.PI * 2;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// opts.bold (9e — City 2.0): the owner's iPhone saw NO frost on a −14 °C night — the hairline ferns + the faint haze vanish against the lit
// harbor at phone size. Bold = the haze ×1.7, the ferns ~2× wider + ~1.4× longer, more of them along the edges (still gone before the
// sign, the hush word + the dock's labels — the same middle mask + holes).
export function createFrost(opts = {}) {
  const BOLD = !!opts.bold, HZ = BOLD ? 1.7 : 1, LW = BOLD ? 2.1 : 1, LN = BOLD ? 1.4 : 1;
  let W = 1, H = 1, cv = null, key = '', grown = 0, wasCold = false, lastA = 0, lastOp = '';

  // ---------------------------------------------------------------- the frozen pane
  let clearRects = null;   // (9c — City 2.0: [{ x, y, w, h, f (feather pt) }] kept clear: the sign, the hush word, the dock's labels, the corner buttons)
  function bake() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv) cv.width = 0;
    cv = mk(W * dpr, H * dpr);
    const x = cv.getContext('2d');
    x.scale(dpr, dpr);
    const R = rng(271828);
    x.lineCap = 'round';
    // 1. the ice crust: a frosted haze thickest at the corners and along the bottom, grained like real rime
    for (const [cx, cy, rr] of [[0, 0, 0.5], [W, 0, 0.5], [0, H, 0.62], [W, H, 0.62]]) {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * rr);
      g.addColorStop(0, `rgba(226,240,255,${Math.min(0.8, 0.42 * HZ)})`); g.addColorStop(0.45, `rgba(214,232,255,${0.16 * HZ})`); g.addColorStop(1, 'rgba(214,232,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    }
    for (let i = 0; i < 2600; i++) {
      // grains, crowded toward the edges
      const e = R(), u = R(), d = Math.pow(R(), 2.2) * Math.min(W, H) * 0.42;
      const px = e < 0.25 ? d : e < 0.5 ? W - d : u * W, py = e < 0.5 ? u * H : e < 0.75 ? d : H - d;
      x.fillStyle = `rgba(240,248,255,${0.18 + R() * 0.4})`; x.fillRect(px, py, (0.6 + R() * 0.9) * (BOLD ? 1.5 : 1), (0.6 + R() * 0.9) * (BOLD ? 1.5 : 1));
    }
    // 2. the feathers: fern-like dendrites — a main stem, short twigs off both sides at ±60° (shorter toward the tip),
    //    the twigs feathered again; grown inward from seeds crowded into the corners and along the edges
    const segs = [];
    const fern = (px, py, ang, len, w, depth) => {
      const steps = Math.max(3, Math.round(len / 3.2));
      let cx = px, cy = py, dir = ang;
      for (let i = 0; i < steps; i++) {
        dir += (R() - 0.5) * 0.12;
        const st = len / steps, nx = cx + Math.cos(dir) * st, ny = cy + Math.sin(dir) * st;
        const fade = 1 - i / steps;
        segs.push({ x0: cx, y0: cy, x1: nx, y1: ny, w: w * (0.45 + 0.55 * fade), a: 0.5 + 0.5 * fade });
        if (depth < 2 && i > 0) {
          const tl = len * (depth ? 0.28 : 0.36) * fade * (0.7 + R() * 0.5);
          if (tl > 2) { fern(nx, ny, dir + Math.PI / 3, tl, w * 0.6, depth + 1); fern(nx, ny, dir - Math.PI / 3, tl * (0.8 + R() * 0.3), w * 0.6, depth + 1); }
        }
        cx = nx; cy = ny;
      }
    };
    const inward = (sx, sy) => Math.atan2(H * 0.45 - sy, W * 0.5 - sx) + (R() - 0.5) * 1.1;
    const seed = (sx, sy, len, w) => fern(sx, sy, inward(sx, sy), len, w, 0);
    for (const [cx, cy, n] of [[0, 0, 7], [W, 0, 7], [0, H, 9], [W, H, 9]]) for (let i = 0; i < n; i++) seed(cx + (R() - 0.5) * W * 0.3, cy + (R() - 0.5) * H * 0.12, (26 + R() * 62) * LN, 1.2 * LW);
    for (let i = 0; i < (BOLD ? 34 : 22); i++) {
      const e = Math.floor(R() * 4), u = R();
      seed(e === 1 ? W : e === 3 ? 0 : u * W, e === 0 ? 0 : e === 2 ? H : u * H, (12 + R() * 30) * LN, 0.9 * LW);
    }
    // a soft glow under the crystals, then the crystals themselves: bright, fine, pale blue-white
    x.save(); x.shadowColor = 'rgba(200,225,255,0.8)'; x.shadowBlur = 5;
    for (const g of segs) { x.strokeStyle = `rgba(225,240,255,${0.16 * g.a * (BOLD ? 1.6 : 1)})`; x.lineWidth = g.w * 2.6; x.beginPath(); x.moveTo(g.x0, g.y0); x.lineTo(g.x1, g.y1); x.stroke(); }
    x.restore();
    for (const g of segs) { x.strokeStyle = `rgba(246,251,255,${Math.min(1, 0.85 * g.a * (BOLD ? 1.15 : 1))})`; x.lineWidth = Math.max(BOLD ? 0.8 : 0.4, g.w * 0.75); x.beginPath(); x.moveTo(g.x0, g.y0); x.lineTo(g.x1, g.y1); x.stroke(); }
    // keep the middle clear: the sign, the tagline and the buttons always read
    x.globalCompositeOperation = 'destination-in';
    const m = x.createRadialGradient(W * 0.5, H * 0.46, Math.min(W, H) * 0.3, W * 0.5, H * 0.46, Math.hypot(W, H) * 0.56);
    m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.55, 'rgba(0,0,0,0.35)'); m.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = m; x.fillRect(0, 0, W, H);
    // (9c: City 2.0's rects cut out with a soft feather — only the finest edge of the lace reaches a button)
    if (clearRects && clearRects.length) {
      x.globalCompositeOperation = 'destination-out';
      // (a feathered hole, no hard corner: rounded rects growing outward, each erasing a little — the frost thins to nothing over f pt)
      const rr = (x0, y0, w, h, r) => { x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); x.fill(); };
      for (const r of clearRects) {
        const f = r.f || 18, N = 12;
        x.fillStyle = 'rgba(0,0,0,0.22)';
        for (let i = 0; i < N; i++) { const e = f * (1 - i / N); rr(r.x - e, r.y - e, r.w + 2 * e, r.h + 2 * e, Math.min(f, (r.h + 2 * e) / 2)); }
        x.fillStyle = 'rgba(0,0,0,1)'; rr(r.x, r.y, r.w, r.h, Math.min(8, r.h / 2));
      }
    }
    x.globalCompositeOperation = 'source-over';
  }

  return {
    resize(w, h) { W = w; H = h; key = ''; },
    /** 9c (City 2.0): the rects the pane keeps clear (re-bakes when they move a few pt) */
    setClear(rects) { const k2 = (rects || []).map(r => `${Math.round(r.x / 6)},${Math.round(r.y / 6)},${Math.round(r.w / 6)},${Math.round(r.h / 6)}`).join(';'); if (k2 !== (clearRects && clearRects.key)) { clearRects = rects || null; if (clearRects) clearRects.key = k2; key = ''; } },
    pane(c, s) {
      const k = s.L.freeze || (s.force.has('freeze') ? 1 : 0);
      // (C4d — FR4 H18: the whole-screen pane (5.3 MB at 2×) was kept for the rest of the visit once a frost had formed — freed with the thaw)
      if (k <= 0.01) { grown = 0; wasCold = false; if (cv) { cv.width = cv.height = 0; cv = null; key = ''; } return; }
      // (9e: s.joined — a city OPENED on a frozen night already has its frost; it creeps in slowly only when the cold arrives while you look)
      if (!wasCold) { wasCold = true; grown = s.joined ? 1 : 0; }
      // it forms slowly: a few seconds to creep in from the edges
      grown = Math.min(1, grown + s.dt / (s.motion ? 9000 : 1));
      const kk = `${W}|${H}`;
      if (kk !== key) { bake(); key = kk; }
      const night = s.L.w.night + s.L.w.late;
      c.globalAlpha = lastA = k * (0.55 + 0.35 * night) * grown * grown * (3 - 2 * grown);
      const op0 = c.globalCompositeOperation; c.globalCompositeOperation = 'source-over'; lastOp = op0;
      c.drawImage(cv, 0, 0, W, H);
      c.globalCompositeOperation = op0;
      c.globalAlpha = 1;
    },
    /** baked into a skyline row: icicles under the nearer rows' roof lines (x: the row's canvas context, css-px transform) */
    decorate(x, rects, li, k, P) {
      if (k <= 0.02 || li < 2) return;
      const R = rng(li * 991 + 7);
      const glint = P && P.dark > 0.5 ? `rgba(${Math.round(P.glow[0])},${Math.round(P.glow[1])},${Math.round(P.glow[2])},0.55)` : 'rgba(255,255,255,0.8)';
      for (const r of rects) {
        if (r.w < 14 || R() > 0.75) continue;
        const n = Math.floor(r.w / (li === 3 ? 3.4 : 4.2));
        for (let i = 0; i < n; i++) {
          if (R() < 0.35) continue;
          const ix = r.x + 1.5 + (i + R() * 0.6) * (r.w - 3) / n;
          const len = (1.5 + R() * R() * (li === 3 ? 8 : 5)) * (0.5 + 0.5 * k), w = 0.7 + R() * (li === 3 ? 0.9 : 0.6);
          const g = x.createLinearGradient(0, r.y, 0, r.y + len);
          g.addColorStop(0, `rgba(235,246,255,${0.9 * k})`); g.addColorStop(1, 'rgba(210,232,255,0)');
          x.fillStyle = g;
          x.beginPath(); x.moveTo(ix - w, r.y + 0.6); x.lineTo(ix + w, r.y + 0.6); x.lineTo(ix + (R() - 0.5) * 0.4, r.y + len); x.closePath(); x.fill();
          if (len > 4 && R() < 0.3) { x.fillStyle = glint; x.fillRect(ix - 0.3, r.y + len * 0.55, 0.6, 0.9); }
        }
      }
    },
    debug: () => ({ grown, clear: clearRects ? clearRects.length : 0, rects: clearRects ? clearRects.map(r => [r.x, r.y, r.w, r.h, r.f].map(Math.round)) : [], alpha: +lastA.toFixed(3), op: lastOp, size: [W, H] }),
    destroy() { if (cv) cv.width = 0; },
  };
}
