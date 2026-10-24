// CITY 2.0 — THE HARBOR, Part 6a: THE MOON, THE SUN'S HAZE, THE AURORA — the art (the real timing, path and phase are core/sky.js's
// + the framing district/fx.js#moonPlace with the Harbor's arch: unchanged). docs/harbor.md#part-6a.
//   THE MOON    THE REAL MOON (the owner: "the craters look off"): a PHOTOGRAPHIC map of the near side — assets/moon-near.jpg, an
//               orthographic disc made from NASA's CGI Moon Kit (LRO LROC WAC colour mosaic, lroc_color_poles_2k; NASA Scientific
//               Visualization Studio, svs.gsfc.nasa.gov/4720, public domain), 256 px grayscale. The maria (the man in the moon),
//               the bright highlands, Tycho's rays — no drawn craters. Lit per pixel (Lommel–Seeliger: the full moon's flat even
//               light, a quarter's gentle fall toward the soft terminator), turned to the player's REAL SKY (moonSky: the
//               lunar north from the ecliptic pole, the bright limb toward the real sun — tilted at moonrise, upside down in
//               the south). Loaded lazily; missing / blocked → the old crafted texture below (the fallback, same orientation).
//               The fallback: the near side's maria where they really are (Imbrium, Serenitatis, Tranquillitatis,
//               Crisium, Fecunditatis, Nectaris, Nubium, Humorum, the Ocean of Storms, Frigoris), bright Tycho with its rays,
//               Copernicus, Kepler, Aristarchus, a field of craterlets; its REAL PHASE with a soft terminator; EARTHSHINE on the
//               crescent's dark part (the maria faintly there); a big AMBER MOONRISE (bigger + amber low, shrinking to silver
//               as it climbs; the harvest moon stays amber longer; a supermoon a touch bigger); a wide soft gaussian glow
//               (wider in haze), a tight corona in clear air and a faint 22° HALO only under a cirrostratus veil, never across
//               the tagline (SP); a lunar eclipse (the real dates) turns it copper-red
//   THE SUN     (district/sun.js draws the disc) + the golden hour's haze: the low sun's warm air along the horizon
//   THE AURORA  slow curtains of rays — a sharp green lower border fading up through teal into violet and red (a storm night:
//               higher, redder, brighter) — rendered small a few times a second and drawn as one soft image
import { moonLook } from '../../core/harbor-sky.js';
import { safeCtx, ctx2d } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const S = 256, MR = 120, MC = 128;                     // the texture: 256 px, the disc's radius 120

// ------------------------------------------------------------------ THE PHOTOGRAPH (lazy, shared, fails silently)
const PHOTO_URL = new URL('../../../assets/moon-near.jpg', import.meta.url).href;
let photo = null, photoState = 'idle';                 // photo: { n, lum: Float32Array 0..1 } — the disc fills the n² square
function loadPhoto() {
  if (photoState !== 'idle' || typeof Image === 'undefined') return;
  photoState = 'loading';
  try {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => {
      try {
        const n = im.naturalWidth || im.width; if (!n) throw new Error('empty');
        const cv = mk(n, n), x = ctx2d(cv, { willReadFrequently: true }); if (!x) throw new Error('no context'); x.drawImage(im, 0, 0, n, n);
        const d = x.getImageData(0, 0, n, n).data, lum = new Float32Array(n * n);
        for (let i = 0; i < n * n; i++) lum[i] = d[i * 4] / 255;
        cv.width = 0; photo = { n, lum }; photoState = 'ok';
      } catch { photoState = 'fail'; }
    };
    im.onerror = () => { photoState = 'fail'; };
    im.src = PHOTO_URL;
  } catch { photoState = 'fail'; }
}

// ------------------------------------------------------------------ THE MOON IN THE PLAYER'S SKY (pure)
const RADg = Math.PI / 180;
const enu = (az, el) => [Math.cos(el * RADg) * Math.sin(az * RADg), Math.cos(el * RADg) * Math.cos(az * RADg), Math.sin(el * RADg)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** PURE: how the moon sits in the player's sky, on the screen (x right, y down; the viewer faces the moon — the scene's own
 *  framing: facing south in the north, north in the south). → { north: the lunar north's screen angle, clockwise from up (rad);
 *  lit: the bright limb's direction (rad, 0 = right, clockwise) }. The lunar north is the ecliptic pole's (within 1.5°) —
 *  tilted at moonrise / moonset by the parallactic angle, ~upside down in the southern hemisphere; the bright limb points at
 *  the real sun. Missing data → the northern evening's look (north up; waxing lit on the right), flipped in the south. */
export function moonSky(L) {
  const m = L && L.moon, sn = L && L.sun, south = !!(L && L.south);
  const fb = { north: south ? Math.PI : 0, lit: ((m && m.phase >= 0.5) ? Math.PI : 0) + (south ? Math.PI : 0) };
  if (!m || m.az == null || m.el == null || L.lat == null) return fb;
  const M = enu(m.az, m.el), rc = cross(M, [0, 0, 1]), rl = Math.hypot(rc[0], rc[1], rc[2]);
  if (rl < 1e-3) return fb;                            // (straight overhead: no up on the screen)
  const right = rc.map(v => v / rl), up = cross(right, M);
  const onScreen = v => { const k = dot(v, M), t = [v[0] - k * M[0], v[1] - k * M[1], v[2] - k * M[2]]; return [dot(t, right), -dot(t, up)]; };
  // the ecliptic's north pole (RA 18 h, Dec +66.56°) at the local sidereal time; no clock → the celestial pole
  const phi = L.lat * RADg, lp = L.local;
  let P = [0, Math.cos(phi), Math.sin(phi)];
  if (lp && lp.y && L.lon != null) {
    const ms = Date.UTC(lp.y, lp.m - 1, lp.d, lp.h, lp.mi, lp.s || 0) - (lp.off || 0) * 60000, d = ms / 86400000 + 2440587.5 - 2451545;
    const H = ((280.46061837 + 360.98564736629 * d + L.lon) - 270) * RADg, dl = 66.5607 * RADg;
    P = [-Math.cos(dl) * Math.sin(H), Math.cos(phi) * Math.sin(dl) - Math.sin(phi) * Math.cos(dl) * Math.cos(H), Math.sin(phi) * Math.sin(dl) + Math.cos(phi) * Math.cos(dl) * Math.cos(H)];
  }
  const pn = onScreen(P), north = Math.hypot(pn[0], pn[1]) > 1e-4 ? Math.atan2(pn[0], -pn[1]) : fb.north;
  let lit = fb.lit;
  if (sn && sn.az != null && sn.el != null) { const sv = onScreen(enu(sn.az, sn.el)); if (Math.hypot(sv[0], sv[1]) > 1e-3) lit = Math.atan2(sv[1], sv[0]); }
  return { north, lit };
}

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
  let tex = null, comp = null, compKey = '', baseCv = null, baseKey = '', mask = null, glowCv = new Map(), auroraCv = null, auroraAt = -1e9, rayCv = null;
  let W = 1, HZ = 1, K = 1, tier = 2, lastMoon = null, skyNow = { band: null, veil: 0 }, ringCv = null;
  const softCv = new Map();
  // SP — a soft glow with a GAUSSIAN fall-off (the owner: the moon's light "too concentrated", a stray circle): it fades to nothing
  // smoothly, no edge at any size or brightness
  const soft = col => {
    const k = col.join(','); let c = softCv.get(k);
    if (!c) { c = mk(128, 128); const x = safeCtx(c), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); for (let i = 0; i <= 16; i++) { const t = i / 16; g.addColorStop(t, `rgba(${k},${(Math.exp(-((t * 2.6) ** 2)) * (1 - t ** 8)).toFixed(4)})`); } x.fillStyle = g; x.fillRect(0, 0, 128, 128); if (softCv.size > 8) softCv.clear(); softCv.set(k, c); }
    return c;
  };
  // the 22° ring: a soft band (no stroke edge), a faint warm inside edge — the real halo's red
  const ring = () => {
    if (ringCv) return ringCv;
    ringCv = mk(256, 256); const x = safeCtx(ringCv), g = x.createRadialGradient(128, 128, 0, 128, 128, 128), R0 = 0.84, w = 0.1;
    g.addColorStop(0, 'rgba(220,230,255,0)'); g.addColorStop(R0 - w, 'rgba(220,230,255,0)'); g.addColorStop(R0 - w * 0.35, 'rgba(255,190,170,0.55)');
    g.addColorStop(R0, 'rgba(226,236,255,1)'); g.addColorStop(R0 + w * 0.6, 'rgba(220,230,255,0.35)'); g.addColorStop(Math.min(1, R0 + w * 1.4), 'rgba(220,230,255,0)'); g.addColorStop(1, 'rgba(220,230,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return ringCv;
  };
  const glow = col => {
    const k = col.join(','); let c = glowCv.get(k);
    if (!c) { c = mk(64, 64); const x = safeCtx(c), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${k},1)`); g.addColorStop(0.3, `rgba(${k},0.38)`); g.addColorStop(1, `rgba(${k},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); if (glowCv.size > 24) glowCv.clear(); glowCv.set(k, c); }
    return c;
  };

  /** THE PHOTOGRAPH lit per pixel (once per quantised phase / earthshine / orientation — never per frame): the near side turned to
   *  the player's sky, the real sun's light on it (Lommel–Seeliger: the full moon flat and even, a quarter falling gently toward
   *  the soft terminator, the bright limb a touch brighter), a gently soft limb, EARTHSHINE on the dark part (the maria there) */
  function photoBase(cv, q, es, north, lit, amber) {
    const x = safeCtx(cv), img = x.createImageData(S, S), D = img.data, { n, lum } = photo, hn = n / 2;
    const E = q * TAU, ci = -Math.cos(E), si = Math.abs(Math.sin(E));       // the phase angle (0 full, π new)
    const sx = Math.cos(lit) * si, sy = Math.sin(lit) * si, sz = ci, cn = Math.cos(north), sn = Math.sin(north);
    const ea = (0.05 + 0.2 * es) * (es > 0.01 ? 1 : 0), RO = 1 + 1.2 / MR, RO2 = RO * RO;
    // AMBER (a low moon through a lot of air): a gentle multiply toward gold, then warm light added back — a low moon GLOWS
    // golden-orange, never a dull brown (per pixel on the lit part only: a crescent stays a crescent)
    const am = amber > 0.02 ? amber : 0, mg = 1 - (60 / 255) * am, mb = 1 - (130 / 255) * am;
    const ar = 0.26 * am, ag = 0.26 * am * (150 + 30 * (1 - am)) / 255, ab = 0.26 * am * 60 / 255;
    for (let py = 0; py < S; py++) {
      const Y = (py + 0.5 - MC) / MR;
      for (let px = 0; px < S; px++) {
        const X = (px + 0.5 - MC) / MR, rr = X * X + Y * Y;
        if (rr >= RO2) continue;
        // (a gently soft limb, centred just outside the disc: the scene's dark disc under it never peeks out as a rim)
        const Z = rr < 1 ? Math.sqrt(1 - rr) : 0, edge = clamp01((RO - Math.sqrt(rr)) * MR / 2.4);
        // the map (lunar north up) under the screen's turn
        const u = X * cn + Y * sn, v = -X * sn + Y * cn;
        let tx = hn + u * hn - 0.5, ty = hn + v * hn - 0.5;
        tx = tx < 0 ? 0 : tx > n - 1.001 ? n - 1.001 : tx; ty = ty < 0 ? 0 : ty > n - 1.001 ? n - 1.001 : ty;
        const ix = tx | 0, iy = ty | 0, fx = tx - ix, fy = ty - iy, o = iy * n + ix;
        const t = (lum[o] * (1 - fx) + lum[o + 1] * fx) * (1 - fy) + (lum[o + n] * (1 - fx) + lum[o + n + 1] * fx) * fy;
        // the albedo seen by eye: the seas a soft mid grey, the highlands bright (a touch cooler in the seas, warmer up high)
        // (low, through a lot of air, the seas soften a little: the scattered light veils them — the moonrise reads golden, not ochre)
        const A0 = 0.5 + 0.5 * t, A = A0 + (1 - A0) * 0.3 * am;
        const tr = 0.94 + 0.06 * t, tg = 0.955 + 0.03 * t, tb = 1 - 0.035 * t;
        // the sun's light: μ0 the sun's angle, μ ours
        const m0 = X * sx + Y * sy + Z * sz;
        let I = m0 > 0 ? (2 * m0) / (m0 + Z + 0.02) : 0;
        I = I > 1.12 ? 1.12 : I;
        const la = clamp01(I * 4) * smooth(-0.01, 0.05, m0);            // the soft terminator (as light: no dark band)
        const lb = 0.72 + 0.28 * Math.min(1, I) + Math.max(0, I - 1);     // the fall toward it, the bright limb
        const al = la + (1 - la) * ea, k = 4 * (py * S + px);
        if (al <= 0.002) continue;
        const wl = la / al, we = 1 - wl, eb = 0.35 + 0.65 * t;             // (earthshine: the maria faintly there)
        const cr = A * lb * tr + ar, cg = A * lb * tg * mg + ag, cb = A * lb * tb * mb + ab;
        D[k] = Math.min(255, 255 * (cr * wl + eb * (150 / 255) * we));
        D[k + 1] = Math.min(255, 255 * (cg * wl + eb * (170 / 255) * we));
        D[k + 2] = Math.min(255, 255 * (cb * wl + eb * (220 / 255) * we));
        D[k + 3] = Math.round(255 * al * edge);
      }
    }
    x.putImageData(img, 0, 0);
  }
  /** the fallback (no photograph): the crafted texture, its phase as a blurred mask — turned the same way */
  function craftedBase(cv, q, es, north, lit, amber) {
    if (!tex) tex = texture();
    mask = mask || mk(S, S);
    const x = safeCtx(cv);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, S, S);
    const turned = (c, a) => { c.save(); c.translate(MC, MC); c.rotate(a); c.drawImage(tex, -MC, -MC); c.restore(); };
    // the dark part: opaque (it hides the stars behind it), with the earth's light on it — the maria faintly there
    // (the texture opaque first, tinted, cut to the disc, THEN faded: a multiply over a translucent layer fills it with the tint's
    // own colour — the old earthshine came out as a pale opaque disc)
    if (es > 0.01) {
      turned(x, north); x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(150,170,220)'; x.fillRect(0, 0, S, S);
      x.globalCompositeOperation = 'destination-in'; x.fillStyle = '#000'; x.beginPath(); x.arc(MC, MC, MR, 0, TAU); x.fill();
      x.fillStyle = `rgba(0,0,0,${(0.05 + 0.2 * es).toFixed(3)})`; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'source-over';
    }
    // the lit part: the phase's shape, its terminator softened (a blurred mask), the texture inside it — built lit toward the
    // right (the shadow trick is unreliable under a rotation: the mask came out half transparent) and turned toward `lit` as drawn
    const m = safeCtx(mask);
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, S, S);
    const k = Math.cos(q * TAU);                     // 1 new, −1 full
    m.save(); m.shadowColor = '#fff'; m.shadowBlur = 3.5; m.shadowOffsetX = 2000;
    m.translate(MC - 2000, MC);
    m.fillStyle = '#fff'; m.beginPath(); m.arc(0, 0, MR, -Math.PI / 2, Math.PI / 2, false); m.ellipse(0, 0, Math.max(0.01, MR * Math.abs(k)), MR, 0, Math.PI / 2, -Math.PI / 2, k > 0); m.closePath(); m.fill();
    m.restore();
    // (an OPAQUE fill: the context keeps its last fillStyle — the amber's translucent one would fade the next moon)
    m.globalCompositeOperation = 'destination-in'; m.fillStyle = '#000'; m.beginPath(); m.arc(MC, MC, MR, 0, TAU); m.fill();
    m.globalCompositeOperation = 'source-in'; turned(m, north - lit);
    // AMBER on the lit part only (source-atop keeps every pixel's alpha: a low crescent stays a crescent — the old multiply over
    // the whole square filled the dark part in, and a low amber crescent showed as a full moon)
    if (amber > 0.02) { m.globalCompositeOperation = 'source-atop'; m.fillStyle = `rgba(255,${Math.round(165 + 25 * (1 - amber))},70,${(0.42 * amber).toFixed(3)})`; m.fillRect(0, 0, S, S); }
    m.globalCompositeOperation = 'source-over';
    x.save(); x.translate(MC, MC); x.rotate(lit); x.drawImage(mask, -MC, -MC); x.restore();
  }

  /** the moon in its phase, turned to the player's sky, amber and earthshine (a composite cached per quantised look; the lit
   *  base under it cached apart — the amber + the eclipse are a few fills over it) */
  function composite(phase, amber, es, ec, sky) {
    if (photoState === 'idle') loadPhoto();
    const q = Math.round(phase * 96) / 96, st = TAU / 180;   // (the turn in 2° steps: a rebuild every few minutes at most)
    const north = Math.round((sky ? sky.north : 0) / st) * st, lit = Math.round((sky ? sky.lit : (q >= 0.5 ? Math.PI : 0)) / st) * st;
    const aq = Math.round(amber * 16) / 16;
    const bk = `${q}|${Math.round(es * 8)}|${Math.round(north / st)}|${Math.round(lit / st)}|${aq}|${photo ? 'P' : 'C'}`;
    const key = `${bk}|${ec ? `${ec.p.toFixed(2)}${ec.mag.toFixed(2)}` : '-'}`;
    if (comp && key === compKey) return comp;
    compKey = key;
    if (!baseCv || bk !== baseKey) {
      baseCv = baseCv || mk(S, S); baseKey = bk;
      const bx = safeCtx(baseCv); bx.setTransform(1, 0, 0, 1, 0, 0); bx.globalAlpha = 1; bx.globalCompositeOperation = 'source-over'; bx.clearRect(0, 0, S, S);
      if (photo) photoBase(baseCv, q, es, north, lit, aq); else craftedBase(baseCv, q, es, north, lit, aq);
    }
    comp = comp || mk(S, S);
    const x = safeCtx(comp);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, S, S);
    x.drawImage(baseCv, 0, 0);
    // A LUNAR ECLIPSE (the real dates): the penumbra's dimming, the umbra deep copper-red (the maria faintly through it), its edge brighter
    if (ec) {
      const Rsh = MR * 2.7, dmin = ec.mag >= 1 ? Math.max(0, Rsh - MR - 2 * MR * (ec.mag - 1)) * 0.55 : Rsh + MR - 2 * MR * ec.mag;
      const sx = MC + ec.p * (Rsh + MR) * 1.08, sy = MC + dmin, inside = clamp01((Rsh - Math.hypot(sx - MC, sy - MC)) / (2 * MR));
      x.globalCompositeOperation = 'source-atop';
      let g = x.createRadialGradient(sx, sy, Rsh * 0.95, sx, sy, Rsh * 1.6); g.addColorStop(0, 'rgba(10,6,12,0.45)'); g.addColorStop(1, 'rgba(10,6,12,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
      g = x.createRadialGradient(sx, sy, 0, sx, sy, Rsh); g.addColorStop(0, 'rgba(58,12,6,0.82)'); g.addColorStop(0.55, 'rgba(110,30,10,0.74)'); g.addColorStop(0.86, 'rgba(160,56,20,0.66)'); g.addColorStop(0.97, 'rgba(210,110,56,0.6)'); g.addColorStop(1, 'rgba(210,110,56,0)');
      x.fillStyle = g; x.beginPath(); x.arc(sx, sy, Rsh, 0, TAU); x.fill();
      if (inside > 0) { const ax = MC + (MC - sx) * 0.5, ay = MC + (MC - sy) * 0.5, rim = x.createRadialGradient(ax, ay, MR * 0.2, ax, ay, MR * 1.3); rim.addColorStop(0, `rgba(255,130,70,${0.36 * inside})`); rim.addColorStop(1, 'rgba(255,120,60,0)'); x.fillStyle = rim; x.fillRect(0, 0, S, S); }
      x.globalCompositeOperation = 'source-over';
    }
    return comp;
  }

  return {
    resize(w, h, hz) { W = w; HZ = hz; K = Math.max(0.9, Math.min(1.35, w / 402)); auroraAt = -1e9; },
    /** SP: what the moon's light needs from the rest of the sky: the tagline's band ({ y0, y1 } | null), the cirrostratus veil 0..1 */
    skyIs(o) { skyNow = { band: o.band || null, veil: o.veil || 0 }; },
    setTier(t) { tier = t; },
    /** THE MOON (district/fx.js calls it in place of its own art, at its place): o = { x, y, r, a (its visibility), ec, L, dark }
     *  → the radius drawn (the water's moon path + the tap use it) */
    moon(c, o) {
      const L = o.L, lk = moonLook(L.moon, { local: L.local, south: L.south, cloud: L.cloud, fog: L.fog, rain: L.rain, clear: L.clear, veil: skyNow.veil });
      // (the district's visibility `a` was tuned for its old sprite: ~0.35 in twilight — a real moon is brightest against a
      // darkening sky; the Harbor's disc reaches full strength at a ≈ 0.45, and still fades in by day)
      const r = o.r * lk.size, es = lk.earthshine * clamp01((o.dark - 0.4) * 2), discA = clamp01(o.a * 2.2);
      lastMoon = { a: +o.a.toFixed(3), discA: +discA.toFixed(3), r: +r.toFixed(1), amber: +lk.amber.toFixed(2), es: +es.toFixed(2), dark: +o.dark.toFixed(2), x: Math.round(o.x), y: Math.round(o.y), halo: +lk.halo.toFixed(2), harvest: lk.harvest, supermoon: lk.supermoon };
      const ec = o.ec ? { p: o.ec.p, mag: o.ec.mag } : null;
      const amberCol = [255, Math.round(236 - 70 * lk.amber), Math.round(214 - 130 * lk.amber)], silver = [214, 224, 255];
      const gcol = lk.amber > 0.3 ? amberCol : silver;
      c.save(); c.globalCompositeOperation = 'lighter';
      // the light round it (SP): a WIDE SOFT GLOW, gaussian (no edge) — warm when low, wider + a little brighter in haze (the
      // aureole) — then a tight corona in clear air
      const lum = o.a * o.dark * (0.5 + 0.5 * L.moon.illum) * (lk.supermoon ? 1.2 : 1), wr = r * (8 + 6 * lk.haze);
      c.globalAlpha = (0.1 + 0.08 * lk.amber + 0.07 * lk.haze) * lum; c.drawImage(soft(gcol), o.x - wr, o.y - wr, wr * 2, wr * 2);
      c.globalAlpha = (0.1 + 0.06 * lk.haze) * lum; c.drawImage(soft(gcol), o.x - r * 3.6, o.y - r * 3.6, r * 7.2, r * 7.2);
      c.globalAlpha = 0.28 * lk.corona * o.a * o.dark * (0.35 + 0.65 * L.moon.illum); c.drawImage(glow(gcol.map(v => Math.min(255, v + 20))), o.x - r * 2.2, o.y - r * 2.2, r * 4.4, r * 4.4);
      // the 22° HALO: only under a cirrostratus veil — very faint, a soft band; and never a circle across the words (it fades out
      // while any part of it would cross the tagline's band)
      if (lk.halo > 0.02) {
        const hr = r * 6.2, b = skyNow.band;
        const clear = b ? smooth(0, 24, Math.max(b.y0 - (o.y + hr), (o.y - hr) - b.y1)) : 1;
        const a = 0.09 * lk.halo * o.a * o.dark * clear;
        if (a > 0.004) { c.globalAlpha = a; const R2 = hr / 0.84; c.drawImage(ring(), o.x - R2, o.y - R2, R2 * 2, R2 * 2); }
      }
      c.restore();
      // the disc
      // (in a dark sky the moon's dark part hides the stars behind it; in twilight it is the sky's own colour: nothing drawn)
      const shade = 0.88 * smooth(0.55, 0.9, o.dark) * discA;
      if (shade > 0.02) { c.globalAlpha = shade; c.fillStyle = 'rgb(9,12,24)'; c.beginPath(); c.arc(o.x, o.y, r * 0.995, 0, TAU); c.fill(); c.globalAlpha = 1; }
      const sky = moonSky(L); lastMoon.north = Math.round(sky.north * 180 / Math.PI); lastMoon.lit = Math.round(sky.lit * 180 / Math.PI); lastMoon.photo = photoState;
      const img = composite(L.moon.phase, lk.amber, es, ec, sky), sz = S * r / MR;
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
    destroy() { for (const cv of [tex, comp, baseCv, mask, auroraCv, rayCv, ringCv, ...glowCv.values(), ...softCv.values()]) if (cv) cv.width = 0; glowCv.clear(); softCv.clear(); tex = comp = baseCv = mask = auroraCv = rayCv = ringCv = null; },
  };
}
