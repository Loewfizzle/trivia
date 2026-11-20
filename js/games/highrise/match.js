// HIGH RISE — THE MATCH's RULES (S4B — docs/highrise.md "THE MATCH"; JAYWALK's match — docs/jaywalk.md "THE MATCH", js/games/jaywalk/
// logic.js — is the pattern, number for number): ONE tower each on the SAME seed (THE FIRST GO, the server's time), 2 … 8 players; the
// results are REPLAYED from each player's own tap log (the proof node rooms/{CODE}/hr/{matchId}/{uid}) — never a number a phone claims.
// PURE (no DOM, no clock) — the phones, the host's director AND the server agree. Its own module: logic.js stays what THE LAB + THE TEST
// PAGE load (the rules' own graph — nothing of the console's playlists in it).
import { CALL_MS, callBonus } from '../../core/playlist.js';
import { TICK_HZ, MODES } from './tuning.js';
import { matchStart, gameStandings } from './logic.js';

export { CALL_MS };
export const COUNT_MS = 3000;             // (3 · 2 · 1 before GO)
/** no GO at all this long after the count's end (no signal anywhere, the rules not published) → the match plays UNPROVEN, never counted */
export const NO_GO_MS = 3000;
/** after the 6:00 cap: the last chunks land */
export const END_GRACE_MS = 4000;
/** THE DROPPED SIGNAL in a match (proof.js#CLOCK.drop — pinned equal by a test): an OFFLINE player's end is waited for this long (their
 *  taps may still be queued on the phone) before the match ends without it */
export const DROP_WAIT_MS = 75000;
/** a tower nobody touches is OUT within the fuse (FLOOR_TICKS_MAX — 4.9 s): a player whose proof has not moved for this long, with no end
 *  signalled, has a dead phone — the room stops waiting (an OFFLINE one gets DROP_WAIT_MS on top). S5 — 18 s, JAYWALK's own (the owner,
 *  Nov 20; S4B had 12 s): a signal the database has not yet seen drop gets 18 s for its queued taps — pinned equal by a test */
export const IDLE_OUT_MS = 18000;
/** an UNPROVEN match (no proof can be written — nobody's end can be signalled) simply ends after this (JAYWALK's) */
export const UNPROVEN_MS = 90000;
/** Call the Winner: a call counts when it was made within this of the caller's own end (the fall is seen first, then the kit's window) */
export const CALL_WINDOW_MS = CALL_MS + 6000;
/** the fewest · the most players of a match (the console's room holds 8) */
export const MATCH_MIN = 2, MATCH_MAX = 8;

/**
 * THE NODES ARE THE TRUTH (JAYWALK H4B): the seed + tick 0 a phone PLAYS (and the host scores) = THE FIRST GO among the proof nodes it
 * has from the SERVER — exactly what the server's own count derives (api/_lib/highrise.js#highriseMatch) — whatever the game says; the
 * game's own (the director's GO patch, or an UNPROVEN match's stand-in) only when there is no node to read. `runs` must hold CONFIRMED
 * values only: a phone writes its GO as a transaction that is never applied locally (view.js), so its own estimate of the server's time
 * can never pick a seed. null = not known yet (the count holds).
 */
export function startOf(game, runs, code) {
  const m = game && game.mode !== 'solo' && runs ? matchStart(code, game.matchId, runs) : null;
  if (m && (!game.unproven || goBeforeGiveUp(game, m))) return m;
  return game && game.phase !== 'count' && game.seed ? { g0: game.g0 || 0, playAt: game.playAt, seed: game.seed } : null;
}
/** REVIEW FIX A — SHOULD 1 (A HOST HICCUP AT GO): the host's line stalled round GO, its mirror showed no GO for NO_GO_MS and it marked
 *  the match UNPROVEN — AFTER everyone had started; every phone restarted on a stand-in seed and nothing counted. THE NODES ARE THE TRUTH
 *  here too: a FIRST GO the server stamped BEFORE the host gave up (the unproven step's own time) means the GO was there all along —
 *  the match is proven: its seed + tick 0 are the GO's (the director takes the unproven mark back: director.js#nextStep). A GO stamped
 *  after it (a phone that came back later) never moves a match already climbing on its stand-in. */
export const goBeforeGiveUp = (game, S) => !!(S && game && game.phaseStartAt && S.g0 <= game.phaseStartAt);
/** a match's clock: a server time → its tick (tick 0 = game.playAt) · the moment the 6:00 cap falls (ms, a server time) */
export const tickAt = (game, now) => Math.floor((now - game.playAt) * TICK_HZ / 1000);
export const capAt = game => game.playAt + Math.ceil(MODES.match.capTicks * 1000 / TICK_HZ);
/** a result row's tower was STILL STANDING when the match ended — the finish (floor 200) or the 6:00 cap: never "out" */
export const stoodToEnd = r => !!r && (r.w === 'made' || r.w === 'cap');

/** when a player's proof last moved (ms, a server time): their newest chunk's arrival, else their GO, else the match's tick 0 */
export function lastSeen(game, node) {
  let at = game.playAt;
  if (node && node.go > at) at = node.go;
  const c = node && node.c;
  if (c) { let hi = -1; for (const k of Object.keys(c)) { const i = Number(k); if (i > hi) hi = i; } const v = hi >= 0 ? c[hi] : null; if (v && v.at > at) at = v.at; }
  return at;
}
/** has this player's run ended, as far as the room can tell? their own `e` — or a silence long enough that the fuse has ended the tower
 *  AND (offline) a dropped signal has had its time to come back */
export const endedFor = (game, node, now, online) => !!(node && node.e) || now >= lastSeen(game, node) + IDLE_OUT_MS + (online ? 0 : DROP_WAIT_MS);

/**
 * CALL THE WINNER (the match kit's piece; the call = the caller's own proof node's `k: { w, at }` — the rules: only once their own end
 * is signalled, a player still in, once, the server's time). At the end: a call counts when the caller was OUT (never one who stood to
 * the end), named a player who was still in at that moment, and made it within CALL_WINDOW_MS of their own end; right = that player won
 * (alone or tied for first). → { uid: { w, ok, bonus } } — the bonus = core/playlist.js#callBonus(the players still in then): game-night points.
 */
export function scoreCalls(game, runs, results) {
  const out = {}, ids = Object.keys(game.participants || {}), first = gameStandings({ participants: game.participants, results }).filter(r => r.rank === 1).map(r => r.uid);
  const endOf = u => { const r = results[u] || {}; return stoodToEnd(r) || !(r.e >= 0) ? Infinity : r.e; };
  for (const uid of ids) {
    const k = runs && runs[uid] && runs[uid].k, mine = endOf(uid);
    if (!k || typeof k.w !== 'string' || k.w === uid || !game.participants[k.w] || mine === Infinity) continue;
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
