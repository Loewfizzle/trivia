// CITY SIGHTINGS (PROGRESSION B — the owner, Nov 2: TAP TO UNLOCK, server-verified, NO HINT EVER) — PURE: no DOM, no clock of its own,
// no database. ONE ROW PER SIGHTING (a future legendary plugs in by its row + its `windows` case below + its id in
// core/achievements.js#LEGENDARIES — docs/progression.md "CITY SIGHTINGS"). The phone claims { id, t (the tap, on the server's clock),
// tz }; /api/profile 'sighting' (api/_lib/sightings.js) gathers what only the server knows (the place by IP, the showcase dial, NOAA's
// Kp, the radio's fired-moment record, the player's rooms + watch start) and asks verifySighting → was it REALLY on screen then?
//   THE TIMETABLE (seeded — the same on every phone in a time zone): the legendaries' showcase list (core/harbor-showcase.js), the ghost
//   ship (Halloween), the aurora (its seeded nights + a real Kp ≥ 7 storm, after dark), the seeded fireball, the balloon flights (the
//   sky scheduler replayed at the place — the ₿ + the skull from each flight's own line-up), THE WATCHER's Blackbird (55 min on the
//   server's clock).
//   THE RADIO (radio/fired/{id}): a moment the OWNER fired for a real audience (EVERYONE, or a room the player is in) counts ONCE A DAY
//   per player; JUST ME (his own preview), a CREW member's moments + every &force= / &lgnow= / the preview panel NEVER count (a force
//   plays only on the phone that asked — the timetable says nothing was there).
import { legendsTonight } from './harbor-showcase.js';
import { UFO_LEN, TR3B_LEN, CHASE, JETS_GONE, eveningOf } from './harbor-legend.js';
import { ghostShipTimes, GHOST_LEN } from './harbor-holiday.js';
import { auroraTonight, stormKp } from './harbor-sky.js';
import { createScheduler, HARBOR_EVENTS, anchorFor } from './harbor-events.js';
import { kindsOf, flightLen } from './harbor-balloon-kinds.js';
import { fireballOf } from './harbor-fireball.js';
import { localParts, sunPosition, placeOf as zonePlace } from './sky.js';
import { localStart } from './harbor-radio.js';

/** THE SIGHTINGS — id (= core/achievements.js#LEGENDARIES), the MATCHED PAIR's names (the card + its emblem — ids final, art THE VAULT's),
 *  the radio jacks that can put it on screen, `kind` (a balloon's line-up kind) */
export const SIGHTINGS = Object.freeze([
  { id: 'ufo', what: 'THE UFO', card: 'card-sg-ufo', emblem: 'emb-sg-ufo', jacks: ['ufo'] },
  { id: 'tr3b', what: 'THE TR-3B', card: 'card-sg-tr3b', emblem: 'emb-sg-tr3b', jacks: ['tr3b'] },
  { id: 'blackbird', what: 'THE BLACKBIRD', card: 'card-sg-blackbird', emblem: 'emb-sg-blackbird', jacks: ['blackbird', 'tr3b'] },
  { id: 'f22', what: 'THE F-22 FLYBY', card: 'card-sg-f22', emblem: 'emb-sg-f22', jacks: ['flyby', 'tr3b'] },
  { id: 'ghostship', what: 'THE GHOST SHIP', card: 'card-sg-ghostship', emblem: 'emb-sg-ghostship', jacks: [] },
  { id: 'aurora', what: 'THE AURORA', card: 'card-sg-aurora', emblem: 'emb-sg-aurora', jacks: [] },
  { id: 'fireball', what: 'THE FIREBALL', card: 'card-sg-fireball', emblem: 'emb-sg-fireball', jacks: [] },
  { id: 'skull', what: 'THE SKULL BALLOON', card: 'card-sg-skull', emblem: 'emb-sg-skull', jacks: ['balloons'], kind: ['skull'] },
  { id: 'btc', what: 'THE ₿ BALLOON', card: 'card-sg-btc', emblem: 'emb-sg-btc', jacks: ['balloons'], kind: ['bitcoin', 'btc-orange'] },
]);
export const SIGHTING = Object.freeze(Object.fromEntries(SIGHTINGS.map(s => [s.id, s])));
export const SIGHTING_IDS = Object.freeze(SIGHTINGS.map(s => s.id));

/** a tap may reach the server this late (a queued claim — /api was down, the phone offline) */
export const QUEUE_MS = 12 * 3600e3;
/** a tap's own lag: the claim's clock vs the server's (ahead), a frame + a finger before the window opens, the fade after it closes */
export const AHEAD_MS = 15e3, LEAD_MS = 3e3, TRAIL_MS = 8e3;
/** the phone's zone vs the IP's: a carrier's IP is often a zone off — further than this and the claim's place is not the player's */
export const ZONE_SLACK_MIN = 60;
/** THE WATCHER's Blackbird: the city open this long on the server's clock (core/harbor-schedule.js 'blackbird.watcher' — 60 visible min) */
export const WATCH_MIN_MS = 55 * 60e3, WATCH_MAX_MS = 6 * 3600e3;
/** the balloons' replay: the scheduler from the local midnight a day back (the scene's own anchor) */
const BALLOON_LOOK_MS = 2 * 3600e3;

const validZone = tz => { try { if (!tz || typeof tz !== 'string' || tz.length > 64) return false; new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; } };
/** the player's local date as a key (the radio's once-a-day) */
export const localDay = (ms, tz) => { const p = localParts(ms, tz); return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`; };

/** the evening a moment belongs to + the absolute ms of its local midnight (for its seeded hours) */
function eveningAt(ms, tz) {
  const lc = localParts(ms, tz), ev = eveningOf(lc);
  return { ev, mid: ms - ev.hr * 3600e3, lc };
}
/** the evenings to look in: the one t belongs to + the one before (a window that began before the evening's turn at noon) */
function evenings(t, tz) {
  const a = eveningAt(t, tz), b = eveningAt(t - 12 * 3600e3, tz);
  return a.ev.y === b.ev.y && a.ev.m === b.ev.m && a.ev.d === b.ev.d ? [a] : [a, b];
}

/**
 * WHERE THE TIMETABLE PUT IT near t → [{ a, b (ms: on screen), key }]. q = { tz, place: { lat, lon } | null, level (the showcase dial),
 * kp (NOAA's 3-hour blocks), watchStart (ms | null) }
 */
export function skyWindows(id, t, q = {}) {
  const tz = q.tz, out = [];
  const place = q.place && Number.isFinite(q.place.lat) ? q.place : zonePlace(tz);
  // (crop: only part of a legendary's run — the F-22s + the Blackbird in the TR-3B's chase, [from, to] s into it)
  const legend = (kind, crop = null) => {
    for (const E of evenings(t, tz)) for (const L of legendsTonight(E.ev.y, E.ev.m, E.ev.d, q.level || undefined)) {
      if (kind !== L.kind) continue;
      const a = E.mid + L.h * 3600e3, len = L.kind === 'ufo' ? UFO_LEN : L.kind === 'tr3b' ? TR3B_LEN : L.len;
      out.push(crop ? { a: a + crop[0] * 1000, b: a + crop[1] * 1000, key: `${L.kind}@${Math.round(a / 1000)}`, via: L.kind }
        : { a, b: a + len * 1000, key: `${L.kind}@${Math.round(a / 1000)}`, via: L.kind });
    }
  };
  const chase = [CHASE.t0 - 4, JETS_GONE + 8];
  switch (id) {
    case 'ufo': legend('ufo'); break;
    case 'tr3b': legend('tr3b'); break;
    // (the F-22s: the flyby + the TR-3B's chase; the Blackbird: its own passes + the one through the TR-3B's chase + THE WATCHER's reward)
    case 'f22': legend('flyby'); legend('tr3b', chase); break;
    case 'blackbird': {
      legend('blackbird'); legend('tr3b', chase);
      const ws = q.watchStart;
      if (ws && t - ws >= WATCH_MIN_MS && t - ws <= WATCH_MAX_MS) out.push({ a: ws + WATCH_MIN_MS, b: ws + WATCH_MAX_MS, key: `watcher@${localDay(t, tz)}`, via: 'watcher' });
      break;
    }
    case 'ghostship': {
      for (const E of evenings(t, tz)) {
        if (!(E.ev.m === 10 && E.ev.d === 31)) continue;
        for (const h of ghostShipTimes(E.ev.y)) { const a = E.mid + h * 3600e3; out.push({ a, b: a + GHOST_LEN * 1000, key: `ghost@${Math.round(a / 1000)}` }); }
      }
      break;
    }
    case 'aurora': {
      // (its seeded nights + a real storm; only while the sun is well down at the place — the city draws it after dark under clear-ish skies:
      // the server can't see the phone's clouds, so a clear sky is taken on trust)
      const E = eveningAt(t, tz), tn = auroraTonight(E.ev, stormKp(q.kp, t));
      if (tn.on && sunPosition(t, place.lat, place.lon).el < -6) out.push({ a: t - 60e3, b: t + 60e3, key: `aurora@${E.ev.y}-${E.ev.m}-${E.ev.d}`, night: true });
      break;
    }
    case 'fireball': {
      for (const E of evenings(t, tz)) {
        const f = fireballOf(E.ev.y, E.ev.m, E.ev.d);
        if (f) { const a = E.mid + f.h * 3600e3; out.push({ a, b: a + f.len * 1000, key: `fireball@${Math.round(a / 1000)}` }); }
      }
      break;
    }
    case 'skull': case 'btc': {
      const want = SIGHTING[id].kind;
      for (const f of balloonFlights(t, tz, place)) {
        if (!kindsOf(f.seed, f.festival).some(k => want.includes(k))) continue;
        out.push({ a: f.start, b: f.start + flightLen(f.seed, f.festival) * 1000, key: `${f.id}@${Math.round(f.start / 1000)}` });
      }
      break;
    }
    default: break;
  }
  return out;
}

/** the balloon flights up at t at a place (the sky scheduler replayed: the same dice as the scene; no helicopter — a patrol only ever
 *  TAKES a slot, so without it the server's flights are a superset; the weather + the festival's showcase gate are the phone's, taken on
 *  trust) → [{ id, start, seed, festival }] */
export function balloonFlights(t, tz, place) {
  const lc = localParts(t, tz), lat = place.lat, lon = place.lon;
  const sch = createScheduler(HARBOR_EVENTS, ms => { const sp = sunPosition(ms, lat, lon); return { ms, force: new Set(), night: sp.el < -6, el: sp.el, az: sp.az, month: new Date(ms).getUTCMonth() + 1, south: lat < 0, heli: () => false }; }, { seed: 1924, anchor: anchorFor(t, lc) });
  const at = sch.at(t);
  return at.recent.filter(r => (r.id === 'balloons' || r.id === 'balloon-festival') && t - r.start < BALLOON_LOOK_MS + 3600e3)
    .map(r => ({ id: r.id, start: r.start, seed: r.seed, festival: r.id === 'balloon-festival' }));
}

/** the radio's moments that put `id` on the player's screen near t → [{ a, b, key, role, sight, aud }] (fired: radio/fired/{id} records) */
export function radioWindows(id, t, fired, { tz, rooms = [] } = {}) {
  const row = SIGHTING[id], out = [];
  if (!row || !row.jacks.length) return out;
  for (const f of fired || []) {
    if (!f || !row.jacks.includes(f.jack)) continue;
    if (f.jack === 'balloons' && !kindsOf(3, false).some(k => (row.kind || []).includes(k))) continue;   // (the radio's flight: scene-radio's seed 3)
    // (AT A TIME: each viewer's own local hour — the record keeps the hour; the start is this player's)
    let a = f.at;
    if (f.local && Number.isFinite(f.local.h)) { const off = localParts(t, tz).off; a = localStart(f.local, f.made || f.at, off); }
    const len = Number.isFinite(f.len) ? f.len * 1000 : Math.max(0, (f.until || f.at) - f.at);
    const reach = f.aud === 'everyone' || (f.aud === 'room' && rooms.includes(f.room)) || f.aud === 'me';
    if (!reach) continue;
    out.push({ a, b: a + len, key: `radio:${f.id || a}`, role: f.role, sight: !!f.sight, aud: f.aud });
  }
  return out;
}

/**
 * IS THE CLAIM TRUE? claim { id, t, tz } · ctx { now, ipTz (the IP's zone | null), place, level, kp, fired, rooms, watchStart } →
 *   { ok: true, via: 'sky' | 'radio', key (one per appearance — the server counts it once), day (the radio's once-a-day key) }
 *   { ok: false, why: 'unknown' | 'future' | 'stale' | 'tz' | 'place' | 'crew' | 'preview' | 'not_on_screen' }
 */
export function verifySighting(claim, ctx = {}) {
  const c = claim || {}, now = ctx.now;
  if (!SIGHTING[c.id]) return { ok: false, why: 'unknown' };
  const t = Number(c.t);
  if (!Number.isFinite(t) || !Number.isFinite(now)) return { ok: false, why: 'stale' };
  if (t > now + AHEAD_MS) return { ok: false, why: 'future' };
  if (now - t > QUEUE_MS) return { ok: false, why: 'stale' };
  if (!validZone(c.tz)) return { ok: false, why: 'tz' };
  if (ctx.ipTz && validZone(ctx.ipTz) && Math.abs(localParts(t, c.tz).off - localParts(t, ctx.ipTz).off) > ZONE_SLACK_MIN) return { ok: false, why: 'place' };
  const inW = w => t >= w.a - LEAD_MS && t <= w.b + TRAIL_MS;
  const sky = skyWindows(c.id, t, { tz: c.tz, place: ctx.place, level: ctx.level, kp: ctx.kp, watchStart: ctx.watchStart }).find(inW);
  if (sky) return { ok: true, via: 'sky', key: `${c.id}:${sky.key}` };
  const radio = radioWindows(c.id, t, ctx.fired, { tz: c.tz, rooms: ctx.rooms || [] }).filter(inW);
  const owner = radio.find(w => w.role === 'owner' && w.sight && w.aud !== 'me');
  if (owner) return { ok: true, via: 'radio', key: `${c.id}:${owner.key}`, day: `radio:${localDay(t, c.tz)}` };
  if (radio.some(w => w.role === 'crew')) return { ok: false, why: 'crew' };
  if (radio.length) return { ok: false, why: 'preview' };
  return { ok: false, why: 'not_on_screen' };
}

/** the album's stamp: the nth sighting in words ("SPOTTED · 4th time") */
export function nth(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`; }
