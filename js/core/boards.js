// The global boards, PURE: shared by the server (what to write), THE BOARD (what to show) and the public /board page.
//
// A board id names what is ranked: records ("slip-dist", "pulse-pulse3-hard") and career counters ("cipher-wins",
// "gridlock-w-salvo"); dashes, never dots, because board ids are database keys. Each board has two periods: 'all' and the current week ("w20261012", core/week.js).
// lb/{board}/{period}/{pid} holds a SORT value where higher is always better; `toSort`/`fromSort` convert.
export const PERIODS = ['week', 'all'];
export const MIN_WR_GAMES = 10;     // win rate shows only after this many games of that game

const rec = (id, label, fmt, opts = {}) => ({ id, kind: 'record', label, fmt, dir: opts.dir || 1, short: opts.short || label, unit: opts.unit || '' });
const car = (id, label, opts = {}) => ({ id, kind: 'career', label, fmt: opts.fmt || 'int', dir: 1, short: opts.short || label, stat: opts.stat, min: opts.min || 0 });

// per game: records (pure skill) and career (activity + winning). `stat` = the career counter in pstats/g/{game}.
export const GAME_BOARDS = {
  slip: { records: [rec('slip-dist', 'LONGEST RIDE', 'dist', { short: 'DISTANCE' })], career: [] },
  pulse: { records: [], career: [], songs: true },
  prism: { records: [rec('prism-rush', 'SCORE RUSH', 'int', { short: 'BEST SCORE' })], career: [car('prism-ko', 'KNOCKOUTS', { stat: 'ko', short: 'KOs' })] },
  overclock: { records: [rec('overclock-std', 'STANDARD MATCH', 'int', { short: 'BEST SCORE' })], career: [] },
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
};
export const BOARD_GAMES = Object.keys(GAME_BOARDS);
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

/** The board shown first for a game (title preview cards): its first record, else WINS. */
export function primaryBoard(game, songs = []) {
  const recs = recordBoards(game, songs);
  return recs.find(b => b.diff === 'normal') || recs[0] || careerBoards(game)[0];
}

const PULSE_RE = /^pulse-(pulse\d{1,3})-(easy|normal|hard)$/;
/** The board definition for an id (null for an unknown id). */
export function boardDef(id) {
  id = String(id || '');
  const m = PULSE_RE.exec(id);
  if (m) return { ...rec(id, `TRACK ${m[1].replace(/\D/g, '').padStart(2, '0')}`, 'int', { short: 'BEST SCORE' }), game: 'pulse', song: m[1], diff: m[2] };
  const game = id.split('-')[0];
  if (!GAME_BOARDS[game]) return null;
  const all = [...recordBoards(game), ...careerBoards(game)];
  const d = all.find(b => b.id === id);
  return d ? { ...d, game } : null;
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
    default: return num(v);
  }
}

/** win rate as stored (basis points: 6250 = 62.50 %) */
export const winRate = (w, p) => (p > 0 ? Math.round((w / p) * 10000) : 0);
