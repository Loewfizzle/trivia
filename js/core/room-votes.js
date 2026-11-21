// GAME VOTES IN A ROOM (CITY PART 2 — the owner's idea Nov 18, "MOST WANTED" approved Nov 19; docs/data-model.md rooms/{CODE}/gv): PURE.
// A GUEST votes for the next game from the room's GAMES sheet — one vote each (another game moves it, the same game takes it back); votes are
// SUGGESTIONS only: the host still picks, never an auto-start. rooms/{CODE}/gv/{uid} = { g: gameId, at: the server's time } (written by that
// player only, in the lobby; the time breaks a tie — the EARLIEST vote leads); the host clears them all at a start (host.js#startGame). The host
// never votes; a vote from a player no longer in the room never counts; a game not playable never counts.
export const GV_RE = /^[a-z]{2,12}$/;

/** a vote node → { g, at } | null (a bare id — an older shape — counts at time 0) */
export function cleanVote(v) {
  if (typeof v === 'string') return GV_RE.test(v) ? { g: v, at: 0 } : null;
  if (!v || typeof v !== 'object' || !GV_RE.test(String(v.g || ''))) return null;
  return { g: String(v.g), at: Number.isFinite(Number(v.at)) ? Number(v.at) : 0 };
}

/** the tally: rows = [{ g, n, first, voters: [uid…] (earliest first) }] — most votes first, a tie = the earliest vote; top = rows[0] | null */
export function tallyVotes(gv, players, hostId, ids) {
  const P = players || {}, ok = new Set(ids || []), per = new Map();
  for (const [u, raw] of Object.entries(gv || {})) {
    if (u === hostId || !P[u]) continue;
    const v = cleanVote(raw);
    if (!v || !ok.has(v.g)) continue;
    if (!per.has(v.g)) per.set(v.g, []);
    per.get(v.g).push({ uid: u, at: v.at });
  }
  const rows = [...per].map(([g, vs]) => { vs.sort((a, b) => a.at - b.at || (a.uid < b.uid ? -1 : 1)); return { g, n: vs.length, first: vs[0].at, last: vs[vs.length - 1].at, voters: vs.map(v => v.uid) }; });
  rows.sort((a, b) => b.n - a.n || a.first - b.first || (a.g < b.g ? -1 : 1));
  return { rows, top: rows[0] || null, n: rows.reduce((s, r) => s + r.n, 0), by: Object.fromEntries(rows.map(r => [r.g, r])) };
}

/** the games list with votes on top (most, then the earliest), the rest in their own order */
export function voteOrder(games, T) {
  const v = T.rows.map(r => r.g);
  return [...games.filter(g => v.includes(g.id)).sort((a, b) => v.indexOf(a.id) - v.indexOf(b.id)), ...games.filter(g => !v.includes(g.id))];
}

/** what a guest's tap writes: the game they already voted for = take it back (null), else this game */
export const nextVote = (mine, id) => (mine === id ? null : id);

/** my own vote's game | null */
export const myVote = (gv, uid) => { const v = cleanVote(gv && gv[uid]); return v ? v.g : null; };

/** the dock's GAMES count for the host: the counted votes cast after the host last looked at the games (seenAt, the server's ms) */
export function newVotes(gv, players, hostId, ids, seenAt = 0) {
  let n = 0;
  for (const r of tallyVotes(gv, players, hostId, ids).rows) for (const u of r.voters) { const v = cleanVote(gv[u]); if (v && v.at > seenAt) n++; }
  return n;
}

/** the MOST WANTED line: "MOST WANTED · PRISM DROP (2)" | '' (no votes) */
export const mostWantedLine = (T, nameOf) => (T && T.top ? `MOST WANTED · ${String(nameOf(T.top.g) || T.top.g).toUpperCase()} (${T.top.n})` : '');
