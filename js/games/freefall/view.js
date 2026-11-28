// FREEFALL — THE GAME's SCREEN (F4A — docs/freefall.md "THE … view.js#1
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
import { isHost, setState } from '../../store.js';
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
export const NOT_COUNTED = Object.freeze({ net: 'NOT COUNTED — NO CONNECTION', line: 'NOT COUNTED — NO LINE TO THE BOARD', pause: 'NOT COUNTED PAST THE PAUSE — NO CONNECTION', dup: 'NOT COUNTED — OPEN IN ANOTHER TAB' });
export const notCounted = why => (why === 'no answer' || why === 'late' ? NOT_COUNTED.net : why === 'dup' ? NOT_COUNTED.dup : NOT_COUNTED.line);
// the podium is waited this long after a proven run's end … view.js#2
export const FINAL_WAIT_MS = 6000;
// PLAY AGAIN on the stage's own card: the orphan match's end … view.js#3
export const AGAIN_WAIT_MS = 3500;
/** a hold's stamp is waited this long (the count is 2.4 s: an answer after it is no use to that count) */
export const STAMP_WAIT_MS = 2300;
// F4B — a MATCH: a match is over (the host's step) while this … view.js#4
export const FINAL_HOLD_MS = 3000;
/** … this phone writes its GO this long before the count's end (the rules open the window 2 s before it) */
export const GO_EARLY_MS = 1800;
// … the cause's words stay this long over the scene before … view.js#5
export const OUT_SHOW_MS = 2300, MADE_SHOW_MS = 3600;
// FIX B — S8: the line on a phone that is not in the room's … view.js#6
export const NOT_HERE = 'PLAYING — WAIT FOR THE REMATCH', PLAIN_AFTER_MS = 3000;
/** THE ORDER: the cause's words → Call the Winner → WATCH (the match's end-to-end run: the watch began 0.9 s after an out, under the OUT
 *  card, and the call's sheet then opened over both). The call opens once the OUT card has left; the watch waits for the card AND the call. */
export const CALL_AFTER_MS = OUT_SHOW_MS + 400, WATCH_AFTER_MS = OUT_SHOW_MS + 500;

// (the pass's own checks — tests/integration/e2e-freefall.mjs — on a LOCAL emulator page only: never on the live site)
const TEST = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]emu(?:&|=|$)/.test(location.search || '');
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* this page only */ } } };

// THE SCENE STAYS WARM over PLAY AGAIN (the console's INSTANT … view.js#7
let parked = null, cur = null;
const unpark = () => { if (!parked) return null; clearTimeout(parked.t); const p = parked; parked = null; return p.S; };
const park = S => { if (parked) { clearTimeout(parked.t); parked.S.destroy(); } S.el.remove(); parked = { S, t: setTimeout(() => { if (parked && parked.S === S) { parked = null; S.destroy(); } }, 2500) }; };
const lookNow = () => (typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'day' : 'night');
const drv = {
  hook: TEST ? '__ffStage' : '',
  lookNow,
  lookLock: () => (cur && cur.lookLock ? cur.lookLock() : null),
  matchT0: () => (cur && cur.matchT0 ? cur.matchT0() : null),   // (FIX B — S15: a match's tick 0 on this page's clock NOW, from the server's time)
  said: { seen: s => ls.get('ff:last') === s, keep: s => ls.set('ff:last', s) }, // view#8
  // YOUR BEST: the SERVER's — the best it last told this phone … view.js#9
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
  // F5C — THE MUSIC DUCKS under the big moments (sounds.js#DUCK … view.js#10
  duck: on => { try { if (on) { if (ducked == null) ducked = musicDuckLevel(); duckMusic(Math.min(ducked, DUCK.level), DUCK.inS); } else if (ducked != null) { duckMusic(ducked, DUCK.outS); ducked = null; } } catch { /* polish */ } },
};
let ducked = null;

export function createView() {
  let S = null, st = null, gone = false, code = '', uid = '', matchId = '';
  let go = 0, proven = false, spent = false, started = false, wroteE = false, lateSeen = '', whyNot = '', stranded = false;
  let final = null, finalWrap = null, goTimer = 0, finalTimer = 0, capN = -1, againing = false; // view#11
  let holdSrv = 0, holdN = 0; // view#12
  // the match (F4B)
  let isMatch = false, haveGo = false, goAsked = false, goTries = 0, mSeed = '', mPlayAt = 0, adopted = false, pumpIv = 0, lateGo = false, missed = false, everProven = false, finalSeen = 0;
  let outAt = 0, outRes = null, outShown = false, callEl = null, callLine = '', callDone = false, liveRuns = null, followUid = '', followPick = '', watchKey = '', countNames = null, playersSeen = null, partsSeen = null;
  const meRec = { floor: 0, over: false, made: false, cause: '' };
  // FIX B — Grok's G2: A YIELDED DUPLICATE TAB (the same slot … view.js#13
  const dup = () => !!(st && st.dupTab);
  let dupSeen = false, wasDup = false, soloHeld = false;
  let outSrv = 0, finalRes = '', plainT = 0; // view#14
  const hexOf = u => colorHex(((st.players && st.players[u]) || {}).color) || '#00f0ff';
  const nameOf = u => String(((st.players && st.players[u]) || {}).name || 'GHOST').toUpperCase();
  // THE CONSOLE FIX — THE RUN HOLD (kit/run-hold.js; … view.js#15
  const pingRouter = createRouterPing(), liveWait = createLiveWait(liveOf);
  const runLive = () => isMatch && proven && started && adopted && !missed && !!S && !S.me(meRec).over;
  function holdsRun() {
    if (gone || !isMatch || !proven || !S) return false;
    if (runLive()) return true;
    if (!wroteE || !outRes) return false;
    const since = performance.now() - outAt;
    return since < (outRes.cause === 'made' ? MADE_SHOW_MS : OUT_SHOW_MS) || (since < END_OWED_MS && W.owes());
  }
  // the podium after a wait: scored from the nodes as they … view.js#16
  const scoredNow = g => { try { const { phaseStartAt, endAt, ...p } = finalPatch(g, runsNow() || {}, serverNow(), code); void phaseStartAt; void endAt; return { ...g, ...p }; } catch { return g; } };   // (FIX B: the podium's own moment stays the host's)
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
  // a chunk / the end still in flight when the match left … view.js#17
  function lateProof(why) {
    if (lateSeen === matchId || !proven) return;
    lateSeen = matchId;
    expectRefusal(`${nodePath()}/c`, `freefall: a proof chunk after the match ended (${why})`, 90_000, 'late-proof');
    expectRefusal(`${nodePath()}/e`, `freefall: the end after the match ended (${why})`, 90_000, 'late-proof');
    expectRefusal(`${nodePath()}/h`, `freefall: a hold's stamp after the match ended (${why})`, 90_000, 'late-proof');
  }

  // THE PROOF (kit/proof-writer.js — JAYWALK's + HIGH RISE's): … view.js#18
  const W = createProofWriter({
    count: () => { if (!S || !proven) return 0; const n = finalCount(S.run()); return capN >= 0 && n > capN ? capN : n; }, pack: (a, b) => packRange(S.run(), a, b), entriesOf: eventsOf,
    chunkMax: CLOCK.chunkMax, chunks: CLOCK.chunks, flushMs: () => CLOCK.flushMs, left: matchLeft,
    onLate: why => { lateProof(why); if (why === 'dropped') countQuietLate(); },
    onDead: why => report(`FREEFALL: the proof log could not be completed (${why}) — the run can not count`, 'rules'),
    io: proofIo(nodePath),
  });

  // GO: the proof node's first write — the SERVER's time, read … view.js#19
  function askGo() {
    const m = matchId, path = `${nodePath()}/go`;
    return new Promise(res => {
      let done = false;
      // (A LATE ANSWER NEVER TOUCHES A RUN THAT WENT ON: each call … view.js#20
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
      if (dup()) { go = 0; proven = false; whyNot = 'dup'; fin({ seed: newSeed(), t0: performance.now(), note: NOT_COUNTED.dup }); return; } // view#21
      if (spent || matchLeft()) { unproven('again'); return; }
      clearTimeout(goTimer);
      // THE SOLO GO (highrise/go.js): THE STAMP + the GO, tried … view.js#22
      soloGo({
        write: () => {
          expectRefusal(path, 'freefall GO: already written (a rejoin) or the rules are not published yet', GO_WAIT_MS + 6000);
          // (F4B — THE FRESH-EYES REVIEW: the GO is a TRANSACTION, … view.js#23
          return stampT0(treePath(), 'freefall').then(() => (stale() ? Promise.reject(new Error('the run stopped waiting')) : runTransaction(dbRef(path), cur => (cur == null ? serverTimestamp() : undefined), { applyLocally: false })));
        },
        read: () => dbGet(dbRef(nodePath())).then(snap => snap.val()),
        now: () => performance.now(), timer: (fn, ms) => { goTimer = setTimeout(fn, ms); }, stale: () => gone || m !== matchId,
      }).then(r => {
        if (!(r.go > 0)) { if (r.why !== 'left') unproven(r.why); return; }
        // (a GO already carrying chunks = a run of before a refresh: … view.js#24
        if (r.c || serverNow() - r.go > START_LATE_MS) { unproven(r.c ? 'again' : 'late'); return; }
        proof(r.go);
      });
    });
  }
  /** a HOLD's way back, stamped: h/{i} = the SERVER's time the 3 · 2 · 1 began → this page's clock at that moment (0 = no stamp: the line).
   *  Written again at every count (a page hidden again in the 3 · 2 · 1 starts it over) — the judge reads the last one. */
  function resume(i) {
    if (!proven || dup()) return Promise.resolve(performance.now());   // (an UNPROVEN run needs no stamp: its count runs from now — a yielded tab writes none)
    const m = matchId, path = `${nodePath()}/h/${i}`;
    if (matchLeft()) lateProof('seen');
    expectRefusal(path, 'freefall: a hold\'s stamp — the rules are not re-published yet, or the match moved on', STAMP_WAIT_MS + 4000);
    return new Promise(res => {
      const t = setTimeout(() => res(0), STAMP_WAIT_MS);
      const stamp = () => dbSet(dbRef(path), serverTimestamp()).then(() => dbGet(dbRef(path))).then(snap => { clearTimeout(t); const v = snap.val(); res(!gone && m === matchId && typeof v === 'number' && v > 0 ? perfOf(v) : 0); });
      // F4B — THE PAUSE GAP: WAS THIS PAUSE GRANTED? The hold's own … view.js#25
      granted(i, holdSrv).then(ok => { if (ok === false) { clearTimeout(t); res(-1); return null; } return stamp(); }).catch(() => { clearTimeout(t); res(0); });
    });
  }
  // → true (the i-th hold's chunk was stamped in time) | false … view.js#26
  function granted(i, held) {
    // THE FRESH-EYES REVIEW (HIGH): this phone's mirror answers a … view.js#27
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
    if (capN < 0) capN = finalCount(S.run()); // view#28
    return NOT_COUNTED.pause;
  }
  /** PLAY AGAIN on the stage's OWN card (an UNPROVEN run, NO SIGNAL): this match's one GO is spent and its match never ended (no `e`) — the
   *  host (this phone, a room of one) marks the run ended (`game.x/{uid}`: director.js ends the match), then THE INSTANT AGAIN starts a NEW
   *  match — its own GO: the next run can count. No line / not the host → false: the stage starts over in this match (not counted, said so) */
  function again() {
    const g = st && st.game, m = matchId;
    if (againing || gone || dup() || !g || g.matchId !== m || !isHost() || !mine(g)) return Promise.resolve(false);
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
  function flush(force) { if (proven && S && !dup()) W.flush(force); }
  // the run is over: the last chunk, then `e` — the host's step … view.js#29
  function over(r) {
    if (!outSrv && isMatch) outSrv = serverNow(); // view#30
    flush(true);
    if (!proven || wroteE || dup()) return;
    wroteE = true; spent = true;
    W.end({ f: r.floor, t: r.tick, w: String(r.cause || '').slice(0, 12) });
  }
  // ---- F4B — THE MATCH
  /** GO (a MATCH): this phone's own `go` — its proof of being there; the FIRST one to land is the match's (core/proof.js#firstGo). A
   *  TRANSACTION, never applied locally (THE NODES ARE THE TRUTH: the mirror holds confirmed GOs only). A refusal (this phone's clock a
   *  touch early, a rejoin) is looked at and tried again a few times — never a stuck start: the count runs on. */
  function askGoMatch() {
    if (goAsked || dup()) return;
    goAsked = true;
    const m = matchId, runs = runsNow(), node = runs ? runs[uid] : null;
    if (node && node.go > 0) { haveGo = true; return; }
    const tryAgain = () => { if (gone || m !== matchId) return; if (goTries++ < 7) setTimeout(() => { goAsked = false; }, 420); else refused(); };
    // (THE PROOF PASS: the stamp + the GO are the kit's — kit/proof-io.js#writeMatchGo, JAYWALK's + HIGH RISE's too)
    writeMatchGo(treePath(), uid, 'freefall', runs).then(ok => { if (gone || m !== matchId) return; if (ok) haveGo = true; else tryAgain(); }, tryAgain);
  }
  // "YOUR OWN PHONE MISSED THE GO": has a ball NOBODY STEERED … view.js#31
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
    // "YOUR OWN PHONE MISSED THE GO" (HIGH RISE's): it reaches … view.js#32
    missed = mine(g) && !moves.length && !(node && node.e) && ballGone(St);
    dupSeen = dup();
    feedRivals(g, runs || {}); // view#33
    if (dupSeen) { missed = false; S.adopt({ seed: St.seed, t0: perfOf(St.playAt), spectate: true }); }   // (FIX B: a yielded tab only WATCHES its own match)
    else if (missed) { callDone = true; S.adopt({ seed: St.seed, t0: perfOf(St.playAt), spectate: true }); }
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
  // OUT in a match: the cause's words over the scene for a … view.js#34
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
      // (JAYWALK's THE LATE k WRITE: never a pick for a player … view.js#35
      callEl = showCall({ canPick: u => !(liveRuns && liveRuns[u] && liveRuns[u].e != null), expect: 'freefall call: the match moved on before the pick landed', overlay: S.over, game: g, st: { live: { calls: made ? { [uid]: made } : {} } }, me: uid, player: u => st.players[u] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' }, candidates: cands, path: `${nodePath()}/k`,
        line: u => { const x = others.find(o => o.uid === u), n = x ? x.floor : 0; return `FLOOR ${n}`; }, intro: n => `${n} still falling — who goes the deepest? A right call earns game-night points.`,
        ended: () => !st.game || st.game.phase !== 'play' || st.game.matchId !== matchId, onState: msg => { callLine = msg === 'NO CALL' ? '' : msg; callEl = null; }, isDestroyed: () => gone });
    }
    // WHOM THE WATCHER FOLLOWS: the one picked by a tap while … view.js#36
    const held = since >= (r && r.cause === 'made' ? MADE_SHOW_MS : WATCH_AFTER_MS) || !mine(g) || missed || dupSeen;
    if (held && !callEl && others.length) {
      const f = follow(others, followPick || followUid);
      if (f && f !== followUid) { followUid = f; followPick = ''; S.watch(f); }
    }
    let txt = '';
    if (S.watching() || !mine(g) || dupSeen || since > WATCH_AFTER_MS) {
      const F = others.find(x => x.uid === followUid);
      const fl = F && S.watching() === F.uid && S.watchFloor() >= 0 ? S.watchFloor() : F ? F.floor : 0;   // (the floor of the run as it is DRAWN — the delayed playback)
      // (a rival with NO NEWS — a dead phone, a dropped signal: … view.js#37
      const up = live.filter(x => !x.lost);
      // (TWO SHORT LINES — the match's end-to-end run: one long … view.js#38
      const hint = up.length > 1 || (F && (F.over || F.lost)) ? 'TAP FOR THE NEXT' : '';
      if (F && up.length) txt = `WATCHING ${F.name} · ${fl}`;
      else if (F) txt = `${F.name} · FLOOR ${fl}`;
      if (!up.length) {
        // (everyone seen is out: the room waits for an end not yet signalled — a dropped signal gets its time)
        const wait = Object.keys(g.participants || {}).filter(u => !(runs && runs[u] && runs[u].e) && !(u === uid && wroteE));
        txt = g.unproven ? 'WAITING FOR THE END' : wait.length ? `WAITING FOR ${nameOf(wait[0])}${wait.length > 1 ? ` + ${wait.length - 1}` : ''} · NO SIGNAL` : txt || 'THE END';
      }
      if (missed) txt = `YOU MISSED THE START — NOT COUNTED${txt ? ` · ${txt}` : ''}`;
      else if (dupSeen) txt = `PLAYING IN YOUR OTHER TAB${txt ? ` · ${txt}` : ''}`;
      const sub = [callLine, up.length && F && hint ? (callLine ? 'TAP: NEXT' : hint) : ''].filter(Boolean).join(' · '); // view#39
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
    // the seed + tick 0 (match.js#startOf: THE NODES ARE THE … view.js#40
    const St = startOf(g, runs, code);
    // (never adopted from the game alone while the proof mirror … view.js#41
    if (St && (mSeed !== St.seed || mPlayAt !== St.playAt) && (runs || g.unproven)) adoptMatch(St, runs);
    // (THE PROOF PASS: a GO of this phone's own that landed LATER … view.js#42
    const myNode = runs ? runs[uid] : null;
    lateGo = !!myNode && goOf(myNode) > 0 && !onTime(myNode, firstGo(runs));
    // (THE CONSOLE FIX: once proven, the host's game can not take … view.js#43
    proven = !lateGo && ((haveGo && !g.unproven && mine(g)) || everProven);
    if (dupSeen || dup()) proven = false;   // (FIX B — G2: a yielded duplicate tab is never proven — it writes nothing)
    if (proven) everProven = true;
    // (… a phone that MISSED THE START and has a GO of its own: … view.js#44
    if (missed && proven && !wroteE) { wroteE = true; spent = true; W.end({ f: 0, t: 0, w: 'dark' }); }
    // (a run that ENDED while the match was marked unproven — the … view.js#45
    if (proven && started && !wroteE && !missed && S.me(meRec).over) over(S.result());
    if (adopted && !final) {
      const rows = feedRivals(g, runs || {});
      if (outRes || !mine(g) || missed || dupSeen) afterOut(g, runs, rows);
    }
    // THE PODIUM for everyone (the host's step) — once this … view.js#46
    const RH = globalThis.__nsRunHold;
    if (g.phase === 'final' && !final && !runLive() && !(RH && RH.on)) {
      if (!finalSeen) finalSeen = performance.now();
      const waiting = !g.unproven && adopted && liveWait.wait({ code, matchId, runs, presence: st.presence, now, skip: uid }).length > 0;
      if (!waiting && (!adopted || !mine(g) || performance.now() - finalSeen > FINAL_HOLD_MS || (S.state().shown && (!outRes || performance.now() - outAt > (outRes.cause === 'made' ? 1400 : 500))))) { S.count('', null); S.watchLine(''); showFinal(podiumGame(g)); }
    }
    // FIX B — S1: THE HOST RE-SCORED (a silent phone's end landed … view.js#47
    else if (final && g.phase === 'final' && resKey(g) !== finalRes) { final.destroy(); final = null; if (finalWrap) { finalWrap.remove(); finalWrap = null; } showFinal(podiumGame(g)); }
    if (RH && (RH.on || RH.wait) && !holdsRun()) pingRouter();   // (the run is over + written — follow the room)
  }
  /** FIX B — S1: the podium a phone shows — scored from the nodes as they stand NOW when the room waited on a live run, or when MY OWN run
   *  ended after the host's podium was written (a silent phone: the host's early row of mine is stale) — never the host's stale row */
  const lateMine = g => !!outSrv && mine(g) && g.endAt > 0 && outSrv > g.endAt;
  const podiumGame = g => (liveWait.waited() || lateMine(g) ? scoredNow(g) : g);
  const resKey = g => String(g.rescored || 0);   // (a podium is built again only when the HOST re-scored)
  // the stage's end moment in a match: OUT (or the finish / the … view.js#48
  function endMatch(r) { if (!outRes) { outRes = r; outAt = performance.now(); outSrv = serverNow(); } sync(); return { own: false, watch: true }; }

  // the end card's moment: a PROVEN run ends on the console's … view.js#49
  function end() {
    if (!proven) return { own: true, note: notCounted(whyNot) };
    clearTimeout(finalTimer);
    // (the end has not reached the room — no signal: never a … view.js#50
    finalTimer = setTimeout(() => { if (!gone && !final && S) S.showCard('NO SIGNAL — YOUR RUN COUNTS WHEN IT IS BACK'); }, FINAL_WAIT_MS);
    sync();
    return { own: false };
  }
  function leave() {
    const PN = globalThis.__nsPlayNow, soloRoom = !!(PN && PN.isSolo && PN.isSolo());
    // (FIX B — S8: BACK on a phone that is not the host — a … view.js#51
    if (!soloRoom && !isHost()) { if (st && st.game && st.game.matchId) setState({ quit: st.game.matchId }); return Promise.resolve(); }
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
    // (a MATCH's rows: everyone in order with their floors + how … view.js#52
    const res = g.results || {}, solo = g.mode === 'solo';
    final = createFinal({ game: g, rows: gameStandings(g).map(r => ({ uid: r.uid, rank: r.rank, score: r.floor, ...(solo ? {} : { note: g.unproven ? 'NOT COUNTED' : (res[r.uid] || {}).w === 'made' ? END_WORDS.made : END_WORDS[(res[r.uid] || {}).w] || 'NO RUN' }) })), players: st.players, me: uid, presence: st.presence, kicker: solo ? 'FREEFALL · SOLO' : 'FREEFALL · MATCH', mode: solo ? 'SOLO' : 'MATCH', scoreLabel: 'FLOORS', winnerLine: nm => `${nm} FELL THE DEEPEST` });
    // F4B — THE END SCREEN's HEADER = THE LOGO (the owner's … view.js#53
    const kick = final.el.querySelector('.sheet-kicker');
    if (kick) { kick.classList.add('ff-kick'); kick.replaceChildren(endLogo(solo ? 'solo' : 'match')); }
    finalWrap = h('div.ff-final', final.el);
    S.el.classList.add('is-final'); S.el.append(finalWrap);
    finalRes = resKey(st.game || g);
    // FIX B — S9 THE PODIUM's FALLBACK: in a match the shared … view.js#54
    clearTimeout(plainT);
    if (!solo) { const rows = gameStandings(g).slice(0, 3), F = final; plainT = setTimeout(() => plainList(F, rows), PLAIN_AFTER_MS); }
  }
  function plainList(F, rows) {
    if (gone || F !== final || !F.el.isConnected || F.el.querySelector('.eb.has-rows') || F.el.querySelector('.ff-fin-plain')) return;
    const body = F.el.querySelector('.final-body') || F.el, n = r => Math.max(0, Math.floor(Number(r.floor) || 0));
    const top = rows.filter(r => r.rank === 1), win = top.length === 1 ? `${nameOf(top[0].uid)} FELL THE DEEPEST` : 'A SHARED FIRST';
    const P = h('div.ff-fin-plain', h('div.ff-fin-win', win), h('ol', ...rows.map(r => h('li', { class: r.uid === uid ? 'is-me' : null }, h('b', String(r.rank)), h('span', nameOf(r.uid)), h('i', `${n(r)} ${n(r) === 1 ? 'FLOOR' : 'FLOORS'}`)))));
    body.append(P);
    // (the block that comes LATE — a slow line — takes over: the plain list goes)
    const iv = setInterval(() => { if (!P.isConnected || gone) { clearInterval(iv); return; } if (F.el.querySelector('.eb.has-rows')) { P.remove(); clearInterval(iv); } }, 500);
    setTimeout(() => clearInterval(iv), 30000);
  }
  function sync() {
    const g = st && st.game;
    if (!g || !S) return;
    // (FIX B — G2: the yielded tab TAKES OVER: as a refresh — a … view.js#55
    const d = dup();
    if (isMatch && d !== wasDup && adopted) { mSeed = ''; mPlayAt = 0; adopted = false; dupSeen = d; }
    // (… a SOLO run that was proven when its tab yielded: the … view.js#56
    if (!isMatch && d && proven) { soloHeld = true; proven = false; } else if (!isMatch && !d && soloHeld) { soloHeld = false; proven = true; }
    wasDup = d;
    if (matchLeft()) lateProof('seen'); // view#57
    if (isMatch) { pumpMatch(); if (final) final.refresh(); return; }
    // FIX B — S8: a phone NOT in the room's solo run (back after … view.js#58
    S.block(g.phase !== 'final' && g.matchId === matchId && !mine(g) ? NOT_HERE : '');
    if (g.phase === 'final' && g.matchId === matchId && !final && !againing && (!started || S.state().shown)) showFinal(g);   // (a run's own end is SEEN first — the stage's end hold)
    if (g.phase === 'play' && mine(g) && !started && !S.state().starting && !d) { const runs = runsNow(), n = runs ? runs[uid] : null; if (n && n.go > 0 && !n.e) strand(n); }
    if (final) final.refresh();
  }

  return {
    mount(el, state) {
      st = state; code = state.code; uid = state.uid; matchId = state.game ? state.game.matchId : '';
      // (F4B — THE PAUSE GAP: a HELD run's log — the hold with it — … view.js#59
      isMatch = !!state.game && state.game.mode !== 'solo';
      cur = { go: askGo, resume, unstamped, again, frame: () => flush(false), over, end: r => (isMatch ? endMatch(r) : end(r)), watchTap: () => { followPick = nextFollow(S.ghostRows(), followUid); }, shotKey: () => matchId, lookLock: () => { const L = isMatch && st && st.game ? st.game.look : ''; return L === 'day' || L === 'night' ? L : null; }, matchT0: () => (isMatch && adopted && mPlayAt > 0 ? perfOf(mPlayAt) : null), hide: held => { if (S && started && !S.state().over) { if (held) { holdSrv = serverNow(); holdN = finalCount(S.run()); } flush(held ? 'now' : true); } }, leave };
      const had = unpark();
      if (had) { S = had; S.moveTo(el); S.el.classList.remove('is-final'); S.restart(); }
      else S = createStage(el, drv);
      if (!S) return;
      S.el.classList.add('ff-game');
      if (TEST) globalThis.__ffGame = { stage: S, writer: () => W.state(), state: () => ({ matchId, go, proven, spent, started, wroteE, whyNot, stranded, final: !!final, sent: W.state().sent, chunks: W.state().chunks, acked: W.state().acked, end: W.state().end, stage: S.state(),
        isMatch, haveGo, seed: mSeed, playAt: mPlayAt, adopted, lateGo, missed, holds: holdsRun(), liveWaited: liveWait.waited(), watching: S.watching(), follow: followUid, dupSeen, dup: dup(), call: !!callEl, callLine, out: !!outRes, hud: S.matchState() }) };
      if (isMatch) { S.setMatch(true); pumpIv = setInterval(pumpMatch, 100); }
      sync();
    },
    holdsRun,
    update(state) { st = state; sync(); },
    unmount() {
      gone = true; clearTimeout(goTimer); clearTimeout(finalTimer); clearInterval(pumpIv); clearTimeout(plainT);
      if (callEl) { callEl.remove(); callEl = null; }
      if (S && started && !S.state().over) flush(true);   // (a QUIT mid-run: what was played is in the proof)
      // FIX B — S6 (a): a deliberate LEAVE (the room left) mid-run … view.js#60
      const A = globalThis.__arcade && globalThis.__arcade.state;
      if (isMatch && runLive() && !wroteE && !dup() && (!A || A.code !== code || !(A.players && A.players[uid]))) { const r = S.result(); wroteE = true; spent = true; W.end({ f: r.floor, t: r.tick, w: 'left' }); }
      W.close();   // (… what is logged leaves now, in order; nothing is tried again once the view is gone)
      if (final) final.destroy();
      if (finalWrap) finalWrap.remove();
      if (cur && cur.go === askGo) cur = null;
      if (S) { if (!isMatch && performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(S); else S.destroy(); }
      S = null;
    },
  };
}
