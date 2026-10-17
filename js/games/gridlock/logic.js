// GRIDLOCK — the rules (PURE): boards and fleets, placement, shot resolution, scoring, the bounty, standings.
//
// Vocabulary: a VOLLEY is one set of shots resolved together (Classic: one shot; Battle Royale: everyone's).
// Part 2 (Salvo: several shots per player per volley; Arcade: abilities) plugs in through `shotsPerVolley(game, uid)`,
// `resolveVolley()` (shots is already a list per shooter) and the `ev` event list the cinematic plays.
export { CALL_MS, callBonus } from '../../core/playlist.js';
import { rngFrom, shuffle, hashString } from '../../core/rng.js';
import { encodeJSON, decodeJSON } from '../../core/obfuscate.js';

export const MODES = ['classic', 'royale'];
export const DEFAULT_SETTINGS = { mode: 'classic', placeSec: 60, turnSec: 20 };
export const PLACE_OPTIONS = [45, 60, 90];
export const TURN_OPTIONS = [15, 20, 30];
export const MIN_PLAYERS = 2;
export const SKIP_OFFLINE_MS = 3000;    // Classic: an offline player's turn is skipped this soon
export const RESOLVE_CAP_MS = 15_000;   // a volley never waits longer than this for resolutions
export const END_MS = 4500;
export const ROYALE_ROUND_CAP = 25;     // safety cap: most ship cells left wins (points break ties)
export const CLASSIC_VOLLEY_CAP = 100;  // per player (a 10×10 board can never need more shots than its cells)
export const POINTS = { hit: 10, sunk: 30, elim: 50, bountyMult: 1.5 };

// ---------------------------------------------------------------- boards + fleets
export const boardSize = n => (n <= 3 ? 10 : 8);
export const fleetFor = size => (size >= 10 ? [5, 4, 3, 3, 2] : [4, 3, 3, 2]);
// names by fleet slot (the two 3s differ): 10×10 and 8×8
const NAMES_10 = ['DREADNOUGHT', 'CRUISER', 'FRIGATE', 'CORVETTE', 'SCOUT'];
const NAMES_8 = ['CRUISER', 'FRIGATE', 'CORVETTE', 'SCOUT'];
export const shipName = (size, idx) => (size >= 10 ? NAMES_10 : NAMES_8)[idx] || `SHIP ${idx + 1}`;
export const COLS = 'ABCDEFGHIJ';
export const cellName = (r, c) => `${COLS[c]}${r + 1}`;

export function cleanSettings(s = {}) {
  return {
    mode: MODES.includes(s.mode) ? s.mode : DEFAULT_SETTINGS.mode,
    placeSec: PLACE_OPTIONS.includes(Number(s.placeSec)) ? Number(s.placeSec) : DEFAULT_SETTINGS.placeSec,
    turnSec: TURN_OPTIONS.includes(Number(s.turnSec)) ? Number(s.turnSec) : DEFAULT_SETTINGS.turnSec,
  };
}

/** A ship: { r, c, len, d } — d 0 = along the row (horizontal), 1 = down the column. */
export function cellsOf(s) {
  const out = [];
  for (let i = 0; i < s.len; i++) out.push(s.d ? [s.r + i, s.c] : [s.r, s.c + i]);
  return out;
}
export const inside = (s, size) => s.r >= 0 && s.c >= 0 && (s.d ? s.r + s.len <= size && s.c < size : s.c + s.len <= size && s.r < size);

/** Can ship `cand` sit at slot `idx` given the others (inside the board, no overlap)? */
export function canPlace(ships, idx, cand, size) {
  if (!inside(cand, size)) return false;
  const mine = new Set(cellsOf(cand).map(([r, c]) => `${r},${c}`));
  for (let i = 0; i < ships.length; i++) {
    if (i === idx || !ships[i]) continue;
    for (const [r, c] of cellsOf(ships[i])) if (mine.has(`${r},${c}`)) return false;
  }
  return true;
}
export function validLayout(ships, size, lens) {
  if (!Array.isArray(ships) || ships.length !== lens.length) return false;
  for (let i = 0; i < ships.length; i++) {
    const s = ships[i];
    if (!s || s.len !== lens[i] || (s.d !== 0 && s.d !== 1)) return false;
    if (!canPlace(ships, i, s, size)) return false;
  }
  return true;
}

/** A random valid layout (seeded when rnd is given): fills the given slots, keeping any ships already placed. */
export function randomLayout(size, lens, rnd = Math.random, keep = []) {
  const ships = lens.map((_, i) => keep[i] || null);
  for (let i = 0; i < lens.length; i++) {
    if (ships[i]) continue;
    for (let tries = 0; tries < 400; tries++) {
      const d = rnd() < 0.5 ? 0 : 1;
      const cand = { r: Math.floor(rnd() * size), c: Math.floor(rnd() * size), len: lens[i], d };
      if (canPlace(ships, i, cand, size)) { ships[i] = cand; break; }
    }
    if (!ships[i]) return randomLayout(size, lens, rnd); // a cramped keep-set: start over
  }
  return ships;
}

export const encodeFleet = ships => ships.map(s => `${s.r},${s.c},${s.len},${s.d}`).join(';');
export function decodeFleet(str) {
  if (typeof str !== 'string' || !str) return null;
  const ships = str.split(';').map(p => { const [r, c, len, d] = p.split(',').map(Number); return { r, c, len, d }; });
  return ships.every(s => [s.r, s.c, s.len, s.d].every(Number.isFinite)) ? ships : null;
}
export function shipAt(ships, r, c) {
  for (let i = 0; i < ships.length; i++) if (ships[i] && cellsOf(ships[i]).some(([a, b]) => a === r && b === c)) return i;
  return -1;
}

// ---------------------------------------------------------------- shots
/** The obfuscation key for a Battle Royale aim (the cell stays out of plain sight until the volley resolves). */
export const shotKey = (code, matchId, rk, uid) => { const raw = `${code}:${matchId}:${rk}:${uid}`; return `${hashString(raw).toString(36)}:${raw}`; };
export const encodeAim = (r, c, key) => encodeJSON([r, c], key);
export function decodeAim(x, key) {
  const v = decodeJSON(x, key);
  return Array.isArray(v) && Number.isInteger(v[0]) && Number.isInteger(v[1]) ? { r: v[0], c: v[1] } : null;
}
/** Shots a player fires per volley (Part 2's Salvo raises this). */
export const shotsPerVolley = () => 1;

export const aliveOf = game => Object.keys(game.participants || {}).filter(u => !(game.out && game.out[u]));
export const emptyBoard = () => ({ cells: {}, sunk: {}, left: 0 });
export const boardOf = (game, uid) => (game.boards && game.boards[uid]) || { cells: {}, sunk: {}, left: game.fleet.reduce((a, b) => a + b, 0) };
export const isShot = (board, r, c) => !!(board.cells && board.cells[`${r},${c}`]);

/** A random legal shot for `shooter`: an alive opponent, a cell not shot yet. */
export function randomShot(game, shooter, rnd) {
  const targets = aliveOf(game).filter(u => u !== shooter);
  if (!targets.length) return null;
  const t = targets[Math.floor(rnd() * targets.length)];
  const b = boardOf(game, t);
  const free = [];
  for (let r = 0; r < game.size; r++) for (let c = 0; c < game.size; c++) if (!isShot(b, r, c)) free.push([r, c]);
  if (!free.length) return null;
  const [r, c] = free[Math.floor(rnd() * free.length)];
  return { t, r, c };
}

/** A bot's shot (tests / the E2E; never used for a real player): finish the weakest fleet — hunt next to its hits on ships
 * still afloat, else a fresh cell on that board. (Like people do; random fire never eliminates anyone in 25 rounds.) */
export function smartShot(game, shooter, rnd) {
  const all = aliveOf(game).filter(u => u !== shooter);
  if (!all.length) return null;
  const minLeft = Math.min(...all.map(u => boardOf(game, u).left));
  const targets = all.filter(u => boardOf(game, u).left === minLeft);
  const options = [];
  for (const t of targets) {
    const b = boardOf(game, t);
    const sunkCells = new Set(Object.values(b.sunk || {}).flatMap(g => { const [r, c, len, d] = g.split(',').map(Number); return cellsOf({ r, c, len, d }).map(([a, bb]) => `${a},${bb}`); }));
    for (const [key, v] of Object.entries(b.cells || {})) {
      if (v.h !== 1 || sunkCells.has(key)) continue;
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < game.size && cc < game.size && !isShot(b, rr, cc)) options.push({ t, r: rr, c: cc });
      }
    }
  }
  if (options.length) return options[Math.floor(rnd() * options.length)];
  const t = targets[Math.floor(rnd() * targets.length)];
  const b = boardOf(game, t);
  const free = [];
  for (let r = 0; r < game.size; r++) for (let c = 0; c < game.size; c++) if (!isShot(b, r, c)) free.push([r, c]);
  if (!free.length) return randomShot(game, shooter, rnd);
  const [r, c] = free[Math.floor(rnd() * free.length)];
  return { t, r, c };
}

/**
 * Resolve every shot on ONE board against its private fleet (run by the board's owner, or the host as a fallback).
 * shots: { shooterUid: [{ r, c }, …] }. board: that board's public state before the volley.
 * Returns what may be made public: per shooter per shot h (0 miss, 1 hit, 2 already hit) + s (the slot it sank),
 * and the geometry of ships sunk this volley (nothing about unhit ships).
 */
export function resolveVolley(ships, board, shots) {
  const hitBefore = new Set(Object.entries(board.cells || {}).filter(([, v]) => v && v.h === 1).map(([k]) => k));
  const hitNow = new Set(hitBefore);
  const r = {};
  for (const [by, list] of Object.entries(shots)) {
    r[by] = list.map(({ r: row, c: col }) => {
      const key = `${row},${col}`;
      const idx = shipAt(ships, row, col);
      if (idx < 0) return { h: 0 };
      if (hitBefore.has(key)) return { h: 2 };
      hitNow.add(key);
      return { h: 1, i: idx };
    });
  }
  // ships whose every cell is hit now but not before = sunk this volley
  const k = {};
  ships.forEach((s, idx) => {
    if (!s || (board.sunk && board.sunk[idx])) return;
    const cells = cellsOf(s).map(([a, b]) => `${a},${b}`);
    if (cells.every(c => hitNow.has(c)) && !cells.every(c => hitBefore.has(c))) k[idx] = `${s.r},${s.c},${s.len},${s.d}`;
  });
  for (const list of Object.values(r)) for (const x of list) if (x.h === 1 && k[x.i] != null) x.s = x.i;
  for (const list of Object.values(r)) for (const x of list) delete x.i;   // the slot of a non-sunk hit stays private
  return { r, k };
}

/**
 * Fold one board's resolution into the public game state (host). Returns { board, events, credit } where credit
 * lists points per shooter: { uid: { hits, sunk, elim } }.
 */
export function applyResolution(game, target, fire, res) {
  const before = boardOf(game, target);
  const board = { cells: { ...(before.cells || {}) }, sunk: { ...(before.sunk || {}) }, left: before.left };
  const events = [];
  const credit = {};
  const cr = u => (credit[u] ||= { hits: 0, sunk: 0, elim: 0 });
  const sunkBy = {};
  for (const [by, shotList] of Object.entries(fire)) {
    const rs = (res && res.r && res.r[by]) || [];
    shotList.forEach((sh, i) => {
      if (sh.t !== target) return;
      const x = rs[i] || { h: 0 };
      const key = `${sh.r},${sh.c}`;
      const hit = x.h === 1;
      if (!board.cells[key]) board.cells[key] = { by, h: hit ? 1 : 0 };
      else if (hit && board.cells[key].h !== 1) board.cells[key] = { by, h: 1 };
      if (hit) { cr(by).hits++; }
      events.push({ k: 'shot', by, t: target, r: sh.r, c: sh.c, h: x.h });
      if (x.s != null) (sunkBy[x.s] ||= []).push(by);
    });
  }
  // new hit cells (unique) lower what's left
  const hitCells = Object.values(board.cells).filter(v => v.h === 1).length;
  const total = game.fleet.reduce((a, b) => a + b, 0);
  board.left = Math.max(0, total - hitCells);
  for (const [idx, geo] of Object.entries((res && res.k) || {})) {
    if (board.sunk[idx]) continue;
    board.sunk[idx] = geo;
    const by = sunkBy[idx] || [];
    for (const u of by) cr(u).sunk++;
    events.push({ k: 'sunk', t: target, i: Number(idx), g: geo, by });
  }
  const eliminated = board.left <= 0 && !(game.out && game.out[target]);
  if (eliminated) {
    const by = [...new Set(Object.values(sunkBy).flat())];
    for (const u of by) cr(u).elim++;
    events.push({ k: 'elim', t: target, by });
  }
  return { board, events, credit, eliminated };
}

/** The bounty sits on the alive player strictly ahead on points (none while tied / at zero). */
export function bountyHolder(game) {
  const alive = aliveOf(game);
  const pts = game.pts || {};
  let best = null, bestV = 0, tie = false;
  for (const u of alive) {
    const v = pts[u] || 0;
    if (v > bestV) { best = u; bestV = v; tie = false; } else if (v === bestV && v > 0) tie = true;
  }
  return tie ? null : best;
}

export function pointsFor(credit, onBounty) {
  const m = onBounty ? POINTS.bountyMult : 1;
  return Math.round(credit.hits * POINTS.hit * m + credit.sunk * POINTS.sunk * m + credit.elim * POINTS.elim);
}

/** How long the resolution cinematic runs for a volley's events. */
export function showMs(events) {
  const shots = events.filter(e => e.k === 'shot').length;
  const sunk = events.filter(e => e.k === 'sunk').length;
  const elim = events.filter(e => e.k === 'elim').length;
  return Math.min(14_000, 1900 + shots * 900 + sunk * 1300 + elim * 1600);   // one Classic shot ≈ 2.8 s: enough to watch it land
}

/** Standings: placement first (1 = winner), then points. */
export function standings(game) {
  const out = game.out || {};
  const pts = game.pts || {};
  return Object.keys(game.participants || {}).map(uid => ({ uid, place: out[uid] ? out[uid].place : 1, score: pts[uid] || 0 }))
    .sort((a, b) => a.place - b.place || b.score - a.score || (a.uid < b.uid ? -1 : 1))
    .map(r => ({ ...r, rank: r.place }));
}

export const estimateMinutes = (s, n = 4) => {
  const st = cleanSettings(s);
  return st.mode === 'royale' ? 2 + Math.round(ROYALE_ROUND_CAP * 0.5 * (st.turnSec + 8) / 60) : 3 + Math.round(n * 1.5);
};

/** Seeded, identical for everyone in the room: the GRIDLOCK music order (spy1–3 + last-signal). */
export const musicOrder = code => shuffle(rngFrom(`${code}:gridlock:music`), ['spy1', 'spy2', 'spy3', 'signal']);
