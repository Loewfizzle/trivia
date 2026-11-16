// JAYWALK — YOUR BEST LINE + THE NEXT FRIEND'S LINE (H4 add-on — the owner, Nov 16; docs/jaywalk.md "THE LINES"). PURE (no DOM, no clock,
// no three.js): what the lines ARE — the view draws them (night.js#setLines) and plays their moments (view.js).
//   · YOUR BEST LINE (a solo run — and, in a match, the player's own solo best): a GOLD line across the whole lane at the player's best
//     lane, "YOUR BEST · 143" on the ground beside it. CROSSING it (landing on a lane past it) = from then on the run is a new record.
//     No best yet (a first-ever run) = no line.
//   · THE NEXT FRIEND'S LINE (solo runs only — a match already has the real players as ghosts): ONE white / cyan line at the LOWEST
//     friend best that is still ahead of the player, "LIAM · 212" beside it. Crossing it → the next friend above appears. Never two friend
//     lines at once; a friend at or behind the player never shows; no friend bests = no friend lines.
// Both come from the SERVER-counted solo bests (the board jaywalk-solo): /api/profile { action: 'table' } — YOUR TABLE's own read (you +
// the friends YOUR list names) — fetched ONCE at a run's start; nothing is asked during a run. Never a local guess.
export const BOARD = 'jaywalk-solo';
/** the table's answer is kept this long on the phone: PLAY AGAIN restarts in a second — a friend's best has not moved since */
export const TABLE_KEEP_MS = 90_000;
/** the two looks: GOLD = YOUR BEST, never anything else · white / cyan = a friend (never gold) */
export const LINE_HEX = Object.freeze({ best: 0xffc53a, friend: 0x9af4ff });

const lanesOf = v => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };
const nameOf = n => String(n == null ? '' : n).replace(/[\u0000-\u001f]/g, '').trim().toUpperCase().slice(0, 12) || 'A FRIEND';
/**
 * the table's rows ([{ n, v, me? }] — api/_lib/friends.js#boardTable: you + your friends who have a best) →
 * { best: your own server-counted best (0 = none yet), friends: [{ n, v }] — the nearest first (lowest lanes first) }
 */
export function parseTable(rows) {
  let best = 0;
  const friends = [];
  for (const r of Array.isArray(rows) ? rows : []) {
    const v = lanesOf(r && r.v);
    if (!v) continue;
    if (r.me) best = Math.max(best, v); else friends.push({ n: nameOf(r.n), v });
  }
  friends.sort((a, b) => a.v - b.v || (a.n < b.n ? -1 : 1));
  return { best, friends };
}
/** THE NEXT FRIEND: the lowest friend best the player has not passed yet — its line lies at the far edge of that lane, so a player
 *  standing ON the friend's lane (level with them) still has it right ahead; one lane more crosses it (null = none ahead — no line) */
export function nextFriend(friends, reached) {
  for (const f of friends || []) if (f.v >= reached && f.v > 0) return f;
  return null;
}
/** the friends whose line a landing on `lane` just crossed (their best is behind it now, it was not before): the nearest first */
export const crossedFriends = (friends, before, lane) => (friends || []).filter(f => f.v >= before && f.v < lane);
/** YOUR BEST LINE is crossed by the landing that makes the run a new record: the first lane past the best */
export const isRecord = (best, reached) => best > 0 && reached > best;
const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');
/** the words on the ground */
export const bestText = best => `YOUR BEST · ${num(best)}`;
export const friendText = f => `${f.n} · ${num(f.v)}`;
/**
 * what the scene draws right now → { best: { lane, text } | null, friend: { lane, text } | null }
 * `best` = your server-counted best (0 = none) · `friends` = parseTable's · `reached` = the farthest lane landed on this run ·
 * `solo` = a solo run (a match draws YOUR BEST alone)
 */
export function linesFor({ best = 0, friends = [], reached = 0, solo = true } = {}) {
  const f = solo ? nextFriend(friends, reached) : null;
  return { best: best > 0 ? { lane: best, text: bestText(best) } : null, friend: f ? { lane: f.v, text: friendText(f) } : null };
}
