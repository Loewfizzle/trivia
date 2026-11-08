// SHELL 2.0 B2 — THE GIFT CARDS' EFFECT (the owner: "sparkling, glowing, moving, a lot of flair; they're 1-of-1"): ONE engine that draws a
// card's layers from js/fx/gift-specs.js on the SHARED surface (js/fx/renderer.js — never a canvas per card), through THE GL PAINTER's 2D
// look-alike: sprites (kit.js — baked once), paths, gradients, the art image itself (a piece of it moved: the ball spins). Positions are
// ART pixels mapped exactly like the CSS crop under it (css/vault.css .vl-s-g-* — background cover at the spec's %, the full card 50 % 50 %),
// so a glint lands on the lens at every size. The full card plays the whole show; a strip the calmer cut (fewer motes, softer, no
// full-only layers). Reduced motion = the still frame (stillT). Transform + opacity only on the DOM side (the material is a still CSS image).
//   giftFx(card) → an effect (registered per card in fx/index.js)
import { rng, sprite, stamp, glow, sparkle, puff, heart, wob, fract, smooth, clamp01 } from './kit.js';
import { image } from './sg-kit.js';
import { rrect } from './renderer.js';
import { GIFT_SPECS } from './gift-specs.js';

export const GIFT_ART = new URL('../../assets/vault/gift/', import.meta.url).href;
const AW = 1280, AH = 800;
/** the art → slot mapping (CSS `background: … px% py% / cover`; crop[2] = a zoom out — CARD FIXES: `z·100% auto`, the strip's width-bound
 *  cover × z): { k, ox, oy } */
export function artMap(w, h, crop, ah = AH) {
  const k = Math.max(w / AW, h / ah) * (crop[2] || 1), dw = AW * k, dh = ah * k;   // (Nov 6: dh from the picture's OWN height — it was AH, which threw
  //  every layer on a card's own strip picture (the tape card's) up off its spot: FRIENDS' "the tape card's strip effects slightly mis-positioned")
  return { k, ox: (w - dw) * (crop[0] / 100), oy: (h - dh) * (crop[1] / 100) };
}
const TAU = Math.PI * 2;

// ---- the shared bakes
const band = () => sprite('gift-band', 64, 4, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
const tinted = (rgb, base) => sprite(`gift-tint:${rgb}:${base}`, 64, 64, (c, w, h) => {
  const g = base === 'v' ? c.createLinearGradient(0, 0, 0, h) : c.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.5, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(0, 0, w, h);
});
const cone = rgb => sprite(`gift-cone:${rgb}`, 64, 128, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${rgb},0.9)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.beginPath(); c.moveTo(w / 2 - 3, 0); c.lineTo(w / 2 + 3, 0); c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
});
const textSprite = L => sprite(`gift-text:${L.text}:${L.font}:${L.fill}`, 1024, 220, (c, w, h) => {
  c.font = L.font; c.textBaseline = 'middle'; c.textAlign = 'center';
  if (L.stroke) { c.lineJoin = 'round'; c.lineWidth = 16; c.strokeStyle = L.stroke; c.strokeText(L.text, w / 2, h / 2); }
  c.shadowColor = L.fill; c.shadowBlur = 18; c.fillStyle = L.fill; c.fillText(L.text, w / 2, h / 2);
});
const palmSprite = rgb => sprite(`gift-palm:${rgb}`, 256, 512, (c, w, h) => {
  c.strokeStyle = `rgb(${rgb})`; c.fillStyle = `rgb(${rgb})`; c.lineCap = 'round';
  c.lineWidth = 14; c.beginPath(); c.moveTo(w * 0.5, h); c.quadraticCurveTo(w * 0.58, h * 0.55, w * 0.46, h * 0.16); c.stroke();
  const top = [w * 0.46, h * 0.16];
  for (const [a, len, droop] of [[-2.9, 1, 0.5], [-2.4, 1.05, 0.35], [-1.95, 0.9, 0.2], [-1.4, 0.85, 0.15], [-0.9, 0.95, 0.25], [-0.45, 1.05, 0.38], [0.05, 1, 0.5]]) {
    const L = w * 0.46 * len, ex = top[0] + Math.cos(a) * L, ey = top[1] + Math.sin(a) * L * 0.55 + L * droop;
    c.lineWidth = 9; c.beginPath(); c.moveTo(top[0], top[1]); c.quadraticCurveTo(top[0] + Math.cos(a) * L * 0.55, top[1] + Math.sin(a) * L * 0.5 - 10, ex, ey); c.stroke();
    for (let i = 1; i < 7; i++) { const t = i / 7, px = top[0] + (ex - top[0]) * t, py = top[1] + (ey - top[1]) * t - Math.sin(t * Math.PI) * 10; c.lineWidth = 3; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a + 1.3) * 16 * (1 - t * 0.5), py + 18 * (1 - t * 0.4)); c.stroke(); }
  }
});
const halftone = rgb => sprite(`gift-ht:${rgb}`, 96, 96, (c, w) => { for (let y = 0; y < w; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < w; x += 8) { c.fillStyle = `rgba(${rgb},1)`; c.beginPath(); c.arc(x, y, 1.7, 0, TAU); c.fill(); } });
const frostEdge = rgb => sprite(`gift-frost:${rgb}`, 256, 160, (c, w, h) => {
  const r = rng(77);
  for (let i = 0; i < 260; i++) {   // ice crystals: short bright needles crowding the edges
    const side = i % 4, u = r(), d = Math.pow(r(), 2.2) * 0.22;
    const x = side === 0 ? u * w : side === 1 ? u * w : side === 2 ? d * w : w - d * w, y = side === 0 ? d * h : side === 1 ? h - d * h : u * h;
    c.strokeStyle = `rgba(${rgb},${(0.25 + r() * 0.6).toFixed(2)})`; c.lineWidth = 0.6 + r(); const a = r() * TAU, L = 4 + r() * 14;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
  }
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, w * 0.62); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},0.55)`); c.fillStyle = g; c.fillRect(0, 0, w, h);
});

// ---- THE SEEING-STARS CARD (Nov 6) — the flat picture taken APART (scripts/build-buzzed-art.py) so the spiral turns BEHIND him: the spiral itself
// (drawn from its fitted formula — never a photo), the halftone dots + the picture's light laid back over it, then HIM (a cut-out), the ring of
// stars round his cap (the far half behind him, the near half in front), the HIC! popping. These layers fade in over the still art on the slot's
// own clock (the art is the first frame + the reduced-motion frame); `still` skips them — the approved picture shows as it is.
const born = (s, t) => { if (s.giftBorn == null || t < s.giftBorn) s.giftBorn = t; return smooth(0, 0.7, t - s.giftBorn); };
/** the spiral (pink arms on yellow) in its own round frame: SZ px across = 2R art px; pink where cos(2pi(N th + k r + c r^2) + phase) > d */
const spiralSprite = (L, SZ) => sprite(`gift-spiral:${L.key}:${SZ}`, SZ, SZ, (c, w) => {
  const P = L.sp, R = L.R, px = w / (2 * R), h = Math.acos(Math.max(-1, Math.min(1, P.d))) / TAU, ph = P.phase / TAU;
  c.fillStyle = `rgb(${L.rgb[1]})`; c.fillRect(0, 0, w, w);
  c.fillStyle = `rgb(${L.rgb[0]})`;
  const th = (m, r) => TAU * (m - P.k * r - P.c * r * r * 1e-6 - ph) / P.N;
  for (let m = 0; m < P.N; m++) {
    c.beginPath();
    for (let r = 0; r <= R; r += 3) { const a = th(m - h, r); c.lineTo(w / 2 + Math.cos(a) * r * px, w / 2 + Math.sin(a) * r * px); }
    for (let r = R; r >= 0; r -= 3) { const a = th(m + h, r); c.lineTo(w / 2 + Math.cos(a) * r * px, w / 2 + Math.sin(a) * r * px); }
    c.closePath(); c.fill();
  }
});
/** the halftone: a 63-art-px tile (two lattice periods) of soft dark dots, baked at 2x */
const dotTile = L => sprite(`gift-dots:${L.r}:${L.per}`, Math.round(L.per * 4), Math.round(L.per * 4), (c, w) => {
  const q = w / (L.per * 2), st = L.per / 2;
  for (let a = -1; a <= 4; a++) for (let b = -1; b <= 4; b++) {
    if ((a + b) % 2) continue;
    const g = c.createRadialGradient(a * st * q, b * st * q, 0, a * st * q, b * st * q, L.r * q);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.75, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(a * st * q, b * st * q, L.r * q, 0, TAU); c.fill();
  }
});
/** a 5-point star: lemon, a black comic outline (the art's own) */
const starSprite = (fill, n = 96) => sprite(`gift-star:${fill}:${n}`, n, n, (c, w) => {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? 0.2 : 0.44) * w; c.lineTo(w / 2 + Math.cos(a) * r, w / 2 + 2 + Math.sin(a) * r); }
  c.closePath(); c.lineJoin = 'round'; c.lineWidth = w * 0.05; c.strokeStyle = '#120a14'; c.fillStyle = fill; c.fill(); c.stroke();
});
/** the ring: a white neon line in a pink glow — the far half or the near half (the ellipse's own frame, baked) */
const ringSprite = (L, half) => sprite(`gift-ring:${L.rx}:${L.ry}:${half}`, 512, 256, (c, w, h) => {
  const sx = w / (L.rx * 2.5), sy = h / (L.ry * 2.5);
  c.save(); c.beginPath(); c.rect(0, half === 'back' ? 0 : h / 2, w, h / 2); c.clip();
  c.translate(w / 2, h / 2); c.scale(sx, sy);
  for (const [lw, a, col] of [[14, 0.16, '255,120,210'], [8, 0.3, '255,160,225'], [3.2, 0.95, '255,250,255']]) {
    c.lineWidth = lw; c.strokeStyle = `rgba(${col},${a})`; c.beginPath(); c.ellipse(0, 0, L.rx, L.ry, 0, 0, TAU); c.stroke();
  }
  c.restore();
});
// ---- the layers: (c, L, M, t, s, Q, F) — M the art map, F = { full, calm (0..1), still }
const P = (M, x, y) => [M.ox + x * M.k, M.oy + y * M.k];
/** a box clip inside the card's rounded one — clamped to the slot; a box covering the whole slot keeps the card's own (rounded) clip */
function clipBox(c, s, bx, by, bw, bh) {
  const x0 = Math.max(0, bx), y0 = Math.max(0, by), x1 = Math.min(s.w, bx + bw), y1 = Math.min(s.h, by + bh);
  if (x0 <= 0.5 && y0 <= 0.5 && x1 >= s.w - 0.5 && y1 >= s.h - 0.5) return;
  c.beginPath(); c.rect(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0)); c.clip();
}
const DRAW = {
  breathe(c, L, M, t, s, Q, F) {
    const [x, y] = P(M, L.at[0], L.at[1]), r = L.r * M.k * 2, u = 0.5 + 0.5 * Math.sin(t * TAU / L.period + (L.phase || 0));
    let a = L.a[0] + (L.a[1] - L.a[0]) * u;
    if (L.flicker && !F.still) { const ph = Math.floor(t * 9), n = fract(Math.sin(ph * 12.9898 + L.at[0]) * 43758.5453); if (n < L.flicker * 0.18) a *= 0.25 + n; }
    c.globalCompositeOperation = 'lighter'; stamp(c, glow(L.rgb, 0.12), x, y, r, a * F.calmA);
  },
  motes(c, L, M, t, s, Q, F) {
    const n = Math.round(L.n * (F.full ? 1 : 0.55) * (Q.q || 1)), r = rng(L.n * 31 + L.box[0]), sp = L.speed * M.k;
    const bx = M.ox + L.box[0] * M.k, by = M.oy + L.box[1] * M.k, bw = L.box[2] * M.k, bh = L.box[3] * M.k;
    c.globalCompositeOperation = 'lighter';
    const spr = L.kind === 'spark' ? sparkle(L.rgb) : glow(L.rgb, L.kind === 'dot' ? 0.5 : 0.2);
    for (let i = 0; i < n; i++) {
      const x0 = r(), y0 = r(), ph = r() * 50, sz = (L.size[0] + r() * (L.size[1] - L.size[0])) * Math.max(0.55, M.k * 2.2) * (L.kind === 'spark' ? 3 : 2.4);
      let x = bx + x0 * bw, y = by + y0 * bh;
      if (L.dir === 'up') y = by + fract(y0 - (t + ph) * sp / bh) * bh;
      else if (L.dir === 'down') y = by + fract(y0 + (t + ph) * sp / bh) * bh, x += wob(t * 0.5, i) * 8 * M.k * 3;
      else { x += wob(t * 0.13, i) * sp * 3; y += wob(t * 0.11, i + 9) * sp * 2; }
      const tw = 1 - (L.tw || 0) * (0.5 + 0.5 * Math.sin(t * (1.6 + (i % 5) * 0.4) + ph));
      const edge = L.dir === 'up' || L.dir === 'down' ? smooth(0, 0.12, (y - by) / bh) * (1 - smooth(0.88, 1, (y - by) / bh)) : 1;
      stamp(c, spr, x, y, sz, (L.a || 1) * tw * edge * F.calmA);
    }
  },
  sweep(c, L, M, t, s, Q, F) {
    const u = F.still ? 0.45 : ((t % L.period) / L.dur); if (u < 0 || u > 1) return;
    const bx = M.ox + L.box[0] * M.k, by = M.oy + L.box[1] * M.k, bw = L.box[2] * M.k, bh = L.box[3] * M.k;
    const a = Math.sin(u * Math.PI) * L.a * F.calmA;
    c.save(); clipBox(c, s, bx, by, bw, bh);
    c.globalCompositeOperation = 'lighter';
    if (L.star) { const x = bx + bw * u, y = by + bh / 2; stamp(c, sparkle(L.rgb), x, y, L.width * M.k * 3.4, a); stamp(c, glow(L.rgb, 0.3), x, y, L.width * M.k * 2, a * 0.6); c.restore(); return; }
    const vert = Math.abs(L.angle - Math.PI / 2) < 0.01, len = Math.hypot(bw, bh) * 1.4, wd = L.width * M.k;
    c.translate(vert ? bx + bw / 2 : bx - len * 0.2 + (bw + len * 0.4) * u, vert ? by - bh * 0.2 + bh * 1.4 * u : by + bh / 2); c.rotate(vert ? Math.PI / 2 : L.angle + Math.PI / 2);
    c.globalAlpha = a; c.drawImage(tinted(L.rgb, 'h'), -wd / 2, -len / 2, wd, len);
    c.restore();
  },
  // CARD FIXES — the shiba's sunglasses (the owner's LAB note: "the glint goes across the whole face, needs to be glasses only, more noticeable, maybe a
  // twinkle — this card is special"): a bright band (+ a thin second one) crossing the LENSES only (clipped to their ellipses), then a star
  // twinkling on each rim as it leaves
  glint(c, L, M, t, s, Q, F) {
    const tt = F.still ? L.dur * 0.5 : t % L.period, u = tt / L.dur;
    if (u >= 0 && u <= 1) {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      c.save(); c.beginPath();
      for (const [cx, cy, rx, ry] of L.lenses) {
        const [x, y] = P(M, cx, cy), a = rx * M.k, b = ry * M.k;
        c.moveTo(x + a, y); c.ellipse(x, y, a, b, 0, 0, TAU);
        x0 = Math.min(x0, x - a); x1 = Math.max(x1, x + a); y0 = Math.min(y0, y - b); y1 = Math.max(y1, y + b);
      }
      c.clip(); c.globalCompositeOperation = 'lighter';
      const bw = x1 - x0, bh = y1 - y0, len = Math.hypot(bw, bh) * 1.6, wd = L.width * M.k, al = Math.sin(u * Math.PI) * L.a * F.calmA;
      for (const [off, wk, ak] of [[0, 1, 1], [-wd * 1.3, 0.3, 0.75]]) {
        c.save(); c.translate(x0 - bh + (bw + bh * 2) * u + off, (y0 + y1) / 2); c.rotate(L.angle + Math.PI / 2);
        c.globalAlpha = al * ak; c.drawImage(tinted(L.rgb, 'h'), -wd * wk / 2, -len / 2, wd * wk, len); c.restore();
      }
      c.restore();
    }
    // the twinkle on the rims: the band's last moment → a beat after
    const v = F.still ? 0.5 : (tt - L.dur * 0.7) / (L.dur * 0.9);
    if (v > 0 && v < 1) {
      c.globalCompositeOperation = 'lighter';
      L.stars.forEach(([sx, sy], i) => { const w = Math.min(1, Math.max(0, v * 1.6 - i * 0.35)), a = Math.sin(w * Math.PI) * F.calmA, [x, y] = P(M, sx, sy);
        if (a > 0.01) { stamp(c, sparkle(L.rgb), x, y, L.size * M.k * 3 * (0.7 + 0.3 * a), a); stamp(c, glow(L.rgb, 0.3), x, y, L.size * M.k * 1.6, a * 0.5); } });
    }
  },
  // THE TAPE CARD (the owner's ADD-ON): a white CHALK SCRIBBLE drawing itself ONCE as the card appears (the slot's own clock), then it stays
  scribble(c, L, M, t, s, Q, F) {
    if (s.giftBorn == null || t < s.giftBorn) s.giftBorn = t;
    const u = F.still ? 1 : Math.min(1, (t - s.giftBorn - (L.delay || 0)) / L.dur); if (u <= 0) return;
    const pts = L.pts, n = pts.length - 1, upto = u * n;
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = (L.a || 0.9) * (F.full ? 1 : 0.8); c.strokeStyle = `rgb(${L.rgb})`;
    c.lineWidth = Math.max(1, L.w * M.k); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    for (let i = 0; i <= Math.min(n, Math.ceil(upto)); i++) {
      const f = Math.min(1, upto - (i - 1)), [x0, y0] = P(M, pts[Math.max(0, i - 1)][0], pts[Math.max(0, i - 1)][1]), [x1, y1] = P(M, pts[i][0], pts[i][1]);
      const x = i ? x0 + (x1 - x0) * f : x1, y = i ? y0 + (y1 - y0) * f : y1; i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke(); c.restore();
  },
  rays(c, L, M, t, s, Q, F) {
    const [x, y] = P(M, L.at[0], L.at[1]), R = 1800 * M.k, rot = (F.still ? 0.2 : t * L.speed);
    c.save(); if (L.box) clipBox(c, s, M.ox + L.box[0] * M.k, M.oy + L.box[1] * M.k, L.box[2] * M.k, L.box[3] * M.k);   // (the tape card: the red wall only)
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = L.a * F.calmA; c.fillStyle = `rgb(${L.rgb})`;
    for (let i = 0; i < L.n; i++) { const a = rot + i / L.n * TAU, hw = TAU / L.n * 0.22; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - hw) * R, y + Math.sin(a - hw) * R); c.lineTo(x + Math.cos(a + hw) * R, y + Math.sin(a + hw) * R); c.closePath(); c.fill(); }
    c.restore();
  },
  scan(c, L, M, t, s, Q, F) {
    const { w, h } = s; c.save(); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgb(0,0,16)';
    c.globalAlpha = L.a * F.calmA; for (let y = 0; y < h; y += L.gap) c.fillRect(0, y, w, 1);
    if (!F.still) { const fl = L.flicker * (0.5 + 0.5 * Math.sin(t * 47)) * (Math.sin(t * 3.1) > 0.7 ? 1 : 0.25); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fl; c.fillStyle = 'rgb(120,170,255)'; c.fillRect(0, 0, w, h); }
    c.restore();
  },
  grid(c, L, M, t, s, Q, F) {
    const { w } = s, y0 = M.oy + L.y0 * M.k, y1 = M.oy + AH * M.k, cx = w * 0.62;
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgb(${L.rgb})`; c.lineWidth = Math.max(1, 1.6 * M.k * 2);
    for (let i = -12; i <= 12; i++) { c.globalAlpha = L.a * 0.7 * F.calmA; c.beginPath(); c.moveTo(cx + i * 30 * M.k, y0); c.lineTo(cx + i * 260 * M.k, y1); c.stroke(); }
    const off = F.still ? 0.3 : fract(t * L.speed);
    for (let j = 0; j < 8; j++) { const u = (j + off) / 8, y = y0 + (y1 - y0) * u * u; c.globalAlpha = L.a * (0.25 + 0.75 * u) * F.calmA; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.restore();
  },
  text(c, L, M, t, s, Q, F) {
    const spr = textSprite(L), ww = L.size * M.k, hh = ww * 220 / 1024; let [x, y] = P(M, L.at[0], L.at[1]); if (!L.center) x += ww / 2;
    let a = 1, sc = 1;
    if (!F.still) { const u = (t % L.period) / L.period;
      if (L.mode === 'blink') a = u < 0.55 ? 1 : 0.08;
      else { const p = smooth(0, 0.08, u); sc = 1 + (1 - p) * 0.9; a = p * (1 - smooth(0.85, 1, u)) + (u > 0.85 ? 0 : 0) ; a = Math.max(a, 0); if (u > 0.08 && u < 0.14) sc = 1 + Math.sin((u - 0.08) / 0.06 * Math.PI) * 0.06; } }
    c.save(); c.translate(x, y); c.scale(sc, sc); c.globalAlpha = a; c.drawImage(spr, -ww / 2, -hh / 2, ww, hh); c.restore();
  },
  flash(c, L, M, t, s, Q, F) {
    if (F.still) return; const k = Math.floor(t / L.period), u = (t % L.period) / L.period; if (u > 0.12) return;
    const r = rng(k * 7 + 3), x = M.ox + (L.box[0] + r() * L.box[2]) * M.k, y = M.oy + (L.box[1] + r() * L.box[3]) * M.k, a = (1 - u / 0.12) * F.calmA;
    c.globalCompositeOperation = 'lighter'; stamp(c, glow(L.rgb, 0.3), x, y, 260 * M.k, a * 0.8); stamp(c, sparkle(L.rgb), x, y, 140 * M.k, a);
  },
  region(c, L, M, t, s, Q, F) {
    const img = image(`${GIFT_ART}${s.giftArt}.webp`); if (!img) return;
    const [sx, sy, sw, sh] = L.src, [x, y] = P(M, sx, sy), dw = sw * M.k, dh = sh * M.k;
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    if (L.mode === 'spin') {
      const a = F.still ? 0.4 : t / L.period * TAU;
      c.beginPath(); c.arc(x + dw / 2, y + dh / 2, dw / 2 - 0.5, 0, TAU); c.clip();
      c.translate(x + dw / 2, y + dh / 2); c.rotate(a); c.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    } else if (L.mode === 'lift') {   // (the tape card: the tape's corner peeling up a little + settling back — hinged at the piece's left edge)
      const u = F.still ? 0 : fract(t / L.period), a = -Math.sin(smooth(0, 0.35, u) * Math.PI / 2) * (1 - smooth(0.55, 0.8, u)) * L.amp;
      c.save(); c.globalAlpha = 0.35 * Math.min(1, -a / L.amp * 2); c.fillStyle = 'rgb(0,0,0)'; c.fillRect(x + 1, y + 2, dw, dh); c.restore();
      c.translate(x, y + dh); c.rotate(a); c.drawImage(img, sx, sy, sw, sh, 0, -dh, dw, dh);
    } else if (L.mode === 'ripple') {   // (THE CARD PASS: the chequered flag + the torn paper's edge — thin slices of the piece, each shifted a few px
      //  on a travelling wave; axis 'y' = columns moving up / down (the flag), 'x' = rows moving side to side (a torn edge fluttering))
      const n = L.slices || 24, amp = L.amp * M.k * (F.full ? 1 : 0.6), ph = F.still ? 0 : t * (L.speed || 3);
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = (i + 1) / n, w = Math.sin(ph - f0 * (L.k || 6)) * amp;
        if (L.axis === 'x') c.drawImage(img, sx, sy + sh * f0, sw, sh * (f1 - f0) + 0.5, x + w, y + dh * f0, dw, dh * (f1 - f0) + 0.6);
        else c.drawImage(img, sx + sw * f0, sy, sw * (f1 - f0) + 0.5, sh, x + dw * f0, y + w, dw * (f1 - f0) + 0.6, dh);
      }
      if (L.shade && !F.still) {   // (a soft light band rolling along it — the cloth's fold catching the light)
        const u = fract(t / (L.shadePeriod || 2.6)), bx2 = x - dw * 0.3 + u * dw * 1.6;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = L.shade * F.calmA; c.drawImage(tinted('255,255,255', 'h'), bx2 - dw * 0.15, y, dw * 0.3, dh);
      }
    } else if (L.mode === 'jiggle') {   // (THE CARD PASS: the ransom letters, one by one — a pop + a wobble round the piece's centre, scaled up
      //  enough to cover its own spot: no ghost of it shows)
      const u = F.still ? 99 : (t - (L.i || 0) * (L.step || 0.35)) % L.period;
      if (!(u >= 0 && u < 0.9)) { c.restore(); return; }
      const e = Math.exp(-u * 4.5), a = Math.sin(u * 22) * L.amp * e, sc = 1.06 + 0.08 * e;
      c.translate(x + dw / 2, y + dh / 2); c.rotate(a); c.scale(sc, sc); c.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    } else if (L.mode === 'flutter') {   // (THE CARD PASS: the tape strips + the stars — a small sway round a pivot, the piece cut with its own
      //  margin (paper) so the move covers its spot)
      const u = F.still ? 0 : t, a = (Math.sin(u * TAU / L.period) * 0.7 + Math.sin(u * TAU / L.period * 2.3 + 1) * 0.3) * L.amp;
      const [pxv, pyv] = L.piv ? P(M, L.piv[0], L.piv[1]) : [x + dw / 2, y + dh / 2];
      c.translate(pxv, pyv); c.rotate(a); c.scale(1.02, 1.02 + Math.abs(a) * 0.5); c.drawImage(img, sx, sy, sw, sh, x - pxv, y - pyv, dw, dh);
    } else if (L.mode === 'creak') {   // (THE CARD PASS: the radiation sign — a hair of a creak round its foot, clipped to its own shape)
      const u = F.still ? 0 : t, a = (Math.sin(u * TAU / L.period) * 0.75 + Math.sin(u * TAU / (L.period * 0.43)) * 0.25) * L.amp;
      const [pxv, pyv] = P(M, L.piv[0], L.piv[1]);
      c.translate(pxv, pyv); c.rotate(a); c.translate(-pxv, -pyv);
      if (L.poly) { c.beginPath(); L.poly.forEach(([qx, qy], i) => { const [vx, vy] = P(M, qx, qy); i ? c.lineTo(vx, vy) : c.moveTo(vx, vy); }); c.closePath(); c.clip(); }
      c.drawImage(img, sx, sy, sw, sh, x, y, dw, dh);
    } else {   // jitter: a punk frame-step wobble (whole steps, never smooth)
      const k = F.still ? 0 : Math.floor(t / L.period), r = rng(k + 1), j = L.amp * M.k * (F.full ? 1 : 0.6);
      c.translate((r() - 0.5) * 2 * j, (r() - 0.5) * 2 * j); c.drawImage(img, sx, sy, sw, sh, x, y, dw, dh);
    }
    c.restore();
  },
  sprite(c, L, M, t, s, Q, F) {
    const img = image(`${GIFT_ART}${L.art}.webp`); if (!img) return;
    const ww = L.w * M.k, hh = ww * img.height / img.width, b = F.still ? 0 : Math.sin(t * TAU / L.period) * L.bob * M.k, rot = L.rot + (F.still ? 0 : Math.sin(t * TAU / L.period + 1) * 0.015);
    const [x, y] = P(M, L.at[0], L.at[1]);
    c.save(); c.translate(x, y + b); c.rotate(rot);
    c.globalAlpha = 0.28; stamp(c, glow('120,40,60', 0.4), 6 * M.k, 14 * M.k, ww * 1.15, 0.28, hh * 1.1);
    c.globalAlpha = 1; c.drawImage(img, -ww / 2, -hh / 2, ww, hh);
    c.globalCompositeOperation = 'lighter';
    (L.glints || []).forEach(([gx, gy], i) => { const u = F.still ? 0.5 : fract(t / 5 + i * 0.12); if (u > 0.2) return; const k = ww / img.width; stamp(c, sparkle('255,250,220'), -ww / 2 + gx * k, -hh / 2 + gy * k, 70 * M.k * Math.sin(u / 0.2 * Math.PI), F.calmA); });
    c.restore();
  },
  heart(c, L, M, t, s, Q, F) {
    const [x, y] = P(M, L.at[0], L.at[1]), u = F.still ? 0 : Math.max(0, Math.sin(t * TAU / L.period)) ** 3, d = L.size * M.k * (1 + 0.14 * u);
    c.globalCompositeOperation = 'source-over'; stamp(c, heart('#ff4f8f', '#ffd6e6'), x, y, d, 1);
  },
  twinkle(c, L, M, t, s, Q, F) {
    let pts = L.pts;
    if (!pts && L.ring) { const r = rng(5); pts = Array.from({ length: L.n }, () => { const a = r() * TAU, rr = L.ring[2] * (0.92 + r() * 0.12); return [L.ring[0] + Math.cos(a) * rr, L.ring[1] + Math.sin(a) * rr]; }); }
    if (!pts) { const r = rng(L.n * 13 + L.box[1]); pts = Array.from({ length: L.n }, () => [L.box[0] + r() * L.box[2], L.box[1] + r() * L.box[3]]); }
    c.globalCompositeOperation = 'lighter';
    pts.forEach(([px, py], i) => {
      const u = F.still ? 0.5 : fract(t / L.period + i * 0.37), a = Math.sin(u * Math.PI) ** 2 * F.calmA, [x, y] = P(M, px, py), d = L.size * M.k * 2.4 * (0.6 + 0.4 * Math.sin(u * Math.PI));
      if (L.pixel) { c.globalAlpha = a; c.fillStyle = `rgb(${L.rgb})`; const q = Math.max(1, Math.round(d / 7)); c.fillRect(x - q / 2, y - q * 2.5, q, q * 5); c.fillRect(x - q * 2.5, y - q / 2, q * 5, q); }
      else stamp(c, sparkle(L.rgb), x, y, d, a);
    });
  },
  palm(c, L, M, t, s, Q, F) {
    const spr = palmSprite(L.rgb), hh = L.h * M.k, ww = hh / 2, [x, y] = P(M, L.at[0], L.at[1]), a = F.still ? 0 : Math.sin(t * TAU / L.period) * L.sway + wob(t * 0.4, L.at[0]) * L.sway * 0.4;
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.translate(x, y); c.rotate(a); if (L.flip) c.scale(-1, 1); c.drawImage(spr, -ww / 2, -hh, ww, hh); c.restore();
  },
  haze(c, L, M, t, s, Q, F) {
    const bx = M.ox + L.box[0] * M.k, by = M.oy + L.box[1] * M.k, bw = L.box[2] * M.k, bh = L.box[3] * M.k;
    c.save(); clipBox(c, s, bx, by, bw, bh); c.globalCompositeOperation = 'lighter';
    if (L.halftone) { const sp = halftone(L.rgb), cell = 96 * Math.max(0.5, M.k * 1.6), dx = F.still ? 0 : Math.sin(t * 0.7) * 3; c.globalAlpha = L.a * (0.7 + 0.3 * Math.sin(t * 1.3)) * F.calmA;
      for (let y = by; y < by + bh; y += cell) for (let x = bx - cell; x < bx + bw; x += cell) c.drawImage(sp, x + dx, y, cell, cell); c.restore(); return; }
    const n = 7; for (let i = 0; i < n; i++) { const u = fract(i / n - (F.still ? 0 : t * 0.12)), y = by + bh * u, a = Math.sin(u * Math.PI) * L.a * F.calmA; c.globalAlpha = a; c.drawImage(tinted(L.rgb, 'v'), bx + wob(t, i) * 6 * M.k, y - 3 * M.k, bw, 6 * M.k); }
    c.restore();
  },
  drips(c, L, M, t, s, Q, F) {
    c.globalCompositeOperation = 'lighter';
    L.pts.forEach(([px, py, len], i) => {
      const u = F.still ? 0.6 : fract(t / (3 + (i % 3)) + i * 0.29), [x, y] = P(M, px, py), d = len * M.k * smooth(0, 0.7, u), a = (1 - smooth(0.75, 1, u)) * F.calmA;
      c.globalAlpha = a * 0.7; c.drawImage(tinted(L.rgb, 'v'), x - 2 * M.k * 3, y, 4 * M.k * 3, d + 1);
      stamp(c, glow(L.rgb, 0.45), x, y + d, 16 * M.k * 3, a);
    });
  },
  beams(c, L, M, t, s, Q, F) {
    const [x, y] = P(M, L.at[0], L.at[1]), len = 1000 * M.k, wd = 520 * M.k;
    c.save(); c.globalCompositeOperation = 'lighter';
    L.rgb.forEach((rgb, i) => { const a = (i ? 1 : -1) * L.spread + (F.still ? 0 : Math.sin(t * TAU / L.period + i * 2) * L.sway); c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = L.a * F.calmA; c.drawImage(cone(rgb), -wd / 2, 0, wd, len); c.restore(); });
    c.restore();
  },
  smoke(c, L, M, t, s, Q, F) {
    const r = rng(19), n = Math.round(L.n * (F.full ? 1 : 0.6)); c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) { const x0 = r(), y0 = r(), sz = (260 + r() * 260) * M.k, x = M.ox + (L.box[0] + fract(x0 + (F.still ? 0 : t * 0.012 * (0.5 + r()))) * L.box[2]) * M.k, y = M.oy + (L.box[1] + y0 * L.box[3]) * M.k + wob(t * 0.2, i) * 10 * M.k;
      stamp(c, puff(L.rgb, i % 3), x, y, sz, L.a * 4 * F.calmA, sz * 0.6); }
  },
  aurora(c, L, M, t, s, Q, F) {
    const bx = M.ox + L.box[0] * M.k, by = M.oy + L.box[1] * M.k, bw = L.box[2] * M.k, bh = L.box[3] * M.k;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) { const u = i / 8, rgb = L.rgbs[i % L.rgbs.length], x = bx + bw * u, y = by + bh * (0.45 + 0.3 * Math.sin(u * 4 + (F.still ? 0 : t * 0.35) + i)), a = L.a * (0.6 + 0.4 * Math.sin(t * 0.5 + i * 1.7)) * F.calmA;
      stamp(c, glow(rgb, 0.2), x, y, bw * 0.28, a, bh * 0.9); }
    c.restore();
  },
  frost(c, L, M, t, s, Q, F) {
    const u = F.still ? 0.5 : 0.5 + 0.5 * Math.sin(t * TAU / L.period), a = (L.a[0] + (L.a[1] - L.a[0]) * u) * F.calmA, { w, h } = s, inset = (1 - u) * Math.min(w, h) * 0.06;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(frostEdge(L.rgb), -inset, -inset, w + inset * 2, h + inset * 2); c.restore();
  },
  puff(c, L, M, t, s, Q, F) {
    if (F.still) return; const u = (t % L.period) / L.period; if (u > 0.55) return;
    const v = u / 0.55, [x, y] = P(M, L.at[0], L.at[1]), d = (40 + 150 * v) * M.k * 2;
    c.globalCompositeOperation = 'lighter'; stamp(c, puff(L.rgb, 1), x + L.dir * 120 * v * M.k, y - 30 * v * M.k, d, Math.sin(v * Math.PI) * 0.9 * F.calmA, d * 0.7);
  },
  streaks(c, L, M, t, s, Q, F) {
    const r = rng(23); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < L.n; i++) { const y = M.oy + (L.box[1] + r() * L.box[3]) * M.k, ln = (90 + r() * 160) * M.k, u = F.still ? r() : fract(r() - t * (0.25 + r() * 0.3)), x = M.ox + (L.box[0] + u * L.box[2]) * M.k;
      c.globalAlpha = L.a * Math.sin(u * Math.PI) * F.calmA; c.drawImage(tinted(L.rgb, 'h'), x - ln / 2, y - 1.5 * M.k * 2, ln, 3 * M.k * 2); }
  },
  edge(c, L, M, t, s, Q, F) {
    const u = F.still ? 0.6 : 0.5 + 0.5 * Math.sin(t * TAU / L.period), a = (L.a[0] + (L.a[1] - L.a[0]) * u) * F.calmA, { w, h } = s, rad = s.opts.radius || 12;
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgb(${L.rgb})`;
    for (const [lw, k] of [[9, 0.12], [4, 0.3], [1.6, 0.9]]) { c.globalAlpha = a * k; c.lineWidth = lw; c.beginPath(); c.roundRect(2, 2, w - 4, h - 4, Math.max(2, rad - 2)); c.stroke(); }
    c.restore();
  },
  bar(c, L, M, t, s, Q, F) {
    const u = F.still ? 0.4 : (t % L.period) / 1.6; if (u > 1) return;
    const bx = M.ox + L.box[0] * M.k, bw = L.box[2] * M.k, x = bx + bw * u, wd = L.width * M.k * 2;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = L.a * Math.sin(u * Math.PI) * F.calmA; c.drawImage(tinted(L.rgb, 'h'), x - wd / 2, 0, wd, s.h); c.restore();
  },
  // THE SEEING-STARS CARD's pieces (the helpers above)
  spiral(c, L, M, t, s, Q, F) {
    if (F.still) return; const a = born(s, t); if (a <= 0) return;
    const spr = spiralSprite(L, L.size || 1024), P = L.sp, beta = -t * L.speed;
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
    const [x, y] = [M.ox + P.cx * M.k, M.oy + P.cy * M.k];
    c.translate(x, y); c.scale(M.k, M.k); c.rotate(P.rot); c.scale(1, 1 / Math.exp(P.e)); c.rotate(beta);
    c.drawImage(spr, -L.R, -L.R, L.R * 2, L.R * 2);
    c.restore();
  },
  dots(c, L, M, t, s, Q, F) {
    if (F.still) return; const a = born(s, t); if (a <= 0) return;
    const spr = dotTile(L), tw = L.per * 2 * M.k, x0 = M.ox + (L.x0 % (L.per * 2) - L.per * 2) * M.k, y0 = M.oy + (L.y0 % (L.per * 2) - L.per * 2) * M.k;
    const cyc = (t % L.period) / L.period, dx = s.w + s.h;   // (the shimmer: a soft diagonal wave thins the dots as it passes, every period)
    c.save(); c.globalCompositeOperation = 'source-over';
    for (let y = y0; y < s.h; y += tw) for (let x = x0; x < s.w; x += tw) {
      const d = (x + y + tw) / dx - (cyc * 1.6 - 0.3), wave = Math.exp(-d * d / 0.012);
      c.globalAlpha = a * L.a * (1 - L.shimmer * wave * F.calmA);
      c.drawImage(spr, x, y, tw, tw);
    }
    c.restore();
  },
  cutout(c, L, M, t, s, Q, F) {
    if (F.still) return; const a = born(s, t); if (a <= 0) return;
    const img = image(`${GIFT_ART}${L.art}.webp`); if (!img) return;
    const [bx, by, bw, bh] = L.box, [x, y] = P(M, bx, by);
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.drawImage(img, x, y, bw * M.k, bh * M.k); c.restore();
  },
  orbit(c, L, M, t, s, Q, F) {
    if (F.still) return; const a = born(s, t); if (a <= 0) return;
    const R = L.ring, [x, y] = P(M, R.cx, R.cy), back = L.side === 'back';
    c.save(); c.translate(x, y); c.rotate(R.rot);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = a * (back ? 0.8 : 1);
    const rw = R.rx * 2.5 * M.k, rh = R.ry * 2.5 * M.k; c.drawImage(ringSprite(R, L.side), -rw / 2, -rh / 2, rw, rh);
    const spin = t * TAU / L.period, star = starSprite(L.fill);
    for (let i = 0; i < L.n; i++) {
      const ang = L.a0 + i * TAU / L.n + spin, sn = Math.sin(ang);
      if (back ? sn >= 0 : sn < 0) continue;   // (the far half: up the ring, behind him; the near half: down it, in front)
      const depth = 0.5 + 0.5 * sn, sc = 0.66 + 0.34 * depth, tw = 1 + 0.1 * Math.sin(t * 5.3 + i * 2.1);
      const sx = Math.cos(ang) * R.rx * M.k, sy = sn * R.ry * M.k, d = L.size * M.k * sc * tw;
      c.save(); c.translate(sx, sy); c.rotate(-R.rot + Math.sin(t * 2 + i) * 0.25);
      c.globalAlpha = a * (0.55 + 0.45 * depth); c.drawImage(star, -d / 2, -d / 2, d, d); c.restore();
      const u = fract(t / 1.7 + i * 0.37);   // (a sparkle popping off each star in turn)
      if (u < 0.22 && !back) { c.globalCompositeOperation = 'lighter'; stamp(c, sparkle('255,255,230'), sx + d * 0.36, sy - d * 0.3, d * 1.1 * Math.sin(u / 0.22 * Math.PI), a * F.calmA); c.globalCompositeOperation = 'source-over'; }
    }
    c.restore();
  },
  pop(c, L, M, t, s, Q, F) {
    if (F.still) return; const a = born(s, t); if (a <= 0) return;
    const img = image(`${GIFT_ART}${L.art}.webp`); if (!img) return;
    const [bx, by, bw, bh] = L.box, [x, y] = P(M, bx + bw / 2, by + bh / 2), u = (t % L.period) / L.period * L.period;   // (seconds into this period)
    // the hiccup: a quick swell (0.12 s) → a squash back past 1 → a wobble that dies out; between, a faint breathing
    const swell = u < 0.12 ? smooth(0, 0.12, u) : Math.max(0, 1 - (u - 0.12) / 0.5);
    const sc = 1 + 0.26 * swell * (u < 0.12 ? 1 : Math.cos((u - 0.12) * 18)) + 0.02 * Math.sin(t * 2.4);
    const rot = (u < 1.4 ? Math.sin(u * 14) * 0.16 * Math.exp(-u * 2.6) : 0) + Math.sin(t * 1.1) * 0.02;
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
    c.drawImage(img, -bw * M.k / 2, -bh * M.k / 2, bw * M.k, bh * M.k); c.restore();
    if (u < 0.3) { c.globalCompositeOperation = 'lighter'; stamp(c, sparkle('255,255,255'), x + bw * M.k * 0.42, y - bh * M.k * 0.4, bw * M.k * 0.9 * Math.sin(u / 0.3 * Math.PI), a * F.calmA); }
  },
  // ---- THE CARD PASS (Nov 7) — the seven gifts' pieces. FX PLATES (Grok's light on pure black, cut to their light: build-card-pass-art.py)
  //      are drawn 'lighter' — black adds nothing, so no box can show (the OVERCLOCK cards' method)
  //   plate { art, box, mode: 'breathe'|'flicker'|'burst'|'rise', a: [lo, hi], period, pts ('burst': the centres it crackles at, in turn), speed ('rise': art px/s) }
  plate(c, L, M, t, s, Q, F) {
    const img = image(`${GIFT_ART}${L.art}.webp`); if (!img) return;
    const [bx, by, bw, bh] = L.box, lo = L.a[0], hi = L.a[1];
    c.globalCompositeOperation = 'lighter';
    if (L.mode === 'rise') {   // (the embers: the plate scrolls UP, two copies wrapping, a slow sway)
      const off = F.still ? 0 : (t * L.speed) % bh, sw = F.still ? 0 : Math.sin(t * 0.37) * 10;
      c.globalAlpha = hi * F.calmA;
      for (const k of [0, 1]) { const [x, y] = P(M, bx + sw, by - off + k * bh); c.drawImage(img, x, y, bw * M.k, bh * M.k); }
      return;
    }
    if (L.mode === 'burst') {   // (the sparks: a crackle every period at the next point — a fast flicker fading over ~0.5 s)
      if (F.still) return;
      const k = Math.floor(t / L.period), u = t - k * L.period, D = L.dur || 0.55; if (u > D) return;
      const pts = L.pts || [[bx + bw / 2, by + bh / 2]], [cx, cy] = pts[k % pts.length], fl = 0.55 + 0.45 * Math.sin(u * 140) * Math.sin(u * 61);
      const sc = (L.scale || 1) * (0.9 + 0.2 * rng(k + 9)()), w = bw * sc, h = bh * sc, [x, y] = P(M, cx - w / 2, cy - h / 2);
      c.globalAlpha = hi * (1 - u / D) * fl * F.calmA; c.drawImage(img, x, y, w * M.k, h * M.k); return;
    }
    let a;
    if (L.mode === 'flicker') {   // (a CRT's glow: steady, a quick dip now + then, a slow roll)
      a = hi * (0.92 + 0.08 * Math.sin(t * 2.3));
      if (!F.still) { const ph = Math.floor(t * 14), n = fract(Math.sin(ph * 12.9898 + bx) * 43758.5453); if (n < 0.06) a = lo + (hi - lo) * n * 8; }
    } else a = lo + (hi - lo) * (F.still ? 0.5 : 0.5 + 0.5 * Math.sin(t * TAU / L.period + (L.phase || 0)));
    const [x, y] = P(M, bx, by); c.globalAlpha = a * F.calmA; c.drawImage(img, x, y, bw * M.k, bh * M.k);
  },
  //   blinds { box, angle, gap, width, a, speed, sweep: { period, dur, rgb, a, w } } — the venetian blinds' shadows drifting (dark bands
  //   sliding slowly across the slats' own lines) + now + then a car's headlights sweeping through the slats (bright bands in a moving window)
  blinds(c, L, M, t, s, Q, F) {
    const [bx, by, bw, bh] = L.box, [x0, y0] = P(M, bx, by), w = bw * M.k, h = bh * M.k, cx = x0 + w / 2, cy = y0 + h / 2, R = Math.hypot(w, h) / 2 + 4;
    const gap = L.gap * M.k, bandW = L.width * M.k, off = F.still ? 0 : ((t * L.speed) % L.gap) * M.k;
    c.save(); clipBox(c, s, x0, y0, w, h); c.translate(cx, cy); c.rotate(L.angle);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = L.a * (F.full ? 1 : 0.8) * (0.85 + 0.15 * Math.sin(t * 0.5)); c.fillStyle = 'rgb(0,0,0)';
    for (let y = -R - gap + off; y < R; y += gap) c.fillRect(-R, y, R * 2, bandW);
    const S = L.sweep;
    if (S && !F.still) {
      const u = (t % S.period) / S.dur;
      if (u >= 0 && u <= 1) {
        const ww = S.w * M.k, wx = -R - ww + u * (R * 2 + ww * 2), a = Math.sin(u * Math.PI) * S.a * F.calmA;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
        for (let y = -R - gap + off + bandW; y < R; y += gap) c.drawImage(tinted(S.rgb, 'h'), wx - ww, y, ww * 2, gap - bandW);
      }
    }
    c.restore();
  },
  //   siren { pts: [[x, y, rgb]…], r, a, period } — a squad car's lights outside: each colour double-flashes in its own share of the period
  siren(c, L, M, t, s, Q, F) {
    const u = F.still ? 0.1 : fract(t / L.period);
    c.globalCompositeOperation = 'lighter';
    L.pts.forEach(([px, py, rgb], i) => {
      const v = fract(u - i / L.pts.length) * L.pts.length; if (v > 1) return;
      const f = Math.max(0, Math.sin(v * Math.PI * 2)) ** 1.5;   // (two flashes in its share)
      const [x, y] = P(M, px, py); stamp(c, glow(rgb, 0.1), x, y, L.r * M.k * 2, f * L.a * F.calmA);
    });
  },
  //   grain { a } — film grain: a baked noise tile stepping to a new offset 12 times a second
  grain(c, L, M, t, s, Q, F) {
    const tile = sprite('gift-grain', 192, 192, (g, w, h) => { const r = rng(31); for (let i = 0; i < 2600; i++) { const v = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${(0.25 + r() * 0.75).toFixed(2)})`; g.fillRect(r() * w, r() * h, 1 + r(), 1 + r()); } });
    const k = F.still ? 0 : Math.floor(t * 12), r = rng(k + 3), ox = -r() * 192, oy = -r() * 192;
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = L.a * (F.full ? 1 : 0.7);
    for (let y = oy; y < s.h; y += 192) for (let x = ox; x < s.w; x += 192) c.drawImage(tile, x, y, 192, 192);
  },
  //   terminal { screen: [x, y], lines, size, lh, ink, cps, gap, hold } — the game TYPES on the blank CRT, line by line (each line baked once
  //   as a sprite — never text in the GL frame — and revealed a character at a time by a clip), the block cursor blinking after the last letter
  terminal(c, L, M, t, s, Q, F) {
    const [sx, sy] = L.screen, n = L.lines.length, per = [];
    let T = 0; for (const ln of L.lines) { per.push([T, Math.max(0.05, ln.length / L.cps)]); T += ln.length / L.cps + L.gap; }
    const cycle = T + L.hold, u = F.still ? T + 1 : t % cycle;
    const PX = 64, cw = PX * 0.6, scale = L.size / PX;   // (the bake: 64 px a line, monospace → 0.6 em a character)
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) {
      const [t0, d] = per[i]; if (u < t0) break;
      const ln = L.lines[i], typing = u - t0 < d, shown = typing ? Math.floor((u - t0) / d * ln.length) : ln.length;
      const spr = sprite(`gift-term:${ln}:${L.ink}`, Math.ceil(cw * ln.length + 24), PX + 24, (g, w, h) => {
        g.font = `800 ${PX}px "JetBrains Mono", Consolas, monospace`; g.textBaseline = 'middle'; g.fillStyle = L.ink;
        g.shadowColor = L.ink; g.shadowBlur = 5; g.fillText(ln, 12, h / 2);
      });
      const [x, y] = P(M, sx, sy + i * L.lh), ww = spr.width * scale * M.k, hh = spr.height * scale * M.k;
      if (shown > 0) { c.save(); c.beginPath(); c.rect(x, y, (12 + cw * shown) * scale * M.k, hh); c.clip(); c.globalAlpha = 0.94; c.drawImage(spr, x, y, ww, hh); c.restore(); }
      const next = per[i + 1], cursorHere = typing || (i === n - 1) || (next && u < next[0]);
      if (cursorHere && (F.still || fract(t * 1.6) < 0.55)) {   // (the cursor: a block after the last character)
        c.globalAlpha = 0.85; c.fillStyle = L.ink;
        const ch = PX * 0.74 * scale * M.k, cx2 = x + (12 + cw * shown) * scale * M.k + 1.5 * M.k;
        c.fillRect(cx2, y + hh / 2 - ch / 2, cw * 0.8 * scale * M.k, ch);
      }
      if (typing) break;
    }
  },
  //   rush { at, ang: [a0, a1], r: [r0, r1], n, rgb, a, len, speed } — speed lines: bright dashes racing out along the rays from a focus
  rush(c, L, M, t, s, Q, F) {
    const r = rng(41), [fx, fy] = P(M, L.at[0], L.at[1]); c.globalCompositeOperation = 'lighter';
    const n = Math.round(L.n * (F.full ? 1 : 0.6));
    for (let i = 0; i < n; i++) {
      const ang = L.ang[0] + r() * (L.ang[1] - L.ang[0]), sp = 0.6 + r() * 0.8, ph = r(), lr = 0.6 + 0.8 * r();
      const u = F.still ? ph : fract(ph + t * L.speed * sp), d = (L.r[0] + u * (L.r[1] - L.r[0])) * M.k, len = L.len * M.k * lr;
      const a = Math.sin(u * Math.PI) * L.a * F.calmA;
      c.save(); c.translate(fx + Math.cos(ang) * d, fy + Math.sin(ang) * d); c.rotate(ang); c.globalAlpha = a; c.drawImage(tinted(L.rgb, 'h'), 0, -3.2 * M.k, len, 6.4 * M.k); c.restore();
    }
  },
  //   shimmer { box, n, rgb, a, len } — the river: short horizontal glints flickering in and out (the sun on the water)
  shimmer(c, L, M, t, s, Q, F) {
    const r = rng(53), n = Math.round(L.n * (F.full ? 1 : 0.6)); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const x = L.box[0] + r() * L.box[2], y = L.box[1] + r() * L.box[3], ph = r(), per = 1.2 + r() * 1.8, len = L.len * (0.5 + r());
      const u = F.still ? ph : fract(ph + t / per), a = Math.sin(u * Math.PI) ** 2 * L.a * F.calmA; if (a < 0.02) continue;
      const [px, py] = P(M, x + (F.still ? 0 : Math.sin(t * 0.6 + i) * 6), y);
      c.globalAlpha = a; c.drawImage(tinted(L.rgb, 'h'), px - len * M.k / 2, py - 1.4 * M.k, len * M.k, 2.8 * M.k);
    }
  },
  //   trace { ell: [cx, cy, rx, ry, rot], from, to (rad), rgb, w, dur, hold, period } — a red marker going round the circle: a fresh-ink line
  //   drawing itself on (the circle under it is the art's own), holding, then fading — first as the card appears
  trace(c, L, M, t, s, Q, F) {
    const u = F.still ? L.dur + 0.1 : t % L.period; if (u > L.dur + L.hold + 0.8) return;
    const p = smooth(0, L.dur, u), fade = u > L.dur + L.hold ? 1 - (u - L.dur - L.hold) / 0.8 : 1;
    if (p <= 0 || fade <= 0) return;
    const [cx, cy, rx, ry, rot] = L.ell, end = L.from + (L.to - L.from) * p, N = Math.max(8, Math.ceil(64 * p));
    const at = a => { const ex = rx * Math.cos(a), ey = ry * Math.sin(a); return P(M, cx + ex * Math.cos(rot) - ey * Math.sin(rot), cy + ex * Math.sin(rot) + ey * Math.cos(rot)); };
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.9 * fade * (F.full ? 1 : 0.8); c.strokeStyle = `rgb(${L.rgb})`;
    c.lineWidth = L.w * M.k; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    for (let i = 0; i <= N; i++) { const [x, y] = at(L.from + (end - L.from) * i / N); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    if (p < 1) { const [x, y] = at(end); c.globalCompositeOperation = 'lighter'; stamp(c, glow('255,140,150', 0.3), x, y, L.w * M.k * 9, 0.7 * fade); }   // (the nib)
    c.restore();
  },
  //   flicker { period, rgb, a, box? } — the photocopier: now + then two quick frames of light across the print
  flicker(c, L, M, t, s, Q, F) {
    if (F.still) return; const u = t % L.period; if (u > 0.22) return;
    if (!((u < 0.05) || (u > 0.11 && u < 0.16))) return;
    const [bx, by, bw, bh] = L.box || [0, 0, 1280, 800], [x, y] = P(M, bx, by);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = L.a * F.calmA; c.fillStyle = `rgb(${L.rgb})`; c.fillRect(x, y, bw * M.k, bh * M.k);
  },
};

/** one card's effect */
export function giftFx(card) {
  const S = GIFT_SPECS[card];
  return {
    id: `gift:${card}`, tier: 'legendary', bleed: 0, stillT: 2.2,
    draw(c, s, t, Q) {
      if (!S) return;
      const full = !!s.opts.full, still = !!Q.still, calm = s.opts.calm ? 0.75 : 1;
      // (the tape card: a card may have its OWN strip picture — `stripArt` { art, h, crop, hero, layers } in its picture's px; every other card's
      //  strip = the full picture's middle band)
      const st = !full && S.stripArt;
      const M = st ? artMap(s.w, s.h, st.crop || [50, 50], st.h) : artMap(s.w, s.h, full ? (S.full || [50, 50]) : S.strip);
      s.giftArt = st ? st.art : S.art;
      const F = { full, still, calmA: full ? 1 : 0.85 * calm };
      c.save(); rrect(c, 0, 0, s.w, s.h, s.opts.radius || 12); c.clip();
      for (const L of (st ? st.layers : S.layers)) {
        if (L.on === 'full' && !full) continue;
        c.save(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        try { DRAW[L.t](c, L, M, still ? 2.2 + (L.at ? L.at[0] % 3 : 0) : t, s, Q, F); } catch (e) { /* one layer never stops the card */ }
        c.restore();
      }
      c.restore();
    },
  };
}
