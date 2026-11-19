// HIGH RISE — THE STAGE (S4A — docs/highrise.md "THE CARTRIDGE"): the game's screen — the run loop on the pure engine, the scene (night.js),
// the HUD, YOUR BEST, the flyers, the sounds — ONE module for THE TEST PAGE (/highrise-play — play.js: its door shut, nothing counts) AND
// THE CARTRIDGE (view.js — the console's frame, the proof written as you drop). It was play.js's own mount() until S4A; the page's pieces
// (the look switch, the SOUNDS list, the note, its own end card) are behind `o.page`. THE STAGE NEVER COUNTS ANYTHING ITSELF: it imports
// nothing from /api, the profile, Firebase or the store — what a run writes is handed in by the cartridge (`o.go` · `o.onFrame` · `o.onOver`).
// HIDING THE APP = NO PAUSE (the owner — JAYWALK's rule): the run is on the clock; back from a hidden tab THE FUSE has ended it (TOO SLOW).
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { TICK_MS, TICK_HZ, MODES, MODE_IDS, BEAT, FLOOR_TICKS_MAX, SEED_MAX, TIGHT } from './tuning.js';
import { createRun, stepTo, tap, isOver, resultOf } from './engine.js';
import { replay } from './replay.js';
import { endWords, tickOf, perfectsLine } from './logic.js';
import { createTower } from './tower.js';
import { BANDS, bandAt, skyTone } from './bands.js';
import { LOOKS, LOOK_LABEL, cleanLook, readLook, writeLook, guessLook, resolveLook, sunUpNow } from './look.js';
import { BEST_KEY, cleanBest, bestView, crossedBest, nextBest, tagY } from './best.js';
import { STREAK_EVERY } from './sounds.js';
import { nextFriend, crossedFriend, friendTag } from './lines.js';
import { FLY_FLOORS, flyPlan, flyDue, flyNeeds } from './flyplan.js';
import { createTiers } from '../kit/tiers.js';
import { createNight, KEEP } from './night.js';


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
/** the big number: each digit its own box (a little room between two — a 1 never runs into its neighbour) */
function setNum(node, n) {
  const s = String(n);
  if (node.dataset.n === s) return;
  node.dataset.n = s; node.setAttribute('aria-label', s);
  if (setNum.mark) setNum.mark('dom');
  node.replaceChildren(...[...s].map(d => h('span.hi-dg', { 'aria-hidden': 'true' }, d)));
}

/** START waits at most this long for every sound's decode (S4A — THE SOUND SYNC: no sound of a run takes the late path) */
const START_WAIT_MS = 600;

/**
 * createStage(app, o) → the stage's hook (null = no WebGL here: the stage says so itself)
 *   o.page      THE TEST PAGE's own pieces: the look switch, the SOUNDS list, the note, its own end card every run, the audio engine installed here
 *   o.seed · o.mode · o.look · o.from · o.fps · o.tier     the page's `?…` flags
 *   o.best      { read() → floor, write(n) } — YOUR BEST's store (the page: this phone's `hi:play:best`)
 *   o.hook      the name its checks find the hook under (`window[o.hook]`)
 *   THE CARTRIDGE (view.js) hands in what a run WRITES — the stage itself never counts anything:
 *   o.lookNow   () → 'day' | 'night' — the console's GAME LOOK, read LIVE (no switch of its own)
 *   o.go        () → Promise<{ seed, t0, taps? }> — GO: the proof node's first write → the seed picked from it + tick 0 on this page's clock
 *   o.onFrame   (now) — every live frame (the proof's chunks go up) · o.onOver (result) — the run just ended (the last chunk, then `e`)
 *   o.onEnd     (result) → { own, note } — the end card's moment: own = the stage's own card (an UNPROVEN run); else the console's podium
 *   o.onShow    () — back on screen (the clock is read again)
 *   o.friends   () → [{ n, v }] — YOUR TABLE's bests above you (THE NEXT FRIEND's pink tape)
 */
export function createStage(app, o = {}) {
  const PAGE = !!o.page, MODE = MODE_IDS.includes(o.mode) ? o.mode : 'solo', FIXED = String(o.seed || '').slice(0, SEED_MAX);
  const FROM = Math.max(0, Math.min(400, Math.floor(Number(o.from) || 0))), LOOK_Q = o.look === 'day' || o.look === 'night' ? o.look : null;
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
  const num = h('div.hi-num'), band = h('div.hi-band', BANDS[0].name), call = h('div.hi-call', { 'aria-live': 'polite' }), clock = h('div.hi-clock', '');
  const hud = h('div.hi-hud', num, band, clock, call);
  const tag = h('div.hi-tag', { hidden: true }, h('span', ''));
  const ftag = h('div.hi-tag.hi-ftag', { hidden: true }, h('span', ''));   // (S4A — THE NEXT FRIEND above you: the same flag in PINK)
  const startBest = h('div.hi-start-best', '');
  // THE LOOK SWITCH (S3): AUTO · DAY · NIGHT — three plain choices under the sign (neon-underline, never a pill), each on its own
  // press + lift (never the START tap); remembered on this phone. AUTO = the real sun (the site's own sun rule).
  let choice = o.lookNow ? o.lookNow() : LOOK_Q || readLook(), lookT = choice === 'auto' ? guessLook(new Date().getHours()) : choice, sunKnown = choice !== 'auto';
  const lookTabs = LOOKS.map(l => press(h('button.hi-tab.hi-look-b', { type: 'button', 'data-pick': l, 'aria-pressed': 'false' }, LOOK_LABEL[l]), () => pickLook(l)));
  const lookRow = h('div.hi-look', { role: 'group', 'aria-label': 'The look: auto, day or night' }, ...lookTabs);
  const start = h('div.hi-start', h('div.hi-sign', { 'aria-label': 'High Rise' }, h('span', 'HIGH'), h('span', 'RISE')),
    h('div.hi-start-go', 'TAP TO START'), h('div.hi-start-l', 'ONE TAP DROPS EACH SLAB'), startBest, PAGE ? lookRow : null);
  const endT = h('div.hi-end-t'), endN = h('div.hi-end-n'), endB = h('div.hi-end-band'), endL = h('div.hi-end-l'), endBest = h('div.hi-end-best'), check = h('div.hi-check');
  const end = h('div.hi-end', { hidden: true }, endT, h('div.hi-end-floor', h('span.hi-end-k', 'FLOOR'), endN), endB, endL, endBest, check);
  // THE END's FOOT (S2 FIX — END-SCREEN STANDARD A, the owner): ONE big SOLID glowing PLAY AGAIN bar in HIGH RISE's accent, a rounded
  // rectangle (never a pill), on its OWN press + lift. A tap ANYWHERE after RETRY_MS is still PLAY AGAIN — and the bar keeps the same
  // wait: it comes up where the thumb was dropping slabs, and a rhythm's next tap must not wipe the card unread.
  const againIco = h('span.hi-again-i', { 'aria-hidden': 'true' });
  againIco.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>';
  const again = press(h('button.hi-again', { type: 'button', hidden: true }, againIco, h('span.hi-again-t', 'PLAY AGAIN')), () => { const now = performance.now(); if (shown && card && now - overAt > RETRY_MS) { restart(); begin(now); } });
  const note = h('p.hi-note', FROM ? `TEST PAGE · FROM FLOOR ${FROM} · NOTHING COUNTS` : 'TEST PAGE · SOLO · NOTHING COUNTS YET');
  const fps = o.fps ? h('div.hi-fps', '') : null;
  // THE SOUNDS (sfx.js — the SHARED audio engine's SFX bus; unlocked by the first tap, never before) + THE SOUND AUDITION (the SOUNDS sheet)
  let snd = null, sheetOpen = false;
  const soundsBtn = press(h('button.hi-snd', { type: 'button' }, 'SOUNDS'), () => {
    if (sheetOpen) return;
    sheetOpen = true;
    lazyImport(import('./audition.js'), './audition.js').then(A => A.openAudition({ press, onClose: () => { sheetOpen = false; last = 0; } })).catch(() => { sheetOpen = false; });
  });
  // (the page installs the shared engine itself; in the console it is running long since — and the sounds are DECODED AHEAD there, never on the first drop)
  Promise.all([PAGE ? lazyImport(import('../../audio/engine.js'), '../../audio/engine.js') : null, lazyImport(import('./sfx.js'), './sfx.js')]).then(([E, S]) => { if (gone) return; if (E) E.installAudio(); S.fetchSounds(); Promise.resolve(S.decode()).catch(() => {}); snd = S; hook.sfx = S; }).catch(() => { /* silent: audio is polish */ });
  const stage = h('div.hi-stage', { 'data-look': lookT, 'data-sky': skyTone(lookT, 0) }, play, hud, tag, ftag, start, end, PAGE ? soundsBtn : null, PAGE ? note : null, fps, again);
  app.replaceChildren(stage);

  // ---- the view (the night look) + its quality tiers; a browser with no WebGL gets the stage + one line saying so
  const pin = o.tier === 0 || o.tier === 1 || o.tier === 2 ? o.tier : null;   // (`?tier=0|1|2` pins a quality tier — the pass's measure)
  const noGL = () => h('p.hi-nogl', 'This browser can’t draw the game here (it has no WebGL).');
  /** the view's stand-in while a lost context has not come back (the run goes on; nothing is drawn; the rebuild keeps trying) */
  // THE HITCH COUNTER's cause marks: WHEN the page last did a piece of one-off work (performance.now()) — a hitch is named after the
  // work done since the frame before it: plate (a backdrop uploaded) · compile (a program built, the tier stepped) · audio (a decode
  // landed, the limiter built) · dom (the HUD was written) · gc (none of those + the page's own frame code was quick: the pause was the
  // browser's — most often a collection) · unknown (the page's own frame code was slow, with no mark)
  const marks = { plate: 0, compile: 0, audio: 0, dom: 0 };
  const mark = k => { marks[k] = performance.now(); };
  setNum.mark = mark;
  const NO_VIEW = { el: null, adopt() {}, events() {}, fall() {}, draw() {}, setTier() {}, setBest() {}, setFriend() {}, setLook() {}, rest() {}, resize() {}, flyers: () => false, band() {}, need() {}, fly: () => false, flyReset() {}, flyHush() {}, flyInfo: () => ({ ready: false }), project: () => [0, -1], zoneTop: () => 1, top: () => ({ x0: 0, x1: 0, z0: 0, z1: 0, floor: -1 }), info: () => ({ down: true }), destroy() {} };
  let view, glDown = null;
  try { view = createNight(play, { tier: pin == null ? 2 : pin, mark, look: lookT }); }
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
    try { view = createNight(play, { tier: tiers.get(), mark, look: lookT }); }
    catch {
      view = NO_VIEW; hook.view = view;
      if (!glDown) { glDown = noGL(); stage.append(glDown); }
      if (++tries <= 8) lostTimer = setTimeout(rebuild, 1500);
      return;
    }
    if (glDown) { glDown.remove(); glDown = null; }
    tries = 0;
    view.adopt(run, T, false); view.setBest(tapeFloor); view.setFriend(friendTape); if (shown) view.rest();
    if (FlyMod) { view.flyers(FlyMod); wanted.clear(); needFloor = -1; }   // (the flyers' stage is the new scene's: their models are asked for again)
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
  let stageH = 0, hudFoot = 0;
  function sized() { stageH = stage.clientHeight; hudFoot = hud.offsetTop + hud.offsetHeight; }
  const ro = new ResizeObserver(sized); ro.observe(stage); ro.observe(hud);
  sized();

  // ---- the run: the pure engine on this tab's clock. Tick 0 = the START touch; the RULES never read the clock — the page turns it into ticks.
  let seed = '', run = null, T = null, taps = [], t0 = null, shown = false, card = false, overAt = 0, endedAt = 0;
  let best = readBest(), tapeFloor = 0, newBest = false, bandNow = 0, notch = 0;   // (tapeFloor: the floor YOUR BEST's gold tape lies on — its own number: the end card moves `best` on)
  const ev = [], liveEv = [], frames = [];
  // THE FLYERS (S3 — flyplan.js says WHEN + WHICH from the seed; flyers.js, a LAZY module, flies them — it is fetched from floor 20,
  // each model + its sounds well before its own floor: night.js uploads them in an ordinary frame, never in the moment)
  let plan = flyPlan(''), FlyMod = null, flyAsk = false, needFloor = -1;
  const flown = { jet: false, ufo: false, ship: false }, wanted = new Set();
  const loadFly = () => (FlyMod ? Promise.resolve(FlyMod) : lazyImport(import('./flyers.js'), './flyers.js').then(M => { FlyMod = M; view.flyers(M); needFloor = -1; return M; }));
  function flyCheck() {
    view.band(stageH ? hudFoot / stageH : 0.2);
    if (run.floor < FLY_FLOORS.loadJet) return;
    if (!FlyMod) { if (!flyAsk) { flyAsk = true; loadFly().catch(() => { flyAsk = false; }); } return; }
    for (const k of flyNeeds(plan, run.floor)) if (!wanted.has(k)) { wanted.add(k); view.need(k); }
  }
  const hooks = { onPerfect() { /* (the view reads the events itself) */ }, onFall: (r, floor, dx, dz, whole) => view.fall(r, floor, dx, dz, whole) };
  function restart(s = FIXED || newSeed()) {
    seed = s; run = createRun({ seed, mode: MODE }); taps = []; t0 = null; shown = false; card = false; overAt = 0; endedAt = 0; ev.length = 0; liveEv.length = 0; sounded = 0; hush = false; starting = false; startN++; stage.classList.remove('is-starting');
    T = createTower(run, hooks, KEEP);
    best = Math.max(best, readBest()); tapeFloor = 0; newBest = false; bandNow = 0; notch = 0;   // (max: a phone whose storage is blocked still keeps its best for the visit)
    plan = flyPlan(seed); flown.jet = flown.ufo = flown.ship = false; wanted.clear(); needFloor = -1;
    view.adopt(run, T); view.setBest(0); view.setFriend(0); friendTape = 0; ftagF = null; ftagFloor = -1; ftag.hidden = true; view.flyReset();
    end.hidden = true; again.hidden = true; start.hidden = false; soundsBtn.hidden = false; note.hidden = false;
    stage.classList.remove('is-live', 'is-over', 'is-gold', 'is-made');
    startBest.textContent = best ? `YOUR BEST ${best}${PAGE ? ' · THIS PHONE' : ''}` : '';
    hudFloor = -1; hudLeft = -2; hitchN = 0; hitchLast = ''; callUntil = 0; callPri = 0; later = null; if (callAnim) { callAnim.cancel(); callAnim = null; } call.className = 'hi-call'; call.textContent = '';
    band.textContent = BANDS[0].name; setNum(num, 0); tagFloor = -1; tagAt = -1e9; tag.hidden = true;
  }
  // (while a run is LIVE the SOUNDS button + the note are off the screen: a thumb anywhere is a DROP, never a menu)
  const live = ts => { t0 = ts; start.hidden = true; soundsBtn.hidden = true; note.hidden = true; stage.classList.add('is-live'); awakeAt = performance.now(); awake(true); if (FROM) climbBy(FROM, null); };
  // THE START (S4A). THE PAGE: tick 0 = the START touch — but START waits a moment (≤ START_WAIT_MS) until EVERY sound is decoded: no
  // sound of a run ever takes the late path (THE SOUND SYNC; a first-ever tap is also the audio's unlock). THE CARTRIDGE: tick 0 = GO —
  // `o.go()` writes the proof node's first value (the SERVER's time), reads it back and hands in the seed picked from it + that moment
  // on this page's clock (+ the taps so far: a rejoin).
  let starting = false, startN = 0;
  function begin(ts) {
    if (starting) return;
    const ready = !snd || !snd.ready || snd.ready();
    if (ready && !o.go) { live(ts); return; }
    starting = true; stage.classList.add('is-starting');
    const m = startN;
    const on = G => { if (gone || m !== startN) return; starting = false; stage.classList.remove('is-starting'); if (G) adopt(G); else live(ready ? ts : performance.now()); };
    Promise.all([ready ? null : snd.whenReady(START_WAIT_MS), o.go ? o.go() : null]).then(r => on(r[1]), () => on(null));
  }
  /** a run handed in whole (the cartridge): its seed, tick 0 on this page's clock, the taps so far (a rejoin — played at once, unheard) */
  function adopt(G) {
    restart(G.seed);
    for (const tk of G.taps || []) { if (isOver(run) || !tap(run, tk, ev)) break; taps.push(tk); }
    hush = taps.length > 0;
    live(G.t0);
  }
  // THE SOUND SYNC (S4A): a batch's sounds are asked the moment its events exist — a tap's own IN THE TOUCH, never a frame later.
  // `sounded` = how many of `ev` already have theirs (the frame sounds the rest: the fuse's drop). `syncs` = the pass's measure: when
  // each landing's sound was asked (tests/integration/sound-sync.mjs sets it against the audio engine's own starts)
  let sounded = 0, hush = false;
  const syncs = [];
  function soundNow(late) {
    if (sounded >= ev.length) return;
    const fresh = sounded ? ev.slice(sounded) : ev;
    sounded = ev.length;
    if (!snd) return;
    if (!late) { const at = performance.now(); for (const e of fresh) if (e.e === 'land' || e.e === 'perfect' || e.e === 'cut') { if (syncs.length >= 400) syncs.shift(); syncs.push({ e: e.e, at }); } }
    snd.playCues(snd.cuesOf(fresh, late));
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
    if (shown && !card) return;   // (the cartridge: the console's podium is on its way — never a restart under it)
    if (shown) { if (now - overAt > RETRY_MS) { restart(); begin(ts); } return; }   // TAP TO PLAY AGAIN = the next run's START
    if (t0 == null) { begin(ts); return; }
    if (isOver(run)) return;
    const tk = tickOf(ts, t0);
    if (tap(run, tk, ev)) taps.push(tk);   // (false = a landing beat: not a drop, never logged)
    soundNow(false);   // (S4A — THE SOUND SYNC: the drop's sounds at the TOUCH)
  }
  play.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; touch(e.timeStamp); });
  play.addEventListener('touchmove', e => e.preventDefault(), { passive: false });   // (no page scroll under a finger)
  // (in the console a key is a drop only while nothing else has the focus — its menus + the podium keep their own keys)
  const keyOk = () => PAGE || (!(shown && !card) && (!document.activeElement || document.activeElement === document.body || stage.contains(document.activeElement)));
  document.addEventListener('keydown', e => { if (sheetOpen || !keyOk()) return; if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); touch(e.timeStamp); } }, sig);   // (the sheet's own buttons keep their keys)

  // ---- THE ANNOUNCER LANE (under the band's name): one call at a time — a bigger moment is never wiped by a smaller one
  // Its one-shot (and the band's arrival) are played through the Web Animations API — opacity + transform only, restarted WITHOUT a
  // forced layout (the review: `void el.offsetWidth` here was a layout read inside the frame, on every perfect).
  const calm = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  const POP = calm ? [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.86 }, { opacity: 0 }]
    : [{ opacity: 0, transform: 'translateY(8px) scale(0.86)' }, { opacity: 1, transform: 'scale(1.06)', offset: 0.1 }, { opacity: 1, transform: 'none', offset: 0.2 }, { opacity: 1, transform: 'none', offset: 0.82 }, { opacity: 0, transform: 'translateY(-4px)' }];
  const SWELL = [{ transform: 'scale(1)', opacity: 0.4 }, { transform: 'scale(1.32)', opacity: 1, offset: 0.14 }, { transform: 'scale(1.32)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }];
  let callUntil = 0, callPri = 0, callAnim = null, later = null;
  /** → true = it is on the lane (false: a bigger call holds it) */
  function say(text, cls, pri, ms, now) {
    if (now < callUntil && pri < callPri) return false;
    callUntil = now + ms; callPri = pri; mark('dom');
    call.textContent = text; call.className = `hi-call ${cls}`;
    if (callAnim) callAnim.cancel();
    if (call.animate) callAnim = call.animate(POP, { duration: ms, fill: 'both' }); else call.style.opacity = '1';
    return true;
  }
  /** this frame's events → the HUD's calls + YOUR BEST's crossing + the band's arrival; → the extra sound cues the view's moments make */
  function moments(evs, now, late) {
    const cues = [];
    for (const e of evs) {
      if (e.e === 'perfect') {
        if (e.streak > 0 && e.streak % STREAK_EVERY === 0) say(`STREAK ×${e.streak}`, 'is-streak', 3, 1500, now);
        else say(e.streak > 1 ? `PERFECT ×${e.streak}` : 'PERFECT', 'is-perfect', 1, 700, now);
      } else if (e.e === 'made') {
        // THE FINISH (a match's floor 200): the white-gold light pours onto the top slab — then the gold end card
        view.fly('pour');
      } else if (e.e === 'land') {
        if (crossedBest(best, e.floor)) {
          tapeFloor = best; newBest = true; view.setBest(tapeFloor, true); stage.classList.add('is-gold');
          say('NEW BEST', 'is-gold', 5, 1900, now); if (!late) cues.push({ id: 'streak', rate: 1.12 });
        }
        // THE NEXT FRIEND crossed (S4A — YOUR TABLE's bests; solo only): the thin PINK tape lies on the tower at their floor, PASSED LIAM
        // in the lane — and the next friend above takes the tag
        if (o.friends && MODE === 'solo') { const f = crossedFriend(o.friends(), e.floor); if (f) { friendTape = f.v; view.setFriend(f.v, !late); if (!late) { say(`PASSED ${f.n}`, 'is-pink', 4, 1700, now); cues.push({ id: 'streak', rate: 1.06 }); } } }
        const b = bandAt(e.floor);
        // A BAND's ARRIVAL: its name (under the number) lights up — never said twice in the lane below
        if (b > bandNow) { bandNow = b; mark('dom'); band.textContent = BANDS[b].name; if (!calm && band.animate) band.animate(SWELL, { duration: 1700 }); if (!late) cues.push({ id: 'band-arrival' }); }
        // THE FLYERS: the seed's flyby (35–45) · the UFO (85) · floor 200 — SOLO flies past THE MOTHERSHIP (a moment, then on into deep space)
        const due = flyDue(plan, e.floor, flown);
        if (due) {
          flown[due.split('-')[0]] = true;
          if (due === 'jet') view.fly(plan.jet, plan.jetDir);
          else if (due === 'ufo') view.fly('ufo', plan.ufoDir);
          else if (due === 'ship' && MODE === 'solo') { view.fly('pass'); say('THE MOTHERSHIP', 'is-gold', 6, 2600, now); if (!late) cues.push({ id: 'band-arrival' }); }
        }
        // SOLO PAST 200: every notch of the tightening is called — a FASTER that lands under a bigger call (a streak, NEW BEST) waits its turn
        if (e.floor > TIGHT.from) { const k = Math.floor((e.floor + 1 - TIGHT.from) / TIGHT.every); if (k > notch) { notch = k; if (!say('FASTER', 'is-fast', 2, 1100, now)) later = ['FASTER', 'is-fast', 2, 1100]; } }
      }
    }
    return cues;
  }

  function showEnd(now) {
    shown = true; overAt = now; awake(false);   // (THE SOUND SYNC: the hold ends with the run — the context naps again on the end card)
    const live = resultOf(run), b = bandAt(live.floor), was = best;
    // THE CARTRIDGE: the console's podium IS the end screen — the stage's own card only for a run that can't reach it (UNPROVEN)
    const E = o.onEnd ? o.onEnd(live) : null;
    card = !E || !!E.own;
    best = FROM ? was : nextBest(was, live.floor);   // (a `?floor=N` look check is not a run: YOUR BEST stays)
    if (best > was) writeBest(best);
    endT.textContent = endWords(live);
    setNum(endN, live.floor);
    endB.textContent = BANDS[b].name;
    endL.textContent = `${perfectsLine(live.perfects)} · BEST STREAK ${live.maxStreak}`;
    endBest.textContent = !best ? '' : !was ? `YOUR BEST ${best}` : best > was ? `NEW BEST · WAS ${was}` : `YOUR BEST ${best}`;   // (a first run that never landed a slab has no best to show)
    endBest.classList.toggle('is-new', best > was && was > 0);
    stage.classList.toggle('is-made', live.made);
    // THE DETERMINISM CHECK (the owner's, on a real iPhone): the recorded tap log replayed through a FRESH engine — the judge's own code
    const { used, bad, why, ...r } = replay({ seed, mode: MODE, taps });
    let same = bad < 0 && used === taps.length && JSON.stringify(r) === JSON.stringify(live), at = -1;
    const fresh = createRun({ seed, mode: MODE }), evR = [];
    for (const t of taps) tap(fresh, t, evR);
    stepTo(fresh, (taps.length ? taps[taps.length - 1] : 0) + BEAT + FLOOR_TICKS_MAX, evR);
    for (let i = 0; i < Math.max(evR.length, liveEv.length); i++) {
      if (JSON.stringify(evR[i]) !== JSON.stringify(liveEv[i])) { same = false; at = Math.min(evR[i] ? evR[i].t : Infinity, liveEv[i] ? liveEv[i].t : Infinity); break; }
    }
    check.className = `hi-check ${same ? 'is-ok' : 'is-bad'}`;
    if (E && E.note) { check.className = 'hi-check is-note'; check.textContent = E.note; } else
    check.textContent = same ? 'REPLAY = LIVE ✓' : `REPLAY ≠ LIVE ✗ · first differs at tick ${at < 0 || at === Infinity ? '?' : at} · live ${live.floor} ${live.cause} · replay ${r.floor} ${r.cause}${why ? ` (${why})` : ''}`;
    end.hidden = !card; again.hidden = !card; soundsBtn.hidden = false; note.hidden = false; tag.hidden = true; tagFloor = -1; ftag.hidden = true; ftagF = null;
    stage.classList.remove('is-live'); if (card) stage.classList.add('is-over');
    view.rest();   // (the first band's plate comes back while the card is up: PLAY AGAIN never starts on a blank sky)
    view.flyHush();   // (… and a flyer still in the sky fades out: never behind the card's words)
    hook.ends.push({ seed, mode: MODE, same, at, live, replay: r, taps: taps.slice(), best, was }); if (hook.ends.length > 50) hook.ends.shift();
  }

  let raf = 0, last = 0, hudFloor = -1, hudLeft = -2, tagFloor = -1, tagAt = -1e9, ftagF = null, ftagFloor = -1, ftagAt = -1e9, friendTape = 0, frameN = 0, lookSeen = lookT, toneSeen = skyTone(lookT, 0);
  // THE HITCH COUNTER: frames over HITCH_MS in this run (after its first second; a tab that was away is not a hitch) + the last one's cause
  let hitchN = 0, hitchAll = 0, hitchLast = '', prevAt = 0, prevWork = 0, usual = TICK_MS;   // (usual: the phone's own frame, eased)
  const hitchList = [];
  function hitch(gap) {
    const since = prevAt - 2;
    if (snd && snd.lastWork) { const a = snd.lastWork(); if (a > marks.audio) marks.audio = a; }
    const why = marks.plate >= since ? 'plate' : marks.compile >= since ? 'compile' : marks.audio >= since ? 'audio' : marks.dom >= since ? 'dom' : prevWork > 12 ? 'unknown' : 'gc';
    hitchN++; hitchAll++; hitchLast = `${why} ${gap.toFixed(0)} ms @${run.floor}`;
    if (hitchList.length < 200) hitchList.push({ why, gap: Math.round(gap), floor: run.floor, work: Math.round(prevWork) });
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (o.lookNow) { const l = o.lookNow(); if (l !== lookT) setLook(l); }   // (the console's GAME LOOK, read LIVE)
    const w0 = performance.now(), gap = last ? now - last : TICK_MS, dt = Math.min(250, gap);
    if (last && gap > HITCH_MS && gap > usual * HITCH_X && gap < LATE_MS && prevAt && t0 != null && now - t0 > 1000 && !shown && !isOver(run)) hitch(gap);
    if (last && prevAt) usual += (Math.min(gap, 100) - usual) * 0.05;
    last = now;
    if (document.visibilityState === 'hidden' || sheetOpen) { prevAt = 0; return; }
    let tau = 0;
    if (t0 != null) {
      tau = Math.max(0, (now - t0) / TICK_MS);
      if (!isOver(run)) {
        const tk = Math.floor(tau), cap = MODES[MODE].capTicks;
        stepTo(run, cap != null && tk >= cap && tk < cap + CAP_GRACE ? cap - 1 : tk, ev);
      }
    }
    if (ev.length) {
      const late = gap > LATE_MS || hush;
      T.feed(ev); view.events(ev);
      const more = moments(ev, now, late);
      soundNow(late); if (snd && more.length) snd.playCues(more);
      if (liveEv.length < 400000) liveEv.push(...ev);
      ev.length = 0; sounded = 0; hush = false;
    }
    if (t0 != null && !shown && now - awakeAt > 1000) { awakeAt = now; awake(true); }   // (THE SOUND SYNC: the lease, renewed while the run is live)
    if (t0 != null && o.onFrame) o.onFrame(now);
    if (isOver(run) && !endedAt && o.onOver) o.onOver(resultOf(run));
    if (isOver(run) && !endedAt) endedAt = now;   // (the end's own frame — whether THE FUSE ended it in this frame or a TAP did in the touch handler: the review — a miss used to bring the card at once, over the falling slab)
    if (isOver(run) && !shown && now - endedAt >= (run.st === 'made' ? MADE_HOLD_MS : END_HOLD_MS)) showEnd(now);
    view.draw(run, isOver(run) ? run.end : tau, dt);
    // ---- the HUD: written only when it changes (two numbers compared — no text is built in a frame that changes nothing)
    const cap = MODES[MODE].capTicks, left = cap == null ? -1 : Math.max(0, Math.ceil((cap - (isOver(run) ? run.end : Math.floor(tau))) / TICK_HZ));
    if (run.floor !== hudFloor || left !== hudLeft) {
      hudFloor = run.floor; hudLeft = left;
      setNum(num, run.floor);
      const b = bandAt(run.floor); if (band.textContent !== BANDS[b].name) band.textContent = BANDS[b].name;
      const text = cap == null ? '' : clockText(left * TICK_HZ);
      if (clock.textContent !== text) clock.textContent = text;
    }
    if (run.floor !== needFloor) { needFloor = run.floor; flyCheck(); }
    // the page's words follow the picture: the look on screen + the sky's tone at this height (compared, written only at a change)
    const lk = view.lookNow ? view.lookNow() : lookT, tone = skyTone(lk, run.floor);
    if (lk !== lookSeen || tone !== toneSeen) { lookSeen = lk; toneSeen = tone; mark('dom'); stage.dataset.look = lk; stage.dataset.sky = tone; }
    // YOUR BEST while it is ABOVE you: the right-edge tag at its own height — held clear of the HUD and of THE DROP ZONE
    if (t0 != null && !shown && !isOver(run) && best > 0 && run.floor <= best) {
      if (tagFloor !== run.floor) { tagFloor = run.floor; tag.firstChild.textContent = bestView(best, run.floor).tag; tag.hidden = false; tagAt = -1e9; }
      // (its height is clamped to 100 floors up: a best far above is BEHIND the diagonal camera — projected, it came back mirrored and the tag jumped to the foot of its column: the review)
      const tp = T.top(), y = tagY(view.project((tp.x0 + tp.x1) / 2, Math.min(best, run.floor + 100), (tp.z0 + tp.z1) / 2)[1] * stageH, hudFoot, view.zoneTop() * stageH);
      if (Math.abs(y - tagAt) >= 0.25) { tagAt = y; tag.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`; }   // (a tag that did not move is not written)
    } else if (tagFloor >= 0) { tagFloor = -1; tag.hidden = true; }
    // THE NEXT FRIEND while they are ABOVE you (S4A): the same flag in PINK at their floor's own height — held clear of the HUD, of THE
    // DROP ZONE and of the gold tag (a step above / below it); one friend at a time; solo only
    const fr = o.friends && MODE === 'solo' && t0 != null && !shown && !isOver(run) ? nextFriend(o.friends(), run.floor) : null;
    if (fr) {
      if (fr !== ftagF || run.floor !== ftagFloor) { ftagF = fr; ftagFloor = run.floor; mark('dom'); ftag.firstChild.textContent = friendTag(fr, run.floor); ftag.hidden = false; ftagAt = -1e9; }
      const tp = T.top(), zone = view.zoneTop() * stageH;
      let y = tagY(view.project((tp.x0 + tp.x1) / 2, Math.min(fr.v, run.floor + 100), (tp.z0 + tp.z1) / 2)[1] * stageH, hudFoot, zone);
      if (tagFloor >= 0 && Math.abs(y - tagAt) < 30) { const up = fr.v >= best; y = tagY(tagAt + (up ? -30 : 30), hudFoot, zone); if (Math.abs(y - tagAt) < 30) y = tagY(tagAt + (up ? 30 : -30), hudFoot, zone); }
      if (Math.abs(y - ftagAt) >= 0.25) { ftagAt = y; ftag.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`; }
    } else if (ftagF) { ftagF = null; ftagFloor = -1; ftag.hidden = true; }
    if (callUntil && now > callUntil) { callUntil = 0; callPri = 0; call.className = 'hi-call'; call.style.opacity = ''; if (later) { const l = later; later = null; say(l[0], l[1], l[2], l[3], now); } }
    frameN++;
    if (frames.length < 20000) frames.push(gap); else frames[frameN % 20000] = gap;
    // (the tier rule is asked six times a second, not sixty: each asking sorts its 120 samples three times — garbage, every frame)
    prevWork = performance.now() - w0; prevAt = w0;
    tiers.sample(now, prevWork); if (pin == null && frameN % 10 === 0) tiers.tick(now);
    if (fps && frameN % 30 === 0) { const l = frames.slice(-120), avg = l.reduce((a, b) => a + b, 0) / l.length, i = view.info(); fps.textContent = `${(1000 / avg).toFixed(0)} fps · ${avg.toFixed(1)} ms · worst ${Math.max(...l).toFixed(0)} · tier ${i.tier}${i.bloom ? ' bloom' : ''} · ${i.calls} calls · ${i.tris} tris · ${i.w}×${i.h} @${i.dpr} · tick ${run.t} · HITCH ${hitchN}${hitchLast ? ` (last: ${hitchLast})` : ''}`; }
  }
  document.addEventListener('visibilitychange', () => { tiers.reset(); if (document.visibilityState === 'hidden') awake(false); else if (o.onShow) o.onShow(); if (glDown && document.visibilityState === 'visible') { tries = 0; rebuild(); } }, sig);

  // (the pass's own checks — tests/integration/highrise-play.mjs)
  const hook = {
    ends: [], view, sfx: null, el: stage,
    state: () => ({ mode: MODE, seed, look: lookT, choice, sky: stage.dataset.sky, started: t0 != null, starting, shown, card, lates: snd && snd.lates ? snd.lates() : 0, over: isOver(run), st: run.st, t: run.t, floor: run.floor, streak: run.streak, perfects: run.perfects, s0: run.s0, S: run.S, taps: taps.length, best, tapeOn: tapeFloor > 0, newBest, band: bandNow, words: endT.textContent, check: check.textContent, call: call.textContent, tag: tag.hidden ? '' : tag.textContent, ftag: ftag.hidden ? '' : ftag.textContent, friendTape, top: { x0: run.x0, x1: run.x1, z0: run.z0, z1: run.z1, floor: run.floor }, viewTop: view.top(), tier: tiers.get(), tierPath: tierPath.slice(), rebuilds, sheet: sheetOpen, info: view.info() }),
    /** ms until the sliding slab is next dead on the tower — on its way out, or on its way back (null = no slab / its last pass is gone) */
    msToPerfect() {
      if (t0 == null || run.st !== 'slide') return null;
      const now = performance.now(), a = t0 + (run.s0 + run.S / 2) * TICK_MS - now, b = a + run.S * TICK_MS;
      return a > -8 ? a : b > -8 ? b : null;
    },
    restart: s => restart(s),
    /** THE FLYERS: the seed's plan · a moment NOW ('blackbird' | 'f22' | 'ufo' | 'ship' = THE MOTHERSHIP fully down | 'pass' | 'pour' — the
     *  pass's look check: its module + model are fetched first) → a promise of true = it flies */
    plan: () => ({ ...plan, flown: { ...flown } }), flyInfo: () => view.flyInfo(),
    fly(kind, dir = 1) {
      const model = kind === 'ship' || kind === 'pass' || kind === 'pour' ? 'mothership' : kind;
      return loadFly().then(() => { view.band(stageH ? hudFoot / stageH : 0.2); view.need(model); return new Promise(res => { let n = 0; (function wait() { const i = view.flyInfo(); if ((i.models || []).includes(model)) return setTimeout(() => res(view.fly(kind, dir)), 120); if (++n > 120) return res(false); setTimeout(wait, 50); })(); }); });
    },
    /** THE LOOK SWITCH: the choice ('auto' | 'day' | 'night') as the start screen's buttons make it · the look itself (the pass's check: a switch mid-run) */
    pickLook: l => pickLook(l), setLook: (l, now) => setLook(l, now), look: () => ({ choice, look: lookT, sunKnown }),
    frames: () => frames.slice(),
    /** THE HITCH COUNTER: this run's count · every run's · the last one's words · each with its cause */
    hitches: () => ({ n: hitchN, all: hitchAll, last: hitchLast, list: hitchList.slice() }),
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
    taps: () => taps, result: () => resultOf(run), seed: () => seed,
    /** the stage's own end card after all (the podium never came: no signal) — with its one line */
    showCard(line) { if (!shown || card) return; card = true; overAt = performance.now(); end.hidden = false; again.hidden = false; stage.classList.add('is-over'); check.className = 'hi-check is-note'; check.textContent = line || ''; },
    /** the friends' bests changed (YOUR TABLE answered) */
    friends() { ftagF = null; ftagFloor = -1; },
    syncs: () => syncs.slice(),
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
  restart();
  raf = requestAnimationFrame(frame);
  return hook;
}
