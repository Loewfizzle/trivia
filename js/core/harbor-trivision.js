// THE TRI-VISION (Nov 12 night — the owner's notes; docs/harbor.md "THE TRI-VISION") — the speakeasy's roof board TURNS between TWO posters: face A
// HOLD'EM (core/harbor-holdem.js — its approved poster, NOW OPEN) ↔ face B JAYWALK (screens/harbor/jaywalk-art.js — Grok's poster, COMING SOON;
// NOW OPEN from its open day, the owner's to set). Only those two faces; vertical slats turn in a quick ripple left → right like a real tri-vision.
// PURE + one module state (like harbor-holdem.js): JAYWALK's switch + the turn clock.
//   THE CLOCK (every phone the same face at the same server-clock moment): the turns come in CHAPTERS of every[0] + every[1] s (105 s) — two turns
//   a chapter, at 0 and at p = every[0] + (every[1] − every[0]) × h(chapter) (an integer hash — never Math.sin: its last bits differ by engine),
//   so EVERY gap is between every[0] and every[1] (45–60 s) and a phone finds the face at any moment without walking from the epoch. The faces
//   alternate turn by turn (A → B at a chapter's start, B → A at p). &force=trivision: a turn every `force` s (8 — the look review).
//   THE STATE: the timetable's `billboard.jaywalk` row is the DEFAULT (ON from its `since`, COMING SOON — `open` null until the owner sets a day);
//   the owner's switch (/admin → THE BILLBOARD: api/admin.js billboardJaywalk → city2/billboard.jaywalk → the cached GET ?live=1 → setJaywalk)
//   overrides it on every phone. &force=billboard-jaywalk (+ &jaywalk=open) = the JAYWALK face from TODAY on this phone.
import { knob } from './harbor-schedule.js';
import { holdemShow } from './harbor-holdem.js';

const KEY_RE = /^\d{4}-\d{1,2}-\d{1,2}$/;
const dayNum = key => { const [y, m, d] = String(key).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };

let SERVER = null, FORCE = null, REV = 0;
/** the state's revision (a planner / the board re-checks when the switch changes) */
export const jaywalkRev = () => REV;
/** PURE: a stored switch → a clean state (null = the default), from the server's city2/billboard.jaywalk */
export function cleanJaywalk(v) {
  if (!v || typeof v !== 'object') return null;
  return { on: v.on !== false, bar: v.bar === 'open' ? 'open' : 'soon', open: KEY_RE.test(String(v.open || '')) ? String(v.open) : null, since: KEY_RE.test(String(v.since || '')) ? String(v.since) : null };
}
const LS = 'nd:jaywalk';
/** the owner's switch, from the cached GET (radio.base.jaywalk) — undefined / null = the default */
export function setJaywalk(v) {
  const n = cleanJaywalk(v);
  if (JSON.stringify(n) !== JSON.stringify(SERVER)) { SERVER = n; REV++; }
  if (typeof window !== 'undefined') { try { localStorage.setItem(LS, JSON.stringify(n)); } catch { /* private mode: the default until the feed */ } }
}
if (typeof window !== 'undefined') { try { SERVER = cleanJaywalk(JSON.parse(localStorage.getItem(LS) || 'null')); } catch { SERVER = null; } }
/** &force=billboard-jaywalk: the JAYWALK face from `since` (today) on this phone, COMING SOON or NOW OPEN (&jaywalk=open); null clears it */
export function setJaywalkForce(f) { FORCE = f && KEY_RE.test(String(f.since || '')) ? { since: f.since, bar: f.bar === 'open' ? 'open' : 'soon' } : null; REV++; }
/** the state now → { on, bar, open, since, src } */
export function jaywalkState() {
  if (FORCE) return { on: true, bar: FORCE.bar, open: null, since: FORCE.since, src: 'force' };
  const D = knob('billboard.jaywalk');
  if (SERVER) return { on: SERVER.on, bar: SERVER.bar, open: SERVER.open, since: SERVER.since || D.since, src: 'owner' };
  return { on: D.on !== false, bar: 'soon', open: KEY_RE.test(String(D.open || '')) ? D.open : null, since: D.since, src: 'default' };
}
/** PURE: the bar a day key shows — NOW OPEN when the switch says so, or from the OPEN DAY on (the days before stay COMING SOON: the past stays true) */
export const jaywalkBar = (S, dayKey) => (S.bar === 'open' || (S.open && dayNum(dayKey) >= dayNum(S.open)) ? 'open' : 'soon');
/** the JAYWALK face a board day key shows: 'jaywalk' | 'jaywalk-open' | null */
export function jaywalkShow(dayKey) {
  const S = jaywalkState();
  if (!S.on || !dayKey || !KEY_RE.test(dayKey) || !S.since || dayNum(dayKey) < dayNum(S.since)) return null;
  return jaywalkBar(S, dayKey) === 'open' ? 'jaywalk-open' : 'jaywalk';
}
/** the two faces a day key turns between ([A, B]) — null when only one (or none) is up: JAYWALK off = HOLD'EM alone, no turning */
export function triFaces(dayKey) { const a = holdemShow(dayKey), b = jaywalkShow(dayKey); return a && b ? [a, b] : null; }
/** THE BILLPOSTER stays home while the tri-vision is up (the turning board is the motion — no paste) */
export const triKeeps = dayKey => !!triFaces(dayKey);
export const isJaywalkId = id => id === 'jaywalk' || id === 'jaywalk-open';

// ---- THE CLOCK (PURE)
/** an integer hash of a chapter → [0, 1) (Math.imul — the same bits on every engine) */
export function chapterHash(j, seed = 1924) {
  let h = Math.imul((j | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(seed | 0, 0xc2b2ae35);
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/** the knobs (the timetable's billboard.trivision) */
export const triKnobs = () => knob('billboard.trivision');
/** the turns' times (s) in chapter j: [j × C, j × C + p] */
export function chapterTurns(j, K = triKnobs()) { const [e0, e1] = K.every, C = e0 + e1; return [j * C, j * C + e0 + (e1 - e0) * chapterHash(j, K.seed)]; }
/** the clock at t (server s) → { n (turns started so far — the face shown = n % 2: 0 A, 1 B), at (the last turn's start), u (0 → 1 while it turns,
 *  else null), id } — `force` (s) = a turn every force s (&force=trivision) */
export function triClock(t, K = triKnobs(), force = 0) {
  const dur = K.turn;
  let n, at;
  if (force > 0) { const k = Math.floor(t / force); n = k + 1; at = k * force; }
  else {
    const C = K.every[0] + K.every[1], j = Math.floor(t / C), [t0, t1] = chapterTurns(j, K);
    if (t >= t1) { n = 2 * j + 2; at = t1; } else { n = 2 * j + 1; at = t0; }
  }
  const u = t - at < dur ? (t - at) / dur : null;
  return { n, face: ((n % 2) + 2) % 2, at, u, id: `${force ? 'f' : 'c'}${n}` };
}
/** the turns that START in [t0, t1) (the day chart, the golden table) */
export function turnsBetween(t0, t1, K = triKnobs(), force = 0) {
  const out = [];
  if (force > 0) { for (let k = Math.ceil(t0 / force); k * force < t1; k++) out.push(k * force); return out; }
  const C = K.every[0] + K.every[1];
  for (let j = Math.floor(t0 / C); j * C < t1; j++) for (const T of chapterTurns(j, K)) if (T >= t0 && T < t1) out.push(T);
  return out;
}
// ---- THE RIPPLE (PURE): slat i of n at the turn's u → its own progress (each slat turns in `per` of the turn, the starts staggered left → right)
export function slatU(i, n, u, per = 0.45) {
  const s = n > 1 ? (i / (n - 1)) * (1 - per) : 0, v = (u - s) / per;
  return v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v);
}
/** a slat's look at its progress v: a three-faced prism turning 120° — the old face (A) going round to the left, the new (B) coming round from the
 *  right: { a, b } their share of the slat's width (a + b = 1), { la, lb } their light (the face square on to the street brightest) */
export function slatLook(v) {
  const th = v * (2 * Math.PI / 3), ca = Math.max(0, Math.cos(th)), cb = Math.max(0, Math.cos(th - 2 * Math.PI / 3)), s = ca + cb || 1;
  return { a: ca / s, b: cb / s, la: 0.5 + 0.5 * ca, lb: 0.5 + 0.5 * cb };
}
