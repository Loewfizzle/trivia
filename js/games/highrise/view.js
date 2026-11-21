// HIGH RISE — THE GAME's SCREEN (S4A — docs/highrise.md "THE CARTRIDGE" · "THE PROOF"): THE STAGE (stage.js — the SAME run loop, scene, HUD
// + sounds /highrise-play mounts) in the console's frame, and everything a run WRITES — which the stage never does itself:
//   · GO: the proof node's first value (the SERVER's time), read back → the seed (logic.js#seedOf) + tick 0 — the run is on the server's clock
//   · THE PROOF: the tap log in chunks, one a second while there are new taps — c/{i} = { s, at: the SERVER's time }; at the end the last
//     chunk, then `e` (a signal: the host's step ends the match on it — never read as a score)
//   · THE END = the console's podium frame (ui/final.js) with this game's body (final.js); PLAY AGAIN = the console's INSTANT AGAIN
//   · an UNPROVEN run (GO refused / unanswered: no signal, the rules not yet re-published) still PLAYS — on a seed of its own, never
//     counted — and ends on the stage's own card (NOT COUNTED — NO LINE TO THE BOARD)
// JAYWALK's view.js is the pattern (docs/jaywalk.md "THE SOLO GAME" · "THE MATCH"). S4A = THE SOLO RUN.
// S4B — THE MATCH (docs/highrise.md "THE MATCH"): 3 · 2 · 1 · GO — every phone writes its own GO (a TRANSACTION, never applied locally);
// THE FIRST GO among the proof nodes picks the seed + tick 0 for everyone (match.js#startOf: THE NODES ARE THE TRUTH); the same chunks
// as a solo run, sent at once (a rival's height is a few taps old at most); the RIVALS = everyone's proof nodes through the same engine
// (rivals.js) → THE ALTIMETER + the tags + the height tapes + the calls; OUT = the cause's words for a moment → Call the Winner (the
// match kit's — your own node's `k`) → WATCH (the leader first; a tap = the next; a tap on the altimeter = that player); the podium
// comes with the host's step. A late joiner (not a participant) WATCHES from the start.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { dbRef, set as dbSet, get as dbGet, serverTimestamp, serverNow, expectRefusal } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { showCall } from '../kit/call.js';
import { createProofWriter } from '../kit/proof-writer.js';
import { proofIo, stampT0, writeMatchGo } from '../kit/proof-io.js';
import { firstGo, onTime, goOf } from '../../core/proof.js';
import { createRun, stepTo, isOver } from './engine.js';
import { liveKeyFor } from '../registry.js';
import { createFinal } from '../../ui/final.js';
import { backToLobby } from '../../host.js';
import { seedOf, gameStandings, END_WORDS, perfectsLine } from './logic.js';
import { TICK_HZ } from './tuning.js';
import { RULES_DEFAULT } from './rules.js';
import { startOf, liveOf } from './match.js';
import { finalPatch } from './director.js';
import { createRouterPing, createLiveWait, END_OWED_MS } from '../kit/run-hold.js';
import { createRival, resetRival, feedRival, capRival, rivalOver, rivalEnd, rivalSilent, matchCalls, follow, nextFollow } from './rivals.js';
import { CLOCK, packFrom, tapsFromChunks } from './proof.js';
import { cleanBest } from './best.js';
import { BOARD, SRV_BEST_KEY, TABLE_KEEP_MS, parseTable } from './lines.js';
import { createStage, newSeed } from './stage.js';
import { endHeader } from './endscreen.js';

/** GO's answer is waited this long before a run goes on UNPROVEN (never a stuck start) */
export const GO_WAIT_MS = 4000;
/** the podium is waited this long after a proven run's end before the stage's own card says NO SIGNAL (never a frozen screen) */
export const FINAL_WAIT_MS = 6000;
/** a match is over (the host's step) while this phone's own tower still climbs: the podium waits for its end at most this long */
export const FINAL_HOLD_MS = 3000;
/** S4B — a MATCH: this phone writes its GO this long before the count's end (the rules open the window 2 s before it) */
export const GO_EARLY_MS = 1800;
/** … its new taps go up this often (a tap a chunk, in practice: a rival's height on the other phones is never a second old) */
export const FLUSH_MATCH_MS = 150;
/** … the cause's words stay this long over the scene before Call the Winner / the watcher's view (the finish: its light is seen first) */
export const OUT_SHOW_MS = 2300, MADE_SHOW_MS = 3600, CALL_AFTER_MS = 1500;

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
  // YOUR BEST (REVIEW FIX A — the owner's call, Nov 20: "a COUNTED run raises YOUR BEST — solo or match, like JAYWALK; a run that never
  // counted never sets it"): the SERVER's — the best it last told this phone (YOUR TABLE's answer, a counted run's NEW BEST). Never the
  // test page's (`hi:play:best`), never an UNPROVEN run's, nothing while counting is OFF: a run on this stage never raises it itself (`runs: false`)
  best: { read: () => cleanBest(ls.get(SRV_BEST_KEY)), write() {}, runs: false },
  go: () => (cur ? cur.go() : Promise.resolve(null)),
  onFrame: now => { if (cur) cur.frame(now); },
  onOver: r => { if (cur) cur.over(r); },
  onEnd: r => (cur ? cur.end(r) : { own: true }),
  onShow: () => { if (cur) cur.shown(); },
  onHide: () => { if (cur) cur.hide(); },   // (THE REVIEW: the last second's taps go up as the page is hidden — never left for the return)
  onWatchTap: () => { if (cur && cur.watchTap) cur.watchTap(); },
  onWatchPick: u => { if (cur && cur.watchPick) cur.watchPick(u); },
  friends: () => (cur ? cur.friends() : []),
};

export function createView() {
  let S = null, st = null, gone = false, code = '', uid = '', matchId = '';
  let go = 0, proven = false, spent = false, started = false, wroteE = false, lateSeen = '';
  let final = null, finalWrap = null, leaveBtn = null, goTimer = 0, finalTimer = 0, finalSeen = 0, friends = [];
  // the match (S4B)
  let isMatch = false, haveGo = false, goAsked = false, goTries = 0, mSeed = '', mPlayAt = 0, adopted = false, pumpIv = 0, rowsKey = '', lateGo = false, missed = false;
  let outCard = null, outAt = 0, outRes = null, callEl = null, callLine = '', callDone = false, liveRuns = null, followUid = '', followPick = '', pickAny = '', watchKey = '', countNames = null;
  const rivals = new Map(), memo = { sides: {}, said: {} };   // uid → rivals.js's record + { uid, name, hex, rgb }
  const hexOf = u => colorHex(((st.players && st.players[u]) || {}).color) || '#00f0ff';
  const rgbOf = hex => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
  const nameOf = u => String(((st.players && st.players[u]) || {}).name || 'GHOST').toUpperCase();
  const mine = g => !!(g && g.participants && g.participants[uid]);
  const treePath = () => `rooms/${code}/hr/${matchId}`, nodePath = () => `${treePath()}/${uid}`;
  // (S5 — ZERO GARBAGE IN A MATCH: the live key is worked out once a GAME (a new snapshot = a new object), never 10 × a second — its JSON)
  let lkGame = null, lkKey = null;
  // THE CONSOLE FIX — THE RUN HOLD (kit/run-hold.js; docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"): this phone's
  // own PROVEN tower is climbed to its own end whatever the host's state says — no podium over it, the router keeps this screen through a
  // moved-on room; then its end is written and the phone follows. The podium waits for the rivals' live towers the same way.
  const pingRouter = createRouterPing(), liveWait = createLiveWait(liveOf);
  const runLive = () => isMatch && proven && started && adopted && !missed && !!S && !S.me(meRec).over;
  function holdsRun() {
    if (gone || !isMatch || !proven || !S) return false;
    if (runLive()) return true;
    if (!wroteE || !outRes) return false;
    const since = performance.now() - outAt;
    return since < (outRes.cause === 'made' ? MADE_SHOW_MS : OUT_SHOW_MS) || (since < END_OWED_MS && W.owes());
  }
  /** the podium after a wait: scored from the nodes as they stand now (the host's own step — director.js#finalPatch), never an early
   *  `final`'s numbers */
  const scoredNow = g => { try { return { ...g, ...finalPatch(g, runsNow() || {}, serverNow(), code) }; } catch { return g; } };
  const runsNow = () => { const g = st && st.game; if (!g) return null; if (g !== lkGame) { lkGame = g; lkKey = liveKeyFor(g); } return (st.liveKey === lkKey && st.live && st.live.runs) || null; };
  /** a server time → this page's clock (the stage's tick 0 is a performance.now() value) */
  const perfOf = srv => performance.now() - (serverNow() - srv);
  const matchLeft = () => !!matchId && (!st.game || st.game.matchId !== matchId || (st.game.phase !== 'play' && !(isMatch && st.game.phase === 'count')));   // (a match: the count's last 2 s still take a chunk)
  const refused = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => m.reportError(new Error('HIGH RISE: the proof node was refused — the run plays UNPROVEN (re-publish database.rules.json: rooms/{CODE}/hr)'), 'rules')).catch(() => {});
  const countQuietLate = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => { if (typeof m.countQuiet === 'function') m.countQuiet('late-proof'); }).catch(() => {});   // (THE STALE-MODULE RULE: an existing export, lazily)
  /** a chunk / the end still in flight when the match left `play` is an EXPECTED refusal — counted, never a row (JAYWALK's THE LATE PROOF CHUNK) */
  function lateProof(why) {
    if (lateSeen === matchId || !proven) return;
    lateSeen = matchId;
    expectRefusal(`${nodePath()}/c`, `highrise: a proof chunk after the match ended (${why})`, 90_000, 'late-proof');
    expectRefusal(`${nodePath()}/e`, `highrise: the end after the match ended (${why})`, 90_000, 'late-proof');
  }

  // THE PROOF (THE PROOF PASS — kit/proof-writer.js, JAYWALK's too): the new taps go up as chunks — one a second (a match: at once),
  // each stamped by the SERVER when it arrives; ONE burst at a time, a refused chunk sent again, never dropped on the mirror alone;
  // then `e` behind the last chunk's acknowledgement
  const W = createProofWriter({
    count: () => (S ? S.taps().length : 0), pack: (a, b) => packFrom(S.taps(), a, b), entriesOf: c => { const t = tapsFromChunks(c); return t ? t.length : -1; },
    chunkMax: CLOCK.chunkMax, chunks: CLOCK.chunks, flushMs: () => (isMatch ? FLUSH_MATCH_MS : CLOCK.flushMs), left: matchLeft,
    onLate: why => { lateProof(why); if (why === 'dropped') countQuietLate(); },
    onDead: why => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => m.reportError(new Error(`HIGH RISE: the proof log could not be completed (${why}) — the run can not count`), 'rules')).catch(() => {}),
    io: proofIo(nodePath),
  });
  /** S4B — THE RULE SET: the run RECORDS the rule set it is played on — `rs` on its own proof node, once, right behind its GO. Best
   *  effort: on rules not yet re-published the write is refused (expected, quiet) — THE JUDGE reads a node with no `rs` as "classic". */
  let wroteRs = false;
  function writeRs() {
    if (wroteRs || gone || matchLeft()) return;
    wroteRs = true;
    const path = `${nodePath()}/rs`;
    expectRefusal(path, 'highrise rs: already written (a rejoin) or the rules are not re-published yet', 90_000);
    dbSet(dbRef(path), RULES_DEFAULT).catch(() => { /* the judge reads no `rs` as classic */ });
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
        go = goAt; proven = true; W.reset({ sent: old ? old.length : 0, next: chunks ? Object.keys(chunks).length : 0, verify: !!chunks }); wroteE = false;
        fin({ seed: seedOf(code, matchId, go), t0: perfOf(go), taps: old || [] });
      };
      /** no proof here (no signal, the rules not published, this match's one GO already spent): the run still PLAYS — on its own seed, never counted */
      const unproven = why => { if (stale()) return; if (why === 'refused') refused(); go = 0; proven = false; W.reset(); fin({ seed: newSeed(), t0: performance.now(), taps: [] }); };
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
      // (THE PROOF PASS — THE STAMP: the tree's first write, right ahead of the GO — core/proof.js; THE CONSOLE FIX: the GO behind its answer)
      stampT0(treePath(), 'highrise').then(() => dbSet(dbRef(path), serverTimestamp())).then(() => dbGet(dbRef(path))).then(snap => {
        const v = snap.val();
        if (typeof v === 'number' && v > 0) { proof(v, null); writeRs(); } else unproven('no go');
      }).catch(() => {
        // refused: this run's GO is already there (a rejoin) — take the node; nothing there = unproven
        dbGet(dbRef(nodePath())).then(snap => { const n = snap.val(); if (n && n.go > 0 && !n.e) proof(n.go, n.c); else unproven('refused'); }).catch(() => unproven('refused'));
      });
    });
  }
  /** THE PROOF: the new taps go up (`force` = now) — the writer above */
  function flush(force) { if (proven && S) W.flush(force); }
  /** the run is over: the last chunk, then `e` — the host's step ends the match on it (a signal: never read as a score) */
  function over(r) {
    flush(true);
    if (!proven || wroteE) return;
    wroteE = true; spent = true;
    W.end({ f: r.floor, t: r.tick, w: String(r.cause || '').slice(0, 12) });
  }
  // ---- S4B — THE MATCH
  /** GO (a MATCH): this phone's own `go` — its proof of being there; the FIRST one to land is the match's (logic.js#firstGo). A
   *  TRANSACTION, never applied locally (THE NODES ARE THE TRUTH: the mirror holds confirmed GOs only). A refusal (this phone's clock a
   *  touch early, a rejoin) is looked at and tried again a few times — never a stuck start: the count runs on. */
  function askGoMatch() {
    if (goAsked) return;
    goAsked = true;
    const m = matchId, runs = runsNow(), node = runs ? runs[uid] : null;
    if (node && node.go > 0) { haveGo = true; return; }
    const again = () => { if (gone || m !== matchId) return; if (goTries++ < 7) setTimeout(() => { goAsked = false; }, 420); else refused(); };
    // (THE PROOF PASS: the stamp + the GO are the kit's — kit/proof-io.js#writeMatchGo, JAYWALK's too)
    writeMatchGo(treePath(), uid, 'highrise').then(ok => { if (gone || m !== matchId) return; if (ok) haveGo = true; else again(); }, again);
  }
  /** THE PROOF PASS — "YOUR OWN PHONE MISSED THE GO" (REVIEW FIX A left it here): has a tower NOBODY TOUCHED already ended on the match's
   *  clock? (the fuse — the engine's own answer, never a guessed number) */
  function towerGone(St) {
    const tick = Math.floor((serverNow() - St.playAt) * TICK_HZ / 1000);
    if (tick <= 0) return false;
    const r = createRun({ seed: St.seed, mode: 'match' });
    stepTo(r, tick);
    return isOver(r);
  }
  /** the match's seed + tick 0 land (THE FIRST GO — in `play` the game's own): the stage takes the run; a rejoin replays this player's
   *  own taps so far; a WATCHER (not a participant) has no run of their own */
  function adoptMatch(St, runs) {
    mSeed = St.seed; mPlayAt = St.playAt; go = St.playAt;
    const g = st.game, node = runs && mine(g) ? runs[uid] : null, old = node && node.c ? tapsFromChunks(node.c) : null;
    W.reset({ sent: old ? old.length : 0, next: node && node.c ? Object.keys(node.c).length : 0, verify: !!(node && node.c) });
    if (node && node.go > 0) haveGo = true;
    if (node && node.e) { wroteE = true; callDone = true; }   // (a rejoin after their own end: straight to watching)
    for (const R of rivals.values()) resetRival(R, St.seed);
    rowsKey = ''; followUid = ''; adopted = true; started = true;
    // THE PROOF PASS — "YOUR OWN PHONE MISSED THE GO" (a hiccup on this phone AND the host's: it was climbing an UNPROVEN stand-in when
    // the real GO showed; or it simply comes late): it reaches the match's real clock with NO taps of its own, and on that clock the
    // fuse has already ended a tower nobody touched. It used to restart there and go "TOO SLOW" at floor 0 — a fall that never
    // happened. Now it WATCHES (a late joiner's view), told plainly: YOU MISSED THE START — NOT COUNTED. Its end is signalled (a GO of
    // its own may be there: the room does not wait 18 s for it); the server counts no player without a landed slab (MUST 3).
    missed = mine(g) && !(old && old.length) && !(node && node.e) && towerGone(St);
    if (missed) {
      callDone = true;
      S.spectate({ mode: 'match', seed: St.seed, t0: perfOf(St.playAt) });
      S.hud().announce('YOU MISSED THE START — NOT COUNTED', 'passed');
    } else if (mine(g)) S.adopt({ mode: 'match', seed: St.seed, t0: perfOf(St.playAt), taps: old || [] });
    else S.spectate({ mode: 'match', seed: St.seed, t0: perfOf(St.playAt) });
  }
  /** 3 · 2 · 1 · GO — from the match's own tick 0 once the first GO has landed (till then the count the host set) */
  function drawCount(g, now) {
    const t0m = adopted ? mPlayAt : g.playAt, left = t0m - now;
    const txt = g.phase === 'final' || left < -700 ? '' : left <= 0 ? 'GO' : left > 3000 ? '' : String(Math.ceil(left / 1000));
    const key = !adopted && left <= 0 && g.phase !== 'final' ? 'GET READY' : txt;
    if (!countNames) countNames = Object.keys(g.participants || {}).sort((a, b) => (a === uid ? -1 : b === uid ? 1 : a < b ? -1 : 1)).map(u => ({ name: nameOf(u), hex: hexOf(u), me: u === uid }));
    S.hud().count(key, countNames);
  }
  /** everyone's proof nodes → their towers (rivals.js: each chunk once, no tap assumed) → THE PLACE NUMBER, the tags + tapes, the calls.
   *  S5 — ZERO GARBAGE IN A MATCH (it runs 10 × a second): each player's row is ONE record kept on their rival (YOURS on `meRow`), the
   *  list ONE array filled in place, a change found field by field (no key string), your own numbers read into a kept record */
  const rowList = [], meRec = { floor: 0, perfects: 0, over: false, made: false, cause: '' }, noMe = { floor: 0, over: true };
  let meRow = null, playersSeen = null;
  function feedRivals(g, runs, now) {
    const tick = Math.floor((now - mPlayAt) * TICK_HZ / 1000), me = mine(g) && !missed ? S.me(meRec) : null, watched = S.watching(), parts = g.participants || {};   // (a phone that MISSED THE START has no tower of its own: a watcher's rows)
    let n = 0, dirty = false;
    // (REVIEW FIX A — SHOULD 5: a rival's name + colour were read ONCE — a player whose entry landed late stayed "GHOST" all match. The
    //  room's player list is a new object at every change: then (only then) every kept row reads its name + colour again)
    if (st.players !== playersSeen) {
      playersSeen = st.players; countNames = null;
      for (const R of rivals.values()) {
        const nm = nameOf(R.uid), hx = hexOf(R.uid);
        if (R.name !== nm || R.hex !== hx) { R.name = nm; R.hex = hx; R.rgb = rgbOf(hx); R.row.name = nm; R.row.hex = hx; R.row.rgb = R.rgb; dirty = true; }
      }
      if (meRow) { const nm = nameOf(uid), hx = hexOf(uid); if (meRow.name !== nm || meRow.hex !== hx) { meRow.name = nm; meRow.hex = hx; meRow.rgb = rgbOf(hx); dirty = true; } }
    }
    for (const u in parts) {
      if (u === uid) continue;
      let R = rivals.get(u);
      if (!R) { const hex = hexOf(u); R = { ...createRival(mSeed), uid: u, name: nameOf(u), hex, rgb: rgbOf(hex) }; R.row = { uid: u, name: R.name, hex, rgb: R.rgb, floor: -1, perfects: 0, over: false, end: '', silent: false, me: false, watched: false }; rivals.set(u, R); }
      if (!g.unproven) { feedRival(R, runs && runs[u]); capRival(R, tick); }
      const w = R.row, fl = R.run.floor, ov = rivalOver(R), en = rivalEnd(R), si = rivalSilent(R, tick), wa = watched === u;
      if (w.floor !== fl || w.over !== ov || w.end !== en || w.silent !== si || w.watched !== wa) { dirty = true; w.floor = fl; w.over = ov; w.end = en; w.silent = si; w.watched = wa; }
      w.perfects = R.run.perfects;
      if (rowList[n] !== w) { rowList[n] = w; dirty = true; }
      n++;
    }
    if (rowList.length > n + (me ? 1 : 0)) { rowList.length = n; dirty = true; }
    rowList.length = n;
    const calls = matchCalls(memo, me || noMe, rowList);
    if (me) {
      if (!meRow) { const hex = hexOf(uid); meRow = { uid, name: nameOf(uid), hex, rgb: rgbOf(hex), floor: -1, perfects: 0, over: false, end: '', silent: false, me: true, watched: false }; }
      const en = me.made ? 'made' : me.cause === 'cap' ? 'cap' : me.over ? 'out' : '';
      if (meRow.floor !== me.floor || meRow.over !== me.over || meRow.end !== en) { dirty = true; meRow.floor = me.floor; meRow.over = me.over; meRow.end = en; }
      meRow.perfects = me.perfects;
      rowList.push(meRow);
      if (rowsKey !== 'me') { rowsKey = 'me'; dirty = true; }
    } else if (rowsKey !== 'them') { rowsKey = 'them'; dirty = true; }
    if (dirty) S.rivals(rowList);
    if (calls.length) {
      const hud = S.hud();
      let pass = false;
      for (let i = 0; i < calls.length; i++) { const c = calls[i]; hud.announce(c.text, c.kind); if (c.kind === 'pass' || c.kind === 'passed') pass = true; }
      if (S.sfx && pass) { try { S.sfx.play('pass'); } catch { /* audio is polish */ } }
    }
    return rowList;
  }
  /** OUT in a match: the cause's words over the scene for a moment, then Call the Winner (two or more still climbing), then WATCHING */
  function afterOut(g, runs, rows) {
    liveRuns = runs;
    const since = performance.now() - outAt, r = outRes, hud = S.hud(), others = rows.filter(x => !x.me), live = others.filter(x => !x.over);
    if (r && !outCard && mine(g) && since < 60000) {
      const made = r.cause === 'made';
      outCard = h(`div.hi-outcard${made ? '.is-made' : ''}`, h('div.hi-outcard-k', made ? 'THE FINISH LINE' : r.cause === 'cap' ? 'THE BELL' : 'OUT'), h('div.hi-ec-cause', g.unproven || !haveGo || lateGo ? 'NOT COUNTED' : END_WORDS[r.cause] || 'THE TOWER STANDS'), h('div.hi-outcard-n', `${r.floor} ${r.floor === 1 ? 'FLOOR' : 'FLOORS'}`));
      hud.over.append(outCard);
      setTimeout(() => { if (outCard) outCard.classList.add('is-gone'); }, made ? MADE_SHOW_MS : OUT_SHOW_MS);
    }
    if (!callDone && r && mine(g) && (r.cause === 'miss' || r.cause === 'thin' || r.cause === 'slow') && since > CALL_AFTER_MS && g.phase === 'play' && !g.unproven && wroteE) {
      callDone = true;
      const cands = live.map(x => x.uid), made = runs && runs[uid] && runs[uid].k;
      // (JAYWALK's THE LATE k WRITE: never a pick for a player whose own end is already here; a refusal after the match moved on is expected)
      callEl = showCall({ canPick: u => !(liveRuns && liveRuns[u] && liveRuns[u].e != null), expect: 'highrise call: the match moved on before the pick landed', overlay: hud.over, game: g, st: { live: { calls: made ? { [uid]: made } : {} } }, me: uid, player: u => st.players[u] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' }, candidates: cands, path: `${nodePath()}/k`,
        line: u => { const R = rivals.get(u), n = R ? R.run.floor : 0; return `${n} ${n === 1 ? 'FLOOR' : 'FLOORS'}`; }, intro: n => `${n} still climbing — who builds the tallest? A right call earns game-night points.`,
        ended: () => !st.game || st.game.phase !== 'play' || st.game.matchId !== matchId, onState: msg => { callLine = msg === 'NO CALL' ? '' : msg; callEl = null; }, isDestroyed: () => gone });
    }
    // WHOM THE WATCHER FOLLOWS: the player picked on the altimeter (any of them) · else the one picked by a tap while they climb · else THE LEADER
    const held = since >= (r && r.cause === 'made' ? MADE_SHOW_MS : 900) || !mine(g) || missed;
    if (held && !callEl && others.length) {
      // (S5: the one you follow STAYS while they climb — the leader was picked again at every pump: level players swapped the view every floor;
      //  THE CLOSE's REVIEW: a tap's pick is spent once it is followed — a pick left behind made `follow` ignore followUid again)
      const f = pickAny && rivals.has(pickAny) ? pickAny : follow(others, followPick || followUid);
      if (f && f !== followUid) { followUid = f; followPick = ''; const R = rivals.get(f); S.watch({ uid: f, name: R.name, seed: mSeed, taps: R.taps, done: () => R.done }); rowsKey = ''; }
    }
    let txt = '';
    if (S.watching() || !mine(g) || since > 900) {
      const F = others.find(x => x.uid === followUid);
      const fl = F && S.watching() === F.uid && S.watchFloor() >= 0 ? S.watchFloor() : F ? F.floor : 0;   // (REVIEW FIX A: the floor of the tower as it is DRAWN — the delayed playback)
      if (F && live.length) txt = `WATCHING ${F.name} · ${fl}${live.length > 1 || F.over ? ' · TAP FOR THE NEXT' : ''}`;
      else if (F) txt = `${F.name}’S TOWER · ${fl}`;
      if (!live.length) {
        // (everyone seen is out: the room waits for an end not yet signalled — a dropped signal gets its time)
        const wait = Object.keys(g.participants || {}).filter(u => !(runs && runs[u] && runs[u].e) && !(u === uid && wroteE));
        txt = g.unproven ? 'WAITING FOR THE END' : wait.length ? `WAITING FOR ${nameOf(wait[0])}${wait.length > 1 ? ` + ${wait.length - 1}` : ''} · NO SIGNAL` : txt || 'THE END';
      }
      if (callLine) txt += ` · ${callLine}`;
    }
    if (txt !== watchKey) { watchKey = txt; hud.watching(final ? '' : txt); }
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
    // (THE CLOSE's REVIEW: never adopted from the game alone while the proof mirror is still on its way — a refresh mid-run took the
    //  match with NO taps of its own: floor 0, TOO SLOW. A proven match in `play` always has a node to read: wait for it.)
    if (St && (mSeed !== St.seed || mPlayAt !== St.playAt) && (runs || g.unproven)) adoptMatch(St, runs);
    // (THE PROOF PASS: a GO of this phone's own that landed LATER than the window after THE FIRST GO is no run — the server drops it
    //  (core/proof.js#onTime): nothing is written for it, the out card says NOT COUNTED. On the re-published rules such a GO is refused.)
    const myNode = runs ? runs[uid] : null;
    lateGo = !!myNode && goOf(myNode) > 0 && !onTime(myNode, firstGo(runs));
    proven = haveGo && !g.unproven && mine(g) && !lateGo;
    // (… a phone that MISSED THE START and has a GO of its own: its end is signalled once — the room never waits 18 s for it)
    if (missed && proven && !wroteE) { wroteE = true; spent = true; W.end({ f: 0, t: 0, w: 'slow' }); }
    // (THE CLOSE's REVIEW — SHOULD 1's take-back: a run that ENDED while the match was marked unproven (the host's hiccup) never wrote its
    //  `e` (over() needs `proven`) — once proven again, the end goes up now: Call the Winner opens, the match does not wait 18 s)
    if (proven && started && !wroteE && !missed && S && S.me(meRec).over) over(S.result());
    if (proven && adopted && !wroteRs && !(runs && runs[uid] && (runs[uid].rs != null || runs[uid].c))) writeRs();   // (the rules: only before the log's first chunk)
    if (adopted && !final) {
      const rows = feedRivals(g, runs || {}, now);
      if (outRes || !mine(g) || missed) afterOut(g, runs, rows);
    }
    // THE PODIUM for everyone (the host's step) — once this player's own end has been SEEN (the stage's end hold, the finish's light);
    // a watcher, a refresh on it: at once
    // (THE CLOSE's REVIEW: … and never held for ever — a tower still climbing when the match is over (its chunks did not arrive: nothing
    //  more can count) gets the podium after FINAL_HOLD_MS)
    // (THE CONSOLE FIX: never over a live proven tower of this phone's own — it climbs on to its own end; never for a match the room has
    //  left (the router holds this screen: it follows the room once the run is written); and it waits for a rival's tower still LIVE —
    //  the host's `final` came early — the cap ends that wait)
    const RH = globalThis.__nsRunHold;
    if (g.phase === 'final' && !final && !runLive() && !(RH && RH.on)) {
      if (!finalSeen) finalSeen = performance.now();
      const waiting = !g.unproven && adopted && liveWait.wait({ code, matchId, runs, presence: st.presence, now, skip: uid }).length > 0;
      if (!waiting && (!adopted || !mine(g) || performance.now() - finalSeen > FINAL_HOLD_MS || (S.state().shown && (!outRes || performance.now() - outAt > (outRes.cause === 'made' ? 1400 : 500))))) { S.hud().count('', null); S.hud().watching(''); showFinal(liveWait.waited() ? scoredNow(g) : g); }
    }
    if (RH && (RH.on || RH.wait) && !holdsRun()) pingRouter();   // (the run is over + written — follow the room)
  }
  /** the stage's end moment in a match: OUT (or the finish / the bell) — the watcher's view follows; the podium comes with the host's step */
  function endMatch(r) { if (!outRes) { outRes = r; outAt = performance.now(); } sync(); return { own: false, watch: true }; }

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
    if (callEl) { callEl.remove(); callEl = null; }
    if (outCard) { outCard.remove(); outCard = null; }
    S.hideCard();   // (THE REVIEW: the podium takes the screen — the stage's own NO SIGNAL card is put away, a key can not restart under it)
    // (a MATCH's rows: everyone in order with their floor + how their tower ended + their perfects — the console lists them as slim cards)
    const res = g.results || {}, solo = g.mode === 'solo';
    final = createFinal({ game: g, rows: gameStandings(g).map(r => ({ uid: r.uid, rank: r.rank, score: r.floor, ...(solo ? {} : { note: `${g.unproven ? 'NOT COUNTED' : END_WORDS[(res[r.uid] || {}).w] || 'NO TOWER'} · ${perfectsLine(r.perfects)}` }) })), players: st.players, me: uid, presence: st.presence, kicker: endHeader(solo ? 'solo' : 'match'), scoreLabel: 'FLOORS', winnerLine: nm => `${nm} BUILT THE TALLEST` });
    finalWrap = h('div.hi-final', final.el);
    S.el.classList.add('is-final'); S.el.append(finalWrap);
  }
  function sync() {
    const g = st && st.game;
    if (!g || !S) return;
    if (matchLeft()) lateProof('seen');   // (from the moment this phone sees the match end, a chunk / e still in flight is an expected refusal)
    if (isMatch) {
      pumpMatch();
      if (final) final.refresh();
      return;
    }
    if (g.phase === 'final' && g.matchId === matchId && !final && (!started || S.state().shown)) showFinal(g);   // (a run's own end is SEEN first — the stage's end hold)
    // a refresh mid-run: the run so far is in the node — taken back at once (the fuse has most likely ended it: its end is written now)
    if (!isMatch && g.phase === 'play' && mine(g) && !started && !S.state().starting) { const runs = runsNow(), n = runs ? runs[uid] : null; if (n && n.go > 0 && !n.e) S.start(); }
    if (final) final.refresh();
  }

  return {
    mount(el, state) {
      st = state; code = state.code; uid = state.uid; matchId = state.game ? state.game.matchId : '';
      isMatch = !!state.game && state.game.mode !== 'solo';
      cur = { go: askGo, frame: () => flush(false), over, end: r => (isMatch ? endMatch(r) : end(r)), watchTap: () => { pickAny = ''; const rows = [...rivals.values()].map(R => ({ uid: R.uid, floor: R.run.floor, perfects: R.run.perfects, over: rivalOver(R) })); followPick = nextFollow(rows, followUid); }, watchPick: u => { if (u !== uid && rivals.has(u)) pickAny = u; }, hide: () => { if (S && started && !S.state().over) flush(true); }, shown: () => { if (proven && go > 0 && S && !S.state().over) S.setT0(perfOf(go)); }, friends: () => friends };
      const had = unpark();
      if (had) { S = had; el.replaceChildren(S.el); S.el.classList.remove('is-final'); S.restart(); }
      else S = createStage(el, drv);
      if (!S) return;
      S.el.classList.add('hi-game');
      // THE NEXT FRIEND's tape (lines.js — YOUR TABLE's HIGH RISE bests, the SERVER's: empty while counting is OFF)
      loadTable(uid).then(T => { if (gone || !T) return; friends = T.friends; if (T.best > 0) ls.set(SRV_BEST_KEY, T.best); if (S) S.friends(); });
      if (TEST) globalThis.__hiGame = { stage: S, writer: () => W.state(), state: () => ({ matchId, go, proven, holds: holdsRun(), liveWaited: liveWait.waited(), spent, started, sent: W.state().sent, chunks: W.state().chunks, acked: W.state().acked, lateGo, missed, wroteE, final: !!final, leave: !!leaveBtn, friends: friends.map(f => `${f.n} ${f.v}`), stage: S.state(),
        isMatch, haveGo, seed: mSeed, playAt: mPlayAt, adopted, watching: S.watching(), follow: followUid, call: !!callEl, callLine, out: !!outRes, outCard: !!outCard, hud: S.matchState(),
        rivals: [...rivals.values()].map(R => ({ uid: R.uid, name: R.name, floor: R.run.floor, perfects: R.run.perfects, taps: R.taps.length, over: rivalOver(R), end: rivalEnd(R), done: R.done, bad: R.bad, silent: !!(R.row && R.row.silent) })) }), setFriends(f) { friends = f; S.friends(); } };
      if (isMatch) { S.setMatch(true); pumpIv = setInterval(pumpMatch, 100); }
      sync();
      // PLAY AGAIN's remount (the console's INSTANT AGAIN): the next run starts at once — its tap WAS the PLAY AGAIN
      if (!isMatch && performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000 && state.game && state.game.phase === 'play' && mine(state.game)) S.start();
    },
    holdsRun,
    update(state) { st = state; sync(); },
    unmount() {
      gone = true; clearTimeout(goTimer); clearTimeout(finalTimer); clearInterval(pumpIv);
      if (callEl) { callEl.remove(); callEl = null; }
      if (S && started && !S.state().over) flush(true);   // (a QUIT mid-run: what was dropped is in the proof)
      W.close();   // (… what is logged leaves now, in order; nothing is tried again once the view is gone)
      if (final) final.destroy();
      if (finalWrap) finalWrap.remove();
      if (leaveBtn) leaveBtn.remove();
      if (cur && cur.go === askGo) cur = null;
      if (S) { if (!isMatch && performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(S); else S.destroy(); }
      S = null;
    },
  };
}
