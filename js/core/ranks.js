// SPEAKEASY RANKS + XP, PURE. The server awards XP (api/_lib/stats.js); the client only displays it.
// Tuning: a match is worth ≈ 45–110 XP, an evening (6–10 matches) ≈ 400–700. REGULAR lands in the first evening,
// INSIDER after a few nights, MADE after a couple of months of weekly play, LEGEND takes months of regular play.
export const RANKS = [
  { id: 'newcomer', name: 'NEWCOMER', xp: 0, line: 'Just walked in' },
  { id: 'regular', name: 'REGULAR', xp: 250, line: 'The bartender knows your drink' },
  { id: 'insider', name: 'INSIDER', xp: 2000, line: 'You know the back rooms' },
  { id: 'made', name: 'MADE', xp: 7500, line: 'Your name opens doors' },
  { id: 'legend', name: 'LEGEND', xp: 25000, line: 'They tell stories about you' },
];

export function rankIndex(xp) {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if ((xp || 0) >= RANKS[k].xp) i = k;
  return i;
}

/** { i, rank, next, into, need, frac } — XP progress toward the next rank (frac 1 at LEGEND). */
export function progress(xp) {
  xp = Math.max(0, Math.floor(xp || 0));
  const i = rankIndex(xp);
  const rank = RANKS[i];
  const next = RANKS[i + 1] || null;
  if (!next) return { i, rank, next, into: xp - rank.xp, need: 0, frac: 1 };
  const span = next.xp - rank.xp;
  return { i, rank, next, into: xp - rank.xp, need: next.xp - xp, frac: Math.min(1, (xp - rank.xp) / span) };
}

export const XP = { played: 30, win: 40, winPerExtra: 6, second: 20, secondPerExtra: 3, third: 10, pb: 20, pbMax: 3, newGame: 25, variety: 10 };

/**
 * XP for one match. { rank, win, n (players), pbs (count), firstToday (first match of this game today), gamesToday
 * (distinct games played today, including this one) } → { total, parts: [{ k, label, v }] }.
 */
export function matchXp({ rank, win, n, pbs = 0, firstToday = false, gamesToday = 1 }) {
  const parts = [{ k: 'played', label: 'MATCH PLAYED', v: XP.played }];
  if (win) parts.push({ k: 'win', label: 'VICTORY', v: XP.win + XP.winPerExtra * Math.max(0, n - 2) });
  else if (rank === 2 && n >= 3) parts.push({ k: 'place', label: '2ND PLACE', v: XP.second + XP.secondPerExtra * Math.max(0, n - 3) });
  else if (rank === 3 && n >= 4) parts.push({ k: 'place', label: '3RD PLACE', v: XP.third });
  const p = Math.min(XP.pbMax, pbs);
  if (p) parts.push({ k: 'pb', label: p > 1 ? `${p} PERSONAL BESTS` : 'PERSONAL BEST', v: XP.pb * p });
  if (firstToday) parts.push({ k: 'new', label: 'NEW GAME TONIGHT', v: XP.newGame });
  if (firstToday && gamesToday >= 3) parts.push({ k: 'variety', label: 'VARIETY', v: XP.variety });
  return { total: parts.reduce((s, x) => s + x.v, 0), parts };
}
