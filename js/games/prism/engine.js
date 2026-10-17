// PRISM DROP — the falling-block engine (PURE, deterministic; no DOM, no clock).
//
// Board: 10 columns × 40 rows (20 visible + 20 buffer), row 0 at the bottom. Cells: 0 empty, 1–7 piece types,
// 8 junk. Pieces use the standard modern rotation system (four states, wall kicks; the I piece has its own kick
// table) and a 7-bag randomizer seeded per match, so every player is dealt the identical sequence.
// Time only enters through update(ms); the engine steps gravity / lock delay on a fixed 1/120 s tick, so play
// is identical at any frame rate. Every action returns true if it did something; events for the view/audio
// collect in `game.events` (drain with takeEvents()).
import { rngFrom } from '../../core/rng.js';

export const W = 10;
export const H = 40;
export const VISIBLE = 20;
export const TICK = 1000 / 120;
export const LOCK_MS = 500;
export const MAX_RESETS = 15;
export const NEXT = 5;
export const JUNK = 8;

// piece ids (1-based in cells): the names stay internal — the UI calls them "prisms"
export const PIECES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const TWIST = 3; // the T-shaped piece (the one that "twists")
// spawn shapes in a y-down box (the usual way they're drawn), converted to y-up below
const SHAPES_DOWN = {
  I: { n: 4, c: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { n: 2, c: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { n: 3, c: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { n: 3, c: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { n: 3, c: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { n: 3, c: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { n: 3, c: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};
// SHAPES[type][rot] = [[x, y]…] in a y-up box; rot 0 spawn, 1 clockwise (R), 2, 3 (L)
export const SHAPES = {};
export const BOX = {};
PIECES.forEach((name, i) => {
  const { n, c } = SHAPES_DOWN[name];
  const up = c.map(([x, y]) => [x, n - 1 - y]);
  const rots = [up];
  for (let r = 1; r < 4; r++) rots.push(name === 'O' ? up : rots[r - 1].map(([x, y]) => [y, n - 1 - x]));
  SHAPES[i + 1] = rots;
  BOX[i + 1] = n;
});

// wall kicks (x, y-up) per transition "from>to"
const K = (s) => s.split(' ').map(p => p.split(',').map(Number));
const KICKS = {
  '0>1': K('0,0 -1,0 -1,1 0,-2 -1,-2'), '1>0': K('0,0 1,0 1,-1 0,2 1,2'),
  '1>2': K('0,0 1,0 1,-1 0,2 1,2'), '2>1': K('0,0 -1,0 -1,1 0,-2 -1,-2'),
  '2>3': K('0,0 1,0 1,1 0,-2 1,-2'), '3>2': K('0,0 -1,0 -1,-1 0,2 -1,2'),
  '3>0': K('0,0 -1,0 -1,-1 0,2 -1,2'), '0>3': K('0,0 1,0 1,1 0,-2 1,-2'),
};
const KICKS_I = {
  '0>1': K('0,0 -2,0 1,0 -2,-1 1,2'), '1>0': K('0,0 2,0 -1,0 2,1 -1,-2'),
  '1>2': K('0,0 -1,0 2,0 -1,2 2,-1'), '2>1': K('0,0 1,0 -2,0 1,-2 -2,1'),
  '2>3': K('0,0 2,0 -1,0 2,1 -1,-2'), '3>2': K('0,0 -2,0 1,0 -2,-1 1,2'),
  '3>0': K('0,0 1,0 -2,0 1,-2 -2,1'), '0>3': K('0,0 -1,0 2,0 -1,2 2,-1'),
};
export const kicksFor = (type, from, to) => (type === 1 ? KICKS_I : type === 2 ? { [`${from}>${to}`]: [[0, 0]] } : KICKS)[`${from}>${to}`];

// ---------------------------------------------------------------- the shared sequence
/** Piece n (0-based) of a match's sequence: 7-bags, each shuffled from the seed. Same on every phone. */
export function pieceAt(seed, n) {
  const bag = Math.floor(n / 7);
  const order = [1, 2, 3, 4, 5, 6, 7];
  const rnd = rngFrom(`${seed}:bag:${bag}`);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order[n % 7];
}

// ---------------------------------------------------------------- gravity
/** Milliseconds per row at a level (the usual modern curve; capped so the top levels stay playable). */
export function gravityMs(level) {
  const l = Math.max(1, Math.min(20, level));
  return Math.max(1000 * Math.pow(0.8 - (l - 1) * 0.007, l - 1), 1000 / 60);
}
export const SOFT_FACTOR = 20;

// ---------------------------------------------------------------- scoring + attack tables
// points × level (Score Rush). Keys: lines cleared by kind.
const PTS = {
  none: [0, 100, 300, 500, 800],
  twist: [400, 800, 1200, 1600],
  mini: [100, 200, 400],
};
const PC_PTS = [0, 800, 1200, 1800, 2000];
export const ATTACK = { lines: [0, 0, 1, 2, 4], twist: [0, 2, 4, 6], mini: [0, 0, 1], pc: 10, b2b: 1 };
// extra junk for the n-th consecutive clear (combo 1 = the second clear in a row)
export const COMBO_ATTACK = [0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5];
export const comboAttack = c => (c <= 0 ? 0 : COMBO_ATTACK[Math.min(c, COMBO_ATTACK.length - 1)]);
/** KO badges -> attack multiplier bonus: 1 = +25 %, 3 = +50 %, 6 = +75 %, 10 = +100 %. */
export function badgeBonus(b) {
  return b >= 10 ? 1 : b >= 6 ? 0.75 : b >= 3 ? 0.5 : b >= 1 ? 0.25 : 0;
}

// ---------------------------------------------------------------- game state
/**
 * opts: { seed, level (start), mode: 'battle'|'rush', fixedLevel?: bool (battle: level comes from setLevel) }
 */
export function createEngine({ seed, level = 1, mode = 'rush' } = {}) {
  return {
    seed, mode,
    cells: new Uint8Array(W * H),
    n: 0,                 // index of the current piece in the sequence
    cur: null,            // { t, r, x, y }
    hold: 0, held: false,
    level, lines: 0, score: 0, combo: -1, maxCombo: 0, b2b: false, b2bCount: 0,
    best: null,           // best clear { k: 'quad'|'tt'|… , pts }
    sent: 0, frac: 0, badges: 0,
    pending: [],          // incoming junk [{ n, g, at (ms engine clock when it may land), id, from }]
    clock: 0,             // engine ms
    acc: 0, fall: 0, lockT: 0, resets: 0, lowest: 99, lastRot: null,
    over: false, sd: 0,
    events: [],
    stats: { pieces: 0, quads: 0, twists: 0, pcs: 0 },
  };
}

const at = (g, x, y) => (x < 0 || x >= W || y < 0 ? 9 : y >= H ? 0 : g.cells[y * W + x]);
export const cellAt = at;

export function cellsOf(p) {
  return SHAPES[p.t][p.r].map(([x, y]) => [p.x + x, p.y + y]);
}

export function fits(g, p) {
  for (const [x, y] of cellsOf(p)) if (at(g, x, y)) return false;
  return true;
}

function spawnPos(t) {
  const x = t === 2 ? 4 : 3;
  // the piece's lowest filled row sits at row 20 (just above the visible field)
  const minY = Math.min(...SHAPES[t][0].map(c => c[1]));
  return { t, r: 0, x, y: VISIBLE - minY };
}

export function nextQueue(g, count = NEXT) {
  const out = [];
  for (let i = 1; i <= count; i++) out.push(pieceAt(g.seed, g.n + i));
  return out;
}

/** Starts the game (or the next piece). */
export function spawn(g, type = null) {
  const t = type || pieceAt(g.seed, g.n);
  const p = spawnPos(t);
  if (!fits(g, p)) { topOut(g, 'block'); return false; }
  // drop one row right away if there is room (pieces enter the visible field immediately)
  const down = { ...p, y: p.y - 1 };
  g.cur = fits(g, down) ? down : p;
  g.fall = 0; g.lockT = 0; g.resets = 0; g.lowest = g.cur.y; g.lastRot = null;
  g.events.push({ e: 'spawn', t });
  return true;
}

export function start(g) {
  g.n = 0;
  return spawn(g);
}

function topOut(g, why) {
  if (g.over) return;
  g.over = true;
  g.cur = null;
  g.events.push({ e: 'topout', why });
}

const grounded = g => g.cur && !fits(g, { ...g.cur, y: g.cur.y - 1 });

function afterMove(g) {
  if (grounded(g)) {
    if (g.resets < MAX_RESETS) { g.lockT = 0; g.resets++; }
  }
}

function noteLowest(g) {
  if (g.cur.y < g.lowest) { g.lowest = g.cur.y; g.resets = 0; g.lockT = 0; }
}

export function move(g, dx) {
  if (!g.cur || g.over) return false;
  const p = { ...g.cur, x: g.cur.x + dx };
  if (!fits(g, p)) return false;
  g.cur = p;
  g.lastRot = null;
  afterMove(g);
  g.events.push({ e: 'move', dx });
  return true;
}

export function rotate(g, dir) {
  if (!g.cur || g.over) return false;
  const from = g.cur.r;
  const to = (from + (dir > 0 ? 1 : 3)) % 4;
  const kicks = kicksFor(g.cur.t, from, to);
  for (let i = 0; i < kicks.length; i++) {
    const [kx, ky] = kicks[i];
    const p = { ...g.cur, r: to, x: g.cur.x + kx, y: g.cur.y + ky };
    if (fits(g, p)) {
      g.cur = p;
      g.lastRot = { kick: i, dir };
      afterMove(g);
      noteLowest(g);
      g.events.push({ e: 'rotate', dir, kick: i });
      return true;
    }
  }
  return false;
}

/** One row down; soft = player-driven (1 point per row). */
export function stepDown(g, soft = false) {
  if (!g.cur || g.over) return false;
  const p = { ...g.cur, y: g.cur.y - 1 };
  if (!fits(g, p)) return false;
  g.cur = p;
  g.lastRot = null;
  noteLowest(g);
  if (soft) { g.score += 1; g.events.push({ e: 'soft' }); }
  return true;
}

export function ghostY(g) {
  if (!g.cur) return null;
  let y = g.cur.y;
  while (fits(g, { ...g.cur, y: y - 1 })) y--;
  return y;
}

export function hardDrop(g) {
  if (!g.cur || g.over) return false;
  const y = ghostY(g);
  const rows = g.cur.y - y;
  if (rows > 0) g.lastRot = null;
  g.cur = { ...g.cur, y };
  g.score += 2 * rows;
  g.events.push({ e: 'hard', rows, x: g.cur.x, t: g.cur.t });
  lock(g);
  return true;
}

export function holdPiece(g) {
  if (!g.cur || g.over || g.held) return false;
  const t = g.cur.t;
  if (g.hold) {
    const h = g.hold;
    g.hold = t;
    g.held = true;
    g.events.push({ e: 'hold', t });
    return spawn(g, h);
  }
  g.hold = t;
  g.held = true;
  g.n++;
  g.events.push({ e: 'hold', t });
  return spawn(g);
}

// twist check for the twist piece: 3 of the 4 corners around its centre filled (walls count)
function twistKind(g) {
  const p = g.cur;
  if (p.t !== TWIST || !g.lastRot) return null;
  const cx = p.x + 1, cy = p.y + 1;
  const C = { tl: [cx - 1, cy + 1], tr: [cx + 1, cy + 1], bl: [cx - 1, cy - 1], br: [cx + 1, cy - 1] };
  const filled = k => !!at(g, C[k][0], C[k][1]);
  const n = ['tl', 'tr', 'bl', 'br'].filter(filled).length;
  if (n < 3) return null;
  const front = [['tl', 'tr'], ['tr', 'br'], ['bl', 'br'], ['tl', 'bl']][p.r];
  if (front.every(filled) || g.lastRot.kick === 4) return 'twist';
  return 'mini';
}

function clearKey(lines, twist) {
  if (twist === 'twist') return ['twist', 'tsingle', 'tdouble', 'ttriple'][lines];
  if (twist === 'mini') return ['mini', 'msingle', 'mdouble'][Math.min(lines, 2)];
  return [null, 'single', 'double', 'triple', 'quad'][lines];
}
export const CLEAR_RANK = { single: 1, mini: 1, msingle: 2, double: 3, twist: 3, mdouble: 4, triple: 5, tsingle: 6, quad: 8, tdouble: 9, ttriple: 10, pc: 12 };

function lock(g) {
  const p = g.cur;
  const twist = twistKind(g);
  let above = true;
  for (const [x, y] of cellsOf(p)) {
    if (y < H) g.cells[y * W + x] = p.t;
    if (y < VISIBLE) above = false;
  }
  g.cur = null;
  g.stats.pieces++;
  g.events.push({ e: 'lock', t: p.t, cells: cellsOf(p) });
  // full rows
  const rows = [];
  for (let y = 0; y < H; y++) {
    let full = true;
    for (let x = 0; x < W; x++) if (!g.cells[y * W + x]) { full = false; break; }
    if (full) rows.push(y);
  }
  const lines = rows.length;
  const clearedCells = rows.map(y => Array.from(g.cells.subarray(y * W, y * W + W)));
  if (lines) {
    const keep = [];
    for (let y = 0; y < H; y++) if (!rows.includes(y)) keep.push(g.cells.slice(y * W, y * W + W));
    g.cells.fill(0);
    keep.forEach((row, y) => g.cells.set(row, y * W));
  }
  const pc = lines > 0 && g.cells.every(c => c === 0);
  const key = clearKey(lines, twist);
  const difficult = (lines === 4) || (!!twist && lines > 0);
  let attack = 0;
  if (lines > 0) {
    g.combo++;
    g.maxCombo = Math.max(g.maxCombo, g.combo);
    const b2bNow = difficult && g.b2b;
    // points
    const base = twist === 'twist' ? PTS.twist[lines] : twist === 'mini' ? PTS.mini[Math.min(lines, 2)] : PTS.none[lines];
    let pts = base * g.level;
    if (b2bNow) pts = Math.floor(pts * 1.5);
    pts += 50 * Math.max(0, g.combo) * g.level;
    if (pc) pts += (b2bNow && lines === 4 ? 3200 : PC_PTS[lines]) * g.level;
    g.score += pts;
    // attack
    attack = twist === 'twist' ? ATTACK.twist[lines] : twist === 'mini' ? ATTACK.mini[Math.min(lines, 2)] : ATTACK.lines[lines];
    if (b2bNow) attack += ATTACK.b2b;
    if (pc) attack = ATTACK.pc + (b2bNow ? ATTACK.b2b : 0);
    attack += comboAttack(g.combo);
    g.b2b = difficult ? true : false;
    g.b2bCount = difficult ? g.b2bCount + 1 : 0;
    g.lines += lines;
    if (g.mode === 'rush') g.level = Math.max(g.level, 1 + Math.floor(g.lines / 10));
    if (lines === 4) g.stats.quads++;
    if (twist) g.stats.twists++;
    if (pc) g.stats.pcs++;
    const rank = pc ? CLEAR_RANK.pc : CLEAR_RANK[key] || 0;
    if (!g.best || rank > g.best.rank) g.best = { k: pc ? 'pc' : key, rank };
    g.events.push({ e: 'clear', lines, rows, cells: clearedCells, twist, key, b2b: b2bNow, combo: g.combo, pc, pts, attack });
  } else {
    if (twist) {
      g.score += (twist === 'twist' ? PTS.twist[0] : PTS.mini[0]) * g.level;
      g.events.push({ e: 'twist0', twist });
    }
    g.combo = -1;
  }
  // battle: counter incoming junk with this clear, then send the rest; with no clear, due junk lands
  if (g.mode === 'battle') {
    if (attack > 0) {
      const bonus = badgeBonus(g.badges);
      g.frac += attack * (1 + bonus);
      let out = Math.floor(g.frac + 1e-9);
      g.frac -= out;
      let countered = 0;
      while (out > 0 && g.pending.length) {
        const q = g.pending[0];
        const k = Math.min(q.n, out);
        q.n -= k; out -= k; countered += k;
        if (!q.n) g.pending.shift();
      }
      if (countered) g.events.push({ e: 'counter', n: countered });
      if (out > 0) { g.sent += out; g.events.push({ e: 'send', n: out, key }); }
    } else if (!lines) {
      landJunk(g);
    }
  }
  if (above && !lines) { topOut(g, 'lock'); return; }
  if (g.over) return;
  g.held = false;
  g.n++;
  spawn(g);
}

/** Queue incoming junk (battle). delayMs: how long until it may land. */
export function receive(g, { n, gap, from = null, id = null, delayMs = 1000 }) {
  if (g.over || n <= 0) return;
  g.pending.push({ n, g: gap, from, id, at: g.clock + delayMs });
  g.events.push({ e: 'incoming', n, from });
}

export const pendingTotal = g => g.pending.reduce((s, q) => s + q.n, 0);

const MAX_LAND = 12;
function landJunk(g) {
  let room = MAX_LAND;
  while (room > 0 && g.pending.length && g.pending[0].at <= g.clock) {
    const q = g.pending[0];
    const k = Math.min(q.n, room);
    insertJunk(g, k, q.g, q.from);
    room -= k;
    q.n -= k;
    if (!q.n) g.pending.shift();
    if (g.over) return;
  }
}

/** Pushes `count` junk rows (one gap column) in from the bottom. */
export function insertJunk(g, count, gap, from = null) {
  for (let y = H - 1; y >= H - count; y--) {
    for (let x = 0; x < W; x++) if (g.cells[y * W + x]) { g.events.push({ e: 'junk', n: count, from }); topOut(g, 'junk'); return; }
  }
  g.cells.copyWithin(count * W, 0, (H - count) * W);
  for (let y = 0; y < count; y++) for (let x = 0; x < W; x++) g.cells[y * W + x] = x === gap ? 0 : JUNK;
  // the active piece rides up if the junk would swallow it
  if (g.cur) {
    let tries = 0;
    while (!fits(g, g.cur) && tries++ < count + 2) g.cur = { ...g.cur, y: g.cur.y + 1 };
    if (!fits(g, g.cur) || cellsOf(g.cur).some(c => c[1] >= H)) { topOut(g, 'junk'); return; }
    g.lowest = Math.min(g.lowest + count, g.cur.y);
  }
  g.events.push({ e: 'junk', n: count, from, gap });
}

/** Highest filled row + 1 (0 = empty board). */
export function stackHeight(g) {
  for (let y = H - 1; y >= 0; y--) for (let x = 0; x < W; x++) if (g.cells[y * W + x]) return y + 1;
  return 0;
}

/**
 * Advances time. soft: the player is holding soft drop. Fixed 1/120 s steps.
 */
export function update(g, ms, soft = false) {
  if (g.over) return;
  g.acc += Math.min(ms, 250);
  while (g.acc >= TICK) {
    g.acc -= TICK;
    g.clock += TICK;
    if (!g.cur) continue;
    const gms = gravityMs(g.level);
    const rate = soft ? Math.min(gms / SOFT_FACTOR, 33) : gms;
    g.fall += TICK;
    while (g.cur && g.fall >= rate) {
      g.fall -= rate;
      if (!stepDown(g, soft)) { g.fall = 0; break; }
    }
    if (g.cur && grounded(g)) {
      g.lockT += TICK;
      if (g.lockT >= LOCK_MS) lock(g);
    } else if (g.cur) {
      g.lockT = 0;
    }
  }
}

export function setLevel(g, level) { g.level = Math.max(g.level, level); }

export function takeEvents(g) {
  const e = g.events;
  g.events = [];
  return e;
}

// ---------------------------------------------------------------- snapshots
/** Board as a string: one char per cell ('0'-'8'), rows from the bottom up to the highest filled row. */
export function boardString(g, rows = null) {
  const h = rows == null ? stackHeight(g) : rows;
  let s = '';
  for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) s += g.cells[y * W + x];
  return s;
}

export function loadBoard(g, s) {
  g.cells.fill(0);
  for (let i = 0; i < Math.min(s.length, W * H); i++) g.cells[i] = s.charCodeAt(i) - 48;
}

/** Everything needed to resume after a refresh (the current piece restarts from the top). */
export function save(g) {
  return {
    b: boardString(g), n: g.n, h: g.hold, hd: g.held ? 1 : 0, lv: g.level, ln: g.lines, sc: g.score,
    cb: g.combo, mc: g.maxCombo, bb: g.b2b ? 1 : 0, bc: g.b2bCount, se: g.sent, fr: Math.round(g.frac * 1000) / 1000,
    pd: g.pending.map(q => [q.n, q.g, q.from || '', q.id || '']), sd: g.sd, best: g.best ? g.best.k : '',
    st: [g.stats.pieces, g.stats.quads, g.stats.twists, g.stats.pcs],
  };
}

export function restore(g, s) {
  loadBoard(g, s.b || '');
  g.n = s.n || 0; g.hold = s.h || 0; g.held = !!s.hd; g.level = s.lv || 1; g.lines = s.ln || 0; g.score = s.sc || 0;
  g.combo = s.cb ?? -1; g.maxCombo = s.mc || 0; g.b2b = !!s.bb; g.b2bCount = s.bc || 0; g.sent = s.se || 0; g.frac = s.fr || 0;
  g.pending = (s.pd || []).map(([n, gap, from, id]) => ({ n, g: gap, from: from || null, id: id || null, at: g.clock }));
  g.sd = s.sd || 0;
  g.best = s.best ? { k: s.best, rank: CLEAR_RANK[s.best] || 0 } : null;
  const st = s.st || [];
  g.stats = { pieces: st[0] || 0, quads: st[1] || 0, twists: st[2] || 0, pcs: st[3] || 0 };
  g.over = false;
  g.cur = null;
  return spawn(g);
}
