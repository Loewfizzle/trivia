// CITY A — item 29, THE LEAVING SQUEAL: while MUTED (or the music AND the effects off) NOTHING in the audio machinery runs — the master ramped
// to 0, the context suspended, every element paused, the direct path's src released, no silent activation loop; UNMUTE is a tap (resume +
// re-activate inside it, the master up from 0). And ONLY the master reaches ctx.destination (every probe / analyser / blip rides it).
// The browser proof: tests/integration/audio-hush.mjs (the graph recorded from the first line, muted → leave → back → unmute → leave).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { hushWanted } from '../js/audio/engine.js';

test('the hush: muted, or the music AND the effects off — never the music off alone (the effects still play)', () => {
  assert.equal(hushWanted({ muted: true }), true);
  assert.equal(hushWanted({ musicOff: true, sfxOff: true }), true);
  assert.equal(hushWanted({ musicOff: true, sfxOff: false }), false);
  assert.equal(hushWanted({}), false);
});

test('hushed: a tap never resumes / blips / rebuilds; the context suspended after the master\'s ramp; music.js pauses + releases, activates nothing', () => {
  const E = readFileSync('js/audio/engine.js', 'utf8'), M = readFileSync('js/audio/music.js', 'utf8');
  assert.match(E, /if \(hushed \|\| hushWanted\(\)\) \{[\s\S]{0,600}gestureListeners\.forEach[\s\S]{0,120}return;\s*\}/, 'unlock while hushed: listeners only');
  assert.match(E, /g\.linearRampToValueAtTime\(0, t \+ FADE_OUT_S\);[\s\S]{0,40}\} catch \{ \/\* closed \*\/ \}\s*hushT = setTimeout\(\(\) => \{ hushT = 0; if \(ctx === c && hushed && c\.state === 'running'\) c\.suspend\(\)/, 'the ramp first, the suspend after');
  assert.match(E, /function kick\(\) \{\s*if \(!ctx \|\| !unlocked \|\| hushed/);
  assert.match(M, /function activate\(voice\) \{\s*if \(audioHushed\(\)\) \{ voice\.needAct = true; return; \}/, 'no silent activation loop while hushed');
  assert.match(M, /if \(!visible \|\| audioHushed\(\)\) return;/, 'apply() starts nothing while hushed');
  assert.match(M, /onHush\(on => \{[\s\S]{0,900}x\.el\.removeAttribute\('src'\)/, 'the elements released');
});

test('ONLY the master reaches ctx.destination — every analyser / probe / blip in the shipped code rides it (a bus fallback aside)', () => {
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (f.endsWith('.js')) files.push(f); } };
  walk('js');
  const bad = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const [i, line] of src.split('\n').entries()) {
      if (!/\.connect\(\s*ctx\.destination\s*\)/.test(line) && !/\.connect\(\s*[a-z]+\.destination\s*\)/i.test(line)) continue;
      if (/master\.connect\(ctx\.destination\)/.test(line)) continue;   // (the one: engine.js#createContext)
      bad.push(`${f.replace(/\\/g, '/')}:${i + 1}`);
    }
  }
  assert.deepEqual(bad, [], 'a node wired straight to the destination');
});
