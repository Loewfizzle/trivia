// FREEFALL — THE STAGE (F2 — docs/freefall.md "THE TEST … stage.js#1
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { TICK_MS, TURN, SLICES, BALL, SAFE, GAP, RED, MODES, MODE_IDS, MAX_SPIN, SEED_MAX, FIRST, AREAS } from './tuning.js';
import { createRun, stepTo, turn, setAngle, hold, isOver, resultOf, logOf, darkGap, floorNow } from './engine.js';
import { sliceStart, sliceUnder, kindAtTick, wrap, angDiff, floorInto } from './tower-gen.js';
import { replay, judgeRun, isHold } from './replay.js';
import { endWords, tickOf, areaOf, nextArrival, isArrival, arrivalWords } from './logic.js';
import { cleanBest, bestLine, crossedBest, nextBest } from './best.js';
import { CUE_NEW_BEST, CUE_FIREWORKS, BREAK_AT, BREAK_HIT_S, BOTTOM_HIT_S, DUCK_MS } from './sounds.js';
import { createTiers } from '../kit/tiers.js';
import { resolveLook, sunUpNow } from '../kit/look.js';
import { createNight, FF_ART_REV, SHAPE } from './night.js';
import { endCard, warmLogo } from './endscreen.js';
import { createHud, framesOf } from './hudgl.js';
import { createBanner, BANNER_MS, BANNER_GOLD_MS } from './banner.js';
import { createGhost, resetGhost, feedGhost, stepGhost, ghostPhi, liftOf, outWords, lastWords, lastStanding, madeAhead, follow, nextFollow, createWatch, stepWatch, LIFT, MARK_FLOORS, MARK_UP, NEAR_FLOORS, WATCH_DELAY, WATCH_DELAY_MAX, LOST_GONE_MS, LOST_OUT_MS } from './ghosts.js';
import { GHOST_STRIDE, GHOSTS_MAX } from './ghost-fx.js';
import { createMatchHud } from './matchhud.js';
import { keepShot, shotFor, lastShot, shotMs, ballAt, shotCrop, SHOT_BOX, stagingOf } from './shot.js';

// the wall behind the top of the screen is the area's of this … stage.js#2
const INK_LAG = 5;
/** THE TRENCH's first floor: past it an arrival is a LAP's first floor (241 · 281 · …) */
const LAP0 = 201;
export const newSeed = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); };
/** the end card comes this long after EVERY end (the ball's last moment is seen) */
export const END_HOLD_MS = 700;
// … and this long after a FINISH (F3B — THE BOTTOM: the last … stage.js#3
export const END_HOLD_MADE_MS = 2600;
/** THE BOTTOM's gold band: its words (the arrival's own stay THE BOTTOM · FLOOR 200 — logic.js) */
export const BOTTOM_WORDS = 'YOU HIT THE BOTTOM';
/** THE SPLASHDOWN: the mix goes under water for this long (s), from a moment after the plunge's own splash */
export const MUFFLE_S = 1.5, MUFFLE_AFTER_S = 0.25;
// the START waits at most this long for the sounds' decode … stage.js#4
export const START_WAIT_MS = 600;
/** THE HOLD's way back: 3 · 2 · 1, this long each */
export const COUNT_MS = 800;
/** the arrow keys (a desk): this many angle units a tick while one is held */
export const KEY_SPIN = 60;
// the most turn the stage keeps owing when a flick out-runs … stage.js#5
export const OWED_MAX = 8 * MAX_SPIN;
/** a frame this long (after a run's first second) is a HITCH (`?fps=1` counts them) */
export const HITCH_MS = 33;
/** FIX A — THE SPIKE RULE: `n` hitches inside `span` ms → one tier down · FIX B: only if it HELPS — the hitch rate over the next `trial` ms
 *  of play (after `settle` ms) must fall to `helped` × the rate before, else the tier goes back up and the rule rests for the page; never
 *  below tier `floor` on spikes alone */
export const SPIKE = Object.freeze({ n: 4, span: 20000, trial: 10000, settle: 500, helped: 0.5, floor: 1 });
/** FIX A — S12: the hint comes back after this long bouncing on floor 0 untouched */
export const TEACH_MS = 2000;
/** FIX A — the mid-run NEW BEST moment from this floor up */
export const NEW_BEST_FROM = 10;
/** FIX A — the opening's dark hold waits at most this long for the rooftop's pictures */
export const DIM_MAX_MS = 1600;
// THE LOOK before the sun rule has answered (it is a lazy … stage.js#6
export const guessLook = hour => (hour >= 7 && hour < 19 ? 'day' : 'night');
/** AUTO asks the sun again this often */
export const SUN_EVERY_MS = 60000;
/** F4A — THE CARTRIDGE's START: the tower's layout is the GO's own seed's (picked by the SERVER's time — it lands a moment after the first
 *  drag): the tower SPINS UP — one whole turn, eased, over this long — as the real floors take their place (a view's turn: it ends where it began) */
export const WHIP_MS = 420;
// … a hold's way back whose stamp did not come: the 3 · 2 · 1 … stage.js#7
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
/** FIX C — N12: a button that acts on its CLICK (the share sheet needs the browser's own user activation — iOS gives it to a click, not
 *  always to a pointerup); its press + lift still never reach the tower */
function clickPress(node, fn) {
  node.addEventListener('pointerdown', e => e.stopPropagation());
  node.addEventListener('pointerup', e => e.stopPropagation());
  node.addEventListener('click', e => { e.stopPropagation(); node.blur(); fn(e); });
  return node;
}
const ICON_AGAIN = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>';
const NO_VIEW = { el: null, reset() {}, feed() {}, draw() {}, pose() {}, setTier() {}, setLook() {}, lookNow: () => 'night', warm: () => true, skyIn: () => true, setBest() {}, grey() {}, rest() {}, adopt() {}, pxPerRad: () => 112, project: () => [0.5, 0.5], frame: () => null, apexY: () => 0.2, info: () => ({}), lastWork: () => 0, submitAt: () => 0, ghosts() {}, ghostNames() {}, ghostEcho() {}, ghostInfo: () => ({}), destroy() {} };

export function createStage(app0, o = {}) {
  let app = app0, acIn = new AbortController(); // stage#8
  const PAGE = !!o.page, FIXED = String(o.seed || '').slice(0, SEED_MAX);
  let MODE = MODE_IDS.includes(o.mode) ? o.mode : 'solo';   // (F4B: the cartridge's match sets it — setMatch)
  const FROM = Math.max(0, Math.min(600, Math.floor(Number(o.from) || 0)));
  // THE LOOK (F3 — the match kit's shared DAY / NIGHT, … stage.js#9
  const LOOK_Q = o.look === 'day' || o.look === 'night' ? o.look : null, cleanLk = l => (l === 'day' ? 'day' : 'night');
  let lookT = cleanLk((o.lookLock && o.lookLock()) || (o.lookNow ? o.lookNow() : LOOK_Q || guessLook(new Date().getHours()))), lookSeen = '';
  const bestAt = o.best || { read: () => 0, write() {} }, readBest = () => cleanBest(bestAt.read()), writeBest = n => bestAt.write(n);
  const ac = new AbortController(), sig = { signal: ac.signal };   // (unmounted: every listener on the document goes with it)
  let gone = false;
  // (THE HITCH LOG's clocks — set where the one-off work happens, read by hitchNow below)
  let hN = 0, worstMs = 0, domAt = -1e9, tierAt = -1e9;
  // THE SOUND SYNC (HIGH RISE S4A): a LIVE run holds the audio … stage.js#10
  const awake = on => { const f = globalThis.__nsHoldAwake; if (f) { try { f(on, 'freefall'); } catch { /* audio is polish */ } } };
  let awakeAt = 0;

  // ---- the page: the play area (the canvas — a drag ANYWHERE … stage.js#11
  const play = h('div.ff-play', { role: 'application', 'aria-label': 'Freefall — drag left or right to spin the tower' });
  const dark = h('div.ff-dark', { 'aria-hidden': 'true' }), shade = h('div.ff-shade', { 'aria-hidden': 'true' });
  const topL = h('div.ff-best');
  const num = h('div.ff-num', { 'aria-hidden': 'true' }, h('span.ff-dg', '0'));
  const call = h('div.ff-call', { 'aria-live': 'polite' }), warn = h('div.ff-warn', 'THE LIGHTS ARE GOING OUT');
  const hud = h('div.ff-hud', num, call, warn); // stage#12
  // THE ARRIVAL BANNERS (banner.js): a band across the foot of … stage.js#13
  // FIX D — THE GL HUD (hudgl.js): every piece on screen in a fall is drawn IN the 3D picture; these nodes are its hidden sources
  const HP = {}, HO = { reduce: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, kinds: [['BLAZE!', 'is-blaze'], ['SMASH!', 'is-blaze'], ['CLOSE CALL', 'is-teal'], ['NEW BEST', 'is-gold']], pop: null, areas: [...new Set(AREAS.map(a => a.name))].map(n => [n, false]).concat([[BOTTOM_WORDS, true]]) }, H = createHud(HP, HO);
  const BNR = createBanner(H);
  // F4B — THE MATCH's HUD (matchhud.js): 3 · 2 · 1 + the names, … stage.js#14
  const MH = createMatchHud({ busy: () => BNR.showing(), hud: H });
  // THE OPENING's TITLE (F3 — title-05, the owner's pick): … stage.js#15
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
  warmLogo(); // stage#16
  const again = h('button.ff-again', { type: 'button' }, h('span.ff-again-i'), h('span.ff-again-t', 'PLAY AGAIN'));
  again.firstChild.innerHTML = ICON_AGAIN;
  // (the cartridge's own card — an UNPROVEN run's, a run with … stage.js#17
  const linkIco = id => { const i = h('i.ff-link-i', { 'aria-hidden': 'true' }); i.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${id === 'share' ? '<path d="M12 15V3.8"/><path d="M7.6 8 12 3.6 16.4 8"/><path d="M5 12.5v6.5h14v-6.5"/>' : '<path d="M3.8 11.2 12 4l8.2 7.2"/><path d="M6.3 9.4V20h11.4V9.4"/><path d="M10 20v-5.2h4V20"/>'}</svg>`; return i; };
  const shareT = h('span', 'SHARE'), share = h('button.ff-link.ff-share', { type: 'button' }, linkIco('share'), shareT);
  const city = o.onLeave ? h('button.ff-link.ff-city', { type: 'button' }, linkIco('home'), h('span', o.leaveWords || 'BACK')) : h('a.ff-link.ff-city', { href: '/' }, linkIco('home'), h('span', 'HOME'));
  const end = h('div.ff-end', { hidden: true }, EC.el, h('div.ff-endfoot', again, h('div.ff-links', ...(o.onLeave ? [city] : [share, h('i.ff-link-div', { 'aria-hidden': 'true' }), city]))));   // (the cartridge's own card — an unproven run's: the way out alone)
  const note = h('div.ff-note', PAGE ? 'TEST PAGE — NOTHING COUNTS YET' : '');
  let runNote = '';   // (the cartridge: an UNPROVEN run says so for as long as it is on — NOT COUNTED — …)
  const fpsA = document.createTextNode(''), fps = o.fps ? h('div.ff-fps', fpsA) : null;
  /** FIX C — `?hud=0` (the test page's A/B): no HTML layer over the canvas while a run is on (the number, the top line, the rail, the bands,
   *  the calls, the fps line, the veil) — the end card shows the result */
  const HUD0 = !!(o.ab && o.ab.hud === false);
  // THE SOUNDS (sfx.js — the SHARED audio engine's SFX bus; … stage.js#18
  let snd = null, sheetOpen = false;
  const soundsBtn = press(h('button.ff-snd', { type: 'button' }, 'SOUNDS'), () => {
    if (sheetOpen) return;
    sheetOpen = true;
    lazyImport(import('./audition.js'), './audition.js').then(A => A.openAudition({ press, onClose: () => { sheetOpen = false; last = 0; } })).catch(() => { sheetOpen = false; });
  });
  // FIX C — HOW TO PLAY on the TEST PAGE: ☰ top-left on the opening + the pause → the ONE opener (ui/help-open.js — lazy, the frame at the tap)
  const helpBtn = PAGE ? press(h('button.ff-menu', { type: 'button', 'aria-label': 'How to play' }, h('i.ff-menu-i', { 'aria-hidden': 'true' }, h('b'), h('b'), h('b'))), () => { lazyImport(import('../../ui/help-open.js'), '../../ui/help-open.js').then(m => m.openHelp('freefall', { only: true })).catch(() => {}); }) : null;
  const stage = h(`div.ff-stage.is-open.ff-gl${HUD0 ? '.ff-nohud' : ''}`, { 'data-look': lookT }, play, dark, shade, topL, hud, BNR.el, MH.el, open, foot, holdEl, end, helpBtn, PAGE ? soundsBtn : null, PAGE || o.go ? note : null, fps);
  app.replaceChildren(stage);
  Object.assign(HP, { stage, play, top: topL, num, call, warn, note, band: BNR.src, ...MH.src });
  // FIX A — THE TITLE's GREY FLASH (the owner's iPhone): the … stage.js#19
  let dimming = true;
  const dimFrom = performance.now();
  stage.classList.add('is-dim');
  const hook = { ends: [], view: null, sfx: null, auto: null };
  // (the page installs the shared engine itself; in the console it is running long since)
  Promise.all([PAGE ? lazyImport(import('../../audio/engine.js'), '../../audio/engine.js') : null, lazyImport(import('./sfx.js'), './sfx.js')])
    .then(([E, S]) => { if (gone) return; if (E) E.installAudio(); S.fetchSounds(); Promise.resolve(S.decode()).catch(() => {}); snd = S; hook.sfx = S; }).catch(() => { /* silent: audio is polish */ });

  // ---- the view (the night look) + its quality tiers; a browser with no WebGL gets the stage + one line saying so
  const pin = o.tier == null ? null : Math.max(0, Math.min(2, o.tier));
  const noGL = () => h('p.ff-nogl', 'This browser can’t draw the game here (it has no WebGL).');
  let view, glDown = null;
  try { view = createNight(play, { tier: pin == null ? 2 : pin, dprMax: o.dpr || 0, look: lookT, skyShift: o.skyShift || 0, ab: o.ab }); }
  catch { stage.append(noGL()); return null; }
  hook.view = view; hook.hud = H;
  const glOn = v => { H.attach(v); if (v.setOverlay) v.setOverlay(() => H.draw()); H.look(lookT); };
  glOn(view);
  const tierPath = [pin == null ? 2 : pin];
  const tiers = createTiers({ apply: t => { view.setTier(t); tierAt = performance.now(); if (tierPath.length < 40) tierPath.push(t); }, initial: pin == null ? 2 : pin });
  // THE LOST CONTEXT (JAYWALK's lesson — iOS takes a WebGL … stage.js#20
  let lostTimer = 0, rebuilds = 0, tries = 0;
  const onLost = e => { e.preventDefault(); if (!lostTimer) lostTimer = setTimeout(rebuild, 1500); };
  const onBack = () => rebuild();
  const watchGL = () => { if (view.el) { view.el.addEventListener('webglcontextlost', onLost); view.el.addEventListener('webglcontextrestored', onBack); } };
  const offGL = () => { if (view.el) { view.el.removeEventListener('webglcontextlost', onLost); view.el.removeEventListener('webglcontextrestored', onBack); } };
  function rebuild() {
    clearTimeout(lostTimer); lostTimer = 0;
    offGL();
    try { view.destroy(); } catch { /* it is gone already */ }
    try { view = createNight(play, { tier: tiers.get(), dprMax: o.dpr || 0, look: lookT, skyShift: o.skyShift || 0, ab: o.ab }); }
    catch {
      view = NO_VIEW; hook.view = view; H.attach(null);
      if (!glDown) { glDown = noGL(); stage.append(glDown); }
      if (++tries <= 8) lostTimer = setTimeout(rebuild, 1500);
      return;
    }
    if (glDown) { glDown.remove(); glDown = null; }
    tries = 0;
    glOn(view);
    view.reset(run); view.adopt(run, ev, fed); view.setBest(tapeFloor); view.pose(t0 == null && !starting ? 'open' : 'play', true);
    // (FIX B — Grok's G1: the new scene gets the match's rivals … stage.js#21
    if (ghosts.length) { view.ghostNames(ghosts); view.ghosts(ghosts.length, gData); }
    if (watchUid) wNew = true;
    hook.view = view; rebuilds++; last = 0; warmed = false;
    watchGL();
  }
  watchGL();

  // ---- THE HUD (FIX D): no page write in a fall — the GL HUD's state; ONE screen-reader line (BNR.say: the floor every 10 + the arrivals)
  // THE LOOK, live: the scene flips at once (night.js#setLook); … stage.js#22
  let lookWant = lookT;
  const lookHeld = () => (t0 != null || starting) && !!run && !isOver(run);
  function setLook(l) { lookWant = cleanLk(l); if (lookWant !== lookT && !lookHeld()) { lookT = lookWant; view.setLook(lookT); } }
  function forceLook(l) { lookWant = lookT = cleanLk(l); view.setLook(lookT); }
  let sunTimer = 0;
  const askSun = () => sunUpNow(Date.now()).then(up => { if (!gone) setLook(resolveLook('auto', up)); }, () => {});
  if (!o.lookNow && !LOOK_Q) { askSun(); sunTimer = setInterval(askSun, SUN_EVERY_MS); }
  let numShown = -1, vDark = 0, goldOn = false, nearOn = false, topText = '', noteTxt = '', darkV = '';
  function setNum(n) {
    if (n === numShown) return;
    numShown = n; H.num(n);
    if (n && n % 10 === 0) BNR.say(`FLOOR ${n}`);
  }
  const setTop = t => { topText = t; H.top(t); };
  const edge = () => H.edge(PAGE && !soundsBtn.hidden ? soundsBtn.getBoundingClientRect().right : 0);   // (G0.1: the top line keeps right of SOUNDS — a state change only)
  const setGold = on => { goldOn = on; H.gold(on); };
  const setNote = t => { note.textContent = t; noteTxt = t; H.note(t); };
  // THE ANNOUNCER: one call at a time, a bigger moment never … stage.js#23
  let callUntil = 0, callPri = 0, callAnim = null, callText = '', callCls = '', callMs = 0, callAt = 0;
  const POP = [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1.12)', offset: 0.22 }, { opacity: 1, transform: 'scale(1)', offset: 0.4 }, { opacity: 1, transform: 'scale(1)', offset: 0.8 }, { opacity: 0, transform: 'scale(1.04)' }];
  HO.pop = framesOf(POP);
  // (F3B: THE BAND lies in the announcer's lane now — a call … stage.js#24
  let pendText = '', pendCls = '', pendPri = 0, pendMs = 0, pendAt = 0;
  function say(text, cls, pri, ms, now) {
    if (BNR.showing()) { if (pri >= pendPri) { pendText = text; pendCls = cls; pendPri = pri; pendMs = ms; pendAt = now; } return; }
    if (now < callUntil && pri < callPri) return;
    domAt = now;
    callUntil = now + ms; callPri = pri; callText = text; callCls = cls; callMs = ms; callAt = now;
    H.say(text, ms, now);   // (the pop: POP's frames, ease-out over its time — the GL HUD's)
  }
  // ---- THE ARRIVALS: the band of the NEXT arrival is made … stage.js#25
  let bnrQueued = -1, bnrTimer = 0, bedDue = 0;
  /** an arrival's band: its words + its class — THE BOTTOM's is the GOLD one (F3B: "YOU HIT THE BOTTOM") */
  const bandName = (floor, w) => (floor === BREAK_AT.seabed ? BOTTOM_WORDS : w.name), bandCls = floor => (floor === BREAK_AT.seabed ? 'is-gold' : '');
  // F3B — THE STUTTERS: EVERY band a run can meet soon is baked … stage.js#26
  function prepBanner(from) {
    let f = from;
    for (let k = 0; k < 7; k++) { f = nextArrival(f); const w = arrivalWords(f); BNR.prepare(bandName(f, w), w.sub, bandCls(f)); if (f > LAP0) break; } // stage#27
  }
  function arrive(floor) {
    // (THE BOTTOM's gold band comes with the IMPACT — a whole … stage.js#28
    if (floor === BREAK_AT.seabed) { bedDue = performance.now() + BOTTOM_HIT_S * 1000; return; }
    if (bedDue) { bedDue = 0; band(BREAK_AT.seabed); }   // (… the ball is already past it: THE BOTTOM's band first, this one after it)
    band(floor);
  }
  /** an arrival's band crosses now — or right after the one that is up */
  function band(floor) {
    if (BNR.showing()) { bnrQueued = floor; return; }
    const w = arrivalWords(floor), at = performance.now();
    // (the fresh-eyes review: a call that is UP when the band … stage.js#29
    if (at < callUntil) {
      if (callPri >= pendPri) { pendText = callText; pendCls = callCls; pendPri = callPri; pendMs = callMs; pendAt = callAt; }
      callUntil = 0; callPri = 0; H.unsay();
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
  // (the HUD is baked for its size: a real resize — a phone turned — bakes it again, once it settles)
  let rzT = 0, rzK = '';
  window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { const r = stage.getBoundingClientRect(), k = `${Math.round(r.width)}x${Math.round(r.height)}`; if (k !== rzK) { rzK = k; H.dirty(); } }, 150); }, sig);

  // ---- the run: the pure engine on this page's clock
  let seed = '', run = null, t0 = null, shown = false, endedAt = 0, starting = false, startN = 0, warmed = false;
  let owed = 0, carry = 0, pre = 0, clamped = 0, drag = null, keyDir = 0, keyTick = 0, autoTick = 0;
  let held = false, heldT = 0, countAt = 0, countShown = 0, away = false, restartAt = -1e9, blockTxt = '';
  let whipAt = -1e9, countN = 0, countTries = 0, stamped = false, overTold = false; // stage#30
  let best = readBest(), tapeFloor = 0, newBest = false, fromRun = false, hudFloor = -1, hudGap = -99, hudArea = '', hudInk = '', hitches = 0;
  let ev = [], fed = 0;
  const spotRec = { i: -1, twist: 0, gap: 0, red: 0, m1: 0, m2: 0 };   // (the checks' own floor record — hook.spot)
  const cues = [], FIREWORK_CUES = [CUE_FIREWORKS];
  // F3B — THE FINISH's hook: what a finished run hands on (F4's … stage.js#31
  let finished = null, handed = false;
  // F4B — THE MATCH (docs/freefall.md "THE MATCH" · "THE … stage.js#32
  const MOMENTS_QUIET_MS = 2000;
  // F5C — THE MUSIC DUCKS under the big moments … stage.js#33
  let duckUntil = 0, duckT = 0;
  function duckFor(ms) {
    if (!o.duck) return;
    const now = performance.now(), until = now + ms;
    if (until <= duckUntil) return;
    if (duckUntil <= now) { try { o.duck(true); } catch { /* polish */ } }
    duckUntil = until; clearTimeout(duckT); duckT = setTimeout(unduck, ms);
  }
  function unduck() { clearTimeout(duckT); if (duckUntil) { duckUntil = 0; if (o.duck) { try { o.duck(false); } catch { /* polish */ } } } }
  let momentsAt = Infinity, lastSaid = false;
  // (FIX A — S14: LAST ONE STANDING is said ONCE a match — a … stage.js#34
  const saidSeen = () => !!(o.said && o.said.seen(seed)), saidKeep = () => { if (o.said) o.said.keep(seed); };
  let match = MODE === 'match' && (!!o.match || !!o.rivals), spect = false, sim = null, simShift = Math.max(0, Math.floor(Number(o.simShift) || 0)), playing = -1, clockSec = -1;
  const ghosts = [], gData = new Float32Array(GHOSTS_MAX * GHOST_STRIDE), rows = [];
  const meRow = { uid: 'me', name: 'YOU', hex: '#ffffff', floor: 0, over: false, end: '', lost: false, gone: false, me: true };
  let watchUid = '', WA = null, evW = [], wfed = 0, wNew = false, rowsDirty = true, simNear = false, watchDelay = WATCH_DELAY;
  const UNIT = 2 * Math.PI / TURN;
  const reduceM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function restart(s = FIXED || newSeed()) {
    seed = s; run = createRun({ seed, mode: MODE }); t0 = null; shown = false; endedAt = 0; starting = false; startN++; restartAt = performance.now();
    ev = []; fed = 0; owed = 0; carry = 0; pre = 0; clamped = 0; drag = null; keyDir = 0; autoTick = 0;
    held = false; countAt = 0; away = false; hitches = 0; cN.fill(0); cMax.fill(0); spikeK = 0; kN.fill(0); kSum.fill(0); kMax.fill(0); pSum.fill(0); allWork = 0; allN = 0; longN = 0; longMax = 0; if (teach) teachOn(false); whipAt = -1e9; countN++; countTries = 0; stamped = false; overTold = false; runNote = '';
    if (!PAGE) setNote('');
    worstMs = 0; hN = 0;
    best = Math.max(best, readBest()); tapeFloor = best; newBest = false; fromRun = false;   // (max: a phone whose storage is blocked still keeps its best for the visit)
    view.reset(run); view.setBest(tapeFloor); view.pose('open', true);
    end.hidden = true; holdEl.hidden = true; soundsBtn.hidden = false; note.hidden = false;
    stage.classList.remove('is-live', 'is-over', 'is-gold', 'is-held', 'is-near', 'is-starting'); stage.classList.add('is-open'); edge();
    setTop(bestLine(best)); setGold(false); nearOn = false; H.near(false, 0);
    hudFloor = -1; hudGap = -99; hudArea = ''; callUntil = 0; callPri = 0; H.unsay(); callText = '';
    setNum(0); hudArea = areaOf(0).name; hudInk = areaOf(0).id;   // (FIX D: the plain + the gold digits are the GL HUD's atlases — baked with the look)
    bnrQueued = -1; clearTimeout(bnrTimer); BNR.clear(); prepBanner(0);
    bedDue = 0; pendText = ''; pendPri = 0; finished = null; handed = false;
    darkV = ''; vDark = 0;
    // (F4B: a new run has no rivals yet — the bot room / the match's view sets them again)
    sim = null; spect = false; ghosts.length = 0; rows.length = 0; view.ghosts(0, null); watchUid = ''; WA = null; playing = -1; clockSec = -1; rowsDirty = true;
    MH.reset(); stage.classList.remove('is-watch'); momentsAt = Infinity; lastSaid = false; unduck();
  }
  // `n` floors played at once through the REAL engine (a gap … stage.js#36
  function dive(n) {
    while (!isOver(run) && run.floor < n) {
      const d = gapTurn(GAP);
      let rest = d;
      for (let t = Math.max(run.mt + 1, run.ll + 1, 0); t <= run.nl && rest !== 0; t++) rest -= turn(run, t, rest, ev);
      stepTo(run, run.nl, ev);
    }
    fed = ev.length;   // (played unseen + unheard)
  }
  // the tower turn (angle units, signed: + = a drag to the … stage.js#37
  function gapTurn(kind) {
    const fl = floorNow(run), p = wrap(BALL - run.a - fl.twist);
    let bestD = null;
    for (let k = 0; k < SLICES; k++) if (kindAtTick(fl, k, run.nl, run.R) === kind) { const d = angDiff(sliceStart(k) + 170, p); if (bestD == null || Math.abs(d) < Math.abs(bestD)) bestD = d; }
    return bestD == null ? 0 : -bestD;
  }
  function live(ts) {
    starting = false; stage.classList.remove('is-starting'); stage.classList.add('is-live');
    soundsBtn.hidden = true; note.hidden = !runNote; H.edge(0);
    t0 = ts;
    if (FROM) { dive(FROM); fromRun = true; t0 = ts - run.t * TICK_MS; prepBanner(run.floor); }
    owed = Math.max(-OWED_MAX, Math.min(OWED_MAX, pre)); pre = 0;
    awakeAt = performance.now(); awake(true); momentsAt = awakeAt + MOMENTS_QUIET_MS;
    if (o.rivals && !o.go) startSim();   // (the test page's bot room: `?mode=match&rivals=N`)
    if (document.visibilityState === 'hidden') hide(); // stage#38
  }
  // THE START: the first drag. Tick 0 waits a moment (≤ … stage.js#39
  function begin(ts) {
    if (starting || t0 != null || shown || blockTxt) return;   // (FIX B — S8: a phone that is not in this run's match never starts one)
    starting = true; startN++;
    stage.classList.remove('is-open'); stage.classList.add('is-starting');
    turnAt = performance.now(); if (!pre && MODE !== 'match') teachOn(true);   // (S12: a TAP started it — the hint stays until the tower turns)
    view.pose('play');
    if (!warmed) warmed = view.warm(run);
    awakeAt = performance.now(); awake(true);   // (taken IN the touch — where iOS lets a context wake)
    const ready = !snd || !snd.ready || snd.ready();
    const m = startN;
    if (o.go) {
      // F4A — THE CARTRIDGE: GO (the proof node's first write — … stage.js#40
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
    runNote = String(G.note || ''); setNote(runNote);
    prepBanner(0);
    live(Number(G.t0) || performance.now());
  }

  /** the checks' own hand (`hook.auto` — never a player's): 'gap' = every floor's gap (a dive: THE BLAZE) · 'play' = a bounce a floor, then its gap ·
   *  'smash' = gaps until THE BLAZE is lit, then solid ground (a shatter) · 'safe' = stay on safe ground · 'red' = onto the red */
  function autoTurn(T) {
    const a = hook.auto, n = Math.max(1, Math.min(4, T - autoTick)), lim = 90 * n;
    let want = gapTurn(a === 'red' ? RED : a === 'safe' || (a === 'play' && run.fl !== 'bounce') || (a === 'smash' && run.blaze) ? SAFE : GAP);
    // (F3B — 'play' never turns ACROSS red: if the gap is further … stage.js#41
    if (a === 'play' && !run.blaze) {
      const fl = floorNow(run), reach = 90 * Math.max(0, run.nl - T), dir = want < 0 ? -1 : 1;
      let part = Math.abs(want) > reach ? reach : Math.abs(want);
      while (part > 0 && kindAtTick(fl, sliceUnder(wrap(run.a + dir * part), fl.twist), run.nl, run.R) === RED) part -= 170;
      want = part > 0 ? dir * part : 0;
    }
    owed = want > lim ? lim : want < -lim ? -lim : want;
  }
  // offer the turn still owed, tick by tick up to tick T (MAX … stage.js#42
  function settle(T) {
    for (let t = Math.max(run.mt + 1, run.ll + 1, 0); t <= T && owed !== 0 && !isOver(run); t++) { owed -= turn(run, t, owed, ev); if (owed !== 0) clamped++; }
  }
  // FIX A — S12 THE TAPPER: a run started by a TAP (no drag) … stage.js#43
  let teach = false, turnAt = 0;
  function teachOn(on) { teach = on; stage.classList.toggle('is-teach', on); }
  // FAIR INPUT: a move counts at the tick of its own EVENT TIME … stage.js#44
  function move(ts, units) {
    if (!units || shown || held) return;
    turnAt = performance.now(); if (teach) teachOn(false);
    if (t0 == null) { if (starting) pre += units; return; }
    if (isOver(run)) return;
    const T = tickOf(ts, t0);
    if (T < 0) { owed += units; if (owed > OWED_MAX) owed = OWED_MAX; else if (owed < -OWED_MAX) owed = -OWED_MAX; return; } // stage#45
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
    // (F4B — WATCH THE LEADER: a tap = the next player — the view's pick; the test page's bot room: the stage's own)
    if ((watchUid || spect) && !onUi(e) && !sheetOpen) { if (o.onWatchTap) o.onWatchTap(); else if (sim) watch(nextFollow(rows, watchUid)); return; }
    if (onUi(e) || shown || sheetOpen) return;
    if (drag) return;                                               // (a second finger never steals the drag: the first one keeps it)
    if (t0 == null && !(match && !o.rivals)) { if (performance.now() - restartAt < RESTART_GUARD_MS) return; begin(stamp(e.timeStamp)); } // stage#46
    drag = { id: e.pointerId, x: e.clientX };
    try { app.setPointerCapture(e.pointerId); } catch { /* fine */ }
  }, sig);
  app.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    // every sample the browser gathered since the last frame, each at its own time (a 120 Hz finger on a 60 Hz frame)
    const list = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null, n = list && list.length ? list.length : 1;
    for (let i = 0; i < n; i++) {
      const s = list && list.length ? list[i] : e;
      // 1 : 1 — the ring under the ball moves exactly as far as the … stage.js#47
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
    if (shown || held) return; // stage#48
    if (t0 == null) begin(stamp(e.timeStamp));
    keyDir = e.key === 'ArrowLeft' ? -1 : 1;
  }, sig);
  document.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keyDir = 0; }, sig);

  // ---- F4B — THE MATCH (docs/freefall.md "THE MATCH" · "THE GHOSTS" · "THE DEPTH RAIL")
  const lin = v => Math.pow(v / 255, 2.2);
  const hexOk = hex => (/^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#00f0ff');
  const ghostOf = uid => { for (let i = 0; i < ghosts.length; i++) if (ghosts[i].uid === uid) return ghosts[i]; return null; };
  // the match's rivals: [{ uid, name, hex }] — a ghost each … stage.js#49
  function setGhosts(list) {
    const L = (list || []).slice(0, GHOSTS_MAX);
    let changed = L.length !== ghosts.length;
    for (let i = 0; i < L.length; i++) {
      const p = L[i], hex = hexOk(p.hex), name = String(p.name || 'GHOST').toUpperCase().slice(0, 12);
      let g = ghosts[i];
      if (!g || g.uid !== p.uid) { g = { uid: p.uid, name: '', hex: '', r: 0, g: 0, b: 0, G: createGhost(seed, 'match'), row: { uid: p.uid, name: '', hex: '', floor: 0, over: false, end: '', lost: false, gone: false, me: false, side: 1 } }; ghosts[i] = g; changed = true; }
      if (g.name !== name || g.hex !== hex) { g.name = name; g.hex = hex; g.r = lin(parseInt(hex.slice(1, 3), 16)); g.g = lin(parseInt(hex.slice(3, 5), 16)); g.b = lin(parseInt(hex.slice(5, 7), 16)); g.row.name = name; g.row.hex = hex; changed = true; }
    }
    ghosts.length = L.length;
    if (changed) { view.ghostNames(ghosts); view.ghosts(ghosts.length, gData); rows.length = 0; for (let i = 0; i < ghosts.length; i++) rows.push(ghosts[i].row); if (!spect) rows.push(meRow); rowsDirty = true; }
  }
  // WATCH (after an out · a watcher — JAYWALK's: the leader … stage.js#50
  function watch(uid) {
    const g = uid ? ghostOf(uid) : null;
    if (!g) { if (watchUid) { watchUid = ''; WA = null; stage.classList.remove('is-watch'); view.reset(run); view.adopt(run, ev, ev.length); hudFloor = -1; hudGap = -99; rowsDirty = true; if (sim) MH.watching(''); } return; }
    if (uid === watchUid) return;
    watchUid = uid; WA = createWatch(seed, 'match'); evW = []; wfed = 0; wNew = true; watchDelay = WATCH_DELAY;
    view.pose('play'); hudFloor = -1; hudGap = -99; rowsDirty = true;
    stage.classList.add('is-watch'); setGold(false);
    if (sim) MH.watching(`WATCHING ${g.name} · TAP FOR THE NEXT`);   // (the bot room's own line — in the cartridge the view writes it, with the floor)
  }
  // the match's run lands (THE FIRST GO's seed + tick 0 — it … stage.js#51
  function adoptMatch(A) {
    seed = String(A.seed); spect = !!A.spectate;
    startN++; // stage#52
    run = createRun({ seed, mode: 'match' }); ev = []; fed = 0;
    shown = spect; endedAt = 0; overTold = false; handed = false; finished = null; away = false; held = false; owed = 0; pre = 0; newBest = false; drag = null;
    view.reset(run); view.setBest(spect ? 0 : tapeFloor);
    whipAt = reduceM ? -1e9 : performance.now();
    for (let i = 0; i < ghosts.length; i++) resetGhost(ghosts[i].G, seed, 'match');
    watchUid = ''; WA = null; end.hidden = true;
    stage.classList.remove('is-watch', 'is-over', 'is-open', 'is-starting'); stage.classList.add('is-live'); setGold(false);
    view.pose('play'); prepBanner(0);
    starting = false; soundsBtn.hidden = true; note.hidden = !runNote; H.edge(0);
    t0 = Number(A.t0) || performance.now(); momentsAt = performance.now() + MOMENTS_QUIET_MS; lastSaid = saidSeen();
    awakeAt = performance.now(); awake(true);
    if (!spect && A.log && A.log.length) { // stage#53
      for (let i = 0; i < A.log.length; i++) setAngle(run, A.log[i].t, A.log[i].a, ev);
      const T = Math.floor((performance.now() - t0) / TICK_MS);
      if (T > 0) stepTo(run, T, ev);
      fed = ev.length; view.adopt(run, ev, fed);
    }
    rows.length = 0; for (let i = 0; i < ghosts.length; i++) rows.push(ghosts[i].row); if (!spect) rows.push(meRow);
    rowsDirty = true; playing = -1; clockSec = -1; hudFloor = -1; hudGap = -99;
  }
  // the test page's BOT ROOM (matchsim.js — lazy: never in the … stage.js#54
  function startSim() {
    const s = seed;
    match = true; stage.classList.add('is-match');
    lazyImport(import('./matchsim.js'), './matchsim.js').then(MS => {
      if (gone || t0 == null || s !== seed) return;
      sim = MS.createSim(seed, Math.max(1, Math.min(GHOSTS_MAX, Math.floor(o.rivals))), o.simOpts || {});
      setGhosts(sim.players);
      for (let i = 0; i < ghosts.length; i++) resetGhost(ghosts[i].G, seed, 'match');
    }).catch(() => {});
  }
  const clockText = left => `${Math.floor(left / 60)}:${left % 60 < 10 ? '0' : ''}${left % 60}`;
  // the rail + the markers + the top line — built where … stage.js#55
  function matchHudNow(R0) {
    rowsDirty = false; domAt = performance.now();
    if (!spect) { meRow.floor = run.floor; meRow.over = isOver(run); meRow.end = !meRow.over ? '' : run.st === 'made' ? 'made' : run.st === 'cap' ? 'cap' : 'out'; }
    MH.rail(rows);
    // F5C — LAST ONE STANDING (3+ players, every rival over, me … stage.js#56
    if (!lastSaid && !spect && performance.now() >= momentsAt) { const lead = lastStanding(rows); if (lead != null) { lastSaid = true; saidKeep(); MH.last(lastWords(lead, madeAhead(rows))); if (snd) { snd.play('last-standing'); duckFor(DUCK_MS['last-standing']); } } }
    let n = 0;
    for (let i = 0; i < rows.length; i++) if (!rows[i].over && !rows[i].dead) n++;   // (FIX B — S7: a phone with no news for LOST_OUT_MS is not PLAYING)
    if (n !== playing) { playing = n; setTop(`${best > 0 && !spect ? `${bestLine(best)}${n ? ' · ' : ''}` : ''}${n ? `${n} PLAYING` : ''}`); }   // (FIX A — N13: never "0 PLAYING")
    // (the bot room with `&watch=1`: every bot is down — its own card comes now)
    if (sim && o.watchSim && watchUid && n === 0) { watch(''); end.hidden = false; }
  }
  // ONE FRAME of the match: every ghost to the world's tick … stage.js#57
  function ghostsFrame(now, tauW, R0, tauD, lead) {
    const n = ghosts.length, tauG = tauW + simShift, nodes = sim ? sim.reveal(Math.floor(tauG)) : null;
    const myA = wrap(R0.a + lead), myY = -R0.floor * LIFT.H + (isOver(R0) ? 0 : liftOf(R0, tauD)), alone = spect && !watchUid;
    for (let i = 0; i < n; i++) {
      const g = ghosts[i], G = g.G, was = G.floor, o8 = i * GHOST_STRIDE;
      if (nodes) feedGhost(G, nodes[g.uid]);
      stepGhost(G, tauG, now);
      const up = G.y > myY, d = up ? G.y - myY : myY - G.y, off = G.lost || G.over || g.uid === watchUid, far = up ? MARK_UP : MARK_FLOORS;
      gData[o8] = ghostPhi(G.a, myA) * UNIT; gData[o8 + 1] = G.y;
      // (F5C — THE EDGE MARKERS sit on the SIDE the rival really is … stage.js#58
      const sx = Math.sin(gData[o8]);
      if (sx > 0.2 ? g.row.side !== 1 : sx < -0.2 ? g.row.side !== -1 : false) { g.row.side = sx > 0 ? 1 : -1; rowsDirty = true; } gData[o8 + 2] = g.r; gData[o8 + 3] = g.g; gData[o8 + 4] = g.b;
      gData[o8 + 5] = off || d >= far ? 0 : d > far - 0.5 ? (far - d) * 2 : 1;   // (it fades out where its edge marker takes over)
      gData[o8 + 6] = alone || d >= NEAR_FLOORS ? 0 : d <= NEAR_FLOORS - 0.4 ? 1 : (NEAR_FLOORS - d) * 2.5;
      gData[o8 + 7] = i;
      // (ABOVE me a ghost rides in the HUD's own lanes — the … stage.js#59
      if (up && d > 0.9) { const k = (MARK_UP - d) * 0.6; if (k < gData[o8 + 5]) gData[o8 + 5] = k > 0 ? k : 0; gData[o8 + 7] = -1; }
      if (simNear) { gData[o8 + 1] = myY - ((i % 5) - 2) * 0.9; gData[o8 + 5] = 1; gData[o8 + 6] = 0; gData[o8 + 7] = i; } // stage#60
      // (a rival at a BREAKTHROUGH: a small echo only)
      if (G.floor > was && gData[o8 + 5] > 0 && ((was < BREAK_AT.skylight && G.floor >= BREAK_AT.skylight) || (was < BREAK_AT.splash && G.floor >= BREAK_AT.splash) || (was < BREAK_AT.seabed && G.floor >= BREAK_AT.seabed))) view.ghostEcho(i);
      const row = g.row;
      const quiet = G.lost ? now - G.lostAt : 0, gn = quiet > LOST_GONE_MS, dead = quiet > LOST_OUT_MS;
      if (row.floor !== G.floor || row.over !== G.over || row.lost !== G.lost || row.end !== G.end || row.gone !== gn || row.dead !== dead) {
        // F5C — RIVAL OUT: a rival's run ended OUT (red / the dark — … stage.js#61
        if (!row.over && G.over && G.end === 'out' && now >= momentsAt) { MH.callout(outWords(row.name || 'A RIVAL'), row.hex || '#fff'); if (snd) snd.play('out-drop'); }
        row.floor = G.floor; row.over = G.over; row.lost = G.lost; row.gone = gn; row.dead = dead; row.end = G.end; rowsDirty = true;
      }
    }
    if (rowsDirty) matchHudNow(R0);
    // the last half minute's clock (one write a second)
    const left = Math.ceil((MODES.match.capTicks - tauW) / 60);
    if (left !== clockSec) { clockSec = left; MH.clock(left <= 30 && left > 0 ? clockText(left) : ''); }
  }

  // ---- THE HOLD: the page hidden / the phone locked holds a … stage.js#62
  function hide() {
    awake(false);
    if (snd && snd.rumble) snd.rumble(0);
    view.rest(true);
    if (held) { countAt = 0; countShown = 0; holdN.textContent = ''; return; } // stage#63
    if (t0 == null || isOver(run) || spect) { if (t0 != null && !spect) handOn(); return; }
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
    view.rest(false); last = 0; tiers.reset(); hudGap = -99; // stage#64
    // FIX B — S15 THE CLOCK AFTER A LOCK: a MATCH's tick 0 is the … stage.js#65
    if (match && t0 != null && o.matchT0) { const T = o.matchT0(); if (T != null && Number.isFinite(T) && Math.abs(T - t0) > 250) t0 = T; }   // (a real jump only — never the server offset's own jitter)
    if (held && !countAt) startCount();
    if (glDown) { clearTimeout(lostTimer); lostTimer = 0; rebuild(); }
  }
  // F4A — a hold's way back went on WITHOUT its stamp (the … stage.js#66
  function unstampedNow() { try { runNote = `${o.onUnstamped() || ''}`; setNote(runNote); note.hidden = !runNote; } catch { /* the view's own business */ } }
  /** THE HOLD's way back: 3 · 2 · 1. F4A — the cartridge stamps it (`o.resume(i)` → this page's clock at the SERVER's stamp, 0 = none): the
   *  run goes on exactly 3 × COUNT_MS after the stamp — the judge's own number (proof.js#RESUME_LEAD_MS) */
  function startCount() {
    countAt = performance.now() + 3 * COUNT_MS; countShown = 0; stamped = false; countTries++;
    if (!o.resume) return;
    const n = ++countN;
    Promise.resolve().then(() => o.resume(run.holds - 1)).then(at => {
      if (gone || n !== countN || !held || !countAt) return;
      if (at < 0) { countTries = RESUME_TRIES; return; } // stage#67
      if (!(at > 0)) return;
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
      // F3B — THE BREAKTHROUGHS (the scene plays them — night.js; … stage.js#68
      if (e.e === 'area' && e.floor === BREAK_AT.splash && snd && snd.muffle) snd.muffle(MUFFLE_S, BREAK_HIT_S + MUFFLE_AFTER_S);
      if (e.e === 'made' && snd && !reduceM) snd.playCues(FIREWORK_CUES); // stage#69
      if (e.e === 'fall' && !fromRun && crossedBest(best, e.floor)) {
        // THE CROSSING (once a run): NEW BEST — the number turns gold … stage.js#70
        newBest = true;
        if (e.floor >= NEW_BEST_FROM) { setGold(true); say('NEW BEST', 'is-gold', 3, 1300, now); if (snd) snd.play(CUE_NEW_BEST.id); }
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
  function playAgain() { if (!shown || end.hidden) return;   /* (F4B: only from the stage's OWN card — never while WATCHING) */ if (o.onAgain) { again.classList.add('is-busy'); Promise.resolve(o.onAgain()).then(ok => { again.classList.remove('is-busy'); if (ok === false) restart(); }, () => again.classList.remove('is-busy')); } else restart(); }
  press(again, playAgain);
  /** the page's SHARE (F5B — SHARE = THE PICTURE ONLY, the cartridge's own: card.js + send.js): the run's card is DRAWN + ENCODED when the end
   *  card shows (warmPic — the staged frame is in by then: END_HOLD_MS > every SHOT_AT), and the tap hands the phone's share sheet EXACTLY ONE
   *  PNG — no line, no link, nothing asked of a server; a phone that can't share a file is SHOWN the picture to save */
  let pic = null, picMods = null;
  const picKit = () => (picMods ||= Promise.all([lazyImport(import('./send.js'), './send.js'), lazyImport(import('./card.js'), './card.js')]).catch(e => { picMods = null; throw e; }));
  function warmPic() {
    pic = null;
    if (o.onLeave) return;   // (the cartridge's own card has no SHARE: the console's footer shares its podium's run)
    const res = resultOf(run), n = startN, shot = lastShot();
    // (F5C — the card always shows the player's name: the page … stage.js#71
    let name = ''; try { name = String((o.name && o.name()) || '').slice(0, 24); } catch { /* none */ }
    const card = { floor: res.floor, blazes: res.blazes, cause: res.cause, made: res.made, mode: MODE === 'solo' ? 'solo' : MODE, name };
    picKit().then(([S, C]) => { if (n !== startN) return; pic = S.prepPicture(() => (n === startN ? C.cardFor(card, shot) : null)); pic.warm(); }, () => {});
  }
  // (FIX A: a BUSY state from the tap until the share settles — never a dead second while the phone's sheet comes up)
  const shareBusy = p => { share.classList.add('is-busy'); const slow = setTimeout(() => { shareT.textContent = 'SHARING…'; }, 250); Promise.resolve(p).finally(() => { clearTimeout(slow); shareT.textContent = 'SHARE'; share.classList.remove('is-busy'); }); };
  const sharePage = () => {
    if (!shown || end.hidden || share.classList.contains('is-busy')) return;
    if (pic) { shareBusy(pic.send()); return; }   // (ready: the share sheet in this very turn)
    const n = startN;
    shareBusy(picKit().then(() => (n === startN && pic ? pic.send() : null), () => {}));
  };
  clickPress(share, sharePage);   // (FIX C — N12: a real click)
  if (o.onLeave) press(city, () => { city.classList.add('is-busy'); Promise.resolve(o.onLeave()).then(null, () => city.classList.remove('is-busy')); });
  function showEnd(now) {
    shown = true; drag = null; keyDir = 0; owed = 0;
    const res = resultOf(run), log = logOf(run), was = best;
    // THE DETERMINISM CHECK (the console only): the recorded … stage.js#72
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
    // F3B — THE FINISH's HOOK (match + daily: THE BOTTOM is their … stage.js#73
    if (res.made) { handOn(); finished.same = same; finished.judged = verdict.ok === true; }
    EC.set({ words: endWords(res), made: res.made, floor: res.floor, bounces: res.bounces, blazes: res.blazes, bestRun: res.bestRun });
    EC.best(fromRun ? was : best, isNew, was, null);   // (F5C: the test page counts nothing — its AVG is a dash)
    warmPic();   // (F5B: the share picture is ready by the time a thumb reaches SHARE)
    // F4A — THE CARTRIDGE: a PROVEN run ends on the console's … stage.js#74
    const E = o.onEnd ? o.onEnd(res) || { own: true } : { own: true };
    if (E.note) { runNote = String(E.note); setNote(runNote); }
    end.hidden = !E.own; soundsBtn.hidden = false; note.hidden = !(PAGE || (E.own && runNote));
    // (F4B — the test page's bot room with `&watch=1`: OUT = WATCH THE LEADER — its card comes when every bot is down)
    if (sim && o.watchSim && rows.some(r => !r.me && !r.over)) { end.hidden = true; watch(follow(rows)); }
    stage.classList.remove('is-live', 'is-near'); stage.classList.add('is-over'); edge();
    hook.ends.push({ seed, mode: MODE, same, at, live: res, replay: r, judge: verdict, entries: log.length, holds: run.holds, clamped, best, was, isNew });
    if (hook.ends.length > 50) hook.ends.shift();
  }

  // F4B — THE SHARE CARD's frame (shot.js — HIGH RISE S5's … stage.js#75
  let shotRun = -1;
  const shotKey = () => { try { return String((o.shotKey && o.shotKey()) || seed); } catch { return seed; } };
  /** F5A — the run as it stood `ticks` before its last tick (the engine played again from its own log — after the end: nothing here runs in
   *  play), the tower at the angle the run ENDED on (the ball is over the slice it is about to land on) → null = it can't be had */
  function runBefore(ticks) {
    const until = run.end - ticks;
    if (!(ticks > 0) || !(until > 0)) return null;
    const rb = createRun({ seed, mode: MODE }), log = logOf(run);
    for (let i = 0; i < log.length; i++) { const e = log[i]; if (e.t > until) break; if (isHold(e)) hold(rb, e.t); else turn(rb, e.t, angDiff(e.a, rb.a)); }
    stepTo(rb, until);
    if (isOver(rb) || rb.floor > run.floor || rb.floor < run.floor - 1) return null;
    rb.a = run.a;
    return rb;
  }
  function takeShot(tauD, lead) {
    shotRun = startN;
    if (!view.snap) return;
    try {   // (a picture is polish: whatever goes wrong here never reaches the frame)
      const res = resultOf(run), cause = res.cause, at = ballAt(cause), rect = (sw, sh, bx, by, col) => shotCrop(sw, sh, bx, by, at, col);
      let cv = null;
      if (view.shot) {
        // F5A — THE HERO FRAME TELLS THE STORY: the moment a beat … stage.js#76
        const G = stagingOf(cause), rb = runBefore(G.before);
        cv = view.shot(rb || run, rb ? rb.t : tauD, SHOT_BOX.w, SHOT_BOX.h, rect, G);
        view.draw(run, tauD, 0, lead);
      } else cv = view.snap(SHOT_BOX.w, SHOT_BOX.h, rect);
      if (cv) keepShot({ key: shotKey(), canvas: cv, cause, made: !!res.made, floor: res.floor, blazes: res.blazes, look: lookT, ballX: cv.ballX, ballY: cv.ballY });
    } catch { /* no frame: the card draws on the night's dark */ }
  }
  let raf = 0, last = 0, frameN = 0, prevWork = 0;
  const frames = new Float32Array(600); let frameK = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(250, now - last) : TICK_MS;
    last = now;
    if (document.visibilityState === 'hidden') return;
    const w0 = performance.now();
    if (BRK) { pingGap = Math.max(pingMax, w0 - pingLast); }
    frameN++;
    if (!warmed && frameN > 2 && t0 == null) warmed = view.warm(run);
    if (frameN % 15 === 0) { // stage#77
      const L = o.lookLock && o.lookLock();
      if (L) { if (cleanLk(L) !== lookT) forceLook(L); } else setLook(o.lookNow ? o.lookNow() : lookWant);
    }
    if (lookT !== lookSeen) lookNow();
    if (dimming && (frameN & 3) === 0 && (view.skyIn() || now - dimFrom > DIM_MAX_MS || t0 != null || starting)) { dimming = false; stage.classList.remove('is-dim'); }
    if (frameN % 15 === 0 && !teach && t0 != null && MODE !== 'match' && run.floor === 0 && !isOver(run) && !held && now - turnAt > TEACH_MS) teachOn(true);
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
          } else { const c = Math.ceil(left / COUNT_MS); if (c !== countShown && (c < countShown || !countShown)) countLine(c); } // stage#78
        }
      } else {
        tau = Math.max(0, (now - t0) / TICK_MS);
        if (!isOver(run) && !spect) {
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
      if (snd) { snd.playCues(snd.cuesOf(ev, late, cues, fed)); for (let i = 0; i < cues.length; i++) { const ms = DUCK_MS[cues[i].id]; if (ms) duckFor(ms + (cues[i].delay || 0) * 1000); } }
      fed = ev.length;
    }
    const over = isOver(run);
    if (over && !endedAt) { endedAt = now; awake(false); handOn(); }
    if (o.onFrame && t0 != null) o.onFrame(now);   // (F4A — the cartridge: the proof's new chunks — view.js)
    if (over && !overTold && o.onOver) { overTold = true; try { o.onOver(resultOf(run)); } catch { /* the view's own business */ } }
    if (over && !shown && now - endedAt >= (run.st === 'made' ? END_HOLD_MADE_MS : END_HOLD_MS)) showEnd(now);
    // (what the tower shows AHEAD of the run: the finger's moves … stage.js#79
    let lead = t0 == null ? pre : now < t0 ? owed : 0;
    if (now - whipAt < WHIP_MS) { const k = 1 - (now - whipAt) / WHIP_MS; lead += Math.round(TURN * k * k * k); }
    // F4B — THE MATCH: the world's tick runs on past my own end → … stage.js#80
    let R0 = run, tauD = over ? run.end : tau;
    if (match && t0 != null) {
      const tauW = now > t0 ? (now - t0) / TICK_MS : 0;
      if (watchUid) {
        const g = ghostOf(watchUid), tw = tauW > watchDelay ? tauW - watchDelay : 0;
        if (g) {
          const again = stepWatch(WA, g.G, Math.floor(tw), evW);
          if (again && watchDelay < WATCH_DELAY_MAX) watchDelay += 30; // stage#81
          if (again || wNew) { wNew = false; view.reset(WA.run); view.adopt(WA.run, evW, evW.length); wfed = evW.length; }
          else if (evW.length > wfed) { view.feed(evW, wfed, evW.length); wfed = evW.length; }
          R0 = WA.run; tauD = isOver(R0) ? R0.end : tw;
        }
      }
      if (R0 === run) lead += spinAhead(tau);
      ghostsFrame(now, tauW, R0, tauD, lead);
    } else lead += spinAhead(tau);
    // the HUD (FIX D): what changed → the GL HUD, BEFORE the picture (drawn in it — the number in the same frame as its floor)
    if (R0.floor !== hudFloor) hudFloorNow(R0);
    const overD = isOver(R0), gap = overD ? 9 : darkGap(R0);
    if (gap !== hudGap) hudDarkNow(gap, overD);
    hudFrame(now);
    const wd = BRK ? performance.now() : 0;
    view.veil(HUD0 ? 0 : vDark, !HUD0 && (stage.classList.contains('is-live') || stage.classList.contains('is-starting')), hudInk);   // (FIX C — THE VEIL)
    view.draw(R0, tauD, dt, lead);
    if (over && R0 === run && !spect && shotRun !== startN && t0 != null && now - endedAt >= shotMs(run.st === 'out' ? run.cause : run.st)) takeShot(tauD, lead); // stage#82
    if (BRK) { const we = performance.now(), sa = view.submitAt(); fBuild = sa > wd && sa < we ? sa - wd : we - wd; fSub = sa > wd && sa < we ? we - sa : 0; }   // (FIX B — `?fps=2`: the scene build · the render submit)
    const work = performance.now() - w0;
    tiers.sample(now, prevWork); prevWork = work;
    if (t0 != null && !over && !held && now - t0 > 1000) trialTick(dt);
    if (pin == null && frameN % 10 === 0) tiers.tick(now);
    frames[frameK++ % 600] = dt;
    if (t0 != null && !over && !held && dt > HITCH_MS && now - t0 > 1000) hitchNow(dt, now);
    else if (t0 != null && !over && !held && dt > worstMs && now - t0 > 1000) worstMs = dt;
    if (fps && frameN % 30 === 0) fpsLine();
    if (BRK) { qOurs = pUpd + pBuild + pSub; qGap = pingGap; pBuild = fBuild; pSub = fSub; pUpd = Math.max(0, work - fBuild - fSub); allWork += work; allN++; pingMax = 0; pingLast = performance.now(); }
  }
  // FIX D — the GL HUD's frame: the stage's state (classes that change OUTSIDE a fall — read, never written here)
  const HS = { live: false, starting: false, over: false, open: false, watch: false, match: false, final: false, dim: false, nohud: HUD0, sheet: false, noteHidden: false };
  function hudFrame(now) {
    const c = stage.classList;
    HS.live = c.contains('is-live'); HS.starting = c.contains('is-starting'); HS.over = c.contains('is-over'); HS.open = c.contains('is-open'); HS.watch = c.contains('is-watch');
    HS.match = c.contains('is-match'); HS.final = c.contains('is-final'); HS.dim = dimming; HS.sheet = MH.sheet(); HS.noteHidden = note.hidden || !(PAGE || o.go);
    const z = view.cssSize ? view.cssSize() : null;
    if (z) H.size(z[0], z[1], z[2]);
    H.frame(now, HS);
  }
  // FIX B — SMOOTH MOTION THROUGH A MISSED FRAME (VIEW ONLY): … stage.js#83
  const SMOOTH = !(o.ab && o.ab.smooth === false);
  function spinAhead(tau) {
    if (!SMOOTH || t0 == null || held || spect || isOver(run) || tau < 1) return 0;
    const f = tau - Math.floor(tau);
    let d = owed + keyDir * KEY_SPIN;
    if (d > MAX_SPIN) d = MAX_SPIN; else if (d < -MAX_SPIN) d = -MAX_SPIN;
    return d * f;
  }
  // THE HITCH LOG (F3B — THE STUTTERS; HIGH RISE's): a frame … stage.js#84
  const HLOG = 24, hMs = new Float32Array(HLOG), hFloor = new Int32Array(HLOG), hWhy = new Uint8Array(HLOG), WHY = ['frame', 'pic', 'snd', 'band', 'tier', 'dom'];
  // (FIX A — the run's own tally, a cause each: how many · the … stage.js#85
  const cN = new Uint16Array(6), cMax = new Float32Array(6), cFl = new Int32Array(6);
  // FIX A — THE SPIKE RULE (the owner's iPhone: HITCH 16–19 a … stage.js#86
  const spikeAt = new Float64Array(SPIKE.n), hitPlay = new Float64Array(32);
  let pingGap = 0, spikeK = 0, hitK = 0, playMs = 0, spikeOff = false, trialFrom = -1, trialRate = 0, trialMs = 0, trialHits = 0, spikeSaid = '';
  function hitchNow(dt, now) {
    const i = hN++ % HLOG, at = now - dt;
    hMs[i] = dt; hFloor[i] = run.floor;
    const w = hWhy[i] = at - view.lastWork() < 160 ? 1 : snd && snd.lastWork && at - snd.lastWork() < 160 ? 2 : at - BNR.lastBake() < 160 ? 3 : at - tierAt < 400 ? 4 : at - domAt < 120 ? 5 : 0;
    hitches++; if (dt > worstMs) worstMs = dt;
    cN[w]++; if (dt > cMax[w]) { cMax[w] = dt; cFl[w] = run.floor; }
    if (BRK) breakdownNow(dt, i);
    if (w === 4 || pin != null) return;   // (a tier step's own stall never counts toward the next one)
    hitPlay[hitK++ % 32] = playMs;
    if (trialFrom >= 0) { if (trialMs >= SPIKE.settle) trialHits++; return; }
    spikeAt[spikeK++ % SPIKE.n] = now;
    if (!spikeOff && spikeK >= SPIKE.n && now - spikeAt[spikeK % SPIKE.n] <= SPIKE.span && tiers.get() > SPIKE.floor) {
      const span = Math.min(SPIKE.span, playMs) || 1;
      let n = 0;
      for (let k = 0; k < 32 && k < hitK; k++) if (hitPlay[(hitK - 1 - k) % 32] > playMs - span) n++;
      trialFrom = tiers.get(); trialRate = n * 1000 / span; trialMs = 0; trialHits = 0; spikeK = 0;
      tiers.ask(trialFrom - 1, true);
    }
  }
  /** (FIX B) a frame of play: the trial's clock — its verdict once it has run SPIKE.settle + SPIKE.trial ms */
  function trialTick(dt) {
    playMs += dt;
    if (trialFrom < 0) return;
    trialMs += dt;
    if (trialMs < SPIKE.settle + SPIKE.trial) return;
    const rate = trialHits * 1000 / SPIKE.trial, helped = rate <= trialRate * SPIKE.helped;
    spikeSaid = `spike ${trialFrom}→${trialFrom - 1}: ${trialRate.toFixed(2)}/s → ${rate.toFixed(2)}/s ${helped ? 'HELPED' : 'NO HELP → back'}`;
    if (!helped) { spikeOff = true; tiers.set(trialFrom); tiers.rest(); }   // (GO-LIVE G0.3: the timing rule + its cap probe rest too — they flapped 2→1→2→1→2; real work may still step down)
    trialFrom = -1; spikeK = 0;
  }
  /** `?fps=1`, the run over: what was left — the worst frame, the hitches, the top three causes with their floors */
  function runSummary() {
    const order = [0, 1, 2, 3, 4, 5].filter(k => cN[k]).sort((a, b) => cN[b] - cN[a] || cMax[b] - cMax[a]).slice(0, 3);
    return `${AB}RUN · ${(playMs / 1000).toFixed(0)} s · worst ${worstMs.toFixed(0)} ms · HITCH ${hitches}${order.map(k => ` · ${WHY[k]} ${cN[k]}× (${cMax[k].toFixed(0)} ms @${cFl[k]})`).join('')} · tier ${tierPath.join('→')}${spikeSaid ? ` · ${spikeSaid}` : trialFrom >= 0 ? ' · spike trial on' : ''}${BRK ? `\n${breakdownLine()}` : ''}`;
  }
  // FIX B — `?fps=2`: THE BREAKDOWN of every hitch — OUR work … stage.js#87
  const BRK = o.fps === 2, KIND = ['ours', 'busy', 'gpu'];
  const bOurs = new Float32Array(HLOG), bBusy = new Float32Array(HLOG), bWait = new Float32Array(HLOG), bKind = new Uint8Array(HLOG);
  const kN = new Uint16Array(3), kSum = new Float32Array(3), kMax = new Float32Array(3), kFl = new Int32Array(3);
  const pSum = new Float64Array(5);   // (over the hitches: upd · build · submit · busy · wait)
  let fBuild = 0, fSub = 0, pUpd = 0, pBuild = 0, pSub = 0, allWork = 0, allN = 0, pingMax = 0, pingLast = 0, pingT = 0, longN = 0, longMax = 0, longOn = false, longObs = null;
  if (BRK) {
    const ping = () => { const t = performance.now(), g = t - pingLast; if (g > pingMax) pingMax = g; pingLast = t; };
    pingLast = performance.now(); pingT = setInterval(ping, 4);
    try { longObs = new PerformanceObserver(l => { for (const e of l.getEntries()) { longN++; if (e.duration > longMax) longMax = e.duration; } }); longObs.observe({ type: 'longtask', buffered: false }); longOn = true; } catch { longOn = false; }
  }
  function breakdownNow(dt, i) {
    // (over the LAST TWO gaps: Chromium stamps a frame that … stage.js#88
    const o1 = pUpd + pBuild + pSub, ours = o1 > qOurs ? o1 : qOurs, busy = Math.max(0, (pingGap > qGap ? pingGap : qGap) - 4), wait = Math.max(0, dt - ours - busy);
    const k = ours >= busy && ours >= wait - TICK_MS ? 0 : busy >= wait - TICK_MS ? 1 : 2;
    bOurs[i] = ours; bBusy[i] = busy; bWait[i] = wait; bKind[i] = k;
    kN[k]++; kSum[k] += dt; if (dt > kMax[k]) { kMax[k] = dt; kFl[k] = run.floor; }
    pSum[0] += pUpd; pSum[1] += pBuild; pSum[2] += pSub; pSum[3] += busy; pSum[4] += wait;
  }
  function breakdownLine() {
    const n = kN[0] + kN[1] + kN[2] || 1, f = v => (v / n).toFixed(1);
    const order = [0, 1, 2].filter(k => kN[k]).sort((a, b) => kN[b] - kN[a]);
    return `WHY${order.map(k => ` · ${KIND[k]} ${kN[k]}× (avg ${(kSum[k] / kN[k]).toFixed(0)}, ${kMax[k].toFixed(0)} ms @${kFl[k]})`).join('') || ' · no hitch'}\nON A HITCH · ours ${f(pSum[0] + pSum[1] + pSum[2])} ms (upd ${f(pSum[0])} · build ${f(pSum[1])} · submit ${f(pSum[2])}) · busy ${f(pSum[3])} · wait ${f(pSum[4])} · every frame ours ${(allWork / (allN || 1)).toFixed(1)} ms · long tasks ${longOn ? `${longN} (${longMax.toFixed(0)} ms)` : 'n/a'}`;
  }
  /** the live line's last hitch, broken down */
  let qOurs = 0, qGap = 0;   // (the frame before's own work + its gap)
  const lastBrk = () => { if (!hN) return ''; const i = (hN - 1) % HLOG; return ` · ${KIND[bKind[i]]}: ours ${bOurs[i].toFixed(1)} busy ${bBusy[i].toFixed(0)} wait ${bWait[i].toFixed(0)}`; };
  // FIX B — THE A/B SWITCHES (the test page only: `o.ab` — … stage.js#89
  const AB = (() => { const a = o.ab || {}, s = [o.dpr ? `dpr ${o.dpr}` : '', a.bloom === false ? 'bloom 0' : '', a.fx === false ? 'fx 0' : '', a.wall === false ? 'wall 0' : '', a.ghosts === false ? 'ghosts 0' : '', pin != null ? `tier ${pin} pinned` : '', a.smooth === false ? 'smooth 0' : '', HUD0 ? 'hud 0' : ''].filter(Boolean); return s.length ? `AB ${s.join(' · ')} — ` : ''; })();
  /** the look on screen changed: the page's words + inks follow the picture (written at a change only) */
  function lookNow() { lookSeen = lookT; stage.dataset.look = lookT; H.look(lookT); }
  /** a floor was passed: the big number, the area (YOUR BEST's line once it is beaten) */
  function hudFloorNow(R = run) {
    hudFloor = R.floor; setNum(hudFloor); rowsDirty = true;
    if (teach && hudFloor >= 1) teachOn(false);
    const a = areaOf(hudFloor).name, ink = areaOf(Math.max(0, hudFloor - INK_LAG)).id;
    if (a !== hudArea) hudArea = a;
    if (ink !== hudInk) hudInk = ink; // stage#90
    if (newBest) setTop(bestLine(hudFloor));
  }
  /** THE DARKNESS — ALWAYS IN SIGHT (F3: JAYWALK-style pressure — never more than 3 floors above): the stage's data-dark = the floors it is
   *  above the ball (3 · 2 · 1; '' = no run / over): the stylesheet's dark edge creeps down from the top IN STEP with it — never over the
   *  ball or its floor; the warning + THE RUMBLE (sfx.js — it swells as the darkness closes) from 2 floors, loudest on the last one */
  function hudDarkNow(gap, over) {
    hudGap = gap; domAt = performance.now();
    const on = t0 != null && !over;
    vDark = on ? Math.max(1, Math.min(3, gap)) : 0;
    darkV = vDark ? String(vDark) : '';
    nearOn = gap <= 1 && on; H.near(nearOn, performance.now());
    if (snd && snd.rumble) snd.rumble(!on || held || watchUid || spect ? 0 : gap <= 1 ? 1 : gap === 2 ? 0.5 : 0);   // (F4B: the rumble is MY run's — never a watched player's)
  }
  function countLine(c) { countShown = c; holdN.textContent = String(c); }
  /** `?fps=1`: the last 120 frames, twice a second */
  function fpsLine() {
    if (t0 != null && isOver(run) && !spect) { const t = runSummary(); if (fpsA.data !== t) fpsA.data = t; return; }   // (FIX A: the END-OF-RUN SUMMARY stays up on the end screen)
    let sum = 0, worst = 0;
    const n = Math.min(frameK, 120);
    for (let i = 0; i < n; i++) { const v = frames[(frameK - 1 - i + 6000) % 600]; sum += v; if (v > worst) worst = v; }
    const i = view.info();
    fpsA.data = `${AB}${(1000 * n / sum).toFixed(0)} fps · worst ${worst.toFixed(0)} ms · HITCH ${hitches}${hitches ? ` (last: ${WHY[hWhy[(hN - 1) % HLOG]]} ${hMs[(hN - 1) % HLOG].toFixed(0)} ms @${hFloor[(hN - 1) % HLOG]}${BRK ? lastBrk() : ''})` : ''} · tier ${i.tier} @${i.dpr}${trialFrom >= 0 ? ' (trial)' : spikeOff ? ' (spike off)' : ''} · ${i.calls} calls · ${i.slices} slices`;
  }

  // (the pass's own checks — tests/integration/freefall-play.mjs)
  const matchInfo = () => ({ on: match, spect, watch: watchUid, watchFloor: WA ? WA.run.floor : -1, playing, shift: simShift, hud: MH.info(), layer: view.ghostInfo(), top: topText,
    ghosts: ghosts.map((g, i) => ({ uid: g.uid, name: g.name, floor: g.G.floor, over: g.G.over, end: g.G.end, lost: g.G.lost, held: g.G.held, moves: g.G.moves, bad: g.G.bad, a: g.G.a, y: g.G.y, phi: gData[i * GHOST_STRIDE], alpha: gData[i * GHOST_STRIDE + 5], near: gData[i * GHOST_STRIDE + 6] })) });
  Object.assign(hook, {
    matchState: matchInfo, watch: uid => watch(uid), simShift: n => { simShift = Math.max(0, Math.floor(n) || 0); }, simNear: v => { simNear = !!v; },
    state: () => ({ mode: MODE, seed, note: runNote, look: lookT, lookWant, lookAttr: stage.dataset.look, areaAttr: hudInk, started: t0 != null, starting, shown, held, counting: !!countAt, over: isOver(run), st: run.st, cause: run.cause, t: run.t, a: run.a, floor: run.floor, clean: run.clean, blaze: run.blaze, dark: darkGap(run), darkAttr: darkV, rumble: snd && snd.rumbling ? snd.rumbling() : 0, nl: run.nl, pl: run.pl, fl: run.fl, entries: run.lt.length, holds: run.holds, saves: run.saves, bounces: run.bounces, shatters: run.shatters, owed, clamped, best, tapeFloor, newBest, warmed, rebuilds, tier: tiers.get(), tierPath: tierPath.slice(), spike: { off: spikeOff, trial: trialFrom, rate: trialRate, ms: trialMs, hits: trialHits, said: spikeSaid, play: playMs }, fpsLine: fps ? fpsA.data : '', brk: BRK ? { kinds: Array.from(kN), sum: Array.from(pSum), long: longOn ? longN : -1 } : null, hitches, worstMs, hitchLog: Array.from({ length: Math.min(hN, HLOG) }, (_, k) => { const i = (hN - 1 - k + HLOG * 1000) % HLOG; return { ms: Math.round(hMs[i]), floor: hFloor[i], why: WHY[hWhy[i]] }; }), finished, muffles: snd && snd.muffles ? snd.muffles() : 0, events: ev.length, lates: snd && snd.lates ? snd.lates() : 0, cls: `${stage.className}${goldOn ? ' is-gold' : ''}${nearOn ? ' is-near' : ''}`, num: String(numShown), area: hudArea, banner: BNR.info(), gl: H.info(), top: topText, call: callText, frame: view.frame(run), info: view.info(), veil: view.veilInfo(), pxPerRad: view.pxPerRad() }),
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
    /** (F4B) THE SHARE CARD's frame of the last ended run on this phone (shot.js — null: none yet) */
    shot: () => lastShot(),
    frames: () => { const out = [], n = Math.min(frameK, 600); for (let i = n - 1; i >= 0; i--) out.push(frames[(frameK - 1 - i + 6000) % 600]); return out; },
    setLook: l => setLook(l), setTier: t => tiers.set(t), hitch: ms => hitchNow(ms, performance.now()), mh: { callout: (t, c) => MH.callout(t, c), reset: () => MH.reset(), last: w => MH.last(w) }, drawn: () => view.drawn ? Array.from(view.drawn()) : null, smoothOn: () => SMOOTH, lose: () => { const gl = view.el && (view.el.getContext('webgl2') || view.el.getContext('webgl')), x = gl && gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return !!x; },
    stop() { cancelAnimationFrame(raf); },
  });
  if (o.hook) window[o.hook] = hook;
  restart(); restartAt = -1e9;
  raf = requestAnimationFrame(frame);
  return {
    hook, restart, el: stage,
    // the cartridge's PLAY AGAIN: a stage kept warm (its scene, … stage.js#91
    moveTo(next) { acIn.abort(); acIn = new AbortController(); app = next; drag = null; app.replaceChildren(stage); wire(); },
    /** F4A — the cartridge's hands (view.js): the run as it stands (its log is the proof's), the start (PLAY AGAIN's remount: the tap WAS
     *  the start), the stage's own card with a line (NO SIGNAL), the card put away (the podium takes the screen) */
    run: () => run, result: () => resultOf(run), state: () => ({ started: t0 != null, starting, shown, held, over: isOver(run), seed, note: runNote }),
    /** F4B — THE MATCH's hands (view.js): the mode · 3 · 2 · 1 + the names · the run on THE FIRST GO's seed + clock · the rivals + their
     *  proof nodes · WATCH · the OUT card + the WATCHING line · the overlay Call the Winner sits in · my own numbers */
    setMatch(on) { match = !!on; MODE = on ? 'match' : MODE_IDS.includes(o.mode) ? o.mode : 'solo'; stage.classList.toggle('is-match', match); run = createRun({ seed, mode: MODE }); view.reset(run); },
    count: (text, names) => MH.count(text, names),
    adopt: A => adoptMatch(A),
    setGhosts,
    feedGhost(uid, node) { const g = ghostOf(uid); return g ? feedGhost(g.G, node) : 0; },
    ghostRows: () => rows,
    watch, watching: () => watchUid, watchFloor: () => (WA ? WA.run.floor : -1),
    watchLine: text => MH.watching(text), outCard: c => MH.outCard(c), over: MH.over,
    me(rec) { rec.floor = run.floor; rec.over = isOver(run); rec.made = run.st === 'made'; rec.cause = run.st === 'made' ? 'made' : run.st === 'cap' ? 'cap' : run.cause || ''; return rec; },
    matchState: () => matchInfo(),
    start() { begin(performance.now()); },
    // F4B — THE SHARE CARD's frame of THIS stage's run (shot.js — … stage.js#92
    shot: () => shotFor(shotKey()),
    // FIX B — S8: no run here (a phone not in the room's solo … stage.js#93
    block(text) { const t = String(text || ''); if (t === blockTxt) return; blockTxt = t; stage.classList.toggle('is-blocked', !!t); if (t) { setNote(t); note.hidden = false; } else if (!runNote) { setNote(PAGE ? 'TEST PAGE — NOTHING COUNTS YET' : ''); note.hidden = !PAGE; } },
    showCard(text) { runNote = String(text || ''); setNote(runNote); note.hidden = !runNote; end.hidden = false; },
    hideCard() { end.hidden = true; note.hidden = true; },
    destroy() { gone = true; unduck(); clearInterval(pingT); if (longObs) longObs.disconnect(); MH.destroy(); cancelAnimationFrame(raf); ac.abort(); acIn.abort(); awake(false); clearTimeout(lostTimer); clearInterval(sunTimer); clearTimeout(bnrTimer); BNR.destroy(); offGL(); H.destroy(); try { view.destroy(); } catch { /* gone */ } if (snd) snd.stopAll(); stage.remove(); if (o.hook && window[o.hook] === hook) delete window[o.hook]; },
  };
}
