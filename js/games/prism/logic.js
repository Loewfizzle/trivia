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
import { playlistAt, XF_MS } from '../../core/playlist.js';
import { goBeat } from './songs.js';

// ---------------------------------------------------------------- THE SETS (PD-5A — docs/prism.md "THE HOST's SET")
// Two sets of songs: NIGHT (the original five — unchanged) and DAY (five lo-fi songs, manifest look: 'day'). The HOST's resolved look at the
// match's start picks the room's set (game.set) — every phone plays that set's songs in sync, whatever look it draws. Each set keeps its own
// no-repeat shuffle through the room's night: NIGHT on meta/prism/n (as before), DAY in the night's memory (meta/used/prism/dn<N> = the day
// playlist has reached N — the highest N counts; no new rule). A day song's CUE-IN (manifest `cue`, s) skips a soft intro: the schedule
// starts the file there (game.cu, ms); its slot ends at its LAST STRONG BEAT — the next song's crossfade starts there (sd = lastBeat − cue + XF).
export const SETS = Object.freeze(['night', 'day']);
export const setOfSong = s => (s && s.look === 'day' ? 'day' : 'night');
/** the set a resolved look plays: 'day' | 'night' */
export const setForLook = look => (look === 'day' ? 'day' : 'night');
/** the day playlist's position in this room (the night's memory: meta/used/prism) */
export function dayPos(used) {
  let n = 0;
  for (const k of Object.keys(used || {})) { const m = /^dn(\d+)$/.exec(k); if (m) n = Math.max(n, Number(m[1])); }
  return n;
}
/** the night-memory key that moves the day playlist to position n */
export const dayKey = n => `dn${Math.max(0, Math.floor(n))}`;
/** PFIX-B (FABLE REVIEW optional 12): the playlist moves past the match's FIRST song at its START (the end step still moves it past every song
 *  played) — END GAME / everyone leaving mid-match no longer deals the same first song again. → the room writes (host.js's `$room`) */
export function playlistAdvance(set, pos, seed = null) {
  const n = Math.max(0, Math.floor(pos)) + 1;
  if (set === 'day') return { [`meta/used/prism/${dayKey(n)}`]: true };
  return seed ? { 'meta/prism': { seed, n } } : { 'meta/prism/n': n };
}
/**
 * Deal a match's songs. manifest: the manifest's songs · set: 'day' | 'night' (a set with no songs → night) · roomSeed · pos: the set's
 * playlist position · count. → { set, songs: [ids], sd: [ms], cu: [ms] | null }
 */
export function dealSongs({ manifest = [], set = 'night', roomSeed, pos = 0, count = 1 }) {
  let pool = manifest.filter(s => setOfSong(s) === set);
  if (!pool.length) { set = 'night'; pool = manifest.filter(s => setOfSong(s) === 'night'); }
  const ids = pool.map(s => s.id);
  const seed = set === 'day' ? `${roomSeed}:day` : roomSeed;
  const songs = ids.length ? Array.from({ length: count }, (_, i) => playlistAt(seed, pos + i, ids)) : [];
  const byId = Object.fromEntries(pool.map(s => [s.id, s]));
  const slots = songs.map(id => slotOf(byId[id], set));
  return { set, songs, sd: slots.map(x => x.sd), cu: set === 'day' ? slots.map(x => x.cu) : null, ff: set === 'day' ? slots.map(x => x.ff) : null };
}
/**
 * The match's song timing (PURE — index.js#start + the tests): the GO (the first downbeat ≥ COUNT_MIN_MS into the room's schedule) and
 * SCORE RUSH's end (the first song's LAST STRONG BEAT), both on the song's own grid — a day song's cue-in included (the schedule starts the
 * file at the cue: song time = schedule time + cue). doc0: the first song's analysis (null while unknown).
 */
export function matchTiming({ songStartAt, doc0 = null, cue0 = 0, sd0 = 0, hasSongs = true }) {
  let playStartAt = songStartAt + COUNT_MIN_MS + 800;
  let endAt;
  if (!hasSongs) endAt = playStartAt + 150_000;
  else if (doc0) {
    const go = goBeat(doc0, cue0 + COUNT_MIN_MS / 1000);
    playStartAt = songStartAt + Math.round((go.time - cue0) * 1000);
    endAt = songStartAt + Math.round(((doc0.lastBeat || doc0.duration - 2) - cue0) * 1000);
  } else endAt = songStartAt + sd0 - 2000;
  return { playStartAt, endAt };
}
/** one song's slot in the schedule (ms): sd = its length in the room's schedule, cu = its cue-in. NIGHT: the whole file, no cue (as
 *  before PD-5A). DAY: from the cue-in to the LAST STRONG BEAT + the crossfade (the next song fades in from that beat) */
export function slotOf(song, set = setOfSong(song)) {
  const s = song || {};
  const dur = s.duration || 180;
  if (set !== 'day') return { sd: Math.round(dur * 1000), cu: 0, ff: 0 };
  const cue = Math.max(0, s.cue || 0);
  const last = s.lastBeat > cue ? s.lastBeat : dur;
  // (ff: the file's first AUDIO frame's byte — a cue-in's quick start streams from a frame just before the cue in ONE request: synced-songs.js)
  return { sd: Math.round(Math.min(dur - cue, last - cue + XF_MS / 1000) * 1000), cu: Math.round(cue * 1000), ff: Math.max(0, Math.floor(s.ff || 0)) };
}

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
 *   currentHit: the current target was picked BECAUSE they attacked you (PFIX-A — question D: once they're forgotten — no attack from them
 *               in TARGET_MEMORY_MS — the target goes back to THE RANDOM PICK, never kept as a grudge)
 *   rnd():      random number source (seeded in the tests: the same inputs give the same target)
 * The caller keeps `currentHit = attackers.includes(result)` for the next call.
 */
export function autoTarget({ candidates, attackers = [], current = null, currentHit = false, rnd = Math.random }) {
  if (!candidates.length) return null;
  const a = attackers.find(u => candidates.includes(u));
  if (a) return a;
  if (current && candidates.includes(current) && !currentHit) return current;
  return candidates[Math.floor(rnd() * candidates.length)];
}
/** PFIX-A (question D): an attacker is remembered this long after their last attack on you (the KO credit's own window) */
export const TARGET_MEMORY_MS = 20_000;
/** the attacks you received [{ uid, at }] → their senders, the most recent first (each once); with `now`, only those who hit you in the
 *  last `memory` ms (PFIX-A — a hit four minutes old no longer picks your target) */
export function attackersOf(hits = [], now = null, memory = TARGET_MEMORY_MS) {
  const last = new Map();
  for (const x of hits) if (x && x.uid && (now == null || now - (x.at || 0) < memory) && !(last.get(x.uid) >= (x.at || 0))) last.set(x.uid, x.at || 0);
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
/** PFIX-B (FABLE REVIEW finding 6): the KO credit's window — a phone names its killer in `by`, but the credit goes only to a player whose
 *  attack really sits in the victim's queue (prismq — its sender rule-checked, its `at` the server's), sent in the last KO_CREDIT_MS before
 *  the KO (+ the longest rise: the rows land after their delay, the view times its credit from the landing). */
export const KO_CREDIT_MS = 20_000;
export function creditedBy(queue, by, outAt) {
  if (!by || !queue || typeof queue !== 'object') return false;
  const from = outAt - KO_CREDIT_MS - JUNK_DELAY_DANGER_MS;
  return Object.values(queue).some(a => a && a.f === by && Number(a.at) >= from && Number(a.at) <= outAt);
}

/** PFIX-B (finding 7): the most junk a board takes into its queue — an attack that would take it past this is dropped (a flood can't bury) */
export const QUEUE_MAX = 40;

/** PFIX-B: when a board may be written — the RULES' own window (database.rules.json prism/{m}/{uid}), so an honest phone never sends a write
 *  the rules refuse: PLAY; the countdown from GO (GO lands before the host's tick); SCORE RUSH's END for its final save, never 4 s past the
 *  song; never once out (its own top-out or the director's). */
export function boardWritable(game, uid, now, node = null) {
  if (!game || !game.participants || !game.participants[uid]) return false;
  if ((game.out && game.out[uid]) || (node && node.st === 'out')) return false;
  const rush = game.settings && game.settings.mode === 'rush';
  if (rush && game.endAt && now > game.endAt + 3000) return false;
  if (game.phase === 'play') return true;
  if (game.phase === 'count') return now >= game.playStartAt - 1000;
  return game.phase === 'end' && rush;
}

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

// ---------------------------------------------------------------- THE DROP B add-on (Ben, Nov 13 9:59 pm) — A SOLO RUN PAUSES WHILE HIDDEN
// A solo run (PLAY NOW or a room of ONE — SCORE RUSH + SURVIVAL) stops while its page is hidden: the HOST (this same phone) writes `pz` (the server
// time it hid) and, back on the page, shifts every clock of the match by the time away + the 3-2-1 — so the rows' schedule, the song, SCORE RUSH's
// end and SURVIVAL's time (out.at − playStartAt) all resume EXACTLY where they were: the time = time PLAYED. `rz` = when play resumes (the 3-2-1's
// GO), `pms` = the paused total (the podium never shows it — the time already excludes it). PURE (host.js wires them; the multiplayer AWAY rule
// is untouched — never a pause with 2+ players).
export const RESUME_MS = 3000;
/** one participant (PLAY NOW's solo room or a room of one) */
export const isSoloGame = game => !!game && Object.keys(game.participants || {}).length === 1;
const pausable = game => isSoloGame(game) && (game.phase === 'play' || game.phase === 'count') && !!game.settings && (game.settings.mode === 'rush' || game.settings.mode === 'survival');
/** the page hid at server time `at` → the patch (null: nothing to pause — not solo, not playing, already paused) */
export function soloPause(game, { at } = {}) {
  if (!pausable(game) || game.pz != null || !Number.isFinite(at)) return null;
  return { pz: at };
}
/** back on the page at server time `now` → the patch: every clock shifted by (now + RESUME_MS − pz), pz cleared, rz = GO again */
export function soloResume(game, { now } = {}) {
  if (!game || game.pz == null || !Number.isFinite(now)) return null;
  const rz = now + RESUME_MS, shift = Math.max(0, rz - Number(game.pz));
  const plus = v => (Number.isFinite(v) ? v + shift : v);
  const patch = { pz: null, rz, pms: (Number(game.pms) || 0) + Math.max(0, now - Number(game.pz)), playStartAt: plus(game.playStartAt), songStartAt: plus(game.songStartAt) };
  if (Number.isFinite(game.endAt)) patch.endAt = plus(game.endAt);
  if (Number.isFinite(game.phaseEndsAt)) patch.phaseEndsAt = plus(game.phaseEndsAt);
  if (game.phase === 'play' && Number.isFinite(game.phaseStartAt)) patch.phaseStartAt = plus(game.phaseStartAt);
  return patch;
}
/** is the run held now — paused (pz) or inside the 3-2-1 back (rz)? */
export const soloHeld = (game, now) => !!game && (game.pz != null || (Number.isFinite(game.rz) && now < game.rz));
