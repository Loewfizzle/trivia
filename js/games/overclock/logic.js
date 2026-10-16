// OVERCLOCK — pure scoring / order / standings.
import { rngFrom, shuffle } from '../../core/rng.js';
import { TYPES, partsFor } from './challenges.js';

export const CHALLENGE_MS = 30_000;
export const READY_MS = 3_200;
export const BRIEF_MS = 7_000;
export const STANDINGS_MS = 6_000;
// challenges with a reveal (best words, the right order, the number line) hold the leaderboard a little longer
export const REVEAL_STANDINGS_MS = 10_000;
export const REVEALS = new Set(['lexicon', 'timeline', 'closest']);
export const standingsMs = type => (REVEALS.has(type) ? REVEAL_STANDINGS_MS : STANDINGS_MS);
export const FINAL_MS = 120_000;
export const PLAY_GRACE_MS = 700;
export const MODES = { standard: 12, marathon: 24 };
export const DEFAULT_SETTINGS = { mode: 'standard' };
export const SPEED_BONUS = 60;

export const levelOf = (ci, total) => (total <= 1 ? 0 : ci / (total - 1));

// The challenge order (seeded, identical on every phone). No repeats:
//  - up to 14 challenges: all different types;
//  - longer (Marathon 24): two halves of all-different types, so a type appears at most twice — once per
//    half, never back to back, and its two turns are well spread (at least a third of the match apart).
export function buildOrder(seed, total) {
  const rand = rngFrom(`${seed}:order`);
  const n = TYPES.length;
  if (total <= n) return shuffle(rand, TYPES).slice(0, total);
  const a = Math.ceil(total / 2), b = total - a;
  const minGap = Math.floor(total / 3);
  let best = null;
  for (let attempt = 0; attempt < 600; attempt++) {
    const first = shuffle(rand, TYPES).slice(0, a);
    // the second half brings in anything the first half skipped, then fills up with repeats
    const missing = TYPES.filter(t => !first.includes(t));
    const second = shuffle(rand, [...missing, ...shuffle(rand, first).slice(0, b - missing.length)]);
    const list = [...first, ...second];
    let gap = Infinity;
    for (const t of TYPES) {
      const at = list.reduce((acc, x, k) => (x === t ? [...acc, k] : acc), []);
      if (at.length === 2) gap = Math.min(gap, at[1] - at[0]);
    }
    if (gap >= minGap) return list;
    if (!best || gap > best.gap) best = { list, gap };
  }
  return best.list;
}

// Points: up to 100 for accuracy (partial credit), +up to 60 speed bonus for a
// perfect run, ×2 on the final challenge. Signal Lock is pure speed: its credit
// already measures reaction time, so it scales to the same 160 maximum instead.
// Closest Call has no time bonus: the closest guess in the room gets the full 60 (see computeResults).
export function challengeScore({ parts, ok, doneAt, startAt, final, type, closest = false }) {
  const acc = parts > 0 ? Math.max(0, Math.min(1, ok / parts)) : 0;
  if (type === 'reflex') return Math.round((100 + SPEED_BONUS) * acc) * (final ? 2 : 1);
  if (type === 'closest') return (Math.round(100 * acc) + (closest ? SPEED_BONUS : 0)) * (final ? 2 : 1);
  const base = Math.round(100 * acc);
  const speed = ok >= parts && parts > 0 && typeof doneAt === 'number'
    ? Math.round(SPEED_BONUS * Math.max(0, 1 - (doneAt - startAt) / CHALLENGE_MS))
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
