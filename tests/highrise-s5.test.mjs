// HIGH RISE S5 — BEN'S NOTES (docs/games/passes/highrise-s5.md · docs/highrise.md "THE MATCH" · "THE SHARE IMAGE" · "THE BILLBOARD"):
// THE PLACE NUMBER (the altimeter gone), THE RANKED LIST in WATCH, 18 s, THE ANNOUNCER CHECK, ZERO GARBAGE IN A MATCH.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const HI = 'js/games/highrise/';

test('18 s — a silent ONLINE phone is out after JAYWALK\'s own IDLE_OUT (the owner, Nov 20; S4B had 12 s)', async () => {
  const H = await import(new URL(`../${HI}match.js`, import.meta.url)), J = await import(new URL('../js/games/jaywalk/director.js', import.meta.url));
  assert.equal(H.IDLE_OUT_MS, 18000);
  assert.equal(H.IDLE_OUT_MS, J.IDLE_OUT_MS, 'pinned equal to JAYWALK\'s');
  const game = { playAt: 1000, participants: { a: true } }, node = { go: 1000, c: { 0: { s: 'x', at: 5000 } } };
  assert.ok(!H.endedFor(game, node, 5000 + 17999, true) && H.endedFor(game, node, 5000 + 18000, true), 'online: out after 18 s of silence');
  assert.ok(!H.endedFor(game, node, 5000 + 18000 + H.DROP_WAIT_MS - 1, false), 'offline: + the dropped signal\'s wait');
});

test('THE PLACE NUMBER: 1 + the players STRICTLY over your floor (a level player shares your place) · the ordinals', async () => {
  const { placeOf, ordSuffix } = await import(new URL(`../${HI}rivals.js`, import.meta.url));
  const rows = [{ uid: 'a', floor: 12 }, { uid: 'b', floor: 10 }, { uid: 'c', floor: 10 }, { uid: 'me', floor: 10, me: true }, { uid: 'd', floor: 3 }];
  assert.equal(placeOf(rows, 10), 2, 'one over you → 2ND; the level ones share it');
  assert.equal(placeOf(rows, 13), 1); assert.equal(placeOf(rows, 2), 5); assert.equal(placeOf([], 4), 1);
  assert.deepEqual([1, 2, 3, 4, 8, 11, 12, 13, 21, 22, 23, 101].map(ordSuffix), ['ST', 'ND', 'RD', 'TH', 'TH', 'TH', 'TH', 'TH', 'ST', 'ND', 'RD', 'ST']);
});

test('ZERO GARBAGE IN A MATCH — nearest · mergeTags · matchCalls with kept scratch give the SAME answers as before, call after call', async () => {
  const { nearest, mergeTags, matchCalls } = await import(new URL(`../${HI}rivals.js`, import.meta.url));
  const rows = [{ uid: 'a', name: 'ALEX', floor: 60 }, { uid: 'b', name: 'BOB', floor: 57 }, { uid: 'c', name: 'CLEO', floor: 52 }, { uid: 'd', name: 'DEE', floor: 49 }, { uid: 'e', name: 'EVE', floor: 41 }, { uid: 'f', name: 'FINN', floor: 30 }, { uid: 'g', name: 'GUS', floor: 50 }];
  const NR = { above: [], below: [] }, A0 = NR.above, B0 = NR.below;
  for (const fl of [50, 61, 52, 20, 50]) {
    const fresh = nearest(rows, fl), kept = nearest(rows, fl, 3, NR);
    assert.deepEqual(kept.above.map(r => r.uid), fresh.above.map(r => r.uid), `above at ${fl}`);
    assert.deepEqual(kept.below.map(r => r.uid), fresh.below.map(r => r.uid), `below at ${fl}`);
  }
  assert.ok(NR.above === A0 && NR.below === B0, 'the same two lists, filled in place');
  const MT = { list: [], pool: [] };
  const sets = [
    [{ uid: 'c', name: 'CLEO', up: 2, y: 300 }, { uid: 'b', name: 'BOB', up: 7, y: 282 }, { uid: 'a', name: 'ALEX', up: 10, y: 220 }],
    [{ uid: 'a', name: 'ALEX', up: 0, y: 300 }, { uid: 'b', name: 'BOB', up: 0, y: 300 }, { uid: 'c', name: 'CLEO', up: 1, y: 290 }],
    [], [{ uid: 'b', name: 'BOB', up: 4, y: 250 }],
  ];
  for (const items of sets) {
    const fresh = mergeTags(items.map(x => ({ ...x }))), kept = mergeTags(items.map(x => ({ ...x })), 30, MT);
    assert.deepEqual(kept.map(g => [g.text, g.y, g.uids.slice()]), fresh.map(g => [g.text, g.y, g.uids]));
  }
  assert.ok(MT.pool.length <= 3, 'the merged tags\' records made once');
  const memo = { sides: {}, said: {} };
  const a1 = matchCalls(memo, { floor: 5, over: false }, [{ uid: 'a', name: 'ALEX', floor: 6, end: '' }, { uid: 'me', name: 'YOU', floor: 5, me: true }]);
  assert.equal(a1.length, 0, 'the start: nobody passed anybody');
  const a2 = matchCalls(memo, { floor: 7, over: false }, [{ uid: 'a', name: 'ALEX', floor: 6, end: '' }]);
  assert.deepEqual(a2.map(c => c.text), ['YOU PASSED ALEX']);
  const a3 = matchCalls(memo, { floor: 8, over: false }, [{ uid: 'a', name: 'ALEX', floor: 6, end: 'out' }]);
  assert.ok(a3 === a2 && a3.map(c => c.text).join() === 'ALEX IS OUT · 6', 'ONE list kept in the memo; your own row skipped');
  assert.equal(matchCalls(memo, { floor: 9, over: false }, [{ uid: 'a', name: 'ALEX', floor: 6, end: 'out' }]).length, 0, 'said once');
});

test('THE ALTIMETER IS GONE from live play — THE PLACE NUMBER in its corner, written only at a change; the ranked list in WATCH only; THE ANNOUNCER: big, 1.5 s, never a burst', () => {
  const hud = read(`${HI}matchhud.js`), s = read(`${HI}stage.js`), css = read('css/highrise-play.css'), v = read(`${HI}view.js`), sim = read(`${HI}matchsim.js`);
  assert.ok(s.includes('rivals(rows) { if (!matchOn) return; rivalRows = rows; const M = matchHud(); if (watchUi) M.altimeter(rows); tagDirty = true; },'), 'the list is built only while you watch');
  assert.ok(s.includes('MH.place(watchW || isOver(run) ? 0 : placeOf(rivalRows, here), rivalRows.length);'), 'THE PLACE NUMBER: while you climb, once a landing / a change');
  assert.ok(hud.includes('if (rank === placeV && n === placeT) return;'), 'written only when YOUR place changes');
  assert.ok(hud.includes("placeFx.className = `hi-place-fx ${rank < was ? 'is-up' : 'is-down'}`;"), 'the pulse: up cyan, down soft pink');
  assert.doesNotMatch(css, /\.hi-stage\.is-match\.is-live \.hi-alt/, 'no altimeter rule for a live run');
  assert.match(css, /\.hi-stage\.is-match\.is-live:not\(\.is-watch\):not\(\.is-over\):not\(\.is-final\) \.hi-place\.is-on \{ display: block; \}/, 'the show rule never beats the hide rules (THE CLOSE\'s review)');
  assert.ok(s.includes('card = true; overAt = performance.now();') && s.includes('MH.setTags(NO_TAGS, hexOfRival);'), 'THE CLOSE\'s review: after WATCH the page\'s card IS up (a tap = PLAY AGAIN), the watched tower\'s tapes + tags gone');
  assert.ok(v.includes("followUid = f; followPick = '';") && sim.includes("followUid = f; nextPick = '';"), 'a tap\'s pick is spent once followed');
  assert.match(css, /\.hi-stage\.is-watch \.hi-place, \.hi-stage\.is-over \.hi-place, \.hi-stage\.is-final \.hi-place \{ display: none; \}/);
  assert.match(css, /\.hi-place b \{ font: 700 50px/); assert.match(css, /\.hi-place\.is-first \.hi-place-in \{ color: #ffd257;/, '1ST in gold');
  assert.match(css, /\.hi-place-fx \{[^}]*will-change: opacity, transform;/, 'the pulse = its own layer: opacity + transform');
  assert.match(css, /\.hi-ann-in \{[^}]*font: 700 16px/, 'the announcer: one line, big');
  assert.ok(hud.includes('export const REPEAT_MS = 4000;') && hud.includes('if (at != null && now - at < REPEAT_MS) return;'), 'the same words twice inside 4 s = said once');
  assert.ok(hud.includes("const ann = createAnnouncer(lane, { prefix: 'hi', holdMs: 1500, queueMax: 3 });"), 'held 1.5 s');
  for (const m of css.matchAll(/\.hi-(?:place|alt)[^{]*\{([^}]*)\}/g)) assert.doesNotMatch(m[1], /border-radius: (?:[2-9]\d|\d{3,})px|border-radius: 999/, 'no pill');
  // ZERO GARBAGE IN A MATCH: the cartridge's pump — rows kept per rival, the live key once a game, YOUR numbers into a kept record
  assert.ok(v.includes('if (g !== lkGame) { lkGame = g; lkKey = liveKeyFor(g); }'), 'the live key once a game — never its JSON 10 × a second');
  assert.ok(v.includes('me = mine(g) ? S.me(meRec) : null') && v.includes('if (dirty) S.rivals(rowList);'), 'the rows: ONE record each, a change found field by field');
  assert.ok(hud.includes('if (names && names !== rosterRef) {'), 'the count\'s roster is not rebuilt from the same list');
  assert.ok(s.includes('const others = [], tagItems = [], lvPool = [], itemPool = [], NR = { above: [], below: [] }, MT = { list: [], pool: [] }, NO_TAGS = [];'));
  // the test page's bot room: OUT = WATCH there too, the page's own card once every bot is down (or after SIM_WATCH_MS)
  assert.ok(sim.includes('export const SIM_WATCH_MS = 45000;') && sim.includes('wantWatch: () => !api.watchOff && list.some(p => !rivalOver(p.R)),'));
  assert.ok(s.includes('const E = o.onEnd ? o.onEnd(live) : PAGE && matchOn && hook.sim && hook.sim.wantWatch() ? { watch: true, page: true } : null;'));
});

test('THE ANNOUNCER CHECK — the solo calls hold long enough to read (PERFECT · FASTER ≥ 1.2 s on screen)', () => {
  const s = read(`${HI}stage.js`);
  assert.ok(s.includes("else say(st > 1 ? `PERFECT ×${st}` : 'PERFECT', 'hi-call is-perfect', 1, 1500, now);"), 'PERFECT: 1.5 s (a new perfect replaces it — the same priority)');
  assert.ok(s.includes("if (!say('FASTER', 'hi-call is-fast', 2, 1500, now))"), 'FASTER: 1.5 s');
});

test('THE SHARE IMAGE — the card\'s words from the PUBLIC numbers only · JAYWALK\'s box · the crop zoomed on the top, never past an edge · ALL GOLD for the finish', async () => {
  const H = await import(new URL(`../${HI}share.js`, import.meta.url));
  const c = H.hiRunCard({ floor: 104, perfects: 93, cause: 'miss', made: false, mode: 'solo', name: 'Ben', pid: 'p-secret', uid: 'u1' });
  assert.equal(c.title, 'HIGH RISE'); assert.equal(c.mode, 'SOLO'); assert.equal(c.name, 'BEN'); assert.equal(c.big, '104'); assert.equal(c.bigUnit, 'FLOORS');
  assert.equal(c.line, 'MISSED THE STACK'); assert.equal(c.band, 'THE CLOUDS · 93 PERFECTS'); assert.equal(c.accent, H.PINK); assert.equal(c.gold, false);
  assert.ok(!JSON.stringify(c).includes('p-secret') && !JSON.stringify(c).includes('u1'), 'nothing private on the card');
  const g = H.hiRunCard({ floor: 200, perfects: 171, cause: 'made', made: true, mode: 'match', name: 'BEN' });
  assert.equal(g.gold, true); assert.equal(g.accent, H.GOLD); assert.equal(g.mode, 'MATCH'); assert.equal(g.line, 'MADE IT TO THE MOTHERSHIP'); assert.equal(g.band, 'DEEP SPACE · 171 PERFECTS');
  assert.equal(H.hiRunCard({ floor: 1, perfects: 1, cause: 'slow' }).bigUnit, 'FLOOR'); assert.equal(H.hiRunCard({ floor: 1, perfects: 1 }).band, 'THE ROOFTOPS · 1 PERFECT');
  assert.deepEqual({ ...H.HI_CARD.box }, { x: 48, y: 348, w: 984, h: 792 }, 'JAYWALK\'s hero box');
  const src = { width: 1080, height: 2337 }, box = H.HI_CARD.box;
  for (const [tx, ty] of [[0.5, 0.59], [0.02, 0.02], [0.98, 0.99], [0.5, 0.62]]) {
    const q = H.shotCrop(src, box, tx, ty);
    assert.ok(q.sx >= 0 && q.sy >= 0 && q.sx + q.sw <= src.width + 1e-6 && q.sy + q.sh <= src.height + 1e-6, `inside the frame (${tx}, ${ty})`);
    assert.ok(Math.abs(q.sw / q.sh - box.w / box.h) < 1e-6, 'the box\'s own shape — never stretched');
  }
  const q = H.shotCrop(src, box, 0.5, 0.59);
  assert.ok(Math.abs(q.sy + q.sh * H.TOP_AT - 0.59 * src.height) < 1, 'the top slab at TOP_AT of the box');
  assert.equal(H.runOf({ mode: 'solo', results: { u: { f: 57, p: 9, w: 'thin' } } }, 'u').floor, 57);
});

test('THE SHARE IMAGE is wired like JAYWALK\'s: the frame a beat after the end (night.js#snap → shot.js), SHARE on the console\'s footer (index.js#shareRun, lazy), drawn while the end screen is read, the link uploaded only at SHARE — and never while THE SWITCH says WOULD COUNT; the server takes HIGH RISE\'s run card only with a counted result', () => {
  const s = read(`${HI}stage.js`), n = read(`${HI}night.js`), ix = read(`${HI}index.js`), fin = read(`${HI}final.js`), sh = read(`${HI}share.js`), srv = read('api/_lib/share-card.js'), v = read(`${HI}view.js`);
  assert.ok(n.includes('if (snapAsk) { const ask = snapAsk; snapAsk = null; try { ask(grab(snapW)); } catch { ask(null); } }'), 'copied IN the frame it was drawn');
  assert.ok(s.includes("if (over && !endedAt && !watchW && t0 != null) { shotAt = now + shotMs(run.st === 'out' ? run.cause : run.st, run.st === 'made'); shotRun = startN; }") && s.includes('if (shotRun !== startN || !view.snap || watchW) return;'), 'YOUR tower\'s end — never a watched one');
  assert.ok(v.includes("shotKey: () => (cur && cur.key ? cur.key() : ''),") && v.includes('key: () => matchId };'), 'the cartridge keeps the frame under its match id');
  assert.ok(ix.includes("export const shareRun = (game, state) => lazyImport(import('./share.js'), './share.js').then(m => m.shareRun(game, state));"));
  assert.ok(fin.includes("lazyImport(import('./share.js'), './share.js').then(m => m.warmShare(game, state)).catch(() => {});"), 'drawn while the end screen is read');
  assert.ok((fin.match(/globalThis\.__hiWould = game\.matchId;/g) || []).length === 2, 'solo + match: WOULD COUNT marks the match');
  assert.ok(sh.includes("if (!here() || globalThis.__hiWould === m) return '';") && sh.includes("name: 'neon-speakeasy-high-rise.png', line: '', upload, onTap: true"), 'the link alone, uploaded at the tap — none while counting is OFF');
  assert.ok(srv.includes("export const RUN_GAMES = Object.freeze(['jaywalk', 'highrise'])"));
  assert.doesNotMatch(read(`${HI}stage.js`) + read(`${HI}play.js`), /share\.js'/, 'the test page never loads the share kit (its door: nothing from config / the dailies / Firebase)');
});

test('THE B1 BILLBOARD — Bowlby One as GENERATED path data (no font load) · HIGH over RISE, OPEN NOW on the dark band (never black-on-pink) · the art at the board\'s 848 : 448 · NOT wired into the city', async () => {
  const g = read(`${HI}billboard-glyphs.js`), B = await import(new URL(`../${HI}billboard.js`, import.meta.url)), G = (await import(new URL(`../${HI}billboard-glyphs.js`, import.meta.url))).HI_GLYPHS;
  assert.match(g, /^\/\/ GENERATED by scripts\/build-highrise-billboard\.mjs/); assert.match(g, /Bowlby One \(Google Fonts, SIL Open Font License 1\.1\)/);
  assert.deepEqual(Object.keys(G), ['high', 'rise', 'open']); for (const k of Object.keys(G)) assert.ok(G[k].d.length > 1000 && G[k].cap > 700 && G[k].w > 2000, k);
  assert.equal(B.BOARD_W / B.BOARD_H, 848 / 448);
  const L = B.layout(848, 448);
  assert.ok(L.high.base - L.high.cap >= 0 && L.high.base < L.rise.base - L.rise.cap && L.rise.base < L.bandY && L.open.base - L.open.cap > L.bandY && L.open.base < 448, 'HIGH over RISE over the band, OPEN NOW inside it');
  assert.ok(L.high.w <= 848 * 0.9 + 0.5 && L.rise.w <= 848 * 0.9 + 0.5 && L.open.w <= 848 * 0.86 + 0.5, 'never wider than the board');
  assert.ok(L.high.cap / 448 >= 0.17 && L.open.cap / 448 >= 0.094, 'at least JAYWALK\'s live poster\'s shares (word 0.17 · NOW OPEN 0.094 of the board) — the in-city proof: highrise-billboard.mjs');
  assert.match(read(`${HI}billboard.js`), /BAND = '#0d0614'/); assert.match(read(`${HI}billboard.js`), /c\.fillStyle = '#ffffff'; c\.fill\(p\);/, 'OPEN NOW white on the DARK band');
  const webp = readFileSync(new URL('../assets/city/highrise/billboard.webp', import.meta.url));
  assert.equal(webp.toString('ascii', 0, 4), 'RIFF'); assert.equal(webp.toString('ascii', 8, 12), 'WEBP'); assert.ok(webp.length < 200 * 1024, 'a sign a phone can load');
  const vp8 = webp.indexOf('VP8'), kind = webp.toString('ascii', vp8, vp8 + 4);
  if (kind === 'VP8 ') assert.deepEqual([webp.readUInt16LE(vp8 + 14) & 0x3fff, webp.readUInt16LE(vp8 + 16) & 0x3fff], [848, 448], 'the board\'s 848 × 448');
  for (const f of ['js/screens/harbor/signs.js', 'js/screens/harbor/scene.js', 'js/screens/harbor/jaywalk-art.js', 'js/core/harbor-trivision.js']) assert.doesNotMatch(read(f), /highrise|HIGH RISE/i, `${f}: the CITY chat installs it at go-live — not wired in this pass`);
});

test('THE CLOSE\'s REVIEW — the baked HUD is WARMED behind the welcome (no bake in a NEW BEST / first-call frame), at most SETS_KEPT digit sets kept (evicted ones zeroed), a new dpr resizes the backing, the share card\'s numbers are THE JUDGE\'s', async () => {
  const s = read(`${HI}stage.js`), b = read(`${HI}bakedtext.js`), sh = read(`${HI}share.js`);
  const { SETS_KEPT, parseShadows } = await import(new URL(`../${HI}bakedtext.js`, import.meta.url));
  assert.equal(SETS_KEPT, 2);
  assert.ok(s.includes("stage.classList.add('is-welcome'); warmHud();") && s.includes("if (best > 0 && !FROM && !matchOn) { stage.classList.add('is-gold'); BN.warm(); stage.classList.remove('is-gold'); }") && s.includes('BL.warm(`${cls}|${sk}`, words);'));
  assert.ok(b.includes('while (sets.size > SETS_KEPT)') && b.includes('if (S0.glyphs !== glyphs) zero(S0.glyphs);'), 'an evicted set\'s canvases are zeroed');
  assert.ok(b.includes('cssW = 0;   // (cssW: a new dpr') && b.includes('if (d !== dpr) { dpr = d; cssW = 0; }'));
  assert.ok(sh.includes('const run = shot && !judged ?'), 'the judge\'s numbers whenever it has spoken');
  assert.deepEqual(parseShadows('rgb(255, 255, 255) 0px 0px 2px, rgba(255, 79, 216, 0.95) 0px 0px 14px, rgba(10, 7, 22, 0.55) 0px 3px 0px'), [{ color: 'rgb(255, 255, 255)', x: 0, y: 0, blur: 2 }, { color: 'rgba(255, 79, 216, 0.95)', x: 0, y: 0, blur: 14 }, { color: 'rgba(10, 7, 22, 0.55)', x: 0, y: 3, blur: 0 }]);
  assert.deepEqual(parseShadows('0px 1px 0px rgb(10, 7, 22)'), [{ color: 'rgb(10, 7, 22)', x: 0, y: 1, blur: 0 }], 'colour last too');
  assert.deepEqual(parseShadows('none'), []);
});
