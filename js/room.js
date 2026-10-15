// Room lifecycle: create / join / resume / leave / kick, live mirroring and presence.
import {
  dbRef, get, set, update, remove, onValue, onDisconnect, serverTimestamp, serverNow,
  query, orderByChild, endAt, limitToFirst,
} from './firebase.js';
import { state, setState } from './store.js';
import { saveSession, loadSession, loadProfile, setUrlRoom } from './identity.js';
import { generateCode, normalizeCode, pickColor, sanitizeName, sanitizeAvatar, nextHost } from './core/room-logic.js';
import { MAX_PLAYERS, ROOM_TTL_MS, NAME_MAX } from './config.js';
import { toast } from './ui/toast.js';

const R = code => `rooms/${code}`;
let unsubs = [];
let boardsUnsub = null;
let seen = { meta: false, self: false };

const EMPTY_ROOM = { code: null, meta: null, players: {}, presence: {}, kicked: {}, game: null, boards: {}, boardsKey: null };

function cleanProfile(profile) {
  return { name: sanitizeName(profile.name, NAME_MAX) || 'ANON', color: profile.color, avatar: sanitizeAvatar(profile.avatar) };
}

async function writePlayer(code, profile, players) {
  const p = cleanProfile(profile);
  const existing = players && players[state.uid];
  await set(dbRef(`${R(code)}/players/${state.uid}`), {
    name: p.name,
    color: pickColor(p.color, players, state.uid),
    avatar: p.avatar,
    joinedAt: existing && existing.joinedAt ? existing.joinedAt : serverTimestamp(),
  });
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
    await writePlayer(code, profile, {});
    enterRoom(code);
    return code;
  }
  throw new Error('NO FREE ROOM CODES — TRY AGAIN');
}

export async function joinRoom(input, profile) {
  const code = normalizeCode(input);
  if (!code) throw new Error('ROOM CODES ARE 4 LETTERS');
  const room = await readRoomBasics(code);
  if (!room.meta) throw new Error(`ROOM ${code} NOT FOUND`);
  if (room.kicked) throw new Error('THE HOST REMOVED YOU FROM THIS ROOM');
  const others = Object.keys(room.players).filter(u => u !== state.uid).length;
  if (!room.players[state.uid] && others >= MAX_PLAYERS) throw new Error('ROOM IS FULL (8/8)');
  await writePlayer(code, profile, room.players);
  enterRoom(code);
  return code;
}

// Called on boot: puts a refreshed/returning player straight back into their room.
export async function resumeSession() {
  const session = loadSession();
  const profile = loadProfile();
  if (!session || !session.code) return false;
  try {
    const room = await readRoomBasics(session.code);
    if (!room.meta || room.kicked) throw new Error('gone');
    if (!room.players[state.uid]) {
      // Seat was lost (e.g. left on another device) — rejoin with the saved profile.
      if (!profile || Object.keys(room.players).length >= MAX_PLAYERS) throw new Error('cannot rejoin');
      await writePlayer(session.code, profile, room.players);
    }
    enterRoom(session.code);
    return true;
  } catch {
    saveSession(null);
    return false;
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
    if (!meta) { if (seen.meta) exitRoom('ROOM CLOSED'); return; }
    seen.meta = true;
    setState({ meta });
  });
  listen('players', players => {
    players = players || {};
    if (players[state.uid]) seen.self = true;
    else if (seen.self) { exitRoom('YOU WERE DISCONNECTED FROM THE ROOM'); return; }
    setState({ players });
  });
  listen('presence', presence => setState({ presence: presence || {} }));
  listen('kicked', kicked => {
    kicked = kicked || {};
    if (kicked[state.uid]) { exitRoom('THE HOST REMOVED YOU FROM THE ROOM', 'err'); return; }
    setState({ kicked });
  });
  listen('game', game => {
    setState({ game });
    watchBoards(code, game);
  });
  armPresence();
}

function watchBoards(code, game) {
  const key = game && game.matchId != null ? `${game.matchId}/${game.round}` : null;
  if (key === state.boardsKey && boardsUnsub) return;
  if (boardsUnsub) { boardsUnsub(); boardsUnsub = null; }
  setState({ boards: {}, boardsKey: null });
  if (!key) return;
  boardsUnsub = onValue(dbRef(`${R(code)}/boards/${key}`), s => {
    if (state.code === code) setState({ boards: s.val() || {}, boardsKey: key });
  });
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
  unsubs.forEach(u => u());
  unsubs = [];
  if (boardsUnsub) { boardsUnsub(); boardsUnsub = null; }
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

// Deletes rooms idle for longer than ROOM_TTL_MS (and orphaned nodes without meta).
export async function cleanupStaleRooms() {
  const cutoff = serverNow() - ROOM_TTL_MS - 60_000;
  const snap = await get(query(dbRef('rooms'), orderByChild('meta/activeAt'), endAt(cutoff), limitToFirst(20)));
  const jobs = [];
  snap.forEach(child => { jobs.push(remove(child.ref).catch(() => {})); });
  await Promise.all(jobs);
}
