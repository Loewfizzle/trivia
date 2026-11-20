// HIGH RISE — S4B (docs/highrise.md · docs/games/passes/highrise-s4b.md): THE END SCREEN = JAYWALK'S STANDARD · THE LAG CHECK (PRE-WARM,
// `?lean=1`, what repaints in play, `?floor=N` counts toward nothing) · THE MATCH · THE RULE-SET TABLE. The STATIC half — the browser
// halves: tests/integration/highrise-play.mjs (`--end`) · e2e-highrise.mjs (the cartridge's end + YOUR TABLE's fixtures) · e2e-highrise-match.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const HI = 'js/games/highrise/';

// ---- GROUP 0 — THE END SCREEN
test('THE END = JAYWALK\'S STANDARD: ONE builder (the page\'s card + the cartridge\'s body) — the header, the cause, the floor + FLOORS, YOUR BEST · n, n PERFECTS · BEST STREAK n; nothing else', () => {
  const e = read(`${HI}endscreen.js`), s = read(`${HI}stage.js`), f = read(`${HI}final.js`), v = read(`${HI}view.js`);
  assert.match(e, /const el = h\('div\.hi-ec', header \? h\('div\.hi-ec-hd', endHeader\(header\)\) : null, cause, n, fl, bestL, line\);/, 'top to bottom: (the header) · the cause · the number · FLOORS · the best · the stats line');
  assert.match(e, /h\('b\.hi-hd-a', \{ 'aria-hidden': 'true' \}, 'HIGH'\), ' ', h\('b\.hi-hd-b', \{ 'aria-hidden': 'true' \}, 'RISE'\), h\('i\.hi-hd-m', \{ 'aria-hidden': 'true' \}, ` · \$\{m\}`\)/, 'the header\'s three words, each its own neon');
  assert.match(e, /const m = mode === 'match' \? 'MATCH' : 'SOLO';/);
  assert.match(e, /fl\.textContent = f === 1 \? 'FLOOR' : 'FLOORS';/);
  assert.match(e, /export const statsLine = \(perfects, streak\) => `\$\{say\(perfects\)\} PERFECT\$\{whole\(perfects\) === 1 \? '' : 'S'\} · BEST STREAK \$\{say\(streak\)\}`;/);
  assert.match(e, /bestL\.textContent = !v \? '' : nb \? \(whole\(was\) > 0 \? `NEW BEST · WAS \$\{say\(was\)\}` : 'NEW BEST'\) : `YOUR BEST · \$\{say\(v\)\}`;/, 'YOUR BEST · n — NEW BEST (· WAS n) when beaten — no line with no best');
  assert.match(e, /^import \{ h \} from '\.\.\/\.\.\/ui\/dom\.js';$/m); assert.equal((e.match(/^import /gm) || []).length, 1, 'a view\'s helper: DOM only — no rules, no storage, no fetch');
  // ONE builder, two callers; the cartridge's header = the console frame's kicker
  assert.match(s, /const EC = endCard\(\{ header: MODE === 'solo' \? 'solo' : 'match' \}\), check = h\('div\.hi-check', \{ hidden: true \}\);/);
  assert.match(f, /const EC = endCard\(\), would = h\('div\.hi-fin-would', ''\);/); assert.match(f, /el\.replaceChildren\(EC\.el, would\);/);
  assert.match(v, /kicker: endHeader\(/, 'the frame\'s kicker IS the header (HIGH RISE · SOLO / · MATCH in its own neon)');
  assert.match(f, /setTimeout\(overBar, 0\);/, 'WOULD COUNT leaves the body at once: YOUR TABLE sits right under the personal numbers');
  // a NEW BEST: only of a best that was BEATEN on the page; a shortcut run never sets or compares one
  assert.match(s, /EC\.best\(best, best > was && was > 0, was\);/);
  assert.match(s, /best = FROM \? was : nextBest\(was, live\.floor\);/, 'a `?floor=N` run never moves YOUR BEST');
  // SHARE waits for THE SHARE IMAGE (THE REVIEW): the universal footer shows it by itself once the cartridge exports shareRun
  assert.doesNotMatch(read(`${HI}index.js`), /shareRun/, 'no shareRun yet: the footer = PLAY AGAIN · CITY');
});

test('THE END\'s COLOURS ARE REAL NEON, never all white: HIGH hot pink · RISE cyan · the mode lavender · the cause SATURATED HOT PINK (gold for the finish) · the number the one white hero · YOUR BEST gold; JAYWALK\'s sizes + veil', () => {
  const css = read('css/highrise-play.css'), jw = read('css/jaywalk.css');
  assert.match(css, /\.hi-hd-a \{ color: #ff4fd8;/); assert.match(css, /\.hi-hd-b \{ color: #36c9ff;/); assert.match(css, /\.hi-hd-m \{ color: #c9b6ff;/);
  assert.match(css, /\.hi-ec-cause \{ max-width: 11\.5em; font: 900 min\(34px, calc\(var\(--hi-w\) \* 0\.087\)\)\/1\.06 var\(--font-display\); letter-spacing: 0\.04em; color: #ff4fd8; text-wrap: balance;/, 'the cause: JAYWALK\'s 34 px / 1.06, the letters THEMSELVES hot pink');
  assert.match(jw, /\.jw-fin-cause \{ max-width: 11\.5em; font: 900 34px\/1\.06 var\(--font-display\); letter-spacing: 0\.04em;/, '(JAYWALK\'s own cause — the reference)');
  assert.match(css, /\.hi-ec\.is-made \.hi-ec-cause \{[^}]*color: #ffc83c;/, 'MADE IT TO THE MOTHERSHIP = GOLD');
  assert.match(css, /\.hi-ec-n \{[^}]*font: 700 clamp\(84px, calc\(var\(--hi-w\) \* 0\.256\), 104px\)\/0\.95 var\(--font-num\);[^}]*color: #fff;/, 'the floor: huge, WHITE');
  assert.match(css, /\.hi-ec-n \{[^}]*rgba\(0, 240, 255, 0\.85\)/, '… with the cyan glow');
  assert.match(css, /\.hi-ec-fl \{[^}]*font: 700 15px\/1 var\(--font-ui\); letter-spacing: 0\.34em;/); assert.match(jw, /\.jw-fin-n > span \{ font: 700 15px\/1 var\(--font-ui\); letter-spacing: 0\.34em;/);
  assert.match(css, /\.hi-ec-best \{[^}]*color: #ffd257;/);
  // every colour on the veil reads ≥ 4.5 : 1 (the veil's lightest stop over a white sky = rgba(7, 6, 11, 0.76) → ≈ #42414a at worst)
  const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  for (const [what, hex] of [['HIGH', '#ff4fd8'], ['RISE', '#36c9ff'], ['the mode', '#c9b6ff'], ['the finish', '#ffc83c'], ['YOUR BEST', '#ffd257']]) assert.ok(ratio(hex, '#0a0914') >= 4.5, `${what} ${hex} on the night veil: ${ratio(hex, '#0a0914').toFixed(1)} : 1`);
  // the scene DIMMED behind it = JAYWALK's veil, number for number (night + day)
  const veilN = 'linear-gradient(rgba(7, 6, 11, 0.5) 0, rgba(7, 6, 11, 0.9) 26%, rgba(7, 6, 11, 0.96) 100%)', veilD = 'linear-gradient(rgba(7, 6, 11, 0.84) 0, rgba(7, 6, 11, 0.76) 16%, rgba(7, 6, 11, 0.9) 32%, rgba(7, 6, 11, 0.96) 100%)';
  assert.ok(jw.includes(`.jw-final { position: absolute; inset: 0; z-index: 6; display: flex; flex-direction: column; background: ${veilN};`) && jw.includes(`.jw-stage[data-look='day'] .jw-final { background: ${veilD}; }`));
  assert.ok(css.includes(`.hi-stage.is-ended .hi-shade { background: ${veilN}; }`) && css.includes(`.hi-stage.is-ended[data-look='day'] .hi-shade { background: ${veilD}; }`), 'the stage\'s shade behind the end = that veil');
  assert.ok(css.includes(`.hi-stage:not(.is-ended) > .hi-final { background: ${veilN}; }`), 'a podium with no end seen first (a refresh on it) wears the veil itself — never twice');
  // the frame: the kicker shown (the header), the winner block + the burst hidden in a solo run, JAYWALK's body grid
  assert.match(css, /\.hi-final \.final\.is-solo \.burst, \.hi-final \.final\.is-solo \.winner \{ display: none; \}/);
  assert.doesNotMatch(css, /\.hi-final \.final\.is-solo > \.sheet-kicker \{ display: none/);
  assert.match(css, /\.hi-fin \{ display: grid; justify-items: center; gap: 10px; padding: 6px 12px 4px; text-align: center; \}/); assert.match(jw, /\.jw-fin \{ display: grid; justify-items: center; gap: 10px; padding: 6px 12px 4px; text-align: center; \}/);
  // no pill on the card: no capsule radius on any of its rules
  for (const m of css.matchAll(/\.hi-(?:ec|hd|fin|table)[^{]*\{([^}]*)\}/g)) assert.doesNotMatch(m[1], /border-radius: (?:[2-9]\d|\d{3,})px|border-radius: 999/, 'no pill anywhere on the end screen');
});

// ---- GROUP 1 — THE LAG CHECK
test('THE PRE-WARM: everything a run can need is fetched, built + uploaded BEHIND THE WELCOME SCREEN — the look\'s five plates, every flyer, the programs; START waits ≤ 0.6 s for it; the trace counts any set-up after the first tap', async () => {
  const s = read(`${HI}stage.js`), n = read(`${HI}night.js`), fl = read(`${HI}flyers.js`), tr = read(`${HI}trace.js`);
  // the look on screen holds ALL FIVE plates (it was the current band + the next)
  assert.ok(n.includes("if (look === target) { for (let k = 0; k < 5; k++) wantPlate(look, k); continue; }"), 'the look on screen: all five plates, from the welcome on');
  assert.ok(n.includes("+ (target === 'day' ? 2048 : 0);"), '… asked again when the look on screen changes');
  // every flyer, behind the welcome — and kept
  assert.ok(s.includes("const FLY_ALL = ['blackbird', 'f22', 'ufo', 'mothership'];") && s.includes('const needAll = () => { for (let i = 0; i < FLY_ALL.length; i++) view.need(FLY_ALL[i]); };'));
  assert.match(s, /view\.flyReset\(\);\n    prewarm\(\);/, 'asked at every (re)start — never at a floor');
  assert.ok(fl.includes('ready: () => !!(geo.blackbird && geo.f22 && geo.ufo && geo.mothership),'));
  assert.ok(!/drop\(jet\.kind\)|drop\('ufo'\)|drop\('mothership'\)/.test(fl), 'a model stays after its moment: a second run uploads nothing');
  // warm = the warm frame drawn + the five plates + the reflection map in + no model waiting for its upload frame
  assert.ok(n.includes('if (!warmed || toUpload.length || upSlot) return false;') && n.includes('for (let k = 0; k < 5; k++) { const r = plates.get(k); if (!r || !r.done) return false; }') && n.includes('flyReady: () => !!fly && fly.ready(),'));
  assert.ok(s.includes('const warmOk = () => view.warm() && view.flyReady();'));
  assert.ok(s.includes('Promise.all([ready ? null : snd.whenReady(START_WAIT_MS), o.go ? o.go() : null, warm ? null : whenWarm(START_WAIT_MS)])'), 'START waits for it — never longer than the sounds\' own 0.6 s');
  assert.ok(s.includes('if (FlyMod) needAll();'), 'the flyers\' sounds are decoded at the START touch (the audio\'s unlock)');
  // the trace's check: first-time work while a run is live
  assert.ok(s.includes("if (liveRun && (k === 'plate' || k === 'compile' || k === 'audio')) TR.setup(k === 'plate' ? SETUP.upload : k === 'compile' ? SETUP.compile : SETUP.decode, liveRun.floor);"));
  assert.ok(s.includes('liveRun = run; };') && s.includes('shown = true; overAt = now; liveRun = null;'), 'live = from the first tap to the end card');
  const { createTrace, SETUP } = await import(new URL(`../${HI}trace.js`, import.meta.url));
  const T = createTrace(), L = createTrace({ lean: true });
  assert.equal(T.lines().pop(), 'SET-UP AFTER START: none');
  T.setup(SETUP.upload, 58); T.setup(SETUP.upload, 61); T.setup(SETUP.compile, 80);
  assert.equal(T.lines().pop(), 'SET-UP AFTER START: compile 1 @F80 · upload 2 @F58', 'counted by kind, the first one\'s floor');
  assert.deepEqual(T.worst().setup, { compile: 1, upload: 2, decode: 0, at: [80, 58, 0] });
  T.reset(); assert.equal(T.lines().pop(), 'SET-UP AFTER START: none', 'a new run starts clean');
  assert.match(L.lines()[0], /^TRACE · LEAN · 5 WORST FRAMES OF 0$/); assert.match(T.lines()[0], /^TRACE · 5 WORST FRAMES OF 0$/);
  assert.ok(tr.includes("num: 2048, tags: 4096 });") && s.includes('if (TR) { if (run.floor !== hudFloor) TR.ev |= EV.num; }') && s.includes('if (TR) { if (live) TR.ev |= EV.tags; }'), 'a landing\'s deferred DOM writes are NAMED in the trace (num · tags), never "none"');
});

test('`?lean=1` (the test page only): every DOM / CSS effect over the 3D view is OFF while a run is live — the glows, the transitions, the animations; the panel + the note say LEAN', () => {
  const s = read(`${HI}stage.js`), play = read(`${HI}play.js`), css = read('css/highrise-play.css');
  assert.ok(play.includes("lean: Q.get('lean') === '1',") && s.includes('LEAN = PAGE && !!o.lean;'), 'the page\'s flag — never the cartridge\'s');
  assert.ok(s.includes("class: LEAN ? 'is-lean' : null,") && s.includes('createTrace({ lean: LEAN })'));
  assert.match(css, /\.hi-stage\.is-lean\.is-live \.hi-hud, \.hi-stage\.is-lean\.is-live \.hi-hud \*, \.hi-stage\.is-lean\.is-live \.hi-tag, \.hi-stage\.is-lean\.is-live \.hi-tag \*, \.hi-stage\.is-lean\.is-live \.hi-fps \{\n  text-shadow: none !important; box-shadow: none !important; filter: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; animation: none !important; transition: none !important;/);
  assert.ok(s.includes('const canPop = !LEAN && !!call.animate;') && s.includes('if (!calm && !LEAN && band.animate)'), 'no Web Animation over the canvas in a LEAN run');
  assert.ok(s.includes("LEAN ? `TEST PAGE · LEAN${FROM ? ` · FROM FLOOR ${FROM}` : ''} · NOTHING COUNTS`"));
});

test('WHAT REPAINTS IN PLAY — the fixes: an ended call writes nothing, the clock keeps ONE text node; no filter / backdrop-filter in the game\'s sheet', () => {
  const s = read(`${HI}stage.js`), css = read('css/highrise-play.css');
  assert.ok(s.includes("if (callUntil && now > callUntil) { callUntil = 0; callPri = 0; if (!canPop) call.style.opacity = ''; if (later)"), 'the announcer\'s end: no class / opacity reset (a layout + a paint of an invisible line, 0.7–1.9 s after every call)');
  assert.doesNotMatch(s, /callUntil = 0; callPri = 0; call\.className = 'hi-call';/);
  assert.ok(s.includes("clock = h('div.hi-clock', clockT);") && s.includes('if (cap != null) { const text = clockText(left * TICK_HZ); if (clockT.data !== text) clockT.data = text; }'), 'the match\'s clock: one kept text node, written once a second');
  // nothing animated over the canvas in a live run but the lane's one-shot + the tag's ride (transform + opacity) — and no filter at all
  const live = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(live.replace(/filter: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important;/g, ''), /(?:^|[\s;{])(?:-webkit-)?(?:backdrop-)?filter\s*:/, 'no filter / backdrop-filter in css/highrise-play.css');
  assert.doesNotMatch(live, /transition:[^;}]*(?:text-shadow|box-shadow|filter)/, 'no transition of a glow');
  for (const m of live.matchAll(/@keyframes ([\w-]+) \{([^@]*?\})\s*\}/g)) assert.doesNotMatch(m[2], /text-shadow|box-shadow|filter/, `@keyframes ${m[1]} moves transform + opacity only`);
});

test('`?floor=N` counts toward NOTHING: the shortcut\'s perfects + streak are taken off what the announcer, the chime and the end card show; YOUR BEST is never set or compared', async () => {
  const s = read(`${HI}stage.js`);
  assert.ok(s.includes('if (FROM) { climbBy(FROM, null); skipP = run.perfects; skipS = run.streak; }'));
  assert.ok(s.includes('const st = e.streak - skipS;') && s.includes('if (st > streakTop) streakTop = st;') && s.includes("} else if (e.e === 'cut') { skipS = 0; }"), 'the announcer + the best streak count what was PLAYED; a cut ends the shortcut\'s streak too');
  assert.ok(s.includes('perfects: live.perfects - skipP, streak: FROM ? streakTop : live.maxStreak });'));
  assert.ok(s.includes('if (!FROM && crossedBest(best, e.floor)) {') && s.includes('const gold = live && !FROM && best > 0 && run.floor <= best,') && s.includes('best = FROM ? was : nextBest(was, live.floor);'), 'no gold line, no NEW BEST, nothing stored');
  // the chime climbs from its first step again (sounds.js#cuesOf's `skip`)
  const { cuesOf, chimeRate } = await import(new URL(`../${HI}sounds.js`, import.meta.url));
  const ev = [{ e: 'perfect', streak: 81 }];
  assert.equal(cuesOf(ev, false, [], 0, 80)[0].rate, chimeRate(1), 'the first perfect PLAYED after a ?floor=80 start = the scale\'s first step');
  assert.equal(cuesOf(ev, false, [], 0, 0)[0].rate, chimeRate(8), '(without the skip: the top of the scale)');
  assert.equal(cuesOf([{ e: 'perfect', streak: 90 }], false, [], 0, 80).length, 2, 'the streak\'s sparkle at the 10th perfect PLAYED');
  assert.equal(cuesOf([{ e: 'perfect', streak: 90 }], false, [], 0, 85).length, 1);
});
