// Host duties, run on every client:
//  - if I am host: heartbeat + run the active game's director (state machine)
//  - if I am not: watch for a dead/frozen host and claim the role
//
// Nothing here keeps game state locally — every decision is re-derived from the
// mirrored database state on each tick, so any client can take over at any time.
import { dbRef, update, remove, runTransaction, serverTimestamp, serverNow } from './firebase.js';
import { startOf, newMatchId, GO_ORPHAN_MS, goWaiting } from './core/room-show.js';
import { minPlayersOf, rematchSettingsOf } from './games/cartridge.js';
import { state, isHost, onlineMap } from './store.js';
import { shouldClaimHost, isOnline, roomIdle } from './core/room-logic.js';
import { closeIdleRoom } from './room.js';
import { DIRECTOR_TICK_MS, HOST_BEAT_MS, MIN_PLAYERS, isPlayable } from './config.js';
import { GAME_MODULES, liveKeyFor, ALL_PLAYER_NODES, loadGame, metaOf } from './games/registry.js';
import { toast } from './ui/toast.js';

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
  if (!chatLoading) { chatLoading = true; import('./chat/chat.js').then(m => { chatMod = m; }).catch(() => { chatLoading = false; }); }
  return undefined;
};

export function startHostLoop() {
  setInterval(tick, DIRECTOR_TICK_MS);
  // Background tabs throttle timers; run a tick as soon as we're visible again.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
}

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

function direct(now) {
  const game = state.game;
  const mod = GAME_MODULES[game.id];
  if (!mod) { loadGame(game.id).catch(() => {}); return; }   // (SHELL 2.0 B1: a new host / a refresh — the cartridge loads, the next tick directs)
  // Only decide with player data that belongs to the current step.
  if (state.liveKey !== liveKeyFor(game)) return;
  mod.prepare(game, { code: state.code, host: true }); // e.g. word lists / trivia top-ups on a freshly promoted host
  const step = mod.step(game, { code: state.code, now, live: state.live, online: onlineMap() });
  if (!step) return;
  // (THE SEAL: an unseal is a step of its own inside a phase — the director's real step follows it at once, not 3 s later)
  const sig = `${game.matchId}|${game.phase}|${game.phaseStartAt}|${JSON.stringify(game.unseal || null)}`;
  if (inflight.sig === sig && now - inflight.at < 3000) return; // write already on its way
  inflight = { sig, at: now };
  hostStats.steps++;
  if (step.lobby) { backToLobby(); return; }
  update(dbRef(`rooms/${state.code}`), roomPatch(game, step)).catch(e => { inflight.sig = ''; console.warn('director', e); });
}

// Points toward the room's game-night leaderboard for finishing 1st / 2nd / 3rd.
export const NIGHT_POINTS = { 1: 3, 2: 2, 3: 1 };

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
    for (const r of mod.finalRanks(finished)) {
      p[r.uid] = solo ? 0 : NIGHT_POINTS[r.rank] || 0;
      n[r.uid] = (state.players[r.uid] && state.players[r.uid].name) || 'GHOST';
    }
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
export function startGame(gameId, settings, { quick = false } = {}) {
  if (starting) return starting;
  const p = startGameNow(gameId, settings, quick);
  starting = p;
  p.then(ok => setTimeout(() => { if (starting === p) starting = null; }, ok ? startOf(quick ? 'q' : '').len : 0), () => { if (starting === p) starting = null; });
  return p;
}
async function startGameNow(gameId, settings, quick = false) {
  const mod = await loadGame(gameId).catch(() => null);   // (SHELL 2.0 B1 — THE LAZY LOGIC: the cartridge loads on the host's tap)
  if (!mod || !isHost()) return false;
  // (WINDOWS — ONLY TWO GAMES PLAYABLE: a hidden game never starts — not from a rematch, an invite, a stale link or the console)
  if (!isPlayable(gameId)) { toast('COMING SOON', 'info'); return false; }
  const participants = {};
  for (const uid of Object.keys(state.players)) if (isOnline(state.presence, uid)) participants[uid] = true;
  const min = minPlayersOf(mod, MIN_PLAYERS);   // (THE CARTRIDGE PLUG: MIN_PLAYERS above the app's, or SOLO = 1)
  if (Object.keys(participants).length < min) { toast(`NEED ${min}+ CONNECTED PLAYERS`, 'err'); return false; }
  // (LOBBY FIXES — THE NEW GAME START: a same-game REMATCH's id starts with 'q' = the QUICK start (~3 s, the sign already lit); every other
  //  start is the FULL one (~5 s) — core/room-show.js#startKind: every phone reads the kind from the stamp's match id)
  const matchId = newMatchId(quick);
  // (LOBBY 2.0 B — THE GAME START: the start's stamp goes up FIRST — every phone begins the walk inside at the host's tap, while this phone
  //  prepares the match (a question bank, a song); the game's OWN clock starts when the walk ends (START_MS later): a cartridge's start()
  //  gets the moment its match begins, never the tap — docs/cartridge.md. The stamp also ends the last match's walk-out, its REMATCH ring +
  //  every vote. A start that fails takes the stamp back down.)
  const tGo = serverNow();
  await update(dbRef(`rooms/${state.code}`), { 'meta/go': { at: serverTimestamp(), m: matchId, g: gameId }, 'meta/back': null, rv: null }).catch(e => stampRefused('go', e));
  const created = await mod.start({ code: state.code, matchId, settings, participants, now: tGo + startOf(matchId).len + 150 }).catch(e => { console.warn('start', e); return null; });
  if (!created) { update(dbRef(`rooms/${state.code}/meta`), { go: null }).catch(() => {}); toast('COULD NOT START — TRY AGAIN', 'err'); return false; }
  const { $room, ...game } = created;
  inflight = { sig: '', at: 0 };
  wipeSeal(state.code);
  await update(dbRef(`rooms/${state.code}`), {
    game: { ...game, go: serverTimestamp() },   // (the start's stamp in the match's own write too — core/room-show.js#goOf: the show never waits on a rules re-publish)
    ...($room || {}),
    ...clearPlayerNodes(),
    'meta/status': 'playing',
    'meta/activeAt': serverTimestamp(),
    'meta/hostBeat': serverTimestamp(),
    [`meta/settings/${gameId}`]: settings,
  });
  withChat(m => m.announceStart(gameId, matchId));
  return true;
}

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
  import('./errlog.js').then(m => m.reportError(new Error(`ROOM STAMP REFUSED (${kind}) — the live database rules are older than the code: re-publish database.rules.json (meta/go, meta/back, rv)`), 'rules')).catch(() => {});
}
const clearPlayerNodes = () => Object.fromEntries(ALL_PLAYER_NODES.map(n => [n, null]));
// THE SEAL's envelopes (seal/{CODE}, outside the room) go with the player nodes at a match's start + end
const wipeSeal = code => { if (code) remove(dbRef(`seal/${code}`)).catch(() => {}); };

export async function backToLobby() {
  if (!isHost() || !state.code) return;
  wipeSeal(state.code);
  const g = state.game;
  // (LOBBY 2.0 B — AFTER THE MATCH: the walk back out, THE WINNER's BANNER PLANE + the REMATCH ring all read this stamp — core/room-show.js.
  //  Written FIRST (the room still 'playing': nothing shows yet), so every phone has it when the room comes back; its own write — a room on
  //  rules not yet re-published still gets back to the lobby below, it only misses the show)
  // (SPEED PASS B — A2 (2): the stamp + the room's return in ONE update — one round trip, and every phone sees meta/back WITH status 'lobby'.
  //  The RULES-LAG fallback stays: a refusal (rules without meta/back) → the old two writes, the second alone always gets the room back)
  const code = state.code;
  const stamp = { 'meta/go': null, 'meta/back': g && g.matchId ? { at: serverTimestamp(), m: g.matchId, g: g.id, rm: isPlayable(g.id) } : null, rv: null };
  const back = { game: null, ...clearPlayerNodes(), 'meta/status': 'lobby', 'meta/activeAt': serverTimestamp() };
  backWrites.n++;
  try { await update(dbRef(`rooms/${code}`), { ...stamp, ...back }); return; } catch (e) { backWrites.fallback++; stampRefused('back', e); }
  await update(dbRef(`rooms/${code}`), stamp).catch(() => {});
  await update(dbRef(`rooms/${code}`), back).catch(e => console.warn('lobby', e));
}
/** TESTS: backToLobby's writes — n (calls) · fallback (the one update refused → the old two) */
export const backWrites = { n: 0, fallback: 0 };
