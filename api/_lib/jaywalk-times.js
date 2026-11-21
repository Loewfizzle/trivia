// J3 — THE TIME BOARDS, the database half (the pure half: js/core/jw-times.js; docs/jaywalk.md "J3"). Server-only, under dly/ (no phone
// reads or writes it — no rules change). Per `splits` cartridge (JAYWALK today — the game id names the path, never a hard-coded one):
//   dly/{game}/{day}/sp/{pid} = [best tick to 50, to 100, …]   each player's fastest SERVER split per 50 from ANY closed try of the day
//   dly/{game}/{day}/spb = 1                                    the day's board was built from its records once (a day older than J3)
// Raised by ONE transaction at every try close (api/daily.js#creditQuiet → daySplits — FINISH, the next START, THE ROOM WINS, `today`, THE
// DAY'S CLOSE); read as ONE node per call (`every` — never a read per row); YOUR TABLE's rows ride `today`'s own per-friend reads.
import { ref, val } from './fb.js';
import { raiseDay, dayFromTries, cleanMap } from '../../js/core/jw-times.js';
import { triesOf } from './jaywalk-tries.js';

const base = (game, day) => `dly/${game}/${day}`;

/** a closed try → the player's day bests raised (a refused / unproven try has no splits: nothing written). Never fails the caller. */
export async function daySplits({ pid, cart, day, closed }) {
  if (!pid || !closed || closed.bad || !closed.sp || !cart || !cart.id) return null;
  let next = null;
  await ref(`${base(cart.id, day)}/sp/${pid}`).transaction(cur => { next = raiseDay(cur, closed.sp); return next || undefined; });
  return next;
}

/** the day's whole board { pid: [ticks] } — built ONCE from the day's records when the day had closed tries before the board existed (each
 *  player's row raised by its OWN transaction — a try closing during the build is never overwritten by a stale merge) */
export async function dayBoard(game, day) {
  const [node, built] = await Promise.all([val(`${base(game, day)}/sp`), val(`${base(game, day)}/spb`)]);
  if (Number(built) >= 1) return cleanMap(node);
  const recs = (await val(`${base(game, day)}/p`)) || {}, map = cleanMap(node);
  await Promise.all(Object.entries(recs).map(async ([pid, rec]) => {
    const fromRec = dayFromTries(triesOf(rec));
    if (!fromRec.length) return;
    let kept = null;
    const tx = await ref(`${base(game, day)}/sp/${pid}`).transaction(cur => { const nx = raiseDay(cur, fromRec); kept = nx || cur; return nx || undefined; }).catch(() => null);
    const v = cleanMap({ [pid]: tx && tx.snapshot ? tx.snapshot.val() : kept })[pid];
    if (v) map[pid] = v;
  }));
  await ref(`${base(game, day)}/spb`).set(1).catch(e => console.warn('time board build', e && e.message));
  return map;
}

/** the days already built (per warm function) — `today` then reads only the table's own rows */
const BUILT = new Set();
/** YOUR TABLE's rows (`today` — you + ≤ 12 friends): their own small reads once the day is built; a day not yet built → built now, picked from it */
export async function tableSplits(game, day, pids) {
  const key = `${game}/${day}`;
  if (!BUILT.has(key) && Number(await val(`${base(game, day)}/spb`)) >= 1) BUILT.add(key);
  if (!BUILT.has(key)) { const map = await dayBoard(game, day); BUILT.add(key); return Object.fromEntries(pids.filter(p => map[p]).map(p => [p, map[p]])); }
  const got = await Promise.all(pids.map(p => val(`${base(game, day)}/sp/${p}`)));
  return cleanMap(Object.fromEntries(pids.map((p, i) => [p, got[i]])));
}
export const forgetBuilt = () => BUILT.clear();
