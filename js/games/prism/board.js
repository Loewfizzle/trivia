// PRISM DROP board rendering (Canvas 2D, crisp at the FULL device pixel ratio — 3× on an iPhone since PD-1; the quality tiers step it down).
// Blocks are pre-rendered "glass crystal" sprites per piece colour — gradient body, inner glow, a facet, a
// specular glint, clean bright edges — plus a soft glow sprite drawn under them and a desaturated set for the
// danger drain. A frame is ~200 drawImage calls: cheap on any phone.
import { W, VISIBLE, SHAPES, BOX, cellsOf, ghostY } from './engine.js';

// jewel colours: 1 I aquamarine, 2 O citrine, 3 T amethyst, 4 S emerald, 5 Z ruby, 6 J sapphire, 7 L fire opal, 8 junk (smoky quartz)
export const JEWEL = [null, '#2be4f0', '#ffc93a', '#b46bff', '#2fe07a', '#ff4d6d', '#4a86ff', '#ff9b3d', '#6b7385'];

const sprites = new Map(); // `${size}|${kind}` -> canvas

function hexRgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
const mix = (h, t, k) => { const a = hexRgb(h), b = hexRgb(t); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`; };
const mixA = (h, t, k, a) => { const x = hexRgb(h), y = hexRgb(t); return `rgba(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')},${a})`; };
const grey = h => { const [r, g, b] = hexRgb(h); const l = Math.round(r * 0.3 + g * 0.55 + b * 0.15); const c = v => Math.round(v * 0.82 + 18).toString(16).padStart(2, '0'); return `#${c(l * 0.8)}${c(l * 0.9)}${c(l)}`; };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function blockSprite(size, color, junk = false) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const p = Math.max(1, size * 0.045);
  const s = size - 2 * p;
  const r = size * 0.16;
  // body
  const g = x.createLinearGradient(p, p, p + s, p + s);
  g.addColorStop(0, mix(color, '#ffffff', junk ? 0.12 : 0.32));
  g.addColorStop(0.45, color);
  g.addColorStop(1, mix(color, '#000000', junk ? 0.45 : 0.38));
  rr(x, p, p, s, s, r);
  x.fillStyle = g;
  x.fill();
  x.save();
  rr(x, p, p, s, s, r);
  x.clip();
  // inner glow (light from inside the crystal)
  const ig = x.createRadialGradient(p + s * 0.5, p + s * 0.55, s * 0.05, p + s * 0.5, p + s * 0.5, s * 0.7);
  ig.addColorStop(0, junk ? 'rgba(255,255,255,0)' : mixA(color, '#ffffff', 0.55, 0.45));
  ig.addColorStop(1, rgba(color, 0));
  x.fillStyle = ig;
  x.fillRect(0, 0, size, size);
  // facet: a lighter upper-left plane cut diagonally
  x.beginPath();
  x.moveTo(p, p);
  x.lineTo(p + s * 0.78, p);
  x.lineTo(p + s * 0.22, p + s * 0.78);
  x.lineTo(p, p + s * 0.62);
  x.closePath();
  x.fillStyle = `rgba(255,255,255,${junk ? 0.05 : 0.13})`;
  x.fill();
  // lower facet: darker
  x.beginPath();
  x.moveTo(p + s, p + s * 0.35);
  x.lineTo(p + s, p + s);
  x.lineTo(p + s * 0.35, p + s);
  x.closePath();
  x.fillStyle = 'rgba(0,0,0,0.16)';
  x.fill();
  // specular glint
  const sg = x.createRadialGradient(p + s * 0.28, p + s * 0.24, 0, p + s * 0.28, p + s * 0.24, s * 0.3);
  sg.addColorStop(0, `rgba(255,255,255,${junk ? 0.18 : 0.6})`);
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = sg;
  x.fillRect(0, 0, size, size);
  x.restore();
  // edges: bright top-left rim, darker bottom-right rim
  rr(x, p + 0.5, p + 0.5, s - 1, s - 1, r);
  x.lineWidth = Math.max(1, size * 0.05);
  const eg = x.createLinearGradient(p, p, p + s, p + s);
  eg.addColorStop(0, `rgba(255,255,255,${junk ? 0.25 : 0.75})`);
  eg.addColorStop(0.5, rgba(color, 0.9));
  eg.addColorStop(1, 'rgba(0,0,0,0.35)');
  x.strokeStyle = eg;
  x.stroke();
  return c;
}

function glowSprite(size, color) {
  const c = document.createElement('canvas');
  const n = Math.round(size * 2.2);
  c.width = c.height = n;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(n / 2, n / 2, size * 0.2, n / 2, n / 2, n / 2);
  g.addColorStop(0, rgba(color, 0.55));
  g.addColorStop(0.5, rgba(color, 0.16));
  g.addColorStop(1, rgba(color, 0));
  x.fillStyle = g;
  x.fillRect(0, 0, n, n);
  return c;
}

function ghostSprite(size, color) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const p = Math.max(1, size * 0.08);
  rr(x, p, p, size - 2 * p, size - 2 * p, size * 0.16);
  x.fillStyle = rgba(color, 0.13);
  x.fill();
  x.lineWidth = Math.max(1, size * 0.06);
  x.strokeStyle = rgba(color, 0.62);
  x.stroke();
  return c;
}

// (PD-2) an INCOMING ghost cell: see-through warning red, a bright rim, a lit top edge — a ghost, never a solid block
const INCOMING = '#ff4f74';
function incomingSprite(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const p = Math.max(1, size * 0.07);
  const s = size - 2 * p;
  rr(x, p, p, s, s, size * 0.14);
  x.fillStyle = rgba(INCOMING, 0.26);
  x.fill();
  // diagonal hatching: a ghost, never mistaken for a glass block (a ruby block is solid + glossy)
  x.save();
  rr(x, p, p, s, s, size * 0.14);
  x.clip();
  x.strokeStyle = 'rgba(255,150,172,0.62)';
  x.lineWidth = Math.max(1, size * 0.07);
  for (let k = -1; k <= 2; k++) { const o = p + k * s * 0.42; x.beginPath(); x.moveTo(o, p + s); x.lineTo(o + s, p); x.stroke(); }
  x.restore();
  x.lineWidth = Math.max(1, size * 0.06);
  x.strokeStyle = 'rgba(255,186,200,0.95)';
  x.stroke();
  return c;
}

export function sprite(size, kind, t) {
  const key = `${size}|${kind}|${t}`;
  let s = sprites.get(key);
  if (!s) {
    const col = JEWEL[t] || JEWEL[8];
    s = kind === 'block' ? blockSprite(size, col, t === 8)
      : kind === 'grey' ? blockSprite(size, grey(col), true)
        : kind === 'glow' ? glowSprite(size, col)
          : kind === 'incoming' ? incomingSprite(size)
            : kind === 'iglow' ? glowSprite(size, INCOMING)
            : ghostSprite(size, col);
    sprites.set(key, s);
  }
  return s;
}
export const clearSprites = () => sprites.clear();

// ---------------------------------------------------------------- THE LOOKS' DRAWING HOOKS (PD-2)
// A look = how the board's own pieces are drawn, behind one interface (the owner's LOOK SYSTEM — PD-3 night / PD-4 day add theirs; the engine
// never changes). PD-2 adds the first hook: `incoming(ctx, bands, o)` paints THE RISING GHOST ROWS (incoming.js#ghostBands — bottom-up) OVER
// the board's bottom rows and returns each drawn row's place (canvas px) for the shatter. The rules every look keeps: an occupied cell is only
// TINTED (the stack stays readable through them — never covered), the gap column stays open, the rows never move the real stack.
export const LOOKS = {
  glass: {
    /** o: { px, cells, H (canvas height px), now (ms), reduced } → [{ y, h, gap }] (one per visible row, top first) */
    incoming(ctx, bands, { px, cells, H, now, reduced }) {
      const geo = [];
      if (!bands || !bands.length) return geo;
      const ghost = sprite(px, 'incoming', 0);
      const halo = sprite(px, 'iglow', 0);
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
          const row = Math.max(0, Math.min(VISIBLE - 1, Math.floor((rTop + vBot) / 2)));
          for (let x = 0; x < W; x++) {
            if (x === b.gap) continue;
            if (cells[row * W + x]) {
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
      ctx.fillStyle = 'rgba(255,210,220,0.9)';
      ctx.fillRect(0, yTop - Math.max(1, px * 0.04), W * px, Math.max(2, px * 0.07));
      ctx.globalCompositeOperation = 'source-over';
      geo.sort((p, q) => p.y - q.y);
      return geo;
    },
  },
};

/**
 * The main board. view: { cell (css px) }. Draws the engine state + effects each frame.
 */
export function createBoardView(canvas) {
  let ctx = canvas.getContext('2d');
  let cell = 24, dpr = 1, px = 24;
  let gridLayer = null;
  let stack = null, stackCtx = null, stackSig = '';
  const fx = { flashes: [], sweeps: [], glitch: 0, lockFlash: [], shards: [] };
  let lastGhost = [];   // (PD-2) the ghost rows drawn last frame (device px, top first) — what a cancel shatters
  const SHARD_MS = 520;

  function size(cssCell, tierDpr) {
    dpr = Math.min(3, tierDpr || window.devicePixelRatio || 1);   // (PD-1: the full 3× — was capped at 2)
    cell = cssCell;
    px = Math.max(4, Math.round(cell * dpr));
    canvas.width = px * W;
    canvas.height = px * VISIBLE;
    canvas.style.width = `${cell * W}px`;
    canvas.style.height = `${cell * VISIBLE}px`;
    stack = document.createElement('canvas');
    stack.width = canvas.width; stack.height = canvas.height;
    stackCtx = stack.getContext('2d');
    stackSig = '';
    gridLayer = document.createElement('canvas');
    gridLayer.width = canvas.width;
    gridLayer.height = canvas.height;
    const g = gridLayer.getContext('2d');
    g.strokeStyle = 'rgba(200,220,255,0.055)';
    g.lineWidth = 1;
    for (let x = 1; x < W; x++) { g.beginPath(); g.moveTo(x * px + 0.5, 0); g.lineTo(x * px + 0.5, canvas.height); g.stroke(); }
    for (let y = 1; y < VISIBLE; y++) { g.beginPath(); g.moveTo(0, y * px + 0.5); g.lineTo(canvas.width, y * px + 0.5); g.stroke(); }
    // dots at the crossings: a calm, precise stage
    g.fillStyle = 'rgba(220,235,255,0.12)';
    for (let x = 1; x < W; x++) for (let y = 1; y < VISIBLE; y++) g.fillRect(x * px - 1, y * px - 1, 2, 2);
  }

  const sy = y => (VISIBLE - 1 - y) * px; // board row -> canvas y (top of the cell)

  function drawCell(x, y, t, alphaGrey, glow) {
    if (y >= VISIBLE || y < 0) return;
    if (glow) {
      const gs = sprite(px, 'glow', t);
      const o = (gs.width - px) / 2;
      ctx.globalAlpha = glow;
      ctx.drawImage(gs, x * px - o, sy(y) - o);
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(sprite(px, 'block', t), x * px, sy(y));
    if (alphaGrey > 0.02) {
      ctx.globalAlpha = alphaGrey;
      ctx.drawImage(sprite(px, 'grey', t), x * px, sy(y));
      ctx.globalAlpha = 1;
    }
  }

  return {
    size,
    get cell() { return cell; },
    get px() { return px; },
    /** screen position (css px, relative to the canvas) of a board cell's centre */
    cellCenter(x, y) { return [(x + 0.5) * cell, (VISIBLE - 1 - y + 0.5) * cell]; },
    flashRows(rows, strength, hue) { const now = performance.now(); for (const y of rows) fx.sweeps.push({ y, t0: now, strength, hue }); },
    lockFlash(cells) { fx.lockFlash.push({ cells, t0: performance.now() }); },
    glitch(ms = 160) { fx.glitch = performance.now() + ms; },
    /** (PD-2) a clear cancelled `n` incoming rows: the top n ghost rows SHATTER — their cells fly apart + fade (~0.5 s), on the board itself */
    shatterGhost(n) {
      const now = performance.now();
      const rows = lastGhost.slice(0, Math.max(0, n));
      for (const r of rows) {
        fx.flashes.push({ y: r.y, h: r.h, t0: now });
        for (let x = 0; x < W; x++) {
          if (x === r.gap) continue;
          const a = Math.random() * Math.PI * 2;
          fx.shards.push({ x: (x + 0.5) * px, y: r.y + r.h / 2, vx: (Math.random() - 0.5) * px * 9, vy: -(1.5 + Math.random() * 5) * px, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 9, s: 0.55 + Math.random() * 0.35, a, t0: now });
        }
      }
      if (fx.shards.length > 160) fx.shards.splice(0, fx.shards.length - 160);
      lastGhost = lastGhost.slice(rows.length);
      return rows.length;
    },
    draw(g, { danger = 0, glow = 0.32, showGhost = true, frozen = false, rush = false, incoming = null, look = 'glass', reduced = false } = {}) {
      const now = performance.now();
      let ghostGeo = [];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(gridLayer, 0, 0);
      const glitching = now < fx.glitch;
      const grey = Math.min(0.85, danger * 0.9) + (frozen ? 0.6 : 0);
      // the settled stack: a cached layer, redrawn only when a cell / the danger tint / the glow changes
      const cells = g.cells;
      const sig = `${String.fromCharCode(...cells.subarray(0, W * VISIBLE).map(c => c + 48))}|${grey.toFixed(2)}|${glow}`;
      if (sig !== stackSig) {
        stackSig = sig;
        const main = ctx;
        ctx = stackCtx; // drawCell draws into ctx
        ctx.clearRect(0, 0, stack.width, stack.height);
        if (glow > 0) {
          ctx.globalCompositeOperation = 'lighter';
          for (let y = 0; y < VISIBLE; y++) for (let x = 0; x < W; x++) {
            const t = cells[y * W + x];
            if (t && t !== 8) { const gs = sprite(px, 'glow', t); const o = (gs.width - px) / 2; ctx.globalAlpha = glow * (1 - grey * 0.7); ctx.drawImage(gs, x * px - o, sy(y) - o); }
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        for (let y = 0; y < VISIBLE; y++) for (let x = 0; x < W; x++) {
          const t = cells[y * W + x];
          if (t) drawCell(x, y, t, grey, 0);
        }
        ctx = main;
      }
      if (glitching) {
        // junk glitch: the stack's rows jump sideways for a moment
        const band = Math.max(1, Math.round(px * 2));
        for (let y0 = 0; y0 < canvas.height; y0 += band) {
          const shift = Math.random() < 0.3 ? Math.round((Math.random() - 0.5) * px * 0.5) : 0;
          ctx.drawImage(stack, 0, y0, stack.width, band, shift, y0, stack.width, band);
        }
      } else ctx.drawImage(stack, 0, 0);
      // (PD-2) THE RISING GHOST ROWS over the bottom rows — under the falling piece, never covering a block (the look's hook)
      if (incoming && incoming.length && !frozen) ghostGeo = (LOOKS[look] || LOOKS.glass).incoming(ctx, incoming, { px, cells, H: canvas.height, now, reduced });
      lastGhost = ghostGeo;
      // (PD-2) the cancelled rows: a white flash where they were + their shards flying apart (gravity, a spin, fading out)
      if (fx.flashes.length || fx.shards.length) {
        fx.flashes = fx.flashes.filter(f => now - f.t0 < 200);
        for (const f of fx.flashes) { ctx.fillStyle = `rgba(255,220,230,${0.5 * (1 - (now - f.t0) / 200)})`; ctx.fillRect(0, f.y, W * px, f.h); }
        fx.shards = fx.shards.filter(p => now - p.t0 < SHARD_MS);
        const gs = sprite(px, 'incoming', 0);
        for (const p of fx.shards) {
          const t = (now - p.t0) / 1000, k = (now - p.t0) / SHARD_MS;
          const sz = px * p.s * (1 - 0.5 * k);
          ctx.save();
          ctx.globalAlpha = (1 - k) * (1 - k);
          ctx.translate(p.x + p.vx * t, p.y + p.vy * t + 18 * px * t * t);
          ctx.rotate(p.r + p.vr * t);
          ctx.drawImage(gs, -sz / 2, -sz / 2, sz, sz);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
      // ghost + active piece
      if (g.cur && !frozen) {
        if (showGhost) {
          const gy = ghostY(g);
          if (gy != null && gy !== g.cur.y) {
            for (const [x, y] of cellsOf({ ...g.cur, y: gy })) if (y < VISIBLE) ctx.drawImage(sprite(px, 'ghost', g.cur.t), x * px, sy(y));
          }
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const [x, y] of cellsOf(g.cur)) if (y < VISIBLE) { const gs = sprite(px, 'glow', g.cur.t); const o = (gs.width - px) / 2; ctx.globalAlpha = 0.5; ctx.drawImage(gs, x * px - o, sy(y) - o); }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        for (const [x, y] of cellsOf(g.cur)) drawCell(x, y, g.cur.t, grey * 0.4, 0);
      }
      // lock flash: the cells that just set glow white for an instant
      fx.lockFlash = fx.lockFlash.filter(f => now - f.t0 < 140);
      for (const f of fx.lockFlash) {
        const a = 1 - (now - f.t0) / 140;
        ctx.fillStyle = `rgba(255,255,255,${0.42 * a})`;
        for (const [x, y] of f.cells) if (y < VISIBLE) ctx.fillRect(x * px, sy(y), px, px);
      }
      // clear sweeps: light runs across the cleared row (where it was) and fades
      fx.sweeps = fx.sweeps.filter(s => now - s.t0 < 520);
      for (const s of fx.sweeps) {
        const k = (now - s.t0) / 520;
        const yy = sy(Math.min(VISIBLE - 1, s.y));
        const head = k * canvas.width * 1.4 - canvas.width * 0.2;
        const gr = ctx.createLinearGradient(head - canvas.width * 0.7, 0, head + px * 0.4, 0);
        const hue = s.hue || 0;
        const fade = (1 - k) * (1 - k);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.45, `hsla(${(hue + 280) % 360},100%,65%,${0.22 * s.strength * fade})`);
        gr.addColorStop(0.8, `hsla(${hue},100%,72%,${0.45 * s.strength * fade})`);
        gr.addColorStop(0.97, `rgba(255,255,255,${0.95 * s.strength * fade})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gr;
        ctx.fillRect(0, yy + px * 0.08, canvas.width, px * 0.84);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (glitching) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,40,90,0.10)';
        const band = Math.random() * canvas.height;
        ctx.fillRect(0, band, canvas.width, px * 0.6);
        ctx.fillStyle = 'rgba(40,220,255,0.10)';
        ctx.fillRect(0, (band + canvas.height * 0.37) % canvas.height, canvas.width, px * 0.4);
        ctx.globalCompositeOperation = 'source-over';
      }
      void rush;
      // the ghost rows' places in CSS px of the canvas (the view's shatter + the tag)
      return { ghost: ghostGeo.map(r => ({ y: r.y / dpr, h: r.h / dpr, gap: r.gap })), ghostTop: ghostGeo.length ? ghostGeo[0].y / dpr : null };
    },
  };
}

/** A piece preview (hold / next) into a small canvas. */
export function drawPiece(canvas, t, { cell = 12, dim = false } = {}) {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const px = Math.round(cell * dpr);
  const wpx = px * 4, hpx = px * 2.4;
  if (canvas.width !== wpx || canvas.height !== Math.round(hpx)) {
    canvas.width = wpx; canvas.height = Math.round(hpx);
    canvas.style.width = `${cell * 4}px`; canvas.style.height = `${cell * 2.4}px`;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!t) return;
  const cs = SHAPES[t][0];
  const xs = cs.map(c => c[0]), ys = cs.map(c => c[1]);
  const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
  const ox = (canvas.width - w * px) / 2 - Math.min(...xs) * px;
  const oy = (canvas.height - h * px) / 2;
  ctx.globalAlpha = dim ? 0.35 : 1;
  for (const [x, y] of cs) {
    const yy = oy + (Math.max(...ys) - y) * px;
    ctx.drawImage(sprite(px, 'block', t), ox + x * px, yy);
  }
  ctx.globalAlpha = 1;
  void BOX;
}

/** Opponent mini-board from a published board string (+ optional active piece "t,r,x,y"). */
export function drawMini(canvas, str, piece, { cell = 4, ko = false } = {}) {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const px = Math.max(2, Math.round(cell * dpr));
  if (canvas.width !== px * W || canvas.height !== px * VISIBLE) {
    canvas.width = px * W; canvas.height = px * VISIBLE;
    canvas.style.width = `${cell * W}px`; canvas.style.height = `${cell * VISIBLE}px`;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const n = Math.min((str || '').length, W * VISIBLE);
  for (let i = 0; i < n; i++) {
    const t = str.charCodeAt(i) - 48;
    if (!t) continue;
    const x = i % W, y = (i / W) | 0;
    ctx.fillStyle = ko ? '#3a3f4c' : JEWEL[t] || JEWEL[8];
    ctx.fillRect(x * px, (VISIBLE - 1 - y) * px, px - (px > 3 ? 1 : 0), px - (px > 3 ? 1 : 0));
  }
  if (piece && !ko) {
    const [t, r, x0, y0] = String(piece).split(',').map(Number);
    if (SHAPES[t]) {
      ctx.fillStyle = JEWEL[t];
      for (const [x, y] of cellsOf({ t, r: r & 3, x: x0, y: y0 })) if (y < VISIBLE && y >= 0) ctx.fillRect(x * px, (VISIBLE - 1 - y) * px, px - (px > 3 ? 1 : 0), px - (px > 3 ? 1 : 0));
    }
  }
}
