// HIGH RISE REVIEW FIX B (docs/highrise.md "THE SHARE CARD" + "THE END SCREEN"; docs/games/passes/highrise-fix-b.md):
// THE SHARE CARD = B · THE POSTER (the six hero shots, the card's words), the live-frame capture GONE, THE DAY END SCREEN, THE WOULD COUNT LINE.
// The pixels: tests/integration/highrise-share.mjs (every band, the gold finish, at 1080 · 540 · 300 — THE READABILITY) + highrise-play.mjs --end.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const HI = 'js/games/highrise/';

test('THE POSTER — the card\'s words from the PUBLIC numbers only · the hero shot = the band REACHED (THE MOTHERSHIP\'s for the finish) · FLOORS · BAND · N PERFECTS · NAME · ALL GOLD for the finish', async () => {
  const H = await import(new URL(`../${HI}share.js`, import.meta.url));
  const c = H.hiRunCard({ floor: 42, perfects: 31, cause: 'miss', made: false, mode: 'solo', name: 'Ben', pid: 'p-secret', uid: 'u1' });
  assert.equal(c.title, 'HIGH RISE'); assert.equal(c.mode, 'SOLO'); assert.equal(c.name, 'BEN'); assert.equal(c.big, '42'); assert.equal(c.bigUnit, 'FLOORS');
  assert.equal(c.line, 'MISSED THE STACK'); assert.equal(c.sub, 'FLOORS · THE SKYLINE'); assert.equal(c.stat, '31 PERFECTS · BEN'); assert.equal(c.hero, 'skyline'); assert.equal(c.gold, false); assert.equal(c.look, 'night');
  assert.ok(!JSON.stringify(c).includes('p-secret') && !JSON.stringify(c).includes('u1'), 'nothing private on the card');
  // the band reached picks the shot — at each band's first floor + its last
  for (const [f, id] of [[0, 'rooftops'], [24, 'rooftops'], [25, 'skyline'], [59, 'skyline'], [60, 'clouds'], [109, 'clouds'], [110, 'stars'], [169, 'stars'], [170, 'space'], [260, 'space']]) assert.equal(H.hiRunCard({ floor: f }).hero, id, `floor ${f} → ${id}`);
  const g = H.hiRunCard({ floor: 200, perfects: 171, cause: 'made', made: true, mode: 'match', name: 'BEN' });
  assert.equal(g.gold, true); assert.equal(g.accent, H.GOLD); assert.equal(g.mode, 'MATCH'); assert.equal(g.line, 'MADE IT TO THE MOTHERSHIP'); assert.equal(g.hero, 'mothership'); assert.equal(g.sub, 'FLOORS · DEEP SPACE');
  assert.equal(H.hiRunCard({ floor: 1, perfects: 1, cause: 'slow' }).sub, 'FLOOR · THE ROOFTOPS'); assert.equal(H.hiRunCard({ floor: 1, perfects: 1 }).stat, '1 PERFECT', 'no name → the perfects alone');
  assert.deepEqual([...H.HERO_IDS], ['rooftops', 'skyline', 'clouds', 'stars', 'space', 'mothership']);
  assert.match(H.heroUrl('clouds'), /\/assets\/highrise\/share\/clouds\.webp$/); assert.match(H.heroUrl('nope'), /\/rooftops\.webp$/, 'an unknown id → the first band, never a path from outside');
  assert.equal(H.runOf({ mode: 'solo', results: { u: { f: 57, p: 9, w: 'thin' } } }, 'u').floor, 57);
});

test('THE SIX HERO SHOTS ship small, 1080 × 1350 (WebP) — made by the poster pipeline (?poster=hero — the hero camera, no flyers) and listed the same in poster.js + share.js', async () => {
  const P = read(`${HI}poster.js`), S = read(`${HI}share.js`);
  const ids = [...P.matchAll(/Object\.freeze\(\{ id: '([a-z]+)'/g)].map(m => m[1]);
  assert.deepEqual(ids, ['rooftops', 'skyline', 'clouds', 'stars', 'space', 'mothership'], 'poster.js HEROES — the same ids as share.js HERO_IDS');
  for (const id of ids) {
    const f = new URL(`../assets/highrise/share/${id}.webp`, import.meta.url);
    assert.ok(existsSync(f), id);
    const b = readFileSync(f);
    assert.equal(b.toString('ascii', 0, 4), 'RIFF'); assert.equal(b.toString('ascii', 8, 12), 'WEBP');
    assert.ok(b.length < 120 * 1024, `${id}: ${(b.length / 1024).toFixed(0)} KB — a shot a phone fetches at SHARE`);
    const vp8 = b.indexOf('VP8 ');
    if (vp8 > 0) assert.deepEqual([b.readUInt16LE(vp8 + 14) & 0x3fff, b.readUInt16LE(vp8 + 16) & 0x3fff], [1080, 1350], `${id}: the card's own size`);
  }
  assert.match(P, /export const HERO_CAM = Object\.freeze\(\{ pitch: \d+, far: [\d.]+ \}\);/);
  assert.ok(read(`${HI}night.js`).includes('const PITCH = HERO && HERO.pitch > 0 && HERO.pitch < 80 ? HERO.pitch : CAM.pitch, FAR = HERO && HERO.far > 0 ? HERO.far : 1;'), 'THE HERO CAMERA: night.js o.cam (the test page\'s ?poster=hero only)');
  assert.ok(read(`${HI}stage.js`).includes('const flown = { jet: NOFLY, ufo: NOFLY, ship: NOFLY }'), 'NO FLYERS in a hero shot (the finish\'s pour stays — the gold shot\'s)');
  assert.ok(read(`${HI}play.js`).includes("M.runHero(mount(M.HERO_CAM, M.heroOf(Q.get('shot') || '') || M.HEROES[0])"), 'the page mounts the hero shot\'s camera + its seed, mode, floor');
  assert.match(S, /hero = await loadHero\(hiRunCard\(run\)\.hero\)/, 'the card loads the band\'s shot when it is drawn (lazy: the end screen\'s warm)');
});

test('THE LIVE FRAME IS GONE: no shot.js, no capture a beat after the end, no inner hero frame — night.js#snap stays for the poster pipeline only', () => {
  assert.ok(!existsSync(new URL(`../${HI}shot.js`, import.meta.url)), 'shot.js removed');
  const s = read(`${HI}stage.js`), sh = read(`${HI}share.js`), v = read(`${HI}view.js`), p = read(`${HI}poster.js`);
  assert.doesNotMatch(s, /keepShot|shotMs|takeShot|shotAt|shotRun/, 'the stage takes no frame of a run');
  assert.doesNotMatch(v, /shotKey/, 'the cartridge keeps no frame key');
  assert.doesNotMatch(sh, /shot\.js|shotFor|HI_CARD|shotCrop|drawRunCard/, 'the card has no hero frame / box');
  assert.ok(p.includes('S.view.snap(res, S.view.el.width)') && read(`${HI}night.js`).includes('snap(fn, width = 1080) { snapAsk = fn; snapW = width; },'), 'the poster pipeline still copies the canvas');
  assert.ok(read(`${HI}index.js`).includes("export const shareRun = (game, state) => lazyImport(import('./share.js'), './share.js').then(m => m.shareRun(game, state));"), 'SHARE on the footer, lazy (unchanged)');
  assert.ok(sh.includes("if (!here() || globalThis.__hiWould === m) return '';") && sh.includes("name: 'neon-speakeasy-high-rise.png', line: '', upload, onTap: true"), 'the link alone, uploaded at the tap — none while counting is OFF (unchanged)');
  assert.doesNotMatch(read(`${HI}stage.js`) + read(`${HI}play.js`), /share\.js'/, 'the test page never loads the share kit');
});

test('THE POSTER\'s pixels stay PNG-friendly (no dithered canvas gradient / shadow in the card itself) + the kit keeps a link under the server\'s hard cap', async () => {
  const sh = read(`${HI}share.js`), body = sh.slice(sh.indexOf('export function paintPoster'), sh.indexOf('export function drawHiCard'));
  assert.doesNotMatch(body, /createLinearGradient|createRadialGradient/, 'the washes are drawn small and stretched (wash · glowDisc)');
  assert.deepEqual(body.match(/shadowBlur[^;]*;/g), ["shadowBlur = (pass === 'wide' ? 64 : 22) * k;"], 'the number\'s glow only in the small layers (litLayer) — its core pass has no shadow');
  assert.ok(body.includes("litLayer(c, W, H, 1 / 6, lit, 'wide');") && body.includes("litLayer(c, W, H, 1 / 2, lit, 'tight');") && body.includes("for (const f of lit) f(c, 'core');"));
  assert.ok(sh.includes("if (pass === 'core') { c.fillStyle = core; } else"), 'a word\'s core pass: no shadow either');
  const K = read('js/games/kit/share-run.js');
  assert.ok(K.includes('if (least && least.size <= LINK_HARD && least.size < png.size) return least;'), 'fitPng: the smallest re-encode under LINK_HARD still goes up as a link');
  const { LINK_HARD } = await import(new URL('../js/games/kit/share-run.js', import.meta.url));
  assert.ok(read('api/_lib/share-card.js').includes('MAX_BYTES = 400 * 1024') && LINK_HARD < 400 * 1024, 'under the server\'s cap (read as text — THE UNIT JOB INSTALLS NOTHING)');
});

test('THE WOULD COUNT LINE: NEW BEST only when the floor BEATS the YOUR BEST shown (counting OFF: the server keeps no record — its own word is "best" for every run) · it wraps, never cut off', async () => {
  const { wouldLine } = await import(new URL(`../${HI}final.js`, import.meta.url));
  const w = { floor: 113, xp: 0, so: { n: 9, max: 4 }, best: true };
  assert.equal(wouldLine(w, 119), 'WOULD COUNT · FLOOR 113 · +0 XP · DAILY CAP', 'the owner\'s case: 113 under a best of 119 — no NEW BEST');
  assert.equal(wouldLine(w, 113), 'WOULD COUNT · FLOOR 113 · +0 XP · DAILY CAP', 'level with the best: not a new one');
  assert.equal(wouldLine(w, 112), 'WOULD COUNT · FLOOR 113 · +0 XP · DAILY CAP · NEW BEST', 'beaten: NEW BEST');
  assert.equal(wouldLine(w, 0), 'WOULD COUNT · FLOOR 113 · +0 XP · DAILY CAP', 'no best shown = a first run: YOUR BEST, never NEW BEST (the end screen\'s rule)');
  assert.equal(wouldLine(w), 'WOULD COUNT · FLOOR 113 · +0 XP · DAILY CAP · NEW BEST', 'no best handed in: the server\'s own word (S4B)');
  const f = read(`${HI}final.js`), css = read('css/highrise-play.css');
  assert.ok(f.includes('would.textContent = wouldLine(o.would, shownBest);') && f.includes('would.textContent = wouldLine(o.would, cleanBest(ls.get(SRV_BEST_KEY)));'), 'solo + match: the best this phone shows');
  assert.match(css, /\.hi-fin-would \{[^}]*padding: 0 16px;[^}]*white-space: normal; text-wrap: balance;/, 'it wraps inside the 16 px gutters (e2e-highrise measures it at 390 × 844 with the longest line)');
});

test('THE DAY END SCREEN: by day ONE soft still of the scene shows through a dark tint (darker over the words + the foot, lighter where the tower stands) — no CSS filter; night unchanged', () => {
  const s = read(`${HI}stage.js`), css = read('css/highrise-play.css');
  assert.ok(s.includes("const endBg = h('canvas.hi-endbg', { 'aria-hidden': 'true', width: 1, height: 1 });") && s.includes('play, endBg, shade, hud, tag,'), 'the still sits over the scene, under the veil');
  assert.ok(s.includes("stage.classList.add('is-ended'); tagDirty = true; endStill();") && s.includes("if (gone || n !== stillN || !stage.classList.contains('is-ended') || lookSeen !== 'day' || !view.snap || !stageW) return;"), 'taken once, after the end pose eased, a DAY scene only');
  assert.ok(s.includes("stillN++; stage.classList.remove('has-still');"), 'a new run drops it');
  assert.match(css, /\.hi-stage\.is-ended\.has-still\[data-look='day'\] \.hi-endbg \{ opacity: 1; \}/);
  assert.match(css, /\.hi-stage\.is-ended \.hi-shade \{ background: linear-gradient\(rgba\(7, 6, 11, 0\.5\) 0, rgba\(7, 6, 11, 0\.9\) 26%, rgba\(7, 6, 11, 0\.96\) 100%\); \}/, 'night: JAYWALK\'s veil, unchanged');
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/filter: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important;/g, ''), /(?:^|[\s;{])(?:-webkit-)?(?:backdrop-)?filter\s*:/, 'no filter in the game\'s sheet (the lag rules)');
});
