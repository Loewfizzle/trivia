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
  const k = Math.max(w / AW, h / ah) * (crop[2] || 1), dw = AW * k, dh = AH * k;
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
    const [x, y] = P(M, L.at[0], L.at[1]), r = L.r * M.k * 2, u = 0.5 + 0.5 * Math.sin(t * TAU / L.period);
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
