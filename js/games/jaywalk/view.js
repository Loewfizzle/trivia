// JAYWALK — THE GAME's SCREEN (H3 solo · H4 match · DAILY B: THE DAILY — `state.jwDaily`, js/games/jaywalk/daily-run.js): the scene (night.js), the kid, the controls + the sounds in the console's frame;
// the RUN = this phone's pure engine on the SERVER's clock, ONE LIFE → docs/jaywalk.md "THE SOLO GAME" · "THE MATCH" · "THE GHOSTS".
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { dbRef, set as dbSet, get as dbGet, serverTimestamp, serverNow, expectRefusal } from '../../firebase.js';
import { createProofWriter } from '../kit/proof-writer.js';
import { proofIo, stampT0, writeMatchGo } from '../kit/proof-io.js';
import { firstGo, onTime, goOf } from '../../core/proof.js';
import { colorHex } from '../../config.js';
import { liveKeyFor } from '../registry.js';
import { createFinal } from '../../ui/final.js';
import { backToLobby } from '../../host.js';
import { createTiers } from '../kit/tiers.js';
import { showCall } from '../kit/call.js';
import { TICK_HZ, CLOCK, FP, MODES } from './tuning.js';
const SHIP_SEEN = 252;   // (ticks: the 4.2 s the Mothership's lift is seen — flyers.js#holdMs)
const SHIP_WARN = 600;   // (ticks: the Mothership's 10-s warning before the cap — flyers.js#FLY.warn: THE ARRIVAL BANNER never shows over it)
import { createCourse, laneHit, logUnder } from './course.js';
import { createArrival } from './arrival.js';
import { LOOKS as AREA_LOOKS } from './areas.js';
import { createRun, step, isOver, canLog, kidAt } from './engine.js';
import { packLog, unpackLog, logFromChunks } from './replay.js';
import { seedOf, startOf, matchVersion, nodeVersion } from './logic.js';
import { versionAt, runVersion } from './versions.js';
import { liveOf, finalPatch } from './director.js';
import { createRouterPing, createLiveWait, END_OWED_MS } from '../kit/run-hold.js';
import { createGhost, resetGhost, feedGhost, stepGhost, tagGroups } from './ghosts.js';
import { wireControls } from './controls.js';
import { createNight } from './night.js';
import { getPref, setPref } from './lab-prefs.js';
import { ZOOM, ANGLE } from './camera.js';
import * as SFX from './sfx.js';
import { createCues, cuesAt } from './cues.js';
import { duckMusic, musicDuckLevel } from '../../audio/music.js';
import { runLine } from './causes.js';
import { buildEnd, finalRows } from './victory.js';
import { splitsCard, keepOwnSplits } from './splits-card.js';
import { createMomentsView } from './moments-view.js';
import { keepShot, shotMs } from './shot.js';
import { setNum, prepNums } from './numerals.js';
import { BOARD, TABLE_KEEP_MS, parseTable, linesFor, isRecord, crossedFriends } from './lines.js';

/** how long the hit is seen before the end screen / the spectator's view covers it (ms) */
export const END_HOLD_MS = 850;
/** GO's answer is waited this long before a SOLO run goes on UNPROVEN (never a stuck start) */
export const GO_WAIT_MS = 4000;
/** a MATCH: this phone writes its GO this long before the count's end (the rules open the window 2 s before it) */
export const GO_EARLY_MS = 1800;
/** the most ticks one frame catches up (a long stall is spread over a few frames; the rules never skip one) */
const CATCH_UP = 900;
const ZERO = Object.freeze([0, 0, 0, 0, 0, 0, 0, 0, 0]);
/** THE START (before the course is known): plain calm ground — what lanes 0–3 are on EVERY course */
const START = Object.freeze({ seed: 'start', lane: i => ({ i, type: 'grass', heat: 0, mark: null, ufo: null, obs: ZERO }) });

// THE SCENE STAYS WARM over PLAY AGAIN (INSTANT AGAIN remounts the view): parked a moment, the next mount takes it back
let parked = null;
const unpark = () => { if (!parked) return null; clearTimeout(parked.t); const p = parked; parked = null; return p; };
// (a parked scene has no view's listener — its destroy() is never heard as a lost context)
const park = (play, night) => { if (parked) { clearTimeout(parked.t); parked.night.destroy(); } parked = { play, night, t: setTimeout(() => { if (parked && parked.night === night) { parked = null; night.destroy(); play.remove(); } }, 2500) }; };

// (the pass's own checks — tests/integration/e2e-jaywalk.mjs — on a LOCAL emulator page only: never on the live site)
const TEST = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]emu(?:&|=|$)/.test(location.search || '');
let scenesMade = 0, popN = 0;
// (the leave check, a LOCAL emulator page only — wk-jaywalk-mem.mjs: the views still alive + the scenes made)
const VIEWS = TEST ? [] : null;
if (TEST) { globalThis.__jwViews = () => VIEWS.filter(r => r.deref()).length; globalThis.__jwViewIds = () => VIEWS.map((r, i) => (r.deref() ? i : -1)).filter(i => i >= 0); globalThis.__jwScenes = () => scenesMade; }

// THE LINES' DATA (lines.js): the SERVER-counted bests (yours + friends'), asked ONCE at a run's start, kept a short while;
// /api down = the best last told still draws YOUR BEST, no friend lines
let table = null;   // { uid, at, p: Promise<{ best, friends } | null> }
function loadTable(uid) {
  if (table && table.uid === uid && performance.now() - table.at < TABLE_KEEP_MS) return table.p;
  const p = lazyImport(import('../../profile/api.js'), '../../profile/api.js').then(A => A.api('profile', { action: 'table', b: BOARD })).then(d => parseTable(d && d.rows)).catch(() => null);
  table = { uid, at: performance.now(), p };
  return p;
}

/** H4B — the quality tier this phone last settled at (the city's rule — `na:tier`: remembered 14 days; the kit steps back up by itself after 8 good seconds) */
export const TIER_MEM_DAYS = 14;
const tierMem = () => { const m = /^([012]):(\d+)$/.exec(getPref('tier', '')); return m && serverNow() - Number(m[2]) < TIER_MEM_DAYS * 864e5 ? Number(m[1]) : 2; };
// THE CAMERA IS PINNED: ZOOM 8 · STRAIGHT (camera.js) — the lab's switches are never read here (jw:lab: keys = this screen's own memory)
/** HOW A RUN ENDED, in the game's words (causes.js#runLine — the vehicle named is the one the scene drew) */
/** H5B — THE LOOK on this phone now: the console's GAME LOOK (body[data-look] — AUTO · DAY · NIGHT, per phone, live) */
const lookNow = () => (document.body.dataset.look === 'day' ? 'day' : 'night');
const lineOf = (r, course) => runLine(course, { cause: r.cause, y: r.y, x: r.x, end: r.end, lanes: r.best, taken: r.st === 'taken' }, lookNow());
const hexNum = c => parseInt(String(colorHex(c) || '#00f0ff').slice(1), 16) || 0x00f0ff;

export function createView() {
  let root = null, play = null, night = null, tiers = null, offControls = null, offGL = null, raf = 0, st = null, gone = false;
  let lanesEl = null, markEl = null, hintEl = null, finalWrap = null, final = null, localEnd = null, arriveEl = null;
  let orderEl = null, tagsEl = null, countEl = null, watchEl = null, overEl = null, outCard = null;
  // the run
  let code = '', uid = '', matchId = '', mode = 'wait', D = null;   // 'wait' (the course is on its way) · 'run' · 'over' (out / taken / watching)
  let run = null, course = START, log = [], queue = [], go = 0, proven = false, asked = false, goTries = 0, haveGo = false, cvAsked = false, cvMine = 0;
  let wroteE = false, overAt = 0, goTimer = 0, shotAt = 0, lastPump = 0, lateGo = false;
  let t0srv = 0, t0perf = 0, last = 0, markUntil = 0, lanesShown = -1, sndOn = false, bot = null, pinned = false, revealed = false;
  // the match
  const ghosts = new Map();   // uid → ghosts.js#createGhost (conf · run · log · done · held · vis · behind) + { uid, n (chunks read), lastT, hex, name, tagEl, dir, outAt }
  let look = 'night';   // (H5B — the look this screen is drawn in now)
  let rosterEl = null, rosterKey = '';   // (H5B's add-on — THE NAMES AT THE START: who is playing, lined up through the 3 · 2 · 1)
  let cues = createCues(), ducked = null, duckT = 0, trainOn = false, momK = 1;   // (H5A — THE WORLD's SOUNDS: cues.js; the music's level before the train ducked it)
  let lines = { best: 0, friends: [] }, record = false, lineKey = '', tableN = 0;   // (THE LINES: your best + your friends' — the server's; record: this run is past your best)
  let mom = null, momAt = 0, stageW = 390, stageH = 844, offSize = null;   // (J1 — THE MATCH MOMENTS: moments-view.js; the stage's size from a ResizeObserver — never read in a frame)
  let isMatch = false, watching = false, followUid = '', followPick = '', callEl = null, callLine = '', callDone = false, liveRuns = null, orderKey = '', countKey = '', watchKey = '';
  const frames = [], cost = [], stamps = [], adopts = [], watch = { n: 0, car: 0, water: 0, logs: 0, held: 0, air: 0, late: 0, undead: 0 };
  if (VIEWS) VIEWS.push(new WeakRef(frames));
  /** how long a run's end is seen before the end screen / the spectator's view covers it: THE ABDUCTION + THE MOTHERSHIP's lift are longer (H6A) */
  const hold = () => Math.max(END_HOLD_MS, night ? night.holdMs(run) : 0);
  // THE CONSOLE FIX — THE RUN HOLD (kit/run-hold.js; docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"): this phone's
  // own PROVEN match run is played to its own end whatever the host's state says — no podium over it, the router keeps this screen through
  // a moved-on room; then its end is written and the phone follows. The podium waits for the rivals' live runs the same way.
  const pingRouter = createRouterPing(), liveWait = createLiveWait(liveOf);
  let everProven = false;
  const runLive = () => isMatch && proven && !D && mode === 'run' && !!run && !isOver(run);
  function holdsRun() {
    if (gone || !isMatch || !proven || D) return false;
    if (runLive()) return true;
    if (mode !== 'over' || !wroteE) return false;
    const since = performance.now() - overAt;
    return since < hold() || (since < END_OWED_MS && !!W && W.owes());
  }
  /** the podium after a wait: scored from the nodes as they stand now (the host's own step — director.js#finalPatch), never an early
   *  `final`'s numbers */
  const scoredNow = g => { try { return { ...g, ...finalPatch(g, runsNow() || {}, srvNow(), code) }; } catch { return g; } };
  // HIGH RISE S4A — THE SOUND SYNC (the owner plays with MUSIC OFF): PODCAST MODE naps the audio context between two effects — every hop's
  // sound then had to wake it first (on iOS at the finger's LIFT: the sound late by a variable beat). A LIVE run HOLDS IT AWAKE: a lease
  // renewed once a second from the frame (audio/engine.js#holdAwake, through its hub — THE STALE-MODULE RULE), let go when the run ends
  let awakeAt = 0;
  const awake = on => { const f = globalThis.__nsHoldAwake; if (f) { try { f(on, 'jaywalk'); } catch { /* audio is polish */ } } };
  const syncs = TEST ? [] : null;   // (the pass's measure — tests/integration/sound-sync.mjs: when each hop's / landing's sound was asked)
  const srvNow = () => t0srv + (performance.now() - t0perf);
  const anchor = () => { t0srv = serverNow(); t0perf = performance.now(); };
  const soloGame = g => !!g && g.mode === 'solo' && Object.keys(g.participants || {}).length === 1;
  const mine = g => !!(g && g.participants && g.participants[uid]);
  const treePath = () => `rooms/${code}/jw/${matchId}`, nodePath = () => (D ? D.path : `${treePath()}/${uid}`);
  const runsNow = () => (st && st.game && st.liveKey === liveKeyFor(st.game) && st.live && st.live.runs) || null;
  const nameOf = u => String(((st.players && st.players[u]) || {}).name || 'GHOST').toUpperCase();

  function build(el) {
    lanesEl = h('div.jw-lanes'); setNum(lanesEl, 0); prepNums(lanesEl); markEl = h('div.jw-mark', '');   // (THE BIG NUMERALS — numerals.js: room between the digits, a 1 with a foot)
    hintEl = getPref('hint', '') ? null : h('div.jw-hint', 'TAP TO HOP · SWIPE TO STEP');
    orderEl = h('ol.jw-order', { 'aria-label': 'The order' }); tagsEl = h('div.jw-tags', { 'aria-hidden': 'true' });
    countEl = h('div.jw-count', { 'aria-live': 'polite' }); watchEl = h('div.jw-watch'); overEl = h('div.jw-over.mk-theme');
    rosterEl = h('div.jw-roster', { 'aria-label': 'Who is playing' }); rosterKey = '';
    const had = unpark();
    play = had ? had.play : h('div.jw-play', { role: 'application', 'aria-label': 'Jaywalk — tap to hop, swipe to move' });
    root = h('div.jw-stage.jw-game', play, h('div.jw-blackout'), tagsEl, h('div.jw-hud', lanesEl, markEl), orderEl, rosterEl, countEl, watchEl, hintEl, overEl);
    el.replaceChildren(root);
    arriveEl = createArrival(root, AREA_LOOKS);   // (BEFORE THE FLIP — THE ARRIVAL BANNER: arrival.js)
    if (isMatch) {
      mom = createMomentsView(root, { nameOf, colorOf: u => colorHex(((st.players && st.players[u]) || {}).color), sound: id => { if (sndOn) { try { SFX.play(id); } catch { /* silent */ } } } });
      try { const ro = new ResizeObserver(es => { const r = es[0] && es[0].contentRect; if (r && r.width) { stageW = r.width; stageH = r.height; } }); ro.observe(root); offSize = () => ro.disconnect(); } catch { /* the defaults */ }
    }
    const me = (st.players && st.players[uid]) || {};
    try {
      if (!had) scenesMade++;
      night = had ? had.night : createNight(play, { kidColor: colorHex(me.color), zoom: ZOOM, angle: ANGLE, tier: tierMem(), look: lookNow() });
      if (had) { night.setKidColor(colorHex(me.color)); night.resize(); }
      look = lookNow(); night.setLook(look); root.dataset.look = look;   // (H5B — THE DAY LOOK: the scene + this screen's own words follow the phone's GAME LOOK)
    } catch { root.append(h('p.jw-nogl', 'This browser can’t draw the game here (it has no WebGL).')); night = null; return; }
    night.setReveal(0, true); watchGL();
    // (H4B — THE TIER IS REMEMBERED: a phone that stepped down starts there next time)
    tiers = createTiers({ apply: t => { if (night) night.setTier(t); if (!pinned) setPref('tier', `${t}:${Math.round(serverNow())}`); }, initial: night.tier() });
    offControls = wireControls(play, { onHop: hop, onAny: nextFollow });
    // the sounds: the SHARED SFX bus; silent if anything fails — audio is polish
    // (H4B — DECODED AHEAD: never a decode on the first tap)
    try { SFX.fetchSounds(); if (isMatch) SFX.fetchSounds(SFX.MATCH_SOUNDS); sndOn = true; Promise.resolve(SFX.decode()).catch(() => {}); } catch { sndOn = false; }   // (J1: + THE MATCH MOMENTS' three, a match only)
  }

// THE LOST CONTEXT: iOS can take the WebGL context away — the run goes on (the server's clock), so the scene is REBUILT the moment
// it is back (or after 1.5 s); /admin hears once. A DELIBERATE teardown is never heard: the listeners come OFF (offGL) before
// any destroy() (its forceContextLoss fires 'webglcontextlost') → docs/jaywalk.md "THE TEARDOWN"
  function watchGL() {
    if (offGL) offGL();
    const cv = play && play.querySelector('canvas.jw-canvas'), mine = night;
    if (!cv) return;
    let t = 0, told = false;
    const remake = () => {
      clearTimeout(t);
      if (gone || !night || night !== mine || !play || !cv.isConnected) return;
      const me = (st.players && st.players[followUid || uid]) || {}, o = { kidColor: colorHex(me.color), zoom: night.zoom(), angle: night.angle(), tier: night.tier(), look: lookNow() }, rest = night.resting();
      if (offGL) offGL();   // (the dead scene's destroy() is not a second loss)
      try { night.destroy(); } catch { /* its context is gone */ }
      try { scenesMade++; night = createNight(play, o); night.setReveal(revealed ? 1 : 0, true); lineKey = ''; if (rest) night.rest(true); watchGL(); }
      catch { night = null; if (root) root.append(h('p.jw-nogl', 'This browser can’t draw the game here (it has no WebGL).')); }
    };
    const lost = e => {
      e.preventDefault();
      if (gone || night !== mine) return;   // (our own teardown — never a report, never a rebuild)
      if (!told) { told = true; lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => m.reportError(new Error('JAYWALK: the WebGL context was lost — the scene is rebuilt'), 'jaywalk')).catch(() => {}); }
      clearTimeout(t); t = setTimeout(remake, 1500);
    };
    cv.addEventListener('webglcontextlost', lost);
    cv.addEventListener('webglcontextrestored', remake);
    offGL = () => { offGL = null; clearTimeout(t); cv.removeEventListener('webglcontextlost', lost); cv.removeEventListener('webglcontextrestored', remake); };
  }

  // ---- THE RUN
  function reset() {
    mode = 'wait'; course = START; run = createRun({ seed: 'start', mode: 'solo' }); log = []; queue = []; go = 0; proven = false; asked = false; goTries = 0; haveGo = false; cvAsked = false; cvMine = 0;
    newWriter(); wroteE = false; lateGo = false; overAt = 0; lanesShown = -1; markUntil = 0; shotAt = 0; revealed = false;
    watching = false; followUid = ''; followPick = ''; callLine = ''; callDone = false; liveRuns = null; orderKey = ''; countKey = ''; watchKey = ''; liveWait.reset(); everProven = false;
    cues = createCues(); quiet(); if (night) night.rest(false);
    for (const G of ghosts.values()) if (G.tagEl) G.tagEl.remove();
    ghosts.clear();
    // THE LINES: the best the server last told this phone at once; the table (the server's own, ONE call a run at most) right behind it
    lines = { best: Math.floor(Number(getPref('best', '0')) || 0), friends: [] }; record = false; lineKey = '';
    if (lanesEl) lanesEl.classList.remove('is-record', 'is-flash');
    if (night) night.setLines(null);
    const tn = ++tableN;
    loadTable(uid).then(T => {
      if (!T || gone || tn !== tableN) return;
      lines = { best: Math.max(T.best, lines.best), friends: T.friends };
      if (T.best > 0 && T.best >= lines.best) setPref('best', T.best);
    });
    if (markEl) markEl.textContent = '';
    if (arriveEl) arriveEl.hide();
    if (night) night.setReveal(0, true);
    anchor();
  }
  const refused = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => m.reportError(new Error('JAYWALK: the proof node was refused — the run plays UNPROVEN (re-publish database.rules.json: rooms/{CODE}/jw)'), 'rules')).catch(() => {});
  /** GO (a SOLO run): the proof node's first write — the SERVER's time, read back → the course */
  function askGo() {
    if (asked) return;
    asked = true;
    const m = matchId, path = `${nodePath()}/go`, runs = runsNow(), node = runs ? runs[uid] : null;
    if (node && node.go > 0) { rejoin(node); return; }   // (a refresh / a rejoin mid-run: the run so far is in the node)
    clearTimeout(goTimer);
    goTimer = setTimeout(() => { if (!gone && m === matchId && mode === 'wait') unproven('no answer'); }, GO_WAIT_MS);
    expectRefusal(path, 'jaywalk GO: already written (a rejoin) or the rules are not published yet');
    // (THE PROOF PASS — THE STAMP: the tree's first write, right ahead of the GO — core/proof.js; THE CONSOLE FIX: the GO behind its answer)
    stampT0(treePath(), 'jaywalk').then(() => dbSet(dbRef(path), serverTimestamp())).then(() => dbGet(dbRef(path))).then(snap => {
      if (gone || m !== matchId || mode !== 'wait') return;
      const v = snap.val();
      if (typeof v === 'number' && v > 0) { clearTimeout(goTimer); writeCv(v, versionAt(v)).then(cv => { if (!gone && m === matchId && mode === 'wait') adopt(v, null, true, null, cv); }); }   // (the GO is ON the server: never unproven for the cv's round trip)
      else unproven('no go');
    }).catch(() => {
      // refused: this run's GO is already there (a rejoin) — take the node; nothing there = unproven
      dbGet(dbRef(nodePath())).then(snap => {
        if (gone || m !== matchId || mode !== 'wait') return;
        const n = snap.val();
        if (n && n.go > 0) rejoin(n); else unproven('refused');
      }).catch(() => { if (!gone && m === matchId && mode === 'wait') unproven('refused'); });
    });
  }
  /** J2 — COURSE RULES v2: a solo run's version = the one in force at its own GO (versions.js), written beside it (`cv`) — the rules take it
   *  once, after the GO; the server checks it against the GO. REFUSED (rules not re-published yet): the run plays the version the server
   *  will replay a run with no `cv` on (v1 until THE GRACE ends) — the phone and the server always agree */
  function writeCv(goAt, E) {
    const path = `${nodePath()}/cv`;
    expectRefusal(path, 'jaywalk cv: the rules are not re-published yet (J2) — the run plays v1');
    return dbSet(dbRef(path), E).then(() => E, () => runVersion(null, E, goAt) || E);
  }
  /** a node read back from the SERVER (a rejoin): the version it replays on (an unknown one: the version in force — it will not count) */
  const cvOfNode = n => nodeVersion(n, versionAt(n.go)) || versionAt(n.go);
  /** a SOLO rejoin: a node with its GO but no cv and NO hop yet (a refresh between the GO and the cv) writes it now; one with hops keeps
   *  the version they were played on (no cv = v1, the run with no cv — never moved under them) */
  function rejoin(n) {
    const m = matchId;
    if (n.cv == null && n.c == null) writeCv(n.go, versionAt(n.go)).then(cv => { if (!gone && m === matchId && mode === 'wait') adopt(n.go, null, true, null, cv); });
    else adopt(n.go, n.c, true, null, cvOfNode(n));
  }
  /** GO (a MATCH): this phone's own `go` — its proof of being there; the FIRST one to land is the match's (logic.js#firstGo). A refusal
   *  (this phone's clock a touch early, a rejoin) is looked at and tried again a few times — never a stuck start: the count runs on */
  function askGoMatch() {
    if (asked) return;
    asked = true;
    const m = matchId, runs = runsNow(), node = runs ? runs[uid] : null;
    if (node && node.go > 0) { haveGo = true; return; }
    const again = () => { if (gone || m !== matchId) return; if (goTries++ < 7) setTimeout(() => { asked = false; }, 420); else refused(); };
    // (a TRANSACTION, never applied locally — THE NODES ARE THE TRUTH. THE PROOF PASS: the stamp + the GO are the kit's —
    //  kit/proof-io.js#writeMatchGo, HIGH RISE's too)
    writeMatchGo(treePath(), uid, 'jaywalk', runs).then(ok => { if (gone || m !== matchId) return; if (ok) haveGo = true; else again(); }, again);
  }
  /** the engine caught up to the clock from a node's hop log (a refresh / a rejoin mid-run) */
  function catchUp() {
    if (!log.length) return;
    let i = 0;
    // (J2 FIX — the fresh-eyes review: never stop short of a hop already on the server — a clock estimate that moved back would leave it
    //  unplayed here while the server replays it: THE END CHECK would refuse the honest run. At most CLOCK.ahead ahead of the clock)
    const target = Math.max(tickNow().t, log[log.length - 1].t + 1);
    while (!isOver(run) && run.t < target) { let d = ''; if (i < log.length && log[i].t === run.t) d = log[i++].d; step(run, course, d); }
  }
  /** a SOLO course lands: seed = hash(code + matchId + GO) — the run's tick 0 is GO; a node's chunks (a rejoin) are replayed to now */
  function adopt(goAt, chunks, isProof, ds, cv) {
    clearTimeout(goTimer);
    go = goAt; proven = !!isProof;
    const seed = ds || isProof ? ds || seedOf(code, matchId, go) : `u${Math.floor(go).toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
    // (J2: the COURSE VERSION — the daily's from its START, a solo run's from its GO (writeCv), an unproven run's the one in force now)
    course = createCourse(seed, { cv: cv === 2 || cv === 1 ? cv : versionAt(go) }); run = createRun({ seed, mode: ds ? 'daily' : 'solo' });
    const old = chunks ? logFromChunks(chunks) : null;
    log = old || []; W.reset({ sent: log.length, next: chunks ? Object.keys(chunks).length : 0, verify: !!chunks });   // (CITY I: a rejoin's first write reads the chunks fresh)
    anchor();
    catchUp();
    mode = 'run';
    revealed = true; if (night) night.setReveal(1);   // (the flag too: a lost context's rebuild reads it — THE POLISH PASS)
  }
  /** no proof here (no signal, the rules not published): a SOLO run still plays — on its own seed + clock, never counted */
  function unproven(why) {
    if (why === 'refused') refused();
    adopt(serverNow(), null, false);
  }
  /** a MATCH's course lands (THE FIRST GO → the seed + tick 0; in `play` the game's own): the kid stands on it, the engine waits for
   *  tick 0. A rejoin: this player's own log so far is replayed to now. A watcher (not a participant) has no run of their own. */
  function adoptMatch(S, runs, cv) {
    go = S.playAt; course = createCourse(S.seed, { cv }); run = createRun({ seed: S.seed, mode: 'match' });
    const node = runs && mine(st.game) ? runs[uid] : null, old = node && node.c ? logFromChunks(node.c) : null;
    log = old || []; W.reset({ sent: log.length, next: node && node.c ? Object.keys(node.c).length : 0, verify: !!(node && node.c) }); queue = [];   // (CITY I)
    if (node && node.go > 0) haveGo = true;
    if (node && node.e) wroteE = true;
    for (const G of ghosts.values()) resetGhost(G, S.seed);
    anchor();
    catchUp();
    revealed = false; lanesShown = -1;
    if (!mine(st.game)) { mode = 'over'; overAt = -1e9; watching = true; }
    else if (isOver(run)) { mode = 'over'; overAt = -1e9; callDone = true; }   // (a rejoin after their own end: straight to watching)
    else mode = 'run';
  }
  const tickNow = () => { const x = (srvNow() - go) * TICK_HZ / 1000, t = Math.floor(x); return { t, a: x - t }; };

  function hop(d) {
    if (mode !== 'run' || (run && isOver(run)) || queue.length >= 2 || tickNow().t < 0) return;
    queue.push(d);
    if (hintEl) { hintEl.remove(); hintEl = null; setPref('hint', '1'); }
  }
  /** THE ARRIVAL BANNER may show now: a run on, nothing bigger on the top of the screen (the Mothership's warning in a match, the OUT card, the end, the console's moment) */
  const shipWarn = () => !!run && !!MODES[run.mode].cap && run.t >= MODES[run.mode].cap - SHIP_WARN;
  const arriveNow = () => !!arriveEl && mode === 'run' && !watching && !outCard && !final && !localEnd && !shipWarn() && !isOver(run);
  function tick() {
    let d = '';
    if (queue.length && canLog(log, run.t, queue[0], run.mode)) { d = queue.shift(); log.push({ t: run.t, d }); }
    const ev = [];
    step(run, course, d, ev);
    for (const e of ev) {
      if (e.e === 'best') onBest(e.lane);
      // THE ARRIVAL BANNER: the area's name + its LANE with its sound — this phone's own kid only; the Mothership's warning / OUT / the end win
      if (e.e === 'landmark') {
        if (arriveNow()) arriveEl.show(e.lane, look);
        if (sndOn) { try { SFX.play('area-arrive'); } catch { /* silent */ } }
      }
      if (sndOn) { try { SFX.onEvent(e); } catch { /* silent */ } }
      if (syncs && (e.e === 'hop' || (e.e === 'land' && e.on === 'wood'))) { if (syncs.length >= 400) syncs.shift(); syncs.push({ e: e.e, at: performance.now() }); }
    }
    // THE WORLD's SOUNDS (cues.js, PURE): this phone's own kid only, while he is in
    if (sndOn && !isOver(run)) { try { for (const q of cuesAt(cues, run, course)) { SFX.onCue(q); duck(q.cue); } } catch { /* silent */ } }
  }
  /** THE MUSIC DUCKS under the train + the big moments (flyers.js#DUCK): ONE level, the deeper; the level found is put back after */
  function applyDuck(sec) {
    const k = Math.min(trainOn ? SFX.TRAIN_DUCK.level : 1, momK);
    if (k < 1) { if (ducked == null) ducked = musicDuckLevel(); duckMusic(Math.min(ducked, k), sec); } else if (ducked != null) { duckMusic(ducked, sec); ducked = null; }
  }
  function duck(cue) {
    if (cue !== 'bell-on' && cue !== 'bell-off' && cue !== 'train-pass') return;
    clearTimeout(duckT);
    const D = SFX.TRAIN_DUCK, up = () => { trainOn = false; applyDuck(D.outS); };
    if (cue === 'bell-off') { duckT = setTimeout(up, 250); return; }
    trainOn = true; applyDuck(D.inS);
    if (cue === 'train-pass') duckT = setTimeout(up, D.holdMs);
  }
  function duckMoment() { const k = night && sndOn ? night.duck() : 1; if (k !== momK) { const down = k < momK; momK = k; applyDuck(down ? 0.3 : 1.1); } }
  function unduck() { clearTimeout(duckT); trainOn = false; momK = 1; applyDuck(SFX.TRAIN_DUCK.outS); }
  /** the world goes quiet (the run ended, a new run, the view left): the bell stops, the music comes back up */
  function quiet() { try { SFX.onCue({ cue: 'bell-off' }); SFX.onCue({ cue: 'tick-off' }); if (night) night.quiet(); } catch { /* silent */ } unduck(); }
  /** a lane farther than ever: YOUR BEST crossed = a NEW RECORD from here (a burst, the sound, the counter gold); a friend's = a small burst + a chime */
  function onBest(lane) {
    if (!record && isRecord(lines.best, lane)) {
      record = true;
      night.flashLine('best', lines.best);
      lanesEl.classList.add('is-record');
      lanesEl.classList.remove('is-pop', 'is-flash'); void lanesEl.offsetWidth; lanesEl.classList.add('is-flash');
      setTimeout(() => { if (lanesEl) lanesEl.classList.remove('is-flash'); }, 720);   // (the flash, then the counter's own small pop a lane again)
      if (sndOn) { try { SFX.play('new-best'); } catch { /* silent */ } }
    }
    if (!isMatch) for (const f of crossedFriends(lines.friends, lane - 1, lane)) {
      night.flashLine('friend', f.v);
      if (sndOn) { try { SFX.play('area-arrive', { vol: 0.4, rate: 1.3 }); } catch { /* silent */ } }
    }
  }
  /** what the scene draws of them now (set only when it changes): your own lines on your own run — never over a player you watch */
  function drawLines(own) {
    if (own && !record && isRecord(lines.best, run.best)) { record = true; lanesEl.classList.add('is-record'); }   // (a rejoin, an answer that came late: no burst)
    const want = own ? linesFor({ best: lines.best, friends: lines.friends, reached: run.best, solo: !isMatch }) : { best: null, friend: null };
    const key = `${want.best ? want.best.lane : 0}|${want.friend ? want.friend.text : ''}`;
    if (key === lineKey) return;
    lineKey = key; night.setLines(want);
  }
  /** THE PROOF: the new hops go up in chunks, each server-stamped on ARRIVAL; offline they queue + land together (THE DROPPED SIGNAL) */
  // CITY I — A LATE PROOF CHUNK = A QUIET COUNT, NEVER A RULES REFUSED ROW (the inbox's 8:05 pm entry — the late k write's family, docs/jaywalk.md
  // "THE LATE PROOF CHUNK"): the rules take c/{i} only in 'play' (+ the count's last 2 s) and once per index. (1) once this phone KNOWS the match
  // left 'play' / moved on, no chunk (nor `e`) is written — the unsent hops are dropped + counted ('late-proof'); (2) from the moment it sees the
  // end, a refusal of one already in flight is EXPECTED (firebase.js#expectRefusal — a quiet count; one refused while still in 'play' stays the
  // alarm); (3) the first write after a REJOIN reads the node's chunks fresh and never re-sends an index that is there. The proof still verifies:
  // once the phase is over every later chunk is refused too — no hole; the server's judge counts the run to its last LANDED hop.
  const countQuietLate = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => { if (typeof m.countQuiet === 'function') m.countQuiet('late-proof'); }).catch(() => {});   // (THE STALE-MODULE RULE: an existing export, lazily)
  const matchLeft = () => !D && !!matchId && (!st.game || st.game.matchId !== matchId || (st.game.phase !== 'play' && st.game.phase !== 'count'));   // (past 'play' — the count's last 2 s still take a chunk)
  let lateSeen = '';
  function lateProof(why) {
    if (D || lateSeen === matchId || !proven) return;
    lateSeen = matchId;
    expectRefusal(`${nodePath()}/c`, `jaywalk: a proof chunk after the match ended (${why})`, 90_000, 'late-proof');
    expectRefusal(`${nodePath()}/e`, `jaywalk: the end after the match ended (${why})`, 90_000, 'late-proof');
  }
  // THE PROOF PASS — THE PROOF WRITER (kit/proof-writer.js, HIGH RISE's too — the review's MUST 2 a): ONE burst at a time (the next chunk
  // leaves once the one before is acknowledged), a REFUSED chunk is read back + sent again, the hops are NEVER dropped on the mirror alone
  // (a mirror that says "the match moved on" only makes a refusal expected — (1) above now takes LATE_TRIES refusals), `e` behind the last
  // chunk. A run's writer is its own (a late answer never touches the next run's). THE DAILY (its own node + rules): the old way (`pipe`).
  let W = null;
  function newWriter() {
    if (W) W.close();   // (the run before: what it logged leaves now; its late answers touch nothing)
    W = createProofWriter({
      count: () => log.length, pack: (a, b) => packLog(log.slice(0, b), a), entriesOf: c => { const l = logFromChunks(c); return l ? l.length : -1; },
      chunkMax: CLOCK.chunkMax, chunks: CLOCK.chunks, flushMs: () => (isMatch ? CLOCK.flushMatchMs : CLOCK.flushMs), left: matchLeft,
      onLate: why => { lateProof(why); if (why === 'dropped') countQuietLate(); },
      onDead: why => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => m.reportError(new Error(`JAYWALK: the proof log could not be completed (${why}) — the run can not count`), 'rules')).catch(() => {}),
      io: proofIo(nodePath), pipe: !!D,
    });
  }
  function flush(force) { if (proven && W) W.flush(force); }
  /** the run is over: the last chunk, then `e` — the host's step ends the match on it (a signal: never read as a score) */
  function onOver() {
    mode = 'over'; overAt = performance.now(); shotAt = overAt + shotMs(run, course); queue = [];
    keepOwnSplits(matchId, run.sp);   // (J1 — YOUR SPLITS: the end card's boxes from this phone's own engine, at once)
    awakeAt = 0; awake(false);   // (THE SOUND SYNC: the hold ends with the run — the hit's own sound plays out, then the context naps again)
    quiet();
    flush(true);
    sendEnd();
  }
  /** `e` — behind the last chunk's acknowledgement (the writer); once (THE DAILY: daily-run.js writes its own `e`) */
  function sendEnd() {
    if (!proven || wroteE || D || !W) return;
    wroteE = true;
    W.end({ l: run.best, t: run.bestT, w: String(run.cause || '').slice(0, 12) });
  }
  /** THE SHARE IMAGE's frame: the kid still clearly SEEN + what got him (shot.js#shotMs — per cause) — kept on this phone until the next run */
  function takeShot() {
    shotAt = 0;
    const m = matchId, r = run, c = course;
    night.snap(cv => {
      if (!cv || gone || m !== matchId) return;
      keepShot({ matchId: m, canvas: cv, lanes: r.best, line: lineOf(r, c), kidY: (night.kidScreenY() * cv.full - cv.top) / cv.height, kidX: night.kidScreenX() });
    }, 1080, 1080);
  }

  // ---- THE MATCH: the ghosts, the order, the count, out → Call the Winner → watching
  /** the others' hop logs → their ghosts (their chunks read as they land — each chunk once; their own END = the log is complete) */
  function feedGhosts(g, runs) {
    for (const u of Object.keys(g.participants || {})) {
      if (u === uid) continue;
      let G = ghosts.get(u);
      if (!G) {
        const p = (st.players && st.players[u]) || {};
        G = { ...createGhost(course.seed), uid: u, n: 0, lastT: 0, hex: hexNum(p.color), name: nameOf(u), tagEl: h('div.jw-tag', { style: { '--c': colorHex(p.color) } }, nameOf(u)), tagKey: '', dir: 'u', outAt: 0, tag: null };
        tagsEl.append(G.tagEl); ghosts.set(u, G);
      }
      const node = runs && runs[u], c = node && node.c;
      if (c) for (let v = c[G.n]; v && typeof v.s === 'string'; v = c[G.n]) {
        const hops = unpackLog(v.s, G.lastT);
        if (!hops) break;
        feedGhost(G, hops, false);
        if (hops.length) G.lastT = hops[hops.length - 1].t;
        G.n++;
      }
      if (node && node.e) feedGhost(G, null, true);
    }
  }
  /** every ghost to THE WORLD's tick (ghosts.js: no new hop assumed · a late hop catches up · a death only once confirmed) */
  function stepGhosts(target) {
    const now = performance.now();
    for (const G of ghosts.values()) stepGhost(G, course, target, now);
  }
  /** (the pass's own check, a local emulator page only) every DRAWN ghost = the engine's state at the world's tick (`air` / `held` counted) */
  function probe(list, F, wt) {
    for (const G of F ? [...list, F] : list) {
      const r = G.run;
      if (isOver(r)) { G.wasOut = true; continue; }
      if (G.wasOut) watch.undead++;
      watch.n++;
      if (G.held) { watch.held++; continue; }
      if (G.vis) { watch.air++; continue; }
      if (r.t !== wt) { watch.late++; continue; }
      const L = course.lane(r.st === 'hop' && r.k * 2 < 8 ? r.fy : r.st === 'hop' ? r.ty : r.y), x = Math.floor(kidAt(r).x * 1000);
      if (L.type !== 'water' && laneHit(L, wt, x)) watch.car++;
      if (r.st === 'idle' && L.type === 'water') { if (logUnder(L, wt, r.x) < 0) watch.water++; else watch.logs++; }
    }
  }
  /** who is still in, as far as this phone can tell: a ghost whose run goes on and whose own end has not been signalled */
  function inPlay(G, runs) { return !isOver(G.run) && !(runs && runs[G.uid] && runs[G.uid].e); }
  /** THE LIVE ORDER (the top corner): name + lanes, best first; OUT = the cross in place of the colour dot + a struck name (never colour alone) */
  function drawOrder(g, runs) {
    const rows = Object.keys(g.participants || {}).map(u => {
      const G = ghosts.get(u), me = u === uid, e = runs && runs[u] && runs[u].e;
      const lanes = me ? run.best : Math.max(G ? G.run.best : 0, e ? Number(e.l) || 0 : 0);
      return { u, me, lanes, out: me ? isOver(run) : !!e || (!!G && isOver(G.run)), name: nameOf(u), c: colorHex(((st.players && st.players[u]) || {}).color) };
    }).sort((a, b) => b.lanes - a.lanes || (a.u < b.u ? -1 : 1));
    const key = rows.map(r => `${r.u}:${r.lanes}:${r.out ? 1 : 0}:${r.u === followUid && watching ? 1 : 0}`).join('|');
    if (key === orderKey) return;
    orderKey = key;
    orderEl.replaceChildren(...rows.map(r => h('li', { class: [r.me ? 'is-me' : '', r.out ? 'is-out' : '', watching && r.u === followUid ? 'is-watched' : ''].filter(Boolean).join(' ') || null, style: { '--c': r.c } },
      h('i.jw-order-dot', { 'aria-hidden': 'true' }), h('span.jw-order-n', r.name), h('b', String(r.lanes)), r.out ? h('span.jw-order-out', 'OUT') : null)));
  }
  /** 3 · 2 · 1 · GO — from the match's own tick 0 once the first GO has landed (till then the count the host set) */
  function drawCount(g) {
    const t0 = course !== START ? go : g.playAt, left = t0 - srvNow();
    const txt = g.phase === 'final' || left < -700 ? '' : left <= 0 ? 'GO' : left > 3000 ? '' : String(Math.ceil(left / 1000));
    const key = course === START && left <= 0 ? 'GET READY' : txt;
    if (key === countKey) return;
    // THE NAMES AT THE START: through the 3 · 2 · 1 every name shows ONCE, lined up; gone at GO
    const counting = /^[123]$/.test(key) || key === 'GET READY';
    if (counting) {
      const us = Object.keys(g.participants || {}).sort((a, b) => (a === uid ? -1 : b === uid ? 1 : a < b ? -1 : 1)), rk = us.join('|');
      if (rk !== rosterKey) { rosterKey = rk; rosterEl.replaceChildren(...us.map(u => h('span', { class: u === uid ? 'is-me' : null, style: { '--c': colorHex(((st.players && st.players[u]) || {}).color) } }, nameOf(u)))); }
    }
    rosterEl.classList.toggle('is-on', counting);
    countKey = key; countEl.textContent = key; countEl.className = `jw-count${key === 'GO' ? ' is-go' : key.length > 2 ? ' is-wait' : ''}`;
    if (key && key.length <= 2) { countEl.classList.remove('is-pop'); void countEl.offsetWidth; countEl.classList.add('is-pop'); }
  }
  /** whom the camera follows: the player picked by a tap while they are in — else THE LEADER (the farthest still in; nobody in → the farthest) */
  function chooseFollow(runs) {
    const all = [...ghosts.values()].filter(G => !G.behind), live = all.filter(G => inPlay(G, runs));
    if (followPick && live.some(G => G.uid === followPick)) return followPick;
    followPick = '';
    const pool = live.length ? live : all;
    let best = null;
    for (const G of pool) if (!best || G.run.best > best.run.best || (G.run.best === best.run.best && G.uid === followUid)) best = G;
    return best ? best.uid : '';
  }
  /** a tap while watching: the next player still in */
  function nextFollow() {
    if (!watching || final || callEl) return;
    const runs = runsNow(), live = [...ghosts.values()].filter(G => inPlay(G, runs)).sort((a, b) => b.run.best - a.run.best || (a.uid < b.uid ? -1 : 1));
    if (live.length < 2) return;
    const i = live.findIndex(G => G.uid === followUid);
    followPick = live[(i + 1) % live.length].uid;
  }
  /** the line over the watcher's view: who they watch · their call · what the room waits for */
  function drawWatch(g, runs) {
    let txt = '';
    if (watching && !final) {
      const live = [...ghosts.values()].filter(G => inPlay(G, runs)), F = ghosts.get(followUid);
      if (live.length && F) txt = `WATCHING ${F.name}${live.length > 1 ? ' · TAP FOR THE NEXT' : ''}`;
      else {
        // (everyone seen is out: the room waits for an end not yet arrived — a dropped signal gets its time)
        const wait = Object.keys(g.participants || {}).filter(u => !(runs && runs[u] && runs[u].e) && !(u === uid && wroteE));
        txt = g.unproven ? 'WAITING FOR THE END' : wait.length ? `WAITING FOR ${nameOf(wait[0])}${wait.length > 1 ? ` + ${wait.length - 1}` : ''} · NO SIGNAL` : 'THE END';
      }
      if (callLine) txt += ` · ${callLine}`;
    }
    if (txt === watchKey) return;
    watchKey = txt; watchEl.textContent = txt;
  }
  /** OUT in a match: the cause in neon words over the scene for a moment, then Call the Winner (two or more still in), then watching */
  function afterOut(g, runs) {
    liveRuns = runs;
    const since = performance.now() - overAt;
    const ship = run.st === 'taken';   // (H6A — THE MOTHERSHIP = A FINISH LINE: its gold card, once the arrival has been seen)
    if (!outCard && mine(g) && since < 60000 && overAt > 0 && (!ship || since > 1500)) {
      outCard = h(`div.jw-outcard${ship ? '.is-ship' : ''}`, h('div.jw-outcard-k', ship ? 'THE FINISH LINE' : 'OUT'), h('div.jw-fin-cause', `${ship ? 'YOU ' : ''}${lineOf(run, course)}`), h('div.jw-outcard-n', `${run.best} ${run.best === 1 ? 'LANE' : 'LANES'}`));
      overEl.append(outCard);
      setTimeout(() => { if (outCard) outCard.classList.add('is-gone'); }, ship ? 3600 : 2300);
    }
    if (!watching) { watching = true; night.resetKid(); }
    root.classList.add('is-watching');
    if (!callDone && mine(g) && run.st === 'out' && since > 1500 && g.phase === 'play' && !g.unproven && wroteE) {
      callDone = true;
      const cands = [...ghosts.values()].filter(G => inPlay(G, runs)).map(G => G.uid), made = runs && runs[uid] && runs[uid].k;
      const path = `${nodePath()}/k`;
      // (THE POLISH PASS — THE LATE k WRITE: docs/jaywalk.md)
      callEl = showCall({ canPick: u => !(liveRuns && liveRuns[u] && liveRuns[u].e != null), expect: 'jaywalk call: the match moved on before the pick landed', overlay: overEl, game: g, st: { live: { calls: made ? { [uid]: made } : {} } }, me: uid, player: u => st.players[u] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' }, candidates: cands, path,
        line: u => { const G = ghosts.get(u), n = G ? G.run.best : 0; return `${n} ${n === 1 ? 'LANE' : 'LANES'}`; }, intro: n => `${n} still hopping — who goes the farthest? A right call earns game-night points.`,
        ended: () => !st.game || st.game.phase !== 'play' || st.game.matchId !== matchId, onState: msg => { callLine = msg === 'NO CALL' ? '' : msg; callEl = null; }, isDestroyed: () => gone });
    }
  }

  // ---- J1 — THE MATCH MOMENTS (moments.js + moments-view.js): every OUT from that player's OWN end — their node's `e`, this phone's own
  // engine — never the host's state (an honest END GAME never shows a fake OUT)
  // (THE FRESH-EYES REVIEW: only a player with an on-time GO is in the moments — a seat that never GOes is never a duellist; a run the
  //  host's own rule calls over without its `e` (a phone that quit / died mid-run: director.js#liveOf — idle-out, never the host's word) is
  //  a QUIET end: no banner, no sound, it just leaves the count)
  function pumpMoments(g, runs) {
    const g0 = firstGo(runs), ids = Object.keys(g.participants || {}).filter(u => u === uid ? mine(g) && (!runs[u] || onTime(runs[u], g0) || !goOf(runs[u])) : onTime(runs[u], g0)), ends = {}, lanes = {};
    let live = null;
    try { live = new Set(liveOf({ code, matchId, tree: runs, now: srvNow(), online: null }).uids); } catch { live = null; }
    for (const u of ids) {
      const e = runs[u] && runs[u].e, G = ghosts.get(u);
      ends[u] = e || (u !== uid && live && !live.has(u) ? { w: 'quiet', l: G ? G.run.best : 0 } : null);
      lanes[u] = u === uid ? run.best : Math.max(G ? G.run.best : 0, e ? Number(e.l) || 0 : 0);
    }
    const own = mine(g) && run && isOver(run) ? { w: run.st === 'taken' ? 'taken' : run.cause, l: run.best } : null;
    mom.pump({ ids, me: uid, ends, mine: own, lanes, quiet: !!outCard && !outCard.classList.contains('is-gone') });
  }
  /** where a fallen ghost lies on the stage now: [x, y, a cell's width] (px) — null when it is not over, taken, or off the screen */
  function ghostAt(u) {
    const G = ghosts.get(u);
    if (!G || !isOver(G.run) || G.run.st === 'taken' || !night) return null;
    const x = G.run.x / FP, y = G.run.y + 0.5, p = night.project(x, y), sx = p[0], sy = p[1], q = night.project(x + 1, y)[0];
    if (!(sx > 0.03 && sx < 0.97 && sy > 0.12 && sy < 0.96)) return null;
    return [sx * stageW, sy * stageH, Math.abs(q - sx) * stageW];
  }

  // ---- the frame
  function frame(now) {
    if (gone) return;
    raf = requestAnimationFrame(frame);
    // (H5B — the GAME LOOK is read LIVE: it re-themes this screen at once)
    if (night && root) { const lk = lookNow(); if (lk !== look) { look = lk; night.setLook(lk); root.dataset.look = lk; } }
    const dt = last ? Math.min(250, now - last) : 16.7;
    last = now;
    if (!night || document.visibilityState === 'hidden') return;
    const t0 = performance.now(), g = st.game;
    let a = 0, c = null;
    if (isMatch && now - lastPump > 100) { lastPump = now; syncMatch(g); }
    if (mode !== 'wait') c = tickNow();
    if (mode === 'run') {
      if (bot && !queue.length && !isOver(run) && c.t >= 0) { const b = bot(run, course); if (b) hop(b); }
      let n = 0;
      while (run.t < c.t && !isOver(run) && n++ < CATCH_UP) tick();
      a = isOver(run) || run.t < c.t || c.t < 0 ? 0 : c.a;
      flush(false);
      if (isOver(run)) onOver();
      else if (sndOn && now - awakeAt > 1000) { awakeAt = now; awake(true); }   // (THE SOUND SYNC: the lease, renewed while the run is live)
    }
    let drawRun = run, extra = null;
    if (isMatch && c) {
      const runs = runsNow();
      if (!revealed && srvNow() >= go - 260) { revealed = true; night.setReveal(1); }
      // THE WORLD's TICK this frame (H4B): while this phone's kid runs, HIS (a stall is caught up over a few frames — the cars with him);
      // once he is out / for a watcher, the clock's. The ghosts are stepped to it and the scene draws every car + log at it.
      const alive = mode === 'run' && !isOver(run), wt = alive ? run.t : Math.max(0, c.t), wa = alive ? a : c.t < 0 ? 0 : c.a;
      stepGhosts(wt);
      if (mode === 'over') afterOut(g, runs);
      const held = performance.now() - overAt > hold();   // (the hit is seen first — the kid stays his own colour through it)
      if (watching && held) {
        const f = chooseFollow(runs);
        if (f !== followUid) { followUid = f; const F = ghosts.get(f); if (F) { night.setKidColor(colorHex(((st.players && st.players[f]) || {}).color)); night.resetKid(); } }
      }
      const F = watching && held ? ghosts.get(followUid) : null;
      if (F) { drawRun = F.run; a = isOver(F.run) || F.held || F.run.t < wt ? 0 : wa; }
      const list = [];
      for (const G of ghosts.values()) if (G !== F && !G.behind) list.push(G);
      extra = { ghosts: list, t: wt + wa, a: wa, off: F ? F.vis : null, own: drawRun === run };
      if (TEST) probe(list, F, wt);
      drawOrder(g, runs); drawWatch(g, runs);
      if (mom && runs && course !== START && c && c.t >= 0 && !root.classList.contains('is-over')) {   // (never behind the podium: no moment's sound over it)
        if (now - momAt > 100) { momAt = now; pumpMoments(g, runs); }
        mom.frame(now, ghostAt);
      }
    }
    if (isMatch || D) drawCount(g);
    drawLines(mine(g) && drawRun === run);
    night.draw(drawRun, course, a, dt, extra); duckMoment();
    if (shotAt && performance.now() >= shotAt) takeShot();
    // the ghosts' name tags: each over its kid; two that would sit on each other (everyone on the start cell) stack upward
    // (H5B's add-on — THE GHOSTS STOP BLOCKING YOU: no tag through the count (the names are lined up — the roster); a ghost NEAR YOU
    //  is faint and has no tag (night.js: `tag` = null); ghosts on the same / touching squares share ONE tag — the leader's name + "+N")
    const placed = [], counting = !!rosterEl && rosterEl.classList.contains('is-on');
    if (extra) {
      const shown = counting ? [] : extra.ghosts.filter(G => G.tag), lead = new Map();
      for (const q of tagGroups(shown.map(G => ({ id: G.uid, x: G.run.x / FP, y: G.run.y, best: G.run.best, name: G.name })))) lead.set(q.lead, q.text);
      for (const G of ghosts.values()) {
        const text = lead.get(G.uid), tg = text ? G.tag : null;
        if (tg) { while (placed.some(q => Math.abs(q[0] - tg[0]) < 84 && Math.abs(q[1] - tg[1]) < 19)) tg[1] -= 20; placed.push(tg); if (text !== G.tagText) { G.tagText = text; G.tagEl.textContent = text; } }
        const key = tg ? `${Math.round(tg[0])},${Math.round(tg[1])}` : '';
        if (key !== G.tagKey) { G.tagKey = key; if (tg) { G.tagEl.style.transform = `translate3d(${Math.round(tg[0])}px,${Math.round(tg[1])}px,0) translate(-50%,-100%)`; G.tagEl.style.opacity = '1'; } else G.tagEl.style.opacity = '0'; }
      }
    }
    if (!final && !localEnd) { tiers.sample(now, performance.now() - t0); if (!pinned) tiers.tick(now); }   // (only while the scene is DRAWN: behind an end screen it rests — 8 easy seconds there stepped the tier up for the next run)
    if (TEST && frames.length < 20000) { frames.push(dt); cost.push(performance.now() - t0); stamps.push(now); }
    const shownBest = watching && drawRun !== run ? drawRun.best : run.best;
    if (shownBest !== lanesShown) {
      lanesShown = shownBest; setNum(lanesEl, shownBest);
      if (shownBest > 0) { popN ^= 1; lanesEl.classList.remove('is-pop', 'is-pop2'); lanesEl.classList.add(popN ? 'is-pop2' : 'is-pop'); }   // (two names, one animation: it restarts with no layout read in the frame)
    }
    if (markUntil && now > markUntil) { markEl.textContent = ''; markUntil = 0; }
    if (arriveEl && arriveEl.on() && !arriveNow()) arriveEl.hide();   // (the Mothership's warning / the run's end takes the top: the banner goes at once — never stacked)
    if (mode === 'over' || (isMatch && g && g.phase === 'final')) endScreen();
    { const RH = globalThis.__nsRunHold; if (RH && (RH.on || RH.wait) && !holdsRun()) pingRouter(); }   // (THE CONSOLE FIX: the run is over + written — follow the room)
  }

  // ---- the end
  function endScreen() {
    const g = st.game;
    if (isMatch) {
      // (the match is over — the host's step: the podium for everyone)
      // (someone still standing at 6:00: the podium waits THE MOTHERSHIP's lift out)
      if (!g || g.phase !== 'final' || final || runLive()) return;   // (THE CONSOLE FIX: a live proven run of this phone's own is played out first)
      { const RH = globalThis.__nsRunHold; if (RH && RH.on) return; }   // (… the room moved on: no podium for a match it left — the phone follows it)
      const ship = mode === 'over' && Object.values(g.results || {}).some(r => r && r.x) && tickNow().t < MODES.match.cap + SHIP_SEEN;
      if (ship || (mode === 'over' && performance.now() - overAt < hold())) return;
      // (… and a rival's run still LIVE — the host's `final` came early: this phone keeps watching; the cap ends the wait)
      if (!g.unproven && liveWait.wait({ code, matchId, runs: runsNow(), presence: st.presence, now: srvNow(), skip: uid }).length) return;
      showFinal(liveWait.waited() ? scoredNow(g) : g);
      return;
    }
    if (performance.now() - overAt < hold()) return;
    if (D) { if (!localEnd) { localEnd = D.end(isOver(run), lineOf(run, course), run.sp.slice()); root.classList.add('is-over'); root.append(localEnd); night.rest(true); } return; }
    if (proven) {
      if (g && g.phase === 'final') { if (!final) { hideLocalEnd(); showFinal(g); } }
      else if (!final && !localEnd && performance.now() - overAt > 6000) showLocalEnd(true);   // (the end has not reached the room — no signal: never a frozen screen)
      return;
    }
    if (!localEnd) showLocalEnd(false);
  }
  /** the console's podium frame; its body = this game's end screen (victory.js#finalScene) */
  function showFinal(g) {
    const solo = soloGame(g);
    if (callEl) { callEl.remove(); callEl = null; }
    if (outCard) { outCard.remove(); outCard = null; }
    final = createFinal({ game: g, rows: finalRows(g, code), players: st.players, me: uid, presence: st.presence, kicker: solo ? 'JAYWALK · SOLO' : 'JAYWALK · MATCH', mode: solo ? 'SOLO' : 'MATCH', winnerLine: nm => `${nm} WENT THE FARTHEST` });
    finalWrap = h('div.jw-final', final.el);
    root.classList.add('is-over'); root.append(finalWrap); night.rest(true);   // (H6B: the scene rests behind the end screen)
  }
  /** a SOLO run's own end: UNPROVEN (no proof → the match can't reach the console's podium) — or proven but the signal is gone (`waiting`:
   *  the run is in the phone's queue and counts when it lands; the podium takes this screen's place by itself) */
  function showLocalEnd(waiting) {
    const body = h('div.final-body.jw-fin-local');
    buildEnd(body, { line: lineOf(run, course), lanes: run.best, note: waiting ? 'NO SIGNAL — YOUR RUN COUNTS WHEN IT IS BACK' : 'NOT COUNTED — NO LINE TO THE BOARD' });
    { const SC = splitsCard(run.sp); if (SC.el) body.append(SC.el); }   // (J1 — YOUR SPLITS: every run's end card — the phone's own engine; no server answer here)
    // (PLAY AGAIN here = another UNPROVEN run: this match's one GO is spent or refused)
    const again = waiting ? null : h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => { hideLocalEnd(); reset(); asked = true; unproven('again'); } }, h('span', 'PLAY AGAIN'));
    const PN = globalThis.__nsPlayNow, soloRoom = !!(PN && PN.isSolo && PN.isSolo());
    const leave = h(`button.btn.${waiting ? 'btn-primary' : 'btn-ghost'}.btn-block`, { type: 'button', onclick: () => { leave.classList.add('is-busy'); Promise.resolve(soloRoom ? PN.leave() : backToLobby()).catch(() => leave.classList.remove('is-busy')); } }, h('span', soloRoom ? 'BACK TO THE CITY' : 'BACK TO THE ROOM'));
    localEnd = h('div.jw-final.jw-local', h('div.jw-local-in', body, h('div.jw-local-foot', again, leave)));
    root.classList.add('is-over'); root.append(localEnd); night.rest(true);
  }
  function hideLocalEnd() { if (localEnd) { localEnd.remove(); localEnd = null; root.classList.remove('is-over'); } }

  /** THE MATCH, from the room's state (+ a light pump from the frame: the count's own moments are not state changes) */
  function syncMatch(g) {
    if (!g || !night) return;
    const runs = runsNow();
    if (mine(g) && !asked && !haveGo && (g.phase === 'play' || (g.phase === 'count' && srvNow() >= g.playAt - GO_EARLY_MS))) askGoMatch();
    // the course + tick 0 (H4B — logic.js#startOf: THE NODES ARE THE TRUTH): THE FIRST GO among the proof nodes the SERVER sent — in the
    // count and in `play` alike, exactly what the server's own count derives; the game's own only with no node to read (an UNPROVEN match)
    const S = startOf(g, runs, code);
    // (J2 — COURSE RULES v2: the match's version = the one in force at THE FIRST GO; this phone writes it beside its own GO once the first
    //  GO is known (`cv` — the rules take it once; the host + the server check it). Its own node's word wins (a refusal: no `cv` → v1 in
    //  THE GRACE — the version the server replays this node on)
    const myN = runs && mine(g) ? runs[uid] : null, E = S ? matchVersion(S) : 1;
    if (S && runs && myN && myN.go > 0 && myN.cv == null && !cvAsked && mine(g)) {
      cvAsked = true; const m = matchId, p = `${nodePath()}/cv`;
      expectRefusal(p, 'jaywalk cv: the rules are not re-published yet (J2) — the match plays v1');
      dbSet(dbRef(p), E).then(() => { if (!gone && m === matchId) { cvMine = E; sync(); } }, () => { if (!gone && m === matchId) { cvMine = runVersion(null, E, myN.go) || E; sync(); } });
    }
    // (the course is taken ONCE its version is SETTLED — a watcher / an unproven match: the version in force; a player: its node's cv, or its
    //  own write's answer; until then the count runs on (by tick 0 the version in force is taken — a slow answer may still move it))
    const late = !!myN && goOf(myN) > 0 && S && !onTime(myN, S.g0);
    //  (its OWN write still in the air: the answer, never the mirror — the database shows a write locally before the server has taken it)
    const V = !mine(g) || g.unproven || late ? E : cvAsked ? cvMine || (S && srvNow() >= S.playAt ? E : 0) : myN && myN.cv != null ? nodeVersion(myN, E) || E : S && srvNow() >= S.playAt ? E : 0;
    // (THE PROOF PASS — the inbox, Nov 20 ~12:49 am (2), HIGH RISE S4B's own fix: never adopted from the game ALONE while the proof mirror
    //  is still on its way — a refresh mid-match took the match with NO hops of its own replayed. A proven match in `play` always has a
    //  node to read: wait for it.)
    if (S && V && (course.seed !== S.seed || go !== S.playAt || course.cv !== V) && (runs || g.unproven)) { if (TEST) adopts.push({ at: Math.round(srvNow() - S.playAt), seed: S.seed, t: run.t, hops: log.length, cv: V }); adoptMatch(S, runs, V); }
    // (THE PROOF PASS: a GO of this phone's own that landed LATER than the window after THE FIRST GO is no run — the server drops it
    //  (core/proof.js#onTime): nothing is written for it. On the re-published rules such a GO is refused.)
    const myNode = runs ? runs[uid] : null;
    lateGo = !!myNode && goOf(myNode) > 0 && !onTime(myNode, firstGo(runs));
    // (THE CONSOLE FIX: once proven, the host's game can not take it back — a participants list without this phone, or `unproven` written
    //  mid-run, stopped its chunks + its end: the run was cut. The tree says who played: this phone's on-time GO)
    proven = !lateGo && ((haveGo && !g.unproven && mine(g)) || everProven);
    if (proven) everProven = true;
    // (THE PROOF PASS — A HOST HICCUP AT GO, the take-back (HIGH RISE's REVIEW FIX A): a run that ENDED while the match was marked
    //  unproven never wrote its `e` — once proven again the end goes up now: Call the Winner opens, the match does not wait 18 s)
    if (proven && mode === 'over' && !wroteE && run && isOver(run)) sendEnd();
    if (course !== START && runs) feedGhosts(g, runs);
  }
  function sync() {
    const g = st.game;
    if (!g || !night) return;
    if (isMatch) { syncMatch(g); if (final) final.refresh(); return; }
    if (D) { if (!asked) { asked = true; D.start().then(r => { if (!gone && r) adopt(r.go, null, true, r.seed, r.cv === 2 ? 2 : 1); }, () => {}); } return; }
    if (g.phase === 'play' && mine(g) && soloGame(g)) askGo();
    // (a refresh on the podium: the run in the node, replayed to its end, stands behind the frame)
    if (g.phase === 'final' && mode === 'wait' && mine(g) && soloGame(g) && st.liveKey === liveKeyFor(g)) {
      const node = st.live && st.live.runs ? st.live.runs[uid] : null;
      asked = true; clearTimeout(goTimer);
      if (node && node.go > 0) { adopt(node.go, node.c, true, null, cvOfNode(node)); wroteE = true; mode = 'over'; overAt = -1e9; } else { proven = true; mode = 'over'; overAt = -1e9; }
    }
    if (final) final.refresh();
  }
  /** back on screen: the clock re-read (a suspended tab's own timer may have stood still) — GO stays the run's tick 0 */
  const onVis = () => { last = 0; if (document.visibilityState !== 'hidden') anchor(); else { awakeAt = 0; awake(false); } };

  return {
    mount(el, state) {
      st = state; code = state.code; uid = state.uid; matchId = state.game ? state.game.matchId : '';
      const g = state.game;
      D = state.jwDaily || null; isMatch = !D && !!g && !soloGame(g);
      if (D) D.stop = () => { if (mode === 'run' && !isOver(run)) onOver(); };
      build(el);
      if (!night) return;
      reset();
      if (isMatch) root.classList.add('is-match');
      if (TEST) globalThis.__jwGame = {
        state: () => ({ mode, proven, haveGo, matchId, holds: holdsRun(), liveWaited: liveWait.waited(), go, seed: course.seed, cv: course.cv || 0, t: run.t, st: run.st, y: run.y, best: run.best, cause: run.cause, over: isOver(run), hops: log.length, sent: W ? W.state().sent : 0, chunks: W ? W.state().chunks : 0, acked: W ? W.state().acked : 0, lateGo, final: !!final, localEnd: !!localEnd, scenes: scenesMade,
          lines: { best: lines.best, friends: lines.friends.map(f => `${f.n} ${f.v}`), record, shown: lineKey, flash: lanesEl.classList.contains('is-flash'), gold: lanesEl.classList.contains('is-record') },
          isMatch, watching, follow: followUid, moments: mom ? mom.info() : null, call: !!callEl, callLine, count: countKey, watch: watchKey, order: [...orderEl.children].map(li => li.textContent), outs: [...orderEl.querySelectorAll('.is-out')].length,
          ghosts: [...ghosts.values()].map(G => ({ uid: G.uid, t: G.run.t, y: G.run.y, best: G.run.best, st: G.run.st, hops: G.log.length, tag: !!G.tag, held: G.held, done: G.done, behind: G.behind, fade: +(G.fade || 0).toFixed(2), x: G.run.x / FP, name: G.name, shown: !!G.tagKey, text: G.tagEl.textContent })),
          roster: rosterEl && rosterEl.classList.contains('is-on') ? [...rosterEl.children].map(e => e.textContent) : [],
          adopts: adopts.slice(), seen: { ...watch }, g0: st.game ? st.game.g0 || 0 : 0,
          snd: { cues: SFX.cues(), wanted: SFX.wanted().map(q => q.id), by: SFX.totals().by, ducked: ducked != null },
          arrive: arriveEl ? arriveEl.text() : '', tier: night ? night.tier() : -1, info: night ? night.info() : null, kidPx: night ? night.kidHeightPx() : 0 }),
        hop, syncs: () => syncs.slice(), frames: () => frames.slice(), cost: () => cost.slice(), clearFrames() { frames.length = 0; cost.length = 0; stamps.length = 0; },
        /** every frame so far: [ms after tick 0, the frame's length, its own work] — THE START's measure */
        timeline: () => { const z = t0perf + (go - t0srv); return frames.map((d, i) => [Math.round(stamps[i] - z), +d.toFixed(1), +cost[i].toFixed(1)]); },
        setTier(t) { pinned = t != null; if (t != null) tiers.set(t); },
        bot(on, o) { if (!on) { bot = null; return; } lazyImport(import('./bot.js'), './bot.js').then(B => { bot = B.greedyBot({ seed: `${course.seed}${uid}`, ...(o || {}) }); }); },
        follow: nextFollow,
      };
      document.addEventListener('visibilitychange', onVis);
      sync();
      raf = requestAnimationFrame(frame);
    },
    holdsRun,
    update(state) { st = state; if (matchLeft()) lateProof('seen');   // (CITY I: from the moment this phone sees the match end, a chunk / e still in flight is an expected refusal)
      if (night) sync(); },
    unmount() {
      gone = true; cancelAnimationFrame(raf); clearTimeout(goTimer);
      if (offGL) offGL();   // (BEFORE THE FLIP: off BEFORE any destroy() — a deliberate teardown is never a lost context)
      document.removeEventListener('visibilitychange', onVis);
      awake(false);   // (THE SOUND SYNC: a hold never outlives the view)
      if (mode === 'run' && run && !isOver(run)) flush(true);   // (a QUIT mid-run: what was hopped is in the proof)
      if (W) W.close();   // (… what is logged leaves now, in order; nothing is tried again once the view is gone)
      if (offControls) offControls();
      if (final) final.destroy();
      quiet();
      try { SFX.stopAll(); } catch { /* silent */ }
      if (night) {
        // (PLAY AGAIN's remount (INSTANT AGAIN): the scene kept warm; anything else frees it at once)
        if (performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(play, night); else { night.destroy(); keepShot(null); try { SFX.release(); } catch { /* silent */ } }   // (leaving: the run's picture + ≈ 15 MB of decoded sounds are let go)
      }
      if (arriveEl) { arriveEl.destroy(); arriveEl = null; }
      if (mom) { mom.destroy(); mom = null; } if (offSize) { offSize(); offSize = null; }
      if (root) root.remove();
      root = null; night = null;
    },
  };
}
