// JAYWALK's DAILY — THE TRIES, the PURE half (DAILY A — docs/jaywalk.md "THE DAILY"; the owner's decisions: docs/games/plan.md "DAILY A / B").
// Never imports fb.js (THE UNIT JOB INSTALLS NOTHING — tests/jaywalk-daily.test.mjs runs it in Node); api/_lib/jaywalk-daily.js is the db half.
//
// THE DAY: the course = dailySeed('jaywalk', day) (THE DAILY SECRET — the same for everyone; practice never uses it), MODES.daily (THE MOTHERSHIP
// at 5:00). THREE TRIES, the BEST counts (lanes, then the earlier tick — daily-best.js#jwScore, `better: 'high'`). No pauses, no resume: a
// refresh, hiding the app or THE ROOM WINS ends the try (scored as it stands). Nothing a phone claims about lanes is read.
//
// THE RECORD (server-only, dly/jaywalk/{day}/p/{pid} — THE DROP's bookkeeping shape: st + e, a try list instead of a log):
//   { st: startedAt, n: tries opened, t: { [i]: { u (the uid that opened it), go, z, e? (closed — server time), l?, k? (the tick of the best lane),
//     s? (the try's score), w? (the cause), cut?, bad? (refused — why), why? ('fin' | 'start' | 'room' | 'quiet' | 'close') } }, e?: the last close }
// THE PROOF NODE (dly/jaywalk/{day}/w/{uid}/{i} — the phone appends, database.rules.json): { go, z (both server-written at START), c: { [k]:
//   { s: the packed hops, at: the SERVER's timestamp } } (append-only), e? (the phone's own end — a server timestamp; a signal, never a score) }.
//   Tick 0 = go (the START's time + LEAD_MS — the count-in); the rules take no chunk before go, after z (the try's last moment — the cap +
//   GRACE_MS for THE DROPPED SIGNAL's burst), or once `e` is set; no try index past 2.
import { verifyRun } from './jaywalk.js';
import { featsOf } from '../../js/games/jaywalk/logic.js';
import { logFromChunks, chunkTimes } from '../../js/games/jaywalk/replay.js';
import { MODES, TICK_HZ } from '../../js/games/jaywalk/tuning.js';
import { jwScore } from '../../js/core/daily-best.js';

export const TRIES = 3;
/** THE MOTHERSHIP's moment in ms (MODES.daily.cap — 5:00) */
export const CAP_MS = Math.round(MODES.daily.cap * 1000 / TICK_HZ);
/** GO = the START's server time + this (the phone's count-in: the answer reaches it before tick 0) */
export const LEAD_MS = 3000;
/** the chunks' window past THE MOTHERSHIP — THE DROPPED SIGNAL's burst lands after a silence of ≤ 75 s (tuning.js#CLOCK.drop) */
export const GRACE_MS = 90_000;
/** `today` closes an open try only once it can't still be in play: its `e`, its z passed, or no chunk for this long (a phone that's playing
 *  uploads every second; one that's gone silent this long was refreshed / hidden — an offline phone can't call `today` at all) */
export const QUIET_MS = 20_000;
/** the proof nodes are pruned past this many days (the tries' results stay in the record) */
export const PROOF_DAYS = 7;

const isNum = v => typeof v === 'number' && Number.isFinite(v);
/** the try list in order → [{ i, …try }] */
export const triesOf = rec => Object.entries((rec && rec.t) || {}).filter(([k, v]) => /^[0-2]$/.test(k) && v && typeof v === 'object').map(([k, v]) => ({ i: Number(k), ...v })).sort((a, b) => a.i - b.i);
/** the open try (opened, not closed) | null */
export const openOf = rec => triesOf(rec).find(x => !isNum(x.e)) || null;
/** tries used (opened — an open one counts) */
export const usedOf = rec => triesOf(rec).length;
export const leftOf = rec => Math.max(0, TRIES - usedOf(rec));
/** the best SCORED try's score | null (none closed yet) */
export function bestTry(rec) {
  let b = null;
  for (const x of triesOf(rec)) if (isNum(x.e) && isNum(x.s) && (b == null || x.s > b.s)) b = x;
  return b;
}
/** what the phone sees of the tries (never a path but its own, never the seed's secret): [{ i, l, w, cut?, bad?, open? }] */
export const triesView = rec => triesOf(rec).map(x => (isNum(x.e) ? { i: x.i, l: x.l || 0, k: x.k || 0, w: x.w || '', ...(x.cut ? { cut: 1 } : {}), ...(x.bad ? { bad: 1 } : {}), ...(x.why === 'room' ? { room: 1 } : {}) } : { i: x.i, open: 1, go: x.go, z: x.z }));

/**
 * START (inside the record's transaction): a NEW try — refused while one is open (the caller closes it first — condition 1) or once all
 * three are used. → { record, i, go, z } | { refused: 'open' | 'no_tries' }
 */
export function openTry(rec0, { uid, now, startedAt }) {
  const rec = rec0 && typeof rec0 === 'object' ? rec0 : { st: startedAt || now, n: 0, t: {} };
  if (openOf(rec)) return { refused: 'open' };
  const i = usedOf(rec);
  if (i >= TRIES) return { refused: 'no_tries' };
  const go = now + LEAD_MS, z = go + CAP_MS + GRACE_MS;
  return { record: { ...rec, st: rec.st || startedAt || now, n: i + 1, t: { ...(rec.t || {}), [i]: { u: String(uid), go, z } } }, i, go, z };
}

/** is an open try still possibly in play at `now`? (no `e` on its node, z not passed, a chunk / GO within QUIET_MS) */
export function liveTry(t, node, now) {
  if (!t || isNum(t.e)) return false;
  if (node && isNum(node.e)) return false;
  if (now >= t.z) return false;
  const last = Math.max(t.go, ...Object.values((node && node.c) || {}).map(c => (c && isNum(c.at) ? c.at : 0)));
  return now - last < QUIET_MS;
}

/**
 * THE TRY's SCORE from its proof node — THE JUDGE (api/_lib/jaywalk.js#verifyRun: the log's bounds, THE SPEED CHECK both ways, THE DROPPED
 * SIGNAL, the replay) on the day's seed, mode 'daily', tick 0 = the try's GO (the SERVER's, from the record — never the node's). As it stands:
 * an abandoned try's kid idles in the replay until the wall takes him (his lanes stay what he reached). A refused log = 0 lanes (`bad`).
 * → { l, k, s, w, f? (the feats — 'boom ufo airfield mothership'), cut?, bad? }
 */
export function scoreTry({ seed, go, z = null, node }) {
  // (the rules refuse a chunk past z — the server never reads one either: the log = the chunks up to the first one stamped after the window)
  let c = node && node.c;
  if (c && isNum(z)) { const kept = {}; for (let k = 0; c[k] != null && !(isNum(c[k].at) && c[k].at > z); k++) kept[k] = c[k]; c = kept; }
  const log = logFromChunks(c), times = chunkTimes(c);
  const bad = why => ({ l: 0, k: 0, s: jwScore(0, 0), w: '', bad: String(why || 'refused').slice(0, 24) });
  if (!log || !times) return bad('chunks');
  const v = verifyRun({ seed: String(seed), mode: 'daily', log, go, times });
  if (!v.ok) return bad(v.why);
  const r = v.result;
  // (DAILY B: + the try's FEATS from the replay — `f`, the match's own word list: its four cards + YOUR BEST are credited from THIS — jaywalk-credit.js)
  const f = featsOf(r);
  return { l: r.lanes, k: r.tick, s: jwScore(r.lanes, r.tick), w: r.cause || '', ...(f ? { f } : {}), ...(v.cut ? { cut: 1 } : {}) };
}

/** CLOSE a try (inside the record's transaction): its result + `e` (server time) — a try already closed is left alone → the record | null */
export function closeTry(rec, i, result, { now, why = 'fin' } = {}) {
  const t = rec && rec.t && rec.t[i];
  if (!t || isNum(t.e)) return null;
  return { ...rec, e: now, t: { ...rec.t, [i]: { ...t, ...result, e: now, why } } };
}

/** the score THE DAY counts (the best closed try) — api/daily.js#finishRun claims / raises dly/jaywalk/{day}/r/{pid} with it */
export const dayScore = rec => { const b = bestTry(rec); return b ? b.s : null; };

/**
 * DAILY B — SHARE TODAY's JAYWALK inputs (SPOILER-FREE: never the course, the seed or a hop): { t: [lanes | null — one per try, null =
 * unplayed / still open], b: the best try's index (-1 none), nb: 1 = a NEW DAILY BEST today, day } — js/games/jaywalk/daily-share.js draws them.
 */
export function shareOf(rec, { day = null, nb = false } = {}) {
  const t = [null, null, null];
  for (const x of triesOf(rec)) if (isNum(x.e)) t[x.i] = Math.max(0, Math.floor(Number(x.l) || 0));
  const b = bestTry(rec);
  return { t, b: b ? b.i : -1, nb: nb ? 1 : 0, day: /^d\d{8}$/.test(String(day || '')) ? String(day) : null };
}
