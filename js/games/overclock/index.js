// OVERCLOCK module entry (see games/registry.js for the contract).
import { createGame, nextStep, triviaNeeded } from './director.js';
import { DEFAULT_SETTINGS, MODES, CHALLENGE_MS, READY_MS, STANDINGS_MS } from './logic.js';
import { initialBank, topUp, fallbackPatch } from '../../trivia/feed.js';
import { loadFallback } from '../../trivia/bank.js';
import { state } from '../../store.js';
export { createView } from './view.js';

export const MUSIC = 'overclock';
export { DEFAULT_SETTINGS };

export const livePaths = g => ({ boards: `oc/${g.matchId}/${g.ci || 0}` });

export async function start({ code, matchId, settings, participants, now }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const seed = `${matchId}:${Math.random().toString(36).slice(2, 10)}`;
  const { bank, trivia } = await initialBank({ code, matchId, cats: [], now, min: 12 });
  return createGame({ matchId, settings: s, participants, now, seed, bank, trivia });
}

export function prepare(game, { code, host }) {
  if (!host) return;
  loadFallback().catch(() => {});
  topUp(() => state.game, code, triviaNeeded(game));
}

export const step = (game, { code, now, live, online }) => nextStep(game, {
  now,
  online,
  boards: live.boards || {},
  fallback: n => fallbackPatch(game, code, n),
});

export const OPTIONS = [
  { key: 'mode', label: 'MODE', choices: [{ value: 'standard', label: `STANDARD · ${MODES.standard}` }, { value: 'marathon', label: `MARATHON · ${MODES.marathon}` }] },
];

export function estimateMinutes(s) {
  const n = MODES[s.mode] || MODES.standard;
  return Math.round((n * (CHALLENGE_MS * 0.8 + READY_MS + STANDINGS_MS + 1500)) / 60000);
}
