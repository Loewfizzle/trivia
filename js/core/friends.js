// FRIENDS A — THE FRIENDS CORE (the owner, Nov 7 9:48–10:05 pm — docs/profiles.md "FRIENDS"). PURE: the server (api/_lib/friends.js) runs
// every friend action through friendStep(); the phones only read what the server answers. Nobody is on your list without saying yes.
//
//   pfr/{pid}: {             (server-written; the owner may read their own — database.rules.json; another player never)
//     f:   { pid: at }       friends (both sides: an accept writes both)
//     in:  { pid: at }       requests waiting for YOU
//     out: { pid: at }       YOUR requests waiting for them (a quiet decline / a block leaves it here: the sender never learns)
//     b:   { pid: at }       YOUR blocks (no requests from them, gone from your suggestions; unblock in the list)
//     rp:  { pid: at }       RECENTLY PLAYED WITH — written by the server from VERIFIED matches (api/_lib/stats.js#applyMatch)
//     inv: { pid: { r, ca, at, until, n } }   INVITES THAT WAIT (Group 3): a friend's invite to room r (its createdAt ca)
//   }
// ONLINE STATUS = NONE: nothing here says who is online (the only presence shown is a green dot while a friend is IN A ROOM WITH YOU —
// the room's own players/presence).

export const FR = Object.freeze({
  max: 100,          // friends a profile may have
  outMax: 20,        // requests YOU have waiting
  inMax: 50,         // requests waiting for you (more are refused: "their requests are full")
  blockMax: 200,
  reqPerHour: 30,    // friendAdd calls a profile may make an hour (the server's rate limit — rl/fr_{pid})
  reqPerDay: 80,
  pendingMs: 30 * 864e5,   // an unanswered request goes after 30 days
  recentN: 12,       // RECENTLY PLAYED WITH: the last 12 distinct (not friends, not blocked)
  recentKeep: 40,    // rp entries kept on the server
  tableN: 12,        // YOUR TABLE's read (Group 4): at most 12 friends
  inviteMs: 30 * 60e3,     // a waiting invite: ~30 min (or until its room closes)
  invitePerHour: 20,
  inviteGapMs: 90e3,       // the same friend + the same room: once a 90 s
  pushSubsMax: 4,
});

export const isPidLike = s => /^p[a-z2-9]{11}$/.test(String(s || ''));
const keys = o => Object.keys(o || {});
const n = o => keys(o).length;

/** a node's pending maps with the old requests (> pendingMs) taken out — read side only (the server prunes on the next write) */
export function fresh(node, now) {
  const N = node || {};
  const cut = m => Object.fromEntries(Object.entries(m || {}).filter(([, at]) => typeof at === 'number' && at > now - FR.pendingMs));
  return { f: N.f || {}, in: cut(N.in), out: cut(N.out), b: N.b || {}, rp: N.rp || {}, inv: N.inv || {} };
}

/** what B is to A: 'self' · 'friend' · 'blocked' (A blocked B) · 'in' (B asked A) · 'out' (A asked B) · 'none' */
export function relOf(A, a, b, now = Date.now()) {
  if (a === b) return 'self';
  const X = fresh(A, now);
  if (X.f[b]) return 'friend';
  if (X.b[b]) return 'blocked';
  if (X.in[b]) return 'in';
  if (X.out[b]) return 'out';
  return 'none';
}

export const FR_WHY = Object.freeze({
  self: 'That’s you.',
  blocked: 'You blocked them — unblock them first.',
  your_list_full: `Your friends list is full (${FR.max}) — remove someone first.`,
  their_list_full: 'Their friends list is full.',
  too_many_out: `You have ${FR.outMax} requests waiting — cancel one first.`,
  their_requests_full: 'They have too many requests waiting — try again later.',
  no_request: 'That request is gone.',
  not_friends: 'You’re not friends.',
  blocks_full: `You’ve blocked ${FR.blockMax} players — unblock someone first.`,
  no_profile: 'That player has no card yet — they get one after their first game.',
  rate: 'That’s a lot of requests — try again later.',
});

/**
 * ONE friend action, PURE: (kind, a = the caller's pid, b = the other's, A = pfr/{a}, B = pfr/{b}, now)
 *   → { ok: true, rel, up: { 'a/…' | 'b/…': value | null } } | { ok: false, why }
 * `up`'s paths start with 'a/' or 'b/' (the server maps them to pfr/{a}/ and pfr/{b}/ — one multi-path update).
 * kinds: add · accept · decline · cancel · remove · block · unblock
 */
export function friendStep(kind, a, b, A, B, now = Date.now()) {
  if (!isPidLike(a) || !isPidLike(b)) return { ok: false, why: 'no_profile' };
  if (a === b) return { ok: false, why: 'self' };
  const X = fresh(A, now), Y = fresh(B, now);
  const up = {};
  const befriend = () => {
    if (n(X.f) >= FR.max) return { ok: false, why: 'your_list_full' };
    if (n(Y.f) >= FR.max) return { ok: false, why: 'their_list_full' };
    Object.assign(up, { [`a/f/${b}`]: now, [`b/f/${a}`]: now, [`a/in/${b}`]: null, [`a/out/${b}`]: null, [`b/in/${a}`]: null, [`b/out/${a}`]: null });
    return { ok: true, rel: 'friend', up };
  };
  switch (kind) {
    case 'add': {
      if (X.f[b]) return { ok: true, rel: 'friend', up };
      if (X.b[b]) return { ok: false, why: 'blocked' };
      if (X.in[b]) return befriend();                     // (they asked first: ADD = ACCEPT)
      if (X.out[b]) return { ok: true, rel: 'out', up };  // (already asked: nothing new — never a second request)
      if (n(X.f) >= FR.max) return { ok: false, why: 'your_list_full' };
      if (n(X.out) >= FR.outMax) return { ok: false, why: 'too_many_out' };
      // (they blocked you: it LOOKS sent — only your side is written; they never see it, you never learn)
      if (Y.b[a]) { up[`a/out/${b}`] = now; return { ok: true, rel: 'out', up }; }
      if (n(Y.in) >= FR.inMax) return { ok: false, why: 'their_requests_full' };
      Object.assign(up, { [`a/out/${b}`]: now, [`b/in/${a}`]: now });
      return { ok: true, rel: 'out', up };
    }
    case 'accept':
      if (X.f[b]) return { ok: true, rel: 'friend', up };
      if (!X.in[b]) return { ok: false, why: 'no_request' };
      return befriend();
    // DECLINE is QUIET: the request leaves YOUR list; theirs still says REQUESTED (until they cancel or it ages out) — no re-request spam
    case 'decline': up[`a/in/${b}`] = null; return { ok: true, rel: 'none', up };
    case 'cancel': Object.assign(up, { [`a/out/${b}`]: null, [`b/in/${a}`]: null }); return { ok: true, rel: X.in[b] ? 'in' : 'none', up };
    // REMOVE is QUIET (the other side isn't told) — a friendship is both sides, so both go; their invites to you too
    case 'remove':
      if (!X.f[b]) return { ok: true, rel: relOf(A, a, b, now), up };
      Object.assign(up, { [`a/f/${b}`]: null, [`b/f/${a}`]: null, [`a/inv/${b}`]: null, [`b/inv/${a}`]: null });
      return { ok: true, rel: 'none', up };
    case 'block':
      if (!X.b[b] && n(X.b) >= FR.blockMax) return { ok: false, why: 'blocks_full' };
      // (their request to you leaves your list, yours to them is cancelled; THEIR side keeps a pending 'out' if they had one — quiet)
      Object.assign(up, { [`a/b/${b}`]: X.b[b] || now, [`a/f/${b}`]: null, [`b/f/${a}`]: null, [`a/in/${b}`]: null, [`a/out/${b}`]: null, [`b/in/${a}`]: null,
        [`a/rp/${b}`]: null, [`a/inv/${b}`]: null, [`b/inv/${a}`]: null });
      return { ok: true, rel: 'blocked', up };
    case 'unblock': up[`a/b/${b}`] = null; return { ok: true, rel: 'none', up };
    default: return { ok: false, why: 'bad_action' };
  }
}

/** RECENTLY PLAYED WITH → the suggestion pids, newest first: not friends, not blocked, not you — at most FR.recentN */
export function suggestions(A, a, now = Date.now()) {
  const X = fresh(A, now);
  return Object.entries(X.rp).filter(([p, at]) => p !== a && isPidLike(p) && !X.f[p] && !X.b[p] && typeof at === 'number')
    .sort((x, y) => y[1] - x[1]).slice(0, FR.recentN).map(([p]) => p);
}

/** a verified match's players → each one's rp patch (relative to pfr/): { 'pidA/rp/pidB': now } — the others, and the old ones trimmed */
export function recentPatch(pids, nodes = {}, now = Date.now()) {
  const P = [...new Set((pids || []).filter(isPidLike))], up = {};
  if (P.length < 2) return up;
  for (const p of P) {
    const rp = { ...((nodes[p] && nodes[p].rp) || {}) };
    for (const q of P) if (q !== p) { rp[q] = now; up[`${p}/rp/${q}`] = now; }
    const old = Object.entries(rp).sort((x, y) => y[1] - x[1]).slice(FR.recentKeep);
    for (const [q] of old) up[`${p}/rp/${q}`] = null;
  }
  return up;
}

/** YOUR TABLE (Group 4): which friends a `today` read covers → ≤ FR.tableN pids. A PICKED list (the phone's own choice) is kept to the
 *  ones that ARE friends, in its order; with none picked: the friends you PLAYED WITH most recently first, then the newest friendships. */
export function tablePids(A, a, picked = null, now = Date.now()) {
  const X = fresh(A, now);
  if (Array.isArray(picked) && picked.length) return [...new Set(picked.map(String))].filter(p => p !== a && X.f[p]).slice(0, FR.tableN);
  return keys(X.f).filter(p => p !== a && isPidLike(p))
    .sort((p, q) => ((X.rp[q] || 0) - (X.rp[p] || 0)) || ((X.f[q] || 0) - (X.f[p] || 0)))
    .slice(0, FR.tableN);
}

/** a waiting invite still good? (the room open + the SAME room — its createdAt — + not expired) */
export const inviteLive = (inv, meta, now) => !!(inv && meta && inv.until > now && meta.createdAt === inv.ca);
