// OVERCLOCK — THE SERVER's RE-GRADE (THE BEFORE-LAUNCH PASS — docs/overclock.md "THE SERVER's RE-GRADE"; the owner approved it from
// docs/games/passes/console-fix.md's ranked list). PURE: api/report.js runs it on a match's FINAL game before anything is credited.
//
// The host's `final` game carries every challenge's results — host-authored. The server rebuilds each challenge exactly as the host's
// director did (grade.js#gradeRoom from the seed + the deal + the players' SEALED picks, then logic.js#computeResults over the players'
// OWN signed boards) and a result that disagrees refuses the match (api/report.js: 409 'mismatch', sealed as a wreck — never a win):
// - `ok` — the right parts — = min(the player's own board, the server's grade of their sealed picks), as the host's own grade.
// - `pts` — from that ok + the board's server-stamped `doneAt` + the challenge's start. The start is not kept after its challenge: it is
//   read back from the host's FASTEST clock (`tm/{ci}` = doneAt − start, rounded) and must be ONE start for every finisher; the points are
//   checked across the half-millisecond the rounding leaves. (A host can still move one challenge's start for everyone at once — every
//   finisher's speed bonus moves together, inside THE HUMAN FLOOR. Named in docs/overclock.md.)
// - CLOSEST CALL's bonus from everyone's re-graded guesses; DUMB LUCK = its stored race replayed (luck.js#dlVerify — the draw is the
//   host's, as ever).
// THE ONE RACE ALLOWED: a phone that sent its last pick in a write of its own AFTER its board's done (the code before this pass — its
// envelope's `at` later than the board's `doneAt`) may be graded one part lower by a host that saw the board first: that player's `ok` is
// taken one part under the server's grade too. The phone now sends the picks in the board's own write (view.js — one atomic write).
// THE ACCEPTED LIMIT (unchanged, docs/overclock.md): the 7 types with no pick to grade (signal lock, memory, unscramble, missing link,
// higher or lower, compass, rewire) keep the phone's own `ok` — the server checks only that the host copied it.
import { computeResults, levelOf } from './logic.js';
import { CHALLENGE_MS } from './meta.js';
import { partsFor } from './challenges.js';
import { gradeRoom, HOST_GRADED } from './grade.js';
import { LUCK, dlVerify } from './luck.js';
import { BANK_TYPES } from './banks.js';
import { mergeSealed } from '../kit/seal.js';

const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const same = (a, b) => Math.abs(num(a) - num(b)) < 1e-9;

/**
 * game: the room's final game · oc: rooms/{CODE}/oc/{matchId} ({ ci: { uid: board } }) · seal: seal/{CODE}/oc/{matchId} ({ ci: { uid: envelope } })
 * · bank(type) → the pool the deal's ids index ({} for a type with none) → { ok: true } | { ok: false, why, ci?, uid? }
 */
export function ocRegrade(game, { oc = {}, seal = {}, bank = () => ({}) } = {}) {
  if (!game || game.id !== 'overclock' || !Array.isArray(game.order)) return { ok: false, why: 'no match' };
  const total = num(game.total), uids = Object.keys(game.participants || {}), res = game.results || {}, tm = game.tm || {};
  if (game.order.length !== total || total < 1) return { ok: false, why: 'the order' };
  for (let ci = 0; ci < total; ci++) {
    const type = game.order[ci], R = res[ci];
    if (!R || typeof R !== 'object') return { ok: false, why: 'a challenge with no results', ci };
    if (type === LUCK) { if (!dlVerify(game, ci).ok) return { ok: false, why: 'DUMB LUCK’s race', ci }; continue; }
    const pub = (oc && oc[ci]) || {}, env = (seal && seal[ci]) || {};
    const boards = mergeSealed(pub, env);
    const g = { ...game, ci, phase: 'play' };
    // (the host graded a bank type only with its pool loaded — a deal's ids index it; no deal = the challenge's seeded deck, graded the same)
    const graded = HOST_GRADED.includes(type) ? gradeRoom(g, { seal_boards: env }, { bank: t => (BANK_TYPES.includes(t) ? bank(t) || null : {}) }) : null;
    // (the server's own copy of a pool unreadable: it can't grade — the host's ok is held only to the player's own board, as before this pass)
    const blind = HOST_GRADED.includes(type) && BANK_TYPES.includes(type) && !bank(type);
    const parts = partsFor(type, levelOf(ci, total));
    // THE ONE RACE ALLOWED (above): the host may have graded this player one part lower
    const late = u => HOST_GRADED.includes(type) && type !== 'timeline' && type !== 'closest' && !!(env[u] && pub[u]) && num(env[u].at) > num(pub[u].doneAt || pub[u].at);
    const want = {};
    for (const u of uids) {
      const own = Math.min(parts, Math.max(0, num(((boards[u]) || {}).ok)));
      const gr = graded && graded[u] != null ? Math.min(parts, Math.max(0, num(graded[u]))) : null;
      want[u] = gr == null ? own : Math.min(own, gr);
      const got = R[u] ? num(R[u].ok) : 0;
      if (blind ? got > own + 1e-9 || got < 0 : !same(got, want[u]) && !(late(u) && got < want[u] && got >= want[u] - 1)) return { ok: false, why: 'the right answers', ci, uid: u };
    }
    const okUsed = Object.fromEntries(uids.map(u => [u, R[u] ? num(R[u].ok) : 0]));
    // the challenge's start: the one P every finisher's FASTEST clock says (tm = round(doneAt − P), clamped 0 … CHALLENGE_MS)
    const T = tm[ci] || {};
    let lo = -Infinity, hi = Infinity;
    for (const u of uids) {
      const b = pub[u];
      if (!(b && b.done && typeof b.doneAt === 'number')) continue;
      const t = Number(T[u]);
      if (!Number.isFinite(t)) return { ok: false, why: 'the clock', ci, uid: u };
      if (t <= 0 || t >= CHALLENGE_MS) continue;   // (clamped: no speed bonus either way)
      lo = Math.max(lo, b.doneAt - t - 0.5); hi = Math.min(hi, b.doneAt - t + 0.5);
    }
    if (lo > hi + 1e-6) return { ok: false, why: 'the clock (two starts)', ci };
    // (nobody finished inside the clock: no speed bonus for anyone — any start far enough back gives the same points)
    const starts = Number.isFinite(lo) ? [lo, hi] : [-1e15];
    const at = starts.map(P => computeResults({ ...g, playStartAt: P }, pub, okUsed));
    for (const u of uids) {
      const got = R[u] || {}, cands = at.map(r => r[u]);
      const lowP = Math.min(...cands.map(c => c.pts)), highP = Math.max(...cands.map(c => c.pts));
      if (!Number.isInteger(num(got.pts)) || num(got.pts) < lowP || num(got.pts) > highP) return { ok: false, why: 'the points', ci, uid: u };
      // (THE HUMAN FLOOR's mark — no REDLINE — as a start inside the window gives it)
      if (!!got.fl !== !!cands[0].fl && !!got.fl !== !!cands[cands.length - 1].fl) return { ok: false, why: 'the floor', ci, uid: u };
    }
  }
  return { ok: true };
}
