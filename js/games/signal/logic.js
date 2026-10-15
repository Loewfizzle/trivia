// LAST SIGNAL — pure rules (no Firebase, no DOM).
import { hashString } from '../../core/rng.js';

export const QUESTION_MS = 15_000;
export const REVEAL_MS = 4_200;
export const INTRO_MS = 5_000;
export const FINAL_MS = 120_000;
export const ANSWER_GRACE_MS = 700;
export const MAX_QUESTIONS = 35;
export const START_SHIELDS = 2;
export const HP_OPTIONS = [75, 100, 150];
export const DEFAULT_SETTINGS = { hp: 100, cats: [] };
export const STRIKE_MAX = 30;
export const STRIKE_MIN = 10;
export const BURN = 10;

// Escalation: ×1, ×1.25, ×1.5 … every 5 questions.
export const multiplier = q => 1 + 0.25 * Math.floor(q / 5);

// Faster correct answers hit harder: 30 at 0 s → 10 at the buzzer (before multiplier).
export function strikeDamage(elapsedMs, mult = 1) {
  const f = Math.min(1, Math.max(0, elapsedMs / QUESTION_MS));
  return Math.round((STRIKE_MAX - (STRIKE_MAX - STRIKE_MIN) * f) * mult);
}

export const burnDamage = mult => Math.round(BURN * mult);

export const isAlive = (game, uid) => !!(game.participants && game.participants[uid]) && !(game.out && game.out[uid] !== undefined) && (game.hp && game.hp[uid] > 0);

export function aliveUids(game) {
  return Object.keys(game.participants || {}).filter(u => isAlive(game, u)).sort();
}

// The player a striker actually hits: their chosen target if it's a valid living
// rival, otherwise a deterministic pseudo-random living rival (same on every client).
export function resolveTarget(game, uid, targets, q = game.q) {
  const alive = aliveUids(game).filter(u => u !== uid);
  if (!alive.length) return null;
  const t = targets && targets[uid];
  if (t && alive.includes(t)) return t;
  return alive[hashString(`${game.matchId}:${q}:${uid}`) % alive.length];
}

/**
 * Resolves one question simultaneously from the pre-question state.
 * answers: { uid: { c: choiceIndex, at: serverTime } }
 * Returns { hp, sh, eliminated: [uid], events: [...] } — absolute values, so
 * replaying the same resolution can never double-apply damage.
 */
export function resolveQuestion(game, { answers = {}, targets = {}, correct }) {
  const q = game.q;
  const mult = multiplier(q);
  const hp = { ...(game.hp || {}) };
  const sh = { ...(game.sh || {}) };
  const events = [];
  const alive = aliveUids(game);
  // Fastest strikes are listed first (drama in the reveal), ties by uid.
  const ordered = alive.slice().sort((a, b) => ((answers[a] && answers[a].at) || Infinity) - ((answers[b] && answers[b].at) || Infinity) || (a < b ? -1 : 1));
  for (const uid of ordered) {
    const ans = answers[uid];
    if (ans && ans.c === correct) {
      const victim = resolveTarget(game, uid, targets, q);
      if (!victim) continue;
      const dmg = strikeDamage((ans.at || 0) - game.qStartAt, mult);
      hp[victim] = (hp[victim] || 0) - dmg;
      events.push({ t: 'hit', a: uid, v: victim, d: dmg });
    } else if ((sh[uid] || 0) > 0) {
      sh[uid] = sh[uid] - 1;
      events.push({ t: 'shield', u: uid, left: sh[uid] });
    } else {
      const d = burnDamage(mult);
      hp[uid] = (hp[uid] || 0) - d;
      events.push({ t: 'burn', u: uid, d });
    }
  }
  const eliminated = alive.filter(u => hp[u] <= 0);
  eliminated.forEach(u => events.push({ t: 'out', u }));
  return { hp, sh, eliminated, events };
}

export function isOver(game) {
  return aliveUids(game).length <= 1 || game.q >= MAX_QUESTIONS - 1;
}

// Final ranking: survivors by HP (then shields); the fallen by how late they fell, then by HP.
export function rankings(game) {
  const uids = Object.keys(game.participants || {});
  const out = game.out || {};
  const hp = game.hp || {};
  const sh = game.sh || {};
  const key = u => [out[u] === undefined ? 1 : 0, out[u] === undefined ? hp[u] : out[u], hp[u] || 0, sh[u] || 0];
  const rows = uids.map(uid => ({ uid, k: key(uid) })).sort((a, b) => {
    for (let i = 0; i < 4; i++) if (a.k[i] !== b.k[i]) return b.k[i] - a.k[i];
    return a.uid < b.uid ? -1 : 1;
  });
  let rank = 0;
  let prev = null;
  return rows.map((r, i) => {
    const sig = r.k.join('|');
    if (sig !== prev) { rank = i + 1; prev = sig; }
    return { uid: r.uid, rank, hp: Math.max(0, hp[r.uid] || 0), sh: sh[r.uid] || 0, out: out[r.uid] };
  });
}

// 0 (nobody down) … 1 (one survivor): drives the UI decay effect.
export function decay(game) {
  const total = Object.keys(game.participants || {}).length;
  if (total <= 1) return 0;
  const fallen = Object.keys(game.out || {}).length;
  return Math.min(1, fallen / (total - 1));
}
