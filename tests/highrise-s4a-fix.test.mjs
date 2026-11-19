// HIGH RISE — S4A FIX, the look items (docs/highrise.md · docs/games/passes/highrise-s4a-fix.md; the garbage hunt has its own file:
// tests/highrise-zero-garbage.test.mjs): THE UFO's far-side lamps are HIDDEN by the hull · THE NEXT FRIEND's pink tape has a WHITE
// CORE (the gold tape unchanged) · THE ICON = "A · THE TOWER".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MARKS, markFor } from '../js/core/marks.js';
import { markSvg } from '../js/ui/mark-svg.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const HI = 'js/games/highrise/';
// (flyers.js is a browser module — the audio engine, a GLB reader: its two numbers are read off its source, never imported here)
const [, LAMP_FROM, LAMP_FULL] = read(`${HI}flyers.js`).match(/export const LAMP_FROM = ([\d.]+), LAMP_FULL = ([\d.]+);/).map(Number);

test('THE UFO: a rim lamp on the FAR side is fully OFF (the hull hides it) — a short smooth fade as it rounds the rim, full in front; both looks', () => {
  assert.ok(LAMP_FROM >= 0 && LAMP_FROM < LAMP_FULL && LAMP_FULL <= 0.35, 'off at the silhouette and behind it; full within ~20° of its turn');
  const fl = read(`${HI}flyers.js`);
  assert.match(fl, /const face = ease\(\(w\.dot\(c\) - LAMP_FROM\) \/ \(LAMP_FULL - LAMP_FROM\)\),/, 'a lamp\'s light = how far its face (the rim\'s outer face: straight out from the axis) is turned to the lens');
  assert.doesNotMatch(fl, /0\.4 \+ 0\.6 \* ease\(\(w\.dot\(c\)/, 'never "the far ones at 40 %" again: a lamp is a glow drawn over the body — nothing else hides it');
  // the same maths, by hand: every lamp of the ten, at every turn of the saucer
  const ease = v => { const t = v < 0 ? 0 : v > 1 ? 1 : v; return t * t * (3 - 2 * t); };
  const face = d => ease((d - LAMP_FROM) / (LAMP_FULL - LAMP_FROM));
  for (let spin = 0; spin < Math.PI * 2; spin += 0.05) {
    let lit = 0;
    for (let i = 0; i < 10; i++) { const d = Math.cos(i * Math.PI / 5 + spin), f = face(d); if (d <= 0) assert.equal(f, 0, `a lamp turned from the lens (facing ${d.toFixed(2)}) gives no light`); if (f > 0.5) lit++; }
    assert.ok(lit >= 3 && lit <= 5, `the front of the rim is lit at every turn (${lit} of 10 at ${spin.toFixed(2)})`);
  }
  assert.equal(face(1), 1); assert.ok(face((LAMP_FROM + LAMP_FULL) / 2) > 0.4 && face((LAMP_FROM + LAMP_FULL) / 2) < 0.6, 'a smooth fade between');
  // (one loop for both looks: the day's lamp is the same light as paint — LG[9] = 0.9 × the day)
  assert.match(fl, /LG\[8\] = face \* ch \* fade; LG\[9\] = 0\.9 \* d; LG\[10\] = 4;/);
});

test('THE PINK TAPE HAS A WHITE CORE: white at its heart, the pink either side, then the glow — the front edges only; THE GOLD TAPE IS UNCHANGED; the tag\'s edge too', () => {
  // (night-fx.js imports three.js — its shader is read off its source, never imported here)
  const fx = read(`${HI}night-fx.js`), TAPE_F = fx.slice(fx.indexOf('export const TAPE_F = '), fx.indexOf('// ---- THE FLYERS'));
  const TAPE_CORE_EDGE = Number(fx.match(/export const TAPE_CORE_EDGE = ([\d.]+),/)[1]), TAPE_LINE = Number(fx.match(/export const TAPE_LINE = ([\d.]+),/)[1]);
  assert.match(TAPE_F, /uniform float uGlow, uWhite, uFace, uBloom, uDay, uCore, uDash;/);
  assert.ok(TAPE_F.includes('vec3 lineC = mix(uCol * (1.0 - 0.34 * uCore * (1.0 - uDay) * step(0.99, uFace)), vec3(1.0), line * uCore * 0.94 * step(0.99, uFace));'), 'the core is white, on the edges turned to the camera only (never a white diamond through the glass); by night the band round it is a DEEPER pink (the bloom washed a full-strength one to white)');
  const TAPE_CORE_NIGHT = Number(fx.match(/TAPE_CORE_NIGHT = ([\d.]+),/)[1]);
  assert.ok(TAPE_F.includes('float hb = hw * (1.0 + mix(${TAPE_CORE_NIGHT.toFixed(2)}, ${TAPE_CORE_EDGE.toFixed(2)}, uDay) * uCore);'), 'the colour\'s band is wider than the core — wider still by night');
  assert.ok(TAPE_CORE_EDGE >= 1 && TAPE_CORE_EDGE <= 2 && TAPE_CORE_NIGHT > TAPE_CORE_EDGE && TAPE_CORE_NIGHT <= 3.5 && TAPE_LINE === 0.0021);
  // THE FRESH-EYES REVIEW (the pass's close): by night a white line in a pink glow is what a pink slab's own edge looks like — the
  // cored tape's FRONT edges get the day's dark outline too (white · solid pink · a dark edge); the glow stays out of that edge
  assert.ok(TAPE_F.includes('float dk = mix(uCore * step(0.99, uFace), 1.0, uDay);') && TAPE_F.includes('float glow = halo * (1.0 - 0.85 * uDay) * (1.0 - dark * (1.0 - uDay));'), 'a dark edge round the pink band by night — the front edges of the cored tape alone');
  // … and with uCore = 0 (the gold tape) every one of those terms is the S2 FIX's: dk = uDay · dark = 0 by night, so the glow is whole · the band's colour × 1
  { const dk = (core, face, day) => (core * (face >= 0.99 ? 1 : 0)) * (1 - day) + day; assert.deepEqual([dk(0, 1, 0), dk(0, 1, 1), dk(0, 0.3, 0), dk(1, 1, 0), dk(1, 0.3, 0), dk(1, 1, 1)], [0, 1, 0, 1, 0, 1]); }
  // uCore = 0 (the gold tape): the band IS the line, the core adds nothing — the S2 FIX's maths, term for term
  assert.ok(TAPE_F.includes('vec3 c = (lineC * band + uCol * glow * (1.0 - band) + vec3(uWhite) * band) * uGlow * k + mix(vec3(0.2, 0.085, 0.01), vec3(0.2, 0.02, 0.13), uCore) * mix(0.3, 1.0, uDay) * dark * k;'));
  assert.match(TAPE_F, /gl_FragColor = vec4\(c, min\(1\.0, band \+ glow \* 0\.6 \+ dark\) \* k\);/);
  const n = read(`${HI}night.js`);
  assert.match(n, /const tapeU = \{[^\n]*uCore: \{ value: 0 \}, uDash: \{ value: 0 \} \};/, 'the gold tape: no core');
  assert.match(n, /const ftapeU = \{ \.\.\.tapeU, uCol: \{ value: new THREE\.Vector3\(TAPE_PINK\[0\], TAPE_PINK\[1\], TAPE_PINK\[2\]\) \}, uGlow: \{ value: 1 \}, uWhite: \{ value: 0 \}, uCore: \{ value: 1 \}, uDash: \{ value: 0 \} \};/, 'the friend\'s tape: the white core (never dashed: the dashes are the end screen\'s gold ghost alone)');
  assert.match(n, /const ftapeMat = new THREE\.ShaderMaterial\(\{ \.\.\.tapeOpt, uniforms: ftapeU,/, 'the SAME shader: one program for both tapes (a second tape builds nothing — THE LAG RULES)');
  assert.match(read('css/highrise-play.css'), /\.hi-ftag \{ color: #ffd9f4; border-left: 2px solid #fff; padding-left: 12px; box-shadow: -2px 0 0 #ff4fd8, inset 2px 0 0 #ff4fd8, -4px 0 10px rgba\(255, 79, 216, 0\.8\); \}/, 'the friend\'s tag edge: a white core, the pink either side, a pink glow');
});

test('THE ICON = "A · THE TOWER": a cyan isometric stack + the pink slab dropping on top — in the mark\'s 0 … 100 box, stroke and all, at its own tube width', () => {
  const m = MARKS.highrise;
  assert.equal(m.blade, 'HIGHRISE');
  assert.deepEqual(m.tubes.map(t => t.col), ['#35e3ff', '#35e3ff', '#ff4fd8'], 'cyan · cyan · the sign\'s pink');
  assert.deepEqual(m.tubes.map(t => t.d), [
    'M26 58 L46 48 L66 58 M26 58 V86 L46 96 L66 86 V58 L46 68 L26 58 M46 68 V96',
    'M26 68 L46 78 L66 68 M26 77 L46 87 L66 77',
    'M36 26 L56 16 L76 26 L56 36 Z M36 26 V34 L56 44 L76 34 V26 M56 36 V44',
  ], 'the owner\'s three paths, as given');
  assert.equal(markFor({ id: 'highrise' }), m);
  // every number of every path, a half tube out: inside the box
  const half = m.w / 2;
  for (const t of m.tubes) {
    let x = 0, y = 0;
    for (const [, cmd, args] of t.d.matchAll(/([MLVHZ])([^MLVHZ]*)/g)) {
      const v = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (cmd === 'M' || cmd === 'L') { x = v[0]; y = v[1]; } else if (cmd === 'V') y = v[0]; else if (cmd === 'H') x = v[0];
      assert.ok(x - half >= 0 && x + half <= 100 && y - half >= 0 && y + half <= 100, `${cmd}${args}: (${x}, ${y}) ± ${half} stays in the box`);
    }
  }
  // its floor lines lie 8 apart: at the house width (7) they close up into two solid blocks — the mark names its own
  assert.equal(m.w, 4.5);
  const svg = markSvg({ id: 'highrise' });
  assert.equal((svg.match(/stroke-width:4\.5;/g) || []).length, 3); assert.match(svg, /^<svg viewBox="0 0 100 100" aria-hidden="true" class="nd-shelf-mark">/);
  assert.equal((markSvg({ id: 'jaywalk' }).match(/stroke-width:7;/g) || []).length, MARKS.jaywalk.tubes.length, 'every other mark keeps the house width');
  for (const [id, mk] of Object.entries(MARKS)) if (id !== 'highrise') assert.equal(mk.w, undefined, `${id}: no width of its own`);
});

// ---- THE ADD-ONS (the inbox, Nov 19 2:57 pm + 3:00 pm — the owner's picks): THE WELCOME = "A · THE SIGN" · THE END = "A · THE HERO NUMBER"
test('THE WELCOME = "A · THE SIGN": no box, no panel — the sign BIG in the sky (HIGH pink-edged, RISE blue-edged, white faces), its one line, the tower low with a first slab sliding in + YOUR BEST\'s tape + tag, TAP TO START in the foot\'s fade', () => {
  const s = read(`${HI}stage.js`), n = read(`${HI}night.js`), css = read('css/highrise-play.css');
  assert.match(s, /h\('div\.hi-start-top', h\('div\.hi-sign', \{ 'aria-label': 'High Rise' \}, h\('span', 'HIGH'\), h\('span', 'RISE'\)\), h\('div\.hi-start-sub', 'STACK IT AS HIGH AS YOU DARE'\), PAGE \? lookRow : null\),/);
  assert.match(s, /h\('div\.hi-start-foot', h\('div\.hi-start-go', 'TAP TO START'\), h\('div\.hi-start-l', 'ONE TAP DROPS EACH SLAB'\)\)\);/);
  assert.doesNotMatch(s, /hi-start-best|THIS PHONE/, 'YOUR BEST is the tape + its tag — never a line of text on the start screen');
  // the scene: the pose, the slab, the tape — set at a run's (re)start, put away the moment it goes live
  assert.match(s, /view\.pose\('welcome'\); view\.welcome\(true, best > 0\); view\.ghostBest\(false\);/);
  assert.match(s, /stage\.classList\.remove\('is-welcome'\); stage\.classList\.add\('is-live'\); view\.pose\('play'\); view\.welcome\(false\);/);
  assert.match(s, /tagT\.data = ghost \? `BEST \$\{best\} ↑` : `BEST \$\{best\}`;/, 'the welcome\'s tag: BEST 119, at the tape');
  const pose = n.match(/export const POSE = Object\.freeze\(\{ play: 0, welcome: ([\d.]+), end: ([\d.]+) \}\);/);
  assert.ok(pose && Number(pose[1]) >= 0.12 && Number(pose[1]) <= 0.2 && Number(pose[2]) >= 0.06 && Number(pose[2]) <= 0.14, 'the tower stands ≈ 70 % down on the welcome, a little lower than in play under the end\'s stats');
  assert.match(n, /NUM\[LIFT\] \+= \(liftTo - NUM\[LIFT\]\) \* \(1 - Math\.exp\(-dt \/ 170\) \* \(dt >= 1000 \? 0 : 1\)\);/, 'the camera EASES between the poses');
  assert.match(n, /pose\(kind\) \{ liftTo = POSE\[kind\] \|\| 0; if \(!frames\) NUM\[LIFT\] = liftTo; \}/, '… and stands there at once on the first frame');
  assert.match(n, /NUM\[WSL\] \+= \(\(welc \? 1 : 0\) - NUM\[WSL\]\) \* Math\.min\(1, dt \/ \(welc \? 260 : 120\)\);/, 'the welcome\'s slab fades the moment the run starts');
  assert.match(n, /BX\[8\] = NUM\[WSL\]; BX\[9\] = KIND\.slider; put\(WPINK, null, null\);/, 'the sign\'s pink, drawn as the sliding slab is');
  assert.match(n, /const ts = tapeFloor \? slabOf\(tapeFloor\) : tapeWelc \? slabs\[slabs\.length - 1\] : null, gh = !ts && ghost;/, 'YOUR BEST\'s gold tape round the waiting tower\'s top slab');
  // the words: no box, no panel, no pill — a shade, never a backing of their own
  const start = css.match(/\.hi-start \{[^}]*\}/g).join(' ');
  assert.doesNotMatch(start, /background|border|box-shadow/, '.hi-start has no backing, no border');
  assert.match(css, /\.hi-sign \{ display: inline-grid; justify-items: center; font: 900 calc\(var\(--hi-w\) \* 0\.225\)\/0\.94 var\(--font-display\);/, 'the sign: ≈ 88 px at 390 wide');
  assert.match(css, /\.hi-sign span \{ --e: #ff4fd8;/); assert.match(css, /\.hi-sign span:last-child \{ --e: #2f8dff;/);
  assert.match(css, /\.hi-start-go \{ font: 700 26px\/1 var\(--font-display\); letter-spacing: 0\.2em;/);
  assert.match(css, /\.hi-shade \{ position: absolute; inset: 0; pointer-events: none; opacity: 0;/); assert.match(css, /\.hi-stage\.is-welcome \.hi-shade, \.hi-stage\.is-ended \.hi-shade \{ opacity: 1; \}/);
  for (const m of css.matchAll(/\.hi-(?:start|sign|shade|ec|look)[^{]*\{([^}]*)\}/g)) assert.doesNotMatch(m[1], /border-radius: (?:[2-9]\d|\d{3,})px|border-radius: 999/, 'no pill anywhere on the two screens');
});

test('THE END = "A · THE HERO NUMBER": the cause small · the floor HUGE · FLOOR · THE BAND · the stats strip (PERFECTS · BEST STREAK · YOUR BEST / NEW BEST in gold) — ONE builder for the page\'s card and the cartridge\'s body; the tower stays lit; the ghost; the lines over the bar', () => {
  const e = read(`${HI}endscreen.js`), s = read(`${HI}stage.js`), f = read(`${HI}final.js`), n = read(`${HI}night.js`), fx = read(`${HI}night-fx.js`), css = read('css/highrise-play.css');
  assert.match(e, /const el = h\('div\.hi-ec', cause, n, line, strip\);/, 'top to bottom: the cause, the number, the line, the strip — nothing else');
  assert.match(e, /h\('div\.hi-ec-col', h\('span\.hi-ec-k', 'PERFECTS'\), perf\), h\('div\.hi-ec-col', h\('span\.hi-ec-k', 'BEST STREAK'\), streak\), bestCol\);/);
  assert.match(e, /line\.textContent = `FLOOR · \$\{BANDS\[bandAt\(f\)\]\.name\}`;/); assert.match(e, /bestK\.textContent = isNew && v \? 'NEW BEST' : 'YOUR BEST';/);
  assert.match(e, /^import \{ h \} from '\.\.\/\.\.\/ui\/dom\.js';\nimport \{ BANDS, bandAt \} from '\.\/bands\.js';$/m, 'a view\'s helper: DOM + the bands — no rules, no storage, no fetch');
  // ONE builder, two callers
  assert.match(s, /const EC = endCard\(\), check = h\('div\.hi-check', \{ hidden: true \}\);\n  const end = h\('div\.hi-end', \{ hidden: true \}, EC\.el\);/);
  assert.match(f, /const EC = endCard\(\), would = h\('div\.hi-fin-would', ''\);/); assert.match(f, /el\.replaceChildren\(EC\.el, would\);/);
  assert.doesNotMatch(s + f, /hi-end-t|hi-end-n|hi-fin-t|hi-fin-floor|hi-fin-best|perfectsLine/, 'the seven same-weight lines are gone from both');
  // the sizes: the number ≈ 150 px at 390 wide, the cause ≈ 20 px
  assert.match(css, /\.hi-ec-n \{[^}]*font: 700 calc\(var\(--hi-w\) \* 0\.385\)\/0\.86 var\(--font-num\);/); assert.match(css, /\.hi-ec-cause \{[^}]*font: 900 20px\/1\.16 var\(--font-display\); letter-spacing: 0\.16em;/);
  assert.match(css, /\.hi-ec-strip \{[^}]*grid-template-columns: 1fr 1fr 1fr;[^}]*border-top: 1px solid rgba\(255, 255, 255, 0\.22\); border-bottom: 1px solid rgba\(255, 255, 255, 0\.22\); \}/, 'two hairlines');
  assert.match(css, /\.hi-ec-col \+ \.hi-ec-col \{ border-left: 1px solid rgba\(255, 255, 255, 0\.22\); \}/, 'thin dividers');
  assert.match(css, /\.hi-ec-col\.is-best b \{ color: #ffd257; \}/); assert.match(css, /\.hi-ec\.is-made \.hi-ec-cause \{ color: #ffe08a;/);
  // the tower stays LIT: the pose, no backing on the console's frame; YOUR BEST above = the dashed ghost + BEST n ↑; a new best = the tape on the top slab
  assert.match(s, /view\.pose\('end'\); view\.ghostBest\(best > live\.floor\);/);
  assert.match(s, /if \(best > was && was > 0 && live\.floor > 0\) \{ tapeFloor = live\.floor; view\.setBest\(live\.floor, true\); \}/, 'NEW BEST: the solid gold tape round the top slab, with its flash');
  assert.match(css, /\.hi-final \{ position: absolute; inset: 0; z-index: 6; display: flex; flex-direction: column; \}/, 'the podium frame has no backing of its own: the tower shows');
  assert.match(css, /\.hi-final \.final\.is-solo \.burst, \.hi-final \.final\.is-solo \.winner, \.hi-final \.final\.is-solo > \.sheet-kicker \{ display: none; \}/);
  assert.match(fx, /if \(uDash > 0\.5 && fract\(vA \* \$\{TAPE_DASHES\.toFixed\(1\)\} \+ 0\.25\) > 0\.56\) discard;/, 'the ghost = the tape\'s own outline, dashed (the same program)');
  assert.match(n, /if \(tapeU\.uDash\.value !== \(gh \? 1 : 0\)\) tapeU\.uDash\.value = gh \? 1 : 0;/);
  assert.match(css, /\.hi-tag\.is-ghost \{ right: auto; left: 0; padding: 0; background: none; border: 0; color: #ffd257;/, 'BEST n ↑: plain gold words beside it');
  // the ghost floats CLEAR of the tower: its near corner over the top slab's far corner, as the diagonal camera sees them
  const pitch = 33 * Math.PI / 180, H = 0.14, gap = Number(n.match(/GHOST_MIN = ([\d.]+), GHOST_GAP = ([\d.]+);/)[2]), min = Number(n.match(/GHOST_MIN = ([\d.]+)/)[1]);
  const up = (sx, sz) => gap + (Math.max(min, sx) + Math.max(min, sz)) * Math.tan(pitch) / (Math.SQRT2 * H);
  assert.match(n, /export const ghostUp = \(sx, sz\) => GHOST_GAP \+ \(Math\.max\(GHOST_MIN, sx\) \+ Math\.max\(GHOST_MIN, sz\)\) \* Math\.tan\(CAM\.pitch \* Math\.PI \/ 180\) \/ \(Math\.SQRT2 \* SLAB_H\);/);
  for (const [sx, sz] of [[1, 1], [0.7, 0.9], [0.1, 1], [0.05, 0.05]]) {
    // (floors a slab's far corner stands above its near one on the screen = (sx + sz) · tan(pitch) / (√2 · H))
    const depth = (Math.max(min, sx) + Math.max(min, sz)) * Math.tan(pitch) / (Math.SQRT2 * H);
    assert.ok(up(sx, sz) - depth >= 1 && up(sx, sz) < 9, `a ${sx} × ${sz} top: the ghost hangs ${up(sx, sz).toFixed(1)} floors up — clear of the slab, still on the screen`);
  }
  // the two small lines sit just over the PLAY AGAIN bar — never in the strip
  assert.match(f, /const overBar = \(\) => \{ const fr = el\.closest\('\.final'\), foot = fr && fr\.querySelector\('\.final-foot'\); if \(foot && would\.nextElementSibling !== foot\) foot\.before\(would\); \};/);
  assert.match(f, /if \(o\.would\) \{ overBar\(\); would\.textContent = wouldLine\(o\.would\);/, 'WOULD COUNT: one small line over the bar');
  assert.match(s, /check\.hidden = !card \|\| !\(PAGE \|\| \(E && E\.note\)\);/, 'REPLAY = LIVE: the test page\'s alone');
  // THE FRESH-EYES REVIEW: the ghost's words sit beside its right corner — or OVER the arm's end where the screen's edge leaves no room (never struck through by the dashes)
  assert.ok(s.includes('const GHOST_TAG_UP = 26;') && s.includes('y = XY[1] * stageH - (ghost && gxr > stageW - 118 ? GHOST_TAG_UP : 0);'));
  assert.match(css, /\.hi-check \{ position: absolute; left: 16px; right: 16px; bottom: calc\(env\(safe-area-inset-bottom, 0px\) \+ 103px\);/);
});

test('NO PINK FLASH when a run ends: the console\'s crown wash is off in HIGH RISE\'s end screen — and a browser watch samples the frames', () => {
  const css = read('css/highrise-play.css'), comp = read('css/components.css');
  // the cause, still in the console (a WINNER's flash — other games keep it): the frame's ::before washes the accent over the whole screen
  assert.ok(comp.includes('.final.crowned::before'), 'the console crowns its podium frame (the cause, named)');
  assert.ok(css.includes('.hi-final .final::before { display: none; }'), 'HIGH RISE\'s end is how a tower fell: no wash at all');
  // the watch: a screencast of the end transition, every frame's pink share — a frame far over its before / after = a flash
  const fw = read('tests/integration/kit/flash-watch.mjs'), e2e = read('tests/integration/e2e-highrise.mjs'), pg = read('tests/integration/highrise-play.mjs');
  assert.ok(fw.includes('export const FLASH_OVER = 0.22;') && fw.includes('Page.startScreencast'), 'the frames come from the compositor, not from a timer');
  assert.ok(e2e.includes("import { flashWatch } from './kit/flash-watch.mjs';") && e2e.includes('fl.flash.length === 0') && e2e.includes('fl2.flash.length === 0'), 'the cartridge: the end + PLAY AGAIN');
  assert.ok(pg.includes('flashWatch(') && pg.includes('flashLook'), 'the test page: every cause, both looks');
});
