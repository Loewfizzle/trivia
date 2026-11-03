// POST /api/profile { action, … } — the caller's own profile (Firebase ID token required).
//   ensure  { name, avatar, color }  → { pid, profile, key? (new profiles only), rename? }   (created automatically)
//   me                               → { pid, profile, stats, priv }
//   ranks   { boards: [id] }         → { ranks: { board: { all: {v, rank}, week: {v, rank} } }, m, mm }  (exact, server-side; m = counted matches, mm = the board floor)
//   restore { key }                  → { pid, profile }      links this device to the key's profile
//   regen                            → { key }               a new key; the old one stops working
//   rename  { name }                 → { profile } | 429 { until }
//   show    { on }                   → { priv }              "Show me on global leaderboards"
//   sighting { id, t, tz }           → { ok, counted, n, total, first, items, ach } | { ok: false, why }   (PROGRESSION B — CITY SIGHTINGS)
//   birthday { m, d }                → { bd, until }         month + day (never the year), private, changeable once a year
//   birthdayRoom { room, tz }        → the room's HAPPY BDAY skywrite (dormant until LOBBY 2.0)
//   favor    { jack, room, text?, colour?, show? } → { moment, spent }   CALL IN A FAVOR (a FAVOR token → one crew jack for the room)
import { route, send, readBody, requireUser, clientIp, ApiError } from './_lib/http.js';
import { ITEM, STARTER } from '../js/core/items.js';
import { carryOver } from '../js/core/progress.js';
import { ownerCounts, pctOf, bumpOwners } from './_lib/owners.js';
import { val, ref } from './_lib/fb.js';
import { ensureProfile, pidOf, publicProfile, restore, newKey, rename, setShown, privateInfo } from './_lib/profiles.js';
import { boardPaths, rankOf } from './_lib/lb.js';
import { boardDef, fromSort } from '../js/core/boards.js';
import { founderOpen } from './_lib/founder.js';
import { progressEvent } from './_lib/events.js';
import { placeOf, skyFor, kpNow } from './sky.js';
import { claimSighting } from './_lib/sightings.js';
import { setBirthday, birthdayRoom } from './_lib/birthday.js';
import { callFavor } from './_lib/favors.js';
import { weekKey } from '../js/core/week.js';

/** the IP's zone (Vercel's header; tests: the body's, only without a request) */
const ipTzOf = (req, body) => (req ? (req.headers && req.headers['x-vercel-ip-timezone'] ? decodeURIComponent(String(req.headers['x-vercel-ip-timezone'])) : null) : (body && body.ipTz) || null);

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

export async function profileAction(uid, body, ip = '', now = Date.now(), req = null) {
  switch (body.action) {
    case 'ensure': return ensureProfile(uid, { name: body.name, avatar: body.avatar, color: body.color }, now);
    case 'me': {
      const pid = await mine(uid);
      let [profile, stats, priv] = await Promise.all([publicProfile(pid), val(`pstats/${pid}`), privateInfo(pid)]);
      // THE CARRY-OVER (PROGRESSION A): a profile from before levels gets every level reward its XP had earned (once; a transaction)
      const fOpen = await founderOpen(now).catch(() => false);
      if (stats && carryOver(stats, now, { founderOpen: fOpen })) {
        let got = null;
        await ref(`pstats/${pid}`).transaction(cur => { got = carryOver(cur, now, { founderOpen: fOpen }); return got ? got.next : undefined; });
        if (got) { await bumpOwners(got.items, false, got.ach).catch(() => {}); stats = await val(`pstats/${pid}`); if (stats && stats.fd) await ref(`profiles/${pid}/fd`).set(true); }
      }
      const s = stats || {};
      const wk = weekKey(now);
      return { pid, profile, priv, stats: { xp: s.xp || 0, g: s.g || {}, gw: s.wk === wk ? s.gw || {} : {}, b: s.b || {}, wk, st: s.st || null, gd: s.gd || null, it: s.it || {}, ac: s.ac || {}, fv: s.fv || 0, dl: s.dl ? { n: s.dl.n || 0 } : null, sg: (s.pa && s.pa.sg) || {}, sgt: (s.pa && s.pa.sgt) || 0 } };
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
      // wear what you OWN (PROGRESSION A): { card?, glow?, tube?, shape? } — an item id you own, or '' to take it off (a card → the default)
      const pid = await mine(uid);
      const owned = (await val(`pstats/${pid}/it`)) || {};
      const patch = {};
      const SLOT = { card: ['card', 'cd'], glow: ['glow', 'g'], tube: ['tube', 'tb'], shape: ['emblem', 'es'] };
      for (const [k, [kind, field]] of Object.entries(SLOT)) {
        if (body[k] == null) continue;
        const id = String(body[k]);
        if (!id) { patch[`profiles/${pid}/${field}`] = null; continue; }
        const it = ITEM[id];
        if (!it || it.kind !== kind || !(owned[id] || STARTER.includes(id))) throw new ApiError(403, 'locked');
        patch[`profiles/${pid}/${field}`] = id;
      }
      if (patch[`profiles/${pid}/cd`] !== undefined) patch[`profiles/${pid}/f`] = null;   // the old finish id retires with the first pick
      if (Object.keys(patch).length) await ref('/').update(patch);
      return { profile: await publicProfile(pid) };
    }
    case 'pct': {
      // "X% OF PLAYERS HAVE THIS" — for the ids the caller OWNS only (never a list of what exists)
      const pid = await mine(uid);
      const [owned, ach, oc] = await Promise.all([val(`pstats/${pid}/it`), val(`pstats/${pid}/ac`), ownerCounts(now)]);
      const out = { i: {}, a: {} };
      for (const id of Object.keys(owned || {})) out.i[id] = pctOf(oc.i[id], oc.n);
      for (const id of Object.keys(ach || {})) out.a[id] = pctOf(oc.a[id], oc.n);
      return { pct: out, n: oc.n };
    }
    case 'event': return progressEvent(await mine(uid), String(body.ev || ''), { place: req ? placeOf(req) : (body.place || null), skyFor, tz: body.tz || null, ipTz: ipTzOf(req, body) }, now);
    // PROGRESSION B — BIRTHDAYS (month + day, private, once a year) + the room's skywrite (dormant until LOBBY 2.0) + CALL IN A FAVOR
    case 'birthday': return setBirthday(await mine(uid), body, now);
    case 'birthdayRoom': return birthdayRoom(await mine(uid), uid, body, { ipTz: ipTzOf(req, body) }, now);
    case 'favor': return callFavor(await mine(uid), uid, body, now);
    // PROGRESSION B — CITY SIGHTINGS: a tap on a legendary (server-verified: api/_lib/sightings.js)
    case 'sighting': return claimSighting(await mine(uid), uid, body, { req, placeOf, kpNow, place: req ? undefined : (body.place || null), ipTz: req ? undefined : (body.ipTz || null) }, now);
    case 'show': { const pid = await mine(uid); await setShown(pid, !!body.on); return { priv: await privateInfo(pid) }; }
    default: throw new ApiError(400, 'bad_action');
  }
}

export default route(['POST'], async (req, res) => {
  const uid = await requireUser(req);
  const body = await readBody(req);
  send(res, 200, await profileAction(uid, body, clientIp(req), Date.now(), req));
});
