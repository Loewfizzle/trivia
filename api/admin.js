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
import { route, send, readBody, requireUser, ApiError } from './_lib/http.js';
import { ref, val, adminPids } from './_lib/fb.js';
import { pidOf, publicProfile, rename, privateInfo, isPid, encodeKey } from './_lib/profiles.js';
import { syncBoards, clearEntry, boardPaths, rankOf } from './_lib/lb.js';
import { boardDef, fromSort } from '../js/core/boards.js';
import { nameKey } from '../js/core/names.js';
import { weekKey } from '../js/core/week.js';

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
    default: throw new ApiError(400, 'bad_action');
  }
}

export default route(['POST'], async (req, res) => {
  const uid = await requireUser(req);
  const body = await readBody(req);
  send(res, 200, await adminAction(uid, body));
});
