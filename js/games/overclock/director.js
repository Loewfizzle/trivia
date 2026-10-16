// OVERCLOCK — authority state machine (pure).
// Phases: ready (rules card the first time a type appears) -> play (30 s) -> standings -> ready … -> final
import { READY_MS, BRIEF_MS, CHALLENGE_MS, FINAL_MS, PLAY_GRACE_MS, MODES, buildOrder, computeResults, standingsMs } from './logic.js';

const TRIVIA_WAIT_MS = 2500;

export function createGame({ matchId, settings, participants, now, seed, bank, trivia }) {
  const total = MODES[settings.mode] || MODES.standard;
  const order = buildOrder(seed, total);
  const first = order[0];
  const game = {
    id: 'overclock',
    matchId,
    settings,
    seed,
    total,
    order,
    participants,
    ci: 0,
    ck: '0',
    phase: 'ready',
    brief: true,
    phaseStartAt: now,
    phaseEndsAt: now + BRIEF_MS,
    seen: { [first]: true },
    tq: {},
    tUsed: 0,
    bank,
    trivia,
  };
  if (first === 'trivia') { game.tq = { 0: 0 }; game.tUsed = 3; }
  return game;
}

export const triviaNeeded = game => game.order.filter(t => t === 'trivia').length * 3;

/** ctx: { now, boards, online, fallback(n) -> patch|null } */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'overclock') return null;
  const { now } = ctx;
  const ends = game.phaseEndsAt || 0;
  const type = game.order[game.ci];

  switch (game.phase) {
    case 'ready': {
      if (now < ends) return null;
      const play = { phase: 'play', phaseStartAt: now, playStartAt: now, phaseEndsAt: now + CHALLENGE_MS };
      if (type === 'trivia') {
        const need = (game.tq && game.tq[game.ci]) + 3;
        const have = (game.trivia && game.trivia.n) || 0;
        if (have < need) {
          if (now < ends + TRIVIA_WAIT_MS) return null;
          const patch = ctx.fallback(need - have);
          return patch ? { ...patch, ...play } : null;
        }
      }
      return play;
    }
    case 'play': {
      const uids = Object.keys(game.participants || {});
      const active = uids.filter(u => ctx.online[u]);
      const allDone = active.length > 0 && active.every(u => ctx.boards && ctx.boards[u] && ctx.boards[u].done);
      if (!allDone && now < ends + PLAY_GRACE_MS) return null;
      const last = game.ci >= game.total - 1;
      return {
        phase: last ? 'final' : 'standings',
        phaseStartAt: now,
        phaseEndsAt: now + (last ? FINAL_MS : standingsMs(type)),
        [`results/${game.ci}`]: computeResults(game, ctx.boards || {}),
      };
    }
    case 'standings': {
      if (now < ends) return null;
      const ci = game.ci + 1;
      const next = game.order[ci];
      const brief = !(game.seen && game.seen[next]);
      const patch = {
        phase: 'ready', ci, ck: String(ci), brief,
        phaseStartAt: now, phaseEndsAt: now + (brief ? BRIEF_MS : READY_MS),
        [`seen/${next}`]: true,
      };
      if (next === 'trivia') { patch[`tq/${ci}`] = game.tUsed || 0; patch.tUsed = (game.tUsed || 0) + 3; }
      return patch;
    }
    case 'final':
      return now >= ends ? { lobby: true } : null;
    default:
      return null;
  }
}
