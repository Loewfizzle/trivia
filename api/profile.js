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
//   FRIENDS A (api/_lib/friends.js — docs/profiles.md "FRIENDS"):
//   friends                          → { friends, in, out, blocked, recent, caps }   your own list (nobody else's, ever)
//   friendAdd { pid } | { b, bid }   → { ok, rel, pid, state }   a REQUEST (they accept); a request from them already → friends at once
//   friendAccept · friendDecline · friendCancel · friendRemove · friendBlock · friendUnblock { pid } → { ok, rel, pid, state }
//   friendInvite { pid, room }       → { ok, sent, until }       a friend into your room: their push + the waiting card
//   inviteCheck                      → { invites }                the waiting invites (on open; never a socket)
//   inviteDismiss { pid }            → { ok }
//   friendPush { op, sub?, endpoint? } → { key, subs, mine }      INVITE NOTIFICATIONS on this phone
//   FRIENDS B — FACE ID / PASSKEYS (api/_lib/passkeys.js — docs/profiles.md "PASSKEYS"; the RP from the request's Origin):
//   pkRegOptions                     → { options }                ADD FACE ID SIGN-IN (your card; a discoverable passkey, Face ID required)
//   pkRegister { response }          → { ok, h, pk }               the browser's answer → stored (pk = ACCOUNT's list)
//   pkAuthOptions                    → { options }                SIGN IN WITH FACE ID (no card needed yet)
//   pkAuth { response }              → { pid, profile, via }      → this device joins the passkey's card (like restore; the same limit)
//   pkRemove { h }                   → { ok, pk, signal }         a passkey off your card
import { withShow } from './_lib/catalog.js';   // (THE VAULT 1B: registers the server-only catalog + names only to owners)
import { route, send, readBody, requireUser, clientIp, ApiError } from './_lib/http.js';
import { ITEM, STARTER, signOf, SIGN_EMBLEMS } from '../js/core/items.js';
import { carryOver } from '../js/core/progress.js';
import { ownerCounts, pctOf, bumpOwners } from './_lib/owners.js';
import { val, ref, adminPids } from './_lib/fb.js';
import { memberNo } from './_lib/members.js';
import { DEV_CARDS, isDevCard } from '../js/core/dev-cards.js';
import { OWNER_GIFTS, isOwnerGift, isGiftCard } from '../js/core/gift-cards.js';
import { giftQueue, giftSeen } from './_lib/gifts.js';
import { overallValues } from '../js/core/overall.js';
import { ensureProfile, pidOf, publicProfile, restore, newKey, rename, setShown, privateInfo, setPrefs } from './_lib/profiles.js';
import { boardPaths, rankOf } from './_lib/lb.js';
import { boardDef, fromSort } from '../js/core/boards.js';
import { founderOpen } from './_lib/founder.js';
import { progressEvent } from './_lib/events.js';
import { placeOf, skyFor, kpNow } from './sky.js';
import { claimSighting } from './_lib/sightings.js';
import { setBirthday, birthdayRoom } from './_lib/birthday.js';
import { callFavor } from './_lib/favors.js';
import { weekKey } from '../js/core/week.js';
import { friendsState, friendDo, friendInvite, inviteCheck, inviteDismiss, friendPush, pendingIn } from './_lib/friends.js';
import { regOptions, register, authOptions, authenticate, removePasskey, passkeyList, originOf } from './_lib/passkeys.js';

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
    // BOARD 2.0 A — a points board: YOUR average a day + the days played, even below MIN_DAYS (unranked on ALL TIME until then)
    if (def.points) { const v = overallValues(stats, now)[b]; out[b].mine = { avg: v ? v.avg : null, days: v ? v.days : 0, need: def.minDays }; }
  }));
  return out;
}

export async function profileAction(uid, body, ip = '', now = Date.now(), req = null) {
  switch (body.action) {
    case 'ensure': return ensureProfile(uid, { name: body.name, avatar: body.avatar, color: body.color }, now, ip);
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
      // THE VAULT 2B — MEMBER Nº (assigned the first time a profile without one asks) + THE TWO DEV CARDS: granted to the owner's profile
      // (ADMIN_PIDS) only — never earnable, in no reward table; a profile not in ADMIN_PIDS never holds them (taken back if one did)
      if (profile && !profile.mn) { await memberNo(pid, now).catch(() => null); profile = await publicProfile(pid); }
      // (SHELL 2.0 B2 — + THE OWNER's OWN GIFT CARD (core/gift-cards.js#OWNER_GIFTS — the owner's ADD-ON, Nov 5): the same rule, its grant
      //  audited the first time; never in /admin → GIFTS; a profile not in ADMIN_PIDS never holds it)
      const dev = adminPids().includes(pid), it0 = (stats && stats.it) || {}, OWN = [...DEV_CARDS, ...OWNER_GIFTS];
      if (OWN.some(id => !!it0[id] !== dev)) {
        const patch = {};
        for (const id of OWN) patch[`pstats/${pid}/it/${id}`] = dev ? (it0[id] || now) : null;
        if (!dev && (isDevCard(profile && profile.cd) || isOwnerGift(profile && profile.cd))) patch[`profiles/${pid}/cd`] = null;
        if (dev) for (const id of OWNER_GIFTS) if (!it0[id]) patch[`audit/${ref('audit').push().key}`] = { at: now, by: pid, act: 'giftOwner', pid, b: id };
        await ref('/').update(patch);
        stats = await val(`pstats/${pid}`);
        if (!dev) profile = await publicProfile(pid);
      }
      // THE VAULT 2C — ONE EMBLEM SYSTEM: the 12 sign-up shapes, every member's from day one — back-filled into an older profile's items
      if (stats && SIGN_EMBLEMS.some(id => !(stats.it || {})[id])) {
        const patch = {}; for (const id of SIGN_EMBLEMS) if (!(stats.it || {})[id]) patch[`pstats/${pid}/it/${id}`] = (profile && profile.at) || now;
        await ref('/').update(patch); stats = await val(`pstats/${pid}`);
      }
      const s = stats || {};
      const wk = weekKey(now);
      const frIn = await pendingIn(pid, now).catch(() => 0);   // (FRIENDS A: the badge on the profile button)
      const pk = await passkeyList(pid).catch(() => []);   // (FRIENDS B: ACCOUNT's PASSKEYS)
      return { pid, profile, priv, pk, fr: { in: frIn }, stats: { xp: s.xp || 0, g: s.g || {}, gw: s.wk === wk ? s.gw || {} : {}, gs: s.wk === wk ? s.gs || {} : {}, b: s.b || {}, wk, st: s.st || null, gd: s.gd || null, it: s.it || {}, ac: s.ac || {}, fv: s.fv || 0, dl: s.dl ? { n: s.dl.n || 0 } : null, sg: (s.pa && s.pa.sg) || {}, sgt: (s.pa && s.pa.sgt) || 0 } };
    }
    case 'ranks': {
      const pid = await mine(uid);
      const boards = Array.isArray(body.boards) ? body.boards.map(String) : [];
      // BNAME: + the server's match count and the floor (the pinned row says "N MORE MATCHES" instead of a would-be rank)
      const [ranks, prof] = await Promise.all([myRanks(pid, boards, now), publicProfile(pid)]);
      return { ranks, m: prof ? prof.m : 0, mm: prof ? prof.mm : 3 };
    }
    // SHELL 2.0 B2 — THE GIFT's reveal seen (the phone showed "A gift from the house"): clear the waiting gift
    // (THE CARD PASS — THE GIFT QUEUE: the whole waiting line + how many of it are seen; `gift` = the first, for an old phone)
    case 'giftCheck': { const q = await giftQueue(await mine(uid)); return { ...q, gift: q.gifts[0] ? { id: q.gifts[0].id, at: q.gifts[0].at } : null }; }   // (a light boot check — profile/gift-reveal.js)
    case 'giftSeen': return giftSeen(await mine(uid), body.k ? String(body.k) : '', now);
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
        if ((isDevCard(id) || isOwnerGift(id)) && !adminPids().includes(pid)) throw new ApiError(403, 'locked');   // (THE DEV CARDS + the owner's own gift card: his only)
        // (THE VAULT 2C — ONE EMBLEM SYSTEM: a sign-up shape IS the profile's shape — `a` — and takes a worn earned emblem off)
        if (k === 'shape' && signOf(id)) { patch[`profiles/${pid}/a`] = signOf(id); patch[`profiles/${pid}/es`] = null; continue; }
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
    // (SHELL 2.0 B1 — COLOUR-BLIND on the profile: ppriv/{pid}/cb — private, server-written)
    case 'prefs': { const pid = await mine(uid); await setPrefs(pid, body); return { priv: await privateInfo(pid) }; }
    // FRIENDS A — the friends list, invites that wait, invite notifications (api/_lib/friends.js)
    case 'friends': return friendsState(await mine(uid), now);
    case 'friendAdd': case 'friendAccept': case 'friendDecline': case 'friendCancel': case 'friendRemove': case 'friendBlock': case 'friendUnblock':
      return friendDo(await mine(uid), body, now);
    case 'friendInvite': return friendInvite(await mine(uid), uid, body, now);
    case 'inviteCheck': return inviteCheck(await mine(uid), now);
    case 'inviteDismiss': return inviteDismiss(await mine(uid), body);
    case 'friendPush': return friendPush(await mine(uid), body, now);
    case 'pkRegOptions': return regOptions(await mine(uid), uid, { origin: originOf(req, body), now });
    case 'pkRegister': return register(await mine(uid), uid, body.response, { origin: originOf(req, body), ua: req ? req.headers['user-agent'] : body.ua, now });
    case 'pkAuthOptions': return authOptions(uid, { origin: originOf(req, body), now });
    case 'pkAuth': return authenticate(uid, body.response, { origin: originOf(req, body), ip, now });
    case 'pkRemove': return removePasskey(await mine(uid), body.h);
    default: throw new ApiError(400, 'bad_action');
  }
}

export default route(['POST'], async (req, res) => {
  const uid = await requireUser(req);
  const body = await readBody(req);
  send(res, 200, withShow(await profileAction(uid, body, clientIp(req), Date.now(), req)));
});
