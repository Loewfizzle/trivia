// CITY 2.0 — PART 9a: THE RAIN (the Harbor's own — City 1.0's district/rain.js is the floor). Only when it really rains (core/harbor-weather.js
// → the scene's WXS.rain, eased: it starts as a few drops and builds) or a preview forces it.
//   veils(c, s)  behind the skyline: grey shafts of rain hanging from the cloud base over the far city + the harbor, leaning with the wind
//   drops(c, s)  over everything: streaks in THREE DEPTHS (far: fine, dim, short · mid · near: long, brighter, soft-edged), slanted by the
//                real wind (+ its gusts), LIT by what they pass: a coarse LIGHT GRID (every 300 ms) from the NEON logo, the signs, the
//                lamps — pink / cyan / amber streaks near the tubes + the globes; silver-grey by day. A strike lights every drop at once.
//                The mid drops land on the HARBOR as RINGS (denser with the rate), the near ones on the PROMENADE as SPLASHES.
// Batched: drops grouped by their quantized colour + alpha, ONE path + ONE stroke a batch (a tail + a head each). Particles capped per tier
// (tier 0: a lighter rain, never a stall). Reduced motion: a still, light rain.
import { safeCtx } from '../../ui/canvas-safe.js';
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const RAIN_CAP = [150, 280, 440];
/** SP3 — DRIZZLE vs RAIN vs HEAVY, clearly apart at a glance (the owner: RAIN as it is = the anchor; drizzle clearly LESS, heavy clearly
 *  MORE): the share of RAIN_CAP drawn (rain 0.55 → 0.74 as before; drizzle ~⅙ of it; heavy ~3×) + each streak's speed / length / width /
 *  brightness (× 1 at rain) */
export function rainLook(rain) {
  const r = Math.max(0, rain || 0), sm = (a, b, v) => { const u = Math.min(1, Math.max(0, (v - a) / (b - a))); return u * u * (3 - 2 * u); };
  const n = r <= 0.3 ? 0.03 + 0.3 * r : r <= 0.55 ? 0.12 + (0.74 - 0.12) * sm(0.3, 0.55, r) : 0.74 + (2.2 - 0.74) * sm(0.55, 0.9, r);
  const dz = 1 - sm(0.28, 0.5, r), hv = sm(0.62, 0.9, r);
  return { n, v: 1 - 0.42 * dz + 0.3 * hv, len: 1 - 0.55 * dz + 0.6 * hv, w: 1 - 0.28 * dz + 0.15 * hv, a: 1 - 0.38 * dz + 0.28 * hv, heavy: hv, drizzle: dz };
}
/** the depths: share, speed (pt/s), length (pt), width, alpha, landing (null / water / ground) */
const RAIN_DEPTH = [
  { k: 0.46, v: [520, 640], len: [8, 13], w: 0.75, a: 0.34, land: null },
  { k: 0.34, v: [780, 920], len: [16, 26], w: 1.05, a: 0.48, land: 'water' },
  { k: 0.2, v: [1080, 1300], len: [34, 58], w: 1.6, a: 0.56, land: 'ground' },
];
const CELL = 16;
/** the rain's lean (dx per dy): a west wind (270°) blows it to the left (we face south); the gusts add a slow sway */
export const rainSlant = (wind, dir, gust = wind, t = 0) => {
  const base = Math.sin((dir == null ? 250 : dir) * Math.PI / 180) * Math.min(1, (wind || 0) / 14) * 0.5;
  const sway = Math.min(0.18, Math.max(0, (gust - wind) / 40)) * Math.sin(t * 0.6) * Math.sign(base || 1);
  return Math.max(-0.6, Math.min(0.6, -(base + sway)));
};

export function createHarborRain() {
  let W = 1, H = 1, HZ = 1, drops = [], rings = [], splashes = [], grid = null, gw = 0, gh = 0, gridAt = -1e9;
  let tile = null, mask = null, veil = null;

  function spawn(d, any) {
    const b = RAIN_DEPTH[d];
    const p = { d, x: Math.random() * (W + 240) - 120, y: any ? Math.random() * H : -20 - Math.random() * 160, v: b.v[0] + Math.random() * (b.v[1] - b.v[0]), len: b.len[0] + Math.random() * (b.len[1] - b.len[0]), land: 1e9 };
    return p;
  }
  function landOf(p, s) {
    const b = RAIN_DEPTH[p.d];
    if (b.land === 'water' && s.water) p.land = s.water.y0 + Math.random() * (s.water.y1 - s.water.y0);
    else if (b.land === 'ground' && s.ground) p.land = s.ground.y0 + Math.pow(Math.random(), 0.8) * (H - s.ground.y0);
    else p.land = 1e9;
  }

  /** the light grid: each cell's [r, g, b, k] from the lights ({ x, y, r, col, k }) — the tubes + globes the drops pass */
  function buildGrid(lights) {
    gw = Math.ceil(W / CELL) + 1; gh = Math.ceil(H / CELL) + 1;
    if (!grid || grid.length !== gw * gh * 4) grid = new Float32Array(gw * gh * 4); else grid.fill(0);
    for (const L of lights) {
      if (!(L.k > 0.01)) continue;
      const r = L.r, x0 = Math.max(0, Math.floor((L.x - r) / CELL)), x1 = Math.min(gw - 1, Math.ceil((L.x + r) / CELL)), y0 = Math.max(0, Math.floor((L.y - r * (L.ry || 1)) / CELL)), y1 = Math.min(gh - 1, Math.ceil((L.y + r * (L.ry || 1)) / CELL));
      for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
        const dx = (gx * CELL - L.x) / r, dy = (gy * CELL - L.y) / (r * (L.ry || 1)), d2 = dx * dx + dy * dy;
        if (d2 >= 1) continue;
        const f = (1 - d2) * (1 - d2) * L.k, i = (gy * gw + gx) * 4;
        grid[i] += L.col[0] * f; grid[i + 1] += L.col[1] * f; grid[i + 2] += L.col[2] * f; grid[i + 3] += f;
      }
    }
  }
  const lightAt = (x, y) => {
    if (!grid) return null;
    const gx = Math.max(0, Math.min(gw - 1, Math.round(x / CELL))), gy = Math.max(0, Math.min(gh - 1, Math.round(y / CELL))), i = (gy * gw + gx) * 4, k = grid[i + 3];
    return k > 0.02 ? [grid[i] / k, grid[i + 1] / k, grid[i + 2] / k, Math.min(1.4, k)] : null;
  };

  function bakeVeil() {
    tile = mk(64, 256);
    const x = safeCtx(tile);
    for (let i = 0; i < 90; i++) {
      const px = Math.random() * 64, py = Math.random() * 256, len = 24 + Math.random() * 44;
      x.strokeStyle = `rgba(214,222,240,${0.06 + Math.random() * 0.1})`; x.lineWidth = 0.7 + Math.random() * 0.5;
      for (const oy of [0, -256, 256]) { x.beginPath(); x.moveTo(px, py + oy); x.lineTo(px, py + len + oy); x.stroke(); }
    }
    mask = mk(64, 256);
    const m = safeCtx(mask);
    const g = m.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.22, 'rgba(0,0,0,1)'); g.addColorStop(0.8, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g; m.fillRect(0, 0, 64, 256);
    m.globalCompositeOperation = 'destination-in';
    const h = m.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = h; m.fillRect(0, 0, 64, 256);
    veil = mk(64, 256);
  }
  function veilAt(t) {
    const x = safeCtx(veil);
    x.globalCompositeOperation = 'copy';
    const off = (t * 120) % 256;
    x.drawImage(tile, 0, off - 256); x.globalCompositeOperation = 'source-over'; x.drawImage(tile, 0, off);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(mask, 0, 0);
    x.globalCompositeOperation = 'source-over';
    return veil;
  }

  return {
    resize(w, h, hz) { if (w === W && h === H && hz === HZ) return; W = w; H = h; HZ = hz; drops = []; rings = []; splashes = []; grid = null; gridAt = -1e9; },
    /** the lights the drops catch: [{ x, y, r (pt), ry? (vertical squash), col [r,g,b], k }] (or a function giving them — asked only when
     *  due) — rebuilt at most every 300 ms */
    lights(list, now, every = 300) { if (now - gridAt < every && grid) return;   // (C4c: every 100 ms under a legendary — the drain takes the signs fast)
      gridAt = now; buildGrid((typeof list === 'function' ? list() : list) || []); },
    /** behind the skyline: shafts of rain hanging from the cloud base (s: { rain, slant, day, t, motion, top (the base), hz }) */
    veils(c, s) {
      if (!(s.rain > 0.02)) return;
      if (!veil) bakeVeil();
      const img = veilAt(s.motion ? s.t : 0), k = s.slant * 0.6, hv = rainLook(s.rain).heavy, n = 3 + Math.round(s.rain * 4) + Math.round(hv * 3);
      const T = c.getTransform(), top0 = s.top == null ? HZ * 0.18 : s.top;
      for (let i = 0; i < n; i++) {
        const cx = ((i * 0.37 + 0.11) % 1) * W * 1.25 - W * 0.12 + Math.sin(s.t * 0.025 + i) * 24;
        const w = W * (0.14 + ((i * 0.53) % 1) * 0.16), top = top0 + HZ * ((i * 0.29) % 1) * 0.08, h = HZ * 0.95 - top;
        c.setTransform(T.a, 0, k * T.a, T.d, T.e - k * T.a * top, T.f);
        c.globalAlpha = Math.min(1, (0.22 + 0.5 * s.rain) * (1 + 0.6 * hv)) * (0.5 + 0.5 * s.day) * (s.dim == null ? 1 : s.dim);
        c.drawImage(img, cx - w / 2, top, w, h);
      }
      c.setTransform(T); c.globalAlpha = 1;
    },
    /** over everything (s: { rain 0..1, slant, day 0..1, dt (ms), tier, motion, flash 0..1, water: { y0, y1 }, ground: { y0 } }) */
    drops(c, s) {
      const sec = Math.min(0.1, (s.dt || 16) / 1000), tier = s.tier == null ? 2 : s.tier;
      const RL = rainLook(s.rain), want = s.rain > 0.004 ? Math.round(RAIN_CAP[tier] * RL.n * (s.motion ? 1 : 0.4)) : 0;
      if (!want && !drops.length && !rings.length && !splashes.length) return;
      while (drops.length < want) { const r = Math.random(); const p = spawn(r < RAIN_DEPTH[0].k ? 0 : r < RAIN_DEPTH[0].k + RAIN_DEPTH[1].k ? 1 : 2, want - drops.length > 40); landOf(p, s); drops.push(p); }
      if (drops.length > want) drops.length = want;
      const k = s.slant || 0, day = clamp01(s.day), flash = s.flash || 0, night = 1 - day;
      // the batches: key = colour (quantized) + alpha level → [x0,y0,x1,y1,…] for the tail + the head of each streak
      const B = new Map();
      const add = (key, col, a, w, x0, y0, x1, y1) => { let b = B.get(key); if (!b) { b = { col, a, w, seg: [] }; B.set(key, b); } b.seg.push(x0, y0, x1, y1); };
      const q = v => Math.round(v / 32) * 32;
      const base = day > 0.5 ? [206, 212, 224] : [172, 186, 222];
      for (const p of drops) {
        if (s.motion) {
          p.y += p.v * RL.v * sec;
          if (p.y >= p.land) {
            if (p.d === 1 && rings.length < (14 + 30 * s.rain * (tier + 1) / 3) * (1 + 1.5 * RL.heavy)) rings.push({ x: p.x - k * p.y, y: p.y, t: 0, r: 2.5 + Math.random() * 3.5 + 2 * s.rain });
            else if (p.d === 2 && splashes.length < (10 + 22 * s.rain * (tier + 1) / 3) * (1 + 1.8 * RL.heavy)) splashes.push({ x: p.x - k * p.y, y: p.y, t: 0, s: (0.8 + Math.random() * 0.6) * (1 + 0.5 * RL.heavy) });
            Object.assign(p, spawn(p.d, false)); landOf(p, s); continue;
          }
          if (p.y - p.len > H) { Object.assign(p, spawn(p.d, false)); landOf(p, s); continue; }
        }
        const b = RAIN_DEPTH[p.d], ln = p.len * RL.len, hx = p.x - k * p.y, hy = p.y, tx = hx + k * ln, ty = hy - ln;
        if (hx < -40 || hx > W + 40) continue;
        // its light: the cell it falls through (a tube's colour near the tubes, the lamp's amber under a globe), a strike over all
        const L = night > 0.15 ? lightAt(hx, hy) : null;
        let col = base, a = b.a * (day > 0.5 ? 0.85 : 0.75) * RL.a;
        // (HEAVY: SHEETS of rain sweeping across in waves with the wind — bands of denser, brighter streaks travelling over the screen)
        if (RL.heavy > 0.02) { const u = Math.sin(((hx - (s.t || 0) * 70 * (k >= 0 ? -1 : 1)) / W) * Math.PI * 2.6 + hy * 0.002); a *= 1 + RL.heavy * (0.75 * Math.max(0, u) ** 2 - 0.25); }
        if (L) { const m = Math.min(1, L[3] * 0.9) * night; col = [base[0] + (L[0] - base[0]) * m, base[1] + (L[1] - base[1]) * m, base[2] + (L[2] - base[2]) * m]; a *= 1 + 1.6 * m; }
        if (flash > 0) { a = Math.min(1, a * (1 + 1.8 * flash)); col = [col[0] + (235 - col[0]) * flash, col[1] + (240 - col[1]) * flash, col[2] + (255 - col[2]) * flash]; }
        const cq = [q(col[0]), q(col[1]), q(col[2])], aq = Math.round(Math.min(1, a) * 10) / 10, key = ((((cq[0] >> 5) * 9 + (cq[1] >> 5)) * 9 + (cq[2] >> 5)) * 11 + Math.round(aq * 10)) * 3 + p.d;   // (a number: no string per drop)
        // the tail (fainter) + the head
        const mx = (hx + tx) / 2, my = (hy + ty) / 2;
        add(key * 2, cq, aq * 0.45, b.w * RL.w, tx, ty, mx, my);
        add(key * 2 + 1, cq, aq, b.w * RL.w, mx, my, hx, hy);
      }
      c.save(); c.lineCap = 'round';
      c.globalCompositeOperation = day > 0.5 ? 'source-over' : 'lighter';
      for (const bt of B.values()) {
        if (bt.a <= 0.02) continue;
        c.strokeStyle = `rgb(${bt.col[0]},${bt.col[1]},${bt.col[2]})`; c.globalAlpha = bt.a; c.lineWidth = bt.w;
        c.beginPath(); const sg = bt.seg; for (let i = 0; i < sg.length; i += 4) { c.moveTo(sg[i], sg[i + 1]); c.lineTo(sg[i + 2], sg[i + 3]); } c.stroke();
      }
      // THE RINGS on the harbor (flattened: the water seen low) + THE SPLASHES on the promenade's stones
      if (rings.length) {
        c.globalCompositeOperation = day > 0.5 ? 'source-over' : 'lighter'; c.lineWidth = 0.7;
        rings = rings.filter(r => {
          r.t += sec / 0.85; if (r.t >= 1) return false;
          const L = night > 0.15 ? lightAt(r.x, r.y - 30) : null, rr = r.r * (0.3 + r.t);
          const col = L ? L.slice(0, 3).map(v => Math.round(v)) : day > 0.5 ? [226, 232, 240] : [150, 160, 210];
          c.globalAlpha = (1 - r.t) * (day > 0.5 ? 0.42 : 0.3 + 0.4 * (L ? Math.min(1, L[3]) : 0)) * (0.6 + 0.4 * s.rain);
          c.strokeStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
          c.beginPath(); c.ellipse(r.x, r.y, rr, rr * 0.24, 0, 0, Math.PI * 2); c.stroke();
          return true;
        });
      }
      if (splashes.length) {
        c.globalCompositeOperation = day > 0.5 ? 'source-over' : 'lighter';
        splashes = splashes.filter(p => {
          p.t += sec / 0.28; if (p.t >= 1) return false;
          const u = p.t, a = (1 - u) * (1 - u), L = night > 0.15 ? lightAt(p.x, p.y - 20) : null;
          const col = L ? L.slice(0, 3).map(v => Math.round(v)) : day > 0.5 ? [232, 236, 244] : [190, 198, 236];
          c.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; c.strokeStyle = c.fillStyle;
          c.globalAlpha = a * 0.7; c.lineWidth = 0.8;
          c.beginPath(); c.ellipse(p.x, p.y, 1.2 + 4.2 * p.s * u, (1.2 + 4.2 * p.s * u) * 0.25, 0, 0, Math.PI * 2); c.stroke();
          c.globalAlpha = a * 0.9;
          for (let i = 0; i < 4; i++) { const dx = (i - 1.5) * 2.4 * p.s * u, dy = (7 + (i % 2) * 4) * p.s * u * (1 - u) * 2; c.fillRect(p.x + dx - 0.55, p.y - dy - 0.55, 1.1, 1.1); }
          return true;
        });
      }
      c.restore();
    },
    /** the light a point catches (the grid: [r, g, b, k] | null) — the puddles mirror it */
    lightAt: (x, y) => lightAt(x, y),
    debug: () => ({ drops: drops.length, rings: rings.length, splashes: splashes.length, lit: grid ? (() => { let n = 0; for (let i = 3; i < grid.length; i += 4) if (grid[i] > 0.02) n++; return n; })() : 0 }),
    destroy() { for (const x of [tile, mask, veil]) if (x) x.width = 0; drops = []; rings = []; splashes = []; grid = null; },
  };
}
