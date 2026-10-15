// CIPHER BREACH — the authority state machine.
//
// The host client calls nextStep() on every tick. It is a pure function of the
// game state stored in the database plus the current server time, so any
// client that becomes host can pick up mid-game with no hidden local state.
//
// Phases:  intro -> play -> reveal -> (standings -> intro ...) -> final -> lobby
import {
  PHASE_MS, PLAY_GRACE_MS, MAX_GUESSES, roundLengths, computeRoundResults,
  encodeWord, decodeWord, secretKey,
} from './logic.js';

// pickWord(length, usedKeys:Set) -> { key, word } | null (null = word list not loaded yet)
export function createGame({ code, matchId, settings, participants, now, pickWord }) {
  const lengths = roundLengths(settings.rounds);
  const first = pickWord(lengths[0], new Set());
  if (!first) return null;
  return {
    id: 'cipher',
    matchId,
    rounds: lengths.length,
    lengths,
    roundMs: settings.roundSec * 1000,
    maxGuesses: MAX_GUESSES,
    participants,
    round: 0,
    rk: '0', // round as a string: lets security rules match the boards/$round path
    phase: 'intro',
    phaseStartAt: now,
    phaseEndsAt: now + PHASE_MS.intro,
    secret: encodeWord(first.word, secretKey(code, matchId, 0)),
    used: { [first.key]: true },
    reveal: null,
    results: null,
  };
}

// Returns a patch for the game node (keys may be paths like "results/2"),
// { lobby: true } to end the match, or null when nothing should change.
export function nextStep(game, { code, now, boards, online, pickWord }) {
  if (!game || game.id !== 'cipher') return null;
  const ends = game.phaseEndsAt || 0;

  switch (game.phase) {
    case 'intro':
      if (now < ends) return null;
      return { phase: 'play', phaseStartAt: now, roundStartAt: now, phaseEndsAt: now + game.roundMs };

    case 'play': {
      const uids = Object.keys(game.participants || {});
      const active = uids.filter(u => online[u]);
      const allDone = active.length > 0 && active.every(u => boards && boards[u] && boards[u].done);
      if (!allDone && now < ends + PLAY_GRACE_MS) return null;
      const results = computeRoundResults(game, boards || {});
      return {
        phase: 'reveal',
        phaseStartAt: now,
        phaseEndsAt: now + PHASE_MS.reveal,
        reveal: decodeWord(game.secret, secretKey(code, game.matchId, game.round)),
        [`results/${game.round}`]: results,
      };
    }

    case 'reveal': {
      if (now < ends) return null;
      const last = game.round >= game.rounds - 1;
      return last
        ? { phase: 'final', phaseStartAt: now, phaseEndsAt: now + PHASE_MS.final }
        : { phase: 'standings', phaseStartAt: now, phaseEndsAt: now + PHASE_MS.standings };
    }

    case 'standings': {
      if (now < ends) return null;
      const round = game.round + 1;
      const pick = pickWord(game.lengths[round], new Set(Object.keys(game.used || {})));
      if (!pick) return null; // word list still loading on this (new) host — try next tick
      return {
        phase: 'intro',
        round,
        rk: String(round),
        phaseStartAt: now,
        phaseEndsAt: now + PHASE_MS.intro,
        secret: encodeWord(pick.word, secretKey(code, game.matchId, round)),
        [`used/${pick.key}`]: true,
        reveal: null,
      };
    }

    case 'final':
      return now >= ends ? { lobby: true } : null;

    default:
      return null;
  }
}
