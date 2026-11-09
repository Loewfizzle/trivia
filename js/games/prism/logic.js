// PRISM DROP — match rules (PURE). The board engine is engine.js; this file is everything around it:
// the room's shuffled playlist, the song schedule (crossfades), battle speed + sudden death, AUTO-TARGET (PD-2), SURVIVAL's junk
// schedule (PD-2), the comeback junk delay, Call the Winner bonuses and the standings.
import { rngFrom, shuffle } from '../../core/rng.js';
// (SHELL 2.0 B1 — THE THIN META: the console's pieces live in meta.js — one source; re-exported here for the rules + the server)
import { MODES, DEFAULT_SETTINGS, MIN_PLAYERS, cleanSettings, estimateMinutes, chatLocked } from './meta.js';
export { MODES, DEFAULT_SETTINGS, MIN_PLAYERS, cleanSettings, estimateMinutes, chatLocked };
export const LEAD_MS = 4500;          // match created -> song starts (title card, everyone loads)
export const COUNT_MIN_MS = 3200;     // at least this much song before GO (the 3-2-1 lands on beats)
export { XF_MS, CALL_MS, callBonus } from '../../core/playlist.js';
export const SPEED_STEP_MS = 60_000;  // battle: gravity up every minute
export const SUDDEN_MS = 300_000;     // battle: sudden death after 5 minutes …
export const SUDDEN_EVERY_MS = 10_000; // … a junk row rises every 10 s
export const OFFLINE_OUT_MS = 30_000; // battle: gone this long = eliminated
export const END_MS = 4200;           // the last KO / the finale before the results
export const JUNK_DELAY_MS = 1000;
export const JUNK_DELAY_DANGER_MS = 2500; // comeback breathing room
export const DANGER_ROWS = 16;        // stack this high (of 20 visible) = "within the top ~4 rows"
export const SONGS_PER_MATCH = 5;     // a battle can run through this many songs


// ---------------------------------------------------------------- playlist (shared: core/playlist.js)
export { playlistAt, songStarts, songAt, songsUsed } from '../../core/playlist.js';

// ---------------------------------------------------------------- battle pacing
export const battleLevel = elapsed => Math.min(12, 1 + Math.floor(Math.max(0, elapsed) / SPEED_STEP_MS));
/** Sudden-death rows that should have risen by `elapsed` ms of play. */
export const suddenRows = elapsed => (elapsed < SUDDEN_MS ? 0 : 1 + Math.floor((elapsed - SUDDEN_MS) / SUDDEN_EVERY_MS));
export const suddenGap = (seed, k) => Math.floor(rngFrom(`${seed}:sudden:${k}`)() * 10);
export const junkDelay = stackRows => (stackRows >= DANGER_ROWS ? JUNK_DELAY_DANGER_MS : JUNK_DELAY_MS);

// ---------------------------------------------------------------- targeting (PD-2 — AUTO-TARGET: one rule, no button, no setting)
/**
 * Who your attacks go to: whoever is attacking you (the most recent attacker still alive), otherwise a random living opponent — kept
 * while it stays valid.
 *   candidates: uids you may attack (alive, online, not you)
 *   attackers:  uids that sent you junk, the most recent first (attackersOf)
 *   current:    your current target
 *   rnd():      random number source (seeded in the tests: the same inputs give the same target)
 */
export function autoTarget({ candidates, attackers = [], current = null, rnd = Math.random }) {
  if (!candidates.length) return null;
  const a = attackers.find(u => candidates.includes(u));
  if (a) return a;
  if (current && candidates.includes(current)) return current;
  return candidates[Math.floor(rnd() * candidates.length)];
}
/** the attacks you received [{ uid, at }] → their senders, the most recent first (each once) */
export function attackersOf(hits = []) {
  const last = new Map();
  for (const x of hits) if (x && x.uid && !(last.get(x.uid) >= (x.at || 0))) last.set(x.uid, x.at || 0);
  return [...last.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(e => e[0]);
}

// ---------------------------------------------------------------- SURVIVAL (PD-2)
// No attacks: junk rows rise for EVERYONE on one seeded schedule (the same row, the same gap, the same moment on every phone): one row every
// 10 s at the start, speeding up smoothly (a smoothstep over SURV_RAMP_MS) to one every 4 s. Last one standing wins; solo = as long as you can.
export const SURV_SLOW_MS = 10_000;
export const SURV_FAST_MS = 4_000;
export const SURV_RAMP_MS = 150_000;
export function survivalEvery(t) {
  const k = Math.max(0, Math.min(1, t / SURV_RAMP_MS));
  return SURV_SLOW_MS - (SURV_SLOW_MS - SURV_FAST_MS) * k * k * (3 - 2 * k);
}
const survT = [SURV_SLOW_MS];   // the k-th row's time (ms of play) — grown on demand, the same for everyone
/** when SURVIVAL's k-th row (0-based) rises, in ms after GO */
export function survivalRowAt(k) {
  while (survT.length <= k) { const t = survT[survT.length - 1]; survT.push(Math.round(t + survivalEvery(t))); }
  return survT[k];
}
/** SURVIVAL rows that should have risen by `elapsed` ms of play */
export function survivalRows(elapsed) {
  let k = 0;
  while (survivalRowAt(k) <= elapsed) k++;
  return k;
}
/** the gap column of SURVIVAL's k-th row (from the seed — sudden death's own rule) */
export const survivalGap = (seed, k) => suddenGap(seed, k);

// ---------------------------------------------------------------- COMEBACK's danger zone (PD-5's card): a stack in the TOP 5 ROWS
export const DANGER_ZONE_ROWS = 16;   // a stack this high reaches the top 5 of the 20 visible rows

// ---------------------------------------------------------------- KO badges
/** KO credit: the killer takes all of the victim's badges plus one. */
export function applyKo(badges, killer, victim) {
  const b = { ...badges };
  if (killer && killer !== victim) b[killer] = (b[killer] || 0) + (b[victim] || 0) + 1;
  return b;
}

// ---------------------------------------------------------------- Call the Winner

// ---------------------------------------------------------------- standings
/**
 * Battle: winner first, then by elimination order (later = better). Rush: by score.
 * Returns [{ uid, rank, score, place }].
 */
export function standings(game) {
  const r = game.results || {};
  const uids = Object.keys(game.participants || {});
  const mode = game.settings && game.settings.mode;
  if (mode === 'rush') {
    const rows = uids.map(uid => ({ uid, score: (r[uid] && r[uid].sc) || 0 }))
      .sort((a, b) => b.score - a.score || (a.uid < b.uid ? -1 : 1));
    let rank = 0, prev = null;
    rows.forEach((row, i) => { if (row.score !== prev) { rank = i + 1; prev = row.score; } row.rank = rank; });
    return rows;
  }
  const out = game.out || {};
  // (PD-2 — SURVIVAL: the score = the seconds survived, the lines break a tie; BATTLE: the lines sent)
  const score = uid => (mode === 'survival' ? Math.round(((r[uid] && r[uid].t) || 0) / 1000) : (r[uid] && r[uid].sent) || 0);
  const lines = uid => (r[uid] && r[uid].ln) || 0;
  const rows = uids.map(uid => ({ uid, place: out[uid] ? out[uid].place : 1, score: score(uid), lines: lines(uid) }))
    .sort((a, b) => a.place - b.place || b.score - a.score || b.lines - a.lines || (a.uid < b.uid ? -1 : 1));
  rows.forEach(row => { row.rank = row.place; });
  return rows;
}

export const aliveOf = game => Object.keys(game.participants || {}).filter(u => !(game.out && game.out[u]));

/** Rough match length for the lobby. */

/** Names for the big clears (announcements + results). */
export const CLEAR_NAME = {
  single: 'SINGLE', double: 'DOUBLE', triple: 'TRIPLE', quad: '4-LINE CLEAR',
  twist: 'TWIST', tsingle: 'TWIST SINGLE', tdouble: 'TWIST DOUBLE', ttriple: 'TWIST TRIPLE',
  mini: 'MINI TWIST', msingle: 'MINI TWIST SINGLE', mdouble: 'MINI TWIST DOUBLE', pc: 'PERFECT CLEAR',
};

/** THE CARTRIDGE PLUG (docs/cartridge.md) — the chat's lock: locked while your board is live; knocked out (battle) = watch and talk */
