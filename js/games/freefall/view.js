// FREEFALL — THE GAME's SCREEN (F4A — docs/freefall.md "THE CARTRIDGE" · "THE PROOF"; HIGH RISE's view.js is the pattern): THE STAGE
// (stage.js — the SAME run loop, scene, HUD + sounds /freefall-play mounts) in the console's frame, and everything a run WRITES — which
// the stage never does itself:
//   · GO: the proof node's first value (the SERVER's time), read back → the seed (logic.js#seedOf) + tick 0 (= GO + proof.js#START_LEAD_MS):
//     the run is on the server's clock. The first DRAG is the start (the opening stands on a stand-in tower: the real floors take their
//     place as the tower spins up — stage.js#WHIP_MS)
//   · THE PROOF: the input log's FINAL events in chunks, every 250 ms while there are new ones — c/{i} = { s, at: the SERVER's time }; at
//     the end the last chunk, then `e` (a signal: the host's step ends the match on it — never read as a score)
//   · THE HOLD (solo — the page hidden / the phone locked): the hold is a logged event (it goes up as the page hides); the way back is
//     STAMPED — h/{i} = the SERVER's time the 3 · 2 · 1 began, the run goes on RESUME_LEAD_MS after it. No stamp (no line) → the count is
//     run again (stage.js#RESUME_TRIES), then the run goes on and SAYS it is not counted past the pause (the judge counts it up to that hold)
//   · THE END = the console's podium frame (ui/final.js) with this game's body (final.js); PLAY AGAIN = the console's INSTANT AGAIN (the
//     scene kept warm), back on THE OPENING
//   · an UNPROVEN run (GO refused / unanswered / answered too late: no signal, the rules not yet re-published) still PLAYS — on a seed of its
//     own, never counted — SAYS SO for as long as it is on, and ends on the stage's own card (NOT COUNTED — NO LINE TO THE BOARD)
//   · a refresh mid-run: the run can not be taken back up (its clock ran on) — its end is written from the node as it stands
// F4A = THE SOLO RUN.
// F4B — THE MATCH (docs/freefall.md "THE MATCH"; HIGH RISE's view.js is the pattern): 3 · 2 · 1 · GO — every phone writes its own GO (a
// TRANSACTION, never applied locally); THE FIRST GO among the proof nodes picks the seed + tick 0 for everyone (match.js#startOf: THE
// NODES ARE THE TRUTH); the same chunks as a solo run; the RIVALS = everyone's proof nodes through the same engine (ghosts.js — the stage
// steps + draws them: the ghosts, THE DEPTH RAIL, the edge markers); OUT = the cause's words for a moment → Call the Winner (the match
// kit's — your own node's `k`) → WATCH THE LEADER (a tap = the next player); THE FINISH = THE BOTTOM (floor 200) or the 3:00 cap; the
// podium comes with the host's step. One life, NO holds: a hidden page runs on. A late joiner (not a participant) WATCHES from the start.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { dbRef, set as dbSet, get as dbGet, runTransaction, serverTimestamp, serverNow, expectRefusal } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { showCall } from '../kit/call.js';
import { firstGo, onTime, goOf } from '../../core/proof.js';
import { createRun, stepTo, isOver } from './engine.js';
import { TICK_HZ } from './tuning.js';
import { startOf, liveOf } from './match.js';
import { finalPatch } from './director.js';
import { createRouterPing, createLiveWait, END_OWED_MS } from '../kit/run-hold.js';
import { follow, nextFollow } from './ghosts.js';
import { isHost } from '../../store.js';
import { createProofWriter } from '../kit/proof-writer.js';
import { proofIo, stampT0, writeMatchGo } from '../kit/proof-io.js';
import { liveKeyFor } from '../registry.js';
import { createFinal } from '../../ui/final.js';
import { backToLobby } from '../../host.js';
import { seedOf, gameStandings, END_WORDS } from './logic.js';
import { CLOCK, START_LEAD_MS, START_LATE_MS, GRANT_PHONE_MS, finalCount, packRange, eventsOf, chunkTimes, logFromChunks } from './proof.js';
import { scoreNode } from './director.js';
import { BEST_KEY, cleanBest } from './best.js';
import { endLogo } from './endscreen.js';
import { DUCK } from './sounds.js';
import { duckMusic, musicDuckLevel } from '../../audio/music.js';
import { SRV_BEST_KEY } from './lines.js';
import { createStage, newSeed } from './stage.js';
import { soloGo, GO_WAIT_MS } from '../highrise/go.js';   // (THE SOLO GO — PURE + generic: up to 7 tries, the server's copy read again, ≤ 9 s)

export { GO_WAIT_MS };
/** an UNPROVEN run's words — on screen while it is on (the stage's quiet line) + its end card's reason */
export const NOT_COUNTED = Object.freeze({ net: 'NOT COUNTED — NO CONNECTION', line: 'NOT COUNTED — NO LINE TO THE BOARD', pause: 'NOT COUNTED PAST THE PAUSE — NO CONNECTION' });
export const notCounted = why => (why === 'no answer' || why === 'late' ? NOT_COUNTED.net : NOT_COUNTED.line);
/** the podium is waited this long after a proven run's end before the stage's own card says NO SIGNAL (never a frozen screen) */
export const FINAL_WAIT_MS = 6000;
/** PLAY AGAIN on the stage's own card: the orphan match's end is waited this long before the stage starts over in it */
export const AGAIN_WAIT_MS = 3500;
/** a hold's stamp is waited this long (the count is 2.4 s: an answer after it is no use to that count) */
export const STAMP_WAIT_MS = 2300;
/** F4B — a MATCH: a match is over (the host's step) while this phone's own ball still falls: the podium waits for its end at most this long */
export const FINAL_HOLD_MS = 3000;
/** … this phone writes its GO this long before the count's end (the rules open the window 2 s before it) */
export const GO_EARLY_MS = 1800;
/** … the cause's words stay this long over the scene before Call the Winner / the watcher's view (THE FINISH: its moment is seen first) */
export const OUT_SHOW_MS = 2300, MADE_SHOW_MS = 3600;
/** THE ORDER: the cause's words → Call the Winner → WATCH (the match's end-to-end run: the watch began 0.9 s after an out, under the OUT
 *  card, and the call's sheet then opened over both). The call opens once the OUT card has left; the watch waits for the card AND the call. */
export const CALL_AFTER_MS = OUT_SHOW_MS + 400, WATCH_AFTER_MS = OUT_SHOW_MS + 500;

// (the pass's own checks — tests/integration/e2e-freefall.mjs — on a LOCAL emulator page only: never on the live site)
const TEST = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]emu(?:&|=|$)/.test(location.search || '');
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } } };

// THE SCENE STAYS WARM over PLAY AGAIN (the console's INSTANT AGAIN remounts the view): the stage is parked a moment, the next mount takes
// it back (its WebGL context, its programs, its pictures, its decoded sounds) — anything else frees it at once. The stage is ONE object
// whose driver (`drv`) hands every call to the view that holds it now (`cur`).
let parked = null, cur = null;
const unpark = () => { if (!parked) return null; clearTimeout(parked.t); const p = parked; parked = null; return p.S; };
const park = S => { if (parked) { clearTimeout(parked.t); parked.S.destroy(); } S.el.remove(); parked = { S, t: setTimeout(() => { if (parked && parked.S === S) { parked = null; S.destroy(); } }, 2500) }; };
const lookNow = () => (typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'day' : 'night');
const drv = {
  hook: TEST ? '__ffStage' : '',
  lookNow,
  // YOUR BEST: the SERVER's — the best it last told this phone (a counted run's answer) — once counting is ON; while THE SWITCH is OFF this
  // phone's own (the test page's). A run on this stage never writes it.
  best: { read: () => cleanBest(ls.get(SRV_BEST_KEY)) || cleanBest(ls.get(BEST_KEY)), write() {} },
  go: () => (cur ? cur.go() : Promise.resolve(null)),
  resume: i => (cur ? cur.resume(i) : Promise.resolve(performance.now())),
  onUnstamped: () => (cur ? cur.unstamped() : ''),
  onFrame: () => { if (cur) cur.frame(); },
  onOver: r => { if (cur) cur.over(r); },
  onEnd: r => (cur ? cur.end(r) : { own: true }),
  onHide: held => { if (cur) cur.hide(held); },
  onLeave: () => (cur ? cur.leave() : null),
  onAgain: () => (cur ? cur.again() : false),
  onWatchTap: () => { if (cur && cur.watchTap) cur.watchTap(); },
  shotKey: () => (cur && cur.shotKey ? cur.shotKey() : ''),   // (THE SHARE CARD's frame is kept under the match's id — share.js finds it there)
  leaveWords: 'BACK',
  // F5C — THE MUSIC DUCKS under the big moments (sounds.js#DUCK — JAYWALK's view.js#applyDuck): the level found is put back after
  duck: on => { try { if (on) { if (ducked == null) ducked = musicDuckLevel(); duckMusic(Math.min(ducked, DUCK.level), DUCK.inS); } else if (ducked != null) { duckMusic(ducked, DUCK.outS); ducked = null; } } catch { /* polish */ } },
};
let ducked = null;

export function createView() {
  let S = null, st = null, gone = false, code = '', uid = '', matchId = '';
  let go = 0, proven = false, spent = false, started = false, wroteE = false, lateSeen = '', whyNot = '', stranded = false;
  let final = null, finalWrap = null, goTimer = 0, finalTimer = 0, capN = -1, againing = false;   // (capN: the log's events through a hold whose way back got no stamp — nothing past them is sent)
  let holdSrv = 0, holdN = 0;   // (holdN: the log's events through that hold — its chunk is ACKNOWLEDGED once the writer's `acked` reaches it)   // (F4B — THE PAUSE GAP: the SERVER's time this phone's last hold was made at — its chunk must be stamped within GRANT_PHONE_MS of it)
  // the match (F4B)
  let isMatch = false, haveGo = false, goAsked = false, goTries = 0, mSeed = '', mPlayAt = 0, adopted = false, pumpIv = 0, lateGo = false, missed = false, everProven = false, finalSeen = 0;
  let outAt = 0, outRes = null, outShown = false, callEl = null, callLine = '', callDone = false, liveRuns = null, followUid = '', followPick = '', watchKey = '', countNames = null, playersSeen = null, partsSeen = null;
  const meRec = { floor: 0, over: false, made: false, cause: '' };
  const hexOf = u => colorHex(((st.players && st.players[u]) || {}).color) || '#00f0ff';
  const nameOf = u => String(((st.players && st.players[u]) || {}).name || 'GHOST').toUpperCase();
  // THE CONSOLE FIX — THE RUN HOLD (kit/run-hold.js; docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"): this phone's
  // own PROVEN run is played to its own end whatever the host's state says — no podium over it, the router keeps this screen through a
  // moved-on room; then its end is written and the phone follows. The podium waits for the rivals' live runs the same way.
  const pingRouter = createRouterPing(), liveWait = createLiveWait(liveOf);
  const runLive = () => isMatch && proven && started && adopted && !missed && !!S && !S.me(meRec).over;
  function holdsRun() {
    if (gone || !isMatch || !proven || !S) return false;
    if (runLive()) return true;
    if (!wroteE || !outRes) return false;
    const since = performance.now() - outAt;
    return since < (outRes.cause === 'made' ? MADE_SHOW_MS : OUT_SHOW_MS) || (since < END_OWED_MS && W.owes());
  }
  /** the podium after a wait: scored from the nodes as they stand now (the host's own step — director.js#finalPatch), never an early `final`'s numbers */
  const scoredNow = g => { try { return { ...g, ...finalPatch(g, runsNow() || {}, serverNow(), code) }; } catch { return g; } };
  const mine = g => !!(g && g.participants && g.participants[uid]);
  const treePath = () => `rooms/${code}/ff/${matchId}`, nodePath = () => `${treePath()}/${uid}`;
  let lkGame = null, lkKey = null;
  const runsNow = () => { const g = st && st.game; if (!g) return null; if (g !== lkGame) { lkGame = g; lkKey = liveKeyFor(g); } return (st.liveKey === lkKey && st.live && st.live.runs) || null; };
  /** a server time → this page's clock (the stage's tick 0 is a performance.now() value) */
  const perfOf = srv => performance.now() - (serverNow() - srv);
  const matchLeft = () => !!matchId && (!st.game || st.game.matchId !== matchId || (st.game.phase !== 'play' && !(isMatch && st.game.phase === 'count')));   // (a match: the count's last 2 s still take a GO)
  const report = (msg, kind) => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => m.reportError(new Error(msg), kind)).catch(() => {});
  const refused = () => report('FREEFALL: the proof node was refused — the run plays UNPROVEN (re-publish database.rules.json: rooms/{CODE}/ff)', 'rules');
  const countQuietLate = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => { if (typeof m.countQuiet === 'function') m.countQuiet('late-proof'); }).catch(() => {});   // (THE STALE-MODULE RULE: an existing export, lazily)
  /** a chunk / the end still in flight when the match left `play` is an EXPECTED refusal — counted, never a row (JAYWALK's THE LATE PROOF CHUNK) */
  function lateProof(why) {
    if (lateSeen === matchId || !proven) return;
    lateSeen = matchId;
    expectRefusal(`${nodePath()}/c`, `freefall: a proof chunk after the match ended (${why})`, 90_000, 'late-proof');
    expectRefusal(`${nodePath()}/e`, `freefall: the end after the match ended (${why})`, 90_000, 'late-proof');
    expectRefusal(`${nodePath()}/h`, `freefall: a hold's stamp after the match ended (${why})`, 90_000, 'late-proof');
  }

  // THE PROOF (kit/proof-writer.js — JAYWALK's + HIGH RISE's): the log's FINAL events go up as chunks, every 250 ms while there are new
  // ones, each stamped by the SERVER when it arrives; ONE burst at a time, a refused chunk sent again, never dropped on the mirror alone;
  // then `e` behind the last chunk's acknowledgement
  const W = createProofWriter({
    count: () => { if (!S || !proven) return 0; const n = finalCount(S.run()); return capN >= 0 && n > capN ? capN : n; }, pack: (a, b) => packRange(S.run(), a, b), entriesOf: eventsOf,
    chunkMax: CLOCK.chunkMax, chunks: CLOCK.chunks, flushMs: () => CLOCK.flushMs, left: matchLeft,
    onLate: why => { lateProof(why); if (why === 'dropped') countQuietLate(); },
    onDead: why => report(`FREEFALL: the proof log could not be completed (${why}) — the run can not count`, 'rules'),
    io: proofIo(nodePath),
  });

  /** GO: the proof node's first write — the SERVER's time, read back → the seed + tick 0. → what the stage adopts: { seed, t0, note } */
  function askGo() {
    const m = matchId, path = `${nodePath()}/go`;
    return new Promise(res => {
      let done = false;
      // (A LATE ANSWER NEVER TOUCHES A RUN THAT WENT ON: each call checks ITS OWN state — done / gone / another match — BEFORE it writes anything of the view's)
      const stale = () => done || gone || m !== matchId;
      const fin = G => { done = true; clearTimeout(goTimer); started = true; res(G); };
      const proof = goAt => {
        if (stale()) return;
        go = goAt; proven = true; whyNot = ''; wroteE = false; capN = -1; W.reset();
        fin({ seed: seedOf(code, matchId, go), t0: perfOf(go + START_LEAD_MS), note: '' });
      };
      /** no proof here (no signal, the rules not published, this match's one GO already spent): the run still PLAYS — on its own seed, never
       *  counted, and SAYS SO for as long as it is on. This match's one GO is SPENT with it. */
      const unproven = why => { if (stale()) return; if (why === 'refused') refused(); go = 0; proven = false; spent = true; whyNot = why; W.reset(); fin({ seed: newSeed(), t0: performance.now(), note: notCounted(why) }); };
      if (spent || matchLeft()) { unproven('again'); return; }
      clearTimeout(goTimer);
      // THE SOLO GO (highrise/go.js): THE STAMP + the GO, tried again when refused, the server's copy of the node read again while an answer
      // is owed — all inside GO_WAIT_MS. THE STAMP first: the tree's first write (kit/proof-io.js#stampT0 — t0 + the room's tree counter)
      soloGo({
        write: () => {
          expectRefusal(path, 'freefall GO: already written (a rejoin) or the rules are not published yet', GO_WAIT_MS + 6000);
          // (F4B — THE FRESH-EYES REVIEW: the GO is a TRANSACTION, NEVER APPLIED LOCALLY — as a match's. A plain set shows in this phone's
          //  own mirror at once with the phone's GUESS of the server's time: a look at the node while the write was still in the air took
          //  that guess for the GO — the phone then played one tower, the judge replayed another)
          return stampT0(treePath(), 'freefall').then(() => (stale() ? Promise.reject(new Error('the run stopped waiting')) : runTransaction(dbRef(path), cur => (cur == null ? serverTimestamp() : undefined), { applyLocally: false })));
        },
        read: () => dbGet(dbRef(nodePath())).then(snap => snap.val()),
        now: () => performance.now(), timer: (fn, ms) => { goTimer = setTimeout(fn, ms); }, stale: () => gone || m !== matchId,
      }).then(r => {
        if (!(r.go > 0)) { if (r.why !== 'left') unproven(r.why); return; }
        // (a GO already carrying chunks = a run of before a refresh: never started again · an answer that took too long: the darkness has
        //  most of its grace already — the run plays UNPROVEN; the GO stays without an end: nothing of it is ever counted)
        if (r.c || serverNow() - r.go > START_LATE_MS) { unproven(r.c ? 'again' : 'late'); return; }
        proof(r.go);
      });
    });
  }
  /** a HOLD's way back, stamped: h/{i} = the SERVER's time the 3 · 2 · 1 began → this page's clock at that moment (0 = no stamp: the line).
   *  Written again at every count (a page hidden again in the 3 · 2 · 1 starts it over) — the judge reads the last one. */
  function resume(i) {
    if (!proven) return Promise.resolve(performance.now());   // (an UNPROVEN run needs no stamp: its count runs from now)
    const m = matchId, path = `${nodePath()}/h/${i}`;
    if (matchLeft()) lateProof('seen');
    expectRefusal(path, 'freefall: a hold\'s stamp — the rules are not re-published yet, or the match moved on', STAMP_WAIT_MS + 4000);
    return new Promise(res => {
      const t = setTimeout(() => res(0), STAMP_WAIT_MS);
      const stamp = () => dbSet(dbRef(path), serverTimestamp()).then(() => dbGet(dbRef(path))).then(snap => { clearTimeout(t); const v = snap.val(); res(!gone && m === matchId && typeof v === 'number' && v > 0 ? perfOf(v) : 0); });
      // F4B — THE PAUSE GAP: WAS THIS PAUSE GRANTED? The hold's own chunk (the hold + every move before it) must have ARRIVED — the SERVER's
      // stamp on it — within GRANT_PHONE_MS of the hold (the judge's bound is CLOCK.grant: the phone keeps a margin). The server's copy of
      // the chunks is read (it answers behind the writes still queued). Not there / too late → −1: no pause was granted — no stamp is
      // written, the count is not run again, the run goes on and SAYS it is not counted past the pause
      granted(i, holdSrv).then(ok => { if (ok === false) { clearTimeout(t); res(-1); return null; } return stamp(); }).catch(() => { clearTimeout(t); res(0); });
    });
  }
  /** → true (the i-th hold's chunk was stamped in time) | false (it was not — or it is not there); rejects = no answer (the line) */
  function granted(i, held) {
    // THE FRESH-EYES REVIEW (HIGH): this phone's mirror answers a read from its LOCAL view — a chunk still in the air is there with the
    // phone's own guess of its time (a hold chunk queued behind a dead line read as "stamped 1 ms after the hold"). The chunk is asked
    // about only once its WRITE IS ACKNOWLEDGED (the writer's `acked` covers the hold's event): then its `at` is the server's own. Not
    // acknowledged in this count's time = no answer — the count runs again (stage.js#RESUME_TRIES), then the run goes on, NOT COUNTED PAST THE PAUSE.
    const need = holdN, from = performance.now();
    const read = () => dbGet(dbRef(`${nodePath()}/c`)).then(snap => {
      const T = chunkTimes(snap.val());
      if (!T) return false;
      let n = 0;
      for (const k of T) { n += k.hn || 0; if (n > i) return !(held > 0) || k.at - held <= GRANT_PHONE_MS; }
      return false;
    });
    return new Promise((res, rej) => {
      const look = () => {
        if (gone) { rej(new Error('the view is gone')); return; }
        if (W.state().acked >= need) { read().then(res, rej); return; }
        if (performance.now() - from > STAMP_WAIT_MS - 300) { rej(new Error('the chunk of the hold is not acknowledged yet')); return; }
        setTimeout(look, 60);
      };
      look();
    });
  }
  /** a hold's way back went on WITHOUT its stamp (three counts, no answer): the run says so, and nothing past that hold is sent — the judge
   *  counts the run up to it (a stamp that still lands later changes nothing: proof.js cuts there too) */
  function unstamped() {
    if (!proven || !S) return '';
    if (capN < 0) capN = finalCount(S.run());   // (the run is still held here: every event through the hold is final, none past it exists)
    return NOT_COUNTED.pause;
  }
  /** PLAY AGAIN on the stage's OWN card (an UNPROVEN run, NO SIGNAL): this match's one GO is spent and its match never ended (no `e`) — the
   *  host (this phone, a room of one) marks the run ended (`game.x/{uid}`: director.js ends the match), then THE INSTANT AGAIN starts a NEW
   *  match — its own GO: the next run can count. No line / not the host → false: the stage starts over in this match (not counted, said so) */
  function again() {
    const g = st && st.game, m = matchId;
    if (againing || gone || !g || g.matchId !== m || !isHost() || !mine(g)) return Promise.resolve(false);
    againing = true;
    const instant = () => lazyImport(import('../kit/again.js'), '../kit/again.js').then(A => A.instantAgain());
    /** the match is `final` (the host's step took the mark) — waited for a moment: no line = it never comes */
    const finalSoon = () => new Promise(res => { const t0 = performance.now(), iv = setInterval(() => { const x = st && st.game, ok = !!x && x.matchId === m && x.phase === 'final'; if (ok || gone || performance.now() - t0 > AGAIN_WAIT_MS) { clearInterval(iv); res(ok); } }, 80); });
    const fail = () => { againing = false; return false; };
    if (g.phase !== 'final') {
      expectRefusal(`rooms/${code}/game`, 'freefall: ending an unproven run\'s match — this phone is no longer the host', AGAIN_WAIT_MS + 4000, 'not-host');
      dbSet(dbRef(`rooms/${code}/game/x/${uid}`), 1).catch(() => {});
    }
    return finalSoon().then(ok => (ok ? instant() : false)).then(ok => (ok === false ? fail() : true), fail);
  }
  /** THE PROOF: the new final events go up (`force` = now) — the writer above */
  function flush(force) { if (proven && S) W.flush(force); }
  /** the run is over: the last chunk, then `e` — the host's step ends the match on it (a signal: never read as a score) */
  function over(r) {
    flush(true);
    if (!proven || wroteE) return;
    wroteE = true; spent = true;
    W.end({ f: r.floor, t: r.tick, w: String(r.cause || '').slice(0, 12) });
  }
  // ---- F4B — THE MATCH
  /** GO (a MATCH): this phone's own `go` — its proof of being there; the FIRST one to land is the match's (core/proof.js#firstGo). A
   *  TRANSACTION, never applied locally (THE NODES ARE THE TRUTH: the mirror holds confirmed GOs only). A refusal (this phone's clock a
   *  touch early, a rejoin) is looked at and tried again a few times — never a stuck start: the count runs on. */
  function askGoMatch() {
    if (goAsked) return;
    goAsked = true;
    const m = matchId, runs = runsNow(), node = runs ? runs[uid] : null;
    if (node && node.go > 0) { haveGo = true; return; }
    const tryAgain = () => { if (gone || m !== matchId) return; if (goTries++ < 7) setTimeout(() => { goAsked = false; }, 420); else refused(); };
    // (THE PROOF PASS: the stamp + the GO are the kit's — kit/proof-io.js#writeMatchGo, JAYWALK's + HIGH RISE's too)
    writeMatchGo(treePath(), uid, 'freefall', runs).then(ok => { if (gone || m !== matchId) return; if (ok) haveGo = true; else tryAgain(); }, tryAgain);
  }
  /** "YOUR OWN PHONE MISSED THE GO": has a ball NOBODY STEERED already ended on the match's clock? (the darkness — the engine's own answer) */
  function ballGone(St) {
    const tick = Math.floor((serverNow() - St.playAt) * TICK_HZ / 1000);
    if (tick <= 0) return false;
    const r = createRun({ seed: St.seed, mode: 'match' });
    stepTo(r, tick);
    return isOver(r);
  }
  /** the match's seed + tick 0 land (THE FIRST GO — in `play` the game's own): the stage takes the run; a rejoin replays this player's own
   *  moves so far; a WATCHER (not a participant) has no run of their own */
  function adoptMatch(St, runs) {
    mSeed = St.seed; mPlayAt = St.playAt; go = St.playAt;
    const g = st.game, node = runs && mine(g) ? runs[uid] : null, old = node && node.c ? logFromChunks(node.c) : null, moves = old ? old.log : [];
    W.reset({ sent: moves.length, next: node && node.c ? Object.keys(node.c).length : 0, verify: !!(node && node.c) });
    if (node && node.go > 0) haveGo = true;
    if (node && node.e) { wroteE = true; callDone = true; }   // (a rejoin after their own end: straight to watching)
    followUid = ''; adopted = true; started = true; partsSeen = null;
    // "YOUR OWN PHONE MISSED THE GO" (HIGH RISE's): it reaches the match's real clock with NO moves of its own, and on that clock the
    // darkness has already ended a ball nobody steered — it WATCHES (a late joiner's view), told plainly; its end is signalled (the room
    // does not wait 18 s for it); the server counts no player who passed no floor
    missed = mine(g) && !moves.length && !(node && node.e) && ballGone(St);
    feedRivals(g, runs || {});   // (the ghosts are set BEFORE the stage adopts: it starts every one of them on the match's seed)
    if (missed) { callDone = true; S.adopt({ seed: St.seed, t0: perfOf(St.playAt), spectate: true }); }
    else if (mine(g)) S.adopt({ seed: St.seed, t0: perfOf(St.playAt), log: moves });
    else S.adopt({ seed: St.seed, t0: perfOf(St.playAt), spectate: true });
  }
  /** 3 · 2 · 1 · GO — from the match's own tick 0 once the first GO has landed (till then the count the host set) */
  function drawCount(g, now) {
    const t0m = adopted ? mPlayAt : g.playAt, left = t0m - now;
    const txt = g.phase === 'final' || left < -700 ? '' : left <= 0 ? 'GO' : left > 3000 ? '' : String(Math.ceil(left / 1000));
    const key = !adopted && left <= 0 && g.phase !== 'final' ? 'GET READY' : txt;
    if (!countNames) countNames = Object.keys(g.participants || {}).sort((a, b) => (a === uid ? -1 : b === uid ? 1 : a < b ? -1 : 1)).map(u => ({ name: nameOf(u), hex: hexOf(u), me: u === uid }));
    S.count(key, key ? countNames : null);
  }
  /** everyone's proof nodes → their ghosts (ghosts.js through the stage: each chunk once, no move assumed). The rivals' list is built
   *  again only when the room's players / the match's participants changed (a name / a colour that landed late) */
  function feedRivals(g, runs) {
    const parts = g.participants || {};
    if (st.players !== playersSeen || parts !== partsSeen) {
      playersSeen = st.players; partsSeen = parts; countNames = null;
      S.setGhosts(Object.keys(parts).filter(u => u !== uid).sort().map(u => ({ uid: u, name: nameOf(u), hex: hexOf(u) })));
    }
    if (!g.unproven) for (const u in parts) if (u !== uid) S.feedGhost(u, runs[u]);
    return S.ghostRows();
  }
  /** OUT in a match: the cause's words over the scene for a moment, then Call the Winner (two or more still falling), then WATCH THE LEADER */
  function afterOut(g, runs, rows) {
    liveRuns = runs;
    const since = performance.now() - outAt, r = outRes, others = rows.filter(x => !x.me), live = others.filter(x => !x.over);
    if (r && !outShown && mine(g) && since < 60000) {
      outShown = true;
      const made = r.cause === 'made';
      S.outCard({ kicker: made ? 'THE BOTTOM' : r.cause === 'cap' ? 'THE BELL' : 'OUT', words: g.unproven || !haveGo || lateGo ? 'NOT COUNTED' : made ? END_WORDS.made : END_WORDS[r.cause] || 'THE END', floors: r.floor, made, ms: made ? MADE_SHOW_MS : OUT_SHOW_MS });
    }
    if (!callDone && r && mine(g) && (r.cause === 'red' || r.cause === 'dark') && since > CALL_AFTER_MS && g.phase === 'play' && !g.unproven && wroteE) {
      callDone = true;
      const cands = live.map(x => x.uid), made = runs && runs[uid] && runs[uid].k;
      // (JAYWALK's THE LATE k WRITE: never a pick for a player whose own end is already here; a refusal after the match moved on is expected)
      callEl = showCall({ canPick: u => !(liveRuns && liveRuns[u] && liveRuns[u].e != null), expect: 'freefall call: the match moved on before the pick landed', overlay: S.over, game: g, st: { live: { calls: made ? { [uid]: made } : {} } }, me: uid, player: u => st.players[u] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' }, candidates: cands, path: `${nodePath()}/k`,
        line: u => { const x = others.find(o => o.uid === u), n = x ? x.floor : 0; return `FLOOR ${n}`; }, intro: n => `${n} still falling — who goes the deepest? A right call earns game-night points.`,
        ended: () => !st.game || st.game.phase !== 'play' || st.game.matchId !== matchId, onState: msg => { callLine = msg === 'NO CALL' ? '' : msg; callEl = null; }, isDestroyed: () => gone });
    }
    // WHOM THE WATCHER FOLLOWS: the one picked by a tap while they fall · else THE LEADER (the one you follow STAYS while they fall)
    const held = since >= (r && r.cause === 'made' ? MADE_SHOW_MS : WATCH_AFTER_MS) || !mine(g) || missed;
    if (held && !callEl && others.length) {
      const f = follow(others, followPick || followUid);
      if (f && f !== followUid) { followUid = f; followPick = ''; S.watch(f); }
    }
    let txt = '';
    if (S.watching() || !mine(g) || since > WATCH_AFTER_MS) {
      const F = others.find(x => x.uid === followUid);
      const fl = F && S.watching() === F.uid && S.watchFloor() >= 0 ? S.watchFloor() : F ? F.floor : 0;   // (the floor of the run as it is DRAWN — the delayed playback)
      // (a rival with NO NEWS — a dead phone, a dropped signal: `lost` — is never OUT on this screen, so it stayed "live" for ever: the line
      //  said WATCHING <the dead phone> for the whole wait and WAITING FOR … · NO SIGNAL below could never show. The words count the ones seen falling.)
      const up = live.filter(x => !x.lost);
      // (TWO SHORT LINES — the match's end-to-end run: one long line wrapped to three at 390: who + their floor, then the hint / your call)
      const hint = up.length > 1 || (F && (F.over || F.lost)) ? 'TAP FOR THE NEXT' : '';
      if (F && up.length) txt = `WATCHING ${F.name} · ${fl}`;
      else if (F) txt = `${F.name} · FLOOR ${fl}`;
      if (!up.length) {
        // (everyone seen is out: the room waits for an end not yet signalled — a dropped signal gets its time)
        const wait = Object.keys(g.participants || {}).filter(u => !(runs && runs[u] && runs[u].e) && !(u === uid && wroteE));
        txt = g.unproven ? 'WAITING FOR THE END' : wait.length ? `WAITING FOR ${nameOf(wait[0])}${wait.length > 1 ? ` + ${wait.length - 1}` : ''} · NO SIGNAL` : txt || 'THE END';
      }
      if (missed) txt = `YOU MISSED THE START — NOT COUNTED${txt ? ` · ${txt}` : ''}`;
      const sub = [callLine, up.length && F && hint ? (callLine ? 'TAP: NEXT' : hint) : ''].filter(Boolean).join(' · ');   // (a 12-letter name beside YOUR CALL: the hint in its short form — the line stays ONE line at 375)
      if (sub) txt += `
${sub}`;
    }
    if (txt !== watchKey) { watchKey = txt; S.watchLine(final ? '' : txt); }
  }
  /** THE MATCH, pumped ten times a second (the count's own moments are not state changes) + at every state change */
  function pumpMatch() {
    const g = st && st.game;
    if (gone || !g || !S || g.matchId !== matchId) return;
    const runs = runsNow(), now = serverNow();
    drawCount(g, now);
    if (mine(g) && !goAsked && !haveGo && (g.phase === 'play' || (g.phase === 'count' && now >= g.playAt - GO_EARLY_MS))) askGoMatch();
    // the seed + tick 0 (match.js#startOf: THE NODES ARE THE TRUTH) — in the count and in `play` alike; the game's own only with no node to read (UNPROVEN)
    const St = startOf(g, runs, code);
    // (never adopted from the game alone while the proof mirror is still on its way — a refresh mid-run would take the match with NO moves
    //  of its own. A proven match in `play` always has a node to read: wait for it.)
    if (St && (mSeed !== St.seed || mPlayAt !== St.playAt) && (runs || g.unproven)) adoptMatch(St, runs);
    // (THE PROOF PASS: a GO of this phone's own that landed LATER than the window after THE FIRST GO is no run — the server drops it
    //  (core/proof.js#onTime): nothing is written for it, the out card says NOT COUNTED.)
    const myNode = runs ? runs[uid] : null;
    lateGo = !!myNode && goOf(myNode) > 0 && !onTime(myNode, firstGo(runs));
    // (THE CONSOLE FIX: once proven, the host's game can not take it back — participants / `unproven` rewritten mid-run stopped the chunks)
    proven = !lateGo && ((haveGo && !g.unproven && mine(g)) || everProven);
    if (proven) everProven = true;
    // (… a phone that MISSED THE START and has a GO of its own: its end is signalled once — the room never waits 18 s for it)
    if (missed && proven && !wroteE) { wroteE = true; spent = true; W.end({ f: 0, t: 0, w: 'dark' }); }
    // (a run that ENDED while the match was marked unproven — the host's hiccup — never wrote its `e`: once proven again, the end goes up now)
    if (proven && started && !wroteE && !missed && S.me(meRec).over) over(S.result());
    if (adopted && !final) {
      const rows = feedRivals(g, runs || {});
      if (outRes || !mine(g) || missed) afterOut(g, runs, rows);
    }
    // THE PODIUM for everyone (the host's step) — once this player's own end has been SEEN (the stage's end hold, the finish's moment); a
    // watcher, a refresh on it: at once. Never held for ever — a ball still falling when the match is over (its chunks did not arrive)
    // gets the podium after FINAL_HOLD_MS. THE CONSOLE FIX: never over a live proven run of this phone's own; never for a match the room
    // has left (the router holds this screen); and it waits for a rival's run still LIVE — the host's `final` came early — the cap ends that wait
    const RH = globalThis.__nsRunHold;
    if (g.phase === 'final' && !final && !runLive() && !(RH && RH.on)) {
      if (!finalSeen) finalSeen = performance.now();
      const waiting = !g.unproven && adopted && liveWait.wait({ code, matchId, runs, presence: st.presence, now, skip: uid }).length > 0;
      if (!waiting && (!adopted || !mine(g) || performance.now() - finalSeen > FINAL_HOLD_MS || (S.state().shown && (!outRes || performance.now() - outAt > (outRes.cause === 'made' ? 1400 : 500))))) { S.count('', null); S.watchLine(''); showFinal(liveWait.waited() ? scoredNow(g) : g); }
    }
    if (RH && (RH.on || RH.wait) && !holdsRun()) pingRouter();   // (the run is over + written — follow the room)
  }
  /** the stage's end moment in a match: OUT (or the finish / the bell) — the watcher's view follows; the podium comes with the host's step */
  function endMatch(r) { if (!outRes) { outRes = r; outAt = performance.now(); } sync(); return { own: false, watch: true }; }

  /** the end card's moment: a PROVEN run ends on the console's podium (it comes with the host's step); an UNPROVEN one on the stage's own card */
  function end() {
    if (!proven) return { own: true, note: notCounted(whyNot) };
    clearTimeout(finalTimer);
    // (the end has not reached the room — no signal: never a frozen screen; the run is in the node / the queue and counts when it lands)
    finalTimer = setTimeout(() => { if (!gone && !final && S) S.showCard('NO SIGNAL — YOUR RUN COUNTS WHEN IT IS BACK'); }, FINAL_WAIT_MS);
    sync();
    return { own: false };
  }
  function leave() {
    const PN = globalThis.__nsPlayNow, soloRoom = !!(PN && PN.isSolo && PN.isSolo());
    return Promise.resolve(soloRoom ? PN.leave() : backToLobby());
  }
  /** a refresh mid-run: the run's clock ran on without this page — it can not be taken back up. Its end is written from the node AS IT
   *  STANDS (the judge's own replay — the tower stood still from its last event); the podium comes with the host's step. */
  function strand(node) {
    if (stranded) return;
    stranded = true; spent = true;
    const r = scoreNode(code, matchId, node, true);
    expectRefusal(`${nodePath()}/e`, 'freefall: the end of a run from before a refresh — already written, or the match moved on', 20_000, 'late-proof');
    proofIo(nodePath).end({ f: r.f, t: r.t, w: String(r.w || 'left').slice(0, 12) }).catch(() => {});
  }
  /** the console's podium frame; its body = this game's end screen (final.js#finalScene) */
  function showFinal(g) {
    clearTimeout(finalTimer);
    S.hideCard();   // (the podium takes the screen — the stage's own NO SIGNAL card is put away)
    if (callEl) { callEl.remove(); callEl = null; }
    S.outCard(null); S.watchLine('');
    // (a MATCH's rows: everyone in order with their floors + how their run ended — the console lists them as slim cards)
    const res = g.results || {}, solo = g.mode === 'solo';
    final = createFinal({ game: g, rows: gameStandings(g).map(r => ({ uid: r.uid, rank: r.rank, score: r.floor, ...(solo ? {} : { note: g.unproven ? 'NOT COUNTED' : (res[r.uid] || {}).w === 'made' ? END_WORDS.made : END_WORDS[(res[r.uid] || {}).w] || 'NO RUN' }) })), players: st.players, me: uid, presence: st.presence, kicker: solo ? 'FREEFALL · SOLO' : 'FREEFALL · MATCH', mode: solo ? 'SOLO' : 'MATCH', scoreLabel: 'FLOORS', winnerLine: nm => `${nm} FELL THE DEEPEST` });
    // F4B — THE END SCREEN's HEADER = THE LOGO (the owner's approved mock): title-05's lettering + the mode in small teal caps, in the
    // console frame's own header slot (the frame's kicker words stay for a reader: the logo is the heading)
    const kick = final.el.querySelector('.sheet-kicker');
    if (kick) { kick.classList.add('ff-kick'); kick.replaceChildren(endLogo(solo ? 'solo' : 'match')); }
    finalWrap = h('div.ff-final', final.el);
    S.el.classList.add('is-final'); S.el.append(finalWrap);
  }
  function sync() {
    const g = st && st.game;
    if (!g || !S) return;
    if (matchLeft()) lateProof('seen');   // (from the moment this phone sees the match end, a chunk / e still in flight is an expected refusal)
    if (isMatch) { pumpMatch(); if (final) final.refresh(); return; }
    if (g.phase === 'final' && g.matchId === matchId && !final && !againing && (!started || S.state().shown)) showFinal(g);   // (a run's own end is SEEN first — the stage's end hold)
    if (g.phase === 'play' && mine(g) && !started && !S.state().starting) { const runs = runsNow(), n = runs ? runs[uid] : null; if (n && n.go > 0 && !n.e) strand(n); }
    if (final) final.refresh();
  }

  return {
    mount(el, state) {
      st = state; code = state.code; uid = state.uid; matchId = state.game ? state.game.matchId : '';
      // (F4B — THE PAUSE GAP: a HELD run's log — the hold with it — leaves AT ONCE, even behind a chunk in the air: its arrival is what grants the pause)
      isMatch = !!state.game && state.game.mode !== 'solo';
      cur = { go: askGo, resume, unstamped, again, frame: () => flush(false), over, end: r => (isMatch ? endMatch(r) : end(r)), watchTap: () => { followPick = nextFollow(S.ghostRows(), followUid); }, shotKey: () => matchId, hide: held => { if (S && started && !S.state().over) { if (held) { holdSrv = serverNow(); holdN = finalCount(S.run()); } flush(held ? 'now' : true); } }, leave };
      const had = unpark();
      if (had) { S = had; S.moveTo(el); S.el.classList.remove('is-final'); S.restart(); }
      else S = createStage(el, drv);
      if (!S) return;
      S.el.classList.add('ff-game');
      if (TEST) globalThis.__ffGame = { stage: S, writer: () => W.state(), state: () => ({ matchId, go, proven, spent, started, wroteE, whyNot, stranded, final: !!final, sent: W.state().sent, chunks: W.state().chunks, acked: W.state().acked, end: W.state().end, stage: S.state(),
        isMatch, haveGo, seed: mSeed, playAt: mPlayAt, adopted, lateGo, missed, holds: holdsRun(), liveWaited: liveWait.waited(), watching: S.watching(), follow: followUid, call: !!callEl, callLine, out: !!outRes, hud: S.matchState() }) };
      if (isMatch) { S.setMatch(true); pumpIv = setInterval(pumpMatch, 100); }
      sync();
    },
    holdsRun,
    update(state) { st = state; sync(); },
    unmount() {
      gone = true; clearTimeout(goTimer); clearTimeout(finalTimer); clearInterval(pumpIv);
      if (callEl) { callEl.remove(); callEl = null; }
      if (S && started && !S.state().over) flush(true);   // (a QUIT mid-run: what was played is in the proof)
      W.close();   // (… what is logged leaves now, in order; nothing is tried again once the view is gone)
      if (final) final.destroy();
      if (finalWrap) finalWrap.remove();
      if (cur && cur.go === askGo) cur = null;
      if (S) { if (!isMatch && performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(S); else S.destroy(); }
      S = null;
    },
  };
}
