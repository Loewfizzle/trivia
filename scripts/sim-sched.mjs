// SCHED — THE SCHEDULE SIM (pure, no browser): a year of THE SHOWCASE at each dial level (core/harbor-showcase.js — the code the city runs)
// → the odds a ~45-s visit at a random prime-time moment (6–11 pm) catches a legendary (weeknights · party nights), the legendaries a night
// by weekday, the same one twice in a night (must be 0), the gaps between medium moments in prime time, the conflicts (a legendary over the
// fireworks' minutes, two legendaries closer than the gap — must be 0).  node scripts/sim-sched.mjs [--json]   (tests/harbor-showcase.test.mjs)
import { legendsTonight, mediumDay, SHOWCASE_LEVELS, showcaseOf } from '../js/core/harbor-showcase.js';
import { knob } from '../js/core/harbor-schedule.js';
import { partyDow } from '../js/core/party.js';

const VISIT = 45, PRIME = [18, 23];
const isParty = (y, m, d) => { const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(), pd = partyDow(y, m, d, dow); return pd === 5 || pd === 6; };
/** the share of prime-time moments from which a VISIT-s visit overlaps one of the night's legendaries (exact: the union of [h0 − V, h1]) */
function catchOdds(list) {
  const span = (PRIME[1] - PRIME[0]) * 3600, iv = list.map(L => [Math.max(PRIME[0] * 3600, L.h * 3600 - VISIT), Math.min(PRIME[1] * 3600, L.h * 3600 + L.len)]).filter(([a, b]) => b > a).sort((u, v) => u[0] - v[0]);
  let cov = 0, cur = null; for (const [a, b] of iv) { if (!cur || a > cur[1]) { if (cur) cov += cur[1] - cur[0]; cur = [a, b]; } else cur[1] = Math.max(cur[1], b); } if (cur) cov += cur[1] - cur[0];
  return cov / span;
}
export function simYear(level, { from = Date.UTC(2026, 10, 1), days = 365 } = {}) {
  const S = { level, nights: 0, byDow: Array.from({ length: 7 }, () => ({ n: 0, legends: 0 })), week: { odds: 0, n: 0, legends: 0 }, party: { odds: 0, n: 0, legends: 0 }, twice: 0, fwClash: 0, tooClose: 0, kinds: {}, months: {}, medGaps: [], medPrimePerHour: 0, medDays: 0 };
  const gap = showcaseOf(level).legend.gap, Fw = [knob('fireworks.show'), knob('fireworks.party')];
  for (let i = 0; i < days; i++) {
    const u = new Date(from + i * 864e5), y = u.getUTCFullYear(), m = u.getUTCMonth() + 1, d = u.getUTCDate(), dow = u.getUTCDay(), party = isParty(y, m, d);
    const L = legendsTonight(y, m, d, level);
    S.nights++; S.byDow[dow].n++; S.byDow[dow].legends += L.length;
    const bin = party ? S.party : S.week; bin.n++; bin.legends += L.length; bin.odds += catchOdds(L);
    if (new Set(L.map(x => x.kind)).size !== L.length) S.twice++;
    for (const x of L) { S.kinds[x.kind] = (S.kinds[x.kind] || 0) + 1; const mk = `${m}`; S.months[mk] = S.months[mk] || {}; S.months[mk][x.kind] = (S.months[mk][x.kind] || 0) + 1; }
    const show = party ? Fw[1] : Fw[0];
    for (const x of L) if (x.h + x.len / 3600 > show.at && x.h < show.at + show.dur[1] / 3600) S.fwClash++;
    for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) if (Math.abs(L[a].h - L[b].h) < gap - 1e-9) S.tooClose++;
    // the medium tier in prime time: the gaps between moments (s) + the rate
    const day0 = Date.UTC(y, m - 1, d) / 1000, md = mediumDay(`${y}-${m}-${d}`, day0, dow, { level }).filter(e => { const h = (e.t - day0) / 3600; return h >= PRIME[0] && h < PRIME[1]; });
    for (let k = 1; k < md.length; k++) S.medGaps.push(md[k].t - md[k - 1].t);
    S.medPrimePerHour += md.length / (PRIME[1] - PRIME[0]); S.medDays++;
  }
  const g = S.medGaps.sort((a, b) => a - b), q = p => (g.length ? g[Math.floor(p * (g.length - 1))] : 0);
  return {
    level, weeknight: { legendsPerNight: +(S.week.legends / S.week.n).toFixed(2), visitOdds: +(S.week.odds / S.week.n).toFixed(4), oneIn: Math.round(S.week.n / S.week.odds) },
    party: { legendsPerNight: +(S.party.legends / S.party.n).toFixed(2), visitOdds: +(S.party.odds / S.party.n).toFixed(4), oneIn: Math.round(S.party.n / S.party.odds) },
    byDow: S.byDow.map(b => +(b.legends / b.n).toFixed(2)), twice: S.twice, fwClash: S.fwClash, tooClose: S.tooClose, kinds: S.kinds, months: S.months,
    medium: { primePerHour: +(S.medPrimePerHour / S.medDays).toFixed(1), gapMedianMin: +(q(0.5) / 60).toFixed(1), gapP90Min: +(q(0.9) / 60).toFixed(1) },
  };
}
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('sim-sched.mjs')) {
  const out = SHOWCASE_LEVELS.map(lv => simYear(lv));
  if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
  else for (const r of out) console.log(`${r.level.toUpperCase().padEnd(7)} weeknight ${r.weeknight.legendsPerNight} legendaries · a visit 1 in ${r.weeknight.oneIn} | party night ${r.party.legendsPerNight} · 1 in ${r.party.oneIn} | by weekday (Sun→Sat) ${r.byDow.join(' ')} | twice ${r.twice} · over the fireworks ${r.fwClash} · too close ${r.tooClose} | medium ${r.medium.primePerHour}/h in prime time, gaps median ${r.medium.gapMedianMin} min (p90 ${r.medium.gapP90Min}) | a year: ${Object.entries(r.kinds).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}
