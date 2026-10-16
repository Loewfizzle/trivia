// NEURAL BLUFF — authority state machine (pure; see cipher/director.js for the pattern).
// Phases per round: intro -> write -> vote -> reveal -> standings (or final after the last round).
import { encodeJSON } from '../../core/obfuscate.js';
import {
  INTRO_MS, FINAL_INTRO_MS, WRITE_MS, VOTE_MS, VOTE_SETTLE_MS, STANDINGS_MS, FINAL_MS, GRACE_MS, MODES,
  buildOptions, scoreRound, revealScript, revealDuration,
} from './logic.js';

export const questionKey = (code, matchId, round) => `${code}:${matchId}:b${round}`;
export const secretKey = (code, matchId, round) => `${code}:${matchId}:h${round}`;

// The round's question for players ({ id, q, a, v }) and the house lies (host only) — both obfuscated.
function questionPatch(code, matchId, round, item) {
  return {
    qx: encodeJSON({ id: item.id, q: item.q, a: item.a, v: item.v, cat: item.cat }, questionKey(code, matchId, round)),
    hx: encodeJSON({ lies: item.lies }, secretKey(code, matchId, round)),
  };
}

/** pickQuestion(usedSet) -> { id, q, a, v, lies, cat } | null */
export function createGame({ code, matchId, settings, participants, now, pickQuestion, roomUsed = {} }) {
  const rounds = MODES[settings.mode] || MODES.short;
  const item = pickQuestion(new Set(Object.keys(roomUsed)));
  if (!item) return null;
  return {
    id: 'bluff',
    matchId,
    settings,
    rounds,
    participants,
    round: 0,
    rk: '0',
    phase: 'intro',
    phaseStartAt: now,
    phaseEndsAt: now + (rounds === 1 ? FINAL_INTRO_MS : INTRO_MS),
    used: { [item.id]: true },
    ...questionPatch(code, matchId, 0, item),
    $room: { [`meta/used/bluff/${item.id}`]: true }, // stripped by host.js and written to the room
  };
}

/**
 * ctx: { code, now, lies, votes, online, decode(game) -> { q: {a, v}, house: [..] } | null,
 *        pickQuestion(usedSet) -> item | null, roomUsed: { id: true } }
 * Returns a game patch (plus optional `$room` paths for the room node), { lobby: true }, or null.
 */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'bluff') return null;
  const { now } = ctx;
  const ends = game.phaseEndsAt || 0;
  const uids = Object.keys(game.participants || {});
  const active = uids.filter(u => ctx.online[u]);
  const isFinal = game.round >= game.rounds - 1;

  switch (game.phase) {
    case 'intro':
      if (now < ends) return null;
      return { phase: 'write', phaseStartAt: now, phaseEndsAt: now + WRITE_MS };

    case 'write': {
      const allIn = active.length > 0 && active.every(u => ctx.lies && ctx.lies[u] && ctx.lies[u].t);
      if (!allIn && now < ends + GRACE_MS) return null;
      const d = ctx.decode(game);
      if (!d) return null;
      const options = buildOptions({ lies: ctx.lies || {}, truth: d.q, house: d.house, players: uids.length, seed: `${game.matchId}:${game.round}` });
      return {
        phase: 'vote',
        phaseStartAt: now,
        phaseEndsAt: now + VOTE_MS,
        options: options.map(o => ({ k: o.k, t: o.t })),
        // authorship stays hidden until the reveal
        ox: encodeJSON(options, `${secretKeyFor(game)}:ox`),
      };
    }

    case 'vote': {
      const allVoted = active.length > 0 && active.every(u => ctx.votes && ctx.votes[u] && ctx.votes[u].k);
      // Everyone voted: stay open a moment after the latest vote, so a ♥ (a second tap) or a
      // changed mind still lands — closing instantly cut off the last voter's like.
      const lastVoteAt = allVoted ? Math.max(...active.map(u => Number(ctx.votes[u].at) || 0)) : 0;
      const settled = allVoted && now >= Math.min(ends, lastVoteAt + VOTE_SETTLE_MS);
      if (!settled && now < ends + GRACE_MS) return null;
      const options = ctx.decodeOptions(game);
      if (!options) return null;
      const votes = ctx.votes || {};
      const script = revealScript(options, votes);
      return {
        phase: 'reveal',
        phaseStartAt: now,
        phaseEndsAt: now + revealDuration(script),
        reveal: script,
        [`results/${game.round}`]: scoreRound({ options, votes, participants: game.participants, final: isFinal }),
      };
    }

    case 'reveal':
      if (now < ends) return null;
      return isFinal
        ? { phase: 'final', phaseStartAt: now, phaseEndsAt: now + FINAL_MS }
        : { phase: 'standings', phaseStartAt: now, phaseEndsAt: now + STANDINGS_MS };

    case 'standings': {
      if (now < ends) return null;
      const round = game.round + 1;
      const used = new Set([...Object.keys(game.used || {}), ...Object.keys(ctx.roomUsed || {})]);
      const item = ctx.pickQuestion(used);
      if (!item) return null; // bank still loading on a freshly promoted host
      const last = round >= game.rounds - 1;
      return {
        phase: 'intro', round, rk: String(round),
        phaseStartAt: now, phaseEndsAt: now + (last ? FINAL_INTRO_MS : INTRO_MS),
        options: null, ox: null, reveal: null,
        [`used/${item.id}`]: true,
        $room: { [`meta/used/bluff/${item.id}`]: true },
        ...questionPatch(ctx.code, game.matchId, round, item),
      };
    }

    case 'final':
      return now >= ends ? { lobby: true } : null;
    default:
      return null;
  }
}

// Options key shares the round's secret so each round's authorship needs its own key.
function secretKeyFor(game) {
  return `${game.matchId}:${game.round}`;
}
export const optionsKey = game => `${secretKeyFor(game)}:ox`;
