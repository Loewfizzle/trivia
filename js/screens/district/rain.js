// LIVE WEATHER — the rain (only when it really rains where the visitor is: core/sky.js#look → rain 0..1, wind, storm).
// Replaces the old tiled rain. Drawn in depth like a camera sees it:
//   veils(c, s)  behind the skyline: grey shafts of rain falling from distant clouds onto the far towers
//   drops(c, s)  over everything: three depths of drops (far: fine and faint, near: long, bright, a little soft), slanted by
//                the real wind, lit by lightning; splashes and spreading rings on the wet street; a fine spray over it
// Particles are capped per quality tier; every streak is a pre-baked sprite; Reduced effects shows a still, light rain.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const CAP = [120, 230, 360];
// depth bands: share of the drops, speed (px/s), length, width, alpha
const DEPTH = [
  { k: 0.5, v: [620, 760], len: [10, 16], w: 0.8, a: 0.3 },
  { k: 0.34, v: [880, 1050], len: [18, 28], w: 1.1, a: 0.42 },
  { k: 0.16, v: [1250, 1500], len: [34, 54], w: 1.8, a: 0.46 },
];

export function createRain() {
  let W = 1, H = 1, HZ = 1;
  let drops = [], splashes = [], rings = [];
  const TINTS = [[255, 120, 210], [110, 220, 255], [190, 150, 255]];
  const tinted = TINTS.map(col => { const cv = mk(8, 64), x = cv.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.7, `rgba(${col},0.5)`); g.addColorStop(0.94, `rgba(${col.map(v => Math.min(255, v + 60))},1)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(2.5, 0, 3, 64); return cv; });
  const streaks = DEPTH.map((d, i) => {
    // a drop's streak: transparent tail → a bright head, a soft edge on the near ones
    const cv = mk(8, 64), x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(210,225,255,0)'); g.addColorStop(0.7, 'rgba(215,228,255,0.55)'); g.addColorStop(0.94, 'rgba(240,246,255,1)'); g.addColorStop(1, 'rgba(240,246,255,0)');
    x.fillStyle = g;
    if (i === 2) { x.filter = 'blur(0.8px)'; }
    x.beginPath(); x.roundRect ? x.roundRect(2.5, 0, 3, 64, 1.5) : x.rect(2.5, 0, 3, 64); x.fill();
    return cv;
  });
  // the veils: a tile of streaks scrolled inside a fixed soft mask (fading at the cloud above and the haze below)
  let tile = null, mask = null, veil = null;
  function bakeVeil() {
    tile = mk(64, 256);
    const x = tile.getContext('2d');
    for (let i = 0; i < 80; i++) {
      const px = Math.random() * 64, py = Math.random() * 256, len = 20 + Math.random() * 40;
      x.strokeStyle = `rgba(200,210,235,${0.06 + Math.random() * 0.09})`; x.lineWidth = 0.8;
      for (const oy of [0, -256, 256]) { x.beginPath(); x.moveTo(px, py + oy); x.lineTo(px - len * 0.08, py + len + oy); x.stroke(); }
    }
    mask = mk(64, 256);
    const m = mask.getContext('2d');
    const g = m.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, 'rgba(0,0,0,1)'); g.addColorStop(0.85, 'rgba(0,0,0,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g; m.fillRect(0, 0, 64, 256);
    m.globalCompositeOperation = 'destination-in';
    const h = m.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = h; m.fillRect(0, 0, 64, 256);
    veil = mk(64, 256);
  }
  function veilAt(t) {
    const x = veil.getContext('2d');
    x.globalCompositeOperation = 'copy';
    const off = (t * 110) % 256;
    x.drawImage(tile, 0, off - 256); x.globalCompositeOperation = 'source-over'; x.drawImage(tile, 0, off);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(mask, 0, 0);
    x.globalCompositeOperation = 'source-over';
    return veil;
  }

  // the slant: facing south, a wind from the west (270°) blows the rain to the left
  const slantOf = L => Math.max(-0.42, Math.min(0.42, Math.sin((L.windDir || 250) * Math.PI / 180) * Math.min(1, (L.wind || 0) / 14) * 0.42));

  function spawn(d, any) {
    const b = DEPTH[d];
    return { d, x: Math.random() * (W + 200) - 100, y: any ? Math.random() * H : -40 - Math.random() * 120, v: b.v[0] + Math.random() * (b.v[1] - b.v[0]), len: b.len[0] + Math.random() * (b.len[1] - b.len[0]), tint: d >= 1 && Math.random() < 0.22 ? Math.floor(Math.random() * TINTS.length) : -1 };
  }

  return {
    resize(w, h, hz) { W = w; H = h; HZ = hz; drops = []; splashes = []; rings = []; },
    /** behind the skyline: distant shafts of rain under the clouds */
    veils(c, s) {
      const { L, t } = s;
      if (!L.rain) return;
      if (!veil) bakeVeil();
      const img = veilAt(s.motion ? t : 0);
      const k = slantOf(L) * 0.6, n = 3 + Math.round(L.rain * 3);
      const day = clamp01(L.w.day + L.w.dawn * 0.5 + L.w.golden * 0.5);
      const T = c.getTransform();
      for (let i = 0; i < n; i++) {
        const cx = ((i * 0.37 + 0.11) % 1) * W * 1.2 - W * 0.1 + Math.sin(t * 0.03 + i) * 20;
        const w = W * (0.12 + ((i * 0.53) % 1) * 0.14), top = HZ * (0.14 + ((i * 0.29) % 1) * 0.12), h = HZ * 0.92 - top;
        // skewed about the veil's top, so it leans with the wind like the drops
        c.setTransform(T.a, 0, k * T.a, T.d, T.e - k * T.a * top, T.f);
        c.globalAlpha = (0.3 + 0.4 * L.rain) * (0.55 + 0.45 * day);
        c.drawImage(img, cx - w / 2, top, w, h);
      }
      c.setTransform(T);
      c.globalAlpha = 1;
    },
    /** over everything: the drops, the splashes, the rings, the spray */
    drops(c, s, flash = 0) {
      const { L, P, dt, tier, motion } = s;
      const sec = dt / 1000;
      const want = L.rain ? Math.round(CAP[tier] * (0.3 + 0.7 * L.rain) * (motion ? 1 : 0.4)) : 0;
      if (!want && !drops.length && !splashes.length && !rings.length) return;
      while (drops.length < want) { const r = Math.random(); drops.push(spawn(r < DEPTH[0].k ? 0 : r < DEPTH[0].k + DEPTH[1].k ? 1 : 2, true)); }
      if (drops.length > want) drops.length = want;
      const k = slantOf(L);
      const day = clamp01(L.w.day + L.w.dawn * 0.6 + L.w.golden * 0.4);
      const lit = 0.75 + 0.25 * P.dark + flash * 1.6;           // a strike lights every drop at once
      const T = c.getTransform();
      // the drops, slanted with the wind (a skew: a drop's x shifts with its height)
      c.setTransform(T.a, 0, k * T.a, T.d, T.e - k * T.a * 0, T.f);
      c.globalCompositeOperation = day > 0.5 ? 'source-over' : 'lighter';
      for (const p of drops) {
        if (motion) { p.y += p.v * sec; if (p.y - p.len > H) { Object.assign(p, spawn(p.d, false)); continue; } }
        const b = DEPTH[p.d];
        c.globalAlpha = Math.min(1, b.a * lit * (day > 0.5 ? 0.8 : 1));
        c.drawImage(p.tint >= 0 && day < 0.5 ? tinted[p.tint] : streaks[p.d], p.x - k * p.y - b.w * 2, p.y - p.len, b.w * 4, p.len);
        // a near drop reaching the street: a splash
        if (motion && p.d >= 1 && p.y > HZ + 6 && p.y < H && Math.random() < (p.d === 2 ? 0.5 : 0.12) * sec * 30 && splashes.length < 40 * (tier + 1)) {
          splashes.push({ x: p.x, y: p.y, life: 0, max: 0.22 + Math.random() * 0.12, s: p.d === 2 ? 1.4 : 0.8 });
          Object.assign(p, spawn(p.d, false));
        }
      }
      c.setTransform(T);
      // splashes: a flat ring spreading on the water and a few droplets thrown up and falling back
      if (splashes.length) {
        c.lineWidth = 0.6;
        splashes = splashes.filter(sp => {
          sp.life += sec; const u = sp.life / sp.max; if (u >= 1) return false;
          const a = (1 - u) * (1 - u) * 0.5 * lit;
          c.strokeStyle = `rgba(215,222,255,${a * 0.8})`;
          c.beginPath(); c.ellipse(sp.x, sp.y, 1 + 4 * sp.s * u, (1 + 4 * sp.s * u) * 0.2, 0, 0, Math.PI * 2); c.stroke();
          c.fillStyle = `rgba(235,240,255,${a})`;
          for (let k = 0; k < 3; k++) {
            const dx = (k - 1) * 1.6 * sp.s * u + (k - 1) * 0.6, py = sp.y - (7 + k % 2 * 3) * sp.s * u * (1 - u) * 2.2;
            c.fillRect(sp.x + dx - 0.45, py - 0.45, 0.9, 0.9);
          }
          return true;
        });
      }
      // rings spreading in the puddles
      if (tier >= 1 && motion && L.rain && rings.length < 4 + L.rain * 8 && Math.random() < sec * (3 + 12 * L.rain)) rings.push({ x: Math.random() * W, y: HZ + 8 + Math.random() * (H - HZ - 16), t: 0, r: 5 + Math.random() * 11 });
      if (rings.length) {
        c.lineWidth = 0.8;
        rings = rings.filter(p => {
          p.t += sec / 0.9;
          const r = p.r * p.t * 2;
          c.strokeStyle = `rgba(170,170,255,${0.18 * (1 - p.t) * lit})`;
          c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.22, 0, 0, Math.PI * 2); c.stroke();
          return p.t < 1;
        });
      }
      // spray: heavy rain bouncing off the street makes a low, bright mist along it
      if (L.rain > 0.5) {
        const g = c.createLinearGradient(0, HZ - 6, 0, HZ + (H - HZ) * 0.5);
        const col = day > 0.5 ? '210,215,228' : '170,160,230';
        g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.25, `rgba(${col},${0.09 * (L.rain - 0.5) * 2})`); g.addColorStop(1, `rgba(${col},0)`);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, HZ - 6, W, (H - HZ) * 0.5 + 6);
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    },
    slant: slantOf,
    debug: () => ({ drops: drops.length, splashes: splashes.length, rings: rings.length }),
    destroy() { for (const x of [...streaks, ...tinted, tile, mask, veil]) if (x) x.width = 0; },
  };
}
