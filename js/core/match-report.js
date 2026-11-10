// What a finished match means for the global boards, PURE: per player the placing, a win or not, career counters
// and record values — each record checked for plausibility. The server runs this on the room's OWN copy of the
// match (rooms/{code}/game), never on numbers a client sends, so a host can't simply type in a score; the
// plausibility checks catch impossible values that made it into the room anyway (a hacked client's own node).
//
//   extractMatch(game, { pulseCounts }) → { gid, n, mode, rows: { uid: { rank, win, c: {counter: +n}, rec: {board: value}, f?: {flag: 1} } }, rejected: [...] }
// f = THE GAME'S ACHIEVEMENT FLAGS (PROGRESSION A — the contract each game's rework plugs into, core/achievements.js#GAME_ACHIEVEMENTS):
// what this match proved for this player that only the game can tell (PRISM DROP: quad = a 4-line clear; OVERCLOCK: exact = a Closest
// Call dead on, comeback = last at the halfway point, then the win). Read from the room's own copy, like everything here.
import { standings as cipherStandings, MAX_GUESSES } from '../games/cipher/logic.js';
import * as ocMeta from '../games/overclock/meta.js';
import * as prismMeta from '../games/prism/meta.js';
import { boardDef } from './boards.js';
import { rankings as signalRankings } from '../games/signal/logic.js';
import { standings as ocStandings, MODES as OC_MODES, roundWin as ocRoundWin, ptsCeiling as ocPtsCeiling, matchMax as ocMatchMax } from '../games/overclock/logic.js';
import { SKILL_TYPES as OC_SKILL_TYPES } from '../games/overclock/challenges.js';
import { LUCK as OC_LUCK, dlVerify as ocLuckVerify } from '../games/overclock/luck.js';
import { standings as bluffStandings } from '../games/bluff/logic.js';
import { standings as pulseStandings, multiplier } from '../games/pulse/logic.js';
import { totals as golfTotals, standings as golfStandings, CAP as GOLF_CAP } from '../games/golf/logic.js';
import { standings as agentStandings } from '../games/agent/logic.js';
import { standings as prismStandings } from '../games/prism/logic.js';
import { standings as slipStandings } from '../games/slip/logic.js';
import { maxSpeed } from '../games/slip/course.js';
import { standings as gridlockStandings } from '../games/gridlock/logic.js';
import { standings as rumStandings, replay as rumReplay, verifyDays as rumVerify, fortune as rumFortune, LENGTHS as RUM_LENGTHS } from '../games/rum/logic.js';
import { standings as stakesStandings, ledger as stakesLedger, minBet as stakesMinBet, payout as stakesPayout, START as STAKES_START, LOAN as STAKES_LOAN } from '../games/stakes/logic.js';

const STANDINGS = {
  cipher: cipherStandings, signal: signalRankings, overclock: ocStandings, bluff: bluffStandings, pulse: pulseStandings,
  golf: golfStandings, agent: agentStandings, prism: prismStandings, slip: slipStandings, gridlock: gridlockStandings,
  stakes: stakesStandings, rum: rumStandings,
};
export const REPORT_GAMES = Object.keys(STANDINGS);
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const vals = o => Object.values(o || {});

// ------------------------------------------------------------------ plausibility bounds
/** The best possible PULSE score for a chart of n notes (every note perfect, the combo never broken). */
export function maxPulseScore(n) {
  let s = 0;
  for (let i = 0; i < n; i++) s += 100 * multiplier(i);
  return s;
}

/** The farthest a SLIPSTREAM rider can get in `sec` seconds (top speed the whole way), metres. */
export function maxSlipDistance(sec) {
  let d = 0;
  const T = Math.max(0, Math.min(sec, 20 * 60));
  for (let t = 0; t < T; t += 0.5) d += maxSpeed(t) * Math.min(0.5, T - t);
  return d;
}

/** A generous ceiling on a Score Rush score: every line a back-to-back perfect clear at the level it could reach. */
/** FR6 FIXES A (C3 — a board could be cheated): PRISM DROP's SCORE RUSH is ONE song; the bound's seconds came from `game.sd` — the HOST
 *  writes it (a hacked host: sd [1e9] → any score passed). Now capped from the songs themselves: the longest in data/prism/manifest.json
 *  (PD-5A: Feeling Human Again, 230.8 s — a day song) + 10 s, rounded up — tests/profiles.test.mjs fails if a longer song is added without raising it */
export const RUSH_MAX_S = 241;
export function maxRushScore(lines, seconds) {
  const lv = 16 + Math.ceil(lines / 10);
  const pieces = seconds * 6 + 60;
  return lv * (lines * 2200 + 6000) + pieces * 60;
}

/** CIPHER: the most one round can score. */
const cipherRoundMax = len => 100 + 25 * Math.max(0, len - 5) + 100 + 20 * MAX_GUESSES;
export const CIPHER_MIN_SOLVE_MS = 1500;
const OC_CHALLENGE_MAX = 2 * (160 + 60 + 60);

// ------------------------------------------------------------------ per-game extras
function cipherExtra(game, uid, out) {
  const res = game.results || {};
  let total = 0, fast = null, bad = false;
  for (const [r, rr] of Object.entries(res)) {
    const x = rr && rr[uid];
    if (!x) continue;
    const len = (game.lengths || [])[r] || 5;
    if (num(x.pts) < 0 || num(x.pts) > cipherRoundMax(len)) bad = true;
    total += num(x.pts);
    if (len === 5 && x.solved) {
      const t = num(x.t);
      if (t < CIPHER_MIN_SOLVE_MS || t > num(game.roundMs) + 1000) out.rejected.push({ uid, board: 'cipher-fast5', v: t });
      else if (fast == null || t < fast) fast = t;
    }
  }
  if (bad) out.rejected.push({ uid, board: 'cipher-score', v: total });
  else if (total > 0) out.rec['cipher-score'] = total;
  if (fast != null) out.rec['cipher-fast5'] = fast;
}

function signalExtra(game, uid, out) {
  let el = 0;
  for (const q of vals(game.log)) {
    const ev = Array.isArray(q && q.ev) ? q.ev : vals(q && q.ev);
    const outs = new Set(ev.filter(e => e && e.t === 'out').map(e => e.u));
    if (ev.some(e => e && e.t === 'hit' && e.a === uid && outs.has(e.v) && e.v !== uid)) {
      el += new Set(ev.filter(e => e && e.t === 'hit' && e.a === uid && outs.has(e.v)).map(e => e.v)).size;
    }
  }
  if (el) out.c.el = el;
}

function overclockExtra(game, uid, out, row, ctx, win) {
  // the achievement flags (every mode): DEAD ON + COMEBACK KID
  const order = game.order || [], res = game.results || {};
  if (order.some((t, ci) => t === 'closest' && res[ci] && res[ci][uid] && num(res[ci][uid].ok) >= 1)) (out.f ||= {}).exact = 1;
  const half = Math.floor(num(game.total) / 2), uids = Object.keys(game.participants || {});
  if (win && half >= 1 && uids.length >= 3 && Object.keys(res).length >= half) {
    const at = u => { let s = 0; for (let ci = 0; ci < half; ci++) s += num(res[ci] && res[ci][u] && res[ci][u].pts); return s; };
    const mine = at(uid);
    if (uids.every(u => u === uid || at(u) > mine)) (out.f ||= {}).comeback = 1;
  }
  // OVERCLOCK CARDS (Nov 5 night) — the two cards' flags, from the room's own record (2+ players: alone, "every challenge" is automatic)
  const tot = u => { let s = 0; for (const rr of vals(res)) s += num(rr && rr[u] && rr[u].pts); return s; };
  if (uids.length >= 2) {
    // REDLINE — sweep: a QUICK match, every challenge played (all 6 results), this player ALONE on top of every one (strictly the most, > 0)
    const quick = game.settings && game.settings.mode === 'quick' && num(game.total) === OC_MODES.quick && Object.keys(res).length === OC_MODES.quick;
    // (OC2: THE ROUND WIN is ONE rule — overclock/logic.js#roundWin, the same the game's ROUND WINNER banner + ROUND WINS use)
    if (quick && Object.values(res).every(rr => { const r = ocRoundWin(rr, uids); return r.kind === 'win' && r.uid === uid; })) (out.f ||= {}).sweep = 1;
    // PHOTO FINISH — photo: the win, ALONE in first, by exactly one point over second (any mode)
    if (win && row.rank === 1) { const me = tot(uid), next = Math.max(...uids.filter(u => u !== uid).map(tot)); if (me - next === 1) (out.f ||= {}).photo = 1; }
    // THE HORSESHOE (OC5) — horseshoe: this player BACKED THE WINNER of a DUMB LUCK race — the server REPLAYS the race from the room's record
    // (game/dl/{ci}: the locked picks + the lock's ms → the draw must be the stored winner, every result its payout); a record that doesn't
    // replay = no flag
    if (order.some((t, ci) => t === OC_LUCK && res[ci] && (() => { const v = ocLuckVerify(game, ci); return v.ok && v.winners.includes(uid); })())) (out.f ||= {}).horseshoe = 1;
  }
  const mode = game.settings && game.settings.mode;
  // THE QUICK SOLO PERSONAL BEST (OC5 — board overclock-quick-solo): a SOLO QUICK run, all six played, each result inside THE SCORING TABLE
  // (logic.js#ptsCeiling — the most its ok / parts could score, ×2 on the last) + the order six real skill challenges (never DUMB LUCK alone)
  // → rec 'overclock-quick' (the solo lane maps it to overclock-quick-solo); anything a real QUICK run can't reach is refused
  if (uids.length === 1 && mode === 'quick' && num(game.total) === OC_MODES.quick && Object.keys(res).length === OC_MODES.quick) {
    const ord = Array.isArray(order) ? order : Object.values(order || {});
    let bad = ord.length !== OC_MODES.quick || !ord.every(t => OC_SKILL_TYPES.includes(t));
    let total = 0;
    for (let ci = 0; ci < OC_MODES.quick && !bad; ci++) {
      const x = res[ci] && res[ci][uid];
      const p = num(x && x.pts);
      if (!x || p < 0 || !Number.isInteger(p) || p > ocPtsCeiling(ord[ci], num(x.ok), num(x.parts), ci === OC_MODES.quick - 1)) bad = true;
      total += p;
    }
    if (!bad && total > ocMatchMax(ord)) bad = true;
    if (bad) out.rejected.push({ uid, board: 'overclock-quick-solo', v: row.score });
    // (OC8 — B1, THE FABLE REVIEW: a phone left on the table wrote a 0 to the board + "NEW PERSONAL BEST") a run that scored nothing — no
    // answered part, a total of 0 — is never a record (not a cheat either: just nothing to keep)
    else if (total > 0 && Object.values(res).some(rr => num(rr && rr[uid] && rr[uid].ok) > 0)) out.rec['overclock-quick'] = row.score;
  }
  if (mode !== 'standard' || num(game.total) !== OC_MODES.standard) return;
  let bad = false;
  for (const ci of Object.keys(game.results || {})) {
    const p = num(game.results[ci] && game.results[ci][uid] && game.results[ci][uid].pts);
    if (p < 0 || p > OC_CHALLENGE_MAX) bad = true;
  }
  if (Object.keys(game.results || {}).length !== OC_MODES.standard) return; // not every challenge played
  if (bad) out.rejected.push({ uid, board: 'overclock-std', v: row.score });
  else if (uids.length > 1 || num(row.score) > 0) out.rec['overclock-std'] = row.score;   // (B1: a SOLO run of 0 is never a record)
}

function bluffExtra(game, uid, out) {
  let f = 0;
  for (const rr of vals(game.results)) f += num(rr && rr[uid] && rr[uid].fooled);
  if (f) out.c.fool = Math.min(f, 99);
}

function pulseExtra(game, uid, out, row, ctx) {
  const diff = (game.settings && game.settings.diff) || 'normal';
  (game.songs || []).forEach((song, si) => {
    const x = game.results && game.results[si] && game.results[si][uid];
    if (!song || !x) return;
    const counts = ctx.pulseCounts && ctx.pulseCounts[song.id];
    const n = counts && counts[diff];
    const board = `pulse-${song.id}-${diff}`;
    const s = num(x.s);
    const judged = num(x.p) + num(x.g) + num(x.o) + num(x.m);
    if (!n) return; // unknown song: nothing to check against, no record
    if (s < 0 || s > maxPulseScore(n) || judged > n + 2 || num(x.mc) > n) { out.rejected.push({ uid, board, v: s }); return; }
    if (s > 0 && (out.rec[board] == null || s > out.rec[board])) out.rec[board] = s;
  });
}

function golfExtra(game, uid, out) {
  if (!Array.isArray(game.holes) || game.holes.length !== 9) return;
  const t = golfTotals(game)[uid];
  if (!t || t.played !== 9) return;
  for (const hr of vals(game.results)) {
    const s = hr && hr[uid] && hr[uid].s;
    if (s != null && (!Number.isInteger(s) || s < 1 || s > GOLF_CAP)) { out.rejected.push({ uid, board: 'golf-par9', v: t.toPar }); return; }
  }
  out.rec['golf-par9'] = t.toPar;
}

function agentExtra(game, uid, out) {
  let esc = 0, spot = 0;
  for (const rr of vals(game.results)) {
    const x = rr && rr[uid];
    if (!x) continue;
    if (x.escaped) esc++;
    if (x.spotted) spot++;
  }
  if (esc) out.c.esc = esc;
  if (spot) out.c.spot = spot;
}

function prismExtra(game, uid, out, row, ctx, win) {
  const r = (game.results || {})[uid] || {};
  if (r.best === 'quad') (out.f ||= {}).quad = 1;   // FOUR ON THE FLOOR (the match's best clear was four lines at once)
  if (num(r.ko)) out.c.ko = Math.min(num(r.ko), 7);
  // PD-5B — THE THREE CARDS' flags, from the room's OWN record (PD-2's results + the eliminations the host wrote), each checked against it:
  const mode = game.settings && game.settings.mode, n = Object.keys(game.participants || {}).length;
  // FIRST KO — firstko: a BATTLE (2+ players) where this player knocked someone out: the KO count AND an elimination credited to them in
  // game.out (by: uid), never more KOs than opponents
  const byMe = vals(game.out).filter(o => o && o.by === uid).length;
  if (mode === 'battle' && n >= 2 && num(r.ko) >= 1 && num(r.ko) <= n - 1 && byMe >= 1) (out.f ||= {}).firstko = 1;
  // PERFECT CLEAR — pc: ≥ 1 perfect clear, any mode (a solo run too — the solo lane hands every row's flags to the award engine); each one
  // clears at least one line, so never more than the lines cleared
  if (num(r.pc) >= 1 && num(r.pc) <= num(r.ln)) (out.f ||= {}).pc = 1;
  // COMEBACK — comeback: WON a BATTLE (2+ players, the room's winner) after the stack reached the danger zone (dz — the top 5 rows)
  if (mode === 'battle' && n >= 2 && win && game.winner === uid && r.dz === 1) (out.f ||= {}).comeback = 1;
  if (!game.settings || game.settings.mode !== 'rush') return;
  const sc = num(r.sc), ln = num(r.ln);
  const sd = vals(game.sd).map(num);
  const sec = Math.min(RUSH_MAX_S, Math.max(30, sd.reduce((s, x) => s + x, 0) / 1000 || RUSH_MAX_S));
  // (one song, never longer than the longest there is: anything else is a host's own numbers)
  const bad = sd.length > 1 || sd.some(x => !(x > 0) || x > RUSH_MAX_S * 1000);
  if (bad || sc < 0 || ln < 0 || ln > sec * 4 || sc > maxRushScore(ln, sec)) { out.rejected.push({ uid, board: 'prism-rush', v: sc }); return; }
  if (sc > 0) out.rec['prism-rush'] = sc;
}

function slipExtra(game, uid, out) {
  const r = (game.results || {})[uid] || {};
  const o = (game.out || {})[uid];
  const d = num(r.d) || num(o && o.d);
  if (d <= 0) return;
  const end = (o && o.at) || game.phaseStartAt || 0;
  const sec = Math.max(0, (end - num(game.playStartAt)) / 1000);
  if (!game.playStartAt || d > maxSlipDistance(sec + 3) * 1.05 + 40) { out.rejected.push({ uid, board: 'slip-dist', v: d }); return; }
  out.rec['slip-dist'] = Math.round(d);
}

function gridlockExtra(game, uid, out, row, ctx, win) {
  const r = (game.results || {})[uid] || {};
  const n = Object.keys(game.participants || {}).length;
  if (num(r.el)) out.c.sunk = Math.min(num(r.el), n - 1);
  const mode = game.mode || (game.settings && game.settings.mode) || 'classic';
  if (win && ['classic', 'salvo', 'royale', 'arcade'].includes(mode)) out.c[`w_${mode}`] = 1;
}

/** HIGH STAKES: every round replayed — each bet within the table's limits, each result the bet × the payout. */
function stakesExtra(game, uid, out) {
  let stack = STAKES_START;
  const rounds = Object.keys(game.res || {}).map(Number).sort((a, b) => a - b);
  for (const r of rounds) {
    const x = game.res[r] && game.res[r][uid];
    if (!x) continue;
    const plan = (game.plan || {})[r] || {};
    const okD = ['medium', 'hard'].includes(plan.d);
    const want = x.ok ? x.b * stakesPayout(plan.d, r) : -x.b;
    if (!okD || !Number.isInteger(x.b) || x.b < Math.min(stakesMinBet(stack), stack) || x.b > stack || x.d !== want) {
      out.rejected.push({ uid, board: 'stakes-chips', v: x.d });
      return;
    }
    stack += x.d;
    if (stack <= 0) stack += STAKES_LOAN;
  }
  const L = stakesLedger(game)[uid];
  if (!L) return;
  if (L.net > 0) out.rec['stakes-chips'] = L.net;
  if (L.best > 0) out.rec['stakes-big'] = L.best;
}

/** RUMRUNNER: the whole city replayed from the seed and the books — every price, every trade, every roll of the dice. */
const rumChecked = new WeakMap();
function rumExtra(game, uid, out, row) {
  if (!rumChecked.has(game)) rumChecked.set(game, (() => { try { return rumVerify(game); } catch { return false; } })());
  const R = rumReplay(game, uid, (game.books || {})[uid] || {});
  const f = rumFortune(R.S);
  if (!rumChecked.get(game) || !R.valid || f !== row.nw) { out.rejected.push({ uid, board: 'rum', v: f }); return; }
  const days = game.settings && game.settings.days;
  if (f > 0 && RUM_LENGTHS.includes(days)) out.rec[`rum-f${days}`] = f;
}

const EXTRA = { cipher: cipherExtra, signal: signalExtra, overclock: overclockExtra, bluff: bluffExtra, pulse: pulseExtra, golf: golfExtra, agent: agentExtra, prism: prismExtra, slip: slipExtra, gridlock: gridlockExtra, stakes: stakesExtra, rum: rumExtra };

/** Is this a finished match we can count? (null = yes, else the reason) */
// THE SOLO LANE (SHELL 2.0 B1 — D3): the cartridges a room of ONE may count (their meta's SOLO — the same flag the console starts them by)
export const SOLO_OK = Object.freeze({ overclock: ocMeta.SOLO === true, prism: prismMeta.SOLO === true });
/** a solo match's records go to the game's SOLO board (`<board>-solo` — core/boards.js), never the multiplayer one; none → dropped */
export const soloBoard = b => (boardDef(`${b}-solo`) ? `${b}-solo` : null);
export function unreportable(game) {
  if (!game || typeof game !== 'object') return 'no match';
  if (!STANDINGS[game.id]) return 'unknown game';
  if (game.phase !== 'final') return 'not finished';
  const np = Object.keys(game.participants || {}).length;
  if (np < 1 || (np < 2 && !SOLO_OK[game.id])) return 'too few players';   // (SHELL 2.0 B1 — THE SOLO LANE: one player, a SOLO cartridge)
  return null;
}

// THE CARD PASS — B1 (OVERCLOCK's FABLE REVIEW): AN EMPTY SOLO RUN NEVER COUNTS — a room of one that answered nothing and scored nothing (a
// phone left on the table) pays no solo XP, no streak day, no solo-lane count (core/progress.js#matchStep skips it: 'empty'). It counts
// with ≥ 1 answered part (a right part: `ok`) or a total > 0. PURE (the tests).
const SOLO_PLAYED = {
  overclock: (game, uid) => vals(game.results).some(rr => { const x = rr && rr[uid]; return !!x && (num(x.ok) > 0 || num(x.pts) > 0); }),
  prism: (game, uid) => { const r = (game.results || {})[uid] || {}; return num(r.sc) > 0 || num(r.ln) > 0; },
};
// (PD-2 — PRISM DROP's solo SURVIVAL: the standings' score is the SECONDS SURVIVED, which a phone on the table earns too (the pieces fall + lock
//  by themselves) — so PRISM's own check decides alone: points or lines (a solo SCORE RUSH's score IS its points — the same answer))
const SOLO_PLAYED_ONLY = new Set(['prism']);
export function soloEmpty(game, uid, row = {}) {
  const f = SOLO_PLAYED[game && game.id];
  if (f && SOLO_PLAYED_ONLY.has(game.id)) return !f(game, uid);
  return !(num(row.score) > 0 || (f ? f(game, uid) : false));
}

export function extractMatch(game, ctx = {}) {
  const why = unreportable(game);
  if (why) throw new Error(why);
  const rows = STANDINGS[game.id](game);
  const n = Object.keys(game.participants || {}).length;
  const firsts = rows.filter(r => r.rank === 1).length;
  const solo = n === 1;   // (THE SOLO LANE: no win, no placing, no night points — the streak + a small capped XP; the records on the solo boards)
  const out = { gid: game.id, n, solo, mode: game.mode || (game.settings && game.settings.mode) || null, rows: {}, rejected: [] };
  for (const row of rows) {
    if (!game.participants[row.uid]) continue;
    // a win is a first place that isn't shared by the whole table (a total deadlock is nobody's win)
    const win = !solo && row.rank === 1 && firsts < n;
    const o = { rank: row.rank, win, c: { p: 1, ...(win ? { w: 1 } : {}) }, rec: {}, rejected: out.rejected };
    EXTRA[game.id](game, row.uid, o, row, ctx, win);
    if (solo && soloEmpty(game, row.uid, row)) o.empty = 1;   // (B1: nothing answered, nothing scored → never counted)
    if (solo) { o.solo = true; const rec = {}; for (const [b, v] of Object.entries(o.rec)) { const sb = soloBoard(b); if (sb) rec[sb] = v; } o.rec = rec; }
    delete o.rejected;
    out.rows[row.uid] = o;
  }
  return out;
}
