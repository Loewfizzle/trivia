// BIRTHDAYS on the server (PROGRESSION B) — POST /api/profile:
//   birthday      { m, d } | { m: null, d: null } → { bd, until }   set / clear (ppriv/{pid}/bd — private, never public); ONCE A YEAR
//   event 'birthday' (api/_lib/events.js) → MANY HAPPY RETURNS, only when it IS the stored birthday in the player's zone (the IP's —
//                 the phone's own zone within an hour of it)
//   birthdayRoom  { room, tz } → the room's skywrite "HAPPY BDAY <NAME>" (rooms/{CODE}/radio — once a day a room; DORMANT until LOBBY 2.0
//                 makes the lobby the live city: its phones play it then)
import { ApiError } from './http.js';
import { ref, val } from './fb.js';
import { cleanBirthday, canChangeBirthday, isBirthdayOn, dayKeyOf, bdayText } from '../../js/core/birthday.js';
import { localParts } from '../../js/core/sky.js';
import { knob } from '../../js/core/harbor-schedule.js';
import { jackDef } from '../../js/core/harbor-radio.js';

const validZone = tz => { try { if (!tz || typeof tz !== 'string' || tz.length > 64) return false; new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; } };
/** the zone to judge "today" in: the phone's, if it's within an hour of the IP's (else the IP's); no IP zone → the phone's */
export function zoneFor(tz, ipTz, now) {
  const ok = validZone(tz), ipOk = validZone(ipTz);
  if (ok && ipOk && Math.abs(localParts(now, tz).off - localParts(now, ipTz).off) > 60) return ipTz;
  return ok ? tz : ipOk ? ipTz : 'America/New_York';
}

export async function setBirthday(pid, body, now = Date.now()) {
  const c = cleanBirthday(body.m, body.d);
  if (c.bad) throw new ApiError(400, c.bad, 'That date doesn’t exist.');
  const prev = await val(`ppriv/${pid}/bd`);
  if (prev && c.bd && prev.m === c.bd.m && prev.d === c.bd.d && !prev.off) return { bd: { m: prev.m, d: prev.d }, until: canChangeBirthday(prev, now).until };
  const ch = canChangeBirthday(prev, now);
  if (!ch.ok) throw new ApiError(429, 'once_a_year', 'A birthday changes once a year.', { until: ch.until });
  // (clearing it counts as a change too — no farming by clear + set)
  await ref(`ppriv/${pid}/bd`).set(c.bd ? { m: c.bd.m, d: c.bd.d, at: now } : { off: true, at: now });
  return { bd: c.bd, until: now + (canChangeBirthday({ at: now }, now).until - now) };
}
/** the stored birthday (a cleared one → null) */
export async function birthdayOf(pid) { const b = await val(`ppriv/${pid}/bd`); return b && !b.off && b.m ? { m: b.m, d: b.d } : null; }

export async function birthdayRoom(pid, uid, body, { ipTz = null } = {}, now = Date.now()) {
  const room = String(body.room || '').toUpperCase();
  if (!/^[A-Z]{4}$/.test(room)) throw new ApiError(400, 'bad_room');
  const bd = await birthdayOf(pid);
  const tz = zoneFor(body.tz, ipTz, now);
  if (!isBirthdayOn(bd, now, tz)) return { ok: false, why: 'not_today' };
  const me = await val(`rooms/${room}/players/${uid}`);
  if (!me) throw new ApiError(403, 'not_in_room', 'Only in the room you are in.');
  const key = `${dayKeyOf(now, tz)}_${room}`;
  let fresh = false;
  await ref(`ppriv/${pid}/bdr/${key}`).transaction(cur => { if (cur) { fresh = false; return undefined; } fresh = true; return now; });
  if (!fresh) return { ok: true, again: true };
  const id = ref(`rooms/${room}/radio`).push().key, len = (jackDef('skywrite').len || 80) * 1000, lead = (knob('radio').lead.room || 3) * 1000;
  const m = { id, jack: 'skywrite', at: now + lead, until: now + lead + len, text: bdayText(me.name), colour: 'ff6fd0', show: null, dance: null, local: null, aud: 'room', state: 'q', by: 'bday' };
  await ref(`rooms/${room}/radio/${id}`).set(m);
  return { ok: true, moment: m };
}
