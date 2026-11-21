// FROZEN (JAYWALK J2, Nov 21 2026): COURSE RULES v1 exactly as they shipped (28972e7b) — tests/jaywalk-v1-frozen.test.mjs checks that
// js/games/jaywalk/ with cv = 1 builds + replays every lane byte-for-byte like this copy. NEVER EDIT THIS FOLDER.
// JAYWALK — THE ENGINE (H1 — docs/jaywalk.md): FIXED-STEP TICKS (tuning.js#TICK_HZ = 60 a second). The KID's state is the only thing
// stepped — a hop in flight, riding a log, the wall behind them, alive / out / taken (H4 — ONE LIFE EVERYWHERE: one hit = out; no lives, no
// respawn, no blink, no one-up); every hazard is a pure function of
// (lane, tick) (course.js). THE ONLY INPUT is THE HOP LOG: [{ t: tick, d: 'u' | 'l' | 'r' | 'd' }]. The phone's live run and the server's
// replay run THIS code. PURE: no DOM, no three.js, never Math.random / Date.now / performance.now / a frame clock; integers + Math.floor only.
import { FP, COLS, WIDTH, MID_COL, HOP_TICKS, MODES, WALL, wallPace, KID_HALF, LOOP_LANES, MIN_INPUT_GAP, DIRS, MAX_INPUTS_PER_SEC, MAX_LOG, TICK_HZ, SPLIT_EVERY } from './tuning.js';
import { laneHit, logUnder, carNear, ufoX, ufoY, mod } from './course.js';

const colOf = x => { const c = Math.floor(x / FP); return c < 0 ? 0 : c >= COLS ? COLS - 1 : c; };

/** a new run — ONE LIFE (H4): the first hit ends it */
export function createRun({ seed, mode = 'solo' } = {}) {
  const M = MODES[mode];
  if (!M) throw new Error(`jaywalk: unknown mode ${mode}`);
  return {
    seed: String(seed), mode,
    t: 0, st: 'idle',                       // 'idle' | 'hop' | 'out' | 'taken'
    x: MID_COL * FP + FP / 2, y: 0,         // the kid: centre x (FP), lane
    fx: 0, fy: 0, tx: 0, ty: 0, k: 0,       // a hop in flight: from → to, k of HOP_TICKS
    buf: '',                                // ONE buffered hop
    best: 0, bestT: 0,                      // the farthest lane LANDED on + its tick (the ranking: lanes, then the earlier tick)
    sp: [],                                 // J1 — SPLIT TIMES: sp[i] = the tick lane (i + 1) × SPLIT_EVERY was FIRST landed on
    wall: WALL.start, cause: '', end: -1, hits: 0,
    bbBand: -1, bbK: 0, boom: 0,            // THE BLACKBIRD's moment: standing on its lane when the tell began → hopped clear
    near: {}, took: {}, beam: -1,           // THE UFO's: the ones whose beam swept beside the kid · the ones that took them
    carKey: -1,                             // (the near-miss event's latch)
  };
}
export const isOver = run => run.st === 'out' || run.st === 'taken';

/** ONE HIT = OUT */
function hit(run, cause, lane, x, T, ev) {
  run.cause = cause; run.hits = 1; run.bbBand = -1; run.buf = '';
  run.x = x < 0 ? 0 : x > WIDTH ? WIDTH : x; run.y = lane;
  run.st = 'out'; run.end = T;
  if (ev) ev.push({ e: 'out', cause, lane });
}

function startHop(run, course, d, ev) {
  const from = course.lane(run.y);
  let ty = run.y, tx = run.x;
  if (d === 'u') ty++; else if (d === 'd') ty--; else if (d === 'l') tx -= FP; else tx += FP;
  const side = ty === run.y, to = side ? from : ty >= 0 ? course.lane(ty) : null;
  let ok = !!to;
  if (ok && to.type !== 'water') {
    const c = Math.floor(tx / FP);
    if (side && (c < 0 || c >= COLS)) ok = false;   // (the screen's edge)
    else { const col = colOf(tx); if (to.type === 'grass' && to.obs[col]) ok = false; else tx = col * FP + FP / 2; }   // (off a log: snapped to its column)
  } else if (ok && (tx < 0 || tx > WIDTH)) ok = false;   // (on the water the kid keeps their place along the log — never past the edge)
  if (!ok) { if (ev) ev.push({ e: 'bump', d }); return; }
  run.fx = run.x; run.fy = run.y; run.tx = tx; run.ty = ty; run.k = 0; run.st = 'hop';
  if (ev) ev.push({ e: 'hop', d });
}

function land(run, course, T, ev) {
  run.x = run.tx; run.y = run.ty; run.st = 'idle';
  const lane = course.lane(run.y);
  if (lane.type === 'water') {
    const j = logUnder(lane, T, run.x);
    if (j < 0) { hit(run, 'water', run.y, run.x, T, ev); return; }
    if (ev) ev.push({ e: 'land', on: j < 0 ? 'water' : 'wood' });
  } else if (ev) ev.push({ e: 'land', on: 'ground' });
  if (run.y > run.best) {
    run.best = run.y; run.bestT = T;
    if (run.y % SPLIT_EVERY === 0) run.sp.push(T);   // (J1: `best` climbs one lane at a time — every multiple is landed on exactly once)
    if (ev) { ev.push({ e: 'best', lane: run.y }); if (lane.mark) ev.push({ e: 'landmark', lane: run.y, name: lane.mark }); }
  }
  if (run.buf) { const b = run.buf; run.buf = ''; startHop(run, course, b, ev); }
}

/**
 * ONE TICK. `d` = this tick's hop ('' = none); `ev` (optional) collects the EVENTS for the view + the sounds:
 *   hop { d } · bump { d } · land { on: 'ground' | 'wood' | 'water' } · best { lane } · landmark { lane, name } · near { lane } (a car within a
 *   cell) · beam { id } (THE UFO's beam beside the kid) · boom (THE BLACKBIRD passed the lane they hopped clear of) · out { cause, lane } ·
 *   taken { lane }
 * (the WORLD's own moments — a train's tell, THE BLACKBIRD's tell + pass — are pure functions of (lane, tick): course.js#pulseAt.)
 */
export function step(run, course, d, ev) {
  if (run.st === 'out' || run.st === 'taken') return run;
  const M = MODES[run.mode];
  // THE MOTHERSHIP: everyone still standing is taken at its fixed tick — never in solo endless
  if (M.cap && run.t >= M.cap) { run.st = 'taken'; run.end = run.t; run.cause = 'taken'; if (ev) ev.push({ e: 'taken', lane: run.best }); return run; }
  const T = run.t + 1;
  if (d) { if (run.st === 'idle') startHop(run, course, d, ev); else if (run.st === 'hop' && !run.buf) run.buf = d; }

  if (run.st === 'hop') { if (++run.k >= HOP_TICKS) land(run, course, T, ev); }
  else if (run.st === 'idle') {
    const lane = course.lane(run.y);
    if (lane.type === 'water') {
      if (logUnder(lane, run.t, run.x) >= 0) {
        run.x += lane.dir * lane.v;   // (riding: carried with the log)
        if (run.x < 0 || run.x > WIDTH) hit(run, 'edge', run.y, run.x, T, ev);
      } else hit(run, 'water', run.y, run.x, T, ev);
    }
  }

  // THE WALL: a steady pace, never more than a few lanes behind the kid's best
  let w = run.wall + wallPace(run.mode, T);
  const floorW = (run.best - WALL.behind) * FP;
  if (w < floorW) w = floorW;
  run.wall = w;

  if (run.st === 'idle' || run.st === 'hop') {
    // where the kid IS this tick: a hop moves in a straight line; its lane is the one it left for the first half, the one it lands on after
    let cx = run.x, cy = run.y, yc = run.y * FP + FP / 2;
    if (run.st === 'hop') {
      cx = run.fx + Math.floor((run.tx - run.fx) * run.k / HOP_TICKS);
      cy = run.k * 2 >= HOP_TICKS ? run.ty : run.fy;
      yc = run.fy * FP + FP / 2 + Math.floor((run.ty - run.fy) * FP * run.k / HOP_TICKS);
    }
    const lane = course.lane(cy);
    let cause = '';
    if (cy * FP + FP / 2 < w) cause = 'wall';
    else cause = laneHit(lane, T, cx);
    let ufoId = -1;
    if (lane.ufo) {
      const u = lane.ufo, dx = cx - ufoX(u, T), dy = yc - ufoY(u, T), d2 = dx * dx + dy * dy;
      if (d2 <= u.r * u.r) { if (!cause) { cause = 'ufo'; ufoId = u.id; } }
      else if (d2 <= (u.r + FP) * (u.r + FP)) {   // (the beam swept the cell beside them)
        if (!cause) { run.near[u.id] = 1; if (run.beam !== u.id) { run.beam = u.id; if (ev) ev.push({ e: 'beam', id: u.id }); } }
      } else if (run.beam === u.id) run.beam = -1;
    } else run.beam = -1;
    if (cause) {
      if (ufoId >= 0) run.took[ufoId] = 1;
      hit(run, cause, cy, cx, T, ev);
    } else {
      if (lane.type === 'road') {
        const j = carNear(lane, T, cx, KID_HALF + FP), key = j < 0 ? -1 : cy * 64 + j;
        if (key >= 0 && key !== run.carKey && ev) ev.push({ e: 'near', lane: cy });
        run.carKey = key;
      } else run.carKey = -1;
      // THE BLACKBIRD's moment: on its lane when the tell begins → off the band for the whole pass, never hit
      if (lane.type === 'flight' && run.bbBand < 0) {
        const p = lane.pulse;
        if (mod(T - p.phase, p.period) === p.period - p.tell) { run.bbBand = p.band; run.bbK = Math.floor((T - p.phase) / p.period) + 1; }
      }
      if (run.bbBand >= 0) {
        const p = course.lane(run.bbBand).pulse, k = Math.floor((T - p.phase) / p.period), u = mod(T - p.phase, p.period);
        if (k > run.bbK || (k === run.bbK && u >= p.pass)) { run.boom = 1; run.bbBand = -1; if (ev) ev.push({ e: 'boom' }); }
        else if (k === run.bbK && cy >= p.band && cy < p.band + p.n) run.bbBand = -1;   // (still on it as it passed: no moment)
      }
    }
  }
  run.t = T;
  return run;
}

/** where the kid is drawn BETWEEN ticks (the view interpolates; the rules never read the frame clock): a = 0 … 1 into the next tick → { x, y } in cells */
export function kidAt(run) {
  if (run.st !== 'hop') return { x: run.x / FP, y: run.y + 0.5, k: 0 };
  const f = run.k / HOP_TICKS;
  return { x: (run.fx + (run.tx - run.fx) * f) / FP, y: run.fy + 0.5 + (run.ty - run.fy) * f, k: f };
}

/** the run's RESULT — what the phone shows and the server's replay returns (the same code) */
export function resultOf(run) {
  const ids = Object.keys(run.near);
  return {
    lanes: run.best, tick: run.bestT, end: run.end, over: isOver(run),
    splits: run.sp.slice(),                                           // (J1 — SPLIT TIMES: [tick to 50, tick to 100, …] — only the ones reached)
    y: run.y, x: run.x,                                               // (where the kid is / went out — the end screen names what hit them: causes.js)
    cause: run.st === 'taken' ? 'taken' : run.cause, taken: run.st === 'taken', hits: run.hits,
    feats: {
      boom: run.boom === 1,                                           // jaywalk-boom
      ufo: ids.some(id => !run.took[id]),                             // jaywalk-ufo: its beam swept beside them and THAT UFO never took them
      airfield: run.best >= LOOP_LANES,                               // jaywalk-airfield: lane 400 in ONE run — solo OR match (H6A)
      mothership: run.st === 'taken',                                 // jaywalk-mothership (H6A): still in when THE MOTHERSHIP arrives (solo has none)
    },
  };
}

/**
 * THE HOP LOG's BOUNDS — ONE FUNCTION for the phone's recorder AND the judge (replay.js#logProblem): may entry `i` of `log` (tick `t`,
 * way `d`) stand? → null, or why not. (The go-live review: the recorder knew only the 2-tick gap — a tap in the Mothership's own tick,
 * or 21 taps in a second, wrote a log the judge refused WHOLE. An input the recorder does not log is not played either.)
 */
export function inputProblem(log, i, t, d, mode = 'solo') {
  const M = MODES[mode];
  if (!M) return 'mode';
  if (!Number.isInteger(t) || t < 0 || !DIRS.includes(d)) return 'entry';
  if (i >= (M.cap ? Math.min(MAX_LOG, Math.floor(M.cap / MIN_INPUT_GAP)) : MAX_LOG)) return 'too long';
  if (i && t <= log[i - 1].t) return 'ticks not rising';
  if (i && t - log[i - 1].t < MIN_INPUT_GAP) return 'too fast';
  if (M.cap && t >= M.cap) return 'past the cap';
  if (i >= MAX_INPUTS_PER_SEC && t - log[i - MAX_INPUTS_PER_SEC].t < TICK_HZ) return 'too fast';
  return null;
}
/** the phone's recorder: may this input be logged (and so played) at this tick of a `mode` run? */
export const canLog = (log, tick, d, mode = 'solo') => inputProblem(log, log.length, tick, d, mode) === null;
