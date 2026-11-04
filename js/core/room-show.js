// LOBBY 2.0 B — THE ROOM's SHOWS, on the server clock (PURE: the phone + the tests; docs/harbor/passes/lobby-2b.md). Every phone in a room
// sees the same moment at the same time — each derives it from the room's own stamps (rooms/{CODE}/meta), never from a local timer:
//   meta/go   = { at, m, g }        the host's tap on INITIATE / REMATCH (server time) — THE GAME START: the sign powers down, the game's
//                                    logo lights, the TWO LINES file in through the side door, the view pushes through it (START_MS)
//   meta/back = { at, m, g, rm }    the match's end (the host's back to the room) — everyone WALKS BACK OUT through the door to their
//                                    places, then THE WINNER's BANNER PLANE; rm = the REMATCH ring is up (false once the host picks another game)
// A refresh, a rejoin, a late joiner or a NEW HOST reads the same stamps → the same frame of the same show (or nothing, once it's over).
import { roomOrder } from './harbor-room.js';

/** the game start's length (the owner: "2–3 s MAX, on every phone at once from the host's tap") — the game's own clock starts after it */
export const START_MS = 2600;
/** when the view pushes through the door (the last part of the start) */
export const PUSH_AT_MS = 1950;
/** the file-in's stagger: the host first, then the lines alternating (L0 R0 L1 R1 …), one every IN_GAP s */
export const IN_GAP = 0.16;
/** the walk back out: one through the door every OUT_GAP s (the host first); the city's fade-in before the first */
export const OUT_GAP = 0.6, OUT_LEAD = 0.5;
/** how long a walk-out may take at most (the last of 8 through the door + their walk to the far end of a line) */
export const OUT_WALK_MS = 3800;
/** THE WINNER's BANNER PLANE: this long after everyone is back */
export const BANNER_GAP_MS = 2000;

/** THE GAME START now? → { on, age (ms since the tap), push (0..1 — the push through the door), m, g } | { on: false }. The stamp goes up
 *  BEFORE the match (host.js#startGame): on while the host prepares it (the room still 'lobby', no game yet) and once it's written (the
 *  room 'playing', that match) — never for another match */
export function startShow(meta, game, now) {
  const go = meta && meta.go;
  if (!go || typeof go.at !== 'number' || !meta) return { on: false };
  const ready = meta.status === 'playing' && game && go.m === game.matchId, prep = meta.status === 'lobby' && !(game && game.matchId);
  if (!ready && !prep) return { on: false };
  const age = now - go.at;
  if (age < -500 || age >= START_MS) return { on: false, done: age >= START_MS };
  const a = Math.max(0, age);
  return { on: true, age: a, push: Math.max(0, Math.min(1, (a - PUSH_AT_MS) / (START_MS - PUSH_AT_MS))), m: go.m, g: go.g };
}

/** the file-in: each player's start (seconds from the tap) in the order host first, then the lines alternating */
export function fileInOrder(players, hostId) {
  return roomOrder(players || {}, hostId).map((o, i) => ({ uid: o.uid, slot: o.slot, at: i * IN_GAP }));
}

/** how long the walk back out takes for n players (ms) — the same number on every phone (it sets the banner's moment) */
export const walkOutMs = n => Math.round((OUT_LEAD + Math.max(0, n - 1) * OUT_GAP) * 1000 + OUT_WALK_MS);

/** THE WALK BACK OUT now? → { on, age (ms since the match's end), order: [{ uid, slot, at (s from the end) }] } */
export function backShow(meta, players, now) {
  const b = meta && meta.back;
  if (!b || typeof b.at !== 'number' || !meta || meta.status !== 'lobby') return { on: false };
  const n = Object.keys(players || {}).length, age = now - b.at;
  if (age < -500 || age >= walkOutMs(n)) return { on: false, done: true };
  return { on: true, age: Math.max(0, age), order: roomOrder(players || {}, meta.hostId).map((o, i) => ({ uid: o.uid, slot: o.slot, at: OUT_LEAD + i * OUT_GAP })) };
}

/** when THE WINNER's BANNER PLANE flies (server ms) for the match that just ended — ~2 s after everyone is back */
export function bannerAt(meta, players) {
  const b = meta && meta.back;
  if (!b || typeof b.at !== 'number') return null;
  return b.at + walkOutMs(Object.keys(players || {}).length) + BANNER_GAP_MS;
}
