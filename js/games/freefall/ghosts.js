// FREEFALL — THE GHOSTS (F4B — docs/freefall.md "THE GHOSTS"; JAYWALK's ghosts.js is the pattern: STEPPED conf → run). PURE (no DOM, no
// three.js, no clock of its own). In a match everyone falls down the SAME tower, so a rival = their own input log through the SAME engine:
// their proof node's chunks (rooms/{CODE}/ff/{matchId}/{uid}/c — each chunk read ONCE as it lands).
//   · THE CONFIRMED RUN (`conf`): their LANDED moves, in order, stepped to the tick of the last one — nothing assumed.
//   · THE DRAWN RUN (`run`): from the confirmed run on to THE WORLD's TICK with their tower's ANGLE HELD (no new move assumed), the ball
//     bouncing / falling by the rules. A step that would take them OUT — or over THE FINISH — is NOT taken until their own end (`e`)
//     says so: a ghost never dies on this screen and stands up again when a late chunk lands.
//   · A LATE CHUNK = A QUICK CATCH-UP ARC, never a teleport: when confirmed news moves where they are drawn, the old place is eased into
//     the new one (CATCH_MS + a little per floor, ≤ CATCH_MAX_MS).
//   · WHERE THEY ARE DRAWN: on their REAL floor, over the SAME slice — at the world angle (the ball's angle − their tower's) + MY tower's:
//     `ghostPhi`. They turn with MY tower. They never collide with anything.
// And what a player SEES of them beside the ball itself: THE DEPTH RAIL (everyone's dot by depth), THE EDGE MARKERS (a ghost more than
// MARK_FLOORS below / MARK_UP above: "MIA ↓12" / "↑3"), WATCH THE LEADER (after an out — a delayed, exact playback: `createWatch`).
// ZERO GARBAGE IN PLAY: stepGhost + the rows fill kept records; a run's state is copied field by field (never a new object a frame).
import { createRun, stepTo, setAngle, isOver } from './engine.js';
import { TURN, BALL, MODES } from './tuning.js';
import { wrap, angDiff } from './tower-gen.js';

/** a late chunk's catch-up lasts this long (ms) + this per floor it has to close, never longer than the max */
export const CATCH_MS = 110, CATCH_FLOOR_MS = 60, CATCH_MAX_MS = 320;
/** a HELD ghost (it would go out / finish, unconfirmed) is drawn where it stood this long (ms) — the network's beat; past it: not drawn until news of it */
export const HELD_SHOW_MS = 900;
/** a ghost this many ticks past its last LANDED move with no end here = NO SIGNAL (a ball nobody steers is out in 9 s: their phone is away) */
export const SILENT_TICKS = 600;
/** the ball's own arc between two landings, in world units (pinned equal to night.js#SHAPE by tests/freefall-match.test.mjs — this file imports no view) */
export const LIFT = Object.freeze({ H: 1, HOP: 0.42 });
/** a ghost this many floors or more away from me gets an EDGE MARKER (it is off the picture) · at most this many markers each way */
export const MARK_FLOORS = 5, MARKS_MAX = 3;
/** … ABOVE me the picture ends sooner (the ball's floor lies a third down the screen: two floors up are under the HUD) */
export const MARK_UP = 2;
/** a ghost this close to my ball (floors) fades to an OUTLINE with no tag (it never hides my own ball's landing) */
export const NEAR_FLOORS = 1.2;
/** WATCH THE LEADER: the watched player is played back this many ticks behind the world (1.5 s) — a move is FINAL only at the landing
 *  after it (≤ 0.6 s) + the next flush (0.25 s) + the line: by then their moves are here, the playback is exact, tick for tick */
export const WATCH_DELAY = 90;
/** … on a slower line the delay grows with the rival's own lateness (the stage: + half a second at each rebuild), up to this (5 s) */
export const WATCH_DELAY_MAX = 300;

const FIELDS = ['t', 'st', 'a', 'pa', 'mt', 'floor', 'at', 'fl', 'pl', 'nl', 'll', 'clean', 'blaze', 'nb', 'maxNb', 'bounces', 'shatters', 'blazes', 'sf', 'sh', 'saves', 'holds', 'dk', 'dn', 'area', 'cause', 'end'];
/** a run's whole state into another run of the SAME seed + mode (their logs are never copied: the drawn run is only ever stepped) */
export function copyState(to, from) { for (let i = 0; i < FIELDS.length; i++) { const k = FIELDS[i]; to[k] = from[k]; } return to; }

/** the ball's height over its floor's top at `tau` ticks, in world units — the VIEW's arc (night.js#ballLift's own shape) */
export function liftOf(run, tau) {
  const span = run.nl - run.pl, u = span > 0 ? Math.min(1, Math.max(0, (tau - run.pl) / span)) : 1;
  if (run.st !== 'live') return 0;
  if (run.fl === 'bounce') return LIFT.HOP * 4 * u * (1 - u);
  if (run.fl === 'drop') return LIFT.HOP * 0.55 * 4 * u * (1 - u);
  return LIFT.H * (1 - u) * (1 - 0.45 * u);
}

export function createGhost(seed, mode = 'match') {
  return {
    seed, mode, conf: createRun({ seed, mode }), run: createRun({ seed, mode }), keep: createRun({ seed, mode }),
    n: 0, pt: -1, pa: 0, moves: 0,           // the chunks read · the log's own carry (the tick + the angle of the move before) · the moves landed
    lt: [], la: [],                          // their LANDED log (WATCH's playback reads it)
    done: false, bad: false, fresh: false, seen: false,   // their own end is here · a chunk the engine refused (the judge will refuse that log) · confirmed news since the last frame
    held: false, heldAt: 0,                  // the drawn run stands before a step that would end it, unconfirmed
    off: false, oa: 0, oy: 0, ot0: 0, oms: 1,   // the catch-up: the angle (units) + the height (world units) still to close, from when, for how long
    a: 0, y: 0, floor: 0, lost: false, over: false, end: '', capped: false,   // WHAT IS DRAWN: their tower's angle · the ball's height (world y) · its floor · not drawn (no news) · ended (how)
  };
}
/** the match's seed moved (THE FIRST GO landed late on this phone): the ghost starts again on it — their chunks are read again */
export function resetGhost(G, seed, mode = G.mode) {
  G.seed = seed; G.mode = mode; G.conf = createRun({ seed, mode }); G.run = createRun({ seed, mode }); G.keep = createRun({ seed, mode });
  G.n = 0; G.pt = -1; G.pa = 0; G.moves = 0; G.lt.length = 0; G.la.length = 0; G.done = false; G.bad = false; G.fresh = false; G.seen = false; G.held = false; G.off = false;
  G.a = 0; G.y = 0; G.floor = 0; G.lost = false; G.over = false; G.end = ''; G.capped = false;
}

const digit = c => (c >= 48 && c <= 57 ? c - 48 : c >= 97 && c <= 122 ? c - 87 : -1);
/** ONE chunk of the packed log (replay.js#packLog's own text, cut between two events) through the confirmed run → false = a text / a move
 *  the engine does not take as written (a hold: a match never holds). One hand-written pass — no regex, no list. */
function readChunk(G, s) {
  const cf = G.conf, n = s.length;
  let i = 0;
  while (i < n) {
    let c = s.charCodeAt(i), gap = 1;
    if (c === 46) {   // '.' + the ticks since the event before
      gap = 0; i++;
      let d = i < n ? digit(s.charCodeAt(i)) : -1;
      if (d < 0) return false;
      while (d >= 0) { gap = gap * 36 + d; i++; d = i < n ? digit(s.charCodeAt(i)) : -1; }
      c = i < n ? s.charCodeAt(i) : 0;
    }
    if (c !== 43 && c !== 45) return false;   // + / − (a '!' = a hold: never in a match)
    i++;
    let units = 0, d = i < n ? digit(s.charCodeAt(i)) : -1;
    if (d < 0) return false;
    while (d >= 0) { units = units * 36 + d; i++; d = i < n ? digit(s.charCodeAt(i)) : -1; }
    if (!(gap > 0) || !(units > 0) || units > TURN || gap > 1e7) return false;
    const t = G.pt + gap, a = wrap(G.pa + (c === 43 ? units : -units));
    if (isOver(cf)) return false;
    const want = angDiff(a, cf.a);
    if (setAngle(cf, t, a) !== want || cf.mt !== t) return false;   // (a move the engine does not take exactly as written: the judge refuses that log)
    G.pt = t; G.pa = a; G.moves++; G.lt.push(t); G.la.push(a);
  }
  return true;
}
/**
 * a rival's proof node as it stands → the chunks not read yet go through the confirmed run (each chunk ONCE); their `e` = the log is
 * complete: the run is played to its END (the tower standing still from its last move — what the judge does). → the new moves landed
 */
export function feedGhost(G, node) {
  const before = G.moves, c = node && node.c;
  if (c && !G.bad && !G.done) {
    for (let v = c[G.n]; v && typeof v.s === 'string'; v = c[G.n]) {
      if (!readChunk(G, v.s)) { G.bad = true; break; }
      G.n++;
    }
    if (G.moves > before) { stepTo(G.conf, G.pt); G.fresh = true; }   // (every landing up to their last LANDED move is decided)
  }
  if (node && node.e && !G.done) { G.done = true; if (!isOver(G.conf)) stepTo(G.conf, MODES[G.mode].capTicks); G.fresh = true; }
  return G.moves - before;
}

/**
 * ONE FRAME: the ghost to THE WORLD's TICK `tau` (a fraction into the next tick — the ball's arc is the view's); `now` = the frame's
 * time (ms — only the catch-up's + the hold's own clocks). Fills G.a · G.y · G.floor · G.lost · G.over · G.end.
 */
export function stepGhost(G, tau, now) {
  const cf = G.conf, r = G.run, target = Math.floor(tau);
  const moved = G.fresh, wasA = G.a, wasY = G.y, wasFloor = G.floor;
  // (the confirmed run may END at their last landed move's own tick — the log itself says so — a beat before their `e` is here: the
  //  drawn run then stands where it stood until the end is signalled: OUT ONLY ONCE CONFIRMED BY THEIR OWN END)
  if (moved) { G.fresh = false; if (cf.st === 'live' || G.done) { copyState(r, cf); G.held = false; } else if (!G.held) { G.held = true; G.heldAt = now; } }
  // THE DRAWN RUN: on to the world's tick with no new move assumed. A landing that would END it is not taken until their own end says so
  if (!G.held && r.st === 'live') {
    for (;;) {
      const next = r.nl <= r.dn ? r.nl : r.dn;
      if (next > target) break;
      copyState(G.keep, r);
      stepTo(r, next);
      if (r.st === 'out' || r.st === 'made') { if (!G.done) { copyState(r, G.keep); G.held = true; G.heldAt = now; } break; }
      if (r.st !== 'live') break;
    }
    if (r.st === 'live' && !G.held) stepTo(r, target);   // (only the clock + THE CAP: no landing is left before `target`)
  }
  const over = r.st !== 'live';
  G.capped = r.st === 'cap';
  G.over = over; G.end = !over ? '' : r.st === 'made' ? 'made' : r.st === 'cap' ? 'cap' : 'out';
  G.floor = r.floor;
  const a = r.a, y = -r.floor * LIFT.H + (over ? 0 : liftOf(r, G.held ? r.nl : tau));
  if (moved) {
    // (where it WAS drawn → where the news puts it: the difference is closed in a quick arc)
    const da = angDiff(wasA, a), dy = wasY - y;
    if (G.seen && (Math.abs(da) > 24 || Math.abs(dy) > 0.06)) { G.off = true; G.oa = da; G.oy = dy; G.ot0 = now; G.oms = Math.min(CATCH_MAX_MS, CATCH_MS + CATCH_FLOOR_MS * Math.abs(wasFloor - r.floor)); }
  }
  let ka = 0, ky = 0;
  if (G.off) {
    const u = (now - G.ot0) / G.oms;
    if (u >= 1) G.off = false;
    else { const v = u < 0 ? 0 : u, k = 1 - v * v * (3 - 2 * v); ka = G.oa * k; ky = G.oy * k; }
  }
  G.a = wrap(a + Math.round(ka)); G.y = y + ky;
  G.seen = true;   // (the first frame never arcs in from nowhere)
  // not drawn: held too long with no news (their signal) — or a log the judge will refuse past here
  G.lost = !over && ((G.held && now - G.heldAt > HELD_SHOW_MS) || (!G.done && target > (G.pt < 0 ? 0 : G.pt) + SILENT_TICKS));
  return G;
}
/** WHERE A GHOST IS DRAWN ROUND MY TOWER: the world angle (units, 0 = the front where MY ball is) = (the ball's angle − their tower's) + MY tower's */
export const ghostPhi = (theirA, myA) => wrap(BALL - theirA + myA);

// ---- THE DEPTH RAIL + THE EDGE MARKERS + THE PLACE (pure: rows { uid, name, floor, over, end, me })

/** your place = 1 + the players strictly deeper (a level player shares it) */
export function placeOf(rows, floor) { let p = 1; for (let i = 0; i < rows.length; i++) if (!rows[i].me && rows[i].floor > floor) p++; return p; }
// ---- F5C — THE MATCH MOMENTS (the owner, Nov 27 — JAYWALK's are the pattern: docs/jaywalk.md "THE MATCH MOMENTS")
/** RIVAL OUT: the callout's words — "MIA IS OUT" (never for my own out: I have the crash) */
export const outWords = name => `${name} IS OUT`;
/** RIVAL OUT: how long a callout stays (ms) · at most this many lines at once (a third waits for a line to leave) */
export const OUT_CALL_MS = 1500, OUT_CALL_MAX = 2;
/** LAST ONE STANDING: a match of at least this many players (me included) · the card's time (JAYWALK's LAST_MS) */
export const LAST_MIN_PLAYERS = 3, LAST_CARD_MS = 2600;
/** LAST ONE STANDING's line (lead = my floors − the deepest rival's): "+23 FLOORS AHEAD · KEEP FALLING" · "12 FLOORS TO THE LEAD · KEEP FALLING" */
export const lastWords = lead => (lead > 0 ? `+${lead} ${lead === 1 ? 'FLOOR' : 'FLOORS'} AHEAD · KEEP FALLING` : lead === 0 ? 'LEVEL WITH THE LEAD · KEEP FALLING' : `${-lead} ${lead === -1 ? 'FLOOR' : 'FLOORS'} TO THE LEAD · KEEP FALLING`);
/** LAST ONE STANDING (PURE): rows { me, over, floor } → my lead over the deepest rival when I'm the LAST still falling in a match of
 *  LAST_MIN_PLAYERS or more · null = not (yet) */
export function lastStanding(rows) {
  let me = null, n = 0, deep = -Infinity;
  for (let i = 0; i < rows.length; i++) { const r = rows[i]; n++; if (r.me) { me = r; continue; } if (!r.over) return null; if (r.floor > deep) deep = r.floor; }
  return me && !me.over && n >= LAST_MIN_PLAYERS ? me.floor - deep : null;
}
/** an edge marker's words: "MIA ↓12" (deeper than me) · "MIA ↑3" (above me) */
export const markText = (name, df) => `${name} ${df > 0 ? '↓' : '↑'}${Math.abs(df)}`;
const nearFirst = (a, b) => a.d - b.d || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0);
/**
 * THE EDGE MARKERS: the ghosts still falling that are MARK_FLOORS or more away from `floor` → `into` { up: [], down: [] } filled IN PLACE
 * with kept records { uid, name, hex, df, d, side (F5C: −1 left · 1 right — the side of the tower the rival is on), text } — nearest first, at most MARKS_MAX each way (a marker's words are built only when
 * its name / its distance changed).
 */
export function edgeMarks(rows, floor, into) {
  const up = into.up, down = into.down, pool = into.pool || (into.pool = []);
  up.length = 0; down.length = 0;
  let k = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.me || r.over || r.lost) continue;
    const df = r.floor - floor;
    if (df < MARK_FLOORS && df > -MARK_UP) continue;
    let m = pool[k]; if (!m) { m = { uid: '', name: '', hex: '', df: 0, d: 0, side: 1, text: '', tn: null, td: 0 }; pool.push(m); } k++;
    m.uid = r.uid; m.name = r.name; m.hex = r.hex; m.df = df; m.d = df < 0 ? -df : df; m.side = r.side === -1 ? -1 : 1;
    (df > 0 ? down : up).push(m);
  }
  up.sort(nearFirst); down.sort(nearFirst);
  if (up.length > MARKS_MAX) up.length = MARKS_MAX;
  if (down.length > MARKS_MAX) down.length = MARKS_MAX;
  for (const list of [up, down]) for (let i = 0; i < list.length; i++) { const m = list[i]; if (m.tn !== m.name || m.td !== m.df) { m.tn = m.name; m.td = m.df; m.text = markText(m.name, m.df); } }
  return into;
}

// ---- WATCH THE LEADER (after an out — JAYWALK's: the leader first, a tap = the next player)

const deepFirst = (a, b) => (b.floor - a.floor) || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0);
/** whom to follow: `stay` while they are still falling — else THE LEADER among the ones still falling — else the deepest of all ('' = nobody) */
export function follow(rows, stay = '') {
  let lead = null, any = null;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.me) continue;
    if (r.uid === stay && !r.over) return stay;
    if (!r.over && (!lead || deepFirst(r, lead) < 0)) lead = r;
    if (!any || deepFirst(r, any) < 0) any = r;
  }
  return lead ? lead.uid : stay && rows.some(r => r.uid === stay) ? stay : any ? any.uid : '';
}
/** a TAP = the next player: the ones still falling, deepest first, round and round (nobody still falling: everyone, deepest first) */
export function nextFollow(rows, cur) {
  let list = rows.filter(r => !r.me && !r.over);
  if (!list.length) list = rows.filter(r => !r.me);
  list.sort(deepFirst);
  if (!list.length) return '';
  const i = list.findIndex(r => r.uid === cur);
  return list[(i + 1) % list.length].uid;
}

/**
 * THE WATCHED RUN — an EXACT, delayed playback of one player's LANDED log (G.lt · G.la) on a run of its own, with its own events (the
 * view shows their tower: the broken + cracked slices, the breakthroughs). `stepWatch(W, G, tick, ev)` plays every landed move with a
 * tick ≤ `tick` and steps to it; a move that lands LATER than its tick was played (the line was slower than WATCH_DELAY) rebuilds the
 * playback from the log — rare, and never a wrong picture for more than a frame. → true = rebuilt (the caller adopts the events again)
 */
export function createWatch(seed, mode = 'match') { return { seed, mode, run: createRun({ seed, mode }), i: 0 }; }
export function stepWatch(W, G, tick, ev) {
  let rebuilt = false;
  if (W.i < G.lt.length && G.lt[W.i] <= W.run.ll && W.run.st === 'live') {   // (a landing was already decided past this move's tick: play it again from the start)
    W.run = createRun({ seed: W.seed, mode: W.mode }); W.i = 0; rebuilt = true;
    if (ev) ev.length = 0;
  }
  const r = W.run;
  while (W.i < G.lt.length && G.lt[W.i] <= tick && r.st === 'live') { setAngle(r, G.lt[W.i], G.la[W.i], ev); W.i++; }
  // (their end here: the whole run. Else the ball goes on by the rules with the tower held — and a landing that would END the run WAITS for
  //  their own `e`, the fatal landing at their last landed move's own tick too: THE FRESH-EYES REVIEW — the playback showed that out a
  //  beat before the end was signalled)
  if (r.st === 'live') {
    if (G.done) stepTo(r, tick, ev);
    else {
      let stop = false;
      while (r.st === 'live') {
        const next = r.nl <= r.dn ? r.nl : r.dn;
        if (next > tick) break;
        if (endsAt(W, r, next)) { stop = true; break; }
        stepTo(r, next, ev);
      }
      if (!stop && r.st === 'live') stepTo(r, tick, ev);   // (the clock + THE CAP)
    }
  }
  return rebuilt;
}
/** would the next landing / the darkness's next step END this run? (asked on a scratch copy — the watched run itself is never taken there unconfirmed) */
function endsAt(W, r, next) {
  const k = W.keep || (W.keep = createRun({ seed: W.seed, mode: W.mode }));
  copyState(k, r);
  stepTo(k, next);
  return k.st === 'out' || k.st === 'made';
}
