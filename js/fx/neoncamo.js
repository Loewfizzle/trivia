// `card-neoncamo` (rare — an effect + glowing edges): CAMO, BUT IT GLOWS — the dark camo's own patches (assets/vault/camo-dark.webp — the
// card's material) traced in NEON along their edges (an edge map of the same image, baked once per size, mapped exactly as the CSS lays
// the texture: cover, centred), teal into magenta across the card; a WAVE of power runs through it, lighting the outlines as it passes,
// leaving them glowing faintly behind.
import { sprite } from './kit.js';
import { rrect } from './renderer.js';
import { image } from './sg-kit.js';

const SRC = new URL('../../assets/vault/camo-dark.webp', import.meta.url).href;
/** the outlines, baked: the texture drawn as the CSS covers the box, its luminance edges → neon (glow + line passes) */
const edges = (img, w, h, dpr) => sprite(`fx-ncamo:${w}x${h}@${dpr}`, w * dpr, h * dpr, (c, W, H) => {
  const k = Math.max(W / img.width, H / img.height), dw = img.width * k, dh = img.height * k;
  const t = document.createElement('canvas'); t.width = W; t.height = H; const x = t.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const src = x.getImageData(0, 0, W, H).data, out = x.createImageData(W, H), o = out.data, L = i => src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11;
  for (let y = 1; y < H - 1; y++) for (let xx = 1; xx < W - 1; xx++) {
    const i = (y * W + xx) * 4, g = Math.abs(L(i + 4) - L(i - 4)) + Math.abs(L(i + W * 4) - L(i - W * 4));
    if (g < 4) continue;
    const a = Math.min(1, (g - 4) / 8) * 0.85, u = xx / W;
    o[i] = 40 + 215 * u; o[i + 1] = 255 - 175 * u; o[i + 2] = 220 + 35 * u; o[i + 3] = 255 * a;
  }
  x.putImageData(out, 0, 0);
  // a glow pass (down + up) under the crisp line
  const s1 = document.createElement('canvas'); s1.width = Math.max(1, W >> 2); s1.height = Math.max(1, H >> 2); s1.getContext('2d').drawImage(t, 0, 0, s1.width, s1.height);
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1; c.drawImage(s1, 0, 0, W, H); c.drawImage(t, 0, 0);
  t.width = t.height = s1.width = s1.height = 0;
});

export default {
  id: 'neoncamo', tier: 'rare', bleed: 0, stillT: 1.4,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, img = image(SRC), full = !!s.opts.full;
    if (!img) return;
    const dpr = Math.min(2, Math.max(1, Math.round(Q.dpr * 2) / 2)), E = edges(img, w, h, dpr);
    const P = full ? 4.8 : 4, u = Q.still ? 0.5 : ((t / P + (s.opts.seed || 0) * 0.3) % 1.4) / 1.2, N = full ? 36 : 28, cw = w / N;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N, d = u - x, k = d < 0 ? Math.exp(-(d * d) / 0.002) : Math.exp(-d / 0.35);
      const a = (0.3 + 0.55 * k) * (s.opts.calm ? 0.85 : 1);
      c.globalAlpha = a; c.drawImage(E, i * cw * dpr, 0, cw * dpr, h * dpr, i * cw, 0, cw, h);
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
