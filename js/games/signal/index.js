// LAST SIGNAL module entry (see games/registry.js for the contract).
import { createGame, nextStep } from './director.js';
import { DEFAULT_SETTINGS, HP_OPTIONS, rankings } from './logic.js';
import { initialBank, topUp, fallbackPatch, decodeQuestion } from '../../trivia/feed.js';
import { loadFallback } from '../../trivia/bank.js';
import { CATEGORIES } from '../../trivia/categories.js';
import { state } from '../../store.js';
export { createView } from './view.js';

export const MUSIC = 'signal';
export { DEFAULT_SETTINGS };

export const livePaths = g => ({ answers: `answers/${g.matchId}/${g.q || 0}`, targets: `targets/${g.matchId}` });

export async function start({ code, matchId, settings, participants, now }) {
  const s = { ...DEFAULT_SETTINGS, ...settings, cats: [].concat(settings.cats || []) };
  const { bank, trivia } = await initialBank({ code, matchId, cats: s.cats, now, min: 12 });
  return createGame({ matchId, settings: s, participants, now, bank, trivia });
}

// Host only: keep ~8 questions queued ahead of play, and have the fallback bank ready.
export function prepare(game, { code, host }) {
  if (!host) return;
  loadFallback().catch(() => {});
  topUp(() => state.game, code, (game.q || 0) + 8);
}

export const step = (game, { code, now, live, online }) => nextStep(game, {
  now,
  online,
  answers: live.answers || {},
  targets: live.targets || {},
  correctOf: q => { const it = decodeQuestion(game, code, q); return it ? it.c : null; },
  fallback: n => fallbackPatch(game, code, n),
});

export const OPTIONS = [
  { key: 'hp', label: 'STARTING HP', choices: HP_OPTIONS.map(v => ({ value: v, label: String(v) })) },
  { key: 'cats', label: 'CATEGORIES', type: 'multi', hint: 'NONE SELECTED = MIXED', choices: CATEGORIES.map(c => ({ value: c.id, label: c.label })) },
];

// Rough: elimination pace scales with HP; typical rounds take ~11 s.
export function estimateMinutes(s) {
  return Math.round((s.hp / 100) * 6 + 1);
}

export const finalRanks = game => rankings(game).map(r => ({ uid: r.uid, rank: r.rank }));
