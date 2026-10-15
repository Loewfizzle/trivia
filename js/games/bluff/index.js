// NEURAL BLUFF module entry (see games/registry.js for the contract).
import { createGame, nextStep, questionKey, secretKey, optionsKey } from './director.js';
import { DEFAULT_SETTINGS, MODES, standings, WRITE_MS, VOTE_MS, INTRO_MS, STANDINGS_MS } from './logic.js';
import { loadBluffBank, pickQuestion } from './bank.js';
import { decodeJSON } from '../../core/obfuscate.js';
import { state } from '../../store.js';
export { createView } from './view.js';

export const MUSIC = 'bluff';
export { DEFAULT_SETTINGS };

export const livePaths = g => ({ lies: `lies/${g.matchId}/${g.round}`, votes: `votes/${g.matchId}/${g.round}` });

const roomUsed = () => (state.meta && state.meta.used && state.meta.used.bluff) || {};

export async function start({ code, matchId, settings, participants, now }) {
  await loadBluffBank();
  return createGame({ code, matchId, settings: { ...DEFAULT_SETTINGS, ...settings }, participants, now, pickQuestion, roomUsed: roomUsed() });
}

export function prepare(game, { host }) {
  if (host) loadBluffBank().catch(() => {});
}

export const decodeQuestion = (game, code) => decodeJSON(game.qx, questionKey(code, game.matchId, game.round));

export const step = (game, { code, now, live, online }) => nextStep(game, {
  code,
  now,
  online,
  lies: live.lies || {},
  votes: live.votes || {},
  decode: g => {
    const q = decodeQuestion(g, code);
    const h = decodeJSON(g.hx, secretKey(code, g.matchId, g.round));
    return q && h ? { q, house: h.lies } : null;
  },
  decodeOptions: g => decodeJSON(g.ox, optionsKey(g)),
  pickQuestion,
  roomUsed: roomUsed(),
});

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));

export const OPTIONS = [
  { key: 'mode', label: 'MODE', choices: [{ value: 'short', label: `SHORT · ${MODES.short}` }, { value: 'standard', label: `STANDARD · ${MODES.standard}` }] },
];

export function estimateMinutes(s) {
  const n = MODES[s.mode] || MODES.short;
  // typical round: intro + ~45 s writing + ~22 s voting + ~15 s reveal + standings
  return Math.round((n * (INTRO_MS + WRITE_MS * 0.7 + VOTE_MS * 0.7 + 15_000 + STANDINGS_MS)) / 60_000);
}
