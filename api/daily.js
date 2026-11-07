// POST /api/daily { action, … } — THE DAILY CONTRACT (PROGRESSION A; core/daily.js). Signed-in players with a profile; no database socket
// on the phone (THE PARKED DATABASE — a solo daily is /api only).
//   start  { game }            → { day, seed, startedAt, done? }      ONE OFFICIAL TRY: the first start is recorded (a refresh = the same try)
//                                 a JUDGED daily (PW1 — THE PASSWORD, _lib/pw.js: cart.judged) gets { day, startedAt, done?, run } instead — the run so
//                                 far from the SERVER's record (a resume), and NO seed (a seed a phone holds must say nothing about the answers)
//   guess  { game, word }      → { door, n, marks, solved?, failed?, word? (that door just closed), next?, done? }   a judged daily only: the server
//                                 judges every guess inside a transaction on its record; a word that isn't one is refused with NO cost (422 not_a_word)
//   finish { game, result }    → { day, score, stand: { n, pct, top, band }, outcome: { streak, items } }   checked + stored server-side
//                                 (a judged daily scores from ITS record — the phone's result is ignored; an unfinished run → 409 not_done)
//   today  { pids? }           → { day, mine: { game: score }, friends: { pid: { game: { done } | { score } } } }   (YOUR TABLE's TODAY)
//
//   dly/{game}/{day}/s/{pid}: startedAt · r/{pid}: score · h/{bucket}: count · n: finishers · p/{pid}: a judged daily's record      (server only — the rules' default deny)
import { withShow } from './_lib/catalog.js';   // (THE VAULT 1B: registers the server-only catalog + names only to owners)
import { route, send, readBody, requireUser, ApiError } from './_lib/http.js';
import { ref, val } from './_lib/fb.js';
import { pidOf } from './_lib/profiles.js';
import { bumpOwners } from './_lib/owners.js';
import { outageDays } from './_lib/stats.js';
import { dailySeed, loadDailies } from './_lib/dailies.js';
import { dailyOf, bucketOf, standing, todayView, dailyIds } from '../js/core/daily.js';
import { streakDay } from '../js/core/streak.js';
import { dailyStep } from '../js/core/progress.js';
import { easternParts } from '../js/core/week.js';
import { founderOpen } from './_lib/founder.js';
import { isPid } from './_lib/profiles.js';

async function mine(uid) {
  const pid = await pidOf(uid);
  if (!pid) throw new ApiError(404, 'no_profile');
  return pid;
}
const cartOf = id => { const c = dailyOf(id); if (!c) throw new ApiError(404, 'no_daily'); return c; };

export async function dailyAction(uid, body, now = Date.now()) {
  loadDailies();
  const day = streakDay(now);
  switch (body.action) {
    case 'start': {
      const pid = await mine(uid), cart = cartOf(body.game), base = `dly/${cart.id}/${day}`;
      const tx = await ref(`${base}/s/${pid}`).transaction(cur => (cur ? undefined : now));
      const startedAt = tx.snapshot.val();
      const done = await val(`${base}/r/${pid}`);
      if (cart.judged) {
        const record = await val(`${base}/p/${pid}`);
        return { day, startedAt, done: done ?? null, run: cart.resume({ record, day, startedAt }) };
      }
      return { day, seed: dailySeed(cart.id, day), startedAt, done: done ?? null };
    }
    case 'guess': {
      const pid = await mine(uid), cart = cartOf(body.game), base = `dly/${cart.id}/${day}`;
      if (!cart.judged) throw new ApiError(400, 'bad_action', 'This daily judges itself.');
      const startedAt = await val(`${base}/s/${pid}`);
      if (!startedAt) throw new ApiError(409, 'not_started', 'Start today’s daily first.');
      if ((await val(`${base}/r/${pid}`)) != null) throw new ApiError(409, 'finished', 'Today’s run is done.');
      // the word's spelling first — refused before anything is written (no cost); then the guess inside ONE transaction on the record
      const pre = cart.judge({ record: null, word: body.word, day, startedAt, now });
      if (pre.refused === 'not_a_word') throw new ApiError(422, 'not_a_word', 'Not in the word list.');
      let out = null, refused = null;
      const tx = await ref(`${base}/p/${pid}`).transaction(cur => {
        const r = cart.judge({ record: cur, word: body.word, day, startedAt, now });
        if (r.refused) { refused = r.refused; out = null; return undefined; }
        refused = null; out = r.resp;
        return r.record;
      });
      if (!tx.committed || !out) throw new ApiError(409, refused === 'done' ? 'finished' : refused === 'closed' ? 'closed' : 'refused', refused === 'done' ? 'Today’s run is done.' : 'That door is closed.');
      return { day, ...out };
    }
    case 'finish': {
      const pid = await mine(uid), cart = cartOf(body.game), base = `dly/${cart.id}/${day}`;
      const startedAt = await val(`${base}/s/${pid}`);
      if (!startedAt) throw new ApiError(409, 'not_started', 'Start today’s daily first.');
      // a JUDGED daily scores from the server's own record — the phone's result is never read (an unfinished run: come back when it's done)
      const record = cart.judged ? await val(`${base}/p/${pid}`) : null;
      if (cart.judged && !(record && record.e)) throw new ApiError(409, 'not_done', 'Finish the run first.');
      const score = cart.verify(dailySeed(cart.id, day), cart.judged ? null : body.result, { startedAt, now, record, day });
      if (typeof score !== 'number' || !Number.isFinite(score)) throw new ApiError(422, 'refused', 'That result doesn’t check out.');
      // ONE official try: the first finish is the score (a retry gets the stored one back)
      const claim = await ref(`${base}/r/${pid}`).transaction(cur => (cur != null ? undefined : score));
      const kept = claim.snapshot.val();
      if (claim.committed) {
        const { ServerValue } = await import('firebase-admin/database');
        await ref('/').update({ [`${base}/h/${bucketOf(cart, kept)}`]: ServerValue.increment(1), [`${base}/n`]: ServerValue.increment(1) });
      }
      const [hist, n] = await Promise.all([val(`${base}/h`), val(`${base}/n`)]);
      const stand = standing(cart, hist || {}, n || 1, kept);
      // the player's stats: THE STREAK + the dailies' counters (idempotent by the day's key)
      const outage = await outageDays().catch(() => ({}));
      const fOpen = await founderOpen(now).catch(() => false);
      let res = null;
      await ref(`pstats/${pid}`).transaction(cur => { res = dailyStep(cur, { game: cart.id, day, now, top: stand.top, n: stand.n, hourET: easternParts(now).h, outage, founderOpen: fOpen }); return res.skip ? undefined : res.next; });
      if (res && !res.skip) {
        const st = res.next.st;
        await ref('/').update({ [`profiles/${pid}/s`]: st.n, [`profiles/${pid}/sd`]: st.d });
        await bumpOwners(res.items, !(res.next.g && Object.keys(res.next.g).length) && res.dl.n === 1, res.ach).catch(() => {});
        if (res.next.fd) await ref(`profiles/${pid}/fd`).set(true);
      }
      return { day, score: kept, again: !claim.committed, stand: { n: stand.n, pct: stand.pct, top: Math.round(stand.top * 10) / 10, band: stand.band ? stand.band.name : null },
        outcome: res && !res.skip ? { streak: res.streak, items: res.items, ach: res.ach } : null };
    }
    case 'today': {
      const pid = await mine(uid);
      const games = dailyIds();
      const mineScores = {};
      await Promise.all(games.map(async g => { const v = await val(`dly/${g}/${day}/r/${pid}`); if (v != null) mineScores[g] = v; }));
      const friends = {};
      const pids = (Array.isArray(body.pids) ? body.pids : []).map(String).filter(isPid).filter(p => p !== pid).slice(0, 12);
      await Promise.all(pids.map(async p => {
        const theirs = {};
        await Promise.all(games.map(async g => { const v = await val(`dly/${g}/${day}/r/${p}`); if (v != null) theirs[g] = v; }));
        friends[p] = todayView(mineScores, theirs);
      }));
      return { day, mine: mineScores, friends };
    }
    default: throw new ApiError(400, 'bad_action');
  }
}

export default route(['POST'], async (req, res) => {
  const uid = await requireUser(req);
  const body = await readBody(req);
  send(res, 200, withShow(await dailyAction(uid, body)));
});
