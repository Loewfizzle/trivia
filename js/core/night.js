// PURE: game-night standings from rooms/{code}/night/{matchId} = { g, p: { uid: points }, n: { uid: name }, b?: { uid: bonus } }.
// b = bonus points that aren't a placing (PRISM DROP's Call the Winner): they add to the total but never count as a win.
export function nightStandings(night, players = {}) {
  const t = {};
  for (const entry of Object.values(night || {})) {
    if (!entry || !entry.p) continue;
    for (const [uid, pts] of Object.entries(entry.p)) {
      const row = t[uid] || (t[uid] = { uid, points: 0, wins: 0, games: 0, name: 'GHOST' });
      row.points += pts || 0;
      row.games += 1;
      if (pts >= 3) row.wins += 1;
      if (entry.n && entry.n[uid]) row.name = entry.n[uid];
    }
    for (const [uid, pts] of Object.entries(entry.b || {})) {
      const row = t[uid] || (t[uid] = { uid, points: 0, wins: 0, games: 0, name: (entry.n && entry.n[uid]) || 'GHOST' });
      row.points = Math.round((row.points + (pts || 0)) * 10) / 10;
    }
  }
  const rows = Object.values(t).sort((a, b) => b.points - a.points || b.wins - a.wins || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { const sig = `${r.points}|${r.wins}`; if (sig !== prev) { rank = i + 1; prev = sig; } r.rank = rank; if (players[r.uid]) r.name = players[r.uid].name; });
  // a crown only for a clear (untied) leader with points
  const leaders = rows.filter(r => r.rank === 1 && r.points > 0);
  if (leaders.length === 1) leaders[0].leader = true;
  return rows;
}

/**
 * HOLD'EM IN THE CITY — B4 (HE9's Fable review: everyone tied → the podium + game night ranked all 1st while the server credits no win):
 * a FULL TIE = 2+ players, every one ranked 1st. ONE rule for every game: the podium says ALL TIED (nobody 1st — no winner sting, no
 * banner plane), and on the game-night table it is a DRAW — everyone takes 2nd-place points, nobody 1st's (so nobody a night "win"); the
 * server credits every one rank 1, no win (api/report.js#placingsOnly reads such an entry back the same). A PARTIAL tie (two share 1st,
 * others below) stays as it was: both 1st, 3 points each, both a win.
 */
export const NIGHT_POINTS = Object.freeze({ 1: 3, 2: 2, 3: 1 });
export const isAllTied = rows => Array.isArray(rows) && rows.length >= 2 && rows.every(r => r && r.rank === 1);
/** ranks [{ uid, rank }] → { uid: night points } (a solo run: 0 — THE SOLO LANE; a full tie: everyone 2nd-place points) */
export function nightPoints(ranks, { solo = false } = {}) {
  const tie = isAllTied(ranks), p = {};
  for (const r of ranks || []) p[r.uid] = solo ? 0 : tie ? NIGHT_POINTS[2] : NIGHT_POINTS[r.rank] || 0;
  return p;
}
