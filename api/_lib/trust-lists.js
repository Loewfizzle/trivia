// THE FIX PASS (Nov 22 — THE FABLE REVIEW's M1): api/report.js's PURE TRUST LISTS, in one module the UNIT tests can import (THE UNIT JOB
// INSTALLS NOTHING — report.js reaches fb.js). Who a report trusts, and how: a PROOF game (the server replays the players' own nodes —
// core/proof.js#VERIFIED_SOLO, PROOF_NODES) · a HOST-GRADED game (DROP_GUARD — checked against the players' own boards) · a DEALER game
// (core/match-report.js#DEALER_GAMES — the server dealt it). tests/proof-lists.test.mjs: every playable reported game is in ONE of the three.
/** a proof game → its node under rooms/{CODE} (report.js#PROOF_GAMES builds on it; registry.js#PROOF_NODE_LIST lists the same nodes) */
export const PROOF_NODES = Object.freeze({ jaywalk: 'jw', highrise: 'hr' });
/** THE CONSOLE FIX — Group 2: the host-graded games whose result must name every player their own boards prove (THE DROPPED LEADER) */
export const DROP_GUARD = Object.freeze(['prism', 'overclock']);
/**
 * FR7 FIXES A — the owner's decision 6: a player who LEFT counts only with proof they sat in THAT room for THAT match — never just an
 * account that exists. The proof = a node of that match only THAT uid could write in that room (the rules: their own uid, phase-gated, during
 * the match — PRISM's board, OVERCLOCK's first challenge's board / its combo marks). A game with no such node here (the dealer's HOLD'EM
 * reports itself) → a leaver is not counted. PURE: → the room-relative paths to look for.
 */
export const PROOF_PATHS = Object.freeze({
  prism: (m, u) => [`prism/${m}/${u}`],
  overclock: (m, u) => [`oc/${m}/0/${u}`, `ocm/${m}/0/${u}`],
});
export const proofPaths = (gid, matchId, uid) => (PROOF_PATHS[gid] ? PROOF_PATHS[gid](matchId, uid) : []);
/**
 * FR7 FIXES B — A SEAT IS NOT A PLAY (the owner's add-on, Grok's second opinion): EVERY credited uid — seated or not — needs its OWN node of
 * THIS match in THIS room. ANY own node counts: PRISM DROP's board (prism/{m}/{u}); OVERCLOCK's board of ANY challenge (oc/{m}/{ci}/{u}), its
 * combo marks (ocm/{m}/{ci}/{u}) or its sealed picks (seal/{CODE}/oc/{m}/{key}/{u}) — a player who sat out challenge 0 but played the rest
 * still counts. The rooms where they live (PURE) → { room: [room-relative trees], seal: [seal-relative trees] }; a game with none here (the
 * dealer's HOLD'EM reports itself; the frozen games) → null = the seat rule as before.
 */
export const PROOF_TREES = Object.freeze({
  prism: m => ({ room: [`prism/${m}`], seal: [] }),
  overclock: m => ({ room: [`oc/${m}`, `ocm/${m}`], seal: [`oc/${m}`] }),
  jaywalk: m => ({ room: [`jw/${m}`], seal: [] }),   // (JAYWALK H1: written AT GO. THE PROOF PASS: a node counts only WITH its GO (provenUids), and in a MATCH only with a hop the server replayed — `played`)
  highrise: m => ({ room: [`hr/${m}`], seal: [] }),   // (HIGH RISE S4A: the same — its own node)
});
/** the games whose proof tree is FLAT — { uid: node } (PRISM's boards, JAYWALK's runs); the others' = { ci | key: { uid: … } } (OVERCLOCK) */
export const FLAT_PROOF = new Set(['prism', 'jaywalk', 'highrise']);
/** … of which the proof-node games: a node = { go, c, e } — it counts only with its GO (core/proof.js#goUids) */
export const GO_TREES = new Set(['jaywalk', 'highrise']);
