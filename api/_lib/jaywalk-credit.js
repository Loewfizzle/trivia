// JAYWALK's DAILY — A TRY's CARDS + YOUR BEST (DAILY B — docs/jaywalk.md "THE DAILY"; the owner, Nov 18: a daily try counts for JAYWALK's four
// cards — THE CARDS' "a counted match / daily" — and raises YOUR BEST, server-judged results only). PURE (no fb.js — THE UNIT JOB INSTALLS
// NOTHING: tests/jaywalk-daily.test.mjs runs it in Node); api/daily.js#creditTry runs it in the player's stats transaction for EVERY try the
// server closes (FINISH, the next START, THE ROOM WINS, `today`, THE DAY'S CLOSE) — from the try's REPLAYED result (jaywalk-tries.js#scoreTry:
// its lanes + its feats), never a phone's claim. A COUNTED result only (THE THROWAWAY GATE + THE ONE DAY LINE: api/daily.js checks).
//   creditTry(stats, { lanes, feats, now, founderOpen }) → { next, pbs, items, ach } | null (nothing new)
// YOUR BEST = the `jaywalk-solo` board's record (pstats.b — the board a match + a solo run already raise: core/match-report.js#jaywalkExtra);
// the cards = the match's own flags (`pa.gf['jaywalk-<feat>']` — core/achievements.js: SONIC BOOM · CLOSE ENCOUNTER · RIGHT OF WAY · BEAM ME UP).
// THE MOTHERSHIP counts here (the daily is a CAPPED run, like a match — a solo run is never capped).
import { awardAll } from '../../js/core/achievements.js';
import { boardDef, better } from '../../js/core/boards.js';
import { weekKey } from '../../js/core/week.js';

export const JW_BEST_BOARD = 'jaywalk-solo';
export const TRY_FEATS = Object.freeze(['boom', 'ufo', 'airfield', 'mothership']);

export function creditTry(s0, { lanes = 0, feats = '', now = Date.now(), founderOpen = false } = {}) {
  if (!s0 || typeof s0 !== 'object') return null;
  const next = { ...s0 }, pbs = [];
  let changed = false;
  const def = boardDef(JW_BEST_BOARD), v = Math.floor(Number(lanes) || 0), wk = weekKey(now);
  if (def && v > 0) {
    const old = (s0.b && s0.b[JW_BEST_BOARD]) || {}, b = { ...old };
    if (better(def, v, old.a ?? null)) { b.a = v; pbs.push({ b: JW_BEST_BOARD, v, prev: old.a ?? null, first: old.a == null }); }
    // (an older week's record never replaces this week's — progress.js#matchStep's rule)
    if (!(old.wk && wk < old.wk) && better(def, v, old.wk === wk ? old.w ?? null : null)) { b.w = v; b.wk = wk; }
    if (b.a !== old.a || b.w !== old.w || b.wk !== old.wk) { next.b = { ...(s0.b || {}), [JW_BEST_BOARD]: b }; changed = true; }
  }
  const gf = (s0.pa && s0.pa.gf) || {};
  const add = String(feats || '').split(' ').filter(k => TRY_FEATS.includes(k)).map(k => `jaywalk-${k}`).filter(k => !gf[k]);
  if (add.length) { next.pa = { ...(s0.pa || {}), gf: { ...gf, ...Object.fromEntries(add.map(k => [k, 1])) } }; changed = true; }
  if (!changed) return null;
  const aw = awardAll(next, now, { founderOpen });
  return { next, pbs, items: aw.items, ach: aw.ach };
}
