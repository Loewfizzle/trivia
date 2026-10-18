// What a finished match means for the global boards, PURE: per player the placing, a win or not, career counters
// and record values — each record checked for plausibility. The server runs this on the room's OWN copy of the
// match (rooms/{code}/game), never on numbers a client sends, so a host can't simply type in a score; the
// plausibility checks catch impossible values that made it into the room anyway (a hacked client's own node).
//
//   extractMatch(game, { pulseCounts }) → { gid, n, mode, rows: { uid: { rank, win, c: {counter: +n}, rec: {board: value} } }, rejected: [...] }
import { standings as cipherStandings, MAX_GUESSES } from '../games/cipher/logic.js';
import { rankings as signalRankings } from '../games/signal/logic.js';
import { standings as ocStandings, MODES as OC_MODES } from '../games/overclock/logic.js';
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

function overclockExtra(game, uid, out, row) {
  const mode = game.settings && game.settings.mode;
  if (mode !== 'standard' || num(game.total) !== OC_MODES.standard) return;
  let bad = false;
  for (const ci of Object.keys(game.results || {})) {
    const p = num(game.results[ci] && game.results[ci][uid] && game.results[ci][uid].pts);
    if (p < 0 || p > OC_CHALLENGE_MAX) bad = true;
  }
  if (Object.keys(game.results || {}).length !== OC_MODES.standard) return; // not every challenge played
  if (bad) out.rejected.push({ uid, board: 'overclock-std', v: row.score });
  else out.rec['overclock-std'] = row.score;
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

function prismExtra(game, uid, out) {
  const r = (game.results || {})[uid] || {};
  if (num(r.ko)) out.c.ko = Math.min(num(r.ko), 7);
  if (!game.settings || game.settings.mode !== 'rush') return;
  const sc = num(r.sc), ln = num(r.ln);
  const sec = Math.max(30, vals(game.sd).reduce((s, x) => s + num(x), 0) / 1000 || 240);
  if (sc < 0 || ln < 0 || ln > sec * 4 || sc > maxRushScore(ln, sec)) { out.rejected.push({ uid, board: 'prism-rush', v: sc }); return; }
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
export function unreportable(game) {
  if (!game || typeof game !== 'object') return 'no match';
  if (!STANDINGS[game.id]) return 'unknown game';
  if (game.phase !== 'final') return 'not finished';
  if (Object.keys(game.participants || {}).length < 2) return 'too few players';
  return null;
}

export function extractMatch(game, ctx = {}) {
  const why = unreportable(game);
  if (why) throw new Error(why);
  const rows = STANDINGS[game.id](game);
  const n = Object.keys(game.participants || {}).length;
  const firsts = rows.filter(r => r.rank === 1).length;
  const out = { gid: game.id, n, mode: game.mode || (game.settings && game.settings.mode) || null, rows: {}, rejected: [] };
  for (const row of rows) {
    if (!game.participants[row.uid]) continue;
    // a win is a first place that isn't shared by the whole table (a total deadlock is nobody's win)
    const win = row.rank === 1 && firsts < n;
    const o = { rank: row.rank, win, c: { p: 1, ...(win ? { w: 1 } : {}) }, rec: {}, rejected: out.rejected };
    EXTRA[game.id](game, row.uid, o, row, ctx, win);
    delete o.rejected;
    out.rows[row.uid] = o;
  }
  return out;
}
