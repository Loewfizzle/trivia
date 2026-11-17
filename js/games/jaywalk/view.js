// JAYWALK — THE GAME's SCREEN (H3 — THE SOLO RUN · H4 — THE MATCH; docs/jaywalk.md "THE SOLO GAME" + "THE MATCH"). The night look
// (night.js — the same scene the lab draws), the kid, the controls + the sounds, inside the console's game frame (THE CITY PAUSE, the
// corner menu, the station's music). Renders from the room's state; the RUN itself is this phone's own pure engine, played ON THE SERVER's
// CLOCK — ONE LIFE: the first hit ends it.
//   · GO (a SOLO run): the moment the run is on screen the phone writes its proof node's `go` (rooms/{CODE}/jw/{matchId}/{uid}/go — the
//     rules: the SERVER's time, once) and reads it back → THE COURSE IS PICKED AFTER GO (logic.js#seedOf). Until it lands the screen shows
//     THE START (the kid on the calm opening lanes, the rest still in the dark — never a blank frame).
//   · GO (a MATCH): 3 · 2 · 1 — every phone writes its own `go` in the count's last 2 s; THE FIRST GO to land picks the course and sets
//     tick 0 (that time + 2 s) for everyone (logic.js#startOf) — the same course, the same clock, on every phone. H4B: the GO is a
//     TRANSACTION never applied locally — a phone's own estimate of the server's time is never in its mirror, so it can never pick a course.
//   · tick 0 = GO; the engine is stepped to the server clock's tick every frame (a stall / a hidden page is caught up — the rules never
//     skip a tick, and a run never pauses: a pause would be a slow-motion hole)
//   · THE PROOF: the hop log goes up in chunks (a second apart solo, AT ONCE in a match — H4B: ≤ CLOCK.flushMatchMs), each stamped by the SERVER on arrival
//     (c/{i} = { s, at }); at the end the last chunk + `e` (a signal). The score is THE JUDGE's replay of that node — never this phone's
//     claim. Offline, the chunks queue and land together when the signal is back: THE DROPPED SIGNAL never costs the run.
//   · THE GHOSTS (a match — H4B, ghosts.js): the other players' kids — their hop logs (the same proof nodes, mirrored) stepped through the
//     same engine TO THE WORLD's OWN TICK (no new hop assumed: they stand / ride their log with it); a late hop catches up in a quick hop;
//     a death only once their own end confirms it. See-through, their colour, their name over them; never colliding.
//   · OUT (a match) = SPECTATE: the hit is seen, then Call the Winner (the match kit's), and the camera follows the LEADER's ghost (a tap
//     = the next player); the live order (top corner) shows everyone's lanes. The host's step ends the match; the podium = the console's.
//   · a refused GO (no signal, rules not yet published) = an UNPROVEN run: it still plays, on a seed of its own, and is never counted.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { dbRef, set as dbSet, get as dbGet, update as dbUpdate, runTransaction, serverTimestamp, serverNow, expectRefusal } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { liveKeyFor } from '../registry.js';
import { createFinal } from '../../ui/final.js';
import { backToLobby } from '../../host.js';
import { createTiers } from '../kit/tiers.js';
import { showCall } from '../kit/call.js';
import { TICK_HZ, CLOCK } from './tuning.js';
import { createCourse, laneHit, logUnder, gateName } from './course.js';
import { createRun, step, isOver, canLog, kidAt } from './engine.js';
import { packLog, unpackLog, logFromChunks } from './replay.js';
import { seedOf, startOf } from './logic.js';
import { createGhost, resetGhost, feedGhost, stepGhost } from './ghosts.js';
import { wireControls } from './controls.js';
import { createNight } from './night.js';
import { getPref, setPref } from './lab-prefs.js';
import { ZOOMS, ZOOM, ANGLES, ANGLE } from './camera.js';
import * as SFX from './sfx.js';
import { createCues, cuesAt } from './cues.js';
import { duckMusic, musicDuckLevel } from '../../audio/music.js';
import { runLine } from './causes.js';
import { buildEnd, finalRows } from './victory.js';
import { keepShot } from './shot.js';
import { setNum, prepNums } from './numerals.js';
import { BOARD, TABLE_KEEP_MS, parseTable, linesFor, isRecord, crossedFriends } from './lines.js';

/** how long the hit is seen before the end screen / the spectator's view covers it (ms) */
export const END_HOLD_MS = 850;
/** GO's answer is waited this long before a SOLO run goes on UNPROVEN (never a stuck start) */
export const GO_WAIT_MS = 4000;
/** a MATCH: this phone writes its GO this long before the count's end (the rules open the window 2 s before it) */
export const GO_EARLY_MS = 1800;
/** the frame of the moment you went out (THE SHARE IMAGE) is taken this long after the hit */
const SHOT_MS = 460;
/** the most ticks one frame catches up (a long stall is spread over a few frames; the rules never skip one) */
const CATCH_UP = 900;
const ZERO = Object.freeze([0, 0, 0, 0, 0, 0, 0, 0, 0]);
/** THE START (before the course is known): plain calm ground — what lanes 0–3 are on EVERY course */
const START = Object.freeze({ seed: 'start', lane: i => ({ i, type: 'grass', heat: 0, mark: null, ufo: null, obs: ZERO }) });

// THE SCENE STAYS WARM over PLAY AGAIN (the console's INSTANT AGAIN remounts the view for the next solo run): the night scene — its WebGL
// context, its models — is parked for a moment and the next mount takes it back. Any other unmount destroys it at once.
let parked = null;
const unpark = () => { if (!parked) return null; clearTimeout(parked.t); const p = parked; parked = null; return p; };
const park = (play, night) => { if (parked) { clearTimeout(parked.t); parked.night.destroy(); } parked = { play, night, t: setTimeout(() => { if (parked && parked.night === night) { parked = null; night.destroy(); play.remove(); } }, 2500) }; };

// (the pass's own checks — tests/integration/e2e-jaywalk.mjs — on a LOCAL emulator page only: never on the live site)
const TEST = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]emu(?:&|=|$)/.test(location.search || '');
let scenesMade = 0;

// THE LINES' DATA (H4 add-on — lines.js): the SERVER-counted solo bests (yours + your friends' — YOUR TABLE's own read), asked ONCE at
// a run's start and kept a short while (PLAY AGAIN restarts in a second); nothing is asked during a run. /api down = no answer: the
// best the server last told this phone still draws YOUR BEST LINE, and there are no friend lines.
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
const pick = (k, list, d) => { const m = getPref(k, String(d)); return list.map(String).includes(m) ? m : String(d); };
/** HOW A RUN ENDED, in the game's words (causes.js#runLine — the vehicle named is the one the scene drew) */
/** H5B — THE LOOK on this phone now: the console's GAME LOOK (body[data-look] — AUTO · DAY · NIGHT, per phone, live) */
const lookNow = () => (document.body.dataset.look === 'day' ? 'day' : 'night');
const lineOf = (r, course) => runLine(course, { cause: r.cause, y: r.y, x: r.x, end: r.end, lanes: r.best, taken: r.st === 'taken' }, lookNow());
const hexNum = c => parseInt(String(colorHex(c) || '#00f0ff').slice(1), 16) || 0x00f0ff;

export function createView() {
  let root = null, play = null, night = null, tiers = null, offControls = null, raf = 0, st = null, gone = false;
  let lanesEl = null, markEl = null, hintEl = null, finalWrap = null, final = null, localEnd = null;
  let orderEl = null, tagsEl = null, countEl = null, watchEl = null, overEl = null, outCard = null;
  // the run
  let code = '', uid = '', matchId = '', mode = 'wait';   // 'wait' (the course is on its way) · 'run' · 'over' (out / taken / watching)
  let run = null, course = START, log = [], queue = [], go = 0, proven = false, asked = false, goTries = 0, haveGo = false;
  let sent = 0, chunkN = 0, lastFlush = 0, wroteE = false, overAt = 0, goTimer = 0, shotAt = 0, lastPump = 0;
  let t0srv = 0, t0perf = 0, last = 0, markUntil = 0, lanesShown = -1, sndOn = false, bot = null, pinned = false, revealed = false;
  // the match
  const ghosts = new Map();   // uid → ghosts.js#createGhost (conf · run · log · done · held · vis · behind) + { uid, n (chunks read), lastT, hex, name, tagEl, dir, outAt }
  let look = 'night';   // (H5B — the look this screen is drawn in now)
  let cues = createCues(), ducked = null, duckT = 0;   // (H5A — THE WORLD's SOUNDS: cues.js; the music's level before the train ducked it)
  let lines = { best: 0, friends: [] }, record = false, lineKey = '', tableN = 0;   // (THE LINES: your best + your friends' — the server's; record: this run is past your best)
  let isMatch = false, watching = false, followUid = '', followPick = '', callEl = null, callLine = '', callDone = false, orderKey = '', countKey = '', watchKey = '';
  const frames = [], cost = [], stamps = [], adopts = [], watch = { n: 0, car: 0, water: 0, logs: 0, held: 0, air: 0, late: 0, undead: 0 };
  const srvNow = () => t0srv + (performance.now() - t0perf);
  const anchor = () => { t0srv = serverNow(); t0perf = performance.now(); };
  const soloGame = g => !!g && g.mode === 'solo' && Object.keys(g.participants || {}).length === 1;
  const mine = g => !!(g && g.participants && g.participants[uid]);
  const nodePath = () => `rooms/${code}/jw/${matchId}/${uid}`;
  const runsNow = () => (st && st.game && st.liveKey === liveKeyFor(st.game) && st.live && st.live.runs) || null;
  const nameOf = u => String(((st.players && st.players[u]) || {}).name || 'GHOST').toUpperCase();

  function build(el) {
    lanesEl = h('div.jw-lanes'); setNum(lanesEl, 0); prepNums(lanesEl); markEl = h('div.jw-mark', '');   // (THE BIG NUMERALS — numerals.js: room between the digits, a 1 with a foot)
    hintEl = getPref('hint', '') ? null : h('div.jw-hint', 'TAP TO HOP · SWIPE TO STEP');
    orderEl = h('ol.jw-order', { 'aria-label': 'The order' }); tagsEl = h('div.jw-tags', { 'aria-hidden': 'true' });
    countEl = h('div.jw-count', { 'aria-live': 'polite' }); watchEl = h('div.jw-watch'); overEl = h('div.jw-over.mk-theme');
    const had = unpark();
    play = had ? had.play : h('div.jw-play', { role: 'application', 'aria-label': 'Jaywalk — tap to hop, swipe to move' });
    root = h('div.jw-stage.jw-game', play, h('div.jw-blackout'), tagsEl, h('div.jw-hud', lanesEl, markEl), orderEl, countEl, watchEl, hintEl, overEl);
    el.replaceChildren(root);
    const me = (st.players && st.players[uid]) || {};
    try {
      if (!had) scenesMade++;
      night = had ? had.night : createNight(play, { kidColor: colorHex(me.color), zoom: Number(pick('zoom', ZOOMS, ZOOM)), angle: pick('angle', ANGLES, ANGLE), tier: tierMem(), look: lookNow() });
      if (had) { night.setKidColor(colorHex(me.color)); night.resize(); }
      look = lookNow(); night.setLook(look); root.dataset.look = look;   // (H5B — THE DAY LOOK: the scene + this screen's own words follow the phone's GAME LOOK)
    } catch { root.append(h('p.jw-nogl', 'This browser can’t draw the game here (it has no WebGL).')); night = null; return; }
    night.setReveal(0, true);
    // (H4B — THE TIER IS REMEMBERED: a phone that had to step down starts there next time — never the first seconds of every match at a tier it can't hold)
    tiers = createTiers({ apply: t => { if (night) night.setTier(t); if (!pinned) setPref('tier', `${t}:${Math.round(serverNow())}`); }, initial: night.tier() });
    offControls = wireControls(play, { onHop: hop, onAny: nextFollow });
    // the sounds: the SHARED engine's SFX bus (the console unlocked it on a tap long ago); silent if anything fails — audio is polish
    // (H4B — DECODED AHEAD, during the count / the wait for GO: the first hop's sound is ready — never a decode on the first tap)
    try { SFX.fetchSounds(); sndOn = true; Promise.resolve(SFX.decode()).catch(() => {}); } catch { sndOn = false; }
  }

  // ---- THE RUN
  function reset() {
    mode = 'wait'; course = START; run = createRun({ seed: 'start', mode: 'solo' }); log = []; queue = []; go = 0; proven = false; asked = false; goTries = 0; haveGo = false;
    sent = 0; chunkN = 0; lastFlush = 0; wroteE = false; overAt = 0; lanesShown = -1; markUntil = 0; shotAt = 0; revealed = false;
    watching = false; followUid = ''; followPick = ''; callLine = ''; callDone = false; orderKey = ''; countKey = ''; watchKey = '';
    cues = createCues(); quiet();
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
    if (night) night.setReveal(0, true);
    anchor();
  }
  const refused = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => m.reportError(new Error('JAYWALK: the proof node was refused — the run plays UNPROVEN (re-publish database.rules.json: rooms/{CODE}/jw)'), 'rules')).catch(() => {});
  /** GO (a SOLO run): the proof node's first write — the SERVER's time, read back → the course */
  function askGo() {
    if (asked) return;
    asked = true;
    const m = matchId, path = `${nodePath()}/go`, runs = runsNow(), node = runs ? runs[uid] : null;
    if (node && node.go > 0) { adopt(node.go, node.c, true); return; }   // (a refresh / a rejoin mid-run: the run so far is in the node)
    clearTimeout(goTimer);
    goTimer = setTimeout(() => { if (!gone && m === matchId && mode === 'wait') unproven('no answer'); }, GO_WAIT_MS);
    expectRefusal(path, 'jaywalk GO: already written (a rejoin) or the rules are not published yet');
    dbSet(dbRef(path), serverTimestamp()).then(() => dbGet(dbRef(path))).then(snap => {
      if (gone || m !== matchId || mode !== 'wait') return;
      const v = snap.val();
      if (typeof v === 'number' && v > 0) adopt(v, null, true); else unproven('no go');
    }).catch(() => {
      // refused: this run's GO is already there (a rejoin) — take the node as it is; nothing there = the proof can't be written here
      dbGet(dbRef(nodePath())).then(snap => {
        if (gone || m !== matchId || mode !== 'wait') return;
        const n = snap.val();
        if (n && n.go > 0) adopt(n.go, n.c, true); else unproven('refused');
      }).catch(() => { if (!gone && m === matchId && mode === 'wait') unproven('refused'); });
    });
  }
  /** GO (a MATCH): this phone's own `go` — its proof of being there; the FIRST one to land is the match's (logic.js#firstGo). A refusal
   *  (this phone's clock a touch early, a rejoin) is looked at and tried again a few times — never a stuck start: the count runs on */
  function askGoMatch() {
    if (asked) return;
    asked = true;
    const m = matchId, path = `${nodePath()}/go`, runs = runsNow(), node = runs ? runs[uid] : null;
    if (node && node.go > 0) { haveGo = true; return; }
    expectRefusal(path, 'jaywalk GO: already written (a rejoin), a touch early, or the rules are not published yet');
    const again = () => { if (gone || m !== matchId) return; if (goTries++ < 7) setTimeout(() => { asked = false; }, 420); else refused(); };
    // (H4B — a TRANSACTION, never applied locally: until the SERVER's own value comes back this phone's mirror holds no GO of its own —
    //  a `set` shows the phone's ESTIMATE of the server's time at once, and a slow phone would pick the course from it)
    runTransaction(dbRef(path), cur => (cur == null ? serverTimestamp() : undefined), { applyLocally: false }).then(() => { if (m === matchId) haveGo = true; }).catch(() => {
      dbGet(dbRef(path)).then(snap => { if (gone || m !== matchId) return; if (typeof snap.val() === 'number') haveGo = true; else again(); }).catch(again);
    });
  }
  /** the engine caught up to the clock from a node's hop log (a refresh / a rejoin mid-run) */
  function catchUp() {
    if (!log.length) return;
    let i = 0;
    const target = tickNow().t;
    while (!isOver(run) && run.t < target) { let d = ''; if (i < log.length && log[i].t === run.t) d = log[i++].d; step(run, course, d); }
  }
  /** a SOLO course lands: seed = hash(code + matchId + GO) — the run's tick 0 is GO; a node's chunks (a rejoin) are replayed to now */
  function adopt(goAt, chunks, isProof) {
    clearTimeout(goTimer);
    go = goAt; proven = !!isProof;
    const seed = isProof ? seedOf(code, matchId, go) : `u${Math.floor(go).toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
    course = createCourse(seed); run = createRun({ seed, mode: 'solo' });
    const old = chunks ? logFromChunks(chunks) : null;
    log = old || []; sent = log.length; chunkN = chunks ? Object.keys(chunks).length : 0;
    anchor();
    catchUp();
    mode = 'run';
    if (night) night.setReveal(1);
  }
  /** no proof here (no signal, the rules not published): a SOLO run still plays — on its own seed + clock, never counted */
  function unproven(why) {
    if (why === 'refused') refused();
    adopt(serverNow(), null, false);
  }
  /** a MATCH's course lands (THE FIRST GO → the seed + tick 0; in `play` the game's own): the kid stands on it, the engine waits for
   *  tick 0. A rejoin: this player's own log so far is replayed to now. A watcher (not a participant) has no run of their own. */
  function adoptMatch(S, runs) {
    go = S.playAt; course = createCourse(S.seed); run = createRun({ seed: S.seed, mode: 'match' });
    const node = runs && mine(st.game) ? runs[uid] : null, old = node && node.c ? logFromChunks(node.c) : null;
    log = old || []; sent = log.length; chunkN = node && node.c ? Object.keys(node.c).length : 0; queue = [];
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
  function tick() {
    let d = '';
    if (queue.length && canLog(log, run.t, queue[0])) { d = queue.shift(); log.push({ t: run.t, d }); }
    const ev = [];
    step(run, course, d, ev);
    for (const e of ev) {
      if (e.e === 'best') onBest(e.lane);
      // THE ARRIVAL GATEWAY (H5A): the area's name flashes ONCE under the lane count (the loop's laps named: THE DOCKS · LAP 2) + the landmark sound
      if (e.e === 'landmark' && markEl) {
        markEl.textContent = gateName(e.lane); markUntil = performance.now() + 2600;
        markEl.classList.remove('is-flash'); void markEl.offsetWidth; markEl.classList.add('is-flash');
        if (sndOn) { try { SFX.play('landmark'); } catch { /* silent */ } }
      }
      if (sndOn) { try { SFX.onEvent(e); } catch { /* silent */ } }
    }
    // THE WORLD's SOUNDS (H5A — cues.js, PURE): the train's bell + its pass, a car passing, the horn, the lights dying — this phone's
    // own kid's only (a ghost makes no sound), only while he is in
    if (sndOn && !isOver(run)) { try { for (const q of cuesAt(cues, run, course)) { SFX.onCue(q); duck(q.cue); } } catch { /* silent */ } }
  }
  /** the music ducks a little under the train: down with the bell, back up a moment after the pass / the bell's end */
  function duck(cue) {
    if (cue !== 'bell-on' && cue !== 'bell-off' && cue !== 'train-pass') return;
    clearTimeout(duckT);
    const D = SFX.TRAIN_DUCK;
    if (cue === 'bell-off') { duckT = setTimeout(unduck, 250); return; }
    if (ducked == null) { ducked = musicDuckLevel(); duckMusic(Math.min(ducked, D.level), D.inS); }
    if (cue === 'train-pass') duckT = setTimeout(unduck, D.holdMs);
  }
  function unduck() { clearTimeout(duckT); if (ducked != null) { duckMusic(ducked, SFX.TRAIN_DUCK.outS); ducked = null; } }
  /** the world goes quiet (the run ended, a new run, the view left): the bell stops, the music comes back up */
  function quiet() { try { SFX.onCue({ cue: 'bell-off' }); } catch { /* silent */ } unduck(); }
  /** a lane farther than ever this run: YOUR BEST LINE crossed = the run is a NEW RECORD from here (a burst along the line, the new-best
   *  sound, the lane counter flashes gold and stays gold); a FRIEND's line crossed (a solo run) = a small burst + a quiet chime */
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
      if (sndOn) { try { SFX.play('landmark', { vol: 0.4, rate: 1.3 }); } catch { /* silent */ } }
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
  /** THE PROOF: the new hops go up in chunks — each stamped by the server when it ARRIVES (the rules: at === now). Offline they queue
   *  in the database's own client and land together when the signal is back (THE DROPPED SIGNAL — the judge knows a burst from a slowed game) */
  function flush(force) {
    if (!proven || sent >= log.length) return;
    const now = performance.now();
    if (!force && now - lastFlush < (isMatch ? CLOCK.flushMatchMs : CLOCK.flushMs)) return;
    lastFlush = now;
    while (sent < log.length && chunkN < CLOCK.chunks) {
      let n = log.length - sent, s = packLog(log.slice(0, sent + n), sent);
      while (s.length > CLOCK.chunkMax && n > 1) { n = Math.ceil(n / 2); s = packLog(log.slice(0, sent + n), sent); }
      dbSet(dbRef(`${nodePath()}/c/${chunkN}`), { s, at: serverTimestamp() }).catch(() => { /* a refused chunk: the server simply can't count the run */ });
      chunkN++; sent += n;
    }
  }
  /** the run is over: the last chunk, then `e` — the host's step ends the match on it (a signal: never read as a score) */
  function onOver() {
    mode = 'over'; overAt = performance.now(); shotAt = overAt + SHOT_MS; queue = [];
    quiet();
    flush(true);
    if (proven && !wroteE) { wroteE = true; dbUpdate(dbRef(nodePath()), { e: { l: run.best, t: run.bestT, w: String(run.cause || '').slice(0, 12) } }).catch(() => {}); }
  }
  /** THE SHARE IMAGE's frame: the picture a beat after the hit — the kid + what got him — kept on this phone until the next run */
  function takeShot() {
    shotAt = 0;
    const m = matchId, r = run, c = course;
    night.snap(cv => {
      if (!cv || gone || m !== matchId) return;
      keepShot({ matchId: m, canvas: cv, lanes: r.best, line: lineOf(r, c), kidY: night.kidScreenY(), kidX: night.kidScreenX() });
    });
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
  /** (the pass's own check, a local emulator page only) every DRAWN ghost against the world it is drawn in: its state must be the engine's
   *  at the world's tick — never in a car's box, never idle on open water. `air` = mid catch-up (drawn in the air), `held` = standing, unconfirmed */
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
        // (everyone this phone can see is out: the room waits for an end that has not arrived — a dropped signal gets its time)
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
    const since = performance.now() - overAt;
    if (!outCard && mine(g) && since < 60000 && overAt > 0) {
      outCard = h('div.jw-outcard', h('div.jw-outcard-k', run.st === 'taken' ? 'THE MOTHERSHIP' : 'OUT'), h('div.jw-fin-cause', lineOf(run, course)), h('div.jw-outcard-n', `${run.best} ${run.best === 1 ? 'LANE' : 'LANES'}`));
      overEl.append(outCard);
      setTimeout(() => { if (outCard) outCard.classList.add('is-gone'); }, 2300);
    }
    if (!watching) { watching = true; night.resetKid(); }
    root.classList.add('is-watching');
    if (!callDone && mine(g) && run.st === 'out' && since > 1500 && g.phase === 'play' && !g.unproven && wroteE) {
      callDone = true;
      const cands = [...ghosts.values()].filter(G => inPlay(G, runs)).map(G => G.uid), made = runs && runs[uid] && runs[uid].k;
      const path = `${nodePath()}/k`;
      expectRefusal(path, 'jaywalk call: the window closed, or the rules are not published yet');
      callEl = showCall({ overlay: overEl, game: g, st: { live: { calls: made ? { [uid]: made } : {} } }, me: uid, player: u => st.players[u] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' }, candidates: cands, path,
        line: u => { const G = ghosts.get(u); return `${G ? G.run.best : 0} LANES`; }, intro: n => `${n} still hopping — who goes the farthest? A right call earns game-night points.`,
        ended: () => !st.game || st.game.phase !== 'play' || st.game.matchId !== matchId, onState: msg => { callLine = msg === 'NO CALL' ? '' : msg; callEl = null; }, isDestroyed: () => gone });
    }
  }

  // ---- the frame
  function frame(now) {
    if (gone) return;
    raf = requestAnimationFrame(frame);
    // (H5B — the GAME LOOK is read LIVE: ☰ → Settings mid-run, or the sun going down on AUTO, re-themes this screen at once)
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
      const held = performance.now() - overAt > END_HOLD_MS;   // (the hit is seen first — the kid stays his own colour through it)
      if (watching && held) {
        const f = chooseFollow(runs);
        if (f !== followUid) { followUid = f; const F = ghosts.get(f); if (F) { night.setKidColor(colorHex(((st.players && st.players[f]) || {}).color)); night.resetKid(); } }
      }
      const F = watching && held ? ghosts.get(followUid) : null;
      if (F) { drawRun = F.run; a = isOver(F.run) || F.held || F.run.t < wt ? 0 : wa; }
      const list = [];
      for (const G of ghosts.values()) if (G !== F && !G.behind) list.push(G);
      extra = { ghosts: list, t: wt + wa, a: wa, off: F ? F.vis : null };
      if (TEST) probe(list, F, wt);
      drawOrder(g, runs); drawWatch(g, runs);
    }
    if (isMatch) drawCount(g);
    drawLines(mine(g) && drawRun === run);
    night.draw(drawRun, course, a, dt, extra);
    if (shotAt && performance.now() >= shotAt) takeShot();
    // the ghosts' name tags: each over its kid; two that would sit on each other (everyone on the start cell) stack upward
    const placed = [];
    if (extra) for (const G of ghosts.values()) {
      const tg = extra.ghosts.includes(G) ? G.tag : null;
      if (tg) { while (placed.some(q => Math.abs(q[0] - tg[0]) < 84 && Math.abs(q[1] - tg[1]) < 19)) tg[1] -= 20; placed.push(tg); }
      const key = tg ? `${Math.round(tg[0])},${Math.round(tg[1])}` : '';
      if (key !== G.tagKey) { G.tagKey = key; if (tg) { G.tagEl.style.transform = `translate3d(${Math.round(tg[0])}px,${Math.round(tg[1])}px,0) translate(-50%,-100%)`; G.tagEl.style.opacity = '1'; } else G.tagEl.style.opacity = '0'; }
    }
    tiers.sample(now, performance.now() - t0); if (!pinned) tiers.tick(now);
    if (TEST && frames.length < 20000) { frames.push(dt); cost.push(performance.now() - t0); stamps.push(now); }
    const shownBest = watching && drawRun !== run ? drawRun.best : run.best;
    if (shownBest !== lanesShown) {
      lanesShown = shownBest; setNum(lanesEl, shownBest);
      if (shownBest > 0) { lanesEl.classList.remove('is-pop'); void lanesEl.offsetWidth; lanesEl.classList.add('is-pop'); }
    }
    if (markUntil && now > markUntil) { markEl.textContent = ''; markUntil = 0; }
    if (mode === 'over' || (isMatch && g && g.phase === 'final')) endScreen();
  }

  // ---- the end
  function endScreen() {
    const g = st.game;
    if (isMatch) {
      // (the match is over — the host's step: the podium for everyone, a kid still hopping included — THE MOTHERSHIP took them the same tick)
      if (g && g.phase === 'final' && !final && (mode !== 'over' || performance.now() - overAt >= END_HOLD_MS)) showFinal(g);
      return;
    }
    if (performance.now() - overAt < END_HOLD_MS) return;
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
    final = createFinal({ rows: finalRows(g, code), players: st.players, me: uid, presence: st.presence, kicker: solo ? 'JAYWALK · SOLO' : 'JAYWALK · MATCH', winnerLine: nm => `${nm} WENT THE FARTHEST` });
    finalWrap = h('div.jw-final', final.el);
    root.classList.add('is-over'); root.append(finalWrap);
  }
  /** a SOLO run's own end: UNPROVEN (no proof → the match can't reach the console's podium) — or proven but the signal is gone (`waiting`:
   *  the run is in the phone's queue and counts when it lands; the podium takes this screen's place by itself) */
  function showLocalEnd(waiting) {
    const body = h('div.final-body.jw-fin-local');
    buildEnd(body, { line: lineOf(run, course), lanes: run.best, note: waiting ? 'NO SIGNAL — YOUR RUN COUNTS WHEN IT IS BACK' : 'NOT COUNTED — NO LINE TO THE BOARD' });
    // (PLAY AGAIN here = another UNPROVEN run in the same match: this match's one GO is spent or was refused — PLAY NOW again gets a proven one)
    const again = waiting ? null : h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => { hideLocalEnd(); reset(); asked = true; unproven('again'); } }, h('span', 'PLAY AGAIN'));
    const PN = globalThis.__nsPlayNow, soloRoom = !!(PN && PN.isSolo && PN.isSolo());
    const leave = h(`button.btn.${waiting ? 'btn-primary' : 'btn-ghost'}.btn-block`, { type: 'button', onclick: () => { leave.classList.add('is-busy'); Promise.resolve(soloRoom ? PN.leave() : backToLobby()).catch(() => leave.classList.remove('is-busy')); } }, h('span', soloRoom ? 'BACK TO THE CITY' : 'BACK TO THE ROOM'));
    localEnd = h('div.jw-final.jw-local', h('div.jw-local-in', body, h('div.jw-local-foot', again, leave)));
    root.classList.add('is-over'); root.append(localEnd);
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
    if (S && (course.seed !== S.seed || go !== S.playAt)) { if (TEST) adopts.push({ at: Math.round(srvNow() - S.playAt), seed: S.seed, t: run.t, hops: log.length }); adoptMatch(S, runs); }
    proven = haveGo && !g.unproven && mine(g);
    if (course !== START && runs) feedGhosts(g, runs);
  }
  function sync() {
    const g = st.game;
    if (!g || !night) return;
    if (isMatch) { syncMatch(g); if (final) final.refresh(); return; }
    if (g.phase === 'play' && mine(g) && soloGame(g)) askGo();
    // (a refresh on the podium: the run in the node, replayed to its end, stands behind the frame)
    if (g.phase === 'final' && mode === 'wait' && mine(g) && soloGame(g) && st.liveKey === liveKeyFor(g)) {
      const node = st.live && st.live.runs ? st.live.runs[uid] : null;
      asked = true; clearTimeout(goTimer);
      if (node && node.go > 0) { adopt(node.go, node.c, true); wroteE = true; mode = 'over'; overAt = -1e9; } else { proven = true; mode = 'over'; overAt = -1e9; }
    }
    if (final) final.refresh();
  }
  /** back on screen: the clock re-read (a suspended tab's own timer may have stood still) — GO stays the run's tick 0 */
  const onVis = () => { last = 0; if (document.visibilityState !== 'hidden') anchor(); };

  return {
    mount(el, state) {
      st = state; code = state.code; uid = state.uid; matchId = state.game ? state.game.matchId : '';
      const g = state.game;
      isMatch = !!g && !soloGame(g);
      build(el);
      if (!night) return;
      reset();
      if (isMatch) root.classList.add('is-match');
      if (TEST) globalThis.__jwGame = {
        state: () => ({ mode, proven, haveGo, matchId, go, seed: course.seed, t: run.t, st: run.st, y: run.y, best: run.best, cause: run.cause, over: isOver(run), hops: log.length, sent, chunks: chunkN, final: !!final, localEnd: !!localEnd, scenes: scenesMade,
          lines: { best: lines.best, friends: lines.friends.map(f => `${f.n} ${f.v}`), record, shown: lineKey, flash: lanesEl.classList.contains('is-flash'), gold: lanesEl.classList.contains('is-record') },
          isMatch, watching, follow: followUid, call: !!callEl, callLine, count: countKey, watch: watchKey, order: [...orderEl.children].map(li => li.textContent), outs: [...orderEl.querySelectorAll('.is-out')].length,
          ghosts: [...ghosts.values()].map(G => ({ uid: G.uid, t: G.run.t, y: G.run.y, best: G.run.best, st: G.run.st, hops: G.log.length, tag: !!G.tag, held: G.held, done: G.done, behind: G.behind })),
          adopts: adopts.slice(), seen: { ...watch }, g0: st.game ? st.game.g0 || 0 : 0,
          snd: { cues: SFX.cues(), wanted: SFX.wanted().map(q => q.id), by: SFX.totals().by, ducked: ducked != null },
          tier: night ? night.tier() : -1, info: night ? night.info() : null, kidPx: night ? night.kidHeightPx() : 0 }),
        hop, frames: () => frames.slice(), cost: () => cost.slice(), clearFrames() { frames.length = 0; cost.length = 0; stamps.length = 0; },
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
    update(state) { st = state; if (night) sync(); },
    unmount() {
      gone = true; cancelAnimationFrame(raf); clearTimeout(goTimer);
      document.removeEventListener('visibilitychange', onVis);
      if (mode === 'run' && run && !isOver(run)) flush(true);   // (a QUIT mid-run: what was hopped is in the proof)
      if (offControls) offControls();
      if (final) final.destroy();
      quiet();
      try { SFX.stopAll(); } catch { /* silent */ }
      if (night) {
        // (PLAY AGAIN's remount — the console's INSTANT AGAIN marks it: the scene is kept warm for the next run; anything else frees it at once)
        if (performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(play, night); else night.destroy();
      }
      if (root) root.remove();
      root = null; night = null;
    },
  };
}
