// PURE: game-night standings from rooms/{code}/night/{matchId} = { g, p: { uid: points }, n: { uid: name } }.
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
  }
  const rows = Object.values(t).sort((a, b) => b.points - a.points || b.wins - a.wins || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { const sig = `${r.points}|${r.wins}`; if (sig !== prev) { rank = i + 1; prev = sig; } r.rank = rank; if (players[r.uid]) r.name = players[r.uid].name; });
  // a crown only for a clear (untied) leader with points
  const leaders = rows.filter(r => r.rank === 1 && r.points > 0);
  if (leaders.length === 1) leaders[0].leader = true;
  return rows;
}
