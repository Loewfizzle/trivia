// FREEFALL — THE STAGE (F2 — docs/freefall.md "THE TEST PAGE"; HIGH RISE's stage.js is the pattern): the run loop on the pure engine, the
// scene (night.js — F3: BOTH LOOKS, the shared DAY / NIGHT read live), the HUD, THE OPENING, THE HOLD, YOUR BEST, the sounds' cues, the end card — ONE module: the test page mounts
// it (play.js) and — F4A — the cartridge mounts the same one (view.js). It COUNTS NOTHING itself: no /api, no profile, no report, no
// database — the page hands it a best to read + write (this phone's); the cartridge hands it its hooks (`o.go` the GO → the seed + tick 0 ·
// `o.resume` a hold's way back, stamped · `o.onFrame` / `o.onOver` / `o.onEnd` / `o.onHide` — what a run WRITES is the view's: view.js).
//   · THE RUN: tick 0 = the START (the first drag — after ≤ 0.6 s for the sounds' decode: THE SOUND SYNC); the RULES never read the
//     clock — the stage turns it into ticks. FAIR INPUT: a move counts at the tick of its own EVENT TIME (pointermove's timeStamp, each
//     coalesced sample at its own) — 60 Hz and 120 Hz phones are equal. THE DRAG is 1 : 1 (the ring under the ball moves as far as the
//     finger — F1's scale, the owner's phone check); MAX SPIN's rest is offered again tick by tick (≤ 8 ticks owed).
//   · THE HOLD (SOLO — engine.js#hold): the page hidden / the phone locked = the run is HELD (a logged event the judge replays); back =
//     a 3 · 2 · 1, then on — EXACTLY where it was (F3 — THE HOLD = EXACT RESUME: the ball at the same point of its flight, the tower at
//     the same angle; nothing the finger does while PAUSED or in the count counts). A mode with no hold left (a match: none) runs on behind the hidden page.
//   · ZERO GARBAGE IN PLAY (HIGH RISE's LAG RULES): a live frame makes no objects of its own — the HUD writes only what changed, the
//     big number is BAKED (bakedtext.js), the cues are constants; what is left is what a LANDING makes (the engine's events, a sound's source).
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { TICK_MS, TURN, SLICES, BALL, SAFE, GAP, RED, MODES, MODE_IDS, MAX_SPIN, SEED_MAX, FIRST } from './tuning.js';
import { createRun, stepTo, turn, hold, isOver, resultOf, logOf, darkGap, floorNow } from './engine.js';
import { sliceStart, sliceUnder, kindAtTick, wrap, angDiff, floorInto } from './tower-gen.js';
import { replay, judgeRun } from './replay.js';
import { endWords, tickOf, areaOf, nextArrival, isArrival, arrivalWords } from './logic.js';
import { cleanBest, bestLine, crossedBest, nextBest } from './best.js';
import { CUE_NEW_BEST, CUE_FIREWORKS, BREAK_AT, BREAK_HIT_S, BOTTOM_HIT_S } from './sounds.js';
import { createTiers } from '../kit/tiers.js';
import { resolveLook, sunUpNow } from '../kit/look.js';
import { createNight, FF_ART_REV, SHAPE } from './night.js';
import { endCard } from './endscreen.js';
import { bakedNumber } from './bakedtext.js';
import { createBanner, BANNER_MS, BANNER_GOLD_MS } from './banner.js';

/** the wall behind the top of the screen is the area's of this many floors up (night.js#walls keeps a seam in sight that long) */
const INK_LAG = 5;
/** THE TRENCH's first floor: past it an arrival is a LAP's first floor (241 · 281 · …) */
const LAP0 = 201;
export const newSeed = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); };
/** the end card comes this long after EVERY end (the ball's last moment is seen) */
export const END_HOLD_MS = 700;
/** … and this long after a FINISH (F3B — THE BOTTOM: the last drop onto the seabed, the shockwave, the gold band, by night the firework) */
export const END_HOLD_MADE_MS = 2600;
/** THE BOTTOM's gold band: its words (the arrival's own stay THE BOTTOM · FLOOR 200 — logic.js) */
export const BOTTOM_WORDS = 'YOU HIT THE BOTTOM';
/** THE SPLASHDOWN: the mix goes under water for this long (s), from a moment after the plunge's own splash */
export const MUFFLE_S = 1.5, MUFFLE_AFTER_S = 0.25;
/** the START waits at most this long for the sounds' decode (THE SOUND SYNC — a first-ever touch is also the audio's unlock) */
export const START_WAIT_MS = 600;
/** THE HOLD's way back: 3 · 2 · 1, this long each */
export const COUNT_MS = 800;
/** the arrow keys (a desk): this many angle units a tick while one is held */
export const KEY_SPIN = 60;
/** the most turn the stage keeps owing when a flick out-runs MAX SPIN: 8 ticks of catching up (the rest of a wilder flick is dropped) */
export const OWED_MAX = 8 * MAX_SPIN;
/** a frame this long (after a run's first second) is a HITCH (`?fps=1` counts them) */
export const HITCH_MS = 33;
/** THE LOOK before the sun rule has answered (it is a lazy module): the phone's own clock — day from 7 to 19 (HIGH RISE's guess) */
export const guessLook = hour => (hour >= 7 && hour < 19 ? 'day' : 'night');
/** AUTO asks the sun again this often */
export const SUN_EVERY_MS = 60000;
/** F4A — THE CARTRIDGE's START: the tower's layout is the GO's own seed's (picked by the SERVER's time — it lands a moment after the first
 *  drag): the tower SPINS UP — one whole turn, eased, over this long — as the real floors take their place (a view's turn: it ends where it began) */
export const WHIP_MS = 420;
/** … a hold's way back whose stamp did not come: the 3 · 2 · 1 is run again this often before the run goes on with no stamp (the judge then counts it up to that hold) */
export const RESUME_TRIES = 3;
/** a press this soon after a restart starts nothing (the second tap of a double tap on PLAY AGAIN) */
export const RESTART_GUARD_MS = 350;

/** a button that acts on its own press + lift (never a click), and is never a drag on the tower */
function press(node, fn) {
  let id = null;
  node.addEventListener('pointerdown', e => { id = e.pointerId; e.stopPropagation(); });
  node.addEventListener('pointerup', e => { e.stopPropagation(); if (id === e.pointerId) { id = null; node.blur(); fn(e); } });
  node.addEventListener('pointercancel', () => { id = null; });
  node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fn(e); } });
  return node;
}
const ICON_AGAIN = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>';
const NO_VIEW = { el: null, reset() {}, feed() {}, draw() {}, pose() {}, setTier() {}, setLook() {}, lookNow: () => 'night', warm: () => true, setBest() {}, grey() {}, rest() {}, adopt() {}, pxPerRad: () => 112, project: () => [0.5, 0.5], frame: () => null, apexY: () => 0.2, info: () => ({}), lastWork: () => 0, destroy() {} };

export function createStage(app0, o = {}) {
  let app = app0, acIn = new AbortController();   // (the element the stage is mounted in — the cartridge moves a parked stage to its next view's: `moveTo`)
  const PAGE = !!o.page, FIXED = String(o.seed || '').slice(0, SEED_MAX);
  const MODE = MODE_IDS.includes(o.mode) ? o.mode : 'solo';
  const FROM = Math.max(0, Math.min(600, Math.floor(Number(o.from) || 0)));
  // THE LOOK (F3 — the match kit's shared DAY / NIGHT, games/kit/look.js): the console's GAME LOOK read LIVE (`o.lookNow` — F4's cartridge:
  // the host's AUTO · DAY · NIGHT; no switch of its own) · the test page: `?look=day|night` for a check (`o.look`), else AUTO — the phone's
  // clock at once, then THE SITE's OWN SUN RULE (sunUpNow: the city's sun at this phone's place), asked again every minute. Same rules in both looks.
  const LOOK_Q = o.look === 'day' || o.look === 'night' ? o.look : null, cleanLk = l => (l === 'day' ? 'day' : 'night');
  let lookT = o.lookNow ? cleanLk(o.lookNow()) : LOOK_Q || guessLook(new Date().getHours()), lookSeen = '';
  const bestAt = o.best || { read: () => 0, write() {} }, readBest = () => cleanBest(bestAt.read()), writeBest = n => bestAt.write(n);
  const ac = new AbortController(), sig = { signal: ac.signal };   // (unmounted: every listener on the document goes with it)
  let gone = false;
  // (THE HITCH LOG's clocks — set where the one-off work happens, read by hitchNow below)
  let hN = 0, worstMs = 0, domAt = -1e9, tierAt = -1e9;
  // THE SOUND SYNC (HIGH RISE S4A): a LIVE run holds the audio context awake — a lease renewed once a second from the frame
  // (audio/engine.js#holdAwake through its hub: THE STALE-MODULE RULE), let go on the end card, on a hold, on a hide
  const awake = on => { const f = globalThis.__nsHoldAwake; if (f) { try { f(on, 'freefall'); } catch { /* audio is polish */ } } };
  let awakeAt = 0;

  // ---- the page: the play area (the canvas — a drag ANYWHERE spins the tower), the HUD over it, THE OPENING, the hold, the end
  const play = h('div.ff-play', { role: 'application', 'aria-label': 'Freefall — drag left or right to spin the tower' });
  const dark = h('div.ff-dark', { 'aria-hidden': 'true' }), shade = h('div.ff-shade', { 'aria-hidden': 'true' });
  const topL = h('div.ff-best');
  const num = h('div.ff-num', { 'aria-label': '0' }, h('span.ff-dg', { 'aria-hidden': 'true' }, '0'));
  const call = h('div.ff-call', { 'aria-live': 'polite' }), warn = h('div.ff-warn', 'THE LIGHTS ARE GOING OUT');
  const hud = h('div.ff-hud', num, call, warn);   // (F3: F2's small area name under the number is gone — THE ARRIVAL BANNERS name an area as the ball reaches it)
  // THE ARRIVAL BANNERS (banner.js): a band across the foot of the screen on reaching an area — its text BAKED ahead of the arrival
  const BNR = createBanner();
  // THE OPENING's TITLE (F3 — title-05, the owner's pick): Grok's lettering + its tagline, two pictures over the LIVE tower (the F2 tube
  // sign + its dropping ball are gone). THE GLINT (.ff-glint): a band of light swept across the lettering, MASKED TO THE LETTERING's
  // OWN ALPHA (the mask = the very file the <img> picked — no second download), a 4-point star on the last letter as it leaves — CSS
  // only (transform + opacity), running only while the opening waits
  const art = (name, w) => new URL(`../../../assets/freefall/title/${name}-${w}.webp?v=${FF_ART_REV}`, import.meta.url).href;
  const sizesOf = k => `min(${Math.round(k * 100)}vw, ${Math.round(k * 60)}vh)`;   // (the stage's column: min(100vw, 60dvh) wide)
  const glint = h('i.ff-glint', { 'aria-hidden': 'true' }), star = h('i.ff-star', { 'aria-hidden': 'true' });
  const titleImg = h('img.ff-title-img', { alt: 'Freefall', decoding: 'async', draggable: 'false', sizes: sizesOf(0.85), srcset: `${art('lettering', 780)} 780w, ${art('lettering', 1170)} 1170w`, src: art('lettering', 780) });
  const maskNow = () => { const u = titleImg.currentSrc || titleImg.src; if (u) { const v = `url("${u}")`; glint.style.webkitMaskImage = v; glint.style.maskImage = v; glint.classList.add('is-ready'); title.classList.add('is-ready'); } };
  titleImg.addEventListener('load', maskNow);
  const title = h('div.ff-title', titleImg, glint, star);
  const tagline = h('img.ff-tagline', { alt: 'Fall as deep as you can', decoding: 'async', draggable: 'false', sizes: sizesOf(0.62), srcset: `${art('tagline', 780)} 780w, ${art('tagline', 1170)} 1170w`, src: art('tagline', 780) });
  const open = h('div.ff-open', title, tagline);
  const hint = h('div.ff-hint', { 'aria-hidden': 'true' }, h('i.ff-hint-a', '‹'), h('span.ff-hint-track', h('b.ff-hint-dot')), h('i.ff-hint-a', '›'));
  const foot = h('div.ff-foot', hint, h('div.ff-foot-t', 'DRAG TO SPIN'));
  const holdN = h('div.ff-hold-n'), holdL = h('div.ff-hold-l');
  const holdEl = h('div.ff-hold', { hidden: true, role: 'status' }, h('div.ff-hold-t', 'PAUSED'), holdN, holdL);
  const EC = endCard({ header: MODE === 'solo' ? 'solo' : MODE });
  const again = h('button.ff-again', { type: 'button' }, h('span.ff-again-i'), h('span.ff-again-t', 'PLAY AGAIN'));
  again.firstChild.innerHTML = ICON_AGAIN;
  // (the cartridge's own card — an UNPROVEN run's, a run with no signal — has the console's way out: `o.onLeave`)
  const share = h('button.ff-foot-b.ff-share', { type: 'button', disabled: true, 'aria-disabled': 'true' }, 'SHARE · SOON'), city = o.onLeave ? h('button.ff-foot-b.ff-city', { type: 'button' }, o.leaveWords || 'BACK') : h('a.ff-foot-b.ff-city', { href: '/' }, 'CITY');
  const end = h('div.ff-end', { hidden: true }, EC.el, h('div.ff-endfoot', again, h(`div.ff-foot-row${o.onLeave ? '.is-one' : ''}`, o.onLeave ? null : share, city)));   // (the cartridge's own card: no SHARE · SOON — the way out alone)
  const note = h('div.ff-note', PAGE ? 'TEST PAGE — NOTHING COUNTS YET' : '');
  let runNote = '';   // (the cartridge: an UNPROVEN run says so for as long as it is on — NOT COUNTED — …)
  const fpsA = document.createTextNode(''), fps = o.fps ? h('div.ff-fps', fpsA) : null;
  // THE SOUNDS (sfx.js — the SHARED audio engine's SFX bus; unlocked by the first touch, never before) + THE SOUNDS LIST (the page's sheet)
  let snd = null, sheetOpen = false;
  const soundsBtn = press(h('button.ff-snd', { type: 'button' }, 'SOUNDS'), () => {
    if (sheetOpen) return;
    sheetOpen = true;
    lazyImport(import('./audition.js'), './audition.js').then(A => A.openAudition({ press, onClose: () => { sheetOpen = false; last = 0; } })).catch(() => { sheetOpen = false; });
  });
  const stage = h('div.ff-stage.is-open', { 'data-look': lookT, 'data-area': 'rooftop' }, play, dark, shade, topL, hud, BNR.el, open, foot, holdEl, end, PAGE ? soundsBtn : null, PAGE || o.go ? note : null, fps);
  app.replaceChildren(stage);
  const hook = { ends: [], view: null, sfx: null, auto: null };
  // (the page installs the shared engine itself; in the console it is running long since)
  Promise.all([PAGE ? lazyImport(import('../../audio/engine.js'), '../../audio/engine.js') : null, lazyImport(import('./sfx.js'), './sfx.js')])
    .then(([E, S]) => { if (gone) return; if (E) E.installAudio(); S.fetchSounds(); Promise.resolve(S.decode()).catch(() => {}); snd = S; hook.sfx = S; }).catch(() => { /* silent: audio is polish */ });

  // ---- the view (the night look) + its quality tiers; a browser with no WebGL gets the stage + one line saying so
  const pin = o.tier == null ? null : Math.max(0, Math.min(2, o.tier));
  const noGL = () => h('p.ff-nogl', 'This browser can’t draw the game here (it has no WebGL).');
  let view, glDown = null;
  try { view = createNight(play, { tier: pin == null ? 2 : pin, dprMax: o.dpr || 0, look: lookT, skyShift: o.skyShift || 0 }); }
  catch { stage.append(noGL()); return null; }
  hook.view = view;
  const tierPath = [pin == null ? 2 : pin];
  const tiers = createTiers({ apply: t => { view.setTier(t); tierAt = performance.now(); if (tierPath.length < 40) tierPath.push(t); }, initial: pin == null ? 2 : pin });
  // THE LOST CONTEXT (JAYWALK's lesson — iOS takes a WebGL context away under memory pressure; the run is on the clock): the scene is
  // REBUILT — destroyed + created again on the same run — the moment the context is restored, or after 1.5 s without it. No context to
  // be had yet: the line says so, the run goes on, the rebuild tries again (every 1.5 s × 8, and when the page is back in front).
  let lostTimer = 0, rebuilds = 0, tries = 0;
  const onLost = e => { e.preventDefault(); if (!lostTimer) lostTimer = setTimeout(rebuild, 1500); };
  const onBack = () => rebuild();
  const watchGL = () => { if (view.el) { view.el.addEventListener('webglcontextlost', onLost); view.el.addEventListener('webglcontextrestored', onBack); } };
  const offGL = () => { if (view.el) { view.el.removeEventListener('webglcontextlost', onLost); view.el.removeEventListener('webglcontextrestored', onBack); } };
  function rebuild() {
    clearTimeout(lostTimer); lostTimer = 0;
    offGL();
    try { view.destroy(); } catch { /* it is gone already */ }
    try { view = createNight(play, { tier: tiers.get(), dprMax: o.dpr || 0, look: lookT, skyShift: o.skyShift || 0 }); }
    catch {
      view = NO_VIEW; hook.view = view;
      if (!glDown) { glDown = noGL(); stage.append(glDown); }
      if (++tries <= 8) lostTimer = setTimeout(rebuild, 1500);
      return;
    }
    if (glDown) { glDown.remove(); glDown = null; }
    tries = 0;
    view.reset(run); view.adopt(run, ev, fed); view.setBest(tapeFloor); view.pose(t0 == null && !starting ? 'open' : 'play', true);
    hook.view = view; rebuilds++; last = 0; warmed = false;
    watchGL();
  }
  watchGL();

  // ---- THE HUD: written only when it changes; the big number's digits keep their boxes, its glow is BAKED
  const BN = bakedNumber(num);
  // THE LOOK, live: the scene flips at once (night.js#setLook); the page's words follow the picture in the next frame (`data-look` — the
  // baked number is baked again in its day ink)
  function setLook(l) { lookT = cleanLk(l); view.setLook(lookT); }
  let sunTimer = 0;
  const askSun = () => sunUpNow(Date.now()).then(up => { if (!gone) setLook(resolveLook('auto', up)); }, () => {});
  if (!o.lookNow && !LOOK_Q) { askSun(); sunTimer = setInterval(askSun, SUN_EVERY_MS); }
  let numShown = -1, digits = 1;
  function setNum(n) {
    if (n === numShown) return;
    numShown = n;
    const s = String(n);
    if (s.length !== digits) { digits = s.length; num.replaceChildren(...[...s].map(d => h('span.ff-dg', { 'aria-hidden': 'true' }, d)), num.querySelector('.ff-numc')); }
    else for (let i = 0; i < s.length; i++) { const t = num.children[i].firstChild; if (t.data !== s[i]) t.data = s[i]; }
    num.setAttribute('aria-label', s);
    BN.set(n);
  }
  // THE ANNOUNCER: one call at a time, a bigger moment never wiped by a smaller (a Web Animations one-shot: opacity + transform, no reflow)
  let callUntil = 0, callPri = 0, callAnim = null, callText = '', callCls = '', callMs = 0, callAt = 0;
  const POP = [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1.12)', offset: 0.22 }, { opacity: 1, transform: 'scale(1)', offset: 0.4 }, { opacity: 1, transform: 'scale(1)', offset: 0.8 }, { opacity: 0, transform: 'scale(1.04)' }];
  // (F3B: THE BAND lies in the announcer's lane now — a call that comes while a band is up waits for it to leave, the biggest one wins)
  let pendText = '', pendCls = '', pendPri = 0, pendMs = 0, pendAt = 0;
  function say(text, cls, pri, ms, now) {
    if (BNR.showing()) { if (pri >= pendPri) { pendText = text; pendCls = cls; pendPri = pri; pendMs = ms; pendAt = now; } return; }
    if (now < callUntil && pri < callPri) return;
    domAt = now;
    callUntil = now + ms; callPri = pri; callText = text; callCls = cls; callMs = ms; callAt = now;
    call.textContent = text; call.className = `ff-call ${cls}`;
    if (callAnim) callAnim.cancel();
    callAnim = call.animate ? call.animate(POP, { duration: ms, easing: 'ease-out', fill: 'forwards' }) : null;
  }
  // ---- THE ARRIVALS: the band of the NEXT arrival is made ready between two arrivals (a timer — never the frame a ball lands in); an
  // arrival while a band is still up (THE TRENCH's, one floor after THE BOTTOM's) crosses after it
  let bnrQueued = -1, bnrTimer = 0, bedDue = 0;
  /** an arrival's band: its words + its class — THE BOTTOM's is the GOLD one (F3B: "YOU HIT THE BOTTOM") */
  const bandName = (floor, w) => (floor === BREAK_AT.seabed ? BOTTOM_WORDS : w.name), bandCls = floor => (floor === BREAK_AT.seabed ? 'is-gold' : '');
  /** F3B — THE STUTTERS: EVERY band a run can meet soon is baked AHEAD — the areas' six behind the opening (kept: the next run bakes nothing), a trench lap's between two arrivals */
  function prepBanner(from) {
    let f = from;
    for (let k = 0; k < 7; k++) { f = nextArrival(f); const w = arrivalWords(f); BNR.prepare(bandName(f, w), w.sub, bandCls(f)); if (f > LAP0) break; }   // (… the next six areas + the trench's first lap: from the roof, 40 · 80 · 120 · 160 · 200 · 201 · 241)
  }
  function arrive(floor) {
    // (THE BOTTOM's gold band comes with the IMPACT — a whole fall after the arrival's event; the run may be over by then: a finish.
    // The fresh-eyes review: the wait is THE FRAME's — bedDue, looked at before a frame's own events and never while the run is held; a
    // wall timer could cross behind THE TRENCH's band when the ball fell straight on through floor 200)
    if (floor === BREAK_AT.seabed) { bedDue = performance.now() + BOTTOM_HIT_S * 1000; return; }
    if (bedDue) { bedDue = 0; band(BREAK_AT.seabed); }   // (… the ball is already past it: THE BOTTOM's band first, this one after it)
    band(floor);
  }
  /** an arrival's band crosses now — or right after the one that is up */
  function band(floor) {
    if (BNR.showing()) { bnrQueued = floor; return; }
    const w = arrivalWords(floor), at = performance.now();
    // (the fresh-eyes review: a call that is UP when the band comes would lie under it — it is taken down, and said again after the band if its moment is not long gone)
    if (at < callUntil) {
      if (callPri >= pendPri) { pendText = callText; pendCls = callCls; pendPri = callPri; pendMs = callMs; pendAt = callAt; }
      callUntil = 0; callPri = 0; if (callAnim) { callAnim.cancel(); callAnim = null; }
    }
    domAt = at;
    BNR.show(bandName(floor, w), w.sub, bannerDone, bandCls(floor));   // (a `?floor=N` start can land past the ones made ready: baked now, once)
    clearTimeout(bnrTimer);
    bnrTimer = setTimeout(() => { if (!gone && !BNR.showing()) prepBanner(run.floor); }, (bandCls(floor) ? BANNER_GOLD_MS : BANNER_MS) + 250);
  }
  function bannerDone() {
    if (gone) return;
    if (bnrQueued >= 0) { const f = bnrQueued; bnrQueued = -1; band(f); return; }
    // (the call that waited for the band: said now, if its moment is not long gone)
    if (pendText) { const now = performance.now(), t = pendText, c = pendCls, p = pendPri, m = pendMs, old = now - pendAt > 1800; pendText = ''; pendPri = 0; if (!old) say(t, c, p, m, now); }
  }
  window.addEventListener('resize', () => BNR.dirty(), sig);   // (the band is baked for its width)

  // ---- the run: the pure engine on this page's clock
  let seed = '', run = null, t0 = null, shown = false, endedAt = 0, starting = false, startN = 0, warmed = false;
  let owed = 0, carry = 0, pre = 0, clamped = 0, drag = null, keyDir = 0, keyTick = 0, autoTick = 0;
  let held = false, heldT = 0, countAt = 0, countShown = 0, away = false, restartAt = -1e9;
  let whipAt = -1e9, countN = 0, countTries = 0, stamped = false, overTold = false;   // (F4A — the cartridge: the spin-up · a hold's way back + its stamp · the run's end told once)
  let best = readBest(), tapeFloor = 0, newBest = false, fromRun = false, hudFloor = -1, hudGap = -99, hudArea = '', hudInk = '', hitches = 0;
  let ev = [], fed = 0;
  const spotRec = { i: -1, twist: 0, gap: 0, red: 0, m1: 0, m2: 0 };   // (the checks' own floor record — hook.spot)
  const cues = [], FIREWORK_CUES = [CUE_FIREWORKS];
  /** F3B — THE FINISH's hook: what a finished run hands on (F4's cartridge wires the match here) · the last one, for the checks */
  let finished = null, handed = false;
  const reduceM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function restart(s = FIXED || newSeed()) {
    seed = s; run = createRun({ seed, mode: MODE }); t0 = null; shown = false; endedAt = 0; starting = false; startN++; restartAt = performance.now();
    ev = []; fed = 0; owed = 0; carry = 0; pre = 0; clamped = 0; drag = null; keyDir = 0; autoTick = 0;
    held = false; countAt = 0; away = false; hitches = 0; whipAt = -1e9; countN++; countTries = 0; stamped = false; overTold = false; runNote = '';
    if (!PAGE) note.textContent = '';
    worstMs = 0; hN = 0;
    best = Math.max(best, readBest()); tapeFloor = best; newBest = false; fromRun = false;   // (max: a phone whose storage is blocked still keeps its best for the visit)
    view.reset(run); view.setBest(tapeFloor); view.pose('open', true);
    end.hidden = true; holdEl.hidden = true; soundsBtn.hidden = false; note.hidden = false;
    stage.classList.remove('is-live', 'is-over', 'is-gold', 'is-held', 'is-near', 'is-starting'); stage.classList.add('is-open');
    topL.textContent = bestLine(best);
    hudFloor = -1; hudGap = -99; hudArea = ''; callUntil = 0; callPri = 0; if (callAnim) { callAnim.cancel(); callAnim = null; } call.textContent = ''; call.className = 'ff-call';
    // (THE BAKED HUD's warm-up: the plain + the gold digits are baked behind the opening — a NEW BEST bakes nothing in its frame)
    stage.classList.add('is-gold'); BN.warm(); stage.classList.remove('is-gold'); BN.dirty();
    setNum(0); hudArea = areaOf(0).name; hudInk = areaOf(0).id; stage.dataset.area = hudInk;
    bnrQueued = -1; clearTimeout(bnrTimer); BNR.clear(); prepBanner(0);
    bedDue = 0; pendText = ''; pendPri = 0; finished = null; handed = false;
    stage.dataset.dark = '';
  }
  /** `n` floors played at once through the REAL engine (a gap every time — the test page's `?floor=N` + the checks): the run goes on live from there */
  function dive(n) {
    while (!isOver(run) && run.floor < n) {
      const d = gapTurn(GAP);
      let rest = d;
      for (let t = Math.max(run.mt + 1, run.ll + 1, 0); t <= run.nl && rest !== 0; t++) rest -= turn(run, t, rest, ev);
      stepTo(run, run.nl, ev);
    }
    fed = ev.length;   // (played unseen + unheard)
  }
  /** the tower turn (angle units, signed: + = a drag to the right) that brings the middle of the nearest slice of `kind` — as the floor stands at the next landing — under the ball (0 = none) */
  function gapTurn(kind) {
    const fl = floorNow(run), p = wrap(BALL - run.a - fl.twist);
    let bestD = null;
    for (let k = 0; k < SLICES; k++) if (kindAtTick(fl, k, run.nl, run.R) === kind) { const d = angDiff(sliceStart(k) + 170, p); if (bestD == null || Math.abs(d) < Math.abs(bestD)) bestD = d; }
    return bestD == null ? 0 : -bestD;
  }
  function live(ts) {
    starting = false; stage.classList.remove('is-starting'); stage.classList.add('is-live');
    soundsBtn.hidden = true; note.hidden = !runNote;
    t0 = ts;
    if (FROM) { dive(FROM); fromRun = true; t0 = ts - run.t * TICK_MS; prepBanner(run.floor); }
    owed = Math.max(-OWED_MAX, Math.min(OWED_MAX, pre)); pre = 0;
    awakeAt = performance.now(); awake(true);
    if (document.visibilityState === 'hidden') hide();   // (it went live behind a hidden page — the start waited for the sounds: held at once, never lost to the dark unseen)
  }
  // THE START: the first drag. Tick 0 waits a moment (≤ START_WAIT_MS) until EVERY sound is decoded — no sound of a run ever takes the
  // late path (THE SOUND SYNC; a first-ever touch is also the audio's unlock). The logo + the hint fade and the camera sweeps down
  // meanwhile; the finger's first moves are kept (`pre`) and turn the tower from tick 0.
  function begin(ts) {
    if (starting || t0 != null || shown) return;
    starting = true; startN++;
    stage.classList.remove('is-open'); stage.classList.add('is-starting');
    view.pose('play');
    if (!warmed) warmed = view.warm(run);
    awakeAt = performance.now(); awake(true);   // (taken IN the touch — where iOS lets a context wake)
    const ready = !snd || !snd.ready || snd.ready();
    const m = startN;
    if (o.go) {
      // F4A — THE CARTRIDGE: GO (the proof node's first write — view.js) → the seed + tick 0 on the SERVER's clock; the sounds' decode is
      // waited for meanwhile. The answer: { seed, t0 (this page's clock at tick 0 — it may still lie ahead), note? (an UNPROVEN run's words) }
      const wait = ready ? Promise.resolve() : snd.whenReady(START_WAIT_MS).then(() => {}, () => {});
      Promise.all([Promise.resolve().then(() => o.go()), wait]).then(([G]) => { if (!gone && m === startN && starting) adoptGo(G || { seed: FIXED || newSeed(), t0: performance.now(), note: '' }); }, () => { if (!gone && m === startN && starting) adoptGo({ seed: FIXED || newSeed(), t0: performance.now(), note: '' }); });
      return;
    }
    if (ready) { live(ts); return; }
    snd.whenReady(START_WAIT_MS).then(() => { if (!gone && m === startN && starting) live(performance.now()); }, () => { if (!gone && m === startN && starting) live(performance.now()); });
  }
  /** F4A — the GO's answer: the run is the GO's own seed's (the opening stood on a stand-in tower: the real floors take their place as the
   *  tower SPINS UP — WHIP_MS), tick 0 = `G.t0` */
  function adoptGo(G) {
    seed = String(G.seed); run = createRun({ seed, mode: MODE }); ev = []; fed = 0;
    view.reset(run); view.setBest(tapeFloor);
    whipAt = reduceM ? -1e9 : performance.now();
    runNote = String(G.note || ''); note.textContent = runNote;
    prepBanner(0);
    live(Number(G.t0) || performance.now());
  }

  /** the checks' own hand (`hook.auto` — never a player's): 'gap' = every floor's gap (a dive: THE BLAZE) · 'play' = a bounce a floor, then its gap ·
   *  'smash' = gaps until THE BLAZE is lit, then solid ground (a shatter) · 'safe' = stay on safe ground · 'red' = onto the red */
  function autoTurn(T) {
    const a = hook.auto, n = Math.max(1, Math.min(4, T - autoTick)), lim = 90 * n;
    let want = gapTurn(a === 'red' ? RED : a === 'safe' || (a === 'play' && run.fl !== 'bounce') || (a === 'smash' && run.blaze) ? SAFE : GAP);
    // (F3B — 'play' never turns ACROSS red: if the gap is further than the tower can turn before the next landing, it stops on the last
    //  ground short of it that is not red, and goes on from there the bounce after — the checks' runs reach the floor they are sent to)
    if (a === 'play' && !run.blaze) {
      const fl = floorNow(run), reach = 90 * Math.max(0, run.nl - T), dir = want < 0 ? -1 : 1;
      let part = Math.abs(want) > reach ? reach : Math.abs(want);
      while (part > 0 && kindAtTick(fl, sliceUnder(wrap(run.a + dir * part), fl.twist), run.nl, run.R) === RED) part -= 170;
      want = part > 0 ? dir * part : 0;
    }
    owed = want > lim ? lim : want < -lim ? -lim : want;
  }
  /** offer the turn still owed, tick by tick up to tick T (MAX SPIN: at most 171 units count at one tick — the tower catches up) */
  function settle(T) {
    for (let t = Math.max(run.mt + 1, run.ll + 1, 0); t <= T && owed !== 0 && !isOver(run); t++) { owed -= turn(run, t, owed, ev); if (owed !== 0) clamped++; }
  }
  /** FAIR INPUT: a move counts at the tick of its own EVENT TIME (pointermove's timeStamp → the nearest tick) — never "the next frame" */
  function move(ts, units) {
    if (!units || shown || held) return;
    if (t0 == null) { if (starting) pre += units; return; }
    if (isOver(run)) return;
    const T = tickOf(ts, t0);
    if (T < 0) { owed += units; if (owed > OWED_MAX) owed = OWED_MAX; else if (owed < -OWED_MAX) owed = -OWED_MAX; return; }   // (F4A — the cartridge: tick 0 still lies ahead — the move turns the tower from tick 0, as a move before the first drag's start does)
    settle(T - 1);          // (what was still owed belongs to the ticks before this move)
    owed += units;
    owed -= turn(run, T, owed, ev);
    if (owed > OWED_MAX) owed = OWED_MAX; else if (owed < -OWED_MAX) owed = -OWED_MAX;   // (a wild flick: never more than 8 ticks — 0.13 s — of catching up after the finger)
  }
  const stamp = ts => { const now = performance.now(); return ts > 0 && ts <= now + 4 && now - ts < 1000 ? ts : now; };   // (a browser whose event clock is not the page's: the handler's own time)
  const onUi = e => !!(e.target && e.target.closest && e.target.closest('button, a, .sheet, .sheet-backdrop'));
  // (the whole page is the drag's ground — the dark bars beside the phone's column on a wide screen too)
  function wire() {
  const sig = { signal: acIn.signal };
  app.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (onUi(e) || shown || sheetOpen) return;
    if (drag) return;                                               // (a second finger never steals the drag: the first one keeps it)
    if (t0 == null) { if (performance.now() - restartAt < RESTART_GUARD_MS) return; begin(stamp(e.timeStamp)); }   // (the tail of a double tap on PLAY AGAIN is not a start)
    drag = { id: e.pointerId, x: e.clientX };
    try { app.setPointerCapture(e.pointerId); } catch { /* fine */ }
  }, sig);
  app.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    // every sample the browser gathered since the last frame, each at its own time (a 120 Hz finger on a 60 Hz frame)
    const list = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null, n = list && list.length ? list.length : 1;
    for (let i = 0; i < n; i++) {
      const s = list && list.length ? list[i] : e;
      // 1 : 1 — the ring under the ball moves exactly as far as the finger: px → radians (the view's px per radian) → angle units
      carry += (s.clientX - drag.x) * TURN / (2 * Math.PI * view.pxPerRad());
      drag.x = s.clientX;
      const units = Math.trunc(carry);
      carry -= units;
      move(stamp(s.timeStamp), units);
    }
  }, sig);
  const lift = e => { if (drag && drag.id === e.pointerId) drag = null; };
  app.addEventListener('pointerup', lift, sig); app.addEventListener('pointercancel', lift, sig);
  app.addEventListener('touchmove', e => { if (!onUi(e)) e.preventDefault(); }, { passive: false, signal: acIn.signal });   // (no page scroll under a finger)
  }
  wire();
  document.addEventListener('keydown', e => {
    if (sheetOpen) return;
    if (shown && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); playAgain(); return; }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (shown || held) return;   // (THE REVIEW: no input counts while PAUSED or in the 3 · 2 · 1 — the arrow keys neither)
    if (t0 == null) begin(stamp(e.timeStamp));
    keyDir = e.key === 'ArrowLeft' ? -1 : 1;
  }, sig);
  document.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keyDir = 0; }, sig);

  // ---- THE HOLD: the page hidden / the phone locked holds a SOLO run (engine.js#hold — a logged event); back = 3 · 2 · 1, then on
  function hide() {
    awake(false);
    if (snd && snd.rumble) snd.rumble(0);
    view.rest(true);
    if (held) { countAt = 0; countShown = 0; holdN.textContent = ''; return; }   // (hidden again during the 3 · 2 · 1: the count starts over when the page is back — never skipped)
    if (t0 == null || isOver(run)) { if (t0 != null) handOn(); return; }
    const T = Math.max(0, Math.floor((performance.now() - t0) / TICK_MS));
    settle(T); stepTo(run, T, ev);
    handOn();   // (a finish that came in this very step: handed on before the page sleeps)
    if (!isOver(run) && hold(run, Math.max(T + 1, run.mt), ev)) {
      held = true; heldT = run.t; countAt = 0; drag = null; owed = 0; carry = 0; keyDir = 0;
      stage.classList.add('is-held'); holdEl.hidden = false; holdN.textContent = ''; countShown = 0;
      const left = MODES[MODE].holds - run.holds;
      holdL.textContent = left === 1 ? '1 PAUSE LEFT' : left > 1 ? `${left} PAUSES LEFT` : 'NO PAUSE LEFT';
    } else away = true;   // (no hold left — or a match: the run goes on unseen; back from it only its END sounds)
    if (o.onHide) { try { o.onHide(held); } catch { /* the view's own business */ } }   // (F4A: what is logged goes up now — the hold with it)
  }
  function show() {
    view.rest(false); last = 0; tiers.reset(); hudGap = -99;   // (… the darkness's line + its rumble are set again from the run — the hide silenced them)
    if (held && !countAt) startCount();
    if (glDown) { clearTimeout(lostTimer); lostTimer = 0; rebuild(); }
  }
  /** F4A — a hold's way back went on WITHOUT its stamp (the line): the run says so (the view's words — the judge counts it up to that hold) */
  function unstampedNow() { try { runNote = `${o.onUnstamped() || ''}`; note.textContent = runNote; note.hidden = !runNote; } catch { /* the view's own business */ } }
  /** THE HOLD's way back: 3 · 2 · 1. F4A — the cartridge stamps it (`o.resume(i)` → this page's clock at the SERVER's stamp, 0 = none): the
   *  run goes on exactly 3 × COUNT_MS after the stamp — the judge's own number (proof.js#RESUME_LEAD_MS) */
  function startCount() {
    countAt = performance.now() + 3 * COUNT_MS; countShown = 0; stamped = false; countTries++;
    if (!o.resume) return;
    const n = ++countN;
    Promise.resolve().then(() => o.resume(run.holds - 1)).then(at => {
      if (gone || n !== countN || !held || !countAt || !(at > 0)) return;
      const end = at + 3 * COUNT_MS;
      if (end - performance.now() < 200) return;   // (the stamp's answer came too late for this count: the next one writes it again)
      countAt = end; stamped = true;
    }, () => {});
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') hide(); else show(); }, sig);

  // ---- the moments of a batch of events → the HUD (the sounds: sounds.js#cuesOf)
  function moments(from, to, now, late) {
    for (let i = from; i < to; i++) {
      const e = ev[i];
      if (late) continue;
      if (e.e === 'blaze') say('BLAZE!', 'is-blaze', 2, 900, now);
      else if (e.e === 'shatter') say('SMASH!', 'is-blaze', 2, 800, now);
      else if (e.e === 'bounce' && e.red) say('CLOSE CALL', 'is-teal', 1, 800, now);
      else if (e.e === 'area') arrive(e.floor);
      else if (e.e === 'fall' && e.floor > LAP0 && isArrival(e.floor)) arrive(e.floor);   // (THE TRENCH's later laps — the engine names an area once)
      // F3B — THE BREAKTHROUGHS (the scene plays them — night.js; the sounds: sounds.js#cuesOf): THE SPLASHDOWN muffles the mix for a moment ·
      // a FINISH by night: the firework's sound, softly, right after the seabed's
      if (e.e === 'area' && e.floor === BREAK_AT.splash && snd && snd.muffle) snd.muffle(MUFFLE_S, BREAK_HIT_S + MUFFLE_AFTER_S);
      if (e.e === 'made' && lookT === 'night' && snd && !reduceM) snd.playCues(FIREWORK_CUES);   // (reduced motion: no firework is drawn — none is heard)
      if (e.e === 'fall' && !fromRun && crossedBest(best, e.floor)) {
        // THE CROSSING (once a run): NEW BEST — the number turns gold for the rest of the run
        newBest = true; stage.classList.add('is-gold'); BN.dirty();
        say('NEW BEST', 'is-gold', 3, 1300, now);
        if (snd) snd.play(CUE_NEW_BEST.id);
      }
    }
  }

  /** F3B — THE FINISH's HOOK: a run that MADE IT is handed on ONCE, at the `made` event itself — its result + its input log (the server's
   *  judge replays it: F4). Never with the card 2.6 s later: a phone locked in between would hand nothing on (hide() calls this too). */
  function handOn() {
    if (handed || run.st !== 'made') return;
    handed = true;
    const res = resultOf(run), log = logOf(run);
    finished = { seed, mode: MODE, floor: res.floor, tick: res.tick, look: lookT, same: null, judged: null };
    if (o.onFinish) { try { o.onFinish(finished, log); } catch { /* the page's own business */ } }
  }
  function playAgain() { if (!shown) return; if (o.onAgain) { again.classList.add('is-busy'); Promise.resolve(o.onAgain()).then(ok => { again.classList.remove('is-busy'); if (ok === false) restart(); }, () => again.classList.remove('is-busy')); } else restart(); }
  press(again, playAgain);
  if (o.onLeave) press(city, () => { city.classList.add('is-busy'); Promise.resolve(o.onLeave()).then(null, () => city.classList.remove('is-busy')); });
  function showEnd(now) {
    shown = true; drag = null; keyDir = 0; owed = 0;
    const res = resultOf(run), log = logOf(run), was = best;
    // THE DETERMINISM CHECK (the console only): the recorded input log replayed through a FRESH engine — the SAME code the server's judge runs
    const evR = [], { used, bad, why, ...r } = replay({ seed, mode: MODE, log, ev: evR });
    let same = bad < 0 && used === log.length && JSON.stringify(r) === JSON.stringify(res), at = -1;
    for (let i = 0; i < Math.max(evR.length, ev.length); i++) {
      if (JSON.stringify(evR[i]) !== JSON.stringify(ev[i])) { same = false; at = Math.min(evR[i] ? evR[i].t : Infinity, ev[i] ? ev[i].t : Infinity); break; }
    }
    const verdict = judgeRun({ seed, mode: MODE, log });
    if (!verdict.ok) same = false;
    try { console[same ? 'info' : 'error'](same ? `[freefall] REPLAY = LIVE ✓ · floor ${r.floor} · tick ${r.tick} · ${log.length} entries${run.holds ? ` · ${run.holds} hold${run.holds === 1 ? '' : 's'}` : ''}${clamped ? ` · max spin held ${clamped} ticks` : ''}` : `[freefall] REPLAY ≠ LIVE ✗ · first differs at tick ${at < 0 || at === Infinity ? '?' : at} · live floor ${res.floor} ${res.cause} · replay floor ${r.floor} ${r.cause}${why ? ` (${why})` : ''}${verdict.ok ? '' : ` · the judge: ${verdict.why}`}`); } catch { /* no console */ }
    // YOUR BEST (this phone's — nothing counts): a `?floor=N` start is not a run
    const isNew = !fromRun && res.floor > was;
    if (isNew) { best = nextBest(best, res.floor); writeBest(best); }
    // F3B — THE FINISH's HOOK (match + daily: THE BOTTOM is their finish — MADE IT): the moment has played; the run is handed on ONCE, with the
    // judge's own verdict on its log (F4's cartridge wires the match / the daily here — the test page only keeps it for the checks)
    // (the fresh-eyes review: the run was handed on AT THE `made` EVENT — handOn; the card only adds the page's own two checks to it)
    if (res.made) { handOn(); finished.same = same; finished.judged = verdict.ok === true; }
    EC.set({ words: endWords(res), made: res.made, floor: res.floor, bounces: res.bounces, blazes: res.blazes, bestRun: res.bestRun });
    EC.best(fromRun ? was : best, isNew, was);
    // F4A — THE CARTRIDGE: a PROVEN run ends on the console's podium (view.js — `own: false`: this card stays away); an UNPROVEN one on
    // this card, with its reason (`note`)
    const E = o.onEnd ? o.onEnd(res) || { own: true } : { own: true };
    if (E.note) { runNote = String(E.note); note.textContent = runNote; }
    end.hidden = !E.own; soundsBtn.hidden = false; note.hidden = !(PAGE || (E.own && runNote));
    stage.classList.remove('is-live', 'is-near'); stage.classList.add('is-over');
    hook.ends.push({ seed, mode: MODE, same, at, live: res, replay: r, judge: verdict, entries: log.length, holds: run.holds, clamped, best, was, isNew });
    if (hook.ends.length > 50) hook.ends.shift();
  }

  let raf = 0, last = 0, frameN = 0, prevWork = 0;
  const frames = new Float32Array(600); let frameK = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(250, now - last) : TICK_MS;
    last = now;
    if (document.visibilityState === 'hidden') return;
    const w0 = performance.now();
    frameN++;
    if (!warmed && frameN > 2 && t0 == null) warmed = view.warm(run);
    if (o.lookNow && frameN % 15 === 0) { const l = cleanLk(o.lookNow()); if (l !== lookT) setLook(l); }   // (the console's GAME LOOK, read LIVE — four times a second)
    if (lookT !== lookSeen) lookNow();
    let tau = FIRST;   // (THE OPENING: the ball rests on floor 0)
    if (t0 != null) {
      if (held) {
        tau = heldT;
        if (countAt) {
          const left = countAt - now;
          if (left <= 0 && o.resume && !stamped && countTries < RESUME_TRIES) startCount();   // (F4A: the way back was not stamped — the line: the count runs again)
          else if (left <= 0) {
            // … then on: the clock picks up at the hold's tick (the time away + the 3 · 2 · 1 never were run time)
            if (o.resume && !stamped && o.onUnstamped) unstampedNow();
            countN++; countTries = 0;
            held = false; t0 = (stamped ? countAt : now) - heldT * TICK_MS; countAt = 0; hudGap = -99; keyTick = heldT; holdEl.hidden = true; stage.classList.remove('is-held'); awakeAt = performance.now(); awake(true);
          } else { const c = Math.ceil(left / COUNT_MS); if (c !== countShown && (c < countShown || !countShown)) countLine(c); }   // (F4A — the review: a slow stamp moves the count's end later — the number waits, it never jumps back up)
        }
      } else {
        tau = Math.max(0, (now - t0) / TICK_MS);
        if (!isOver(run)) {
          const T = Math.floor(tau);
          if (keyDir) { for (let t = Math.max(keyTick + 1, T - 3); t <= T; t++) owed += keyDir * KEY_SPIN; }
          keyTick = T;
          if (hook.auto) autoTurn(T);
          autoTick = T;
          settle(T);                          // (the turn still owed — MAX SPIN's catching up, an arrow key — up to this frame's tick)
          stepTo(run, T, ev);                 // … THEN the landings up to it
          if (w0 - awakeAt > 1000) { awakeAt = w0; awake(true); }
        }
      }
    }
    if (bedDue && now >= bedDue && !held) { bedDue = 0; band(BREAK_AT.seabed); }   // (THE BOTTOM's band: with the impact — before this frame's own events)
    if (ev.length > fed) {
      const late = away; away = false;
      moments(fed, ev.length, now, late);
      view.feed(ev, fed, ev.length);
      if (snd) snd.playCues(snd.cuesOf(ev, late, cues, fed));
      fed = ev.length;
    }
    const over = isOver(run);
    if (over && !endedAt) { endedAt = now; awake(false); handOn(); }
    if (o.onFrame && t0 != null) o.onFrame(now);   // (F4A — the cartridge: the proof's new chunks — view.js)
    if (over && !overTold && o.onOver) { overTold = true; try { o.onOver(resultOf(run)); } catch { /* the view's own business */ } }
    if (over && !shown && now - endedAt >= (run.st === 'made' ? END_HOLD_MADE_MS : END_HOLD_MS)) showEnd(now);
    // (what the tower shows AHEAD of the run: the finger's moves before the start · before tick 0 · THE SPIN-UP — one whole turn, eased out)
    let lead = t0 == null ? pre : now < t0 ? owed : 0;
    if (now - whipAt < WHIP_MS) { const k = 1 - (now - whipAt) / WHIP_MS; lead += Math.round(TURN * k * k * k); }
    view.draw(run, over ? run.end : tau, dt, lead);
    // the HUD: only what changed (its words are built in the two functions a CHANGE calls — never in the frame)
    if (run.floor !== hudFloor) hudFloorNow();
    const gap = over ? 9 : darkGap(run);
    if (gap !== hudGap) hudDarkNow(gap, over);
    const work = performance.now() - w0;
    tiers.sample(now, prevWork); prevWork = work;
    if (pin == null && frameN % 10 === 0) tiers.tick(now);
    frames[frameK++ % 600] = dt;
    if (t0 != null && !over && !held && dt > HITCH_MS && now - t0 > 1000) hitchNow(dt, now);
    else if (t0 != null && !over && !held && dt > worstMs && now - t0 > 1000) worstMs = dt;
    if (fps && frameN % 30 === 0) fpsLine();
  }
  // THE HITCH LOG (F3B — THE STUTTERS; HIGH RISE's): a frame over 33 ms in a run is counted AND NAMED — what one-off work landed just before
  // it: a picture's upload (`pic`), a sound's decode (`snd`), a band's bake (`band`), a tier step (`tier`), the HUD's own writes (`dom`);
  // else `frame`. The last 24, in records made once.
  const HLOG = 24, hMs = new Float32Array(HLOG), hFloor = new Int32Array(HLOG), hWhy = new Uint8Array(HLOG), WHY = ['frame', 'pic', 'snd', 'band', 'tier', 'dom'];
  function hitchNow(dt, now) {
    const i = hN++ % HLOG, at = now - dt;
    hMs[i] = dt; hFloor[i] = run.floor;
    hWhy[i] = at - view.lastWork() < 160 ? 1 : snd && snd.lastWork && at - snd.lastWork() < 160 ? 2 : at - BNR.lastBake() < 160 ? 3 : at - tierAt < 400 ? 4 : at - domAt < 120 ? 5 : 0;
    hitches++; if (dt > worstMs) worstMs = dt;
  }
  /** the look on screen changed: the page's words + inks follow the picture (written at a change only) */
  function lookNow() { lookSeen = lookT; stage.dataset.look = lookT; BN.dirty(); BNR.dirty(); }
  /** a floor was passed: the big number, the area (YOUR BEST's line once it is beaten) */
  function hudFloorNow() {
    hudFloor = run.floor; setNum(hudFloor);
    const a = areaOf(hudFloor).name, ink = areaOf(Math.max(0, hudFloor - INK_LAG)).id;
    if (a !== hudArea) hudArea = a;
    if (ink !== hudInk) { hudInk = ink; stage.dataset.area = ink; domAt = performance.now(); }   // (`data-area` = the area whose WALL is behind the top of the screen — THE REVIEW: it changes INK_LAG floors after a border, as the wall does: the day's inks + THE DARKNESS's look read it)
    if (newBest) topL.textContent = bestLine(hudFloor);
  }
  /** THE DARKNESS — ALWAYS IN SIGHT (F3: JAYWALK-style pressure — never more than 3 floors above): the stage's data-dark = the floors it is
   *  above the ball (3 · 2 · 1; '' = no run / over): the stylesheet's dark edge creeps down from the top IN STEP with it — never over the
   *  ball or its floor; the warning + THE RUMBLE (sfx.js — it swells as the darkness closes) from 2 floors, loudest on the last one */
  function hudDarkNow(gap, over) {
    hudGap = gap; domAt = performance.now();
    const on = t0 != null && !over;
    stage.dataset.dark = on ? String(Math.max(1, Math.min(3, gap))) : '';
    stage.classList.toggle('is-near', gap <= 1 && on);
    if (snd && snd.rumble) snd.rumble(!on || held ? 0 : gap <= 1 ? 1 : gap === 2 ? 0.5 : 0);
  }
  function countLine(c) { countShown = c; holdN.textContent = String(c); }
  /** `?fps=1`: the last 120 frames, twice a second */
  function fpsLine() {
    let sum = 0, worst = 0;
    const n = Math.min(frameK, 120);
    for (let i = 0; i < n; i++) { const v = frames[(frameK - 1 - i + 6000) % 600]; sum += v; if (v > worst) worst = v; }
    const i = view.info();
    fpsA.data = `${(1000 * n / sum).toFixed(0)} fps · worst ${worst.toFixed(0)} ms · HITCH ${hitches}${hitches ? ` (last: ${WHY[hWhy[(hN - 1) % HLOG]]} ${hMs[(hN - 1) % HLOG].toFixed(0)} ms @${hFloor[(hN - 1) % HLOG]})` : ''} · tier ${i.tier} @${i.dpr} · ${i.calls} calls · ${i.slices} slices`;
  }

  // (the pass's own checks — tests/integration/freefall-play.mjs)
  Object.assign(hook, {
    state: () => ({ mode: MODE, seed, note: runNote, look: lookT, lookAttr: stage.dataset.look, areaAttr: stage.dataset.area, started: t0 != null, starting, shown, held, counting: !!countAt, over: isOver(run), st: run.st, cause: run.cause, t: run.t, a: run.a, floor: run.floor, clean: run.clean, blaze: run.blaze, dark: darkGap(run), darkAttr: stage.dataset.dark, rumble: snd && snd.rumbling ? snd.rumbling() : 0, nl: run.nl, pl: run.pl, fl: run.fl, entries: run.lt.length, holds: run.holds, saves: run.saves, bounces: run.bounces, shatters: run.shatters, owed, clamped, best, tapeFloor, newBest, warmed, rebuilds, tier: tiers.get(), tierPath: tierPath.slice(), hitches, worstMs, hitchLog: Array.from({ length: Math.min(hN, HLOG) }, (_, k) => { const i = (hN - 1 - k + HLOG * 1000) % HLOG; return { ms: Math.round(hMs[i]), floor: hFloor[i], why: WHY[hWhy[i]] }; }), finished, muffles: snd && snd.muffles ? snd.muffles() : 0, events: ev.length, lates: snd && snd.lates ? snd.lates() : 0, cls: stage.className, num: num.getAttribute('aria-label'), area: hudArea, banner: BNR.info(), top: topL.textContent, call: call.textContent, frame: view.frame(run), info: view.info(), pxPerRad: view.pxPerRad() }),
    /** the tower turn that brings the nearest gap (as the floor stands at the next landing) under the ball */
    toGap: () => gapTurn(GAP), toSafe: () => gapTurn(SAFE),
    /** (F4A — THE HAZE CHECK) where the middle of a slice's top face on the floor `df` under the ball's is on the screen ([x, y], 0 … 1) —
     *  a SAFE one (`red`: a RED one — the same red on every floor) on the near side, off the ball; null = none there. The checks read
     *  the picture's colour at that point. */
    spot(df = 0, red = false) {
      const f = run.floor + df, rec = floorInto(run.h, f, run.R, spotRec), want = red ? RED : SAFE;
      let bestP = null, bestD = 9;
      for (let k = 0; k < SLICES; k++) {
        if (kindAtTick(rec, k, run.t, run.R) !== want) continue;
        let phi = wrap(sliceStart(k) + 170 + rec.twist + run.a) * 2 * Math.PI / TURN; if (phi > Math.PI) phi -= 2 * Math.PI;
        const d = Math.abs(Math.abs(phi) - 0.8);
        if (!red && kindAtTick(rec, (k + (phi > 0 ? SLICES - 1 : 1)) % SLICES, run.t, run.R) === RED) continue;   // (a red slice stands proud: the one in front of this one would hide it)
        if (Math.abs(phi) > (df ? 0.1 : 0.42) && Math.abs(phi) < 1.25 && d < bestD) { bestD = d; bestP = view.project(0.8 * Math.sin(phi), -f * SHAPE.H + (red ? SHAPE.RISE : 0) + 0.002, 0.8 * Math.cos(phi)); }
      }
      return bestP;
    },
    /** the top of the ball at the top of its bounce, in px from the top of the screen (the HUD ends above it) */
    apexY: () => view.apexY(run) * stage.clientHeight,
    /** ms until the next landing (null = not started / held / over) */
    msToLanding: () => (t0 != null && !held && !isOver(run) ? t0 + run.nl * TICK_MS - performance.now() : null),
    restart: s => restart(s), begin: () => begin(performance.now()), dive: n => { if (t0 != null) { dive(n); t0 = performance.now() - run.t * TICK_MS; fromRun = true; prepBanner(run.floor); } },
    hide, show, log: () => logOf(run), events: () => ev.slice(), result: () => resultOf(run),
    frames: () => { const out = [], n = Math.min(frameK, 600); for (let i = n - 1; i >= 0; i--) out.push(frames[(frameK - 1 - i + 6000) % 600]); return out; },
    setLook: l => setLook(l), setTier: t => tiers.set(t), lose: () => { const gl = view.el && (view.el.getContext('webgl2') || view.el.getContext('webgl')), x = gl && gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return !!x; },
    stop() { cancelAnimationFrame(raf); },
  });
  if (o.hook) window[o.hook] = hook;
  restart(); restartAt = -1e9;
  raf = requestAnimationFrame(frame);
  return {
    hook, restart, el: stage,
    /** the cartridge's PLAY AGAIN: a stage kept warm (its scene, its programs, its sounds) is taken by the next view — into its element, the drag's ground with it */
    moveTo(next) { acIn.abort(); acIn = new AbortController(); app = next; drag = null; app.replaceChildren(stage); wire(); },
    /** F4A — the cartridge's hands (view.js): the run as it stands (its log is the proof's), the start (PLAY AGAIN's remount: the tap WAS
     *  the start), the stage's own card with a line (NO SIGNAL), the card put away (the podium takes the screen) */
    run: () => run, result: () => resultOf(run), state: () => ({ started: t0 != null, starting, shown, held, over: isOver(run), seed, note: runNote }),
    start() { begin(performance.now()); },
    showCard(text) { runNote = String(text || ''); note.textContent = runNote; note.hidden = !runNote; end.hidden = false; },
    hideCard() { end.hidden = true; note.hidden = true; },
    destroy() { gone = true; cancelAnimationFrame(raf); ac.abort(); acIn.abort(); awake(false); clearTimeout(lostTimer); clearInterval(sunTimer); clearTimeout(bnrTimer); BNR.destroy(); offGL(); BN.destroy(); try { view.destroy(); } catch { /* gone */ } if (snd) snd.stopAll(); stage.remove(); if (o.hook && window[o.hook] === hook) delete window[o.hook]; },
  };
}
