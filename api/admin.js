// POST /api/admin { action, … } — moderation, for the profile ids in the ADMIN_PIDS environment variable only.
// Every change is written to audit/{push} with who did it. Actions:
//   whoami                         → { pid, admin }   (anyone: the /admin page shows your id so you can add it)
//   search { q }                   → { players: [...] }  by name prefix, "Name#1234", or a profile id
//   player { pid }                 → { profile, priv, stats, boards: [{ b, all, week }] }
//   removeRecord { pid, b, p? }    → removes a record (p: 'all' | 'week' | both) from the board and the player's bests
//   resetBoard { pid, b }          → resets the player's counter (career) or best (record) behind one board
//   rename { pid, name }           → renames (no daily limit; the tag rule still applies)
//   hide { pid, on }               → hides the player from (or returns them to) every global board
//   audit { limit? }               → { log: [...] } newest first
//   stats { fresh? }               → STATS (js/core/insights.js#summarize): live rooms, games, players, busiest times
//   errors                         → { errors: [...] } errors from players' phones (api/log.js), newest first
//   clearErrors { sig? }           → removes one error (sig) or all of them
//   reports                        → { reports: [...] } 9e: SEND REPORT / hang-watch snapshots from phones (api/log.js), newest first
//   clearReports { id? }           → removes one report (id) or all of them
//   cityLive { state, mins?, delay? } → CITY 2.0's PREVIEW PANEL, EVERYONE ON CITY 2: writes city2/live (every phone on ?city=2 plays
//                                    it from startAt until `until`; js/core/harbor-remote.js validates the state; C2: `delay` 0–10 s
//                                    pushes startAt — every phone counts down + starts on the same beat) → { live }
//   cityClear                      → removes city2/live (back to the real city) → { live: null }
import { route, send, readBody, requireUser, ApiError } from './_lib/http.js';
import { ref, val, adminPids } from './_lib/fb.js';
import { pidOf, publicProfile, rename, privateInfo, isPid, encodeKey } from './_lib/profiles.js';
import { syncBoards, clearEntry, boardPaths, rankOf } from './_lib/lb.js';
import { boardDef, fromSort } from '../js/core/boards.js';
import { nameKey } from '../js/core/names.js';
import { weekKey } from '../js/core/week.js';
import { summarize } from '../js/core/insights.js';
import { activity } from './_lib/activity.js';
import { cleanRemote, isEmpty, toParams, describe, cleanDelay, DEFAULT_MINS, MAX_MINS } from '../js/core/harbor-remote.js';

async function audit(by, act, pid, detail = {}) {
  await ref('audit').push({ at: Date.now(), by, act, pid: pid || null, ...detail });
}

async function search(q) {
  q = String(q || '').trim();
  if (!q) return [];
  if (isPid(q)) { const p = await publicProfile(q); return p ? [p] : []; }
  const tagged = /^(.*)#(\d{4})$/.exec(q);
  if (tagged) {
    const pid = await val(`tags/${encodeKey(nameKey(tagged[1]))}/${tagged[2]}`);
    const p = pid && await publicProfile(pid);
    return p ? [p] : [];
  }
  const nk = nameKey(q);
  const snap = await ref('profiles').orderByChild('nk').startAt(nk).endAt(`${nk}`).limitToFirst(30).once('value');
  const out = [];
  snap.forEach(c => { const p = c.val(); out.push({ pid: c.key, n: p.n, t: p.t, a: p.a, c: p.c, x: p.x || 0, r: p.r || 0, h: !!p.h }); });
  return out;
}

async function playerView(pid, now) {
  const [profile, priv, stats] = await Promise.all([publicProfile(pid), privateInfo(pid), val(`pstats/${pid}`)]);
  if (!profile) throw new ApiError(404, 'no_profile');
  const s = stats || {};
  const paths = boardPaths(pid, s, { now });
  const wk = weekKey(now);
  const boards = {};
  for (const [path, v] of Object.entries(paths)) {
    if (v == null) continue;
    const [, b, period] = path.split('/');
    const def = boardDef(b);
    (boards[b] ||= { b, label: def.label, game: def.game })[period === 'all' ? 'all' : 'week'] = { v: fromSort(def, v), rank: await rankOf(b, period, v, now) };
  }
  // records the player holds but which aren't on the boards (hidden) still show here
  for (const b of Object.keys(s.b || {})) if (!boards[b] && boardDef(b)) boards[b] = { b, label: boardDef(b).label, game: boardDef(b).game, all: { v: s.b[b].a, rank: null }, week: s.b[b].wk === wk ? { v: s.b[b].w, rank: null } : null };
  return { profile, priv, stats: { xp: s.xp || 0, g: s.g || {}, gw: s.wk === wk ? s.gw || {} : {} }, boards: Object.values(boards) };
}

async function removeRecord(pid, b, p, now) {
  const def = boardDef(b);
  if (!def) throw new ApiError(400, 'bad_board');
  const wk = weekKey(now);
  if (def.kind === 'record') {
    await ref(`pstats/${pid}/b/${b}`).transaction(cur => {
      if (!cur) return cur;
      const x = { ...cur };
      if (!p || p === 'all') delete x.a;
      if (!p || p === 'week') { delete x.w; delete x.wk; }
      return x.a == null && x.w == null ? null : x;
    });
  }
  await clearEntry(pid, b, p === 'all' ? 'all' : p === 'week' ? wk : null, now);
}

async function resetBoard(pid, b, now) {
  const def = boardDef(b);
  if (!def) throw new ApiError(400, 'bad_board');
  if (def.kind === 'record') return removeRecord(pid, b, null, now);
  const stats = ['wins', 'wr'].includes(b.split('-').slice(1).join('-')) ? ['p', 'w'] : [def.stat];
  await ref(`pstats/${pid}`).transaction(cur => {
    if (!cur) return cur;
    const x = JSON.parse(JSON.stringify(cur));
    for (const scope of ['g', 'gw']) {
      const g = x[scope] && x[scope][def.game];
      if (!g) continue;
      for (const k of stats) delete g[k];
      // the per-mode win counters (GRIDLOCK) go with WINS
      if (stats.includes('w')) for (const k of Object.keys(g)) if (k.startsWith('w_')) delete g[k];
    }
    return x;
  });
  await clearEntry(pid, b, null, now);
  await syncBoards(pid, { now, only: def.game });
}

// STATS (js/core/insights.js): live rooms, matches per game, the most active players, busiest times. Reads open rooms,
// counted matches and profiles once per 30 s at most (the page refreshes "live now" while it's open).
let statsCache = null;
async function stats(now, fresh = false) {
  if (!fresh && statsCache && Math.abs(now - statsCache.at) < 30_000) return statsCache.data;
  const [results, profiles, rooms, gplay] = await Promise.all([val('results'), val('profiles'), val('rooms'), activity(now)]);
  const data = summarize({ results: results || {}, profiles: profiles || {}, rooms: rooms || {}, gplay, now });
  statsCache = { at: now, data };
  return data;
}

// Errors from players' phones (api/log.js): newest first; entries quiet for 30 days are pruned on the way.
const ERR_KEEP_MS = 30 * 86_400_000;
async function errorList(now) {
  const all = (await val('errlog')) || {};
  const stale = Object.keys(all).filter(k => !(all[k].last > now - ERR_KEEP_MS));
  if (stale.length) await ref('errlog').update(Object.fromEntries(stale.map(k => [k, null])));
  return Object.entries(all).filter(([k]) => !stale.includes(k))
    .map(([sig, e]) => ({ sig, ...e }))
    .sort((a, b) => b.last - a.last)
    .slice(0, 150);
}

// 9e — the phones' REPORTS (SEND REPORT + the hang watch, api/log.js#logReport): newest first, only the newest 40 kept
async function reportList() {
  const all = (await val('phonelog')) || {};
  const list = Object.entries(all).map(([id, r]) => ({ id, ...r })).sort((a, b) => b.at - a.at);
  const old = list.slice(40);
  if (old.length) await ref('phonelog').update(Object.fromEntries(old.map(r => [r.id, null])));
  return list.slice(0, 40);
}

// CITY 2.0 — THE PREVIEW PANEL (docs/harbor.md): one public node, written here only (the rules: read by signed-in users, no
// client writes). Plain values only — the state is rebuilt from the registry's lists; anything it had to drop refuses the call.
async function cityLive(me, body, now) {
  const { state, bad } = cleanRemote(body.state);
  if (bad.length) throw new ApiError(400, 'bad_state', `Not allowed: ${bad.slice(0, 6).join(', ')}`);
  if (isEmpty(state)) throw new ApiError(400, 'empty_state', 'Nothing to send (use cityClear).');
  const m = body.mins == null ? DEFAULT_MINS : Number(body.mins);
  if (!Number.isInteger(m) || m < 1 || m > MAX_MINS) throw new ApiError(400, 'bad_mins');
  const d = cleanDelay(body.delay);
  if (d == null) throw new ApiError(400, 'bad_delay');
  const startAt = now + d * 1000;
  const live = { v: 1, kind: 'preview', state, params: toParams(state), label: describe(state), startAt, until: startAt + m * 60_000, by: me };
  await ref('city2/live').set(live);
  await audit(me, 'cityLive', null, { b: live.label.slice(0, 140), mins: m });
  return { live };
}

export async function adminAction(uid, body, now = Date.now()) {
  const me = await pidOf(uid);
  const admin = !!me && adminPids().includes(me);
  if (body.action === 'whoami') return { pid: me, admin };
  if (!admin) throw new ApiError(403, 'not_admin', 'This profile is not an admin.');
  const pid = body.pid ? String(body.pid) : null;
  if (pid && !isPid(pid)) throw new ApiError(400, 'bad_pid');
  switch (body.action) {
    case 'search': return { players: await search(body.q) };
    case 'player': return playerView(pid, now);
    case 'removeRecord': await removeRecord(pid, String(body.b), body.p || null, now); await audit(me, 'removeRecord', pid, { b: String(body.b), p: body.p || 'both' }); return playerView(pid, now);
    case 'resetBoard': await resetBoard(pid, String(body.b), now); await audit(me, 'resetBoard', pid, { b: String(body.b) }); return playerView(pid, now);
    case 'rename': {
      const before = await publicProfile(pid);
      const after = await rename(pid, body.name, { force: true, now });
      await audit(me, 'rename', pid, { from: before ? `${before.n}#${before.t}` : null, to: `${after.n}#${after.t}` });
      return playerView(pid, now);
    }
    case 'hide': {
      const on = !!body.on;
      const opt = !!(await val(`ppriv/${pid}/opt`));
      await ref('/').update({ [`ppriv/${pid}/ban`]: on ? true : null, [`profiles/${pid}/h`]: on || opt ? true : null });
      await syncBoards(pid, { now });
      await audit(me, on ? 'hide' : 'unhide', pid);
      return playerView(pid, now);
    }
    case 'audit': {
      const snap = await ref('audit').orderByChild('at').limitToLast(Math.min(200, Number(body.limit) || 60)).once('value');
      const log = [];
      snap.forEach(c => { log.push({ id: c.key, ...c.val() }); });
      log.reverse();
      const names = {};
      await Promise.all([...new Set(log.flatMap(l => [l.by, l.pid]).filter(Boolean))].map(async p => { const x = await publicProfile(p); names[p] = x ? `${x.n}#${x.t}` : p; }));
      return { log, names };
    }
    case 'stats': return stats(now, !!body.fresh);
    case 'errors': return { errors: await errorList(now) };
    case 'clearErrors': {
      const sig = body.sig ? String(body.sig) : null;
      if (sig && !/^e[0-9a-f]{15}$/.test(sig)) throw new ApiError(400, 'bad_sig');
      await ref(sig ? `errlog/${sig}` : 'errlog').remove();
      await audit(me, sig ? 'clearError' : 'clearErrors', null, sig ? { b: sig } : {});
      return { errors: await errorList(now) };
    }
    case 'reports': return { reports: await reportList() };
    case 'clearReports': {
      const id = body.id ? String(body.id) : null;
      if (id && !/^[-_A-Za-z0-9]{10,40}$/.test(id)) throw new ApiError(400, 'bad_id');
      await ref(id ? `phonelog/${id}` : 'phonelog').remove();
      await audit(me, id ? 'clearReport' : 'clearReports', null, {});
      return { reports: await reportList() };
    }
    case 'cityLive': return cityLive(me, body, now);
    case 'cityClear': await ref('city2/live').remove(); await audit(me, 'cityClear', null); return { live: null };
    default: throw new ApiError(400, 'bad_action');
  }
}

export default route(['POST'], async (req, res) => {
  const uid = await requireUser(req);
  const body = await readBody(req);
  send(res, 200, await adminAction(uid, body));
});
