// COAST CLEAR — THE RULES (CC1 — docs/coastclear.md), PURE: the server imports this (api/_lib/cc.js judges every move with it), the phone
// folds the server's answers with it, the preview's fake server runs it. No DOM, no clock, no randomness.
//
// THE BOARD (server-only — an unopened cell's content never reaches a phone):
//   { w, h, lights: [cell…] (sorted), start: cell (the opening's tapped zero), open: [cell…] (the PRE-OPENED safe area = the flood from start) }
//   a cell = y * w + x. count = the searchlights in its 8 neighbours.
// THE RECORD (server-only, dly/coastclear/{day}/p/{pid} — the moves, never a cell's content):
//   { st: startedAt, mv: ['d45', 'c30:21,22', …], p?: { n, ms, at? }, e?: finishedAt, o?: 'clear' | 'caught' }
//   'd<cell>' = a DIG · 'c<cell>:<buoys>' = a CHORD with the phone's buoys around it · only a move that CHANGED the run is recorded
//   p = the pauses: n of them, ms stopped in all, at = paused since (THE DAILY MODULE calls pause / resume — the room started a game mid-run)
// THE PHONE's VIEW (runView): { w, h, lights, open: [[cell, n]…], lit: [cell…], spots, done, out, startedAt, finishedAt, paused, pausedMs, pauses }
//   — opened cells + spotted lights only. CC2: a FINISHED run's view also carries `reveal` (every light's cell — THE END SCREEN's harbor shows
//   them all; the run is over, one try a day, so the board may be shown to its own player — like THE PASSWORD's word once its door closes).
// SCORE (lower = better, whole seconds): time on the clock (server time, the pauses stopped) + 30 per spot + 15 per pause; a CAUGHT run (3 spots)
//   = CAUGHT + the safe cells it left — below every finished run (the more of the harbor crossed, the better among them).
export * from './meta.js';
import { W, H, LIGHTS, SPOT_S, PAUSE_S, MAX_SPOTS, CC_EPOCH } from './meta.js';

export const CAUGHT = 10000;              // a caught run's score floor (a finished run is capped just under it)
export const SCORE_MAX_CLEAR = CAUGHT - 1;
export const SCORE_MAX = CAUGHT + W * H;  // the worst a caught run can be

// ---- the board ------------------------------------------------------------------------------------------------------------------------

/** a cell's 8 neighbours (in reading order) */
export function neighbours(i, w = W, h = H) {
  const x = i % w, y = (i - x) / w, out = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < w && ny < h) out.push(ny * w + nx);
  }
  return out;
}
const NB = new Map();
/** neighbours, cached per board size */
export function nbOf(w, h) {
  const k = `${w}x${h}`;
  if (!NB.has(k)) NB.set(k, Array.from({ length: w * h }, (_, i) => neighbours(i, w, h)));
  return NB.get(k);
}
/** every cell's count (−1 = a searchlight) */
export function countsOf(board) {
  const { w, h } = board, nb = nbOf(w, h), L = new Set(board.lights);
  return Array.from({ length: w * h }, (_, i) => (L.has(i) ? -1 : nb[i].reduce((s, j) => s + (L.has(j) ? 1 : 0), 0)));
}
const isCell = (board, i) => Number.isInteger(i) && i >= 0 && i < board.w * board.h;

/** THE FLOOD: digging cell i (safe) opens it; a 0 opens its whole calm area (the zeros + their numbered edge) — in BFS order from i.
 *  `open` = a Set of the cells already open (never re-listed); lights are never in a flood. → [[cell, n]…] */
export function flood(board, counts, i, open = new Set()) {
  if (counts[i] < 0 || open.has(i)) return [];
  const nb = nbOf(board.w, board.h), seen = new Set([i]), out = [], q = [i];
  while (q.length) {
    const c = q.shift();
    out.push([c, counts[c]]);
    if (counts[c] !== 0) continue;
    for (const j of nb[c]) if (!seen.has(j) && !open.has(j) && counts[j] >= 0) { seen.add(j); q.push(j); }
  }
  return out;
}
/** the pre-opened safe area of a board (its start's flood) */
export const openingOf = (board, counts = countsOf(board)) => flood(board, counts, board.start);
export const safeCount = board => board.w * board.h - board.lights.length;

// ---- the run (the server's state, rebuilt from the record) ---------------------------------------------------------------------------

/** a fresh state on a board: the opening open */
export function freshState(board, counts = countsOf(board)) {
  const open = new Map(openingOf(board, counts));
  return { open, lit: [], done: false, out: null };
}
/** parse one recorded move → { kind: 'dig' | 'chord', cell, buoys } | null */
export function parseMove(m) {
  const s = String(m || '');
  let r = /^d(\d{1,3})$/.exec(s);
  if (r) return { kind: 'dig', cell: Number(r[1]) };
  r = /^c(\d{1,3}):((?:\d{1,3}(?:,\d{1,3})*)?)$/.exec(s);
  if (r) return { kind: 'chord', cell: Number(r[1]), buoys: r[2] ? r[2].split(',').map(Number) : [] };
  return null;
}
export const moveText = mv => (mv.kind === 'dig' ? `d${mv.cell}` : `c${mv.cell}:${[...new Set(mv.buoys)].sort((a, b) => a - b).join(',')}`);

/** after a move: CAUGHT (3 spots) or CLEAR (every safe cell open) */
function settle(board, st) {
  if (st.lit.length >= MAX_SPOTS) { st.done = true; st.out = 'caught'; }
  else if (st.open.size >= safeCount(board)) { st.done = true; st.out = 'clear'; }
  return st;
}
/**
 * ONE MOVE on the state (mutates a COPY) → { st, cells: [[cell, n]…] newly opened (or the tapped open cell's own number), lit: [cells newly
 * spotted], changed } | { refused: 'done' | 'bad_cell' | 'chord_count' | 'not_a_number' }
 *   dig:   a light = SPOTTED (+30 s, the light stays shown; the 3rd ends the run) · a safe cell opens (a 0 floods) · an open / spotted cell = free
 *   chord: only on an OPEN NUMBER whose buoys (+ its spotted lights) equal it — then every other unopened neighbour is dug at once; a WRONG buoy
 *          means a light was left un-buoyed → that light gets dug = SPOTTED
 */
export function applyMove(board, counts, state, mv) {
  if (state.done) return { refused: 'done' };
  if (!mv || !isCell(board, mv.cell)) return { refused: 'bad_cell' };
  const st = { open: new Map(state.open), lit: state.lit.slice(), done: false, out: null };
  const cells = [], lit = [];
  const dig = i => {
    if (st.open.has(i) || st.lit.includes(i)) return;
    if (counts[i] < 0) { st.lit.push(i); lit.push(i); return; }
    for (const [c, n] of flood(board, counts, i, new Set(st.open.keys()))) { st.open.set(c, n); cells.push([c, n]); }
  };
  if (mv.kind === 'dig') {
    const i = mv.cell;
    if (st.open.has(i)) return { st: state, cells: [[i, st.open.get(i)]], lit: [], changed: false };
    if (st.lit.includes(i)) return { st: state, cells: [], lit: [], changed: false };
    dig(i);
  } else if (mv.kind === 'chord') {
    const i = mv.cell, n = st.open.get(i);
    if (n == null || n <= 0) return { refused: 'not_a_number' };
    const nb = nbOf(board.w, board.h)[i];
    const buoys = new Set((mv.buoys || []).filter(b => nb.includes(b) && !st.open.has(b) && !st.lit.includes(b)));
    const known = buoys.size + nb.filter(j => st.lit.includes(j)).length;
    if (known !== n) return { refused: 'chord_count' };
    const targets = nb.filter(j => !st.open.has(j) && !st.lit.includes(j) && !buoys.has(j));
    for (const j of targets) dig(j);
  } else return { refused: 'bad_cell' };
  const changed = cells.length > 0 || lit.length > 0;
  return { st: settle(board, st), cells, lit, changed };
}

/** THE PAUSE CAPS (DFIX1 — the owner, Nov 7): at most 3 accepted pauses a run AND at most 20 minutes stopped in all; past either a pause is
 *  refused (409 pause_limit) and the clock keeps running; an open pause stops counting at the 20-minute total (the time past it runs on the clock) */
export const MAX_PAUSES = 3;
export const PAUSE_CAP_MS = 20 * 60_000;
/** the pauses of a record, normalised */
export const pausesOf = rec => {
  const p = (rec && rec.p) || {};
  return { n: Math.max(0, Math.floor(Number(p.n) || 0)), ms: Math.max(0, Number(p.ms) || 0), at: Number.isFinite(Number(p.at)) && p.at != null ? Number(p.at) : null };
};
/** rebuild the state from a record's moves (the server's every call + the replay) → { st, ok } — ok false = a move no run makes */
export function stateOf(board, record, counts = countsOf(board)) {
  let st = freshState(board, counts), ok = true;
  const mv = Array.isArray(record && record.mv) ? record.mv : Object.values((record && record.mv) || {});
  for (const m of mv) {
    const r = applyMove(board, counts, st, parseMove(m));
    if (r.refused || !r.changed) { ok = false; break; }
    st = r.st;
  }
  return { st, ok, moves: mv.length };
}

/** the phone's view of a record (opened cells + spotted lights only — never an unopened cell's content) */
export function runView(record, board, { startedAt = 0 } = {}) {
  const counts = countsOf(board);
  const { st } = stateOf(board, record, counts);
  const p = pausesOf(record);
  return {
    w: board.w, h: board.h, lights: board.lights.length,
    open: [...st.open.entries()], lit: st.lit.slice(), spots: Math.min(MAX_SPOTS, st.lit.length),
    done: st.done, out: st.out, startedAt: (record && record.st) || startedAt, finishedAt: (record && record.e) || null,
    paused: p.at != null, pausedAt: p.at, pausedMs: p.ms, pauses: p.n,
    ...(st.done ? { reveal: board.lights.slice() } : {}),
  };
}

/** a fresh record */
export const newRecord = startedAt => ({ st: startedAt, mv: [] });
const cloneRec = r => ({ st: r.st, mv: (Array.isArray(r.mv) ? r.mv : Object.values(r.mv || {})).slice(), ...(r.p ? { p: { ...r.p } } : {}), ...(r.e ? { e: r.e, o: r.o } : {}) });
/** close an open pause at `now` (any move resumes the clock) — the stopped time never past PAUSE_CAP_MS in all */
function unpause(rec, now) {
  const p = pausesOf(rec);
  if (p.at == null) return false;
  rec.p = { n: p.n, ms: Math.min(Math.max(PAUSE_CAP_MS, p.ms), p.ms + Math.max(0, now - p.at)) };
  return true;
}
/** has an open pause used up the 20-minute total by `now`? */
const pastCap = (p, now) => p.at != null && p.ms + Math.max(0, now - p.at) >= PAUSE_CAP_MS;

/**
 * THE SERVER's ONE ACTION on a record (inside ONE transaction) → { record (to write — null = nothing changed), resp } | { refused, status }
 *   action: 'dig' { cell } · 'chord' { cell, buoys } · 'pause' · 'resume'
 *   resp (dig / chord): { cells: [[cell, n]…], lit: [cell…], spots, done, out?, finishedAt?, already? }   (pause / resume: { paused, pauses, pausedMs })
 */
export function serverAct(board, record, action, args = {}, now = 0) {
  const rec = cloneRec(record || newRecord(now));
  const counts = countsOf(board);
  const { st } = stateOf(board, rec, counts);
  if (action === 'pause' || action === 'resume') {
    if (st.done || rec.e) return { refused: 'done', status: 409 };
    const p = pausesOf(rec);
    if (action === 'pause') {
      if (p.at != null && !pastCap(p, now)) return { record: null, resp: { paused: true, pauses: p.n, pausedMs: p.ms, already: true } };
      // an open pause past the 20-minute total: the clock went on at the cap — closed now (written), the pause refused
      if (p.at != null) { unpause(rec, now); return { refused: 'pause_limit', status: 409, record: rec }; }
      if (p.n >= MAX_PAUSES || p.ms >= PAUSE_CAP_MS) return { refused: 'pause_limit', status: 409 };
      rec.p = { n: p.n + 1, ms: p.ms, at: now };
      return { record: rec, resp: { paused: true, pauses: p.n + 1, pausedMs: p.ms } };
    }
    if (p.at == null) return { record: null, resp: { paused: false, pauses: p.n, pausedMs: p.ms, already: true } };
    unpause(rec, now);
    return { record: rec, resp: { paused: false, pauses: rec.p.n, pausedMs: rec.p.ms } };
  }
  if (action !== 'dig' && action !== 'chord') return { refused: 'bad_action', status: 400 };
  if (st.done || rec.e) return { refused: 'done', status: 409 };
  const cell = Number(args.cell);
  const mv = action === 'dig' ? { kind: 'dig', cell } : { kind: 'chord', cell, buoys: (Array.isArray(args.buoys) ? args.buoys : []).map(Number).filter(Number.isInteger).slice(0, 8) };
  const r = applyMove(board, counts, st, mv);
  if (r.refused) return { refused: r.refused, status: r.refused === 'done' ? 409 : 422 };
  const base = { cells: r.cells, lit: r.lit, spots: Math.min(MAX_SPOTS, r.st.lit.length), done: r.st.done };
  if (!r.changed) return { record: null, resp: { ...base, already: true } };
  const resumed = unpause(rec, now);
  if (mv.kind === 'chord') mv.buoys = mv.buoys.filter(b => nbOf(board.w, board.h)[cell].includes(b));
  rec.mv.push(moveText(mv));
  if (r.st.done) { rec.e = now; rec.o = r.st.out; }
  return { record: rec, resp: { ...base, ...(r.st.done ? { out: r.st.out, finishedAt: now, reveal: board.lights.slice() } : {}), ...(resumed ? { resumed: true } : {}) } };
}

// ---- the score ------------------------------------------------------------------------------------------------------------------------

/** a finished run's numbers → its ONE score (lower = better) */
export function scoreOf({ out, ms = 0, spots = 0, pauses = 0, safeLeft = 0 }) {
  if (out === 'caught') return CAUGHT + Math.max(0, Math.min(W * H, safeLeft));
  return Math.min(SCORE_MAX_CLEAR, Math.max(0, Math.round(ms / 1000)) + SPOT_S * spots + PAUSE_S * pauses);
}
/**
 * THE SERVER's CHECK: a stored record replayed on the day's board → { out, spots, pauses, ms, safeLeft, score, moves } — or null (unfinished, or a
 * record no run makes: a bad move, a no-op recorded, a move after the end, an outcome / an end time that doesn't match, impossible pauses)
 */
export function replay(record, board, { startedAt } = {}) {
  if (!record || !board) return null;
  const st0 = Number(record.st ?? startedAt);
  if (!Number.isFinite(st0)) return null;
  const counts = countsOf(board);
  const { st, ok, moves } = stateOf(board, record, counts);
  if (!ok || !st.done) return null;
  if (!record.e || record.o !== st.out || !(record.e >= st0)) return null;
  const p = pausesOf(record);
  if (p.at != null || p.ms > record.e - st0 || p.n > MAX_PAUSES || p.ms > PAUSE_CAP_MS) return null;
  const ms = record.e - st0 - p.ms;
  const spots = Math.min(MAX_SPOTS, st.lit.length), safeLeft = safeCount(board) - st.open.size;
  return { out: st.out, spots, pauses: p.n, ms, safeLeft, moves, score: scoreOf({ out: st.out, ms, spots, pauses: p.n, safeLeft }) };
}

// ---- THE HISTOGRAM (core/daily.js): 300 buckets, low = better ----------------------------------------------------------------------------
//   0…239 = a clear in 5-second steps up to 20 min · 240 = a clear past 20 min · 241…299 = caught, the more safe cells left the worse
export const BUCKETS = 300;
export function bucketOf(score) {
  if (score < CAUGHT) return Math.min(240, Math.floor(Math.max(0, score) / 5));
  return 241 + Math.min(58, Math.floor((score - CAUGHT) / 2));
}

// ---- the phone ------------------------------------------------------------------------------------------------------------------------

/** an empty view (before the server's start lands) */
export const emptyView = ({ w = W, h = H, lights = LIGHTS, startedAt = 0 } = {}) => ({ w, h, lights, open: [], lit: [], spots: 0, done: false, out: null, startedAt, finishedAt: null, paused: false, pausedMs: 0, pauses: 0 });
/** fold one dig / chord answer into the phone's view (answers may land OUT OF ORDER — pipelined taps: everything only grows) */
export function foldAnswer(view, resp) {
  if (!view || !resp) return view;
  const open = new Map(view.open);
  for (const [c, n] of resp.cells || []) open.set(c, n);
  const lit = [...new Set([...view.lit, ...(resp.lit || [])])];
  const done = view.done || !!resp.done;
  return {
    ...view, open: [...open.entries()], lit, spots: Math.max(view.spots, resp.spots ?? 0, Math.min(MAX_SPOTS, lit.length)), done,
    out: view.out || resp.out || null, finishedAt: view.finishedAt || resp.finishedAt || null,
    ...(resp.resumed ? { paused: false } : {}),
    ...(view.reveal || resp.reveal ? { reveal: (view.reveal || resp.reveal).slice() } : {}),
  };
}
/** the clock on screen, in ms (server time): from the start, the pauses stopped, + 30 s a spot + 15 s a pause */
export function clockMs(view, serverNow) {
  if (!view || !view.startedAt) return 0;
  const end = view.finishedAt || serverNow;
  const open = view.paused && view.pausedAt ? Math.min(Math.max(0, serverNow - view.pausedAt), Math.max(0, PAUSE_CAP_MS - (view.pausedMs || 0))) : 0;   // (the cap: past it the clock runs)
  const run = Math.max(0, end - view.startedAt - (view.pausedMs || 0) - open);
  return run + 1000 * (SPOT_S * (view.spots || 0) + PAUSE_S * (view.pauses || 0));
}
/** 83 s → "1:23" */
export const fmtClock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/** the buoys left to place: the lights − the buoys on the board − the lights already spotted */
export const buoysLeft = (view, buoys) => (view ? view.lights - buoys - view.lit.length : LIGHTS);
/** CHORD on the phone: may this open number be chorded with these buoys? (the server checks again) → the neighbours to dig, or null */
export function chordTargets(view, cell, buoySet) {
  const open = new Map(view.open), n = open.get(cell);
  if (n == null || n <= 0) return null;
  const nb = nbOf(view.w, view.h)[cell];
  const lit = new Set(view.lit);
  const known = nb.filter(j => buoySet.has(j) && !open.has(j) && !lit.has(j)).length + nb.filter(j => lit.has(j)).length;
  if (known !== n) return null;
  const t = nb.filter(j => !open.has(j) && !lit.has(j) && !buoySet.has(j));
  return t.length ? t : null;
}

// ---- CC2: THE END SCREEN + THE SHARE (pure) ---------------------------------------------------------------------------------------------

export const HEAD_CLEAR = 'COAST CLEAR', HEAD_CAUGHT = 'CAUGHT';
/** the end screen's headline */
export const headline = view => (view && view.out === 'caught' ? HEAD_CAUGHT : HEAD_CLEAR);
/** a finished run's time in ms as the SCORE counts it (whole seconds: the clock, the pauses stopped, + 30 s a spot + 15 s a pause) */
export function finalMs(view) {
  if (!view || !view.finishedAt || !view.startedAt) return 0;
  const ms = Math.max(0, view.finishedAt - view.startedAt - (view.pausedMs || 0));
  return 1000 * (Math.round(ms / 1000) + SPOT_S * Math.min(MAX_SPOTS, view.spots || 0) + PAUSE_S * (view.pauses || 0));
}
const spottedText = n => `${n} SPOTTED`;
/** the one small line under the headline: a clear "0 SPOTTED" · "1 SPOTTED · +30 s" (+ " · 1 PAUSE · +15 s") · caught "3 SPOTTED · 1:58" */
export function endLine(view) {
  if (!view) return '';
  const spots = Math.min(MAX_SPOTS, view.spots || 0);
  if (view.out === 'caught') return `${spottedText(spots)} · ${fmtClock(finalMs(view))}`;
  const bits = [spots ? `${spottedText(spots)} · +${SPOT_S * spots} s` : spottedText(0)];
  if (view.pauses) bits.push(`${view.pauses} ${view.pauses === 1 ? 'PAUSE' : 'PAUSES'} · +${PAUSE_S * view.pauses} s`);
  return bits.join(' · ');
}
/** ms until the next 4 am Eastern (the daily's turn — core/streak.js) from the Eastern clock now ({ h, mi, s } — core/week.js#easternParts) */
export { msToTurn } from '../../daily/clock.js';   // (DM1 — THE DAILY KIT's clock)
/** h:mm:ss (the countdown to the next harbor) */
export { fmtCountdown } from '../../daily/clock.js';
/** COAST CLEAR #n — days since CC_EPOCH (the same epoch as THE PASSWORD's) + 1, for a streak-day key ('d20261107') */
export function dayNumber(dayKey, epoch = CC_EPOCH) {
  const num = k => { const t = String(k).replace(/[^0-9]/g, ''); return Math.round(Date.UTC(+t.slice(0, 4), +t.slice(4, 6) - 1, +t.slice(6, 8)) / 864e5); };
  return num(dayKey) - num(epoch) + 1;
}
export const SITE = 'neonspeakeasy.com';
/** THE SHARE LINE: "COAST CLEAR #12 · 2:41 · 0 spotted · neonspeakeasy.com" · caught: "COAST CLEAR #12 · caught · 3 spotted · 1:58 · neonspeakeasy.com" */
export function shareLine(view, dayKey, site = SITE) {
  const spots = Math.min(MAX_SPOTS, (view && view.spots) || 0), t = fmtClock(finalMs(view));
  const mid = view && view.out === 'caught' ? `caught · ${spots} spotted · ${t}` : `${t} · ${spots} spotted`;
  return `COAST CLEAR #${dayNumber(dayKey)} · ${mid} · ${site}`;
}
/**
 * THE SHARE CARD's inputs — NOTHING about the board (everyone gets the same harbor: a picture would give the searchlights away): the headline,
 * the big time (a clear) or the one line, how many of the three lamps are lit, the day number, the site. share.js draws ONLY these.
 */
export function shareInputs(view, dayKey) {
  const caught = !!view && view.out === 'caught';
  return { head: headline(view), caught, time: caught ? null : fmtClock(finalMs(view)), line: endLine(view), spots: Math.min(MAX_SPOTS, (view && view.spots) || 0), dayNo: dayKey ? dayNumber(dayKey) : null, site: SITE };
}
/**
 * THE FINISHED HARBOR (the end screen's shrunk board), per cell: { k: 'open', n } · 'spot' (a light that found you) · 'light' (a light revealed
 * at the end, unbuoyed) · 'buoy' (a light you buoyed) · 'shut' (safe water never opened — a caught run) · 'miss' (a buoy on safe water)
 *   view (done, with reveal) · buoys: the phone's buoy cells
 */
export function endMap(view, buoys = []) {
  const w = view.w || W, h = view.h || H, n = w * h;
  const open = new Map(view.open || []), lit = new Set(view.lit || []), bu = new Set(buoys);
  const lights = new Set(view.reveal || []);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    if (open.has(i)) out[i] = { k: 'open', n: open.get(i) };
    else if (lit.has(i)) out[i] = { k: 'spot' };
    else if (lights.has(i) || (view.out === 'clear' && !view.reveal)) out[i] = { k: bu.has(i) || view.out === 'clear' ? 'buoy' : 'light' };
    else out[i] = { k: bu.has(i) ? 'miss' : 'shut' };
  }
  return out;
}

// ---- CC2: THE REWARDS' RULE (pure — api/_lib/cc.js#flags applies it to the SERVER's replay of its record; the unit tests + the simulation read it here)
/** the time GHOST RUN asks for, in the score's seconds (the clock, the pauses stopped, + 15 s a pause) — set by THE SIMULATION (scripts/sim-coastclear.mjs) */
export const GHOST_S = 50;
/** a finished result (replay) → its flags: { clear: 1 (LIGHTHOUSE), ghost?: 1 (GHOST RUN — zero spots, score ≤ GHOST_S) } | null (a caught run earns nothing) */
export const runFlags = r => (r && r.out === 'clear' ? { clear: 1, ...(r.spots === 0 && r.score <= GHOST_S ? { ghost: 1 } : {}) } : null);
