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
//   today  { pids? }           → { day, dailies: [row…], mine: { game: score }, gated: { game: true }, started: { game: true } (in flight), stand: { game:
//                                 { n, top, pct } } (a counted score's place once ≥ BAND_MIN), lessons: { game: 1 }, countsFrom? (a same-day profile), friends: { pid: { game: { done } | { score } } }, table: [pid] }
//                                 (YOUR TABLE's TODAY — FRIENDS A: only YOUR FRIENDS (pfr/{pid}/f), ≤ 12; a friend's NON-COUNTING result is left out)
//   lesson { game }            → { ok }   DM2 — a daily's first-time lesson seen (pstats/{pid}/ls/{game} — once per player, every device)
//   room   { room }            → { mid: [uid…] }   DM1 — which players of YOUR room have a daily in flight (uids only — nothing about a run; DM2's host line)
//
//   dly/{game}/{day}/s/{pid}: startedAt · r/{pid}: score · x/{pid}: 1 (DM1 — a non-counting result) · h/{bucket}: count · n: finishers · p/{pid}: a judged
//   daily's record · b: the day's data (THE 4 AM PICKER — the pair / the board)      (server only — the rules' default deny)
//   DM1 — THE CALL BUDGET: CALLS.max calls a uid per CALLS.windowMs (rl/dc_{uid} — a COAST CLEAR run is ~50–110 calls, a PASSWORD run ≤ 15) → 429 slow_down
import { withShow } from './_lib/catalog.js';   // (THE VAULT 1B: registers the server-only catalog + names only to owners)
import { route, send, readBody, requireUser, ApiError } from './_lib/http.js';
import { ref, val } from './_lib/fb.js';
import { pidOf } from './_lib/profiles.js';
import { bumpOwners } from './_lib/owners.js';
import { outageDays } from './_lib/stats.js';
import { take } from './_lib/limit.js';
import { dailySeed, openDailies, pickDay } from './_lib/dailies.js';
import { roomStarted, midDaily } from './_lib/daily-room.js';
import { dailyOf, bucketOf, standing, todayView, todaysDailies, dailyRow, BAND_MIN } from '../js/core/daily.js';
import { streakDay, dayNum, dayOf, dayStartAt } from '../js/core/streak.js';
import { dailyStep } from '../js/core/progress.js';
import { levelOf, emblemRank } from '../js/core/levels.js';
import { easternParts } from '../js/core/week.js';
import { founderOpen } from './_lib/founder.js';
import { isPid } from './_lib/profiles.js';
import { tablePids } from '../js/core/friends.js';

/** DM1 — THE CALL BUDGET: generous for real play (both dailies, retries, refreshes), a flood refused */
export const CALLS = { max: 400, windowMs: 10 * 60_000 };

async function mine(uid) {
  const pid = await pidOf(uid);
  if (!pid) throw new ApiError(404, 'no_profile');
  return pid;
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
/** DM1 — THE THROWAWAY GATE (PURE): a profile made at `createdAt` counts on `day` only if it existed before that day's 4 am Eastern start (no
 *  creation time = an old profile = counts) */
export const countsOn = (createdAt, day) => !(Number(createdAt) > 0) || Number(createdAt) < dayStartAt(day);
/** the profile's server-side creation time (ppriv/{pid}/at — written once, by the server, when the profile is made) */
const createdAtOf = pid => val(`ppriv/${pid}/at`);

export async function dailyAction(uid, body, now = Date.now()) {
  body = body && typeof body === 'object' ? body : {};
  // the live dailies (THE GO-LIVE SWITCH, cached) + THE CALL BUDGET — together (the budget never adds a wait to a dig)
  const [, allowed] = await Promise.all([openDailies(now), take(`dc_${String(uid).replace(/[.#$[\]/]/g, '_')}`, CALLS.max, CALLS.windowMs, now)]);
  if (!allowed) throw new ApiError(429, 'slow_down', 'Too many moves — wait a minute.');
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
      if (startedAt == null) {
        const tx = await ref(`${base}/s/${pid}`).transaction(cur => (cur ? undefined : now));
        startedAt = tx.snapshot.val();
      }
      const done = await val(`${base}/r/${pid}`);
      await picked;
      if (cart.judged) {
        const [record, data] = await Promise.all([val(`${base}/p/${pid}`), cart.load ? cart.load(day, now) : null]);
        return { day, startedAt, done: done ?? null, run: cart.resume({ record, day, startedAt, data }), now };
      }
      return { day, seed: await dailySeed(cart.id, day), startedAt, done: done ?? null };
    }
    case 'guess': {
      const day = dayOfCall(body, now);
      const pid = await mine(uid), cart = cartOf(body.game), base = `dly/${cart.id}/${day}`;
      if (!cart.judged || typeof cart.judge !== 'function') throw new ApiError(400, 'bad_action', 'This daily has no such move.');
      const [startedAt, result, data] = await Promise.all([val(`${base}/s/${pid}`), val(`${base}/r/${pid}`), cart.load ? cart.load(day, now) : null]);
      if (!startedAt) throw new ApiError(409, 'not_started', 'Start today’s daily first.');
      if (result != null) throw new ApiError(409, 'finished', 'Today’s run is done.');
      // the word's spelling first — refused before anything is written (no cost); then the guess inside ONE transaction on the record
      const pre = cart.judge({ record: null, word: body.word, day, startedAt, now, data });
      if (pre.refused === 'not_a_word') throw new ApiError(422, 'not_a_word', 'Not in the word list.');
      let out = null, refused = null;
      const tx = await ref(`${base}/p/${pid}`).transaction(cur => {
        const r = cart.judge({ record: cur, word: body.word, day, startedAt, now, data });
        if (r.refused) { refused = r.refused; out = null; return undefined; }
        refused = null; out = r.resp;
        return r.record;
      });
      if (!tx.committed || !out) throw new ApiError(409, refused === 'done' ? 'finished' : refused === 'closed' ? 'closed' : 'refused', refused === 'done' ? 'Today’s run is done.' : 'That door is closed.');
      return { day, ...out };
    }
    case 'dig': case 'chord': case 'pause': case 'resume': {
      // CC1 — a judged cartridge's MOVES (COAST CLEAR): the day's data (its board) + the start in parallel, then ONE transaction on the record
      const day = dayOfCall(body, now);
      const pid = await mine(uid), cart = cartOf(body.game), base = `dly/${cart.id}/${day}`;
      if (!cart.judged || typeof cart.act !== 'function' || !(cart.moves || []).includes(body.action)) throw new ApiError(400, 'bad_action', 'This daily has no such move.');
      const [startedAt, data, room] = await Promise.all([val(`${base}/s/${pid}`), cart.load ? cart.load(day, now) : null,
        body.action === 'pause' ? roomStarted({ uid, pid, code: body.room, now }) : null]);
      if (!startedAt) throw new ApiError(409, 'not_started', 'Start today’s daily first.');
      // DM1 — THE ROOM WINS: a pause only for a room that really started a game (the clock keeps running otherwise)
      if (body.action === 'pause' && !room) throw new ApiError(409, 'no_room_game', 'The clock only stops when your room starts a game.');
      let out = null, refused = null, status = 409;
      await ref(`${base}/p/${pid}`).transaction(cur => {
        out = null; refused = null;
        const r = cart.act({ action: body.action, body, record: cur, day, startedAt, now, data });
        if (r.refused) { refused = r.refused; status = r.status || 409; }
        else out = r.resp;
        // a transaction's FIRST call may see null (nothing cached here): never abort on it — write what the move made (or the fresh record), so
        // the server checks it against the stored one and retries with the real record
        if (cur == null) return r.record || { st: startedAt };
        return r.record || undefined;                              // nothing changed (a repeat, a refusal) → nothing written
      });
      if (refused) {
        const code = refused === 'done' ? 'finished' : refused;
        throw new ApiError(status, code, code === 'finished' ? 'Today’s run is done.' : code === 'pause_limit' ? 'No more pauses this run — the clock is running.' : 'That move doesn’t work there.');
      }
      if (!out) throw new ApiError(409, 'refused', 'Try that again.');
      return { day, ...out, now };
    }
    case 'finish': {
      const day = dayOfCall(body, now);
      const pid = await mine(uid), cart = cartOf(body.game), base = `dly/${cart.id}/${day}`;
      const [startedAt, createdAt] = await Promise.all([val(`${base}/s/${pid}`), createdAtOf(pid)]);
      if (!startedAt) throw new ApiError(409, 'not_started', 'Start today’s daily first.');
      // a JUDGED daily scores from the server's own record — the phone's result is never read (an unfinished run: come back when it's done)
      const record = cart.judged ? await val(`${base}/p/${pid}`) : null;
      if (cart.judged && !(record && record.e)) throw new ApiError(409, 'not_done', 'Finish the run first.');
      const data = cart.judged && cart.load ? await cart.load(day, now) : null;
      const score = cart.verify(await dailySeed(cart.id, day), cart.judged ? null : body.result, { startedAt, now, record, day, data });
      if (typeof score !== 'number' || !Number.isFinite(score)) throw new ApiError(422, 'refused', 'That result doesn’t check out.');
      // DM1 — THE THROWAWAY GATE: does this profile's result COUNT on this day?
      const counts = countsOn(createdAt, day);
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
      const outage = await outageDays().catch(() => ({}));
      const fOpen = await founderOpen(now).catch(() => false);
      let res = null;
      // (PW2 — a judged daily's FLAGS come from the server's own record, never the phone: THE PASSWORD's crack / safe → KEYHOLE / SAFECRACKER)
      const flags = counts && cart.judged && cart.flags ? cart.flags({ record, day, startedAt, data }) : null;
      const live = todaysDailies();
      await ref(`pstats/${pid}`).transaction(cur => { res = dailyStep(cur, { game: cart.id, day, now, top: stand.top, rank: stand.better + 1, n: stand.n, hourET: easternParts(day === today ? now : startedAt).h, outage, founderOpen: fOpen, flags, today: live, counts }); return res.skip ? undefined : res.next; });
      if (res && !res.skip) {
        const st = res.next.st, xp = res.next.xp || 0;
        await ref('/').update({ [`profiles/${pid}/s`]: st.n, [`profiles/${pid}/sd`]: st.d, [`profiles/${pid}/x`]: xp, [`profiles/${pid}/l`]: levelOf(xp), [`profiles/${pid}/r`]: emblemRank(xp) });
        await bumpOwners(res.items, !(res.next.g && Object.keys(res.next.g).length) && res.dl.n === 1, res.ach).catch(() => {});
        if (res.next.fd) await ref(`profiles/${pid}/fd`).set(true);
      }
      return { day, score: kept, again: !claim.committed, counted: counts, ...(counts ? {} : { countsFrom: dayStartAt(dayOf(dayNum(streakDay(Number(createdAt) || now)) + 1)) }),
        stand: { n: stand.n, pct: stand.pct, top: Math.round(stand.top * 10) / 10, band: stand.band ? stand.band.name : null },
        outcome: res && !res.skip ? { streak: res.streak, items: res.items, ach: res.ach, xp: res.xp, lv: res.lv, swept: res.swept, run: res.swept && res.dl.sr ? res.dl.sr.n : 0 } : null };
    }
    case 'today': {
      const day = today;
      const games = todaysDailies();
      // the list for the DAILY screen (DM2 — TODAY's rows, the SCORES sections, the dock badge): the LIVE dailies, in order — answered WITHOUT a
      // profile too (a new phone still sees the dock button; THE GO-LIVE SWITCH off → an empty list → no button)
      const dailies = games.map(id => { const r = dailyRow(id) || {}, c = dailyOf(id) || {}; return { id, name: r.name || c.name, order: r.order ?? 99, ticket: r.ticket || id, lesson: !!r.lesson, better: c.better || 'high', hook: r.hook || r.tag || '' }; });
      const pid = await pidOf(uid);
      if (!pid) return { day, dailies, mine: {}, gated: {}, started: {}, stand: {}, lessons: {}, friends: {}, table: [], noProfile: true };
      const mineScores = {}, gated = {}, started = {}, stand = {};
      const [ls, createdAt] = await Promise.all([val(`pstats/${pid}/ls`), createdAtOf(pid)]);
      await Promise.all(games.map(async g => {
        const base = `dly/${g}/${day}`;
        const [v, s0] = await Promise.all([val(`${base}/r/${pid}`), val(`${base}/s/${pid}`)]);
        if (s0 && v == null) started[g] = true;                   // (IN PROGRESS → RESUME)
        if (v == null) return;
        mineScores[g] = v;
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
      return { day, dailies, mine: mineScores, gated, started, stand, lessons: ls || {}, friends, table: pids,
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
    case 'room': {
      const mid = await midDaily({ uid, code: body.room, games: todaysDailies(), now });
      if (!mid) throw new ApiError(403, 'not_in_room', 'Only someone in the room can ask.');
      return { mid };
    }
    default: throw new ApiError(400, 'bad_action');
  }
}

export default route(['POST'], async (req, res) => {
  const uid = await requireUser(req);
  const body = await readBody(req);
  send(res, 200, withShow(await dailyAction(uid, body)));
});
