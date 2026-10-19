// OVERCLOCK module entry (see games/registry.js for the contract).
import { createGame, nextStep, triviaNeeded } from './director.js';
import { DEFAULT_SETTINGS, MODES, CHALLENGE_MS, READY_MS, STANDINGS_MS, standings as ocStandings } from './logic.js';
import { initialBank, topUp, fallbackPatch } from '../../trivia/feed.js';
import { loadFallback } from '../../trivia/bank.js';
import { state } from '../../store.js';

// Trivia questions already used by earlier matches in this room (never dealt again tonight).
const roomSeen = () => (state.meta && state.meta.used && state.meta.used.trivia) || {};
import { lazyView, gameSheets } from '../lazy-view.js';
// the view loads when a match of this game is on screen (keeps first paint light)
export const createView = lazyView(() => import('./view.js'), gameSheets('overclock'));

export const MUSIC = 'overclock';
export { DEFAULT_SETTINGS };

export const livePaths = g => ({ boards: `oc/${g.matchId}/${g.ci || 0}` });

export async function start({ code, matchId, settings, participants, now }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const seed = `${matchId}:${Math.random().toString(36).slice(2, 10)}`;
  const { bank, trivia, $room } = await initialBank({ code, matchId, cats: [], now, min: 12, roomSeen: roomSeen() });
  return { ...createGame({ matchId, settings: s, participants, now, seed, bank, trivia }), $room };
}

export function prepare(game, { code, host }) {
  if (!host) return;
  loadFallback().catch(() => {});
  topUp(() => state.game, code, triviaNeeded(game), roomSeen);
}

export const step = (game, { code, now, live, online }) => nextStep(game, {
  now,
  online,
  boards: live.boards || {},
  fallback: n => fallbackPatch(game, code, n, roomSeen()),
});

export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'list', choices: [
    { value: 'quick', label: `QUICK · ${MODES.quick}`, sub: 'Six different challenges' },
    { value: 'standard', label: `STANDARD · ${MODES.standard}`, sub: 'Twelve different challenges' },
    { value: 'marathon', label: `MARATHON · ${MODES.marathon}`, sub: 'All twenty, plus a few repeats' },
  ] },
];

export function estimateMinutes(s) {
  const n = MODES[s.mode] || MODES.standard;
  return Math.round((n * (CHALLENGE_MS * 0.8 + READY_MS + STANDINGS_MS + 1500)) / 60000);
}

export const finalRanks = game => ocStandings(game).map(r => ({ uid: r.uid, rank: r.rank }));
