// The admin page's STATS (docs/profiles.md "Stats"), PURE: everything is computed from data the server already keeps —
//   rooms/{CODE}            live: who is connected, which game is running (open rooms only; idle rooms close after an hour)
//   results/{key}           every counted match: { st: 'done', at, g, mode, n (players), o: { pid: outcome } }
//   gplay/{all|w…}/{game}   matches per game (all time / this week; api/_lib/activity.js)
//   profiles/{pid}          { n, t, a, c, x (XP), r (rank), at (created), h (hidden) }
// Days, weeks and hours are Eastern time, like THE BOARD's weeks. Only matches the server verified are counted
// (that's nearly every match; none before profiles went live in Oct 2026).
import { dayKey, weekKey, easternParts } from './week.js';

const DAY = 86_400_000;
const pad = n => String(n).padStart(2, '0');

/** The last n Eastern day keys, oldest first, ending today (calendar arithmetic, so DST never skips a day). */
export function lastDays(now, n) {
  const p = easternParts(now);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(p.y, p.m - 1, p.d - i));
    out.push(`d${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`);
  }
  return out;
}

/** The last n week keys, oldest first, ending this week. */
export function lastWeeks(now, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const k = weekKey(now - i * 7 * DAY); if (!out.includes(k)) out.push(k); }
  return out;
}

/** PURE: live rooms → { online, rooms, playing: { game: rooms }, list: [...] } (no room codes, no names). */
export function liveRooms(rooms, now) {
  const list = [];
  for (const r of Object.values(rooms || {})) {
    if (!r || !r.meta) continue;
    const presence = r.presence || {};
    const players = r.players || {};
    const online = Object.keys(players).filter(u => presence[u] && presence[u].online).length;
    if (!online) continue;
    const playing = r.meta.status === 'playing' && r.game && r.game.id ? r.game.id : null;
    list.push({ online, players: Object.keys(players).length, game: playing, phase: playing ? r.game.phase || null : null, age: Math.max(0, now - (r.meta.createdAt || now)) });
  }
  list.sort((a, b) => b.online - a.online || a.age - b.age);
  const playing = {};
  for (const x of list) if (x.game) playing[x.game] = (playing[x.game] || 0) + 1;
  return { online: list.reduce((s, x) => s + x.online, 0), rooms: list.length, playing, list };
}

/** PURE: the whole STATS panel. */
export function summarize({ results = {}, profiles = {}, rooms = {}, gplay = {}, now = Date.now(), topN = 10 } = {}) {
  const done = Object.values(results || {}).filter(r => r && r.st === 'done' && r.g && r.at);
  const wk = weekKey(now);
  const days30 = lastDays(now, 30);
  const day30Set = new Set(days30);
  const since90 = now - 90 * DAY;

  // ---- games
  const daily = Object.fromEntries(days30.map(k => [k, 0]));
  const today = dayKey(now), todayGames = {};
  const last30 = {}, playersSum = {}, playersN = {};
  // ---- players: matches per pid (this week / all time) and the days they played
  const weekCount = {}, allCount = {}, dayCount = {}, daysOf = {};
  // ---- busiest times: weekday × hour, last 90 days
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const r of done) {
    const dk = dayKey(r.at);
    if (day30Set.has(dk)) { daily[dk]++; last30[r.g] = (last30[r.g] || 0) + 1; }
    const isToday = dk === today;
    if (isToday) todayGames[r.g] = (todayGames[r.g] || 0) + 1;
    const n = Number(r.n) || Object.keys(r.o || {}).length;
    if (n) { playersSum[r.g] = (playersSum[r.g] || 0) + n; playersN[r.g] = (playersN[r.g] || 0) + 1; }
    if (r.at >= since90) { const p = easternParts(r.at); grid[p.dow][p.h]++; }
    const thisWeek = weekKey(r.at) === wk;
    for (const pid of Object.keys(r.o || {})) {
      allCount[pid] = (allCount[pid] || 0) + 1;
      if (thisWeek) weekCount[pid] = (weekCount[pid] || 0) + 1;
      if (isToday) dayCount[pid] = (dayCount[pid] || 0) + 1;
      (daysOf[pid] ||= new Set()).add(dk);
    }
  }
  const avgPlayers = Object.fromEntries(Object.keys(playersN).map(g => [g, Math.round((playersSum[g] / playersN[g]) * 10) / 10]));

  // ---- players
  const who = pid => {
    const p = profiles[pid] || {};
    return { pid, n: p.n || 'Player', t: p.t || null, a: p.a || null, c: p.c || null, r: p.r || 0, x: p.x || 0, h: !!p.h };
  };
  const topWeek = Object.entries(weekCount).sort((a, b) => b[1] - a[1] || (allCount[b[0]] || 0) - (allCount[a[0]] || 0)).slice(0, topN).map(([pid, n]) => ({ ...who(pid), n_matches: n }));
  const topToday = Object.entries(dayCount).sort((a, b) => b[1] - a[1] || (allCount[b[0]] || 0) - (allCount[a[0]] || 0)).slice(0, topN).map(([pid, n]) => ({ ...who(pid), n_matches: n }));
  const topAll = Object.entries(allCount).sort((a, b) => b[1] - a[1]).slice(0, topN).map(([pid, n]) => ({ ...who(pid), n_matches: n }));
  const topXp = Object.entries(profiles || {}).filter(([, p]) => p && p.x).sort((a, b) => (b[1].x || 0) - (a[1].x || 0)).slice(0, topN).map(([pid]) => ({ ...who(pid), n_matches: allCount[pid] || 0 }));
  const weeks8 = lastWeeks(now, 8);
  const newByWeek = weeks8.map(k => ({ wk: k, n: 0 }));
  const wIdx = Object.fromEntries(weeks8.map((k, i) => [k, i]));
  for (const p of Object.values(profiles || {})) if (p && p.at && wIdx[weekKey(p.at)] != null) newByWeek[wIdx[weekKey(p.at)]].n++;
  const activeWeek = Object.keys(weekCount).length, activeToday = Object.keys(dayCount).length;
  const matchesToday = daily[today] || 0;
  // came back: played this week AND on a day before it (a week key is its Monday's date: w20261019 → d20261019)
  const monday = 'd' + wk.slice(1);
  const returningWeek = Object.keys(weekCount).filter(pid => [...(daysOf[pid] || [])].some(d => d < monday)).length;
  const multiNight = Object.values(daysOf).filter(s => s.size >= 2).length;

  const live = liveRooms(rooms, now);
  return {
    at: now,
    live,
    today: { matches: matchesToday, players: activeToday },
    totals: { matches: done.length, players: Object.keys(profiles || {}).length, played: Object.keys(allCount).length, multiNight },
    games: { today: todayGames, week: (gplay && gplay.week) || {}, all: (gplay && gplay.all) || {}, last30, avgPlayers, daily: days30.map(k => ({ k, n: daily[k] })) },
    players: { activeToday, activeWeek, returningWeek, newByWeek, topToday, topWeek, topAll, topXp },
    times: { grid, max: Math.max(0, ...grid.flat()), days: 90 },
  };
}

