// THE DAILY MODULE — TODAY on the phone (DM2): ONE `today` answer (api/daily.js) shared by the title dock's DAILY button, the DAILY screen, the
// friends card's YOUR TABLE and the RESUME chip — fetched through /api (fetch + the ID token: THE PARKED DATABASE never wakes), kept ~20 s,
// re-read after a finish. Profiles are polish: /api down or the switch off → an empty list → no button, nothing drawn.
//   loadToday({ fresh }) → the answer (or the last one) · todayNow() · onToday(fn) → off() · markFinished(id, score)
//   THE HELD RUN (THE ROOM WINS): heldRun() → { id, day } | null · holdRun(id, day) · dropHeld()   (per device — the RESUME chip after the match)
import { api } from '../profile/api.js';
import { serverNow } from '../firebase.js';
import { streakDay } from '../core/streak.js';
import { easternParts } from '../core/week.js';
import { msToTurn } from './clock.js';
import { dayTurned } from './today-logic.js';

const TTL = 20_000;
let cache = null, at = 0, inflight = null;
const subs = new Set();
const tell = () => { for (const fn of subs) { try { fn(cache); } catch (e) { console.warn('[daily today]', e); } } };

export const todayNow = () => cache;
export function onToday(fn) { subs.add(fn); return () => subs.delete(fn); }

/** today's dailies + your results + YOUR TABLE (≤ 12 friends — the server picks them) */
export function loadToday({ fresh = false } = {}) {
  // DFIX2 (FABLE REVIEW #2, finding 4): an answer from ANOTHER day is stale whatever its age — the 4 am turn re-reads it, never a reload
  if (dayTurned(cache, streakDay(serverNow()))) fresh = true;
  if (!fresh && cache && Date.now() - at < TTL) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = api('daily', { action: 'today' })
    .then(r => { cache = r && Array.isArray(r.dailies) ? r : { dailies: [] }; at = Date.now(); armTurn(); tell(); return cache; })
    .catch(() => { if (!cache) { cache = { dailies: [], down: true }; tell(); } return cache; })
    .finally(() => { inflight = null; });
  return inflight;
}
/** a finish landed: the score in at once (the screen + the dock answer without waiting), then the server's own copy */
export function markFinished(id, score, extra = {}) {
  if (cache) {
    cache = { ...cache, mine: { ...(cache.mine || {}), [id]: score }, started: { ...(cache.started || {}), [id]: false },
      ...(extra.counted === false ? { gated: { ...(cache.gated || {}), [id]: true }, countsFrom: extra.countsFrom || cache.countsFrom } : {}) };
    tell();
  }
  if (heldRun() && heldRun().id === id) dropHeld();
  loadToday({ fresh: true });
}
/** a start landed (IN PROGRESS until it's scored) */
export function markStarted(id) {
  if (!cache || (cache.mine && cache.mine[id] != null) || (cache.started && cache.started[id])) return;
  cache = { ...cache, started: { ...(cache.started || {}), [id]: true } };
  tell();
}
/** the first-time hint seen (once per player — the server keeps it on the profile: pstats/{pid}/ls) */
export function markLesson(id) { if (cache) { cache = { ...cache, lessons: { ...(cache.lessons || {}), [id]: 1 } }; tell(); } }
/** (previews + tests: a scripted answer) */
export function setToday(t) { cache = t; at = Date.now(); tell(); }

// ---- THE 4 AM TURN (DFIX2, finding 4): ONE timer to the next day start (re-armed after every answer; a sleeping phone fires it on waking —
// a stale answer is also caught by loadToday's day check on the dock's visibilitychange) → a fresh `today`; the dock + the screen repaint from
// onToday as always. A run in flight is untouched: it keeps its own day (run-day.js).
let turnT = 0;
function armTurn() {
  if (typeof setTimeout !== 'function') return;
  clearTimeout(turnT);
  const t = serverNow();
  turnT = setTimeout(turnNow, Math.min(2 ** 31 - 1, msToTurn(easternParts(t), t % 1000) + 1500));
}
/** the day turned (the timer, the screen's countdown at zero, a test): the answer re-read now */
export function turnNow() { if (!cache) return Promise.resolve(null); at = 0; return loadToday({ fresh: true }); }
/** (tests) make the kept answer look like yesterday's */
export function staleToday(day = 'd00000000') { if (cache) cache = { ...cache, day }; }

// ---- THE HELD RUN — the room started a game mid-daily: the run is saved on the server (THE PASSWORD has no clock; COAST CLEAR paused); the
// RESUME chip shows after the match until the run is opened again or finished
const HKEY = 'daily:held';
export function heldRun() {
  try { const v = JSON.parse(localStorage.getItem(HKEY) || 'null'); return v && v.id ? v : null; } catch { return null; }
}
export function holdRun(id, day) { try { localStorage.setItem(HKEY, JSON.stringify({ id, day: day || null, at: Date.now() })); } catch { /* fine */ } tell(); }
export function dropHeld() { try { localStorage.removeItem(HKEY); } catch { /* fine */ } tell(); }
