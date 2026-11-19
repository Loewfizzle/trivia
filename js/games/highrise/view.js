// HIGH RISE — THE GAME's SCREEN (S4A — docs/highrise.md "THE CARTRIDGE" · "THE PROOF"): THE STAGE (stage.js — the SAME run loop, scene, HUD
// + sounds /highrise-play mounts) in the console's frame, and everything a run WRITES — which the stage never does itself:
//   · GO: the proof node's first value (the SERVER's time), read back → the seed (logic.js#seedOf) + tick 0 — the run is on the server's clock
//   · THE PROOF: the tap log in chunks, one a second while there are new taps — c/{i} = { s, at: the SERVER's time }; at the end the last
//     chunk, then `e` (a signal: the host's step ends the match on it — never read as a score)
//   · THE END = the console's podium frame (ui/final.js) with this game's body (final.js); PLAY AGAIN = the console's INSTANT AGAIN
//   · an UNPROVEN run (GO refused / unanswered: no signal, the rules not yet re-published) still PLAYS — on a seed of its own, never
//     counted — and ends on the stage's own card (NOT COUNTED — NO LINE TO THE BOARD)
// JAYWALK's view.js is the pattern (docs/jaywalk.md "THE SOLO GAME"). S4A = THE SOLO RUN; THE MATCH is S4B.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { dbRef, set as dbSet, get as dbGet, update as dbUpdate, serverTimestamp, serverNow, expectRefusal } from '../../firebase.js';
import { liveKeyFor } from '../registry.js';
import { createFinal } from '../../ui/final.js';
import { backToLobby } from '../../host.js';
import { seedOf, gameStandings } from './logic.js';
import { CLOCK, packFrom, tapsFromChunks } from './proof.js';
import { BEST_KEY, cleanBest } from './best.js';
import { BOARD, SRV_BEST_KEY, TABLE_KEEP_MS, parseTable } from './lines.js';
import { createStage, newSeed } from './stage.js';

/** GO's answer is waited this long before a run goes on UNPROVEN (never a stuck start) */
export const GO_WAIT_MS = 4000;
/** the podium is waited this long after a proven run's end before the stage's own card says NO SIGNAL (never a frozen screen) */
export const FINAL_WAIT_MS = 6000;

// (the pass's own checks — tests/integration/e2e-highrise.mjs — on a LOCAL emulator page only: never on the live site)
const TEST = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]emu(?:&|=|$)/.test(location.search || '');
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* a private window forgets: fine */ } } };

// THE SCENE STAYS WARM over PLAY AGAIN (the console's INSTANT AGAIN remounts the view): the stage is parked a moment, the next mount takes
// it back (its WebGL context, its programs, its plates, its decoded sounds) — anything else frees it at once. The stage is ONE object
// whose driver (`drv`) hands every call to the view that holds it now (`cur`).
let parked = null, cur = null;
// THE NEXT FRIEND's DATA (lines.js): YOUR TABLE's HIGH RISE bests (the SERVER's — yours + your friends'), asked ONCE at a run's start,
// kept a short while; /api down / counting OFF = no friend lines (the board has no rows)
let table = null;   // { uid, at, p: Promise<{ best, friends } | null> }
function loadTable(uid) {
  if (table && table.uid === uid && performance.now() - table.at < TABLE_KEEP_MS) return table.p;
  const p = lazyImport(import('../../profile/api.js'), '../../profile/api.js').then(A => A.api('profile', { action: 'table', b: BOARD })).then(d => parseTable(d && d.rows)).catch(() => null);
  table = { uid, at: performance.now(), p };
  return p;
}
const unpark = () => { if (!parked) return null; clearTimeout(parked.t); const p = parked; parked = null; return p.S; };
const park = S => { if (parked) { clearTimeout(parked.t); parked.S.destroy(); } S.el.remove(); parked = { S, t: setTimeout(() => { if (parked && parked.S === S) { parked = null; S.destroy(); } }, 2500) }; };
const lookNow = () => (typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'day' : 'night');
const drv = {
  hook: TEST ? '__hiStage' : '',
  lookNow,
  // YOUR BEST: the SERVER's (the best it last told this phone — once counting is ON); while counting is OFF, this phone's own (the test page's key)
  best: { read: () => cleanBest(ls.get(SRV_BEST_KEY)) || cleanBest(ls.get(BEST_KEY)), write: n => { const was = cleanBest(ls.get(SRV_BEST_KEY)) || cleanBest(ls.get(BEST_KEY)); ls.set(BEST_KEY, n); if (cur) cur.best(was, n); } },
  go: () => (cur ? cur.go() : Promise.resolve(null)),
  onFrame: now => { if (cur) cur.frame(now); },
  onOver: r => { if (cur) cur.over(r); },
  onEnd: r => (cur ? cur.end(r) : { own: true }),
  onShow: () => { if (cur) cur.shown(); },
  onHide: () => { if (cur) cur.hide(); },   // (THE REVIEW: the last second's taps go up as the page is hidden — never left for the return)
  friends: () => (cur ? cur.friends() : []),
};

export function createView() {
  let S = null, st = null, gone = false, code = '', uid = '', matchId = '';
  let go = 0, proven = false, spent = false, started = false, sent = 0, chunkN = 0, lastFlush = 0, wroteE = false, verifyFirst = false, lateSeen = '';
  let final = null, finalWrap = null, leaveBtn = null, goTimer = 0, finalTimer = 0, friends = [];
  const mine = g => !!(g && g.participants && g.participants[uid]);
  const nodePath = () => `rooms/${code}/hr/${matchId}/${uid}`;
  const runsNow = () => (st && st.game && st.liveKey === liveKeyFor(st.game) && st.live && st.live.runs) || null;
  /** a server time → this page's clock (the stage's tick 0 is a performance.now() value) */
  const perfOf = srv => performance.now() - (serverNow() - srv);
  const matchLeft = () => !!matchId && (!st.game || st.game.matchId !== matchId || st.game.phase !== 'play');
  const refused = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => m.reportError(new Error('HIGH RISE: the proof node was refused — the run plays UNPROVEN (re-publish database.rules.json: rooms/{CODE}/hr)'), 'rules')).catch(() => {});
  const countQuietLate = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => { if (typeof m.countQuiet === 'function') m.countQuiet('late-proof'); }).catch(() => {});   // (THE STALE-MODULE RULE: an existing export, lazily)
  /** a chunk / the end still in flight when the match left `play` is an EXPECTED refusal — counted, never a row (JAYWALK's THE LATE PROOF CHUNK) */
  function lateProof(why) {
    if (lateSeen === matchId || !proven) return;
    lateSeen = matchId;
    expectRefusal(`${nodePath()}/c`, `highrise: a proof chunk after the match ended (${why})`, 90_000, 'late-proof');
    expectRefusal(`${nodePath()}/e`, `highrise: the end after the match ended (${why})`, 90_000, 'late-proof');
  }

  /** GO: the proof node's first write — the SERVER's time, read back → the seed + tick 0. → the run the stage adopts */
  function askGo() {
    const m = matchId, path = `${nodePath()}/go`;
    return new Promise(res => {
      let done = false;
      // (THE REVIEW — A LATE ANSWER NEVER TOUCHES A RUN THAT WENT ON: each call checks ITS OWN state — done / gone / another match — BEFORE
      //  it writes anything of the view's; JAYWALK's `mode !== 'wait'` guard)
      const stale = () => done || gone || m !== matchId;
      const fin = G => { done = true; clearTimeout(goTimer); started = true; res(G); };
      const proof = (goAt, chunks) => {
        // (a GO that landed AFTER this run went on unproven: this match's one GO is spent — the next run here plays unproven too,
        //  never on a minutes-old GO)
        if (stale()) { if (!gone && m === matchId) spent = true; return; }
        const old = chunks ? tapsFromChunks(chunks) : null;
        go = goAt; proven = true; sent = old ? old.length : 0; chunkN = chunks ? Object.keys(chunks).length : 0; verifyFirst = !!chunks; wroteE = false;
        fin({ seed: seedOf(code, matchId, go), t0: perfOf(go), taps: old || [] });
      };
      /** no proof here (no signal, the rules not published, this match's one GO already spent): the run still PLAYS — on its own seed, never counted */
      const unproven = why => { if (stale()) return; if (why === 'refused') refused(); go = 0; proven = false; fin({ seed: newSeed(), t0: performance.now(), taps: [] }); };
      if (spent || matchLeft()) { unproven('again'); return; }
      clearTimeout(goTimer);
      goTimer = setTimeout(() => unproven('no answer'), GO_WAIT_MS);
      // a refresh / a rejoin mid-run: the run so far is in the node — READ FROM THE SERVER (never this phone's mirror: while a GO of its
      // own is unacknowledged the mirror holds the phone's ESTIMATE of the server's time — the seed is never picked from an estimate)
      const runs = runsNow(), node = runs ? runs[uid] : null;
      if (node && node.go > 0) {
        dbGet(dbRef(nodePath())).then(snap => { const n = snap.val(); if (n && n.go > 0 && !n.e) proof(n.go, n.c); else unproven('again'); }).catch(() => unproven('again'));
        return;
      }
      expectRefusal(path, 'highrise GO: already written (a rejoin) or the rules are not published yet');
      dbSet(dbRef(path), serverTimestamp()).then(() => dbGet(dbRef(path))).then(snap => {
        const v = snap.val();
        if (typeof v === 'number' && v > 0) proof(v, null); else unproven('no go');
      }).catch(() => {
        // refused: this run's GO is already there (a rejoin) — take the node; nothing there = unproven
        dbGet(dbRef(nodePath())).then(snap => { const n = snap.val(); if (n && n.go > 0 && !n.e) proof(n.go, n.c); else unproven('refused'); }).catch(() => unproven('refused'));
      });
    });
  }
  /** THE PROOF: the new taps go up as chunks (one a second; `force` = now) — each stamped by the SERVER when it arrives */
  function flush(force) {
    const taps = S.taps();
    if (!proven || sent >= taps.length) return;
    if (matchLeft()) { lateProof('dropped'); sent = taps.length; countQuietLate(); return; }
    if (verifyFirst) {   // (a rejoin: the chunks read fresh first — an index already there is never sent again)
      verifyFirst = false;
      const m = matchId;
      dbGet(dbRef(`${nodePath()}/c`)).then(snap => {
        if (gone || m !== matchId) return;
        const c = snap.val(), n = c ? Object.keys(c).length : 0;
        if (n > chunkN) { chunkN = n; sent = Math.min(S.taps().length, (tapsFromChunks(c) || []).length); countQuietLate(); }
        flush(true);
      }, () => flush(true));
      return;
    }
    const now = performance.now();
    if (!force && now - lastFlush < CLOCK.flushMs) return;
    lastFlush = now;
    while (sent < taps.length && chunkN < CLOCK.chunks) {
      let n = taps.length - sent, s = packFrom(taps, sent, sent + n);
      while (s.length > CLOCK.chunkMax && n > 1) { n = Math.ceil(n / 2); s = packFrom(taps, sent, sent + n); }
      dbSet(dbRef(`${nodePath()}/c/${chunkN}`), { s, at: serverTimestamp() }).catch(() => { /* a refused chunk: the server simply can't count the run */ });
      chunkN++; sent += n;
    }
  }
  /** the run is over: the last chunk, then `e` — the host's step ends the match on it (a signal: never read as a score) */
  function over(r) {
    flush(true);
    if (!proven || wroteE) return;
    wroteE = true; spent = true;
    if (matchLeft()) { lateProof('the end after the end'); countQuietLate(); return; }
    dbUpdate(dbRef(nodePath()), { e: { f: r.floor, t: r.tick, w: String(r.cause || '').slice(0, 12) } }).catch(() => {});
  }
  /** the end card's moment: a PROVEN run ends on the console's podium (it comes with the host's step); an UNPROVEN one on the stage's own card */
  function end() {
    if (!proven) { showLeave(); return { own: true, note: 'NOT COUNTED — NO LINE TO THE BOARD' }; }
    clearTimeout(finalTimer);
    // (the end has not reached the room — no signal: never a frozen screen; the run is in the node / the queue and counts when it lands)
    finalTimer = setTimeout(() => { if (!gone && !final && S) { S.showCard('NO SIGNAL — YOUR RUN COUNTS WHEN IT IS BACK'); showLeave(); } }, FINAL_WAIT_MS);
    sync();
    return { own: false };
  }
  /** the stage's own card has no console foot: its way out (the unproven run / no signal) */
  function showLeave() {
    if (leaveBtn || !S) return;
    const PN = globalThis.__nsPlayNow, soloRoom = !!(PN && PN.isSolo && PN.isSolo());
    leaveBtn = h('button.hi-leave', { type: 'button', 'data-press': '', onclick: () => { leaveBtn.classList.add('is-busy'); Promise.resolve(soloRoom ? PN.leave() : backToLobby()).catch(() => leaveBtn && leaveBtn.classList.remove('is-busy')); } }, soloRoom ? 'BACK TO THE CITY' : 'BACK TO THE ROOM');
    S.el.append(leaveBtn);
  }
  /** the console's podium frame; its body = this game's end screen (final.js#finalScene) */
  function showFinal(g) {
    clearTimeout(finalTimer);
    if (leaveBtn) { leaveBtn.remove(); leaveBtn = null; }
    S.hideCard();   // (THE REVIEW: the podium takes the screen — the stage's own NO SIGNAL card is put away, a key can not restart under it)
    final = createFinal({ rows: gameStandings(g).map(r => ({ uid: r.uid, rank: r.rank, score: r.floor })), players: st.players, me: uid, presence: st.presence, kicker: 'HIGH RISE · SOLO', scoreLabel: 'FLOORS', winnerLine: nm => `${nm} BUILT THE TALLEST` });
    finalWrap = h('div.hi-final', final.el);
    S.el.classList.add('is-final'); S.el.append(finalWrap);
  }
  function sync() {
    const g = st && st.game;
    if (!g || !S) return;
    if (matchLeft()) lateProof('seen');   // (from the moment this phone sees the match end, a chunk / e still in flight is an expected refusal)
    if (g.phase === 'final' && g.matchId === matchId && !final && (!started || S.state().shown)) showFinal(g);   // (a run's own end is SEEN first — the stage's end hold)
    // a refresh mid-run: the run so far is in the node — taken back at once (the fuse has most likely ended it: its end is written now)
    if (g.phase === 'play' && mine(g) && !started && !S.state().starting) { const runs = runsNow(), n = runs ? runs[uid] : null; if (n && n.go > 0 && !n.e) S.start(); }
    if (final) final.refresh();
  }

  return {
    mount(el, state) {
      st = state; code = state.code; uid = state.uid; matchId = state.game ? state.game.matchId : '';
      cur = { go: askGo, frame: () => flush(false), over, end, hide: () => { if (S && started && !S.state().over) flush(true); }, best: (was, v) => { globalThis.__hiNewBest = { m: matchId, was, v }; }, shown: () => { if (proven && go > 0 && S && !S.state().over) S.setT0(perfOf(go)); }, friends: () => friends };
      const had = unpark();
      if (had) { S = had; el.replaceChildren(S.el); S.el.classList.remove('is-final'); S.restart(); }
      else S = createStage(el, drv);
      if (!S) return;
      S.el.classList.add('hi-game');
      // THE NEXT FRIEND's tape (lines.js — YOUR TABLE's HIGH RISE bests, the SERVER's: empty while counting is OFF)
      loadTable(uid).then(T => { if (gone || !T) return; friends = T.friends; if (T.best > 0) ls.set(SRV_BEST_KEY, T.best); if (S) S.friends(); });
      if (TEST) globalThis.__hiGame = { stage: S, state: () => ({ matchId, go, proven, spent, started, sent, chunks: chunkN, wroteE, final: !!final, leave: !!leaveBtn, friends: friends.map(f => `${f.n} ${f.v}`), stage: S.state() }), setFriends(f) { friends = f; S.friends(); } };
      sync();
      // PLAY AGAIN's remount (the console's INSTANT AGAIN): the next run starts at once — its tap WAS the PLAY AGAIN
      if (performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000 && state.game && state.game.phase === 'play' && mine(state.game)) S.start();
    },
    update(state) { st = state; sync(); },
    unmount() {
      gone = true; clearTimeout(goTimer); clearTimeout(finalTimer);
      if (S && started && !S.state().over) flush(true);   // (a QUIT mid-run: what was dropped is in the proof)
      if (final) final.destroy();
      if (finalWrap) finalWrap.remove();
      if (leaveBtn) leaveBtn.remove();
      if (cur && cur.go === askGo) cur = null;
      if (S) { if (performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(S); else S.destroy(); }
      S = null;
    },
  };
}
