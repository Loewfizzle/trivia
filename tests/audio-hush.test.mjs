// CITY A — item 29, THE LEAVING SQUEAL: while MUTED (or the music AND the effects off) NOTHING in the audio machinery runs — the master ramped
// to 0, the context suspended, every element paused, the direct path's src released, no silent activation loop; UNMUTE is a tap (resume +
// re-activate inside it, the master up from 0). And ONLY the master reaches ctx.destination (every probe / analyser / blip rides it).
// The browser proof: tests/integration/audio-hush.mjs (the graph recorded from the first line, muted → leave → back → unmute → leave).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { hushWanted } from '../js/audio/engine.js';
import { FROZEN_IDS } from '../js/config.js';

test('the hush: muted, or the music AND the effects off — never the music off alone (the effects still play)', () => {
  assert.equal(hushWanted({ muted: true }), true);
  assert.equal(hushWanted({ musicOff: true, sfxOff: true }), true);
  assert.equal(hushWanted({ musicOff: true, sfxOff: false }), false);
  assert.equal(hushWanted({}), false);
});

test('hushed: a tap never resumes / blips / rebuilds; the context suspended after the master\'s ramp; music.js pauses + releases, activates nothing', () => {
  const E = readFileSync('js/audio/engine.js', 'utf8'), M = readFileSync('js/audio/music.js', 'utf8');
  assert.match(E, /if \(hushed \|\| hushWanted\(\)\) \{[\s\S]{0,600}gestureListeners\.forEach[\s\S]{0,120}return;\s*\}/, 'unlock while hushed: listeners only');
  assert.match(E, /g\.linearRampToValueAtTime\(0, t \+ FADE_OUT_S\);[\s\S]{0,40}\} catch \{ \/\* closed \*\/ \}[\s\S]{0,400}if \(master && master\.gain\.value > 1e-5\) \{ hushT = setTimeout\(go, 40\); return; \}[\s\S]{0,120}c\.suspend\(\)[\s\S]{0,200}hushT = setTimeout\(go, Math\.round\(FADE_OUT_S \* 1000\) \+ ZERO_HOLD_MS\);/, 'the ramp first, THE ZEROS FIRST, the suspend after (FIXES R2)');
  assert.match(E, /function kick\(\) \{\s*if \(!ctx \|\| !unlocked \|\| hushed/);
  assert.match(M, /function activate\(voice\) \{\s*if \(audioHushed\(\)( \|\| musicResting\(\))?\) \{ voice\.needAct = true; return; \}/, 'no silent activation loop while hushed (FIXES R3: + while resting)');
  assert.match(M, /if \(!visible \|\| audioHushed\(\)( \|\| musicResting\(\))?\) return;/, 'apply() starts nothing while hushed');
  assert.match(M, /function hushMusic\(on, why = 'hushed'\) \{[\s\S]{0,900}x\.el\.removeAttribute\('src'\)/, 'the elements released');
  assert.match(M, /onHush\(on => hushMusic\(on, 'hushed'\)\);/, 'the hush runs it (FIXES R3: one body for the hush + mode A\'s rest)');
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

// CITY D — THE LEAVING SQUEAL WITH EFFECTS ON → FIXES R2 — THE CUT IN ONE ORDER: the earliest leave signal → the master RAMPS to 0 over LEAVE_S
// (25 ms — a step is a click; CITY D's 90 ms was too long for a leave), the beds stopped once it is 0, the suspend after THE ZEROS FIRST; back
// on screen the master ramps up from 0 and the beds ramp back in. The browser proofs: tests/integration/audio-leave.mjs + audio-cut.mjs.
test('leaving: the master ramps to 0 (LEAVE_S), the beds after it, the suspend after the zeros; a touch phone\'s blur is the first signal', () => {
  const E = readFileSync('js/audio/engine.js', 'utf8');
  assert.match(E, /function fadeOut\(why\) \{[\s\S]{0,1200}quiet\(c, LEAVE_S\);[\s\S]{0,200}setTimeout\(\(\) => \{ if \(!visibleNow\) pauseBeds\(why\); \}, Math\.round\(LEAVE_S \* 1000\) \+ 10\);[\s\S]{0,200}c\.suspend\(\)[\s\S]{0,150}Math\.round\(LEAVE_S \* 1000\) \+ ZERO_HOLD_MS\);/, 'the ramp, the beds, the zeros, then the suspend');
  assert.match(E, /function quiet\(c, s\) \{ try \{ const t = c\.currentTime, g = master\.gain; const v = g\.value; g\.cancelScheduledValues\(t\); g\.setValueAtTime\(v, t\); g\.linearRampToValueAtTime\(0, t \+ s\); \}/, 'a ramp from where it is');
  assert.match(E, /const CUT_S = 0\.08, LEAVE_S = 0\.025, ZERO_HOLD_MS = 100;/);
  assert.match(E, /window\.addEventListener\('blur', \(\) => \{ audioLog\('blur'\); if \(coarse\(\)\) leaveNote\('blur', true\); onBlur\(\); \}\);/);   // (FIXES R3: the blur recorded first)
  assert.match(E, /const coarse = \(\) => \{ try \{ return matchMedia\('\(pointer: coarse\)'\)\.matches;/, 'a desktop\'s blur is not a leave');
  assert.match(E, /function fadeIn\(why\) \{[\s\S]{0,300}linearRampToValueAtTime\(1, t \+ FADE_IN_S\);[\s\S]{0,60}resumeBeds\(\);/, 'back: the master from 0 + the beds back in');
  assert.match(E, /globalThis\.__nsAudioBeds = holdBed;/, 'the hub for a lazy chunk (THE STALE-MODULE RULE)');
});

test('every LOOPING source in the shipped code is a bed (engine.js#holdBed)', () => {
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (f.endsWith('.js')) files.push(f); } };
  walk('js');
  const FROZEN = new RegExp(`js/games/(${FROZEN_IDS.join('|')})/`);   // (FIXES R2 — B1: config.js#FROZEN_IDS — it named only 7 of the 10)
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
