// HIGH RISE — THE NEXT FRIEND (S4A — docs/highrise.md "THE LINES"; JAYWALK's lines.js is the pattern). PURE (no DOM, no clock, no server):
// what the friend's line IS — the stage draws it (stage.js: the right-edge tag · night.js#setFriend: the pink tape) and plays its moment.
//   · THE NEXT FRIEND = the LOWEST friend best that is still ABOVE you (YOUR TABLE's HIGH RISE bests — the SERVER's: the board
//     highrise-solo through /api/profile { action: 'table' } — never a local guess; EMPTY while counting is OFF). ONE friend at a time.
//   · above you = a right-edge tag in PINK: "LIAM 57 ▲12" (standing on their floor: "LIAM 57 · ONE MORE") — the gold tag's twin;
//     the landing that CROSSES it (floor v + 1) lays a thin PINK tape round the slab of their floor (the gold tape's style) and the
//     next friend above takes the tag. SOLO only (a match has the real players' towers — S4B).
//   · YOUR BEST stays GOLD, never anything else.
import { floorOf } from './logic.js';

export const BOARD = 'highrise-solo';
/** the best the SERVER last told this phone (a floor) — only ever written from the server's own answer (counting ON) */
export const SRV_BEST_KEY = 'hi:best';
/** the table's answer is kept this long on the phone: PLAY AGAIN restarts in a second — a friend's best has not moved since */
export const TABLE_KEEP_MS = 90_000;

const nameOf = n => String(n == null ? '' : n).replace(/[\u0000-\u001f]/g, '').trim().toUpperCase().slice(0, 12) || 'A FRIEND';
/**
 * the table's rows ([{ n, v, me? }] — api/_lib/friends.js#boardTable: you + your friends who have a best; `v` = the board's value, a
 * tower's ONE sort number — logic.js#towerScore) → { best: your own server-counted best floor (0 = none yet), friends: [{ n, v: floor }] —
 * the nearest first (the lowest floor first) }
 */
export function parseTable(rows) {
  let best = 0;
  const friends = [];
  for (const r of Array.isArray(rows) ? rows : []) {
    const v = floorOf(r && r.v);
    if (!v) continue;
    if (r.me) best = Math.max(best, v); else friends.push({ n: nameOf(r.n), v });
  }
  friends.sort((a, b) => a.v - b.v || (a.n < b.n ? -1 : 1));
  return { best, friends };
}
/** THE NEXT FRIEND: the lowest friend best still at or above the floor you stand on (null = none above — no tag) */
export function nextFriend(friends, floor) {
  if (!friends) return null;
  for (let i = 0; i < friends.length; i++) if (friends[i].v >= floor && friends[i].v > 0) return friends[i];
  return null;
}
/** the friend the landing on `floor` just crossed (their best is one floor under it now) — the first of them (null = none) */
export function crossedFriend(friends, floor) {
  if (!friends) return null;
  for (let i = 0; i < friends.length; i++) if (friends[i].v > 0 && friends[i].v === floor - 1) return friends[i];
  return null;
}
/** the tag's words: "LIAM 57 ▲12" — on their floor: "LIAM 57 · ONE MORE" */
export const friendTag = (f, floor) => (f.v > floor ? `${f.n} ${f.v} ▲${f.v - floor}` : `${f.n} ${f.v} · ONE MORE`);
