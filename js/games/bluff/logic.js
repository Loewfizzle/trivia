// NEURAL BLUFF — pure rules (no Firebase, no DOM).
import { hashString, rngFrom, shuffle } from '../../core/rng.js';

export const INTRO_MS = 4_500;
export const FINAL_INTRO_MS = 6_500;
export const WRITE_MS = 60_000;
export const VOTE_MS = 30_000;
export const STANDINGS_MS = 7_000;
export const FINAL_MS = 120_000;
export const GRACE_MS = 800;
export const REVEAL_LEAD_MS = 1_400;
export const REVEAL_STEP_MS = 3_400;
export const REVEAL_TRUTH_MS = 4_800;
export const REVEAL_TAIL_MS = 4_200;
export const LIE_MAX = 40;
export const MODES = { short: 5, standard: 8 };
export const DEFAULT_SETTINGS = { mode: 'short' };
export const POINTS = { truth: 1000, fooled: 500, like: 100 };
export const FINAL_MULTIPLIER = 3;

// Number words → digits, so "twelve" and "12" look (and compare) the same. For display, "one"
// only becomes 1 when it counts something ("one eye open" → 1, but "no one", "one of" stay).
const SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const NUMBER_RE = new RegExp(`\\b(?:(${Object.keys(TENS).join('|')})(?:[- ](${SMALL.slice(1, 10).join('|')}))?|(${SMALL.join('|')}))\\b`, 'gi');
function digits(text, keepOne) {
  return text.replace(NUMBER_RE, (m, tens, unit, small, at, all) => {
    if (tens) return String(TENS[tens.toLowerCase()] + (unit ? SMALL.indexOf(unit.toLowerCase()) : 0));
    if (keepOne && small.toLowerCase() === 'one') {
      const before = all.slice(0, at), after = all.slice(at + m.length);
      if (/\b(no|any|every|some|the|this|that)\s+$/i.test(before) || !/^\s+\S/.test(after) || /^\s+(of|another)\b/i.test(after)) return m;
    }
    return String(SMALL.indexOf(small.toLowerCase()));
  });
}

/**
 * How every vote option is shown — the truth, players' lies and house lies alike — so formatting
 * can never give the truth away: no leading a/an/the, no trailing punctuation or wrapping quotes,
 * number words as digits, ALL CAPS (phones auto-capitalize lies; the bank's answers are lowercase).
 */
export function displayText(text) {
  let t = String(text || '').replace(/\s+/g, ' ').trim()
    .replace(/^["'“”‘’«»]+|["'“”‘’«»]+$/g, '')
    .replace(/[\s.,;:!?…]+$/, '')
    .trim();
  const bare = t.replace(/^(the|a|an)\s+/i, '');
  if (bare) t = bare;
  return digits(t, true).toLocaleUpperCase('en-US');
}

// Lowercase, strip accents/punctuation/leading articles, number words → digits, collapse spaces.
export function normalize(text) {
  return digits(String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an) /, ''), false);
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** True if a lie is the real answer, an accepted variant, or a near-miss spelling of one. */
export function tooClose(lie, answer, variants = []) {
  const l = normalize(lie);
  if (!l) return false;
  const lc = l.replace(/ /g, '');
  for (const raw of [answer, ...variants]) {
    const t = normalize(raw);
    if (!t) continue;
    const tc = t.replace(/ /g, '');
    if (lc === tc) return true;
    const allowed = Math.max(1, Math.floor(tc.length / 6));
    // a typo of the truth (same first letter), not a different word like "matches" vs "watches"
    if (tc.length >= 5 && lc[0] === tc[0] && levenshtein(lc, tc) <= allowed) return true;
    // "brads drink soda" still contains the truth
    if (tc.length >= 5 && lc.includes(tc)) return true;
  }
  return false;
}

export const optionKey = text => `o${hashString(normalize(text)).toString(36)}`;

export function cleanLie(text) {
  return String(text || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, LIE_MAX);
}

/**
 * Builds the vote options for a round.
 * lies: { uid: { t } }, truth: { a, v }, house: [3 house lies], players: participant count.
 * Fewer than 4 players → pad with house lies up to at least 5 options; otherwise at least 4.
 * Identical lies (after normalization) merge into one option with several authors.
 * Returns options [{ k, t, truth?, house?, authors: [] }] in a seeded shuffled order.
 */
export function buildOptions({ lies = {}, truth, house = [], players, seed }) {
  const byKey = new Map();
  const truthKey = optionKey(truth.a);
  byKey.set(truthKey, { k: truthKey, t: displayText(truth.a), truth: true, house: false, authors: [] });
  for (const uid of Object.keys(lies).sort()) {
    const t = cleanLie(lies[uid] && lies[uid].t);
    if (!t || tooClose(t, truth.a, truth.v)) continue;
    const k = optionKey(t);
    if (k === truthKey) continue;
    if (!byKey.has(k)) byKey.set(k, { k, t: displayText(t), truth: false, house: false, authors: [] });
    byKey.get(k).authors.push(uid);
  }
  const minimum = players < 4 ? 5 : 4;
  for (const h of house) {
    if (byKey.size >= minimum) break;
    const k = optionKey(h);
    if (byKey.has(k)) { byKey.get(k).house = byKey.get(k).house || byKey.get(k).authors.length === 0; continue; }
    byKey.set(k, { k, t: displayText(h), truth: false, house: true, authors: [] });
  }
  return shuffle(rngFrom(`${seed}:options`), [...byKey.values()]);
}

/**
 * votes: { uid: { k, like } }. Votes for your own lie and likes on your own lie / the truth are ignored.
 * Returns { uid: { pts, truth, fooled, likes, picked } } for every participant.
 */
export function scoreRound({ options, votes = {}, participants, final = false }) {
  const byKey = Object.fromEntries(options.map(o => [o.k, o]));
  const out = {};
  for (const uid of Object.keys(participants || {})) out[uid] = { pts: 0, truth: false, fooled: 0, likes: 0, picked: null };
  const mult = final ? FINAL_MULTIPLIER : 1;
  for (const [voter, v] of Object.entries(votes)) {
    if (!out[voter] || !v) continue;
    const pick = byKey[v.k];
    if (pick && !pick.authors.includes(voter)) {
      out[voter].picked = pick.k;
      if (pick.truth) { out[voter].truth = true; out[voter].pts += POINTS.truth * mult; }
      else for (const a of pick.authors) if (out[a]) { out[a].fooled += 1; out[a].pts += POINTS.fooled * mult; }
    }
    const liked = byKey[v.like];
    if (liked && !liked.truth && !liked.authors.includes(voter)) {
      for (const a of liked.authors) if (out[a]) { out[a].likes += 1; out[a].pts += POINTS.like * mult; }
    }
  }
  return out;
}

/** Who picked each option, and how many likes it got. */
export function tally(options, votes = {}) {
  const t = Object.fromEntries(options.map(o => [o.k, { voters: [], likes: 0 }]));
  for (const [voter, v] of Object.entries(votes)) {
    if (!v) continue;
    const o = options.find(x => x.k === v.k);
    if (o && !o.authors.includes(voter)) t[o.k].voters.push(voter);
    const l = options.find(x => x.k === v.like);
    if (l && !l.truth && !l.authors.includes(voter)) t[l.k].likes += 1;
  }
  return t;
}

/**
 * The dramatic reveal: lies that fooled someone (fewest victims first), then the truth.
 * Lies nobody picked are listed together at the end.
 */
export function revealScript(options, votes) {
  const t = tally(options, votes);
  const lies = options.filter(o => !o.truth);
  const shown = lies.filter(o => t[o.k].voters.length > 0)
    .sort((a, b) => t[a.k].voters.length - t[b.k].voters.length || (a.k < b.k ? -1 : 1));
  const truth = options.find(o => o.truth);
  const step = o => ({ k: o.k, t: o.t, truth: !!o.truth, house: !!o.house, authors: o.authors, voters: t[o.k].voters.sort(), likes: t[o.k].likes });
  return {
    steps: [...shown.map(step), step(truth)],
    unpicked: lies.filter(o => t[o.k].voters.length === 0).map(step),
  };
}

export const revealDuration = script => REVEAL_LEAD_MS + (script.steps.length - 1) * REVEAL_STEP_MS + REVEAL_TRUTH_MS + REVEAL_TAIL_MS;

// Which reveal step is on screen `ms` after the reveal began (−1 = lead-in, steps.length = tally).
export function revealStepAt(script, ms) {
  if (ms < REVEAL_LEAD_MS) return -1;
  const lies = script.steps.length - 1;
  const t = ms - REVEAL_LEAD_MS;
  if (t < lies * REVEAL_STEP_MS) return Math.floor(t / REVEAL_STEP_MS);
  if (t < lies * REVEAL_STEP_MS + REVEAL_TRUTH_MS) return lies;
  return script.steps.length;
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
  const rows = Object.entries(totals(game, upto)).map(([uid, score]) => ({ uid, score }))
    .sort((a, b) => b.score - a.score || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r.rank = rank; });
  return rows;
}
