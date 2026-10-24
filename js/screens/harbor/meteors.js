// CITY 2.0 — THE HARBOR, PART 6b: SHOOTING STARS (plan.md "SHOOTING STARS RARER"; docs/harbor.md#part-6b). City 1.0 keeps its own
// (district/fx.js); the Harbor passes s.meteorArt.
//   RARER       a normal clear night ~1 every 38 min · a shower's PEAK night ~1 every 2.5 min · ±1 day ~1 every 9 min (core/sky.js#meteorsOf
//               names the shower) · a rare bright FIREBALL a few times a year (a big slow green-white streak that breaks up)
//   THE ART     a TAPERED streak with a hot bright head, a faint tint (green, blue-white, a touch of orange), varied speed, length, angle +
//               brightness; the odd one FLARES and breaks into sparks; a faint glowing TRAIN lingers a moment where it passed; on a shower
//               night they all fly out from the shower's RADIANT (east of the view: up + to the left, the city faces south)
// The moon's three-tap shooting star stays City 1.0's (fx.js draws its own). &force=meteor: one every few seconds; &force=fireball.
import { meteorsOf } from '../../core/sky.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const TINTS = [[200, 255, 214], [214, 232, 255], [236, 244, 255], [255, 214, 170]];
/** meteors a minute on the Harbor (y, m, d = the evening's date): { rate, shower } */
export function harborMeteorRate(y, m, d) {
  const o = meteorsOf(y, m, d);
  return { rate: o.rate >= 3 ? 0.4 : o.rate >= 1 ? 0.11 : 1 / 38, shower: o.shower };
}
export const FIREBALL_PER_MIN = 3 / (365 * 8 * 60);       // (a few a year over the night's hours)

export function createMeteors() {
  let list = [], W = 1, H = 1, dotC = null, rateKey = '', rate = { rate: 0, shower: null }, forcedAt = 0;
  const dot = () => {
    if (dotC) return dotC;
    dotC = document.createElement('canvas'); dotC.width = dotC.height = 32;
    const x = safeCtx(dotC), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return dotC;
  };
  function spawn(s, fire) {
    const R = Math.random, top = Math.max(20, (s.safeTop || 0) + 20), sky = Math.max(80, (s.skyline ? Math.min(...s.skyline) : H * 0.4) - top - 30);
    const x = W * (0.05 + R() * 0.9), y = top + R() * sky * 0.7;
    let ang;
    if (rate.shower && !fire) { const rx = -W * 0.35, ry = top - H * 0.1; ang = Math.atan2(y - ry, x - rx) + (R() - 0.5) * 0.12; }
    else ang = (R() < 0.5 ? 0.35 + R() * 0.5 : Math.PI - 0.35 - R() * 0.5);
    const v = fire ? 150 + R() * 60 : 380 + R() * 520, max = fire ? 2.6 + R() * 0.8 : 0.35 + R() * 0.55;
    list.push({ x, y, ang, v, life: 0, max, len: fire ? 150 : 50 + R() * 90, w: fire ? 4.5 : 1.1 + R() * 1.4, b: fire ? 1 : 0.55 + R() * 0.45, tint: fire ? [190, 255, 200] : TINTS[Math.floor(R() * TINTS.length)], flare: fire || R() < 0.15, fire, sparks: [], trainAt: null });
  }
  return {
    resize(w, h) { W = w; H = h; },
    /** the hook fx.js calls (in the sky, after the aurora): s = the frame state */
    draw(c, s) {
      const L = s.L, dt = Math.min(0.1, (s.dt || 16) / 1000), dark = clamp01(L.w.night + L.w.late);
      // tonight's rate (the evening's date: before 6 am the night before)
      const lc = L.local;
      if (lc) { const k = `${lc.y}-${lc.m}-${lc.d}-${lc.h < 6 ? 'am' : 'pm'}`; if (k !== rateKey) { rateKey = k; const dd = lc.h < 6 ? new Date(Date.UTC(lc.y, lc.m - 1, lc.d) - 864e5) : new Date(Date.UTC(lc.y, lc.m - 1, lc.d)); rate = harborMeteorRate(dd.getUTCFullYear(), dd.getUTCMonth() + 1, dd.getUTCDate()); } }
      const can = s.motion && dark > 0.5 && (L.meteors || 0) > 0;          // (clear + dark: core/sky.js's own gate)
      const forced = s.force.has('meteor'), fireF = s.force.has('fireball');
      if ((forced || fireF) && s.motion && performance.now() - forcedAt > (fireF ? 6000 : 2500)) { forcedAt = performance.now(); spawn(s, fireF); }
      else if (can && Math.random() < (rate.rate / 60) * dt) spawn(s, false);
      else if (can && Math.random() < (FIREBALL_PER_MIN / 60) * dt) spawn(s, true);
      if (!list.length) return;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      const D = dot();
      list = list.filter(m => {
        m.life += dt; const k = m.life / m.max;
        const dx = Math.cos(m.ang), dy = Math.sin(m.ang), hx = m.x + dx * m.v * m.life, hy = m.y + dy * m.v * m.life;
        // THE TRAIN: a faint glow where it passed, lingering ~0.9 s after the head has gone
        if (k >= 1) { if (!m.trainAt) m.trainAt = m.life; const tk = 1 - (m.life - m.trainAt) / (m.fire ? 2 : 0.9); if (tk <= 0 && !m.sparks.length) return false; }
        const life = Math.min(1, k), fade = k < 1 ? Math.sin(Math.PI * Math.min(1, life * 1.15)) : 0;
        const flare = m.flare ? 1 + 1.6 * Math.exp(-((life - 0.7) ** 2) / 0.006) : 1;
        const a = m.b * fade * flare;
        const len = m.len * (0.4 + 0.6 * Math.min(1, life * 2)), w = m.w * (m.flare ? 0.8 + 0.4 * flare : 1);
        if (k < 1) {
          // the streak: tapered to nothing at the tail, its width at the head; tinted, a white core
          const tx = hx - dx * len, ty = hy - dy * len, nx = -dy, ny = dx;
          const g = c.createLinearGradient(tx, ty, hx, hy);
          g.addColorStop(0, `rgba(${m.tint},0)`); g.addColorStop(0.7, `rgba(${m.tint},${(0.35 * a).toFixed(3)})`); g.addColorStop(1, `rgba(255,255,255,${Math.min(1, 0.95 * a).toFixed(3)})`);
          c.fillStyle = g; c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx + nx * w * 0.5, hy + ny * w * 0.5); c.lineTo(hx - nx * w * 0.5, hy - ny * w * 0.5); c.closePath(); c.fill();
          // the head: a hot point + its tinted glow
          c.globalAlpha = Math.min(1, a); const r = (m.fire ? 16 : 5) * (0.8 + 0.4 * flare);
          c.drawImage(D, hx - r, hy - r, r * 2, r * 2);
          // (breaking up: a flaring one sheds sparks near its end)
          if (m.flare && life > 0.72 && Math.random() < 0.6) m.sparks.push({ x: hx, y: hy, vx: dx * m.v * 0.25 + (Math.random() - 0.5) * 40, vy: dy * m.v * 0.25 + (Math.random() - 0.5) * 40, t: 0, max: 0.35 + Math.random() * 0.5 });
        }
        // the lingering train (a faint glow along the path)
        const tk = k < 1 ? 0.25 : Math.max(0, 1 - (m.life - (m.trainAt || m.life)) / (m.fire ? 2 : 0.9)) * 0.25;
        if (tk > 0.01) { const ex = m.x + dx * m.v * Math.min(m.life, m.max), ey = m.y + dy * m.v * Math.min(m.life, m.max), sx = ex - dx * m.len, sy = ey - dy * m.len; c.globalAlpha = 1; c.strokeStyle = `rgba(${m.tint},${(tk * m.b * 0.5).toFixed(3)})`; c.lineWidth = m.w * 0.8; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke(); }
        m.sparks = m.sparks.filter(p => { p.t += dt; if (p.t > p.max) return false; p.x += p.vx * dt; p.y += p.vy * dt + 20 * dt; c.globalAlpha = (1 - p.t / p.max) * 0.9; c.drawImage(D, p.x - 1.6, p.y - 1.6, 3.2, 3.2); return true; });
        return k < 1 || m.sparks.length || (m.trainAt != null && m.life - m.trainAt < (m.fire ? 2 : 0.9));
      });
      c.restore();
    },
    debug: () => ({ n: list.length, rate: +rate.rate.toFixed(3), shower: rate.shower ? rate.shower.id : null }),
    destroy() { list = []; if (dotC) dotC.width = 0; dotC = null; },
  };
}
