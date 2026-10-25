// CITY 2.0 — THE HARBOR, FP3b item 9: THE GLOW-WAND DANCE CIRCLE — the dancers' MOVES on the beat + their neon LIGHT WANDS (the circle's
// plan: core/harbor-routines.js; its people: core/harbor-people.js#planDance; drawn by people.js). The owner's 8P note 5: handheld
// neon wands (like flight-deck marshalling wands — anachronistic, but party nights are the city's neon fantasy), the colours of the
// party's palette, RACING / strobing on the beat, now and then twitching or glitching like a tired tube; CRISP tubes with SHORT
// trails (never a smear); big readable moves on the beat. Tier 0: no trails, no halo.
//
// THE MOVES: below (danceMoves — each dancer their own set, fluid, on the city's beat grid).

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = u => { const x = clamp01(u); return x * x * (3 - 2 * x); };
/** the wands' numbers: length (body heights), the tube's width (× the figure's height), the trail's steps + alpha, a glitch's odds
 *  per dancer per window (s), its length */
export const WAND = Object.freeze({ len: 0.34, w: 0.032, trail: [0.3, 0.17, 0.08], glitch: 0.035, win: 0.4, dim: 0.12 });

// THE MOVES (danceMoves — PURE; POL4, the owner: "rigid", "every dancer doing the EXACT same moves looks weird", "off-beat"): each
// dancer has their OWN set — four moves drawn from the library below in their own order, their own amplitude, bounce + mirror, and a
// touch of human timing (a few hundredths of a beat) — on the SAME beat grid as the city's lights (harbor-beat.js's beats: every
// accent — the pump's peak, the swing's turn-around, the point's snap — lands ON a beat, never between). FLUID: every curve is eased
// (cosines, never a snap), a phrase change crossfades over the last half beat, and the forearm FOLLOWS THROUGH (its bend lags the
// upper arm's swing). Now and then (one phrase in six) the whole circle SWAYS TOGETHER — the same move, in step. Each arm is [phi
// (raised in the FRONTAL plane: 0 hanging, π/2 out, π up), bend].
//   pump   both arms punching up into a V on every beat, the knees dipping with it
//   swing  the arms swinging side to side like a marshal's "come on" — the turn-arounds on the beats, the body swaying with them
//   wave   one arm high, waving over the head (its forearm whipping), the other low; they trade every bar
//   spin   a full turn over four beats (eased in + out, landing on the downbeat), arms out, then a soft pump
//   lasso  the arms circling in a slow figure-eight, each turn-around on a beat
//   point  a disco point up-and-out on the beat, the arms trading — snapped in fast, eased out
//   sway   (together) the arms high, the whole body swaying side to side over two beats
export const MOVES = Object.freeze(['pump', 'swing', 'wave', 'spin', 'lasso', 'point']);
const shash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const styles = new Map();
/** a dancer's style (seeded by their id — the same on every phone) */
export function danceStyle(key) {
  let s = styles.get(key);
  if (s) return s;
  const r = rng(shash(String(key))), pool = MOVES.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  s = { set: pool.slice(0, 4), amp: 0.82 + r() * 0.3, bounce: 0.6 + r() * 0.7, mir: r() < 0.5 ? -1 : 1, lag: (r() - 0.35) * 0.06, off: Math.floor(r() * 4) };
  if (styles.size > 64) styles.clear();
  styles.set(key, s);
  return s;
}
/** the accent at beat phase b (0..1): a smooth peak ON the beat (1 at b = 0, ~0 by half way) */
const acc = b => { const c = 0.5 + 0.5 * Math.cos(TAU * b); return c * c; };
const eio = u => { const x = clamp01(u); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
/** one move's pose at x beats into its phrase (0..8) */
function pose(move, x, S) {
  const b = ((x % 1) + 1) % 1, A = S.amp, m = S.mir, a = acc(b);
  let a0, a1, sway = 0, dip = 0.034 * S.bounce * a, spin = 0;
  if (move === 'pump') { const v = 2.2 + 0.72 * A * a; a0 = [v, 0.5 - 0.35 * a]; a1 = [v, 0.5 - 0.35 * a]; dip = 0.05 * S.bounce * a; }
  else if (move === 'swing') { const c = Math.cos(Math.PI * x), sg = Math.sign(c) * Math.pow(Math.abs(c), 0.6) * m; a0 = [1.7 + 1.1 * A * sg, 0.3 + 0.4 * (1 - Math.abs(c))]; a1 = [1.7 - 1.1 * A * sg, 0.3 + 0.4 * (1 - Math.abs(c))]; sway = 0.85 * sg; }
  else if (move === 'wave') { const hi = Math.floor(x / 4) % 2 === 0 ? 0 : 1, c = Math.cos(Math.PI * x); const up = [2.65 + 0.32 * A * c, 0.45 + 0.45 * Math.sin(Math.PI * x)], low = [0.9 - 0.25 * c, 0.9]; a0 = hi ? low : up; a1 = hi ? up : low; sway = 0.5 * c * m; }
  else if (move === 'spin') {
    const u = (x - 1) / 4;                                         // (beats 1 → 5: the turn, landing on beat 5)
    if (u > 0 && u < 1) { spin = m * TAU * eio(u); const o = 1.45 + 0.3 * Math.sin(Math.PI * u); a0 = [o, 0.15]; a1 = [o, 0.15]; dip = 0.02; }
    else { const v = 2.0 + 0.5 * A * a; a0 = [v, 0.5]; a1 = [v, 0.5]; }
  }
  else if (move === 'lasso') { const p = Math.PI * (x + 1) / 2, s0 = Math.sin(p) * m; a0 = [1.75 + 1.0 * A * s0, 0.35 + 0.45 * Math.cos(p) ** 2]; a1 = [1.75 - 1.0 * A * s0, 0.35 + 0.45 * Math.sin(p) ** 2]; sway = 0.55 * s0; }
  else if (move === 'point') { const k = b < 0.16 ? eio(b / 0.16) : 1 - 0.35 * eio((b - 0.16) / 0.84), side = (Math.floor(x) % 2 === 0) !== (m < 0); const up = [1.6 + 1.15 * A * k, 0.08], low = [0.75 + 0.3 * (1 - k), 0.85]; a0 = side ? up : low; a1 = side ? low : up; sway = (side ? 0.5 : -0.5) * k; }
  else { const c = Math.cos(Math.PI * x / 2); a0 = [2.72 + 0.14 * Math.cos(Math.PI * x), 0.3]; a1 = [2.72 - 0.14 * Math.cos(Math.PI * x), 0.3]; sway = 1.05 * c; dip = 0.025 * a; }   // sway
  return { a0, a1, sway, dip, spin };
}
/** the phrase's move for a style (ph: the phrase index; one in six the whole circle sways together) */
const moveOf = (S, ph) => (((ph % 6) + 6) % 6 === 5 ? 'sway' : S.set[(((ph + S.off) % 4) + 4) % 4]);
/**
 * dancer idx's moves at the beat count beatsF (beats since the song's start, fractional — the city's beat grid), key = their own id
 * (the style's seed) → { move, arms: [[phi, bend], [phi, bend]], sway, dip, spin (a turn added to the heading, rad), hit (0..1: the
 * beat's accent, for the wands) }
 */
export function danceMoves(idx, beatsF, key = idx) {
  const S = danceStyle(key), together = (((Math.floor(beatsF / 8)) % 6) + 6) % 6 === 5;
  const x0 = beatsF + (together ? 0 : S.lag), ph = Math.floor(x0 / 8), x = x0 - ph * 8;
  const St = together ? { ...S, mir: 1, amp: 1, lag: 0 } : S;
  const cur = moveOf(S, ph), P = pose(cur, x, St);
  // (FOLLOW-THROUGH: the forearm lags the upper arm — its bend grows with the arm's swing a beat-tenth ago)
  const Q = pose(cur, x - 0.12, St);
  P.a0 = [P.a0[0], P.a0[1] + Math.max(-0.3, Math.min(0.7, (P.a0[0] - Q.a0[0]) * 1.4))];
  P.a1 = [P.a1[0], P.a1[1] + Math.max(-0.3, Math.min(0.7, (P.a1[0] - Q.a1[0]) * 1.4))];
  // (the phrase change: the last half beat crossfades into the next move's first pose — never a snap)
  if (x > 7.5) {
    const nx = moveOf(S, ph + 1), Sn = ((((ph + 1) % 6) + 6) % 6 === 5) ? { ...S, mir: 1, amp: 1, lag: 0 } : S, N = pose(nx, x - 8, Sn), k = eio((x - 7.5) / 0.5);
    const mixA = (p, q) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
    P.a0 = mixA(P.a0, N.a0); P.a1 = mixA(P.a1, N.a1); P.sway += (N.sway - P.sway) * k; P.dip += (N.dip - P.dip) * k;
    if (cur === 'spin' || nx === 'spin') P.spin = P.spin * (1 - k) + N.spin * k;
  }
  return { move: cur, arms: [P.a0, P.a1], sway: P.sway, dip: P.dip, spin: P.spin, hit: acc(((x % 1) + 1) % 1) };
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
  const strobe = o.move === 'point' ? (b < 0.18 ? 1 : 0.5) : 1;   // (the point's snap strobes the wands on the beat)
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
