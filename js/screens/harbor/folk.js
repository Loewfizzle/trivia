// CITY 2.0 — THE HARBOR, PART 8P: THE FOLK — the promenade's + the roof's people, drawn (their plan: core/harbor-people.js). PREMIUM
// SILHOUETTES ~25–30 pt that read by SHAPE, LIGHT and MOTION (the owner: never clip-art): clear 1920s shapes — long coats + fedoras,
// cloche hats + drop-waist dresses, a newsboy cap, flapper dresses + tuxedos on party nights, shirt-sleeves + boaters in summer, coats
// + scarves in autumn / winter, umbrellas in the rain (Part 9's hook) — dogs on leashes; a stride-locked WALK (the planted foot is
// fixed on the ground: the stride follows the distance walked, never the clock), a JOG, a few strong POSES (sit, wait, lean on the
// railing, chat, point up at the sky, wave, check a watch, window-shop, at the cart). LIT BY THE SCENE: by day the sun's side lighter
// + a soft cast shadow along the real sun; at night a dark silhouette taking the lamps' light where it stands (warm under the globes,
// cool-white under the tall lamps, darker between the pools) + a crisp RIM on the side toward the nearest lamp; always a contact
// shadow. ADDING A LOOK: one entry in LOOKS (what it wears — a function of the season + the night) — the planner names it.
import { project } from '../../core/harbor-layout.js';
import { rngFrom } from '../../core/rng.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`);
const pick = (r, a) => a[Math.floor(r() * a.length)];

// ------------------------------------------------------------------ THE WARDROBE (1920s, muted, one accent each)
// FP3a (the owner's 8P note 3 — "never flat black silhouettes by day"): real muted period cloth that reads at ~27 pt in daylight —
// camel, tweed brown, navy serge, bottle green, burgundy, grey herringbone, dove grey, a cream mac — trousers in flannel greys +
// browns, felt hats in browns + greys. At night the same cloth goes to a lamp-lit silhouette (drawFolk's NIGHT mix).
const COATS = [[176, 140, 96], [128, 96, 70], [64, 76, 112], [72, 100, 80], [130, 60, 66], [96, 96, 104], [152, 150, 146], [112, 56, 48], [198, 184, 152]];
const TROUSERS = [[104, 102, 106], [98, 82, 68], [60, 66, 90], [74, 74, 80], [150, 134, 104]];
const FELT = [[72, 62, 54], [112, 94, 72], [84, 84, 94], [150, 130, 100], [56, 52, 60]];
const DRESSES = [[150, 82, 108], [62, 120, 124], [190, 112, 104], [204, 170, 96], [220, 210, 186], [104, 100, 156], [164, 80, 72]];
const FLAPPER = [[214, 176, 96], [196, 60, 84], [40, 40, 52], [210, 206, 196], [88, 150, 160], [150, 92, 168]];
const SUMMER = [[226, 222, 208], [198, 208, 214], [214, 196, 160], [184, 202, 176]];
const SCARVES = [[178, 48, 48], [206, 156, 60], [58, 96, 150], [150, 70, 120], [60, 120, 90], [224, 214, 196]];
const SKIN = [[226, 186, 152], [204, 160, 120], [160, 112, 78], [112, 76, 56], [236, 200, 170]];
const HAIR = [[40, 30, 26], [86, 58, 36], [150, 108, 60], [24, 20, 22], [200, 170, 110]];
const DOGS = [[120, 82, 50], [36, 32, 34], [214, 196, 160], [170, 120, 66], [236, 232, 224]];

/**
 * LOOKS: what a visitor wears → { woman, kid, coat ('long' | 'short' | 'none'), dress ('day' | 'flapper' | null), hat ('fedora' |
 * 'cloche' | 'newsboy' | 'boater' | 'flatcap' | 'top' | null), cols: { coat, legs, hat, skin, hair, scarf?, dress?, shirt }, carry
 * ('case' | 'pail' | 'purse' | 'papers' | null), jog }. r: the member's own random; o: { season, party, night, role }.
 */
export function lookOf(name, seed, o = {}) {
  const r = rngFrom(seed), season = o.season || 'autumn', cold = season === 'winter' || season === 'autumn', summer = season === 'summer';
  const party = !!o.party, role = o.role || 'lead';
  let woman = r() < 0.5, kid = false;
  if (name === 'lady') woman = true;
  if (name === 'couple') woman = role !== 'lead';
  if (name === 'worker' || name === 'jogger' || name === 'nightworker') woman = r() < 0.15;
  if (name === 'newsboy') { kid = true; woman = false; }
  const L = { woman, kid, coat: cold ? 'long' : summer ? 'none' : r() < 0.6 ? 'long' : 'short', dress: woman ? 'day' : null, hat: null, carry: null, jog: false,
    cols: { coat: pick(r, COATS), legs: pick(r, TROUSERS), hat: pick(r, FELT),
      skin: pick(r, SKIN), hair: pick(r, HAIR), shirt: pick(r, SUMMER), dress: pick(r, DRESSES), scarf: cold && r() < 0.7 ? pick(r, SCARVES) : null } };
  L.hat = woman ? (r() < 0.75 ? 'cloche' : null) : summer && r() < 0.5 ? 'boater' : r() < 0.8 ? 'fedora' : 'flatcap';
  if (woman && L.hat === 'cloche') L.cols.hat = pick(r, [[120, 64, 80], [60, 60, 84], [150, 120, 80], [40, 40, 48], [170, 80, 70]]);
  if (name === 'commuter') { L.carry = r() < 0.55 ? (woman ? 'purse' : 'case') : 'papers'; if (!woman) L.hat = summer ? 'boater' : 'fedora'; }
  if (name === 'lady') L.carry = 'purse';
  if (name === 'worker' || name === 'nightworker') { L.hat = 'flatcap'; L.coat = 'short'; L.carry = 'pail'; L.cols.coat = pick(r, [[70, 84, 112], [112, 96, 74], [88, 88, 90]]); L.dress = null; L.woman = false; }
  if (name === 'jogger') { L.jog = true; L.coat = 'none'; L.dress = null; L.woman = false; L.hat = r() < 0.5 ? 'flatcap' : null; L.cols.shirt = pick(r, [[214, 210, 200], [120, 40, 44], [44, 60, 96], [90, 90, 96]]); L.cols.legs = pick(r, [[180, 170, 150], [60, 60, 66], [214, 210, 200]]); L.scarf = null; L.cols.scarf = null; }
  if (name === 'newsboy') { L.hat = 'newsboy'; L.coat = 'short'; L.carry = 'papers'; L.cols.coat = pick(r, [[130, 108, 80], [100, 94, 86], [116, 92, 66]]); L.cols.legs = [116, 104, 86]; }
  if (name === 'guest' || (party && (name === 'couple' || name === 'stroll'))) {
    if (L.woman) { L.dress = party || r() < 0.4 ? 'flapper' : 'day'; L.cols.dress = pick(r, L.dress === 'flapper' ? FLAPPER : DRESSES); L.hat = L.dress === 'flapper' ? (r() < 0.5 ? 'band' : null) : 'cloche'; L.coat = cold && !party ? 'long' : 'none'; L.carry = 'purse'; }
    else { L.cols.coat = pick(r, [[22, 22, 28], [30, 30, 38], [44, 40, 46]]); L.cols.legs = [24, 24, 30]; L.hat = party && r() < 0.3 ? 'top' : 'fedora'; L.cols.hat = [24, 22, 28]; L.coat = cold ? 'long' : 'short'; L.cols.shirt = [236, 232, 222]; L.tux = true; }
  }
  if (name === 'night') { L.cols.coat = pick(r, [[58, 58, 70], [74, 66, 60], [52, 62, 84]]); L.coat = 'long'; if (!L.woman) L.hat = 'fedora'; }
  if (L.woman && L.coat === 'long') L.dress = L.dress || 'day';
  L.h = kid ? 0.72 : (L.woman ? 0.95 : 1.02) * (0.95 + r() * 0.08);
  L.umbrella = (o.rain || 0) > 0.3 && !L.jog && r() < 0.8 ? pick(r, [[30, 30, 36], [120, 40, 44], [44, 60, 96], [70, 64, 56]]) : null;
  L.dog = pick(r, DOGS); L.dogSize = 0.75 + r() * 0.5;
  return L;
}

// ------------------------------------------------------------------ THE BODY (figure space: x across, y up, in heights; d: facing)
/** the joints for a state (PURE): st = { pose, dir, dist, v }; t: the clock (s) for the idle motions; mo: motion on */
export function jointsOf(st, L, t, mo = true) {
  const d = st.dir === -1 ? -1 : 1, side = st.dir === 1 || st.dir === -1, pose = st.pose || 'walk', jog = L.jog && st.v > 2;
  const S = (jog ? 0.56 : L.kid ? 0.42 : 0.38) * L.h * 2.1;                    // (a step, world units — a stride is two)
  const walking = pose === 'walk' && st.v > 0.05, p = walking ? (st.dist / (2 * S)) % 1 : 0;
  const J = { side, d, face: st.dir, hip: [0, 0.49], sh: [0, 0.8], head: [0, 0.915], lean: 0, feet: [], knees: [], hands: [], elbows: [], pose, walking, p, jog };
  const breath = mo ? 0.004 * Math.sin(t * 1.7 + (L.h * 37)) : 0;
  J.sh[1] += breath; J.head[1] += breath;
  if (pose === 'sit') { J.hip = [0, 0.27]; J.sh = [0, 0.58 + breath]; J.head = [0, 0.69 + breath]; }
  if (pose === 'garden') { J.hip = [-0.03 * d, 0.34]; J.sh = [0.08 * d, 0.61]; J.head = [0.13 * d, 0.7]; }
  const thigh = 0.262, shin = 0.262, hip = J.hip;
  // the feet: stride-locked (the stance foot moves back exactly as far as the body moves on — no sliding)
  for (let i = 0; i < 2; i++) {
    let fx = (i ? -0.06 : 0.06) * (side ? 0.4 : 1), fy = 0;
    if (walking && side) {
      const q = (p + i * 0.5) % 1, s = S / (2.1 * L.h);   // (the step in heights)
      // (stance: the foot goes from s/2 ahead to s/2 behind while the body moves one step s on — fixed on the ground; swing: back to the front)
      if (q < 0.5) fx = d * s * (0.5 - q * 2); else { const u = (q - 0.5) / 0.5; fx = d * s * (-0.5 + u); fy = Math.sin(u * Math.PI) * (jog ? 0.09 : 0.045); }
    } else if (walking) { const q = (p + i * 0.5) % 1; fy = q > 0.5 ? Math.sin((q - 0.5) * 2 * Math.PI) * 0.035 : 0; }
    if (pose === 'sit') { fx = (i ? -0.07 : 0.07); fy = 0; }
    J.feet.push([fx, fy]);
    // the knee: two-segment IK — in profile it bends FORWARD (toward d); from the front / the back it stays nearly straight
    const hx0 = hip[0] + (side ? 0 : i ? -0.035 : 0.035), dx = fx - hx0, dy = fy - hip[1], dl = Math.hypot(dx, dy), L2 = Math.min(dl, thigh + shin - 1e-3);
    const a = Math.acos(clamp01((thigh * thigh + L2 * L2 - shin * shin) / (2 * thigh * L2))), base = Math.atan2(dy, dx), ang = base + (side ? d : (i ? -0.25 : 0.25)) * a;
    J.knees.push(pose === 'sit' ? [fx * 1.1, 0.27] : [hx0 + Math.cos(ang) * thigh, hip[1] + Math.sin(ang) * thigh]);
  }
  // the arms: a swing against the legs; the poses
  const sw = walking ? Math.sin(p * TAU) * (jog ? 0.75 : 0.42) : 0, up = 0.155, fore = 0.15;
  const arm = (i, ang, bendA) => { const sh = [J.sh[0] + (side ? 0 : i ? -0.11 : 0.11), J.sh[1] - 0.015], e = [sh[0] + Math.sin(ang) * up * (side ? d : 1), sh[1] - Math.cos(ang) * up], h = [e[0] + Math.sin(ang + bendA) * fore * (side ? d : 1), e[1] - Math.cos(ang + bendA) * fore]; J.elbows[i] = e; J.hands[i] = h; };
  const idle = mo ? Math.sin(t * 0.9 + L.h * 11) * 0.04 : 0;
  if (side) { arm(0, sw, jog ? 1.6 : 0.25 + Math.max(0, sw) * 0.4); arm(1, -sw, jog ? 1.6 : 0.25 + Math.max(0, -sw) * 0.4); }
  else { arm(0, 0.12 + idle, 0.12); arm(1, 0.12 - idle, 0.12); }
  // arm in arm (a couple strolling): the lead's far arm + the partner's near arm hooked together, no swing
  if (side && st.link === 'far') arm(1, 0.55, 1.2);
  if (side && st.link === 'near') arm(0, 0.55, 1.2);
  if (pose === 'point') { arm(0, 2.75, 0.05); }
  if (pose === 'wave') { const w = mo ? Math.sin(t * 7) * 0.35 : 0; arm(0, 2.6 + w * 0.3, -0.5 + w); }
  if (pose === 'watch') { arm(0, 1.0, 1.9); arm(1, 0.9, 1.6); }
  if (pose === 'chat') { const g = mo ? Math.sin(t * 2.3 + L.h * 5) : 0; arm(0, 0.7 + 0.25 * g, 1.1); }
  if (pose === 'lean') { arm(0, 1.3, 0.3); arm(1, 1.25, 0.35); J.lean = 0.06; }
  if (pose === 'cart' || pose === 'shop') { arm(0, 0.55, 0.9); }
  if (pose === 'sit') { arm(0, 0.5, 0.9); arm(1, 0.4, 0.9); }
  // the roof's poses: a DANCE (a sway + the arms trading up / out on a slow count), a TOAST (the glass raised), the GARDENER bending
  if (pose === 'dance') { const b = mo ? Math.sin(t * 3.4 + L.h * 9) : 0; J.sh[0] += 0.02 * b; J.head[0] += 0.03 * b; J.hip[0] -= 0.015 * b; arm(0, 1.4 + 0.9 * Math.max(0, b), 0.6); arm(1, 0.9 - 0.5 * b, 0.9); }
  if (pose === 'toast') { const up = mo ? 0.5 + 0.5 * Math.sin(t * 0.6 + L.h * 3) : 1; arm(0, 1.2 + 1.5 * up, 0.4); J.toast = up; }
  if (pose === 'garden') { arm(0, 0.35, 0.2); arm(1, 0.25, 0.25); J.lean = 0.09; }
  if (jog) J.lean = 0.07;
  else if (walking) J.lean = 0.02;
  return J;
}

// ------------------------------------------------------------------ DRAWING ONE FIGURE
/**
 * drawFolk(c, cam, it, env): it = { s (the state: x, z, pose, dir, dist, v, a), L (the look), arm (arm in arm with the partner: ±1) },
 * env = { t, mo, T (day / gold / night, sunDir, sunEl), dark (the lamps' ramp 0..1), lightAt(x, z) → [r, g, b] | null (the lamps'
 * light on the ground there), rimSide(x, z) → ±1 (the nearest lamp's side), shadow(h) → { dx, dz, a } | null, yUp (world height of
 * the ground: the roof deck) } → the figure's screen box
 */
export function drawFolk(c, cam, it, env) {
  const st = it.s, L = it.L, yUp = env.yUp || 0, [fx, fy] = project(cam, st.x, yUp, st.z), s = cam.F / st.z, H = 2.1 * L.h * s;
  if (H < 3 || fx + H * 0.45 < 0 || fx - H * 0.45 > cam.W) return null;     // (off the screen's edges: walking in / out — not drawn)
  const J = jointsOf(st, L, env.t || 0, env.mo !== false), a = clamp01(st.a == null ? 1 : st.a);
  // (the figure's night tone follows the SCENE's darkness — T.night, the bake's tones — the lamps' ramp only lights it)
  const T = env.T || { day: 1 }, day = clamp01((T.day || 0) + 0.8 * (T.gold || 0)), lampK = clamp01(env.dark || 0), dark = Math.max(lampK, clamp01(T.night || 0));
  const lt = env.lightAt ? env.lightAt(st.x, st.z) : null, lk = lt ? Math.min(1.3, (lt[0] + lt[1] + lt[2]) / 380) : 0;
  // the scene's light on a colour: by day itself (the gold hour warmer); at night a dark silhouette lifted by the lamps where it stands
  const NIGHT = [18, 16, 28];
  const lit = (col, k = 1) => {
    let cc = col;
    if (T.gold) cc = mix(cc, [cc[0] * 1.08 + 10, cc[1] * 0.95, cc[2] * 0.82], T.gold * 0.5);
    if (dark > 0.01) { cc = mix(cc, NIGHT, 0.86 * dark); if (lt) { const q = Math.min(1, 160 / Math.max(1, lt[0], lt[1], lt[2])); cc = [cc[0] + lt[0] * q * 0.1 * k * lampK, cc[1] + lt[1] * q * 0.1 * k * lampK, cc[2] + lt[2] * q * 0.1 * k * lampK]; } }   // (FP3a: 0.17 → 0.1 — mostly silhouette; the rim carries the light)
    return cc.map(v => Math.min(255, v));
  };
  const X = u => fx + u * H, Y = v => fy - v * H, d = J.d;
  c.save(); c.globalAlpha = a * (c.globalAlpha || 1);
  // ---- the shadows: a soft contact shadow; by day the sun's cast shadow along the ground
  const sh = env.shadow ? env.shadow(2.1 * L.h) : null;
  if (sh && st.pose !== 'sit') {
    const [tx, ty] = project(cam, st.x + sh.dx, yUp, st.z + sh.dz), w = H * 0.09;
    c.fillStyle = `rgba(28,22,44,${(sh.a * 0.85).toFixed(3)})`; c.beginPath(); c.moveTo(fx - w, fy); c.lineTo(fx + w, fy); c.lineTo(tx + w * 0.55, ty); c.lineTo(tx - w * 0.55, ty); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(tx, ty, w * 0.75, w * 0.35, 0, 0, TAU); c.fill();
  }
  c.fillStyle = `rgba(8,6,16,${(0.32 + 0.18 * (1 - day) + 0.1 * lk).toFixed(3)})`;
  c.beginPath(); c.ellipse(fx, fy, H * (st.pose === 'sit' ? 0.12 : 0.14), H * 0.035, 0, 0, TAU); c.fill();
  // ---- the RIM (night, under a lamp — FP3a, the owner's 8P note 3: on the HEAD + SHOULDERS only, never the whole outline): the head,
  // the hat and the top of the shoulders laid down first in the lamp's warm colour, offset toward the light — the body drawn over
  // them leaves a crisp lit edge where a lamp would catch a face + a collar
  if (dark > 0.3 && lt && lk > 0.12 && env.tier !== 0) {              // (tier 0: no rim pass)
    // (warm: lamplight on skin + wool — a cool street lamp's rim is pulled toward a warm white)
    const side = env.rimSide ? env.rimSide(st.x, st.z) : 1, n = Math.max(lt[0], lt[1], lt[2]) || 1, rc = mix(lt.map(v => Math.min(255, 52 + v / n * 200)), [255, 214, 160], 0.45);
    c.save(); c.translate(side * Math.max(0.7, H * 0.034), -Math.max(0.35, H * 0.01)); c.globalAlpha = a * 0.95 * clamp01(0.35 + lk * 0.8) * lampK;
    rimUpper(c, J, L, X, Y, H, rgb(rc)); c.restore();
  }
  body(c, J, L, X, Y, H, lit, env, false);
  c.restore();
  return { x: fx - H * 0.2, y: fy - H, w: H * 0.4, h: H };
}

/** the figure's parts, far side first (fill: col → style; flat: one colour for everything — the rim pass) */
function body(c, J, L, X, Y, H, lit, env, flat) {
  const f = (col, k = 1) => (flat ? lit() : rgb(lit(col, k)));
  const d = J.d, side = J.side, cols = L.cols, lean = J.lean * d;
  const leg = (i, col, w) => {
    const hp = [J.hip[0] + (side ? 0 : i ? -0.035 : 0.035) + lean * 0.2, J.hip[1]], k = J.knees[i], ft = J.feet[i];
    c.strokeStyle = f(col); c.lineWidth = w * H; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(X(hp[0]), Y(hp[1])); c.lineTo(X(k[0]), Y(k[1])); c.lineTo(X(ft[0]), Y(ft[1] + 0.02)); c.stroke();
    // the shoe
    c.fillStyle = f([24, 20, 22]); c.beginPath(); c.ellipse(X(ft[0] + (side ? d * 0.025 : 0)), Y(ft[1] + 0.012), H * (side ? 0.042 : 0.03), H * 0.018, 0, 0, TAU); c.fill();
  };
  const armP = (i, col, w) => {
    const sh = [J.sh[0] + (side ? 0 : i ? -0.11 : 0.11) + lean, J.sh[1] - 0.015], e = J.elbows[i], h = J.hands[i];
    c.strokeStyle = f(col); c.lineWidth = w * H; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(X(sh[0]), Y(sh[1])); c.lineTo(X(e[0] + lean), Y(e[1])); c.lineTo(X(h[0] + lean), Y(h[1])); c.stroke();
    c.fillStyle = f(cols.skin, 0.9); c.beginPath(); c.arc(X(h[0] + lean), Y(h[1]), H * 0.022, 0, TAU); c.fill();
    return [X(h[0] + lean), Y(h[1])];
  };
  const legCol = L.dress && L.dress !== null && !L.tux ? (L.woman ? [196, 170, 150] : cols.legs) : cols.legs, legW = L.woman ? 0.05 : L.jog ? 0.066 : 0.078;
  const sleeve = L.coat === 'none' ? (L.jog ? cols.shirt : L.woman ? cols.dress : cols.shirt) : L.woman && L.coat === 'none' ? cols.dress : cols.coat;
  // far limbs (a shade darker)
  const far = col => col.map(v => v * 0.78);
  if (side) { armP(1, far(sleeve), 0.062); leg(1, far(legCol), legW); }
  else { leg(1, legCol, legW); }
  // the torso / the coat / the dress
  const top = J.sh[1] + 0.01, hipY = J.hip[1], sx = side ? 0.1 : 0.138;
  const hem = J.pose === 'sit' ? hipY - 0.02 : L.coat === 'long' ? 0.27 : L.dress === 'flapper' ? 0.3 : L.dress ? 0.24 : L.coat === 'short' ? hipY - 0.06 : hipY - 0.02;
  const swingHem = J.walking ? Math.sin(J.p * TAU * 2) * 0.012 : 0;
  const torsoCol = L.coat !== 'none' ? cols.coat : L.dress ? cols.dress : cols.shirt;
  c.fillStyle = f(torsoCol);
  c.beginPath();
  const flare = L.coat === 'long' ? 0.03 : L.dress === 'flapper' ? 0.035 : L.dress ? 0.045 : 0.01;
  c.moveTo(X(-sx + lean), Y(top)); c.lineTo(X(sx + lean), Y(top));
  c.lineTo(X(sx * 0.82 + lean * 0.5), Y(hipY + 0.05)); c.lineTo(X(sx * 0.9 + flare + swingHem * d), Y(hem)); c.lineTo(X(-sx * 0.9 - flare + swingHem * d), Y(hem)); c.lineTo(X(-sx * 0.82 + lean * 0.5), Y(hipY + 0.05));
  c.closePath(); c.fill();
  if (!flat) {
    // a dress showing under a coat; the flapper's fringe + sash; a tux's white shirt front; the coat's lit side by day
    if (L.dress && L.coat !== 'none' && L.dress !== 'flapper' && J.pose !== 'sit') { c.fillStyle = f(cols.dress); c.fillRect(X(-sx * 0.85), Y(hem), (sx * 1.7) * H, Math.max(0.6, 0.035 * H)); }
    if (L.dress === 'flapper' && L.coat === 'none') {
      c.fillStyle = f(cols.dress.map(v => Math.min(255, v * 1.15))); c.fillRect(X(-sx), Y(hipY + 0.02), sx * 2 * H, Math.max(0.5, 0.02 * H));
      c.strokeStyle = f(cols.dress.map(v => Math.min(255, v * 1.25))); c.lineWidth = Math.max(0.3, H * 0.006);
      c.beginPath(); for (let u = -sx - flare; u <= sx + flare; u += 0.018) { c.moveTo(X(u + swingHem * d), Y(hem + 0.03)); c.lineTo(X(u + swingHem * d * 2), Y(hem - 0.012)); } c.stroke();   // (one path: the fringe's ~18 strands)
    }
    if (L.tux) { c.fillStyle = f(cols.shirt, 1.2); c.beginPath(); c.moveTo(X(-0.03 + lean), Y(top)); c.lineTo(X(0.03 + lean), Y(top)); c.lineTo(X(lean * 0.6), Y(top - 0.13)); c.closePath(); c.fill(); }
    if (L.coat !== 'none' && side) { c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(X(-sx * 0.1 * d + lean * 0.7), Y(top - 0.05), Math.max(0.4, H * 0.012), (top - 0.05 - hem) * H * 0.95); }
    if (cols.scarf && L.coat !== 'none') { c.fillStyle = f(cols.scarf); c.beginPath(); c.ellipse(X(lean), Y(top - 0.005), sx * H * 0.92, H * 0.026, 0, 0, TAU); c.fill(); if (side) c.fillRect(X(-d * 0.05 + lean), Y(top - 0.005), Math.max(0.6, 0.03 * H), 0.13 * H); }
    // THE DAY'S LIGHT (FP3a, note 3): a LIT side + a SHADE side across the whole torso from the real sun (warm at golden hour), over
    // the cloth's own colour — the torso's path filled again with a gradient, so it stays inside the figure
    const sun = sunSide(env);
    if (sun) {
      const g = c.createLinearGradient(X(-sx * sun.s + lean), 0, X(sx * sun.s + lean), 0);
      g.addColorStop(0, `rgba(${sun.hi},${(0.26 * sun.k).toFixed(3)})`); g.addColorStop(0.45, `rgba(${sun.hi},0)`); g.addColorStop(0.62, 'rgba(24,20,44,0)'); g.addColorStop(1, `rgba(24,20,44,${(0.3 * sun.k).toFixed(3)})`);
      c.fillStyle = g; c.beginPath();
      c.moveTo(X(-sx + lean), Y(top)); c.lineTo(X(sx + lean), Y(top));
      c.lineTo(X(sx * 0.82 + lean * 0.5), Y(hipY + 0.05)); c.lineTo(X(sx * 0.9 + flare + swingHem * d), Y(hem)); c.lineTo(X(-sx * 0.9 - flare + swingHem * d), Y(hem)); c.lineTo(X(-sx * 0.82 + lean * 0.5), Y(hipY + 0.05));
      c.closePath(); c.fill();
    }
  }
  // the near leg (a walker's; sitting: both visible under the coat's hem)
  leg(0, legCol, legW);
  // the head + the neck, hair, hat
  const hx = J.head[0] + lean * 1.3, hy = J.head[1], hr = 0.066;
  c.fillStyle = f(cols.skin, 0.9); c.fillRect(X(hx - 0.022), Y(hy - hr * 0.6), 0.044 * H, 0.06 * H);
  c.beginPath(); c.arc(X(hx), Y(hy), hr * H, 0, TAU); c.fill();
  if (side && !flat) { c.beginPath(); c.moveTo(X(hx + d * hr * 0.9), Y(hy + 0.005)); c.lineTo(X(hx + d * hr * 1.25), Y(hy - 0.012)); c.lineTo(X(hx + d * hr * 0.85), Y(hy - 0.025)); c.fill(); }   // (the nose in profile)
  // THE HAIR (FP3a, note 3 — it never drew from behind: the facing wasn't passed): walking away (dir 0) the back of the head is hair;
  // in profile the back of the head under the hat; a woman without a cloche her bob
  if (!flat) {
    c.fillStyle = f(cols.hair);
    if (J.face === 0 && J.pose !== 'sit') { c.beginPath(); c.arc(X(hx), Y(hy), hr * H, 0, TAU); c.fill(); }
    else if (side && !L.woman) { c.save(); c.beginPath(); c.arc(X(hx), Y(hy), hr * H * 1.01, 0, TAU); c.clip(); c.fillRect(Math.min(X(hx - d * hr * 1.1), X(hx - d * hr * 0.15)), Y(hy + hr), hr * 0.95 * H, hr * 1.25 * H); c.restore(); }
  }
  if (L.woman && L.hat !== 'cloche') { c.fillStyle = f(cols.hair); c.beginPath(); c.arc(X(hx - (side ? d * 0.012 : 0)), Y(hy + 0.012), hr * 1.05 * H, Math.PI * 0.95, Math.PI * 2.05); c.fill(); c.fillRect(X(hx - hr * 1.05), Y(hy + 0.005), hr * 2.1 * H, 0.04 * H); }
  // the head's own light by day: the lit cheek + the shaded one (the same sun as the torso)
  if (!flat) { const sun = sunSide(env); if (sun) { const g = c.createLinearGradient(X(hx - hr * sun.s), 0, X(hx + hr * sun.s), 0); g.addColorStop(0, `rgba(${sun.hi},${(0.24 * sun.k).toFixed(3)})`); g.addColorStop(0.5, `rgba(${sun.hi},0)`); g.addColorStop(0.55, 'rgba(30,20,40,0)'); g.addColorStop(1, `rgba(30,20,40,${(0.3 * sun.k).toFixed(3)})`); c.fillStyle = g; c.beginPath(); c.arc(X(hx), Y(hy), hr * H, 0, TAU); c.fill(); } }
  hat(c, L, X, Y, H, hx, hy, hr, d, side, f);
  // THE BRIM'S SHADOW across the face (FP3a, note 3 — no drawn features: the hat's shade reads as a face under it), by day + at dusk
  if (!flat && L.hat && BRIM[L.hat] != null) { const k = sunSide(env, true); if (k > 0.05) { const by = BRIM[L.hat]; c.save(); c.beginPath(); c.arc(X(hx), Y(hy), hr * H * 1.01, 0, TAU); c.clip(); c.fillStyle = `rgba(26,18,30,${(0.42 * k).toFixed(3)})`; c.fillRect(X(hx - hr * 1.2), Y(hy + hr * by), hr * 2.4 * H, hr * 0.55 * H); c.restore(); } }
  // the near arm (+ what it carries)
  const hand = side ? armP(0, sleeve, 0.062) : (armP(0, sleeve, 0.062), armP(1, sleeve, 0.062));
  if (!flat && L.carry && !['point', 'wave', 'toast', 'dance', 'garden'].includes(J.pose)) carry(c, L.carry, hand, H, f, d);
  if (!flat && J.pose === 'toast') { const [gx, gy] = hand; c.fillStyle = 'rgba(236,226,190,0.9)'; c.beginPath(); c.moveTo(gx - H * 0.03, gy - H * 0.05); c.lineTo(gx + H * 0.03, gy - H * 0.05); c.lineTo(gx, gy - H * 0.015); c.closePath(); c.fill(); c.fillRect(gx - 0.25, gy - H * 0.015, 0.5, H * 0.03); }
  if (!flat && L.umbrella && J.pose !== 'sit') { const [ux, uy] = hand; c.strokeStyle = f([30, 26, 24]); c.lineWidth = Math.max(0.5, H * 0.012); c.beginPath(); c.moveTo(ux, uy); c.lineTo(ux, Y(1.18)); c.stroke(); c.fillStyle = f(L.umbrella); c.beginPath(); c.ellipse(ux, Y(1.18), H * 0.3, H * 0.12, 0, Math.PI, 0); c.fill(); }
}
// the brim's line on the head (in head radii above its centre) per hat — the band under it is in shade
const BRIM = { fedora: 0.55, top: 0.6, boater: 0.6, cloche: 0.18, flatcap: 0.62, newsboy: 0.62 };
/** the sun's side on a figure by day: { s (±1: the lit side's sign on screen), k (strength), hi (the lit tint) } or null; daylight
 *  only (k > 0) with `level` — the scene's daylight share (the brim's shade: soft light from above even under a deck) */
function sunSide(env, level = false) {
  const T = env.T || {}, day = clamp01((T.day || 0) + (T.gold || 0)) * (1 - clamp01(env.dark || 0));
  if (level) return day;
  if (day < 0.15) return null;
  const sd = T.sunDir || 0, ovc = T.ovc || 0;
  const s = Math.abs(sd) > 0.05 ? (sd > 0 ? 1 : -1) : -1, k = day * (1 - 0.7 * ovc) * (Math.abs(sd) > 0.05 ? 1 : 0.6);
  return k > 0.05 ? { s: -s, k, hi: (T.gold || 0) > 0.3 ? '255,206,150' : '255,242,220' } : null;
}
/** THE RIM's shapes (night): the head, the hat's crown + brim, the top of the shoulders — one colour (FP3a: head + shoulders only) */
function rimUpper(c, J, L, X, Y, H, col) {
  const lean = J.lean * J.d, top = J.sh[1] + 0.01, sx = J.side ? 0.1 : 0.138, hx = J.head[0] + lean * 1.3, hy = J.head[1], hr = 0.066;
  c.fillStyle = col;
  c.beginPath(); c.moveTo(X(-sx + lean), Y(top)); c.lineTo(X(sx + lean), Y(top)); c.lineTo(X(sx * 0.95 + lean), Y(top - 0.11)); c.lineTo(X(-sx * 0.95 + lean), Y(top - 0.11)); c.closePath(); c.fill();
  c.beginPath(); c.arc(X(hx), Y(hy), hr * H, 0, TAU); c.fill();
  if (L.hat) hat(c, L, X, Y, H, hx, hy, hr, J.d, J.side, () => col);
}
function hat(c, L, X, Y, H, hx, hy, hr, d, side, f) {
  const k = L.cols.hat;
  if (!L.hat) return;
  c.fillStyle = f(k);
  if (L.hat === 'fedora') { c.fillRect(X(hx - hr * 1.6), Y(hy + hr * 0.55), hr * 3.2 * H, Math.max(0.6, 0.016 * H)); c.beginPath(); c.moveTo(X(hx - hr * 0.95), Y(hy + hr * 0.55)); c.lineTo(X(hx - hr * 0.8), Y(hy + hr * 1.45)); c.lineTo(X(hx + hr * 0.8), Y(hy + hr * 1.5)); c.lineTo(X(hx + hr * 0.95), Y(hy + hr * 0.55)); c.fill(); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(X(hx - hr * 0.92), Y(hy + hr * 0.8), hr * 1.84 * H, Math.max(0.4, 0.012 * H)); }
  else if (L.hat === 'top') { c.fillRect(X(hx - hr * 1.4), Y(hy + hr * 0.6), hr * 2.8 * H, Math.max(0.6, 0.014 * H)); c.fillRect(X(hx - hr * 0.8), Y(hy + hr * 2.1), hr * 1.6 * H, hr * 1.5 * H); }
  else if (L.hat === 'boater') { c.fillStyle = f([214, 196, 150]); c.fillRect(X(hx - hr * 1.5), Y(hy + hr * 0.6), hr * 3 * H, Math.max(0.6, 0.014 * H)); c.fillRect(X(hx - hr * 0.85), Y(hy + hr * 1.25), hr * 1.7 * H, hr * 0.65 * H); c.fillStyle = f([40, 40, 52]); c.fillRect(X(hx - hr * 0.85), Y(hy + hr * 0.82), hr * 1.7 * H, Math.max(0.4, hr * 0.22 * H)); }
  else if (L.hat === 'cloche') { c.beginPath(); c.arc(X(hx), Y(hy + hr * 0.15), hr * 1.16 * H, Math.PI, 0); c.fill(); c.fillRect(X(hx - hr * 1.25), Y(hy + hr * 0.18), hr * 2.5 * H, Math.max(0.5, hr * 0.3 * H)); }
  else if (L.hat === 'newsboy' || L.hat === 'flatcap') { c.beginPath(); c.ellipse(X(hx + (side ? d * hr * 0.15 : 0)), Y(hy + hr * 0.6), hr * 1.18 * H, hr * 0.62 * H, 0, Math.PI, 0); c.fill(); c.fillRect(X(hx + (side ? (d > 0 ? hr * 0.3 : -hr * 1.5) : -hr * 0.9)), Y(hy + hr * 0.62), (side ? hr * 1.2 : hr * 1.8) * H, Math.max(0.5, 0.012 * H)); }
  else if (L.hat === 'band') { c.fillStyle = f([210, 180, 90]); c.fillRect(X(hx - hr), Y(hy + hr * 0.62), hr * 2 * H, Math.max(0.5, hr * 0.25 * H)); c.fillStyle = f([236, 230, 220]); c.beginPath(); c.ellipse(X(hx + hr * 0.6), Y(hy + hr * 1.3), Math.max(0.5, hr * 0.18 * H), hr * 0.65 * H, 0.4, 0, TAU); c.fill(); }
}
function carry(c, what, [hx, hy], H, f, d) {
  if (what === 'case') { c.fillStyle = f([66, 44, 30]); c.fillRect(hx - H * 0.06, hy, H * 0.12, H * 0.08); }
  else if (what === 'pail') { c.fillStyle = f([120, 120, 126]); c.fillRect(hx - H * 0.035, hy + H * 0.01, H * 0.07, H * 0.06); }
  else if (what === 'purse') { c.fillStyle = f([70, 40, 44]); c.beginPath(); c.ellipse(hx, hy + H * 0.03, H * 0.035, H * 0.025, 0, 0, TAU); c.fill(); }
  else if (what === 'papers') { c.fillStyle = f([220, 214, 196]); c.fillRect(hx - H * 0.02 * d - H * 0.03, hy - H * 0.06, H * 0.05, H * 0.1); }
}

/** a DOG at (x, z) trotting with its walker (dir ±1, dist: its own stride), or sitting (pose) → its collar on screen (the leash) */
export function drawDog(c, cam, st, L, env, yUp = 0) {
  const [fx, fy] = project(cam, st.x, yUp, st.z), s = cam.F / st.z, H = 0.62 * L.dogSize * s, d = st.dir === -1 ? -1 : 1, X = u => fx + u * H * d, Y = v => fy - v * H;
  if (fx + H < 0 || fx - H > cam.W) return [fx, fy];
  const lampK = clamp01(env.dark || 0), dark = Math.max(lampK, clamp01((env.T && env.T.night) || 0)), lt = env.lightAt ? env.lightAt(st.x, st.z) : null;
  let col = L.dog; if (dark > 0.01) { col = mix(col, [18, 16, 28], 0.74 * dark); if (lt) { const q = Math.min(1, 160 / Math.max(1, lt[0], lt[1], lt[2])); col = col.map((v, i) => Math.min(255, v + lt[i] * q * 0.17 * lampK)); } }
  c.fillStyle = `rgba(8,6,16,${(0.3 + 0.15 * dark).toFixed(3)})`; c.beginPath(); c.ellipse(fx, fy, H * 0.65, H * 0.08, 0, 0, TAU); c.fill();
  const p = st.v > 0.05 ? (st.dist / 0.9) % 1 : 0, trot = st.v > 0.05 ? 1 : 0;
  c.strokeStyle = rgb(col.map(v => v * 0.8)); c.lineWidth = Math.max(0.6, H * 0.09); c.lineCap = 'round';
  for (const [bx, ph] of [[-0.42, 0], [0.38, 0.5], [-0.32, 0.5], [0.28, 0]]) { const sw = trot * Math.sin((p + ph) * TAU) * 0.16; c.beginPath(); c.moveTo(X(bx), Y(0.42)); c.lineTo(X(bx + sw), Y(0.02)); c.stroke(); }
  c.fillStyle = rgb(col); c.beginPath(); c.ellipse(X(0), Y(0.52), H * 0.5, H * 0.17, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(X(0.55), Y(0.72), H * 0.16, H * 0.14, 0, 0, TAU); c.fill();                      // the head
  c.beginPath(); c.ellipse(X(0.7), Y(0.68), H * 0.1, H * 0.06, 0, 0, TAU); c.fill();                       // the muzzle
  c.beginPath(); c.moveTo(X(0.5), Y(0.82)); c.lineTo(X(0.46), Y(0.98)); c.lineTo(X(0.58), Y(0.84)); c.fill();   // an ear
  const wag = env.mo !== false ? Math.sin((env.t || 0) * 11 + st.x) * 0.08 : 0;
  c.strokeStyle = rgb(col); c.lineWidth = Math.max(0.6, H * 0.07); c.beginPath(); c.moveTo(X(-0.48), Y(0.58)); c.quadraticCurveTo(X(-0.66), Y(0.78 + wag), X(-0.62), Y(0.92 + wag)); c.stroke();
  return [X(0.48), Y(0.62)];
}
/** the leash: a gently sagging line from the hand to the collar */
export function drawLeash(c, a, b, env) {
  const dark = clamp01(env.dark || 0);
  c.strokeStyle = dark > 0.5 ? 'rgba(10,8,16,0.9)' : 'rgba(40,30,26,0.85)'; c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 2, b[0], b[1]); c.stroke();
}
