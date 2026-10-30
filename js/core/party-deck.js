// CITY 2.0 — THE PARTY DECK ON THE SERVER CLOCK (NIGHT-C Group 1; the owner, Oct 30 12:36 am — DECIDED: "the same party song on every
// phone"). PURE (tests/party-deck.test.mjs). On a party night the City 2.0 PARTY deck (data/mood-music.json city2.moods.party) plays as ONE
// timeline every phone computes the same way: seeded shuffle cycles (every song once a cycle, never the same twice in a row), back to back
// with the music's crossfade (core/playlist.js#XF_MS), from an ANCHOR — the evening's 8 pm (THE CITY TIMETABLE's party.songs) on a real
// party night, the force moment for &force=dance, a fixed epoch for the panel's PARTY. The times are ABSOLUTE instants (s), so on a live
// phone the music (audio/party-music.js, on serverNow()) and the city (its clock on serverNow() too) agree on every phone; a phone joining
// mid-song lands at the right place. THE DANCE BREAKS (core/harbor-streetparty.js) start ON one of these songs — one song = one break.
//
// A cycle always plays every song once, so its length C = Σ (dur − XF) is the same for every cycle: the song at any time is found in O(n),
// whatever the anchor (the epoch's deck is ~10⁵ cycles in).
import { rngFrom, shuffle } from './rng.js';
import { XF_MS } from './playlist.js';

export const XF_S = XF_MS / 1000;
export const EPOCH_ANCHOR = 0;      // the panel's PARTY (no evening): a deck running since 1970 — every phone the same

/** the deck from the song list (moodData()): { ids (sorted), dur: { id: s }, bpm: { id: bpm }, sig } — null when there's none */
export function deckSpec(data, mood = 'party') {
  const ids = data && data.city2 && data.city2.moods && data.city2.moods[mood];
  if (!ids || !ids.length || !data.songs) return null;
  const list = [...ids].filter(id => data.songs[id] && data.songs[id].dur > XF_S + 1).sort();
  if (!list.length) return null;
  const dur = {}, bpm = {};
  for (const id of list) { dur[id] = Math.round(data.songs[id].dur * 1000) / 1000; bpm[id] = data.songs[id].bpm || 0; }
  return { ids: list, dur, bpm, sig: `${list.length}:${list.map(id => Math.round(dur[id])).join('.')}` };
}

/** cycle c's order (seeded): a shuffle, the first two swapped when it would start with the song the cycle before ended on (n > 2: the
 *  swap never moves a cycle's LAST song, so the rule needs no recursion) */
export function deckOrder(seed, c, ids) {
  const plain = k => shuffle(rngFrom(`${seed}:pc:${k}`), ids.slice());
  const o = plain(c);
  if (ids.length > 2) { const prev = plain(c - 1); if (o[0] === prev[prev.length - 1]) [o[0], o[1]] = [o[1], o[0]]; }
  else if (ids.length === 2) return c % 2 ? ids.slice().reverse() : ids.slice();
  return o;
}
/** a cycle's length (s): every song once, each next one starting XF before the last ends */
export const cycleLen = deck => deck.ids.reduce((s, id) => s + deck.dur[id] - XF_S, 0);

/** the songs of cycle c: [{ k (the song's number from the anchor), c, id, t0 (its start), t1 (the next song's start = the break's end),
 *  end (its last sample), dur, bpm }] */
export function cycleSongs(deck, anchor, seed, c) {
  const C = cycleLen(deck), o = deckOrder(seed, c, deck.ids), out = [];
  let t = anchor + c * C;
  o.forEach((id, j) => { const d = deck.dur[id]; out.push({ k: c * o.length + j, c, id, t0: t, t1: t + d - XF_S, end: t + d, dur: d, bpm: deck.bpm[id] || 0 }); t += d - XF_S; });
  return out;
}
/** the cycle t falls in (t before the anchor → cycle 0's start is still ahead: −1) */
export const cycleAt = (deck, anchor, t) => Math.floor((t - anchor) / cycleLen(deck));

/** every song overlapping [a, b] (abs s), in order */
export function deckSongs(deck, anchor, seed, a, b) {
  if (!deck) return [];
  const c0 = cycleAt(deck, anchor, a), c1 = cycleAt(deck, anchor, b), out = [];
  for (let c = Math.max(0, c0 - 1); c <= Math.max(0, c1); c++) for (const s of cycleSongs(deck, anchor, seed, c)) if (s.end > a && s.t0 < b) out.push(s);
  return out;
}
/** the song sounding at t (the one whose turn it is: t0 ≤ t < t1) or null before the anchor */
export function deckSongAt(deck, anchor, seed, t) {
  if (!deck || t < anchor) return null;
  return cycleSongs(deck, anchor, seed, cycleAt(deck, anchor, t)).find(s => t >= s.t0 && t < s.t1) || null;
}

/**
 * THE PLAYER's WINDOW (audio/party-music.js → audio/synced-songs.js): a BLOCK of WINDOW_CYCLES + 1 cycles as a synced-songs "game" in the
 * CITY's ms — { id (stable while the block holds: a new id restarts the voices), songs, sd (ms), startMs, list }. A party night is ~12
 * cycles (8 pm → 2:36 am), so it never moves in an evening; the panel's epoch deck moves on every ~14 h, once the last block's crossfade
 * is over (t − XF − 1 s) — a moving window never cuts a sounding song.
 */
export const WINDOW_CYCLES = 24;
let winMemo = null;   // (the last window — asked 4× a second, it changes ~never)
export function deckWindow(deck, anchor, seed, t) {
  if (!deck) return null;
  const c = Math.max(0, cycleAt(deck, anchor, t - XF_S - 1)), b = Math.floor(c / WINDOW_CYCLES) * WINDOW_CYCLES, id = `${seed}|${anchor}|c${b}`;
  if (winMemo && winMemo.id === id && winMemo.sig === deck.sig) return winMemo;
  const songs = [];
  for (let k = b; k <= b + WINDOW_CYCLES; k++) songs.push(...cycleSongs(deck, anchor, seed, k));
  winMemo = { id, sig: deck.sig, songs: songs.map(s => s.id), sd: songs.map(s => Math.round(s.dur * 1000)), startMs: songs[0].t0 * 1000, list: songs };
  return winMemo;
}
