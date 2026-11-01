// OVERCLOCK module entry (see games/registry.js for the contract).
import { createGame, nextStep, triviaNeeded } from './director.js';
import { DEFAULT_SETTINGS, MODES, CHALLENGE_MS, READY_MS, STANDINGS_MS, standings as ocStandings } from './logic.js';
import { initialBank, topUp, fallbackPatch } from '../../trivia/feed.js';
import { loadFallback } from '../../trivia/bank.js';
import { state } from '../../store.js';

// Trivia questions already used by earlier matches in this room (never dealt again tonight).
const roomSeen = () => (state.meta && state.meta.used && state.meta.used.trivia) || {};
import { lazyView, gameSheets } from '../lazy-view.js';
import { sealGate, unsealed, mergeSealed } from '../kit/seal.js';
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

// THE SEAL (kit/seal.js): a challenge's ANSWERS (w: the word · o: an order · g: a guess · rw: the rewiring) live in seal/{CODE}/… —
// the room shows the progress (p · ok · n · done); at the end of 'play' the host unseals them and publishes them for the reveal
// (game/rv/{ci}/{uid}: the closest guesses on the number line, the longest words, …)
export const sealed = g => ({ boards: `oc/${g.matchId}/${g.ci || 0}` });
export const OC_SECRET = ['w', 'o', 'g', 'rw'];
export const step = (game, { code, now, live, online }) => {
  const ck = String(game.ci || 0);
  const patch = sealGate(game, nextStep(game, {
    now,
    online,
    boards: mergeSealed(live.boards, live.seal_boards),
    fallback: n => fallbackPatch(game, code, n, roomSeen()),
  }), { node: 'oc', key: ck, phase: 'play' });
  if (patch && game.phase === 'play' && patch.phase && patch.phase !== 'play' && unsealed(game, 'oc', ck)) {
    const rv = {};
    for (const [uid, e] of Object.entries(live.seal_boards || {})) {
      const x = {};
      for (const f of OC_SECRET) if (e && e[f] != null) x[f] = e[f];
      if (Object.keys(x).length) rv[uid] = x;
    }
    if (Object.keys(rv).length) patch[`rv/${ck}`] = rv;
  }
  return patch;
};

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
