// /highrise-play — HIGH RISE, THE TEST PAGE (S2 — docs/highrise.md "THE TEST PAGE"): the real game's NIGHT LOOK + SOLO, on the live site,
// on a phone. UNLISTED: open to anyone with the link, noindex nofollow, linked from nowhere.
// **NOTHING COUNTS UNTIL GO-LIVE** (the owner, Nov 18): the run is the pure engine in this tab — no XP, no streak, no server best, no
// YOUR TABLE, no cards, no share card: ZERO server calls, ZERO database writes; nothing from /api, the profile, progression, the report,
// share or the cards. YOUR BEST = THIS PHONE only (`hi:play:best`). Its only requests: this page's own static files (its modules, the
// plates, the reflection map, the sounds), three.js from the page's import map, the fonts. tests/highrise-play.test.mjs +
// tests/integration/highrise-play.mjs prove it.
// HIDING THE APP = NO PAUSE (the owner — JAYWALK's rule): the run is on the clock; back from a hidden tab THE FUSE has ended it (TOO SLOW).
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { TICK_MS, TICK_HZ, MODES, MODE_IDS, BEAT, FLOOR_TICKS_MAX, SEED_MAX, TIGHT } from './tuning.js';
import { createRun, stepTo, tap, isOver, resultOf } from './engine.js';
import { replay } from './replay.js';
import { endWords, tickOf, perfectsLine } from './logic.js';
import { createTower } from './tower.js';
import { BANDS, bandAt } from './bands.js';
import { BEST_KEY, cleanBest, bestView, crossedBest, nextBest, tagY } from './best.js';
import { STREAK_EVERY } from './sounds.js';
import { createTiers } from '../kit/tiers.js';
import { createNight, KEEP } from './night.js';

const app = document.getElementById('app');
const Q = new URLSearchParams(location.search);
// (ZERO server calls: the shared audio engine reports a cut only from the owner's phone inside the app, or on a link that says &debug=1 —
//  the page drops that flag from its own address before the engine is ever installed)
if (Q.has('debug')) { try { Q.delete('debug'); history.replaceState(null, '', `${location.pathname}${Q.toString() ? `?${Q}` : ''}`); } catch { /* fine */ } }
// THE DOOR: NOTHING COUNTS — and nothing is even ASKED. A shared module may one day call the server from wherever it runs (today: the
// audio engine COUNTS a leave once, site-wide — one anonymous beacon to /api/log; the skew wrapper asks /api/time if a module fails to
// link): on THIS page every request to /api/ stops here, before it leaves the phone.
const toApi = u => { try { return new URL(String((u && u.url) || u), location.href).pathname.startsWith('/api/'); } catch { return false; } };
const pageFetch = window.fetch.bind(window), pageBeacon = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;
window.fetch = (u, o) => (toApi(u) ? Promise.reject(new TypeError('this page never calls the server')) : pageFetch(u, o));
if (pageBeacon) navigator.sendBeacon = (u, d) => (toApi(u) ? true : pageBeacon(u, d));

const newSeed = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); };
/** `?seed=` — the SAME slabs on every run (a random one without it) · `?mode=` — match / daily (their finish + cap; the page itself is SOLO) */
const FIXED = (Q.get('seed') || '').replace(/[^!-~]/g, '').slice(0, SEED_MAX);
const MODE = MODE_IDS.includes(Q.get('mode')) ? Q.get('mode') : 'solo';
/** the end's card comes this long after the run ended (the missed slab is seen falling) … */
const END_HOLD_MS = 700;
/** … and stays this long before a tap is PLAY AGAIN (a rhythm's next tap must not wipe it unread) */
const RETRY_MS = 600;
/** a tap just before THE CAP is still the player's: the cap is shown this many ticks late (a touch may reach the page after its frame) */
const CAP_GRACE = 6;
/** a frame that comes this long after the last one = the tab was away: its batch of events is LATE (only the OUT sounds — sounds.js#cuesOf) */
const LATE_MS = 900;
/** THE HITCH COUNTER (S2 FIX — THE LAG HUNT; `?fps=1` shows it): a frame that took longer than this, in a live run, after its first second */
const HITCH_MS = 33;
const clockText = ticks => { const s = Math.max(0, Math.ceil(ticks / TICK_HZ)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const readBest = () => { try { return cleanBest(localStorage.getItem(BEST_KEY)); } catch { return 0; } };
const writeBest = n => { try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* a private window forgets: fine */ } };

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

function mount() {
  // ---- the page: the play area (the canvas), the HUD over it
  const play = h('div.hi-play', { role: 'application', 'aria-label': 'High Rise — tap to drop the slab' });
  const num = h('div.hi-num'), band = h('div.hi-band', BANDS[0].name), call = h('div.hi-call', { 'aria-live': 'polite' }), clock = h('div.hi-clock', '');
  const hud = h('div.hi-hud', num, band, clock, call);
  const tag = h('div.hi-tag', { hidden: true }, h('span', ''));
  const startBest = h('div.hi-start-best', '');
  const start = h('div.hi-start', h('div.hi-sign', { 'aria-label': 'High Rise' }, h('span', 'HIGH'), h('span', 'RISE')),
    h('div.hi-start-go', 'TAP TO START'), h('div.hi-start-l', 'ONE TAP DROPS EACH SLAB'), startBest);
  const endT = h('div.hi-end-t'), endN = h('div.hi-end-n'), endB = h('div.hi-end-band'), endL = h('div.hi-end-l'), endBest = h('div.hi-end-best'), check = h('div.hi-check');
  const end = h('div.hi-end', { hidden: true }, endT, h('div.hi-end-floor', h('span.hi-end-k', 'FLOOR'), endN), endB, endL, endBest, check);
  // THE END's FOOT (S2 FIX — END-SCREEN STANDARD A, the owner): ONE big SOLID glowing PLAY AGAIN bar in HIGH RISE's accent, a rounded
  // rectangle (never a pill), on its OWN press + lift. A tap ANYWHERE after RETRY_MS is still PLAY AGAIN — and the bar keeps the same
  // wait: it comes up where the thumb was dropping slabs, and a rhythm's next tap must not wipe the card unread.
  const againIco = h('span.hi-again-i', { 'aria-hidden': 'true' });
  againIco.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>';
  const again = press(h('button.hi-again', { type: 'button', hidden: true }, againIco, h('span.hi-again-t', 'PLAY AGAIN')), () => { const now = performance.now(); if (shown && now - overAt > RETRY_MS) { restart(); begin(now); } });
  const note = h('p.hi-note', 'TEST PAGE · SOLO · NOTHING COUNTS YET');
  const fps = Q.get('fps') === '1' ? h('div.hi-fps', '') : null;
  // THE SOUNDS (sfx.js — the SHARED audio engine's SFX bus; unlocked by the first tap, never before) + THE SOUND AUDITION (the SOUNDS sheet)
  let snd = null, sheetOpen = false;
  const soundsBtn = press(h('button.hi-snd', { type: 'button' }, 'SOUNDS'), () => {
    if (sheetOpen) return;
    sheetOpen = true;
    lazyImport(import('./audition.js'), './audition.js').then(A => A.openAudition({ press, onClose: () => { sheetOpen = false; last = 0; } })).catch(() => { sheetOpen = false; });
  });
  Promise.all([lazyImport(import('../../audio/engine.js'), '../../audio/engine.js'), lazyImport(import('./sfx.js'), './sfx.js')]).then(([E, S]) => { E.installAudio(); S.fetchSounds(); snd = S; hook.sfx = S; }).catch(() => { /* silent: audio is polish */ });
  const stage = h('div.hi-stage', { 'data-look': 'night' }, play, hud, tag, start, end, soundsBtn, note, fps, again);
  app.replaceChildren(stage);

  // ---- the view (the night look) + its quality tiers; a browser with no WebGL gets the stage + one line saying so
  const pin = /^[012]$/.test(Q.get('tier') || '') ? Number(Q.get('tier')) : null;   // (`?tier=0|1|2` pins a quality tier — the pass's measure)
  const noGL = () => h('p.hi-nogl', 'This browser can’t draw the game here (it has no WebGL).');
  /** the view's stand-in while a lost context has not come back (the run goes on; nothing is drawn; the rebuild keeps trying) */
  // THE HITCH COUNTER's cause marks: WHEN the page last did a piece of one-off work (performance.now()) — a hitch is named after the
  // work done since the frame before it: plate (a backdrop uploaded) · compile (a program built, the tier stepped) · audio (a decode
  // landed, the limiter built) · dom (the HUD was written) · gc (none of those + the page's own frame code was quick: the pause was the
  // browser's — most often a collection) · unknown (the page's own frame code was slow, with no mark)
  const marks = { plate: 0, compile: 0, audio: 0, dom: 0 };
  const mark = k => { marks[k] = performance.now(); };
  setNum.mark = mark;
  const NO_VIEW = { el: null, adopt() {}, events() {}, fall() {}, draw() {}, setTier() {}, setBest() {}, rest() {}, resize() {}, project: () => [0, -1], zoneTop: () => 1, top: () => ({ x0: 0, x1: 0, z0: 0, z1: 0, floor: -1 }), info: () => ({ down: true }), destroy() {} };
  let view, glDown = null;
  try { view = createNight(play, { tier: pin == null ? 2 : pin, mark }); }
  catch { stage.append(noGL()); return; }
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
    try { view = createNight(play, { tier: tiers.get(), mark }); }
    catch {
      view = NO_VIEW; hook.view = view;
      if (!glDown) { glDown = noGL(); stage.append(glDown); }
      if (++tries <= 8) lostTimer = setTimeout(rebuild, 1500);
      return;
    }
    if (glDown) { glDown.remove(); glDown = null; }
    tries = 0;
    view.adopt(run, T, false); view.setBest(tapeFloor); if (shown) view.rest();
    hook.view = view; rebuilds++; last = 0; sized();
    watchGL();
  }
  watchGL();

  // ---- the sizes the HUD needs (a ResizeObserver's — never a layout read in the frame)
  let stageH = 0, hudFoot = 0;
  function sized() { stageH = stage.clientHeight; hudFoot = hud.offsetTop + hud.offsetHeight; }
  new ResizeObserver(sized).observe(stage); new ResizeObserver(sized).observe(hud);
  sized();

  // ---- the run: the pure engine on this tab's clock. Tick 0 = the START touch; the RULES never read the clock — the page turns it into ticks.
  let seed = '', run = null, T = null, taps = [], t0 = null, shown = false, overAt = 0, endedAt = 0;
  let best = readBest(), tapeFloor = 0, newBest = false, bandNow = 0, notch = 0;   // (tapeFloor: the floor YOUR BEST's gold tape lies on — its own number: the end card moves `best` on)
  const ev = [], liveEv = [], frames = [];
  const hooks = { onPerfect() { /* (the view reads the events itself) */ }, onFall: (r, floor, dx, dz, whole) => view.fall(r, floor, dx, dz, whole) };
  function restart(s = FIXED || newSeed()) {
    seed = s; run = createRun({ seed, mode: MODE }); taps = []; t0 = null; shown = false; overAt = 0; endedAt = 0; ev.length = 0; liveEv.length = 0;
    T = createTower(run, hooks, KEEP);
    best = Math.max(best, readBest()); tapeFloor = 0; newBest = false; bandNow = 0; notch = 0;   // (max: a phone whose storage is blocked still keeps its best for the visit)
    view.adopt(run, T); view.setBest(0);
    end.hidden = true; again.hidden = true; start.hidden = false; soundsBtn.hidden = false; note.hidden = false;
    stage.classList.remove('is-live', 'is-over', 'is-gold', 'is-made');
    startBest.textContent = best ? `YOUR BEST ${best} · THIS PHONE` : '';
    hudFloor = -1; hudLeft = -2; hitchN = 0; hitchLast = ''; callUntil = 0; callPri = 0; later = null; if (callAnim) { callAnim.cancel(); callAnim = null; } call.className = 'hi-call'; call.textContent = '';
    band.textContent = BANDS[0].name; setNum(num, 0); tagFloor = -1; tagAt = -1e9; tag.hidden = true;
  }
  // (while a run is LIVE the SOUNDS button + the note are off the screen: a thumb anywhere is a DROP, never a menu)
  const begin = ts => { t0 = ts; start.hidden = true; soundsBtn.hidden = true; note.hidden = true; stage.classList.add('is-live'); };

  // FAIR TAPS: a tap counts at the finger's TOUCH — the pointerdown's own event.timeStamp → its tick — never "the next frame"
  function touch(ts) {
    if (sheetOpen) return;
    const now = performance.now();
    if (!(ts > 0 && ts <= now + 4 && now - ts < 1000)) ts = now;   // (a browser whose event clock is not the page's: the handler's own time)
    if (shown) { if (now - overAt > RETRY_MS) { restart(); begin(ts); } return; }   // TAP TO PLAY AGAIN = the next run's START
    if (t0 == null) { begin(ts); return; }
    if (isOver(run)) return;
    const tk = tickOf(ts, t0);
    if (tap(run, tk, ev)) taps.push(tk);   // (false = a landing beat: not a drop, never logged)
  }
  play.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; touch(e.timeStamp); });
  play.addEventListener('touchmove', e => e.preventDefault(), { passive: false });   // (no page scroll under a finger)
  document.addEventListener('keydown', e => { if (sheetOpen) return; if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); touch(e.timeStamp); } });   // (the sheet's own buttons keep their keys)

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
      } else if (e.e === 'land') {
        if (crossedBest(best, e.floor)) {
          tapeFloor = best; newBest = true; view.setBest(tapeFloor, true); stage.classList.add('is-gold');
          say('NEW BEST', 'is-gold', 5, 1900, now); if (!late) cues.push({ id: 'streak', rate: 1.12 });
        }
        const b = bandAt(e.floor);
        // A BAND's ARRIVAL: its name (under the number) lights up — never said twice in the lane below
        if (b > bandNow) { bandNow = b; mark('dom'); band.textContent = BANDS[b].name; if (!calm && band.animate) band.animate(SWELL, { duration: 1700 }); if (!late) cues.push({ id: 'band-arrival' }); }
        // SOLO PAST 200: every notch of the tightening is called — a FASTER that lands under a bigger call (a streak, NEW BEST) waits its turn
        if (e.floor > TIGHT.from) { const k = Math.floor((e.floor + 1 - TIGHT.from) / TIGHT.every); if (k > notch) { notch = k; if (!say('FASTER', 'is-fast', 2, 1100, now)) later = ['FASTER', 'is-fast', 2, 1100]; } }
      }
    }
    return cues;
  }

  function showEnd(now) {
    shown = true; overAt = now;
    const live = resultOf(run), b = bandAt(live.floor), was = best;
    best = nextBest(was, live.floor);
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
    check.textContent = same ? 'REPLAY = LIVE ✓' : `REPLAY ≠ LIVE ✗ · first differs at tick ${at < 0 || at === Infinity ? '?' : at} · live ${live.floor} ${live.cause} · replay ${r.floor} ${r.cause}${why ? ` (${why})` : ''}`;
    end.hidden = false; again.hidden = false; soundsBtn.hidden = false; note.hidden = false; tag.hidden = true; tagFloor = -1;
    stage.classList.remove('is-live'); stage.classList.add('is-over');
    view.rest();   // (the first band's plate comes back while the card is up: PLAY AGAIN never starts on a blank sky)
    hook.ends.push({ seed, mode: MODE, same, at, live, replay: r, taps: taps.slice(), best, was }); if (hook.ends.length > 50) hook.ends.shift();
  }

  let raf = 0, last = 0, hudFloor = -1, hudLeft = -2, tagFloor = -1, tagAt = -1e9, frameN = 0;
  // THE HITCH COUNTER: frames over HITCH_MS in this run (after its first second; a tab that was away is not a hitch) + the last one's cause
  let hitchN = 0, hitchAll = 0, hitchLast = '', prevAt = 0, prevWork = 0;
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
    const w0 = performance.now(), gap = last ? now - last : TICK_MS, dt = Math.min(250, gap);
    if (last && gap > HITCH_MS && gap < LATE_MS && prevAt && t0 != null && now - t0 > 1000 && !shown && !isOver(run)) hitch(gap);
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
      const late = gap > LATE_MS;
      T.feed(ev); view.events(ev);
      const more = moments(ev, now, late);
      if (snd) { snd.playCues(snd.cuesOf(ev, late)); if (more.length) snd.playCues(more); }
      if (liveEv.length < 400000) liveEv.push(...ev);
      ev.length = 0;
    }
    if (isOver(run) && !endedAt) endedAt = now;   // (the end's own frame — whether THE FUSE ended it in this frame or a TAP did in the touch handler: the review — a miss used to bring the card at once, over the falling slab)
    if (isOver(run) && !shown && now - endedAt >= END_HOLD_MS) showEnd(now);
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
    // YOUR BEST while it is ABOVE you: the right-edge tag at its own height — held clear of the HUD and of THE DROP ZONE
    if (t0 != null && !shown && !isOver(run) && best > 0 && run.floor <= best) {
      if (tagFloor !== run.floor) { tagFloor = run.floor; tag.firstChild.textContent = bestView(best, run.floor).tag; tag.hidden = false; tagAt = -1e9; }
      // (its height is clamped to 100 floors up: a best far above is BEHIND the diagonal camera — projected, it came back mirrored and the tag jumped to the foot of its column: the review)
      const tp = T.top(), y = tagY(view.project((tp.x0 + tp.x1) / 2, Math.min(best, run.floor + 100), (tp.z0 + tp.z1) / 2)[1] * stageH, hudFoot, view.zoneTop() * stageH);
      if (Math.abs(y - tagAt) >= 0.25) { tagAt = y; tag.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`; }   // (a tag that did not move is not written)
    } else if (tagFloor >= 0) { tagFloor = -1; tag.hidden = true; }
    if (callUntil && now > callUntil) { callUntil = 0; callPri = 0; call.className = 'hi-call'; call.style.opacity = ''; if (later) { const l = later; later = null; say(l[0], l[1], l[2], l[3], now); } }
    frameN++;
    if (frames.length < 20000) frames.push(gap); else frames[frameN % 20000] = gap;
    // (the tier rule is asked six times a second, not sixty: each asking sorts its 120 samples three times — garbage, every frame)
    prevWork = performance.now() - w0; prevAt = w0;
    tiers.sample(now, prevWork); if (pin == null && frameN % 10 === 0) tiers.tick(now);
    if (fps && frameN % 30 === 0) { const l = frames.slice(-120), avg = l.reduce((a, b) => a + b, 0) / l.length, i = view.info(); fps.textContent = `${(1000 / avg).toFixed(0)} fps · ${avg.toFixed(1)} ms · worst ${Math.max(...l).toFixed(0)} · tier ${i.tier}${i.bloom ? ' bloom' : ''} · ${i.calls} calls · ${i.tris} tris · ${i.w}×${i.h} @${i.dpr} · tick ${run.t} · HITCH ${hitchN}${hitchLast ? ` (last: ${hitchLast})` : ''}`; }
  }
  document.addEventListener('visibilitychange', () => { tiers.reset(); if (glDown && document.visibilityState === 'visible') { tries = 0; rebuild(); } });

  // (the pass's own checks — tests/integration/highrise-play.mjs)
  const hook = window.__hiPlay = {
    ends: [], view, sfx: null,
    state: () => ({ mode: MODE, seed, started: t0 != null, shown, over: isOver(run), st: run.st, t: run.t, floor: run.floor, streak: run.streak, perfects: run.perfects, s0: run.s0, S: run.S, taps: taps.length, best, tapeOn: tapeFloor > 0, newBest, band: bandNow, words: endT.textContent, check: check.textContent, call: call.textContent, tag: tag.hidden ? '' : tag.textContent, top: { x0: run.x0, x1: run.x1, z0: run.z0, z1: run.z1, floor: run.floor }, viewTop: view.top(), tier: tiers.get(), tierPath: tierPath.slice(), rebuilds, sheet: sheetOpen, info: view.info() }),
    /** ms until the sliding slab is next dead on the tower — on its way out, or on its way back (null = no slab / its last pass is gone) */
    msToPerfect() {
      if (t0 == null || run.st !== 'slide') return null;
      const now = performance.now(), a = t0 + (run.s0 + run.S / 2) * TICK_MS - now, b = a + run.S * TICK_MS;
      return a > -8 ? a : b > -8 ? b : null;
    },
    restart: s => restart(s),
    frames: () => frames.slice(),
    /** THE HITCH COUNTER: this run's count · every run's · the last one's words · each with its cause */
    hitches: () => ({ n: hitchN, all: hitchAll, last: hitchLast, list: hitchList.slice() }),
    setTier: t => tiers.set(t),
    /** (the pass's LOOK CHECK — real drops through the real engine, played at once: the tower `n` floors up, the clock moved on with
     *  it; `off(i)` = how far off dead-on drop i lands, in ticks) */
    climb(n, off = () => 0) {
      if (t0 == null) begin(performance.now());
      for (let i = 0; i < n && !isOver(run); i++) { stepTo(run, run.s0, ev); if (run.st !== 'slide') break; const tk = run.s0 + Math.floor(run.S / 2) + off(i); if (tap(run, tk, ev)) taps.push(tk); }
      t0 = performance.now() - run.t * TICK_MS; last = 0;
      return run.floor;
    },
    stop() { cancelAnimationFrame(raf); offGL(); view.destroy(); },
  };
  restart();
  raf = requestAnimationFrame(frame);
}

try { mount(); }
catch (e) { app.replaceChildren(h('p.hi-wait', `Can’t open the game: ${(e && e.message) || e}`)); }
