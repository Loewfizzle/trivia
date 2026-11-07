// OVERCLOCK — pure scoring / order / standings.
import { rngFrom, shuffle } from '../../core/rng.js';
import { TYPES, SKILL_TYPES, CATEGORY, partsFor, SORT_FULL, COMPASS_SCRIPT_MS } from './challenges.js';
import { LUCK, dlOf, dlResults, dlTickets, DL_MAX, LONG_SHOT } from './luck.js';
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
export const COMBO_NEUTRAL = new Set(['reflex', LUCK]);   // (OC5: DUMB LUCK is chance — it neither adds to nor breaks a streak)
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

const TYPES_ALL = TYPES;
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
//    OC8 (A5): while at least `total` fresh types remain, a short match draws from the FRESH ones only (stale weight 0) — the rematch never
//    repeats a type the room just played, its ×2 final included; fewer fresh left → the weight, as before.
//  - DUMB LUCK (OC5 — luck.js): only with `luck` (2+ players — never SOLO, never the daily): at most ONCE (a long match's repeats are
//    skill challenges only) and NEVER the last challenge (the ×2 final is a skill one). Without `luck` the draw is exactly OC4's.
export const FRESH_TYPE_WEIGHT = 12;
export function buildOrder(seed, total, played = [], { luck = true } = {}) {
  const rand = rngFrom(`${seed}:order`);
  const TYPES = luck ? TYPES_ALL : SKILL_TYPES;
  const n = TYPES.length;
  // up to one of each: types are drawn on the fly from all of them (so a short match can still avoid a clash);
  // longer: the exact multiset (every type once + repeats) is laid out
  const long = total > n;
  const pool = long ? [...TYPES, ...shuffle(rand, SKILL_TYPES).slice(0, total - n)] : TYPES;
  const minGap = long ? Math.floor(total / 3) : 1;
  const was = new Set(played || []);
  const stale = TYPES.every(t => was.has(t)) ? new Set() : was;
  const fresh = t => (stale.has(t) ? 1 : FRESH_TYPE_WEIGHT);
  const freshW = stale.size > 0;
  // (OC8 — A5, THE FABLE REVIEW: the first rematch dealt the type the room had just played — as its ×2 final) while at least a whole match's
  // worth of FRESH types remain, a short match deals ONLY fresh ones (a stale type's weight is 0); fewer left → the weight above, as before
  const freshOnly = !long && freshW && TYPES.filter(t => !stale.has(t)).length >= total;
  const allowed = t => !freshOnly || !stale.has(t);
  let best = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const left = shuffle(rand, pool);
    const out = [];
    const lastAt = {};
    let clashes = 0;
    while (out.length < total && left.length) {
      const prev = out[out.length - 1];
      // (DUMB LUCK never takes the last slot)
      const free = i => (lastAt[left[i]] == null || out.length - lastAt[left[i]] >= minGap) && !(left[i] === LUCK && out.length === total - 1);
      let cands = left.map((_, i) => i).filter(i => free(i) && allowed(left[i]) && CATEGORY[left[i]] !== CATEGORY[prev]);
      if (!cands.length) { cands = left.map((_, i) => i).filter(i => free(i) && allowed(left[i])); clashes++; }
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
  // DUMB LUCK: the winning tickets get their horse's payout (the stored draw — game/dl/{ci}), everyone else 0
  if (type === LUCK) return dlResults(game, game.ci, dlOf(game, game.ci));
  const parts = partsFor(type, levelOf(game.ci, game.total));
  const final = game.ci === game.total - 1;
  const out = {};
  const okOf = uid => Math.min(parts, Math.max(0, Number(((boards && boards[uid]) || {}).ok) || 0));
  // Closest Call: the closest guess (highest credit — credit falls with the relative error) earns the bonus; ties share it
  const top = type === 'closest' ? Math.max(0, ...Object.keys(game.participants || {}).map(okOf)) : 0;
  // (OC8 — A12, THE FABLE REVIEW: alone, you were always "the closest in the room" → +60 on every solo run) SOLO: the bonus only for a DEAD ON
  // guess — full credit, within 5 % (challenges.js#closestCredit — the same rule the achievement reads)
  const solo = Object.keys(game.participants || {}).length === 1;
  for (const uid of Object.keys(game.participants || {})) {
    const b = (boards && boards[uid]) || {};
    const ok = okOf(uid);
    const closest = type === 'closest' && top > 0 && ok === top && (!solo || ok >= parts);
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
// THE BEATS of the after-challenge screen — INSIDE its own max (standingsMs: 8 s, 12 s with a reveal — the owner's timings, never changed):
// THE ANSWER first (≥ SKIP_MIN_MS, so the skip never comes before it), then the ROUND WINNER banner, then the OVERALL standings for the last
// STANDINGS_BEAT_MS. SOLO has no banner (the answer holds until the standings). The LAST challenge has no 'standings' phase: its beats run at
// the start of 'final' (FINAL_MS — 120 s), followed by THE FINAL STANDINGS (FINAL_STANDINGS_MS; not in solo) and THE VICTORY.
// Every beat is timed from the phase's own start on the server clock, so a refresh / a rejoin / a new host lands on the right one.
export const BANNER_BEAT_MS = 1_300;
export const STANDINGS_BEAT_MS = 3_700;
export const FINAL_STANDINGS_MS = 9_000;
export function resultBeats(type, solo = false) {
  const L = standingsMs(type);
  const stand = L - STANDINGS_BEAT_MS;
  return { answer: 0, banner: solo ? null : stand - BANNER_BEAT_MS, stand, end: L };
}
export function finalBeats(type, solo = false) {
  const b = resultBeats(type, solo);
  return { ...b, final: solo ? null : b.end, victory: b.end + (solo ? 0 : FINAL_STANDINGS_MS) };
}
/** the beat at `ms` since the phase began (resultBeats or finalBeats) */
export function beatAt(b, ms) {
  if (b.victory != null && ms >= b.victory) return 'victory';
  if (b.final != null && ms >= b.final) return 'final';
  if (ms >= b.stand) return 'stand';
  if (b.banner != null && ms >= b.banner) return 'banner';
  return 'answer';
}
/** the ms (since the phase began) a beat starts at */
export const beatStart = (b, beat) => ({ answer: 0, banner: b.banner, stand: b.stand, final: b.final, victory: b.victory })[beat];
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
//  - LONG SHOT (OC5) = a winning DUMB LUCK ticket at 8-1 or longer (the longest odds, then the uid). It leads: the chips are the first TWO of
//    LONG SHOT · BEST STREAK · FASTEST that apply.
//  - A chip that doesn't apply is skipped.
export const STREAK_CHIP_MIN = 3;
export const FASTEST_MIN_RIGHT = 3;
export const FASTEST_SKIP = new Set(['compass', 'memory', 'sortit', 'reflex', 'count', LUCK]);
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
/** every winning long-shot ticket of the match → [{ uid, n, ci }] */
export function longShots(game) {
  const out = [];
  for (const ci of Object.keys((game && game.results) || {}).map(Number).sort((a, b) => a - b)) {
    if (!game.order || game.order[ci] !== LUCK) continue;
    const t = dlTickets(game, ci);
    if (t && t.long) for (const uid of t.uids) out.push({ uid, n: t.n, ci });
  }
  return out;
}
export const AWARD_CHIPS_MAX = 2;
export function awardChips(game) {
  const chips = [];
  const uids = Object.keys((game && game.participants) || {}).sort();
  const ls = longShots(game).filter(x => uids.includes(x.uid)).sort((a, b) => b.n - a.n || a.ci - b.ci || (a.uid < b.uid ? -1 : 1))[0];
  if (ls) chips.push({ k: 'longshot', uid: ls.uid, v: ls.n });
  const reach = u => { const v = game.cr && Number(game.cr[u]); return Number.isFinite(v) ? v : Infinity; };
  const streak = uids.map(u => ({ uid: u, m: (game.combo && game.combo[u] && Number(game.combo[u].m)) || 0 }))
    .filter(x => x.m >= STREAK_CHIP_MIN)
    .sort((a, b) => b.m - a.m || reach(a.uid) - reach(b.uid) || (a.uid < b.uid ? -1 : 1))[0];
  if (streak) chips.push({ k: 'streak', uid: streak.uid, v: streak.m });
  const f = fastestOf(game);
  const fast = Object.entries(f).map(([uid, x]) => ({ uid, ...x }))
    .sort((a, b) => a.avg - b.avg || a.last - b.last || (a.uid < b.uid ? -1 : 1))[0];
  if (fast) chips.push({ k: 'fastest', uid: fast.uid, v: fast.avg, n: fast.right });
  return chips.slice(0, AWARD_CHIPS_MAX);
}

/** the most a challenge can score (the solo yardstick for YOUR BEST / WORST): 160, ×2 on the last */
export const maxPts = (game, ci) => (100 + SPEED_BONUS) * (Number(ci) === (game.total || 0) - 1 ? 2 : 1);
/** THE SCORING TABLE's ceiling for one challenge of a type (the server's plausibility bound — OC5's QUICK solo board): every skill challenge
 *  100 + the 60 speed / closest bonus, ×2 on the last; DUMB LUCK its longest odds' payout (never last) */
export const challengeMax = (type, final) => (type === LUCK ? DL_MAX : (100 + SPEED_BONUS) * (final ? 2 : 1));
/** THE SCORING TABLE's ceiling for ONE result (the server's QUICK solo bound — OC5): the most `pts` a player with `ok` of `parts` could have
 *  scored in a challenge of this type (challengeScore's own rules: no speed bonus unless every part is right, CLOSEST CALL's +60 for the
 *  closest, SORT IT's net sorts, ×2 on the last) — a result above it is no real run */
export function ptsCeiling(type, ok, parts, final) {
  const f = final ? 2 : 1;
  if (type === LUCK) return DL_MAX;
  const P = Math.max(0, Number(parts) || 0), K = Math.max(0, Math.min(P, Number(ok) || 0));
  const acc = P > 0 ? K / P : 0;
  if (type === 'reflex') return Math.round((100 + SPEED_BONUS) * acc) * f;
  if (type === 'closest') return (Math.round(100 * acc) + SPEED_BONUS) * f;
  const base = type === 'sortit' ? Math.round(100 * Math.min(1, K / SORT_FULL)) : Math.round(100 * acc);
  return (base + (K >= P && P > 0 ? SPEED_BONUS : 0)) * f;
}
/** the most a whole match of this order can score */
export const matchMax = order => (order || []).reduce((s, t, i) => s + challengeMax(t, i === order.length - 1), 0);
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
    return { ci, type: game.order && game.order[ci], pts: mine, rel: yard > 0 ? mine / yard : 0, yard };
  });
  // (OC8 — A10, THE FABLE REVIEW: "YOUR WORST · +0 · 0% OF THE BEST" when nobody scored it, "YOUR WORST · +134 · TOP OF THE ROOM") a challenge
  // NOBODY scored is nobody's worst; a worst that still topped the room isn't one — no WORST tile then; nothing scored at all → no tiles
  const scored = rows.filter(r => r.yard > 0);
  if (!scored.length || !rows.some(r => r.pts > 0)) return null;
  const best = scored.slice().sort((a, b) => b.rel - a.rel || b.pts - a.pts || a.ci - b.ci)[0];
  const worst = scored.slice().sort((a, b) => a.rel - b.rel || a.pts - b.pts || a.ci - b.ci)[0];
  return { best, worst: worst.ci !== best.ci && worst.rel < 1 ? worst : null };
}

