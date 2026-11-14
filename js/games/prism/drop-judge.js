// THE DROP — THE SERVER's JUDGE (PURE — api/_lib/drop.js wraps it with the database; the unit tests run it without one). The run is played on
// the phone (drop.js); the server holds a SMALL record. THE ADD-ON (the city chat's cost check, Nov 13): a checkpoint is only SIZE- / ORDER- /
// TIME-bounded on arrival — the RE-PLAY CHECK runs ONCE per run: at its finish, or when an abandoned run is closed at its last checkpoint.
//
//   dly/drop/{day}/p/{pid} = { st (the server's start), go (= st + COUNT_MS: tick 0), len (the log's length so far), k (the tick it claims),
//                              t (= k's engine time), ca (the server time of the last checkpoint),
//                              pz: { n (player pauses used), ms (their time, closed), at? (an open pause's start), kd? 'p' | 'r', rf? (a refresh) },
//                              rz (closed room-pause time), e? 1 (ended) + o ('fin' (the phone's top-out / THE END) | 'abandoned' | 'late' |
//                              'pause_over'), fa (the end's server time) }   ≈ 250 bytes
//   dly/drop/{day}/l/{pid}/{offset} = a log CHUNK (written once, keyed by where it starts — a repeat overwrites itself; the finish reads them)
//   (THE PRUNE — api/_lib/drop.js#prune: once the day's board is final, only the top runs keep their record + log, for 7 days)
//
// THE CLOCK: the engine time a real-time run is at = now − go − every pause (the server's own stamps). Each upload's tick must be inside
// [due − SLOW_TOL_MS, due + FAST_TOL_MS]: AHEAD of the clock = a log built faster than real time (refused); far BEHIND = a run played in slow
// motion (or a finish that arrived late) → the run is ENDED at its real-time bound (the last checkpoint + MAX_TAIL_MS of play, never more).
// PAUSES: 3 PLAYER pauses a run, 20 min in all (a refresh / a resume costs one — no checkpoint save-scumming); a ROOM pause (THE ROOM WINS —
// the api checks the room) uses none of the 3 (its own ROOM_MAX_MS). While paused only `resume` (or another pause call) is answered.
import { replay, scoreOf, ticksOf, tickTime, COUNT_MS, END_TICK, LOG_MAX, DROP_END_MS, CODES } from './drop.js';

export const PAUSES = 3;
export const PAUSE_MS = 20 * 60_000;
export const ROOM_MAX_MS = 60 * 60_000;
export const FAST_TOL_MS = 4000;      // an upload's engine time may run this far ahead of the server's clock (its latency + the phone's clock offset)
export const SLOW_TOL_MS = 20_000;    // … and arrive this far behind it (a slow upload) — further = slow motion / a late finish → ended at the bound
export const MAX_TAIL_MS = 15_000;    // a late / slowed run keeps at most this much play past its last real-time checkpoint
export const CHUNK_MAX = 24_000;      // one upload's chars (an honest 30-s chunk is ~1–3 K)
export const CK_MS = 30_000;          // the phone's checkpoint rhythm (THE ADD-ON: ~every 30 s of play + a pause / the page hiding — ≲ 30 calls a run)
const LOG_CHARS = new RegExp(`^[0-9${CODES}]*$`);
export const ABANDON_MS = PAUSE_MS + ROOM_MAX_MS + DROP_END_MS;   // a run silent this long can never come back

export function newRecord(st) {
  return { st, go: st + COUNT_MS, len: 0, k: 0, t: 0, ca: st, pz: { n: 0, ms: 0 }, rz: 0 };
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
  return { ...rec, ...extra, e: 1, o, fa: now };
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
 * A run's upload (a checkpoint, or the chunk a pause / the final carries) — NO REPLAY (THE ADD-ON): only bounded on arrival —
 *   SIZE: a chunk ≤ CHUNK_MAX, the log ≤ LOG_MAX, only a log's characters · ORDER: at its offset (else resync), its tick never backwards ·
 *   TIME: the tick never AHEAD of the server's clock + FAST_TOL_MS (a log built faster than real time → refused); far BEHIND it (slow motion /
 *   a late finish) → the run ENDS at the last checkpoint + MAX_TAIL_MS of play (the finish's replay stops there — `o: 'late'`).
 * body: { at, add, k, fin? (the run is over at k — the finish replays it to there) } · now
 * → { record, resp } | { refused, status } | { resync }
 */
export function upload(rec, body, { now }) {
  if (rec.e) return { refused: 'done', status: 409 };
  const add = body && typeof body.add === 'string' ? body.add : '';
  const at = Number(body && body.at), k = Number(body && body.k);
  if (!Number.isInteger(k) || k < 0 || k > END_TICK) return { refused: 'bad_upload', status: 400 };
  if (add.length > CHUNK_MAX || rec.len + add.length > LOG_MAX) return { refused: 'too_big', status: 422 };
  if (!LOG_CHARS.test(add)) return { refused: 'bad_log', status: 422 };
  if (at !== rec.len) return { resync: true };
  if (k < rec.k) return { refused: 'out_of_order', status: 409 };
  if (k === rec.k && !add && !body.fin) return { record: null };           // (nothing new — free)
  const due = dueMs(rec, now);
  if (tickTime(k) > due + FAST_TOL_MS) return { refused: 'too_early', status: 422 };
  const len = rec.len + add.length;
  // (THE DROP B — AWAY WITH NO PAUSE LEFT: the phone was hidden past the bound with its 3 pauses spent — it says so (`aw`) and the server checks
  //  it against ITS clock: the time since the last checkpoint really is past SLOW_TOL_MS → the same end as a slowed run, at the last checkpoint
  //  + MAX_TAIL_MS of play. Ending your own run early is only ever a loss — the replay still stops at the cut)
  const away = !!(body && body.aw) && due - rec.t > SLOW_TOL_MS;
  if (away || due - tickTime(k) > SLOW_TOL_MS) {
    const cut = Math.max(rec.k, Math.min(k, ticksOf(rec.t + MAX_TAIL_MS)));
    const next = end({ ...rec, len, k: cut, t: tickTime(cut), ca: now }, 'late', now);
    return { record: next, resp: { k: cut, len, e: 1, o: 'late' } };
  }
  let next = { ...rec, len, k, t: tickTime(k), ca: now };
  if (body.fin) next = end(next, 'fin', now);
  return { record: next, resp: { k, len, ...(next.e ? { e: 1, o: next.o } : {}) } };
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
    const u = upload(rec, body, { now });
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
 * THE SCORE — THE RE-PLAY CHECK, ONCE per run (the finish, or the close of an abandoned run): the WHOLE log (its chunks put back together)
 * replayed from the start — a phone's top-out to its claimed tick (it MUST be over there); a late run to its cut; an abandoned / over-paused run
 * to its last checkpoint — + THE SLOW-MOTION CHECK (the engine time ≤ the wall clock start → the last upload − the pauses + FAST_TOL_MS).
 * → { score, t, lines, ms (the replay's cost) } | { refused }
 */
export function judgeFinish(rec, log, { seed }) {
  if (!rec || !rec.e) return { refused: 'not_done' };
  if (typeof log !== 'string' || log.length !== rec.len) return { refused: 'log_missing' };
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const R = rec.o === 'fin' ? replay(log, seed, { to: rec.k, final: true }) : replay(log, seed, { cut: rec.k });
  const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
  if (!R.ok) return { refused: R.refused, ms };
  if (R.k !== rec.k) return { refused: 'mismatch', ms };
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
