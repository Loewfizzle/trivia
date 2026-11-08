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
