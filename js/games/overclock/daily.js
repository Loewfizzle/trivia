// OVERCLOCK — THE DAILY PLUG-IN (OC5 — docs/cartridge.md D2 "THE DAILY PLUG-IN", docs/overclock.md "Solo + the DAILY"). SHIPS OFF: THE DAILY
// MODULE (the city chat's, later) picks + seals the day, passes it in, unlocks it, feeds the streak, owns the daily screen + the rankings.
// PURE (no DOM, no Firebase): the module's server can import it.
//
// INPUT = THE SERVER-PICKED, SEALED DAY SET (never computable from the date — the repo is public): the module picks the day's six challenges +
// their exact items SERVER-SIDE once a day (a seed + a SERVER SECRET) and hands Overclock:
//   daySet = { v: 1, day: 'YYYY-MM-DD',
//              seed: '<opaque — the module's own, from its secret>',      every generator's seed (the challenges' content)
//              order: [six SKILL types],                               one from each brain category (words · numbers · memory · visual ·
//                                                                       knowledge · reflex): a good spread, a knowledge one included,
//                                                                       NEVER DUMB LUCK
//              deal: { ci: [ints | ids] },                              the dealt items (deal.js#dealMatch's shape — STABLE IDS for every pool:
//                                                                       OC6 truefalse · higherlower · timeline · sortit, OC7 trivia · closest ·
//                                                                       missinglink · spellcheck; indexes for Unscramble + Odd One Out). TRIVIA
//                                                                       LIGHTNING's three = three ids of OVERCLOCK's OWN bank (data/oc/trivia.json
//                                                                       or the reserve) — REQUIRED when the order has it; never the live Trivia API
//            }
// create({ date, uid, now, daySet, code }) → the game (a SOLO QUICK match of exactly those six) — FULLY deterministic from the day set: no
//   Math.random, no clock but `now`, no network; the same day set → the same run on every phone. THE SEAL keeps the answers as in any match.
// resumeKey(date, uid) → the one key a day's try lives under: a lock / a refresh mid-run RESUMES (the stored game + the director), never restarts.
// OUTPUT = ONE COMPARABLE SCORE PER RUN: result(game, uid) → { score (the normal Overclock points incl. the speed bonus), time (the total answer
//   time, ms — lower wins a tie), rank (ONE number that orders both: higher = better) }. replay(daySet, record, uid) = THE SERVER's CHECK: the
//   record's per-challenge results re-scored from the scoring table (logic.js#challengeScore) → the same result, or null (a record no run makes).
import { CHALLENGE_MS, MODES, computeResults, totals } from './logic.js';
import { SKILL_TYPES, CATEGORY, partsFor, generate } from './challenges.js';
import { LUCK } from './luck.js';
import { createGame } from './director.js';

export const DAILY_V = 1;
export const DAILY_N = MODES.quick;                 // the SMALLEST OVERCLOCK = a QUICK six
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
// a dealt id (OC6): a pool item's id, or a HIGHER OR LOWER pair "statId|itemId|itemId"
const DEAL_ID = /^[A-Za-z0-9_-]{1,64}(\|[A-Za-z0-9_-]{1,64}){0,2}$/;
const fnv = s => { let x = 0x811c9dc5; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return x.toString(36); };

/** is this a day set Overclock can play? → [] (yes) or the problems */
export function daySetProblems(ds) {
  const out = [];
  if (!ds || typeof ds !== 'object') return ['no day set'];
  if (ds.v !== DAILY_V) out.push(`v must be ${DAILY_V}`);
  if (!DAY_RE.test(String(ds.day || ''))) out.push('day must be YYYY-MM-DD');
  if (typeof ds.seed !== 'string' || ds.seed.length < 12) out.push('seed: the module\'s opaque seed (≥ 12 chars — from its secret, never the date)');
  else if (ds.day && ds.seed.includes(ds.day)) out.push('seed must not contain the date');
  const o = ds.order;
  if (!Array.isArray(o) || o.length !== DAILY_N) out.push(`order: exactly ${DAILY_N} challenges`);
  else {
    if (o.includes(LUCK)) out.push('order: never DUMB LUCK');
    if (!o.every(t => SKILL_TYPES.includes(t))) out.push('order: only Overclock\'s skill challenges');
    if (new Set(o).size !== o.length) out.push('order: six different challenges');
    if (new Set(o.map(t => CATEGORY[t])).size !== o.length) out.push('order: no two from the same brain category');
    if (!o.some(t => CATEGORY[t] === 'knowledge')) out.push('order: at least one knowledge challenge');
    // (OC7 — TRIVIA LIGHTNING's three questions BY ID, from OVERCLOCK's own bank or its reserve — the module never sends question texts)
    const ti = o.indexOf('trivia');
    const td = ti >= 0 && ds.deal && typeof ds.deal === 'object' ? ds.deal[ti] : null;
    if (ti >= 0 && !(Array.isArray(td) && td.length === 3 && td.every(x => typeof x === 'string' && DEAL_ID.test(x)) && new Set(td).size === 3)) out.push('trivia: deal[ci] = three question ids from the own bank');
  }
  if (ds.deal != null && (typeof ds.deal !== 'object' || Object.entries(ds.deal).some(([k, v]) => !(Number(k) >= 0 && Number(k) < DAILY_N) || !Array.isArray(v) || !v.every(x => Number.isInteger(x) || (typeof x === 'string' && DEAL_ID.test(x)))))) out.push('deal: { ci: [ints | ids] }');
  return out;
}

/** the day's match id (the same for everyone that day — from the day + the module's seed, never a clock) */
export const dailyMatchId = ds => `d${String(ds.day).replace(/-/g, '')}${fnv(ds.seed)}`;
/** the one key a day's try lives under */
export const resumeKey = (date, uid) => `overclock:daily:${date}:${uid}`;

/** today's run for ONE player — throws on a day set that isn't playable (the module never ships one) */
export function create({ date, uid, now, daySet, code = 'DAILY' } = {}) {
  const bad = daySetProblems(daySet);
  if (bad.length) throw new Error(`overclock daily: ${bad.join(' · ')}`);
  if (date && date !== daySet.day) throw new Error('overclock daily: the day set is for another day');
  if (!uid || typeof now !== 'number') throw new Error('overclock daily: uid + now (the server clock) are required');
  const matchId = dailyMatchId(daySet);
  // (OC7: TRIVIA LIGHTNING is in the deal by id like every pool — no question bank in the match, no live Trivia API, no top-up; `code` is
  // kept in the signature for the module's calls, nothing is encoded with it any more)
  const game = createGame({ matchId, settings: { mode: 'quick' }, participants: { [uid]: true }, now, seed: daySet.seed,
    order: daySet.order.slice(), deal: daySet.deal || null });
  game.daily = { day: daySet.day, v: DAILY_V };
  return game;
}

/** the comparable score of a run (from the game's own record): the points + the total answer time (a challenge never finished = its 30 s) */
export function result(game, uid) {
  const score = totals(game)[uid] || 0;
  let time = 0;
  for (let ci = 0; ci < DAILY_N; ci++) {
    const t = game.tm && game.tm[ci] && Number(game.tm[ci][uid]);
    time += Number.isFinite(t) ? Math.max(0, Math.min(CHALLENGE_MS, t)) : CHALLENGE_MS;
  }
  return { score, time, rank: rankOf(score, time) };
}
/** ONE number for the rankings: the points first, then the faster run (lower time) */
export const rankOf = (score, time) => Math.round(score) * (DAILY_N * CHALLENGE_MS + 1) + (DAILY_N * CHALLENGE_MS - Math.max(0, Math.min(DAILY_N * CHALLENGE_MS, Math.round(time))));

/**
 * THE SERVER's REPLAY of a finished run: record = { results: { ci: { pts, ok, parts } }, tm: { ci: ms } } (what the module keeps from the game at
 * the finish). Each challenge is re-scored from the scoring table (the same computeResults the match ran — the parts from the day set's own
 * order, the speed from the time) → { score, time, rank } — or null when any number isn't one a real run makes.
 */
export function replay(daySet, record, uid) {
  if (daySetProblems(daySet).length || !record || !uid) return null;
  const g = { id: 'overclock', order: daySet.order, total: DAILY_N, participants: { [uid]: true }, playStartAt: 0, seed: daySet.seed };
  const results = {}, tm = {};
  for (let ci = 0; ci < DAILY_N; ci++) {
    const r = record.results && record.results[ci] && record.results[ci][uid];
    const t = Number(record.tm && record.tm[ci] && record.tm[ci][uid]);
    if (!r || !Number.isFinite(t) || t < 0 || t > CHALLENGE_MS) return null;
    const parts = partsFor(daySet.order[ci], ci / (DAILY_N - 1));
    if (Number(r.parts) !== parts || !(Number(r.ok) >= 0) || Number(r.ok) > parts) return null;
    g.ci = ci;
    const done = t < CHALLENGE_MS;
    const want = computeResults(g, { [uid]: { ok: Number(r.ok), done, doneAt: done ? t : undefined } })[uid];
    if (want.pts !== Number(r.pts)) return null;
    results[ci] = { [uid]: want };
    tm[ci] = { [uid]: t };
  }
  return result({ participants: { [uid]: true }, results, tm }, uid);
}

/** THE PLUG-IN (docs/cartridge.md D2): on: false — the game never switches itself on */
export const daily = Object.freeze({ on: false, create, resumeKey, result, replay, problems: daySetProblems });

// ---------------------------------------------------------------------------------------------- THE DAILY RESERVE (OC6 — docs/cartridge.md D2)
// ~20% of every pool (OC6: TRUE OR FALSE, HIGHER OR LOWER, TIMELINE, SORT IT · OC7: TRIVIA, CLOSEST CALL, MISSING LINK, SPELLCHECK) is kept SERVER-ONLY in api/_data/oc-reserve/<pool>.json (the same
// shapes as data/oc/<pool>.json — never served, never imported by a page, never dealt in a party), so a daily's answers can't be looked up in
// the site's files. A day set's deal may point into the reserve by id. THE DAILY MODULE's server (later) loads party + reserve, picks the day,
// and calls dayContent: the phone gets SHOW only (every item's text — never which is right) and the server keeps KEY to judge each item as it
// closes. PURE (no fs, no Firebase): the server passes the pools in.
export const POOLED = Object.freeze(['truefalse', 'higherlower', 'timeline', 'sortit', 'trivia', 'closest', 'missinglink', 'spellcheck']);
/** what a phone may see of a challenge — the texts, never the answers */
export function publicOf(spec) {
  if (!spec) return null;
  switch (spec.type) {
    case 'truefalse': return { type: spec.type, parts: spec.parts, items: spec.items.map(it => ({ text: it.text })) };
    case 'higherlower': return { type: spec.type, parts: spec.parts, pairs: spec.pairs.map(p => ({ stat: p.stat, ask: p.ask, unit: p.unit, a: { name: p.a.name, v: p.a.v, shown: p.a.shown }, b: { name: p.b.name } })) };
    case 'timeline': return { type: spec.type, parts: spec.parts, title: spec.title, ask: spec.ask, dir: spec.dir, labels: spec.shown.map(pos => spec.items[pos].label) };
    case 'sortit': return { type: spec.type, parts: spec.parts, left: spec.left, right: spec.right, cards: spec.cards.map(c => c.t) };
    case 'trivia': return { type: spec.type, parts: spec.parts, questions: spec.questions.map(q => ({ q: q.q, a: q.a, cat: q.cat })) };
    case 'closest': return { type: spec.type, parts: spec.parts, cat: spec.cat, q: spec.q, unit: spec.unit };
    case 'missinglink': return { type: spec.type, parts: spec.parts, puzzles: spec.puzzles.map(p => ({ words: p.words })) };
    case 'spellcheck': return { type: spec.type, parts: spec.parts, items: spec.items.map(it => ({ options: it.options })) };
    default: return null;
  }
}
/** the answers the server keeps for a challenge (judged item by item as each closes) */
export function answersOf(spec) {
  if (!spec) return null;
  switch (spec.type) {
    case 'truefalse': return spec.items.map(it => it.truth);
    case 'higherlower': return spec.pairs.map(p => ({ up: p.b.v > p.a.v, v: p.b.v, shown: p.b.shown }));
    case 'timeline': return { shown: spec.shown, values: spec.items.map(it => it.value) };
    case 'sortit': return spec.cards.map(c => c.s);
    case 'trivia': return spec.questions.map(q => q.c);
    case 'closest': return { answer: spec.answer, unit: spec.unit };
    case 'missinglink': return spec.puzzles.map(p => ({ answer: p.answer, alt: p.alt, joins: p.joins }));
    case 'spellcheck': return spec.items.map(it => ({ ans: it.ans, word: it.word, hard: it.hard }));
    default: return null;
  }
}
/**
 * SERVER ONLY: the day's pooled challenges from the pools (party + reserve merged: { truefalse, higherlower, timeline, sortit, trivia, closest,
 * missinglink, spellcheck } — the shapes
 * banks.js loads). → { show: { ci: public spec }, key: { ci: answers } } for every pooled challenge of the day (the rest stay as create() builds
 * them). Deterministic from the day set — the same on every call.
 */
export function dayContent(daySet, pools, generateFn = generate) {
  const bad = daySetProblems(daySet);
  if (bad.length) throw new Error(`overclock daily: ${bad.join(' · ')}`);
  const show = {}, key = {};
  daySet.order.forEach((type, ci) => {
    if (!POOLED.includes(type)) return;
    const spec = generateFn(type, { seed: daySet.seed, ci, level: ci / (DAILY_N - 1), occ: 0, deal: (daySet.deal && daySet.deal[ci]) || null }, pools);
    show[ci] = publicOf(spec);
    key[ci] = answersOf(spec);
  });
  return { show, key };
}
