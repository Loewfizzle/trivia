// FREEFALL — THE STAGE (F2 — docs/freefall.md "THE TEST PAGE"; HIGH RISE's stage.js is the pattern): the run loop on the pure engine, the
// night scene (night.js), the HUD, THE OPENING, THE HOLD, YOUR BEST, the sounds' cues, the end card — ONE module: the test page mounts
// it today (play.js), F4's cartridge will mount the same one. It COUNTS NOTHING itself: no /api, no profile, no report — the page hands
// it a best to read + write (this phone's), nothing else.
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
import { sliceStart, kindAtTick, wrap, angDiff } from './tower-gen.js';
import { replay, judgeRun } from './replay.js';
import { endWords, tickOf, areaOf } from './logic.js';
import { cleanBest, bestLine, crossedBest, nextBest } from './best.js';
import { CUE_NEW_BEST } from './sounds.js';
import { createTiers } from '../kit/tiers.js';
import { createNight, FF_ART_REV } from './night.js';
import { endCard } from './endscreen.js';
import { bakedNumber } from './bakedtext.js';

export const newSeed = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); };
/** the end card comes this long after EVERY end (the ball's last moment is seen) */
export const END_HOLD_MS = 700;
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
const NO_VIEW = { el: null, reset() {}, feed() {}, draw() {}, pose() {}, setTier() {}, warm: () => true, setBest() {}, grey() {}, rest() {}, adopt() {}, pxPerRad: () => 112, project: () => [0.5, 0.5], frame: () => null, apexY: () => 0.2, info: () => ({}), lastWork: () => 0, destroy() {} };

export function createStage(app, o = {}) {
  const PAGE = !!o.page, FIXED = String(o.seed || '').slice(0, SEED_MAX);
  const MODE = MODE_IDS.includes(o.mode) ? o.mode : 'solo';
  const FROM = Math.max(0, Math.min(600, Math.floor(Number(o.from) || 0)));
  const bestAt = o.best || { read: () => 0, write() {} }, readBest = () => cleanBest(bestAt.read()), writeBest = n => bestAt.write(n);
  const ac = new AbortController(), sig = { signal: ac.signal };   // (unmounted: every listener on the document goes with it)
  let gone = false;
  // THE SOUND SYNC (HIGH RISE S4A): a LIVE run holds the audio context awake — a lease renewed once a second from the frame
  // (audio/engine.js#holdAwake through its hub: THE STALE-MODULE RULE), let go on the end card, on a hold, on a hide
  const awake = on => { const f = globalThis.__nsHoldAwake; if (f) { try { f(on, 'freefall'); } catch { /* audio is polish */ } } };
  let awakeAt = 0;

  // ---- the page: the play area (the canvas — a drag ANYWHERE spins the tower), the HUD over it, THE OPENING, the hold, the end
  const play = h('div.ff-play', { role: 'application', 'aria-label': 'Freefall — drag left or right to spin the tower' });
  const dark = h('div.ff-dark', { 'aria-hidden': 'true' }), shade = h('div.ff-shade', { 'aria-hidden': 'true' });
  const topL = h('div.ff-best');
  const num = h('div.ff-num', { 'aria-label': '0' }, h('span.ff-dg', { 'aria-hidden': 'true' }, '0'));
  const areaL = h('div.ff-area', 'THE ROOFTOP'), call = h('div.ff-call', { 'aria-live': 'polite' }), warn = h('div.ff-warn', 'THE LIGHTS ARE GOING OUT');
  const hud = h('div.ff-hud', num, areaL, call, warn);
  // THE OPENING's TITLE (F3 — title-05, the owner's pick): Grok's lettering + its tagline, two pictures over the LIVE tower (the F2 tube
  // sign + its dropping ball are gone). THE GLINT (.ff-glint): a band of light swept across the lettering, MASKED TO THE LETTERING's
  // OWN ALPHA (the mask = the very file the <img> picked — no second download), a 4-point star on the last letter as it leaves — CSS
  // only (transform + opacity), running only while the opening waits
  const art = (name, w) => new URL(`../../../assets/freefall/title/${name}-${w}.webp?v=${FF_ART_REV}`, import.meta.url).href;
  const sizesOf = k => `min(${Math.round(k * 100)}vw, ${Math.round(k * 60)}vh)`;   // (the stage's column: min(100vw, 60dvh) wide)
  const glint = h('i.ff-glint', { 'aria-hidden': 'true' }), star = h('i.ff-star', { 'aria-hidden': 'true' });
  const titleImg = h('img.ff-title-img', { alt: 'Freefall', decoding: 'async', draggable: 'false', sizes: sizesOf(0.85), srcset: `${art('lettering', 780)} 780w, ${art('lettering', 1170)} 1170w`, src: art('lettering', 780) });
  const maskNow = () => { const u = titleImg.currentSrc || titleImg.src; if (u) { const v = `url("${u}")`; glint.style.webkitMaskImage = v; glint.style.maskImage = v; glint.classList.add('is-ready'); } };
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
  const share = h('button.ff-foot-b.ff-share', { type: 'button', disabled: true, 'aria-disabled': 'true' }, 'SHARE · SOON'), city = h('a.ff-foot-b.ff-city', { href: '/' }, 'CITY');
  const end = h('div.ff-end', { hidden: true }, EC.el, h('div.ff-endfoot', again, h('div.ff-foot-row', share, city)));
  const note = h('div.ff-note', PAGE ? 'TEST PAGE — NOTHING COUNTS YET' : '');
  const fpsA = document.createTextNode(''), fps = o.fps ? h('div.ff-fps', fpsA) : null;
  // THE SOUNDS (sfx.js — the SHARED audio engine's SFX bus; unlocked by the first touch, never before) + THE SOUNDS LIST (the page's sheet)
  let snd = null, sheetOpen = false;
  const soundsBtn = press(h('button.ff-snd', { type: 'button' }, 'SOUNDS'), () => {
    if (sheetOpen) return;
    sheetOpen = true;
    lazyImport(import('./audition.js'), './audition.js').then(A => A.openAudition({ press, onClose: () => { sheetOpen = false; last = 0; } })).catch(() => { sheetOpen = false; });
  });
  const stage = h('div.ff-stage.is-open', play, dark, shade, topL, hud, open, foot, holdEl, end, PAGE ? soundsBtn : null, PAGE ? note : null, fps);
  app.replaceChildren(stage);
  const hook = { ends: [], view: null, sfx: null, auto: null };
  // (the page installs the shared engine itself; in the console it is running long since)
  Promise.all([PAGE ? lazyImport(import('../../audio/engine.js'), '../../audio/engine.js') : null, lazyImport(import('./sfx.js'), './sfx.js')])
    .then(([E, S]) => { if (gone) return; if (E) E.installAudio(); S.fetchSounds(); Promise.resolve(S.decode()).catch(() => {}); snd = S; hook.sfx = S; }).catch(() => { /* silent: audio is polish */ });

  // ---- the view (the night look) + its quality tiers; a browser with no WebGL gets the stage + one line saying so
  const pin = o.tier == null ? null : Math.max(0, Math.min(2, o.tier));
  const noGL = () => h('p.ff-nogl', 'This browser can’t draw the game here (it has no WebGL).');
  let view, glDown = null;
  try { view = createNight(play, { tier: pin == null ? 2 : pin, dprMax: o.dpr || 0 }); }
  catch { stage.append(noGL()); return null; }
  hook.view = view;
  const tierPath = [pin == null ? 2 : pin];
  const tiers = createTiers({ apply: t => { view.setTier(t); if (tierPath.length < 40) tierPath.push(t); }, initial: pin == null ? 2 : pin });
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
    try { view = createNight(play, { tier: tiers.get(), dprMax: o.dpr || 0 }); }
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
  let callUntil = 0, callPri = 0, callAnim = null;
  const POP = [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1.12)', offset: 0.22 }, { opacity: 1, transform: 'scale(1)', offset: 0.4 }, { opacity: 1, transform: 'scale(1)', offset: 0.8 }, { opacity: 0, transform: 'scale(1.04)' }];
  function say(text, cls, pri, ms, now) {
    if (now < callUntil && pri < callPri) return;
    callUntil = now + ms; callPri = pri;
    call.textContent = text; call.className = `ff-call ${cls}`;
    if (callAnim) callAnim.cancel();
    callAnim = call.animate ? call.animate(POP, { duration: ms, easing: 'ease-out', fill: 'forwards' }) : null;
  }
  const SWELL = [{ transform: 'scale(1)', opacity: 0.8 }, { transform: 'scale(1.25)', opacity: 1, offset: 0.3 }, { transform: 'scale(1)', opacity: 0.8 }];

  // ---- the run: the pure engine on this page's clock
  let seed = '', run = null, t0 = null, shown = false, endedAt = 0, starting = false, startN = 0, warmed = false;
  let owed = 0, carry = 0, pre = 0, clamped = 0, drag = null, keyDir = 0, keyTick = 0, autoTick = 0;
  let held = false, heldT = 0, countAt = 0, countShown = 0, away = false, restartAt = -1e9;
  let best = readBest(), tapeFloor = 0, newBest = false, fromRun = false, hudFloor = -1, hudGap = -99, hudArea = '', hitches = 0;
  let ev = [], fed = 0;
  const cues = [];
  function restart(s = FIXED || newSeed()) {
    seed = s; run = createRun({ seed, mode: MODE }); t0 = null; shown = false; endedAt = 0; starting = false; startN++; restartAt = performance.now();
    ev = []; fed = 0; owed = 0; carry = 0; pre = 0; clamped = 0; drag = null; keyDir = 0; autoTick = 0;
    held = false; countAt = 0; away = false; hitches = 0;
    best = Math.max(best, readBest()); tapeFloor = best; newBest = false; fromRun = false;   // (max: a phone whose storage is blocked still keeps its best for the visit)
    view.reset(run); view.setBest(tapeFloor); view.pose('open', true);
    end.hidden = true; holdEl.hidden = true; soundsBtn.hidden = false; note.hidden = false;
    stage.classList.remove('is-live', 'is-over', 'is-gold', 'is-held', 'is-near', 'is-starting'); stage.classList.add('is-open');
    topL.textContent = bestLine(best);
    hudFloor = -1; hudGap = -99; hudArea = ''; callUntil = 0; callPri = 0; if (callAnim) { callAnim.cancel(); callAnim = null; } call.textContent = ''; call.className = 'ff-call';
    // (THE BAKED HUD's warm-up: the plain + the gold digits are baked behind the opening — a NEW BEST bakes nothing in its frame)
    stage.classList.add('is-gold'); BN.warm(); stage.classList.remove('is-gold'); BN.dirty();
    setNum(0); areaL.textContent = areaOf(0).name; hudArea = areaL.textContent;
    dark.style.opacity = '0';
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
    soundsBtn.hidden = true; note.hidden = true;
    t0 = ts;
    if (FROM) { dive(FROM); fromRun = true; t0 = ts - run.t * TICK_MS; }
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
    if (ready) { live(ts); return; }
    const m = startN;
    snd.whenReady(START_WAIT_MS).then(() => { if (!gone && m === startN && starting) live(performance.now()); }, () => { if (!gone && m === startN && starting) live(performance.now()); });
  }

  /** the checks' own hand (`hook.auto` — never a player's): 'gap' = every floor's gap (a dive: THE BLAZE) · 'play' = a bounce a floor, then its gap ·
   *  'smash' = gaps until THE BLAZE is lit, then solid ground (a shatter) · 'safe' = stay on safe ground · 'red' = onto the red */
  function autoTurn(T) {
    const a = hook.auto, want = gapTurn(a === 'red' ? RED : a === 'safe' || (a === 'play' && run.fl !== 'bounce') || (a === 'smash' && run.blaze) ? SAFE : GAP), n = Math.max(1, Math.min(4, T - autoTick)), lim = 90 * n;
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
    if (T < 0) return;
    settle(T - 1);          // (what was still owed belongs to the ticks before this move)
    owed += units;
    owed -= turn(run, T, owed, ev);
    if (owed > OWED_MAX) owed = OWED_MAX; else if (owed < -OWED_MAX) owed = -OWED_MAX;   // (a wild flick: never more than 8 ticks — 0.13 s — of catching up after the finger)
  }
  const stamp = ts => { const now = performance.now(); return ts > 0 && ts <= now + 4 && now - ts < 1000 ? ts : now; };   // (a browser whose event clock is not the page's: the handler's own time)
  const onUi = e => !!(e.target && e.target.closest && e.target.closest('button, a, .sheet, .sheet-backdrop'));
  // (the whole page is the drag's ground — the dark bars beside the phone's column on a wide screen too)
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
  app.addEventListener('touchmove', e => { if (!onUi(e)) e.preventDefault(); }, { passive: false, signal: ac.signal });   // (no page scroll under a finger)
  document.addEventListener('keydown', e => {
    if (sheetOpen) return;
    if (shown && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); playAgain(); return; }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (shown) return;
    if (t0 == null) begin(stamp(e.timeStamp));
    keyDir = e.key === 'ArrowLeft' ? -1 : 1;
  }, sig);
  document.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keyDir = 0; }, sig);

  // ---- THE HOLD: the page hidden / the phone locked holds a SOLO run (engine.js#hold — a logged event); back = 3 · 2 · 1, then on
  function hide() {
    awake(false);
    view.rest(true);
    if (held) { countAt = 0; countShown = 0; holdN.textContent = ''; return; }   // (hidden again during the 3 · 2 · 1: the count starts over when the page is back — never skipped)
    if (t0 == null || isOver(run)) return;
    const T = Math.max(0, Math.floor((performance.now() - t0) / TICK_MS));
    settle(T); stepTo(run, T, ev);
    if (!isOver(run) && hold(run, Math.max(T + 1, run.mt), ev)) {
      held = true; heldT = run.t; countAt = 0; drag = null; owed = 0; carry = 0; keyDir = 0;
      stage.classList.add('is-held'); holdEl.hidden = false; holdN.textContent = ''; countShown = 0;
      const left = MODES[MODE].holds - run.holds;
      holdL.textContent = left === 1 ? '1 PAUSE LEFT' : left > 1 ? `${left} PAUSES LEFT` : 'NO PAUSE LEFT';
    } else away = true;   // (no hold left — or a match: the run goes on unseen; back from it only its END sounds)
  }
  function show() {
    view.rest(false); last = 0; tiers.reset();
    if (held && !countAt) countAt = performance.now() + 3 * COUNT_MS;
    if (glDown) { clearTimeout(lostTimer); lostTimer = 0; rebuild(); }
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
      else if (e.e === 'area') { if (areaL.animate) areaL.animate(SWELL, { duration: 900, easing: 'ease-out' }); }
      else if (e.e === 'fall' && !fromRun && crossedBest(best, e.floor)) {
        // THE CROSSING (once a run): NEW BEST — the number turns gold for the rest of the run
        newBest = true; stage.classList.add('is-gold'); BN.dirty();
        say('NEW BEST', 'is-gold', 3, 1300, now);
        if (snd) snd.play(CUE_NEW_BEST.id);
      }
    }
  }

  function playAgain() { if (shown) restart(); }
  press(again, playAgain);
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
    EC.set({ words: endWords(res), made: res.made, floor: res.floor, bounces: res.bounces, blazes: res.blazes, bestRun: res.bestRun });
    EC.best(fromRun ? was : best, isNew, was);
    end.hidden = false; soundsBtn.hidden = false; note.hidden = false;
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
    let tau = FIRST;   // (THE OPENING: the ball rests on floor 0)
    if (t0 != null) {
      if (held) {
        tau = heldT;
        if (countAt) {
          const left = countAt - now;
          if (left <= 0) {
            // … then on: the clock picks up at the hold's tick (the time away + the 3 · 2 · 1 never were run time)
            held = false; countAt = 0; t0 = now - heldT * TICK_MS; holdEl.hidden = true; stage.classList.remove('is-held'); awakeAt = performance.now(); awake(true);
          } else { const c = Math.ceil(left / COUNT_MS); if (c !== countShown) countLine(c); }
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
    if (ev.length > fed) {
      const late = away; away = false;
      moments(fed, ev.length, now, late);
      view.feed(ev, fed, ev.length);
      if (snd) snd.playCues(snd.cuesOf(ev, late, cues, fed));
      fed = ev.length;
    }
    const over = isOver(run);
    if (over && !endedAt) { endedAt = now; awake(false); }
    if (over && !shown && now - endedAt >= END_HOLD_MS) showEnd(now);
    view.draw(run, over ? run.end : tau, dt, pre);
    // the HUD: only what changed (its words are built in the two functions a CHANGE calls — never in the frame)
    if (run.floor !== hudFloor) hudFloorNow();
    const gap = over ? 9 : darkGap(run);
    if (gap !== hudGap) hudDarkNow(gap, over);
    const work = performance.now() - w0;
    tiers.sample(now, prevWork); prevWork = work;
    if (pin == null && frameN % 10 === 0) tiers.tick(now);
    frames[frameK++ % 600] = dt;
    if (t0 != null && !over && !held && dt > HITCH_MS && now - t0 > 1000) hitches++;
    if (fps && frameN % 30 === 0) fpsLine();
  }
  /** a floor was passed: the big number, the area's name (YOUR BEST's line once it is beaten) */
  function hudFloorNow() {
    hudFloor = run.floor; setNum(hudFloor);
    const a = areaOf(hudFloor).name;
    if (a !== hudArea) { hudArea = a; areaL.textContent = a; }
    if (newBest) topL.textContent = bestLine(hudFloor);
  }
  /** THE DARKNESS: the screen's edges close in from above as it comes nearer (6 floors off — its lead — = nothing) — never over the ball or its floor */
  function hudDarkNow(gap, over) {
    hudGap = gap;
    dark.style.opacity = t0 == null ? '0' : String(Math.max(0, Math.min(1, (6 - gap) / 5)));
    stage.classList.toggle('is-near', gap <= 2 && t0 != null && !over);
  }
  function countLine(c) { countShown = c; holdN.textContent = String(c); }
  /** `?fps=1`: the last 120 frames, twice a second */
  function fpsLine() {
    let sum = 0, worst = 0;
    const n = Math.min(frameK, 120);
    for (let i = 0; i < n; i++) { const v = frames[(frameK - 1 - i + 6000) % 600]; sum += v; if (v > worst) worst = v; }
    const i = view.info();
    fpsA.data = `${(1000 * n / sum).toFixed(0)} fps · worst ${worst.toFixed(0)} ms · HITCH ${hitches} · tier ${i.tier} @${i.dpr} · ${i.calls} calls · ${i.slices} slices`;
  }

  // (the pass's own checks — tests/integration/freefall-play.mjs)
  Object.assign(hook, {
    state: () => ({ mode: MODE, seed, started: t0 != null, starting, shown, held, counting: !!countAt, over: isOver(run), st: run.st, cause: run.cause, t: run.t, a: run.a, floor: run.floor, clean: run.clean, blaze: run.blaze, dark: darkGap(run), nl: run.nl, pl: run.pl, fl: run.fl, entries: run.lt.length, holds: run.holds, saves: run.saves, bounces: run.bounces, shatters: run.shatters, owed, clamped, best, tapeFloor, newBest, warmed, rebuilds, tier: tiers.get(), tierPath: tierPath.slice(), hitches, events: ev.length, lates: snd && snd.lates ? snd.lates() : 0, cls: stage.className, num: num.getAttribute('aria-label'), area: areaL.textContent, top: topL.textContent, call: call.textContent, frame: view.frame(run), info: view.info(), pxPerRad: view.pxPerRad() }),
    /** the tower turn that brings the nearest gap (as the floor stands at the next landing) under the ball */
    toGap: () => gapTurn(GAP), toSafe: () => gapTurn(SAFE),
    /** the top of the ball at the top of its bounce, in px from the top of the screen (the HUD ends above it) */
    apexY: () => view.apexY(run) * stage.clientHeight,
    /** ms until the next landing (null = not started / held / over) */
    msToLanding: () => (t0 != null && !held && !isOver(run) ? t0 + run.nl * TICK_MS - performance.now() : null),
    restart: s => restart(s), begin: () => begin(performance.now()), dive: n => { if (t0 != null) { dive(n); t0 = performance.now() - run.t * TICK_MS; fromRun = true; } },
    hide, show, log: () => logOf(run), events: () => ev.slice(), result: () => resultOf(run),
    frames: () => { const out = [], n = Math.min(frameK, 600); for (let i = n - 1; i >= 0; i--) out.push(frames[(frameK - 1 - i + 6000) % 600]); return out; },
    setTier: t => tiers.set(t), lose: () => { const gl = view.el && (view.el.getContext('webgl2') || view.el.getContext('webgl')), x = gl && gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return !!x; },
    stop() { cancelAnimationFrame(raf); },
  });
  if (o.hook) window[o.hook] = hook;
  restart(); restartAt = -1e9;
  raf = requestAnimationFrame(frame);
  return {
    hook, restart,
    destroy() { gone = true; cancelAnimationFrame(raf); ac.abort(); awake(false); clearTimeout(lostTimer); offGL(); BN.destroy(); try { view.destroy(); } catch { /* gone */ } if (snd) snd.stopAll(); stage.remove(); if (o.hook && window[o.hook] === hook) delete window[o.hook]; },
  };
}
