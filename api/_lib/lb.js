// The global boards on the server: what a player's stats put on them, ranks, and the cached top 100.
//
//   lb/{board}/{period}/{pid} = sort value (higher is better; boards.js#toSort). period = 'all' | 'w20261012'.
//   Entries reference the profile, never a copy of the name: rows are joined with profiles/{pid} when read, so a
//   rename shows on every board (every week, every record) at once.
//   REAL USERNAMES (LOBBY 2.0 A — the owner, Nov 3 7:20 pm, reverses BNAME's house nicknames: "why would I want a scoreboard of random
//   names?"): a PUBLIC row carries the player's USERNAME and nothing else of theirs — never the profile id, the key, the tag's digits —
//   beside an opaque board id (boardId: an HMAC of the pid with the server's pepper — REPORT + your own row find it). A name the filter
//   calls rude (core/names.js#isOffensive) is shown as its HOUSE NICKNAME (js/core/nicknames.js — the old BNAME names, kept for this);
//   REPORT NAME + /admin's rename / hide stay. A profile is listed only from its BOARD_MIN_MATCHES-th COUNTED PLAY (profiles/{pid}/m) — a counted
//   room match or a counted daily finish; never a solo run (PD-3 Group 0 — core/progress.js#countedPlays).
import { createHmac } from 'node:crypto';
import { ref, val, fb } from './fb.js';
import { BOARD_GAMES, boardDef, careerBoards, toSort, winRate, MIN_WR_GAMES, fromSort, GAME_BOARDS, careerValue } from '../../js/core/boards.js';
import { houseNick, BOARD_MIN_MATCHES } from '../../js/core/nicknames.js';
import { isOffensive } from '../../js/core/names.js';
import { levelOf } from '../../js/core/levels.js';
import { OLD_FINISH, OLD_GLOW } from '../../js/core/items.js';
import { weekKey, weekEndsAt } from '../../js/core/week.js';
import { overallValues } from '../../js/core/overall.js';
import { countedPlays, boardHidden } from '../../js/core/progress.js';

export const TOP_N = 100;
const periodKey = (p, now) => (p === 'week' ? weekKey(now) : p === 'all' ? 'all' : p);

/**
 * BOARD 2.0 A — THE OVERALL BOARDS' paths from a player's stats (value = sort value, null = off the board): `xp` — ALL TIME = the total XP,
 * THIS WEEK = pstats.xw (the XP earned since Monday 00:00 ET — core/progress.js#payXp). Written in the SAME update as the profile's XP by every
 * path that pays it (api/_lib/stats.js — a match; api/daily.js — a daily); a replay pays nothing, so it writes nothing.
 */
export function overallPaths(pid, stats, { hidden = false, now = Date.now() } = {}) {
  const wk = weekKey(now), out = {};
  for (const [board, v] of Object.entries(overallValues(stats, now))) {
    // (the daily boards: listed from their own 3rd day played — a dailies-only player has no room matches; the opt-out + the hide as always)
    const off = hidden && !(board !== 'xp' && hidden === 'matches' && (v.days || 0) >= minMatches());
    out[`lb/${board}/all/${pid}`] = off || v.all == null ? null : v.all;
    out[`lb/${board}/${wk}/${pid}`] = null;
    for (const [w, x] of Object.entries(v.weeks || {})) out[`lb/${board}/${w}/${pid}`] = off || !(x > 0) ? null : x;
  }
  return out;
}

/** Every board path a player's stats put them on (value = sort value, or null when hidden / not eligible). `only` = one game's boards. */
export function boardPaths(pid, stats, { hidden = false, now = Date.now(), only = null } = {}) {
  const out = only ? {} : overallPaths(pid, stats, { hidden, now });
  const wk = weekKey(now);
  const thisWeek = stats && stats.wk === wk;
  const put = (board, period, v) => { out[`lb/${board}/${period}/${pid}`] = hidden || v == null ? null : v; };
  // records
  for (const [board, b] of Object.entries((stats && stats.b) || {})) {
    const def = boardDef(board);
    if (!def || (only && def.game !== only)) continue;
    put(board, 'all', b.a != null ? toSort(def, b.a) : null);
    if (b.wk === wk) put(board, wk, b.w != null ? toSort(def, b.w) : null);
  }
  // career counters
  for (const game of BOARD_GAMES) {
    if (only && game !== only) continue;
    const all = stats && stats.g && stats.g[game];
    const week = thisWeek && stats.gw && stats.gw[game];
    if (!all && !week) continue;
    for (const def of careerBoards(game)) {
      // (HOLD'EM IN THE CITY: the value is core/boards.js#careerValue — PURE, the unit tests read it; a tie-break board = ONE sort value)
      const v = (s, eligible, weekStart = null) => (eligible ? careerValue(def, s, { weekStart }) : null);
      put(def.id, 'all', v(all, true));
      if (thisWeek) put(def.id, wk, v(week, true, weekEndsAt(now) - 7 * 864e5));
    }
  }
  return out;
}

/** 1 + how many entries beat this sort value (ties share a rank). */
export async function rankOf(board, period, sortV, now = Date.now()) {
  if (sortV == null) return null;
  const snap = await ref(`lb/${board}/${periodKey(period, now)}`).orderByValue().startAfter(sortV).once('value');
  return snap.numChildren() + 1;
}

// ---- the top 100, joined with profiles, cached for a few seconds per instance (and by the CDN, see api/board.js)
const cache = new Map();
const CACHE_MS = 15_000;

export function clearBoardCache() { cache.clear(); pubCache.clear(); }

/** BOARD 2.0 A — why a profile is off the boards: 'opt' (the opt-out / the admin's hide — every board) · 'matches' (under the floor of 3 COUNTED
 *  PLAYS — PD-3 Group 0: room matches + counted daily finishes, never a solo run; the daily boards still list it from its 3rd day played) ·
 *  false (listed) */
export const hiddenOf = (prof, stats) => boardHidden(prof, stats, minMatches());
/** the counted plays the listing reads (core/progress.js#countedPlays) */
export const playCount = stats => countedPlays(stats);

/** A profile's board id: 16 hex, stable, not reversible without the server's pepper (so a row can't be looked up). */
const bids = new Map();
export function boardId(pid) {
  let id = bids.get(pid);
  if (!id) {
    id = createHmac('sha256', fb().pepper).update(`board:${pid}`).digest('hex').slice(0, 16);
    bids.set(pid, id);
    if (bids.size > 5000) bids.delete(bids.keys().next().value);
  }
  return id;
}

/** The counted plays a profile must have before a public board lists it (env BOARD_MIN_MATCHES for tests). */
export const minMatches = () => Number(process.env.BOARD_MIN_MATCHES ?? BOARD_MIN_MATCHES);

/** Total counted matches, all games together, from the stats (pstats/{pid}/g/{game}/p). */
export const matchCount = stats => Object.values((stats && stats.g) || {}).reduce((n, g) => n + ((g && g.p) || 0), 0);

const pubCache = new Map();
async function profilesOf(pids) {
  const out = {};
  await Promise.all(pids.map(async pid => {
    const hit = pubCache.get(pid);
    if (hit && Date.now() - hit.at < CACHE_MS) { out[pid] = hit.p; return; }
    const p = await val(`profiles/${pid}`);
    // profiles from before BNAME have no count yet: take it from their stats once
    if (p && typeof p.m !== 'number') p.m = matchCount({ g: await val(`pstats/${pid}/g`) });
    pubCache.set(pid, { at: Date.now(), p });
    out[pid] = p;
  }));
  return out;
}

/** A row as the public sees it: the board id, the USERNAME (a rude one → its house nickname), the emblem, colour, rank + level. No pid, no key, no tag.
 *  BOARD 2.0 A — + the SLIM CARD's display ids (ui/strip-board.js#stripFor draws it): cd the worn card · es the emblem shape · tb its tube style ·
 *  g the name glow — ids that draw, never an item's NAME (those stay owner-only), never the member Nº */
export const publicName = (id, n) => (n && !isOffensive(n) ? String(n) : houseNick(id).n);
export function publicRow(pid, p) {
  const id = boardId(pid);
  return { id, n: publicName(id, p.n), a: p.a, c: p.c, r: p.r || 0, l: p.l || levelOf(p.x || 0),
    cd: p.cd || OLD_FINISH[p.f] || null, es: p.es || null, tb: p.tb || null, g: OLD_GLOW[p.g] || p.g || null };
}

export async function topRows(board, period, now = Date.now()) {
  const def = boardDef(board);
  if (!def) return null;
  const pk = periodKey(period, now);
  const key = `${board}|${pk}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit;
  // a few extra in case some of them belong to hidden profiles
  const snap = await ref(`lb/${board}/${pk}`).orderByValue().limitToLast(TOP_N + 10).once('value');
  const raw = [];
  snap.forEach(c => { raw.push({ pid: c.key, s: c.val() }); });
  raw.sort((a, b) => b.s - a.s || (a.pid < b.pid ? -1 : 1));
  const profs = await profilesOf(raw.map(r => r.pid));
  const rows = [];
  let rank = 0, prev = null, i = 0;
  for (const r of raw) {
    const p = profs[r.pid];
    if (!p || p.h || (!def.points && (p.m || 0) < minMatches())) continue;   // (BOARD 2.0 A: a points board's floor is checked when it is written)
    i++;
    if (r.s !== prev) { rank = i; prev = r.s; }
    // pid stays on the cached row for the server (REPORT finds a row by its id); api/board.js sends only the public fields
    rows.push({ ...publicRow(r.pid, p), pid: r.pid, rank, v: fromSort(def, r.s) });
    if (rows.length >= TOP_N) break;
  }
  const data = { b: board, p: pk, rows, at: Date.now() };
  cache.set(key, data);
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  return data;
}

/** Writes (or clears) every board entry of a player from their stored stats. */
export async function syncBoards(pid, { now = Date.now(), only = null } = {}) {
  const [stats, prof] = await Promise.all([val(`pstats/${pid}`), val(`profiles/${pid}`)]);
  if (!prof) return {};
  const paths = boardPaths(pid, stats || {}, { hidden: hiddenOf(prof, stats), now, only });
  if (Object.keys(paths).length) await ref('/').update(paths);
  clearBoardCache();
  return paths;
}

/** Removes a player from one board (all-time and this week, or just one period). */
export async function clearEntry(pid, board, period = null, now = Date.now()) {
  const periods = period ? [periodKey(period, now)] : ['all', weekKey(now)];
  const paths = {};
  for (const p of periods) paths[`lb/${board}/${p}/${pid}`] = null;
  if (Object.keys(paths).length) await ref('/').update(paths);
  clearBoardCache();
}

export { GAME_BOARDS };
