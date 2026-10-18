// RUMRUNNER — the game contract (registry.js). Rules: logic.js; director: director.js; the screen: view.js.
// Host duty (prepare): at night, read everyone's private day logs (rrp/, readable by the host only while the phase is
// 'night' or 'final') and write tomorrow — prices moved by the day's trades, arrivals, tip-offs, net worths — or, after the
// last day, the books and the final standings. Deterministic, so a host that dies mid-night is simply repeated by the next.
import { createGame, nextStep } from './director.js';
import { standings, resolveNight, estimateMinutes as estimate, DEFAULT_SETTINGS as DEFAULTS, LENGTHS } from './logic.js';
import { dbRef, get, set, update } from '../../firebase.js';
import { state } from '../../store.js';
import { lazyView } from '../lazy-view.js';

export const createView = lazyView(() => import('./view.js'));
export const MUSIC = 'rum';                 // run1–4, a seeded order per room (the view calls setPlaylist), crossfading
export const FINAL_MUSIC = 'victory1';      // victory.mp3 for the winner reveal
export const DEFAULT_SETTINGS = DEFAULTS;
export const OPTIONS = [
  { key: 'days', label: 'LENGTH', choices: LENGTHS.map(n => ({ value: n, label: `${n} DAYS` })) },
  { key: 'daySec', label: 'DAY TIMER', choices: [30, 45, 60].map(n => ({ value: n, label: `${n}s` })) },
];
export const estimateMinutes = (s, n) => estimate(s, n);

const secrets = {};   // matchId -> the city's secret (the host's; a new host reads it back from rrsec/)
const randomSecret = () => { try { const a = new Uint32Array(4); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); } };

export async function start({ code, matchId, settings, participants, now }) {
  const secret = randomSecret();
  await set(dbRef(`rrsec/${code}/${matchId}`), secret);
  secrets[matchId] = secret;
  return createGame({ matchId, participants, now, settings: settings || {}, secret });
}

let resolving = '';
export function prepare(game, { code, host }) {
  if (!host || !game || !code || game.phase !== 'night') return;
  const last = game.day >= game.settings.days;
  const done = last ? !!game.final : !!(game.days && game.days[game.day + 1]);
  const key = `${game.matchId}|${game.day}`;
  if (done || resolving === key) return;
  resolving = key;
  resolve(game, code).catch(e => console.warn('rumrunner night', e)).finally(() => { setTimeout(() => { if (resolving === key) resolving = ''; }, 2500); });
}

async function resolve(game, code) {
  if (!secrets[game.matchId]) {   // a host that took over mid-match
    const s = await get(dbRef(`rrsec/${code}/${game.matchId}`));
    if (typeof s.val() !== 'string') throw new Error('no city secret');
    secrets[game.matchId] = s.val();
  }
  const snap = await get(dbRef(`rrp/${code}/${game.matchId}`));
  const live = state.game;
  if (!live || live.matchId !== game.matchId || live.phase !== 'night' || live.day !== game.day) return;
  const patch = resolveNight(live, snap.val() || {}, secrets[game.matchId]);
  const w = {};
  for (const [k, v] of Object.entries(patch)) w[`game/${k}`] = v;
  await update(dbRef(`rooms/${code}`), w);
}

export function step(game, ctx) { return nextStep(game, ctx); }

// public per-day flags only (DONE + the net worth for the live leaderboard); the logs are in rrp/ (top level, private)
export const livePaths = game => ({ pub: `rrpub/${game.matchId}/${game.day}` });
export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
