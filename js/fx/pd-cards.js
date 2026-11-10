// PD-5B — PRISM DROP's THREE CARDS, DRAWN IN CODE (no art file) on the SHARED surface (js/fx/renderer.js — never a canvas per card) through THE
// GL PAINTER, in the night's NEON (PD-3: a solid dark core, a crisp hot tube in each piece's colour family, a white core line). The geometry is
// PURE in pd-specs.js (vault/hero.js + vault/layout.js read the hero boxes). THE BAR = OVERCLOCK's REDLINE / PHOTO FINISH + PENTHOUSE · THE
// DIAL: every static part baked ONCE per slot size at the phone's own ratio (one sprite — crisp at 3×), the moving parts baked sprites +
// stamps (transforms + alpha — no text in the GL frame: the KO lettering is baked).
//   FIRST KO (common — a 7.5-s loop, mostly at rest): ONE big neon block (the long piece's cyan) breathing over the dim grid; it trembles, CRACKS
//     from an impact point (white-hot fissures racing to its edges), BURSTS into shards (each its own baked piece of the block, flying + spinning
//     out, sparks) with a "KO" FLASH (a white bloom + a ring, the KO lettering popping in red neon), then the block re-forms. Reduced motion =
//     the cracked block with KO lit over it.
//   PERFECT CLEAR (rare — + its GLOWING EDGES): the EMPTY, spotless well (ice-white tube walls + floor, a clean glass grid); a beam of white
//     light into a glass PRISM over its mouth splits into the seven piece colours — a rainbow fan sweeping slowly across the well, landing on the
//     floor as a pool of colour, lighting each wall in the colour that reaches it; glints twinkle on the clean glass. Reduced motion = the fan
//     at its centre.
//   COMEBACK (epic — two effects together): a stack up AGAINST the red DANGER LINE at the top of the well (the line pulsing like an alarm); ONE
//     bright piece (the long piece, white-hot) drops into the last gap → light RACES along the four rows + they CLEAR in a burst of sparks → the
//     line cools + LIGHT RISES out of the well (a column + motes) → the rows come back. Reduced motion = the moment the rows light.
import { sprite, stamp, glow, sparkle, clamp01, smooth, lerp, fract, rng } from './kit.js';
import { rrect } from './renderer.js';
import { bakeDpr } from './sg-kit.js';
import { PD_SPECS, PD_W, PD_H, CELL, PD_COL, SPECTRUM, CB_ROWS, CB_CLEAR, CB_TOP, pdMap } from './pd-specs.js';

// ---- colour + path helpers (the bakes are real 2D canvases)
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbOf = h => hexRgb(h).join(',');
const rgba = (h, a) => `rgba(${rgbOf(h)},${a})`;
const mix = (a, b, k) => { const x = hexRgb(a), y = hexRgb(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`; };
const mixRgb = (a, b, k) => { const x = hexRgb(a), y = hexRgb(b); return x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(','); };
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const easeOut = u => 1 - Math.pow(1 - clamp01(u), 3);
const easeBack = u => { u = clamp01(u); const s = 1.9; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
const fontOk = () => (typeof document !== 'undefined' && document.fonts && document.fonts.check && document.fonts.check('900 20px Orbitron') ? 'o' : 'f');

/** ONE NEON CELL (the board's tube — PD-3's look): px = its side in device px; hot = a white-hot piece (COMEBACK's bright one) */
const cellSpr = (col, px, hot = 0) => sprite(`pd-cell:${col}:${Math.max(4, Math.round(px))}:${hot}`, Math.max(4, Math.round(px)), Math.max(4, Math.round(px)), (x, S) => {
  const p = Math.max(1, S * 0.05), b = S - 2 * p, r = S * 0.2, tw = Math.max(1.5, S * 0.115), ir = Math.max(1, r - tw * 0.5);
  const inner = () => rr(x, p + tw * 0.5, p + tw * 0.5, b - tw, b - tw, ir);
  rr(x, p, p, b, b, r);
  const cg = x.createLinearGradient(0, p, 0, p + b); cg.addColorStop(0, mix(col, '#000000', hot ? 0.45 : 0.8)); cg.addColorStop(1, mix(col, '#000000', hot ? 0.62 : 0.9));
  x.fillStyle = cg; x.fill();
  x.save(); rr(x, p, p, b, b, r); x.clip(); x.shadowColor = rgba(col, 0.95); x.shadowBlur = S * (hot ? 0.4 : 0.26); inner(); x.lineWidth = tw; x.strokeStyle = rgba(col, 0.9); x.stroke(); x.restore();
  inner(); x.lineWidth = tw; x.strokeStyle = mix(col, '#ffffff', hot ? 0.5 : 0.14); x.stroke();
  x.lineWidth = Math.max(1, S * (hot ? 0.06 : 0.036)); x.strokeStyle = mix(col, '#ffffff', hot ? 0.97 : 0.86); x.stroke();
  const g = x.createLinearGradient(p, p, p + b * 0.7, p + b * 0.7); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.lineWidth = Math.max(1, S * 0.05); x.strokeStyle = g; inner(); x.stroke();
});
/** a stretched soft band (bright down its middle column): light columns, the races along the rows */
const band = rgb => sprite(`pd-band:${rgb}`, 64, 64, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.5, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
});
/** a stretched soft band, bright along its middle ROW (a line's glow, a row lit along its length) */
const hband = rgb => sprite(`pd-hband:${rgb}`, 64, 64, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.5, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
});
/** a vertical fade (bright at the bottom → 0 at the top): the rising column */
const column = rgb => sprite(`pd-col:${rgb}`, 64, 128, (c, w, h) => {
  const gx = c.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, `rgba(${rgb},0)`); gx.addColorStop(0.5, `rgba(${rgb},1)`); gx.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = gx; c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = 'destination-in';
  const gy = c.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.55, 'rgba(0,0,0,0.55)'); gy.addColorStop(1, 'rgba(0,0,0,1)');
  c.fillStyle = gy; c.fillRect(0, 0, w, h);
});

/** THE SCENE BAKE — once per card × slot size × ratio: the lacquer + its pools, the clean grid, then the card's own static parts (paint, in
 *  scene units) + the grain */
function scene(id, w, h, full, dpr, o, paint) {
  return sprite(`pd-scene:${id}:${full ? 'F' : 'S'}:${Math.round(w)}x${Math.round(h)}@${dpr}`, w * dpr, h * dpr, c => {
    const M = pdMap(w, h, full, id);
    c.scale(dpr, dpr);
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, o.top); bg.addColorStop(1, o.bot); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.save(); c.translate(M.ox, M.oy); c.scale(M.k, M.k);
    for (const [x, y, r, col] of o.pools) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    // the clean grid (the board's own cells, faint, fading out from the hero)
    if (o.grid) {
      const [gx, gy, gr, ga] = o.grid;
      c.lineWidth = 1.4;
      for (let x = gx - Math.ceil(gr / CELL) * CELL; x <= gx + gr; x += CELL) for (let y = gy - Math.ceil(gr / CELL) * CELL; y <= gy + gr; y += CELL) {
        const d = Math.hypot(x - gx, y - gy) / gr; if (d >= 1) continue;
        c.strokeStyle = `rgba(150,190,255,${(ga * (1 - d) * (1 - d)).toFixed(3)})`;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + CELL, y); c.moveTo(x, y); c.lineTo(x, y + CELL); c.stroke();
      }
    }
    paint(c, M);
    c.restore();
    // the name's side kept dark (the plate + the full card's text sit there)
    const left = c.createLinearGradient(0, 0, w * (full ? 0.55 : 0.6), 0); left.addColorStop(0, 'rgba(2,2,5,0.72)'); left.addColorStop(0.7, 'rgba(2,2,5,0.25)'); left.addColorStop(1, 'rgba(2,2,5,0)');
    c.fillStyle = left; c.fillRect(0, 0, w, h);
    // THE GRAIN: a fine film over the lacquer
    let s = 4242; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < (w * h) / 40; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(220,235,255,0.03)' : 'rgba(0,0,0,0.07)'; c.fillRect(rnd() * w, rnd() * h, 0.7, 0.7); }
  });
}
/** a neon tube stroked along the current path (in a bake): the glow pass, the coloured tube, the white core */
function tube(c, col, wd, glowA = 0.85, coreA = 0.9) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.shadowColor = rgba(col, glowA); c.shadowBlur = wd * 3.2; c.strokeStyle = rgba(col, 0.75); c.lineWidth = wd; c.stroke();
  c.shadowBlur = 0; c.strokeStyle = mix(col, '#ffffff', 0.25); c.lineWidth = wd * 0.72; c.stroke();
  c.strokeStyle = `rgba(255,255,255,${coreA})`; c.lineWidth = Math.max(1, wd * 0.24); c.stroke();
  c.restore();
}
/** a well's U (the walls + the floor, rounded at its corners) as a path */
function wellPath(c, x0, x1, top, floor, r = 16) {
  c.beginPath(); c.moveTo(x0, top); c.lineTo(x0, floor - r); c.arcTo(x0, floor, x0 + r, floor, r); c.lineTo(x1 - r, floor); c.arcTo(x1, floor, x1, floor - r, r); c.lineTo(x1, top);
}
/** the slot's mapping helpers */
const mapper = (w, h, full, id) => { const M = pdMap(w, h, full, id); return { M, k: M.k, X: x => M.ox + x * M.k, Y: y => M.oy + y * M.k }; };

// =========================================================================================== FIRST KO
const KO = { LOOP: 7.5, CRACK: 3.7, BURST: 4.35, STILL: 4.35 };
// the fracture, in the block's own units (-0.5 … 0.5): the impact point + 8 rays to the edges, each kinked once (the ring of inner shards)
const IMP = [0.09, -0.07];
const RAYS = [-84, -31, 9, 52, 99, 141, 188, 236].map(d => d * Math.PI / 180);
function edgeOf(a) {   // the ray from IMP at angle a → the square's edge
  const dx = Math.cos(a), dy = Math.sin(a);
  const tx = dx > 0 ? (0.5 - IMP[0]) / dx : dx < 0 ? (-0.5 - IMP[0]) / dx : Infinity;
  const ty = dy > 0 ? (0.5 - IMP[1]) / dy : dy < 0 ? (-0.5 - IMP[1]) / dy : Infinity;
  const t = Math.min(tx, ty); return [IMP[0] + dx * t, IMP[1] + dy * t];
}
const angOf = p => Math.atan2(p[1] - IMP[1], p[0] - IMP[0]);
const CORNERS = [[0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]];
const FRACTURE = (() => {
  const R = rng(51), E = RAYS.map(edgeOf);
  const Mid = RAYS.map((a, i) => { const u = 0.42 + R() * 0.12, j = (R() - 0.5) * 0.08; return [lerp(IMP[0], E[i][0], u) - Math.sin(a) * j, lerp(IMP[1], E[i][1], u) + Math.cos(a) * j]; });
  const norm = a => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const shards = [];
  for (let i = 0; i < RAYS.length; i++) {
    const j = (i + 1) % RAYS.length, a0 = norm(RAYS[i]), span = norm(RAYS[j] - RAYS[i]);
    const between = CORNERS.filter(q => norm(angOf(q) - a0) < span).sort((p, q) => norm(angOf(p) - a0) - norm(angOf(q) - a0));
    shards.push([IMP, Mid[i], Mid[j]]);
    shards.push([Mid[i], E[i], ...between, E[j], Mid[j]]);
  }
  const cracks = RAYS.map((a, i) => [IMP, Mid[i], E[i]]);
  const ring = RAYS.map((a, i) => [Mid[i], Mid[(i + 1) % RAYS.length]]);
  return { shards: shards.map((P, n) => {
    const cx = P.reduce((s, q) => s + q[0], 0) / P.length, cy = P.reduce((s, q) => s + q[1], 0) / P.length;
    const xs = P.map(q => q[0]), ys = P.map(q => q[1]), pad = 0.025;
    const d = Math.hypot(cx - IMP[0], cy - IMP[1]) || 1;
    return { P, cx, cy, bx: Math.min(...xs) - pad, by: Math.min(...ys) - pad, bw: Math.max(...xs) - Math.min(...xs) + pad * 2, bh: Math.max(...ys) - Math.min(...ys) + pad * 2,
      dx: (cx - IMP[0]) / d, dy: (cy - IMP[1]) / d, v: 0.8 + R() * 0.9 + (n % 2) * 0.35, w: (R() - 0.5) * 7, n };
  }), cracks, ring };
})();
/** one shard of the block, baked (the block's own tube clipped to the piece + its broken edge lit) */
const shardSpr = (S, f, col) => sprite(`pd-shard:${col}:${Math.round(S)}:${f.n}`, f.bw * S, f.bh * S, x => {
  x.translate(-f.bx * S, -f.by * S);
  x.beginPath(); f.P.forEach(([px, py], i) => (i ? x.lineTo(px * S, py * S) : x.moveTo(px * S, py * S))); x.closePath();
  x.save(); x.clip(); x.drawImage(bigBlock(col, S), -S / 2, -S / 2, S, S); x.restore();
  x.lineWidth = Math.max(1, S * 0.012); x.strokeStyle = 'rgba(225,255,255,0.7)'; x.lineJoin = 'round'; x.stroke();
});
/** FIRST KO's BIG BLOCK: the neon cell made a jewel — a lit core (the light inside it), facets, an inner tube, a diagonal sheen, a glint (baked) */
const bigBlock = (col, px) => sprite(`pd-big:${col}:${Math.round(px)}`, Math.round(px), Math.round(px), (x, S) => {
  const p = S * 0.04, b = S - 2 * p, r = S * 0.17, tw = Math.max(2, S * 0.085), ir = Math.max(1, r - tw * 0.5);
  const inner = (q, rr0) => rr(x, p + q, p + q, b - 2 * q, b - 2 * q, Math.max(1, rr0));
  rr(x, p, p, b, b, r);
  const cg = x.createRadialGradient(S * 0.46, S * 0.42, S * 0.04, S / 2, S / 2, S * 0.62);
  cg.addColorStop(0, mix(col, '#ffffff', 0.25)); cg.addColorStop(0.28, mix(col, '#000000', 0.22)); cg.addColorStop(0.7, mix(col, '#000000', 0.68)); cg.addColorStop(1, mix(col, '#000000', 0.82));
  x.fillStyle = cg; x.fill();
  // the facets: four soft triangles (a cut block — lit from the top-left)
  const m = S / 2, q0 = p + tw, q1 = S - p - tw;
  [[[q0, q0], [q1, q0], 'rgba(255,255,255,0.12)'], [[q1, q0], [q1, q1], 'rgba(0,0,0,0.16)'], [[q1, q1], [q0, q1], 'rgba(0,0,0,0.26)'], [[q0, q1], [q0, q0], 'rgba(255,255,255,0.05)']].forEach(([a, c2, f]) => {
    x.save(); rr(x, p, p, b, b, r); x.clip(); x.beginPath(); x.moveTo(m, m); x.lineTo(...a); x.lineTo(...c2); x.closePath(); x.fillStyle = f; x.fill(); x.restore();
  });
  // the tube round the edge: its glow inside, the coloured tube, the white core
  x.save(); rr(x, p, p, b, b, r); x.clip(); x.shadowColor = rgba(col, 1); x.shadowBlur = S * 0.2; inner(tw * 0.5, ir); x.lineWidth = tw; x.strokeStyle = rgba(col, 0.95); x.stroke(); x.restore();
  inner(tw * 0.5, ir); x.lineWidth = tw; x.strokeStyle = mix(col, '#ffffff', 0.2); x.stroke();
  x.lineWidth = Math.max(1, S * 0.026); x.strokeStyle = mix(col, '#ffffff', 0.9); x.stroke();
  // the inner tube (thinner, dimmer) — the block's second ring
  inner(S * 0.2, r * 0.6); x.lineWidth = Math.max(1, S * 0.03); x.strokeStyle = rgba(col, 0.55); x.stroke();
  x.lineWidth = Math.max(1, S * 0.01); x.strokeStyle = 'rgba(235,255,255,0.6)'; x.stroke();
  // the sheen + the glint
  const g = x.createLinearGradient(p, p, p + b * 0.75, p + b * 0.75); g.addColorStop(0, 'rgba(255,255,255,0.65)'); g.addColorStop(0.4, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.lineWidth = Math.max(1, S * 0.04); x.strokeStyle = g; inner(tw * 0.5, ir); x.stroke();
  const gl = x.createRadialGradient(S * 0.24, S * 0.22, 0, S * 0.24, S * 0.22, S * 0.1); gl.addColorStop(0, 'rgba(255,255,255,0.9)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.fillRect(0, 0, S, S);
});
/** the KO lettering: red neon tube letters over a dark core (baked — no text in the GL frame) */
const koSpr = (hpx, dpr) => sprite(`pd-ko:${Math.round(hpx * dpr)}:${fontOk()}`, hpx * 1.9 * dpr, hpx * 1.25 * dpr, (c, W, H) => {
  const px = hpx * dpr * 0.92;
  c.font = `900 ${px}px Orbitron, "Chakra Petch", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.letterSpacing = `${px * 0.06}px`;
  const x = W / 2, y = H / 2 + px * 0.04;
  c.lineJoin = 'round';
  c.fillStyle = 'rgba(26,2,8,0.9)'; c.fillText('KO', x, y);
  c.shadowColor = 'rgba(255,60,96,1)'; c.shadowBlur = px * 0.22;
  c.lineWidth = px * 0.11; c.strokeStyle = '#ff4d6d'; c.strokeText('KO', x, y); c.strokeText('KO', x, y);
  c.shadowBlur = 0; c.lineWidth = px * 0.06; c.strokeStyle = '#ff9db0'; c.strokeText('KO', x, y);
  c.lineWidth = px * 0.022; c.strokeStyle = 'rgba(255,248,250,0.98)'; c.strokeText('KO', x, y);
});

function firstKo(c, s, t, Q) {
  const id = 'card-first-ko', S = PD_SPECS[id], { w, h } = s, full = !!s.opts.full, rad = s.opts.radius || 12, dpr = bakeDpr(Q), still = !!Q.still;
  const { k, X, Y } = mapper(w, h, full, id), B = S.block, col = B.col, calm = full ? 1 : 0.9;
  const p = still ? KO.STILL : fract(t / KO.LOOP) * KO.LOOP;
  c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.drawImage(scene(id, w, h, full, dpr, {
    top: '#060812', bot: '#020306', grid: [B.x, B.y, 420, 0.22],
    pools: [[B.x, B.y, 400, 'rgba(43,228,240,0.17)'], [B.x + 40, B.y - 30, 230, 'rgba(255,77,109,0.07)']],
  }, (x) => {
    // the dim stack below (the opponent's — full card only: on the strip it would sit under the gem)
    if (!full) return;
    const W = S.well, R = rng(7);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) {
      if (R() < (r === 1 ? 0.4 : 0.1)) continue;
      x.globalAlpha = 0.36 - r * 0.1; x.drawImage(cellSpr(PD_COL[1 + Math.floor(R() * 7)], CELL * k * dpr), W.x0 + i * CELL, W.floor - (r + 1) * CELL, CELL, CELL);
    }
    x.globalAlpha = 1;
  }), 0, 0, w, h);
  const sz = (full ? B.sFull : B.s) * k, bx = X(B.x), by = Y(B.y);
  const tau = p - KO.BURST, burst = !still && tau >= 0;
  const breath = still ? 0.6 : 0.5 + 0.5 * Math.sin(t * 1.4);
  // the block's halo (breathing; it flares at the burst)
  c.globalCompositeOperation = 'lighter';
  const halo = burst ? Math.max(0, 1 - tau / 0.6) : 1;
  stamp(c, glow('43,228,240', 0.16), bx, by, sz * 2.6, (0.28 + 0.12 * breath) * halo * calm);
  if (full) {   // (its light on the stack below: a cyan pool on the blocks' tops, breathing with it)
    const re = burst ? Math.max(0, 1 - tau / 0.5) + smooth(2.25, 2.95, tau) : 1;
    stamp(c, glow('43,228,240', 0.12), bx, Y(S.well.floor - CELL * 2), sz * 3.4, (0.2 + 0.08 * breath) * Math.min(1, re), sz * 0.9);
  }
  // THE BLOCK: intact (trembling before it goes) · gone at the burst · re-forming at the loop's end
  c.globalCompositeOperation = 'source-over';
  const reform = burst ? smooth(2.25, 2.95, tau) : 1;
  if (!burst || reform > 0.01) {
    const shake = !still && p > KO.CRACK + 0.25 && !burst ? (Math.sin(t * 91) * 0.6 + Math.sin(t * 57) * 0.4) * sz * 0.012 : 0;
    const sc = burst ? 0.86 + 0.14 * easeOut(reform) : 1, d = sz * sc;
    c.globalAlpha = burst ? reform : 1;
    c.drawImage(bigBlock(col, sz * dpr), bx - d / 2 + shake, by - d / 2, d, d);
    c.globalAlpha = 1;
    // THE CRACKS: racing from the impact to the edges (white-hot cores over a cyan glow) — the still frame keeps them
    const u = still ? 1 : burst ? 0 : smooth(KO.CRACK, KO.CRACK + 0.5, p);
    const rest = still || burst ? 0 : 1 - u;   // (at rest: two hairline cracks from the impact, faint — the block about to go)
    if (rest > 0.01) {
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.32 * rest * reform * calm; c.lineWidth = Math.max(0.7, sz * 0.012); c.strokeStyle = 'rgb(220,255,255)';
      for (const i of [1, 4]) { const cr = FRACTURE.cracks[i]; c.beginPath(); c.moveTo(bx + cr[0][0] * sz + shake, by + cr[0][1] * sz); c.lineTo(bx + cr[1][0] * sz + shake, by + cr[1][1] * sz); c.stroke(); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    if (u > 0.01) {
      c.globalCompositeOperation = 'lighter';
      const P = (q) => [bx + q[0] * sz + shake, by + q[1] * sz];
      const seg = (pts, f) => {   // a polyline drawn to fraction f of its length
        const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
        let left = tot * f; c.beginPath(); c.moveTo(...pts[0]);
        for (let i = 1; i < pts.length && left > 0; i++) { const g = Math.min(1, left / L[i - 1]); c.lineTo(lerp(pts[i - 1][0], pts[i][0], g), lerp(pts[i - 1][1], pts[i][1], g)); left -= L[i - 1]; }
      };
      for (const [lw, st, a] of [[Math.max(1.6, sz * 0.05), 'rgb(43,228,240)', 0.5], [Math.max(0.8, sz * 0.016), 'rgb(240,255,255)', 1]]) {
        c.lineWidth = lw; c.strokeStyle = st; c.globalAlpha = a * calm;
        FRACTURE.cracks.forEach((cr, i) => { seg(cr.map(P), clamp01(u * 1.25 - i * 0.03)); c.stroke(); });
        if (u > 0.6) FRACTURE.ring.forEach(rg => { seg(rg.map(P), clamp01((u - 0.6) / 0.4)); c.stroke(); });
      }
      stamp(c, sparkle('235,255,255'), bx + IMP[0] * sz, by + IMP[1] * sz, sz * 0.5 * (still ? 0.8 : 0.6 + 0.4 * u), 0.9 * calm);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
  }
  // THE BURST: the shards fly + spin out (gravity pulls them a little), sparks, the flash + its ring
  if (burst && tau < 1.9) {
    const cS = sz * dpr;
    for (const f of FRACTURE.shards) {
      const dist = f.v * 0.62 * (1 - Math.exp(-3.1 * tau)), fall = 0.22 * tau * tau;
      const a = 1 - smooth(0.35, 1.5, tau);
      if (a <= 0.01) continue;
      const sc = 1 - 0.3 * smooth(0, 1.5, tau);
      c.save(); c.translate(bx + (f.cx + f.dx * dist) * sz, by + (f.cy + f.dy * dist + fall) * sz); c.rotate(f.w * tau * 0.6); c.scale(sc, sc);
      c.globalAlpha = a; c.drawImage(shardSpr(cS, f, col), (f.bx - f.cx) * sz, (f.by - f.cy) * sz, f.bw * sz, f.bh * sz); c.restore();
    }
    c.globalCompositeOperation = 'lighter';
    const ix = bx + IMP[0] * sz, iy = by + IMP[1] * sz;
    // the sparks (riding out ahead of the fastest shards)
    for (const f of FRACTURE.shards) {
      if (f.n % 2 === 0) continue;
      const d = f.v * 1.05 * (1 - Math.exp(-3.6 * tau)), a = 1 - smooth(0.12, 0.75, tau);
      stamp(c, sparkle('200,255,255'), ix + f.dx * d * sz, iy + f.dy * d * sz + 0.15 * tau * tau * sz, sz * 0.32 * (1 - tau), a * calm);
    }
    // the flash: a white bloom at the impact + a ring racing out
    if (tau < 0.45) { const a = Math.pow(1 - tau / 0.45, 1.5); stamp(c, glow('255,255,255', 0.3), ix, iy, sz * (1.3 + 2.2 * tau), a * calm); stamp(c, glow('255,90,120', 0.15), ix, iy, sz * (2.4 + 3 * tau), a * 0.55 * calm); }
    if (tau < 0.7) {
      const u = tau / 0.7;
      c.globalAlpha = 0.85 * (1 - u) * calm; c.strokeStyle = 'rgb(210,255,255)'; c.lineWidth = Math.max(0.8, sz * 0.03 * (1 - u));
      c.beginPath(); c.arc(ix, iy, sz * (0.35 + 1.3 * easeOut(u)), 0, Math.PI * 2); c.stroke();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  // THE KO: popped in at the burst, held, faded before the block is back (the still frame: lit over the cracked block)
  const koA = still ? 0.96 : burst ? smooth(0.04, 0.1, tau) * (1 - smooth(1.7, 2.25, tau)) : 0;
  if (koA > 0.01) {
    const kh0 = (full ? S.ko.hFull : S.ko.h) * k, pop = still ? 1 : easeBack((tau - 0.04) / 0.26), kh = kh0 * pop, kx = X(S.ko.x), ky = Y(S.ko.y);
    c.globalCompositeOperation = 'lighter'; stamp(c, glow('255,60,96', 0.2), kx, ky, kh * 2.6, koA * 0.42 * calm, kh * 1.6);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = koA;
    c.drawImage(koSpr(kh0, dpr), kx - kh * 0.95, ky - kh * 0.625, kh * 1.9, kh * 1.25);
    c.globalAlpha = 1;
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

// =========================================================================================== PERFECT CLEAR
const PC = { LOOP: 9, AMP: 8.5 * Math.PI / 180 };
/** the rainbow fan: a triangle from its apex (top centre) to its foot, the seven colours side by side, brightest out of the prism */
const FAN_W = 236, FAN_L = 300;
const fanSpr = () => sprite('pd-fan2', 192, 384, (c, W, H) => {
  const n = SPECTRUM.length, ax = W / 2, half = W / 2;
  SPECTRUM.forEach((col, i) => {
    const x0 = ax - half + (i / n) * W, x1 = ax - half + ((i + 1) / n) * W;
    c.beginPath(); c.moveTo(ax + (i - n / 2) * 0.9, 0); c.lineTo(ax + (i + 1 - n / 2) * 0.9, 0); c.lineTo(x1, H); c.lineTo(x0, H); c.closePath();
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.3, rgba(col, 0.7)); g.addColorStop(1, rgba(col, 0.38)); c.fillStyle = g; c.fill();
  });
  // soft sides (the fan's edges fade into the dark)
  c.globalCompositeOperation = 'destination-in';
  const gx = c.createLinearGradient(0, 0, W, 0); gx.addColorStop(0, 'rgba(0,0,0,0.25)'); gx.addColorStop(0.16, 'rgba(0,0,0,1)'); gx.addColorStop(0.84, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0.25)');
  c.fillStyle = gx; c.fillRect(0, 0, W, H);
});
/** the floor's rainbow pool: the seven colours spread side by side, soft (stretched along the floor) */
const poolSpr = () => sprite('pd-pool', 224, 48, (c, W, H) => {
  SPECTRUM.forEach((col, i) => { const x = (i + 0.5) / SPECTRUM.length * W, g = c.createRadialGradient(x, H / 2, 0, x, H / 2, W / 6); g.addColorStop(0, rgba(col, 0.9)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); });
});
const GLINTS = (() => { const R = rng(23); return Array.from({ length: 9 }, (_, i) => ({ u: R(), wall: i % 3, ph: R() * 3.1, per: 2.4 + R() * 1.8 })); })();

function perfectClear(c, s, t, Q) {
  const id = 'card-perfect-clear', S = PD_SPECS[id], { w, h } = s, full = !!s.opts.full, rad = s.opts.radius || 12, dpr = bakeDpr(Q), still = !!Q.still;
  const { k, X, Y } = mapper(w, h, full, id), W = S.well, Pr = S.prism, calm = full ? 1 : 0.9;
  const pr = { ax: Pr.x, ay: Pr.y - Pr.s * 0.577, bl: [Pr.x - Pr.s / 2, Pr.y + Pr.s * 0.289], br: [Pr.x + Pr.s / 2, Pr.y + Pr.s * 0.289] };
  const exit = [Pr.x + Pr.s * 0.06, Pr.y + Pr.s * 0.27];   // (where the light leaves the prism's base)
  c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.drawImage(scene(id, w, h, full, dpr, {
    top: '#07061a', bot: '#020208', grid: null,
    pools: [[760, 380, 330, 'rgba(170,160,255,0.14)'], [760, W.floor, 220, 'rgba(220,235,255,0.07)'], [Pr.x, Pr.y, 160, 'rgba(255,255,255,0.08)']],
  }, (x) => {
    // the well's clean glass: a soft back + its grid, faint (spotless — nothing in it)
    const g = x.createLinearGradient(0, W.top, 0, W.floor); g.addColorStop(0, 'rgba(150,170,255,0.03)'); g.addColorStop(1, 'rgba(180,200,255,0.07)');
    x.fillStyle = g; x.fillRect(W.x0, W.top, W.x1 - W.x0, W.floor - W.top);
    x.lineWidth = 1.2;
    for (let gx = W.x0 + 22; gx < W.x1 - 1; gx += 22) { x.strokeStyle = 'rgba(190,210,255,0.05)'; x.beginPath(); x.moveTo(gx, W.top + 10); x.lineTo(gx, W.floor - 4); x.stroke(); }
    for (let gy = W.floor - 22; gy > W.top + 8; gy -= 22) { x.strokeStyle = `rgba(190,210,255,${(0.025 + 0.04 * (gy - W.top) / (W.floor - W.top)).toFixed(3)})`; x.beginPath(); x.moveTo(W.x0 + 4, gy); x.lineTo(W.x1 - 4, gy); x.stroke(); }
    // the floor's shine (the clean glass catches the light)
    const sh = x.createLinearGradient(0, W.floor - 40, 0, W.floor); sh.addColorStop(0, 'rgba(220,235,255,0)'); sh.addColorStop(1, 'rgba(220,235,255,0.08)');
    x.fillStyle = sh; x.fillRect(W.x0, W.floor - 40, W.x1 - W.x0, 40);
    // THE WALLS + THE FLOOR: ice-white tubes, the mouth's lips flared out
    const tw = full ? 6.5 : 10;   // (bolder on the strip — it reads at 64 pt)
    wellPath(x, W.x0, W.x1, W.top, W.floor, 18); tube(x, '#cfe6ff', tw, 0.8, 0.95);
    x.beginPath(); x.moveTo(W.x0 - 18, W.top); x.lineTo(W.x0, W.top); x.moveTo(W.x1, W.top); x.lineTo(W.x1 + 18, W.top); tube(x, '#cfe6ff', tw, 0.8, 0.95);
    // THE BEAM coming in from above + THE PRISM (glass: a soft fill, a lit left face, crisp white edges)
    const bx0 = Pr.x - 96, by0 = -40, hit = [lerp(pr.ax, pr.bl[0], 0.45), lerp(pr.ay, pr.bl[1], 0.45)];
    x.save(); x.lineCap = 'round'; x.shadowColor = 'rgba(255,255,255,0.8)'; x.shadowBlur = 14; x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(bx0, by0); x.lineTo(...hit); x.stroke(); x.shadowBlur = 0; x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 1.6; x.stroke(); x.restore();
    x.beginPath(); x.moveTo(pr.ax, pr.ay); x.lineTo(...pr.br); x.lineTo(...pr.bl); x.closePath();
    const gl = x.createLinearGradient(pr.bl[0], pr.ay, pr.br[0], pr.bl[1]); gl.addColorStop(0, 'rgba(220,240,255,0.32)'); gl.addColorStop(0.5, 'rgba(160,190,255,0.1)'); gl.addColorStop(1, 'rgba(200,170,255,0.22)');
    x.fillStyle = gl; x.fill();
    x.save(); x.shadowColor = 'rgba(220,235,255,0.9)'; x.shadowBlur = 10; x.strokeStyle = 'rgba(240,248,255,0.95)'; x.lineWidth = 2.6; x.lineJoin = 'round'; x.stroke(); x.restore();
    x.beginPath(); x.moveTo(pr.ax, pr.ay + 8); x.lineTo(lerp(pr.ax, pr.bl[0], 0.78), lerp(pr.ay, pr.bl[1], 0.78)); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 1.4; x.stroke();
  }), 0, 0, w, h);
  // THE SWEEP: the fan rotates slowly about the prism's exit (a sine — never still for long), its foot swept across the well
  const th = still ? 0 : PC.AMP * Math.sin((t / PC.LOOP) * Math.PI * 2);
  const flare = still ? 0.7 : 0.62 + 0.18 * Math.sin(t * 0.9) + 0.12 * Math.sin(t * 2.3);
  const foot = exit[0] + Math.tan(th) * (W.floor - exit[1]);           // (where the fan's centre lands on the floor)
  c.globalCompositeOperation = 'lighter';
  // the light into the prism (breathing) + the prism's hot exit point
  stamp(c, glow('255,255,255', 0.25), X(exit[0]), Y(exit[1]), 70 * k, 0.55 * flare * calm);
  stamp(c, sparkle('255,255,255'), X(exit[0]), Y(exit[1]), 46 * k, (0.55 + 0.35 * flare) * calm);
  // THE FAN (clipped to the well's mouth → floor, inside the card)
  const cx0 = Math.max(0, X(W.x0 + 4)), cx1 = Math.min(w, X(W.x1 - 4)), cy0 = Math.max(0, Y(exit[1])), cy1 = Math.min(h, Y(W.floor - 3));
  if (cx1 > cx0 && cy1 > cy0) {
    c.save(); c.beginPath(); c.rect(cx0, cy0, cx1 - cx0, cy1 - cy0); c.clip();
    c.translate(X(exit[0]), Y(exit[1])); c.rotate(-th); c.globalAlpha = Math.min(1, 0.95 * flare) * calm;
    c.drawImage(fanSpr(), -FAN_W * k / 2, 0, FAN_W * k, FAN_L * k);
    c.globalAlpha = 0.35 * flare * calm; c.drawImage(fanSpr(), -FAN_W * k * 0.4, 0, FAN_W * k * 0.8, FAN_L * k);   // (the core of the fan, hotter)
    c.restore();
  }
  // the pool of colour where it lands + the walls lit in the colour that reaches each one
  stamp(c, poolSpr(), X(foot), Y(W.floor - 2), FAN_W * 1.05 * k, 0.8 * flare * calm, 40 * k);
  const reach = FAN_W * 0.52;
  for (const [wx, side] of [[W.x0, -1], [W.x1, 1]]) {
    const gap = side < 0 ? foot - reach - wx : wx - (foot + reach);
    const a = clamp01(1 - gap / 70);
    if (a <= 0.02) continue;
    const colr = side < 0 ? SPECTRUM[0] : SPECTRUM[SPECTRUM.length - 1];
    stamp(c, band(rgbOf(colr)), X(wx), Y((W.floor + W.top) / 2 + 20), 34 * k, a * 0.6 * flare * calm, (W.floor - W.top) * 0.95 * k);
    stamp(c, glow(rgbOf(colr), 0.2), X(wx), Y(W.floor - 20), 90 * k, a * 0.5 * flare * calm);
  }
  // THE GLINTS: the clean glass twinkles (on the floor + the walls)
  for (const g of GLINTS) {
    const ph = still ? 0.5 : fract(t / g.per + g.ph), a = ph < 0.22 ? Math.sin(ph / 0.22 * Math.PI) : 0;
    if (a <= 0.02) continue;
    const [gx, gy] = g.wall === 0 ? [lerp(W.x0 + 20, W.x1 - 20, g.u), W.floor] : [g.wall === 1 ? W.x0 : W.x1, lerp(W.top + 40, W.floor - 24, g.u)];
    stamp(c, sparkle('255,255,255'), X(gx), Y(gy), 40 * k, a * 0.85 * calm);
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

// =========================================================================================== COMEBACK
const CB = { LOOP: 6.8, DROP: 1.3, LAND: 1.72, RACE: 0.3, GONE: 2.3, FALL: 0.3, RESET: 5.4, BACK: 6.3, STILL: 2.0 };
const MOTES = (() => { const R = rng(77); return Array.from({ length: 16 }, () => ({ u: R(), v: 70 + R() * 90, ph: R(), sz: 0.6 + R() * 0.8, c: R() < 0.5 ? '200,250,255' : R() < 0.5 ? '255,236,200' : '255,255,255' })); })();

function comeback(c, s, t, Q) {
  const id = 'card-comeback', S = PD_SPECS[id], { w, h } = s, full = !!s.opts.full, rad = s.opts.radius || 12, dpr = bakeDpr(Q), still = !!Q.still;
  const { k, X, Y } = mapper(w, h, full, id), W = S.well, calm = full ? 1 : 0.92;
  const p = still ? CB.STILL : fract(t / CB.LOOP) * CB.LOOP;
  c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.drawImage(scene(id, w, h, full, dpr, {
    top: '#0b0409', bot: '#020103', grid: null,
    pools: [[S.focus, S.line, 320, 'rgba(255,40,70,0.16)'], [S.focus, 420, 300, 'rgba(110,120,255,0.07)']],
  }, (x) => {
    // the well's glass + its grid
    x.fillStyle = 'rgba(160,150,255,0.035)'; x.fillRect(W.x0, W.top, W.x1 - W.x0, W.floor - W.top);
    x.lineWidth = 1.2; x.strokeStyle = 'rgba(190,190,255,0.05)';
    for (let gx = W.x0 + CELL; gx < W.x1 - 1; gx += CELL) { x.beginPath(); x.moveTo(gx, W.top); x.lineTo(gx, W.floor); x.stroke(); }
    // the walls: a calm lavender tube (the red line + the stack own the colour)
    wellPath(x, W.x0 - 4, W.x1 + 4, W.top, W.floor + 4, 14); tube(x, '#a99cff', 5, 0.55, 0.6);
    // THE DANGER LINE (dim — lit live): a red tube across the mouth, its ends past the walls
    x.beginPath(); x.moveTo(W.x0 - 16, S.line); x.lineTo(W.x1 + 16, S.line); tube(x, '#ff3b5c', 5.5, 0.6, 0.35);
  }), 0, 0, w, h);
  const cs = CELL * k, cd = cs * dpr;
  const rowY = r => W.floor - (r + 1) * CELL;
  const landed = still || p >= CB.LAND, gone = !still && p >= CB.GONE && p < CB.RESET;
  const back = smooth(CB.RESET, CB.BACK, p);                                     // (the cleared rows coming back)
  const race = r => (still ? 0.62 : clamp01((p - CB.LAND - 0.04 - (CB_CLEAR[CB_CLEAR.length - 1] - r) * 0.035) / CB.RACE));
  const vanish = still ? 0 : smooth(CB.GONE - 0.16, CB.GONE, p);
  const danger = still ? 1 : 1 - smooth(CB.LAND + 0.3, CB.GONE + 0.5, p) + back;   // (the line hot while the stack touches it)
  const alarm = 0.65 + 0.35 * Math.sin(t * Math.PI * 2 * 1.6);
  // THE DANGER LINE lit (pulsing like an alarm while the stack touches it; cool after the clear)
  c.globalCompositeOperation = 'lighter';
  const ly = Y(S.line);
  stamp(c, hband('255,40,70'), X(S.focus), ly, (W.x1 - W.x0 + 90) * k, Math.min(1, danger) * (still ? 0.8 : alarm) * 0.55 * calm, 34 * k);
  c.globalAlpha = Math.min(1, danger) * (still ? 0.9 : 0.55 + 0.4 * alarm) * calm; c.fillStyle = 'rgb(255,120,140)'; c.fillRect(X(W.x0 - 16), ly - Math.max(0.6, 1.4 * k), (W.x1 - W.x0 + 32) * k, Math.max(1.2, 2.8 * k));
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  // THE STACK (the cleared rows: lit by the race, then gone, then back)
  CB_ROWS.forEach((row, r) => {
    const clr = CB_CLEAR.includes(r);
    const a = !clr || still || p < CB.LAND || p >= CB.BACK ? 1 : p < CB.GONE ? 1 - vanish : p < CB.RESET ? 0 : back;
    if (a <= 0.01) return;
    const sc = clr && !still && p >= CB.LAND && p < CB.GONE ? 1 - 0.35 * vanish : 1;
    // (THE TOP ROW falls the four cleared rows after the clear — away from the line — + climbs back at the reset)
    let ry = rowY(r);
    if (r === CB_TOP && !still) {
      const low = rowY(CB_CLEAR[0]);
      if (p >= CB.GONE && p < CB.RESET) { const u = clamp01((p - CB.GONE) / CB.FALL); ry = lerp(ry, low, u * u); }
      else if (p >= CB.RESET && p < CB.BACK) ry = lerp(low, ry, back * back * (3 - 2 * back));
    }
    row.forEach((t0, i) => {
      if (!t0) return;
      const d = cs * sc, x0 = X(W.x0 + i * CELL) + (cs - d) / 2, y0 = Y(ry) + (cs - d) / 2;
      c.globalAlpha = a; c.drawImage(cellSpr(PD_COL[t0], cd), x0, y0, d, d);
    });
  });
  c.globalAlpha = 1;
  // the red cast on the top rows while in danger
  if (danger > 0.02) { c.globalCompositeOperation = 'lighter'; stamp(c, glow('255,40,70', 0.2), X(S.focus), Y(S.line + 40), 300 * k, Math.min(1, danger) * 0.22 * (still ? 1 : alarm) * calm, 130 * k); c.globalCompositeOperation = 'source-over'; }
  // THE BRIGHT PIECE: waiting above the well → dropped into the gap → part of the clear
  const gx = X(W.x0 + S.gap * CELL), ptop = rowY(CB_CLEAR[CB_CLEAR.length - 1]);
  let py = ptop, pa = 1;
  if (!landed) {
    if (p < CB.DROP) { py = lerp(-165, -125, p / CB.DROP); pa = smooth(0.1, 0.8, p); } else { const u = (p - CB.DROP) / (CB.LAND - CB.DROP); py = lerp(-125, ptop, u * u); }
  } else { pa = gone ? 0 : p >= CB.RESET ? 0 : 1 - vanish; }
  if (!still && p >= CB.BACK) pa = 0;
  if (pa > 0.01) {
    c.globalCompositeOperation = 'lighter'; stamp(c, glow('120,250,255', 0.2), gx + cs / 2, Y(py + CELL * 2), cs * 3.2, pa * 0.55 * calm, cs * 6.2);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = pa;
    for (let i = 0; i < 4; i++) c.drawImage(cellSpr('#5ff2ff', cd, 1), gx, Y(py + i * CELL), cs, cs);
    c.globalAlpha = 1;
  }
  c.globalCompositeOperation = 'lighter';
  // the landing flash along the piece
  if (!still && p >= CB.LAND && p < CB.LAND + 0.3) { const a = 1 - (p - CB.LAND) / 0.3; stamp(c, band('255,255,255'), gx + cs / 2, Y(ptop + CELL * 2), cs * 2.2, a * 0.8 * calm, cs * 4.6); }
  // THE RACE: a white-hot band sweeping along each cleared row (left → right), the row lit white behind it
  if (still || (p >= CB.LAND && p < CB.GONE)) {
    for (const r of CB_CLEAR) {
      const u = race(r); if (u <= 0) continue;
      const yy = Y(rowY(r) + CELL / 2), xs = X(W.x0), xe = X(W.x1), hx = lerp(xs - 20 * k, xe + 20 * k, easeOut(u));
      const lit = (1 - vanish) * calm;
      stamp(c, hband('255,255,255'), (xs + hx) / 2, yy, Math.max(2, hx - xs) * 1.05, 0.38 * lit, cs * 1.05);
      stamp(c, glow('255,255,255', 0.4), hx, yy, cs * 1.8, (still ? 0.7 : Math.sin(u * Math.PI)) * 0.9 * lit, cs * 1.3);
    }
  }
  // THE BURST as they go: sparks thrown out of both ends of every cleared row
  if (!still && p >= CB.GONE - 0.16 && p < CB.GONE + 0.7) {
    const u = (p - (CB.GONE - 0.16)) / 0.86;
    for (const r of CB_CLEAR) for (const side of [-1, 1]) {
      const j = (r + (side > 0 ? 1 : 0)) % 2, yy = rowY(r) + CELL / 2, d = (30 + 120 * easeOut(u) * (1 + j * 0.35)), x0 = side < 0 ? W.x0 : W.x1;
      stamp(c, sparkle(j ? '255,255,255' : '160,250,255'), X(x0 + side * d), Y(yy - 30 * u * u), cs * 0.7 * (1 - u * 0.6), (1 - u) * 0.9 * calm);
    }
    stamp(c, glow('255,255,255', 0.3), X(S.focus), Y(rowY(CB_CLEAR[2])), 320 * k, (1 - u) * 0.45 * calm, 220 * k);
  }
  if (!still && p >= CB.GONE + CB.FALL && p < CB.GONE + CB.FALL + 0.35) { const a = 1 - (p - CB.GONE - CB.FALL) / 0.35; stamp(c, hband('210,250,255'), X(S.focus), Y(rowY(CB_CLEAR[0]) + CELL), (W.x1 - W.x0) * k * 1.1, a * 0.5 * calm, cs * 0.9); }
  // THE LIGHT RISING: a warm column + motes floating up out of the well, through the cooled line
  const rise = still ? 0.35 : smooth(CB.GONE - 0.1, CB.GONE + 0.6, p) * (1 - smooth(CB.RESET - 1.2, CB.RESET + 0.2, p));
  if (rise > 0.01) {
    const top6 = rowY(CB_CLEAR[0]);
    stamp(c, column('235,245,255'), X(S.focus), Y((top6 - 40) / 2), (W.x1 - W.x0) * 0.95 * k, rise * 0.4 * calm, (top6 + 80) * k);
    stamp(c, glow('200,250,255', 0.25), X(S.focus), Y(top6), 260 * k, rise * 0.4 * calm, 90 * k);
    for (const m of MOTES) {
      const u = still ? m.ph : fract((p - CB.GONE) * m.v / 300 + m.ph);
      const yy = top6 - u * (top6 + 60), xx = lerp(W.x0 + 18, W.x1 - 18, m.u) + Math.sin(u * 6 + m.ph * 9) * 10;
      stamp(c, sparkle(m.c), X(xx), Y(yy), 26 * k * m.sz, Math.sin(u * Math.PI) * rise * 0.9 * calm);
    }
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

export const pdFirstKo = { id: 'pdFirstKo', tier: 'common', bleed: 0, stillT: KO.STILL, draw: firstKo };
export const pdPerfect = { id: 'pdPerfect', tier: 'rare', bleed: 0, stillT: 0, draw: perfectClear };
export const pdComeback = { id: 'pdComeback', tier: 'epic', bleed: 0, stillT: CB.STILL, draw: comeback };
