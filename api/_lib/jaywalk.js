// JAYWALK — THE SERVER HALF (H1 — docs/jaywalk.md "THE REPLAY + THE PROOF"). NOT a function (the 8 stay 8) and PURE: it never imports
// fb.js (THE UNIT JOB INSTALLS NOTHING — tests/jaywalk-server.test.mjs runs it in Node). verifyRun = THE HOP LOG's bounds + THE REPLAY —
// the SAME engine the phone ran (js/games/jaywalk/) → the server's own result; a phone's claimed lanes are never read.
// WIRING (later passes): H3 — /api/report's solo best (the log sent with the run); H4 — the match: each player's log read from the proof
// node rooms/{CODE}/jw/{matchId}/{uid}/c (packed chunks → unpackLog) and replayed here.
import { replay, logProblem, seedProblem, unpackLog } from '../../js/games/jaywalk/replay.js';
import { MODES, ONE_UP } from '../../js/games/jaywalk/tuning.js';

/** the chunks of a proof node ({ 0: 'U0R1c…', 1: … } or an array) → the hop log, or null (a hole, a bad chunk) */
export function logFromChunks(c) {
  if (c == null) return [];
  const keys = Object.keys(c).map(Number).sort((a, b) => a - b);
  let s = '';
  for (let i = 0; i < keys.length; i++) { if (keys[i] !== i || typeof c[i] !== 'string') return null; s += c[i]; }
  return unpackLog(s);
}

/**
 * → { ok: true, result: { lanes, tick, end, cause, lives, taken, hits, feats: { boom, ufo, airfield } } } | { ok: false, why }
 * Refused: a bad seed / mode / lives · a log past its length cap · ticks not rising · inputs closer than a hand can tap · a hop past THE
 * MOTHERSHIP's tick · a hop logged after the run had ended (the replay never played it).
 */
export function verifyRun({ seed, mode = 'solo', log, lives, oneUp = ONE_UP } = {}) {
  const M = MODES[mode];
  if (!M) return { ok: false, why: 'mode' };
  if (seedProblem(seed)) return { ok: false, why: 'seed' };
  if (lives != null && !M.livesOpt.includes(lives)) return { ok: false, why: 'lives' };
  const bad = logProblem(log, mode);
  if (bad) return { ok: false, why: bad };
  const r = replay({ seed, mode, log, lives, oneUp: !!oneUp });
  if (r.used < log.length) return { ok: false, why: 'past the end' };
  if (!r.over) return { ok: false, why: 'never ended' };
  const { used, over, ...result } = r; void used; void over;
  return { ok: true, result };
}
