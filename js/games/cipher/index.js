// CIPHER BREACH module entry (see games/registry.js for the contract).
import { createGame, nextStep } from './director.js';
import { roundLengths, DEFAULT_SETTINGS, ROUND_COUNT_OPTIONS, ROUND_TIME_OPTIONS, PHASE_MS, standings as cipherStandings } from './logic.js';
import { loadLengths, pickWord } from './words.js';
import { lazyView, gameSheets } from '../lazy-view.js';
// the view loads when a match of this game is on screen (keeps first paint light)
export const createView = lazyView(() => import('./view.js'), gameSheets('cipher'));

export { nextStep, pickWord, DEFAULT_SETTINGS };
export const MUSIC = 'cipher';

export const livePaths = g => ({ boards: `boards/${g.matchId}/${g.round}` });

export const step = (game, { code, now, live, online }) =>
  nextStep(game, { code, now, boards: live.boards || {}, online, pickWord });

export async function start({ code, matchId, settings, participants, now }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  await loadLengths(roundLengths(s.rounds));
  return createGame({ code, matchId, settings: s, participants, now, pickWord });
}

const prepared = new Set();
export function prepare(game) {
  const k = (game.lengths || []).join(',');
  if (prepared.has(k)) return;
  prepared.add(k);
  loadLengths(game.lengths).catch(() => prepared.delete(k));
}

export const OPTIONS = [
  { key: 'rounds', label: 'ROUNDS', choices: ROUND_COUNT_OPTIONS.map(v => ({ value: v, label: String(v) })) },
  { key: 'roundSec', label: 'ROUND TIMER', choices: ROUND_TIME_OPTIONS.map(v => ({ value: v, label: v >= 60 && v % 60 === 0 ? `${v / 60}:00` : `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` })) },
];

// Rough match length for the options sheet (rounds rarely use the full timer).
export function estimateMinutes(s) {
  const perRound = s.roundSec * 0.75 + (PHASE_MS.intro + PHASE_MS.reveal + PHASE_MS.standings) / 1000;
  return Math.max(1, Math.round((s.rounds * perRound) / 60));
}

export const finalRanks = game => cipherStandings(game).map(r => ({ uid: r.uid, rank: r.rank }));
