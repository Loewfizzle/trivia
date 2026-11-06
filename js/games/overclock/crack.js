// OVERCLOCK — THE REAL-GLASS CRACK (OC4 Group 0 — docs/overclock.md "OC4"; the owner after OC3: the drawn hairlines were "too cheap… basic").
// Every wrong answer on a tile / a card / a key / a cell / a node goes through here (fx.js#wrong → crackAt). The fracture is a REAL PHOTO —
// "RadialCracksB by Keith333 (https://opengameart.org/users/keith333), licensed under CC-BY 3.0" (assets/overclock/crack.webp, built by
// scripts/build-oc-crack.py: cracks white on transparent, the impact at its centre) — never lines drawn by hand.
//   PER TAP: the texture CENTRED ON THE TAP POINT (a keyboard / a timeout → the left third of the tile, never dead centre), a seeded rotation +
//            a slight scale, CLIPPED to the host's own shape (the tile's slant — --oc-gc-skew; a round node — border-radius).
//   LIGHT, NOT LINES: the cracks as bright edges (the photo); a RED EMISSIVE layer under them (crack-glow.webp — the same texture blurred ONCE
//            at low res, tinted red: only its opacity animates); a thin highlight SWEEP glinting across the broken glass (a bar seen only
//            THROUGH the cracks — the texture as its mask) as the tile jolts.
//   REFRACTION: the label on the tile SPLITS along three of the photo's main crack lines from the impact — each wedge a copy of the label
//            (clip-path, set once), offset 1–2 px out of line — what makes it read as real glass.
//   MOTION (≤ 0.45 s, transform + opacity only, never a tap blocked — everything is pointer-events: none): a crushed white FLASH at the
//            impact; the cracks REVEAL outward from the tap in ~120 ms (a soft round window scaling up while the texture inside it
//            counter-scales — it never zooms); the red glow flares then settles faint; 3–5 GENERATED SHARDS (thin bright slivers + a glint,
//            a few pt) pop off the impact, spin, fall and fade; ONE sharp KNOCKBACK (2–3 px back + a hair of rotation, then it settles).
//   AT REST: the fracture stays in the dark glass, dim; the red glow faint (the host's red edge + its ✕ socket are the challenge's own).
// Reduced motion: the finished fracture just appears (no flash, no shards, no jolt). Positions are read ONCE per tap (an event, never a frame).
import { h, reducedMotion } from '../../ui/dom.js';
import { rngFrom } from '../../core/rng.js';

export const TEX_URL = new URL('../../../assets/overclock/crack.webp', import.meta.url).href;
export const GLOW_URL = new URL('../../../assets/overclock/crack-glow.webp', import.meta.url).href;
export const CRACK_MS = 450;          // the whole motion (the owner's bar: ≤ 0.45 s)
export const REVEAL_MS = 120;         // the cracks running out from the impact
// the photo's main crack lines from the impact (degrees, 0 = right, clockwise — measured on crack.webp): the long one down, the long one up,
// the bright one to the upper right, the one along the arc to the lower left. THE REFRACTION splits the label along three of them.
export const CRACK_RAYS = [93, -86, -27, 152, 38, -140];
// at rest (opacities): the cracks + the red glow
export const REST = { tex: 0.4, glow: 0.16 };

let decoded = null;
/** decode the two textures once (the view calls it at mount — the first wrong tap never waits for an image) */
export function warmCrack() {
  if (decoded || typeof Image === 'undefined') return decoded;
  decoded = Promise.all([TEX_URL, GLOW_URL].map(src => { const i = new Image(); i.src = src; return (i.decode ? i.decode() : Promise.resolve()).then(() => i, () => i); }));
  return decoded;
}

/** where a tap lands on a host w × h: the pointer (host-local) if it's inside, else the LEFT THIRD (a key / a timeout) — PURE */
export function impactPoint(w, h, pt, rand = Math.random) {
  if (pt && pt.x >= 0 && pt.y >= 0 && pt.x <= w && pt.y <= h) return { x: pt.x, y: pt.y, tap: true };
  return { x: w * (0.17 + 0.12 * rand()), y: h * (0.42 + 0.16 * rand()), tap: false };
}
/** the texture's look for one tap (seeded): its size, rotation, the three split rays + each piece's offset, the shards — PURE */
export function crackPlan(w, h, seed = '') {
  const rand = rngFrom(`crack:${seed}`);
  const rot = Math.round(rand() * 360);
  const k = 0.92 + rand() * 0.18;
  // big enough that the long cracks reach the far end of a wide tile, the crushed centre a few pt across (the texture's own proportions)
  const size = Math.round(Math.max(250, Math.min(440, Math.max(w * 0.95, h * 3.4))) * k);
  // THE REFRACTION: three of the photo's rays (turned with it), sorted around the impact → three wedges; each wedge pushed out 1–2 px
  const pool = CRACK_RAYS.slice();
  const rays = [];
  for (let i = 0; i < 3; i++) rays.push(pool.splice(Math.floor(rand() * pool.length), 1)[0] + rot);
  rays.sort((a, b) => ((a % 360) + 360) % 360 - (((b % 360) + 360) % 360));
  const norm = a => ((a % 360) + 360) % 360;
  const pieces = rays.map((a, i) => {
    const a0 = norm(a), a1 = norm(rays[(i + 1) % rays.length]);
    const span = ((a1 - a0) + 360) % 360 || 360;
    const mid = (a0 + span / 2) * Math.PI / 180;
    const d = 1 + rand();   // 1–2 px out of line
    return { a0, span, dx: +(Math.cos(mid) * d).toFixed(2), dy: +(Math.sin(mid) * d).toFixed(2), rot: +((rand() - 0.5) * 0.9).toFixed(2) };
  });
  const shards = Array.from({ length: 3 + Math.floor(rand() * 3) }, () => {
    const ang = rand() * Math.PI * 2;
    const dist = 16 + rand() * 26;
    return { ang, dist, len: 8 + rand() * 9, wid: 2 + rand() * 1.4, spin: (rand() < 0.5 ? -1 : 1) * (200 + rand() * 360), rise: 6 + rand() * 16, fall: 22 + rand() * 26, dur: 320 + rand() * 100, delay: rand() * 28, tilt: rand() * 180 };
  });
  return { rot, k, size, pieces, shards, sweep: rand() < 0.5 ? -1 : 1 };
}

/** a wedge from (ox, oy) between two angles, as a clip-path polygon (px — the label's own box) */
function wedge(ox, oy, a0, span) {
  const R = 1600, pts = [`${ox}px ${oy}px`];
  const n = Math.max(2, Math.ceil(span / 30));
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (span * i) / n) * Math.PI / 180;
    pts.push(`${(ox + Math.cos(a) * R).toFixed(1)}px ${(oy + Math.sin(a) * R).toFixed(1)}px`);
  }
  return `polygon(${pts.join(', ')})`;
}

// the counter-scaled reveal: the window scales s(t), the texture inside it 1 / s(t) — a few keyframes, the same offsets for both
const REVEAL_KEYS = [0, 0.18, 0.4, 0.62, 0.82, 1];
const revealScale = t => 0.06 + 0.94 * (1 - (1 - t) ** 3);

/**
 * crack `host` at the client point `pt` ({ clientX, clientY } or null). opts: { seed, layer (the screen's fx layer for the shards),
 * label (the element whose text splits — default the host's first .oc-tile-t / .oc-tf-word / [data-gc-label]), kick (false: no jolt —
 * a host that's moving on its own) } → the crack element (it stays at rest until the host goes)
 */
export function crackAt(host, pt, opts = {}) {
  if (!host || !host.isConnected) return null;
  const { seed = '', layer = null, kick = true } = opts;
  const still = reducedMotion();
  const w = host.offsetWidth || 1, hh = host.offsetHeight || 1;
  const r = host.getBoundingClientRect();
  const sx = w / Math.max(1, r.width), sy = hh / Math.max(1, r.height);
  const local = pt ? { x: (pt.clientX - r.left) * sx, y: (pt.clientY - r.top) * sy } : null;
  const P = crackPlan(w, hh, seed);
  const at = impactPoint(w, hh, local, rngFrom(`crack:at:${seed}`));
  host.querySelectorAll(':scope > .oc-gc').forEach(n => n.remove());   // a second crack on one host replaces the first
  const S = P.size;
  // the round window must cover every corner from the impact
  const D = Math.ceil(2 * Math.max(Math.hypot(at.x, at.y), Math.hypot(w - at.x, at.y), Math.hypot(at.x, hh - at.y), Math.hypot(w - at.x, hh - at.y)) + 24);
  const texT = `rotate(${P.rot}deg) scale(${P.k.toFixed(3)})`;
  const tex = h('i.oc-gc-tex', { style: { width: `${S}px`, height: `${S}px`, marginLeft: `${-S / 2}px`, marginTop: `${-S / 2}px`, backgroundImage: `url("${TEX_URL}")`, transform: texT, opacity: String(REST.tex) } });
  const glow = h('i.oc-gc-glow', { style: { width: `${S}px`, height: `${S}px`, marginLeft: `${-S / 2}px`, marginTop: `${-S / 2}px`, backgroundImage: `url("${GLOW_URL}")`, transform: texT, opacity: String(REST.glow) } });
  const rev = h('i.oc-gc-rev', { style: { left: `${at.x}px`, top: `${at.y}px`, width: `${D}px`, height: `${D}px`, marginLeft: `${-D / 2}px`, marginTop: `${-D / 2}px` } },
    h('i.oc-gc-ctr', glow, tex));
  // THE SWEEP: a thin bright bar seen only through the cracks (the texture is its mask) — moves once, then gone
  const bar = h('i.oc-gc-bar');
  const sweep = h('i.oc-gc-sweep', { style: { left: `${at.x}px`, top: `${at.y}px`, width: `${S}px`, height: `${S}px`, marginLeft: `${-S / 2}px`, marginTop: `${-S / 2}px`, transform: texT, WebkitMaskImage: `url("${TEX_URL}")`, maskImage: `url("${TEX_URL}")` } }, bar);
  const flash = h('i.oc-gc-flash', { style: { left: `${at.x}px`, top: `${at.y}px` } });
  // THE REFRACTION: the label copied into three wedges (clip-path set once), each nudged out of line; the label itself hidden (it keeps the layout)
  const label = opts.label || host.querySelector('[data-gc-label], .oc-tile-t, .oc-tf-word, .gk-np-val, .oc-tl-t, .oc-st-t, .oc-hl-val, .oc-gc-label');
  const pieces = [];
  if (label && label.offsetWidth) {
    label.classList.remove('oc-gc-split');
    const lx = label.offsetLeft, ly = label.offsetTop, lw = label.offsetWidth, lh = label.offsetHeight;
    const ox = at.x - lx, oy = at.y - ly;
    for (const pc of P.pieces) {
      const copy = label.cloneNode(true);
      copy.removeAttribute('id');
      copy.classList.add('oc-gc-copy');
      copy.setAttribute('aria-hidden', 'true');
      const el = h('i.oc-gc-pc', { style: { left: `${lx}px`, top: `${ly}px`, width: `${lw}px`, height: `${lh}px`, clipPath: wedge(ox, oy, pc.a0, pc.span), WebkitClipPath: wedge(ox, oy, pc.a0, pc.span), transformOrigin: `${ox}px ${oy}px`, transform: `translate(${pc.dx}px, ${pc.dy}px) rotate(${pc.rot}deg)` } }, copy);
      pieces.push({ el, pc });
    }
    label.classList.add('oc-gc-split');
  }
  // (the label's wedges ride ON the cracks — the word stays readable through the fracture; the flash over everything)
  const inner = h('i.oc-gc-in', rev, sweep, pieces.map(p => p.el), flash);
  const el = h('i.oc-gc', { 'aria-hidden': 'true', dataset: { seed: String(seed), tap: at.tap ? '1' : '0' } }, inner);
  el.oc = { at, plan: P, label };
  // above the glass + its red edge, under the marks + the badge (css)
  const under = host.querySelector(':scope > .oc-tile-bad') || host.querySelector(':scope > .oc-tile-face');
  if (under) under.after(el); else host.prepend(el);
  if (still) return el;

  const ease = 'cubic-bezier(0.2, 0.8, 0.3, 1)';
  // the cracks run out from the impact: the window scales up, the texture inside it counter-scales (the cracks themselves never zoom)
  rev.animate(REVEAL_KEYS.map(t => ({ offset: t, transform: `scale(${revealScale(t).toFixed(4)})` })), { duration: REVEAL_MS, easing: 'linear' });
  rev.firstChild.animate(REVEAL_KEYS.map(t => ({ offset: t, transform: `scale(${(1 / revealScale(t)).toFixed(4)})` })), { duration: REVEAL_MS, easing: 'linear' });
  tex.animate([{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: REST.tex }], { duration: CRACK_MS, easing: 'ease-out' });
  glow.animate([{ opacity: 0 }, { opacity: 1, offset: 0.22 }, { opacity: 0.75, offset: 0.45 }, { opacity: REST.glow }], { duration: CRACK_MS, easing: 'ease-out' });
  flash.animate([{ opacity: 1, transform: 'translate(-50%, -50%) scale(0.35)' }, { opacity: 0.9, transform: 'translate(-50%, -50%) scale(1)', offset: 0.28 }, { opacity: 0, transform: 'translate(-50%, -50%) scale(1.5)' }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
  bar.animate([{ opacity: 0, transform: `translateX(${-P.sweep * 260}%)` }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.7 }, { opacity: 0, transform: `translateX(${P.sweep * 260}%)` }], { duration: 340, delay: 70, easing: 'cubic-bezier(0.4, 0, 0.3, 1)', fill: 'both' });
  for (const { el: pe, pc } of pieces) {
    pe.animate([{ transform: 'none' }, { transform: `translate(${(pc.dx * 2.4).toFixed(2)}px, ${(pc.dy * 2.4).toFixed(2)}px) rotate(${(pc.rot * 2).toFixed(2)}deg)`, offset: 0.3 }, { transform: `translate(${pc.dx}px, ${pc.dy}px) rotate(${pc.rot}deg)` }], { duration: 260, easing: ease });
  }
  // THE KNOCKBACK: one sharp jolt away from the impact (+ a hair of rotation), then it settles — never a wobble
  if (kick) {
    const vx = w / 2 - at.x, vy = hh / 2 - at.y, len = Math.hypot(vx, vy) || 1;
    const dx = (vx / len) * 2.6, dy = (vy / len) * 1.4 + 1.2;
    const turn = (at.x < w / 2 ? -1 : 1) * 0.55 * Math.min(1, 220 / w);
    host.animate([
      { transform: 'none' },
      { transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${turn.toFixed(2)}deg) scale(0.985)`, offset: 0.14 },
      { transform: `translate(${(-dx * 0.18).toFixed(2)}px, ${(-dy * 0.18).toFixed(2)}px)`, offset: 0.55 },
      { transform: 'none' },
    ], { duration: 340, easing: 'cubic-bezier(0.25, 0.9, 0.35, 1)' });
  }
  // THE SHARDS: thin bright slivers off the impact (the screen's fx layer — they may fly past the tile, never past the screen)
  if (layer && layer.isConnected) {
    const L = layer.getBoundingClientRect();
    const cx = r.left + at.x / sx - L.left, cy = r.top + at.y / sy - L.top;
    for (const s of P.shards) {
      const sh = h('i.oc-shard', { style: { width: `${s.wid.toFixed(1)}px`, height: `${s.len.toFixed(1)}px` } });
      layer.append(sh);
      const tx = Math.cos(s.ang) * s.dist, ty = Math.sin(s.ang) * s.dist * 0.6;
      const a = sh.animate([
        { transform: `translate(${cx}px, ${cy}px) rotate(${s.tilt}deg) scale(0.4)`, opacity: 1 },
        { transform: `translate(${cx + tx * 0.55}px, ${cy + ty * 0.55 - s.rise}px) rotate(${s.tilt + s.spin * 0.4}deg) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${cx + tx}px, ${cy + ty + s.fall}px) rotate(${s.tilt + s.spin}deg) scale(0.8)`, opacity: 0 },
      ], { duration: s.dur, delay: s.delay, easing: 'cubic-bezier(0.25, 0.6, 0.5, 1)', fill: 'both' });
      a.onfinish = () => sh.remove();
      a.oncancel = () => sh.remove();
    }
  }
  return el;
}

/** take a host's crack off again (a pad's field reset, Unscramble's slots emptied) */
export function clearCrack(host) {
  if (!host) return;
  host.querySelectorAll('.oc-gc').forEach(n => n.remove());
  host.querySelectorAll('.oc-gc-split').forEach(n => n.classList.remove('oc-gc-split'));
}
