// LOBBY 2.0 B — THE ROOM's SHOWS, on the server clock (PURE: the phone + the tests; docs/harbor/passes/lobby-2b.md). Every phone in a room
// sees the same moment at the same time — each derives it from the room's own stamps (rooms/{CODE}/meta), never from a local timer:
//   meta/go   = { at, m, g }        the host's tap on INITIATE / REMATCH (server time) — THE GAME START (LOBBY FIXES — the owner, Nov 4
//                                    3:05–3:06 pm: NO camera push — choppy on the phone): the door's sign powers down, THE GAME's OWN NEON
//                                    SIGN ignites (pink, tube by tube) + holds, the TWO LINES walk in under it, a clean fade — ~5 s (the
//                                    FULL start: a room's first game of the night + after a game change); a same-game REMATCH ~3 s (the
//                                    QUICK start: the sign already lit, the walk-in only). The kind rides in the match id (startKind)
//   meta/back = { at, m, g, rm }    the match's end (the host's back to the room) — everyone WALKS BACK OUT through the door to their
//                                    places, then THE WINNER's BANNER PLANE; rm = the REMATCH ring is up (false once the host picks another game)
// A refresh, a rejoin, a late joiner or a NEW HOST reads the same stamps → the same frame of the same show (or nothing, once it's over).
import { roomOrder } from './harbor-room.js';

/** THE GAME START's two lengths + their beats (ms from the host's tap) — the game's own clock starts at `len`:
 *  sign: the game's sign ignites from here (the full start; the quick one shows it lit at once) · walkAt: the file-in's first step ·
 *  fadeAt: the clean fade to the game begins (over len − fadeAt) */
export const START = Object.freeze({
  full: Object.freeze({ len: 5000, sign: 560, walkAt: 1500, fadeAt: 4300 }),
  quick: Object.freeze({ len: 3000, sign: 0, walkAt: 250, fadeAt: 2350 }),
});
/** the LONGEST start (the safety limits read it) */
export const START_MS = START.full.len;
/** THE START's KIND from the match id: the host marks a same-game rematch's id with a leading 'q' (host.js#newMatchId) — the meta/go stamp's
 *  fields are fixed by the published rules, its `m` is not, and game.go's fallback carries the same id: every phone, every rules version */
export const startKind = m => (typeof m === 'string' && m[0] === 'q' ? 'quick' : 'full');
export const startOf = m => START[startKind(m)];
/** a new match id: 'q' + 5 for a same-game rematch (the quick start), otherwise never a leading 'q' */
export function newMatchId(quick = false, rnd = Math.random) {
  let id = ''; while (id.length < 6) { const c = Math.floor(rnd() * 36).toString(36); if (id.length || quick || c !== 'q') id += c; }
  return quick ? `q${id.slice(1)}` : id;
}
/** the file-in's stagger: the host first, then the lines alternating (L0 R0 L1 R1 …), one every IN_GAP s */
export const IN_GAP = 0.16;
/** the walk back out: one through the door every OUT_GAP s (the host first); the city's fade-in before the first */
export const OUT_GAP = 0.6, OUT_LEAD = 0.5;
/** how long a walk-out may take at most (the last of 8 through the door + their walk to the far end of a line) */
export const OUT_WALK_MS = 3800;
/** THE WINNER's BANNER PLANE: this long after everyone is back */
export const BANNER_GAP_MS = 2000;

// THE STAMPS NEVER DEPEND ON A RULES RE-PUBLISH (the owner's real-phone test, Nov 4 10:37 am: two iPhones on the new code saw NONE of the
// show — the live database still had the old rules, refused meta/go + meta/back, and the room went on silently without them). Each stamp has
// a home the OLD rules already allow too: the start's moment also rides IN the match's own write (game.go — the game node is the host's,
// unchecked); the match's end falls back to meta.activeAt (stamped by every back-to-the-room) + the night's entry for the match just played.
// Only THE REMATCH VOTE truly needs the new rules (each player's own node).
/** the start's stamp: meta/go (the host's first write — the walk starts at the tap) or, when that was refused, the match's own game.go */
export function goOf(meta, game) {
  const go = meta && meta.go;
  if (go && typeof go.at === 'number' && (!game || !game.matchId || go.m === game.matchId)) return go;
  if (game && typeof game.go === 'number' && game.matchId) return { at: game.go, m: game.matchId, g: game.id, inGame: true };
  return null;
}
/** the match's end: meta/back — or, when that was refused, meta.activeAt right after a FINISHED match (its night entry ≤ 15 min before) */
export const BACK_FALLBACK_MS = 15 * 60e3;
export function backOf(meta, night) {
  if (!meta) return null;
  if (meta.back && typeof meta.back.at === 'number') return meta.back;
  if (meta.status !== 'lobby' || typeof meta.activeAt !== 'number') return null;
  let last = null;
  for (const [m, e] of Object.entries(night || {})) if (e && typeof e.at === 'number' && (!last || e.at > last.e.at)) last = { m, e };
  if (!last || last.e.at > meta.activeAt + 5000 || meta.activeAt - last.e.at > BACK_FALLBACK_MS) return null;
  return { at: meta.activeAt, m: last.m, g: last.e.g, rm: false, derived: true };
}

/** FR6 FIXES A (B2 + B3) — A START THAT DIES: the veil holds while the start's stamp is up and the room still waits for its match (a slow
 *  bank / song: B3's 12-s start), at most GO_DEAD_MS; a host who finds a stamp it isn't starting (the host that stamped it died or
 *  refreshed — B2) clears it after GO_ORPHAN_MS. Either way every phone says THE START DIDN'T GO THROUGH and the room is back */
export const GO_DEAD_MS = 30000;
export const GO_ORPHAN_MS = 3000;
/** PURE: the start's stamp is up, the room still 'lobby' with no match for it → its age (ms) | null */
export function goWaiting(meta, game, now) {
  const go = meta && meta.go;
  if (!go || typeof go.at !== 'number' || meta.status !== 'lobby' || (game && game.matchId)) return null;
  return now - go.at;
}
/** THE GAME START now? → { on, age (ms since the tap), kind, len, sign, walkAt, fadeAt, fade (0..1 — the fade to the game), m, g } | { on: false }. The stamp goes up
 *  BEFORE the match (host.js#startGame): on while the host prepares it (the room still 'lobby', no game yet) and once it's written (the
 *  room 'playing', that match) — never for another match */
export function startShow(meta, game, now) {
  const go = goOf(meta, game);
  if (!go || !meta) return { on: false };
  const ready = meta.status === 'playing' && game && go.m === game.matchId, prep = meta.status === 'lobby' && !(game && game.matchId);
  if (!ready && !prep) return { on: false };
  const age = now - go.at, S = startOf(go.m);
  if (age < -500 || age >= S.len) return { on: false, done: age >= S.len };
  const a = Math.max(0, age);
  return { on: true, age: a, kind: startKind(go.m), ...S, fade: Math.max(0, Math.min(1, (a - S.fadeAt) / (S.len - S.fadeAt))), m: go.m, g: go.g };
}

/** the file-in: each player's start (seconds from the tap) in the order host first, then the lines alternating */
export function fileInOrder(players, hostId) {
  return roomOrder(players || {}, hostId).map((o, i) => ({ uid: o.uid, slot: o.slot, at: i * IN_GAP }));
}

/** how long the walk back out takes for n players (ms) — the same number on every phone (it sets the banner's moment) */
export const walkOutMs = n => Math.round((OUT_LEAD + Math.max(0, n - 1) * OUT_GAP) * 1000 + OUT_WALK_MS);

/** THE WALK BACK OUT now? → { on, age (ms since the match's end), order: [{ uid, slot, at (s from the end) }] } */
export function backShow(meta, players, now, night = null) {
  const b = backOf(meta, night);
  if (!b || typeof b.at !== 'number' || !meta || meta.status !== 'lobby') return { on: false };
  const n = Object.keys(players || {}).length, age = now - b.at;
  if (age < -500 || age >= walkOutMs(n)) return { on: false, done: true };
  return { on: true, age: Math.max(0, age), order: roomOrder(players || {}, meta.hostId).map((o, i) => ({ uid: o.uid, slot: o.slot, at: OUT_LEAD + i * OUT_GAP })) };
}

/** when THE WINNER's BANNER PLANE flies (server ms) for the match that just ended — ~2 s after everyone is back */
export function bannerAt(meta, players, night = null) {
  const b = backOf(meta, night);
  if (!b || typeof b.at !== 'number') return null;
  return b.at + walkOutMs(Object.keys(players || {}).length) + BANNER_GAP_MS;
}

// ------------------------------------------------------------------ THE WINNER's BANNER PLANE — its words (the owner, Nov 4 7:56 am)
// SHORT so it reads as it passes (each panel ≤ 24 letters — the banner's own limit, core/harbor-sky.js#bannerPanels — never a cut name: a
// template that would cut one falls back to a form that puts the name on its own panel). Ten forms for one winner, taken IN TURN by the
// night's game count (the room's own night/ — the same on every phone): ten games a night never repeat a line. TIES: "SPLIT THE POT" /
// "TIE GAME". Names are the room's own (they passed the name filter at the join).
export const PANEL_MAX = 24;
const W1 = [
  (N, G) => [[`${N} TAKES ${G}!`], [`${N} TAKES`, `${G}!`]],
  (N, G) => [[`CHEERS TO ${N}`, `${G} CHAMPION`], ['CHEERS TO', N, `${G} CHAMPION`]],
  (N, G) => [[`${N} WINS ${G}!`], [N, `WINS ${G}!`]],
  (N, G) => [[`${G} GOES TO`, `${N}!`]],
  (N, G) => [[`ALL HAIL ${N}`, `${G} ROYALTY`], ['ALL HAIL', N, `${G} ROYALTY`]],
  (N, G) => [[`DRINKS ON ${N}!`, `${G} WINNER`], ['DRINKS ON', `${N}!`, `${G} WINNER`]],
  (N, G) => [[`${N} OWNS ${G}`], [N, `OWNS ${G}`]],
  (N, G) => [[`${G} CHAMP:`, `${N}!`]],
  (N, G) => [[`HATS OFF TO ${N}`, `${G} WINNER`], ['HATS OFF TO', N, `${G} WINNER`]],
  (N, G) => [[`${N} RUNS ${G}`], [N, `RUNS ${G}`]],
];
const WT = [
  (A, B) => [[`${A} + ${B}`, 'SPLIT THE POT!'], [A, `+ ${B}`, 'SPLIT THE POT!']],
  (A, B) => [['TIE GAME —', `${A} + ${B}!`], ['TIE GAME —', A, `+ ${B}!`]],
  (A, B, G) => [[`DEAD HEAT AT ${G}`, `${A} + ${B}`], [`DEAD HEAT AT ${G}`, A, `+ ${B}`]],
  (A, B, G) => [[`${A} + ${B}`, `SHARE ${G}!`], [A, `+ ${B}`, `SHARE ${G}!`]],
];
const fits = p => p.length <= 3 && p.every(s => s.length <= PANEL_MAX);
const pick = (forms, fallback) => forms.find(fits) || fallback;
const up = s => String(s || '').toUpperCase().trim();
/** names (the winners, in order), the game's banner name, idx (which game of the night: 0, 1, …) → the banner's panels */
export function bannerLines(names, game, idx = 0) {
  const G = up(game), ns = (names || []).map(up).filter(Boolean);
  if (!ns.length) return [];
  if (ns.length === 1) return pick(W1[((idx % W1.length) + W1.length) % W1.length](ns[0], G), [ns[0], `WINS ${G}!`.slice(0, PANEL_MAX)]);
  const A = ns[0], B = ns.length === 2 ? ns[1] : `${ns.length - 1} MORE`;
  return pick(WT[((idx % WT.length) + WT.length) % WT.length](A, B, G), [A, `+ ${B}`, 'SPLIT THE POT!']);
}
/** a match's winners from its night entry (rooms/{CODE}/night/{matchId}: p = 3 / 2 / 1 / 0 by place — a tie at the top = everyone with 3) */
export function winnersOf(entry) {
  if (!entry || !entry.p) return [];
  const ids = Object.keys(entry.p).filter(u => entry.p[u] === 3);
  return ids.sort().map(u => ({ uid: u, name: (entry.n && entry.n[u]) || '' })).filter(w => w.name);
}
/** THE NIGHT's CHAMPION (decided Oct 28): leaving after 2+ games → "LAST CALL — BEN WINS THE NIGHT"; opening the site later (≤ 12 h) →
 *  "LAST NIGHT'S CHAMPION: BEN". names = the night's leaders (a tie: both) */
export function champLines(names, kind = 'last-call') {
  const ns = (names || []).map(up).filter(Boolean);
  if (!ns.length) return [];
  const N = ns.length === 1 ? ns[0] : ns.length === 2 ? `${ns[0]} + ${ns[1]}` : `${ns[0]} + ${ns.length - 1} MORE`;
  const win = ns.length > 1 ? 'WIN' : 'WINS';
  if (kind === 'last-call') return pick([['LAST CALL —', `${N} ${win} THE NIGHT`], ['LAST CALL —', N, ns.length > 1 ? 'WIN THE NIGHT' : 'WINS THE NIGHT']], ['LAST CALL —', ns[0], 'WINS THE NIGHT']);
  return pick([["LAST NIGHT'S CHAMPION:", N], ["LAST NIGHT'S", 'CHAMPION:', N]], ["LAST NIGHT'S", 'CHAMPION:', ns[0]]);
}

// ------------------------------------------------------------------ THE REMATCH VOTE (the owner's approved mock, Nov 4 8:05 am)
/** the ring's state after a match → { on (the REMATCH ring is up), m (the match it would replay), g, voters: [uid] (guests who voted, in the
 *  room's order), guests: [uid] (everyone but the host, in the room's order), total (everyone in the room) }. Up once the banner flies
 *  (everyone back), while meta/back says rm (the host hasn't picked another game) and the room is in the lobby; a vote counts only for THIS
 *  match (rv/{uid} = its matchId) and only from someone still in the room */
export function voteState(meta, rv, players, now) {
  const b = meta && meta.back, P = players || {};
  const order = roomOrder(P, meta && meta.hostId).map(o => o.uid), guests = order.filter(u => u !== (meta && meta.hostId));
  const off = { on: false, voters: [], guests, total: order.length };
  if (!b || !b.rm || meta.status !== 'lobby') return off;
  const at = bannerAt(meta, P);
  if (at != null && now < at) return { ...off, soon: true, m: b.m, g: b.g };
  const voters = guests.filter(u => rv && rv[u] === b.m);
  return { on: true, m: b.m, g: b.g, voters, guests, total: order.length };
}
