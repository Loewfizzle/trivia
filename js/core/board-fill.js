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

/**
 * WHO GETS LISTED (PD-3 Group 0): every profile's COUNTED PLAYS rebuilt from the records — a counted ROOM match (results/{key}: the outcome not
 * skipped, 2+ players — a solo run never counts; a record from before `n` was stored counts as a room match) + a counted DAILY finish (dly/…: a
 * score that isn't in `x`, the non-counting results — THE THROWAWAY GATE). → { [pid]: n }
 */
export function countedPlaysFromRecords({ results = {}, daily = {} }) {
  const out = {};
  const add = pid => { out[pid] = (out[pid] || 0) + 1; };
  for (const r of Object.values(results || {})) {
    if (!r || !r.o) continue;
    for (const [pid, o] of Object.entries(r.o)) {
      if (!o || o.skip) continue;
      const n = Number(r.n ?? o.n ?? 2);
      if (n >= 2) add(pid);
    }
  }
  for (const days of Object.values(daily || {})) for (const D of Object.values(days || {})) {
    for (const [pid, score] of Object.entries((D && D.r) || {})) if (score != null && !(D.x && D.x[pid])) add(pid);
  }
  return out;
}

/**
 * FR7 FIXES A — E1, THE RESET EPOCH: THE LAUNCH RESET (api/_lib/reset.js) stamps `progress/resetAt`; the back-fill rebuilds THE BOARDS only from
 * what came AFTER it — a match record with `at` ≥ the epoch, a daily run whose START is ≥ the epoch — so a back-fill pressed after the reset
 * never puts the old wins, daily points or this week's XP back — nor the COUNTED PLAYS (FR7 FIXES B — E4, the owner: the reset clears `cp`).
 * No epoch (never reset) = everything, as before. PURE: → { results, daily } (new objects; the inputs untouched)
 */
export function sinceReset({ results = {}, daily = {} }, epoch) {
  const e = Number(epoch) || 0;
  if (!e) return { results: results || {}, daily: daily || {} };
  const R = {};
  for (const [k, r] of Object.entries(results || {})) if (r && Number(r.at) >= e) R[k] = r;
  const D = {};
  for (const [game, days] of Object.entries(daily || {})) for (const [day, d] of Object.entries(days || {})) {
    const r = {};
    for (const [pid, score] of Object.entries((d && d.r) || {})) if (Number(d.s && d.s[pid]) >= e) r[pid] = score;
    if (Object.keys(r).length) ((D[game] ||= {})[day] = { ...d, r });
  }
  return { results: R, daily: D };
}

/** a player's week counter after the back-fill: the larger of the live counter (same week) and the rebuilt sum — never lower */
export function filledWeek(cur, rebuilt, wk) {
  const live = cur && cur.wk === wk ? Number(cur.x) || 0 : 0;
  return { wk, x: Math.max(live, Math.round(rebuilt || 0)), bf: 1 };
}

/**
 * HOLD'EM IN THE CITY — THE HOLD'EM BOARD rebuilt from the dealer's records (results/{key} with g 'holdem', src 'dealer': the outcome per
 * profile + — since this pass — `ko` { pid: knockouts }; a CASH session (mode 'cash') never counts, a skipped outcome never counts). Records
 * from before this pass have no `ko`: their tournament WINS rebuild exactly, their knockouts read 0 (the dealer's own record is deleted 8 s
 * after a match). → { [pid]: { all: { tw, ko, ra }, week: { tw, ko, ra } | null } } — `ra` = the last record that moved the standing.
 */
export function holdemFromRecords({ results = {}, wk }) {
  const out = {};
  for (const r of Object.values(results || {})) {
    if (!r || r.g !== 'holdem' || r.src !== 'dealer' || r.mode === 'cash' || !r.o || !(Number(r.at) > 0)) continue;
    const at = Number(r.at), inWeek = weekKey(at) === wk;
    for (const [pid, o] of Object.entries(r.o)) {
      if (!o || o.skip) continue;
      const tw = o.win ? 1 : 0, ko = Math.max(0, Math.min(Math.max(0, (Number(r.n) || 0) - 1), Math.floor(Number(r.ko && r.ko[pid]) || 0)));
      if (!tw && !ko) continue;
      const e = out[pid] ||= { all: { tw: 0, ko: 0, ra: 0 }, week: null };
      e.all.tw += tw; e.all.ko += ko; e.all.ra = Math.max(e.all.ra, at);
      if (inWeek) { const w = e.week ||= { tw: 0, ko: 0, ra: 0 }; w.tw += tw; w.ko += ko; w.ra = Math.max(w.ra, at); }
    }
  }
  return out;
}
/** a player's HOLD'EM counters after the back-fill (g = all time, gw = this week while the stats' week is `wk`): the records' numbers —
 *  never lower than the live ones (a match landing during the run is never lost); the rest of the counters untouched */
export function filledHoldem(cur, fill, wk) {
  const merge = (live, rb) => {
    if (!rb) return live;
    const x = { ...(live || {}) };
    x.tw = Math.max(Number(x.tw) || 0, rb.tw); x.ko = Math.max(Number(x.ko) || 0, rb.ko); x.ra = Math.max(Number(x.ra) || 0, rb.ra);
    if (!x.tw) delete x.tw;
    if (!x.ko) delete x.ko;
    return x;
  };
  const g = { ...((cur && cur.g) || {}) }, gw = { ...((cur && cur.gw) || {}) };
  if (fill) g.holdem = merge(g.holdem, fill.all);
  const weekOk = cur && cur.wk === wk;
  if (fill && fill.week && weekOk) gw.holdem = merge(gw.holdem, fill.week);
  return { g, gw };
}
