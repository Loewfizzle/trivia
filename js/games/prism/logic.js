// PRISM DROP — match rules (PURE). The board engine is engine.js; this file is everything around it:
// the room's shuffled playlist, the song schedule (crossfades), battle speed + sudden death, targeting,
// the comeback junk delay, Call the Winner bonuses and the standings.
import { rngFrom, shuffle } from '../../core/rng.js';

export const MODES = ['battle', 'rush'];
export const DEFAULT_SETTINGS = { mode: 'battle' };
export const MIN_PLAYERS = 2;
export const LEAD_MS = 4500;          // match created -> song starts (title card, everyone loads)
export const COUNT_MIN_MS = 3200;     // at least this much song before GO (the 3-2-1 lands on beats)
export const XF_MS = 4000;            // crossfade between songs when a battle outlasts one
export const SPEED_STEP_MS = 60_000;  // battle: gravity up every minute
export const SUDDEN_MS = 300_000;     // battle: sudden death after 5 minutes …
export const SUDDEN_EVERY_MS = 10_000; // … a junk row rises every 10 s
export const OFFLINE_OUT_MS = 30_000; // battle: gone this long = eliminated
export const END_MS = 4200;           // the last KO / the finale before the results
export const CALL_MS = 10_000;        // Call the Winner window after you're knocked out
export const JUNK_DELAY_MS = 1000;
export const JUNK_DELAY_DANGER_MS = 2500; // comeback breathing room
export const DANGER_ROWS = 16;        // stack this high (of 20 visible) = "within the top ~4 rows"
export const SONGS_PER_MATCH = 5;     // a battle can run through this many songs

export function cleanSettings(s = {}) {
  return { mode: MODES.includes(s.mode) ? s.mode : DEFAULT_SETTINGS.mode };
}

// ---------------------------------------------------------------- playlist
/**
 * Song for playlist position k (0, 1, 2 … across the whole room session). Each cycle through the songs is
 * its own seeded shuffle, and a cycle never starts with the song the previous one ended on — so no song
 * repeats until every song has played, and never twice in a row.
 */
export function playlistAt(seed, k, ids) {
  if (!ids.length) return null;
  const n = ids.length;
  const order = cycle => {
    const o = shuffle(rngFrom(`${seed}:cycle:${cycle}`), ids.slice().sort());
    if (cycle > 0 && n > 1) {
      const prev = order(cycle - 1);
      if (o[0] === prev[n - 1]) [o[0], o[1]] = [o[1], o[0]];
    }
    return o;
  };
  return order(Math.floor(k / n))[k % n];
}

/** Song start times (server ms) for a match: each next song starts XF_MS before the previous one ends. */
export function songStarts(game) {
  const out = [];
  let t = game.songStartAt;
  for (let i = 0; i < (game.songs || []).length; i++) {
    out.push(t);
    t += (game.sd[i] || 180_000) - XF_MS;
  }
  return out;
}

/** Which song is playing at server time t: { i, start, end } (end = that song's last sample). */
export function songAt(game, t) {
  const starts = songStarts(game);
  let i = 0;
  while (i + 1 < starts.length && t >= starts[i + 1]) i++;
  return { i, start: starts[i], end: starts[i] + (game.sd[i] || 180_000) };
}

/** How many songs a match has used by server time t (advances the room playlist). */
export const songsUsed = (game, t) => songAt(game, t).i + 1;

// ---------------------------------------------------------------- battle pacing
export const battleLevel = elapsed => Math.min(12, 1 + Math.floor(Math.max(0, elapsed) / SPEED_STEP_MS));
/** Sudden-death rows that should have risen by `elapsed` ms of play. */
export const suddenRows = elapsed => (elapsed < SUDDEN_MS ? 0 : 1 + Math.floor((elapsed - SUDDEN_MS) / SUDDEN_EVERY_MS));
export const suddenGap = (seed, k) => Math.floor(rngFrom(`${seed}:sudden:${k}`)() * 10);
export const junkDelay = stackRows => (stackRows >= DANGER_ROWS ? JUNK_DELAY_DANGER_MS : JUNK_DELAY_MS);

// ---------------------------------------------------------------- targeting
export const TARGET_MODES = ['random', 'attackers', 'danger'];
/**
 * Picks who your attacks go to.
 *   candidates: uids you may attack (alive, online, not you)
 *   attackers:  uids currently targeting you (most recent first)
 *   heights:    { uid: stack height } for DANGER
 *   current:    your current target (kept in RANDOM mode while it stays valid)
 *   rnd():      random number source
 */
export function chooseTarget({ mode, candidates, attackers = [], heights = {}, current = null, rnd = Math.random }) {
  if (!candidates.length) return null;
  if (mode === 'attackers') {
    const a = attackers.find(u => candidates.includes(u));
    if (a) return a;
  }
  if (mode === 'danger') {
    const top = Math.max(...candidates.map(u => heights[u] || 0));
    const worst = candidates.filter(u => (heights[u] || 0) === top);
    if (current && worst.includes(current)) return current;
    return worst[Math.floor(rnd() * worst.length)];
  }
  if (current && candidates.includes(current)) return current;
  return candidates[Math.floor(rnd() * candidates.length)];
}

// ---------------------------------------------------------------- KO badges
/** KO credit: the killer takes all of the victim's badges plus one. */
export function applyKo(badges, killer, victim) {
  const b = { ...badges };
  if (killer && killer !== victim) b[killer] = (b[killer] || 0) + (b[victim] || 0) + 1;
  return b;
}

// ---------------------------------------------------------------- Call the Winner
/** Game-night bonus for a right call made with `remaining` players still alive (6 left ≈ a 2nd place). */
export const callBonus = remaining => Math.max(0, Math.round((remaining - 1) * 0.4 * 10) / 10);

// ---------------------------------------------------------------- standings
/**
 * Battle: winner first, then by elimination order (later = better). Rush: by score.
 * Returns [{ uid, rank, score, place }].
 */
export function standings(game) {
  const r = game.results || {};
  const uids = Object.keys(game.participants || {});
  if (game.settings && game.settings.mode === 'rush') {
    const rows = uids.map(uid => ({ uid, score: (r[uid] && r[uid].sc) || 0 }))
      .sort((a, b) => b.score - a.score || (a.uid < b.uid ? -1 : 1));
    let rank = 0, prev = null;
    rows.forEach((row, i) => { if (row.score !== prev) { rank = i + 1; prev = row.score; } row.rank = rank; });
    return rows;
  }
  const out = game.out || {};
  const rows = uids.map(uid => ({ uid, place: out[uid] ? out[uid].place : 1, score: (r[uid] && r[uid].sent) || 0 }))
    .sort((a, b) => a.place - b.place || b.score - a.score || (a.uid < b.uid ? -1 : 1));
  rows.forEach(row => { row.rank = row.place; });
  return rows;
}

export const aliveOf = game => Object.keys(game.participants || {}).filter(u => !(game.out && game.out[u]));

/** Rough match length for the lobby. */
export function estimateMinutes(settings, songMinutes = 3.2) {
  return cleanSettings(settings).mode === 'rush' ? Math.round(songMinutes + 1) : 5;
}

/** Names for the big clears (announcements + results). */
export const CLEAR_NAME = {
  single: 'SINGLE', double: 'DOUBLE', triple: 'TRIPLE', quad: '4-LINE CLEAR',
  twist: 'TWIST', tsingle: 'TWIST SINGLE', tdouble: 'TWIST DOUBLE', ttriple: 'TWIST TRIPLE',
  mini: 'MINI TWIST', msingle: 'MINI TWIST SINGLE', mdouble: 'MINI TWIST DOUBLE', pc: 'PERFECT CLEAR',
};
