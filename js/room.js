// Room lifecycle: create / join / resume / leave / kick, live mirroring and presence.
import {
  dbRef, get, set, update, remove, onValue, onDisconnect, serverTimestamp, serverNow,
  query, orderByChild, endAt, limitToFirst,
} from './firebase.js';
import { state, setState } from './store.js';
import { saveSession, loadSession, loadProfile, setUrlRoom, loadMe } from './identity.js';
import { generateCode, normalizeCode, pickColor, sanitizeName, sanitizeAvatar, nextHost, roomIdle } from './core/room-logic.js';
import { MAX_PLAYERS, ROOM_TTL_MS, NAME_MAX } from './config.js';
import { toast } from './ui/toast.js';
import { livePathsFor, liveKeyFor } from './games/registry.js';
import { watchRoomProfiles, stopRoomProfiles } from './profile/public.js';

const R = code => `rooms/${code}`;
let unsubs = [];
let liveUnsubs = [];
let liveWanted = null;
let seen = { meta: false, self: false };

const EMPTY_ROOM = { code: null, meta: null, players: {}, presence: {}, kicked: {}, game: null, night: {}, live: {}, liveKey: null };

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
  if (pid) {
    try { await set(dbRef(`${R(code)}/players/${state.uid}`), { ...node, pid }); return; } catch { /* without it */ }
  }
  await set(dbRef(`${R(code)}/players/${state.uid}`), node);
}

async function readRoomBasics(code) {
  const [meta, players, kicked] = await Promise.all(['meta', 'players', `kicked/${state.uid}`].map(k => get(dbRef(`${R(code)}/${k}`))));
  return { meta: meta.val(), players: players.val() || {}, kicked: !!kicked.val() };
}

export async function createRoom(profile) {
  cleanupStaleRooms().catch(() => {});
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const metaRef = dbRef(`${R(code)}/meta`);
    if ((await get(metaRef)).exists()) continue;
    try {
      await set(metaRef, { hostId: state.uid, status: 'lobby', createdAt: serverTimestamp(), activeAt: serverTimestamp(), hostBeat: serverTimestamp() });
    } catch { continue; } // lost a race for this code
    await remove(dbRef(`chats/${code}`)).catch(() => {}); // a fresh room starts with a fresh chat
    await remove(dbRef(`spy/${code}`)).catch(() => {}); // …and no old DOUBLE AGENT secrets
    await remove(dbRef(`fleets/${code}`)).catch(() => {}); // …or GRIDLOCK fleets
    await remove(dbRef(`glsonar/${code}`)).catch(() => {});
    await writePlayer(code, profile, {});
    enterRoom(code);
    return code;
  }
  throw new Error('NO FREE ROOM CODES — TRY AGAIN');
}

export async function joinRoom(input, profile) {
  const code = normalizeCode(input);
  if (!code) throw new Error('Room codes are 4 letters (no I or O).');
  const room = await readRoomBasics(code);
  if (room.meta && roomIdle(room.meta, serverNow())) { await deleteRoom(code); room.meta = null; }
  if (!room.meta) throw new Error(`No room ${code} found. Check the code, or ask the host for a new invite (rooms close after an hour without a game).`);
  if (room.kicked) throw new Error('The host removed you from this room.');
  const others = Object.keys(room.players).filter(u => u !== state.uid).length;
  if (!room.players[state.uid] && others >= MAX_PLAYERS) throw new Error(`Room ${code} is full (${MAX_PLAYERS}/${MAX_PLAYERS} players).`);
  if (!room.players[state.uid] && room.meta.status === 'playing') toast('GAME IN PROGRESS — YOU’LL WATCH, THEN JOIN THE NEXT ONE', 'info', 4500);
  await writePlayer(code, profile, room.players);
  enterRoom(code);
  return code;
}

// Called on boot: puts a refreshed/returning player straight back into their room.
// Returns 'ok', 'none' (no saved room), 'gone' (closed / removed / full — forgotten) or
// 'error' (couldn't reach the room right now — the session is kept so a retry works).
export async function resumeSession() {
  const session = loadSession();
  const profile = loadProfile();
  if (!session || !session.code) return 'none';
  let room;
  try { room = await readRoomBasics(session.code); } catch { return 'error'; }
  // Back the next day: the room sat for an hour without a game — close it and start fresh on the title.
  if (room.meta && roomIdle(room.meta, serverNow())) { await deleteRoom(session.code); saveSession(null); setUrlRoom(null); return 'idle'; }
  const gone = !room.meta || room.kicked
    || (!room.players[state.uid] && (!profile || Object.keys(room.players).length >= MAX_PLAYERS));
  if (gone) { saveSession(null); return 'gone'; }
  try {
    // Seat was lost (e.g. left on another device) — rejoin with the saved profile.
    if (!room.players[state.uid]) await writePlayer(session.code, profile, room.players);
    enterRoom(session.code);
    return 'ok';
  } catch {
    return 'error';
  }
}

function enterRoom(code) {
  stopListening();
  saveSession(code);
  setUrlRoom(code);
  seen = { meta: false, self: false };
  setState({ ...EMPTY_ROOM, code, view: 'room' });
  const base = R(code);
  const listen = (path, fn) => unsubs.push(onValue(dbRef(`${base}/${path}`), s => fn(s.val()), err => console.warn(path, err)));

  listen('meta', meta => {
    if (!meta) { if (seen.meta) exitRoom(roomIdle(state.meta, serverNow()) ? 'ROOM CLOSED — NO GAME FOR AN HOUR' : 'ROOM CLOSED'); return; }
    seen.meta = true;
    setState({ meta });
  });
  listen('players', players => {
    players = players || {};
    if (players[state.uid]) seen.self = true;
    else if (seen.self) { exitRoom('YOU WERE DISCONNECTED FROM THE ROOM'); return; }
    setState({ players });
    watchRoomProfiles(players);
  });
  listen('presence', presence => setState({ presence: presence || {} }));
  listen('night', night => setState({ night: night || {} }));
  listen('kicked', kicked => {
    kicked = kicked || {};
    if (kicked[state.uid]) { exitRoom('THE HOST REMOVED YOU FROM THE ROOM', 'err'); return; }
    setState({ kicked });
  });
  listen('game', game => {
    setState({ game });
    watchLive(code, game);
  });
  armPresence();
}

// Subscribes to the player-written paths the active game needs right now
// (e.g. this round's boards). liveKey is only set once every path has loaded,
// so the director never decides on half-synced data.
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
    liveUnsubs.push(onValue(dbRef(`${R(code)}/${path}`), s => {
      if (state.code !== code || liveWanted !== key) return;
      live[name] = s.val() || {};
      loaded.add(name);
      setState({ live: { ...live }, liveKey: loaded.size === Object.keys(paths).length ? key : null });
    }));
  }
}

// (Re)registers presence; called on room entry and on every reconnect.
export async function armPresence() {
  if (!state.code || !state.connected || !state.uid) return;
  const pRef = dbRef(`${R(state.code)}/presence/${state.uid}`);
  try {
    await onDisconnect(pRef).set({ online: false, lastSeen: serverTimestamp() });
    await set(pRef, { online: true, lastSeen: serverTimestamp() });
  } catch (e) { console.warn('presence', e); }
}

function stopListening() {
  stopRoomProfiles();
  unsubs.forEach(u => u());
  unsubs = [];
  liveUnsubs.forEach(u => u());
  liveUnsubs = [];
  liveWanted = null;
}

export function exitRoom(reason, kind = 'warn') {
  const code = state.code;
  stopListening();
  if (code && state.uid) onDisconnect(dbRef(`${R(code)}/presence/${state.uid}`)).cancel().catch(() => {});
  saveSession(null);
  setUrlRoom(null);
  setState({ ...EMPTY_ROOM, view: 'title' });
  if (reason) toast(reason, kind, 3500);
}

export async function leaveRoom() {
  const code = state.code;
  if (!code) return;
  const uid = state.uid;
  try {
    const others = Object.keys(state.players).filter(u => u !== uid);
    if (state.meta && state.meta.hostId === uid) {
      if (others.length) {
        const heir = nextHost({ players: state.players, presence: state.presence, exclude: uid });
        await update(dbRef(`${R(code)}/meta`), { hostId: heir, hostBeat: serverTimestamp() });
      } else {
        await remove(dbRef(R(code))); // last one out turns off the lights
        await remove(dbRef(`chats/${code}`)).catch(() => {});
        await remove(dbRef(`spy/${code}`)).catch(() => {});
        await remove(dbRef(`fleets/${code}`)).catch(() => {});
        await remove(dbRef(`glsonar/${code}`)).catch(() => {});
        exitRoom();
        return;
      }
    }
    await onDisconnect(dbRef(`${R(code)}/presence/${uid}`)).cancel();
    await update(dbRef(R(code)), { [`presence/${uid}`]: null, [`players/${uid}`]: null });
  } catch (e) { console.warn('leave', e); }
  exitRoom();
}

export async function kickPlayer(uid) {
  if (!state.code || uid === state.uid) return;
  await update(dbRef(R(state.code)), { [`kicked/${uid}`]: true, [`players/${uid}`]: null, [`presence/${uid}`]: null });
}

export async function updateMyProfile(profile) {
  if (!state.code) return;
  await writePlayer(state.code, profile, state.players);
}

// Best effort: the rules allow it for the host, or anyone once the room is idle (no game for ROOM_IDLE_MS).
async function deleteRoom(code) {
  try { await remove(dbRef(R(code))); await remove(dbRef(`chats/${code}`)); await remove(dbRef(`spy/${code}`)); await remove(dbRef(`fleets/${code}`)); await remove(dbRef(`glsonar/${code}`)); } catch { /* not allowed / offline: the session is dropped anyway */ }
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
  snap.forEach(child => { jobs.push(remove(child.ref).then(() => remove(dbRef(`chats/${child.key}`))).then(() => remove(dbRef(`spy/${child.key}`))).then(() => remove(dbRef(`fleets/${child.key}`))).then(() => remove(dbRef(`glsonar/${child.key}`))).catch(() => {})); });
  await Promise.all(jobs);
}

// Used by the title screen to tell a player up front that an invite has expired.
export async function roomExists(input) {
  const code = normalizeCode(input);
  if (!code) return false;
  try { return (await get(dbRef(`${R(code)}/meta/status`))).exists(); } catch { return true; } // unknown → let the join attempt decide
}
