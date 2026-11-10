// HOLD'EM (HE1) — THE TEST ROBOTS. Seeded players with a few simple styles, ONLY to stress the rules (the tests +
// scripts/holdem-sim.mjs). Never shipped, never an opponent: v1 has no bots (docs/games/plan.md "HOLD'EM").
// A robot sees exactly what a phone sees: seatView (the public table + its own two cards) + legalActions.
import { evaluate } from '../../js/games/holdem/rank.js';
import { RANKS } from '../../js/games/holdem/cards.js';

// 'jammer' = ALL-IN HAPPY: shoves any playable hand + calls any all-in (the stress sims' side-pot maker)
export const STYLES = ['tight', 'loose', 'maniac', 'station', 'shover', 'jammer'];

/** 0..1 — a rough strength of what the robot holds (no odds maths: just enough to make sane choices). */
export function strength(mine, board) {
  if (!board.length) {
    const [a, b] = mine.map(c => RANKS.indexOf(c[0])).sort((x, y) => y - x);
    const suited = mine[0][1] === mine[1][1];
    if (a === b) return 0.55 + a / 30;                               // 22 ≈ 0.55 … AA ≈ 0.95
    let s = (a + b) / 30 + (suited ? 0.06 : 0) + (a - b === 1 ? 0.04 : 0) - (a - b > 4 ? 0.06 : 0);
    if (a === 12) s += 0.08;
    return Math.max(0.02, Math.min(0.85, s));
  }
  const e = evaluate([...mine, ...board]);
  const onBoard = board.length >= 5 ? evaluate(board).cat : -1;
  const base = [0.12, 0.42, 0.62, 0.74, 0.82, 0.86, 0.92, 0.97, 0.99][e.cat];
  return e.cat <= onBoard ? Math.min(base, 0.3) : base + (e.ranks[0] || 0) / 200;
}

const PARAMS = {
  tight: { play: 0.5, raise: 0.72, bluff: 0.03, stick: 0.55, shove: 0.95 },
  loose: { play: 0.28, raise: 0.66, bluff: 0.08, stick: 0.38, shove: 0.97 },
  maniac: { play: 0.15, raise: 0.35, bluff: 0.35, stick: 0.3, shove: 0.8 },
  station: { play: 0.05, raise: 0.9, bluff: 0.0, stick: 0.05, shove: 1.1 },
  shover: { play: 0.45, raise: 0.5, bluff: 0.05, stick: 0.5, shove: 0.5 },
};

/**
 * A robot's choice → an action { id, type, to? } built ONLY from legalActions(view) (the tests assert it is
 * always accepted). rng = the robot's own seeded stream.
 */
export function decide(view, L, rng, style = 'tight') {
  const p = PARAMS[style] || PARAMS.tight;
  const s = strength(view.mine, view.board) + (rng() - 0.5) * 0.12;
  if (style === 'jammer') {
    if (s < 0.3) return { id: L.id, type: L.canCheck ? 'check' : 'fold' };
    if (L.canRaise) return { id: L.id, type: 'allin' };
    return { id: L.id, type: L.canCheck ? 'check' : 'call' };
  }
  const me = view.seats.find(x => x.id === L.id);
  const pressure = L.toCall / Math.max(1, me.stack + me.bet);      // the share of my chips this call costs
  const raise = () => {
    if (!L.canRaise) return null;
    if (s > p.shove || style === 'shover' && s > p.raise) return { id: L.id, type: 'allin' };
    const sized = L.presets.filter(q => !q.allin);
    if (!sized.length || (style === 'maniac' && rng() < 0.2)) return { id: L.id, type: 'allin' };
    return { id: L.id, type: L.kind, to: sized[Math.floor(rng() * sized.length)].to };
  };
  if (L.canCheck) {
    if (s > p.raise || rng() < p.bluff) return raise() || { id: L.id, type: 'check' };
    return { id: L.id, type: 'check' };
  }
  if (s > p.raise || rng() < p.bluff / 2) { const r = raise(); if (r) return r; }
  // the bigger the call against my stack, the better the hand it needs (an all-in call ≈ keep + 0.45)
  const keep = (view.street === 'preflop' ? p.play : p.stick) + pressure * 0.45;
  if (s >= keep || (style === 'station' && pressure < 0.25 && rng() < 0.9)) return { id: L.id, type: 'call' };
  return { id: L.id, type: 'fold' };
}

/** A few deliberately ILLEGAL tries (the tests check every one is refused + changes nothing). */
export function junkAction(view, L, rng) {
  const ids = view.seats.map(x => x.id);
  const other = ids.find(id => id !== L.id) || 'nobody';
  const tries = [
    { id: other, type: 'fold' },
    { id: L.id, type: L.canCheck ? 'call' : 'check' },
    { id: L.id, type: 'raise', to: L.maxTo + 1 + Math.floor(rng() * 50) },
    { id: L.id, type: L.kind, to: L.canRaise ? Math.max(0, L.minTo - 1 - Math.floor(rng() * 5)) : 1 },
    { id: L.id, type: 'teleport' },
    { id: L.id, type: L.kind === 'bet' ? 'raise' : 'bet', to: L.minTo },
    { id: L.id, type: 'show' },
  ];
  return tries[Math.floor(rng() * tries.length)];
}

