// NIGHT-C Group 1 — THE PARTY SONG IN SYNC: core/party-deck.js (the deck on the server clock) + the dance breaks on it
// (core/harbor-streetparty.js#partyTimeline / danceBreaks / forcedBreaks). PURE — no DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deckSpec, deckOrder, cycleLen, cycleSongs, deckSongs, deckSongAt, deckWindow, XF_S, EPOCH_ANCHOR, WINDOW_CYCLES } from '../js/core/party-deck.js';
import { danceBreaks, forcedBreaks, partyTimeline, eveningOf } from '../js/core/harbor-streetparty.js';
import { songStarts } from '../js/core/playlist.js';
import { knob } from '../js/core/harbor-schedule.js';

const DATA = JSON.parse(readFileSync(new URL('../data/mood-music.json', import.meta.url), 'utf8'));
const DECK = deckSpec(DATA);
const OFF = -240;                                         // Detroit, EDT (minutes)
const SAT = Date.UTC(2026, 9, 25, 1, 0) / 1000;           // Sat Oct 24, 9 pm EDT

test('the PARTY deck from the song list: every City 2.0 party song, its length + tempo; none without data', () => {
  assert.ok(DECK && DECK.ids.length === DATA.city2.moods.party.length, `${DECK && DECK.ids.length} songs`);
  for (const id of DECK.ids) { assert.ok(DECK.dur[id] > 60, id); assert.ok(DECK.bpm[id] > 0, id); }
  assert.equal(deckSpec(null), null); assert.equal(deckSpec({ songs: {}, city2: { moods: {} } }), null);
});

test('a cycle plays every song once, never the same song twice in a row across cycles (300 cycles), the same order on every phone', () => {
  let prev = null;
  for (let c = 0; c < 300; c++) {
    const o = deckOrder('s', c, DECK.ids);
    assert.deepEqual([...o].sort(), [...DECK.ids].sort(), `cycle ${c}: each song once`);
    if (prev) assert.notEqual(o[0], prev[prev.length - 1], `cycle ${c} starts on the song ${c - 1} ended on`);
    prev = o;
  }
  assert.deepEqual(deckOrder('s', 7, DECK.ids), deckOrder('s', 7, DECK.ids), 'seeded');
  assert.notDeepEqual([0, 1, 2, 3].map(c => deckOrder('a', c, DECK.ids)), [0, 1, 2, 3].map(c => deckOrder('b', c, DECK.ids)), 'another seed, another order');
});

test('the timeline: back to back with the music\'s crossfade (each next song starts XF before the last ends), found at any time in O(n) — even the epoch\'s deck', () => {
  const A = 1000, songs = deckSongs(DECK, A, 'x', A, A + 3 * cycleLen(DECK));
  for (let i = 1; i < songs.length; i++) {
    assert.ok(Math.abs(songs[i].t0 - songs[i - 1].t1) < 1e-6, 'the next starts where the last hands over');
    assert.ok(Math.abs(songs[i - 1].end - songs[i - 1].t1 - XF_S) < 1e-6, 'a crossfade XF long');
    assert.equal(songs[i].k, songs[i - 1].k + 1);
  }
  for (const t of [A + 1, A + 500.5, A + 2 * cycleLen(DECK) + 3]) { const s = deckSongAt(DECK, A, 'x', t); assert.ok(s && t >= s.t0 && t < s.t1, `the song at ${t}`); }
  assert.equal(deckSongAt(DECK, A, 'x', A - 1), null, 'nothing before the anchor');
  const t0 = performance.now(), s = deckSongAt(DECK, EPOCH_ANCHOR, 'P|1924', SAT); const ms = performance.now() - t0;
  assert.ok(s && SAT >= s.t0 && SAT < s.t1 && ms < 20, `the epoch's deck at 2026 (${ms.toFixed(2)} ms)`);
});

test('THE PLAYER\'s WINDOW = the timeline to the millisecond (synced-songs\' own songStarts), stable through a whole party night', () => {
  const ev = eveningOf(SAT, OFF), A = ev.day0 + knob('party.songs').from * 3600, seed = `1924|${ev.key}`;
  const w = deckWindow(DECK, A, seed, A + 60), starts = songStarts({ songStartAt: w.startMs, songs: w.songs, sd: w.sd });
  w.list.forEach((s, i) => assert.ok(Math.abs(starts[i] - s.t0 * 1000) < 1.5, `song ${i}: ${starts[i]} vs ${s.t0 * 1000}`));
  assert.equal(w.list.length, (WINDOW_CYCLES + 1) * DECK.ids.length);
  for (let h = 20.05; h < 26.6; h += 0.25) assert.equal(deckWindow(DECK, A, seed, ev.day0 + h * 3600).id, w.id, `the same window at ${h.toFixed(2)} h — the player never restarts in an evening`);
});

test('THE TIMELINE the music + the breaks share: a party night\'s deck from its 8 pm (seeded by the evening), the panel\'s PARTY the epoch\'s, &force=dance its own from the force', () => {
  const ev = eveningOf(SAT, OFF);
  const n = partyTimeline(SAT, { off: OFF, seed: 1924 });
  assert.equal(n.kind, 'night'); assert.equal(n.anchor, ev.day0 + 20 * 3600); assert.equal(n.seed, `1924|${ev.key}`);
  assert.equal(partyTimeline(SAT - 2 * 86400, { off: OFF, seed: 1924 }), null, 'a Thursday: no party timeline');
  assert.equal(partyTimeline(SAT - 2 * 86400, { off: OFF, seed: 1924, partyForced: true }).kind, 'party');
  const d = partyTimeline(SAT, { off: OFF, seed: 1924, forceDanceAt: 5000 });
  assert.equal(d.kind, 'dance'); assert.equal(d.anchor, 5000 + knob('party.break.force').first);
  assert.equal(partyTimeline(SAT, { off: OFF, seed: 1924, forceDanceAt: 5000, noDance: true }).kind, 'night', '&force=no-dance wins');
});

test('THE DANCE BREAKS ON THE HEARD SONG: every break starts on a deck song\'s start + lasts exactly that song (the one every phone plays), the same on every phone', () => {
  const ev = eveningOf(SAT, OFF), tl = partyTimeline(SAT, { off: OFF, seed: 1924 }), B = knob('party.break');
  const br = danceBreaks(ev.day0, ev.key, { off: OFF, seed: 1924, deck: DECK });
  assert.ok(br.length >= 10, `${br.length} breaks`);
  for (const b of br) {
    const s = deckSongAt(DECK, tl.anchor, tl.seed, b.s0 + 0.01);
    assert.ok(s && Math.abs(s.t0 - b.s0) < 1e-6 && Math.abs(s.t1 - b.s1) < 1e-6 && s.id === b.song, `${b.id}: on ${b.song} (${s && s.id})`);
    assert.ok(b.s0 >= ev.day0 + (B.from - 0.1) * 3600 && b.s1 <= ev.day0 + (B.to + 0.3) * 3600, 'inside the break hours');
    assert.equal(b.fast, DECK.bpm[b.song] >= knob('party.songs').fastBpm, 'fast = the song\'s own tempo');
  }
  for (let i = 1; i < br.length; i++) { assert.ok(br[i].s0 - br[i - 1].s0 >= B.minGap_min * 60, 'never too close'); assert.notEqual(br[i].kind, br[i - 1].kind, 'never the same kind twice'); }
  assert.deepEqual(danceBreaks(ev.day0, ev.key, { off: OFF, seed: 1924, deck: DECK }), br, 'every phone the same');
  assert.deepEqual(danceBreaks(ev.day0, ev.key, { off: OFF, seed: 1924, deck: DECK, blocked: () => true }), [], 'none while blocked');
});

test('&force=dance on the deck: the first break on its first song (`first` s after the force), then one on the first song starting each `every` s — one song each, never twice', () => {
  const F = knob('party.break.force'), at = 1_800_000_000, fb = forcedBreaks(at, at, at + 3600, { deck: DECK, seed: 1924 });
  assert.ok(Math.abs(fb[0].s0 - (at + F.first)) < 1e-6, 'the first starts `first` s after the force');
  const tl = partyTimeline(at, { forceDanceAt: at, seed: 1924 });
  for (const b of fb) { const s = deckSongAt(DECK, tl.anchor, tl.seed, b.s0 + 0.01); assert.ok(s && Math.abs(s.t0 - b.s0) < 1e-6 && s.id === b.song, b.id); }
  for (let i = 1; i < fb.length; i++) { assert.ok(fb[i].s0 >= fb[i - 1].s1 - 1e-6, 'one at a time'); assert.ok(fb[i].s0 - fb[i - 1].s0 >= F.every - 1e-6 || i === 0); }
  assert.ok(forcedBreaks(at, at, at + 3600, { deck: DECK, danceKind: 'swing' }).every(b => b.kind === 'swing'));
});
