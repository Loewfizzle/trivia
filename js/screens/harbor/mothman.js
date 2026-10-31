// CITY 2.0 — THE MODELS PASS: THE MOTHMAN on THE NEON NEEDLE (core/harbor-mothman.js: his nights + the swap's timing; decisions.md §9).
// Two BAKED models (scripts/bake/mothman.mjs → assets/city/mothman/: Tencent HY 3D, AI-generated — ☰ → CREDITS), no three.js here:
//   THE PERCH   the tucked model crouched on the needle's tip, the wings folded like a cloak (the hooked peaks above the head), the hem
//               hanging round the spire; near-black, the needle's pink rim from below + a cool moon edge (baked); ~70 pt at 402
//   THE EYES    CODE (both models' sockets are dark + hollow): two red glows, BLINKING OUT OF SYNC, a slow look round, IN FRONT of the
//               tagline's plane (the overlay sits above it)
//   THE SWAP    the needle's light STUTTERS DARK (neon.moment('itemK') via cb.needle) and in the dark the one model becomes the other
//   THE GLIDE   the spread-wing model, NO FLAPS: in from far (the front three-quarter, growing, easing to a hover above the tip) / out
//               up + away (the rear three-quarter, shrinking, fading into the night); a slight bank (the sprite leaning), mirrored per side
// Drawn on its OWN overlay at the device's dpr (≤ 3×: the crisp layer's rule — nothing passes in front of him up there), only while he's
// here; perched it redraws only when something changes (a blink, the look, the needle, the veil). LAZY: the sprites load when he's due.
import { ctx2d } from '../../ui/canvas-safe.js';
import { knob } from '../../core/harbor-schedule.js';

const BASE = new URL('../../../assets/city/mothman/', import.meta.url);
const TALON = 0.383;          // (the talons' height in the perch model — the point of the needle under them; the hem hangs below)
const BODY_MATCH = 0.81;
const EYE_SPREAD = 1.4;      // (the glows a touch wider apart than the sockets: two eyes, never one red blob, unzoomed)      // (the glide sprite's scale at the swap vs the perch's: the same body size — head to feet — in both models)
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = u => u * u * (3 - 2 * u);
const easeOut = u => 1 - (1 - u) * (1 - u);

let loading = null, model = null;
function load() {
  if (loading) return loading;
  const img = name => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => res(i)); i.onerror = () => rej(new Error(`mothman ${name}`)); i.src = new URL(name, BASE).href; });
  loading = (async () => {
    const r = await fetch(new URL('mothman.json', BASE).href);
    if (!r.ok) throw new Error(`mothman.json ${r.status}`);
    const meta = await r.json();
    const [perch, glide] = await Promise.all([img('mothman-perch.webp'), img('mothman-glide.webp')]);
    model = { meta, perch, glide };
    return model;
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

export function createMothman() {
  let cv = null, x = null, cvKey = '', drawKey = '', lastDbg = null;
  const glowC = new Map();
  const glow = (col, core) => { const k = `${col}|${core}`; let c = glowC.get(k); if (!c) { c = document.createElement('canvas'); c.width = c.height = 64; const g = ctx2d(c); if (g) { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, core ? 'rgba(255,236,224,1)' : `rgba(${col},1)`); gr.addColorStop(core ? 0.16 : 0.12, `rgba(${col},1)`); gr.addColorStop(0.42, `rgba(${col},0.4)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); } glowC.set(k, c); } return c; };
  function overlay(left, top, w, h, d) {
    const key = `${Math.round(left)}|${Math.round(top)}|${Math.round(w)}|${Math.round(h)}|${d}`;
    if (cv && key === cvKey) return true;
    if (!cv) { cv = document.createElement('canvas'); cv.className = 'hb-moth'; cv.setAttribute('aria-hidden', 'true'); Object.assign(cv.style, { position: 'fixed', pointerEvents: 'none', zIndex: '2' }); document.body.appendChild(cv); }
    cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d)); cv.style.width = `${w}px`; cv.style.height = `${h}px`; cv.style.left = `${left}px`; cv.style.top = `${top}px`;
    x = ctx2d(cv); cvKey = key; drawKey = '';
    return !!x;
  }
  function free() { if (cv) { cv.width = cv.height = 0; cv.remove(); } cv = null; x = null; cvKey = ''; drawKey = ''; }

  /** the eyes: two glows (a red halo + a hot core) at the sprite's sockets, each blinking on its own clock, a slow look round */
  function eyes(c, pts, t, k, size, motion) {
    if (!pts || k <= 0.01) return '';
    const look = motion ? 0.55 * Math.sin(t * 0.37) + 0.25 * Math.sin(t * 0.93 + 1) : 0, beat = motion ? 0.88 + 0.12 * Math.sin(t * 1.7) : 1;
    let key = '';
    // (two DISTINCT points at phone size: the sockets ~2.7 pt apart at 84 pt — spread 1.4× about their middle, each a tight halo + a hot core)
    const mx = (pts[0][0] + pts[1][0]) / 2;
    pts = pts.map(([ex, ey]) => [mx + (ex - mx) * EYE_SPREAD, ey]);
    pts.forEach(([ex, ey], i) => {
      // (out of sync: each eye its own period + phase; now + then a double blink)
      const P = i ? 5.3 : 3.9, ph = (t + i * 1.7) % P, shut = motion && (ph < 0.13 || (i === 0 && ph > 1.9 && ph < 2.02 && Math.floor(t / P) % 3 === 0));
      key += shut ? 0 : 1;
      if (shut) return;
      const gx = ex + look, a = k * beat;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = a * 0.6; c.drawImage(glow('255,30,24', false), gx - size * 1.35, ey - size * 1.35, size * 2.7, size * 2.7);
      c.globalAlpha = a; c.drawImage(glow('255,52,34', true), gx - size * 0.55, ey - size * 0.55, size * 1.1, size * 1.1);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    });
    return key + Math.round(look * 4);
  }

  /**
   * per frame: s = { st (core/harbor-mothman.js#mothmanAt), tip [x, y] pt (the needle's tip), W, H, top (the safe top), dpr, t, motion,
   * veil (0..1: weather in front — he fades), dir (±1: the side he leaves / arrives by), cssTop (the canvas's page offset) },
   * cb = { needle(k | null) } → true while he's up
   */
  function frame(s, cb = {}) {
    const st = s.st;
    if (!st || st.phase === 'gone' || !s.tip) { if (cv) free(); if (cb.needle) cb.needle(null); lastDbg = st ? { phase: st.phase } : null; return false; }
    if (cb.needle) cb.needle(st.needle < 0.999 ? st.needle : null);
    if (!model) { load(); lastDbg = { phase: st.phase, loading: true }; return true; }
    const M = model.meta, d = Math.min(3, s.dpr || 2), P = knob('legend.mothman');
    const pf = M.perch.frames[0], kP = (P.size * Math.max(0.85, Math.min(1.2, s.W / 402))) / (pf.feet[1] - pf.top[1]);   // (pt a sprite px)
    const tx = s.tip[0], ty = s.tip[1], tal = pf.feet[1] - TALON * (pf.feet[1] - pf.top[1]);
    const perchBox = { x: tx - pf.feet[0] * kP, y: ty + 1 - tal * kP, w: M.perch.fw * kP, h: M.perch.fh * kP };
    const vis = clamp01(1 - (s.veil || 0));
    const dir = s.dir < 0 ? -1 : 1;
    if (st.model === 'perch') {
      // ---- PERCHED: a small overlay round him; redrawn only when the picture changes
      const pad = 10, left = perchBox.x - pad, top = perchBox.y - pad;
      if (!overlay(left, top, perchBox.w + pad * 2, perchBox.h + pad * 2, d)) return true;
      const eyePts = pf.eyes.map(([ex, ey]) => [perchBox.x + ex * kP - left, perchBox.y + ey * kP - top]);
      // (the draw key: the eyes' states + the look, quantised — most frames change nothing)
      const t = s.t, look = s.motion ? Math.round((0.55 * Math.sin(t * 0.37) + 0.25 * Math.sin(t * 0.93 + 1)) * 4) : 0;
      const shutA = s.motion && ((t % 3.9) < 0.13 || ((t % 3.9) > 1.9 && (t % 3.9) < 2.02 && Math.floor(t / 3.9) % 3 === 0)), shutB = s.motion && ((t + 1.7) % 5.3) < 0.13;
      const key = `p|${look}|${shutA ? 0 : 1}${shutB ? 0 : 1}|${Math.round(vis * 20)}|${Math.round((s.motion ? 0.88 + 0.12 * Math.sin(t * 1.7) : 1) * 10)}`;
      if (key !== drawKey) {
        drawKey = key;
        x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
        x.setTransform(d, 0, 0, d, 0, 0);
        x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
        x.globalAlpha = vis; x.drawImage(model.perch, 0, 0, M.perch.fw, M.perch.fh, pad, pad, perchBox.w, perchBox.h); x.globalAlpha = 1;
        eyes(x, eyePts, t, vis, Math.max(1.2, 1.3 * kP / 0.233), s.motion);
      }
      lastDbg = { phase: st.phase, model: 'perch', box: { x: Math.round(perchBox.x), y: Math.round(perchBox.y), w: Math.round(perchBox.w), h: Math.round(perchBox.h) }, eyes: eyePts.map(([a, b]) => [Math.round(a + left), Math.round(b + top)]), tip: [Math.round(tx), Math.round(ty)], needle: st.needle, scale: +kP.toFixed(3) };
      return true;
    }
    // ---- THE GLIDE: the sky over the city (full width, the safe top → under the needle), redrawn every frame while he moves
    const row = st.phase === 'in' ? 'toward' : 'away', gi = M.glide.rows.indexOf(row), cols = M.glide.cols, fi = gi * cols + Math.floor(cols / 2);
    const gf = M.glide.frames[fi], kG0 = kP * BODY_MATCH * 1.25;   // (both bakes in sprite px; the bodies measured in each: head → feet — + 25 %: seen from behind / in front his body is foreshortened)
    // (the body's centre at the swap: a little up off the tip — already in the air / still hovering — then the path)
    const bodyY0 = ty - 0.42 * (pf.feet[1] - pf.top[1]) * kP, hov = 0.1 * (pf.feet[1] - pf.top[1]) * kP;
    let cxp, cyp, sc, a, lean;
    if (st.phase === 'in') {
      // in OUT OF THE DISTANCE (the band under the tagline — never across the lit sign): a speck over the far city on one side, growing as
      // he comes, easing into a hover just above the tip
      const u = easeOut(clamp01(st.u)), far = 1 - u, kW = s.W / 402;
      cxp = tx - dir * s.W * 0.3 * far; cyp = bodyY0 - hov - 34 * kW * far;
      sc = kG0 * (0.16 + 0.84 * u); a = clamp01(st.u * 5); lean = -dir * 0.1 * Math.sin(Math.PI * u) + (s.motion ? 0.025 * Math.sin(s.t * 0.8) : 0);
    } else {
      // up + AWAY into the night: off over the far city on one side, climbing a little (the band under the tagline — never across the lit
      // sign), shrinking with the distance, fading out
      const u = clamp01(st.u), e = Math.pow(u, 1.1), kW = s.W / 402;
      cxp = tx + dir * (s.W * 0.3) * e + dir * hov * 0.4; cyp = bodyY0 - hov - 34 * kW * (1 - (1 - u) * (1 - u));
      sc = kG0 / (1 + 4.5 * u); a = 1 - clamp01((u - 0.55) / 0.45); lean = dir * 0.12 * Math.sin(Math.PI * Math.min(1, u * 1.4)) + (s.motion ? 0.02 * Math.sin(s.t * 0.7) : 0);
    }
    a *= vis;
    const gw = M.glide.fw * sc, gh = M.glide.fh * sc;
    const top = Math.max(0, s.top), bot = Math.min(s.H, ty + 0.6 * (pf.feet[1] - pf.top[1]) * kP);
    if (!overlay(0, top, s.W, Math.max(20, bot - top), d)) return true;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
    x.setTransform(d, 0, 0, d, 0, -top * d);
    if (a > 0.004) {
      x.save(); x.translate(cxp, cyp); x.rotate(lean); x.scale(dir, 1);
      // (the sprite placed by its body's centre — the model's half height — the bake's 'mid' point)
      const mx = gf.mid[0] * sc, my = gf.mid[1] * sc;
      x.globalAlpha = a; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.drawImage(model.glide, (fi % cols) * M.glide.fw, gi * M.glide.fh, M.glide.fw, M.glide.fh, -mx, -my, gw, gh);
      x.globalAlpha = 1;
      if (row === 'toward') eyes(x, gf.eyes.map(([ex, ey]) => [ex * sc - mx, ey * sc - my]), s.t, a, Math.max(0.7, 1.3 * sc / 0.233 / BODY_MATCH * 0.81), s.motion);
      x.restore();
    }
    drawKey = '';
    lastDbg = { phase: st.phase, model: 'glide', row, u: +st.u.toFixed(3), x: Math.round(cxp), y: Math.round(cyp), w: Math.round(gw), a: +a.toFixed(2), dir, tip: [Math.round(tx), Math.round(ty)], needle: st.needle };
    return true;
  }
  return {
    frame, load,
    ready: () => !!model,
    debug: () => lastDbg,
    stop() { free(); lastDbg = null; },
    destroy() { free(); for (const c of glowC.values()) c.width = 0; glowC.clear(); },
  };
}
