// `card-frostbite` — FROST (an uncommon's one clear effect): frost CREEPS IN from the edges (a ragged front of crystal growth, densest at the
// rim), a CRACK RUNS across the ice on the right (its branches splitting off, a bright core in a cold glow), a GLINT rides it, a few
// crystals twinkle; then the frost eases back and grows again (an ~11 s cycle). The crystal layer is baked ONCE per size (dendrites —
// branching strokes — + six-point stars + a rime haze at the rim) and revealed through a clip of growing circles round the edges.
import { sprite, sparkle, glow, stamp, rng, smooth, fract, unit } from './kit.js';
import { rrect } from './renderer.js';

const CYCLE = 11;

/** the frost itself: dendrites from the rim inward (fewer + shorter towards the middle), stars, a rime haze */
function crystals(w, h, dpr, seed, U = h) {
  return sprite(`frost:${w}x${h}@${dpr}:${seed}:${Math.round(U)}`, w * dpr, h * dpr, (c) => {
    c.scale(dpr, dpr);
    const r = rng(seed);
    c.lineCap = 'round';
    const branch = (x, y, a, len, depth, wid) => {
      if (depth > 4 || len < 1.6) return;
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      c.globalAlpha = 0.18 + 0.42 * (1 - depth / 5); c.lineWidth = wid; c.strokeStyle = 'rgb(232,250,255)';
      c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
      const n = 2 + (r() < 0.4 ? 1 : 0);
      for (let k = 1; k <= n; k++) {
        const f = k / (n + 1), bx = x + (x2 - x) * f, by = y + (y2 - y) * f;
        branch(bx, by, a + (r() < 0.5 ? 1 : -1) * (0.75 + r() * 0.45), len * (0.38 + r() * 0.22), depth + 1, wid * 0.7);
      }
      branch(x2, y2, a + (r() - 0.5) * 0.5, len * 0.62, depth + 1, wid * 0.8);
    };
    // seeds along the four edges, growing inward
    const edge = (n, fn) => { for (let i = 0; i < n; i++) fn(r()); };
    // (U = the size unit: a full card grows the same frost as a strip, all round its longer rim — never a web over the whole card)
    edge(Math.round(w / 15), u => branch(u * w, -1, Math.PI / 2 + (r() - 0.5) * 1.1, U * (0.08 + r() * 0.13), 0, 0.85));
    edge(Math.round(w / 15), u => branch(u * w, h + 1, -Math.PI / 2 + (r() - 0.5) * 1.1, U * (0.08 + r() * 0.13), 0, 0.85));
    edge(Math.round(4 * h / U), u => branch(-1, u * h, (r() - 0.5) * 1.2, U * (0.18 + r() * 0.2), 0, 0.9));
    edge(Math.round(5 * h / U), u => branch(w + 1, u * h, Math.PI + (r() - 0.5) * 1.2, U * (0.2 + r() * 0.22), 0, 0.9));
    // six-point stars sprinkled (denser near the rim)
    for (let i = 0; i < Math.round(w / 22); i++) {
      const x = r() * w, y = r() < 0.5 ? r() * U * 0.3 : h - r() * U * 0.3, R = 1.6 + r() * 2.6;
      c.globalAlpha = 0.5 + r() * 0.4; c.lineWidth = 0.6;
      for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + r() * 0.3; c.beginPath(); c.moveTo(x - Math.cos(a) * R, y - Math.sin(a) * R); c.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); c.stroke(); }
    }
    c.globalAlpha = 1;
  });
}

/** the crack: a jagged run from the lower right up across, with two branches (a fixed shape per seed) */
function crackPath(w, h, seed) {
  const r = rng(seed * 7 + 3), main = [];
  // (ice cracks in short jagged runs — many small kinks, the line wandering, never a smooth zigzag)
  let x = w * 0.58, y = h * 0.78, a = -0.5;
  main.push([x, y]);
  for (let i = 0; i < 20; i++) { a += (r() - 0.5) * 0.9; a = Math.max(-1.1, Math.min(0.5, a)); const L = w * (0.009 + r() * 0.012); x += Math.cos(a) * L * 1.6; y += Math.sin(a) * L; main.push([x, Math.max(h * 0.1, Math.min(h * 0.9, y))]); }
  const br = [];
  for (const at of [5, 10, 15]) { const [bx, by] = main[at], seg = [[bx, by]]; let px = bx, py = by, ba = at === 10 ? 0.9 : -1.2; for (let k = 0; k < 6; k++) { ba += (r() - 0.5) * 0.8; const L = w * (0.006 + r() * 0.008); px += Math.cos(ba) * L * 1.4; py += Math.sin(ba) * L; seg.push([px, py]); } br.push({ at, seg }); }
  return { main, br };
}
const lenOf = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
/** stroke a polyline's first f (0..1) of its length; returns the tip */
function partial(c, pts, f) {
  const L = lenOf(pts) * f; let acc = 0, tip = pts[0];
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], d = Math.hypot(bx - ax, by - ay);
    if (acc + d >= L) { const u = (L - acc) / d; tip = [ax + (bx - ax) * u, ay + (by - ay) * u]; c.lineTo(tip[0], tip[1]); break; }
    c.lineTo(bx, by); acc += d; tip = [bx, by];
  }
  return tip;
}

export default {
  id: 'frost', tier: 'uncommon', bleed: 0, stillT: 8.2,
  draw(c, s, t, Q) {
    const { w, h } = s, seed = 11 + (s.opts.seed || 0), dpr = Math.min(3, Math.round(Q.dpr * 4) / 4), U = unit(s);
    const u = fract(t / CYCLE), tt = u * CYCLE;
    // the frost's reach: grows 0 → 1 over ~6 s, holds, eases back over the last 1.5 s
    const grow = smooth(0, 6.2, tt) * (1 - smooth(9.4, 11, tt)) * 0.92 + 0.08;
    c.save(); rrect(c, 0, 0, w, h, s.opts.radius || 12); c.clip();
    // THE RIME: a soft frosted haze in from the rim, its reach + strength following the frost (soft — never a hard front)
    for (const [x0, y0, x1, y1, k] of [[0, 0, 0, U * 0.55, 1], [0, h, 0, h - U * 0.6, 1], [0, 0, w * 0.18, 0, 0.8], [w, 0, w * 0.8, 0, 1]]) {
      const g = c.createLinearGradient(x0, y0, x0 + (x1 - x0) * (0.35 + 0.65 * grow), y0 + (y1 - y0) * (0.35 + 0.65 * grow));
      g.addColorStop(0, `rgba(222,246,255,${0.34 * grow * k})`); g.addColorStop(0.45, `rgba(222,246,255,${0.1 * grow * k})`); g.addColorStop(1, 'rgba(222,246,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    // THE FRONT: the crystals revealed through a ragged union of many small circles round the rim, each its own reach (the lines are
    // cut where they've grown to — growth, not a shape)
    const r = rng(seed + 5); c.save(); c.beginPath();
    const ring = [];
    for (let x = 0; x <= w; x += 9) { ring.push([x, -2]); ring.push([x, h + 2]); }
    for (let y = 0; y <= h; y += 9) { ring.push([-2, y]); ring.push([w + 2, y]); }
    for (const [x, y] of ring) { const R = U * (0.06 + 0.42 * grow) * (0.4 + r() * 1.0); c.moveTo(x + R, y); c.arc(x, y, R, 0, Math.PI * 2); }
    c.clip();
    c.drawImage(crystals(w, h, dpr, seed, U), 0, 0, w, h);
    c.restore();
    // THE CRACK: runs 4.0 → 5.2 s, stands (fading as the frost goes); its branches follow
    const P = crackPath(w, h, seed), run = smooth(4.0, 5.2, tt), fade = 1 - smooth(9.4, 10.6, tt);
    if (run > 0 && fade > 0) {
      c.lineJoin = 'round'; c.lineCap = 'round';
      for (const [wid, col, a] of [[5, '140,220,255', 0.18], [2.2, '200,240,255', 0.5], [0.9, '255,255,255', 0.95]]) {
        c.globalAlpha = a * fade; c.strokeStyle = `rgb(${col})`; c.lineWidth = wid;
        partial(c, P.main, run); c.stroke();
        for (const b of P.br) { const bf = smooth(b.at / 21, 1, run); if (bf > 0) { partial(c, b.seg, bf); c.stroke(); } }
      }
      // the running tip's flare, then THE GLINT riding the crack once it's whole
      c.globalCompositeOperation = 'lighter';
      if (run < 1) { const tip = partial(c, P.main, run); stamp(c, sparkle(), tip[0], tip[1], 14, 0.9 * fade); }
      const g = smooth(5.6, 7.0, tt) - smooth(7.0, 7.3, tt);
      if (g > 0) { const tip = partial(c, P.main, smooth(5.6, 7.0, tt)); stamp(c, sparkle('235,250,255'), tip[0], tip[1], 18, g * fade); stamp(c, glow('160,230,255'), tip[0], tip[1], 26, 0.5 * g * fade); }
      c.globalCompositeOperation = 'source-over';
    }
    // a few crystals twinkling where the frost has reached
    c.globalCompositeOperation = 'lighter';
    const tw = rng(seed + 9);
    for (let i = 0; i < Math.round(6 * (0.5 + Q.q / 2)); i++) {
      const x = tw() * w, y = tw() < 0.5 ? tw() * U * 0.22 : h - tw() * U * 0.22, p = tw() * 7;
      const a = Q.still ? 0.6 : Math.max(0, Math.sin(t * 1.6 + p)) ** 6;
      stamp(c, sparkle('225,248,255'), x, y, 9, a * grow);
    }
    c.restore();
  },
};
