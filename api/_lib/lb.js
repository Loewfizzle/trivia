// The global boards on the server: what a player's stats put on them, ranks, and the cached top 100.
//
//   lb/{board}/{period}/{pid} = sort value (higher is better; boards.js#toSort). period = 'all' | 'w20261012'.
//   Entries reference the profile, never a copy of the name: rows are joined with profiles/{pid} when read, so a
//   rename shows on every board (every week, every record) at once.
//   BNAME (Oct 28): a PUBLIC row never carries the typed name or the profile id — only an opaque board id (boardId: an HMAC
//   of the pid with the server's pepper) and the house nickname it picks (js/core/nicknames.js); a profile is listed only
//   after BOARD_MIN_MATCHES counted matches (profiles/{pid}/m, the server's own count).
import { createHmac } from 'node:crypto';
import { ref, val, fb } from './fb.js';
import { BOARD_GAMES, boardDef, careerBoards, toSort, winRate, MIN_WR_GAMES, fromSort, GAME_BOARDS } from '../../js/core/boards.js';
import { houseNick, BOARD_MIN_MATCHES } from '../../js/core/nicknames.js';
import { weekKey } from '../../js/core/week.js';

export const TOP_N = 100;
const periodKey = (p, now) => (p === 'week' ? weekKey(now) : p === 'all' ? 'all' : p);

/** Every board path a player's stats put them on (value = sort value, or null when hidden / not eligible). */
export function boardPaths(pid, stats, { hidden = false, now = Date.now(), only = null } = {}) {
  const out = {};
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
      const v = (s, eligible) => {
        if (!s) return null;
        if (def.stat === 'wr') return (s.p || 0) >= MIN_WR_GAMES ? winRate(s.w || 0, s.p) : null;
        const n = s[def.stat] || 0;
        return eligible && n > 0 ? n : null;
      };
      put(def.id, 'all', v(all, true));
      if (thisWeek) put(def.id, wk, v(week, true));
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

/** The matches a profile must have before a public board lists it (env BOARD_MIN_MATCHES for tests). */
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

/** A row as the public sees it: the board id, the house nickname + its number, the emblem, colour and rank. No pid, no typed name. */
export function publicRow(pid, p) {
  const id = boardId(pid);
  const nick = houseNick(id);
  return { id, n: nick.n, t: nick.t, a: p.a, c: p.c, r: p.r || 0 };
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
    if (!p || p.h || (p.m || 0) < minMatches()) continue;
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
  const paths = boardPaths(pid, stats || {}, { hidden: !!prof.h || matchCount(stats) < minMatches(), now, only });
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
