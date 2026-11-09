// CITY FIXES + HOLD'EM — THE HOLD'EM BILLBOARD (the owner, Nov 8 — DECIDED: design B · THE CHIP, the speakeasy roof billboard's BASE POSTER
// until he changes it). PURE + one module state (like harbor-billboard.js's owner messages): what poster the roof board's day key shows when
// the ad is on, and whether THE BILLPOSTER's daily change is skipped (yesterday + today both HOLD'EM — he pastes it ONCE, the first evening
// it's on, then stays home). Every message still interrupts as before (the owner's radio messages, LOOK UP, FIREWORKS, PARTY, the Sunday
// postcard — core/harbor-billboard.js#hintAt runs first); HOLD'EM only replaces the day's GAME.
//   THE STATE: the timetable's row `billboard.holdem` is the DEFAULT (ON, COMING SOON, from its `since`) — the owner's switch (/admin →
//   THE BILLBOARD: api/_lib/radio.js#boardBase → city2/billboard → the cached GET /api/admin?live=1 → setHoldem) overrides it on every phone.
//   &force=billboard-holdem (+ &holdem=open) previews it from TODAY on this phone (the billposter pastes it at his slot / &force=work-billposter).
import { knob } from './harbor-schedule.js';

// (the city's day keys are NOT zero-padded — '2026-11-8' (harbor-workers.js#dayOf); the switch's are ('2026-11-08'): compared as day numbers)
const KEY_RE = /^\d{4}-\d{1,2}-\d{1,2}$/;
const dayNum = key => { const [y, m, d] = String(key).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const prevKey = key => new Date((dayNum(key) - 1) * 864e5).toISOString().slice(0, 10);

let SERVER = null;     // the owner's switch (null = not heard / never set: the timetable's default)
let REV = 0;           // bumps on every change (the city's workers' cache re-plans the billposter)
/** the state's revision — a planner cache keyed on it re-plans when the switch changes */
export const holdemRev = () => REV;
let FORCE = null;      // a preview on this phone: { since, bar }

/** PURE: a stored switch → a clean state (null = the default), from the server's city2/billboard.holdem */
export function cleanHoldem(v) {
  if (!v || typeof v !== 'object') return null;
  return { on: v.on !== false, bar: v.bar === 'open' ? 'open' : 'soon', since: KEY_RE.test(String(v.since || '')) ? v.since : null };
}
/** the owner's switch, from the cached GET (radio.base.holdem) — undefined/null = the default */
export function setHoldem(v) { const n = cleanHoldem(v); if (JSON.stringify(n) !== JSON.stringify(SERVER)) { SERVER = n; REV++; } }
/** &force=billboard-holdem: from `since` (today's key) on this phone, COMING SOON or NOW OPEN; null clears it */
export function setHoldemForce(f) { FORCE = f && KEY_RE.test(String(f.since || '')) ? { since: f.since, bar: f.bar === 'open' ? 'open' : 'soon' } : null; REV++; }

/** the state now → { on, bar: 'soon' | 'open', since: 'YYYY-MM-DD', src: 'force' | 'owner' | 'default' } */
export function holdemState() {
  if (FORCE) return { on: true, bar: FORCE.bar, since: FORCE.since, src: 'force' };
  const D = knob('billboard.holdem');
  if (SERVER) return { on: SERVER.on, bar: SERVER.bar, since: SERVER.since || D.since, src: 'owner' };
  return { on: D.on !== false, bar: D.bar === 'open' ? 'open' : 'soon', since: D.since, src: 'default' };
}
/** the poster a board day key shows: 'holdem' | 'holdem-open' | null (the day's game) */
export function holdemShow(dayKey) {
  const S = holdemState();
  if (!S.on || !dayKey || !KEY_RE.test(dayKey) || dayNum(dayKey) < dayNum(S.since)) return null;
  return S.bar === 'open' ? 'holdem-open' : 'holdem';
}
/** THE BILLPOSTER stays home on a day his change would paste the SAME poster (HOLD'EM over HOLD'EM) */
export const holdemKeeps = dayKey => !!holdemShow(dayKey) && holdemShow(prevKey(dayKey)) === holdemShow(dayKey);
/** a board game id that is the ad (the content's own ids) */
export const isHoldemId = id => id === 'holdem' || id === 'holdem-open';
