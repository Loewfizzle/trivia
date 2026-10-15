// CIPHER BREACH — pure rules. No Firebase, no DOM: imported by the browser and by tests.

export const MAX_GUESSES = 6;
export const ROUND_PLANS = {
  3: [5, 6, 7],
  5: [5, 5, 6, 6, 7],
  8: [5, 5, 5, 6, 6, 6, 7, 7],
};
export const ROUND_COUNT_OPTIONS = [3, 5, 8];
export const ROUND_TIME_OPTIONS = [60, 90, 120, 180]; // seconds
export const DEFAULT_SETTINGS = { rounds: 5, roundSec: 120 };

export const PHASE_MS = {
  intro: 3500,     // "ROUND 2 // 6 LETTERS" + 3-2-1
  reveal: 6000,    // word reveal + round results
  standings: 8000, // leaderboard between rounds
  final: 120000,   // podium; host can return to lobby earlier
};
// Small grace so a guess submitted on the buzzer still lands before the host closes the round.
export const PLAY_GRACE_MS = 700;

// Tile states: '0' absent, '1' present elsewhere, '2' correct spot.
// Standard Wordle duplicate handling: exact matches consume letters first,
// then present-marks are handed out left-to-right while copies remain.
export function evaluateGuess(guess, answer) {
  guess = guess.toLowerCase();
  answer = answer.toLowerCase();
  const n = answer.length;
  const res = new Array(n).fill('0');
  const remaining = Object.create(null);
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) res[i] = '2';
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < n; i++) {
    if (res[i] === '2') continue;
    const ch = guess[i];
    if (remaining[ch] > 0) { res[i] = '1'; remaining[ch]--; }
  }
  return res.join('');
}

// Best known state per letter for the on-screen keyboard: 2 beats 1 beats 0.
export function keyStates(guesses, patterns) {
  const out = {};
  guesses.forEach((g, gi) => {
    const p = patterns[gi] || '';
    for (let i = 0; i < g.length; i++) {
      const ch = g[i];
      const s = Number(p[i] || 0);
      if (out[ch] === undefined || s > out[ch]) out[ch] = s;
    }
  });
  return out;
}

export function roundLengths(rounds) {
  return ROUND_PLANS[rounds] || ROUND_PLANS[5];
}

// Points for one player's round.
//   solve base: 100 (+25 per letter above 5)
//   speed bonus: up to 100, linear in time remaining
//   efficiency: 20 per unused guess
export function scoreRound({ solved, guessesUsed, elapsedMs, roundMs, length, maxGuesses = MAX_GUESSES }) {
  if (!solved) return { total: 0, base: 0, speed: 0, efficiency: 0 };
  const base = 100 + 25 * Math.max(0, length - 5);
  const frac = Math.min(1, Math.max(0, 1 - elapsedMs / roundMs));
  const speed = Math.round(100 * frac);
  const efficiency = 20 * Math.max(0, maxGuesses - guessesUsed);
  return { total: base + speed + efficiency, base, speed, efficiency };
}

// Normalizes an RTDB value that may come back as an object with numeric keys.
export function asArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(x => x !== undefined && x !== null);
  return Object.keys(v).sort((a, b) => a - b).map(k => v[k]);
}

export function computeRoundResults(game, boards) {
  const length = game.lengths[game.round];
  const out = {};
  for (const uid of Object.keys(game.participants || {})) {
    const b = boards && boards[uid];
    const patterns = asArray(b && b.p);
    const solved = !!(b && b.solved && patterns.length && /^2+$/.test(patterns[patterns.length - 1]));
    const elapsedMs = solved && typeof b.solvedAt === 'number' ? Math.max(0, b.solvedAt - game.roundStartAt) : game.roundMs;
    const s = scoreRound({ solved, guessesUsed: patterns.length, elapsedMs, roundMs: game.roundMs, length });
    out[uid] = { pts: s.total, solved, n: patterns.length, t: solved ? elapsedMs : 0, speed: s.speed, eff: s.efficiency };
  }
  return out;
}

// Totals are always re-derived from per-round results, so a round written twice
// (e.g. during host migration) can never double-count.
export function totals(game, uptoRound = Infinity) {
  const t = {};
  for (const uid of Object.keys(game.participants || {})) t[uid] = 0;
  const results = game.results || {};
  for (const r of Object.keys(results)) {
    if (Number(r) > uptoRound) continue;
    for (const [uid, res] of Object.entries(results[r] || {})) t[uid] = (t[uid] || 0) + (res.pts || 0);
  }
  return t;
}

// Sorted standings with ties sharing a rank.
export function standings(game, uptoRound = Infinity) {
  const t = totals(game, uptoRound);
  const rows = Object.entries(t).map(([uid, score]) => ({ uid, score })).sort((a, b) => b.score - a.score || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r.rank = rank; });
  return rows;
}

// ---- Casual obfuscation of the secret word (friends-level anti-cheat) ----
// XOR with a room/match/round key, then base64. Not security — just keeps the
// answer out of plain sight in the database and dev tools.
export function secretKey(code, matchId, round) {
  return `${round}:${code}:${matchId}:breach`;
}
function b64encode(str) {
  return typeof btoa === 'function' ? btoa(str) : Buffer.from(str, 'binary').toString('base64');
}
function b64decode(str) {
  return typeof atob === 'function' ? atob(str) : Buffer.from(str, 'base64').toString('binary');
}
export function encodeWord(word, key) {
  let s = '';
  for (let i = 0; i < word.length; i++) s += String.fromCharCode(word.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return b64encode(s);
}
export function decodeWord(enc, key) {
  if (!enc) return '';
  const s = b64decode(enc);
  let out = '';
  for (let i = 0; i < s.length; i++) out += String.fromCharCode(s.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}
