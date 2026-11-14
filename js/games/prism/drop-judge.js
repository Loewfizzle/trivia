// THE DROP — THE SERVER's JUDGE (PURE — api/_lib/drop.js wraps it with the database; the unit tests run it without one). The run is played on
// the phone (drop.js); the server holds a SMALL record and checks every upload by REPLAYING it through the same pure steps:
//
//   dly/drop/{day}/p/{pid} = { st (the server's start), go (= st + COUNT_MS: tick 0), len (the log's length so far), k (its tick), t, ln, pc,
//                              sv (the run's exact snapshot at k — drop.js#snapshot), ca (the server time of the last checkpoint),
//                              pz: { n (player pauses used), ms (their time, closed), at? (an open pause's start), kd? 'p' | 'r', rf? (a refresh) },
//                              rz (closed room-pause time), e? 1 (ended) + o ('top' | 'end' | 'abandoned' | 'late' | 'pause_over'), ft, fl, fa }
//   dly/drop/{day}/l/{pid}/{offset} = a log CHUNK (written once, keyed by where it starts — a repeat overwrites itself; the finish reads them)
//
// THE CLOCK: the engine time a real-time run is at = now − go − every pause (the server's own stamps). Each upload's tick must be inside
// [due − SLOW_TOL_MS, due + FAST_TOL_MS]: AHEAD of the clock = a log built faster than real time (refused); far BEHIND = a run played in slow
// motion (or a finish that arrived late) → the run is ENDED at its real-time bound (the last checkpoint + MAX_TAIL_MS of play, never more).
// PAUSES: 3 PLAYER pauses a run, 20 min in all (a refresh / a resume costs one — no checkpoint save-scumming); a ROOM pause (THE ROOM WINS —
// the api checks the room) uses none of the 3 (its own ROOM_MAX_MS). While paused only `resume` (or another pause call) is answered.
import { replay, snapshot, scoreOf, ticksOf, tickTime, COUNT_MS, END_TICK, LOG_MAX, DROP_END_MS } from './drop.js';

export const PAUSES = 3;
export const PAUSE_MS = 20 * 60_000;
export const ROOM_MAX_MS = 60 * 60_000;
export const FAST_TOL_MS = 4000;      // an upload's engine time may run this far ahead of the server's clock (its latency + the phone's clock offset)
export const SLOW_TOL_MS = 20_000;    // … and arrive this far behind it (a slow upload) — further = slow motion / a late finish → ended at the bound
export const MAX_TAIL_MS = 15_000;    // a late / slowed run keeps at most this much play past its last real-time checkpoint
export const CHUNK_MAX = 24_000;      // one upload's chars (the phone sends every ~6 s — an honest chunk is a few hundred)
export const CK_MS = 6000;            // the phone's checkpoint rhythm
export const ABANDON_MS = PAUSE_MS + ROOM_MAX_MS + DROP_END_MS;   // a run silent this long can never come back

export function newRecord(st) {
  return { st, go: st + COUNT_MS, len: 0, k: 0, t: 0, ln: 0, pc: 0, ca: st, pz: { n: 0, ms: 0 }, rz: 0 };
}
const pzOf = rec => ({ n: 0, ms: 0, ...((rec && rec.pz) || {}) });
export const isPaused = rec => !!rec && rec.pz && rec.pz.at != null;
/** every pause's time so far (the open one up to now) */
export function pausedMs(rec, now) {
  const pz = pzOf(rec);
  return (pz.ms || 0) + (rec.rz || 0) + (pz.at != null ? Math.max(0, now - pz.at) : 0);
}
/** the engine time a real-time run is at now */
export const dueMs = (rec, now) => now - rec.go - pausedMs(rec, now);
/** what the phone needs to hold its clock: the origin + the pauses so far */
export function clockOf(rec, now) {
  const pz = pzOf(rec);
  return { go: rec.go, pm: (pz.ms || 0) + (rec.rz || 0), pa: pz.at != null ? pz.at : null, kd: pz.kd || null, left: Math.max(0, PAUSES - (pz.n || 0)), ml: Math.max(0, PAUSE_MS - (pz.ms || 0)), now };
}

function end(rec, o, now, extra = {}) {
  return { ...rec, ...extra, e: 1, o, ft: extra.t != null ? extra.t : rec.t, fl: extra.ln != null ? extra.ln : rec.ln, fa: now };
}
/** close an open pause → the record (an over-budget pause ENDS the run at its last checkpoint) */
function closePause(rec, now) {
  const pz = pzOf(rec);
  if (pz.at == null) return rec;
  const dur = Math.max(0, now - pz.at);
  const { at, kd, rf, ...rest } = pz;
  void at; void rf;
  if (kd === 'r') {
    const rz = (rec.rz || 0) + dur;
    const next = { ...rec, pz: rest, rz };
    return rz > ROOM_MAX_MS ? end(next, 'pause_over', now) : next;
  }
  const ms = (pz.ms || 0) + dur;
  const next = { ...rec, pz: { ...rest, ms } };
  return ms > PAUSE_MS ? end(next, 'pause_over', now) : next;
}

/**
 * A run's upload (a checkpoint, or the chunk a pause / the final carries): the chunk replayed from the record's snapshot → the next record.
 * body: { at (the chunk's offset), add (the chunk), k (the tick it reaches), fin? (the run is over at k) } · seed · now
 * → { record, resp } | { refused, status } | { resync } (the offset isn't the server's: the phone resends from `len`)
 */
export function upload(rec, body, { seed, now }) {
  if (rec.e) return { refused: 'done', status: 409 };
  const add = body && typeof body.add === 'string' ? body.add : '';
  const at = Number(body && body.at), k = Number(body && body.k);
  if (!Number.isInteger(k) || k < 0 || k > END_TICK) return { refused: 'bad_upload', status: 400 };
  if (add.length > CHUNK_MAX || rec.len + add.length > LOG_MAX) return { refused: 'too_big', status: 422 };
  if (at !== rec.len) return { resync: true };
  if (k < rec.k) return { refused: 'out_of_order', status: 409 };
  if (k === rec.k && !add && !body.fin) return { record: null };           // (nothing new — free)
  const due = dueMs(rec, now);
  if (tickTime(k) > due + FAST_TOL_MS) return { refused: 'too_early', status: 422 };
  // (the chunk is checked alone, from the snapshot: the replay sees `len` chars of an imagined prefix — only `add` is read)
  const pad = ' '.repeat(rec.len);
  const late = due - tickTime(k) > SLOW_TOL_MS;
  if (late) {
    // SLOW MOTION / A LATE FINISH: the run keeps its real-time play — up to the last checkpoint + MAX_TAIL_MS — and ends there
    const cut = Math.min(k, ticksOf(rec.t + MAX_TAIL_MS));
    const R = replay(pad + add, seed, { from: rec.sv || null, to: null, cut, final: false });
    if (!R.ok) return { refused: R.refused, status: 422 };
    return { record: end({ ...rec, len: rec.len + add.length, sv: snapshot(R.run), k: R.k, t: R.t, ln: R.lines, pc: R.pieces, ca: now }, 'late', now, { t: R.t, ln: R.lines }), resp: { k: R.k, e: 1, o: 'late' }, keep: true };
  }
  const R = replay(pad + add, seed, { from: rec.sv || null, to: k, final: !!body.fin });
  if (!R.ok) return { refused: R.refused, status: 422 };
  let next = { ...rec, len: rec.len + add.length, sv: snapshot(R.run), k: R.k, t: R.t, ln: R.lines, pc: R.pieces, ca: now };
  if (R.over) next = end(next, R.why, now, { t: R.t, ln: R.lines });
  return { record: next, resp: { k: R.k, len: next.len, ...(next.e ? { e: 1, o: next.o } : {}) }, keep: true };
}

/**
 * ONE move (api/daily.js's generic path — inside a transaction on the record):
 *   checkpoint { at, add, k, fin? } · ppause { at, add, k } (a PLAYER pause — one of the 3) · pause { at, add, k } (THE ROOM WINS — the api has
 *   checked the room: `room`) · resume {}
 * → { record (null = nothing changed), resp } | { refused, status }
 */
export function act({ action, body, record, now, seed, room = false }) {
  let rec = record;
  if (!rec) return { refused: 'not_started', status: 409 };
  if (rec.e) return { refused: 'done', status: 409 };
  const answer = (r, extra = {}) => ({ record: r === record ? null : r, resp: { ...extra, ...clockOf(r, now), ...(r.e ? { e: 1, o: r.o, k: r.k } : { k: r.k, len: r.len }) } });
  if (action === 'resume') {
    if (!isPaused(rec)) return answer(rec);
    return answer(closePause(rec, now));
  }
  if (action !== 'checkpoint' && action !== 'ppause' && action !== 'pause') return { refused: 'bad_action', status: 400 };
  // while paused nothing but a resume moves the run (a second pause call is answered with the pause as it is — free)
  if (isPaused(rec)) {
    if (action === 'checkpoint') return { refused: 'paused', status: 409 };
    return answer(rec);
  }
  // the chunk first (a pause carries the log up to the tap — the freshest checkpoint)
  if (body && (body.add || body.k != null)) {
    const u = upload(rec, body, { seed, now });
    if (u.resync) return { record: null, resp: { resync: true, len: rec.len, k: rec.k, ...clockOf(rec, now) } };
    if (u.refused) return u;
    if (u.record) rec = u.record;
    if (rec.e) return answer(rec);
  }
  if (action === 'checkpoint') return answer(rec);
  const pz = pzOf(rec);
  if (action === 'ppause') {
    if ((pz.n || 0) >= PAUSES || (pz.ms || 0) >= PAUSE_MS) return rec === record ? { refused: 'pause_limit', status: 409 } : { record: rec, resp: { ...answer(rec).resp, refusedPause: 'pause_limit' } };
    return answer({ ...rec, pz: { ...pz, n: (pz.n || 0) + 1, at: now, kd: 'p' } });
  }
  // THE ROOM WINS (DM1): free — its own cap
  if (!room) return { refused: 'no_room_game', status: 409 };
  if ((rec.rz || 0) >= ROOM_MAX_MS) return { refused: 'pause_limit', status: 409 };
  return answer({ ...rec, pz: { ...pz, at: now, kd: 'r' } });
}

/**
 * THE START on a run that already exists (api/daily.js — the generic `begin`): the very first start makes the record; a start on a run in flight
 * is a RESUME (a refresh / a dead phone): back at its LATEST checkpoint, the time since then a PLAYER PAUSE — one of the 3 (backdated to the
 * checkpoint's moment, so the clock never runs ahead of the board). No pause left / over the 20 minutes → the run ENDS at its last checkpoint.
 * A run already paused (a pause, a room's) resumes into that pause — no extra cost. A repeat of the first start (its answer lost) is free.
 * → the record to store (unchanged = the same object)
 */
export function begin(record, { startedAt, now }) {
  if (!record) return newRecord(startedAt);
  const rec = record;
  if (rec.e || isPaused(rec)) return rec;
  if (rec.k === 0 && rec.len === 0 && now - rec.st < COUNT_MS + 8000) return rec;   // (the first start again — its answer was lost)
  const due = dueMs(rec, now), gap = Math.max(0, due - rec.t);
  const pz = pzOf(rec);
  if ((pz.n || 0) >= PAUSES || (pz.ms || 0) + gap > PAUSE_MS) return end(rec, 'abandoned', now);
  return { ...rec, pz: { ...pz, n: (pz.n || 0) + 1, at: now - gap, kd: 'p', rf: 1 } };
}

/** an unfinished run that can never come back (THE DAY'S CLOSE + the next call end it at its last checkpoint): silent past every budget, or
 *  a resume could no longer be granted */
export function abandoned(rec, now) {
  if (!rec || rec.e) return false;
  if (now - (rec.ca || rec.st) > ABANDON_MS) return true;
  if (isPaused(rec)) {
    const pz = pzOf(rec), dur = now - pz.at;
    return pz.kd === 'r' ? (rec.rz || 0) + dur > ROOM_MAX_MS : (pz.ms || 0) + dur > PAUSE_MS;
  }
  const pz = pzOf(rec), gap = Math.max(0, dueMs(rec, now) - rec.t);
  return gap > SLOW_TOL_MS && ((pz.n || 0) >= PAUSES || (pz.ms || 0) + gap > PAUSE_MS);
}
export const abandon = (rec, now) => end(rec, 'abandoned', now);

/**
 * THE SCORE at the finish: the WHOLE log (its chunks put back together) replayed from the start to the record's tick — the record's own t + lines
 * must come out again — + THE SLOW-MOTION CHECK (the wall clock start → the last upload ≥ the engine time − the pauses − FAST_TOL_MS).
 * → { score, t, lines, ms (the replay's cost) } | { refused }
 */
export function judgeFinish(rec, log, { seed }) {
  if (!rec || !rec.e) return { refused: 'not_done' };
  if (typeof log !== 'string' || log.length !== rec.len) return { refused: 'log_missing' };
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const final = rec.o === 'top' || rec.o === 'end';
  const R = rec.o === 'late' ? replay(log, seed, { cut: rec.k }) : replay(log, seed, { to: rec.k, final });
  const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
  if (!R.ok) return { refused: R.refused, ms };
  if (R.k !== rec.k || R.lines !== rec.fl || Math.abs(R.t - rec.ft) > 1e-6) return { refused: 'mismatch', ms };
  const wall = (rec.fa || rec.ca) - rec.go - ((pzOf(rec).ms || 0) + (rec.rz || 0));
  if (R.t > wall + FAST_TOL_MS) return { refused: 'too_fast', ms };
  return { score: scoreOf(R.t, R.lines), t: R.t, lines: R.lines, ms };
}

/** the chunks (dly/drop/{day}/l/{pid} = { [offset]: chunk }) → the log the record covers, put back in order | null. Every chunk an honest phone
 *  sends is a piece of ONE growing log, so a resend at an old offset may be LONGER (its answer was lost, the log had grown): the join takes,
 *  at each point, the chunk reaching furthest, and cuts the result at the CHECKED length (anything past it was never checked) */
export function joinChunks(chunks, len) {
  const list = Object.entries(chunks || {}).map(([k, v]) => [Number(k), v]).filter(([o, v]) => Number.isInteger(o) && o >= 0 && typeof v === 'string' && v.length);
  let s = '';
  while (s.length < len) {
    let best = null;
    for (const [o, v] of list) if (o <= s.length && o + v.length > s.length && (!best || o + v.length > best[0] + best[1].length)) best = [o, v];
    if (!best) return null;
    s += best[1].slice(s.length - best[0]);
  }
  return s.slice(0, len);
}
