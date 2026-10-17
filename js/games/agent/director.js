// DOUBLE AGENT — authority state machine (pure; see cipher/director.js for the pattern).
// Per round: briefing (read your classified file) -> clues (one turn each, 1–2 passes) -> debate -> vote
//            -> unmask -> [last chance, if an agent was caught] -> scores … -> final.
// The word and the agents are NEVER in the public game state until they're revealed: they come from the match's
// secret seed (spy/{code}/key/{matchId}, readable only by the current host) through logic.js#deal.
import {
  INTRO_MS, BRIEF_MS, BRIEF_MIN_MS, VOTE_MS, UNMASK_BASE_MS, UNMASK_EACH_MS, LAST_MS, SCORES_MS, FINAL_MS, GRACE_MS,
  MIN_SEATED, cleanSettings, deal, turnOrder, clueProblem, tallyVotes, guessRight, scoreRound, wordKey,
} from './logic.js';

const rkOf = (round, v) => `${round}-${v}`;
// everything a round leaves behind, cleared when the next one (or a re-deal) begins
const CLEAR = {
  order: null, turn: null, cur: null, pass: null, turnEndsAt: null, board: null, debateEnd: null,
  tally: null, accused: null, agents: null, caught: null, ballots: null, stolen: null, word: null, cat: null, guesses: null,
};

export function createGame({ matchId, settings, participants, now }) {
  const seat = Object.keys(participants).sort();
  const s = cleanSettings(settings, seat.length);
  return {
    id: 'agent',
    matchId,
    settings: s,
    participants,
    seat,
    round: 0,
    v: 0,
    rk: rkOf(0, 0),
    phase: 'intro',
    phaseStartAt: now,
    phaseEndsAt: now + INTRO_MS,
  };
}

/** The round's deal (host only — needs the secret seed and the word bank). */
export function dealFor(game, { seed, bank, usedRoom = {} }) {
  if (!seed || !bank) return null;
  return deal({
    seed, round: game.round, v: game.v || 0, seat: game.seat || [], agents: game.settings.agents, bank,
    used: { ...usedRoom, ...(game.burned || {}) }, lastCat: game.lastCat || null,
  });
}

/**
 * ctx: { now, online: { uid: bool }, present: { uid: true } (player node exists), live: { clues, ready, votes, guess },
 *        names: { uid: name } (remembered in game.names so a player who leaves keeps their name on the podium),
 *        seed (secret, null until loaded), bank (word bank, null until loaded), usedRoom: { wordKey: true } }
 * Returns a game patch (+ optional `$room`), { lobby: true }, or null.
 */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'agent') return null;
  const named = seat => Object.fromEntries((seat || []).filter(u => ctx.names && ctx.names[u] && !(game.names && game.names[u] === ctx.names[u])).map(u => [`names/${u}`, ctx.names[u]]));
  const { now } = ctx;
  const ends = game.phaseEndsAt || 0;
  const live = ctx.live || {};
  const seat = game.seat || [];
  const present = ctx.present || {};
  const here = seat.filter(u => present[u]);
  const online = seat.filter(u => present[u] && ctx.online[u]);
  const d = dealFor(game, ctx);
  const active = ['briefing', 'clues', 'debate', 'vote'].includes(game.phase);

  if (game.phase === 'final') return now >= ends ? { lobby: true } : null;
  // too few left to play on: straight to the podium
  if (here.length < MIN_SEATED && game.phase !== 'scores') return toFinal(now);

  // an agent left the room for good mid-round: void the round and deal again (the old word is burned)
  if (active && d && Object.keys(d.agents).some(a => !present[a])) {
    const v = (game.v || 0) + 1;
    return {
      ...CLEAR, ...briefing(now), v, rk: rkOf(game.round, v), seat: here.slice().sort(), ...named(here),
      [`burned/${wordKey(d.word)}`]: true, voided: (game.voided || 0) + 1,
    };
  }

  switch (game.phase) {
    case 'intro':
      if (now < ends) return null;
      return { ...CLEAR, ...briefing(now), ...named(seat) };

    case 'briefing': {
      if (!d) return null;
      const ready = live.ready || {};
      const allReady = online.length > 0 && online.every(u => ready[u] && ready[u].b);
      if (!(allReady && now >= game.phaseStartAt + BRIEF_MIN_MS) && now < ends + GRACE_MS) return null;
      const order = turnOrder({ seed: ctx.seed, round: game.round, v: game.v || 0, seat, agents: d.agents });
      return { ...turn(game, order, 0, now), phase: 'clues', phaseStartAt: now, order };
    }

    case 'clues': {
      if (!d) return null;
      const order = game.order || [];
      const t = game.turn || 0;
      const cur = game.cur;
      const pass = game.pass || 0;
      const sent = live.clues && live.clues[pass] && live.clues[pass][cur];
      let text = null;
      if (sent && sent.t) {
        // the host double-checks: a clue that gives the word away (or repeats one) never reaches the board
        const given = Object.values(game.board || {}).flatMap(p => Object.values(p || {}));
        text = clueProblem(sent.t, d.word, given) ? '' : String(sent.t).trim().slice(0, 20);
      } else if (!present[cur] || !ctx.online[cur]) text = ''; // disconnected on their turn: skipped
      else if (now >= (game.turnEndsAt || ends) + GRACE_MS) text = ''; // ran out of time: — NO SIGNAL —
      if (text === null) return null;
      const patch = { [`board/${pass}/${cur}`]: text };
      if (t + 1 >= order.length * game.settings.passes) {
        return { ...patch, phase: 'debate', phaseStartAt: now, phaseEndsAt: now + game.settings.debateSec * 1000, cur: null, turnEndsAt: null };
      }
      return { ...patch, ...turn(game, order, t + 1, now) };
    }

    case 'debate':
      if (!game.debateEnd && now < ends + GRACE_MS) return null;
      return { phase: 'vote', phaseStartAt: now, phaseEndsAt: now + VOTE_MS, debateEnd: null };

    case 'vote': {
      if (!d) return null;
      const votes = live.votes || {};
      const allLocked = online.length > 0 && online.every(u => votes[u] && votes[u].lock && votes[u].s);
      if (!allLocked && now < ends + GRACE_MS) return null;
      const { tally, accused } = tallyVotes(votes, seat, game.settings.agents);
      const caught = Object.fromEntries(Object.keys(accused).filter(u => d.agents[u]).map(u => [u, true]));
      const ballots = Object.fromEntries(Object.entries(votes).filter(([u, x]) => seat.includes(u) && x && x.s).map(([u, x]) => [u, x.s]));
      const n = Object.keys(accused).length;
      return {
        phase: 'unmask', phaseStartAt: now, phaseEndsAt: now + UNMASK_BASE_MS + Math.max(0, n - 1) * UNMASK_EACH_MS,
        tally, accused, caught, ballots, agents: d.agents,
      };
    }

    case 'unmask': {
      if (now < ends) return null;
      if (!d) return null;
      if (Object.keys(game.caught || {}).length) return { phase: 'last', phaseStartAt: now, phaseEndsAt: now + LAST_MS };
      return toScores(game, d, {}, now);
    }

    case 'last': {
      if (!d) return null;
      const guess = live.guess || {};
      const caught = Object.keys(game.caught || {});
      const allIn = caught.every(u => (guess[u] && guess[u].t) || !present[u] || !ctx.online[u]);
      if (!allIn && now < ends + GRACE_MS) return null;
      const stolen = Object.fromEntries(caught.filter(u => guess[u] && guessRight(guess[u].t, d.word)).map(u => [u, true]));
      const guesses = Object.fromEntries(caught.map(u => [u, (guess[u] && String(guess[u].t).slice(0, 24)) || '']));
      return { ...toScores(game, d, stolen, now), guesses };
    }

    case 'scores': {
      if (now < ends) return null;
      if (game.round + 1 >= game.settings.rounds) return toFinal(now);
      // the next round: whoever is here and connected sits in (late joiners join now)
      const nextSeat = Object.keys(present).filter(u => ctx.online[u]).sort();
      const round = game.round + 1;
      const patch = { ...CLEAR, ...briefing(now), round, v: 0, rk: rkOf(round, 0), seat: nextSeat, ...named(nextSeat) };
      for (const u of nextSeat) if (!game.participants[u]) patch[`participants/${u}`] = true;
      return patch;
    }

    default:
      return null;
  }
}

function briefing(now) {
  return { phase: 'briefing', phaseStartAt: now, phaseEndsAt: now + BRIEF_MS };
}

function turn(game, order, t, now) {
  const n = order.length;
  const endsAt = now + game.settings.clueSec * 1000;
  return { turn: t, cur: order[t % n], pass: Math.floor(t / n), turnEndsAt: endsAt, phaseEndsAt: endsAt };
}

function toScores(game, d, stolen, now) {
  const res = scoreRound({ seat: game.seat, agents: d.agents, caught: game.caught || {}, stolen, votes: Object.fromEntries(Object.entries(game.ballots || {}).map(([u, s]) => [u, { s }])) });
  return {
    phase: 'scores', phaseStartAt: now, phaseEndsAt: now + SCORES_MS,
    stolen, word: d.word, cat: d.cat, agents: d.agents, lastCat: d.cat,
    [`results/${game.round}`]: res,
    [`history/${game.round}`]: { word: d.word, cat: d.cat },
    $room: { [`meta/used/agent/${wordKey(d.word)}`]: true },
  };
}

function toFinal(now) {
  return { phase: 'final', phaseStartAt: now, phaseEndsAt: now + FINAL_MS, cur: null, turnEndsAt: null };
}
