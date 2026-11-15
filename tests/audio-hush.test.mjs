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

// CITY D — THE LEAVING SQUEAL WITH EFFECTS ON: the earliest leave signal → the master to 0 AT ONCE (no ramp), every bed / loop stopped, then
// the suspend; back on screen the master ramps up from 0 and the beds ramp back in. The browser proof: tests/integration/audio-leave.mjs.
test('leaving: the master to 0 at once (setValueAtTime, no ramp) + the beds stopped, the suspend after; a touch phone\'s blur is the first signal', () => {
  const E = readFileSync('js/audio/engine.js', 'utf8');
  assert.match(E, /function fadeOut\(why\) \{[\s\S]{0,200}pauseBeds\(why\);[\s\S]{0,200}silence\(c\);[\s\S]{0,300}c\.suspend\(\)/, 'the beds, the silence, then the suspend');
  assert.match(E, /function silence\(c\) \{ try \{ const t = c\.currentTime, g = master\.gain; g\.cancelScheduledValues\(t\); g\.setValueAtTime\(0, t\); \}/, 'no ramp on leaving');
  assert.doesNotMatch(E.slice(E.indexOf('function fadeOut'), E.indexOf('function silence')), /linearRampToValueAtTime\(0/, 'no ramp to 0 in the leave');
  assert.match(E, /SUSPEND_AFTER_MS = 60/);
  assert.match(E, /window\.addEventListener\('blur', \(\) => \{ audioLog\('blur'\); onBlur\(\); \}\);/);
  assert.match(E, /const coarse = \(\) => \{ try \{ return matchMedia\('\(pointer: coarse\)'\)\.matches;/, 'a desktop\'s blur is not a leave');
  assert.match(E, /function fadeIn\(why\) \{[\s\S]{0,300}linearRampToValueAtTime\(1, t \+ FADE_IN_S\);[\s\S]{0,60}resumeBeds\(\);/, 'back: the master from 0 + the beds back in');
  assert.match(E, /globalThis\.__nsAudioBeds = holdBed;/, 'the hub for a lazy chunk (THE STALE-MODULE RULE)');
});

test('every LOOPING source in the shipped code is a bed (engine.js#holdBed)', () => {
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (f.endsWith('.js')) files.push(f); } };
  walk('js');
  const FROZEN = /js\/games\/(pulse|golf|slip|gridlock|agent|stakes|rum)\//;
  const loose = [];
  for (const f0 of files) {
    const f = f0.split(String.fromCharCode(92)).join('/');
    if (FROZEN.test(f)) continue;
    const src = readFileSync(f, 'utf8');
    if (!/\.loop = true/.test(src)) continue;
    // (a finite thunder roll — started with its own duration — is not a bed)
    const lines = src.split('\n').filter(l => /\.loop = true/.test(l) && !/s\.start\(at, Math\.random\(\) \* 3, rise \+ fall/.test(src.slice(src.indexOf(l), src.indexOf(l) + 900)));
    if (lines.length && !/__nsAudioBeds/.test(src)) loose.push(f.split(String.fromCharCode(92)).join('/'));
  }
  assert.deepEqual(loose, [], 'a loop that leaving the page would leave running');
});
