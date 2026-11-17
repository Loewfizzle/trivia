// JAYWALK H5A — THE SOUND CUES (docs/jaywalk.md "THE SOUNDS"): WHEN the world's sounds play — cues.js is PURE, so its limits are
// proven here on real runs through the real engine: the bell only while a near rail lane's signals flash + off by the pass, ONE
// train-pass a pass, the horn at most once every 3 s, the lights dying only when the blackout takes a lane near the kid; the table's
// PRIORITY; the player's caps + the pan + the music's duck. H5B (the owner, playing H5A): NO CAR-PASS anywhere (no cue, no sound, no
// file), THE HORN AT HALF its level, the train sounds FADE OUT (0.5 s — never a dead stop).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from '../js/games/jaywalk/tuning.js';
import { createCourse, pulseAt } from '../js/games/jaywalk/course.js';
import { createRun, step, isOver } from '../js/games/jaywalk/engine.js';
import { greedyBot } from '../js/games/jaywalk/bot.js';
import { existsSync } from 'node:fs';
import * as CUES from '../js/games/jaywalk/cues.js';
import { CUE, createCues, cuesAt, carClosing } from '../js/games/jaywalk/cues.js';
import { SOUNDS, VOICES, admit, TRAIN_DUCK, FADE_S } from '../js/games/jaywalk/sounds.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

/** a bot plays a run; every tick's cues are kept: [{ t, cue, pan, y }] (+ what the world was doing that tick, for the checks) */
function listen(seed, { from = 0, ticks = 5400, lazy = false, stand = null } = {}) {
  const course = createCourse(seed), run = createRun({ seed, mode: 'solo' }), bot = greedyBot({ seed, lazy }), S = createCues(), out = [];
  if (from) { run.y = from; run.best = from; run.wall = (from - 8) * T.FP; }
  let last = -9;
  for (let i = 0; i < ticks && !isOver(run); i++) {
    let d = stand && stand(run, course) ? '' : bot(run, course);
    if (d && run.t - last < 2) d = '';
    if (d) last = run.t;
    const ev = [];
    step(run, course, d, ev);
    if (isOver(run)) break;
    for (const q of cuesAt(S, run, course)) out.push({ t: run.t, y: run.y, wl: Math.floor(run.wall / T.FP), ...q, near: ev.some(e => e.e === 'near') });
  }
  return { out, run, course };
}
const nearRails = (course, y, t) => { const r = []; for (let i = Math.max(0, y - CUE.bellBehind); i <= y + CUE.bellAhead; i++) { const L = course.lane(i); if (L.type === 'rail') r.push(pulseAt(L.pulse, t).st); } return r; };

test('THE TRAIN: the bell is ON exactly while a rail lane near the kid is in its tell (its signals flash) and OFF by the pass; ONE train-pass a pass, panned to the side it comes from', () => {
  let on = 0, passes = 0;
  for (let s = 0; s < 30; s++) {
    // (THE RAIL YARD: lanes 150–199 — the bot dropped at its gateway)
    const seed = `bell${s}`, course = createCourse(seed), run = createRun({ seed, mode: 'solo' }), bot = greedyBot({ seed }), S = createCues();
    run.y = 150; run.best = 150; run.wall = 142 * T.FP;
    let bell = false, last = -9;
    const seen = new Set();
    for (let i = 0; i < 2400 && !isOver(run); i++) {
      let d = bot(run, course); if (d && run.t - last < 2) d = ''; if (d) last = run.t;
      const ev = []; step(run, course, d, ev);
      if (isOver(run)) break;
      for (const q of cuesAt(S, run, course)) {
        if (q.cue === 'bell-on') { assert.equal(bell, false, 'never two bells'); bell = true; on++; }
        if (q.cue === 'bell-off') { assert.equal(bell, true); bell = false; }
        if (q.cue === 'train-pass') {
          passes++;
          assert.ok(Math.abs(q.pan) === CUE.pan, 'panned to a side');
          const lanes = []; for (let l = run.y - CUE.bellBehind; l <= run.y + CUE.bellAhead; l++) { const L = course.lane(Math.max(0, l)); if (L.type === 'rail') { const st = pulseAt(L.pulse, run.t); if (st.st === 'pass' && st.s <= 2) lanes.push(`${l}:${st.k}:${L.pulse.dir}`); } }
          assert.ok(lanes.length >= 1, 'a train-pass = a near train\'s pass beginning this tick');
          const fresh = lanes.filter(k => !seen.has(k)); assert.ok(fresh.length >= 1, 'ONE train-pass a pass — never twice for the same train');
          for (const k of fresh) seen.add(k);
          assert.ok(lanes.some(k => -Number(k.split(':')[2]) * CUE.pan === q.pan), 'from the side the train enters');
        }
      }
      assert.equal(bell, nearRails(course, run.y, run.t).includes('tell'), `tick ${run.t}: the bell rings exactly while a near rail is in its tell`);
    }
  }
  assert.ok(on > 60 && passes > 60, `${on} bells, ${passes} passes heard over 30 runs through the rail yard`);
});

test('NO CAR-PASS (H5B — the owner: "it\'s terrible"): a near miss makes no cue; THE HORN: a car closing on a kid standing in its lane — at most ONE every 3 s, from its side', () => {
  let near = 0, horn = 0, lefts = 0, rights = 0;
  for (let s = 0; s < 40; s++) {
    // (DOWNTOWN, lanes 250–299: heavy traffic. The kid dawdles on the road now and then — a horn's moment)
    const { out } = listen(`car${s}`, { from: 250, ticks: 3000, stand: (run, course) => course.lane(run.y).type === 'road' && run.t % 400 < 60 });
    const H = out.filter(q => q.cue === 'horn');
    assert.equal(out.filter(q => q.cue === 'car-pass').length, 0, 'never a car-pass cue');
    for (const q of out) assert.ok(['bell-on', 'bell-off', 'train-pass', 'train-horn', 'horn', 'lights-die'].includes(q.cue), `an unknown cue: ${q.cue}`);
    near += out.filter(q => q.near).length;
    for (let i = 1; i < H.length; i++) assert.ok(H[i].t - H[i - 1].t >= 3 * T.TICK_HZ, `two horns ${H[i].t - H[i - 1].t} ticks apart`);
    for (const q of H) { assert.ok(Math.abs(q.pan) === CUE.pan, 'the horn comes from the car\'s side'); if (q.pan < 0) lefts++; else rights++; }
    horn += H.length;
  }
  assert.ok(horn > 20 && lefts > 5 && rights > 5, `${horn} horns (${lefts} left, ${rights} right) over 40 runs downtown — the near misses (${near} ticks with one) made no sound`);
  assert.equal(CUE.passMax, undefined); assert.equal(CUE.passTicks, undefined); assert.equal(CUES.carSide, undefined, 'the car-pass\'s own helpers are gone');
  assert.equal(CUE.hornEvery, 180);
  // the horn's car: in front of its travel, closing — never one that has already passed
  const lane = { type: 'road', dir: 1, v: 40, period: 20000, pad: 3000, items: [{ off: 3000 + 1000, len: 1000 }] };   // (its left edge at 1.0 at tick 0, driving right)
  assert.deepEqual(carClosing(lane, 0, 4500), { gap: 4500 - T.KID_HALF - 2000, side: -1 }, 'a car to his left driving right: closing, from the left');
  assert.equal(carClosing(lane, 0, 500), null, 'a car already past him never honks');
});

test('THE LIGHTS DIE: only when THE BLACKOUT takes a lane within 3 of the kid — never the far wall he is outrunning; at least 1.5 s apart', () => {
  // a kid who stands still: the wall comes up on him — the lights die lane by lane near him, then it takes him
  const still = listen('lights', { ticks: 4000, stand: () => true });
  const L = still.out.filter(q => q.cue === 'lights-die');
  assert.ok(L.length >= 2 && L.length <= 4, `a standing kid hears the lights die as the dark closes in (${L.length} times)`);
  for (let i = 1; i < L.length; i++) assert.ok(L[i].t - L[i - 1].t >= CUE.lightsEvery);
  assert.equal(still.run.cause, 'wall');
  // a kid who keeps moving: the wall trails 5 lanes behind his best — never "near": no lights-die at all
  let n = 0, hops = 0;
  for (let s = 0; s < 20; s++) {
    const r = listen(`run${s}`, { ticks: 1500 }), D = r.out.filter(q => q.cue === 'lights-die');
    for (const q of D) assert.ok(q.y - q.wl >= 0 && q.y - q.wl <= CUE.lightsNear, `tick ${q.t}: the dark took lane ${q.wl - 1}, the kid on ${q.y} — near him`);
    for (let i = 1; i < D.length; i++) assert.ok(D[i].t - D[i - 1].t >= CUE.lightsEvery);
    n += D.length; hops += r.run.best;
  }
  assert.ok(hops > 600 && n < hops / 40, `${n} lights-die over 20 runs of a kid who keeps moving (${hops} lanes): only when he lets the dark come close — the wall 5 lanes back is silent`);
  for (const q of still.out.filter(x => x.cue === 'lights-die')) assert.ok(q.y - q.wl <= CUE.lightsNear);
  assert.equal(CUE.lightsNear, 3);
});

test('THE TABLE: every sound in play; THE PRIORITY — your own hit / splash > the train > the horn > a hop + a landing; the caps; ≈ 8 voices; H5B — no car-pass row / file, THE HORN AT HALF, the train sounds\' fade', () => {
  const pri = id => SOUNDS.find(s => s.id === id).pri, max = id => SOUNDS.find(s => s.id === id).max;
  assert.ok(SOUNDS.every(s => s.play), 'all in play'); assert.equal(SOUNDS.length, 11);
  assert.equal(SOUNDS.find(s => s.id === 'car-pass'), undefined, 'the car-pass is GONE from the table (the game never fetches it, the audition never lists it)');
  for (const f of ['car-pass.mp3', 'car-pass-b.mp3']) assert.equal(existsSync(new URL(`../audio/jaywalk/${f}`, import.meta.url)), false, `${f} no longer ships`);
  assert.doesNotMatch(code('sfx.js') + code('cues.js') + code('view.js') + code('lab.js') + code('audition.js'), /car-pass/, 'no code names it');
  assert.equal(SOUNDS.find(s => s.id === 'horn').gain, 0.5, 'THE HORN AT HALF its level (H5A: 1.0)');
  assert.equal(FADE_S, 0.5); for (const id of ['train-bell', 'train-pass']) assert.equal(SOUNDS.find(s => s.id === id).fade, FADE_S, `${id} fades out over 0.5 s`);
  for (const s of SOUNDS) if (!s.id.startsWith('train-')) assert.equal(s.fade, undefined, `${s.id} keeps its own end`);
  for (const own of ['hit', 'splash']) for (const train of ['train-bell', 'train-pass']) assert.ok(pri(own) > pri(train));
  for (const train of ['train-bell', 'train-pass']) assert.ok(pri(train) > pri('horn'));
  for (const kid of ['hop', 'land-wood']) assert.ok(pri('horn') > pri(kid));
  assert.equal(max('horn'), 1); assert.equal(max('train-bell'), 1);
  assert.equal(VOICES, 8);
  // a full house of hops: a car pass takes the oldest hop's voice; a hop never takes a car's
  const hops = Array.from({ length: 8 }, (_, i) => ({ pri: pri('hop'), at: i }));
  assert.deepEqual(admit(hops, pri('horn')), { ok: true, drop: 0 }); assert.deepEqual(admit(hops.map(v => ({ ...v, pri: pri('horn') })), pri('hop')), { ok: false, drop: -1 });
  assert.ok(TRAIN_DUCK.level >= 0.6 && TRAIN_DUCK.level < 0.9, `the music ducks a LITTLE under the train (to ${TRAIN_DUCK.level})`);
});

test('THE PLAYER + THE VIEWS: a sound\'s own cap, the pan, the bell = ONE loop faded out; cues only for this phone\'s own living kid; the music ducks under the train and comes back; muted = nothing plays, every tell stays drawn; PURE cues', () => {
  const s = code('sfx.js'), v = code('view.js'), c = code('cues.js'), lab = code('lab.js');
  assert.match(s, /if \(s\.max && voices\.filter\(q => q\.id === id\)\.length >= s\.max\) return null;/, 'a sound\'s own cap (one horn, one bell)');
  assert.match(s, /if \(o\.pan && ctx\.createStereoPanner\)/, 'panned where the browser can'); assert.match(s, /pn\.pan\.value = Math\.max\(-1, Math\.min\(1, o\.pan\)\);/);
  assert.match(s, /if \(q\.cue === 'bell-on'\) \{ bellWant = true; if \(!bell\) bell = play\('train-bell', \{ loop: true,/, 'ONE bell loop'); assert.match(s, /if \(q\.cue === 'bell-off'\) \{ bellWant = false; if \(bell\) \{ bell\.stop\(FADE_S\); bell = null; \}/, '… FADED OUT over 0.5 s, never cut dead');
  // H5B — THE TRAIN SOUNDS NEVER STOP DEAD: the take's own end ramps out over its last `fade` s; a stop / a dropped voice / stopAll ramp the same way
  assert.match(s, /if \(s\.fade && !src\.loop\) \{ const dur = src\.buffer\.duration \/ src\.playbackRate\.value, t = ctx\.currentTime; if \(dur > s\.fade \* 2\) \{ g\.gain\.setValueAtTime\(g\.gain\.value, t \+ dur - s\.fade\); g\.gain\.linearRampToValueAtTime\(0, t \+ dur\); \} \}/, 'the train-pass ramps out at its own end');
  assert.match(s, /v\.end = \(fade = v\.fade\) => \{/); assert.match(s, /g\.gain\.linearRampToValueAtTime\(0, t \+ fade\); src\.stop\(t \+ fade \+ 0\.02\);/, 'a stop = the shared engine\'s gain ramp, then the source');
  assert.match(s, /if \(a\.drop >= 0\) voices\[a\.drop\]\.end\(\);/, 'a voice a louder sound takes fades too'); assert.match(s, /export function stopAll\(\) \{ bellWant = false; bell = null; for \(const v of \[\.\.\.live\]\) v\.end\(\); live\.clear\(\); \}/, 'the unmount / the lab closing: the train sounds ramp out');
  assert.doesNotMatch(s, /voices\[a\.drop\]\.src\.stop\(\)|v\.src\.stop\(\)/, 'no source is stopped dead from outside its own end()');
  assert.match(s, /trim\.connect\(getSfxBus\(\) \|\| ctx\.destination\)/, 'the soft limiter → the console\'s SFX bus: the Effects slider, THE ONE MUTE, THE CUT');
  assert.match(s, /for \(const id of ids\) for \(const k of both \? keysOf\(BY\[id\]\) : \[`\$\{id\}:\$\{pick\(id\)\}`\]\)/, 'the game fetches the take it plays (the owner\'s pick) — the backups only for the audition');
  assert.match(v, /if \(sndOn && !isOver\(run\)\) \{ try \{ for \(const q of cuesAt\(cues, run, course\)\) \{ SFX\.onCue\(q\); duck\(q\.cue\); \} \}/, 'the cues come from THIS phone\'s own run — a ghost makes no sound, an ended run none');
  assert.doesNotMatch(v, /cuesAt\([^)]*G\.run|onCue\([^)]*ghost/, 'never a ghost\'s cues');
  assert.match(v, /if \(ducked == null\) \{ ducked = musicDuckLevel\(\); duckMusic\(Math\.min\(ducked, D\.level\), D\.inS\); \}/); assert.match(v, /function unduck\(\) \{ clearTimeout\(duckT\); if \(ducked != null\) \{ duckMusic\(ducked, SFX\.TRAIN_DUCK\.outS\); ducked = null; \} \}/, 'the music comes back to the level it had');
  assert.match(v, /function quiet\(\)/); assert.ok((v.match(/quiet\(\);/g) || []).length >= 3, 'the bell stops + the music returns at the run\'s end, a new run, the unmount');
  assert.match(lab, /for \(const q of cuesAt\(cues, run, course\)\) snd\.onCue\(q\);/, 'the lab hears the same cues');
  // PURE: cues.js knows no audio, no DOM, no clock, no randomness
  for (const bad of [/audio\//, /sfx\.js/, /document|window/, /Date\.now|performance\.now/, /Math\.random/, /from 'three'/]) assert.doesNotMatch(c, bad, `cues.js: ${bad}`);
  // the visual tells do not depend on any sound: the scene draws from (run, course) alone
  assert.doesNotMatch(code('night.js'), /sfx\.js|cues\.js/, 'the scene never asks the sounds: muted, every hazard keeps its tell');
});

test('H5C — THE TRAIN HORN: ONE blast a train, when its warning STARTS (with the bell), from its side; THE AREA ARRIVAL replaced the landmark ping; the old bells + cues are gone', () => {
  let horns = 0, bells = 0;
  for (let s = 0; s < 12; s++) {
    const { out, course } = listen(`horn${s}`, { from: 150, ticks: 4000, lazy: true });   // (THE RAIL YARD: the most trains)
    const H = out.filter(q => q.cue === 'train-horn'), seen = new Set();
    for (const q of H) {
      assert.ok(Math.abs(q.pan) === CUE.pan, 'it comes from the train\'s side');
      // the blast is the START of a near rail lane's tell: some rail lane within the bell's reach began its tell within 3 ticks
      let lane = -1;
      for (let i = Math.max(0, q.y - CUE.bellBehind); i <= q.y + CUE.bellAhead; i++) { const L = course.lane(i); if (L.type !== 'rail') continue; const st = pulseAt(L.pulse, q.t); if (st.st === 'tell' && st.left >= L.pulse.tell - 3 && !seen.has(`${i}:${st.k}`)) { lane = i; seen.add(`${i}:${st.k}`); break; } }
      assert.ok(lane >= 0, `a horn at tick ${q.t} without a warning just starting`);
    }
    horns += H.length; bells += out.filter(q => q.cue === 'bell-on').length;
  }
  assert.ok(horns > 10, `the horn sounds on real runs (${horns})`); assert.ok(bells > 0);
  const row = id => SOUNDS.find(q => q.id === id);
  assert.deepEqual([row('train-horn').max, row('train-horn').fade, row('train-horn').b, row('train-horn').pri], [1, FADE_S, false, 3], 'one at once, it fades, one take, the train\'s priority');
  assert.equal(row('train-bell').b, false, 'the bell = ONE take (set B): the old A + B are gone');
  assert.equal(row('landmark'), undefined, 'no landmark row'); assert.ok(row('area-arrive') && row('area-arrive').pri === 3, 'THE AREA ARRIVAL in its place');
  for (const f of ['landmark.mp3', 'train-bell-b.wav']) assert.equal(existsSync(new URL(`../audio/jaywalk/${f}`, import.meta.url)), false, `${f} no longer ships`);
  for (const f of ['train-bell.wav', 'train-horn.mp3', 'area-arrive.mp3']) assert.ok(existsSync(new URL(`../audio/jaywalk/${f}`, import.meta.url)), `${f} ships`);
  const all = code('sfx.js') + code('cues.js') + code('view.js') + code('lab.js') + code('audition.js') + code('sounds.js');
  assert.doesNotMatch(all, /play\('landmark'|id: 'landmark'/, 'no code plays the old landmark cue');
  assert.match(code('sfx.js'), /if \(q\.cue === 'train-horn'\) return play\('train-horn', \{ pan: q\.pan \}\);/); assert.match(code('sfx.js'), /export const JW_SFX_REV = 2;/, 'the bell\'s file was replaced: the rev is bumped');
  assert.match(code('view.js'), /SFX\.play\('area-arrive'\)/); assert.match(code('lab.js'), /snd\.play\('area-arrive'\)/);
  const cr = readFileSync(new URL('../audio/jaywalk/CREDITS.md', import.meta.url), 'utf8');
  for (const line of ['"Railroad Crossing Bell" by Brylon Terry (SoundBible.com), CC BY 3.0. https://soundbible.com/2070-Railroad-Crossing-Bell.html', '"Train Diesel Double Horn from Class 142 with Reverb" by AMBIOSIS (Freesound), CC BY 4.0. https://freesound.org/s/316689/', '"achievement-sparkle" by SkySpeira (Freesound), CC0 1.0. https://freesound.org/s/715067/']) assert.ok(cr.includes(line), `the credits carry: ${line}`);
});
