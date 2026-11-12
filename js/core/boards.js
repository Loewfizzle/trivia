// The global boards, PURE: shared by the server (what to write), THE BOARD (what to show) and the public /board page.
//
// A board id names what is ranked: records ("slip-dist", "pulse-pulse3-hard") and career counters ("cipher-wins",
// "gridlock-w-salvo"); dashes, never dots, because board ids are database keys. Each board has two periods: 'all' and the current week ("w20261012", core/week.js).
// lb/{board}/{period}/{pid} holds a SORT value where higher is always better; `toSort`/`fromSort` convert.
import { GAMES } from '../config.js';
import { POINT_DAILIES, MIN_DAYS } from './daily-points.js';
export const PERIODS = ['week', 'all'];
export const MIN_WR_GAMES = 10;     // win rate shows only after this many games of that game

const rec = (id, label, fmt, opts = {}) => ({ id, kind: 'record', label, fmt, dir: opts.dir || 1, short: opts.short || label, unit: opts.unit || '' });
const car = (id, label, opts = {}) => ({ id, kind: 'career', label, fmt: opts.fmt || 'int', dir: 1, short: opts.short || label, stat: opts.stat, min: opts.min || 0, ...(opts.tie ? { tie: opts.tie } : {}), ...(opts.note ? { note: opts.note } : {}), ...(opts.week ? { week: opts.week, all: opts.all || label } : {}) });

// per game: records (pure skill) and career (activity + winning). `stat` = the career counter in pstats/g/{game}.
export const GAME_BOARDS = {
  slip: { records: [rec('slip-dist', 'LONGEST RIDE', 'dist', { short: 'DISTANCE' })], career: [] },
  pulse: { records: [], career: [], songs: true },
  prism: { records: [rec('prism-rush', 'SCORE RUSH', 'int', { short: 'BEST SCORE' })], career: [car('prism-ko', 'KNOCKOUTS', { stat: 'ko', short: 'KOs' })] },
  // (SHELL 2.0 B1: the solo lane's own board · OC5: THE QUICK SOLO PERSONAL BEST — the server's own, from the room's record: a solo QUICK run)
  // (THE CARD PASS — B3: the two solo boards' tabs + column said "SOLO BEST" twice → each its own name: QUICK · SOLO / STANDARD · SOLO)
  overclock: { records: [rec('overclock-std', 'STANDARD MATCH', 'int', { short: 'BEST SCORE' }), rec('overclock-std-solo', 'STANDARD · SOLO', 'int'), rec('overclock-quick-solo', 'QUICK · SOLO', 'int')], career: [] },
  cipher: { records: [rec('cipher-score', 'BEST MATCH', 'int', { short: 'BEST SCORE' }), rec('cipher-fast5', 'FASTEST 5-LETTER SOLVE', 'ms', { dir: -1, short: 'FASTEST' })], career: [] },
  golf: { records: [rec('golf-par9', 'BEST 9 HOLES', 'par', { dir: -1, short: 'TO PAR' })], career: [] },
  gridlock: {
    records: [],
    career: [car('gridlock-sunk', 'FLEETS SUNK', { stat: 'sunk' }), car('gridlock-w-classic', 'CLASSIC WINS', { stat: 'w_classic', short: 'CLASSIC' }),
      car('gridlock-w-salvo', 'SALVO WINS', { stat: 'w_salvo', short: 'SALVO' }), car('gridlock-w-royale', 'BATTLE ROYALE WINS', { stat: 'w_royale', short: 'ROYALE' }),
      car('gridlock-w-arcade', 'ARCADE WINS', { stat: 'w_arcade', short: 'ARCADE' })],
  },
  agent: { records: [], career: [car('agent-esc', 'ESCAPES', { stat: 'esc' }), car('agent-spot', 'AGENTS CAUGHT', { stat: 'spot', short: 'CAUGHT' })] },
  signal: { records: [], career: [car('signal-el', 'ELIMINATIONS', { stat: 'el', short: 'ELIMS' })] },
  bluff: { records: [], career: [car('bluff-fool', 'PLAYERS FOOLED', { stat: 'fool', short: 'FOOLED' })] },
  rum: { records: [15, 20, 30].map(n => rec(`rum-f${n}`, `BIGGEST FORTUNE · ${n} DAYS`, 'int', { short: `${n} DAYS` })), career: [] },
  stakes: { records: [rec('stakes-chips', 'BEST FINAL STACK', 'int', { short: 'CHIPS' }), rec('stakes-big', 'BIGGEST SINGLE HAND', 'int', { short: 'WON' })], career: [] },
  // HOLD'EM IN THE CITY (the owner, Nov 11): THE HOLD'EM BOARD = TOURNAMENT WINS (this week / all time), KNOCKOUTS the tie-break, then whoever
  // reached it first — ONE sort value (tieSort). CASH never counts (no winner); only a COUNTED match (the dealer's COUNTS: 3+ hands) — the
  // numbers ONLY from the dealer's own record (api/_lib/holdem-dealer.js#resultRows → match-report.js#holdemCounters). `tab`: what its tab shows.
  holdem: { records: [], career: [car('holdem-tw', 'TOURNAMENT WINS', { stat: 'tw', tie: 'ko', fmt: 'twko', short: 'TOURNAMENT WINS', note: 'TOURNAMENTS ONLY (NOT CASH) · KOs BREAK A TIE' })], tab: ['holdem-tw'] },
};
export const BOARD_GAMES = Object.keys(GAME_BOARDS);
// BOARD 2.0 A — THE OVERALL BOARDS (not under any game): `xp` = THE OVERALL BOARD — THIS WEEK = the XP earned since Monday 00:00 ET (pstats.xw),
// ALL TIME = the total XP (the level order). Server-written like every board (lb/xp/{period}/{pid} — api/_lib/lb.js#overallPaths).
const ovr = (id, label, o = {}) => ({ id, kind: 'overall', label, fmt: o.fmt || 'int', dir: 1, short: o.short || label, week: o.week || label, all: o.all || label, game: null, ...o });
// `daily` + `daily-<game>` — THE DAILIES' BOARDS (DAILY POINTS — core/daily-points.js): THIS WEEK = the week's points summed, ALL TIME = the
// average per day (ranked from MIN_DAYS days played; its sort value = the average × 100 — `allFmt: 'avg'`); a board per daily on the points table
export const OVERALL_BOARDS = Object.freeze({
  xp: ovr('xp', 'XP', { week: 'XP THIS WEEK', all: 'TOTAL XP' }),
  daily: ovr('daily', 'DAILY POINTS', { week: 'POINTS THIS WEEK', all: 'AVERAGE A DAY', points: true, of: null, allFmt: 'avg', minDays: MIN_DAYS }),
  ...Object.fromEntries(POINT_DAILIES.map(g => [`daily-${g}`, ovr(`daily-${g}`, 'DAILY POINTS', { week: 'POINTS THIS WEEK', all: 'AVERAGE A DAY', points: true, of: g, allFmt: 'avg', minDays: MIN_DAYS })])),
});
export const OVERALL_IDS = Object.keys(OVERALL_BOARDS);
/** the games a weekly goal may name: the board games a player can START today (config.js GAMES[].playable — the one switch) */
export const GOAL_GAMES = BOARD_GAMES.filter(id => (GAMES.find(g => g.id === id) || {}).playable !== false);
export const PULSE_DIFFS = ['easy', 'normal', 'hard'];

/** Every game also has WINS and WIN RATE (first), then its own highlights. */
export function careerBoards(game) {
  return [car(`${game}-wins`, 'WINS', { stat: 'w' }), car(`${game}-wr`, 'WIN RATE', { fmt: 'pct', stat: 'wr', min: MIN_WR_GAMES, short: 'WIN %' }),
    ...((GAME_BOARDS[game] && GAME_BOARDS[game].career) || [])];
}

/** songs: [{ id, title }] (PULSE manifest) — each song × difficulty is its own board. */
export function recordBoards(game, songs = []) {
  if (game === 'pulse') {
    return songs.flatMap(s => PULSE_DIFFS.map(d => ({ ...rec(`pulse-${s.id}-${d}`, `${(s.title || s.id).toUpperCase()}`, 'int', { short: 'BEST SCORE' }), song: s.id, diff: d })));
  }
  return (GAME_BOARDS[game] && GAME_BOARDS[game].records) || [];
}

/** The boards a game's tab on THE BOARD shows (null = its records + career, the RECORDS / CAREER switch) — HOLD'EM: its one board */
export const tabBoards = game => (GAME_BOARDS[game] && GAME_BOARDS[game].tab ? GAME_BOARDS[game].tab.map(boardDef) : null);

/** The board shown first for a game (title preview cards): its tab's board, else its first record, else WINS. */
export function primaryBoard(game, songs = []) {
  const tab = tabBoards(game);
  if (tab && tab[0]) return tab[0];
  const recs = recordBoards(game, songs);
  return recs.find(b => b.diff === 'normal') || recs[0] || careerBoards(game)[0];
}

const PULSE_RE = /^pulse-(pulse\d{1,3})-(easy|normal|hard)$/;
/** The board definition for an id (null for an unknown id). */
export function boardDef(id) {
  id = String(id || '');
  if (Object.prototype.hasOwnProperty.call(OVERALL_BOARDS, id)) return { ...OVERALL_BOARDS[id] };
  const m = PULSE_RE.exec(id);
  if (m) return { ...rec(id, `TRACK ${m[1].replace(/\D/g, '').padStart(2, '0')}`, 'int', { short: 'BEST SCORE' }), game: 'pulse', song: m[1], diff: m[2] };
  const game = id.split('-')[0];
  if (!GAME_BOARDS[game]) return null;
  const all = [...recordBoards(game), ...careerBoards(game)];
  const d = all.find(b => b.id === id);
  return d ? { ...d, game } : null;
}

// THE TIE-BREAK SORT (HOLD'EM IN THE CITY): a career board with a `tie` stat ranks by its count, then the tie stat, then the EARLIER to reach
// it — packed into ONE sort value (lb/{board}/{period}/{pid} orders by value): count × 1e10 + min(tie, 999) × 1e7 + (1e7 − 1 − when), where
// `when` = seconds since the week began (THIS WEEK — under 604 800) or minutes since TIE_EPOCH (ALL TIME — ~19 years of room). Safe to 9e15.
export const TIE_EPOCH = Date.UTC(2026, 0, 1);
const TIE_W = 1e10, TIE_K = 1e7;
export function tieSort(n, tie, at, { weekStart = null } = {}) {
  if (!(n > 0)) return null;
  const t = Number(at) || 0, when = weekStart != null ? Math.floor(Math.max(0, t - weekStart) / 1000) : Math.floor(Math.max(0, t - TIE_EPOCH) / 60000);
  return Math.floor(n) * TIE_W + Math.min(999, Math.max(0, Math.floor(tie || 0))) * TIE_K + (TIE_K - 1 - Math.min(TIE_K - 1, when));
}
/** a tie-break sort value → { n, tie } (what the row shows) */
export const tieOf = v => ({ n: Math.floor(v / TIE_W), tie: Math.floor((v % TIE_W) / TIE_K) });
/** a CAREER board's sort value from a player's counters for one period (s = pstats g/{game} or gw/{game}; null = off the board) — the server's
 *  writer (api/_lib/lb.js#boardPaths) and the unit tests both read it. `weekStart` = THIS WEEK's start (a tie-break board's WHEN). */
export function careerValue(def, s, { weekStart = null } = {}) {
  if (!s) return null;
  if (def.stat === 'wr') return (s.p || 0) >= MIN_WR_GAMES ? winRate(s.w || 0, s.p) : null;
  const n = s[def.stat] || 0;
  if (def.tie) return n > 0 ? tieSort(n, s[def.tie] || 0, s.ra || 0, { weekStart }) : null;   // (HOLD'EM IN THE CITY: count, tie stat, the earlier)
  return n > 0 ? n : null;
}
export const toSort = (def, value) => (def.dir === -1 ? -value : value);
export const fromSort = (def, v) => (def.dir === -1 ? -v : v);
/** Is `a` (display value) better than `b`? (b null = always) */
export const better = (def, a, b) => b == null || (def.dir === -1 ? a < b : a > b);

const num = n => Math.round(n).toLocaleString('en-US');
/** Display text for a board value. */
export function fmtValue(def, v) {
  if (v == null || !Number.isFinite(v)) return '—';
  switch (def.fmt) {
    case 'dist': return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 1 : 2)} km` : `${Math.round(v)} m`;
    case 'ms': return `${(v / 1000).toFixed(v < 10000 ? 2 : 1)} s`;
    case 'par': return v === 0 ? 'E' : v > 0 ? `+${v}` : `−${Math.abs(v)}`;
    case 'pct': return `${(v / 100).toFixed(1)}%`;
    case 'avg': return (v / 100).toFixed(1);   // (BOARD 2.0 A: a points board's ALL TIME — the average a day, stored × 100)
    case 'twko': { const { n, tie } = tieOf(v); return `${num(n)} ${n === 1 ? 'WIN' : 'WINS'} · ${num(tie)} ${tie === 1 ? 'KO' : 'KOs'}`; }   // (HOLD'EM's board)
    default: return num(v);
  }
}

/** win rate as stored (basis points: 6250 = 62.50 %) */
export const winRate = (w, p) => (p > 0 ? Math.round((w / p) * 10000) : 0);
