// JT2 — THE BOARD's AVERAGE (the owner, Nov 22 — docs/jaywalk.md "JT2 — THE BOARD's AVERAGE"): a RECORD board may carry an average beside its
// best (core/boards.js `avg`: { days, min }); only JAYWALK turns it on (jaywalk-solo). PURE — the server's stats step + the screens share it.
//   the box (pstats/{pid}/av/{board}) = { [streakDay "d20261122"]: [runs, total] } — the player's LAST `days` PLAYED days only (a break never empties it)
//   the AVERAGE = total / runs over those days, one decimal — shown once runs ≥ `min`, else null (a dash on THE BOARD)
export const AVG_DAYS = 14;
export const AVG_MIN = 5;

const isDay = k => /^d\d{8}$/.test(k);   // (the streak day — core/streak.js#streakDay: "d20261122")
const cleanPair = p0 => { const p = p0 && !Array.isArray(p0) && typeof p0 === 'object' ? [p0[0], p0[1]] : p0; return pair(p); };   // (RTDB may hand an array back as { 0, 1 })
const pair = p => (Array.isArray(p) && p.length === 2 && p.every(x => Number.isFinite(Number(x)) && Number(x) >= 0) ? [Math.floor(Number(p[0])), Number(p[1])] : null);

/** one counted run of `value` on streak day `day` into the box → a NEW box, the newest `days` days kept (an older day than all of them: unchanged) */
export function avgStep(box, day, value, days = AVG_DAYS) {
  const out = {};
  for (const [k, p] of Object.entries(box || {})) { const q = cleanPair(p); if (isDay(k) && q && q[0] > 0) out[k] = q; }
  if (!isDay(String(day)) || !(Number(value) >= 0)) return out;
  const d = String(day), v = Math.max(0, Math.floor(Number(value))), cur = out[d] || [0, 0];
  out[d] = [cur[0] + 1, cur[1] + v];
  const keep = Object.keys(out).sort().slice(-days);
  return Object.fromEntries(keep.map(k => [k, out[k]]));
}

/** the box → { avg (one decimal) | null, runs, days } — null under `min` runs */
export function avgOf(box, min = AVG_MIN) {
  let runs = 0, total = 0, days = 0;
  for (const [k, p] of Object.entries(box || {})) { const q = cleanPair(p); if (!isDay(k) || !q || !q[0]) continue; runs += q[0]; total += q[1]; days++; }
  return { avg: runs >= min && runs > 0 ? Math.round((total / runs) * 10) / 10 : null, runs, days };
}

/** what a screen prints for a stored average: "AVG 225" · "AVG —" (null / missing) */
export const avgLabel = v => (Number.isFinite(Number(v)) && v != null ? `AVG ${Math.round(Number(v)).toLocaleString('en-US')}` : 'AVG —');
