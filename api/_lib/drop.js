// THE DROP on the server (THE DROP A — docs/prism.md "THE DROP"; the owner's plan: docs/games/plan.md "THE DROP"): PRISM DROP's daily — the
// run is PLAYED on the phone (js/games/prism/drop.js), its INPUT LOG uploaded in chunks during the run and REPLAYED here through the same pure
// engine (js/games/prism/drop-judge.js — the record, the pauses, THE SLOW-MOTION CHECK, the finish). THE DAY = its seed from THE DAILY
// SECRET (dailies.js#dailySeed — never the date, never the pepper); the phone gets the seed (it plays the pieces), never anything else.
//
//   start            → { run: { seed, go, k, len, log, t, ln, clock…, e? } } — a fresh run, or a RESUME at the latest checkpoint (a pause used)
//   checkpoint { at, add, k, fin? } → the chunk bounded by size / order / time (NO replay — THE ADD-ON) — { k, len, e? } | { resync, len }
//   ppause / pause / resume  → a PLAYER pause (one of the 3) · THE ROOM WINS' pause (the api checks the room — free) · the clock back
//   finish           → the WHOLE log (its chunks) replayed ONCE → ONE score: tenths × 1000 + lines (`better: 'high'`)
//   THE PRUNE (THE ADD-ON): once the day's board is final (2 days on — the run window over, every run settled) only the TOP runs keep their
//   record + log (PRUNE_KEEP), for KEEP_LOG_DAYS; everyone else keeps the score row (s + r). From the day's own keys — never a profile scan.
//   dly/drop/{day}/p/{pid} = the small record (drop-judge.js) · dly/drop/{day}/l/{pid}/{offset} = the log's chunks (server-only — the rules'
//   default deny). Registered by dailies.js like the others: THE GO-LIVE SWITCH + its row's `on` (OFF in THE DROP A) or DAILY_TEST=1.
import { ref, val } from './fb.js';
import { dailySeed } from './dailies.js';   // (a cycle — dailies.js lists this cartridge; the seed is only read inside a call)
import { act, begin, clockOf, judgeFinish, joinChunks, abandoned, abandon, CHUNK_MAX } from '../../js/games/prism/drop-judge.js';
import { tenthsOf, replay } from '../../js/games/prism/drop.js';
import { boardString } from '../../js/games/prism/engine.js';
import { dropInputs } from '../../js/games/drop/share.js';

const SEEDS = new Map();
/** THE DAY: its seed (an HMAC of THE DAILY SECRET — the same for everyone, memoised per warm function) */
export async function dropDay(day) {
  if (!SEEDS.has(day)) {
    const p = dailySeed('drop', day).then(seed => ({ seed: String(seed) }), e => { SEEDS.delete(day); throw e; });
    SEEDS.set(day, p);
    for (const k of [...SEEDS.keys()].slice(0, -4)) SEEDS.delete(k);
  }
  return SEEDS.get(day);
}
export const forgetDropDays = () => SEEDS.clear();

/** 5-second buckets of the time survived (0 … 8:00 → 0 … 96) */
export const DROP_BUCKETS = 97;

export const DROP_DAILY = {
  id: 'drop', name: 'THE DROP', better: 'high', buckets: DROP_BUCKETS,
  bucket: score => tenthsOf(score) / 50,
  judged: true,
  moves: ['checkpoint', 'ppause', 'pause', 'resume'],
  load: day => dropDay(day),
  /** a start on the record (inside a transaction): the first makes it, a later one is a RESUME (drop-judge.js#begin) */
  begin: ({ record, startedAt, now }) => begin(record, { startedAt, now }),
  /** the chunk is written BEFORE the move's transaction, keyed by its offset (the finish reads only what the checked length covers) */
  stash({ body, base, pid }) {
    const add = body && typeof body.add === 'string' ? body.add : '';
    const at = Number(body && body.at);
    if (!add || add.length > CHUNK_MAX || !Number.isInteger(at) || at < 0) return null;
    return { [`${base}/l/${pid}/${at}`]: add };
  },
  /** what the phone gets: the seed + the run so far (its log put back together — the phone replays it to the checkpoint) */
  async resume({ record, data, now, base, pid }) {
    if (!record) return { seed: data && data.seed, fresh: true };
    const log = record.len ? joinChunks(await val(`${base}/l/${pid}`), record.len) : '';
    return { seed: data && data.seed, log: log || '', k: record.k, len: record.len, t: record.t, ...clockOf(record, now), ...(record.e ? { e: 1, o: record.o } : {}), ...(record.pz && record.pz.rf && record.pz.at != null ? { refresh: 1 } : {}) };
  },
  act: ({ action, body, record, now, data, room = false }) => act({ action, body, record, now, seed: data && data.seed, room }),
  /** the score from the server's own record + the WHOLE log replayed — the phone's claim is never read; null = refused */
  async verify(seed, result, { record, data, base, pid, T } = {}) {
    if (!record || !record.e || !data) return null;
    const log = record.len ? joinChunks(await val(`${base}/l/${pid}`), record.len) : '';
    const F = judgeFinish(record, log, { seed: data.seed });
    if (T) T.mark('replay', F.ms != null ? `${F.ms.toFixed(1)} ms` : null);
    if (F.refused) { console.warn('drop finish refused', F.refused); return null; }
    return F.score;
  },
  /** an unfinished run that can never come back → its record ENDED at the last checkpoint (the next call / THE DAY'S CLOSE scores it) */
  abandoned: ({ record, now }) => abandoned(record, now),
  /** THE PRUNE (daily-close.js#sweepRuns calls it for days 2 … KEEP_LOG_DAYS + 2 back; a marker `pr` makes it once): → the paths removed */
  prune: ({ day, back }) => pruneDay(day, back),
  abandon: ({ record, now }) => abandon(record, now),
  /** THE DROP B — SHARE TODAY's inputs for a FINISHED run (the share tap only — `today { share }`): its log replayed ONCE to the record's end →
   *  the time, the lines + the FINAL BOARD with every junk row drawn SOLID (share.js#solidJunk — the day's holes never leave the server) */
  async share({ record, data, base, pid, day } = {}) {
    if (!record || !record.e || !data || !base || !pid) return null;
    const log = record.len ? joinChunks(await val(`${base}/l/${pid}`), record.len) : '';
    if (log == null) return null;
    const R = record.o === 'fin' ? replay(log, data.seed, { to: record.k, final: true }) : replay(log, data.seed, { cut: record.k });
    if (!R.ok) return null;
    return dropInputs({ t: R.t, ln: R.lines, b: boardString(R.run.eng, 20), day });
  },
};

/** THE PRUNE's rules: the top PRUNE_KEEP runs of a day keep their record + log (the anti-cheat's look back) for KEEP_LOG_DAYS; the rest — a
 *  finished run's score row only (dly/drop/{day}/s + r — the boards + YOUR TABLE read those) */
export const PRUNE_KEEP = 10, KEEP_LOG_DAYS = 7;
/** the pids whose logs a final day keeps: the best PRUNE_KEEP scores (ties at the cut kept too) */
export function keepOf(scores, n = PRUNE_KEEP) {
  const rows = Object.entries(scores || {}).filter(([, v]) => Number.isFinite(Number(v))).sort((a, b) => Number(b[1]) - Number(a[1]));
  if (rows.length <= n) return new Set(rows.map(r => r[0]));
  const cut = Number(rows[n - 1][1]);
  return new Set(rows.filter(r => Number(r[1]) >= cut).map(r => r[0]));
}
async function pruneDay(day, back) {
  const base = `dly/drop/${day}`;
  const mark = Number(await val(`${base}/pr`)) || 0;
  if (back >= KEEP_LOG_DAYS + 2) {
    if (mark >= 2) return 0;
    await ref('/').update({ [`${base}/l`]: null, [`${base}/p`]: null, [`${base}/pr`]: 2 });
    return 1;
  }
  if (back < 2 || mark >= 1) return 0;
  const [starts, scores] = await Promise.all([val(`${base}/s`), val(`${base}/r`)]);
  const keep = keepOf(scores);
  const patch = { [`${base}/pr`]: 1 };
  for (const pid of Object.keys(starts || {})) if (!keep.has(pid) && scores && scores[pid] != null) { patch[`${base}/l/${pid}`] = null; patch[`${base}/p/${pid}`] = null; }
  await ref('/').update(patch);
  return Object.keys(patch).length - 1;
}
