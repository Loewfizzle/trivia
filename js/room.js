// Room lifecycle: create / join / resume / leave / kick, live mirroring and presence.
import {
  dbRef, get, set, update, remove, onValue, onDisconnect, serverTimestamp, serverNow,
  query, orderByChild, endAt, limitToFirst, runTransaction, want, release, expectRefusal, setRoomGone } from './firebase.js';
import { state, setState } from './store.js';
import { saveSession, loadSession, loadProfile, setUrlRoom, loadMe, testMode } from './identity.js';
import { generateCode, normalizeCode, pickColor, sanitizeName, sanitizeAvatar, nextHost, roomIdle, normalizePresence, isOnline, isSoloMeta, soloCode } from './core/room-logic.js';
import { MAX_PLAYERS, ROOM_TTL_MS, NAME_MAX } from './config.js';
import { pickLine } from './core/room-lines.js';
import { hushCandidates, staleHush, claimFirst, missCooldown, recentMisses } from './core/hush.js';
import { hostSeed } from './audio/lobby-music.js';
import { toast } from './ui/toast.js';
import { livePathsFor, liveKeyFor, onGameLoaded } from './games/registry.js';
import { closeAll } from './ui/layers.js';
import { watchRoomProfiles, stopRoomProfiles } from './profile/public.js';
import { claimSeatFor, takeSeat, freeSeat, watchSeat, seatConflict } from './seat.js';
import { lazyImport } from './ui/lazy-import.js';

const R = code => `rooms/${code}`;
// CONN: the database line is wanted while HOST / JOIN / a resume / an invite check runs ('join') and the whole time we're in a
// room ('room', from enterRoom to exitRoom) — firebase.js parks it 30 s after the last reason lets go
const joining = fn => async (...a) => { want('join'); try { return await fn(...a); } finally { release('join'); } };
let unsubs = [];
let liveUnsubs = [];
let liveWanted = null;
let seen = { meta: false, self: false };
// PRESENCE (APP FIXES — one child per connection, core/room-logic.js#presenceOnline): this page's live connection id in the
// room it was armed for. null = nothing armed (left / leaving), so the self-heal below never writes us back in.
let myConn = null;
let lastHeal = 0;
let healTimer = 0;
let lastRaw = null;   // the newest raw presence snapshot (the heal's retry reads it)

const EMPTY_ROOM = { code: null, meta: null, players: {}, presence: {}, kicked: {}, game: null, night: {}, rv: {}, roomRadio: [], live: {}, liveKey: null };

function cleanProfile(profile) {
  return { name: sanitizeName(profile.name, NAME_MAX) || 'ANON', color: profile.color, avatar: sanitizeAvatar(profile.avatar) };
}

async function writePlayer(code, profile, players) {
  const p = cleanProfile(profile);
  const existing = players && players[state.uid];
  const node = {
    name: p.name,
    color: pickColor(p.color, players, state.uid),
    avatar: p.avatar,
    joinedAt: existing && existing.joinedAt ? existing.joinedAt : serverTimestamp(),
  };
  // the global profile (emblem + tag in the lobby and chat). The rules only accept our own profile id; if the link
  // isn't there (server down, a stale id), we join without it — joining must never depend on profiles.
  const me = loadMe();
  const pid = me && me.uid === state.uid ? me.pid : null;
  let done = false;
  if (pid) {
    try { await set(dbRef(`${R(code)}/players/${state.uid}`), { ...node, pid }); done = true; } catch { /* without it */ }
  }
  if (!done) await set(dbRef(`${R(code)}/players/${state.uid}`), node);
  // LOBBY 2.0 A — THE LINE (core/harbor-room.js): the side of the speakeasy's door this player queues on — picked once at the join (the
  // shorter line; the host's the left) and kept. A SEPARATE write: a join never depends on it (rules not yet re-published refuse it —
  // the lines then fall back to taking turns, the same on every phone)
  const ln = existing && (existing.ln === 'L' || existing.ln === 'R') ? existing.ln : pickLine(players, state.uid);
  set(dbRef(`${R(code)}/players/${state.uid}/ln`), ln).catch(() => {});
}

async function readRoomBasics(code) {
  const [meta, players, kicked] = await Promise.all(['meta', 'players', `kicked/${state.uid}`].map(k => get(dbRef(`${R(code)}/${k}`))));
  return { meta: meta.val(), players: players.val() || {}, kicked: !!kicked.val() };
}

// ---- HUSH WORDS: the room's code is a word (data/hushwords.json); js/core/hush.js picks it, the claim below makes it ours
// The nodes outside rooms/ that belong to a room (secrets, chat): wiped when a room is made and when it closes.
const ROOM_SIDE_NODES = ['chats', 'spy', 'fleets', 'glsonar', 'hsbet', 'rrp', 'rrsec', 'seal'];
let wordsP = null;
function loadHushWords() {
  // fetched once, only by a phone that hosts (the service worker keeps a copy); [] if it can't load → the old random codes
  if (!wordsP) {
    wordsP = fetch('data/hushwords.json').then(r => (r.ok ? r.json() : [])).then(w => (Array.isArray(w) ? w : [])).catch(() => [])
      .then(w => { if (!w.length) wordsP = null; return w; });
  }
  return wordsP;
}

// Claims rooms/{code}/meta only if nobody has it — a transaction, so two hosts can never get the same word (the rules
// also refuse a meta write over someone else's room).
async function claimRoom(code) {
  const meta = { hostId: state.uid, status: 'lobby', createdAt: serverTimestamp(), activeAt: serverTimestamp(), hostBeat: serverTimestamp() };
  const res = await runTransaction(dbRef(`${R(code)}/meta`), cur => (cur == null ? meta : undefined), { applyLocally: false });
  return !!(res && res.committed && res.snapshot.exists() && res.snapshot.child('hostId').val() === state.uid);
}

export const createRoom = joining(async profile => {
  cancelResume();   // (LOAD FIX 4: a late boot resume never walks this phone back into its old room after a HOST)
  cleanupStaleRooms().catch(() => {});
  await claimSeatFor(null);   // (LOBBY FIXES — ONE ACCOUNT, ONE ROOM: already seated on another device → MOVE HERE · CANCEL — seat.js)
  const [words, hush] = await Promise.all([
    loadHushWords(),
    get(dbRef('hush')).then(s => s.val() || {}).catch(() => ({})), // unreadable → every word looks free; the claim still decides
  ]);
  const now = serverNow();
  cleanupHush(hush, now);
  // free words first, then the longest-cooled ones, and only without a list a few random codes — never fail to make a room
  const candidates = [...hushCandidates(words, hush, now), ...Array.from({ length: 10 }, () => generateCode())];
  const code = await claimFirst(candidates, claimRoom);
  if (!code) throw new Error('COULDN’T OPEN A ROOM — CHECK YOUR CONNECTION AND TRY AGAIN');
  // the song the host is hearing carries on into the room, at its place (audio/lobby-music.js) — best effort
  const lm = hostSeed(serverNow());
  if (lm) update(dbRef(`${R(code)}/meta/lm`), lm).catch(() => {});
  // a fresh room starts with a fresh chat, and no old DOUBLE AGENT / GRIDLOCK / HIGH STAKES / RUMRUNNER secrets
  for (const n of ROOM_SIDE_NODES) await remove(dbRef(`${n}/${code}`)).catch(() => {});
  await takeSeat(code);
  await writePlayer(code, profile, {});
  enterRoom(code);
  roomPushLater(code);
  return code;
});

// PLAY NOW — THE SOLO ROOM (the GAME CARD's PLAY NOW — host.js#playSolo): a PRIVATE one-seat room — LOCKED from its first write, flagged
// meta.settings.solo.on (+ the game), its code 4 random letters that are NOT a hush word (core/room-logic.js#soloCode): never shown (no
// ?room= in the address bar, the REJOIN offer says RESUME), never "A ROOM JUST OPENED", never listed (the radio's rooms skip it), and its
// close writes NO hush/ entry — the hush-word pool is untouched. ONE ACCOUNT, ONE ROOM holds: claimSeatFor (MOVE HERE on a second device).
const SOLO_LS = 'na:solo';
/** is a saved room code this phone's solo room? (the title's REJOIN offer says RESUME — never the code) */
export const soloRejoin = code => { try { return !!code && localStorage.getItem(SOLO_LS) === code; } catch { return false; } };
async function claimSolo(code, gameId) {
  const meta = { hostId: state.uid, status: 'lobby', createdAt: serverTimestamp(), activeAt: serverTimestamp(), hostBeat: serverTimestamp(),
    settings: { solo: { on: true, g: String(gameId || '').slice(0, 16) } } };
  const res = await runTransaction(dbRef(`${R(code)}/meta`), cur => (cur == null ? meta : undefined), { applyLocally: false });
  return !!(res && res.committed && res.snapshot.exists() && res.snapshot.child('hostId').val() === state.uid);
}
export const createSoloRoom = joining(async (profile, gameId) => {
  cancelResume();
  await claimSeatFor(null);
  const words = await loadHushWords().catch(() => []);
  let code = null;
  for (let i = 0; i < 6 && !code; i++) { const c = soloCode(words); if (await claimSolo(c, gameId)) code = c; }
  if (!code) throw new Error('COULDN’T START — CHECK YOUR CONNECTION AND TRY AGAIN');
  try { localStorage.setItem(SOLO_LS, code); } catch { /* the offer then shows the code — never worse than before */ }
  await Promise.all(ROOM_SIDE_NODES.map(n => remove(dbRef(`${n}/${code}`)).catch(() => {})));   // (a stale secret under a reused code: gone, all at once)
  await takeSeat(code);
  await writePlayer(code, profile, {});
  // (LOCKED once its one seat is taken — the rules refuse even the host's own first player write into a locked room; the code is 4 random
  //  letters nobody has seen, so the instant before the lock is closed to everyone in practice)
  await update(dbRef(`${R(code)}/meta`), { locked: true }).catch(() => {});
  enterRoom(code, { solo: true });
  return code;
});

// CC-B — "A ROOM JUST OPENED": tell the server (it checks the room is ours + new + still open with its host online, then pushes to the
// owner's phone if he turned it on) — fire and forget: /api down or unconfigured changes nothing. FR6 FIXES A (the owner, Nov 4: pushes for
// rooms that were empty when he went): asked ROOM_PUSH_MS after the room opened, and only if this phone is STILL in it — a room opened +
// left within the wait never pings (exitRoom clears the timer)
export const ROOM_PUSH_MS = 10000;
let pushTimer = null;
function roomPushLater(code) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    if (state.code !== code || !state.players || !state.players[state.uid]) return;
    lazyImport(import('./profile/api.js'), './profile/api.js').then(m => m.api('admin', { action: 'radioRoomOpened', room: code, ...(testMode ? { silent: true } : {}) })).catch(() => {});   // (a TEST tab: silent)
  }, ROOM_PUSH_MS);
}

// hush/ entries older than 24 h are no use to anyone: whoever opens a room sweeps a few (best effort).
function cleanupHush(hush, now) {
  const old = staleHush(hush, now);
  if (old.length) update(dbRef(), Object.fromEntries(old.map(w => [`hush/${w}`, null]))).catch(() => {});
}

// Closes a room: rooms/{code} goes, and hush/{code} remembers when (that word rests for 24 h). The rules only accept the
// hush entry together with the room's own deletion. If they refuse it (rules not yet published), the room still closes.
async function closeRoom(code, solo = false) {
  // (PLAY NOW: a solo room rests no word — its code was never a hush word, and the pool stays untouched)
  if (solo) await remove(dbRef(R(code)));
  else {
    try { await update(dbRef(), { [R(code)]: null, [`hush/${code}`]: { closedAt: serverTimestamp() } }); }
    catch { await remove(dbRef(R(code))); }
  }
  for (const n of ROOM_SIDE_NODES) await remove(dbRef(`${n}/${code}`)).catch(() => {});
}

// ---- the guessing guard (light): a device that keeps typing words that open nothing waits 30 s. Device-wide, not per slot.
const MISS_KEY = 'na:hushmiss';
function readMisses() { try { return JSON.parse(localStorage.getItem(MISS_KEY) || '[]'); } catch { return []; } }
function noteMiss() {
  try { const now = Date.now(); localStorage.setItem(MISS_KEY, JSON.stringify([...recentMisses(readMisses(), now), now].slice(-12))); } catch { /* private mode: no guard */ }
}
/** ms before this device may try another hush word (0 = now). */
export const joinWait = () => missCooldown(readMisses(), Date.now());

export const LOCKED_MSG = 'The door’s locked. Ask the host to let you in.';

export const joinRoom = joining(async (input, profile) => {
  const code = normalizeCode(input);
  if (!code) throw new Error('The hush word is 4 letters.');
  cancelResume();   // (LOAD FIX 4: the dock joins a still-running boot resume for the SAME room itself — title-dock.js#join; any other join wins)
  const wait = joinWait();
  if (wait > 0) throw new Error(`Easy there — too many wrong words. Try again in ${Math.ceil(wait / 1000)} s.`);
  const room = await readRoomBasics(code);
  if (room.meta && roomIdle(room.meta, serverNow())) { await deleteRoom(code); room.meta = null; }
  if (!room.meta) { noteMiss(); throw new Error(`No room behind ${code}. Check the hush word, or ask the host for a new invite (rooms close after an hour without a game).`); }
  if (room.kicked) throw new Error('The host removed you from this room.');
  // a locked door keeps NEW players out; anyone already in the room walks straight back in
  if (room.meta.locked === true && !room.players[state.uid]) { noteMiss(); throw new Error(LOCKED_MSG); }
  const others = Object.keys(room.players).filter(u => u !== state.uid).length;
  if (!room.players[state.uid] && others >= MAX_PLAYERS) throw new Error(`Room ${code} is full (${MAX_PLAYERS}/${MAX_PLAYERS} players).`);
  // (LOBBY FIXES — ONE PROFILE, ONE SEAT + ONE ACCOUNT, ONE ROOM: this profile already sits here or in another room on another device →
  //  "You're already in … on another device" · MOVE HERE · CANCEL (CANCEL throws: the title says so); then the seat is this device's)
  await claimSeatFor(code);
  await takeSeat(code);
  if (!room.players[state.uid] && room.meta.status === 'playing') toast('GAME IN PROGRESS — YOU’LL WATCH, THEN JOIN THE NEXT ONE', 'info', 4500);
  try { await writePlayer(code, profile, room.players); } catch (e) {
    // the host locked the door between our look and our step inside (the rules refused the new seat)
    const locked = await get(dbRef(`${R(code)}/meta/locked`)).then(s => s.val() === true).catch(() => false);
    throw locked ? new Error(LOCKED_MSG) : e;
  }
  enterRoom(code);
  return code;
});

// Called on boot: puts a refreshed/returning player straight back into their room.
// Returns 'ok', 'none' (no saved room), 'gone' (closed / removed / full — forgotten) or
// 'error' (couldn't reach the room right now — the session is kept so a retry works).
// LOAD FIX 4 — THE REJOIN LIMIT (Grok's boot audit #1): on a dead line Firebase's get() waits for the socket with NO time limit, so the boot
// gives up WAITING after a while (app.js) — never the attempt: it runs on while the socket keeps trying, and lands as a normal rejoin. While
// it runs, a REJOIN tap for the same room joins THIS attempt (pendingResume — never a second join); a HOST or another JOIN cancels it
// (cancelResume: checked after every wait — a cancelled resume writes nothing more and never enters the room → 'cancelled').
let resumeRun = null;   // { code, p } while a resume is out
let resumeGen = 0;
export const pendingResume = code => (resumeRun && (!code || resumeRun.code === code) ? resumeRun.p : null);
export function cancelResume() { resumeGen++; }
export async function resumeSession() {
  const session = loadSession();
  if (!session || !session.code) return 'none';   // (no saved room: the line stays parked)
  const gen = ++resumeGen;
  const run = { code: session.code, p: resumeSaved(session, () => gen !== resumeGen) };
  resumeRun = run;
  try { return await run.p; } finally { if (resumeRun === run) resumeRun = null; }
}
const resumeSaved = joining(async (session, stale) => {
  const profile = loadProfile();
  let room;
  try { room = await readRoomBasics(session.code); } catch { return 'error'; }
  if (stale()) return 'cancelled';
  // Back the next day: the room sat for an hour without a game — close it and start fresh on the title.
  if (room.meta && roomIdle(room.meta, serverNow())) { await deleteRoom(session.code); saveSession(null); setUrlRoom(null); return 'idle'; }
  const gone = !room.meta || room.kicked
    || (!room.players[state.uid] && (!profile || Object.keys(room.players).length >= MAX_PLAYERS || room.meta.locked === true));
  if (gone) { saveSession(null); return 'gone'; }
  // (LOBBY FIXES — ONE ACCOUNT, ONE ROOM: another device of this profile took the seat while this one was away → never silently back in;
  //  the title says where the card is — a JOIN asks MOVE HERE)
  const moved = await seatConflict(session.code).catch(() => null);
  if (stale()) return 'cancelled';
  if (moved) { saveSession(null); setUrlRoom(null); lastMoved = moved.code; return 'moved'; }
  await takeSeat(session.code);
  if (stale()) return 'cancelled';
  try {
    // Seat was lost (e.g. left on another device) — rejoin with the saved profile.
    if (!room.players[state.uid]) await writePlayer(session.code, profile, room.players);
    if (stale()) return 'cancelled';
    enterRoom(session.code);
    return 'ok';
  } catch {
    return 'error';
  }
});

/** (LOBBY FIXES) the room another device of this profile holds — the last resume that found one ('moved') */
let lastMoved = null;
export const movedTo = () => lastMoved;

function birthdayRoom(code) {
  let bd = null; try { bd = JSON.parse(localStorage.getItem('nd:bd') || 'null'); } catch { /* fine */ }
  if (!bd || !bd.m) return;
  setTimeout(() => Promise.all([lazyImport(import('./core/birthday.js'), './core/birthday.js'), lazyImport(import('./profile/api.js'), './profile/api.js')]).then(([B, A]) => {
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; } })();
    if (!B.isBirthdayOn(bd, serverNow(), tz)) return;
    return A.api('profile', { action: 'birthdayRoom', room: code, tz });
  }).catch(() => {}), 3000);
}
function enterRoom(code, { solo = false } = {}) {
  want('room');
  stopListening();
  saveSession(code);
  if (!solo && !soloRejoin(code)) setUrlRoom(code);   // (PLAY NOW: a solo room's code never in the address bar)
  seen = { meta: false, self: false };
  setState({ ...EMPTY_ROOM, code, view: 'room' });
  const base = R(code);
  const listen = (path, fn) => unsubs.push(onValue(dbRef(`${base}/${path}`), s => fn(s.val()), err => console.warn(path, err)));

  listen('meta', meta => {
    if (!meta) { if (seen.meta) exitRoom(roomIdle(state.meta, serverNow()) ? 'ROOM CLOSED — NO GAME FOR AN HOUR' : 'ROOM CLOSED'); return; }
    seen.meta = true;
    setState({ meta });
    // (a new host reads the round's sealed envelopes — its live paths change with the host: games/registry.js#livePathsFor)
    if (state.game) watchLive(code, state.game);
  });
  listen('players', players => {
    players = players || {};
    if (players[state.uid]) seen.self = true;
    // (SPEED PASS B — the owner's 10:21 pm laptop: a LEAVE's own write lands here first (the local event fires before the await) — it was
    //  read as a disconnect: "YOU WERE DISCONNECTED" + every figure waving goodbye. leaveRoom() exits itself, as a leave)
    else if (seen.self) { if (leavingCode !== code) exitRoom('YOU WERE DISCONNECTED FROM THE ROOM', 'warn', { how: 'lost' }); return; }
    setState({ players });
    watchRoomProfiles(players);
  });
  listen('presence', presence => {
    setState({ presence: normalizePresence(presence) });
    healPresence(code, presence);
  });
  listen('night', night => setState({ night: night || {} }));
  listen('rv', rv => setState({ rv: rv || {} }));   // (LOBBY 2.0 B — THE REMATCH VOTE: each player's own vote, rv/{uid} = the match they want again)
  // PROGRESSION B — BIRTHDAYS: on the player's birthday the server writes the room's HAPPY BDAY skywrite (once a day a room — DORMANT
  // until LOBBY 2.0 makes the lobby the live city; its phones play it then). Polish: only with a birthday on this phone, never waits.
  birthdayRoom(code);
  // CC-B — THE INTERCOM in a lobby (rooms/{CODE}/radio — written by the server only; LOBBY ONLY + EVERYONE's lobby copy): its phones start it
  // TOGETHER on the server clock; a phone in a game holds it (audio/intercom.js). The player loads only when an announcement is there.
  // CC-B — THE CREW: ONE RADIO PER LOBBY (the hand-over + an ask — server-written; screens/harbor/radio.js reads it from the store)
  listen('radioCrew', rc => setState({ radioCrew: rc || null }));
  listen('radio', radio => {
    const all = Object.entries(radio || {}).map(([id, x]) => ({ id, ...(x || {}) }));
    const list = all.filter(x => x.kind === 'intercom');
    if (list.length) lazyImport(import('./audio/intercom.js'), './audio/intercom.js').then(m => m.intercomFeed('room', list)).catch(e => console.warn('[intercom]', e));
    // (LOBBY 2.0 B — the owner's ADD-ON: THE CREW's Blackbird "didn't fly". The server wrote the crew's / a favor's / the owner's LOBBY ONLY
    //  sky moments here all along, but only the intercom was ever played — the rest waited for the lobby to be the live city (LOBBY 2.0) and
    //  were never switched on. Now every phone IN the room hands them to its city (title.js → the remote's feed → scene-radio: each plays
    //  ONCE, at its place on the server clock); a phone outside the room never listens here.)
    setState({ roomRadio: all.filter(x => x.kind !== 'intercom' && x.jack) });
  });
  listen('kicked', kicked => {
    kicked = kicked || {};
    if (kicked[state.uid]) { exitRoom('THE HOST REMOVED YOU FROM THE ROOM', 'err', { how: 'kick' }); return; }
    setState({ kicked });
  });
  listen('game', game => {
    setState({ game });
    watchLive(code, game);
  });
  // (LOBBY FIXES — ONE ACCOUNT, ONE ROOM: another device of this profile took the seat (MOVE HERE) → this one walks out of the room — the
  //  same leave as LEAVE ROOM: the others see the wave + the walk-off)
  unsubs.push(watchSeat(code, ({ code: to, here, uid }) => {
    if (state.code !== code) return;
    // (the SAME room: the other device is the same person sitting down — a host hands the room to it, never closes it as "the last one out"
    //  (its player node may not have reached this phone yet))
    leaveRoom({ keepSeat: true, heir: here ? uid : null, reason: here ? 'YOU MOVED TO YOUR OTHER DEVICE' : `YOU MOVED TO ROOM ${to} ON YOUR OTHER DEVICE` });
  }));
  armPresence();
}

// Subscribes to the player-written paths the active game needs right now
// (e.g. this round's boards). liveKey is only set once every path has loaded,
// so the director never decides on half-synced data.
// (SHELL 2.0 B1 — THE LAZY LOGIC: a match's paths come with its cartridge — when it lands mid-match, watch them then)
onGameLoaded(id => { if (state.code && state.game && state.game.id === id) watchLive(state.code, state.game); });
function watchLive(code, game) {
  const key = liveKeyFor(game);
  if (key === liveWanted) return;
  liveWanted = key;
  liveUnsubs.forEach(u => u());
  liveUnsubs = [];
  setState({ live: {}, liveKey: null });
  if (!key) return;
  const paths = livePathsFor(game);
  const live = {};
  const loaded = new Set();
  for (const [name, path] of Object.entries(paths)) {
    // (a path starting with '/' is absolute — THE SEAL's envelopes, outside rooms/)
    liveUnsubs.push(onValue(dbRef(path.startsWith('/') ? path.slice(1) : `${R(code)}/${path}`), s => {
      if (state.code !== code || liveWanted !== key) return;
      live[name] = s.val() || {};
      loaded.add(name);
      setState({ live: { ...live }, liveKey: loaded.size === Object.keys(paths).length ? key : null });
    }));
  }
}

// (Re)registers presence; called on room entry and on every reconnect (a new socket = a new connection id).
// ONE CHILD PER CONNECTION: presence/{uid}/c/{connId} goes away with ITS socket (onDisconnect().remove()), so an old page's
// late onDisconnect can't mark the refreshed page offline. online + lastSeen are still written (older clients read online).
export async function armPresence() {
  const code = state.code, uid = state.uid;           // captured before the first await: never write into a room we left
  if (!code || !state.connected || !uid) return;
  const conn = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  myConn = { code, id: conn };
  lastHeal = Date.now();   // the first presence snapshot before this write lands is not a reason to heal
  const pRef = dbRef(`${R(code)}/presence/${uid}`);
  try {
    // 1. this connection's child goes with its socket (registered before the child exists: it can never outlive the socket)
    await onDisconnect(dbRef(`${R(code)}/presence/${uid}/c/${conn}`)).remove();
    if (state.code !== code || !myConn || myConn.id !== conn) return;   // left (or re-armed) while we waited
    // 2. the node: v 2 = "online comes from c only" (core/room-logic.js#presenceOnline), so a socket lost before step 3
    //    still reads offline once its child is gone
    await update(pRef, { online: true, lastSeen: serverTimestamp(), v: 2, [`c/${conn}`]: serverTimestamp() });
    // 3. lastSeen + the flag older clients read (the server checks an onDisconnect update against the node as it is NOW,
    //    so it is registered after the node exists)
    await onDisconnect(pRef).update({ online: false, lastSeen: serverTimestamp() });
  } catch (e) { console.warn('presence', e); }
}

// THE SELF-HEAL (Grok 4.5): while connected, if our own connection's child is missing (a stray write, a race with a host's
// wipe, the node lost), write it again — at most every 5 s. Never after leaving (myConn null) or for another room.
function healPresence(code, raw) {
  lastRaw = raw;
  if (!myConn || myConn.code !== code || state.code !== code || !state.connected || !state.uid) return;
  const mine = raw && raw[state.uid];
  if (mine && mine.c && mine.c[myConn.id]) return;
  if (state.kicked && state.kicked[state.uid]) return;
  const t = Date.now();
  if (t - lastHeal < 5000) {
    // too soon after the last write: try again when the 5 s are up (with the newest snapshot), not on the next event
    clearTimeout(healTimer);
    healTimer = setTimeout(() => { healTimer = 0; healPresence(code, lastRaw); }, 5000 - (t - lastHeal) + 50);
    return;
  }
  lastHeal = t;
  armPresence();
}

// Drops this page's connection from the room it was armed for (best effort; the rules let a player remove their own child).
function dropPresence(code, uid) {
  const conn = myConn;
  myConn = null;
  clearTimeout(healTimer); healTimer = 0;
  if (!code || !uid) return;
  onDisconnect(dbRef(`${R(code)}/presence/${uid}`)).cancel().catch(() => {});
  if (conn && conn.code === code) remove(dbRef(`${R(code)}/presence/${uid}/c/${conn.id}`)).catch(() => {});
}

function stopListening() {
  stopRoomProfiles();
  unsubs.forEach(u => u());
  unsubs = [];
  liveUnsubs.forEach(u => u());
  liveUnsubs = [];
  liveWanted = null;
}

// SPEED PASS B — HOW this phone left its last room: { code, how: 'leave' | 'lost' | 'kick' | 'closed' } (the city: only a LEAVE waves goodbye;
// screens/room-city.js reads it as the room's figures go) · leavingCode: a leave in flight (its own players event is not a disconnect)
let lastExit = null, leavingCode = null;
export const exitHow = () => lastExit;
// THE CHAT FALSE ALARM (Nov 13 — /admin's errors): a room / chat write the rules refuse once this phone is no longer in that room (it left or is
// leaving, the host removed it, the room closed) is the leave's race — firebase.js logs it quietly, "no longer in the room", never the alarm
export const leftRoom = code => !!code && (state.code !== code || leavingCode === code || !!(state.kicked && state.uid && state.kicked[state.uid]));
setRoomGone(leftRoom);
globalThis.__nsRoomGone = leftRoom;   // (the hub the lazy chat reads before every write — js/chat/chat.js#mayWrite)
export function exitRoom(reason, kind = 'warn', { keepSeat = false, how = 'closed' } = {}) {
  const code = state.code;
  lastExit = { code, how };
  leavingCode = null;
  if (code && !keepSeat) freeSeat(code);   // (LOBBY FIXES — the seat goes back with the room: only while it's still this device's)
  if (code && soloRejoin(code)) { try { localStorage.removeItem(SOLO_LS); } catch { /* fine */ } }
  clearTimeout(pushTimer); pushTimer = null;   // (FR6 FIXES A: a room left before its push was asked never pings)
  closeAll();   // (FR6 FIXES A — B7: a kick / a closed room closes every sheet + the profile overlay over the title)
  stopListening();
  dropPresence(code, state.uid);
  saveSession(null);
  setUrlRoom(null);
  setState({ ...EMPTY_ROOM, view: 'title', invite: '', rejoin: '' });   // (CITY 1.0 OUT — THE STUCK JOIN: no invite / REJOIN offer survives the room it was for)
  release('room');
  if (reason) toast(reason, kind, 3500);
}

export async function leaveRoom({ keepSeat = false, reason = null, heir: given = null } = {}) {
  const code = state.code;
  if (!code) return;
  const uid = state.uid;
  myConn = null;   // leaving: the self-heal must not write us back while the node goes
  leavingCode = code;
  try {
    const others = Object.keys(state.players).filter(u => u !== uid);
    if (state.meta && state.meta.hostId === uid) {
      if (given || others.length) {
        const heir = given || nextHost({ players: state.players, presence: state.presence, exclude: uid });
        // (SHELL 2.0 B2 — the rules take a hand-off only to a live, online player (MAKE HOST's rule): an offline heir is refused — then this
        //  phone still leaves; the others claim the empty seat the usual way. THE ERRORS GROUP's add-on: nextHost picks ONLY a player online NOW
        //  (nobody online → no hand-off written); a refusal the rules still make (the heir's socket dropped in the instant) is EXPECTED — a quiet
        //  'hand-off refused: the heir is offline', never the re-publish alarm)
        if (heir) {
          expectRefusal(`${R(code)}/meta`, 'hand-off refused: the heir is offline');
          try { await update(dbRef(`${R(code)}/meta`), { hostId: heir, hostBeat: serverTimestamp() }); } catch (e) { console.info('hand-off refused: the heir is offline', e && e.message); }
        }
      } else {
        await closeRoom(code, isSoloMeta(state.meta)); // last one out turns off the lights
        exitRoom(reason, 'info', { keepSeat, how: 'leave' });
        return;
      }
    }
    await onDisconnect(dbRef(`${R(code)}/presence/${uid}`)).cancel();
    await update(dbRef(R(code)), { [`presence/${uid}`]: null, [`players/${uid}`]: null });
  } catch (e) { console.warn('leave', e); }
  if (state.code === code) exitRoom(reason, 'info', { keepSeat, how: 'leave' });
}

// SHELL 2.0 B2 — MAKE HOST (the owner, Nov 4 7:54 pm): the host hands the room to another player — IN THE ROOM (never mid-match), only to a
// player who is ONLINE (the rules check it too: meta/hostId takes a live, online, unkicked player). meta/hostBy says who handed it over, so
// every phone says it once (host.js#watchHand): "MIKE is the host now" · "YOU’RE THE HOST NOW". → true | a reason (a string)
export async function makeHost(uid) {
  const code = state.code, P = state.players || {};
  if (!code || !state.meta || state.meta.hostId !== state.uid) return 'Only the host can do that.';
  if (state.meta.status === 'playing') return 'Not during a match — in the room.';
  if (!uid || uid === state.uid || !P[uid]) return 'They’re not in the room.';
  if (!isOnline(state.presence, uid)) return 'They’re offline — they need to be here.';
  try { await update(dbRef(`${R(code)}/meta`), { hostId: uid, hostBy: state.uid, hostBeat: serverTimestamp() }); return true; }
  catch (e) { return 'The room didn’t take it — try again.'; }
}

export async function kickPlayer(uid) {
  if (!state.code || uid === state.uid) return;
  await update(dbRef(R(state.code)), { [`kicked/${uid}`]: true, [`players/${uid}`]: null, [`presence/${uid}`]: null });
}

// LOCK THE DOOR (host): no new players with the hush word; everyone already in keeps their seat (the rules enforce it).
export async function setDoorLocked(on) {
  if (!state.code || !state.meta || state.meta.hostId !== state.uid) return;
  await update(dbRef(`${R(state.code)}/meta`), { locked: on ? true : null });
}

export async function updateMyProfile(profile) {
  if (!state.code) return;
  await writePlayer(state.code, profile, state.players);
}

// Best effort: the rules allow it for the host, or anyone once the room is idle (no game for ROOM_IDLE_MS).
async function deleteRoom(code) {
  try { await closeRoom(code, isSoloMeta(state.meta)); } catch { /* not allowed / offline: the session is dropped anyway */ }
}

// An hour without a game (host.js tick): close it for everyone, or at least leave it ourselves.
let closing = false;
export async function closeIdleRoom() {
  const code = state.code;
  if (!code || closing) return;
  closing = true;
  await deleteRoom(code);
  if (state.code === code) exitRoom('ROOM CLOSED — NO GAME FOR AN HOUR', 'info');
  closing = false;
}

// Deletes rooms idle for longer than ROOM_TTL_MS (and orphaned nodes without meta).
export async function cleanupStaleRooms() {
  const cutoff = serverNow() - ROOM_TTL_MS - 60_000;
  const snap = await get(query(dbRef('rooms'), orderByChild('meta/activeAt'), endAt(cutoff), limitToFirst(20)));
  const jobs = [];
  snap.forEach(child => { jobs.push(closeRoom(child.key).catch(() => {})); });
  await Promise.all(jobs);
}

// Used by the title screen to tell a player up front that an invite has expired.
export const roomExists = joining(async input => {
  const code = normalizeCode(input);
  if (!code) return false;
  try { return (await get(dbRef(`${R(code)}/meta/status`))).exists(); } catch { return true; } // unknown → let the join attempt decide
});
