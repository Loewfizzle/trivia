// Pure room logic (no Firebase, no DOM) so it can be unit-tested in Node.
import { CODE_ALPHABET, CODE_LENGTH, HOST_TIMEOUT_MS, HOST_CANDIDATE_STAGGER_MS, COLORS, AVATAR_IDS, ROOM_IDLE_MS } from '../config.js';

/** ms until the room closes for being idle (≤ 0 = it should close). Infinity when unknown (never close on missing data). */
export function idleLeft(meta, now) {
  if (!meta || typeof meta.activeAt !== 'number') return Infinity;
  return ROOM_IDLE_MS - (now - meta.activeAt);
}
export const roomIdle = (meta, now) => idleLeft(meta, now) <= 0;

// THE FIX PASS — S2: a room's side nodes (the close + the server's sweep, api/_lib/room-sweep.js) + the sweep's pure plan
export const ROOM_SIDE_NODES = ['chats', 'spy', 'fleets', 'glsonar', 'hsbet', 'rrp', 'rrsec', 'seal'];
/** PURE: stale rooms (activeAt past ttl + 60 s, or no meta) → { codes, patch } */
export function roomSweepPatch(rooms, now, ttl = ROOM_IDLE_MS) {
  const cutoff = now - ttl - 60_000, patch = {}, codes = [];
  for (const [code, room] of Object.entries(rooms || {})) {
    const meta = room && room.meta;
    if (meta && !(typeof meta.activeAt === 'number' && meta.activeAt <= cutoff)) continue;   // (live, or no stamp)
    codes.push(code);
    patch[`rooms/${code}`] = null;
    for (const n of ROOM_SIDE_NODES) patch[`${n}/${code}`] = null;
    if (meta && /^[A-Z]{4}$/.test(code) && !isSoloMeta(meta)) patch[`hush/${code}`] = { closedAt: now };
  }
  return { codes, patch };
}

export function generateCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < CODE_LENGTH; i++) s += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return s;
}

// PLAY NOW — THE SOLO ROOM (docs/cartridge.md "PLAY NOW"): a PRIVATE one-seat room behind the GAME CARD's PLAY NOW — LOCKED, flagged
// meta.settings.solo.on (the rules take any settings key; `meta` itself refuses a new one — no rules change), its code 4 random letters that
// are NOT a hush word: never shown anywhere, never resting a word of the pool (its close writes no hush/ entry).
/** is this room a SOLO room (PLAY NOW)? */
export const isSoloMeta = meta => !!(meta && meta.settings && meta.settings.solo && meta.settings.solo.on === true);
/** a solo room's code: 4 random letters, never one of the hush words (the pool stays untouched) */
export function soloCode(hushWords = [], rand = Math.random) {
  const hw = new Set((Array.isArray(hushWords) ? hushWords : []).map(w => String(w).toUpperCase()));
  for (let i = 0; i < 64; i++) { const c = generateCode(rand); if (!hw.has(c)) return c; }
  return generateCode(rand);
}
/** PURE: THE GAME CARD's buttons → { main: { id, label, sub?, mode? } | null, more: [the other solo runs], second: { id, label } | null, note } —
 *  id: 'solo' (a solo run, one tap) · 'friends' (PLAY WITH FRIENDS = HOST with the game picked) · 'pick' (PICK THIS GAME — the host, in a room).
 *  In a room: the host picks, a guest is told who does; a SOLO game: PLAY NOW is the pink MAIN, PLAY WITH FRIENDS the second; no SOLO: PLAY WITH
 *  FRIENDS is the MAIN + one line. PD-6 — TWO SOLO BUTTONS (general): `runs` = the cartridge's SOLO_RUNS list ([{ mode, label, sub }]) → ONE
 *  action per entry — the FIRST first (`main`), the rest in `more`, each carrying its mode — THE DROP B: `equal` = all of them the SAME plain tube
 *  (no pink on that card); no list → the single PLAY NOW (the pink MAIN) */
export function cardActions({ solo = false, runs = null, inRoom = false, host = false } = {}) {
  if (inRoom) return host ? { main: { id: 'pick', label: 'PICK THIS GAME' }, more: [], second: null, note: null } : { main: null, more: [], second: null, note: 'The host picks the game' };
  const list = solo && Array.isArray(runs) ? runs.filter(r => r && typeof r.mode === 'string' && typeof r.label === 'string') : [];
  const run = r => ({ id: 'solo', label: r.label, sub: typeof r.sub === 'string' ? r.sub : null, mode: r.mode });
  // (THE DROP B add-on — Ben, Nov 13 10:17 pm: one pink + two white read as "one is pre-selected" → `equal`: every button on this card the SAME
  //  plain white tube, no MAIN; the order + labels + sub lines unchanged. A game with no list keeps its single pink PLAY NOW)
  if (list.length) return { main: run(list[0]), more: list.slice(1).map(run), second: { id: 'friends', label: 'PLAY WITH FRIENDS' }, note: null, equal: true };
  if (solo) return { main: { id: 'solo', label: 'PLAY NOW' }, more: [], second: { id: 'friends', label: 'PLAY WITH FRIENDS' }, note: null };
  return { main: { id: 'friends', label: 'PLAY WITH FRIENDS' }, more: [], second: null, note: 'Needs 2+ players' };
}
/** PURE: a game's players line on the shelf + the card — 'SOLO · 2–8' or '2–8' */
export const playersLine = (solo, min, max) => `${solo ? 'SOLO · ' : ''}${Math.max(2, Number(min) || 2)}–${max}`;
/** PURE: the settings a one-player room plays with — the cartridge's own defaults (cleanSettings for one player: PRISM DROP → SCORE RUSH;
 *  OVERCLOCK → QUICK), with `want` over them (PD-6: a SOLO_RUNS button's { mode }) — always through cleanSettings(…, 1), so a run never starts in
 *  a mode one player can't play */
export function soloSettings(meta, want = null) {
  const d = { ...((meta && meta.DEFAULT_SETTINGS) || {}), ...(want && typeof want === 'object' ? want : {}) };
  try { return meta && typeof meta.cleanSettings === 'function' ? meta.cleanSettings({ ...d }, 1) : { ...d }; } catch { return { ...d }; }
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
  // (FIXES R2 — THE REVIEW F5: NOT only "the old shape" — this is the LIVE path too: normalizePresence's output { online, lastSeen } (no c, no v)
  //  reads its flag HERE, so isOnline(state.presence, uid) — host election, the start's participants — rides this line. Never "clean it up")
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

// Who should inherit host when the host leaves voluntarily — ONLY a player ONLINE NOW (a live connection): the rules take a hand-off only to a live,
// online player (MAKE HOST's rule), so an offline heir is no heir (THE ERRORS GROUP's add-on, Nov 12 night: the old fallback to the first player
// wrote a hand-off the rules had to refuse — a false RULES REFUSED). null → no hand-off: the others claim the empty seat the usual way.
export function nextHost({ players, presence, exclude }) {
  const order = playerOrder(players).filter(uid => uid !== exclude);
  return order.find(uid => isOnline(presence, uid)) || null;
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

/**
 * FR7 FIXES A (FR7-A B2) — THE INITIATE GUARD (PURE): a host who QUIT TO THE ROOM (a PRISM KO, a HOLD'EM bust) could INITIATE a new game over the
 * match everyone else was still playing — they were pulled out and it had no result. A start is refused while the room's game runs and isn't
 * at its podium ('final' — a REMATCH from the podium still starts). → true = refuse
 */
export const gameRunning = (meta, game) => !!(meta && meta.status === 'playing' && game && game.phase && game.phase !== 'final');
export const GAME_ON_LINE = 'A GAME IS STILL ON — WAIT FOR ITS END';
/**
 * FR7 FIXES B — A RE-START KEEPS THE LAST MATCH's PROOF (the owner, Grok's honest-player review): a queued report can land after a REMATCH
 * started, so a new start clears the proof nodes (games/registry.js#PROOF_NODE_LIST) of every match EXCEPT the ones in `keep` (the previous
 * match + the new one). PURE: trees = { node: { matchId: … } } → { 'node/matchId': null } for each stale match.
 */
export function staleProofPaths(trees, keep = [], lock = null) {
  const k = new Set(keep.filter(Boolean)), out = {}, L = lock && new Set(lock.nodes || []), RL = lock && new Set(lock.reportNodes || []);
  for (const [node, t] of Object.entries(trees || {})) if (t && typeof t === 'object') for (const m of Object.keys(t)) {
    if (k.has(m) || (L && L.has(node) && !proofUnlocked(t[m], lock.uid, lock.now))) continue;   // (THE LIVE LOCK: the rules would refuse it — and one refused path takes the whole prune down)
    if (RL && RL.has(node) && reportLocked(lock.night && lock.night[m], lock.now)) continue;
    out[`${node}/${m}`] = null;
  }
  return out;
}
/**
 * HIGH RISE S4B — THE LIVE LOCK (database.rules.json `jw/{match}` + `hr/{match}` — the gap both games shared): the host may delete ONE
 * match's proof tree only when HIS OWN `go` in it is older than PROOF_LOCK_MS — whatever `game` says. (The rule used to look at
 * game/phase alone: a host on a modified client flipped the phase, deleted the live tree and wrote a new GO.) A GO is the server's
 * time, written once, by its player: nothing the host writes moves it. A tree with no GO of the host's is never his to delete — it goes
 * with the room. PURE: `lock` = { nodes: the locked proof nodes, uid: the host, now: the server's time } → only what the rules allow.
 */
export const PROOF_LOCK_MS = 600_000;
/** THE REPORT LOCK (BEFORE-LAUNCH — the rules' prism / oc / ocm {match}): a host-graded match's boards stay PROOF_LOCK_MS after its night record (docs/match-kit.md) */
export const REPORT_LOCK_NODES = Object.freeze(['prism', 'oc', 'ocm']);
export const reportLocked = (night, now) => !!night && typeof night.at === 'number' && night.at > now - PROOF_LOCK_MS - PROOF_LOCK_SLACK_MS;
/** the phone's estimate of the server's clock is never trusted to the second */
export const PROOF_LOCK_SLACK_MS = 30_000;
/** THE PROOF PASS (Nov 20 — the review's MUST 2 b, THE PRE-DATED GO: the host wrote his GO under a FUTURE match id, waited 10 min, started
 *  that match and deleted its live tree): a tree that carries THE STAMP (`t0` — core/proof.js: the server's time of its first write; every
 *  GO in it is within 5 s of it) unlocks by ITS STAMP's age, whoever the host is; a tree without one (before the re-publish, an old
 *  phone's) by the host's own GO, as before. The rules say the same (database.rules.json `jw/$match` · `hr/$match`). */
export const proofUnlocked = (tree, uid, now) => {
  const t0 = tree && typeof tree.t0 === 'number' ? tree.t0 : 0, go = t0 > 0 ? t0 : Number(tree && tree[uid] && tree[uid].go);
  return go > 0 && go < now - PROOF_LOCK_MS - PROOF_LOCK_SLACK_MS;
};
