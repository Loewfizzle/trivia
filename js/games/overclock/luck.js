// OVERCLOCK — DUMB LUCK (OC5): the 19th challenge, a neon horse race you bet on. PURE (no imports but the seeded RNG) — the director, every
// phone's race and the SERVER's replay (core/match-report.js#overclockExtra) all use these same functions. docs/overclock.md "OC5".
//
//  - A FIXED FIELD OF 6 HORSES every race, any player count, each in its own lane + colour (the same on every phone — a room yells colours;
//    NO orange horse). The six ODDS are shuffled across the colours per race (seeded from the match seed + the challenge index).
//  - HONEST ODDS: a horse's posted odds n-1 imply a chance 1 / (n + 1); the six are NORMALISED to sum to 1 (their ratios kept) — that IS each
//    horse's real win chance. The PAYOUT is set so every pick has the SAME expected value: payout ∝ 1 / chance ∝ (n + 1) → 20 × (n + 1) points
//    (2-1 → 60 · 3-1 → 80 · 4-1 → 100 · 5-1 → 120 · 8-1 → 180 · 12-1 → 260 — in units of one normal challenge's 100: 0.6 · 0.8 · 1 · 1.2 ·
//    1.8 · 2.6). Whole points, exactly equal EV (20 / Σ 1/(n+1) ≈ 17.6 a pick). A favourite vs a long shot is a risk choice, never an edge.
//  - THE DRAW happens AFTER the picks lock, on the host, from a hash of the match seed + the challenge + EVERY locked pick + the lock's server
//    time (ms): nothing a phone can see before the lock fixes it (the lock's exact ms is the host's serverNow at its tick). It is stored once
//    (game/dl/{ci}: { pk, lk, w }) — a new host reads it, never re-draws; the server replays it from that record.
//  - THE RACE SCRIPT: the drawn winner + the seed → every horse's position over the race (lead changes, a fader, a charge from the back, an
//    occasional photo finish), always ending with the drawn winner first. A refresh mid-race lands on the same frame (serverNow − lk).
import { rngFrom, shuffle } from '../../core/rng.js';

export const LUCK = 'dumbluck';
// THE TIMES (≈ 27 s — one challenge slot, inside CHALLENGE_MS 30 s; it can't end early: everyone watches)
export const DL_PICK_MS = 7_000;      // THE ODDS BOARD: pick (changeable) until it locks
export const DL_RACE_MS = 16_000;     // THE RACE: from the lock (game/dl/{ci}/lk) to the winner's nose on the line
export const DL_FINISH_MS = 4_000;    // THE FINISH: the photo-finish freeze, the winner's colour, LONG SHOT!, the payouts
export const DL_MS = DL_PICK_MS + DL_RACE_MS + DL_FINISH_MS;

// THE FIELD — lane order = this order (lane 1 PINK … lane 6 ICE WHITE). The colours are the race's own (never the OVERDRIVE orange).
export const HORSES = Object.freeze([
  { k: 'pink', name: 'PINK', c: '#ff3fa4' },
  { k: 'green', name: 'GREEN', c: '#39ff7a' },
  { k: 'cyan', name: 'CYAN', c: '#2fe6ff' },
  { k: 'yellow', name: 'YELLOW', c: '#ffe23a' },
  { k: 'purple', name: 'PURPLE', c: '#b45cff' },
  { k: 'ice', name: 'ICE WHITE', c: '#e8f6ff' },
]);
export const ODDS = Object.freeze([2, 3, 4, 5, 8, 12]);
export const LONG_SHOT = 8;             // 8-1 and 12-1 wins = LONG SHOT!
export const PAY_UNIT = 20;             // a ticket's payout = PAY_UNIT × (n + 1)
export const payout = n => PAY_UNIT * (Math.round(n) + 1);
const IMPLIED_SUM = ODDS.reduce((s, n) => s + 1 / (n + 1), 0);
/** a horse's REAL win chance from its posted odds (the six normalised to 1) */
export const chanceOf = n => 1 / (n + 1) / IMPLIED_SUM;
/** every pick's expected payout (the same for all six) */
export const DL_EV = PAY_UNIT / IMPLIED_SUM;
/** the most one Dumb Luck can score (the server's bound) */
export const DL_MAX = payout(Math.max(...ODDS));

/** the race's field: the odds of each lane (seeded per race) → [n, n, n, n, n, n] */
export function dlField(seed, ci) {
  return shuffle(rngFrom(`${seed}:${ci}:${LUCK}:field`), ODDS);
}

/** a board's pick: the horse's lane (0–5) or -1. A pick rides the board's EXISTING fields (no rules change): n = 6, p = lane + 1, ok = 0. */
export function pickOf(board) {
  const b = board || {};
  const p = Number(b.p), n = Number(b.n);
  return n === HORSES.length && Number.isInteger(p) && p >= 1 && p <= HORSES.length ? p - 1 : -1;
}
/** the board a phone writes for a pick of lane h (0–5) */
export const pickBoard = h => ({ p: h + 1, ok: 0, n: HORSES.length, done: false });
/** every participant's locked pick from the boards → { uid: lane } (no pick = no ticket) */
export function lockPicks(participants, boards) {
  const out = {};
  for (const uid of Object.keys(participants || {}).sort()) {
    const h = pickOf(boards && boards[uid]);
    if (h >= 0) out[uid] = h;
  }
  return out;
}
const picksKey = pk => Object.keys(pk || {}).sort().map(u => `${u}=${pk[u]}`).join(',');

/** THE DRAW: the winning lane from the match seed + the challenge + every locked pick + the lock's ms. Deterministic; the odds are honest. */
export function dlDraw(seed, ci, field, pk, lk) {
  const r = rngFrom(`${seed}|${ci}|${LUCK}|draw|${picksKey(pk)}|${Math.round(Number(lk) || 0)}`);
  r(); r();                               // (mix past the first outputs of a near-identical string)
  let u = r();
  for (let h = 0; h < field.length; h++) {
    u -= chanceOf(field[h]);
    if (u < 0) return h;
  }
  return field.length - 1;
}

/** the lock: what the director stores at game/dl/{ci} once the odds board closes — { pk, lk, w } */
export function dlLock(game, ci, boards, now) {
  const field = dlField(game.seed, ci);
  const pk = lockPicks(game.participants, boards);
  const lk = Math.round(now);
  return { pk, lk, w: dlDraw(game.seed, ci, field, pk, lk) };
}

/** the results of a race: winners get their horse's payout, everyone else 0 → { uid: { pts, ok, parts: 1 } } */
export function dlResults(game, ci, dl) {
  const field = dlField(game.seed, ci);
  const w = dl && Number.isInteger(dl.w) ? dl.w : -1;
  const out = {};
  for (const uid of Object.keys(game.participants || {})) {
    const h = dl && dl.pk && Number.isInteger(dl.pk[uid]) ? dl.pk[uid] : -1;
    const won = w >= 0 && h === w;
    out[uid] = { pts: won ? payout(field[w]) : 0, ok: won ? 1 : 0, parts: 1 };
  }
  return out;
}

/** the stored race as the game state holds it (game/dl/{ci}) — or null */
export function dlOf(game, ci) {
  const d = game && game.dl && game.dl[ci];
  if (!d || typeof d !== 'object' || !Number.isInteger(d.w) || typeof d.lk !== 'number') return null;
  const pk = {};
  for (const [u, h] of Object.entries(d.pk || {})) if (Number.isInteger(h) && h >= 0 && h < HORSES.length) pk[u] = h;
  return { pk, lk: d.lk, w: d.w };
}

/** THE SERVER's REPLAY of one race (core/match-report.js): the stored draw is the draw of the stored picks + lock, and every result is its
 *  payout → { ok: true, w, field, winners: [uid] } · { ok: false } */
export function dlVerify(game, ci) {
  const d = dlOf(game, ci);
  if (!d || !game.seed) return { ok: false };
  const field = dlField(game.seed, ci);
  if (dlDraw(game.seed, ci, field, d.pk, d.lk) !== d.w) return { ok: false };
  const want = dlResults(game, ci, d), res = (game.results && game.results[ci]) || {};
  for (const uid of Object.keys(game.participants || {})) if ((Number(res[uid] && res[uid].pts) || 0) !== want[uid].pts) return { ok: false };
  return { ok: true, w: d.w, field, winners: Object.keys(d.pk).filter(u => d.pk[u] === d.w).sort() };
}

// ============================================================================================================== THE RACE SCRIPT
// world units: the track runs 0 → 1 (the finish line); the drawn winner's nose touches 1 exactly at DL_RACE_MS; every other horse is behind
// it then (1 − its gap). Each horse = the shared pace P(t) + its own smooth deviation (knots), so the field bunches, a leader fades, a closer
// charges — and nothing ever teleports (the deviation's slope stays well under the pace's: always moving forward). Sampled every SAMPLE_MS.
export const SAMPLE_MS = 50;
export const RACE_SAMPLES = DL_RACE_MS / SAMPLE_MS;
const KNOTS = [0, 1.4, 3.4, 5.4, 7.4, 9.4, 11.4, 13.2, 14.6, 16].map(s => s * 1000);
export const PHOTO_GAP = 0.004;          // a second place this close = a PHOTO FINISH (≈ a nose at the race's scale)
/** the shared pace: 0 → 1 over the race, a quick ease out of the gate (the first ~1.5 s), then steady */
export function pace(ms) {
  const T = DL_RACE_MS, e = 1500;
  const t = Math.max(0, Math.min(T, ms));
  // ∫ of a speed ramping 0 → v over e ms, then v: v·(t²/2e) | v·(t − e/2); v from P(T) = 1
  const v = 1 / (T - e / 2);
  return t < e ? (v * t * t) / (2 * e) : v * (t - e / 2);
}
const smooth = x => x * x * (3 - 2 * x);
function lerpKnots(vals, ms) {
  for (let i = 0; i < KNOTS.length - 1; i++) {
    if (ms <= KNOTS[i + 1]) {
      const a = KNOTS[i], b = KNOTS[i + 1];
      return vals[i] + (vals[i + 1] - vals[i]) * smooth((ms - a) / (b - a));
    }
  }
  return vals[vals.length - 1];
}
const between = (r, a, b) => a + (b - a) * r();

/**
 * THE RACE: (seed, ci, the drawn winner's lane) → { x: [lane][sample] world positions (RACE_SAMPLES + 1 each), order: [lanes, finishing
 * order], gaps: [lane] → its gap at the line, photo, drama, leaderAt(ms) }. PURE + deterministic: every phone draws the same race.
 */
export function raceScript(seed, ci, w) {
  const n = HORSES.length;
  const r = rngFrom(`${seed}:${ci}:${LUCK}:race:${w}`);
  const others = shuffle(r, Array.from({ length: n }, (_, i) => i).filter(i => i !== w));
  const order = [w, ...others];
  const pick = r();
  const drama = pick < 0.45 ? 'closer' : pick < 0.75 ? 'duel' : 'wire';
  const photo = r() < (drama === 'duel' ? 0.4 : 0.2);
  // the gaps at the line (world units — 1 horse length ≈ 0.0165)
  const gaps = new Array(n).fill(0);
  let g = photo ? between(r, 0.0012, 0.0032) : between(r, 0.008, 0.02);
  gaps[order[1]] = g;
  for (let k = 2; k < n; k++) { g = Math.min(0.036, g + between(r, 0.003, 0.011)); gaps[order[k]] = g; }
  // the knots of each horse's deviation from the pace (KNOTS.length values; the first two 0 — out of the gate together)
  const dev = Array.from({ length: n }, () => new Array(KNOTS.length).fill(0));
  const last = KNOTS.length - 1;
  for (let h = 0; h < n; h++) {
    for (let k = 2; k < last; k++) dev[h][k] = between(r, -0.012, 0.012) * (k / last + 0.4);
    dev[h][last] = -gaps[h];
    dev[h][last - 1] = -gaps[h] + between(r, -0.004, 0.004);
  }
  // THE FADER: a horse that isn't the winner (nor, in a duel, the rival) goes out hard + leads early, then fades to the back
  const rival = order[1];
  const faderPool = others.filter(h => drama !== 'duel' || h !== rival);
  const fader = faderPool[Math.floor(r() * faderPool.length)];
  [0, 0, 0.018, 0.026, 0.022, 0.01, -0.004].forEach((v, k) => { if (k >= 2) dev[fader][k] = v + between(r, -0.003, 0.003); });
  if (drama === 'closer') {
    // the winner sits at the back, then CHARGES through the field in the last stretch
    [0, 0, -0.012, -0.018, -0.02, -0.014, -0.006, 0.0, 0.004].forEach((v, k) => { if (k >= 2) dev[w][k] = v + between(r, -0.002, 0.002); });
    dev[rival][last - 2] = Math.max(dev[rival][last - 2], 0.01);
    dev[rival][last - 1] = Math.max(dev[rival][last - 1], 0.008);
  } else if (drama === 'duel') {
    // the winner + the rival trade the lead down the stretch
    [0, 0, 0.004, 0.01, 0.006, 0.014, 0.008, 0.012, 0.006].forEach((v, k) => { if (k >= 2) dev[w][k] = v; });
    [0, 0, 0.006, 0.006, 0.014, 0.008, 0.016, 0.009, 0.008].forEach((v, k) => { if (k >= 2) dev[rival][k] = v; });
  } else {
    // wire to wire — nearly: the winner's out front, the fader + then the rival take a look at it, it holds on
    [0, 0, 0.012, 0.016, 0.018, 0.016, 0.012, 0.01, 0.004].forEach((v, k) => { if (k >= 2) dev[w][k] = v; });
    dev[rival][last - 2] = 0.013;
    dev[rival][last - 1] = Math.max(dev[rival][last - 1], 0.005);
  }
  // sample + guard: never backwards, a steady top speed (no teleports), the finish exactly as drawn
  const x = [];
  for (let h = 0; h < n; h++) {
    const row = new Array(RACE_SAMPLES + 1);
    let prev = 0;
    for (let i = 0; i <= RACE_SAMPLES; i++) {
      const ms = i * SAMPLE_MS;
      let v = Math.max(0, pace(ms) + lerpKnots(dev[h], ms));
      if (v < prev) v = prev;
      row[i] = v;
      prev = v;
    }
    row[RACE_SAMPLES] = 1 - gaps[h];
    x.push(row);
  }
  return { x, order, gaps, photo: gaps[order[1]] < PHOTO_GAP, drama, fader, rival };
}

/** a horse's world position at `ms` into the race (clamped: before the off = 0, after the line = its finish) */
export function posAt(script, h, ms) {
  const row = script.x[h];
  const f = Math.max(0, Math.min(RACE_SAMPLES, ms / SAMPLE_MS));
  const i = Math.floor(f), j = Math.min(RACE_SAMPLES, i + 1);
  return row[i] + (row[j] - row[i]) * (f - i);
}
/** the leading lane at `ms` */
export function leaderAt(script, ms) {
  let best = 0;
  for (let h = 1; h < script.x.length; h++) if (posAt(script, h, ms) > posAt(script, best, ms)) best = h;
  return best;
}
/** how many times the lead changed hands over the race (sampled every 250 ms after the first 2 s) */
export function leadChanges(script) {
  let n = 0, prev = -1;
  for (let ms = 2000; ms <= DL_RACE_MS; ms += 250) {
    const l = leaderAt(script, ms);
    if (prev >= 0 && l !== prev) n++;
    prev = l;
  }
  return n;
}
/** the moment of the race at server time `now` (from the lock): { stage: 'pick' | 'off' | 'race' | 'finish' | 'done', ms } */
export function dlStage(game, ci, now) {
  const d = dlOf(game, ci);
  const start = Number(game && game.playStartAt) || 0;
  if (!d) return { stage: now < start + DL_PICK_MS ? 'pick' : 'off', ms: now - start };
  const ms = now - d.lk;
  if (ms < DL_RACE_MS) return { stage: 'race', ms: Math.max(0, ms) };
  if (ms < DL_RACE_MS + DL_FINISH_MS) return { stage: 'finish', ms: ms - DL_RACE_MS };
  return { stage: 'done', ms: ms - DL_RACE_MS };
}
/** the winning tickets of a stored race: { w, n (its odds), pay, uids: [the winners], long } — or null before the draw */
export function dlTickets(game, ci) {
  const d = dlOf(game, ci);
  if (!d) return null;
  const n = dlField(game.seed, ci)[d.w];
  const uids = Object.keys(d.pk).filter(u => d.pk[u] === d.w).sort();
  return { w: d.w, n, pay: payout(n), uids, long: n >= LONG_SHOT };
}
