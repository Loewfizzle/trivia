// OVERCLOCK — pure scoring / order / standings.
import { rngFrom, shuffle } from '../../core/rng.js';
import { TYPES, CATEGORY, partsFor, SORT_FULL, COMPASS_SCRIPT_MS } from './challenges.js';
// (SHELL 2.0 B1 — THE THIN META: the console's numbers live in meta.js — one source; re-exported here for the rules + the server)
import { CHALLENGE_MS, READY_MS, STANDINGS_MS, MODES, DEFAULT_SETTINGS, chatLocked } from './meta.js';
export { CHALLENGE_MS, READY_MS, STANDINGS_MS, MODES, DEFAULT_SETTINGS, chatLocked };

export const BRIEF_MS = 7_000;
// challenges with a reveal (best words, the right order, the number line) hold the leaderboard a little longer
export const REVEAL_STANDINGS_MS = 12_000;
export const OVERALL_STAGE_MS = 4_400;       // the last part of standings: the rows slide into the overall order
export const REVEALS = new Set(['timeline', 'closest', 'missinglink', 'spellcheck', 'compass', 'sortit', 'higherlower']);
export const standingsMs = type => (REVEALS.has(type) ? REVEAL_STANDINGS_MS : STANDINGS_MS);
export const FINAL_MS = 120_000;
export const PLAY_GRACE_MS = 700;
export const SPEED_BONUS = 60;
// THE AFTER-CHALLENGE SKIP (OC1 — the owner, Nov 4): the screen after a challenge keeps its max (standingsMs) but ends once EVERY connected
// player has tapped — never before this, so the answer always lands first (kit/ready.js#readyState; solo: your own tap)
export const SKIP_MIN_MS = 3_000;
/** THE AFTER-CHALLENGE SCREEN's "NEXT IN n" (OC1 ADD-ON — the owner saw "NEXT IN 599"): the whole seconds left of THIS screen on the server
 *  clock, counted to its OWN max (phaseStartAt + standingsMs — 8 or 12 s today), never to a stored end that says more; 0 … max/1000.
 *  When everyone has tapped the phase itself moves on (the director) — the screen goes with it. */
export function nextInSec(game, now) {
  const type = game && game.order && game.order[game.ci];
  const max = standingsMs(type);
  const start = Number(game && game.phaseStartAt) || 0;
  const end = Math.min(Number(game && game.phaseEndsAt) || start + max, start + max);
  return Math.max(0, Math.min(max / 1000, Math.ceil((end - now) / 1000)));
}

// THE COMBO (OC1 — docs/overclock.md "OVERDRIVE card"): right answers in a row across the match. A player's per-answer MARKS for a challenge
// (rooms/{CODE}/ocm/{match}/{ci}/{uid}/s — '1' right · '0' wrong · 'h' half · '-' neither) fold into game/combo/{uid} = { c: now, m: best }
// when the challenge closes. One wrong answer resets it; a half (Quick Count's off-by-one…) and the no-right-or-wrong challenges (SIGNAL LOCK's
// reflex taps — COMBO_NEUTRAL) neither add nor break it. maxStreak (m) = the feat OC2 reports for the OVERDRIVE card (x10).
export const COMBO_NEUTRAL = new Set(['reflex']);
export const COMBO_MARKS = /^[01h-]{0,24}$/;
export function comboFold(prev, marks) {
  let c = (prev && prev.c) || 0, m = (prev && prev.m) || 0;
  for (const ch of String(marks || '')) {
    if (ch === '1') { c += 1; if (c > m) m = c; } else if (ch === '0') c = 0;
  }
  return { c, m };
}
/** this challenge's marks for a player: their own (validated), else — the rules refused them (an older rules publish) — from the board */
export function marksFor(type, mk, board, parts) {
  if (COMBO_NEUTRAL.has(type)) return '';
  if (mk && typeof mk.s === 'string' && COMBO_MARKS.test(mk.s)) return mk.s.slice(0, parts);
  const b = board || {};
  const p = Math.min(parts, Math.max(0, Number(b.p) || 0)), ok = Number(b.ok) || 0;
  if (!p) return '';
  return ok >= parts ? '1'.repeat(parts) : '0';
}

export const levelOf = (ci, total) => (total <= 1 ? 0 : ci / (total - 1));

// The challenge order (seeded, identical on every phone).
//  - up to 20 challenges (one per type): all different types;
//  - longer (Marathon 24): every type once plus a few repeats — a type at most twice, its two turns at least a
//    third of the match apart (so never back to back);
//  - categories (words, numbers, memory, visual, knowledge, reflex — challenges.js#CATEGORY) are spread out: two
//    challenges of the same category are never next to each other unless there is no other way;
//  - THE ROOM's NIGHT MEMORY (OC1 — deal.js): `played` = the types this room already played tonight — a shorter match
//    FAVOURS the others (FRESH_TYPE_WEIGHT to 1), so back-to-back matches feel different; once every type has had its
//    turn, all count the same again. No `played` = exactly the old draw.
export const FRESH_TYPE_WEIGHT = 12;
export function buildOrder(seed, total, played = []) {
  const rand = rngFrom(`${seed}:order`);
  const n = TYPES.length;
  // up to one of each: types are drawn on the fly from all of them (so a short match can still avoid a clash);
  // longer: the exact multiset (every type once + repeats) is laid out
  const long = total > n;
  const pool = long ? [...TYPES, ...shuffle(rand, TYPES).slice(0, total - n)] : TYPES;
  const minGap = long ? Math.floor(total / 3) : 1;
  const was = new Set(played || []);
  const stale = TYPES.every(t => was.has(t)) ? new Set() : was;
  const fresh = t => (stale.has(t) ? 1 : FRESH_TYPE_WEIGHT);
  const freshW = stale.size > 0;
  let best = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const left = shuffle(rand, pool);
    const out = [];
    const lastAt = {};
    let clashes = 0;
    while (out.length < total && left.length) {
      const prev = out[out.length - 1];
      const free = i => lastAt[left[i]] == null || out.length - lastAt[left[i]] >= minGap;
      let cands = left.map((_, i) => i).filter(i => free(i) && CATEGORY[left[i]] !== CATEGORY[prev]);
      if (!cands.length) { cands = left.map((_, i) => i).filter(free); clashes++; }
      if (!cands.length) break;
      // weights: a category with more challenges left goes sooner (so the rest can still be spread), and a type
      // that still has both copies to place goes early (so its two turns end up far apart)
      const catLeft = {};
      for (const t of left) catLeft[CATEGORY[t]] = (catLeft[CATEGORY[t]] || 0) + 1;
      const w = long ? cands.map(i => catLeft[CATEGORY[left[i]]] + (left.filter(t => t === left[i]).length > 1 ? 3 : 0)) : cands.map(i => (freshW ? fresh(left[i]) : 1));
      let r = rand() * w.reduce((x, y) => x + y, 0);
      let k = 0;
      while (k < cands.length - 1 && (r -= w[k]) >= 0) k++;
      const t = left.splice(cands[k], 1)[0];
      lastAt[t] = out.length;
      out.push(t);
    }
    if (out.length !== total) continue;
    if (!clashes) return out;
    if (!best || clashes < best.clashes) best = { out, clashes };
  }
  return best ? best.out : pool.slice(0, total);
}

/** Neighbours that share a category (buildOrder keeps this at 0 whenever that's possible). */
export const categoryClashes = order => order.reduce((n, t, i) => n + (i > 0 && CATEGORY[t] === CATEGORY[order[i - 1]] ? 1 : 0), 0);

// Points: up to 100 for accuracy (partial credit), +up to 60 speed bonus for a
// perfect run, ×2 on the final challenge. Signal Lock is pure speed: its credit
// already measures reaction time, so it scales to the same 160 maximum instead.
// Closest Call has no time bonus: the closest guess in the room gets the full 60 (see computeResults).
export function challengeScore({ parts, ok, doneAt, startAt, final, type, closest = false }) {
  const acc = parts > 0 ? Math.max(0, Math.min(1, ok / parts)) : 0;
  if (type === 'reflex') return Math.round((100 + SPEED_BONUS) * acc) * (final ? 2 : 1);
  if (type === 'closest') return (Math.round(100 * acc) + (closest ? SPEED_BONUS : 0)) * (final ? 2 : 1);
  // Sort It: each net correct sort (right − ½ wrong) is worth the same; SORT_FULL of them already make 100
  const base = type === 'sortit' ? Math.round(100 * Math.min(1, ok / SORT_FULL)) : Math.round(100 * acc);
  // Compass: the turn instructions take a fixed ~22 s to play out, so only the time left over counts for speed
  const [t0, span] = type === 'compass' ? [startAt + COMPASS_SCRIPT_MS, CHALLENGE_MS - COMPASS_SCRIPT_MS] : [startAt, CHALLENGE_MS];
  const speed = ok >= parts && parts > 0 && typeof doneAt === 'number'
    ? Math.round(SPEED_BONUS * Math.max(0, Math.min(1, 1 - (doneAt - t0) / span)))
    : 0;
  return (base + speed) * (final ? 2 : 1);
}

export function computeResults(game, boards) {
  const type = game.order[game.ci];
  const parts = partsFor(type, levelOf(game.ci, game.total));
  const final = game.ci === game.total - 1;
  const out = {};
  const okOf = uid => Math.min(parts, Math.max(0, Number(((boards && boards[uid]) || {}).ok) || 0));
  // Closest Call: the closest guess (highest credit — credit falls with the relative error) earns the bonus; ties share it
  const top = type === 'closest' ? Math.max(0, ...Object.keys(game.participants || {}).map(okOf)) : 0;
  for (const uid of Object.keys(game.participants || {})) {
    const b = (boards && boards[uid]) || {};
    const ok = okOf(uid);
    const closest = type === 'closest' && top > 0 && ok === top;
    out[uid] = { pts: challengeScore({ parts, ok, doneAt: b.done ? b.doneAt : undefined, startAt: game.playStartAt, final, type, closest }), ok, parts };
  }
  return out;
}

export function totals(game, upto = Infinity) {
  const t = {};
  for (const uid of Object.keys(game.participants || {})) t[uid] = 0;
  for (const [ci, res] of Object.entries(game.results || {})) {
    if (Number(ci) > upto) continue;
    for (const [uid, r] of Object.entries(res || {})) t[uid] = (t[uid] || 0) + (r.pts || 0);
  }
  return t;
}

export function standings(game, upto = Infinity) {
  const rows = Object.entries(totals(game, upto)).map(([uid, score]) => ({ uid, score }))
    .sort((a, b) => b.score - a.score || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r.rank = rank; });
  return rows;
}

// =========================================================================================================== OC2 — THE RESULTS FLOW (PURE)
// THE ROUND WIN — ONE rule, used everywhere (the ROUND WINNER banner, the final standings' ROUND WINS, and the SERVER's REDLINE —
// core/match-report.js#overclockExtra calls this same function): a player wins a challenge when their points in it are the HIGHEST and NOT
// SHARED. A tie for the top = nobody wins it (the banner's DEAD HEAT); nobody above 0 = no winner. `uids` = the participants (a missing result
// counts 0). → { kind: 'win' | 'tie' | 'none', uid?, uids: [the leaders], pts }
const ptsOf = (res, u) => Number(res && res[u] && res[u].pts) || 0;
export function roundWin(res, uids) {
  const ids = Array.isArray(uids) ? uids : Object.keys(uids || {});
  if (!ids.length) return { kind: 'none', uids: [], pts: 0 };
  const top = Math.max(...ids.map(u => ptsOf(res, u)));
  if (!(top > 0)) return { kind: 'none', uids: [], pts: 0 };
  const lead = ids.filter(u => ptsOf(res, u) === top).sort();
  return lead.length === 1 ? { kind: 'win', uid: lead[0], uids: lead, pts: top } : { kind: 'tie', uids: lead, pts: top };
}
/** the round win as the game state STORES it (game/rw/{ci} — the director writes it as the challenge closes, so every phone and a new host
 *  read the same): { w: uid, p } · { t: { uid: true }, p } · { n: true } */
export function packRoundWin(r) {
  if (r.kind === 'win') return { w: r.uid, p: r.pts };
  if (r.kind === 'tie') return { t: Object.fromEntries(r.uids.map(u => [u, true])), p: r.pts };
  return { n: true };
}
/** challenge ci's round win: the stored one (game.rw), else — a match from before OC2 — the same rule over its results */
export function roundWinOf(game, ci) {
  const s = game && game.rw && game.rw[ci];
  if (s && typeof s === 'object') {
    if (typeof s.w === 'string') return { kind: 'win', uid: s.w, uids: [s.w], pts: Number(s.p) || 0 };
    if (s.t && typeof s.t === 'object') return { kind: 'tie', uids: Object.keys(s.t).sort(), pts: Number(s.p) || 0 };
    if (s.n) return { kind: 'none', uids: [], pts: 0 };
  }
  return roundWin(game && game.results && game.results[ci], Object.keys((game && game.participants) || {}));
}
/** { uid: how many challenges they WON (alone on top) } — the final standings' ROUND WINS */
export function roundWins(game) {
  const out = {};
  for (const uid of Object.keys((game && game.participants) || {})) out[uid] = 0;
  for (const ci of Object.keys((game && game.results) || {})) {
    const r = roundWinOf(game, Number(ci));
    if (r.kind === 'win') out[r.uid] = (out[r.uid] || 0) + 1;
  }
  return out;
}

/** where a player's combo first reached its NEW best inside this challenge's marks (comboFold's walk): the mark's index, or -1 (no new best) */
export function comboReachAt(prev, marks) {
  let c = (prev && prev.c) || 0;
  const m0 = (prev && prev.m) || 0;
  let at = -1, m = m0;
  [...String(marks || '')].forEach((ch, i) => {
    if (ch === '1') { c += 1; if (c > m) { m = c; at = i; } } else if (ch === '0') c = 0;
  });
  return at;   // the index where the best was SET (its last raise — the moment the streak hit its new m)
}

// THE AWARD CHIPS (the victory body — two a match, PURE + deterministic):
//  - BEST STREAK = the highest maxStreak (game.combo[uid].m), at least ×STREAK_CHIP_MIN; a tie → the one who REACHED it earlier
//    (game.cr[uid] = ci × 100 + the mark's index, written by the director as the best is set), then join order (the uid).
//  - FASTEST = the lowest average time per RIGHT answer (game.tm[ci][uid] = the ms from the challenge's start to their finish — the whole 30 s
//    when they never finished — over the right answers in it), at least FASTEST_MIN_RIGHT right answers; the challenges whose clock isn't the
//    player's own don't count (FASTEST_SKIP: COMPASS's script, MEMORY's playback, SORT IT's card windows, SIGNAL LOCK's random waits, QUICK
//    COUNT's flash); a tie → the one who reached it earlier (their last counted challenge), then the uid.
//  - A chip that doesn't apply is skipped (LONG SHOT comes with DUMB LUCK in OC5).
export const STREAK_CHIP_MIN = 3;
export const FASTEST_MIN_RIGHT = 3;
export const FASTEST_SKIP = new Set(['compass', 'memory', 'sortit', 'reflex', 'count']);
export function fastestOf(game) {
  const out = {};
  const tm = (game && game.tm) || null;
  if (!tm) return out;   // (a match from before OC2 stored no times)
  for (const uid of Object.keys(game.participants || {})) {
    let t = 0, k = 0, last = -1;
    for (const ci of Object.keys(game.results || {}).map(Number).sort((a, b) => a - b)) {
      const type = game.order && game.order[ci];
      if (FASTEST_SKIP.has(type)) continue;
      const right = Math.floor(Number(game.results[ci] && game.results[ci][uid] && game.results[ci][uid].ok) || 0);
      if (right < 1) continue;
      const ms = tm[ci] && Number(tm[ci][uid]);
      t += Number.isFinite(ms) && ms >= 0 ? Math.min(ms, CHALLENGE_MS) : CHALLENGE_MS;
      k += right;
      last = ci;
    }
    if (k >= FASTEST_MIN_RIGHT) out[uid] = { avg: Math.round(t / k), right: k, last };
  }
  return out;
}
export function awardChips(game) {
  const chips = [];
  const uids = Object.keys((game && game.participants) || {}).sort();
  const reach = u => { const v = game.cr && Number(game.cr[u]); return Number.isFinite(v) ? v : Infinity; };
  const streak = uids.map(u => ({ uid: u, m: (game.combo && game.combo[u] && Number(game.combo[u].m)) || 0 }))
    .filter(x => x.m >= STREAK_CHIP_MIN)
    .sort((a, b) => b.m - a.m || reach(a.uid) - reach(b.uid) || (a.uid < b.uid ? -1 : 1))[0];
  if (streak) chips.push({ k: 'streak', uid: streak.uid, v: streak.m });
  const f = fastestOf(game);
  const fast = Object.entries(f).map(([uid, x]) => ({ uid, ...x }))
    .sort((a, b) => a.avg - b.avg || a.last - b.last || (a.uid < b.uid ? -1 : 1))[0];
  if (fast) chips.push({ k: 'fastest', uid: fast.uid, v: fast.avg, n: fast.right });
  return chips;
}

/** the most a challenge can score (the solo yardstick for YOUR BEST / WORST): 160, ×2 on the last */
export const maxPts = (game, ci) => (100 + SPEED_BONUS) * (Number(ci) === (game.total || 0) - 1 ? 2 : 1);
/** YOUR BEST / YOUR WORST challenge of the match: your points in each vs the room's best in it (alone: vs the most it could score).
 *  → { best: { ci, type, pts, rel }, worst: { … } | null } — worst is null with one challenge, or when it would be the best one. null when no results. */
export function bestWorst(game, uid) {
  const uids = Object.keys((game && game.participants) || {});
  const cis = Object.keys((game && game.results) || {}).map(Number).sort((a, b) => a - b);
  if (!cis.length || !uids.includes(uid)) return null;
  const rows = cis.map(ci => {
    const res = game.results[ci];
    const mine = ptsOf(res, uid);
    const yard = uids.length > 1 ? Math.max(...uids.map(u => ptsOf(res, u))) : maxPts(game, ci);
    return { ci, type: game.order && game.order[ci], pts: mine, rel: yard > 0 ? mine / yard : 0 };
  });
  const best = rows.slice().sort((a, b) => b.rel - a.rel || b.pts - a.pts || a.ci - b.ci)[0];
  const worst = rows.slice().sort((a, b) => a.rel - b.rel || a.pts - b.pts || a.ci - b.ci)[0];
  return { best, worst: rows.length > 1 && worst.ci !== best.ci ? worst : null };
}

