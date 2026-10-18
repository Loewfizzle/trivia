// HIGH STAKES — pure rules: chips, bets, payouts, house loans, standings, the round plan. No DOM, no Firebase, no clocks.
//
// Each round shows only the category and difficulty; everyone secretly bets, then answers one multiple-choice question.
// Right = +bet × payout (MEDIUM 1×, HARD 2×, ×2 on DOUBLE DOWN rounds); wrong or no answer = −bet. A player who hits 0
// gets a HOUSE LOAN of 200 (any number of times); loans are subtracted from the final total, so nobody wins on credit.
// Stacks, loans and best wins are DERIVED from game.res (never stored), so replaying a step can't double-count.
import { rngFrom, shuffle } from '../../core/rng.js';

export const START = 1000;
export const LOAN = 200;
export const ROUNDS = 10;                 // + the final
export const FINAL = ROUNDS;              // round index of ALL IN
export const DOUBLE_DOWN = [3, 7];        // rounds 4 and 8
export const MS = { intro: 4200, cat: 4600, dd: 3400, allin: 5200, bet: 15000, q: 20000, stand: 5200, finalPause: 1800 };
export const DEFAULT_SETTINGS = {};

// categories as the table names them; each maps to the sources (Open Trivia DB ids / names, The Trivia API, the bundled bank)
export const CATEGORIES = [
  { id: 'science', label: 'SCIENCE', otdb: [17, 19], tapi: 'science', bank: 'science' },
  { id: 'history', label: 'HISTORY', otdb: [23], tapi: 'history', bank: 'history' },
  { id: 'geography', label: 'GEOGRAPHY', otdb: [22], tapi: 'geography', bank: 'geography' },
  { id: 'film', label: 'FILM & TV', otdb: [11, 14], tapi: 'film_and_tv', bank: 'screen' },
  { id: 'music', label: 'MUSIC', otdb: [12], tapi: 'music', bank: 'music' },
  { id: 'sports', label: 'SPORTS', otdb: [], tapi: 'sport_and_leisure', bank: 'sports' },
  { id: 'arts', label: 'ART & LITERATURE', otdb: [10, 25], tapi: 'arts_and_literature', bank: 'arts' },
  { id: 'tech', label: 'TECHNOLOGY', otdb: [18, 30], tapi: null, bank: null },
  { id: 'nature', label: 'NATURE', otdb: [27], tapi: null, bank: null },
  { id: 'myth', label: 'MYTHOLOGY', otdb: [20], tapi: null, bank: null },
  { id: 'general', label: 'GENERAL KNOWLEDGE', otdb: [9], tapi: 'general_knowledge', bank: 'general' },
];
export const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
export const catLabel = id => (CAT[id] || CAT.general).label;

/** Open Trivia DB category name → our category (its names are 'Science & Nature', 'Entertainment: Film', …). */
export function catFromOtdb(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('computer') || n.includes('gadget')) return 'tech';
  if (n.includes('animal')) return 'nature';
  if (n.includes('mythology')) return 'myth';
  if (n.includes('science') || n.includes('mathematic')) return 'science';
  if (n.includes('history') || n.includes('politics')) return 'history';
  if (n.includes('geography')) return 'geography';
  if (n.includes('film') || n.includes('television')) return 'film';
  if (n.includes('music')) return 'music';
  if (n.includes('sport')) return 'sports';
  if (n.includes('book') || n.includes(' art') || n === 'art') return 'arts';
  if (n.includes('general')) return 'general';
  return null;                            // video games, anime, board games, comics, vehicles…: not this table's style
}
const TAPI = Object.fromEntries(CATEGORIES.filter(c => c.tapi).map(c => [c.tapi, c.id]));
export const catFromTapi = slug => TAPI[slug] || null;
const BANK = Object.fromEntries(CATEGORIES.filter(c => c.bank).map(c => [c.bank, c.id]));
export const catFromBank = id => BANK[id] || 'general';

export const isDoubleDown = round => DOUBLE_DOWN.includes(round);
export const isFinal = round => round === FINAL;
/** MEDIUM 1×, HARD 2×, doubled on DOUBLE DOWN rounds. */
export const payout = (d, round) => (d === 'hard' ? 2 : 1) * (isDoubleDown(round) ? 2 : 1);

/** 10 % of the stack, rounded, at least 10 chips (all of it when the stack is under 10). */
export function minBet(stack) {
  if (!(stack > 0)) return 0;
  if (stack < 10) return stack;
  return Math.min(stack, Math.max(10, Math.round(stack * 0.1)));
}
/** A bet as the table takes it: missing or invalid = the minimum; never above the stack. */
export function clampBet(b, stack) {
  const min = minBet(stack);
  if (typeof b !== 'number' || !Number.isFinite(b)) return min;
  return Math.max(min, Math.min(stack, Math.round(b)));
}

const roundKeys = game => Object.keys(game.res || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);

/**
 * The chips ledger, replayed from the results: { uid: { stack, loans, loanN, net, rt, best, right, played } }.
 * upto: rounds < upto only (the state before round `upto`).
 */
export function ledger(game, upto = Infinity) {
  const out = {};
  for (const uid of Object.keys(game.participants || {})) out[uid] = { stack: START, loans: 0, loanN: 0, net: START, rt: 0, best: 0, right: 0, played: 0 };
  for (const r of roundKeys(game)) {
    if (r >= upto) break;
    for (const [uid, x] of Object.entries(game.res[r] || {})) {
      const o = out[uid];
      if (!o || !x) continue;
      o.stack += x.d || 0;
      o.rt += x.t || 0;
      o.played += 1;
      if (x.ok) o.right += 1;
      if ((x.d || 0) > o.best) o.best = x.d;
      if (o.stack <= 0) { o.stack += LOAN; o.loans += LOAN; o.loanN += 1; }
    }
  }
  for (const o of Object.values(out)) o.net = o.stack - o.loans;
  return out;
}

/**
 * One round's results from the hidden bets and answers.
 * hidden: { uid: { b?: { b }, a?: { a, at } } }; qStartAt: when the question appeared (server ms).
 * → { uid: { b, a (−1 = none), ok, d, t } }
 */
export function resolveRound(game, round, hidden, correct, qStartAt) {
  const before = ledger(game, round);
  const plan = (game.plan || {})[round] || {};
  const mult = payout(plan.d, round);
  const out = {};
  for (const uid of Object.keys(game.participants || {})) {
    const h = (hidden && hidden[uid]) || {};
    const stack = before[uid] ? before[uid].stack : START;
    const b = clampBet(h.b && h.b.b, stack);
    const answered = !!(h.a && Number.isInteger(h.a.a) && h.a.a >= 0 && h.a.a <= 3);
    const a = answered ? h.a.a : -1;
    const ok = answered && a === correct;
    const t = answered && typeof h.a.at === 'number' ? Math.max(0, Math.min(MS.q, h.a.at - qStartAt)) : MS.q;
    out[uid] = { b, a, ok, d: ok ? b * mult : -b, t };
  }
  return out;
}

/** Final standings: chips minus loans, then the fastest total answer time. [{ uid, rank, score, net, stack, loans, rt }] */
export function standings(game, upto = Infinity) {
  const L = ledger(game, upto);
  const rows = Object.entries(L).map(([uid, o]) => ({ uid, score: o.net, net: o.net, stack: o.stack, loans: o.loans, rt: o.rt, best: o.best, right: o.right }))
    .sort((a, b) => b.net - a.net || a.rt - b.rt || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { const sig = `${r.net}|${r.rt}`; if (sig !== prev) { rank = i + 1; prev = sig; } r.rank = rank; });
  return rows;
}

/** ALL IN: the showdown reveals from last place to first (standings before the final). */
export const finalOrder = game => standings(game, FINAL).map(r => r.uid).reverse();

// ------------------------------------------------------------------ the round plan
/**
 * The difficulty each round aims for: a seeded mix, roughly half HARD, never three of a kind in a row, the final HARD.
 * (If the bank has no question of that difficulty yet, the round takes the other one.)
 */
export function difficultyPlan(seed) {
  const R = rngFrom(`${seed}:stakes:diff`);
  for (let tries = 0; tries < 200; tries++) {
    const d = Array.from({ length: ROUNDS }, (_, i) => (i === 0 ? 'medium' : R() < 0.5 ? 'hard' : 'medium'));
    const hard = d.filter(x => x === 'hard').length;
    let ok = hard >= 4 && hard <= 6;
    for (let i = 2; i < ROUNDS && ok; i++) if (d[i] === d[i - 1] && d[i] === d[i - 2]) ok = false;
    if (ok) return [...d, 'hard'];
  }
  return ['medium', 'hard', 'medium', 'hard', 'medium', 'hard', 'medium', 'hard', 'medium', 'hard', 'hard'];
}

/**
 * Picks round `round`'s question from the bank's public index (qmeta: { i: "cat|d" }), never the previous round's
 * category, preferring categories the match hasn't had (then the least used). → { i, cat, d } | null
 */
export function pickQuestion(game, round) {
  const used = new Set(Object.values(game.plan || {}).map(p => p.i));
  const prev = game.plan && game.plan[round - 1] ? game.plan[round - 1].cat : null;
  const counts = {};
  for (const p of Object.values(game.plan || {})) counts[p.cat] = (counts[p.cat] || 0) + 1;
  const want = (game.dplan || difficultyPlan(game.matchId))[round] || 'medium';
  const R = rngFrom(`${game.matchId}:stakes:pick:${round}`);
  const pool = Object.entries(game.qmeta || {}).map(([i, m]) => { const [cat, d] = String(m).split('|'); return { i: Number(i), cat, d }; })
    .filter(x => !used.has(x.i) && x.cat !== prev);
  const choose = d => {
    const list = pool.filter(x => x.d === d);
    if (!list.length) return null;
    const least = Math.min(...list.map(x => counts[x.cat] || 0));
    const fresh = list.filter(x => (counts[x.cat] || 0) === least);
    const cats = shuffle(R, [...new Set(fresh.map(x => x.cat))]);
    const cat = cats[0];
    const inCat = fresh.filter(x => x.cat === cat);
    return inCat[Math.floor(R() * inCat.length)];
  };
  return choose(want) || (isFinal(round) ? null : choose(want === 'hard' ? 'medium' : 'hard'));
}

/** How long the showdown runs for n players (cards flip one after another, then the chips move). */
export const showMs = (n, final = false) => (final ? 2600 + n * 2600 + 2200 : 2400 + n * 650 + 2600);

/** Rough match length for the lobby. */
export const estimateMinutes = (s, n = 4) => Math.round((ROUNDS + 1) * (MS.cat + MS.bet * 0.7 + MS.q * 0.6 + showMs(n) + MS.stand) / 60000 + 0.5);
