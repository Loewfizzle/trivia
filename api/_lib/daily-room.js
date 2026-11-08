// THE DAILY MODULE in a room (DM1 — server side; DM2 draws the banner, the RESUME chip and the host's "N players are mid-daily"):
//   THE ROOM WINS: a daily PAUSE is accepted only when the player's room has REALLY started a game — read here from the room itself
//     (rooms/{CODE}/meta: status 'playing', or THE GAME START's stamp meta/go fresh — the walk inside before the status flips) and the player
//     really in it (players/{uid} — this device — or a player node carrying their profile id). The room = the call's `room` code, else the
//     profile's seat (seats/{pid} — ONE ACCOUNT, ONE ROOM). Anything else → refused (the clock keeps running).
//   MID-DAILY: which players of a room have a daily run in flight (a start, no result) — their uids ONLY: never which daily, never the run.
import { val } from './fb.js';
import { streakDay, dayNum, dayOf } from '../../js/core/streak.js';

export const GO_FRESH_MS = 120_000;
const CODE = /^[A-Z]{4}$/;

/** has `code`'s room started a game, with this player in it? → the code, or null */
export async function roomStarted({ uid, pid, code, now = Date.now() }) {
  let c = typeof code === 'string' && CODE.test(code) ? code : null;
  if (!c && pid) { const seat = await val(`seats/${pid}`).catch(() => null); if (seat && CODE.test(String(seat.code || ''))) c = seat.code; }
  if (!c) return null;
  const [meta, players] = await Promise.all([val(`rooms/${c}/meta`), val(`rooms/${c}/players`)]);
  if (!meta || !players) return null;
  const inIt = !!players[uid] || (!!pid && Object.values(players).some(p => p && p.pid === pid));
  const go = meta.go && Number(meta.go.at);
  const started = meta.status === 'playing' || (!!go && now - go >= -5000 && now - go <= GO_FRESH_MS);
  return inIt && started ? c : null;
}

/** the players of `code` with a daily in flight (today's start without a result, or yesterday's when today has none — the run a phone resumes) */
export async function midDaily({ uid, code, games, now = Date.now() }) {
  if (typeof code !== 'string' || !CODE.test(code)) return null;
  const players = await val(`rooms/${code}/players`);
  if (!players || !players[uid]) return null;                   // (only someone in the room may ask)
  const today = streakDay(now), prev = dayOf(dayNum(today) - 1);
  const mid = [];
  await Promise.all(Object.entries(players).map(async ([u, p]) => {
    const pid = p && p.pid;
    if (!pid || !/^p[a-z2-9]{11}$/.test(pid)) return;
    const flags = await Promise.all(games.map(async g => {
      const [s, r, s0, r0] = await Promise.all([val(`dly/${g}/${today}/s/${pid}`), val(`dly/${g}/${today}/r/${pid}`), val(`dly/${g}/${prev}/s/${pid}`), val(`dly/${g}/${prev}/r/${pid}`)]);
      return (s && r == null) || (!s && s0 && r0 == null);
    }));
    if (flags.some(Boolean)) mid.push(u);
  }));
  return mid.sort();
}
