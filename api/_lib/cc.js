// COAST CLEAR on the server (CC1 — docs/coastclear.md "The server flow"): THE DAILY CARTRIDGE that KEEPS THE BOARD AND ANSWERS EVERY DIG.
// The board lives only here (cc-board.js — built once a day from THE PEPPER, proven no-guess by cc-solve.js, stored at dly/coastclear/{day}/b);
// a phone gets the cells it opens, the lights it was spotted by — never an unopened cell's content.
//
//   the record a run leaves: dly/coastclear/{day}/p/{pid} = { st, mv: ['d45', 'c30:21,22' …], p?: { n, ms, at? }, e?, o? }  (logic.js — server-only)
//   start            → { run } (the opening + the run so far: the opened cells + their numbers, the spots + their lights, the pauses) — NO seed
//   dig { cell }     → { cells: [[cell, n]…] (a whole flood in ONE answer), lit: [cell…], spots, done, out?, finishedAt? } — a repeat is free
//   chord { cell, buoys } → the phone's buoys checked against the number: the rest opened, or the light a wrong buoy hid = SPOTTED
//   pause / resume   → the clock stops (+15 s a pause) / goes on — THE DAILY MODULE calls them (the room started a game mid-run); a move resumes too
//   finish           → the score from THE SERVER's record (replay — never the phone's claim): time + 30 s a spot + 15 s a pause; caught below all
// Registered by dailies.js — until THE SWITCH-OVER only under DAILY_TEST=1 (production answers 'no_daily').
import { ref, val } from './fb.js';
import { dailySecret } from './daily-secret.js';
import { boardFor } from './cc-board.js';
import { runView, serverAct, newRecord, replay, bucketOf, BUCKETS, GHOST_S, runFlags } from '../../js/games/coastclear/logic.js';
export { GHOST_S, runFlags };   // (CC2 — the rule lives in the pure logic.js: the unit tests + the simulation read it without firebase-admin)

/** THE DAY's BOARD (server-only): memory → the stored copy → built + stored once — from THE DAILY SECRET (DM1 ADD-ON: never the pepper) */
export const ccBoard = async day => boardFor(day, { ref, val, pepper: await dailySecret(day) });

/** COAST CLEAR's daily cartridge (core/daily.js#registerDaily): better = LOW, 300 buckets (5-second steps, then the caught runs) */
export const CC_DAILY = {
  id: 'coastclear', name: 'COAST CLEAR', better: 'low', buckets: BUCKETS,
  bucket: bucketOf,
  judged: true,                                                    // the server holds the record: start returns the run, its moves exist, finish ignores the claim
  moves: ['dig', 'chord', 'pause', 'resume'],                      // the /api/daily actions it answers (api/daily.js — one transaction each)
  /** the day's server-side data, before any call (the board) */
  load: day => ccBoard(day),
  /** a resume: the record → what the phone may see (the opening even before the first move) */
  resume: ({ record, startedAt, data }) => runView(record || newRecord(startedAt), data, { startedAt }),
  /** ONE move inside a transaction on the record → { record (null = nothing changed), resp } | { refused, status } */
  act: ({ action, body, record, startedAt, now, data }) => serverAct(data, record || newRecord(startedAt), action, { cell: body && body.cell, buoys: body && body.buoys }, now),
  /** THE SCORE from the server's record — the phone's `result` is ignored; null = not finished / a record no run makes */
  verify(seed, result, { startedAt, record, data } = {}) {
    if (!record || !data) return null;
    const r = replay(record, data, { startedAt });
    return r ? r.score : null;
  },
  /** CC2 — THE FLAGS a finished run earns, from the RECORD (the award engine keys them `coastclear-<flag>`): `clear` = any clear (LIGHTHOUSE) ·
   *  `ghost` = a clear with ZERO spots at or under GHOST_S on the score's clock (GHOST RUN — ≈ the best ~10 % of clean runs: scripts/sim-coastclear.mjs) */
  flags({ record, startedAt, data } = {}) {
    if (!record || !data) return null;
    return runFlags(replay(record, data, { startedAt }));
  },
};

