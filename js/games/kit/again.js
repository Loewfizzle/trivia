// THE INSTANT AGAIN (JAYWALK H3 — docs/cartridge.md "THE INSTANT AGAIN"): a solo run's HOP AGAIN / PLAY AGAIN with NO walk inside. A
// cartridge that exports PURE `soloAgain(game, { matchId, now })` → the NEXT run's game (THE GAME FRAME: its own match id, `play` at once)
// gets it: ONE room update swaps the finished match for the new one — every run its OWN match (its own id, its own proof nodes, its own
// night record, its own report) — and the game's screen is up again in a frame (app.js routes by the match id; the start's stamp is
// cleared and the new game carries no `go`, so core/room-show.js#startShow has nothing to show). The console's normal PLAY AGAIN
// (host.js#rematch — THE SOLO START, ~2 s) stays for every cartridge without it.
// A LAZY chunk (ui/final.js loads it with the podium): it reads only exports the boot graph already has (THE STALE-MODULE RULE).
// Only in a room of ONE where this phone is the host (PLAY NOW's solo room, or a room nobody else is in).
import { dbRef, update, remove, serverTimestamp, serverNow } from '../../firebase.js';
import { state, isHost } from '../../store.js';
import { newMatchId } from '../../core/room-show.js';
import { frameProblems } from '../cartridge.js';
import { GAME_MODULES, ALL_PLAYER_NODES, NEW_PLAYER_NODES, PROOF_NODE_LIST } from '../registry.js';
import { pending, matchKey } from '../../profile/queue.js';
import { PROOF_LOCK_MS, PROOF_LOCK_SLACK_MS } from '../../core/room-logic.js';

/** the finished runs whose PROOF NODES stay in the room (a queued report may land after the next run began — api/report.js reads them) */
export const KEEP_RUNS = 4;
const recent = [];
let busy = null;
const endedAt = new Map();   // (matchId → the server's time its run ended on this phone: THE LIVE LOCK's clock)
/** CITY F — A QUEUED REPORT's PROOF (PURE): the runs past the last KEEP_RUNS whose proof may go — NEVER one whose report is still in the
 *  console's queue (/api down: its proof is the server's only evidence; it is tried again at the next run). Mutates `list` (the kept stay).
 *  → the match ids to prune */
export function pruneRuns(code, list, queued, keep = KEEP_RUNS) {
  const out = [];
  let i = 0;
  while (list.length > keep && i < list.length - keep) {
    if (queued(list[i])) { i++; continue; }   // (still queued: kept, the next oldest is looked at)
    out.push(list.splice(i, 1)[0]);
  }
  return out;
}

/** may the match on screen start its next run at once? */
export function canInstant() {
  const g = state.game, mod = g && GAME_MODULES[g.id];
  return !!(g && g.phase === 'final' && mod && typeof mod.soloAgain === 'function' && state.code && state.meta && state.meta.status === 'playing' && isHost()
    && Object.keys(g.participants || {}).length === 1 && g.participants[state.uid] && Object.keys(state.players || {}).length === 1);
}

/** → true once the next run is written (false = not possible here: the caller falls back to the console's PLAY AGAIN) */
export function instantAgain() {
  if (busy) return busy;
  busy = run().catch(e => { console.warn('instant again', e && e.message); return false; }).finally(() => { busy = null; });
  return busy;
}
async function run() {
  if (!canInstant()) return false;
  const code = state.code, g = state.game, mod = GAME_MODULES[g.id];
  const matchId = newMatchId('solo');
  const next = mod.soloAgain(g, { matchId, now: serverNow() });
  if (!next || frameProblems(next, g.id, matchId).length) return false;
  const proof = new Set(PROOF_NODE_LIST);
  // (the last match's player nodes go with it — its PROOF stays: keyed by the match, nothing leaks into the next)
  const patch = { game: next, 'meta/go': null, 'meta/back': null, rv: null, 'meta/activeAt': serverTimestamp(), 'meta/hostBeat': serverTimestamp() };
  for (const n of ALL_PLAYER_NODES) if (!proof.has(n)) patch[n] = null;
  globalThis.__nsAgainAt = performance.now();   // (the game's view reads it: THIS unmount is an instant again — it may keep its scene warm)
  await update(dbRef(`rooms/${code}`), patch);
  // (THE RULES-LAG: the nodes newer than the published rules in a write of their own; the older runs' proofs go one by one — best effort)
  const extra = Object.fromEntries(NEW_PLAYER_NODES.filter(n => !proof.has(n)).map(n => [n, null]));
  if (Object.keys(extra).length) update(dbRef(`rooms/${code}`), extra).catch(() => {});
  recent.push(g.matchId); endedAt.set(g.matchId, serverNow());
  // (HIGH RISE S4B — THE LIVE LOCK: a run's proof tree is the host's to delete only once its GO is 10 min old — a younger one is KEPT in
  //  the list, as a queued one is, and goes at a later run; a run ended AFTER its GO, so its end's time is the safe side)
  const held = m => serverNow() - (endedAt.get(m) || 0) < PROOF_LOCK_MS + PROOF_LOCK_SLACK_MS;
  pruneRuns(code, recent, m => pending(matchKey(code, m)) || held(m)).forEach(old => { endedAt.delete(old); for (const n of PROOF_NODE_LIST) remove(dbRef(`rooms/${code}/${n}/${old}`)).catch(() => {}); });
  return true;
}
