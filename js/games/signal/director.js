// LAST SIGNAL — authority state machine (pure; see cipher/director.js for the pattern).
// Phases: intro -> question -> reveal -> question ... -> final -> lobby
import {
  INTRO_MS, QUESTION_MS, REVEAL_MS, FINAL_MS, ANSWER_GRACE_MS, START_SHIELDS,
  aliveUids, resolveQuestion, isOver,
} from './logic.js';

const NEXT_QUESTION_WAIT_MS = 2500; // how long to wait for an API top-up before using the fallback bank

export function createGame({ matchId, settings, participants, now, bank, trivia }) {
  const hp = {};
  const sh = {};
  for (const uid of Object.keys(participants)) { hp[uid] = settings.hp; sh[uid] = START_SHIELDS; }
  return {
    id: 'signal',
    matchId,
    settings,
    participants,
    hp,
    sh,
    q: 0,
    qk: '0',
    phase: 'intro',
    phaseStartAt: now,
    phaseEndsAt: now + INTRO_MS,
    bank,
    trivia,
  };
}

/**
 * ctx: { now, answers, targets, online, correctOf(q) -> index|null, fallback(n) -> patch|null }
 */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'signal') return null;
  const { now } = ctx;
  const ends = game.phaseEndsAt || 0;
  const n = (game.trivia && game.trivia.n) || 0;

  switch (game.phase) {
    case 'intro': {
      if (now < ends) return null;
      if (n < 1) return needQuestion(game, ctx, 0, ends);
      return startQuestion(0, now);
    }
    case 'question': {
      const alive = aliveUids(game);
      const waitingOn = alive.filter(u => ctx.online[u] && !(ctx.answers && ctx.answers[u]));
      const anyOnline = alive.some(u => ctx.online[u]);
      // Offline players aren't waited for — but if nobody alive is connected, run the full clock.
      if ((waitingOn.length || !anyOnline) && now < ends + ANSWER_GRACE_MS) return null;
      if (!waitingOn.length && now < Math.min(ends, (game.qStartAt || 0) + 800)) return null; // tiny settle for the last tap
      const correct = ctx.correctOf(game.q);
      if (correct == null) return null;
      const r = resolveQuestion(game, { answers: ctx.answers || {}, targets: ctx.targets || {}, correct });
      const patch = {
        phase: 'reveal',
        phaseStartAt: now,
        phaseEndsAt: now + REVEAL_MS,
        hp: r.hp,
        sh: r.sh,
        [`log/${game.q}`]: { c: correct, ev: r.events },
      };
      r.eliminated.forEach(u => { patch[`out/${u}`] = game.q; });
      return patch;
    }
    case 'reveal': {
      if (now < ends) return null;
      if (isOver(game)) return { phase: 'final', phaseStartAt: now, phaseEndsAt: now + FINAL_MS };
      const next = game.q + 1;
      if (n <= next) return needQuestion(game, ctx, next, ends);
      return startQuestion(next, now);
    }
    case 'final':
      return now >= ends ? { lobby: true } : null;
    default:
      return null;
  }
}

function startQuestion(q, now) {
  return { phase: 'question', q, qk: String(q), qStartAt: now, phaseStartAt: now, phaseEndsAt: now + QUESTION_MS };
}

// The next question hasn't arrived from the API yet: wait a little, then pull from the fallback bank.
function needQuestion(game, ctx, q, ends) {
  if (ctx.now < ends + NEXT_QUESTION_WAIT_MS) return null;
  const patch = ctx.fallback(Math.max(1, q + 1 - ((game.trivia && game.trivia.n) || 0)));
  if (!patch) return null;
  return { ...patch, ...startQuestion(q, ctx.now) };
}
