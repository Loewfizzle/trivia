// PFIX-3 — S13 (FABLE REVIEW 2): THE PITCHED SKIN SOUNDS ARE KEYED TO THE SONG (js/games/prism/sfx-key.js — PURE; audio.js plays by it).
//   a single note (pixel's blip = G · galaxy's chime = C) → the song's ROOT or FIFTH, whichever is nearer — never more than 3 semitones
//   a chord (galaxy's stardust shimmer = C major-seventh) → a degree where the WHOLE chord is in the song's scale
//   a pitched lock's wander stays inside ±20 cents (the old random ±3 % was ±51)        every song of both sets is checked from its own file
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { keyShift, pitchedLockRate, LOCK_WANDER_CENTS, KEY_TARGETS } from '../js/games/prism/sfx-key.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const SONGS = readdirSync(new URL('../data/prism/', import.meta.url)).filter(f => /^prism.*\.json$/.test(f)).map(f => ({ id: f.replace('.json', ''), ...JSON.parse(read(`data/prism/${f}`)) })).filter(s => Number.isInteger(s.tonic));
const SCALE = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const inKey = (pc, s) => SCALE[s.mode === 'major' ? 'major' : 'minor'].includes(((pc - s.tonic) % 12 + 12) % 12);
const cents = rate => 1200 * Math.log2(rate);

test('THE PER-SONG KEY TABLE: every song of both sets names its key (tonic 0 … 11 + mode) — the table the code-made sounds already follow', () => {
  assert.ok(SONGS.length >= 10, `${SONGS.length} songs`);
  for (const s of SONGS) { assert.ok(s.tonic >= 0 && s.tonic <= 11, s.id); assert.ok(s.mode === 'major' || s.mode === 'minor', s.id); }
  assert.ok(SONGS.some(s => s.id.startsWith('prismd')) && SONGS.some(s => !s.id.startsWith('prismd')), 'the night set + the day set');
});

test('A SINGLE NOTE lands on the song\'s ROOT or FIFTH — the nearer one, at most 3 semitones away; a tie goes to the root', () => {
  for (let pc = 0; pc < 12; pc++) for (let t = 0; t < 12; t++) for (const mode of ['major', 'minor']) {
    const k = keyShift(pc, t, mode);
    assert.ok(Math.abs(k.shift) <= 3, `${pc} in ${t}: ${k.shift}`);
    assert.ok(k.to === t || k.to === (t + 7) % 12, 'the root or the fifth');
    assert.equal((pc + k.shift + 120) % 12, k.to);
    assert.ok(Math.abs(k.rate - 2 ** (k.shift / 12)) < 1e-12);
  }
  assert.deepEqual(keyShift(7, 0), { shift: 0, to: 7, rate: 1 }, 'pixel\'s G on a song in C: its fifth — as recorded');
  assert.equal(keyShift(0, 2, 'major').shift, 2, 'galaxy\'s C under the D-major night song: up a tone to D (it clashed with the song\'s C#)');
  assert.equal(keyShift(7, 1, 'minor').to, 8, 'pixel\'s G on the C#-minor day song: G# — its fifth');
  // every real song: the two locks land IN the song's scale (they clashed on three of the five day songs)
  for (const s of SONGS) for (const [name, pc] of [['pixel-lock (G)', 7], ['galaxy-lock (C)', 0]]) {
    const k = keyShift(pc, s.tonic, s.mode);
    assert.ok(inKey(k.to, s), `${name} on ${s.id}: lands on ${k.to}`);
  }
});

test('A CHORD (galaxy\'s stardust: C–E–G–B) lands where ALL its notes are in the song\'s scale — every song of both sets', () => {
  assert.deepEqual(KEY_TARGETS.maj7, { major: [0, 5], minor: [3, 8] });
  for (const s of SONGS) {
    const k = keyShift({ pc: 0, chord: 'maj7' }, s.tonic, s.mode);
    assert.ok(Math.abs(k.shift) <= 3, `${s.id}: ${k.shift}`);
    for (const iv of [0, 4, 7, 11]) assert.ok(inKey(k.to + iv, s), `${s.id}: the chord's note +${iv} on ${k.to} is in key`);
  }
  for (let t = 0; t < 12; t++) for (const mode of ['major', 'minor']) assert.ok(Math.abs(keyShift({ pc: 0, chord: 'maj7' }, t, mode).shift) <= 3);
  // a note placed as a note on a minor root would NOT do for the chord (its third + seventh fall out) — why the chord has its own degrees
  const em = { tonic: 4, mode: 'minor' }, asNote = keyShift(0, 4, 'minor');
  assert.ok([0, 4, 7, 11].some(iv => !inKey(asNote.to + iv, em)));
});

test('A PITCHED LOCK\'s wander stays inside ±20 cents of its note (the old random ±3 % was ±51 cents)', () => {
  assert.equal(LOCK_WANDER_CENTS, 20);
  for (const r of [0, 0.1, 0.5, 0.9, 1]) for (const [pc, t, m] of [[7, 0, 'major'], [0, 2, 'major'], [7, 1, 'minor']]) {
    const off = cents(pitchedLockRate(pc, t, m, r) / keyShift(pc, t, m).rate);
    assert.ok(Math.abs(off) <= LOCK_WANDER_CENTS + 1e-9, `${off.toFixed(1)} cents`);
  }
  assert.ok(Math.abs(cents(pitchedLockRate(7, 0, 'major', 0.5))) < 1e-9, 'the middle of the wander = the note itself');
  assert.ok(Math.abs(cents(1.03)) > 50, 'the old ±3 %');
});

test('the skins name their pitched files; the synth plays by it — an unpitched file as before, the levels untouched', () => {
  const sk = read('js/games/prism/skins.js');
  assert.match(sk, /files: \{ lock: 'pixel-lock', clear: 'pixel-clear' \}, pitch: \{ lock: 7 \} \}/, 'pixel: the blip is a G; the sting (a chromatic sweep) has no note');
  assert.match(sk, /files: \{ lock: 'galaxy-lock', clear: 'galaxy-clear' \}, pitch: \{ lock: 0, clear: \{ pc: 0, chord: 'maj7' \} \} \}/);
  assert.match(sk, /files: \{ lock: 'watercolor-lock', clear: 'watercolor-clear' \} \}/, 'watercolor: no clear note — as recorded');
  assert.match(sk, /files: \{ lock: 'paper-lock', clear: 'paper-clear' \} \}/, 'paper: noise — as recorded');
  const a = read('js/games/prism/audio.js');
  assert.match(a, /const lockRate = \(\) => \(pitch\.lock != null \? pitchedLockRate\(pitch\.lock, tonic, mode, Math\.random\(\)\) : 1 \+ \(Math\.random\(\) \* 2 - 1\) \* LOCK_PITCH\);/);
  assert.match(a, /const clearRate = \(\) => \(pitch\.clear != null \? keyShift\(pitch\.clear, tonic, mode\)\.rate : 1\);/);
  assert.match(a, /if \(b\) playBuf\(b, q\.at, SAMPLE_GAIN\.dust\(lines\), 0\.3, crate\);/); assert.match(a, /if \(b\) playBuf\(b, q\.at, SAMPLE_GAIN\.chip\(lines\), 0, crate\);/);
  assert.match(a, /pitch = \(v && v\.pitch\) \|\| \{\};/, 'set with the skin\'s voices');
  assert.match(a, /blip: \(\) => 0\.076, chime: \(\) => 0\.1,/, 'the levels are the same numbers');
});
