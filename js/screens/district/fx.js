// LIVING CITY — the sky's moving parts and the city's seasonal dress, drawn into the district scene's canvas.
//   back(c):  behind the skyline — the sun, the moon (real phase), aurora, shooting stars, fireworks, the sleigh
//   mid(c):   on the near buildings — Christmas string lights, glowing window glyphs, the neon pumpkin / shamrock signs
//   front(c): over everything — snow, petals, leaves, fireflies, bats
// Particle counts are capped per quality tier; Reduced effects (motion 0) stops what moves (the palette still applies).
// Rare moments (bats, the sleigh, single shooting stars) are scheduled with long, random gaps — or forced by the preview.

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const CAPS = [{ snow: 50, petals: 4, leaves: 3, flies: 10, fw: 70, aurora: 40 }, { snow: 110, petals: 6, leaves: 5, flies: 18, fw: 150, aurora: 64 }, { snow: 190, petals: 8, leaves: 7, flies: 26, fw: 260, aurora: 96 }];

export function createFx() {
  const sprites = new Map();
  const sprite = (key, w, h, paint) => { let c = sprites.get(key); if (!c) { c = mk(w, h); paint(c.getContext('2d'), w, h); sprites.set(key, c); } return c; };
  const glow = (col, a = 1) => sprite(`g|${col}|${a}`, 64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  let snow = [], petals = [], leaves = [], flies = [], bats = null, meteors = [], rockets = [], sparks = [], sleigh = null;
  let nextBats = 60 + Math.random() * 120, nextSleigh = 90 + Math.random() * 300, nextRocket = 0;
  let witch = null, nextWitch = 45 + Math.random() * 90, trail = [], sleighTrail = [];
  // easter eggs: the UFO, the rooftop cat, the moon you can tap
  let ufo = null, nextUfo = 180 + Math.random() * 360, ufoBits = [];
  let cat = null, catGone = 0;
  let lastMoon = null, shimmer = 0, moonTaps = [];
  let sats = null, nextSats = 300 + Math.random() * 900;
  const BAT_NEON = [[190, 90, 255], [255, 140, 50], [80, 255, 140], [255, 80, 190], [80, 220, 255], [255, 230, 90]];
  let W = 1, H = 1, HZ = 1;
  let lights = null, lightsKey = '';

  // ---------------------------------------------------------------- the moon at its real phase
  function moonSprite(phase) {
    const q = Math.round(phase * 48) / 48;
    return sprite(`moon|${q}`, 128, 128, (x) => {
      const r = 52, cx = 64, cy = 64;
      // the disc: cream, soft maria, a bright limb
      const g = x.createRadialGradient(cx - 14, cy - 16, 6, cx, cy, r);
      g.addColorStop(0, '#fffaf0'); g.addColorStop(0.7, '#efe6d2'); g.addColorStop(1, '#d6ccb8');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
      const R = rng(7);
      for (let i = 0; i < 9; i++) { const a = R() * TAU, d = R() * r * 0.7, mr = 6 + R() * 15; x.fillStyle = `rgba(150,140,128,${0.12 + R() * 0.12})`; x.beginPath(); x.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, mr, 0, TAU); x.fill(); }
      // the lit part only: the disc is copied, cleared to a faint earthshine, and the lit shape drawn back over it
      const disc = mk(128, 128); disc.getContext('2d').drawImage(x.canvas, 0, 0);
      x.clearRect(0, 0, 128, 128);
      x.globalAlpha = 0.1; x.drawImage(disc, 0, 0); x.globalAlpha = 1;
      const k = Math.cos(q * TAU);                 // 1 new, -1 full
      x.save();
      x.translate(cx, cy); if (q >= 0.5) x.scale(-1, 1);   // waning: the left side is lit
      x.beginPath();
      x.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
      x.ellipse(0, 0, Math.max(0.01, r * Math.abs(k)), r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
      x.closePath();
      x.clip();
      x.translate(-cx, -cy);
      x.drawImage(disc, 0, 0);
      x.restore();
      disc.width = 0;
    });
  }

  // ---------------------------------------------------------------- the neon pumpkin / shamrock signs
  const pumpkinSign = () => sprite('pumpkin', 120, 110, (x) => {
    x.lineCap = 'round'; x.lineJoin = 'round';
    const draw = (lw, col, blur) => {
      x.save(); x.shadowColor = col; x.shadowBlur = blur; x.strokeStyle = col; x.lineWidth = lw;
      x.beginPath(); x.ellipse(60, 62, 44, 36, 0, 0, TAU); x.stroke();
      x.beginPath(); x.ellipse(60, 62, 16, 36, 0, 0, TAU); x.stroke();
      x.beginPath(); x.moveTo(36, 54); x.lineTo(46, 46); x.lineTo(52, 56); x.closePath(); x.stroke();
      x.beginPath(); x.moveTo(84, 54); x.lineTo(74, 46); x.lineTo(68, 56); x.closePath(); x.stroke();
      x.beginPath(); x.moveTo(38, 74); x.lineTo(48, 82); x.lineTo(56, 76); x.lineTo(64, 84); x.lineTo(72, 76); x.lineTo(82, 82); x.stroke();
      x.restore();
    };
    draw(7, 'rgba(255,120,30,0.35)', 14); draw(3.2, '#ff8a2a', 8); draw(1.2, '#fff0d0', 0);
    x.save(); x.shadowColor = '#5aff7a'; x.shadowBlur = 8; x.strokeStyle = '#6aff8a'; x.lineWidth = 3; x.lineCap = 'round';
    x.beginPath(); x.moveTo(60, 26); x.quadraticCurveTo(62, 14, 72, 10); x.stroke(); x.restore();
  });
  const shamrockSign = () => sprite('shamrock', 110, 110, (x) => {
    x.lineCap = 'round';
    const leaf = (a) => { x.save(); x.translate(55, 52); x.rotate(a); x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-22, -10, -20, -38, 0, -30); x.bezierCurveTo(20, -38, 22, -10, 0, 0); x.stroke(); x.restore(); };
    for (const [lw, col, blur] of [[7, 'rgba(40,255,120,0.3)', 14], [3, '#3dff8b', 8], [1.1, '#eafff0', 0]]) {
      x.save(); x.shadowColor = col; x.shadowBlur = blur; x.strokeStyle = col; x.lineWidth = lw;
      leaf(0); leaf(TAU / 3); leaf(-TAU / 3);
      x.beginPath(); x.moveTo(55, 56); x.quadraticCurveTo(60, 80, 52, 96); x.stroke();
      x.restore();
    }
  });
  // window glyphs: a carved pumpkin face, a heart, a decorated egg
  const glyph = (kind) => sprite(`gl|${kind}`, 32, 32, (x) => {
    if (kind === 'pumpkin') {
      x.fillStyle = '#ff8a1e'; x.beginPath(); x.ellipse(16, 18, 12, 10, 0, 0, TAU); x.fill();
      x.fillStyle = '#ffd36a'; x.beginPath(); x.moveTo(9, 15); x.lineTo(13, 12); x.lineTo(14, 17); x.fill(); x.beginPath(); x.moveTo(23, 15); x.lineTo(19, 12); x.lineTo(18, 17); x.fill();
      x.beginPath(); x.moveTo(9, 21); x.lineTo(23, 21); x.lineTo(19, 25); x.lineTo(13, 25); x.fill();
      x.fillStyle = '#3a8a2a'; x.fillRect(15, 6, 2.5, 4);
    } else if (kind === 'heart') {
      x.fillStyle = '#ff5a8a'; x.beginPath(); x.moveTo(16, 26); x.bezierCurveTo(2, 16, 6, 6, 16, 12); x.bezierCurveTo(26, 6, 30, 16, 16, 26); x.fill();
    } else if (kind === 'egg') {
      const g = x.createLinearGradient(0, 6, 0, 28); g.addColorStop(0, '#ffd6ec'); g.addColorStop(0.5, '#cfe8ff'); g.addColorStop(1, '#fff1c4');
      x.fillStyle = g; x.beginPath(); x.ellipse(16, 17, 8.5, 11, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(160,120,220,0.8)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(8, 15); x.lineTo(24, 15); x.moveTo(8.5, 20); x.lineTo(23.5, 20); x.stroke();
    }
  });

  // ---------------------------------------------------------------- per-frame
  const api = {
    resize(w, h, hz) { W = w; H = h; HZ = hz; lightsKey = ''; moonPos = null; },
    /** the notch / status bar height (css px): the moon stays below it */
    safeTop(v) { moonSafeTop = v || 0; },
    /** behind the skyline. s: the scene's frame state { t, dt, L (look), P (palette), cam, tier, motion, force } */
    back(c, s) {
      const { L, P, t, dt, tier, motion } = s;
      const dark = L.w.night + L.w.late;
      // the sun: a soft disc and a wide warm glow, low over the skyline at dawn and golden hour, hidden higher by day haze
      // a high sun melts into the day's haze: only the low sun (dawn, golden hour) shows as a disc
      const sunA = P.sun * clamp01(1 - (L.sun.el - 12) / 16);
      if (sunA > 0.01 && L.sun.el > -7) {
        const p = s.skyPos(L.sun.az, L.sun.el);
        const r = 26 + 10 * clamp01(1 - (L.sun.el + 4) / 20);
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = sunA * 0.55; c.drawImage(glow(P.sunCol.map(Math.round)), p.x - r * 9, p.y - r * 6, r * 18, r * 12);
        c.globalAlpha = sunA * 0.9; c.drawImage(glow([255, 250, 236]), p.x - r * 1.6, p.y - r * 1.6, r * 3.2, r * 3.2);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      // the moon at its phase, a halo on clear nights
      if (L.moon.el > -2 && P.moonA > 0.05) {
        const r = Math.min(26, Math.max(15, W * 0.035));
        const p = moonPlace(L, r, s.signRect);
        const a = P.moonA * clamp01((L.moon.el + 2) / 5) * (0.35 + 0.65 * clamp01(L.moon.illum * 4));
        if (L.clear && dark > 0.4) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28 * a * dark; c.drawImage(glow([200, 210, 255]), p.x - r * 5, p.y - r * 5, r * 10, r * 10); c.globalCompositeOperation = 'source-over'; }
        c.globalAlpha = a * (0.55 + 0.45 * dark);
        c.drawImage(moonSprite(L.moon.phase), p.x - r * 1.23, p.y - r * 1.23, r * 2.46, r * 2.46);
        c.globalAlpha = 1;
        s.moonAt = { x: p.x, y: p.y, r };
        // tapped: a soft swell of light and a few sparkles circling it
        if (shimmer > 0) {
          shimmer = Math.max(0, shimmer - dt / 1600);
          const k = Math.sin(Math.PI * Math.min(1, (1 - shimmer) * 1.4));
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = 0.45 * k; c.drawImage(glow([210, 225, 255]), p.x - r * 6, p.y - r * 6, r * 12, r * 12);
          for (let i = 0; i < 7; i++) {
            const a = i / 7 * TAU + (1 - shimmer) * 2.4, d = r * (1.5 + (1 - shimmer) * 1.2);
            c.globalAlpha = 0.9 * k * (0.5 + 0.5 * Math.sin(i * 2.1 + t * 9));
            c.drawImage(glow([255, 250, 230]), p.x + Math.cos(a) * d - 3, p.y + Math.sin(a) * d - 3, 6, 6);
          }
          c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        }
      } else s.moonAt = null;
      lastMoon = s.moonAt;
      // the aurora: slow curtains of green and violet light over the skyline
      if (L.aurora || s.force.has('aurora')) aurora(c, t, CAPS[tier].aurora, motion, dark || 1);
      // shooting stars (a rare one any clear night, many on a shower's peak)
      const rate = (s.force.has('meteor') ? 8 : L.meteors) * (motion ? 1 : 0);
      if (rate && Math.random() < (rate / 60) * (dt / 1000)) meteors.push({ x: W * (0.1 + Math.random() * 0.8), y: HZ * (0.05 + Math.random() * 0.3), a: Math.PI * (0.62 + Math.random() * 0.16) * (Math.random() < 0.5 ? 1 : -1) + (Math.random() < 0.5 ? 0 : Math.PI), v: 520 + Math.random() * 420, life: 0, max: 0.55 + Math.random() * 0.5 });
      if (meteors.length) {
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        meteors = meteors.filter(m => {
          m.life += dt / 1000; const k = m.life / m.max; if (k >= 1) return false;
          const dx = Math.cos(m.a), dy = Math.abs(Math.sin(m.a));
          const hx = m.x + dx * m.v * m.life, hy = m.y + dy * m.v * m.life;
          const len = 90 * Math.sin(Math.PI * Math.min(1, k * 1.2));
          const g = c.createLinearGradient(hx - dx * len, hy - dy * len, hx, hy);
          g.addColorStop(0, 'rgba(200,220,255,0)'); g.addColorStop(1, `rgba(240,246,255,${0.9 * (1 - k)})`);
          c.strokeStyle = g; c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx - dx * len, hy - dy * len); c.lineTo(hx, hy); c.stroke();
          c.globalAlpha = 1 - k; c.drawImage(glow([220, 235, 255]), hx - 6, hy - 6, 12, 12); c.globalAlpha = 1;
          return true;
        });
        c.globalCompositeOperation = 'source-over';
      }
      // a satellite train: rarely, on clear nights, a line of evenly spaced points gliding across the sky; each one
      // brightens as it leaves the earth's shadow and fades as it goes back in
      if (motion && (s.force.has('satellites') && !s.satsDone || (dark > 0.6 && L.clear && !sats && (nextSats -= dt / 1000) <= 0))) {
        if (!sats) {
          s.satsDone = true; nextSats = 900 + Math.random() * 900;
          const dir = Math.random() < 0.5 ? 1 : -1, n = 22 + Math.floor(Math.random() * 14);
          const y0 = HZ * (0.06 + Math.random() * 0.2), y1 = y0 + HZ * (0.12 + Math.random() * 0.22);
          sats = { k: 0, dur: 38 + Math.random() * 14, dir, y0, y1, n, gap: 0.016 + Math.random() * 0.006, list: Array.from({ length: n }, () => ({ b: 0.6 + Math.random() * 0.4, ph: Math.random() * TAU })) };
        }
      }
      if (sats) {
        sats.k += dt / 1000 / sats.dur;
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < sats.n; i++) {
          const u = sats.k * (1 + sats.n * sats.gap) - i * sats.gap;     // each one a little behind the one ahead
          if (u <= 0 || u >= 1) continue;
          const fade = Math.min(1, u / 0.12, (1 - u) / 0.12);
          const x = sats.dir > 0 ? -10 + u * (W + 20) : W + 10 - u * (W + 20), y = sats.y0 + (sats.y1 - sats.y0) * u;
          const p = sats.list[i], a = fade * p.b * (0.85 + 0.15 * Math.sin(t * 3 + p.ph)) * dark;
          c.globalAlpha = 0.5 * a; c.drawImage(glow([220, 232, 255]), x - 4, y - 4, 8, 8);
          c.globalAlpha = a; c.fillStyle = '#f4f7ff'; c.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
        }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        if (sats.k >= 1) sats = null;
      }
      // fireworks behind the skyline (New Year, the Fourth of July) — only after dark
      const hol = L.holiday;
      const fw = s.force.has('fireworks') || (dark > 0.5 && hol && (hol.id === 'nye' || hol.id === 'july4'));
      if (fw && motion) {
        const finale = L.nye && L.nye.finale != null;
        nextRocket -= dt / 1000;
        if (nextRocket <= 0 && sparks.length < CAPS[tier].fw) {
          const cols = hol && hol.id === 'july4' ? [[255, 70, 80], [250, 250, 255], [80, 130, 255]] : [[255, 210, 110], [255, 90, 190], [120, 220, 255], [180, 255, 140], [255, 255, 255]];
          rockets.push({ x: W * (0.1 + Math.random() * 0.8), y: HZ, ty: HZ * (0.3 + Math.random() * 0.24), v: 300 + Math.random() * 140, col: cols[Math.floor(Math.random() * cols.length)] });
          nextRocket = finale ? 0.28 + Math.random() * 0.3 : 0.8 + Math.random() * 1.5;
        }
      }
      if (rockets.length || sparks.length) {
        c.globalCompositeOperation = 'lighter';
        rockets = rockets.filter(r => {
          r.y -= r.v * dt / 1000;
          c.globalAlpha = 0.8; c.drawImage(glow([255, 220, 180]), r.x - 3, r.y - 3, 6, 6);
          if (r.y > r.ty) return true;
          const n = tier ? 36 + Math.floor(Math.random() * 20) : 22 + Math.floor(Math.random() * 10);
          const big = 0.8 + Math.random() * 0.6;
          c.globalAlpha = 0.5; c.drawImage(glow(r.col), r.x - 60 * big, r.y - 60 * big, 120 * big, 120 * big);
          for (let i = 0; i < n; i++) { const a = (i / n) * TAU + Math.random() * 0.2, sp = (70 + Math.random() * 70) * big; sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1.4 + Math.random() * 0.9, col: r.col }); }
          return false;
        });
        sparks = sparks.filter(p => {
          p.life += dt / 1000; if (p.life > p.max) return false;
          p.vy += 46 * dt / 1000; p.vx *= 0.985; p.vy *= 0.985;
          p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
          const k = 1 - p.life / p.max;
          c.globalAlpha = k * k; c.drawImage(glow(p.col), p.x - 5, p.y - 5, 10, 10); if (tier === 2 && k > 0.6) { c.globalAlpha = (k - 0.6) * 2; c.drawImage(glow([255, 255, 255]), p.x - 2, p.y - 2, 4, 4); }
          return true;
        });
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      // the sleigh: very rarely, a silhouette crossing the moon on the Christmas nights
      if (motion && dark > 0.5 && ((hol && hol.id === 'christmas' && hol.full) || s.force.has('sleigh'))) {
        nextSleigh -= dt / 1000;
        if (!sleigh && (nextSleigh <= 0 || (s.force.has('sleigh') && !s.sleighDone))) { sleigh = { k: 0 }; s.sleighDone = true; nextSleigh = 420 + Math.random() * 600; }
      }
      if (sleighTrail.length) {
        c.globalCompositeOperation = 'lighter';
        sleighTrail = sleighTrail.filter(p => { p.life += dt / 1000; if (p.life > p.max) return false; p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; const k = 1 - p.life / p.max; c.globalAlpha = 0.85 * k * (0.6 + 0.4 * Math.sin(p.life * 20 + p.x)); c.drawImage(glow([255, 214, 140]), p.x - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2); return true; });
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      if (sleigh) {
        sleigh.k += dt / 12000;
        const sc = Math.min(1.05, Math.max(0.6, W * 0.46 / 200));
        const top = s.signRect ? s.signRect.y : HZ * 0.3;
        const x0 = -200 * sc, x1 = W + 40 * sc, x = x0 + (x1 - x0) * sleigh.k;
        const y = Math.max(34 * sc + 8, top - 24 - sleigh.k * 30 * sc) + Math.sin(sleigh.k * 7) * 3;
        if (Math.random() < 0.95) sleighTrail.push({ x: x - 34 * sc, y: y + 12 * sc, vx: -10 - Math.random() * 16, vy: 4 + Math.random() * 10, life: 0, max: 1 + Math.random() * 1.1, sz: 3 + Math.random() * 4 });
        drawSleigh(c, x, y, sc, t);
        if (sleigh.k >= 1) sleigh = null;
      }
    },
    /** on the near buildings: string lights, window glyphs, holiday neon signs. g: { roofs, windows, ox, oy } of the near layer */
    mid(c, s, g) {
      const { L, t } = s;
      const hol = L.holiday;
      if (!g) return;
      const night = clamp01(L.w.night + L.w.late + L.w.golden * 0.6 + L.w.dawn * 0.3);
      catStep(c, s, g, night);
      if (!hol) return;
      // Christmas lights: rooflines outlined in bulbs and strings down a few corners — a handful of buildings on the 1st,
      // most of the skyline by the 24th. Baked once into a canvas (glow and all); a few bulbs twinkle on top.
      if (hol.id === 'christmas') {
        const count = Math.round(hol.full ? 18 : 4 + hol.k * 12);
        const key = `${count}|${W}|${H}|${g.roofs.length}`;
        if (key !== lightsKey) { lights = bakeLights(g, count); lightsKey = key; }
        if (lights) {
          c.globalAlpha = 0.4 + 0.6 * night;
          c.drawImage(lights.c, g.ox + lights.x0, g.oy + lights.y0, lights.w, lights.h);
          c.globalCompositeOperation = 'lighter';
          for (const b of lights.tw) {
            c.globalAlpha = (0.3 + 0.7 * night) * Math.max(0, Math.sin(t * 1.7 + b.ph));
            c.drawImage(glow(b.col), g.ox + b.x - 6, g.oy + b.y - 6, 12, 12);
          }
          c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        }
      }
      // window glyphs: carved pumpkins, hearts, decorated eggs
      const kind = hol.id === 'halloween' ? 'pumpkin' : hol.id === 'valentine' && hol.full ? 'heart' : hol.id === 'easter' && hol.full ? 'egg' : null;
      const seen = g.windows.filter(w => g.top + w.y < HZ - 10 && g.top + w.y > HZ * 0.42 && w.x - g.margin > 10 && w.x - g.margin < W - 10);
      if (kind && seen.length) {
        const n = hol.full ? 12 : Math.round(4 + hol.k * 7);
        // one per column of the skyline, so they spread out instead of piling on one tower
        const R = rng(hol.id.length * 97);
        const cols = new Map();
        for (const w of seen) { const k = Math.floor((w.x - g.margin) / (W / 14)); if (!cols.has(k) || R() < 0.3) cols.set(k, w); }
        const picks = [...cols.values()].sort(() => R() - 0.5).slice(0, n);
        const tint = kind === 'pumpkin' ? [255, 140, 40] : kind === 'heart' ? [255, 80, 140] : [220, 200, 255];
        picks.forEach((w, i) => {
          const sz = Math.max(10, Math.min(13, W * 0.028));
          const x = Math.round(g.ox + w.x + w.w / 2), y = Math.round(g.oy + w.y + w.h / 2);
          const fl = kind === 'pumpkin' ? 0.82 + 0.18 * Math.sin(t * 9 + i * 3) * Math.sin(t * 3.7 + i) : 1;
          // the window it sits in: a warm lit pane with a dark frame
          const ww = sz * 1.25, wh = sz * 1.05;
          c.globalAlpha = 0.9; c.fillStyle = "rgba(8,6,14,0.9)"; c.fillRect(x - ww / 2 - 1, y - wh / 2 - 1, ww + 2, wh + 2);
          const pane = c.createLinearGradient(0, y - wh / 2, 0, y + wh / 2);
          pane.addColorStop(0, kind === 'pumpkin' ? 'rgba(120,52,14,1)' : kind === 'heart' ? 'rgba(110,28,60,1)' : 'rgba(80,66,120,1)');
          pane.addColorStop(1, kind === 'pumpkin' ? 'rgba(255,150,60,1)' : kind === 'heart' ? 'rgba(255,120,170,1)' : 'rgba(200,180,255,1)');
          c.globalAlpha = 0.6 * fl * (0.5 + 0.5 * night); c.fillStyle = pane; c.fillRect(x - ww / 2, y - wh / 2, ww, wh);
          // its light spills out
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = 0.5 * fl * (0.3 + 0.7 * night); c.drawImage(glow(tint), x - sz * 2, y - sz * 2, sz * 4, sz * 4);
          c.globalCompositeOperation = 'source-over';
          // the pumpkin / heart / egg on the sill
          c.globalAlpha = fl; c.drawImage(glyph(kind), x - sz * 0.45, y - wh / 2 + wh * 0.12, sz * 0.9, sz * 0.9);
        });
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      // the neon pumpkin (Halloween) / shamrock (St. Patrick's) sign on a near rooftop
      const early = !hol.full && hol.id === 'halloween' && hol.k >= 0.6;
      const sign = (hol.full || early) && hol.id === 'halloween' ? pumpkinSign() : hol.full && hol.id === 'stpatrick' ? shamrockSign() : null;
      if (sign && g.roofs.length) {
        // a roof near the middle (the sides hold the blades and the rooftop billboard)
        const right = g.roofs.filter(r => g.ox + r.x + r.w / 2 > W * 0.36 && g.ox + r.x + r.w / 2 < W * 0.64 && g.oy + r.y > HZ * 0.5);
        const roof = (right.length ? right : g.roofs).slice().sort((a, b) => a.y - b.y)[0];
        const sz = Math.min(58, roof.w * 0.78);
        const flick = Math.sin(t * 23) > 0.97 ? 0.4 : 1;
        const sx = g.ox + roof.x + roof.w / 2, sy = g.oy + roof.y + sz * 0.25 + sz * 0.45;
        c.globalAlpha = 0.85; c.drawImage(glow([4, 3, 10]), sx - sz * 0.75, sy - sz * 0.7, sz * 1.5, sz * 1.4); c.drawImage(glow([4, 3, 10]), sx - sz * 0.6, sy - sz * 0.55, sz * 1.2, sz * 1.1);
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = (0.55 + 0.45 * night) * flick * (early ? 0.6 : 1);
        c.drawImage(sign, g.ox + roof.x + roof.w / 2 - sz / 2, g.oy + roof.y + sz * 0.25, sz, sz * (sign.height / sign.width));
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
    },
    /** over everything: snow, petals, leaves, fireflies, bats */
    front(c, s) {
      const { L, t, dt, tier, motion } = s;
      const cap = CAPS[tier];
      const sec = dt / 1000;
      // snow: three depths, drifting on a slow wind
      const want = Math.round(cap.snow * L.snow);
      while (snow.length < want) snow.push({ x: Math.random() * W, y: Math.random() * H, z: 0.4 + Math.random() * 0.6, ph: Math.random() * TAU });
      if (snow.length > want) snow.length = want;
      if (snow.length) {
        for (const f of snow) {
          if (motion) { f.y += (18 + 34 * f.z) * sec; f.x += (Math.sin(t * 0.6 + f.ph) * 10 + 6) * f.z * sec; if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; } if (f.x > W + 4) f.x = -4; }
          c.globalAlpha = 0.35 + 0.55 * f.z;
          const r = 0.8 + 1.6 * f.z;
          c.drawImage(glow([255, 255, 255]), f.x - r * 2, f.y - r * 2, r * 4, r * 4);
        }
        c.globalAlpha = 1;
      }
      // spring petals, autumn leaves: a few at a time, tumbling across
      const season = L.season, hol = L.holiday;
      const petalsWant = motion ? Math.round(cap.petals * clamp01((season.spring - 0.4) / 0.4 + (hol && hol.id === 'easter' && hol.full ? 0.6 : 0))) : 0;
      const leavesWant = motion ? Math.round(cap.leaves * clamp01((season.autumn - 0.4) / 0.4 + (hol && hol.id === 'thanksgiving' && hol.full ? 0.6 : 0))) : 0;
      tumble(c, petals, petalsWant, t, sec, (x) => { x.fillStyle = 'rgba(255,190,214,0.9)'; x.beginPath(); x.ellipse(0, 0, 4, 2.3, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,240,246,0.7)'; x.beginPath(); x.ellipse(-1, -0.4, 1.8, 0.8, 0, 0, TAU); x.fill(); }, 0.6);
      tumble(c, leaves, leavesWant, t, sec, (x, f) => { x.fillStyle = f.col; x.beginPath(); x.moveTo(0, -5); x.quadraticCurveTo(5, -1, 0, 6); x.quadraticCurveTo(-5, -1, 0, -5); x.fill(); x.strokeStyle = 'rgba(80,30,10,0.5)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(0, -4); x.lineTo(0, 5); x.stroke(); }, 0.72);
      // fireflies on warm summer nights, low over the street
      const dark = L.w.night + L.w.late;
      const fliesWant = Math.round(cap.flies * clamp01((season.summer - 0.4) / 0.4) * clamp01(dark * 1.4) * (L.rain ? 0 : 1));
      while (flies.length < fliesWant) flies.push({ x: Math.random() * W, y: HZ - 10 + Math.random() * (H - HZ) * 0.5, ph: Math.random() * TAU, sp: 0.5 + Math.random() });
      if (flies.length > fliesWant) flies.length = fliesWant;
      if (flies.length) {
        c.globalCompositeOperation = 'lighter';
        for (const f of flies) {
          if (motion) { f.x += Math.sin(t * f.sp + f.ph) * 8 * sec; f.y += Math.cos(t * f.sp * 0.7 + f.ph) * 5 * sec; }
          const b = Math.max(0, Math.sin(t * 1.3 * f.sp + f.ph));
          c.globalAlpha = 0.75 * b * b; c.drawImage(glow([210, 255, 120]), f.x - 7, f.y - 7, 14, 14);
        }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      // bats (Halloween): a small flock every few minutes, rim-lit in neon
      if (motion && ((hol && hol.id === 'halloween' && hol.full) || s.force.has('bats'))) {
        nextBats -= sec;
        if (!bats && (nextBats <= 0 || (s.force.has('bats') && !s.batsDone))) {
          s.batsDone = true; nextBats = 150 + Math.random() * 180;
          const dir = Math.random() < 0.5 ? 1 : -1, n = 5 + Math.floor(Math.random() * 5);
          // each flock has its own neon (now and then a mixed flock)
          const base = BAT_NEON[Math.floor(Math.random() * BAT_NEON.length)];
          const mixed = Math.random() < 0.3;
          bats = { k: 0, dir, y: HZ * (0.18 + Math.random() * 0.3), list: Array.from({ length: n }, () => ({ dx: Math.random() * 140, dy: (Math.random() - 0.5) * 70, s: 0.7 + Math.random() * 0.6, ph: Math.random() * TAU, col: mixed ? BAT_NEON[Math.floor(Math.random() * BAT_NEON.length)] : base })) };
        }
      }
      // the witch: once every several minutes on the Halloween nights, across the moon when it's up, a trail of sparks
      if (motion && dark > 0.4 && ((hol && hol.id === 'halloween' && hol.full) || s.force.has('witch'))) {
        nextWitch -= sec;
        if (!witch && (nextWitch <= 0 || (s.force.has('witch') && !s.witchDone))) {
          s.witchDone = true; nextWitch = 360 + Math.random() * 300;
          const dir = Math.random() < 0.5 ? 1 : -1;
          const m = s.moonAt;
          witch = { k: 0, dir, y: m ? Math.max(HZ * 0.08, Math.min(HZ * 0.3, m.y)) : HZ * (0.1 + Math.random() * 0.14), size: Math.max(26, Math.min(44, W * 0.085)) };
        }
      }
      if (witch || trail.length) {
        let wx = 0, wy = 0;
        if (witch) {
          witch.k += sec / 11;
          wx = witch.dir > 0 ? -90 + witch.k * (W + 180) : W + 90 - witch.k * (W + 180);
          wy = witch.y + Math.sin(witch.k * 5) * 10 - witch.k * 18;
          if (Math.random() < 0.9) trail.push({ x: wx - witch.dir * witch.size * 0.9, y: wy + witch.size * 0.18, vx: -witch.dir * (10 + Math.random() * 20), vy: 6 + Math.random() * 14, life: 0, max: 0.9 + Math.random() * 0.8, col: Math.random() < 0.5 ? [255, 160, 60] : [140, 255, 120] });
        }
        c.globalCompositeOperation = 'lighter';
        trail = trail.filter(p => { p.life += sec; if (p.life > p.max) return false; p.x += p.vx * sec; p.y += p.vy * sec; const k = 1 - p.life / p.max; c.globalAlpha = 0.8 * k; c.drawImage(glow(p.col), p.x - 3, p.y - 3, 6, 6); return true; });
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        if (witch) { drawWitch(c, wx, wy, witch.size, t, witch.dir); if (witch.k >= 1) witch = null; }
      }
      ufoStep(c, s, sec);
      if (bats) {
        bats.k += sec / 9;
        const x0 = bats.dir > 0 ? -160 + bats.k * (W + 320) : W + 160 - bats.k * (W + 320);
        for (const b of bats.list) {
          const x = x0 - bats.dir * b.dx, y = bats.y + b.dy + Math.sin(bats.k * 9 + b.ph) * 14;
          drawBat(c, x, y, 9 * b.s, Math.sin(t * 18 + b.ph), bats.dir, b.col);
        }
        if (bats.k >= 1) bats = null;
      }
    },
    /** a tap at (x, y): the UFO zips off, the cat hops away, the moon shimmers (three taps: a shooting star). Returns what was hit. */
    hit(x, y) {
      const d = (a, b) => Math.hypot(x - a, y - b);
      if (ufo && ufo.st !== 'out' && ufo.at && d(ufo.at.x, ufo.at.y) < ufo.sw * 0.75) { ufo.st = 'out'; ufo.k = 0; ufo.flash = 1; return 'ufo'; }
      if (cat && cat.at && !cat.hop && d(cat.at.x, cat.at.y - cat.at.s * 0.5) < Math.max(20, cat.at.s * 1.3)) { cat.hop = { k: 0 }; return 'cat'; }
      if (lastMoon && !moonUnderButtons && d(lastMoon.x, lastMoon.y) < lastMoon.r * 2) {
        shimmer = 1;
        const now = performance.now();
        moonTaps = moonTaps.filter(m => now - m < 5000).concat(now);
        if (moonTaps.length >= 3) {
          moonTaps = [];
          meteors.push({ x: lastMoon.x + 10, y: lastMoon.y + 4, a: Math.PI * 0.18, v: 620, life: 0, max: 0.9 });
        }
        return 'moon';
      }
      return null;
    },
    debug: () => ({ sats: !!sats, ufo: ufo ? ufo.st : null, cat: cat ? (cat.at ? 'here' : 'placed') : null, snow: snow.length, petals: petals.length, leaves: leaves.length, flies: flies.length, bats: !!bats, witch: !!witch, meteors: meteors.length, sparks: sparks.length, sleigh: !!sleigh, lights: lights ? lights.length : 0 }),
    destroy() { for (const c of sprites.values()) { c.width = 0; c.height = 0; } sprites.clear(); },
  };

  function tumble(c, list, want, t, sec, paint, sz) {
    while (list.length < want) list.push({ x: -20 - Math.random() * W * 0.5, y: Math.random() * H * 0.8, vx: 30 + Math.random() * 40, vy: 14 + Math.random() * 18, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 3, ph: Math.random() * TAU, col: ['#e0702a', '#c8401c', '#e8a33a', '#b8571e'][Math.floor(Math.random() * 4)] });
    if (list.length > want) list.length = want;
    for (const f of list) {
      f.x += f.vx * sec; f.y += (f.vy + Math.sin(t * 1.4 + f.ph) * 16) * sec; f.r += f.vr * sec;
      if (f.x > W + 20 || f.y > H + 20) { f.x = -20; f.y = Math.random() * H * 0.6; }
      c.save(); c.translate(f.x, f.y); c.rotate(f.r); c.scale(sz * (0.8 + 0.4 * Math.abs(Math.sin(t + f.ph))), sz);
      c.globalAlpha = 0.85; paint(c, f); c.restore();
    }
    c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- Christmas lights, baked
  function bakeLights(g, count) {
    const R = rng(1225);
    const roofs = g.roofs.filter(r => g.top + r.y > HZ * 0.34 && g.top + r.y < HZ - 14 && r.w >= 22 && r.x - g.margin > -10 && r.x - g.margin < W + 10)
      .sort(() => R() - 0.5).slice(0, count);
    if (!roofs.length) return null;
    const WARM = [255, 214, 150], COLS = [[255, 70, 80], [255, 200, 80], [80, 230, 140], [90, 160, 255], [255, 130, 220]];
    const bulbs = [];
    for (const r of roofs) {
      const multi = R() < 0.55;
      const pick = () => (multi ? COLS[Math.floor(R() * COLS.length)] : WARM);
      // the roofline
      for (let x = r.x + 2; x <= r.x + r.w - 2; x += 4.6) bulbs.push({ x, y: r.y + 1.4, col: pick() });
      // a string down one corner, sometimes both
      if (R() < 0.5) { const sx = R() < 0.5 ? r.x + 1.6 : r.x + r.w - 1.6, run = Math.min(r.h - 6, 30 + R() * 50); for (let y = r.y + 6; y < r.y + run; y += 4.6) bulbs.push({ x: sx, y, col: pick() }); }
      // a sagging string from this roof to the next, when they're close
      const nb = g.roofs.find(o => o !== r && o.x > r.x + r.w - 2 && o.x - (r.x + r.w) < 40 && Math.abs(o.y - r.y) < 60);
      if (nb && R() < 0.6) {
        const x0 = r.x + r.w - 3, y0 = r.y + 4, x1 = nb.x + 3, y1 = nb.y + 4, n = Math.max(5, Math.round((x1 - x0) / 5)), sag = 8 + R() * 10;
        for (let k = 1; k < n; k++) { const tt = k / n; bulbs.push({ x: x0 + (x1 - x0) * tt, y: y0 + (y1 - y0) * tt + Math.sin(tt * Math.PI) * sag, col: pick() }); }
      }
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const b of bulbs) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x); y1 = Math.max(y1, b.y); }
    x0 -= 8; y0 -= 8; x1 += 8; y1 += 8;
    const sc = Math.min(2, window.devicePixelRatio || 1);
    const cv = mk((x1 - x0) * sc, (y1 - y0) * sc), x = cv.getContext('2d');
    x.scale(sc, sc);
    x.globalCompositeOperation = 'lighter';
    for (const b of bulbs) { x.globalAlpha = 0.55; x.drawImage(glow(b.col), b.x - x0 - 5.5, b.y - y0 - 5.5, 11, 11); }
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    for (const b of bulbs) {
      x.fillStyle = rgba(b.col, 1); x.beginPath(); x.arc(b.x - x0, b.y - y0, 1.15, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.arc(b.x - x0 - 0.3, b.y - y0 - 0.3, 0.45, 0, TAU); x.fill();
    }
    const tw = bulbs.filter((_, i) => i % 6 === 0).map(b => ({ ...b, ph: R() * TAU }));
    if (lights && lights.c) lights.c.width = 0;
    return { c: cv, x0, y0, w: x1 - x0, h: y1 - y0, tw, length: bulbs.length };
  }

  // ---------------------------------------------------------------- the cat
  // Some nights (about one in three, the same for everyone) a cat sits on a rooftop, tail swishing, eyes catching the neon.
  // Tap it and it springs away over the roofs; it comes back a few minutes later.
  function catNight(L) { const p = L.local || {}; const n = ((p.y * 372 + p.m * 31 + p.d) * 2654435761) >>> 0; return n % 3 === 0; }
  function catStep(c, s, g, night) {
    const { L, t, dt, motion } = s;
    const want = (s.force.has('cat') || (catNight(L) && night > 0.35)) && performance.now() > catGone;
    if (!want) { if (cat && !cat.hop) cat = null; if (!cat) return; }
    if (!cat) {
      const R = rng(((L.local && L.local.d) || 1) * 131 + 7);
      const spots = g.roofs.filter(r => r.w > 28 && g.top + r.y > HZ * 0.48 && g.top + r.y < HZ - 26 && ((r.x - g.margin > W * 0.06 && r.x - g.margin + r.w < W * 0.42) || (r.x - g.margin > W * 0.58 && r.x - g.margin + r.w < W * 0.94)));
      if (!spots.length) return;
      const r = spots[Math.floor(R() * spots.length)];
      cat = { r, u: 0.2 + R() * 0.6, face: r.x - g.margin < W / 2 ? 1 : -1, blink: 0, look: 0 };
    }
    const sz = Math.max(11, Math.min(18, W * 0.034));
    let x = g.ox + cat.r.x + cat.r.w * cat.u, y = g.oy + cat.r.y + 0.5, a = 1;
    if (cat.hop) {
      cat.hop.k += dt / 900;
      const k = Math.min(1, cat.hop.k);
      x += cat.face * -k * sz * 5; y += -Math.sin(k * Math.PI) * sz * 2.2 + k * k * sz * 1.5; a = 1 - k * k;
      if (cat.hop.k >= 1) { cat = null; catGone = performance.now() + 180000; return; }
    }
    cat.at = { x, y, s: sz };
    // eyes: a slow blink every few seconds; brighter just after a tap
    const bl = (t % 5.3) < 0.14 ? 0 : 1;
    c.globalAlpha = a;
    drawCat(c, x, y, sz, motion ? t : 0, cat.face, bl * (0.5 + 0.5 * night), !!cat.hop);
    c.globalAlpha = 1;
  }
  function drawCat(c, x, y, s, t, face, eyes, startled) {
    c.save(); c.translate(x, y); c.scale(face * s / 20, s / 20);
    c.shadowColor = 'rgba(255,120,210,0.55)'; c.shadowBlur = 5;
    c.fillStyle = '#05040a';
    // the body, sitting: haunch, back, neck, head with two ears, chest down to the paws
    c.beginPath();
    c.moveTo(-7, 0);
    c.bezierCurveTo(-9.5, -5, -8, -11, -3.5, -12.6);
    c.bezierCurveTo(-0.5, -13.6, 1.4, -13, 2.6, -12.2);
    c.bezierCurveTo(1.4, -14.8, 1.9, -17.4, 3.2, -18.3);
    c.lineTo(3.3, -21.4); c.lineTo(5.2, -19.1);
    c.quadraticCurveTo(6.4, -19.4, 7.6, -19.1);
    c.lineTo(9.5, -21.4); c.lineTo(9.6, -18.2);
    c.bezierCurveTo(11, -16.8, 10.9, -14, 9, -12.8);
    c.bezierCurveTo(8.2, -11, 7, -8, 6.6, -4);
    c.lineTo(7.2, 0); c.closePath();
    c.fill();
    // the tail curls along the roof and swishes
    const sw = Math.sin(t * 1.5) * 2.6 + Math.sin(t * 0.37) * 1.4;
    c.shadowBlur = 4;
    c.strokeStyle = '#05040a'; c.lineWidth = 2.1; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-6.5, -1); c.bezierCurveTo(-12, -0.5, -14 + sw * 0.4, -4, -12.5 + sw, -9 + Math.abs(sw) * 0.4); c.stroke();
    c.shadowBlur = 0;
    // a whisker of rim light along the back
    c.strokeStyle = 'rgba(255,150,220,0.35)'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(-8.6, -6); c.bezierCurveTo(-7.6, -10.6, -5, -12.4, -2.4, -12.9); c.stroke();
    // the eyes
    if (eyes > 0.05) {
      c.globalCompositeOperation = 'lighter';
      const ec = startled ? [255, 255, 160] : [190, 255, 110];
      for (const ex of [5.4, 8]) { c.globalAlpha *= 1; c.fillStyle = rgba(ec, eyes); c.beginPath(); c.ellipse(ex, -16, 0.9, startled ? 0.9 : 0.55, 0, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  }

  // ---------------------------------------------------------------- the UFO
  // On clear nights, every 8–18 minutes: a polished saucer glides in, hovers over a rooftop, lowers a soft beam (things
  // drift up it), then zips away with afterimages. Tap it and it leaves at once.
  const saucer = () => sprite('ufo', 360, 180, (x) => {
    x.scale(3, 3); // a 120 × 60 box; the hull's centre is (60, 33)
    let g = x.createLinearGradient(0, 33, 0, 47); g.addColorStop(0, '#47506a'); g.addColorStop(1, '#10131d');
    x.fillStyle = g; x.beginPath(); x.ellipse(60, 38.5, 30, 8.2, 0, 0, TAU); x.fill();
    g = x.createLinearGradient(0, 21, 0, 45);
    g.addColorStop(0, '#fbfcff'); g.addColorStop(0.32, '#c4cbdc'); g.addColorStop(0.55, '#7a839c'); g.addColorStop(0.8, '#3a4156'); g.addColorStop(1, '#1b1f2c');
    x.fillStyle = g; x.beginPath(); x.ellipse(60, 33, 52, 11, 0, 0, TAU); x.fill();
    // brushed rings
    x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 0.6; x.beginPath(); x.ellipse(60, 31.6, 49, 9, 0, Math.PI * 1.04, Math.PI * 1.96); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 0.5; x.beginPath(); x.ellipse(60, 30.4, 40, 6.6, 0, Math.PI * 1.06, Math.PI * 1.94); x.stroke();
    x.strokeStyle = 'rgba(12,14,24,0.7)'; x.lineWidth = 0.9; x.beginPath(); x.ellipse(60, 34.6, 51.4, 9.2, 0, 0.04, Math.PI - 0.04); x.stroke();
    // a specular sweep across the hull
    const sp = x.createRadialGradient(38, 27, 0, 38, 27, 26); sp.addColorStop(0, 'rgba(255,255,255,0.8)'); sp.addColorStop(0.5, 'rgba(255,255,255,0.18)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    x.save(); x.beginPath(); x.ellipse(60, 33, 52, 11, 0, 0, TAU); x.clip(); x.fillStyle = sp; x.fillRect(8, 18, 70, 24);
    // the city's magenta caught on the lower rim
    const rim = x.createLinearGradient(0, 38, 0, 44); rim.addColorStop(0, 'rgba(255,90,190,0)'); rim.addColorStop(1, 'rgba(255,90,190,0.45)');
    x.fillStyle = rim; x.fillRect(8, 36, 104, 10); x.restore();
    // the dome: tinted glass, a small pilot inside, a highlight
    x.save(); x.beginPath(); x.ellipse(60, 25.5, 19, 15.5, 0, Math.PI, 0); x.closePath(); x.clip();
    g = x.createRadialGradient(55, 15, 1, 60, 25, 21); g.addColorStop(0, 'rgba(215,252,255,0.92)'); g.addColorStop(0.5, 'rgba(100,200,235,0.62)'); g.addColorStop(1, 'rgba(26,62,120,0.85)');
    x.fillStyle = g; x.fillRect(38, 8, 44, 19);
    x.fillStyle = 'rgba(14,34,38,0.9)'; x.beginPath(); x.ellipse(61.5, 18.6, 5.2, 6.2, 0, 0, TAU); x.fill(); x.fillRect(55.5, 22, 12, 5);
    x.fillStyle = 'rgba(170,255,210,1)'; x.beginPath(); x.ellipse(59.6, 18.2, 1.4, 0.75, -0.35, 0, TAU); x.fill(); x.beginPath(); x.ellipse(63.5, 18.2, 1.4, 0.75, 0.35, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 1.2; x.lineCap = 'round'; x.beginPath(); x.arc(56, 23, 11.5, Math.PI * 1.13, Math.PI * 1.42); x.stroke();
    x.restore();
    x.strokeStyle = 'rgba(225,245,255,0.55)'; x.lineWidth = 0.6; x.beginPath(); x.ellipse(60, 25.5, 19, 15.5, 0, Math.PI, 0); x.stroke();
  });
  function ufoStep(c, s, sec) {
    const { L, t, motion } = s;
    const dark = L.w.night + L.w.late;
    if (!ufo && motion && s.mid && (s.force.has('ufo') && !s.ufoDone || (dark > 0.5 && !L.rain && (nextUfo -= sec) <= 0))) {
      s.ufoDone = true; nextUfo = 480 + Math.random() * 600;
      const g = s.mid;
      const roofs = g.rects.filter(r => r.x - g.margin + r.w / 2 > W * 0.3 && r.x - g.margin + r.w / 2 < W * 0.7 && g.top + r.y > HZ * 0.45 && g.top + r.y < HZ - 20);
      const r = roofs.length ? roofs[Math.floor(Math.random() * roofs.length)] : null;
      const sw = Math.max(56, Math.min(104, W * 0.16));
      const ty = r ? g.top + r.y : HZ * 0.82;
      const hx = r ? r.x - g.margin + r.w / 2 : W * 0.5;
      ufo = { st: 'in', k: 0, dir: Math.random() < 0.5 ? 1 : -1, hx, hy: Math.max(sw * 0.6 + 20, ty - Math.max(70, sw * 1.15)), ty, sw, beam: 0, ghosts: [], flash: 0 };
    }
    if (!ufo) { if (ufoBits.length) ufoBits = []; return; }
    const u = ufo;
    let x, y, tilt = 0, scale = 1;
    if (u.st === 'in') {
      u.k += sec / 3.4;
      const k = Math.min(1, u.k), e = 1 - Math.pow(1 - k, 3);
      x = u.hx + u.dir * -(W * 0.75) * (1 - e); y = u.hy - Math.sin(e * Math.PI) * 26 - (1 - e) * 60;
      tilt = u.dir * 0.22 * (1 - e);
      if (u.k >= 1) { u.st = 'hover'; u.k = 0; }
    } else if (u.st === 'hover') {
      u.k += sec / 8;
      x = u.hx + Math.sin(t * 0.8) * 5; y = u.hy + Math.sin(t * 2.1) * 3; tilt = Math.sin(t * 1.3) * 0.04;
      u.beam = Math.min(1, Math.max(0, Math.min((u.k - 0.18) / 0.08, (0.78 - u.k) / 0.08)));
      if (u.k >= 1) { u.st = 'out'; u.k = 0; }
    } else {
      u.k += sec / 1.1;
      const k = Math.min(1, u.k), e = k * k * k;
      const sx = u.ox ?? (u.ox = u.at ? u.at.x : u.hx), sy = u.oy ?? (u.oy = u.at ? u.at.y : u.hy);
      x = sx + u.dir * e * W * 1.3; y = sy - e * HZ * 0.9; tilt = -u.dir * 0.3 * Math.min(1, k * 3); scale = 1 - 0.65 * e;
      u.beam = Math.max(0, u.beam - sec * 6);
      u.ghosts.unshift({ x, y, scale, tilt }); if (u.ghosts.length > 6) u.ghosts.pop();
      if (u.k >= 1) { ufo = null; ufoBits = []; return; }
    }
    u.at = { x, y };
    const sw = u.sw * scale, sh = sw / 2;
    // the beam: a soft cone to the rooftop, bands of light rising, motes drifting up
    if (u.beam > 0.01) {
      const top = y + sw * 0.1, bot = u.ty, hw0 = sw * 0.16, hw1 = sw * 0.55;
      c.save(); c.globalCompositeOperation = 'lighter';
      const bg = c.createLinearGradient(0, top, 0, bot); bg.addColorStop(0, `rgba(170,255,235,${0.42 * u.beam})`); bg.addColorStop(1, `rgba(150,240,255,${0.06 * u.beam})`);
      c.fillStyle = bg; c.beginPath(); c.moveTo(x - hw0, top); c.lineTo(x + hw0, top); c.lineTo(x + hw1, bot); c.lineTo(x - hw1, bot); c.closePath(); c.fill();
      c.clip();
      for (let j = 0; j < 5; j++) { const yy = bot - ((t * 34 + j * (bot - top) / 5) % (bot - top)); c.globalAlpha = 0.16 * u.beam; c.fillStyle = '#c8fff0'; c.fillRect(x - hw1, yy, hw1 * 2, 1.2); }
      c.restore();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.5 * u.beam; c.drawImage(glow([160, 255, 230]), x - hw1 * 1.3, bot - hw1 * 0.35, hw1 * 2.6, hw1 * 0.7);
      if (motion && Math.random() < 0.6) ufoBits.push({ x: x + (Math.random() - 0.5) * hw1 * 1.4, y: bot - 2, life: 0, max: 1.4 + Math.random() });
      ufoBits = ufoBits.filter(p => { p.life += sec; if (p.life > p.max) return false; const k = p.life / p.max; p.y -= sec * (bot - top) / p.max; p.x += (x - p.x) * sec * 1.2; c.globalAlpha = 0.9 * Math.sin(Math.PI * k) * u.beam; c.drawImage(glow([230, 255, 245]), p.x - 2.5, p.y - 2.5, 5, 5); return true; });
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    // afterimages as it leaves
    if (u.ghosts.length > 1) for (let i = 1; i < u.ghosts.length; i++) { const gh = u.ghosts[i]; c.globalAlpha = 0.22 * (1 - i / u.ghosts.length); drawSaucer(c, gh.x, gh.y, u.sw * gh.scale, gh.tilt, t, 0); }
    c.globalAlpha = 1;
    // the light under it, then the saucer, then its chase lights
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.45 + 0.25 * Math.sin(t * 3); c.drawImage(glow([120, 240, 255]), x - sw * 0.45, y + sh * 0.05, sw * 0.9, sh * 0.6);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    drawSaucer(c, x, y, sw, tilt, t, 1);
    if (u.flash > 0) { u.flash = Math.max(0, u.flash - sec * 2.5); c.globalCompositeOperation = 'lighter'; c.globalAlpha = u.flash * 0.8; c.drawImage(glow([235, 250, 255]), x - sw, y - sw * 0.7, sw * 2, sw * 1.4); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  }
  function drawSaucer(c, x, y, sw, tilt, t, lightsOn) {
    const sh = sw / 2;
    c.save(); c.translate(x, y); c.rotate(tilt);
    c.drawImage(saucer(), -sw / 2, -sh * 0.55, sw, sh);
    if (lightsOn) {
      // chase lights around the rim: only the ones on the near side show
      const COLS = [[90, 245, 255], [255, 90, 210], [255, 220, 90], [130, 255, 150]];
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU + t * 1.6;
        const sn = Math.sin(a); if (sn < -0.05) continue;
        const lx = Math.cos(a) * sw * 0.41, ly = sh * 0.02 + sn * sh * 0.13;
        const b = 0.35 + 0.65 * Math.max(0, Math.sin(t * 7 - i * 0.9));
        const col = COLS[i % COLS.length];
        c.globalAlpha = b * (0.5 + 0.5 * sn); c.drawImage(glow(col), lx - 5, ly - 5, 10, 10);
        c.globalAlpha = Math.min(1, b + 0.2); c.fillStyle = rgba(col.map(v => Math.min(255, v + 80)), 1); c.beginPath(); c.arc(lx, ly, Math.max(0.9, sw * 0.012), 0, TAU); c.fill();
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  }

  // ---------------------------------------------------------------- where the moon sits
  // Its real path, framed for the screen: how far along its arc it is comes from how far it is between tonight's real moonrise
  // and moonset (rising at the left edge, setting at the right, mirrored in the south), how high comes from its true
  // elevation, mapped into the open sky above the rooftops. It only reaches the skyline at real moonrise / moonset and
  // never sits behind the sign (it passes over it); it glides to a new spot instead of jumping.
  let moonPos = null, moonSafeTop = 0, moonUnderButtons = false;
  function moonPlace(L, r, sign) {
    const az = L.moon.az, el = L.moon.el;
    // how far through tonight's pass (moonrise → moonset); facing south it rises on the left, in the south (facing north) on the right
    const arc = L.moon.u != null ? L.moon.u : clamp01((az - 60) / 240);
    const u = L.south ? 1 - arc : arc;
    const k = clamp01((el + 2) / 40), e = 1 - (1 - k) * (1 - k);
    const top = r + 24, low = HZ * 0.4;
    let x = r + 16 + (W - 2 * r - 32) * u, y = low + (top - low) * e;
    // phones (a portrait screen: the sign spans it): the moon arches over the sign through the night, fading in at moonrise
    // and out at moonset, clear of the corner buttons and under the notch / status bar
    if (W < 760 || H > W) {
      // a wide arch over the sign: rising beside the first N, over the top, setting beside the last N (it may pass behind
      // the corner buttons; it isn't tappable there)
      const safe = moonSafeTop;
      const x0 = sign ? Math.max(r * 0.2, sign.x - r - 12) : r + 10, x1 = sign ? Math.min(W - r * 0.2, sign.x + sign.w + r + 12) : W - r - 10;   // it may slip past the screen edge at rise / set
      const apex = safe + r + 8, base = sign ? sign.y + sign.h * 0.8 : HZ * 0.3;
      x = x0 + (x1 - x0) * (1 - Math.cos(Math.PI * u)) / 2;
      y = base - (base - apex) * Math.sin(Math.PI * u);
      moonUnderButtons = x > W - 80 - r * 0.5 && y < safe + 130;
    } else if (sign) {
      const sr = { x: sign.x - 34, y: sign.y - 44, w: sign.w + 68, h: sign.h + 50 };
      if (x > sr.x - r && x < sr.x + sr.w + r && y > sr.y - r && y < sr.y + sr.h + r) {
        const above = sr.y - r - 8;
        if (above >= top - 6) y = Math.min(y, above);
        else x = x < sr.x + sr.w / 2 ? Math.max(r + 6, sr.x - r - 4) : Math.min(W - r - 6, sr.x + sr.w + r + 4);
      }
    }
    if (!moonPos || Math.hypot(moonPos.x - x, moonPos.y - y) > W) moonPos = { x, y };
    else { moonPos.x += (x - moonPos.x) * 0.03; moonPos.y += (y - moonPos.y) * 0.03; }
    return { x: moonPos.x, y: moonPos.y };
  }

  function drawBat(c, x, y, s, flap, dir, col = [190, 90, 255]) {
    const up = flap * 0.9;
    c.save(); c.translate(x, y); c.scale(dir * s / 10, s / 10);
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(-4, -2 - up * 6, -10, -6 - up * 10, -18, -2 - up * 12);
    c.bezierCurveTo(-14, 0, -12, 2, -9, 4); c.bezierCurveTo(-7, 2, -5, 3, -3, 5);
    c.lineTo(0, 3); c.lineTo(3, 5);
    c.bezierCurveTo(5, 3, 7, 2, 9, 4); c.bezierCurveTo(12, 2, 14, 0, 18, -2 - up * 12);
    c.bezierCurveTo(10, -6 - up * 10, 4, -2 - up * 6, 0, 0);
    c.closePath();
    c.shadowColor = rgba(col, 0.95); c.shadowBlur = 9;
    c.fillStyle = '#0a0612'; c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = rgba(col.map(v => Math.min(255, v + 60)), 0.85); c.lineWidth = 0.9; c.stroke();
    c.restore();
  }

  // a witch on a broom, in silhouette with a cool moonlit rim; her cape and hair stream back, the broom's bristles flare
  function drawWitch(c, x, y, size, t, dir) {
    const s = size / 40;
    c.save(); c.translate(x, y); c.scale(dir * s, s); c.rotate(-0.08 + Math.sin(t * 2.2) * 0.04);
    const flap = Math.sin(t * 7);
    c.beginPath();
    // the broom: a long handle and a bundle of bristles behind
    c.moveTo(34, 6); c.lineTo(-24, 10); c.lineTo(-24, 12.4); c.lineTo(34, 8.4); c.closePath();
    c.moveTo(-22, 8); c.quadraticCurveTo(-34, 2, -46, -2); c.lineTo(-44, 6); c.quadraticCurveTo(-48, 12, -47, 20); c.quadraticCurveTo(-34, 17, -22, 14); c.closePath();
    // the cape: from the shoulders, streaming back, a scalloped flutter
    c.moveTo(4, -14); c.quadraticCurveTo(-12, -14 + flap * 2, -30, -8 + flap * 4); c.lineTo(-26, -3 + flap * 3); c.lineTo(-32, 0 + flap * 5); c.quadraticCurveTo(-14, 4, -2, 8); c.closePath();
    // the body, seated, a knee forward
    c.moveTo(-4, 8); c.quadraticCurveTo(-6, -8, 2, -16); c.quadraticCurveTo(10, -14, 12, -4); c.quadraticCurveTo(18, 2, 16, 8); c.closePath();
    // the boot
    c.moveTo(14, 6); c.lineTo(20, 14); c.lineTo(26, 14); c.lineTo(24, 11); c.lineTo(18, 7); c.closePath();
    // the head, the hair streaming back
    c.moveTo(9, -20); c.arc(5, -20, 4.6, 0, TAU);
    c.moveTo(2, -22); c.quadraticCurveTo(-8, -24 + flap * 2, -16, -18 + flap * 3); c.quadraticCurveTo(-6, -18, 1, -17); c.closePath();
    // the hat: a wide brim and a crooked tall crown, its tip bent back
    c.moveTo(-6, -23); c.quadraticCurveTo(5, -27, 17, -23); c.quadraticCurveTo(6, -21, -6, -23); c.closePath();
    c.moveTo(-1, -24); c.quadraticCurveTo(2, -34, 0, -40); c.quadraticCurveTo(-4, -44, -10, -42); c.quadraticCurveTo(-4, -40, -3, -36); c.quadraticCurveTo(4, -32, 11, -24.4); c.closePath();
    c.shadowColor = 'rgba(170,200,255,0.9)'; c.shadowBlur = 7;
    c.fillStyle = '#07060e'; c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(200,220,255,0.45)'; c.lineWidth = 0.7; c.stroke();
    c.restore();
  }

  // Santa's sleigh and four pairs of reindeer, in silhouette against the moon: galloping legs (two poses), antlers,
  // reins, the sleigh's curled runners and scrollwork, Santa with his hat and the sack; a faint moonlit rim
  function drawSleigh(c, x, y, s, t = 0) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#05060d'; c.strokeStyle = '#05060d'; c.lineCap = 'round'; c.lineJoin = 'round';
    c.shadowColor = 'rgba(200,215,255,0.95)'; c.shadowBlur = 6;
    const deer = (dx, dy, ph) => {
      const g = Math.sin(t * 9 + ph) > 0;   // gallop: stretched / tucked
      c.save(); c.translate(dx, dy);
      c.beginPath(); c.ellipse(0, 0, 11, 5, -0.05, 0, Math.PI * 2); c.fill();                 // body
      c.beginPath(); c.moveTo(7, -2); c.quadraticCurveTo(11, -7, 14, -11); c.lineTo(17, -10); c.quadraticCurveTo(13, -5, 10, 1); c.fill(); // neck
      c.beginPath(); c.ellipse(16.5, -11.5, 4.4, 2.4, -0.35, 0, Math.PI * 2); c.fill();       // head
      c.beginPath(); c.ellipse(20, -12.6, 1.6, 1.2, -0.3, 0, Math.PI * 2); c.fill();            // muzzle
      c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(14.5, -13); c.lineTo(11, -20); c.lineTo(8, -23); c.moveTo(11, -20); c.lineTo(13, -24); c.moveTo(12.6, -16.6); c.lineTo(9.5, -17.5);
      c.moveTo(16, -13.5); c.lineTo(14, -21); c.lineTo(12.5, -25); c.moveTo(14, -21); c.lineTo(16.5, -24); c.stroke();  // antlers
      c.beginPath(); c.moveTo(-10.5, -2); c.lineTo(-13.5, -4.5); c.lineTo(-11, -0.5); c.fill();  // tail
      c.lineWidth = 1.7;
      c.beginPath();
      if (g) { c.moveTo(7, 3); c.lineTo(14, 5); c.lineTo(18, 3); c.moveTo(5, 3); c.lineTo(11, 7); c.lineTo(15, 7); c.moveTo(-7, 3); c.lineTo(-14, 6); c.lineTo(-18, 8); c.moveTo(-5, 3); c.lineTo(-11, 7); c.lineTo(-15, 10); }
      else { c.moveTo(7, 3); c.lineTo(9, 9); c.lineTo(6, 12); c.moveTo(5, 3); c.lineTo(4, 9); c.lineTo(7, 12); c.moveTo(-7, 3); c.lineTo(-6, 9); c.lineTo(-9, 12); c.moveTo(-5, 3); c.lineTo(-3, 9); c.lineTo(-1, 12); }
      c.stroke();
      c.restore();
    };
    // the team (front pair first so the rear ones overlap them a touch)
    for (let i = 3; i >= 0; i--) { deer(70 + i * 30, -6 - i * 3, i * 1.3); deer(76 + i * 30, -2 - i * 3, i * 1.3 + 0.7); }
    // Rudolph's nose on the lead reindeer
    c.shadowBlur = 0; c.globalCompositeOperation = 'lighter';
    const nx = 76 + 0 * 30 + 21, ny = -2 - 12.6;
    c.globalAlpha = 0.9 + 0.1 * Math.sin(t * 6); c.drawImage(glow([255, 60, 60]), nx - 7, ny - 7, 14, 14);
    c.fillStyle = '#ff6a5a'; c.beginPath(); c.arc(nx, ny, 1.4, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#05060d';
    c.shadowColor = 'rgba(200,215,255,0.95)'; c.shadowBlur = 6;
    // reins from the sleigh to the team
    c.lineWidth = 0.6; c.beginPath(); c.moveTo(16, -12); c.quadraticCurveTo(50, -2, 70, -8); c.lineTo(160, -18); c.stroke();
    // the sleigh: a tall scrolled back, a curved body, runners curling up at the front
    c.beginPath();
    c.moveTo(-34, -16); c.quadraticCurveTo(-40, -22, -34, -26); c.quadraticCurveTo(-28, -28, -28, -20);
    c.lineTo(-26, -4); c.quadraticCurveTo(-4, -2, 10, -6); c.quadraticCurveTo(22, -10, 24, -18); c.quadraticCurveTo(28, -22, 30, -16);
    c.quadraticCurveTo(30, -4, 18, 2); c.quadraticCurveTo(-6, 8, -30, 6); c.quadraticCurveTo(-38, 2, -34, -16); c.fill();
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(-34, 12); c.lineTo(22, 12); c.quadraticCurveTo(34, 12, 34, 4); c.quadraticCurveTo(34, -2, 29, -1);
    c.moveTo(-22, 6); c.lineTo(-24, 12); c.moveTo(10, 4); c.lineTo(10, 12); c.stroke();
    // Santa: round body, a beard, the hat flying back with its bobble; the sack behind him
    c.beginPath(); c.ellipse(-8, -12, 9, 9, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(-4, -24, 5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-8, -27); c.quadraticCurveTo(-16, -34, -24, -30); c.quadraticCurveTo(-16, -29, -9, -23); c.fill();
    c.beginPath(); c.arc(-25, -30, 2.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-26, -6); c.quadraticCurveTo(-34, -22, -22, -26); c.quadraticCurveTo(-14, -22, -16, -8); c.fill();
    c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -14); c.quadraticCurveTo(8, -14, 14, -11); c.stroke();
    c.restore();
  }

  function aurora(c, t, strips, motion, dark) {
    if (!strips) return;
    // one soft strand: the curtain's colour bottom to top, feathered to nothing at both sides so neighbours melt together
    const band = sprite('aur2', 48, 128, (x, w, h) => {
      const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(60,255,170,0)'); g.addColorStop(0.08, 'rgba(70,255,170,0.85)'); g.addColorStop(0.45, 'rgba(90,230,200,0.35)'); g.addColorStop(0.8, 'rgba(170,110,255,0.22)'); g.addColorStop(1, 'rgba(170,110,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      const m = x.createLinearGradient(0, 0, w, 0); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.5, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalCompositeOperation = 'destination-in'; x.fillStyle = m; x.fillRect(0, 0, w, h);
    });
    c.globalCompositeOperation = 'lighter';
    const tt = motion ? t : 0;
    for (const [base, amp, ph, sp, a] of [[0.72, 0.06, 0, 0.11, 0.5], [0.62, 0.05, 2.2, 0.08, 0.34]]) {
      for (let i = 0; i < strips; i++) {
        const u = i / strips;
        const x = u * W * 1.1 - W * 0.05;
        const y = HZ * (base + amp * Math.sin(u * 7 + tt * sp * 3 + ph) + 0.03 * Math.sin(u * 23 + tt * sp * 7));
        const hgt = HZ * (0.22 + 0.1 * Math.sin(u * 5 + tt * sp * 2 + ph));
        const bw = W / strips * 7;   // wide, overlapping strands: the sum is one smooth curtain
        c.globalAlpha = a * dark * 0.75 * (0.72 + 0.28 * Math.sin(u * 5 + tt * 0.6 + ph)) * Math.sin(Math.PI * u);
        c.drawImage(band, x - bw / 2, y - hgt, bw, hgt);
      }
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  return api;
}
