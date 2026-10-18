// RUMRUNNER — the pure director: intro → (dawn → day → night) × days → final.
//   dawn:  the day and its weather are revealed; everyone's truck arrives where they chose (7.2 s; 5.2 s on day 1)
//   day:   events, trading, paying Vale, the stash, upgrades, tip-offs, the destination; the host's timer (30/45/60 s),
//          over early once every connected player has tapped DONE (public flags in rrpub/{m}/{d}/{uid})
//   night: the host reads everyone's private day logs (rrp/, readable by the host only now) and writes tomorrow:
//          prices moved by the day's trades, arrivals, who was tipped off, the net worths — or the books and the final
// The director itself only moves the clock; what the night writes is logic.js#resolveNight (host duty in index.js).
import { MS, firstDay, DEFAULT_SETTINGS, START_CASH, START_DEBT, citySeed } from './logic.js';

export function createGame({ matchId, participants, now, settings = {}, secret = '' }) {
  const s = { days: Number(settings.days) || DEFAULT_SETTINGS.days, daySec: Number(settings.daySec) || DEFAULT_SETTINGS.daySec };
  return {
    id: 'rum', matchId, participants, settings: s,
    n0: Object.keys(participants).length,
    day: 1, dk: '1', phase: 'intro', phaseStartAt: now, phaseEndsAt: now + MS.intro,
    days: { 1: firstDay(citySeed(matchId, secret), s.days, participants) },
    nw: Object.fromEntries(Object.keys(participants).map(u => [u, START_CASH - START_DEBT])),
    nwh: {},
  };
}

const activeUids = (game, online) => Object.keys(game.participants || {}).filter(u => !online || online[u] !== false);

export function nextStep(game, ctx) {
  const { now, live = {}, online = null } = ctx;
  switch (game.phase) {
    case 'intro':
      return now >= game.phaseEndsAt ? { phase: 'dawn', phaseStartAt: now, phaseEndsAt: now + MS.dawn1 } : null;
    case 'dawn':
      return now >= game.phaseEndsAt ? { phase: 'day', phaseStartAt: now, phaseEndsAt: now + game.settings.daySec * 1000 } : null;
    case 'day': {
      const pub = live.pub || {};
      const act = activeUids(game, online);
      const all = act.length > 0 && act.every(u => pub[u] && pub[u].done);
      if (now < game.phaseEndsAt && !all) return null;
      return { phase: 'night', phaseStartAt: now, phaseEndsAt: now + MS.night };
    }
    case 'night': {
      // the host's resolution writes days/{d+1} (or books + final): until then, the city sleeps
      const last = game.day >= game.settings.days;
      const ready = last ? !!game.final : !!(game.days && game.days[game.day + 1]);
      if (!ready || now < game.phaseEndsAt) return null;
      if (last) return { phase: 'final', phaseStartAt: now, phaseEndsAt: null };
      return { day: game.day + 1, dk: String(game.day + 1), phase: 'dawn', phaseStartAt: now, phaseEndsAt: now + MS.dawn };
    }
    default:
      return null;
  }
}
