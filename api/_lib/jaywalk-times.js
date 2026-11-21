// J3 — THE TIME BOARDS, the database half (the pure half: js/core/jw-times.js; docs/jaywalk.md "J3"). Server-only, under dly/ (no phone
// reads or writes it — no rules change):
//   dly/jaywalk/{day}/sp/{pid} = [best tick to 50, to 100, …]   each player's fastest SERVER split per 50 from ANY closed try of the day
//   dly/jaywalk/{day}/spb = 1                                    the day's board was built from its records once (a day older than J3)
// Raised by ONE transaction at every try close (api/daily.js#creditQuiet → daySplits — FINISH, the next START, THE ROOM WINS, `today`, THE
// DAY'S CLOSE); read as ONE node per call (`every` — never a read per row); YOUR TABLE's rows ride `today`'s own per-friend reads.
import { ref, val } from './fb.js';
import { raiseDay, dayFromTries, cleanMap } from '../../js/core/jw-times.js';
import { triesOf } from './jaywalk-tries.js';

const base = day => `dly/jaywalk/${day}`;

/** a closed try → the player's day bests raised (a refused / unproven try has no splits: nothing written). Never fails the caller. */
export async function daySplits({ pid, day, closed }) {
  if (!pid || !closed || closed.bad || !closed.sp) return null;
  let next = null;
  await ref(`${base(day)}/sp/${pid}`).transaction(cur => { next = raiseDay(cur, closed.sp); return next || undefined; });
  return next;
}

/** the day's whole board { pid: [ticks] } — built ONCE from the day's records when the day had closed tries before the board existed */
export async function dayBoard(day) {
  const [node, built] = await Promise.all([val(`${base(day)}/sp`), val(`${base(day)}/spb`)]);
  if (Number(built) >= 1) return cleanMap(node);
  const recs = (await val(`${base(day)}/p`)) || {}, map = cleanMap(node), up = {};
  for (const [pid, rec] of Object.entries(recs)) {
    const fromRec = dayFromTries(triesOf(rec));
    if (!fromRec.length) continue;
    const kept = map[pid] || [];
    const merged = fromRec.map((t, i) => (i < kept.length ? Math.min(t, kept[i]) : t)).concat(kept.slice(fromRec.length));
    if (JSON.stringify(merged) !== JSON.stringify(kept)) { map[pid] = merged; up[`${base(day)}/sp/${pid}`] = merged; }
  }
  up[`${base(day)}/spb`] = 1;
  await ref('/').update(up).catch(e => console.warn('time board build', e && e.message));
  return map;
}

/** the days already built (per warm function) — `today` then reads only the table's own rows */
const BUILT = new Set();
/** YOUR TABLE's rows (`today` — you + ≤ 12 friends): their own small reads once the day is built; a day not yet built → built now, picked from it */
export async function tableSplits(day, pids) {
  if (!BUILT.has(day) && Number(await val(`${base(day)}/spb`)) >= 1) BUILT.add(day);
  if (!BUILT.has(day)) { const map = await dayBoard(day); BUILT.add(day); return Object.fromEntries(pids.filter(p => map[p]).map(p => [p, map[p]])); }
  const got = await Promise.all(pids.map(p => val(`${base(day)}/sp/${p}`)));
  return cleanMap(Object.fromEntries(pids.map((p, i) => [p, got[i]])));
}
export const forgetBuilt = () => BUILT.clear();
