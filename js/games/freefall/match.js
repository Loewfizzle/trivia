// FREEFALL — THE MATCH's RULES (F4B — docs/freefall.md "THE … match.js#1
import { CALL_MS, callBonus } from '../../core/playlist.js';
import { TICK_HZ, MODES, RULES_DEFAULT, ruleSet } from './tuning.js';
import { seedOf, gameStandings } from './logic.js';
import { firstGo, inMatch, fullDraw, liveGoers, onTime, GO_WINDOW_MS } from '../../core/proof.js';

export { CALL_MS, firstGo };
export const COUNT_MS = 3000;             // (3 · 2 · 1 before GO)
/** THE MATCH's START (JAYWALK's exact start): every phone writes its own GO in the count's last 2 s; THE FIRST GO to land picks the seed
 *  AND sets tick 0 = that time + this, for everyone */
export const GO_LEAD_MS = 2000;
// no GO at all this long after the count's end (no signal … match.js#2
export const NO_GO_MS = 3000;
/** after the 3:00 cap: the last chunks land — longer than the judge's own lateness (proof.js CLOCK.behind, 8 s: THE FRESH-EYES REVIEW — at
 *  HIGH RISE's 4 s a capped run on a 5 s line was scored a floor short by the host's step while the server already had every chunk) */
export const END_GRACE_MS = 9000;
/** THE DROPPED SIGNAL in a match (proof.js#CLOCK.drop — pinned equal by a test): an OFFLINE player's end is waited for this long (their
 *  moves may still be queued on the phone) before the match ends without it */
export const DROP_WAIT_MS = 75000;
/** a ball nobody steers is OUT within 9 s (THE LIGHTS GO OUT): a player whose proof has not moved for this long, with no end signalled,
 *  has a dead phone — the room stops waiting (an OFFLINE one gets DROP_WAIT_MS on top). 18 s — JAYWALK's + HIGH RISE's own (pinned equal) */
export const IDLE_OUT_MS = 18000;
/** an UNPROVEN match (no proof can be written — nobody's end can be signalled) simply ends after this (JAYWALK's) */
export const UNPROVEN_MS = 90000;
// Call the Winner: a call counts when it was made within this … match.js#3
export const CALL_WINDOW_MS = CALL_MS + 6000;
/** the fewest · the most players of a match (the console's room holds 8) */
export const MATCH_MIN = 2, MATCH_MAX = 8;

// PURE: the phones, the host's director and the server derive … match.js#4
export const matchStart = (code, matchId, runs) => { const g0 = firstGo(runs); return g0 ? { g0, playAt: g0 + GO_LEAD_MS, seed: seedOf(String(code), String(matchId), g0), rs: matchRules(runs, g0) } : null; };
/** FIX C — N7: a MATCH's rule set = the one THE FIRST GO's player named (none = "classic"; a set nobody knows is never the match's; two GOs in
 *  one millisecond: the LOWEST uid's) — HIGH RISE's matchRules: the phones, the host and the server agree */
export function matchRules(runs, g0 = firstGo(runs)) {
  if (!(g0 > 0)) return RULES_DEFAULT;
  let first = null;
  for (const u of Object.keys(runs || {})) { const n = runs[u]; if (n && Number(n.go) === g0 && (first === null || u < first)) first = u; }
  const rs = first === null ? null : runs[first].rs;
  return rs != null && ruleSet(rs) ? rs : RULES_DEFAULT;
}

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
// a match's clock: a server time → its tick (tick 0 = … match.js#5
export const tickAt = (game, now) => Math.floor((now - game.playAt) * TICK_HZ / 1000);
export const capAt = game => game.playAt + Math.ceil(MODES.match.capTicks * 1000 / TICK_HZ);
/** a result row's ball was STILL FALLING when the match ended — the finish (floor 200) or the 3:00 cap: never "out" */
export const stoodToEnd = r => !!r && (r.w === 'made' || r.w === 'cap');

// when a player's proof last moved (ms, a server time): their … match.js#6
export function lastSeen(game, node) {
  let at = game.playAt;
  if (node && node.go > at) at = node.go;
  const c = node && node.c;
  if (c) { let hi = -1; for (const k of Object.keys(c)) { const i = Number(k); if (i > hi) hi = i; } const v = hi >= 0 ? c[hi] : null; if (v && v.at > at) at = v.at; }
  return at;
}
/** has this player's run ended, as far as the room can tell? their own `e` — or a silence long enough that the darkness has ended the run
 *  AND (offline) a dropped signal has had its time to come back */
export const endedFor = (game, node, now, online) => !!(node && node.e) || noRunFor(game, node, now) || now >= lastSeen(game, node) + IDLE_OUT_MS + (online ? 0 : DROP_WAIT_MS);
/** FIX B — S6 (b): a phone with NO ON-TIME GO (a tab closed in the 3 · 2 · 1, a GO that came late) can never have a run (core/proof.js#liveGoers
 *  says so): the room stops waiting for it NO_GO_END_MS after THE FIRST GO's window — never the 18 + 75 s of a silent run */
export const NO_GO_END_MS = 3000;
export const noRunFor = (game, node, now) => game.g0 > 0 && !onTime(node, game.g0) && now >= game.g0 + GO_WINDOW_MS + NO_GO_END_MS;

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
  // (core/proof.js: a player with NO RUN (no GO on time) is … match.js#7
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
