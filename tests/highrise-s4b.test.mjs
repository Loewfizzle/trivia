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
  assert.match(e, /const hd = header \? h\('div\.hi-ec-hd', endHeader\(header\)\) : null;\n  const el = h\('div\.hi-ec', hd, cause, n, fl, bestL, line\);/, 'top to bottom: (the header) · the cause · the number · FLOORS · the best · the stats line');
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
  assert.match(s, /best = FROM \|\| matchOn \? was : nextBest\(was, live\.floor\);/, 'a `?floor=N` run never moves YOUR BEST — nor a MATCH\'s floor (YOUR BEST is the solo best)');
  // SHARE waits for THE SHARE IMAGE (THE REVIEW): the universal footer shows it by itself once the cartridge exports shareRun
  assert.match(read(`${HI}index.js`), /export const shareRun = /, 'S5: THE SHARE IMAGE — the footer = PLAY AGAIN · SHARE · CITY');
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
  assert.ok(play.includes("lean: Q.get('lean') || '',") && s.includes("const leanQ = PAGE ? String(o.lean === true ? '1' : o.lean || '') : '', LEAN = leanQ === '1' || leanQ === 'all';"), 'the page\'s flag — never the cartridge\'s');
  assert.ok(s.includes("class: [LEAN ? 'is-lean' : '', ...[...LEANS].map(k => `lean-${k}`)].join(' ').trim() || null,") && s.includes('createTrace({ lean: LEAN })'));
  assert.match(css, /\.hi-stage\.is-lean\.is-live \.hi-hud, \.hi-stage\.is-lean\.is-live \.hi-hud \*, \.hi-stage\.is-lean\.is-live \.hi-tag, \.hi-stage\.is-lean\.is-live \.hi-tag \*, \.hi-stage\.is-lean\.is-live \.hi-fps, \.hi-stage\.is-lean\.is-live \.hi-place \* \{\n  text-shadow: none !important; box-shadow: none !important; filter: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; animation: none !important; transition: none !important;/);
  assert.ok(s.includes("const canPop = !LEANS.has('call') && !!call.animate;") && s.includes("if (!calm && !LEANS.has('band') && band.animate)"), 'no Web Animation over the canvas in a LEAN run');
  assert.ok(s.includes("LEAN || LEANS.size ? `TEST PAGE · LEAN${LEAN ? '' : ` (${[...LEANS].join(' ')})`}${FROM ? ` · FROM FLOOR ${FROM}` : ''} · NOTHING COUNTS`"));
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
  assert.ok(s.includes('if (!FROM && !matchOn && crossedBest(best, e.floor)) {') && s.includes('const gold = live && !FROM && !matchOn && best > 0 && run.floor <= best,') && s.includes('best = FROM || matchOn ? was : nextBest(was, live.floor);'), 'no gold line, no NEW BEST, nothing stored');
  // the chime climbs from its first step again (sounds.js#cuesOf's `skip`)
  const { cuesOf, chimeRate } = await import(new URL(`../${HI}sounds.js`, import.meta.url));
  const ev = [{ e: 'perfect', streak: 81 }];
  assert.equal(cuesOf(ev, false, [], 0, 80)[0].rate, chimeRate(1), 'the first perfect PLAYED after a ?floor=80 start = the scale\'s first step');
  assert.equal(cuesOf(ev, false, [], 0, 0)[0].rate, chimeRate(8), '(without the skip: the top of the scale)');
  assert.equal(cuesOf([{ e: 'perfect', streak: 90 }], false, [], 0, 80).length, 2, 'the streak\'s sparkle at the 10th perfect PLAYED');
  assert.equal(cuesOf([{ e: 'perfect', streak: 90 }], false, [], 0, 85).length, 1);
});

// ---- GROUP 2 — THE MATCH (the rules + whole-match sims: tests/highrise-match.test.mjs; here: the screen's static pins)
test('THE MATCH on the phone (view.js): GO is a TRANSACTION never applied locally · the seed + tick 0 from THE FIRST GO (the nodes are the truth) · the proof as a solo run\'s, sent at once · a match never starts by a tap, never parks its stage · a late joiner WATCHES', () => {
  const v = read(`${HI}view.js`), s = read(`${HI}stage.js`);
  assert.ok(v.includes("runTransaction(dbRef(path), curV => (curV == null ? serverTimestamp() : undefined), { applyLocally: false })"), 'GO: a transaction, never applied locally — the mirror holds confirmed GOs only');
  assert.ok(v.includes('const St = startOf(g, runs, code);') && v.includes('if (St && (mSeed !== St.seed || mPlayAt !== St.playAt) && (runs || g.unproven)) adoptMatch(St, runs);'), 'the seed + tick 0: match.js#startOf — in the count and in play alike; never adopted from the game alone while the proof mirror is on its way (a refresh mid-run)');
  // THE CLOSE's REVIEW: the podium is never held for ever · NOT COUNTED when this phone's GO was refused · a first run is YOUR BEST, never NEW BEST · the stand-in view has the match's handles · a pressed altimeter row is never moved
  assert.ok(v.includes('performance.now() - finalSeen > FINAL_HOLD_MS') && /export const FINAL_HOLD_MS = 3000;/.test(v), 'a tower still climbing when the match is over: the podium after FINAL_HOLD_MS');
  assert.ok(v.includes("g.unproven || !haveGo ? 'NOT COUNTED'"), 'OUT with no GO of this phone\'s: NOT COUNTED');
  assert.ok(read('js/games/highrise/final.js').includes('EC.best(floor, nb.was > 0, nb.was);'), 'the podium: NEW BEST only of a best that was beaten');
  assert.ok(/const NO_VIEW = \{ el: null, setRival\(\) \{\}, dimRivals\(\) \{\}, showRivals\(\) \{\},/.test(read('js/games/highrise/stage.js')), 'no WebGL: PLAY AGAIN never throws on a match handle');
  assert.ok(read('js/games/highrise/matchhud.js').includes('if ((key !== orderKey || more !== moreN) && !(heldAt && performance.now() - heldAt < 1500)) {'), 'NEVER RE-RENDER UNDER A FINGER: the altimeter\'s order waits while a row is pressed');
  assert.ok(v.includes("if (mine(g) && !goAsked && !haveGo && (g.phase === 'play' || (g.phase === 'count' && now >= g.playAt - GO_EARLY_MS))) askGoMatch();") && v.includes('export const GO_EARLY_MS = 1800;'), 'each phone writes its GO in the count\'s last 2 s (the rules\' window)');
  assert.ok(v.includes("if (mine(g)) S.adopt({ mode: 'match', seed: St.seed, t0: perfOf(St.playAt), taps: old || [] });") && v.includes("else S.spectate({ mode: 'match', seed: St.seed, t0: perfOf(St.playAt) });"), 'a participant plays (a rejoin: their own taps so far); anyone else WATCHES');
  assert.ok(v.includes('if (!force && now - lastFlush < (isMatch ? FLUSH_MATCH_MS : CLOCK.flushMs)) return;') && v.includes('export const FLUSH_MATCH_MS = 150;'), 'a rival\'s height is never a second old');
  assert.ok(v.includes("if (!isMatch && performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(S); else S.destroy();") && s.includes("if (t0 == null) { if (matchOn && !PAGE) return; begin(ts); return; }"));
  // the rivals: everyone's proof nodes through rivals.js; the calls through the match kit's announcer; Call the Winner = the kit's, `k` on your own node
  assert.ok(v.includes('if (!g.unproven) { feedRival(R, runs && runs[u]); capRival(R, tick); }') && v.includes('const calls = matchCalls(memo, me || noMe, rowList);') && v.includes('for (let i = 0; i < calls.length; i++) { const c = calls[i]; hud.announce(c.text, c.kind);'));
  assert.ok(v.includes("callEl = showCall({ canPick: u => !(liveRuns && liveRuns[u] && liveRuns[u].e != null),") && v.includes("path: `${nodePath()}/k`,"), 'Call the Winner: the match kit\'s — never a pick for a player whose end is already here');
  assert.ok(v.includes("(r.cause === 'miss' || r.cause === 'thin' || r.cause === 'slow') && since > CALL_AFTER_MS && g.phase === 'play' && !g.unproven && wroteE"), 'a call only from a player who is OUT (never the finisher / the bell), once their own end is written');
  // OUT = WATCH: the ranked list's pick · a tap's pick while they climb · the one you follow STAYS while they climb (S5) · else THE LEADER
  assert.ok(v.includes('const f = pickAny && rivals.has(pickAny) ? pickAny : follow(others, followPick || followUid);') && v.includes('S.watch({ uid: f, name: R.name, seed: mSeed, taps: R.taps, done: () => R.done });'));
  assert.ok(v.includes("txt = `WATCHING ${F.name} · ${F.floor}${live.length > 1 || F.over ? ' · TAP FOR THE NEXT' : ''}`;"));
  assert.ok(v.includes("kicker: endHeader(solo ? 'solo' : 'match')") && v.includes("note: `${g.unproven ? 'NOT COUNTED' : END_WORDS[(res[r.uid] || {}).w] || 'NO TOWER'} · ${perfectsLine(r.perfects)}`"), 'the podium: HIGH RISE · MATCH; every row its floor + how the tower ended + its perfects');
});

test('THE TAPES NEVER BLOCK THE PLAY (the stage + the scene): a rival under you = a tape on your tower — never the top slab, never in the bloom pass; at / over you = a tag in the clear column; the 3 nearest, merged; dim while a slab slides; a watched tower is never stepped to its fuse', async () => {
  const s = read(`${HI}stage.js`), n = read(`${HI}night.js`), hud = read(`${HI}matchhud.js`), css = read('css/highrise-play.css');
  const { RIVALS_SHOWN } = await import(new URL(`../${HI}rivals.js`, import.meta.url));
  assert.match(n, /export const RIVAL_TAPES = 3, RIVAL_DIM = 0\.45;/); assert.equal(RIVALS_SHOWN, 3); assert.match(hud, /export const RIVAL_TAGS = 3;/);
  assert.ok(n.includes('rs = rivalsOn && R.floor > 0 && R.floor < topFloor ? slabOf(R.floor) : null;'), 'a tape lies only on a floor UNDER the top slab');
  assert.ok(n.includes('twin(mesh, m); TWINS[TWINS.length - 1][1].visible = false;\n    RTAPES.push('), 'never in the bloom pass: no light past its own line');
  assert.ok(n.includes('NUM[RFACE] = 1; if (rivalDim) NUM[RFACE] = RIVAL_DIM;'), 'dim while a slab slides');
  assert.ok(s.includes("if (!r.over && r.floor === here - 1) { let q = lvPool[lv];") && s.includes('q.floor = here; others.push(q); }'), 'a rival still climbing one floor under you is LEVEL (a network\'s beat behind): a tag, never a tape flashing under your top slab');
  assert.ok(s.includes('const N = nearest(others, here, RIVALS_SHOWN, NR), zone = view.restZone() * stageH;') && s.includes('q.y = tagY(view.restY(Math.min(r.floor, here + 100)) * stageH, hudFoot, zone, 14, 12);') && s.includes('MH.setTags(mergeTags(tagItems, 30, MT), hexOfRival);'), 'the tags: the clear column, 12 px clear of THE DROP ZONE, merged within 30 px');
  assert.ok(s.includes("if (matchOn) { const sl = run.st === 'slide' && !watchW ? 1 : 0; if (sl !== dimWas) { dimWas = sl; MH.dim(sl === 1); view.dimRivals(sl === 1); } }"));
  assert.ok(s.includes('if (matchOn && live) placeRivals();') && s.includes("const gold = live && !FROM && !matchOn && best > 0 && run.floor <= best,"), 'a match\'s right-edge column is the rivals\': no gold line, no friend\'s');
  // WATCH: the tower from THEIR landed taps; its next slab ENTERS on the clock (seen sliding) and is HELD before its fuse
  assert.ok(s.includes('while (wN < tp.length && !isOver(run)) tap(run, tp[wN++], ev);') && s.includes('if (!isOver(run)) { const en = entryTick(run, Math.floor(FS[TAU])); if (en >= 0) stepTo(run, en, ev); }'));
  assert.ok(s.includes("else if (watchW && run.st === 'slide' && io[0] > run.s0 + 2 * run.S - 1) io[0] = run.s0 + 2 * run.S - 1;"));
  assert.ok(s.includes("if (watchW) { if (o.onWatchTap) o.onWatchTap(); else if (hook.sim && hook.sim.next) hook.sim.next(); return; }") && s.includes("if (ev.length && watchW) { T.feed(ev); view.events(ev); ev.length = 0; sounded = 0; hush = false; }"), 'a watcher\'s tap = the next player; a watched tower is drawn, never sounded');
  // the HUD: the kit's announcer; the ranked list (S5 — WATCH only): 44 pt rows; OUT = a cross + a struck name; no pill
  assert.ok(hud.includes("import { createAnnouncer } from '../kit/moments.js';") && hud.includes("const ann = createAnnouncer(lane, { prefix: 'hi', holdMs: 1500, queueMax: 3 });"));
  assert.match(css, /\.hi-alt \{[^}]*display: none; pointer-events: none;/); assert.match(css, /\.hi-stage\.is-match\.is-watch \.hi-alt \{ display: block; pointer-events: auto; \}/); assert.match(css, /\.hi-alt li \{[^}]*height: 44px;/);
  assert.match(css, /\.hi-alt li\.is-out \.hi-alt-n \{ text-decoration: line-through;/); assert.match(css, /\.hi-alt li\.is-out \.hi-alt-dot::before, \.hi-alt li\.is-out \.hi-alt-dot::after \{/, 'OUT = a cross + a struck name — never colour alone');
  assert.match(css, /\.hi-rtag\.is-dim \{ opacity: 0\.5; \}/); assert.doesNotMatch(css, /\.hi-rtags\.is-dim/, 'THE CLOSE: the dim is on the tags (compositor layers) — never on their full-stage box (it was a layout + paints at every landing)');
  assert.ok(read('js/games/highrise/matchhud.js').includes("dim(on) { dimOn = !!on; for (let i = 0; i < RIVAL_TAGS; i++) { const t = tags[i]; if (t.on && t.dim !== dimOn) {"), '… and a tag not shown is not written');
  for (const m of css.matchAll(/\.hi-(?:alt|rtag|ann|count|roster|watch|outcard)[^{]*\{([^}]*)\}/g)) assert.doesNotMatch(m[1], /border-radius: (?:[2-9]\d|\d{3,})px|border-radius: 999/, 'no pill anywhere in the match\'s HUD');
  // the test page's `?mode=match&rivals=N`: bot rivals, lazy, the page alone — the pixel test's room of 8
  assert.ok(s.includes("if (PAGE && MODE === 'match' && o.sim > 0) lazyImport(import('./matchsim.js'), './matchsim.js')") && read(`${HI}play.js`).includes("sim: Math.max(0, Math.min(7, Math.floor(Number(Q.get('rivals')) || 0))),"));
  assert.doesNotMatch(read(`${HI}matchsim.js`), /firebase|\/api\/|profile|store\.js|fetch\(/, 'the sim: the rules + the bots — nothing that counts');
});
