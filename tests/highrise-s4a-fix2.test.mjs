// HIGH RISE — S4A FIX 2 (docs/games/passes/highrise-s4a-fix2.md): THE ON-PHONE TRACE (`?trace=1`) · THE LANDING FRAME (the rest of a
// landing spread over the next frames, prewarmed, only changed ranges uploaded, a static scene) · THE FLYERS ON REAL TIME (the band read
// off the RESTED camera — the UFO's jump) · GROW-BACK FINAL. The browser checks: tests/integration/highrise-landing.mjs (the measure +
// the end card's panel) · tests/integration/highrise-flypath.mjs (each flyer's path, Chromium + WebKit).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createTrace, PH, PH_NAMES, EV, WORST, OVER_MS } from '../js/games/highrise/trace.js';
import { SOUNDS, SOUND_FILES } from '../js/games/highrise/sounds.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const HI = 'js/games/highrise/';
function body(src, head) {
  const i = src.indexOf(head);
  assert.ok(i >= 0, `the source still has "${head}"`);
  let d = 0;
  for (let k = src.indexOf('{', i + head.length - 1); k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i + head.length, k); }
  throw new Error(`no end of ${head}`);
}
const bare = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/`(?:[^`\\]|\\.)*`/g, '``').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");

test('THE TRACE (trace.js — the record a gap is charged to): the 5 WORST kept worst-first, the top 2 phases + "browser" (what the page\'s own code did not take), the counts over 33 ms by phase, the landing frames apart', () => {
  assert.equal(PH_NAMES.length, 10); assert.equal(PH.input, 0); assert.equal(PH.render, 6); assert.equal(PH.bloom, 7); assert.equal(WORST, 5); assert.equal(OVER_MS, 33);
  const T = createTrace();
  // a fake clock: performance.now is read by lap() — the records are fed as phases through add()
  const feed = (gap, floor, ph, ev = 0) => { T.begin(0, gap, floor, true); for (const [p, ms] of ph) T.add(p, ms); T.ev = ev; };
  // the first begin closes nothing worth keeping (no phases yet) — then 12 records of known shape
  T.begin(0, 16.7, 0, false);
  const gaps = [16, 17, 50, 18, 120, 16, 40, 16, 70, 33.5, 16, 90];
  for (let i = 0; i < gaps.length; i++) feed(gaps[i], i, i === 4 ? [[PH.render, 30], [PH.fx, 4]] : i === 8 ? [[PH.input, 2], [PH.audio, 1], [PH.hud, 3]] : [[PH.render, 1]], i === 4 ? EV.land | EV.perfect : i === 8 ? EV.cut : 0);
  T.begin(0, 16, 12, true);   // (closes the last one)
  const w = T.worst();
  // record k is closed by the NEXT begin's gap: gaps[k + 1] belongs to record k's phases
  assert.deepEqual(w.worst.map(r => r.gap), [120, 90, 70, 50, 40], 'the 5 worst gaps, worst first');
  assert.equal(w.worst[0].floor, 4, 'the floor as the stall ended'); assert.equal(w.worst[0].ph.render, 1, '… charged to the record BEFORE it (the frame + the touch that ran in it) — record 3, not the landing (render 30) after it');
  assert.equal(w.frames, gaps.length + 1);
  // the landing record (floor 4: render 30 + fx 4) ended with gap 16 → not a worst, but it is a landing frame
  assert.equal(w.land.n, 1); assert.equal(w.land.max, 34);
  const lines = T.lines();
  assert.match(lines[0], /^TRACE · 5 WORST FRAMES OF 13$/);
  assert.equal(lines.length, 8, 'the title, five frames, the counts, S4B\'s SET-UP AFTER START line');
  assert.match(lines[1], /^120 ms · F4 · none · browser \d+ · render 1$/, 'total ms · the floor · what happened · the top 2 phases');
  assert.match(lines[lines.length - 2], /^> 33 MS: \d+ — /); assert.equal(lines[lines.length - 1], 'SET-UP AFTER START: none', 'S4B: the pre-warm\'s own line');
  // what happened: the events of the record, by name
  const T2 = createTrace();
  T2.begin(0, 16, 0, false); T2.add(PH.render, 30); T2.ev = EV.land | EV.perfect | EV.deferred; T2.begin(0, 60, 1, true);
  assert.match(T2.lines()[1], /^60 ms · F1 · land\+perfect\+later · render 30 · browser 13$/);
  T2.reset(); assert.equal(T2.worst().worst.length, 0); assert.equal(T2.frames(), 0);
});

test('THE TRACE IS FREE WHEN OFF + MAKES NOTHING WHEN ON: one `if (TR)` a call site; its frame functions build no list / record / closure / string', () => {
  const s = read(`${HI}stage.js`), n = read(`${HI}night.js`), t = bare(read(`${HI}trace.js`)), p = read(`${HI}play.js`);
  assert.match(s, /const TR = o\.trace \? createTrace\(\{ lean: LEAN \}\) : null, traceEl = TR \? h\('div\.hi-trace', \{ hidden: true \}\) : null;/);
  assert.match(p, /trace: Q\.get\('trace'\) === '1'/, 'the page: ?trace=1');
  assert.match(n, /const TRC = o\.trace \|\| null;/);
  const lines = (src, re) => src.split('\n').filter(l => re.test(l));
  for (const l of lines(s, /(?<![\w.])TR\.(lap|add|begin|reset|ev)\b/)) assert.match(l, /if \(TR\)/, `every trace call sits behind its if: ${l.trim().slice(0, 90)}`);
  for (const l of lines(n, /(?<![\w.])TRC\./)) assert.match(l, /if \(TRC\)/, `… the scene's too: ${l.trim().slice(0, 90)}`);
  const BUILDS = [/=>/, /\bfunction\b/, /\.\.\./, /`/, /[=(,:?]\s*\[/, /[=(,:?]\s*\{/, /\bnew\s+[A-Z]/, /\.(map|filter|slice|concat|join|toFixed|toString)\(/];
  for (const head of ['    begin(now, gap, floor, count) {', '    lap(p) {', '    add(p, ms) {', '  function close(gap, floor) {']) for (const re of BUILDS) assert.doesNotMatch(body(t, head), re, `trace.js ${head.trim()} builds nothing (${re})`);
  assert.match(t, /const acc = new Float64Array\(NP\), L = new Float64Array\(3\);/, 'its numbers live in typed arrays made once');
  assert.match(read('css/highrise-play.css'), /\.hi-trace \{[^}]*font: 600 12px\/1\.4 var\(--font-mono\);/, 'the panel ≥ 12 px');
});

test('THE LANDING FRAME: the slab + its sound now — the moments, the number, the tags, a ring, a spark burst in the NEXT frames; prewarmed; only changed ranges uploaded; a static scene', () => {
  const s = read(`${HI}stage.js`), n = read(`${HI}night.js`);
  assert.match(s, /const LATER_MOMENTS = 1, LATER_NUM = 2, LATER_TAGS = 3;/);
  assert.match(s, /else \{ momFrom = from; momTo = liveN; momDue = frameN \+ LATER_MOMENTS; landF = frameN; \}/, 'a landing\'s moments are read off the kept events next frame');
  assert.match(s, /if \(momDue >= 0 && frameN >= momDue\) runMoments\(now\);/);
  assert.match(s, /&& frameN >= landF \+ LATER_NUM\) \{\n      if \(TR\) \{ if \(run\.floor !== hudFloor\) TR\.ev \|= EV\.num; \}\n      hudFloor = run\.floor;/, 'the big number two frames after (its frame named in the trace: S4B)');
  assert.match(s, /if \(run\.floor !== needFloor && frameN >= landF \+ LATER_NUM\)/, 'a flyer\'s fetch / the hull never on the landing frame');
  assert.match(s, /function showEnd\(now\) \{\n    if \(momDue >= 0\) runMoments\(now\);/, 'the last landing\'s moments before its end card');
  assert.match(s, /momDue = -1; landF = -1e9; (shotAt = 0; )?run = createRun/, 'a new run drops what was waiting');
  assert.match(s, /for \(const ms of \[700, 1100, 1500, 1700, 1900, 2600\]\) \{ const a = call\.animate\(POP, \{ duration: ms, fill: 'both' \}\); a\.cancel\(\); pops\.set\(ms, a\); \}/, 'every announcer length made ahead');
  // the scene: a ring + a spark burst are jobs for the next frame; the queue's room made once
  assert.match(n, /const JQ = 8, JN = 12, jKind = new Int8Array\(JQ\), jDue = new Int32Array\(JQ\), jArg = new Float64Array\(\(JQ \+ 1\) \* JN\)/, 'the queue + ONE spare slot: a full queue never overwrites a waiting job'); assert.match(n, /if \(i < 0\) \{ i = JQ; o = JQ \* JN; \}/);
  assert.equal((body(n, '  function events(evs) {').match(/ringLater\(/g) || []).length, 2, 'the perfect ring + grow-back\'s, later');
  assert.match(body(n, '  function fall(r, floor, dx, dz, whole) {'), /let i = jobSlot\(J_SPARKS\)/, 'the spark burst later (the piece itself drawn with the slab)');
  assert.match(n, /runJobs\(\);   \/\/ \(S4A FIX 2/, 'the jobs run at the next draw');
  assert.match(n, /for \(let k = 0; k < PIECES; k\+\+\) \{ QQ\.setFromEuler\(EU\.set\(0\.1 \* k, 0, 0\.05 \* k\)\); put\(GOLD, QQ, null\); \}/, 'PREWARM: the falling pieces\' turned boxes in the warm frame');
  assert.match(n, /const upRange = \(a, off, cnt\) => \{ const u = a\._updateRange; if \(u && cnt > 0\) \{ u\.offset = off; u\.count = cnt; \} a\.needsUpdate = true; \};/, 'three\'s kept range record — addUpdateRange makes one a call');
  assert.match(n, /upRange\(boxes\.instanceMatrix, 0, nb \* 16\); upRange\(aColor, 0, nb \* 3\); upRange\(aFx, 0, nb \* 4\); upRange\(aUp, 0, nb \* 4\);/);
  assert.match(n, /upRange\(spO, spLo \* 3, spCount \* 3\)/); assert.doesNotMatch(body(n, '  function spark(x, y, z, vx, vy, vz, life, size, c) {'), /needsUpdate/, 'a spark no longer sends the whole buffer');
  assert.match(n, /for \(const m of scene\.children\) \{ m\.updateMatrix\(\); m\.matrixAutoUpdate = false; \}\n  scene\.matrixAutoUpdate = false; scene\.matrixWorldAutoUpdate = false;/, 'a static scene');
  assert.match(body(n, '  function draw(run) {'), /scene\.updateMatrixWorld\(\);/, 'walked once a frame — not by each bloom pass');
  assert.equal((n.match(/tape\.updateMatrix\(\)/g) || []).length >= 3, true, 'a tape\'s matrix set when it is laid');
});

test('THE FLYERS ON REAL TIME: the frame\'s own timestamp, the sky band off the RESTED camera (eased) — a landing never moves a flyer on the screen', () => {
  const s = read(`${HI}stage.js`), n = read(`${HI}night.js`), f = read(`${HI}flyers.js`);
  assert.match(s, /io\[2\] = now;/); assert.match(n, /const IO = new Float64Array\(3\)/);
  assert.match(n, /FR\.t = \(IO\[2\] > 0 \? IO\[2\] : NUM\[CLK\]\) \/ 1000;/);
  assert.match(n, /zoneFrom\(true\); if \(NUM\[FBOT\] < 0 \|\| dt >= 1000\) NUM\[FBOT\] = NUM\[ZONE\]; else NUM\[FBOT\] \+= \(NUM\[ZONE\] - NUM\[FBOT\]\) \* \(1 - Math\.exp\(-dt \/ 600\)\); FR\.bot = NUM\[FBOT\];/);
  assert.doesNotMatch(n, /zoneFrom\(false\); FR\.bot/, 'never the zone as the camera sees it NOW');
  assert.equal((f.match(/rec\(F, P, [123]\);/g) || []).length, 3, 'the path check records the jet, the UFO, THE MOTHERSHIP');
  assert.match(f, /const PATH_N = 4096, PATH = new Float64Array\(PATH_N \* 4\);/);
});

test('GROW-BACK FINAL (the owner\'s pick, take 1 — "Heal Restore", Qvantor, CC0): one file, the chooser gone, the version bumped', () => {
  assert.ok(SOUND_FILES.includes('grow-back') && !SOUND_FILES.some(x => /grow-back-/.test(x)));
  assert.ok(SOUNDS.every(x => !('takes' in x)));
  const files = readdirSync(new URL('../audio/highrise/', import.meta.url));
  assert.ok(files.includes('grow-back.mp3') && !files.some(x => /grow-back-\d/.test(x)), 'takes 2–5 gone (and take 1 renamed)');
  assert.match(read(`${HI}sfx.js`), /export const HI_SFX_REV = 3;/, 'the version bumped: a phone fetches the new file');
});
