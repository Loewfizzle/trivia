// THE ACHIEVEMENTS' EVENTS outside a match (PROGRESSION A) — POST /api/profile { action: 'event', ev } from the player's own phone. The
// server decides what each is worth; a second time is a no-op (core/achievements.js#noteEvent):
//   knock       THE SPEAKEASY's KNOCK (the city's own secret — anyone who reads the code could knock too: a cosmetic, like the knock itself)
//   watchStart  the city came into view (THE WATCHER: the server's clock starts — a later start never moves it back)
//   watch       THE WATCHER's hour → PATIENCE PAYS, only if the server's own clock says ≥ 55 min since watchStart (≤ 6 h)
//   weather     right after a match: the REAL weather where the phone is (Vercel's IP location → /api/sky's cached Open-Meteo answer —
//               never the phone's word) is a thunderstorm → RAINMAKER / snow → SNOWED IN; only with a counted match in the last 3 h
//   birthday    PROGRESSION B: MANY HAPPY RETURNS — only when it IS the stored birthday (ppriv/{pid}/bd) in the player's zone (api/_lib/birthday.js)
// CITY SIGHTINGS are their own action (api/_lib/sightings.js).
import './catalog.js';   // (THE VAULT 1B: the server-only catalog registered before anything grants)
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { bumpOwners } from './owners.js';
import { founderOpen } from './founder.js';
import { eventStep } from '../../js/core/progress.js';
import { birthdayOf, zoneFor } from './birthday.js';
import { isBirthdayOn } from '../../js/core/birthday.js';

export const WATCH_MS = 55 * 60_000;
const PLAYED_WITHIN_MS = 3 * 3600_000;

async function apply(pid, ev, now) {
  const fOpen = await founderOpen(now).catch(() => false);
  let got = null;
  await ref(`pstats/${pid}`).transaction(cur => { got = eventStep(cur, ev, now, { founderOpen: fOpen }); return got ? got.next : undefined; });
  if (!got) return { ok: true, items: [], ach: [] };
  await bumpOwners(got.items, false, got.ach).catch(() => {});
  if (got.next.fd) await ref(`profiles/${pid}/fd`).set(true);
  return { ok: true, items: got.items, ach: got.ach };
}

/** → { ok, items, ach, why? } */
export async function progressEvent(pid, ev, { place = null, skyFor = null, tz = null, ipTz = null } = {}, now = Date.now()) {
  switch (ev) {
    case 'knock': return apply(pid, { k: 'knock' }, now);
    case 'watchStart': {
      await ref(`ppriv/${pid}/ws`).transaction(cur => (cur && now - cur < 6 * 3600_000 ? undefined : now));
      return { ok: true, items: [], ach: [] };
    }
    case 'watch': {
      const ws = await val(`ppriv/${pid}/ws`);
      if (!ws || now - ws < WATCH_MS || now - ws > 6 * 3600_000) return { ok: false, items: [], ach: [], why: 'not_yet' };
      return apply(pid, { k: 'watch' }, now);
    }
    case 'weather': {
      const last = await val(`pstats/${pid}/last`);
      if (!last || now - last > PLAYED_WITHIN_MS) return { ok: false, items: [], ach: [], why: 'no_match' };
      if (!place || !skyFor) return { ok: false, items: [], ach: [], why: 'no_place' };
      const wx = await skyFor(place, { now }).catch(() => null);
      const kind = wx && wx.kind;
      if (kind === 'storm') return apply(pid, { k: 'storm' }, now);
      if (kind === 'snow') return apply(pid, { k: 'snow' }, now);
      return { ok: true, items: [], ach: [], why: kind || 'no_weather' };
    }
    case 'birthday': {
      const bd = await birthdayOf(pid);
      if (!isBirthdayOn(bd, now, zoneFor(tz, ipTz, now))) return { ok: false, items: [], ach: [], why: 'not_today' };
      return apply(pid, { k: 'birthday' }, now);
    }
    default: throw new ApiError(400, 'bad_event');
  }
}
