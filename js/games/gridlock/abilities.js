// GRIDLOCK — ARCADE abilities (PURE): the card table, geometry, validation and the private parts of resolution.
//
// A player's lock-in for a simultaneous volley is one node, glshot/{m}/{rk}/{uid}:
//   { ts: { targetUid: true }, x: enc({ shots: [[t, r, c], …], act }), a?: ability, at }
// ts is public (TARGET LOCK shows who, never where); x is obfuscated until the director decodes it at resolve.
// The ability payload `act`:
//   sonar    { t, r, c }            a 3×3 area (top-left anchor) on an opponent's board → the shooter privately learns the count
//   cluster  { t, r, c }            a 2×2 area (top-left anchor): four shots at once
//   torpedo  { t, axis, idx, dir }  axis 0 = along a row (idx = row, dir +1 from the left edge / −1 from the right),
//                                   axis 1 = down a column; hits the first unhit ship cell in its path, else fizzles
//   shield   { r, c }               a 3×3 area of your OWN board: shots landing there this volley are BLOCKED
//   relocate { i }                  one undamaged ship moved (the fleet node is rewritten by its owner before locking in)
//   double   —                      two normal shots this volley (the shots list holds both)
// Resolution order: shields + relocates first (shields are published in game.acts at resolve, relocates already moved),
// then every attack together.
import { rngFrom } from '../../core/rng.js';
import { cellsOf } from './logic.js';

export const ABILITIES = ['sonar', 'cluster', 'torpedo', 'shield', 'relocate', 'double'];
export const CARD_INFO = {
  sonar: { name: 'SONAR PING', short: 'SONAR', desc: 'Scan a 3×3 area. Learn how many ship cells it holds.', verb: 'SCANNED' },
  cluster: { name: 'CLUSTER SHOT', short: 'CLUSTER', desc: 'Hit a 2×2 area at once.', verb: 'CLUSTERED' },
  torpedo: { name: 'TORPEDO', short: 'TORPEDO', desc: 'Runs along a row or column. Hits the first ship in its path.', verb: 'TORPEDOED' },
  shield: { name: 'EMP SHIELD', short: 'SHIELD', desc: 'Protect a 3×3 area of your board this round.', verb: 'SHIELDED' },
  relocate: { name: 'RELOCATE', short: 'RELOCATE', desc: 'Move one undamaged ship somewhere new.', verb: 'RELOCATED' },
  double: { name: 'DOUBLE TAP', short: 'DOUBLE', desc: 'Fire two shots this round.', verb: 'DOUBLE-TAPPED' },
};
// relative draw weights (tuned by scripts/sim-gridlock.mjs; see CLAUDE.md "GRIDLOCK" for the numbers behind them)
export const CARD_WEIGHTS = { sonar: 1.2, cluster: 1.0, torpedo: 0.9, shield: 1.0, relocate: 0.75, double: 1.0 };
export const HAND_MAX = 3;
export const START_CARDS = 2;
export const AREA = { sonar: 3, cluster: 2, shield: 3 };

/** The n-th card dealt to a player in a match (seeded: every phone and a new host agree). */
export function drawCard(matchId, uid, n, weights = CARD_WEIGHTS) {
  const rnd = rngFrom(`${matchId}:card:${uid}:${n}`);
  const total = ABILITIES.reduce((s, a) => s + (weights[a] || 0), 0);
  let x = rnd() * total;
  for (const a of ABILITIES) { x -= weights[a] || 0; if (x <= 0) return a; }
  return ABILITIES[ABILITIES.length - 1];
}

/** Clamp an area anchor so the whole w×w block sits inside the board. */
export const clampAnchor = (r, c, w, size) => ({ r: Math.max(0, Math.min(size - w, r)), c: Math.max(0, Math.min(size - w, c)) });
export function areaCells(r, c, w, size) {
  const a = clampAnchor(r, c, w, size);
  const out = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < w; j++) out.push([a.r + i, a.c + j]);
  return out;
}
export const inArea = (area, w, r, c) => !!area && r >= area.r && r < area.r + w && c >= area.c && c < area.c + w;

/** The cells a torpedo passes, in order, from the edge it enters. */
export function torpedoPath(size, axis, idx, dir) {
  const out = [];
  for (let k = 0; k < size; k++) {
    const p = dir > 0 ? k : size - 1 - k;
    out.push(axis ? [p, idx] : [idx, p]);
  }
  return out;
}

const int = v => Number.isInteger(v);
const inBoard = (size, r, c) => int(r) && int(c) && r >= 0 && c >= 0 && r < size && c < size;

/**
 * Validate a decoded ability payload against the public game. Returns the clean act (what the director publishes in
 * game.acts at resolve) or null. `hand` = the player's cards; `okTarget(uid)` = alive opponent.
 */
export function cleanAct(game, uid, a, act, hand, okTarget) {
  if (!ABILITIES.includes(a) || !(hand || []).includes(a)) return null;
  const size = game.size;
  act = act || {};
  switch (a) {
    case 'sonar': case 'cluster': {
      if (!okTarget(act.t) || !inBoard(size, act.r, act.c)) return null;
      const p = clampAnchor(act.r, act.c, AREA[a], size);
      return { a, t: act.t, r: p.r, c: p.c };
    }
    case 'torpedo': {
      if (!okTarget(act.t) || !int(act.idx) || act.idx < 0 || act.idx >= size || ![0, 1].includes(act.axis) || ![1, -1].includes(act.dir)) return null;
      return { a, t: act.t, axis: act.axis, idx: act.idx, dir: act.dir };
    }
    case 'shield': {
      if (!inBoard(size, act.r, act.c)) return null;
      const p = clampAnchor(act.r, act.c, AREA.shield, size);
      return { a, r: p.r, c: p.c };
    }
    case 'relocate': return { a };            // the move itself is private (the owner rewrote their fleet); nothing to publish
    case 'double': return { a };
    default: return null;
  }
}

/** Shots a player may fire this volley given the mode and the ability armed. */
export function allowance(game, uid, a) {
  if (game.mode === 'salvo') { const b = (game.boards && game.boards[uid]) || {}; return Math.max(1, game.fleet.length - Object.keys(b.sunk || {}).length); }
  if (game.mode === 'arcade') return a === 'double' ? 2 : a ? 0 : 1;
  return 1;
}

/** Everything the private resolver needs to know about an attack list: expands a cluster into its four cells. */
export function expandAttacks(game, uid, shots, act) {
  const list = (shots || []).map(s => ({ t: s.t, r: s.r, c: s.c }));
  if (act && act.a === 'cluster') for (const [r, c] of areaCells(act.r, act.c, 2, game.size)) list.push({ t: act.t, r, c, k: 'cluster' });
  if (act && act.a === 'torpedo') list.push({ t: act.t, k: 'torpedo', axis: act.axis, idx: act.idx, dir: act.dir });
  return list;
}

/** Ship cells (count) inside a sonar area — the private answer the target (or host) computes. */
export function sonarCount(ships, r, c, size) {
  const cells = new Set(areaCells(r, c, 3, size).map(([a, b]) => `${a},${b}`));
  let n = 0;
  for (const s of ships) if (s) for (const [a, b] of cellsOf(s)) if (cells.has(`${a},${b}`)) n++;
  return n;
}

/** A valid relocation of slot i: undamaged ship, new spot inside, no overlap, no cell already shot. */
export function canRelocate(ships, i, cand, size, board, canPlace) {
  const s = ships[i];
  if (!s || cand.len !== s.len) return false;
  const hit = new Set(Object.entries((board && board.cells) || {}).filter(([, v]) => v && v.h === 1).map(([k]) => k));
  if (cellsOf(s).some(([r, c]) => hit.has(`${r},${c}`))) return false;          // damaged ships stay
  if (!canPlace(ships, i, cand, size)) return false;
  const shot = new Set(Object.keys((board && board.cells) || {}));
  return !cellsOf(cand).some(([r, c]) => shot.has(`${r},${c}`));                  // never under an existing mark
}
