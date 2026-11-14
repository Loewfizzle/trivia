// PRISM DROP — THE SKIN KIT (SKINS 1 — docs/prism.md "THE SKINS"): what every skin's drawing code shares — a LEAF (it imports the engine's
// sizes only), so skins.js (the registry), the board (board.js) and each skin's art module can all take it without a cycle.
//   JEWEL (the pieces' colour families — every skin keeps them) · hexRgb · rgba · mix · mixA · greyOf · rr (a rounded rect path)
//   ghostBlocked(cells, x, bot, top) — the incoming rows' rule (an occupied cell is only TINTED)
//   lightIncoming(spr, edge) — the incoming rows drawn as LIGHT ('lighter': a dark well glows through them — the night's)
//   sketchIncoming({ spr, ink, marks, edge }) — the incoming rows drawn on PAPER (source-over: a sketch / a wash / card stock — the day's)
//   spriteCache() — a per-skin sprite cache whose canvases give their pixels back at once when cleared
//   seeded(seed) — a small seeded random (a variant draws the same on every phone, every time)
import { W, VISIBLE } from './engine.js';

// jewel colours: 1 I aquamarine, 2 O citrine, 3 T amethyst, 4 S emerald, 5 Z ruby, 6 J sapphire, 7 L fire opal, 8 junk (smoky quartz)
export const JEWEL = [null, '#2be4f0', '#ffc93a', '#b46bff', '#2fe07a', '#ff4d6d', '#4a86ff', '#ff9b3d', '#6b7385'];
// (PD-2) the INCOMING rows' warning red (the looks that draw them as light)
export const INCOMING = '#ff4f74';

export function hexRgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
export const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
export const mix = (h, t, k) => { const a = hexRgb(h), b = hexRgb(t); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`; };
export const mixA = (h, t, k, a) => { const x = hexRgb(h), y = hexRgb(t); return `rgba(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')},${a})`; };
export const grey = h => { const [r, g, b] = hexRgb(h); const l = Math.round(r * 0.3 + g * 0.55 + b * 0.15); const c = v => Math.round(v * 0.82 + 18).toString(16).padStart(2, '0'); return `#${c(l * 0.8)}${c(l * 0.9)}${c(l)}`; };

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** a small seeded random (each variant draws the same every time — a refresh, a resize, another phone) */
export function seeded(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/** a sprite cache: get(key, make) · clear() (every canvas gives its pixels back at once) · size */
export function spriteCache() {
  const m = new Map();
  return {
    get(key, make) { let s = m.get(key); if (!s) { s = make(); m.set(key, s); } return s; },
    has: key => m.has(key),
    clear() { for (const c of m.values()) if (c && typeof c.width === 'number') { c.width = 0; c.height = 0; } m.clear(); },
    get size() { return m.size; },
  };
}
export const newCanvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// ---------------------------------------------------------------- THE INCOMING ROWS (PD-2 — every skin keeps the rules)
// `incoming(ctx, bands, o)` paints THE RISING GHOST ROWS (incoming.js#ghostBands — bottom-up) OVER the board's bottom rows and returns each drawn
// row's place (canvas px) for the cancel. The rules every skin keeps: an occupied cell is only TINTED (the stack stays readable through them —
// never covered), the gap column stays open, the rows never move the real stack.
/** PFIX-B (FABLE REVIEW optional 14): a rising ghost row sits BETWEEN two stack rows while it rises — its cell is drawn only where EVERY stack
 *  row it overlaps is empty (was: the row under its middle — a half-risen row showed half a ghost cell over a block); otherwise only tinted */
export function ghostBlocked(cells, x, bot, top) {
  for (let r = Math.max(0, Math.floor(bot)); r < Math.min(VISIBLE, Math.ceil(top - 1e-6)); r++) if (cells[r * W + x]) return true;
  return false;
}
/** the ghost rows drawn as LIGHT — `spr(px, kind, pal)` gives the skin's own 'incoming' + 'iglow' sprites; `edge` its leading edge */
export function lightIncoming(spr, edge) {
  /** o: { px, cells, H (canvas height px), now (ms), reduced, pal } → [{ y, h, gap }] (one per visible row, top first) */
  return function incoming(ctx, bands, { px, cells, H, now, reduced, pal }) {
      const geo = [];
      if (!bands || !bands.length) return geo;
      const ghost = spr(px, 'incoming', pal);
      const halo = spr(px, 'iglow', pal);
      let base = 0;   // rows above the bottom edge already taken by the bands under this one
      for (const b of bands) {
        const top = base + b.rows;
        // a gentle shake (stronger once it's due) + a breathing glow; reduced motion = still
        const w = now / 1000;
        const shake = reduced ? 0 : Math.round(Math.sin(w * Math.PI * 2 * (b.hot ? 7 : 3)) * px * (b.hot ? 0.05 : 0.022));
        const a = b.hot ? 0.86 + (reduced ? 0 : 0.12 * Math.sin(w * Math.PI * 2 * 3)) : 0.6 + 0.26 * b.prog;
        for (let k = 0; k < b.n; k++) {
          const rTop = top - k, rBot = rTop - 1;
          if (rTop <= base) break;
          const vBot = Math.max(rBot, base);
          const y = H - rTop * px, hh = (rTop - vBot) * px;
          if (hh < 0.5) continue;
          for (let x = 0; x < W; x++) {
            if (x === b.gap) continue;
            if (ghostBlocked(cells, x, vBot, rTop)) {
              ctx.globalAlpha = 0.16;
              ctx.fillStyle = INCOMING;
              ctx.fillRect(x * px, y, px, hh);
            } else {
              // a lit ghost: added light (the dark well glows red through it), a soft halo under it
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = a * 0.4;
              ctx.drawImage(halo, x * px + shake - (halo.width - px) / 2, y - (halo.height - px) / 2 + (hh - px) / 2);
              ctx.globalAlpha = a;
              ctx.drawImage(ghost, 0, 0, ghost.width, ghost.height * (hh / px), x * px + shake, y, px, hh);
              ctx.globalCompositeOperation = 'source-over';
            }
          }
          geo.push({ y, h: hh, gap: b.gap });
        }
        base = top;
      }
      ctx.globalAlpha = 1;
      // the leading edge: one bright line across the top of everything incoming + a soft red light rising above it
      const yTop = H - base * px;
      ctx.globalCompositeOperation = 'lighter';
      const gl = ctx.createLinearGradient(0, yTop - px * 1.2, 0, yTop);
      gl.addColorStop(0, rgba(INCOMING, 0));
      gl.addColorStop(1, rgba(INCOMING, 0.32));
      ctx.fillStyle = gl;
      ctx.fillRect(0, yTop - px * 1.2, W * px, px * 1.2);
      ctx.fillStyle = edge.core;
      ctx.fillRect(0, yTop - Math.max(1, px * 0.04), W * px, Math.max(2, px * edge.w));
      if (edge.halo) { ctx.fillStyle = edge.halo; ctx.fillRect(0, yTop - px * 0.12, W * px, px * 0.24); }
      ctx.globalCompositeOperation = 'source-over';
      geo.sort((p, q) => p.y - q.y);
      return geo;
  };
}
/** (PD-4's crayon rows, made general) the INCOMING rows drawn ON PAPER (source-over — paint, not light): `spr(px, hot)` = the row's cell
 *  (a pencil sketch · a grey wash · grey card stock — never a block of the skin), `ink` = the tint over an occupied cell + the warning marks +
 *  the leading edge, `marks` = the shaking marks at both sides (motion lines), `edge(ctx, yTop, px)` = the skin's own leading edge (default: a
 *  firm doubled line in `ink`). The same rules as every skin (an occupied cell only tinted, the gap open, never covering a block). */
export function sketchIncoming({ spr, ink, marks = true, edge = null }) {
  return function incoming(ctx, bands, { px, cells, H, now, reduced }) {
    const geo = [];
    if (!bands || !bands.length) return geo;
    let base = 0;
    const w = now / 1000;
    for (const b of bands) {
      const top = base + b.rows;
      const shake = reduced ? 0 : Math.round(Math.sin(w * Math.PI * 2 * (b.hot ? 7 : 3)) * px * (b.hot ? 0.05 : 0.022));
      const a = b.hot ? 0.95 : 0.62 + 0.3 * b.prog;
      const ghost = spr(px, !!b.hot);
      let yTopBand = null;
      for (let k = 0; k < b.n; k++) {
        const rTop = top - k, rBot = rTop - 1;
        if (rTop <= base) break;
        const vBot = Math.max(rBot, base);
        const y = H - rTop * px, hh = (rTop - vBot) * px;
        if (hh < 0.5) continue;
        if (yTopBand === null) yTopBand = y;
        for (let x = 0; x < W; x++) {
          if (x === b.gap) continue;
          if (ghostBlocked(cells, x, vBot, rTop)) { ctx.globalAlpha = 0.16; ctx.fillStyle = ink; ctx.fillRect(x * px, y, px, hh); }
          else { ctx.globalAlpha = a; ctx.drawImage(ghost, 0, 0, ghost.width, ghost.height * (hh / px), x * px + shake, y, px, hh); }
        }
        geo.push({ y, h: hh, gap: b.gap });
      }
      // the shaking marks at both sides of the band — a warning, drawn like motion lines
      if (marks && yTopBand !== null && !reduced) {
        const yMid = (yTopBand + (H - base * px)) / 2, j = Math.sin(w * Math.PI * 2 * (b.hot ? 9 : 4)) * px * 0.06;
        ctx.globalAlpha = b.hot ? 0.9 : 0.6;
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(1.5, px * 0.045);
        ctx.lineCap = 'round';
        for (const side of [-1, 1]) {
          const x0 = side < 0 ? px * 0.16 : W * px - px * 0.16;
          for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.arc(x0 + side * (i * px * 0.14 - j), yMid, px * (0.24 + i * 0.12), side < 0 ? Math.PI * 0.72 : -Math.PI * 0.28, side < 0 ? Math.PI * 1.28 : Math.PI * 0.28);
            ctx.stroke();
          }
        }
      }
      base = top;
    }
    ctx.globalAlpha = 1;
    // the leading edge across the top of everything incoming
    const yTop = H - base * px;
    if (edge) edge(ctx, yTop, px);
    else {
      // a firm line (doubled — a pencil pressed hard)
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(0, yTop - Math.max(1, px * 0.02), W * px, Math.max(2, px * 0.04));
      ctx.globalAlpha = 0.45;
      ctx.fillRect(0, yTop - px * 0.09, W * px, Math.max(1, px * 0.02));
    }
    ctx.globalAlpha = 1;
    geo.sort((p, q) => p.y - q.y);
    return geo;
  };
}

// ---- the contrast measure (WCAG) — the contract's "readable ink" (tests/prism-skins.test.mjs)
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export const lum = hex => { const [r, g, b] = hexRgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
