// FRIENDS A — THE FRIENDS CORE on the server (docs/profiles.md "FRIENDS"). Every friend action is an action on POST /api/profile (no new
// function — Vercel Hobby's 12): the caller's own profile from their ID token, the other's checked to exist, the PURE step
// (js/core/friends.js#friendStep) decides, ONE multi-path update writes both sides. pfr/{pid} is server-written only; its owner may read it
// (database.rules.json), another player never — the phones get their own list from here.
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { take } from './limit.js';
import { isPid, publicProfile } from './profiles.js';
import { boardId, topRows } from './lb.js';
import { boardDef } from '../../js/core/boards.js';
import { FR, FR_WHY, friendStep, relOf, fresh, suggestions, recentPatch, inviteLive } from '../../js/core/friends.js';
import { sendPush, okEndpoint, vapid } from './push.js';
import { presenceOnline } from '../../js/core/room-logic.js';
import { weekXp } from '../../js/core/progress.js';
import { createHash } from 'node:crypto';

const node = async pid => (await val(`pfr/${pid}`)) || {};
const fail = (status, why) => { throw new ApiError(status, why, FR_WHY[why] || why); };

/** a player as THEIR FRIENDS see them: the card's public face (+ bid, so THE BOARD's rows can show FRIENDS / REQUESTED) */
export async function cardOf(pid, at = 0) {
  const p = await publicProfile(pid);
  if (!p) return null;
  // (DFIX2 — SLIM CARDS ON SCORES: + the XP + the member Nº, so a friend's strip is drawn exactly like a room player's — ui/strip-board.js)
  return { pid, bid: boardId(pid), n: p.n, t: p.t, a: p.a, c: p.c, l: p.l, x: p.x, mn: p.mn, cd: p.cd, g: p.g, tb: p.tb, es: p.es, at };
}
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
  const [friends0, inn, out, blocked, recent] = await Promise.all([cards(X.f), cards(X.in), cards(X.out), cards(X.b), cards(X.rp, sug)]);
  // (BOARD 2.0 B — THE FRIENDS LIST as slim cards, by THIS WEEK's XP: each FRIEND's week counter (pstats/{pid}/xw — the OVERALL board's own number), the
  //  friends only — never a request, a block or a suggestion; the existing read, no new function)
  const friends = await Promise.all(friends0.map(async c => ({ ...c, wx: weekXp({ xw: await val(`pstats/${c.pid}/xw`) }, now) })));
  return { friends, in: inn, out, blocked, recent: recent.map(c => ({ ...c, rel: relOf(A, pid, c.pid, now) })), caps: { max: FR.max, outMax: FR.outMax } };
}

/** the pending-requests count (the badge on the profile button — `me` carries it) */
export const pendingIn = async (pid, now = Date.now()) => Object.keys(fresh({ in: await val(`pfr/${pid}/in`) }, now).in).length;

/** a board row's id (+ its board) → the pid behind it (this week's or the all-time top 100 — the row on screen) */
async function pidOfRow(b, bid, now) {
  if (!boardDef(String(b || '')) || !/^[0-9a-f]{16}$/.test(String(bid || ''))) return null;
  for (const p of ['week', 'all']) {
    const data = await topRows(String(b), p, now);
    const row = data && data.rows.find(r => r.id === bid);
    if (row) return row.pid;
  }
  return null;
}

const KINDS = { friendAdd: 'add', friendAccept: 'accept', friendDecline: 'decline', friendCancel: 'cancel', friendRemove: 'remove', friendBlock: 'block', friendUnblock: 'unblock' };

/** one action { action, pid? | (b + bid) } → { ok, rel, pid, state } */
export async function friendDo(me, body, now = Date.now()) {
  const kind = KINDS[body.action];
  if (!kind) fail(400, 'bad_action');
  let other = isPid(body.pid) ? String(body.pid) : null;
  if (!other && body.bid) other = await pidOfRow(body.b, body.bid, now);
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
  return { ok: true, rel: r.rel, pid: other, state: await friendsState(me, now) };
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
  return { invites: out.sort((a, b) => b.at - a.at), frIn: await pendingIn(me, now) };   // (+ the badge's count: one call on open)
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
