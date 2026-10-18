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


// ================================================================ progression (Oct 2026): tiers, nightly streak, weekly goal, mastery
// TIERS: each rank below LEGEND splits into three equal steps (INSIDER I → II → III), so a step comes every evening or
// two instead of a rank every few weeks. The rank index (profiles.r, the emblems) is unchanged.
const ROMAN = ['I', 'II', 'III'];
export const TIERS = 3;
/** { i, tier (0..2, null at LEGEND), name ('INSIDER II'), from, to (xp of this step / the next), need, frac, nextName } */
export function step(xp) {
  xp = Math.max(0, Math.floor(xp || 0));
  const i = rankIndex(xp);
  const rank = RANKS[i], next = RANKS[i + 1];
  if (!next) return { i, tier: null, name: rank.name, from: rank.xp, to: null, need: 0, frac: 1, nextName: null };
  const span = (next.xp - rank.xp) / TIERS;
  const tier = Math.min(TIERS - 1, Math.floor((xp - rank.xp) / span));
  const from = Math.round(rank.xp + span * tier), to = tier === TIERS - 1 ? next.xp : Math.round(rank.xp + span * (tier + 1));
  const nextName = tier === TIERS - 1 ? (RANKS[i + 1].xp >= RANKS[RANKS.length - 1].xp ? RANKS[i + 1].name : `${RANKS[i + 1].name} I`) : `${rank.name} ${ROMAN[tier + 1]}`;
  return { i, tier, name: `${rank.name} ${ROMAN[tier]}`, from, to, need: to - xp, frac: Math.min(1, (xp - from) / (to - from)), nextName };
}
/** A step index across the whole ladder (rank × 3 + tier), to tell when a player went up a step. */
export const stepIndex = xp => { const s = step(xp); return s.tier == null ? s.i * TIERS : s.i * TIERS + s.tier; };

// STREAK: consecutive nights (Eastern days) with at least one counted match. From the second night every match
// earns +10 % per extra night, up to +40 % (five nights and on). Days are dayKey()s ('d20261018').
export const STREAK = { per: 0.1, max: 0.4 };
export function streakAfter(prev, dk, yesterday) {
  if (prev && prev.d === dk) return { n: prev.n || 1, d: dk };
  if (prev && prev.d === yesterday) return { n: (prev.n || 0) + 1, d: dk };
  return { n: 1, d: dk };
}
export const streakPct = n => Math.min(STREAK.max, Math.max(0, (n || 1) - 1) * STREAK.per);
/** The streak's share of a match (on top of matchXp's total). */
export function streakPart(base, n) {
  const pct = streakPct(n);
  if (!pct) return null;
  return { k: 'streak', label: `${n}-NIGHT STREAK`, v: Math.round(base * pct) };
}

// WEEKLY GOAL: one small challenge a week (Monday to Monday, Eastern), the same for everyone, worth GOAL_XP once.
// gw = pstats.gw (this week's counters per game: { game: { p, w, … } }).
export const GOAL_XP = 200;
const GOAL_KINDS = ['play', 'win', 'variety', 'game'];
function hash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
/** games: the ids that can be the featured game (core/boards.js#BOARD_GAMES). */
export function weeklyGoal(wk, games) {
  const h = hash(String(wk));
  const kind = GOAL_KINDS[h % GOAL_KINDS.length];
  const game = games && games.length ? games[(h >>> 8) % games.length] : null;
  if (kind === 'play') return { kind, n: 8, text: 'Play 8 matches' };
  if (kind === 'win') return { kind, n: 3, text: 'Win 3 matches' };
  if (kind === 'variety') return { kind, n: 5, text: 'Play 5 different games' };
  return { kind: 'game', game, n: 4, text: 'Play 4 matches of the featured game' };
}
export function goalProgress(goal, gw) {
  const g = gw || {};
  const sum = k => Object.values(g).reduce((a, x) => a + ((x && x[k]) || 0), 0);
  let have = 0;
  if (goal.kind === 'play') have = sum('p');
  else if (goal.kind === 'win') have = sum('w');
  else if (goal.kind === 'variety') have = Object.values(g).filter(x => x && x.p > 0).length;
  else have = (g[goal.game] && g[goal.game].p) || 0;
  return { have: Math.min(goal.n, have), n: goal.n, done: have >= goal.n };
}

// MASTERY: a level per game from its career counters (a match is a point, a win two more). Shown on the card.
export const MASTERY = [0, 3, 8, 15, 25, 40, 60, 85, 120, 160];
export function mastery(g) {
  const pts = ((g && g.p) || 0) + 2 * ((g && g.w) || 0);
  let lvl = 0;
  for (let k = 0; k < MASTERY.length; k++) if (pts >= MASTERY[k]) lvl = k + 1;
  const max = lvl >= MASTERY.length;
  const from = MASTERY[lvl - 1], to = max ? from : MASTERY[lvl];
  return { lvl: pts > 0 ? lvl : 0, pts, max, frac: max ? 1 : (pts - from) / (to - from), need: max ? 0 : to - pts };
}


// THE VAULT: unlockables earned by rank step (stepIndex: NEWCOMER I = 0 … LEGEND = 12). A card finish and a name glow
// are worn at a time (profiles/{pid}/f and /g, set through /api/profile 'style', checked against the XP); none chosen
// = the newest unlocked finish and no glow.
export const FINISHES = [
  { id: 'midnight', name: 'MIDNIGHT', at: 0, line: 'Ink and starlight. Every member starts here.' },
  { id: 'brass', name: 'BRASS DECO', at: 3, line: 'Warm brass, engraved like the bar rail.' },
  { id: 'chrome', name: 'SILVER CHROME', at: 6, line: 'Mirror chrome with a prism on the edge.' },
  { id: 'aurora', name: 'AURORA', at: 8, line: 'Northern lights, slowly moving under glass.' },
  { id: 'gold', name: 'GOLD FOIL', at: 9, line: 'Real foil, a deco sunburst pressed in.' },
  { id: 'noir', name: 'VELVET NOIR', at: 11, line: 'Black velvet, a crimson neon edge.' },
  { id: 'legend', name: 'PRISM LEGEND', at: 12, line: 'The whole spectrum, alive in the foil.' },
];
export const GLOWS = [
  { id: 'none', name: 'PLAIN', at: 0, line: 'Just your name.' },
  { id: 'ember', name: 'EMBER', at: 2, line: 'A warm glow, like a cigar in the dark.' },
  { id: 'ice', name: 'ICE', at: 5, line: 'Cold blue light, the back room at 3 a.m.' },
  { id: 'neon', name: 'NEON', at: 7, line: 'Pink and cyan tubes, buzzing.' },
  { id: 'gold', name: 'GOLD', at: 10, line: 'Your name in gold leaf.' },
  { id: 'prism', name: 'PRISM', at: 12, line: 'Every colour, moving through your name.' },
];
export const stepNameAt = k => { const i = Math.floor(k / TIERS); return i >= RANKS.length - 1 ? RANKS[RANKS.length - 1].name : `${RANKS[i].name} ${ROMAN[k % TIERS]}`; };
export const isUnlocked = (item, xp) => stepIndex(xp) >= item.at;
/** What a player wears: their choice if unlocked, else the newest finish they have and no glow. */
export function worn(xp, f, g) {
  const fin = FINISHES.find(x => x.id === f && isUnlocked(x, xp)) || FINISHES.filter(x => isUnlocked(x, xp)).pop();
  const glow = GLOWS.find(x => x.id === g && isUnlocked(x, xp)) || GLOWS[0];
  return { f: fin.id, g: glow.id };
}
/** The unlocks crossed between two XP totals (for the podium: UNLOCKED · GOLD FOIL). */
export function unlockedBetween(from, to) {
  const a = stepIndex(from), b = stepIndex(to);
  return [...FINISHES.map(x => ({ ...x, kind: 'finish' })), ...GLOWS.map(x => ({ ...x, kind: 'glow' }))].filter(x => x.at > a && x.at <= b);
}
