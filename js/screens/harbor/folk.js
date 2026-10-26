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
import { GEAR, gearCart } from './gear.js';
import { LADDER, HANDS, liftSq, raiseK, railAhead } from '../../core/harbor-crew.js';
import { safeCtx } from '../../ui/canvas-safe.js';

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
const SIT_COATS = [[52, 66, 112], [58, 104, 82], [132, 50, 62], [84, 98, 124], [168, 170, 176], [216, 206, 178], [70, 112, 140]];
const SIT_LEGS = [[70, 74, 92], [96, 98, 108], [52, 56, 78]];
const DOGS = [[120, 82, 50], [36, 32, 34], [214, 196, 160], [170, 120, 66], [236, 232, 224]];

/** 8b1 — the workers' uniforms: coat ('long' | 'short' | 'none'), hat, colours (c coat, l legs, h hat, s shirt, d dress), trim (brass
 *  buttons / a badge), vest (a waistcoat), apron, overalls */
// 8b2 — THE WORKERS' QUALITY PASS (the owner: "distinct period work clothes per trade"): each trade reads at ~27 pt by its HAT's silhouette
// first (the cop's tall custodian helmet, the white wing's white pith helmet, the milkman's white peaked cap, the painters' soft white
// caps, the flat caps of the trades), then its cloth (white for the milk, the street + the barber; navy serge for the law; spattered
// white for the painters; denim bibs; leather) and one detail (a belt + buckle, a bow tie, an apron's bib + ties, work gloves)
const WORKWEAR = {
  milkman: { coat: 'short', hat: 'peaked', c: [236, 234, 224], l: [58, 60, 74], h: [240, 238, 230], trim: [70, 76, 96], bow: [40, 44, 70], belt: [52, 46, 42] },
  sweeper: { coat: 'short', hat: 'pith', c: [238, 238, 232], l: [232, 232, 226], h: [244, 244, 238], trim: [190, 190, 186], belt: [176, 170, 160], gloves: [214, 208, 196] },
  cop: { coat: 'long', hat: 'helmet', c: [34, 42, 86], l: [30, 36, 70], h: [26, 32, 62], trim: [226, 190, 96], badge: true, carry: 'baton', belt: [28, 22, 20], gloves: [226, 224, 216] },
  mailman: { coat: 'short', hat: 'peaked', c: [98, 110, 132], l: [84, 94, 114], h: [82, 92, 112], trim: [210, 190, 120], carry: 'mailbag', belt: [70, 52, 36] },
  barber: { coat: 'short', hat: null, c: [240, 238, 230], l: [48, 46, 54], trim: [40, 40, 52], bow: [30, 30, 40] },
  painter: { coat: 'none', hat: 'painter', s: [232, 228, 212], l: [230, 224, 208], h: [236, 232, 220], overalls: true, spatter: true },
  washer: { coat: 'none', hat: 'flatcap', s: [196, 200, 204], l: [64, 84, 120], h: [60, 64, 70], overalls: true },
  billposter: { coat: 'short', hat: 'flatcap', c: [118, 96, 70], l: [70, 66, 62], h: [84, 70, 58], apron: [218, 210, 190], spatter: 'paste' },
  iceman: { coat: 'none', hat: 'flatcap', s: [196, 190, 176], l: [70, 66, 60], h: [90, 76, 60], apron: [110, 76, 48], gloves: [92, 64, 40] },
  trashman: { coat: 'short', hat: 'flatcap', c: [74, 72, 62], l: [64, 62, 58], h: [56, 54, 50], gloves: [120, 96, 64], belt: [40, 34, 30] },
  repairman: { coat: 'none', hat: 'flatcap', s: [196, 186, 160], l: [58, 76, 112], h: [58, 74, 108], overalls: true, belt: [70, 52, 36] },
  bootlegger: { coat: 'short', hat: 'flatcap', c: [46, 44, 50], l: [40, 40, 46], h: [36, 36, 42], gloves: [36, 30, 28], collar: true },
  lookout: { coat: 'long', hat: 'fedora', c: [62, 58, 56], l: [44, 44, 50], h: [40, 38, 42] },
  flowers: { woman: true, coat: 'short', hat: null, c: [124, 62, 72], d: [92, 80, 110], carry: 'flowers' },
  musician: { coat: 'long', hat: 'fedora', c: [30, 30, 38], l: [26, 26, 32], h: [26, 26, 32], carry: 'bass' },
  staff: { coat: 'none', hat: null, s: [238, 234, 224], l: [30, 30, 36], vest: [40, 34, 40] },
};
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
  if (name === 'newsboy' || name === 'kid') { kid = true; woman = false; }
  const L = { woman, kid, coat: cold ? 'long' : summer ? 'none' : r() < 0.6 ? 'long' : 'short', dress: woman ? 'day' : null, hat: null, carry: null, jog: false,
    cols: { coat: pick(r, COATS), legs: pick(r, TROUSERS), hat: pick(r, FELT),
      skin: pick(r, SKIN), hair: pick(r, HAIR), shirt: pick(r, SUMMER), dress: pick(r, DRESSES), scarf: cold && r() < 0.7 ? pick(r, SCARVES) : null } };
  L.hat = woman ? (r() < 0.75 ? 'cloche' : null) : summer && r() < 0.5 ? 'boater' : r() < 0.8 ? 'fedora' : 'flatcap';
  if (woman && L.hat === 'cloche') L.cols.hat = pick(r, [[120, 64, 80], [60, 60, 84], [150, 120, 80], [40, 40, 48], [170, 80, 70]]);
  if (name === 'commuter') { L.carry = r() < 0.55 ? (woman ? 'purse' : 'case') : 'papers'; if (!woman) L.hat = summer ? 'boater' : 'fedora'; }
  if (name === 'lady') L.carry = 'purse';
  if (name === 'worker' || name === 'nightworker') { L.hat = 'flatcap'; L.coat = 'short'; L.carry = 'pail'; L.cols.coat = pick(r, [[70, 84, 112], [112, 96, 74], [88, 88, 90]]); L.dress = null; L.woman = false; }
  if (name === 'jogger') { L.jog = true; L.coat = 'none'; L.dress = null; L.woman = false; L.hat = r() < 0.5 ? 'flatcap' : null; L.cols.shirt = pick(r, [[214, 210, 200], [120, 40, 44], [44, 60, 96], [90, 90, 96]]); L.cols.legs = pick(r, [[180, 170, 150], [60, 60, 66], [214, 210, 200]]); L.scarf = null; L.cols.scarf = null; }
  // (POLISH 5 — the kid who runs through the hydrant's spray: summer things, no coat, a flat cap)
  if (name === 'kid') { L.coat = 'none'; L.dress = null; L.hat = r() < 0.6 ? 'flatcap' : null; L.cols.shirt = pick(r, [[236, 232, 220], [120, 160, 210], [214, 120, 90]]); L.cols.legs = pick(r, [[110, 96, 80], [70, 80, 110]]); L.scarf = null; L.cols.scarf = null; L.carry = null; }
  if (name === 'newsboy') { L.hat = 'newsboy'; L.coat = 'short'; L.carry = 'papers'; L.cols.coat = pick(r, [[130, 108, 80], [100, 94, 86], [116, 92, 66]]); L.cols.legs = [116, 104, 86]; }
  if (name === 'guest' || (party && (name === 'couple' || name === 'stroll'))) {
    if (L.woman) { L.dress = party || r() < 0.4 ? 'flapper' : 'day'; L.cols.dress = pick(r, L.dress === 'flapper' ? FLAPPER : DRESSES); L.hat = L.dress === 'flapper' ? (r() < 0.5 ? 'band' : null) : 'cloche'; L.coat = cold && !party ? 'long' : 'none'; L.carry = 'purse'; }
    else { L.cols.coat = pick(r, [[22, 22, 28], [30, 30, 38], [44, 40, 46]]); L.cols.legs = [24, 24, 30]; L.hat = party && r() < 0.3 ? 'top' : 'fedora'; L.cols.hat = [24, 22, 28]; L.coat = cold ? 'long' : 'short'; L.cols.shirt = [236, 232, 222]; L.tux = true; }
  }
  if (name === 'night') { L.cols.coat = pick(r, [[58, 58, 70], [74, 66, 60], [52, 62, 84]]); L.coat = 'long'; if (!L.woman) L.hat = 'fedora'; }
  // (POLISH 4 — THE DOORMAN at the side door on party nights: a big man in a long dark overcoat, a dark fedora, gloves — broad, still)
  if (name === 'doorman') { L.woman = false; L.dress = null; L.coat = 'long'; L.hat = 'fedora'; L.carry = null; L.cols.coat = [52, 58, 96]; L.cols.legs = [30, 30, 40]; L.cols.hat = [26, 26, 34]; L.cols.scarf = null; L.scarf = null; }
  // 8b1 — THE WORKERS' CLOTHES (period uniforms that read by colour + shape at ~27 pt): the white-wing sweeper all in white, the milkman's
  // white jacket + cap, the beat cop's navy tunic + peaked cap, the mailman's grey-blue, the barber's white jacket, the painters' white
  // overalls, the iceman's leather apron, the bootleggers in dark caps, the bar staff in shirt-sleeves + waistcoats
  const W8 = WORKWEAR[name];
  if (W8) { L.woman = !!W8.woman; L.dress = W8.woman ? 'day' : null; L.coat = W8.coat; L.hat = W8.hat; L.carry = W8.carry || null; L.scarf = null; L.cols.scarf = null;
    if (W8.c) L.cols.coat = W8.c; if (W8.l) L.cols.legs = W8.l; if (W8.h) L.cols.hat = W8.h; if (W8.s) L.cols.shirt = W8.s; if (W8.d) L.cols.dress = W8.d; L.trim = W8.trim || null; L.vest = W8.vest || null; L.apron = W8.apron || null; L.overalls = !!W8.overalls; L.badge = !!W8.badge;
    L.bow = W8.bow || null; L.belt = W8.belt || null; L.gloves = W8.gloves || null; L.spatter = W8.spatter || null; L.collar = !!W8.collar; L.worker = name; }
  // 11a-1 — THE PEOPLE OF THE HOLIDAYS (core/harbor-holidayfolk.js): Halloween's trick-or-treaters (their costumes) + their grown-up, the
  // costume party's zombies, the Day of the Dead procession (Catrinas, candles, marigolds, photos, the mariachi trio, the ofrenda's bearers)
  if (name === 'trick') trickLook(L, r, o.m || {});
  if (name === 'zombie') zombieLook(L, r, o.m || {});
  if (name === 'proc') procLook(L, r, o.m || {});
  if (o.hween && name === 'guest') partyCostume(L, r);
  if (L.woman && L.coat === 'long') L.dress = L.dress || 'day';
  // (FP3b, the owner after FP3a: people ON THE BENCH blended into its wood at noon — a sitter wears cloth AWAY from the oak's browns:
  // navy, bottle green, burgundy, slate, dove grey, a cream mac; grey / navy trousers)
  if (o.sit) { L.cols.coat = pick(r, SIT_COATS); L.cols.legs = pick(r, SIT_LEGS); if (L.coat === 'none') L.coat = 'short'; if (L.woman) L.cols.dress = pick(r, SIT_COATS); }
  L.h = L.hh || (L.kid ? 0.72 : name === 'doorman' ? 1.1 : (L.woman ? 0.95 : 1.02) * (0.95 + r() * 0.08));
  // (9a: mostly BLACK umbrellas, a few colours — readable as shapes; without one, some hold a NEWSPAPER over the head; in a strong wind a
  // hand goes to the hat)
  L.umbrella = (o.rain || 0) > 0.3 && !L.jog && r() < 0.74 ? pick(r, [[28, 28, 34], [28, 28, 34], [30, 30, 36], [26, 24, 30], [150, 36, 42], [44, 62, 110], [190, 150, 54], [80, 50, 96]]) : null;
  L.paper = (o.rain || 0) > 0.3 && !L.umbrella && !L.jog && !kid && r() < 0.65;
  L.holdHat = (o.wind || 0) > 10 && !!L.hat && !L.umbrella && !L.paper && r() < 0.6;
  L.dog = pick(r, DOGS); L.dogSize = 0.75 + r() * 0.5;
  L.stride = 0.94 + r() * 0.12;   // (PEO: a little longer or shorter in the step, per person)
  return L;
}

// ------------------------------------------------------------------ THE BODY — ONE 2.5-D RIG (FP3b, the owner's 8P notes 1 + 2)
// Every joint lives in the figure's own frame — a (FORWARD along its heading), b (LATERAL: +b is the side deeper at hd 0), y (UP) —
// in body heights, and ONE projection draws every facing: screen x = a·cos hd − b·sin hd; depth = a·sin hd + b·cos hd. So walking
// across the screen is side-on, a diagonal a 3/4 view, toward us the front, away the back, and a turn (core/harbor-people.js#lerpHd)
// sweeps continuously through them. Depth does two things: the far limbs are a shade darker + drawn first, and a joint further away
// sits a little higher on screen (the ground's slope at that distance — kD) — so a front walker's stride reads, and the planted foot
// stays put on the ground in x AND y (the stride is locked to the distance walked; tests/harbor-people.test.mjs on a diagonal).
// THE WALK (keyed like a classic 8-pose cycle: contact · down · passing · up, per leg): the stance foot planted (a duty factor of 0.6),
// the STANCE LEG STRAIGHT (the owner after FP3a: "they look like they're squatting" — the leg is exactly the hip's height: standing +
// contact poses have straight legs), the hip riding over it like a pendulum (a small bob, highest at mid-stance), the knee bending
// only on the swing leg (most at the passing pose, ~50°), the pelvis + the shoulders counter-rotating a little, the arms opposite the
// legs. THE JOG: its own cycle — a short stance with a flexed knee, a flight phase (both feet up, the hip highest), the heel kicked up
// behind in the swing, the arms bent ~90° pumping, a forward lean.
const LEG = 0.47, ANKLE = 0.03, HIP0 = ANKLE + LEG, HALF = LEG / 2, HR = 0.066;
export const GAIT = Object.freeze({
  walk: { stance: 0.6, lift: 0.08, bob: 0.3, hip: 0.1, sh: 0.13, arm: 0.42, bend: 0.25 },
  jog: { stance: 0.38, lift: 0.19, bob: 0, hip: 0.12, sh: 0.18, arm: 0.62, bend: 1.62, kick: 0.55, sink: 0.05, rise: 0.025 },
});
const smooth = u => u * u * (3 - 2 * u);
/** 8b2 — the loads: on the shoulder (one hand up on it) vs heavy in the hand (that arm straight, no swing) */
const SHOULDER = new Set(['ice', 'crate', 'can', 'ladder', 'steps', 'ladderA', 'ladderB', 'kit']);
const HAND_HEAVY = new Set(['bottles', 'bucket', 'bundle', 'paste']);
/** 8b2 — the tall ladder rides the FAR shoulder (the far hand up on it; the carrier walks in front of it — his head never behind it) */
const FAR_SH = new Set(['ladderA', 'ladderB']);
/** a person's step (body heights) at their speed v (units/s). PEO (Oct 25, measured against real walking): the step grows with the
 *  square root of the speed (≈ 0.65 m · √v — 1 unit = 0.83 m): a stroll at 1 m/s ≈ 0.65 m (92 steps a minute), a walk at 1.3 ≈ 0.74 m
 *  (105), a brisk 1.5 ≈ 0.80 m (112), a jog at 2.6 ≈ 1.05 m (150) — in the person's OWN height, so a kid's step is shorter + quicker;
 *  ± 6 % per person (L.stride). Before: 0.35 at every speed — a stroll took a brisk walk's step (74 a minute), the brisk shuffled at 138. */
export const STEP = (L, v) => { const vv = v > 0.3 ? v : L.jog ? 3.1 : 1.3; return Math.max(0.28, Math.min(0.62, 0.338 * Math.sqrt(vv) * (L.stride || 1) / Math.sqrt(L.h || 1))); };
/** one stride (two steps) in world units at speed v — folk.js's phase + people.js's per-frame integration share it */
/** SP3 (the owner): every person on the promenade ~9 % bigger against the doors, the bench, the lamps + the cart — the drawn body
 *  (2.1 units = 1.75 m before) × FOLK_SCALE; their stride + their reach scale with it */
export const FOLK_SCALE = 1.09;
export const BODY_H = 2.1 * FOLK_SCALE;
export const strideLen = (L, v) => 2 * STEP(L, v) * BODY_H * (L.h || 1);
const headingOf = st => (st.hd != null ? st.hd : st.dir === 1 ? 0 : st.dir === -1 ? Math.PI : st.dir === 2 ? Math.PI / 2 : -Math.PI / 2);

/**
 * The joints for a state (PURE): st = { pose, hd (or the old dir), dist, v, link }; t: the clock (s) for the idle motions; mo: motion
 * on; kD: [the depth → screen-height slope at the ground, its fall with height] (rigOf passes the camera's). → J with every joint
 * already ON SCREEN in body heights from the figure's ground point (x right, y up): feet, knees, hips, hip (centre), shs, sh (centre),
 * elbows, hands, head; D (each limb's depth: legs / arms), cx / cz (the heading's cos / sin), d (the side it faces on screen), side
 * (profile-ish), tw (the torso's half width on screen), planted (each foot), heel (each heel's rise 0..1).
 */
export function jointsOf(st, L, t, mo = true, kD = [0.28, 0.04]) {
  const hd = headingOf(st), cx = Math.cos(hd), cz = Math.sin(hd), pose = st.pose || 'walk', jog = (!!L.jog || !!st.run) && st.v > 2, G = jog ? GAIT.jog : GAIT.walk;   // (8b1: st.run — anyone RUNNING, the witnesses fleeing)
  // (a step in heights — a stride is two; FP3b: a relaxed 1920s pace takes SHORTER steps — a long step at a slow speed reads as a
  // slow-motion glide — so the cadence stays ~1.8 steps a second)
  // (8b2 — THE TALL LADDER: its two carriers walk IN STEP — their stride's phase from where they are along the street (the climber's a
  // ladder's gap back), a common stride; 'walkback' — lowering it, stepping BACKWARD at LADDER.vUp: the stride run in reverse)
  const back = pose === 'walkback', cr0 = st.carry != null ? st.carry : L.carry, wrap = v => ((v % 1) + 1) % 1;
  const vS = back ? LADDER.vUp : st.v, S = st.run ? STEP({ ...L, jog: true }, vS) : STEP(L, vS), SL = strideLen(st.run ? { ...L, jog: true } : L, vS);   // (PEO: the step at this speed)
  const walking = (pose === 'walk' && st.v > 0.05) || back, sync = walking && !back && st.x != null && (cr0 === 'ladderA' || cr0 === 'ladderB');
  const Ss = 0.338 * Math.sqrt(vS > 0.3 ? vS : 1.3);   // (the carriers' COMMON stride — not either man's own: they must stay in step)
  const p = !walking ? 0 : back ? wrap(-(st.since || 0) * LADDER.vUp / SL) : sync ? wrap((cx < 0 ? -1 : 1) * (st.x - (cr0 === 'ladderB' ? LADDER.gap : 0)) / (2 * Ss * BODY_H)) : wrap(st.dist / SL);
  const breath = mo ? 0.004 * Math.sin(t * 1.7 + L.h * 37) : 0;
  const sg = [-1, 1], A = G.stance * S;
  // 8b2 — THE WORKERS MOVE RIGHT: a LIFT with the knees ('pick' — down empty, up with it; 'set' — down with it, up empty; 'raise' — a
  // ladder hoisted from a squat to arms overhead): the knees bend, the back stays near straight, down over ~0.55 s, a beat, up over ~0.6
  // ('lower' — the tall ladder's end let down: the raise run backward; a SHOULDER load — a ladder, the kit — set down / lifted from the
  // cobbles: a deeper squat, the hands right down to it — the props follow the same curves: core/harbor-crew.js#liftSq / #raiseK)
  const hoist = pose === 'raise' || pose === 'lower', lift = pose === 'pick' || pose === 'set' || hoist;
  const sN = st.since == null ? 9 : st.since, lN = st.left == null ? 9 : st.left, uP = sN / Math.max(1e-3, sN + lN);
  const mir = pose === 'lower', sA = mir ? lN : sN, uA = mir ? 1 - uP : uP;
  const deep = lift && (hoist || cr0 === 'ladderA' || cr0 === 'ladderB' || cr0 === 'kit') ? 1.4 : 1;   // (the litter can is gripped at its rim: no deeper)
  let sq = 0, rk = 0;
  if (lift) {
    sq = hoist ? smooth(clamp01(sA / 0.5)) * (1 - smooth(clamp01((uA - 0.3) / 0.35))) : liftSq(sN, lN);
    if (hoist) rk = raiseK(uA);
    if (!mo) { sq = hoist ? 0 : 0.8; rk = hoist ? 1 : 0; }
  }
  // (what's carried — the leg's own prop, else the look's — and how: a load on the SHOULDER (one hand up steadying it), a heavy one in
  // the HAND (that arm straight, no swing), a light one swings with the walk; heavy loads lean the body + weigh the step down)
  const cr = st.carry != null ? st.carry : L.carry, onSh = SHOULDER.has(cr), inHand = HAND_HEAVY.has(cr), heavy = onSh || inHand;
  // ---- the legs (figure frame: a, b, y)
  const foot = [], hipJ = [], planted = [false, false], heel = [0, 0];
  let hipY = HIP0, lean = 0;
  for (let i = 0; i < 2; i++) {
    let fa = 0, fy = ANKLE;
    if (walking) {
      // (11a-1 — THE SHAMBLE: the steps uneven (the stiff leg follows sooner), the stiff one barely lifted — dragged)
      const q = (p + i * (L.zombie ? 0.42 : 0.5)) % 1, s = G.stance, lf = L.zombie ? (i === 1 ? 0.18 : 0.75) : 1;
      if (q < s) { fa = A - 2 * A * q / s; planted[i] = true; heel[i] = q > s - 0.14 ? (q - (s - 0.14)) / 0.14 : 0; fy = ANKLE + 0.02 * heel[i]; }
      else {
        const u = (q - s) / (1 - s);
        // (the swing: forward with a smooth start + stop; the foot lifts most just before the passing pose; the jog kicks the heel up behind)
        fa = -A + 2 * A * (jog ? Math.pow(smooth(u), 1.35) : smooth(u));
        fy = ANKLE + G.lift * lf * Math.sin(Math.PI * Math.pow(u, jog ? 0.55 : 0.7));
      }
    }
    foot.push({ a: fa, b: sg[i] * (walking ? 0.038 : 0.05), y: fy });
  }
  if (walking) {
    if (!jog) {
      // the pendulum: the hip as high as the straightest stance leg allows, half way back toward standing height (a gentle bob)
      let pend = HIP0;
      for (let i = 0; i < 2; i++) if (planted[i]) pend = Math.min(pend, ANKLE + Math.sqrt(Math.max(0, LEG * LEG - foot[i].a * foot[i].a)));
      // (11a-1: a kid's walk a little bouncier — the skip; a zombie lurches: the hip dropping hard onto the stiff leg, leaning on)
      hipY = HIP0 - (heavy ? 0.45 : L.skip ? 0.95 : L.zombie ? 0.8 : G.bob) * (HIP0 - pend) - (L.zombie && planted[1] ? 0.012 : 0);
      lean = heavy ? 0.045 : L.zombie ? 0.075 : 0.02;
    } else {
      // the run: the hip sinks through the stance (the knee flexes), rises into the flight
      let st0 = -1; for (let i = 0; i < 2; i++) if (planted[i]) st0 = i;
      const q = st0 >= 0 ? ((p + st0 * 0.5) % 1) / G.stance : 0;
      hipY = HIP0 - 0.035 + (st0 >= 0 ? -G.sink * Math.sin(Math.PI * q) : G.rise);
      lean = 0.075;
    }
  }
  if (pose === 'sit') hipY = 0.27;
  if (pose === 'garden') hipY = 0.36;
  if (lift) { foot[0] = { a: 0.075, b: -0.06, y: ANKLE }; foot[1] = { a: -0.05, b: 0.06, y: ANKLE + 0.012 * sq }; hipY = HIP0 - 0.215 * sq * deep; }
  // 8b1 — ON A LADDER: the feet on the rungs (just in front), climbing = the legs + arms trading rung by rung with the height gained;
  // working at a height one foot a rung up
  const onRungs = pose === 'climb' || ((pose === 'reach' || pose === 'paint') && (st.y || 0) > 0.3 && !st.plat);
  // (8b2 — RUNG BY RUNG, core/harbor-people.js#CLIMB: st.rung = { n, q }: one foot steps up a rung (a lifted arc) while the other stays on its
  // rung and sinks in the body's frame as he rises; the roles swap each rung, a beat's pause on each — never a glide)
  const R1 = 0.152;
  let climbQ = 0, climbStep = 0;
  if (onRungs) {
    if (pose === 'climb' && st.rung) {
      const q = st.rung.q, e = smooth(q), lead = smooth(clamp01(q * 1.25)), up = st.rung.up !== false;
      climbQ = e; climbStep = st.rung.n % 2;
      for (let i = 0; i < 2; i++) {
        const stepping = i === climbStep;
        // (up: the stepping foot from this rung to the one above; down: from this rung to the one below — mirrored)
        const yy = up ? (stepping ? 2 * R1 * lead - R1 * e : R1 * (1 - e)) : (stepping ? R1 - 2 * R1 * lead + R1 * e : R1 * e);
        foot[i] = { a: 0.06 + (stepping ? 0.03 * Math.sin(Math.PI * q) : 0), b: sg[i] * 0.05, y: ANKLE + Math.max(0, yy) };
      }
    } else for (let i = 0; i < 2; i++) foot[i] = { a: 0.06, b: sg[i] * 0.05, y: ANKLE + (i ? 0.14 : 0) };
    hipY = HIP0 - 0.01;
  }
  // (a dip on the beat — the dancers + the bobbing watchers: the knees give, the whole body drops a little; FP3b item 9)
  const bph = st.beatF != null ? ((st.beatF % 1) + 1) % 1 : mo ? (t * (st.bps || 2)) % 1 : 0.5;
  const dip = pose === 'wands' && st.moves ? st.moves.dip || 0 : pose === 'bob' ? 0.022 * (1 - bph) * (1 - bph) : 0;
  hipY -= dip;
  for (let i = 0; i < 2; i++) hipJ.push({ a: (walking ? G.hip * foot[i].a : 0) + (pose === 'garden' ? -0.04 : 0), b: sg[i] * 0.045, y: hipY });
  // the knees: two-segment IK in each leg's own plane, always bending FORWARD; sitting: the thighs forward along the seat
  const knee = [];
  for (let i = 0; i < 2; i++) {
    if (pose === 'sit') { foot[i] = { a: 0.25, b: sg[i] * 0.065, y: ANKLE }; knee.push({ a: 0.235, b: sg[i] * 0.06, y: 0.28 }); continue; }
    const h = hipJ[i], f = foot[i], dx = f.a - h.a, dy = f.y - h.y, dl = Math.hypot(dx, dy), l = Math.min(dl, LEG - 1e-4);
    // (11a-1: the zombie's stiff leg never bends — the knee on the straight line, swung from the hip)
    if (L.zombie && i === 1 && walking) { knee.push({ a: (h.a + f.a) / 2, b: (h.b + f.b) / 2, y: (h.y + f.y) / 2 }); continue; }
    const ang = Math.atan2(dy, dx) + Math.acos(clamp01(l / (2 * HALF)));
    knee.push({ a: h.a + Math.cos(ang) * HALF, b: (h.b + f.b) / 2, y: h.y + Math.sin(ang) * HALF });
  }
  // ---- the upper body: the shoulders (counter-rotating against the hips), the head; a forward lean tips the torso
  const shY = (pose === 'sit' ? 0.58 : pose === 'garden' ? 0.61 : HIP0 + 0.3 - 0.2 * sq * deep) + breath - dip, up = shY - hipY;
  let shA = lean * up, headA = lean * (up + 0.115);
  if (pose === 'garden') { shA = 0.12; headA = 0.17; }
  if (lift) { shA = 0.15 * sq; headA = 0.17 * sq; }
  const shJ = [0, 1].map(i => ({ a: shA - (walking ? G.sh * foot[i].a : 0), b: sg[i] * 0.11, y: shY - 0.015 }));
  const head = { a: headA, b: 0, y: shY + 0.115 + (pose === 'garden' ? -0.025 : 0) };
  // ---- the arms: arm(i, ang (from hanging down, + forward), bend (the elbow, + forward), out (lifted sideways))
  const elbow = [null, null], hand = [null, null], upA = 0.155, foreA = 0.15;
  const arm = (i, ang, bend, out = 0.06) => {
    const s0 = shJ[i], co = Math.cos(out), so = Math.sin(out);
    const e = { a: s0.a + Math.sin(ang) * upA * co, b: s0.b + sg[i] * so * upA, y: s0.y - Math.cos(ang) * upA * co };
    const a2 = ang + bend;
    elbow[i] = e; hand[i] = { a: e.a + Math.sin(a2) * foreA * co, b: e.b + sg[i] * so * foreA * 0.6, y: e.y - Math.cos(a2) * foreA * co };
  };
  const near = cx >= 0 ? 0 : 1, farA = 1 - near;                                   // (the arm nearer us — the one a pose uses)
  const idle = mo ? Math.sin(t * 0.9 + L.h * 11) * 0.04 : 0;
  for (let i = 0; i < 2; i++) {
    if (walking) { const sw = -G.arm * foot[i].a / (A || 1) * (heavy ? 0.55 : 1); arm(i, sw, jog ? G.bend : G.bend + Math.max(0, sw) * 0.4); }
    else arm(i, 0.1 + (i ? -idle : idle), 0.12);
  }
  // (8b2: a load on the shoulder — the near hand up on it; a heavy one in the hand — that arm straight down, a little out, no swing)
  if (onSh && (walking || pose === 'wait')) arm(FAR_SH.has(cr) ? farA : near, 2.62, 2.6, 0.14);
  else if (inHand && (walking || pose === 'wait')) arm(near, 0.06, 0.04, 0.2);
  // arm in arm (a couple strolling): the arm on the partner's side hooked, no swing (link: the side's sign, ±1)
  if (st.link === 1 || st.link === -1) arm(st.link > 0 ? 1 : 0, 0.5, 1.25, 0.32);
  const N = near, Fa = farA;
  if (pose === 'point') arm(N, 2.75, 0.05);
  if (pose === 'wave') { const w = mo ? Math.sin(t * 7) * 0.35 : 0; arm(N, 2.6 + w * 0.3, -0.5 + w, 0.3); }
  if (pose === 'watch') { arm(N, 1.0, 1.9); arm(Fa, 0.9, 1.6); }
  if (pose === 'chat') { const g = mo ? Math.sin(t * 2.3 + L.h * 5) : 0; arm(N, 0.7 + 0.25 * g, 1.1); }
  if (pose === 'lean') { arm(0, 1.3, 0.3); arm(1, 1.25, 0.35); headA += 0.03; }
  if (pose === 'cart' || pose === 'shop') arm(N, 0.55, 0.9);
  if (pose === 'sit') { arm(0, 0.5, 0.9); arm(1, 0.4, 0.9); }
  // (the watchers — FP3b item 9: CLAP on the beat — the hands meet on it, part between; BOB — a dip on the beat, the arms loose)
  if (pose === 'clap') { const k = Math.min(1, bph * 2.2); for (let i = 0; i < 2; i++) arm(i, 1.2, 1.0, 0.06 + 0.3 * k); }
  if (pose === 'bob') { const k = Math.sin(bph * Math.PI * 2); arm(0, 0.3 + 0.12 * k, 0.7); arm(1, 0.3 - 0.12 * k, 0.7); }
  // the roof's poses: a DANCE (a sway + the arms trading up / out on a slow count), a TOAST (the glass raised), the GARDENER bending
  let toast = 0;
  if (pose === 'dance') { const b = mo ? Math.sin(t * 3.4 + L.h * 9) : 0; shJ.forEach(s => { s.b += 0.02 * b; }); head.b += 0.03 * b; arm(N, 1.4 + 0.9 * Math.max(0, b), 0.6, 0.25); arm(Fa, 0.9 - 0.5 * b, 0.9, 0.2); }
  if (pose === 'toast') { toast = mo ? 0.5 + 0.5 * Math.sin(t * 0.6 + L.h * 3) : 1; arm(N, 1.2 + 1.5 * toast, 0.4); }
  if (pose === 'garden') { arm(0, 0.35, 0.2); arm(1, 0.25, 0.25); }
  if (lift) {
    if (hoist) for (let i = 0; i < 2; i++) arm(i, 0.45 + 2.3 * rk + 0.25 * sq, 0.3 - 0.15 * rk, 0.1);
    else {
      // (the arms from where the load is — the near hand up on a shoulder load as it comes down / goes up — to the load at the feet)
      const held = onSh && ((pose === 'set' && uP < 0.5) || (pose === 'pick' && uP >= 0.5)), lo = deep > 1 ? [0.35, 0.1, 0.12] : [0.72, 0.3, 0.18];
      for (let i = 0; i < 2; i++) { const a0 = held && i === (FAR_SH.has(cr0) ? 1 - near : near) ? [2.62, 2.6, 0.14] : [0.3, 0.12, 0.12]; arm(i, a0[0] + (lo[0] - a0[0]) * sq, a0[1] + (lo[1] - a0[1]) * sq, a0[2] + (lo[2] - a0[2]) * sq); }
    }
  }
  // 8b2 — THE TALL LADDER's moves (core/harbor-crew.js#tallLadder): WALKED UP / back hand over hand (the arms overhead on its rails),
  // PUSHED upright (the arms from overhead out to the front) / caught coming down, the fly HAULED up its rope hand over hand (a pull a
  // LADDER.pull — the fly rises pull by pull with it); THE STEPLADDER swung down off the shoulder + stood up ('upend' / back: 'lay'),
  // spread / folded (both hands at its top)
  // (POLISH 5 — THE HANDS ON THE RAILS, the C2 known issue: the ladder's angle is built from where the hands are — core/harbor-crew.js#ladderAt:
  // HANDS.up ahead, LADDER.hR up — so the arms now REACH that point (a two-bone IK in the body's own heights, this person's size), hand
  // over hand a little apart along the rail, instead of a fixed overhead angle that missed the rails by up to ~3 px)
  const reach = (i, ta, ty, out = 0.1) => { const s0 = shJ[i], dx = ta - s0.a, dy = ty - s0.y, d = Math.min(Math.hypot(dx, dy), (upA + foreA) * 0.999), ph = Math.atan2(dx, -dy);
    const be = Math.acos(clamp01((upA * upA + d * d - foreA * foreA) / (2 * upA * d))), ga = Math.acos(clamp01((foreA * foreA + d * d - upA * upA) / (2 * foreA * d))); arm(i, ph - be, be + ga, out); };
  if ((walking && cr0 === 'walkup') || back) { const Hb = BODY_H * (L.h || 1), sw = walking ? 0.03 * Math.sin(p * Math.PI * 2) : 0; for (let i = 0; i < 2; i++) reach(i, HANDS.up / Hb + (i ? sw : -sw), LADDER.hR / Hb + (i ? -sw : sw) * 0.6); }
  // (9a — POLISH 5's known issue: the push upright / the catch / the haul kept FIXED arm angles; now the hands REACH the rails as the
  // ladder turns (core/harbor-crew.js#railAhead — the same eased turn the ladder makes) and the rope as he hauls, hand over hand)
  if (pose === 'push' || pose === 'catch') { const kk = pose === 'push' ? uP : 1 - uP, k = smooth(kk), Hb = BODY_H * (L.h || 1); shJ.forEach(q => { q.a += 0.03 * k; }); head.a += 0.03 * k;
    for (let i = 0; i < 2; i++) { const y = LADDER.hR + (1.55 - LADDER.hR) * k + (i === near ? 0 : -0.12); reach(i, railAhead(y, kk) / Hb, y / Hb); } }
  if (pose === 'haul') { const c8 = Math.cos((mo ? sN : 0) / LADDER.pull * Math.PI), Hb = BODY_H * (L.h || 1); for (let i = 0; i < 2; i++) { const y = 1.7 + (i === near ? 0.32 : -0.32) * c8; reach(i, (LADDER.push - 0.06) / Hb, y / Hb, 0.08); } }
  // 9a — THE RAIN + THE WIND on the body: a NEWSPAPER held over the head (both hands up at its corners, a little bob with the step) ·
  // A HAND ON THE HAT in a strong wind (the near hand up to the brim)
  if (L.paper && (pose === 'walk' || pose === 'wait' || pose === 'look' || pose === 'shop')) { const bob = walking ? 0.008 * Math.sin(p * Math.PI * 4) : 0; reach(near, 0.07, 1.02 + bob, 0.12); reach(1 - near, -0.05, 1.01 + bob, 0.12); }
  else if (L.holdHat && (pose === 'walk' || pose === 'wait')) reach(near, 0.04, 0.97, 0.1);
  if (pose === 'upend' || pose === 'lay') { const k = smooth(pose === 'upend' ? uP : 1 - uP); arm(near, 2.62 + (1.25 - 2.62) * k, 2.6 + (0.35 - 2.6) * k, 0.14); arm(1 - near, 0.1 + 1.5 * k, 0.12 + 0.28 * k, 0.1); }
  if (pose === 'spread' || pose === 'fold') { arm(near, 1.95, 0.35); arm(1 - near, 1.85, 0.4); }
  // 8b2 — 'unload': both hands in over a truck's bed EMPTY, then out WITH the load — up onto the shoulder for a shoulder load (gear.js
  // follows the hands there: J.uk), down to the carry for a hand load — the next leg's carry picks up exactly where this one ends
  let uk = 0;
  if (pose === 'unload') {
    const ki = smooth(clamp01(uP / 0.4)), R0 = [0.1, 0.12, 0.06], IN = [1.5, 0.35, 0.1], OUT = onSh ? [2.62, 2.6, 0.14] : inHand ? [0.06, 0.04, 0.2] : R0;
    uk = smooth(clamp01((uP - 0.45) / 0.55));
    const L3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k], A = uP < 0.45 ? L3(R0, IN, ki) : L3(IN, OUT, uk), B = uP < 0.45 ? L3(R0, IN, ki) : L3(IN, R0, uk);
    arm(near, ...A); arm(1 - near, ...B);
  }
  // 8b1 — THE WORKERS' POSES (big, readable motions: the broom's push, the crank's turn, the brush's strokes, the squeegee's sweep)
  const tw8 = mo ? t : 0;
  // (8b2 — STROKES, not wiggles: each work motion is a working stroke (slow, with weight) + a quick return — sk(period, share))
  const sk = (P, share, off = 0) => { const u = (((tw8 + L.h * 13 + off) / P) % 1 + 1) % 1; return u < share ? smooth(u / share) : 1 - smooth((u - share) / (1 - share)); };
  if (pose === 'sweep') { const k = sk(1.25, 0.62); shJ.forEach(q => { q.a += 0.04 * k; }); head.a += 0.04 * k; arm(N, 0.5 + 0.5 * k, 0.5 - 0.1 * k); arm(Fa, 0.8 + 0.5 * k, 0.22); }
  if (pose === 'crank') { const c8 = tw8 * 4.2; arm(N, 2.0 + 0.45 * Math.sin(c8), 0.5 + 0.3 * Math.cos(c8)); arm(Fa, 1.75 + 0.45 * Math.sin(c8), 0.6 + 0.3 * Math.cos(c8)); }
  if (pose === 'climb') {
    // (hand over hand: the hand opposite the stepping foot reaches up to the next rung while the other slides down as he rises)
    if (st.rung) { const reach = 1 - climbStep, e = climbQ; for (let i = 0; i < 2; i++) arm(i, i === reach ? 2.3 + 0.5 * e : 2.8 - 0.5 * e, 0.42, 0.1); }
    else { const ph = ((st.y || 0) / 0.3) * Math.PI; arm(0, 2.55 + 0.3 * Math.sin(ph), 0.45); arm(1, 2.55 - 0.3 * Math.sin(ph), 0.45); }
  }
  if (pose === 'reach') { arm(N, 2.8 + 0.1 * Math.sin(tw8 * 2.3), 0.25 + 0.15 * Math.sin(tw8 * 3.7)); arm(Fa, onRungs ? 1.55 : 0.4, onRungs ? 0.7 : 0.6); }
  // the sign painter: a DOWNWARD stroke laid on slowly (the brush loaded), lifted + back up quickly; the free hand on a rail
  if (pose === 'paint') { const k = sk(1.5, 0.72); arm(N, 2.5 - 0.55 * k, 0.4 + 0.15 * k, 0.08 + 0.05 * k); arm(Fa, onRungs ? 1.5 : 0.5, onRungs ? 0.7 : 0.5); head.a -= 0.015 * k; }
  // the billposter SMOOTHING the sheet: long brush strokes down the paper, both hands on the handle, his body following the stroke
  if (pose === 'paste') { const k = sk(1.9, 0.68); shJ.forEach(q => { q.a += 0.03 * k; }); arm(N, 2.35 - 0.8 * k, 0.3 + 0.1 * k); arm(Fa, 2.0 - 0.65 * k, 0.45); }
  if (pose === 'pastehi') { const k = sk(2.2, 0.7); arm(N, 2.95 - 0.38 * k, 0.12 + 0.08 * k); arm(Fa, 2.55 - 0.32 * k, 0.28); }
  // the window washer's S: a level SWIPE across the pane (the arm out to the side), down a blade's width, back the other way
  if (pose === 'squeegee') { const k = sk(1.6, 0.75, 0.3), row = Math.floor(((tw8 + L.h * 13 + 0.3) / 1.6) % 4), across = row % 2 ? 1 - k : k; arm(N, 2.3 - 0.12 * row, 0.3, 0.1 + 0.7 * across); arm(Fa, 0.4, 0.5); }
  if (pose === 'tip') { arm(0, 2.75, 0.55); arm(1, 2.65, 0.6); }
  if (pose === 'hold') { arm(0, 1.65, 0.55); arm(1, 1.75, 0.5); }
  if (pose === 'twirl') { arm(N, 1.15, 0.8); }
  if (pose === 'tipHat') { arm(N, 2.7, 1.7); }
  if (pose === 'offer') { arm(N, 1.45 + 0.06 * Math.sin(tw8 * 1.3), 0.25); }
  if (pose === 'post') { arm(N, 1.3, 0.55); }
  if (pose === 'lookout') { arm(0, 0.18, 0.45); arm(1, 0.18, 0.45); }
  // 8b2 — THE RAID's officer: the flashlight held out at shoulder height, swept slowly across the dark windows (the same sweep as the
  // beam: core/harbor-raid.js#raidAt — sin(u · 2.5π) over the pose), the other hand on his belt
  if (pose === 'flash') { const sw = Math.sin(uP * Math.PI * 2.5); arm(N, 1.62 + 0.12 * Math.abs(sw), 0.08, 0.05 + 0.32 * (sw + 1) / 2); arm(Fa, 0.35, 1.2, 0.25); }
  // THE WANDS' dancer (FP3b item 9): st.moves = { arms: [[ang, bend, out], [ang, bend, out]], sway, dip } from people.js's routine
  // (phi: the arm raised in the FRONTAL plane — 0 hanging, π/2 out to the side, π straight up — so the moves read from the front)
  // (PEO: the bend capped at 1.15 — the follow-through once pushed it to ~1.6: the forearm pointed straight at us and the wand shrank to a dot)
  if (pose === 'wands' && st.moves) { const m = st.moves; for (let i = 0; i < 2; i++) { const [phi, bend0] = m.arms[i], bend = Math.max(0, Math.min(1.15, bend0)); arm(i, phi <= Math.PI / 2 ? 0 : Math.PI, bend, phi <= Math.PI / 2 ? phi : Math.PI - phi); } shJ.forEach(s => { s.b += (m.sway || 0) * 0.03; }); head.b += (m.sway || 0) * 0.045; }
  // 11a-1 — THE HOLIDAYS' BODIES: the zombie's arms out in front + the head lolling + the torso swaying on the shamble (reaching harder when
  // it notices someone — st.reach); a walker STARTLED by one (st.startle 0..1: hands up, a lean back, then the shoulders shaking — a
  // laugh); the trick-or-treaters at the door (the bucket held up while it's open); the procession's holds (a candle cupped at the chest,
  // a photo held up, marigolds, the mariachis' instruments, the ofrenda's pole on the shoulder); the grown-up's torch pointed ahead
  holidayArms({ L, st, pose, walking, p, t, mo, arm, shJ, head, near: N, farA: Fa, uP, cr: cr0 });
  // ---- onto the screen
  const k0 = kD[0], k1 = kD[1];
  const scr = j => { const D = j.a * cz + j.b * cx; return [j.a * cx - j.b * cz, j.y + D * (k0 - k1 * j.y)]; };
  const dep = j => j.a * cz + j.b * cx;
  const feetS = foot.map(scr), kneesS = knee.map(scr), hipsS = hipJ.map(scr), shsS = shJ.map(scr);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const tw = Math.hypot(0.138 * cz, 0.1 * cx);
  return {
    hd, cx, cz, d: cx >= 0 ? 1 : -1, side: Math.abs(cx) > 0.72, face: st.dir, pose, walking, p, jog, toast, near: N,
    noCarry: (pose === 'pick' && uP < 0.5) || (pose === 'set' && uP >= 0.5) || (pose === 'unload' && uP < 0.45), uk, sq,
    feet: feetS, knees: kneesS, hips: hipsS, hip: mid(hipsS[0], hipsS[1]), shs: shsS, sh: mid(shsS[0], shsS[1]),
    elbows: elbow.map(scr), hands: hand.map(scr), head: scr(head), tw, planted, heel,
    D: { legs: foot.map(dep), arms: hand.map(dep) },
  };
}

/** the rig on the screen for a state: { J, fx, fy (its ground point), H (its height in pt) } — drawFolk, the leash, the tests */
export function rigOf(cam, st, L, t = 0, mo = true, yUp = 0) {
  const [fx, fy] = project(cam, st.x, yUp, st.z), H = BODY_H * L.h * cam.F / st.z, ch = cam.CAMH == null ? 13 : cam.CAMH, kD = [(ch - yUp) / st.z, BODY_H * L.h / st.z];
  let J = jointsOf(st, L, t, mo, kD);
  // 8b2 — NO SNAPPING BETWEEN POSES (the owner): the first BLEND s of every leg eases out of the one before (its last frame: a walk at the
  // same distance, a pose as it ended) — sitting down, standing up, a reach, a lift, setting off; every figure, workers or not
  if (mo && st.prev && st.prev !== st.pose && st.since != null && st.since < BLEND) {
    const was = jointsOf({ ...st, pose: st.prev, v: st.prev === 'walk' ? Math.max(st.v || 0, 1) : 0, since: 9, left: 0, rung: null }, L, t, mo, kD);
    J = blendJ(was, J, smooth(st.since / BLEND));
  }
  return { fx, fy, H, J };
}
export const BLEND = 0.34;
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
/** a rig between two (every joint on screen eased; the rest of J — facing, pose, flags — the new one's) */
function blendJ(A, B, k) {
  const L2 = (a, b) => a.map((q, i) => lerp2(q, b[i], k));
  return { ...B, feet: L2(A.feet, B.feet), knees: L2(A.knees, B.knees), hips: L2(A.hips, B.hips), hip: lerp2(A.hip, B.hip, k), shs: L2(A.shs, B.shs), sh: lerp2(A.sh, B.sh, k), elbows: L2(A.elbows, B.elbows), hands: L2(A.hands, B.hands), head: lerp2(A.head, B.head, k) };
}

// ------------------------------------------------------------------ DRAWING ONE FIGURE
/**
 * drawFolk(c, cam, it, env): it = { s (the state: x, z, pose, hd / dir, dist, v, a, link), L (the look) }, env = { t, mo, T (day / gold /
 * night, sunDir, sunEl, ovc), dark (the lamps' ramp 0..1), lightAt(x, z) → [r, g, b] | null (the lamps' light on the ground there),
 * rimSide(x, z) → ±1 (the nearest lamp's side), shadow(h) → { dx, dz, a } | null, yUp (world height of the ground: the roof deck),
 * tier } → the figure's screen box
 */
export function drawFolk(c, cam, it, env) {
  const st = it.s, L = it.L, yUp = env.yUp || 0;
  const { fx, fy, H, J } = rigOf(cam, st, L, env.t || 0, env.mo !== false, yUp);
  if (H < 3 || fx + H * 0.45 < 0 || fx - H * 0.45 > cam.W) return null;     // (off the screen's edges: walking in / out — not drawn)
  const a = clamp01(st.a == null ? 1 : st.a);
  // (the figure's night tone follows the SCENE's darkness — T.night, the bake's tones — the lamps' ramp only lights it)
  const T = env.T || { day: 1 }, day = clamp01((T.day || 0) + 0.8 * (T.gold || 0)), lampK = clamp01(env.dark || 0), dark = Math.max(lampK, clamp01(T.night || 0));
  const lt = env.lightAt ? env.lightAt(st.x, st.z) : null, lk = lt ? Math.min(1.3, (lt[0] + lt[1] + lt[2]) / 380) : 0;
  // the scene's light on a colour: by day itself (the gold hour warmer); at night a dark silhouette lifted by the lamps where it stands
  const NIGHT = [18, 16, 28];
  const lit = (col, k = 1) => {
    let cc = col;
    if (T.gold) cc = mix(cc, [cc[0] * 1.08 + 10, cc[1] * 0.95, cc[2] * 0.82], T.gold * 0.5);
    // (11a-1: a costume's colours hold a little more at night — L.nightLift — the orange pumpkin, the white sheet, the Catrina's dress read
    // under the lamps + the door's light; the candles add their own)
    if (dark > 0.01) { const lum = (col[0] * 0.3 + col[1] * 0.59 + col[2] * 0.11) / 255; cc = mix(cc, NIGHT, (0.86 - 0.24 * clamp01((lum - 0.55) / 0.4)) * dark * (1 - (L.nightLift || 0))); if (lt) { const q = Math.min(1, 160 / Math.max(1, lt[0], lt[1], lt[2])); cc = [cc[0] + lt[0] * q * 0.1 * k * lampK, cc[1] + lt[1] * q * 0.1 * k * lampK, cc[2] + lt[2] * q * 0.1 * k * lampK]; } }   // (FP3a: mostly silhouette; the rim carries the light)
    return cc.map(v => Math.min(255, v));
  };
  const X = u => fx + u * H, Y = v => fy - v * H;
  c.save(); c.globalAlpha = a * (c.globalAlpha || 1);
  if (env.clip) env.clip(c);
  // ---- the shadows: a soft contact shadow; by day the sun's cast shadow along the ground
  const sh = env.shadow ? env.shadow(BODY_H * L.h) : null;
  if (sh && st.pose !== 'sit') {
    const [tx, ty] = project(cam, st.x + sh.dx, yUp, st.z + sh.dz), w = H * 0.09;
    c.fillStyle = `rgba(28,22,44,${(sh.a * 0.85).toFixed(3)})`; c.beginPath(); c.moveTo(fx - w, fy); c.lineTo(fx + w, fy); c.lineTo(tx + w * 0.55, ty); c.lineTo(tx - w * 0.55, ty); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(tx, ty, w * 0.75, w * 0.35, 0, 0, TAU); c.fill();
  }
  c.fillStyle = `rgba(8,6,16,${(0.32 + 0.18 * (1 - day) + 0.1 * lk).toFixed(3)})`;
  c.beginPath(); c.ellipse(fx, fy, H * (st.pose === 'sit' ? 0.12 : 0.14), H * 0.035, 0, 0, TAU); c.fill();
  // ---- the RIM (night, under a lamp — FP3a, the owner's 8P note 3: on the HEAD + SHOULDERS only, never the whole outline)
  if (dark > 0.3 && lt && lk > 0.12 && env.tier !== 0) {              // (tier 0: no rim pass)
    const side = env.rimSide ? env.rimSide(st.x, st.z) : 1, n = Math.max(lt[0], lt[1], lt[2]) || 1, rc = mix(lt.map(v => Math.min(255, 52 + v / n * 200)), [255, 214, 160], 0.45);
    c.save(); c.translate(side * Math.max(0.7, H * 0.034), -Math.max(0.35, H * 0.01)); c.globalAlpha = a * 0.95 * clamp01(0.35 + lk * 0.8) * lampK;
    rimUpper(c, J, L, X, Y, H, rgb(rc)); c.restore();
  }
  // ---- A SITTER BY DAY (FP3b, the owner after FP3a: "people on the bench are hard to see at noon"): a light edge round the head +
  // shoulders where they meet the dark bench's back — the sky's light on the cloth's outline
  if (st.pose === 'sit' && day > 0.2) {
    c.save(); c.globalAlpha = a * 0.6 * day;
    for (const [ox, oy] of [[-0.8, -0.5], [0.8, -0.5], [0, -0.9]]) { c.save(); c.translate(ox, oy); rimUpper(c, J, L, X, Y, H, 'rgb(236,232,220)'); c.restore(); }
    c.restore();
  }
  // (8b1: a worker's carried gear changes leg by leg — st.carry; the sweeper's can cart stands on the ground ahead of him: behind him
  // when he faces away)
  const LL = st.carry != null ? (st.carry === L.carry ? L : { ...L, carry: st.carry }) : L;
  if (LL.carry === 'sweepcart' && J.cz > 0.15) gearCart(c, J, X, Y, H, (col, k) => rgb(lit(col, k)), st);
  body(c, J, LL, X, Y, H, lit, env);
  if (LL.carry === 'sweepcart' && J.cz <= 0.15) gearCart(c, J, X, Y, H, (col, k) => rgb(lit(col, k)), st);
  c.restore();
  return { x: fx - H * 0.2, y: fy - H, w: H * 0.4, h: H };
}

/** the figure's parts, far side first */
function body(c, J, L, X, Y, H, lit, env) {
  const f = (col, k = 1) => rgb(lit(col, k));
  const cols = L.cols, cx = J.cx, cz = J.cz, d = J.d, ax = Math.abs(cx);
  const far = col => col.map(v => v * 0.78);
  const leg = (i, col, w) => {
    const hp = J.hips[i], k = J.knees[i], ft = J.feet[i];
    c.strokeStyle = f(col); c.lineWidth = w * H; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(X(hp[0]), Y(hp[1])); c.lineTo(X(k[0]), Y(k[1])); c.lineTo(X(ft[0]), Y(ft[1] - 0.012)); c.stroke();
    // the shoe: long in profile, short + round from the front / the back; the heel lifting at push-off
    const tip = 0.024 * cx, hl = J.heel[i] * 0.012;
    c.fillStyle = f([24, 20, 22]); c.beginPath(); c.ellipse(X(ft[0] + tip), Y(ft[1] - 0.018 + hl), H * (0.028 + 0.016 * ax), H * 0.017, (J.heel[i] * 0.35) * -d * ax, 0, TAU); c.fill();
  };
  const armP = (i, col, w) => {
    const s0 = J.shs[i], e = J.elbows[i], h = J.hands[i];
    c.strokeStyle = f(col); c.lineWidth = w * H; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(X(s0[0]), Y(s0[1])); c.lineTo(X(e[0]), Y(e[1])); c.lineTo(X(h[0]), Y(h[1])); c.stroke();
    c.fillStyle = f(L.gloves || cols.skin, 0.9); c.beginPath(); c.arc(X(h[0]), Y(h[1]), H * (L.gloves ? 0.025 : 0.022), 0, TAU); c.fill();
    return [X(h[0]), Y(h[1])];
  };
  const legCol = L.dress && !L.tux ? (L.woman ? [196, 170, 150] : cols.legs) : cols.legs, legW = L.woman ? 0.05 : L.jog ? 0.066 : 0.078;
  const sleeve = L.coat === 'none' ? (L.jog ? cols.shirt : L.woman ? cols.dress : cols.shirt) : cols.coat;
  // the legs (both under the coat: its hem covers the thighs), the far one first + darker
  const lo = J.D.legs[0] > J.D.legs[1] ? [0, 1] : [1, 0], lgap = Math.abs(J.D.legs[0] - J.D.legs[1]) > 0.02;
  // (11a-1: a cape / a tail BEHIND the figure — drawn first when it faces us or walks across, over the back when it walks away)
  const behind = cz < 0.3;
  if (L.cape && behind) cape(c, J, L, X, Y, H, f);
  if (L.tail && behind) tail(c, J, X, Y, H, f, env);
  leg(lo[0], lgap ? far(legCol) : legCol, legW); leg(lo[1], legCol, legW);
  if (L.bones) for (const i of lo) bones(c, [J.hips[i], J.knees[i], J.feet[i]], X, Y, H, f, L);
  // (11a-1: THE SHEET GHOST — the whole kid under one white sheet: no arms, the feet under its swaying hem, the eye holes)
  if (L.costume === 'ghost') { ghostSheet(c, J, L, X, Y, H, f, env); holidayCarry(c, J, L, X, Y, H, f, env, [X(J.hands[J.near][0]), Y(J.hands[J.near][1])]); return; }
  // the far arm behind the torso when it's turned side-on enough to hide it
  const ao = J.D.arms[0] > J.D.arms[1] ? [0, 1] : [1, 0], armsSide = ax > 0.35 && Math.abs(J.D.arms[0] - J.D.arms[1]) > 0.04;
  if (armsSide) { armP(ao[0], far(sleeve), 0.062); if (L.bones) bones(c, [J.shs[ao[0]], J.elbows[ao[0]], J.hands[ao[0]]], X, Y, H, f, L); }
  // the torso / the coat / the dress
  const top = J.sh[1] + 0.01, hipY = J.hip[1], sx = J.tw, tX = J.sh[0], hX = J.hip[0];
  const hem = J.pose === 'sit' ? hipY - 0.02 : L.hem != null ? L.hem : L.coat === 'long' ? 0.27 : L.dress === 'flapper' ? 0.3 : L.dress ? 0.24 : L.coat === 'short' ? hipY - 0.06 : hipY - 0.02;
  const swingHem = J.walking ? Math.sin(J.p * TAU * 2) * 0.012 : 0;
  const torsoCol = L.coat !== 'none' ? cols.coat : L.dress ? cols.dress : cols.shirt;
  const flare = L.coat === 'long' ? 0.03 : L.dress === 'flapper' ? 0.035 : L.dress ? 0.045 : 0.01;
  const torso = () => {
    c.beginPath();
    c.moveTo(X(tX - sx), Y(top)); c.lineTo(X(tX + sx), Y(top));
    c.lineTo(X(hX + sx * 0.82), Y(hipY + 0.05)); c.lineTo(X(hX + sx * 0.9 + flare + swingHem * d), Y(hem)); c.lineTo(X(hX - sx * 0.9 - flare + swingHem * d), Y(hem)); c.lineTo(X(hX - sx * 0.82), Y(hipY + 0.05));
    c.closePath();
  };
  c.fillStyle = f(torsoCol); torso(); c.fill();
  // a dress showing under a coat; the flapper's fringe + sash; a tux's white shirt front (from the front + 3/4); the coat's seam in profile
  if (L.dress && L.coat !== 'none' && L.dress !== 'flapper' && J.pose !== 'sit') { c.fillStyle = f(cols.dress); c.fillRect(X(hX - sx * 0.85), Y(hem), (sx * 1.7) * H, Math.max(0.6, 0.035 * H)); }
  if (L.dress === 'flapper' && L.coat === 'none') {
    c.fillStyle = f(cols.dress.map(v => Math.min(255, v * 1.15))); c.fillRect(X(hX - sx), Y(hipY + 0.02), sx * 2 * H, Math.max(0.5, 0.02 * H));
    c.strokeStyle = f(cols.dress.map(v => Math.min(255, v * 1.25))); c.lineWidth = Math.max(0.3, H * 0.006);
    c.beginPath(); for (let u = -sx - flare; u <= sx + flare; u += 0.018) { c.moveTo(X(hX + u + swingHem * d), Y(hem + 0.03)); c.lineTo(X(hX + u + swingHem * d * 2), Y(hem - 0.012)); } c.stroke();
  }
  if (L.tux && cz < 0.4) { const v0 = tX + cx * sx * 0.45; c.fillStyle = f(cols.shirt, 1.2); c.beginPath(); c.moveTo(X(v0 - 0.03 * (1 - ax * 0.5)), Y(top)); c.lineTo(X(v0 + 0.03 * (1 - ax * 0.5)), Y(top)); c.lineTo(X(v0), Y(top - 0.13)); c.closePath(); c.fill(); }
  if (L.coat !== 'none' && ax > 0.5) { c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(X(tX - sx * 0.1 * d), Y(top - 0.05), Math.max(0.4, H * 0.012), (top - 0.05 - hem) * H * 0.95); }
  if (cols.scarf && L.coat !== 'none') { c.fillStyle = f(cols.scarf); c.beginPath(); c.ellipse(X(tX), Y(top - 0.005), sx * H * 0.92, H * 0.026, 0, 0, TAU); c.fill(); if (ax > 0.5 || cz < -0.5) c.fillRect(X(tX + (ax > 0.5 ? -d * 0.05 : 0.02)), Y(top - 0.005), Math.max(0.6, 0.03 * H), 0.13 * H); }
  // 8b1 — THE UNIFORMS' DETAILS: an overalls' bib + straps, an apron, a waistcoat, brass buttons down the front (+ the cop's badge)
  if (L.overalls) {
    const bw = sx * (0.62 + 0.3 * (1 - ax)); c.fillStyle = f(cols.legs); c.fillRect(X(tX - bw), Y(top - 0.07), bw * 2 * H, (top - 0.07 - hipY + 0.02) * H);
    c.strokeStyle = f(cols.legs); c.lineWidth = Math.max(0.4, 0.016 * H); c.beginPath(); c.moveTo(X(tX - bw * 0.8), Y(top - 0.07)); c.lineTo(X(tX - sx * 0.7), Y(top)); c.moveTo(X(tX + bw * 0.8), Y(top - 0.07)); c.lineTo(X(tX + sx * 0.7), Y(top)); c.stroke();
  }
  if (L.apron && cz < 0.55) { const aw = sx * (0.5 + 0.4 * (1 - ax)), ax0 = tX + cx * sx * 0.35 * ax; c.fillStyle = f(L.apron); c.fillRect(X(ax0 - aw), Y(top - 0.06), aw * 2 * H, (top - 0.06 - hem + 0.06) * H); }
  if (L.vest) {
    c.fillStyle = f(L.vest); c.beginPath(); c.moveTo(X(tX - sx * 0.95), Y(top - 0.005)); c.lineTo(X(tX - sx * 0.25), Y(top - 0.005)); c.lineTo(X(tX), Y(top - 0.1)); c.lineTo(X(tX + sx * 0.25), Y(top - 0.005));
    c.lineTo(X(tX + sx * 0.95), Y(top - 0.005)); c.lineTo(X(hX + sx * 0.85), Y(hipY + 0.03)); c.lineTo(X(hX - sx * 0.85), Y(hipY + 0.03)); c.closePath(); c.fill();
  }
  if (L.trim && cz < 0.35) {
    const bx = tX + cx * sx * 0.12; c.fillStyle = f(L.trim, 1.3);
    for (let i = 0; i < 4; i++) { const by = top - 0.05 - i * (top - hipY - 0.02) / 4; c.beginPath(); c.arc(X(bx), Y(by), Math.max(0.35, H * 0.009), 0, TAU); c.fill(); }
    if (L.badge) { c.beginPath(); c.arc(X(tX - cx * sx * 0.35 - sx * 0.35 * (1 - ax)), Y(top - 0.06), Math.max(0.45, H * 0.014), 0, TAU); c.fill(); }
  }
  workwear(c, J, L, X, Y, H, f, { top, hipY, hem, sx, tX, hX, cx, cz, ax, d });
  // 11a-1 — the costumes over the torso: the pumpkin's round body, the skeleton's ribs, the pirate's stripes, the zombie's torn hem, the
  // hero's belt, a charro jacket's silver; the vampire's high collar behind the head
  costumeTorso(c, J, L, X, Y, H, f, { top, hipY, hem, sx, tX, hX, cx, cz, ax, d });
  // THE DAY'S LIGHT (FP3a, note 3): a LIT side + a SHADE side across the whole torso from the real sun (warm at golden hour)
  const sun = sunSide(env);
  if (sun) {
    const g = c.createLinearGradient(X(tX - sx * sun.s), 0, X(tX + sx * sun.s), 0);
    g.addColorStop(0, `rgba(${sun.hi},${(0.26 * sun.k).toFixed(3)})`); g.addColorStop(0.45, `rgba(${sun.hi},0)`); g.addColorStop(0.62, 'rgba(24,20,44,0)'); g.addColorStop(1, `rgba(24,20,44,${(0.3 * sun.k).toFixed(3)})`);
    c.fillStyle = g; torso(); c.fill();
  }
  // ---- the head: skin, then the hair by the facing (the back of the head walking away, the back half in profile, a fringe from the
  // front), the nose in profile, the sun's cheek, the hat, the brim's shadow across the face (no drawn features — the owner)
  const hx = J.head[0], hy = J.head[1], hr = HR, front = Math.max(0, -cz), back = Math.max(0, cz);
  c.fillStyle = f(cols.skin, 0.9); c.fillRect(X(hx - 0.022), Y(hy - hr * 0.6), 0.044 * H, 0.06 * H);
  if (L.woman && L.hat !== 'cloche') { c.fillStyle = f(cols.hair); c.beginPath(); c.ellipse(X(hx - cx * hr * 0.22), Y(hy - hr * 0.05), hr * (1.12 - 0.06 * ax) * H, hr * 1.08 * H, 0, 0, TAU); c.fill(); }   // (her bob, behind the face)
  c.fillStyle = f(cols.skin, 0.9); c.beginPath(); c.arc(X(hx), Y(hy), hr * H, 0, TAU); c.fill();
  if (ax > 0.6 && back < 0.6) { c.beginPath(); c.moveTo(X(hx + d * hr * 0.9), Y(hy + 0.005)); c.lineTo(X(hx + d * hr * (0.9 + 0.35 * ax)), Y(hy - 0.012)); c.lineTo(X(hx + d * hr * 0.85), Y(hy - 0.025)); c.fill(); }   // (the nose in profile)
  {
    c.fillStyle = f(cols.hair);
    c.save(); c.beginPath(); c.arc(X(hx), Y(hy), hr * H * 1.01, 0, TAU); c.clip();
    c.beginPath(); c.arc(X(hx - cx * hr * 1.05 * (1 - back)), Y(hy + hr * 0.62 * front), hr * H * (1 + 0.12 * back), 0, TAU); c.fill();
    c.restore();
  }
  if (sun) { const g = c.createLinearGradient(X(hx - hr * sun.s), 0, X(hx + hr * sun.s), 0); g.addColorStop(0, `rgba(${sun.hi},${(0.24 * sun.k).toFixed(3)})`); g.addColorStop(0.5, `rgba(${sun.hi},0)`); g.addColorStop(0.55, 'rgba(30,20,40,0)'); g.addColorStop(1, `rgba(30,20,40,${(0.3 * sun.k).toFixed(3)})`); c.fillStyle = g; c.beginPath(); c.arc(X(hx), Y(hy), hr * H, 0, TAU); c.fill(); }
  face(c, J, L, X, Y, H, f, hx, hy, hr);
  hat(c, L, X, Y, H, hx, hy, hr, J, f);
  if (L.cape && !behind) cape(c, J, L, X, Y, H, f);
  if (L.tail && !behind) tail(c, J, X, Y, H, f, env);
  if (L.hat && BRIM[L.hat] != null && back < 0.7) { const k = sunSide(env, true) * (1 - back); if (k > 0.05) { const by = BRIM[L.hat]; c.save(); c.beginPath(); c.arc(X(hx), Y(hy), hr * H * 1.01, 0, TAU); c.clip(); c.fillStyle = `rgba(26,18,30,${(0.42 * k).toFixed(3)})`; c.fillRect(X(hx - hr * 1.2), Y(hy + hr * by), hr * 2.4 * H, hr * 0.55 * H); c.restore(); } }
  // the near arm (or both, from the front / the back) + what it carries
  let hand;
  if (armsSide) hand = armP(ao[1], sleeve, 0.062);
  else { const h0 = armP(ao[0], sleeve, 0.062), h1 = armP(ao[1], sleeve, 0.062); hand = J.near === ao[1] ? h1 : h0; }
  if (L.bones) for (const i of armsSide ? [ao[1]] : ao) bones(c, [J.shs[i], J.elbows[i], J.hands[i]], X, Y, H, f, L);
  if (L.hcarry) { holidayCarry(c, J, L, X, Y, H, f, env, hand); return; }
  const liftP = J.pose === 'pick' || J.pose === 'set';
  if (liftP && L.carry && !J.noCarry && GEAR[L.carry]) {
    // (8b2: lifting with the knees — the load between both hands, low, not on the shoulder)
    const mx = (J.hands[0][0] + J.hands[1][0]) / 2, my = (J.hands[0][1] + J.hands[1][1]) / 2;
    GEAR[L.carry](c, { hand: [X(mx), Y(my)], J: { ...J, shs: [[mx, my - 0.06], [mx, my - 0.06]], sh0: J.shs }, X, Y, H, f, d, t: env.t || 0, mo: env.mo !== false, pose: J.pose });
  } else if (J.pose !== 'wands' && L.carry && !J.noCarry && GEAR[L.carry]) GEAR[L.carry](c, { hand, J, X, Y, H, f, d, t: env.t || 0, mo: env.mo !== false, pose: J.pose });
  else if (J.pose !== 'wands' && L.carry && !['point', 'wave', 'toast', 'dance', 'garden', 'clap'].includes(J.pose)) carry(c, L.carry, hand, H, f, d);
  if (J.pose === 'toast') { const [gx, gy] = hand; c.fillStyle = 'rgba(236,226,190,0.9)'; c.beginPath(); c.moveTo(gx - H * 0.03, gy - H * 0.05); c.lineTo(gx + H * 0.03, gy - H * 0.05); c.lineTo(gx, gy - H * 0.015); c.closePath(); c.fill(); c.fillRect(gx - 0.25, gy - H * 0.015, 0.5, H * 0.03); }
  if (L.paper && J.pose !== 'sit' && J.pose !== 'wands') {
    // the newspaper tented over the head between the two hands (newsprint, a fold down its middle, a few lines of print)
    const a = [X(J.hands[0][0]), Y(J.hands[0][1])], b = [X(J.hands[1][0]), Y(J.hands[1][1])], xl = Math.min(a[0], b[0]) - H * 0.07, xr = Math.max(a[0], b[0]) + H * 0.07, yb = Math.min(a[1], b[1]) + H * 0.01, mid = (xl + xr) / 2, pk = yb - H * 0.055;
    c.fillStyle = f([214, 210, 196]); c.beginPath(); c.moveTo(xl, yb); c.lineTo(mid, pk); c.lineTo(xr, yb + H * 0.012); c.lineTo(mid, pk + H * 0.03); c.closePath(); c.fill();
    c.strokeStyle = f([150, 146, 136]); c.lineWidth = Math.max(0.3, H * 0.008); c.beginPath(); c.moveTo(mid, pk); c.lineTo(mid, pk + H * 0.03); c.stroke();
    if (H > 24) { c.strokeStyle = f([120, 116, 110]); c.lineWidth = Math.max(0.25, H * 0.004); c.beginPath(); for (let i = 1; i < 4; i++) { const u = i / 4; c.moveTo(xl + (mid - xl) * 0.25, yb - (yb - pk) * u * 0.8 + H * 0.004); c.lineTo(mid - H * 0.01, pk + (yb - pk) * (1 - u) * 0.3 + H * 0.01 * u); } c.stroke(); }
  }
  if (L.umbrella && J.pose !== 'sit') { const [ux, uy] = hand; c.strokeStyle = f([30, 26, 24]); c.lineWidth = Math.max(0.5, H * 0.012); c.beginPath(); c.moveTo(ux, uy); c.lineTo(ux, Y(1.18)); c.stroke(); c.fillStyle = f(L.umbrella); c.beginPath(); c.ellipse(ux, Y(1.18), H * 0.3, H * 0.12, 0, Math.PI, 0); c.fill(); }
}
// the brim's line on the head (in head radii above its centre) per hat — the band under it is in shade
const BRIM = { witch: 0.55, sombrero: 0.5, catrina: 0.5, fedora: 0.55, top: 0.6, boater: 0.6, cloche: 0.18, flatcap: 0.62, newsboy: 0.62, helmet: 0.45, pith: 0.5, painter: 0.62, peaked: 0.52 };
/** 8b2 — a uniform's own details over the torso: a belt + its buckle, a bow tie at the collar, an apron's neck strap + waist ties,
 *  paint spatters on a smock (seeded per figure — a few bright flecks), the paste's splashes, a bootlegger's turned-up collar */
function workwear(c, J, L, X, Y, H, f, g) {
  const { top, hipY, hem, sx, tX, hX, cx, cz, ax, d } = g, front = cz < 0.45;
  if (L.belt) {
    const by = hipY + 0.055, bw = sx * (0.9 + 0.08 * (1 - ax));
    c.fillStyle = f(L.belt); c.fillRect(X(hX - bw), Y(by + 0.012), bw * 2 * H, Math.max(0.6, 0.024 * H));
    if (front) { c.fillStyle = f(L.trim || [200, 180, 120], 1.25); c.fillRect(X(hX + cx * sx * 0.2 - 0.012), Y(by + 0.014), Math.max(0.6, 0.024 * H), Math.max(0.6, 0.028 * H)); }
  }
  if (L.bow && front) {
    const bx = tX + cx * sx * 0.3, by = top - 0.012, w = Math.max(0.6, 0.026 * H), h = Math.max(0.5, 0.017 * H);
    c.fillStyle = f(L.bow); c.beginPath(); c.moveTo(X(bx), Y(by)); c.lineTo(X(bx) - w, Y(by) - h); c.lineTo(X(bx) - w, Y(by) + h); c.closePath(); c.moveTo(X(bx), Y(by)); c.lineTo(X(bx) + w, Y(by) - h); c.lineTo(X(bx) + w, Y(by) + h); c.closePath(); c.fill();
  }
  if (L.apron && cz < 0.55) {
    // (the neck strap + the waist ties over the apron's bib)
    const aw = sx * (0.5 + 0.4 * (1 - ax)), ax0 = tX + cx * sx * 0.35 * ax;
    c.strokeStyle = f(L.apron.map(v => v * 0.82)); c.lineWidth = Math.max(0.4, 0.012 * H);
    c.beginPath(); c.moveTo(X(ax0 - aw * 0.8), Y(top - 0.06)); c.lineTo(X(tX - sx * 0.3), Y(top)); c.moveTo(X(ax0 + aw * 0.8), Y(top - 0.06)); c.lineTo(X(tX + sx * 0.3), Y(top));
    c.moveTo(X(ax0 - aw), Y(hipY + 0.05)); c.lineTo(X(ax0 - aw - 0.035 * d), Y(hipY - 0.02)); c.stroke();
    if (front) { c.fillStyle = f(L.apron.map(v => v * 0.86)); c.fillRect(X(ax0 - aw * 0.45), Y(hipY + 0.11), aw * 0.9 * H, Math.max(0.5, 0.04 * H)); }
  }
  if (L.spatter) {
    // (seeded by the figure: the same flecks every frame) — the sign painters' bright enamels; the billposter's grey paste
    // (muted, small, few — a working smock flecked with the trade, never a polka-dot costume at phone size)
    const cols = L.spatter === 'paste' ? [[190, 184, 166], [160, 154, 140]] : [[186, 92, 84], [96, 116, 168], [204, 172, 96], [132, 128, 120]];
    let sd = Math.floor(L.h * 9973) || 7; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    for (let i = 0; i < 6; i++) {
      const u = (rnd() * 2 - 1) * 0.85, v = rnd(), onLeg = i >= 4, yy = onLeg ? 0.08 + v * (hipY - 0.12) : hem + 0.02 + v * (top - hem - 0.06), xx = onLeg ? hX + u * sx * 0.55 : lerpN(hX, tX, v) + u * sx;
      c.fillStyle = f(cols[i % cols.length]); c.beginPath(); c.arc(X(xx), Y(yy), Math.max(0.3, H * (0.005 + rnd() * 0.004)), 0, TAU); c.fill();
    }
  }
  if (L.collar && J.cz > -0.9) { c.fillStyle = f(L.cols.coat.map(v => v * 1.1)); c.beginPath(); c.moveTo(X(tX - sx * 0.95), Y(top - 0.01)); c.lineTo(X(tX - sx * 0.55), Y(top + 0.075)); c.lineTo(X(tX + sx * 0.55), Y(top + 0.075)); c.lineTo(X(tX + sx * 0.95), Y(top - 0.01)); c.closePath(); c.fill(); }
}
const lerpN = (a, b, u) => a + (b - a) * u;
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
  const top = J.sh[1] + 0.01, sx = J.tw, tX = J.sh[0], hx = J.head[0], hy = J.head[1], hr = HR;
  c.fillStyle = col;
  c.beginPath(); c.moveTo(X(tX - sx), Y(top)); c.lineTo(X(tX + sx), Y(top)); c.lineTo(X(tX + sx * 0.95), Y(top - 0.11)); c.lineTo(X(tX - sx * 0.95), Y(top - 0.11)); c.closePath(); c.fill();
  c.beginPath(); c.arc(X(hx), Y(hy), hr * H, 0, TAU); c.fill();
  if (L.hat) hat(c, L, X, Y, H, hx, hy, hr, J, () => col);
}
function hat(c, L, X, Y, H, hx, hy, hr, J, f) {
  const k = L.cols.hat, cx = J.cx, ax = Math.abs(cx);
  if (!L.hat) return;
  c.fillStyle = f(k);
  if (L.hat === 'fedora') { c.fillRect(X(hx - hr * 1.6), Y(hy + hr * 0.55), hr * 3.2 * H, Math.max(0.6, 0.016 * H)); c.beginPath(); c.moveTo(X(hx - hr * 0.95), Y(hy + hr * 0.55)); c.lineTo(X(hx - hr * 0.8 + cx * hr * 0.06), Y(hy + hr * 1.45)); c.lineTo(X(hx + hr * 0.8 + cx * hr * 0.06), Y(hy + hr * 1.5)); c.lineTo(X(hx + hr * 0.95), Y(hy + hr * 0.55)); c.fill(); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(X(hx - hr * 0.92), Y(hy + hr * 0.8), hr * 1.84 * H, Math.max(0.4, 0.012 * H)); }
  else if (L.hat === 'top') { c.fillRect(X(hx - hr * 1.4), Y(hy + hr * 0.6), hr * 2.8 * H, Math.max(0.6, 0.014 * H)); c.fillRect(X(hx - hr * 0.8), Y(hy + hr * 2.1), hr * 1.6 * H, hr * 1.5 * H); }
  else if (L.hat === 'boater') { c.fillStyle = f([214, 196, 150]); c.fillRect(X(hx - hr * 1.5), Y(hy + hr * 0.6), hr * 3 * H, Math.max(0.6, 0.014 * H)); c.fillRect(X(hx - hr * 0.85), Y(hy + hr * 1.25), hr * 1.7 * H, hr * 0.65 * H); c.fillStyle = f([40, 40, 52]); c.fillRect(X(hx - hr * 0.85), Y(hy + hr * 0.82), hr * 1.7 * H, Math.max(0.4, hr * 0.22 * H)); }
  else if (L.hat === 'cloche') { c.beginPath(); c.arc(X(hx), Y(hy + hr * 0.15), hr * 1.16 * H, Math.PI, 0); c.fill(); c.fillRect(X(hx - hr * 1.25), Y(hy + hr * 0.18), hr * 2.5 * H, Math.max(0.5, hr * 0.3 * H)); }
  else if (L.hat === 'newsboy' || L.hat === 'flatcap') {
    // the cap + its PEAK pointing the way they face (long in profile, a band across the brow from the front, hidden from behind)
    c.beginPath(); c.ellipse(X(hx + cx * hr * 0.15), Y(hy + hr * 0.6), hr * 1.18 * H, hr * 0.62 * H, 0, Math.PI, 0); c.fill();
    const pw = hr * (0.9 + 0.3 * ax), px = hx + cx * hr * 0.75;
    if (J.cz < 0.6) c.fillRect(X(px - pw), Y(hy + hr * 0.62), pw * 2 * H * (0.55 + 0.45 * (1 - ax)), Math.max(0.5, 0.012 * H));
  }
  else if (L.hat === 'peaked') {
    // (8b1) a 1920s service cap: a flat-topped crown a little wider than the head, a dark band, a short glossy VISOR the way they face
    const top = hy + hr * 1.32, w0 = hr * 1.12, w1 = hr * 1.3;
    c.beginPath(); c.moveTo(X(hx - w0), Y(hy + hr * 0.5)); c.lineTo(X(hx - w1), Y(top)); c.lineTo(X(hx + w1), Y(top)); c.lineTo(X(hx + w0), Y(hy + hr * 0.5)); c.closePath(); c.fill();
    c.fillStyle = f(k.map(v => v * 0.55)); c.fillRect(X(hx - w0), Y(hy + hr * 0.78), w0 * 2 * H, Math.max(0.5, hr * 0.3 * H));
    if (J.cz < 0.6) { c.fillStyle = f([22, 22, 26]); const pw = hr * (0.75 + 0.45 * ax), px = hx + cx * hr * 0.9; c.fillRect(X(px - pw), Y(hy + hr * 0.52), pw * 2 * H, Math.max(0.5, 0.013 * H)); }
  }
  else if (L.hat === 'helmet') {
    // (8b2) THE BEAT COP's tall CUSTODIAN HELMET — the period's unmistakable police silhouette: a rounded dome rising to a small crown
    // knob, a narrow brim, a brass badge on its front (from the front + 3/4)
    const w0 = hr * 1.08, base = hy + hr * 0.42, top = hy + hr * 2.25;
    c.beginPath(); c.moveTo(X(hx - w0), Y(base)); c.bezierCurveTo(X(hx - w0 * 1.02), Y(hy + hr * 1.6), X(hx - w0 * 0.62), Y(top), X(hx), Y(top));
    c.bezierCurveTo(X(hx + w0 * 0.62), Y(top), X(hx + w0 * 1.02), Y(hy + hr * 1.6), X(hx + w0), Y(base)); c.closePath(); c.fill();
    c.fillRect(X(hx - w0 * 1.22), Y(base + hr * 0.04), w0 * 2.44 * H, Math.max(0.55, 0.014 * H));
    c.beginPath(); c.arc(X(hx), Y(top + hr * 0.08), Math.max(0.4, hr * 0.16 * H), 0, TAU); c.fill();
    if (J.cz < 0.5 && L.trim) { c.fillStyle = f(L.trim, 1.35); c.beginPath(); c.arc(X(hx + cx * hr * 0.55), Y(hy + hr * 1.12), Math.max(0.45, hr * 0.24 * H), 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(X(hx - hr * 0.35), Y(hy + hr * 1.55), Math.max(0.3, hr * 0.2 * H), hr * 0.45 * H, -0.3, 0, TAU); c.fill();
  }
  else if (L.hat === 'pith') {
    // (8b2) THE WHITE WING's white PITH HELMET (New York's street cleaners, 1890s–1930s): a low wide dome, a brim all round
    const base = hy + hr * 0.5;
    c.beginPath(); c.ellipse(X(hx), Y(base), hr * 1.62 * H, Math.max(0.6, hr * 0.32 * H), 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(X(hx + cx * hr * 0.06), Y(base), hr * 1.12 * H, hr * 1.12 * H, 0, Math.PI, 0); c.fill();
    c.fillStyle = f(k.map(v => v * 0.72)); c.fillRect(X(hx - hr * 1.12), Y(base + hr * 0.2), hr * 2.24 * H, Math.max(0.4, hr * 0.16 * H));
  }
  else if (L.hat === 'painter') {
    // (8b2) THE PAINTERS' soft white cap: a small round crown + a short stubby peak the way they face
    c.beginPath(); c.ellipse(X(hx + cx * hr * 0.1), Y(hy + hr * 0.62), hr * 1.1 * H, hr * 0.78 * H, 0, Math.PI, 0); c.fill();
    if (J.cz < 0.6) { const pw = hr * (0.55 + 0.35 * ax), px = hx + cx * hr * 0.85; c.fillRect(X(px - pw), Y(hy + hr * 0.64), pw * 2 * H * (0.6 + 0.4 * (1 - ax)), Math.max(0.5, 0.013 * H)); }
    c.fillStyle = f([150, 60, 50]); c.fillRect(X(hx - hr * 0.3), Y(hy + hr * 1.18), Math.max(0.4, hr * 0.22 * H), Math.max(0.4, hr * 0.2 * H));
  }
  else if (HATS[L.hat]) HATS[L.hat](c, L, X, Y, H, hx, hy, hr, J, f);
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
  // (FP3b: the dog foreshortened by its heading — side-on crossing the screen, shorter on a diagonal, never a flat profile toward us)
  const hc = st.hd != null ? Math.cos(st.hd) : st.dir === -1 ? -1 : 1, fs = Math.max(0.42, Math.abs(hc));
  const [fx, fy] = project(cam, st.x, yUp, st.z), s = cam.F / st.z, H = 0.62 * FOLK_SCALE * L.dogSize * s, d = hc < 0 ? -1 : 1, X = u => fx + u * H * d * fs, Y = v => fy - v * H;
  if (fx + H < 0 || fx - H > cam.W) return [fx, fy];
  const lampK = clamp01(env.dark || 0), dark = Math.max(lampK, clamp01((env.T && env.T.night) || 0)), lt = env.lightAt ? env.lightAt(st.x, st.z) : null;
  let col = L.dog; if (dark > 0.01) { col = mix(col, [18, 16, 28], 0.74 * dark); if (lt) { const q = Math.min(1, 160 / Math.max(1, lt[0], lt[1], lt[2])); col = col.map((v, i) => Math.min(255, v + lt[i] * q * 0.17 * lampK)); } }
  c.fillStyle = `rgba(8,6,16,${(0.3 + 0.15 * dark).toFixed(3)})`; c.beginPath(); c.ellipse(fx, fy, H * 0.65, H * 0.08, 0, 0, TAU); c.fill();
  const p = st.v > 0.05 ? (st.dist / 0.9) % 1 : 0, trot = st.v > 0.05 ? 1 : 0;
  // (8b1 wildlife — THE LUNGE at the pigeons, st.lunge 0..1: the body stretched + low, the front legs reaching, the head down + out)
  const lg = Math.max(0, Math.min(1, st.lunge || 0)), fwd = 0.3 * lg, low = 0.1 * lg;
  // (POLISH 5 — THE SNIFF at the hydrant: the head down to it + a little forward, the tail going)
  const sn = st.sniff && st.v < 0.05 ? Math.max(0, Math.min(1, (st.since || 0) / 0.5, (st.left == null ? 1 : st.left) / 0.5)) : 0, hdn = 0.34 * sn, hfw = 0.08 * sn;
  c.strokeStyle = rgb(col.map(v => v * 0.8)); c.lineWidth = Math.max(0.6, H * 0.09); c.lineCap = 'round';
  for (const [bx, ph] of [[-0.42, 0], [0.38, 0.5], [-0.32, 0.5], [0.28, 0]]) { const sw = trot * Math.sin((p + ph) * TAU) * 0.16, reach = bx > 0 ? fwd * 1.4 : -fwd * 0.3; c.beginPath(); c.moveTo(X(bx + (bx > 0 ? fwd : 0)), Y(0.42 - low)); c.lineTo(X(bx + sw + reach), Y(0.02)); c.stroke(); }
  c.fillStyle = rgb(col); c.beginPath(); c.ellipse(X(fwd * 0.5), Y(0.52 - low), H * (0.5 + fwd * 0.5), H * 0.17, 0, 0, TAU); c.fill();
  if (sn > 0) { c.lineWidth = Math.max(0.6, H * 0.12); c.strokeStyle = rgb(col); c.beginPath(); c.moveTo(X(0.42), Y(0.6)); c.lineTo(X(0.55 + hfw), Y(0.72 - hdn)); c.stroke(); }   // (the neck down)
  c.beginPath(); c.ellipse(X(0.55 + fwd * 1.1 + hfw), Y(0.72 - low * 2 - hdn), H * 0.16, H * 0.14, 0, 0, TAU); c.fill();                      // the head
  c.beginPath(); c.ellipse(X(0.7 + fwd * 1.15 + hfw * 1.4), Y(0.68 - low * 2 - hdn * 1.15), H * 0.1, H * 0.06, -0.5 * sn, 0, TAU); c.fill();                       // the muzzle
  c.beginPath(); c.moveTo(X(0.5 + fwd * 1.1 + hfw), Y(0.82 - low * 2 - hdn)); c.lineTo(X(0.46 + fwd + hfw), Y(0.98 - low * 2.6 - hdn)); c.lineTo(X(0.58 + fwd * 1.1 + hfw), Y(0.84 - low * 2 - hdn)); c.fill();   // an ear (flat back in the lunge)
  const wag = env.mo !== false ? Math.sin((env.t || 0) * (11 + 7 * sn) + st.x) * (0.08 + 0.05 * sn) : 0;
  c.strokeStyle = rgb(col); c.lineWidth = Math.max(0.6, H * 0.07); c.beginPath(); c.moveTo(X(-0.48), Y(0.58)); c.quadraticCurveTo(X(-0.66), Y(0.78 + wag), X(-0.62), Y(0.92 + wag)); c.stroke();
  return [X(0.48 + fwd * 1.1), Y(0.62 - low * 2)];
}
/** the leash: a gently sagging line from the hand to the collar (taut: straight — 8b1 wildlife, the owner tugging a lunging dog) */
export function drawLeash(c, a, b, env, taut = false) {
  const dark = clamp01(env.dark || 0);
  c.strokeStyle = dark > 0.5 ? 'rgba(10,8,16,0.9)' : 'rgba(40,30,26,0.85)'; c.lineWidth = taut ? 0.75 : 0.6;
  c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, taut ? (a[1] + b[1]) / 2 : Math.max(a[1], b[1]) + 2, b[0], b[1]); c.stroke();
}

// ================================================================== 11a-1 — THE PEOPLE OF THE HOLIDAYS (the owner's bar: premium, playful,
// never gory, never clip-art — each reads at ~20 pt by SILHOUETTE + COLOUR + LIGHT: the sheet ghost's white, the witch's hat, the bones
// under a lamp, the zombie's arms out, a river of candles, the Catrina's wide flowered hat, the sombreros)
/** a trick-or-treater's costume (the kids) or the grown-up with them */
function trickLook(L, r, m) {
  L.scarf = null; L.cols.scarf = null; L.carry = null; L.umbrella = null; L.paper = false; L.holdHat = false;
  if (m.role === 'chap') {
    L.kid = false; L.coat = 'long'; L.dress = L.woman ? 'day' : null; L.hat = m.hat === 'witch' ? 'witch' : L.woman ? 'cloche' : 'fedora';
    if (m.hat === 'witch') { L.cols.hat = [30, 26, 38]; L.cols.band = [150, 80, 220]; }
    L.hcarry = m.torch ? 'torch' : null; return;
  }
  const cos = m.costume || 'ghost', C = L.cols;
  Object.assign(L, { nightLift: 0.42, kid: true, woman: false, dress: null, tux: false, coat: 'none', hat: null, skip: true, costume: cos, hh: 0.62 + r() * 0.1 });
  L.hcarry = m.carry || 'bucket'; L.glowstick = m.glowstick ? pick(r, [[90, 255, 150], [255, 90, 210], [90, 210, 255]]) : null;
  if (cos === 'ghost') { C.sheet = [242, 240, 234]; C.legs = [40, 38, 46]; }
  if (cos === 'witch') { L.dress = 'witch'; C.dress = [40, 30, 52]; C.legs = [30, 24, 40]; L.hem = 0.07; L.hat = 'witch'; C.hat = [34, 28, 44]; C.band = pick(r, [[170, 80, 230], [255, 130, 30], [80, 200, 110]]); L.cape = { col: [30, 22, 40], lining: C.band, len: 0.1 }; if (r() < 0.4) L.hcarry = 'broom'; C.hair = pick(r, [[230, 120, 40], [40, 30, 26], [90, 200, 110]]); }
  if (cos === 'skeleton') { C.shirt = [26, 24, 30]; C.legs = [22, 20, 26]; L.bones = [238, 234, 222]; C.skin = [234, 230, 220]; C.hair = [22, 20, 26]; L.face = 'skull'; }
  if (cos === 'pumpkin') { C.shirt = [236, 122, 28]; C.legs = [34, 64, 40]; L.pumpkin = true; L.hat = 'stem'; C.hat = [66, 120, 46]; }
  if (cos === 'vampire') { C.shirt = [24, 22, 30]; C.legs = [20, 18, 26]; C.skin = [232, 226, 228]; C.hair = [16, 14, 18]; L.cape = { col: [18, 16, 24], lining: [184, 24, 42], len: 0.07, collar: true }; L.vest = [150, 20, 36]; }
  if (cos === 'hero') { const h = pick(r, [[[40, 84, 204], [220, 40, 46], [250, 206, 60]], [[44, 150, 86], [140, 56, 184], [244, 226, 96]], [[200, 36, 44], [36, 64, 160], [250, 210, 70]]]); C.shirt = h[0]; C.legs = h[0]; L.cape = { col: h[1], lining: h[1].map(v => v * 0.72), len: 0.16, flutter: true }; L.belt = h[2]; L.trim = h[2]; L.mask = h[1]; L.face = 'mask'; }
  if (cos === 'cat') { C.shirt = [22, 20, 26]; C.legs = [20, 18, 24]; L.hat = 'ears'; C.hat = [22, 20, 26]; L.tail = true; C.hair = [22, 20, 26]; L.face = 'cat'; }
  if (cos === 'pirate') { C.shirt = [240, 236, 226]; L.stripes = [40, 52, 130]; C.legs = [30, 28, 34]; L.hat = 'bandana'; C.hat = [204, 36, 44]; L.belt = [70, 46, 30]; L.face = 'patch'; }
}
/** a costume-party ZOMBIE: their own clothes gone grey + grimy + torn, green-grey skin, dark eyes — playful, never gory */
function zombieLook(L, r, m) {
  const k = m.zlook || 'suit', C = L.cols;
  Object.assign(L, { nightLift: 0.3, zombie: true, scarf: null, carry: null, umbrella: null, paper: false, holdHat: false, tatters: true, face: 'zombie' });
  C.scarf = null;
  L.woman = k === 'dress' || k === 'bride'; L.dress = L.woman ? 'day' : null;
  L.coat = k === 'worker' ? 'short' : k === 'suit' ? 'long' : 'none';
  L.hat = k === 'worker' ? 'flatcap' : k === 'bride' ? 'veil' : k === 'suit' && r() < 0.5 ? 'fedora' : null;
  const grime = c => c.map((v, i) => v * 0.6 + [72, 78, 62][i] * 0.32);
  C.coat = grime(C.coat); C.legs = grime(C.legs); C.shirt = grime(C.shirt); C.hat = grime(C.hat);
  C.dress = k === 'bride' ? [218, 214, 200] : grime(C.dress);
  if (k === 'bride') L.hem = 0.05;
  C.skin = pick(r, [[150, 178, 138], [136, 160, 140], [172, 182, 150]]); C.hair = pick(r, [[64, 58, 50], [40, 36, 34], [126, 116, 92]]);
}
/** the DAY OF THE DEAD procession: mourners in their good dark clothes + bright REBOZOS (shawls) with a candle, Catrinas (the skull
 *  face paint, the long dress, the wide flowered hat or a marigold crown), children in flower crowns, the mariachi trio (charro suits +
 *  sombreros), the ofrenda's two bearers (white shirts, an orange sash) */
function procLook(L, r, m) {
  const role = m.costume || 'candle', C = L.cols, BRIGHT = [[196, 40, 120], [124, 44, 170], [30, 130, 140], [214, 90, 40], [44, 40, 56], [200, 40, 60]];
  Object.assign(L, { nightLift: 0.32, scarf: null, carry: null, umbrella: null, paper: false, holdHat: false, hcarry: 'candle' });
  C.scarf = null;
  if (role === 'catrina') { Object.assign(L, { woman: true, dress: 'day', coat: 'none', hem: 0.045, hat: r() < 0.6 ? 'catrina' : 'crown', face: 'calavera', hcarry: r() < 0.6 ? 'candle' : 'marigolds' }); C.dress = pick(r, BRIGHT); C.hat = r() < 0.5 ? [30, 28, 34] : C.dress.map(v => v * 0.55); C.skin = [240, 236, 230]; L.shawl = pick(r, [[230, 150, 40], [206, 44, 96], [240, 230, 210]]); }
  else if (role === 'child') { Object.assign(L, { kid: true, woman: r() < 0.5, coat: 'none', hh: 0.64 + r() * 0.08, hat: 'crown' }); L.dress = L.woman ? 'day' : null; C.dress = pick(r, BRIGHT); C.shirt = pick(r, [[236, 232, 220], [230, 200, 120]]); }
  else if (role === 'mariachi') { Object.assign(L, { woman: false, dress: null, coat: 'short', hat: 'sombrero', charro: true, tux: true, hcarry: m.inst || 'guitar' }); C.coat = [24, 22, 28]; C.legs = [24, 22, 28]; C.hat = [34, 30, 36]; C.shirt = [236, 232, 222]; L.trim = [226, 222, 212]; L.bow = [176, 30, 46]; }
  else if (role === 'bearer') { Object.assign(L, { woman: false, dress: null, coat: 'none', hat: null, hcarry: m.bearer ? 'poleB' : 'poleF' }); C.shirt = [236, 232, 220]; C.legs = [40, 38, 46]; L.sash = [222, 122, 30]; }
  else {
    if (L.woman) { L.coat = 'none'; L.dress = 'day'; L.hem = 0.08; C.dress = pick(r, [[44, 38, 52], [74, 40, 62], [38, 52, 74], [92, 32, 42]]); L.shawl = pick(r, [[222, 124, 30], [196, 42, 104], [124, 52, 166], [40, 146, 146], [232, 200, 80]]); L.hat = r() < 0.4 ? 'crown' : null; }
    else { L.coat = 'short'; L.dress = null; C.coat = pick(r, [[34, 32, 40], [52, 46, 42], [30, 36, 54]]); L.hat = r() < 0.35 ? 'fedora' : null; }
    L.hcarry = role === 'marigolds' ? 'marigolds' : role === 'photo' ? 'photo' : 'candle';
  }
}

/** HALLOWEEN NIGHT at the speakeasy: its guests in costume over their evening clothes — a witch's hat + cape, a vampire's cape + collar,
 *  cat ears with the flapper dress, a skeleton suit, now and then a zombie (one in four keeps the tux / the flapper: not every guest dresses up) */
function partyCostume(L, r) {
  const u = r();
  if (u < 0.25) return;
  L.nightLift = 0.25;
  if (u < 0.42) { L.hat = 'witch'; L.cols.hat = [30, 26, 38]; L.cols.band = pick(r, [[170, 80, 230], [255, 130, 30], [60, 190, 110]]); L.cape = { col: [28, 22, 38], lining: L.cols.band, len: 0.12 }; }
  else if (u < 0.6) { L.cape = { col: [18, 16, 24], lining: [184, 24, 42], len: 0.08, collar: true }; L.cols.skin = [232, 226, 228]; if (L.hat !== 'top') L.hat = null; }
  else if (u < 0.74) { L.hat = 'ears'; L.cols.hat = [22, 20, 26]; L.tail = true; L.face = 'cat'; }
  else if (u < 0.88) { L.coat = 'none'; L.dress = null; L.tux = false; L.cols.shirt = [24, 22, 28]; L.cols.legs = [22, 20, 26]; L.bones = [236, 232, 220]; L.cols.skin = [234, 230, 220]; L.face = 'skull'; L.hat = null; }
  else { L.zombie = true; L.tatters = true; L.face = 'zombie'; L.cols.skin = [150, 176, 138]; L.holdHat = false; L.umbrella = null; }
}
/** the holidays' arms + bodies on the rig (jointsOf): see the call */
function holidayArms({ L, st, pose, walking, p, t, mo, arm, shJ, head, near, farA, uP }) {
  const hc = L.hcarry;
  if (L.zombie && (walking || pose === 'wait')) {
    // arms out in front (a little apart, drifting), reaching higher + further when it notices someone; the shoulders rolling with the
    // stiff leg; the head lolling over, a little forward + down
    const rr = clamp01(st.reach || 0), sway = walking ? Math.sin(p * TAU) : mo ? 0.5 * Math.sin(t * 0.8) : 0;
    for (let i = 0; i < 2; i++) arm(i, 1.4 + 0.24 * rr + 0.07 * Math.sin(t * 1.1 + i * 2.1), 0.16 - 0.12 * rr, 0.06 + 0.05 * i);
    shJ.forEach(q => { q.b += 0.035 * sway; q.a += 0.02; });
    head.b += 0.042 * Math.sin(p * TAU + 0.8); head.y -= 0.014; head.a += 0.035;
  }
  // (Halloween: someone a zombie shambles up to — the hands fly up, a lean back, then the shoulders shake: they laugh)
  const sk = clamp01(st.startle || 0);
  if (sk > 0.01 && !L.zombie) {
    const laugh = sk > 0.3 && mo ? Math.sin(t * 24) * 0.006 * sk : 0;
    for (let i = 0; i < 2; i++) arm(i, 0.15 + 2.2 * sk, 0.3 + 0.55 * sk, 0.14 + 0.3 * sk);
    shJ.forEach(q => { q.a -= 0.045 * sk; q.y += laugh; }); head.a -= 0.055 * sk; head.y += laugh;
    return;
  }
  // (trick or treat at the door: the bucket held up while the door is open — a little bounce of excitement as it opens)
  if (pose === 'treat' && L.kid) {
    const up = smooth(clamp01((uP - 0.2) / 0.12)) * (1 - smooth(clamp01((uP - 0.74) / 0.1)));
    arm(near, 0.25 + 1.3 * up, 0.35 - 0.2 * up, 0.08);
    if (L.costume !== 'ghost') arm(farA, 0.12 + 0.35 * up, 0.5);
    head.y += 0.01 * up * (mo ? Math.abs(Math.sin(t * 9)) : 0);
    return;
  }
  if (!(walking || pose === 'wait' || pose === 'treat')) return;
  if (hc === 'candle') { arm(near, 0.72, 1.62, 0.1); arm(farA, 0.64, 1.74, 0.16); }        // (cupped at the chest: the flame lights the face)
  else if (hc === 'marigolds') arm(near, 0.82, 1.25, 0.1);
  else if (hc === 'photo') { arm(near, 1.45, 0.95, 0.08); arm(farA, 1.3, 1.1, 0.1); }      // (held up for everyone to see)
  else if (hc === 'guitar') { const s8 = mo ? 0.12 * Math.sin(t * 9.5) : 0; arm(near, 0.48 + s8, 1.38, 0.12); arm(farA, 1.02, 0.85, 0.28); }
  else if (hc === 'trumpet') { const b = mo ? 0.05 * Math.sin(t * 2.2) : 0; arm(near, 1.25 + b, 1.78, 0.1); arm(farA, 1.15 + b, 1.86, 0.12); head.a -= 0.01; }
  else if (hc === 'violin') { arm(farA, 1.45, 0.45, 0.36); arm(near, 1.2 + (mo ? 0.28 * Math.sin(t * 3.4) : 0), 1.5, 0.22); head.b += 0.02; }
  else if (hc === 'poleF' || hc === 'poleB') arm(near, 2.62, 2.6, 0.14);                  // (the ofrenda's pole on the shoulder)
  else if (hc === 'torch') arm(near, 0.78, 0.22, 0.08);                                     // (the torch pointed at the cobbles ahead)
  else if (hc === 'broom') arm(near, 0.42, 0.3, 0.1);
}

// ---- the drawing (body() calls these; f = the scene's light on a colour)
const GLOW = { cv: null, soft: null };
/** a warm glow sprite (additive): a candle's light, a jack-o'-lantern's, the torch's pool */
function glowSprite(soft = false) {
  const k = soft ? 'soft' : 'cv';
  if (GLOW[k] || typeof document === 'undefined') return GLOW[k];
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = safeCtx(cv);
  // (the point: a hot core with a quick falloff; the soft halo: a broad warm light — a candle's air, a pool on the cobbles)
  const st = soft ? [[0, 0.62], [0.25, 0.42], [0.5, 0.18], [0.75, 0.05], [1, 0]] : [[0, 1], [0.12, 0.7], [0.32, 0.26], [0.6, 0.08], [1, 0]];
  if (x) { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); for (const [o, a] of st) g.addColorStop(o, `rgba(255,${soft ? 176 : 190},${soft ? 96 : 110},${a})`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  GLOW[k] = cv; return cv;
}
const nightOf = env => Math.max(clamp01(env.dark || 0), clamp01((env.T && env.T.night) || 0));
function glow(c, x, y, r, a, soft = false) { const g = glowSprite(soft); if (!g || a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a) * (c.globalAlpha || 1); c.drawImage(g, x - r, y - r, r * 2, r * 2); c.restore(); }
/** a cape from the shoulders: trailing behind the walk (a hero's flutters), its lining showing on the edge that swings out */
function cape(c, J, L, X, Y, H, f) {
  const K = L.cape, top = J.sh[1] + 0.012, sx = J.tw * 1.02, tX = J.sh[0], hem = K.len, walk = J.walking;
  const trail = (walk ? 0.06 + (K.flutter ? 0.06 : 0) : 0.015) * -J.cx, fl = walk && K.flutter ? Math.sin(J.p * TAU * 2) * 0.022 : 0, w = sx * 1.3 + 0.025;
  c.fillStyle = f(K.col);
  c.beginPath(); c.moveTo(X(tX - sx), Y(top)); c.lineTo(X(tX + sx), Y(top));
  c.quadraticCurveTo(X(tX + w + trail * 0.4), Y((top + hem) / 2), X(tX + w + trail + fl), Y(hem));
  for (let i = 1; i <= 4; i++) c.lineTo(X(tX + w + trail + fl - (2 * w) * i / 4 - fl * i * 0.5), Y(hem + (i % 2 ? 0.012 : -0.004)));
  c.quadraticCurveTo(X(tX - w + trail * 0.4), Y((top + hem) / 2), X(tX - sx), Y(top)); c.fill();
  if (K.lining) {
    const e = trail >= 0 ? 1 : -1; c.fillStyle = f(K.lining, 1.1);
    c.beginPath(); c.moveTo(X(tX + e * sx * 0.92), Y(top - 0.02)); c.quadraticCurveTo(X(tX + e * (w + 0.008) + trail * 0.4), Y((top + hem) / 2), X(tX + e * w + trail + fl), Y(hem));
    c.lineTo(X(tX + e * (w - 0.04) + trail), Y(hem + 0.01)); c.quadraticCurveTo(X(tX + e * (w - 0.035) + trail * 0.4), Y((top + hem) / 2), X(tX + e * sx * 0.7), Y(top - 0.02)); c.fill();
  }
}
/** a cat costume's tail: from the small of the back, curling up, swaying with the walk */
function tail(c, J, X, Y, H, f, env) {
  const d = Math.abs(J.cx) > 0.2 ? -Math.sign(J.cx) : 1, hx = J.hip[0] - J.cx * 0.05, hy = J.hip[1] + 0.02;
  const sw = env.mo !== false ? Math.sin((env.t || 0) * 3.1 + J.p * TAU) * 0.035 : 0;
  c.strokeStyle = f([24, 22, 28]); c.lineWidth = Math.max(0.6, 0.026 * H); c.lineCap = 'round';
  c.beginPath(); c.moveTo(X(hx), Y(hy)); c.bezierCurveTo(X(hx + d * 0.13), Y(hy - 0.12), X(hx + d * 0.22 + sw), Y(hy - 0.03), X(hx + d * 0.19 + sw * 1.6), Y(hy + 0.11)); c.stroke();
}
/** the skeleton costume's bones along a limb (hip → knee → ankle / shoulder → elbow → hand), a knob at the joint */
function bones(c, pts, X, Y, H, f, L) {
  const [a, b, e] = pts, e2 = [b[0] + (e[0] - b[0]) * 0.86, b[1] + (e[1] - b[1]) * 0.86];
  c.strokeStyle = f(L.bones, 1.35); c.lineWidth = Math.max(0.35, 0.013 * H); c.lineCap = 'round';
  c.beginPath(); c.moveTo(X(a[0]), Y(a[1] - 0.012)); c.lineTo(X(b[0]), Y(b[1])); c.lineTo(X(e2[0]), Y(e2[1])); c.stroke();
  c.fillStyle = f(L.bones, 1.35); c.beginPath(); c.arc(X(b[0]), Y(b[1]), Math.max(0.35, 0.012 * H), 0, TAU); c.fill();
}
/** THE SHEET GHOST: one white sheet from the crown of the head to just above the shoes — round over the head, falling over the shoulders,
 *  flaring to a wavy, swaying hem; soft folds; two eye holes (+ a little mouth) from the front + 3/4 */
function ghostSheet(c, J, L, X, Y, H, f, env) {
  const hx = J.head[0], hy = J.head[1] - 0.01, hr = HR * 1.18, tX = J.sh[0], sy = J.sh[1], sx = J.tw * 1.3 + 0.02, hem = 0.1, t = env.t || 0, mo = env.mo !== false;
  const trail = J.walking ? -J.cx * 0.035 : 0, sw = mo ? (J.walking ? Math.sin(J.p * TAU * 2) : 0.4 * Math.sin(t * 1.3)) * 0.015 : 0;
  const w = sx * 1.32, col = L.cols.sheet;
  const path = () => {
    c.beginPath(); c.moveTo(X(hx - hr), Y(hy));
    c.arc(X(hx), Y(hy), hr * H, Math.PI, 0);
    c.quadraticCurveTo(X(tX + sx * 0.95), Y(sy + 0.01), X(tX + sx * 1.08), Y(sy - 0.08));
    c.quadraticCurveTo(X(tX + w * 0.98 + trail * 0.5), Y((sy + hem) / 2 - 0.05), X(tX + w + trail + sw), Y(hem + 0.01));
    const n = 5; for (let i = 1; i <= n; i++) { const u = i / n, x0 = tX + w + trail + sw - 2 * w * u, ph = mo ? Math.sin(t * 3 + i * 1.7 + J.p * TAU) * 0.008 : 0; c.quadraticCurveTo(X(x0 + w / n + trail * 0.3), Y(hem - 0.03 + ph), X(x0), Y(hem + 0.008 * (i % 2) + ph)); }
    c.quadraticCurveTo(X(tX - w * 0.98 + trail * 0.5), Y((sy + hem) / 2 - 0.05), X(tX - sx * 1.08), Y(sy - 0.08));
    c.quadraticCurveTo(X(tX - sx * 0.95), Y(sy + 0.01), X(hx - hr), Y(hy)); c.closePath();
  };
  c.fillStyle = f(col, 1.25); path(); c.fill();
  // the folds + the shade on the side away from the light (soft vertical gradients clipped to the sheet)
  c.save(); path(); c.clip();
  const g = c.createLinearGradient(X(tX - w), 0, X(tX + w), 0); g.addColorStop(0, 'rgba(60,64,96,0.28)'); g.addColorStop(0.35, 'rgba(60,64,96,0)'); g.addColorStop(0.7, 'rgba(60,64,96,0.06)'); g.addColorStop(1, 'rgba(60,64,96,0.34)');
  c.fillStyle = g; c.fillRect(X(tX - w * 1.2), Y(hy + hr), w * 2.4 * H, (hy + hr) * H);
  c.strokeStyle = 'rgba(70,74,104,0.32)'; c.lineWidth = Math.max(0.35, 0.01 * H);
  c.beginPath(); for (const u of [-0.45, 0.1, 0.55]) { c.moveTo(X(tX + u * sx), Y(sy - 0.04)); c.quadraticCurveTo(X(tX + u * w * 0.9 + trail * 0.5), Y(0.35), X(tX + u * w + trail * 0.8), Y(hem + 0.03)); } c.stroke();
  c.restore();
  // the eye holes (+ a small round mouth): from the front + 3/4
  if (J.cz < 0.45 && H > 9) {
    const ax = Math.abs(J.cx), ex = hx + J.cx * hr * 0.38, sp = hr * 0.36 * (1 - ax * 0.55);
    c.fillStyle = 'rgb(14,12,20)';
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(X(ex + s * sp), Y(hy + hr * 0.08), Math.max(0.45, hr * 0.17 * H * (1 - ax * 0.4)), Math.max(0.6, hr * 0.27 * H), 0, 0, TAU); c.fill(); }
    c.beginPath(); c.ellipse(X(ex), Y(hy - hr * 0.48), Math.max(0.35, hr * 0.12 * H), Math.max(0.4, hr * 0.15 * H), 0, 0, TAU); c.fill();
  }
}
/** the costumes over the torso (after the coat / the dress; before the head) */
function costumeTorso(c, J, L, X, Y, H, f, g) {
  const { top, hipY, hem, sx, tX, hX, cz, ax, d } = g, front = cz < 0.45, cx = J.cx;
  if (L.pumpkin) {
    // a round, ribbed pumpkin body from the chest to the hips (the carved face on its front)
    const my = (top + hipY) / 2 - 0.01, rx = sx * 1.75, ry = (top - hipY) * 0.72 + 0.02, mx = (tX + hX) / 2;
    c.fillStyle = f([236, 122, 28], 1.1); c.beginPath(); c.ellipse(X(mx), Y(my), rx * H, ry * H, 0, 0, TAU); c.fill();
    c.strokeStyle = f([176, 76, 16]); c.lineWidth = Math.max(0.35, 0.011 * H);
    c.beginPath(); for (const u of [-0.55, 0, 0.55]) { const ux = mx + (u + cx * 0.2) * rx; c.moveTo(X(ux), Y(my + ry * 0.92)); c.quadraticCurveTo(X(ux + u * rx * 0.35), Y(my), X(ux), Y(my - ry * 0.92)); } c.stroke();
    if (front && H > 10) { c.fillStyle = 'rgb(40,18,8)'; const fx = mx + cx * rx * 0.3; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(X(fx + s * rx * 0.42), Y(my + ry * 0.3)); c.lineTo(X(fx + s * rx * 0.18), Y(my + ry * 0.3)); c.lineTo(X(fx + s * rx * 0.3), Y(my + ry * 0.58)); c.fill(); } c.beginPath(); c.moveTo(X(fx - rx * 0.45), Y(my - ry * 0.2)); c.quadraticCurveTo(X(fx), Y(my - ry * 0.62), X(fx + rx * 0.45), Y(my - ry * 0.2)); c.quadraticCurveTo(X(fx), Y(my - ry * 0.4), X(fx - rx * 0.45), Y(my - ry * 0.2)); c.fill(); }
  }
  if (L.bones) {
    // the ribcage + the spine (from behind: the spine alone)
    c.strokeStyle = f(L.bones, 1.35); c.lineWidth = Math.max(0.35, 0.012 * H); c.lineCap = 'round';
    c.beginPath(); c.moveTo(X(tX), Y(top - 0.01)); c.lineTo(X(hX), Y(hipY + 0.03));
    if (front) for (let i = 0; i < 3; i++) { const y = top - 0.035 - i * 0.032, w = sx * (0.95 - i * 0.12) * (1 - ax * 0.35); c.moveTo(X(tX - w), Y(y - 0.01)); c.quadraticCurveTo(X(tX), Y(y + 0.012), X(tX + w), Y(y - 0.01)); }
    c.stroke();
    c.beginPath(); c.ellipse(X(hX), Y(hipY + 0.025), sx * 0.7 * H, Math.max(0.4, 0.018 * H), 0, 0, TAU); c.stroke();
  }
  if (L.stripes) { c.fillStyle = f(L.stripes); for (let i = 0; i < 3; i++) { const y = top - 0.03 - i * (top - hipY) / 3.3; c.fillRect(X(tX - sx * 0.98), Y(y), sx * 1.96 * H, Math.max(0.5, 0.022 * H)); } }
  if (L.tatters) {
    // a torn hem (dark points along it) + a rip or two — grimy, never gory
    const tc = (L.coat !== 'none' ? L.cols.coat : L.dress ? L.cols.dress : L.cols.shirt).map(v => v * 0.55);
    c.fillStyle = f(tc); const w = sx * 0.95 + 0.02;
    c.beginPath(); for (let i = 0; i < 6; i++) { const u = -w + (2 * w) * (i + 0.5) / 6, h = (i % 2 ? 0.03 : 0.045) * (0.7 + 0.3 * Math.sin(i * 2.3 + L.h * 50)); c.moveTo(X(hX + u - w / 7), Y(hem)); c.lineTo(X(hX + u), Y(hem + h)); c.lineTo(X(hX + u + w / 7), Y(hem)); } c.fill();
    c.strokeStyle = f(tc); c.lineWidth = Math.max(0.3, 0.008 * H); c.beginPath(); c.moveTo(X(tX - sx * 0.4), Y(top - 0.06)); c.lineTo(X(tX - sx * 0.1), Y(top - 0.1)); c.lineTo(X(tX - sx * 0.3), Y(top - 0.13)); c.stroke();
  }
  if (L.shawl) {
    // the REBOZO: a bright shawl over the shoulders, one end falling down the front (from behind: across the back to the waist)
    c.fillStyle = f(L.shawl, 1.1);
    c.beginPath(); c.moveTo(X(tX - sx * 1.12), Y(top + 0.012)); c.lineTo(X(tX + sx * 1.12), Y(top + 0.012)); c.lineTo(X(tX + sx * 1.0), Y(top - 0.12)); c.lineTo(X(tX - sx * 1.0), Y(top - 0.12)); c.closePath(); c.fill();
    // (its end falls down the FRONT — the side they face — tapering to a fringe at the hip)
    if (front) { const ex = tX + (Math.abs(cx) > 0.3 ? Math.sign(cx) : -1) * sx * 0.42, w0 = sx * 0.3, w1 = sx * 0.2; c.beginPath(); c.moveTo(X(ex - w0), Y(top - 0.1)); c.lineTo(X(ex + w0), Y(top - 0.1)); c.lineTo(X(ex + w1 + cx * 0.01), Y(hipY - 0.02)); c.lineTo(X(ex - w1 + cx * 0.01), Y(hipY - 0.02)); c.closePath(); c.fill(); }
    else { c.beginPath(); c.moveTo(X(tX - sx), Y(top - 0.1)); c.lineTo(X(tX + sx), Y(top - 0.1)); c.lineTo(X(hX), Y(hipY + 0.02)); c.closePath(); c.fill(); }
    c.strokeStyle = f(L.shawl.map(v => v * 0.7)); c.lineWidth = Math.max(0.3, 0.008 * H); c.beginPath(); c.moveTo(X(tX - sx), Y(top - 0.075)); c.lineTo(X(tX + sx), Y(top - 0.075)); c.stroke();
  }
  if (L.sash) { c.strokeStyle = f(L.sash, 1.1); c.lineWidth = Math.max(0.6, 0.03 * H); c.beginPath(); c.moveTo(X(tX - sx * 0.9 * d), Y(top - 0.01)); c.lineTo(X(hX + sx * 0.9 * d), Y(hipY + 0.04)); c.stroke(); }
  if (L.charro && front) {
    // the charro jacket's silver: a short bolero's edges + the buttons down the trousers' outer seams
    c.strokeStyle = f([210, 206, 196], 1.3); c.lineWidth = Math.max(0.3, 0.008 * H);
    c.beginPath(); c.moveTo(X(tX - sx * 0.5), Y(top)); c.lineTo(X(tX - sx * 0.62), Y(hipY + 0.08)); c.moveTo(X(tX + sx * 0.5), Y(top)); c.lineTo(X(tX + sx * 0.62), Y(hipY + 0.08)); c.stroke();
    c.fillStyle = f([226, 222, 212], 1.4); for (const i of [0, 1]) { const kn = J.knees[i], hp = J.hips[i]; for (let k = 0; k < 3; k++) { const u = 0.25 + k * 0.3; c.beginPath(); c.arc(X(hp[0] + (kn[0] - hp[0]) * u + 0.025), Y(hp[1] + (kn[1] - hp[1]) * u), Math.max(0.3, 0.007 * H), 0, TAU); c.fill(); } }
  }
  if (L.cape && L.cape.collar && J.cz < 0.5) {
    // THE VAMPIRE's high collar standing up behind the head (red inside, black out)
    for (const s of [-1, 1]) { const x0 = tX + s * sx * 0.95, x1 = tX + s * sx * 0.25; c.fillStyle = f(L.cape.col); c.beginPath(); c.moveTo(X(x0), Y(top + 0.005)); c.lineTo(X(tX + s * sx * 1.25), Y(top + 0.15)); c.lineTo(X(x1), Y(top + 0.04)); c.closePath(); c.fill(); c.fillStyle = f(L.cape.lining, 1.1); c.beginPath(); c.moveTo(X(tX + s * sx * 0.85), Y(top + 0.02)); c.lineTo(X(tX + s * sx * 1.12), Y(top + 0.12)); c.lineTo(X(tX + s * sx * 0.4), Y(top + 0.045)); c.closePath(); c.fill(); }
  }
}
/** the faces of the holidays (no drawn features on everyday people — the owner; these costumes ARE their faces): a skull's sockets, a
 *  Catrina's calavera (the sockets ringed in colour), a zombie's sunken eyes, the pirate's patch, the cat's nose + whiskers, a hero's mask */
function face(c, J, L, X, Y, H, f, hx, hy, hr) {
  if (!L.face || J.cz > 0.5 || H < 10) return;
  const ax = Math.abs(J.cx), ex = hx + J.cx * hr * 0.4, sp = hr * 0.37 * (1 - ax * 0.55), ey = hy + hr * 0.12, R = (k) => Math.max(0.4, hr * k * H);
  const eyes = (col, rx, ry) => { c.fillStyle = col; for (const s of [-1, 1]) { if (ax > 0.75 && s === -Math.sign(J.cx)) continue; c.beginPath(); c.ellipse(X(ex + s * sp), Y(ey), R(rx) * (1 - ax * 0.35), R(ry), 0, 0, TAU); c.fill(); } };
  if (L.face === 'skull' || L.face === 'calavera') {
    if (L.face === 'calavera') eyes(f([206, 46, 120], 1.3), 0.3, 0.3);
    eyes('rgb(16,12,18)', 0.21, 0.23);
    c.fillStyle = 'rgb(20,14,20)'; c.beginPath(); c.moveTo(X(ex - hr * 0.07), Y(hy - hr * 0.2)); c.lineTo(X(ex + hr * 0.07), Y(hy - hr * 0.2)); c.lineTo(X(ex), Y(hy - hr * 0.05)); c.fill();
    c.strokeStyle = 'rgba(20,14,20,0.8)'; c.lineWidth = Math.max(0.25, 0.006 * H); c.beginPath(); c.moveTo(X(ex - hr * 0.3), Y(hy - hr * 0.48)); c.lineTo(X(ex + hr * 0.3), Y(hy - hr * 0.48)); for (let i = -2; i <= 2; i++) { c.moveTo(X(ex + i * hr * 0.12), Y(hy - hr * 0.4)); c.lineTo(X(ex + i * hr * 0.12), Y(hy - hr * 0.56)); } c.stroke();
  } else if (L.face === 'zombie') { eyes('rgba(30,34,26,0.85)', 0.2, 0.16); c.fillStyle = 'rgba(40,30,30,0.8)'; c.fillRect(X(ex - hr * 0.22), Y(hy - hr * 0.42), hr * 0.44 * H, Math.max(0.35, hr * 0.12 * H)); }
  else if (L.face === 'patch') { const s = J.cx >= 0 ? 1 : -1; c.fillStyle = 'rgb(16,14,18)'; c.beginPath(); c.ellipse(X(ex + s * sp), Y(ey), R(0.2), R(0.2), 0, 0, TAU); c.fill(); c.strokeStyle = 'rgb(16,14,18)'; c.lineWidth = Math.max(0.25, 0.007 * H); c.beginPath(); c.moveTo(X(hx - hr), Y(hy + hr * 0.45)); c.lineTo(X(hx + hr), Y(hy - hr * 0.05)); c.stroke(); }
  else if (L.face === 'cat') { c.fillStyle = 'rgb(236,150,170)'; c.beginPath(); c.arc(X(ex), Y(hy - hr * 0.12), R(0.1), 0, TAU); c.fill(); c.strokeStyle = 'rgba(230,226,220,0.75)'; c.lineWidth = Math.max(0.2, 0.005 * H); c.beginPath(); for (const s of [-1, 1]) for (const k of [-0.08, 0.06]) { c.moveTo(X(ex + s * hr * 0.15), Y(hy - hr * 0.2)); c.lineTo(X(ex + s * hr * 0.75), Y(hy - hr * 0.2 + k * hr * 3)); } c.stroke(); }
  else if (L.face === 'mask' && L.mask) { c.fillStyle = f(L.mask, 1.1); c.fillRect(X(hx - hr * 0.98), Y(ey + hr * 0.22), hr * 1.96 * H, R(0.42)); eyes('rgb(236,232,226)', 0.13, 0.09); }
}
/** the holidays' hats */
const HATS = {
  // the witch's hat: a wide brim, a tall cone whose tip flops back, a coloured band
  witch(c, L, X, Y, H, hx, hy, hr, J, f) {
    const by = hy + hr * 0.55, tipX = hx - J.cx * hr * 0.9 + hr * 0.25, tipY = hy + hr * 3.5;
    c.beginPath(); c.ellipse(X(hx), Y(by), hr * 2.3 * H, Math.max(0.6, hr * 0.34 * H), 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(X(hx - hr * 0.95), Y(by)); c.quadraticCurveTo(X(hx - hr * 0.55), Y(hy + hr * 2.2), X(tipX), Y(tipY)); c.quadraticCurveTo(X(hx + hr * 0.4), Y(hy + hr * 2.0), X(hx + hr * 0.95), Y(by)); c.closePath(); c.fill();
    if (L.cols.band) { c.fillStyle = f(L.cols.band, 1.2); c.beginPath(); c.moveTo(X(hx - hr * 0.93), Y(by + hr * 0.05)); c.lineTo(X(hx + hr * 0.93), Y(by + hr * 0.05)); c.lineTo(X(hx + hr * 0.82), Y(by + hr * 0.42)); c.lineTo(X(hx - hr * 0.84), Y(by + hr * 0.42)); c.closePath(); c.fill(); }
  },
  // cat ears (+ their pink insides from the front)
  ears(c, L, X, Y, H, hx, hy, hr, J, f) {
    for (const s of [-1, 1]) { const ex = hx + s * hr * 0.55 * (1 - Math.abs(J.cx) * 0.4); c.beginPath(); c.moveTo(X(ex - hr * 0.38), Y(hy + hr * 0.62)); c.lineTo(X(ex + s * hr * 0.12), Y(hy + hr * 1.55)); c.lineTo(X(ex + hr * 0.38), Y(hy + hr * 0.7)); c.closePath(); c.fill(); }
    if (J.cz < 0.3) { c.fillStyle = f([226, 140, 160]); for (const s of [-1, 1]) { const ex = hx + s * hr * 0.55 * (1 - Math.abs(J.cx) * 0.4); c.beginPath(); c.moveTo(X(ex - hr * 0.18), Y(hy + hr * 0.78)); c.lineTo(X(ex + s * hr * 0.08), Y(hy + hr * 1.3)); c.lineTo(X(ex + hr * 0.18), Y(hy + hr * 0.82)); c.closePath(); c.fill(); } }
  },
  // the pumpkin's stem cap: a little green cap + a curled stem
  stem(c, L, X, Y, H, hx, hy, hr, J, f) {
    c.beginPath(); c.ellipse(X(hx), Y(hy + hr * 0.62), hr * 1.02 * H, hr * 0.5 * H, 0, Math.PI, 0); c.fill();
    c.strokeStyle = f([88, 132, 52]); c.lineWidth = Math.max(0.5, hr * 0.32 * H); c.lineCap = 'round'; c.beginPath(); c.moveTo(X(hx), Y(hy + hr * 1.05)); c.quadraticCurveTo(X(hx + hr * 0.1), Y(hy + hr * 1.6), X(hx + hr * 0.5), Y(hy + hr * 1.55)); c.stroke();
  },
  // the pirate's bandana: tight over the crown, its knot's two tails behind
  bandana(c, L, X, Y, H, hx, hy, hr, J, f) {
    c.beginPath(); c.arc(X(hx), Y(hy + hr * 0.18), hr * 1.06 * H, Math.PI + 0.12, -0.12); c.closePath(); c.fill();
    const bx = hx - J.cx * hr * 0.95, s = J.cx >= 0 ? -1 : 1; c.beginPath(); c.moveTo(X(bx), Y(hy + hr * 0.4)); c.lineTo(X(bx + s * hr * 0.7), Y(hy - hr * 0.2)); c.lineTo(X(bx + s * hr * 0.25), Y(hy - hr * 0.1)); c.closePath(); c.fill();
    c.fillStyle = f([244, 240, 232]); for (const u of [-0.5, 0.2]) { c.beginPath(); c.arc(X(hx + u * hr), Y(hy + hr * 0.75), Math.max(0.3, hr * 0.1 * H), 0, TAU); c.fill(); }
  },
  // the Catrina's hat: a very wide dark brim, a low crown, a mound of flowers + a plume
  catrina(c, L, X, Y, H, hx, hy, hr, J, f) {
    const by = hy + hr * 0.6;
    c.beginPath(); c.ellipse(X(hx), Y(by), hr * 2.75 * H, Math.max(0.7, hr * 0.42 * H), -0.08 * J.cx, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(X(hx), Y(by + hr * 0.28), hr * 0.95 * H, hr * 0.48 * H, 0, Math.PI, 0); c.fill();
    const fl = [[255, 70, 90], [255, 196, 40], [255, 130, 30], [250, 110, 200], [250, 246, 236]], k = Math.max(0.5, hr * 0.3 * H);
    for (let i = 0; i < 6; i++) { const u = (i - 2.5) / 2.5; c.fillStyle = f(fl[i % fl.length], 1.35); c.beginPath(); c.arc(X(hx + u * hr * 1.1 + J.cx * hr * 0.2), Y(by + hr * (0.55 + 0.25 * (1 - u * u))), k, 0, TAU); c.fill(); }
    c.strokeStyle = f([240, 236, 226], 1.2); c.lineWidth = Math.max(0.4, hr * 0.14 * H); c.lineCap = 'round'; c.beginPath(); c.moveTo(X(hx + hr * 0.6), Y(by + hr * 0.6)); c.quadraticCurveTo(X(hx + hr * 1.5), Y(by + hr * 1.8), X(hx + hr * 2.1), Y(by + hr * 1.3)); c.stroke();
  },
  // a crown of marigolds (+ a pink + a red bloom)
  crown(c, L, X, Y, H, hx, hy, hr, J, f) {
    const fl = [[255, 150, 20], [255, 196, 40], [255, 120, 20], [240, 70, 110], [255, 170, 30], [210, 40, 60]], k = Math.max(0.5, hr * 0.28 * H);
    for (let i = 0; i < 6; i++) { const a = Math.PI * (0.05 + 0.9 * i / 5), x = hx + Math.cos(a) * hr * 1.0 * (1 - Math.abs(J.cx) * 0.25), y = hy + hr * 0.45 + Math.sin(a) * hr * 0.42; c.fillStyle = f(fl[i], 1.35); c.beginPath(); c.arc(X(x), Y(y), k, 0, TAU); c.fill(); }
  },
  // the mariachi's SOMBRERO: a huge upturned brim, a tall rounded crown, a silver band
  sombrero(c, L, X, Y, H, hx, hy, hr, J, f) {
    const by = hy + hr * 0.62;
    c.beginPath(); c.moveTo(X(hx - hr * 3.0), Y(by + hr * 0.35)); c.quadraticCurveTo(X(hx - hr * 2.4), Y(by - hr * 0.22), X(hx), Y(by - hr * 0.15)); c.quadraticCurveTo(X(hx + hr * 2.4), Y(by - hr * 0.22), X(hx + hr * 3.0), Y(by + hr * 0.35)); c.quadraticCurveTo(X(hx + hr * 2.2), Y(by + hr * 0.1), X(hx), Y(by + hr * 0.12)); c.quadraticCurveTo(X(hx - hr * 2.2), Y(by + hr * 0.1), X(hx - hr * 3.0), Y(by + hr * 0.35)); c.fill();
    c.beginPath(); c.moveTo(X(hx - hr * 0.9), Y(by)); c.quadraticCurveTo(X(hx - hr * 0.8), Y(hy + hr * 2.6), X(hx), Y(hy + hr * 2.7)); c.quadraticCurveTo(X(hx + hr * 0.8), Y(hy + hr * 2.6), X(hx + hr * 0.9), Y(by)); c.closePath(); c.fill();
    c.fillStyle = f([214, 210, 198], 1.35); c.fillRect(X(hx - hr * 0.88), Y(by + hr * 0.42), hr * 1.76 * H, Math.max(0.4, hr * 0.2 * H));
    c.strokeStyle = f([214, 210, 198], 1.2); c.lineWidth = Math.max(0.25, hr * 0.08 * H); c.beginPath(); c.moveTo(X(hx - hr * 2.9), Y(by + hr * 0.3)); c.quadraticCurveTo(X(hx), Y(by - hr * 0.05), X(hx + hr * 2.9), Y(by + hr * 0.3)); c.stroke();
  },
  // a zombie bride's veil: a long torn sheer veil off the crown, down the back
  veil(c, L, X, Y, H, hx, hy, hr, J, f) {
    const s = J.cx >= 0 ? -1 : 1, col = f([226, 222, 210], 1.1);
    c.save(); c.globalAlpha *= 0.6; c.fillStyle = col; c.beginPath(); c.moveTo(X(hx - hr * 0.9), Y(hy + hr * 0.8)); c.lineTo(X(hx + hr * 0.9), Y(hy + hr * 0.8)); c.lineTo(X(hx + s * hr * 1.6 + hr), Y(hy - 0.32)); c.lineTo(X(hx + s * hr * 1.9 - hr), Y(hy - 0.28)); c.closePath(); c.fill(); c.restore();
    c.fillStyle = col; c.beginPath(); c.ellipse(X(hx), Y(hy + hr * 0.82), hr * 0.9 * H, hr * 0.3 * H, 0, 0, TAU); c.fill();
  },
};
/** what the holidays' people carry + its light: a jack-o'-lantern bucket (its carved face glowing after dark), a pillowcase, a glow stick,
 *  the grown-up's torch (its beam on the cobbles), a broom, the procession's CANDLE (its flame + a warm glow on the face + hands), a bunch of
 *  marigolds, a framed photo held up, the mariachis' guitar / trumpet / violin */
function holidayCarry(c, J, L, X, Y, H, f, env, hand) {
  const hc = L.hcarry, nk = nightOf(env), t = env.t || 0, mo = env.mo !== false, [hx, hy] = hand, d = J.cx >= 0 ? 1 : -1, seed = L.h * 977;
  const flick = mo ? 0.82 + 0.12 * Math.sin(t * 13.3 + seed) + 0.06 * Math.sin(t * 31.7 + seed * 1.7) : 0.9;
  if (hc === 'bucket') {
    const r = H * 0.048, bx = hx, by = hy + r * 1.05;
    c.strokeStyle = f([40, 34, 30]); c.lineWidth = Math.max(0.3, H * 0.008); c.beginPath(); c.moveTo(bx - r * 0.9, by - r * 0.4); c.quadraticCurveTo(bx, hy - r * 0.2, bx + r * 0.9, by - r * 0.4); c.stroke();
    c.fillStyle = f([240, 124, 24], 1.15); c.beginPath(); c.ellipse(bx, by, r, r * 0.9, 0, 0, TAU); c.fill();
    if (H > 12) {
      const lit = nk > 0.2, fc = lit ? `rgba(255,${(196 + 30 * flick) | 0},90,${(0.55 + 0.45 * nk).toFixed(2)})` : 'rgb(50,22,8)';
      c.fillStyle = fc; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(bx + s * r * 0.55, by - r * 0.15); c.lineTo(bx + s * r * 0.15, by - r * 0.15); c.lineTo(bx + s * r * 0.35, by - r * 0.5); c.fill(); }
      c.beginPath(); c.moveTo(bx - r * 0.55, by + r * 0.15); c.quadraticCurveTo(bx, by + r * 0.75, bx + r * 0.55, by + r * 0.15); c.quadraticCurveTo(bx, by + r * 0.4, bx - r * 0.55, by + r * 0.15); c.fill();
    }
    if (nk > 0.2) glow(c, bx, by, H * 0.12, 0.32 * nk * flick);
  } else if (hc === 'pillowcase') {
    c.fillStyle = f([232, 230, 224], 1.2); c.beginPath(); c.moveTo(hx - H * 0.012, hy); c.quadraticCurveTo(hx - H * 0.06, hy + H * 0.05, hx - H * 0.035, hy + H * 0.11); c.lineTo(hx + H * 0.04, hy + H * 0.11); c.quadraticCurveTo(hx + H * 0.06, hy + H * 0.05, hx + H * 0.012, hy); c.closePath(); c.fill();
  } else if (hc === 'torch') {
    c.fillStyle = f([60, 58, 66], 1.2); c.beginPath(); c.arc(hx, hy, Math.max(0.5, H * 0.014), 0, TAU); c.fill();
    if (nk > 0.25) {
      // the beam on the cobbles ahead (a soft cone down to a pool) — the torch's own light, so it reads in the dark between the lamps
      const gx = hx + d * H * 0.75 * Math.max(0.35, Math.abs(J.cx)), gy = hy + H * 0.62 * (J.cz < -0.3 ? 1.15 : 1);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 * nk;
      const g = c.createLinearGradient(hx, hy, gx, gy); g.addColorStop(0, 'rgba(255,240,200,0.9)'); g.addColorStop(1, 'rgba(255,240,200,0.15)');
      c.fillStyle = g; c.beginPath(); c.moveTo(hx, hy); c.lineTo(gx - H * 0.18, gy); c.lineTo(gx + H * 0.18, gy); c.closePath(); c.fill(); c.restore();
      c.save(); c.translate(gx, gy); c.scale(1, 0.32); glow(c, 0, 0, H * 0.24, 0.5 * nk); c.restore();
      glow(c, hx, hy, H * 0.05, 0.6 * nk);
    }
  } else if (hc === 'broom') {
    c.strokeStyle = f([110, 76, 44]); c.lineWidth = Math.max(0.4, H * 0.012); c.beginPath(); c.moveTo(hx - d * H * 0.12, hy - H * 0.14); c.lineTo(hx + d * H * 0.16, hy + H * 0.3); c.stroke();
    c.fillStyle = f([176, 140, 70]); c.beginPath(); c.moveTo(hx + d * H * 0.13, hy + H * 0.25); c.lineTo(hx + d * H * 0.26, hy + H * 0.4); c.lineTo(hx + d * H * 0.12, hy + H * 0.42); c.closePath(); c.fill();
  } else if (hc === 'candle') {
    // the candle: a short white pillar in the cupped hands, its flame (a hot white core in an amber teardrop), a warm glow on the face
    const cw = Math.max(0.7, H * 0.016), ch = Math.max(1.2, H * 0.04), fx = hx, fy = hy - ch - H * 0.004;
    c.fillStyle = f([240, 232, 210], 1.4); c.fillRect(fx - cw / 2, hy - ch, cw, ch);
    const fh = Math.max(1.7, H * 0.04) * flick, fw = Math.max(0.75, H * 0.013), sway = mo ? Math.sin(t * 5 + seed) * fw * 0.3 : 0;
    c.fillStyle = 'rgba(255,170,60,0.95)'; c.beginPath(); c.moveTo(fx - fw, fy); c.quadraticCurveTo(fx - fw, fy - fh * 0.55, fx + sway, fy - fh); c.quadraticCurveTo(fx + fw, fy - fh * 0.55, fx + fw, fy); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,250,226,1)'; c.beginPath(); c.ellipse(fx, fy - fh * 0.3, fw * 0.5, fh * 0.3, 0, 0, TAU); c.fill();
    // (the light: a wide warm glow round the hands + the face — never smaller than a few points, so a far walker still reads as a warm
    // point in the line — a hot core, and its pool on the ground at their feet: at night the line reads as a river of candles)
    const a = 0.08 + 0.92 * nk;
    glow(c, fx, fy - fh * 0.4, Math.max(15, H * 0.95), a * flick, true);
    glow(c, fx, fy - fh * 0.4, Math.max(5, H * 0.2), (0.8 + 0.2 * nk) * flick);
    glow(c, X(J.head[0]), Y(J.head[1] - 0.02), Math.max(3, H * 0.09), 0.4 * nk * flick);     // (the face in its light)
    if (nk > 0.2) { c.save(); c.translate(X(0), Y(0)); c.scale(1, 0.3); glow(c, 0, 0, Math.max(7, H * 0.42), 0.45 * nk * flick, true); c.restore(); }
  } else if (hc === 'marigolds') {
    const k = Math.max(0.6, H * 0.018);
    c.fillStyle = f([60, 110, 50]); c.fillRect(hx - k * 0.4, hy - k * 0.5, k * 0.8, k * 3);
    for (const [ox, oy, col] of [[0, -2.2, [255, 150, 20]], [-1.3, -1.4, [255, 190, 40]], [1.3, -1.5, [255, 120, 20]], [-0.6, -3.3, [255, 170, 30]], [0.8, -3.1, [255, 140, 20]]]) { c.fillStyle = f(col, 1.35); c.beginPath(); c.arc(hx + ox * k, hy + oy * k, k * 1.05, 0, TAU); c.fill(); }
    if (nk > 0.2) glow(c, hx, hy - H * 0.05, H * 0.1, 0.08 * nk);
  } else if (hc === 'photo') {
    const w = Math.max(1.5, H * 0.07), h = w * 1.25, x0 = hx - w / 2, y0 = hy - h - H * 0.01;
    c.fillStyle = f([200, 164, 80], 1.3); c.fillRect(x0, y0, w, h);
    c.fillStyle = f([60, 54, 50], 1.1); c.fillRect(x0 + w * 0.14, y0 + h * 0.12, w * 0.72, h * 0.76);
    c.fillStyle = f([196, 184, 164], 1.25); c.beginPath(); c.ellipse(hx, y0 + h * 0.42, w * 0.18, h * 0.17, 0, 0, TAU); c.fill(); c.fillRect(hx - w * 0.26, y0 + h * 0.62, w * 0.52, h * 0.26);
    if (nk > 0.2) glow(c, hx, y0 + h / 2, H * 0.09, 0.12 * nk);
  } else if (hc === 'guitar') {
    // the guitar across the body: its two-lobed body at the near hip (the soundhole), the neck up across to the far hand
    const fa = J.hands[1 - J.near], bx = X(J.hip[0] + J.cx * 0.05), by = Y(J.hip[1] + 0.08), nx = X(fa[0]), ny = Y(fa[1]);
    c.strokeStyle = f([80, 50, 30]); c.lineWidth = Math.max(0.5, H * 0.016); c.beginPath(); c.moveTo(bx, by); c.lineTo(nx, ny); c.stroke();
    c.fillStyle = f([188, 120, 56], 1.15); c.beginPath(); c.ellipse(bx, by + H * 0.012, H * 0.065, H * 0.05, 0.4 * d, 0, TAU); c.fill(); c.beginPath(); c.ellipse(bx + (nx - bx) * 0.18, by + (ny - by) * 0.18, H * 0.048, H * 0.038, 0.4 * d, 0, TAU); c.fill();
    c.fillStyle = 'rgb(30,20,14)'; c.beginPath(); c.arc(bx + (nx - bx) * 0.1, by + (ny - by) * 0.1, Math.max(0.35, H * 0.014), 0, TAU); c.fill();
  } else if (hc === 'trumpet') {
    const mx = X(J.head[0] + J.cx * 0.06), my = Y(J.head[1] - 0.04), ex = mx + d * H * 0.2, ey = my + H * 0.01;
    c.strokeStyle = f([226, 184, 80], 1.35); c.lineWidth = Math.max(0.5, H * 0.014); c.beginPath(); c.moveTo(mx, my); c.lineTo(ex, ey); c.stroke();
    c.fillStyle = f([240, 200, 90], 1.4); c.beginPath(); c.moveTo(ex, ey - H * 0.006); c.lineTo(ex + d * H * 0.045, ey - H * 0.03); c.lineTo(ex + d * H * 0.045, ey + H * 0.03); c.lineTo(ex, ey + H * 0.006); c.closePath(); c.fill();
  } else if (hc === 'violin') {
    const fa = J.hands[1 - J.near], cx0 = X(J.sh[0] + J.cx * 0.02), cy0 = Y(J.sh[1] - 0.03), nx = X(fa[0]), ny = Y(fa[1]);
    c.strokeStyle = f([60, 36, 22]); c.lineWidth = Math.max(0.4, H * 0.01); c.beginPath(); c.moveTo(cx0, cy0); c.lineTo(nx, ny); c.stroke();
    c.fillStyle = f([150, 70, 30], 1.2); c.beginPath(); c.ellipse(cx0 + (nx - cx0) * 0.2, cy0 + (ny - cy0) * 0.2, H * 0.04, H * 0.026, Math.atan2(ny - cy0, nx - cx0), 0, TAU); c.fill();
    c.strokeStyle = f([220, 210, 190], 1.2); c.lineWidth = Math.max(0.25, H * 0.005); c.beginPath(); c.moveTo(hx - d * H * 0.12, hy + H * 0.03); c.lineTo(hx + d * H * 0.08, hy - H * 0.03); c.stroke();
  }
  if (L.glowstick) {
    const o = J.hands[1 - J.near], gx = X(o[0]), gy = Y(o[1]), col = L.glowstick, a = 0.5 + 0.5 * nk;
    c.save(); c.strokeStyle = `rgba(${col.join(',')},${a.toFixed(2)})`; c.lineWidth = Math.max(0.6, H * 0.016); c.lineCap = 'round';
    c.beginPath(); c.moveTo(gx - d * H * 0.02, gy + H * 0.03); c.lineTo(gx + d * H * 0.03, gy - H * 0.05); c.stroke();
    if (nk > 0.2) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${col.join(',')},${(0.25 * nk).toFixed(2)})`; c.lineWidth = Math.max(1.5, H * 0.06); c.stroke(); }
    c.restore();
  }
}
/** THE OFRENDA between its two bearers (people.js: their shoulder points on screen): the poles shoulder to shoulder, a little stepped altar
 *  on them — a marigold-orange cloth, two tiers of marigolds, a framed photo, candles glowing (their light on the poles + the bearers) */
export function drawOfrenda(c, a, b, H, env) {
  const nk = nightOf(env), t = env.t || 0, mo = env.mo !== false, dk = col => col.map(v => v * (1 - 0.55 * nk));
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + H * 0.01, w = Math.min(Math.abs(b[0] - a[0]) * 0.55, H * 0.42);
  c.save();
  c.strokeStyle = rgb(dk([96, 66, 40])); c.lineWidth = Math.max(0.6, H * 0.016); c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  c.fillStyle = rgb(dk([236, 128, 30])); c.fillRect(mx - w / 2, my - H * 0.03, w, H * 0.05);                         // (the cloth over the base)
  c.fillStyle = rgb(dk([150, 40, 110])); c.fillRect(mx - w / 2, my + H * 0.01, w, H * 0.012);
  c.fillStyle = rgb(dk([120, 84, 52])); c.fillRect(mx - w * 0.32, my - H * 0.09, w * 0.64, H * 0.06);              // (the upper tier)
  const fl = [[255, 150, 20], [255, 196, 40], [255, 120, 20]], k = Math.max(0.6, H * 0.02);
  for (let i = 0; i < 7; i++) { c.fillStyle = rgb(dk(fl[i % 3]).map(v => Math.min(255, v * 1.15))); c.beginPath(); c.arc(mx - w / 2 + w * (i + 0.5) / 7, my - H * 0.035, k, 0, TAU); c.fill(); }
  c.fillStyle = rgb(dk([200, 164, 80])); c.fillRect(mx - H * 0.03, my - H * 0.17, H * 0.06, H * 0.08);              // (the photo)
  c.fillStyle = rgb(dk([60, 54, 50])); c.fillRect(mx - H * 0.022, my - H * 0.16, H * 0.044, H * 0.06);
  for (const s of [-1, 1]) {
    const cx0 = mx + s * w * 0.28, cy0 = my - H * 0.09, fl2 = mo ? 0.85 + 0.15 * Math.sin(t * 12 + s * 3) : 0.9;
    c.fillStyle = 'rgb(236,228,206)'; c.fillRect(cx0 - H * 0.008, cy0 - H * 0.04, H * 0.016, H * 0.04);
    c.fillStyle = 'rgba(255,200,110,0.95)'; c.beginPath(); c.ellipse(cx0, cy0 - H * 0.055, H * 0.008, H * 0.016 * fl2, 0, 0, TAU); c.fill();
    glow(c, cx0, cy0 - H * 0.055, H * 0.22, (0.2 + 0.5 * nk) * fl2);
  }
  c.restore();
}
