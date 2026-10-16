// NEON PAR — pure rules: hole order, scores, standings, sabotage eligibility, match stats.
// No DOM, no Firebase, no clocks (callers pass server time), so all of it is unit-tested in node.
import { MODES, courseHole, MAX_STROKES } from './course.js';

export const CAP = MAX_STROKES + 1;            // not holed within 6 strokes (or out of time) = 7
export const SAB_KINDS = ['fog', 'wobble', 'shake'];
export const SAB_MAX_MS = 8000;
export const POWER_KINDS = ['ghost', 'sticky', 'magnet'];

export const holeNumbers = settings => MODES[(settings && settings.mode) || 'full'] || MODES.full;
/** Course info (name, zone, par) of hole index hi — the geometry is in holes/*.js (view only). */
export const holeOf = (game, hi = game.hi) => courseHole(game.holes[hi]);
export const parOf = (game, hi = game.hi) => holeOf(game, hi).par;

export function scoreName(score, par) {
  if (score === 1) return 'HOLE IN ONE';
  const d = score - par;
  if (score >= CAP) return 'MAXED OUT';
  return d <= -3 ? 'ALBATROSS' : d === -2 ? 'EAGLE' : d === -1 ? 'BIRDIE' : d === 0 ? 'PAR' : d === 1 ? 'BOGEY' : d === 2 ? 'DOUBLE BOGEY' : `+${d}`;
}

/** Stroke total and score-to-par per participant over holes [0, upto). */
export function totals(game, upto = Infinity) {
  const out = {};
  for (const uid of Object.keys(game.participants || {})) out[uid] = { strokes: 0, par: 0, played: 0 };
  const res = game.results || {};
  for (let hi = 0; hi < Math.min(upto, game.holes.length); hi++) {
    const r = res[hi];
    if (!r) continue;
    const par = parOf(game, hi);
    for (const [uid, x] of Object.entries(r)) {
      const o = out[uid] || (out[uid] = { strokes: 0, par: 0, played: 0 });
      o.strokes += x.s; o.par += par; o.played += 1;
    }
  }
  for (const o of Object.values(out)) o.toPar = o.strokes - o.par;
  return out;
}

/** Lowest strokes first; ties share a rank. */
export function standings(game, upto = Infinity) {
  const rows = Object.entries(totals(game, upto)).map(([uid, t]) => ({ uid, score: t.strokes, toPar: t.toPar, played: t.played }))
    .sort((a, b) => a.score - b.score || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r.rank = rank; });
  return rows;
}

export const fmtToPar = d => (d === 0 ? 'E' : d > 0 ? `+${d}` : `${d}`);

/** May uid sabotage someone on hole hi? Earned on the previous hole: birdie or better, or the best score. */
export function sabotageEarned(game, uid, hi = game.hi) {
  if (!game.settings || game.settings.sabotage === 'off' || hi < 1) return false;
  const prev = (game.results || {})[hi - 1];
  if (!prev || !prev[uid]) return false;
  const par = parOf(game, hi - 1);
  const best = Math.min(...Object.values(prev).map(x => x.s));
  return prev[uid].s <= par - 1 || (prev[uid].s === best && best < CAP);
}

/**
 * Is a sabotage still affecting its target? It lasts until the target's next shot (one started after
 * it arrived) has finished, and never longer than 8 s. target: the target's node { ls, le } (last shot
 * start / end, server ms).
 */
export function sabotageActive(sab, target, now) {
  if (!sab || now - sab.at >= SAB_MAX_MS || now < sab.at - 1000) return false;
  const t = target || {};
  return !(t.ls > sab.at && t.le >= t.ls);
}

/** Sabotages currently hitting `uid` on hole hi, from everyone's nodes. [{ from, k, at }] */
export function incomingSabotage(nodes, uid, hi, now) {
  const out = [];
  for (const [from, n] of Object.entries(nodes || {})) {
    const sb = n && n.sab;
    if (!sb || from === uid || sb.to !== uid || n.h !== hi || sb.h !== hi) continue;
    if (sabotageActive(sb, nodes[uid], now)) out.push({ from, k: sb.k, at: sb.at });
  }
  return out;
}

/** Score for a finished node on hole hi (null = still playing). */
export const nodeScore = (n, hi) => (n && n.h === hi && n.f != null ? Math.max(1, Math.min(CAP, n.f)) : null);

/** Results for hole hi from the players' nodes: anyone unfinished records 7. */
export function holeResults(game, nodes, hi = game.hi) {
  const out = {};
  for (const uid of Object.keys(game.participants || {})) {
    const s = nodeScore(nodes && nodes[uid], hi);
    out[uid] = { s: s == null ? CAP : s };
  }
  return out;
}

/** Whole-match stats per player: aces, birdies-or-better, best hole relative to par. */
export function matchStats(game) {
  const out = {};
  for (const uid of Object.keys(game.participants || {})) out[uid] = { aces: 0, unders: 0, best: null };
  for (const [hiStr, r] of Object.entries(game.results || {})) {
    const hi = +hiStr, par = parOf(game, hi);
    for (const [uid, x] of Object.entries(r || {})) {
      const o = out[uid] || (out[uid] = { aces: 0, unders: 0, best: null });
      if (x.s === 1) o.aces += 1;
      if (x.s < par) o.unders += 1;
      const rel = x.s - par;
      if (!o.best || rel < o.best.rel) o.best = { hi, s: x.s, rel, name: holeOf(game, hi).name };
    }
  }
  return out;
}
