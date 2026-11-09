// THE DAILY MODULE — THE SCREENS' RULES (DM2 — docs/progression.md "THE DAILY MODULE — DM2"). PURE: what the dock button, TODAY, SCORES and
// SHARE TODAY show, from ONE `today` answer (api/daily.js — the live dailies in order, your scores, the ones in flight, YOUR TABLE, the everyone
// standing). No fixed count anywhere: everything walks `today.dailies` (1–6 rows).
//   dockState(today)         → { show, state: 'waiting' | 'done', left }       the title dock's DAILY button (no dailies → hidden)
//   rowState(today, id)      → 'waiting' | 'progress' | 'done'                 a TODAY row
//   sweepState(today)        → { segs: [{ id, done }], done, of, swept }       the sweep meter
//   tableFor(today, id, …)   → { rows: [{ pid, name, score, me, waiting, place }], place, of, line }   YOUR TABLE for one daily
//   ordinal(n)               → '1ST' · '2ND' · '3RD' · '4TH' · '11TH' …
//   everyoneLine(stand)      → 'TOP 12% OF EVERYONE' | ''                      only from BAND_MIN counting finishers (the server sends none below)
//   midLine(n)               → '2 PLAYERS ARE MID-DAILY' | ''                  the host's line in the room (THE ROOM WINS)

import { dayNum, dayOf } from '../core/streak.js';

export const COUNTS_FROM_TOMORROW = 'YOUR SCORE COUNTS FROM TOMORROW';
export const ROOM_BANNER = 'GAME STARTING · YOUR DAILY IS SAVED';
export const RESUME_CHIP = 'RESUME YOUR DAILY';
export const MAX_ROWS = 6;

const list = t => (t && Array.isArray(t.dailies) ? t.dailies.slice(0, MAX_ROWS) : []);
const has = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k) && o[k] != null;

/** the title dock's DAILY button: hidden with no live daily (THE GO-LIVE SWITCH off, /api down); WAITING while any is unplayed (+ how many) */
export function dockState(today) {
  const ds = list(today);
  if (!ds.length) return { show: false, state: 'hidden', left: 0 };
  const left = ds.filter(d => !has(today.mine, d.id)).length;
  return { show: true, state: left ? 'waiting' : 'done', left };
}

/** a TODAY row: DONE (a score in) · IN PROGRESS (a start, no score — RESUME) · WAITING (PLAY) */
export function rowState(today, id) {
  if (has(today && today.mine, id)) return 'done';
  if (today && today.started && today.started[id]) return 'progress';
  return 'waiting';
}

/** the sweep meter: one segment per today's daily */
export function sweepState(today) {
  const segs = list(today).map(d => ({ id: d.id, done: has(today.mine, d.id) }));
  const done = segs.filter(s => s.done).length;
  return { segs, done, of: segs.length, swept: segs.length > 0 && done === segs.length };
}

export function ordinal(n) {
  const v = Math.abs(Math.round(n)), t = v % 100;
  const suf = t >= 11 && t <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][v % 10] || 'TH';
  return `${v}${suf}`;
}

/**
 * YOUR TABLE for one daily: you + your friends (the server's `table` — ≤ 12 of YOUR friends, never anyone else). A friend's SCORE only once
 * you have played (the server sends { done: true } before — "waiting" for you); a friend who hasn't played is WAITING; a same-day profile's
 * own result never ranks (the server leaves a friend's out; YOUR gated score shows, unranked). Places share ties (two on 7 = both 2ND).
 *   names: { pid: name } · me: { pid, name } · better: 'low' | 'high'
 */
export function tableFor(today, id, { names = {}, me = {}, better = 'high' } = {}) {
  const t = today || {}, mine = has(t.mine, id) ? t.mine[id] : null, gated = !!(t.gated && t.gated[id]);
  const rows = [];
  if (me.pid) rows.push({ pid: me.pid, name: me.name || 'YOU', score: mine, me: true, played: mine != null, waiting: mine == null, gated });
  for (const pid of t.table || []) {
    if (pid === me.pid) continue;
    const f = (t.friends && t.friends[pid] && t.friends[pid][id]) || null;
    rows.push({ pid, name: names[pid] || 'FRIEND', score: f && f.score != null ? f.score : null, played: !!f, me: false, waiting: !f });
  }
  const sign = better === 'low' ? 1 : -1;
  const scored = rows.filter(r => r.score != null && !r.gated).sort((a, b) => sign * (a.score - b.score));
  let place = 0, prev = null;
  scored.forEach((r, i) => { if (prev === null || r.score !== prev) { place = i + 1; prev = r.score; } r.place = place; });
  // the order on screen: the ranked ones, then those who played (their score hidden until you play), then the waiting ones
  const rank = r => (r.place ? r.place : r.played ? 1e3 : r.gated ? 1e3 + 1 : 2e3);
  rows.sort((a, b) => rank(a) - rank(b) || (a.me ? -1 : b.me ? 1 : 0) || String(a.name).localeCompare(String(b.name)));
  const you = rows.find(r => r.me) || null, of = scored.length;
  const line = you && you.place && of > 1 ? `${ordinal(you.place)} OF ${of} AT YOUR TABLE` : '';
  return { rows, place: you ? you.place || null : null, of, line };
}

/** the everyone line — only where the server sent a standing (≥ BAND_MIN counting finishers); "TOP 12%" = your place from the top */
export function everyoneLine(stand) {
  if (!stand || !(stand.n > 0) || !Number.isFinite(stand.top)) return '';
  const top = stand.top < 1 ? 1 : Math.ceil(stand.top);
  return `TOP ${Math.min(100, top)}% OF EVERYONE`;
}

/** THE ROOM WINS — the host's line before START (who only: a count, never a run) */
export const midLine = n => (n > 0 ? `${n} ${n === 1 ? 'PLAYER IS' : 'PLAYERS ARE'} MID-DAILY` : '');

/** SHARE TODAY's plain line: "NEON SPEAKEASY · DAILIES · THE PASSWORD 7 guesses · COAST CLEAR 2:41 · SWEPT · neonspeakeasy.com" */
export function shareTodayLine(today, lineOf, site = 'neonspeakeasy.com') {
  const ds = list(today), parts = [];
  for (const d of ds) parts.push(`${d.name} ${has(today.mine, d.id) ? lineOf(d.id, today.mine[d.id]) : '—'}`);
  const sw = sweepState(today);
  return ['NEON SPEAKEASY DAILIES', ...parts, sw.swept ? 'SWEPT' : `${sw.done} of ${sw.of}`, site].join(' · ');
}

// ---------------------------------------------------------------- DFIX2 — THE DAILIES FIX PASS (FABLE REVIEW #2)
/** the 4 am turn (finding 4): a `today` answer from another day is stale — the dock + the screen re-read it, never a reload */
export const dayTurned = (today, dayNow) => !!(today && today.day && dayNow && today.day !== dayNow);

/**
 * THE RESUME CHIP's rule (finding 5): 'show' only while the held run is still resumable — its daily live, no score of yours in for it, and its
 * day = today's, or yesterday's with the server saying a run is still in flight there (`started` + `startedDay`); 'drop' = the hold is stale (the
 * run finished elsewhere, its day gone — the chip clears itself); 'none' = nothing to show (no hold, or no answer yet / the dailies off).
 */
export function chipState(today, held) {
  if (!held || !held.id) return 'none';
  const ds = list(today);
  if (!ds.length) return 'none';
  if (!ds.some(d => d.id === held.id)) return 'drop';
  if (has(today.mine, held.id)) return 'drop';
  if (!held.day || !today.day || held.day === today.day) return 'show';
  const sd = today.startedDay && today.startedDay[held.id];
  const inFlight = !!(today.started && today.started[held.id]) && (sd ? sd === held.day : held.day === dayOf(dayNum(today.day) - 1));
  return inFlight ? 'show' : 'drop';
}

/** SLIM CARDS ON SCORES — a long table shows the top TABLE_TOP finishers + you (with your real place) and a SHOW ALL n row for the rest */
export const TABLE_TOP = 5;
export function tableCut(finishers, { top = TABLE_TOP, all = false } = {}) {
  const rows = finishers || [];
  if (all || rows.length <= top + 1) return { shown: rows, hidden: [], more: 0 };
  const shown = rows.slice(0, top);
  const me = rows.find((r, i) => r.me && i >= top);
  if (me) shown.push(me);
  return { shown, hidden: rows.filter(r => !shown.includes(r)), more: rows.length };
}
/** the table's split for the cards: the FINISHERS (a score, or PLAYED — their score hidden until you play) and the ones STILL TO PLAY */
export function cardRows(rows) {
  const finishers = (rows || []).filter(r => r.played || r.score != null);
  return { finishers, waiting: (rows || []).filter(r => !finishers.includes(r)) };
}
/** the one line under the cards: "STILL TO PLAY · YOU · LOU · MAXIMILIANOS" (whole names; '' when everyone played) */
export function stillToPlay(waiting) {
  const names = (waiting || []).map(r => (r.me ? 'YOU' : String(r.name || 'FRIEND').toUpperCase()));
  return names.length ? ['STILL TO PLAY', ...names].join(' · ') : '';
}

/** BOARD 2.0 B — SCORES → ALL TIME: YOUR TABLE's average a day per daily (`/api/daily points` → { mine, friends: { pid: { [board]: { avg, days } } } }).
 *  Ranked = an average from `need` days played (the boards' MIN_DAYS), best first, with a place; the rest after it, unranked, in the order of
 *  their days; nobody who never played. → [{ pid, me, name, avg, days, place }] */
export function allTimeRows(points, { board, me = {}, names = {}, need = 10 } = {}) {
  if (!points || !board) return [];
  const one = (pid, vals, isMe) => { const v = (vals || {})[board]; return v && v.avg != null ? { pid, me: !!isMe, name: isMe ? me.name || 'YOU' : names[pid] || 'FRIEND', avg: Number(v.avg), days: Number(v.days) || 0 } : null; };
  const rows = [one(me.pid || 'me', points.mine, true), ...Object.entries(points.friends || {}).map(([pid, v]) => one(pid, v, false))].filter(Boolean);
  const ranked = rows.filter(r => r.days >= need).sort((a, b) => b.avg - a.avg || (a.me ? -1 : b.me ? 1 : 0));
  let place = 0, last = null;
  ranked.forEach((r, i) => { if (r.avg !== last) place = i + 1; last = r.avg; r.place = place; });
  const rest = rows.filter(r => r.days < need).sort((a, b) => b.days - a.days || b.avg - a.avg).map(r => ({ ...r, place: null }));
  return [...ranked, ...rest];
}
/** the line under an ALL TIME card: a ranked average, or how far from being ranked (YOU: "3 MORE DAYS TO BE RANKED · YOUR AVERAGE 83.3") */
export function allTimeLine(r, need = 10) {
  const avg = Number(r.avg).toFixed(1);
  if (r.place) return { score: avg, unit: 'AVG' };
  const left = Math.max(1, need - r.days);
  return r.me ? { note: `${left} MORE DAY${left === 1 ? '' : 'S'} TO BE RANKED · YOUR AVERAGE ${avg}` } : { note: `${r.days} OF ${need} DAYS · ${avg} AVG` };
}
