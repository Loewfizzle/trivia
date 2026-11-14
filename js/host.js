// Host duties, run on every client:
//  - if I am host: heartbeat + run the active game's director (state machine)
//  - if I am not: watch for a dead/frozen host and claim the role
//
// Nothing here keeps game state locally — every decision is re-derived from the
// mirrored database state on each tick, so any client can take over at any time.
import { dbRef, update, remove, get, runTransaction, serverTimestamp, serverNow, firebaseReady } from './firebase.js';
import { startOf, newMatchId, GO_ORPHAN_MS, goWaiting } from './core/room-show.js';
import { minPlayersOf, rematchSettingsOf } from './games/cartridge.js';
import { state, isHost, onlineMap, setState, subscribe } from './store.js';
import { setHostGone, expectRefusal } from './firebase.js';
import { shouldClaimHost, isOnline, roomIdle, gameRunning, GAME_ON_LINE, staleProofPaths, isSoloMeta, soloSettings } from './core/room-logic.js';
import { closeIdleRoom, createSoloRoom, leaveRoom } from './room.js';
import { loadProfile } from './identity.js';
import { DIRECTOR_TICK_MS, HOST_BEAT_MS, MIN_PLAYERS, isPlayable } from './config.js';
import { GAME_MODULES, liveKeyFor, ALL_PLAYER_NODES, NEW_PLAYER_NODES, PROOF_NODE_LIST, loadGame, metaOf } from './games/registry.js';
import { toast } from './ui/toast.js';
import { lazyImport } from './ui/lazy-import.js';
import { nightPoints } from './core/night.js';

// SPEED PASS B — THE SECOND TAB's check (tests: e2e speed.mjs twotabs): this tab's own host writes — the beats + the director's steps
export const hostStats = { beats: 0, steps: 0 };
let lastBeat = 0;
let lastActive = 0;
let lastClaim = 0;
let inflight = { sig: '', at: 0 };
// room chat (system lines, pruning) loads lazily the first time we're in a room
let chatMod = null;
let chatLoading = false;
const withChat = fn => {
  if (chatMod) return fn(chatMod);
  if (!chatLoading) { chatLoading = true; lazyImport(import('./chat/chat.js'), './chat/chat.js').then(m => { chatMod = m; }).catch(() => { chatLoading = false; }); }
  return undefined;
};

export function startHostLoop() {
  setInterval(tick, DIRECTOR_TICK_MS);
  // Background tabs throttle timers; run a tick as soon as we're visible again.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
}

// THE ERRORS GROUP (Nov 12 night): when this phone last WAS the host — a write refused within HOST_GONE_MS of losing it is the hand-off's
// race (firebase.js#setHostGone: "no longer the host"), never a rules-lag; the host loop itself stops at the next tick (isHost() is false)
const HOST_GONE_MS = 15_000;
let wasHostAt = 0, wasHostCode = null;
export const lostHostRecently = () => !!wasHostCode && Date.now() - wasHostAt < HOST_GONE_MS && !(state.code === wasHostCode && isHost());
setHostGone(lostHostRecently);
function tick() {
  // (PERF-A — Grok 5.4: the same player open in two tabs ran two host loops; the tab that yields (identity.js#watchDuplicateTabs) is idle)
  if (state.dupTab) return;
  if (!state.code || !state.meta || !state.connected || !state.uid) return;
  const now = serverNow();
  withChat(m => m.hostTick());
  // An hour without a game: the host closes the room (every phone gets ROOM CLOSED); everyone else leaves on
  // their own a little later in case the host's phone is asleep or the room can't be deleted.
  if (roomIdle(state.meta, now - (isHost() ? 0 : 90_000))) { closeIdleRoom(); return; }
  watchHand();
  if (isHost()) {
    wasHostAt = Date.now(); wasHostCode = state.code;
    beat(now);
    clearDeadStart(now);
    if (state.meta.status === 'playing' && state.game) direct(now);
  } else if (now - lastClaim > 3000 && shouldClaimHost({ meta: state.meta, players: state.players, presence: state.presence, now, me: state.uid })) {
    lastClaim = now;
    claimHost(state.meta.hostId);
  }
}

// SPEED PASS B — THE HOST LEAVES ON PURPOSE (the owner, Nov 4 10:21 pm): leaveRoom() hands meta/hostId to the next player in join order,
// then its node goes. Every phone that sees the host change AND the old host's node gone (within a few seconds — the two writes land
// apart) says it ONCE: the heir "YOU'RE THE HOST NOW", everyone else "MIKE IS THE HOST NOW". A claim over a DROPPED host (its node stays,
// offline) is not this: the claimer says "HOST SIGNAL LOST — YOU ARE NOW THE HOST" itself (claimHost), the others stay quiet.
let handSeen = { code: null, id: null }, handPending = null, myClaim = null;
export const HAND_WAIT_MS = 6000;
function watchHand() {
  const code = state.code, id = state.meta.hostId;
  if (handSeen.code !== code) { handSeen = { code, id }; handPending = null; return; }
  if (id !== handSeen.id) {
    const mine = id === state.uid && myClaim && myClaim.code === code && Date.now() - myClaim.at < 15000;
    handPending = handSeen.id && id && !mine ? { from: handSeen.id, to: id, at: Date.now() } : null;
    handSeen.id = id;
  }
  if (!handPending) return;
  if (Date.now() - handPending.at > HAND_WAIT_MS || id !== handPending.to) { handPending = null; return; }
  // (SHELL 2.0 B2 — MAKE HOST: the old host STAYS — meta/hostBy names them; a leave: their node is gone)
  if (state.players && state.players[handPending.from] && state.meta.hostBy !== handPending.from) return;
  const to = handPending.to; handPending = null;
  if (to === state.uid && myClaim && myClaim.code === code && Date.now() - myClaim.at < 15000) return;   // (a claim of mine landed first)
  const name = (state.players && state.players[to] && state.players[to].name) || 'SOMEONE';
  if (to === state.uid) toast('YOU’RE THE HOST NOW', 'ok', 3500);
  else toast(`${String(name)} is the host now`, 'info', 3500);
}

// FR6 FIXES A (B2): the host that stamped a start died (or this phone refreshed) between the stamp and the match: nobody is preparing it —
// the host now (a new one, or this one after a reload) takes the stamp down, once, and says so; the guests' veil lifts with the same note
let clearedGo = null;
function clearDeadStart(now) {
  const age = goWaiting(state.meta, state.game, now), go = state.meta.go;
  if (age == null || age < GO_ORPHAN_MS || starting || clearedGo === go.m) return;
  clearedGo = go.m;
  update(dbRef(`rooms/${state.code}/meta`), { go: null }).catch(() => {});
  toast('THE START DIDN’T GO THROUGH — TAP PLAY TO TRY AGAIN', 'warn', 4500);
}

function beat(now) {
  if (now - lastBeat < HOST_BEAT_MS) return;
  lastBeat = now;
  const patch = { hostBeat: serverTimestamp() };
  // only a running game keeps the room alive (an idle lobby closes after ROOM_IDLE_MS)
  if (state.meta.status === 'playing' && now - lastActive > 10 * 60_000) { lastActive = now; patch.activeAt = serverTimestamp(); }
  hostStats.beats++;
  if (!isHost()) return;   // (THE ERRORS GROUP: checked again right before the write)
  update(dbRef(`rooms/${state.code}/meta`), patch).catch(() => {});
}

export async function claimHost(oldHost) {
  const code = state.code;
  try {
    // cur is null on the first run if the local cache is cold; proposing ourselves
    // then just makes the server hand back the real value and re-run the function.
    // (THE SPEED PASS — the owner's 3:45 pm screenshot: "YOU WERE DISCONNECTED" + "YOU ARE NOW THE HOST" stacked on the title — a claim
    //  still in flight when this phone left the room committed after it: the claim stands down the moment the room is no longer this phone's)
    const here = () => state.code === code && !!(state.players && state.players[state.uid]);
    if (!here()) return;
    expectRefusal(`rooms/${code}/meta`, 'host claim refused: the host is still alive');   // (THE ERRORS GROUP's add-on: an expected refusal — quiet)
    const res = await runTransaction(dbRef(`rooms/${code}/meta/hostId`), cur => (!here() ? undefined : cur === oldHost || cur == null ? state.uid : undefined));
    if (res.committed && res.snapshot.val() === state.uid && here()) {
      myClaim = { code, at: Date.now() };   // (SPEED PASS B: this phone's own claim says its own line — watchHand stays quiet)
      lastBeat = 0;
      await update(dbRef(`rooms/${code}/meta`), { hostBeat: serverTimestamp() });
      if (here()) toast('HOST SIGNAL LOST — YOU ARE NOW THE HOST', 'warn', 3500);
    }
  } catch (e) {
    // Security rules reject the claim if the host is actually still alive. Fine.
    console.warn('claim host', e && e.message);
  }
}

// THE DROP B add-on (Ben, Nov 13 9:59 pm) — A SOLO RUN PAUSES WHILE HIDDEN: in a room of ONE this phone is the host, so the page hiding
// (visibilitychange → hidden / pagehide) writes the cartridge's PURE `soloPause(game, { at })` patch at once (the SDK applies it locally first —
// the next tick already sees it), and coming back writes `soloResume(game, { now })` (every clock shifted by the time away + a 3-2-1). A cartridge
// without them, or a room of 2+, is untouched (the multiplayer AWAY rule stands). direct() also resumes a paused run found on a visible page
// (a rejoin after the app was closed).
const soloRoom = game => !!game && Object.keys(game.participants || {}).length === 1;
const pageHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
function soloHold(kind) {
  const game = state.game;
  if (!state.code || !game || !isHost() || !soloRoom(game) || !state.meta || state.meta.status !== 'playing') return false;
  const mod = GAME_MODULES[game.id];
  const f = mod && (kind === 'pause' ? mod.soloPause : mod.soloResume);
  if (typeof f !== 'function') return false;
  const patch = f(game, kind === 'pause' ? { at: serverNow() } : { now: serverNow() });
  if (!patch) return false;
  update(dbRef(`rooms/${state.code}`), roomPatch(game, patch)).catch(e => console.warn('solo pause', e && e.message));
  return true;
}
export const soloPauseNow = () => soloHold('pause');
export const soloResumeNow = () => soloHold('resume');
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (pageHidden()) soloHold('pause'); else soloHold('resume'); });
  window.addEventListener('pagehide', () => soloHold('pause'));
}

function direct(now) {
  const game = state.game;
  const mod = GAME_MODULES[game.id];
  if (!mod) { loadGame(game.id).catch(() => {}); return; }   // (SHELL 2.0 B1: a new host / a refresh — the cartridge loads, the next tick directs)
  if (game.pz != null && !pageHidden() && soloHold('resume')) return;   // (THE DROP B add-on: a paused solo run on a visible page — back with its 3-2-1)
  // Only decide with player data that belongs to the current step.
  if (state.liveKey !== liveKeyFor(game)) return;
  mod.prepare(game, { code: state.code, host: true, now, live: state.live }); // e.g. word lists / trivia top-ups on a freshly promoted host (FR7 FIXES A: + the clock + the room's live data — HOLD'EM's host poke)
  const step = mod.step(game, { code: state.code, now, live: state.live, online: onlineMap() });
  if (!step) return;
  // (THE SEAL: an unseal is a step of its own inside a phase — the director's real step follows it at once, not 3 s later)
  const sig = `${game.matchId}|${game.phase}|${game.phaseStartAt}|${JSON.stringify(game.unseal || null)}`;
  if (inflight.sig === sig && now - inflight.at < 3000) return; // write already on its way
  inflight = { sig, at: now };
  hostStats.steps++;
  if (step.lobby) { backToLobby(); return; }
  if (!isHost()) return;   // (THE ERRORS GROUP: a newer hostId may have landed during the step)
  update(dbRef(`rooms/${state.code}`), roomPatch(game, step)).catch(e => { inflight.sig = ''; console.warn('director', e); });
}

// Points toward the room's game-night leaderboard for finishing 1st / 2nd / 3rd.
export { NIGHT_POINTS } from './core/night.js';   // (B4: the table + the full-tie rule live in core/night.js#nightPoints)

// Turns a director step into one atomic room update: game/* paths, optional room-level
// side writes ($room), and the night-scoreboard entry when a match reaches its podium.
function roomPatch(game, step) {
  const { $room, ...gamePatch } = step;
  const patch = {};
  for (const [k, v] of Object.entries(gamePatch)) patch[`game/${k}`] = v;
  Object.assign(patch, $room || {});
  const mod = GAME_MODULES[game.id];
  if (gamePatch.phase === 'final' && mod && mod.finalRanks) {
    const finished = applyPatch(structuredClone(game), gamePatch);
    const p = {};
    const n = {};
    const solo = Object.keys(finished.participants || {}).length === 1;   // (SHELL 2.0 B1 — THE SOLO LANE: no night points, no banner, no champion)
    const ranks = mod.finalRanks(finished);
    Object.assign(p, nightPoints(ranks, { solo }));   // (B4: a FULL TIE = a draw — everyone 2nd-place points, nobody 1st's)
    for (const r of ranks) n[r.uid] = (state.players[r.uid] && state.players[r.uid].name) || 'GHOST';
    const entry = { g: game.id, at: serverTimestamp(), p, n };
    // bonus points that aren't a placing (PRISM DROP's Call the Winner): added to the total, never a win
    const b = mod.nightBonus && !solo ? mod.nightBonus(finished) : null;
    if (b && Object.keys(b).length) entry.b = b;
    patch[`night/${game.matchId}`] = entry;
  }
  return patch;
}

function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('/');
    let o = obj;
    for (const part of parts.slice(0, -1)) o = (o[part] ??= {});
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = v;
  }
  return obj;
}

export function onlineCount() {
  return Object.keys(state.players).filter(uid => isOnline(state.presence, uid)).length;
}

// Resolves true once the match is written; false (after a toast) when it can't start.
// FR6 FIXES A (B4) — ONE START AT A TIME: the REMATCH ring had no busy guard; on a 200–400 ms round trip a double-tap reached startGame()
// twice — two stamps, two start()s, two whole matches a second apart (every phone mounted match 1 then remounted match 2). Every caller (the
// ring, INITIATE, the podium's REMATCH) gets the SAME promise while a start is in flight, and through the walk inside after it (START_MS):
// a second tap during the show is the same start, never a second match.
let starting = null;
export function startGame(gameId, settings, { quick = false, solo = false } = {}) {
  if (starting) return starting;
  // (PLAY NOW: a SOLO room's every start is THE SOLO START — the match id's leading 's', ~2 s — core/room-show.js#START.solo)
  const kind = solo || isSoloMeta(state.meta) ? 'solo' : quick;
  const p = startGameNow(gameId, settings, kind);
  starting = p;
  p.then(ok => setTimeout(() => { if (starting === p) starting = null; }, ok ? startOf(kind === 'solo' ? 's' : kind ? 'q' : '').len : 0), () => { if (starting === p) starting = null; });
  return p;
}
async function startGameNow(gameId, settings, quick = false) {
  lazyImport(import('./games/preload.js'), './games/preload.js').then(P => P.wireGame(gameId)).catch(() => {});   // (FRIENDS C — THE SLOW-3G START: its whole graph at once)
  const mod = await loadGame(gameId).catch(() => null);   // (SHELL 2.0 B1 — THE LAZY LOGIC: the cartridge loads on the host's tap; FRIENDS C: its whole graph at once)
  if (!mod || !isHost()) return false;
  // (WINDOWS — ONLY TWO GAMES PLAYABLE: a hidden game never starts — not from a rematch, an invite, a stale link or the console)
  if (!isPlayable(gameId)) { toast('COMING SOON', 'info'); return false; }
  // (FR7 FIXES A — B2: THE INITIATE GUARD — never a new game over the match the room is still playing; core/room-logic.js#gameRunning)
  if (gameRunning(state.meta, state.game)) { toast(GAME_ON_LINE, 'err'); return false; }
  const participants = {};
  for (const uid of Object.keys(state.players)) if (isOnline(state.presence, uid)) participants[uid] = true;
  const min = minPlayersOf(mod, MIN_PLAYERS);   // (THE CARTRIDGE PLUG: MIN_PLAYERS above the app's, or SOLO = 1)
  if (Object.keys(participants).length < min) { toast(`NEED ${min}+ CONNECTED PLAYERS`, 'err'); return false; }
  // (LOBBY FIXES — THE NEW GAME START: a same-game REMATCH's id starts with 'q' = the QUICK start (~3 s, the sign already lit); every other
  //  start is the FULL one (~5 s) — core/room-show.js#startKind: every phone reads the kind from the stamp's match id)
  const matchId = newMatchId(quick);   // (quick: false = the full start · true = a rematch's · 'solo' = THE SOLO START)
  // (LOBBY 2.0 B — THE GAME START: the start's stamp goes up FIRST — every phone begins the walk inside at the host's tap, while this phone
  //  prepares the match (a question bank, a song); the game's OWN clock starts when the walk ends (START_MS later): a cartridge's start()
  //  gets the moment its match begins, never the tap — docs/cartridge.md. The stamp also ends the last match's walk-out, its REMATCH ring +
  //  every vote. A start that fails takes the stamp back down.)
  const tGo = serverNow();
  await update(dbRef(`rooms/${state.code}`), { 'meta/go': { at: serverTimestamp(), m: matchId, g: gameId }, 'meta/back': null, rv: null }).catch(e => stampRefused('go', e));
  // (OC1 — THE CONTRACT's `used`: the room's night memory, rooms/{CODE}/meta/used, read once here — a cartridge deals around it, never
  //  reaching into the store for it — docs/cartridge.md "THE ROOM-NIGHT PATH")
  const used = (state.meta && state.meta.used) || {};
  const created = await mod.start({ code: state.code, matchId, settings, participants, now: tGo + startOf(matchId).len + 150, used }).catch(e => { console.warn('start', e); return null; });
  if (!created) { update(dbRef(`rooms/${state.code}/meta`), { go: null }).catch(() => {}); toast('COULD NOT START — TRY AGAIN', 'err'); return false; }
  const { $room, ...game } = created;
  inflight = { sig: '', at: 0 };
  // (FR7 FIXES B — A RE-START KEEPS THE LAST MATCH's PROOF: the match that just ended — still on the podium, or the room's walk-back stamp)
  const prevM = (state.game && state.game.matchId) || (state.meta && state.meta.back && state.meta.back.m) || null;
  wipeSeal(state.code);
  await update(dbRef(`rooms/${state.code}`), {
    game: { ...game, go: serverTimestamp() },   // (the start's stamp in the match's own write too — core/room-show.js#goOf: the show never waits on a rules re-publish)
    ...($room || {}),
    ...clearPlayerNodes(true),
    'meta/status': 'playing',
    'meta/activeAt': serverTimestamp(),
    'meta/hostBeat': serverTimestamp(),
    [`meta/settings/${gameId}`]: settings,
  });
  clearNewNodes(state.code, true);
  pruneProofs(state.code, [prevM, matchId]);
  withChat(m => m.announceStart(gameId, matchId));
  return true;
}

// PLAY NOW — A SOLO RUN IN ONE TAP (THE GAME CARD's PLAY NOW; docs/cartridge.md "PLAY NOW"): the room machinery with no lobby — a PRIVATE
// one-seat room (room.js#createSoloRoom: locked, never listed, no hush word shown or rested) → this phone its host + online → the cartridge's
// default one-player settings (PRISM DROP: SCORE RUSH · OVERCLOCK: QUICK — or the card's OPTIONS) → THE SOLO START (~2 s). THE SOLO LANE as
// ever (the streak + a small capped XP, never a counted play). A guest without a name sets one up first (setup's 'solo' mode comes back here).
// A start that fails closes the solo room (never a code left on screen). → true once the match is written.
let soloRun = null;
export function playSolo(gameId, { settings = null } = {}) {   // (PD-6: settings = a SOLO_RUNS button's { mode } — over the one-player defaults)
  if (soloRun) return soloRun;
  const p = playSoloNow(gameId, settings);
  soloRun = p; p.finally(() => { if (soloRun === p) soloRun = null; });
  return p;
}
const until = (fn, ms) => new Promise(res => { if (fn()) { res(true); return; } let off = null; const t = setTimeout(() => { if (off) off(); res(false); }, ms); off = subscribe(() => { if (fn()) { clearTimeout(t); if (off) off(); res(true); } }); });
async function playSoloNow(gameId, settings) {
  const prof = loadProfile();
  if (!prof || !prof.name) { setState({ view: 'setup', setupMode: 'solo', setupGame: gameId, setupSolo: settings || null }); return false; }   // (PD-6: the button's mode rides along)
  if (!isPlayable(gameId)) { toast('COMING SOON', 'info'); return false; }
  if (state.code && !isSoloMeta(state.meta)) { toast('You’re in a room — the host picks the game', 'info'); return false; }
  try {
    lazyImport(import('./games/preload.js'), './games/preload.js').then(P => P.wireGame(gameId)).catch(() => {});   // (the cartridge's graph, at once)
    await Promise.race([firebaseReady, new Promise((_, rej) => setTimeout(() => rej(new Error('network')), 20000))]);
    if (!state.code) await createSoloRoom(prof, gameId);
    const ready = await until(() => !!state.code && isHost() && !!(state.players && state.players[state.uid]) && isOnline(state.presence, state.uid), 8000);
    if (!ready) throw new Error('network');
    const meta = metaOf(gameId) || await loadGame(gameId).catch(() => null);
    const ok = await startGame(gameId, soloSettings(meta, settings), { solo: true });   // (PD-6: the button's mode, cleaned for one player)
    if (!ok) { await leaveRoom().catch(() => {}); return false; }
    return true;
  } catch (e) {
    if (state.code && isSoloMeta(state.meta)) await leaveRoom().catch(() => {});
    toast(/network/i.test(String(e && e.message)) ? 'COULDN’T START — CHECK YOUR CONNECTION' : String((e && e.message) || 'COULDN’T START'), 'err');
    return false;
  }
}
// (PLAY NOW — the podium's foot in a solo room (ui/final.js — a lazy chunk: it reads THIS hub, never a new export — THE STALE-MODULE RULE):
//  PLAY AGAIN = the same game + settings, THE SOLO START again · BACK TO THE CITY = the solo room closed like a QUIT, the walk back out)
// (THE DROP A Group 0 (c) — THE LOST RUN: BACK TO THE CITY settles this match's report first — sent at once, ≤ 3 s — the room it is checked
//  against is deleted by the leave; profile/queue.js#settle)
async function soloLeave() {
  const code = state.code, g = state.game || null, m = g && g.matchId ? g.matchId : (state.meta && state.meta.back && state.meta.back.m);
  if (code && m) await lazyImport(import('./profile/queue.js'), './profile/queue.js').then(q => q.settle(q.matchKey(code, m), 3000)).catch(() => {});   // (lazy — the queue is never in the boot graph)
  return leaveRoom();
}
if (typeof globalThis !== 'undefined') globalThis.__nsPlayNow = Object.freeze({ isSolo: () => isSoloMeta(state.meta), again: () => rematch(), leave: () => soloLeave() });

// Same game, same settings, everyone currently connected (late joiners included).
// (LOBBY 2.0 B — THE REMATCH RING: back in the room the match is gone (game: null) — the game it replays is meta/back's)
export function rematch() {
  const back = state.meta && state.meta.back;
  if (!isHost() || !(state.game || (back && back.g))) return Promise.resolve(false);
  const id = state.game ? state.game.id : back.g;
  const game = state.game;
  return loadGame(id).catch(() => null).then(mod => {   // (SHELL 2.0 B1: the cartridge's rematchSettings — loaded, it's in the tab already)
    const settings = (state.meta.settings && state.meta.settings[id]) || (game && game.settings) || (mod && mod.DEFAULT_SETTINGS) || (metaOf(id) || {}).DEFAULT_SETTINGS || {};
    return startGame(id, rematchSettingsOf(mod, settings, game), { quick: true });
  });   // (THE CARTRIDGE PLUG: a game may adjust its rematch)   // (LOBBY FIXES: the QUICK start)
}

// (LOBBY 2.0 B — the owner's real-phone test: a refused stamp went unseen. Now it's in the phones' error log (/admin) once a session: the
//  database rules on the live site are older than the code — re-publish database.rules.json. The room plays on through the fallbacks.)
let refusedSaid = false;
function stampRefused(kind, e) {
  console.warn(kind, e);
  if (refusedSaid || !/permission/i.test(String(e && (e.code || e.message) || e))) return;
  refusedSaid = true;
  lazyImport(import('./errlog.js'), './errlog.js').then(m => m.reportError(new Error(`ROOM STAMP REFUSED (${kind}) — the live database rules are older than the code: re-publish database.rules.json (meta/go, meta/back, rv)`), 'rules')).catch(() => {});
}
// FR7 FIXES B — A SEAT IS NOT A PLAY (the owner's add-on): the server credits a player only with their OWN node of the match (api/report.js#
// PROOF_PATHS — PRISM's board, OVERCLOCK's boards / combo marks / sealed picks). A report can land AFTER the room is back (the snapshot path —
// a solo run tapped through before /api answered, a queued retry), so the walk back KEEPS those nodes (+ the seal); the NEXT match's start
// wipes them as before (they are keyed by the match: nothing leaks into it)
const PROOF_NODES = new Set(PROOF_NODE_LIST);   // (games/registry.js — the console names no game)
const clearPlayerNodes = (keepProof = false) => Object.fromEntries(ALL_PLAYER_NODES.filter(n => !(keepProof && PROOF_NODES.has(n))).map(n => [n, null]));
// (OC1 — THE RULES-LAG: the nodes newer than the published rules, in a write of their own — a refusal here never stops a start or a return)
const clearNewNodes = (code, keepProof = false) => { if (code) update(dbRef(`rooms/${code}`), Object.fromEntries(NEW_PLAYER_NODES.filter(n => !(keepProof && PROOF_NODES.has(n))).map(n => [n, null]))).catch(() => {}); };
// THE SEAL's envelopes (seal/{CODE}, outside the room) go with the player nodes at a match's start + end
const wipeSeal = code => { if (code) remove(dbRef(`seal/${code}`)).catch(() => {}); };

// (FR7 FIXES B: every OTHER match's proof nodes go — best effort, in a write of their own: on rules before this pass's re-publish the host may
//  delete only a whole node, so this is refused and they stay until the room itself is deleted — the fallback)
async function pruneProofs(code, keep) {
  if (!code) return;
  try {
    const trees = {};
    await Promise.all(PROOF_NODE_LIST.map(async n => { const v = (await get(dbRef(`rooms/${code}/${n}`))).val(); if (v) trees[n] = v; }));
    const gone = staleProofPaths(trees, keep);
    if (Object.keys(gone).length) await update(dbRef(`rooms/${code}`), gone).catch(() => {});
  } catch { /* polish: the room's deletion cleans the rest */ }
}

export async function backToLobby() {
  if (!isHost() || !state.code) return;
  // (FR7 FIXES B: the seal + the proof nodes stay until the next start — a late report still finds them)
  const g = state.game;
  // (LOBBY 2.0 B — AFTER THE MATCH: the walk back out, THE WINNER's BANNER PLANE + the REMATCH ring all read this stamp — core/room-show.js.
  //  Written FIRST (the room still 'playing': nothing shows yet), so every phone has it when the room comes back; its own write — a room on
  //  rules not yet re-published still gets back to the lobby below, it only misses the show)
  // (SPEED PASS B — A2 (2): the stamp + the room's return in ONE update — one round trip, and every phone sees meta/back WITH status 'lobby'.
  //  The RULES-LAG fallback stays: a refusal (rules without meta/back) → the old two writes, the second alone always gets the room back)
  const code = state.code;
  const stamp = { 'meta/go': null, 'meta/back': g && g.matchId ? { at: serverTimestamp(), m: g.matchId, g: g.id, rm: isPlayable(g.id) } : null, rv: null };
  const back = { game: null, ...clearPlayerNodes(true), 'meta/status': 'lobby', 'meta/activeAt': serverTimestamp() };
  backWrites.n++;
  clearNewNodes(code, true);
  try { await update(dbRef(`rooms/${code}`), { ...stamp, ...back }); return; } catch (e) { backWrites.fallback++; stampRefused('back', e); }
  await update(dbRef(`rooms/${code}`), stamp).catch(() => {});
  await update(dbRef(`rooms/${code}`), back).catch(e => console.warn('lobby', e));
}
/** TESTS: backToLobby's writes — n (calls) · fallback (the one update refused → the old two) */
export const backWrites = { n: 0, fallback: 0 };
