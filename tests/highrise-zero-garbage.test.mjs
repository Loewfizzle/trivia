// HIGH RISE — ZERO GARBAGE IN PLAY (S4A FIX — docs/highrise.md "THE LAG RULES" · docs/games/passes/highrise-s4a-fix.md). The owner's
// iPhone: one 2–3-frame stall a floor — a collector's pauses on a page that made garbage every frame. A LIVE frame now makes NO
// OBJECTS. The browser guard measures it (tests/integration/highrise-alloc.mjs — Chromium's own allocation sampler: fails over its
// budget); THIS file pins the pieces that make it so, in node:
//   · the PURE twins that write INTO a kept record equal the ones that return a new one (slabInto · plateMixInto · hazeInto · bestTag ·
//     flyNeeds · cuesOf's constants · admitSlot · the tower's kept records)
//   · the kit's tier rule on its two rings of numbers still IS the rule (the same steps as a plain-list model of it)
//   · STATIC: no function that runs every frame builds a list, a record, a closure, a spread or a string — and none holds an inner
//     function (a function an inner one reads the numbers of gets a fresh record for them at EVERY call)
//   · three.js comes as its READABLE build (the minified one makes a closure at every draw call)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRun, stepTo, tap, isOver, slabAt, slabInto } from '../js/games/highrise/engine.js';
import { plateMix, plateMixInto, hazeAt, hazeInto } from '../js/games/highrise/bands.js';
import { bestView, bestTag } from '../js/games/highrise/best.js';
import { flyPlan, flyNeeds } from '../js/games/highrise/flyplan.js';
import { cuesOf, admit, admitSlot, chimeRate, VOICES, FALL_DELAY_S } from '../js/games/highrise/sounds.js';
import { createTower } from '../js/games/highrise/tower.js';
import { createTiers, quantile, capProbeSaysCapped, CAP_PROBE_MS, CAP_WORK_MS } from '../js/games/kit/tiers.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const HI = 'js/games/highrise/';
/** a function's body (its braces matched) — the text from `head` to its closing brace */
function body(src, head) {
  const i = src.indexOf(head);
  assert.ok(i >= 0, `the source still has "${head}"`);
  let d = 0;
  for (let k = src.indexOf('{', i + head.length - 1); k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i + head.length, k); }
  throw new Error(`no end of ${head}`);
}
/** code only: block + line comments and string / template contents out (a comment may say anything) */
const bare = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/`(?:[^`\\]|\\.)*`/g, '``').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
let seed = 11;
const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;

test('THE PURE TWINS: what is written INTO a kept record equals what the old call returned (slabInto · plateMixInto · hazeInto · bestTag · flyNeeds)', () => {
  // the sliding slab, at every tick of real runs — and the SAME record handed back each time
  const kept = { floor: 0, axis: 'x', off: 0, x0: 0, x1: 0, z0: 0, z1: 0 };
  for (const s of ['a', 'b', 'zero-garbage']) {
    const run = createRun({ seed: s, mode: 'solo' });
    for (let t = 0; t < 4000 && !isOver(run); t += 7) {
      stepTo(run, t);
      const a = slabAt(run, t), b = slabInto(run, t, kept);
      if (a === null) assert.equal(b, null, 'a beat: no slab either way'); else { assert.equal(b, kept, 'the kept record itself'); assert.deepEqual({ ...b }, a); }
      if (run.st === 'slide' && t % 91 === 0) tap(run, run.s0 + Math.floor(run.S / 2));
    }
  }
  const mix = { a: 0, b: 0, m: 0 }, hz = [0, 0, 0];
  for (let f = -3; f < 260; f += 0.37) { assert.deepEqual({ ...plateMixInto(f, mix) }, plateMix(f)); assert.deepEqual([...hazeInto(f, hz)], hazeAt(f)); }
  assert.equal(plateMixInto(30, mix), mix); assert.equal(hazeInto(30, hz), hz);
  for (const [best, floor] of [[0, 12], [57, 45], [57, 0], [57, 56], [57, 57], [57, 58], [57, 90], [1, 0], [1, 1]]) {
    const v = bestView(best, floor);
    assert.equal(bestTag(best, floor), v && v.tag ? v.tag : '', `best ${best}, floor ${floor}`);
  }
  const plan = flyPlan('needs'), out = [];
  for (let f = 0; f < 230; f++) { assert.deepEqual(flyNeeds(plan, f, out), flyNeeds(plan, f)); assert.equal(flyNeeds(plan, f, out), out, 'the stage\'s own list is filled, never a new one'); }
});

test('THE CUES ARE CONSTANTS: a batch\'s sounds are the SAME few records every time, in the caller\'s own list, from where the batch starts', () => {
  const evs = [{ e: 'spawn' }, { e: 'drop' }, { e: 'perfect', streak: 3 }, { e: 'land' }, { e: 'drop' }, { e: 'cut' }, { e: 'land' }, { e: 'perfect', streak: 10 }, { e: 'grow' }, { e: 'land' }, { e: 'out' }];
  const a = cuesOf(evs), list = [], b = cuesOf(evs, false, list);
  assert.equal(b, list); assert.deepEqual(b, a);
  assert.deepEqual(a.map(c => c.id), ['perfect', 'drop', 'slice', 'falling-piece', 'drop', 'perfect', 'streak', 'grow-back', 'drop', 'out']);
  assert.deepEqual([a[0].rate, a[5].rate, a[3].delay, a[1].vary], [chimeRate(3), chimeRate(10), FALL_DELAY_S, true]);
  const again = cuesOf(evs);
  for (let i = 0; i < a.length; i++) { assert.equal(again[i], a[i], `cue ${i} is the same record both times: nothing is made`); assert.ok(Object.isFrozen(a[i])); }
  // `from`: only the batch's own events (the stage's list holds the tap's events + the frame's)
  assert.deepEqual(cuesOf(evs, false, list, 7).map(c => c.id), ['perfect', 'streak', 'grow-back', 'drop', 'out']);
  assert.deepEqual(cuesOf(evs, true, list).map(c => c.id), ['out'], 'a late batch: only its OUT');
  for (let n = -2; n < 30; n++) assert.equal(cuesOf([{ e: 'perfect', streak: n }])[0].rate, chimeRate(n), `the chime's pitch for a streak of ${n}`);
});

test('PRIORITY ON A POOL OF VOICES (admitSlot) = THE SAME RULE as admit() over the voices that are sounding', () => {
  for (let k = 0; k < 4000; k++) {
    const slots = Array.from({ length: VOICES + 3 }, (_, i) => ({ on: rnd() < 0.8, pri: 1 + Math.floor(rnd() * 4), at: Math.floor(rnd() * 50) * 10 + i / 100 }));
    const live = slots.filter(v => v.on), pri = 1 + Math.floor(rnd() * 4), a = admit(live.slice(0, VOICES), pri), s = admitSlot(slots, pri);
    if (live.length < VOICES) { assert.equal(s, -1, 'a voice is free'); continue; }
    if (live.length > VOICES) continue;   // (never in the game: a ninth voice is not let in)
    if (!a.ok) assert.equal(s, -2, 'outranked: dropped');
    else { assert.ok(s >= 0); assert.equal(slots[s], live[a.drop], 'the same voice goes: the lowest-ranked, the oldest of those'); }
  }
});

test('THE TOWER KEEPS ITS RECORDS: the top is ONE record written in place, a slab that leaves the list is the next to enter it — and it still equals the engine\'s tower', () => {
  const run = createRun({ seed: 'kept', mode: 'solo' }), fell = [], T = createTower(run, { onFall: (r, floor, dx, dz, whole) => fell.push([{ ...r }, floor, dx, dz, whole]) }, 12);
  const top0 = T.top(), list0 = T.slabs(), ev = [], seen = new Set();
  for (let i = 0; i < 90 && !isOver(run); i++) {
    stepTo(run, run.s0, ev);
    const off = i % 9 === 8 ? 3 : 0;   // (every 9th a cut)
    tap(run, run.s0 + Math.floor(run.S / 2) + off, ev);
    T.feed(ev); ev.length = 0;
    assert.equal(T.top(), top0, 'the top record is the same object all run'); assert.equal(T.slabs(), list0);
    assert.deepEqual({ ...T.top() }, { x0: run.x0, x1: run.x1, z0: run.z0, z1: run.z1 }, 'it lies where the engine says');
    assert.equal(T.floor(), run.floor);
    assert.ok(T.slabs().length <= 12 + 8, 'never more than keep + 8 slabs held');
    for (const s of T.slabs()) seen.add(s);
    const last = T.slabs()[T.slabs().length - 1];
    assert.deepEqual([last.x0, last.x1, last.z0, last.z1, last.floor], [run.x0, run.x1, run.z0, run.z1, run.floor]);
  }
  assert.ok(run.floor > 60, `the run climbed (${run.floor})`);
  assert.ok(seen.size <= 12 + 8 + 1, `the slab records are recycled: ${seen.size} ever made for ${run.floor} floors`);
  assert.ok(fell.length >= 5 && fell.every(f => f[0].x1 > f[0].x0 && f[0].z1 > f[0].z0), 'each cut handed its overhang to the hook');
  const fl = T.slabs().map(s => s.floor); assert.deepEqual(fl, fl.slice().sort((a, b) => a - b), 'the slabs stay in floor order');
});

test('THE TIER RULE MAKES NOTHING — and is still the rule: the same steps as a plain-list model of it, on random frame streams', () => {
  // the rule as it was written before S4A FIX (plain lists, three sorted copies an asking) — kept HERE as the model
  const model = ({ initial = 2, max = 2, window = 120, minSamples = 90 } = {}) => {
    let tier = initial, cool = 0, failed = -1, goodSince = 0, lastFrame = 0, probe = null, capped = false;
    const frames = [], works = [];
    const set = t => { tier = Math.max(0, Math.min(max, t)); frames.length = 0; works.length = 0; };
    return {
      sample(now, work) { if (lastFrame) { frames.push(now - lastFrame); if (frames.length > window) frames.shift(); } lastFrame = now; works.push(work); if (works.length > window) works.shift(); },
      tick(now) {
        if (probe && now - probe.at > CAP_PROBE_MS && frames.length >= 20) { const back = probe.from; if (capProbeSaysCapped(probe.p50, quantile(frames, 0.5))) { capped = true; probe = null; failed = -1; set(back); cool = now + 2500; goodSince = 0; return; } probe = null; }
        if (frames.length < minSamples || now < cool) return;
        const p75 = quantile(frames, 0.75), work = quantile(works, 0.75);
        if (p75 > 19.5 && tier > 0) { if (capped && work <= CAP_WORK_MS) return; if (!capped && !probe) probe = { from: tier, p50: quantile(frames, 0.5), at: now }; failed = tier; set(tier - 1); cool = now + 2500; goodSince = 0; return; }
        if (p75 < 17.2 && work < 6 && tier < max && tier + 1 !== failed) { if (!goodSince) goodSince = now; else if (now - goodSince > 8000) { set(tier + 1); cool = now + 4000; goodSince = 0; } } else goodSince = 0;
      },
      get: () => tier, capped: () => capped, fps: () => frames.slice(), work: () => works.slice(), reset() { frames.length = 0; works.length = 0; lastFrame = 0; },
    };
  };
  let steps = 0;
  for (let r = 0; r < 120; r++) {
    const a = model(), b = createTiers({ initial: 2 });
    let now = rnd() * 1000;
    const base = [16.7, 16.7, 20, 24, 33.3][Math.floor(rnd() * 5)], wk = [1, 3, 5, 7, 13, 28][Math.floor(rnd() * 6)], every = 1 + Math.floor(rnd() * 12);
    for (let i = 0; i < 3000; i++) {
      const ms = (a.get() === 2 ? base : a.get() === 1 ? base * (0.6 + rnd() * 0.5) : 16.7) + (rnd() < 0.02 ? rnd() * 60 : rnd() * 2), w = wk * (0.5 + rnd());
      now += ms; a.sample(now, w); b.sample(now, w);
      if (i % every === 0) { a.tick(now); b.tick(now); }
      if (rnd() < 0.0005) { a.reset(); b.reset(); }
      assert.equal(b.get(), a.get(), `run ${r}, frame ${i}: the same tier`); assert.equal(b.capped(), a.capped());
      steps++;
    }
    assert.deepEqual(b.fps(), a.fps(), 'the frame times it holds, oldest first'); assert.deepEqual(b.work(), a.work());
  }
  assert.ok(steps >= 300000);
  const t = bare(read('js/games/kit/tiers.js')), cr = t.slice(t.indexOf('export function createTiers('));
  for (const f of ['    sample(now, work) {', '    tick(now, frameTimes) {']) assert.doesNotMatch(body(cr, f), /=>|\[\.\.\.|\.sort\(|\.slice\(|\.push\(|\.shift\(/, `${f.trim()} builds nothing`);
  assert.match(cr, /const frames = new Float64Array\(window\), works = new Float64Array\(window\), sf = new Float64Array\(window\), sw = new Float64Array\(window\);/);
});

test('STATIC — NO FUNCTION THAT RUNS EVERY FRAME BUILDS ANYTHING: no list, no record, no closure, no spread, no string — and no inner function', () => {
  // (what a frame may still write: numbers into records + typed arrays made once. A landing's own words are built in the functions
  //  that run ONCE A LANDING — placeTags · moments · say · hitch — never in these.)
  const BUILDS = [[/=>/, 'an arrow function'], [/\bfunction\b/, 'an inner function'], [/\.\.\./, 'a spread'], [/`/, 'a template string'], [/[=(,:?]\s*\[/, 'a list'], [/[=(,:?]\s*\{/, 'a record'],
    [/\bnew\s+[A-Z]/, 'a new object'], [/\.(map|filter|slice|concat|flatMap|reduce|split|join|keys|values|entries|toFixed|toString|padStart)\(/, 'a list- / string-making call'], [/Array\.from|Object\.(assign|keys|values|entries)|JSON\./, 'a builder'], [/\bfor\s*\([^)]*\bof\b/, 'a for … of (an iterator)']];
  const frameFns = {
    'stage.js': ['  function frame(now) {', '  function soundNow(late) {'],
    'night.js': ['  function draw(run) {', '  function aim() {', '  function zoneFrom(rest) {', '  function put(c, q, up) {', '  function lit() {', '  function colIn(look, floor) {', '  function colMix(floor) {'],
    'night-fx.js': ['    render(scene, cam, hide, twins, k = 1) {'],
    'tower.js': ['  function feed(events) {'],
    'flyers.js': ['  function frame(F) {', '  function jetLights(F, kind, at, len, fade) {', '  function body(i, g, ax, ay, az, size, at, F, o) {', '  function seen(F, p, box) {'],
  };
  for (const [file, heads] of Object.entries(frameFns)) {
    const src = bare(read(`${HI}${file}`));
    for (const h of heads) {
      let b = body(src, h);
      // (colIn works a floor's colour out ONCE, when it first shows — that one line may call the pure colour maths)
      for (const [re, what] of BUILDS) assert.doesNotMatch(b, re, `${file} ${h.trim()} builds ${what}`);
    }
  }
  // the flyers' frame functions hold the moment a flyer STARTS too (its sound, once): no inner function, no list / spread in them
  const fl = bare(read(`${HI}flyers.js`));
  for (const h of ['  function frameJet(F) {', '  function frameUfo(F) {', '  function frameShip(F) {']) for (const [re, what] of [BUILDS[0], BUILDS[1], BUILDS[2], BUILDS[9]]) assert.doesNotMatch(body(fl, h), re, `flyers.js ${h.trim()} holds ${what}`);
  // … and nothing is handed a list of fractions: a flyer's light = 14 numbers in the stage's scratch, a box = 10
  assert.doesNotMatch(fl, /S\.light\(/, 'no call hands 14 fractions over'); assert.ok((fl.match(/S\.lit\(\)/g) || []).length >= 14);
  const n = bare(read(`${HI}night.js`));
  assert.match(n, /const BX = new Float64Array\(10\)/); assert.match(n, /const LG = new Float64Array\(14\)/); assert.match(n, /const NUM = new Float64Array\(20\)/);
  assert.match(n, /scene\.children\.sort\(\(a, b\) => a\.renderOrder - b\.renderOrder\);\s*renderer\.sortObjects = false;/, 'the draw order is fixed once — three.js does not sort every pass');
  assert.match(n, /cam\.matrixAutoUpdate = false; cam\.matrixWorldAutoUpdate = false;/, 'the camera only slides: no lookAt / inverse a frame');
  // holdPlates runs every frame: the function that drops the plates no longer wanted sits OUTSIDE it
  assert.doesNotMatch(body(n, '  function holdPlates(a, b) {'), /=>|\bfunction\b/, 'holdPlates holds no inner function');
  // the stage: what a landing changes is written into nodes made once; the fps line once a second from kept numbers
  const s = bare(read(`${HI}stage.js`));
  assert.match(s, /FPS_EVERY_MS = 1000/); assert.match(s, /if \(fps && now - fpsAt >= FPS_EVERY_MS\) \{ fpsAt = now; fpsLine\(\); \}/);
  assert.doesNotMatch(body(s, '  function fpsLine() {'), /view\.info\(\)|\.slice\(|\.reduce\(|Math\.max\(\.\.\./, 'the fps line reads the ring + ONE kept record');
  assert.match(s, /const frames = new Float32Array\(FRAMES_KEPT\)|frames = new Float32Array\(FRAMES_KEPT\)/);
  assert.match(s, /if \(\(run\.floor !== tagSeenFloor \|\| tagMode !== tagSeenLive \|\| tagDirty\) && \(frameN >= landF \+ LATER_TAGS \|\| tagMode !== 2\)\) placeTags\(tagMode\);/, 'the two tags: placed once a landing — never a style write a frame');
  assert.doesNotMatch(body(s, '  function frame(now) {'), /\.style\.transform|\.deref\(|getBoundingClientRect|clientHeight|offsetTop/, 'the frame writes no tag transform, asks no WeakRef, reads no layout (the one HUD block writes its words on a CHANGE)');
  assert.match(read('css/highrise-play.css'), /\.hi-tag \{[^}]*transition: transform 0\.56s cubic-bezier\(0\.15, 0\.6, 0\.4, 1\);/, 'a CSS transition rides a tag to its place with the camera');
  // the sounds: a voice = a kept slot (its gain, its `ended` handler); a sound makes its source and nothing else
  const x = bare(read(`${HI}sfx.js`));
  assert.match(x, /const POOL = VOICES \+ 3;/); assert.doesNotMatch(body(x, 'function start(id, rate, vol, delay, late) {'), /=>|\bfunction\b|\{\s*\.\.\./, 'start() holds no inner function');
  assert.match(x, /if \(v\.gctx !== ctx\) \{ v\.g = ctx\.createGain\(\); v\.g\.connect\(dst\); v\.gctx = ctx; \}/, 'a voice\'s gain is made + wired once a context');
});

test('THE HITCH COUNTER IS HONEST: "gc" only when a collection is KNOWN to have run (a canary); a touch has its own mark; no mark = "unknown"', () => {
  const s = read(`${HI}stage.js`);
  assert.match(s, /const HAS_WEAK = typeof WeakRef === 'function' && typeof FinalizationRegistry === 'function';/);
  assert.match(s, /const gcReg = HAS_WEAK \? new FinalizationRegistry\(\(\) => \{ if \(!canaryGone\) \{ marks\.gc = performance\.now\(\); gcSeen\+\+; \}/, 'the registry stamps the collection');
  assert.match(s, /if \(canary && !canaryGone && canary\.deref\(\) === undefined\) \{ canaryGone = true; marks\.gc = performance\.now\(\); gcSeen\+\+; \}/, 'a stall being named asks the canary itself');
  assert.match(s, /marks\.plate >= since \? 'plate' : marks\.compile >= since \? 'compile' : marks\.audio >= since \? 'audio' : marks\.gc >= since \? 'gc' : marks\.dom >= since \? 'dom' : marks\.tap >= since \? 'tap' : prevWork > 12 \? 'work' : 'unknown'/);
  assert.match(s, /marks\.tap = performance\.now\(\);/, 'a touch leaves its mark');
  assert.doesNotMatch(s, /prevWork > 12 \? 'unknown' : 'gc'/, '"gc" is never the name of "nothing else was seen" any more');
  assert.doesNotMatch(s, /performance\.memory/, 'nothing Chromium-only: the counter works in Safari');
});

test('three.js COMES AS ITS READABLE BUILD on every page (the minified build makes a closure at every draw call — its minifier folded setProgram into its caller as a function made + called on the spot)', () => {
  const pages = readdirSync(new URL('..', import.meta.url)).filter(f => f.endsWith('.html')).concat(['tests/integration/jaywalk-daily.html', 'tests/integration/title-preview.html']);
  let n = 0;
  for (const p of pages) {
    const html = read(p), m = html.match(/"three":\s*"([^"]+)"/);
    if (!m) continue;
    n++;
    assert.equal(m[1], 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', `${p}: the readable build, the one pinned version`);
  }
  assert.ok(n >= 4, `index.html + the three unlisted pages name it (${n})`);
  assert.doesNotMatch(read('index.html') + read('highrise-play.html') + read('jaywalk-lab.html'), /three\.module\.min\.js/);
});
