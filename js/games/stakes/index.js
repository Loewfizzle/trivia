// HIGH STAKES — the game contract (registry.js). Rules: logic.js; director: director.js; questions: feed.js + questions.js.
// Host duties (prepare): keep the question bank stocked between rounds, and resolve each showdown — read the round's
// hidden bets and answers (hsbet/, readable by the host only once the phase is 'show') and write the results.
import { createGame, nextStep, showPatch } from './director.js';
import { standings, estimateMinutes as estimate, DEFAULT_SETTINGS as DEFAULTS } from './logic.js';
import { initialPool, topUp, fallbackPatch } from './feed.js';
import { decodeQ } from './questions.js';
import { loadFallback } from '../../trivia/bank.js';
import { dbRef, get, update, serverNow } from '../../firebase.js';
import { state } from '../../store.js';
import { lazyView } from '../lazy-view.js';

export const createView = lazyView(() => import('./view.js'));
export const MUSIC = 'stakes';   // high1–3, a seeded order per room (the view calls setPlaylist), crossfading
export const FINAL_MUSIC = 'victory1';   // victory.mp3 for the winner reveal
export const DEFAULT_SETTINGS = DEFAULTS;
export const OPTIONS = [];
export const estimateMinutes = (s, n) => estimate(s, n);

const roomSeen = () => (state.meta && state.meta.used && state.meta.used.trivia) || {};

export async function start({ code, matchId, settings, participants, now }) {
  const pool = await initialPool({ code, matchId, now, roomSeen: roomSeen() });
  const { $room, ...rest } = pool;
  return { ...createGame({ matchId, participants, now, settings: settings || {}, ...rest }), $room };
}

let resolving = '';
export function prepare(game, { code, host }) {
  if (!host || !game || !code) return;
  loadFallback().catch(() => {});
  const write = (patch, $room) => {
    const w = {};
    for (const [k, v] of Object.entries(patch)) w[`game/${k}`] = v;
    return update(dbRef(`rooms/${code}`), { ...w, ...($room || {}) });
  };
  if (game.phase !== 'final' && game.phase !== 'show') topUp(game, code, serverNow(), write, roomSeen());
  // the showdown: the host may now read the hidden bets of this round
  const key = `${game.matchId}|${game.rk}`;
  if (game.phase === 'show' && !(game.res && game.res[game.round]) && resolving !== key) {
    resolving = key;
    resolve(game, code).catch(e => { console.warn('stakes showdown', e); }).finally(() => { setTimeout(() => { if (resolving === key) resolving = ''; }, 1500); });
  }
}

async function resolve(game, code) {
  const plan = game.plan && game.plan[game.round];
  const q = plan && decodeQ(game, code, plan.i);
  if (!q) return;
  const snap = await get(dbRef(`hsbet/${code}/${game.matchId}/${game.rk}`));
  const now = serverNow();
  const live = state.game;
  if (!live || live.matchId !== game.matchId || live.rk !== game.rk || live.phase !== 'show' || (live.res && live.res[live.round])) return;
  const patch = showPatch(live, snap.val() || {}, q.c, now);
  const w = {};
  for (const [k, v] of Object.entries(patch)) w[`game/${k}`] = v;
  await update(dbRef(`rooms/${code}`), w);
}

export function step(game, ctx) {
  return nextStep(game, { ...ctx, fallback: (g, d) => fallbackPatch(g, ctx.code, d, roomSeen()) });
}

// public lock flags only (who has bet / answered); the values are in hsbet/ (top level, private)
export const livePaths = game => ({ lock: `hslock/${game.matchId}/${game.rk}` });
export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
