// CITY 2.0 — SKY-A: THE BLACKBIRD (core/harbor-blackbird.js: ONE flyby + its triggers; decisions.md §9). Drawn on its OWN full-device-dpr
// overlay ABOVE the NEON sign (a fixed canvas the size of its strip, only while it flies — ~1–2 MB at 3×): in the TR-3B's chase it
// crosses IN FRONT of the dark sign; on a solo sighting it flies the strip above the lit one (under the corner buttons).
//   THE CRAFT      ONE ART SWITCH (`art`): 'drawn' — a long, flat, near-black SR-71 in profile seen a hair from below: the chined forebody
//                  + the long needle nose, the cockpit's small hump, the big engine NACELLE with its inlet SPIKE, the twin canted TAILS on
//                  the nacelles, a sliver of the delta's underside; the sky's light along the chine, the city's neon as a rim at night —
//                  or 'model' (a baked SR-71 — scripts/bake/<blackbird recipe>: a slot for a sourced model; its sprites replace the
//                  drawing, the animation untouched). &bbart=model + the panel's TOOLS row A/B it once a bake exists.
//   THE FLYBY      the PLUMES (two: the near nacelle's + the far one's a hair above) — orange → white-hot core with 4–5 BOLD MACH
//                  DIAMONDS, ~1.75 bodies long at full burn; the VAPOR CONE (a bright white bell round the tail half, ~0.4 s); ONE thin
//                  SHOCK RING expanding from where it broke through (it stays where it formed); a SPEED STREAK along its path, fading
//   THE SOUND      the radio-static tell ~3 s before · the DOUBLE BOOM (two hits BB.boomGap apart) ~0.9 s after the cone · its SCREAM
//                  (audio/city-sound.js — polish: nothing waits on it)
//   THE SHAKE      at the first boom: onShake() (the scene: the roof signs flicker once, a few pigeons lift, the glass glints) — never the logo
import { ctx2d } from '../../ui/canvas-safe.js';
import { citySound, cityPrefetch } from '../../audio/city-sound.js';
import { BB, bbAt, bbLife } from '../../core/harbor-blackbird.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// ------------------------------------------------------------------ THE DRAWN SR-71 (nose → +x, the tail at 0, length 1; y down)
// The silhouette is everything at 60–75 pt: a needle nose, a flat body with its chine, the big nacelle hung low along it with a spike in
// front, two short fins standing on the nacelles at the back. Near-black with a blue cast; the light is two lines: the chine's lit edge
// (the sky) + the city's rim under it at night.
const FUSE = [[1.0, 0.004], [0.93, -0.004], [0.84, -0.011], [0.76, -0.016], [0.72, -0.03], [0.665, -0.034], [0.62, -0.024], [0.5, -0.021],
  [0.2, -0.019], [0.03, -0.013], [0.0, -0.008], [0.0, 0.012], [0.08, 0.02], [0.45, 0.024], [0.7, 0.02], [0.86, 0.013], [0.95, 0.008]];
const NAC = { x0: 0.035, x1: 0.56, y: 0.022, r: 0.03 };               // the near nacelle (its centre line + radius)
const SPIKE = [[0.56, -0.006], [0.66, 0.022], [0.56, 0.05]];          // its inlet spike
const FIN = [[0.225, -0.012], [0.13, -0.14], [0.065, -0.14], [0.055, -0.008]];
const FINF = [[0.25, -0.02], [0.16, -0.148], [0.098, -0.148], [0.085, -0.016]];   // the far fin (a sliver behind)
const WINGU = [[0.58, 0.026], [0.12, 0.05], [0.04, 0.046], [0.1, 0.03]];           // the delta's underside, a sliver below the body
function poly(x, pts) { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); }
function paintSR71(x, look) {
  const night = look.dark, day = clamp01(look.day + look.golden * 0.6) * (1 - night), gold = clamp01(look.golden * 1.4) * (1 - night);
  const body = mix([14, 15, 22], [30, 34, 46], day * 0.6), lit = mix(mix([60, 66, 92], [150, 162, 188], day), [220, 170, 130], gold * 0.6), dark = [6, 6, 10];
  // the far fin + the delta's underside (behind)
  x.fillStyle = rgb(mix(body, dark, 0.35)); poly(x, FINF); x.fill();
  x.fillStyle = rgb(mix(body, dark, 0.5)); poly(x, WINGU); x.fill();
  // the fuselage: lit along the top (the chine's upper facet), the lower facet in shade
  poly(x, FUSE);
  const g = x.createLinearGradient(0, -0.034, 0, 0.024);
  g.addColorStop(0, rgb(mix(body, lit, 0.55))); g.addColorStop(0.42, rgb(mix(body, lit, 0.12))); g.addColorStop(0.55, rgb(body)); g.addColorStop(1, rgb(mix(body, dark, 0.6)));
  x.fillStyle = g; x.fill();
  // the CHINE: a hard light line from the nose back along the side (the one tone break that says "SR-71")
  x.strokeStyle = rgb(lit, 0.75); x.lineWidth = 0.0055; x.lineCap = 'round';
  x.beginPath(); x.moveTo(0.995, 0.003); x.quadraticCurveTo(0.86, 0.004, 0.6, 0.009); x.lineTo(0.2, 0.008); x.stroke();
  // the cockpit's glass: two small dark panes with a glint
  x.fillStyle = rgb(mix([20, 26, 40], [90, 120, 160], day)); poly(x, [[0.72, -0.029], [0.695, -0.033], [0.665, -0.032], [0.665, -0.025], [0.72, -0.022]]); x.fill();
  x.fillStyle = rgb([255, 255, 255], 0.3 + 0.4 * day); x.fillRect(0.69, -0.031, 0.018, 0.0035);
  // the near NACELLE: a long cylinder, lit on top, its spike a lighter cone, the exhaust ring at the back
  const ng = x.createLinearGradient(0, NAC.y - NAC.r, 0, NAC.y + NAC.r);
  ng.addColorStop(0, rgb(mix(body, lit, 0.45))); ng.addColorStop(0.35, rgb(body)); ng.addColorStop(1, rgb(mix(body, dark, 0.7)));
  x.fillStyle = ng; x.beginPath(); x.moveTo(NAC.x1, NAC.y - NAC.r); x.lineTo(NAC.x0 + 0.02, NAC.y - NAC.r); x.lineTo(NAC.x0, NAC.y - NAC.r * 0.8);
  x.lineTo(NAC.x0, NAC.y + NAC.r * 0.8); x.lineTo(NAC.x0 + 0.02, NAC.y + NAC.r); x.lineTo(NAC.x1, NAC.y + NAC.r); x.closePath(); x.fill();
  const sg = x.createLinearGradient(0.56, 0, 0.655, 0); sg.addColorStop(0, rgb(mix([70, 74, 90], [170, 176, 190], day))); sg.addColorStop(1, rgb(mix([40, 42, 54], [120, 124, 140], day)));
  x.fillStyle = sg; poly(x, SPIKE); x.fill();
  x.strokeStyle = rgb(lit, 0.5); x.lineWidth = 0.004; x.beginPath(); x.moveTo(NAC.x1, NAC.y - NAC.r + 0.002); x.lineTo(NAC.x0 + 0.03, NAC.y - NAC.r + 0.002); x.stroke();
  // the near FIN on the nacelle (canted in: its outer face toward us, lit along its leading edge)
  const fg = x.createLinearGradient(0.06, -0.118, 0.215, 0); fg.addColorStop(0, rgb(mix(body, lit, 0.3))); fg.addColorStop(1, rgb(body));
  x.fillStyle = fg; poly(x, FIN); x.fill();
  x.strokeStyle = rgb(lit, 0.6); x.lineWidth = 0.004; x.beginPath(); x.moveTo(FIN[0][0], FIN[0][1]); x.lineTo(FIN[1][0], FIN[1][1]); x.stroke();
  // AT NIGHT: the city's neon as a rim under the body + the nacelle (magenta below, a cool edge on top) — a silhouette, never a flat cut-out
  if (night > 0.2) {
    x.globalCompositeOperation = 'source-atop';
    const rg = x.createLinearGradient(0, -0.04, 0, 0.05);
    rg.addColorStop(0, `rgba(150,170,255,${0.5 * night})`); rg.addColorStop(0.3, 'rgba(0,0,0,0)'); rg.addColorStop(0.75, 'rgba(0,0,0,0)'); rg.addColorStop(1, `rgba(255,80,190,${0.55 * night})`);
    x.fillStyle = rg; x.fillRect(-0.05, -0.15, 1.1, 0.25);
    x.globalCompositeOperation = 'source-over';
  }
}
/** the craft's sprite at len pt, d px a pt (the device's) → { cv, w, h, ox (the tail's x in the sprite), oy (the nacelle line) } */
function drawnSprite(len, look, d) {
  // (SKY-A refine: drawn a third DEEPER than true — at 60–75 pt a true-proportioned SR-71 is a needle. SKY-B — the owner: LONGER, a long
  // needle-nosed SR-71: at ~96 pt it reads with far less exaggeration — 15 % deeper than true)
  const W = len * 1.06, H = len * 0.25, ox = len * 0.03, oy = len * 0.18;
  const cv = mk(W * d, H * d), x = ctx2d(cv);
  if (!x) return null;
  x.setTransform(d, 0, 0, d, ox * d, oy * d); x.scale(len, len * 1.15);
  paintSR71(x, look);
  return { cv, w: W, h: H, ox, oy };
}

// ------------------------------------------------------------------ THE MODEL (THE MODELS PASS): "SR-71 blackbird (FREE) downloadable" by
// pablogcg05 (CC BY 4.0, ☰ → CREDITS) baked by scripts/bake/sr71.mjs → assets/city/sr71/: level, seen a little from below, nose → +x, in the
// three lights (blended by the hour). LAZY: fetched when the art switch asks for it; until it's in (or if it fails) the drawing stands in.
export const BB_ART_DEFAULT = 'model';
const SR71 = new URL('../../../assets/city/sr71/', import.meta.url);
let sr71Load = null, sr71 = null;
function loadSR71() {
  if (sr71Load) return sr71Load;
  const img = n => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => rej(new Error(n)); i.src = new URL(n, SR71).href; });
  sr71Load = (async () => { const r = await fetch(new URL('sr71.json', SR71).href); if (!r.ok) throw new Error('sr71.json'); const meta = await r.json(), sheets = {}; for (const lt of meta.lights) sheets[lt] = await img(`sr71-${lt}.webp`); sr71 = { meta, sheets }; return sr71; })();
  sr71Load.catch(() => { sr71Load = null; });
  return sr71Load;
}
/** the baked SR-71 at len pt (tail → nose), the hour's light blended, d px a pt → { cv, w, h, ox, oy, rot } — the tail at (ox, oy), level */
function sr71Sprite(len, look, d) {
  const M = sr71; if (!M) return null;
  const m = M.meta, k = len / m.lenPx, W = m.fw * k, H = m.fh * k, cv = mk(W * d, H * d), x = ctx2d(cv);
  if (!x) return null;
  const n = clamp01(look.dark), g = clamp01(look.golden || 0) * (1 - n), dd = Math.max(0, 1 - n - g);
  let sum = 0; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  for (const [lt, w] of [['day', dd], ['golden', g], ['night', n]]) if (w > 0.002 && M.sheets[lt]) { sum += w; x.globalAlpha = w / sum; x.drawImage(M.sheets[lt], 0, 0, m.fw, m.fh, 0, 0, W * d, H * d); }
  x.globalAlpha = 1;
  // AT NIGHT: the city's neon as a rim on the underside (the drawn one's magenta below) — through the sprite's own pixels
  if (n > 0.2) { x.globalCompositeOperation = 'source-atop'; const rg = x.createLinearGradient(0, 0, 0, H * d); rg.addColorStop(0, `rgba(150,170,255,${0.22 * n})`); rg.addColorStop(0.45, 'rgba(0,0,0,0)'); rg.addColorStop(1, `rgba(255,80,190,${0.3 * n})`); x.fillStyle = rg; x.fillRect(0, 0, W * d, H * d); x.globalCompositeOperation = 'source-over'; }
  return { cv, w: W, h: H, ox: m.tail[0] * k, oy: m.tail[1] * k, rot: Math.atan2(m.nose[1] - m.tail[1], m.nose[0] - m.tail[0]), model: true };
}

// ------------------------------------------------------------------ the module
export function createBlackbird() {
  // (MODELS: THE ART SWITCH's default is the baked SR-71 — it reads as the real aircraft at 96 pt (the delta, the nacelles, the chines)
  // where the drawing is a stylised profile; `&bbart=drawn` / TOOLS → THE BLACKBIRD DRAWN for the A/B)
  let cv = null, x = null, cvKey = '', fl = null, spr = null, sprKey = '', art = BB_ART_DEFAULT, lastDbg = null;
  const glows = new Map();
  const glow = col => { const k = col.join(','); let c = glows.get(k); if (!c) { c = mk(48, 48); const g = ctx2d(c); if (g) { const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24); gr.addColorStop(0, rgb(col, 1)); gr.addColorStop(0.3, rgb(col, 0.45)); gr.addColorStop(1, rgb(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 48, 48); } glows.set(k, c); } return c; };

  function overlay(W, top, h, d) {
    const key = `${W}|${Math.round(top)}|${Math.round(h)}|${d}`;
    if (cv && key === cvKey) return true;
    if (!cv) { cv = document.createElement('canvas'); cv.className = 'hb-bb'; cv.setAttribute('aria-hidden', 'true'); Object.assign(cv.style, { position: 'fixed', left: '0px', pointerEvents: 'none', zIndex: '2' }); document.body.appendChild(cv); }
    cv.width = Math.ceil(W * d); cv.height = Math.ceil(h * d); cv.style.width = `${W}px`; cv.style.height = `${h}px`; cv.style.top = `${top}px`;
    x = ctx2d(cv); cvKey = key;
    return !!x;
  }
  function free() { if (cv) { cv.width = cv.height = 0; cv.remove(); } cv = null; x = null; cvKey = ''; }

  // ---- the PLUME from (0, 0) back along −x, L pt long at full burn, w its half-width: an orange sheath, a violet-blue mid, a white-hot
  // core + 4–5 BOLD MACH DIAMONDS (crisp rhombi, a tight glow each), flickering a touch; additive
  function plume(c, L, w, k, t, i) {
    if (k <= 0.01) return;
    const len = L * (0.55 + 0.45 * k), fl = 0.94 + 0.06 * Math.sin(t * 57 + i * 2);
    const sheath = (l2, w2, col, a) => { const g = c.createLinearGradient(0, 0, -l2, 0); g.addColorStop(0, rgb(col, a)); g.addColorStop(0.5, rgb(col, a * 0.5)); g.addColorStop(1, rgb(col, 0));
      c.fillStyle = g; c.beginPath(); c.moveTo(0, -w2); c.quadraticCurveTo(-l2 * 0.45, -w2 * 1.05, -l2, 0); c.quadraticCurveTo(-l2 * 0.45, w2 * 1.05, 0, w2); c.closePath(); c.fill(); };
    sheath(len * fl, w * 1.35, [255, 120, 60], 0.55 * k);
    sheath(len * 0.72, w * 0.85, [170, 150, 255], 0.45 * k);
    sheath(len * 0.36, w * 0.6, [255, 248, 230], 0.9 * k);
    const n = k > 0.9 ? 5 : 4, sp = len * 0.17, COL = [[255, 255, 250], [255, 240, 200], [220, 210, 255], [255, 190, 120], [255, 150, 90]];
    for (let j = 0; j < n; j++) {
      const cx = -sp * (0.75 + j), dl = sp * 0.44 * (1 - j * 0.06), dh = w * (0.95 - j * 0.1), a = k * (1 - j * 0.13) * (0.85 + 0.15 * Math.sin(t * 43 + j));
      c.globalAlpha = Math.min(1, a * 0.7); const gs = dh * 3.6; c.drawImage(glow(COL[j]), cx - gs, -gs * 0.6, gs * 2, gs * 1.2);
      c.globalAlpha = Math.min(1, a); c.fillStyle = rgb(COL[j]); c.beginPath(); c.moveTo(cx - dl, 0); c.lineTo(cx, -dh); c.lineTo(cx + dl, 0); c.lineTo(cx, dh); c.closePath(); c.fill();
    }
    c.globalAlpha = k; c.drawImage(glow([255, 236, 210]), -w * 2.2, -w * 2.2, w * 4.4, w * 4.4);
    c.globalAlpha = 1;
  }

  /** start a flyby: kind ('chase' | 'solo' | 'watcher' | 'forced'), at (clock ms it ENTERS — the tell runs 3 s before), dir (±1), y (its
   *  height, pt), W (the screen's width) — one at a time (a second waits: false) */
  function start(kind, at, dir, y, o = {}) {
    if (fl && !fl.done) return false;
    fl = { kind, at, dir: dir < 0 ? -1 : 1, y, cues: new Set(), clip: o.clipTop || 0, clipBot: o.clipBot || null, done: false };
    prefetch();
    return true;
  }
  /** SKY-B — every Blackbird sound fetched + decoded AHEAD (the scene asks ~20 s before a solo sighting + at a TR-3B's start): the radio
   *  crackle then plays on its cue, never late or lost to the fetch */
  function prefetch() { for (const [slot, n] of [['bb-static', 3], ['bb-boom', 1], ['bb-scream', 1]]) for (let i = 0; i < n; i++) cityPrefetch(slot, i, { hold: 30000 }); if (art === 'model') loadSR71(); }
  /** per frame: s = { now (clock ms), W, H, dpr, look, t, motion }, cb = { onShake() } → true while it's up (the calm frame rate keeps 60) */
  function frame(s, cb = {}) {
    if (!fl) return false;
    const len = Math.max(84, Math.min(110, s.W * BB.len)), e = (s.now - fl.at) / 1000, st = bbAt(e, s.W, len);
    // THE SOUND, on the clock (a late page joins without the cues it missed). SKY-B — the owner: the RADIO CRACKLE must be CLEARLY heard
    // before it crosses, the music on or off: an EFFECT (the effects bus — the music button never mutes it), its level up with the boom's,
    // and with the music on the music DIPS under it (cb.duck: the city's own duck, like the noon whistle) — the boom the same
    const cue = (id, when, fn) => { if (!fl.cues.has(id) && e >= when) { fl.cues.add(id); if (e - when < 0.5) fn(); } };
    const pan = Math.max(-0.9, Math.min(0.9, (st.u - 0.5) * 1.6 * fl.dir));
    const play = (slot, o, duck) => (cb.duck && duck ? cb.duck(slot, { ...o, ...duck }) : citySound(slot, { ...o, jitter: 0 }));
    cue('tell', -BB.tell, () => play('bb-static', { gain: 1, pan: -0.6 * fl.dir }, { depth: 0.45, hold: 2.4, release: 1.2 }));
    // (MODELS: the music dips deeper under the boom — the loudest thing in the game)
    cue('boom1', BB.cone + BB.boom, () => { play('bb-boom', { gain: 1, pan: pan * 0.4 }, { depth: 0.6, hold: 1.4, release: 2.5 }); if (cb.onShake) cb.onShake(); });
    cue('boom2', BB.cone + BB.boom + BB.boomGap, () => citySound('bb-boom', { gain: 0.8, pan: pan * 0.4, rate: 0.94, jitter: 0 }));
    cue('scream', BB.cone + BB.boom + BB.boomGap + 0.12, () => citySound('bb-scream', { gain: 1, pan: 0.7 * fl.dir, jitter: 0 }));
    if (e > bbLife(s.W, len) + 0.2) { fl.done = true; fl = null; free(); lastDbg = null; return false; }
    if (!st.on && !st.ring && !(st.cone > 0) && st.streak <= 0) { if (cv) x.clearRect(0, 0, cv.width, cv.height); lastDbg = { e: +e.toFixed(2), on: false, tell: st.tell }; return e < 0 || st.boom == null || st.boom < 3; }
    // THE OVERLAY: the band round its path (the cone's + the ring's room), at the device's dpr — MODELS (the owner, Oct 30 6:05 pm: "THE
    // VAPOR CONE IS CUT OFF AT THE TOP"): NEVER CLIPPED — the band reaches the screen's top (the corner buttons sit above it, the cone
    // behind them), and toward the LIT letters below only a SOFT FADE of the cone + the ring (the letters stay clear by placement)
    const d = Math.min(3, s.dpr || 2), bandH = len * 2.8, top = Math.max(0, fl.y - bandH / 2), bot = fl.clipBot != null ? Math.min(fl.y + bandH / 2, fl.clipBot + 8) : fl.y + bandH / 2;
    if (!overlay(s.W, top, Math.max(10, bot - top), d)) return true;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
    x.setTransform(d, 0, 0, d, 0, -top * d);
    x.save();
    const look = s.look, night = look.dark, span = s.W + len * (1 + BB.plume);
    const noseX = u => (fl.dir > 0 ? -len * 0.2 + u * (s.W + len * 0.2) : s.W + len * 0.2 - u * (s.W + len * 0.2));
    const nx = noseX(st.u), tailX = nx - fl.dir * len, y = fl.y;
    // SKY-B — THE VAPOR CONE, CENTRE STAGE: it forms round the craft's tail half as its middle crosses the screen's centre, then STAYS where
    // the barrier broke as the craft tears on out of it — a big bright white bell (bigger + brighter than SKY-A's, ~0.6 × the body tall),
    // its sharp leading edge, the shock's striations, a wide soft bloom; it holds, then DISSIPATES slowly — swelling, softening, fading
    // (MODELS: BIGGER, BRIGHTER, it LASTS — it swells a touch through its hold (ATM-A: ~2.3 s), then dissolves slowly (BB.coneHold / coneFade))
    if (st.cone > 0.004) {
      const cx = noseX(st.coneU) - fl.dir * len * 0.42, age = Math.max(0, st.coneS), sw = 1 + 0.12 * Math.min(1, Math.max(0, age - BB.coneIn) / BB.coneHold) + 0.3 * Math.min(1, Math.max(0, age - BB.coneIn - BB.coneHold) / BB.coneFade) + 0.04 * Math.min(1, age / 0.3);
      const k = st.cone, soft = 1 - k, L0 = len * 0.74 * sw, R1 = len * 0.34 * sw, R0 = len * 0.055 * sw, f0 = cx + fl.dir * L0 * 0.42, f1 = cx - fl.dir * L0 * 0.58;
      x.save(); x.globalCompositeOperation = 'lighter';
      x.globalAlpha = (0.42 + 0.18 * night) * k; const gb = len * 0.95 * sw; x.drawImage(glow([235, 242, 255]), cx - gb, y - gb * 0.6, gb * 2, gb * 1.2);   // (the bloom)
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      const bell = (rs, a) => { const g = x.createLinearGradient(f0, 0, f1, 0); g.addColorStop(0, `rgba(250,252,255,${a})`); g.addColorStop(0.22, `rgba(240,246,255,${a * 0.72})`); g.addColorStop(0.65, `rgba(228,236,250,${a * 0.28})`); g.addColorStop(1, 'rgba(225,235,250,0)');
        x.fillStyle = g; x.beginPath(); x.moveTo(f0, y - R0 * rs); x.quadraticCurveTo(f0 - fl.dir * L0 * 0.18, y - R1 * rs * 0.92, f1, y - R1 * rs); x.lineTo(f1, y + R1 * rs); x.quadraticCurveTo(f0 - fl.dir * L0 * 0.18, y + R1 * rs * 0.92, f0, y + R0 * rs); x.closePath(); x.fill(); };
      bell(1.25 + 0.3 * soft, 0.26 * k);   // (a soft outer veil — wider as it dissipates)
      bell(1, (0.8 + 0.15 * night) * k ** 1.2);          // (the cone itself: brighter white condensation)
      x.globalCompositeOperation = 'lighter';
      // the leading edge: a crisp bright ring where the shock sits + two fainter striations behind it
      for (const [o, a, wd] of [[0, 0.95, 1.6], [0.2, 0.35, 1], [0.42, 0.2, 0.8]]) {
        const ex = f0 - fl.dir * L0 * o, er = R0 * 1.3 + (R1 - R0 * 1.3) * Math.min(1, o * 1.4);
        x.strokeStyle = `rgba(255,255,255,${a * k * (o ? 1 - 0.5 * soft : 1)})`; x.lineWidth = wd; x.beginPath(); x.ellipse(ex, y, Math.max(0.6, er * 0.16), er, 0, 0, TAU); x.stroke();
      }
      x.restore();
    }
    // THE SHOCK RING: where it broke through — a thin bright ring seen edge-on (a tall ellipse), expanding + fading with the cone; it stays there
    if (st.ring && s.motion) {
      const rx0 = noseX(st.ring.u) - fl.dir * len * 0.16, r = len * 1.05 * (0.16 + 0.85 * Math.sqrt(st.ring.k)), a = (1 - st.ring.k) ** 1.3;
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(235,242,255,${0.9 * a})`; x.lineWidth = 1.7 * (1 - 0.5 * st.ring.k);
      x.beginPath(); x.ellipse(rx0, y, r * 0.3, r, 0, 0, TAU); x.stroke(); x.globalCompositeOperation = 'source-over';
    }
    // (the SOFT EDGE toward the lit letters: the cone + the ring faded out over the last ~18 pt above them — never a hard cut)
    if (fl.clipBot != null) {
      const fy0 = fl.clipBot - 18, g = x.createLinearGradient(0, fy0, 0, fl.clipBot + 2);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = g; x.fillRect(0, fy0, s.W, bot - fy0 + 4); x.globalCompositeOperation = 'source-over';
    }
    // THE SPEED STREAK: a thin bright line along its path behind it, fading
    if (st.streak > 0.01) {
      const x0 = fl.dir > 0 ? 0 : s.W, g = x.createLinearGradient(x0, 0, tailX, 0);
      g.addColorStop(0, `rgba(230,236,255,0)`); g.addColorStop(1, `rgba(240,244,255,${(0.28 + 0.25 * night) * st.streak})`);
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = g; x.lineWidth = 1.1; x.beginPath(); x.moveTo(x0, y + len * 0.01); x.lineTo(tailX, y + len * 0.01); x.stroke(); x.globalCompositeOperation = 'source-over';
    }
    if (st.on) {
      x.save(); x.translate(tailX, y); x.scale(fl.dir, 1);
      // the PLUMES (the far one a hair above, dimmer, behind), then the craft
      x.globalCompositeOperation = 'lighter';
      x.save(); x.translate(len * 0.03, -len * 0.014); plume(x, len * BB.plume, len * 0.024, st.burn * 0.7, s.t, 1); x.restore();
      x.save(); x.translate(len * 0.03, 0); plume(x, len * BB.plume, len * 0.03, st.burn, s.t, 0); x.restore();
      x.globalCompositeOperation = 'source-over';
      // the craft (the art switch: the drawn SR-71 — or a baked model's sprite in its place)
      const key = `${art}|${Math.round(len)}|${Math.round(look.day * 8)}|${Math.round(look.golden * 8)}|${Math.round(night * 8)}|${d}`;
      if (art === 'model' && !sr71) loadSR71();
      const key2 = `${key}|${sr71 ? 1 : 0}`;
      if (!spr || key2 !== sprKey) { if (spr) spr.cv.width = 0; spr = (art === 'model' && sr71Sprite(len, look, d)) || drawnSprite(len, look, d); sprKey = key2; }
      if (spr && spr.model) { x.save(); x.rotate(-spr.rot); x.drawImage(spr.cv, -spr.ox, -spr.oy, spr.w, spr.h); x.restore(); }
      else if (spr) x.drawImage(spr.cv, -spr.ox, -spr.oy - len * 0.029, spr.w, spr.h);
      // at night its lights: a red beacon on the spine, the tail's white
      if (night > 0.2) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = night * (Math.sin(s.t * 9) > 0.4 ? 0.9 : 0.2); x.drawImage(glow([255, 40, 40]), len * 0.5 - 4, -len * 0.04 - 4, 8, 8); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
      x.restore();
    }
    x.restore();
    lastDbg = { e: +e.toFixed(2), coneX: st.cone > 0 ? Math.round(noseX(st.coneU) - fl.dir * len * 0.42) : null, on: st.on, u: +st.u.toFixed(3), x: Math.round(nx), y: Math.round(y), len: Math.round(len), cone: +st.cone.toFixed(2), ring: st.ring ? +st.ring.k.toFixed(2) : null, burn: +st.burn.toFixed(2),
      box: { x: Math.round(Math.min(nx, tailX - fl.dir * len * BB.plume)), y: Math.round(y - len * 0.14), w: Math.round(len * (1 + BB.plume)), h: Math.round(len * 0.24) }, top: Math.round(top), d };
    return true;
  }
  return {
    start, frame, prefetch,
    on: () => !!fl,
    /** THE ART SWITCH: 'drawn' (the default) | 'model' (a baked sprite — once a bake exists; else the drawing stays) */
    setArt(a) { art = a === 'drawn' ? 'drawn' : 'model'; if (art === 'model') loadSR71(); },
    art: () => art, modelReady: () => !!sr71,
    stop() { fl = null; free(); },
    debug: () => (fl ? { kind: fl.kind, at: fl.at, dir: fl.dir, y: Math.round(fl.y), art, ...(lastDbg || {}) } : null),
    destroy() { free(); if (spr) spr.cv.width = 0; spr = null; for (const c of glows.values()) c.width = 0; glows.clear(); },
  };
}
