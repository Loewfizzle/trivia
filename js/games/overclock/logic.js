// OVERCLOCK — pure scoring / order / standings.
import { rngFrom, shuffle } from '../../core/rng.js';
import { TYPES, CATEGORY, partsFor, SORT_FULL, COMPASS_SCRIPT_MS } from './challenges.js';

export const CHALLENGE_MS = 30_000;
export const READY_MS = 3_200;
export const BRIEF_MS = 7_000;
export const STANDINGS_MS = 6_000;
// challenges with a reveal (best words, the right order, the number line) hold the leaderboard a little longer
export const REVEAL_STANDINGS_MS = 10_000;
export const REVEALS = new Set(['lexicon', 'timeline', 'closest', 'missinglink', 'spellcheck', 'make24', 'compass', 'sortit', 'higherlower']);
export const standingsMs = type => (REVEALS.has(type) ? REVEAL_STANDINGS_MS : STANDINGS_MS);
export const FINAL_MS = 120_000;
export const PLAY_GRACE_MS = 700;
export const MODES = { standard: 12, marathon: 24 };
export const DEFAULT_SETTINGS = { mode: 'standard' };
export const SPEED_BONUS = 60;

export const levelOf = (ci, total) => (total <= 1 ? 0 : ci / (total - 1));

// The challenge order (seeded, identical on every phone).
//  - up to 20 challenges (one per type): all different types;
//  - longer (Marathon 24): every type once plus a few repeats — a type at most twice, its two turns at least a
//    third of the match apart (so never back to back);
//  - categories (words, numbers, memory, visual, knowledge, reflex — challenges.js#CATEGORY) are spread out: two
//    challenges of the same category are never next to each other unless there is no other way.
export function buildOrder(seed, total) {
  const rand = rngFrom(`${seed}:order`);
  const n = TYPES.length;
  // up to one of each: types are drawn on the fly from all of them (so a short match can still avoid a clash);
  // longer: the exact multiset (every type once + repeats) is laid out
  const long = total > n;
  const pool = long ? [...TYPES, ...shuffle(rand, TYPES).slice(0, total - n)] : TYPES;
  const minGap = long ? Math.floor(total / 3) : 1;
  let best = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const left = shuffle(rand, pool);
    const out = [];
    const lastAt = {};
    let clashes = 0;
    while (out.length < total && left.length) {
      const prev = out[out.length - 1];
      const free = i => lastAt[left[i]] == null || out.length - lastAt[left[i]] >= minGap;
      let cands = left.map((_, i) => i).filter(i => free(i) && CATEGORY[left[i]] !== CATEGORY[prev]);
      if (!cands.length) { cands = left.map((_, i) => i).filter(free); clashes++; }
      if (!cands.length) break;
      // weights: a category with more challenges left goes sooner (so the rest can still be spread), and a type
      // that still has both copies to place goes early (so its two turns end up far apart)
      const catLeft = {};
      for (const t of left) catLeft[CATEGORY[t]] = (catLeft[CATEGORY[t]] || 0) + 1;
      const w = long ? cands.map(i => catLeft[CATEGORY[left[i]]] + (left.filter(t => t === left[i]).length > 1 ? 3 : 0)) : cands.map(() => 1);
      let r = rand() * w.reduce((x, y) => x + y, 0);
      let k = 0;
      while (k < cands.length - 1 && (r -= w[k]) >= 0) k++;
      const t = left.splice(cands[k], 1)[0];
      lastAt[t] = out.length;
      out.push(t);
    }
    if (out.length !== total) continue;
    if (!clashes) return out;
    if (!best || clashes < best.clashes) best = { out, clashes };
  }
  return best ? best.out : pool.slice(0, total);
}

/** Neighbours that share a category (buildOrder keeps this at 0 whenever that's possible). */
export const categoryClashes = order => order.reduce((n, t, i) => n + (i > 0 && CATEGORY[t] === CATEGORY[order[i - 1]] ? 1 : 0), 0);

// Points: up to 100 for accuracy (partial credit), +up to 60 speed bonus for a
// perfect run, ×2 on the final challenge. Signal Lock is pure speed: its credit
// already measures reaction time, so it scales to the same 160 maximum instead.
// Closest Call has no time bonus: the closest guess in the room gets the full 60 (see computeResults).
export function challengeScore({ parts, ok, doneAt, startAt, final, type, closest = false }) {
  const acc = parts > 0 ? Math.max(0, Math.min(1, ok / parts)) : 0;
  if (type === 'reflex') return Math.round((100 + SPEED_BONUS) * acc) * (final ? 2 : 1);
  if (type === 'closest') return (Math.round(100 * acc) + (closest ? SPEED_BONUS : 0)) * (final ? 2 : 1);
  // Sort It: each net correct sort (right − ½ wrong) is worth the same; SORT_FULL of them already make 100
  const base = type === 'sortit' ? Math.round(100 * Math.min(1, ok / SORT_FULL)) : Math.round(100 * acc);
  // Compass: the turn instructions take a fixed ~22 s to play out, so only the time left over counts for speed
  const [t0, span] = type === 'compass' ? [startAt + COMPASS_SCRIPT_MS, CHALLENGE_MS - COMPASS_SCRIPT_MS] : [startAt, CHALLENGE_MS];
  const speed = ok >= parts && parts > 0 && typeof doneAt === 'number'
    ? Math.round(SPEED_BONUS * Math.max(0, Math.min(1, 1 - (doneAt - t0) / span)))
    : 0;
  return (base + speed) * (final ? 2 : 1);
}

export function computeResults(game, boards) {
  const type = game.order[game.ci];
  const parts = partsFor(type, levelOf(game.ci, game.total));
  const final = game.ci === game.total - 1;
  const out = {};
  const okOf = uid => Math.min(parts, Math.max(0, Number(((boards && boards[uid]) || {}).ok) || 0));
  // Closest Call: the closest guess (highest credit — credit falls with the relative error) earns the bonus; ties share it
  const top = type === 'closest' ? Math.max(0, ...Object.keys(game.participants || {}).map(okOf)) : 0;
  for (const uid of Object.keys(game.participants || {})) {
    const b = (boards && boards[uid]) || {};
    const ok = okOf(uid);
    const closest = type === 'closest' && top > 0 && ok === top;
    out[uid] = { pts: challengeScore({ parts, ok, doneAt: b.done ? b.doneAt : undefined, startAt: game.playStartAt, final, type, closest }), ok, parts };
  }
  return out;
}

export function totals(game, upto = Infinity) {
  const t = {};
  for (const uid of Object.keys(game.participants || {})) t[uid] = 0;
  for (const [ci, res] of Object.entries(game.results || {})) {
    if (Number(ci) > upto) continue;
    for (const [uid, r] of Object.entries(res || {})) t[uid] = (t[uid] || 0) + (r.pts || 0);
  }
  return t;
}

export function standings(game, upto = Infinity) {
  const rows = Object.entries(totals(game, upto)).map(([uid, score]) => ({ uid, score }))
    .sort((a, b) => b.score - a.score || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r.rank = rank; });
  return rows;
}
