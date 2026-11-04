// LOBBY 2.0 A — THE ROOM IN THE CITY (PURE — the owner, Nov 3 9:07–9:15 pm; the approved mock lobby-room.png): a room's players stand in
// TWO LINES OF 4 at the speakeasy's side door — 4 LEFT of it in front of the barbershop (from the barber pole back toward the screen's
// left edge, facing the door) + 4 RIGHT of it (facing the door), clear of the compass + the chestnut cart; THE HOST first, by the door;
// the doorman stays. The lines are SOLIDS: the city's own people walk round them (core/harbor-people.js#folkMap `line`).
// WHO STANDS WHERE is derived from the room's data alone (rooms/{CODE}: players + meta.hostId) — every phone draws the same lines; a
// refresh, a rejoin, a host change or a phone waking up puts everyone straight back in place. THE FILL ORDER (decided here): the host at
// L0 (the left line's front, by the door), then the guests by the time they joined, alternating sides — R0, L1, R1, L2, R2, L3, R3 —
// so both lines grow evenly from the door; a player arrives from the screen EDGE on their line's side. A player leaving: the ones
// behind them step up (a short walk forward), never a gap.
// FEASIBILITY (the real numbers — docs/harbor/passes/lobby-2a.md): left of the pole 4.46–4.57 units to a 16-pt margin at 390–430 →
// 4 figures at GAP_L 1.25 (≈ 17 pt apart, room for a ~14-pt emblem each); right of the door → the compass's edge: a straight line touches
// it (−0.08), so the right line steps a little TOWARD the camera as it goes (STEP_RZ) — 0.6+ units clear of the compass + the cart.
import { FOLK } from './harbor-people.js';

export const ROOM = Object.freeze({
  max: 8, perLine: 4,
  gapL: 1.25, gapR: 1.15,           // (units between two players in a line: ~17 pt on a 390 phone)
  zL: -0.35, stepLZ: -0.1,          // (the left line: just in front of the shopfront, a touch nearer each step back)
  doorPad: 0.55, zR: -0.5, stepRZ: -0.8,   // (the right line: from the doorman's spot, stepping toward the camera — clear of the compass)
  pad: 0.55,                        // (a line's solid rect round its feet)
});

const FILL = ['L0', 'R0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3'];
/** the 8 places → { id, side, i (0 = by the door), x, z, hd (facing the door: radians on the ground) } */
export function roomSlots(L) {
  const s = L.speakeasy, poleX = s.x0 + s.shop.pole.u, doorR = s.x0 + s.door.u1, out = {};
  for (let i = 0; i < ROOM.perLine; i++) out[`L${i}`] = { id: `L${i}`, side: 'left', i, x: poleX - 0.45 - i * ROOM.gapL, z: FOLK.doorZ + ROOM.zL + i * ROOM.stepLZ, hd: 0 };
  for (let i = 0; i < ROOM.perLine; i++) out[`R${i}`] = { id: `R${i}`, side: 'right', i, x: doorR + ROOM.doorPad + 0.95 + i * ROOM.gapR, z: FOLK.doorZ + ROOM.zR + i * ROOM.stepRZ, hd: Math.PI };
  return out;
}
/** the two lines' solid rects (the city's people route round them) — always the full 4 places of each side while a room is on */
export function roomRects(L) {
  const S = Object.values(roomSlots(L)), P = ROOM.pad;
  return ['left', 'right'].map(side => {
    const q = S.filter(x => x.side === side);
    return { x0: Math.min(...q.map(p => p.x)) - P, x1: Math.max(...q.map(p => p.x)) + P, z0: Math.min(...q.map(p => p.z)) - P, z1: Math.max(...q.map(p => p.z)) + P };
  });
}
/**
 * WHO STANDS WHERE: players = rooms/{CODE}/players ({ uid: { joinedAt, … } }), hostId → [{ uid, slot ('L0'…), side, rank }] — the host
 * first, then by joinedAt (uid to break a tie), at most 8 (a 9th waits off the lines — never happens: MAX_PLAYERS is 8)
 */
export function roomOrder(players = {}, hostId = null) {
  const ids = Object.keys(players || {}).sort((a, b) => (a === hostId ? -1 : b === hostId ? 1 : ((players[a].joinedAt || 0) - (players[b].joinedAt || 0)) || (a < b ? -1 : 1)));
  return ids.slice(0, ROOM.max).map((uid, rank) => ({ uid, rank, slot: FILL[rank], side: FILL[rank][0] === 'L' ? 'left' : 'right' }));
}
/** a stable small number from a uid (the look's seed, the arrival's own randomness — the same on every phone) */
export function uidSeed(uid) { let h = 2166136261; for (const ch of String(uid)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 100000; }
