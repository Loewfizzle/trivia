// HIGH STAKES — the pure director: intro → (cat → bet → q → show → stand) × 10 → cat → bet → q → show (ALL IN) → final.
//   cat:   the category card (+ the DOUBLE DOWN title card on rounds 4 and 8, the ALL IN dimming before the final)
//   bet:   15 s; ends early when every connected player has locked a bet (public lock flags in hslock/, values hidden)
//   q:     20 s; ends early when every connected player has answered
//   show:  waits for the host's resolution (showPatch, written with the round's results and the reveal), then plays it
//   stand: the standings, then the next round
// Bets and answers live in a top-level node (hsbet/) that only their owner can read — and the host only from the
// showdown on (database.rules.json) — so nothing is public before the showdown.
import { MS, FINAL, isDoubleDown, isFinal, pickQuestion, resolveRound, showMs, finalOrder, difficultyPlan } from './logic.js';

export function createGame({ matchId, participants, now, bank = {}, qmeta = {}, trivia = {}, settings = {} }) {
  return {
    id: 'stakes', matchId, participants, settings,
    n0: Object.keys(participants).length,
    dplan: difficultyPlan(matchId),
    round: 0, rk: '0',
    phase: 'intro', phaseStartAt: now, phaseEndsAt: now + MS.intro,
    plan: {}, res: {}, reveal: {},
    bank, qmeta, trivia,
  };
}

const catMs = round => MS.cat + (isDoubleDown(round) ? MS.dd : 0) + (isFinal(round) ? MS.allin : 0);
const activeUids = (game, online) => Object.keys(game.participants || {}).filter(u => !online || online[u] !== false);

/** The patch that opens round `round` (needs a question in the bank's index; ctx.fallback(game, d) can add one). */
function enterCat(game, round, now, ctx) {
  let g = game;
  let extra = {};
  let pick = pickQuestion(g, round);
  if (!pick && ctx && ctx.fallback) {
    const want = (g.dplan || difficultyPlan(g.matchId))[round] || 'medium';
    const fb = ctx.fallback(g, isFinal(round) ? 'hard' : want);
    if (fb) {
      extra = fb;
      g = { ...g, qmeta: { ...(g.qmeta || {}) } };
      for (const [k, v] of Object.entries(fb)) if (k.startsWith('qmeta/')) g.qmeta[k.slice(6)] = v;
      pick = pickQuestion(g, round);
    }
  }
  if (!pick) return null; // no question yet: the host keeps topping up, try again next tick
  return {
    ...extra,
    round, rk: String(round),
    phase: 'cat', phaseStartAt: now, phaseEndsAt: now + catMs(round),
    [`plan/${round}`]: pick,
    qStartAt: null,
  };
}

export function nextStep(game, ctx) {
  const { now, live = {}, online = null } = ctx;
  const locks = live.lock || {};
  switch (game.phase) {
    case 'intro':
      return now >= game.phaseEndsAt ? enterCat(game, 0, now, ctx) : null;
    case 'cat':
      return now >= game.phaseEndsAt ? { phase: 'bet', phaseStartAt: now, phaseEndsAt: now + MS.bet } : null;
    case 'bet': {
      const act = activeUids(game, online);
      const all = act.length && act.every(u => locks[u] && locks[u].b);
      if (now < game.phaseEndsAt && !all) return null;
      // a short beat after the last lock, so the last chip lands before the question flies in
      if (all && now < game.phaseEndsAt && now - Math.max(...act.map(u => locks[u].b || 0)) < 700) return null;
      return { phase: 'q', phaseStartAt: now, qStartAt: now, phaseEndsAt: now + MS.q };
    }
    case 'q': {
      const act = activeUids(game, online);
      const all = act.length && act.every(u => locks[u] && locks[u].a);
      if (now < game.phaseEndsAt && !all) return null;
      return { phase: 'show', phaseStartAt: now, phaseEndsAt: null };
    }
    case 'show':
      // the host's resolution writes res/{round} + reveal + phaseEndsAt (showPatch); until then, wait
      if (!game.res || !game.res[game.round] || !game.phaseEndsAt || now < game.phaseEndsAt) return null;
      if (isFinal(game.round)) return { phase: 'final', phaseStartAt: now, phaseEndsAt: null };
      return { phase: 'stand', phaseStartAt: now, phaseEndsAt: now + MS.stand };
    case 'stand':
      return now >= game.phaseEndsAt ? enterCat(game, game.round + 1, now, ctx) : null;
    default:
      return null;
  }
}

/**
 * The showdown's resolution (host only, from the hidden bets it may read once the phase is 'show').
 * hidden: hsbet/{code}/{m}/{rk} = { uid: { b: { b }, a: { a, at } } }; correct: the answer index.
 */
export function showPatch(game, hidden, correct, now) {
  const r = game.round;
  const res = resolveRound(game, r, hidden || {}, correct, game.qStartAt || game.phaseStartAt);
  const n = Object.keys(game.participants || {}).length;
  const patch = {
    [`res/${r}`]: res,
    [`reveal/${r}`]: correct,
    phaseEndsAt: now + showMs(n, isFinal(r)),
  };
  if (isFinal(r)) patch.order = finalOrder(game);
  return patch;
}
