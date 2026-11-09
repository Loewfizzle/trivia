// BOARD 2.0 A — THE BOARDS' SIMULATION: 40 bots with mixed habits through 2 weeks of THE DAILIES, run through the SERVER's OWN pure steps
// (core/progress.js#dailyStep with the points core/daily-points.js#dailyPoints gives the stored score) → each board's order (core/overall.js
// — what lb/ holds) against a HAND-COMPUTED one (plain sums + averages from the bots' own diaries, no project code). tests/board-points.test.mjs
// runs it; `node scripts/sim-board.mjs` prints the numbers for the pass log (the points table, the spread, the top of each board).
import { dailyStep } from '../js/core/progress.js';
import { overallValues } from '../js/core/overall.js';
import { dailyPoints, POINTS, MIN_DAYS, ALL_TIME_RULE } from '../js/core/daily-points.js';
import { rngFrom } from '../js/core/rng.js';
import { dayOf, dayNum, dayStartAt } from '../js/core/streak.js';
import { weekKey } from '../js/core/week.js';

const GAMES = ['password', 'coastclear'];
// the habits: how often a bot plays a day, how good it is (a skill 0..1), how often it plays only one of the two
const HABITS = [
  { name: 'daily', p: 1, one: 0 }, { name: 'most days', p: 0.8, one: 0.1 }, { name: 'weekends', p: 0.3, one: 0.3 },
  { name: 'password only', p: 0.9, one: 1, only: 'password' }, { name: 'coast only', p: 0.9, one: 1, only: 'coastclear' }, { name: 'dabbler', p: 0.45, one: 0.5 },
];
/** a bot's score for a game at a skill (0..1) — scores a real run makes */
function scoreOf(game, skill, r) {
  if (game === 'password') {
    const lose1 = r() < 0.18 * (1 - skill), lose2 = r() < 0.25 * (1 - skill);
    if (lose1) return 206;
    const g1 = 1 + Math.floor(r() * (6 - 4 * skill) + (1 - skill) * 1.5);
    const a = Math.min(6, Math.max(1, g1));
    if (lose2) return 100 + a + 6;
    const b = Math.min(6, Math.max(1, 1 + Math.floor(r() * (6 - 4 * skill) + (1 - skill) * 1.5)));
    return a + b;
  }
  const caught = r() < 0.28 * (1 - skill);
  if (caught) return 10000 + 1 + Math.floor(r() * 80);
  const t = 45 + (1 - skill) * 160 * (0.6 + 0.8 * r()) + (r() < 0.3 ? 30 : 0);
  return Math.round(t);
}

export function simulate({ bots = 40, days = 14, seed = 'board', start = 'd20261109' } = {}) {
  const r = rngFrom(`sim-board:${seed}`);
  const B = Array.from({ length: bots }, (_, i) => ({ id: `b${String(i).padStart(2, '0')}`, habit: HABITS[i % HABITS.length], skill: r(), stats: null, diary: [] }));
  const day0 = dayNum(start);
  for (let k = 0; k < days; k++) {
    const day = dayOf(day0 + k), t0 = dayStartAt(day) + 5 * 3600e3;   // (9 am Eastern on the day)
    for (const b of B) {
      if (r() > b.habit.p) continue;
      const games = b.habit.only ? [b.habit.only] : r() < b.habit.one ? [GAMES[Math.floor(r() * 2)]] : GAMES;
      games.forEach((g, i) => {
        const score = scoreOf(g, b.skill, r), pts = dailyPoints(g, score);
        b.diary.push({ day, game: g, pts });
        const res = dailyStep(b.stats, { game: g, day, now: t0 + i * 600e3, today: GAMES, counts: true, points: pts });
        if (!res.skip) b.stats = res.next;
      });
    }
  }
  const last = dayStartAt(dayOf(day0 + days - 1)) + 12 * 3600e3, wk = weekKey(last);   // (4 pm on the last day)
  // THE HAND-COMPUTED ORDER (no project code but the week key): the week's sum; the average = points ÷ (span days | days played)
  const hand = {}, server = {};
  for (const board of ['daily', ...GAMES.map(g => `daily-${g}`)]) {
    const g = board === 'daily' ? null : board.slice(6);
    const rows = B.map(b => {
      const mine = b.diary.filter(e => !g || e.game === g);
      const week = mine.filter(e => weekKey(dayStartAt(e.day) + 12 * 3600e3) === wk).reduce((a, e) => a + e.pts, 0);
      const ds = [...new Set(mine.map(e => e.day))].sort(), tot = mine.reduce((a, e) => a + e.pts, 0);
      const span = ds.length ? dayNum(ds[ds.length - 1]) - dayNum(ds[0]) + 1 : 0;
      const avg = ds.length ? tot / (ALL_TIME_RULE === 'span' ? span : ds.length) : null;
      return { id: b.id, week, all: ds.length >= MIN_DAYS ? Math.round(avg * 100) : null };
    });
    const order = (k) => rows.filter(x => x[k] > 0).sort((a, b) => b[k] - a[k] || (a.id < b.id ? -1 : 1)).map(x => `${x.id}:${x[k]}`);
    hand[board] = { week: order('week'), all: order('all') };
    const sv = B.map(b => { const v = overallValues(b.stats, last)[board]; return { id: b.id, week: v.week, all: v.all }; });
    server[board] = { week: sv.filter(x => x.week > 0).sort((a, b) => b.week - a.week || (a.id < b.id ? -1 : 1)).map(x => `${x.id}:${x.week}`),
      all: sv.filter(x => x.all > 0).sort((a, b) => b.all - a.all || (a.id < b.id ? -1 : 1)).map(x => `${x.id}:${x.all}`) };
  }
  return { hand, server, bots: B, wk };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/').replace(/^\//, '')}`) {
  console.log('DAILY POINTS — the table (core/daily-points.js):');
  for (const [g, row] of Object.entries(POINTS)) console.log(`  ${g}: best ${dailyPoints(g, row.best)} · the worst win ${dailyPoints(g, row.worstWin)} · lost ${dailyPoints(g, row.lost)} · not played 0  (${row.label})`);
  const pw = [2, 3, 4, 6, 8, 10, 12].map(s => `${s} → ${dailyPoints('password', s)}`).join(' · ');
  const pw1 = [107, 108, 110, 112].map(s => `${s} → ${dailyPoints('password', s)}`).join(' · ');
  const cc = [30, 45, 53, 64, 79, 98, 118, 150, 240, 400, 900, 2000].map(s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} → ${dailyPoints('coastclear', s)}`).join(' · ');
  console.log(`  THE PASSWORD, both doors: ${pw}\n  THE PASSWORD, one door: ${pw1} · locked out at the first: ${dailyPoints('password', 206)}`);
  console.log(`  COAST CLEAR, cleared: ${cc}\n  COAST CLEAR, caught: 1 cell opened → ${dailyPoints('coastclear', 10089)} · half → ${dailyPoints('coastclear', 10045)} · all but 1 → ${dailyPoints('coastclear', 10001)}`);
  const { hand, server, wk } = simulate();
  console.log(`\nTHE SIMULATION — 40 bots, 2 weeks (ALL TIME = ${ALL_TIME_RULE}, ranked from ${MIN_DAYS} days), this week ${wk}:`);
  for (const b of Object.keys(hand)) {
    const same = JSON.stringify(hand[b]) === JSON.stringify(server[b]);
    console.log(`  ${b}: ${same ? 'MATCHES the hand-computed order' : 'DIFFERS'} — THIS WEEK ${server[b].week.length} ranked (top: ${server[b].week.slice(0, 3).join(', ')}) · ALL TIME ${server[b].all.length} ranked (top: ${server[b].all.slice(0, 3).join(', ')})`);
  }
}
