// FRIENDS A — THE FRIENDS CORE on the server (docs/profiles.md "FRIENDS"). Every friend action is an action on POST /api/profile (no new
// function — Vercel Hobby's 12): the caller's own profile from their ID token, the other's checked to exist, the PURE step
// (js/core/friends.js#friendStep) decides, ONE multi-path update writes both sides. pfr/{pid} is server-written only; its owner may read it
// (database.rules.json), another player never — the phones get their own list from here.
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { take } from './limit.js';
import { isPid, publicProfile } from './profiles.js';
import { boardId, publicName, publicFaces } from './lb.js';
import { pidOfQuery } from './player.js';
import { boardDef } from '../../js/core/boards.js';
import { FR, FR_WHY, friendStep, relOf, fresh, suggestions, recentPatch, inviteLive, tablePids } from '../../js/core/friends.js';
import { sendPush, okEndpoint, vapid } from './push.js';
import { presenceOnline } from '../../js/core/room-logic.js';
import { weekXp } from '../../js/core/progress.js';
import { createHash, randomBytes } from 'node:crypto';
import { countsOn, streakDay } from '../../js/core/streak.js';

const node = async pid => (await val(`pfr/${pid}`)) || {};
const fail = (status, why) => { throw new ApiError(status, why, FR_WHY[why] || why); };

/** a player as THEIR FRIENDS see them: the card's public face (+ bid, so THE BOARD's rows can show FRIENDS / REQUESTED) */
export async function cardOf(pid, at = 0) {
  const p = await publicProfile(pid);
  if (!p) return null;
  // (DFIX2 — SLIM CARDS ON SCORES: + the XP + the member Nº, so a friend's strip is drawn exactly like a room player's — ui/strip-board.js)
  return { pid, bid: boardId(pid), n: p.n, t: p.t, a: p.a, c: p.c, l: p.l, x: p.x, mn: p.mn, cd: p.cd, g: p.g, tb: p.tb, es: p.es, at };
}
/** THE FIX PASS — S8: a card for anyone who is not an accepted friend — no tag digits, no member Nº */
export const stranger = c => { if (!c) return c; const { t: _t, mn: _mn, ...face } = c; void _t; void _mn; return face; };
const cards = async (m, order = null) => {
  const list = (order || Object.entries(m || {}).sort((x, y) => y[1] - x[1]).map(([p]) => p)).filter(isPid);
  return (await Promise.all(list.map(p => cardOf(p, (m && m[p]) || 0)))).filter(Boolean);
};

/** the whole list for its owner → { friends, in, out, blocked, recent, caps } (the pending ones from before FR.pendingMs pruned here) */
export async function friendsState(pid, now = Date.now()) {
  const A = await node(pid), X = fresh(A, now);
  // (the old pending ones go — both maps, on this side; the other side's copy goes on its own next read)
  const gone = {};
  for (const k of ['in', 'out']) for (const p of Object.keys(A[k] || {})) if (!X[k][p]) gone[`pfr/${pid}/${k}/${p}`] = null;
  if (Object.keys(gone).length) await ref('/').update(gone);
  const sug = suggestions(A, pid, now);
  const [friends0, inn0, out0, blocked0, recent] = await Promise.all([cards(X.f), cards(X.in), cards(X.out), cards(X.b), cards(X.rp, sug)]);
  // (FR7 FIXES A — C6: a REQUEST is a stranger's name — a throwaway named anything could friendAdd any board row: the rude-name filter's HOUSE
  //  NICKNAME on the requests + the blocked, as THE BOARD shows it; your friends + the players you shared a room with keep their names)
  // (THE FIX PASS — S8: a card that is NOT an accepted friend never carries the tag digits or the member Nº — a friend request to any board
  //  row answered with that stranger's `t` + `mn`; the slim card draws without them)
  const nick = list => list.map(c => stranger({ ...c, n: publicName(c.bid, c.n) }));
  const inn = nick(inn0), out = nick(out0), blocked = nick(blocked0);
  // (BOARD 2.0 B — THE FRIENDS LIST as slim cards, by THIS WEEK's XP: each FRIEND's week counter (pstats/{pid}/xw — the OVERALL board's own number), the
  //  friends only — never a request, a block or a suggestion; the existing read, no new function)
  //  (PD-1 GROUP 0: a friend who OPTED OUT of the public boards — profiles/{pid}/h — is out of this number too: wx null, only they see their own)
  const friends = await Promise.all(friends0.map(async c => {
    const [hid, xw] = await Promise.all([val(`profiles/${c.pid}/h`), val(`pstats/${c.pid}/xw`)]);
    return { ...c, wx: hid ? null : weekXp({ xw }, now) };
  }));
  return { friends, in: inn, out, blocked, recent: recent.map(c => stranger({ ...c, rel: relOf(A, pid, c.pid, now) })), caps: { max: FR.max, outMax: FR.outMax } };
}

/**
 * YOUR TABLE for ONE RECORD board (JAYWALK H3 — a game's end screen: friends' bests): you + the ≤ FR.tableN friends YOUR OWN list names
 * (js/core/friends.js#tablePids — a stranger's best is never readable by naming their id), the ones with a value on that board, best first.
 * → { b, rows: [{ ...the slim card's public face (the board id — NEVER a pid), v, me? }] } — a friend hidden from the boards is not listed.
 */
export async function boardTable(pid, b, now = Date.now()) {
  const def = boardDef(String(b || ''));
  if (!def || def.kind !== 'record') fail(400, 'bad_board');
  const pids = [pid, ...tablePids(await node(pid), pid, null, now)];
  const [vals, faces] = await Promise.all([Promise.all(pids.map(p => val(`pstats/${p}/b/${def.id}/a`))), publicFaces(pids, { av: def.avg ? def.id : null })]);   // (JT2: + the board's AVERAGE)
  const rows = [];
  pids.forEach((p, i) => {
    if (vals[i] == null || typeof vals[i] !== 'number') return;
    const face = faces[p] || (p === pid ? { id: boardId(pid), n: 'YOU', ...(def.avg ? { av: null } : {}) } : null);
    if (face) rows.push({ ...face, v: vals[i], ...(p === pid ? { me: true } : {}) });
  });
  rows.sort((x, y) => (def.dir === -1 ? x.v - y.v : y.v - x.v) || (x.me ? -1 : y.me ? 1 : 0));
  return { b: def.id, rows };
}

/** the pending-requests count (the badge on the profile button — `me` carries it) */
export const pendingIn = async (pid, now = Date.now()) => Object.keys(fresh({ in: await val(`pfr/${pid}/in`) }, now).in).length;

const KINDS = { friendAdd: 'add', friendAccept: 'accept', friendDecline: 'decline', friendCancel: 'cancel', friendRemove: 'remove', friendBlock: 'block', friendUnblock: 'unblock' };

/** one action { action, pid? | (b + bid) | (id + dg — a SCORES row) | code } → { ok, rel, pid, state } — a board / SCORES target through THE ONE
 *  TARGET RESOLVER (player.js#pidOfQuery — the player page's own; CITY PART 1: SCORES' { id, dg } was sent as nothing and refused) */
export async function friendDo(me, body, now = Date.now()) {
  const kind = KINDS[body.action];
  if (!kind) fail(400, 'bad_action');
  let other = isPid(body.pid) ? String(body.pid) : null;
  if (!other && (body.bid || body.id)) other = await pidOfQuery({ b: body.b, bid: body.bid, id: body.id, dg: body.dg }, now);
  if (!other && body.code) other = await pidOfLink(body.code);   // (CITY C — THE ADD-ME LINK: the code → its owner, on the server only)
  if (!other) fail(404, 'no_profile');
  if (other === me) fail(400, 'self');
  if (kind === 'add') {
    // (anti-spam: the requests a profile may send — an hour + a day; a refusal counts nothing)
    if (!(await take(`fr_h_${me}`, FR.reqPerHour, 3600e3, now)) || !(await take(`fr_d_${me}`, FR.reqPerDay, 864e5, now))) fail(429, 'rate');
  }
  if (!(await val(`profiles/${other}/n`)) && kind !== 'unblock' && kind !== 'cancel' && kind !== 'remove' && kind !== 'decline') fail(404, 'no_profile');
  const [A, B] = await Promise.all([node(me), node(other)]);
  const r = friendStep(kind, me, other, A, B, now);
  if (!r.ok) fail(r.why === 'bad_action' ? 400 : 409, r.why);
  const up = {};
  for (const [k, v] of Object.entries(r.up)) up[`pfr/${k.startsWith('a/') ? me : other}/${k.slice(2)}`] = v;
  if (Object.keys(up).length) await ref('/').update(up);
  // CITY C — THE KNOCK's PUSH: a request that LANDED (their in-map written — a block swallows it silently, then no push) → their phones, if they
  // turned notifications on; at most ONE a day per sender per receiver (rl/frp_<me>_<them>); a failed push never fails the request
  if (kind === 'add' && Object.prototype.hasOwnProperty.call(up, `pfr/${other}/in/${me}`) && up[`pfr/${other}/in/${me}`]) await requestPush(me, other, now).catch(() => {});
  return { ok: true, rel: r.rel, ...(isPid(body.pid) ? { pid: other } : {}), state: await friendsState(me, now) };   // (CITY PART 1 — the review: a board / SCORES / link target never learns the pid behind it)
}
/** CITY C — the friend-request push (the INVITES' path: ppriv/{pid}/ps, the same VAPID keys) → phones reached */
async function requestPush(me, to, now) {
  if (!vapid() || !(await take(`frp_${me}_${to}`, 1, 864e5, now))) return 0;
  const [prof, subs] = await Promise.all([publicProfile(me), val(`ppriv/${to}/ps`)]);
  const name = publicName(boardId(me), String((prof && prof.n) || 'A player'));
  let sent = 0;
  await Promise.all(Object.entries(subs || {}).map(async ([k, sub]) => {
    const st = await sendPush(sub, { title: `${name} wants to be friends`, body: 'Tap to answer · NEON SPEAKEASY', url: '/?fr=in', tag: `fr-${boardId(me)}` }, { ttl: 86400 }).catch(() => 0);
    if (st >= 200 && st < 300) sent++;
    else if (st === 404 || st === 410) await ref(`ppriv/${to}/ps/${k}`).remove();
  }));
  return sent;
}

// ------------------------------------------------------------------ CITY C — THE ADD-ME LINK (YOU → SHARE MY FRIEND LINK)
// A short code the SERVER makes (never a pid in a link): flink/{code} = { p, at } + pfr/{pid}/lk = the code (one a profile — the same link every
// time). The link /?add=<code> opens the app on "ADD <NAME>?" → friendAdd { code } (the normal request: rate limits, blocks, caps). THE THROWAWAY
// GATE: a profile made today mints no link yet (ppriv/{pid}/at before today's 4 am start — no link spam from throwaways).
const LINK_RE = /^[a-hj-km-np-z2-9]{7}$/, LINK_AB = 'abcdefghjkmnpqrstuvwxyz23456789';
const newCode = () => [...randomBytes(7)].map(b => LINK_AB[b % LINK_AB.length]).join('');
async function pidOfLink(code) {
  const c = String(code || '').toLowerCase();
  if (!LINK_RE.test(c)) return null;
  const x = await val(`flink/${c}`);
  return x && isPid(x.p) ? x.p : null;
}
/** friendLink → { code } (made once, kept) */
export async function friendLink(me, now = Date.now()) {
  const had = await val(`pfr/${me}/lk`);
  if (had && LINK_RE.test(String(had)) && (await pidOfLink(had)) === me) return { code: had };
  if (!countsOn(await val(`ppriv/${me}/at`), streakDay(now))) throw new ApiError(403, 'too_new', 'Your friend link opens tomorrow — play a game first.');
  if (!(await take(`flk_${me}`, 5, 864e5, now))) fail(429, 'rate');
  for (let i = 0; i < 6; i++) {
    const code = newCode();
    const r = await ref(`flink/${code}`).transaction(cur => (cur ? undefined : { p: me, at: now }));
    if (r.committed) { await ref(`pfr/${me}/lk`).set(code); return { code }; }
  }
  throw new ApiError(503, 'busy', 'Try again in a moment.');
}
/** friendLinkGet { code } → { card: the owner's public face (NO pid / board id), rel, self } — "ADD <NAME>?" */
export async function friendLinkGet(me, body, now = Date.now()) {
  const p = await pidOfLink(body.code);
  if (!p) throw new ApiError(404, 'no_link', 'That friend link doesn’t work any more.');
  if (p === me) return { self: true };
  const c = await cardOf(p);
  if (!c) throw new ApiError(404, 'no_link', 'That friend link doesn’t work any more.');
  const { pid: _p, bid: _b, ...face } = stranger(c);   // (THE FIX PASS — S8: no tag digits / member Nº either)
  return { card: { ...face, n: publicName(c.bid, c.n) }, rel: relOf(await node(me), me, p, now) };
}

/** a verified match (api/_lib/stats.js#applyMatch): every player's RECENTLY PLAYED WITH gets the others (best effort) */
export async function noteRecent(pids, now = Date.now()) {
  const P = [...new Set((pids || []).filter(isPid))];
  if (P.length < 2 || P.length > 12) return;
  const nodes = Object.fromEntries(await Promise.all(P.map(async p => [p, { rp: (await val(`pfr/${p}/rp`)) || {} }])));
  const rel = recentPatch(P, nodes, now), up = {};
  for (const [k, v] of Object.entries(rel)) up[`pfr/${k}`] = v;
  if (Object.keys(up).length) await ref('/').update(up);
}

// ------------------------------------------------------------------ INVITES THAT WAIT (Group 3)
const subKey = ep => createHash('sha256').update(String(ep)).digest('hex').slice(0, 24);

/** INVITE { pid, room } — a friend into the caller's room: the push (if they turned it on) + the card waiting on their next open */
export async function friendInvite(me, uid, body, now = Date.now()) {
  const to = isPid(body.pid) ? String(body.pid) : null, code = String(body.room || '').toUpperCase();
  if (!to || !/^[A-Z]{4}$/.test(code)) fail(400, 'bad_invite');
  const [A, meta, seat, prof] = await Promise.all([node(me), val(`rooms/${code}/meta`), val(`rooms/${code}/players/${uid}`), publicProfile(me)]);
  if (!meta) throw new ApiError(404, 'no_room', 'That room has closed.');
  // (only from a player IN that room — their seat + not kicked — and only to a FRIEND: a friendship means neither blocked the other)
  if (!seat || (await val(`rooms/${code}/kicked/${uid}`))) throw new ApiError(403, 'not_in_room', 'Join the room first.');
  if (!fresh(A, now).f[to]) fail(403, 'not_friends');
  const last = await val(`pfr/${to}/inv/${me}`);
  if (last && last.r === code && last.ca === meta.createdAt && last.at > now - FR.inviteGapMs) return { ok: true, sent: 0, again: true, until: last.until };
  if (!(await take(`inv_${me}`, FR.invitePerHour, 3600e3, now))) throw new ApiError(429, 'rate', 'That’s a lot of invites — try again later.');
  const until = now + FR.inviteMs;
  await ref(`pfr/${to}/inv/${me}`).set({ r: code, ca: meta.createdAt, at: now, until, n: String((prof && prof.n) || '').slice(0, 16) });
  // THE PUSH (only if they turned it on — an iPhone: the Home Screen app + notifications allowed); a failed push never fails the invite
  let sent = 0;
  try {
    const subs = (await val(`ppriv/${to}/ps`)) || {};
    await Promise.all(Object.entries(subs).map(async ([k, sub]) => {
      const st = await sendPush(sub, { title: `${(prof && prof.n) || 'A friend'} invited you`, body: `JOIN ROOM ${code} · NEON SPEAKEASY`, url: `/?room=${code}&inv=1`, tag: `inv-${code}` }, { ttl: Math.round(FR.inviteMs / 1000) });
      if (st >= 200 && st < 300) sent++;
      else if (st === 404 || st === 410) await ref(`ppriv/${to}/ps/${k}`).remove();
    }));
  } catch (e) { console.info('invite push skipped:', e && e.message); }
  return { ok: true, sent, until };
}

/** the waiting invites on open → { invites: [{ pid, n, room, at, until, card }] } (a closed / reused room or an old one: pruned here) */
export async function inviteCheck(me, now = Date.now()) {
  const inv = (await val(`pfr/${me}/inv`)) || {}, f = (await val(`pfr/${me}/f`)) || {}, out = [], gone = {};
  await Promise.all(Object.entries(inv).map(async ([p, x]) => {
    const meta = x && /^[A-Z]{4}$/.test(String(x.r || '')) ? await val(`rooms/${x.r}/meta`) : null;
    if (!isPid(p) || !f[p] || !inviteLive(x, meta, now)) { gone[`pfr/${me}/inv/${p}`] = null; return; }
    const c = await cardOf(p, x.at);
    if (c) out.push({ pid: p, n: c.n, room: x.r, at: x.at, until: x.until, card: c });
  }));
  if (Object.keys(gone).length) await ref('/').update(gone);
  // (+ the badge's count: one call on open — CITY C: + the newest requester's public name, for the city's one-line note)
  const pin = fresh({ in: await val(`pfr/${me}/in`) }, now).in, newest = Object.entries(pin).sort((a, b) => b[1] - a[1])[0];
  let frName = null;
  if (newest) { const pr = await publicProfile(newest[0]); if (pr) frName = publicName(boardId(newest[0]), pr.n); }
  return { invites: out.sort((a, b) => b.at - a.at), frIn: Object.keys(pin).length, frName, frAt: newest ? newest[1] : null };
}
/** NOT NOW (or JOIN taken) { pid } — the card goes */
export async function inviteDismiss(me, body) {
  if (isPid(body.pid)) await ref(`pfr/${me}/inv/${body.pid}`).remove();
  return { ok: true };
}

/** INVITE NOTIFICATIONS on this phone: { op: 'state' (+ endpoint) · 'sub' { sub } · 'unsub' { endpoint } } — ppriv/{pid}/ps (≤ 4 phones) */
export async function friendPush(me, body, now = Date.now()) {
  const V = vapid(), op = String(body.op || 'state');
  const subs = async () => (await val(`ppriv/${me}/ps`)) || {};
  if (op === 'sub') {
    if (!V) throw new ApiError(503, 'no_vapid', 'Notifications aren’t set up on the server yet.');
    const sub = body.sub || {}, k = sub.keys || {};
    if (!okEndpoint(sub.endpoint) || !/^[A-Za-z0-9_-]{80,100}$/.test(String(k.p256dh || '')) || !/^[A-Za-z0-9_-]{16,30}$/.test(String(k.auth || ''))) throw new ApiError(400, 'bad_sub', 'That phone’s subscription doesn’t look right.');
    const S = await subs(), key = subKey(sub.endpoint);
    if (!S[key] && Object.keys(S).length >= FR.pushSubsMax) {   // (a 5th phone: the oldest makes room)
      const oldest = Object.entries(S).sort((a, b) => (a[1].at || 0) - (b[1].at || 0))[0];
      if (oldest) await ref(`ppriv/${me}/ps/${oldest[0]}`).remove();
    }
    await ref(`ppriv/${me}/ps/${key}`).set({ endpoint: sub.endpoint, keys: { p256dh: k.p256dh, auth: k.auth }, at: now });
  } else if (op === 'unsub') {
    if (body.endpoint) await ref(`ppriv/${me}/ps/${subKey(body.endpoint)}`).remove();
  } else if (op !== 'state') throw new ApiError(400, 'bad_op');
  const S = await subs();
  return { key: V ? V.pub : null, subs: Object.keys(S).length, mine: body.endpoint ? !!S[subKey(body.endpoint)] : (op === 'sub' ? true : null) };
}

/** IN A ROOM WITH YOU (the green dot): which of the room's players are your friends → { pids } — read by the room's phones through
 *  `friends` (state) already; kept for a light check */
export async function friendsInRoom(me, code) {
  if (!/^[A-Z]{4}$/.test(String(code || ''))) return { pids: [] };
  const [f, players, pres] = await Promise.all([val(`pfr/${me}/f`), val(`rooms/${code}/players`), val(`rooms/${code}/presence`)]);
  const F = f || {}, P = players || {}, R = pres || {};
  return { pids: Object.entries(P).filter(([u, p]) => p && F[p.pid] && presenceOnline(R[u])).map(([, p]) => p.pid) };
}
