// DOUBLE AGENT module entry (see games/registry.js for the contract).
//
// Secrets live OUTSIDE rooms/{code} (which any signed-in user can read), in spy/{code}:
//   spy/{code}/key/{matchId}: { seed }  — the match's secret seed; only the CURRENT host can read/write it (rules).
//                                         Every round's word + agents come from it (logic.js#deal), so a new host
//                                         computes exactly the same deal without anything being stored in the open.
//   spy/{code}/card/{uid}:    { m, rk, cat, word | null, agent }  — each player's classified file; only that
//                                         player can read it, only the host can write it.
import { createGame, nextStep, dealFor } from './director.js';
import { DEFAULT_SETTINGS, ROUND_OPTIONS, CLUE_SEC_OPTIONS, DEBATE_SEC_OPTIONS, TWO_AGENTS_MIN, standings, estimateMinutes as estimate } from './logic.js';
import { dbRef, get, set, update } from '../../firebase.js';
import { state } from '../../store.js';
import { lazyView } from '../lazy-view.js';
// the view loads when a match of this game is on screen (keeps first paint light)
export const createView = lazyView(() => import('./view.js'));

export const MUSIC = 'spy'; // playlist: spy1 → spy2 → spy3 → …
export const MIN_PLAYERS = 4;
export { DEFAULT_SETTINGS };

export const livePaths = g => ({
  clues: `agclue/${g.matchId}/${g.rk}`,
  ready: `agready/${g.matchId}/${g.rk}`,
  pins: `agpin/${g.matchId}/${g.rk}`,
  votes: `agvote/${g.matchId}/${g.rk}`,
  guess: `agguess/${g.matchId}/${g.rk}`,
});

// ---------------------------------------------------------------- the word bank
let bank = null;
let bankLoading = null;
export function loadAgentBank() {
  if (bank) return Promise.resolve(bank);
  if (!bankLoading) {
    bankLoading = fetch(new URL('../../../data/agent/words.json', import.meta.url))
      .then(r => r.json())
      .then(j => { bank = j.categories; return bank; })
      .catch(e => { bankLoading = null; throw e; });
  }
  return bankLoading;
}
export const setAgentBank = rows => { bank = rows; }; // tests

// ---------------------------------------------------------------- host secrets
const seeds = {};      // matchId -> seed (this client, while host)
let seedLoading = null;
const dealt = new Set(); // `${matchId}|${rk}` cards written by this client
const usedRoom = () => (state.meta && state.meta.used && state.meta.used.agent) || {};

function newSeed() {
  const a = new Uint32Array(4);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

function loadSeed(code, matchId) {
  if (seeds[matchId] || seedLoading) return;
  seedLoading = get(dbRef(`spy/${code}/key/${matchId}`))
    .then(s => { const v = s.val(); if (v && v.seed) seeds[matchId] = v.seed; })
    .catch(e => console.warn('agent key', e && e.message))
    .finally(() => { seedLoading = null; });
}

// Writes every seated player's classified file for this round (idempotent: same deal → same cards).
function writeCards(code, game) {
  const key = `${game.matchId}|${game.rk}`;
  if (dealt.has(key)) return;
  const d = dealFor(game, { seed: seeds[game.matchId], bank, usedRoom: usedRoom() });
  if (!d) return;
  dealt.add(key);
  const patch = {};
  for (const uid of game.seat || []) {
    const agent = !!d.agents[uid];
    patch[`card/${uid}`] = { m: game.matchId, rk: game.rk, cat: d.cat, word: agent ? null : d.word, agent };
  }
  update(dbRef(`spy/${code}`), patch).catch(e => { dealt.delete(key); console.warn('agent cards', e && e.message); });
}

export async function start({ code, matchId, settings, participants, now }) {
  await loadAgentBank();
  const seed = newSeed();
  await set(dbRef(`spy/${code}/key/${matchId}`), { seed });
  seeds[matchId] = seed;
  const game = createGame({ matchId, settings: { ...DEFAULT_SETTINGS, ...settings }, participants, now });
  writeCards(code, game);
  return game;
}

export function prepare(game, { code, host }) {
  if (!host || !game) return;
  if (!bank) { loadAgentBank().catch(() => {}); return; }
  if (!seeds[game.matchId]) { loadSeed(code, game.matchId); return; }
  if (['intro', 'briefing', 'clues', 'debate', 'vote', 'unmask', 'last'].includes(game.phase)) writeCards(code, game);
}

export const step = (game, { now, live, online }) => nextStep(game, {
  now,
  online,
  present: Object.fromEntries(Object.keys(state.players || {}).map(u => [u, true])),
  names: Object.fromEntries(Object.entries(state.players || {}).map(([u, p]) => [u, String((p && p.name) || '').slice(0, 16)])),
  live,
  seed: seeds[game.matchId] || null,
  bank,
  usedRoom: usedRoom(),
});

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));

// `when(players)`: the option only shows (and only applies) with that many connected players
export const OPTIONS = [
  { key: 'rounds', label: 'ROUNDS', choices: ROUND_OPTIONS.map(n => ({ value: n, label: String(n) })) },
  { key: 'mode', label: 'PLAYING', type: 'list', choices: [
    { value: 'remote', label: 'REMOTE', sub: 'Different places — debate in the chat' },
    { value: 'room', label: 'SAME ROOM', sub: 'Together — talk it out loud' },
  ] },
  { key: 'agents', label: 'DOUBLE AGENTS', hint: '2 needs 7+ players', when: n => n >= TWO_AGENTS_MIN, choices: [{ value: 1, label: '1' }, { value: 2, label: '2' }] },
  { key: 'clueSec', label: 'CLUE TIMER', choices: CLUE_SEC_OPTIONS.map(n => ({ value: n, label: `${n}s` })) },
  { key: 'debateSec', label: 'DEBATE', choices: DEBATE_SEC_OPTIONS.map(n => ({ value: n, label: `${n}s` })) },
  { key: 'passes', label: 'CLUE ROUNDS', choices: [{ value: 1, label: '1 EACH' }, { value: 2, label: '2 EACH' }] },
];

export const estimateMinutes = s => estimate(s, Math.max(4, Object.keys(state.players || {}).length));
