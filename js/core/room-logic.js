// Pure room logic (no Firebase, no DOM) so it can be unit-tested in Node.
import { CODE_ALPHABET, CODE_LENGTH, HOST_TIMEOUT_MS, HOST_CANDIDATE_STAGGER_MS, COLORS, AVATAR_IDS, ROOM_IDLE_MS } from '../config.js';

/** ms until the room closes for being idle (≤ 0 = it should close). Infinity when unknown (never close on missing data). */
export function idleLeft(meta, now) {
  if (!meta || typeof meta.activeAt !== 'number') return Infinity;
  return ROOM_IDLE_MS - (now - meta.activeAt);
}
export const roomIdle = (meta, now) => idleLeft(meta, now) <= 0;

export function generateCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < CODE_LENGTH; i++) s += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return s;
}

// Normalizes user input; returns null unless it is 4 letters. Any A–Z: hush words use every letter (I and O too), and the
// old random codes (no I / O) are A–Z as well, so rooms made before HUSH WORDS still join.
export function normalizeCode(input) {
  const s = String(input || '').toUpperCase().replace(/[^A-Z]/g, '');
  return s.length === CODE_LENGTH ? s : null;
}

// PRESENCE — ONE CHILD PER CONNECTION (APP FIXES, Grok 5.1): presence/{uid} = { online, lastSeen, c: { connId: ts } }. Each
// connection adds its own c/{connId} with onDisconnect().remove(), so an OLD socket's late onDisconnect (a refresh, a radio
// handoff) only removes ITS child — the player stays online while any connection is left. `online` is still written for
// older clients; a node marked v 2 (written by this code) is online ONLY through c, a node without it (the old shape) reads its flag.
export function presenceOnline(p) {
  if (!p || typeof p !== 'object') return false;
  if (p.c && typeof p.c === 'object') return Object.keys(p.c).length > 0;
  if (p.v === 2) return false;   // the new shape with no connection left
  return p.online === true;
}
/** the raw presence node → { uid: { online, lastSeen } } (what every screen + director reads; store.state.presence) */
export function normalizePresence(raw) {
  const out = {};
  for (const [uid, p] of Object.entries(raw || {})) out[uid] = { online: presenceOnline(p), lastSeen: (p && p.lastSeen) || 0 };
  return out;
}

export function isOnline(presence, uid) {
  return presenceOnline(presence && presence[uid]);
}

// Players sorted by join order (ties broken by uid so every client agrees).
export function playerOrder(players) {
  return Object.entries(players || {})
    .sort(([a, pa], [b, pb]) => (pa.joinedAt || 0) - (pb.joinedAt || 0) || (a < b ? -1 : a > b ? 1 : 0))
    .map(([uid]) => uid);
}

// How long (ms) the current host has been unreachable; 0 if they look fine.
// During a game we also use the host heartbeat, because a locked phone can keep
// its socket "online" for a long time while its JavaScript is frozen.
export function hostGoneFor({ meta, players, presence, now }) {
  const hostId = meta && meta.hostId;
  if (!hostId || !players || !players[hostId]) return Infinity;
  const p = presence && presence[hostId];
  // While a game runs the HEARTBEAT is the truth (APP FIXES, Grok 4.4): a fresh beat BLOCKS a claim even when presence says
  // offline (an old socket's late onDisconnect), and a stale one deposes a host whose socket looks online (a frozen phone).
  // The rules (meta/hostId) apply the same test.
  if (meta.status === 'playing' && typeof meta.hostBeat === 'number') return Math.max(0, now - meta.hostBeat);
  let gone = 0;
  if (!p) gone = now - (players[hostId].joinedAt || 0);
  else if (!presenceOnline(p)) gone = now - (p.lastSeen || 0);
  return Math.max(0, gone);
}

// Returns true if `me` should try to claim host right now.
// Candidates are online non-host players in join order; candidate k waits
// HOST_TIMEOUT_MS + k * stagger so a stuck first candidate doesn't block forever.
export function shouldClaimHost({ meta, players, presence, now, me }) {
  if (!meta || !players || !players[me] || meta.hostId === me) return false;
  const gone = hostGoneFor({ meta, players, presence, now });
  if (gone < HOST_TIMEOUT_MS) return false;
  const candidates = playerOrder(players).filter(uid => uid !== meta.hostId && isOnline(presence, uid));
  const rank = candidates.indexOf(me);
  if (rank < 0) return false;
  if (gone === Infinity) return true; // host left for good: anyone online may claim (a transaction picks one)
  return gone >= HOST_TIMEOUT_MS + rank * HOST_CANDIDATE_STAGGER_MS;
}

// Who should inherit host when the host leaves voluntarily.
export function nextHost({ players, presence, exclude }) {
  const order = playerOrder(players).filter(uid => uid !== exclude);
  return order.find(uid => isOnline(presence, uid)) || order[0] || null;
}

// Pick a free color (prefer the requested one).
export function pickColor(requested, players, me) {
  const taken = new Set(Object.entries(players || {}).filter(([uid]) => uid !== me).map(([, p]) => p.color));
  if (requested && !taken.has(requested)) return requested;
  const free = COLORS.find(c => !taken.has(c.id));
  return free ? free.id : requested || COLORS[0].id;
}

export function sanitizeName(name, max = 12) {
  return String(name || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function sanitizeAvatar(id) {
  return AVATAR_IDS.includes(id) ? id : AVATAR_IDS[0];
}
