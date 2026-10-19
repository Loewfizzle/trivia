// NEON PAR module entry (see games/registry.js for the contract).
import { createGame, nextStep, DEFAULT_SETTINGS } from './director.js';
import { standings, holeOf } from './logic.js';
import { ZONES } from './course.js';
import { lazyView, gameSheets } from '../lazy-view.js';

// The view (three.js scene, HUD, aiming — almost all of NEON PAR) and three.js itself load only when
// a NEON PAR match is on screen.
export const createView = lazyView(() => import('./view.js'), gameSheets('golf'));
export { DEFAULT_SETTINGS };

// Lobby prefetch uses MUSIC; during the match the track follows the zone (one per zone, crossfaded).
export const MUSIC = 'golf-rooftops';
export const musicFor = game => {
  const hole = game && game.holes && holeOf(game);
  return [hole ? ZONES[hole.zone].music : MUSIC, 'menu'];
};

export const livePaths = g => ({ nodes: `golf/${g.matchId}` });

export async function start({ matchId, settings, participants, now }) {
  return createGame({ matchId, settings, participants, now });
}

export function prepare() {}

export const step = (game, { now, live, online }) => nextStep(game, { now, online, nodes: live.nodes || {} });

export const OPTIONS = [
  { key: 'mode', label: 'COURSE', type: 'list', choices: [
    { value: 'full', label: 'FULL 9', sub: 'Rooftops · Cyberspace · Neon Arcade' },
    { value: 'quick6', label: 'QUICK 6', sub: 'Two holes from each zone' },
    { value: 'quick3', label: 'QUICK 3', sub: 'One hole per zone' },
  ] },
  { key: 'power', label: 'POWER-UPS', choices: [{ value: 'on', label: 'ON' }, { value: 'off', label: 'OFF' }] },
  { key: 'sabotage', label: 'SABOTAGE', choices: [{ value: 'on', label: 'ON' }, { value: 'off', label: 'OFF' }] },
];

export function estimateMinutes(s) {
  const n = s.mode === 'quick3' ? 3 : s.mode === 'quick6' ? 6 : 9;
  return Math.max(3, Math.round(n * 1.5 + 1));
}

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
