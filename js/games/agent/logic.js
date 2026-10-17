// DOUBLE AGENT — pure rules (no DOM, no Firebase): timings, the deal (word + agents), turn order, clue checks,
// the vote tally, scoring and standings. Unit-tested in tests/agent.test.mjs.
import { rngFrom, shuffle, pick } from '../../core/rng.js';

export const INTRO_MS = 6_500;          // title resolves out of static + "CLASSIFIED BRIEFING"
export const BRIEF_MS = 20_000;         // read your file, tap READY (or this runs out)
export const BRIEF_MIN_MS = 3_000;      // even if everyone is instantly ready
export const VOTE_MS = 30_000;
export const UNMASK_BASE_MS = 7_500;    // static → surveillance zoom → stamp → the real agent(s)
export const UNMASK_EACH_MS = 2_600;    // per extra accused
export const LAST_MS = 20_000;          // a caught agent's last chance to name the word
export const SCORES_MS = 10_000;        // the case file closes
export const FINAL_MS = 120_000;
export const GRACE_MS = 700;
export const CLUE_MAX = 20;
export const MIN_SEATED = 3;            // fewer than this left in the room: the match ends

export const DEFAULT_SETTINGS = { rounds: 5, mode: 'remote', agents: 1, clueSec: 20, debateSec: 90, passes: 1 };
export const ROUND_OPTIONS = [3, 5, 7];
export const CLUE_SEC_OPTIONS = [15, 20, 30];
export const DEBATE_SEC_OPTIONS = [60, 90, 120];
export const TWO_AGENTS_MIN = 7;        // 2 agents only with 7–8 players

export const PTS = { escape: 200, steal: 150, innocentCatch: 100, rightVote: 50 };

/** Settings clamped to what's allowed (2 agents only with 7+ players). */
export function cleanSettings(s, players) {
  const out = { ...DEFAULT_SETTINGS, ...(s || {}) };
  if (!ROUND_OPTIONS.includes(Number(out.rounds))) out.rounds = DEFAULT_SETTINGS.rounds;
  out.rounds = Number(out.rounds);
  out.mode = out.mode === 'room' ? 'room' : 'remote';
  out.agents = Number(out.agents) === 2 && players >= TWO_AGENTS_MIN ? 2 : 1;
  if (!CLUE_SEC_OPTIONS.includes(Number(out.clueSec))) out.clueSec = DEFAULT_SETTINGS.clueSec;
  if (!DEBATE_SEC_OPTIONS.includes(Number(out.debateSec))) out.debateSec = DEFAULT_SETTINGS.debateSec;
  out.clueSec = Number(out.clueSec);
  out.debateSec = Number(out.debateSec);
  out.passes = Number(out.passes) === 2 ? 2 : 1;
  return out;
}

// ---------------------------------------------------------------- words
/** 'Guinea Pig', 'yo-yo' → 'GUINEAPIG', 'YOYO' (letters only, upper case). */
export const norm = s => String(s || '').toUpperCase().replace(/[^A-Z]/g, '');
/** A Firebase-safe key for a word (room "already used" list). */
export const wordKey = w => norm(w).toLowerCase();
/** Every form of the word that counts as saying it: itself and its plurals. */
export function wordForms(word) {
  const w = norm(word);
  const forms = new Set([w, `${w}S`, `${w}ES`]);
  if (/[^AEIOU]Y$/.test(w)) forms.add(`${w.slice(0, -1)}IES`);
  if (/F$/.test(w)) forms.add(`${w.slice(0, -1)}VES`);
  if (/FE$/.test(w)) forms.add(`${w.slice(0, -2)}VES`);
  return forms;
}
/** A caught agent's guess: right if it's the word or a plural of it (case, spaces and hyphens ignored). */
export const guessRight = (guess, word) => !!norm(guess) && wordForms(word).has(norm(guess));

/**
 * Why a clue can't be used, or null if it's fine.
 * word: the secret word (null for the agent, who doesn't know it); given: clues already on the board this round.
 */
export function clueProblem(clue, word, given = []) {
  const raw = String(clue || '').trim();
  if (!raw) return 'Type one word.';
  if (/\s/.test(raw)) return 'One word only.';
  if (!/^[A-Za-z][A-Za-z-]*$/.test(raw) || /--|-$/.test(raw)) return 'Letters only (a hyphen is fine).';
  if (raw.length > CLUE_MAX) return `${CLUE_MAX} letters max.`;
  const c = norm(raw);
  if (word) {
    const w = norm(word);
    if (c.includes(w) || [...wordForms(word)].some(f => c === f)) return 'That gives the word away.';
  }
  if (given.some(g => g && norm(g) === c)) return 'Someone already said that.';
  return null;
}

// ---------------------------------------------------------------- the deal
/**
 * The round's word and agent(s), from the match's SECRET seed (only the host can read it), so every host computes
 * the same deal and nobody else can. v = re-deal count (an agent left mid-round). used = word keys already played.
 */
export function deal({ seed, round, v = 0, seat, agents = 1, bank, used = {}, lastCat = null }) {
  const rand = rngFrom(`${seed}:deal:${round}:${v}`);
  const cats = bank.filter(([cat, words]) => cat !== lastCat && words.some(w => !used[wordKey(w)]));
  const pool = cats.length ? cats : bank.filter(([, words]) => words.some(w => !used[wordKey(w)]));
  const [cat, words] = pool.length ? pick(rand, pool) : pick(rand, bank); // the bank ran dry: allow repeats
  const fresh = words.filter(w => !used[wordKey(w)]);
  const word = pick(rand, fresh.length ? fresh : words);
  const n = Math.max(1, Math.min(agents, seat.length - 2));
  const chosen = shuffle(rand, [...seat].sort()).slice(0, n);
  return { word, cat, agents: Object.fromEntries(chosen.map(u => [u, true])) };
}

/** Clue order for the round: random, but an agent never goes first. */
export function turnOrder({ seed, round, v = 0, seat, agents }) {
  const order = shuffle(rngFrom(`${seed}:order:${round}:${v}`), [...seat].sort());
  const first = order.findIndex(u => !agents[u]);
  if (first > 0) [order[0], order[first]] = [order[first], order[0]];
  return order;
}

// ---------------------------------------------------------------- the vote
/** votes: { voter: { s: suspect } } → { tally: { uid: n }, accused: { uid: true } }. A tie at the cut-off accuses nobody there. */
export function tallyVotes(votes, seat, agentsCount) {
  const inSeat = new Set(seat);
  const tally = {};
  for (const [voter, v] of Object.entries(votes || {})) {
    const s = v && v.s;
    if (!inSeat.has(voter) || !inSeat.has(s) || s === voter) continue;
    tally[s] = (tally[s] || 0) + 1;
  }
  const counts = Object.values(tally).sort((a, b) => b - a);
  const cut = counts[agentsCount] || 0; // the best count that does NOT make it
  const accused = {};
  for (const [u, n] of Object.entries(tally)) if (n > 0 && n > cut) accused[u] = true;
  return { tally, accused };
}

// ---------------------------------------------------------------- scoring
/**
 * One round's points. agents/caught/stolen: { uid: true }; votes: final votes { voter: { s } }.
 * Agent escapes +200; caught but names the word +150; caught and misses: 0, and every innocent +100.
 * Every innocent who voted for an agent: +50.
 */
export function scoreRound({ seat, agents, caught, stolen, votes }) {
  const res = {};
  const innocents = seat.filter(u => !agents[u]);
  for (const u of seat) res[u] = { pts: 0, agent: !!agents[u] };
  for (const a of Object.keys(agents)) {
    if (!res[a]) continue;
    if (!caught[a]) { res[a].pts += PTS.escape; res[a].escaped = true; }
    else if (stolen[a]) { res[a].pts += PTS.steal; res[a].stole = true; }
    else { res[a].caught = true; for (const u of innocents) res[u].pts += PTS.innocentCatch; }
  }
  for (const u of innocents) {
    const s = votes && votes[u] && votes[u].s;
    if (s && agents[s]) { res[u].pts += PTS.rightVote; res[u].spotted = true; }
  }
  return res;
}

export function totals(game, upto = Infinity) {
  const t = {};
  for (const uid of Object.keys(game.participants || {})) t[uid] = 0;
  for (const [r, res] of Object.entries(game.results || {})) {
    if (Number(r) > upto) continue;
    for (const [uid, x] of Object.entries(res || {})) t[uid] = (t[uid] || 0) + (x.pts || 0);
  }
  return t;
}

export function standings(game, upto = Infinity) {
  const rows = Object.entries(totals(game, upto)).map(([uid, score]) => ({ uid, score })).sort((a, b) => b.score - a.score || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r.rank = rank; });
  return rows;
}

/** The match length shown in the options sheet. */
export function estimateMinutes(s, players = 6) {
  const turns = players * (s.passes || 1) * Math.min(s.clueSec || 20, 14);
  const round = 8_000 + turns * 1000 + (s.debateSec || 90) * 900 + 18_000 + 9_000 + SCORES_MS;
  return Math.max(3, Math.round(((s.rounds || 5) * round + INTRO_MS) / 60_000));
}
