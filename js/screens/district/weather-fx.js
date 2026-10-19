// LIVE WEATHER, drawn: clouds, lightning, fog (district/scene.js calls these; the numbers come from core/sky.js#look:
// cloud 0..1, storm, fog 0..1, wind m/s + direction — the visitor's real weather, else a few fair-weather clouds).
//
// The clouds are volumetric-looking, not blobs: each shape is fractal noise (fbm) inside a soft silhouette (cumulus: a dome on
// a flat base; stratus: long thin streaks; the overcast deck: a seamless sheet), and the light is marched through it — the
// light from above (sun, sky, moon) and the light from below (the city's neon on the bellies at night). Shapes and light are
// computed once per screen size, off the first paint (idle time, one shape per frame), and only re-coloured when the hour
// changes: a frame is a dozen drawImage calls.
//   sky(c, s)    behind the skyline, after the sun / moon: the overcast deck, the clouds drifting with the real wind, the moon
//                glowing through them, lightning inside them and now and then a branching bolt down to the skyline
//   fog(c, s)    over the skyline, before the street: banks of fog drifting through the towers
//   flash(c, s)  over everything: the street and the city lit for an instant by a strike

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- value noise + fbm (seeded; optionally periodic in x)
function makeNoise(seed) {
  const R = rng(seed), P = new Uint8Array(512), G = new Float32Array(256);
  for (let i = 0; i < 256; i++) { P[i] = i; G[i] = R(); }
  for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [P[i], P[j]] = [P[j], P[i]]; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const fade = t => t * t * (3 - 2 * t);
  const v = (x, y, per) => {
    let xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const x1 = per ? ((xi + 1) % per + per) % per : xi + 1;
    if (per) xi = ((xi % per) + per) % per;
    const a = G[P[(P[xi & 255] + yi) & 255]], b = G[P[(P[x1 & 255] + yi) & 255]];
    const c = G[P[(P[xi & 255] + yi + 1) & 255]], d = G[P[(P[x1 & 255] + yi + 1) & 255]];
    const u = fade(xf), w = fade(yf);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  return (x, y, oct = 5, per = 0) => { let s = 0, amp = 0.5, f = 1, n = 0; for (let o = 0; o < oct; o++) { s += amp * v(x * f, y * f, per ? per * f : 0); n += amp; amp *= 0.5; f *= 2; } return s / n; };
}

export function createWeatherFx({ onFlash = null } = {}) {
  let W = 1, H = 1, HZ = 1;
  const fbm = makeNoise(1337);
  let shapes = [], shapesKey = '', jobs = [];            // computed shapes: { w, h, cw, ch, d, up, dn, kind, cv }
  let deckShape = null, deckJob = null;     // the overcast deck is only built when a grey sky asks for it
  let colourKey = '';
  let deck = [];                                         // clouds on screen: { s (shape index), x, y, w, h, z, a }
  let deckX = 0, born = 0, lastDeckA = 0, lastAppear = 0, lastCloud = 0;
  let strike = null, nextStrike = 3 + Math.random() * 5, boltCv = null;
  let fogShape = null;
  const glowCache = new Map();
  const glow = (col) => { const k = col.join(','); let g = glowCache.get(k); if (!g) { g = mk(64, 64); const x = g.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, rgb(col, 1)); gr.addColorStop(0.4, rgb(col, 0.35)); gr.addColorStop(1, rgb(col, 0)); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowCache.set(k, g); } return g; };

  // ---------------------------------------------------------------- shapes: density + light marched from above and below
  function* computeShape(kind, w, h, seed) {
    const RES = 0.55;                                    // pixels per css px: soft is right for clouds, and cheap
    const cw = Math.max(8, Math.round(w * RES)), ch = Math.max(8, Math.round(h * RES));
    const d = new Float32Array(cw * ch);
    const R = rng(seed);
    const ox = R() * 100, oy = R() * 100;
    const per = kind === 'deck' ? 6 : 0;                 // the deck tiles seamlessly left to right
    const lobes = [{ c: 0.5 + (R() - 0.5) * 0.12, w: 0.2 + R() * 0.06, h: 0.62 + R() * 0.12 }, { c: 0.28 + R() * 0.08, w: 0.14 + R() * 0.05, h: 0.38 + R() * 0.16 }, { c: 0.7 + R() * 0.08, w: 0.14 + R() * 0.05, h: 0.36 + R() * 0.18 }];
    for (let y = 0; y < ch; y++) {
      if (y % 6 === 5) yield;
      const v = y / (ch - 1);
      for (let x = 0; x < cw; x++) {
        const u = x / (cw - 1);
        let mask, n;
        if (kind === 'cumulus') {
          // three towers of billows on a common base (the tallest near the middle); the base wavers a little
          let top = 1;
          for (const l of lobes) top = Math.min(top, 0.8 - l.h * Math.exp(-Math.pow((u - l.c) / l.w, 2)));
          const baseV = 0.8 + (fbm(ox + u * 6, oy + 9, 3) - 0.5) * 0.1;
          mask = smooth(top - 0.1, top + 0.2, v) * (1 - smooth(baseV - 0.12, baseV + 0.04, v)) * smooth(0.02, 0.2, u) * (1 - smooth(0.8, 0.98, u));
          n = fbm(ox + u * 5.2, oy + v * 3.2, 6);
        } else if (kind === 'stratus') {
          // a long, ragged bank: thicker in places, breaking into wisps at the ends
          const thick = 0.24 + 0.14 * fbm(ox + u * 3, oy, 3);
          mask = Math.pow(Math.sin(Math.PI * u), 0.7) * Math.exp(-Math.pow((v - 0.5) / thick, 2)) * smooth(0, 0.22, v) * (1 - smooth(0.78, 1, v));
          n = fbm(ox + u * 4.5, oy + v * 5, 6);
        } else {                                         // deck: dense above, breaking up toward the bottom edge
          mask = 1 - smooth(0.35, 1, v);
          n = fbm(u * 6, oy + v * 3.2, 6, per);
        }
        d[y * cw + x] = kind === 'deck' ? clamp01((n * 1.25 + mask * 1.05 - 1.02) * 2.2) : clamp01((n * 1.45 + mask * 0.98 - 1.1) * 2.6);
      }
    }
    // light: how much cloud lies between this point and the light, above (sun, sky, moon) and below (the city)
    const up = new Float32Array(cw * ch), dn = new Float32Array(cw * ch);
    const step = Math.max(1, Math.round(ch / 28)), N = 7;
    for (let y = 0; y < ch; y++) {
      if (y % 10 === 9) yield;
      for (let x = 0; x < cw; x++) {
      let au = 0, ad = 0;
      for (let k = 1; k <= N; k++) {
        const yu = y - k * step, yd = y + k * step, xs = Math.min(cw - 1, x + k);      // the sun a little to one side
        if (yu >= 0) au += d[yu * cw + xs]; else if (kind === 'deck') au += 1;
        if (yd < ch) ad += d[yd * cw + x];
      }
      up[y * cw + x] = Math.exp(-au * 0.55);
      dn[y * cw + x] = Math.exp(-ad * 0.6);
      }
    }
    return { kind, w, h, cw, ch, d, up, dn, cv: mk(cw, ch) };
  }

  // the colours of the light for the hour: { sun (light from above), skyAmb (shade), city (light from below) }
  function lightsOf(L, P) {
    const w = L.w, dark = w.night + w.late;
    const add = (o, c, k) => { for (let i = 0; i < 3; i++) o[i] += c[i] * k; };
    const sun = [0, 0, 0], amb = [0, 0, 0];
    add(sun, [70, 76, 112], w.night); add(amb, [24, 20, 44], w.night);
    add(sun, [44, 46, 80], w.late); add(amb, [14, 12, 30], w.late);
    add(sun, [255, 206, 200], w.dawn); add(amb, [104, 84, 138], w.dawn);
    add(sun, [255, 255, 255], w.day); add(amb, [150, 162, 190], w.day);
    add(sun, [255, 190, 128], w.golden); add(amb, [126, 74, 112], w.golden);
    const glowC = P.glow.slice(0, 3);
    const city = mix(glowC, [255, 110, 190], 0.25).map(v => v * dark * 0.95);
    // grey, heavy skies: the light flattens and the shade deepens
    const grey = clamp01((L.cloud - 0.6) * 2.2) * 0.5 + (L.rain ? 0.2 : 0);
    const sunG = mix(sun, dark > 0.5 ? [40, 38, 64] : [200, 204, 214], grey), ambG = mix(amb, dark > 0.5 ? [20, 16, 34] : [112, 118, 134], grey * 1.2);
    const moon = L.moon && L.moon.el > 0 ? L.moon.illum * dark : 0;
    return { sun: mix(sunG, [180, 190, 220], moon * 0.3), amb: ambG, city, dark };
  }
  function colourShape(sh, Lt) {
    const x = sh.cv.getContext('2d');
    const img = x.createImageData(sh.cw, sh.ch);
    const px = img.data;
    const { sun, amb, city } = Lt;
    for (let i = 0, n = sh.cw * sh.ch; i < n; i++) {
      const dd = sh.d[i];
      if (dd <= 0.01) { px[i * 4 + 3] = 0; continue; }
      const u = sh.up[i], b = sh.dn[i];
      // shade + light from above + a silver lining where the cloud is thin and lit + the city from below
      const lining = (1 - dd) * u * 0.45;
      for (let c = 0; c < 3; c++) px[i * 4 + c] = Math.min(255, amb[c] + (sun[c] - amb[c]) * (u * 0.85 + lining) + city[c] * b * 0.85);
      px[i * 4 + 3] = Math.round(255 * smooth(0.02, 0.5, dd));
    }
    x.putImageData(img, 0, 0);
  }

  function wantShapes() {
    const key = `${W}|${HZ}`;
    if (key === shapesKey) return;
    shapesKey = key; shapes = []; deckShape = null; colourKey = ''; born = 0;
    const base = Math.min(W, 700);
    jobs = [];
    const job = (gen, done) => ({ gen, done });
    for (let i = 0; i < 5; i++) jobs.push(job(computeShape('cumulus', base * 0.62, base * 0.3, 11 + i * 7), sh => shapes.push(sh)));
    for (let i = 0; i < 3; i++) jobs.push(job(computeShape('stratus', base * 0.95, base * 0.24, 101 + i * 13), sh => shapes.push(sh)));
    deckJob = job(computeShape('deck', Math.max(W, 520), HZ * 0.62, 999), sh => { deckShape = sh; if (colourKey) { recolour.push(sh); } });
  }
  // two milliseconds of shape-building per frame (never during the opening sequence): no frame ever waits for the clouds
  function runJobs() {
    if (!jobs.length || performance.now() < 4500) return;          // after the power-on sequence
    const t0 = performance.now();
    while (jobs.length && performance.now() - t0 < 2) {
      const j = jobs[0], r = j.gen.next();
      if (r.done) { j.done(r.value); jobs.shift(); }
    }
  }
  // re-colouring after the light changes: one shape per frame (the old colours stay up meanwhile)
  let recolour = [], recolourLt = null;
  function runRecolour() { if (!recolour.length) return; colourShape(recolour.shift(), recolourLt); if (!recolour.length && !born) born = performance.now(); }

  function layout(L) {
    const R = rng(77);
    const n = Math.round(1 + L.cloud * 7);
    deck = [];
    for (let i = 0; i < n; i++) {
      const z = R();                                             // 0 high and far … 1 low and near
      // long flat banks only low near the skyline (where they look natural); billows higher up
      const strat = z > 0.5 && (L.cloud > 0.55 ? R() < 0.6 : R() < 0.3);
      const s = strat ? 5 + Math.floor(R() * 3) : Math.floor(R() * 5);
      const sh = shapes[s] || shapes[0];
      const sc = (0.55 + z * 0.75) * (0.85 + R() * 0.3) * (W > 700 ? 1.35 : 1);
      const w = sh.w * sc, h = sh.h * sc;
      deck.push({ s, x: R() * (W + w) - w * 0.5, y: HZ * (0.06 + z * 0.46) + (R() - 0.5) * HZ * 0.05, w, h, z, a: 0.6 + R() * 0.4 });
    }
    deck.sort((a, b) => a.z - b.z);
  }

  // ---------------------------------------------------------------- lightning
  function newStrike() {
    const near = Math.random() < 0.38;
    const pulses = [];
    let tt = 0;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) { pulses.push({ t: tt, a: i === 0 ? 1 : 0.35 + Math.random() * 0.65, d: 0.045 + Math.random() * 0.07 }); tt += 0.06 + Math.random() * 0.17; }
    let bolt = null;
    if (near || Math.random() < 0.3) {
      // well away from the sign: the left or right fifth
      const left = Math.random() < 0.5, x0 = W * (left ? 0.05 + Math.random() * 0.17 : 0.78 + Math.random() * 0.17);
      bolt = makeBolt(x0, HZ * (0.08 + Math.random() * 0.1), HZ * (0.72 + Math.random() * 0.14));
    }
    strike = { k: 0, pulses, end: tt + 0.4, bolt, near, cx: bolt ? bolt.x : W * Math.random() };
    if (onFlash) onFlash({ near, delay: near ? 0.5 + Math.random() * 1.4 : 2.5 + Math.random() * 5 });
  }
  function makeBolt(x0, y0, y1) {
    const sc = Math.min(2, window.devicePixelRatio || 1);
    const pad = 70, bw = 280;
    const cv = mk((bw + pad * 2) * sc, (y1 - y0 + pad * 2) * sc), x = cv.getContext('2d');
    x.scale(sc, sc); x.translate(pad + bw / 2, pad);
    x.lineCap = 'round'; x.lineJoin = 'round';
    const segs = [];
    // the main channel jags down; branches fork off it and thin out
    const branch = (sx, sy, ang, len, w, depth) => {
      let px = sx, py = sy;
      const steps = Math.max(5, Math.round(len / 11));
      for (let i = 0; i < steps; i++) {
        const a = ang + (Math.random() - 0.5) * (depth ? 1.1 : 0.85);
        const sl = (len / steps) * (0.6 + Math.random() * 0.8);
        const nx = px + Math.sin(a) * sl, ny = py + Math.cos(a) * sl;
        segs.push({ x0: px, y0: py, x1: nx, y1: ny, w: w * (1 - i / steps * (depth ? 0.6 : 0.25)) });
        if (depth < 3 && Math.random() < (depth ? 0.12 : 0.2)) branch(nx, ny, a + (Math.random() < 0.5 ? -1 : 1) * (0.45 + Math.random() * 0.6), len * (0.18 + Math.random() * 0.28), w * 0.5, depth + 1);
        px = nx; py = ny;
      }
    };
    branch(0, 0, (Math.random() - 0.5) * 0.2, y1 - y0, 2.4, 0);
    // a wide violet bloom, a blue-white halo, the white-hot core
    for (const [lw, col, blur] of [[14, 'rgba(140,120,255,0.16)', 30], [5, 'rgba(190,205,255,0.55)', 12], [1.3, 'rgba(255,255,255,1)', 4]]) {
      x.save(); x.shadowColor = col; x.shadowBlur = blur; x.strokeStyle = col;
      for (const g of segs) { x.lineWidth = Math.max(0.5, lw * g.w / 2.4); x.beginPath(); x.moveTo(g.x0, g.y0); x.lineTo(g.x1, g.y1); x.stroke(); }
      x.restore();
    }
    if (boltCv) boltCv.width = 0;
    boltCv = cv;
    return { x: x0, y: y0, w: bw + pad * 2, h: y1 - y0 + pad * 2, pad, bw };
  }
  function flashNow() {
    if (!strike) return 0;
    let f = 0;
    for (const p of strike.pulses) { const d = strike.k - p.t; if (d >= 0 && d < p.d + 0.2) f = Math.max(f, p.a * (d < p.d ? 1 : Math.exp(-(d - p.d) * 13))); }
    return f;
  }

  // ---------------------------------------------------------------- fog: a tileable bank (noise, soft top and bottom)
  function computeFog() {
    const cw = 256, ch = 64, a = new Float32Array(cw * ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const v = y / (ch - 1);
      const env = Math.sin(Math.PI * v) ** 1.4;
      a[y * cw + x] = clamp01((fbm(x / cw * 5, 50 + v * 2.2, 5, 5) * 1.3 - 0.35) * env * 1.6);
    }
    return { cw, ch, a, cv: mk(cw, ch), key: '' };
  }
  function colourFog(f, col) {
    const x = f.cv.getContext('2d'), img = x.createImageData(f.cw, f.ch);
    for (let i = 0; i < f.cw * f.ch; i++) { img.data[i * 4] = col[0]; img.data[i * 4 + 1] = col[1]; img.data[i * 4 + 2] = col[2]; img.data[i * 4 + 3] = Math.round(f.a[i] * 255); }
    x.putImageData(img, 0, 0);
  }

  const windX = L => Math.sin((L.windDir || 250) * Math.PI / 180);      // + right, − left (facing south: east is left)

  return {
    resize(w, h, hz) { W = w; H = h; HZ = hz; },
    /** behind the skyline: the deck, the clouds, the moon through them, lightning */
    sky(c, s) {
      const { L, P, dt, motion } = s;
      const sec = dt / 1000;
      wantShapes();
      if (deckJob && L.cloud > 0.5 && !jobs.includes(deckJob) && !deckShape) jobs.push(deckJob);
      runJobs();
      runRecolour();
      const ready = shapes.length >= 8;                       // the clouds (the deck may still be building)
      if (L.cloud > 0.04 && ready) {
        const Lt = lightsOf(L, P);
        const ck = `${L.key}|${shapesKey}`;
        if (ck !== colourKey) {
          // the first time all at once (nothing is on screen yet); after that one shape per frame
          recolour = [...shapes, ...(deckShape ? [deckShape] : [])]; recolourLt = Lt;
          const n = Math.round(1 + L.cloud * 7);
          if (!colourKey || deck.length !== n) layout(L);
          colourKey = ck;
        }
        const appear = born ? smooth(0, 2500, performance.now() - born) : 0;     // clouds fade in once they're built and coloured
        const drift = motion ? (2 + (L.wind || 3) * 1.4) * windX(L) : 0;
        const fl = flashNow();
        // the overcast deck: a seamless sheet across the top of the sky
        const deckA = smooth(0.5, 0.92, L.cloud) * appear;
        lastDeckA = deckA; lastAppear = appear; lastCloud = L.cloud;
        if (deckA > 0.01 && deckShape) {
          deckX = (deckX + drift * 0.25 * sec) % deckShape.w;
          const dw = deckShape.w, dh = deckShape.h;
          for (const ox of [deckX - dw, deckX, deckX + dw]) {
            if (ox > W || ox + dw < 0) continue;
            c.globalAlpha = deckA; c.drawImage(deckShape.cv, ox, -2, dw, dh);
            if (fl > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = fl * 0.55 * deckA; c.drawImage(deckShape.cv, ox, -2, dw, dh); c.globalCompositeOperation = 'source-over'; }
          }
        }
        // the clouds, far to near
        for (const d of deck) {
          const sh = shapes[d.s] || shapes[0];
          d.x += drift * (0.3 + d.z * 0.9) * sec;
          if (d.x > W + d.w * 0.6) d.x = -d.w * 1.05; else if (d.x < -d.w * 1.1) d.x = W + d.w * 0.5;
          const a = d.a * clamp01(L.cloud * 1.8) * (0.8 + 0.2 * d.z) * appear;
          c.globalAlpha = a; c.drawImage(sh.cv, d.x, d.y - d.h * 0.5, d.w, d.h);
          if (fl > 0.02) {
            const near = 1 - Math.min(1, Math.abs(d.x + d.w / 2 - strike.cx) / (W * 0.6));
            c.globalCompositeOperation = 'lighter'; c.globalAlpha = fl * (0.3 + 0.7 * near) * a;
            c.drawImage(sh.cv, d.x, d.y - d.h * 0.5, d.w, d.h); c.globalCompositeOperation = 'source-over';
          }
        }
        c.globalAlpha = 1;
        // the moon: glowing through thin cloud, a diffuse bright patch behind the deck
        const m = s.moonAt;
        if (m && (L.w.night + L.w.late) > 0.3) {
          let over = deckA * 0.8;
          for (const d of deck) if (m.x > d.x + d.w * 0.1 && m.x < d.x + d.w * 0.9 && Math.abs(m.y - d.y) < d.h * 0.35) over = Math.max(over, d.a * appear);
          if (over > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 * over * (L.moon.illum || 0.5); c.drawImage(glow([200, 205, 235]), m.x - m.r * 5, m.y - m.r * 5, m.r * 10, m.r * 10); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
        }
      }
      // lightning
      if (L.storm && motion) {
        nextStrike -= sec;
        if (!strike && (nextStrike <= 0 || (s.force.has('lightning') && !s.lightningDone))) {
          s.lightningDone = true;
          nextStrike = Math.random() < 0.3 ? 1.2 + Math.random() * 2 : 6 + Math.random() * 14;   // clusters, then a pause
          newStrike();
        }
      }
      if (strike) {
        strike.k += sec;
        const f = flashNow();
        if (f > 0.01) {
          // the sky lights up behind the skyline: the towers stand out black against it
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = f * (strike.near ? 0.36 : 0.2);
          c.fillStyle = 'rgb(140,140,210)'; c.fillRect(0, 0, W, HZ);
          c.globalAlpha = f * 0.55; c.drawImage(glow([210, 205, 255]), strike.cx - W * 0.65, -HZ * 0.35, W * 1.3, HZ * 1.15);
          if (strike.bolt && boltCv) { const b = strike.bolt; c.globalAlpha = Math.min(1, f * 1.4); c.drawImage(boltCv, b.x - b.pad - b.bw / 2, b.y - b.pad, b.w, b.h); }
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        }
        if (strike.k > strike.end) strike = null;
      }
    },
    /** after a skyline layer (li 0..2), before the next: fog thickens with distance; li 3 = the banks over the near towers */
    fogLayer(c, s, li, t) {
      const { L, P } = s;
      if (L.fog < 0.05) return;
      const col = P.haze.slice(0, 3);
      if (li < 3) {
        // a veil over everything behind: the far towers dissolve, the near ones stay
        const g = c.createLinearGradient(0, HZ * 0.15, 0, HZ);
        g.addColorStop(0, rgb(col, 0)); g.addColorStop(0.55, rgb(col, 0.22 * L.fog)); g.addColorStop(1, rgb(col, 0.42 * L.fog));
        c.fillStyle = g; c.fillRect(0, HZ * 0.15, W, HZ * 0.85);
        return;
      }
      if (!fogShape) fogShape = computeFog();
      const key = col.map(v => Math.round(v / 6)).join(',');
      if (key !== fogShape.key) { colourFog(fogShape, mix(col, [235, 232, 245], 0.3)); fogShape.key = key; }
      const dir = windX(L) || 1;
      for (let i = 0; i < 3; i++) {
        const y = HZ * (0.6 + i * 0.12), h = HZ * (0.2 + i * 0.06), w = W * 1.8;
        const off = ((((s.motion ? t : 0) * (5 + i * 4) * dir) % w) + w) % w;
        c.globalAlpha = L.fog * (0.5 + i * 0.16);
        c.drawImage(fogShape.cv, off - w, y - h / 2, w, h); c.drawImage(fogShape.cv, off, y - h / 2, w, h);
      }
      c.globalAlpha = 1;
    },
    /** over everything: the city and the street lit for an instant by a strike */
    flash(c) {
      const f = flashNow();
      if (f < 0.02) return;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = f * (strike && strike.near ? 0.15 : 0.06);
      c.fillStyle = 'rgb(170,175,230)'; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    },
    /** how much cloud covers a point of the sky (0..1): the clouds' boxes there and the overcast deck */
    coverAt(px, py) {
      let a = lastDeckA;
      for (const d of deck) if (px > d.x + d.w * 0.1 && px < d.x + d.w * 0.9 && Math.abs(py - d.y) < d.h * 0.32) a = Math.max(a, d.a * lastAppear * clamp01(lastCloud * 1.8));
      return a;
    },
    /** how much the moon disc shows through the cloud right now (the moon is drawn before the clouds) */
    moonVeil: L => 1 - smooth(0.6, 0.97, L.cloud) * 0.92,
    flashNow,
    debug: () => ({ clouds: deck.length, shapes: shapes.length, pending: jobs.length, deck: !!deckShape, strike: !!strike, bolt: !!(strike && strike.bolt) }),
    destroy() { for (const sh of shapes) sh.cv.width = 0; shapes = []; if (deckShape) deckShape.cv.width = 0; if (boltCv) boltCv.width = 0; if (fogShape) fogShape.cv.width = 0; },
  };
}
