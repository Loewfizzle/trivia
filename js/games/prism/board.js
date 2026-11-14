// PRISM DROP board rendering (Canvas 2D, crisp at the FULL device pixel ratio — 3× on an iPhone since PD-1; the quality tiers step it down).
// A frame is ~200 drawImage calls of PRE-DRAWN sprites: cheap on any phone.
// SKINS 1 — THE BOARD DRAWS THROUGH A SKIN (skins.js — docs/prism.md "THE SKINS"): the blocks, the landing ghost, the danger drain, the well's
// grid, the incoming rows, the moments on the board (a lock, a slam, a clear, a cancel) and a mini board's cells are the SKIN's hooks; nothing
// here names a skin. The view hands the match's skin to draw() / drawPiece() / drawMini() (`skin`); a caller that still names a LOOK
// ('crayon' | 'neon' — the share cards, the tickets: they stay crayon by day, neon by night) gets that look's own skin (skinById).
// (PD-3's neon tubes → neon-art.js · PD-4's crayon → crayon-art.js + crayonfx.js · the first glass blocks → glass-art.js — moved, not a pixel changed.)
import { W, VISIBLE, SHAPES, BOX, cellsOf, ghostY } from './engine.js';
import { skinById, SKINS } from './skins.js';
export { JEWEL, ghostBlocked } from './skin-kit.js';
export { dropSkins as clearSprites, skinCount as spriteCount } from './skins.js';

/** the skin a caller means: its `skin`, else its look's old name, else the glass (what an unnamed look always drew) */
const skinArg = o => (o && o.skin) || skinById((o && o.look) || 'glass');

/**
 * The main board. view: { cell (css px) }. Draws the engine state + effects each frame.
 */
export function createBoardView(canvas) {
  let ctx = canvas.getContext('2d');
  let cell = 24, dpr = 1, px = 24;
  let gridLayer = null, gridSig = '';
  let skin = SKINS.glass, env = null;   // (SKINS 1) the skin this frame draws in + what its sprites draw with (the night's world palette)
  /** the skin's sprite at the board's cell size (v = its variant) */
  const spr = (kind, t, v = 0) => skin.sprite(px, kind, t, v, env);
  const vOf = (x, y) => (x * 7 + y * 13) % skin.variants;
  // the skin's MOMENTS on this canvas (a lock, a slam, a clear, a cancel — the skin's fx(); null = it has none here: the night's are light)
  const fxs = new Map();   // skin id → its fx (made on first use)
  let bfx = null;
  const fxOf = k => { if (!fxs.has(k.id)) { const f = k.fx(); if (f && fxCap != null) f.setCap(fxCap); fxs.set(k.id, f || null); } return fxs.get(k.id); };
  let fxCap = null;
  /** the skin this board draws in (draw() sets it too): another skin's running moments stop at once */
  function setSkin(k, pal) {
    k = k || SKINS.glass;
    if (k !== skin) { if (bfx && bfx.busy) bfx.clear(); skin = k; bfx = fxOf(k); }
    env = k.env(pal);
  }
  let stack = null, stackCtx = null, stackSig = '';
  let held = null;      // (PD-5B) THE BURST BEFORE THE COLLAPSE: { cells (the stack before the clear), until (ms) } — drawn instead of the live stack
  const fx = { flashes: [], sweeps: [], glitch: 0, lockFlash: [], shards: [] };
  let lastGhost = [];   // (PD-2) the ghost rows drawn last frame (device px, top first) — what a cancel shatters
  const SHARD_MS = 520;

  function size(cssCell, tierDpr) {
    const d = Math.min(3, tierDpr || window.devicePixelRatio || 1);   // (PD-1: the full 3× — was capped at 2)
    // (PFIX-B — optional 17: the same size = keep the three canvases — a re-layout with nothing resized (a look switch) used to re-allocate the
    //  board + both offscreens, a 50 ms frame at 4× CPU on every switch; the stack + the grid redraw from their signatures)
    if (stack && d === dpr && cssCell === cell && canvas.width === Math.max(4, Math.round(cssCell * d)) * W) { stackSig = ''; gridSig = ''; return; }
    dpr = d;
    cell = cssCell;
    px = Math.max(4, Math.round(cell * dpr));
    canvas.width = px * W;
    canvas.height = px * VISIBLE;
    canvas.style.width = `${cell * W}px`;
    canvas.style.height = `${cell * VISIBLE}px`;
    if (stack) { stack.width = 0; stack.height = 0; }        // (PFIX-A: the old offscreens give their pixels back at once — not when a collection finds them)
    if (gridLayer) { gridLayer.width = 0; gridLayer.height = 0; }
    stack = document.createElement('canvas');
    stack.width = canvas.width; stack.height = canvas.height;
    stackCtx = stack.getContext('2d');
    stackSig = '';
    gridLayer = document.createElement('canvas');
    gridLayer.width = canvas.width;
    gridLayer.height = canvas.height;
    gridSig = '';
  }
  /** the well's grid — the skin's (a pencil grid · the world's well colour · …), redrawn only when the skin / its palette / the size changes */
  function paintGrid() {
    const sig = `${skin.id}|${env ? env.id : ''}|${px}`;
    if (sig === gridSig) return;
    gridSig = sig;
    const g = gridLayer.getContext('2d');
    g.clearRect(0, 0, gridLayer.width, gridLayer.height);
    skin.grid(g, { px, w: canvas.width, h: canvas.height, pal: env });
  }

  const sy = y => (VISIBLE - 1 - y) * px; // board row -> canvas y (top of the cell)

  function drawCell(x, y, t, alphaGrey, glow, v = vOf(x, y)) {
    if (y >= VISIBLE || y < 0) return;
    if (glow) {
      const gs = spr('glow', t);
      const o = (gs.width - px) / 2;
      ctx.globalAlpha = glow;
      ctx.drawImage(gs, x * px - o, sy(y) - o);
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(spr('block', t, v), x * px, sy(y));
    if (alphaGrey > 0.02) {
      ctx.globalAlpha = alphaGrey;
      ctx.drawImage(spr('grey', t), x * px, sy(y));
      ctx.globalAlpha = 1;
    }
  }

  return {
    size,
    /** PFIX-A (FABLE REVIEW finding 3): every canvas this board made gives its pixels back (the board's own + its two offscreens) */
    destroy() {
      if (stack) { stack.width = 0; stack.height = 0; } if (gridLayer) { gridLayer.width = 0; gridLayer.height = 0; }
      canvas.width = 0; canvas.height = 0;
      stack = stackCtx = gridLayer = null; held = null; lastGhost = [];
      for (const f of fxs.values()) if (f) f.clear();
      fxs.clear(); bfx = null;
      fx.flashes = []; fx.sweeps = []; fx.lockFlash = []; fx.shards = [];
    },
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
    setSkin,
    /** the skin's moments on the board: an engine event (hard · lock · clear) → its fx (the crayon's boing + scribble, a wash's drips, a peel…);
     *  o: { reduced }. A skin with no fx here (the night: its moments are light) takes nothing. → what the fx answers: null, or a clear's
     *  { hold (ms), gap } — the view holds the stack that long with the cleared rows EMPTY (a strip peeling off leaves a clean gap for a beat) */
    event(ev, o = {}) { return bfx ? bfx.event(ev, { px, reduced: !!o.reduced }) || null : null; },
    /** a clear cancelled `n` incoming rows: the skin's own cancel (the pencil rows crumble into eraser crumbs…) — or the shards (shatterGhost) */
    cancelGhost(n, o = {}) {
      if (!bfx || !bfx.erase) return this.shatterGhost(n);
      const rows = lastGhost.slice(0, Math.max(0, n));
      bfx.erase(rows, { px, reduced: !!o.reduced });
      lastGhost = lastGhost.slice(rows.length);
      return rows.length;
    },
    /** the moments' particle cap (the tier's sparks) */
    setFxCap(n) { fxCap = n; for (const f of fxs.values()) if (f) f.setCap(n); },
    get fxBusy() { return !!bfx && bfx.busy; },
    /** (PD-5B) hold the stack as it was before a clear for ms (the neon look's race + burst read on the cleared rows; the game never waits) */
    holdClear(cells, ms) { held = ms > 0 && cells ? { cells, until: performance.now() + ms } : null; },
    get holding() { return !!held && performance.now() < held.until; },
    /** (PFIX-B — optional 11) the stack changed under the hold: the live stack + the landing preview at once */
    endHold() { held = null; },
    draw(g, { danger = 0, glow = 0.32, showGhost = true, frozen = false, rush = false, incoming = null, skin: sk = null, look = 'glass', pal = null, reduced = false } = {}) {
      const now = performance.now();
      if (held && now >= held.until) held = null;
      let ghostGeo = [];
      setSkin(sk || skinById(look), pal);
      paintGrid();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(gridLayer, 0, 0);
      const cx = { px, sy, H: canvas.height };
      if (bfx) bfx.under(ctx, cx);   // (the skin's moments behind the stack — the crayon's star burst)
      const glitching = now < fx.glitch;
      const grey = Math.min(0.85, danger * 0.9) + (frozen ? 0.6 : 0);
      // the settled stack: a cached layer, redrawn only when a cell / the danger tint / the glow changes
      const cells = held ? held.cells : g.cells;   // (PD-5B: the held stack until the burst)
      const sig = `${String.fromCharCode(...cells.subarray(0, W * VISIBLE).map(c => c + 48))}|${grey.toFixed(2)}|${glow}|${skin.id}|${env ? env.id : ''}`;
      if (sig !== stackSig) {
        stackSig = sig;
        const main = ctx;
        ctx = stackCtx; // drawCell draws into ctx
        ctx.clearRect(0, 0, stack.width, stack.height);
        if (glow > 0) {
          ctx.globalCompositeOperation = 'lighter';
          for (let y = 0; y < VISIBLE; y++) for (let x = 0; x < W; x++) {
            const t = cells[y * W + x];
            if (t && t !== 8) { const gs = spr('glow', t); const o = (gs.width - px) / 2; ctx.globalAlpha = glow * (1 - grey * 0.7); ctx.drawImage(gs, x * px - o, sy(y) - o); }
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        for (let y = 0; y < VISIBLE; y++) for (let x = 0; x < W; x++) {
          const t = cells[y * W + x];
          if (t) drawCell(x, y, t, grey, 0);
        }
        if (skin.seams) skin.seams(ctx, { cells, px, sy, grey });   // (SKINS 2A: what a skin paints where the stack's blocks touch — in the cached layer, never per frame)
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
      if (bfx) bfx.clears(ctx, cx);   // (the skin's clear — the rows scribbled out / running / peeling — before the incoming rows, which stay on top)
      // (PD-2) THE RISING GHOST ROWS over the bottom rows — under the falling piece, never covering a block (the skin's hook)
      if (incoming && incoming.length && !frozen) ghostGeo = skin.incoming(ctx, incoming, { px, cells, H: canvas.height, now, reduced, pal: env });
      lastGhost = ghostGeo;
      // (PD-2) the cancelled rows: a white flash where they were + their shards flying apart (gravity, a spin, fading out)
      if (fx.flashes.length || fx.shards.length) {
        fx.flashes = fx.flashes.filter(f => now - f.t0 < 200);
        for (const f of fx.flashes) { ctx.fillStyle = `rgba(255,220,230,${0.5 * (1 - (now - f.t0) / 200)})`; ctx.fillRect(0, f.y, W * px, f.h); }
        fx.shards = fx.shards.filter(p => now - p.t0 < SHARD_MS);
        const gs = spr('incoming', 0);
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
      if (bfx) bfx.streaks(ctx, cx);   // (the skin's SLAM lines — behind the piece)
      // ghost + active piece
      if (g.cur && !frozen) {
        if (showGhost && !held) {   // (PD-5B: no landing preview while the picture is held — it would sit inside the held rows)
          const gy = ghostY(g);
          if (gy != null && gy !== g.cur.y) {
            for (const [x, y] of cellsOf({ ...g.cur, y: gy })) if (y < VISIBLE) ctx.drawImage(spr('ghost', g.cur.t), x * px, sy(y));
          }
        }
        if (skin.pieceGlow) {
          ctx.globalCompositeOperation = 'lighter';
          for (const [x, y] of cellsOf(g.cur)) if (y < VISIBLE) { const gs = spr('glow', g.cur.t); const o = (gs.width - px) / 2; ctx.globalAlpha = skin.pieceGlow; ctx.drawImage(gs, x * px - o, sy(y) - o); }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        // (the falling piece keeps its drawing while it falls: the skin's variant per cell of THIS piece — never by place)
        cellsOf(g.cur).forEach(([x, y], i) => drawCell(x, y, g.cur.t, grey * 0.4, 0, skin.fallV(g.n || 0, i)));
      }
      if (bfx) bfx.over(ctx, cx);   // (the skin's moments on top: the boing, the bounce / impact marks, the crumbs, the drips)
      // (the night's lock pulse, clear races + bursts are LIGHT — the light layer above the board (light.js); a day skin has its own fx; the glass keeps these)
      if (!skin.flash) { fx.lockFlash.length = 0; fx.sweeps.length = 0; }
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
      if (glitching && skin.bands) {   // (on paper the rows' jolt alone — no digital colour bands)
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
export function drawPiece(canvas, t, { cell = 12, dim = false, skin = null, look = 'glass', pal = null } = {}) {
  const K = skinArg({ skin, look }), env = K.env(pal);
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
    ctx.drawImage(K.sprite(px, 'block', t, K.pieceV(x, y, t), env), ox + x * px, yy);
  }
  ctx.globalAlpha = 1;
  void BOX;
}

/** Opponent mini-board from a published board string (+ optional active piece "t,r,x,y"). */
/** (SKINS 2A) a share card's JUNK cell, drawn SOLID: a dim filled grey with a slightly darker edge — never an outline square (the board reads
 *  packed; the day's holes are already filled — drop/share.js#solidJunk). The CALLER picks the pair (the card's look) → drawMini's `solid` */
export const SOLID_JUNK = Object.freeze({ night: Object.freeze({ fill: '#5b6174', edge: '#434859' }), day: Object.freeze({ fill: '#9a9da6', edge: '#7c808b' }) });
export function drawMini(canvas, str, piece, { cell = 4, ko = false, skin = null, look = 'glass', pal = null, solid = null } = {}) {
  const K = skinArg({ skin, look }), env = K.env(pal);
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const px = Math.max(2, Math.round(cell * dpr));
  if (canvas.width !== px * W || canvas.height !== px * VISIBLE) {
    canvas.width = px * W; canvas.height = px * VISIBLE;
    canvas.style.width = `${cell * W}px`; canvas.style.height = `${cell * VISIBLE}px`;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const n = Math.min((str || '').length, W * VISIBLE);
  // (the skin's own cell: a big mini — spectating, the podium — draws its real blocks; a small one its simple fill)
  const SJ = solid && solid.fill ? solid : null, se = Math.max(1, Math.round(px * 0.09));
  const cellAt = (x, y, t) => {
    if (SJ && t === 8) { const X = x * px, Y = (VISIBLE - 1 - y) * px; ctx.fillStyle = SJ.edge; ctx.fillRect(X, Y, px, px); ctx.fillStyle = SJ.fill; ctx.fillRect(X + se, Y + se, px - 2 * se, px - 2 * se); return; }
    K.mini(ctx, { X: x * px, Y: (VISIBLE - 1 - y) * px, s: px - (px > 3 ? 1 : 0), px, t, ko, x, y, env });
  };
  for (let i = 0; i < n; i++) {
    const t = str.charCodeAt(i) - 48;
    if (!t) continue;
    cellAt(i % W, (i / W) | 0, t);
  }
  if (piece && !ko) {
    const [t, r, x0, y0] = String(piece).split(',').map(Number);
    if (SHAPES[t]) for (const [x, y] of cellsOf({ t, r: r & 3, x: x0, y: y0 })) if (y < VISIBLE && y >= 0) cellAt(x, y, t);
  }
}
