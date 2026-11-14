// THE DROP on the server (THE DROP A — docs/prism.md "THE DROP"; the owner's plan: docs/games/plan.md "THE DROP"): PRISM DROP's daily — the
// run is PLAYED on the phone (js/games/prism/drop.js), its INPUT LOG uploaded in chunks during the run and REPLAYED here through the same pure
// engine (js/games/prism/drop-judge.js — the record, the pauses, THE SLOW-MOTION CHECK, the finish). THE DAY = its seed from THE DAILY
// SECRET (dailies.js#dailySeed — never the date, never the pepper); the phone gets the seed (it plays the pieces), never anything else.
//
//   start            → { run: { seed, go, k, len, log, t, ln, clock…, e? } } — a fresh run, or a RESUME at the latest checkpoint (a pause used)
//   checkpoint { at, add, k, fin? } → the chunk checked from the record's snapshot (≈ 1 ms) — { k, len, e? } | { resync, len }
//   ppause / pause / resume  → a PLAYER pause (one of the 3) · THE ROOM WINS' pause (the api checks the room — free) · the clock back
//   finish           → the WHOLE log (its chunks) replayed → ONE score: tenths × 1000 + lines (`better: 'high'`)
//   dly/drop/{day}/p/{pid} = the small record (drop-judge.js) · dly/drop/{day}/l/{pid}/{offset} = the log's chunks (server-only — the rules'
//   default deny). Registered by dailies.js like the others: THE GO-LIVE SWITCH + its row's `on` (OFF in THE DROP A) or DAILY_TEST=1.
import { val } from './fb.js';
import { dailySeed } from './dailies.js';   // (a cycle — dailies.js lists this cartridge; the seed is only read inside a call)
import { act, begin, clockOf, judgeFinish, joinChunks, abandoned, abandon, CHUNK_MAX } from '../../js/games/prism/drop-judge.js';
import { tenthsOf } from '../../js/games/prism/drop.js';

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
    return { seed: data && data.seed, log: log || '', k: record.k, len: record.len, t: record.t, ln: record.ln, ...clockOf(record, now), ...(record.e ? { e: 1, o: record.o } : {}), ...(record.pz && record.pz.rf && record.pz.at != null ? { refresh: 1 } : {}) };
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
  abandon: ({ record, now }) => abandon(record, now),
};
