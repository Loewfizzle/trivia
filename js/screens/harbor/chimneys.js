// CITY 2.0 — THE HARBOR: CHIMNEY SMOKE (11a-2 — Thanksgiving's afternoon + evening: the ovens + the hearths lit all over town; 9b's
// winter can switch it on the same way). Soft wisps rise from the speakeasy's own chimney (on its roof, by the billboard) and from the
// vents on a few roofs of the near skyline, leaning downwind in the REAL wind (the same reading as dayfx.js's flags), lit by the day —
// or, after dark, faint and warm from the city below. Each stack's puffs are a pure function of the clock (no state to drift): a puff
// leaves every `gap` s, grows, rises, bends with the wind and thins out. Reduced motion: the plume held still.
// set(k) 0..1 = the fires lit (eased). draw(c, f, pass): 'far' = the skyline's vents (before the speakeasy is drawn over them),
// 'near' = the speakeasy's chimney (after its roof).
import { project } from '../../core/harbor-layout.js';
import { winHash } from '../../core/harbor-windows.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
/** the numbers: a puff's life (s), the gap between puffs, the rise (world units / s), its radius (units: start + growth / s) */
export const SMOKE = Object.freeze({ life: 11, gap: 0.36, rise: 1.2, r0: 0.24, grow: 0.27, lean: 0.07, far: 5, big: 2.4 });   // (big: the skyline's furnace stacks × a house chimney)

export function createChimneys() {
  let stacks = [], k = 0, want = 0, first = true, drawn = 0, lastA = null;
  const sprites = new Map();
  // one soft puff per colour (quantised): a lumpy round cloud, white at its heart, feathered to nothing
  function sprite(col) {
    const key = col.map(v => Math.round(v / 12) * 12).join(',');
    let cv = sprites.get(key);
    if (cv) return cv;
    const S = 64;
    cv = Object.assign(document.createElement('canvas'), { width: S, height: S });
    const x = safeCtx(cv), [r, g, b] = key.split(',').map(Number);
    for (const [ox, oy, rr, a] of [[0, 0, 0.5, 0.9], [-0.16, 0.06, 0.3, 0.6], [0.15, -0.08, 0.3, 0.6], [0.05, 0.14, 0.26, 0.5]]) {
      const cx = S / 2 + ox * S, cy = S / 2 + oy * S, R = rr * S, gr = x.createRadialGradient(cx, cy, 0, cx, cy, R);
      gr.addColorStop(0, `rgba(${r},${g},${b},${a})`); gr.addColorStop(0.55, `rgba(${r},${g},${b},${a * 0.45})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
    }
    if (sprites.size > 24) sprites.delete(sprites.keys().next().value);
    sprites.set(key, cv);
    return cv;
  }
  return {
    SMOKE,
    layout(L) {
      stacks = [];
      const cam = L.cam;
      // the speakeasy's chimney (core/harbor-layout.js#roof.chimney)
      if (L.roof && L.roof.chimney && L.speakeasy) {
        const ch = L.roof.chimney, [x, y] = project(cam, ch.x, L.speakeasy.h + ch.h, ch.z);
        stacks.push({ x, y, s: cam.F / ch.z, z: ch.z, pass: 'near', seed: 11, w: 1, a: 1 });
      }
      // the near skyline's roof vents (blocks.js#roofClutter draws a vent box when the block's dice fall in 0.62..0.8): a few, spread out
      const cand = [];
      for (const bd of L.bands || []) {
        if (bd.id !== 'near' && bd.id !== 'mid') continue;
        for (const b of bd.blocks) {
          if (b.crown || b.kind === 'landmark') continue;
          const kk = b.k ?? winHash(b.seed, 3, 3, 3, 3), s = cam.F / b.z0;
          if (kk < 0.62 || kk >= 0.8 || s <= 1.3) continue;
          const [a, ty] = project(cam, b.x0, (b.y0 || 0) + b.h, b.z0), [c] = project(cam, b.x1, 0, b.z0), w = c - a;
          if (w < 4) continue;
          const x = a + w * 0.7;
          if (x < 8 || x > cam.W - 8) continue;
          cand.push({ x, y: ty - 0.6 * s, s: s * SMOKE.big, z: b.z0, pass: 'far', seed: b.seed, w: 1, a: 0.8 });
        }
      }
      cand.sort((p, q) => p.x - q.x);
      const gapPx = cam.W / (SMOKE.far + 1);
      let lastX = -1e9;
      for (const c of cand) { if (c.x - lastX < gapPx * 0.7) continue; stacks.push(c); lastX = c.x; if (stacks.length > SMOKE.far) break; }
    },
    set(v) { want = clamp01(v || 0); if (first) { k = want; first = false; } },
    active: () => k > 0.01 || want > 0.01,
    draw(c, f, pass) {
      if (pass === 'far') { k += (want - k) * Math.min(1, (f.dt || 0.016) / 6); if (Math.abs(want - k) < 0.003) k = want; drawn = 0; }
      if (k < 0.01 || !stacks.length) return;
      const t = f.motion ? f.t : 40, LK = f.LK || {}, T = f.T || { day: 1, gold: 0, night: 0 };
      const wind = LK.wind == null ? 3 : LK.wind, dir = Math.sin(((LK.windDir == null ? 250 : LK.windDir)) * Math.PI / 180) >= 0 ? 1 : -1;
      const day = clamp01((T.day || 0) + 0.7 * (T.gold || 0)), night = 1 - day;
      // (by day a soft wood-smoke grey — darker than the bright sky behind it, so it reads — warmer at golden hour; after dark the smoke only
      // shows where the city's light catches it: dusky, warm)
      const col = mix(mix([158, 156, 164], [184, 156, 142], clamp01(T.gold || 0)), [150, 126, 134], night), A = (1 * day + 0.75 * night) * k * (f.fade == null ? 1 : f.fade);
      lastA = { A: +A.toFixed(3), day: +day.toFixed(2), fade: f.fade };
      if (A < 0.01) return;
      const sp = sprite(col), lean = SMOKE.lean * (0.6 + wind), n = Math.ceil(SMOKE.life / SMOKE.gap), tierN = f.tier === 0 ? Math.ceil(n * 0.6) : n;
      c.save();
      for (const st of stacks) {
        if (st.pass !== pass) continue;
        if (f.tier === 0 && st.pass === 'far' && st !== stacks.find(q => q.pass === 'far')) continue;
        const ph = winHash(st.seed, 5, 1, 1, 1) * SMOKE.gap, s = st.s;
        for (let i = 0; i < tierN; i++) {
          // (the i-th newest puff: its age now; each one born on the stack's own beat — a pure function of the clock)
          const born = Math.floor((t - ph) / SMOKE.gap) * SMOKE.gap + ph - i * SMOKE.gap, a = t - born;
          if (a < 0 || a > SMOKE.life) continue;
          const u = a / SMOKE.life, seedI = Math.floor(born / SMOKE.gap);
          const wob = Math.sin(born * 1.7 + st.seed) * 0.35 + Math.sin(t * 0.6 + seedI) * 0.12 * a;
          const dx = (dir * lean * Math.pow(a, 1.5) + wob * Math.min(1, a / 3)) * s, dy = -SMOKE.rise * a * s * (1 - 0.3 * u);
          const r = (SMOKE.r0 + SMOKE.grow * a) * s * st.w, al = A * 0.85 * smooth(0, 0.4, a) * Math.pow(1 - u, 1.2) * st.a;
          if (al < 0.004 || r < 0.5) continue;
          c.globalAlpha = al;
          c.drawImage(sp, st.x + dx - r, st.y + dy - r, r * 2, r * 2);
          drawn++;
        }
      }
      c.restore();
    },
    debug: () => ({ k: +k.toFixed(2), want, stacks: stacks.map(s => ({ x: Math.round(s.x), y: Math.round(s.y), s: +s.s.toFixed(2), pass: s.pass })), drawn, lastA }),
  };
}
