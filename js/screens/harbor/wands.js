// CITY 2.0 — THE HARBOR, FP3b item 9: THE GLOW-WAND DANCE CIRCLE — the dancers' MOVES on the beat + their neon LIGHT WANDS (the circle's
// plan: core/harbor-routines.js; its people: core/harbor-people.js#planDance; drawn by people.js). The owner's 8P note 5: handheld
// neon wands (like flight-deck marshalling wands — anachronistic, but party nights are the city's neon fantasy), the colours of the
// party's palette, RACING / strobing on the beat, now and then twitching or glitching like a tired tube; CRISP tubes with SHORT
// trails (never a smear); big readable moves on the beat. Tier 0: no trails, no halo.
//
// THE MOVES (danceMoves — PURE): an 8-beat phrase each, the circle in step (the odd dancers mirrored): UP (a V shooting up on every
// beat) · SWING (one arm up as the other comes down, a sway — the marshal's "come on") · SPIN (arms out, a full turn over four beats) ·
// SIGNAL (the arms trading up / out, crisp on the beat — a strobe of the wands). Each arm is { phi (raised in the FRONTAL plane: 0
// hanging, π/2 out, π up), bend }.

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = u => { const x = clamp01(u); return x * x * (3 - 2 * x); };
export const MOVES = Object.freeze(['up', 'swing', 'spin', 'signal']);
/** the wands' numbers: length (body heights), the tube's width (× the figure's height), the trail's steps + alpha, a glitch's odds
 *  per dancer per window (s), its length */
export const WAND = Object.freeze({ len: 0.34, w: 0.032, trail: [0.3, 0.17, 0.08], glitch: 0.035, win: 0.4, dim: 0.12 });

/** the moves for dancer idx at the beat count beatsF (beats since the song's start, fractional) → { move, arms: [[phi, bend], [phi,
 *  bend]], sway, dip, spin (a turn added to the heading, rad), hit (0..1: the beat's hit, for the wands) } */
export function danceMoves(idx, beatsF) {
  const ph = Math.floor(beatsF / 8), move = MOVES[((ph % 4) + 4) % 4], b = ((beatsF % 1) + 1) % 1, q = ((beatsF % 8) + 8) % 8;
  const hit = (1 - b) * (1 - b), mir = idx % 2 ? -1 : 1;
  let a0, a1, sway = 0, dip = 0.03 * hit, spin = 0;
  if (move === 'up') { const v = 2.45 + 0.5 * hit; a0 = [v, 0.15]; a1 = [v, 0.15]; dip = 0.045 * hit; }
  else if (move === 'swing') { const s = Math.sin(Math.PI * beatsF) * mir; a0 = [1.55 + 1.15 * s, 0.25]; a1 = [1.55 - 1.15 * s, 0.25]; sway = s; }
  else if (move === 'spin') { const u = (q % 4) / 4; spin = mir * TAU * smooth(u * 1.15); a0 = [1.5 + 0.15 * hit, 0.1]; a1 = [1.5 + 0.15 * hit, 0.1]; }
  else { const even = Math.floor(beatsF) % 2 === 0, k = smooth(b * 5); const hi = 2.95, lo = 1.35; const x = even ? [lo + (hi - lo) * k, hi + (lo - hi) * k] : [hi + (lo - hi) * k, lo + (hi - lo) * k]; a0 = [x[mir > 0 ? 0 : 1], 0.12]; a1 = [x[mir > 0 ? 1 : 0], 0.12]; }
  return { move, arms: [a0, a1], sway, dip, spin, hit };
}

/** a seeded glitch: is dancer idx's wand i flickering at t (s)? → 0 (off) .. 1 (fine) + a twitch (rad) */
export function glitchOf(idx, i, t) {
  const w = Math.floor(t / WAND.win), h = hh(idx * 7 + i, w);
  if (h > WAND.glitch) return { k: 1, tw: 0 };
  const u = (t / WAND.win) % 1;
  return { k: u < 0.3 ? WAND.dim : u < 0.4 ? 1 : u < 0.55 ? 0.3 : 1, tw: (hh(idx, w + 99) - 0.5) * 0.5 };
}
const hh = (n, s) => { let h = (n * 374761393 + s * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/**
 * The wands of one dancer, drawn after their figure. J, fx, fy, H: the dancer's rig on screen (folk.js#rigOf); o = { idx, n (dancers),
 * beatsF, punch (the city's beat punch 0..1), pal ([r, g, b] × 4), move, t, tier, k (the circle's level 0..1), trails (a Map: the
 * last positions — people.js keeps it), key (this dancer's id) }
 */
export function drawWands(c, J, fx, fy, H, o) {
  const pal = o.pal && o.pal.length ? o.pal : [[255, 63, 176], [63, 224, 255], [166, 91, 255], [255, 204, 90]];
  const ph = Math.floor(o.beatsF / 8), b = ((o.beatsF % 1) + 1) % 1;
  // THE RACE: a bright pulse running round the ring, a dancer a half beat; SIGNAL strobes every wand on the beat
  const racer = ((Math.floor(o.beatsF * 2) % o.n) + o.n) % o.n, race = racer === o.idx ? 1 - ((o.beatsF * 2) % 1) : 0;
  const strobe = o.move === 'signal' ? (b < 0.18 ? 1 : 0.45) : 1;
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const hd = J.hands[i], el = J.elbows[i], g = glitchOf(o.idx, i, o.t);
    let dx = hd[0] - el[0], dy = hd[1] - el[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    if (g.tw) { const c0 = Math.cos(g.tw), s0 = Math.sin(g.tw); [dx, dy] = [dx * c0 - dy * s0, dx * s0 + dy * c0]; }
    const x0 = fx + hd[0] * H, y0 = fy - hd[1] * H, x1 = x0 + dx * WAND.len * H, y1 = y0 - dy * WAND.len * H;
    const col = pal[(o.idx + i + ph) % pal.length], k = clamp01(o.k) * g.k * strobe * (0.62 + 0.38 * Math.max(clamp01(o.punch), race));
    const w = Math.max(1, WAND.w * H), hot = col.map(v => Math.min(255, v + 90));
    // the trail: the last few positions, each a thin quad from where the wand was to where it is (short: ~3 frames)
    if (o.tier !== 0 && o.trails) {
      const key = `${o.key}|${i}`, tr = o.trails.get(key) || [];
      let prev = [x0, y0, x1, y1];
      for (let j = 0; j < tr.length && j < WAND.trail.length; j++) {
        const p = tr[j]; if (Math.hypot(p[2] - prev[2], p[3] - prev[3]) < 0.6) { prev = p; continue; }
        c.globalAlpha = WAND.trail[j] * k; c.fillStyle = `rgb(${col.join(',')})`;
        c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(prev[2], prev[3]); c.lineTo(p[2], p[3]); c.lineTo(p[0], p[1]); c.closePath(); c.fill();
        prev = p;
      }
      if (o.advance) { tr.unshift([x0, y0, x1, y1]); if (tr.length > WAND.trail.length) tr.length = WAND.trail.length; o.trails.set(key, tr); }
    }
    // the tube: a tight halo (not at tier 0), the coloured glass, the white-hot core — crisp
    if (o.tier !== 0) { c.globalAlpha = 0.22 * k; c.strokeStyle = `rgb(${col.join(',')})`; c.lineWidth = w * 3.4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    c.globalAlpha = Math.min(1, 0.95 * k); c.strokeStyle = `rgb(${col.join(',')})`; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.globalAlpha = Math.min(1, 0.85 * k); c.strokeStyle = `rgb(${hot.join(',')})`; c.lineWidth = Math.max(0.5, w * 0.42); c.beginPath(); c.moveTo(x0 + dx * w * 0.3, y0 - dy * w * 0.3); c.lineTo(x1, y1); c.stroke();
  }
  c.restore();
}
