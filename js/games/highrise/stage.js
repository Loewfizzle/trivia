// HIGH RISE — THE STAGE (S4A — docs/highrise.md "THE CARTRIDGE"): the game's screen — the run loop on the pure engine, the scene (night.js),
// the HUD, YOUR BEST, the flyers, the sounds — ONE module for THE TEST PAGE (/highrise-play — play.js: its door shut, nothing counts) AND
// THE CARTRIDGE (view.js — the console's frame, the proof written as you drop). It was play.js's own mount() until S4A; the page's pieces
// (the look switch, the SOUNDS list, the note, its own end card) are behind `o.page`. THE STAGE NEVER COUNTS ANYTHING ITSELF: it imports
// nothing from /api, the profile, Firebase or the store — what a run writes is handed in by the cartridge (`o.go` · `o.onFrame` · `o.onOver`).
// HIDING THE APP = NO PAUSE (the owner — JAYWALK's rule): the run is on the clock; back from a hidden tab THE FUSE has ended it (TOO SLOW).
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { TICK_MS, TICK_HZ, MODES, MODE_IDS, SEED_MAX, TIGHT } from './tuning.js';
import { RIVAL_TAPES } from './night.js';
import { createRun, stepTo, tap, isOver, resultOf, endBy, slabInto } from './engine.js';
import { replay } from './replay.js';
import { endWords, tickOf } from './logic.js';
import { createTower } from './tower.js';
import { BANDS, bandAt, skyTone } from './bands.js';
import { LOOKS, LOOK_LABEL, cleanLook, readLook, writeLook, guessLook, resolveLook, sunUpNow } from './look.js';
import { BEST_KEY, cleanBest, bestTag, crossedBest, nextBest, tagY } from './best.js';
import { STREAK_EVERY } from './sounds.js';
import { nextFriend, crossedFriend, friendTag } from './lines.js';
import { FLY_FLOORS, flyPlan, flyDue, flyNeeds } from './flyplan.js';
import { createTiers } from '../kit/tiers.js';
import { createNight, KEEP } from './night.js';
import { endCard } from './endscreen.js';
import { createTrace, PH, EV, SETUP } from './trace.js';
import { createMatchHud } from './matchhud.js';
import { nearest, mergeTags, entryTick, placeOf, RIVALS_SHOWN } from './rivals.js';
import { keepShot, shotMs } from './shot.js';
import { bakedNumber, bakedLine } from './bakedtext.js';


export const newSeed = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); };
/** the end's card comes this long after the run ended (the missed slab is seen falling) … */
const END_HOLD_MS = 700;
/** … THE FINISH (floor 200 in a match — `?mode=match` here): the white-gold light is seen pouring onto the top slab first */
const MADE_HOLD_MS = 2600;
/** … and stays this long before a tap is PLAY AGAIN (a rhythm's next tap must not wipe it unread) */
const RETRY_MS = 600;
/** a tap just before THE CAP is still the player's: the cap is shown this many ticks late (a touch may reach the page after its frame) */
const CAP_GRACE = 6;
/** a frame that comes this long after the last one = the tab was away: its batch of events is LATE (only the OUT sounds — sounds.js#cuesOf) */
const LATE_MS = 900;
/** THE HITCH COUNTER (S2 FIX — THE LAG HUNT; `?fps=1` shows it): a frame that took longer than this, in a live run, after its first
 *  second — AND longer than HITCH_X × the phone's own usual frame (iOS Low Power Mode draws at 30 Hz: every frame is 33.3 ms, none a hitch) */
const HITCH_MS = 33, HITCH_X = 1.5;
/** REVIEW FIX A — SPECTATE IN SYNC: the watched tower is played back this late (ms) — a rival's tap reaches this phone 0.17–0.27 s after
 *  it was made with the test page's bots (the review), ~0.25–0.5 s in a real match (the 150 ms send + the line + the 100 ms pump) */
export const WATCH_DELAY_MS = 750;
/** … a tap later than the delay grows it to its lateness + WATCH_MARGIN_MS, up to WATCH_DELAY_MAX_MS — eased in: the playback runs at
 *  (1 − WATCH_SLEW) of real time until the new delay is reached (never a jump of the drawn tower) */
export const WATCH_DELAY_MAX_MS = 2500, WATCH_MARGIN_MS = 300, WATCH_SLEW = 0.3;
const LATE_KEEP = 12, WREC = 6;
const clockText = ticks => { const s = Math.max(0, Math.ceil(ticks / TICK_HZ)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** a button that acts on its own press + lift (never a click: iOS drops them on a page that just moved), and is never a drop */
function press(node, fn) {
  let id = null;
  node.addEventListener('pointerdown', e => { id = e.pointerId; e.stopPropagation(); });
  node.addEventListener('pointerup', e => { e.stopPropagation(); if (id === e.pointerId) { id = null; node.blur(); fn(); } });
  node.addEventListener('pointercancel', () => { id = null; });
  node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fn(); } });
  return node;
}
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
/** the big number: each digit its own box (a little room between two — a 1 never runs into its neighbour).
 *  ZERO GARBAGE (S4A FIX): the boxes are KEPT — a landing writes only the digits that changed (each box's own text node); a box more
 *  comes in at 10 / 100 (it used to throw every box away and build them all again, every floor). → the number's writer */
function numBox(node, mark) {
  const boxes = [], was = [];
  let shown = -1, len = 0;
  return n => {
    if (n === shown) return;
    shown = n; node.dataset.n = n; node.setAttribute('aria-label', n);
    if (mark) mark('dom');
    const want = n < 10 ? 1 : n < 100 ? 2 : n < 1000 ? 3 : n < 10000 ? 4 : 5;
    while (boxes.length < want) { const t = document.createTextNode(''); boxes.push(h('span.hi-dg', { 'aria-hidden': 'true' }, t)); was.push(-1); }
    while (len < want) node.append(boxes[len++]);
    while (len > want) boxes[--len].remove();
    for (let i = want - 1, v = n; i >= 0; i--, v = Math.floor(v / 10)) { const d = v % 10; if (was[i] !== d) { was[i] = d; boxes[i].firstChild.data = DIGITS[d]; } }
  };
}
// (the cues the stage's own moments add: constants — sfx.js#playCues reads them, nothing is made)
const CUE_BEST = Object.freeze({ id: 'streak', rate: 1.12 }), CUE_FRIEND = Object.freeze({ id: 'streak', rate: 1.06 }), CUE_BAND = Object.freeze({ id: 'band-arrival' });
/** the frame times kept for the pass's measures (a ring of numbers made once) · the `?fps=1` line is written this often (ms — once a second: its words are the one thing a live frame still builds) */
const FRAMES_KEPT = 20000, FPS_EVERY_MS = 1000;
/** S5 — THE EFFECTS BISECT: the effects over the 3D view `?lean=` can switch off one by one (the test page only) */
export const LEAN_PARTS = Object.freeze(['num', 'call', 'band', 'clock', 'tag', 'fps', 'ann', 'place']);

/** START waits at most this long for every sound's decode (S4A — THE SOUND SYNC: no sound of a run takes the late path) */
const START_WAIT_MS = 600;

/**
 * createStage(app, o) → the stage's hook (null = no WebGL here: the stage says so itself)
 *   o.page      THE TEST PAGE's own pieces: the look switch, the SOUNDS list, the note, its own end card every run, the audio engine installed here
 *   o.seed · o.mode · o.look · o.from · o.fps · o.tier · o.trace · o.lean     the page's `?…` flags (lean — S4B, THE LAG A/B: every DOM / CSS
 *               effect drawn over the 3D view is OFF while a run is live — the glows, the transitions, the announcer's motion; the canvas's own look stays)
 *   o.best      { read() → floor, write(n) } — YOUR BEST's store (the page: this phone's `hi:play:best`)
 *   o.hook      the name its checks find the hook under (`window[o.hook]`)
 *   THE CARTRIDGE (view.js) hands in what a run WRITES — the stage itself never counts anything:
 *   o.lookNow   () → 'day' | 'night' — the console's GAME LOOK, read LIVE (no switch of its own)
 *   o.go        () → Promise<{ seed, t0, taps? }> — GO: the proof node's first write → the seed picked from it + tick 0 on this page's clock
 *   o.onFrame   (now) — every live frame (the proof's chunks go up) · o.onOver (result) — the run just ended (the last chunk, then `e`)
 *   o.onEnd     (result) → { own, note } — the end card's moment: own = the stage's own card (an UNPROVEN run); else the console's podium
 *   o.onShow    () — back on screen (the clock is read again)
 *   o.friends   () → [{ n, v }] — YOUR TABLE's bests above you (THE NEXT FRIEND's pink tape)
 *   S4B — THE MATCH (docs/highrise.md "THE MATCH"): the driver (view.js — or the test page's sim) hands a run in with `adopt({ mode:
 *   'match', … })`, the rivals with `hook.rivals(rows)`, a tower to WATCH with `hook.watch(W)`; o.onWatchTap () — a tap while watching;
 *   o.onEnd may answer { watch: true }: the run is over, the stage stays live for the watcher (no card, no veil)
 */
export function createStage(app, o = {}) {
  const PAGE = !!o.page, FIXED = String(o.seed || '').slice(0, SEED_MAX);
  let MODE = MODE_IDS.includes(o.mode) ? o.mode : 'solo';   // (S4B: a cartridge's stage plays a SOLO run or a MATCH — `adopt` says which)
  const FROM = Math.max(0, Math.min(400, Math.floor(Number(o.from) || 0))), LOOK_Q = o.look === 'day' || o.look === 'night' ? o.look : null;
  // S5 — THE EFFECTS BISECT (the test page only): `?lean=1` = every DOM / CSS effect over the 3D view off while a run is live (S4B's A/B);
  // `?lean=num,call,…` = only THOSE (LEAN_PARTS) — each effect's own cost measured alone (tests/integration/highrise-paint.mjs --bisect)
  const leanQ = PAGE ? String(o.lean === true ? '1' : o.lean || '') : '', LEAN = leanQ === '1' || leanQ === 'all';
  const LEANS = new Set(LEAN ? LEAN_PARTS : leanQ.split(',').filter(k => LEAN_PARTS.includes(k)));
  const bestAt = o.best || { read: () => 0, write() {} }, readBest = () => cleanBest(bestAt.read()), writeBest = n => bestAt.write(n);
  const ac = new AbortController(), sig = { signal: ac.signal };   // (the cartridge unmounts: every listener on the document goes with it)
  let gone = false;
  // THE SOUND SYNC (S4A — the owner: "sometimes the sound isn't in sync with the blocks", MUSIC OFF): PODCAST MODE naps the audio context
  // between two effects, so every drop's sound had to wake it first (on iOS: at the finger's LIFT). A LIVE run HOLDS IT AWAKE — a lease
  // renewed once a second from the frame (audio/engine.js#holdAwake, through its hub: THE STALE-MODULE RULE), let go on the end card.
  const awake = on => { const f = globalThis.__nsHoldAwake; if (f) { try { f(on, 'highrise'); } catch { /* audio is polish */ } } };
  let awakeAt = 0;
  // ---- the page: the play area (the canvas), the HUD over it
  const play = h('div.hi-play', { role: 'application', 'aria-label': 'High Rise — tap to drop the slab' });
  // (ZERO GARBAGE: every line of the HUD that changes in a run keeps ONE text node — a change writes its `data`, never a new node)
  const callT = document.createTextNode(''), clockT = document.createTextNode(''), tagT = document.createTextNode(''), ftagT = document.createTextNode(''), fpsA = document.createTextNode(''), fpsB = document.createTextNode(''), fpsC = document.createTextNode('');
  const num = h('div.hi-num'), band = h('div.hi-band', BANDS[0].name), call = h('div.hi-call', { 'aria-live': 'polite' }, h('span.hi-callt', callT)), clock = h('div.hi-clock', clockT);
  // (REVIEW FIX A — THE TOP HUD: the band + the match's clock share ONE row — a match lays it out as one narrow centred line,
  //  "THE ROOFTOPS · 5:37"; solo keeps the band on its own line, as before)
  const hud = h('div.hi-hud', num, h('div.hi-bandrow', band, clock), call);
  const tag = h('div.hi-tag', { hidden: true }, h('span', tagT));
  const ftag = h('div.hi-tag.hi-ftag', { hidden: true }, h('span', ftagT));   // (S4A — THE NEXT FRIEND above you: the same flag in PINK)
  // THE LOOK SWITCH (S3): AUTO · DAY · NIGHT — three plain choices under the sign (neon-underline, never a pill), each on its own
  // press + lift (never the START tap); remembered on this phone. AUTO = the real sun (the site's own sun rule).
  let choice = o.lookNow ? o.lookNow() : LOOK_Q || readLook(), lookT = choice === 'auto' ? guessLook(new Date().getHours()) : choice, sunKnown = choice !== 'auto';
  const lookTabs = LOOKS.map(l => press(h('button.hi-tab.hi-look-b', { type: 'button', 'data-pick': l, 'aria-pressed': 'false' }, LOOK_LABEL[l]), () => pickLook(l)));
  const lookRow = h('div.hi-look', { role: 'group', 'aria-label': 'The look: auto, day or night' }, ...lookTabs);
  // THE WELCOME = "A · THE SIGN" (S4A FIX's add-on — the owner's pick, Nov 19): NO BOX, NO PANEL — full-bleed: the band's real backdrop,
  // the sign BIG in the sky (HIGH a pink neon edge, RISE a blue one, white faces), one line under it; the real tower standing in the
  // lower middle with THE FIRST SLAB ALREADY SLIDING IN (night.js#welcome — the game a second before you start) and YOUR BEST as the
  // real gold tape + its right-edge tag (none on a first visit); TAP TO START big in a soft dark fade at the foot. Tap anywhere starts.
  const start = h('div.hi-start',
    h('div.hi-start-top', h('div.hi-sign', { 'aria-label': 'High Rise' }, h('span', 'HIGH'), h('span', 'RISE')), h('div.hi-start-sub', 'STACK IT AS HIGH AS YOU DARE'), PAGE ? lookRow : null),
    h('div.hi-start-foot', h('div.hi-start-go', 'TAP TO START'), h('div.hi-start-l', 'ONE TAP DROPS EACH SLAB')));
  // THE END = JAYWALK'S STANDARD (S4B — endscreen.js: the header HIGH RISE · SOLO · the cause in hot-pink neon · the floor, huge · FLOORS ·
  // YOUR BEST · n in gold · n PERFECTS · BEST STREAK n) on JAYWALK's dark veil (css .hi-shade — the scene dimmed behind it)
  const EC = endCard({ header: MODE === 'solo' ? 'solo' : 'match' }), check = h('div.hi-check', { hidden: true });
  // THE ON-PHONE TRACE (S4A FIX 2 — `?trace=1`, trace.js): every frame timed in phases; the end card lists THE 5 WORST under the stats
  // strip (the owner screenshots it). Off = null: every call site below is one `if (TR)`.
  const TR = o.trace ? createTrace({ lean: LEAN }) : null, traceEl = TR ? h('div.hi-trace', { hidden: true }) : null;
  const end = h('div.hi-end', { hidden: true }, EC.el, traceEl);
  // (the soft dark fades behind the two screens' words — the sky at the top, the foot: one layer, never a box; off while a run is live)
  const shade = h('div.hi-shade', { 'aria-hidden': 'true' });
  // THE END's FOOT (S2 FIX — END-SCREEN STANDARD A, the owner): ONE big SOLID glowing PLAY AGAIN bar in HIGH RISE's accent, a rounded
  // rectangle (never a pill), on its OWN press + lift. A tap ANYWHERE after RETRY_MS is still PLAY AGAIN — and the bar keeps the same
  // wait: it comes up where the thumb was dropping slabs, and a rhythm's next tap must not wipe the card unread.
  const againIco = h('span.hi-again-i', { 'aria-hidden': 'true' });
  againIco.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>';
  const again = press(h('button.hi-again', { type: 'button', hidden: true }, againIco, h('span.hi-again-t', 'PLAY AGAIN')), () => { const now = performance.now(); if (shown && card && now - overAt > RETRY_MS) { restart(); begin(now); } });
  const note = h('p.hi-note', LEAN || LEANS.size ? `TEST PAGE · LEAN${LEAN ? '' : ` (${[...LEANS].join(' ')})`}${FROM ? ` · FROM FLOOR ${FROM}` : ''} · NOTHING COUNTS` : FROM ? `TEST PAGE · FROM FLOOR ${FROM} · NOTHING COUNTS` : MODE === 'solo' ? 'TEST PAGE · SOLO · NOTHING COUNTS YET' : 'TEST PAGE · THE MATCH’S LOOK · NOTHING COUNTS');
  const fps = o.fps ? h('div.hi-fps', h('span.hi-fps-in', fpsA, fpsB, fpsC)) : null;   // (S5: its words on a flat dark plate — no glow re-drawn every second)
  // THE SOUNDS (sfx.js — the SHARED audio engine's SFX bus; unlocked by the first tap, never before) + THE SOUND AUDITION (the SOUNDS sheet)
  let snd = null, sheetOpen = false;
  const soundsBtn = press(h('button.hi-snd', { type: 'button' }, 'SOUNDS'), () => {
    if (sheetOpen) return;
    sheetOpen = true;
    lazyImport(import('./audition.js'), './audition.js').then(A => A.openAudition({ press, onClose: () => { sheetOpen = false; last = 0; } })).catch(() => { sheetOpen = false; });
  });
  // (the page installs the shared engine itself; in the console it is running long since — and the sounds are DECODED AHEAD there, never on the first drop)
  Promise.all([PAGE ? lazyImport(import('../../audio/engine.js'), '../../audio/engine.js') : null, lazyImport(import('./sfx.js'), './sfx.js')]).then(([E, S]) => { if (gone) return; if (E) E.installAudio(); S.fetchSounds(); Promise.resolve(S.decode()).catch(() => {}); snd = S; hook.sfx = S; }).catch(() => { /* silent: audio is polish */ });
  const stage = h('div.hi-stage', { class: [LEAN ? 'is-lean' : '', ...[...LEANS].map(k => `lean-${k}`)].join(' ').trim() || null, 'data-look': lookT, 'data-sky': skyTone(lookT, 0) }, play, shade, hud, tag, ftag, start, end, check, PAGE ? soundsBtn : null, PAGE ? note : null, fps, again);
  app.replaceChildren(stage);

  // ---- the view (the night look) + its quality tiers; a browser with no WebGL gets the stage + one line saying so
  const pin = o.tier === 0 || o.tier === 1 || o.tier === 2 ? o.tier : null;   // (`?tier=0|1|2` pins a quality tier — the pass's measure)
  const noGL = () => h('p.hi-nogl', 'This browser can’t draw the game here (it has no WebGL).');
  /** the view's stand-in while a lost context has not come back (the run goes on; nothing is drawn; the rebuild keeps trying) */
  // THE HITCH COUNTER's cause marks: WHEN the page last did a piece of one-off work (performance.now()) — a hitch is named after the
  // work done since the frame before it: plate (a backdrop uploaded) · compile (a program built, the tier stepped) · audio (a decode
  // landed, the limiter built) · dom (the HUD was written) · gc (none of those + the page's own frame code was quick: the pause was the
  // browser's — most often a collection) · unknown (the page's own frame code was slow, with no mark)
  // THE HITCH COUNTER, HONEST (S4A FIX): "gc" is said ONLY when a collection is KNOWN to have run in the stalled frame — a CANARY: one
  // small object held only by a WeakRef; the frame that finds it gone has seen a collection (Safari clears it in any collection;
  // Chromium in a full one), and puts the next canary out — nothing is made between two collections. No WeakRef here = no "gc" said.
  // + `tap`: a touch was handled since the frame before (its engine step + its sounds). A stall with no mark at all = "unknown".
  const marks = { plate: 0, compile: 0, audio: 0, dom: 0, tap: 0, gc: 0 };
  // (S4B — THE PRE-WARM's check: a program compiled / a picture or a model uploaded / a sound decoded while a run is LIVE — after its
  //  first tap — is counted by the trace: SET-UP AFTER START must say "none". `liveRun` = the run, from its first tap to its end card)
  let liveRun = null;
  const mark = k => {
    marks[k] = performance.now();
    if (TR) { TR.ev |= k === 'plate' ? EV.plate : k === 'compile' ? EV.compile : k === 'audio' ? EV.decode : 0; if (liveRun && (k === 'plate' || k === 'compile' || k === 'audio')) TR.setup(k === 'plate' ? SETUP.upload : k === 'compile' ? SETUP.compile : SETUP.decode, liveRun.floor); }
  };
  const HAS_WEAK = typeof WeakRef === 'function' && typeof FinalizationRegistry === 'function';
  let canary = null, gcSeen = 0, canaryGone = false;
  // (the registry's callback stamps the collection — it runs a moment AFTER it; a stall being named asks the canary itself, at once.
  //  Nothing is asked in a frame: a WeakRef's deref() is not free in every engine)
  const gcReg = HAS_WEAK ? new FinalizationRegistry(() => { if (!canaryGone) { marks.gc = performance.now(); gcSeen++; } hitchLine(); putCanary(); }) : null;
  function putCanary() { if (gone || !gcReg) return; const c = {}; canary = new WeakRef(c); gcReg.register(c); canaryGone = false; }
  // S5 — THE EFFECTS REBUILD: the digits' glow BAKED once a style (bakedtext.js) — a landing copies bitmaps, the browser paints no blur;
  // the digit boxes keep the layout + the reading (transparent, shadowless — css .hi-num.is-baked)
  const setBox = numBox(num, null), BN = bakedNumber(num, mark), setNum = n => { setBox(n); BN.set(n); };
  // (… and the announcer's lane: its words + digits baked once a style, a call composes their bitmaps — bakedtext.js#bakedLine)
  const BL = bakedLine(call);
  const NO_VIEW = { el: null, setRival() {}, dimRivals() {}, showRivals() {}, warm: () => true, flyReady: () => true, adopt() {}, events() {}, fall() {}, draw() {}, setTier() {}, setBest() {}, setFriend() {}, setLook() {}, rest() {}, resize() {}, flyers: () => false, band() {}, need() {}, fly: () => false, flyReset() {}, flyHush() {}, flyInfo: () => ({ ready: false }), flyPath: () => null, project: () => [0, -1], zoneTop: () => 1, restZone: () => 1, restY: () => -1, stat: () => null, io: new Float64Array(3), pose() {}, welcome() {}, ghostBest() {}, poseXY(x, f, z, out) { out[0] = 0; out[1] = -1; }, top: () => ({ x0: 0, x1: 0, z0: 0, z1: 0, floor: -1 }), info: () => ({ down: true }), destroy() {} };
  let view, glDown = null;
  try { view = createNight(play, { tier: pin == null ? 2 : pin, mark, look: lookT, trace: TR }); }
  catch { stage.append(noGL()); return null; }
  const tierPath = [pin == null ? 2 : pin];
  const tiers = createTiers({ apply: t => { view.setTier(t); if (tierPath.length < 40) tierPath.push(t); }, initial: pin == null ? 2 : pin });

  // THE LOST CONTEXT (JAYWALK's lesson — iOS takes a WebGL context away under memory pressure; the run is on the clock: a blank
  // playfield is a slab dropped unseen): the scene is REBUILT — destroyed + created again on the same tower, tier + tape — the moment
  // the context is restored, or after 1.5 s without it. The listeners come OFF before any destroy (its own forceContextLoss is never "lost").
  // NO context to be had yet (the review: one failed rebuild used to end the page until a reload): the line says so, the run goes on,
  // and the rebuild TRIES AGAIN — every 1.5 s, eight times, and the moment the page is back in front.
  let lostTimer = 0, rebuilds = 0, tries = 0;
  const onLost = e => { e.preventDefault(); if (!lostTimer) lostTimer = setTimeout(rebuild, 1500); };
  const onBack = () => rebuild();
  const watchGL = () => { if (view.el) { view.el.addEventListener('webglcontextlost', onLost); view.el.addEventListener('webglcontextrestored', onBack); } };
  const offGL = () => { if (view.el) { view.el.removeEventListener('webglcontextlost', onLost); view.el.removeEventListener('webglcontextrestored', onBack); } };
  function rebuild() {
    clearTimeout(lostTimer); lostTimer = 0;
    offGL();
    try { view.destroy(); } catch { /* it is gone already */ }
    try { view = createNight(play, { tier: tiers.get(), mark, look: lookT, trace: TR }); }
    catch {
      view = NO_VIEW; hook.view = view;
      if (!glDown) { glDown = noGL(); stage.append(glDown); }
      if (++tries <= 8) lostTimer = setTimeout(rebuild, 1500);
      return;
    }
    if (glDown) { glDown.remove(); glDown = null; }
    tries = 0;
    view.adopt(run, T, false); view.setBest(tapeFloor); view.setFriend(friendTape); if (shown) view.rest();
    view.pose(shown ? 'end' : t0 == null ? 'welcome' : 'play'); view.welcome(t0 == null && !shown, best > 0); view.ghostBest(false); tagDirty = true;
    if (FlyMod) { view.flyers(FlyMod); wanted.clear(); needFloor = -1; needAll(); }   // (the flyers' stage is the new scene's: their models are asked for again — all of them, at once)
    hook.view = view; rebuilds++; last = 0; sized();
    watchGL();
  }
  watchGL();

  // ---- THE LOOK SWITCH: the choice → the look (AUTO asks the sun rule, again every minute) → the view cross-fades (night.js#setLook —
  // the other look's pictures come in off the frame first: never a hitch); the page's words follow the picture (`data-look` turns
  // half way through the fade, `data-sky` = bright under a sunlit sky / dark from THE STARS up: the frame, below)
  function setLook(l, now = false) { lookT = l === 'day' ? 'day' : 'night'; view.setLook(lookT, now); }
  function askSun() {
    if (choice !== 'auto') return;
    sunUpNow(Date.now()).then(up => { if (choice !== 'auto') return; const first = !sunKnown; sunKnown = true; setLook(resolveLook('auto', up), first && t0 == null); }, () => {});
  }
  function markLook() { for (const b of lookTabs) { const on = b.dataset.pick === choice; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); } }
  function pickLook(l) {
    choice = cleanLook(l); writeLook(choice); markLook();
    if (choice === 'auto') askSun(); else setLook(choice);
  }
  markLook(); askSun();
  const sunIv = PAGE ? setInterval(() => { if (document.visibilityState === 'visible') askSun(); }, 60000) : 0;

  // ---- the sizes the HUD needs (a ResizeObserver's — never a layout read in the frame)
  let stageH = 0, stageW = 0, hudFoot = 0, tagDirty = true;   // (tagDirty: the screen's size / the friends changed — the two tags are placed again)
  function sized() { stageH = stage.clientHeight; stageW = stage.clientWidth; hudFoot = hud.offsetTop + hud.offsetHeight; tagDirty = true; if (typeof BN !== 'undefined') BN.dirty(); }
  const ro = new ResizeObserver(sized); ro.observe(stage); ro.observe(hud);
  sized();

  // ---- S4B — THE MATCH (docs/highrise.md "THE MATCH"): the match's HUD (matchhud.js — THE ALTIMETER, the rivals' tags, the kit's
  // announcer, the count, the watcher's line) is made the first time a match is on; the RIVALS come from the driver as plain rows
  // [{ uid, name, hex, rgb, floor, perfects, over, end, silent, me }] (their towers = their own tap logs through the same engine:
  // rivals.js). THE TAPES NEVER BLOCK THE PLAY: a rival UNDER you = a thin tape on your own tower (never the top slab), one AT or OVER
  // you = a right-edge tag in the clear column — the 3 nearest each way, merged when they would overlap, DIM while a slab slides.
  // OUT = WATCH: `watch(W)` swaps the tower on screen for a rival's — built from THEIR landed taps, never a tap assumed.
  let MH = null, matchOn = false, rivalRows = null, watchW = null, mine = null, mineT = null, wN = 0, dimWas = -1, frozen = 0, watchUi = false;
  // (REVIEW FIX A — THE PLAYBACK: wP the tick the watched tower is drawn at · wD its delay now · wDT the delay wanted (ticks) · wSeen the
  //  taps whose lateness is measured · wDrawn the furthest tick drawn of the slab now sliding · wPast taps that came after it · the ring
  //  of the last lateness values · wRec the pass's frame record (tests only — null in play))
  let wP = 0, wD = WATCH_DELAY_MS / TICK_MS, wDT = WATCH_DELAY_MS / TICK_MS, wSeen = 0, wDrawn = -1, wPast = 0, lateN = 0, wRec = null, wRecN = 0, wPin = false;
  const lateRing = new Float64Array(LATE_KEEP), WSL = { floor: 0, axis: 'x', off: 0, x0: 0, x1: 0, z0: 0, z1: 0 }, WXY = new Float64Array(2), WXY2 = new Float64Array(2);
  // (the ranked list in WATCH reads the watched player's row from the SAME delayed tower — a kept record, filled in place)
  const wRow = { uid: '', name: '', hex: '', rgb: null, floor: 0, perfects: 0, over: false, end: '', silent: false, me: false, watched: true }, wList = [];
  let wListFloor = -1;
  function listRows(rows) {
    if (!watchW || !rows) return rows;
    wList.length = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.uid !== watchW.uid) { wList.push(r); continue; }
      wRow.uid = r.uid; wRow.name = r.name; wRow.hex = r.hex; wRow.rgb = r.rgb; wRow.silent = r.silent; wRow.me = r.me; wRow.watched = r.watched;
      wRow.floor = run.floor; wRow.perfects = run.perfects; wRow.over = isOver(run); wRow.end = isOver(run) ? r.end || 'out' : '';
      wList.push(wRow);
    }
    wListFloor = run.floor;
    return wList;
  }
  /** (tests only: wRec is null in play) the frame's watched slab as drawn */
  function recWatch() {
    const o = wRecN++ * WREC, sl = run.st === 'slide' ? slabInto(run, view.io[0], WSL) : null;
    wRec[o] = view.io[0]; wRec[o + 1] = sl ? sl.floor : 0; wRec[o + 2] = sl ? sl.off : 0;
    if (!sl) { wRec[o + 3] = wRec[o + 4] = wRec[o + 5] = 0; return; }
    const cx = (sl.x0 + sl.x1) / 2, cz = (sl.z0 + sl.z1) / 2;
    view.poseXY(cx, sl.floor - 0.5, cz, WXY); view.poseXY(sl.axis === 'x' ? cx + 1 : cx, sl.floor - 0.5, sl.axis === 'x' ? cz : cz + 1, WXY2);
    wRec[o + 3] = WXY[0]; wRec[o + 4] = WXY[1]; wRec[o + 5] = Math.hypot((WXY2[0] - WXY[0]) * stageW, (WXY2[1] - WXY[1]) * stageH);
  }
  // (S5 — ZERO GARBAGE IN A MATCH: the rivals' placing fills records made ONCE — the level stand-ins, the tags' items, nearest's two
  //  lists, the merged tags — nothing made at a landing but a tag's new words)
  const others = [], tagItems = [], lvPool = [], itemPool = [], NR = { above: [], below: [] }, MT = { list: [], pool: [] }, NO_TAGS = [];
  const hexOfRival = uid => { for (let i = 0; i < rivalRows.length; i++) if (rivalRows[i].uid === uid) return rivalRows[i].hex; return '#ffffff'; };
  function matchHud() { if (!MH) { MH = createMatchHud(stage, hud); MH.onPick(uid => { if (!watchW) return; if (o.onWatchPick) o.onWatchPick(uid); else if (hook.sim && hook.sim.pick) hook.sim.pick(uid); }); } return MH; }
  function setMatch(on) {
    matchOn = !!on; stage.classList.toggle('is-match', matchOn);
    if (matchOn) matchHud(); else if (MH) MH.reset();
    for (let i = 0; i < RIVAL_TAPES; i++) view.setRival(i, 0, 0, 0, 0);
    rivalRows = null; dimWas = -1; tagDirty = true;
  }
  /** WATCH on / off (S5): the ranked list is built as it comes on (and kept up while it is on); THE PLACE NUMBER goes */
  function watchMode(on) {
    if (watchUi === on) return;
    watchUi = on; stage.classList.toggle('is-watch', on);
    if (on && MH) { MH.place(0, 0); if (rivalRows) MH.altimeter(listRows(rivalRows)); }
  }
  /** the rivals round the tower ON SCREEN (yours — or the one you watch): tapes under it, tags at / over it — and (S5) THE PLACE NUMBER
   *  while you climb. Once a landing / a change. */
  function placeRivals() {
    if (!rivalRows) return;
    const here = run.floor, skip = watchW ? watchW.uid : '';
    others.length = 0;
    // (a rival still CLIMBING one floor under you is LEVEL with you — their tap is a network's beat behind yours: a tag, never a tape
    //  flashing under your top slab at every landing. A tape = a tower that ENDED under you, or one at least two floors down.)
    let lv = 0;
    for (let i = 0; i < rivalRows.length; i++) {
      const r = rivalRows[i];
      if (watchW ? r.uid === skip : r.me) continue;
      if (!r.over && r.floor === here - 1) { let q = lvPool[lv]; if (!q) { q = { uid: '', name: '', rgb: null, floor: 0, over: false }; lvPool.push(q); } lv++; q.uid = r.uid; q.name = r.name; q.rgb = r.rgb; q.floor = here; others.push(q); }
      else others.push(r);
    }
    const N = nearest(others, here, RIVALS_SHOWN, NR), zone = view.restZone() * stageH;
    for (let i = 0; i < RIVAL_TAPES; i++) { const r = N.below[i]; if (r) view.setRival(i, r.floor, r.rgb[0], r.rgb[1], r.rgb[2]); else view.setRival(i, 0, 0, 0, 0); }
    tagItems.length = 0;
    for (let i = 0; i < N.above.length; i++) {
      const r = N.above[i];
      let q = itemPool[i]; if (!q) { q = { uid: '', name: '', up: 0, y: 0 }; itemPool.push(q); }
      q.uid = r.uid; q.name = r.name; q.up = r.floor - here; q.y = tagY(view.restY(Math.min(r.floor, here + 100)) * stageH, hudFoot, zone, 14, 12);   // (12 px clear of the zone: the camera is still easing onto the new floor as its slab enters)
      tagItems.push(q);
    }
    MH.setTags(mergeTags(tagItems, 30, MT), hexOfRival);
    // THE PLACE NUMBER (S5): where YOU stand while you climb — written by the HUD only when it changes
    MH.place(watchW || isOver(run) ? 0 : placeOf(rivalRows, here, run.perfects), rivalRows.length);
  }
  /** WATCHING: the watched player's landed taps → their tower (never a tap assumed; their end only once it is signalled).
   *  REVIEW FIX A — SPECTATE IN SYNC (the owner: "it goes past, and then it snaps back on top and drops"): the watched tower is played
   *  BACK on a short delay — at THE PLAYBACK TICK `wP` = the match's tick − `wD` — each landed tap applied when the playback reaches ITS
   *  OWN tick, so the slab slides and drops exactly where they tapped (their taps reach this phone 0.2–0.5 s after they were made: drawn
   *  on the live clock the slab slid past the tap, then jumped back). `wD` starts at WATCH_DELAY_MS; a tap that comes later than the
   *  delay (a bad line) GROWS it — eased in by playing back slower, never a jump — and until a tap lands the slab is HELD at its sweep's
   *  edge (never stepped to its fuse). Their end, their cuts, misses, grow-backs + falls are the engine's own, at their own ticks. */
  function feedWatch() {
    const tp = watchW.taps, P = Math.floor(wP);
    // (each tap's lateness, measured as it ARRIVES: the playback's delay is kept above the worst of the last few + a margin)
    for (; wSeen < tp.length; wSeen++) {
      const late = FS[TAU] - tp[wSeen];
      lateRing[lateN++ % LATE_KEEP] = late;
      let worst = 0; for (let i = 0; i < LATE_KEEP; i++) if (lateRing[i] > worst) worst = lateRing[i];
      const want = Math.min(WATCH_DELAY_MAX_MS / TICK_MS, Math.max(WATCH_DELAY_MS / TICK_MS, worst + WATCH_MARGIN_MS / TICK_MS));
      if (want > wDT && !wPin) wDT = want;
      if (tp[wSeen] < wDrawn) wPast++;   // (it came after the playback had passed its tick: the slab was drawn past it — counted, the delay grows)
    }
    while (wN < tp.length && tp[wN] <= P && !isOver(run)) tap(run, tp[wN++], ev);
    if (!isOver(run) && wN >= tp.length && watchW.done()) stepTo(run, Math.min(P, endBy(run, tp.length ? tp[tp.length - 1] : 0)), ev);
    // (the next slab ENTERS on the playback clock — the seed's own doing: the watched tower's slab is seen sliding; never stepped to its fuse)
    if (!isOver(run)) { const en = entryTick(run, P); if (en >= 0) stepTo(run, en, ev); }
  }
  // ---- the run: the pure engine on this tab's clock. Tick 0 = the START touch; the RULES never read the clock — the page turns it into ticks.
  let seed = '', run = null, T = null, taps = [], t0 = null, shown = false, card = false, overAt = 0, endedAt = 0;
  let best = readBest(), tapeFloor = 0, newBest = false, bandNow = 0, notch = 0;   // (tapeFloor: the floor YOUR BEST's gold tape lies on — its own number: the end card moves `best` on)
  const ev = [], frames = new Float32Array(FRAMES_KEPT), cues = [], more = [], needs = [];
  // (the run's every event, kept for THE DETERMINISM CHECK at its end: a list with its room made ONCE — a list that grows as it is
  //  pushed to throws its old store away each time it doubles)
  let liveEv = new Array(4096), liveN = 0;
  function growLive() { const big = new Array(liveEv.length * 2); for (let i = 0; i < liveN; i++) big[i] = liveEv[i]; liveEv = big; }
  // THE FLYERS (S3 — flyplan.js says WHEN + WHICH from the seed; flyers.js, a LAZY module, flies them — it is fetched from floor 20,
  // each model + its sounds well before its own floor: night.js uploads them in an ordinary frame, never in the moment)
  let plan = flyPlan(''), FlyMod = null, flyAsk = false, needFloor = -1;
  const flown = { jet: false, ufo: false, ship: false }, wanted = new Set();
  const loadFly = () => (FlyMod ? Promise.resolve(FlyMod) : lazyImport(import('./flyers.js'), './flyers.js').then(M => { FlyMod = M; view.flyers(M); needFloor = -1; return M; }));
  function flyCheck() {
    view.band(stageH ? hudFoot / stageH : 0.2);
    if (run.floor < FLY_FLOORS.loadJet) return;
    if (!FlyMod) { if (!flyAsk) { flyAsk = true; loadFly().catch(() => { flyAsk = false; }); } return; }
    flyNeeds(plan, run.floor, needs);
    for (let i = 0; i < needs.length; i++) { const k = needs[i]; if (!wanted.has(k)) { wanted.add(k); view.need(k); } }
  }
  // S4B — PRE-WARM (the owner's iPhone trace: ~1 ms of our code in every slow frame, but ONE 65 ms first-time set-up at floor 80 — a
  // seam's plate + a flyer's model + the landing's later work in one frame): EVERYTHING a run can need is fetched, built and uploaded
  // BEHIND THE WELCOME SCREEN, before the first tap — the look's five plates + its reflection map (night.js#holdPlates), every program
  // (the warm frame: both looks are one set), and here EVERY FLYER: the lazy module + the Blackbird, the F-22, the UFO, THE MOTHERSHIP's
  // hull (a cartridge's seed is not known before GO: both jets). Their sounds are decoded at the START touch (the audio's unlock).
  // START waits ≤ START_WAIT_MS for it (a slow line never holds a start longer); the trace names anything that still came late.
  const FLY_ALL = ['blackbird', 'f22', 'ufo', 'mothership'];
  const needAll = () => { for (let i = 0; i < FLY_ALL.length; i++) view.need(FLY_ALL[i]); };
  // S5 — THE CLOSE's REVIEW: the baked HUD WARMED behind the welcome — a first NEW BEST / PERFECT / STREAK / FASTER bakes nothing in its
  // frame: the gold set of the number (a run that can beat a best), the lane's words + digits in each of its classes. The stage is
  // dressed in each style for a moment and dressed back (a style recalc each — no paint: nothing is drawn between). Cached across runs.
  const WARM_CALLS = [['hi-call is-perfect', ['PERFECT ×0123456789', 'PERFECT']], ['hi-call is-streak', ['STREAK ×0123456789']], ['hi-call is-gold', ['NEW BEST', 'THE MOTHERSHIP']], ['hi-call is-fast', ['FASTER']]];
  function warmHud() {
    if (best > 0 && !FROM && !matchOn) { stage.classList.add('is-gold'); BN.warm(); stage.classList.remove('is-gold'); }
    BN.dirty();
    const sk = `${toneSeen}|${stageW}x${stageH}`;
    for (const [cls, words] of WARM_CALLS) { call.className = `${cls} is-baked`; BL.warm(`${cls}|${sk}`, words); }
    call.className = 'hi-call is-baked';
  }
  function prewarm() { if (!flyAsk || !FlyMod) { flyAsk = true; loadFly().then(() => { if (!gone) needAll(); }).catch(() => { flyAsk = false; }); } else needAll(); }
  const warmOk = () => view.warm() && view.flyReady();
  const whenWarm = ms => new Promise(res => { const from = performance.now(); (function poll() { if (gone || warmOk() || performance.now() - from >= ms) res(); else setTimeout(poll, 40); })(); });
  // `?floor=N` (the test page's look check): the floors its START tap builds at once COUNT TOWARD NOTHING — not the perfects, not the
  // streak (the announcer, the chime, STREAK ×10), not YOUR BEST (never set, never compared: no gold line, no NEW BEST in such a run).
  // skipP / skipS = the perfects + the streak the shortcut made; a cut ends that streak like any other. streakTop = the best streak PLAYED.
  let skipP = 0, skipS = 0, streakTop = 0;
  const hooks = { onPerfect() { /* (the view reads the events itself) */ }, onFall: (r, floor, dx, dz, whole) => view.fall(r, floor, dx, dz, whole) };
  function restart(s = FIXED || newSeed()) {
    seed = s; momDue = -1; landF = -1e9; shotAt = 0; run = createRun({ seed, mode: MODE }); liveRun = null; watchW = null; mine = null; mineT = null; pendEnd = null; wN = 0; watchMode(false); if (MH) MH.reset(); for (let i = 0; i < RIVAL_TAPES; i++) view.setRival(i, 0, 0, 0, 0); skipP = 0; skipS = 0; streakTop = 0; taps = []; t0 = null; shown = false; card = false; overAt = 0; endedAt = 0; ev.length = 0; liveN = 0; sounded = 0; hush = false; starting = false; startN++; stage.classList.remove('is-starting');
    T = createTower(run, hooks, KEEP);
    best = Math.max(best, readBest()); tapeFloor = 0; newBest = false; bandNow = 0; notch = 0;   // (max: a phone whose storage is blocked still keeps its best for the visit)
    plan = flyPlan(seed); flown.jet = flown.ufo = flown.ship = false; wanted.clear(); needFloor = -1;
    view.adopt(run, T); view.setBest(0); view.setFriend(0); friendTape = 0; tagOn = false; ftagF = null; ftag.hidden = true; tagDirty = true; view.flyReset();
    prewarm();   // (S4B: every flyer's model on its way NOW — behind the welcome screen, never at its floor)
    // (THE WELCOME's scene: the tower low on the screen, a first slab already sliding in, YOUR BEST's tape)
    view.pose('welcome'); view.welcome(true, best > 0); view.ghostBest(false);
    end.hidden = true; check.hidden = true; again.hidden = true; start.hidden = false; soundsBtn.hidden = false; note.hidden = false;
    stage.classList.remove('is-live', 'is-over', 'is-gold', 'is-made', 'is-ended'); stage.classList.add('is-welcome'); warmHud();
    hudFloor = -1; hudLeft = -2; hitchN = 0; hitchLast = ''; hitchBy.plate = hitchBy.compile = hitchBy.audio = hitchBy.gc = hitchBy.dom = hitchBy.tap = hitchBy.work = hitchBy.unknown = 0; gcSeen = 0; hitchLine(); callUntil = 0; callPri = 0; later = null; if (callAnim) { callAnim.cancel(); callAnim = null; } call.className = 'hi-call is-baked'; callT.data = ''; BL.set('', '');
    band.textContent = BANDS[0].name; setNum(0); tag.hidden = true; tagAt = -1e9; ftagAt = -1e9;
  }
  // (while a run is LIVE the SOUNDS button + the note are off the screen: a thumb anywhere is a DROP, never a menu)
  const live = ts => { t0 = ts; start.hidden = true; soundsBtn.hidden = true; note.hidden = true; stage.classList.remove('is-welcome'); stage.classList.add('is-live'); if (LEANS.size) BN.dirty(); view.pose('play'); view.welcome(false); if (TR) TR.reset(); awakeAt = performance.now(); awake(true); if (FlyMod) needAll(); if (FROM) { climbBy(FROM, null); skipP = run.perfects; skipS = run.streak; } liveRun = run; };   // (needAll at the unlock: the flyers' sounds are decoded now)
  // THE START (S4A). THE PAGE: tick 0 = the START touch — but START waits a moment (≤ START_WAIT_MS) until EVERY sound is decoded: no
  // sound of a run ever takes the late path (THE SOUND SYNC; a first-ever tap is also the audio's unlock). THE CARTRIDGE: tick 0 = GO —
  // `o.go()` writes the proof node's first value (the SERVER's time), reads it back and hands in the seed picked from it + that moment
  // on this page's clock (+ the taps so far: a rejoin).
  let starting = false, startN = 0;
  function begin(ts) {
    if (starting) return;
    const ready = !snd || !snd.ready || snd.ready(), warm = warmOk();
    if (ready && warm && !o.go) { live(ts); return; }
    starting = true; stage.classList.add('is-starting');
    awakeAt = performance.now(); awake(true);   // (THE REVIEW: the hold is taken IN the START touch — GO's answer lands outside any tap, where iOS may refuse to wake a napping context)
    const m = startN;
    const on = G => { if (gone || m !== startN) return; starting = false; stage.classList.remove('is-starting'); if (G) adopt(G); else live(ready && warm ? ts : performance.now()); };
    Promise.all([ready ? null : snd.whenReady(START_WAIT_MS), o.go ? o.go() : null, warm ? null : whenWarm(START_WAIT_MS)]).then(r => on(r[1]), () => on(null));
  }
  /** a run handed in whole (the cartridge): its seed, tick 0 on this page's clock, the taps so far (a rejoin — played at once, unheard) */
  function adopt(G) {
    if (G.mode && MODE_IDS.includes(G.mode) && G.mode !== MODE) { MODE = G.mode; EC.header(MODE === 'solo' ? 'solo' : 'match'); }
    if ((MODE === 'match') !== matchOn) setMatch(MODE === 'match');
    restart(G.seed);
    for (const tk of G.taps || []) { if (isOver(run) || !tap(run, tk, ev)) break; taps.push(tk); }
    hush = taps.length > 0;
    live(G.t0);
  }
  // THE SOUND SYNC (S4A): a batch's sounds are asked the moment its events exist — a tap's own IN THE TOUCH, never a frame later.
  // `sounded` = how many of `ev` already have theirs (the frame sounds the rest: the fuse's drop). `syncs` = the pass's measure: when
  // each landing's sound was asked (tests/integration/sound-sync.mjs sets it against the audio engine's own starts)
  let sounded = 0, hush = false, syncN = 0;
  const SYNCS = 400, syncs = [];   // (a ring of records made once — a landing writes into the next one)
  for (let i = 0; i < SYNCS; i++) syncs.push({ e: '', at: 0 });
  function soundNow(late) {
    if (sounded >= ev.length) return;
    const from = sounded;
    sounded = ev.length;
    if (!snd) return;
    if (!late) { const at = performance.now(); for (let i = from; i < ev.length; i++) { const k = ev[i].e; if (k === 'land' || k === 'perfect' || k === 'cut') { const r = syncs[syncN++ % SYNCS]; r.e = k; r.at = at; } } }
    snd.playCues(snd.cuesOf(ev, late, cues, from, skipS));
  }
  /** `n` clean drops through the real engine, played at once (`off(i)` = how far off dead-on drop i lands, in ticks); the clock moves on with them */
  function climbBy(n, off) {
    for (let i = 0; i < n && !isOver(run); i++) { stepTo(run, run.s0, ev); if (run.st !== 'slide') break; const tk = run.s0 + Math.floor(run.S / 2) + (off ? off(i) : 0); if (tap(run, tk, ev)) taps.push(tk); }
    t0 = performance.now() - run.t * TICK_MS; last = 0; sounded = ev.length;   // (a climb is never heard drop by drop)
    return run.floor;
  }

  // FAIR TAPS: a tap counts at the finger's TOUCH — the pointerdown's own event.timeStamp → its tick — never "the next frame"
  function touch(ts) {
    if (sheetOpen) return;
    const now = performance.now();
    if (!(ts > 0 && ts <= now + 4 && now - ts < 1000)) ts = now;   // (a browser whose event clock is not the page's: the handler's own time)
    if (watchW) { if (o.onWatchTap) o.onWatchTap(); else if (hook.sim && hook.sim.next) hook.sim.next(); return; }   // (S4B — OUT = WATCH: a tap anywhere = the next player)
    if (shown && !card) return;   // (the cartridge: the console's podium is on its way — never a restart under it)
    if (shown) { if (now - overAt > RETRY_MS) { restart(); begin(ts); } return; }   // TAP TO PLAY AGAIN = the next run's START
    if (t0 == null) { if (matchOn && !PAGE) return; begin(ts); return; }   // (a cartridge's MATCH starts on the count — never on a tap)
    if (isOver(run)) return;
    const tk = tickOf(ts, t0);
    if (tap(run, tk, ev)) taps.push(tk);   // (false = a landing beat: not a drop, never logged)
    const ta = TR ? performance.now() : 0;
    soundNow(false);   // (S4A — THE SOUND SYNC: the drop's sounds at the TOUCH)
    if (TR) { const tb = performance.now(); TR.add(PH.input, ta - now); TR.add(PH.audio, tb - ta); }
    marks.tap = performance.now();   // (THE HITCH COUNTER: a stall right after a touch is named for it)
  }
  play.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; touch(e.timeStamp); });
  play.addEventListener('touchmove', e => e.preventDefault(), { passive: false });   // (no page scroll under a finger)
  // (in the console a key is a drop only while nothing else has the focus — its menus + the podium keep their own keys)
  const keyOk = () => PAGE || (!(shown && !card) && !stage.classList.contains('is-final') && (!document.activeElement || document.activeElement === document.body || stage.contains(document.activeElement)));
  document.addEventListener('keydown', e => { if (sheetOpen || !keyOk()) return; if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); touch(e.timeStamp); } }, sig);   // (the sheet's own buttons keep their keys)

  // ---- THE ANNOUNCER LANE (under the band's name): one call at a time — a bigger moment is never wiped by a smaller one
  // Its one-shot (and the band's arrival) are played through the Web Animations API — opacity + transform only, restarted WITHOUT a
  // forced layout (the review: `void el.offsetWidth` here was a layout read inside the frame, on every perfect).
  const calm = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  const POP = calm ? [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.86 }, { opacity: 0 }]
    : [{ opacity: 0, transform: 'translateY(8px) scale(0.86)' }, { opacity: 1, transform: 'scale(1.06)', offset: 0.1 }, { opacity: 1, transform: 'none', offset: 0.2 }, { opacity: 1, transform: 'none', offset: 0.82 }, { opacity: 0, transform: 'translateY(-4px)' }];
  const SWELL = [{ transform: 'scale(1)', opacity: 0.4 }, { transform: 'scale(1.32)', opacity: 1, offset: 0.14 }, { transform: 'scale(1.32)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }];
  let callUntil = 0, callPri = 0, callAnim = null, later = null, laterText = '', laterCls = '', laterPri = 0, laterMs = 0;
  // (ZERO GARBAGE: ONE animation a length is made and kept — a call plays it again; the lane's words go into its one text node)
  const pops = new Map();
  // (S4A FIX 2 — PREWARM: every length the lane plays is MADE NOW, stopped — a first PERFECT / STREAK / NEW BEST builds nothing; the band's swell too)
  const canPop = !LEANS.has('call') && !!call.animate;   // (LEAN: the lane's words just show — no Web Animation over the canvas)
  if (canPop) for (const ms of [700, 1100, 1500, 1700, 1900, 2600]) { const a = call.animate(POP, { duration: ms, fill: 'both' }); a.cancel(); pops.set(ms, a); }
  let swellA = null;
  /** → true = it is on the lane (false: a bigger call holds it). `cls` = the lane's WHOLE class ('hi-call is-perfect') */
  function say(text, cls, pri, ms, now) {
    if (now < callUntil && pri < callPri) return false;
    callUntil = now + ms; callPri = pri; mark('dom');
    callT.data = text; if (call.className !== `${cls} is-baked`) call.className = `${cls} is-baked`;   // (is-baked: the lane's words drawn by its canvas)
    BL.set(text, `${cls}|${toneSeen}|${stageW}x${stageH}`);   // (S5: the glow baked — a call copies bitmaps; its style read once a class + sky + size)
    if (callAnim) callAnim.cancel();
    if (canPop) { let a = pops.get(ms); if (a) a.play(); else { a = call.animate(POP, { duration: ms, fill: 'both' }); pops.set(ms, a); } callAnim = a; }
    else call.style.opacity = '1';
    return true;
  }
  /** this frame's events → the HUD's calls + YOUR BEST's crossing + the band's arrival; → the extra sound cues the view's moments make */
  function moments(evs, from, to, now, late) {
    const cues = more;
    cues.length = 0;
    for (let i = from; i < to; i++) {
      const e = evs[i];
      if (e.e === 'perfect') {
        const st = e.streak - skipS;   // (a `?floor=N` start's own perfects count toward nothing)
        if (st > streakTop) streakTop = st;
        if (st > 0 && st % STREAK_EVERY === 0) say(`STREAK ×${st}`, 'hi-call is-streak', 3, 1500, now);
        else say(st > 1 ? `PERFECT ×${st}` : 'PERFECT', 'hi-call is-perfect', 1, 1500, now);   // (S5 — THE ANNOUNCER CHECK: 0.7 s was gone before it was read; the next perfect replaces it — the same priority)
      } else if (e.e === 'cut') { skipS = 0; }   // (a cut ends the streak — the shortcut's too)
      else if (e.e === 'made') {
        // THE FINISH (a match's floor 200): the white-gold light pours onto the top slab — then the gold end card
        view.fly('pour');
      } else if (e.e === 'land') {
        if (!FROM && !matchOn && crossedBest(best, e.floor)) {   // (a `?floor=N` run never compares a best)
          tapeFloor = best; newBest = true; view.setBest(tapeFloor, true); stage.classList.add('is-gold'); BN.dirty();
          say('NEW BEST', 'hi-call is-gold', 5, 1900, now); if (!late) cues.push(CUE_BEST);
        }
        // THE NEXT FRIEND crossed (S4A — YOUR TABLE's bests; solo only): the thin PINK tape lies on the tower at their floor, PASSED LIAM
        // in the lane — and the next friend above takes the tag
        if (o.friends && MODE === 'solo') { const f = crossedFriend(o.friends(), e.floor); if (f) { friendTape = f.v; view.setFriend(f.v, !late); if (!late) { say(`PASSED ${f.n}`, 'hi-call is-pink', 4, 1700, now); cues.push(CUE_FRIEND); } } }
        const b = bandAt(e.floor);
        // A BAND's ARRIVAL: its name (under the number) lights up — never said twice in the lane below
        if (b > bandNow) { bandNow = b; mark('dom'); if (TR) TR.ev |= EV.seam; band.textContent = BANDS[b].name; if (!calm && !LEANS.has('band') && band.animate) { if (swellA) { swellA.cancel(); swellA.play(); } else swellA = band.animate(SWELL, { duration: 1700 }); } if (!late) cues.push(CUE_BAND); }
        // THE FLYERS: the seed's flyby (35–45) · the UFO (85) · floor 200 — SOLO flies past THE MOTHERSHIP (a moment, then on into deep space)
        const due = flyDue(plan, e.floor, flown);
        if (due) {
          if (TR) TR.ev |= EV.flyer;
          if (due.charCodeAt(0) === 106) flown.jet = true; else if (due.charCodeAt(0) === 117) flown.ufo = true; else flown.ship = true;   // ('jet…' · 'ufo…' · 'ship…' — the missed ones too)
          if (due === 'jet') view.fly(plan.jet, plan.jetDir);
          else if (due === 'ufo') view.fly('ufo', plan.ufoDir);
          else if (due === 'ship' && MODE === 'solo') { view.fly('pass'); say('THE MOTHERSHIP', 'hi-call is-gold', 6, 2600, now); if (!late) cues.push(CUE_BAND); }
        }
        // SOLO PAST 200: every notch of the tightening is called — a FASTER that lands under a bigger call (a streak, NEW BEST) waits its turn
        if (e.floor > TIGHT.from) { const k = Math.floor((e.floor + 1 - TIGHT.from) / TIGHT.every); if (k > notch) { notch = k; if (!say('FASTER', 'hi-call is-fast', 2, 1500, now)) { later = true; laterText = 'FASTER'; laterCls = 'hi-call is-fast'; laterPri = 2; laterMs = 1500; } } }
      }
    }
    return cues;
  }

  // THE LANDING FRAME's LATER WORK (S4A FIX 2 — see the frame): the HUD's moments a frame after the landing, the number two, the tags three
  const LATER_MOMENTS = 1, LATER_NUM = 2, LATER_TAGS = 3;
  let momFrom = 0, momTo = 0, momDue = -1, landF = -1e9;
  function runMoments(now) {
    const from = momFrom, to = momTo;
    momDue = -1;
    if (TR) TR.ev |= EV.deferred;
    const x = moments(liveEv, from, to, now, false);
    if (snd && x.length) snd.playCues(x);
  }

  function showEnd(now) {
    if (momDue >= 0) runMoments(now);   // (the last landing's moments before its end card)
    shown = true; overAt = now; liveRun = null; awake(false);   // (THE SOUND SYNC: the hold ends with the run — the context naps again on the end card)
    const live = resultOf(run), b = bandAt(live.floor), was = best;
    best = FROM || matchOn ? was : nextBest(was, live.floor);   // (a `?floor=N` look check is not a run: YOUR BEST stays · THE CLOSE's REVIEW: YOUR BEST is the SOLO best — a match's floor never sets it)
    if (best > was) writeBest(best);   // (THE REVIEW: stored BEFORE the end screen is asked for — the podium's body reads it)
    // THE CARTRIDGE: the console's podium IS the end screen — the stage's own card only for a run that can't reach it (UNPROVEN)
    // (S5 — THE TEST PAGE's bot room (`?mode=match&rivals=N`): OUT = WATCH there too — the ranked list, a tap = the next, a row = that
    //  bot; the page's own card comes once every bot is down (or after SIM_WATCH_MS): matchsim.js)
    const E = o.onEnd ? o.onEnd(live) : PAGE && matchOn && hook.sim && hook.sim.wantWatch() ? { watch: true, page: true } : null;
    card = !E || !!E.own;
    endSaid = endWords(live);
    // S4B — OUT = WATCH (a match): no card, no veil — the stage stays live for the watcher (the driver hands the tower to watch in)
    if (E && E.watch) { card = false; watchMode(true); hook.ends.push({ seed, mode: MODE, live, taps: taps.slice(), best, was, watch: true }); if (hook.ends.length > 50) hook.ends.shift(); if (E.page) pendEnd = { live, was, E: null }; return; }
    cardEnd(live, was, E);
  }
  /** the end card's half of an end (the page's own card) — at once, or (S5, the test page's bot room) once WATCH is over */
  function cardEnd(live, was, E) {
    EC.set({ words: endSaid, made: live.made, floor: live.floor, perfects: live.perfects - skipP, streak: FROM ? streakTop : live.maxStreak });   // (a `?floor=N` start's floors count toward nothing)
    EC.best(best, best > was && was > 0, was);   // (a first run's floor is YOUR BEST — NEW BEST is said of a best that was BEATEN)
    // (S4B — JAYWALK's standard: the scene is DIMMED behind the card — no dashed outline over the tower, no BEST n ↑ beside it)
    view.pose('end'); view.ghostBest(false);
    stage.classList.add('is-ended'); tagDirty = true;
    stage.classList.toggle('is-made', live.made);
    // THE DETERMINISM CHECK (the owner's, on a real iPhone): the recorded tap log replayed through a FRESH engine — the judge's own code
    const { used, bad, why, ...r } = replay({ seed, mode: MODE, taps });
    let same = bad < 0 && used === taps.length && JSON.stringify(r) === JSON.stringify(live), at = -1;
    const fresh = createRun({ seed, mode: MODE }), evR = [];
    for (const t of taps) tap(fresh, t, evR);
    stepTo(fresh, endBy(fresh, taps.length ? taps[taps.length - 1] : 0), evR);
    for (let i = 0; i < Math.max(evR.length, liveN); i++) {
      const lv = i < liveN ? liveEv[i] : undefined;
      if (JSON.stringify(evR[i]) !== JSON.stringify(lv)) { same = false; at = Math.min(evR[i] ? evR[i].t : Infinity, lv ? lv.t : Infinity); break; }
    }
    check.className = `hi-check ${same ? 'is-ok' : 'is-bad'}`;
    if (E && E.note) { check.className = 'hi-check is-note'; check.textContent = E.note; } else
    check.textContent = same ? 'REPLAY = LIVE ✓' : `REPLAY ≠ LIVE ✗ · first differs at tick ${at < 0 || at === Infinity ? '?' : at} · live ${live.floor} ${live.cause} · replay ${r.floor} ${r.cause}${why ? ` (${why})` : ''}`;
    if (TR) { traceEl.textContent = TR.lines().join(String.fromCharCode(10)); traceEl.hidden = false; }
    end.hidden = !card; again.hidden = !card; soundsBtn.hidden = false; note.hidden = false; ftag.hidden = true; ftagF = null;
    check.hidden = !card || !(PAGE || (E && E.note));   // (REPLAY = LIVE: the test page's alone — small, just over the PLAY AGAIN bar; a cartridge card's own line: its reason)
    stage.classList.remove('is-live'); if (card) stage.classList.add('is-over');
    view.rest();   // (the first band's plate comes back while the card is up: PLAY AGAIN never starts on a blank sky)
    view.flyHush();   // (… and a flyer still in the sky fades out: never behind the card's words)
    hook.ends.push({ seed, mode: MODE, rules: run.rules, same, at, live, replay: r, taps: taps.slice(), best, was }); if (hook.ends.length > 50) hook.ends.shift();
  }

  let pendEnd = null;   // (S5: the test page's end waiting behind WATCH)
  // S5 — THE SHARE IMAGE: this run's frame, kept on the phone (shot.js) under the driver's key (the cartridge: its match id; the page: its seed)
  let shotAt = 0, shotRun = -1;
  function takeShot() {
    shotAt = 0;
    if (shotRun !== startN || !view.snap || watchW) return;   // (a watched tower on screen is never YOUR picture — the review)
    const r = mine || run, key = o.shotKey ? o.shotKey() : seed, n = startN;
    view.snap(cv => { if (!cv || gone || n !== startN) return; keepShot({ key, canvas: cv, topX: cv.topX, topY: cv.topY, floor: r.floor, perfects: r.perfects - skipP, cause: r.st === 'out' ? r.cause : r.st, made: r.st === 'made', look: lookSeen }); }, 1080);
  }
  let trLive = false;   // (THE TRACE: the run was live as this frame's record opened)
  let raf = 0, last = 0, hudFloor = -1, hudLeft = -2, tagOn = false, tagAt = -1e9, ftagF = null, ftagAt = -1e9, friendTape = 0, frameN = 0, lookSeen = lookT, toneSeen = skyTone(lookT, 0);
  // (the two tags are placed ONCE A LANDING — tagSeen*: what they were last placed for)
  let tagSeenFloor = -1, tagSeenLive = -1, fpsAt = 0, endSaid = '';
  const XY = new Float64Array(2);
  // THE HITCH COUNTER: frames over HITCH_MS in this run (after its first second; a tab that was away is not a hitch) + the last one's cause
  let hitchN = 0, hitchAll = 0, hitchLast = '';
  // (the frame's own fractions — when the last frame began, how long its code took, the phone's usual frame (eased) — in ONE scratch
  //  of doubles: a fraction written every frame to a variable functions share is a small object every frame)
  const FS = new Float64Array(5), PREV_AT = 0, PREV_WORK = 1, USUAL = 2, GAP = 3, TAU = 4;
  FS[USUAL] = TICK_MS;
  const hitchList = [], hitchBy = { plate: 0, compile: 0, audio: 0, gc: 0, dom: 0, tap: 0, work: 0, unknown: 0 };
  function hitch(gap) {
    const since = FS[PREV_AT] - 2, prevWork = FS[PREV_WORK];
    if (snd && snd.lastWork) { const a = snd.lastWork(); if (a > marks.audio) marks.audio = a; }
    if (canary && !canaryGone && canary.deref() === undefined) { canaryGone = true; marks.gc = performance.now(); gcSeen++; }   // (a collection ran — its callback has not come round yet)
    // (the page's own one-off work first; then a collection that is KNOWN to have run; then the HUD's writes, a touch; then the page's
    //  own frame code being slow; with none of them the cause is not known — and the line says so)
    const why = marks.plate >= since ? 'plate' : marks.compile >= since ? 'compile' : marks.audio >= since ? 'audio' : marks.gc >= since ? 'gc' : marks.dom >= since ? 'dom' : marks.tap >= since ? 'tap' : prevWork > 12 ? 'work' : 'unknown';
    hitchN++; hitchAll++; hitchBy[why]++; hitchLast = `${why} ${gap.toFixed(0)} ms @${run.floor}`;
    if (hitchList.length < 200) hitchList.push({ why, gap: Math.round(gap), floor: run.floor, work: Math.round(prevWork) });
    hitchLine();
  }
  /** YOUR BEST + THE NEXT FRIEND while they are ABOVE you: the right-edge tags — ONCE A LANDING (S4A FIX: never a style write a frame).
   *  A tag's place is worked out for where the camera will REST on this floor (night.js#restY — the camera only ever slides, so that is
   *  plain arithmetic) and a short CSS transition rides it there WITH the camera (css: .hi-tag). Each held clear of the HUD, of THE
   *  DROP ZONE and of the other (THE TWO TAGS KEEP THE FLOORS' ORDER: the higher floor's tag above; where the friend's own side has
   *  no room — both held at the column's edge — the GOLD tag steps the other way). One friend at a time; solo only. */
  function placeTags(mode) {
    const live = mode === 2;
    if (TR) { if (live) TR.ev |= EV.tags; }
    if (MH && !live) MH.place(0, 0);   // (S5: THE PLACE NUMBER is a live climber's only — the welcome, the end's hold, the card)
    tagSeenFloor = run.floor; tagSeenLive = mode; tagDirty = false;
    // THE WELCOME (mode 1): YOUR BEST's tag at the gold tape round the waiting tower's top slab — "BEST 119" · THE END (mode 3 — S4B,
    // JAYWALK's standard): no tag at all (the card's own YOUR BEST · n line says it; the scene is dimmed behind the card)
    if (mode === 1 || mode === 3) {
      if (ftagF) { ftagF = null; ftag.hidden = true; }
      const on = mode === 1 && best > 0, tp = T.top();
      if (!on) { if (tagOn) { tagOn = false; tag.hidden = true; } return; }
      view.poseXY(tp.x1, run.floor - 0.5, tp.z0, XY);
      mark('dom');
      tagT.data = `BEST ${best}`;
      tagAt = -1e9; tag.style.transform = `translate3d(0, ${(XY[1] * stageH).toFixed(1)}px, 0)`;
      if (!tagOn) { tagOn = true; tag.hidden = false; }
      return;
    }
    if (matchOn && live) placeRivals();   // (S4B: a match's right-edge column is the RIVALS' — no gold line, no friend's)
    const gold = live && !FROM && !matchOn && best > 0 && run.floor <= best, fr = live && o.friends && MODE === 'solo' ? nextFriend(o.friends(), run.floor) : null;
    if (!gold && tagOn) { tagOn = false; tag.hidden = true; }
    if (!fr && ftagF) { ftagF = null; ftag.hidden = true; }
    if (!gold && !fr) return;
    const zone = view.restZone() * stageH;
    // (a height is clamped to 100 floors up: a best far above is BEHIND the diagonal camera — projected, it came back mirrored and the tag jumped to the foot of its column: the review)
    let yg = gold ? tagY(view.restY(Math.min(best, run.floor + 100)) * stageH, hudFoot, zone) : -1e9, yf = -1e9;
    if (fr) {
      yf = tagY(view.restY(Math.min(fr.v, run.floor + 100)) * stageH, hudFoot, zone);
      if (gold && Math.abs(yf - yg) < 30) {
        const up = fr.v >= best, want = tagY(yg + (up ? -30 : 30), hudFoot, zone);
        if (Math.abs(want - yg) >= 29.5) yf = want; else { yf = yg; yg += up ? 30 : -30; }
      }
    }
    mark('dom');
    if (gold) {
      tagT.data = bestTag(best, run.floor);
      if (Math.abs(yg - tagAt) >= 0.25) { tagAt = yg; tag.style.transform = `translate3d(0, ${yg.toFixed(1)}px, 0)`; }   // (a tag that did not move is not written)
      if (!tagOn) { tagOn = true; tag.hidden = false; }   // (shown AFTER it is placed: a tag that comes in never slides in from its last run's place)
    }
    if (fr) {
      ftagT.data = friendTag(fr, run.floor);
      if (Math.abs(yf - ftagAt) >= 0.25) { ftagAt = yf; ftag.style.transform = `translate3d(0, ${yf.toFixed(1)}px, 0)`; }
      if (ftagF !== fr) { ftagF = fr; ftag.hidden = false; }
    }
  }
  /** the `?fps=1` line — written ONCE A SECOND, in three kept text nodes (S4A FIX: the line itself made garbage twice a second — three
   *  lists, a spread of 120 numbers, the scene's whole info record, one long string): the frame rate (the last 120 frames, read off
   *  the ring) · the scene's few numbers (night.js#stat — ONE kept record; written only when one of them moved) · the tick + THE HITCH
   *  COUNTER (its words are built when a hitch is counted, not here) */
  let hitchWords = '';
  const SEEN = { tier: -1, bloom: false, calls: -1, tris: -1, w: -1, h: -1, dpr: -1 };
  function fpsLine() {
    const n = Math.min(frameN, 120);
    let sum = 0, worst = 0;
    for (let i = 0; i < n; i++) { const g = frames[(frameN - 1 - i) % FRAMES_KEPT]; sum += g; if (g > worst) worst = g; }
    const avg = n ? sum / n : TICK_MS, i = view.stat();
    fpsA.data = `${Math.round(1000 / avg)} fps · ${Math.round(avg * 10) / 10} ms · worst ${Math.round(worst)}`;
    if (i && (i.tier !== SEEN.tier || i.bloom !== SEEN.bloom || i.calls !== SEEN.calls || i.tris !== SEEN.tris || i.w !== SEEN.w || i.h !== SEEN.h || i.dpr !== SEEN.dpr)) {
      SEEN.tier = i.tier; SEEN.bloom = i.bloom; SEEN.calls = i.calls; SEEN.tris = i.tris; SEEN.w = i.w; SEEN.h = i.h; SEEN.dpr = i.dpr;
      fpsB.data = ` · tier ${i.tier}${i.bloom ? ' bloom' : ''} · ${i.calls} calls · ${i.tris} tris · ${i.w}×${i.h} @${i.dpr}`;
    }
    fpsC.data = ` · tick ${run.t}${hitchWords}`;
  }
  /** THE HITCH COUNTER's words (built when a hitch / a collection is counted — and at a run's start): " · HITCH 3 (last: gc 41 ms @83 · gc 2 dom 1) · GC 2" */
  function hitchLine() {
    let by = '';
    for (const k in hitchBy) if (hitchBy[k]) by += ` ${k} ${hitchBy[k]}`;
    hitchWords = ` · HITCH ${hitchN}${hitchLast ? ` (last: ${hitchLast} ·${by})` : ''}${HAS_WEAK ? ` · GC ${gcSeen}` : ''}`;
  }
  // ZERO GARBAGE IN PLAY (S4A FIX — docs/highrise.md "THE LAG RULES"; tests/integration/highrise-alloc.mjs fails if it creeps back): a
  // LIVE frame makes NOTHING — no list, no record, no closure, no string. What changes once a LANDING (the number's digits, a call,
  // the tags' words, the sounds' sources) is written into nodes + records made once.
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (frozen) now = frozen;   // (the pass's pixel test: the SAME instant drawn again — hook.freeze)
    if (o.lookNow && frameN % 15 === 0) { const l = o.lookNow(); if (l !== lookT) setLook(l); }   // (the console's GAME LOOK, read LIVE — four times a second)
    // (a fraction that a branch picks is written into the scratch, never held in a variable: FS[GAP] · FS[TAU])
    const w0 = performance.now();
    FS[GAP] = TICK_MS; if (last) FS[GAP] = now - last;
    const gap = FS[GAP], io = view.io;
    io[1] = Math.min(250, gap);
    if (last && gap > HITCH_MS && gap > FS[USUAL] * HITCH_X && gap < LATE_MS && FS[PREV_AT] && t0 != null && now - t0 > 1000 && !shown && !isOver(run)) hitch(gap);
    if (last && FS[PREV_AT]) FS[USUAL] += (Math.min(gap, 100) - FS[USUAL]) * 0.05;
    // (a record is counted by the run's state as it OPENED — the frame that ends the run (its miss, its falling slab) is counted too: the review)
    if (TR) { TR.begin(w0, gap, run.floor, last && gap < LATE_MS && FS[PREV_AT] && trLive); trLive = t0 != null && now - t0 > 1000 && !shown && !isOver(run); }
    last = now;
    if (document.hidden || sheetOpen) { FS[PREV_AT] = 0; return; }
    FS[TAU] = 0;
    if (t0 != null) {
      FS[TAU] = Math.max(0, (now - t0) / TICK_MS);
      if (watchW) {
        // (THE PLAYBACK: a delay that must grow is eased in — the playback runs at (1 − WATCH_SLEW) of real time until it is there)
        if (wD < wDT) wD = Math.min(wDT, wD + WATCH_SLEW * Math.min(250, gap) / TICK_MS);
        wP = Math.max(0, FS[TAU] - wD);
        feedWatch();
      } else if (!isOver(run)) {
        const tk = Math.floor(FS[TAU]), cap = MODES[MODE].capTicks;
        if (TR) TR.lap(PH.other);
        stepTo(run, cap != null && tk >= cap && tk < cap + CAP_GRACE ? cap - 1 : tk, ev);
        if (TR) TR.lap(PH.engine);
      }
    }
    if (ev.length && watchW) { T.feed(ev); view.events(ev); ev.length = 0; sounded = 0; hush = false; }   // (a watched tower: drawn, never sounded, never called)
    if (ev.length) {
      const late = gap > LATE_MS || hush;
      if (TR) { TR.lap(PH.other); for (let i = 0; i < ev.length; i++) { const k = ev[i].e; TR.ev |= k === 'land' ? EV.land : k === 'perfect' ? EV.perfect : k === 'cut' ? EV.cut : k === 'grow' ? EV.grow : k === 'out' ? EV.out : 0; } }
      T.feed(ev); view.events(ev);
      if (TR) TR.lap(PH.fx);
      soundNow(late);
      if (TR) TR.lap(PH.audio);
      if (liveN + ev.length > liveEv.length && liveEv.length < 400000) growLive();   // (past ~680 floors)
      // THE LANDING FRAME (S4A FIX 2): this frame snaps the slab (the tower, above) + its sounds started in the touch. The HUD's moments —
      // the announcer, a band's arrival, YOUR BEST / a friend crossed, a flyer's start, their extra sounds — are read off the run's kept
      // events NEXT frame (LATER_MOMENTS), the big number + the band's name the frame after (LATER_NUM), the right-edge tags after that
      // (LATER_TAGS): no frame pays for all of it. A batch from a hidden tab (late) is read at once — nothing is drawn of it anyway.
      if (momDue >= 0) runMoments(now);   // (a batch still waiting is read first: the order holds)
      const from = liveN;
      for (let i = 0; i < ev.length && liveN < liveEv.length; i++) liveEv[liveN++] = ev[i];
      if (liveN - from < ev.length) { const x = moments(ev, 0, ev.length, now, late); if (snd && x.length) snd.playCues(x); }   // (the kept list is full — past 400,000 events: at once)
      else if (late) { const x = moments(liveEv, from, liveN, now, true); if (snd && x.length) snd.playCues(x); }
      else { momFrom = from; momTo = liveN; momDue = frameN + LATER_MOMENTS; landF = frameN; }
      ev.length = 0; sounded = 0; hush = false;
    }
    if (momDue >= 0 && frameN >= momDue) runMoments(now);
    if ((t0 != null || starting) && !shown && now - awakeAt > 1000) { awakeAt = now; awake(true); }   // (THE SOUND SYNC: the lease, renewed while the run is live)
    if (t0 != null && o.onFrame) o.onFrame(now);
    const over = isOver(run);
    if (over && !endedAt && o.onOver) o.onOver(resultOf(run));
    // S5 — THE SHARE IMAGE's frame: a beat after YOUR tower's end (per cause — shot.js), the next frame drawn is copied (night.js#snap)
    if (over && !endedAt && !watchW && t0 != null) { shotAt = now + shotMs(run.st === 'out' ? run.cause : run.st, run.st === 'made'); shotRun = startN; }   // (the bell's own beat — the review)
    if (shotAt && now >= shotAt) takeShot();
    if (over && !endedAt) endedAt = now;   // (the end's own frame — whether THE FUSE ended it in this frame or a TAP did in the touch handler: the review — a miss used to bring the card at once, over the falling slab)
    if (over && !shown && now - endedAt >= (run.st === 'made' ? MADE_HOLD_MS : END_HOLD_MS)) showEnd(now);
    io[0] = watchW ? wP : FS[TAU]; if (over) io[0] = run.end; else if (watchW && run.st === 'slide' && io[0] > run.s0 + 2 * run.S - 1) io[0] = run.s0 + 2 * run.S - 1;   // (a watched slab is HELD at its sweep's last tick: it waits for its tap / their end)
    if (watchW) {
      if (run.st === 'slide') { if (wDrawn < run.s0) wDrawn = run.s0; if (io[0] > wDrawn) wDrawn = io[0]; } else wDrawn = -1;
      if (wRec && wRecN < wRec.length / WREC) recWatch();
      if (rivalRows && MH && watchUi && run.floor !== wListFloor) MH.altimeter(listRows(rivalRows));   // (the list's watched row = the delayed tower's)
    }
    if (matchOn) { const sl = run.st === 'slide' && !watchW ? 1 : 0; if (sl !== dimWas) { dimWas = sl; MH.dim(sl === 1); view.dimRivals(sl === 1); } }   // (S4B: the rivals DIM while YOUR slab slides)
    io[2] = now;   // (S4A FIX 2 — THE FLYERS' CLOCK: the frame's own timestamp)
    if (TR) TR.lap(PH.other);
    view.draw(run);
    // ---- the HUD: written only when it changes (two numbers compared — no text is built in a frame that changes nothing)
    const cap = MODES[MODE].capTicks, left = cap == null ? -1 : Math.max(0, Math.ceil((cap - (over ? run.end : Math.floor(FS[TAU]))) / TICK_HZ));
    if ((run.floor !== hudFloor || left !== hudLeft) && frameN >= landF + LATER_NUM) {
      if (TR) { if (run.floor !== hudFloor) TR.ev |= EV.num; }
      hudFloor = run.floor; hudLeft = left;
      setNum(run.floor);
      const b = bandAt(run.floor); if (band.textContent !== BANDS[b].name) band.textContent = BANDS[b].name;
      // (S4B: the clock's ONE text node — a second's change writes its data, never a new node; no clock at all in solo)
      if (cap != null) { const text = clockText(left * TICK_HZ); if (clockT.data !== text) clockT.data = text; }
    }
    if (run.floor !== needFloor && frameN >= landF + LATER_NUM) { needFloor = run.floor; flyCheck(); }   // (S4A FIX 2: never on the landing frame — a model's fetch / THE MOTHERSHIP's hull is begun two frames later)
    // the page's words follow the picture: the look on screen + the sky's tone at this height (compared, written only at a change)
    const lk = view.lookNow ? view.lookNow() : lookT, tone = skyTone(lk, run.floor);
    if (lk !== lookSeen || tone !== toneSeen) { lookSeen = lk; toneSeen = tone; mark('dom'); stage.dataset.look = lk; stage.dataset.sky = tone; BN.dirty(); }
    // the two right-edge tags: placed once a landing (+ when the run starts / ends, the screen's size or the friends change)
    // (the tags' mode: 1 the welcome · 2 a live run · 3 the end screen · 0 between — the end's hold)
    const tagMode = watchW ? 2 : t0 == null ? (shown ? 3 : 1) : shown ? 3 : over ? 0 : 2;
    if ((run.floor !== tagSeenFloor || tagMode !== tagSeenLive || tagDirty) && (frameN >= landF + LATER_TAGS || tagMode !== 2)) placeTags(tagMode);
    // (S4B — WHAT REPAINTS IN PLAY: a call that has ENDED is invisible — its animation holds it at opacity 0 — so its end WRITES NOTHING.
    //  It used to put the lane's class + opacity back: a font-size change = a layout + a paint of a glowing line nobody sees, 0.7–1.9 s
    //  after EVERY call — a paint far from any landing. Only the lane with no animation — LEAN — hides its words itself)
    if (callUntil && now > callUntil) { callUntil = 0; callPri = 0; if (!canPop) call.style.opacity = ''; if (later) { later = null; say(laterText, laterCls, laterPri, laterMs, now); } }
    if (TR) TR.lap(PH.hud);
    frames[frameN % FRAMES_KEPT] = gap; frameN++;
    // (the tier rule is asked six times a second, not sixty — and makes nothing when it is: kit/tiers.js)
    FS[PREV_WORK] = performance.now() - w0; FS[PREV_AT] = w0;
    tiers.sample(now, FS[PREV_WORK]); if (pin == null && frameN % 10 === 0) tiers.tick(now);
    if (fps && now - fpsAt >= FPS_EVERY_MS) { fpsAt = now; fpsLine(); }
    if (TR) TR.lap(PH.other);
  }
  document.addEventListener('visibilitychange', () => { tiers.reset(); if (document.visibilityState === 'hidden') { awake(false); if (o.onHide) o.onHide(); } else if (o.onShow) o.onShow(); if (glDown && document.visibilityState === 'visible') { tries = 0; rebuild(); } }, sig);

  // (the pass's own checks — tests/integration/highrise-play.mjs)
  const hook = {
    ends: [], view, sfx: null, el: stage,
    state: () => ({ mode: MODE, seed, look: lookT, choice, sky: stage.dataset.sky, started: t0 != null, starting, shown, card, lates: snd && snd.lates ? snd.lates() : 0, over: isOver(run), st: run.st, t: run.t, floor: run.floor, streak: run.streak, perfects: run.perfects, shownPerfects: run.perfects - skipP, shownStreak: run.streak - skipS, lean: LEAN, leans: [...LEANS], warm: warmOk(), s0: run.s0, S: run.S, taps: taps.length, best, tapeOn: tapeFloor > 0, newBest, band: bandNow, words: endSaid, check: check.hidden ? '' : check.textContent, call: call.textContent, tag: tag.hidden ? '' : tag.textContent, ftag: ftag.hidden ? '' : ftag.textContent, friendTape, top: { x0: run.x0, x1: run.x1, z0: run.z0, z1: run.z1, floor: run.floor }, viewTop: view.top(), tier: tiers.get(), tierPath: tierPath.slice(), rebuilds, sheet: sheetOpen, info: view.info() }),
    /** ms until the sliding slab is next dead on the tower — on its way out, or on its way back (null = no slab / its last pass is gone) */
    /** … the same as a WHOLE number of ms (−9999 = none) — nothing is made: the allocation measure's bot asks it every frame */
    soon() { if (t0 == null || run.st !== 'slide') return -9999; const a = t0 + (run.s0 + run.S / 2) * TICK_MS - performance.now(), b = a + run.S * TICK_MS; return a > -8 ? Math.round(a) : b > -8 ? Math.round(b) : -9999; },
    msToPerfect() {
      if (t0 == null || run.st !== 'slide') return null;
      const now = performance.now(), a = t0 + (run.s0 + run.S / 2) * TICK_MS - now, b = a + run.S * TICK_MS;
      return a > -8 ? a : b > -8 ? b : null;
    },
    restart: s => restart(s),
    /** where the run stands, as ONE number (nothing is built: the allocation measure's bot asks it every frame) — 0 the start screen · 1 live · 2 over (the end's hold) · 3 the end card */
    phase: () => (shown ? 3 : t0 == null ? 0 : isOver(run) ? 2 : 1),
    /** THE FLYERS: the seed's plan · a moment NOW ('blackbird' | 'f22' | 'ufo' | 'ship' = THE MOTHERSHIP fully down | 'pass' | 'pour' — the
     *  pass's look check: its module + model are fetched first) → a promise of true = it flies */
    plan: () => ({ ...plan, flown: { ...flown } }), flyInfo: () => view.flyInfo(),
    /** S4A FIX 2 — THE FLYER PATH CHECK: `on` = record every frame's flyer place on the screen (t s · x · y 0 … 1 · its kind) · off → the record */
    flyPath: on => view.flyPath(on),
    fly(kind, dir = 1) {
      const model = kind === 'ship' || kind === 'pass' || kind === 'pour' ? 'mothership' : kind;
      return loadFly().then(() => { view.band(stageH ? hudFoot / stageH : 0.2); view.need(model); return new Promise(res => { let n = 0; (function wait() { const i = view.flyInfo(); if ((i.models || []).includes(model)) return setTimeout(() => res(view.fly(kind, dir)), 120); if (++n > 120) return res(false); setTimeout(wait, 50); })(); }); });
    },
    /** THE LOOK SWITCH: the choice ('auto' | 'day' | 'night') as the start screen's buttons make it · the look itself (the pass's check: a switch mid-run) */
    pickLook: l => pickLook(l), setLook: (l, now) => setLook(l, now), look: () => ({ choice, look: lookT, sunKnown }),
    frames: () => Array.from(frames.subarray(0, Math.min(frameN, FRAMES_KEPT))),
    /** THE HITCH COUNTER: this run's count · every run's · the last one's words · each with its cause */
    hitches: () => ({ n: hitchN, all: hitchAll, last: hitchLast, list: hitchList.slice(), by: { ...hitchBy }, gcs: gcSeen, canary: HAS_WEAK }),
    setTier: t => tiers.set(t),
    /** (the pass's LOOK CHECK — real drops through the real engine, played at once: the tower `n` floors up, the clock moved on with
     *  it; `off(i)` = how far off dead-on drop i lands, in ticks) */
    climb(n, off = () => 0) {
      if (t0 == null) { startN++; starting = false; stage.classList.remove('is-starting'); live(performance.now()); }
      return climbBy(n, off);
    },
    stop() { cancelAnimationFrame(raf); offGL(); view.destroy(); },
    // ---- S4A — THE CARTRIDGE's handles (view.js) + THE SOUND SYNC's measure
    /** START with no tap (PLAY AGAIN's remount) · a run handed in whole (a rejoin) · tick 0 moved onto this page's clock again (back on screen) */
    start: () => { if (t0 == null && !shown) begin(performance.now()); }, adopt: G => adopt(G),
    setT0(ms) { if (t0 != null && ms > 0) { t0 = ms; last = 0; } },
    /** the run's tap log (the SAME list the engine's drops are logged in — the proof's chunks are cut from it) · its result as it stands */
    taps: () => taps, result: () => resultOf(mine || run), seed: () => seed,
    /** (S5 — ZERO GARBAGE IN A MATCH) YOUR numbers read into a record the caller keeps — what a match's pump asks 10 × a second */
    me(into) { const r = mine || run; into.floor = r.floor; into.perfects = r.perfects; into.over = isOver(r); into.made = r.st === 'made'; into.cause = r.st === 'out' ? r.cause : r.st === 'made' || r.st === 'cap' ? r.st : ''; return into; },
    /** the stage's own end card after all (the podium never came: no signal) — with its one line */
    showCard(line) { if (!shown || card) return; card = true; overAt = performance.now(); end.hidden = false; again.hidden = false; stage.classList.add('is-over'); check.className = 'hi-check is-note'; check.textContent = line || ''; check.hidden = !line; },
    /** the podium takes the screen: the stage's own card is put away (never a restart under it) */
    hideCard() { if (!card) return; card = false; end.hidden = true; check.hidden = true; again.hidden = true; stage.classList.remove('is-over'); },
    /** the friends' bests changed (YOUR TABLE answered) */
    friends() { tagDirty = true; },
    // ---- S4B — THE MATCH's handles
    /** a match is on this stage (the count before its run is known: the welcome's scene, no TAP TO START) · its HUD */
    setMatch: on => setMatch(on), hud: () => matchHud(),
    /** (REVIEW FIX A — the HUD's gap check) a call on the game's own lane, as a landing says it ('hi-call is-perfect' …) */
    say: (text, cls = 'hi-call is-perfect') => say(text, cls, 9, 1500, performance.now()), matchState: () => (MH ? { ...MH.state(), tapes: view.rivalInfo ? view.rivalInfo() : [], watching: watchW ? watchW.uid : '', on: matchOn } : null),
    /** every player's row — the rivals round the tower on screen + THE PLACE NUMBER placed again; WATCH's ranked list (S5) while it is up */
    rivals(rows) { if (!matchOn) return; rivalRows = rows; const M = matchHud(); if (watchUi) M.altimeter(listRows(rows)); tagDirty = true; },
    /** OUT = WATCH: the tower on screen becomes W's — { uid, seed, taps (their LANDED taps — a list that grows), done: () => their end is signalled } */
    /** a WATCHER who never played (a late joiner, a refresh after their own end): the match's seed + clock, no run of their own */
    spectate(G) {
      if (G.mode && MODE_IDS.includes(G.mode) && G.mode !== MODE) { MODE = G.mode; EC.header(MODE === 'solo' ? 'solo' : 'match'); }
      if ((MODE === 'match') !== matchOn) setMatch(MODE === 'match');
      restart(G.seed); live(G.t0);
      shown = true; card = false; overAt = endedAt = performance.now(); liveRun = null; awake(false); watchMode(true);
    },
    watch(W) {
      if (!W || !shown || card) return;
      if (!mine) { mine = run; mineT = T; }
      watchW = W; wN = 0; wSeen = W.taps.length; wD = wDT; wP = Math.max(0, FS[TAU] - wD); wDrawn = -1;   // (the taps already here came earlier: their lateness is not known)
      run = createRun({ seed: W.seed, mode: MODE }); T = createTower(run, hooks, KEEP);
      ev.length = 0; sounded = 0; momDue = -1;
      // (REVIEW FIX A — a CLEAN START: the new player's tower is caught up to the playback tick and fed to the tower BEFORE the view
      //  adopts it — the catch-up's falling pieces, rings + the last landing's bump are cleared by the adopt: no half-drawn slab)
      feedWatch(); T.feed(ev); ev.length = 0;
      view.adopt(run, T); view.pose('play'); view.flyReset();
      hush = true; wListFloor = -1;
      hudFloor = -1; tagDirty = true; last = 0;
    },
    watching: () => (watchW ? watchW.uid : ''),
    /** (REVIEW FIX A) the watched tower's floor as it is DRAWN (the delayed playback) — the watcher's line + the list read it (-1 = none) */
    watchFloor: () => (watchW ? run.floor : -1),
    /** (the spectate-sync test) the playback's numbers · `ms` = set the delay (0 + `pin` = the old live clock, kept: the test's own control) */
    watchSync(ms, pin = false) { if (ms != null) { wD = wDT = Math.max(0, ms) / TICK_MS; lateRing.fill(0); wPin = !!pin; } return { delayMs: wD * TICK_MS, wantMs: wDT * TICK_MS, past: wPast, p: wP, tick: FS[TAU] }; },
    /** (the spectate-sync test) record every watched frame: [the drawn tick, the sliding slab's floor (0 = none), its offset, its centre's screen x + y (0 … 1), px per unit along its axis] */
    watchRec(on) { if (on) { wRec = new Float64Array(WREC * 20000); wRecN = 0; return null; } const out = []; for (let i = 0; i < wRecN; i++) out.push(Array.from(wRec.subarray(i * WREC, i * WREC + WREC))); wRec = null; return out; },
    /** (S5) the test page's end is waiting behind WATCH */
    watchWait: () => !!pendEnd,
    /** (S5 — the test page's bot room) WATCH is over: YOUR tower back on screen, then the page's own end card */
    unwatch() {
      if (!pendEnd) return;
      const P = pendEnd; pendEnd = null;
      if (mine) { run = mine; T = mineT; mine = null; mineT = null; view.adopt(run, T); }
      watchW = null; wN = 0; ev.length = 0; sounded = 0; hush = false; watchMode(false);
      // (THE CLOSE's REVIEW: the card IS the page's now — `card` on, its hold from now; the watched tower's tapes + tags go)
      card = true; overAt = performance.now();
      for (let i = 0; i < RIVAL_TAPES; i++) view.setRival(i, 0, 0, 0, 0);
      if (MH) { MH.watching(''); MH.place(0, 0); MH.setTags(NO_TAGS, hexOfRival); }
      cardEnd(P.live, P.was, P.E);
    },
    /** the match's clock in ticks (a fraction into the next) — what a driver steps the rivals to */
    tick: () => FS[TAU], live: () => t0 != null,
    /** (the pass's pixel test) the SAME instant drawn again and again · every rival thing off / on */
    freeze(on) { frozen = on ? (last || performance.now()) : 0; if (!on) last = 0; },
    showRivals(on) { stage.classList.toggle('no-rivals', !on); if (view.showRivals) view.showRivals(on); },
    /** THE ON-PHONE TRACE (`?trace=1`): the worst records as plain data (null = off) */
    trace: () => (TR ? TR.worst() : null),
    syncs: () => { const out = [], k = Math.min(syncN, SYNCS); for (let i = syncN - k; i < syncN; i++) { const r = syncs[i % SYNCS]; out.push({ e: r.e, at: r.at }); } return out; },
    /** the cartridge unmounts: every listener, timer + the scene go */
    destroy() {
      if (gone) return;
      gone = true; cancelAnimationFrame(raf); ac.abort(); clearInterval(sunIv); clearTimeout(lostTimer); ro.disconnect(); awake(false);
      offGL(); try { view.destroy(); } catch { /* gone already */ }
      try { if (snd) snd.stopAll(); } catch { /* silent */ }
      stage.remove();
    },
  };
  if (o.hook) window[o.hook] = hook;
  putCanary();
  if (MODE === 'match') setMatch(true);   // (the test page's `?mode=match`: the match's HUD from the welcome on — a solo look at it, never counted)
  restart();
  // (`?rivals=N` — the test page only: N bot rivals on the same seed, their towers through the same engine: THE MATCH's look with a full room)
  if (PAGE && MODE === 'match' && o.sim > 0) lazyImport(import('./matchsim.js'), './matchsim.js').then(M => { if (!gone) hook.sim = M.startSim(hook, Math.min(7, Math.floor(o.sim))); }).catch(() => {});
  raf = requestAnimationFrame(frame);
  return hook;
}
