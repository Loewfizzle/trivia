// THE DAY'S CLOSE (DFIX2 — FABLE REVIEW #2, finding 2 → Ben's decision 2): PENTHOUSE is decided ONCE a day is OVER, against the day's FINAL
// counting finishers — never at finish time (the day's best early finisher could never win it; whoever was rank 1 the moment n reached 50 kept
// it). No cron: the first /api/daily `start` / `today` after 4 am Eastern closes every unclosed day it finds (yesterday back to LOOK_BACK days —
// a week with no traffic closes its days on the next call), each ONCE:
//   dly/{game}/{day}/c = { at, st: 'busy' | 'done', n?, w?: [pid…] }   ← the close marker (a transaction claims it; a 'busy' older than STALE_MS
//                                                                        is retaken — a closer that died mid-way); server-only (the rules' default deny)
//   the winners (core/daily.js#penthouseWinners — rank ≤ max(1, ⌊n / 100⌋) of n ≥ 50 counting finishers, ties at the cutoff all win) each get
//   progress.js#penthouseStep inside ONE pstats transaction (idempotent by m/ph_<game>_<day>: two racing closers → one grant), then bumpOwners.
//   The player sees it on their next visit — the card-earned moment the `me` call already plays for a reward found waiting.
// Cost: a memo per warm function (CLOSED) — the first call of a day on an instance reads LOOK_BACK markers per live daily; nothing after.
import { ref, val } from './fb.js';
import { bumpOwners } from './owners.js';
import { founderOpen } from './founder.js';
import { dailyOf, penthouseWinners } from '../../js/core/daily.js';
import { penthouseStep } from '../../js/core/progress.js';
import { streakDay, dayNum, dayOf } from '../../js/core/streak.js';

export const LOOK_BACK = 7;
export const STALE_MS = 10 * 60_000;
const CLOSED = new Set();
export const forgetClosed = () => CLOSED.clear();

/** every unclosed day among `games`' last LOOK_BACK days (yesterday first) closed → [{ game, day, n, winners }] for the days THIS call closed */
export async function closeDays({ games, now = Date.now() }) {
  const today = streakDay(now), out = [];
  for (const game of games || []) {
    for (let back = 1; back <= LOOK_BACK; back++) {
      const day = dayOf(dayNum(today) - back), key = `${game}|${day}`;
      if (CLOSED.has(key)) continue;
      const r = await closeDay({ game, day, now }).catch(() => null);
      if (r === null) continue;                                   // (a read failed: try again on the next call)
      CLOSED.add(key);
      if (r.closed) out.push(r);
    }
  }
  return out;
}

/**
 * THE ONE DAY LINE (FR7 FIXES C — S2): a COUNTING finish that lands on a day ALREADY CLOSED (a run started before 4 am, finished after — the
 * close ran on the first call after the turn and left it out) RE-RANKS that day ONCE more: penthouseStep is idempotent (m/ph_<game>_<day>), so
 * this can only ADD a PENTHOUSE (the late 50th finisher opening the day, a late better score), never take one away — the marker's winners are
 * the UNION. A day not closed yet is left to its close. → { game, day, reranked, n, winners (all of them), added } | null (not closed)
 */
export async function recloseDay({ game, day, now = Date.now() }) {
  const base = `dly/${game}/${day}`;
  const cur = await val(`${base}/c`);
  if (!cur || cur.st !== 'done') return null;
  const [scores, gated] = await Promise.all([val(`${base}/r`), val(`${base}/x`)]);
  const counting = {};
  for (const [pid, v] of Object.entries(scores || {})) if (!(gated && gated[pid])) counting[pid] = v;
  const cart = dailyOf(game);
  const now1 = penthouseWinners(counting, (cart && cart.better) || 'high');
  const had = new Set(Array.isArray(cur.w) ? cur.w : []);
  const added = now1.filter(pid => !had.has(pid));
  if (added.length) {
    const fOpen = await founderOpen(now).catch(() => false);
    for (const pid of added) {
      let got = null;
      await ref(`pstats/${pid}`).transaction(s => { got = penthouseStep(s, { game, day, now, founderOpen: fOpen }); return got.skip ? undefined : got.next; });
      if (got && !got.skip) await bumpOwners(got.items, false, got.ach).catch(() => {});
    }
  }
  const w = [...had, ...added], n = Object.keys(counting).length;
  await ref(`${base}/c`).update({ n, ...(w.length ? { w } : {}), ra: now });
  return { game, day, reranked: true, n, winners: w, added };
}

/** one day of one daily: claim its marker, rank its counting finishers, grant the winners → { game, day, closed, n, winners } */
export async function closeDay({ game, day, now = Date.now() }) {
  const base = `dly/${game}/${day}`;
  const cur = await val(`${base}/c`);
  if (cur && (cur.st === 'done' || (cur.st === 'busy' && now - Number(cur.at || 0) < STALE_MS))) return { game, day, closed: false };
  const tx = await ref(`${base}/c`).transaction(c => (c && (c.st === 'done' || (c.st === 'busy' && now - Number(c.at || 0) < STALE_MS)) ? undefined : { at: now, st: 'busy' }));
  if (!tx.committed) return { game, day, closed: false };
  const [scores, gated] = await Promise.all([val(`${base}/r`), val(`${base}/x`)]);
  const counting = {};
  for (const [pid, v] of Object.entries(scores || {})) if (!(gated && gated[pid])) counting[pid] = v;
  const cart = dailyOf(game);
  const winners = penthouseWinners(counting, (cart && cart.better) || 'high');
  const n = Object.keys(counting).length;
  if (winners.length) {
    const fOpen = await founderOpen(now).catch(() => false);
    for (const pid of winners) {
      let got = null;
      await ref(`pstats/${pid}`).transaction(s => { got = penthouseStep(s, { game, day, now, founderOpen: fOpen }); return got.skip ? undefined : got.next; });
      if (got && !got.skip) await bumpOwners(got.items, false, got.ach).catch(() => {});
    }
  }
  await ref(`${base}/c`).set({ at: now, st: 'done', n, ...(winners.length ? { w: winners } : {}) });
  return { game, day, closed: true, n, winners };
}
