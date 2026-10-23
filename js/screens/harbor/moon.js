// CITY 2.0 — THE HARBOR, Part 6a: THE MOON, THE SUN'S HAZE, THE AURORA — the art (the real timing, path and phase are core/sky.js's
// + the framing district/fx.js#moonPlace with the Harbor's arch: unchanged). docs/harbor.md#part-6a.
//   THE MOON    a real textured moon: the near side's maria where they really are (Imbrium, Serenitatis, Tranquillitatis,
//               Crisium, Fecunditatis, Nectaris, Nubium, Humorum, the Ocean of Storms, Frigoris), bright Tycho with its rays,
//               Copernicus, Kepler, Aristarchus, a field of craterlets; its REAL PHASE with a soft terminator; EARTHSHINE on the
//               crescent's dark part (the maria faintly there); a big AMBER MOONRISE (bigger + amber low, shrinking to silver
//               as it climbs; the harvest moon stays amber longer; a supermoon a touch bigger); a tight corona in clear air
//               and a 22° HALO only in real haze (thin cloud / light fog); a lunar eclipse (the real dates) turns it copper-red
//   THE SUN     (district/sun.js draws the disc) + the golden hour's haze: the low sun's warm air along the horizon
//   THE AURORA  slow curtains of rays — a sharp green lower border fading up through teal into violet and red (a storm night:
//               higher, redder, brighter) — rendered small a few times a second and drawn as one soft image
import { moonLook } from '../../core/harbor-sky.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const S = 256, MR = 120, MC = 128;                     // the texture: 256 px, the disc's radius 120

// the near side (unit disc: x right, y down — the moon as seen from the northern hemisphere)
const MARIA = [[-0.32, -0.38, 0.27], [0.18, -0.34, 0.17], [0.34, -0.06, 0.2], [0.68, -0.28, 0.12], [0.55, 0.2, 0.15], [0.33, 0.33, 0.1],
  [-0.15, 0.4, 0.17], [-0.5, 0.42, 0.1], [-0.62, -0.04, 0.3], [-0.45, 0.18, 0.22], [-0.06, -0.69, 0.12], [0.22, -0.7, 0.09], [-0.3, -0.7, 0.1], [0.0, -0.12, 0.08], [-0.3, 0.08, 0.13]];

function texture() {
  const cv = mk(S, S), x = safeCtx(cv), R = rng(1969);
  x.save(); x.beginPath(); x.arc(MC, MC, MR, 0, TAU); x.clip();
  // the highlands: a warm pale grey, a little brighter toward the limb (the full moon's even light)
  let g = x.createRadialGradient(MC, MC, 0, MC, MC, MR);
  g.addColorStop(0, '#ebe6da'); g.addColorStop(0.8, '#e6e1d4'); g.addColorStop(1, '#f2eee4');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  // a fine mottling
  for (let i = 0; i < 900; i++) { const a = R() * TAU, d = Math.sqrt(R()) * MR, r = 0.6 + R() * 2.4; x.fillStyle = `rgba(${R() < 0.5 ? '120,114,104' : '255,252,244'},${0.04 + R() * 0.06})`; x.beginPath(); x.arc(MC + Math.cos(a) * d, MC + Math.sin(a) * d, r, 0, TAU); x.fill(); }
  // the maria: soft dark grey-blue seas built of overlapping blobs (organic edges)
  for (const [mx, my, mr] of MARIA) {
    for (let k = 0; k < 9; k++) {
      const ox = (R() - 0.5) * mr * 0.9, oy = (R() - 0.5) * mr * 0.9, rr = mr * (0.45 + R() * 0.55);
      const cx = MC + (mx + ox) * MR, cy = MC + (my + oy) * MR, gr = x.createRadialGradient(cx, cy, 0, cx, cy, rr * MR);
      gr.addColorStop(0, 'rgba(112,116,124,0.34)'); gr.addColorStop(0.7, 'rgba(118,120,126,0.2)'); gr.addColorStop(1, 'rgba(120,120,126,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, rr * MR, 0, TAU); x.fill();
    }
  }
  // craterlets in the highlands: a dark floor shadow on the sun's side + a bright rim on the other
  for (let i = 0; i < 160; i++) {
    const a = R() * TAU, d = Math.sqrt(R()) * MR * 0.96, r = 0.8 + R() * R() * 5, cx = MC + Math.cos(a) * d, cy = MC + Math.sin(a) * d;
    x.fillStyle = `rgba(90,86,80,${0.1 + R() * 0.12})`; x.beginPath(); x.arc(cx + r * 0.2, cy + r * 0.15, r, 0, TAU); x.fill();
    x.strokeStyle = `rgba(255,252,244,${0.12 + R() * 0.15})`; x.lineWidth = Math.max(0.4, r * 0.3); x.beginPath(); x.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 1.9); x.stroke();
  }
  // TYCHO's rays: faint bright streaks far across the southern highlands; Tycho, Copernicus, Kepler, Aristarchus bright
  const tx = MC - 0.13 * MR, ty = MC + 0.7 * MR;
  x.lineCap = 'round';
  for (let i = 0; i < 22; i++) { const a = R() * TAU, L = MR * (0.25 + R() * 0.9); const gr = x.createLinearGradient(tx, ty, tx + Math.cos(a) * L, ty + Math.sin(a) * L); gr.addColorStop(0, 'rgba(255,253,246,0.22)'); gr.addColorStop(1, 'rgba(255,253,246,0)'); x.strokeStyle = gr; x.lineWidth = 1 + R() * 1.6; x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx + Math.cos(a) * L, ty + Math.sin(a) * L); x.stroke(); }
  for (const [cx, cy, r, a] of [[-0.13, 0.7, 4.2, 0.85], [-0.3, -0.06, 4.6, 0.6], [-0.55, -0.05, 2.6, 0.55], [-0.68, -0.3, 2.4, 0.9], [0.45, -0.52, 2.2, 0.4]]) {
    const px = MC + cx * MR, py = MC + cy * MR, gr = x.createRadialGradient(px, py, 0, px, py, r * 2.2);
    gr.addColorStop(0, `rgba(255,253,248,${a})`); gr.addColorStop(0.45, `rgba(255,252,244,${a * 0.4})`); gr.addColorStop(1, 'rgba(255,252,244,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(px, py, r * 2.2, 0, TAU); x.fill();
  }
  x.restore();
  return cv;
}

export function createCelestial() {
  let tex = null, comp = null, compKey = '', mask = null, glowCv = new Map(), auroraCv = null, auroraAt = -1e9, rayCv = null;
  let W = 1, HZ = 1, K = 1, tier = 2, lastMoon = null;
  const glow = col => {
    const k = col.join(','); let c = glowCv.get(k);
    if (!c) { c = mk(64, 64); const x = safeCtx(c), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${k},1)`); g.addColorStop(0.3, `rgba(${k},0.38)`); g.addColorStop(1, `rgba(${k},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); if (glowCv.size > 24) glowCv.clear(); glowCv.set(k, c); }
    return c;
  };

  /** the moon in its phase, amber and earthshine (a composite cached per quantised look) */
  function composite(phase, amber, es, ec) {
    const q = Math.round(phase * 96) / 96, key = `${q}|${Math.round(amber * 16)}|${Math.round(es * 8)}|${ec ? `${ec.p.toFixed(2)}${ec.mag.toFixed(2)}` : '-'}`;
    if (comp && key === compKey) return comp;
    compKey = key;
    if (!tex) tex = texture();
    comp = comp || mk(S, S); mask = mask || mk(S, S);
    const x = safeCtx(comp);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, S, S);
    // the dark part: opaque (it hides the stars behind it), with the earth's light on it — the maria faintly there
    if (es > 0.01) { x.globalAlpha = 0.05 + 0.2 * es; x.drawImage(tex, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(150,170,220)'; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.arc(MC, MC, MR, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over'; }
    // the lit part: the phase's shape, its terminator softened (a blurred mask), the texture inside it
    const m = safeCtx(mask);
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, S, S);
    const k = Math.cos(q * TAU);                     // 1 new, −1 full
    m.save(); m.shadowColor = '#fff'; m.shadowBlur = 3.5; m.shadowOffsetX = 2000;
    m.translate(MC - 2000, MC); if (q >= 0.5) m.scale(-1, 1);
    m.fillStyle = '#fff'; m.beginPath(); m.arc(0, 0, MR, -Math.PI / 2, Math.PI / 2, false); m.ellipse(0, 0, Math.max(0.01, MR * Math.abs(k)), MR, 0, Math.PI / 2, -Math.PI / 2, k > 0); m.closePath(); m.fill();
    m.restore();
    m.globalCompositeOperation = 'destination-in'; m.beginPath(); m.arc(MC, MC, MR, 0, TAU); m.fill();
    m.globalCompositeOperation = 'source-in'; m.drawImage(tex, 0, 0);
    // (the terminator's light grazes: a little darker along it)
    x.drawImage(mask, 0, 0);
    // AMBER: a low moon seen through a lot of air
    if (amber > 0.02) {
      const a = amber;
      // (a gentle multiply toward gold, then warm light added back: a low moon GLOWS golden-orange — it is never a dull brown)
      x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(255,${Math.round(255 - 60 * a)},${Math.round(255 - 130 * a)})`; x.fillRect(0, 0, S, S);
      x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,${Math.round(150 + 30 * (1 - a))},60,${(0.26 * a).toFixed(3)})`; x.fillRect(0, 0, S, S);
      // (the disc mask must be OPAQUE: destination-in keeps the source's alpha — the translucent fill above faded the whole moon)
      x.globalCompositeOperation = 'destination-in'; x.fillStyle = '#000'; x.beginPath(); x.arc(MC, MC, MR, 0, TAU); x.fill();
      x.globalCompositeOperation = 'source-over';
      x.globalCompositeOperation = 'source-over';
    }
    // A LUNAR ECLIPSE (the real dates): the penumbra's dimming, the umbra deep copper-red, its edge brighter
    if (ec) {
      const Rsh = MR * 2.7, dmin = ec.mag >= 1 ? Math.max(0, Rsh - MR - 2 * MR * (ec.mag - 1)) * 0.55 : Rsh + MR - 2 * MR * ec.mag;
      const sx = MC + ec.p * (Rsh + MR) * 1.08, sy = MC + dmin, inside = clamp01((Rsh - Math.hypot(sx - MC, sy - MC)) / (2 * MR));
      x.globalCompositeOperation = 'source-atop';
      let g = x.createRadialGradient(sx, sy, Rsh * 0.95, sx, sy, Rsh * 1.6); g.addColorStop(0, 'rgba(10,6,12,0.45)'); g.addColorStop(1, 'rgba(10,6,12,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
      g = x.createRadialGradient(sx, sy, 0, sx, sy, Rsh); g.addColorStop(0, 'rgba(58,12,6,0.9)'); g.addColorStop(0.55, 'rgba(110,30,10,0.84)'); g.addColorStop(0.86, 'rgba(160,56,20,0.74)'); g.addColorStop(0.97, 'rgba(210,110,56,0.6)'); g.addColorStop(1, 'rgba(210,110,56,0)');
      x.fillStyle = g; x.beginPath(); x.arc(sx, sy, Rsh, 0, TAU); x.fill();
      if (inside > 0) { const ax = MC + (MC - sx) * 0.5, ay = MC + (MC - sy) * 0.5, rim = x.createRadialGradient(ax, ay, MR * 0.2, ax, ay, MR * 1.3); rim.addColorStop(0, `rgba(255,130,70,${0.36 * inside})`); rim.addColorStop(1, 'rgba(255,120,60,0)'); x.fillStyle = rim; x.fillRect(0, 0, S, S); }
      x.globalCompositeOperation = 'source-over';
    }
    return comp;
  }

  return {
    resize(w, h, hz) { W = w; HZ = hz; K = Math.max(0.9, Math.min(1.35, w / 402)); auroraAt = -1e9; },
    setTier(t) { tier = t; },
    /** THE MOON (district/fx.js calls it in place of its own art, at its place): o = { x, y, r, a (its visibility), ec, L, dark }
     *  → the radius drawn (the water's moon path + the tap use it) */
    moon(c, o) {
      const L = o.L, lk = moonLook(L.moon, { local: L.local, south: L.south, cloud: L.cloud, fog: L.fog, rain: L.rain, clear: L.clear });
      // (the district's visibility `a` was tuned for its old sprite: ~0.35 in twilight — a real moon is brightest against a
      // darkening sky; the Harbor's disc reaches full strength at a ≈ 0.45, and still fades in by day)
      const r = o.r * lk.size, es = lk.earthshine * clamp01((o.dark - 0.4) * 2), discA = clamp01(o.a * 2.2);
      lastMoon = { a: +o.a.toFixed(3), discA: +discA.toFixed(3), r: +r.toFixed(1), amber: +lk.amber.toFixed(2), es: +es.toFixed(2), dark: +o.dark.toFixed(2), x: Math.round(o.x), y: Math.round(o.y), halo: +lk.halo.toFixed(2), harvest: lk.harvest, supermoon: lk.supermoon };
      const ec = o.ec ? { p: o.ec.p, mag: o.ec.mag } : null;
      const amberCol = [255, Math.round(236 - 70 * lk.amber), Math.round(214 - 130 * lk.amber)], silver = [214, 224, 255];
      const gcol = lk.amber > 0.3 ? amberCol : silver;
      c.save(); c.globalCompositeOperation = 'lighter';
      // the light round it: a wide soft glow (warm when low) + a tight corona in clear air
      c.globalAlpha = (0.14 + 0.12 * lk.amber) * o.a * o.dark * (0.5 + 0.5 * L.moon.illum) * (lk.supermoon ? 1.25 : 1); c.drawImage(glow(gcol), o.x - r * 7, o.y - r * 7, r * 14, r * 14);
      c.globalAlpha = 0.32 * lk.corona * o.a * o.dark * (0.35 + 0.65 * L.moon.illum); c.drawImage(glow(gcol.map(v => Math.min(255, v + 20))), o.x - r * 2.4, o.y - r * 2.4, r * 4.8, r * 4.8);
      // the 22° HALO: only in real haze — a thin pale ring, a hint of red on its inside edge
      if (lk.halo > 0.02) {
        const hr = r * 5.2;
        c.globalAlpha = 0.16 * lk.halo * o.a * o.dark; c.lineWidth = Math.max(1.5, r * 0.35);
        c.strokeStyle = 'rgba(255,170,150,0.7)'; c.beginPath(); c.arc(o.x, o.y, hr - r * 0.18, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(220,232,255,0.9)'; c.beginPath(); c.arc(o.x, o.y, hr, 0, TAU); c.stroke();
        c.globalAlpha = 0.06 * lk.halo * o.a * o.dark; c.lineWidth = r * 1.2; c.beginPath(); c.arc(o.x, o.y, hr + r * 0.3, 0, TAU); c.stroke();
      }
      c.restore();
      // the disc
      // (in a dark sky the moon's dark part hides the stars behind it; in twilight it is the sky's own colour: nothing drawn)
      const shade = 0.88 * smooth(0.55, 0.9, o.dark) * discA;
      if (shade > 0.02) { c.globalAlpha = shade; c.fillStyle = 'rgb(9,12,24)'; c.beginPath(); c.arc(o.x, o.y, r * 0.995, 0, TAU); c.fill(); c.globalAlpha = 1; }
      const img = composite(L.moon.phase, lk.amber, es, ec), sz = S * r / MR;
      c.globalAlpha = discA * (0.7 + 0.3 * o.dark); c.drawImage(img, o.x - sz / 2, o.y - sz / 2, sz, sz); c.globalAlpha = 1;
      return r;
    },
    /** THE GOLDEN HOUR'S HAZE (after the sun's disc): the low sun's warm air along the horizon, on its side of the sky */
    sunHaze(c, s, sun) {
      if (!sun || sun.vis < 0.05 || sun.el > 14 || sun.el < -3) return;
      const L = s.L, k = (1 - smooth(3, 14, sun.el)) * sun.vis * (1 - 0.7 * clamp01(L.cloud || 0)) * (L.rain ? 0.2 : 1);
      if (k < 0.02) return;
      const col = sun.col.map(v => Math.min(255, v + 12));
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.2 * k; c.drawImage(glow(col), sun.x - W * 0.9, HZ * 0.78 - HZ * 0.22, W * 1.8, HZ * 0.44);
      c.globalAlpha = 0.1 * k; c.drawImage(glow(col), sun.x - W * 0.6, sun.y - HZ * 0.35, W * 1.2, HZ * 0.7);
      c.globalAlpha = 0.07 * k; c.drawImage(glow([255, 250, 236]), sun.x - W * 0.45, sun.y - sun.r * 0.35, W * 0.9, sun.r * 0.7);
      c.restore();
    },
    /** THE AURORA (district/fx.js calls it in place of its own on an aurora night): strength 0..1, the area { y0, y1 } */
    aurora(c, s, strength, area) {
      const dark = clamp01(s.L.w.night + s.L.w.late);
      if (dark < 0.3 || strength <= 0) return;
      const aw = Math.ceil(W / 3), ah = Math.ceil((area.y1 - area.y0) / 2.5);
      if (!auroraCv || auroraCv.width !== aw || auroraCv.height !== ah) { if (auroraCv) auroraCv.width = 0; auroraCv = mk(aw, ah); auroraAt = -1e9; }
      if (!rayCv) {
        rayCv = mk(4, 128); const x = safeCtx(rayCv), g = x.createLinearGradient(0, 128, 0, 0);
        g.addColorStop(0, 'rgba(110,255,170,0)'); g.addColorStop(0.04, 'rgba(140,255,180,1)'); g.addColorStop(0.18, 'rgba(80,240,160,0.7)'); g.addColorStop(0.5, 'rgba(60,200,190,0.28)'); g.addColorStop(0.78, 'rgba(150,80,220,0.18)'); g.addColorStop(1, 'rgba(220,60,120,0)');
        x.fillStyle = g; x.fillRect(0, 0, 4, 128);
      }
      const every = !s.motion ? 1e9 : tier === 2 ? 110 : tier === 1 ? 180 : 400;
      if (performance.now() - auroraAt > every) {
        auroraAt = performance.now();
        const x = safeCtx(auroraCv), t = s.motion ? s.t : 0;
        x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, aw, ah); x.globalCompositeOperation = 'lighter';
        const curtains = [[0.86, 0.1, 0, 0.07, 1], [0.7, 0.08, 2.1, 0.05, 0.6], [0.78, 0.06, 4.4, 0.09, 0.45]].slice(0, tier === 0 ? 2 : 3);
        // (the rays: as many as the width wants, each with its own stable jitter — never a regular comb)
        const n = tier === 0 ? 60 : Math.max(110, Math.round(aw / 2.6));
        const jit = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
        for (const [base, amp, ph, sp, a] of curtains) for (let i = 0; i < n; i++) {
          const j1 = jit(i, ph), j2 = jit(i, ph + 1.7), u = (i + (j1 - 0.5) * 0.9) / n, px = u * aw * 1.1 - aw * 0.05;
          const by = ah * (base + amp * Math.sin(u * 6.3 + t * sp + ph) + 0.025 * Math.sin(u * 31 + t * sp * 5));
          const hh = ah * (0.35 + 0.22 * strength + 0.18 * Math.sin(u * 4.1 + t * sp * 1.7 + ph)) * (0.75 + 0.25 * Math.sin(u * 47 + t * 0.9 + ph));
          const br = a * (0.55 + 0.45 * Math.sin(u * 17 + t * sp * 6 + ph * 2)) * (0.45 + 0.85 * j2) * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) ** 0.6;
          if (br <= 0.02) continue;
          x.globalAlpha = Math.min(1, br * 0.55); x.drawImage(rayCv, px, by - hh * (0.92 + 0.16 * j1), Math.max(1.4, aw / n * (1.2 + 1.2 * j2)), hh * (0.96 + 0.16 * j1));
        }
      }
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp01(strength * 1.15) * dark * 0.85;
      c.imageSmoothingEnabled = true; c.drawImage(auroraCv, 0, area.y0, W, area.y1 - area.y0);
      c.restore();
    },
    debug: () => ({ moonKey: compKey, moon: lastMoon }),
    destroy() { for (const cv of [tex, comp, mask, auroraCv, rayCv, ...glowCv.values()]) if (cv) cv.width = 0; glowCv.clear(); tex = comp = mask = auroraCv = rayCv = null; },
  };
}
