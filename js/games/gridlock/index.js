// GRIDLOCK module entry (see games/registry.js for the contract).
//
// Fleets are private. Each lives OUTSIDE rooms/{code} (which any signed-in user can read), at
//   fleets/{code}/{matchId}/{uid}: { s: "r,c,len,d;…", at }   read: that player + the current host; write: the player
//   (during placement, or until they have one), or the host when none exists (auto-place for a phone that never placed).
// Shots are resolved by the TARGET's own client against its fleet; if that phone is gone / slow for ~4 s the host
// resolves from its copy (prepare() below). Nothing anyone else can read ever holds an unhit ship.
import { createGame, nextStep, nightBonus as bonus } from './director.js';
import {
  DEFAULT_SETTINGS, MIN_PLAYERS, PLACE_OPTIONS, TURN_OPTIONS, standings, estimateMinutes as estimate, cleanSettings,
  decodeFleet, encodeFleet, randomLayout, resolveVolley, boardOf, aliveOf,
} from './logic.js';
import { dbRef, get, set, remove, serverTimestamp, serverNow } from '../../firebase.js';
import { state, onlineMap } from '../../store.js';
import { rngFrom } from '../../core/rng.js';
import { lazyView } from '../lazy-view.js';

export const createView = lazyView(() => import('./view.js'));
export const MUSIC = 'gridlock';   // a seeded playlist of spy1-3 + last-signal (audio/music.js#setPlaylist, set by the view)
export { DEFAULT_SETTINGS, MIN_PLAYERS };

export const livePaths = g => ({
  shots: `glshot/${g.matchId}/${g.rk}`,
  res: `glres/${g.matchId}/${g.rk}`,
  ready: `glready/${g.matchId}`,
  calls: `glcall/${g.matchId}`,
});

export async function start({ code, matchId, settings, participants, now }) {
  await remove(dbRef(`fleets/${code}`)).catch(() => {});   // no fleets from an earlier match
  const names = Object.fromEntries(Object.keys(participants).map(u => [u, String((state.players[u] && state.players[u].name) || '').slice(0, 16)]));
  return createGame({ matchId, settings: cleanSettings(settings), participants, names, now });
}

// ---------------------------------------------------------------- host duties
const fleets = {};            // matchId -> { uid: ships }   (this client, while host)
let loading = null;
const resolvedBy = new Set(); // `${m}|${rk}|${target}` written by this host
const FALLBACK_MS = 4000;

export const fleetFor = (matchId, uid) => (fleets[matchId] && fleets[matchId][uid]) || null;   // tests / the view (host)

function loadFleets(code, game) {
  if (loading) return;
  const cache = (fleets[game.matchId] ||= {});
  loading = get(dbRef(`fleets/${code}/${game.matchId}`)).then(snap => {
    const v = snap.val() || {};
    for (const [uid, node] of Object.entries(v)) { const ships = decodeFleet(node && node.s); if (ships) cache[uid] = ships; }
    // phones that never placed (offline through placement) get a fleet from the host
    const writes = [];
    for (const uid of Object.keys(game.participants)) {
      if (cache[uid]) continue;
      const ships = randomLayout(game.size, game.fleet, rngFrom(`${game.matchId}:${uid}:auto`));
      cache[uid] = ships;
      writes.push(set(dbRef(`fleets/${code}/${game.matchId}/${uid}`), { s: encodeFleet(ships), at: serverTimestamp() }).catch(() => { delete cache[uid]; }));
    }
    return Promise.all(writes);
  }).catch(e => console.warn('gridlock fleets', e && e.message)).finally(() => { loading = null; });
}

export function prepare(game, { code, host }) {
  if (!host || !game || game.phase === 'place' || game.phase === 'final') return;
  const cache = fleets[game.matchId] || {};
  if (Object.keys(game.participants).some(u => !cache[u])) loadFleets(code, game);
  if (game.phase !== 'resolve' || !game.fire) return;
  const now = serverNow();
  const res = (state.live && state.live.res) || {};
  const online = onlineMap();
  const targets = [...new Set(Object.values(game.fire).flat().map(s => s.t))];
  for (const t of targets) {
    if (res[t]) continue;
    const key = `${game.matchId}|${game.rk}|${t}`;
    if (resolvedBy.has(key)) continue;
    if (online[t] && now - game.phaseStartAt < FALLBACK_MS) continue;   // the owner's phone is on it
    const ships = cache[t];
    if (!ships) continue;
    resolvedBy.add(key);
    const shots = {};
    for (const [by, list] of Object.entries(game.fire)) { const mine = list.filter(s => s.t === t); if (mine.length) shots[by] = mine; }
    const r = resolveVolley(ships, boardOf(game, t), shots);
    set(dbRef(`rooms/${code}/glres/${game.matchId}/${game.rk}/${t}`), { ...r, by: 'host', at: serverTimestamp() })
      .catch(() => { /* the owner got there first: fine */ });
  }
}

export const step = (game, { code, now, live, online }) => nextStep(game, { code, now, online, live });

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
export const nightBonus = bonus;

export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'list', choices: [
    { value: 'classic', label: 'CLASSIC', sub: 'Turns, one shot each · best with 2–4' },
    { value: 'royale', label: 'BATTLE ROYALE', sub: 'Everyone fires at once · best with 4–8' },
  ] },
  { key: 'placeSec', label: 'PLACEMENT', choices: PLACE_OPTIONS.map(n => ({ value: n, label: `${n}s` })) },
  { key: 'turnSec', label: 'TURN / AIM TIMER', choices: TURN_OPTIONS.map(n => ({ value: n, label: `${n}s` })) },
];

export const estimateMinutes = s => estimate(s, Math.max(2, Object.keys(state.players || {}).length));
export { aliveOf };
