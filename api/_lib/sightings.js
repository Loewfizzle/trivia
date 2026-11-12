// CITY SIGHTINGS on the server (PROGRESSION B) — POST /api/profile { action: 'sighting', id, t, tz } from the player's own phone after a TAP.
// The phone's word is only WHAT + WHEN + its zone: everything that decides it is the server's (core/sightings.js#verifySighting) — the
// place by IP (Vercel's headers), the IP's zone, the showcase dial (city2/showcase), NOAA's Kp, the radio's fired-moment record
// (radio/fired — the owner's to a real audience, once a day; the crew's never), the rooms the player is in, THE WATCHER's start. A true
// claim → ONE count per appearance (ppriv/{pid}/sgk/{key} — tapping the same UFO ten times is one sighting) → core/progress.js#eventStep
// ({ k: 'sighting', id }) in ONE transaction on pstats/{pid}: the counters (pa.sg, pa.sgt), the MATCHED PAIR the first time
// (core/achievements.js#awardAll), STARGAZER / FREQUENT FLYER / THE WITNESS. Clients never write any of it (database.rules.json).
import './catalog.js';   // (THE VAULT 1B: the server-only catalog registered before anything grants)
import { ref, val } from './fb.js';
import { bumpOwners } from './owners.js';
import { founderOpen } from './founder.js';
import { eventStep } from '../../js/core/progress.js';
import { verifySighting, SIGHTING, QUEUE_MS } from '../../js/core/sightings.js';

const PUSH = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
/** a push id's first 8 characters for a moment (Firebase's push ids start with their time) — radio/fired read from here on */
export function pushPrefix(ms) { let n = Math.max(0, Math.floor(ms)), s = ''; for (let i = 0; i < 8; i++) { s = PUSH[n % 64] + s; n = Math.floor(n / 64); } return s; }
/** the keys ppriv keeps: a database key can't hold . # $ [ ] / */
const safeKey = k => String(k).replace(/[.#$[\]/]/g, '_').slice(0, 120);
/** AT A TIME can start a moment up to a day after it was made: the record is read from its made-time (its push id) a day + the queue back */
const FIRED_BACK_MS = 26 * 3600e3 + QUEUE_MS;
/** the count's memory (one key per appearance) — older keys pruned when a new one is written */
const KEEP_KEYS_MS = 3 * 864e5;

const header = (req, k) => { const v = req && req.headers ? req.headers[k] : null; return v == null ? null : decodeURIComponent(String(v)); };

/** the radio's records near t (only when the sighting has jacks) */
async function firedNear(t) {
  const snap = await ref('radio/fired').orderByKey().startAt(pushPrefix(t - FIRED_BACK_MS)).limitToFirst(200).once('value');
  const out = [];
  snap.forEach(c => { const v = c.val(); if (v) out.push({ id: c.key, ...v }); });
  return out;
}

/**
 * → { ok: true, counted, again?, n (this one's count), total, first, items, ach, via } | { ok: false, why }
 * o: { req (for the place + zone headers), place (tests), ipTz (tests), kpNow, skyFor }
 */
export async function claimSighting(pid, uid, body, o = {}, now = Date.now()) {
  const id = String(body.id || ''), t = Number(body.t), tz = String(body.tz || '').slice(0, 64);
  const row = SIGHTING[id];
  if (!row) return { ok: false, why: 'unknown' };
  const place = o.place !== undefined ? o.place : (o.placeOf && o.req ? o.placeOf(o.req) : null);
  const ipTz = o.ipTz !== undefined ? o.ipTz : header(o.req, 'x-vercel-ip-timezone');
  const [level, kp, fired, watchStart, open] = await Promise.all([
    val('city2/showcase').catch(() => null),
    id === 'aurora' && o.kpNow ? o.kpNow({ now }).catch(() => null) : null,
    row.jacks.length && Number.isFinite(t) ? firedNear(t).catch(() => []) : [],
    id === 'blackbird' ? val(`ppriv/${pid}/ws`).catch(() => null) : null,
    val(`ppriv/${pid}/co`).catch(() => null),   // (FR7 FIXES B: the city-open stamp — radio.js#hello)
  ]);
  // the rooms the player is in (only the rooms a fired moment named)
  const rooms = [];
  for (const code of new Set((fired || []).filter(f => f.aud === 'room' && f.room).map(f => f.room))) {
    if (await val(`rooms/${code}/players/${uid}`).catch(() => null)) rooms.push(code);
  }
  const v = verifySighting({ id, t, tz }, { now, ipTz, place, level: typeof level === 'string' ? level : null, kp, fired, rooms, watchStart, open });
  if (!v.ok) return { ok: false, why: v.why };
  // the same appearance tapped again is still that ONE sighting (a reaction, never a second count)
  const stats0 = () => val(`pstats/${pid}/pa`).catch(() => null);
  const again = async () => { const st = await stats0(); return { ok: true, counted: false, again: true, n: (st && st.sg && st.sg[id]) || 0, total: (st && st.sgt) || 0, first: false, items: [], ach: [], via: v.via }; };
  if (await val(`ppriv/${pid}/sgk/${safeKey(v.key)}`).catch(() => null)) return again();
  // the radio's once-a-day (any legendary the owner fired)
  if (v.via === 'radio') {
    let fresh = false;
    await ref(`ppriv/${pid}/sgr/${safeKey(v.day)}`).transaction(cur => { if (cur) { fresh = false; return undefined; } fresh = true; return now; });
    if (!fresh) return { ok: false, why: 'radio_today' };
  }
  // ONE count per appearance (a transaction: two taps racing count once)
  let isNew = false;
  await ref(`ppriv/${pid}/sgk/${safeKey(v.key)}`).transaction(cur => { if (cur) { isNew = false; return undefined; } isNew = true; return now; });
  if (!isNew) return again();
  pruneKeys(pid, now).catch(() => {});
  const fOpen = await founderOpen(now).catch(() => false);
  let got = null;
  await ref(`pstats/${pid}`).transaction(cur => { got = eventStep(cur, { k: 'sighting', id }, now, { founderOpen: fOpen }); return got ? got.next : undefined; });
  if (!got) return { ok: false, why: 'not_counted' };
  await bumpOwners(got.items, false, got.ach).catch(() => {});
  if (got.next.fd) await ref(`profiles/${pid}/fd`).set(true).catch(() => {});
  const pa = got.next.pa || {};
  return { ok: true, counted: true, n: (pa.sg && pa.sg[id]) || 1, total: pa.sgt || 1, first: got.items.includes(row.card), items: got.items, ach: got.ach, via: v.via };
}

async function pruneKeys(pid, now) {
  const all = (await val(`ppriv/${pid}/sgk`)) || {};
  const gone = {};
  for (const [k, at] of Object.entries(all)) if (!(at > now - KEEP_KEYS_MS)) gone[k] = null;
  if (Object.keys(gone).length) await ref(`ppriv/${pid}/sgk`).update(gone);
}
