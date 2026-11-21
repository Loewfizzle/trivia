// JAYWALK J2 — THE SOUND RULE (js/games/jaywalk/runway-sound.js — docs/jaywalk.md "THE SOUND RULE"): the crackle only for a runway within ~3
// lanes ahead of YOUR kid, ONCE per visit, ≥ 8 s apart, the three takes in rotation (never the same twice running); its later tells a soft
// tick at most; every pass faded by its distance (silent off-screen); wired through flyers.js (the trail's fire flicker, the levels in THE
// MIX, every file through the shared engine).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRunwayEars, distGain, RS } from '../js/games/jaywalk/runway-sound.js';

/** a frame: the runway drawn, the kid at `lane` */
const frame = (E, now, lane, rws = [[100, 4]]) => { for (const [y0, n] of rws) E.see(y0, n); E.frame(now, lane + 0.5); };

test('THE CRACKLE: only once a runway is within 3 lanes ahead (or under him) — ONCE per visit; its later tells tick; a far runway says nothing', () => {
  const E = createRunwayEars();
  frame(E, 0, 90); assert.equal(E.tell(100, 10), '', '10 lanes short: nothing (its jet still screams at its distance)');
  frame(E, 100, 96); assert.equal(E.tell(100, 110), '', '4 lanes short: still nothing');
  frame(E, 200, 97); assert.equal(E.state().visit.y0, 100, '3 lanes short: the visit begins');
  assert.equal(E.tell(100, 210), 'crackle'); assert.equal(E.take(), RS.takes[0]);
  for (let k = 1; k < 6; k++) { frame(E, 210 + k * 400, 99); assert.equal(E.tell(100, 210 + k * 400), 'tick', 'waiting at it: a soft tick, never the crackle again'); }
  frame(E, 3000, 101); assert.equal(E.tell(100, 3000), 'tick', 'on it: a tick');
  assert.equal(E.tell(140, 3000), '', 'another runway\'s tell: nothing');
});

test('THE COOLDOWN + THE ROTATION: a new visit within 8 s ticks instead; the takes rotate 1 → 2 → 3 → 1, never the same twice running', () => {
  const E = createRunwayEars(), takes = [];
  let now = 0;
  const visit = (y0, at) => { frame(E, at, y0 - 2, [[y0, 3]]); const w = E.tell(y0, at); if (w === 'crackle') takes.push(E.take()); frame(E, at + 50, y0 + 5, [[y0, 3]]); return w; };
  assert.equal(visit(100, now), 'crackle');
  assert.equal(visit(120, now += 4000), 'tick', 'a visit 4 s later: within the cooldown');
  assert.equal(visit(140, now += 4100), 'crackle', '8.1 s after the last crackle');
  assert.equal(visit(160, now += 8000), 'crackle');
  assert.equal(visit(180, now += 9000), 'crackle');
  assert.deepEqual(takes, ['radio-static_1', 'radio-static_2', 'radio-static_3', 'radio-static_1']);
  for (let i = 1; i < takes.length; i++) assert.notEqual(takes[i], takes[i - 1]);
  assert.equal(RS.coolMs, 8000); assert.equal(RS.reach, 3);
});

test('A VISIT ENDS when he is past the runway or backs well off — then the same runway is a new visit (cooldown allowing)', () => {
  const E = createRunwayEars();
  frame(E, 0, 98); assert.equal(E.tell(100, 0), 'crackle');
  frame(E, 1000, 104 + RS.leave); assert.equal(E.state().visit, null, 'past it');
  frame(E, 20000, 98); assert.equal(E.tell(100, 20000), 'crackle', 'back at it 20 s later: a new visit');
  E.reset(); assert.equal(E.state().visit, null);
});

test('THE DISTANCE: full next to him, × 0.75 a lane beyond, silent from 8 lanes or off-screen', () => {
  assert.equal(distGain(0), 1); assert.equal(distGain(1), 1); assert.equal(distGain(-1), 1);
  assert.equal(distGain(2), 0.75); assert.ok(Math.abs(distGain(3) - 0.5625) < 1e-9); assert.ok(distGain(5) < distGain(4));
  assert.equal(distGain(8), 0); assert.equal(distGain(30), 0); assert.equal(distGain(1, false), 0, 'off-screen');
  for (let d = 1; d < 8; d += 0.5) assert.ok(distGain(d + 0.5) <= distGain(d));
});

test('WIRED (flyers.js): the ears decide the crackle + the tick; every scream / boom / the trail\'s flicker × its distance; the four new files exist (mono MP3) + are credited', () => {
  const src = readFileSync(new URL('../js/games/jaywalk/flyers.js', import.meta.url), 'utf8');
  assert.match(src, /import \{ createRunwayEars, distGain \} from '\.\/runway-sound\.js';/);
  assert.match(src, /const w = ears\.tell\(y0, F\.clock\);/);
  assert.match(src, /if \(w === 'crackle'\) mix\(ears\.take\(\)\); else if \(w === 'tick'\) mix\('runway-tick'\);/);
  assert.match(src, /mix\('jet-scream', \{ at: [^}]*gain: MIX\['jet-scream'\]\.gain \* g \}\)/);
  assert.match(src, /mix\('sonic-boom', \{ pan: pan \* 0\.5, gain: MIX\['sonic-boom'\]\.gain \* g \}\)/);
  assert.match(src, /mix\('afterburner-flicker', \{[^}]*gain: MIX\['afterburner-flicker'\]\.gain \* g \}\)/);
  assert.doesNotMatch(src, /mix\('radio-static_1'\);/, 'the old crackle on EVERY tell is gone');
  const credits = readFileSync(new URL('../audio/jaywalk/CREDITS.md', import.meta.url), 'utf8');
  for (const f of ['radio-static-2', 'radio-static-3', 'runway-tick', 'afterburner-flicker']) {
    assert.ok(existsSync(new URL(`../audio/jaywalk/${f}.mp3`, import.meta.url)), f);
    assert.match(credits, new RegExp(`${f}\\.mp3`));
  }
  assert.match(credits, /"Big Branching Fire #1" by Joseph SARDIN \(BigSoundBank\), CC0 1\.0, edited for JAYWALK\. https:\/\/bigsoundbank\.com\/big-branching-fire-1-s0987\.html/);
});
