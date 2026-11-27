// FREEFALL — THE DIRECTOR (F4A — docs/freefall.md "THE CARTRIDGE"; HIGH RISE's S4A director is the pattern): the PURE host step. THE GAME (→ §1, docs/freefall.md MODULE NOTES)
import { cleanSettings } from './meta.js';
import { modeOf, seedOf } from './logic.js';
import { judgeSolo, judgeMatch } from './proof.js';
import { onTime } from '../../core/proof.js';
import { COUNT_MS, NO_GO_MS, END_GRACE_MS, UNPROVEN_MS, matchStart, startOf, capAt, endedFor, scoreCalls, goBeforeGiveUp } from './match.js';

/** FIX B — S1: the nodes whose END had landed when the podium was written (`game.ends` — a re-score is owed when another one lands) */
const endsOf = (ids, runs) => { const o = {}; for (const u of ids) if (runs[u] && runs[u].e) o[u] = 1; return o; };

/** the match (start() adds nothing else): `now` = the moment the MATCH begins (after the walk inside) */
export function createGame({ matchId, settings, participants, now, seed, look = '' }) {
  const mode = modeOf(participants), solo = mode === 'solo';
  return {
    id: 'freefall', matchId, settings: cleanSettings(settings), participants, mode,
    seed: solo ? String(seed) : '',   // (a MATCH's seed is picked AFTER GO — the step count → play; a SOLO run's from its own GO — never this)
    phase: solo ? 'play' : 'count', phaseStartAt: now, playAt: solo ? now : now + COUNT_MS,
    ...(!solo && (look === 'day' || look === 'night') ? { look } : {}),   // (THE LOOK LOCK: the host's look, every phone's for the whole match)
  };
}

const NONE = Object.freeze({ f: 0, t: 0, w: '', e: -1 });
/**
 * ONE proof node → its result row — THE JUDGE's (the host's podium and the server's count both come through proof.js#judgeNode):
 * { f: floors, t: the tick that floor was reached, w: the cause, e: the end's tick, b / bl / br (bounces · blazes · the best no-bounce run —
 * the end card's line), go (the run's own GO), h? (the holds used), ft? (the feats), cut? (a slowed log / a hold with no way back: counted
 * to its last on-time event), bad? (why — a refused log: no run) }. No GO = no run. `mirror` = the host's own live mirror (proof.js).
 */
const rowOf = (v, node, solo) => {
  if (!v.ok) return { ...NONE, ...(solo ? { go: Number(node.go) } : {}), bad: String(v.why || 'refused').slice(0, 24) };
  const ft = Object.keys(v.feats || {}).filter(k => v.feats[k]).join(' ');
  return { f: v.floor, t: v.tick, w: v.cause, e: v.end, b: v.bounces, bl: v.blazes, br: v.bestRun, ...(solo ? { go: Number(node.go) } : {}), ...(v.holds ? { h: v.holds } : {}), ...(ft ? { ft } : {}), ...(v.cut ? { cut: 1 } : {}) };
};
export function scoreNode(code, matchId, node, mirror = true) {
  if (!node || !(Number(node.go) > 0)) return { ...NONE };
  return rowOf(judgeSolo({ code, matchId, node, mirror }), node, true);
}
/** F4B — a MATCH's node: judged on THE FIRST GO's seed + clock (tick 0 = game.playAt — exactly as the server's freefallMatch does) */
export function scoreMatchNode(game, node) {
  if (!node || !(Number(node.go) > 0) || !game.seed) return { ...NONE };
  // (THE PROOF PASS — the server's guard, on the host's podium too: a GO later than the window after THE FIRST GO is no run)
  if (game.g0 > 0 && !onTime(node, game.g0)) return { ...NONE, bad: 'late go' };
  return rowOf(judgeMatch({ seed: game.seed, node, playAt: game.playAt, mirror: true }), node, false);
}
export function finalPatch(game0, runs, now, code) {
  if (game0.mode === 'solo') {
    const results = {};
    for (const uid of Object.keys(game0.participants || {})) results[uid] = scoreNode(code, game0.matchId, runs[uid]);
    return { phase: 'final', phaseStartAt: now, endAt: now, results };
  }
  // (THE NODES ARE THE TRUTH: a match is scored on THE FIRST GO's seed + clock, as the server's own count is; if the game ever said
  //  otherwise the patch puts it right)
  const S = startOf(game0, runs, code), moved = !!S && (S.seed !== game0.seed || S.playAt !== game0.playAt);
  const game = moved ? { ...game0, seed: S.seed, playAt: S.playAt, g0: S.g0 } : game0;
  const results = {};
  for (const uid of Object.keys(game.participants || {})) results[uid] = game.unproven ? { ...NONE } : scoreMatchNode(game, runs[uid]);
  const patch = { phase: 'final', phaseStartAt: now, endAt: now, results, ends: endsOf(Object.keys(game.participants || {}), runs), ...(moved ? { seed: S.seed, playAt: S.playAt, g0: S.g0 } : {}) };
  const calls = game.unproven ? {} : scoreCalls(game, runs, results);
  if (Object.keys(calls).length) patch.calls = calls;
  return patch;
}

/** → a patch, or null */
export function nextStep(game, { now, live, code = '', online = null } = {}) {
  if (!game || !game.phase) return null;
  const runs = (live && live.runs) || {}, ids = Object.keys(game.participants || {});
  if (game.phase === 'count') {
    if (game.mode === 'solo') return now >= game.playAt ? { phase: 'play', phaseStartAt: game.playAt } : null;
    const S = matchStart(code, game.matchId, runs);
    if (S) return now >= S.playAt ? { phase: 'play', phaseStartAt: S.playAt, playAt: S.playAt, seed: S.seed, g0: S.g0 } : null;
    return now >= game.playAt + NO_GO_MS ? { phase: 'play', phaseStartAt: now, playAt: now + 800, seed: seedOf(code, game.matchId, `u${now}`), unproven: 1 } : null;
  }
  if (game.phase === 'final') return rescore(game, runs, now, code);
  if (game.phase !== 'play') return null;
  if (game.mode !== 'solo') {
    if (now >= capAt(game) + END_GRACE_MS) return finalPatch(game, runs, now, code);
    if (game.unproven) {
      // (a FIRST GO the server stamped before this host gave up = a hiccup of the host's, not a match without proof: the unproven mark is
      //  taken back and the match falls on the GO's seed + tick 0 — the phones' own startOf already does)
      const S = matchStart(code, game.matchId, runs);
      if (goBeforeGiveUp(game, S)) return { unproven: null, playAt: S.playAt, seed: S.seed, g0: S.g0 };
      return now >= game.playAt + UNPROVEN_MS ? finalPatch(game, runs, now, code) : null;
    }
    const done = ids.length > 0 && ids.every(u => endedFor(game, runs[u], now, !online || !!online[u]));
    return done ? finalPatch(game, runs, now, code) : null;
  }
  // (THE FRESH-EYES REVIEW — AN UNPROVEN RUN's MATCH ENDS TOO: a SOLO run with no GO never writes `e` — its match stayed `play` for ever and
  //  PLAY AGAIN on its card could only start over in the spent match, uncounted. The host — the same phone, a room of one — marks it
  //  ended (`game.x/{uid}`, view.js#again): the match closes with the judge's row of a node that is not there — floor 0, never counted)
  const gone = u => game.mode === 'solo' && !!game.x && !!game.x[u];
  return ids.length > 0 && ids.every(u => (runs[u] && runs[u].e) || gone(u)) ? finalPatch(game, runs, now, code) : null;
}
/**
 * FIX B — S1 A SILENT PHONE (the owner's call: keep the 18 s rule + RE-SCORE): the podium was written while a phone was silent (presence
 * still "online" after a hard drop) — when that player's END lands AFTER the final and before the cap's grace is over, the host scores the
 * match again from the nodes as they stand: `results` (+ the calls) — written with `phase: 'final'` so the night record is written again
 * too (host.js#roomPatch); the podium's own moment (phaseStartAt / endAt) is kept. An end that changes no row only marks itself seen.
 * Only a podium that recorded its ends (`game.ends`) is ever re-scored; once each, so the host's judge runs at a landing, never a frame.
 */
export function rescore(game, runs, now, code) {
  if (game.mode === 'solo' || game.unproven || !game.ends || !game.results || !(now < capAt(game) + END_GRACE_MS)) return null;
  const ids = Object.keys(game.participants || {}), fresh = ids.filter(u => runs[u] && runs[u].e && !game.ends[u]);
  if (!fresh.length) return null;
  const P = finalPatch({ ...game, phase: 'play' }, runs, now, code), ends = { ...game.ends };
  for (const u of fresh) ends[u] = 1;
  const same = ids.every(u => JSON.stringify(P.results[u] || null) === JSON.stringify(game.results[u] || null));
  if (same) return { ends };
  return { phase: 'final', results: P.results, ends, calls: P.calls || null, rescored: (Number(game.rescored) || 0) + 1 };
}
/** the run as it stands → the podium (the host's END GAME) */
export const endNow = (game, { now, live, code = '' } = {}) => (game && (game.phase === 'count' || game.phase === 'play') ? finalPatch(game, (live && live.runs) || {}, now, code) : null);

/** PLAY AGAIN after a SOLO run (PURE — the console's INSTANT AGAIN: games/kit/again.js): the NEXT run — a match of its own (its own id,
 *  its own proof node, its own report), the same player, `play` at once. null = not a finished solo run. */
export const nextRun = (game, { matchId, now }) => (game && game.phase === 'final' && game.mode === 'solo' && matchId
  ? createGame({ matchId, settings: game.settings, participants: game.participants, now, seed: `again:${game.matchId}` }) : null);
