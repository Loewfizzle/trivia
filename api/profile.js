// POST /api/profile { action, … } — the caller's own profile (Firebase ID token required).
//   ensure  { name, avatar, color }  → { pid, profile, key? (new profiles only), rename? }   (created automatically)
//   me                               → { pid, profile, stats, priv }
//   ranks   { boards: [id] }         → { ranks: { board: { all: {v, rank}, week: {v, rank} } }, m, mm }  (exact, server-side; m = counted matches, mm = the board floor)
//   restore { key }                  → { pid, profile }      links this device to the key's profile
//   regen                            → { key }               a new key; the old one stops working
//   rename  { name }                 → { profile } | 429 { until }
//   show    { on }                   → { priv }              "Show me on global leaderboards"
import { route, send, readBody, requireUser, clientIp, ApiError } from './_lib/http.js';
import { FINISHES, GLOWS, isUnlocked } from '../js/core/ranks.js';
import { val, ref } from './_lib/fb.js';
import { ensureProfile, pidOf, publicProfile, restore, newKey, rename, setShown, privateInfo } from './_lib/profiles.js';
import { boardPaths, rankOf } from './_lib/lb.js';
import { boardDef, fromSort } from '../js/core/boards.js';
import { weekKey } from '../js/core/week.js';

async function mine(uid) {
  const pid = await pidOf(uid);
  if (!pid) throw new ApiError(404, 'no_profile');
  return pid;
}

/** The caller's exact rank on each board — computed from their stats, so it works when they're hidden too. */
export async function myRanks(pid, boards, now = Date.now()) {
  const stats = (await val(`pstats/${pid}`)) || {};
  const paths = boardPaths(pid, stats, { now });
  const wk = weekKey(now);
  const out = {};
  await Promise.all(boards.slice(0, 40).map(async b => {
    const def = boardDef(b);
    if (!def) return;
    const sa = paths[`lb/${b}/all/${pid}`], sw = paths[`lb/${b}/${wk}/${pid}`];
    out[b] = {
      all: sa != null ? { v: fromSort(def, sa), rank: await rankOf(b, 'all', sa, now) } : null,
      week: sw != null ? { v: fromSort(def, sw), rank: await rankOf(b, wk, sw, now) } : null,
    };
  }));
  return out;
}

export async function profileAction(uid, body, ip = '', now = Date.now()) {
  switch (body.action) {
    case 'ensure': return ensureProfile(uid, { name: body.name, avatar: body.avatar, color: body.color }, now);
    case 'me': {
      const pid = await mine(uid);
      const [profile, stats, priv] = await Promise.all([publicProfile(pid), val(`pstats/${pid}`), privateInfo(pid)]);
      const s = stats || {};
      const wk = weekKey(now);
      return { pid, profile, priv, stats: { xp: s.xp || 0, g: s.g || {}, gw: s.wk === wk ? s.gw || {} : {}, b: s.b || {}, wk, st: s.st || null, gd: s.gd || null } };
    }
    case 'ranks': {
      const pid = await mine(uid);
      const boards = Array.isArray(body.boards) ? body.boards.map(String) : [];
      // BNAME: + the server's match count and the floor (the pinned row says "N MORE MATCHES" instead of a would-be rank)
      const [ranks, prof] = await Promise.all([myRanks(pid, boards, now), publicProfile(pid)]);
      return { ranks, m: prof ? prof.m : 0, mm: prof ? prof.mm : 3 };
    }
    case 'restore': return restore(uid, body.key, ip, now);
    case 'regen': return { key: await newKey(await mine(uid)) };
    case 'rename': return { profile: await rename(await mine(uid), body.name, { now }) };
    case 'style': {
      // wear a card finish / a name glow from THE VAULT: only what the player's XP has unlocked
      const pid = await mine(uid);
      const xp = (await val(`pstats/${pid}/xp`)) || 0;
      const patch = {};
      if (body.f != null) { const it = FINISHES.find(x => x.id === body.f); if (!it || !isUnlocked(it, xp)) throw new ApiError(403, 'locked'); patch[`profiles/${pid}/f`] = it.id; }
      if (body.g != null) { const it = GLOWS.find(x => x.id === body.g); if (!it || !isUnlocked(it, xp)) throw new ApiError(403, 'locked'); patch[`profiles/${pid}/g`] = it.id; }
      if (Object.keys(patch).length) await ref('/').update(patch);
      return { profile: await publicProfile(pid) };
    }
    case 'show': { const pid = await mine(uid); await setShown(pid, !!body.on); return { priv: await privateInfo(pid) }; }
    default: throw new ApiError(400, 'bad_action');
  }
}

export default route(['POST'], async (req, res) => {
  const uid = await requireUser(req);
  const body = await readBody(req);
  send(res, 200, await profileAction(uid, body, clientIp(req)));
});
