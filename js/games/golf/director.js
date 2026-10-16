// NEON PAR — authority state machine (pure). Per hole:
//   play  (everyone plays the same hole at once; each phone simulates its own ball and publishes it.
//          Once more than half have holed out, the rest get a 30 s countdown; offline players never block.)
//   card  (golf scorecard) … next hole … final
// The flyover, zone title card and par card are local to each phone (skippable), so they never hold
// anyone up. Results are snapshot from the players' nodes when a hole ends; totals are always derived.
import { holeNumbers, holeResults, nodeScore } from './logic.js';

export const HOLE_MAX_MS = 240_000;   // a hole never takes longer than 4 minutes
export const COUNTDOWN_MS = 30_000;
export const WRAP_MS = 2_400;         // everyone's in: let the last cup drop / celebration play
export const ACE_WRAP_MS = 6_000;
export const CARD_MS = 9_000;
export const FINAL_MS = 120_000;

export const DEFAULT_SETTINGS = { mode: 'full', power: 'on', sabotage: 'on' };

export function createGame({ matchId, settings, participants, now }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  return {
    id: 'golf',
    matchId,
    settings: s,
    holes: holeNumbers(s),
    participants,
    ...playPatch(0, now),
  };
}

const playPatch = (hi, now) => ({
  hi, hk: String(hi), phase: 'play', phaseStartAt: now, playStartAt: now, phaseEndsAt: now + HOLE_MAX_MS, cdEndsAt: null, wrapAt: null,
});

/** ctx: { now, online: { uid: bool }, nodes: { uid: node } } */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'golf') return null;
  const { now } = ctx;
  const nodes = ctx.nodes || {};
  const parts = Object.keys(game.participants || {});
  switch (game.phase) {
    case 'play': {
      const done = parts.filter(u => nodeScore(nodes[u], game.hi) != null);
      const waiting = parts.filter(u => ctx.online[u] && !done.includes(u));
      const finish = () => ({
        [`results/${game.hi}`]: holeResults(game, nodes),
        phase: 'card', phaseStartAt: now, phaseEndsAt: now + CARD_MS, cdEndsAt: null, wrapAt: null,
      });
      if (game.wrapAt) return now >= game.wrapAt ? finish() : null;
      if (now >= game.phaseEndsAt || (game.cdEndsAt && now >= game.cdEndsAt)) return finish();
      // an ACE gets time for its replay on every phone before the scorecard covers it
      const ace = done.some(u => nodeScore(nodes[u], game.hi) === 1);
      if (!waiting.length) return { wrapAt: now + (ace ? ACE_WRAP_MS : WRAP_MS) };
      if (!game.cdEndsAt && done.length * 2 > parts.length) return { cdEndsAt: now + COUNTDOWN_MS };
      return null;
    }
    case 'card': {
      if (now < game.phaseEndsAt) return null;
      if (game.hi >= game.holes.length - 1) return { phase: 'final', phaseStartAt: now, phaseEndsAt: now + FINAL_MS };
      return playPatch(game.hi + 1, now);
    }
    case 'final':
      return now >= game.phaseEndsAt ? { lobby: true } : null;
    default:
      return null;
  }
}
