// The global boards on the server: what a player's stats put on them, ranks, and the cached top 100.
//
//   lb/{board}/{period}/{pid} = sort value (higher is better; boards.js#toSort). period = 'all' | 'w20261012'.
//   Entries reference the profile, never a copy of the name: rows are joined with profiles/{pid} when read, so a
//   rename shows on every board (every week, every record) at once.
import { ref, val } from './fb.js';
import { BOARD_GAMES, boardDef, careerBoards, toSort, winRate, MIN_WR_GAMES, fromSort, GAME_BOARDS } from '../../js/core/boards.js';
import { boardName } from '../../js/core/names.js';
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

const pubCache = new Map();
async function profilesOf(pids) {
  const out = {};
  await Promise.all(pids.map(async pid => {
    const hit = pubCache.get(pid);
    if (hit && Date.now() - hit.at < CACHE_MS) { out[pid] = hit.p; return; }
    const p = await val(`profiles/${pid}`);
    pubCache.set(pid, { at: Date.now(), p });
    out[pid] = p;
  }));
  return out;
}

export const publicRow = (pid, p) => ({ pid, n: boardName(p.n), t: p.t, a: p.a, c: p.c, r: p.r || 0 });

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
    if (!p || p.h) continue;
    i++;
    if (r.s !== prev) { rank = i; prev = r.s; }
    rows.push({ ...publicRow(r.pid, p), rank, v: fromSort(def, r.s) });
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
  const paths = boardPaths(pid, stats || {}, { hidden: !!prof.h, now, only });
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
