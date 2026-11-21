// JAYWALK's DAILY on the server (DAILY A — docs/jaywalk.md "THE DAILY"): the cartridge (JAYWALK_DAILY — registered in dailies.js#SERVER_CARTS;
// its config.js#DAILIES row ships `on: false`) + THE TRIES' database half (the pure half: ./jaywalk-tries.js). THE DROP's bookkeeping only —
// begin (START opens a try) / record (the phone appends its hop chunks to its own proof node, the rules check them) / close (FINISH, the next
// START, THE ROOM WINS, `today` once the try can't be in play, THE DAY'S CLOSE) — every close REPLAYS the proof node (verifyRun) and then the
// day's score is the BEST closed try (api/daily.js#finishRun: the FIRST closed try counts the day — the streak, the XP once, THE SWEEP; a
// better later try RAISES the score, the lists, the points, PENTHOUSE's input + DAILY BEST).
import { ref, val } from './fb.js';
import { dailySeed } from './dailies.js';   // (a cycle — dailies.js lists this cartridge; the seed is only read inside a call)
import { TRIES, PROOF_DAYS, openTry, openOf, liveTry, scoreTry, closeTry, triesOf, triesView, leftOf, usedOf, dayScore, bestTry, shareOf } from './jaywalk-tries.js';
import { jwLanes, bestView } from '../../js/core/daily-best.js';
import { tryVersion } from '../../js/games/jaywalk/versions.js';

const SEEDS = new Map();
/** THE DAY: its seed (an HMAC of THE DAILY SECRET — the same for everyone, memoised per warm function) */
export async function jwDay(day) {
  if (!SEEDS.has(day)) {
    const p = dailySeed('jaywalk', day).then(seed => ({ seed: `d${seed}` }), e => { SEEDS.delete(day); throw e; });
    SEEDS.set(day, p);
    for (const k of [...SEEDS.keys()].slice(0, -4)) SEEDS.delete(k);
  }
  return SEEDS.get(day);
}
export const forgetJwDays = () => SEEDS.clear();

/** the try's proof node path (the phone writes here — its own uid, its try index) */
export const proofPath = (day, uid, i) => `dly/jaywalk/${day}/w/${uid}/${i}`;

/**
 * CLOSE the open try of `pid` on `day` (scored AS IT STANDS from its proof node) — unless `onlyIfGone` and it may still be in play (liveTry).
 * → the closed try { i, l, k, s, w, … } | null (nothing open / still live / already closed by another call)
 */
export async function closeOpen({ pid, day, now, why = 'fin', onlyIfGone = false }) {
  const base = `dly/jaywalk/${day}`;
  const rec = await val(`${base}/p/${pid}`);
  const t = openOf(rec);
  if (!t) return null;
  const node = await val(proofPath(day, t.u, t.i));
  if (onlyIfGone && liveTry(t, node, now)) return null;
  const { seed } = await jwDay(day);
  const result = scoreTry({ seed, go: t.go, z: t.z, node, cv: t.cv === 2 ? 2 : 1 });   // (J2: the version the try was opened on)
  let closed = null;
  await ref(`${base}/p/${pid}`).transaction(cur => {
    if (cur == null) return null;
    const nx = closeTry(cur, t.i, result, { now, why });
    closed = nx ? { i: t.i, ...result } : null;
    return nx || undefined;
  });
  // (the node's own `e` — no chunk lands after the close: the rules refuse a chunk once it is set)
  if (closed && !(node && node.e)) await ref(`${proofPath(day, t.u, t.i)}/e`).set(now).catch(() => {});
  return closed;
}

/**
 * START a try (api/daily.js `start` for a `tries` cartridge): an open try is CLOSED first (condition 1 — scored as it stands; the caller then
 * settles the day's score); a 4th refused (409 no_tries). The proof node is opened HERE ({ go, z } — server-written: the phone never picks its
 * clock). → { run: { seed, try, go, z, path, left, tries } } | { refused: 'no_tries', run }
 */
export async function startTry({ pid, uid, day, now, startedAt, cvs = null, cvr = null }) {
  const base = `dly/jaywalk/${day}`;
  const prior = await closeOpen({ pid, day, now, why: 'start' });
  const { seed } = await jwDay(day);
  // (J2 — COURSE RULES v2: the day's version — the one in force at its 4 am — if the phone knows it (`cvs`: the newest it knows; an old-code
  //  phone sends none → v1 until THE GRACE ends, then it is told to refresh). The SERVER picks it; the phone plays what START answers)
  //  (J2 FIX: + `cvr` — the v2 numbers' revision the phone plays: a phone still on the pre-fix J2 build sends none → refused on a v2 day, told to refresh)
  const cv = tryVersion(day, cvs, now, cvr);
  if (!cv) return { refused: 'old_version', prior, run: { seed: null } };
  let opened = null, refused = null;
  const tx = await ref(`${base}/p/${pid}`).transaction(cur => {
    const r = openTry(cur, { uid, now, startedAt, cv });
    if (r.refused) { refused = r.refused; opened = null; return undefined; }
    refused = null; opened = r;
    return r.record;
  });
  const rec = tx.snapshot.val();
  if (refused || !opened) return { refused: refused || 'open', prior, run: { seed, left: leftOf(rec), tries: triesView(rec) } };
  await ref(proofPath(day, uid, opened.i)).set({ go: opened.go, z: opened.z });
  return { prior, run: { seed, try: opened.i, go: opened.go, z: opened.z, path: proofPath(day, uid, opened.i), left: leftOf(opened.record), tries: triesView(opened.record), ...(opened.cv === 2 ? { cv: 2 } : {}) } };
}

export const JW_BUCKETS = 121;
export const JAYWALK_DAILY = {
  id: 'jaywalk', name: 'JAYWALK', better: 'high', buckets: JW_BUCKETS,
  /** 5-lane buckets (0 … 600 → 0 … 120) */
  bucket: score => jwLanes(score) / 5,
  judged: true, tries: TRIES,
  moves: [],                                       // (no dig, no chunk move, and NO PAUSE: a try never pauses — THE ROOM WINS ends it)
  load: day => jwDay(day),
  startTry, closeOpen,
  /** the day's score = the best CLOSED try (the record's — the phone's claim is never read) */
  verify: async (seed, result, { record } = {}) => dayScore(record),
  /** what a resumed screen gets: the tries so far (a try is never resumed — an open one is closed by the next START) */
  resume: ({ record, data }) => ({ seed: data && data.seed, left: leftOf(record), tries: triesView(record), used: usedOf(record) }),
  /** DAILY B — SHARE TODAY's section inputs (spoiler-free — jaywalk-tries.js#shareOf) + NEW DAILY BEST from the player's own DAILY BEST */
  share: async ({ record, day, pid }) => shareOf(record, { day, nb: pid ? bestView(await val(`pstats/${pid}/db/jaywalk`), day).newBest : false }),
  endView: ({ record }) => { const b = bestTry(record); return { tries: triesView(record), left: leftOf(record), best: b ? { i: b.i, l: b.l, k: b.k, w: b.w } : null }; },
  /** THE DAY'S CLOSE + the next `today`: an open try that can't come back is closed (force: the day is over — whatever its state) */
  abandon: () => null,
  async settle({ pid, day, now, force = false }) { return closeOpen({ pid, day, now, why: force ? 'close' : 'quiet', onlyIfGone: !force }); },
  /** THE PRUNE (condition 4): the proof nodes past PROOF_DAYS (the tries' results + the day's scores stay) — daily-close.js#sweepRuns */
  pruneDays: PROOF_DAYS + 3,
  async prune({ day, back }) {
    if (back <= PROOF_DAYS) return 0;
    const base = `dly/jaywalk/${day}`;
    if (Number(await val(`${base}/pr`)) >= 1) return 0;
    await ref('/').update({ [`${base}/w`]: null, [`${base}/pr`]: 1 });
    return 1;
  },
};
export { triesOf, triesView, leftOf };
