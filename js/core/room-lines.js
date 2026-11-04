// LOBBY 2.0 A — THE ROOM's TWO LINES, WHO STANDS WHERE (PURE + light: no city code — room.js imports it at the join; core/harbor-room.js
// re-exports it with the places). docs/harbor/passes/lobby-2a.md.
export const LINE_MAX = 8, PER_LINE = 4;
const ROOM = { max: LINE_MAX, perLine: PER_LINE };
/**
 * WHO STANDS WHERE: players = rooms/{CODE}/players ({ uid: { joinedAt, ln?, … } }), hostId → [{ uid, slot ('L0'…), side, rank }].
 * EACH PLAYER KEEPS THEIR LINE: `ln` ('L' | 'R') is picked once at the join (pickLine: the shorter line, the host's the left) and stored on
 * their own player node — so a guest leaving only makes the ones behind them STEP UP in their own line, never cross the door. The host is
 * first, by the door, at the front of their line; then everyone by joinedAt. A player without `ln` (an older room, or the rules not yet
 * re-published) takes the shorter line at their turn; a full line (4) sends the rest to the other. At most 8.
 */
export function roomOrder(players = {}, hostId = null) {
  const ids = Object.keys(players || {}).sort((a, b) => (a === hostId ? -1 : b === hostId ? 1 : ((players[a].joinedAt || 0) - (players[b].joinedAt || 0)) || (a < b ? -1 : 1))).slice(0, ROOM.max);
  const n = { L: 0, R: 0 }, out = [];
  ids.forEach((uid, rank) => {
    const want = players[uid] && (players[uid].ln === 'L' || players[uid].ln === 'R') ? players[uid].ln : null;
    let side = want || (rank === 0 ? 'L' : n.R < n.L ? 'R' : n.L < n.R ? 'L' : 'R');
    if (n[side] >= ROOM.perLine) side = side === 'L' ? 'R' : 'L';
    out.push({ uid, rank, slot: `${side}${n[side]}`, side: side === 'L' ? 'left' : 'right' });
    n[side]++;
  });
  return out;
}
/** the line a JOINER takes (stored on their own node, once): the shorter of the two as they stand now — a tie → the right (the host's
 *  line is the left: the first player in an empty room takes L) */
export function pickLine(players = {}, uid = null) {
  const others = Object.fromEntries(Object.entries(players || {}).filter(([u]) => u !== uid));
  if (!Object.keys(others).length) return 'L';
  const n = { L: 0, R: 0 };
  for (const o of roomOrder(others, null)) n[o.slot[0]]++;
  return n.R < n.L ? 'R' : n.L < n.R ? 'L' : 'R';
}
/** a stable small number from a uid (the look's seed, the arrival's own randomness — the same on every phone) */
export function uidSeed(uid) { let h = 2166136261; for (const ch of String(uid)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 100000; }
