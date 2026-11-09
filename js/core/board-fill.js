// BOARD 2.0 A — THE BACK-FILL (PURE): THE OVERALL BOARD's THIS WEEK rebuilt from what the server already stores — every counted match's record
// (results/{key} = { at, o: { pid: { xp: { gain } } } } — written once per match, never pruned) + every daily run of the week (dly/{game}/{day}:
// r = the scores, s = the starts, x = the non-counting results) re-paid through THE DAILY XP's own rule (core/daily.js — 15 a daily, capped at
// one credit per daily on the list, + THE SWEEP's 10 on a day every daily was finished AND counted). api/_lib/board-fill.js runs it from /admin
// (the owner — never a pass on the live site); a second run writes the same numbers (each player's counter = the larger of the live one and the
// rebuilt one — a payment landing during the run is never lost).
import { weekKey } from './week.js';
import { DAILY_XP, SWEEP_XP } from './daily.js';

/**
 * results: { key: { at, o } } · daily: { [game]: { [day]: { r, s, x } } } · live: the dailies on the list (core/daily.js#todaysDailies) ·
 * wk: the week to rebuild (core/week.js#weekKey) → { [pid]: XP earned that week }
 */
export function rebuildWeekXp({ results = {}, daily = {}, live = [], wk }) {
  const out = {};
  const add = (pid, v) => { if (v > 0) out[pid] = (out[pid] || 0) + v; };
  for (const r of Object.values(results || {})) {
    if (!r || !r.o || !(Number(r.at) > 0) || weekKey(Number(r.at)) !== wk) continue;
    for (const [pid, o] of Object.entries(r.o)) if (o && !o.skip && o.xp) add(pid, Number(o.xp.gain) || 0);
  }
  // the dailies: per player + day, the runs finished (the XP credit each, capped) and the counted ones (THE SWEEP)
  const cap = Math.max(1, live.length || 1), per = {};
  for (const [game, days] of Object.entries(daily || {})) for (const [day, D] of Object.entries(days || {})) {
    for (const [pid, score] of Object.entries((D && D.r) || {})) {
      if (score == null) continue;
      const at = Number(D.s && D.s[pid]) || 0;
      const k = `${pid}|${day}`, e = per[k] ||= { pid, runs: [], counted: new Set() };
      e.runs.push(at);
      if (!(D.x && D.x[pid])) e.counted.add(game);
    }
  }
  for (const e of Object.values(per)) {
    e.runs.sort((a, b) => a - b);
    e.runs.forEach((at, i) => { if (i < cap && at > 0 && weekKey(at) === wk) add(e.pid, DAILY_XP); });
    const last = e.runs[e.runs.length - 1];
    if (live.length && live.every(g => e.counted.has(g)) && last > 0 && weekKey(last) === wk) add(e.pid, SWEEP_XP);
  }
  return out;
}

/** a player's week counter after the back-fill: the larger of the live counter (same week) and the rebuilt sum — never lower */
export function filledWeek(cur, rebuilt, wk) {
  const live = cur && cur.wk === wk ? Number(cur.x) || 0 : 0;
  return { wk, x: Math.max(live, Math.round(rebuilt || 0)), bf: 1 };
}
