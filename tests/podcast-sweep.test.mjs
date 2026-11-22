// CITY PART 1 — SILENT WITH MUSIC OFF, THE SWEEP (the inbox, Nov 19 9:10 am — HIGH RISE S2 FIX's find, widened): with the site's MUSIC OFF
// (PODCAST MODE, CITY I) the shared engine SUSPENDS the context between effects and a source's own start wakes it (engine.js#wakeFor). An
// effect player that asked `ctx.state === 'running'` was therefore silent with the music off — 13 such gates on origin/main (HOLD'EM, the
// JAYWALK flyers, OVERCLOCK ×3, PRISM DROP, the dailies ×2, progress, the room, THE BOARD). The rule: AN EFFECT ASKS isUnlocked(), never
// the context's state (docs/audio.md "PODCAST MODE"). THE GUARD: every `state === / !== 'running'` in js/ lives in a MUSIC / CLOCK file
// (the songs, the beat, the tape stop, the diagnostic, the engine itself) or on a line that names itself a music gate — a new hit fails.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FROZEN_IDS } from '../js/config.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const JS = join(ROOT, 'js');
// the MUSIC / CLOCK files — their gates read the song's clock or the music, never start an effect (each named in docs/audio.md)
const ALLOW = new Set([
  'js/audio/engine.js',        // the engine itself: its own state machine (isUnlocked / canStart / the nap / the cut)
  'js/audio/music.js',         // the music's own "is it playing" (an <audio> element through the graph)
  'js/audio/beat.js',          // THE BEAT: the song's clock
  'js/audio/synced-songs.js',  // the synced songs' clock (PRISM DROP / the city's party music)
  'js/audio/tape-stop.js',     // the tape stop: a MUSIC effect on the song's own voice
  'js/audio/diag.js',          // THE AUDIO DIAGNOSTIC: reads the state, plays nothing
  'js/games/pulse/clock.js',   // a frozen game's clock (kept)
]);
const RUNNING = /\.state\s*(?:!==|===|!=|==)\s*'running'|'running'\s*(?:!==|===)\s*[\w.]*state/;
const frozenDirs = FROZEN_IDS.map(id => `js/games/${id}/`);

function* walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p); else if (p.endsWith('.js')) yield p;
  }
}

test('THE GUARD: no effect player gates on the context being "running" — only the music / clock files (or a line that names itself a music gate)', () => {
  const hits = [];
  for (const f of walk(JS)) {
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    if (ALLOW.has(rel) || frozenDirs.some(d => rel.startsWith(d))) continue;
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => { if (RUNNING.test(line) && !/a MUSIC gate/.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`); });
  }
  assert.deepEqual(hits, [], `an effect must ask isUnlocked() (THE ONE GATE — engine.js), never ctx.state:\n${hits.join('\n')}`);
});

test('the 13 swept gates ask isUnlocked() (each file imports it from the engine)', () => {
  for (const f of ['js/games/holdem/sfx.js', 'js/games/jaywalk/flyers.js', 'js/games/overclock/sfx.js', 'js/games/prism/audio.js', 'js/daily/sfx.js', 'js/audio/progress-sfx.js', 'js/audio/lobby-sfx.js', 'js/board/audio.js', 'js/games/jaywalk/sfx.js', 'js/games/highrise/sfx.js']) {
    const s = readFileSync(join(ROOT, f), 'utf8');
    assert.match(s, /import \{[^}]*\bisUnlocked\b[^}]*\} from '[./]*\/?(?:\.\.\/)*(?:audio\/)?engine\.js'/, `${f} imports isUnlocked from the engine`);
    assert.match(s, /isUnlocked\(\)/, `${f} asks isUnlocked()`);
  }
});

test('the engine: isUnlocked() is THE ONE GATE (HEAR THE HARBOR — the nap retired; a future idle rule changes this one line, never a game\'s gate)', () => {
  const e = readFileSync(join(ROOT, 'js/audio/engine.js'), 'utf8');
  assert.match(e, /export const isUnlocked = \(\) => unlocked && !!ctx && ctx\.state === 'running';/);
  assert.doesNotMatch(e, /napSoon|wakeFor|podCheck/, 'no nap machinery left');
});
