// POST /api/daily { action, … } — THE DAILY CONTRACT (PROGRESSION A; core/daily.js) + THE DAILY MODULE's ENGINE (DM1). Signed-in players with
// a profile; no database socket on the phone (THE PARKED DATABASE — a solo daily is /api only).
//   start  { game }            → { day, seed, startedAt, done? }      ONE OFFICIAL TRY: the first start is recorded (a refresh = the same try)
//                                 a JUDGED daily (PW1 — THE PASSWORD, _lib/pw.js: cart.judged) gets { day, startedAt, done?, run } instead — the run so
//                                 far from the SERVER's record (a resume), and NO seed (a seed a phone holds must say nothing about the answers)
//   guess  { game, word }      → { door, n, marks, solved?, failed?, word? (that door just closed), next?, done? }   a judged daily only: the server
//                                 judges every guess inside a transaction on its record; a word that isn't one is refused with NO cost (422 not_a_word)
//   dig / chord / pause / resume { game, … }  (CC1 — COAST CLEAR, _lib/cc.js: a judged cartridge's `moves`) → the cartridge's answer, ONE transaction
//                                 on its record each (a repeat is free: nothing written); every judged answer carries the server's `now` (the phone's clock)
//                                 DM1 — THE ROOM WINS: `pause { room? }` only while the player's room has really started a game (_lib/daily-room.js) — else 409 no_room_game
//   finish { game, result }    → { day, score, counted, stand: { n, pct, top, band }, outcome: { streak, items, ach, xp, lv, swept } }   checked + stored
//                                 server-side (a judged daily scores from ITS record — the phone's result is ignored; an unfinished run → 409 not_done)
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
import { ref, val } from './_lib/fb.js';
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
      if (typeof asked === 'string' && DAY_KEY.test(asked) && asked === prevDay(today)) {
        const [s0, r0] = await Promise.all([val(`dly/${cart.id}/${asked}/s/${pid}`), val(`dly/${cart.id}/${asked}/r/${pid}`)]);
        if (s0 && r0 == null) { day = asked; startedAt = s0; }
      }
      const base = `dly/${cart.id}/${day}`;
      // THE 4 AM PICKER: the day's set fixed for EVERY live daily on its first start (lazy, idempotent — a memo per warm function)
      const picked = pickDay(day, now).catch(() => null);
      // DFIX2 — THE DAY'S CLOSE (PENTHOUSE for yesterday's final finishers): lazy too, a memo per warm function (never on a move)
      const closed = closeDays({ games: todaysDailies(), now }).then(() => sweepRuns({ games: todaysDailies(), now, settle: settleRun })).catch(() => null);
      if (startedAt == null) {
        const tx = await ref(`${base}/s/${pid}`).transaction(cur => (cur ? undefined : now));
        startedAt = tx.snapshot.val();
      }
      const done = await val(`${base}/r/${pid}`);
      await Promise.all([picked, closed]);
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
        return { day, startedAt, done: done ?? null, run: await cart.resume({ record, day, startedAt, data, now, pid, base }), now };
      }
      return { day, seed: await dailySeed(cart.id, day), startedAt, done: done ?? null };
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
      const recRef = ref(`${base}/p/${pid}`), hold = () => {};
      recRef.on('value', hold);
      let outs = [], attempts = 0;
      // (THE DROP A — a cartridge's `stash`: the upload's own data written beside the record, in parallel with the reads — THE DROP's log chunk,
      //  keyed by its offset; the record's checked length decides what the finish ever reads of it)
      const stash = !batch && cart.stash ? cart.stash({ body, base, pid }) : null;
      try {
        const [, startedAt, data, room] = await Promise.all([
          new Promise((res, rej) => recRef.once('value', s => res(s.val()), rej)),
          val(`${base}/s/${pid}`), cart.load ? cart.load(day, now) : null,
          body.action === 'pause' ? roomStarted({ uid, pid, code: body.room, now }) : null,
          stash ? ref('/').update(stash) : null]);
        T.mark('load');
        if (!startedAt) throw new ApiError(409, 'not_started', 'Start today’s daily first.');
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
      } finally { recRef.off('value', hold); }
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
      return finishRun({ pid, cart, day, now, today, result: body.result, T });
    }
    case 'today': {
      const day = today;
      const games = todaysDailies();
      // the list for the DAILY screen (DM2 — TODAY's rows, the SCORES sections, the dock badge): the LIVE dailies, in order — answered WITHOUT a
      // profile too (a new phone still sees the dock button; THE GO-LIVE SWITCH off → an empty list → no button)
      const dailies = games.map(id => { const r = dailyRow(id) || {}, c = dailyOf(id) || {}; return { id, name: r.name || c.name, order: r.order ?? 99, ticket: r.ticket || id, lesson: !!r.lesson, better: c.better || 'high', hook: r.hook || r.tag || '' }; });
      const pid = await pidOf(uid);
      // DFIX2 — THE DAY'S CLOSE runs from `today` too (the title's first call of the day): a memo per warm function
      const closing = closeDays({ games, now }).then(() => sweepRuns({ games, now, settle: settleRun })).catch(() => null);
      if (!pid) { await closing; return { day, dailies, mine: {}, gated: {}, started: {}, stand: {}, lessons: {}, friends: {}, table: [], noProfile: true }; }
      const mineScores = {}, gated = {}, started = {}, startedDay = {}, stand = {}, shareOf = {};
      const [ls, createdAt] = await Promise.all([val(`pstats/${pid}/ls`), createdAtOf(pid)]);
      const yday = prevDay(day);
      await Promise.all(games.map(async g => {
        const base = `dly/${g}/${day}`;
        let [v, s0] = await Promise.all([val(`${base}/r/${pid}`), val(`${base}/s/${pid}`)]);
        // (THE DROP A: a run in flight that can never come back — or ended with no finish — is scored now, at its last checkpoint)
        if (s0 && v == null && dailyOf(g) && dailyOf(g).abandon) { const f = await settleRun({ pid, cart: dailyOf(g), day, now, today }).catch(() => null); if (f && f.score != null) v = f.score; }
        if (s0 && v == null) started[g] = true;                   // (IN PROGRESS → RESUME)
        // DFIX2 (FABLE REVIEW #2, finding 7): YESTERDAY's run still in flight (DFIX1's yesterday-key rule — a tap resumes it) reads RESUME too
        if (!s0 && v == null) {
          const [s1, r1] = await Promise.all([val(`dly/${g}/${yday}/s/${pid}`), val(`dly/${g}/${yday}/r/${pid}`)]);
          const gone = s1 && r1 == null && dailyOf(g) && dailyOf(g).abandon ? await settleRun({ pid, cart: dailyOf(g), day: yday, now, today }).catch(() => null) : null;
          if (s1 && r1 == null && !(gone && gone.score != null)) { started[g] = true; startedDay[g] = yday; }
        }
        if (v == null) return;
        mineScores[g] = v;
        // (BOARD 2.0 B — SHARE TODAY: the finished run's spoiler-free share inputs from the SERVER's record, only when asked — the share tap)
        if (body.share) { let cart = null; try { cart = cartOf(g); } catch { /* not a judged daily */ } if (cart && cart.share) { try { const [record, data] = await Promise.all([val(`${base}/p/${pid}`), cart.load ? cart.load(day, now) : null]); const s = await cart.share({ record, day, startedAt: s0, data, base, pid }); if (s) shareOf[g] = s; } catch { /* the card falls back to the line */ } } }
        if (await val(`${base}/x/${pid}`)) { gated[g] = true; return; }
        // THE EVERYONE LINE (DM2): where a COUNTED score stands — only once the day has BAND_MIN counting finishers (never a stranger's data)
        const [hist, n] = await Promise.all([val(`${base}/h`), val(`${base}/n`)]);
        if ((n || 0) >= BAND_MIN) { const st = standing(dailyOf(g), hist || {}, n, v); stand[g] = { n, top: Math.round(st.top * 10) / 10, pct: st.pct }; }
      }));
      const friends = {};
      // (FRIENDS A — YOUR TABLE reads YOUR FRIENDS LIST on the server: a stranger's daily is never readable by naming their id; ≤ 12 —
      //  the phone's own pick kept to friends, else the friends you PLAYED WITH most recently, then the newest friendships)
      const picked = (Array.isArray(body.pids) ? body.pids : []).map(String).filter(isPid);
      const pids = tablePids((await val(`pfr/${pid}`)) || {}, pid, picked.length ? picked : null, now);
      await Promise.all(pids.map(async p => {
        const theirs = {};
        await Promise.all(games.map(async g => {
          const v = await val(`dly/${g}/${day}/r/${p}`);
          if (v == null) return;
          if (await val(`dly/${g}/${day}/x/${p}`)) return;          // (DM1 — THE THROWAWAY GATE: a non-counting result never ranks at YOUR TABLE)
          theirs[g] = v;
        }));
        friends[p] = todayView(mineScores, theirs);
      }));
      await closing;
      return { day, dailies, mine: mineScores, gated, started, startedDay, stand, lessons: ls || {}, friends, table: pids, ...(body.share ? { share: shareOf } : {}),
        ...(countsOn(createdAt, day) ? {} : { countsFrom: dayStartAt(dayOf(dayNum(day) + 1)) }) };
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
      return { mine: me0, friends: Object.fromEntries(pids.map((p, i) => [p, rest[i]])), table: pids };
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
  const score = await cart.verify(await dailySeed(cart.id, day), cart.judged ? null : result, { startedAt, now, record, day, data, pid, base, T });   // (THE DROP A: a verify may be async — it reads its log)
  if (typeof score !== 'number' || !Number.isFinite(score)) throw new ApiError(422, 'refused', 'That result doesn’t check out.');
  // DM1 — THE THROWAWAY GATE: does this profile's result COUNT on this day?
  const counts = countsOn(createdAt, day) && !preReset;
  // ONE official try: the first finish is the score (a retry gets the stored one back)
  const claim = await ref(`${base}/r/${pid}`).transaction(cur => (cur != null ? undefined : score));
  const kept = claim.snapshot.val();
  if (claim.committed) {
    const { ServerValue } = await import('firebase-admin/database');
    await ref('/').update(counts
      ? { [`${base}/h/${bucketOf(cart, kept)}`]: ServerValue.increment(1), [`${base}/n`]: ServerValue.increment(1) }
      : { [`${base}/x/${pid}`]: 1 });                         // (a non-counting result: kept for the player, out of the day's histogram)
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
  if (!preReset) await ref(`pstats/${pid}`).transaction(cur => { cur0 = cur; res = dailyStep(cur, { game: cart.id, day, now, top: stand.top, rank: stand.better + 1, n: stand.n, hourET: easternParts(day === today ? now : startedAt).h, outage, founderOpen: fOpen, flags, today: live, counts, points }); return res.skip ? undefined : res.next; });
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
  return { day, score: kept, again: !claim.committed, counted: counts, ...(preReset ? { pre: true } : {}), ...(counts || preReset ? {} : { countsFrom: dayStartAt(dayOf(dayNum(streakDay(Number(createdAt) || now)) + 1)) }),
    stand: { n: stand.n, pct: stand.pct, top: Math.round(stand.top * 10) / 10, band: stand.band ? stand.band.name : null },
    outcome: res && !res.skip ? { streak: res.streak, items: res.items, ach: res.ach, xp: res.xp, lv: res.lv, swept: res.swept, run: res.swept && res.dl.sr ? res.dl.sr.n : 0, points: res.points } : null };
}

export default route(['POST'], async (req, res) => {
  const T = timing();
  const uid = await requireUser(req);
  T.mark('auth');
  const body = await readBody(req);
  const out = withShow(await dailyAction(uid, body, Date.now(), T));
  send(res, 200, out, { 'Server-Timing': T.header() });
});
