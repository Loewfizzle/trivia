// FREEFALL — THE MATCH's RULES (F4B — docs/freefall.md "THE MATCH"; HIGH RISE's match.js is the pattern, JAYWALK's start number for number):
// ONE ball each down the SAME tower (THE FIRST GO's seed, the server's time), 2 … 8 players; ONE life, NO holds (a hidden page runs on);
// THE FINISH = THE BOTTOM (floor 200: MADE IT) or the 3:00 cap, whichever first; the deepest wins, then the earlier tick. The results are
// REPLAYED from each player's own input log (the proof node rooms/{CODE}/ff/{matchId}/{uid}) — never a number a phone claims.
// PURE (no DOM, no clock) — the phones, the host's director AND the server agree. Its own module: logic.js stays what THE LAB loads.
import { CALL_MS, callBonus } from '../../core/playlist.js';
import { TICK_HZ, MODES } from './tuning.js';
import { seedOf, gameStandings } from './logic.js';
import { firstGo, inMatch, fullDraw, liveGoers } from '../../core/proof.js';

export { CALL_MS, firstGo };
export const COUNT_MS = 3000;             // (3 · 2 · 1 before GO)
/** THE MATCH's START (JAYWALK's exact start): every phone writes its own GO in the count's last 2 s; THE FIRST GO to land picks the seed
 *  AND sets tick 0 = that time + this, for everyone */
export const GO_LEAD_MS = 2000;
/** no GO at all this long after the count's end (no signal anywhere, the rules not published) → the match plays UNPROVEN, never counted */
export const NO_GO_MS = 3000;
/** after the 3:00 cap: the last chunks land */
export const END_GRACE_MS = 4000;
/** THE DROPPED SIGNAL in a match (proof.js#CLOCK.drop — pinned equal by a test): an OFFLINE player's end is waited for this long (their
 *  moves may still be queued on the phone) before the match ends without it */
export const DROP_WAIT_MS = 75000;
/** a ball nobody steers is OUT within 9 s (THE LIGHTS GO OUT): a player whose proof has not moved for this long, with no end signalled,
 *  has a dead phone — the room stops waiting (an OFFLINE one gets DROP_WAIT_MS on top). 18 s — JAYWALK's + HIGH RISE's own (pinned equal) */
export const IDLE_OUT_MS = 18000;
/** an UNPROVEN match (no proof can be written — nobody's end can be signalled) simply ends after this (JAYWALK's) */
export const UNPROVEN_MS = 90000;
/** Call the Winner: a call counts when it was made within this of the caller's own end (the out is seen first, then the kit's window) */
export const CALL_WINDOW_MS = CALL_MS + 6000;
/** the fewest · the most players of a match (the console's room holds 8) */
export const MATCH_MIN = 2, MATCH_MAX = 8;

/** PURE: the phones, the host's director and the server derive the same start from the same proof nodes. null = no GO yet. */
export const matchStart = (code, matchId, runs) => { const g0 = firstGo(runs); return g0 ? { g0, playAt: g0 + GO_LEAD_MS, seed: seedOf(String(code), String(matchId), g0) } : null; };

/**
 * THE NODES ARE THE TRUTH (JAYWALK H4B): the seed + tick 0 a phone PLAYS (and the host scores) = THE FIRST GO among the proof nodes it
 * has from the SERVER — exactly what the server's own count derives (api/_lib/freefall.js#freefallMatch) — whatever the game says; the
 * game's own (the director's GO patch, or an UNPROVEN match's stand-in) only when there is no node to read. `runs` must hold CONFIRMED
 * values only: a phone writes its GO as a transaction that is never applied locally (view.js). null = not known yet (the count holds).
 */
export function startOf(game, runs, code) {
  const m = game && game.mode !== 'solo' && runs ? matchStart(code, game.matchId, runs) : null;
  if (m && (!game.unproven || goBeforeGiveUp(game, m))) return m;
  return game && game.phase !== 'count' && game.seed ? { g0: game.g0 || 0, playAt: game.playAt, seed: game.seed } : null;
}
/** A HOST HICCUP AT GO (HIGH RISE's REVIEW FIX A): a FIRST GO the server stamped BEFORE the host gave up (the unproven step's own time)
 *  means the GO was there all along — the match is proven on the GO's seed + tick 0 (the director takes the unproven mark back) */
export const goBeforeGiveUp = (game, S) => !!(S && game && game.phaseStartAt && S.g0 <= game.phaseStartAt);
/** a match's clock: a server time → its tick (tick 0 = game.playAt) · the moment the 3:00 cap falls (ms, a server time) */
export const tickAt = (game, now) => Math.floor((now - game.playAt) * TICK_HZ / 1000);
export const capAt = game => game.playAt + Math.ceil(MODES.match.capTicks * 1000 / TICK_HZ);
/** a result row's ball was STILL FALLING when the match ended — the finish (floor 200) or the 3:00 cap: never "out" */
export const stoodToEnd = r => !!r && (r.w === 'made' || r.w === 'cap');

/** when a player's proof last moved (ms, a server time): their newest chunk's arrival, else their GO, else the match's tick 0 */
export function lastSeen(game, node) {
  let at = game.playAt;
  if (node && node.go > at) at = node.go;
  const c = node && node.c;
  if (c) { let hi = -1; for (const k of Object.keys(c)) { const i = Number(k); if (i > hi) hi = i; } const v = hi >= 0 ? c[hi] : null; if (v && v.at > at) at = v.at; }
  return at;
}
/** has this player's run ended, as far as the room can tell? their own `e` — or a silence long enough that the darkness has ended the run
 *  AND (offline) a dropped signal has had its time to come back */
export const endedFor = (game, node, now, online) => !!(node && node.e) || now >= lastSeen(game, node) + IDLE_OUT_MS + (online ? 0 : DROP_WAIT_MS);

/**
 * THE CONSOLE FIX — THE LIVE RUNS of a match (core/proof.js#liveGoers on this game's clock: THE FIRST GO's tick 0, the 3:00 cap +
 * END_GRACE_MS, IDLE_OUT_MS, DROP_WAIT_MS): the on-time runs not ended yet, read from the proof nodes ALONE (never the host's game) —
 * THE SERVER holds a report while any is (api/report.js), the podium waits for them (view.js). → { uids, until }
 */
export function liveOf({ code, matchId, tree, now, online = null }) {
  const S = tree ? matchStart(code, matchId, tree) : null;
  if (!S) return { uids: [], until: 0 };
  return liveGoers(tree, { now, online, playAt: S.playAt, capAt: capAt({ playAt: S.playAt }), idleMs: IDLE_OUT_MS, dropMs: DROP_WAIT_MS, graceMs: END_GRACE_MS });
}

/**
 * CALL THE WINNER (the match kit's piece; the call = the caller's own proof node's `k: { w, at }` — the rules: only once their own end
 * is signalled, a player still in, once, the server's time). At the end: a call counts when the caller was OUT (never one who fell to
 * the end), named a player who was still in at that moment, and made it within CALL_WINDOW_MS of their own end; right = that player won
 * (alone or tied for first). → { uid: { w, ok, bonus } } — the bonus = core/playlist.js#callBonus(the players still in then): game-night points.
 */
export function scoreCalls(game, runs, results) {
  const out = {}, ids = Object.keys(game.participants || {}), first = gameStandings({ participants: game.participants, results }).filter(r => r.rank === 1).map(r => r.uid);
  // (core/proof.js: a player with NO RUN (no GO on time) is never "still in" (they ended before anyone: −1); a FULL DRAW pays nobody)
  const g0 = firstGo(runs), endOf = u => { const r = results[u] || {}; return !inMatch(runs, u, g0) ? -1 : stoodToEnd(r) || !(r.e >= 0) ? Infinity : r.e; };
  if (fullDraw(first, ids)) return out;
  for (const uid of ids) {
    const k = runs && runs[uid] && runs[uid].k, mine = endOf(uid);
    if (!k || typeof k.w !== 'string' || k.w === uid || !game.participants[k.w] || mine === Infinity || mine < 0) continue;
    const outAt = game.playAt + mine * 1000 / TICK_HZ;
    if (!(endOf(k.w) > mine) || !(Number(k.at) <= outAt + CALL_WINDOW_MS)) continue;
    const rem = ids.filter(u => u !== uid && endOf(u) > mine).length, ok = first.includes(k.w);
    out[uid] = { w: k.w, ok, bonus: ok ? callBonus(rem) : 0 };
  }
  return out;
}
/** Call the Winner's game-night points (the console adds them to the night's total — never a win): { uid: bonus } */
export function nightBonus(game) {
  const out = {};
  for (const [uid, c] of Object.entries((game && game.calls) || {})) if (c && c.bonus > 0) out[uid] = c.bonus;
  return out;
}
/** "2ND" */
export const ordinal = n => `${n}${['TH', 'ST', 'ND', 'RD'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'TH'}`;
