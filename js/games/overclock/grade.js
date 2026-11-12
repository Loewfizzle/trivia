// OVERCLOCK — HOST-GRADED ANSWERS (FR7 FIXES A — the owner's decision 1, Nov 12; docs/overclock.md "HOST-GRADED"). PURE.
// Every phone still grades itself for its OWN screen (right = green, the pips, the combo) — but the POINTS come from the HOST: each phone seals
// its per-part PICKS (`a` — the same picks THE ANSWER screen keeps) in its envelope (THE SEAL: no other phone reads them); after PENCILS DOWN
// the host rebuilds the dealt challenge (challenges.js#generate — the same code every phone runs) and re-grades the picks here. A phone's own
// `ok` can only LOWER the graded one (min) — never raise it. The server's REDLINE + the reports read the results the host wrote.
//
// THE HONEST LIMIT (said in the pass log): the challenge — and so its right answers — is built on every phone (that's what makes it instant);
// a guest who reads them out of their own phone and writes the right PICKS still scores them. Grading closes the one-line self-grade
// (`ok: 3` with wrong or no answers); the real closer is answers dealt by the server (after THE LAUNCH, if ever — the owner).
//
// STILL TRUSTED (no pick to grade): SIGNAL LOCK (reflex — a reaction time is the phone's own clock), MEMORY (the taps), UNSCRAMBLE (any real
// anagram — the word lists), MISSING LINK (its accepted joins), HIGHER OR LOWER (a streak), COMPASS, REWIRE (the board's turns); DUMB LUCK is
// the host's draw already.
import { clashAnswer, timelineCorrect, closestCredit, sortOk, generate } from './challenges.js';

export const HOST_GRADED = Object.freeze(['trivia', 'truefalse', 'math', 'pattern', 'spellcheck', 'stroop', 'oddone', 'count', 'sortit', 'timeline', 'closest']);
/** the picks' longest sealed form (the rules' bound on `a`) */
export const PICKS_MAX = 400;

const r2 = v => Math.round(v * 100) / 100;
const eqCount = (list, picks, rightOf) => list.reduce((n, it, i) => n + (picks[i] != null && picks[i] === rightOf(it) ? 1 : 0), 0);

/** the picks → their sealed string (JSON, ≤ PICKS_MAX; a SORT IT deck's are digits) — null when nothing to send */
export function packPicks(picks) {
  if (!Array.isArray(picks) || !picks.length) return null;
  const s = JSON.stringify(picks.map(p => (p === undefined ? null : p)));
  return s.length <= PICKS_MAX ? s : null;
}
export function unpackPicks(a) {
  if (typeof a !== 'string' || a.length > PICKS_MAX) return null;
  try { const v = JSON.parse(a); return Array.isArray(v) ? v : null; } catch { return null; }
}

/**
 * THE HOST's GRADE of one player's challenge: (type, the dealt spec, the unsealed envelope { a, o, g }) → ok (the same units as the phone's —
 * SORT IT net sorts, QUICK COUNT's off-by-one = ½, CLOSEST CALL's credit) · null = not a host-graded type / no spec (then the phone's ok stands)
 */
export function gradeAnswers(type, spec, env = {}) {
  if (!spec || !HOST_GRADED.includes(type)) return null;
  const e = env || {};
  if (type === 'timeline') return typeof e.o === 'string' && /^[0-3]{4}$/.test(e.o) ? timelineCorrect(spec, [...e.o].map(Number)) : 0;
  if (type === 'closest') return typeof e.g === 'number' && Number.isFinite(e.g) ? r2(closestCredit(e.g, spec.answer)) : 0;
  const picks = unpackPicks(e.a) || [];
  switch (type) {
    case 'trivia': return eqCount(spec.questions, picks, q => q.c);
    case 'truefalse': return eqCount(spec.items, picks, it => it.truth);
    case 'math': return eqCount(spec.problems, picks, pr => pr.ans);
    case 'pattern': return eqCount(spec.seqs, picks, sq => sq.ans);
    case 'spellcheck': return eqCount(spec.items, picks, it => it.ans);
    case 'stroop': return eqCount(spec.items, picks, it => clashAnswer(spec, it));
    case 'oddone': return eqCount(spec.grids, picks, g => g.idx);
    case 'count': return r2(spec.items.reduce((n, it, i) => { const p = picks[i]; return n + (p == null ? 0 : p === it.ans ? 1 : Math.abs(p - it.ans) === 1 ? 0.5 : 0); }, 0));
    case 'sortit': {
      let right = 0, wrong = 0;
      spec.cards.forEach((c, i) => { const p = picks[i]; if (p == null) return; if (p === c.s) right++; else wrong++; });
      return sortOk(right, wrong);
    }
    default: return null;
  }
}

/**
 * THE HUMAN FLOOR (decision 1's cheap bound): the fastest a person could really finish a challenge of this type — every part read + tapped.
 * A finish (doneAt − the play's start) under it earns NO speed bonus and marks the result `fl` (no REDLINE). Generous on purpose: a fast
 * honest player is never near it.
 */
export const FLOOR_PART_MS = 350;
const FLOOR_TYPE_MS = { closest: 1500, timeline: 2000, sortit: 3000, higherlower: 3000, memory: 0, reflex: 0, compass: 0, dumbluck: 0 };
export function humanFloorMs(type, parts) {
  if (FLOOR_TYPE_MS[type] != null) return FLOOR_TYPE_MS[type];
  return Math.max(1, Number(parts) || 1) * FLOOR_PART_MS;
}

/**
 * THE ROOM's GRADE (index.js#gradeRoom calls it after the unseal — PURE: `bank(type)` = the loaded pool | null, {} for a type with none): the
 * host rebuilds the dealt challenge (the same generate() every phone ran) and grades each player's sealed picks → { uid: ok } | null.
 * Picks (`a`) are sealed only on rules that know them: no envelope in the room with `a` = the old rules → null (the phones' ok stands — the
 * fallback until the re-publish); once one has them, a missing one grades as no answers. TIMELINE + CLOSEST CALL grade from the order / the
 * guess every phone has always sealed. A pool not loaded → null (the phones' ok, this once).
 */
export function gradeRoom(game, live, { bank = () => ({}) } = {}) {
  if (!game || game.phase !== 'play' || !Array.isArray(game.order)) return null;
  const type = game.order[game.ci];
  if (!HOST_GRADED.includes(type)) return null;
  const env = (live && live.seal_boards) || {};
  const picksLive = Object.values(env).some(e => e && typeof e.a === 'string');
  if (!picksLive && type !== 'timeline' && type !== 'closest') return null;
  const b = bank(type);
  if (b == null) return null;
  const deps = b && Object.keys(b).length ? { [type]: b } : {};
  const occ = game.order.slice(0, game.ci).filter(t => t === type).length;
  const level = game.total <= 1 ? 0 : game.ci / (game.total - 1);   // (logic.js#levelOf)
  let spec = null;
  try { spec = generate(type, { seed: game.seed, ci: game.ci, level, occ, deal: (game.deal && game.deal[game.ci]) || null }, deps); } catch { spec = null; }
  if (!spec) return null;
  const out = {};
  for (const uid of Object.keys(game.participants || {})) { const g = gradeAnswers(type, spec, env[uid] || {}); if (g != null) out[uid] = g; }
  return out;
}
