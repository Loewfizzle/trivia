// PRISM DROP effects layer: a full-screen canvas BEHIND the board (above the world) — prismatic shards from big
// clears that fly out and away into the background, light rings, a soft spark trail. Sprites are pre-rendered;
// the particle count is capped per quality tier, and it does nothing at all when idle.
const shardCache = new Map();

function shardSprite(color, size) {
  const key = `${color}|${size}`;
  if (shardCache.has(key)) return shardCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.translate(size / 2, size / 2);
  const r = size * 0.42;
  x.beginPath();
  x.moveTo(0, -r);
  x.lineTo(r * 0.82, r * 0.55);
  x.lineTo(-r * 0.7, r * 0.42);
  x.closePath();
  const g = x.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, color);
  g.addColorStop(1, 'rgba(255,255,255,0.15)');
  x.fillStyle = g;
  x.shadowColor = color;
  x.shadowBlur = size * 0.25;
  x.fill();
  x.lineWidth = Math.max(1, size * 0.04);
  x.strokeStyle = 'rgba(255,255,255,0.8)';
  x.stroke();
  shardCache.set(key, c);
  return c;
}

function ringSprite(size) {
  const key = `ring|${size}`;
  if (shardCache.has(key)) return shardCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  shardCache.set(key, c);
  return c;
}

export function createFx(canvas) {
  const ctx = canvas.getContext('2d');
  let parts = [];
  let rings = [];
  let cap = 180;
  let dpr = 1;
  let w = 0, h = 0;

  function resize(maxDpr = 2) {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    const nw = Math.round(r.width * dpr), nh = Math.round(r.height * dpr);
    if (nw !== w || nh !== h) { w = nw; h = nh; canvas.width = w; canvas.height = h; }
  }

  return {
    resize,
    setCap(n) { cap = n; if (parts.length > cap) parts = parts.slice(-cap); },
    get count() { return parts.length; },
    /**
     * Shatter cleared cells: cells [{ x, y (css px, canvas space), color }], from: centre the shards fly away from.
     */
    shatter(cells, { cx, cy, power = 1 } = {}) {
      const per = power >= 1 ? 3 : 2;
      for (const c of cells) {
        for (let k = 0; k < per; k++) {
          if (parts.length >= cap) parts.shift();
          const ang = Math.atan2(c.y - cy, c.x - cx) + (Math.random() - 0.5) * 1.6;
          const sp = (0.25 + Math.random() * 0.55) * (0.7 + power * 0.4);
          parts.push({
            x: c.x + (Math.random() - 0.5) * 10, y: c.y + (Math.random() - 0.5) * 10,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.05,
            r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.012,
            s: 10 + Math.random() * 16, z: 0, vz: 0.0006 + Math.random() * 0.0008,
            life: 0, max: 1100 + Math.random() * 900, color: c.color,
          });
        }
      }
    },
    ring(x, y, { size = 240, ms = 650 } = {}) {
      if (rings.length > 6) rings.shift();
      rings.push({ x, y, size, t: 0, ms });
    },
    clear() { parts = []; rings = []; ctx.clearRect(0, 0, canvas.width, canvas.height); },
    /** dt in ms; returns true if anything is still moving */
    draw(dt) {
      if (!parts.length && !rings.length) { if (this._dirty) { ctx.clearRect(0, 0, canvas.width, canvas.height); this._dirty = false; } return false; }
      this._dirty = true;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      for (const r of rings) {
        r.t += dt;
        const k = r.t / r.ms;
        const s = r.size * (0.3 + k * 1.4) * dpr;
        ctx.globalAlpha = Math.max(0, 1 - k) * 0.55;
        ctx.drawImage(ringSprite(128), r.x * dpr - s / 2, r.y * dpr - s / 2, s, s);
      }
      rings = rings.filter(r => r.t < r.ms);
      const next = [];
      for (const p of parts) {
        p.life += dt;
        if (p.life >= p.max) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.00012 * dt;
        p.vx *= 0.999;
        p.r += p.vr * dt;
        p.z = Math.min(0.85, p.z + p.vz * dt); // flying away into the background
        const k = p.life / p.max;
        const a = (1 - k) * (k < 0.08 ? k / 0.08 : 1);
        const sc = (1 - p.z * 0.8) * dpr;
        const spr = shardSprite(p.color, 48);
        const s = p.s * sc;
        ctx.globalAlpha = a * 0.95;
        const c = Math.cos(p.r), sn = Math.sin(p.r);
        ctx.setTransform(c, sn, -sn, c, p.x * dpr, p.y * dpr);
        ctx.drawImage(spr, -s / 2, -s / 2, s, s);
        next.push(p);
      }
      parts = next;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      return true;
    },
  };
}
