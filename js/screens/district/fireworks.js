// LIVING CITY — FIREWORKS (docs/title.md): the midnight finale of PARTY NIGHTS, New Year's Eve, the Fourth of July.
// Built for the phone first: a rocket with a sparkling tail, a flash at the burst, a full round bloom of a hundred sparks with
// glowing trails, a soft haze of its colour catching the clouds, then a slow, glittering, drifting fade. Everything is a
// pre-rendered sprite drawn additively; particle counts are capped per quality tier (tier 0 keeps the shape, drops the trails
// and the glitter). Its light on the city (light()) is read by the scene and painted onto the buildings and the wet street.
const TAU = Math.PI * 2;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const lerp = (a, b, t) => a + (b - a) * t;
const mixCol = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const CAP = [{ sparks: 46, trails: false, glitter: false, split: 0, max: 160 }, { sparks: 96, trails: true, glitter: true, split: 0, max: 420 }, { sparks: 150, trails: true, glitter: true, split: 7, max: 820 }];

export function createFireworks({ onBurst = null } = {}) {
  const sprites = new Map();
  const sprite = (key, w, h, paint) => { let c = sprites.get(key); if (!c) { c = mk(w, h); paint(c.getContext('2d'), w, h); sprites.set(key, c); } return c; };
  // a soft point of light: a white-hot heart in its colour, a wide soft falloff
  const spark = col => sprite(`sp|${col}`, 32, 32, x => {
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, rgba(col, 0.95)); g.addColorStop(0.5, rgba(col, 0.3)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  });
  // the bloom of light around a burst (and its haze on the clouds): a wide, gentle radial
  const bloom = col => sprite(`bl|${col}`, 128, 128, x => {
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, rgba(col, 0.8)); g.addColorStop(0.3, rgba(col, 0.3)); g.addColorStop(0.65, rgba(col, 0.08)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  });
  const flashSpr = sprite('flash', 96, 96, x => {
    const g = x.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,250,240,0.8)'); g.addColorStop(0.6, 'rgba(255,240,230,0.18)'); g.addColorStop(1, 'rgba(255,240,230,0)');
    x.fillStyle = g; x.fillRect(0, 0, 96, 96);
  });
  let rockets = [], sparks = [], blooms = [], light = { k: 0, col: [255, 255, 255], x: 0, y: 0 };
  let tier = 2;

  /** Launch one: from (x, y0) up to (x ± sway, ty), bursting in col ([r,g,b]; a second colour for a two-tone heart).
   *  big: the burst's radius in px. delay: seconds before it leaves. */
  function launch({ x, y0, ty, col, col2 = null, big = 90, delay = 0, speed = 0 }) {
    const h = y0 - ty;
    const v = speed || Math.max(260, h / 1.05);                 // ≈ 1 s to the top
    rockets.push({ x, y: y0, x0: x, ty, v, col, col2, big, t: -delay, sway: (Math.random() - 0.5) * 0.08, tick: 0 });
  }

  function burst(r) {
    const cap = CAP[tier];
    const n = Math.round(cap.sparks * (0.85 + Math.random() * 0.3));
    const twoTone = r.col2 || null;
    for (let i = 0; i < n; i++) {
      // a round bloom: most sparks near the rim (a shell), some filling it — a sphere seen flat
      const a = Math.random() * TAU, rim = Math.random() < 0.78;
      const sp = r.big * 2.2 * (rim ? 0.9 + Math.random() * 0.1 : 0.3 + Math.random() * 0.55) * (0.95 + Math.random() * 0.1);
      const inner = !rim && twoTone;
      sparks.push({
        x: r.x, y: r.y, px: r.x, py: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * (0.92 + Math.random() * 0.08),
        life: 0, max: 2.4 + Math.random() * 1.3, col: inner ? twoTone : r.col, size: (rim ? 1 : 0.8) * (0.65 + Math.random() * 0.7),
        tw: 3 + Math.random() * 9, ph: Math.random() * TAU, split: cap.split && rim && Math.random() < cap.split / n * 4 ? 0.45 + Math.random() * 0.2 : 0,
      });
    }
    blooms.push({ x: r.x, y: r.y, col: r.col, big: r.big, t: 0 });
    light = { k: 1, col: r.col, x: r.x, y: r.y };
    if (onBurst) onBurst({ x: r.x, y: r.y, col: r.col, big: r.big });
  }

  return {
    setTier(t) { tier = Math.max(0, Math.min(2, t | 0)); },
    launch,
    /** draw everything, advanced by dt ms (motion 0: nothing moves — the caller shows a still swell instead) */
    draw(c, dt, motion = 1) {
      if (!rockets.length && !sparks.length && !blooms.length) { light.k = Math.max(0, light.k - dt / 900); return; }
      const sec = Math.min(0.05, dt / 1000) * (motion ? 1 : 0);
      const cap = CAP[tier];
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.lineCap = 'round';
      // rockets: a bright head, a sway, a tail of tiny sparks
      rockets = rockets.filter(r => {
        r.t += sec;
        if (r.t < 0) return true;
        r.y -= r.v * sec; r.x = r.x0 + Math.sin(r.t * 6) * r.sway * 40;
        r.tick += sec;
        if (r.tick > 0.028 && sparks.length < cap.max) { r.tick = 0; sparks.push({ x: r.x, y: r.y + 3, px: r.x, py: r.y + 3, vx: (Math.random() - 0.5) * 26, vy: 30 + Math.random() * 40, life: 0, max: 0.35 + Math.random() * 0.3, col: [255, 214, 160], size: 0.42, tw: 0, ph: 0, split: 0, tail: true }); }
        c.globalAlpha = 0.9; c.drawImage(spark([255, 236, 200]), r.x - 5, r.y - 5, 10, 10);
        c.globalAlpha = 0.35; c.drawImage(spark([255, 200, 140]), r.x - 11, r.y - 11, 22, 22);
        if (r.y <= r.ty) { burst(r); return false; }
        return true;
      });
      // the flash and the bloom at each burst (a quick white flash, then the colour swelling into the haze and fading)
      blooms = blooms.filter(b => {
        b.t += sec;
        const k = b.t / 2.4; if (k >= 1) return false;
        // the flash: short (0.2 s), small, in the burst's own colour with a white heart — never a flat white disc
        const fl = Math.max(0, 1 - b.t / 0.2);
        if (fl > 0) {
          const fr = b.big * (0.28 + 0.5 * (1 - fl));
          c.globalAlpha = fl * 0.85; c.drawImage(bloom(b.col), b.x - fr * 1.4, b.y - fr * 1.4, fr * 2.8, fr * 2.8);
          c.globalAlpha = fl * fl * 0.55; c.drawImage(flashSpr, b.x - fr, b.y - fr, fr * 2, fr * 2);
        }
        // the colour blooming into the haze: a bright heart that grows with the shell, a wide soft wash that lingers
        const hr = b.big * (1.7 + 1.6 * k), br = b.big * (0.5 + 1.1 * Math.min(1, k * 1.8));
        c.globalAlpha = 0.45 * (1 - k) * (1 - k); c.drawImage(bloom(b.col), b.x - hr, b.y - hr, hr * 2, hr * 2);
        c.globalAlpha = 0.5 * Math.max(0, 1 - k * 1.5); c.drawImage(bloom(b.col), b.x - br, b.y - br, br * 2, br * 2);
        return true;
      });
      // the sparks: drag, gravity, a glowing trail, glitter as they fade, a few splitting into tiny white pops
      const g = 46;
      const next = [];
      for (const p of sparks) {
        p.life += sec;
        if (p.life > p.max) continue;
        p.px = p.x; p.py = p.y;
        const drag = Math.exp(-2.2 * sec);
        p.vx *= drag; p.vy = p.vy * drag + g * sec;
        p.x += p.vx * sec; p.y += p.vy * sec;
        const u = p.life / p.max, k = 1 - u;
        if (p.split && u > p.split) { p.split = 0; for (let j = 0; j < 5 && sparks.length + next.length < cap.max; j++) { const a = Math.random() * TAU, s = 25 + Math.random() * 35; next.push({ x: p.x, y: p.y, px: p.x, py: p.y, vx: p.vx * 0.3 + Math.cos(a) * s, vy: p.vy * 0.3 + Math.sin(a) * s, life: 0, max: 0.5 + Math.random() * 0.5, col: [255, 255, 255], size: 0.5, tw: 0, ph: 0, split: 0 }); } }
        // glitter: in the second half of its life the spark twinkles (a random fast flicker), now and then a bright white pop
        let a = p.tail ? k * 0.8 : Math.min(1, k * 1.6);
        if (cap.glitter && p.tw && u > 0.45) { const tw = 0.55 + 0.45 * Math.sin(p.life * p.tw * 4 + p.ph); a *= tw; if (tw > 0.985) a = Math.min(1, a + 0.6); }
        const sz = (p.tail ? 5 : 4.5 + 4 * (1 - u)) * p.size;   // small and hot: streaks, not puffs
        c.globalAlpha = a;
        c.drawImage(spark(p.col), p.x - sz / 2, p.y - sz / 2, sz, sz);
        // the trail: a short line back along its path, brightest while it's fast
        if (cap.trails && !p.tail && u < 0.7) {
          const sp2 = Math.hypot(p.vx, p.vy);
          if (sp2 > 18) {
            const tl = Math.min(1, sp2 / 120);
            c.globalAlpha = a * 0.7 * tl; c.strokeStyle = rgba(p.col, 1); c.lineWidth = 1.5 * p.size; c.beginPath(); c.moveTo(p.px - p.vx * sec * 7, p.py - p.vy * sec * 7); c.lineTo(p.x, p.y); c.stroke();
            c.globalAlpha = a * 0.5 * tl; c.strokeStyle = 'rgba(255,255,255,1)'; c.lineWidth = 0.7 * p.size; c.beginPath(); c.moveTo(p.px - p.vx * sec * 2, p.py - p.vy * sec * 2); c.lineTo(p.x, p.y); c.stroke();
          }
        }
        next.push(p);
      }
      sparks = next;
      c.restore();
      light.k = Math.max(0, light.k - sec / 0.9);
    },
    /** the light of the last burst on the city: { k 0..1, col, x, y } */
    light: () => light,
    count: () => sparks.length,
    busy: () => rockets.length > 0 || sparks.length > 0,
    clear() { rockets = []; sparks = []; blooms = []; light.k = 0; },
  };
}
