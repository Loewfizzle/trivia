// THE JETS' KIT (THE VAULT 1C — card-sg-blackbird + card-sg-f22): afterburners with shock diamonds, contrails / vapour bands, a cloud deck seen from
// above (tileable, scrolled). Every piece a BAKED sprite stamped with a transform — no gradient built per frame (js/fx/kit.js's rule).
import { sprite, rng } from './kit.js';

/** an afterburner's flame, baked pointing +x (its root at the left, mid-height): a white-hot core → amber → a coloured fringe */
export const flameSprite = (hot = '255,250,230', mid = '255,170,70', edge = '120,140,255') => sprite(`sg-ab:${hot}:${mid}:${edge}`, 160, 48, (c, W, H) => {
  const body = (k, col) => {
    const g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, `rgba(${col},${0.95 * k})`); g.addColorStop(0.35, `rgba(${col},${0.6 * k})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.beginPath(); c.moveTo(0, H / 2 - H * 0.42 * k); c.quadraticCurveTo(W * 0.4, H / 2 - H * 0.3 * k, W, H / 2); c.quadraticCurveTo(W * 0.4, H / 2 + H * 0.3 * k, 0, H / 2 + H * 0.42 * k); c.closePath(); c.fill();
  };
  c.globalCompositeOperation = 'lighter';
  body(1, edge); body(0.72, mid); body(0.38, hot);
});
/** a contrail / a vapour band: a long soft band baked along +x, opaque at the root, fading out, soft top + bottom */
export const bandSprite = (rgb = '255,255,255') => sprite(`sg-band:${rgb}`, 256, 32, (c, W, H) => {
  for (let i = 0; i < H; i++) {
    const v = 1 - Math.abs((i + 0.5) / H - 0.5) * 2, a = Math.pow(v, 1.6);
    const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.25, `rgba(${rgb},${a * 0.75})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, i, W, 1);
  }
});
const diamond = () => sprite('sg-diamond', 32, 32, (cc, W) => {
  const g = cc.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
  g.addColorStop(0, 'rgba(255,255,245,1)'); g.addColorStop(0.3, 'rgba(255,230,190,0.7)'); g.addColorStop(1, 'rgba(255,170,90,0)');
  cc.fillStyle = g; cc.fillRect(0, 0, W, W);
});
/** an afterburner at (x, y) blowing toward ang (rad), len long, wid wide: the flame + its SHOCK DIAMONDS, flickering (t) */
export function afterburner(c, x, y, ang, len, wid, t, still, k = 1, cols) {
  const F = cols ? flameSprite(...cols) : flameSprite(), fl = still ? 1 : 0.88 + 0.12 * Math.sin(t * 47 + x) * Math.sin(t * 31 + y);
  c.save(); c.translate(x, y); c.rotate(ang);
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = Math.min(1, 0.95 * k); c.drawImage(F, 0, -wid / 2, len * fl, wid);
  c.globalAlpha = Math.min(1, 0.45 * k); c.drawImage(F, 0, -wid * 0.9, len * 1.35 * fl, wid * 1.8);
  const D = diamond();
  for (let i = 0; i < 5; i++) {
    const u = 0.1 + i * 0.16, a = (1 - i / 5) * (still ? 0.8 : 0.7 + 0.3 * Math.sin(t * 23 + i * 1.7)) * k;
    c.globalAlpha = Math.min(1, a); const dw = wid * (0.9 - i * 0.1);
    c.drawImage(D, len * u - dw * 0.7, -dw * 0.32, dw * 1.4, dw * 0.64);
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
/** a contrail from (x, y) toward ang: len long, w0 at the root widening to w1, rgb, a — a few wobbling segments (it lingers + spreads) */
export function contrail(c, x, y, ang, len, w0, w1, rgb, a, t, still, n = 4) {
  const B = bandSprite(rgb);
  c.save(); c.translate(x, y); c.rotate(ang); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const u0 = i / n, seg = len / n, wy = still ? 0 : Math.sin(t * 0.9 + i * 1.3) * w1 * 0.15 * u0;
    c.globalAlpha = a * (1 - u0 * 0.85);
    const wd = w0 + (w1 - w0) * (u0 + 0.5 / n);
    c.drawImage(B, 0, 0, 40, 32, len * u0, -wd / 2 + wy, seg * 1.05, wd);
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
/** a CLOUD DECK seen from above, baked tileable across w: puffy tops lit from the low sun (o.lit), shade beneath (o.shade) */
export function cloudDeck(key, w, hh, dpr, o) {
  return sprite(`sg-deck:${key}:${w}x${Math.round(hh)}@${dpr}`, w * dpr, hh * dpr, (c) => {
    c.scale(dpr, dpr);
    const r = rng(o.seed || 7);
    const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, `rgba(${o.base},0)`); g.addColorStop(0.35, `rgba(${o.base},0.9)`); g.addColorStop(1, `rgba(${o.deep},1)`);
    c.fillStyle = g; c.fillRect(0, 0, w, hh);
    const flat = o.flat || 0.42;
    const puff = (x, y, R) => {
      for (const dx of [-w, 0, w]) {                       // (wrapped: the tile repeats seamlessly)
        const X = x + dx; if (X + R < 0 || X - R > w) continue;
        c.save(); c.translate(X, y); c.scale(1, flat); c.translate(-X, -y);
        let gg = c.createRadialGradient(X, y, 0, X, y, R); gg.addColorStop(0, `rgba(${o.shade},0.95)`); gg.addColorStop(0.7, `rgba(${o.shade},0.6)`); gg.addColorStop(1, `rgba(${o.shade},0)`);
        c.fillStyle = gg; c.beginPath(); c.arc(X, y, R, 0, Math.PI * 2); c.fill();
        const lx = X + R * 0.25 * (o.side || -1);
        gg = c.createRadialGradient(lx, y - R * 0.45, 0, X, y - R * 0.3, R * 0.9); gg.addColorStop(0, `rgba(${o.lit},${o.litA || 0.9})`); gg.addColorStop(0.5, `rgba(${o.lit},${(o.litA || 0.9) * 0.35})`); gg.addColorStop(1, `rgba(${o.lit},0)`);
        c.fillStyle = gg; c.beginPath(); c.arc(X, y, R, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    };
    const n = Math.round(w / 6);
    for (let row = 0; row < 4; row++) for (let i = 0; i < n; i++) {
      const R = (o.puff || 9) * (0.7 + r() * 0.9) * (1 + row * 0.45), x = r() * w, y = hh * (0.1 + row * 0.24) + r() * hh * 0.1;
      puff(x, y, R);
    }
  });
}
/** draw a tileable sprite scrolled by off (px) across w */
export function scrollTile(c, img, off, x, y, w, h) {
  const o = ((off % w) + w) % w;
  c.drawImage(img, x - o, y, w, h); c.drawImage(img, x - o + w, y, w, h);
}
