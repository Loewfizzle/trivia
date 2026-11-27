// FREEFALL F4B — THE SHARE CARD + SHARE (js/games/freefall/share.js + shot.js — docs/freefall.md "THE SHARE CARD"; HIGH RISE S5's share
// image is the pattern). The STATIC + PURE half (THE UNIT JOB INSTALLS NOTHING: no browser here): THE FRAME's numbers (when it is taken,
// what it shows), the card's words per cause, the MATCH line, the layout's numbers (the owner's spec — every letter ≥ 46 px of the 1080:
// it reads at 360 px wide), SHARE behind THE SWITCH, the lazy loading (the test page never loads the share kit). The pixels — real runs
// to every end, night + day, at 1080 × 1350 and 360 px wide: tests/integration/freefall-share.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { SHOT_AT, shotMs, BALL_AT, ballAt, SHOT_BOX, shotCrop, keepShot, shotFor, lastShot } from '../js/games/freefall/shot.js';
import { END_WORDS, seedOf } from '../js/games/freefall/logic.js';
import { AREAS } from '../js/games/freefall/tuning.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const FF = 'js/games/freefall/';
const share = () => import(new URL(`../${FF}share.js`, import.meta.url));

test('THE FRAME (shot.js): taken a beat after the end, per cause — always BEFORE the end card; the picture round the ball in the card\'s own box; kept under the run\'s key until the next run', () => {
  const st = read(`${FF}stage.js`);
  const hold = Number(/export const END_HOLD_MS = (\d+);/.exec(st)[1]), holdMade = Number(/export const END_HOLD_MADE_MS = (\d+);/.exec(st)[1]);
  assert.deepEqual(Object.keys(SHOT_AT).sort(), Object.keys(END_WORDS).sort(), 'a beat for every way a run ends (logic.js#END_WORDS)');
  for (const c of ['red', 'dark', 'cap']) assert.ok(SHOT_AT[c] > 0 && SHOT_AT[c] <= hold - 200, `${c}: ${SHOT_AT[c]} ms — well before the end card (${hold} ms)`);
  assert.ok(SHOT_AT.made >= 330 && SHOT_AT.made <= holdMade - 200, `THE BOTTOM: ${SHOT_AT.made} ms — after the ball lands on the seabed (300 ms: night.js), before the end card (${holdMade} ms)`);
  assert.ok(SHOT_AT.red >= 150 && SHOT_AT.red <= 300, 'the red: the slice is RED again (white-hot until ~130 ms — the screen review: a white wedge under a HIT THE RED tab), the sparks still in the air');
  assert.equal(shotMs('red'), SHOT_AT.red); assert.equal(shotMs('made'), SHOT_AT.made); assert.equal(shotMs(''), SHOT_AT.cap); assert.equal(shotMs('constructor'), SHOT_AT.cap, 'an unknown cause: at once, never a property of the table\'s prototype … a number');
  assert.equal(typeof shotMs('toString'), 'number'); assert.equal(typeof ballAt('toString'), 'number');
  for (const c of Object.keys(BALL_AT)) assert.ok(BALL_AT[c] >= 0.34 && BALL_AT[c] <= 0.46, `${c}: the ball ${BALL_AT[c]} down the frame — under the cause's tab, over the floors' number`);
  assert.deepEqual({ ...SHOT_BOX }, { w: 984, h: 792 }, 'THE BOX = the card\'s hero frame');
  // the crop: a phone (1170 × 2532 — its whole width), the ball 0.34 down the screen → 0.4 down the frame
  const p = shotCrop(1170, 2532, 0.5, 0.34, 0.4);
  assert.equal(p.w, 1170); assert.ok(Math.abs(p.h - 1170 * 792 / 984) < 1e-6); assert.equal(p.x, 0); assert.ok(Math.abs((0.34 * 2532 - p.y) / p.h - 0.4) < 1e-9, 'the ball where BALL_AT puts it');
  // a desk (1440 × 900): the phone's COLUMN round the ball, never the whole wide picture
  const d = shotCrop(1440, 900, 0.5, 0.34, 0.4, 0.47);
  assert.ok(Math.abs(d.w - 423) < 1e-6 && Math.abs(d.x + d.w / 2 - 720) < 1e-6, 'a wide screen: the column (0.47 of its height), centred on the ball');
  // never past an edge (the opening's ball low on the screen · a ball near a side)
  for (const [sw, sh, bx, by, at] of [[1170, 2532, 0.5, 0.02, 0.4], [1170, 2532, 0.5, 0.99, 0.4], [1440, 900, 0.02, 0.5, 0.4], [1440, 900, 0.99, 0.5, 0.4], [300, 200, 0.5, 0.5, 0.4]]) {
    const q = shotCrop(sw, sh, bx, by, at);
    assert.ok(q.x >= 0 && q.y >= 0 && q.x + q.w <= sw + 1e-6 && q.y + q.h <= sh + 1e-6 && Math.abs(q.w / q.h - 984 / 792) < 1e-6, `${sw} × ${sh} @ ${bx}, ${by}: inside the picture, the box's shape`);
  }
  // kept on this phone under the run's key; the one before it is let go (its pixels freed)
  const a = { width: 984, height: 792 }, b = { width: 984, height: 792 };
  keepShot({ key: 'm1', canvas: a, cause: 'red', floor: 12 });
  assert.equal(shotFor('m1').floor, 12); assert.equal(shotFor('m2'), null); assert.equal(shotFor(''), null); assert.equal(lastShot().key, 'm1');
  keepShot({ key: 'm2', canvas: b, cause: 'dark', floor: 3 });
  assert.deepEqual([a.width, a.height], [0, 0], 'the frame before it is freed'); assert.equal(shotFor('m1'), null); assert.equal(shotFor('m2').cause, 'dark');
  keepShot(null); assert.equal(lastShot(), null); assert.deepEqual([b.width, b.height], [0, 0]);
  assert.doesNotMatch(read(`${FF}shot.js`), /\bimport\b|document|fetch\(|localStorage/, 'shot.js: pure state + numbers — no import, no DOM, no fetch, no storage');
});

test('THE STAGE + THE SCENE: ONE small hook each — the frame JUST DRAWN is copied in that frame (no preserveDrawingBuffer), once a run, never in play', () => {
  const st = read(`${FF}stage.js`), n = read(`${FF}night.js`);
  assert.ok(st.includes("import { keepShot, shotFor, lastShot, shotMs, ballAt, shotCrop, SHOT_BOX } from './shot.js';"));
  // (right after the frame's own draw — the drawing buffer is still that frame's)
  assert.match(st, /view\.draw\(R0, tauD, dt, lead\);\n    if \(over && R0 === run && !spect && shotRun !== startN && t0 != null && now - endedAt >= shotMs\(run\.st === 'out' \? run\.cause : run\.st\)\) takeShot\(\);/, 'the capture: the line right after view.draw, a beat after the end, once a run — this phone\'s OWN run on screen (never a WATCHED player\'s, never a watcher\'s)');
  assert.ok(st.includes('const shotKey = () => { try { return String((o.shotKey && o.shotKey()) || seed); } catch { return seed; } };'), 'the key: the driver\'s (the cartridge: its match id) — else the run\'s seed');
  assert.match(st, /function takeShot\(\) \{\n    shotRun = startN;\n    if \(!view\.snap\) return;\n    try \{/, 'ONE try a run — whatever goes wrong never reaches the frame, and it is not tried again');
  assert.ok(st.includes('if (cv) keepShot({ key: shotKey(), canvas: cv, cause, made: !!res.made, floor: res.floor, blazes: res.blazes, look: lookT, ballX: cv.ballX, ballY: cv.ballY });'));
  assert.ok(st.includes('shot: () => shotFor(shotKey()),') && st.includes('shot: () => lastShot(),'), 'the stage\'s accessor + the checks\' hook');
  assert.doesNotMatch(n, /preserveDrawingBuffer:\s*true/, 'the canvas keeps no drawing buffer');
  assert.ok(n.includes('snap(bw, bh, rect) {') && n.includes('c.drawImage(el, q.x, q.y, q.w, q.h, 0, 0, bw, bh);') && n.includes('const b = proj(ball.position.x, ball.position.y, ball.position.z), q = rect(el.width, el.height, b[0], b[1], CAM.aspectMax);'), 'night.js#snap: the part round the ball → a 2D canvas of the box\'s size');
  assert.doesNotMatch(st + n, /from '\.\/share\.js'|import\('\.\/share\.js'\)/, 'neither loads the share kit');
});

test('THE CARD\'s WORDS — from the run\'s PUBLIC numbers only: the cause (the finish reads YOU HIT THE BOTTOM, gold), the floors, the deepest AREA, the BLAZES, the mode line (SOLO · MATCH · 2ND OF 4)', async () => {
  const H = await share();
  const c = H.ffRunCard({ floor: 87, blazes: 3, cause: 'red', mode: 'solo', name: 'Ben', pid: 'p-secret', uid: 'u1' });
  assert.equal(c.game, 'freefall'); assert.equal(c.title, 'FREEFALL', 'ONE word — never FREE FALL'); assert.equal(c.mode, 'SOLO'); assert.equal(c.name, 'BEN');
  assert.equal(c.big, '87'); assert.equal(c.bigUnit, 'FLOORS'); assert.equal(c.line, 'HIT THE RED'); assert.equal(c.area, 'THE SPEAKEASY'); assert.equal(c.blazes, '3 BLAZES'); assert.equal(c.gold, false); assert.equal(c.accent, H.TEAL); assert.equal(c.look, 'night'); assert.equal(c.result, '');
  assert.ok(!JSON.stringify(c).includes('p-secret') && !JSON.stringify(c).includes('u1'), 'nothing private on the card');
  // every cause: logic.js's table — but THE FINISH reads as its gold band does
  assert.equal(H.ffRunCard({ cause: 'dark' }).line, END_WORDS.dark); assert.equal(H.ffRunCard({ cause: 'dark' }).line, 'THE LIGHTS WENT OUT');
  assert.equal(H.ffRunCard({ cause: 'cap' }).line, END_WORDS.cap); assert.equal(H.ffRunCard({ cause: 'red' }).line, END_WORDS.red);
  const g = H.ffRunCard({ floor: 200, blazes: 1, cause: 'made', made: true, mode: 'match', place: 1, of: 4, name: 'BEN' });
  assert.equal(g.line, 'YOU HIT THE BOTTOM'); assert.equal(g.gold, true); assert.equal(g.accent, H.GOLD); assert.equal(g.area, 'THE BOTTOM'); assert.equal(g.mode, 'MATCH · 1ST OF 4'); assert.equal(g.blazes, '1 BLAZE'); assert.equal(g.cause, 'made');
  assert.equal(H.ffRunCard({ cause: 'made' }).gold, true, 'the cause alone makes the finish gold');
  assert.equal(/export const BOTTOM_WORDS = '([^']+)';/.exec(read(`${FF}stage.js`))[1], H.CARD_WORDS.made, 'the card\'s finish words = the stage\'s gold band');
  for (const k of ['red', 'dark', 'cap']) assert.equal(H.CARD_WORDS[k], END_WORDS[k]);
  for (const bad of ['', 'left', 'constructor', '__proto__', 'toString', undefined, null, 7]) assert.equal(H.ffRunCard({ cause: bad }).line, 'THE RUN IS OVER', `an unknown cause (${String(bad)}): a plain line, never a property of the table\'s prototype`);
  // the floors + the singular · the deepest area by floor (logic.js#areaOf — every area's first floor)
  assert.equal(H.ffRunCard({ floor: 1 }).bigUnit, 'FLOOR'); assert.equal(H.ffRunCard({ floor: 0 }).big, '0'); assert.equal(H.ffRunCard({ floor: 0 }).blazes, '0 BLAZES'); assert.equal(H.ffRunCard({ floor: -4.2, blazes: 'x' }).big, '0');
  for (const A of AREAS) assert.equal(H.ffRunCard({ floor: A.from }).area, A.name, `floor ${A.from} → ${A.name}`);
  assert.equal(H.ffRunCard({ floor: 39 }).area, 'THE ROOFTOP'); assert.equal(H.ffRunCard({ floor: 159 }).area, 'UNDER THE HARBOR'); assert.equal(H.ffRunCard({ floor: 612 }).area, 'THE TRENCH');
  // THE MODE LINE
  assert.equal(H.modeLine({ mode: 'solo' }), 'SOLO'); assert.equal(H.modeLine({ mode: 'match', place: 2, of: 4 }), 'MATCH · 2ND OF 4'); assert.equal(H.modeLine({ mode: 'match' }), 'MATCH', 'no place yet'); assert.equal(H.modeLine({ mode: 'match', place: 1, of: 1 }), 'MATCH'); assert.equal(H.modeLine({ mode: 'daily' }), 'DAILY'); assert.equal(H.modeLine(), 'SOLO');
  assert.deepEqual([1, 2, 3, 4, 8, 11, 12, 13, 21, 22, 23, 101, 111].map(H.ordinal), ['1ST', '2ND', '3RD', '4TH', '8TH', '11TH', '12TH', '13TH', '21ST', '22ND', '23RD', '101ST', '111TH']);
  assert.equal(H.ffRunCard({ mode: 'match', place: 8, of: 8 }).mode, 'MATCH · 8TH OF 8', 'the longest line of a full room fits the kit\'s 24 letters');
});

test('THE RUN\'s NUMBERS = THE JUDGE\'s rows (the host\'s results) + the MATCH line from the game\'s standings — a match place is the rank, of the participants', async () => {
  const H = await share();
  const solo = { mode: 'solo', matchId: 'm1', participants: { u: true }, results: { u: { f: 57, t: 900, w: 'dark', bl: 4, go: 1764200000000 } } };
  assert.deepEqual(H.runOf(solo, 'u'), { floor: 57, blazes: 4, cause: 'dark', made: false, mode: 'solo', place: 0, of: 0, go: 1764200000000 });
  const match = { mode: 'match', matchId: 'm2', participants: { a: true, b: true, c: true, d: true }, results: { a: { f: 120, t: 5000, w: 'red', bl: 2 }, b: { f: 200, t: 7000, w: 'made', bl: 6 }, c: { f: 120, t: 4000, w: 'dark' } } };
  assert.deepEqual([H.runOf(match, 'b').place, H.runOf(match, 'c').place, H.runOf(match, 'a').place, H.runOf(match, 'd').place], [1, 2, 3, 4], 'THE RANKING: the floors, then the earlier tick; no run = last');
  assert.equal(H.runOf(match, 'a').of, 4); assert.equal(H.runOf(match, 'b').made, true); assert.equal(H.runOf(match, 'b').mode, 'match');
  assert.equal(H.ffRunCard(H.runOf(match, 'a')).mode, 'MATCH · 3RD OF 4'); assert.equal(H.ffRunCard(H.runOf(match, 'b')).line, 'YOU HIT THE BOTTOM');
  assert.deepEqual(H.runOf(null, 'u'), { floor: 0, blazes: 0, cause: '', made: false, mode: 'solo', place: 0, of: 0, go: 0 }, 'no game: an empty run, never a throw');
  // the frame is found by the match's id (the cartridge's key) — else by the run's seed (logic.js#seedOf of its GO)
  const s = read(`${FF}share.js`);
  assert.ok(s.includes('const run = runOf(game, uid), shot = shotFor(m) || (run.go ? shotFor(seedOf(code, m, run.go)) : null), logo = await loadLogo();'));
  assert.equal(typeof seedOf('FALL', 'm1', 1764200000000), 'string');
});

test('THE CARD\'s LAYOUT (the owner\'s spec): 1080 × 1350 on the kit\'s drawRunCard — the logo ≈ 580 wide, the mode line teal, THE HERO FRAME 984 × 792 at 48, 348 with ONE neon edge, the dark tab, the number + FLOORS, the area lavender, the blazes fire orange, the name, the kit\'s foot; everything ≥ 46 px (reads at 360 px wide); NO pill', async () => {
  const H = await share(), s = read(`${FF}share.js`), K = read('js/games/kit/share-run.js'), D = read('js/daily/share.js');
  const { RUN_W, RUN_H } = await import(new URL('../js/games/kit/share-run.js', import.meta.url));
  assert.deepEqual([RUN_W, RUN_H], [1080, 1350]);
  assert.deepEqual({ ...H.FF_CARD.box }, { x: 48, y: 348, w: 984, h: 792 }, 'THE HERO FRAME: HIGH RISE S5\'s box'); assert.deepEqual([H.FF_CARD.box.w, H.FF_CARD.box.h], [SHOT_BOX.w, SHOT_BOX.h], '= the frame shot.js takes');
  assert.ok(H.FF_CARD.box.y + H.FF_CARD.box.h < H.FF_CARD.nameY - H.FF_CARD.namePx * 0.72 && H.FF_CARD.nameY < 1226, 'the name between the frame and the foot\'s line');
  assert.equal(H.HEAD.logoW, 580); assert.ok(H.HEAD.logoY + 580 * 568 / 1170 < H.HEAD.modeY - H.HEAD.modePx * 0.72, 'the logo ends over the mode line'); assert.ok(H.HEAD.modeY < H.FF_CARD.box.y - 8, 'the mode line over the frame');
  // everything reads at 360 px wide: a third of these — nothing under 46 px of the 1080 (≥ 15 px letters, ≥ 11 px caps)
  for (const k of ['causePx', 'unitPx', 'sidePx']) assert.ok(H.TYPE[k] >= 46, `${k} ${H.TYPE[k]}`);
  assert.ok(H.HEAD.modePx >= 46 && H.FF_CARD.namePx >= 52 && H.TYPE.bigPx >= 200, 'the mode line, the name, the number');
  assert.match(D, /let fs = 52, ls = 7; c\.font = `800 \$\{fs\}px "Chakra Petch", system-ui, sans-serif`;/, 'the kit\'s foot: NEONSPEAKEASY.COM at 52 px, bold');
  assert.ok(D.includes("c.shadowBlur = 7; c.fillStyle = '#fff3fb'; spacedText(c, ADDR, cx, y, ls);"), '… white-hot in its pink glow — plain lettering');
  // the colours: teal (gold for the finish) · lavender · fire orange · the game's accent pair (css/base.css — title-05's)
  assert.equal(H.PINK, '#ff4fa8'); assert.equal(H.TEAL, '#27e0e6'); assert.equal(H.GOLD, '#ffc83c');
  const E = read(`${FF}endscreen.js`); assert.ok(E.includes("pink: '#ff4fa8', teal: '#27e0e6'") && E.includes("gold: '#ffc83c'"), 'the end screen\'s own colours');
  assert.ok(s.includes('const { x, y, w, h } = box, r = 30, gold = !!card.gold, acc = gold ? GOLD : TEAL, T = TYPE;'), 'ONE accent: teal — gold for the finish (the edge, the tab\'s words)');
  assert.ok(s.includes('c.shadowColor = acc; c.shadowBlur = 30; c.fillStyle = core;') && s.includes("const core = gold ? '#fff3c8' : '#e2feff';"), 'the cause: teal neon, gold for the finish — never red');
  assert.ok(s.includes("glow = gold ? GOLD : CYAN") && s.includes("c.fillStyle = gold ? '#fff4cf' : '#f2feff'; drawNum(c, big, x0, by, px, NUMS, 700);") && s.includes('const NUMS = \'"Chakra Petch", system-ui, sans-serif\';'), 'the number: white-hot, a cyan glow, Chakra Petch numerals (gold on the finish)');
  assert.ok(s.includes('c.fillStyle = LAVENDER;') && s.includes('c.shadowColor = FIRE_GLOW; c.shadowBlur = 20; c.fillStyle = FIRE;'), 'the area lavender · the blazes fire orange');
  assert.ok(s.includes("const cv = drawRunCard(card, (c, box, k) => drawFfMiddle(c, box, k, shot), { ...FF_CARD, head: (c, k) => drawFfHead(c, k, logo) });"), 'ON the kit\'s drawRunCard: its ground, its name, its foot — FREEFALL\'s own head + middle');
  assert.ok(K.includes("if (o.head) { try { o.head(c, card); } catch (e) { console.warn('[share-run] head', e); } } else {"), 'the kit: a cartridge\'s own head in the place of the sign (JAYWALK + PRISM + OVERCLOCK pass none: unchanged)');
  assert.ok(K.includes("shareAddress(c, card.look, { W, color: '#ff6fc8' });"), 'THE FOOT stays the kit\'s');
  // NO PILLS: the only rounded shapes are the frame's window (r 30 of 792) and the tab's ONE soft corner
  const rr = [...s.matchAll(/roundRect\(([^)]*)\)/g)].map(m => m[1]);
  assert.deepEqual(rr, ['x, y, w, h, r', 'x, y, bw, bh, [0, 0, 18, 0]', 'x, y, w, h, r'], 'the frame\'s window (twice: the clip + the edge) + the tab hung square from its corner');
  assert.doesNotMatch(s, /\barc\(|ellipse\(|border-radius|999/, 'no capsule anywhere');
  // THE LOGO: the opening's lettering (the same file + revision the stage shows) — ONE word
  assert.match(H.LOGO_URL, /\/assets\/freefall\/title\/lettering-1170\.webp\?v=1$/);
  assert.equal(Number(/export const FF_ART_REV = (\d+);/.exec(read(`${FF}night.js`))[1]), H.LOGO_REV, 'the stage\'s own art revision: the picture is in the cache already');
  const b = readFileSync(new URL('../assets/freefall/title/lettering-1170.webp', import.meta.url));
  assert.equal(b.toString('ascii', 8, 12), 'WEBP'); assert.deepEqual([1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)], [1170, 568], 'the lettering\'s own size (the head\'s maths)'); assert.ok(b[20] & 0x10, 'with alpha');
  assert.doesNotMatch(s.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''), /FREE FALL/, 'never two words');
  // THE DARKNESS on a card that ended in it: the look's own dark (the stylesheet's)
  const css = read('css/freefall-play.css');
  assert.ok(css.includes(`--ff-dk: ${H.DARK.night.split(',').join(', ')};`) && css.includes(`--ff-dk: ${H.DARK.day.split(',').join(', ')};`), 'DARK = .ff-dark\'s own colours, night + day');
  assert.ok(s.includes("if (card.cause === 'dark') {"));
});

test('SHARE: lazy on the universal footer, the card DRAWN while the end screen is read, uploaded only at the first SHARE tap — and BEHIND THE SWITCH the picture alone goes out', async () => {
  const s = read(`${FF}share.js`), idx = read(`${FF}index.js`);
  assert.ok(idx.includes("export const shareRun = (game, state) => lazyImport(import('./share.js'), './share.js').then(m => m.shareRun(game, state));"), 'index.js#shareRun — exactly HIGH RISE\'s');
  assert.equal(read('js/games/highrise/index.js').match(/export const shareRun = [^\n]+/)[0], idx.match(/export const shareRun = [^\n]+/)[0]);
  assert.doesNotMatch(idx, /import [^\n]*from '\.\/share\.js'/, 'never a static import (the cartridge\'s start bundle)');
  assert.match(s, /export function warmShare\(game, state\) \{ try \{ prepRun\(game, state\)\.prep\.warm\(\); \} catch \{ \/\* the tap builds it \*\/ \} \}/);
  assert.match(s, /export function shareRun\(game, state\) \{ return prepRun\(game, state\)\.prep\.send\(\); \}/, 'the tap: nothing left to draw');
  assert.ok(s.includes("name: 'neon-speakeasy-freefall.png', line: '', upload, onTap: true"), 'the link alone (no text), uploaded at the tap');
  assert.ok(s.includes("const r = await api('daily', { action: 'shareCard', games: ['freefall'], run: { room: code, m }, png: b64 });"));
  // BEHIND THE SWITCH: WOULD COUNT (the end screen's flag — or the report's own answer) = no upload; a refused run is not asked again
  assert.ok(s.includes('if (globalThis.__ffWould === m) return true;') && s.includes('try { const o = Q && Q.outcomeFor(Q.matchKey(code, m)); return !!(o && o.would); } catch { return false; }'));
  assert.ok(s.indexOf("if (would()) return '';") > 0 && s.indexOf("if (would()) return '';") < s.indexOf('const png = await fitPng(half);'), 'asked BEFORE anything is fitted or sent');
  assert.ok(s.includes("if (!e || e.code !== 'no_run' || i === LINK_TRIES - 1 || !here() || would()) return '';"));
  assert.match(read('api/_lib/freefall.js'), /export const FREEFALL_COUNTS = false;/, 'THE SWITCH is OFF');
  const srv = read('api/_lib/share-card.js');
  assert.match(srv, /export const RUN_GAMES = Object\.freeze\(\['jaywalk', 'highrise', 'freefall'\]\)/, 'the server knows FREEFALL\'s run card …');
  assert.ok(srv.includes("if (!res || res.st !== 'done' || res.g !== g || !res.o || res.o[pid] == null) throw new ApiError(403, 'no_run'"), '… and takes it only with its own COUNTED result of that match, naming this player');
  assert.match(read('js/config.js'), /\{ id: 'freefall', name: 'FREEFALL', theme: 'freefall', [^\n]*playable: false, preview: true \}/, 'the game stays HIDDEN');
  // lazy pieces only: the store's live state (is this match still on screen), the api + the report's answer at the tap
  assert.deepEqual([...s.matchAll(/lazyImport\(import\('([^']+)'\)/g)].map(m => m[1]).sort(), ['../../profile/api.js', '../../profile/queue.js']);
  assert.deepEqual([...s.matchAll(/^import [^\n]* from '([^']+)';/gm)].map(m => m[1]), ['../kit/share-run.js', '../../daily/share.js', '../../ui/lazy-import.js', '../../store.js', '../jaywalk/numerals.js', './logic.js', './shot.js']);
});

test('THE TEST PAGE never loads the share kit: its graph gains shot.js alone (pure) — nothing of share / api / profile / the store', () => {
  const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
  for (const f of ['play.js', 'stage.js', 'night.js', 'shot.js', 'endscreen.js']) assert.doesNotMatch(code(`${FF}${f}`), /(from\s*|import\(\s*)'[^']*(share\.js|share-run|\/daily\/|profile\/|store\.js|firebase)[^']*'/, `${f}: imports nothing of the share kit`);
  assert.ok(existsSync(new URL(`../${FF}shot.js`, import.meta.url)) && existsSync(new URL(`../${FF}share.js`, import.meta.url)));
  assert.ok(read('tests/freefall-play.test.mjs').includes("'replay.js', 'sfx.js', 'shot.js', 'sounds.js', 'stage.js'"), 'tests/freefall-play.test.mjs pins the page\'s whole graph — with shot.js in it');
  assert.ok(existsSync(new URL('../tests/integration/freefall-share.mjs', import.meta.url)), 'the browser half');
});
