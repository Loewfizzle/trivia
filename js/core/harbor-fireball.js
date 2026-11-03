// CITY 2.0 — THE FIREBALL, SEEDED (PROGRESSION B; PURE). Its timetable row: 'sky.fireball'. A fireball night ~perYear times a year (the
// evening's local date decides — every phone in a time zone the same), ONE big slow green-white streak at a seeded minute between `from`
// and `to` (evening hours: 25 = 1 am). screens/harbor/meteors.js flies it (clear + dark only); core/sightings.js checks a tap on it.
import { knob } from './harbor-schedule.js';
import { hashString, rngFrom } from './rng.js';

/** tonight's fireball (y, m, d = the EVENING's local date) → { h (the evening's hour), len (s), dir (±1), x (0..1 across), y (0..1 down the sky) } | null */
export function fireballOf(y, m, d) {
  const F = knob('sky.fireball');
  const r = rngFrom(hashString(`fireball|${y}-${m}-${d}`));
  if (r() >= F.perYear / 365) return null;
  const h = Math.round((F.from + r() * (F.to - F.from)) * 3600) / 3600;
  return { h, len: F.len, dir: r() < 0.5 ? 1 : -1, x: 0.1 + r() * 0.8, y: 0.05 + r() * 0.5 };
}
