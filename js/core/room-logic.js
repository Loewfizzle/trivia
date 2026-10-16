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

// Normalizes user input; returns null unless it is a well-formed code.
export function normalizeCode(input) {
  const s = String(input || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (s.length !== CODE_LENGTH) return null;
  for (const ch of s) if (!CODE_ALPHABET.includes(ch)) return null;
  return s;
}

export function isOnline(presence, uid) {
  return !!(presence && presence[uid] && presence[uid].online === true);
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
  let gone = 0;
  if (!p) gone = now - (players[hostId].joinedAt || 0);
  else if (p.online === false) gone = now - (p.lastSeen || 0);
  if (meta.status === 'playing' && typeof meta.hostBeat === 'number') gone = Math.max(gone, now - meta.hostBeat);
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
