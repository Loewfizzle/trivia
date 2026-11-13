// PD-6 ADD-ON — THE SOLO PODIUM SAYS WHAT IT PAID (Ben, Nov 13 4:30 pm). PURE (no imports — a NEW module, so the lazy podium chunk that reads it
// never meets a stale boot module: THE STALE-MODULE RULE). The solo lane pays SOLO_XP for the first SOLO_DAY_XP solo runs of a streak day
// (core/ranks.js#soloXp), then 0; the SERVER's outcome carries this run's place in that count as `so` = { n, max } (core/progress.js#step →
// api/_lib/stats.js#applyMatch). The podium's ONE line comes from that outcome only — never computed on the phone; no count = no line.
const num = n => Math.round(n).toLocaleString('en-US');

/** outcome → "+15 XP · SOLO RUN · 3 OF 4 TODAY" while it pays · "TODAY’S SOLO XP DONE · MORE AT 4 AM" once it doesn't · null (no count yet, a
 *  skipped outcome, an older server) */
export function soloXpText(o) {
  const so = o && !o.skip && o.so;
  if (!so || !(Number(so.n) >= 1) || !(Number(so.max) >= 1)) return null;
  const gain = Number(o.xp && o.xp.gain) || 0;
  return gain > 0 ? `+${num(gain)} XP · SOLO RUN · ${Math.min(Number(so.n), Number(so.max))} OF ${Number(so.max)} TODAY` : 'TODAY’S SOLO XP DONE · MORE AT 4 AM';
}
