// JAYWALK SOUNDS WITH THE SITE's MUSIC OFF (PODCAST MODE, CITY I — docs/audio.md): the shared engine SUSPENDS the audio context between
// effects ("napping") and a source's own start wakes it (engine.js#wakeFor) — engine.js#isUnlocked() counts a nap. A game's sound gate
// that also asks for `ctx.state === 'running'` refuses every sound in that mode: JAYWALK was SILENT with music off (found by HIGH RISE
// S2's fresh-eyes review, fixed in HIGH RISE S2 FIX). The browser's proof: tests/integration/jaywalk-podcast.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('JAYWALK: a sound starts on a NAPPING audio context (music off) — its gate asks the engine (isUnlocked), never for a running context', () => {
  const s = read('js/games/jaywalk/sfx.js');
  assert.ok(s.includes('if (!isUnlocked() || !ctx || !bufs.get(key) || bufCtx !== ctx) {'), 'the play gate: unlocked (running or napping) + decoded');
  const code = s.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(code, /ctx\.state\s*!==\s*'running'/, 'no "running only" gate in JAYWALK\'s sounds');
  const e = read('js/audio/engine.js');
  assert.match(e, /export const isUnlocked = \(\) => unlocked && !!ctx && \(ctx\.state === 'running' \|\| \(napping && ctx\.state === 'suspended'\)\);/, 'the engine: a podcast-mode nap counts as unlocked');
  // (HIGH RISE keeps the same rule — its own test pins it too)
  assert.doesNotMatch(read('js/games/highrise/sfx.js'), /ctx\.state !== 'running'/);
});
