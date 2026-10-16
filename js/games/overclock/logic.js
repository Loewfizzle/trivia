// OVERCLOCK — pure scoring / order / standings.
import { rngFrom, shuffle } from '../../core/rng.js';
import { TYPES, partsFor } from './challenges.js';

export const CHALLENGE_MS = 30_000;
export const READY_MS = 3_200;
export const BRIEF_MS = 7_000;
export const STANDINGS_MS = 6_000;
export const FINAL_MS = 120_000;
export const PLAY_GRACE_MS = 700;
export const MODES = { standard: 12, marathon: 24 };
export const DEFAULT_SETTINGS = { mode: 'standard' };
export const SPEED_BONUS = 60;

export const levelOf = (ci, total) => (total <= 1 ? 0 : ci / (total - 1));

// Trivia Lightning (a crowd favourite) keeps one slot in six; the other types share the rest
// as evenly as possible (the leftover slots go to seeded picks). Shuffled, never twice in a row.
export function orderBase(rand, total) {
  const trivia = Math.max(1, Math.round(total / 6));
  const rest = TYPES.filter(t => t !== 'trivia');
  const each = Math.floor((total - trivia) / rest.length);
  const base = Array(trivia).fill('trivia');
  for (const t of rest) for (let k = 0; k < each; k++) base.push(t);
  for (const t of shuffle(rand, rest).slice(0, total - base.length)) base.push(t);
  return base;
}

export function buildOrder(seed, total) {
  const rand = rngFrom(`${seed}:order`);
  const base = orderBase(rand, total);
  let list = shuffle(rand, base);
  for (let attempt = 0; attempt < 200; attempt++) {
    let bad = -1;
    for (let i = 1; i < list.length; i++) if (list[i] === list[i - 1]) { bad = i; break; }
    if (bad < 0) return list;
    // swap the clash with a later element that fixes it
    const j = list.findIndex((t, k) => k > bad && t !== list[bad - 1] && (k + 1 >= list.length || list[k + 1] !== list[bad]) && list[k - 1] !== list[bad]);
    if (j > 0) [list[bad], list[j]] = [list[j], list[bad]];
    else list = shuffle(rand, base);
  }
  return list;
}

// Points: up to 100 for accuracy (partial credit), +up to 60 speed bonus for a
// perfect run, ×2 on the final challenge. Signal Lock is pure speed: its credit
// already measures reaction time, so it scales to the same 160 maximum instead.
export function challengeScore({ parts, ok, doneAt, startAt, final, type }) {
  const acc = parts > 0 ? Math.max(0, Math.min(1, ok / parts)) : 0;
  if (type === 'reflex') return Math.round((100 + SPEED_BONUS) * acc) * (final ? 2 : 1);
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
  for (const uid of Object.keys(game.participants || {})) {
    const b = (boards && boards[uid]) || {};
    const ok = Math.min(parts, Math.max(0, Number(b.ok) || 0));
    out[uid] = { pts: challengeScore({ parts, ok, doneAt: b.done ? b.doneAt : undefined, startAt: game.playStartAt, final, type }), ok, parts };
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
