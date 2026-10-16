// PULSE — authority state machine (pure). Per song:
//   load   (every phone fetches + decodes the song; ends when all online players are ready, or after LOAD_MAX_MS)
//   song   (songStartAt = 5 s ahead on server time; every phone starts its own copy at that instant)
//   echo   (optional: 3 Echo rounds, time-driven from echoStartAt)
//   standings (between songs) … final
// Scoring never waits on the network: each phone judges its own taps and publishes its stats;
// the host snapshots them into results/{si} when the song (and its Echo) ends.
import { echoPattern, echoTimeline, pickStats, ECHO_ROUNDS } from './logic.js';

export const LOAD_MAX_MS = 30_000; // room for a first-time player to calibrate (~10 s); stragglers join mid-song
export const START_LEAD_MS = 5_000;
export const SONG_GRACE_MS = 2_500;
export const ECHO_GAP_MS = 1_200;
export const STANDINGS_MS = 7_000;
export const FINAL_MS = 120_000;

export const DEFAULT_SETTINGS = { song: 'random', count: 1, diff: 'normal', echo: 'on' };

export function createGame({ matchId, settings, participants, now, seed, songs }) {
  return {
    id: 'pulse',
    matchId,
    settings,
    seed,
    participants,
    songs, // [{ id, title, artist, bpm, duration }] — what the director needs without fetching maps
    si: 0,
    sk: '0',
    phase: 'load',
    phaseStartAt: now,
    phaseEndsAt: now + LOAD_MAX_MS,
  };
}

export const echoOn = game => (game.settings && game.settings.echo) !== 'off';

export function echoPlan(game, si = game.si) {
  const song = game.songs[si];
  const patterns = Array.from({ length: ECHO_ROUNDS }, (_, r) => echoPattern(game.seed, si, r));
  return { patterns, ...echoTimeline(song.bpm, patterns) };
}

/** ctx: { now, boards: { uid: board }, online: { uid: bool } } */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'pulse') return null;
  const { now } = ctx;
  const ends = game.phaseEndsAt || 0;
  const boards = ctx.boards || {};
  const song = game.songs[game.si];
  const active = Object.keys(game.participants || {}).filter(u => ctx.online[u]);

  switch (game.phase) {
    case 'load': {
      const ready = active.length > 0 && active.every(u => boards[u] && boards[u].k === game.si && boards[u].ready);
      if (!ready && now < ends) return null;
      const songStartAt = now + START_LEAD_MS;
      return { phase: 'song', songStartAt, phaseStartAt: now, phaseEndsAt: songStartAt + Math.round(song.duration * 1000) + SONG_GRACE_MS };
    }
    case 'song': {
      if (now < ends) return null;
      const res = {};
      for (const uid of Object.keys(game.participants || {})) {
        const b = boards[uid];
        res[uid] = b && b.k === game.si ? pickStats(b) : pickStats({});
      }
      const patch = { [`results/${game.si}`]: res };
      if (echoOn(game)) {
        const echoStartAt = now + ECHO_GAP_MS;
        return { ...patch, phase: 'echo', echoStartAt, phaseStartAt: now, phaseEndsAt: echoStartAt + echoPlan(game).total };
      }
      return { ...patch, ...after(game, now) };
    }
    case 'echo': {
      if (now < ends) return null;
      const patch = {};
      for (const uid of Object.keys(game.participants || {})) {
        const b = boards[uid];
        patch[`results/${game.si}/${uid}/e`] = b && b.k === game.si ? Math.max(0, Math.min(3000, +b.e || 0)) : 0;
      }
      return { ...patch, ...after(game, now) };
    }
    case 'standings': {
      if (now < ends) return null;
      const si = game.si + 1;
      return { phase: 'load', si, sk: String(si), songStartAt: null, echoStartAt: null, phaseStartAt: now, phaseEndsAt: now + LOAD_MAX_MS };
    }
    case 'final':
      return now >= ends ? { lobby: true } : null;
    default:
      return null;
  }
}

function after(game, now) {
  const last = game.si >= game.songs.length - 1;
  return last
    ? { phase: 'final', phaseStartAt: now, phaseEndsAt: now + FINAL_MS }
    : { phase: 'standings', phaseStartAt: now, phaseEndsAt: now + STANDINGS_MS };
}
