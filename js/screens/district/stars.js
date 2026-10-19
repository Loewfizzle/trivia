// THE NIGHT SKY — the real stars and the Milky Way, turning with the sky over the night.
// The brightest stars (a small catalog: RA hours, Dec°, magnitude), a few hundred faint ones scattered on the sphere (denser
// along the galactic plane), and the Milky Way band (sampled along galactic longitude, brightest toward Sagittarius, a dark
// dust lane down its middle). Positions come from the player's estimated place and time (core/sky.js look: lat, lon),
// projected facing south (north in the Southern Hemisphere). Rendered into an offscreen canvas every 20 s (the sky turns
// 15°/hour: the change is far too small to see) and when the screen or the look changes; a frame just draws that canvas.

const D = Math.PI / 180;
const CATALOG = [
  [6.752, -16.72, -1.46], [6.399, -52.7, -0.74], [14.261, 19.18, -0.05], [18.616, 38.78, 0.03], [5.278, 46, 0.08], [5.242, -8.2, 0.13],
  [7.655, 5.22, 0.34], [5.919, 7.41, 0.5], [1.629, -57.24, 0.46], [19.846, 8.87, 0.76], [4.599, 16.51, 0.85], [16.49, -26.43, 0.96],
  [13.42, -11.16, 0.97], [7.755, 28.03, 1.14], [22.961, -29.62, 1.16], [20.69, 45.28, 1.25], [10.14, 11.97, 1.35], [7.577, 31.89, 1.58],
  [5.419, 6.35, 1.64], [5.438, 28.61, 1.65], [5.604, -1.2, 1.69], [5.679, -1.94, 1.77], [5.533, -0.3, 2.23], [5.796, -9.67, 2.06],
  [2.53, 89.26, 1.98], [11.062, 61.75, 1.79], [11.031, 56.38, 2.37], [11.897, 53.69, 2.44], [12.257, 57.03, 3.31], [12.9, 55.96, 1.77],
  [13.399, 54.93, 2.27], [13.792, 49.31, 1.86], [0.675, 56.54, 2.24], [0.153, 59.15, 2.28], [0.945, 60.72, 2.47], [1.43, 60.24, 2.68],
  [1.907, 63.67, 3.37], [3.405, 49.86, 1.79], [3.136, 40.96, 2.12], [2.12, 23.46, 2], [0.14, 29.09, 2.06], [1.162, 35.62, 2.05],
  [2.065, 42.33, 2.1], [23.079, 15.21, 2.49], [23.063, 28.08, 2.42], [0.221, 15.18, 2.83], [11.818, 14.57, 2.14], [10.333, 19.84, 2.08],
  [14.845, 74.16, 2.08], [17.582, 12.56, 2.07], [17.943, 51.49, 2.23], [20.37, 40.26, 2.23], [19.512, 27.96, 3.05], [20.77, 33.97, 2.48],
  [17.56, -37.1, 1.63], [17.622, -43, 1.87], [18.403, -34.38, 1.85], [18.921, -26.3, 2.05], [6.628, 16.4, 1.93], [6.378, -17.96, 1.98],
  [6.977, -28.97, 1.5], [7.14, -26.39, 1.83], [12.443, -63.1, 0.77], [12.795, -59.69, 1.25], [12.519, -57.11, 1.64], [14.064, -60.37, 0.61],
  [14.66, -60.83, -0.27], [3.791, 24.11, 2.87], [3.748, 24.11, 3.7], [3.763, 24.37, 3.9], [3.82, 24.05, 3.6], [3.038, 4.09, 2.54],
  [0.727, -17.99, 2.04], [9.46, -8.66, 1.98], [14.848, -16.04, 2.75], [16.006, -22.62, 2.29], [15.738, 6.43, 2.63], [15.578, 26.71, 2.22],
  [14.75, 27.07, 2.37], [13.036, 10.96, 2.83], [16.836, -34.29, 2.29], [17.708, -39.03, 2.4], [8.159, -47.34, 1.83], [9.22, -69.72, 1.67],
];

/** Galactic (l, b in degrees) → equatorial (RA, Dec in degrees), J2000. */
export function galToEq(l, b) {
  const aG = 192.85948 * D, dG = 27.12825 * D, lN = 122.93192 * D;
  const L = l * D, B = b * D;
  const sd = Math.sin(B) * Math.sin(dG) + Math.cos(B) * Math.cos(dG) * Math.cos(lN - L);
  const ra = aG + Math.atan2(Math.cos(B) * Math.sin(lN - L), Math.sin(B) * Math.cos(dG) - Math.cos(B) * Math.sin(dG) * Math.cos(lN - L));
  return { ra: ((ra / D) % 360 + 360) % 360, dec: Math.asin(sd) / D };
}

/** Local sidereal time (degrees) for a moment and longitude. */
export function lst(ms, lon) {
  const jd = ms / 86400000 + 2440587.5;
  return ((280.46061837 + 360.98564736629 * (jd - 2451545) + lon) % 360 + 360) % 360;
}

/** Equatorial (degrees) → altitude / azimuth (degrees; azimuth from north through east). */
export function altAz(ra, dec, lat, lstDeg) {
  const H = (lstDeg - ra) * D, d = dec * D, p = lat * D;
  const sa = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sa)));
  const az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(H));
  return { alt: alt / D, az: ((az / D) % 360 + 360) % 360 };
}

export function createStars() {
  // the faint stars + the Milky Way samples, built once (seeded)
  let a = 0x51ed;
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const stars = CATALOG.map(([h, dec, mag]) => ({ ra: h * 15, dec, mag }));
  for (let i = 0; i < 420; i++) { const ra = rnd() * 360, dec = Math.asin(rnd() * 2 - 1) / D; stars.push({ ra, dec, mag: 3.6 + rnd() * 2.2 }); }
  for (let i = 0; i < 360; i++) { const l = rnd() * 360, b = (rnd() + rnd() + rnd() - 1.5) * 9; const e = galToEq(l, b); stars.push({ ra: e.ra, dec: e.dec, mag: 4.4 + rnd() * 1.6 }); }
  const band = [];
  for (let l = 0; l < 360; l += 2.5) {
    const core = Math.exp(-Math.pow(((l + 180) % 360 - 180) / 70, 2));        // brightest toward the galactic centre
    for (const b of [-9, -5.5, -2.5, 0, 2.5, 5.5, 9]) {
      const e = galToEq(l + (rnd() - 0.5) * 2, b + (rnd() - 0.5) * 2);
      band.push({ ...e, w: (0.35 + 0.65 * core) * Math.exp(-(b * b) / 50) * (0.75 + rnd() * 0.5), lane: Math.abs(b) < 1.5 && core > 0.25, sz: 1 + core * 0.6 });
    }
  }
  let cv = null, key = '', at = -1e9, bright = [];
  const glowCache = new Map();
  const glow = (r, g, b) => { const k = `${r},${g},${b}`; let c = glowCache.get(k); if (!c) { c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${k},1)`); gr.addColorStop(0.4, `rgba(${k},0.35)`); gr.addColorStop(1, `rgba(${k},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowCache.set(k, c); } return c; };

  function render(W, HZ, L, ms, milky) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!cv || cv.width !== Math.round(W * dpr) || cv.height !== Math.round(HZ * dpr)) { cv = document.createElement('canvas'); cv.width = Math.round(W * dpr); cv.height = Math.round(HZ * dpr); }
    const x = cv.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    // the view: facing south (north in the south), the horizon at the skyline, about 85° of sky up to the top of the screen;
    // a touch narrower horizontally on a phone so the constellations keep their shapes
    const kv = HZ / 85, kh = kv * (W < H_(W, HZ) ? 0.8 : 1);
    const az0 = L.south ? 0 : 180, s = lst(ms, L.lon);
    const proj = (ra, dec) => { const p = altAz(ra, dec, L.lat, s); if (p.alt < -1) return null; let d = p.az - az0; d = ((d + 540) % 360) - 180; const px = W / 2 + d * kh, py = HZ - p.alt * kv; if (px < -20 || px > W + 20 || py < -20) return null; return { x: px, y: py, alt: p.alt }; };
    // the Milky Way: soft overlapping glows, then the dust lane carved through its brightest stretch
    if (milky > 0.01) {
      x.globalCompositeOperation = 'lighter';
      for (const m of band) {
        const p = proj(m.ra, m.dec); if (!p) continue;
        const hz = Math.min(1, p.alt / 14);                                      // lost in the city glow near the skyline
        const r = 34 * m.sz * (W > 700 ? 1.2 : 1);
        x.globalAlpha = 0.24 * m.w * milky * hz;
        x.drawImage(glow(200, 205, 255), p.x - r, p.y - r, r * 2, r * 2);
        if (m.w > 0.6) { x.globalAlpha = 0.16 * m.w * milky * hz; x.drawImage(glow(255, 228, 200), p.x - r * 0.5, p.y - r * 0.5, r, r); }
      }
      x.globalCompositeOperation = 'destination-out';
      for (const m of band) {
        if (!m.lane) continue;
        const p = proj(m.ra, m.dec); if (!p) continue;
        x.globalAlpha = 0.3 * milky; x.drawImage(glow(0, 0, 0), p.x - 12, p.y - 12, 24, 24);
      }
      x.globalCompositeOperation = 'source-over';
    }
    // the stars, by magnitude; the brightest kept for a little twinkle each frame
    bright = [];
    for (const st of stars) {
      const p = proj(st.ra, st.dec); if (!p) continue;
      const fade = Math.min(1, Math.max(0, p.alt / 10));
      const b = Math.pow(10, -0.4 * (st.mag - 1.5));                             // relative brightness
      const r = Math.max(0.6, Math.min(2.1, 0.7 + Math.sqrt(b) * 0.75));
      const al = Math.min(1, 0.42 + b * 0.8) * fade;
      if (al < 0.03) continue;
      const tint = st.mag < 1.2 ? (st.ra > 60 && st.ra < 100 && st.dec > 0 ? '255,214,190' : '225,234,255') : '236,240,255';
      x.globalAlpha = al; x.fillStyle = `rgb(${tint})`;
      x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill();
      if (st.mag < 1.6) { bright.push({ x: p.x, y: p.y, r, ph: st.ra }); x.globalAlpha = al * 0.4; x.drawImage(glow(220, 230, 255), p.x - r * 5, p.y - r * 5, r * 10, r * 10); }
    }
    x.globalAlpha = 1;
  }
  const H_ = (W, HZ) => HZ * 1.2;

  return {
    /** draw the night sky. vis: how visible stars are now (0 by day); milky: the Milky Way's strength */
    draw(c, W, HZ, L, ms, vis, milky, t, motion, camY) {
      if (vis <= 0.02 || L.lat == null) return;
      const k = `${W}|${HZ}|${Math.round(milky * 20)}|${L.south}`;
      if (k !== key || ms - at > 20000 || ms < at) { key = k; at = ms; render(W, HZ, L, ms, milky); }
      c.globalAlpha = Math.min(1, vis);
      c.drawImage(cv, 0, camY, W, HZ);
      if (motion && bright.length) {
        c.globalCompositeOperation = 'lighter';
        for (const b of bright) { const tw = 0.5 + 0.5 * Math.sin(t * (1.3 + (b.ph % 7) * 0.2) + b.ph); c.globalAlpha = 0.35 * tw * vis; c.drawImage(glow(230, 236, 255), b.x - b.r * 3, b.y - b.r * 3 + camY, b.r * 6, b.r * 6); }
        c.globalCompositeOperation = 'source-over';
      }
      c.globalAlpha = 1;
    },
  };
}
