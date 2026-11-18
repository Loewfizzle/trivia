// POST /api/daily { action, … } — THE DAILY CONTRACT (PROGRESSION A; core/daily.js) + THE DAILY MODULE's ENGINE (DM1). Signed-in players with
// a profile; no database socket on the phone (THE PARKED DATABASE — a solo daily is /api only).
//   start  { game }            → { day, seed, startedAt, done? }      ONE OFFICIAL TRY: the first start is recorded (a refresh = the same try)
//                                 a JUDGED daily (PW1 — THE PASSWORD, _lib/pw.js: cart.judged) gets { day, startedAt, done?, run } instead — the run so
//                                 far from the SERVER's record (a resume), and NO seed (a seed a phone holds must say nothing about the answers)
//   ended  { game }            → { day, done, run, e? }   FIXES R2 — TAP A TICKET: YOUR OWN finished run of today for its end screen (read-only;
//                                 409 not_finished while unfinished — never a start; THE DROP: its final board, never its log)
//   guess  { game, word }      → { door, n, marks, solved?, failed?, word? (that door just closed), next?, done? }   a judged daily only: the server
//                                 judges every guess inside a transaction on its record; a word that isn't one is refused with NO cost (422 not_a_word)
//   dig / chord / pause / resume { game, … }  (CC1 — COAST CLEAR, _lib/cc.js: a judged cartridge's `moves`) → the cartridge's answer, ONE transaction
//                                 on its record each (a repeat is free: nothing written); every judged answer carries the server's `now` (the phone's clock)
//                                 DM1 — THE ROOM WINS: `pause { room? }` only while the player's room has really started a game (_lib/daily-room.js) — else 409 no_room_game
//   finish { game, result }    → { day, score, counted, stand: { n, pct, top, band }, outcome: { streak, items, ach, xp, lv, swept } }   checked + stored
//                                 server-side (a judged daily scores from ITS record — the phone's result is ignored; an unfinished run → 409 not_done)
//                                 PFIX-3: a finish THE DROP's replay refuses is scored at the last point its log can prove → + rf: true (`today` then
//                                 carries rf: { drop: true }) — never a 422 dead end
//                                 DM1 — THE THROWAWAY GATE: counted = the profile existed before that day's 4 am Eastern start (ppriv/{pid}/at — server-written
//                                 at creation). A non-counting result is kept (one try, the player's own score, the streak + the XP as usual) but is NOT in
//                                 the histogram / the band, YOUR TABLE, THE BOARD or any reward; `countsFrom` = when this profile's dailies start counting
//   today  { pids? }           → { day, dailies: [row…], mine: { game: score }, gated: { game: true }, started: { game: true } (in flight — DFIX2: yesterday's
//                                 unfinished run too, its day in startedDay: { game: yday }), stand: { game:
//                                 { n, top, pct } } (a counted score's place once ≥ BAND_MIN), lessons: { game: 1 }, countsFrom? (a same-day profile), friends: { pid: { game: { done } | { score } } }, table: [pid] }
//                                 (YOUR TABLE's TODAY — FRIENDS A: only YOUR FRIENDS (pfr/{pid}/f), ≤ 12; a friend's NON-COUNTING result is left out)
//   moves  { game, list: [{ a: 'dig' | 'chord', cell, buoys? }…] } → { day, answers: [resp | { refused }], now }   DFIX3 — COALESCED MOVES: the taps a
//                                 phone queued while an answer was in flight go out TOGETHER (≤ MAX_BATCH), applied in order inside ONE transaction on
//                                 the record (one invocation answers several cells; a refused move is its own { refused } slot, the rest still land)
//   lesson { game }            → { ok }   DM2 — a daily's first-time lesson seen (pstats/{pid}/ls/{game} — once per player, every device; DFIX3: THE
//                                 ONE-TIME HINT reads the same flag — `hint` rows)
//   room   { room }            → { mid: [uid…] }   DM1 — which players of YOUR room have a daily in flight (uids only — nothing about a run; DM2's host line)
//   today  { share: true }     → + share: { [game]: its share card's spoiler-free inputs } (BOARD 2.0 B — SHARE TODAY's tap only; your finished runs)
//   DAILY A — A `tries` CARTRIDGE (JAYWALK — _lib/jaywalk-daily.js): start → a NEW try { run: { seed, try, go, z, path, left, tries } } (an open
//                                 try closed first, scored as it stands; a 4th → 409 no_tries) · finish → the open try closed + replayed, the day's
//                                 score = the best closed try (the FIRST counts the day; a better one RAISES it) · roomWins { game, room } → THE
//                                 ROOM WINS ends the open try (the room checked: this player in it, 2+ players) · no pause, ever
//   DAILY A — DAILY BEST: a finish answers { best, newBest, first } for its daily; `today` carries best: { game: { best, newBest, first } }
//                                 (pstats/{pid}/db — js/core/daily-best.js: each daily's own rule)
//   points { pids? }           → { mine, friends: { pid: … }, table }   BOARD 2.0 A — DAILY POINTS for YOU + YOUR TABLE (the same friends `today` reads):
//                                 per board (daily · daily-<game>) { week, all, avg, days } — the values THE DAILIES' BOARDS hold (core/overall.js)
//
//   dly/{game}/{day}/s/{pid}: startedAt · r/{pid}: score · x/{pid}: 1 (DM1 — a non-counting result) · h/{bucket}: count · n: finishers · p/{pid}: a judged
//   daily's record · b: the day's data (THE 4 AM PICKER — the pair / the board) · c: THE DAY'S CLOSE marker (DFIX2 — _lib/daily-close.js: PENTHOUSE
//   decided once the day is over, by the first start / today after 4 am)      (server only — the rules' default deny)
//   DM1 — THE CALL BUDGET: CALLS.max calls a uid per CALLS.windowMs (rl/dc_{uid} — a COAST CLEAR run is ~50–110 calls, a PASSWORD run ≤ 15) → 429 slow_down
//   DFIX3 — THE DIG PATH (docs/coastclear.md "The dig path + its timings"): a move waits on the database TWICE — the reads (the record + the start +
//   the board memo, in parallel) and ONE transaction attempt (the record is held in the SDK's cache by a listener for the call, so the transaction's
//   first run sees the real value — no "first null" round trip); the budget is a per-instance counter with the shared rl/ count written BEHIND it;
//   uid → pid memoised a minute. Every answer carries `Server-Timing` (auth · pre · load · tx;desc=attempts · total · region — no secrets).
import { withShow } from './_lib/catalog.js';   // (THE VAULT 1B: registers the server-only catalog + names only to owners)
import { route, send, readBody, requireUser, ApiError } from './_lib/http.js';
import { ref, val, adminPids, emulated } from './_lib/fb.js';
import { pidOf } from './_lib/profiles.js';
import { bumpOwners } from './_lib/owners.js';
import { take } from './_lib/limit.js';
import { dailySeed, openDailies, pickDay, liveFor } from './_lib/dailies.js';
import { roomStarted, midDaily } from './_lib/daily-room.js';
import { closeDays, recloseDay, sweepRuns } from './_lib/daily-close.js';
import { dailyOf, bucketOf, standing, todayView, todaysDailies, dailyRow, BAND_MIN } from '../js/core/daily.js';
import { streakDay, dayNum, dayOf, dayStartAt, countsOn } from '../js/core/streak.js';
import { dailyStep } from '../js/core/progress.js';
import { levelOf, emblemRank } from '../js/core/levels.js';
import { easternParts } from '../js/core/week.js';
import { isPid } from './_lib/profiles.js';
import { tablePids } from '../js/core/friends.js';
import { dailyPoints } from '../js/core/daily-points.js';
import { timing, noTiming } from './_lib/timing.js';
import { ensureTop, addTop, extraOf } from './_lib/every.js';
import { everyView, placeIn, TOP_KEEP, TOP_SHOW } from '../js/core/every.js';
import { saveShareCard, readShare, sharePage, sweepShares, CODE_RE } from './_lib/share-card.js';   // (CITY E — THE TAPPABLE SHARE CARD)
import { compactResults } from './_lib/results-sweep.js';   // (CITY G — results/ compacted past 14 days)
import { bestStep, bestView, pointsRaise, isBetter } from '../js/core/daily-best.js';   // (DAILY A — DAILY BEST + a better try's points)
import { roomJoined } from './_lib/daily-room.js';
import { creditTry as jwCredit } from './_lib/jaywalk-credit.js';   // (DAILY B — a try's cards + YOUR BEST)

/** DM1 — THE CALL BUDGET: generous for real play (both dailies, retries, refreshes), a flood refused */
export const CALLS = { max: 400, windowMs: 10 * 60_000 };
/** DFIX3 — a coalesced call carries at most this many moves (a phone queues taps only while one answer is in flight) */
export const MAX_BATCH = 12;

/** DFIX3 — Server-Timing (no secrets) — HE2: moved to _lib/timing.js (THE HOLD'EM DEALER shares it); re-exported for the tests */
export { timing };

// DFIX3 — THE BUDGET OFF THE DIG PATH: a per-instance window counter decides AT ONCE; the shared count (rl/dc_{uid} — every warm instance) is
// written behind it, never waited for, and its refusal lifts the local count so a flood across instances still stops within one round trip
const BUDGET = new Map();
function budget(uid, now) {
  const key = String(uid).replace(/[.#$[\]/]/g, '_');
  let b = BUDGET.get(key);
  if (!b || now - b.t >= CALLS.windowMs || now < b.t) {
    b = { n: 0, t: now };
    BUDGET.set(key, b);
    if (BUDGET.size > 4000) for (const k of [...BUDGET.keys()].slice(0, 1000)) BUDGET.delete(k);
  }
  if (b.n >= CALLS.max) return false;
  b.n++;
  take(`dc_${key}`, CALLS.max, CALLS.windowMs, now).then(ok => { if (!ok) b.n = Math.max(b.n, CALLS.max); }).catch(() => {});
  return true;
}
export const forgetBudgets = () => BUDGET.clear();

// DFIX3 — uid → pid memoised a minute per warm instance (uids/{uid} is written once at the profile's creation; a restore re-links a device from the
// profile screen, never mid-dig — the memo is short and only ever a HIT, a miss asks the database)
const PIDS = new Map(), PID_TTL = 60_000;
async function mine(uid) {
  const m = PIDS.get(uid);
  if (m && Date.now() - m.at < PID_TTL) return m.pid;
  const pid = await pidOf(uid);
  if (!pid) throw new ApiError(404, 'no_profile');
  PIDS.set(uid, { pid, at: Date.now() });
  if (PIDS.size > 5000) for (const k of [...PIDS.keys()].slice(0, 1000)) PIDS.delete(k);
  return pid;
}
export const forgetPids = () => PIDS.clear();

// DFIX5 — THE HELD RUN (the owner: "noticeable lag on every dig"): a warm instance KEEPS the runner's record listener between moves (keyed by
// the player + the run's day — never the phone's word: the pid is the token's, the day dayOfCall's), and the run's start once it exists (written
// ONCE by `start` — one try), both through listeners held on the instance. A warm dig then reads NOTHING before its transaction — the record is already in the SDK's cache,
// pushed by the server on every change — and the transaction is its ONE database round trip (cle1 ↔ Iowa ≈ 20 ms, was two). Every guarantee is
// the transaction's, as before: a stale cached value is checked by the database and retried (the server's record is the truth), a repeat / a
// reorder free, the replay score, the throwaway gate, THE ROOM WINS. Idle runs are let go after HOLD_IDLE_MS; at most HOLD_MAX at once.
// THE DROP's moves (a cartridge with a `stash`) keep their own per-call read (PFIX-3 — the record read fresh before a chunk is stored).
export const HOLD_IDLE_MS = 3 * 60_000, HOLD_MAX = 300;
const HELD = new Map();   // `${base}/p/${pid}` → { ref (the record), sref (the start), at }
const noop = () => {};
const letGo = h => { h.ref.off('value', noop); h.sref.off('value', noop); };
function heldRun(base, pid, now) {
  const key = `${base}/p/${pid}`;
  for (const [k, h] of HELD) { if (now - h.at < HOLD_IDLE_MS && HELD.size <= HOLD_MAX) break; if (k !== key) { letGo(h); HELD.delete(k); } }
  let h = HELD.get(key);
  if (!h) { h = { ref: ref(key), sref: ref(`${base}/s/${pid}`), at: now }; h.ref.on('value', noop); h.sref.on('value', noop); HELD.set(key, h); }
  else { HELD.delete(key); HELD.set(key, h); }   // (the newest at the end — the sweep above lets the oldest go first)
  h.at = now;
  return h;
}
/** a value through a listener already held (the SDK's cache answers at once once the first value is in) */
const heldVal = r => new Promise((res, rej) => r.once('value', snap => res(snap.val()), rej));
/** the tests: let every held run go (a test that rewrites a record behind the server's back starts clean) */
export const forgetHeld = () => { for (const h of HELD.values()) letGo(h); HELD.clear(); };
export const heldCount = () => HELD.size;
/** DFIX5 — the OWNER (ADMIN_PIDS — the same test /admin uses; on the emulators also `testAdmins/{pid}`, like the dealer's): COAST CLEAR's dig
 *  readout is shown to him only — the phone hears it from `start`, never decides it */
async function ownerOf(pid) {
  if (!pid) return false;
  if (adminPids().includes(pid)) return true;
  return emulated() ? !!(await val(`testAdmins/${pid}`)) : false;
}
const cartOf = id => { const c = dailyOf(id); if (!c) throw new ApiError(404, 'no_daily'); return c; };
const DAY_KEY = /^d\d{8}$/;
/** the streak day before `dk` */
export const prevDay = dk => dayOf(dayNum(dk) - 1);
/**
 * DFIX1 — A RUN KEEPS ITS OWN DAY: every call after `start` names the day its start returned (`body.day`). Today's, or YESTERDAY's (a run
 * that crossed 4 am Eastern finishes on its own day — the caller then checks the player has a start there, else 409 not_started); no day =
 * today (an old phone). Anything else (a made-up day, two back, tomorrow) → 400 bad_day. The server never re-reads the clock for a run in flight.
 */
export function dayOfCall(body, now) {
  const today = streakDay(now);
  const d = body && body.day;
  if (d == null || d === today) return today;
  if (typeof d === 'string' && DAY_KEY.test(d) && d === prevDay(today)) return d;
  throw new ApiError(400, 'bad_day', 'That day isn’t open.');
}
/** DM1 — THE THROWAWAY GATE: core/streak.js#countsOn (pure — re-exported for the tests that import it from here) */
export { countsOn };
/** the profile's server-side creation time (ppriv/{pid}/at — written once, by the server, when the profile is made) */
const createdAtOf = pid => val(`ppriv/${pid}/at`);

export async function dailyAction(uid, body, now = Date.now(), T = noTiming) {
  body = body && typeof body === 'object' ? body : {};
  // THE CALL BUDGET (in memory — DFIX3: it never adds a wait to a dig) + the live dailies (THE GO-LIVE SWITCH, cached ~30 s)
  if (!budget(uid, now)) throw new ApiError(429, 'slow_down', 'Too many moves — wait a minute.');
  // (CITY D — SCORES SHOWS INSTANTLY: `every` asks for its pid + the faces module WHILE the switch is read — one trip, not three)
  const early = body.action === 'every' ? { pid: mine(uid), lb: import('./_lib/lb.js') } : null;
  if (early) { early.pid.catch(() => {}); early.lb.catch(() => {}); }
  await openDailies(now);
  T.mark('pre');
  const today = streakDay(now);
  switch (body.action) {
    case 'start': {
      const pid = await mine(uid), cart = cartOf(body.game);
      // a run in flight on YESTERDAY's day (the phone remembers its day) resumes there until it is finished — never a start on yesterday's day,
      // never a second try: with no start there, or its score already in, the start is today's
      let day = today, startedAt = null;
      const asked = body.day;
      if (!cart.tries && typeof asked === 'string' && DAY_KEY.test(asked) && asked === prevDay(today)) {   // (DAILY A: a try is never resumed — tries are today's)
        const [s0, r0] = await Promise.all([val(`dly/${cart.id}/${asked}/s/${pid}`), val(`dly/${cart.id}/${asked}/r/${pid}`)]);
        if (s0 && r0 == null) { day = asked; startedAt = s0; }
      }
      const base = `dly/${cart.id}/${day}`;
      // THE 4 AM PICKER: the day's set fixed for EVERY live daily on its first start (lazy, idempotent — a memo per warm function)
      const picked = pickDay(day, now).catch(() => null);
      // DFIX2 — THE DAY'S CLOSE (PENTHOUSE for yesterday's final finishers): lazy too, a memo per warm function (never on a move)
      const closed = closeDays({ games: todaysDailies(), now }).then(() => sweepRuns({ games: todaysDailies(), now, settle: settleRun })).catch(() => null);
      sweepShares({ now }).catch(() => null);   // (CITY E: the share cards past 7 days — once a day per warm function, never waited on)
      if (startedAt == null) {
        const tx = await ref(`${base}/s/${pid}`).transaction(cur => (cur ? undefined : now));
        startedAt = tx.snapshot.val();
      }
      const done = await val(`${base}/r/${pid}`);
      await Promise.all([picked, closed]);
      // DAILY A — A `tries` CARTRIDGE (JAYWALK): a NEW try every start (the open one closed first — condition 1 — and the day's score settled
      // from it); a 4th refused. Never a resume, never a pause.
      if (cart.tries) {
        const r = await cart.startTry({ pid, uid, day, now, startedAt });
        const fin = r.prior ? await finishRun({ pid, cart, day, now, today }).catch(e => { console.warn('try settle', e && e.code); return null; }) : null;
        if (r.prior) await creditQuiet({ pid, cart, day, now, closed: r.prior });
        const score = fin ? fin.score : done;
        if (r.refused === 'no_tries') throw new ApiError(409, 'no_tries', 'No tries left today.', { day, done: score ?? null, run: r.run });
        if (r.refused) throw new ApiError(409, 'refused', 'Try that again.');
        return { day, startedAt, done: score ?? null, run: r.run, now, ...(fin ? { prior: { score: fin.score, counted: fin.counted, ...bestBits(fin) } } : {}) };
      }
      // (DFIX2 — OPTIONAL: the day's first start while the database hiccups — the picker's failure was swallowed above; the second load's →
      //  503 `busy`, which the phone retries, never a 500)
      const loadDay = () => (cart.load ? cart.load(day, now).catch(e => { throw new ApiError(503, 'busy', 'The dailies are waking up — try again in a moment.', { cause: String(e && e.message || e) }); }) : null);
      if (cart.judged) {
        let [record, data] = await Promise.all([val(`${base}/p/${pid}`), loadDay()]);
        // (THE DROP A — a cartridge's `begin`: the start on its record inside ONE transaction — THE DROP's first start makes it, a later one is a
        //  RESUME at the latest checkpoint that costs one of its pauses; a finished run is left alone)
        if (cart.begin && done == null) {
          const tx = await ref(`${base}/p/${pid}`).transaction(cur => { const b = cart.begin({ record: cur, startedAt, now, data }); return b === cur ? undefined : b; });
          record = tx.snapshot.val();
        }
        const [run, owner] = await Promise.all([cart.resume({ record, day, startedAt, data, now, pid, base }), cart.diag ? ownerOf(pid) : false]);
        return { day, startedAt, done: done ?? null, run, now, ...(owner ? { owner: true } : {}) };
      }
      return { day, seed: await dailySeed(cart.id, day), startedAt, done: done ?? null };
    }
    // FIXES R2 — TAP A TICKET: a player's OWN FINISHED run of TODAY, read back for its end screen (read-only — never a start: no s/ write, no
    // begin, no clock). Refused while the run is unfinished (its answers + board stay server-side until then) and for a daily with no judged
    // record. THE DROP answers its final board (cart.endView — the share's replay, junk SOLID), never its log.
    case 'ended': {
      const pid = await mine(uid), cart = cartOf(body.game), day = today, base = `dly/${cart.id}/${day}`;
      const done = await val(`${base}/r/${pid}`);
      if (done == null) throw new ApiError(409, 'not_finished', 'That run isn’t finished yet.');
      if (!cart.judged) throw new ApiError(404, 'no_screen', 'That daily has no end screen to show.');
      const [record, data, startedAt] = await Promise.all([val(`${base}/p/${pid}`), cart.load ? cart.load(day, now) : null, val(`${base}/s/${pid}`)]);
      if (!record) throw new ApiError(404, 'no_screen', 'That run has no record to show.');
      const ctx = { record, day, startedAt, data, now, pid, base };
      const run = cart.endView ? await cart.endView(ctx) : await cart.resume(ctx);
      if (!run) throw new ApiError(404, 'no_screen', 'That run has no record to show.');
      return { day, done, run, ...(cart.id === 'coastclear' ? { e: await val(`${base}/e/${pid}`) } : {}) };
    }
    case 'guess': {
      const day = dayOfCall(body, now);
      const pid = await mine(uid), cart = cartOf(body.game), base = `dly/${cart.id}/${day}`;
      if (!cart.judged || typeof cart.judge !== 'function') throw new ApiError(400, 'bad_action', 'This daily has no such move.');
      // (FR7 FIXES A — DY2: with the guess's place `k`, the record is read too — a REPEAT of a guess whose answer was lost is answered from it,
      // nothing written; an old phone sends no k = the old path)
      const k = body.k == null ? null : body.k;
      const [startedAt, result, data, rec0] = await Promise.all([val(`${base}/s/${pid}`), val(`${base}/r/${pid}`), cart.load ? cart.load(day, now) : null,
        k != null ? val(`${base}/p/${pid}`) : null]);
      if (!startedAt) throw new ApiError(409, 'not_started', 'Start today’s daily first.');
      // the word's spelling first — refused before anything is written (no cost); then the guess inside ONE transaction on the record
      const pre = cart.judge({ record: null, word: body.word, day, startedAt, now, data });
      if (pre.refused === 'not_a_word') throw new ApiError(422, 'not_a_word', 'Not in the word list.');
      if (k != null) {
        const a = cart.judge({ record: rec0, word: body.word, k, day, startedAt, now, data });
        if (a.again) return { day, ...a.again, again: true };
        if (a.refused === 'out_of_step') throw new ApiError(409, 'out_of_step', 'That guess is out of step.');
      }
      if (result != null) throw new ApiError(409, 'finished', 'Today’s run is done.');
      let out = null, refused = null, again = false;
      const tx = await ref(`${base}/p/${pid}`).transaction(cur => {
        // (a first attempt on an empty cache sees null: judged without k, so it never aborts there — the SDK retries on the real value)
        const r = cart.judge({ record: cur, word: body.word, k: cur == null ? null : k, day, startedAt, now, data });
        if (r.again) { again = true; refused = null; out = r.again; return undefined; }
        again = false;
        if (r.refused) { refused = r.refused; out = null; return undefined; }
        refused = null; out = r.resp;
        return r.record;
      });
      if (again && out) return { day, ...out, again: true };
      if (refused === 'out_of_step') throw new ApiError(409, 'out_of_step', 'That guess is out of step.');
      if (!tx.committed || !out) throw new ApiError(409, refused === 'done' ? 'finished' : refused === 'closed' ? 'closed' : 'refused', refused === 'done' ? 'Today’s run is done.' : 'That door is closed.');
      return { day, ...out };
    }
    case 'dig': case 'chord': case 'pause': case 'resume': case 'moves': case 'checkpoint': case 'ppause': {
      // CC1 — a judged cartridge's MOVES (COAST CLEAR): the record + the start + the day's data (its board) in parallel, then ONE transaction on the
      // record. DFIX3 — `moves` = several queued taps in ONE call (applied in order, one transaction, one answer each); THE DIG PATH = two waits
      const day = dayOfCall(body, now);
      const pid = await mine(uid), cart = cartOf(body.game), base = `dly/${cart.id}/${day}`;
      const batch = body.action === 'moves';
      if (!cart.judged || typeof cart.act !== 'function') throw new ApiError(400, 'bad_action', 'This daily has no such move.');
      let list;
      if (batch) {
        list = Array.isArray(body.list) ? body.list : null;
        if (!list || !list.length || list.length > MAX_BATCH || !list.every(m => m && typeof m === 'object' && (m.a === 'dig' || m.a === 'chord') && (cart.moves || []).includes(m.a))) throw new ApiError(400, 'bad_moves', 'Those moves don’t read.');
        list = list.map(m => ({ a: m.a, cell: m.cell, ...(m.a === 'chord' ? { buoys: m.buoys } : {}) }));
      } else {
        if (!(cart.moves || []).includes(body.action)) throw new ApiError(400, 'bad_action', 'This daily has no such move.');
        list = [{ a: body.action, cell: body.cell, buoys: body.buoys, at: body.at, add: body.add, k: body.k, fin: body.fin, aw: body.aw }];   // (THE DROP A: a run's chunk; THE DROP B: `aw` — away past the bound, no pause left)
      }
      // the record HELD in the SDK's cache for this call (a listener): the transaction's first attempt then runs on the real value — ONE round
      // trip, not the "first null" two (the listener goes in `finally`, whatever happens)
      // DFIX5 — THE HELD RUN (heldRun above): a cartridge without a `stash` (COAST CLEAR) keeps its listener + its start between calls — a warm
      // move then waits on the database ONCE (the transaction); THE DROP keeps the per-call listener exactly as before
      const held = cart.stash ? null : heldRun(base, pid, now);
      const recRef = held ? held.ref : ref(`${base}/p/${pid}`), hold = () => {};
      if (!held) recRef.on('value', hold);
      let outs = [], attempts = 0;
      try {
        const [rec0, startedAt, data, room] = await Promise.all([
          heldVal(recRef),
          held ? heldVal(held.sref) : val(`${base}/s/${pid}`), cart.load ? cart.load(day, now) : null,
          body.action === 'pause' ? roomStarted({ uid, pid, code: body.room, now }) : null]);
        T.mark('load');
        if (!startedAt) throw new ApiError(409, 'not_started', 'Start today’s daily first.');
        // (THE DROP A — a cartridge's `stash`: the upload's own data written beside the record — THE DROP's log chunk. PFIX-3 (FABLE REVIEW 2 —
        //  M2, S1): the RECORD IS READ FIRST — a chunk is stored only for a run in flight, when its judge would take it (never from a profile
        //  with no run, never a shorter chunk over a longer one); a chunk that was NOT stored is marked `ns`, so the move never counts a log
        //  the store doesn't hold (the record moved in between → the phone sends it again))
        if (!batch && cart.stash && typeof body.add === 'string' && body.add) {
          const stash = cart.stash({ body, base, pid, record: rec0, now });
          if (stash) await ref('/').update(stash); else list[0].ns = 1;
          T.mark('stash');
        }
        // DM1 — THE ROOM WINS: a pause only for a room that really started a game (the clock keeps running otherwise)
        if (body.action === 'pause' && !room) throw new ApiError(409, 'no_room_game', 'The clock only stops when your room starts a game.');
        await recRef.transaction(cur => {
          attempts++; outs = [];
          let rec = cur;
          for (const mv of list) {
            const r = cart.act({ action: mv.a, body: mv, record: rec, day, startedAt, now, data, room: !!room });
            if (r.refused) outs.push({ refused: r.refused, status: r.status || 409 });
            else outs.push({ resp: r.resp });
            if (r.record) rec = r.record;                          // (a refusal may still close a pause — the record it hands back is kept)
          }
          // a transaction's first call could still see null (a cold cache): never abort on it — write what the moves made (or the fresh record), so
          // the server checks it against the stored one and retries with the real record
          if (cur == null) return rec || { st: startedAt };
          return rec !== cur ? rec : undefined;                     // nothing changed (a repeat, a refusal) → nothing written
        });
        T.mark('tx', attempts);
      } finally { if (!held) recRef.off('value', hold); }
      const wording = code => (code === 'finished' ? 'Today’s run is done.' : code === 'pause_limit' ? 'No more pauses this run — the clock is running.' : code === 'paused' ? 'The run is paused.' : 'That move doesn’t work there.');
      if (batch) return { day, answers: outs.map(o => (o.refused ? { refused: o.refused === 'done' ? 'finished' : o.refused } : o.resp)), now };
      const o = outs[0];
      if (!o) throw new ApiError(409, 'refused', 'Try that again.');
      if (o.refused) { const code = o.refused === 'done' ? 'finished' : o.refused; throw new ApiError(o.status, code, wording(code)); }
      return { day, ...o.resp, now };
    }
    case 'finish': {
      const day = dayOfCall(body, now);
      const pid = await mine(uid), cart = cartOf(body.game);
      if (cart.tries) return finishTry({ pid, cart, day, now, today, why: 'fin', T });
      return finishRun({ pid, cart, day, now, today, result: body.result, T });
    }
    // DAILY A — THE ROOM WINS for a `tries` cartridge (JAYWALK): joining a room (2+ players, this player in it) ENDS the open try — scored as it
    // stands; the room's dy flag stays the phone's. Refused (403 not_in_room) when the room isn't real — the try runs on.
    case 'roomWins': {
      const pid = await mine(uid), cart = cartOf(body.game);
      if (!cart.tries) throw new ApiError(400, 'bad_action', 'This daily has no such move.');
      if (!(await roomJoined({ uid, pid, code: body.room }))) throw new ApiError(403, 'not_in_room', 'Only a room you are in, with someone else in it.');
      const day = dayOfCall(body, now);
      return finishTry({ pid, cart, day, now, today, why: 'room', T });
    }
    case 'today': {
      const day = today;
      const games = todaysDailies();
      // the list for the DAILY screen (DM2 — TODAY's rows, the SCORES sections, the dock badge): the LIVE dailies, in order — answered WITHOUT a
      // profile too (a new phone still sees the dock button; THE GO-LIVE SWITCH off → an empty list → no button)
      const dailies = games.map(id => { const r = dailyRow(id) || {}, c = dailyOf(id) || {}; return { id, name: r.name || c.name, order: r.order ?? 99, ticket: r.ticket || id, lesson: !!r.lesson, better: c.better || 'high', hook: r.hook || r.tag || '', ...(c.tries ? { tries: c.tries } : {}) }; });
      const pid = await pidOf(uid);
      // DFIX2 — THE DAY'S CLOSE runs from `today` too (the title's first call of the day): a memo per warm function
      const closing = closeDays({ games, now }).then(() => sweepRuns({ games, now, settle: settleRun })).catch(() => null);
      sweepShares({ now }).catch(() => null);   // (CITY E: the share cards past 7 days — THE DAY'S CLOSE's sweep, no idle poll)
      compactResults({ now }).catch(() => null);   // (CITY G: results/ past 14 days compacted — js/core/results-compact.js — once a day, never waited on)
      if (!pid) { await closing; return { day, dailies, mine: {}, gated: {}, started: {}, stand: {}, lessons: {}, friends: {}, table: [], noProfile: true }; }
      const mineScores = {}, gated = {}, started = {}, startedDay = {}, stand = {}, shareOf = {}, rfOf = {}, placeOf = {}, extraMine = {};
      // (CITY D — SCORES SHOWS INSTANTLY: the profile's own reads + YOUR TABLE's friends list start NOW, beside the dailies' reads — never after)
      const lsP = Promise.all([val(`pstats/${pid}/ls`), createdAtOf(pid)]), pfrP = val(`pfr/${pid}`), dbP = val(`pstats/${pid}/db`);
      const triesOut = {};
      const yday = prevDay(day);
      await Promise.all(games.map(async g => {
        const base = `dly/${g}/${day}`;
        // (CITY D: the result, the start + the NOT COUNTED mark in ONE trip)
        let [v, s0, xg] = await Promise.all([val(`${base}/r/${pid}`), val(`${base}/s/${pid}`), val(`${base}/x/${pid}`)]);
        // (THE DROP A: a run in flight that can never come back — or ended with no finish — is scored now, at its last checkpoint)
        if (s0 && dailyOf(g) && dailyOf(g).tries) {
          // (DAILY A — condition 1: an open try that can't be in play any more is closed + counted here; the tries' state for the ticket)
          const f = await settleRun({ pid, cart: dailyOf(g), day, now, today }).catch(() => null);
          if (f && f.score != null) { v = f.score; xg = await val(`${base}/x/${pid}`); }
          const rec = await val(`${base}/p/${pid}`), C = dailyOf(g), view = C.resume({ record: rec, data: null });
          triesOut[g] = { used: view.used, left: view.left, tries: view.tries, open: view.tries.some(x => x.open) };
          if (triesOut[g].open) started[g] = true;
        } else if (s0 && v == null && dailyOf(g) && dailyOf(g).abandon) { const f = await settleRun({ pid, cart: dailyOf(g), day, now, today }).catch(() => null); if (f && f.score != null) { v = f.score; xg = await val(`${base}/x/${pid}`); } }
        if (s0 && v == null && !(dailyOf(g) && dailyOf(g).tries)) started[g] = true;   // (IN PROGRESS → RESUME)
        // DFIX2 (FABLE REVIEW #2, finding 7): YESTERDAY's run still in flight (DFIX1's yesterday-key rule — a tap resumes it) reads RESUME too
        if (!s0 && v == null && !(dailyOf(g) && dailyOf(g).tries)) {   // (DAILY A: a try never resumes — yesterday's is closed by THE DAY'S CLOSE)
          const [s1, r1] = await Promise.all([val(`dly/${g}/${yday}/s/${pid}`), val(`dly/${g}/${yday}/r/${pid}`)]);
          const gone = s1 && r1 == null && dailyOf(g) && dailyOf(g).abandon ? await settleRun({ pid, cart: dailyOf(g), day: yday, now, today }).catch(() => null) : null;
          if (s1 && r1 == null && !(gone && gone.score != null)) { started[g] = true; startedDay[g] = yday; }
        }
        if (v == null) return;
        mineScores[g] = v;
        // (CITY D: the finished run's pieces SIDE BY SIDE — the spot icons, the rescue mark, the share inputs + the EVERYONE line's numbers)
        const shareIn = async () => { let cart = null; try { cart = cartOf(g); } catch { /* not a judged daily */ } if (cart && cart.share) { try { const [record, data] = await Promise.all([val(`${base}/p/${pid}`), cart.load ? cart.load(day, now) : null]); const s = await cart.share({ record, day, startedAt: s0, data, base, pid }); if (s) shareOf[g] = s; } catch { /* the card falls back to the line */ } } };
        const [ex, rf, , H] = await Promise.all([
          // (DFIX5 — THE SPOT ICONS: your finished run's extra from the server's record — COAST CLEAR's spots)
          dailyOf(g) && dailyOf(g).extra ? extraOf(dailyOf(g), base, pid, { day, now }).catch(() => null) : null,
          // (PFIX-3: a run its finish could not check — the ticket says so; one small read, only for a cartridge that can rescue)
          dailyOf(g) && dailyOf(g).rescue ? val(`${base}/p/${pid}/rf`) : null,
          // (BOARD 2.0 B — SHARE TODAY: the finished run's spoiler-free share inputs from the SERVER's record, only when asked — the share tap)
          body.share ? shareIn() : null,
          // THE EVERYONE LINE (DM2): where a COUNTED score stands — only once the day has BAND_MIN counting finishers (never a stranger's data)
          xg ? null : Promise.all([val(`${base}/h`), val(`${base}/n`), dailyOf(g) ? ensureTop(dailyOf(g), base, { day, now }).catch(() => null) : null])]);
        if (ex) extraMine[g] = ex;
        if (rf) rfOf[g] = true;
        if (xg) { gated[g] = true; return; }
        const [hist, n, top] = H;
        if ((n || 0) >= BAND_MIN) { const st = standing(dailyOf(g), hist || {}, n, v); stand[g] = { n, top: Math.round(st.top * 10) / 10, pct: st.pct }; }
        // DFIX5 — THE TICKET LINE = the EVERYONE place among the day's counting finishers ("4TH OF 12 TODAY"): exact inside the kept top; below it
        // (a day of more than TOP_KEEP), from the histogram (the finishers strictly better + 1)
        { const at = top ? placeIn(top, pid) : null; const p = at || ((n || 0) > TOP_KEEP ? standing(dailyOf(g), hist || {}, n, v).better + 1 : null); if (p) placeOf[g] = { p, n: Math.max(Number(n) || 0, p) }; }
      }));
      const friends = {};
      // (FRIENDS A — YOUR TABLE reads YOUR FRIENDS LIST on the server: a stranger's daily is never readable by naming their id; ≤ 12 —
      //  the phone's own pick kept to friends, else the friends you PLAYED WITH most recently, then the newest friendships)
      const picked = (Array.isArray(body.pids) ? body.pids : []).map(String).filter(isPid);
      const pids = tablePids((await pfrP) || {}, pid, picked.length ? picked : null, now);
      await Promise.all(pids.map(async p => {
        const theirs = {}, ex = {};
        await Promise.all(games.map(async g => {
          const [v, xp] = await Promise.all([val(`dly/${g}/${day}/r/${p}`), val(`dly/${g}/${day}/x/${p}`)]);   // (CITY D: one trip)
          if (v == null) return;
          if (xp) return;          // (DM1 — THE THROWAWAY GATE: a non-counting result never ranks at YOUR TABLE)
          theirs[g] = v;
          // (DFIX5 — their spot icons, once you have played that daily too — the score's own rule)
          if (mineScores[g] != null && dailyOf(g) && dailyOf(g).extra) { const e = await extraOf(dailyOf(g), `dly/${g}/${day}`, p, { day, now }).catch(() => null); if (e) ex[g] = e; }
        }));
        const tv = todayView(mineScores, theirs);
        for (const [g, e] of Object.entries(ex)) if (tv[g] && tv[g].score != null) tv[g].e = e;
        friends[p] = tv;
      }));
      const [ls, createdAt] = await lsP;
      // DAILY A — DAILY BEST per live daily (one read — pstats/{pid}/db): { best: { s, day }, newBest, first } (DAILY B draws it)
      const db = (await dbP.catch(() => null)) || {}, best = {};
      for (const g of games) { const b = bestView(db[g], day); if (b.best) best[g] = b; }
      await closing;
      return { day, dailies, best, ...(Object.keys(triesOut).length ? { tries: triesOut } : {}), mine: mineScores, gated, started, startedDay, stand, place: placeOf, ...(Object.keys(extraMine).length ? { extra: extraMine } : {}), ...(Object.keys(rfOf).length ? { rf: rfOf } : {}), lessons: ls || {}, friends, table: pids, ...(body.share ? { share: shareOf } : {}),
        ...(countsOn(createdAt, day) ? {} : { countsFrom: dayStartAt(dayOf(dayNum(day) + 1)) }) };
    }
    case 'every': {
      // DFIX5 — EVERYONE ON SCORES (the DAILY screen's SCORES, once a visit — never the dock's `today`): per live daily, the day's top COUNTING
      // finishers as public slim-card faces (the board id, the username — never a pid), each with its PLACE; the scores (+ COAST CLEAR's spots)
      // only once YOU have finished that daily (the YOUR TABLE rule); your friends marked; your own row when below them; `all` = up to TOP_KEEP
      const pid = await (early ? early.pid : mine(uid)), day = today;
      const games = todaysDailies().filter(g => !body.game || g === body.game);
      // (CITY D: the friends list + the profile's age beside the dailies' reads, never before them)
      const fP = Promise.all([val(`pfr/${pid}`), createdAtOf(pid)]), lbP = early ? early.lb : import('./_lib/lb.js');
      fP.catch(() => {});
      const out = {};
      await Promise.all(games.map(async g => {
        const cart = dailyOf(g), base = `dly/${g}/${day}`;
        if (!cart) return;
        const [top, n, mineV, gatedX] = await Promise.all([ensureTop(cart, base, { day, now }).catch(() => []), val(`${base}/n`), val(`${base}/r/${pid}`), val(`${base}/x/${pid}`)]);
        const played = mineV != null;
        const [[pfr, createdAt], { publicFaces }] = await Promise.all([fP, lbP]);
        const friendsOf = new Set(Object.keys((pfr && pfr.f) || {}));
        const faces = await publicFaces(top.map(r => r.k));
        const hidden = new Set(top.filter(r => !faces[r.k]).map(r => r.k));
        const limit = body.all === true || (Array.isArray(body.all) && body.all.includes(g)) ? TOP_KEEP : TOP_SHOW;
        const v = everyView(top, { pid, friends: friendsOf, played, hidden, limit });
        const face = r => { const f = faces[r.k] || {}; return { id: f.id, n: f.n, a: f.a, c: f.c, r: f.r, l: f.l, cd: f.cd, es: f.es, tb: f.tb, g: f.g, rank: r.rank, ...(r.s != null ? { v: r.s } : {}), ...(r.e ? { e: r.e } : {}), ...(r.me ? { me: 1 } : {}), ...(r.f ? { f: 1 } : {}) }; };
        // YOU: your row when below the shown ones; a same-day profile's own result (never ranked) — NOT COUNTED; a counted one past the kept top
        let me = v.mine ? face(v.mine) : null;
        if (!me && played && !top.some(r => r.k === pid)) {
          const e = cart.extra ? await extraOf(cart, base, pid, { day, now }).catch(() => null) : null;
          me = { v: mineV, ...(e ? { e } : {}), me: 1, ...(gatedX || !countsOn(createdAt, day) ? { gated: 1 } : {}) };
        }
        out[g] = { n: Number(n) || 0, played, rows: v.list.map(face), ...(me ? { me } : {}), more: v.more };
      }));
      return { day, every: out };
    }
    case 'lesson': {
      // DM2 — THE PRACTICE HARBOR (any daily's first-time lesson): seen once per PLAYER — remembered on the profile (pstats/{pid}/ls/{game}), so a
      // new device never repeats it. Never scored, never the day's board — only the flag.
      const pid = await mine(uid), row = dailyRow(body.game);
      if (!row || !row.lesson) throw new ApiError(400, 'no_lesson');
      await ref(`pstats/${pid}/ls/${row.id}`).set(1);
      return { ok: true };
    }
    case 'points': {
      // BOARD 2.0 A — YOUR TABLE's ALL TIME (B draws it): you + your friends' DAILY POINTS — from YOUR friends list only (a stranger's never read)
      const pid = await mine(uid);
      const picked = (Array.isArray(body.pids) ? body.pids : []).map(String).filter(isPid);
      const pids = tablePids((await val(`pfr/${pid}`)) || {}, pid, picked.length ? picked : null, now);
      const { overallValues } = await import('../js/core/overall.js');
      const view = async p => { const v = overallValues({ dp: await val(`pstats/${p}/dp`) }, now); return Object.fromEntries(Object.entries(v).filter(([b]) => b !== 'xp').map(([b, x]) => [b, { week: x.week, all: x.all, avg: x.avg, days: x.days }])); };
      const [me0, ...rest] = await Promise.all([view(pid), ...pids.map(view)]);
      // (DFIX5 — the EVERYONE board on SCORES · ALL TIME marks YOU + your FRIENDS: their BOARD ids — the public rows' own id, an HMAC that names
      //  nobody — never a pid in a public row; every friend, not only the table's 12)
      const { boardId } = await import('./_lib/lb.js');
      const fr = Object.keys(((await val(`pfr/${pid}`)) || {}).f || {}).filter(isPid).slice(0, 300);
      return { mine: me0, friends: Object.fromEntries(pids.map((p, i) => [p, rest[i]])), table: pids, ids: { me: boardId(pid), f: fr.map(boardId) } };
    }
    case 'shareCard': {
      // CITY E — THE TAPPABLE SHARE CARD: the day's card (540 × 675 PNG) uploaded when SHARE TODAY is PREPARED (never at the tap) — api/_lib/share-card.js
      const pid = await mine(uid);
      // (JAYWALK H4B's add-on: `run: { room, m }` = A RUN's CARD — accepted only from a player that match's own counted result names)
      const { code, v, same } = await saveShareCard({ pid, day: body.day, games: body.games, png: body.png, run: body.run && typeof body.run === 'object' ? body.run : null, now });
      return { code, v, path: `/api/daily?s=${code}`, ...(same ? { same: true } : {}) };
    }
    case 'room': {
      const mid = await midDaily({ uid, code: body.room, games: todaysDailies(), now });
      if (!mid) throw new ApiError(403, 'not_in_room', 'Only someone in the room can ask.');
      return { mid };
    }
    default: throw new ApiError(400, 'bad_action');
  }
}

/**
 * THE DROP A — A RUN THAT CAN'T COME BACK (a cartridge with `abandon`): its record ENDED at its last checkpoint (or already ended — the final
 * upload landed but the finish never came) and SCORED like a finish. Called by the player's next `today` and by THE DAY'S CLOSE's sweep
 * (daily-close.js#sweepRuns). → the finish's answer | null (nothing to settle)
 */
export async function settleRun({ pid, cart, day, now, today = streakDay(now), force = false }) {
  if (!cart || !cart.abandon) return null;
  // DAILY A — a `tries` cartridge: its open try closed when it can't be in play (force: THE DAY'S CLOSE — whatever its state), then the day's score
  if (cart.tries) {
    const closed = await cart.settle({ pid, day, now, force }).catch(e => { console.warn('settle try', e && e.message); return null; });
    if (!closed) return null;
    const fin = await finishRun({ pid, cart, day, now, today }).catch(e => { console.warn('settle', cart.id, day, e && e.code); return null; });
    await creditQuiet({ pid, cart, day, now, closed });
    return fin;
  }
  const base = `dly/${cart.id}/${day}`;
  const [rec, r] = await Promise.all([val(`${base}/p/${pid}`), val(`${base}/r/${pid}`)]);
  if (!rec || r != null) return null;
  if (!rec.e) {
    // (force: THE DAY'S CLOSE's sweep of a day whose run window is over — whatever the run's state, it can't be resumed any more)
    const gone = cur => force || cart.abandoned({ record: cur, now });
    if (!gone(rec)) return null;
    // (a cold cache's first attempt sees null: never abort on it — null writes nothing new, and the database retries with the real record)
    const tx = await ref(`${base}/p/${pid}`).transaction(cur => (cur == null ? null : !cur.e && gone(cur) ? cart.abandon({ record: cur, now }) : undefined));
    if (!tx.committed && !(tx.snapshot.val() && tx.snapshot.val().e)) return null;
  }
  return finishRun({ pid, cart, day, now, today }).catch(e => { console.warn('settle', cart.id, day, e && e.code); return null; });
}

/** DAILY A — a finish's DAILY BEST bits (bestView's) */
const bestBits = f => (f && f.best ? { best: f.best, newBest: !!f.newBest, first: !!f.first } : {});

/**
 * DAILY B — A CLOSED TRY's CARDS + YOUR BEST (the owner, Nov 18 — docs/games/plan.md "DAILY B"): EVERY try the server closes (FINISH, the next
 * START, THE ROOM WINS, `today`, THE DAY'S CLOSE) credits its REPLAYED result like a counted match — JAYWALK's four cards' flags + YOUR BEST
 * (the `jaywalk-solo` record + its board rows) — in ONE pstats transaction (api/_lib/jaywalk-credit.js, PURE). A COUNTED result only (THE
 * THROWAWAY GATE; nothing before THE PROGRESS RESET); a refused try (`bad`) credits nothing. Never fails the caller.
 */
async function creditTry({ pid, cart, day, now, closed }) {
  if (!closed || closed.bad || cart.id !== 'jaywalk') return null;
  const base = `dly/${cart.id}/${day}`;
  const [startedAt, createdAt, resetAt] = await Promise.all([val(`${base}/s/${pid}`), createdAtOf(pid), val('progress/resetAt')]);
  if ((Number(resetAt) > 0 && Number(startedAt) < Number(resetAt)) || !countsOn(createdAt, day)) return null;
  const { founderOpen } = await import('./_lib/founder.js');
  const fOpen = await founderOpen(now).catch(() => false);
  let res = null;
  await ref(`pstats/${pid}`).transaction(cur => { if (cur == null) return null; res = jwCredit(cur, { lanes: closed.l, feats: closed.f, now, founderOpen: fOpen }); return res ? res.next : undefined; });
  if (!res) return null;
  const [{ boardPaths, playCount, minMatches }, prof] = await Promise.all([import('./_lib/lb.js'), val(`profiles/${pid}`)]);
  const listed = !(prof && prof.h) && playCount(res.next) >= minMatches();
  if (res.pbs.length) await ref('/').update(boardPaths(pid, res.next, { hidden: !listed, now, only: 'jaywalk' })).catch(e => console.warn('try boards', e && e.message));
  if (res.items.length || res.ach.length) await bumpOwners(res.items, false, res.ach).catch(() => {});
  return { pbs: res.pbs, items: res.items, ach: res.ach };
}
const creditQuiet = o => creditTry(o).catch(e => { console.warn('try credit', e && e.message); return null; });

/**
 * DAILY A — FINISH for a `tries` cartridge (JAYWALK — the `finish` action + THE ROOM WINS): the open try CLOSED (its proof node replayed — as it
 * stands), then the day's score from the best closed try (finishRun: the first claims the day, a better one raises it). No open try and none
 * closed → 409 not_done; no open try but one closed → the day's answer again (idempotent).
 */
async function finishTry({ pid, cart, day, now, today, why, T = noTiming }) {
  const closed = await cart.closeOpen({ pid, day, now, why });
  T.mark('close');
  const out = await finishRun({ pid, cart, day, now, today, T });
  const credit = await creditQuiet({ pid, cart, day, now, closed });
  const rec = await val(`dly/${cart.id}/${day}/p/${pid}`);
  const view = cart.resume({ record: rec, data: null });
  return { ...out, try: closed, left: view.left, tries: view.tries, ...(credit ? { credit } : {}) };
}

/**
 * DAILY A — A BETTER TRY (a `tries` cartridge — the claim's transaction already raised dly/{g}/{day}/r/{pid} from `was` to `kept`): the
 * histogram moves the player's bucket, the day's top re-sorts, the points + DAILY BEST rise (ONE pstats transaction — pointsRaise adds only the
 * difference: the day was already counted), the points boards re-written; a day already closed re-ranks (PENTHOUSE can only be ADDED). The
 * streak, the XP, THE SWEEP: never again (the FIRST closed try counted them).
 */
async function raiseRun({ pid, cart, day, now, today, base, kept, was, counts, createdAt, preReset }) {
  const { ServerValue } = await import('firebase-admin/database');
  if (counts) {
    const b0 = bucketOf(cart, was), b1 = bucketOf(cart, kept);
    if (b0 !== b1) await ref('/').update({ [`${base}/h/${b0}`]: ServerValue.increment(-1), [`${base}/h/${b1}`]: ServerValue.increment(1) });
    await addTop(cart, base, { pid, score: kept, at: now, day, now }).catch(e => console.warn('every', cart.id, e && e.message));
  }
  let next = null;
  if (!preReset) {
    const pts = counts ? dailyPoints(cart.id, kept) : null;
    await ref(`pstats/${pid}`).transaction(cur => {
      if (cur == null) return null;
      let nx = cur, changed = false;
      const dp = pts != null ? pointsRaise(cur.dp, { game: cart.id, day, pts }) : null;
      if (dp) { nx = { ...nx, dp }; changed = true; }
      const db = bestStep(cur.db, { game: cart.id, score: kept, day, now });
      if (db) { nx = { ...nx, db }; changed = true; }
      next = nx;
      return changed ? nx : undefined;
    });
    if (next && counts) {
      const [{ overallPaths, hiddenOf }, prof] = await Promise.all([import('./_lib/lb.js'), val(`profiles/${pid}`)]);
      await ref('/').update(overallPaths(pid, next, { hidden: hiddenOf(prof, next), now })).catch(e => console.warn('raise boards', e && e.message));
    }
  }
  if (counts && day !== today) await recloseDay({ game: cart.id, day, now }).catch(e => console.warn('reclose', e && e.message));
  const [hist, n] = await Promise.all([val(`${base}/h`), val(`${base}/n`)]);
  const h = { ...(hist || {}) };
  if (!counts) h[bucketOf(cart, kept)] = (h[bucketOf(cart, kept)] || 0) + 1;
  const stand = standing(cart, h, (n || 0) + (counts ? 0 : 1) || 1, kept);
  void createdAt;
  return { day, score: kept, again: false, raised: true, from: was, counted: counts, ...bestView(((next && next.db) || {})[cart.id], day), ...(preReset ? { pre: true } : {}),
    stand: { n: stand.n, pct: stand.pct, top: Math.round(stand.top * 10) / 10, band: counts && stand.band ? stand.band.name : null }, outcome: null };
}

/**
 * THE FINISH of one player's run (the `finish` action — and THE DROP A: an ABANDONED run scored at its last checkpoint by the next call or THE
 * DAY'S CLOSE): the score from the cartridge (a judged daily from ITS record), ONE official try kept, the histogram, the player's stats.
 */
async function finishRun({ pid, cart, day, now, today = streakDay(now), result = null, T = noTiming }) {
  const base = `dly/${cart.id}/${day}`;
  const [startedAt, createdAt, resetAt] = await Promise.all([val(`${base}/s/${pid}`), createdAtOf(pid), val('progress/resetAt')]);
  if (!startedAt) throw new ApiError(409, 'not_started', 'Start today’s daily first.');
  // THE ONE DAY LINE (FR7 FIXES C — S4): a run STARTED BEFORE THE PROGRESS RESET is never paid in the new epoch (like a match that finished
  // before it): its score is kept for the player, out of the day's histogram + PENTHOUSE (as a non-counting one), and no stats step runs
  const preReset = Number(resetAt) > 0 && Number(startedAt) < Number(resetAt);
  // a JUDGED daily scores from the server's own record — the phone's result is never read (an unfinished run: come back when it's done)
  const record = cart.judged ? await val(`${base}/p/${pid}`) : null;
  if (cart.judged && !(record && record.e)) throw new ApiError(409, 'not_done', 'Finish the run first.');
  const data = cart.judged && cart.load ? await cart.load(day, now) : null;
  let score = await cart.verify(await dailySeed(cart.id, day), cart.judged ? null : result, { startedAt, now, record, day, data, pid, base, T });   // (THE DROP A: a verify may be async — it reads its log)
  // PFIX-3 (FABLE REVIEW 2 — S3) — A REFUSED FINISH IS NEVER A DEAD END (a cartridge's `rescue` — THE DROP): the run is scored at the last
  // point its stored log can prove (or the floor), its record MARKED (`rf` — the reason), the refusal reported to /admin's error log; the
  // phone's ticket then says THIS RUN COULDN'T BE CHECKED — never RESUME all day, never "SENDING YOUR RUN…" for good
  let rescued = null;
  if ((typeof score !== 'number' || !Number.isFinite(score)) && cart.judged && cart.rescue && record && record.e) {
    rescued = await cart.rescue({ record, data, base, pid, day }).catch(e => { console.warn('rescue', cart.id, e && e.message); return null; });
    if (rescued && typeof rescued.score === 'number' && Number.isFinite(rescued.score)) score = rescued.score; else rescued = null;
    T.mark('rescue');
  }
  if (typeof score !== 'number' || !Number.isFinite(score)) throw new ApiError(422, 'refused', 'That result doesn’t check out.');
  // DM1 — THE THROWAWAY GATE: does this profile's result COUNT on this day?
  const counts = countsOn(createdAt, day) && !preReset;
  // ONE official try: the first finish is the score (a retry gets the stored one back)
  // (DAILY A — a `tries` cartridge: a BETTER later try RAISES the day's score — the same transaction; `was` = the score it replaced)
  let was = null;
  const claim = await ref(`${base}/r/${pid}`).transaction(cur => { was = cur; return cur != null ? (cart.tries && isBetter(cart.id, score, cur) && score > Number(cur) ? score : undefined) : score; });
  const kept = claim.snapshot.val();
  if (claim.committed && was != null) return raiseRun({ pid, cart, day, now, today, base, kept, was, counts, createdAt, preReset });
  if (rescued && claim.committed) {
    await ref(`${base}/p/${pid}`).update(rescued.mark || { rf: 'refused' }).catch(() => {});
    // (no id, no name — the reason + the run's shape; one entry per reason, counted: api/log.js#logServer)
    import('./log.js').then(m => m.logServer({ m: `${cart.name || cart.id}: a finish the replay refused (${rescued.why}) — scored at its last provable point`, s: 'api/daily.js', w: `${cart.id}-refused`, k: `${day} · ${rescued.note || ''}` }, { now })).catch(e => console.warn('logServer', e && e.message));
  }
  const rf = rescued ? true : !!(record && record.rf);
  // DFIX5 — THE SPOT ICONS: the run's extra from the SERVER's record (COAST CLEAR's spots), stored beside its score in the same update
  const extra = claim.committed && typeof cart.extra === 'function' ? (() => { try { return cart.extra({ record, data, startedAt, day }); } catch { return null; } })() : null;
  if (claim.committed) {
    const { ServerValue } = await import('firebase-admin/database');
    await ref('/').update({ ...(counts
      ? { [`${base}/h/${bucketOf(cart, kept)}`]: ServerValue.increment(1), [`${base}/n`]: ServerValue.increment(1) }
      : { [`${base}/x/${pid}`]: 1 }),                         // (a non-counting result: kept for the player, out of the day's histogram)
      ...(extra ? { [`${base}/e/${pid}`]: extra } : {}) });
    // DFIX5 — EVERYONE ON SCORES: a COUNTING finish → its row in the day's top (one transaction; a failure never fails the finish — the node is
    // rebuilt from the day's scores when it is missing, and a later finish re-sorts it)
    if (counts) await addTop(cart, base, { pid, score: kept, at: now, e: extra, day, now }).catch(e => console.warn('every', cart.id, e && e.message));
  }
  const [hist, n] = await Promise.all([val(`${base}/h`), val(`${base}/n`)]);
  // the standing: a counted result is IN the histogram; a non-counting one is shown where it WOULD stand (never a band, never stored)
  const h = { ...(hist || {}) };
  if (!counts) h[bucketOf(cart, kept)] = (h[bucketOf(cart, kept)] || 0) + 1;
  const stand = standing(cart, h, (n || 0) + (counts ? 0 : 1) || 1, kept);
  if (!counts) stand.band = null;
  // the player's stats: THE STREAK + the DAILY XP (+ the dailies' counters + THE SWEEP + the rewards, counted only) — idempotent by the day's key
  // (DFIX3 — lazy: stats.js + founder.js pull the boards, friends + push modules a dig never needs — loaded on the first finish of a warm function)
  const [{ outageDays }, { founderOpen }] = await Promise.all([import('./_lib/stats.js'), import('./_lib/founder.js')]);
  const outage = await outageDays().catch(() => ({}));
  const fOpen = await founderOpen(now).catch(() => false);
  let res = null;
  // (PW2 — a judged daily's FLAGS come from the server's own record, never the phone: THE PASSWORD's crack / safe → KEYHOLE / SAFECRACKER)
  const flags = counts && cart.judged && cart.flags ? cart.flags({ record, day, startedAt, data }) : null;
  // (THE DROP B — THE SCHEDULED GO-LIVE: THE SWEEP / the XP cap read the set of the RUN's day — a run that crossed 4 am into a go-live day
  //  keeps its own day's set, and a day before a go-live is swept with the dailies it had)
  const live = liveFor(day);
  // BOARD 2.0 A — DAILY POINTS from the KEPT score (the server's own — never the phone's claim), a COUNTED result only
  const points = counts ? dailyPoints(cart.id, kept) : null;
  let cur0 = null;
  let db = null;
  if (!preReset) await ref(`pstats/${pid}`).transaction(cur => {
    cur0 = cur; res = dailyStep(cur, { game: cart.id, day, now, top: stand.top, rank: stand.better + 1, n: stand.n, hourET: easternParts(day === today ? now : startedAt).h, outage, founderOpen: fOpen, flags, today: live, counts, points });
    // DAILY A — DAILY BEST in the SAME transaction (the player's own result, counted or not — each daily's own rule: core/daily-best.js)
    db = (cur && cur.db) || null;
    if (res.skip) return undefined;
    const nb = bestStep(res.next.db, { game: cart.id, score: kept, day, now });
    if (nb) res.next.db = nb;
    db = res.next.db || null;
    return res.next;
  });
  if (res && !res.skip) {
    const st = res.next.st, xp = res.next.xp || 0;
    // (BOARD 2.0 A — THE OVERALL BOARD in the SAME update as the XP: listed like every board — the 3-match floor, the opt-out, the admin's hide)
    // (+ DAILY POINTS' boards from the same stats — a counted result's points were added in the transaction above; the daily boards list a
    //  player from their 3rd day played — lb.js#hiddenOf)
    const [{ overallPaths, hiddenOf, playCount, minMatches, syncBoards }, prof] = await Promise.all([import('./_lib/lb.js'), val(`profiles/${pid}`)]);
    await ref('/').update({ [`profiles/${pid}/s`]: st.n, [`profiles/${pid}/sd`]: st.d, [`profiles/${pid}/x`]: xp, [`profiles/${pid}/l`]: levelOf(xp), [`profiles/${pid}/r`]: emblemRank(xp), [`profiles/${pid}/m`]: playCount(res.next), ...overallPaths(pid, res.next, { hidden: hiddenOf(prof, res.next), now }) });
    // (PD-3 Group 0 — WHO GETS LISTED: a counted daily finish is a counted play — the one that crosses the floor puts every board up at once)
    if (prof && !prof.h && counts && playCount(res.next) >= minMatches() && playCount(cur0) < minMatches()) await syncBoards(pid, { now }).catch(() => {});
    await bumpOwners(res.items, !(res.next.g && Object.keys(res.next.g).length) && res.dl.n === 1, res.ach).catch(() => {});
    if (res.next.fd) await ref(`profiles/${pid}/fd`).set(true);
  }
  // THE ONE DAY LINE (S2): a counting finish on a day already CLOSED (the run crossed 4 am) re-ranks it once more — it can only ADD a PENTHOUSE
  if (counts && claim.committed && day !== today) await recloseDay({ game: cart.id, day, now }).catch(e => console.warn('reclose', e && e.message));
  return { day, score: kept, again: !claim.committed, counted: counts, ...bestView((db || {})[cart.id], day), ...(rf ? { rf: true } : {}), ...(preReset ? { pre: true } : {}), ...(counts || preReset ? {} : { countsFrom: dayStartAt(dayOf(dayNum(streakDay(Number(createdAt) || now)) + 1)) }),
    stand: { n: stand.n, pct: stand.pct, top: Math.round(stand.top * 10) / 10, band: stand.band ? stand.band.name : null },
    outcome: res && !res.skip ? { streak: res.streak, items: res.items, ach: res.ach, xp: res.xp, lv: res.lv, swept: res.swept, run: res.swept && res.dl.sr ? res.dl.sr.n : 0, points: res.points } : null };
}

/** CITY E — THE TAPPABLE SHARE CARD's two GETs (no sign-in: a link preview fetches them): ?s=<code> → the link-preview page (an unknown /
 *  expired code → the site's home, never an error page) · ?si=<code>&v=<h> → the PNG with an HOUR's edge cache (FIXES R1 A5 — was 7 days
 *  immutable: a card the owner deletes stops showing within the hour; the page names the picture by its hash, so a re-shared card is a new
 *  URL; a gone card → the site's link picture) */
export async function shareGet(req, res) {
  const q = new URL(req.url || '/', 'http://x').searchParams;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.neonspeakeasy.com').split(',')[0].trim();
  const proto = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? 'http' : 'https';
  const base = `${proto}://${host}`;
  const redirect = (to, cache) => { res.statusCode = 302; res.setHeader('Location', to); res.setHeader('Cache-Control', cache); res.end(); };
  if (q.has('si')) {
    const code = q.get('si');
    const r = CODE_RE.test(code || '') ? await readShare(code, { img: true }).catch(() => null) : null;
    if (!r || !r.img) return redirect('/assets/og.jpg', 'public, max-age=300, s-maxage=300');
    const buf = Buffer.from(r.img, 'base64');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', String(buf.length));
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');   // (FIXES R1 A5 — ≤ 1 h: a deleted card stops showing within the hour)
    return res.end(buf);
  }
  const code = q.get('s');
  const r = CODE_RE.test(code || '') ? await readShare(code).catch(() => null) : null;
  if (!r) return redirect('/', 'public, max-age=60, s-maxage=60');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  return res.end(sharePage({ code, name: r.n, games: r.g, day: r.d, base, v: r.h || '', k: r.k || '' }));
}

export default route(['POST', 'GET'], async (req, res) => {
  if (req.method === 'GET') return shareGet(req, res);
  const T = timing();
  const uid = await requireUser(req);
  T.mark('auth');
  const body = await readBody(req);
  const out = withShow(await dailyAction(uid, body, Date.now(), T));
  send(res, 200, out, { 'Server-Timing': T.header() });
});
