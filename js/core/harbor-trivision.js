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
import { holdemShow, holdemState } from './harbor-holdem.js';
import { streakDay } from './streak.js';
import { GAMES } from '../config.js';

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
// ---- CITY B — THE DROP, the third face (the owner, Nov 14): up ONLY once THE DROP is live — its go-live day from the cached feed (api/_lib/radio.js
// radioPublic.drop ← progress/dlive.drop, while the dailies' switch is on: no new poll) — for `days` (14, THE CITY TIMETABLE's billboard.drop)
// from that day, then it retires by itself; the owner's switch (/admin → THE BILLBOARD → city2/billboard.drop) ON = that window · OFF · KEEP ON
// (never retires). &force=billboard-drop = live from TODAY on this phone.
const DROP_MODES = ['on', 'off', 'keep'];
let DROP = null, DROP_FORCE = null;
/** PURE: the feed's { live, mode } → a clean state (live: the go-live day 'YYYY-MM-DD' | null) */
export function cleanDrop(v) {
  if (!v || typeof v !== 'object') return null;
  return { live: KEY_RE.test(String(v.live || '')) ? String(v.live) : null, mode: DROP_MODES.includes(v.mode) ? v.mode : 'on' };
}
const LSD = 'nd:drop';
/** the feed's drop (radio.drop) — undefined / null = not live */
export function setDrop(v) {
  const n = cleanDrop(v);
  if (JSON.stringify(n) !== JSON.stringify(DROP)) { DROP = n; REV++; }
  if (typeof window !== 'undefined') { try { localStorage.setItem(LSD, JSON.stringify(n)); } catch { /* private mode */ } }
}
if (typeof window !== 'undefined') { try { DROP = cleanDrop(JSON.parse(localStorage.getItem(LSD) || 'null')); } catch { DROP = null; } }
/** &force=billboard-drop: THE DROP live from `since` (today) on this phone; null clears it */
export function setDropForce(f) { DROP_FORCE = f && KEY_RE.test(String(f.since || '')) ? { since: f.since } : null; REV++; }
export function dropState() {
  if (DROP_FORCE) return { live: DROP_FORCE.since, mode: 'on', src: 'force' };
  return { ...(DROP || { live: null, mode: 'on' }), src: DROP ? 'feed' : 'default' };
}
/** PURE: the face a day key shows for a state → 'drop' | null */
export function dropFace(S, dayKey, days = 14) {
  if (!S || !S.live || S.mode === 'off' || !KEY_RE.test(String(dayKey || ''))) return null;
  const d = dayNum(dayKey), l = dayNum(S.live);
  return d >= l && (S.mode === 'keep' || d < l + days) ? 'drop' : null;
}
export const dropShow = dayKey => dropFace(dropState(), dayKey, (knob('billboard.drop') || {}).days || 14);
export const isDropId = id => id === 'drop';
/** PURE (the server's half — api/_lib/radio.js radioPublic): THE DROP's go-live day for the feed — the dailies' switch on + its scheduled day
 *  (progress/dlive.drop.from 'dYYYYMMDD') → 'YYYY-MM-DD' | null; the owner's mode cleaned */
export function dropLiveDay(switchOn, sched) { const f = String((sched && sched.from) || ''); return switchOn && /^d\d{8}$/.test(f) ? `${f.slice(1, 5)}-${f.slice(5, 7)}-${f.slice(7, 9)}` : null; }
export const cleanDropMode = v => (DROP_MODES.includes(v) ? v : 'on');
/** CITY D (THE DROP never joined the rotation — the owner's iPhone after CITY C): THE DROP goes live at the 4 am ET turn (the dailies' streak day),
 *  but the board's own day key is its WORK DAY — still YESTERDAY until the billposter's evening turn — so on its go-live day (and the first hours
 *  of each day) the face was counted a day late and dropped. PURE: the day THE DROP's window is judged on = the later of the board's key and the
 *  streak day of `nowMs` (null = the board's key alone — the day chart, the tests' fixed days) */
export function dropKey(dayKey, nowMs = null) {
  if (!Number.isFinite(nowMs)) return dayKey;
  const s = String(streakDay(nowMs) || ''), k = /^d\d{8}$/.test(s) ? `${s.slice(1, 5)}-${s.slice(5, 7)}-${s.slice(7, 9)}` : null;
  return k && (!KEY_RE.test(String(dayKey || '')) || dayNum(k) > dayNum(dayKey)) ? k : dayKey;
}
// ---- CITY PART 1 — HIGH RISE's OPEN NOW face (the owner, Nov 20 8:12 am + 5:52 pm: the B1 billboard — HIGH over RISE + a dark band with OPEN NOW;
// ONLY OPEN NOW, never COMING SOON): LIT BY HIGH RISE's OWN GO-LIVE — its GAMES row (config.js: playable + its `live` day); before that day, or with
// the row off, no face at all. Judged on the streak day like THE DROP (the board's own key is its WORK DAY — a day late until the evening paste)
const highriseRow = () => GAMES.find(g => g && g.id === 'highrise') || null;
/** PURE on a GAMES row: the day HIGH RISE went live ('YYYY-MM-DD') | null (not playable / no day) */
export const highriseLive = (row = highriseRow()) => (row && row.playable && KEY_RE.test(String(row.live || '')) ? String(row.live) : null);
/** the HIGH RISE face a day key shows: 'highrise' | null */
export function highriseShow(dayKey, row = highriseRow()) {
  const live = highriseLive(row);
  return live && KEY_RE.test(String(dayKey || '')) && dayNum(dayKey) >= dayNum(live) ? 'highrise' : null;
}
export const isHighriseId = id => id === 'highrise';
/** the faces a day key turns between, in order — CITY PART 1 (the owner): HIGH RISE → JAYWALK → HOLD'EM, the newest game first; THE DROP's face
 *  REMOVED (the owner's call via the games chat — its pieces stay for the old feed + the tests); null when fewer than two are up (one face alone =
 *  no turning); nowMs (the city's clock): HIGH RISE judged on the streak day (dropKey — the same later-of rule) */
export function triFaces(dayKey, nowMs = null) { const F = [highriseShow(dropKey(dayKey, nowMs)), jaywalkShow(dayKey), holdemShow(dayKey)].filter(Boolean); return F.length >= 2 ? F : null; }
/** CITY H1 — THE BOARD OPENS ON THE NEWEST GAME (the owner): PURE — the index in F of the face whose switch went on MOST RECENTLY (the latest of
 *  each face's `since` / OPEN DAY — /admin stamps them when a switch is flipped, never typed); a tie → the later face; no dates → 0 */
export function newestFace(F, dates = {}) {
  let best = 0, bd = -Infinity;
  (F || []).forEach((f, i) => { const ds = [].concat(dates[f] || []).filter(d => KEY_RE.test(String(d))); const n = ds.length ? Math.max(...ds.map(dayNum)) : -Infinity; if (n > -Infinity && n >= bd) { bd = n; best = i; } });
  return best;
}
/** each face's switch dates now (holdem / jaywalk: since + OPEN DAY; drop: its go-live day) — for newestFace */
// (CITY H2 — the 4:03 pm entry: JAYWALK's NOW OPEN was switched on Nov 17 but /admin then kept no OPEN DAY — a switch to NOW OPEN without one
//  counts from that day; /admin stamps the day from now on — api/admin.js billboardJaywalk)
export const JAYWALK_OPENED = '2026-11-17';
export function faceDates() {
  const H = holdemState(), J = jaywalkState(), D = dropState(), h = [H.since, H.open], j = [J.since, J.open || (J.bar === 'open' ? JAYWALK_OPENED : null)];
  return { holdem: h, 'holdem-open': h, jaywalk: j, 'jaywalk-open': j, drop: [D.live], highrise: [highriseLive()] };   // (CITY PART 1: HIGH RISE's open day = its go-live — THE BOARD OPENS ON THE NEWEST GAME)
}
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
/** PURE (CITY A — item 7, THE BILLBOARD FLASH): the turn's progress e s after its start → 0..1 while it turns, 1 while the NEW face's bake is
 *  still on its way (the slats HOLD it — on a slow phone the city's re-bake lands seconds late, and the crisp poster copy follows the LANDED
 *  bake: letting go at a fixed 3 s showed the OLD face for a moment), null = over. `holdMax` (s, THE CITY TIMETABLE) = the safety cap only */
export function triProgress(e, dur, baking, holdMax = 20) {
  if (e < dur) return Math.max(0, e / dur);
  if (baking && e < dur + holdMax) return 1;
  return null;
}
/** the turns' times (s) in chapter j: [j × C, j × C + p] */
export function chapterTurns(j, K = triKnobs()) { const [e0, e1] = K.every, C = e0 + e1; return [j * C, j * C + e0 + (e1 - e0) * chapterHash(j, K.seed)]; }
/** the clock at t (server s) → { n (turns started so far — the face shown = n % faces: 0 A, 1 B, 2 C …), at (the last turn's start), u (0 → 1
 *  while it turns, else null), id } — `force` (s) = a turn every force s (&force=trivision) · `faces` (CITY A: N faces — CITY B's THE DROP is the
 *  third; the turns' TIMES never depend on it, only which face each turn lands on) */
export function triClock(t, K = triKnobs(), force = 0, faces = 2) {
  const dur = K.turn;
  let n, at;
  if (force > 0) { const k = Math.floor(t / force); n = k + 1; at = k * force; }
  else {
    const C = K.every[0] + K.every[1], j = Math.floor(t / C), [t0, t1] = chapterTurns(j, K);
    if (t >= t1) { n = 2 * j + 2; at = t1; } else { n = 2 * j + 1; at = t0; }
  }
  const u = t - at < dur ? (t - at) / dur : null;
  const N = Math.max(1, faces | 0);
  return { n, face: ((n % N) + N) % N, at, u, id: `${force ? 'f' : 'c'}${n}` };
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
