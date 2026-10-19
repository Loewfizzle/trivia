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
  decodeFleet, encodeFleet, randomLayout, resolveVolley, boardOf, aliveOf, MODE_INFO,
} from './logic.js';
import { sonarCount } from './abilities.js';
import { dbRef, get, set, remove, serverTimestamp, serverNow } from '../../firebase.js';
import { state, onlineMap } from '../../store.js';
import { rngFrom } from '../../core/rng.js';
import { lazyView, gameSheets } from '../lazy-view.js';

export const createView = lazyView(() => import('./view.js'), gameSheets('gridlock'));
export const MUSIC = 'gridlock';   // a seeded playlist of spy1-3 + last-signal (audio/music.js#setPlaylist, set by the view)
export { DEFAULT_SETTINGS, MIN_PLAYERS };

export const livePaths = g => ({
  shots: `glshot/${g.matchId}/${g.rk}`,
  res: `glres/${g.matchId}/${g.rk}`,
  ready: `glready/${g.matchId}`,
  calls: `glcall/${g.matchId}`,
});

export async function start({ code, matchId, settings, participants, now }) {
  await remove(dbRef(`fleets/${code}`)).catch(() => {});   // no fleets (or sonar answers) from an earlier match
  await remove(dbRef(`glsonar/${code}`)).catch(() => {});
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
  const acts = game.acts || {};
  const shieldOf = t => (acts[t] && acts[t].a === 'shield' ? { r: acts[t].r, c: acts[t].c } : null);
  for (const t of targets) {
    if (res[t]) continue;
    const key = `${game.matchId}|${game.rk}|${t}`;
    if (resolvedBy.has(key)) continue;
    if (online[t] && now - game.phaseStartAt < FALLBACK_MS) continue;   // the owner's phone is on it
    if (!cache[t]) continue;
    resolvedBy.add(key);
    const shots = {};
    for (const [by, list] of Object.entries(game.fire)) { const mine = list.filter(s => s.t === t); if (mine.length) shots[by] = mine; }
    // a fresh read: a RELOCATE may have moved this fleet since the cache was filled
    get(dbRef(`fleets/${code}/${game.matchId}/${t}`)).then(snap => {
      const ships = decodeFleet(snap.val() && snap.val().s) || cache[t];
      cache[t] = ships;
      const r = resolveVolley(ships, boardOf(game, t), shots, shieldOf(t), game.size);
      return set(dbRef(`rooms/${code}/glres/${game.matchId}/${game.rk}/${t}`), { ...r, by: 'host', at: serverTimestamp() });
    }).catch(() => { /* the owner got there first: fine */ });
  }
  // sonar answers for absent owners (private to the shooter: glsonar/{code}/{m}/{shooter}/{rk})
  for (const [by, a] of Object.entries(acts)) {
    if (a.a !== 'sonar') continue;
    const key = `${game.matchId}|${game.rk}|sonar|${by}`;
    if (resolvedBy.has(key)) continue;
    if (online[a.t] && now - game.phaseStartAt < FALLBACK_MS) continue;
    if (!cache[a.t]) continue;
    resolvedBy.add(key);
    get(dbRef(`fleets/${code}/${game.matchId}/${a.t}`)).then(snap => {
      const ships = decodeFleet(snap.val() && snap.val().s) || cache[a.t];
      return set(dbRef(`glsonar/${code}/${game.matchId}/${by}/${game.rk}`), { n: sonarCount(ships, a.r, a.c, game.size), at: serverTimestamp() });
    }).catch(() => { /* the owner answered */ });
  }
}

export const step = (game, { code, now, live, online }) => nextStep(game, { code, now, online, live });

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
export const nightBonus = bonus;

const MODE_ICONS = {
  classic: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>',
  salvo: '<svg viewBox="0 0 24 24"><circle cx="7" cy="8" r="3.2"/><circle cx="17" cy="8" r="3.2"/><circle cx="12" cy="16.5" r="3.2"/><path d="M7 5.6v4.8M4.6 8h4.8M17 5.6v4.8M14.6 8h4.8M12 14.1v4.8M9.6 16.5h4.8" opacity=".7"/></svg>',
  royale: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="4" r="1.6"/><circle cx="12" cy="20" r="1.6"/><circle cx="4" cy="12" r="1.6"/><circle cx="20" cy="12" r="1.6"/><circle cx="6.3" cy="6.3" r="1.3"/><circle cx="17.7" cy="6.3" r="1.3"/><circle cx="6.3" cy="17.7" r="1.3"/><circle cx="17.7" cy="17.7" r="1.3"/><path d="M12 6.2v3.3M12 14.5v3.3M6.2 12h3.3M14.5 12h3.3" opacity=".6"/></svg>',
  arcade: '<svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="11" height="15" rx="2" transform="rotate(-8 9.5 11)"/><rect x="9" y="5.5" width="11" height="15" rx="2" transform="rotate(8 14.5 13)"/><path d="M14.5 10l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="currentColor" stroke="none" opacity=".9"/></svg>',
};
export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'cards', choices: ['classic', 'salvo', 'royale', 'arcade'].map(m => ({ value: m, label: MODE_INFO[m].name, sub: MODE_INFO[m].sub, meta: MODE_INFO[m].players, icon: MODE_ICONS[m] })) },
  { key: 'placeSec', label: 'PLACEMENT', choices: PLACE_OPTIONS.map(n => ({ value: n, label: `${n}s` })) },
  { key: 'turnSec', label: 'TURN / AIM TIMER', choices: TURN_OPTIONS.map(n => ({ value: n, label: `${n}s` })) },
];

export const estimateMinutes = s => estimate(s, Math.max(2, Object.keys(state.players || {}).length));
export { aliveOf };
