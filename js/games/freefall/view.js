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
// F4A = THE SOLO RUN. THE MATCH (ghosts, Call the Winner, the podium, the finish) + the end screen's logo header + SHARE = F4B.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { dbRef, set as dbSet, get as dbGet, serverTimestamp, serverNow, expectRefusal } from '../../firebase.js';
import { createProofWriter } from '../kit/proof-writer.js';
import { proofIo, stampT0 } from '../kit/proof-io.js';
import { liveKeyFor } from '../registry.js';
import { createFinal } from '../../ui/final.js';
import { backToLobby } from '../../host.js';
import { seedOf, gameStandings } from './logic.js';
import { CLOCK, START_LEAD_MS, START_LATE_MS, finalCount, packRange, eventsOf } from './proof.js';
import { scoreNode } from './director.js';
import { BEST_KEY, cleanBest } from './best.js';
import { SRV_BEST_KEY } from './lines.js';
import { createStage, newSeed } from './stage.js';
import { soloGo, GO_WAIT_MS } from '../highrise/go.js';   // (THE SOLO GO — PURE + generic: up to 7 tries, the server's copy read again, ≤ 9 s)

export { GO_WAIT_MS };
/** an UNPROVEN run's words — on screen while it is on (the stage's quiet line) + its end card's reason */
export const NOT_COUNTED = Object.freeze({ net: 'NOT COUNTED — NO CONNECTION', line: 'NOT COUNTED — NO LINE TO THE BOARD', pause: 'NOT COUNTED PAST THE PAUSE — NO CONNECTION' });
export const notCounted = why => (why === 'no answer' || why === 'late' ? NOT_COUNTED.net : NOT_COUNTED.line);
/** the podium is waited this long after a proven run's end before the stage's own card says NO SIGNAL (never a frozen screen) */
export const FINAL_WAIT_MS = 6000;
/** a hold's stamp is waited this long (the count is 2.4 s: an answer after it is no use to that count) */
export const STAMP_WAIT_MS = 2300;

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
  onHide: () => { if (cur) cur.hide(); },
  onLeave: () => (cur ? cur.leave() : null),
  leaveWords: 'BACK',
};

export function createView() {
  let S = null, st = null, gone = false, code = '', uid = '', matchId = '';
  let go = 0, proven = false, spent = false, started = false, wroteE = false, lateSeen = '', whyNot = '', stranded = false;
  let final = null, finalWrap = null, goTimer = 0, finalTimer = 0;
  const mine = g => !!(g && g.participants && g.participants[uid]);
  const treePath = () => `rooms/${code}/ff/${matchId}`, nodePath = () => `${treePath()}/${uid}`;
  let lkGame = null, lkKey = null;
  const runsNow = () => { const g = st && st.game; if (!g) return null; if (g !== lkGame) { lkGame = g; lkKey = liveKeyFor(g); } return (st.liveKey === lkKey && st.live && st.live.runs) || null; };
  /** a server time → this page's clock (the stage's tick 0 is a performance.now() value) */
  const perfOf = srv => performance.now() - (serverNow() - srv);
  const matchLeft = () => !!matchId && (!st.game || st.game.matchId !== matchId || st.game.phase !== 'play');
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
    count: () => (S && proven ? finalCount(S.run()) : 0), pack: (a, b) => packRange(S.run(), a, b), entriesOf: eventsOf,
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
        go = goAt; proven = true; whyNot = ''; wroteE = false; W.reset();
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
          return stampT0(treePath(), 'freefall').then(() => (stale() ? Promise.reject(new Error('the run stopped waiting')) : dbSet(dbRef(path), serverTimestamp())));
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
      dbSet(dbRef(path), serverTimestamp()).then(() => dbGet(dbRef(path))).then(snap => { clearTimeout(t); const v = snap.val(); res(!gone && m === matchId && typeof v === 'number' && v > 0 ? perfOf(v) : 0); }, () => { clearTimeout(t); res(0); });
    });
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
    final = createFinal({ game: g, rows: gameStandings(g).map(r => ({ uid: r.uid, rank: r.rank, score: r.floor })), players: st.players, me: uid, presence: st.presence, kicker: 'FREEFALL · SOLO', mode: 'SOLO', scoreLabel: 'FLOORS' });
    finalWrap = h('div.ff-final', final.el);
    S.el.classList.add('is-final'); S.el.append(finalWrap);
  }
  function sync() {
    const g = st && st.game;
    if (!g || !S) return;
    if (matchLeft()) lateProof('seen');   // (from the moment this phone sees the match end, a chunk / e still in flight is an expected refusal)
    if (g.phase === 'final' && g.matchId === matchId && !final && (!started || S.state().shown)) showFinal(g);   // (a run's own end is SEEN first — the stage's end hold)
    if (g.phase === 'play' && mine(g) && !started && !S.state().starting) { const runs = runsNow(), n = runs ? runs[uid] : null; if (n && n.go > 0 && !n.e) strand(n); }
    if (final) final.refresh();
  }

  return {
    mount(el, state) {
      st = state; code = state.code; uid = state.uid; matchId = state.game ? state.game.matchId : '';
      cur = { go: askGo, resume, unstamped: () => (proven ? NOT_COUNTED.pause : ''), frame: () => flush(false), over, end, hide: () => { if (S && started && !S.state().over) flush(true); }, leave };
      const had = unpark();
      if (had) { S = had; S.moveTo(el); S.el.classList.remove('is-final'); S.restart(); }
      else S = createStage(el, drv);
      if (!S) return;
      S.el.classList.add('ff-game');
      if (TEST) globalThis.__ffGame = { stage: S, writer: () => W.state(), state: () => ({ matchId, go, proven, spent, started, wroteE, whyNot, stranded, final: !!final, sent: W.state().sent, chunks: W.state().chunks, acked: W.state().acked, end: W.state().end, stage: S.state() }) };
      sync();
    },
    update(state) { st = state; sync(); },
    unmount() {
      gone = true; clearTimeout(goTimer); clearTimeout(finalTimer);
      if (S && started && !S.state().over) flush(true);   // (a QUIT mid-run: what was played is in the proof)
      W.close();   // (… what is logged leaves now, in order; nothing is tried again once the view is gone)
      if (final) final.destroy();
      if (finalWrap) finalWrap.remove();
      if (cur && cur.go === askGo) cur = null;
      if (S) { if (performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(S); else S.destroy(); }
      S = null;
    },
  };
}
